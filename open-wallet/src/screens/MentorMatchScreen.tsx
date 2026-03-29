/**
 * Mentor Match Screen — AI-Matched Mentoring for The Human Constitution.
 *
 * "True mentorship is not instruction but ignition — the passing of a flame
 *  from one soul to another, across generations."
 * — Human Constitution, Article I
 *
 * Smart matching of mentors and mentees based on learning goals, expertise,
 * availability, and language. Tracks sessions, impact, agreements, and feedback.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

/* ── data types ── */

interface MentorRelationship {
  id: string;
  role: 'mentor' | 'mentee';
  partnerName: string;
  expertise: string;
  startDate: string;
  status: 'active' | 'completed' | 'paused';
  sessionsCompleted: number;
  nextSession: string | null;
  eOTKEarned: number;
  agreementGoals: string[];
  frequency: string;
  duration: string;
  language: string;
}

interface SuggestedMatch {
  id: string;
  name: string;
  expertise: string[];
  matchScore: number;
  expertiseOverlap: string[];
  availability: string;
  language: string;
  bio: string;
  rating: number;
  menteeCount: number;
}

interface SessionLog {
  id: string;
  relationshipId: string;
  partnerName: string;
  date: string;
  duration: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes: string;
  eOTKEarned: number;
  rating: number | null;
  feedback: string | null;
}

interface ExpertiseArea {
  name: string;
  selected: boolean;
}

/* ── demo data ── */

const DEMO_RELATIONSHIPS: MentorRelationship[] = [
  {
    id: 'rel-001',
    role: 'mentee',
    partnerName: 'Dr. Amara Okafor',
    expertise: 'Machine Learning & AI Ethics',
    startDate: '2026-01-10',
    status: 'active',
    sessionsCompleted: 8,
    nextSession: '2026-04-02',
    eOTKEarned: 240,
    agreementGoals: ['Complete ML fundamentals course', 'Build an ethical AI classifier', 'Publish research paper'],
    frequency: 'Weekly',
    duration: '6 months',
    language: 'English',
  },
];

const DEMO_SUGGESTED_MATCHES: SuggestedMatch[] = [
  {
    id: 'match-001',
    name: 'Prof. Kenji Tanaka',
    expertise: ['Data Science', 'Statistics', 'Python'],
    matchScore: 92,
    expertiseOverlap: ['Data Science', 'Python'],
    availability: 'Weekends, 2 hrs/week',
    language: 'English, Japanese',
    bio: 'University professor with 15 years in data science. Passionate about making analytics accessible to everyone.',
    rating: 4.9,
    menteeCount: 18,
  },
  {
    id: 'match-002',
    name: 'Sarah Lindqvist',
    expertise: ['UX Design', 'Accessibility', 'React Native'],
    matchScore: 78,
    expertiseOverlap: ['React Native'],
    availability: 'Evenings, 1.5 hrs/week',
    language: 'English, Swedish',
    bio: 'Lead UX designer building inclusive digital products. Believes in mentorship as a way to give back.',
    rating: 4.7,
    menteeCount: 9,
  },
];

const DEMO_SESSIONS: SessionLog[] = [
  {
    id: 'sess-001',
    relationshipId: 'rel-001',
    partnerName: 'Dr. Amara Okafor',
    date: '2026-03-25',
    duration: '60 min',
    status: 'completed',
    notes: 'Reviewed neural network architectures. Discussed bias detection strategies. Assigned reading on fairness metrics.',
    eOTKEarned: 30,
    rating: 5,
    feedback: 'Excellent session — Amara explained gradient descent intuitively.',
  },
  {
    id: 'sess-002',
    relationshipId: 'rel-001',
    partnerName: 'Dr. Amara Okafor',
    date: '2026-03-18',
    duration: '45 min',
    status: 'completed',
    notes: 'Hands-on coding: built a simple classifier. Debugged overfitting issue together.',
    eOTKEarned: 30,
    rating: 5,
    feedback: null,
  },
  {
    id: 'sess-003',
    relationshipId: 'rel-001',
    partnerName: 'Dr. Amara Okafor',
    date: '2026-04-02',
    duration: '60 min',
    status: 'scheduled',
    notes: 'Planned: Review midterm project and discuss ethical implications of predictive models.',
    eOTKEarned: 0,
    rating: null,
    feedback: null,
  },
];

const EXPERTISE_OPTIONS: string[] = [
  'Coding', 'Data Science', 'Math', 'Science', 'Writing',
  'Art & Design', 'Music', 'Languages', 'Finance', 'Leadership',
  'Public Speaking', 'Health & Wellness', 'Trades & Crafts', 'Life Skills',
];

const LANGUAGE_OPTIONS: string[] = [
  'English', 'Spanish', 'Mandarin', 'Hindi', 'Arabic',
  'French', 'Japanese', 'Portuguese', 'German', 'Korean',
];

type Tab = 'dashboard' | 'find-mentor' | 'sessions';

export function MentorMatchScreen({ onClose }: Props) {
  const t = useTheme();
  const { demoMode } = useWalletStore();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  /* Become a mentor state */
  const [registerExpertise, setRegisterExpertise] = useState<string[]>([]);
  const [registerLanguages, setRegisterLanguages] = useState<string[]>([]);
  const [registerAvailability, setRegisterAvailability] = useState('');
  const [registerBio, setRegisterBio] = useState('');

  /* Feedback state */
  const [feedbackSessionId, setFeedbackSessionId] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');

  /* Agreement view */
  const [viewAgreementId, setViewAgreementId] = useState<string | null>(null);

  const filteredMatches = useMemo(() => {
    if (!searchQuery.trim()) return DEMO_SUGGESTED_MATCHES;
    const q = searchQuery.toLowerCase();
    return DEMO_SUGGESTED_MATCHES.filter(
      (m) => m.name.toLowerCase().includes(q) || m.expertise.some((e) => e.toLowerCase().includes(q)),
    );
  }, [searchQuery]);

  const totalEOTK = useMemo(() => {
    return DEMO_RELATIONSHIPS.reduce((sum, r) => sum + r.eOTKEarned, 0) +
      DEMO_SESSIONS.filter((s) => s.status === 'completed').reduce((sum, s) => sum + s.eOTKEarned, 0);
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    heroCard: { backgroundColor: t.accent.purple + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: '800', textAlign: 'center' },
    heroSub: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginTop: 6, lineHeight: 18, fontStyle: 'italic' },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: '600' },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 16, backgroundColor: t.bg.card, borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.muted, fontSize: 11, fontWeight: '600' },
    tabTextActive: { color: '#fff' },
    section: { marginHorizontal: 20, marginTop: 20 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 12 },
    searchInput: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 14, borderWidth: 1, borderColor: t.border, marginBottom: 12 },

    /* ── Dashboard cards ── */
    relationshipCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4 },
    roleTag: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    partnerName: { color: t.text.primary, fontSize: 15, fontWeight: '700', marginTop: 4 },
    expertiseLabel: { color: t.text.secondary, fontSize: 13, marginTop: 2 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, flexWrap: 'wrap' },
    statChip: { color: t.text.secondary, fontSize: 12 },
    nextSessionBadge: { backgroundColor: t.accent.blue + '15', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, marginTop: 8, alignSelf: 'flex-start' },
    nextSessionText: { color: t.accent.blue, fontSize: 11, fontWeight: '600' },
    viewAgreementBtn: { backgroundColor: t.accent.purple + '20', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'flex-end', marginTop: 8 },
    viewAgreementText: { color: t.accent.purple, fontSize: 13, fontWeight: '700' },

    /* ── Agreement overlay ── */
    agreementCard: { backgroundColor: t.bg.card, borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: t.accent.purple + '40' },
    agreementTitle: { color: t.text.primary, fontSize: 16, fontWeight: '800', marginBottom: 12 },
    agreementRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    agreementLabel: { color: t.text.muted, fontSize: 13 },
    agreementValue: { color: t.text.primary, fontSize: 13, fontWeight: '600' },
    goalItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
    goalBullet: { color: t.accent.purple, fontSize: 14, marginRight: 8 },
    goalText: { color: t.text.secondary, fontSize: 13, flex: 1 },
    chainBadge: { backgroundColor: t.accent.green + '15', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, alignSelf: 'center', marginTop: 12 },
    chainBadgeText: { color: t.accent.green, fontSize: 11, fontWeight: '700' },

    /* ── Impact tracking ── */
    impactCard: { backgroundColor: t.bg.card, borderRadius: 20, padding: 20, marginBottom: 16 },
    statRowWide: { flexDirection: 'row', justifyContent: 'space-around' },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 24, fontWeight: '800' },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2, textAlign: 'center' },

    /* ── Smart matching ── */
    matchCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    matchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    matchName: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    matchScoreBadge: { borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10 },
    matchScoreText: { fontSize: 13, fontWeight: '800' },
    matchBio: { color: t.text.secondary, fontSize: 12, marginTop: 6, lineHeight: 18 },
    matchDetail: { color: t.text.muted, fontSize: 11, marginTop: 4 },
    overlapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    overlapTag: { backgroundColor: t.accent.green + '20', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 },
    overlapTagText: { color: t.accent.green, fontSize: 10, fontWeight: '700' },
    skillTag: { backgroundColor: t.accent.blue + '20', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 },
    skillTagText: { color: t.accent.blue, fontSize: 10, fontWeight: '600' },
    matchStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    matchStat: { color: t.text.secondary, fontSize: 12 },
    requestBtn: { backgroundColor: t.accent.blue, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'flex-end', marginTop: 10 },
    requestBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

    /* ── Sessions ── */
    sessionCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 3 },
    sessionDate: { color: t.text.primary, fontSize: 14, fontWeight: '700' },
    sessionPartner: { color: t.text.secondary, fontSize: 13, marginTop: 2 },
    sessionDuration: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    sessionNotes: { color: t.text.secondary, fontSize: 12, marginTop: 8, lineHeight: 18, fontStyle: 'italic' },
    sessionEOTK: { color: t.accent.green, fontSize: 13, fontWeight: '700', marginTop: 6 },
    statusBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6, alignSelf: 'flex-start', marginTop: 6 },
    statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    feedbackSection: { backgroundColor: t.accent.blue + '08', borderRadius: 10, padding: 12, marginTop: 8 },
    feedbackLabel: { color: t.text.muted, fontSize: 11, fontWeight: '600' },
    feedbackContent: { color: t.text.secondary, fontSize: 12, marginTop: 4, lineHeight: 18 },
    feedbackRating: { color: t.accent.orange, fontSize: 12, fontWeight: '700', marginTop: 2 },
    giveFeedbackBtn: { backgroundColor: t.accent.purple + '20', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'flex-end', marginTop: 8 },
    giveFeedbackText: { color: t.accent.purple, fontSize: 13, fontWeight: '700' },

    /* ── Feedback form ── */
    feedbackForm: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: t.accent.purple + '40' },
    feedbackFormTitle: { color: t.text.primary, fontSize: 14, fontWeight: '700', marginBottom: 10 },
    ratingRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
    ratingBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: t.border },
    ratingBtnActive: { backgroundColor: t.accent.orange, borderColor: t.accent.orange },
    ratingBtnText: { fontSize: 14, fontWeight: '700', color: t.text.muted },
    ratingBtnTextActive: { color: '#fff' },
    feedbackInput: { backgroundColor: t.bg.primary, borderRadius: 10, padding: 12, color: t.text.primary, fontSize: 13, borderWidth: 1, borderColor: t.border, height: 70, textAlignVertical: 'top' },
    submitBtn: { backgroundColor: t.accent.blue, borderRadius: 14, paddingVertical: 12, alignItems: 'center', marginTop: 10 },
    submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

    /* ── Become a mentor ── */
    registerCard: { backgroundColor: t.bg.card, borderRadius: 20, padding: 20, marginBottom: 16 },
    registerTitle: { color: t.text.primary, fontSize: 16, fontWeight: '800', marginBottom: 4 },
    registerSub: { color: t.text.muted, fontSize: 12, marginBottom: 16, lineHeight: 18 },
    registerLabel: { color: t.text.primary, fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 12 },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, backgroundColor: t.bg.primary, borderWidth: 1, borderColor: t.border },
    chipActive: { borderColor: t.accent.blue, backgroundColor: t.accent.blue + '20' },
    chipText: { color: t.text.secondary, fontSize: 13 },
    chipTextActive: { color: t.accent.blue, fontWeight: '600' },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 14, borderWidth: 1, borderColor: t.border, height: 80, textAlignVertical: 'top' },
    registerBtn: { backgroundColor: t.accent.green, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
    registerBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    sublabel: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginTop: 12, lineHeight: 18 },
  }), [t]);

  /* ── helpers ── */

  const getScoreColor = (score: number) => {
    if (score >= 85) return t.accent.green;
    if (score >= 65) return t.accent.orange;
    return t.text.muted;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return t.accent.green;
      case 'scheduled': return t.accent.blue;
      case 'cancelled': return t.accent.red;
      default: return t.text.muted;
    }
  };

  const toggleChip = (value: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  /* ── tab: dashboard ── */

  const renderDashboard = () => (
    <View style={s.section}>
      {/* Impact summary */}
      <Text style={s.sectionTitle}>Mentoring Impact</Text>
      <View style={s.impactCard}>
        <View style={s.statRowWide}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{DEMO_RELATIONSHIPS.length}</Text>
            <Text style={s.statLabel}>Active{'\n'}Relationships</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.green }]}>
              {DEMO_SESSIONS.filter((ss) => ss.status === 'completed').length}
            </Text>
            <Text style={s.statLabel}>Sessions{'\n'}Completed</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.blue }]}>{totalEOTK}</Text>
            <Text style={s.statLabel}>eOTK{'\n'}Earned</Text>
          </View>
        </View>
      </View>

      {/* My Mentors / My Mentees */}
      <Text style={s.sectionTitle}>My Mentors & Mentees</Text>
      {DEMO_RELATIONSHIPS.map((rel) => (
        <View
          key={rel.id}
          style={[s.relationshipCard, { borderLeftColor: rel.role === 'mentor' ? t.accent.green : t.accent.purple }]}
        >
          <Text style={[s.roleTag, { color: rel.role === 'mentor' ? t.accent.green : t.accent.purple }]}>
            {rel.role === 'mentor' ? 'You are mentoring' : 'Your mentor'}
          </Text>
          <Text style={s.partnerName}>{rel.partnerName}</Text>
          <Text style={s.expertiseLabel}>{rel.expertise}</Text>
          <View style={s.statsRow}>
            <Text style={s.statChip}>Since {rel.startDate}</Text>
            <Text style={s.statChip}>{rel.sessionsCompleted} sessions</Text>
            <Text style={[s.statChip, { color: t.accent.green }]}>{rel.eOTKEarned} eOTK</Text>
          </View>
          <View style={s.statsRow}>
            <Text style={s.statChip}>{rel.frequency} / {rel.language}</Text>
          </View>
          {rel.nextSession && (
            <View style={s.nextSessionBadge}>
              <Text style={s.nextSessionText}>Next session: {rel.nextSession}</Text>
            </View>
          )}
          <TouchableOpacity
            style={s.viewAgreementBtn}
            onPress={() => setViewAgreementId(viewAgreementId === rel.id ? null : rel.id)}
          >
            <Text style={s.viewAgreementText}>
              {viewAgreementId === rel.id ? 'Hide Agreement' : 'View Agreement'}
            </Text>
          </TouchableOpacity>

          {/* On-chain agreement */}
          {viewAgreementId === rel.id && (
            <View style={s.agreementCard}>
              <Text style={s.agreementTitle}>Mentoring Agreement</Text>
              <View style={s.agreementRow}>
                <Text style={s.agreementLabel}>Frequency</Text>
                <Text style={s.agreementValue}>{rel.frequency}</Text>
              </View>
              <View style={s.agreementRow}>
                <Text style={s.agreementLabel}>Duration</Text>
                <Text style={s.agreementValue}>{rel.duration}</Text>
              </View>
              <View style={s.agreementRow}>
                <Text style={s.agreementLabel}>Language</Text>
                <Text style={s.agreementValue}>{rel.language}</Text>
              </View>
              <View style={s.agreementRow}>
                <Text style={s.agreementLabel}>Status</Text>
                <Text style={[s.agreementValue, { color: t.accent.green }]}>{rel.status.toUpperCase()}</Text>
              </View>
              <Text style={[s.agreementLabel, { marginTop: 12, marginBottom: 6 }]}>Goals</Text>
              {rel.agreementGoals.map((goal, idx) => (
                <View key={idx} style={s.goalItem}>
                  <Text style={s.goalBullet}>{'\u25C6'}</Text>
                  <Text style={s.goalText}>{goal}</Text>
                </View>
              ))}
              <View style={s.chainBadge}>
                <Text style={s.chainBadgeText}>Recorded on Open Chain</Text>
              </View>
            </View>
          )}
        </View>
      ))}

      {/* Become a mentor */}
      <Text style={s.sectionTitle}>Become a Mentor</Text>
      <View style={s.registerCard}>
        <Text style={s.registerTitle}>Share Your Knowledge</Text>
        <Text style={s.registerSub}>
          Register your expertise, availability, and languages to be matched with mentees who need your guidance.
        </Text>

        <Text style={s.registerLabel}>Expertise Areas</Text>
        <View style={s.chipGrid}>
          {EXPERTISE_OPTIONS.map((exp) => (
            <TouchableOpacity
              key={exp}
              style={[s.chip, registerExpertise.includes(exp) && s.chipActive]}
              onPress={() => toggleChip(exp, registerExpertise, setRegisterExpertise)}
            >
              <Text style={[s.chipText, registerExpertise.includes(exp) && s.chipTextActive]}>{exp}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.registerLabel}>Languages</Text>
        <View style={s.chipGrid}>
          {LANGUAGE_OPTIONS.map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[s.chip, registerLanguages.includes(lang) && s.chipActive]}
              onPress={() => toggleChip(lang, registerLanguages, setRegisterLanguages)}
            >
              <Text style={[s.chipText, registerLanguages.includes(lang) && s.chipTextActive]}>{lang}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.registerLabel}>Availability</Text>
        <TextInput
          style={[s.input, { height: 44 }]}
          placeholder="e.g., Weekends, 2 hours/week"
          placeholderTextColor={t.text.muted}
          value={registerAvailability}
          onChangeText={setRegisterAvailability}
        />

        <Text style={s.registerLabel}>About You</Text>
        <TextInput
          style={s.input}
          placeholder="Tell potential mentees about your experience..."
          placeholderTextColor={t.text.muted}
          value={registerBio}
          onChangeText={setRegisterBio}
          multiline
        />

        <TouchableOpacity
          style={s.registerBtn}
          onPress={() => {
            if (registerExpertise.length === 0) {
              Alert.alert('Select Expertise', 'Please select at least one area of expertise.');
              return;
            }
            if (registerLanguages.length === 0) {
              Alert.alert('Select Languages', 'Please select at least one language.');
              return;
            }
            Alert.alert(
              'Registered as Mentor (Demo)',
              `Profile created with expertise in: ${registerExpertise.join(', ')}.\nLanguages: ${registerLanguages.join(', ')}.\n\nIn production, your mentor profile is published on Open Chain and the AI matching engine will connect you with compatible mentees.`,
            );
            setRegisterExpertise([]);
            setRegisterLanguages([]);
            setRegisterAvailability('');
            setRegisterBio('');
          }}
        >
          <Text style={s.registerBtnText}>Register as Mentor</Text>
        </TouchableOpacity>

        <Text style={s.sublabel}>
          Mentors earn eOTK when their mentees grow. Both mentor and mentee are rewarded for every completed session and milestone.
        </Text>
      </View>
    </View>
  );

  /* ── tab: find-mentor ── */

  const renderFindMentor = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Smart Matching</Text>
      <Text style={[s.sublabel, { textAlign: 'left', marginTop: 0, marginBottom: 12 }]}>
        AI-powered suggestions based on your learning goals, expertise overlap, availability, and language preferences.
      </Text>
      <TextInput
        style={s.searchInput}
        placeholder="Search by name or skill..."
        placeholderTextColor={t.text.muted}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      {filteredMatches.map((match) => (
        <View key={match.id} style={s.matchCard}>
          <View style={s.matchHeader}>
            <Text style={s.matchName}>{match.name}</Text>
            <View style={[s.matchScoreBadge, { backgroundColor: getScoreColor(match.matchScore) + '20' }]}>
              <Text style={[s.matchScoreText, { color: getScoreColor(match.matchScore) }]}>
                {match.matchScore}% match
              </Text>
            </View>
          </View>
          <Text style={s.matchBio}>{match.bio}</Text>
          <Text style={s.matchDetail}>Availability: {match.availability}</Text>
          <Text style={s.matchDetail}>Languages: {match.language}</Text>

          <View style={s.overlapRow}>
            {match.expertiseOverlap.map((skill) => (
              <View key={skill} style={s.overlapTag}>
                <Text style={s.overlapTagText}>{skill} (overlap)</Text>
              </View>
            ))}
            {match.expertise.filter((e) => !match.expertiseOverlap.includes(e)).map((skill) => (
              <View key={skill} style={s.skillTag}>
                <Text style={s.skillTagText}>{skill}</Text>
              </View>
            ))}
          </View>

          <View style={s.matchStats}>
            <Text style={s.matchStat}>{match.rating}/5.0 rating</Text>
            <Text style={s.matchStat}>{match.menteeCount} mentees</Text>
          </View>

          <TouchableOpacity
            style={s.requestBtn}
            onPress={() => Alert.alert(
              'Mentorship Request (Demo)',
              `Request sent to ${match.name}!\n\nMatch score: ${match.matchScore}%\nExpertise overlap: ${match.expertiseOverlap.join(', ')}\n\nIn production, this creates a formal mentoring agreement on Open Chain with goals, frequency, and duration.`,
            )}
          >
            <Text style={s.requestBtnText}>Request Mentorship</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  /* ── tab: sessions ── */

  const handleSubmitFeedback = (sessionId: string) => {
    Alert.alert(
      'Feedback Submitted (Demo)',
      `Rating: ${feedbackRating}/5\nFeedback: "${feedbackText}"\n\nIn production, mutual feedback is recorded on Open Chain. Both mentor and mentee provide feedback after each session.`,
    );
    setFeedbackSessionId(null);
    setFeedbackRating(5);
    setFeedbackText('');
  };

  const renderSessions = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Session Log</Text>
      {DEMO_SESSIONS.map((session) => (
        <View key={session.id}>
          <View
            style={[s.sessionCard, { borderLeftColor: getStatusColor(session.status) }]}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={s.sessionDate}>{session.date}</Text>
              <View style={[s.statusBadge, { backgroundColor: getStatusColor(session.status) + '20' }]}>
                <Text style={[s.statusText, { color: getStatusColor(session.status) }]}>{session.status}</Text>
              </View>
            </View>
            <Text style={s.sessionPartner}>{session.partnerName}</Text>
            <Text style={s.sessionDuration}>{session.duration}</Text>
            <Text style={s.sessionNotes}>{session.notes}</Text>
            {session.eOTKEarned > 0 && (
              <Text style={s.sessionEOTK}>+{session.eOTKEarned} eOTK earned</Text>
            )}

            {/* Existing feedback */}
            {session.feedback && (
              <View style={s.feedbackSection}>
                <Text style={s.feedbackLabel}>Your Feedback</Text>
                <Text style={s.feedbackRating}>{'Rating: ' + session.rating + '/5'}</Text>
                <Text style={s.feedbackContent}>{session.feedback}</Text>
              </View>
            )}

            {/* Give feedback button for completed sessions without feedback */}
            {session.status === 'completed' && !session.feedback && (
              <TouchableOpacity
                style={s.giveFeedbackBtn}
                onPress={() => setFeedbackSessionId(feedbackSessionId === session.id ? null : session.id)}
              >
                <Text style={s.giveFeedbackText}>
                  {feedbackSessionId === session.id ? 'Cancel' : 'Give Feedback'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Feedback form */}
          {feedbackSessionId === session.id && (
            <View style={s.feedbackForm}>
              <Text style={s.feedbackFormTitle}>Rate This Session</Text>
              <View style={s.ratingRow}>
                {[1, 2, 3, 4, 5].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[s.ratingBtn, feedbackRating >= r && s.ratingBtnActive]}
                    onPress={() => setFeedbackRating(r)}
                  >
                    <Text style={[s.ratingBtnText, feedbackRating >= r && s.ratingBtnTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={s.feedbackInput}
                placeholder="Share your thoughts on this session..."
                placeholderTextColor={t.text.muted}
                value={feedbackText}
                onChangeText={setFeedbackText}
                multiline
              />
              <TouchableOpacity style={s.submitBtn} onPress={() => handleSubmitFeedback(session.id)}>
                <Text style={s.submitBtnText}>Submit Feedback</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}
    </View>
  );

  /* ── tabs ── */

  const tabs: { key: Tab; label: string }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'find-mentor', label: 'Find Mentor' },
    { key: 'sessions', label: 'Sessions' },
  ];

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Mentor Match</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.heroCard}>
          <Text style={s.heroIcon}>{'\u{1F9ED}'}</Text>
          <Text style={s.heroTitle}>AI-Matched Mentoring</Text>
          <Text style={s.heroSub}>
            "True mentorship is not instruction but ignition — the passing of a flame from one soul to another, across generations."
          </Text>
        </View>

        {demoMode && (
          <View style={s.demoTag}>
            <Text style={s.demoText}>DEMO MODE — Sample Data</Text>
          </View>
        )}

        <View style={s.tabRow}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[s.tab, activeTab === tab.key && s.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'find-mentor' && renderFindMentor()}
        {activeTab === 'sessions' && renderSessions()}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
