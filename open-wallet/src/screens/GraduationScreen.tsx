import { fonts } from '../utils/theme';
/**
 * Graduation Screen — Graduation ceremonies, academic achievements, on-chain certificates.
 *
 * Article I: "Education is the most powerful investment in human potential."
 * Article III: eOTK recognizes educational achievement and lifelong learning.
 *
 * Features:
 * - Graduation ceremony listings and RSVP
 * - On-chain academic certificates (diplomas, degrees, courses)
 * - Celebration wall with community congratulations
 * - Achievement timeline
 * - eOTK rewards for educational milestones
 * - Demo mode with sample graduation data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface Ceremony {
  id: string;
  title: string;
  institution: string;
  date: string;
  location: string;
  graduatesCount: number;
  rsvpOpen: boolean;
  keynote: string;
}

interface AcademicCertificate {
  id: string;
  title: string;
  institution: string;
  type: 'diploma' | 'degree' | 'course' | 'certification';
  issuedDate: string;
  grade: string;
  txHash: string;
  eotkAwarded: number;
  verified: boolean;
}

interface Celebration {
  id: string;
  graduateName: string;
  achievement: string;
  institution: string;
  message: string;
  likes: number;
  date: string;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const CERT_TYPE_LABELS: Record<string, string> = {
  diploma: 'Diploma',
  degree: 'Degree',
  course: 'Course',
  certification: 'Certification',
};

const CERT_TYPE_COLORS: Record<string, string> = {
  diploma: '#AF52DE',
  degree: '#007AFF',
  course: '#34C759',
  certification: '#FF9500',
};

// ─── Demo Data ───

const DEMO_CEREMONIES: Ceremony[] = [
  { id: 'g1', title: 'Spring 2026 Commencement', institution: 'State University', date: '2026-05-15', location: 'Main Auditorium', graduatesCount: 1200, rsvpOpen: true, keynote: 'Dr. Maya Chen' },
  { id: 'g2', title: 'Community College Graduation', institution: 'Valley Community College', date: '2026-05-20', location: 'Outdoor Amphitheater', graduatesCount: 450, rsvpOpen: true, keynote: 'Prof. James Rivera' },
  { id: 'g3', title: 'Tech Bootcamp Demo Day', institution: 'CodeForge Academy', date: '2026-04-12', location: 'Innovation Hub', graduatesCount: 35, rsvpOpen: true, keynote: 'Sarah Kim, CTO' },
  { id: 'g4', title: 'Medical School Convocation', institution: 'University Medical Center', date: '2026-06-01', location: 'Grand Hall', graduatesCount: 180, rsvpOpen: false, keynote: 'Dr. Anil Patel' },
];

const DEMO_CERTIFICATES: AcademicCertificate[] = [
  { id: 'ac1', title: 'Bachelor of Computer Science', institution: 'State University', type: 'degree', issuedDate: '2024-05-20', grade: 'Magna Cum Laude', txHash: '0xabc123...def456', eotkAwarded: 5000, verified: true },
  { id: 'ac2', title: 'Blockchain Development', institution: 'CodeForge Academy', type: 'certification', issuedDate: '2025-08-15', grade: 'Distinction', txHash: '0x789abc...321fed', eotkAwarded: 2000, verified: true },
  { id: 'ac3', title: 'Machine Learning Specialization', institution: 'Online University', type: 'course', issuedDate: '2025-12-01', grade: '96%', txHash: '0xdef789...abc123', eotkAwarded: 1500, verified: true },
  { id: 'ac4', title: 'High School Diploma', institution: 'Lincoln High School', type: 'diploma', issuedDate: '2020-06-10', grade: 'Valedictorian', txHash: '0x456def...789abc', eotkAwarded: 3000, verified: true },
];

const DEMO_CELEBRATIONS: Celebration[] = [
  { id: 'cel1', graduateName: 'Aisha Johnson', achievement: 'PhD in Environmental Science', institution: 'State University', message: 'After 6 years of research, I finally did it! Thanks to my community for the support.', likes: 234, date: '2026-03-28' },
  { id: 'cel2', graduateName: 'Carlos Rivera', achievement: 'GED Completion', institution: 'Adult Learning Center', message: 'It is never too late to learn. At 42, I got my GED. Next stop: community college!', likes: 412, date: '2026-03-27' },
  { id: 'cel3', graduateName: 'Li Wei', achievement: 'Full-Stack Web Development', institution: 'CodeForge Academy', message: 'Career change complete! From accountant to developer. The bootcamp was worth every hour.', likes: 189, date: '2026-03-25' },
  { id: 'cel4', graduateName: 'Priya Sharma', achievement: 'Nursing Degree', institution: 'Valley Community College', message: 'Ready to serve my community as a nurse. This degree means everything to my family.', likes: 356, date: '2026-03-24' },
  { id: 'cel5', graduateName: 'Marcus Thompson', achievement: 'First-Generation College Graduate', institution: 'State University', message: 'First in my family to graduate college. This is for everyone who believed in me.', likes: 578, date: '2026-03-22' },
];

type Tab = 'ceremonies' | 'certificates' | 'celebrate';

export function GraduationScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('ceremonies');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const ceremonies = DEMO_CEREMONIES;
  const certificates = DEMO_CERTIFICATES;
  const celebrations = DEMO_CELEBRATIONS;
  const totalEOTK = useMemo(() => certificates.reduce((sum, c) => sum + c.eotkAwarded, 0), [certificates]);

  const handleRSVP = useCallback((ceremony: Ceremony) => {
    Alert.alert('RSVP Confirmed', `You are registered for "${ceremony.title}" on ${ceremony.date}.`);
  }, []);

  const handleCongrats = useCallback((cel: Celebration) => {
    Alert.alert('Congratulations Sent', `Your congratulations message has been sent to ${cel.graduateName}.`);
  }, []);

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
    ceremonyCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    ceremonyTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold },
    ceremonyInst: { color: t.accent.blue, fontSize: 13, fontWeight: fonts.semibold, marginTop: 2 },
    ceremonyMeta: { color: t.text.muted, fontSize: 12, marginTop: 6, lineHeight: 18 },
    rsvpBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-start', marginTop: 10 },
    rsvpBtnText: { color: '#fff', fontSize: 13, fontWeight: fonts.semibold },
    rsvpClosed: { color: t.text.muted, fontSize: 12, fontStyle: 'italic', marginTop: 10 },
    certCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    certHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    certTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold, flex: 1 },
    certType: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    certTypeText: { color: '#fff', fontSize: 10, fontWeight: fonts.bold },
    certMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    certGrade: { color: t.accent.green, fontSize: 13, fontWeight: fonts.bold, marginTop: 4 },
    certHash: { color: t.accent.blue, fontSize: 11, marginTop: 4, fontFamily: 'monospace' },
    certEotk: { color: t.accent.green, fontSize: 14, fontWeight: fonts.heavy, marginTop: 6 },
    summaryCard: { backgroundColor: t.accent.blue + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    summaryText: { color: t.text.primary, fontSize: 15, fontWeight: fonts.semibold, textAlign: 'center', lineHeight: 22 },
    celCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    celName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    celAchievement: { color: t.accent.blue, fontSize: 13, fontWeight: fonts.semibold, marginTop: 2 },
    celMessage: { color: t.text.muted, fontSize: 13, marginTop: 8, lineHeight: 20, fontStyle: 'italic' },
    celFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    celLikes: { color: t.text.muted, fontSize: 12 },
    celBtn: { backgroundColor: t.accent.green, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
    celBtnText: { color: '#fff', fontSize: 12, fontWeight: fonts.semibold },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'ceremonies', label: 'Ceremonies' },
    { key: 'certificates', label: 'Certificates' },
    { key: 'celebrate', label: 'Celebrate' },
  ];

  // ─── Ceremonies Tab ───

  const renderCeremonies = () => (
    <>
      <Text style={s.sectionTitle}>Upcoming Graduations</Text>
      {ceremonies.map((cer) => (
        <View key={cer.id} style={s.ceremonyCard}>
          <Text style={s.ceremonyTitle}>{cer.title}</Text>
          <Text style={s.ceremonyInst}>{cer.institution}</Text>
          <Text style={s.ceremonyMeta}>
            {cer.date} | {cer.location}{'\n'}
            {cer.graduatesCount} graduates | Keynote: {cer.keynote}
          </Text>
          {cer.rsvpOpen ? (
            <TouchableOpacity style={s.rsvpBtn} onPress={() => handleRSVP(cer)}>
              <Text style={s.rsvpBtnText}>RSVP</Text>
            </TouchableOpacity>
          ) : (
            <Text style={s.rsvpClosed}>RSVP closed</Text>
          )}
        </View>
      ))}
    </>
  );

  // ─── Certificates Tab ───

  const renderCertificates = () => (
    <>
      <View style={s.summaryCard}>
        <Text style={s.summaryText}>
          {certificates.length} on-chain certificates{'\n'}
          Total eOTK earned: {totalEOTK.toLocaleString()}
        </Text>
      </View>

      <Text style={s.sectionTitle}>Academic Certificates</Text>
      {certificates.map((cert) => (
        <View key={cert.id} style={s.certCard}>
          <View style={s.certHeader}>
            <Text style={s.certTitle}>{cert.title}</Text>
            <View style={[s.certType, { backgroundColor: CERT_TYPE_COLORS[cert.type] }]}>
              <Text style={s.certTypeText}>{CERT_TYPE_LABELS[cert.type]}</Text>
            </View>
          </View>
          <Text style={s.certMeta}>{cert.institution} | {cert.issuedDate}</Text>
          <Text style={s.certGrade}>{cert.grade}</Text>
          <Text style={s.certHash}>tx: {cert.txHash}</Text>
          <Text style={s.certEotk}>+{cert.eotkAwarded.toLocaleString()} eOTK</Text>
        </View>
      ))}
    </>
  );

  // ─── Celebrate Tab ───

  const renderCelebrate = () => (
    <>
      <Text style={s.sectionTitle}>Community Celebrations</Text>
      {celebrations.map((cel) => (
        <View key={cel.id} style={s.celCard}>
          <Text style={s.celName}>{cel.graduateName}</Text>
          <Text style={s.celAchievement}>{cel.achievement} — {cel.institution}</Text>
          <Text style={s.celMessage}>"{cel.message}"</Text>
          <View style={s.celFooter}>
            <Text style={s.celLikes}>{cel.likes} congratulations | {cel.date}</Text>
            <TouchableOpacity style={s.celBtn} onPress={() => handleCongrats(cel)}>
              <Text style={s.celBtnText}>Congrats!</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Graduation</Text>
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
        {tab === 'ceremonies' && renderCeremonies()}
        {tab === 'certificates' && renderCertificates()}
        {tab === 'celebrate' && renderCelebrate()}
      </ScrollView>
    </SafeAreaView>
  );
}
