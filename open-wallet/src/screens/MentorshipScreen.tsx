import { fonts } from '../utils/theme';
/**
 * Mentorship Screen — Connect mentors and mentees.
 *
 * "Every child deserves a mentor. Every elder has wisdom to share.
 *  The chain of knowledge must never break."
 * — Human Constitution, Article I
 *
 * Register as mentor, find mentors, track active mentorships,
 * celebrate mentorship milestones, and send gratitude.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface Props {
  onClose: () => void;
}

/* ── data types ── */

interface MentorProfile {
  uid: string;
  name: string;
  skills: string[];
  rating: number;
  menteeCount: number;
  milestonesHelped: number;
  available: boolean;
}

interface ActiveMentorship {
  id: string;
  role: 'mentor' | 'mentee';
  partnerName: string;
  partnerUid: string;
  skill: string;
  startDate: string;
  milestones: number;
  eOTKExchanged: number;
}

interface MentorshipMilestone {
  id: string;
  mentorshipId: string;
  title: string;
  date: string;
  eOTK: number;
  menteeName: string;
}

/* ── demo data ── */

const DEMO_MENTORS: MentorProfile[] = [
  { uid: 'uid-ment-001', name: 'Alex Chen', skills: ['Coding', 'Math', 'Data Science'], rating: 4.9, menteeCount: 12, milestonesHelped: 34, available: true },
  { uid: 'uid-ment-002', name: 'Clara Osei', skills: ['Music', 'Piano', 'Composition'], rating: 4.8, menteeCount: 8, milestonesHelped: 22, available: true },
  { uid: 'uid-ment-003', name: 'Dr. Priya Sharma', skills: ['Science', 'Biology', 'Research Methods'], rating: 5.0, menteeCount: 15, milestonesHelped: 45, available: false },
  { uid: 'uid-ment-004', name: 'James Rivera', skills: ['Art', 'Drawing', 'Digital Art'], rating: 4.7, menteeCount: 6, milestonesHelped: 18, available: true },
  { uid: 'uid-ment-005', name: 'Fatima Al-Hassan', skills: ['Reading', 'Creative Writing', 'Languages'], rating: 4.9, menteeCount: 10, milestonesHelped: 28, available: true },
];

const DEMO_ACTIVE: ActiveMentorship[] = [
  { id: 'am1', role: 'mentee', partnerName: 'Alex Chen', partnerUid: 'uid-ment-001', skill: 'Python Programming', startDate: '2026-01-15', milestones: 3, eOTKExchanged: 90 },
  { id: 'am2', role: 'mentor', partnerName: 'Student Aisha', partnerUid: 'uid-stud-001', skill: 'Creative Writing', startDate: '2026-02-01', milestones: 2, eOTKExchanged: 60 },
  { id: 'am3', role: 'mentor', partnerName: 'Student Ben', partnerUid: 'uid-stud-002', skill: 'Basic Math', startDate: '2026-02-20', milestones: 1, eOTKExchanged: 30 },
];

const DEMO_MILESTONES: MentorshipMilestone[] = [
  { id: 'mm1', mentorshipId: 'am1', title: 'Wrote first Python script', date: '2026-02-01', eOTK: 30, menteeName: 'You' },
  { id: 'mm2', mentorshipId: 'am1', title: 'Built a CLI tool', date: '2026-02-20', eOTK: 30, menteeName: 'You' },
  { id: 'mm3', mentorshipId: 'am1', title: 'Completed data analysis project', date: '2026-03-15', eOTK: 30, menteeName: 'You' },
  { id: 'mm4', mentorshipId: 'am2', title: 'Aisha wrote first short story', date: '2026-02-18', eOTK: 30, menteeName: 'Student Aisha' },
  { id: 'mm5', mentorshipId: 'am2', title: 'Aisha published on school blog', date: '2026-03-10', eOTK: 30, menteeName: 'Student Aisha' },
  { id: 'mm6', mentorshipId: 'am3', title: 'Ben passed multiplication quiz', date: '2026-03-12', eOTK: 30, menteeName: 'Student Ben' },
];

const MENTORING_SKILLS = [
  'Coding', 'Math', 'Science', 'Reading', 'Writing',
  'Art', 'Music', 'Languages', 'Finance', 'Life Skills',
];

type Tab = 'find' | 'active' | 'milestones' | 'register' | 'impact';

export function MentorshipScreen({ onClose }: Props) {
  const t = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('find');
  const [searchQuery, setSearchQuery] = useState('');
  const [registerSkills, setRegisterSkills] = useState<string[]>([]);
  const [registerBio, setRegisterBio] = useState('');

  const filteredMentors = useMemo(() => {
    if (!searchQuery.trim()) return DEMO_MENTORS;
    const q = searchQuery.toLowerCase();
    return DEMO_MENTORS.filter(
      (m) => m.name.toLowerCase().includes(q) || m.skills.some((s) => s.toLowerCase().includes(q)),
    );
  }, [searchQuery]);

  const myMentoringStats = useMemo(() => {
    const asMentor = DEMO_ACTIVE.filter((a) => a.role === 'mentor');
    const totalMentees = asMentor.length;
    const totalMilestones = asMentor.reduce((sum, a) => sum + a.milestones, 0);
    const totalEOTK = asMentor.reduce((sum, a) => sum + a.eOTKExchanged, 0);
    return { totalMentees, totalMilestones, totalEOTK };
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    heroCard: { backgroundColor: t.accent.blue + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSub: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginTop: 6, lineHeight: 18, fontStyle: 'italic' },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 16, backgroundColor: t.bg.card, borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.muted, fontSize: fonts.xs, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    section: { marginHorizontal: 20, marginTop: 20 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
    demoText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.semibold },
    searchInput: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md, borderWidth: 1, borderColor: t.border, marginBottom: 12 },
    mentorCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    mentorName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    mentorUid: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    mentorSkills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    skillTag: { backgroundColor: t.accent.blue + '20', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
    skillTagText: { color: t.accent.blue, fontSize: fonts.xs, fontWeight: fonts.semibold },
    mentorStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    mentorStat: { color: t.text.secondary, fontSize: fonts.sm },
    availableBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, marginTop: 8, alignSelf: 'flex-start' },
    availableText: { fontSize: fonts.xs, fontWeight: fonts.bold },
    connectBtn: { backgroundColor: t.accent.blue, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'flex-end', marginTop: 8 },
    connectBtnText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.bold },
    // Active mentorships
    activeCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4 },
    activeRole: { fontSize: fonts.xs, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1 },
    activeName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, marginTop: 4 },
    activeSkill: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 2 },
    activeStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    activeStat: { color: t.text.secondary, fontSize: fonts.sm },
    gratitudeBtn: { backgroundColor: t.accent.green + '20', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'flex-end', marginTop: 8 },
    gratitudeBtnText: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold },
    // Milestones
    milestoneItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.border },
    milestoneIcon: { fontSize: fonts.xxl, marginRight: 12 },
    milestoneInfo: { flex: 1 },
    milestoneName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    milestoneDate: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    milestoneEOTK: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold },
    milestoneMentee: { color: t.text.secondary, fontSize: fonts.xs, marginTop: 2 },
    // Register
    registerLabel: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold, marginBottom: 8, marginTop: 16 },
    skillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    regSkillChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, backgroundColor: t.bg.card, borderWidth: 1, borderColor: t.border },
    regSkillChipActive: { borderColor: t.accent.blue, backgroundColor: t.accent.blue + '20' },
    regSkillText: { color: t.text.secondary, fontSize: fonts.sm },
    regSkillTextActive: { color: t.accent.blue, fontWeight: fonts.semibold },
    input: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md, borderWidth: 1, borderColor: t.border, height: 80, textAlignVertical: 'top' },
    submitBtn: { backgroundColor: t.accent.blue, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
    submitBtnText: { color: '#fff', fontSize: fonts.lg, fontWeight: fonts.bold },
    sublabel: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginTop: 12, lineHeight: 18 },
    // Impact
    impactCard: { backgroundColor: t.bg.card, borderRadius: 20, padding: 20, marginBottom: 16 },
    statRow: { flexDirection: 'row', justifyContent: 'space-around' },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: fonts.xxl, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    impactQuote: { color: t.text.muted, fontSize: fonts.sm, fontStyle: 'italic', textAlign: 'center', lineHeight: 20, marginTop: 16 },
  }), [t]);

  const renderFind = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Find a Mentor</Text>
      <TextInput
        style={s.searchInput}
        placeholder="Search by name or skill..."
        placeholderTextColor={t.text.muted}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      {filteredMentors.map((mentor) => (
        <View key={mentor.uid} style={s.mentorCard}>
          <Text style={s.mentorName}>{mentor.name}</Text>
          <Text style={s.mentorUid}>{mentor.uid}</Text>
          <View style={s.mentorSkills}>
            {mentor.skills.map((skill) => (
              <View key={skill} style={s.skillTag}>
                <Text style={s.skillTagText}>{skill}</Text>
              </View>
            ))}
          </View>
          <View style={s.mentorStats}>
            <Text style={s.mentorStat}>{mentor.rating}/5.0 rating</Text>
            <Text style={s.mentorStat}>{mentor.menteeCount} mentees</Text>
            <Text style={[s.mentorStat, { color: t.accent.green }]}>{mentor.milestonesHelped} milestones</Text>
          </View>
          <View style={[s.availableBadge, { backgroundColor: mentor.available ? t.accent.green + '20' : t.accent.red + '20' }]}>
            <Text style={[s.availableText, { color: mentor.available ? t.accent.green : t.accent.red }]}>
              {mentor.available ? 'Available' : 'Fully Booked'}
            </Text>
          </View>
          {mentor.available && (
            <TouchableOpacity
              style={s.connectBtn}
              onPress={() => Alert.alert('Connection Request (Demo)', `Request sent to ${mentor.name}. In production, this creates a mentorship agreement on Open Chain.`)}
            >
              <Text style={s.connectBtnText}>Connect</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );

  const renderActive = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Active Mentorships</Text>
      {DEMO_ACTIVE.map((am) => (
        <View
          key={am.id}
          style={[s.activeCard, { borderLeftColor: am.role === 'mentor' ? t.accent.green : t.accent.blue }]}
        >
          <Text style={[s.activeRole, { color: am.role === 'mentor' ? t.accent.green : t.accent.blue }]}>
            {am.role === 'mentor' ? 'You are mentoring' : 'Your mentor'}
          </Text>
          <Text style={s.activeName}>{am.partnerName}</Text>
          <Text style={s.activeSkill}>{am.skill}</Text>
          <View style={s.activeStats}>
            <Text style={s.activeStat}>Since {am.startDate}</Text>
            <Text style={s.activeStat}>{am.milestones} milestones</Text>
            <Text style={[s.activeStat, { color: t.accent.green }]}>{am.eOTKExchanged} eOTK</Text>
          </View>
          {am.role === 'mentee' && (
            <TouchableOpacity
              style={s.gratitudeBtn}
              onPress={() => Alert.alert('Gratitude Sent (Demo)', `Thank you sent to ${am.partnerName}! In production, this sends eOTK as gratitude via Open Chain.`)}
            >
              <Text style={s.gratitudeBtnText}>Send Gratitude</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );

  const renderMilestones = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Mentorship Milestones</Text>
      {DEMO_MILESTONES.map((m) => (
        <View key={m.id} style={s.milestoneItem}>
          <Text style={s.milestoneIcon}>{'\u{2B50}'}</Text>
          <View style={s.milestoneInfo}>
            <Text style={s.milestoneName}>{m.title}</Text>
            <Text style={s.milestoneMentee}>{m.menteeName}</Text>
            <Text style={s.milestoneDate}>{m.date}</Text>
          </View>
          <Text style={s.milestoneEOTK}>+{m.eOTK} eOTK</Text>
        </View>
      ))}
    </View>
  );

  const toggleRegisterSkill = (skill: string) => {
    setRegisterSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  };

  const handleRegister = () => {
    if (registerSkills.length === 0) {
      Alert.alert('Select Skills', 'Please select at least one skill you can teach.');
      return;
    }
    Alert.alert(
      'Registered as Mentor (Demo)',
      `You are now registered to mentor: ${registerSkills.join(', ')}.\n\nIn production, your mentor profile will be published on Open Chain and mentees can find you.`,
    );
    setRegisterSkills([]);
    setRegisterBio('');
  };

  const renderRegister = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Register as Mentor</Text>

      <Text style={s.registerLabel}>Skills You Can Teach</Text>
      <View style={s.skillGrid}>
        {MENTORING_SKILLS.map((skill) => (
          <TouchableOpacity
            key={skill}
            style={[s.regSkillChip, registerSkills.includes(skill) && s.regSkillChipActive]}
            onPress={() => toggleRegisterSkill(skill)}
          >
            <Text style={[s.regSkillText, registerSkills.includes(skill) && s.regSkillTextActive]}>{skill}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.registerLabel}>About You (Optional)</Text>
      <TextInput
        style={s.input}
        placeholder="Tell potential mentees about your experience..."
        placeholderTextColor={t.text.muted}
        value={registerBio}
        onChangeText={setRegisterBio}
        multiline
      />

      <TouchableOpacity style={s.submitBtn} onPress={handleRegister}>
        <Text style={s.submitBtnText}>Register as Mentor</Text>
      </TouchableOpacity>

      <Text style={s.sublabel}>
        Mentors earn eOTK when their mentees achieve milestones. Your reputation grows with every successful mentorship.
      </Text>
    </View>
  );

  const renderImpact = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Mentorship Impact</Text>
      <View style={s.impactCard}>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{myMentoringStats.totalMentees}</Text>
            <Text style={s.statLabel}>People Mentored</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.green }]}>{myMentoringStats.totalMilestones}</Text>
            <Text style={s.statLabel}>Milestones Achieved</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.blue }]}>{myMentoringStats.totalEOTK}</Text>
            <Text style={s.statLabel}>eOTK Earned</Text>
          </View>
        </View>
        <Text style={s.impactQuote}>
          "You have mentored {myMentoringStats.totalMentees} people, helping them achieve {myMentoringStats.totalMilestones} milestones. Every hour you invest in others ripples through generations."
        </Text>
      </View>

      <Text style={s.sectionTitle}>All Mentors on Network (Demo)</Text>
      <View style={s.impactCard}>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{DEMO_MENTORS.length}</Text>
            <Text style={s.statLabel}>Active Mentors</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.green }]}>{DEMO_MENTORS.reduce((sum, m) => sum + m.milestonesHelped, 0)}</Text>
            <Text style={s.statLabel}>Total Milestones</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.purple }]}>{DEMO_MENTORS.reduce((sum, m) => sum + m.menteeCount, 0)}</Text>
            <Text style={s.statLabel}>Total Mentees</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: 'find', label: 'Find' },
    { key: 'active', label: 'Active' },
    { key: 'milestones', label: 'Milestones' },
    { key: 'register', label: 'Register' },
    { key: 'impact', label: 'Impact' },
  ];

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Mentorship</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.heroCard}>
          <Text style={s.heroIcon}>{'\u{1F91D}'}</Text>
          <Text style={s.heroTitle}>Connect, Teach, Grow</Text>
          <Text style={s.heroSub}>
            "Every child deserves a mentor. Every elder has wisdom to share. The chain of knowledge must never break."
          </Text>
        </View>

        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO MODE — Sample Data</Text>
        </View>

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

        {activeTab === 'find' && renderFind()}
        {activeTab === 'active' && renderActive()}
        {activeTab === 'milestones' && renderMilestones()}
        {activeTab === 'register' && renderRegister()}
        {activeTab === 'impact' && renderImpact()}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
