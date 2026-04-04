import { fonts } from '../utils/theme';
/**
 * HomeSchool Screen — Home education support, curriculum tracking.
 *
 * Article I: "Education is a fundamental human right, and every child
 *  deserves access to quality learning — whether at home or in community."
 * — Human Constitution, Article I
 *
 * Features:
 * - Curriculum planner (subjects: math, science, language, history, arts, life skills)
 * - Daily lesson schedule with completion tracking
 * - Portfolio builder (track student work, milestones, assessments)
 * - Homeschool co-op — connect with other homeschool families for group activities
 * - Resource library (open-source curricula, lesson plans, worksheets)
 * - eOTK earned for completing educational milestones
 * - Demo mode with 2 students, 6 subjects, today's schedule, 1 co-op group
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// ─── Types ───

interface Student {
  id: string;
  name: string;
  age: number;
  grade: string;
  totalEOTK: number;
  completedLessons: number;
  totalLessons: number;
}

interface Subject {
  key: string;
  label: string;
  icon: string;
  color: string;
}

interface Lesson {
  id: string;
  studentId: string;
  subject: string;
  title: string;
  time: string;
  duration: number; // minutes
  completed: boolean;
  eotkReward: number;
}

interface PortfolioItem {
  id: string;
  studentId: string;
  title: string;
  type: 'project' | 'assessment' | 'milestone' | 'certificate';
  subject: string;
  date: string;
  description: string;
  eotkEarned: number;
}

interface CoopGroup {
  id: string;
  name: string;
  families: number;
  students: number;
  nextActivity: string;
  nextDate: string;
  location: string;
  subjects: string[];
}

interface Resource {
  id: string;
  title: string;
  type: 'curriculum' | 'lesson_plan' | 'worksheet' | 'video' | 'interactive';
  subject: string;
  gradeRange: string;
  source: string;
  free: boolean;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const SUBJECTS: Subject[] = [
  { key: 'math', label: 'Math', icon: '#', color: '#007AFF' },
  { key: 'science', label: 'Science', icon: 'S', color: '#34C759' },
  { key: 'language', label: 'Language', icon: 'L', color: '#AF52DE' },
  { key: 'history', label: 'History', icon: 'H', color: '#FF9500' },
  { key: 'arts', label: 'Arts', icon: 'A', color: '#FF2D55' },
  { key: 'life_skills', label: 'Life Skills', icon: '~', color: '#5AC8FA' },
];

const SUBJECT_MAP: Record<string, Subject> = Object.fromEntries(
  SUBJECTS.map((s) => [s.key, s]),
);

// ─── Demo Data ───

const DEMO_STUDENTS: Student[] = [
  { id: 's1', name: 'Ava', age: 10, grade: '5th Grade', totalEOTK: 4850, completedLessons: 142, totalLessons: 180 },
  { id: 's2', name: 'Leo', age: 7, grade: '2nd Grade', totalEOTK: 2120, completedLessons: 98, totalLessons: 160 },
];

const DEMO_SCHEDULE: Lesson[] = [
  { id: 'l1', studentId: 's1', subject: 'math', title: 'Fractions & Decimals', time: '9:00 AM', duration: 45, completed: true, eotkReward: 35 },
  { id: 'l2', studentId: 's1', subject: 'science', title: 'Ecosystem Interactions', time: '10:00 AM', duration: 50, completed: true, eotkReward: 40 },
  { id: 'l3', studentId: 's1', subject: 'language', title: 'Creative Writing Workshop', time: '11:15 AM', duration: 40, completed: false, eotkReward: 30 },
  { id: 'l4', studentId: 's1', subject: 'history', title: 'Ancient Civilizations', time: '1:00 PM', duration: 45, completed: false, eotkReward: 35 },
  { id: 'l5', studentId: 's2', subject: 'math', title: 'Addition & Subtraction Practice', time: '9:00 AM', duration: 30, completed: true, eotkReward: 25 },
  { id: 'l6', studentId: 's2', subject: 'language', title: 'Phonics & Reading', time: '9:45 AM', duration: 35, completed: true, eotkReward: 25 },
  { id: 'l7', studentId: 's2', subject: 'arts', title: 'Watercolor Painting', time: '10:30 AM', duration: 40, completed: false, eotkReward: 20 },
  { id: 'l8', studentId: 's2', subject: 'life_skills', title: 'Kitchen Safety & Cooking', time: '11:30 AM', duration: 45, completed: false, eotkReward: 30 },
];

const DEMO_PORTFOLIO: PortfolioItem[] = [
  { id: 'p1', studentId: 's1', title: 'Solar System Model', type: 'project', subject: 'science', date: '2026-03-25', description: 'Built a scale model of the solar system with orbital paths', eotkEarned: 120 },
  { id: 'p2', studentId: 's1', title: 'Multiplication Mastery', type: 'milestone', subject: 'math', date: '2026-03-20', description: 'Completed all multiplication tables through 12x12', eotkEarned: 200 },
  { id: 'p3', studentId: 's1', title: 'Book Report: Charlotte\'s Web', type: 'assessment', subject: 'language', date: '2026-03-18', description: 'Written report with character analysis and themes', eotkEarned: 80 },
  { id: 'p4', studentId: 's2', title: 'Counting to 1000', type: 'milestone', subject: 'math', date: '2026-03-27', description: 'Can count and write numbers up to 1000', eotkEarned: 150 },
  { id: 'p5', studentId: 's2', title: 'First Chapter Book', type: 'milestone', subject: 'language', date: '2026-03-22', description: 'Finished reading first chapter book independently', eotkEarned: 180 },
  { id: 'p6', studentId: 's1', title: 'History Timeline', type: 'project', subject: 'history', date: '2026-03-15', description: 'Illustrated timeline of ancient Egypt', eotkEarned: 100 },
];

const DEMO_COOP: CoopGroup = {
  id: 'c1',
  name: 'Valley Learners Co-op',
  families: 8,
  students: 14,
  nextActivity: 'Science Fair Prep & Practice',
  nextDate: '2026-04-02',
  location: 'Community Center Room B',
  subjects: ['science', 'arts', 'life_skills'],
};

const DEMO_RESOURCES: Resource[] = [
  { id: 'r1', title: 'Khan Academy Math', type: 'interactive', subject: 'math', gradeRange: 'K-12', source: 'Khan Academy', free: true },
  { id: 'r2', title: 'CK-12 Science Textbooks', type: 'curriculum', subject: 'science', gradeRange: '3-8', source: 'CK-12 Foundation', free: true },
  { id: 'r3', title: 'Writing Prompts Collection', type: 'worksheet', subject: 'language', gradeRange: '2-6', source: 'Open Education', free: true },
  { id: 'r4', title: 'World History for Kids', type: 'lesson_plan', subject: 'history', gradeRange: '4-8', source: 'Smithsonian Learning', free: true },
  { id: 'r5', title: 'Art Projects for All Ages', type: 'lesson_plan', subject: 'arts', gradeRange: 'K-8', source: 'Deep Space Sparkle', free: true },
  { id: 'r6', title: 'Life Skills Curriculum', type: 'curriculum', subject: 'life_skills', gradeRange: '1-6', source: 'Open Chain Education', free: true },
  { id: 'r7', title: 'Nature Science Video Series', type: 'video', subject: 'science', gradeRange: '1-5', source: 'PBS LearningMedia', free: true },
  { id: 'r8', title: 'Math Worksheets Generator', type: 'worksheet', subject: 'math', gradeRange: 'K-6', source: 'Math-Drills', free: true },
];

const PORTFOLIO_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  project: { label: 'Project', color: '#007AFF' },
  assessment: { label: 'Assessment', color: '#FF9500' },
  milestone: { label: 'Milestone', color: '#34C759' },
  certificate: { label: 'Certificate', color: '#AF52DE' },
};

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  curriculum: 'Curriculum',
  lesson_plan: 'Lesson Plan',
  worksheet: 'Worksheet',
  video: 'Video',
  interactive: 'Interactive',
};

type Tab = 'schedule' | 'portfolio' | 'co-op' | 'resources';

const TABS: { key: Tab; label: string }[] = [
  { key: 'schedule', label: 'Schedule' },
  { key: 'portfolio', label: 'Portfolio' },
  { key: 'co-op', label: 'Co-op' },
  { key: 'resources', label: 'Resources' },
];

export function HomeSchoolScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('schedule');
  const [selectedStudent, setSelectedStudent] = useState('s1');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const students = DEMO_STUDENTS;
  const schedule = DEMO_SCHEDULE;
  const portfolio = DEMO_PORTFOLIO;
  const coop = DEMO_COOP;
  const resources = DEMO_RESOURCES;

  const currentStudent = students.find((s) => s.id === selectedStudent) || students[0];
  const studentSchedule = useMemo(
    () => schedule.filter((l) => l.studentId === selectedStudent),
    [selectedStudent],
  );
  const studentPortfolio = useMemo(
    () => portfolio.filter((p) => p.studentId === selectedStudent),
    [selectedStudent],
  );

  const completedToday = useMemo(
    () => studentSchedule.filter((l) => l.completed).length,
    [studentSchedule],
  );
  const eotkEarnedToday = useMemo(
    () => studentSchedule.filter((l) => l.completed).reduce((sum, l) => sum + l.eotkReward, 0),
    [studentSchedule],
  );

  const handleCompleteLesson = useCallback((lesson: Lesson) => {
    Alert.alert(
      'Lesson Complete!',
      `"${lesson.title}" marked as done.\n+${lesson.eotkReward} eOTK earned!`,
    );
  }, []);

  const handleJoinCoop = useCallback(() => {
    Alert.alert(
      'Co-op Activity',
      `Signed up for "${coop.nextActivity}" on ${coop.nextDate}.\nLocation: ${coop.location}`,
    );
  }, []);

  const handleOpenResource = useCallback((resource: Resource) => {
    Alert.alert(
      resource.title,
      `Source: ${resource.source}\nGrades: ${resource.gradeRange}\nType: ${RESOURCE_TYPE_LABELS[resource.type]}\n\nOpening resource...`,
    );
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.purple + '20' },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.purple },

    // Student selector
    studentRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16 },
    studentChip: { flex: 1, backgroundColor: t.bg.secondary, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
    studentChipActive: { borderColor: t.accent.purple, backgroundColor: t.accent.purple + '10' },
    studentName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, marginBottom: 2 },
    studentGrade: { color: t.text.muted, fontSize: fonts.sm },
    studentEotk: { color: t.accent.purple, fontSize: fonts.sm, fontWeight: fonts.bold, marginTop: 4 },

    // Schedule
    summaryCard: { backgroundColor: t.accent.purple + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    summaryTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 4 },
    summaryText: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    summaryEotk: { color: t.accent.purple, fontSize: fonts.xxl, fontWeight: fonts.heavy, marginTop: 8 },
    summaryEotkLabel: { color: t.text.muted, fontSize: fonts.xs, textTransform: 'uppercase', letterSpacing: 1 },
    progressBar: { height: 8, backgroundColor: t.bg.secondary, borderRadius: 4, marginHorizontal: 20, marginBottom: 16, overflow: 'hidden' as const },
    progressFill: { height: '100%' as any, backgroundColor: t.accent.purple, borderRadius: 4 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    lessonCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
    lessonDone: { opacity: 0.6 },
    subjectDot: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    subjectDotText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    lessonInfo: { flex: 1 },
    lessonTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    lessonMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    lessonRight: { alignItems: 'flex-end' },
    lessonEotk: { color: t.accent.purple, fontSize: fonts.sm, fontWeight: fonts.bold },
    lessonCheck: { color: '#34C759', fontSize: fonts.xl, fontWeight: fonts.bold, marginTop: 2 },
    completeBtn: { backgroundColor: t.accent.purple + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginTop: 4 },
    completeBtnText: { color: t.accent.purple, fontSize: fonts.xs, fontWeight: fonts.bold },

    // Portfolio
    portfolioCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    portfolioHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    portfolioTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, flex: 1 },
    typeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
    typeBadgeText: { color: '#fff', fontSize: fonts.xs, fontWeight: fonts.bold },
    portfolioDesc: { color: t.text.muted, fontSize: fonts.sm, lineHeight: 19, marginBottom: 8 },
    portfolioFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    portfolioDate: { color: t.text.muted, fontSize: fonts.sm },
    portfolioEotk: { color: t.accent.purple, fontSize: fonts.sm, fontWeight: fonts.bold },
    portfolioSubject: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },

    // Co-op
    coopCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    coopName: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy, marginBottom: 8 },
    coopStat: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
    coopStatItem: { alignItems: 'center' },
    coopStatValue: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    coopStatLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    coopSection: { marginTop: 12 },
    coopLabel: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
    coopValue: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold, marginBottom: 4 },
    coopSubjects: { flexDirection: 'row', gap: 8, marginTop: 8 },
    coopSubjectChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    coopSubjectText: { color: '#fff', fontSize: fonts.xs, fontWeight: fonts.bold },
    joinBtn: { backgroundColor: t.accent.purple, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
    joinBtnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    coopNote: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginHorizontal: 20, marginTop: 8, lineHeight: 18 },

    // Resources
    resourceCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
    resourceIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    resourceIconText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    resourceInfo: { flex: 1 },
    resourceTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    resourceMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    resourceBadge: { backgroundColor: '#34C759', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4, alignSelf: 'flex-start' },
    resourceBadgeText: { color: '#fff', fontSize: fonts.xs, fontWeight: fonts.bold },
    openBtn: { backgroundColor: t.accent.purple + '20', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
    openBtnText: { color: t.accent.purple, fontSize: fonts.sm, fontWeight: fonts.bold },

    emptyText: { color: t.text.muted, fontSize: fonts.md, textAlign: 'center', marginTop: 40, marginHorizontal: 20 },
  }), [t]);

  // ─── Schedule Tab ───
  const renderSchedule = () => (
    <>
      <View style={s.summaryCard}>
        <Text style={s.summaryTitle}>Today's Progress: {currentStudent.name}</Text>
        <Text style={s.summaryText}>
          {completedToday} of {studentSchedule.length} lessons completed
        </Text>
        <Text style={s.summaryEotk}>+{eotkEarnedToday} eOTK</Text>
        <Text style={s.summaryEotkLabel}>earned today</Text>
      </View>

      <View style={s.progressBar}>
        <View
          style={[
            s.progressFill,
            { width: `${studentSchedule.length > 0 ? (completedToday / studentSchedule.length) * 100 : 0}%` as any },
          ]}
        />
      </View>

      <Text style={s.sectionTitle}>Today's Lessons</Text>
      {studentSchedule.map((lesson) => {
        const subj = SUBJECT_MAP[lesson.subject];
        return (
          <TouchableOpacity
            key={lesson.id}
            style={[s.lessonCard, lesson.completed && s.lessonDone]}
            onPress={() => !lesson.completed && handleCompleteLesson(lesson)}
            disabled={lesson.completed}
          >
            <View style={[s.subjectDot, { backgroundColor: subj?.color || t.text.muted }]}>
              <Text style={s.subjectDotText}>{subj?.icon || '?'}</Text>
            </View>
            <View style={s.lessonInfo}>
              <Text style={s.lessonTitle}>{lesson.title}</Text>
              <Text style={s.lessonMeta}>
                {lesson.time} / {lesson.duration} min / {subj?.label || lesson.subject}
              </Text>
            </View>
            <View style={s.lessonRight}>
              <Text style={s.lessonEotk}>+{lesson.eotkReward} eOTK</Text>
              {lesson.completed ? (
                <Text style={s.lessonCheck}>Done</Text>
              ) : (
                <View style={s.completeBtn}>
                  <Text style={s.completeBtnText}>Complete</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </>
  );

  // ─── Portfolio Tab ───
  const renderPortfolio = () => (
    <>
      <Text style={s.sectionTitle}>{currentStudent.name}'s Portfolio</Text>
      {studentPortfolio.length === 0 ? (
        <Text style={s.emptyText}>No portfolio items yet. Complete milestones to build the portfolio!</Text>
      ) : (
        studentPortfolio.map((item) => {
          const typeInfo = PORTFOLIO_TYPE_LABELS[item.type] || { label: item.type, color: '#8E8E93' };
          const subj = SUBJECT_MAP[item.subject];
          return (
            <View key={item.id} style={s.portfolioCard}>
              <View style={s.portfolioHeader}>
                <Text style={s.portfolioTitle}>{item.title}</Text>
                <View style={[s.typeBadge, { backgroundColor: typeInfo.color }]}>
                  <Text style={s.typeBadgeText}>{typeInfo.label}</Text>
                </View>
              </View>
              <Text style={s.portfolioDesc}>{item.description}</Text>
              <View style={s.portfolioFooter}>
                <Text style={s.portfolioSubject}>{subj?.label || item.subject}</Text>
                <Text style={s.portfolioDate}>{item.date}</Text>
                <Text style={s.portfolioEotk}>+{item.eotkEarned} eOTK</Text>
              </View>
            </View>
          );
        })
      )}
    </>
  );

  // ─── Co-op Tab ───
  const renderCoop = () => (
    <>
      <View style={s.coopCard}>
        <Text style={s.coopName}>{coop.name}</Text>
        <View style={s.coopStat}>
          <View style={s.coopStatItem}>
            <Text style={s.coopStatValue}>{coop.families}</Text>
            <Text style={s.coopStatLabel}>Families</Text>
          </View>
          <View style={s.coopStatItem}>
            <Text style={s.coopStatValue}>{coop.students}</Text>
            <Text style={s.coopStatLabel}>Students</Text>
          </View>
        </View>

        <View style={s.coopSection}>
          <Text style={s.coopLabel}>Next Activity</Text>
          <Text style={s.coopValue}>{coop.nextActivity}</Text>
          <Text style={s.lessonMeta}>{coop.nextDate} at {coop.location}</Text>
        </View>

        <View style={s.coopSection}>
          <Text style={s.coopLabel}>Focus Subjects</Text>
          <View style={s.coopSubjects}>
            {coop.subjects.map((subKey) => {
              const subj = SUBJECT_MAP[subKey];
              return (
                <View key={subKey} style={[s.coopSubjectChip, { backgroundColor: subj?.color || '#8E8E93' }]}>
                  <Text style={s.coopSubjectText}>{subj?.label || subKey}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <TouchableOpacity style={s.joinBtn} onPress={handleJoinCoop}>
          <Text style={s.joinBtnText}>Sign Up for Next Activity</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.coopNote}>
        Homeschool co-ops let families share teaching responsibilities, resources,
        and social experiences. Group activities earn bonus eOTK for all participants.
      </Text>
    </>
  );

  // ─── Resources Tab ───
  const renderResources = () => (
    <>
      <Text style={s.sectionTitle}>Open-Source Resources</Text>
      {resources.map((resource) => {
        const subj = SUBJECT_MAP[resource.subject];
        return (
          <TouchableOpacity
            key={resource.id}
            style={s.resourceCard}
            onPress={() => handleOpenResource(resource)}
          >
            <View style={[s.resourceIcon, { backgroundColor: subj?.color || '#8E8E93' }]}>
              <Text style={s.resourceIconText}>{subj?.icon || '?'}</Text>
            </View>
            <View style={s.resourceInfo}>
              <Text style={s.resourceTitle}>{resource.title}</Text>
              <Text style={s.resourceMeta}>
                {RESOURCE_TYPE_LABELS[resource.type]} / Grades {resource.gradeRange} / {resource.source}
              </Text>
              {resource.free && (
                <View style={s.resourceBadge}>
                  <Text style={s.resourceBadgeText}>FREE</Text>
                </View>
              )}
            </View>
            <View style={s.openBtn}>
              <Text style={s.openBtnText}>Open</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Home School</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      {/* Student selector */}
      <View style={s.studentRow}>
        {students.map((student) => (
          <TouchableOpacity
            key={student.id}
            style={[s.studentChip, selectedStudent === student.id && s.studentChipActive]}
            onPress={() => setSelectedStudent(student.id)}
          >
            <Text style={s.studentName}>{student.name}</Text>
            <Text style={s.studentGrade}>{student.grade}, Age {student.age}</Text>
            <Text style={s.studentEotk}>{student.totalEOTK.toLocaleString()} eOTK</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[s.tabBtn, tab === t.key && s.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {tab === 'schedule' && renderSchedule()}
        {tab === 'portfolio' && renderPortfolio()}
        {tab === 'co-op' && renderCoop()}
        {tab === 'resources' && renderResources()}
      </ScrollView>
    </SafeAreaView>
  );
}
