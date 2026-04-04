import { fonts } from '../utils/theme';
/**
 * Trust Network — Visualize your web of trust.
 *
 * In Open Chain, trust is earned through consistent positive contributions.
 * This screen shows who trusts you, who you trust, and provides tools
 * to build and verify trust relationships. Trust is the foundation of
 * decentralized governance and community consensus.
 *
 * Features:
 * - Network: view your trust graph (inbound and outbound trust)
 * - Build: extend trust to others based on their contributions
 * - Verify: verify claims and attestations from trusted contacts
 * - Demo mode with sample trust data
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

type TrustTab = 'network' | 'build' | 'verify';

interface TrustConnection {
  id: string;
  uid: string;
  displayName: string;
  direction: 'inbound' | 'outbound' | 'mutual';
  trustLevel: number;
  since: string;
  topChannel: string;
  channelIcon: string;
  totalOTK: number;
  verified: boolean;
}

interface VerificationRequest {
  id: string;
  claimant: string;
  claimType: string;
  description: string;
  evidence: string;
  status: 'pending' | 'verified' | 'rejected';
  timestamp: string;
}

interface TrustCandidate {
  uid: string;
  displayName: string;
  totalOTK: number;
  topChannel: string;
  channelIcon: string;
  mutualConnections: number;
  communityScore: number;
}

const DEMO_CONNECTIONS: TrustConnection[] = [
  { id: 'c1', uid: 'UID-8372', displayName: 'Amara K.', direction: 'mutual', trustLevel: 95, since: '6 months', topChannel: 'Nurture', channelIcon: '\u{1F49B}', totalOTK: 12400, verified: true },
  { id: 'c2', uid: 'UID-1290', displayName: 'Raj P.', direction: 'mutual', trustLevel: 88, since: '4 months', topChannel: 'Education', channelIcon: '\u{1F4DA}', totalOTK: 8900, verified: true },
  { id: 'c3', uid: 'UID-4451', displayName: 'Li Wei', direction: 'inbound', trustLevel: 72, since: '2 months', topChannel: 'Community', channelIcon: '\u{1F91D}', totalOTK: 5600, verified: true },
  { id: 'c4', uid: 'UID-6673', displayName: 'Sofia M.', direction: 'outbound', trustLevel: 80, since: '3 months', topChannel: 'Health', channelIcon: '\u{1FA7A}', totalOTK: 7200, verified: false },
  { id: 'c5', uid: 'UID-3318', displayName: 'James O.', direction: 'inbound', trustLevel: 65, since: '1 month', topChannel: 'Economic', channelIcon: '\u{1F4B0}', totalOTK: 3100, verified: false },
  { id: 'c6', uid: 'UID-7742', displayName: 'Fatima A.', direction: 'mutual', trustLevel: 91, since: '8 months', topChannel: 'Governance', channelIcon: '\u{1F5F3}', totalOTK: 15800, verified: true },
];

const DEMO_VERIFICATIONS: VerificationRequest[] = [
  { id: 'v1', claimant: 'UID-4451 (Li Wei)', claimType: 'Education Credential', description: 'Claims completion of community teaching certification', evidence: '3 peer attestations, 12 workshop records', status: 'pending', timestamp: '1 day ago' },
  { id: 'v2', claimant: 'UID-3318 (James O.)', claimType: 'Volunteer Hours', description: 'Claims 40 hours of community garden volunteering', evidence: '2 organizer confirmations, photo records', status: 'pending', timestamp: '3 days ago' },
  { id: 'v3', claimant: 'UID-8372 (Amara K.)', claimType: 'Mentoring Impact', description: 'Claims mentoring 5 students who earned edOTK', evidence: 'On-chain mentee OTK records', status: 'verified', timestamp: '1 week ago' },
];

const DEMO_CANDIDATES: TrustCandidate[] = [
  { uid: 'UID-9921', displayName: 'Elena V.', totalOTK: 9200, topChannel: 'Education', channelIcon: '\u{1F4DA}', mutualConnections: 4, communityScore: 87 },
  { uid: 'UID-5530', displayName: 'Marcus T.', totalOTK: 6800, topChannel: 'Health', channelIcon: '\u{1FA7A}', mutualConnections: 3, communityScore: 79 },
  { uid: 'UID-2214', displayName: 'Priya S.', totalOTK: 11500, topChannel: 'Nurture', channelIcon: '\u{1F49B}', mutualConnections: 5, communityScore: 92 },
];

const DIRECTION_LABELS: Record<string, string> = { inbound: 'Trusts You', outbound: 'You Trust', mutual: 'Mutual Trust' };
const DIRECTION_COLORS_FN = (t: ReturnType<typeof useTheme>) => ({ inbound: t.accent.blue, outbound: t.accent.yellow, mutual: t.accent.green });
const STATUS_COLORS: Record<string, string> = { pending: '#eab308', verified: '#22c55e', rejected: '#ef4444' };

export function TrustNetworkScreen({ onClose }: Props) {
  const { demoMode } = useWalletStore();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<TrustTab>('network');
  const [filterDirection, setFilterDirection] = useState<string>('all');

  const directionColors = useMemo(() => DIRECTION_COLORS_FN(theme), [theme]);

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 8 },
    title: { color: theme.text.primary, fontSize: 20, fontWeight: fonts.bold },
    closeBtn: { color: theme.accent.blue, fontSize: 16 },
    scroll: { flex: 1, paddingHorizontal: 16 },
    subtitle: { color: theme.text.muted, fontSize: 13, lineHeight: 19, marginBottom: 16 },
    tabRow: { flexDirection: 'row', marginBottom: 16, gap: 4 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: theme.bg.card, alignItems: 'center' },
    tabActive: { backgroundColor: theme.accent.blue },
    tabText: { color: theme.text.secondary, fontSize: 12, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    card: { backgroundColor: theme.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    label: { color: theme.text.muted, fontSize: 12 },
    val: { color: theme.text.secondary, fontSize: 12, fontWeight: fonts.semibold },
    empty: { color: theme.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40 },
    summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    summaryCard: { flex: 1, backgroundColor: theme.bg.card, borderRadius: 12, padding: 14, alignItems: 'center' },
    summaryNum: { fontSize: 20, fontWeight: fonts.heavy, marginBottom: 2 },
    summaryLabel: { color: theme.text.muted, fontSize: 10, fontWeight: fonts.semibold, textAlign: 'center' },
    nameText: { color: theme.text.primary, fontSize: 15, fontWeight: fonts.bold },
    uidText: { color: theme.text.muted, fontSize: 11 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    badgeText: { fontSize: 10, fontWeight: fonts.bold, color: '#fff' },
    trustBar: { height: 6, backgroundColor: theme.border, borderRadius: 3, marginTop: 6, overflow: 'hidden' },
    trustFill: { height: 6, borderRadius: 3 },
    filterRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: theme.bg.card },
    filterChipActive: { backgroundColor: theme.accent.blue },
    filterText: { color: theme.text.secondary, fontSize: 11, fontWeight: fonts.semibold },
    filterTextActive: { color: '#fff' },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    claimTitle: { color: theme.text.primary, fontSize: 14, fontWeight: fonts.bold, marginBottom: 2 },
    claimDesc: { color: theme.text.secondary, fontSize: 12, lineHeight: 17 },
    candidateScore: { fontSize: 18, fontWeight: fonts.heavy },
  }), [theme]);

  const connections = demoMode ? DEMO_CONNECTIONS : [];
  const verifications = demoMode ? DEMO_VERIFICATIONS : [];
  const candidates = demoMode ? DEMO_CANDIDATES : [];

  const filtered = useMemo(() => {
    if (filterDirection === 'all') return connections;
    return connections.filter(c => c.direction === filterDirection);
  }, [connections, filterDirection]);

  const mutualCount = connections.filter(c => c.direction === 'mutual').length;
  const inboundCount = connections.filter(c => c.direction === 'inbound').length;
  const outboundCount = connections.filter(c => c.direction === 'outbound').length;

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.title}>Trust Network</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={st.scroll}>
        <Text style={st.subtitle}>
          Your web of trust — built through consistent positive contributions and verified attestations.
        </Text>

        {demoMode && (
          <View style={st.summaryRow}>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: theme.accent.green }]}>{mutualCount}</Text>
              <Text style={st.summaryLabel}>Mutual</Text>
            </View>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: theme.accent.blue }]}>{inboundCount}</Text>
              <Text style={st.summaryLabel}>Trust You</Text>
            </View>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: theme.accent.yellow }]}>{outboundCount}</Text>
              <Text style={st.summaryLabel}>You Trust</Text>
            </View>
          </View>
        )}

        <View style={st.tabRow}>
          {(['network', 'build', 'verify'] as TrustTab[]).map(tab => (
            <TouchableOpacity key={tab} style={[st.tab, activeTab === tab && st.tabActive]}
              onPress={() => setActiveTab(tab)}>
              <Text style={[st.tabText, activeTab === tab && st.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'network' && (
          connections.length === 0 ? (
            <Text style={st.empty}>Enable Demo Mode to see your trust network.</Text>
          ) : (
            <>
              <View style={st.filterRow}>
                {['all', 'mutual', 'inbound', 'outbound'].map(f => (
                  <TouchableOpacity key={f} style={[st.filterChip, filterDirection === f && st.filterChipActive]}
                    onPress={() => setFilterDirection(f)}>
                    <Text style={[st.filterText, filterDirection === f && st.filterTextActive]}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {filtered.map(conn => (
                <View key={conn.id} style={st.card}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={st.nameText}>{conn.displayName}</Text>
                      <Text style={st.uidText}>{conn.uid} | Since {conn.since}</Text>
                    </View>
                    <View style={[st.badge, { backgroundColor: directionColors[conn.direction] }]}>
                      <Text style={st.badgeText}>{DIRECTION_LABELS[conn.direction]}</Text>
                    </View>
                  </View>
                  <View style={st.row}><Text style={st.label}>Trust Level</Text><Text style={st.val}>{conn.trustLevel}%</Text></View>
                  <View style={st.trustBar}>
                    <View style={[st.trustFill, { width: `${conn.trustLevel}%`, backgroundColor: theme.accent.green }]} />
                  </View>
                  <View style={[st.row, { marginTop: 6 }]}>
                    <Text style={st.label}>{conn.channelIcon} {conn.topChannel}</Text>
                    <Text style={st.val}>{conn.totalOTK.toLocaleString()} OTK</Text>
                  </View>
                </View>
              ))}
            </>
          )
        )}

        {activeTab === 'build' && (
          candidates.length === 0 ? (
            <Text style={st.empty}>Enable Demo Mode to see trust candidates.</Text>
          ) : (
            <>
              <Text style={{ color: theme.text.muted, fontSize: 13, marginBottom: 12 }}>
                Suggested connections based on mutual trust and contribution history.
              </Text>
              {candidates.map(c => (
                <View key={c.uid} style={st.card}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ fontSize: 20, marginRight: 10 }}>{c.channelIcon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={st.nameText}>{c.displayName}</Text>
                      <Text style={st.uidText}>{c.uid}</Text>
                    </View>
                    <Text style={[st.candidateScore, { color: theme.accent.green }]}>{c.communityScore}</Text>
                  </View>
                  <View style={st.row}><Text style={st.label}>Total OTK</Text><Text style={st.val}>{c.totalOTK.toLocaleString()}</Text></View>
                  <View style={st.row}><Text style={st.label}>Mutual Connections</Text><Text style={st.val}>{c.mutualConnections}</Text></View>
                  <View style={st.row}><Text style={st.label}>Top Channel</Text><Text style={st.val}>{c.channelIcon} {c.topChannel}</Text></View>
                </View>
              ))}
            </>
          )
        )}

        {activeTab === 'verify' && (
          verifications.length === 0 ? (
            <Text style={st.empty}>Enable Demo Mode to see verification requests.</Text>
          ) : verifications.map(v => (
            <View key={v.id} style={[st.card, { borderLeftWidth: 3, borderLeftColor: STATUS_COLORS[v.status] }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <View style={[st.statusDot, { backgroundColor: STATUS_COLORS[v.status] }]} />
                <Text style={st.claimTitle}>{v.claimType}</Text>
              </View>
              <Text style={st.uidText}>{v.claimant}</Text>
              <Text style={st.claimDesc}>{v.description}</Text>
              <View style={[st.row, { marginTop: 8 }]}>
                <Text style={st.label}>Evidence</Text>
                <Text style={st.val}>{v.evidence}</Text>
              </View>
              <View style={st.row}><Text style={st.label}>Status</Text><Text style={[st.val, { color: STATUS_COLORS[v.status] }]}>{v.status}</Text></View>
            </View>
          ))
        )}

        {!demoMode && (
          <View style={[st.card, { marginTop: 20 }]}>
            <Text style={{ color: theme.text.muted, fontSize: 13, textAlign: 'center' }}>
              Enable Demo Mode in Settings to see sample trust network data.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
