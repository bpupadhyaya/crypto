/**
 * Contribution Score Screen — View your score and global leaderboard.
 *
 * Score = (value given * 2) + (gratitude sent * 3) + (milestones achieved * 100)
 * This screen shows how much value you've contributed to humanity.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';
import { getNetworkConfig } from '../core/network';

interface ContributorScore {
  uid: string;
  score: number;
  rank: number;
}

interface Props {
  onClose: () => void;
}

const DEMO_LEADERBOARD: ContributorScore[] = [
  { uid: 'openchain1abc...teacher_jane', score: 15200, rank: 1 },
  { uid: 'openchain1def...dr_smith', score: 12800, rank: 2 },
  { uid: 'openchain1ghi...nurse_maria', score: 11400, rank: 3 },
  { uid: 'openchain1jkl...coach_raj', score: 9600, rank: 4 },
  { uid: 'openchain1mno...mentor_li', score: 8200, rank: 5 },
  { uid: 'openchain1pqr...volunteer_sam', score: 7500, rank: 6 },
  { uid: 'openchain1stu...parent_aisha', score: 6800, rank: 7 },
  { uid: 'openchain1vwx...tutor_carlos', score: 5400, rank: 8 },
  { uid: 'openchain1yza...helper_yuki', score: 4200, rank: 9 },
  { uid: 'openchain1bcd...care_fatima', score: 3600, rank: 10 },
];

const DEMO_MY_SCORE: ContributorScore = { uid: 'you', score: 4850, rank: 8 };

export function ContributionScoreScreen({ onClose }: Props) {
  const [myScore, setMyScore] = useState<ContributorScore | null>(null);
  const [leaderboard, setLeaderboard] = useState<ContributorScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const demoMode = useWalletStore((s) => s.demoMode);
  const addresses = useWalletStore((s) => s.addresses);
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scoreCard: { backgroundColor: t.accent.green + '15', borderRadius: 24, padding: 28, marginHorizontal: 20, alignItems: 'center', marginTop: 8 },
    scoreLabel: { color: t.text.muted, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
    scoreValue: { color: t.accent.green, fontSize: 48, fontWeight: '900', marginTop: 4 },
    rankRow: { flexDirection: 'row', gap: 24, marginTop: 16 },
    rankItem: { alignItems: 'center' },
    rankNumber: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    rankLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    formula: { color: t.text.muted, fontSize: 11, marginTop: 16, textAlign: 'center', lineHeight: 16 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 24 },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20 },
    rankBadge: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    rankBadgeText: { color: '#fff', fontSize: 14, fontWeight: '800' },
    rowInfo: { flex: 1 },
    rowUid: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    rowScore: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    divider: { height: 1, backgroundColor: t.border, marginHorizontal: 20 },
    isYou: { backgroundColor: t.accent.green + '10', borderRadius: 12, marginHorizontal: 8 },
    youBadge: { color: t.accent.green, fontSize: 11, fontWeight: '700' },
  }), [t]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    if (demoMode) {
      setMyScore(DEMO_MY_SCORE);
      setLeaderboard(DEMO_LEADERBOARD);
      setTotalParticipants(247);
      setLoading(false);
      return;
    }
    try {
      const restUrl = getNetworkConfig().openchain.restUrl;
      const address = addresses.openchain;

      // Fetch my score
      if (address) {
        const scoreRes = await fetch(`${restUrl}/openchain/otk/v1/contribution_score/${address}`);
        if (scoreRes.ok) {
          const data = await scoreRes.json();
          setMyScore({ uid: address, score: data.score ?? 0, rank: data.rank ?? 0 });
          setTotalParticipants(data.total ?? 0);
        }
      }

      // Fetch top contributors
      const topRes = await fetch(`${restUrl}/openchain/otk/v1/top_contributors?limit=10`);
      if (topRes.ok) {
        const data = await topRes.json();
        setLeaderboard(data.contributors ?? []);
      }
    } catch { /* network error */ }
    setLoading(false);
  }, [demoMode, addresses]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#ffd700';
    if (rank === 2) return '#c0c0c0';
    if (rank === 3) return '#cd7f32';
    return t.text.muted;
  };

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>Contribution Score</Text>
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
        <Text style={s.title}>Contribution Score</Text>
        <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>Close</Text></TouchableOpacity>
      </View>
      <ScrollView>
        {/* My Score */}
        <View style={s.scoreCard}>
          <Text style={s.scoreLabel}>Your Contribution Score</Text>
          <Text style={s.scoreValue}>{myScore?.score?.toLocaleString() ?? '0'}</Text>
          <View style={s.rankRow}>
            <View style={s.rankItem}>
              <Text style={s.rankNumber}>#{myScore?.rank ?? '—'}</Text>
              <Text style={s.rankLabel}>Global Rank</Text>
            </View>
            <View style={s.rankItem}>
              <Text style={s.rankNumber}>{totalParticipants}</Text>
              <Text style={s.rankLabel}>Total Contributors</Text>
            </View>
          </View>
          <Text style={s.formula}>
            Score = (value given x 2) + (gratitude sent x 3) + (milestones x 100)
          </Text>
        </View>

        {/* Leaderboard */}
        <Text style={s.section}>Top Contributors</Text>
        {leaderboard.map((c, i) => {
          const isYou = c.uid === (addresses.openchain ?? '') || (demoMode && c.rank === myScore?.rank);
          return (
            <React.Fragment key={c.uid}>
              <View style={[s.row, isYou && s.isYou]}>
                <View style={[s.rankBadge, { backgroundColor: getRankColor(c.rank) }]}>
                  <Text style={s.rankBadgeText}>{c.rank}</Text>
                </View>
                <View style={s.rowInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={s.rowUid} numberOfLines={1}>{c.uid.length > 24 ? `${c.uid.slice(0, 12)}...${c.uid.slice(-10)}` : c.uid}</Text>
                    {isYou && <Text style={s.youBadge}>YOU</Text>}
                  </View>
                  <Text style={s.rowScore}>{c.score.toLocaleString()} points</Text>
                </View>
              </View>
              {i < leaderboard.length - 1 && <View style={s.divider} />}
            </React.Fragment>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
