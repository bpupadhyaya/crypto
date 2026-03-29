/**
 * Ambassador Screen — Become an Open Chain ambassador.
 *
 * Spread the word, earn gOTK, track referrals, and climb the ranks.
 * "Every person you bring closer to the vision makes the world better."
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Share, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

interface AmbassadorLevel {
  key: string;
  title: string;
  icon: string;
  minReferrals: number;
  gOTKRate: number; // gOTK earned per referral
  description: string;
  color: string;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  referrals: number;
  level: string;
  gOTK: number;
}

interface TalkingPoint {
  title: string;
  content: string;
}

const LEVELS: AmbassadorLevel[] = [
  { key: 'supporter', title: 'Supporter', icon: '☆', minReferrals: 0, gOTKRate: 5, description: 'You believe in the vision. Share it when you can.', color: '#a0a0b0' },
  { key: 'advocate', title: 'Advocate', icon: '★', minReferrals: 5, gOTKRate: 10, description: 'Actively spreading the word. People listen to you.', color: '#3b82f6' },
  { key: 'ambassador', title: 'Ambassador', icon: '◆', minReferrals: 25, gOTKRate: 20, description: 'A recognized voice for The Human Constitution.', color: '#8b5cf6' },
  { key: 'champion', title: 'Champion', icon: '♛', minReferrals: 100, gOTKRate: 50, description: 'A pillar of the movement. Your impact is legendary.', color: '#d4a017' },
];

const DEMO_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: 'MayaK', referrals: 247, level: 'Champion', gOTK: 12350 },
  { rank: 2, name: 'RajeshP', referrals: 183, level: 'Champion', gOTK: 9150 },
  { rank: 3, name: 'SarahL', referrals: 142, level: 'Champion', gOTK: 7100 },
  { rank: 4, name: 'AkiraT', referrals: 89, level: 'Ambassador', gOTK: 1780 },
  { rank: 5, name: 'LiamW', referrals: 67, level: 'Ambassador', gOTK: 1340 },
  { rank: 6, name: 'PreetS', referrals: 43, level: 'Ambassador', gOTK: 860 },
  { rank: 7, name: 'ElenaR', referrals: 31, level: 'Ambassador', gOTK: 620 },
  { rank: 8, name: 'CarlosM', referrals: 18, level: 'Advocate', gOTK: 180 },
  { rank: 9, name: 'FatimaA', referrals: 12, level: 'Advocate', gOTK: 120 },
  { rank: 10, name: 'JamesB', referrals: 7, level: 'Advocate', gOTK: 70 },
];

const TALKING_POINTS: TalkingPoint[] = [
  {
    title: 'The Problem',
    content: 'Current financial systems value profit over people. A teacher shaping 30 lives earns less than someone trading derivatives. Parenting — the most critical job — pays nothing.',
  },
  {
    title: 'The Solution',
    content: 'Open Chain recognizes ALL human value through 6 channels: nurture, education, health, community, economic participation, and governance. One human, one vote.',
  },
  {
    title: 'Why It Works',
    content: 'When every contribution is valued — raising children, teaching, volunteering, staying healthy — the incentives align with human flourishing, not extraction.',
  },
  {
    title: 'The Goal',
    content: 'The Peace Index: when all needs are met, war becomes irrational. We measure success not by market cap, but by human wellbeing.',
  },
];

// Demo user data
const DEMO_REFERRALS = 8;
const DEMO_GOTK_EARNED = 80;
const DEMO_INVITE_CODE = 'OPEN-BHM-2026';

export function AmbassadorScreen({ onClose }: Props) {
  const t = useTheme();
  const { demoMode } = useWalletStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'leaderboard' | 'resources'>('overview');

  const currentLevel = useMemo(() => {
    const refs = DEMO_REFERRALS;
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (refs >= LEVELS[i].minReferrals) return LEVELS[i];
    }
    return LEVELS[0];
  }, []);

  const nextLevel = useMemo(() => {
    const idx = LEVELS.findIndex((l) => l.key === currentLevel.key);
    return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
  }, [currentLevel]);

  const shareInvite = async () => {
    try {
      await Share.share({
        message: `Join Open Wallet — a wallet that values every human contribution. Use my invite code: ${DEMO_INVITE_CODE}\n\nDownload: https://bpupadhyaya.github.io/openwallet`,
      });
    } catch (_) {
      // cancelled
    }
  };

  const showQR = () => {
    Alert.alert('QR Code', `Your invite QR code encodes:\n\n${DEMO_INVITE_CODE}\n\nFull QR generation coming soon.`);
  };

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    demoTag: { backgroundColor: t.accent.yellow + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'center', marginBottom: 16 },
    demoText: { color: t.accent.yellow, fontSize: 12, fontWeight: '700' },
    tabRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: t.bg.card, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: '#fff' },
    levelCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 20, borderWidth: 2 },
    levelIcon: { fontSize: 40, marginBottom: 8 },
    levelTitle: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
    levelDesc: { color: t.text.secondary, fontSize: 13, textAlign: 'center' },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    statCard: { flex: 1, backgroundColor: t.bg.card, borderRadius: 12, padding: 16, alignItems: 'center' },
    statNum: { fontSize: 24, fontWeight: '900', marginBottom: 4 },
    statLabel: { color: t.text.muted, fontSize: 11, fontWeight: '600', textAlign: 'center' },
    progressSection: { backgroundColor: t.bg.card, borderRadius: 12, padding: 16, marginBottom: 20 },
    progressTitle: { color: t.text.primary, fontSize: 14, fontWeight: '700', marginBottom: 8 },
    progressBarBg: { height: 8, backgroundColor: t.border, borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: 8, borderRadius: 4 },
    progressLabel: { color: t.text.muted, fontSize: 12, marginTop: 6 },
    shareRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    shareBtn: { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center' },
    shareBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    inviteCode: { backgroundColor: t.bg.card, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: t.border, borderStyle: 'dashed' },
    inviteLabel: { color: t.text.muted, fontSize: 11, fontWeight: '600', marginBottom: 4 },
    inviteText: { color: t.text.primary, fontSize: 20, fontWeight: '900', letterSpacing: 2 },
    quote: { color: t.text.secondary, fontSize: 14, fontStyle: 'italic', textAlign: 'center', lineHeight: 22, marginBottom: 24, paddingHorizontal: 12 },
    // Leaderboard
    leaderRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.bg.card, borderRadius: 12, padding: 14, marginBottom: 8 },
    leaderRank: { width: 30, color: t.text.muted, fontSize: 14, fontWeight: '800' },
    leaderName: { flex: 1, color: t.text.primary, fontSize: 14, fontWeight: '700' },
    leaderBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 8 },
    leaderBadgeText: { fontSize: 11, fontWeight: '700' },
    leaderStats: { color: t.text.secondary, fontSize: 12, fontWeight: '600', width: 50, textAlign: 'right' },
    leaderGOTK: { color: t.accent.green, fontSize: 12, fontWeight: '700', width: 70, textAlign: 'right' },
    // Resources
    talkingCard: { backgroundColor: t.bg.card, borderRadius: 12, padding: 16, marginBottom: 12 },
    talkingTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700', marginBottom: 6 },
    talkingContent: { color: t.text.secondary, fontSize: 14, lineHeight: 22 },
    levelsSection: { marginTop: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: '800', marginBottom: 12 },
    levelRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.bg.card, borderRadius: 12, padding: 14, marginBottom: 8, gap: 12 },
    levelRowIcon: { fontSize: 24 },
    levelRowInfo: { flex: 1 },
    levelRowTitle: { fontSize: 14, fontWeight: '700' },
    levelRowReq: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    levelRowRate: { color: t.accent.green, fontSize: 13, fontWeight: '700' },
  }), [t]);

  const progressToNext = nextLevel
    ? Math.min(1, DEMO_REFERRALS / nextLevel.minReferrals)
    : 1;

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Ambassador</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {demoMode && (
          <View style={s.demoTag}>
            <Text style={s.demoText}>DEMO MODE</Text>
          </View>
        )}

        <Text style={s.quote}>
          "Every person you bring closer to the vision makes the world better."
        </Text>

        <View style={s.tabRow}>
          {(['overview', 'leaderboard', 'resources'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[s.tab, activeTab === tab && s.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                {tab === 'overview' ? 'Overview' : tab === 'leaderboard' ? 'Leaderboard' : 'Resources'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'overview' && (
          <>
            <View style={[s.levelCard, { borderColor: currentLevel.color + '60' }]}>
              <Text style={s.levelIcon}>{currentLevel.icon}</Text>
              <Text style={[s.levelTitle, { color: currentLevel.color }]}>{currentLevel.title}</Text>
              <Text style={s.levelDesc}>{currentLevel.description}</Text>
            </View>

            <View style={s.statsRow}>
              <View style={s.statCard}>
                <Text style={[s.statNum, { color: t.accent.blue }]}>{DEMO_REFERRALS}</Text>
                <Text style={s.statLabel}>Referrals</Text>
              </View>
              <View style={s.statCard}>
                <Text style={[s.statNum, { color: t.accent.green }]}>{DEMO_GOTK_EARNED}</Text>
                <Text style={s.statLabel}>gOTK Earned</Text>
              </View>
              <View style={s.statCard}>
                <Text style={[s.statNum, { color: t.accent.purple }]}>{currentLevel.gOTKRate}</Text>
                <Text style={s.statLabel}>gOTK / Referral</Text>
              </View>
            </View>

            {nextLevel && (
              <View style={s.progressSection}>
                <Text style={s.progressTitle}>Progress to {nextLevel.title}</Text>
                <View style={s.progressBarBg}>
                  <View style={[s.progressBarFill, { width: `${progressToNext * 100}%`, backgroundColor: nextLevel.color }]} />
                </View>
                <Text style={s.progressLabel}>
                  {DEMO_REFERRALS} / {nextLevel.minReferrals} referrals
                </Text>
              </View>
            )}

            <View style={s.inviteCode}>
              <Text style={s.inviteLabel}>YOUR INVITE CODE</Text>
              <Text style={s.inviteText}>{DEMO_INVITE_CODE}</Text>
            </View>

            <View style={s.shareRow}>
              <TouchableOpacity
                style={[s.shareBtn, { backgroundColor: t.accent.blue }]}
                onPress={shareInvite}
              >
                <Text style={s.shareBtnText}>Share Invite Link</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.shareBtn, { backgroundColor: t.accent.purple }]}
                onPress={showQR}
              >
                <Text style={s.shareBtnText}>Show QR Code</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {activeTab === 'leaderboard' && (
          <>
            <Text style={s.sectionTitle}>Top Ambassadors</Text>
            {DEMO_LEADERBOARD.map((entry) => {
              const level = LEVELS.find((l) => l.title === entry.level) ?? LEVELS[0];
              return (
                <View key={entry.rank} style={s.leaderRow}>
                  <Text style={s.leaderRank}>#{entry.rank}</Text>
                  <Text style={s.leaderName}>{entry.name}</Text>
                  <View style={[s.leaderBadge, { backgroundColor: level.color + '20' }]}>
                    <Text style={[s.leaderBadgeText, { color: level.color }]}>{entry.level}</Text>
                  </View>
                  <Text style={s.leaderStats}>{entry.referrals}</Text>
                  <Text style={s.leaderGOTK}>{entry.gOTK} gOTK</Text>
                </View>
              );
            })}
          </>
        )}

        {activeTab === 'resources' && (
          <>
            <Text style={s.sectionTitle}>Talking Points</Text>
            {TALKING_POINTS.map((tp) => (
              <View key={tp.title} style={s.talkingCard}>
                <Text style={s.talkingTitle}>{tp.title}</Text>
                <Text style={s.talkingContent}>{tp.content}</Text>
              </View>
            ))}

            <View style={s.levelsSection}>
              <Text style={s.sectionTitle}>Ambassador Levels</Text>
              {LEVELS.map((level) => (
                <View key={level.key} style={s.levelRow}>
                  <Text style={s.levelRowIcon}>{level.icon}</Text>
                  <View style={s.levelRowInfo}>
                    <Text style={[s.levelRowTitle, { color: level.color }]}>{level.title}</Text>
                    <Text style={s.levelRowReq}>
                      {level.minReferrals === 0 ? 'Start here' : `${level.minReferrals}+ referrals`}
                    </Text>
                  </View>
                  <Text style={s.levelRowRate}>{level.gOTKRate} gOTK/ref</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
