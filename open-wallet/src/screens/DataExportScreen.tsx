/**
 * Data Export Screen (Art VIII) — GDPR-style data export.
 *
 * Download all your on-chain and local data. Your data belongs to you.
 * Select categories, choose format (JSON/CSV), view export history,
 * and read the privacy notice.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Switch, ActivityIndicator,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

type Tab = 'export' | 'history' | 'privacy';
type ExportFormat = 'json' | 'csv';

interface DataCategory {
  key: string;
  label: string;
  description: string;
  icon: string;
  estimatedSizeKB: number;
  recordCount: number;
}

interface ExportRecord {
  id: string;
  date: string;
  categories: string[];
  format: ExportFormat;
  sizeKB: number;
  status: 'completed' | 'expired';
}

interface Props {
  onClose: () => void;
}

const DATA_CATEGORIES: DataCategory[] = [
  { key: 'identity', label: 'Identity', description: 'Your Open Chain identity, DID, and profile data', icon: '\uD83D\uDC64', estimatedSizeKB: 12, recordCount: 1 },
  { key: 'transactions', label: 'Transactions', description: 'All OTK transfers, swaps, and minting records', icon: '\uD83D\uDCB8', estimatedSizeKB: 340, recordCount: 247 },
  { key: 'living_ledger', label: 'Living Ledger', description: 'Your full chain of causation — nurture, education, health', icon: '\uD83D\uDCD6', estimatedSizeKB: 890, recordCount: 1842 },
  { key: 'achievements', label: 'Achievements', description: 'Badges, milestones, and contribution history', icon: '\uD83C\uDFC6', estimatedSizeKB: 48, recordCount: 34 },
  { key: 'governance', label: 'Governance Votes', description: 'All proposals voted on and delegation history', icon: '\uD83D\uDDF3\uFE0F', estimatedSizeKB: 28, recordCount: 19 },
  { key: 'health', label: 'Health Data', description: 'Health channel records and wellness attestations', icon: '\u2764\uFE0F', estimatedSizeKB: 156, recordCount: 312 },
  { key: 'social', label: 'Social Connections', description: 'Trust graph, mentorship links, community bonds', icon: '\uD83E\uDD1D', estimatedSizeKB: 64, recordCount: 87 },
  { key: 'settings', label: 'Settings', description: 'App preferences, notification config, theme choices', icon: '\u2699\uFE0F', estimatedSizeKB: 4, recordCount: 1 },
];

const DEMO_EXPORTS: ExportRecord[] = [
  { id: 'exp-001', date: '2026-03-15', categories: ['identity', 'transactions', 'living_ledger', 'achievements', 'governance', 'health', 'social', 'settings'], format: 'json', sizeKB: 1420, status: 'completed' },
  { id: 'exp-002', date: '2026-02-28', categories: ['transactions', 'living_ledger'], format: 'csv', sizeKB: 980, status: 'completed' },
  { id: 'exp-003', date: '2026-01-10', categories: ['identity', 'settings'], format: 'json', sizeKB: 16, status: 'expired' },
];

const PRIVACY_SECTIONS = [
  { title: 'Your Data, Your Rights', body: 'Under the Human Constitution, every person has absolute ownership of their data. You can export, transfer, or delete your data at any time without restriction or approval.' },
  { title: 'What We Store', body: 'Your on-chain data is stored across the Open Chain network. Local data (settings, cached records) resides only on this device. We never sell, share, or monetize your personal information.' },
  { title: 'Export Guarantees', body: 'Exports include all data associated with your identity. Nothing is omitted or filtered. The export file is cryptographically signed so you can verify its completeness.' },
  { title: 'Data Portability', body: 'Export files use open standards (JSON/CSV). You can import them into any compatible system or keep them as a personal archive. Your data is never locked in.' },
  { title: 'Right to Deletion', body: 'You can request deletion of your local data at any time. On-chain records are immutable by design, but your identity can be disassociated through zero-knowledge proofs.' },
  { title: 'Contact', body: 'Questions about your data? Reach the Open Chain Data Council through the Governance tab or email privacy@openchain.org.' },
];

export function DataExportScreen({ onClose }: Props) {
  const { demoMode } = useWalletStore();
  const t = useTheme();

  const [tab, setTab] = useState<Tab>('export');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(DATA_CATEGORIES.map((c) => c.key)),
  );
  const [format, setFormat] = useState<ExportFormat>('json');
  const [exporting, setExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const toggleCategory = useCallback((key: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedCategories(new Set(DATA_CATEGORIES.map((c) => c.key)));
  }, []);

  const selectNone = useCallback(() => {
    setSelectedCategories(new Set());
  }, []);

  const estimatedSize = useMemo(() => {
    const totalKB = DATA_CATEGORIES
      .filter((c) => selectedCategories.has(c.key))
      .reduce((sum, c) => sum + c.estimatedSizeKB, 0);
    if (totalKB >= 1024) return `${(totalKB / 1024).toFixed(1)} MB`;
    return `${totalKB} KB`;
  }, [selectedCategories]);

  const totalRecords = useMemo(() => {
    return DATA_CATEGORIES
      .filter((c) => selectedCategories.has(c.key))
      .reduce((sum, c) => sum + c.recordCount, 0);
  }, [selectedCategories]);

  const handleExport = useCallback(() => {
    if (selectedCategories.size === 0) return;
    setExporting(true);
    setExportComplete(false);
    setTimeout(() => {
      setExporting(false);
      setExportComplete(true);
    }, 2000);
  }, [selectedCategories]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatSize = (kb: number) => {
    if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
    return `${kb} KB`;
  };

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '700' },
    backText: { color: t.accent.blue, fontSize: 16 },
    tabs: { flexDirection: 'row', marginHorizontal: 16, marginTop: 4, marginBottom: 12, backgroundColor: t.bg.card, borderRadius: 12, padding: 3 },
    tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: '#FFFFFF' },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 24, marginBottom: 8, marginLeft: 4 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 4 },
    row: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    divider: { height: 1, backgroundColor: t.border, marginHorizontal: 16 },
    catIcon: { fontSize: 22, width: 36 },
    catInfo: { flex: 1, marginRight: 8 },
    catLabel: { color: t.text.primary, fontSize: 15, fontWeight: '600' },
    catDesc: { color: t.text.secondary, fontSize: 12, marginTop: 2 },
    catMeta: { color: t.text.secondary, fontSize: 11, marginTop: 2 },
    selectRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginBottom: 8, marginRight: 4 },
    selectBtn: { color: t.accent.blue, fontSize: 13, fontWeight: '600' },
    formatRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
    formatBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: t.bg.card, borderWidth: 2, borderColor: t.border },
    formatBtnActive: { borderColor: t.accent.blue, backgroundColor: t.accent.blue + '18' },
    formatLabel: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    formatLabelActive: { color: t.accent.blue },
    formatSub: { color: t.text.secondary, fontSize: 11, marginTop: 2 },
    summaryCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginTop: 16 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    summaryLabel: { color: t.text.secondary, fontSize: 13 },
    summaryValue: { color: t.text.primary, fontSize: 13, fontWeight: '600' },
    exportBtn: { marginTop: 20, backgroundColor: t.accent.green, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
    exportBtnDisabled: { opacity: 0.4 },
    exportBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    successCard: { backgroundColor: t.accent.green + '18', borderRadius: 16, padding: 20, marginTop: 16, alignItems: 'center' },
    successIcon: { fontSize: 36, marginBottom: 8 },
    successTitle: { color: t.accent.green, fontSize: 17, fontWeight: '700', marginBottom: 4 },
    successSub: { color: t.text.secondary, fontSize: 13, textAlign: 'center' },
    historyCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    historyDate: { color: t.text.primary, fontSize: 15, fontWeight: '600' },
    historyBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    historyBadgeText: { fontSize: 11, fontWeight: '700' },
    historyMeta: { color: t.text.secondary, fontSize: 12, marginTop: 4 },
    historyCategories: { color: t.text.secondary, fontSize: 12, marginTop: 2 },
    privacyNotice: { backgroundColor: t.accent.blue + '15', borderRadius: 16, padding: 20, marginBottom: 20 },
    privacyIcon: { fontSize: 28, marginBottom: 8 },
    privacyHeadline: { color: t.accent.blue, fontSize: 16, fontWeight: '700', marginBottom: 4 },
    privacyQuote: { color: t.text.primary, fontSize: 15, fontWeight: '600', fontStyle: 'italic' },
    privacySection: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    privacySectionTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700', marginBottom: 6 },
    privacySectionBody: { color: t.text.secondary, fontSize: 14, lineHeight: 20 },
    emptyHint: { color: t.text.secondary, fontSize: 13, textAlign: 'center', marginTop: 40 },
  }), [t]);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'export', label: 'Export' },
    { key: 'history', label: 'History' },
    { key: 'privacy', label: 'Privacy' },
  ];

  /* ── Export Tab ── */
  const renderExport = () => (
    <>
      {/* Banner */}
      <View style={st.privacyNotice}>
        <Text style={st.privacyIcon}>{'\uD83D\uDD12'}</Text>
        <Text style={st.privacyQuote}>Your data belongs to you. Export it anytime.</Text>
      </View>

      {/* Select / Deselect */}
      <View style={st.selectRow}>
        <TouchableOpacity onPress={selectAll}><Text style={st.selectBtn}>Select All</Text></TouchableOpacity>
        <TouchableOpacity onPress={selectNone}><Text style={st.selectBtn}>Clear All</Text></TouchableOpacity>
      </View>

      {/* Categories */}
      <Text style={st.section}>Data Categories</Text>
      <View style={st.card}>
        {DATA_CATEGORIES.map((cat, i) => (
          <React.Fragment key={cat.key}>
            {i > 0 && <View style={st.divider} />}
            <TouchableOpacity style={st.row} onPress={() => toggleCategory(cat.key)}>
              <Text style={st.catIcon}>{cat.icon}</Text>
              <View style={st.catInfo}>
                <Text style={st.catLabel}>{cat.label}</Text>
                <Text style={st.catDesc}>{cat.description}</Text>
                <Text style={st.catMeta}>{cat.recordCount} records  {'\u00B7'}  ~{formatSize(cat.estimatedSizeKB)}</Text>
              </View>
              <Switch
                value={selectedCategories.has(cat.key)}
                onValueChange={() => toggleCategory(cat.key)}
                trackColor={{ false: t.border, true: t.accent.green }}
              />
            </TouchableOpacity>
          </React.Fragment>
        ))}
      </View>

      {/* Format */}
      <Text style={st.section}>Export Format</Text>
      <View style={st.formatRow}>
        <TouchableOpacity style={[st.formatBtn, format === 'json' && st.formatBtnActive]} onPress={() => setFormat('json')}>
          <Text style={[st.formatLabel, format === 'json' && st.formatLabelActive]}>JSON</Text>
          <Text style={st.formatSub}>Structured data</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[st.formatBtn, format === 'csv' && st.formatBtnActive]} onPress={() => setFormat('csv')}>
          <Text style={[st.formatLabel, format === 'csv' && st.formatLabelActive]}>CSV</Text>
          <Text style={st.formatSub}>Spreadsheet-friendly</Text>
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={st.summaryCard}>
        <View style={st.summaryRow}>
          <Text style={st.summaryLabel}>Categories Selected</Text>
          <Text style={st.summaryValue}>{selectedCategories.size} of {DATA_CATEGORIES.length}</Text>
        </View>
        <View style={st.summaryRow}>
          <Text style={st.summaryLabel}>Total Records</Text>
          <Text style={st.summaryValue}>{totalRecords.toLocaleString()}</Text>
        </View>
        <View style={st.summaryRow}>
          <Text style={st.summaryLabel}>Estimated Size</Text>
          <Text style={st.summaryValue}>{estimatedSize}</Text>
        </View>
        <View style={[st.summaryRow, { marginBottom: 0 }]}>
          <Text style={st.summaryLabel}>Format</Text>
          <Text style={st.summaryValue}>{format.toUpperCase()}</Text>
        </View>
      </View>

      {/* Export Button */}
      <TouchableOpacity
        style={[st.exportBtn, (selectedCategories.size === 0 || exporting) && st.exportBtnDisabled]}
        onPress={handleExport}
        disabled={selectedCategories.size === 0 || exporting}
      >
        {exporting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={st.exportBtnText}>
            {exportComplete ? 'Export Again' : 'Export My Data'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Success */}
      {exportComplete && (
        <View style={st.successCard}>
          <Text style={st.successIcon}>{'\u2705'}</Text>
          <Text style={st.successTitle}>Export Complete</Text>
          <Text style={st.successSub}>
            Your data has been exported as {format.toUpperCase()}.{'\n'}
            {demoMode ? 'In demo mode — no file was saved.' : 'File saved to your device.'}
          </Text>
        </View>
      )}
    </>
  );

  /* ── History Tab ── */
  const renderHistory = () => (
    <>
      <Text style={st.section}>Export History</Text>
      {DEMO_EXPORTS.map((exp) => {
        const isExpired = exp.status === 'expired';
        return (
          <View key={exp.id} style={st.historyCard}>
            <View style={st.historyRow}>
              <Text style={st.historyDate}>{formatDate(exp.date)}</Text>
              <View style={[st.historyBadge, { backgroundColor: isExpired ? t.accent.red + '20' : t.accent.green + '20' }]}>
                <Text style={[st.historyBadgeText, { color: isExpired ? t.accent.red : t.accent.green }]}>
                  {isExpired ? 'Expired' : 'Available'}
                </Text>
              </View>
            </View>
            <Text style={st.historyMeta}>
              {exp.format.toUpperCase()}  {'\u00B7'}  {formatSize(exp.sizeKB)}  {'\u00B7'}  {exp.categories.length} categories
            </Text>
            <Text style={st.historyCategories}>
              {exp.categories.map((k) => DATA_CATEGORIES.find((c) => c.key === k)?.label ?? k).join(', ')}
            </Text>
            {!isExpired && (
              <TouchableOpacity style={{ marginTop: 10 }}>
                <Text style={{ color: t.accent.blue, fontSize: 13, fontWeight: '600' }}>Download Again</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
      <Text style={st.emptyHint}>Exports are available for 30 days after creation.</Text>
    </>
  );

  /* ── Privacy Tab ── */
  const renderPrivacy = () => (
    <>
      <View style={st.privacyNotice}>
        <Text style={st.privacyIcon}>{'\uD83D\uDEE1\uFE0F'}</Text>
        <Text style={st.privacyHeadline}>Data Rights Under the Human Constitution</Text>
        <Text style={st.privacyQuote}>"Your data belongs to you. Export it anytime."</Text>
      </View>

      {PRIVACY_SECTIONS.map((sec, i) => (
        <View key={i} style={st.privacySection}>
          <Text style={st.privacySectionTitle}>{sec.title}</Text>
          <Text style={st.privacySectionBody}>{sec.body}</Text>
        </View>
      ))}
    </>
  );

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={st.title}>Data Export</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={st.tabs}>
        {TABS.map((tb) => (
          <TouchableOpacity
            key={tb.key}
            style={[st.tab, tab === tb.key && st.tabActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={[st.tabText, tab === tb.key && st.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll}>
        {tab === 'export' && renderExport()}
        {tab === 'history' && renderHistory()}
        {tab === 'privacy' && renderPrivacy()}
      </ScrollView>
    </SafeAreaView>
  );
}
