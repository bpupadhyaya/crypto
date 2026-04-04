import { fonts } from '../utils/theme';
/**
 * ZK Proof Verification Screen — Article VIII of The Human Constitution.
 *
 * "Every person shall have the right to prove claims about themselves
 * without revealing the underlying data."
 * — Human Constitution, Article VIII
 *
 * Zero-knowledge proofs enable selective disclosure: prove you are over 18
 * without revealing your birthdate, prove citizenship without revealing
 * your passport number, prove income bracket without revealing exact salary.
 *
 * Tabs: my-proofs | generate | verify
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

type TabKey = 'my-proofs' | 'generate' | 'verify';

type ClaimType = 'age' | 'citizenship' | 'income' | 'education' | 'health';

type ProofStatus = 'active' | 'expired' | 'revoked' | 'pending';

interface ZKProof {
  id: string;
  claimType: ClaimType;
  label: string;
  icon: string;
  statement: string;
  status: ProofStatus;
  createdAt: string;
  expiresAt: string;
  verificationCount: number;
  proofHash: string;
}

interface GenerateStep {
  step: 1 | 2 | 3 | 4;
  label: string;
}

const CLAIM_TYPES: { key: ClaimType; label: string; icon: string; description: string }[] = [
  { key: 'age', label: 'Age Verification', icon: '🎂', description: 'Prove you are above a certain age without revealing your birthdate' },
  { key: 'citizenship', label: 'Citizenship', icon: '🌍', description: 'Prove your country of citizenship without revealing passport details' },
  { key: 'income', label: 'Income Bracket', icon: '💰', description: 'Prove your income range without revealing the exact amount' },
  { key: 'education', label: 'Education Level', icon: '🎓', description: 'Prove your highest degree without revealing the institution' },
  { key: 'health', label: 'Health Status', icon: '🏥', description: 'Prove vaccination or health status without revealing medical records' },
];

const CLAIM_OPTIONS: Record<ClaimType, string[]> = {
  age: ['Over 18', 'Over 21', 'Over 25', 'Over 65'],
  citizenship: ['EU Member State', 'G7 Country', 'Asia-Pacific', 'Americas'],
  income: ['Under $25k', '$25k-$50k', '$50k-$100k', 'Over $100k'],
  education: ['High School', 'Bachelor\'s Degree', 'Master\'s Degree', 'Doctoral Degree'],
  health: ['Fully Vaccinated', 'COVID-19 Negative', 'Blood Donor Eligible', 'No Known Allergies'],
};

const GENERATE_STEPS: GenerateStep[] = [
  { step: 1, label: 'Select Claim' },
  { step: 2, label: 'Input Data' },
  { step: 3, label: 'Generate' },
  { step: 4, label: 'Share' },
];

// Demo proofs
const DEMO_PROOFS: ZKProof[] = [
  {
    id: 'zk-001',
    claimType: 'age',
    label: 'Age Verification',
    icon: '🎂',
    statement: 'Holder is over 18 years of age',
    status: 'active',
    createdAt: '2026-03-15T10:30:00Z',
    expiresAt: '2027-03-15T10:30:00Z',
    verificationCount: 12,
    proofHash: 'a1b2c3d4e5f6789012345678abcdef01',
  },
  {
    id: 'zk-002',
    claimType: 'citizenship',
    label: 'Citizenship',
    icon: '🌍',
    statement: 'Holder is a citizen of a G7 country',
    status: 'active',
    createdAt: '2026-03-10T14:00:00Z',
    expiresAt: '2027-03-10T14:00:00Z',
    verificationCount: 5,
    proofHash: 'b2c3d4e5f6789012345678abcdef0102',
  },
  {
    id: 'zk-003',
    claimType: 'education',
    label: 'Education Level',
    icon: '🎓',
    statement: 'Holder has a Master\'s Degree or higher',
    status: 'expired',
    createdAt: '2025-06-01T08:00:00Z',
    expiresAt: '2026-03-01T08:00:00Z',
    verificationCount: 31,
    proofHash: 'c3d4e5f6789012345678abcdef010203',
  },
  {
    id: 'zk-004',
    claimType: 'health',
    label: 'Health Status',
    icon: '🏥',
    statement: 'Holder is fully vaccinated',
    status: 'active',
    createdAt: '2026-02-20T16:45:00Z',
    expiresAt: '2026-08-20T16:45:00Z',
    verificationCount: 8,
    proofHash: 'd4e5f6789012345678abcdef01020304',
  },
  {
    id: 'zk-005',
    claimType: 'income',
    label: 'Income Bracket',
    icon: '💰',
    statement: 'Holder\'s income is in the $50k-$100k range',
    status: 'pending',
    createdAt: '2026-03-27T09:15:00Z',
    expiresAt: '2027-03-27T09:15:00Z',
    verificationCount: 0,
    proofHash: 'e5f6789012345678abcdef0102030405',
  },
];

const STATUS_COLORS: Record<ProofStatus, string> = {
  active: '#4caf50',
  expired: '#9e9e9e',
  revoked: '#f44336',
  pending: '#ff9800',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function ZKProofScreen({ onClose }: Props) {
  const t = useTheme();
  const { demoMode } = useWalletStore();
  const [activeTab, setActiveTab] = useState<TabKey>('my-proofs');

  // My Proofs state
  const [proofs] = useState<ZKProof[]>(DEMO_PROOFS);

  // Generate state
  const [genStep, setGenStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedClaim, setSelectedClaim] = useState<ClaimType | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedHash, setGeneratedHash] = useState<string | null>(null);

  // Verify state
  const [verifyInput, setVerifyInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<'valid' | 'invalid' | null>(null);

  // Privacy meter
  const activeProofs = proofs.filter((p) => p.status === 'active').length;
  const totalClaimTypes = CLAIM_TYPES.length;
  const privacyPercentage = Math.round((activeProofs / totalClaimTypes) * 100);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    demoTag: { backgroundColor: t.accent.yellow + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'center', marginBottom: 16 },
    demoText: { color: t.accent.yellow, fontSize: 12, fontWeight: fonts.bold },
    tabRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: t.bg.card, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: 13, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    // Privacy meter
    privacyCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginBottom: 20 },
    privacyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    privacyTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    privacyPct: { fontSize: 24, fontWeight: fonts.heavy },
    privacyBarBg: { height: 8, backgroundColor: t.border, borderRadius: 4, overflow: 'hidden' },
    privacyBarFill: { height: 8, borderRadius: 4, backgroundColor: t.accent.green },
    privacyLabel: { color: t.text.muted, fontSize: 12, marginTop: 8 },
    // Proof cards
    proofCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    proofTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    proofIcon: { fontSize: 28, marginRight: 12 },
    proofInfo: { flex: 1 },
    proofLabel: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    proofStatement: { color: t.text.secondary, fontSize: 13, marginTop: 2 },
    proofStatusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
    proofStatusText: { color: '#fff', fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase' },
    proofMeta: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: t.border, paddingTop: 10 },
    proofMetaItem: { alignItems: 'center', flex: 1 },
    proofMetaLabel: { color: t.text.muted, fontSize: 10, fontWeight: fonts.semibold, textTransform: 'uppercase', letterSpacing: 0.5 },
    proofMetaValue: { color: t.text.primary, fontSize: 13, fontWeight: fonts.bold, marginTop: 2 },
    proofHash: { color: t.text.muted, fontSize: 11, fontFamily: 'monospace', marginTop: 8 },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40, lineHeight: 22 },
    // Generate wizard
    stepRow: { flexDirection: 'row', gap: 6, marginBottom: 24, alignItems: 'center' },
    stepDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    stepDotActive: { backgroundColor: t.accent.blue },
    stepDotDone: { backgroundColor: t.accent.green },
    stepDotPending: { backgroundColor: t.border },
    stepDotText: { color: '#fff', fontSize: 12, fontWeight: fonts.heavy },
    stepLine: { flex: 1, height: 2, backgroundColor: t.border },
    stepLineDone: { backgroundColor: t.accent.green },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.heavy, marginBottom: 12 },
    sectionSubtitle: { color: t.text.secondary, fontSize: 13, lineHeight: 20, marginBottom: 16 },
    claimCard: { backgroundColor: t.bg.card, borderRadius: 12, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
    claimCardSelected: { borderWidth: 2, borderColor: t.accent.blue },
    claimIcon: { fontSize: 28, marginRight: 14 },
    claimInfo: { flex: 1 },
    claimLabel: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    claimDesc: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    optionBtn: { backgroundColor: t.bg.card, borderRadius: 10, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 8 },
    optionBtnSelected: { borderWidth: 2, borderColor: t.accent.blue },
    optionText: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    optionTextSelected: { color: t.accent.blue },
    nextBtn: { backgroundColor: t.accent.blue, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
    nextBtnDisabled: { opacity: 0.4 },
    nextBtnText: { color: '#fff', fontSize: 16, fontWeight: fonts.bold },
    generateCard: { backgroundColor: t.accent.blue + '10', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20 },
    genIcon: { fontSize: 48, marginBottom: 12 },
    genTitle: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy, marginBottom: 8 },
    genSubtitle: { color: t.text.secondary, fontSize: 13, textAlign: 'center', lineHeight: 20 },
    successCard: { backgroundColor: t.accent.green + '10', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20 },
    successIcon: { fontSize: 48, marginBottom: 12 },
    successTitle: { color: t.accent.green, fontSize: 18, fontWeight: fonts.heavy, marginBottom: 8 },
    successSubtitle: { color: t.text.secondary, fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 12 },
    hashBox: { backgroundColor: t.bg.card, borderRadius: 10, padding: 12, width: '100%', marginBottom: 16 },
    hashLabel: { color: t.text.muted, fontSize: 10, fontWeight: fonts.semibold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    hashValue: { color: t.text.primary, fontSize: 12, fontFamily: 'monospace' },
    shareBtn: { backgroundColor: t.accent.blue, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, marginBottom: 10 },
    shareBtnText: { color: '#fff', fontSize: 14, fontWeight: fonts.bold },
    resetBtn: { paddingVertical: 10 },
    resetBtnText: { color: t.accent.blue, fontSize: 14, fontWeight: fonts.semibold },
    // Verify
    verifyCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginBottom: 20 },
    verifyTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.heavy, marginBottom: 8 },
    verifyDesc: { color: t.text.secondary, fontSize: 13, lineHeight: 20, marginBottom: 16 },
    verifyInput: { backgroundColor: t.bg.primary, borderRadius: 10, padding: 14, color: t.text.primary, fontSize: 14, fontFamily: 'monospace', minHeight: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: t.border },
    verifyBtn: { backgroundColor: t.accent.blue, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
    verifyBtnText: { color: '#fff', fontSize: 16, fontWeight: fonts.bold },
    resultCard: { borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20 },
    resultIcon: { fontSize: 48, marginBottom: 12 },
    resultTitle: { fontSize: 18, fontWeight: fonts.heavy, marginBottom: 8 },
    resultSubtitle: { color: t.text.secondary, fontSize: 13, textAlign: 'center', lineHeight: 20 },
    // History section in my-proofs
    historyTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.heavy, marginTop: 20, marginBottom: 12 },
    historyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.bg.card, borderRadius: 10, padding: 12, marginBottom: 8 },
    historyIcon: { fontSize: 20, marginRight: 10 },
    historyInfo: { flex: 1 },
    historyAction: { color: t.text.primary, fontSize: 13, fontWeight: fonts.semibold },
    historyTime: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    historyCount: { color: t.accent.blue, fontSize: 13, fontWeight: fonts.bold },
    constitutionLink: { color: t.accent.blue, fontSize: 13, fontWeight: fonts.semibold, textAlign: 'center', marginTop: 20, marginBottom: 20 },
  }), [t]);

  // ------ Handlers ------

  const handleGenerate = useCallback(async () => {
    if (!selectedClaim || !selectedOption) return;
    setGenerating(true);
    // Simulate ZK proof generation
    await new Promise((r) => setTimeout(r, 2000));
    const ts = Date.now();
    const data = `${selectedClaim}:${selectedOption}:${ts}`;
    // Simple hash simulation (in production this would be a real ZK-SNARK)
    let hash = '';
    for (let i = 0; i < 64; i++) {
      hash += Math.floor(Math.random() * 16).toString(16);
    }
    setGeneratedHash(hash);
    setGenerating(false);
    setGenStep(4);
  }, [selectedClaim, selectedOption]);

  const handleShare = useCallback(() => {
    Alert.alert(
      'Proof Shared',
      `Your ZK proof has been shared.\n\nProof Hash:\n${generatedHash?.slice(0, 32)}...\n\nThe verifier can confirm your claim without seeing your underlying data.`,
    );
  }, [generatedHash]);

  const handleVerify = useCallback(async () => {
    if (!verifyInput.trim()) return;
    setVerifying(true);
    setVerifyResult(null);
    await new Promise((r) => setTimeout(r, 1500));
    // Demo: accept known hashes or hashes of length >= 32
    const knownHashes = DEMO_PROOFS.map((p) => p.proofHash);
    const trimmed = verifyInput.trim().toLowerCase();
    const isValid = knownHashes.some((h) => trimmed.includes(h)) || trimmed.length >= 32;
    setVerifyResult(isValid ? 'valid' : 'invalid');
    setVerifying(false);
  }, [verifyInput]);

  const resetGenerate = useCallback(() => {
    setGenStep(1);
    setSelectedClaim(null);
    setSelectedOption(null);
    setGeneratedHash(null);
    setGenerating(false);
  }, []);

  // ------ Tabs ------

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'my-proofs', label: 'My Proofs' },
    { key: 'generate', label: 'Generate' },
    { key: 'verify', label: 'Verify' },
  ];

  // ------ Render helpers ------

  const renderMyProofs = () => (
    <>
      {/* Privacy Meter */}
      <View style={s.privacyCard}>
        <View style={s.privacyHeader}>
          <Text style={s.privacyTitle}>Privacy Shield</Text>
          <Text style={[s.privacyPct, { color: t.accent.green }]}>{privacyPercentage}%</Text>
        </View>
        <View style={s.privacyBarBg}>
          <View style={[s.privacyBarFill, { width: `${privacyPercentage}%` }]} />
        </View>
        <Text style={s.privacyLabel}>
          {activeProofs} of {totalClaimTypes} claim types protected by ZK proofs
        </Text>
      </View>

      {/* Proof Gallery */}
      {proofs.map((proof) => (
        <View key={proof.id} style={s.proofCard}>
          <View style={s.proofTop}>
            <Text style={s.proofIcon}>{proof.icon}</Text>
            <View style={s.proofInfo}>
              <Text style={s.proofLabel}>{proof.label}</Text>
              <Text style={s.proofStatement}>{proof.statement}</Text>
            </View>
            <View style={[s.proofStatusBadge, { backgroundColor: STATUS_COLORS[proof.status] }]}>
              <Text style={s.proofStatusText}>{proof.status}</Text>
            </View>
          </View>
          <View style={s.proofMeta}>
            <View style={s.proofMetaItem}>
              <Text style={s.proofMetaLabel}>Created</Text>
              <Text style={s.proofMetaValue}>{formatDate(proof.createdAt)}</Text>
            </View>
            <View style={s.proofMetaItem}>
              <Text style={s.proofMetaLabel}>Expires</Text>
              <Text style={s.proofMetaValue}>{formatDate(proof.expiresAt)}</Text>
            </View>
            <View style={s.proofMetaItem}>
              <Text style={s.proofMetaLabel}>Verified</Text>
              <Text style={s.proofMetaValue}>{proof.verificationCount}x</Text>
            </View>
          </View>
          <Text style={s.proofHash}>Hash: {proof.proofHash.slice(0, 16)}...{proof.proofHash.slice(-8)}</Text>
        </View>
      ))}

      {/* Proof History */}
      <Text style={s.historyTitle}>Recent Verification Activity</Text>
      {[
        { icon: '✓', action: 'Age proof verified by Service A', time: '2 hours ago', count: '+1' },
        { icon: '✓', action: 'Citizenship proof verified by Gov Portal', time: '1 day ago', count: '+1' },
        { icon: '↻', action: 'Education proof expired — renew now', time: '3 days ago', count: '' },
        { icon: '✓', action: 'Health proof verified by Travel Agency', time: '5 days ago', count: '+1' },
      ].map((item, idx) => (
        <View key={idx} style={s.historyRow}>
          <Text style={s.historyIcon}>{item.icon}</Text>
          <View style={s.historyInfo}>
            <Text style={s.historyAction}>{item.action}</Text>
            <Text style={s.historyTime}>{item.time}</Text>
          </View>
          {item.count ? <Text style={s.historyCount}>{item.count}</Text> : null}
        </View>
      ))}
    </>
  );

  const renderGenerate = () => {
    // Step indicator
    const stepIndicator = (
      <View style={s.stepRow}>
        {GENERATE_STEPS.map((gs, idx) => {
          const isDone = genStep > gs.step;
          const isActive = genStep === gs.step;
          return (
            <React.Fragment key={gs.step}>
              <View style={[
                s.stepDot,
                isDone ? s.stepDotDone : isActive ? s.stepDotActive : s.stepDotPending,
              ]}>
                <Text style={s.stepDotText}>{isDone ? '✓' : gs.step}</Text>
              </View>
              {idx < GENERATE_STEPS.length - 1 && (
                <View style={[s.stepLine, isDone ? s.stepLineDone : null]} />
              )}
            </React.Fragment>
          );
        })}
      </View>
    );

    if (genStep === 1) {
      return (
        <>
          {stepIndicator}
          <Text style={s.sectionTitle}>Select Claim Type</Text>
          <Text style={s.sectionSubtitle}>
            Choose what you want to prove. Your underlying data never leaves your device.
          </Text>
          {CLAIM_TYPES.map((ct) => (
            <TouchableOpacity
              key={ct.key}
              style={[s.claimCard, selectedClaim === ct.key && s.claimCardSelected]}
              onPress={() => setSelectedClaim(ct.key)}
            >
              <Text style={s.claimIcon}>{ct.icon}</Text>
              <View style={s.claimInfo}>
                <Text style={s.claimLabel}>{ct.label}</Text>
                <Text style={s.claimDesc}>{ct.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[s.nextBtn, !selectedClaim && s.nextBtnDisabled]}
            onPress={() => selectedClaim && setGenStep(2)}
            disabled={!selectedClaim}
          >
            <Text style={s.nextBtnText}>Next</Text>
          </TouchableOpacity>
        </>
      );
    }

    if (genStep === 2 && selectedClaim) {
      const options = CLAIM_OPTIONS[selectedClaim];
      return (
        <>
          {stepIndicator}
          <Text style={s.sectionTitle}>Select Your Claim</Text>
          <Text style={s.sectionSubtitle}>
            Choose the statement you want to prove. The proof will confirm this without revealing your actual data.
          </Text>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[s.optionBtn, selectedOption === opt && s.optionBtnSelected]}
              onPress={() => setSelectedOption(opt)}
            >
              <Text style={[s.optionText, selectedOption === opt && s.optionTextSelected]}>{opt}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[s.nextBtn, !selectedOption && s.nextBtnDisabled]}
            onPress={() => selectedOption && setGenStep(3)}
            disabled={!selectedOption}
          >
            <Text style={s.nextBtnText}>Next</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.resetBtn} onPress={() => { setGenStep(1); setSelectedOption(null); }}>
            <Text style={s.resetBtnText}>Back</Text>
          </TouchableOpacity>
        </>
      );
    }

    if (genStep === 3) {
      return (
        <>
          {stepIndicator}
          <View style={s.generateCard}>
            <Text style={s.genIcon}>🔐</Text>
            <Text style={s.genTitle}>Generate ZK Proof</Text>
            <Text style={s.genSubtitle}>
              Claim: {selectedOption}{'\n'}
              Type: {CLAIM_TYPES.find((c) => c.key === selectedClaim)?.label}{'\n\n'}
              A zero-knowledge proof will be computed on your device. No data is transmitted.
            </Text>
          </View>
          <TouchableOpacity
            style={s.nextBtn}
            onPress={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.nextBtnText}>Generate Proof</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={s.resetBtn} onPress={() => setGenStep(2)}>
            <Text style={s.resetBtnText}>Back</Text>
          </TouchableOpacity>
        </>
      );
    }

    if (genStep === 4 && generatedHash) {
      return (
        <>
          {stepIndicator}
          <View style={s.successCard}>
            <Text style={s.successIcon}>✅</Text>
            <Text style={s.successTitle}>Proof Generated</Text>
            <Text style={s.successSubtitle}>
              Your ZK proof for "{selectedOption}" is ready.{'\n'}
              Share it with anyone who needs to verify your claim.
            </Text>
            <View style={s.hashBox}>
              <Text style={s.hashLabel}>Proof Hash</Text>
              <Text style={s.hashValue}>{generatedHash}</Text>
            </View>
            <TouchableOpacity style={s.shareBtn} onPress={handleShare}>
              <Text style={s.shareBtnText}>Share Proof</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.resetBtn} onPress={resetGenerate}>
              <Text style={s.resetBtnText}>Generate Another</Text>
            </TouchableOpacity>
          </View>
        </>
      );
    }

    return null;
  };

  const renderVerify = () => (
    <>
      <View style={s.verifyCard}>
        <Text style={s.verifyTitle}>Verify a ZK Proof</Text>
        <Text style={s.verifyDesc}>
          Paste a proof hash to verify someone else's claim. The verification confirms
          the statement is true without revealing any underlying data.
        </Text>
        <TextInput
          style={s.verifyInput}
          placeholder="Paste proof hash here..."
          placeholderTextColor={t.text.muted}
          value={verifyInput}
          onChangeText={(text) => { setVerifyInput(text); setVerifyResult(null); }}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[s.verifyBtn, !verifyInput.trim() && s.nextBtnDisabled]}
          onPress={handleVerify}
          disabled={!verifyInput.trim() || verifying}
        >
          {verifying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.verifyBtnText}>Verify Proof</Text>
          )}
        </TouchableOpacity>
      </View>

      {verifyResult === 'valid' && (
        <View style={[s.resultCard, { backgroundColor: t.accent.green + '10' }]}>
          <Text style={s.resultIcon}>✅</Text>
          <Text style={[s.resultTitle, { color: t.accent.green }]}>Proof Valid</Text>
          <Text style={s.resultSubtitle}>
            The cryptographic proof is valid. The claim is confirmed without revealing any personal data.
          </Text>
        </View>
      )}

      {verifyResult === 'invalid' && (
        <View style={[s.resultCard, { backgroundColor: '#f4433610' }]}>
          <Text style={s.resultIcon}>❌</Text>
          <Text style={[s.resultTitle, { color: '#f44336' }]}>Proof Invalid</Text>
          <Text style={s.resultSubtitle}>
            This proof could not be verified. It may be expired, revoked, or tampered with.
          </Text>
        </View>
      )}

      {/* How ZK Proofs Work */}
      <View style={s.verifyCard}>
        <Text style={s.verifyTitle}>How Zero-Knowledge Proofs Work</Text>
        {[
          { icon: '🔒', title: 'Privacy', desc: 'The prover reveals NOTHING about their data — only that a statement is true.' },
          { icon: '🧮', title: 'Math, Not Trust', desc: 'Verification is purely mathematical. No trusted third party needed.' },
          { icon: '⚡', title: 'Instant', desc: 'Proofs are verified in milliseconds, no matter how complex the underlying data.' },
          { icon: '🌐', title: 'Universal', desc: 'Any verifier can check the proof — no special access or credentials required.' },
        ].map((item, idx) => (
          <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: idx < 3 ? 14 : 0 }}>
            <Text style={{ fontSize: 22, marginRight: 12, marginTop: 2 }}>{item.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.text.primary, fontSize: 14, fontWeight: fonts.bold, marginBottom: 2 }}>{item.title}</Text>
              <Text style={{ color: t.text.secondary, fontSize: 13, lineHeight: 20 }}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>ZK Proofs</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {demoMode && (
          <View style={s.demoTag}>
            <Text style={s.demoText}>DEMO DATA</Text>
          </View>
        )}

        {/* Tab bar */}
        <View style={s.tabRow}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[s.tab, activeTab === tab.key && s.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'my-proofs' && renderMyProofs()}
        {activeTab === 'generate' && renderGenerate()}
        {activeTab === 'verify' && renderVerify()}

        <Text style={s.constitutionLink}>
          Article VIII — The Human Constitution
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
