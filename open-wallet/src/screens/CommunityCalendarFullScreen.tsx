import { fonts } from '../utils/theme';
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

type Tab = 'year' | 'month' | 'categories';

interface Props {
  onClose: () => void;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  category: string;
  description: string;
  otkReward: number;
  participants: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CATEGORIES = [
  { id: 'nurture', label: 'Nurture', color: '#4CAF50' },
  { id: 'education', label: 'Education', color: '#2196F3' },
  { id: 'eldercare', label: 'Eldercare', color: '#9C27B0' },
  { id: 'peace', label: 'Peace', color: '#FF9800' },
  { id: 'governance', label: 'Governance', color: '#F44336' },
  { id: 'open-source', label: 'Open Source', color: '#00BCD4' },
];

const DEMO_EVENTS: CalendarEvent[] = [
  { id: '1', title: 'Global Nurture Day', date: '2026-04-15', category: 'nurture', description: 'Worldwide celebration of caregiving and child development contributions.', otkReward: 100, participants: 5200 },
  { id: '2', title: 'Open Chain Hackathon', date: '2026-04-22', category: 'open-source', description: 'Build new features for Open Wallet and Open Chain. Top contributors earn bounties.', otkReward: 500, participants: 340 },
  { id: '3', title: 'Elder Wisdom Week', date: '2026-05-01', category: 'eldercare', description: 'A week dedicated to recording and sharing elder stories across communities.', otkReward: 200, participants: 1800 },
  { id: '4', title: 'Peace Ambassador Summit', date: '2026-05-10', category: 'peace', description: 'Annual gathering of peace ambassadors to share progress and set goals.', otkReward: 300, participants: 890 },
  { id: '5', title: 'Community Governance Vote', date: '2026-06-01', category: 'governance', description: 'Quarterly governance vote on protocol improvements and fund allocation.', otkReward: 50, participants: 12400 },
  { id: '6', title: 'Youth Education Festival', date: '2026-06-15', category: 'education', description: 'Showcase of educational projects funded and supported by OTK community.', otkReward: 150, participants: 2100 },
  { id: '7', title: 'Intergenerational Bridge Day', date: '2026-07-04', category: 'nurture', description: 'Connecting young and old through shared activities and mutual learning.', otkReward: 120, participants: 3400 },
  { id: '8', title: 'Open Wallet v2 Launch', date: '2026-08-01', category: 'open-source', description: 'Major release with P2P validation and hardware wallet support.', otkReward: 250, participants: 8900 },
];

export function CommunityCalendarFullScreen({ onClose }: Props) {
  const t = useTheme();
  const { demoMode } = useWalletStore();
  const [activeTab, setActiveTab] = useState<Tab>('year');
  const [selectedMonth, setSelectedMonth] = useState(3);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: t.bg.primary },
        header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.border },
        headerTitle: { fontSize: fonts.xl, fontWeight: fonts.bold, color: t.text.primary },
        closeButton: { padding: 8 },
        closeText: { fontSize: fonts.lg, color: t.accent.green },
        tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: t.border },
        tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
        activeTab: { borderBottomWidth: 2, borderBottomColor: t.accent.green },
        tabText: { fontSize: fonts.md, color: t.text.secondary },
        activeTabText: { color: t.accent.green, fontWeight: fonts.semibold },
        content: { flex: 1 },
        yearGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12 },
        monthCell: { width: '25%', padding: 8, alignItems: 'center' },
        monthBox: { width: '100%', paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: t.border, backgroundColor: t.bg.card, alignItems: 'center' },
        monthBoxSelected: { borderColor: t.accent.green, backgroundColor: t.accent.green + '15' },
        monthLabel: { fontSize: fonts.md, fontWeight: fonts.semibold, color: t.text.primary, marginBottom: 4 },
        monthCount: { fontSize: fonts.xs, color: t.text.secondary },
        eventCard: { marginHorizontal: 16, marginTop: 12, padding: 14, backgroundColor: t.bg.card, borderRadius: 12, borderWidth: 1, borderColor: t.border },
        eventHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
        eventTitle: { fontSize: fonts.md, fontWeight: fonts.bold, color: t.text.primary, flex: 1 },
        eventDate: { fontSize: fonts.sm, color: t.text.secondary },
        eventDescription: { fontSize: fonts.sm, color: t.text.secondary, lineHeight: 18, marginBottom: 8 },
        eventFooter: { flexDirection: 'row', justifyContent: 'space-between' },
        eventCategory: { fontSize: fonts.xs, fontWeight: fonts.semibold, textTransform: 'uppercase' },
        eventStats: { fontSize: fonts.sm, color: t.text.secondary },
        otkReward: { fontSize: fonts.sm, fontWeight: fonts.semibold, color: t.accent.green },
        categoryRow: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8 },
        categoryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: t.border },
        categoryChipSelected: { borderWidth: 2 },
        categoryChipText: { fontSize: fonts.sm, fontWeight: fonts.semibold },
        sectionLabel: { fontSize: fonts.md, fontWeight: fonts.semibold, color: t.text.secondary, marginHorizontal: 16, marginTop: 16, marginBottom: 4 },
        emptyState: { margin: 16, padding: 20, backgroundColor: t.bg.card, borderRadius: 12, alignItems: 'center' },
        emptyText: { fontSize: fonts.sm, color: t.text.secondary },
        listFooter: { height: 32 },
      }),
    [t],
  );

  const events = demoMode ? DEMO_EVENTS : [];

  const eventsForMonth = useMemo(
    () => events.filter((e) => new Date(e.date).getMonth() === selectedMonth),
    [events, selectedMonth],
  );

  const eventsForCategory = useMemo(
    () => (selectedCategory ? events.filter((e) => e.category === selectedCategory) : events),
    [events, selectedCategory],
  );

  const monthEventCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    events.forEach((e) => {
      const m = new Date(e.date).getMonth();
      counts[m] = (counts[m] || 0) + 1;
    });
    return counts;
  }, [events]);

  const renderEvent = useCallback(
    ({ item }: { item: CalendarEvent }) => {
      const cat = CATEGORIES.find((c) => c.id === item.category);
      return (
        <View style={styles.eventCard}>
          <View style={styles.eventHeader}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text style={styles.eventDate}>{item.date}</Text>
          </View>
          <Text style={styles.eventDescription}>{item.description}</Text>
          <View style={styles.eventFooter}>
            <Text style={[styles.eventCategory, { color: cat?.color || t.accent.green }]}>{item.category}</Text>
            <Text style={styles.otkReward}>{item.otkReward} OTK reward</Text>
            <Text style={styles.eventStats}>{item.participants.toLocaleString()} joined</Text>
          </View>
        </View>
      );
    },
    [styles, t],
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'year':
        return (
          <ScrollView>
            <Text style={styles.sectionLabel}>2026 Overview</Text>
            <View style={styles.yearGrid}>
              {MONTHS.map((label, idx) => (
                <TouchableOpacity key={label} style={styles.monthCell} onPress={() => { setSelectedMonth(idx); setActiveTab('month'); }}>
                  <View style={[styles.monthBox, selectedMonth === idx && styles.monthBoxSelected]}>
                    <Text style={styles.monthLabel}>{label}</Text>
                    <Text style={styles.monthCount}>{monthEventCounts[idx] || 0} events</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        );

      case 'month':
        return (
          <FlatList
            data={eventsForMonth}
            keyExtractor={(item) => item.id}
            renderItem={renderEvent}
            ListHeaderComponent={<Text style={styles.sectionLabel}>{MONTHS[selectedMonth]} 2026</Text>}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No events scheduled for {MONTHS[selectedMonth]}</Text>
              </View>
            }
            ListFooterComponent={<View style={styles.listFooter} />}
          />
        );

      case 'categories':
        return (
          <ScrollView>
            <Text style={styles.sectionLabel}>Filter by Category</Text>
            <View style={styles.categoryRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity key={cat.id} style={[styles.categoryChip, selectedCategory === cat.id && styles.categoryChipSelected, { borderColor: cat.color }]} onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}>
                  <Text style={[styles.categoryChipText, { color: cat.color }]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.sectionLabel}>{selectedCategory ? `${selectedCategory} events` : 'All Events'}</Text>
            {eventsForCategory.map((item) => {
              const cat = CATEGORIES.find((c) => c.id === item.category);
              return (
                <View key={item.id} style={styles.eventCard}>
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventTitle}>{item.title}</Text>
                    <Text style={styles.eventDate}>{item.date}</Text>
                  </View>
                  <Text style={styles.eventDescription}>{item.description}</Text>
                  <View style={styles.eventFooter}>
                    <Text style={[styles.eventCategory, { color: cat?.color || t.accent.green }]}>{item.category}</Text>
                    <Text style={styles.otkReward}>{item.otkReward} OTK</Text>
                  </View>
                </View>
              );
            })}
            <View style={styles.listFooter} />
          </ScrollView>
        );
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'year', label: 'Year' },
    { key: 'month', label: 'Month' },
    { key: 'categories', label: 'Categories' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community Calendar</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity key={tab.key} style={[styles.tab, activeTab === tab.key && styles.activeTab]} onPress={() => setActiveTab(tab.key)}>
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.content}>{renderContent()}</View>
    </SafeAreaView>
  );
}
