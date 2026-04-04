import { fonts } from '../utils/theme';
/**
 * Profile Screen — User's public profile on Open Chain.
 *
 * Shows Universal ID details, contribution score + rank, achievement badges,
 * gratitude stats, staking positions, created tokens, governance participation,
 * and a QR code for sharing.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

// --- Types ---

interface ProfileData {
  uid: string;
  displayName: string;
  registeredAt: number;
  contributionScore: number;
  rank: number;
  totalParticipants: number;
  achievements: { title: string; level: string; channel: string }[];
  gratitude: { sent: number; received: number; sentOTK: string; receivedOTK: string };
  staking: { stakedOTK: string; rewardsOTK: string; apr: string };
  createdTokens: { symbol: string; name: string; supply: string }[];
  governance: { proposalsVoted: number; proposalsCreated: number; lastVote: string };
}

// --- Demo data ---

const DEMO_PROFILE: ProfileData = {
  uid: 'uid-demo-self-a1b2',
  displayName: 'Bhim',
  registeredAt: Date.now() - 1000 * 60 * 60 * 24 * 120,
  contributionScore: 2847,
  rank: 42,
  totalParticipants: 1250,
  achievements: [
    { title: 'Nurturing Foundation', level: 'Gold', channel: 'Nurture' },
    { title: 'Mentor of the Year', level: 'Gold', channel: 'Education' },
    { title: 'Community Builder', level: 'Platinum', channel: 'Community' },
    { title: 'Diamond Caregiver', level: 'Diamond', channel: 'Nurture' },
    { title: 'Wellness Champion', level: 'Bronze', channel: 'Health' },
    { title: 'Civic Participation Pioneer', level: 'Silver', channel: 'Governance' },
  ],
  gratitude: { sent: 23, received: 47, sentOTK: '1,250', receivedOTK: '3,870' },
  staking: { stakedOTK: '5,000', rewardsOTK: '125', apr: '5.0%' },
  createdTokens: [
    { symbol: 'EDU', name: 'EduToken', supply: '100,000' },
  ],
  governance: { proposalsVoted: 18, proposalsCreated: 2, lastVote: 'Proposal #42' },
};

const LEVEL_COLORS: Record<string, string> = {
  Bronze: '#cd7f32',
  Silver: '#c0c0c0',
  Gold: '#ffd700',
  Platinum: '#e5e4e2',
  Diamond: '#b9f2ff',
};

const CHANNEL_ICONS: Record<string, string> = {
  Nurture: '\u{1F49B}',
  Education: '\u{1F4DA}',
  Health: '\u{1FA7A}',
  Community: '\u{1F91D}',
  Governance: '\u{1F3DB}',
  Economic: '\u{1F4B0}',
};

// --- Helpers ---

function daysSince(ts: number): number {
  return Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24));
}

// --- Component ---

interface Props {
  onClose: () => void;
}

export function ProfileScreen({ onClose }: Props) {
  const t = useTheme();
  const [profile] = useState<ProfileData>(DEMO_PROFILE);

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    headerTitle: { color: t.text.primary, fontSize: 20, fontWeight: fonts.bold },
    closeText: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 20, marginBottom: 8, marginLeft: 4 },
    demoTag: { backgroundColor: t.accent.purple + '30', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, alignSelf: 'center', marginBottom: 12 },
    demoTagText: { color: t.accent.purple, fontSize: 11, fontWeight: fonts.bold },
    // Profile hero
    heroCard: { backgroundColor: t.bg.card, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 8 },
    avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: t.accent.blue + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    avatarText: { color: t.accent.blue, fontSize: 32, fontWeight: fonts.bold },
    profileName: { color: t.text.primary, fontSize: 22, fontWeight: fonts.heavy, marginBottom: 4 },
    profileUid: { color: t.text.muted, fontSize: 13, fontFamily: 'monospace', marginBottom: 8 },
    profileMember: { color: t.text.secondary, fontSize: 12 },
    // QR
    qrCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 8 },
    qrPlaceholder: { width: 160, height: 160, backgroundColor: t.bg.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: t.border },
    qrText: { color: t.text.muted, fontSize: 12, textAlign: 'center' },
    qrLabel: { color: t.text.secondary, fontSize: 12 },
    // Stats
    statsCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
    statBox: { alignItems: 'center' },
    statNumber: { color: t.text.primary, fontSize: 24, fontWeight: fonts.bold },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    rankBadge: { backgroundColor: t.accent.green + '20', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 14, marginTop: 12, alignSelf: 'center' },
    rankText: { color: t.accent.green, fontSize: 13, fontWeight: fonts.bold },
    // Cards
    card: { backgroundColor: t.bg.card, borderRadius: 16, overflow: 'hidden' },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    label: { color: t.text.primary, fontSize: 15 },
    value: { color: t.text.secondary, fontSize: 14 },
    valueGreen: { color: t.accent.green, fontSize: 14, fontWeight: fonts.semibold },
    divider: { height: 1, backgroundColor: t.border, marginHorizontal: 16 },
    // Badges grid
    badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 16 },
    badgeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: t.bg.primary, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1 },
    badgeTitle: { color: t.text.primary, fontSize: 12, fontWeight: fonts.semibold },
    badgeLevel: { fontSize: 10, fontWeight: fonts.bold },
    // Token list
    tokenRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center' },
    tokenSymbol: { color: t.accent.blue, fontSize: 15, fontWeight: fonts.bold },
    tokenName: { color: t.text.secondary, fontSize: 13 },
    tokenSupply: { color: t.text.muted, fontSize: 12 },
  }), [t]);

  const scorePercentile = Math.round((1 - profile.rank / profile.totalParticipants) * 100);

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll}>
        <View style={st.demoTag}>
          <Text style={st.demoTagText}>DEMO MODE</Text>
        </View>

        {/* Hero */}
        <View style={st.heroCard}>
          <View style={st.avatarCircle}>
            <Text style={st.avatarText}>{profile.displayName.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={st.profileName}>{profile.displayName}</Text>
          <Text style={st.profileUid}>{profile.uid}</Text>
          <Text style={st.profileMember}>Member for {daysSince(profile.registeredAt)} days</Text>
        </View>

        {/* QR Code for sharing */}
        <Text style={st.section}>Share Profile</Text>
        <View style={st.qrCard}>
          <View style={st.qrPlaceholder}>
            <Text style={{ fontSize: 40 }}>{'\u{1F4F1}'}</Text>
            <Text style={st.qrText}>QR Code{'\n'}{profile.uid}</Text>
          </View>
          <Text style={st.qrLabel}>Scan to view profile on Open Chain</Text>
        </View>

        {/* Contribution Score */}
        <Text style={st.section}>Contribution Score</Text>
        <View style={st.statsCard}>
          <View style={st.statsRow}>
            <View style={st.statBox}>
              <Text style={st.statNumber}>{profile.contributionScore.toLocaleString()}</Text>
              <Text style={st.statLabel}>Score</Text>
            </View>
            <View style={st.statBox}>
              <Text style={st.statNumber}>#{profile.rank}</Text>
              <Text style={st.statLabel}>Rank</Text>
            </View>
            <View style={st.statBox}>
              <Text style={st.statNumber}>{scorePercentile}%</Text>
              <Text style={st.statLabel}>Percentile</Text>
            </View>
          </View>
          <View style={st.rankBadge}>
            <Text style={st.rankText}>Top {100 - scorePercentile}% of {profile.totalParticipants.toLocaleString()} participants</Text>
          </View>
        </View>

        {/* Achievement Badges */}
        <Text style={st.section}>Achievement Badges ({profile.achievements.length})</Text>
        <View style={st.card}>
          <View style={st.badgesGrid}>
            {profile.achievements.map((ach, idx) => {
              const color = LEVEL_COLORS[ach.level] || '#888';
              const icon = CHANNEL_ICONS[ach.channel] || '\u2B50';
              return (
                <View key={idx} style={[st.badgeChip, { borderColor: color }]}>
                  <Text style={{ fontSize: 16 }}>{icon}</Text>
                  <View>
                    <Text style={st.badgeTitle} numberOfLines={1}>{ach.title}</Text>
                    <Text style={[st.badgeLevel, { color }]}>{ach.level}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Gratitude Stats */}
        <Text style={st.section}>Gratitude</Text>
        <View style={st.card}>
          <View style={st.row}>
            <Text style={st.label}>Sent</Text>
            <Text style={st.valueGreen}>{profile.gratitude.sent} transactions ({profile.gratitude.sentOTK} OTK)</Text>
          </View>
          <View style={st.divider} />
          <View style={st.row}>
            <Text style={st.label}>Received</Text>
            <Text style={st.valueGreen}>{profile.gratitude.received} transactions ({profile.gratitude.receivedOTK} OTK)</Text>
          </View>
        </View>

        {/* Staking */}
        <Text style={st.section}>Staking</Text>
        <View style={st.card}>
          <View style={st.row}>
            <Text style={st.label}>Staked</Text>
            <Text style={st.valueGreen}>{profile.staking.stakedOTK} OTK</Text>
          </View>
          <View style={st.divider} />
          <View style={st.row}>
            <Text style={st.label}>Rewards Earned</Text>
            <Text style={st.valueGreen}>{profile.staking.rewardsOTK} OTK</Text>
          </View>
          <View style={st.divider} />
          <View style={st.row}>
            <Text style={st.label}>APR</Text>
            <Text style={st.value}>{profile.staking.apr}</Text>
          </View>
        </View>

        {/* Created Tokens */}
        <Text style={st.section}>Created Tokens ({profile.createdTokens.length})</Text>
        <View style={st.card}>
          {profile.createdTokens.length === 0 ? (
            <View style={st.row}>
              <Text style={{ color: t.text.muted, fontSize: 14 }}>No tokens created yet.</Text>
            </View>
          ) : (
            profile.createdTokens.map((token, idx) => (
              <React.Fragment key={idx}>
                <View style={st.tokenRow}>
                  <View>
                    <Text style={st.tokenSymbol}>{token.symbol}</Text>
                    <Text style={st.tokenName}>{token.name}</Text>
                  </View>
                  <Text style={st.tokenSupply}>Supply: {token.supply}</Text>
                </View>
                {idx < profile.createdTokens.length - 1 && <View style={st.divider} />}
              </React.Fragment>
            ))
          )}
        </View>

        {/* Governance */}
        <Text style={st.section}>Governance Participation</Text>
        <View style={st.card}>
          <View style={st.row}>
            <Text style={st.label}>Proposals Voted</Text>
            <Text style={st.valueGreen}>{profile.governance.proposalsVoted}</Text>
          </View>
          <View style={st.divider} />
          <View style={st.row}>
            <Text style={st.label}>Proposals Created</Text>
            <Text style={st.value}>{profile.governance.proposalsCreated}</Text>
          </View>
          <View style={st.divider} />
          <View style={st.row}>
            <Text style={st.label}>Last Vote</Text>
            <Text style={{ color: t.accent.blue, fontSize: 14 }}>{profile.governance.lastVote}</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
