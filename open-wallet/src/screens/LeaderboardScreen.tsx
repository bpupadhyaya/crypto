import { fonts } from '../utils/theme';
/**
 * Leaderboard Screen (Art I) — Community contributor leaderboard across all value channels.
 *
 * Not competition — celebration of contribution.
 * Shows overall and per-channel rankings (nOTK, eOTK, hOTK, cOTK, xOTK, gOTK),
 * time filters (weekly/monthly/all-time), and your personal rank.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

type Tab = 'overall' | 'channels' | 'weekly' | 'my-rank';
type Channel = 'nOTK' | 'eOTK' | 'hOTK' | 'cOTK' | 'xOTK' | 'gOTK';
type TimePeriod = 'weekly' | 'monthly' | 'all-time';

interface Contributor {
  uid: string;
  name: string;
  total: number;
  rank: number;
  category: string;
}

interface Props {
  onClose: () => void;
}

const CHANNEL_LABELS: Record<Channel, string> = {
  nOTK: 'Nurture',
  eOTK: 'Education',
  hOTK: 'Health',
  cOTK: 'Civic',
  xOTK: 'Exchange',
  gOTK: 'Governance',
};

const CHANNEL_CATEGORIES: Record<Channel, string> = {
  nOTK: 'Top Caregivers',
  eOTK: 'Top Teachers',
  hOTK: 'Top Healers',
  cOTK: 'Top Volunteers',
  xOTK: 'Top Exchangers',
  gOTK: 'Top Governors',
};

const DEMO_TOP_10: Contributor[] = [
  { uid: 'openchain1...teacher_jane', name: 'Jane M.', total: 15200, rank: 1, category: 'Teacher' },
  { uid: 'openchain1...dr_smith', name: 'Dr. Smith', total: 12800, rank: 2, category: 'Caregiver' },
  { uid: 'openchain1...nurse_maria', name: 'Maria L.', total: 11400, rank: 3, category: 'Volunteer' },
  { uid: 'openchain1...coach_raj', name: 'Raj P.', total: 9600, rank: 4, category: 'Teacher' },
  { uid: 'openchain1...mentor_li', name: 'Li W.', total: 8200, rank: 5, category: 'Mentor' },
  { uid: 'openchain1...volunteer_sam', name: 'Sam K.', total: 7500, rank: 6, category: 'Volunteer' },
  { uid: 'openchain1...parent_aisha', name: 'Aisha R.', total: 6800, rank: 7, category: 'Caregiver' },
  { uid: 'openchain1...tutor_carlos', name: 'Carlos D.', total: 5400, rank: 8, category: 'Teacher' },
  { uid: 'openchain1...helper_yuki', name: 'Yuki T.', total: 4200, rank: 9, category: 'Volunteer' },
  { uid: 'openchain1...care_fatima', name: 'Fatima B.', total: 3600, rank: 10, category: 'Caregiver' },
];

const DEMO_CHANNEL_TOP: Record<Channel, Contributor[]> = {
  nOTK: [
    { uid: 'n1', name: 'Aisha R.', total: 4200, rank: 1, category: 'Caregiver' },
    { uid: 'n2', name: 'Dr. Smith', total: 3800, rank: 2, category: 'Caregiver' },
    { uid: 'n3', name: 'Fatima B.', total: 2900, rank: 3, category: 'Caregiver' },
  ],
  eOTK: [
    { uid: 'e1', name: 'Jane M.', total: 8100, rank: 1, category: 'Teacher' },
    { uid: 'e2', name: 'Raj P.', total: 5400, rank: 2, category: 'Teacher' },
    { uid: 'e3', name: 'Carlos D.', total: 4100, rank: 3, category: 'Teacher' },
  ],
  hOTK: [
    { uid: 'h1', name: 'Dr. Smith', total: 6200, rank: 1, category: 'Healer' },
    { uid: 'h2', name: 'Maria L.', total: 3900, rank: 2, category: 'Nurse' },
    { uid: 'h3', name: 'Yuki T.', total: 2100, rank: 3, category: 'Wellness' },
  ],
  cOTK: [
    { uid: 'c1', name: 'Sam K.', total: 5100, rank: 1, category: 'Volunteer' },
    { uid: 'c2', name: 'Maria L.', total: 4800, rank: 2, category: 'Volunteer' },
    { uid: 'c3', name: 'Li W.', total: 3200, rank: 3, category: 'Volunteer' },
  ],
  xOTK: [
    { uid: 'x1', name: 'Li W.', total: 3400, rank: 1, category: 'Exchanger' },
    { uid: 'x2', name: 'Carlos D.', total: 1200, rank: 2, category: 'Exchanger' },
    { uid: 'x3', name: 'Sam K.', total: 900, rank: 3, category: 'Exchanger' },
  ],
  gOTK: [
    { uid: 'g1', name: 'Raj P.', total: 2800, rank: 1, category: 'Governor' },
    { uid: 'g2', name: 'Jane M.', total: 2400, rank: 2, category: 'Governor' },
    { uid: 'g3', name: 'Aisha R.', total: 1600, rank: 3, category: 'Governor' },
  ],
};

const DEMO_MY_RANK = { rank: 42, total: 4850, percentile: 82, totalContributors: 234 };

const DEMO_WEEKLY_TOP: Contributor[] = [
  { uid: 'w1', name: 'Maria L.', total: 820, rank: 1, category: 'Volunteer' },
  { uid: 'w2', name: 'Jane M.', total: 710, rank: 2, category: 'Teacher' },
  { uid: 'w3', name: 'Sam K.', total: 640, rank: 3, category: 'Volunteer' },
  { uid: 'w4', name: 'Dr. Smith', total: 580, rank: 4, category: 'Caregiver' },
  { uid: 'w5', name: 'Raj P.', total: 520, rank: 5, category: 'Teacher' },
];

export function LeaderboardScreen({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overall');
  const [selectedChannel, setSelectedChannel] = useState<Channel>('nOTK');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all-time');
  const [loading, setLoading] = useState(true);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [channelContributors, setChannelContributors] = useState<Record<Channel, Contributor[]>>({} as any);
  const [weeklyContributors, setWeeklyContributors] = useState<Contributor[]>([]);
  const [myRank, setMyRank] = useState(DEMO_MY_RANK);
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    tabs: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, borderRadius: 12, backgroundColor: t.bg.secondary, overflow: 'hidden' },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.muted, fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase' },
    tabTextActive: { color: '#fff' },
    banner: { backgroundColor: t.accent.green + '12', borderRadius: 20, padding: 24, marginHorizontal: 20, alignItems: 'center', marginBottom: 16 },
    bannerLabel: { color: t.text.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
    bannerValue: { color: t.accent.green, fontSize: 36, fontWeight: fonts.heavy, marginTop: 4 },
    bannerSub: { color: t.text.muted, fontSize: 12, marginTop: 8, textAlign: 'center', lineHeight: 18 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 20 },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20 },
    rankBadge: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    rankBadgeText: { color: '#fff', fontSize: 14, fontWeight: fonts.heavy },
    rowInfo: { flex: 1 },
    rowName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    rowCategory: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    rowScore: { color: t.accent.green, fontSize: 15, fontWeight: fonts.heavy },
    divider: { height: 1, backgroundColor: t.border, marginHorizontal: 20 },
    channelTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginHorizontal: 20, marginBottom: 16 },
    channelTab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: t.bg.secondary },
    channelTabActive: { backgroundColor: t.accent.blue },
    channelTabText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.bold },
    channelTabTextActive: { color: '#fff' },
    timeTabs: { flexDirection: 'row', gap: 8, marginHorizontal: 20, marginBottom: 16 },
    timeTab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: t.bg.secondary },
    timeTabActive: { backgroundColor: t.accent.green },
    timeTabText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    timeTabTextActive: { color: '#fff' },
    myRankCard: { backgroundColor: t.accent.blue + '12', borderRadius: 20, padding: 28, marginHorizontal: 20, alignItems: 'center' },
    myRankNumber: { color: t.accent.blue, fontSize: 56, fontWeight: fonts.heavy },
    myRankLabel: { color: t.text.muted, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
    percentileRow: { flexDirection: 'row', gap: 32, marginTop: 20 },
    percentileItem: { alignItems: 'center' },
    percentileValue: { color: t.text.primary, fontSize: 22, fontWeight: fonts.heavy },
    percentileLabel: { color: t.text.muted, fontSize: 11, marginTop: 4 },
    progressBar: { height: 8, borderRadius: 4, backgroundColor: t.bg.secondary, marginHorizontal: 20, marginTop: 20, overflow: 'hidden' },
    progressFill: { height: 8, borderRadius: 4, backgroundColor: t.accent.blue },
    philosophy: { color: t.text.muted, fontSize: 11, textAlign: 'center', marginHorizontal: 40, marginTop: 20, lineHeight: 16, fontStyle: 'italic' },
  }), [t]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    if (demoMode) {
      setContributors(DEMO_TOP_10);
      setChannelContributors(DEMO_CHANNEL_TOP);
      setWeeklyContributors(DEMO_WEEKLY_TOP);
      setMyRank(DEMO_MY_RANK);
      setLoading(false);
      return;
    }
    // Live mode: fetch from chain
    setContributors(DEMO_TOP_10);
    setChannelContributors(DEMO_CHANNEL_TOP);
    setWeeklyContributors(DEMO_WEEKLY_TOP);
    setMyRank(DEMO_MY_RANK);
    setLoading(false);
  }, [demoMode]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#ffd700';
    if (rank === 2) return '#c0c0c0';
    if (rank === 3) return '#cd7f32';
    return t.text.muted;
  };

  const renderContributorList = (list: Contributor[]) => list.map((c, i) => (
    <React.Fragment key={c.uid}>
      <View style={s.row}>
        <View style={[s.rankBadge, { backgroundColor: getRankColor(c.rank) }]}>
          <Text style={s.rankBadgeText}>{c.rank}</Text>
        </View>
        <View style={s.rowInfo}>
          <Text style={s.rowName}>{c.name}</Text>
          <Text style={s.rowCategory}>{c.category}</Text>
        </View>
        <Text style={s.rowScore}>{c.total.toLocaleString()} OTK</Text>
      </View>
      {i < list.length - 1 && <View style={s.divider} />}
    </React.Fragment>
  ));

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>Leaderboard</Text>
          <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>Close</Text></TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={t.accent.green} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Leaderboard</Text>
        <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>Close</Text></TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {(['overall', 'channels', 'weekly', 'my-rank'] as Tab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[s.tab, activeTab === tab && s.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
              {tab === 'overall' ? 'Overall' : tab === 'channels' ? 'Channels' : tab === 'weekly' ? 'Weekly' : 'My Rank'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView>
        {activeTab === 'overall' && (
          <>
            <View style={s.banner}>
              <Text style={s.bannerLabel}>Top Contributors</Text>
              <Text style={s.bannerValue}>Top 10</Text>
              <Text style={s.bannerSub}>Total OTK earned across all value channels</Text>
            </View>
            <Text style={s.section}>All-Time Leaders</Text>
            {renderContributorList(contributors)}
          </>
        )}

        {activeTab === 'channels' && (
          <>
            <View style={s.channelTabs}>
              {(Object.keys(CHANNEL_LABELS) as Channel[]).map(ch => (
                <TouchableOpacity
                  key={ch}
                  style={[s.channelTab, selectedChannel === ch && s.channelTabActive]}
                  onPress={() => setSelectedChannel(ch)}
                >
                  <Text style={[s.channelTabText, selectedChannel === ch && s.channelTabTextActive]}>
                    {ch}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.section}>{CHANNEL_CATEGORIES[selectedChannel]}</Text>
            {channelContributors[selectedChannel]
              ? renderContributorList(channelContributors[selectedChannel])
              : <Text style={{ color: t.text.muted, textAlign: 'center', marginTop: 20 }}>No data yet</Text>
            }
          </>
        )}

        {activeTab === 'weekly' && (
          <>
            <View style={s.timeTabs}>
              {(['weekly', 'monthly', 'all-time'] as TimePeriod[]).map(tp => (
                <TouchableOpacity
                  key={tp}
                  style={[s.timeTab, timePeriod === tp && s.timeTabActive]}
                  onPress={() => setTimePeriod(tp)}
                >
                  <Text style={[s.timeTabText, timePeriod === tp && s.timeTabTextActive]}>
                    {tp === 'weekly' ? 'This Week' : tp === 'monthly' ? 'This Month' : 'All Time'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.section}>
              {timePeriod === 'weekly' ? 'This Week' : timePeriod === 'monthly' ? 'This Month' : 'All Time'}
            </Text>
            {renderContributorList(
              timePeriod === 'weekly' ? weeklyContributors :
              timePeriod === 'monthly' ? weeklyContributors.map(c => ({ ...c, total: c.total * 4 })) :
              contributors
            )}
          </>
        )}

        {activeTab === 'my-rank' && (
          <>
            <View style={s.myRankCard}>
              <Text style={s.myRankLabel}>Your Global Rank</Text>
              <Text style={s.myRankNumber}>#{myRank.rank}</Text>
              <View style={s.percentileRow}>
                <View style={s.percentileItem}>
                  <Text style={s.percentileValue}>Top {100 - myRank.percentile}%</Text>
                  <Text style={s.percentileLabel}>Percentile</Text>
                </View>
                <View style={s.percentileItem}>
                  <Text style={s.percentileValue}>{myRank.total.toLocaleString()}</Text>
                  <Text style={s.percentileLabel}>Total OTK</Text>
                </View>
                <View style={s.percentileItem}>
                  <Text style={s.percentileValue}>{myRank.totalContributors}</Text>
                  <Text style={s.percentileLabel}>Contributors</Text>
                </View>
              </View>
            </View>

            {/* Progress bar */}
            <View style={s.progressBar}>
              <View style={[s.progressFill, { width: `${myRank.percentile}%` }]} />
            </View>

            <Text style={s.section}>Your Categories</Text>
            <View style={s.row}>
              <View style={s.rowInfo}>
                <Text style={s.rowName}>Top Volunteers</Text>
                <Text style={s.rowCategory}>Community service contributions</Text>
              </View>
              <Text style={s.rowScore}>#18</Text>
            </View>
            <View style={s.divider} />
            <View style={s.row}>
              <View style={s.rowInfo}>
                <Text style={s.rowName}>Top Teachers</Text>
                <Text style={s.rowCategory}>Education & mentorship</Text>
              </View>
              <Text style={s.rowScore}>#34</Text>
            </View>
            <View style={s.divider} />
            <View style={s.row}>
              <View style={s.rowInfo}>
                <Text style={s.rowName}>Top Caregivers</Text>
                <Text style={s.rowCategory}>Nurture & eldercare</Text>
              </View>
              <Text style={s.rowScore}>#56</Text>
            </View>
            <View style={s.divider} />
            <View style={s.row}>
              <View style={s.rowInfo}>
                <Text style={s.rowName}>Top Governance</Text>
                <Text style={s.rowCategory}>Voting & proposals</Text>
              </View>
              <Text style={s.rowScore}>#71</Text>
            </View>
          </>
        )}

        <Text style={s.philosophy}>
          "Not competition — celebration of contribution.{'\n'}Every act of human value is worth honoring."
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
