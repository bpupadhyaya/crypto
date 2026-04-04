import { fonts } from '../utils/theme';
/**
 * Repair Cafe Screen — Community repair events, fix-it culture, reduce waste.
 *
 * Article I: "Every act of repair is an act of care for people and planet."
 * xOTK represents exchange-of-skill value.
 *
 * Features:
 * - Upcoming repair cafes (dates, locations, types: electronics, clothing, furniture, bikes, appliances)
 * - Bring an item — describe what needs fixing, get matched with a repairer
 * - Repair volunteers — register repair skills, earn xOTK for repairs
 * - Repair stats (items fixed, waste diverted kg, money saved)
 * - Repair guides — community-written how-to guides for common fixes
 * - Demo mode with sample data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface RepairEvent {
  id: string;
  title: string;
  location: string;
  date: string;
  time: string;
  types: string[];
  volunteersCount: number;
  spotsLeft: number;
  xotkReward: number;
}

interface FixRequest {
  id: string;
  itemName: string;
  category: string;
  description: string;
  status: 'open' | 'matched' | 'fixed';
  matchedVolunteer?: string;
  xotkOffered: number;
  submittedDate: string;
}

interface RepairVolunteer {
  id: string;
  name: string;
  skills: string[];
  itemsFixed: number;
  xotkEarned: number;
  rating: number;
  available: boolean;
}

interface RepairGuide {
  id: string;
  title: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  author: string;
  views: number;
  steps: number;
  estimatedTime: string;
}

interface RepairStats {
  totalItemsFixed: number;
  wasteDivertedKg: number;
  moneySaved: number;
  totalVolunteers: number;
  totalEvents: number;
  xotkDistributed: number;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const REPAIR_CATEGORIES = [
  { key: 'electronics', label: 'Electronics', icon: 'E' },
  { key: 'clothing', label: 'Clothing', icon: 'C' },
  { key: 'furniture', label: 'Furniture', icon: 'F' },
  { key: 'bikes', label: 'Bikes', icon: 'B' },
  { key: 'appliances', label: 'Appliances', icon: 'A' },
  { key: 'toys', label: 'Toys', icon: 'T' },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: '#34C759',
  intermediate: '#FF9500',
  advanced: '#FF3B30',
};

// ─── Demo Data ───

const DEMO_STATS: RepairStats = {
  totalItemsFixed: 1847,
  wasteDivertedKg: 4620,
  moneySaved: 92400,
  totalVolunteers: 156,
  totalEvents: 84,
  xotkDistributed: 184700,
};

const DEMO_EVENTS: RepairEvent[] = [
  {
    id: 'e1', title: 'Spring Fix-It Fair', location: 'Community Center, Maple Ave',
    date: '2026-04-05', time: '10:00 AM - 3:00 PM',
    types: ['electronics', 'clothing', 'appliances'], volunteersCount: 12, spotsLeft: 5, xotkReward: 150,
  },
  {
    id: 'e2', title: 'Bike Repair Workshop', location: 'Riverside Park Pavilion',
    date: '2026-04-12', time: '9:00 AM - 1:00 PM',
    types: ['bikes'], volunteersCount: 6, spotsLeft: 3, xotkReward: 120,
  },
];

const DEMO_VOLUNTEERS: RepairVolunteer[] = [
  { id: 'v1', name: 'openchain1abc...fixer_maya', skills: ['electronics', 'appliances'], itemsFixed: 89, xotkEarned: 12400, rating: 4.9, available: true },
  { id: 'v2', name: 'openchain1def...tailor_jin', skills: ['clothing'], itemsFixed: 134, xotkEarned: 18200, rating: 4.8, available: true },
  { id: 'v3', name: 'openchain1ghi...woodwork_sam', skills: ['furniture', 'toys'], itemsFixed: 56, xotkEarned: 7800, rating: 4.7, available: false },
  { id: 'v4', name: 'openchain1jkl...bike_alex', skills: ['bikes'], itemsFixed: 212, xotkEarned: 28600, rating: 5.0, available: true },
];

const DEMO_GUIDES: RepairGuide[] = [
  { id: 'g1', title: 'Fix a Broken Zipper', category: 'clothing', difficulty: 'beginner', author: 'tailor_jin', views: 2340, steps: 6, estimatedTime: '15 min' },
  { id: 'g2', title: 'Replace a Laptop Screen', category: 'electronics', difficulty: 'advanced', author: 'fixer_maya', views: 1890, steps: 12, estimatedTime: '45 min' },
  { id: 'g3', title: 'Patch a Bike Inner Tube', category: 'bikes', difficulty: 'beginner', author: 'bike_alex', views: 3120, steps: 8, estimatedTime: '20 min' },
];

const DEMO_FIX_REQUESTS: FixRequest[] = [
  { id: 'f1', itemName: 'Toaster', category: 'appliances', description: 'Won\'t heat on one side', status: 'matched', matchedVolunteer: 'fixer_maya', xotkOffered: 50, submittedDate: '2026-03-27' },
  { id: 'f2', itemName: 'Winter Jacket', category: 'clothing', description: 'Torn seam on left sleeve', status: 'open', xotkOffered: 30, submittedDate: '2026-03-28' },
];

type Tab = 'events' | 'fix' | 'volunteer' | 'guides';

export function RepairCafeScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('events');
  const [fixItemName, setFixItemName] = useState('');
  const [fixCategory, setFixCategory] = useState('');
  const [fixDescription, setFixDescription] = useState('');
  const [mySkills, setMySkills] = useState<string[]>([]);
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const stats = DEMO_STATS;
  const events = DEMO_EVENTS;
  const volunteers = DEMO_VOLUNTEERS;
  const guides = DEMO_GUIDES;
  const fixRequests = DEMO_FIX_REQUESTS;

  const handleSubmitFixRequest = useCallback(() => {
    if (!fixItemName.trim()) { Alert.alert('Required', 'Enter the item name.'); return; }
    if (!fixCategory) { Alert.alert('Required', 'Select a category.'); return; }
    if (!fixDescription.trim()) { Alert.alert('Required', 'Describe what needs fixing.'); return; }

    Alert.alert(
      'Request Submitted',
      `Your "${fixItemName}" repair request has been posted.\nWe'll match you with a skilled repairer.`,
    );
    setFixItemName('');
    setFixCategory('');
    setFixDescription('');
    setTab('events');
  }, [fixItemName, fixCategory, fixDescription]);

  const handleRegisterVolunteer = useCallback(() => {
    if (mySkills.length === 0) { Alert.alert('Required', 'Select at least one repair skill.'); return; }

    Alert.alert(
      'Registered!',
      `You're now a repair volunteer for: ${mySkills.join(', ')}.\nYou'll earn xOTK for every item you fix.`,
    );
    setMySkills([]);
  }, [mySkills]);

  const toggleSkill = useCallback((skill: string) => {
    setMySkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.green + '20' },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.green },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    // Stats banner
    statsBanner: { backgroundColor: t.accent.green + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' },
    statItem: { alignItems: 'center', width: '33%', marginBottom: 12 },
    statValue: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2, textAlign: 'center' },
    // Events
    eventCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    eventTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    eventMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    eventTypes: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    eventTypeChip: { backgroundColor: t.accent.blue + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    eventTypeText: { color: t.accent.blue, fontSize: fonts.xs, fontWeight: fonts.semibold },
    eventFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    eventReward: { color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.bold },
    eventAttend: { backgroundColor: t.accent.green, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    eventAttendText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.semibold },
    // Fix request
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md, marginBottom: 12 },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    categoryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: t.bg.primary },
    categoryChipSelected: { backgroundColor: t.accent.green + '20', borderColor: t.accent.green },
    categoryChipText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    categoryChipTextSelected: { color: t.accent.green },
    submitBtn: { backgroundColor: t.accent.green, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    // Fix request list
    fixRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    fixIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: t.accent.orange + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    fixIconText: { color: t.accent.orange, fontSize: fonts.md, fontWeight: fonts.bold },
    fixInfo: { flex: 1 },
    fixName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    fixMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    fixStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    fixStatusText: { fontSize: fonts.xs, fontWeight: fonts.bold },
    // Volunteers
    volunteerCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    volunteerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    volunteerName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold, flex: 1 },
    volunteerAvail: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    volunteerAvailText: { fontSize: fonts.xs, fontWeight: fonts.bold },
    volunteerSkills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    skillTag: { backgroundColor: t.accent.blue + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    skillTagText: { color: t.accent.blue, fontSize: fonts.xs, fontWeight: fonts.semibold },
    volunteerStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    volunteerStatText: { color: t.text.muted, fontSize: fonts.sm },
    volunteerStatBold: { color: t.text.primary, fontWeight: fonts.bold },
    registerSection: { backgroundColor: t.accent.green + '08', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    registerTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, marginBottom: 12 },
    // Guides
    guideCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    guideTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    guideMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    guideDifficulty: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 8, alignSelf: 'flex-start' },
    guideDifficultyText: { fontSize: fonts.xs, fontWeight: fonts.bold },
    guideFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    guideViews: { color: t.text.muted, fontSize: fonts.sm },
    guideOpen: { backgroundColor: t.accent.blue, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
    guideOpenText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.semibold },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.bold },
  }), [t]);

  // ─── Tabs ───

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'events', label: 'Events' },
    { key: 'fix', label: 'Fix My Item' },
    { key: 'volunteer', label: 'Volunteer' },
    { key: 'guides', label: 'Guides' },
  ];

  // ─── Events Tab ───

  const renderEvents = () => (
    <>
      {/* Stats Banner */}
      <View style={s.statsBanner}>
        <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Community Repair Impact</Text>
        <View style={s.statsGrid}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{stats.totalItemsFixed.toLocaleString()}</Text>
            <Text style={s.statLabel}>Items Fixed</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statValue}>{stats.wasteDivertedKg.toLocaleString()}</Text>
            <Text style={s.statLabel}>Waste Diverted (kg)</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.green }]}>${stats.moneySaved.toLocaleString()}</Text>
            <Text style={s.statLabel}>Money Saved</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statValue}>{stats.totalVolunteers}</Text>
            <Text style={s.statLabel}>Volunteers</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statValue}>{stats.totalEvents}</Text>
            <Text style={s.statLabel}>Events Held</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.green }]}>{stats.xotkDistributed.toLocaleString()}</Text>
            <Text style={s.statLabel}>xOTK Distributed</Text>
          </View>
        </View>
      </View>

      <Text style={s.sectionTitle}>Upcoming Repair Cafes</Text>
      {events.map((ev) => (
        <View key={ev.id} style={s.eventCard}>
          <Text style={s.eventTitle}>{ev.title}</Text>
          <Text style={s.eventMeta}>{ev.date} | {ev.time}</Text>
          <Text style={s.eventMeta}>{ev.location}</Text>
          <View style={s.eventTypes}>
            {ev.types.map((type) => (
              <View key={type} style={s.eventTypeChip}>
                <Text style={s.eventTypeText}>{type}</Text>
              </View>
            ))}
          </View>
          <View style={s.eventFooter}>
            <View>
              <Text style={s.eventReward}>{ev.xotkReward} xOTK reward</Text>
              <Text style={s.eventMeta}>{ev.volunteersCount} volunteers | {ev.spotsLeft} spots left</Text>
            </View>
            <TouchableOpacity
              style={s.eventAttend}
              onPress={() => Alert.alert('RSVP', `You're signed up for "${ev.title}"!\nBring items that need fixing.`)}
            >
              <Text style={s.eventAttendText}>Attend</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </>
  );

  // ─── Fix My Item Tab ───

  const renderFix = () => (
    <>
      <View style={s.card}>
        <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Submit a Repair Request</Text>

        <TextInput
          style={s.input}
          placeholder="Item name (e.g., Blender, Jeans)"
          placeholderTextColor={t.text.muted}
          value={fixItemName}
          onChangeText={setFixItemName}
        />

        <Text style={[s.fixMeta, { marginBottom: 6 }]}>Category</Text>
        <View style={s.categoryGrid}>
          {REPAIR_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[s.categoryChip, fixCategory === cat.key && s.categoryChipSelected]}
              onPress={() => setFixCategory(cat.key)}
            >
              <Text style={[s.categoryChipText, fixCategory === cat.key && s.categoryChipTextSelected]}>
                {cat.icon} {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={[s.input, { height: 80, textAlignVertical: 'top' }]}
          placeholder="Describe what needs fixing..."
          placeholderTextColor={t.text.muted}
          value={fixDescription}
          onChangeText={setFixDescription}
          multiline
        />

        <TouchableOpacity style={s.submitBtn} onPress={handleSubmitFixRequest}>
          <Text style={s.submitText}>Submit Request</Text>
        </TouchableOpacity>
      </View>

      {fixRequests.length > 0 && (
        <View style={s.card}>
          <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>My Requests</Text>
          {fixRequests.map((req) => {
            const statusColor = req.status === 'fixed' ? t.accent.green
              : req.status === 'matched' ? t.accent.blue
              : t.accent.orange;
            return (
              <View key={req.id} style={s.fixRow}>
                <View style={s.fixIcon}>
                  <Text style={s.fixIconText}>
                    {REPAIR_CATEGORIES.find((c) => c.key === req.category)?.icon || '?'}
                  </Text>
                </View>
                <View style={s.fixInfo}>
                  <Text style={s.fixName}>{req.itemName}</Text>
                  <Text style={s.fixMeta}>{req.description}</Text>
                  {req.matchedVolunteer && (
                    <Text style={[s.fixMeta, { color: t.accent.blue }]}>Repairer: {req.matchedVolunteer}</Text>
                  )}
                </View>
                <View style={[s.fixStatus, { backgroundColor: statusColor + '20' }]}>
                  <Text style={[s.fixStatusText, { color: statusColor }]}>{req.status.toUpperCase()}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </>
  );

  // ─── Volunteer Tab ───

  const renderVolunteer = () => (
    <>
      <View style={s.registerSection}>
        <Text style={s.registerTitle}>Register as a Repair Volunteer</Text>
        <Text style={[s.fixMeta, { marginBottom: 8 }]}>Select your repair skills to get matched with items</Text>
        <View style={s.categoryGrid}>
          {REPAIR_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[s.categoryChip, mySkills.includes(cat.key) && s.categoryChipSelected]}
              onPress={() => toggleSkill(cat.key)}
            >
              <Text style={[s.categoryChipText, mySkills.includes(cat.key) && s.categoryChipTextSelected]}>
                {cat.icon} {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={s.submitBtn} onPress={handleRegisterVolunteer}>
          <Text style={s.submitText}>Register & Start Earning xOTK</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.sectionTitle}>Active Repair Volunteers</Text>
      {volunteers.map((vol) => (
        <View key={vol.id} style={s.volunteerCard}>
          <View style={s.volunteerHeader}>
            <Text style={s.volunteerName} numberOfLines={1}>{vol.name}</Text>
            <View style={[s.volunteerAvail, { backgroundColor: vol.available ? t.accent.green + '20' : t.text.muted + '20' }]}>
              <Text style={[s.volunteerAvailText, { color: vol.available ? t.accent.green : t.text.muted }]}>
                {vol.available ? 'AVAILABLE' : 'BUSY'}
              </Text>
            </View>
          </View>
          <View style={s.volunteerSkills}>
            {vol.skills.map((sk) => (
              <View key={sk} style={s.skillTag}>
                <Text style={s.skillTagText}>{sk}</Text>
              </View>
            ))}
          </View>
          <View style={s.volunteerStats}>
            <Text style={s.volunteerStatText}>
              Fixed: <Text style={s.volunteerStatBold}>{vol.itemsFixed}</Text>
            </Text>
            <Text style={s.volunteerStatText}>
              xOTK: <Text style={[s.volunteerStatBold, { color: t.accent.green }]}>{vol.xotkEarned.toLocaleString()}</Text>
            </Text>
            <Text style={s.volunteerStatText}>
              Rating: <Text style={s.volunteerStatBold}>{vol.rating}/5</Text>
            </Text>
          </View>
        </View>
      ))}
    </>
  );

  // ─── Guides Tab ───

  const renderGuides = () => (
    <>
      <Text style={s.sectionTitle}>Community Repair Guides</Text>
      {guides.map((guide) => {
        const diffColor = DIFFICULTY_COLORS[guide.difficulty] || t.text.muted;
        return (
          <View key={guide.id} style={s.guideCard}>
            <Text style={s.guideTitle}>{guide.title}</Text>
            <Text style={s.guideMeta}>
              By {guide.author} | {guide.steps} steps | {guide.estimatedTime}
            </Text>
            <View style={[s.guideDifficulty, { backgroundColor: diffColor + '20' }]}>
              <Text style={[s.guideDifficultyText, { color: diffColor }]}>
                {guide.difficulty.toUpperCase()}
              </Text>
            </View>
            <View style={s.guideFooter}>
              <Text style={s.guideViews}>{guide.views.toLocaleString()} views</Text>
              <TouchableOpacity
                style={s.guideOpen}
                onPress={() => Alert.alert(guide.title, `${guide.steps}-step repair guide.\nDifficulty: ${guide.difficulty}\nEstimated time: ${guide.estimatedTime}`)}
              >
                <Text style={s.guideOpenText}>Open Guide</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      <TouchableOpacity
        style={[s.submitBtn, { marginHorizontal: 20 }]}
        onPress={() => Alert.alert('Write a Guide', 'Share your repair knowledge with the community.\nEarn xOTK for every guide you publish.')}
      >
        <Text style={s.submitText}>Write a Repair Guide</Text>
      </TouchableOpacity>
    </>
  );

  // ─── Render ───

  const renderContent = () => {
    switch (tab) {
      case 'events': return renderEvents();
      case 'fix': return renderFix();
      case 'volunteer': return renderVolunteer();
      case 'guides': return renderGuides();
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Repair Cafe</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      {demoMode && (
        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO DATA</Text>
        </View>
      )}

      <View style={s.tabRow}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[s.tabBtn, tab === t.key && s.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}
