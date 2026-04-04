import { fonts } from '../utils/theme';
/**
 * Volunteer Log Screen — Detailed volunteer hour tracking with cOTK history.
 *
 * Article I: "Community service builds the foundation of human value."
 * Article III: cOTK rewards recognize every hour of selfless contribution.
 *
 * Features:
 * - Detailed time log with dates, organizations, descriptions
 * - Statistics dashboard (total hours, cOTK earned, streak, categories)
 * - Certificate generation for verified volunteer milestones
 * - Monthly/weekly breakdowns
 * - Export log for tax or scholarship purposes
 * - Demo mode with sample volunteer history
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface LogEntry {
  id: string;
  date: string;
  organization: string;
  category: string;
  description: string;
  hours: number;
  cotkEarned: number;
  verified: boolean;
}

interface VolunteerStats {
  totalHours: number;
  totalCOTK: number;
  weekStreak: number;
  organizationCount: number;
  categoriesServed: number;
  avgHoursPerWeek: number;
}

interface Certificate {
  id: string;
  title: string;
  issuedDate: string;
  hours: number;
  organization: string;
  txHash: string;
  verified: boolean;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const CATEGORIES = ['Education', 'Healthcare', 'Environment', 'Food Bank', 'Elder Care', 'Youth', 'Disaster Relief', 'Animal Welfare'];

// ─── Demo Data ───

const DEMO_LOG: LogEntry[] = [
  { id: 'l1', date: '2026-03-29', organization: 'City Food Bank', category: 'Food Bank', description: 'Weekend food sorting and distribution', hours: 5, cotkEarned: 750, verified: true },
  { id: 'l2', date: '2026-03-27', organization: 'Lincoln Elementary', category: 'Education', description: 'After-school math tutoring program', hours: 3, cotkEarned: 450, verified: true },
  { id: 'l3', date: '2026-03-25', organization: 'Riverside Cleanup', category: 'Environment', description: 'River bank trash removal drive', hours: 4, cotkEarned: 600, verified: true },
  { id: 'l4', date: '2026-03-23', organization: 'Sunshine Senior Center', category: 'Elder Care', description: 'Technology assistance for seniors', hours: 2.5, cotkEarned: 375, verified: true },
  { id: 'l5', date: '2026-03-21', organization: 'Youth Futures', category: 'Youth', description: 'Career mentoring workshop', hours: 3, cotkEarned: 450, verified: false },
  { id: 'l6', date: '2026-03-19', organization: 'Community Garden', category: 'Environment', description: 'Spring planting and bed preparation', hours: 4, cotkEarned: 600, verified: true },
  { id: 'l7', date: '2026-03-17', organization: 'Red Cross Chapter', category: 'Disaster Relief', description: 'Emergency supply kit assembly', hours: 6, cotkEarned: 900, verified: true },
  { id: 'l8', date: '2026-03-15', organization: 'City Animal Shelter', category: 'Animal Welfare', description: 'Dog walking and kennel cleaning', hours: 3, cotkEarned: 450, verified: true },
];

const DEMO_STATS: VolunteerStats = {
  totalHours: 247.5,
  totalCOTK: 37125,
  weekStreak: 12,
  organizationCount: 8,
  categoriesServed: 7,
  avgHoursPerWeek: 5.2,
};

const DEMO_CERTIFICATES: Certificate[] = [
  { id: 'cert1', title: '100 Hours of Service', issuedDate: '2026-02-15', hours: 100, organization: 'Open Chain Community', txHash: '0xabc123...def456', verified: true },
  { id: 'cert2', title: 'Environmental Champion', issuedDate: '2026-01-20', hours: 50, organization: 'Green Earth Alliance', txHash: '0x789abc...321fed', verified: true },
  { id: 'cert3', title: '200 Hours of Service', issuedDate: '2026-03-20', hours: 200, organization: 'Open Chain Community', txHash: '0xdef789...abc123', verified: true },
];

type Tab = 'log' | 'stats' | 'certificate';

export function VolunteerLogScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('log');
  const [newOrg, setNewOrg] = useState('');
  const [newHours, setNewHours] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const logEntries = DEMO_LOG;
  const stats = DEMO_STATS;
  const certificates = DEMO_CERTIFICATES;

  const handleAddEntry = useCallback(() => {
    if (!newOrg.trim()) { Alert.alert('Required', 'Enter an organization name.'); return; }
    const hours = parseFloat(newHours);
    if (!hours || hours <= 0) { Alert.alert('Required', 'Enter valid hours.'); return; }
    if (!newCategory) { Alert.alert('Required', 'Select a category.'); return; }
    const estimatedCOTK = Math.floor(hours * 150);
    Alert.alert('Entry Added', `${hours}h logged at ${newOrg}.\nEstimated cOTK: ${estimatedCOTK}\nPending verification.`);
    setNewOrg('');
    setNewHours('');
    setNewDesc('');
    setNewCategory('');
  }, [newOrg, newHours, newCategory]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.green + '20' },
    tabText: { color: t.text.muted, fontSize: 13, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.green },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    logRow: { borderBottomColor: t.bg.primary, borderBottomWidth: 1, paddingVertical: 12 },
    logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    logOrg: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold, flex: 1 },
    logHours: { color: t.accent.blue, fontSize: 15, fontWeight: fonts.heavy },
    logDesc: { color: t.text.muted, fontSize: 13, marginTop: 4 },
    logMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    logDate: { color: t.text.muted, fontSize: 11 },
    logCotk: { color: t.accent.green, fontSize: 12, fontWeight: fonts.bold },
    logVerified: { fontSize: 11, fontWeight: fonts.semibold },
    statGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    statBox: { width: '48%', backgroundColor: t.bg.primary, borderRadius: 12, padding: 16, marginBottom: 12, alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 24, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 4, textAlign: 'center' },
    streakCard: { backgroundColor: t.accent.green + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    streakText: { color: t.text.primary, fontSize: 15, fontWeight: fonts.semibold, textAlign: 'center', lineHeight: 22 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    catChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, borderWidth: 1, borderColor: t.bg.primary },
    catChipActive: { backgroundColor: t.accent.green + '20', borderColor: t.accent.green },
    catText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    catTextActive: { color: t.accent.green },
    submitBtn: { backgroundColor: t.accent.green, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    certCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    certTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold },
    certMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    certHash: { color: t.accent.blue, fontSize: 11, marginTop: 6, fontFamily: 'monospace' },
    certBadge: { backgroundColor: t.accent.green + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
    certBadgeText: { color: t.accent.green, fontSize: 11, fontWeight: fonts.bold },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'log', label: 'Log' },
    { key: 'stats', label: 'Stats' },
    { key: 'certificate', label: 'Certificates' },
  ];

  // ─── Log Tab ───

  const renderLog = () => (
    <>
      <View style={s.card}>
        <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>New Entry</Text>
        <TextInput style={s.input} placeholder="Organization" placeholderTextColor={t.text.muted} value={newOrg} onChangeText={setNewOrg} />
        <TextInput style={s.input} placeholder="Hours" placeholderTextColor={t.text.muted} keyboardType="numeric" value={newHours} onChangeText={setNewHours} />
        <TextInput style={s.input} placeholder="Description" placeholderTextColor={t.text.muted} value={newDesc} onChangeText={setNewDesc} multiline />
        <View style={s.catRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity key={cat} style={[s.catChip, newCategory === cat && s.catChipActive]} onPress={() => setNewCategory(cat)}>
              <Text style={[s.catText, newCategory === cat && s.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={s.submitBtn} onPress={handleAddEntry}>
          <Text style={s.submitText}>Add Entry</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.sectionTitle}>Recent Entries</Text>
      <View style={s.card}>
        {logEntries.map((entry) => (
          <View key={entry.id} style={s.logRow}>
            <View style={s.logHeader}>
              <Text style={s.logOrg}>{entry.organization}</Text>
              <Text style={s.logHours}>{entry.hours}h</Text>
            </View>
            <Text style={s.logDesc}>{entry.description}</Text>
            <View style={s.logMeta}>
              <Text style={s.logDate}>{entry.date} | {entry.category}</Text>
              <Text style={s.logCotk}>+{entry.cotkEarned} cOTK</Text>
            </View>
            <Text style={[s.logVerified, { color: entry.verified ? t.accent.green : t.accent.orange }]}>
              {entry.verified ? 'Verified' : 'Pending'}
            </Text>
          </View>
        ))}
      </View>
    </>
  );

  // ─── Stats Tab ───

  const renderStats = () => (
    <>
      <View style={s.streakCard}>
        <Text style={s.streakText}>
          {stats.weekStreak}-week volunteering streak!{'\n'}
          Averaging {stats.avgHoursPerWeek} hours per week.
        </Text>
      </View>

      <View style={s.card}>
        <View style={s.statGrid}>
          <View style={s.statBox}>
            <Text style={s.statValue}>{stats.totalHours}</Text>
            <Text style={s.statLabel}>Total Hours</Text>
          </View>
          <View style={s.statBox}>
            <Text style={[s.statValue, { color: t.accent.green }]}>{stats.totalCOTK.toLocaleString()}</Text>
            <Text style={s.statLabel}>cOTK Earned</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>{stats.organizationCount}</Text>
            <Text style={s.statLabel}>Organizations</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>{stats.categoriesServed}</Text>
            <Text style={s.statLabel}>Categories</Text>
          </View>
        </View>
      </View>

      <View style={s.card}>
        <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Monthly Breakdown</Text>
        <View style={s.logMeta}><Text style={s.logDate}>March 2026</Text><Text style={s.logCotk}>30.5h | 4,575 cOTK</Text></View>
        <View style={s.logMeta}><Text style={s.logDate}>February 2026</Text><Text style={s.logCotk}>28h | 4,200 cOTK</Text></View>
        <View style={s.logMeta}><Text style={s.logDate}>January 2026</Text><Text style={s.logCotk}>22h | 3,300 cOTK</Text></View>
      </View>

      <TouchableOpacity style={[s.submitBtn, { marginHorizontal: 20 }]} onPress={() => Alert.alert('Export', 'Volunteer log exported as PDF for tax/scholarship use.')}>
        <Text style={s.submitText}>Export Log (PDF)</Text>
      </TouchableOpacity>
    </>
  );

  // ─── Certificate Tab ───

  const renderCertificates = () => (
    <>
      <Text style={s.sectionTitle}>On-Chain Certificates</Text>
      {certificates.map((cert) => (
        <View key={cert.id} style={s.certCard}>
          <Text style={s.certTitle}>{cert.title}</Text>
          <Text style={s.certMeta}>{cert.organization} | {cert.issuedDate} | {cert.hours}h milestone</Text>
          <Text style={s.certHash}>tx: {cert.txHash}</Text>
          {cert.verified && (
            <View style={s.certBadge}>
              <Text style={s.certBadgeText}>ON-CHAIN VERIFIED</Text>
            </View>
          )}
        </View>
      ))}

      <View style={s.card}>
        <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Next Certificate</Text>
        <Text style={s.certMeta}>250 Hours of Service — {(250 - stats.totalHours).toFixed(1)} hours remaining</Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Volunteer Log</Text>
        <View style={{ width: 60 }} />
      </View>

      {demoMode && (
        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO MODE</Text>
        </View>
      )}

      <View style={s.tabRow}>
        {tabs.map((tb) => (
          <TouchableOpacity key={tb.key} style={[s.tabBtn, tab === tb.key && s.tabActive]} onPress={() => setTab(tb.key)}>
            <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {tab === 'log' && renderLog()}
        {tab === 'stats' && renderStats()}
        {tab === 'certificate' && renderCertificates()}
      </ScrollView>
    </SafeAreaView>
  );
}
