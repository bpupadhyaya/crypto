import { fonts } from '../utils/theme';
/**
 * Referral Screen — Invite friends, ambassador tracking, community growth.
 *
 * Art X: Every person who joins Open Chain through your invitation
 * strengthens the network. Referral rewards recognize those who
 * grow the community — ambassadors of a better world.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Share, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// --- Types ---

interface Props {
  onClose: () => void;
}

type Tab = 'invite' | 'stats' | 'tree' | 'leaderboard';

interface ReferralNode {
  name: string;
  joined: string;
  tier: string;
  children: ReferralNode[];
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  referrals: number;
  tier: string;
  otkEarned: number;
}

// --- Constants ---

const TIER_THRESHOLDS = [
  { min: 1, max: 5, name: 'Bronze', icon: '\u{1F7E4}', color: '#cd7f32' },
  { min: 6, max: 15, name: 'Silver', icon: '\u26AA', color: '#c0c0c0' },
  { min: 16, max: 30, name: 'Gold', icon: '\u{1F7E1}', color: '#ffd700' },
  { min: 31, max: Infinity, name: 'Platinum', icon: '\u{1F48E}', color: '#e5e4e2' },
];

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'invite', label: 'Invite', icon: '\u{1F4E8}' },
  { key: 'stats', label: 'Stats', icon: '\u{1F4CA}' },
  { key: 'tree', label: 'Tree', icon: '\u{1F333}' },
  { key: 'leaderboard', label: 'Leaders', icon: '\u{1F3C6}' },
];

// --- Demo data ---

const DEMO_REFERRAL_CODE = 'OW-BHIM-X7K2';
const DEMO_REFERRAL_LINK = 'https://openwallet.app/join?ref=OW-BHIM-X7K2';

const DEMO_STATS = {
  invited: 18,
  joined: 12,
  otkEarned: 360,
  pendingInvites: 6,
  tier: 'Silver',
  tierIcon: '\u26AA',
  tierColor: '#c0c0c0',
  nextTier: 'Gold',
  nextTierAt: 16,
};

const DEMO_TREE: ReferralNode = {
  name: 'You',
  joined: '2026-01-15',
  tier: 'Silver',
  children: [
    {
      name: 'Aarav P.',
      joined: '2026-02-01',
      tier: 'Bronze',
      children: [
        { name: 'Priya K.', joined: '2026-02-20', tier: 'Bronze', children: [] },
        { name: 'Rahul S.', joined: '2026-03-01', tier: 'Bronze', children: [] },
      ],
    },
    {
      name: 'Maya J.',
      joined: '2026-02-10',
      tier: 'Bronze',
      children: [
        { name: 'Sam T.', joined: '2026-03-05', tier: 'Bronze', children: [] },
      ],
    },
    {
      name: 'Leo W.',
      joined: '2026-02-14',
      tier: 'Bronze',
      children: [
        { name: 'Zara M.', joined: '2026-03-12', tier: 'Bronze', children: [] },
        { name: 'Kai N.', joined: '2026-03-15', tier: 'Bronze', children: [] },
        { name: 'Nina R.', joined: '2026-03-18', tier: 'Bronze', children: [] },
      ],
    },
    { name: 'Aria D.', joined: '2026-02-20', tier: 'Bronze', children: [] },
    { name: 'Finn L.', joined: '2026-03-01', tier: 'Bronze', children: [] },
    { name: 'Isla B.', joined: '2026-03-05', tier: 'Bronze', children: [] },
    { name: 'Oscar H.', joined: '2026-03-08', tier: 'Bronze', children: [] },
    { name: 'Ella C.', joined: '2026-03-10', tier: 'Bronze', children: [] },
    { name: 'Noah G.', joined: '2026-03-12', tier: 'Bronze', children: [] },
    { name: 'Lily V.', joined: '2026-03-14', tier: 'Bronze', children: [] },
    { name: 'Ethan Q.', joined: '2026-03-16', tier: 'Bronze', children: [] },
    { name: 'Mia F.', joined: '2026-03-20', tier: 'Bronze', children: [] },
  ],
};

const DEMO_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: 'Ananya S.', referrals: 87, tier: 'Platinum', otkEarned: 4350 },
  { rank: 2, name: 'David K.', referrals: 64, tier: 'Platinum', otkEarned: 3200 },
  { rank: 3, name: 'Fatima A.', referrals: 45, tier: 'Platinum', otkEarned: 2250 },
  { rank: 4, name: 'Chen W.', referrals: 38, tier: 'Platinum', otkEarned: 1900 },
  { rank: 5, name: 'Maria L.', referrals: 29, tier: 'Gold', otkEarned: 1450 },
  { rank: 6, name: 'James R.', referrals: 24, tier: 'Gold', otkEarned: 1200 },
  { rank: 7, name: 'Priya M.', referrals: 19, tier: 'Gold', otkEarned: 950 },
  { rank: 8, name: 'You', referrals: 12, tier: 'Silver', otkEarned: 360 },
  { rank: 9, name: 'Alex T.', referrals: 9, tier: 'Silver', otkEarned: 270 },
  { rank: 10, name: 'Sara B.', referrals: 4, tier: 'Bronze', otkEarned: 120 },
];

// --- Component ---

export function ReferralScreen({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('invite');
  const [codeCopied, setCodeCopied] = useState(false);
  const t = useTheme();
  const demoMode = useWalletStore(s => s.demoMode);

  const currentTier = useMemo(() =>
    TIER_THRESHOLDS.find(tr => DEMO_STATS.joined >= tr.min && DEMO_STATS.joined <= tr.max)!,
    [],
  );

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Join Open Wallet and earn OTK!\n\nUse my referral code: ${DEMO_REFERRAL_CODE}\n\n${DEMO_REFERRAL_LINK}`,
      });
    } catch (_e) {
      // user cancelled
    }
  }, []);

  const handleCopyCode = useCallback(() => {
    setCodeCopied(true);
    Alert.alert('Copied!', `Referral code ${DEMO_REFERRAL_CODE} copied to clipboard.`);
    setTimeout(() => setCodeCopied(false), 3000);
  }, []);

  // --- Tree renderer ---

  const renderTreeNode = useCallback((node: ReferralNode, depth: number, isLast: boolean) => {
    const indent = depth * 24;
    const connector = depth === 0 ? '' : isLast ? '\u2514\u2500 ' : '\u251C\u2500 ';
    return (
      <View key={`${node.name}-${depth}`}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: indent, marginBottom: 6 }}>
          <Text style={{ color: t.text.muted, fontSize: 13, fontFamily: 'monospace' }}>{connector}</Text>
          <View style={{ backgroundColor: depth === 0 ? t.accent.purple + '20' : t.bg.card, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 14 }}>{depth === 0 ? '\u{1F451}' : '\u{1F464}'}</Text>
            <Text style={{ color: t.text.primary, fontSize: 13, fontWeight: fonts.semibold }}>{node.name}</Text>
            <Text style={{ color: t.text.muted, fontSize: 11 }}>{node.joined}</Text>
          </View>
        </View>
        {node.children.map((child, i) => renderTreeNode(child, depth + 1, i === node.children.length - 1))}
      </View>
    );
  }, [t]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    tabBar: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: t.bg.card, borderRadius: 14, padding: 4, marginBottom: 16 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: t.accent.purple },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    heroCard: { backgroundColor: t.accent.purple + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    codeCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    codeLabel: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
    codeText: { color: t.accent.purple, fontSize: 28, fontWeight: fonts.heavy, letterSpacing: 2 },
    linkText: { color: t.text.muted, fontSize: 11, marginTop: 8, textAlign: 'center' },
    actionRow: { flexDirection: 'row', gap: 12, marginHorizontal: 20, marginBottom: 16 },
    actionBtn: { flex: 1, backgroundColor: t.accent.purple, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
    actionBtnSecondary: { flex: 1, backgroundColor: t.bg.card, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
    actionBtnText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    actionBtnTextSecondary: { color: t.accent.purple, fontSize: 15, fontWeight: fonts.bold },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 8 },
    statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20, marginBottom: 16 },
    statCard: { width: '47%' as any, backgroundColor: t.bg.card, borderRadius: 16, padding: 16 },
    statValue: { color: t.text.primary, fontSize: 24, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    tierCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    tierRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    tierBadge: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    tierName: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy },
    tierSub: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    progressBar: { height: 8, backgroundColor: t.bg.primary, borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: 8, borderRadius: 4 },
    tierSteps: { marginTop: 16 },
    tierStep: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
    tierStepName: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold, flex: 1 },
    tierStepRange: { color: t.text.muted, fontSize: 12 },
    tierStepReward: { color: t.accent.green, fontSize: 12, fontWeight: fonts.semibold },
    treeContainer: { paddingHorizontal: 20, marginBottom: 16 },
    leaderRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.bg.card, borderRadius: 14, padding: 14, marginHorizontal: 20, marginBottom: 8 },
    leaderRank: { width: 32, alignItems: 'center' },
    leaderRankText: { color: t.text.muted, fontSize: 16, fontWeight: fonts.heavy },
    leaderInfo: { flex: 1, marginLeft: 12 },
    leaderName: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    leaderDetail: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    leaderOtk: { alignItems: 'flex-end' },
    leaderOtkValue: { color: t.accent.green, fontSize: 14, fontWeight: fonts.bold },
    leaderOtkLabel: { color: t.text.muted, fontSize: 10 },
    highlightRow: { backgroundColor: t.accent.purple + '15' },
    qrPlaceholder: { width: 160, height: 160, borderRadius: 16, backgroundColor: t.bg.primary, alignItems: 'center', justifyContent: 'center', marginVertical: 16 },
    qrText: { color: t.text.muted, fontSize: 12, marginTop: 8 },
    demoTag: { backgroundColor: t.accent.orange + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'center', marginBottom: 12 },
    demoTagText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },
  }), [t]);

  // --- Tab content ---

  const renderInvite = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'\u{1F91D}'}</Text>
        <Text style={s.heroTitle}>Grow the Community</Text>
        <Text style={s.heroSubtitle}>
          Every person you invite strengthens Open Chain.{'\n'}
          Earn OTK rewards for each successful referral.
        </Text>
      </View>

      <View style={s.codeCard}>
        <Text style={s.codeLabel}>Your Referral Code</Text>
        <Text style={s.codeText}>{DEMO_REFERRAL_CODE}</Text>
        <Text style={s.linkText}>{DEMO_REFERRAL_LINK}</Text>

        <View style={s.qrPlaceholder}>
          <Text style={{ fontSize: 48 }}>{'\u{1F4F1}'}</Text>
          <Text style={s.qrText}>QR Code</Text>
        </View>
      </View>

      <View style={s.actionRow}>
        <TouchableOpacity style={s.actionBtn} onPress={handleShare}>
          <Text style={s.actionBtnText}>{'\u{1F4E4}'} Share Link</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtnSecondary} onPress={handleCopyCode}>
          <Text style={s.actionBtnTextSecondary}>{codeCopied ? '\u2705' : '\u{1F4CB}'} {codeCopied ? 'Copied!' : 'Copy Code'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.section}>Reward Tiers</Text>
      <View style={s.tierCard}>
        {TIER_THRESHOLDS.map((tier, i) => (
          <View
            key={tier.name}
            style={[
              s.tierStep,
              currentTier.name === tier.name && { backgroundColor: tier.color + '20' },
            ]}
          >
            <Text style={{ fontSize: 20 }}>{tier.icon}</Text>
            <Text style={s.tierStepName}>{tier.name}</Text>
            <Text style={s.tierStepRange}>
              {tier.max === Infinity ? `${tier.min}+` : `${tier.min}-${tier.max}`} referrals
            </Text>
            <Text style={s.tierStepReward}>{(i + 1) * 10} OTK/ref</Text>
          </View>
        ))}
      </View>
    </>
  );

  const renderStats = () => {
    const progress = DEMO_STATS.joined / DEMO_STATS.nextTierAt;
    return (
      <>
        <View style={s.tierCard}>
          <View style={s.tierRow}>
            <View style={[s.tierBadge, { backgroundColor: DEMO_STATS.tierColor + '30' }]}>
              <Text style={{ fontSize: 24 }}>{DEMO_STATS.tierIcon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.tierName}>{DEMO_STATS.tier} Ambassador</Text>
              <Text style={s.tierSub}>
                {DEMO_STATS.nextTierAt - DEMO_STATS.joined} more to reach {DEMO_STATS.nextTier}
              </Text>
            </View>
          </View>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: DEMO_STATS.tierColor }]} />
          </View>
          <Text style={{ color: t.text.muted, fontSize: 11, textAlign: 'right', marginTop: 4 }}>
            {DEMO_STATS.joined}/{DEMO_STATS.nextTierAt}
          </Text>
        </View>

        <Text style={s.section}>Referral Statistics</Text>
        <View style={s.statGrid}>
          <View style={s.statCard}>
            <Text style={s.statValue}>{DEMO_STATS.invited}</Text>
            <Text style={s.statLabel}>Invites Sent</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statValue}>{DEMO_STATS.joined}</Text>
            <Text style={s.statLabel}>People Joined</Text>
          </View>
          <View style={s.statCard}>
            <Text style={[s.statValue, { color: t.accent.green }]}>{DEMO_STATS.otkEarned}</Text>
            <Text style={s.statLabel}>OTK Earned</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statValue}>{DEMO_STATS.pendingInvites}</Text>
            <Text style={s.statLabel}>Pending Invites</Text>
          </View>
        </View>

        <Text style={s.section}>Conversion Rate</Text>
        <View style={[s.tierCard, { alignItems: 'center' as const }]}>
          <Text style={{ color: t.accent.purple, fontSize: 36, fontWeight: fonts.heavy }}>
            {Math.round((DEMO_STATS.joined / DEMO_STATS.invited) * 100)}%
          </Text>
          <Text style={{ color: t.text.muted, fontSize: 13, marginTop: 4 }}>
            {DEMO_STATS.joined} of {DEMO_STATS.invited} invites converted
          </Text>
        </View>
      </>
    );
  };

  const renderTree = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'\u{1F333}'}</Text>
        <Text style={s.heroTitle}>Your Referral Tree</Text>
        <Text style={s.heroSubtitle}>
          3 levels deep {'\u00B7'} {DEMO_TREE.children.length} direct {'\u00B7'}{' '}
          {DEMO_TREE.children.reduce((sum, c) => sum + c.children.length, 0)} indirect
        </Text>
      </View>

      <Text style={s.section}>Network Growth</Text>
      <View style={s.treeContainer}>
        {renderTreeNode(DEMO_TREE, 0, true)}
      </View>
    </>
  );

  const renderLeaderboard = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'\u{1F3C6}'}</Text>
        <Text style={s.heroTitle}>Ambassador Leaderboard</Text>
        <Text style={s.heroSubtitle}>Top community growers on Open Chain</Text>
      </View>

      <Text style={s.section}>Top 10 Ambassadors</Text>
      {DEMO_LEADERBOARD.map((entry) => (
        <View
          key={entry.rank}
          style={[s.leaderRow, entry.name === 'You' && s.highlightRow]}
        >
          <View style={s.leaderRank}>
            <Text style={s.leaderRankText}>
              {entry.rank <= 3
                ? ['\u{1F947}', '\u{1F948}', '\u{1F949}'][entry.rank - 1]
                : `#${entry.rank}`}
            </Text>
          </View>
          <View style={s.leaderInfo}>
            <Text style={s.leaderName}>
              {entry.name}{entry.name === 'You' ? ' \u{1F44B}' : ''}
            </Text>
            <Text style={s.leaderDetail}>
              {entry.referrals} referrals {'\u00B7'} {entry.tier}
            </Text>
          </View>
          <View style={s.leaderOtk}>
            <Text style={s.leaderOtkValue}>{entry.otkEarned.toLocaleString()}</Text>
            <Text style={s.leaderOtkLabel}>OTK earned</Text>
          </View>
        </View>
      ))}
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>{'\u{1F91D}'} Referrals</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      {demoMode && (
        <View style={s.demoTag}>
          <Text style={s.demoTagText}>DEMO DATA</Text>
        </View>
      )}

      {/* Tab Bar */}
      <View style={s.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, activeTab === tab.key && s.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>
              {tab.icon} {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {activeTab === 'invite' && renderInvite()}
        {activeTab === 'stats' && renderStats()}
        {activeTab === 'tree' && renderTree()}
        {activeTab === 'leaderboard' && renderLeaderboard()}
      </ScrollView>
    </SafeAreaView>
  );
}
