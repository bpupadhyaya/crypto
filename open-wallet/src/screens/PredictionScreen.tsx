/**
 * Prediction Screen — Community prediction markets for decisions.
 *
 * Create and participate in prediction markets where community members
 * stake OTK on outcomes of local questions. Resolved predictions pay
 * out proportionally to correct stakers.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// --- Types ---

type PredictionTab = 'active' | 'create' | 'resolved' | 'my-bets';

interface PredictionOption {
  label: string;
  stakeTotal: number; // total OTK staked
  voters: number;
}

interface Prediction {
  id: string;
  question: string;
  description: string;
  creator: string;
  options: PredictionOption[];
  resolutionDate: number;
  resolved: boolean;
  winningOption?: number; // index into options
  totalStake: number;
  createdAt: number;
}

interface MyBet {
  predictionId: string;
  question: string;
  optionIndex: number;
  optionLabel: string;
  staked: number;
  resolved: boolean;
  won: boolean;
  payout: number;
}

// --- Demo data ---

const NOW = Date.now();
const DAY = 86_400_000;

const DEMO_PREDICTIONS: Prediction[] = [
  {
    id: 'pred_001',
    question: 'Will the community bridge project finish by June?',
    description: 'The new pedestrian bridge over the creek has been under construction since January. Current estimate is May completion.',
    creator: 'Bridge Committee',
    options: [
      { label: 'Yes, by June', stakeTotal: 850, voters: 34 },
      { label: 'No, delayed past June', stakeTotal: 420, voters: 18 },
    ],
    resolutionDate: NOW + 90 * DAY,
    resolved: false,
    totalStake: 1270,
    createdAt: NOW - 20 * DAY,
  },
  {
    id: 'pred_002',
    question: 'Will this season\'s harvest exceed 500 kg?',
    description: 'Community garden plot yields have been tracked all season. Last year was 480 kg.',
    creator: 'Garden Council',
    options: [
      { label: 'Over 500 kg', stakeTotal: 600, voters: 25 },
      { label: '400-500 kg', stakeTotal: 350, voters: 15 },
      { label: 'Under 400 kg', stakeTotal: 100, voters: 5 },
    ],
    resolutionDate: NOW + 45 * DAY,
    resolved: false,
    totalStake: 1050,
    createdAt: NOW - 10 * DAY,
  },
  {
    id: 'pred_003',
    question: 'Will the new after-school program reach 50 students?',
    description: 'The coding after-school program launched last month. Currently at 32 enrolled students.',
    creator: 'Education Board',
    options: [
      { label: 'Yes, 50+', stakeTotal: 320, voters: 14 },
      { label: 'Close (40-49)', stakeTotal: 280, voters: 12 },
      { label: 'Under 40', stakeTotal: 150, voters: 8 },
    ],
    resolutionDate: NOW + 60 * DAY,
    resolved: false,
    totalStake: 750,
    createdAt: NOW - 15 * DAY,
  },
  {
    id: 'pred_004',
    question: 'Will the community solar panel installation save 30% on energy costs?',
    description: 'Solar panels were installed in January. First full-quarter results coming in April.',
    creator: 'Energy Co-op',
    options: [
      { label: '30%+ savings', stakeTotal: 500, voters: 22 },
      { label: '15-30% savings', stakeTotal: 300, voters: 13 },
      { label: 'Under 15%', stakeTotal: 80, voters: 4 },
    ],
    resolutionDate: NOW - 5 * DAY,
    resolved: true,
    winningOption: 0,
    totalStake: 880,
    createdAt: NOW - 90 * DAY,
  },
];

const DEMO_MY_BETS: MyBet[] = [
  { predictionId: 'pred_001', question: 'Will the community bridge project finish by June?', optionIndex: 0, optionLabel: 'Yes, by June', staked: 25, resolved: false, won: false, payout: 0 },
  { predictionId: 'pred_004', question: 'Will the community solar panel installation save 30% on energy costs?', optionIndex: 0, optionLabel: '30%+ savings', staked: 30, resolved: true, won: true, payout: 53 },
];

// --- Helpers ---

function formatDate(epoch: number): string {
  return new Date(epoch).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function daysUntil(epoch: number): number {
  return Math.max(0, Math.ceil((epoch - NOW) / DAY));
}

// --- Component ---

interface Props {
  onClose: () => void;
}

export function PredictionScreen({ onClose }: Props) {
  const t = useTheme();
  const demoMode = useWalletStore((s) => s.demoMode);

  const [tab, setTab] = useState<PredictionTab>('active');
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [resolveDays, setResolveDays] = useState('30');
  const [stakeAmount, setStakeAmount] = useState('');

  const active = useMemo(() => DEMO_PREDICTIONS.filter(p => !p.resolved), []);
  const resolved = useMemo(() => DEMO_PREDICTIONS.filter(p => p.resolved), []);

  const tabs: { key: PredictionTab; label: string }[] = [
    { key: 'active', label: `Active (${active.length})` },
    { key: 'create', label: 'Create' },
    { key: 'resolved', label: `Resolved (${resolved.length})` },
    { key: 'my-bets', label: `My Bets (${DEMO_MY_BETS.length})` },
  ];

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    headerTitle: { color: t.text.primary, fontSize: 20, fontWeight: '700' },
    closeText: { color: t.accent.blue, fontSize: 16 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 8, gap: 4 },
    tabBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: t.bg.card },
    tabBtnActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: 12, fontWeight: '600' },
    tabTextActive: { color: '#fff' },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 20, marginBottom: 8, marginLeft: 4 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    cardTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 4 },
    cardSub: { color: t.text.secondary, fontSize: 13, lineHeight: 19 },
    cardMeta: { color: t.text.muted, fontSize: 11, marginTop: 8 },
    optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.bg.primary },
    optionLabel: { color: t.text.primary, fontSize: 14, fontWeight: '600', flex: 1 },
    optionStake: { color: t.accent.blue, fontSize: 13, fontWeight: '700', marginRight: 12 },
    optionVoters: { color: t.text.muted, fontSize: 12 },
    barBg: { height: 6, borderRadius: 3, backgroundColor: t.bg.primary, marginTop: 4, marginBottom: 2 },
    barFill: { height: 6, borderRadius: 3, backgroundColor: t.accent.blue },
    winnerBar: { backgroundColor: '#34c759' },
    totalStake: { color: t.text.secondary, fontSize: 13, fontWeight: '600', marginTop: 10 },
    stakeRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
    stakeInput: { flex: 1, backgroundColor: t.bg.primary, borderRadius: 10, padding: 10, color: t.text.primary, fontSize: 14 },
    stakeBtn: { backgroundColor: t.accent.blue, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, justifyContent: 'center' },
    stakeBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: '600', marginTop: 16, marginBottom: 6 },
    input: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15 },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    submitBtn: { backgroundColor: t.accent.blue, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    betCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    betResult: { fontSize: 13, fontWeight: '700', marginTop: 6 },
    winText: { color: '#34c759' },
    pendingText: { color: '#f5a623' },
    resolvedBadge: { backgroundColor: '#34c759', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 8 },
    resolvedBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40 },
  }), [t]);

  const renderPredictionCard = (p: Prediction) => (
    <View key={p.id} style={st.card}>
      {p.resolved && (
        <View style={st.resolvedBadge}>
          <Text style={st.resolvedBadgeText}>Resolved</Text>
        </View>
      )}
      <Text style={st.cardTitle}>{p.question}</Text>
      <Text style={st.cardSub}>{p.description}</Text>
      {p.options.map((opt, i) => {
        const pct = p.totalStake > 0 ? (opt.stakeTotal / p.totalStake) * 100 : 0;
        const isWinner = p.resolved && p.winningOption === i;
        return (
          <View key={i}>
            <View style={st.optionRow}>
              <Text style={st.optionLabel}>
                {isWinner ? '\u2705 ' : ''}{opt.label}
              </Text>
              <Text style={st.optionStake}>{opt.stakeTotal} OTK</Text>
              <Text style={st.optionVoters}>{opt.voters} voters</Text>
            </View>
            <View style={st.barBg}>
              <View style={[st.barFill, { width: `${pct}%` }, isWinner && st.winnerBar]} />
            </View>
          </View>
        );
      })}
      <Text style={st.totalStake}>{'\u{1F4B0}'} Total: {p.totalStake} OTK staked</Text>
      {!p.resolved && (
        <View style={st.stakeRow}>
          <TextInput
            style={st.stakeInput}
            placeholder="Stake OTK"
            placeholderTextColor={t.text.muted}
            keyboardType="numeric"
          />
          <TouchableOpacity style={st.stakeBtn}>
            <Text style={st.stakeBtnText}>Stake</Text>
          </TouchableOpacity>
        </View>
      )}
      <Text style={st.cardMeta}>
        By {p.creator} {'\u2022'} {p.resolved ? 'Resolved' : `Resolves ${formatDate(p.resolutionDate)} (${daysUntil(p.resolutionDate)}d)`}
      </Text>
    </View>
  );

  const renderActive = () => (
    <View>
      <Text style={st.section}>Active Predictions</Text>
      {active.length === 0 ? (
        <Text style={st.emptyText}>No active predictions.</Text>
      ) : active.map(renderPredictionCard)}
    </View>
  );

  const renderCreate = () => (
    <View>
      <Text style={st.section}>Create a Prediction</Text>
      <Text style={st.inputLabel}>Question</Text>
      <TextInput
        style={st.input}
        placeholder="What do you want to predict?"
        placeholderTextColor={t.text.muted}
        value={question}
        onChangeText={setQuestion}
      />
      <Text style={st.inputLabel}>Description</Text>
      <TextInput
        style={[st.input, st.textArea]}
        placeholder="Provide context for the prediction..."
        placeholderTextColor={t.text.muted}
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <Text style={st.inputLabel}>Option A</Text>
      <TextInput
        style={st.input}
        placeholder="e.g. Yes"
        placeholderTextColor={t.text.muted}
        value={optionA}
        onChangeText={setOptionA}
      />
      <Text style={st.inputLabel}>Option B</Text>
      <TextInput
        style={st.input}
        placeholder="e.g. No"
        placeholderTextColor={t.text.muted}
        value={optionB}
        onChangeText={setOptionB}
      />
      <Text style={st.inputLabel}>Resolution (days from now)</Text>
      <TextInput
        style={st.input}
        placeholder="30"
        placeholderTextColor={t.text.muted}
        value={resolveDays}
        onChangeText={setResolveDays}
        keyboardType="numeric"
      />
      <Text style={st.inputLabel}>Initial Stake (OTK)</Text>
      <TextInput
        style={st.input}
        placeholder="e.g. 10"
        placeholderTextColor={t.text.muted}
        value={stakeAmount}
        onChangeText={setStakeAmount}
        keyboardType="numeric"
      />
      <TouchableOpacity style={st.submitBtn}>
        <Text style={st.submitBtnText}>{'\u{1F52E}'} Create Prediction</Text>
      </TouchableOpacity>
    </View>
  );

  const renderResolved = () => (
    <View>
      <Text style={st.section}>Resolved Predictions</Text>
      {resolved.length === 0 ? (
        <Text style={st.emptyText}>No resolved predictions yet.</Text>
      ) : resolved.map(renderPredictionCard)}
    </View>
  );

  const renderMyBets = () => (
    <View>
      <Text style={st.section}>My Bets</Text>
      {DEMO_MY_BETS.length === 0 ? (
        <Text style={st.emptyText}>You haven't placed any bets yet.</Text>
      ) : DEMO_MY_BETS.map((b, i) => (
        <View key={i} style={st.betCard}>
          <Text style={st.cardTitle}>{b.question}</Text>
          <Text style={st.cardSub}>Your pick: {b.optionLabel}</Text>
          <Text style={st.cardSub}>Staked: {b.staked} OTK</Text>
          {b.resolved ? (
            <Text style={[st.betResult, b.won ? st.winText : { color: '#ff3b30' }]}>
              {b.won ? `\u2705 Won! Payout: ${b.payout} OTK` : '\u274C Lost'}
            </Text>
          ) : (
            <Text style={[st.betResult, st.pendingText]}>{'\u23F3'} Awaiting resolution</Text>
          )}
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.headerTitle}>{'\u{1F52E}'} Predictions</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeText}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={st.tabRow}>
        {tabs.map(tb => (
          <TouchableOpacity
            key={tb.key}
            style={[st.tabBtn, tab === tb.key && st.tabBtnActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={[st.tabText, tab === tb.key && st.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={st.scroll}>
        {tab === 'active' && renderActive()}
        {tab === 'create' && renderCreate()}
        {tab === 'resolved' && renderResolved()}
        {tab === 'my-bets' && renderMyBets()}
      </ScrollView>
    </SafeAreaView>
  );
}
