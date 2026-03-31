/**
 * Language School Screen — Structured language learning with curriculum and eOTK.
 *
 * Learn new languages through community-taught courses, practice with
 * native speakers, and earn eOTK for completing lessons and milestones.
 * "Every language learned is a bridge built."
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

interface Course {
  id: string;
  language: string;
  level: string;
  icon: string;
  instructor: string;
  lessons: number;
  completed: number;
  eOTKReward: number;
  enrolled: boolean;
  students: number;
}

interface PracticePartner {
  id: string;
  name: string;
  icon: string;
  language: string;
  level: string;
  available: boolean;
  sessions: number;
}

interface ProgressEntry {
  language: string;
  icon: string;
  level: string;
  lessonsCompleted: number;
  totalLessons: number;
  eOTKEarned: number;
  streak: number;
  color: string;
}

const DEMO_COURSES: Course[] = [
  { id: 'c1', language: 'Spanish', level: 'Beginner', icon: '\u{1F1EA}\u{1F1F8}', instructor: 'Carlos Mendez', lessons: 24, completed: 18, eOTKReward: 120, enrolled: true, students: 34 },
  { id: 'c2', language: 'Mandarin', level: 'Beginner', icon: '\u{1F1E8}\u{1F1F3}', instructor: 'Sarah Liu', lessons: 30, completed: 0, eOTKReward: 150, enrolled: false, students: 28 },
  { id: 'c3', language: 'Hindi', level: 'Intermediate', icon: '\u{1F1EE}\u{1F1F3}', instructor: 'Preet Singh', lessons: 20, completed: 12, eOTKReward: 100, enrolled: true, students: 22 },
  { id: 'c4', language: 'Arabic', level: 'Beginner', icon: '\u{1F1F8}\u{1F1E6}', instructor: 'Fatima Al-Rashid', lessons: 28, completed: 0, eOTKReward: 140, enrolled: false, students: 19 },
  { id: 'c5', language: 'Japanese', level: 'Beginner', icon: '\u{1F1EF}\u{1F1F5}', instructor: 'Akira Tanaka', lessons: 32, completed: 5, eOTKReward: 160, enrolled: true, students: 25 },
  { id: 'c6', language: 'French', level: 'Intermediate', icon: '\u{1F1EB}\u{1F1F7}', instructor: 'Elena Rodriguez', lessons: 22, completed: 0, eOTKReward: 110, enrolled: false, students: 31 },
];

const DEMO_PARTNERS: PracticePartner[] = [
  { id: 'p1', name: 'Carlos M.', icon: '\u{1F468}', language: 'Spanish', level: 'Native', available: true, sessions: 12 },
  { id: 'p2', name: 'Yuki T.', icon: '\u{1F469}', language: 'Japanese', level: 'Native', available: true, sessions: 5 },
  { id: 'p3', name: 'Preet S.', icon: '\u{1F9D4}', language: 'Hindi', level: 'Native', available: false, sessions: 8 },
  { id: 'p4', name: 'Marie D.', icon: '\u{1F469}', language: 'French', level: 'Native', available: true, sessions: 3 },
  { id: 'p5', name: 'Li W.', icon: '\u{1F468}', language: 'Mandarin', level: 'Native', available: true, sessions: 0 },
  { id: 'p6', name: 'Amina H.', icon: '\u{1F469}', language: 'Arabic', level: 'Native', available: false, sessions: 7 },
];

const DEMO_PROGRESS: ProgressEntry[] = [
  { language: 'Spanish', icon: '\u{1F1EA}\u{1F1F8}', level: 'Beginner', lessonsCompleted: 18, totalLessons: 24, eOTKEarned: 90, streak: 12, color: '#ef4444' },
  { language: 'Hindi', icon: '\u{1F1EE}\u{1F1F3}', level: 'Intermediate', lessonsCompleted: 12, totalLessons: 20, eOTKEarned: 60, streak: 5, color: '#f59e0b' },
  { language: 'Japanese', icon: '\u{1F1EF}\u{1F1F5}', level: 'Beginner', lessonsCompleted: 5, totalLessons: 32, eOTKEarned: 25, streak: 3, color: '#ec4899' },
];

export function LanguageSchoolScreen({ onClose }: Props) {
  const t = useTheme();
  const { demoMode } = useWalletStore();
  const [activeTab, setActiveTab] = useState<'courses' | 'practice' | 'progress'>('courses');

  const handleEnroll = (course: Course) => {
    Alert.alert('Enroll', `Join "${course.language} — ${course.level}" taught by ${course.instructor}.\n\nEarn up to ${course.eOTKReward} eOTK upon completion.`);
  };

  const handlePractice = (partner: PracticePartner) => {
    Alert.alert('Practice Session', `Start a conversation practice session with ${partner.name} (${partner.language} ${partner.level}).\n\nBoth participants earn eOTK for each session.`);
  };

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    demoTag: { backgroundColor: t.accent.yellow + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'center', marginBottom: 16 },
    demoText: { color: t.accent.yellow, fontSize: 12, fontWeight: '700' },
    tabRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: t.bg.card, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: '#fff' },
    quote: { color: t.text.secondary, fontSize: 14, fontStyle: 'italic', textAlign: 'center', lineHeight: 22, marginBottom: 20, paddingHorizontal: 12 },
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    statCard: { flex: 1, backgroundColor: t.bg.card, borderRadius: 12, padding: 14, alignItems: 'center' },
    statNum: { fontSize: 22, fontWeight: '900', marginBottom: 2 },
    statLabel: { color: t.text.muted, fontSize: 10, fontWeight: '600', textAlign: 'center' },
    courseCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 10 },
    courseHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    courseIcon: { fontSize: 28 },
    courseInfo: { flex: 1 },
    courseLang: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    courseLevel: { color: t.text.muted, fontSize: 12 },
    courseInstructor: { color: t.text.secondary, fontSize: 12, marginBottom: 6 },
    courseStats: { flexDirection: 'row', gap: 12, marginBottom: 8 },
    courseStat: { color: t.text.muted, fontSize: 12 },
    courseBarBg: { height: 6, backgroundColor: t.border, borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
    courseBarFill: { height: 6, borderRadius: 3, backgroundColor: t.accent.blue },
    courseFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    courseReward: { color: t.accent.green, fontSize: 13, fontWeight: '700' },
    enrollBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
    enrollBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    partnerCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 14 },
    partnerIcon: { fontSize: 28 },
    partnerInfo: { flex: 1 },
    partnerName: { color: t.text.primary, fontSize: 14, fontWeight: '700' },
    partnerLang: { color: t.text.secondary, fontSize: 12 },
    partnerSessions: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    partnerAvail: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    partnerAvailText: { fontSize: 12, fontWeight: '700', color: '#fff' },
    progressCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    progressHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    progressIcon: { fontSize: 24 },
    progressLang: { flex: 1, color: t.text.primary, fontSize: 15, fontWeight: '700' },
    progressLevel: { color: t.text.muted, fontSize: 12, fontWeight: '600' },
    progressBarBg: { height: 8, backgroundColor: t.border, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
    progressBarFill: { height: 8, borderRadius: 4 },
    progressStats: { flexDirection: 'row', justifyContent: 'space-around' },
    progressStatItem: { alignItems: 'center' },
    progressStatNum: { fontSize: 18, fontWeight: '800' },
    progressStatLabel: { color: t.text.muted, fontSize: 10, marginTop: 2 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: '800', marginBottom: 12 },
  }), [t]);

  const enrolledCourses = DEMO_COURSES.filter(c => c.enrolled);
  const totalEOTK = DEMO_PROGRESS.reduce((a, p) => a + p.eOTKEarned, 0);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Language School</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {demoMode && (
          <View style={s.demoTag}>
            <Text style={s.demoText}>DEMO MODE</Text>
          </View>
        )}

        <Text style={s.quote}>"Every language learned is a bridge built."</Text>

        <View style={s.tabRow}>
          {(['courses', 'practice', 'progress'] as const).map((tab) => (
            <TouchableOpacity key={tab} style={[s.tab, activeTab === tab && s.tabActive]} onPress={() => setActiveTab(tab)}>
              <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                {tab === 'courses' ? 'Courses' : tab === 'practice' ? 'Practice' : 'Progress'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'courses' && (
          <>
            <Text style={s.sectionTitle}>Available Courses</Text>
            {DEMO_COURSES.map(course => {
              const pct = course.lessons > 0 ? course.completed / course.lessons : 0;
              return (
                <View key={course.id} style={s.courseCard}>
                  <View style={s.courseHeader}>
                    <Text style={s.courseIcon}>{course.icon}</Text>
                    <View style={s.courseInfo}>
                      <Text style={s.courseLang}>{course.language}</Text>
                      <Text style={s.courseLevel}>{course.level} · {course.students} students</Text>
                    </View>
                  </View>
                  <Text style={s.courseInstructor}>Instructor: {course.instructor}</Text>
                  <View style={s.courseStats}>
                    <Text style={s.courseStat}>{course.completed}/{course.lessons} lessons</Text>
                  </View>
                  {course.enrolled && (
                    <View style={s.courseBarBg}>
                      <View style={[s.courseBarFill, { width: `${pct * 100}%` }]} />
                    </View>
                  )}
                  <View style={s.courseFooter}>
                    <Text style={s.courseReward}>{course.eOTKReward} eOTK reward</Text>
                    <TouchableOpacity
                      style={[s.enrollBtn, { backgroundColor: course.enrolled ? t.accent.green : t.accent.blue }]}
                      onPress={() => !course.enrolled && handleEnroll(course)}
                    >
                      <Text style={s.enrollBtnText}>{course.enrolled ? 'Enrolled' : 'Enroll'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {activeTab === 'practice' && (
          <>
            <Text style={s.sectionTitle}>Practice Partners</Text>
            {DEMO_PARTNERS.map(partner => (
              <TouchableOpacity key={partner.id} style={s.partnerCard} onPress={() => partner.available && handlePractice(partner)}>
                <Text style={s.partnerIcon}>{partner.icon}</Text>
                <View style={s.partnerInfo}>
                  <Text style={s.partnerName}>{partner.name}</Text>
                  <Text style={s.partnerLang}>{partner.language} · {partner.level}</Text>
                  <Text style={s.partnerSessions}>{partner.sessions} sessions completed</Text>
                </View>
                <View style={[s.partnerAvail, { backgroundColor: partner.available ? t.accent.green : t.text.muted }]}>
                  <Text style={s.partnerAvailText}>{partner.available ? 'Available' : 'Busy'}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {activeTab === 'progress' && (
          <>
            <View style={s.statsRow}>
              <View style={s.statCard}>
                <Text style={[s.statNum, { color: t.accent.blue }]}>{enrolledCourses.length}</Text>
                <Text style={s.statLabel}>Enrolled</Text>
              </View>
              <View style={s.statCard}>
                <Text style={[s.statNum, { color: t.accent.green }]}>{totalEOTK}</Text>
                <Text style={s.statLabel}>eOTK Earned</Text>
              </View>
              <View style={s.statCard}>
                <Text style={[s.statNum, { color: t.accent.purple }]}>{DEMO_PROGRESS.length}</Text>
                <Text style={s.statLabel}>Languages</Text>
              </View>
            </View>

            <Text style={s.sectionTitle}>My Languages</Text>
            {DEMO_PROGRESS.map(prog => {
              const pct = prog.totalLessons > 0 ? prog.lessonsCompleted / prog.totalLessons : 0;
              return (
                <View key={prog.language} style={s.progressCard}>
                  <View style={s.progressHeader}>
                    <Text style={s.progressIcon}>{prog.icon}</Text>
                    <Text style={s.progressLang}>{prog.language}</Text>
                    <Text style={s.progressLevel}>{prog.level}</Text>
                  </View>
                  <View style={s.progressBarBg}>
                    <View style={[s.progressBarFill, { width: `${pct * 100}%`, backgroundColor: prog.color }]} />
                  </View>
                  <View style={s.progressStats}>
                    <View style={s.progressStatItem}>
                      <Text style={[s.progressStatNum, { color: prog.color }]}>{prog.lessonsCompleted}/{prog.totalLessons}</Text>
                      <Text style={s.progressStatLabel}>Lessons</Text>
                    </View>
                    <View style={s.progressStatItem}>
                      <Text style={[s.progressStatNum, { color: t.accent.green }]}>{prog.eOTKEarned}</Text>
                      <Text style={s.progressStatLabel}>eOTK</Text>
                    </View>
                    <View style={s.progressStatItem}>
                      <Text style={[s.progressStatNum, { color: t.accent.blue }]}>{prog.streak}</Text>
                      <Text style={s.progressStatLabel}>Day Streak</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
