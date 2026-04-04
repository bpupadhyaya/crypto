import { fonts } from '../utils/theme';
/**
 * World Map Screen — Global text-based map of Open Chain regions.
 *
 * Displays regions with Peace Index scores, regional statistics,
 * side-by-side comparison, and a regional leaderboard.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// --- Types ---

interface Region {
  id: string;
  name: string;
  continent: string;
  peaceIndex: number;  // 0-100
  uids: number;
  otkCirculating: number;
  eventsThisMonth: number;
  activeProjects: number;
  trend: 'up' | 'stable' | 'down';
}

type TabKey = 'regions' | 'compare' | 'leaderboard';

interface Props {
  onClose: () => void;
}

// --- Demo data ---

const DEMO_REGIONS: Region[] = [
  { id: 'r01', name: 'Nordic', continent: 'Europe', peaceIndex: 92, uids: 48000, otkCirculating: 2400000, eventsThisMonth: 340, activeProjects: 56, trend: 'up' },
  { id: 'r02', name: 'Western Europe', continent: 'Europe', peaceIndex: 85, uids: 125000, otkCirculating: 6800000, eventsThisMonth: 890, activeProjects: 142, trend: 'stable' },
  { id: 'r03', name: 'South Asia', continent: 'Asia', peaceIndex: 58, uids: 310000, otkCirculating: 4200000, eventsThisMonth: 1450, activeProjects: 234, trend: 'up' },
  { id: 'r04', name: 'East Asia', continent: 'Asia', peaceIndex: 72, uids: 280000, otkCirculating: 8900000, eventsThisMonth: 1100, activeProjects: 189, trend: 'stable' },
  { id: 'r05', name: 'Southeast Asia', continent: 'Asia', peaceIndex: 65, uids: 190000, otkCirculating: 3100000, eventsThisMonth: 780, activeProjects: 98, trend: 'up' },
  { id: 'r06', name: 'North America', continent: 'Americas', peaceIndex: 78, uids: 210000, otkCirculating: 7200000, eventsThisMonth: 920, activeProjects: 167, trend: 'stable' },
  { id: 'r07', name: 'Latin America', continent: 'Americas', peaceIndex: 55, uids: 175000, otkCirculating: 2800000, eventsThisMonth: 640, activeProjects: 112, trend: 'up' },
  { id: 'r08', name: 'East Africa', continent: 'Africa', peaceIndex: 48, uids: 95000, otkCirculating: 1200000, eventsThisMonth: 380, activeProjects: 78, trend: 'up' },
  { id: 'r09', name: 'West Africa', continent: 'Africa', peaceIndex: 44, uids: 82000, otkCirculating: 980000, eventsThisMonth: 290, activeProjects: 64, trend: 'up' },
  { id: 'r10', name: 'Middle East', continent: 'Asia', peaceIndex: 42, uids: 68000, otkCirculating: 1500000, eventsThisMonth: 210, activeProjects: 45, trend: 'stable' },
  { id: 'r11', name: 'Oceania', continent: 'Oceania', peaceIndex: 88, uids: 45000, otkCirculating: 1800000, eventsThisMonth: 180, activeProjects: 38, trend: 'stable' },
  { id: 'r12', name: 'Central Asia', continent: 'Asia', peaceIndex: 51, uids: 38000, otkCirculating: 620000, eventsThisMonth: 120, activeProjects: 29, trend: 'up' },
];

const TABS: { key: TabKey; label: string }[] = [
  { key: 'regions', label: 'Regions' },
  { key: 'compare', label: 'Compare' },
  { key: 'leaderboard', label: 'Leaderboard' },
];

// --- Component ---

export function WorldMapScreen({ onClose }: Props) {
  const t = useTheme();
  const demoMode = useWalletStore((s) => s.demoMode);

  const [activeTab, setActiveTab] = useState<TabKey>('regions');
  const [selectedRegions, setSelectedRegions] = useState<string[]>(['r01', 'r03']);
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);

  const sortedByPeace = useMemo(
    () => [...DEMO_REGIONS].sort((a, b) => b.peaceIndex - a.peaceIndex),
    [],
  );

  const peaceColor = (pi: number) => {
    if (pi >= 75) return '#22c55e';
    if (pi >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const trendIcon = (t: string) => {
    if (t === 'up') return '\u2191';
    if (t === 'down') return '\u2193';
    return '\u2192';
  };

  const formatNum = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n.toString();
  };

  const toggleCompare = (id: string) => {
    setSelectedRegions((prev) => {
      if (prev.includes(id)) return prev.filter((r) => r !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const compareRegions = useMemo(
    () => DEMO_REGIONS.filter((r) => selectedRegions.includes(r.id)),
    [selectedRegions],
  );

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    title: { fontSize: fonts.xl, fontWeight: fonts.bold, color: t.text.primary },
    closeBtn: { fontSize: fonts.lg, color: t.accent.green },
    tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: t.border },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
    tabActive: { borderBottomWidth: 2, borderBottomColor: t.accent.green },
    tabText: { fontSize: fonts.md, color: t.text.secondary },
    tabTextActive: { color: t.accent.green, fontWeight: fonts.semibold },
    scroll: { flex: 1 },
    section: { padding: 16, borderBottomWidth: 1, borderBottomColor: t.border },
    sectionTitle: { fontSize: fonts.lg, fontWeight: fonts.semibold, color: t.text.primary, marginBottom: 10 },
    card: {
      backgroundColor: t.bg.card, borderRadius: 12, padding: 14,
      marginBottom: 10, borderWidth: 1, borderColor: t.border,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    label: { fontSize: fonts.sm, color: t.text.secondary },
    value: { fontSize: fonts.md, color: t.text.primary, fontWeight: fonts.medium },
    subtext: { fontSize: fonts.sm, color: t.text.secondary },
    peaceScore: { fontSize: fonts.xl, fontWeight: fonts.heavy },
    trendText: { fontSize: fonts.md, fontWeight: fonts.semibold },
    statsGrid: {
      flexDirection: 'row', flexWrap: 'wrap', marginTop: 8,
    },
    statBox: { width: '50%', paddingVertical: 4 },
    statValue: { fontSize: fonts.md, fontWeight: fonts.semibold, color: t.text.primary },
    statLabel: { fontSize: fonts.xs, color: t.text.secondary },
    rankBadge: {
      width: 28, height: 28, borderRadius: 14, alignItems: 'center',
      justifyContent: 'center', marginRight: 10,
    },
    rankText: { fontSize: fonts.sm, fontWeight: fonts.bold, color: '#fff' },
    compareCol: { flex: 1, padding: 8 },
    compareHeader: { fontSize: fonts.md, fontWeight: fonts.bold, color: t.accent.green, marginBottom: 8 },
    compareDivider: { width: 1, backgroundColor: t.border },
    compareRow: {
      flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    compareLabel: { fontSize: fonts.sm, color: t.text.secondary, marginBottom: 12 },
    selectedBorder: { borderColor: t.accent.green, borderWidth: 2 },
    infoText: { fontSize: fonts.sm, color: t.text.secondary, lineHeight: 20 },
  }), [t]);

  const renderRegions = () => (
    <ScrollView style={styles.scroll}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Global Regions ({DEMO_REGIONS.length})</Text>
        {DEMO_REGIONS.map((r) => (
          <TouchableOpacity
            key={r.id}
            style={styles.card}
            onPress={() => setExpandedRegion(expandedRegion === r.id ? null : r.id)}
          >
            <View style={styles.row}>
              <View>
                <Text style={styles.value}>{r.name}</Text>
                <Text style={styles.subtext}>{r.continent}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.peaceScore, { color: peaceColor(r.peaceIndex) }]}>
                  {r.peaceIndex}
                </Text>
                <Text style={[styles.trendText, {
                  color: r.trend === 'up' ? '#22c55e' : r.trend === 'down' ? '#ef4444' : '#6b7280',
                }]}>
                  {trendIcon(r.trend)} Peace Index
                </Text>
              </View>
            </View>
            {expandedRegion === r.id && (
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{formatNum(r.uids)}</Text>
                  <Text style={styles.statLabel}>Universal IDs</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{formatNum(r.otkCirculating)}</Text>
                  <Text style={styles.statLabel}>OTK Circulating</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{r.eventsThisMonth}</Text>
                  <Text style={styles.statLabel}>Events / Month</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{r.activeProjects}</Text>
                  <Text style={styles.statLabel}>Active Projects</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderCompare = () => (
    <ScrollView style={styles.scroll}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select 2 Regions to Compare</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {DEMO_REGIONS.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={[styles.card, { width: '47%', marginHorizontal: '1.5%' },
                selectedRegions.includes(r.id) && styles.selectedBorder]}
              onPress={() => toggleCompare(r.id)}
            >
              <Text style={styles.value}>{r.name}</Text>
              <Text style={[styles.subtext, { color: peaceColor(r.peaceIndex) }]}>
                PI: {r.peaceIndex}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {compareRegions.length === 2 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comparison</Text>
          <View style={styles.compareRow}>
            <View style={styles.compareCol}>
              <Text style={styles.compareHeader}>{compareRegions[0].name}</Text>
            </View>
            <View style={styles.compareDivider} />
            <View style={styles.compareCol}>
              <Text style={styles.compareHeader}>{compareRegions[1].name}</Text>
            </View>
          </View>
          {(['peaceIndex', 'uids', 'otkCirculating', 'eventsThisMonth', 'activeProjects'] as const).map((key) => {
            const labels: Record<string, string> = {
              peaceIndex: 'Peace Index', uids: 'UIDs',
              otkCirculating: 'OTK Circulating', eventsThisMonth: 'Events/Month',
              activeProjects: 'Active Projects',
            };
            return (
              <View key={key}>
                <Text style={[styles.compareLabel, { textAlign: 'center', marginTop: 8 }]}>
                  {labels[key]}
                </Text>
                <View style={styles.compareRow}>
                  <View style={styles.compareCol}>
                    <Text style={styles.statValue}>{formatNum(compareRegions[0][key])}</Text>
                  </View>
                  <View style={styles.compareDivider} />
                  <View style={styles.compareCol}>
                    <Text style={styles.statValue}>{formatNum(compareRegions[1][key])}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );

  const renderLeaderboard = () => (
    <ScrollView style={styles.scroll}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Peace Index Leaderboard</Text>
        {sortedByPeace.map((r, idx) => (
          <View key={r.id} style={[styles.card, styles.row]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.rankBadge, {
                backgroundColor: idx === 0 ? '#ffd700' : idx === 1 ? '#c0c0c0' : idx === 2 ? '#cd7f32' : '#6b7280',
              }]}>
                <Text style={styles.rankText}>{idx + 1}</Text>
              </View>
              <View>
                <Text style={styles.value}>{r.name}</Text>
                <Text style={styles.subtext}>{r.continent}</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.peaceScore, { color: peaceColor(r.peaceIndex), fontSize: fonts.xl }]}>
                {r.peaceIndex}
              </Text>
              <Text style={[styles.trendText, { fontSize: fonts.sm,
                color: r.trend === 'up' ? '#22c55e' : r.trend === 'down' ? '#ef4444' : '#6b7280',
              }]}>
                {trendIcon(r.trend)} {r.trend}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>World Map</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'regions' && renderRegions()}
      {activeTab === 'compare' && renderCompare()}
      {activeTab === 'leaderboard' && renderLeaderboard()}
    </SafeAreaView>
  );
}
