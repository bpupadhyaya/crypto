/**
 * Notification Center Screen — Art I: Unified notification hub.
 *
 * Aggregates alerts from all 255 screens into a single stream.
 * Categories: transactions, governance, community, health, safety, social, system.
 * Supports filtering, read/unread tracking, priority indicators,
 * actionable links, and per-category preference toggles.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Switch,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// --- Types ---

type NotificationCategory =
  | 'transactions'
  | 'governance'
  | 'community'
  | 'health'
  | 'safety'
  | 'social'
  | 'system';

type NotificationPriority = 'urgent' | 'important' | 'normal' | 'info';

interface NotificationAction {
  label: string;
  target: string; // screen name
}

interface Notification {
  id: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body: string;
  timestamp: number; // epoch ms
  read: boolean;
  action?: NotificationAction;
}

type TabKey = 'all' | 'unread' | 'settings';

const CATEGORY_ICONS: Record<NotificationCategory, string> = {
  transactions: '\u{1F4B8}', // money with wings
  governance:   '\u{1F3DB}', // classical building
  community:    '\u{1F91D}', // handshake
  health:       '\u{1F49A}', // green heart
  safety:       '\u{1F6E1}', // shield
  social:       '\u{1F465}', // silhouettes
  system:       '\u2699\uFE0F', // gear
};

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  transactions: 'Transactions',
  governance:   'Governance',
  community:    'Community',
  health:       'Health',
  safety:       'Safety',
  social:       'Social',
  system:       'System',
};

const PRIORITY_COLORS: Record<NotificationPriority, string> = {
  urgent:    '#FF3B30',
  important: '#FF9500',
  normal:    '#007AFF',
  info:      '#8E8E93',
};

const ALL_CATEGORIES: NotificationCategory[] = [
  'transactions', 'governance', 'community', 'health', 'safety', 'social', 'system',
];

// --- Demo data ---

const NOW = Date.now();
const HOUR = 3_600_000;

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: 'n_001', category: 'transactions', priority: 'normal',
    title: 'OTK Received', body: 'You received 50 OTK from Community Builder reward.',
    timestamp: NOW - HOUR * 0.5, read: false,
  },
  {
    id: 'n_002', category: 'governance', priority: 'important',
    title: 'Proposal #42 — Vote Open', body: 'Education funding reallocation proposal needs your vote. Closes in 48 hours.',
    timestamp: NOW - HOUR * 2, read: false,
    action: { label: 'Vote Now', target: 'GovernanceScreen' },
  },
  {
    id: 'n_003', category: 'community', priority: 'normal',
    title: 'Neighborhood Meetup', body: 'Saturday potluck at Elm Park. 12 neighbors have RSVPed.',
    timestamp: NOW - HOUR * 5, read: false,
    action: { label: 'RSVP', target: 'CalendarScreen' },
  },
  {
    id: 'n_004', category: 'health', priority: 'info',
    title: 'Wellness Reminder', body: 'Your annual health checkup is due next month. Schedule with your local clinic.',
    timestamp: NOW - HOUR * 12, read: true,
  },
  {
    id: 'n_005', category: 'safety', priority: 'urgent',
    title: 'Login from New Device', body: 'A login was detected from a new device in Portland, OR. If this was not you, secure your account immediately.',
    timestamp: NOW - HOUR * 18, read: true,
    action: { label: 'Review', target: 'SecurityScreen' },
  },
  {
    id: 'n_006', category: 'social', priority: 'normal',
    title: 'Gratitude Received', body: 'Maria S. sent you a gratitude note: "Thank you for tutoring my daughter."',
    timestamp: NOW - HOUR * 24, read: true,
  },
  {
    id: 'n_007', category: 'system', priority: 'info',
    title: 'App Update Available', body: 'Open Wallet v1.3.0 is available with improved P2P sync and new screens.',
    timestamp: NOW - HOUR * 36, read: true,
  },
  {
    id: 'n_008', category: 'transactions', priority: 'important',
    title: 'Bridge Transfer Complete', body: 'Your 200 USDC bridge transfer from Ethereum to Open Chain has completed successfully.',
    timestamp: NOW - HOUR * 48, read: true,
  },
];

// --- Helpers ---

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// --- Component ---

interface Props {
  onClose: () => void;
}

export function NotificationCenterScreen({ onClose }: Props) {
  const t = useTheme();
  const demoMode = useWalletStore((s) => s.demoMode);

  const [tab, setTab] = useState<TabKey>('all');
  const [notifications, setNotifications] = useState<Notification[]>(DEMO_NOTIFICATIONS);
  const [filterCategory, setFilterCategory] = useState<NotificationCategory | null>(null);
  const [preferences, setPreferences] = useState<Record<NotificationCategory, boolean>>(
    () => Object.fromEntries(ALL_CATEGORIES.map(c => [c, true])) as Record<NotificationCategory, boolean>,
  );

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const displayed = useMemo(() => {
    let list = notifications;
    if (tab === 'unread') list = list.filter(n => !n.read);
    if (filterCategory) list = list.filter(n => n.category === filterCategory);
    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [notifications, tab, filterCategory]);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const togglePreference = useCallback((cat: NotificationCategory) => {
    setPreferences(prev => ({ ...prev, [cat]: !prev[cat] }));
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
    badge: { backgroundColor: '#FF3B30', borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1, marginLeft: 4 },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
    filterRow: { flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
    filterChip: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8, backgroundColor: t.border },
    filterChipActive: { backgroundColor: t.accent.blue },
    filterChipText: { color: t.text.secondary, fontSize: 11, fontWeight: '600' },
    filterChipTextActive: { color: '#fff' },
    actionBar: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 12 },
    actionBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: t.bg.card },
    actionBtnText: { color: t.accent.blue, fontSize: 12, fontWeight: '600' },
    card: { backgroundColor: t.bg.card, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', gap: 12 },
    cardUnread: { borderLeftWidth: 3, borderLeftColor: t.accent.blue },
    priorityDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
    cardContent: { flex: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    cardCategory: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    cardTime: { color: t.text.muted, fontSize: 10 },
    cardTitle: { color: t.text.primary, fontSize: 14, fontWeight: '700', marginBottom: 3 },
    cardBody: { color: t.text.secondary, fontSize: 12, lineHeight: 17, marginBottom: 8 },
    cardActions: { flexDirection: 'row', gap: 10 },
    cardActionBtn: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6, backgroundColor: t.accent.blue },
    cardActionText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    cardDeleteBtn: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6, backgroundColor: t.bg.primary },
    cardDeleteText: { color: '#FF3B30', fontSize: 11, fontWeight: '600' },
    cardMarkBtn: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6, backgroundColor: t.bg.primary },
    cardMarkText: { color: t.accent.blue, fontSize: 11, fontWeight: '600' },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 16, marginBottom: 10, marginLeft: 4 },
    prefRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: t.bg.card, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 8 },
    prefLabel: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    prefIcon: { fontSize: 18, marginRight: 10 },
    prefLeft: { flexDirection: 'row', alignItems: 'center' },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40 },
    demoTag: { backgroundColor: t.accent.purple + '30', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, alignSelf: 'center', marginBottom: 12 },
    demoTagText: { color: t.accent.purple, fontSize: 11, fontWeight: '700' },
  }), [t]);

  // --- Tab renderers ---

  const renderNotification = (n: Notification) => (
    <View key={n.id} style={[st.card, !n.read && st.cardUnread]}>
      <View style={[st.priorityDot, { backgroundColor: PRIORITY_COLORS[n.priority] }]} />
      <View style={st.cardContent}>
        <View style={st.cardHeader}>
          <Text style={[st.cardCategory, { color: PRIORITY_COLORS[n.priority] }]}>
            {CATEGORY_ICONS[n.category]} {CATEGORY_LABELS[n.category]}
          </Text>
          <Text style={st.cardTime}>{timeAgo(n.timestamp)}</Text>
        </View>
        <Text style={st.cardTitle}>{n.title}</Text>
        <Text style={st.cardBody}>{n.body}</Text>
        <View style={st.cardActions}>
          {n.action && (
            <TouchableOpacity style={st.cardActionBtn}>
              <Text style={st.cardActionText}>{n.action.label}</Text>
            </TouchableOpacity>
          )}
          {!n.read && (
            <TouchableOpacity style={st.cardMarkBtn} onPress={() => markRead(n.id)}>
              <Text style={st.cardMarkText}>Mark Read</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={st.cardDeleteBtn} onPress={() => deleteNotification(n.id)}>
            <Text style={st.cardDeleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderList = () => (
    <>
      {/* Category filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <View style={st.filterRow}>
          <TouchableOpacity
            style={[st.filterChip, !filterCategory && st.filterChipActive]}
            onPress={() => setFilterCategory(null)}
          >
            <Text style={[st.filterChipText, !filterCategory && st.filterChipTextActive]}>All</Text>
          </TouchableOpacity>
          {ALL_CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[st.filterChip, filterCategory === cat && st.filterChipActive]}
              onPress={() => setFilterCategory(filterCategory === cat ? null : cat)}
            >
              <Text style={[st.filterChipText, filterCategory === cat && st.filterChipTextActive]}>
                {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Mark all read */}
      {unreadCount > 0 && (
        <View style={st.actionBar}>
          <TouchableOpacity style={st.actionBtn} onPress={markAllRead}>
            <Text style={st.actionBtnText}>Mark All Read ({unreadCount})</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notification list */}
      {displayed.length === 0 ? (
        <Text style={st.emptyText}>No notifications</Text>
      ) : (
        displayed.map(renderNotification)
      )}
    </>
  );

  const renderSettings = () => (
    <>
      <Text style={st.section}>Notification Preferences</Text>
      {ALL_CATEGORIES.map(cat => (
        <View key={cat} style={st.prefRow}>
          <View style={st.prefLeft}>
            <Text style={st.prefIcon}>{CATEGORY_ICONS[cat]}</Text>
            <Text style={st.prefLabel}>{CATEGORY_LABELS[cat]}</Text>
          </View>
          <Switch
            value={preferences[cat]}
            onValueChange={() => togglePreference(cat)}
            trackColor={{ false: t.border, true: t.accent.green + '80' }}
            thumbColor={preferences[cat] ? t.accent.green : t.text.muted}
          />
        </View>
      ))}
    </>
  );

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'settings', label: 'Settings' },
  ];

  return (
    <SafeAreaView style={st.container}>
      {/* Header */}
      <View style={st.header}>
        <Text style={st.headerTitle}>Notifications</Text>
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
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[st.tabText, tab === t2.key && st.tabTextActive]}>{t2.label}</Text>
              {t2.key === 'unread' && unreadCount > 0 && (
                <View style={st.badge}>
                  <Text style={st.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
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

        {tab === 'settings' ? renderSettings() : renderList()}
      </ScrollView>
    </SafeAreaView>
  );
}
