import { fonts } from '../utils/theme';
/**
 * Time Capsule Screen — Create time capsules (messages to future self/community).
 *
 * Allows users to write sealed messages with unlock dates, view countdown
 * timers on sealed capsules, read unlocked capsules, and browse community
 * capsules addressed to future residents.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// --- Types ---

type Recipient = 'self' | 'person' | 'community';
type CapsuleTab = 'create' | 'sealed' | 'unlocked' | 'community';

interface TimeCapsule {
  id: string;
  message: string;
  author: string;
  recipient: Recipient;
  recipientName?: string;
  createdAt: number;   // epoch ms
  unlockAt: number;    // epoch ms
  opened: boolean;
}

const RECIPIENT_LABELS: Record<Recipient, string> = {
  self: 'Myself',
  person: 'A Person',
  community: 'Community',
};

const RECIPIENT_ICONS: Record<Recipient, string> = {
  self: '\u{1F4DD}',      // memo
  person: '\u{1F464}',    // bust
  community: '\u{1F30D}', // globe
};

// --- Demo data ---

const NOW = Date.now();
const DAY = 86_400_000;

const DEMO_CAPSULES: TimeCapsule[] = [
  {
    id: 'tc_001',
    message: 'Dear future me — I hope you kept up the habit of mentoring new community members. Remember why you started.',
    author: 'You',
    recipient: 'self',
    createdAt: NOW - 30 * DAY,
    unlockAt: NOW + 180 * DAY,
    opened: false,
  },
  {
    id: 'tc_002',
    message: 'To the next generation of residents: we planted 200 trees along the river trail this spring. Take care of them for us.',
    author: 'River Trail Committee',
    recipient: 'community',
    createdAt: NOW - 60 * DAY,
    unlockAt: NOW + 365 * DAY,
    opened: false,
  },
  {
    id: 'tc_003',
    message: 'One year ago I was nervous about joining the savings circle. Today I own my first market stall. Never give up.',
    author: 'You',
    recipient: 'self',
    createdAt: NOW - 400 * DAY,
    unlockAt: NOW - 35 * DAY,
    opened: true,
  },
];

// --- Helpers ---

function daysUntil(epoch: number): number {
  return Math.max(0, Math.ceil((epoch - NOW) / DAY));
}

function formatDate(epoch: number): string {
  return new Date(epoch).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// --- Component ---

interface Props {
  onClose: () => void;
}

export function TimeCapsuleScreen({ onClose }: Props) {
  const t = useTheme();
  const demoMode = useWalletStore((s) => s.demoMode);

  const [tab, setTab] = useState<CapsuleTab>('sealed');
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState<Recipient>('self');
  const [recipientName, setRecipientName] = useState('');
  const [unlockDays, setUnlockDays] = useState('180');

  const capsules = DEMO_CAPSULES;

  const sealed = useMemo(() => capsules.filter(c => !c.opened && c.recipient !== 'community'), [capsules]);
  const unlocked = useMemo(() => capsules.filter(c => c.opened), [capsules]);
  const community = useMemo(() => capsules.filter(c => c.recipient === 'community'), [capsules]);

  const tabs: { key: CapsuleTab; label: string }[] = [
    { key: 'create', label: 'Create' },
    { key: 'sealed', label: `Sealed (${sealed.length})` },
    { key: 'unlocked', label: `Unlocked (${unlocked.length})` },
    { key: 'community', label: `Community (${community.length})` },
  ];

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    headerTitle: { color: t.text.primary, fontSize: 20, fontWeight: fonts.bold },
    closeText: { color: t.accent.blue, fontSize: 16 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 8, gap: 4 },
    tabBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: t.bg.card },
    tabBtnActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 20, marginBottom: 8, marginLeft: 4 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    cardTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 4 },
    cardSub: { color: t.text.secondary, fontSize: 13, lineHeight: 19 },
    cardMeta: { color: t.text.muted, fontSize: 11, marginTop: 8 },
    countdownRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    countdownText: { color: t.accent.blue, fontSize: 14, fontWeight: fonts.bold, marginLeft: 6 },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: fonts.semibold, marginTop: 16, marginBottom: 6 },
    input: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15 },
    textArea: { minHeight: 100, textAlignVertical: 'top' },
    recipientRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
    recipientBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: t.bg.card, alignItems: 'center' },
    recipientBtnActive: { backgroundColor: t.accent.blue },
    recipientBtnText: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.semibold },
    recipientBtnTextActive: { color: '#fff' },
    sealBtn: { backgroundColor: t.accent.blue, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
    sealBtnText: { color: '#fff', fontSize: 16, fontWeight: fonts.bold },
    sealedIcon: { fontSize: 28, textAlign: 'center', marginBottom: 8 },
    unlockedMsg: { color: t.text.primary, fontSize: 14, lineHeight: 21, fontStyle: 'italic', marginTop: 8 },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40 },
  }), [t]);

  const renderCreate = () => (
    <View>
      <Text style={st.section}>New Time Capsule</Text>
      <Text style={st.inputLabel}>Your Message</Text>
      <TextInput
        style={[st.input, st.textArea]}
        placeholder="Write a message to the future..."
        placeholderTextColor={t.text.muted}
        value={message}
        onChangeText={setMessage}
        multiline
      />
      <Text style={st.inputLabel}>Recipient</Text>
      <View style={st.recipientRow}>
        {(['self', 'person', 'community'] as Recipient[]).map(r => (
          <TouchableOpacity
            key={r}
            style={[st.recipientBtn, recipient === r && st.recipientBtnActive]}
            onPress={() => setRecipient(r)}
          >
            <Text style={[st.recipientBtnText, recipient === r && st.recipientBtnTextActive]}>
              {RECIPIENT_ICONS[r]} {RECIPIENT_LABELS[r]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {recipient === 'person' && (
        <>
          <Text style={st.inputLabel}>Recipient Name</Text>
          <TextInput
            style={st.input}
            placeholder="Who is this for?"
            placeholderTextColor={t.text.muted}
            value={recipientName}
            onChangeText={setRecipientName}
          />
        </>
      )}
      <Text style={st.inputLabel}>Unlock After (days)</Text>
      <TextInput
        style={st.input}
        placeholder="180"
        placeholderTextColor={t.text.muted}
        value={unlockDays}
        onChangeText={setUnlockDays}
        keyboardType="numeric"
      />
      <TouchableOpacity style={st.sealBtn}>
        <Text style={st.sealBtnText}>{'\u{1F512}'} Seal Capsule</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSealed = () => (
    <View>
      <Text style={st.section}>Sealed Capsules</Text>
      {sealed.length === 0 ? (
        <Text style={st.emptyText}>No sealed capsules yet.</Text>
      ) : sealed.map(c => (
        <View key={c.id} style={st.card}>
          <Text style={st.sealedIcon}>{'\u{1F512}'}</Text>
          <Text style={st.cardTitle}>
            {RECIPIENT_ICONS[c.recipient]} To {RECIPIENT_LABELS[c.recipient]}
          </Text>
          <Text style={st.cardSub}>This capsule is sealed and cannot be read until it unlocks.</Text>
          <View style={st.countdownRow}>
            <Text style={st.countdownText}>
              {'\u23F3'} {daysUntil(c.unlockAt)} days remaining
            </Text>
          </View>
          <Text style={st.cardMeta}>
            Created {formatDate(c.createdAt)} {'\u2022'} Unlocks {formatDate(c.unlockAt)}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderUnlocked = () => (
    <View>
      <Text style={st.section}>Unlocked Capsules</Text>
      {unlocked.length === 0 ? (
        <Text style={st.emptyText}>No unlocked capsules yet.</Text>
      ) : unlocked.map(c => (
        <View key={c.id} style={st.card}>
          <Text style={st.cardTitle}>
            {'\u{1F513}'} {RECIPIENT_ICONS[c.recipient]} Message from the Past
          </Text>
          <Text style={st.unlockedMsg}>"{c.message}"</Text>
          <Text style={st.cardMeta}>
            Written {formatDate(c.createdAt)} {'\u2022'} Opened {formatDate(c.unlockAt)}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderCommunity = () => (
    <View>
      <Text style={st.section}>Community Capsules</Text>
      {community.length === 0 ? (
        <Text style={st.emptyText}>No community capsules yet.</Text>
      ) : community.map(c => (
        <View key={c.id} style={st.card}>
          <Text style={st.sealedIcon}>{c.opened ? '\u{1F513}' : '\u{1F512}'}</Text>
          <Text style={st.cardTitle}>
            {'\u{1F30D}'} From: {c.author}
          </Text>
          {c.opened ? (
            <Text style={st.unlockedMsg}>"{c.message}"</Text>
          ) : (
            <>
              <Text style={st.cardSub}>A message for future community members.</Text>
              <View style={st.countdownRow}>
                <Text style={st.countdownText}>
                  {'\u23F3'} {daysUntil(c.unlockAt)} days remaining
                </Text>
              </View>
            </>
          )}
          <Text style={st.cardMeta}>
            Created {formatDate(c.createdAt)} {'\u2022'} {c.opened ? 'Opened' : 'Unlocks'} {formatDate(c.unlockAt)}
          </Text>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.headerTitle}>{'\u23F3'} Time Capsules</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeText}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={st.tabRow}>
        {tabs.map(tb => (
          <TouchableOpacity
            key={tb.key}
            style={[st.tabBtn, tab === tb.key && st.tabBtnActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={[st.tabText, tab === tb.key && st.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={st.scroll}>
        {tab === 'create' && renderCreate()}
        {tab === 'sealed' && renderSealed()}
        {tab === 'unlocked' && renderUnlocked()}
        {tab === 'community' && renderCommunity()}
      </ScrollView>
    </SafeAreaView>
  );
}
