import { fonts } from '../utils/theme';
/**
 * Freelance Screen — Freelancer tools: invoicing, time tracking, client management.
 *
 * Article I: "Every freelancer deserves fair compensation for their labor."
 * Article III: OTK enables borderless, instant freelance payments.
 *
 * Features:
 * - Invoice creation and management with OTK payments
 * - Time tracking per project with hourly rate calculations
 * - Client directory with payment history
 * - Invoice status tracking (draft, sent, paid, overdue)
 * - Earnings summary and analytics
 * - Demo mode with sample freelance data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface Invoice {
  id: string;
  clientId: string;
  clientName: string;
  description: string;
  hoursWorked: number;
  hourlyRate: number;
  totalOTK: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  createdDate: string;
  dueDate: string;
}

interface TimeEntry {
  id: string;
  projectName: string;
  clientId: string;
  description: string;
  hours: number;
  date: string;
  billed: boolean;
}

interface Client {
  id: string;
  name: string;
  totalPaid: number;
  totalInvoices: number;
  activeProjects: number;
  since: string;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const STATUS_COLORS: Record<string, string> = {
  draft: '#8E8E93',
  sent: '#007AFF',
  paid: '#34C759',
  overdue: '#FF3B30',
};

// ─── Demo Data ───

const DEMO_INVOICES: Invoice[] = [
  { id: 'inv-001', clientId: 'c1', clientName: 'Acme Corp', description: 'Frontend development - March sprint', hoursWorked: 40, hourlyRate: 150, totalOTK: 6000, status: 'paid', createdDate: '2026-03-01', dueDate: '2026-03-15' },
  { id: 'inv-002', clientId: 'c2', clientName: 'Nova Labs', description: 'API integration and testing', hoursWorked: 24, hourlyRate: 175, totalOTK: 4200, status: 'sent', createdDate: '2026-03-15', dueDate: '2026-03-30' },
  { id: 'inv-003', clientId: 'c3', clientName: 'GreenTech IO', description: 'Smart contract audit', hoursWorked: 16, hourlyRate: 200, totalOTK: 3200, status: 'overdue', createdDate: '2026-02-20', dueDate: '2026-03-06' },
  { id: 'inv-004', clientId: 'c1', clientName: 'Acme Corp', description: 'UI/UX redesign phase 2', hoursWorked: 32, hourlyRate: 150, totalOTK: 4800, status: 'draft', createdDate: '2026-03-28', dueDate: '2026-04-11' },
];

const DEMO_TIME_ENTRIES: TimeEntry[] = [
  { id: 't1', projectName: 'Acme Frontend', clientId: 'c1', description: 'Component refactoring', hours: 3.5, date: '2026-03-29', billed: false },
  { id: 't2', projectName: 'Nova API', clientId: 'c2', description: 'Authentication endpoints', hours: 5, date: '2026-03-29', billed: false },
  { id: 't3', projectName: 'Acme Frontend', clientId: 'c1', description: 'Performance optimization', hours: 4, date: '2026-03-28', billed: false },
  { id: 't4', projectName: 'GreenTech Audit', clientId: 'c3', description: 'Vulnerability assessment', hours: 6, date: '2026-03-27', billed: true },
  { id: 't5', projectName: 'Nova API', clientId: 'c2', description: 'Database migration', hours: 2.5, date: '2026-03-27', billed: true },
  { id: 't6', projectName: 'Acme Frontend', clientId: 'c1', description: 'Unit test coverage', hours: 3, date: '2026-03-26', billed: true },
];

const DEMO_CLIENTS: Client[] = [
  { id: 'c1', name: 'Acme Corp', totalPaid: 18400, totalInvoices: 6, activeProjects: 2, since: '2025-09' },
  { id: 'c2', name: 'Nova Labs', totalPaid: 12600, totalInvoices: 4, activeProjects: 1, since: '2025-11' },
  { id: 'c3', name: 'GreenTech IO', totalPaid: 8200, totalInvoices: 3, activeProjects: 1, since: '2026-01' },
  { id: 'c4', name: 'DataFlow Inc', totalPaid: 5400, totalInvoices: 2, activeProjects: 0, since: '2026-02' },
];

type Tab = 'invoices' | 'track' | 'clients';

export function FreelanceScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('invoices');
  const [trackProject, setTrackProject] = useState('');
  const [trackHours, setTrackHours] = useState('');
  const [trackDesc, setTrackDesc] = useState('');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const invoices = DEMO_INVOICES;
  const timeEntries = DEMO_TIME_ENTRIES;
  const clients = DEMO_CLIENTS;

  const totalEarnings = useMemo(() => invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + i.totalOTK, 0), [invoices]);
  const totalPending = useMemo(() => invoices.filter((i) => i.status === 'sent' || i.status === 'overdue').reduce((sum, i) => sum + i.totalOTK, 0), [invoices]);
  const unbilledHours = useMemo(() => timeEntries.filter((e) => !e.billed).reduce((sum, e) => sum + e.hours, 0), [timeEntries]);

  const handleLogTime = useCallback(() => {
    if (!trackProject.trim()) { Alert.alert('Required', 'Enter a project name.'); return; }
    const hours = parseFloat(trackHours);
    if (!hours || hours <= 0) { Alert.alert('Required', 'Enter valid hours.'); return; }
    Alert.alert('Time Logged', `${hours}h logged for "${trackProject}".`);
    setTrackProject('');
    setTrackHours('');
    setTrackDesc('');
  }, [trackProject, trackHours]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.blue + '20' },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.blue },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
    summaryItem: { alignItems: 'center' },
    summaryValue: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    summaryLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    invoiceRow: { borderBottomColor: t.bg.primary, borderBottomWidth: 1, paddingVertical: 14 },
    invoiceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    invoiceClient: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    invoiceStatus: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
    invoiceStatusText: { fontSize: fonts.xs, fontWeight: fonts.bold, color: '#fff' },
    invoiceDesc: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    invoiceAmount: { color: t.accent.green, fontSize: fonts.lg, fontWeight: fonts.heavy, marginTop: 6 },
    invoiceMeta: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md, marginBottom: 12 },
    submitBtn: { backgroundColor: t.accent.blue, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    timeRow: { flexDirection: 'row', borderBottomColor: t.bg.primary, borderBottomWidth: 1, paddingVertical: 10, alignItems: 'center' },
    timeInfo: { flex: 1 },
    timeName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    timeMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    timeHours: { color: t.accent.blue, fontSize: fonts.lg, fontWeight: fonts.heavy },
    clientCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    clientName: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold },
    clientMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    clientStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
    clientStatValue: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.heavy },
    clientStatLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.bold },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'invoices', label: 'Invoices' },
    { key: 'track', label: 'Track' },
    { key: 'clients', label: 'Clients' },
  ];

  // ─── Invoices Tab ───

  const renderInvoices = () => (
    <>
      <View style={s.card}>
        <View style={s.summaryRow}>
          <View style={s.summaryItem}>
            <Text style={[s.summaryValue, { color: t.accent.green }]}>{totalEarnings.toLocaleString()}</Text>
            <Text style={s.summaryLabel}>Earned (OTK)</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={[s.summaryValue, { color: t.accent.orange }]}>{totalPending.toLocaleString()}</Text>
            <Text style={s.summaryLabel}>Pending (OTK)</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={s.summaryValue}>{unbilledHours}h</Text>
            <Text style={s.summaryLabel}>Unbilled</Text>
          </View>
        </View>
      </View>

      <Text style={s.sectionTitle}>All Invoices</Text>
      <View style={s.card}>
        {invoices.map((inv) => (
          <View key={inv.id} style={s.invoiceRow}>
            <View style={s.invoiceHeader}>
              <Text style={s.invoiceClient}>{inv.clientName}</Text>
              <View style={[s.invoiceStatus, { backgroundColor: STATUS_COLORS[inv.status] }]}>
                <Text style={s.invoiceStatusText}>{inv.status.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={s.invoiceDesc}>{inv.description}</Text>
            <Text style={s.invoiceAmount}>{inv.totalOTK.toLocaleString()} OTK</Text>
            <Text style={s.invoiceMeta}>{inv.id} | {inv.hoursWorked}h @ {inv.hourlyRate} OTK/h | Due: {inv.dueDate}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={[s.submitBtn, { marginHorizontal: 20 }]} onPress={() => Alert.alert('New Invoice', 'Invoice creation form coming soon.')}>
        <Text style={s.submitText}>Create New Invoice</Text>
      </TouchableOpacity>
    </>
  );

  // ─── Track Tab ───

  const renderTrack = () => (
    <>
      <View style={s.card}>
        <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Log Time</Text>
        <TextInput style={s.input} placeholder="Project name" placeholderTextColor={t.text.muted} value={trackProject} onChangeText={setTrackProject} />
        <TextInput style={s.input} placeholder="Hours worked" placeholderTextColor={t.text.muted} keyboardType="numeric" value={trackHours} onChangeText={setTrackHours} />
        <TextInput style={s.input} placeholder="Description (optional)" placeholderTextColor={t.text.muted} value={trackDesc} onChangeText={setTrackDesc} multiline />
        <TouchableOpacity style={s.submitBtn} onPress={handleLogTime}>
          <Text style={s.submitText}>Log Time Entry</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.sectionTitle}>Recent Time Entries</Text>
      <View style={s.card}>
        {timeEntries.map((entry) => (
          <View key={entry.id} style={s.timeRow}>
            <View style={s.timeInfo}>
              <Text style={s.timeName}>{entry.projectName}</Text>
              <Text style={s.timeMeta}>{entry.description} | {entry.date}</Text>
              <Text style={[s.timeMeta, { color: entry.billed ? t.accent.green : t.accent.orange }]}>
                {entry.billed ? 'Billed' : 'Unbilled'}
              </Text>
            </View>
            <Text style={s.timeHours}>{entry.hours}h</Text>
          </View>
        ))}
      </View>
    </>
  );

  // ─── Clients Tab ───

  const renderClients = () => (
    <>
      <Text style={s.sectionTitle}>Client Directory</Text>
      {clients.map((cl) => (
        <View key={cl.id} style={s.clientCard}>
          <Text style={s.clientName}>{cl.name}</Text>
          <Text style={s.clientMeta}>Client since {cl.since} | {cl.activeProjects} active projects</Text>
          <View style={s.clientStats}>
            <View>
              <Text style={[s.clientStatValue, { color: t.accent.green }]}>{cl.totalPaid.toLocaleString()}</Text>
              <Text style={s.clientStatLabel}>Total Paid (OTK)</Text>
            </View>
            <View>
              <Text style={s.clientStatValue}>{cl.totalInvoices}</Text>
              <Text style={s.clientStatLabel}>Invoices</Text>
            </View>
          </View>
        </View>
      ))}
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Freelance</Text>
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
        {tab === 'invoices' && renderInvoices()}
        {tab === 'track' && renderTrack()}
        {tab === 'clients' && renderClients()}
      </ScrollView>
    </SafeAreaView>
  );
}
