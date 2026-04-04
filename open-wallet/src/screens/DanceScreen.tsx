import { fonts } from '../utils/theme';
/**
 * Dance Screen — Community dance, movement, cultural dance preservation.
 *
 * Article I: "Dance is the universal language of human expression."
 * Article III: eOTK represents educational and cultural value.
 *
 * Features:
 * - Dance styles directory (folk, classical, contemporary, hip-hop, salsa, traditional)
 * - Community dance classes (schedule, join, teach for eOTK)
 * - Dance events (performances, social dances, festivals)
 * - Cultural dance preservation (document traditional dances by region)
 * - Dance partners finder (skill level, preferred styles)
 * - Demo mode with sample data (4 classes, 2 events, 3 styles preserved)
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface DanceStyle {
  id: string;
  name: string;
  category: 'folk' | 'classical' | 'contemporary' | 'hip-hop' | 'salsa' | 'traditional';
  origin: string;
  description: string;
  icon: string;
}

interface DanceClass {
  id: string;
  title: string;
  style: string;
  instructor: string;
  instructorUID: string;
  date: string;
  time: string;
  durationMin: number;
  level: 'beginner' | 'intermediate' | 'advanced' | 'all';
  spotsTotal: number;
  spotsLeft: number;
  eotkCost: number;
  eotkTeachReward: number;
  location: string;
}

interface DanceEvent {
  id: string;
  title: string;
  type: 'performance' | 'social' | 'festival';
  date: string;
  location: string;
  styles: string[];
  description: string;
  attendees: number;
  eotkReward: number;
}

interface PreservedDance {
  id: string;
  name: string;
  region: string;
  country: string;
  style: string;
  documentedBy: string;
  videoHash: string;
  descriptionHash: string;
  preservedDate: string;
  eotkEarned: number;
  views: number;
}

interface DancePartner {
  id: string;
  name: string;
  uid: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  preferredStyles: string[];
  availability: string;
  rating: number;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const DANCE_STYLES: DanceStyle[] = [
  { id: 's1', name: 'Folk Dance', category: 'folk', origin: 'Various', description: 'Traditional community dances passed through generations', icon: 'F' },
  { id: 's2', name: 'Classical Ballet', category: 'classical', origin: 'France/Italy', description: 'Formal, technique-driven dance with centuries of tradition', icon: 'B' },
  { id: 's3', name: 'Contemporary', category: 'contemporary', origin: 'Global', description: 'Expressive, fluid movement blending multiple techniques', icon: 'C' },
  { id: 's4', name: 'Hip-Hop', category: 'hip-hop', origin: 'USA', description: 'Street dance styles born from urban culture', icon: 'H' },
  { id: 's5', name: 'Salsa', category: 'salsa', origin: 'Caribbean/Latin America', description: 'Partner dance with Afro-Caribbean rhythms', icon: 'S' },
  { id: 's6', name: 'Traditional', category: 'traditional', origin: 'Various', description: 'Culturally significant dances tied to ceremonies and rituals', icon: 'T' },
];

const LEVEL_COLORS: Record<string, string> = {
  beginner: '#34C759',
  intermediate: '#007AFF',
  advanced: '#AF52DE',
  all: '#8E8E93',
};

// ─── Demo Data ───

const DEMO_CLASSES: DanceClass[] = [
  { id: 'c1', title: 'Beginner Salsa Fundamentals', style: 'Salsa', instructor: 'Maria Santos', instructorUID: 'openchain1abc...maria', date: '2026-04-02', time: '18:00', durationMin: 60, level: 'beginner', spotsTotal: 20, spotsLeft: 7, eotkCost: 50, eotkTeachReward: 300, location: 'Community Center Hall A' },
  { id: 'c2', title: 'Hip-Hop Flow Workshop', style: 'Hip-Hop', instructor: 'DJ Rhythmz', instructorUID: 'openchain1def...djrhythmz', date: '2026-04-03', time: '19:30', durationMin: 90, level: 'intermediate', spotsTotal: 15, spotsLeft: 3, eotkCost: 75, eotkTeachReward: 450, location: 'Urban Dance Studio' },
  { id: 'c3', title: 'Folk Dance Circle — Balkans', style: 'Folk Dance', instructor: 'Anika Petrovic', instructorUID: 'openchain1ghi...anika', date: '2026-04-05', time: '10:00', durationMin: 120, level: 'all', spotsTotal: 30, spotsLeft: 18, eotkCost: 0, eotkTeachReward: 500, location: 'Riverside Park Amphitheater' },
  { id: 'c4', title: 'Contemporary Expression', style: 'Contemporary', instructor: 'Yuki Tanaka', instructorUID: 'openchain1jkl...yuki', date: '2026-04-06', time: '16:00', durationMin: 75, level: 'advanced', spotsTotal: 12, spotsLeft: 5, eotkCost: 100, eotkTeachReward: 600, location: 'Arts Center Studio 3' },
];

const DEMO_EVENTS: DanceEvent[] = [
  { id: 'e1', title: 'Spring Dance Festival', type: 'festival', date: '2026-04-12', location: 'City Cultural Center', styles: ['Folk Dance', 'Salsa', 'Contemporary', 'Hip-Hop'], description: 'Annual multi-style dance celebration featuring performances, workshops, and social dancing from our community.', attendees: 245, eotkReward: 200 },
  { id: 'e2', title: 'Saturday Night Social Dance', type: 'social', date: '2026-04-05', location: 'Grand Ballroom', styles: ['Salsa', 'Folk Dance'], description: 'Open social dance night. All levels welcome. Live music by local bands.', attendees: 78, eotkReward: 50 },
];

const DEMO_PRESERVED: PreservedDance[] = [
  { id: 'p1', name: 'Kecak Fire Dance', region: 'Bali', country: 'Indonesia', style: 'Traditional', documentedBy: 'openchain1mno...wayan', videoHash: 'QmX7k...abc123', descriptionHash: 'QmY8l...def456', preservedDate: '2026-03-15', eotkEarned: 1200, views: 342 },
  { id: 'p2', name: 'Hora', region: 'Transylvania', country: 'Romania', style: 'Folk Dance', documentedBy: 'openchain1pqr...elena', videoHash: 'QmZ9m...ghi789', descriptionHash: 'QmA1n...jkl012', preservedDate: '2026-03-10', eotkEarned: 950, views: 218 },
  { id: 'p3', name: 'Bharatanatyam Margam', region: 'Tamil Nadu', country: 'India', style: 'Classical', documentedBy: 'openchain1stu...priya', videoHash: 'QmB2o...mno345', descriptionHash: 'QmC3p...pqr678', preservedDate: '2026-02-28', eotkEarned: 1500, views: 567 },
];

const DEMO_PARTNERS: DancePartner[] = [
  { id: 'pa1', name: 'Alex Rivera', uid: 'openchain1vwx...alex', skillLevel: 'intermediate', preferredStyles: ['Salsa', 'Contemporary'], availability: 'Evenings & Weekends', rating: 4.8 },
  { id: 'pa2', name: 'Suki Park', uid: 'openchain1yza...suki', skillLevel: 'beginner', preferredStyles: ['Hip-Hop', 'Contemporary'], availability: 'Weekends', rating: 4.5 },
  { id: 'pa3', name: 'Dmitri Volkov', uid: 'openchain1bcd...dmitri', skillLevel: 'advanced', preferredStyles: ['Folk Dance', 'Classical'], availability: 'Flexible', rating: 4.9 },
];

type Tab = 'classes' | 'events' | 'preserve' | 'partners';

export function DanceScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('classes');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.green + '20' },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.green },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    // Classes
    classCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    classTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    classMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    classFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    classEotk: { color: t.accent.green, fontSize: 14, fontWeight: fonts.bold },
    classJoinBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    classJoinText: { color: '#fff', fontSize: 13, fontWeight: fonts.semibold },
    levelBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start', marginTop: 6 },
    levelText: { color: '#fff', fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase' },
    spotsText: { color: t.text.muted, fontSize: 11, marginTop: 4 },
    // Styles directory
    styleRow: { flexDirection: 'row', borderBottomColor: t.bg.primary, borderBottomWidth: 1, paddingVertical: 12 },
    styleIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: t.accent.green + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    styleIconText: { color: t.accent.green, fontSize: 14, fontWeight: fonts.bold },
    styleInfo: { flex: 1 },
    styleName: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    styleMeta: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    // Events
    eventCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    eventTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    eventType: { color: t.accent.blue, fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase', marginTop: 2 },
    eventMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    eventDesc: { color: t.text.secondary, fontSize: 13, marginTop: 8, lineHeight: 19 },
    eventFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    eventAttendees: { color: t.text.muted, fontSize: 12 },
    eventEotk: { color: t.accent.green, fontSize: 14, fontWeight: fonts.bold },
    eventRsvp: { backgroundColor: t.accent.green, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    eventRsvpText: { color: '#fff', fontSize: 13, fontWeight: fonts.semibold },
    // Preserve
    preserveCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    preserveName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    preserveRegion: { color: t.accent.blue, fontSize: 12, fontWeight: fonts.semibold, marginTop: 2 },
    preserveMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    preserveStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    preserveEotk: { color: t.accent.green, fontSize: 14, fontWeight: fonts.bold },
    preserveViews: { color: t.text.muted, fontSize: 13 },
    documentBtn: { backgroundColor: t.accent.green, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginHorizontal: 20, marginBottom: 16 },
    documentBtnText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    // Partners
    partnerCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    partnerName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    partnerLevel: { fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase', marginTop: 2 },
    partnerMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    partnerStyles: { color: t.text.secondary, fontSize: 12, marginTop: 2 },
    partnerFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    partnerRating: { color: t.accent.orange, fontSize: 14, fontWeight: fonts.bold },
    partnerConnect: { backgroundColor: t.accent.blue, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    partnerConnectText: { color: '#fff', fontSize: 13, fontWeight: fonts.semibold },
    // Demo
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'classes', label: 'Classes' },
    { key: 'events', label: 'Events' },
    { key: 'preserve', label: 'Preserve' },
    { key: 'partners', label: 'Partners' },
  ];

  // ─── Classes Tab ───

  const renderClasses = () => (
    <>
      <Text style={s.sectionTitle}>Dance Styles Directory</Text>
      <View style={s.card}>
        {DANCE_STYLES.map((ds) => (
          <View key={ds.id} style={s.styleRow}>
            <View style={s.styleIcon}>
              <Text style={s.styleIconText}>{ds.icon}</Text>
            </View>
            <View style={s.styleInfo}>
              <Text style={s.styleName}>{ds.name}</Text>
              <Text style={s.styleMeta}>{ds.origin} — {ds.description}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={s.sectionTitle}>Upcoming Classes</Text>
      {DEMO_CLASSES.map((cls) => {
        const lvlColor = LEVEL_COLORS[cls.level] || t.text.muted;
        return (
          <View key={cls.id} style={s.classCard}>
            <Text style={s.classTitle}>{cls.title}</Text>
            <View style={[s.levelBadge, { backgroundColor: lvlColor }]}>
              <Text style={s.levelText}>{cls.level}</Text>
            </View>
            <Text style={s.classMeta}>
              {cls.style} | {cls.instructor} | {cls.date} {cls.time}
            </Text>
            <Text style={s.classMeta}>
              {cls.location} | {cls.durationMin} min
            </Text>
            <Text style={s.spotsText}>{cls.spotsLeft}/{cls.spotsTotal} spots left</Text>
            <View style={s.classFooter}>
              <Text style={s.classEotk}>
                {cls.eotkCost > 0 ? `${cls.eotkCost} eOTK` : 'Free'}
                {' | Teach: +{cls.eotkTeachReward} eOTK'}
              </Text>
              <TouchableOpacity
                style={s.classJoinBtn}
                onPress={() => Alert.alert('Joined!', `You joined "${cls.title}" on ${cls.date} at ${cls.time}.`)}
              >
                <Text style={s.classJoinText}>Join</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </>
  );

  // ─── Events Tab ───

  const renderEvents = () => (
    <>
      <Text style={s.sectionTitle}>Dance Events</Text>
      {DEMO_EVENTS.map((evt) => (
        <View key={evt.id} style={s.eventCard}>
          <Text style={s.eventTitle}>{evt.title}</Text>
          <Text style={s.eventType}>{evt.type}</Text>
          <Text style={s.eventMeta}>
            {evt.date} | {evt.location}
          </Text>
          <Text style={s.eventMeta}>
            Styles: {evt.styles.join(', ')}
          </Text>
          <Text style={s.eventDesc}>{evt.description}</Text>
          <View style={s.eventFooter}>
            <View>
              <Text style={s.eventAttendees}>{evt.attendees} attending</Text>
              <Text style={s.eventEotk}>+{evt.eotkReward} eOTK for attending</Text>
            </View>
            <TouchableOpacity
              style={s.eventRsvp}
              onPress={() => Alert.alert('RSVP Confirmed', `You are attending "${evt.title}". See you there!`)}
            >
              <Text style={s.eventRsvpText}>RSVP</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </>
  );

  // ─── Preserve Tab ───

  const renderPreserve = () => (
    <>
      <Text style={s.sectionTitle}>Cultural Dance Preservation</Text>

      <TouchableOpacity
        style={s.documentBtn}
        onPress={() => Alert.alert(
          'Document a Dance',
          'Record a traditional dance from your culture.\n\nUpload video + description to earn eOTK for preserving cultural heritage.\n\nAll content is hashed and stored on Open Chain.',
        )}
      >
        <Text style={s.documentBtnText}>+ Document a Traditional Dance</Text>
      </TouchableOpacity>

      {DEMO_PRESERVED.map((pd) => (
        <View key={pd.id} style={s.preserveCard}>
          <Text style={s.preserveName}>{pd.name}</Text>
          <Text style={s.preserveRegion}>{pd.region}, {pd.country}</Text>
          <Text style={s.preserveMeta}>
            Style: {pd.style} | Preserved: {pd.preservedDate}
          </Text>
          <Text style={s.preserveMeta}>
            Video: {pd.videoHash.substring(0, 12)}...
          </Text>
          <View style={s.preserveStats}>
            <Text style={s.preserveEotk}>+{pd.eotkEarned} eOTK earned</Text>
            <Text style={s.preserveViews}>{pd.views} views</Text>
          </View>
        </View>
      ))}
    </>
  );

  // ─── Partners Tab ───

  const renderPartners = () => (
    <>
      <Text style={s.sectionTitle}>Find a Dance Partner</Text>
      {DEMO_PARTNERS.map((p) => {
        const lvlColor = LEVEL_COLORS[p.skillLevel] || t.text.muted;
        return (
          <View key={p.id} style={s.partnerCard}>
            <Text style={s.partnerName}>{p.name}</Text>
            <Text style={[s.partnerLevel, { color: lvlColor }]}>{p.skillLevel}</Text>
            <Text style={s.partnerStyles}>
              Styles: {p.preferredStyles.join(', ')}
            </Text>
            <Text style={s.partnerMeta}>Available: {p.availability}</Text>
            <View style={s.partnerFooter}>
              <Text style={s.partnerRating}>{'*'.repeat(Math.round(p.rating))} {p.rating}</Text>
              <TouchableOpacity
                style={s.partnerConnect}
                onPress={() => Alert.alert('Request Sent', `Dance partner request sent to ${p.name}. They will be notified.`)}
              >
                <Text style={s.partnerConnectText}>Connect</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Dance</Text>
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
        {tab === 'classes' && renderClasses()}
        {tab === 'events' && renderEvents()}
        {tab === 'preserve' && renderPreserve()}
        {tab === 'partners' && renderPartners()}
      </ScrollView>
    </SafeAreaView>
  );
}
