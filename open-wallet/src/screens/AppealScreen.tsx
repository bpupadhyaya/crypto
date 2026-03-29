/**
 * Appeal Screen — Article V of The Human Constitution: Contest/Appeal for Correction Reports.
 *
 * "Every person has the right to contest a correction report and present counter-evidence."
 *
 * Features:
 * - View active correction reports against you and appeal them
 * - Submit an appeal with counter-evidence (text, file hash, witness UIDs)
 * - Appeal timeline visualization (submitted -> reviewed -> hearing -> resolved)
 * - Appeal status dashboard (pending, in_hearing, resolved, reversed)
 * - Evidence attachment section (hash references to off-chain evidence)
 * - Witness list (UIDs who can vouch)
 * - Appeal hearing details (scheduled, arbiter, timeline)
 * - Demo data with sample appeals in various states
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

interface Witness {
  uid: string;
  statement: string;
  confirmed: boolean;
}

interface EvidenceItem {
  hash: string;
  label: string;
  type: 'document' | 'photo' | 'video' | 'testimony' | 'chain_record';
  addedAt: string;
}

interface TimelineStep {
  stage: 'submitted' | 'reviewed' | 'hearing' | 'resolved';
  label: string;
  date?: string;
  completed: boolean;
}

interface Appeal {
  id: string;
  correctionReportId: string;
  appellantUID: string;
  reporterUID: string;
  channel: string;
  originalDescription: string;
  originalAmount: number;
  appealReason: string;
  status: 'pending' | 'in_hearing' | 'resolved' | 'reversed';
  evidence: EvidenceItem[];
  witnesses: Witness[];
  timeline: TimelineStep[];
  arbiterUID?: string;
  hearingDate?: string;
  hearingNotes?: string;
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
}

type Tab = 'my-appeals' | 'submit' | 'evidence';

const CHANNEL_META: Record<string, { label: string; icon: string; color: string }> = {
  nurture:    { label: 'Nurture',    icon: '\u{1F49B}', color: '#ef4444' },
  education:  { label: 'Education',  icon: '\u{1F4DA}', color: '#3b82f6' },
  health:     { label: 'Health',     icon: '\u{1FA7A}', color: '#22c55e' },
  community:  { label: 'Community',  icon: '\u{1F91D}', color: '#8b5cf6' },
  economic:   { label: 'Economic',   icon: '\u{1F4B0}', color: '#f7931a' },
  governance: { label: 'Governance', icon: '\u{1F5F3}', color: '#eab308' },
};

const STATUS_META: Record<string, { label: string; color: string; icon: string }> = {
  pending:    { label: 'Pending',    color: '#f59e0b', icon: '\u{23F3}' },
  in_hearing: { label: 'In Hearing', color: '#3b82f6', icon: '\u{2696}' },
  resolved:   { label: 'Resolved',   color: '#22c55e', icon: '\u{2705}' },
  reversed:   { label: 'Reversed',   color: '#8b5cf6', icon: '\u{1F504}' },
};

const DEMO_MY_UID = 'uid-a83f-demo';

const DEMO_APPEALS: Appeal[] = [
  {
    id: 'appeal-001',
    correctionReportId: 'corr-001',
    appellantUID: DEMO_MY_UID,
    reporterUID: 'uid-7b2c-reporter1',
    channel: 'community',
    originalDescription: 'Failed to fulfill volunteer commitment at local food bank — 3 consecutive no-shows after signing up.',
    originalAmount: 25,
    appealReason: 'I was hospitalized during the scheduled dates. Medical records confirm admission from March 18-22. I notified the coordinator via message (hash attached) but the reporter was not informed.',
    status: 'in_hearing',
    evidence: [
      { hash: 'sha256:med_record_a83f_0318', label: 'Hospital admission record', type: 'document', addedAt: '2026-03-22 14:00' },
      { hash: 'sha256:msg_coord_a83f_0317', label: 'Message to coordinator', type: 'chain_record', addedAt: '2026-03-22 14:05' },
    ],
    witnesses: [
      { uid: 'uid-coord-fb01', statement: 'Confirms notification was received via chain message on March 17.', confirmed: true },
      { uid: 'uid-nurse-h203', statement: 'Can verify hospital admission during the period in question.', confirmed: true },
    ],
    timeline: [
      { stage: 'submitted', label: 'Appeal Submitted', date: '2026-03-22 14:10', completed: true },
      { stage: 'reviewed', label: 'Evidence Reviewed', date: '2026-03-24 09:00', completed: true },
      { stage: 'hearing', label: 'Hearing Scheduled', date: '2026-03-29 10:00', completed: false },
      { stage: 'resolved', label: 'Resolution', completed: false },
    ],
    arbiterUID: 'uid-arb-j4k5',
    hearingDate: '2026-03-29 10:00',
    hearingNotes: 'Both parties have been notified. Arbiter will review medical evidence and coordinator testimony.',
    createdAt: '2026-03-22 14:10',
  },
  {
    id: 'appeal-002',
    correctionReportId: 'corr-005',
    appellantUID: DEMO_MY_UID,
    reporterUID: 'uid-9f3d-reporter5',
    channel: 'education',
    originalDescription: 'Provided misleading information in community workshop about nutrition basics.',
    originalAmount: 40,
    appealReason: 'The information I presented was sourced from peer-reviewed journals. The reporter disagreed with the scientific consensus, not with my accuracy.',
    status: 'reversed',
    evidence: [
      { hash: 'sha256:journal_ref_nutr_2025', label: 'Published journal reference (DOI)', type: 'document', addedAt: '2026-03-10 11:00' },
      { hash: 'sha256:workshop_recording_0308', label: 'Full workshop recording hash', type: 'video', addedAt: '2026-03-10 11:05' },
      { hash: 'sha256:slide_deck_hash_0308', label: 'Presentation slides', type: 'document', addedAt: '2026-03-10 11:10' },
    ],
    witnesses: [
      { uid: 'uid-prof-n601', statement: 'Reviewed the workshop content; it aligns with current scientific literature.', confirmed: true },
      { uid: 'uid-attend-k902', statement: 'Attended the workshop. Information was clearly sourced and accurate.', confirmed: true },
      { uid: 'uid-attend-m104', statement: 'Was present. No misleading claims were made.', confirmed: true },
    ],
    timeline: [
      { stage: 'submitted', label: 'Appeal Submitted', date: '2026-03-10 11:15', completed: true },
      { stage: 'reviewed', label: 'Evidence Reviewed', date: '2026-03-12 08:00', completed: true },
      { stage: 'hearing', label: 'Hearing Held', date: '2026-03-14 14:00', completed: true },
      { stage: 'resolved', label: 'Reversed — Report Dismissed', date: '2026-03-14 16:30', completed: true },
    ],
    arbiterUID: 'uid-arb-p7q8',
    hearingDate: '2026-03-14 14:00',
    hearingNotes: 'Arbiter concluded that the workshop content was factually accurate and well-sourced. Report reversed.',
    resolution: 'Appeal GRANTED. Correction report corr-005 reversed. No -OTK applied. Reporter notified of outcome.',
    createdAt: '2026-03-10 11:15',
    resolvedAt: '2026-03-14 16:30',
  },
  {
    id: 'appeal-003',
    correctionReportId: 'corr-008',
    appellantUID: DEMO_MY_UID,
    reporterUID: 'uid-b1c2-reporter6',
    channel: 'economic',
    originalDescription: 'Late delivery of goods in peer-to-peer marketplace transaction, causing financial loss.',
    originalAmount: 75,
    appealReason: 'Delivery was delayed by 2 days due to a natural disaster in the shipping region. I communicated the delay and offered a partial refund which was declined.',
    status: 'resolved',
    evidence: [
      { hash: 'sha256:weather_alert_0315', label: 'Official weather/disaster alert', type: 'document', addedAt: '2026-03-18 09:00' },
      { hash: 'sha256:msg_buyer_delay_0316', label: 'Delay notification to buyer', type: 'chain_record', addedAt: '2026-03-18 09:05' },
      { hash: 'sha256:refund_offer_0317', label: 'Partial refund offer record', type: 'chain_record', addedAt: '2026-03-18 09:10' },
    ],
    witnesses: [
      { uid: 'uid-carrier-s501', statement: 'Confirms shipment was held at distribution center due to road closures.', confirmed: true },
    ],
    timeline: [
      { stage: 'submitted', label: 'Appeal Submitted', date: '2026-03-18 09:15', completed: true },
      { stage: 'reviewed', label: 'Evidence Reviewed', date: '2026-03-20 10:00', completed: true },
      { stage: 'hearing', label: 'Hearing Held', date: '2026-03-22 11:00', completed: true },
      { stage: 'resolved', label: 'Partially Upheld', date: '2026-03-22 14:00', completed: true },
    ],
    arbiterUID: 'uid-arb-r9s0',
    hearingDate: '2026-03-22 11:00',
    hearingNotes: 'Delay was due to force majeure. However, communication could have been earlier.',
    resolution: 'Appeal PARTIALLY GRANTED. Original -75 OTK reduced to -15 OTK for delayed communication. Force majeure acknowledged.',
    createdAt: '2026-03-18 09:15',
    resolvedAt: '2026-03-22 14:00',
  },
  {
    id: 'appeal-004',
    correctionReportId: 'corr-012',
    appellantUID: DEMO_MY_UID,
    reporterUID: 'uid-d3e4-reporter7',
    channel: 'nurture',
    originalDescription: 'Neglected to attend scheduled mentorship sessions with assigned youth mentee for 4 weeks.',
    originalAmount: 60,
    appealReason: 'I arranged a substitute mentor (uid-sub-f5g6) with coordinator approval. The sessions were not missed — they were covered by my approved substitute.',
    status: 'pending',
    evidence: [
      { hash: 'sha256:sub_approval_coord_0325', label: 'Coordinator approval of substitute', type: 'chain_record', addedAt: '2026-03-27 16:00' },
    ],
    witnesses: [
      { uid: 'uid-sub-f5g6', statement: 'I served as substitute mentor for the 4 sessions in question.', confirmed: false },
      { uid: 'uid-coord-mt02', statement: 'Approved the substitute arrangement.', confirmed: false },
    ],
    timeline: [
      { stage: 'submitted', label: 'Appeal Submitted', date: '2026-03-27 16:05', completed: true },
      { stage: 'reviewed', label: 'Under Review', completed: false },
      { stage: 'hearing', label: 'Hearing', completed: false },
      { stage: 'resolved', label: 'Resolution', completed: false },
    ],
    createdAt: '2026-03-27 16:05',
  },
];

export function AppealScreen({ onClose }: Props) {
  const { demoMode } = useWalletStore();
  const t = useTheme();

  const [activeTab, setActiveTab] = useState<Tab>('my-appeals');
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);

  // Submit form state
  const [correctionId, setCorrectionId] = useState('');
  const [appealReason, setAppealReason] = useState('');
  const [evidenceHash, setEvidenceHash] = useState('');
  const [evidenceLabel, setEvidenceLabel] = useState('');
  const [witnessUID, setWitnessUID] = useState('');
  const [witnessStatement, setWitnessStatement] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Evidence form (for adding to existing appeal)
  const [addEvidenceAppealId, setAddEvidenceAppealId] = useState('');
  const [newEvidenceHash, setNewEvidenceHash] = useState('');
  const [newEvidenceLabel, setNewEvidenceLabel] = useState('');
  const [newWitnessUID, setNewWitnessUID] = useState('');
  const [newWitnessStatement, setNewWitnessStatement] = useState('');

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 8 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '700' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { flex: 1, paddingHorizontal: 16 },
    tabRow: { flexDirection: 'row', marginBottom: 16, gap: 6 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: t.bg.card, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: 12, fontWeight: '600' },
    tabTextActive: { color: '#fff' },
    card: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    cardTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700', marginBottom: 4 },
    cardDesc: { color: t.text.secondary, fontSize: 13, lineHeight: 19, marginBottom: 8 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 8 },
    statusText: { fontSize: 11, fontWeight: '700', color: '#fff' },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    label: { color: t.text.muted, fontSize: 12 },
    val: { color: t.text.secondary, fontSize: 12, fontWeight: '600' },
    negOTK: { color: t.accent.red, fontSize: 16, fontWeight: '800' },
    channelChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 8 },
    channelText: { fontSize: 11, fontWeight: '700', color: '#fff' },
    info: { backgroundColor: t.accent.blue + '15', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: t.accent.blue + '30' },
    infoText: { color: t.accent.blue, fontSize: 13, lineHeight: 19, fontWeight: '600' },
    input: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 14, marginBottom: 12, borderWidth: 1, borderColor: t.border },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: '600', marginBottom: 6 },
    submitBtn: { backgroundColor: t.accent.purple, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8, marginBottom: 20 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    addBtn: { backgroundColor: t.accent.blue, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4, marginBottom: 12 },
    addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 12, marginBottom: 6 },
    divider: { height: 1, backgroundColor: t.border, marginVertical: 10 },
    empty: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40 },
    backBtn: { paddingVertical: 16, alignItems: 'center' },
    backText: { color: t.accent.blue, fontSize: 16 },
    // Timeline styles
    timelineContainer: { marginVertical: 8 },
    timelineStep: { flexDirection: 'row', marginBottom: 0 },
    timelineDotCol: { width: 28, alignItems: 'center' },
    timelineDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
    timelineDotCompleted: { backgroundColor: t.accent.green, borderColor: t.accent.green },
    timelineDotPending: { backgroundColor: 'transparent', borderColor: t.text.muted },
    timelineDotActive: { backgroundColor: t.accent.blue, borderColor: t.accent.blue },
    timelineLine: { width: 2, flex: 1, marginVertical: 2 },
    timelineLineCompleted: { backgroundColor: t.accent.green },
    timelineLinePending: { backgroundColor: t.text.muted + '40' },
    timelineContent: { flex: 1, paddingBottom: 16, paddingLeft: 8 },
    timelineLabel: { color: t.text.primary, fontSize: 13, fontWeight: '600' },
    timelineDate: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    // Evidence and witness items
    evidenceItem: { backgroundColor: t.bg.primary, borderRadius: 10, padding: 12, marginBottom: 8 },
    evidenceType: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
    evidenceLabel: { color: t.text.primary, fontSize: 13, fontWeight: '600' },
    evidenceHash: { color: t.text.muted, fontSize: 11, fontFamily: 'Courier', marginTop: 2 },
    witnessItem: { backgroundColor: t.bg.primary, borderRadius: 10, padding: 12, marginBottom: 8 },
    witnessUID: { color: t.text.primary, fontSize: 13, fontWeight: '600' },
    witnessStatus: { fontSize: 11, fontWeight: '700', marginTop: 2 },
    witnessStatement: { color: t.text.secondary, fontSize: 12, lineHeight: 17, marginTop: 4, fontStyle: 'italic' },
    // Hearing card
    hearingCard: { backgroundColor: t.accent.blue + '10', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: t.accent.blue + '25' },
    hearingTitle: { color: t.accent.blue, fontSize: 14, fontWeight: '700', marginBottom: 8 },
    // Summary stats
    statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    statCard: { flex: 1, backgroundColor: t.bg.card, borderRadius: 12, padding: 12, alignItems: 'center' },
    statNum: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
    statLabel: { color: t.text.muted, fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  }), [t]);

  const appeals = demoMode ? DEMO_APPEALS : [];
  const pendingCount = appeals.filter(a => a.status === 'pending').length;
  const hearingCount = appeals.filter(a => a.status === 'in_hearing').length;
  const resolvedCount = appeals.filter(a => a.status === 'resolved').length;
  const reversedCount = appeals.filter(a => a.status === 'reversed').length;

  const handleSubmitAppeal = useCallback(() => {
    if (!correctionId.trim() || !appealReason.trim()) {
      Alert.alert('Missing Fields', 'Correction Report ID and Appeal Reason are required.');
      return;
    }

    Alert.alert(
      'Confirm Appeal Submission',
      `You are submitting an appeal for correction report ${correctionId}.\n\nYour appeal and all evidence will be reviewed by an assigned arbiter. Provide as much evidence as possible.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Appeal', onPress: () => {
            setSubmitting(true);
            setTimeout(() => {
              setSubmitting(false);
              Alert.alert('Appeal Submitted', 'Your appeal has been recorded on-chain. An arbiter will be assigned within 48 hours. You can add additional evidence from the Evidence tab.');
              setActiveTab('my-appeals');
              setCorrectionId(''); setAppealReason(''); setEvidenceHash(''); setEvidenceLabel('');
              setWitnessUID(''); setWitnessStatement('');
            }, 1500);
          },
        },
      ],
    );
  }, [correctionId, appealReason]);

  const handleAddEvidence = useCallback(() => {
    if (!addEvidenceAppealId.trim() || !newEvidenceHash.trim() || !newEvidenceLabel.trim()) {
      Alert.alert('Missing Fields', 'Appeal ID, evidence hash, and label are required.');
      return;
    }
    Alert.alert('Evidence Added', `Evidence "${newEvidenceLabel}" has been attached to appeal ${addEvidenceAppealId}. The arbiter will be notified.`);
    setAddEvidenceAppealId(''); setNewEvidenceHash(''); setNewEvidenceLabel('');
  }, [addEvidenceAppealId, newEvidenceHash, newEvidenceLabel]);

  const handleAddWitness = useCallback(() => {
    if (!addEvidenceAppealId.trim() || !newWitnessUID.trim()) {
      Alert.alert('Missing Fields', 'Appeal ID and Witness UID are required.');
      return;
    }
    Alert.alert('Witness Added', `Witness ${newWitnessUID} has been notified and asked to confirm their testimony for appeal ${addEvidenceAppealId}.`);
    setNewWitnessUID(''); setNewWitnessStatement('');
  }, [addEvidenceAppealId, newWitnessUID]);

  // --- Timeline renderer ---
  const renderTimeline = (timeline: TimelineStep[]) => (
    <View style={st.timelineContainer}>
      {timeline.map((step, i) => {
        const isLast = i === timeline.length - 1;
        const isActive = step.completed && (isLast || !timeline[i + 1].completed);
        return (
          <View key={step.stage} style={st.timelineStep}>
            <View style={st.timelineDotCol}>
              <View style={[
                st.timelineDot,
                step.completed ? (isActive ? st.timelineDotActive : st.timelineDotCompleted) : st.timelineDotPending,
              ]} />
              {!isLast && (
                <View style={[
                  st.timelineLine,
                  step.completed ? st.timelineLineCompleted : st.timelineLinePending,
                ]} />
              )}
            </View>
            <View style={st.timelineContent}>
              <Text style={st.timelineLabel}>{step.label}</Text>
              {step.date && <Text style={st.timelineDate}>{step.date}</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );

  // --- Appeal Detail View ---
  if (selectedAppeal) {
    const meta = STATUS_META[selectedAppeal.status];
    const chMeta = CHANNEL_META[selectedAppeal.channel];
    return (
      <SafeAreaView style={st.container}>
        <View style={st.header}>
          <Text style={st.title}>Appeal Detail</Text>
          <TouchableOpacity onPress={() => setSelectedAppeal(null)}>
            <Text style={st.closeBtn}>Back</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={st.scroll}>
          <View style={st.card}>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              <View style={[st.statusBadge, { backgroundColor: meta.color, marginBottom: 0 }]}>
                <Text style={st.statusText}>{meta.icon} {meta.label}</Text>
              </View>
              {chMeta && (
                <View style={[st.channelChip, { backgroundColor: chMeta.color, marginBottom: 0 }]}>
                  <Text style={st.channelText}>{chMeta.icon} {chMeta.label}</Text>
                </View>
              )}
            </View>
            <Text style={st.negOTK}>Original: -{selectedAppeal.originalAmount} OTK</Text>
            <View style={st.divider} />
            <View style={st.row}><Text style={st.label}>Appeal ID</Text><Text style={st.val}>{selectedAppeal.id}</Text></View>
            <View style={st.row}><Text style={st.label}>Correction Report</Text><Text style={st.val}>{selectedAppeal.correctionReportId}</Text></View>
            <View style={st.row}><Text style={st.label}>Reporter</Text><Text style={st.val}>{selectedAppeal.reporterUID}</Text></View>
            <View style={st.row}><Text style={st.label}>Filed</Text><Text style={st.val}>{selectedAppeal.createdAt}</Text></View>
            {selectedAppeal.resolvedAt && <View style={st.row}><Text style={st.label}>Resolved</Text><Text style={st.val}>{selectedAppeal.resolvedAt}</Text></View>}
          </View>

          {/* Original Correction */}
          <View style={st.card}>
            <Text style={st.section}>Original Correction Report</Text>
            <Text style={st.cardDesc}>{selectedAppeal.originalDescription}</Text>
          </View>

          {/* Appeal Reason */}
          <View style={st.card}>
            <Text style={st.section}>Appeal Reason</Text>
            <Text style={st.cardDesc}>{selectedAppeal.appealReason}</Text>
          </View>

          {/* Timeline */}
          <View style={st.card}>
            <Text style={st.section}>Appeal Timeline</Text>
            {renderTimeline(selectedAppeal.timeline)}
          </View>

          {/* Hearing Details */}
          {selectedAppeal.arbiterUID && (
            <View style={st.hearingCard}>
              <Text style={st.hearingTitle}>Hearing Details</Text>
              <View style={st.row}><Text style={st.label}>Arbiter</Text><Text style={st.val}>{selectedAppeal.arbiterUID}</Text></View>
              {selectedAppeal.hearingDate && <View style={st.row}><Text style={st.label}>Scheduled</Text><Text style={st.val}>{selectedAppeal.hearingDate}</Text></View>}
              {selectedAppeal.hearingNotes && (
                <>
                  <View style={st.divider} />
                  <Text style={st.cardDesc}>{selectedAppeal.hearingNotes}</Text>
                </>
              )}
            </View>
          )}

          {/* Evidence */}
          <View style={st.card}>
            <Text style={st.section}>Evidence ({selectedAppeal.evidence.length})</Text>
            {selectedAppeal.evidence.length === 0 ? (
              <Text style={st.label}>No evidence attached yet</Text>
            ) : selectedAppeal.evidence.map((ev, i) => (
              <View key={i} style={st.evidenceItem}>
                <Text style={[st.evidenceType, { color: t.accent.blue }]}>{ev.type.replace('_', ' ')}</Text>
                <Text style={st.evidenceLabel}>{ev.label}</Text>
                <Text style={st.evidenceHash}>{ev.hash}</Text>
                <Text style={[st.timelineDate, { marginTop: 4 }]}>Added {ev.addedAt}</Text>
              </View>
            ))}
          </View>

          {/* Witnesses */}
          <View style={st.card}>
            <Text style={st.section}>Witnesses ({selectedAppeal.witnesses.length})</Text>
            {selectedAppeal.witnesses.length === 0 ? (
              <Text style={st.label}>No witnesses listed</Text>
            ) : selectedAppeal.witnesses.map((w, i) => (
              <View key={i} style={st.witnessItem}>
                <Text style={st.witnessUID}>{w.uid}</Text>
                <Text style={[st.witnessStatus, { color: w.confirmed ? t.accent.green : t.text.muted }]}>
                  {w.confirmed ? 'Confirmed' : 'Awaiting Confirmation'}
                </Text>
                <Text style={st.witnessStatement}>"{w.statement}"</Text>
              </View>
            ))}
          </View>

          {/* Resolution */}
          {selectedAppeal.resolution && (
            <View style={[st.card, { borderWidth: 1, borderColor: t.accent.green + '40' }]}>
              <Text style={st.section}>Resolution</Text>
              <Text style={st.cardDesc}>{selectedAppeal.resolution}</Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- Main Tabs View ---
  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.title}>Appeals</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={st.scroll}>
        <View style={st.info}>
          <Text style={st.infoText}>
            Article V: Every person has the right to contest a correction report. Submit evidence, list witnesses, and request a fair hearing before an impartial arbiter.
          </Text>
        </View>

        <View style={st.tabRow}>
          {(['my-appeals', 'submit', 'evidence'] as Tab[]).map(tab => (
            <TouchableOpacity key={tab} style={[st.tab, activeTab === tab && st.tabActive]}
              onPress={() => setActiveTab(tab)}>
              <Text style={[st.tabText, activeTab === tab && st.tabTextActive]}>
                {tab === 'my-appeals' ? `My Appeals (${appeals.length})`
                  : tab === 'submit' ? 'New Appeal'
                  : 'Add Evidence'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ===== MY APPEALS TAB ===== */}
        {activeTab === 'my-appeals' && (
          <>
            {/* Status Dashboard */}
            <View style={st.statsRow}>
              <View style={st.statCard}>
                <Text style={[st.statNum, { color: STATUS_META.pending.color }]}>{pendingCount}</Text>
                <Text style={st.statLabel}>Pending</Text>
              </View>
              <View style={st.statCard}>
                <Text style={[st.statNum, { color: STATUS_META.in_hearing.color }]}>{hearingCount}</Text>
                <Text style={st.statLabel}>In Hearing</Text>
              </View>
              <View style={st.statCard}>
                <Text style={[st.statNum, { color: STATUS_META.resolved.color }]}>{resolvedCount}</Text>
                <Text style={st.statLabel}>Resolved</Text>
              </View>
              <View style={st.statCard}>
                <Text style={[st.statNum, { color: STATUS_META.reversed.color }]}>{reversedCount}</Text>
                <Text style={st.statLabel}>Reversed</Text>
              </View>
            </View>

            {appeals.length === 0 ? (
              <Text style={st.empty}>
                {demoMode ? 'No appeals found.' : 'Enable Demo Mode in Settings to see sample appeals.'}
              </Text>
            ) : appeals.map(appeal => {
              const meta = STATUS_META[appeal.status];
              const chMeta = CHANNEL_META[appeal.channel];
              return (
                <TouchableOpacity key={appeal.id} style={st.card}
                  onPress={() => setSelectedAppeal(appeal)}>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
                    <View style={[st.statusBadge, { backgroundColor: meta.color, marginBottom: 0 }]}>
                      <Text style={st.statusText}>{meta.icon} {meta.label}</Text>
                    </View>
                    {chMeta && (
                      <View style={[st.channelChip, { backgroundColor: chMeta.color, marginBottom: 0 }]}>
                        <Text style={st.channelText}>{chMeta.icon} {chMeta.label}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={st.negOTK}>-{appeal.originalAmount} OTK contested</Text>
                  <Text style={st.cardDesc} numberOfLines={2}>{appeal.appealReason}</Text>
                  <View style={st.row}><Text style={st.label}>Correction Report</Text><Text style={st.val}>{appeal.correctionReportId}</Text></View>
                  <View style={st.row}><Text style={st.label}>Evidence</Text><Text style={st.val}>{appeal.evidence.length} items</Text></View>
                  <View style={st.row}><Text style={st.label}>Witnesses</Text><Text style={st.val}>{appeal.witnesses.length} listed</Text></View>
                  <View style={st.row}><Text style={st.label}>Filed</Text><Text style={st.val}>{appeal.createdAt}</Text></View>

                  {/* Mini timeline */}
                  <View style={st.divider} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                    {appeal.timeline.map((step, i) => (
                      <View key={step.stage} style={{ alignItems: 'center', flex: 1 }}>
                        <View style={[
                          { width: 10, height: 10, borderRadius: 5, marginBottom: 4 },
                          { backgroundColor: step.completed ? t.accent.green : t.text.muted + '40' },
                        ]} />
                        <Text style={{ color: step.completed ? t.text.secondary : t.text.muted, fontSize: 9, fontWeight: '600' }}>
                          {step.stage.charAt(0).toUpperCase() + step.stage.slice(1)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {/* ===== SUBMIT TAB ===== */}
        {activeTab === 'submit' && (
          <>
            <View style={st.card}>
              <Text style={st.cardTitle}>Submit New Appeal</Text>
              <Text style={st.cardDesc}>
                Contest a correction report filed against you. Provide your correction report ID, explain why the report is inaccurate, and attach any supporting evidence.
              </Text>
            </View>

            <Text style={st.inputLabel}>Correction Report ID *</Text>
            <TextInput style={st.input} placeholder="corr-xxx" placeholderTextColor={t.text.muted}
              value={correctionId} onChangeText={setCorrectionId} autoCapitalize="none" />

            <Text style={st.inputLabel}>Appeal Reason *</Text>
            <TextInput style={[st.input, { minHeight: 100, textAlignVertical: 'top' }]}
              placeholder="Explain why the correction report is inaccurate or unjust..."
              placeholderTextColor={t.text.muted} value={appealReason}
              onChangeText={setAppealReason} multiline numberOfLines={5} />

            <View style={st.divider} />
            <Text style={st.section}>Initial Evidence (optional)</Text>

            <Text style={st.inputLabel}>Evidence Hash</Text>
            <TextInput style={st.input} placeholder="sha256:..." placeholderTextColor={t.text.muted}
              value={evidenceHash} onChangeText={setEvidenceHash} autoCapitalize="none" />

            <Text style={st.inputLabel}>Evidence Description</Text>
            <TextInput style={st.input} placeholder="e.g., Hospital admission record"
              placeholderTextColor={t.text.muted} value={evidenceLabel} onChangeText={setEvidenceLabel} />

            <View style={st.divider} />
            <Text style={st.section}>Initial Witness (optional)</Text>

            <Text style={st.inputLabel}>Witness UID</Text>
            <TextInput style={st.input} placeholder="uid-xxxx-..." placeholderTextColor={t.text.muted}
              value={witnessUID} onChangeText={setWitnessUID} autoCapitalize="none" />

            <Text style={st.inputLabel}>Witness Can Attest To</Text>
            <TextInput style={[st.input, { minHeight: 60, textAlignVertical: 'top' }]}
              placeholder="Brief description of what this witness can confirm..."
              placeholderTextColor={t.text.muted} value={witnessStatement}
              onChangeText={setWitnessStatement} multiline />

            <TouchableOpacity style={st.submitBtn} onPress={handleSubmitAppeal} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={st.submitBtnText}>Submit Appeal</Text>}
            </TouchableOpacity>
          </>
        )}

        {/* ===== EVIDENCE TAB ===== */}
        {activeTab === 'evidence' && (
          <>
            <View style={st.card}>
              <Text style={st.cardTitle}>Manage Evidence & Witnesses</Text>
              <Text style={st.cardDesc}>
                Add additional evidence or witnesses to an existing appeal. All evidence is stored as cryptographic hashes referencing off-chain documents. Witnesses are notified and asked to confirm their testimony.
              </Text>
            </View>

            <Text style={st.inputLabel}>Appeal ID *</Text>
            <TextInput style={st.input} placeholder="appeal-xxx" placeholderTextColor={t.text.muted}
              value={addEvidenceAppealId} onChangeText={setAddEvidenceAppealId} autoCapitalize="none" />

            <View style={st.divider} />
            <Text style={st.section}>Attach Evidence</Text>

            <Text style={st.inputLabel}>Evidence Hash *</Text>
            <TextInput style={st.input} placeholder="sha256:..." placeholderTextColor={t.text.muted}
              value={newEvidenceHash} onChangeText={setNewEvidenceHash} autoCapitalize="none" />

            <Text style={st.inputLabel}>Evidence Description *</Text>
            <TextInput style={st.input} placeholder="What does this evidence prove?"
              placeholderTextColor={t.text.muted} value={newEvidenceLabel} onChangeText={setNewEvidenceLabel} />

            <TouchableOpacity style={st.addBtn} onPress={handleAddEvidence}>
              <Text style={st.addBtnText}>Attach Evidence</Text>
            </TouchableOpacity>

            <View style={st.divider} />
            <Text style={st.section}>Add Witness</Text>

            <Text style={st.inputLabel}>Witness UID *</Text>
            <TextInput style={st.input} placeholder="uid-xxxx-..." placeholderTextColor={t.text.muted}
              value={newWitnessUID} onChangeText={setNewWitnessUID} autoCapitalize="none" />

            <Text style={st.inputLabel}>Witness Statement</Text>
            <TextInput style={[st.input, { minHeight: 60, textAlignVertical: 'top' }]}
              placeholder="What can this witness confirm?"
              placeholderTextColor={t.text.muted} value={newWitnessStatement}
              onChangeText={setNewWitnessStatement} multiline />

            <TouchableOpacity style={st.addBtn} onPress={handleAddWitness}>
              <Text style={st.addBtnText}>Add Witness</Text>
            </TouchableOpacity>

            {/* Existing evidence summary from active appeals */}
            {appeals.length > 0 && (
              <>
                <View style={st.divider} />
                <Text style={st.section}>Evidence Across All Appeals</Text>
                {appeals.map(appeal => (
                  <View key={appeal.id} style={st.card}>
                    <Text style={st.cardTitle}>{appeal.id} — {appeal.correctionReportId}</Text>
                    <Text style={[st.label, { marginBottom: 8 }]}>
                      {appeal.evidence.length} evidence items, {appeal.witnesses.length} witnesses
                    </Text>
                    {appeal.evidence.map((ev, i) => (
                      <View key={i} style={{ marginBottom: 6 }}>
                        <Text style={st.evidenceLabel}>{ev.label}</Text>
                        <Text style={st.evidenceHash}>{ev.hash}</Text>
                      </View>
                    ))}
                    {appeal.witnesses.map((w, i) => (
                      <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                        <Text style={st.label}>{w.uid}</Text>
                        <Text style={[st.witnessStatus, { color: w.confirmed ? t.accent.green : t.text.muted }]}>
                          {w.confirmed ? 'Confirmed' : 'Pending'}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
              </>
            )}
          </>
        )}

        {!demoMode && (
          <View style={[st.card, { marginTop: 20 }]}>
            <Text style={[st.cardDesc, { textAlign: 'center' }]}>
              Enable Demo Mode in Settings to see sample appeals.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
