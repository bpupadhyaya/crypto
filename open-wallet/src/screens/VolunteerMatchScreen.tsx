import { fonts } from '../utils/theme';
/**
 * Volunteer Match — Article I (cOTK) of The Human Constitution.
 *
 * "Smart matching volunteers to community needs."
 *
 * Connects people who want to help with communities that need help.
 * A matching algorithm scores how well your skills, availability,
 * and preferences align with each need — so the right person
 * shows up at the right time.
 *
 * Features:
 * - Urgent needs board (needs requiring immediate volunteer help)
 * - My volunteer profile (skills, availability, preferred categories, languages)
 * - Smart matching — algorithm suggests needs matching your skills/availability
 * - Match score (0-100%) showing why you're a good fit
 * - Volunteer history and cOTK earned
 * - Impact stats (hours served, people helped, needs fulfilled)
 * - Demo: 4 urgent needs, 3 suggested matches with scores, volunteer stats
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

type Tab = 'needs' | 'matches' | 'profile' | 'history';

interface UrgentNeed {
  id: string;
  title: string;
  category: string;
  icon: string;
  location: string;
  urgency: 'critical' | 'high' | 'medium';
  volunteersNeeded: number;
  volunteersAssigned: number;
  skills: string[];
  postedAgo: string;
  cOTKReward: number;
  description: string;
}

interface MatchSuggestion {
  id: string;
  need: UrgentNeed;
  matchScore: number;
  reasons: string[];
  estimatedHours: number;
}

interface VolunteerRecord {
  id: string;
  needTitle: string;
  category: string;
  icon: string;
  date: string;
  hours: number;
  cOTKEarned: number;
  peoplHelped: number;
  status: 'completed' | 'in-progress' | 'verified';
}

interface VolunteerProfile {
  skills: string[];
  availability: string;
  preferredCategories: string[];
  languages: string[];
  totalHours: number;
  totalPeopleHelped: number;
  totalNeedsFulfilled: number;
  totalCOTK: number;
}

const URGENCY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
};

const URGENCY_LABELS: Record<string, string> = {
  critical: 'CRITICAL',
  high: 'HIGH',
  medium: 'MEDIUM',
};

const STATUS_COLORS: Record<string, string> = {
  completed: '#22c55e',
  'in-progress': '#3b82f6',
  verified: '#8b5cf6',
};

const DEMO_NEEDS: UrgentNeed[] = [
  {
    id: 'n1', title: 'Flood Relief — Sandbag Team', category: 'Disaster Relief', icon: '\u{1F30A}',
    location: 'River District', urgency: 'critical', volunteersNeeded: 20, volunteersAssigned: 8,
    skills: ['Physical Labor', 'First Aid'], postedAgo: '2 hours ago', cOTKReward: 150,
    description: 'Sandbag crew needed along the river levee. Water levels rising fast.',
  },
  {
    id: 'n2', title: 'Food Bank — Weekend Sorting', category: 'Food Security', icon: '\u{1F34E}',
    location: 'Community Center', urgency: 'high', volunteersNeeded: 10, volunteersAssigned: 4,
    skills: ['Organization', 'Lifting'], postedAgo: '5 hours ago', cOTKReward: 80,
    description: 'Large donation arrived. Need help sorting and packaging for distribution.',
  },
  {
    id: 'n3', title: 'Elder Home Visits — Wellness Checks', category: 'Eldercare', icon: '\u{1F9D3}',
    location: 'Oakwood Heights', urgency: 'high', volunteersNeeded: 6, volunteersAssigned: 2,
    skills: ['Empathy', 'Basic Health', 'Language: Spanish'], postedAgo: '1 day ago', cOTKReward: 100,
    description: 'Weekly wellness check-ins for isolated seniors. Some Spanish speakers needed.',
  },
  {
    id: 'n4', title: 'Tutoring — After-School Math Help', category: 'Education', icon: '\u{1F4DA}',
    location: 'Lincoln Elementary', urgency: 'medium', volunteersNeeded: 4, volunteersAssigned: 1,
    skills: ['Math', 'Teaching', 'Patience'], postedAgo: '2 days ago', cOTKReward: 60,
    description: 'Students in grades 3-5 need help with math fundamentals after school.',
  },
];

const DEMO_MATCHES: MatchSuggestion[] = [
  {
    id: 'm1',
    need: DEMO_NEEDS[2],
    matchScore: 94,
    reasons: ['You speak Spanish', 'Eldercare is your preferred category', 'Available Saturday mornings'],
    estimatedHours: 3,
  },
  {
    id: 'm2',
    need: DEMO_NEEDS[3],
    matchScore: 87,
    reasons: ['Math is in your skills', 'Education is a preferred category', 'Location is 1.2 km away'],
    estimatedHours: 2,
  },
  {
    id: 'm3',
    need: DEMO_NEEDS[1],
    matchScore: 72,
    reasons: ['Available this weekend', 'Community Center is nearby', 'Organization skills match'],
    estimatedHours: 4,
  },
];

const DEMO_HISTORY: VolunteerRecord[] = [
  {
    id: 'h1', needTitle: 'Community Garden Setup', category: 'Community', icon: '\u{1F331}',
    date: '2026-03-22', hours: 5, cOTKEarned: 120, peoplHelped: 30, status: 'verified',
  },
  {
    id: 'h2', needTitle: 'Literacy Workshop', category: 'Education', icon: '\u{1F4D6}',
    date: '2026-03-15', hours: 3, cOTKEarned: 80, peoplHelped: 12, status: 'verified',
  },
  {
    id: 'h3', needTitle: 'Bridge Repair Volunteer Crew', category: 'Infrastructure', icon: '\u{1F6E0}',
    date: '2026-03-08', hours: 8, cOTKEarned: 200, peoplHelped: 150, status: 'completed',
  },
  {
    id: 'h4', needTitle: 'Senior Wellness Visits', category: 'Eldercare', icon: '\u{1F9D3}',
    date: '2026-03-27', hours: 2, cOTKEarned: 0, peoplHelped: 4, status: 'in-progress',
  },
];

const DEMO_PROFILE: VolunteerProfile = {
  skills: ['Math', 'Teaching', 'Spanish', 'First Aid', 'Organization', 'Empathy'],
  availability: 'Weekends, Weekday evenings',
  preferredCategories: ['Education', 'Eldercare', 'Food Security'],
  languages: ['English', 'Spanish', 'Hindi'],
  totalHours: 48,
  totalPeopleHelped: 196,
  totalNeedsFulfilled: 14,
  totalCOTK: 2_840,
};

const TAB_CONFIG: { key: Tab; label: string; icon: string }[] = [
  { key: 'needs', label: 'Urgent', icon: '\u{1F6A8}' },
  { key: 'matches', label: 'Matches', icon: '\u{1F3AF}' },
  { key: 'profile', label: 'Profile', icon: '\u{1F464}' },
  { key: 'history', label: 'History', icon: '\u{1F4C3}' },
];

export function VolunteerMatchScreen({ onClose }: Props) {
  const { demoMode } = useWalletStore();
  const t = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('needs');

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 8 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.bold },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { flex: 1, paddingHorizontal: 16 },
    subtitle: { color: t.text.muted, fontSize: fonts.sm, lineHeight: 19, marginBottom: 16 },
    tabRow: { flexDirection: 'row', marginBottom: 16, gap: 4 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: t.bg.card, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: fonts.xs, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    card: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    cardTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 2 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    label: { color: t.text.muted, fontSize: fonts.sm },
    val: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    urgencyBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 8 },
    urgencyText: { fontSize: fonts.xs, fontWeight: fonts.bold, color: '#fff' },
    divider: { height: 1, backgroundColor: t.border, marginVertical: 8 },
    progressBar: { height: 8, backgroundColor: t.border, borderRadius: 4, marginVertical: 4, overflow: 'hidden' },
    progressFill: { height: 8, borderRadius: 4 },
    skillTag: { backgroundColor: t.accent.blue + '22', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 6, marginBottom: 6 },
    skillText: { color: t.accent.blue, fontSize: fonts.xs, fontWeight: fonts.semibold },
    matchScore: { fontSize: fonts.xxxl, fontWeight: fonts.heavy },
    matchReason: { color: t.text.secondary, fontSize: fonts.sm, marginBottom: 2 },
    summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    summaryCard: { flex: 1, backgroundColor: t.bg.card, borderRadius: 12, padding: 14, alignItems: 'center' },
    summaryNum: { fontSize: fonts.xl, fontWeight: fonts.heavy, marginBottom: 2 },
    summaryLabel: { color: t.text.muted, fontSize: fonts.xs, fontWeight: fonts.semibold, textAlign: 'center' },
    section: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 8, marginBottom: 8 },
    ctaBtn: { backgroundColor: t.accent.blue, paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 8 },
    ctaText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    empty: { color: t.text.muted, fontSize: fonts.md, textAlign: 'center', marginTop: 40 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
    statusText: { fontSize: fonts.xs, fontWeight: fonts.bold, color: '#fff' },
    profileSection: { marginBottom: 16 },
    profileLabel: { color: t.text.muted, fontSize: fonts.xs, fontWeight: fonts.semibold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
    tagsWrap: { flexDirection: 'row', flexWrap: 'wrap' },
    iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  }), [t]);

  const needs = demoMode ? DEMO_NEEDS : [];
  const matches = demoMode ? DEMO_MATCHES : [];
  const history = demoMode ? DEMO_HISTORY : [];
  const profile = demoMode ? DEMO_PROFILE : null;

  const fmtNum = (n: number) => n >= 1_000 ? (n / 1_000).toFixed(1) + 'k' : n.toString();

  /* ---- Renderers ---- */

  const renderNeedCard = (need: UrgentNeed) => {
    const pct = need.volunteersNeeded > 0
      ? Math.round((need.volunteersAssigned / need.volunteersNeeded) * 100)
      : 0;
    return (
      <View key={need.id} style={st.card}>
        <View style={[st.row, { alignItems: 'center', marginBottom: 8 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={[st.iconCircle, { backgroundColor: URGENCY_COLORS[need.urgency] + '22' }]}>
              <Text style={{ fontSize: fonts.xl }}>{need.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.cardTitle}>{need.title}</Text>
              <Text style={st.label}>{need.category} \u2022 {need.location}</Text>
            </View>
          </View>
          <View style={[st.urgencyBadge, { backgroundColor: URGENCY_COLORS[need.urgency] }]}>
            <Text style={st.urgencyText}>{URGENCY_LABELS[need.urgency]}</Text>
          </View>
        </View>

        <Text style={[st.label, { marginBottom: 6 }]}>{need.description}</Text>

        <View style={st.divider} />

        <View style={st.row}>
          <Text style={st.label}>Volunteers</Text>
          <Text style={st.val}>{need.volunteersAssigned} / {need.volunteersNeeded}</Text>
        </View>
        <View style={st.progressBar}>
          <View style={[st.progressFill, { width: `${pct}%`, backgroundColor: URGENCY_COLORS[need.urgency] }]} />
        </View>

        <View style={[st.row, { marginTop: 6 }]}>
          <Text style={st.label}>Skills: {need.skills.join(', ')}</Text>
          <Text style={[st.val, { color: t.accent.green }]}>+{need.cOTKReward} cOTK</Text>
        </View>
        <Text style={[st.label, { marginTop: 4 }]}>Posted {need.postedAgo}</Text>

        <TouchableOpacity style={st.ctaBtn}>
          <Text style={st.ctaText}>Volunteer Now</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderMatchCard = (match: MatchSuggestion) => {
    const scoreColor = match.matchScore >= 90 ? '#22c55e'
      : match.matchScore >= 75 ? '#3b82f6' : '#eab308';
    return (
      <View key={match.id} style={st.card}>
        <View style={[st.row, { alignItems: 'center', marginBottom: 8 }]}>
          <View style={{ flex: 1 }}>
            <Text style={st.cardTitle}>{match.need.title}</Text>
            <Text style={st.label}>{match.need.category} \u2022 {match.need.location}</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={[st.matchScore, { color: scoreColor }]}>{match.matchScore}%</Text>
            <Text style={[st.label, { fontSize: fonts.xs }]}>Match</Text>
          </View>
        </View>

        <View style={st.divider} />

        <Text style={[st.section, { marginTop: 0 }]}>Why You're a Good Fit</Text>
        {match.reasons.map((r, i) => (
          <Text key={i} style={st.matchReason}>\u2713 {r}</Text>
        ))}

        <View style={[st.row, { marginTop: 8 }]}>
          <Text style={st.label}>Est. time: ~{match.estimatedHours}h</Text>
          <Text style={[st.val, { color: t.accent.green }]}>+{match.need.cOTKReward} cOTK</Text>
        </View>

        <TouchableOpacity style={st.ctaBtn}>
          <Text style={st.ctaText}>Accept Match</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderProfile = () => {
    if (!profile) return <Text style={st.empty}>No profile data available.</Text>;
    return (
      <View>
        {/* Impact Stats */}
        <View style={st.summaryRow}>
          <View style={st.summaryCard}>
            <Text style={[st.summaryNum, { color: t.accent.blue }]}>{profile.totalHours}</Text>
            <Text style={st.summaryLabel}>Hours{'\n'}Served</Text>
          </View>
          <View style={st.summaryCard}>
            <Text style={[st.summaryNum, { color: t.accent.green }]}>{profile.totalPeopleHelped}</Text>
            <Text style={st.summaryLabel}>People{'\n'}Helped</Text>
          </View>
          <View style={st.summaryCard}>
            <Text style={[st.summaryNum, { color: '#8b5cf6' }]}>{profile.totalNeedsFulfilled}</Text>
            <Text style={st.summaryLabel}>Needs{'\n'}Fulfilled</Text>
          </View>
          <View style={st.summaryCard}>
            <Text style={[st.summaryNum, { color: '#f7931a' }]}>{fmtNum(profile.totalCOTK)}</Text>
            <Text style={st.summaryLabel}>cOTK{'\n'}Earned</Text>
          </View>
        </View>

        <View style={st.card}>
          <View style={st.profileSection}>
            <Text style={st.profileLabel}>Skills</Text>
            <View style={st.tagsWrap}>
              {profile.skills.map(s => (
                <View key={s} style={st.skillTag}><Text style={st.skillText}>{s}</Text></View>
              ))}
            </View>
          </View>

          <View style={st.profileSection}>
            <Text style={st.profileLabel}>Availability</Text>
            <Text style={st.val}>{profile.availability}</Text>
          </View>

          <View style={st.profileSection}>
            <Text style={st.profileLabel}>Preferred Categories</Text>
            <View style={st.tagsWrap}>
              {profile.preferredCategories.map(c => (
                <View key={c} style={[st.skillTag, { backgroundColor: '#8b5cf6' + '22' }]}>
                  <Text style={[st.skillText, { color: '#8b5cf6' }]}>{c}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={st.profileSection}>
            <Text style={st.profileLabel}>Languages</Text>
            <View style={st.tagsWrap}>
              {profile.languages.map(l => (
                <View key={l} style={[st.skillTag, { backgroundColor: '#22c55e' + '22' }]}>
                  <Text style={[st.skillText, { color: '#22c55e' }]}>{l}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <TouchableOpacity style={st.ctaBtn}>
          <Text style={st.ctaText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderHistoryCard = (rec: VolunteerRecord) => (
    <View key={rec.id} style={st.card}>
      <View style={[st.row, { alignItems: 'center', marginBottom: 6 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Text style={{ fontSize: fonts.xl, marginRight: 8 }}>{rec.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={st.cardTitle}>{rec.needTitle}</Text>
            <Text style={st.label}>{rec.category} \u2022 {rec.date}</Text>
          </View>
        </View>
        <View style={[st.statusBadge, { backgroundColor: STATUS_COLORS[rec.status] }]}>
          <Text style={st.statusText}>{rec.status.replace('-', ' ').toUpperCase()}</Text>
        </View>
      </View>

      <View style={st.divider} />

      <View style={st.row}>
        <Text style={st.label}>Hours</Text>
        <Text style={st.val}>{rec.hours}h</Text>
      </View>
      <View style={st.row}>
        <Text style={st.label}>People Helped</Text>
        <Text style={st.val}>{rec.peoplHelped}</Text>
      </View>
      <View style={st.row}>
        <Text style={st.label}>cOTK Earned</Text>
        <Text style={[st.val, { color: rec.cOTKEarned > 0 ? t.accent.green : t.text.muted }]}>
          {rec.cOTKEarned > 0 ? `+${rec.cOTKEarned}` : 'Pending'}
        </Text>
      </View>
    </View>
  );

  /* ---- Tab content ---- */

  const renderContent = () => {
    switch (activeTab) {
      case 'needs':
        if (needs.length === 0) return <Text style={st.empty}>No urgent needs right now. Enable demo mode to explore.</Text>;
        return (
          <View>
            <Text style={st.subtitle}>
              Community needs requiring immediate volunteer help. Earn cOTK by showing up.
            </Text>
            {needs.map(renderNeedCard)}
          </View>
        );
      case 'matches':
        if (matches.length === 0) return <Text style={st.empty}>No matches yet. Enable demo mode to explore.</Text>;
        return (
          <View>
            <Text style={st.subtitle}>
              Smart-matched to your skills, availability, and preferences. Higher scores mean better fit.
            </Text>
            {matches.map(renderMatchCard)}
          </View>
        );
      case 'profile':
        return renderProfile();
      case 'history':
        if (history.length === 0) return <Text style={st.empty}>No volunteer history yet.</Text>;
        return (
          <View>
            <Text style={st.subtitle}>
              Your volunteering record and cOTK earned through community service.
            </Text>
            {history.map(renderHistoryCard)}
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.title}>{'\u{1F91D}'} Volunteer Match</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={st.scroll}>
        {/* Tabs */}
        <View style={st.tabRow}>
          {TAB_CONFIG.map(tc => (
            <TouchableOpacity
              key={tc.key}
              style={[st.tab, activeTab === tc.key && st.tabActive]}
              onPress={() => setActiveTab(tc.key)}
            >
              <Text style={[st.tabText, activeTab === tc.key && st.tabTextActive]}>
                {tc.icon} {tc.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {renderContent()}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
