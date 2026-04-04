import { fonts } from '../utils/theme';
/**
 * Prayer Screen — Interfaith community, shared prayer/worship spaces,
 * spiritual diversity.
 *
 * Article I: "Every dimension of human contribution is valued equally."
 * Spiritual life, worship, and interfaith dialogue are part of the
 * fabric that holds communities together.
 *
 * Features:
 * - Multi-faith calendar (holidays and observances from all traditions)
 * - Prayer/worship spaces directory (temples, mosques, churches,
 *   synagogues, meditation centers, nature shrines)
 * - Interfaith dialogue events (community conversations bridging faiths)
 * - Prayer requests — anonymous community prayer support
 * - Spiritual leaders directory (clergy, monks, rabbis, imams, guides)
 * - Interfaith solidarity (joint community service events)
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

interface Observance {
  id: string;
  name: string;
  tradition: string;
  date: string;
  description: string;
  icon: string;
}

interface WorshipSpace {
  id: string;
  name: string;
  type: string;
  tradition: string;
  address: string;
  openHours: string;
  icon: string;
}

interface DialogueEvent {
  id: string;
  title: string;
  traditions: string[];
  date: string;
  location: string;
  participants: number;
  description: string;
}

interface PrayerRequest {
  id: string;
  intention: string;
  supportCount: number;
  date: string;
  anonymous: boolean;
}

interface SpiritualLeader {
  id: string;
  name: string;
  title: string;
  tradition: string;
  community: string;
  icon: string;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const TRADITION_COLORS: Record<string, string> = {
  Christianity: '#4A90D9',
  Islam: '#34C759',
  Judaism: '#FF9500',
  Hinduism: '#FF6B35',
  Buddhism: '#AF52DE',
  Sikhism: '#FFD60A',
  Indigenous: '#8B6914',
  Secular: '#8E8E93',
  Interfaith: '#007AFF',
};

// ─── Demo Data ───

const DEMO_OBSERVANCES: Observance[] = [
  { id: '1', name: 'Vesak (Buddha Day)', tradition: 'Buddhism', date: '2026-05-12', description: 'Celebrating the birth, enlightenment, and passing of the Buddha.', icon: 'B' },
  { id: '2', name: 'Eid al-Adha', tradition: 'Islam', date: '2026-06-07', description: 'Festival of Sacrifice — honoring Ibrahim\'s devotion and sharing with those in need.', icon: 'I' },
  { id: '3', name: 'Rosh Hashanah', tradition: 'Judaism', date: '2026-09-12', description: 'Jewish New Year — a time for reflection, repentance, and renewal.', icon: 'J' },
  { id: '4', name: 'Diwali', tradition: 'Hinduism', date: '2026-10-20', description: 'Festival of Lights — celebrating the victory of light over darkness, good over evil.', icon: 'H' },
  { id: '5', name: 'Summer Solstice Ceremony', tradition: 'Indigenous', date: '2026-06-21', description: 'Honoring the longest day — gratitude for the sun, earth, and all living beings.', icon: 'N' },
];

const DEMO_SPACES: WorshipSpace[] = [
  { id: '1', name: 'Community Interfaith Center', type: 'Interfaith Center', tradition: 'Interfaith', address: '100 Unity Avenue', openHours: 'Daily 6am-10pm', icon: 'IF' },
  { id: '2', name: 'Al-Noor Mosque', type: 'Mosque', tradition: 'Islam', address: '245 Peace Street', openHours: 'Daily 4:30am-10pm', icon: 'M' },
  { id: '3', name: 'Shanti Meditation Center', type: 'Meditation Center', tradition: 'Buddhism', address: '88 Stillwater Lane', openHours: 'Daily 5am-9pm', icon: 'MC' },
  { id: '4', name: 'Sacred Grove Nature Shrine', type: 'Nature Shrine', tradition: 'Indigenous', address: 'Cedar Ridge Trail, City Park', openHours: 'Sunrise to Sunset', icon: 'NS' },
];

const DEMO_DIALOGUE_EVENTS: DialogueEvent[] = [
  { id: '1', title: 'Breaking Bread Together: Shared Meals, Shared Stories', traditions: ['Christianity', 'Islam', 'Judaism'], date: '2026-04-05', location: 'Community Interfaith Center', participants: 42, description: 'A potluck dinner where neighbors share food from their traditions and the stories behind them.' },
  { id: '2', title: 'Sacred Texts Reading Circle', traditions: ['Hinduism', 'Buddhism', 'Sikhism'], date: '2026-04-12', location: 'City Library, Room 3B', participants: 18, description: 'Reading passages from the Bhagavad Gita, Dhammapada, and Guru Granth Sahib — finding common threads of wisdom.' },
];

const DEMO_PRAYER_REQUESTS: PrayerRequest[] = [
  { id: '1', intention: 'Healing for a family member facing a difficult diagnosis.', supportCount: 34, date: '2026-03-28', anonymous: true },
  { id: '2', intention: 'Peace and comfort for communities affected by recent flooding.', supportCount: 89, date: '2026-03-27', anonymous: true },
  { id: '3', intention: 'Guidance and strength for students facing examinations.', supportCount: 22, date: '2026-03-26', anonymous: true },
];

const DEMO_LEADERS: SpiritualLeader[] = [
  { id: '1', name: 'Rev. Sarah Mitchell', title: 'Pastor', tradition: 'Christianity', community: 'Hope Community Church', icon: 'C' },
  { id: '2', name: 'Imam Yusuf Al-Rashid', title: 'Imam', tradition: 'Islam', community: 'Al-Noor Mosque', icon: 'I' },
  { id: '3', name: 'Rabbi Miriam Goldstein', title: 'Rabbi', tradition: 'Judaism', community: 'Beth Shalom Synagogue', icon: 'J' },
  { id: '4', name: 'Bhante Sumedho', title: 'Monk', tradition: 'Buddhism', community: 'Shanti Meditation Center', icon: 'B' },
  { id: '5', name: 'Elder Running Deer', title: 'Spiritual Guide', tradition: 'Indigenous', community: 'Sacred Grove Circle', icon: 'N' },
];

type Tab = 'calendar' | 'spaces' | 'dialogue' | 'prayer';

export function PrayerScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('calendar');
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
    tabActive: { backgroundColor: t.accent.blue + '20' },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.blue },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    heroCard: { backgroundColor: t.accent.purple + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    heroText: { color: t.text.primary, fontSize: 15, fontWeight: fonts.semibold, textAlign: 'center', lineHeight: 22 },
    // Calendar
    observanceRow: { flexDirection: 'row', borderBottomColor: t.bg.primary, borderBottomWidth: 1, paddingVertical: 14 },
    observanceIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    observanceIconText: { color: '#fff', fontSize: 16, fontWeight: fonts.heavy },
    observanceInfo: { flex: 1 },
    observanceName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    observanceTradition: { fontSize: 12, fontWeight: fonts.semibold, marginTop: 2 },
    observanceDate: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    observanceDesc: { color: t.text.secondary, fontSize: 13, marginTop: 4, lineHeight: 18 },
    // Spaces
    spaceCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    spaceHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    spaceIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    spaceIconText: { color: '#fff', fontSize: 13, fontWeight: fonts.heavy },
    spaceName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold, flex: 1 },
    spaceType: { fontSize: 12, fontWeight: fonts.semibold },
    spaceDetail: { color: t.text.muted, fontSize: 13, marginTop: 2 },
    // Dialogue
    dialogueCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    dialogueTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    dialogueMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    dialogueDesc: { color: t.text.secondary, fontSize: 13, marginTop: 6, lineHeight: 18 },
    traditionTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    traditionTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    traditionTagText: { color: '#fff', fontSize: 11, fontWeight: fonts.bold },
    participantBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
    participantText: { color: t.text.muted, fontSize: 12 },
    // Prayer requests
    prayerCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    prayerIntention: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold, lineHeight: 20 },
    prayerMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    prayerDate: { color: t.text.muted, fontSize: 12 },
    supportBtn: { backgroundColor: t.accent.purple + '20', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 },
    supportBtnText: { color: t.accent.purple, fontSize: 13, fontWeight: fonts.bold },
    addPrayerBtn: { backgroundColor: t.accent.purple, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginHorizontal: 20, marginTop: 8, marginBottom: 16 },
    addPrayerBtnText: { color: '#fff', fontSize: 16, fontWeight: fonts.bold },
    // Leaders
    leaderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    leaderIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    leaderIconText: { color: '#fff', fontSize: 14, fontWeight: fonts.heavy },
    leaderInfo: { flex: 1 },
    leaderName: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    leaderTitle: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    leaderCommunity: { color: t.text.secondary, fontSize: 12 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },
  }), [t]);

  // ─── Tabs ───

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'calendar', label: 'Calendar' },
    { key: 'spaces', label: 'Spaces' },
    { key: 'dialogue', label: 'Dialogue' },
    { key: 'prayer', label: 'Prayer' },
  ];

  // ─── Calendar Tab ───

  const renderCalendar = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroText}>
          Every tradition lights a path toward the same truth —{'\n'}
          that we are all connected.{'\n\n'}
          Upcoming observances from all faith traditions.
        </Text>
      </View>

      <Text style={s.sectionTitle}>Upcoming Observances</Text>
      <View style={s.card}>
        {DEMO_OBSERVANCES.map((obs) => {
          const color = TRADITION_COLORS[obs.tradition] || '#8E8E93';
          return (
            <View key={obs.id} style={s.observanceRow}>
              <View style={[s.observanceIcon, { backgroundColor: color }]}>
                <Text style={s.observanceIconText}>{obs.icon}</Text>
              </View>
              <View style={s.observanceInfo}>
                <Text style={s.observanceName}>{obs.name}</Text>
                <Text style={[s.observanceTradition, { color }]}>{obs.tradition}</Text>
                <Text style={s.observanceDate}>{obs.date}</Text>
                <Text style={s.observanceDesc}>{obs.description}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </>
  );

  // ─── Spaces Tab ───

  const renderSpaces = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroText}>
          Sacred spaces belong to everyone.{'\n'}
          Find a place of peace near you.
        </Text>
      </View>

      <Text style={s.sectionTitle}>Worship Spaces Near You</Text>
      {DEMO_SPACES.map((space) => {
        const color = TRADITION_COLORS[space.tradition] || '#8E8E93';
        return (
          <View key={space.id} style={s.spaceCard}>
            <View style={s.spaceHeader}>
              <View style={[s.spaceIcon, { backgroundColor: color }]}>
                <Text style={s.spaceIconText}>{space.icon}</Text>
              </View>
              <Text style={s.spaceName}>{space.name}</Text>
            </View>
            <Text style={[s.spaceType, { color }]}>{space.type} — {space.tradition}</Text>
            <Text style={s.spaceDetail}>{space.address}</Text>
            <Text style={s.spaceDetail}>{space.openHours}</Text>
          </View>
        );
      })}

      {/* Spiritual Leaders */}
      <Text style={[s.sectionTitle, { marginTop: 8 }]}>Spiritual Leaders</Text>
      <View style={s.card}>
        {DEMO_LEADERS.map((leader) => {
          const color = TRADITION_COLORS[leader.tradition] || '#8E8E93';
          return (
            <View key={leader.id} style={s.leaderRow}>
              <View style={[s.leaderIcon, { backgroundColor: color }]}>
                <Text style={s.leaderIconText}>{leader.icon}</Text>
              </View>
              <View style={s.leaderInfo}>
                <Text style={s.leaderName}>{leader.name}</Text>
                <Text style={s.leaderTitle}>{leader.title} — {leader.tradition}</Text>
                <Text style={s.leaderCommunity}>{leader.community}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </>
  );

  // ─── Dialogue Tab ───

  const renderDialogue = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroText}>
          Interfaith dialogue builds bridges, not walls.{'\n\n'}
          When we listen to understand rather than to respond,{'\n'}
          we discover how much we share.
        </Text>
      </View>

      <Text style={s.sectionTitle}>Upcoming Dialogue Events</Text>
      {DEMO_DIALOGUE_EVENTS.map((evt) => (
        <View key={evt.id} style={s.dialogueCard}>
          <Text style={s.dialogueTitle}>{evt.title}</Text>
          <Text style={s.dialogueMeta}>{evt.date} | {evt.location}</Text>
          <Text style={s.dialogueDesc}>{evt.description}</Text>
          <View style={s.traditionTagRow}>
            {evt.traditions.map((trad) => (
              <View key={trad} style={[s.traditionTag, { backgroundColor: TRADITION_COLORS[trad] || '#8E8E93' }]}>
                <Text style={s.traditionTagText}>{trad}</Text>
              </View>
            ))}
          </View>
          <View style={s.participantBadge}>
            <Text style={s.participantText}>{evt.participants} neighbors attending</Text>
          </View>
        </View>
      ))}

      {/* Interfaith Solidarity */}
      <Text style={[s.sectionTitle, { marginTop: 8 }]}>Interfaith Solidarity</Text>
      <View style={s.card}>
        <Text style={s.heroText}>
          Joint community service events bring people of all faiths{'\n'}
          together through action.{'\n\n'}
          Next event: Community Garden Build{'\n'}
          April 19, 2026 — All welcome.
        </Text>
      </View>
    </>
  );

  // ─── Prayer Tab ───

  const renderPrayer = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroText}>
          Prayer knows no denomination.{'\n\n'}
          These requests are anonymous — you can hold{'\n'}
          someone in your thoughts regardless of tradition.
        </Text>
      </View>

      <Text style={s.sectionTitle}>Community Prayer Requests</Text>
      {DEMO_PRAYER_REQUESTS.map((req) => (
        <View key={req.id} style={s.prayerCard}>
          <Text style={s.prayerIntention}>{req.intention}</Text>
          <View style={s.prayerMeta}>
            <Text style={s.prayerDate}>{req.date}</Text>
            <TouchableOpacity
              style={s.supportBtn}
              onPress={() => Alert.alert('Prayer Support', 'Your support has been noted. Thank you for holding this intention.')}
            >
              <Text style={s.supportBtnText}>{req.supportCount} supporting</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={s.addPrayerBtn}
        onPress={() => Alert.alert('Submit Prayer Request', 'Your request will be shared anonymously with the community.')}
      >
        <Text style={s.addPrayerBtnText}>Submit a Prayer Request</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Interfaith Community</Text>
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
        {tab === 'calendar' && renderCalendar()}
        {tab === 'spaces' && renderSpaces()}
        {tab === 'dialogue' && renderDialogue()}
        {tab === 'prayer' && renderPrayer()}
      </ScrollView>
    </SafeAreaView>
  );
}
