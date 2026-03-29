/**
 * Arbitration Screen — Art V: Formal dispute arbitration (deeper than mediation).
 *
 * Active arbitrations with case details, arbiter selection,
 * case proceedings, binding resolution recorded on-chain,
 * and appeal process to governance.
 * Demo mode provides sample cases and qualified arbiters.
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

interface ArbitrationCase {
  id: string;
  claimant: string;
  respondent: string;
  arbiter: string;
  disputeType: string;
  description: string;
  evidenceCount: number;
  hearings: { date: string; type: string; status: string }[];
  status: 'active' | 'deliberation' | 'resolved' | 'appealed';
  filedAt: string;
  resolvedAt?: string;
  ruling?: string;
  otkTransfer?: { from: string; to: string; amount: number };
}

interface Arbiter {
  id: string;
  name: string;
  expertise: string[];
  casesResolved: number;
  trustScore: number;
  available: boolean;
  avgResolutionDays: number;
}

type TabKey = 'cases' | 'request' | 'arbiters' | 'resolved';

const DEMO_CASES: ArbitrationCase[] = [
  {
    id: 'arb-001',
    claimant: 'openchain1abc...claimant1',
    respondent: 'openchain1def...respond1',
    arbiter: 'Arbiter Priya M.',
    disputeType: 'Contract Breach',
    description: 'Software delivery contract — respondent delivered incomplete product missing 3 of 8 agreed modules. Mediation failed after 2 sessions.',
    evidenceCount: 7,
    hearings: [
      { date: '2026-03-20', type: 'Opening Statements', status: 'completed' },
      { date: '2026-03-25', type: 'Evidence Review', status: 'completed' },
      { date: '2026-04-01', type: 'Written Arguments', status: 'scheduled' },
    ],
    status: 'active',
    filedAt: '2026-03-18',
  },
  {
    id: 'arb-002',
    claimant: 'openchain1ghi...claimant2',
    respondent: 'openchain1jkl...respond2',
    arbiter: 'Arbiter Kenji T.',
    disputeType: 'Payment Dispute',
    description: 'Freelance design work — claimant completed all deliverables but respondent withheld final payment of 2,400 OTK claiming unsatisfactory quality.',
    evidenceCount: 12,
    hearings: [
      { date: '2026-03-15', type: 'Opening Statements', status: 'completed' },
      { date: '2026-03-22', type: 'Evidence Review', status: 'completed' },
      { date: '2026-03-27', type: 'Written Arguments', status: 'completed' },
    ],
    status: 'deliberation',
    filedAt: '2026-03-12',
  },
];

const DEMO_RESOLVED: ArbitrationCase = {
  id: 'arb-003',
  claimant: 'openchain1mno...claimant3',
  respondent: 'openchain1pqr...respond3',
  arbiter: 'Arbiter Fatima S.',
  disputeType: 'Service Quality',
  description: 'Agricultural consulting services — consultant provided outdated recommendations leading to crop loss. Binding ruling awarded partial compensation.',
  evidenceCount: 9,
  hearings: [
    { date: '2026-02-20', type: 'Opening Statements', status: 'completed' },
    { date: '2026-02-27', type: 'Evidence Review', status: 'completed' },
    { date: '2026-03-05', type: 'Written Arguments', status: 'completed' },
    { date: '2026-03-10', type: 'Final Ruling', status: 'completed' },
  ],
  status: 'resolved',
  filedAt: '2026-02-18',
  resolvedAt: '2026-03-10',
  ruling: 'Respondent to pay 60% of claimed damages (1,800 OTK) to claimant. Respondent\'s services were partially adequate but failed to meet agreed standards on soil analysis and crop rotation advice.',
  otkTransfer: { from: 'openchain1pqr...respond3', to: 'openchain1mno...claimant3', amount: 1800 },
};

const DEMO_ARBITERS: Arbiter[] = [
  {
    id: 'arbiter-1', name: 'Arbiter Priya M.',
    expertise: ['Contract Law', 'Technology', 'IP Disputes'],
    casesResolved: 47, trustScore: 94, available: false, avgResolutionDays: 18,
  },
  {
    id: 'arbiter-2', name: 'Arbiter Kenji T.',
    expertise: ['Payment Disputes', 'Commerce', 'Financial'],
    casesResolved: 62, trustScore: 97, available: true, avgResolutionDays: 14,
  },
  {
    id: 'arbiter-3', name: 'Arbiter Fatima S.',
    expertise: ['Agriculture', 'Service Quality', 'Environment'],
    casesResolved: 35, trustScore: 91, available: true, avgResolutionDays: 21,
  },
];

const DISPUTE_TYPES = ['Contract Breach', 'Payment Dispute', 'Service Quality', 'Property Damage', 'IP Infringement', 'Other'];

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  deliberation: 'In Deliberation',
  resolved: 'Resolved',
  appealed: 'Appealed',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#3B82F6',
  deliberation: '#F59E0B',
  resolved: '#10B981',
  appealed: '#EF4444',
};

export function ArbitrationScreen({ onClose }: Props) {
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const [tab, setTab] = useState<TabKey>('cases');
  const [allCases] = useState<ArbitrationCase[]>([...DEMO_CASES, DEMO_RESOLVED]);
  const [arbiters] = useState<Arbiter[]>(DEMO_ARBITERS);
  const [selectedCase, setSelectedCase] = useState<ArbitrationCase | null>(null);
  const [loading, setLoading] = useState(false);

  // Request form state
  const [reqType, setReqType] = useState('');
  const [reqDesc, setReqDesc] = useState('');
  const [reqEvidence, setReqEvidence] = useState('');

  const activeCases = useMemo(() => allCases.filter((c) => c.status === 'active' || c.status === 'deliberation'), [allCases]);
  const resolvedCases = useMemo(() => allCases.filter((c) => c.status === 'resolved' || c.status === 'appealed'), [allCases]);

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '700' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingHorizontal: 16 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 20, marginBottom: 8, marginLeft: 4 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    label: { color: t.text.secondary, fontSize: 13 },
    value: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
    statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', color: '#fff' },
    titleText: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 4 },
    descText: { color: t.text.secondary, fontSize: 13, marginBottom: 8, lineHeight: 18 },
    tabRow: { flexDirection: 'row', gap: 6, marginBottom: 16, flexWrap: 'wrap' },
    tab: { flex: 1, minWidth: 70, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: t.bg.card },
    tabActive: { backgroundColor: t.accent.green },
    tabText: { color: t.text.secondary, fontSize: 12, fontWeight: '600' },
    tabTextActive: { color: '#fff' },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', paddingVertical: 40 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.border },
    detailLabel: { color: t.text.secondary, fontSize: 13 },
    detailValue: { color: t.text.primary, fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
    btn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
    btnPrimary: { backgroundColor: t.accent.green },
    btnSecondary: { backgroundColor: t.accent.blue },
    btnDanger: { backgroundColor: t.accent.red },
    btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    input: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 14, marginBottom: 12 },
    inputMulti: { minHeight: 80, textAlignVertical: 'top' },
    hearingCard: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 12, marginBottom: 8, borderLeftWidth: 3 },
    hearingType: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    hearingDate: { color: t.text.secondary, fontSize: 12 },
    hearingStatus: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    arbiterCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    arbiterName: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 4 },
    expertiseRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 8 },
    expertiseTag: { backgroundColor: t.accent.blue + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    expertiseText: { color: t.accent.blue, fontSize: 11, fontWeight: '600' },
    trustBar: { height: 6, borderRadius: 3, backgroundColor: t.bg.primary, marginTop: 4 },
    trustFill: { height: 6, borderRadius: 3 },
    rulingCard: { backgroundColor: t.accent.green + '15', borderRadius: 12, padding: 14, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: t.accent.green },
    rulingText: { color: t.text.primary, fontSize: 14, lineHeight: 20 },
    transferCard: { backgroundColor: t.accent.blue + '15', borderRadius: 12, padding: 14, marginBottom: 12 },
    selectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    selectChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: t.bg.card },
    selectChipActive: { backgroundColor: t.accent.green },
    selectChipText: { color: t.text.secondary, fontSize: 13 },
    selectChipTextActive: { color: '#fff', fontWeight: '600' },
    warningCard: { backgroundColor: t.accent.yellow + '15', borderRadius: 12, padding: 14, marginBottom: 16 },
    warningText: { color: t.accent.yellow, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  }), [t]);

  const handleSubmitRequest = useCallback(() => {
    if (!reqType) { Alert.alert('Required', 'Please select a dispute type.'); return; }
    if (!reqDesc.trim()) { Alert.alert('Required', 'Please describe your case.'); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Arbitration Requested', 'Your case has been filed. A qualified arbiter will be assigned within 48 hours.');
      setReqType('');
      setReqDesc('');
      setReqEvidence('');
      setTab('cases');
    }, 1200);
  }, [reqType, reqDesc]);

  const handleAppeal = useCallback((c: ArbitrationCase) => {
    Alert.alert(
      'Appeal Ruling',
      'Escalate this case to community governance? The governance council will review the arbiter\'s ruling. This costs 50 OTK filing fee.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'File Appeal',
          onPress: () => {
            setLoading(true);
            setTimeout(() => {
              setLoading(false);
              Alert.alert('Appeal Filed', 'Your appeal has been escalated to governance. The council will review within 7 days.');
            }, 1000);
          },
        },
      ]
    );
  }, []);

  // ─── Case Detail View ───
  if (selectedCase) {
    const c = selectedCase;
    return (
      <SafeAreaView style={st.container}>
        <View style={st.header}>
          <TouchableOpacity onPress={() => setSelectedCase(null)}>
            <Text style={st.closeBtn}>Back</Text>
          </TouchableOpacity>
          <Text style={st.title}>Case Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={st.scroll}>
          <View style={st.card}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Text style={st.titleText}>{c.disputeType}</Text>
              <View style={[st.statusBadge, { backgroundColor: STATUS_COLORS[c.status] || '#666' }]}>
                <Text style={st.statusText}>{STATUS_LABELS[c.status]}</Text>
              </View>
            </View>

            <View style={st.detailRow}>
              <Text style={st.detailLabel}>Case ID</Text>
              <Text style={st.detailValue}>{c.id}</Text>
            </View>
            <View style={st.detailRow}>
              <Text style={st.detailLabel}>Claimant</Text>
              <Text style={st.detailValue}>{c.claimant}</Text>
            </View>
            <View style={st.detailRow}>
              <Text style={st.detailLabel}>Respondent</Text>
              <Text style={st.detailValue}>{c.respondent}</Text>
            </View>
            <View style={st.detailRow}>
              <Text style={st.detailLabel}>Arbiter</Text>
              <Text style={st.detailValue}>{c.arbiter}</Text>
            </View>
            <View style={st.detailRow}>
              <Text style={st.detailLabel}>Evidence Submitted</Text>
              <Text style={st.detailValue}>{c.evidenceCount} items</Text>
            </View>
            <View style={st.detailRow}>
              <Text style={st.detailLabel}>Filed</Text>
              <Text style={st.detailValue}>{c.filedAt}</Text>
            </View>
            {c.resolvedAt && (
              <View style={st.detailRow}>
                <Text style={st.detailLabel}>Resolved</Text>
                <Text style={st.detailValue}>{c.resolvedAt}</Text>
              </View>
            )}
          </View>

          <Text style={st.descText}>{c.description}</Text>

          {/* Hearing Schedule */}
          <Text style={st.section}>Case Proceedings</Text>
          {c.hearings.map((h, i) => (
            <View key={i} style={[st.hearingCard, {
              borderLeftColor: h.status === 'completed' ? t.accent.green : t.accent.yellow,
            }]}>
              <View style={st.row}>
                <Text style={st.hearingType}>{h.type}</Text>
                <Text style={[st.hearingStatus, {
                  color: h.status === 'completed' ? t.accent.green : t.accent.yellow,
                }]}>{h.status}</Text>
              </View>
              <Text style={st.hearingDate}>{h.date}</Text>
            </View>
          ))}

          {/* Ruling (for resolved cases) */}
          {c.ruling && (
            <>
              <Text style={st.section}>Binding Ruling</Text>
              <View style={st.rulingCard}>
                <Text style={st.rulingText}>{c.ruling}</Text>
              </View>
            </>
          )}

          {/* OTK Transfer (for resolved cases) */}
          {c.otkTransfer && (
            <View style={st.transferCard}>
              <View style={st.row}>
                <Text style={st.label}>On-Chain Transfer</Text>
                <Text style={[st.value, { color: t.accent.green }]}>{c.otkTransfer.amount} OTK</Text>
              </View>
              <Text style={[st.label, { fontSize: 11 }]}>
                From: {c.otkTransfer.from}
              </Text>
              <Text style={[st.label, { fontSize: 11, marginTop: 2 }]}>
                To: {c.otkTransfer.to}
              </Text>
            </View>
          )}

          {/* Appeal button for resolved cases */}
          {c.status === 'resolved' && (
            <>
              <View style={st.warningCard}>
                <Text style={st.warningText}>
                  Disagree with the ruling? You may appeal to community governance. Filing fee: 50 OTK.
                </Text>
              </View>
              <TouchableOpacity style={[st.btn, st.btnDanger]} onPress={() => handleAppeal(c)} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={st.btnText}>Appeal to Governance</Text>}
              </TouchableOpacity>
            </>
          )}

          {/* Evidence submission for active cases */}
          {c.status === 'active' && (
            <TouchableOpacity
              style={[st.btn, st.btnSecondary]}
              onPress={() => Alert.alert('Submit Evidence', 'Upload documents, screenshots, or written arguments to support your case.')}
            >
              <Text style={st.btnText}>Submit Evidence</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Tabs ───
  const TABS: { key: TabKey; label: string }[] = [
    { key: 'cases', label: `Cases (${activeCases.length})` },
    { key: 'request', label: 'Request' },
    { key: 'arbiters', label: `Arbiters (${arbiters.length})` },
    { key: 'resolved', label: `Resolved (${resolvedCases.length})` },
  ];

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeBtn}>Close</Text>
        </TouchableOpacity>
        <Text style={st.title}>Arbitration</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        <View style={st.tabRow}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[st.tab, tab === t.key && st.tabActive]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[st.tabText, tab === t.key && st.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={st.scroll}>
        {/* ─── Active Cases Tab ─── */}
        {tab === 'cases' && (
          <>
            {activeCases.length === 0 ? (
              <Text style={st.emptyText}>No active arbitration cases.</Text>
            ) : (
              activeCases.map((c) => (
                <TouchableOpacity key={c.id} style={st.card} onPress={() => setSelectedCase(c)} activeOpacity={0.7}>
                  <View style={st.row}>
                    <Text style={st.titleText}>{c.disputeType}</Text>
                    <View style={[st.statusBadge, { backgroundColor: STATUS_COLORS[c.status] || '#666' }]}>
                      <Text style={st.statusText}>{STATUS_LABELS[c.status]}</Text>
                    </View>
                  </View>
                  <Text style={st.descText} numberOfLines={2}>{c.description}</Text>
                  <View style={st.row}>
                    <Text style={st.label}>Arbiter</Text>
                    <Text style={st.value}>{c.arbiter}</Text>
                  </View>
                  <View style={st.row}>
                    <Text style={st.label}>Evidence</Text>
                    <Text style={st.label}>{c.evidenceCount} items</Text>
                  </View>
                  <View style={st.row}>
                    <Text style={st.label}>Next Hearing</Text>
                    <Text style={st.label}>
                      {c.hearings.find((h) => h.status === 'scheduled')?.date || 'None scheduled'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        {/* ─── Request Arbitration Tab ─── */}
        {tab === 'request' && (
          <>
            <Text style={st.section}>Dispute Type</Text>
            <View style={st.selectRow}>
              {DISPUTE_TYPES.map((dt) => (
                <TouchableOpacity
                  key={dt}
                  style={[st.selectChip, reqType === dt && st.selectChipActive]}
                  onPress={() => setReqType(dt)}
                >
                  <Text style={[st.selectChipText, reqType === dt && st.selectChipTextActive]}>{dt}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={st.section}>Describe Your Case</Text>
            <TextInput
              style={[st.input, st.inputMulti]}
              placeholder="Explain the dispute, what happened, and what resolution you seek..."
              placeholderTextColor={t.text.muted}
              value={reqDesc}
              onChangeText={setReqDesc}
              multiline
            />

            <Text style={st.section}>Evidence Summary (Optional)</Text>
            <TextInput
              style={[st.input, st.inputMulti]}
              placeholder="List documents, screenshots, or other evidence you will submit..."
              placeholderTextColor={t.text.muted}
              value={reqEvidence}
              onChangeText={setReqEvidence}
              multiline
            />

            <View style={st.warningCard}>
              <Text style={st.warningText}>
                Arbitration is binding. The arbiter's decision will be recorded on-chain and any OTK transfer will be enforced automatically. Filing fee: 100 OTK.
              </Text>
            </View>

            <TouchableOpacity style={[st.btn, st.btnPrimary]} onPress={handleSubmitRequest} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={st.btnText}>Submit Arbitration Request</Text>}
            </TouchableOpacity>
          </>
        )}

        {/* ─── Arbiters Tab ─── */}
        {tab === 'arbiters' && (
          <>
            {arbiters.map((a) => (
              <View key={a.id} style={st.arbiterCard}>
                <View style={st.row}>
                  <Text style={st.arbiterName}>{a.name}</Text>
                  <View style={[st.statusBadge, { backgroundColor: a.available ? t.accent.green : t.text.muted }]}>
                    <Text style={st.statusText}>{a.available ? 'Available' : 'Busy'}</Text>
                  </View>
                </View>

                <View style={st.expertiseRow}>
                  {a.expertise.map((e) => (
                    <View key={e} style={st.expertiseTag}>
                      <Text style={st.expertiseText}>{e}</Text>
                    </View>
                  ))}
                </View>

                <View style={st.row}>
                  <Text style={st.label}>Cases Resolved</Text>
                  <Text style={st.value}>{a.casesResolved}</Text>
                </View>
                <View style={st.row}>
                  <Text style={st.label}>Avg Resolution</Text>
                  <Text style={st.value}>{a.avgResolutionDays} days</Text>
                </View>
                <View style={st.row}>
                  <Text style={st.label}>Community Trust</Text>
                  <Text style={[st.value, { color: a.trustScore >= 95 ? t.accent.green : t.accent.blue }]}>
                    {a.trustScore}%
                  </Text>
                </View>
                <View style={st.trustBar}>
                  <View style={[st.trustFill, {
                    width: `${a.trustScore}%`,
                    backgroundColor: a.trustScore >= 95 ? t.accent.green : t.accent.blue,
                  }]} />
                </View>
              </View>
            ))}
          </>
        )}

        {/* ─── Resolved Tab ─── */}
        {tab === 'resolved' && (
          <>
            {resolvedCases.length === 0 ? (
              <Text style={st.emptyText}>No resolved arbitration cases.</Text>
            ) : (
              resolvedCases.map((c) => (
                <TouchableOpacity key={c.id} style={st.card} onPress={() => setSelectedCase(c)} activeOpacity={0.7}>
                  <View style={st.row}>
                    <Text style={st.titleText}>{c.disputeType}</Text>
                    <View style={[st.statusBadge, { backgroundColor: STATUS_COLORS[c.status] || '#666' }]}>
                      <Text style={st.statusText}>{STATUS_LABELS[c.status]}</Text>
                    </View>
                  </View>
                  <Text style={st.descText} numberOfLines={2}>{c.description}</Text>
                  {c.otkTransfer && (
                    <View style={st.row}>
                      <Text style={st.label}>OTK Enforced</Text>
                      <Text style={[st.value, { color: t.accent.green }]}>{c.otkTransfer.amount} OTK</Text>
                    </View>
                  )}
                  <View style={st.row}>
                    <Text style={st.label}>Resolved</Text>
                    <Text style={st.label}>{c.resolvedAt}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        {!demoMode && activeCases.length === 0 && tab === 'cases' && (
          <View style={[st.card, { alignItems: 'center' }]}>
            <Text style={{ color: t.text.muted, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
              Enable Demo Mode in Settings to see sample arbitration cases. Cases are created when mediation fails to resolve a dispute.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
