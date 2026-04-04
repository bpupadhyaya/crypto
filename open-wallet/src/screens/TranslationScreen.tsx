import { fonts } from '../utils/theme';
/**
 * Translation Screen — Community translation service for documents and signs.
 *
 * Features:
 * - Translation requests from community members
 * - Translate interface for contributing translations
 * - History of completed translations
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

interface TranslationRequest {
  id: string;
  title: string;
  fromLang: string;
  toLang: string;
  type: 'document' | 'sign' | 'form' | 'conversation';
  urgency: 'low' | 'medium' | 'high';
  requester: string;
  date: string;
  cotkReward: number;
  wordCount: number;
}

interface TranslationRecord {
  id: string;
  title: string;
  fromLang: string;
  toLang: string;
  wordCount: number;
  date: string;
  cotkEarned: number;
  rating: number;
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_REQUESTS: TranslationRequest[] = [
  { id: 'tr1', title: 'School enrollment form', fromLang: 'English', toLang: 'Spanish', type: 'form', urgency: 'high', requester: 'Lincoln Elementary', date: '2026-03-28', cotkReward: 150, wordCount: 450 },
  { id: 'tr2', title: 'Community garden rules sign', fromLang: 'English', toLang: 'Mandarin', type: 'sign', urgency: 'medium', requester: 'Green Spaces Collective', date: '2026-03-27', cotkReward: 80, wordCount: 120 },
  { id: 'tr3', title: 'Health clinic intake form', fromLang: 'English', toLang: 'Arabic', type: 'form', urgency: 'high', requester: 'Community Health Center', date: '2026-03-28', cotkReward: 200, wordCount: 600 },
  { id: 'tr4', title: 'Neighborhood newsletter', fromLang: 'English', toLang: 'Vietnamese', type: 'document', urgency: 'low', requester: 'Neighborhood Association', date: '2026-03-26', cotkReward: 250, wordCount: 1200 },
  { id: 'tr5', title: 'Emergency evacuation guide', fromLang: 'English', toLang: 'Korean', type: 'document', urgency: 'high', requester: 'Emergency Services', date: '2026-03-29', cotkReward: 300, wordCount: 800 },
];

const DEMO_HISTORY: TranslationRecord[] = [
  { id: 'h1', title: 'Voting instruction sheet', fromLang: 'English', toLang: 'Spanish', wordCount: 350, date: '2026-03-20', cotkEarned: 120, rating: 5 },
  { id: 'h2', title: 'Library program flyer', fromLang: 'English', toLang: 'Mandarin', wordCount: 200, date: '2026-03-18', cotkEarned: 80, rating: 4 },
  { id: 'h3', title: 'Medical consent form', fromLang: 'English', toLang: 'Arabic', wordCount: 500, date: '2026-03-15', cotkEarned: 180, rating: 5 },
  { id: 'h4', title: 'Park rules signage', fromLang: 'English', toLang: 'Spanish', wordCount: 80, date: '2026-03-12', cotkEarned: 50, rating: 5 },
];

const URGENCY_COLORS: Record<string, string> = {
  low: '#34C759',
  medium: '#FF9500',
  high: '#FF3B30',
};

type Tab = 'requests' | 'translate' | 'history';

export function TranslationScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('requests');
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('English');
  const [targetLang, setTargetLang] = useState('Spanish');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const handleAccept = useCallback((req: TranslationRequest) => {
    Alert.alert(
      'Accept Request',
      `Translate "${req.title}"?\n\n${req.fromLang} → ${req.toLang}\n${req.wordCount} words\nReward: ${req.cotkReward} cOTK`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Accept', onPress: () => Alert.alert('Accepted', 'The document is ready for translation.') },
      ],
    );
  }, []);

  const handleSubmitTranslation = useCallback(() => {
    if (!sourceText.trim()) { Alert.alert('Required', 'Enter source text.'); return; }
    if (!translatedText.trim()) { Alert.alert('Required', 'Enter translated text.'); return; }
    Alert.alert('Submitted', `Translation from ${sourceLang} to ${targetLang} submitted for review.`);
    setSourceText('');
    setTranslatedText('');
  }, [sourceText, translatedText, sourceLang, targetLang]);

  const LANGUAGES = ['English', 'Spanish', 'Mandarin', 'Arabic', 'Vietnamese', 'Korean', 'French', 'Hindi'];

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.blue + '20' },
    tabText: { color: t.text.muted, fontSize: 13, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.blue },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    reqCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    reqTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    reqMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    langRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    langText: { color: t.accent.blue, fontSize: 13, fontWeight: fonts.semibold },
    langArrow: { color: t.text.muted, fontSize: 13, marginHorizontal: 8 },
    urgencyBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start', marginTop: 6 },
    urgencyText: { color: '#fff', fontSize: 11, fontWeight: fonts.semibold, textTransform: 'uppercase' },
    rewardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    rewardText: { color: t.accent.green, fontSize: 14, fontWeight: fonts.bold },
    acceptBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    acceptText: { color: '#fff', fontSize: 13, fontWeight: fonts.semibold },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12, minHeight: 80, textAlignVertical: 'top' },
    langGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    langChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: t.bg.primary },
    langChipSelected: { backgroundColor: t.accent.blue + '20', borderColor: t.accent.blue },
    langChipText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    langChipTextSelected: { color: t.accent.blue },
    submitBtn: { backgroundColor: t.accent.green, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    histRow: { paddingVertical: 12, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    histTitle: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    histMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    histCotk: { color: t.accent.green, fontSize: 13, fontWeight: fonts.bold, marginTop: 4 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
    summaryItem: { alignItems: 'center' },
    summaryValue: { color: t.text.primary, fontSize: 22, fontWeight: fonts.heavy },
    summaryLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    labelText: { color: t.text.muted, fontSize: 12, marginBottom: 6, fontWeight: fonts.semibold },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'requests', label: 'Requests' },
    { key: 'translate', label: 'Translate' },
    { key: 'history', label: 'History' },
  ];

  const renderRequests = () => (
    <>
      <Text style={s.sectionTitle}>Open Translation Requests</Text>
      {DEMO_REQUESTS.map((req) => (
        <View key={req.id} style={s.reqCard}>
          <Text style={s.reqTitle}>{req.title}</Text>
          <Text style={s.reqMeta}>{req.type} | {req.wordCount} words | {req.requester}</Text>
          <View style={s.langRow}>
            <Text style={s.langText}>{req.fromLang}</Text>
            <Text style={s.langArrow}>{'→'}</Text>
            <Text style={s.langText}>{req.toLang}</Text>
          </View>
          <View style={[s.urgencyBadge, { backgroundColor: URGENCY_COLORS[req.urgency] }]}>
            <Text style={s.urgencyText}>{req.urgency}</Text>
          </View>
          <View style={s.rewardRow}>
            <Text style={s.rewardText}>+{req.cotkReward} cOTK</Text>
            <TouchableOpacity style={s.acceptBtn} onPress={() => handleAccept(req)}>
              <Text style={s.acceptText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </>
  );

  const renderTranslate = () => (
    <View style={s.card}>
      <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Translate Text</Text>
      <Text style={s.labelText}>Source Language</Text>
      <View style={s.langGrid}>
        {LANGUAGES.map((lang) => (
          <TouchableOpacity key={lang} style={[s.langChip, sourceLang === lang && s.langChipSelected]} onPress={() => setSourceLang(lang)}>
            <Text style={[s.langChipText, sourceLang === lang && s.langChipTextSelected]}>{lang}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput style={s.input} placeholder="Paste source text here..." placeholderTextColor={t.text.muted} value={sourceText} onChangeText={setSourceText} multiline />
      <Text style={s.labelText}>Target Language</Text>
      <View style={s.langGrid}>
        {LANGUAGES.map((lang) => (
          <TouchableOpacity key={lang} style={[s.langChip, targetLang === lang && s.langChipSelected]} onPress={() => setTargetLang(lang)}>
            <Text style={[s.langChipText, targetLang === lang && s.langChipTextSelected]}>{lang}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput style={s.input} placeholder="Enter translation here..." placeholderTextColor={t.text.muted} value={translatedText} onChangeText={setTranslatedText} multiline />
      <TouchableOpacity style={s.submitBtn} onPress={handleSubmitTranslation}>
        <Text style={s.submitText}>Submit Translation</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHistory = () => (
    <>
      <View style={s.card}>
        <View style={s.summaryRow}>
          <View style={s.summaryItem}>
            <Text style={s.summaryValue}>{DEMO_HISTORY.length}</Text>
            <Text style={s.summaryLabel}>Translations</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={[s.summaryValue, { color: t.accent.green }]}>{DEMO_HISTORY.reduce((sum, h) => sum + h.cotkEarned, 0)}</Text>
            <Text style={s.summaryLabel}>cOTK Earned</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={s.summaryValue}>{DEMO_HISTORY.reduce((sum, h) => sum + h.wordCount, 0)}</Text>
            <Text style={s.summaryLabel}>Words</Text>
          </View>
        </View>
      </View>
      <View style={s.card}>
        {DEMO_HISTORY.map((h) => (
          <View key={h.id} style={s.histRow}>
            <Text style={s.histTitle}>{h.title}</Text>
            <Text style={s.histMeta}>{h.fromLang} → {h.toLang} | {h.wordCount} words | {h.date}</Text>
            <Text style={s.histCotk}>+{h.cotkEarned} cOTK | {'*'.repeat(h.rating)} ({h.rating}/5)</Text>
          </View>
        ))}
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Translation</Text>
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
        {tab === 'requests' && renderRequests()}
        {tab === 'translate' && renderTranslate()}
        {tab === 'history' && renderHistory()}
      </ScrollView>
    </SafeAreaView>
  );
}
