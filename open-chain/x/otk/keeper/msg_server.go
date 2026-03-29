// Package keeper — Message Server.
//
// Handles OTK transaction messages routed from the Cosmos SDK message router.
// Each handler validates the message, executes the operation via the keeper,
// and returns a response with relevant metadata.

package keeper

import (
	"encoding/json"
	"fmt"

	"cosmossdk.io/math"
	sdk "github.com/cosmos/cosmos-sdk/types"

	"openchain/x/otk/msg"
	"openchain/x/otk/types"
)

// MsgServer implements the OTK module's transaction message handlers.
type MsgServer struct {
	keeper *Keeper
}

// NewMsgServer returns a new MsgServer instance.
func NewMsgServer(k *Keeper) MsgServer {
	return MsgServer{keeper: k}
}

// HandleMsgValueTransfer processes a value transfer between Universal IDs.
func (ms MsgServer) HandleMsgValueTransfer(ctx sdk.Context, m *msg.MsgValueTransfer) error {
	if err := m.ValidateBasic(); err != nil {
		return err
	}

	transfer := types.ValueTransfer{
		FromUID:     m.FromAddress,
		ToUID:       m.ToAddress,
		Channel:     m.Channel,
		Amount:      math.NewInt(m.Amount),
		IsGratitude: m.IsGratitude,
		Positive:    true,
		Memo:        m.Memo,
		Ring:        types.RingSelf,
	}

	if err := ms.keeper.TransferValue(ctx, transfer); err != nil {
		return fmt.Errorf("value transfer failed: %w", err)
	}

	// Record in Living Ledger
	if err := ms.keeper.RecordValueTransfer(ctx, m.FromAddress, m.ToAddress, m.Channel, m.Amount, types.RingSelf, m.IsGratitude); err != nil {
		return fmt.Errorf("ledger update failed: %w", err)
	}

	// Update contribution scores for both parties
	ms.keeper.UpdateScoreIndex(ctx, m.FromAddress)
	ms.keeper.UpdateScoreIndex(ctx, m.ToAddress)

	return nil
}

// HandleMsgMintMilestone processes a milestone mint request from a verifier.
// This submits the milestone to the oracle network for multi-source attestation.
func (ms MsgServer) HandleMsgMintMilestone(ctx sdk.Context, m *msg.MsgMintMilestone) error {
	if err := m.ValidateBasic(); err != nil {
		return err
	}

	// Verify the submitter is a registered, active verifier
	verifier, err := ms.keeper.GetVerifier(ctx, m.Verifier)
	if err != nil {
		return fmt.Errorf("verifier not registered: %w", err)
	}
	if verifier.Status != VerifierActive {
		return fmt.Errorf("verifier %s is not active (status: %s)", m.Verifier, verifier.Status)
	}

	// Generate milestone ID
	milestoneID := fmt.Sprintf("ms_%s_%d", m.UID, ctx.BlockHeight())

	// Submit to oracle network for multi-source attestation
	if err := ms.keeper.SubmitMilestone(ctx, milestoneID, m.UID, m.Channel, m.Description, m.BaseAmount); err != nil {
		return fmt.Errorf("milestone submission failed: %w", err)
	}

	// Auto-attest from this verifier (they're submitting it, so they approve)
	if err := ms.keeper.AttestMilestone(ctx, milestoneID, m.Verifier, true, "submitter-attestation"); err != nil {
		return fmt.Errorf("auto-attestation failed: %w", err)
	}

	return nil
}

// HandleMsgGratitude processes a gratitude transaction.
func (ms MsgServer) HandleMsgGratitude(ctx sdk.Context, m *msg.MsgGratitude) error {
	if err := m.ValidateBasic(); err != nil {
		return err
	}

	_, err := ms.keeper.HandleGratitude(ctx, m.FromAddress, m.ToAddress, m.Channel, m.Amount, m.Message)
	if err != nil {
		return fmt.Errorf("gratitude failed: %w", err)
	}

	return nil
}

// HandleMsgAttestMilestone processes a verifier attestation for a pending milestone.
type MsgAttestMilestone struct {
	VerifierUID string `json:"verifier_uid"`
	MilestoneID string `json:"milestone_id"`
	Approved    bool   `json:"approved"`
	Evidence    string `json:"evidence"`
}

func (ms MsgServer) HandleMsgAttestMilestone(ctx sdk.Context, m *MsgAttestMilestone) error {
	if m.VerifierUID == "" || m.MilestoneID == "" {
		return fmt.Errorf("verifier_uid and milestone_id are required")
	}

	if err := ms.keeper.AttestMilestone(ctx, m.MilestoneID, m.VerifierUID, m.Approved, m.Evidence); err != nil {
		return err
	}

	// Update verifier accuracy after attestation
	ms.keeper.UpdateVerifierAccuracy(ctx, m.MilestoneID)

	return nil
}

// HandleMsgSubmitNeedsAssessment processes a needs assessment submission.
type MsgSubmitNeedsAssessment struct {
	UID    string         `json:"uid"`
	Region string         `json:"region"`
	Scores map[string]int `json:"scores"` // category -> score (1-5)
}

func (ms MsgServer) HandleMsgSubmitNeedsAssessment(ctx sdk.Context, m *MsgSubmitNeedsAssessment) error {
	if m.UID == "" || m.Region == "" {
		return fmt.Errorf("uid and region are required")
	}

	assessment := NeedsAssessment{
		UID:    m.UID,
		Region: m.Region,
		Scores: m.Scores,
	}

	return ms.keeper.SubmitNeedsAssessment(ctx, assessment)
}

// HandleMsgRecordService processes a community service record.
type MsgRecordCommunityService struct {
	VolunteerUID    string  `json:"volunteer_uid"`
	ServiceType     string  `json:"service_type"`
	Hours           float64 `json:"hours"`
	Beneficiaries   int     `json:"beneficiaries"`
	OrganizationUID string  `json:"organization_uid"`
	Description     string  `json:"description"`
}

func (ms MsgServer) HandleMsgRecordCommunityService(ctx sdk.Context, m *MsgRecordCommunityService) error {
	if m.VolunteerUID == "" {
		return fmt.Errorf("volunteer_uid is required")
	}

	service := CommunityService{
		VolunteerUID:       m.VolunteerUID,
		ServiceType:        m.ServiceType,
		HoursServed:        int64(m.Hours),
		BeneficiariesCount: int64(m.Beneficiaries),
		OrganizationUID:    m.OrganizationUID,
		Description:        m.Description,
	}

	return ms.keeper.RecordCommunityService(ctx, service)
}

// HandleMsgRecordEldercare processes an eldercare activity record.
type MsgRecordEldercare struct {
	CaregiverUID string  `json:"caregiver_uid"`
	ElderUID     string  `json:"elder_uid"`
	CareType     string  `json:"care_type"`
	Hours        float64 `json:"hours"`
	Description  string  `json:"description"`
}

func (ms MsgServer) HandleMsgRecordEldercare(ctx sdk.Context, m *MsgRecordEldercare) error {
	if m.CaregiverUID == "" || m.ElderUID == "" {
		return fmt.Errorf("caregiver_uid and elder_uid are required")
	}

	activity := EldercareActivity{
		CaregiverUID: m.CaregiverUID,
		ElderUID:     m.ElderUID,
		CareType:     m.CareType,
		Hours:        int64(m.Hours),
		Description:  m.Description,
	}

	return ms.keeper.RecordEldercareActivity(ctx, activity)
}

// DispatchMsg routes a raw JSON message to the appropriate handler.
func (ms MsgServer) DispatchMsg(ctx sdk.Context, msgType string, data []byte) error {
	switch msgType {
	case "otk/MsgValueTransfer":
		var m msg.MsgValueTransfer
		if err := json.Unmarshal(data, &m); err != nil {
			return err
		}
		return ms.HandleMsgValueTransfer(ctx, &m)

	case "otk/MsgMintMilestone":
		var m msg.MsgMintMilestone
		if err := json.Unmarshal(data, &m); err != nil {
			return err
		}
		return ms.HandleMsgMintMilestone(ctx, &m)

	case "otk/MsgGratitude":
		var m msg.MsgGratitude
		if err := json.Unmarshal(data, &m); err != nil {
			return err
		}
		return ms.HandleMsgGratitude(ctx, &m)

	case "otk/MsgAttestMilestone":
		var m MsgAttestMilestone
		if err := json.Unmarshal(data, &m); err != nil {
			return err
		}
		return ms.HandleMsgAttestMilestone(ctx, &m)

	case "otk/MsgSubmitNeedsAssessment":
		var m MsgSubmitNeedsAssessment
		if err := json.Unmarshal(data, &m); err != nil {
			return err
		}
		return ms.HandleMsgSubmitNeedsAssessment(ctx, &m)

	case "otk/MsgRecordCommunityService":
		var m MsgRecordCommunityService
		if err := json.Unmarshal(data, &m); err != nil {
			return err
		}
		return ms.HandleMsgRecordCommunityService(ctx, &m)

	case "otk/MsgRecordEldercare":
		var m MsgRecordEldercare
		if err := json.Unmarshal(data, &m); err != nil {
			return err
		}
		return ms.HandleMsgRecordEldercare(ctx, &m)

	default:
		return fmt.Errorf("unknown OTK message type: %s", msgType)
	}
}
