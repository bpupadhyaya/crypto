/**
 * Environmental Impact Screen — The Human Constitution Art I.
 *
 * Environmental contributions tracked as a value dimension.
 * Trees planted, cleanups organized, carbon offset, renewable adoption —
 * every green action earns ecoOTK and raises your Environmental Score.
 *
 * Features:
 * - Environmental score dashboard (0-100, personal + community)
 * - Activity tracking: tree planting, cleanup drives, recycling, renewable energy, water conservation, composting
 * - Carbon footprint tracker (blockchain activity + self-reported)
 * - Environmental projects (community gardens, reforestation, beach cleanup)
 * - Eco-challenges with OTK rewards
 * - Regional environmental health heatmap (green/yellow/red)
 * - Pledge system for environmental goals
 * - Demo data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface EnvironmentalActivity {
  id: string;
  type: 'tree_planting' | 'cleanup' | 'recycling' | 'renewable_energy' | 'water_conservation' | 'composting';
  title: string;
  ecoOTK: number;
  date: string;
  carbonOffsetKg: number;
  verified: boolean;
}

interface CarbonFootprint {
  blockchainEstimateKg: number;
  selfReportedKg: number;
  offsetKg: number;
  netKg: number;
  monthlyTrend: number; // percent change
}

interface EnvProject {
  id: string;
  name: string;
  category: 'community_garden' | 'reforestation' | 'beach_cleanup' | 'solar_coop' | 'wetland_restore';
  participants: number;
  goal: string;
  progressPercent: number;
  ecoOTKPool: number;
  location: string;
}

interface EcoChallenge {
  id: string;
  title: string;
  description: string;
  otkReward: number;
  daysLeft: number;
  progressPercent: number;
  participants: number;
  category: string;
}

interface RegionalZone {
  region: string;
  score: number;
  status: 'green' | 'yellow' | 'red';
  topIssue: string;
}

interface EnvironmentalPledge {
  id: string;
  goal: string;
  targetDate: string;
  progressPercent: number;
  committed: boolean;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const ACTIVITY_TYPE_INFO: Record<string, { label: string; icon: string; color: string }> = {
  tree_planting: { label: 'Tree Planting', icon: '🌳', color: '#34C759' },
  cleanup: { label: 'Cleanup Drive', icon: '🧹', color: '#007AFF' },
  recycling: { label: 'Recycling', icon: '♻️', color: '#5AC8FA' },
  renewable_energy: { label: 'Renewable Energy', icon: '☀️', color: '#FF9500' },
  water_conservation: { label: 'Water Conservation', icon: '💧', color: '#5856D6' },
  composting: { label: 'Composting', icon: '🌱', color: '#8B6914' },
};

const ZONE_COLORS: Record<string, string> = {
  green: '#34C759',
  yellow: '#FFD60A',
  red: '#FF3B30',
};

const PROJECT_CATEGORY_LABELS: Record<string, string> = {
  community_garden: 'Community Garden',
  reforestation: 'Reforestation',
  beach_cleanup: 'Beach Cleanup',
  solar_coop: 'Solar Co-op',
  wetland_restore: 'Wetland Restoration',
};

// ─── Demo Data ───

const DEMO_SCORE = 72;
const DEMO_COMMUNITY_SCORE = 65;
const DEMO_TOTAL_ECO_OTK = 8400;

const DEMO_ACTIVITIES: EnvironmentalActivity[] = [
  { id: '1', type: 'tree_planting', title: 'Planted 12 oak trees in Riverside Park', ecoOTK: 600, date: '2026-03-27', carbonOffsetKg: 240, verified: true },
  { id: '2', type: 'cleanup', title: 'Organized neighborhood cleanup — 80kg waste collected', ecoOTK: 450, date: '2026-03-24', carbonOffsetKg: 15, verified: true },
  { id: '3', type: 'recycling', title: 'Set up recycling station at community center', ecoOTK: 300, date: '2026-03-21', carbonOffsetKg: 45, verified: true },
  { id: '4', type: 'renewable_energy', title: 'Installed 4kW rooftop solar panels', ecoOTK: 1200, date: '2026-03-18', carbonOffsetKg: 3200, verified: true },
  { id: '5', type: 'water_conservation', title: 'Installed rainwater harvesting system', ecoOTK: 500, date: '2026-03-14', carbonOffsetKg: 20, verified: false },
  { id: '6', type: 'composting', title: 'Started community composting program — 25 households joined', ecoOTK: 800, date: '2026-03-10', carbonOffsetKg: 180, verified: true },
  { id: '7', type: 'tree_planting', title: 'Joined citywide reforestation drive — 5 trees', ecoOTK: 250, date: '2026-03-05', carbonOffsetKg: 100, verified: true },
];

const DEMO_CARBON: CarbonFootprint = {
  blockchainEstimateKg: 42,
  selfReportedKg: 1850,
  offsetKg: 3800,
  netKg: -1908,
  monthlyTrend: -12,
};

const DEMO_PROJECTS: EnvProject[] = [
  { id: 'p1', name: 'Riverside Community Garden', category: 'community_garden', participants: 34, goal: 'Feed 50 families with organic produce', progressPercent: 68, ecoOTKPool: 15000, location: 'Riverside District' },
  { id: 'p2', name: 'Mountain Ridge Reforestation', category: 'reforestation', participants: 128, goal: 'Plant 10,000 native trees by 2027', progressPercent: 42, ecoOTKPool: 50000, location: 'Northern Highlands' },
  { id: 'p3', name: 'Coastal Beach Restoration', category: 'beach_cleanup', participants: 67, goal: 'Remove 5 tons of plastic waste', progressPercent: 55, ecoOTKPool: 20000, location: 'South Bay' },
  { id: 'p4', name: 'Neighborhood Solar Co-op', category: 'solar_coop', participants: 22, goal: '100kW collective solar capacity', progressPercent: 78, ecoOTKPool: 30000, location: 'Eastside' },
  { id: 'p5', name: 'Marshland Wetland Restore', category: 'wetland_restore', participants: 45, goal: 'Restore 20 acres of wetland habitat', progressPercent: 30, ecoOTKPool: 25000, location: 'Delta Region' },
];

const DEMO_CHALLENGES: EcoChallenge[] = [
  { id: 'c1', title: 'Zero Waste Week', description: 'Produce zero landfill waste for 7 consecutive days', otkReward: 500, daysLeft: 5, progressPercent: 40, participants: 312, category: 'Waste Reduction' },
  { id: 'c2', title: 'Plant 5 Trees This Month', description: 'Plant and register 5 verified trees', otkReward: 300, daysLeft: 3, progressPercent: 80, participants: 189, category: 'Reforestation' },
  { id: 'c3', title: 'Walk/Bike Commute Challenge', description: 'Replace car commutes with walking or cycling for 20 days', otkReward: 400, daysLeft: 12, progressPercent: 55, participants: 456, category: 'Transportation' },
  { id: 'c4', title: 'Home Energy Audit', description: 'Complete a full home energy audit and reduce usage by 10%', otkReward: 600, daysLeft: 18, progressPercent: 25, participants: 98, category: 'Energy' },
];

const DEMO_ZONES: RegionalZone[] = [
  { region: 'Northern Highlands', score: 82, status: 'green', topIssue: 'Strong reforestation efforts' },
  { region: 'Riverside District', score: 71, status: 'green', topIssue: 'Active community gardens' },
  { region: 'Eastside', score: 58, status: 'yellow', topIssue: 'Air quality needs improvement' },
  { region: 'South Bay', score: 45, status: 'yellow', topIssue: 'Coastal plastic pollution' },
  { region: 'Delta Region', score: 38, status: 'red', topIssue: 'Wetland habitat loss' },
  { region: 'Industrial Quarter', score: 28, status: 'red', topIssue: 'High carbon emissions' },
];

const DEMO_PLEDGES: EnvironmentalPledge[] = [
  { id: 'pl1', goal: 'Plant 50 trees by end of 2026', targetDate: '2026-12-31', progressPercent: 34, committed: true },
  { id: 'pl2', goal: 'Achieve net-zero personal carbon by 2027', targetDate: '2027-06-30', progressPercent: 52, committed: true },
  { id: 'pl3', goal: 'Convert fully to renewable energy at home', targetDate: '2026-09-30', progressPercent: 78, committed: true },
  { id: 'pl4', goal: 'Organize 12 community cleanups this year', targetDate: '2026-12-31', progressPercent: 25, committed: false },
];

type Tab = 'dashboard' | 'log' | 'projects' | 'challenges';

const TAB_LABELS: Record<Tab, string> = {
  dashboard: 'Dashboard',
  log: 'Activity Log',
  projects: 'Projects',
  challenges: 'Challenges',
};

// ─── Component ───

export function EnvironmentalImpactScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('dashboard');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const activities = DEMO_ACTIVITIES;
  const carbon = DEMO_CARBON;
  const projects = DEMO_PROJECTS;
  const challenges = DEMO_CHALLENGES;
  const zones = DEMO_ZONES;
  const pledges = DEMO_PLEDGES;

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.green + '20' },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: '600' },
    tabTextActive: { color: t.accent.green },

    // Score dashboard
    scoreCard: { backgroundColor: t.accent.green + '12', borderRadius: 24, padding: 28, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    scoreLabel: { color: t.text.muted, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
    scoreValue: { color: t.accent.green, fontSize: 56, fontWeight: '900', marginTop: 4 },
    scoreMax: { color: t.text.muted, fontSize: 18, fontWeight: '600' },
    scoreRow: { flexDirection: 'row', gap: 32, marginTop: 16 },
    scoreItem: { alignItems: 'center' },
    scoreItemValue: { color: t.text.primary, fontSize: 22, fontWeight: '800' },
    scoreItemLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    ecoOTKText: { color: t.accent.green, fontSize: 14, fontWeight: '700', marginTop: 12 },

    // Carbon tracker
    carbonCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    cardTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 12 },
    carbonRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    carbonLabel: { color: t.text.muted, fontSize: 13 },
    carbonValue: { color: t.text.primary, fontSize: 13, fontWeight: '600' },
    carbonNet: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: t.border, marginTop: 6 },
    carbonNetLabel: { color: t.text.primary, fontSize: 14, fontWeight: '700' },
    carbonNetValue: { fontSize: 14, fontWeight: '800' },
    trendBadge: { alignSelf: 'flex-end', marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    trendText: { fontSize: 12, fontWeight: '700' },

    // Heatmap
    heatmapCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    zoneRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    zoneDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
    zoneInfo: { flex: 1 },
    zoneName: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    zoneIssue: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    zoneScore: { color: t.text.primary, fontSize: 16, fontWeight: '800', marginLeft: 8 },

    // Pledges
    pledgeCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    pledgeRow: { paddingVertical: 10, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    pledgeGoal: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    pledgeMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    pledgeBarOuter: { height: 6, backgroundColor: t.bg.primary, borderRadius: 3, marginTop: 8 },
    pledgeBarInner: { height: 6, borderRadius: 3 },
    pledgeCommitBtn: { backgroundColor: t.accent.green, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, alignSelf: 'flex-start', marginTop: 8 },
    pledgeCommitText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    pledgeCommitted: { color: t.accent.green, fontSize: 12, fontWeight: '600', marginTop: 8 },

    // Activity log
    activityRow: { flexDirection: 'row', borderBottomColor: t.bg.primary, borderBottomWidth: 1, paddingVertical: 12, paddingHorizontal: 20 },
    activityDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12, marginTop: 5 },
    activityInfo: { flex: 1 },
    activityTitle: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    activityMeta: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    activityRight: { alignItems: 'flex-end', justifyContent: 'center' },
    activityOTK: { color: t.accent.green, fontSize: 14, fontWeight: '700' },
    activityCarbon: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    verifiedBadge: { color: t.accent.green, fontSize: 11, fontWeight: '600', marginTop: 2 },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },

    // Projects
    projectCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 12 },
    projectName: { color: t.text.primary, fontSize: 16, fontWeight: '700' },
    projectCategory: { color: t.accent.green, fontSize: 12, fontWeight: '600', marginTop: 4 },
    projectMeta: { color: t.text.muted, fontSize: 12, marginTop: 4, lineHeight: 18 },
    projectBarOuter: { height: 8, backgroundColor: t.bg.primary, borderRadius: 4, marginTop: 10 },
    projectBarInner: { height: 8, borderRadius: 4, backgroundColor: t.accent.green },
    projectStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    projectStat: { color: t.text.muted, fontSize: 12 },
    projectStatBold: { color: t.text.primary, fontWeight: '700' },
    joinBtn: { backgroundColor: t.accent.green, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-start', marginTop: 12 },
    joinBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

    // Challenges
    challengeCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 12 },
    challengeTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700' },
    challengeDesc: { color: t.text.muted, fontSize: 13, marginTop: 4, lineHeight: 19 },
    challengeBarOuter: { height: 8, backgroundColor: t.bg.primary, borderRadius: 4, marginTop: 12 },
    challengeBarInner: { height: 8, borderRadius: 4, backgroundColor: t.accent.blue },
    challengeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    challengeReward: { color: t.accent.green, fontSize: 14, fontWeight: '700' },
    challengeDays: { color: t.accent.orange, fontSize: 13, fontWeight: '600' },
    challengeParticipants: { color: t.text.muted, fontSize: 12 },
    challengeCategory: { color: t.accent.blue, fontSize: 11, fontWeight: '600', marginTop: 4 },

    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 12, marginHorizontal: 20 },
    heroCard: { backgroundColor: t.accent.green + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    heroText: { color: t.text.primary, fontSize: 15, fontWeight: '600', textAlign: 'center', lineHeight: 22 },
    heroSub: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginTop: 6 },
    logSummary: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 20, marginBottom: 16, backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16 },
    logStat: { alignItems: 'center' },
    logStatValue: { color: t.text.primary, fontSize: 18, fontWeight: '800' },
    logStatLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
  }), [t]);

  const handleJoinProject = useCallback((name: string) => {
    Alert.alert('Join Project', `Request to join "${name}" submitted. You will receive a confirmation once approved.`);
  }, []);

  const handleAcceptChallenge = useCallback((title: string) => {
    Alert.alert('Challenge Accepted', `You have joined "${title}". Track your progress in the Challenges tab.`);
  }, []);

  const handleCommitPledge = useCallback((goal: string) => {
    Alert.alert('Pledge Committed', `You have pledged: "${goal}". Your commitment is recorded on-chain.`);
  }, []);

  // ─── Tab: Dashboard ───

  const renderDashboard = () => (
    <>
      {/* Constitution quote */}
      <View style={s.heroCard}>
        <Text style={s.heroText}>
          "Every act of environmental stewardship strengthens the chain of life."
        </Text>
        <Text style={s.heroSub}>The Human Constitution — Article I: Environmental Contributions</Text>
      </View>

      {/* Score card */}
      <View style={s.scoreCard}>
        <Text style={s.scoreLabel}>Your Environmental Score</Text>
        <Text>
          <Text style={s.scoreValue}>{DEMO_SCORE}</Text>
          <Text style={s.scoreMax}> / 100</Text>
        </Text>
        <View style={s.scoreRow}>
          <View style={s.scoreItem}>
            <Text style={s.scoreItemValue}>{DEMO_COMMUNITY_SCORE}</Text>
            <Text style={s.scoreItemLabel}>Community Avg</Text>
          </View>
          <View style={s.scoreItem}>
            <Text style={s.scoreItemValue}>{activities.length}</Text>
            <Text style={s.scoreItemLabel}>Activities</Text>
          </View>
          <View style={s.scoreItem}>
            <Text style={[s.scoreItemValue, { color: t.accent.green }]}>{(carbon.offsetKg / 1000).toFixed(1)}t</Text>
            <Text style={s.scoreItemLabel}>CO₂ Offset</Text>
          </View>
        </View>
        <Text style={s.ecoOTKText}>{DEMO_TOTAL_ECO_OTK.toLocaleString()} ecoOTK earned</Text>
      </View>

      {/* Carbon footprint */}
      <View style={s.carbonCard}>
        <Text style={s.cardTitle}>Carbon Footprint Tracker</Text>
        <View style={s.carbonRow}>
          <Text style={s.carbonLabel}>Blockchain activity (est.)</Text>
          <Text style={s.carbonValue}>{carbon.blockchainEstimateKg} kg CO₂</Text>
        </View>
        <View style={s.carbonRow}>
          <Text style={s.carbonLabel}>Self-reported emissions</Text>
          <Text style={s.carbonValue}>{carbon.selfReportedKg.toLocaleString()} kg CO₂</Text>
        </View>
        <View style={s.carbonRow}>
          <Text style={s.carbonLabel}>Total offset</Text>
          <Text style={[s.carbonValue, { color: t.accent.green }]}>-{carbon.offsetKg.toLocaleString()} kg CO₂</Text>
        </View>
        <View style={s.carbonNet}>
          <Text style={s.carbonNetLabel}>Net Carbon</Text>
          <Text style={[s.carbonNetValue, { color: carbon.netKg <= 0 ? t.accent.green : '#FF3B30' }]}>
            {carbon.netKg.toLocaleString()} kg CO₂
          </Text>
        </View>
        <View style={[s.trendBadge, { backgroundColor: (carbon.monthlyTrend <= 0 ? t.accent.green : '#FF3B30') + '15' }]}>
          <Text style={[s.trendText, { color: carbon.monthlyTrend <= 0 ? t.accent.green : '#FF3B30' }]}>
            {carbon.monthlyTrend <= 0 ? '↓' : '↑'} {Math.abs(carbon.monthlyTrend)}% this month
          </Text>
        </View>
      </View>

      {/* Regional heatmap */}
      <View style={s.heatmapCard}>
        <Text style={s.cardTitle}>Regional Environmental Health</Text>
        {zones.map((zone) => (
          <View key={zone.region} style={s.zoneRow}>
            <View style={[s.zoneDot, { backgroundColor: ZONE_COLORS[zone.status] }]} />
            <View style={s.zoneInfo}>
              <Text style={s.zoneName}>{zone.region}</Text>
              <Text style={s.zoneIssue}>{zone.topIssue}</Text>
            </View>
            <Text style={[s.zoneScore, { color: ZONE_COLORS[zone.status] }]}>{zone.score}</Text>
          </View>
        ))}
      </View>

      {/* Pledges */}
      <View style={s.pledgeCard}>
        <Text style={s.cardTitle}>Environmental Pledges</Text>
        {pledges.map((pledge) => (
          <View key={pledge.id} style={s.pledgeRow}>
            <Text style={s.pledgeGoal}>{pledge.goal}</Text>
            <Text style={s.pledgeMeta}>Target: {pledge.targetDate}</Text>
            <View style={s.pledgeBarOuter}>
              <View style={[s.pledgeBarInner, { width: `${pledge.progressPercent}%`, backgroundColor: t.accent.green }]} />
            </View>
            {pledge.committed ? (
              <Text style={s.pledgeCommitted}>Committed — {pledge.progressPercent}% complete</Text>
            ) : (
              <TouchableOpacity style={s.pledgeCommitBtn} onPress={() => handleCommitPledge(pledge.goal)}>
                <Text style={s.pledgeCommitText}>Commit to Pledge</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    </>
  );

  // ─── Tab: Activity Log ───

  const renderLog = () => {
    const totalCarbon = activities.reduce((sum, a) => sum + a.carbonOffsetKg, 0);
    const totalOTK = activities.reduce((sum, a) => sum + a.ecoOTK, 0);
    const typeCounts = activities.reduce<Record<string, number>>((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    }, {});

    return (
      <>
        <View style={s.logSummary}>
          <View style={s.logStat}>
            <Text style={s.logStatValue}>{activities.length}</Text>
            <Text style={s.logStatLabel}>Activities</Text>
          </View>
          <View style={s.logStat}>
            <Text style={[s.logStatValue, { color: t.accent.green }]}>{totalOTK.toLocaleString()}</Text>
            <Text style={s.logStatLabel}>ecoOTK Earned</Text>
          </View>
          <View style={s.logStat}>
            <Text style={s.logStatValue}>{(totalCarbon / 1000).toFixed(1)}t</Text>
            <Text style={s.logStatLabel}>CO₂ Offset</Text>
          </View>
        </View>

        {/* Breakdown by type */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Activity Breakdown</Text>
          {Object.entries(typeCounts).map(([type, count]) => {
            const info = ACTIVITY_TYPE_INFO[type];
            return (
              <View key={type} style={[s.carbonRow, { paddingVertical: 6 }]}>
                <Text style={s.carbonLabel}>{info?.icon} {info?.label || type}</Text>
                <Text style={[s.carbonValue, { color: info?.color }]}>{count} {count === 1 ? 'activity' : 'activities'}</Text>
              </View>
            );
          })}
        </View>

        {/* Activity list */}
        {activities.map((activity) => {
          const info = ACTIVITY_TYPE_INFO[activity.type];
          return (
            <View key={activity.id} style={s.activityRow}>
              <View style={[s.activityDot, { backgroundColor: info?.color || t.text.muted }]} />
              <View style={s.activityInfo}>
                <Text style={s.activityTitle}>{activity.title}</Text>
                <Text style={s.activityMeta}>{info?.label} — {activity.date}</Text>
              </View>
              <View style={s.activityRight}>
                <Text style={s.activityOTK}>+{activity.ecoOTK} ecoOTK</Text>
                <Text style={s.activityCarbon}>-{activity.carbonOffsetKg} kg CO₂</Text>
                {activity.verified && <Text style={s.verifiedBadge}>Verified</Text>}
              </View>
            </View>
          );
        })}
      </>
    );
  };

  // ─── Tab: Projects ───

  const renderProjects = () => (
    <>
      <Text style={s.sectionTitle}>Environmental Projects</Text>
      {projects.map((project) => (
        <View key={project.id} style={s.projectCard}>
          <Text style={s.projectName}>{project.name}</Text>
          <Text style={s.projectCategory}>{PROJECT_CATEGORY_LABELS[project.category] || project.category}</Text>
          <Text style={s.projectMeta}>
            {project.goal}{'\n'}
            Location: {project.location}
          </Text>
          <View style={s.projectBarOuter}>
            <View style={[s.projectBarInner, { width: `${project.progressPercent}%` }]} />
          </View>
          <View style={s.projectStats}>
            <Text style={s.projectStat}>
              <Text style={s.projectStatBold}>{project.participants}</Text> participants
            </Text>
            <Text style={s.projectStat}>
              <Text style={s.projectStatBold}>{project.progressPercent}%</Text> complete
            </Text>
            <Text style={s.projectStat}>
              <Text style={[s.projectStatBold, { color: t.accent.green }]}>{project.ecoOTKPool.toLocaleString()}</Text> ecoOTK pool
            </Text>
          </View>
          <TouchableOpacity style={s.joinBtn} onPress={() => handleJoinProject(project.name)}>
            <Text style={s.joinBtnText}>Join Project</Text>
          </TouchableOpacity>
        </View>
      ))}
    </>
  );

  // ─── Tab: Challenges ───

  const renderChallenges = () => (
    <>
      <Text style={s.sectionTitle}>Eco-Challenges — Monthly</Text>
      {challenges.map((challenge) => (
        <View key={challenge.id} style={s.challengeCard}>
          <Text style={s.challengeTitle}>{challenge.title}</Text>
          <Text style={s.challengeCategory}>{challenge.category}</Text>
          <Text style={s.challengeDesc}>{challenge.description}</Text>
          <View style={s.challengeBarOuter}>
            <View style={[s.challengeBarInner, { width: `${challenge.progressPercent}%` }]} />
          </View>
          <View style={s.challengeFooter}>
            <Text style={s.challengeReward}>{challenge.otkReward} OTK reward</Text>
            <Text style={s.challengeDays}>{challenge.daysLeft} days left</Text>
          </View>
          <Text style={s.challengeParticipants}>{challenge.participants} participants</Text>
          <TouchableOpacity style={s.joinBtn} onPress={() => handleAcceptChallenge(challenge.title)}>
            <Text style={s.joinBtnText}>Accept Challenge</Text>
          </TouchableOpacity>
        </View>
      ))}
    </>
  );

  // ─── Render ───

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Environmental Impact</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {(['dashboard', 'log', 'projects', 'challenges'] as Tab[]).map((t_) => (
          <TouchableOpacity
            key={t_}
            style={[s.tabBtn, tab === t_ && s.tabActive]}
            onPress={() => setTab(t_)}
          >
            <Text style={[s.tabText, tab === t_ && s.tabTextActive]}>
              {TAB_LABELS[t_]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {tab === 'dashboard' && renderDashboard()}
        {tab === 'log' && renderLog()}
        {tab === 'projects' && renderProjects()}
        {tab === 'challenges' && renderChallenges()}
      </ScrollView>
    </SafeAreaView>
  );
}
