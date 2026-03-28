/**
 * Social Feed Screen — Community activity feed from Open Chain.
 *
 * Shows recent gratitude transactions, milestone achievements,
 * governance results, verifier registrations, and token launches.
 * Pull to refresh. Demo mode with sample feed items.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, RefreshControl,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

// --- Types ---

type FeedItemType = 'gratitude' | 'milestone' | 'governance' | 'verifier' | 'token_launch';

interface FeedItem {
  id: string;
  type: FeedItemType;
  actorUid: string;
  actorName?: string;
  description: string;
  timestamp: number;
  metadata?: Record<string, string>;
}

// --- Constants ---

const TYPE_CONFIG: Record<FeedItemType, { icon: string; label: string; color: string }> = {
  gratitude:    { icon: '\u{1F64F}', label: 'Gratitude',    color: '#a855f7' },
  milestone:    { icon: '\u{1F3C6}', label: 'Milestone',    color: '#f59e0b' },
  governance:   { icon: '\u{1F3DB}', label: 'Governance',   color: '#3b82f6' },
  verifier:     { icon: '\u{2705}',  label: 'Verifier',     color: '#22c55e' },
  token_launch: { icon: '\u{1F680}', label: 'Token Launch', color: '#ef4444' },
};

// --- Demo data ---

const now = Date.now();

const DEMO_FEED: FeedItem[] = [
  {
    id: 'f1', type: 'gratitude', actorUid: 'uid-alice-7f3a', actorName: 'Alice',
    description: 'Sent 50 nOTK gratitude to her mother for years of nurturing support.',
    timestamp: now - 1000 * 60 * 15,
    metadata: { amount: '50 nOTK', channel: 'Nurture' },
  },
  {
    id: 'f2', type: 'milestone', actorUid: 'uid-bob-2e9c', actorName: 'Bob',
    description: 'Achieved "Mentor of the Year" (Gold) -- mentored 15 students to college admission.',
    timestamp: now - 1000 * 60 * 45,
    metadata: { level: 'Gold', verifiers: '6' },
  },
  {
    id: 'f3', type: 'governance', actorUid: 'uid-system',
    description: 'Proposal #42 "Education Fund Expansion" passed with 87% approval (1,247 votes).',
    timestamp: now - 1000 * 60 * 60 * 2,
    metadata: { proposalId: '#42', approval: '87%', votes: '1,247' },
  },
  {
    id: 'f4', type: 'verifier', actorUid: 'uid-carol-8b1d', actorName: 'Carol',
    description: 'Registered as a milestone verifier in the Education channel.',
    timestamp: now - 1000 * 60 * 60 * 5,
    metadata: { channel: 'Education' },
  },
  {
    id: 'f5', type: 'gratitude', actorUid: 'uid-dave-4f5e', actorName: 'Dave',
    description: 'Sent 200 eOTK gratitude to Prof. Kumar for transformative physics lessons.',
    timestamp: now - 1000 * 60 * 60 * 8,
    metadata: { amount: '200 eOTK', channel: 'Education' },
  },
  {
    id: 'f6', type: 'token_launch', actorUid: 'uid-eve-1a2b', actorName: 'Eve',
    description: 'Launched "GreenToken" (GRN) -- a community token for local sustainability initiatives.',
    timestamp: now - 1000 * 60 * 60 * 12,
    metadata: { symbol: 'GRN', supply: '1,000,000' },
  },
  {
    id: 'f7', type: 'milestone', actorUid: 'uid-frank-3c4d', actorName: 'Frank',
    description: 'Achieved "Community Builder" (Platinum) -- led projects benefiting 200+ families.',
    timestamp: now - 1000 * 60 * 60 * 18,
    metadata: { level: 'Platinum', verifiers: '8' },
  },
  {
    id: 'f8', type: 'governance', actorUid: 'uid-system',
    description: 'Proposal #41 "Healthcare Verifier Standards" passed with 72% approval (983 votes).',
    timestamp: now - 1000 * 60 * 60 * 24,
    metadata: { proposalId: '#41', approval: '72%', votes: '983' },
  },
  {
    id: 'f9', type: 'verifier', actorUid: 'uid-grace-5e6f', actorName: 'Grace',
    description: 'Registered as a milestone verifier in the Health channel.',
    timestamp: now - 1000 * 60 * 60 * 30,
    metadata: { channel: 'Health' },
  },
  {
    id: 'f10', type: 'gratitude', actorUid: 'uid-henry-7g8h', actorName: 'Henry',
    description: 'Sent 100 cOTK gratitude to the neighborhood council for community service.',
    timestamp: now - 1000 * 60 * 60 * 36,
    metadata: { amount: '100 cOTK', channel: 'Community' },
  },
];

// --- Helpers ---

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 1000 * 60) return 'Just now';
  if (diff < 1000 * 60 * 60) return `${Math.floor(diff / (1000 * 60))}m ago`;
  if (diff < 1000 * 60 * 60 * 24) return `${Math.floor(diff / (1000 * 60 * 60))}h ago`;
  return `${Math.floor(diff / (1000 * 60 * 60 * 24))}d ago`;
}

// --- Component ---

interface Props {
  onClose: () => void;
}

export function SocialFeedScreen({ onClose }: Props) {
  const t = useTheme();
  const [feedItems] = useState<FeedItem[]>(DEMO_FEED);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<FeedItemType | null>(null);

  const filtered = useMemo(() => {
    if (!filterType) return feedItems;
    return feedItems.filter(item => item.type === filterType);
  }, [feedItems, filterType]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // In real mode, this would query Open Chain events
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    headerTitle: { color: t.text.primary, fontSize: 20, fontWeight: '700' },
    closeText: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 20, marginBottom: 8, marginLeft: 4 },
    demoTag: { backgroundColor: t.accent.purple + '30', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, alignSelf: 'center', marginBottom: 12 },
    demoTagText: { color: t.accent.purple, fontSize: 11, fontWeight: '700' },
    filterRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
    filterChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: t.border },
    filterChipActive: { backgroundColor: t.accent.green },
    filterText: { color: t.text.secondary, fontSize: 12, fontWeight: '600' },
    filterTextActive: { color: t.bg.primary },
    feedCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    feedHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    feedIcon: { fontSize: 24, marginRight: 10 },
    feedTypeLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    feedTime: { color: t.text.muted, fontSize: 11, marginLeft: 'auto' },
    feedDesc: { color: t.text.primary, fontSize: 14, lineHeight: 20, marginBottom: 8 },
    feedActor: { color: t.text.muted, fontSize: 12 },
    feedMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    metaChip: { backgroundColor: t.bg.primary, borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8 },
    metaText: { color: t.text.secondary, fontSize: 11 },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40 },
    statsCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 8 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
    statBox: { alignItems: 'center' },
    statNumber: { color: t.text.primary, fontSize: 20, fontWeight: '700' },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
  }), [t]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of feedItems) {
      counts[item.type] = (counts[item.type] || 0) + 1;
    }
    return counts;
  }, [feedItems]);

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.headerTitle}>Community Feed</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={st.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent.green} />}
      >
        <View style={st.demoTag}>
          <Text style={st.demoTagText}>DEMO MODE</Text>
        </View>

        {/* Stats overview */}
        <View style={st.statsCard}>
          <View style={st.statsRow}>
            <View style={st.statBox}>
              <Text style={st.statNumber}>{feedItems.length}</Text>
              <Text style={st.statLabel}>Events</Text>
            </View>
            <View style={st.statBox}>
              <Text style={st.statNumber}>{stats['gratitude'] || 0}</Text>
              <Text style={st.statLabel}>Gratitude</Text>
            </View>
            <View style={st.statBox}>
              <Text style={st.statNumber}>{stats['milestone'] || 0}</Text>
              <Text style={st.statLabel}>Milestones</Text>
            </View>
            <View style={st.statBox}>
              <Text style={st.statNumber}>{stats['governance'] || 0}</Text>
              <Text style={st.statLabel}>Proposals</Text>
            </View>
          </View>
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <View style={st.filterRow}>
            <TouchableOpacity
              style={[st.filterChip, !filterType && st.filterChipActive]}
              onPress={() => setFilterType(null)}
            >
              <Text style={[st.filterText, !filterType && st.filterTextActive]}>All</Text>
            </TouchableOpacity>
            {(Object.keys(TYPE_CONFIG) as FeedItemType[]).map(type => {
              const cfg = TYPE_CONFIG[type];
              return (
                <TouchableOpacity
                  key={type}
                  style={[st.filterChip, filterType === type && st.filterChipActive]}
                  onPress={() => setFilterType(filterType === type ? null : type)}
                >
                  <Text style={[st.filterText, filterType === type && st.filterTextActive]}>
                    {cfg.icon} {cfg.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Feed items */}
        <Text style={st.section}>Recent Activity</Text>

        {filtered.length === 0 ? (
          <Text style={st.emptyText}>No activity found for this filter.</Text>
        ) : (
          filtered.map(item => {
            const cfg = TYPE_CONFIG[item.type];
            return (
              <View key={item.id} style={st.feedCard}>
                <View style={st.feedHeader}>
                  <Text style={st.feedIcon}>{cfg.icon}</Text>
                  <Text style={[st.feedTypeLabel, { color: cfg.color }]}>{cfg.label}</Text>
                  <Text style={st.feedTime}>{formatTime(item.timestamp)}</Text>
                </View>
                <Text style={st.feedDesc}>{item.description}</Text>
                <Text style={st.feedActor}>
                  {item.actorName ? `${item.actorName} (${item.actorUid})` : item.actorUid}
                </Text>
                {item.metadata && Object.keys(item.metadata).length > 0 && (
                  <View style={st.feedMeta}>
                    {Object.entries(item.metadata).map(([key, value]) => (
                      <View key={key} style={st.metaChip}>
                        <Text style={st.metaText}>{key}: {value}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
