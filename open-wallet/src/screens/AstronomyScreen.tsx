/**
 * Astronomy Screen — Night sky observation, community telescope, space education.
 *
 * Article I: "Every human being possesses inherent worth — curiosity about the
 * cosmos is a fundamental expression of that worth."
 *
 * Features:
 * - Tonight's sky (visible planets, moon phase, meteor showers, ISS passes)
 * - Community telescope events (star parties, observation nights)
 * - Constellation guide (major constellations with descriptions)
 * - Citizen science — report observations (meteor sightings, aurora, unusual events)
 * - Space education modules (solar system, galaxies, exoplanets — earn eOTK)
 * - Demo mode with sample data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// ─── Types ───

type Tab = 'tonight' | 'events' | 'guide' | 'learn';

interface VisiblePlanet {
  name: string;
  icon: string;
  direction: string;
  riseTime: string;
  setTime: string;
  magnitude: number;
  constellation: string;
}

interface MoonPhase {
  phase: string;
  illumination: number;
  icon: string;
  riseTime: string;
  setTime: string;
  nextFullMoon: string;
}

interface SkyEvent {
  id: string;
  type: 'meteor_shower' | 'iss_pass' | 'eclipse' | 'conjunction';
  name: string;
  date: string;
  time: string;
  direction: string;
  description: string;
  icon: string;
}

interface TelescopeEvent {
  id: string;
  title: string;
  type: 'star_party' | 'observation_night' | 'workshop' | 'lecture';
  date: string;
  time: string;
  location: string;
  hostUid: string;
  hostName: string;
  attendees: number;
  maxAttendees: number;
  description: string;
}

interface ConstellationEntry {
  name: string;
  icon: string;
  season: string;
  stars: number;
  brightestStar: string;
  description: string;
  visible: boolean;
}

interface EducationModule {
  id: string;
  title: string;
  category: 'solar_system' | 'galaxies' | 'exoplanets' | 'cosmology';
  icon: string;
  eotkReward: number;
  progress: number; // 0-100
  totalLessons: number;
  completedLessons: number;
}

interface CitizenReport {
  id: string;
  type: 'meteor' | 'aurora' | 'unusual';
  description: string;
  reporterUid: string;
  date: string;
  location: string;
  verified: boolean;
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_MOON: MoonPhase = {
  phase: 'Waxing Gibbous', illumination: 78, icon: '\u{1F314}',
  riseTime: '15:42', setTime: '03:18', nextFullMoon: '2026-04-05',
};

const DEMO_PLANETS: VisiblePlanet[] = [
  {
    name: 'Jupiter', icon: '\u{1FA90}', direction: 'Southwest',
    riseTime: '14:20', setTime: '01:45', magnitude: -2.3, constellation: 'Taurus',
  },
  {
    name: 'Saturn', icon: '\u{1FA90}', direction: 'Southeast',
    riseTime: '21:10', setTime: '07:30', magnitude: 0.8, constellation: 'Aquarius',
  },
];

const DEMO_SKY_EVENTS: SkyEvent[] = [
  {
    id: 'evt-1', type: 'iss_pass', name: 'ISS Pass',
    date: '2026-03-29', time: '20:14', direction: 'NW to SE',
    description: 'Bright pass, magnitude -3.2, visible for 6 minutes.',
    icon: '\u{1F6F0}\uFE0F',
  },
  {
    id: 'evt-2', type: 'meteor_shower', name: 'Lyrid Meteor Shower',
    date: '2026-04-22', time: 'Peak after midnight',
    direction: 'Radiant near Vega', description: '15-20 meteors per hour expected.',
    icon: '\u{2604}\uFE0F',
  },
];

const DEMO_TELESCOPE_EVENTS: TelescopeEvent[] = [
  {
    id: 'tel-1', title: 'Spring Star Party', type: 'star_party',
    date: '2026-04-05', time: '20:00', location: 'Hilltop Observatory Park',
    hostUid: 'UID-5501-STAR', hostName: 'Dr. Patel',
    attendees: 23, maxAttendees: 40,
    description: 'Full moon observation night with 12" Dobsonian telescope. Jupiter and Saturn viewing.',
  },
];

const DEMO_CONSTELLATIONS: ConstellationEntry[] = [
  {
    name: 'Orion', icon: '\u{2B50}', season: 'Winter', stars: 7,
    brightestStar: 'Rigel', visible: true,
    description: 'The Hunter — one of the most recognizable constellations. Look for the three stars of Orion\'s Belt.',
  },
  {
    name: 'Ursa Major', icon: '\u{2B50}', season: 'Year-round', stars: 7,
    brightestStar: 'Alioth', visible: true,
    description: 'The Great Bear — contains the Big Dipper asterism. Use the pointer stars to find Polaris.',
  },
  {
    name: 'Leo', icon: '\u{2B50}', season: 'Spring', stars: 9,
    brightestStar: 'Regulus', visible: true,
    description: 'The Lion — look for the distinctive sickle shape forming the head and mane.',
  },
  {
    name: 'Cassiopeia', icon: '\u{2B50}', season: 'Year-round', stars: 5,
    brightestStar: 'Schedar', visible: true,
    description: 'The Queen — easily identified by its distinctive W or M shape near Polaris.',
  },
  {
    name: 'Scorpius', icon: '\u{2B50}', season: 'Summer', stars: 18,
    brightestStar: 'Antares', visible: false,
    description: 'The Scorpion — features the red supergiant Antares at its heart. Best visible in summer.',
  },
];

const DEMO_MODULES: EducationModule[] = [
  {
    id: 'mod-1', title: 'Our Solar System', category: 'solar_system', icon: '\u{2600}\uFE0F',
    eotkReward: 5, progress: 60, totalLessons: 10, completedLessons: 6,
  },
  {
    id: 'mod-2', title: 'Galaxies & Beyond', category: 'galaxies', icon: '\u{1F30C}',
    eotkReward: 8, progress: 25, totalLessons: 8, completedLessons: 2,
  },
  {
    id: 'mod-3', title: 'Exoplanet Discoveries', category: 'exoplanets', icon: '\u{1FA90}',
    eotkReward: 10, progress: 0, totalLessons: 12, completedLessons: 0,
  },
  {
    id: 'mod-4', title: 'Cosmology 101', category: 'cosmology', icon: '\u{1F52D}',
    eotkReward: 12, progress: 0, totalLessons: 15, completedLessons: 0,
  },
];

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'tonight', label: 'Tonight', icon: '\u{1F303}' },
  { key: 'events', label: 'Events', icon: '\u{1F52D}' },
  { key: 'guide', label: 'Guide', icon: '\u{2B50}' },
  { key: 'learn', label: 'Learn', icon: '\u{1F4DA}' },
];

// ─── Component ───

export function AstronomyScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('tonight');
  const [moon] = useState<MoonPhase>(DEMO_MOON);
  const [planets] = useState<VisiblePlanet[]>(DEMO_PLANETS);
  const [skyEvents] = useState<SkyEvent[]>(DEMO_SKY_EVENTS);
  const [telescopeEvents] = useState<TelescopeEvent[]>(DEMO_TELESCOPE_EVENTS);
  const [constellations] = useState<ConstellationEntry[]>(DEMO_CONSTELLATIONS);
  const [modules] = useState<EducationModule[]>(DEMO_MODULES);
  const t = useTheme();
  const demoMode = useWalletStore((s: any) => s.demoMode);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    heroCard: { backgroundColor: '#0D1B2A', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: '#E0E1DD', fontSize: 18, fontWeight: '800', textAlign: 'center' },
    heroSubtitle: { color: '#778DA9', fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 20, backgroundColor: t.bg.card, borderRadius: 16, padding: 4 },
    tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
    tabBtnActive: { backgroundColor: '#1B263B' },
    tabText: { color: t.text.secondary, fontSize: 11, fontWeight: '700' },
    tabTextActive: { color: '#E0E1DD' },
    tabIcon: { fontSize: 18, marginBottom: 2 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 24 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    cardRow: { flexDirection: 'row', alignItems: 'center' },
    cardIcon: { fontSize: 32, marginRight: 14 },
    cardTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    cardSubtitle: { color: t.text.secondary, fontSize: 12, marginTop: 2 },
    cardMeta: { color: t.text.muted, fontSize: 11, marginTop: 4 },
    moonCard: { backgroundColor: '#0D1B2A', borderRadius: 20, padding: 20, marginHorizontal: 20, marginBottom: 12, alignItems: 'center' },
    moonIcon: { fontSize: 64, marginBottom: 8 },
    moonPhase: { color: '#E0E1DD', fontSize: 18, fontWeight: '800' },
    moonIllum: { color: '#778DA9', fontSize: 14, marginTop: 4 },
    moonTimesRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 16 },
    moonTimeBox: { alignItems: 'center' },
    moonTimeLabel: { color: '#778DA9', fontSize: 11, fontWeight: '600' },
    moonTimeValue: { color: '#E0E1DD', fontSize: 14, fontWeight: '700', marginTop: 2 },
    planetCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
    planetInfo: { flex: 1, marginLeft: 12 },
    planetName: { color: t.text.primary, fontSize: 16, fontWeight: '700' },
    planetDetail: { color: t.text.secondary, fontSize: 12, marginTop: 2 },
    planetMag: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    planetIcon: { fontSize: 36 },
    eventCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    eventHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    eventIcon: { fontSize: 28, marginRight: 10 },
    eventTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700', flex: 1 },
    eventDate: { color: t.accent.blue, fontSize: 12, fontWeight: '600' },
    eventDesc: { color: t.text.secondary, fontSize: 13, lineHeight: 20 },
    eventMeta: { color: t.text.muted, fontSize: 11, marginTop: 8 },
    telescopeCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    telescopeTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700' },
    telescopeType: { color: t.accent.blue, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginTop: 4 },
    telescopeInfo: { color: t.text.secondary, fontSize: 13, marginTop: 8, lineHeight: 20 },
    telescopeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
    telescopeLabel: { color: t.text.muted, fontSize: 12 },
    telescopeValue: { color: t.text.primary, fontSize: 13, fontWeight: '600' },
    attendeeBar: { height: 6, backgroundColor: t.bg.primary, borderRadius: 3, marginTop: 8, overflow: 'hidden' },
    attendeeFill: { height: 6, backgroundColor: t.accent.green, borderRadius: 3 },
    attendeeText: { color: t.text.muted, fontSize: 11, marginTop: 4 },
    constCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 10 },
    constHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    constName: { color: t.text.primary, fontSize: 16, fontWeight: '700' },
    constSeason: { color: t.text.muted, fontSize: 12 },
    constDesc: { color: t.text.secondary, fontSize: 13, lineHeight: 20, marginTop: 8 },
    constMeta: { color: t.text.muted, fontSize: 11, marginTop: 6 },
    visibleBadge: { backgroundColor: '#22c55e20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    visibleBadgeText: { color: '#22c55e', fontSize: 11, fontWeight: '700' },
    notVisibleBadge: { backgroundColor: t.text.muted + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    notVisibleText: { color: t.text.muted, fontSize: 11, fontWeight: '700' },
    moduleCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    moduleHeader: { flexDirection: 'row', alignItems: 'center' },
    moduleIcon: { fontSize: 32, marginRight: 12 },
    moduleTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700', flex: 1 },
    moduleReward: { color: t.accent.purple, fontSize: 12, fontWeight: '700' },
    progressBar: { height: 6, backgroundColor: t.bg.primary, borderRadius: 3, marginTop: 12, overflow: 'hidden' },
    progressFill: { height: 6, backgroundColor: t.accent.blue, borderRadius: 3 },
    progressText: { color: t.text.muted, fontSize: 11, marginTop: 4 },
    actionBtn: { backgroundColor: '#1B263B', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginHorizontal: 20, marginTop: 16 },
    actionBtnText: { color: '#E0E1DD', fontSize: 16, fontWeight: '700' },
    secondaryBtn: { backgroundColor: t.bg.card, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginHorizontal: 20, marginTop: 10 },
    secondaryBtnText: { color: t.accent.blue, fontSize: 16, fontWeight: '700' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 20, marginTop: 16 },
    statBox: { alignItems: 'center', flex: 1 },
    statValue: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
  }), [t]);

  // ─── Tonight Tab ───
  const renderTonight = useCallback(() => (
    <>
      <Text style={s.section}>Moon Phase</Text>
      <View style={s.moonCard}>
        <Text style={s.moonIcon}>{moon.icon}</Text>
        <Text style={s.moonPhase}>{moon.phase}</Text>
        <Text style={s.moonIllum}>{moon.illumination}% illuminated</Text>
        <View style={s.moonTimesRow}>
          <View style={s.moonTimeBox}>
            <Text style={s.moonTimeLabel}>Moonrise</Text>
            <Text style={s.moonTimeValue}>{moon.riseTime}</Text>
          </View>
          <View style={s.moonTimeBox}>
            <Text style={s.moonTimeLabel}>Moonset</Text>
            <Text style={s.moonTimeValue}>{moon.setTime}</Text>
          </View>
          <View style={s.moonTimeBox}>
            <Text style={s.moonTimeLabel}>Next Full</Text>
            <Text style={s.moonTimeValue}>{moon.nextFullMoon}</Text>
          </View>
        </View>
      </View>

      <Text style={s.section}>Visible Planets ({planets.length})</Text>
      {planets.map((p) => (
        <View key={p.name} style={s.planetCard}>
          <Text style={s.planetIcon}>{p.icon}</Text>
          <View style={s.planetInfo}>
            <Text style={s.planetName}>{p.name}</Text>
            <Text style={s.planetDetail}>{p.direction} — in {p.constellation}</Text>
            <Text style={s.planetMag}>Magnitude {p.magnitude} | Rise {p.riseTime} — Set {p.setTime}</Text>
          </View>
        </View>
      ))}

      <Text style={s.section}>Sky Events</Text>
      {skyEvents.map((e) => (
        <View key={e.id} style={s.eventCard}>
          <View style={s.eventHeader}>
            <Text style={s.eventIcon}>{e.icon}</Text>
            <Text style={s.eventTitle}>{e.name}</Text>
            <Text style={s.eventDate}>{e.date}</Text>
          </View>
          <Text style={s.eventDesc}>{e.description}</Text>
          <Text style={s.eventMeta}>{e.time} | Direction: {e.direction}</Text>
        </View>
      ))}

      <TouchableOpacity style={s.actionBtn} onPress={() => Alert.alert('Report Observation', 'Submit a citizen science observation.')}>
        <Text style={s.actionBtnText}>Report Observation</Text>
      </TouchableOpacity>
    </>
  ), [moon, planets, skyEvents, s]);

  // ─── Events Tab ───
  const renderEvents = useCallback(() => (
    <>
      <Text style={s.section}>Community Telescope Events</Text>
      {telescopeEvents.map((e) => (
        <View key={e.id} style={s.telescopeCard}>
          <Text style={s.telescopeTitle}>{'\u{1F52D}'} {e.title}</Text>
          <Text style={s.telescopeType}>{e.type.replace('_', ' ')}</Text>
          <Text style={s.telescopeInfo}>{e.description}</Text>
          <View style={s.telescopeRow}>
            <View>
              <Text style={s.telescopeLabel}>Date & Time</Text>
              <Text style={s.telescopeValue}>{e.date} at {e.time}</Text>
            </View>
            <View>
              <Text style={s.telescopeLabel}>Location</Text>
              <Text style={s.telescopeValue}>{e.location}</Text>
            </View>
          </View>
          <View style={[s.telescopeRow, { marginTop: 8 }]}>
            <View>
              <Text style={s.telescopeLabel}>Host</Text>
              <Text style={s.telescopeValue}>{e.hostName}</Text>
            </View>
          </View>
          <View style={s.attendeeBar}>
            <View style={[s.attendeeFill, { width: `${(e.attendees / e.maxAttendees) * 100}%` }]} />
          </View>
          <Text style={s.attendeeText}>{e.attendees} / {e.maxAttendees} spots filled</Text>
        </View>
      ))}

      <TouchableOpacity style={s.actionBtn} onPress={() => Alert.alert('RSVP', 'Join this telescope event.')}>
        <Text style={s.actionBtnText}>RSVP to Event</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.secondaryBtn} onPress={() => Alert.alert('Host Event', 'Organize a community observation night.')}>
        <Text style={s.secondaryBtnText}>Host an Event</Text>
      </TouchableOpacity>
    </>
  ), [telescopeEvents, s]);

  // ─── Guide Tab ───
  const renderGuide = useCallback(() => (
    <>
      <Text style={s.section}>Constellation Guide ({constellations.length})</Text>
      {constellations.map((c) => (
        <View key={c.name} style={s.constCard}>
          <View style={s.constHeader}>
            <Text style={s.constName}>{c.icon} {c.name}</Text>
            {c.visible ? (
              <View style={s.visibleBadge}>
                <Text style={s.visibleBadgeText}>Visible Tonight</Text>
              </View>
            ) : (
              <View style={s.notVisibleBadge}>
                <Text style={s.notVisibleText}>Not Visible</Text>
              </View>
            )}
          </View>
          <Text style={s.constDesc}>{c.description}</Text>
          <Text style={s.constMeta}>
            Season: {c.season} | Main stars: {c.stars} | Brightest: {c.brightestStar}
          </Text>
        </View>
      ))}
    </>
  ), [constellations, s]);

  // ─── Learn Tab ───
  const renderLearn = useCallback(() => (
    <>
      <Text style={s.section}>Space Education Modules</Text>
      {modules.map((m) => (
        <View key={m.id} style={s.moduleCard}>
          <View style={s.moduleHeader}>
            <Text style={s.moduleIcon}>{m.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.moduleTitle}>{m.title}</Text>
              <Text style={s.moduleReward}>Earn {m.eotkReward} eOTK</Text>
            </View>
          </View>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${m.progress}%` }]} />
          </View>
          <Text style={s.progressText}>{m.completedLessons} / {m.totalLessons} lessons ({m.progress}%)</Text>
        </View>
      ))}

      <TouchableOpacity style={s.actionBtn} onPress={() => Alert.alert('Continue Learning', 'Resume your next lesson.')}>
        <Text style={s.actionBtnText}>Continue Learning</Text>
      </TouchableOpacity>

      <View style={s.statsRow}>
        <View style={s.statBox}>
          <Text style={s.statValue}>8</Text>
          <Text style={s.statLabel}>Lessons Done</Text>
        </View>
        <View style={s.statBox}>
          <Text style={s.statValue}>13</Text>
          <Text style={s.statLabel}>eOTK Earned</Text>
        </View>
        <View style={s.statBox}>
          <Text style={s.statValue}>2</Text>
          <Text style={s.statLabel}>Modules Active</Text>
        </View>
      </View>
    </>
  ), [modules, s]);

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Astronomy</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={s.heroCard}>
          <Text style={s.heroIcon}>{'\u{1F30C}'}</Text>
          <Text style={s.heroTitle}>Explore the Night Sky</Text>
          <Text style={s.heroSubtitle}>
            Observe, learn, and connect with the cosmos.{'\n'}Earn eOTK through space education.
          </Text>
        </View>

        {/* Summary Stats */}
        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={s.statValue}>{moon.icon}</Text>
            <Text style={s.statLabel}>{moon.phase}</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>{planets.length}</Text>
            <Text style={s.statLabel}>Planets</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>{telescopeEvents.length}</Text>
            <Text style={s.statLabel}>Star Party</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>{constellations.length}</Text>
            <Text style={s.statLabel}>Constellations</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={s.tabRow}>
          {TABS.map((tb) => (
            <TouchableOpacity
              key={tb.key}
              style={[s.tabBtn, tab === tb.key && s.tabBtnActive]}
              onPress={() => setTab(tb.key)}
            >
              <Text style={s.tabIcon}>{tb.icon}</Text>
              <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {tab === 'tonight' && renderTonight()}
        {tab === 'events' && renderEvents()}
        {tab === 'guide' && renderGuide()}
        {tab === 'learn' && renderLearn()}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
