// Package keeper implements the Correction module's state management.
//
// The keeper handles:
// - Submitting correction reports (negative OTK proposals)
// - Community verification (min 3 verifiers must agree)
// - Contesting reports with counter-evidence
// - Resolving confirmed reports by applying -OTK
// - Reversing wrong determinations through governance
//
// Article V of The Human Constitution: no individual can unilaterally
// assign -OTK. Community consensus is required.

package keeper

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"

	storetypes "cosmossdk.io/store/types"
	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"

	"openchain/x/correction/types"
)

// Store key prefixes for correction data.
var (
	reportPrefix         = []byte("crpt/")  // crpt/{id} -> CorrectionReport
	targetReportPrefix   = []byte("ctgt/")  // ctgt/{target_uid}/{id} -> report ID
	reporterReportPrefix = []byte("crpr/")  // crpr/{reporter_uid}/{id} -> report ID
	pendingReportPrefix  = []byte("cpnd/")  // cpnd/{id} -> report ID (only pending)
	reportCountPrefix    = []byte("ccnt/")  // ccnt/{target_uid} -> count
)

// Keeper manages the Correction module state.
type Keeper struct {
	cdc      codec.Codec
	storeKey storetypes.StoreKey
}

// NewKeeper creates a new Correction keeper.
func NewKeeper(cdc codec.Codec, storeKey storetypes.StoreKey) *Keeper {
	return &Keeper{
		cdc:      cdc,
		storeKey: storeKey,
	}
}

// SubmitReport creates a new correction report. The reporter must have a valid UID.
// The report starts in "reported" status and requires community verification.
func (k Keeper) SubmitReport(ctx sdk.Context, reporterUID, targetUID, channel, description, evidence string, amount int64) (*types.CorrectionReport, error) {
	if reporterUID == "" {
		return nil, fmt.Errorf("reporter UID is required")
	}
	if targetUID == "" {
		return nil, fmt.Errorf("target UID is required")
	}
	if reporterUID == targetUID {
		return nil, fmt.Errorf("cannot submit a correction report against yourself")
	}
	if amount <= 0 {
		return nil, fmt.Errorf("correction amount must be positive")
	}
	if channel == "" {
		return nil, fmt.Errorf("channel is required")
	}

	// Generate deterministic ID
	hash := sha256.Sum256([]byte(fmt.Sprintf("%s:%s:%s:%d:%d", reporterUID, targetUID, channel, amount, ctx.BlockHeight())))
	reportID := fmt.Sprintf("corr_%x", hash[:16])

	report := &types.CorrectionReport{
		ID:            reportID,
		ReporterUID:   reporterUID,
		TargetUID:     targetUID,
		Channel:       channel,
		Description:   description,
		Evidence:      evidence,
		Amount:        amount,
		Status:        types.StatusReported,
		Verifications: []types.Verification{},
		CreatedAt:     ctx.BlockHeight(),
	}

	if err := k.setReport(ctx, report); err != nil {
		return nil, err
	}

	// Index by target, reporter, and pending
	store := ctx.KVStore(k.storeKey)
	store.Set(targetReportKey(targetUID, reportID), []byte(reportID))
	store.Set(reporterReportKey(reporterUID, reportID), []byte(reportID))
	store.Set(pendingReportKey(reportID), []byte(reportID))

	// Increment target report count
	count := k.getReportCount(ctx, targetUID)
	store.Set(reportCountKey(targetUID), int64ToBytes(count+1))

	// Emit event
	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"correction_reported",
		sdk.NewAttribute("report_id", reportID),
		sdk.NewAttribute("reporter_uid", reporterUID),
		sdk.NewAttribute("target_uid", targetUID),
		sdk.NewAttribute("channel", channel),
		sdk.NewAttribute("amount", fmt.Sprintf("%d", amount)),
	))

	return report, nil
}

// VerifyReport allows a verifier to approve or deny a correction report.
// A verifier cannot be the reporter or the target. At least MinVerifiers
// must approve before -OTK can be applied.
func (k Keeper) VerifyReport(ctx sdk.Context, reportID, verifierUID string, approved bool) error {
	report, err := k.GetReport(ctx, reportID)
	if err != nil {
		return err
	}

	// Only reported or contested reports can be verified
	if report.Status != types.StatusReported && report.Status != types.StatusContested && report.Status != types.StatusUnderReview {
		return fmt.Errorf("report %s is in status %s, cannot verify", reportID, report.Status)
	}

	// Verifier cannot be reporter or target
	if verifierUID == report.ReporterUID {
		return fmt.Errorf("reporter cannot verify their own report")
	}
	if verifierUID == report.TargetUID {
		return fmt.Errorf("target cannot verify a report against themselves (use ContestReport instead)")
	}

	// Check for duplicate vote
	if report.HasVerifierVoted(verifierUID) {
		return fmt.Errorf("verifier %s has already voted on report %s", verifierUID, reportID)
	}

	// Add verification
	report.Verifications = append(report.Verifications, types.Verification{
		VerifierUID: verifierUID,
		Approved:    approved,
		BlockHeight: ctx.BlockHeight(),
	})

	// Move to under_review once first verification arrives
	if report.Status == types.StatusReported {
		report.Status = types.StatusUnderReview
	}

	if err := k.setReport(ctx, report); err != nil {
		return err
	}

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"correction_verified",
		sdk.NewAttribute("report_id", reportID),
		sdk.NewAttribute("verifier_uid", verifierUID),
		sdk.NewAttribute("approved", fmt.Sprintf("%t", approved)),
		sdk.NewAttribute("total_verifications", fmt.Sprintf("%d", len(report.Verifications))),
	))

	return nil
}

// ContestReport allows the target of a correction report to contest it
// with counter-evidence. This is a fundamental right per Article V.
func (k Keeper) ContestReport(ctx sdk.Context, reportID, targetUID, contestEvidence string) error {
	report, err := k.GetReport(ctx, reportID)
	if err != nil {
		return err
	}

	if report.TargetUID != targetUID {
		return fmt.Errorf("only the target can contest this report")
	}

	if report.Status == types.StatusConfirmed || report.Status == types.StatusReversed {
		return fmt.Errorf("report %s is already %s, cannot contest", reportID, report.Status)
	}

	report.Status = types.StatusContested
	report.ContestEvidence = contestEvidence

	if err := k.setReport(ctx, report); err != nil {
		return err
	}

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"correction_contested",
		sdk.NewAttribute("report_id", reportID),
		sdk.NewAttribute("target_uid", targetUID),
	))

	return nil
}

// ResolveReport finalizes a report. If enough verifiers confirmed (>= MinVerifiers
// approvals), -OTK is applied to the target's Living Ledger. If denials exceed
// approvals, the report is reversed. Returns whether -OTK was applied.
func (k Keeper) ResolveReport(ctx sdk.Context, reportID string) (applied bool, err error) {
	report, err := k.GetReport(ctx, reportID)
	if err != nil {
		return false, err
	}

	if report.Status == types.StatusConfirmed || report.Status == types.StatusReversed {
		return false, fmt.Errorf("report %s is already resolved (%s)", reportID, report.Status)
	}

	approvals := report.ApprovalCount()
	denials := report.DenialCount()

	if approvals+denials < types.MinVerifiers {
		return false, fmt.Errorf("insufficient verifications: need at least %d, have %d", types.MinVerifiers, approvals+denials)
	}

	// Remove from pending index
	store := ctx.KVStore(k.storeKey)
	store.Delete(pendingReportKey(reportID))

	report.ResolvedAt = ctx.BlockHeight()

	if approvals >= types.MinVerifiers && approvals > denials {
		// Confirmed: -OTK should be applied to target's Living Ledger
		report.Status = types.StatusConfirmed

		if err := k.setReport(ctx, report); err != nil {
			return false, err
		}

		ctx.EventManager().EmitEvent(sdk.NewEvent(
			"correction_confirmed",
			sdk.NewAttribute("report_id", reportID),
			sdk.NewAttribute("target_uid", report.TargetUID),
			sdk.NewAttribute("channel", report.Channel),
			sdk.NewAttribute("negative_otk", fmt.Sprintf("-%d", report.Amount)),
		))

		return true, nil
	}

	// Not enough approvals or denials outweigh — reverse
	report.Status = types.StatusReversed
	if err := k.setReport(ctx, report); err != nil {
		return false, err
	}

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"correction_reversed_on_resolve",
		sdk.NewAttribute("report_id", reportID),
		sdk.NewAttribute("target_uid", report.TargetUID),
		sdk.NewAttribute("approvals", fmt.Sprintf("%d", approvals)),
		sdk.NewAttribute("denials", fmt.Sprintf("%d", denials)),
	))

	return false, nil
}

// ReverseCorrection allows governance to reverse a confirmed correction
// that was determined to be wrong. The -OTK is restored to the target.
func (k Keeper) ReverseCorrection(ctx sdk.Context, reportID, reason string) error {
	report, err := k.GetReport(ctx, reportID)
	if err != nil {
		return err
	}

	if report.Status != types.StatusConfirmed {
		return fmt.Errorf("only confirmed reports can be reversed, current status: %s", report.Status)
	}

	report.Status = types.StatusReversed
	report.ResolvedAt = ctx.BlockHeight()

	if err := k.setReport(ctx, report); err != nil {
		return err
	}

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"correction_reversed",
		sdk.NewAttribute("report_id", reportID),
		sdk.NewAttribute("target_uid", report.TargetUID),
		sdk.NewAttribute("channel", report.Channel),
		sdk.NewAttribute("restored_otk", fmt.Sprintf("%d", report.Amount)),
		sdk.NewAttribute("reason", reason),
	))

	return nil
}

// GetReport retrieves a correction report by ID.
func (k Keeper) GetReport(ctx sdk.Context, reportID string) (*types.CorrectionReport, error) {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get(reportKey(reportID))
	if bz == nil {
		return nil, fmt.Errorf("correction report %s not found", reportID)
	}

	var report types.CorrectionReport
	if err := json.Unmarshal(bz, &report); err != nil {
		return nil, fmt.Errorf("failed to unmarshal report %s: %w", reportID, err)
	}
	return &report, nil
}

// GetReportsByTarget retrieves all correction reports filed against a UID.
func (k Keeper) GetReportsByTarget(ctx sdk.Context, targetUID string) ([]types.CorrectionReport, error) {
	return k.getReportsByPrefix(ctx, append(targetReportPrefix, []byte(targetUID+"/")...))
}

// GetReportsByReporter retrieves all correction reports filed by a UID.
func (k Keeper) GetReportsByReporter(ctx sdk.Context, reporterUID string) ([]types.CorrectionReport, error) {
	return k.getReportsByPrefix(ctx, append(reporterReportPrefix, []byte(reporterUID+"/")...))
}

// GetPendingReports retrieves all reports awaiting resolution.
func (k Keeper) GetPendingReports(ctx sdk.Context) ([]types.CorrectionReport, error) {
	return k.getReportsByPrefix(ctx, pendingReportPrefix)
}

// --- Internal helpers ---

func (k Keeper) setReport(ctx sdk.Context, report *types.CorrectionReport) error {
	store := ctx.KVStore(k.storeKey)
	bz, err := json.Marshal(report)
	if err != nil {
		return fmt.Errorf("failed to marshal report: %w", err)
	}
	store.Set(reportKey(report.ID), bz)
	return nil
}

func (k Keeper) getReportsByPrefix(ctx sdk.Context, prefix []byte) ([]types.CorrectionReport, error) {
	store := ctx.KVStore(k.storeKey)
	var reports []types.CorrectionReport

	iter := store.Iterator(prefix, storetypes.PrefixEndBytes(prefix))
	defer iter.Close()

	for ; iter.Valid(); iter.Next() {
		reportID := string(iter.Value())
		report, err := k.GetReport(ctx, reportID)
		if err != nil {
			continue // skip corrupted entries
		}
		reports = append(reports, *report)
	}

	return reports, nil
}

func (k Keeper) getReportCount(ctx sdk.Context, targetUID string) int64 {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get(reportCountKey(targetUID))
	if bz == nil {
		return 0
	}
	return bytesToInt64(bz)
}

// --- Key construction helpers ---

func reportKey(id string) []byte {
	return append(reportPrefix, []byte(id)...)
}

func targetReportKey(targetUID, id string) []byte {
	return append(targetReportPrefix, []byte(targetUID+"/"+id)...)
}

func reporterReportKey(reporterUID, id string) []byte {
	return append(reporterReportPrefix, []byte(reporterUID+"/"+id)...)
}

func pendingReportKey(id string) []byte {
	return append(pendingReportPrefix, []byte(id)...)
}

func reportCountKey(targetUID string) []byte {
	return append(reportCountPrefix, []byte(targetUID)...)
}

// --- Byte conversion helpers ---

func int64ToBytes(n int64) []byte {
	bz := make([]byte, 8)
	bz[0] = byte(n >> 56)
	bz[1] = byte(n >> 48)
	bz[2] = byte(n >> 40)
	bz[3] = byte(n >> 32)
	bz[4] = byte(n >> 24)
	bz[5] = byte(n >> 16)
	bz[6] = byte(n >> 8)
	bz[7] = byte(n)
	return bz
}

func bytesToInt64(bz []byte) int64 {
	if len(bz) < 8 {
		return 0
	}
	return int64(bz[0])<<56 | int64(bz[1])<<48 | int64(bz[2])<<40 | int64(bz[3])<<32 |
		int64(bz[4])<<24 | int64(bz[5])<<16 | int64(bz[6])<<8 | int64(bz[7])
}
