import { fonts } from '../utils/theme';
/**
 * Child Development Screen — Track child developmental milestones (nOTK).
 *
 * Article II: "Every child deserves nurturing care."
 * nOTK represents nurture value in the Open Chain ecosystem.
 *
 * Features:
 * - Developmental milestones by age group
 * - Activities to support development
 * - Educational resources for parents/caregivers
 * - Demo mode with sample data
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface Milestone {
  id: string;
  ageRange: string;
  category: 'physical' | 'cognitive' | 'social' | 'language';
  title: string;
  description: string;
  achieved: boolean;
  achievedDate?: string;
  notkEarned?: number;
}

interface Activity {
  id: string;
  title: string;
  ageRange: string;
  category: string;
  duration: string;
  description: string;
  notkReward: number;
}

interface Resource {
  id: string;
  title: string;
  type: 'article' | 'video' | 'guide' | 'checklist';
  topic: string;
  description: string;
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_MILESTONES: Milestone[] = [
  { id: 'm1', ageRange: '0-6 months', category: 'physical', title: 'Holds head steady', description: 'Baby can hold head up without support.', achieved: true, achievedDate: '2026-01-15', notkEarned: 50 },
  { id: 'm2', ageRange: '0-6 months', category: 'social', title: 'First social smile', description: 'Smiles in response to a person.', achieved: true, achievedDate: '2026-02-01', notkEarned: 50 },
  { id: 'm3', ageRange: '6-12 months', category: 'physical', title: 'Sits without support', description: 'Can sit up independently.', achieved: true, achievedDate: '2026-03-10', notkEarned: 75 },
  { id: 'm4', ageRange: '6-12 months', category: 'language', title: 'Babbles consonant sounds', description: 'Says "ba-ba" or "da-da" sounds.', achieved: true, achievedDate: '2026-03-20', notkEarned: 75 },
  { id: 'm5', ageRange: '6-12 months', category: 'cognitive', title: 'Object permanence', description: 'Looks for hidden objects.', achieved: false },
  { id: 'm6', ageRange: '12-18 months', category: 'physical', title: 'First steps', description: 'Walks independently.', achieved: false },
  { id: 'm7', ageRange: '12-18 months', category: 'language', title: 'First words', description: 'Says 1-3 meaningful words.', achieved: false },
  { id: 'm8', ageRange: '12-18 months', category: 'social', title: 'Plays alongside others', description: 'Parallel play with other children.', achieved: false },
];

const DEMO_ACTIVITIES: Activity[] = [
  { id: 'a1', title: 'Tummy Time', ageRange: '0-6 months', category: 'physical', duration: '10-15 min', description: 'Place baby on tummy while awake. Builds neck and shoulder strength.', notkReward: 10 },
  { id: 'a2', title: 'Reading Together', ageRange: '0-12 months', category: 'language', duration: '15-20 min', description: 'Read board books aloud. Point to pictures and name objects.', notkReward: 15 },
  { id: 'a3', title: 'Sensory Play', ageRange: '6-12 months', category: 'cognitive', duration: '20 min', description: 'Safe textures, sounds, and colors. Stimulates brain development.', notkReward: 12 },
  { id: 'a4', title: 'Peek-a-boo Games', ageRange: '6-12 months', category: 'social', duration: '10 min', description: 'Teaches object permanence and builds trust.', notkReward: 10 },
  { id: 'a5', title: 'Music & Movement', ageRange: '0-18 months', category: 'physical', duration: '15 min', description: 'Sing songs with hand motions. Clap, dance, shake rattles.', notkReward: 12 },
  { id: 'a6', title: 'Nature Walk', ageRange: '12-18 months', category: 'cognitive', duration: '30 min', description: 'Explore outdoors. Name plants, animals, colors.', notkReward: 20 },
];

const DEMO_RESOURCES: Resource[] = [
  { id: 'r1', title: 'CDC Developmental Milestones', type: 'checklist', topic: 'General Development', description: 'Complete age-by-age checklist from the CDC for tracking milestones.' },
  { id: 'r2', title: 'The Importance of Play', type: 'article', topic: 'Early Childhood', description: 'How play-based learning supports all areas of child development.' },
  { id: 'r3', title: 'Responsive Parenting Guide', type: 'guide', topic: 'Attachment', description: 'Building secure attachment through responsive caregiving.' },
  { id: 'r4', title: 'Language Development Tips', type: 'video', topic: 'Speech & Language', description: 'Practical tips to encourage language development from birth.' },
  { id: 'r5', title: 'Nutrition for Growing Brains', type: 'article', topic: 'Nutrition', description: 'Key nutrients for brain development in the first 1000 days.' },
  { id: 'r6', title: 'When to Seek Help', type: 'guide', topic: 'Developmental Delays', description: 'Red flags and resources for early intervention services.' },
];

const CAT_COLORS: Record<string, string> = {
  physical: '#FF9500',
  cognitive: '#007AFF',
  social: '#AF52DE',
  language: '#34C759',
};

const TYPE_LABELS: Record<string, string> = {
  article: 'ART',
  video: 'VID',
  guide: 'GDE',
  checklist: 'CHK',
};

type Tab = 'milestones' | 'activities' | 'resources';

export function ChildDevelopmentScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('milestones');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const achieved = useMemo(() => DEMO_MILESTONES.filter(m => m.achieved).length, []);
  const totalNotk = useMemo(() => DEMO_MILESTONES.reduce((s, m) => s + (m.notkEarned || 0), 0), []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.green + '20' },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.green },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
    summaryItem: { alignItems: 'center' },
    summaryValue: { color: t.text.primary, fontSize: fonts.xxl, fontWeight: fonts.heavy },
    summaryLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    mileRow: { flexDirection: 'row', paddingVertical: 12, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    mileDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12, marginTop: 3 },
    mileInfo: { flex: 1 },
    mileTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    mileMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    mileRight: { alignItems: 'flex-end', justifyContent: 'center' },
    mileNotk: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold },
    milePending: { color: t.text.muted, fontSize: fonts.xs },
    catBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, alignSelf: 'flex-start', marginTop: 4 },
    catText: { color: '#fff', fontSize: fonts.xs, fontWeight: fonts.semibold, textTransform: 'uppercase' },
    actCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    actTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    actMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    actDesc: { color: t.text.muted, fontSize: fonts.sm, marginTop: 6, lineHeight: 19 },
    actReward: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold, marginTop: 8 },
    logBtn: { backgroundColor: t.accent.green, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-start', marginTop: 8 },
    logBtnText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.semibold },
    resCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    resTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    resMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    resDesc: { color: t.text.muted, fontSize: fonts.sm, marginTop: 6, lineHeight: 19 },
    typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: t.accent.blue + '20', alignSelf: 'flex-start', marginTop: 6 },
    typeText: { color: t.accent.blue, fontSize: fonts.xs, fontWeight: fonts.semibold },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.bold },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'milestones', label: 'Milestones' },
    { key: 'activities', label: 'Activities' },
    { key: 'resources', label: 'Resources' },
  ];

  const renderMilestones = () => (
    <>
      <View style={s.card}>
        <View style={s.summaryRow}>
          <View style={s.summaryItem}>
            <Text style={s.summaryValue}>{achieved}/{DEMO_MILESTONES.length}</Text>
            <Text style={s.summaryLabel}>Achieved</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={[s.summaryValue, { color: t.accent.green }]}>{totalNotk}</Text>
            <Text style={s.summaryLabel}>nOTK Earned</Text>
          </View>
        </View>
      </View>
      <View style={s.card}>
        {DEMO_MILESTONES.map((m) => (
          <View key={m.id} style={s.mileRow}>
            <View style={[s.mileDot, { backgroundColor: m.achieved ? '#34C759' : t.text.muted + '40' }]} />
            <View style={s.mileInfo}>
              <Text style={s.mileTitle}>{m.title}</Text>
              <Text style={s.mileMeta}>{m.ageRange} — {m.description}</Text>
              <View style={[s.catBadge, { backgroundColor: CAT_COLORS[m.category] }]}>
                <Text style={s.catText}>{m.category}</Text>
              </View>
            </View>
            <View style={s.mileRight}>
              {m.achieved ? (
                <Text style={s.mileNotk}>+{m.notkEarned} nOTK</Text>
              ) : (
                <Text style={s.milePending}>Pending</Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </>
  );

  const renderActivities = () => (
    <>
      <Text style={s.sectionTitle}>Developmental Activities</Text>
      {DEMO_ACTIVITIES.map((a) => (
        <View key={a.id} style={s.actCard}>
          <Text style={s.actTitle}>{a.title}</Text>
          <Text style={s.actMeta}>{a.ageRange} | {a.category} | {a.duration}</Text>
          <Text style={s.actDesc}>{a.description}</Text>
          <Text style={s.actReward}>+{a.notkReward} nOTK per session</Text>
          <TouchableOpacity style={s.logBtn} onPress={() => Alert.alert('Logged', `Activity "${a.title}" logged. +${a.notkReward} nOTK earned!`)}>
            <Text style={s.logBtnText}>Log Activity</Text>
          </TouchableOpacity>
        </View>
      ))}
    </>
  );

  const renderResources = () => (
    <>
      <Text style={s.sectionTitle}>Parent & Caregiver Resources</Text>
      {DEMO_RESOURCES.map((r) => (
        <View key={r.id} style={s.resCard}>
          <Text style={s.resTitle}>{r.title}</Text>
          <Text style={s.resMeta}>{r.topic}</Text>
          <Text style={s.resDesc}>{r.description}</Text>
          <View style={s.typeBadge}>
            <Text style={s.typeText}>{TYPE_LABELS[r.type]}</Text>
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
        <Text style={s.title}>Child Development</Text>
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
        {tab === 'milestones' && renderMilestones()}
        {tab === 'activities' && renderActivities()}
        {tab === 'resources' && renderResources()}
      </ScrollView>
    </SafeAreaView>
  );
}
