import { fonts } from '../utils/theme';
/**
 * Correction Screen — Article V of The Human Constitution.
 *
 * "Negative OTK (-OTK) represents harm done."
 *
 * Features:
 * - Submit correction report: target UID, channel, description, evidence
 * - View reports against you (with option to contest)
 * - View reports you've submitted
 * - For verifiers: pending reports to review
 * - Status tracking (reported -> under_review -> confirmed/reversed)
 * - Warning: false reports negatively impact reputation
 * - Demo mode with sample reports
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

interface Verification {
  verifierUID: string;
  approved: boolean;
  blockHeight: number;
}

interface CorrectionReport {
  id: string;
  reporterUID: string;
  targetUID: string;
  channel: string;
  description: string;
  evidence: string;
  amount: number;
  status: 'reported' | 'under_review' | 'contested' | 'confirmed' | 'reversed';
  verifications: Verification[];
  contestEvidence: string;
  createdAt: string;
  resolvedAt?: string;
}

type CorrectionView = 'tabs' | 'submit' | 'detail' | 'verify-detail';

const CHANNELS = ['nurture', 'education', 'health', 'community', 'economic', 'governance'];

const CHANNEL_META: Record<string, { label: string; icon: string; color: string }> = {
  nurture:    { label: 'Nurture',    icon: '\u{1F49B}', color: '#ef4444' },
  education:  { label: 'Education',  icon: '\u{1F4DA}', color: '#3b82f6' },
  health:     { label: 'Health',     icon: '\u{1FA7A}', color: '#22c55e' },
  community:  { label: 'Community',  icon: '\u{1F91D}', color: '#8b5cf6' },
  economic:   { label: 'Economic',   icon: '\u{1F4B0}', color: '#f7931a' },
  governance: { label: 'Governance', icon: '\u{1F5F3}', color: '#eab308' },
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  reported:     { label: 'Reported',     color: '#f59e0b' },
  under_review: { label: 'Under Review', color: '#3b82f6' },
  contested:    { label: 'Contested',    color: '#8b5cf6' },
  confirmed:    { label: 'Confirmed',    color: '#ef4444' },
  reversed:     { label: 'Reversed',     color: '#22c55e' },
};

const DEMO_MY_UID = 'uid-a83f-demo';

const DEMO_REPORTS_AGAINST_ME: CorrectionReport[] = [
  {
    id: 'corr-001', reporterUID: 'uid-7b2c-reporter1', targetUID: DEMO_MY_UID,
    channel: 'community', description: 'Failed to fulfill volunteer commitment at local food bank — 3 consecutive no-shows after signing up.',
    evidence: 'sha256:abc123...evidence_hash', amount: 25,
    status: 'under_review',
    verifications: [
      { verifierUID: 'uid-v001', approved: true, blockHeight: 1200 },
      { verifierUID: 'uid-v002', approved: true, blockHeight: 1205 },
    ],
    contestEvidence: '', createdAt: '2026-03-20 10:00',
  },
  {
    id: 'corr-003', reporterUID: 'uid-4e9a-reporter2', targetUID: DEMO_MY_UID,
    channel: 'education', description: 'Plagiarized content in a community education workshop.',
    evidence: 'sha256:def456...evidence_hash', amount: 50,
    status: 'reversed',
    verifications: [
      { verifierUID: 'uid-v003', approved: false, blockHeight: 1100 },
      { verifierUID: 'uid-v004', approved: false, blockHeight: 1110 },
      { verifierUID: 'uid-v005', approved: false, blockHeight: 1115 },
    ],
    contestEvidence: 'sha256:contest_proof_original_work', createdAt: '2026-03-15 08:30', resolvedAt: '2026-03-18 12:00',
  },
];

const DEMO_MY_SUBMITTED: CorrectionReport[] = [
  {
    id: 'corr-010', reporterUID: DEMO_MY_UID, targetUID: 'uid-c12d-target1',
    channel: 'health', description: 'Distributed unverified health supplements in community wellness event, causing adverse reactions.',
    evidence: 'sha256:ghi789...evidence_hash', amount: 100,
    status: 'confirmed',
    verifications: [
      { verifierUID: 'uid-v010', approved: true, blockHeight: 1050 },
      { verifierUID: 'uid-v011', approved: true, blockHeight: 1055 },
      { verifierUID: 'uid-v012', approved: true, blockHeight: 1060 },
    ],
    contestEvidence: '', createdAt: '2026-03-10 14:00', resolvedAt: '2026-03-14 16:00',
  },
];

const DEMO_PENDING_VERIFY: CorrectionReport[] = [
  {
    id: 'corr-020', reporterUID: 'uid-f1a2-reporter3', targetUID: 'uid-b3c4-target2',
    channel: 'nurture', description: 'Neglected childcare duties as registered caretaker, multiple verified incidents over 2 months.',
    evidence: 'sha256:jkl012...evidence_hash', amount: 200,
    status: 'reported',
    verifications: [
      { verifierUID: 'uid-v020', approved: true, blockHeight: 1300 },
    ],
    contestEvidence: '', createdAt: '2026-03-25 09:00',
  },
  {
    id: 'corr-021', reporterUID: 'uid-d5e6-reporter4', targetUID: 'uid-g7h8-target3',
    channel: 'economic', description: 'Fraudulent marketplace listing — sold counterfeit goods using Open Chain escrow.',
    evidence: 'sha256:mno345...evidence_hash', amount: 500,
    status: 'contested',
    verifications: [],
    contestEvidence: 'sha256:counter_evidence_authentic_goods',
    createdAt: '2026-03-24 11:00',
  },
];

type Tab = 'against-me' | 'my-reports' | 'verify';

export function CorrectionScreen({ onClose }: Props) {
  const { demoMode } = useWalletStore();
  const t = useTheme();

  const [corrView, setCorrView] = useState<CorrectionView>('tabs');
  const [activeTab, setActiveTab] = useState<Tab>('against-me');
  const [selectedReport, setSelectedReport] = useState<CorrectionReport | null>(null);

  // Submit form state
  const [targetUID, setTargetUID] = useState('');
  const [channel, setChannel] = useState('');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Contest form
  const [contestEvidence, setContestEvidence] = useState('');

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 8 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.bold },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { flex: 1, paddingHorizontal: 16 },
    tabRow: { flexDirection: 'row', marginBottom: 16, gap: 6 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: t.bg.card, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    card: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    cardTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold, marginBottom: 4 },
    cardDesc: { color: t.text.secondary, fontSize: 13, lineHeight: 19, marginBottom: 8 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 8 },
    statusText: { fontSize: 11, fontWeight: fonts.bold, color: '#fff' },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    label: { color: t.text.muted, fontSize: 12 },
    val: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.semibold },
    negOTK: { color: t.accent.red, fontSize: 16, fontWeight: fonts.heavy },
    channelChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 8 },
    channelText: { fontSize: 11, fontWeight: fonts.bold, color: '#fff' },
    warning: { backgroundColor: t.accent.red + '15', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: t.accent.red + '30' },
    warningText: { color: t.accent.red, fontSize: 13, lineHeight: 19, fontWeight: fonts.semibold },
    input: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 14, marginBottom: 12, borderWidth: 1, borderColor: t.border },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: fonts.semibold, marginBottom: 6 },
    channelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
    channelBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: t.bg.card, borderWidth: 1, borderColor: t.border },
    channelBtnActive: { borderColor: t.accent.blue, backgroundColor: t.accent.blue + '20' },
    channelBtnText: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.semibold },
    channelBtnTextActive: { color: t.accent.blue },
    submitBtn: { backgroundColor: t.accent.red, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8, marginBottom: 20 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: fonts.bold },
    contestBtn: { backgroundColor: t.accent.purple, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 10 },
    contestBtnText: { color: '#fff', fontSize: 14, fontWeight: fonts.bold },
    verifyRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
    approveBtn: { flex: 1, backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    denyBtn: { flex: 1, backgroundColor: t.accent.red, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    btnText: { color: '#fff', fontSize: 14, fontWeight: fonts.bold },
    empty: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40 },
    backBtn: { paddingVertical: 16, alignItems: 'center' },
    backText: { color: t.accent.blue, fontSize: 16 },
    divider: { height: 1, backgroundColor: t.border, marginVertical: 10 },
    verificationItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    verifierLabel: { color: t.text.muted, fontSize: 11 },
    verifierResult: { fontSize: 11, fontWeight: fonts.bold },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 12, marginBottom: 6 },
  }), [t]);

  const reportsAgainstMe = demoMode ? DEMO_REPORTS_AGAINST_ME : [];
  const mySubmitted = demoMode ? DEMO_MY_SUBMITTED : [];
  const pendingVerify = demoMode ? DEMO_PENDING_VERIFY : [];

  const handleSubmit = useCallback(() => {
    if (!targetUID.trim() || !channel || !description.trim() || !amount.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    const amtNum = parseInt(amount, 10);
    if (isNaN(amtNum) || amtNum <= 0) {
      Alert.alert('Invalid Amount', 'Amount must be a positive number.');
      return;
    }

    Alert.alert(
      'Confirm Correction Report',
      `You are proposing -${amtNum} OTK against ${targetUID} in the ${channel} channel.\n\nFalse reports will negatively impact YOUR reputation. Proceed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Report', style: 'destructive', onPress: () => {
            setSubmitting(true);
            setTimeout(() => {
              setSubmitting(false);
              Alert.alert('Report Submitted', 'Your correction report has been submitted for community verification. Minimum 3 verifiers must review before any -OTK is applied.');
              setCorrView('tabs');
              setTargetUID(''); setChannel(''); setDescription(''); setEvidence(''); setAmount('');
            }, 1500);
          },
        },
      ],
    );
  }, [targetUID, channel, description, evidence, amount]);

  const handleContest = useCallback((report: CorrectionReport) => {
    if (!contestEvidence.trim()) {
      Alert.alert('Evidence Required', 'Please provide counter-evidence to contest this report.');
      return;
    }
    Alert.alert('Contest Submitted', 'Your counter-evidence has been submitted. Verifiers will review both sides before making a determination.');
    setCorrView('tabs');
    setContestEvidence('');
  }, [contestEvidence]);

  const handleVerify = useCallback((report: CorrectionReport, approved: boolean) => {
    const action = approved ? 'approve' : 'deny';
    Alert.alert(
      `Confirm ${approved ? 'Approval' : 'Denial'}`,
      `You are about to ${action} correction report ${report.id}. This action is permanent.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: approved ? 'Approve' : 'Deny',
          style: approved ? 'default' : 'destructive',
          onPress: () => {
            Alert.alert('Vote Recorded', `Your ${action} has been recorded. ${3 - report.verifications.length - 1} more verifications needed.`);
            setCorrView('tabs');
          },
        },
      ],
    );
  }, []);

  // --- Submit Form ---
  if (corrView === 'submit') {
    return (
      <SafeAreaView style={st.container}>
        <View style={st.header}>
          <Text style={st.title}>Submit Correction</Text>
          <TouchableOpacity onPress={() => setCorrView('tabs')}>
            <Text style={st.closeBtn}>Cancel</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={st.scroll}>
          <View style={st.warning}>
            <Text style={st.warningText}>
              WARNING: False or malicious reports will negatively impact your reputation and may result in -OTK being applied to YOUR Living Ledger. Only submit reports with verifiable evidence.
            </Text>
          </View>

          <Text style={st.inputLabel}>Target UID *</Text>
          <TextInput style={st.input} placeholder="uid-xxxx-..." placeholderTextColor={t.text.muted}
            value={targetUID} onChangeText={setTargetUID} autoCapitalize="none" />

          <Text style={st.inputLabel}>Channel *</Text>
          <View style={st.channelRow}>
            {CHANNELS.map(ch => {
              const meta = CHANNEL_META[ch];
              const active = channel === ch;
              return (
                <TouchableOpacity key={ch} style={[st.channelBtn, active && st.channelBtnActive]}
                  onPress={() => setChannel(ch)}>
                  <Text style={[st.channelBtnText, active && st.channelBtnTextActive]}>
                    {meta?.icon} {meta?.label || ch}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={st.inputLabel}>Description *</Text>
          <TextInput style={[st.input, { minHeight: 80, textAlignVertical: 'top' }]} placeholder="Describe the negative outcome..."
            placeholderTextColor={t.text.muted} value={description} onChangeText={setDescription}
            multiline numberOfLines={4} />

          <Text style={st.inputLabel}>Evidence Hash</Text>
          <TextInput style={st.input} placeholder="sha256:..." placeholderTextColor={t.text.muted}
            value={evidence} onChangeText={setEvidence} autoCapitalize="none" />

          <Text style={st.inputLabel}>Proposed -OTK Amount *</Text>
          <TextInput style={st.input} placeholder="Amount" placeholderTextColor={t.text.muted}
            value={amount} onChangeText={setAmount} keyboardType="numeric" />

          <TouchableOpacity style={st.submitBtn} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={st.submitBtnText}>Submit Correction Report</Text>}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- Report Detail (against me) ---
  if (corrView === 'detail' && selectedReport) {
    const meta = STATUS_META[selectedReport.status];
    const chMeta = CHANNEL_META[selectedReport.channel];
    const canContest = selectedReport.status === 'reported' || selectedReport.status === 'under_review';
    return (
      <SafeAreaView style={st.container}>
        <View style={st.header}>
          <Text style={st.title}>Report Detail</Text>
          <TouchableOpacity onPress={() => { setCorrView('tabs'); setSelectedReport(null); }}>
            <Text style={st.closeBtn}>Back</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={st.scroll}>
          <View style={st.card}>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              <View style={[st.statusBadge, { backgroundColor: meta.color, marginBottom: 0 }]}>
                <Text style={st.statusText}>{meta.label}</Text>
              </View>
              {chMeta && (
                <View style={[st.channelChip, { backgroundColor: chMeta.color, marginBottom: 0 }]}>
                  <Text style={st.channelText}>{chMeta.icon} {chMeta.label}</Text>
                </View>
              )}
            </View>
            <Text style={st.negOTK}>-{selectedReport.amount} OTK</Text>
            <View style={st.divider} />
            <Text style={st.cardDesc}>{selectedReport.description}</Text>
            <View style={st.row}><Text style={st.label}>Report ID</Text><Text style={st.val}>{selectedReport.id}</Text></View>
            <View style={st.row}><Text style={st.label}>Reporter</Text><Text style={st.val}>{selectedReport.reporterUID}</Text></View>
            <View style={st.row}><Text style={st.label}>Evidence</Text><Text style={st.val}>{selectedReport.evidence || 'None'}</Text></View>
            <View style={st.row}><Text style={st.label}>Filed</Text><Text style={st.val}>{selectedReport.createdAt}</Text></View>
            {selectedReport.resolvedAt && <View style={st.row}><Text style={st.label}>Resolved</Text><Text style={st.val}>{selectedReport.resolvedAt}</Text></View>}

            <Text style={st.section}>Verifications ({selectedReport.verifications.length})</Text>
            {selectedReport.verifications.length === 0 ? (
              <Text style={st.label}>No verifications yet</Text>
            ) : selectedReport.verifications.map((v, i) => (
              <View key={i} style={st.verificationItem}>
                <Text style={st.verifierLabel}>{v.verifierUID}</Text>
                <Text style={[st.verifierResult, { color: v.approved ? t.accent.red : t.accent.green }]}>
                  {v.approved ? 'Approved' : 'Denied'}
                </Text>
              </View>
            ))}

            {selectedReport.contestEvidence ? (
              <>
                <Text style={st.section}>Your Counter-Evidence</Text>
                <Text style={st.cardDesc}>{selectedReport.contestEvidence}</Text>
              </>
            ) : null}
          </View>

          {canContest && (
            <View style={st.card}>
              <Text style={st.cardTitle}>Contest This Report</Text>
              <Text style={[st.cardDesc, { marginBottom: 10 }]}>
                You have the right to provide counter-evidence. Verifiers will review both sides.
              </Text>
              <TextInput style={[st.input, { minHeight: 60, textAlignVertical: 'top' }]}
                placeholder="Provide counter-evidence hash or description..."
                placeholderTextColor={t.text.muted} value={contestEvidence}
                onChangeText={setContestEvidence} multiline />
              <TouchableOpacity style={st.contestBtn} onPress={() => handleContest(selectedReport)}>
                <Text style={st.contestBtnText}>Submit Contest</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- Verify Detail ---
  if (corrView === 'verify-detail' && selectedReport) {
    const meta = STATUS_META[selectedReport.status];
    const chMeta = CHANNEL_META[selectedReport.channel];
    return (
      <SafeAreaView style={st.container}>
        <View style={st.header}>
          <Text style={st.title}>Review Report</Text>
          <TouchableOpacity onPress={() => { setCorrView('tabs'); setSelectedReport(null); }}>
            <Text style={st.closeBtn}>Back</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={st.scroll}>
          <View style={st.card}>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              <View style={[st.statusBadge, { backgroundColor: meta.color, marginBottom: 0 }]}>
                <Text style={st.statusText}>{meta.label}</Text>
              </View>
              {chMeta && (
                <View style={[st.channelChip, { backgroundColor: chMeta.color, marginBottom: 0 }]}>
                  <Text style={st.channelText}>{chMeta.icon} {chMeta.label}</Text>
                </View>
              )}
            </View>
            <Text style={st.negOTK}>-{selectedReport.amount} OTK</Text>
            <View style={st.divider} />
            <View style={st.row}><Text style={st.label}>Reporter</Text><Text style={st.val}>{selectedReport.reporterUID}</Text></View>
            <View style={st.row}><Text style={st.label}>Target</Text><Text style={st.val}>{selectedReport.targetUID}</Text></View>
            <View style={st.row}><Text style={st.label}>Filed</Text><Text style={st.val}>{selectedReport.createdAt}</Text></View>
            <View style={st.divider} />
            <Text style={st.section}>Description</Text>
            <Text style={st.cardDesc}>{selectedReport.description}</Text>
            <View style={st.row}><Text style={st.label}>Evidence</Text><Text style={st.val}>{selectedReport.evidence || 'None'}</Text></View>

            {selectedReport.contestEvidence ? (
              <>
                <Text style={st.section}>Counter-Evidence (from target)</Text>
                <Text style={st.cardDesc}>{selectedReport.contestEvidence}</Text>
              </>
            ) : null}

            <Text style={st.section}>Verifications ({selectedReport.verifications.length}/{types_MinVerifiers})</Text>
            {selectedReport.verifications.map((v, i) => (
              <View key={i} style={st.verificationItem}>
                <Text style={st.verifierLabel}>{v.verifierUID}</Text>
                <Text style={[st.verifierResult, { color: v.approved ? t.accent.red : t.accent.green }]}>
                  {v.approved ? 'Approved' : 'Denied'}
                </Text>
              </View>
            ))}

            <View style={st.verifyRow}>
              <TouchableOpacity style={st.denyBtn} onPress={() => handleVerify(selectedReport, false)}>
                <Text style={st.btnText}>Deny Report</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.approveBtn} onPress={() => handleVerify(selectedReport, true)}>
                <Text style={st.btnText}>Approve Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- Main tabs view ---
  const currentList = activeTab === 'against-me' ? reportsAgainstMe
    : activeTab === 'my-reports' ? mySubmitted
    : pendingVerify;

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.title}>Corrections</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={st.scroll}>
        <View style={st.warning}>
          <Text style={st.warningText}>
            Article V: Negative OTK (-OTK) requires community consensus. Minimum 3 verifiers must agree. False reports harm your own reputation.
          </Text>
        </View>

        <View style={st.tabRow}>
          {(['against-me', 'my-reports', 'verify'] as Tab[]).map(tab => (
            <TouchableOpacity key={tab} style={[st.tab, activeTab === tab && st.tabActive]}
              onPress={() => setActiveTab(tab)}>
              <Text style={[st.tabText, activeTab === tab && st.tabTextActive]}>
                {tab === 'against-me' ? `Against Me (${reportsAgainstMe.length})`
                  : tab === 'my-reports' ? `Submitted (${mySubmitted.length})`
                  : `Verify (${pendingVerify.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab !== 'verify' && (
          <TouchableOpacity style={[st.card, { alignItems: 'center', borderWidth: 1, borderColor: t.accent.red + '40', borderStyle: 'dashed' }]}
            onPress={() => setCorrView('submit')}>
            <Text style={{ color: t.accent.red, fontSize: 14, fontWeight: fonts.bold }}>+ Submit Correction Report</Text>
          </TouchableOpacity>
        )}

        {currentList.length === 0 ? (
          <Text style={st.empty}>
            {activeTab === 'against-me' ? 'No correction reports against you.'
              : activeTab === 'my-reports' ? 'You have not submitted any reports.'
              : 'No pending reports to verify.'}
          </Text>
        ) : currentList.map(report => {
          const meta = STATUS_META[report.status];
          const chMeta = CHANNEL_META[report.channel];
          return (
            <TouchableOpacity key={report.id} style={st.card}
              onPress={() => {
                setSelectedReport(report);
                setCorrView(activeTab === 'verify' ? 'verify-detail' : 'detail');
              }}>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
                <View style={[st.statusBadge, { backgroundColor: meta.color, marginBottom: 0 }]}>
                  <Text style={st.statusText}>{meta.label}</Text>
                </View>
                {chMeta && (
                  <View style={[st.channelChip, { backgroundColor: chMeta.color, marginBottom: 0 }]}>
                    <Text style={st.channelText}>{chMeta.icon} {chMeta.label}</Text>
                  </View>
                )}
              </View>
              <Text style={st.negOTK}>-{report.amount} OTK</Text>
              <Text style={st.cardDesc} numberOfLines={2}>{report.description}</Text>
              <View style={st.row}>
                <Text style={st.label}>{activeTab === 'against-me' ? 'Reporter' : activeTab === 'my-reports' ? 'Target' : 'Reporter'}</Text>
                <Text style={st.val}>{activeTab === 'against-me' ? report.reporterUID : activeTab === 'my-reports' ? report.targetUID : report.reporterUID}</Text>
              </View>
              <View style={st.row}>
                <Text style={st.label}>Verifications</Text>
                <Text style={st.val}>{report.verifications.length} / 3 required</Text>
              </View>
              <View style={st.row}>
                <Text style={st.label}>Filed</Text>
                <Text style={st.val}>{report.createdAt}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {!demoMode && (
          <View style={[st.card, { marginTop: 20 }]}>
            <Text style={[st.cardDesc, { textAlign: 'center' }]}>
              Enable Demo Mode in Settings to see sample correction reports.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Mirror the chain-side constant for display
const types_MinVerifiers = 3;
