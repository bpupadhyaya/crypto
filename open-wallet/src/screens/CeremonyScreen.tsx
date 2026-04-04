import { fonts } from '../utils/theme';
/**
 * Ceremony Screen — Community ceremonies, rites of passage, celebrations of life.
 *
 * Article I: "Every milestone in human life deserves communal recognition
 *  and celebration — from birth naming to memorial."
 * — Human Constitution
 *
 * Features:
 * - Ceremony types: birth naming, coming of age, graduation, wedding, retirement, memorial, seasonal
 * - Upcoming ceremonies (community-wide celebrations)
 * - Request ceremony support (community help with organizing)
 * - Ceremony traditions directory (how different cultures celebrate milestones)
 * - Gratitude ceremonies — dedicated OTK gratitude events
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

interface Ceremony {
  id: string;
  type: string;
  title: string;
  date: string;
  location: string;
  hostUID: string;
  hostName: string;
  attendees: number;
  description: string;
  otkPledged: number;
}

interface Tradition {
  id: string;
  culture: string;
  milestoneType: string;
  name: string;
  description: string;
  elements: string[];
  region: string;
}

interface CeremonyRequest {
  id: string;
  requesterUID: string;
  requesterName: string;
  ceremonyType: string;
  date: string;
  helpNeeded: string;
  volunteersNeeded: number;
  volunteersJoined: number;
  otkBudget: number;
}

interface GratitudeCeremony {
  id: string;
  title: string;
  date: string;
  honorees: string[];
  otkDistributed: number;
  attendees: number;
  channel: string;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const CEREMONY_TYPES = [
  { key: 'birth_naming', label: 'Birth Naming', icon: 'B' },
  { key: 'coming_of_age', label: 'Coming of Age', icon: 'A' },
  { key: 'graduation', label: 'Graduation', icon: 'G' },
  { key: 'wedding', label: 'Wedding', icon: 'W' },
  { key: 'retirement', label: 'Retirement', icon: 'R' },
  { key: 'memorial', label: 'Memorial', icon: 'M' },
  { key: 'seasonal', label: 'Seasonal', icon: 'S' },
];

// ─── Demo Data ───

const DEMO_UPCOMING: Ceremony[] = [
  { id: 'c1', type: 'graduation', title: 'Class of 2026 Community Graduation', date: '2026-04-12', location: 'Riverside Amphitheater', hostUID: 'org_education_council', hostName: 'Education Council', attendees: 142, description: 'Celebrating all community graduates — high school, college, and trade certifications.', otkPledged: 8500 },
  { id: 'c2', type: 'birth_naming', title: 'Spring Naming Ceremony', date: '2026-04-05', location: 'Community Garden Pavilion', hostUID: 'org_families_circle', hostName: 'Families Circle', attendees: 38, description: 'Welcoming six newborns to the community with naming blessings from elders.', otkPledged: 3200 },
  { id: 'c3', type: 'seasonal', title: 'Spring Equinox Gathering', date: '2026-03-30', location: 'Oak Hill Commons', hostUID: 'org_nature_collective', hostName: 'Nature Collective', attendees: 85, description: 'Celebrating the turning of seasons with music, planting, and shared meals.', otkPledged: 4100 },
];

const DEMO_TRADITIONS: Tradition[] = [
  { id: 't1', culture: 'Maasai', milestoneType: 'coming_of_age', name: 'Eunoto', description: 'Warrior graduation ceremony marking the transition from junior to senior warrior, involving head shaving, blessing by elders, and community feast.', elements: ['Elder blessings', 'Head shaving', 'Community feast', 'Cattle gifting'], region: 'East Africa' },
  { id: 't2', culture: 'Japanese', milestoneType: 'coming_of_age', name: 'Seijin-shiki', description: 'Coming of Age Day ceremony for those turning 20, with formal attire, municipal celebrations, and family gatherings.', elements: ['Formal kimono/hakama', 'Municipal ceremony', 'Shrine visit', 'Family dinner'], region: 'Japan' },
  { id: 't3', culture: 'Hindu', milestoneType: 'birth_naming', name: 'Namkaran', description: 'Sacred naming ceremony performed on the 11th or 12th day after birth, where the baby receives their name through Vedic rituals.', elements: ['Vedic mantras', 'Honey and ghee offering', 'Cradle ceremony', 'Community blessings'], region: 'South Asia' },
  { id: 't4', culture: 'Celtic', milestoneType: 'seasonal', name: 'Beltane', description: 'Ancient fire festival celebrating the beginning of summer, fertility, and the earth awakening with bonfires and dancing.', elements: ['Bonfire lighting', 'Maypole dance', 'Flower crowns', 'Feasting'], region: 'British Isles' },
];

const DEMO_REQUESTS: CeremonyRequest[] = [
  { id: 'r1', requesterUID: 'openchain1abc...parent_elena', requesterName: 'Elena R.', ceremonyType: 'birth_naming', date: '2026-04-08', helpNeeded: 'Need volunteers for decoration, food preparation, and elder coordination for twin naming ceremony.', volunteersNeeded: 8, volunteersJoined: 3, otkBudget: 1200 },
  { id: 'r2', requesterUID: 'openchain1def...graduate_kenji', requesterName: 'Kenji M.', ceremonyType: 'graduation', date: '2026-04-15', helpNeeded: 'Looking for community musicians, photographers, and someone to lead the blessing ritual for a small graduation gathering.', volunteersNeeded: 5, volunteersJoined: 2, otkBudget: 800 },
];

const DEMO_GRATITUDE_CEREMONIES: GratitudeCeremony[] = [
  { id: 'g1', title: 'Teachers Gratitude Evening', date: '2026-04-10', honorees: ['Ms. Patel — 30 years of service', 'Mr. Okonkwo — STEM mentor', 'Coach Rivera — youth athletics'], otkDistributed: 12500, attendees: 67, channel: 'eOTK' },
  { id: 'g2', title: 'Elder Appreciation Day', date: '2026-04-20', honorees: ['Community elders council', 'Volunteer grandparents program'], otkDistributed: 8200, attendees: 94, channel: 'nOTK' },
];

type Tab = 'upcoming' | 'traditions' | 'request' | 'gratitude';

export function CeremonyScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('upcoming');
  const [reqType, setReqType] = useState('');
  const [reqDate, setReqDate] = useState('');
  const [reqHelp, setReqHelp] = useState('');
  const [reqVolunteers, setReqVolunteers] = useState('');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const upcoming = DEMO_UPCOMING;
  const traditions = DEMO_TRADITIONS;
  const requests = DEMO_REQUESTS;
  const gratitudeCeremonies = DEMO_GRATITUDE_CEREMONIES;

  const handleRequestSubmit = useCallback(() => {
    if (!reqType) { Alert.alert('Required', 'Select a ceremony type.'); return; }
    if (!reqDate.trim()) { Alert.alert('Required', 'Enter a date for the ceremony.'); return; }
    if (!reqHelp.trim()) { Alert.alert('Required', 'Describe what help you need.'); return; }

    Alert.alert(
      'Request Submitted',
      `Your ${CEREMONY_TYPES.find(ct => ct.key === reqType)?.label || reqType} ceremony request has been posted to the community.\n\nVolunteers will be notified.`,
    );
    setReqType('');
    setReqDate('');
    setReqHelp('');
    setReqVolunteers('');
    setTab('upcoming');
  }, [reqType, reqDate, reqHelp]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.purple + '20' },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.purple },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    heroCard: { backgroundColor: t.accent.purple + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, marginBottom: 16, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    ceremonyCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    ceremonyType: { color: t.accent.purple, fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1 },
    ceremonyTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginTop: 4 },
    ceremonyMeta: { color: t.text.muted, fontSize: 12, marginTop: 4, lineHeight: 18 },
    ceremonyDesc: { color: t.text.secondary, fontSize: 13, marginTop: 8, lineHeight: 20 },
    ceremonyFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopColor: t.bg.primary, borderTopWidth: 1 },
    attendeesText: { color: t.text.muted, fontSize: 12 },
    otkText: { color: t.accent.purple, fontSize: 14, fontWeight: fonts.bold },
    joinBtn: { backgroundColor: t.accent.purple, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    joinBtnText: { color: '#fff', fontSize: 13, fontWeight: fonts.semibold },
    traditionCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    traditionCulture: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1 },
    traditionName: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginTop: 4 },
    traditionRegion: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    traditionDesc: { color: t.text.secondary, fontSize: 13, marginTop: 8, lineHeight: 20 },
    elementsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    elementChip: { backgroundColor: t.accent.orange + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    elementText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.semibold },
    requestCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    requestName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    requestType: { color: t.accent.purple, fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
    requestHelp: { color: t.text.secondary, fontSize: 13, marginTop: 8, lineHeight: 20 },
    requestProgress: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    progressText: { color: t.text.muted, fontSize: 12 },
    volunteerBtn: { backgroundColor: t.accent.green, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    volunteerBtnText: { color: '#fff', fontSize: 13, fontWeight: fonts.semibold },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: t.bg.primary },
    typeChipSelected: { backgroundColor: t.accent.purple + '20', borderColor: t.accent.purple },
    typeChipText: { color: t.text.muted, fontSize: 13, fontWeight: fonts.semibold },
    typeChipTextSelected: { color: t.accent.purple },
    submitBtn: { backgroundColor: t.accent.purple, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    gratitudeCard: { backgroundColor: t.accent.purple + '08', borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    gratitudeTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    gratitudeChannel: { color: t.accent.purple, fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
    gratitudeMeta: { color: t.text.muted, fontSize: 12, marginTop: 6 },
    honoreeList: { marginTop: 8 },
    honoreeItem: { color: t.text.secondary, fontSize: 13, lineHeight: 22 },
    gratitudeOtk: { color: t.accent.purple, fontSize: 16, fontWeight: fonts.heavy, marginTop: 8 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },
  }), [t]);

  // ─── Tabs ───

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'traditions', label: 'Traditions' },
    { key: 'request', label: 'Request' },
    { key: 'gratitude', label: 'Gratitude' },
  ];

  // ─── Upcoming Tab ───

  const renderUpcoming = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>C</Text>
        <Text style={s.heroTitle}>Community Ceremonies</Text>
        <Text style={s.heroSubtitle}>
          Celebrating life's milestones together — from first breath to final farewell, every passage deserves communal recognition.
        </Text>
      </View>

      <Text style={s.sectionTitle}>Upcoming Ceremonies</Text>

      {upcoming.map((c) => {
        const typeInfo = CEREMONY_TYPES.find(ct => ct.key === c.type);
        return (
          <View key={c.id} style={s.ceremonyCard}>
            <Text style={s.ceremonyType}>{typeInfo?.label || c.type}</Text>
            <Text style={s.ceremonyTitle}>{c.title}</Text>
            <Text style={s.ceremonyMeta}>{c.date}  |  {c.location}  |  Hosted by {c.hostName}</Text>
            <Text style={s.ceremonyDesc}>{c.description}</Text>
            <View style={s.ceremonyFooter}>
              <Text style={s.attendeesText}>{c.attendees} attending</Text>
              <Text style={s.otkText}>{c.otkPledged.toLocaleString()} OTK pledged</Text>
              <TouchableOpacity style={s.joinBtn} onPress={() => Alert.alert('Joined', `You are now attending "${c.title}".`)}>
                <Text style={s.joinBtnText}>Attend</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </>
  );

  // ─── Traditions Tab ───

  const renderTraditions = () => (
    <>
      <Text style={s.sectionTitle}>Ceremony Traditions Directory</Text>
      <Text style={[s.heroSubtitle, { marginHorizontal: 20, marginBottom: 16 }]}>
        How different cultures celebrate life's milestones — learn, share, and honor diverse traditions.
      </Text>

      {traditions.map((tr) => (
        <View key={tr.id} style={s.traditionCard}>
          <Text style={s.traditionCulture}>{tr.culture} — {CEREMONY_TYPES.find(ct => ct.key === tr.milestoneType)?.label || tr.milestoneType}</Text>
          <Text style={s.traditionName}>{tr.name}</Text>
          <Text style={s.traditionRegion}>{tr.region}</Text>
          <Text style={s.traditionDesc}>{tr.description}</Text>
          <View style={s.elementsRow}>
            {tr.elements.map((el) => (
              <View key={el} style={s.elementChip}>
                <Text style={s.elementText}>{el}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </>
  );

  // ─── Request Tab ───

  const renderRequest = () => (
    <>
      <Text style={s.sectionTitle}>Request Ceremony Support</Text>
      <Text style={[s.heroSubtitle, { marginHorizontal: 20, marginBottom: 16 }]}>
        Need help organizing a ceremony? Post a request and community volunteers will step up.
      </Text>

      <View style={s.card}>
        <Text style={[s.ceremonyType, { marginBottom: 8 }]}>New Request</Text>

        <View style={s.typeGrid}>
          {CEREMONY_TYPES.map((ct) => (
            <TouchableOpacity
              key={ct.key}
              style={[s.typeChip, reqType === ct.key && s.typeChipSelected]}
              onPress={() => setReqType(ct.key)}
            >
              <Text style={[s.typeChipText, reqType === ct.key && s.typeChipTextSelected]}>
                {ct.icon} {ct.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput style={s.input} placeholder="Date (YYYY-MM-DD)" placeholderTextColor={t.text.muted} value={reqDate} onChangeText={setReqDate} />
        <TextInput style={s.input} placeholder="What help do you need?" placeholderTextColor={t.text.muted} value={reqHelp} onChangeText={setReqHelp} multiline />
        <TextInput style={s.input} placeholder="Volunteers needed (number)" placeholderTextColor={t.text.muted} value={reqVolunteers} onChangeText={setReqVolunteers} keyboardType="number-pad" />

        <TouchableOpacity style={s.submitBtn} onPress={handleRequestSubmit}>
          <Text style={s.submitText}>Submit Request</Text>
        </TouchableOpacity>
      </View>

      <Text style={[s.sectionTitle, { marginTop: 8 }]}>Open Requests</Text>

      {requests.map((r) => (
        <View key={r.id} style={s.requestCard}>
          <Text style={s.requestName}>{r.requesterName}</Text>
          <Text style={s.requestType}>{CEREMONY_TYPES.find(ct => ct.key === r.ceremonyType)?.label || r.ceremonyType} — {r.date}</Text>
          <Text style={s.requestHelp}>{r.helpNeeded}</Text>
          <View style={s.requestProgress}>
            <Text style={s.progressText}>{r.volunteersJoined}/{r.volunteersNeeded} volunteers  |  {r.otkBudget} OTK budget</Text>
            <TouchableOpacity style={s.volunteerBtn} onPress={() => Alert.alert('Volunteered', `You signed up to help ${r.requesterName} with their ceremony.`)}>
              <Text style={s.volunteerBtnText}>Help</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </>
  );

  // ─── Gratitude Tab ───

  const renderGratitude = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>G</Text>
        <Text style={s.heroTitle}>Gratitude Ceremonies</Text>
        <Text style={s.heroSubtitle}>
          Dedicated community events where OTK is distributed to honorees — formal recognition of those who shaped us.
        </Text>
      </View>

      {gratitudeCeremonies.map((g) => (
        <View key={g.id} style={s.gratitudeCard}>
          <Text style={s.gratitudeTitle}>{g.title}</Text>
          <Text style={s.gratitudeChannel}>{g.channel} Channel  |  {g.date}</Text>
          <Text style={s.gratitudeMeta}>{g.attendees} attendees</Text>
          <View style={s.honoreeList}>
            {g.honorees.map((h, i) => (
              <Text key={i} style={s.honoreeItem}>  {h}</Text>
            ))}
          </View>
          <Text style={s.gratitudeOtk}>{g.otkDistributed.toLocaleString()} OTK distributed</Text>
        </View>
      ))}

      <TouchableOpacity
        style={[s.submitBtn, { marginHorizontal: 20, marginTop: 8 }]}
        onPress={() => Alert.alert('Coming Soon', 'Organizing gratitude ceremonies will be available when the community module launches.')}
      >
        <Text style={s.submitText}>Organize Gratitude Ceremony</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Ceremonies</Text>
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

      <ScrollView contentContainerStyle={s.scroll}>
        {tab === 'upcoming' && renderUpcoming()}
        {tab === 'traditions' && renderTraditions()}
        {tab === 'request' && renderRequest()}
        {tab === 'gratitude' && renderGratitude()}
      </ScrollView>
    </SafeAreaView>
  );
}
