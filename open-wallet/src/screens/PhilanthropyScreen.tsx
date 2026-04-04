import { fonts } from '../utils/theme';
/**
 * Philanthropy Screen — Charitable giving, impact tracking, community fundraising.
 *
 * Article I: "Every dimension of human contribution is valued equally."
 * Giving OTK to worthy causes creates ripple effects across communities.
 *
 * Features:
 * - Giving dashboard (total donated, causes supported, impact metrics)
 * - Active fundraisers (community causes seeking support)
 * - Start a fundraiser (title, cause, goal, story, deadline)
 * - Impact reports (what donations achieved)
 * - Giving circles (groups pooling donations for bigger impact)
 * - Tax receipt tracking (for applicable jurisdictions)
 * - Demo mode with sample data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface GivingStats {
  totalDonated: number;
  causesSupported: number;
  activeFundraisers: number;
  givingCircles: number;
  impactPeople: number;
  taxReceiptsGenerated: number;
}

interface Fundraiser {
  id: string;
  title: string;
  cause: string;
  organizer: string;
  goal: number;
  raised: number;
  supporters: number;
  deadline: string;
  story: string;
  active: boolean;
}

interface ImpactReport {
  id: string;
  cause: string;
  title: string;
  description: string;
  otkUsed: number;
  peopleHelped: number;
  date: string;
}

interface GivingCircle {
  id: string;
  name: string;
  members: number;
  totalPooled: number;
  focus: string;
  nextVote: string;
}

interface TaxReceipt {
  id: string;
  date: string;
  recipient: string;
  amount: number;
  cause: string;
  receiptNumber: string;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const CAUSE_CATEGORIES = [
  { key: 'education', label: 'Education', icon: 'E' },
  { key: 'health', label: 'Health', icon: 'H' },
  { key: 'environment', label: 'Environment', icon: 'V' },
  { key: 'hunger', label: 'Hunger Relief', icon: 'R' },
  { key: 'housing', label: 'Housing', icon: 'S' },
  { key: 'community', label: 'Community', icon: 'C' },
];

// ─── Demo Data ───

const DEMO_STATS: GivingStats = {
  totalDonated: 1200,
  causesSupported: 4,
  activeFundraisers: 2,
  givingCircles: 1,
  impactPeople: 156,
  taxReceiptsGenerated: 3,
};

const DEMO_FUNDRAISERS: Fundraiser[] = [
  {
    id: '1', title: 'School Library Renovation', cause: 'education', organizer: 'Maria Chen',
    goal: 5000, raised: 3240, supporters: 47, deadline: '2026-05-15',
    story: 'Our neighborhood school library has not been updated in 20 years. Funds will provide new books, reading nooks, and digital resources for 400 students.',
    active: true,
  },
  {
    id: '2', title: 'Community Garden Expansion', cause: 'environment', organizer: 'James Okafor',
    goal: 2000, raised: 1680, supporters: 31, deadline: '2026-04-30',
    story: 'The community garden feeds 50 families. Expansion will add raised beds, composting stations, and a tool shed to serve 30 more families.',
    active: true,
  },
  {
    id: '3', title: 'Free Health Clinic Weekend', cause: 'health', organizer: 'Dr. Priya Sharma',
    goal: 3000, raised: 3000, supporters: 62, deadline: '2026-03-01',
    story: 'Two-day free health clinic providing checkups, dental care, and mental health screenings for uninsured community members.',
    active: false,
  },
];

const DEMO_IMPACT_REPORTS: ImpactReport[] = [
  { id: '1', cause: 'health', title: 'Free Clinic Weekend — March 2026', description: '210 patients received free checkups, 45 dental screenings, 30 mental health consultations. 12 critical conditions identified early.', otkUsed: 3000, peopleHelped: 210, date: '2026-03-02' },
  { id: '2', cause: 'hunger', title: 'Winter Food Drive 2025', description: '1,400 meal kits distributed to families in need across 3 neighborhoods. Partnered with 6 local restaurants for warm meals.', otkUsed: 4500, peopleHelped: 350, date: '2025-12-22' },
  { id: '3', cause: 'education', title: 'STEM Scholarships — Fall 2025', description: '8 students received full scholarships for coding bootcamp. 6 have already secured internships.', otkUsed: 8000, peopleHelped: 8, date: '2025-09-15' },
];

const DEMO_GIVING_CIRCLES: GivingCircle[] = [
  { id: '1', name: 'Neighborhood Heroes', members: 24, totalPooled: 4800, focus: 'Local community projects', nextVote: '2026-04-01' },
];

const DEMO_TAX_RECEIPTS: TaxReceipt[] = [
  { id: '1', date: '2026-03-15', recipient: 'Free Health Clinic Fund', amount: 500, cause: 'health', receiptNumber: 'TX-2026-0312' },
  { id: '2', date: '2026-02-01', recipient: 'School Library Fund', amount: 400, cause: 'education', receiptNumber: 'TX-2026-0187' },
  { id: '3', date: '2025-12-18', recipient: 'Winter Food Drive', amount: 300, cause: 'hunger', receiptNumber: 'TX-2025-1204' },
];

type Tab = 'dashboard' | 'give' | 'fundraise' | 'impact';

export function PhilanthropyScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [fundraiserTitle, setFundraiserTitle] = useState('');
  const [fundraiserCause, setFundraiserCause] = useState('');
  const [fundraiserGoal, setFundraiserGoal] = useState('');
  const [fundraiserStory, setFundraiserStory] = useState('');
  const [donateAmount, setDonateAmount] = useState('');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const handleDonate = useCallback((fundraiser: Fundraiser) => {
    if (!donateAmount.trim() || parseFloat(donateAmount) <= 0) {
      Alert.alert('Amount Required', 'Enter the amount of OTK to donate.');
      return;
    }
    Alert.alert(
      'Donation Sent',
      `${donateAmount} OTK donated to "${fundraiser.title}". Thank you for your generosity!`,
    );
    setDonateAmount('');
  }, [donateAmount]);

  const handleStartFundraiser = useCallback(() => {
    if (!fundraiserTitle.trim()) { Alert.alert('Required', 'Enter a title for your fundraiser.'); return; }
    if (!fundraiserCause) { Alert.alert('Required', 'Select a cause category.'); return; }
    if (!fundraiserGoal.trim() || parseFloat(fundraiserGoal) <= 0) { Alert.alert('Required', 'Enter a fundraising goal.'); return; }
    if (!fundraiserStory.trim()) { Alert.alert('Required', 'Tell the story behind your fundraiser.'); return; }
    Alert.alert(
      'Fundraiser Created',
      `"${fundraiserTitle}" is now live! Share it with your community to start receiving donations.`,
    );
    setFundraiserTitle('');
    setFundraiserCause('');
    setFundraiserGoal('');
    setFundraiserStory('');
  }, [fundraiserTitle, fundraiserCause, fundraiserGoal, fundraiserStory]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.green + '20' },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.green },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    dashboardHeader: { alignItems: 'center', marginBottom: 16 },
    dashboardValue: { color: t.text.primary, fontSize: 48, fontWeight: fonts.heavy, marginTop: 4 },
    dashboardLabel: { color: t.text.muted, fontSize: fonts.sm, textTransform: 'uppercase', letterSpacing: 1 },
    dashboardSub: { color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.bold, marginTop: 4 },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2, textAlign: 'center' },
    fundraiserCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    fundraiserTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, marginBottom: 4 },
    fundraiserOrganizer: { color: t.text.secondary, fontSize: fonts.sm, marginBottom: 8 },
    fundraiserStory: { color: t.text.muted, fontSize: fonts.sm, lineHeight: 20, marginBottom: 12 },
    progressBarOuter: { height: 8, backgroundColor: t.bg.primary, borderRadius: 4, marginBottom: 8 },
    progressBarInner: { height: 8, borderRadius: 4, backgroundColor: t.accent.green },
    fundraiserStats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    fundraiserStatText: { color: t.text.muted, fontSize: fonts.sm },
    fundraiserStatValue: { color: t.text.primary, fontSize: fonts.sm, fontWeight: fonts.bold },
    donateRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    donateInput: { flex: 1, backgroundColor: t.bg.primary, borderRadius: 12, padding: 12, color: t.text.primary, fontSize: fonts.md },
    donateBtn: { backgroundColor: t.accent.green, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
    donateBtnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    causeTag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginBottom: 8 },
    causeTagText: { fontSize: fonts.xs, fontWeight: fonts.bold, textTransform: 'uppercase' },
    completedTag: { backgroundColor: t.accent.green + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, alignSelf: 'flex-start', marginBottom: 8 },
    completedText: { color: t.accent.green, fontSize: fonts.xs, fontWeight: fonts.bold },
    impactCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    impactTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, marginBottom: 4 },
    impactDesc: { color: t.text.muted, fontSize: fonts.sm, lineHeight: 20, marginBottom: 8 },
    impactMeta: { flexDirection: 'row', gap: 16 },
    impactMetaText: { color: t.text.secondary, fontSize: fonts.sm },
    circleCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    circleName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, marginBottom: 4 },
    circleFocus: { color: t.text.secondary, fontSize: fonts.sm, marginBottom: 8 },
    circleStats: { flexDirection: 'row', justifyContent: 'space-between' },
    circleStatText: { color: t.text.muted, fontSize: fonts.sm },
    receiptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    receiptInfo: { flex: 1 },
    receiptRecipient: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    receiptMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    receiptAmount: { color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.bold },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md, marginBottom: 12 },
    textArea: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md, marginBottom: 12, minHeight: 100, textAlignVertical: 'top' },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: t.bg.primary },
    typeChipSelected: { backgroundColor: t.accent.green + '20', borderColor: t.accent.green },
    typeChipText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    typeChipTextSelected: { color: t.accent.green },
    submitBtn: { backgroundColor: t.accent.green, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    educationCard: { backgroundColor: t.accent.green + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    educationText: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold, textAlign: 'center', lineHeight: 22 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.bold },
  }), [t]);

  const getCauseColor = (cause: string) => {
    switch (cause) {
      case 'education': return t.accent.blue;
      case 'health': return t.accent.green;
      case 'environment': return '#34C759';
      case 'hunger': return t.accent.orange;
      case 'housing': return t.accent.purple;
      case 'community': return t.accent.blue;
      default: return t.accent.green;
    }
  };

  // ─── Tabs ───

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'give', label: 'Give' },
    { key: 'fundraise', label: 'Fundraise' },
    { key: 'impact', label: 'Impact' },
  ];

  // ─── Dashboard Tab ───

  const renderDashboard = () => (
    <>
      <View style={s.card}>
        <View style={s.dashboardHeader}>
          <Text style={s.dashboardLabel}>Total OTK Donated</Text>
          <Text style={s.dashboardValue}>{DEMO_STATS.totalDonated.toLocaleString()}</Text>
          <Text style={s.dashboardSub}>{DEMO_STATS.impactPeople} people impacted</Text>
        </View>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{DEMO_STATS.causesSupported}</Text>
            <Text style={s.statLabel}>Causes</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.green }]}>{DEMO_STATS.activeFundraisers}</Text>
            <Text style={s.statLabel}>Active{'\n'}Fundraisers</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.purple }]}>{DEMO_STATS.givingCircles}</Text>
            <Text style={s.statLabel}>Giving{'\n'}Circle</Text>
          </View>
        </View>
      </View>

      {/* Giving Circles */}
      <Text style={s.sectionTitle}>My Giving Circles</Text>
      {DEMO_GIVING_CIRCLES.map((circle) => (
        <View key={circle.id} style={s.circleCard}>
          <Text style={s.circleName}>{circle.name}</Text>
          <Text style={s.circleFocus}>{circle.focus}</Text>
          <View style={s.circleStats}>
            <Text style={s.circleStatText}>{circle.members} members</Text>
            <Text style={s.circleStatText}>{circle.totalPooled.toLocaleString()} OTK pooled</Text>
            <Text style={s.circleStatText}>Next vote: {circle.nextVote}</Text>
          </View>
        </View>
      ))}

      {/* Tax Receipts */}
      <Text style={s.sectionTitle}>Tax Receipts</Text>
      <View style={s.card}>
        {DEMO_TAX_RECEIPTS.map((receipt, idx) => (
          <View key={receipt.id} style={[s.receiptRow, idx === DEMO_TAX_RECEIPTS.length - 1 && { borderBottomWidth: 0 }]}>
            <View style={s.receiptInfo}>
              <Text style={s.receiptRecipient}>{receipt.recipient}</Text>
              <Text style={s.receiptMeta}>{receipt.date} | {receipt.receiptNumber}</Text>
            </View>
            <Text style={s.receiptAmount}>{receipt.amount} OTK</Text>
          </View>
        ))}
      </View>

      <View style={s.educationCard}>
        <Text style={s.educationText}>
          Every OTK donated creates measurable impact.{'\n'}
          Your generosity ripples through communities{'\n'}
          and builds a more equitable world.
        </Text>
      </View>
    </>
  );

  // ─── Give Tab ───

  const renderGive = () => (
    <>
      <Text style={s.sectionTitle}>Active Fundraisers</Text>
      {DEMO_FUNDRAISERS.filter((f) => f.active).map((fundraiser) => {
        const causeColor = getCauseColor(fundraiser.cause);
        const progressPct = Math.min(100, Math.round((fundraiser.raised / fundraiser.goal) * 100));
        return (
          <View key={fundraiser.id} style={s.fundraiserCard}>
            <View style={[s.causeTag, { backgroundColor: causeColor + '20' }]}>
              <Text style={[s.causeTagText, { color: causeColor }]}>
                {CAUSE_CATEGORIES.find((c) => c.key === fundraiser.cause)?.label || fundraiser.cause}
              </Text>
            </View>
            <Text style={s.fundraiserTitle}>{fundraiser.title}</Text>
            <Text style={s.fundraiserOrganizer}>by {fundraiser.organizer}</Text>
            <Text style={s.fundraiserStory}>{fundraiser.story}</Text>
            <View style={s.progressBarOuter}>
              <View style={[s.progressBarInner, { width: `${progressPct}%` }]} />
            </View>
            <View style={s.fundraiserStats}>
              <Text style={s.fundraiserStatText}>
                <Text style={s.fundraiserStatValue}>{fundraiser.raised.toLocaleString()}</Text> / {fundraiser.goal.toLocaleString()} OTK
              </Text>
              <Text style={s.fundraiserStatText}>{fundraiser.supporters} supporters</Text>
              <Text style={s.fundraiserStatText}>Due: {fundraiser.deadline}</Text>
            </View>
            <View style={s.donateRow}>
              <TextInput
                style={s.donateInput}
                placeholder="Amount (OTK)"
                placeholderTextColor={t.text.muted}
                value={donateAmount}
                onChangeText={setDonateAmount}
                keyboardType="numeric"
              />
              <TouchableOpacity style={s.donateBtn} onPress={() => handleDonate(fundraiser)}>
                <Text style={s.donateBtnText}>Donate</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      {/* Completed fundraisers */}
      <Text style={s.sectionTitle}>Completed</Text>
      {DEMO_FUNDRAISERS.filter((f) => !f.active).map((fundraiser) => {
        const causeColor = getCauseColor(fundraiser.cause);
        return (
          <View key={fundraiser.id} style={s.fundraiserCard}>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
              <View style={[s.causeTag, { backgroundColor: causeColor + '20', marginBottom: 0 }]}>
                <Text style={[s.causeTagText, { color: causeColor }]}>
                  {CAUSE_CATEGORIES.find((c) => c.key === fundraiser.cause)?.label || fundraiser.cause}
                </Text>
              </View>
              <View style={s.completedTag}>
                <Text style={s.completedText}>FUNDED</Text>
              </View>
            </View>
            <Text style={s.fundraiserTitle}>{fundraiser.title}</Text>
            <Text style={s.fundraiserOrganizer}>by {fundraiser.organizer} | {fundraiser.supporters} supporters</Text>
            <Text style={[s.fundraiserStatText, { marginTop: 4 }]}>
              {fundraiser.raised.toLocaleString()} / {fundraiser.goal.toLocaleString()} OTK raised
            </Text>
          </View>
        );
      })}
    </>
  );

  // ─── Fundraise Tab ───

  const renderFundraise = () => (
    <>
      <Text style={s.sectionTitle}>Start a Fundraiser</Text>
      <View style={s.card}>
        <TextInput
          style={s.input}
          placeholder="Fundraiser title"
          placeholderTextColor={t.text.muted}
          value={fundraiserTitle}
          onChangeText={setFundraiserTitle}
        />

        <Text style={[s.fundraiserOrganizer, { marginBottom: 8 }]}>Cause Category</Text>
        <View style={s.typeGrid}>
          {CAUSE_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[s.typeChip, fundraiserCause === cat.key && s.typeChipSelected]}
              onPress={() => setFundraiserCause(cat.key)}
            >
              <Text style={[s.typeChipText, fundraiserCause === cat.key && s.typeChipTextSelected]}>
                {cat.icon} {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={s.input}
          placeholder="Fundraising goal (OTK)"
          placeholderTextColor={t.text.muted}
          value={fundraiserGoal}
          onChangeText={setFundraiserGoal}
          keyboardType="numeric"
        />

        <TextInput
          style={s.textArea}
          placeholder="Tell the story behind your fundraiser — why does this matter?"
          placeholderTextColor={t.text.muted}
          value={fundraiserStory}
          onChangeText={setFundraiserStory}
          multiline
        />

        <TouchableOpacity style={s.submitBtn} onPress={handleStartFundraiser}>
          <Text style={s.submitText}>Launch Fundraiser</Text>
        </TouchableOpacity>
      </View>

      <View style={s.educationCard}>
        <Text style={s.educationText}>
          Fundraisers are transparent and trackable.{'\n'}
          All funds flow through the Open Chain,{'\n'}
          with full accountability for every OTK donated.{'\n'}
          Community trust powers community change.
        </Text>
      </View>
    </>
  );

  // ─── Impact Tab ───

  const renderImpact = () => (
    <>
      <Text style={s.sectionTitle}>Impact Reports</Text>
      {DEMO_IMPACT_REPORTS.map((report) => {
        const causeColor = getCauseColor(report.cause);
        return (
          <View key={report.id} style={s.impactCard}>
            <View style={[s.causeTag, { backgroundColor: causeColor + '20' }]}>
              <Text style={[s.causeTagText, { color: causeColor }]}>
                {CAUSE_CATEGORIES.find((c) => c.key === report.cause)?.label || report.cause}
              </Text>
            </View>
            <Text style={s.impactTitle}>{report.title}</Text>
            <Text style={s.impactDesc}>{report.description}</Text>
            <View style={s.impactMeta}>
              <Text style={s.impactMetaText}>{report.otkUsed.toLocaleString()} OTK used</Text>
              <Text style={s.impactMetaText}>{report.peopleHelped} people helped</Text>
              <Text style={s.impactMetaText}>{report.date}</Text>
            </View>
          </View>
        );
      })}

      {/* Summary */}
      <View style={s.card}>
        <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Your Giving Impact</Text>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.green }]}>{DEMO_STATS.totalDonated.toLocaleString()}</Text>
            <Text style={s.statLabel}>OTK Donated</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statValue}>{DEMO_STATS.impactPeople}</Text>
            <Text style={s.statLabel}>People Helped</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.purple }]}>{DEMO_STATS.causesSupported}</Text>
            <Text style={s.statLabel}>Causes</Text>
          </View>
        </View>
      </View>

      <View style={s.educationCard}>
        <Text style={s.educationText}>
          Impact is measured, not assumed.{'\n'}
          Every OTK creates a traceable chain{'\n'}
          from donor to outcome.{'\n'}
          Transparent giving builds a trusted world.
        </Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Philanthropy</Text>
        <View style={{ width: 60 }} />
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {tab === 'dashboard' && renderDashboard()}
        {tab === 'give' && renderGive()}
        {tab === 'fundraise' && renderFundraise()}
        {tab === 'impact' && renderImpact()}
      </ScrollView>
    </SafeAreaView>
  );
}
