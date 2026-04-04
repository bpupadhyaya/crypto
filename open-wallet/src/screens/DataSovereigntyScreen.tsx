import { fonts } from '../utils/theme';
/**
 * Data Sovereignty Screen — Article VIII of The Human Constitution.
 *
 * "Every human being shall have absolute sovereignty over their personal data,
 * with granular control over what is shared, with whom, and for how long."
 * — Human Constitution, Article VIII
 *
 * Features:
 * - Data categories with public/selective/private toggle controls
 * - Data access log — who accessed your data and when
 * - Revoke access for specific entities
 * - Export all on-chain data as JSON
 * - Data deletion request for off-chain data
 * - Privacy score (0-100) based on protection level
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

type PrivacyLevel = 'public' | 'selective' | 'private';
type TabId = 'controls' | 'access-log' | 'export';

interface DataCategory {
  id: string;
  label: string;
  icon: string;
  description: string;
  allowedLevels: PrivacyLevel[];
  defaultLevel: PrivacyLevel;
}

interface AccessLogEntry {
  id: string;
  entity: string;
  entityType: 'dapp' | 'government' | 'employer' | 'healthcare' | 'education';
  category: string;
  timestamp: number;
  action: 'read' | 'write' | 'verify';
  granted: boolean;
}

const DATA_CATEGORIES: DataCategory[] = [
  { id: 'identity', label: 'Identity', icon: '\u{1F464}', description: 'Name, photo, date of birth', allowedLevels: ['public', 'selective', 'private'], defaultLevel: 'selective' },
  { id: 'financial', label: 'Financial', icon: '\u{1F4B0}', description: 'Balances, transactions, OTK holdings', allowedLevels: ['public', 'selective', 'private'], defaultLevel: 'private' },
  { id: 'health', label: 'Health', icon: '\u{1FA7A}', description: 'Wellness data, medical records', allowedLevels: ['selective', 'private'], defaultLevel: 'private' },
  { id: 'education', label: 'Education', icon: '\u{1F393}', description: 'Certificates, scores, credentials', allowedLevels: ['public', 'selective', 'private'], defaultLevel: 'selective' },
  { id: 'location', label: 'Location', icon: '\u{1F4CD}', description: 'Region, country, locale', allowedLevels: ['public', 'selective', 'private'], defaultLevel: 'selective' },
  { id: 'social', label: 'Social', icon: '\u{1F91D}', description: 'Connections, messages, groups', allowedLevels: ['selective', 'private'], defaultLevel: 'private' },
  { id: 'governance', label: 'Governance', icon: '\u{1F5F3}\uFE0F', description: 'Votes, proposals, civic participation', allowedLevels: ['public', 'selective'], defaultLevel: 'selective' },
];

const DEMO_ACCESS_LOG: AccessLogEntry[] = [
  { id: 'log-1', entity: 'OpenHealth DApp', entityType: 'healthcare', category: 'health', timestamp: Date.now() - 1800_000, action: 'read', granted: true },
  { id: 'log-2', entity: 'CertVerify Protocol', entityType: 'education', category: 'education', timestamp: Date.now() - 7200_000, action: 'verify', granted: true },
  { id: 'log-3', entity: 'TaxDAO', entityType: 'government', category: 'financial', timestamp: Date.now() - 14400_000, action: 'read', granted: false },
  { id: 'log-4', entity: 'PeaceIndex Oracle', entityType: 'dapp', category: 'governance', timestamp: Date.now() - 86400_000, action: 'read', granted: true },
  { id: 'log-5', entity: 'WellnessTracker', entityType: 'healthcare', category: 'health', timestamp: Date.now() - 172800_000, action: 'write', granted: true },
  { id: 'log-6', entity: 'SkillMarket DApp', entityType: 'employer', category: 'education', timestamp: Date.now() - 259200_000, action: 'verify', granted: true },
  { id: 'log-7', entity: 'CommunityBoard', entityType: 'dapp', category: 'identity', timestamp: Date.now() - 345600_000, action: 'read', granted: true },
  { id: 'log-8', entity: 'RegionAnalytics', entityType: 'government', category: 'location', timestamp: Date.now() - 432000_000, action: 'read', granted: false },
];

const LEVEL_COLORS: Record<PrivacyLevel, string> = {
  public: '#4caf50',
  selective: '#ff9800',
  private: '#f44336',
};

const LEVEL_ICONS: Record<PrivacyLevel, string> = {
  public: '\u{1F30D}',
  selective: '\u{1F512}',
  private: '\u{1F6E1}\uFE0F',
};

const ENTITY_TYPE_ICONS: Record<string, string> = {
  dapp: '\u{1F4F1}',
  government: '\u{1F3DB}\uFE0F',
  employer: '\u{1F3E2}',
  healthcare: '\u{1F3E5}',
  education: '\u{1F3EB}',
};

const ACTION_LABELS: Record<string, string> = {
  read: 'Read',
  write: 'Write',
  verify: 'Verify',
};

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function computePrivacyScore(settings: Record<string, PrivacyLevel>): number {
  const weights: Record<string, number> = {
    identity: 15,
    financial: 20,
    health: 20,
    education: 10,
    location: 10,
    social: 15,
    governance: 10,
  };
  const levelScores: Record<PrivacyLevel, number> = {
    private: 1.0,
    selective: 0.6,
    public: 0.1,
  };
  let total = 0;
  let maxTotal = 0;
  for (const cat of DATA_CATEGORIES) {
    const w = weights[cat.id] ?? 10;
    const level = settings[cat.id] ?? cat.defaultLevel;
    total += w * levelScores[level];
    maxTotal += w;
  }
  return Math.round((total / maxTotal) * 100);
}

export function DataSovereigntyScreen({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('controls');
  const [privacySettings, setPrivacySettings] = useState<Record<string, PrivacyLevel>>(() => {
    const initial: Record<string, PrivacyLevel> = {};
    for (const cat of DATA_CATEGORIES) {
      initial[cat.id] = cat.defaultLevel;
    }
    return initial;
  });
  const [accessLog, setAccessLog] = useState<AccessLogEntry[]>(DEMO_ACCESS_LOG);
  const [exporting, setExporting] = useState(false);
  const [deletionRequested, setDeletionRequested] = useState(false);
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const privacyScore = useMemo(() => computePrivacyScore(privacySettings), [privacySettings]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    heroCard: { backgroundColor: t.accent.blue + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 12 },
    heroTitle: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginTop: 8, lineHeight: 20 },
    scoreContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 12 },
    scoreCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
    scoreValue: { color: '#fff', fontSize: fonts.xl, fontWeight: fonts.heavy },
    scoreLabel: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    scoreDesc: { color: t.text.muted, fontSize: fonts.sm },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 20, backgroundColor: t.bg.card, borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.semibold },
    section: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 24 },
    categoryCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    categoryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    categoryIcon: { fontSize: fonts.xxl, marginRight: 12 },
    categoryLabel: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, flex: 1 },
    categoryDesc: { color: t.text.muted, fontSize: fonts.sm, marginBottom: 12 },
    levelRow: { flexDirection: 'row', gap: 8 },
    levelBtn: { flex: 1, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 10, alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent' },
    levelBtnActive: { borderWidth: 0 },
    levelBtnText: { fontSize: fonts.xs, fontWeight: fonts.bold, marginTop: 2 },
    levelIcon: { fontSize: fonts.lg },
    logCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 10 },
    logHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    logEntity: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, flex: 1 },
    logTime: { color: t.text.muted, fontSize: fonts.xs },
    logDetail: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
    logCategory: { color: t.text.secondary, fontSize: fonts.sm },
    logAction: { fontSize: fonts.xs, fontWeight: fonts.bold, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
    logGranted: { backgroundColor: '#4caf50' + '20', color: '#4caf50' },
    logDenied: { backgroundColor: '#f44336' + '20', color: '#f44336' },
    revokeBtn: { marginTop: 10, alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8, backgroundColor: '#f44336' + '15' },
    revokeBtnText: { color: '#f44336', fontSize: fonts.sm, fontWeight: fonts.bold },
    entityIcon: { fontSize: fonts.xl, marginRight: 8 },
    exportCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 12 },
    exportTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, marginBottom: 4 },
    exportDesc: { color: t.text.muted, fontSize: fonts.sm, lineHeight: 20, marginBottom: 16 },
    exportBtn: { backgroundColor: t.accent.blue, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    exportBtnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    deleteBtn: { backgroundColor: '#f44336', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    deleteBtnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    deletedBadge: { backgroundColor: '#f44336' + '15', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    deletedBadgeText: { color: '#f44336', fontSize: fonts.md, fontWeight: fonts.bold },
    constitutionNote: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginHorizontal: 24, marginTop: 16, marginBottom: 24, lineHeight: 18 },
    emptyText: { color: t.text.muted, fontSize: fonts.md, textAlign: 'center', marginTop: 40 },
  }), [t]);

  const cycleLevel = useCallback((categoryId: string) => {
    setPrivacySettings((prev) => {
      const cat = DATA_CATEGORIES.find((c) => c.id === categoryId);
      if (!cat) return prev;
      const currentLevel = prev[categoryId] ?? cat.defaultLevel;
      const currentIdx = cat.allowedLevels.indexOf(currentLevel);
      const nextIdx = (currentIdx + 1) % cat.allowedLevels.length;
      return { ...prev, [categoryId]: cat.allowedLevels[nextIdx] };
    });
  }, []);

  const setLevel = useCallback((categoryId: string, level: PrivacyLevel) => {
    const cat = DATA_CATEGORIES.find((c) => c.id === categoryId);
    if (!cat || !cat.allowedLevels.includes(level)) return;
    setPrivacySettings((prev) => ({ ...prev, [categoryId]: level }));
  }, []);

  const handleRevoke = useCallback((logEntry: AccessLogEntry) => {
    Alert.alert(
      'Revoke Access',
      `Revoke ${logEntry.entity}'s access to your ${logEntry.category} data? They will no longer be able to read, write, or verify this data category.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: () => {
            setAccessLog((prev) => prev.filter((e) => e.id !== logEntry.id));
            Alert.alert('Access Revoked', `${logEntry.entity} can no longer access your ${logEntry.category} data.`);
          },
        },
      ],
    );
  }, []);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      // Simulate export generation
      await new Promise((r) => setTimeout(r, 1500));
      const exportData = {
        exportedAt: new Date().toISOString(),
        privacySettings,
        accessLog: accessLog.map((e) => ({
          entity: e.entity,
          category: e.category,
          action: e.action,
          granted: e.granted,
          timestamp: new Date(e.timestamp).toISOString(),
        })),
        dataCategories: DATA_CATEGORIES.map((c) => ({
          id: c.id,
          label: c.label,
          currentLevel: privacySettings[c.id] ?? c.defaultLevel,
        })),
        privacyScore,
      };
      // In production: write to file system or share
      Alert.alert(
        'Data Exported',
        `Your on-chain data has been compiled as JSON (${JSON.stringify(exportData).length} bytes). In production, this will be saved to your device or shared via your preferred method.`,
      );
    } catch {
      Alert.alert('Export Failed', 'Unable to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  }, [privacySettings, accessLog, privacyScore]);

  const handleDeletionRequest = useCallback(() => {
    Alert.alert(
      'Request Data Deletion',
      'This will submit a request to delete all off-chain data associated with your Universal ID. On-chain data is immutable and cannot be deleted, but off-chain caches, indexes, and replicas will be purged.\n\nThis action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Deletion',
          style: 'destructive',
          onPress: () => {
            setDeletionRequested(true);
            Alert.alert('Deletion Requested', 'Your off-chain data deletion request has been submitted. Processing may take up to 30 days.');
          },
        },
      ],
    );
  }, []);

  const scoreColor = privacyScore >= 80 ? '#4caf50' : privacyScore >= 50 ? '#ff9800' : '#f44336';
  const scoreLabel = privacyScore >= 80 ? 'Strongly Protected' : privacyScore >= 50 ? 'Moderately Protected' : 'Minimally Protected';

  const renderControls = () => (
    <>
      <Text style={s.section}>Data Categories</Text>
      {DATA_CATEGORIES.map((cat) => {
        const currentLevel = privacySettings[cat.id] ?? cat.defaultLevel;
        return (
          <View key={cat.id} style={s.categoryCard}>
            <View style={s.categoryHeader}>
              <Text style={s.categoryIcon}>{cat.icon}</Text>
              <Text style={s.categoryLabel}>{cat.label}</Text>
              <Text style={{ fontSize: fonts.md }}>{LEVEL_ICONS[currentLevel]}</Text>
            </View>
            <Text style={s.categoryDesc}>{cat.description}</Text>
            <View style={s.levelRow}>
              {cat.allowedLevels.map((level) => {
                const isActive = currentLevel === level;
                return (
                  <TouchableOpacity
                    key={level}
                    style={[
                      s.levelBtn,
                      isActive && [s.levelBtnActive, { backgroundColor: LEVEL_COLORS[level] + '20', borderColor: LEVEL_COLORS[level] }],
                      !isActive && { borderColor: t.border },
                    ]}
                    onPress={() => setLevel(cat.id, level)}
                    activeOpacity={0.7}
                  >
                    <Text style={s.levelIcon}>{LEVEL_ICONS[level]}</Text>
                    <Text style={[s.levelBtnText, { color: isActive ? LEVEL_COLORS[level] : t.text.muted }]}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      })}
    </>
  );

  const renderAccessLog = () => (
    <>
      <Text style={s.section}>Access Log</Text>
      {accessLog.length === 0 ? (
        <Text style={s.emptyText}>No access log entries</Text>
      ) : (
        accessLog.map((entry) => (
          <View key={entry.id} style={s.logCard}>
            <View style={s.logHeader}>
              <Text style={s.entityIcon}>{ENTITY_TYPE_ICONS[entry.entityType] ?? '\u{1F4F1}'}</Text>
              <Text style={s.logEntity}>{entry.entity}</Text>
              <Text style={s.logTime}>{formatTimeAgo(entry.timestamp)}</Text>
            </View>
            <View style={s.logDetail}>
              <Text style={s.logCategory}>
                {DATA_CATEGORIES.find((c) => c.id === entry.category)?.icon ?? ''} {entry.category.charAt(0).toUpperCase() + entry.category.slice(1)}
              </Text>
              <Text style={[s.logAction, entry.granted ? s.logGranted : s.logDenied]}>
                {ACTION_LABELS[entry.action]} {entry.granted ? '\u2713' : '\u2717'}
              </Text>
            </View>
            {entry.granted && (
              <TouchableOpacity style={s.revokeBtn} onPress={() => handleRevoke(entry)} activeOpacity={0.7}>
                <Text style={s.revokeBtnText}>Revoke Access</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}
    </>
  );

  const renderExport = () => (
    <>
      <Text style={s.section}>Export Your Data</Text>
      <View style={s.exportCard}>
        <Text style={s.exportTitle}>Download All Data</Text>
        <Text style={s.exportDesc}>
          Export all your on-chain data as a JSON file. This includes your privacy settings,
          access logs, contribution records, and all data associated with your Universal ID.
        </Text>
        <TouchableOpacity style={s.exportBtn} onPress={handleExport} activeOpacity={0.7} disabled={exporting}>
          {exporting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.exportBtnText}>Export as JSON</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={s.section}>Data Deletion</Text>
      <View style={s.exportCard}>
        <Text style={s.exportTitle}>Request Off-Chain Data Deletion</Text>
        <Text style={s.exportDesc}>
          Request deletion of all off-chain data (caches, indexes, replicas). On-chain data
          is immutable by design and cannot be deleted — this is what makes your data
          sovereign and tamper-proof.
        </Text>
        {deletionRequested ? (
          <View style={s.deletedBadge}>
            <Text style={s.deletedBadgeText}>Deletion Requested — Processing</Text>
          </View>
        ) : (
          <TouchableOpacity style={s.deleteBtn} onPress={handleDeletionRequest} activeOpacity={0.7}>
            <Text style={s.deleteBtnText}>Request Deletion</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );

  const TABS: { id: TabId; label: string }[] = [
    { id: 'controls', label: 'Controls' },
    { id: 'access-log', label: 'Access Log' },
    { id: 'export', label: 'Export' },
  ];

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Data Sovereignty</Text>
        <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero card with privacy score */}
        <View style={s.heroCard}>
          <Text style={s.heroIcon}>{'\u{1F6E1}\uFE0F'}</Text>
          <Text style={s.heroTitle}>Article VIII — Data Sovereignty</Text>
          <Text style={s.heroSubtitle}>
            Your data belongs to you. Control exactly what is shared, with whom, and revoke access at any time.
          </Text>
          <View style={s.scoreContainer}>
            <View style={[s.scoreCircle, { backgroundColor: scoreColor }]}>
              <Text style={s.scoreValue}>{privacyScore}</Text>
            </View>
            <View>
              <Text style={s.scoreLabel}>Privacy Score</Text>
              <Text style={s.scoreDesc}>{scoreLabel}</Text>
            </View>
          </View>
        </View>

        {/* Tab bar */}
        <View style={s.tabRow}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[s.tab, activeTab === tab.id && s.tabActive]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <Text style={activeTab === tab.id ? s.tabTextActive : s.tabText}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        {activeTab === 'controls' && renderControls()}
        {activeTab === 'access-log' && renderAccessLog()}
        {activeTab === 'export' && renderExport()}

        <Text style={s.constitutionNote}>
          The Human Constitution guarantees your right to data sovereignty.{'\n'}
          No entity may access your data without explicit consent.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
