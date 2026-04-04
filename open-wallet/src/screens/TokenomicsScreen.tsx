import { fonts } from '../utils/theme';
/**
 * Tokenomics Screen — Art III: Understand OTK economics.
 *
 * How tokens are created, distributed, earned, and how they flow through
 * the Open Chain ecosystem. 100% earned, zero pre-mine, flat rewards.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

type Tab = 'overview' | 'supply' | 'earn' | 'compare';

// ─── Demo Supply Stats ───
const DEMO_SUPPLY = {
  totalMinted: 8_247_500,
  totalBurned: 412_375,
  netSupply: 7_835_125,
  treasuryBalance: 164_950,
};

// ─── Channel Distribution (% of total minted) ───
const CHANNEL_DISTRIBUTION = [
  { channel: 'Nurture (nOTK)',     pct: 28, color: '#e91e63' },
  { channel: 'Education (eOTK)',   pct: 22, color: '#2196f3' },
  { channel: 'Health (hOTK)',      pct: 15, color: '#4caf50' },
  { channel: 'Governance (gOTK)',  pct: 12, color: '#9c27b0' },
  { channel: 'Community (cOTK)',   pct: 10, color: '#ff9800' },
  { channel: 'Environment (vOTK)', pct: 8,  color: '#00bcd4' },
  { channel: 'Staking Rewards',    pct: 3,  color: '#607d8b' },
  { channel: 'Treasury (2%)',      pct: 2,  color: '#795548' },
];

// ─── How OTK is Earned ───
const EARNING_METHODS = [
  { method: 'Milestones',   desc: 'Complete life milestones (first word, graduation, caregiving years). Each verified milestone mints OTK in the relevant channel.', icon: '🏆' },
  { method: 'Gratitude',    desc: 'Receive gratitude from others for your contributions. Each gratitude message carries a small OTK transfer from the sender.', icon: '🙏' },
  { method: 'Staking',      desc: 'Delegate OTK to validators. Earn base 5% APY + up to 3% bonus for long-term staking and validator diversity.', icon: '🔒' },
  { method: 'Governance',   desc: 'Participate in proposals and voting. Active governance contributors earn gOTK for engagement.', icon: '🗳️' },
  { method: 'Volunteering', desc: 'Log verified volunteer hours. Community-validated service earns cOTK at flat rate per hour.', icon: '🤝' },
];

// ─── Ripple Rings ───
const RIPPLE_RINGS = [
  { ring: 1, label: 'Self',      attribution: '100%', desc: 'Direct action — you did the work' },
  { ring: 2, label: 'Family',    attribution: '50%',  desc: 'Parent/caregiver who shaped you' },
  { ring: 3, label: 'Teachers',  attribution: '25%',  desc: 'Educators who taught you' },
  { ring: 4, label: 'Community', attribution: '12%',  desc: 'Neighbors, mentors, coaches' },
  { ring: 5, label: 'Society',   attribution: '6%',   desc: 'Institutions that supported you' },
  { ring: 6, label: 'Nation',    attribution: '3%',    desc: 'National infrastructure, laws, culture' },
  { ring: 7, label: 'Humanity',  attribution: '2%',    desc: 'Collective human knowledge and progress' },
];

// ─── Staking Rewards Breakdown ───
const STAKING_DETAILS = [
  { label: 'Base APY',                value: '5.0%' },
  { label: 'Long-term bonus (1yr+)',  value: '+1.0%' },
  { label: 'Validator diversity',     value: '+1.0%' },
  { label: 'Governance participation', value: '+1.0%' },
  { label: 'Maximum possible APY',    value: '8.0%' },
];

// ─── Comparison: OTK vs BTC vs ETH ───
const COMPARISON_ROWS = [
  { aspect: 'Philosophy',     otk: 'Human value recognition',     btc: 'Digital gold / store of value', eth: 'Programmable money / world computer' },
  { aspect: 'Supply',         otk: 'Unlimited, earned only',      btc: '21M cap, mined',                eth: 'Unlimited, mined + burned' },
  { aspect: 'Pre-mine',       otk: 'Zero — 100% earned',          btc: 'None (fair launch)',             eth: 'Yes (ICO)' },
  { aspect: 'Consensus',      otk: 'Proof of Humanity + Contribution', btc: 'Proof of Work',            eth: 'Proof of Stake' },
  { aspect: 'Governance',     otk: 'One human = one vote',        btc: 'No on-chain governance',        eth: 'EIP process, informal' },
  { aspect: 'Rewards',        otk: 'Flat — same for everyone',    btc: 'Proportional to hashrate',      eth: 'Proportional to stake' },
  { aspect: 'Identity',       otk: 'Universal ID required',       btc: 'Pseudonymous',                  eth: 'Pseudonymous' },
  { aspect: 'Goal',           otk: 'World peace through better upbringing', btc: 'Financial sovereignty', eth: 'Decentralized applications' },
];

export function TokenomicsScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('overview');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, backgroundColor: t.bg.card, borderRadius: 12, padding: 3 },
    tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    tabBtnActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.muted, fontSize: 13, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff', fontWeight: fonts.bold },
    heroCard: { backgroundColor: t.accent.blue + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, alignItems: 'center' },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 24 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    cardTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    cardDesc: { color: t.text.secondary, fontSize: 13, lineHeight: 20, marginTop: 6 },
    statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border },
    statLabel: { color: t.text.secondary, fontSize: 14 },
    statValue: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    channelRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    channelDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
    channelName: { color: t.text.primary, fontSize: 14, flex: 1 },
    channelPct: { color: t.text.secondary, fontSize: 14, fontWeight: fonts.bold },
    barBg: { height: 8, backgroundColor: t.border, borderRadius: 4, marginTop: 4 },
    barFill: { height: 8, borderRadius: 4 },
    earnIcon: { fontSize: 28, marginRight: 12 },
    earnRow: { flexDirection: 'row', alignItems: 'flex-start' },
    rippleRing: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border },
    ringNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: t.accent.blue + '20', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    ringNumText: { color: t.accent.blue, fontSize: 14, fontWeight: fonts.heavy },
    ringLabel: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    ringAttr: { color: t.accent.green, fontSize: 13, fontWeight: fonts.bold },
    ringDesc: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    compareTable: { backgroundColor: t.bg.card, borderRadius: 16, marginHorizontal: 20, overflow: 'hidden' },
    compareHeader: { flexDirection: 'row', backgroundColor: t.accent.blue + '15', paddingVertical: 12, paddingHorizontal: 12 },
    compareHeaderCell: { flex: 1, color: t.text.primary, fontSize: 12, fontWeight: fonts.heavy, textAlign: 'center' },
    compareRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border },
    compareCell: { flex: 1, fontSize: 11, lineHeight: 16, paddingHorizontal: 2 },
    compareLabelCell: { color: t.text.primary, fontWeight: fonts.bold },
    compareOtkCell: { color: t.accent.green },
    compareBtcCell: { color: t.text.secondary },
    compareEthCell: { color: t.text.muted },
    treasuryCard: { backgroundColor: t.accent.purple + '10', borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 12 },
    treasuryTitle: { color: t.accent.purple, fontSize: 15, fontWeight: fonts.bold },
    treasuryDesc: { color: t.text.secondary, fontSize: 13, lineHeight: 20, marginTop: 8 },
    stakingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border },
    stakingLabel: { color: t.text.secondary, fontSize: 14 },
    stakingValue: { color: t.accent.green, fontSize: 14, fontWeight: fonts.bold },
    maxApy: { color: t.accent.blue, fontWeight: fonts.heavy },
  }), [t]);

  const fmt = (n: number) => n.toLocaleString();

  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'supply',   label: 'Supply' },
    { key: 'earn',     label: 'Earn' },
    { key: 'compare',  label: 'Compare' },
  ];

  // ─── Overview Tab ───
  const renderOverview = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroTitle}>100% Earned. Zero Pre-Mine. Flat Rewards.</Text>
        <Text style={s.heroSubtitle}>
          OTK is the currency of human value. It cannot be bought, pre-mined, or accumulated by machines.
          Every token is earned through real human contribution — raising children, teaching, healing, governing, volunteering.
        </Text>
      </View>

      <Text style={s.section}>Core Principles</Text>
      <View style={s.card}>
        <Text style={s.cardTitle}>No Pre-Mine</Text>
        <Text style={s.cardDesc}>
          Zero tokens were created at genesis. Every OTK in existence was earned by a human being through verified contribution.
        </Text>
      </View>
      <View style={s.card}>
        <Text style={s.cardTitle}>Flat Rewards</Text>
        <Text style={s.cardDesc}>
          Everyone earns at the same rate. A billionaire's hour of volunteering earns the same cOTK as anyone else's.
          No advantage from wealth, hardware, or stake size.
        </Text>
      </View>
      <View style={s.card}>
        <Text style={s.cardTitle}>Multi-Channel Minting</Text>
        <Text style={s.cardDesc}>
          OTK is minted across 6 channels: Nurture, Education, Health, Governance, Community, and Environment.
          Each channel has its own prefix (nOTK, eOTK, etc.) but all are fungible as OTK.
        </Text>
      </View>
      <View style={s.card}>
        <Text style={s.cardTitle}>Treasury (2%)</Text>
        <Text style={s.cardDesc}>
          2% of all minting goes to the community treasury. The treasury is governed by one-human-one-vote proposals — no whale control.
        </Text>
      </View>

      <Text style={s.section}>Ripple Attribution</Text>
      <View style={s.card}>
        <Text style={s.cardDesc}>
          When you earn OTK, a ripple of attribution flows outward — recognizing everyone who contributed to making you who you are.
        </Text>
        {RIPPLE_RINGS.map((r) => (
          <View key={r.ring} style={s.rippleRing}>
            <View style={s.ringNumber}>
              <Text style={s.ringNumText}>{r.ring}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={s.ringLabel}>{r.label}</Text>
                <Text style={s.ringAttr}>{r.attribution}</Text>
              </View>
              <Text style={s.ringDesc}>{r.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );

  // ─── Supply Tab ───
  const renderSupply = () => {
    const supply = demoMode ? DEMO_SUPPLY : DEMO_SUPPLY; // TODO: fetch from chain
    return (
      <>
        <Text style={s.section}>Supply Statistics</Text>
        <View style={s.card}>
          <View style={s.statRow}>
            <Text style={s.statLabel}>Total Minted</Text>
            <Text style={s.statValue}>{fmt(supply.totalMinted)} OTK</Text>
          </View>
          <View style={s.statRow}>
            <Text style={s.statLabel}>Total Burned</Text>
            <Text style={s.statValue}>{fmt(supply.totalBurned)} OTK</Text>
          </View>
          <View style={s.statRow}>
            <Text style={s.statLabel}>Net Supply</Text>
            <Text style={[s.statValue, { color: t.accent.green }]}>{fmt(supply.netSupply)} OTK</Text>
          </View>
          <View style={[s.statRow, { borderBottomWidth: 0 }]}>
            <Text style={s.statLabel}>Treasury Balance</Text>
            <Text style={[s.statValue, { color: t.accent.purple }]}>{fmt(supply.treasuryBalance)} OTK</Text>
          </View>
        </View>

        <Text style={s.section}>Channel Distribution</Text>
        <View style={s.card}>
          {CHANNEL_DISTRIBUTION.map((ch) => (
            <View key={ch.channel}>
              <View style={s.channelRow}>
                <View style={[s.channelDot, { backgroundColor: ch.color }]} />
                <Text style={s.channelName}>{ch.channel}</Text>
                <Text style={s.channelPct}>{ch.pct}%</Text>
              </View>
              <View style={s.barBg}>
                <View style={[s.barFill, { width: `${ch.pct}%`, backgroundColor: ch.color }]} />
              </View>
            </View>
          ))}
        </View>

        <View style={s.treasuryCard}>
          <Text style={s.treasuryTitle}>Treasury Governance</Text>
          <Text style={s.treasuryDesc}>
            The treasury accumulates 2% of all minting. Funds are allocated through governance proposals
            voted on by Universal ID holders. One human, one vote — no whale advantage.
            Treasury funds community grants, infrastructure, education programs, and emergency aid.
          </Text>
        </View>
      </>
    );
  };

  // ─── Earn Tab ───
  const renderEarn = () => (
    <>
      <Text style={s.section}>How OTK is Earned</Text>
      {EARNING_METHODS.map((em) => (
        <View key={em.method} style={s.card}>
          <View style={s.earnRow}>
            <Text style={s.earnIcon}>{em.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{em.method}</Text>
              <Text style={s.cardDesc}>{em.desc}</Text>
            </View>
          </View>
        </View>
      ))}

      <Text style={s.section}>Staking Rewards</Text>
      <View style={s.card}>
        {STAKING_DETAILS.map((sd, i) => (
          <View key={sd.label} style={[s.stakingRow, i === STAKING_DETAILS.length - 1 && { borderBottomWidth: 0 }]}>
            <Text style={s.stakingLabel}>{sd.label}</Text>
            <Text style={[s.stakingValue, i === STAKING_DETAILS.length - 1 && s.maxApy]}>{sd.value}</Text>
          </View>
        ))}
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Why Flat Rewards?</Text>
        <Text style={s.cardDesc}>
          Traditional crypto rewards the rich — more stake means more rewards. OTK flips this: everyone earns
          at the same rate for the same contribution. A first-time parent earns the same nOTK as any other parent.
          This is not a bug — it's the core design principle. Human value is not proportional to wealth.
        </Text>
      </View>
    </>
  );

  // ─── Compare Tab ───
  const renderCompare = () => (
    <>
      <Text style={s.section}>OTK vs Bitcoin vs Ethereum</Text>
      <View style={{ marginHorizontal: 20, marginBottom: 12 }}>
        <Text style={{ color: t.text.muted, fontSize: 12, lineHeight: 18 }}>
          Philosophy comparison — not price comparison. OTK measures human contribution, not financial speculation.
        </Text>
      </View>
      <View style={s.compareTable}>
        <View style={s.compareHeader}>
          <Text style={[s.compareHeaderCell, { textAlign: 'left' }]}>Aspect</Text>
          <Text style={s.compareHeaderCell}>OTK</Text>
          <Text style={s.compareHeaderCell}>BTC</Text>
          <Text style={s.compareHeaderCell}>ETH</Text>
        </View>
        {COMPARISON_ROWS.map((row, i) => (
          <View key={row.aspect} style={[s.compareRow, i === COMPARISON_ROWS.length - 1 && { borderBottomWidth: 0 }]}>
            <Text style={[s.compareCell, s.compareLabelCell]}>{row.aspect}</Text>
            <Text style={[s.compareCell, s.compareOtkCell]}>{row.otk}</Text>
            <Text style={[s.compareCell, s.compareBtcCell]}>{row.btc}</Text>
            <Text style={[s.compareCell, s.compareEthCell]}>{row.eth}</Text>
          </View>
        ))}
      </View>

      <View style={[s.card, { marginTop: 20 }]}>
        <Text style={s.cardTitle}>The Fundamental Difference</Text>
        <Text style={s.cardDesc}>
          Bitcoin and Ethereum are financial instruments — they measure economic value. OTK measures
          human value — the invisible labor of raising children, teaching, healing, and building community.
          There is no "number go up" — there is only "humanity gets better."
        </Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Tokenomics</Text>
        <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>Close</Text></TouchableOpacity>
      </View>

      <View style={s.tabRow}>
        {TABS.map((tb) => (
          <TouchableOpacity
            key={tb.key}
            style={[s.tabBtn, tab === tb.key && s.tabBtnActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView>
        {tab === 'overview' && renderOverview()}
        {tab === 'supply'   && renderSupply()}
        {tab === 'earn'     && renderEarn()}
        {tab === 'compare'  && renderCompare()}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
