import { fonts } from '../utils/theme';
/**
 * Memorial Screen — Community memorials, remembering those who passed.
 *
 * "Every life leaves a mark on the chain of humanity. To remember
 *  is to honor the value they gave to the world."
 * — The Human Constitution, Article I
 *
 * A memorial wall for the community to honor those who have passed,
 * organize remembrance events, leave tributes, and support bereaved
 * families through a community memorial fund.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

type Tab = 'wall' | 'events' | 'tribute' | 'fund';

interface Memorial {
  id: string;
  name: string;
  birthDate: string;
  passedDate: string;
  message: string;
  photoHash: string;
  tributeCount: number;
  notkReceived: number;
}

interface CommunityEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  attendees: number;
  type: 'annual_remembrance' | 'memorial_garden' | 'candlelight_vigil' | 'tribute_walk';
}

interface Tribute {
  id: string;
  memorialId: string;
  memorialName: string;
  message: string;
  type: 'message' | 'candle' | 'notk_honor';
  notkAmount?: number;
  author: string;
  date: string;
}

const DEMO_MEMORIALS: Memorial[] = [
  {
    id: 'mem-001', name: 'Maria Santos', birthDate: '1942-06-15', passedDate: '2025-11-03',
    message: 'A mother of five, community elder, and tireless volunteer who fed thousands.',
    photoHash: 'QmX7e...a3F9', tributeCount: 47, notkReceived: 12500,
  },
  {
    id: 'mem-002', name: 'Dr. Arun Patel', birthDate: '1955-01-22', passedDate: '2026-01-18',
    message: 'Beloved village doctor who treated patients for 40 years, often without charge.',
    photoHash: 'QmR4k...b7E2', tributeCount: 83, notkReceived: 28700,
  },
  {
    id: 'mem-003', name: 'Grandmother Chen', birthDate: '1938-09-08', passedDate: '2025-08-12',
    message: 'Her garden fed the neighborhood. Her stories shaped a generation.',
    photoHash: 'QmL2n...c1D5', tributeCount: 31, notkReceived: 8400,
  },
  {
    id: 'mem-004', name: 'Thomas Okafor', birthDate: '1960-04-30', passedDate: '2026-02-20',
    message: 'Master teacher who mentored over 500 students in mathematics and life.',
    photoHash: 'QmW9p...d4A8', tributeCount: 121, notkReceived: 41200,
  },
  {
    id: 'mem-005', name: 'Ruth Bergman', birthDate: '1950-12-01', passedDate: '2025-06-25',
    message: 'Community mediator, peacemaker, and keeper of neighborhood harmony for decades.',
    photoHash: 'QmH3j...e6B1', tributeCount: 56, notkReceived: 15800,
  },
];

const DEMO_EVENTS: CommunityEvent[] = [
  {
    id: 'evt-001', title: 'Annual Community Remembrance Day',
    date: '2026-04-15', location: 'Community Memorial Garden',
    description: 'A day to honor all who have passed this year. Candlelight ceremony at sunset, shared stories, and communal meal.',
    attendees: 234, type: 'annual_remembrance',
  },
  {
    id: 'evt-002', title: 'Memorial Garden Planting Ceremony',
    date: '2026-05-01', location: 'Riverside Park, Section B',
    description: 'Plant a tree or flower in memory of a loved one. Each plant is tagged with on-chain memorial data.',
    attendees: 67, type: 'memorial_garden',
  },
];

const DEMO_TRIBUTE: Tribute = {
  id: 'trib-001', memorialId: 'mem-002', memorialName: 'Dr. Arun Patel',
  message: 'He saved my daughter when no other doctor would come. Forever grateful.',
  type: 'notk_honor', notkAmount: 500, author: 'Anonymous',
  date: '2026-03-20',
};

const DEMO_FUND_BALANCE = 185400;
const DEMO_FUND_FAMILIES_HELPED = 12;
const DEMO_FUND_CONTRIBUTORS = 89;

const EVENT_ICONS: Record<string, string> = {
  annual_remembrance: '\ud83d\udd6f\ufe0f',
  memorial_garden: '\ud83c\udf33',
  candlelight_vigil: '\ud83d\udd6f\ufe0f',
  tribute_walk: '\ud83d\udeb6',
};

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'wall', label: 'Wall', icon: '\ud83e\udea6' },
  { key: 'events', label: 'Events', icon: '\ud83d\udd6f\ufe0f' },
  { key: 'tribute', label: 'Tribute', icon: '\ud83d\udd6f\ufe0f' },
  { key: 'fund', label: 'Fund', icon: '\ud83d\udcb0' },
];

export function MemorialScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('wall');
  const [memorials] = useState<Memorial[]>(DEMO_MEMORIALS);
  const [events] = useState<CommunityEvent[]>(DEMO_EVENTS);
  const [tributeMessage, setTributeMessage] = useState('');
  const [tributeAmount, setTributeAmount] = useState('');
  const [selectedMemorial, setSelectedMemorial] = useState<string>(DEMO_MEMORIALS[0].id);
  const [tributeType, setTributeType] = useState<'message' | 'candle' | 'notk_honor'>('message');
  const t = useTheme();
  const demoMode = useWalletStore((s: any) => s.demoMode);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    heroCard: { backgroundColor: t.accent.purple + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 20, backgroundColor: t.bg.card, borderRadius: 16, padding: 4 },
    tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
    tabBtnActive: { backgroundColor: t.accent.purple },
    tabText: { color: t.text.secondary, fontSize: fonts.xs, fontWeight: fonts.bold },
    tabTextActive: { color: '#fff' },
    tabIcon: { fontSize: fonts.xl, marginBottom: 2 },
    section: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 24 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    cardIcon: { fontSize: fonts.xxl, marginRight: 10 },
    cardName: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, flex: 1 },
    cardDates: { color: t.text.secondary, fontSize: fonts.sm, marginBottom: 6 },
    cardMessage: { color: t.text.primary, fontSize: fonts.md, lineHeight: 22, fontStyle: 'italic' },
    cardMeta: { color: t.text.muted, fontSize: fonts.xs, marginTop: 8 },
    cardPhoto: { color: t.text.muted, fontSize: fonts.xs, fontFamily: 'Courier', marginTop: 4 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: t.border },
    statItem: { alignItems: 'center', flex: 1 },
    statValue: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    eventCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    eventIcon: { fontSize: fonts.xxxl, marginRight: 10 },
    eventTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, flex: 1 },
    eventDate: { color: t.accent.blue, fontSize: fonts.sm, fontWeight: fonts.semibold, marginTop: 4 },
    eventLocation: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 2 },
    eventDesc: { color: t.text.primary, fontSize: fonts.sm, lineHeight: 20, marginTop: 8 },
    eventAttendees: { color: t.text.muted, fontSize: fonts.sm, marginTop: 8 },
    tributeTypeRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, flexWrap: 'wrap', marginBottom: 12 },
    tributeChip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, backgroundColor: t.bg.card, alignItems: 'center' },
    tributeChipActive: { backgroundColor: t.accent.purple },
    tributeChipIcon: { fontSize: fonts.xxl, marginBottom: 4 },
    tributeChipLabel: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tributeChipLabelActive: { color: '#fff' },
    selectRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, flexWrap: 'wrap', marginBottom: 12 },
    selectChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: t.bg.card },
    selectChipActive: { backgroundColor: t.accent.blue },
    selectChipText: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    selectChipTextActive: { color: '#fff' },
    inputCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 8 },
    inputLabel: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md },
    messageInput: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md, minHeight: 100, textAlignVertical: 'top' },
    recentTribute: { backgroundColor: t.accent.orange + '10', borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 12 },
    recentLabel: { color: t.text.secondary, fontSize: fonts.xs, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    recentMessage: { color: t.text.primary, fontSize: fonts.md, lineHeight: 22, fontStyle: 'italic' },
    recentMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 8 },
    fundCard: { backgroundColor: t.accent.green + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 12, alignItems: 'center' },
    fundBalance: { color: t.accent.green, fontSize: fonts.xxxl, fontWeight: fonts.heavy },
    fundLabel: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    fundStatsRow: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 20, marginTop: 16 },
    fundStatBox: { alignItems: 'center', flex: 1 },
    fundStatValue: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    fundStatLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    actionBtn: { backgroundColor: t.accent.purple, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginHorizontal: 20, marginTop: 16 },
    actionBtnText: { color: '#fff', fontSize: fonts.lg, fontWeight: fonts.bold },
    secondaryBtn: { backgroundColor: t.bg.card, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginHorizontal: 20, marginTop: 10 },
    secondaryBtnText: { color: t.accent.purple, fontSize: fonts.lg, fontWeight: fonts.bold },
    note: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginHorizontal: 24, marginTop: 16, lineHeight: 18 },
  }), [t]);

  // ─── Wall Tab ───
  const renderWall = useCallback(() => (
    <>
      <Text style={s.section}>Memorial Wall</Text>
      {memorials.map((m) => (
        <View key={m.id} style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardIcon}>{'\ud83e\udea6'}</Text>
            <Text style={s.cardName}>{m.name}</Text>
          </View>
          <Text style={s.cardDates}>{m.birthDate} — {m.passedDate}</Text>
          <Text style={s.cardMessage}>"{m.message}"</Text>
          <Text style={s.cardPhoto}>Photo: {m.photoHash}</Text>
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={s.statValue}>{m.tributeCount}</Text>
              <Text style={s.statLabel}>Tributes</Text>
            </View>
            <View style={s.statItem}>
              <Text style={s.statValue}>{m.notkReceived.toLocaleString()}</Text>
              <Text style={s.statLabel}>nOTK Received</Text>
            </View>
          </View>
        </View>
      ))}
      <TouchableOpacity style={s.actionBtn} onPress={() => Alert.alert('Add Memorial', 'Submit a memorial to honor someone who has passed. Community verification required.')}>
        <Text style={s.actionBtnText}>Add a Memorial</Text>
      </TouchableOpacity>
    </>
  ), [memorials, s]);

  // ─── Events Tab ───
  const renderEvents = useCallback(() => (
    <>
      <Text style={s.section}>Community Remembrance Events</Text>
      {events.map((ev) => (
        <View key={ev.id} style={s.eventCard}>
          <View style={s.cardHeader}>
            <Text style={s.eventIcon}>{EVENT_ICONS[ev.type] || '\ud83d\udd6f\ufe0f'}</Text>
            <Text style={s.eventTitle}>{ev.title}</Text>
          </View>
          <Text style={s.eventDate}>{ev.date}</Text>
          <Text style={s.eventLocation}>{ev.location}</Text>
          <Text style={s.eventDesc}>{ev.description}</Text>
          <Text style={s.eventAttendees}>{ev.attendees} attending</Text>
        </View>
      ))}
      <TouchableOpacity style={s.actionBtn} onPress={() => Alert.alert('RSVP', 'You have been registered for this community event.')}>
        <Text style={s.actionBtnText}>RSVP to Next Event</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.secondaryBtn} onPress={() => Alert.alert('Create Event', 'Propose a new community remembrance event for governance approval.')}>
        <Text style={s.secondaryBtnText}>Propose New Event</Text>
      </TouchableOpacity>
      <Text style={s.note}>
        Memorial Day Calendar: Community-wide remembrance dates are set by governance vote. All events are recorded on-chain.
      </Text>
    </>
  ), [events, s]);

  // ─── Tribute Tab ───
  const renderTribute = useCallback(() => (
    <>
      <Text style={s.section}>Leave a Tribute</Text>

      <Text style={[s.section, { marginTop: 16 }]}>Tribute Type</Text>
      <View style={s.tributeTypeRow}>
        {([
          { key: 'message' as const, icon: '\u270d\ufe0f', label: 'Message' },
          { key: 'candle' as const, icon: '\ud83d\udd6f\ufe0f', label: 'Light Candle' },
          { key: 'notk_honor' as const, icon: '\ud83d\udc9b', label: 'Send nOTK' },
        ]).map((tt) => (
          <TouchableOpacity
            key={tt.key}
            style={[s.tributeChip, tributeType === tt.key && s.tributeChipActive]}
            onPress={() => setTributeType(tt.key)}
          >
            <Text style={s.tributeChipIcon}>{tt.icon}</Text>
            <Text style={[s.tributeChipLabel, tributeType === tt.key && s.tributeChipLabelActive]}>{tt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[s.section, { marginTop: 8 }]}>In Honor Of</Text>
      <View style={s.selectRow}>
        {memorials.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={[s.selectChip, selectedMemorial === m.id && s.selectChipActive]}
            onPress={() => setSelectedMemorial(m.id)}
          >
            <Text style={[s.selectChipText, selectedMemorial === m.id && s.selectChipTextActive]}>{m.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Your Message</Text>
        <TextInput
          style={s.messageInput}
          value={tributeMessage}
          onChangeText={setTributeMessage}
          placeholder="Write your tribute message..."
          placeholderTextColor={t.text.muted}
          multiline
        />
      </View>

      {tributeType === 'notk_honor' && (
        <View style={[s.inputCard, { marginTop: 12 }]}>
          <Text style={s.inputLabel}>nOTK Amount (in honor)</Text>
          <TextInput
            style={s.input}
            value={tributeAmount}
            onChangeText={setTributeAmount}
            placeholder="100"
            placeholderTextColor={t.text.muted}
            keyboardType="numeric"
          />
        </View>
      )}

      <TouchableOpacity
        style={s.actionBtn}
        onPress={() => {
          if (!tributeMessage.trim()) {
            Alert.alert('Message Required', 'Please write a tribute message.');
            return;
          }
          Alert.alert('Tribute Sent', `Your ${tributeType === 'candle' ? 'virtual candle' : tributeType === 'notk_honor' ? 'nOTK tribute' : 'message'} has been recorded on-chain in honor of ${memorials.find(m => m.id === selectedMemorial)?.name || 'the departed'}.`);
          setTributeMessage('');
          setTributeAmount('');
        }}
      >
        <Text style={s.actionBtnText}>
          {tributeType === 'candle' ? 'Light Virtual Candle' : tributeType === 'notk_honor' ? 'Send nOTK in Honor' : 'Leave Tribute'}
        </Text>
      </TouchableOpacity>

      {/* Recent tribute */}
      <Text style={[s.section, { marginTop: 24 }]}>Recent Tribute</Text>
      <View style={s.recentTribute}>
        <Text style={s.recentLabel}>In honor of {DEMO_TRIBUTE.memorialName}</Text>
        <Text style={s.recentMessage}>"{DEMO_TRIBUTE.message}"</Text>
        <Text style={s.recentMeta}>
          {DEMO_TRIBUTE.author} · {DEMO_TRIBUTE.date}
          {DEMO_TRIBUTE.notkAmount ? ` · ${DEMO_TRIBUTE.notkAmount} nOTK` : ''}
        </Text>
      </View>
    </>
  ), [memorials, tributeMessage, tributeAmount, tributeType, selectedMemorial, s, t]);

  // ─── Fund Tab ───
  const renderFund = useCallback(() => (
    <>
      <Text style={s.section}>Memorial Fund</Text>

      <View style={s.fundCard}>
        <Text style={s.heroIcon}>{'\ud83d\udcb0'}</Text>
        <Text style={s.fundBalance}>{DEMO_FUND_BALANCE.toLocaleString()} nOTK</Text>
        <Text style={s.fundLabel}>Community Memorial Fund Balance</Text>
      </View>

      <View style={s.fundStatsRow}>
        <View style={s.fundStatBox}>
          <Text style={s.fundStatValue}>{DEMO_FUND_FAMILIES_HELPED}</Text>
          <Text style={s.fundStatLabel}>Families Helped</Text>
        </View>
        <View style={s.fundStatBox}>
          <Text style={s.fundStatValue}>{DEMO_FUND_CONTRIBUTORS}</Text>
          <Text style={s.fundStatLabel}>Contributors</Text>
        </View>
      </View>

      <Text style={[s.section, { marginTop: 24 }]}>How It Works</Text>
      <View style={s.card}>
        <Text style={s.cardMessage}>
          The Memorial Fund is a community-governed pool that supports bereaved families with immediate needs — funeral costs, children's education continuation, and eldercare transitions. Contributions are voluntary and all disbursements require governance approval.
        </Text>
      </View>

      <TouchableOpacity style={s.actionBtn} onPress={() => Alert.alert('Contribute', 'Your nOTK contribution to the Memorial Fund will be recorded on-chain.')}>
        <Text style={s.actionBtnText}>Contribute to Fund</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.secondaryBtn} onPress={() => Alert.alert('Request Support', 'Submit a support request for a bereaved family. Requires community verification.')}>
        <Text style={s.secondaryBtnText}>Request Family Support</Text>
      </TouchableOpacity>
      <Text style={s.note}>
        All fund transactions are transparent and on-chain. Disbursements are governed by community vote to ensure fairness and accountability.
      </Text>
    </>
  ), [s]);

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Memorial</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={s.heroCard}>
          <Text style={s.heroIcon}>{'\ud83e\udea6'}</Text>
          <Text style={s.heroTitle}>Community Memorials</Text>
          <Text style={s.heroSubtitle}>
            Remembering those who passed, honoring their legacy,{'\n'}
            and supporting families left behind.
          </Text>
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
        {tab === 'wall' && renderWall()}
        {tab === 'events' && renderEvents()}
        {tab === 'tribute' && renderTribute()}
        {tab === 'fund' && renderFund()}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
