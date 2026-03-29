/**
 * Mediation Screen — Conflict Resolution & Mediation between parties.
 *
 * "When two people cannot resolve a conflict alone, the community
 *  provides a neutral mediator — not to judge, but to help both
 *  parties find common ground."
 * — The Human Constitution, Article VII, Section 2
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

type TabKey = 'active' | 'request' | 'history';

type MediationStatus = 'requested' | 'mediator_assigned' | 'in_session' | 'resolved';

type DisputeType = 'financial' | 'community' | 'identity' | 'governance' | 'family';

interface MediationNote {
  author: string;
  text: string;
  timestamp: string;
}

interface MediationAgreement {
  terms: string;
  partyASigned: boolean;
  partyBSigned: boolean;
  signedAt?: string;
  recordedOnChain: boolean;
  txHash?: string;
}

interface Mediation {
  id: string;
  disputeType: DisputeType;
  status: MediationStatus;
  description: string;
  partyA: { uid: string; name: string };
  partyB: { uid: string; name: string };
  mediator?: { uid: string; name: string; score: number; expertise: DisputeType[] };
  suggestedMediators?: { uid: string; name: string; score: number; expertise: DisputeType[] }[];
  createdAt: string;
  sessionNotes: MediationNote[];
  agreement?: MediationAgreement;
  resolvedAt?: string;
}

const DISPUTE_TYPES: { key: DisputeType; label: string; icon: string }[] = [
  { key: 'financial', label: 'Financial', icon: '\u{1F4B0}' },
  { key: 'community', label: 'Community', icon: '\u{1F3D8}' },
  { key: 'identity', label: 'Identity', icon: '\u{1F464}' },
  { key: 'governance', label: 'Governance', icon: '\u{1F3DB}' },
  { key: 'family', label: 'Family', icon: '\u{1F46A}' },
];

const STATUS_LABELS: Record<MediationStatus, string> = {
  requested: 'Requested',
  mediator_assigned: 'Mediator Assigned',
  in_session: 'In Session',
  resolved: 'Resolved',
};

const STATUS_COLORS: Record<MediationStatus, string> = {
  requested: '#F59E0B',
  mediator_assigned: '#3B82F6',
  in_session: '#8B5CF6',
  resolved: '#10B981',
};

const DEMO_MEDIATIONS: Mediation[] = [
  {
    id: 'med-001',
    disputeType: 'financial',
    status: 'requested',
    description: 'Disagreement over payment terms for a completed freelance project. Party A claims full payment is due; Party B says deliverables were incomplete.',
    partyA: { uid: 'uid-7a3f...alice', name: 'Alice' },
    partyB: { uid: 'uid-9b2c...bob', name: 'Bob' },
    suggestedMediators: [
      { uid: 'uid-med-001', name: 'Priya Sharma', score: 94, expertise: ['financial', 'community'] },
      { uid: 'uid-med-002', name: 'James Chen', score: 91, expertise: ['financial', 'governance'] },
      { uid: 'uid-med-003', name: 'Maria Santos', score: 88, expertise: ['financial', 'family'] },
    ],
    createdAt: '2026-03-26 10:15',
    sessionNotes: [],
  },
  {
    id: 'med-002',
    disputeType: 'community',
    status: 'in_session',
    description: 'Two community members have a disagreement over shared resource allocation in a local cooperative. Both parties claim priority access to community workshop tools.',
    partyA: { uid: 'uid-4d1e...carlos', name: 'Carlos' },
    partyB: { uid: 'uid-8f5a...diana', name: 'Diana' },
    mediator: { uid: 'uid-med-004', name: 'Aisha Okafor', score: 96, expertise: ['community', 'governance'] },
    createdAt: '2026-03-22 14:00',
    sessionNotes: [
      { author: 'Mediator', text: 'Both parties have agreed to participate in good faith. Initial statements heard.', timestamp: '2026-03-23 09:00' },
      { author: 'Carlos', text: 'I use the workshop 3 days a week for my carpentry business which supports my family.', timestamp: '2026-03-23 09:15' },
      { author: 'Diana', text: 'I need the tools for community education classes that benefit 15 families.', timestamp: '2026-03-23 09:30' },
      { author: 'Mediator', text: 'Proposed a shared schedule — Carlos gets Mon/Wed/Fri mornings, Diana gets Tue/Thu and all afternoons for classes. Both parties considering.', timestamp: '2026-03-24 11:00' },
    ],
  },
  {
    id: 'med-003',
    disputeType: 'family',
    status: 'resolved',
    description: 'Family disagreement about eldercare responsibilities and associated nOTK distribution among siblings.',
    partyA: { uid: 'uid-2c7b...elena', name: 'Elena' },
    partyB: { uid: 'uid-6a9d...frank', name: 'Frank' },
    mediator: { uid: 'uid-med-005', name: 'Dr. Kenji Tanaka', score: 98, expertise: ['family', 'identity'] },
    createdAt: '2026-03-10 08:30',
    resolvedAt: '2026-03-18 16:45',
    sessionNotes: [
      { author: 'Mediator', text: 'Siblings have different capacities for eldercare — Elena lives nearby, Frank lives abroad but has more financial resources.', timestamp: '2026-03-11 10:00' },
      { author: 'Elena', text: 'I provide daily care but receive no recognition. Frank sends money occasionally.', timestamp: '2026-03-11 10:20' },
      { author: 'Frank', text: 'I cover all medical expenses and send monthly support. I cannot relocate due to work.', timestamp: '2026-03-11 10:35' },
      { author: 'Mediator', text: 'Agreement reached: Elena receives 60% nOTK for daily care, Frank receives 40% for financial support. Both contributions formally recognized on-chain.', timestamp: '2026-03-18 16:00' },
    ],
    agreement: {
      terms: 'Elena provides daily eldercare (60% nOTK allocation). Frank provides financial support covering medical and living expenses (40% nOTK allocation). Reviewed quarterly. Either party may request re-mediation if circumstances change.',
      partyASigned: true,
      partyBSigned: true,
      signedAt: '2026-03-18 16:45',
      recordedOnChain: true,
      txHash: 'openchain-tx-med003-resolve-a7b3c9d1e5f2...',
    },
  },
];

export function MediationScreen({ onClose }: Props) {
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const [tab, setTab] = useState<TabKey>('active');
  const [mediations, setMediations] = useState<Mediation[]>(DEMO_MEDIATIONS);
  const [selectedMediation, setSelectedMediation] = useState<Mediation | null>(null);
  const [loading, setLoading] = useState(false);

  // Request form state
  const [disputeType, setDisputeType] = useState<DisputeType>('financial');
  const [issueDescription, setIssueDescription] = useState('');
  const [otherPartyUid, setOtherPartyUid] = useState('');
  const [newNote, setNewNote] = useState('');

  const activeMediations = useMemo(() => mediations.filter((m) => m.status !== 'resolved'), [mediations]);
  const historyMediations = useMemo(() => mediations.filter((m) => m.status === 'resolved'), [mediations]);

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '700' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingHorizontal: 16 },
    tabRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 16 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: t.bg.card },
    tabActive: { backgroundColor: t.accent.purple },
    tabText: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: '#fff' },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 20, marginBottom: 8, marginLeft: 4 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    label: { color: t.text.secondary, fontSize: 13 },
    value: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
    statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', color: '#fff' },
    descText: { color: t.text.secondary, fontSize: 13, marginBottom: 8, lineHeight: 18 },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', paddingVertical: 40 },
    heroCard: { backgroundColor: t.accent.purple + '10', borderRadius: 24, padding: 24, marginBottom: 16, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: '800', textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    inputCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15 },
    messageInput: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, minHeight: 100, textAlignVertical: 'top' },
    typeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
    typeChip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: t.bg.card, alignItems: 'center', minWidth: 80 },
    typeChipActive: { backgroundColor: t.accent.purple },
    typeIcon: { fontSize: 24, marginBottom: 4 },
    typeLabel: { color: t.text.secondary, fontSize: 12, fontWeight: '600' },
    typeLabelActive: { color: '#fff' },
    btn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
    btnPrimary: { backgroundColor: t.accent.purple },
    btnSecondary: { backgroundColor: t.bg.card },
    btnSuccess: { backgroundColor: t.accent.green },
    btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    btnTextSecondary: { color: t.accent.purple, fontSize: 15, fontWeight: '700' },
    noteCard: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, marginBottom: 10, borderLeftWidth: 3 },
    noteAuthor: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    noteText: { color: t.text.primary, fontSize: 14, lineHeight: 20 },
    noteTime: { color: t.text.muted, fontSize: 11, marginTop: 6 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.border },
    detailLabel: { color: t.text.secondary, fontSize: 13 },
    detailValue: { color: t.text.primary, fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
    mediatorCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
    mediatorAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: t.accent.purple + '20', alignItems: 'center', justifyContent: 'center' },
    mediatorAvatarText: { fontSize: 20 },
    mediatorInfo: { flex: 1 },
    mediatorName: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    mediatorScore: { color: t.accent.green, fontSize: 12, fontWeight: '600', marginTop: 2 },
    mediatorExpertise: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    selectBtn: { backgroundColor: t.accent.purple, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
    selectBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    agreementCard: { backgroundColor: t.accent.green + '10', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: t.accent.green + '30' },
    agreementTitle: { color: t.accent.green, fontSize: 14, fontWeight: '700', marginBottom: 8 },
    agreementTerms: { color: t.text.primary, fontSize: 14, lineHeight: 22 },
    signatureRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
    signatureBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    signatureText: { fontSize: 12, fontWeight: '600' },
    chainBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
    chainText: { color: t.accent.green, fontSize: 11, fontWeight: '600' },
    warningCard: { backgroundColor: t.accent.yellow + '15', borderRadius: 12, padding: 14, marginBottom: 16 },
    warningText: { color: t.accent.yellow, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  }), [t]);

  // ─── Handlers ───

  const handleSubmitRequest = useCallback(() => {
    if (!otherPartyUid.trim()) {
      Alert.alert('Other Party Required', 'Enter the Universal ID of the other party in this dispute.');
      return;
    }
    if (!issueDescription.trim()) {
      Alert.alert('Description Required', 'Please describe the issue you need mediation for.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const newMediation: Mediation = {
        id: `med-${Date.now()}`,
        disputeType,
        status: 'requested',
        description: issueDescription.trim(),
        partyA: { uid: 'uid-you...self', name: 'You' },
        partyB: { uid: otherPartyUid.trim(), name: otherPartyUid.trim().slice(0, 12) + '...' },
        suggestedMediators: [
          { uid: 'uid-med-010', name: 'Sarah Williams', score: 92, expertise: [disputeType, 'community'] },
          { uid: 'uid-med-011', name: 'Raj Patel', score: 89, expertise: [disputeType, 'governance'] },
        ],
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        sessionNotes: [],
      };

      setMediations((prev) => [newMediation, ...prev]);
      setLoading(false);
      setIssueDescription('');
      setOtherPartyUid('');
      setTab('active');
      Alert.alert(
        'Mediation Requested',
        'Your request has been submitted. The system will suggest neutral mediators based on expertise and community score.',
      );
    }, 1200);
  }, [disputeType, issueDescription, otherPartyUid]);

  const handleSelectMediator = useCallback((mediation: Mediation, mediator: NonNullable<Mediation['suggestedMediators']>[0]) => {
    Alert.alert(
      'Select Mediator',
      `Assign ${mediator.name} (Score: ${mediator.score}) as mediator for this case?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Assign',
          onPress: () => {
            setMediations((prev) =>
              prev.map((m) =>
                m.id === mediation.id
                  ? { ...m, status: 'mediator_assigned' as MediationStatus, mediator: mediator, suggestedMediators: undefined }
                  : m
              )
            );
            setSelectedMediation(null);
            Alert.alert('Mediator Assigned', `${mediator.name} has been notified and will begin the mediation process.`);
          },
        },
      ]
    );
  }, []);

  const handleAddNote = useCallback((mediationId: string) => {
    if (!newNote.trim()) return;
    const note: MediationNote = {
      author: 'You',
      text: newNote.trim(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
    setMediations((prev) =>
      prev.map((m) =>
        m.id === mediationId
          ? { ...m, sessionNotes: [...m.sessionNotes, note] }
          : m
      )
    );
    setSelectedMediation((prev) =>
      prev && prev.id === mediationId
        ? { ...prev, sessionNotes: [...prev.sessionNotes, note] }
        : prev
    );
    setNewNote('');
  }, [newNote]);

  const handleSignAgreement = useCallback((mediationId: string) => {
    Alert.alert(
      'Sign Resolution Agreement',
      'By signing, you agree to the terms of this mediation resolution. The agreement will be recorded on-chain.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Agreement',
          onPress: () => {
            setLoading(true);
            setTimeout(() => {
              setMediations((prev) =>
                prev.map((m) => {
                  if (m.id !== mediationId) return m;
                  const agreement: MediationAgreement = m.agreement ?? {
                    terms: 'Both parties agree to the mediator\'s proposed resolution.',
                    partyASigned: false,
                    partyBSigned: false,
                    recordedOnChain: false,
                  };
                  const updated: MediationAgreement = {
                    ...agreement,
                    partyASigned: true,
                    partyBSigned: true,
                    signedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
                    recordedOnChain: true,
                    txHash: `openchain-tx-${mediationId}-resolve-${Math.random().toString(36).slice(2, 14)}`,
                  };
                  return {
                    ...m,
                    status: 'resolved' as MediationStatus,
                    resolvedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
                    agreement: updated,
                  };
                })
              );
              setLoading(false);
              setSelectedMediation(null);
              Alert.alert('Agreement Signed', 'The resolution agreement has been signed by both parties and recorded on Open Chain.');
            }, 1500);
          },
        },
      ]
    );
  }, []);

  // ─── Render: Mediation Detail ───

  if (selectedMediation) {
    const m = selectedMediation;
    const noteColors: Record<string, string> = {
      Mediator: t.accent.purple,
      [m.partyA.name]: t.accent.blue,
      [m.partyB.name]: t.accent.green,
      You: t.accent.blue,
    };

    return (
      <SafeAreaView style={st.container}>
        <View style={st.header}>
          <TouchableOpacity onPress={() => setSelectedMediation(null)}>
            <Text style={st.closeBtn}>Back</Text>
          </TouchableOpacity>
          <Text style={st.title}>Mediation</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={st.scroll}>
          {/* Status & type */}
          <View style={st.card}>
            <View style={st.row}>
              <Text style={{ color: t.text.primary, fontSize: 16, fontWeight: '700' }}>
                {DISPUTE_TYPES.find((d) => d.key === m.disputeType)?.icon}{' '}
                {DISPUTE_TYPES.find((d) => d.key === m.disputeType)?.label} Dispute
              </Text>
              <View style={[st.statusBadge, { backgroundColor: STATUS_COLORS[m.status] }]}>
                <Text style={st.statusText}>{STATUS_LABELS[m.status]}</Text>
              </View>
            </View>
            <Text style={st.descText}>{m.description}</Text>
            <View style={st.detailRow}>
              <Text style={st.detailLabel}>Party A</Text>
              <Text style={st.detailValue}>{m.partyA.name} ({m.partyA.uid})</Text>
            </View>
            <View style={st.detailRow}>
              <Text style={st.detailLabel}>Party B</Text>
              <Text style={st.detailValue}>{m.partyB.name} ({m.partyB.uid})</Text>
            </View>
            {m.mediator && (
              <View style={st.detailRow}>
                <Text style={st.detailLabel}>Mediator</Text>
                <Text style={st.detailValue}>{m.mediator.name} (Score: {m.mediator.score})</Text>
              </View>
            )}
            <View style={st.detailRow}>
              <Text style={st.detailLabel}>Requested</Text>
              <Text style={st.detailValue}>{m.createdAt}</Text>
            </View>
            {m.resolvedAt && (
              <View style={[st.detailRow, { borderBottomWidth: 0 }]}>
                <Text style={st.detailLabel}>Resolved</Text>
                <Text style={st.detailValue}>{m.resolvedAt}</Text>
              </View>
            )}
          </View>

          {/* Suggested Mediators (for requested status) */}
          {m.status === 'requested' && m.suggestedMediators && m.suggestedMediators.length > 0 && (
            <>
              <Text style={st.section}>Suggested Mediators</Text>
              <View style={st.warningCard}>
                <Text style={st.warningText}>
                  Mediators are matched based on expertise in {DISPUTE_TYPES.find((d) => d.key === m.disputeType)?.label?.toLowerCase()} disputes and their community trust score.
                </Text>
              </View>
              {m.suggestedMediators.map((med) => (
                <View key={med.uid} style={st.mediatorCard}>
                  <View style={st.mediatorAvatar}>
                    <Text style={st.mediatorAvatarText}>{'\u{2696}'}</Text>
                  </View>
                  <View style={st.mediatorInfo}>
                    <Text style={st.mediatorName}>{med.name}</Text>
                    <Text style={st.mediatorScore}>Community Score: {med.score}/100</Text>
                    <Text style={st.mediatorExpertise}>
                      Expertise: {med.expertise.map((e) => DISPUTE_TYPES.find((d) => d.key === e)?.label).join(', ')}
                    </Text>
                  </View>
                  <TouchableOpacity style={st.selectBtn} onPress={() => handleSelectMediator(m, med)}>
                    <Text style={st.selectBtnText}>Select</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}

          {/* Session Notes */}
          {(m.status === 'mediator_assigned' || m.status === 'in_session' || m.status === 'resolved') && (
            <>
              <Text style={st.section}>Session Notes</Text>
              {m.sessionNotes.length === 0 ? (
                <Text style={st.emptyText}>No session notes yet. The mediator will begin the session shortly.</Text>
              ) : (
                m.sessionNotes.map((note, idx) => (
                  <View
                    key={idx}
                    style={[st.noteCard, { borderLeftColor: noteColors[note.author] || t.text.muted }]}
                  >
                    <Text style={[st.noteAuthor, { color: noteColors[note.author] || t.text.muted }]}>
                      {note.author}
                    </Text>
                    <Text style={st.noteText}>{note.text}</Text>
                    <Text style={st.noteTime}>{note.timestamp}</Text>
                  </View>
                ))
              )}

              {/* Add note (only if not resolved) */}
              {m.status !== 'resolved' && (
                <View style={st.inputCard}>
                  <Text style={st.inputLabel}>Add a Note</Text>
                  <TextInput
                    style={st.messageInput}
                    placeholder="Share your perspective or respond to the mediator..."
                    placeholderTextColor={t.text.muted}
                    value={newNote}
                    onChangeText={setNewNote}
                    multiline
                    numberOfLines={3}
                  />
                  <TouchableOpacity
                    style={[st.btn, st.btnPrimary, { marginTop: 10, marginBottom: 0 }]}
                    onPress={() => handleAddNote(m.id)}
                  >
                    <Text style={st.btnText}>Submit Note</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {/* Resolution Agreement */}
          {m.agreement && (
            <>
              <Text style={st.section}>Resolution Agreement</Text>
              <View style={st.agreementCard}>
                <Text style={st.agreementTitle}>{'\u{1F4DC}'} Agreement Terms</Text>
                <Text style={st.agreementTerms}>{m.agreement.terms}</Text>

                <View style={st.signatureRow}>
                  <View style={st.signatureBadge}>
                    <Text style={{ fontSize: 14 }}>{m.agreement.partyASigned ? '\u{2705}' : '\u{23F3}'}</Text>
                    <Text style={[st.signatureText, { color: m.agreement.partyASigned ? t.accent.green : t.text.muted }]}>
                      {m.partyA.name}
                    </Text>
                  </View>
                  <View style={st.signatureBadge}>
                    <Text style={{ fontSize: 14 }}>{m.agreement.partyBSigned ? '\u{2705}' : '\u{23F3}'}</Text>
                    <Text style={[st.signatureText, { color: m.agreement.partyBSigned ? t.accent.green : t.text.muted }]}>
                      {m.partyB.name}
                    </Text>
                  </View>
                </View>

                {m.agreement.recordedOnChain && m.agreement.txHash && (
                  <View style={st.chainBadge}>
                    <Text style={{ fontSize: 12 }}>{'\u{1F517}'}</Text>
                    <Text style={st.chainText}>
                      On-chain: {m.agreement.txHash.slice(0, 24)}...
                    </Text>
                  </View>
                )}

                {m.agreement.signedAt && (
                  <Text style={{ color: t.text.muted, fontSize: 11, marginTop: 6 }}>
                    Signed: {m.agreement.signedAt}
                  </Text>
                )}
              </View>
            </>
          )}

          {/* Sign agreement button (for in_session with mediator) */}
          {m.status === 'in_session' && m.mediator && (
            <TouchableOpacity
              style={[st.btn, st.btnSuccess]}
              onPress={() => handleSignAgreement(m.id)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={st.btnText}>Propose & Sign Resolution Agreement</Text>
              )}
            </TouchableOpacity>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Render: Tabs ───

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeBtn}>Close</Text>
        </TouchableOpacity>
        <Text style={st.title}>Mediation</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tab Bar */}
      <View style={st.tabRow}>
        <TouchableOpacity style={[st.tab, tab === 'active' && st.tabActive]} onPress={() => setTab('active')}>
          <Text style={[st.tabText, tab === 'active' && st.tabTextActive]}>Active ({activeMediations.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[st.tab, tab === 'request' && st.tabActive]} onPress={() => setTab('request')}>
          <Text style={[st.tabText, tab === 'request' && st.tabTextActive]}>Request</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[st.tab, tab === 'history' && st.tabActive]} onPress={() => setTab('history')}>
          <Text style={[st.tabText, tab === 'history' && st.tabTextActive]}>History ({historyMediations.length})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={st.scroll}>
        {/* ─── Active Tab ─── */}
        {tab === 'active' && (
          <>
            {activeMediations.length === 0 ? (
              <Text style={st.emptyText}>No active mediations.</Text>
            ) : (
              activeMediations.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={st.card}
                  onPress={() => setSelectedMediation(m)}
                  activeOpacity={0.7}
                >
                  <View style={st.row}>
                    <Text style={{ color: t.text.primary, fontSize: 15, fontWeight: '700', flex: 1 }}>
                      {DISPUTE_TYPES.find((d) => d.key === m.disputeType)?.icon}{' '}
                      {DISPUTE_TYPES.find((d) => d.key === m.disputeType)?.label}
                    </Text>
                    <View style={[st.statusBadge, { backgroundColor: STATUS_COLORS[m.status] }]}>
                      <Text style={st.statusText}>{STATUS_LABELS[m.status]}</Text>
                    </View>
                  </View>
                  <Text style={st.descText} numberOfLines={2}>{m.description}</Text>
                  <View style={st.row}>
                    <Text style={st.label}>Parties</Text>
                    <Text style={st.value}>{m.partyA.name} vs {m.partyB.name}</Text>
                  </View>
                  {m.mediator && (
                    <View style={st.row}>
                      <Text style={st.label}>Mediator</Text>
                      <Text style={st.value}>{m.mediator.name}</Text>
                    </View>
                  )}
                  <View style={st.row}>
                    <Text style={st.label}>Requested</Text>
                    <Text style={st.label}>{m.createdAt}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}

            {!demoMode && activeMediations.length === 0 && (
              <View style={[st.card, { alignItems: 'center' }]}>
                <Text style={{ color: t.text.muted, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                  Enable Demo Mode in Settings to see sample mediations. You can also request a new mediation from the Request tab.
                </Text>
              </View>
            )}
          </>
        )}

        {/* ─── Request Tab ─── */}
        {tab === 'request' && (
          <>
            <View style={st.heroCard}>
              <Text style={st.heroIcon}>{'\u{2696}'}</Text>
              <Text style={st.heroTitle}>Request Mediation</Text>
              <Text style={st.heroSubtitle}>
                A neutral mediator will be matched based on expertise and community trust score to help both parties find common ground.
              </Text>
            </View>

            <Text style={st.section}>Dispute Type</Text>
            <View style={st.typeRow}>
              {DISPUTE_TYPES.map((dt) => (
                <TouchableOpacity
                  key={dt.key}
                  style={[st.typeChip, disputeType === dt.key && st.typeChipActive]}
                  onPress={() => setDisputeType(dt.key)}
                >
                  <Text style={st.typeIcon}>{dt.icon}</Text>
                  <Text style={[st.typeLabel, disputeType === dt.key && st.typeLabelActive]}>{dt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={st.inputCard}>
              <Text style={st.inputLabel}>Other Party (Universal ID)</Text>
              <TextInput
                style={st.input}
                placeholder="uid-... or openchain1..."
                placeholderTextColor={t.text.muted}
                value={otherPartyUid}
                onChangeText={setOtherPartyUid}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={st.inputCard}>
              <Text style={st.inputLabel}>Describe the Issue</Text>
              <TextInput
                style={st.messageInput}
                placeholder="Explain the dispute and what you've already tried to resolve it..."
                placeholderTextColor={t.text.muted}
                value={issueDescription}
                onChangeText={setIssueDescription}
                multiline
                numberOfLines={5}
              />
            </View>

            <TouchableOpacity
              style={[st.btn, st.btnPrimary]}
              onPress={handleSubmitRequest}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={st.btnText}>Submit Mediation Request</Text>
              )}
            </TouchableOpacity>

            <Text style={{ color: t.text.muted, fontSize: 12, textAlign: 'center', lineHeight: 18, marginHorizontal: 8 }}>
              Both parties must agree to mediation. The mediator facilitates discussion but does not impose decisions. Resolution agreements are signed by both parties and recorded on Open Chain.
            </Text>
          </>
        )}

        {/* ─── History Tab ─── */}
        {tab === 'history' && (
          <>
            {historyMediations.length === 0 ? (
              <Text style={st.emptyText}>No mediation history yet.</Text>
            ) : (
              historyMediations.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={st.card}
                  onPress={() => setSelectedMediation(m)}
                  activeOpacity={0.7}
                >
                  <View style={st.row}>
                    <Text style={{ color: t.text.primary, fontSize: 15, fontWeight: '700', flex: 1 }}>
                      {DISPUTE_TYPES.find((d) => d.key === m.disputeType)?.icon}{' '}
                      {DISPUTE_TYPES.find((d) => d.key === m.disputeType)?.label}
                    </Text>
                    <View style={[st.statusBadge, { backgroundColor: STATUS_COLORS[m.status] }]}>
                      <Text style={st.statusText}>{STATUS_LABELS[m.status]}</Text>
                    </View>
                  </View>
                  <Text style={st.descText} numberOfLines={2}>{m.description}</Text>
                  <View style={st.row}>
                    <Text style={st.label}>Parties</Text>
                    <Text style={st.value}>{m.partyA.name} vs {m.partyB.name}</Text>
                  </View>
                  {m.mediator && (
                    <View style={st.row}>
                      <Text style={st.label}>Mediator</Text>
                      <Text style={st.value}>{m.mediator.name}</Text>
                    </View>
                  )}
                  <View style={st.row}>
                    <Text style={st.label}>Resolved</Text>
                    <Text style={st.label}>{m.resolvedAt ?? 'N/A'}</Text>
                  </View>
                  {m.agreement?.recordedOnChain && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontSize: 11 }}>{'\u{1F517}'}</Text>
                      <Text style={{ color: t.accent.green, fontSize: 11, fontWeight: '600' }}>Recorded on-chain</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
