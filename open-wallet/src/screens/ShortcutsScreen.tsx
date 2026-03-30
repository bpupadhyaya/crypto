/**
 * Shortcuts Screen — Art IX: Customizable quick-action shortcuts.
 *
 * Lets users personalize their home screen with 8-12 most-used screens.
 * Supports add/remove, reorder, usage-based suggestions, and
 * reset-to-persona-defaults. Screens are organized by category
 * for easy browsing.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// --- Types ---

type TabKey = 'my-shortcuts' | 'add' | 'suggested';

interface ShortcutItem {
  id: string;
  label: string;
  icon: string;
  screen: string;
  category: string;
}

interface SuggestedShortcut extends ShortcutItem {
  reason: string;
  usageCount: number;
}

// --- Categories & screen catalog ---

const SCREEN_CATEGORIES: Record<string, ShortcutItem[]> = {
  'Finance': [
    { id: 'sc_send', label: 'Send', icon: '\u{1F4E4}', screen: 'SendScreen', category: 'Finance' },
    { id: 'sc_receive', label: 'Receive', icon: '\u{1F4E5}', screen: 'ReceiveScreen', category: 'Finance' },
    { id: 'sc_swap', label: 'Swap', icon: '\u{1F504}', screen: 'SwapScreen', category: 'Finance' },
    { id: 'sc_bridge', label: 'Bridge', icon: '\u{1F309}', screen: 'BridgeScreen', category: 'Finance' },
    { id: 'sc_staking', label: 'Staking', icon: '\u{1F4C8}', screen: 'StakingScreen', category: 'Finance' },
    { id: 'sc_budget', label: 'Budget', icon: '\u{1F4CA}', screen: 'BudgetScreen', category: 'Finance' },
  ],
  'Community': [
    { id: 'sc_governance', label: 'Governance', icon: '\u{1F3DB}', screen: 'GovernanceScreen', category: 'Community' },
    { id: 'sc_gratitude', label: 'Gratitude Wall', icon: '\u{1F49B}', screen: 'GratitudeWallScreen', category: 'Community' },
    { id: 'sc_calendar', label: 'Calendar', icon: '\u{1F4C5}', screen: 'CalendarScreen', category: 'Community' },
    { id: 'sc_ambassador', label: 'Ambassador', icon: '\u{1F310}', screen: 'AmbassadorScreen', category: 'Community' },
  ],
  'Health & Safety': [
    { id: 'sc_health', label: 'Health', icon: '\u{1F49A}', screen: 'HealthScreen', category: 'Health & Safety' },
    { id: 'sc_safety', label: 'Safety', icon: '\u{1F6E1}', screen: 'SafetyScreen', category: 'Health & Safety' },
    { id: 'sc_eldercare', label: 'Eldercare', icon: '\u{1F9D3}', screen: 'EldercareScreen', category: 'Health & Safety' },
  ],
  'Education': [
    { id: 'sc_achievements', label: 'Achievements', icon: '\u{1F3C6}', screen: 'AchievementsScreen', category: 'Education' },
    { id: 'sc_resources', label: 'Resources', icon: '\u{1F4DA}', screen: 'ResourcesScreen', category: 'Education' },
    { id: 'sc_mentorship', label: 'Mentorship', icon: '\u{1F393}', screen: 'MentorshipScreen', category: 'Education' },
  ],
  'System': [
    { id: 'sc_settings', label: 'Settings', icon: '\u2699\uFE0F', screen: 'SettingsScreen', category: 'System' },
    { id: 'sc_security', label: 'Security', icon: '\u{1F512}', screen: 'SecurityScreen', category: 'System' },
    { id: 'sc_notifications', label: 'Notifications', icon: '\u{1F514}', screen: 'NotificationCenterScreen', category: 'System' },
    { id: 'sc_backup', label: 'Backup', icon: '\u{1F4BE}', screen: 'BackupScreen', category: 'System' },
  ],
};

const ALL_SCREENS = Object.values(SCREEN_CATEGORIES).flat();

// --- Demo data ---

const DEMO_SHORTCUTS: ShortcutItem[] = [
  ALL_SCREENS.find(s => s.id === 'sc_send')!,
  ALL_SCREENS.find(s => s.id === 'sc_receive')!,
  ALL_SCREENS.find(s => s.id === 'sc_swap')!,
  ALL_SCREENS.find(s => s.id === 'sc_governance')!,
  ALL_SCREENS.find(s => s.id === 'sc_staking')!,
  ALL_SCREENS.find(s => s.id === 'sc_gratitude')!,
  ALL_SCREENS.find(s => s.id === 'sc_settings')!,
  ALL_SCREENS.find(s => s.id === 'sc_health')!,
];

const DEFAULT_SHORTCUTS = DEMO_SHORTCUTS.map(s => s.id);

const DEMO_SUGGESTIONS: SuggestedShortcut[] = [
  { ...ALL_SCREENS.find(s => s.id === 'sc_bridge')!, reason: 'Used 12 times this week', usageCount: 12 },
  { ...ALL_SCREENS.find(s => s.id === 'sc_calendar')!, reason: 'Popular in your community', usageCount: 8 },
  { ...ALL_SCREENS.find(s => s.id === 'sc_achievements')!, reason: 'You have 3 new achievements', usageCount: 5 },
  { ...ALL_SCREENS.find(s => s.id === 'sc_security')!, reason: 'Recommended for all users', usageCount: 0 },
];

// --- Component ---

interface Props {
  onClose: () => void;
}

export function ShortcutsScreen({ onClose }: Props) {
  const t = useTheme();
  const demoMode = useWalletStore((s) => s.demoMode);

  const [tab, setTab] = useState<TabKey>('my-shortcuts');
  const [shortcuts, setShortcuts] = useState<ShortcutItem[]>(DEMO_SHORTCUTS);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const shortcutIds = useMemo(() => new Set(shortcuts.map(s => s.id)), [shortcuts]);

  const addShortcut = useCallback((item: ShortcutItem) => {
    if (shortcuts.length >= 12) {
      Alert.alert('Maximum Reached', 'You can have at most 12 shortcuts. Remove one first.');
      return;
    }
    setShortcuts(prev => [...prev, item]);
  }, [shortcuts.length]);

  const removeShortcut = useCallback((id: string) => {
    if (shortcuts.length <= 4) {
      Alert.alert('Minimum Required', 'You need at least 4 shortcuts on your home screen.');
      return;
    }
    setShortcuts(prev => prev.filter(s => s.id !== id));
  }, [shortcuts.length]);

  const moveUp = useCallback((index: number) => {
    if (index === 0) return;
    setShortcuts(prev => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, []);

  const moveDown = useCallback((index: number) => {
    setShortcuts(prev => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    Alert.alert(
      'Reset Shortcuts',
      'This will replace your shortcuts with the default set for your persona.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => {
          setShortcuts(DEMO_SHORTCUTS);
        }},
      ],
    );
  }, []);

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    headerTitle: { color: t.text.primary, fontSize: 20, fontWeight: '700' },
    closeText: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 40 },
    tabRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, gap: 8 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: t.bg.card, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: '#fff' },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 16, marginBottom: 10, marginLeft: 4 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    gridItem: { width: '22%' as any, alignItems: 'center', backgroundColor: t.bg.card, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 4 },
    gridIcon: { fontSize: 28, marginBottom: 6 },
    gridLabel: { color: t.text.primary, fontSize: 11, fontWeight: '600', textAlign: 'center' },
    listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.bg.card, borderRadius: 12, padding: 12, marginBottom: 8, gap: 12 },
    listIcon: { fontSize: 24 },
    listContent: { flex: 1 },
    listLabel: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    listCategory: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    listActions: { flexDirection: 'row', gap: 6 },
    moveBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: t.bg.primary, alignItems: 'center', justifyContent: 'center' },
    moveBtnText: { color: t.text.secondary, fontSize: 16, fontWeight: '700' },
    removeBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#FF3B3020', alignItems: 'center', justifyContent: 'center' },
    removeBtnText: { color: '#FF3B30', fontSize: 16, fontWeight: '700' },
    addBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: t.accent.green + '20', alignItems: 'center', justifyContent: 'center' },
    addBtnText: { color: t.accent.green, fontSize: 18, fontWeight: '700' },
    catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: t.bg.card, borderRadius: 12, padding: 14, marginBottom: 8 },
    catHeaderText: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    catChevron: { color: t.text.muted, fontSize: 16 },
    catItems: { paddingLeft: 12, marginBottom: 8 },
    suggestCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', gap: 12, alignItems: 'center' },
    suggestIcon: { fontSize: 28 },
    suggestContent: { flex: 1 },
    suggestLabel: { color: t.text.primary, fontSize: 14, fontWeight: '700' },
    suggestReason: { color: t.text.secondary, fontSize: 12, marginTop: 2 },
    suggestUsage: { color: t.text.muted, fontSize: 10, marginTop: 2 },
    resetBtn: { backgroundColor: t.bg.card, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 20, borderWidth: 1, borderColor: '#FF3B3040' },
    resetText: { color: '#FF3B30', fontSize: 14, fontWeight: '700' },
    countText: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginBottom: 12 },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40 },
    demoTag: { backgroundColor: t.accent.purple + '30', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, alignSelf: 'center', marginBottom: 12 },
    demoTagText: { color: t.accent.purple, fontSize: 11, fontWeight: '700' },
    alreadyAdded: { color: t.text.muted, fontSize: 11, fontWeight: '600' },
  }), [t]);

  // --- Tab: My Shortcuts ---

  const renderMyShortcuts = () => (
    <>
      <Text style={st.section}>Your Shortcuts</Text>
      <Text style={st.countText}>{shortcuts.length} of 12 slots used</Text>

      {/* Grid preview */}
      <View style={st.grid}>
        {shortcuts.map(s => (
          <View key={s.id} style={st.gridItem}>
            <Text style={st.gridIcon}>{s.icon}</Text>
            <Text style={st.gridLabel} numberOfLines={1}>{s.label}</Text>
          </View>
        ))}
      </View>

      <Text style={st.section}>Reorder & Remove</Text>

      {shortcuts.map((s, idx) => (
        <View key={s.id} style={st.listItem}>
          <Text style={st.listIcon}>{s.icon}</Text>
          <View style={st.listContent}>
            <Text style={st.listLabel}>{s.label}</Text>
            <Text style={st.listCategory}>{s.category}</Text>
          </View>
          <View style={st.listActions}>
            <TouchableOpacity style={st.moveBtn} onPress={() => moveUp(idx)}>
              <Text style={st.moveBtnText}>{'\u2191'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.moveBtn} onPress={() => moveDown(idx)}>
              <Text style={st.moveBtnText}>{'\u2193'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.removeBtn} onPress={() => removeShortcut(s.id)}>
              <Text style={st.removeBtnText}>{'\u2212'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <TouchableOpacity style={st.resetBtn} onPress={resetToDefaults}>
        <Text style={st.resetText}>Reset to Persona Defaults</Text>
      </TouchableOpacity>
    </>
  );

  // --- Tab: Add ---

  const renderAdd = () => (
    <>
      <Text style={st.section}>Browse by Category</Text>
      {Object.entries(SCREEN_CATEGORIES).map(([category, items]) => (
        <View key={category}>
          <TouchableOpacity
            style={st.catHeader}
            onPress={() => setExpandedCategory(expandedCategory === category ? null : category)}
          >
            <Text style={st.catHeaderText}>{category} ({items.length})</Text>
            <Text style={st.catChevron}>{expandedCategory === category ? '\u25B2' : '\u25BC'}</Text>
          </TouchableOpacity>
          {expandedCategory === category && (
            <View style={st.catItems}>
              {items.map(item => {
                const alreadyAdded = shortcutIds.has(item.id);
                return (
                  <View key={item.id} style={st.listItem}>
                    <Text style={st.listIcon}>{item.icon}</Text>
                    <View style={st.listContent}>
                      <Text style={st.listLabel}>{item.label}</Text>
                      <Text style={st.listCategory}>{item.screen}</Text>
                    </View>
                    {alreadyAdded ? (
                      <Text style={st.alreadyAdded}>Added</Text>
                    ) : (
                      <TouchableOpacity style={st.addBtn} onPress={() => addShortcut(item)}>
                        <Text style={st.addBtnText}>+</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      ))}
    </>
  );

  // --- Tab: Suggested ---

  const renderSuggested = () => (
    <>
      <Text style={st.section}>Suggested for You</Text>
      {DEMO_SUGGESTIONS.map(s => {
        const alreadyAdded = shortcutIds.has(s.id);
        return (
          <View key={s.id} style={st.suggestCard}>
            <Text style={st.suggestIcon}>{s.icon}</Text>
            <View style={st.suggestContent}>
              <Text style={st.suggestLabel}>{s.label}</Text>
              <Text style={st.suggestReason}>{s.reason}</Text>
              {s.usageCount > 0 && (
                <Text style={st.suggestUsage}>{s.usageCount} uses recently</Text>
              )}
            </View>
            {alreadyAdded ? (
              <Text style={st.alreadyAdded}>Added</Text>
            ) : (
              <TouchableOpacity style={st.addBtn} onPress={() => addShortcut(s)}>
                <Text style={st.addBtnText}>+</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </>
  );

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'my-shortcuts', label: 'My Shortcuts' },
    { key: 'add', label: 'Add' },
    { key: 'suggested', label: 'Suggested' },
  ];

  return (
    <SafeAreaView style={st.container}>
      {/* Header */}
      <View style={st.header}>
        <Text style={st.headerTitle}>Shortcuts</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeText}>Close</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={st.tabRow}>
        {TABS.map(t2 => (
          <TouchableOpacity
            key={t2.key}
            style={[st.tab, tab === t2.key && st.tabActive]}
            onPress={() => setTab(t2.key)}
          >
            <Text style={[st.tabText, tab === t2.key && st.tabTextActive]}>{t2.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={st.scroll}>
        {demoMode && (
          <View style={st.demoTag}>
            <Text style={st.demoTagText}>DEMO MODE</Text>
          </View>
        )}

        {tab === 'my-shortcuts' && renderMyShortcuts()}
        {tab === 'add' && renderAdd()}
        {tab === 'suggested' && renderSuggested()}
      </ScrollView>
    </SafeAreaView>
  );
}
