import { fonts } from '../utils/theme';
/**
 * Teacher Impact Screen — Show teachers the impact of their work.
 *
 * Displays students connected via UID relationships, eOTK earned from
 * student milestones (ripple attribution), impact metrics over time,
 * and gratitude received from students.
 *
 * "Reputation is earned by contribution, not by wealth. One human's lifetime
 *  of teaching is worth more than a thousand speculative trades."
 * — Human Constitution, Article IV
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface Props {
  onClose: () => void;
}

interface StudentConnection {
  uid: string;
  name: string;
  verified: boolean;
  milestonesAchieved: number;
  eOTKEarned: number;
}

interface GratitudeMessage {
  fromName: string;
  message: string;
  date: string;
  amount: number;
}

interface ImpactMonth {
  month: string;
  studentsReached: number;
  eOTKEarned: number;
  milestonesContributed: number;
}

// Demo data
const DEMO_STUDENTS: StudentConnection[] = [
  { uid: 'uid-stud-001', name: 'Student Aisha', verified: true, milestonesAchieved: 5, eOTKEarned: 150 },
  { uid: 'uid-stud-002', name: 'Student Ben', verified: true, milestonesAchieved: 3, eOTKEarned: 90 },
  { uid: 'uid-stud-003', name: 'Student Chiara', verified: true, milestonesAchieved: 7, eOTKEarned: 210 },
  { uid: 'uid-stud-004', name: 'Student Dev', verified: true, milestonesAchieved: 4, eOTKEarned: 120 },
  { uid: 'uid-stud-005', name: 'Student Elena', verified: false, milestonesAchieved: 0, eOTKEarned: 0 },
];

const DEMO_GRATITUDE: GratitudeMessage[] = [
  { fromName: 'Student Aisha', message: 'Thank you for believing in me when I could not believe in myself.', date: '2026-03-15', amount: 25 },
  { fromName: 'Student Chiara', message: 'Your patience changed my life. I finally understand math.', date: '2026-02-28', amount: 50 },
  { fromName: 'Student Ben', message: 'Best teacher I have ever had.', date: '2026-01-20', amount: 10 },
  { fromName: 'Parent of Dev', message: 'My child comes home excited about learning every day. Thank you.', date: '2025-12-10', amount: 30 },
];

const DEMO_IMPACT: ImpactMonth[] = [
  { month: 'Oct 2025', studentsReached: 3, eOTKEarned: 45, milestonesContributed: 2 },
  { month: 'Nov 2025', studentsReached: 4, eOTKEarned: 80, milestonesContributed: 3 },
  { month: 'Dec 2025', studentsReached: 4, eOTKEarned: 65, milestonesContributed: 2 },
  { month: 'Jan 2026', studentsReached: 5, eOTKEarned: 120, milestonesContributed: 5 },
  { month: 'Feb 2026', studentsReached: 5, eOTKEarned: 95, milestonesContributed: 4 },
  { month: 'Mar 2026', studentsReached: 5, eOTKEarned: 165, milestonesContributed: 6 },
];

export function TeacherImpactScreen({ onClose }: Props) {
  const [showAllGratitude, setShowAllGratitude] = useState(false);
  const t = useTheme();

  const totalEOTK = useMemo(() => DEMO_STUDENTS.reduce((sum, s) => sum + s.eOTKEarned, 0), []);
  const totalMilestones = useMemo(() => DEMO_STUDENTS.reduce((sum, s) => sum + s.milestonesAchieved, 0), []);
  const verifiedStudents = useMemo(() => DEMO_STUDENTS.filter(s => s.verified).length, []);
  const gradeLevelCount = 3; // Demo: 3 students reached grade level

  const maxBarEOTK = useMemo(() => Math.max(...DEMO_IMPACT.map(m => m.eOTKEarned)), []);

  const visibleGratitude = showAllGratitude ? DEMO_GRATITUDE : DEMO_GRATITUDE.slice(0, 2);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    heroCard: { backgroundColor: t.accent.blue + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    // Stats row
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: t.bg.card, borderRadius: 20, padding: 20, marginHorizontal: 20, marginTop: 16 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.accent.blue, fontSize: fonts.xxl, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: fonts.xs, fontWeight: fonts.semibold, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' },
    // Impact message
    impactMessage: { backgroundColor: t.accent.green + '15', borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 16, alignItems: 'center' },
    impactText: { color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.bold, textAlign: 'center' },
    section: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 24 },
    // Student cards
    studentCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 14, marginHorizontal: 20, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
    studentIcon: { fontSize: fonts.xxxl },
    studentInfo: { flex: 1 },
    studentName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    studentMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    studentEOTK: { alignItems: 'flex-end' },
    studentEOTKValue: { color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.bold },
    studentEOTKLabel: { color: t.text.muted, fontSize: fonts.xs },
    pendingBadge: { color: t.accent.yellow, fontSize: fonts.xs, fontWeight: fonts.semibold },
    // Chart
    chartContainer: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 8 },
    chartRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 120, paddingTop: 8 },
    chartBarContainer: { alignItems: 'center', flex: 1 },
    chartBar: { width: 24, borderRadius: 6, backgroundColor: t.accent.blue },
    chartLabel: { color: t.text.muted, fontSize: fonts.xxs, marginTop: 4, textAlign: 'center' },
    chartValue: { color: t.accent.blue, fontSize: fonts.xs, fontWeight: fonts.bold, marginBottom: 4 },
    // Gratitude
    gratitudeCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 8 },
    gratitudeFrom: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    gratitudeMsg: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 4, fontStyle: 'italic', lineHeight: 20 },
    gratitudeBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    gratitudeDate: { color: t.text.muted, fontSize: fonts.xs },
    gratitudeAmount: { color: t.accent.purple, fontSize: fonts.sm, fontWeight: fonts.bold },
    showMoreBtn: { alignSelf: 'center', marginTop: 8, paddingVertical: 8 },
    showMoreText: { color: t.accent.blue, fontSize: fonts.md, fontWeight: fonts.semibold },
    note: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginHorizontal: 24, marginTop: 16, lineHeight: 18 },
  }), [t]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Teacher Impact</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        <View style={s.heroCard}>
          <Text style={s.heroIcon}>{'\u{1F9D1}\u{200D}\u{1F3EB}'}</Text>
          <Text style={s.heroTitle}>Your Teaching Matters</Text>
          <Text style={s.heroSubtitle}>
            Every lesson you teach ripples through time. Here is the measurable impact of your dedication.
          </Text>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{totalEOTK}</Text>
            <Text style={s.statLabel}>eOTK{'\n'}Earned</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statValue}>{verifiedStudents}</Text>
            <Text style={s.statLabel}>Students{'\n'}Connected</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statValue}>{totalMilestones}</Text>
            <Text style={s.statLabel}>Student{'\n'}Milestones</Text>
          </View>
        </View>

        {/* Impact message */}
        <View style={s.impactMessage}>
          <Text style={s.impactText}>
            Your teaching helped {gradeLevelCount} students reach grade level
          </Text>
        </View>

        {/* Students */}
        <Text style={s.section}>Connected Students</Text>
        {DEMO_STUDENTS.map((student) => (
          <View key={student.uid} style={s.studentCard}>
            <Text style={s.studentIcon}>{student.verified ? '\u{1F393}' : '\u{23F3}'}</Text>
            <View style={s.studentInfo}>
              <Text style={s.studentName}>{student.name}</Text>
              <Text style={s.studentMeta}>
                {student.verified
                  ? `${student.milestonesAchieved} milestones achieved`
                  : 'Connection pending confirmation'}
              </Text>
              {!student.verified && <Text style={s.pendingBadge}>Pending</Text>}
            </View>
            {student.verified && (
              <View style={s.studentEOTK}>
                <Text style={s.studentEOTKValue}>+{student.eOTKEarned}</Text>
                <Text style={s.studentEOTKLabel}>eOTK</Text>
              </View>
            )}
          </View>
        ))}

        {/* Impact Over Time Chart */}
        <Text style={s.section}>Impact Over Time</Text>
        <View style={s.chartContainer}>
          <View style={s.chartRow}>
            {DEMO_IMPACT.map((month, i) => {
              const barHeight = maxBarEOTK > 0 ? (month.eOTKEarned / maxBarEOTK) * 90 : 0;
              return (
                <View key={i} style={s.chartBarContainer}>
                  <Text style={s.chartValue}>{month.eOTKEarned}</Text>
                  <View style={[s.chartBar, { height: Math.max(barHeight, 4) }]} />
                  <Text style={s.chartLabel}>{month.month.split(' ')[0]}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Gratitude Received */}
        <Text style={s.section}>Gratitude Received</Text>
        {visibleGratitude.map((g, i) => (
          <View key={i} style={s.gratitudeCard}>
            <Text style={s.gratitudeFrom}>{g.fromName}</Text>
            <Text style={s.gratitudeMsg}>"{g.message}"</Text>
            <View style={s.gratitudeBottom}>
              <Text style={s.gratitudeDate}>{g.date}</Text>
              <Text style={s.gratitudeAmount}>+{g.amount} eOTK</Text>
            </View>
          </View>
        ))}
        {DEMO_GRATITUDE.length > 2 && (
          <TouchableOpacity style={s.showMoreBtn} onPress={() => setShowAllGratitude(!showAllGratitude)}>
            <Text style={s.showMoreText}>
              {showAllGratitude ? 'Show Less' : `Show All ${DEMO_GRATITUDE.length} Messages`}
            </Text>
          </TouchableOpacity>
        )}

        <Text style={s.note}>
          eOTK is earned through ripple attribution when your connected students achieve verified milestones. The more students you help succeed, the more your impact is recognized on Open Chain.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
