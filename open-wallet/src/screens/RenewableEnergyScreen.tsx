/**
 * Community Renewable Energy — Article I of The Human Constitution.
 *
 * "Every human being has the right to life-sustaining resources."
 *
 * Community-owned renewable energy projects: shared solar, micro-wind,
 * biogas digesters, and mini-hydro. Members invest OTK, earn energy
 * credits, and share surplus power with neighbors in need.
 *
 * Features:
 * - Community energy dashboard: kWh generated, CO2 saved, homes powered
 * - Energy projects list with production stats
 * - Join/invest in projects, earn energy credits
 * - Production tracking (daily/weekly/monthly text charts)
 * - Carbon credits earned and distributed
 * - Energy sharing — surplus offered to neighbors
 * - Demo: 3 projects, 12,500 kWh total, 8.2 tons CO2 saved
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

type TabKey = 'dashboard' | 'projects' | 'invest' | 'share';

interface EnergyProject {
  id: string;
  name: string;
  type: 'solar' | 'wind' | 'biogas' | 'hydro';
  icon: string;
  location: string;
  capacity_kW: number;
  totalGenerated_kWh: number;
  co2Saved_kg: number;
  homesPowered: number;
  contributors: number;
  totalInvested_OTK: number;
  yourInvestment_OTK: number;
  yourCredits_kWh: number;
  carbonCreditsEarned: number;
  status: 'active' | 'funding' | 'planned';
  fundingProgress: number; // 0-1
  dailyOutput_kWh: number[];   // last 7 days
  weeklyOutput_kWh: number[];  // last 4 weeks
  monthlyOutput_kWh: number[]; // last 6 months
  surplusAvailable_kWh: number;
}

interface ShareRequest {
  id: string;
  requester: string;
  reason: string;
  needed_kWh: number;
  fulfilled_kWh: number;
  urgency: 'low' | 'medium' | 'high';
}

const PROJECT_TYPE_META: Record<string, { label: string; color: string }> = {
  solar:  { label: 'Community Solar', color: '#f59e0b' },
  wind:   { label: 'Micro-Wind',     color: '#3b82f6' },
  biogas: { label: 'Biogas',         color: '#22c55e' },
  hydro:  { label: 'Mini-Hydro',     color: '#06b6d4' },
};

const URGENCY_COLORS: Record<string, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#ef4444',
};

const DEMO_PROJECTS: EnergyProject[] = [
  {
    id: 'solar-meadow',
    name: 'Meadow Commons Solar',
    type: 'solar',
    icon: '\u2600\uFE0F',
    location: 'Riverside Community Park',
    capacity_kW: 50,
    totalGenerated_kWh: 7800,
    co2Saved_kg: 5070,
    homesPowered: 26,
    contributors: 42,
    totalInvested_OTK: 2100,
    yourInvestment_OTK: 50,
    yourCredits_kWh: 186,
    carbonCreditsEarned: 12,
    status: 'active',
    fundingProgress: 1.0,
    dailyOutput_kWh: [38, 42, 35, 44, 40, 37, 43],
    weeklyOutput_kWh: [280, 295, 270, 310],
    monthlyOutput_kWh: [1100, 1250, 1350, 1400, 1380, 1320],
    surplusAvailable_kWh: 120,
  },
  {
    id: 'wind-hilltop',
    name: 'Hilltop Wind Collective',
    type: 'wind',
    icon: '\uD83C\uDF2C\uFE0F',
    location: 'Northern Ridge',
    capacity_kW: 30,
    totalGenerated_kWh: 3200,
    co2Saved_kg: 2080,
    homesPowered: 11,
    contributors: 28,
    totalInvested_OTK: 1400,
    yourInvestment_OTK: 30,
    yourCredits_kWh: 69,
    carbonCreditsEarned: 5,
    status: 'active',
    fundingProgress: 1.0,
    dailyOutput_kWh: [18, 22, 15, 25, 20, 24, 19],
    weeklyOutput_kWh: [140, 155, 130, 165],
    monthlyOutput_kWh: [480, 520, 560, 540, 570, 530],
    surplusAvailable_kWh: 45,
  },
  {
    id: 'biogas-village',
    name: 'Village Green Biogas',
    type: 'biogas',
    icon: '\u267B\uFE0F',
    location: 'Agricultural Co-op District',
    capacity_kW: 15,
    totalGenerated_kWh: 1500,
    co2Saved_kg: 1050,
    homesPowered: 5,
    contributors: 15,
    totalInvested_OTK: 600,
    yourInvestment_OTK: 0,
    yourCredits_kWh: 0,
    carbonCreditsEarned: 0,
    status: 'funding',
    fundingProgress: 0.72,
    dailyOutput_kWh: [8, 9, 8, 10, 9, 8, 9],
    weeklyOutput_kWh: [58, 62, 60, 65],
    monthlyOutput_kWh: [220, 240, 250, 260, 255, 275],
    surplusAvailable_kWh: 18,
  },
];

const DEMO_SHARE_REQUESTS: ShareRequest[] = [
  {
    id: 'sr-1',
    requester: 'Maria G.',
    reason: 'Single parent, heating needed for 3 children',
    needed_kWh: 80,
    fulfilled_kWh: 45,
    urgency: 'high',
  },
  {
    id: 'sr-2',
    requester: 'Elder Care Center',
    reason: 'Medical equipment power for 12 residents',
    needed_kWh: 150,
    fulfilled_kWh: 110,
    urgency: 'high',
  },
  {
    id: 'sr-3',
    requester: 'Community Workshop',
    reason: 'After-school STEM program for local youth',
    needed_kWh: 40,
    fulfilled_kWh: 25,
    urgency: 'medium',
  },
  {
    id: 'sr-4',
    requester: 'Lin Family',
    reason: 'Recovering from job loss, winter heating',
    needed_kWh: 60,
    fulfilled_kWh: 60,
    urgency: 'low',
  },
];

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: '\u26A1' },
  { key: 'projects',  label: 'Projects',  icon: '\uD83C\uDF31' },
  { key: 'invest',    label: 'Invest',    icon: '\uD83D\uDCB0' },
  { key: 'share',     label: 'Share',     icon: '\uD83E\uDD1D' },
];

const BAR_CHARS = ['\u2581', '\u2582', '\u2583', '\u2584', '\u2585', '\u2586', '\u2587', '\u2588'];

function miniChart(values: number[]): string {
  if (values.length === 0) return '';
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  return values.map(v => {
    const idx = Math.round(((v - min) / range) * (BAR_CHARS.length - 1));
    return BAR_CHARS[idx];
  }).join('');
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';
  return n.toLocaleString();
}

export function RenewableEnergyScreen({ onClose }: Props) {
  const t = useTheme();
  const { demoMode } = useWalletStore();
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [projects, setProjects] = useState<EnergyProject[]>(DEMO_PROJECTS);
  const [shareRequests] = useState<ShareRequest[]>(DEMO_SHARE_REQUESTS);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const totals = useMemo(() => {
    const totalKWh = projects.reduce((s, p) => s + p.totalGenerated_kWh, 0);
    const totalCO2 = projects.reduce((s, p) => s + p.co2Saved_kg, 0);
    const totalHomes = projects.reduce((s, p) => s + p.homesPowered, 0);
    const totalContributors = projects.reduce((s, p) => s + p.contributors, 0);
    const totalInvested = projects.reduce((s, p) => s + p.totalInvested_OTK, 0);
    const yourTotal = projects.reduce((s, p) => s + p.yourInvestment_OTK, 0);
    const yourCredits = projects.reduce((s, p) => s + p.yourCredits_kWh, 0);
    const yourCarbon = projects.reduce((s, p) => s + p.carbonCreditsEarned, 0);
    const totalSurplus = projects.reduce((s, p) => s + p.surplusAvailable_kWh, 0);
    return { totalKWh, totalCO2, totalHomes, totalContributors, totalInvested, yourTotal, yourCredits, yourCarbon, totalSurplus };
  }, [projects]);

  const handleInvest = useCallback((projectId: string, amount: number) => {
    if (!demoMode) {
      Alert.alert('Live Mode', 'Real investment requires blockchain confirmation.');
      return;
    }
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      const newInvest = p.yourInvestment_OTK + amount;
      const shareRatio = newInvest / (p.totalInvested_OTK + amount);
      return {
        ...p,
        yourInvestment_OTK: newInvest,
        totalInvested_OTK: p.totalInvested_OTK + amount,
        contributors: p.yourInvestment_OTK === 0 ? p.contributors + 1 : p.contributors,
        fundingProgress: Math.min(1.0, p.fundingProgress + amount / (p.capacity_kW * 40)),
        yourCredits_kWh: Math.round(p.totalGenerated_kWh * shareRatio),
        carbonCreditsEarned: Math.round(p.co2Saved_kg * shareRatio / 100),
      };
    }));
    Alert.alert('Investment Recorded', `Contributed ${amount} OTK to project. Energy credits will accrue.`);
  }, [demoMode]);

  const handleShareEnergy = useCallback((requestId: string, amount: number) => {
    if (!demoMode) {
      Alert.alert('Live Mode', 'Energy sharing requires blockchain confirmation.');
      return;
    }
    Alert.alert('Energy Shared', `You shared ${amount} kWh with a neighbor in need. Thank you!`);
  }, [demoMode]);

  const styles = useMemo(() => StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: t.bg.primary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: t.text.primary,
    },
    headerSub: {
      fontSize: 11,
      color: t.text.muted,
      marginTop: 2,
    },
    closeBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: t.bg.card,
    },
    closeTxt: {
      color: t.text.secondary,
      fontSize: 14,
      fontWeight: '600',
    },
    tabBar: {
      flexDirection: 'row',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.border,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 10,
    },
    tabActive: {
      borderBottomWidth: 2,
      borderBottomColor: t.accent.green,
    },
    tabText: {
      fontSize: 11,
      color: t.text.muted,
      marginTop: 2,
    },
    tabTextActive: {
      color: t.accent.green,
      fontWeight: '700',
    },
    tabIcon: {
      fontSize: 16,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    card: {
      backgroundColor: t.bg.secondary,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: t.text.primary,
      marginBottom: 8,
    },
    cardSubtitle: {
      fontSize: 12,
      color: t.text.secondary,
      marginBottom: 12,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    statRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 8,
    },
    statBox: {
      flex: 1,
      minWidth: '45%' as unknown as number,
      backgroundColor: t.bg.card,
      borderRadius: 10,
      padding: 12,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 20,
      fontWeight: '800',
      color: t.text.primary,
    },
    statLabel: {
      fontSize: 10,
      color: t.text.muted,
      marginTop: 4,
      textAlign: 'center',
    },
    statIcon: {
      fontSize: 22,
      marginBottom: 4,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: t.text.primary,
      marginBottom: 12,
      marginTop: 8,
    },
    projectCard: {
      backgroundColor: t.bg.secondary,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
    },
    projectHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    projectIcon: {
      fontSize: 28,
      marginRight: 10,
    },
    projectName: {
      fontSize: 14,
      fontWeight: '700',
      color: t.text.primary,
    },
    projectType: {
      fontSize: 11,
      fontWeight: '600',
      marginTop: 2,
    },
    projectLocation: {
      fontSize: 11,
      color: t.text.muted,
      marginTop: 1,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      alignSelf: 'flex-start',
    },
    statusText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#fff',
    },
    progressBarBg: {
      height: 8,
      backgroundColor: t.bg.card,
      borderRadius: 4,
      overflow: 'hidden',
      marginTop: 6,
      marginBottom: 4,
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 4,
    },
    progressLabel: {
      fontSize: 10,
      color: t.text.muted,
    },
    metricRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.border,
    },
    metric: {
      alignItems: 'center',
    },
    metricValue: {
      fontSize: 14,
      fontWeight: '700',
      color: t.text.primary,
    },
    metricLabel: {
      fontSize: 9,
      color: t.text.muted,
      marginTop: 2,
    },
    chartContainer: {
      backgroundColor: t.bg.card,
      borderRadius: 8,
      padding: 12,
      marginTop: 8,
    },
    chartTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: t.text.secondary,
      marginBottom: 6,
    },
    chartBars: {
      fontSize: 20,
      letterSpacing: 2,
      color: t.accent.green,
    },
    chartLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    chartLabel: {
      fontSize: 8,
      color: t.text.muted,
    },
    periodRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
    },
    periodBtn: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: t.bg.card,
    },
    periodBtnActive: {
      backgroundColor: t.accent.green,
    },
    periodTxt: {
      fontSize: 11,
      color: t.text.secondary,
    },
    periodTxtActive: {
      color: '#fff',
      fontWeight: '700',
    },
    investCard: {
      backgroundColor: t.bg.secondary,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
    },
    investRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
    },
    investBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
    },
    investBtnTxt: {
      fontSize: 12,
      fontWeight: '700',
      color: '#fff',
    },
    yourStats: {
      backgroundColor: t.bg.card,
      borderRadius: 8,
      padding: 10,
      marginTop: 8,
    },
    yourStatsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    yourStatsLabel: {
      fontSize: 11,
      color: t.text.muted,
    },
    yourStatsValue: {
      fontSize: 11,
      fontWeight: '700',
      color: t.text.primary,
    },
    shareCard: {
      backgroundColor: t.bg.secondary,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
    },
    shareHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    shareRequester: {
      fontSize: 14,
      fontWeight: '700',
      color: t.text.primary,
    },
    shareReason: {
      fontSize: 12,
      color: t.text.secondary,
      marginBottom: 8,
    },
    shareProgress: {
      fontSize: 11,
      color: t.text.muted,
      marginTop: 4,
    },
    shareBtn: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: t.accent.green,
      alignSelf: 'flex-start',
      marginTop: 8,
    },
    shareBtnTxt: {
      fontSize: 12,
      fontWeight: '700',
      color: '#fff',
    },
    urgencyBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    urgencyText: {
      fontSize: 9,
      fontWeight: '700',
      color: '#fff',
    },
    emptyText: {
      fontSize: 13,
      color: t.text.muted,
      textAlign: 'center',
      marginTop: 24,
    },
    demoNote: {
      fontSize: 10,
      color: t.text.muted,
      textAlign: 'center',
      marginTop: 16,
      fontStyle: 'italic',
    },
    carbonCard: {
      backgroundColor: '#065f4620',
      borderRadius: 10,
      padding: 12,
      marginTop: 8,
      borderWidth: 1,
      borderColor: '#22c55e40',
    },
    carbonTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: t.accent.green,
      marginBottom: 4,
    },
    carbonText: {
      fontSize: 11,
      color: t.text.secondary,
      lineHeight: 16,
    },
  }), [t]);

  /* -------- Dashboard Tab -------- */
  const renderDashboard = () => (
    <View>
      <Text style={styles.sectionTitle}>Community Energy Overview</Text>

      <View style={styles.statRow}>
        <View style={styles.statBox}>
          <Text style={styles.statIcon}>{'\u26A1'}</Text>
          <Text style={styles.statValue}>{formatNum(totals.totalKWh)}</Text>
          <Text style={styles.statLabel}>Total kWh Generated</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statIcon}>{'\uD83C\uDF0D'}</Text>
          <Text style={[styles.statValue, { color: t.accent.green }]}>
            {(totals.totalCO2 / 1000).toFixed(1)}t
          </Text>
          <Text style={styles.statLabel}>CO2 Saved</Text>
        </View>
      </View>

      <View style={styles.statRow}>
        <View style={styles.statBox}>
          <Text style={styles.statIcon}>{'\uD83C\uDFE0'}</Text>
          <Text style={styles.statValue}>{totals.totalHomes}</Text>
          <Text style={styles.statLabel}>Homes Powered</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statIcon}>{'\uD83D\uDC65'}</Text>
          <Text style={styles.statValue}>{totals.totalContributors}</Text>
          <Text style={styles.statLabel}>Contributors</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Contribution</Text>
        <View style={styles.yourStatsRow}>
          <Text style={styles.yourStatsLabel}>Total Invested</Text>
          <Text style={styles.yourStatsValue}>{totals.yourTotal} OTK</Text>
        </View>
        <View style={styles.yourStatsRow}>
          <Text style={styles.yourStatsLabel}>Energy Credits Earned</Text>
          <Text style={styles.yourStatsValue}>{totals.yourCredits} kWh</Text>
        </View>
        <View style={styles.yourStatsRow}>
          <Text style={styles.yourStatsLabel}>Carbon Credits</Text>
          <Text style={[styles.yourStatsValue, { color: t.accent.green }]}>
            {totals.yourCarbon}
          </Text>
        </View>
        <View style={styles.yourStatsRow}>
          <Text style={styles.yourStatsLabel}>Surplus Available to Share</Text>
          <Text style={styles.yourStatsValue}>{totals.totalSurplus} kWh</Text>
        </View>
      </View>

      <View style={styles.carbonCard}>
        <Text style={styles.carbonTitle}>{'\uD83C\uDF3F'} Carbon Impact</Text>
        <Text style={styles.carbonText}>
          {(totals.totalCO2 / 1000).toFixed(1)} tons of CO2 saved is equivalent to{' '}
          {Math.round(totals.totalCO2 / 21.77)} trees planted or{' '}
          {Math.round(totals.totalCO2 / 0.404)} km of driving avoided.
          Community energy reduces dependence on fossil fuels while building
          local resilience.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Active Projects</Text>
        {projects.map(p => (
          <View key={p.id} style={styles.row}>
            <Text style={{ fontSize: 12, color: t.text.secondary }}>
              {p.icon} {p.name}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: t.text.primary }}>
              {formatNum(p.totalGenerated_kWh)} kWh
            </Text>
          </View>
        ))}
      </View>

      {demoMode && (
        <Text style={styles.demoNote}>
          Demo data: 3 projects, {formatNum(totals.totalKWh)} kWh generated,{' '}
          {(totals.totalCO2 / 1000).toFixed(1)} tons CO2 saved
        </Text>
      )}
    </View>
  );

  /* -------- Projects Tab -------- */
  const renderProjects = () => {
    const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const WEEK_LABELS = ['W1', 'W2', 'W3', 'W4'];
    const MONTH_LABELS = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'];

    const getChartData = (p: EnergyProject) => {
      if (chartPeriod === 'daily') return { data: p.dailyOutput_kWh, labels: DAY_LABELS };
      if (chartPeriod === 'weekly') return { data: p.weeklyOutput_kWh, labels: WEEK_LABELS };
      return { data: p.monthlyOutput_kWh, labels: MONTH_LABELS };
    };

    return (
      <View>
        <Text style={styles.sectionTitle}>Energy Projects</Text>

        <View style={styles.periodRow}>
          {(['daily', 'weekly', 'monthly'] as const).map(period => (
            <TouchableOpacity
              key={period}
              style={[styles.periodBtn, chartPeriod === period && styles.periodBtnActive]}
              onPress={() => setChartPeriod(period)}
            >
              <Text style={[styles.periodTxt, chartPeriod === period && styles.periodTxtActive]}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {projects.map(p => {
          const meta = PROJECT_TYPE_META[p.type];
          const chart = getChartData(p);
          const expanded = selectedProject === p.id;

          return (
            <TouchableOpacity
              key={p.id}
              style={styles.projectCard}
              onPress={() => setSelectedProject(expanded ? null : p.id)}
              activeOpacity={0.7}
            >
              <View style={styles.projectHeader}>
                <Text style={styles.projectIcon}>{p.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.projectName}>{p.name}</Text>
                  <Text style={[styles.projectType, { color: meta.color }]}>{meta.label}</Text>
                  <Text style={styles.projectLocation}>{p.location}</Text>
                </View>
                <View style={[styles.statusBadge, {
                  backgroundColor: p.status === 'active' ? t.accent.green
                    : p.status === 'funding' ? '#eab308' : t.text.muted,
                }]}>
                  <Text style={styles.statusText}>
                    {p.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.metricRow}>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{formatNum(p.totalGenerated_kWh)}</Text>
                  <Text style={styles.metricLabel}>kWh Generated</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{(p.co2Saved_kg / 1000).toFixed(1)}t</Text>
                  <Text style={styles.metricLabel}>CO2 Saved</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{p.homesPowered}</Text>
                  <Text style={styles.metricLabel}>Homes</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{p.contributors}</Text>
                  <Text style={styles.metricLabel}>Members</Text>
                </View>
              </View>

              {p.status === 'funding' && (
                <View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, {
                      width: `${Math.round(p.fundingProgress * 100)}%`,
                      backgroundColor: '#eab308',
                    }]} />
                  </View>
                  <Text style={styles.progressLabel}>
                    {Math.round(p.fundingProgress * 100)}% funded ({formatNum(p.totalInvested_OTK)} OTK)
                  </Text>
                </View>
              )}

              {expanded && (
                <View style={styles.chartContainer}>
                  <Text style={styles.chartTitle}>
                    Production ({chartPeriod})
                  </Text>
                  <Text style={styles.chartBars}>{miniChart(chart.data)}</Text>
                  <View style={styles.chartLabels}>
                    {chart.labels.map((l, i) => (
                      <Text key={i} style={styles.chartLabel}>{l}</Text>
                    ))}
                  </View>
                  <View style={[styles.row, { marginTop: 8, marginBottom: 0 }]}>
                    <Text style={{ fontSize: 10, color: t.text.muted }}>
                      Avg: {Math.round(chart.data.reduce((a, b) => a + b, 0) / chart.data.length)} kWh
                    </Text>
                    <Text style={{ fontSize: 10, color: t.text.muted }}>
                      Peak: {Math.max(...chart.data)} kWh
                    </Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  /* -------- Invest Tab -------- */
  const renderInvest = () => (
    <View>
      <Text style={styles.sectionTitle}>Invest in Clean Energy</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>How It Works</Text>
        <Text style={styles.cardSubtitle}>
          Contribute OTK to community energy projects. Your investment earns you a proportional
          share of energy credits and carbon credits. Energy credits can power your home or be
          shared with neighbors in need.
        </Text>
        <View style={styles.row}>
          <Text style={{ fontSize: 11, color: t.text.muted }}>1 OTK invested</Text>
          <Text style={{ fontSize: 11, color: t.text.secondary }}>
            {'\u2192'} Proportional kWh credits + carbon credits
          </Text>
        </View>
      </View>

      {projects.map(p => {
        const meta = PROJECT_TYPE_META[p.type];
        const canInvest = p.status !== 'active' || true; // can always invest more

        return (
          <View key={p.id} style={styles.investCard}>
            <View style={styles.projectHeader}>
              <Text style={styles.projectIcon}>{p.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.projectName}>{p.name}</Text>
                <Text style={[styles.projectType, { color: meta.color }]}>{meta.label}</Text>
              </View>
            </View>

            {p.yourInvestment_OTK > 0 && (
              <View style={styles.yourStats}>
                <View style={styles.yourStatsRow}>
                  <Text style={styles.yourStatsLabel}>Your Investment</Text>
                  <Text style={styles.yourStatsValue}>{p.yourInvestment_OTK} OTK</Text>
                </View>
                <View style={styles.yourStatsRow}>
                  <Text style={styles.yourStatsLabel}>Energy Credits</Text>
                  <Text style={styles.yourStatsValue}>{p.yourCredits_kWh} kWh</Text>
                </View>
                <View style={styles.yourStatsRow}>
                  <Text style={styles.yourStatsLabel}>Carbon Credits</Text>
                  <Text style={[styles.yourStatsValue, { color: t.accent.green }]}>
                    {p.carbonCreditsEarned}
                  </Text>
                </View>
              </View>
            )}

            {p.status === 'funding' && (
              <View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, {
                    width: `${Math.round(p.fundingProgress * 100)}%`,
                    backgroundColor: meta.color,
                  }]} />
                </View>
                <Text style={styles.progressLabel}>
                  {Math.round(p.fundingProgress * 100)}% funded
                </Text>
              </View>
            )}

            {canInvest && (
              <View style={styles.investRow}>
                {[10, 25, 50].map(amount => (
                  <TouchableOpacity
                    key={amount}
                    style={[styles.investBtn, { backgroundColor: meta.color }]}
                    onPress={() => handleInvest(p.id, amount)}
                  >
                    <Text style={styles.investBtnTxt}>{amount} OTK</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        );
      })}

      {demoMode && (
        <Text style={styles.demoNote}>
          Demo mode: investments are simulated. Real mode requires blockchain confirmation.
        </Text>
      )}
    </View>
  );

  /* -------- Share Tab -------- */
  const renderShare = () => (
    <View>
      <Text style={styles.sectionTitle}>Energy Sharing</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Share Surplus Energy</Text>
        <Text style={styles.cardSubtitle}>
          Community members with surplus energy credits can share with neighbors
          in need. This is the heart of community energy -- no one goes without
          power when the community has abundance.
        </Text>
        <View style={styles.row}>
          <Text style={{ fontSize: 12, color: t.text.secondary }}>
            Community Surplus Available
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '700', color: t.accent.green }}>
            {totals.totalSurplus} kWh
          </Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { fontSize: 14 }]}>Neighbors Requesting Help</Text>

      {shareRequests.map(req => {
        const progress = req.fulfilled_kWh / req.needed_kWh;
        const fulfilled = progress >= 1.0;

        return (
          <View key={req.id} style={styles.shareCard}>
            <View style={styles.shareHeader}>
              <Text style={styles.shareRequester}>{req.requester}</Text>
              <View style={[styles.urgencyBadge, { backgroundColor: URGENCY_COLORS[req.urgency] }]}>
                <Text style={styles.urgencyText}>{req.urgency.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.shareReason}>{req.reason}</Text>

            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, {
                width: `${Math.min(100, Math.round(progress * 100))}%`,
                backgroundColor: fulfilled ? t.accent.green : '#eab308',
              }]} />
            </View>
            <Text style={styles.shareProgress}>
              {req.fulfilled_kWh} / {req.needed_kWh} kWh{' '}
              {fulfilled ? '-- Fully met!' : `(${Math.round((req.needed_kWh - req.fulfilled_kWh))} kWh needed)`}
            </Text>

            {!fulfilled && (
              <TouchableOpacity
                style={styles.shareBtn}
                onPress={() => handleShareEnergy(req.id, Math.min(10, req.needed_kWh - req.fulfilled_kWh))}
              >
                <Text style={styles.shareBtnTxt}>
                  Share {Math.min(10, req.needed_kWh - req.fulfilled_kWh)} kWh
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      <View style={styles.carbonCard}>
        <Text style={styles.carbonTitle}>{'\uD83D\uDCA1'} Why Share Energy?</Text>
        <Text style={styles.carbonText}>
          Energy is a basic human right. When community projects generate surplus,
          sharing it with those in need strengthens the entire community. Every kWh
          shared earns additional OTK recognition for the giver and reduces
          inequality at its most fundamental level.
        </Text>
      </View>

      {demoMode && (
        <Text style={styles.demoNote}>
          Demo mode: sharing actions are simulated.
        </Text>
      )}
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'projects':  return renderProjects();
      case 'invest':    return renderInvest();
      case 'share':     return renderShare();
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{'\u2600\uFE0F'} Renewable Energy</Text>
          <Text style={styles.headerSub}>Community-owned clean power</Text>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeTxt}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}
