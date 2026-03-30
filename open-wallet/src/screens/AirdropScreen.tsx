/**
 * Airdrop Screen — Track and claim token airdrops.
 *
 * Shows available airdrops with eligibility criteria, allows one-click
 * claiming, and tracks claimed history plus upcoming announcements.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// --- Types ---

type Tab = 'available' | 'claimed' | 'upcoming';

interface Airdrop {
  id: string;
  token: string;
  amount: number;
  criteria: string;
  deadline: string;
  eligible: boolean;
  status: 'available' | 'claimed' | 'upcoming';
  claimedDate?: string;
  announcedDate?: string;
  source?: string;
}

// --- Demo data ---

const DEMO_AIRDROPS: Airdrop[] = [
  // Available (2)
  {
    id: 'ad_001', token: 'OTK', amount: 500,
    criteria: 'Hold 1,000+ OTK for 30 days', deadline: '2026-04-15',
    eligible: true, status: 'available',
  },
  {
    id: 'ad_002', token: 'nOTK', amount: 200,
    criteria: 'Complete 5 nurture verifications', deadline: '2026-04-30',
    eligible: false, status: 'available',
  },
  // Claimed (3)
  {
    id: 'ad_003', token: 'OTK', amount: 1000,
    criteria: 'Early adopter bonus', deadline: '2026-02-28',
    eligible: true, status: 'claimed', claimedDate: '2026-02-20',
  },
  {
    id: 'ad_004', token: 'nOTK', amount: 300,
    criteria: 'Community builder reward', deadline: '2026-01-31',
    eligible: true, status: 'claimed', claimedDate: '2026-01-25',
  },
  {
    id: 'ad_005', token: 'OTK', amount: 150,
    criteria: 'Governance participation', deadline: '2026-03-15',
    eligible: true, status: 'claimed', claimedDate: '2026-03-10',
  },
  // Upcoming (2)
  {
    id: 'ad_006', token: 'OTK', amount: 2000,
    criteria: 'Stake 5,000+ OTK for 90 days', deadline: '2026-06-01',
    eligible: false, status: 'upcoming', announcedDate: '2026-03-25',
    source: 'Open Chain governance proposal #42',
  },
  {
    id: 'ad_007', token: 'nOTK', amount: 750,
    criteria: 'Top 100 nurture contributors', deadline: '2026-07-01',
    eligible: false, status: 'upcoming', announcedDate: '2026-03-28',
    source: 'Community announcement',
  },
];

const TAB_LABELS: Record<Tab, string> = {
  available: 'Available',
  claimed: 'Claimed',
  upcoming: 'Upcoming',
};

const STATUS_ICONS: Record<string, string> = {
  available: '\u{1F381}',   // gift
  claimed: '\u2705',        // check
  upcoming: '\u{1F514}',    // bell
};

// --- Component ---

interface Props {
  onClose: () => void;
}

export function AirdropScreen({ onClose }: Props) {
  const t = useTheme();
  const { demoMode } = useWalletStore();
  const [activeTab, setActiveTab] = useState<Tab>('available');

  const airdrops = DEMO_AIRDROPS;

  const filtered = useMemo(
    () => airdrops.filter(a => a.status === activeTab),
    [airdrops, activeTab],
  );

  const stats = useMemo(() => {
    const available = airdrops.filter(a => a.status === 'available');
    const eligible = available.filter(a => a.eligible);
    const claimed = airdrops.filter(a => a.status === 'claimed');
    const upcoming = airdrops.filter(a => a.status === 'upcoming');
    const totalClaimed = claimed.reduce((s, a) => s + a.amount, 0);
    return {
      availableCount: available.length,
      eligibleCount: eligible.length,
      claimedCount: claimed.length,
      upcomingCount: upcoming.length,
      totalClaimed,
    };
  }, [airdrops]);

  const handleClaim = (airdrop: Airdrop) => {
    if (!demoMode) return;
    // In demo mode, show feedback only
  };

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    headerTitle: { color: t.text.primary, fontSize: 20, fontWeight: '700' },
    closeText: { color: t.accent.blue, fontSize: 16 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 20, marginBottom: 8, marginLeft: 4 },

    // Stats
    statsCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
    statBox: { alignItems: 'center' },
    statNumber: { color: t.text.primary, fontSize: 24, fontWeight: '700' },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },

    // Tabs
    tabRow: { flexDirection: 'row', gap: 8, marginTop: 20, marginBottom: 12 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: t.bg.card },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: '#ffffff' },

    // Cards
    card: { backgroundColor: t.bg.card, borderRadius: 14, padding: 14, marginBottom: 10 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    tokenRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    tokenName: { color: t.text.primary, fontSize: 16, fontWeight: '700' },
    amountBadge: { color: t.accent.green, fontSize: 15, fontWeight: '700' },
    criteria: { color: t.text.secondary, fontSize: 13, marginBottom: 6 },
    deadline: { color: t.text.muted, fontSize: 11 },
    eligibleBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.accent.green + '18', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, alignSelf: 'flex-start', marginTop: 6 },
    eligibleText: { color: t.accent.green, fontSize: 12, fontWeight: '600', marginLeft: 4 },
    notEligible: { color: t.text.muted, fontSize: 12, fontWeight: '500', marginTop: 6 },

    // Claim button
    claimBtn: { backgroundColor: t.accent.blue, borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 10 },
    claimBtnDisabled: { backgroundColor: t.bg.primary, borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 10 },
    claimText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
    claimTextDisabled: { color: t.text.muted, fontSize: 14, fontWeight: '700' },

    // Claimed
    claimedDate: { color: t.text.muted, fontSize: 11, marginTop: 4 },

    // Upcoming
    sourceText: { color: t.text.secondary, fontSize: 12, fontStyle: 'italic', marginTop: 4 },
    announcedText: { color: t.text.muted, fontSize: 11, marginTop: 2 },

    // Demo banner
    demoBanner: { backgroundColor: t.accent.orange + '20', borderRadius: 10, padding: 10, alignItems: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 12, fontWeight: '600' },

    empty: { alignItems: 'center', paddingVertical: 40 },
    emptyIcon: { fontSize: 40, marginBottom: 12 },
    emptyText: { color: t.text.muted, fontSize: 14 },
  }), [t]);

  const renderAvailableCard = (airdrop: Airdrop) => (
    <View key={airdrop.id} style={st.card}>
      <View style={st.cardHeader}>
        <View style={st.tokenRow}>
          <Text style={{ fontSize: 20 }}>{STATUS_ICONS.available}</Text>
          <Text style={st.tokenName}>{airdrop.token}</Text>
        </View>
        <Text style={st.amountBadge}>+{airdrop.amount.toLocaleString()}</Text>
      </View>
      <Text style={st.criteria}>{airdrop.criteria}</Text>
      <Text style={st.deadline}>Deadline: {airdrop.deadline}</Text>
      {airdrop.eligible ? (
        <>
          <View style={st.eligibleBadge}>
            <Text style={{ fontSize: 12 }}>{'\u2705'}</Text>
            <Text style={st.eligibleText}>Eligible</Text>
          </View>
          <TouchableOpacity style={st.claimBtn} onPress={() => handleClaim(airdrop)}>
            <Text style={st.claimText}>Claim Airdrop</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={st.notEligible}>{'\u274C'} Not yet eligible</Text>
          <View style={st.claimBtnDisabled}>
            <Text style={st.claimTextDisabled}>Check Eligibility</Text>
          </View>
        </>
      )}
    </View>
  );

  const renderClaimedCard = (airdrop: Airdrop) => (
    <View key={airdrop.id} style={st.card}>
      <View style={st.cardHeader}>
        <View style={st.tokenRow}>
          <Text style={{ fontSize: 20 }}>{STATUS_ICONS.claimed}</Text>
          <Text style={st.tokenName}>{airdrop.token}</Text>
        </View>
        <Text style={st.amountBadge}>+{airdrop.amount.toLocaleString()}</Text>
      </View>
      <Text style={st.criteria}>{airdrop.criteria}</Text>
      <Text style={st.claimedDate}>Claimed on {airdrop.claimedDate}</Text>
    </View>
  );

  const renderUpcomingCard = (airdrop: Airdrop) => (
    <View key={airdrop.id} style={st.card}>
      <View style={st.cardHeader}>
        <View style={st.tokenRow}>
          <Text style={{ fontSize: 20 }}>{STATUS_ICONS.upcoming}</Text>
          <Text style={st.tokenName}>{airdrop.token}</Text>
        </View>
        <Text style={st.amountBadge}>~{airdrop.amount.toLocaleString()}</Text>
      </View>
      <Text style={st.criteria}>{airdrop.criteria}</Text>
      <Text style={st.deadline}>Expected: {airdrop.deadline}</Text>
      {airdrop.source && <Text style={st.sourceText}>Source: {airdrop.source}</Text>}
      {airdrop.announcedDate && <Text style={st.announcedText}>Announced: {airdrop.announcedDate}</Text>}
    </View>
  );

  const renderCard = (airdrop: Airdrop) => {
    switch (airdrop.status) {
      case 'available': return renderAvailableCard(airdrop);
      case 'claimed': return renderClaimedCard(airdrop);
      case 'upcoming': return renderUpcomingCard(airdrop);
    }
  };

  return (
    <SafeAreaView style={st.container}>
      {/* Header */}
      <View style={st.header}>
        <Text style={st.headerTitle}>Airdrops</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeText}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={st.scroll} showsVerticalScrollIndicator={false}>
        {/* Demo banner */}
        {demoMode && (
          <View style={st.demoBanner}>
            <Text style={st.demoText}>Demo Mode — Sample airdrop data</Text>
          </View>
        )}

        {/* Summary stats */}
        <View style={st.statsCard}>
          <View style={st.statsRow}>
            <View style={st.statBox}>
              <Text style={st.statNumber}>{stats.availableCount}</Text>
              <Text style={st.statLabel}>Available</Text>
            </View>
            <View style={st.statBox}>
              <Text style={st.statNumber}>{stats.eligibleCount}</Text>
              <Text style={st.statLabel}>Eligible</Text>
            </View>
            <View style={st.statBox}>
              <Text style={st.statNumber}>{stats.claimedCount}</Text>
              <Text style={st.statLabel}>Claimed</Text>
            </View>
            <View style={st.statBox}>
              <Text style={[st.statNumber, { color: t.accent.green }]}>
                {stats.totalClaimed.toLocaleString()}
              </Text>
              <Text style={st.statLabel}>Total Earned</Text>
            </View>
          </View>
        </View>

        {/* Tab bar */}
        <View style={st.tabRow}>
          {(['available', 'claimed', 'upcoming'] as Tab[]).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[st.tab, activeTab === tab && st.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[st.tabText, activeTab === tab && st.tabTextActive]}>
                {TAB_LABELS[tab]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <Text style={st.section}>
          {TAB_LABELS[activeTab]} ({filtered.length})
        </Text>

        {filtered.length === 0 ? (
          <View style={st.empty}>
            <Text style={st.emptyIcon}>
              {activeTab === 'available' ? '\u{1F4ED}' : activeTab === 'claimed' ? '\u{1F4C2}' : '\u{1F52E}'}
            </Text>
            <Text style={st.emptyText}>
              {activeTab === 'available'
                ? 'No airdrops available right now'
                : activeTab === 'claimed'
                ? 'No claimed airdrops yet'
                : 'No upcoming airdrops announced'}
            </Text>
          </View>
        ) : (
          filtered.map(renderCard)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
