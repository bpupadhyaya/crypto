import { fonts } from '../utils/theme';
/**
 * Grief Support Screen — Bereavement peer support, loss community.
 *
 * Article I: "Every dimension of human contribution is valued equally."
 * Grief support recognizes the profound human need for compassion and
 * community during life's most difficult transitions.
 *
 * Features:
 * - Support types: loss of loved one, pet, job, relationship, health diagnosis
 * - Peer support circles (small groups, similar experiences)
 * - Resource library: coping strategies, grief stages, self-care guides
 * - Memorial wall — honor memories (name, message, optional photo hash)
 * - Professional referrals (therapists, counselors in region)
 * - Anonymous support option
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

interface SupportCircle {
  id: string;
  name: string;
  type: string;
  members: number;
  maxMembers: number;
  nextMeeting: string;
  facilitator: string;
  anonymous: boolean;
  description: string;
}

interface Resource {
  id: string;
  title: string;
  category: string;
  description: string;
  type: 'article' | 'guide' | 'video' | 'hotline';
  readTime?: string;
  phone?: string;
}

interface MemorialEntry {
  id: string;
  name: string;
  message: string;
  photoHash?: string;
  date: string;
  author: string;
  anonymous: boolean;
}

interface ProfessionalReferral {
  id: string;
  name: string;
  specialty: string;
  region: string;
  acceptingNew: boolean;
  rating: number;
  telehealth: boolean;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const SUPPORT_TYPES = [
  { key: 'loved_one', label: 'Loss of Loved One', icon: 'H' },
  { key: 'pet', label: 'Loss of Pet', icon: 'P' },
  { key: 'job', label: 'Job Loss', icon: 'J' },
  { key: 'relationship', label: 'Relationship Loss', icon: 'R' },
  { key: 'health', label: 'Health Diagnosis', icon: 'D' },
];

const GRIEF_STAGES = [
  { stage: 'Denial', description: 'Shock and disbelief — a natural defense mechanism.' },
  { stage: 'Anger', description: 'Frustration and helplessness — a necessary step toward healing.' },
  { stage: 'Bargaining', description: '"What if..." and "If only..." — searching for meaning.' },
  { stage: 'Depression', description: 'Deep sadness — the quiet before acceptance.' },
  { stage: 'Acceptance', description: 'Finding a way forward — grief does not end, it transforms.' },
];

// ─── Demo Data ───

const DEMO_CIRCLES: SupportCircle[] = [
  {
    id: '1',
    name: 'Healing Hearts',
    type: 'loved_one',
    members: 6,
    maxMembers: 8,
    nextMeeting: '2026-04-01 7:00 PM',
    facilitator: 'Sarah M.',
    anonymous: false,
    description: 'A safe space for those who have lost a spouse or partner. We meet weekly to share, listen, and support one another.',
  },
  {
    id: '2',
    name: 'New Beginnings',
    type: 'job',
    members: 4,
    maxMembers: 10,
    nextMeeting: '2026-04-02 6:30 PM',
    facilitator: 'James L.',
    anonymous: true,
    description: 'Processing job loss, identity shifts, and rebuilding confidence. Anonymous participation available.',
  },
];

const DEMO_RESOURCES: Resource[] = [
  {
    id: '1',
    title: 'Understanding the Five Stages of Grief',
    category: 'guide',
    description: 'A compassionate walkthrough of the grief process — what to expect and how to be gentle with yourself.',
    type: 'guide',
    readTime: '8 min',
  },
  {
    id: '2',
    title: 'Self-Care During Loss',
    category: 'self_care',
    description: 'Practical daily strategies for maintaining physical and emotional health while grieving.',
    type: 'article',
    readTime: '5 min',
  },
  {
    id: '3',
    title: 'Crisis Support Hotline',
    category: 'emergency',
    description: '24/7 confidential support for those in acute grief or crisis. You are not alone.',
    type: 'hotline',
    phone: '988',
  },
];

const DEMO_MEMORIALS: MemorialEntry[] = [
  {
    id: '1',
    name: 'Margaret Chen',
    message: 'Your kindness touched everyone who knew you. The garden you planted still blooms every spring.',
    date: '2026-03-15',
    author: 'David C.',
    anonymous: false,
  },
  {
    id: '2',
    name: 'Buddy',
    message: '14 years of unconditional love. You were the best companion anyone could ask for.',
    date: '2026-03-20',
    author: 'Anonymous',
    anonymous: true,
    photoHash: 'Qm...abc123',
  },
];

const DEMO_REFERRALS: ProfessionalReferral[] = [
  { id: '1', name: 'Dr. Elena Vasquez', specialty: 'Grief & Bereavement', region: 'Northeast', acceptingNew: true, rating: 4.9, telehealth: true },
  { id: '2', name: 'Dr. Michael Osei', specialty: 'Loss & Trauma', region: 'Midwest', acceptingNew: true, rating: 4.7, telehealth: true },
  { id: '3', name: 'Lisa Park, LCSW', specialty: 'Family Loss Counseling', region: 'West Coast', acceptingNew: false, rating: 4.8, telehealth: false },
];

type Tab = 'support' | 'circles' | 'resources' | 'memorial';

export function GriefSupportScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('support');
  const [selectedType, setSelectedType] = useState('');
  const [memorialName, setMemorialName] = useState('');
  const [memorialMessage, setMemorialMessage] = useState('');
  const [anonymousMode, setAnonymousMode] = useState(false);
  const [showReferrals, setShowReferrals] = useState(false);
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const circles = DEMO_CIRCLES;
  const resources = DEMO_RESOURCES;
  const memorials = DEMO_MEMORIALS;
  const referrals = DEMO_REFERRALS;

  const filteredCircles = selectedType
    ? circles.filter((c) => c.type === selectedType)
    : circles;

  const handleJoinCircle = useCallback((circle: SupportCircle) => {
    if (circle.members >= circle.maxMembers) {
      Alert.alert('Circle Full', 'This circle is currently at capacity. You can join the waitlist.');
      return;
    }
    Alert.alert(
      'Join Circle',
      `Join "${circle.name}"?\n\nNext meeting: ${circle.nextMeeting}\nFacilitator: ${circle.facilitator}${circle.anonymous ? '\n\nAnonymous participation available.' : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Join', onPress: () => Alert.alert('Joined', `You have been added to "${circle.name}". You will be notified before the next meeting.`) },
      ],
    );
  }, []);

  const handleSubmitMemorial = useCallback(() => {
    if (!memorialName.trim()) { Alert.alert('Required', 'Please enter a name to honor.'); return; }
    if (!memorialMessage.trim()) { Alert.alert('Required', 'Please write a message of remembrance.'); return; }

    Alert.alert(
      'Memorial Submitted',
      `Your tribute to ${memorialName} has been added to the memorial wall.${anonymousMode ? '\n\nPosted anonymously.' : ''}`,
    );
    setMemorialName('');
    setMemorialMessage('');
  }, [memorialName, memorialMessage, anonymousMode]);

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
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy, textAlign: 'center', marginTop: 8 },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginBottom: 16 },
    typeChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: t.bg.secondary, backgroundColor: t.bg.secondary, alignItems: 'center', minWidth: 90 },
    typeChipActive: { backgroundColor: t.accent.purple, borderColor: t.accent.purple },
    typeIcon: { fontSize: 16, fontWeight: fonts.bold, color: t.text.secondary, marginBottom: 2 },
    typeIconActive: { color: '#fff' },
    typeLabel: { color: t.text.secondary, fontSize: 11, fontWeight: fonts.semibold },
    typeLabelActive: { color: '#fff' },
    stageRow: { flexDirection: 'row', marginBottom: 12, paddingRight: 8 },
    stageNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: t.accent.purple + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 2 },
    stageNumberText: { color: t.accent.purple, fontSize: 13, fontWeight: fonts.bold },
    stageInfo: { flex: 1 },
    stageTitle: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    stageDesc: { color: t.text.muted, fontSize: 12, marginTop: 2, lineHeight: 18 },
    circleCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    circleName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    circleType: { color: t.accent.purple, fontSize: 11, fontWeight: fonts.semibold, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
    circleDesc: { color: t.text.muted, fontSize: 13, marginTop: 8, lineHeight: 19 },
    circleMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
    circleMeta: { color: t.text.secondary, fontSize: 12 },
    circleAnon: { color: t.accent.green, fontSize: 11, fontWeight: fonts.semibold },
    joinBtn: { backgroundColor: t.accent.purple, borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginTop: 12 },
    joinBtnFull: { backgroundColor: t.bg.primary },
    joinBtnText: { color: '#fff', fontSize: 14, fontWeight: fonts.bold },
    joinBtnTextFull: { color: t.text.muted },
    resourceCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    resourceTitle: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    resourceType: { color: t.accent.blue, fontSize: 11, fontWeight: fonts.semibold, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
    resourceDesc: { color: t.text.muted, fontSize: 13, marginTop: 8, lineHeight: 19 },
    resourceMeta: { color: t.text.secondary, fontSize: 12, marginTop: 8 },
    resourcePhone: { color: t.accent.green, fontSize: 16, fontWeight: fonts.heavy, marginTop: 4 },
    memorialCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    memorialName: { color: t.text.primary, fontSize: 16, fontWeight: fonts.heavy },
    memorialMessage: { color: t.text.secondary, fontSize: 14, marginTop: 8, lineHeight: 21, fontStyle: 'italic' },
    memorialMeta: { color: t.text.muted, fontSize: 11, marginTop: 10 },
    memorialPhoto: { color: t.accent.blue, fontSize: 11, marginTop: 4 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    messageInput: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, minHeight: 100, textAlignVertical: 'top', marginBottom: 12 },
    anonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    anonLabel: { color: t.text.secondary, fontSize: 14, fontWeight: fonts.semibold },
    anonToggle: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: t.accent.purple },
    anonToggleActive: { backgroundColor: t.accent.purple },
    anonToggleText: { color: t.accent.purple, fontSize: 13, fontWeight: fonts.semibold },
    anonToggleTextActive: { color: '#fff' },
    submitBtn: { backgroundColor: t.accent.purple, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: fonts.bold },
    referralBtn: { backgroundColor: t.bg.secondary, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginHorizontal: 20, marginBottom: 16 },
    referralBtnText: { color: t.accent.blue, fontSize: 14, fontWeight: fonts.semibold },
    referralCard: { backgroundColor: t.bg.secondary, borderRadius: 12, padding: 14, marginHorizontal: 20, marginBottom: 10 },
    referralName: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    referralSpecialty: { color: t.accent.purple, fontSize: 12, marginTop: 2 },
    referralDetails: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    referralRegion: { color: t.text.muted, fontSize: 12 },
    referralStatus: { fontSize: 12, fontWeight: fonts.semibold },
    referralRating: { color: t.text.secondary, fontSize: 12, marginTop: 4 },
    disclaimer: { color: t.text.muted, fontSize: 11, textAlign: 'center', marginHorizontal: 32, marginTop: 8, marginBottom: 16, lineHeight: 16 },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 24 },
  }), [t]);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'support', label: 'Support' },
    { key: 'circles', label: 'Circles' },
    { key: 'resources', label: 'Resources' },
    { key: 'memorial', label: 'Memorial' },
  ];

  // ─── Render: Support Tab ───

  const renderSupport = () => (
    <>
      <View style={s.heroCard}>
        <Text style={{ fontSize: 40 }}>{'     '}</Text>
        <Text style={s.heroTitle}>You Are Not Alone</Text>
        <Text style={s.heroSubtitle}>
          Grief is a journey, not a destination. Find compassionate support from peers who understand what you are going through.
        </Text>
      </View>

      <Text style={s.sectionTitle}>What are you experiencing?</Text>
      <View style={s.typeGrid}>
        {SUPPORT_TYPES.map((st) => (
          <TouchableOpacity
            key={st.key}
            style={[s.typeChip, selectedType === st.key && s.typeChipActive]}
            onPress={() => setSelectedType(selectedType === st.key ? '' : st.key)}
          >
            <Text style={[s.typeIcon, selectedType === st.key && s.typeIconActive]}>{st.icon}</Text>
            <Text style={[s.typeLabel, selectedType === st.key && s.typeLabelActive]}>{st.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.sectionTitle}>Understanding Grief</Text>
      <View style={s.card}>
        {GRIEF_STAGES.map((gs, i) => (
          <View key={gs.stage} style={[s.stageRow, i === GRIEF_STAGES.length - 1 && { marginBottom: 0 }]}>
            <View style={s.stageNumber}>
              <Text style={s.stageNumberText}>{i + 1}</Text>
            </View>
            <View style={s.stageInfo}>
              <Text style={s.stageTitle}>{gs.stage}</Text>
              <Text style={s.stageDesc}>{gs.description}</Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={s.referralBtn} onPress={() => setShowReferrals(!showReferrals)}>
        <Text style={s.referralBtnText}>{showReferrals ? 'Hide' : 'Find'} Professional Support</Text>
      </TouchableOpacity>

      {showReferrals && referrals.map((r) => (
        <View key={r.id} style={s.referralCard}>
          <Text style={s.referralName}>{r.name}</Text>
          <Text style={s.referralSpecialty}>{r.specialty}</Text>
          <View style={s.referralDetails}>
            <Text style={s.referralRegion}>{r.region}{r.telehealth ? ' | Telehealth' : ''}</Text>
            <Text style={[s.referralStatus, { color: r.acceptingNew ? t.accent.green : t.text.muted }]}>
              {r.acceptingNew ? 'Accepting patients' : 'Waitlist'}
            </Text>
          </View>
          <Text style={s.referralRating}>Rating: {r.rating}/5.0</Text>
        </View>
      ))}

      <Text style={s.disclaimer}>
        This is a peer support community. For emergencies, please contact your local crisis line or call 988.
      </Text>
    </>
  );

  // ─── Render: Circles Tab ───

  const renderCircles = () => (
    <>
      <Text style={s.sectionTitle}>Peer Support Circles</Text>

      <View style={[s.typeGrid, { marginBottom: 8 }]}>
        {SUPPORT_TYPES.map((st) => (
          <TouchableOpacity
            key={st.key}
            style={[s.typeChip, selectedType === st.key && s.typeChipActive]}
            onPress={() => setSelectedType(selectedType === st.key ? '' : st.key)}
          >
            <Text style={[s.typeLabel, selectedType === st.key && s.typeLabelActive]}>{st.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredCircles.length === 0 ? (
        <Text style={s.emptyText}>No circles match this filter.</Text>
      ) : (
        filteredCircles.map((circle) => (
          <View key={circle.id} style={s.circleCard}>
            <Text style={s.circleName}>{circle.name}</Text>
            <Text style={s.circleType}>
              {SUPPORT_TYPES.find((st) => st.key === circle.type)?.label || circle.type}
            </Text>
            <Text style={s.circleDesc}>{circle.description}</Text>
            <View style={s.circleMetaRow}>
              <Text style={s.circleMeta}>{circle.members}/{circle.maxMembers} members</Text>
              <Text style={s.circleMeta}>Next: {circle.nextMeeting}</Text>
            </View>
            <View style={[s.circleMetaRow, { marginTop: 4 }]}>
              <Text style={s.circleMeta}>Facilitator: {circle.facilitator}</Text>
              {circle.anonymous && <Text style={s.circleAnon}>Anonymous OK</Text>}
            </View>
            <TouchableOpacity
              style={[s.joinBtn, circle.members >= circle.maxMembers && s.joinBtnFull]}
              onPress={() => handleJoinCircle(circle)}
            >
              <Text style={[s.joinBtnText, circle.members >= circle.maxMembers && s.joinBtnTextFull]}>
                {circle.members >= circle.maxMembers ? 'Join Waitlist' : 'Join Circle'}
              </Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </>
  );

  // ─── Render: Resources Tab ───

  const renderResources = () => (
    <>
      <Text style={s.sectionTitle}>Coping Resources</Text>

      {resources.map((r) => (
        <View key={r.id} style={s.resourceCard}>
          <Text style={s.resourceTitle}>{r.title}</Text>
          <Text style={s.resourceType}>{r.type}</Text>
          <Text style={s.resourceDesc}>{r.description}</Text>
          {r.readTime && <Text style={s.resourceMeta}>Read time: {r.readTime}</Text>}
          {r.phone && <Text style={s.resourcePhone}>Call: {r.phone}</Text>}
        </View>
      ))}

      <Text style={s.disclaimer}>
        Resources are provided for informational purposes. Always consult a qualified professional for personalized guidance.
      </Text>
    </>
  );

  // ─── Render: Memorial Tab ───

  const renderMemorial = () => (
    <>
      <Text style={s.sectionTitle}>Memorial Wall</Text>
      <Text style={[s.heroSubtitle, { marginHorizontal: 20, marginBottom: 16 }]}>
        Honor those who have touched your life. Their memory lives on through your words.
      </Text>

      {memorials.map((m) => (
        <View key={m.id} style={s.memorialCard}>
          <Text style={s.memorialName}>{m.name}</Text>
          <Text style={s.memorialMessage}>"{m.message}"</Text>
          <Text style={s.memorialMeta}>
            {m.anonymous ? 'Anonymous' : m.author} | {m.date}
          </Text>
          {m.photoHash && <Text style={s.memorialPhoto}>Photo attached (IPFS: {m.photoHash})</Text>}
        </View>
      ))}

      <Text style={[s.sectionTitle, { marginTop: 8 }]}>Add a Tribute</Text>
      <View style={s.card}>
        <TextInput
          style={s.input}
          placeholder="Name to honor"
          placeholderTextColor={t.text.muted}
          value={memorialName}
          onChangeText={setMemorialName}
        />
        <TextInput
          style={s.messageInput}
          placeholder="Write your message of remembrance..."
          placeholderTextColor={t.text.muted}
          value={memorialMessage}
          onChangeText={setMemorialMessage}
          multiline
        />
        <View style={s.anonRow}>
          <Text style={s.anonLabel}>Post anonymously</Text>
          <TouchableOpacity
            style={[s.anonToggle, anonymousMode && s.anonToggleActive]}
            onPress={() => setAnonymousMode(!anonymousMode)}
          >
            <Text style={[s.anonToggleText, anonymousMode && s.anonToggleTextActive]}>
              {anonymousMode ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={s.submitBtn} onPress={handleSubmitMemorial}>
          <Text style={s.submitBtnText}>Submit Tribute</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Grief Support</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={s.tabRow}>
        {TABS.map((tb) => (
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
        {tab === 'support' && renderSupport()}
        {tab === 'circles' && renderCircles()}
        {tab === 'resources' && renderResources()}
        {tab === 'memorial' && renderMemorial()}
      </ScrollView>
    </SafeAreaView>
  );
}
