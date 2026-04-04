import { fonts } from '../utils/theme';
/**
 * Mentor Directory Screen — Comprehensive directory of all community mentors.
 *
 * Article I: "Knowledge shared is knowledge multiplied."
 * Article III: mOTK recognizes mentoring as one of the highest human contributions.
 *
 * Features:
 * - Searchable mentor directory with expertise filters
 * - Expertise categories and skill tags
 * - Connection requests and scheduling
 * - Mentor profiles with ratings and availability
 * - Community endorsements
 * - Demo mode with sample mentor data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface Mentor {
  id: string;
  name: string;
  title: string;
  expertise: string[];
  bio: string;
  rating: number;
  sessionsCompleted: number;
  motkEarned: number;
  available: boolean;
  responseTime: string;
  languages: string[];
}

interface ExpertiseCategory {
  key: string;
  label: string;
  mentorCount: number;
}

interface ConnectionRequest {
  id: string;
  mentorId: string;
  mentorName: string;
  topic: string;
  status: 'pending' | 'accepted' | 'scheduled' | 'completed';
  date: string;
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_MENTORS: Mentor[] = [
  { id: 'm1', name: 'Dr. Sarah Chen', title: 'Senior Software Architect', expertise: ['Software Engineering', 'System Design', 'Career Growth'], bio: '20 years in tech. Passionate about helping new developers find their path.', rating: 4.9, sessionsCompleted: 156, motkEarned: 23400, available: true, responseTime: '< 24h', languages: ['English', 'Mandarin'] },
  { id: 'm2', name: 'James Rivera', title: 'Entrepreneur & Investor', expertise: ['Startups', 'Fundraising', 'Business Strategy'], bio: 'Founded 3 companies. Angel investor. Love helping first-time founders.', rating: 4.8, sessionsCompleted: 89, motkEarned: 13350, available: true, responseTime: '< 48h', languages: ['English', 'Spanish'] },
  { id: 'm3', name: 'Dr. Aisha Okonkwo', title: 'Research Scientist', expertise: ['Data Science', 'Machine Learning', 'Research Methods'], bio: 'PhD in AI. Helping aspiring researchers navigate academia and industry.', rating: 4.9, sessionsCompleted: 72, motkEarned: 10800, available: false, responseTime: '< 72h', languages: ['English', 'French'] },
  { id: 'm4', name: 'Raj Patel', title: 'Financial Advisor', expertise: ['Personal Finance', 'Investment', 'Retirement Planning'], bio: 'Certified financial planner. Everyone deserves financial literacy.', rating: 4.7, sessionsCompleted: 134, motkEarned: 20100, available: true, responseTime: '< 24h', languages: ['English', 'Hindi'] },
  { id: 'm5', name: 'Maria Gonzalez', title: 'Community Health Worker', expertise: ['Healthcare', 'Mental Health', 'Wellness'], bio: '15 years in community health. Mentoring future healthcare workers.', rating: 4.8, sessionsCompleted: 98, motkEarned: 14700, available: true, responseTime: '< 24h', languages: ['English', 'Spanish'] },
  { id: 'm6', name: 'Li Wei', title: 'Blockchain Developer', expertise: ['Blockchain', 'Smart Contracts', 'DeFi'], bio: 'Core contributor to Open Chain. Teaching the next generation of chain builders.', rating: 4.9, sessionsCompleted: 64, motkEarned: 9600, available: true, responseTime: '< 48h', languages: ['English', 'Mandarin'] },
];

const DEMO_EXPERTISE: ExpertiseCategory[] = [
  { key: 'tech', label: 'Technology', mentorCount: 24 },
  { key: 'business', label: 'Business', mentorCount: 18 },
  { key: 'health', label: 'Healthcare', mentorCount: 12 },
  { key: 'finance', label: 'Finance', mentorCount: 15 },
  { key: 'education', label: 'Education', mentorCount: 20 },
  { key: 'arts', label: 'Arts & Creative', mentorCount: 8 },
  { key: 'trades', label: 'Skilled Trades', mentorCount: 10 },
  { key: 'leadership', label: 'Leadership', mentorCount: 14 },
];

const DEMO_CONNECTIONS: ConnectionRequest[] = [
  { id: 'cr1', mentorId: 'm1', mentorName: 'Dr. Sarah Chen', topic: 'Career transition to software engineering', status: 'scheduled', date: '2026-04-02' },
  { id: 'cr2', mentorId: 'm4', mentorName: 'Raj Patel', topic: 'Retirement planning with OTK staking', status: 'completed', date: '2026-03-25' },
  { id: 'cr3', mentorId: 'm6', mentorName: 'Li Wei', topic: 'Building on Open Chain', status: 'pending', date: '2026-03-29' },
];

type Tab = 'directory' | 'expertise' | 'connect';

export function MentorDirectoryScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState('');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const filteredMentors = useMemo(() => {
    let result = DEMO_MENTORS;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((m) =>
        m.name.toLowerCase().includes(q) ||
        m.expertise.some((e) => e.toLowerCase().includes(q)) ||
        m.title.toLowerCase().includes(q)
      );
    }
    return result;
  }, [searchQuery]);

  const handleConnect = useCallback((mentor: Mentor) => {
    if (!mentor.available) {
      Alert.alert('Unavailable', `${mentor.name} is currently not accepting new mentees. Check back later.`);
      return;
    }
    Alert.alert('Connection Request', `Send a mentoring request to ${mentor.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send', onPress: () => Alert.alert('Request Sent', `${mentor.name} will respond within ${mentor.responseTime}.`) },
    ]);
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.blue + '20' },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.blue },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    searchInput: { backgroundColor: t.bg.secondary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md, marginHorizontal: 20, marginBottom: 16 },
    mentorCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    mentorName: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold },
    mentorTitle: { color: t.accent.blue, fontSize: fonts.sm, fontWeight: fonts.semibold, marginTop: 2 },
    mentorBio: { color: t.text.muted, fontSize: fonts.sm, marginTop: 8, lineHeight: 20 },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    tag: { backgroundColor: t.accent.blue + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    tagText: { color: t.accent.blue, fontSize: fonts.xs, fontWeight: fonts.semibold },
    mentorStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopColor: t.bg.primary, borderTopWidth: 1 },
    mentorStat: { alignItems: 'center' },
    mentorStatVal: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.heavy },
    mentorStatLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    mentorFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    availability: { fontSize: fonts.sm, fontWeight: fonts.bold },
    connectBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    connectBtnText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.semibold },
    expertiseCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    expertiseLabel: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    expertiseCount: { color: t.text.muted, fontSize: fonts.sm },
    connectionCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    connectionName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    connectionTopic: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    connectionStatus: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
    connectionStatusText: { color: '#fff', fontSize: fonts.xs, fontWeight: fonts.bold },
    connectionDate: { color: t.text.muted, fontSize: fonts.xs, marginTop: 6 },
    langRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
    langText: { color: t.text.muted, fontSize: fonts.xs },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.bold },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'directory', label: 'Directory' },
    { key: 'expertise', label: 'Expertise' },
    { key: 'connect', label: 'Connect' },
  ];

  const statusColors: Record<string, string> = { pending: '#FF9500', accepted: '#007AFF', scheduled: '#34C759', completed: '#8E8E93' };

  // ─── Directory Tab ───

  const renderDirectory = () => (
    <>
      <TextInput style={s.searchInput} placeholder="Search mentors by name, skill, or title..." placeholderTextColor={t.text.muted} value={searchQuery} onChangeText={setSearchQuery} />

      {filteredMentors.map((mentor) => (
        <View key={mentor.id} style={s.mentorCard}>
          <Text style={s.mentorName}>{mentor.name}</Text>
          <Text style={s.mentorTitle}>{mentor.title}</Text>
          <Text style={s.mentorBio}>{mentor.bio}</Text>
          <View style={s.tagRow}>
            {mentor.expertise.map((exp) => (
              <View key={exp} style={s.tag}>
                <Text style={s.tagText}>{exp}</Text>
              </View>
            ))}
          </View>
          <View style={s.langRow}>
            <Text style={s.langText}>Languages: {mentor.languages.join(', ')}</Text>
          </View>
          <View style={s.mentorStats}>
            <View style={s.mentorStat}>
              <Text style={s.mentorStatVal}>{mentor.rating}</Text>
              <Text style={s.mentorStatLabel}>Rating</Text>
            </View>
            <View style={s.mentorStat}>
              <Text style={s.mentorStatVal}>{mentor.sessionsCompleted}</Text>
              <Text style={s.mentorStatLabel}>Sessions</Text>
            </View>
            <View style={s.mentorStat}>
              <Text style={[s.mentorStatVal, { color: t.accent.green }]}>{mentor.motkEarned.toLocaleString()}</Text>
              <Text style={s.mentorStatLabel}>mOTK Earned</Text>
            </View>
          </View>
          <View style={s.mentorFooter}>
            <Text style={[s.availability, { color: mentor.available ? t.accent.green : t.text.muted }]}>
              {mentor.available ? 'Available' : 'Unavailable'} | {mentor.responseTime}
            </Text>
            <TouchableOpacity style={s.connectBtn} onPress={() => handleConnect(mentor)}>
              <Text style={s.connectBtnText}>Connect</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </>
  );

  // ─── Expertise Tab ───

  const renderExpertise = () => (
    <>
      <Text style={s.sectionTitle}>Browse by Expertise</Text>
      {DEMO_EXPERTISE.map((cat) => (
        <TouchableOpacity key={cat.key} style={s.expertiseCard} onPress={() => { setSearchQuery(cat.label); setTab('directory'); }}>
          <Text style={s.expertiseLabel}>{cat.label}</Text>
          <Text style={s.expertiseCount}>{cat.mentorCount} mentors</Text>
        </TouchableOpacity>
      ))}

      <View style={s.card}>
        <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Become a Mentor</Text>
        <Text style={[s.mentorBio, { marginTop: 0 }]}>Share your expertise with the community and earn mOTK for every session.</Text>
        <TouchableOpacity style={[s.connectBtn, { alignSelf: 'flex-start', marginTop: 12 }]} onPress={() => Alert.alert('Apply', 'Mentor application form coming soon.')}>
          <Text style={s.connectBtnText}>Apply to Mentor</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // ─── Connect Tab ───

  const renderConnect = () => (
    <>
      <Text style={s.sectionTitle}>My Connections</Text>
      {DEMO_CONNECTIONS.map((conn) => (
        <View key={conn.id} style={s.connectionCard}>
          <Text style={s.connectionName}>{conn.mentorName}</Text>
          <Text style={s.connectionTopic}>{conn.topic}</Text>
          <View style={[s.connectionStatus, { backgroundColor: statusColors[conn.status] }]}>
            <Text style={s.connectionStatusText}>{conn.status.toUpperCase()}</Text>
          </View>
          <Text style={s.connectionDate}>{conn.date}</Text>
        </View>
      ))}

      <View style={s.card}>
        <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Mentoring Tips</Text>
        <Text style={s.mentorBio}>1. Be clear about your goals before connecting</Text>
        <Text style={s.mentorBio}>2. Prepare questions in advance</Text>
        <Text style={s.mentorBio}>3. Follow up on advice given</Text>
        <Text style={s.mentorBio}>4. Leave a review after each session</Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Mentor Directory</Text>
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
        {tab === 'directory' && renderDirectory()}
        {tab === 'expertise' && renderExpertise()}
        {tab === 'connect' && renderConnect()}
      </ScrollView>
    </SafeAreaView>
  );
}
