/**
 * Senior Activities Screen — Activities for elderly community members, active aging.
 *
 * Article I (nOTK): "Every dimension of human contribution is valued equally."
 * Companions visiting elders earn nOTK — nurturing the community's wisdom keepers.
 *
 * Features:
 * - Activity categories: social gatherings, gentle exercise, crafts, music, gardening, games, storytelling
 * - Weekly schedule of senior activities
 * - Transportation assistance to activities
 * - Companion matching (volunteers paired with seniors for regular visits)
 * - Health & wellness tracking for seniors (medication reminders, mobility)
 * - nOTK earned by companions visiting elders
 * - Demo: 4 upcoming activities, 2 companions, weekly schedule
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface Props {
  onClose: () => void;
}

interface ActivityCategory {
  key: string;
  label: string;
  icon: string;
  description: string;
}

interface SeniorActivity {
  id: string;
  title: string;
  category: string;
  day: string;
  time: string;
  location: string;
  spotsLeft: number;
  transportAvailable: boolean;
  nOTKReward: number;
}

interface Companion {
  id: string;
  name: string;
  matchedSenior: string;
  visitFrequency: string;
  totalVisits: number;
  nOTKEarned: number;
  nextVisit: string;
  specialties: string[];
}

interface WellnessEntry {
  id: string;
  seniorName: string;
  date: string;
  medication: boolean;
  mobility: 'good' | 'moderate' | 'limited';
  mood: 'great' | 'good' | 'fair' | 'low';
  notes: string;
  checkedBy: string;
}

interface ScheduleDay {
  day: string;
  activities: Array<{ time: string; title: string; category: string }>;
}

// ─── Constants ───

const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  { key: 'social', label: 'Social Gatherings', icon: 'S', description: 'Tea parties, luncheons, and community meetups' },
  { key: 'exercise', label: 'Gentle Exercise', icon: 'E', description: 'Chair yoga, tai chi, walking groups, stretching' },
  { key: 'crafts', label: 'Crafts', icon: 'C', description: 'Knitting circles, painting, pottery, woodworking' },
  { key: 'music', label: 'Music', icon: 'M', description: 'Choir, instrument lessons, music appreciation' },
  { key: 'gardening', label: 'Gardening', icon: 'G', description: 'Community garden plots, flower arranging' },
  { key: 'games', label: 'Games', icon: 'P', description: 'Card games, chess, puzzles, board games' },
  { key: 'storytelling', label: 'Storytelling', icon: 'T', description: 'Oral history, memoir writing, reading circles' },
];

// ─── Demo Data ───

const DEMO_ACTIVITIES: SeniorActivity[] = [
  { id: 'a1', title: 'Morning Tai Chi in the Park', category: 'exercise', day: 'Monday', time: '9:00 AM', location: 'Community Park Pavilion', spotsLeft: 6, transportAvailable: true, nOTKReward: 80 },
  { id: 'a2', title: 'Storytelling Circle: Childhood Memories', category: 'storytelling', day: 'Tuesday', time: '2:00 PM', location: 'Library Meeting Room', spotsLeft: 4, transportAvailable: true, nOTKReward: 120 },
  { id: 'a3', title: 'Watercolor Painting Workshop', category: 'crafts', day: 'Wednesday', time: '10:00 AM', location: 'Senior Center Art Room', spotsLeft: 3, transportAvailable: false, nOTKReward: 100 },
  { id: 'a4', title: 'Community Choir Practice', category: 'music', day: 'Thursday', time: '3:00 PM', location: 'Church Hall', spotsLeft: 8, transportAvailable: true, nOTKReward: 90 },
];

const DEMO_COMPANIONS: Companion[] = [
  {
    id: 'c1', name: 'Emily Parker', matchedSenior: 'Dorothy (age 82)',
    visitFrequency: 'Twice weekly', totalVisits: 47, nOTKEarned: 5640,
    nextVisit: '2026-03-30', specialties: ['Conversation', 'Light Gardening', 'Reading Aloud'],
  },
  {
    id: 'c2', name: 'James Liu', matchedSenior: 'Harold (age 78)',
    visitFrequency: 'Weekly', totalVisits: 23, nOTKEarned: 2760,
    nextVisit: '2026-04-01', specialties: ['Chess', 'Tech Help', 'Walking Partner'],
  },
];

const DEMO_WELLNESS: WellnessEntry[] = [
  { id: 'w1', seniorName: 'Dorothy', date: '2026-03-28', medication: true, mobility: 'moderate', mood: 'great', notes: 'Enjoyed gardening today, walked 15 minutes', checkedBy: 'Emily Parker' },
  { id: 'w2', seniorName: 'Harold', date: '2026-03-28', medication: true, mobility: 'good', mood: 'good', notes: 'Won 2 chess games, appetite is improving', checkedBy: 'James Liu' },
  { id: 'w3', seniorName: 'Dorothy', date: '2026-03-26', medication: true, mobility: 'moderate', mood: 'good', notes: 'Attended painting class, mild knee stiffness', checkedBy: 'Emily Parker' },
  { id: 'w4', seniorName: 'Harold', date: '2026-03-25', medication: false, mobility: 'good', mood: 'fair', notes: 'Missed morning medication — reminder set', checkedBy: 'James Liu' },
];

const DEMO_WEEKLY_SCHEDULE: ScheduleDay[] = [
  { day: 'Monday', activities: [
    { time: '9:00 AM', title: 'Morning Tai Chi', category: 'exercise' },
    { time: '2:00 PM', title: 'Card Games Club', category: 'games' },
  ]},
  { day: 'Tuesday', activities: [
    { time: '10:00 AM', title: 'Garden Club', category: 'gardening' },
    { time: '2:00 PM', title: 'Storytelling Circle', category: 'storytelling' },
  ]},
  { day: 'Wednesday', activities: [
    { time: '10:00 AM', title: 'Watercolor Workshop', category: 'crafts' },
    { time: '3:00 PM', title: 'Walking Group', category: 'exercise' },
  ]},
  { day: 'Thursday', activities: [
    { time: '10:00 AM', title: 'Knitting Circle', category: 'crafts' },
    { time: '3:00 PM', title: 'Community Choir', category: 'music' },
  ]},
  { day: 'Friday', activities: [
    { time: '9:00 AM', title: 'Chair Yoga', category: 'exercise' },
    { time: '1:00 PM', title: 'Chess & Board Games', category: 'games' },
    { time: '3:00 PM', title: 'Social Tea Hour', category: 'social' },
  ]},
  { day: 'Saturday', activities: [
    { time: '10:00 AM', title: 'Intergenerational Music Jam', category: 'music' },
    { time: '2:00 PM', title: 'Memoir Writing Workshop', category: 'storytelling' },
  ]},
  { day: 'Sunday', activities: [
    { time: '11:00 AM', title: 'Community Brunch', category: 'social' },
  ]},
];

// ─── Helpers ───

const MOOD_COLORS: Record<string, string> = {
  great: '#34C759',
  good: '#007AFF',
  fair: '#FF9500',
  low: '#FF3B30',
};

const MOBILITY_LABELS: Record<string, string> = {
  good: 'Good mobility',
  moderate: 'Moderate — some assistance',
  limited: 'Limited — needs support',
};

type Tab = 'activities' | 'companions' | 'wellness' | 'schedule';

// ─── Component ───

export function SeniorActivitiesScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('activities');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const filteredActivities = useMemo(() => {
    if (categoryFilter === 'all') return DEMO_ACTIVITIES;
    return DEMO_ACTIVITIES.filter(a => a.category === categoryFilter);
  }, [categoryFilter]);

  const totalCompanionNOTK = useMemo(() => DEMO_COMPANIONS.reduce((sum, c) => sum + c.nOTKEarned, 0), []);
  const totalVisits = useMemo(() => DEMO_COMPANIONS.reduce((sum, c) => sum + c.totalVisits, 0), []);

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
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: '700' },
    // Hero
    heroCard: { backgroundColor: t.accent.green + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center' },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: '800', textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20, fontStyle: 'italic' },
    // Score
    scoreCard: { backgroundColor: t.bg.secondary, borderRadius: 20, padding: 20, marginHorizontal: 20, marginTop: 16, flexDirection: 'row', justifyContent: 'space-around' },
    scoreItem: { alignItems: 'center' },
    scoreValue: { color: t.accent.green, fontSize: 24, fontWeight: '800' },
    scoreLabel: { color: t.text.muted, fontSize: 11, fontWeight: '600', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
    // Section
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 12, marginHorizontal: 20, marginTop: 20 },
    // Category grid
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginHorizontal: 20, marginBottom: 16 },
    categoryChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: t.bg.secondary },
    categoryChipActive: { backgroundColor: t.accent.green + '20', borderColor: t.accent.green },
    categoryChipText: { color: t.text.muted, fontSize: 12, fontWeight: '600' },
    categoryChipTextActive: { color: t.accent.green },
    // Activity card
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    activityTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700' },
    activityMeta: { color: t.text.muted, fontSize: 13, marginTop: 4 },
    activityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    activityDetail: { color: t.text.secondary, fontSize: 13 },
    activitySpots: { fontSize: 13, fontWeight: '700' },
    transportBadge: { backgroundColor: t.accent.blue + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 8, alignSelf: 'flex-start' },
    transportText: { color: t.accent.blue, fontSize: 11, fontWeight: '700' },
    nOTKBadge: { color: t.accent.green, fontSize: 14, fontWeight: '700', marginTop: 8 },
    // Category showcase
    categoryCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 10 },
    categoryIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    categoryIconText: { fontSize: 18, fontWeight: '700' },
    categoryLabel: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    categoryDesc: { color: t.text.muted, fontSize: 13, marginTop: 2 },
    // Companion card
    companionCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 12 },
    companionName: { color: t.text.primary, fontSize: 17, fontWeight: '700' },
    companionMatch: { color: t.accent.purple, fontSize: 14, fontWeight: '600', marginTop: 4 },
    companionDetail: { color: t.text.muted, fontSize: 13, marginTop: 2 },
    companionStatRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, paddingTop: 12, borderTopColor: t.bg.primary, borderTopWidth: 1 },
    companionStatItem: { alignItems: 'center' },
    companionStatValue: { color: t.text.primary, fontSize: 18, fontWeight: '800' },
    companionStatLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    specialtyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    specialtyChip: { backgroundColor: t.accent.green + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    specialtyText: { color: t.accent.green, fontSize: 11, fontWeight: '600' },
    // Wellness
    wellnessCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    wellnessHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    wellnessName: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    wellnessDate: { color: t.text.muted, fontSize: 12 },
    wellnessRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    wellnessLabel: { color: t.text.muted, fontSize: 13 },
    wellnessValue: { color: t.text.primary, fontSize: 13, fontWeight: '600' },
    wellnessNotes: { color: t.text.secondary, fontSize: 13, marginTop: 8, fontStyle: 'italic', lineHeight: 20 },
    wellnessCheckedBy: { color: t.text.muted, fontSize: 11, marginTop: 6 },
    moodDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
    // Schedule
    scheduleDay: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 10 },
    scheduleDayTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 8 },
    scheduleItem: { flexDirection: 'row', paddingVertical: 8, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    scheduleTime: { color: t.accent.green, fontSize: 13, fontWeight: '700', width: 80 },
    scheduleTitle: { color: t.text.primary, fontSize: 14, fontWeight: '600', flex: 1 },
    scheduleCategory: { color: t.text.muted, fontSize: 12 },
    // Education
    educationCard: { backgroundColor: t.accent.green + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    educationText: { color: t.text.primary, fontSize: 15, fontWeight: '600', textAlign: 'center', lineHeight: 22 },
    note: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginHorizontal: 24, marginTop: 16, lineHeight: 18 },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'activities', label: 'Activities' },
    { key: 'companions', label: 'Companions' },
    { key: 'wellness', label: 'Wellness' },
    { key: 'schedule', label: 'Schedule' },
  ];

  // ─── Activities Tab ───

  const renderActivities = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroTitle}>Active Aging, Vibrant Living</Text>
        <Text style={s.heroSubtitle}>
          "The wisdom of elders is humanity's greatest library."
        </Text>
      </View>

      <View style={s.scoreCard}>
        <View style={s.scoreItem}>
          <Text style={s.scoreValue}>{DEMO_ACTIVITIES.length}</Text>
          <Text style={s.scoreLabel}>Upcoming</Text>
        </View>
        <View style={s.scoreItem}>
          <Text style={s.scoreValue}>{DEMO_COMPANIONS.length}</Text>
          <Text style={s.scoreLabel}>Companions</Text>
        </View>
        <View style={s.scoreItem}>
          <Text style={s.scoreValue}>{ACTIVITY_CATEGORIES.length}</Text>
          <Text style={s.scoreLabel}>Categories</Text>
        </View>
      </View>

      {/* Category filter */}
      <Text style={s.sectionTitle}>Browse by Category</Text>
      <View style={s.categoryGrid}>
        <TouchableOpacity
          style={[s.categoryChip, categoryFilter === 'all' && s.categoryChipActive]}
          onPress={() => setCategoryFilter('all')}
        >
          <Text style={[s.categoryChipText, categoryFilter === 'all' && s.categoryChipTextActive]}>All</Text>
        </TouchableOpacity>
        {ACTIVITY_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[s.categoryChip, categoryFilter === cat.key && s.categoryChipActive]}
            onPress={() => setCategoryFilter(cat.key)}
          >
            <Text style={[s.categoryChipText, categoryFilter === cat.key && s.categoryChipTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Upcoming Activities */}
      <Text style={s.sectionTitle}>Upcoming Activities</Text>
      {filteredActivities.map((activity) => (
        <View key={activity.id} style={s.card}>
          <Text style={s.activityTitle}>{activity.title}</Text>
          <Text style={s.activityMeta}>{activity.day} at {activity.time}</Text>
          <Text style={s.activityMeta}>{activity.location}</Text>
          <View style={s.activityRow}>
            <Text style={s.activityDetail}>
              {ACTIVITY_CATEGORIES.find(c => c.key === activity.category)?.label}
            </Text>
            <Text style={[s.activitySpots, { color: activity.spotsLeft > 3 ? t.accent.green : t.accent.orange }]}>
              {activity.spotsLeft} spots left
            </Text>
          </View>
          {activity.transportAvailable && (
            <View style={s.transportBadge}>
              <Text style={s.transportText}>Transportation Available</Text>
            </View>
          )}
          <Text style={s.nOTKBadge}>+{activity.nOTKReward} nOTK for participation</Text>
        </View>
      ))}

      {/* Category Descriptions */}
      <Text style={s.sectionTitle}>Activity Categories</Text>
      {ACTIVITY_CATEGORIES.map((cat) => (
        <View key={cat.key} style={s.categoryCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[s.categoryIcon, { backgroundColor: t.accent.green + '20' }]}>
              <Text style={[s.categoryIconText, { color: t.accent.green }]}>{cat.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.categoryLabel}>{cat.label}</Text>
              <Text style={s.categoryDesc}>{cat.description}</Text>
            </View>
          </View>
        </View>
      ))}
    </>
  );

  // ─── Companions Tab ───

  const renderCompanions = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroTitle}>Companion Program</Text>
        <Text style={s.heroSubtitle}>
          "Volunteers paired with seniors for regular visits — nurturing earns nOTK."
        </Text>
      </View>

      <View style={s.scoreCard}>
        <View style={s.scoreItem}>
          <Text style={s.scoreValue}>{totalVisits}</Text>
          <Text style={s.scoreLabel}>Total Visits</Text>
        </View>
        <View style={s.scoreItem}>
          <Text style={[s.scoreValue, { color: t.accent.purple }]}>{totalCompanionNOTK.toLocaleString()}</Text>
          <Text style={s.scoreLabel}>nOTK Earned</Text>
        </View>
        <View style={s.scoreItem}>
          <Text style={s.scoreValue}>{DEMO_COMPANIONS.length}</Text>
          <Text style={s.scoreLabel}>Active Pairs</Text>
        </View>
      </View>

      <Text style={s.sectionTitle}>Active Companions</Text>
      {DEMO_COMPANIONS.map((companion) => (
        <View key={companion.id} style={s.companionCard}>
          <Text style={s.companionName}>{companion.name}</Text>
          <Text style={s.companionMatch}>Matched with {companion.matchedSenior}</Text>
          <Text style={s.companionDetail}>Visits: {companion.visitFrequency}</Text>
          <Text style={s.companionDetail}>Next visit: {companion.nextVisit}</Text>

          <View style={s.specialtyRow}>
            {companion.specialties.map((spec, i) => (
              <View key={i} style={s.specialtyChip}>
                <Text style={s.specialtyText}>{spec}</Text>
              </View>
            ))}
          </View>

          <View style={s.companionStatRow}>
            <View style={s.companionStatItem}>
              <Text style={s.companionStatValue}>{companion.totalVisits}</Text>
              <Text style={s.companionStatLabel}>Visits</Text>
            </View>
            <View style={s.companionStatItem}>
              <Text style={[s.companionStatValue, { color: t.accent.green }]}>{companion.nOTKEarned.toLocaleString()}</Text>
              <Text style={s.companionStatLabel}>nOTK Earned</Text>
            </View>
          </View>
        </View>
      ))}

      <View style={s.educationCard}>
        <Text style={s.educationText}>
          Every visit to an elder is recorded on Open Chain{'\n'}
          as nurture value (nOTK). Companions who visit{'\n'}
          regularly build a permanent record of caregiving{'\n'}
          that society will never forget.
        </Text>
      </View>

      <Text style={s.note}>
        Companion visits are verified through mutual check-in. Both the companion and the senior confirm the visit for nOTK to be minted. This ensures genuine, meaningful connection.
      </Text>
    </>
  );

  // ─── Wellness Tab ───

  const renderWellness = () => (
    <>
      <Text style={s.sectionTitle}>Senior Health & Wellness Tracking</Text>
      <Text style={[s.activityMeta, { marginHorizontal: 20, marginBottom: 12 }]}>
        Medication reminders, mobility, and mood check-ins
      </Text>

      {DEMO_WELLNESS.map((entry) => (
        <View key={entry.id} style={s.wellnessCard}>
          <View style={s.wellnessHeader}>
            <Text style={s.wellnessName}>{entry.seniorName}</Text>
            <Text style={s.wellnessDate}>{entry.date}</Text>
          </View>

          <View style={s.wellnessRow}>
            <Text style={s.wellnessLabel}>Medication</Text>
            <Text style={[s.wellnessValue, { color: entry.medication ? t.accent.green : t.accent.orange }]}>
              {entry.medication ? 'Taken' : 'Missed'}
            </Text>
          </View>
          <View style={s.wellnessRow}>
            <Text style={s.wellnessLabel}>Mobility</Text>
            <Text style={s.wellnessValue}>{MOBILITY_LABELS[entry.mobility]}</Text>
          </View>
          <View style={s.wellnessRow}>
            <Text style={s.wellnessLabel}>Mood</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[s.moodDot, { backgroundColor: MOOD_COLORS[entry.mood] || t.text.muted }]} />
              <Text style={s.wellnessValue}>{entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}</Text>
            </View>
          </View>

          <Text style={s.wellnessNotes}>{entry.notes}</Text>
          <Text style={s.wellnessCheckedBy}>Checked by: {entry.checkedBy}</Text>
        </View>
      ))}

      <View style={s.educationCard}>
        <Text style={s.educationText}>
          Regular wellness check-ins help seniors stay{'\n'}
          healthy and independent. Companions who monitor{'\n'}
          medication and mobility earn additional nOTK{'\n'}
          for their attentive caregiving.
        </Text>
      </View>
    </>
  );

  // ─── Schedule Tab ───

  const renderSchedule = () => (
    <>
      <Text style={s.sectionTitle}>Weekly Activity Schedule</Text>
      <Text style={[s.activityMeta, { marginHorizontal: 20, marginBottom: 12 }]}>
        Something for everyone, every day of the week
      </Text>

      {DEMO_WEEKLY_SCHEDULE.map((day) => (
        <View key={day.day} style={s.scheduleDay}>
          <Text style={s.scheduleDayTitle}>{day.day}</Text>
          {day.activities.map((act, i) => (
            <View key={i} style={[s.scheduleItem, i === day.activities.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={s.scheduleTime}>{act.time}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.scheduleTitle}>{act.title}</Text>
                <Text style={s.scheduleCategory}>
                  {ACTIVITY_CATEGORIES.find(c => c.key === act.category)?.label}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ))}

      <View style={s.educationCard}>
        <Text style={s.educationText}>
          Active aging keeps the mind sharp and the heart full.{'\n'}
          Every activity attended earns nOTK — because{'\n'}
          staying engaged is a gift to yourself and your community.
        </Text>
      </View>

      <Text style={s.note}>
        Transportation assistance is available for most activities. Contact your companion or the Senior Center to arrange a ride. Open Chain records all participation as community contribution.
      </Text>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Senior Activities</Text>
        <View style={{ width: 60 }} />
      </View>

      {demoMode && (
        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO MODE</Text>
        </View>
      )}

      <View style={s.tabRow}>
        {tabs.map((tb) => (
          <TouchableOpacity
            key={tb.key}
            style={[s.tabBtn, tab === tb.key && s.tabActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {tab === 'activities' && renderActivities()}
        {tab === 'companions' && renderCompanions()}
        {tab === 'wellness' && renderWellness()}
        {tab === 'schedule' && renderSchedule()}
      </ScrollView>
    </SafeAreaView>
  );
}
