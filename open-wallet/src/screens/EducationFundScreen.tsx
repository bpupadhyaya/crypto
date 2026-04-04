import { fonts } from '../utils/theme';
/**
 * Education Fund Screen — Community education fund for students.
 *
 * Article I: "Every human is born with infinite potential worth."
 * Article II: eOTK represents education value — invest in the next generation.
 *
 * Features:
 * - Fund overview (total eOTK in education fund, students supported, scholarships awarded)
 * - Apply for scholarship (student profile, need description, academic info)
 * - Donate to fund (contribute eOTK)
 * - Scholarship recipients with impact stories
 * - Demo mode: fund with 45,000 eOTK, 12 students, 3 scholarship stories
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface FundOverview {
  totalEOTK: number;
  studentsSupported: number;
  scholarshipsAwarded: number;
  monthlyDonors: number;
  averageScholarship: number;
}

interface ScholarshipStory {
  id: string;
  studentName: string;
  age: number;
  field: string;
  scholarshipAmount: number;
  story: string;
  awardDate: string;
  status: 'active' | 'graduated' | 'in-progress';
  impactNote: string;
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_FUND: FundOverview = {
  totalEOTK: 45000,
  studentsSupported: 12,
  scholarshipsAwarded: 8,
  monthlyDonors: 67,
  averageScholarship: 3500,
};

const DEMO_STORIES: ScholarshipStory[] = [
  {
    id: 's1',
    studentName: 'Amara K.',
    age: 19,
    field: 'Computer Science',
    scholarshipAmount: 5000,
    story: 'Amara grew up in a single-parent household. She taught herself Python at the library and dreamed of building apps that help her community. The education fund covered her first year of community college tuition and a laptop.',
    awardDate: '2025-09-01',
    status: 'in-progress',
    impactNote: 'Built a food bank app used by 200+ families. GPA: 3.8.',
  },
  {
    id: 's2',
    studentName: 'Diego R.',
    age: 22,
    field: 'Nursing',
    scholarshipAmount: 4000,
    story: 'Diego worked two jobs to support his family while studying nursing. The scholarship allowed him to reduce his work hours and focus on clinicals. He graduated top of his class.',
    awardDate: '2024-06-15',
    status: 'graduated',
    impactNote: 'Now a full-time ER nurse at City General. Mentors 3 scholarship students.',
  },
  {
    id: 's3',
    studentName: 'Priya M.',
    age: 17,
    field: 'Environmental Science',
    scholarshipAmount: 3000,
    story: 'Priya led her school\'s climate action club and organized community cleanups. The fund covered AP exam fees, lab equipment, and a summer research internship at the state university.',
    awardDate: '2026-01-10',
    status: 'active',
    impactNote: 'Published research on local water quality. Accepted to 3 universities.',
  },
];

const RECENT_DONATIONS = [
  { donor: 'Anonymous', amount: 500, date: '2026-03-28' },
  { donor: 'Marcus T.', amount: 200, date: '2026-03-27' },
  { donor: 'Green Energy Collective', amount: 1000, date: '2026-03-25' },
  { donor: 'You', amount: 150, date: '2026-03-20' },
  { donor: 'Community Match Fund', amount: 2000, date: '2026-03-15' },
];

type Tab = 'fund' | 'apply' | 'donate' | 'stories';

export function EducationFundScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('fund');
  const [fund] = useState(DEMO_FUND);
  const [stories] = useState(DEMO_STORIES);

  // Apply form
  const [applyName, setApplyName] = useState('');
  const [applyAge, setApplyAge] = useState('');
  const [applyField, setApplyField] = useState('');
  const [applyNeed, setApplyNeed] = useState('');
  const [applyAcademic, setApplyAcademic] = useState('');
  const [applyAmount, setApplyAmount] = useState('');
  const [applyEssay, setApplyEssay] = useState('');

  // Donate form
  const [donateAmount, setDonateAmount] = useState('');
  const [donateRecurring, setDonateRecurring] = useState(false);
  const [donateMessage, setDonateMessage] = useState('');

  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const handleApply = useCallback(() => {
    if (!applyName.trim()) { Alert.alert('Required', 'Enter your name.'); return; }
    if (!applyAge.trim()) { Alert.alert('Required', 'Enter your age.'); return; }
    if (!applyField.trim()) { Alert.alert('Required', 'Enter your field of study.'); return; }
    if (!applyNeed.trim()) { Alert.alert('Required', 'Describe your financial need.'); return; }
    if (!applyAcademic.trim()) { Alert.alert('Required', 'Enter academic information.'); return; }
    const amt = parseInt(applyAmount, 10);
    if (!amt || amt <= 0) { Alert.alert('Required', 'Enter a valid scholarship amount.'); return; }
    if (!applyEssay.trim()) { Alert.alert('Required', 'Write a short essay about your goals.'); return; }

    Alert.alert(
      'Application Submitted!',
      `Your scholarship application for ${amt} eOTK has been submitted. The community will review it within 2 weeks.`,
    );
    setApplyName('');
    setApplyAge('');
    setApplyField('');
    setApplyNeed('');
    setApplyAcademic('');
    setApplyAmount('');
    setApplyEssay('');
    setTab('fund');
  }, [applyName, applyAge, applyField, applyNeed, applyAcademic, applyAmount, applyEssay]);

  const handleDonate = useCallback(() => {
    const amt = parseInt(donateAmount, 10);
    if (!amt || amt <= 0) {
      Alert.alert('Invalid', 'Enter a valid eOTK amount.');
      return;
    }
    const recurring = donateRecurring ? ' (monthly recurring)' : '';
    Alert.alert(
      'Thank You!',
      `You donated ${amt} eOTK to the Education Fund${recurring}. Every eOTK changes a student's life.`,
    );
    setDonateAmount('');
    setDonateRecurring(false);
    setDonateMessage('');
  }, [donateAmount, donateRecurring]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.purple + '20' },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.purple },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    overviewCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    overviewTitle: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy, textAlign: 'center', marginBottom: 16 },
    statRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', gap: 12 },
    statBox: { alignItems: 'center', minWidth: 100 },
    statValue: { fontSize: fonts.xxl, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: fonts.xs, fontWeight: fonts.semibold, marginTop: 4, textAlign: 'center' },
    donationList: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    donationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    donationDonor: { color: t.text.primary, fontSize: fonts.sm, fontWeight: fonts.semibold, flex: 1 },
    donationAmount: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold },
    donationDate: { color: t.text.muted, fontSize: fonts.xs, marginLeft: 8 },
    storyCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    storyName: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold },
    storyField: { color: t.accent.purple, fontSize: fonts.sm, fontWeight: fonts.semibold, marginTop: 4 },
    storyAmount: { color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.bold, marginTop: 4 },
    storyText: { color: t.text.muted, fontSize: fonts.sm, lineHeight: 20, marginTop: 8 },
    storyImpact: { color: t.accent.blue, fontSize: fonts.sm, fontWeight: fonts.semibold, marginTop: 8, fontStyle: 'italic' },
    storyStatus: { fontSize: fonts.sm, fontWeight: fonts.bold, marginTop: 6 },
    storyDate: { color: t.text.muted, fontSize: fonts.xs, marginTop: 4 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md, marginBottom: 12 },
    inputMulti: { minHeight: 80, textAlignVertical: 'top' },
    submitBtn: { backgroundColor: t.accent.purple, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    donateBtn: { backgroundColor: t.accent.green, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    donateText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    quickAmountRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    quickAmountBtn: { flex: 1, backgroundColor: t.bg.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: t.bg.secondary },
    quickAmountText: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    quickAmountActive: { borderColor: t.accent.green, backgroundColor: t.accent.green + '15' },
    quickAmountTextActive: { color: t.accent.green },
    checkboxRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, marginBottom: 8 },
    checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: t.text.muted, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
    checkboxChecked: { backgroundColor: t.accent.green, borderColor: t.accent.green },
    checkMark: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    checkboxLabel: { color: t.text.primary, fontSize: fonts.md },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.bold },
    emptyText: { color: t.text.muted, fontSize: fonts.md, textAlign: 'center', paddingVertical: 40 },
    impactBanner: { backgroundColor: t.accent.blue + '15', borderRadius: 12, padding: 14, marginHorizontal: 20, marginBottom: 16 },
    impactText: { color: t.accent.blue, fontSize: fonts.sm, fontWeight: fonts.semibold, textAlign: 'center' },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'fund', label: 'Fund' },
    { key: 'apply', label: 'Apply' },
    { key: 'donate', label: 'Donate' },
    { key: 'stories', label: 'Stories' },
  ];

  const QUICK_AMOUNTS = [50, 100, 250, 500, 1000];

  // ─── Render Helpers ───

  const renderFund = () => (
    <>
      <View style={s.overviewCard}>
        <Text style={s.overviewTitle}>Community Education Fund</Text>
        <View style={s.statRow}>
          <View style={s.statBox}>
            <Text style={[s.statValue, { color: t.accent.green }]}>{fund.totalEOTK.toLocaleString()}</Text>
            <Text style={s.statLabel}>Total eOTK</Text>
          </View>
          <View style={s.statBox}>
            <Text style={[s.statValue, { color: t.accent.blue }]}>{fund.studentsSupported}</Text>
            <Text style={s.statLabel}>Students Supported</Text>
          </View>
          <View style={s.statBox}>
            <Text style={[s.statValue, { color: t.accent.purple }]}>{fund.scholarshipsAwarded}</Text>
            <Text style={s.statLabel}>Scholarships Awarded</Text>
          </View>
        </View>
        <View style={[s.statRow, { marginTop: 16 }]}>
          <View style={s.statBox}>
            <Text style={[s.statValue, { color: t.accent.orange }]}>{fund.monthlyDonors}</Text>
            <Text style={s.statLabel}>Monthly Donors</Text>
          </View>
          <View style={s.statBox}>
            <Text style={[s.statValue, { color: t.text.primary }]}>{fund.averageScholarship.toLocaleString()}</Text>
            <Text style={s.statLabel}>Avg Scholarship (eOTK)</Text>
          </View>
        </View>
      </View>

      <View style={s.impactBanner}>
        <Text style={s.impactText}>Every eOTK donated goes directly to students. Zero overhead — powered by Open Chain.</Text>
      </View>

      <Text style={s.sectionTitle}>Recent Donations</Text>
      <View style={s.donationList}>
        {RECENT_DONATIONS.map((d, i) => (
          <View key={i} style={s.donationRow}>
            <Text style={s.donationDonor}>{d.donor}</Text>
            <Text style={s.donationAmount}>{d.amount} eOTK</Text>
            <Text style={s.donationDate}>{d.date}</Text>
          </View>
        ))}
      </View>
    </>
  );

  const renderApply = () => (
    <View style={s.card}>
      <Text style={s.sectionTitle}>Apply for Scholarship</Text>
      <TextInput style={s.input} placeholder="Your Full Name" placeholderTextColor={t.text.muted} value={applyName} onChangeText={setApplyName} />
      <TextInput style={s.input} placeholder="Age" placeholderTextColor={t.text.muted} keyboardType="numeric" value={applyAge} onChangeText={setApplyAge} />
      <TextInput style={s.input} placeholder="Field of Study" placeholderTextColor={t.text.muted} value={applyField} onChangeText={setApplyField} />
      <TextInput style={[s.input, s.inputMulti]} placeholder="Describe your financial need" placeholderTextColor={t.text.muted} value={applyNeed} onChangeText={setApplyNeed} multiline />
      <TextInput style={[s.input, s.inputMulti]} placeholder="Academic info (GPA, school, achievements)" placeholderTextColor={t.text.muted} value={applyAcademic} onChangeText={setApplyAcademic} multiline />
      <TextInput style={s.input} placeholder="Scholarship Amount Requested (eOTK)" placeholderTextColor={t.text.muted} keyboardType="numeric" value={applyAmount} onChangeText={setApplyAmount} />
      <TextInput style={[s.input, s.inputMulti]} placeholder="Short essay: How will this scholarship help you and your community?" placeholderTextColor={t.text.muted} value={applyEssay} onChangeText={setApplyEssay} multiline />
      <TouchableOpacity style={s.submitBtn} onPress={handleApply}>
        <Text style={s.submitText}>Submit Application</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDonate = () => (
    <View style={s.card}>
      <Text style={s.sectionTitle}>Donate to Education Fund</Text>
      <Text style={{ color: t.text.muted, fontSize: fonts.sm, marginBottom: 12 }}>Quick amounts</Text>
      <View style={s.quickAmountRow}>
        {QUICK_AMOUNTS.map((amt) => (
          <TouchableOpacity
            key={amt}
            style={[s.quickAmountBtn, donateAmount === String(amt) && s.quickAmountActive]}
            onPress={() => setDonateAmount(String(amt))}
          >
            <Text style={[s.quickAmountText, donateAmount === String(amt) && s.quickAmountTextActive]}>{amt}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput style={s.input} placeholder="Custom Amount (eOTK)" placeholderTextColor={t.text.muted} keyboardType="numeric" value={donateAmount} onChangeText={setDonateAmount} />
      <TouchableOpacity style={s.checkboxRow} onPress={() => setDonateRecurring(!donateRecurring)}>
        <View style={[s.checkbox, donateRecurring && s.checkboxChecked]}>
          {donateRecurring && <Text style={s.checkMark}>✓</Text>}
        </View>
        <Text style={s.checkboxLabel}>Make this a monthly recurring donation</Text>
      </TouchableOpacity>
      <TextInput style={s.input} placeholder="Message (optional)" placeholderTextColor={t.text.muted} value={donateMessage} onChangeText={setDonateMessage} />
      <TouchableOpacity style={s.donateBtn} onPress={handleDonate}>
        <Text style={s.donateText}>Donate eOTK</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStories = () => (
    <>
      <Text style={s.sectionTitle}>Scholarship Recipients ({stories.length})</Text>
      {stories.map((story) => (
        <View key={story.id} style={s.storyCard}>
          <Text style={s.storyName}>{story.studentName}, {story.age}</Text>
          <Text style={s.storyField}>{story.field}</Text>
          <Text style={s.storyAmount}>{story.scholarshipAmount.toLocaleString()} eOTK scholarship</Text>
          <Text style={s.storyText}>{story.story}</Text>
          <Text style={s.storyImpact}>{story.impactNote}</Text>
          <Text style={[s.storyStatus, {
            color: story.status === 'graduated' ? t.accent.green : story.status === 'active' ? t.accent.blue : t.accent.purple,
          }]}>
            {story.status === 'graduated' ? 'Graduated' : story.status === 'active' ? 'Active Scholar' : 'In Progress'}
          </Text>
          <Text style={s.storyDate}>Awarded: {story.awardDate}</Text>
        </View>
      ))}
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Education Fund</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      {demoMode && (
        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO MODE</Text>
        </View>
      )}

      <View style={s.tabRow}>
        {tabs.map((tb) => (
          <TouchableOpacity
            key={tb.key}
            style={[s.tabBtn, tab === tb.key && s.tabActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {tab === 'fund' && renderFund()}
        {tab === 'apply' && renderApply()}
        {tab === 'donate' && renderDonate()}
        {tab === 'stories' && renderStories()}
      </ScrollView>
    </SafeAreaView>
  );
}
