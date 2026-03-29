/**
 * Education Hub Screen — Centralized education dashboard.
 *
 * "The greatest investment any civilization can make is in the raising
 *  and education of its children."
 * — Human Constitution, Article I
 *
 * Tracks learning journeys, children's progress (for parents),
 * students' progress (for teachers), milestone submissions, and
 * regional education statistics.  All data is demo/sample until
 * connected to Open Chain.
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

interface LearningMilestone {
  id: string;
  title: string;
  date: string;
  eOTKEarned: number;
  badge: string;
}

interface ChildProgress {
  name: string;
  age: number;
  milestones: LearningMilestone[];
  totalEOTK: number;
}

interface StudentProgress {
  name: string;
  uid: string;
  milestones: number;
  eOTKAttributed: number;
  latestAchievement: string;
}

interface EdStats {
  region: string;
  literacyRate: number;
  milestoneCompletionRate: number;
  activeParents: number;
  activeTeachers: number;
}

/* ── demo data ── */

const DEMO_MY_MILESTONES: LearningMilestone[] = [
  { id: 'lm1', title: 'Completed Open Wallet Tutorial', date: '2026-01-10', eOTKEarned: 20, badge: '\u{1F393}' },
  { id: 'lm2', title: 'Learned Basic Cryptography', date: '2026-02-05', eOTKEarned: 50, badge: '\u{1F512}' },
  { id: 'lm3', title: 'Passed Financial Literacy Course', date: '2026-03-01', eOTKEarned: 100, badge: '\u{1F4B0}' },
  { id: 'lm4', title: 'First Contribution to Open Source', date: '2026-03-20', eOTKEarned: 150, badge: '\u{1F4BB}' },
];

const DEMO_CHILDREN: ChildProgress[] = [
  {
    name: 'Anaya (age 7)',
    age: 7,
    totalEOTK: 580,
    milestones: [
      { id: 'c1m1', title: 'Read First Chapter Book', date: '2025-09-15', eOTKEarned: 80, badge: '\u{1F4D6}' },
      { id: 'c1m2', title: 'Passed Grade 1 Math', date: '2025-12-20', eOTKEarned: 120, badge: '\u{1F522}' },
      { id: 'c1m3', title: 'Learned to Swim', date: '2026-01-18', eOTKEarned: 100, badge: '\u{1F3CA}' },
      { id: 'c1m4', title: 'First Science Fair Project', date: '2026-03-10', eOTKEarned: 150, badge: '\u{1F52C}' },
      { id: 'c1m5', title: 'Grade Level Reading Achieved', date: '2026-03-25', eOTKEarned: 130, badge: '\u{2B50}' },
    ],
  },
  {
    name: 'Rohan (age 4)',
    age: 4,
    totalEOTK: 250,
    milestones: [
      { id: 'c2m1', title: 'Learned Alphabet', date: '2025-11-01', eOTKEarned: 60, badge: '\u{1F524}' },
      { id: 'c2m2', title: 'Counting to 20', date: '2026-01-15', eOTKEarned: 70, badge: '\u{1F522}' },
      { id: 'c2m3', title: 'First Painting', date: '2026-02-28', eOTKEarned: 50, badge: '\u{1F3A8}' },
      { id: 'c2m4', title: 'Started Preschool', date: '2026-03-05', eOTKEarned: 70, badge: '\u{1F3EB}' },
    ],
  },
];

const DEMO_STUDENTS: StudentProgress[] = [
  { name: 'Student Aisha', uid: 'uid-stud-001', milestones: 5, eOTKAttributed: 150, latestAchievement: 'Grade Level Math' },
  { name: 'Student Ben', uid: 'uid-stud-002', milestones: 3, eOTKAttributed: 90, latestAchievement: 'First Essay Written' },
  { name: 'Student Chiara', uid: 'uid-stud-003', milestones: 7, eOTKAttributed: 210, latestAchievement: 'Science Olympiad Medal' },
  { name: 'Student Dev', uid: 'uid-stud-004', milestones: 4, eOTKAttributed: 120, latestAchievement: 'Learned Basic Coding' },
];

const DEMO_STATS: EdStats[] = [
  { region: 'South Asia', literacyRate: 73.2, milestoneCompletionRate: 41, activeParents: 1240, activeTeachers: 310 },
  { region: 'Sub-Saharan Africa', literacyRate: 65.5, milestoneCompletionRate: 34, activeParents: 890, activeTeachers: 215 },
  { region: 'Latin America', literacyRate: 94.1, milestoneCompletionRate: 62, activeParents: 2100, activeTeachers: 530 },
  { region: 'East Asia', literacyRate: 96.8, milestoneCompletionRate: 78, activeParents: 3400, activeTeachers: 870 },
  { region: 'Global Average', literacyRate: 86.3, milestoneCompletionRate: 55, activeParents: 15200, activeTeachers: 3800 },
];

const MILESTONE_TYPES = [
  'Child read first book',
  'Passed a grade',
  'Learned a new skill',
  'Graduated',
  'Completed a course',
  'Won a competition',
  'Other',
];

type Tab = 'journey' | 'children' | 'students' | 'submit' | 'stats';

export function EducationHubScreen({ onClose }: Props) {
  const t = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('journey');
  const [expandedChild, setExpandedChild] = useState<number | null>(null);
  const [selectedMilestoneType, setSelectedMilestoneType] = useState<string | null>(null);
  const [milestoneDescription, setMilestoneDescription] = useState('');
  const [childName, setChildName] = useState('');

  const myTotalEOTK = useMemo(() => DEMO_MY_MILESTONES.reduce((sum, m) => sum + m.eOTKEarned, 0), []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    heroCard: { backgroundColor: t.accent.green + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: '800', textAlign: 'center' },
    heroQuote: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginTop: 8, lineHeight: 18, fontStyle: 'italic' },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 16, backgroundColor: t.bg.card, borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: t.accent.green },
    tabText: { color: t.text.muted, fontSize: 11, fontWeight: '600' },
    tabTextActive: { color: t.bg.primary },
    section: { marginHorizontal: 20, marginTop: 20 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 12 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    label: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    sublabel: { color: t.text.secondary, fontSize: 12, marginTop: 2 },
    badge: { fontSize: 24 },
    eotk: { color: t.accent.green, fontSize: 14, fontWeight: '700' },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    milestoneItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.border },
    milestoneBadge: { fontSize: 28, marginRight: 12 },
    milestoneInfo: { flex: 1 },
    milestoneName: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    milestoneDate: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    milestoneEOTK: { color: t.accent.green, fontSize: 13, fontWeight: '700' },
    childHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
    childName: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    childEOTK: { color: t.accent.green, fontSize: 13, fontWeight: '600' },
    expandArrow: { color: t.text.muted, fontSize: 16 },
    // Submit tab
    input: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 14, borderWidth: 1, borderColor: t.border, marginBottom: 12 },
    typeChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, backgroundColor: t.bg.card, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: t.border },
    typeChipActive: { backgroundColor: t.accent.green + '20', borderColor: t.accent.green },
    typeChipText: { color: t.text.secondary, fontSize: 13 },
    typeChipTextActive: { color: t.accent.green, fontWeight: '600' },
    submitBtn: { backgroundColor: t.accent.green, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
    submitBtnText: { color: t.bg.primary, fontSize: 16, fontWeight: '700' },
    // Stats
    statsCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 14, marginBottom: 10 },
    statsRegion: { color: t.text.primary, fontSize: 14, fontWeight: '700' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    statsItem: { alignItems: 'center', flex: 1 },
    statsValue: { color: t.accent.blue, fontSize: 16, fontWeight: '800' },
    statsLabel: { color: t.text.muted, fontSize: 10, marginTop: 2, textAlign: 'center' },
    barContainer: { height: 6, backgroundColor: t.border, borderRadius: 3, marginTop: 6 },
    barFill: { height: 6, borderRadius: 3 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: '600' },
    studentCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 14, marginBottom: 10 },
    studentName: { color: t.text.primary, fontSize: 14, fontWeight: '700' },
    studentUid: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    studentDetail: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    studentDetailText: { color: t.text.secondary, fontSize: 12 },
  }), [t]);

  const renderTabs = () => {
    const tabs: { key: Tab; label: string }[] = [
      { key: 'journey', label: 'My Journey' },
      { key: 'children', label: 'Children' },
      { key: 'students', label: 'Students' },
      { key: 'submit', label: 'Submit' },
      { key: 'stats', label: 'Stats' },
    ];
    return (
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
    );
  };

  const renderJourney = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>My Learning Journey</Text>
      <View style={s.card}>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{DEMO_MY_MILESTONES.length}</Text>
            <Text style={s.statLabel}>Milestones</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.green }]}>{myTotalEOTK}</Text>
            <Text style={s.statLabel}>eOTK Earned</Text>
          </View>
        </View>
      </View>
      {DEMO_MY_MILESTONES.map((m) => (
        <View key={m.id} style={s.milestoneItem}>
          <Text style={s.milestoneBadge}>{m.badge}</Text>
          <View style={s.milestoneInfo}>
            <Text style={s.milestoneName}>{m.title}</Text>
            <Text style={s.milestoneDate}>{m.date}</Text>
          </View>
          <Text style={s.milestoneEOTK}>+{m.eOTKEarned} eOTK</Text>
        </View>
      ))}
    </View>
  );

  const renderChildren = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>My Children's Progress</Text>
      {DEMO_CHILDREN.map((child, idx) => (
        <View key={child.name} style={s.card}>
          <TouchableOpacity style={s.childHeader} onPress={() => setExpandedChild(expandedChild === idx ? null : idx)}>
            <View>
              <Text style={s.childName}>{child.name}</Text>
              <Text style={s.sublabel}>{child.milestones.length} milestones achieved</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={s.childEOTK}>{child.totalEOTK} eOTK</Text>
              <Text style={s.expandArrow}>{expandedChild === idx ? '\u25B2' : '\u25BC'}</Text>
            </View>
          </TouchableOpacity>
          {expandedChild === idx && child.milestones.map((m) => (
            <View key={m.id} style={s.milestoneItem}>
              <Text style={s.milestoneBadge}>{m.badge}</Text>
              <View style={s.milestoneInfo}>
                <Text style={s.milestoneName}>{m.title}</Text>
                <Text style={s.milestoneDate}>{m.date}</Text>
              </View>
              <Text style={s.milestoneEOTK}>+{m.eOTKEarned} eOTK</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );

  const renderStudents = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>My Students' Progress</Text>
      <View style={s.card}>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{DEMO_STUDENTS.length}</Text>
            <Text style={s.statLabel}>Students</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.green }]}>{DEMO_STUDENTS.reduce((sum, st) => sum + st.eOTKAttributed, 0)}</Text>
            <Text style={s.statLabel}>eOTK Attributed</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.blue }]}>{DEMO_STUDENTS.reduce((sum, st) => sum + st.milestones, 0)}</Text>
            <Text style={s.statLabel}>Total Milestones</Text>
          </View>
        </View>
      </View>
      {DEMO_STUDENTS.map((student) => (
        <View key={student.uid} style={s.studentCard}>
          <Text style={s.studentName}>{student.name}</Text>
          <Text style={s.studentUid}>{student.uid}</Text>
          <View style={s.studentDetail}>
            <Text style={s.studentDetailText}>{student.milestones} milestones</Text>
            <Text style={[s.studentDetailText, { color: t.accent.green }]}>{student.eOTKAttributed} eOTK</Text>
          </View>
          <Text style={[s.studentDetailText, { marginTop: 4 }]}>Latest: {student.latestAchievement}</Text>
        </View>
      ))}
    </View>
  );

  const handleSubmitMilestone = () => {
    if (!selectedMilestoneType) {
      Alert.alert('Select Type', 'Please select a milestone type.');
      return;
    }
    if (!childName.trim()) {
      Alert.alert('Enter Name', 'Please enter the child or student name.');
      return;
    }
    Alert.alert(
      'Milestone Submitted (Demo)',
      `"${selectedMilestoneType}" for ${childName.trim()} has been submitted for verification.\n\nIn production, this will be recorded on Open Chain and eOTK will be minted upon verification.`,
    );
    setSelectedMilestoneType(null);
    setMilestoneDescription('');
    setChildName('');
  };

  const renderSubmit = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Submit Milestone</Text>
      <TextInput
        style={s.input}
        placeholder="Child or student name"
        placeholderTextColor={t.text.muted}
        value={childName}
        onChangeText={setChildName}
      />
      <Text style={[s.label, { marginBottom: 8 }]}>Milestone Type</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {MILESTONE_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[s.typeChip, selectedMilestoneType === type && s.typeChipActive]}
            onPress={() => setSelectedMilestoneType(type)}
          >
            <Text style={[s.typeChipText, selectedMilestoneType === type && s.typeChipTextActive]}>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={[s.input, { height: 80, textAlignVertical: 'top', marginTop: 4 }]}
        placeholder="Description (optional)"
        placeholderTextColor={t.text.muted}
        value={milestoneDescription}
        onChangeText={setMilestoneDescription}
        multiline
      />
      <TouchableOpacity style={s.submitBtn} onPress={handleSubmitMilestone}>
        <Text style={s.submitBtnText}>Submit for Verification</Text>
      </TouchableOpacity>
      <Text style={[s.sublabel, { textAlign: 'center', marginTop: 12, lineHeight: 18 }]}>
        Milestones are verified by community validators (teachers, parents, mentors) before eOTK is minted.
      </Text>
    </View>
  );

  const renderStats = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Education Stats</Text>
      {DEMO_STATS.map((stat) => (
        <View key={stat.region} style={s.statsCard}>
          <Text style={s.statsRegion}>{stat.region}</Text>
          <View style={s.barContainer}>
            <View style={[s.barFill, { width: `${stat.literacyRate}%`, backgroundColor: t.accent.blue }]} />
          </View>
          <View style={s.statsRow}>
            <View style={s.statsItem}>
              <Text style={s.statsValue}>{stat.literacyRate}%</Text>
              <Text style={s.statsLabel}>Literacy Rate</Text>
            </View>
            <View style={s.statsItem}>
              <Text style={[s.statsValue, { color: t.accent.green }]}>{stat.milestoneCompletionRate}%</Text>
              <Text style={s.statsLabel}>Milestones Done</Text>
            </View>
            <View style={s.statsItem}>
              <Text style={[s.statsValue, { color: t.accent.purple }]}>{stat.activeParents}</Text>
              <Text style={s.statsLabel}>Parents</Text>
            </View>
            <View style={s.statsItem}>
              <Text style={[s.statsValue, { color: t.accent.orange }]}>{stat.activeTeachers}</Text>
              <Text style={s.statsLabel}>Teachers</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Education Hub</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.heroCard}>
          <Text style={s.heroIcon}>{'\u{1F3EB}'}</Text>
          <Text style={s.heroTitle}>The Greatest Investment</Text>
          <Text style={s.heroQuote}>
            "The greatest investment any civilization can make is in the raising and education of its children."
            {'\n'}— Human Constitution, Article I
          </Text>
        </View>

        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO MODE — Sample Data</Text>
        </View>

        {renderTabs()}

        {activeTab === 'journey' && renderJourney()}
        {activeTab === 'children' && renderChildren()}
        {activeTab === 'students' && renderStudents()}
        {activeTab === 'submit' && renderSubmit()}
        {activeTab === 'stats' && renderStats()}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
