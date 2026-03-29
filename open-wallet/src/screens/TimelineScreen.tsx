/**
 * Timeline Screen — Personal life timeline, milestones, and journey visualization.
 *
 * "Every human life is a chain of moments — each one shaped by those
 *  who came before, and shaping those who come after."
 * — The Human Constitution, Article I
 *
 * A visual timeline of life milestones — some auto-populated from
 * on-chain data (OTK earned, achievements, gratitude received),
 * others added manually. Your life story, on the chain of humanity.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

type Tab = 'timeline' | 'add' | 'share' | 'export';
type ViewMode = 'timeline' | 'milestones';

interface Milestone {
  id: string;
  title: string;
  date: string;
  description: string;
  significance: 'major' | 'moderate' | 'minor';
  source: 'manual' | 'chain';
  icon: string;
  otkAmount?: number;
  chainRef?: string;
}

const SIGNIFICANCE_COLORS: Record<string, string> = {
  major: '#FFD700',
  moderate: '#87CEEB',
  minor: '#C0C0C0',
};

// Demo: 12 milestones spanning 25 years, 5 auto-populated from chain
const DEMO_MILESTONES: Milestone[] = [
  {
    id: 'ms-001', title: 'Born into the World', date: '2001-03-15',
    description: 'The beginning of a journey. Parents registered your Universal ID on Open Chain.',
    significance: 'major', source: 'chain', icon: '\ud83d\udc76',
    chainRef: 'tx-genesis-0x00a1',
  },
  {
    id: 'ms-002', title: 'First Words', date: '2002-08-20',
    description: 'Said "mama" for the first time. A moment preserved forever.',
    significance: 'moderate', source: 'manual', icon: '\ud83d\udde3\ufe0f',
  },
  {
    id: 'ms-003', title: 'Started School', date: '2007-09-01',
    description: 'First day of primary school. New friends, new world.',
    significance: 'major', source: 'manual', icon: '\ud83c\udfeb',
  },
  {
    id: 'ms-004', title: 'First Achievement Unlocked', date: '2010-06-15',
    description: 'Won the school science fair. First on-chain achievement badge.',
    significance: 'moderate', source: 'chain', icon: '\ud83c\udfc6',
    otkAmount: 50, chainRef: 'tx-achieve-0x0b2f',
  },
  {
    id: 'ms-005', title: 'Graduated Middle School', date: '2015-06-20',
    description: 'Completed middle school with honors. Teachers sent gratitude on-chain.',
    significance: 'major', source: 'manual', icon: '\ud83c\udf93',
  },
  {
    id: 'ms-006', title: 'First Gratitude Received', date: '2016-12-25',
    description: 'Received first gratitude OTK from a neighbor for volunteering.',
    significance: 'moderate', source: 'chain', icon: '\ud83d\ude4f',
    otkAmount: 100, chainRef: 'tx-grat-0x1c3e',
  },
  {
    id: 'ms-007', title: 'High School Graduation', date: '2019-06-15',
    description: 'Graduated top of class. Family celebration recorded on-chain.',
    significance: 'major', source: 'manual', icon: '\ud83c\udf93',
  },
  {
    id: 'ms-008', title: 'Started University', date: '2019-09-01',
    description: 'Enrolled in Computer Science. New chapter begins.',
    significance: 'major', source: 'manual', icon: '\ud83d\udcda',
  },
  {
    id: 'ms-009', title: 'Community Contribution Milestone', date: '2022-03-10',
    description: 'Reached 1,000 OTK earned through community contributions.',
    significance: 'moderate', source: 'chain', icon: '\ud83c\udf1f',
    otkAmount: 1000, chainRef: 'tx-contrib-0x2d4a',
  },
  {
    id: 'ms-010', title: 'University Graduation', date: '2023-05-20',
    description: 'B.Sc. in Computer Science. Ready to build for humanity.',
    significance: 'major', source: 'manual', icon: '\ud83c\udf93',
  },
  {
    id: 'ms-011', title: 'First Career Role', date: '2023-08-01',
    description: 'Started as a software engineer building open-source tools.',
    significance: 'major', source: 'manual', icon: '\ud83d\udcbb',
  },
  {
    id: 'ms-012', title: 'Reached 5,000 OTK Lifetime', date: '2026-01-15',
    description: 'Lifetime earnings crossed 5,000 OTK through teaching, mentoring, and community work.',
    significance: 'major', source: 'chain', icon: '\ud83d\udc8e',
    otkAmount: 5000, chainRef: 'tx-life-0x3e5b',
  },
];

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'timeline', label: 'Timeline', icon: '\ud83d\udcc5' },
  { key: 'add', label: 'Add', icon: '\u2795' },
  { key: 'share', label: 'Share', icon: '\ud83d\udd17' },
  { key: 'export', label: 'Export', icon: '\ud83d\udcc4' },
];

export function TimelineScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('timeline');
  const [milestones] = useState<Milestone[]>(DEMO_MILESTONES);
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newSignificance, setNewSignificance] = useState<'major' | 'moderate' | 'minor'>('moderate');
  const [sharePublic, setSharePublic] = useState(false);
  const t = useTheme();
  const demoMode = useWalletStore((s: any) => s.demoMode);

  const sortedMilestones = useMemo(() =>
    [...milestones].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [milestones]
  );

  const chainMilestones = useMemo(() => milestones.filter(m => m.source === 'chain'), [milestones]);
  const manualMilestones = useMemo(() => milestones.filter(m => m.source === 'manual'), [milestones]);
  const totalOTK = useMemo(() => milestones.reduce((sum, m) => sum + (m.otkAmount || 0), 0), [milestones]);

  // Group by decade for year-by-year view
  const groupedByYear = useMemo(() => {
    const groups: Record<string, Milestone[]> = {};
    sortedMilestones.forEach(m => {
      const year = m.date.slice(0, 4);
      if (!groups[year]) groups[year] = [];
      groups[year].push(m);
    });
    return groups;
  }, [sortedMilestones]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    heroCard: { backgroundColor: t.accent.blue + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: '800', textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 20, marginTop: 16 },
    statBox: { alignItems: 'center', flex: 1 },
    statValue: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 20, backgroundColor: t.bg.card, borderRadius: 16, padding: 4 },
    tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
    tabBtnActive: { backgroundColor: t.accent.purple },
    tabText: { color: t.text.secondary, fontSize: 11, fontWeight: '700' },
    tabTextActive: { color: '#fff' },
    tabIcon: { fontSize: 18, marginBottom: 2 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 24 },
    viewToggle: { flexDirection: 'row', marginHorizontal: 20, marginTop: 16, gap: 8 },
    toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, backgroundColor: t.bg.card },
    toggleBtnActive: { backgroundColor: t.accent.blue },
    toggleText: { color: t.text.secondary, fontSize: 13, fontWeight: '700' },
    toggleTextActive: { color: '#fff' },
    // Timeline items
    timelineItem: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 4 },
    timelineLine: { width: 2, backgroundColor: t.border, marginLeft: 18, marginRight: 16 },
    timelineDot: { width: 12, height: 12, borderRadius: 6, position: 'absolute', left: 13, top: 20, zIndex: 1 },
    timelineContent: { flex: 1, backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 8 },
    timelineDate: { color: t.accent.blue, fontSize: 12, fontWeight: '700', marginBottom: 4 },
    timelineIcon: { fontSize: 24, marginRight: 8 },
    timelineHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    timelineTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700', flex: 1 },
    timelineDesc: { color: t.text.secondary, fontSize: 13, lineHeight: 20 },
    timelineChain: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
    chainBadge: { backgroundColor: t.accent.green + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    chainBadgeText: { color: t.accent.green, fontSize: 10, fontWeight: '700' },
    chainRef: { color: t.text.muted, fontSize: 10, fontFamily: 'Courier' },
    otkBadge: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginLeft: 4 },
    otkBadgeText: { color: t.accent.orange, fontSize: 10, fontWeight: '700' },
    significanceDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    yearHeader: { color: t.text.primary, fontSize: 18, fontWeight: '800', marginLeft: 24, marginTop: 20, marginBottom: 8 },
    // Add form
    inputCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 8 },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15 },
    messageInput: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, minHeight: 100, textAlignVertical: 'top' },
    sigRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    sigChip: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, backgroundColor: t.bg.primary },
    sigChipActive: { borderWidth: 2 },
    sigChipLabel: { color: t.text.secondary, fontSize: 12, fontWeight: '700' },
    // Share
    shareCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 12 },
    shareRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
    shareLabel: { color: t.text.primary, fontSize: 15, fontWeight: '600' },
    shareDesc: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    shareToggle: { backgroundColor: t.bg.primary, borderRadius: 20, width: 52, height: 28, justifyContent: 'center', padding: 2 },
    shareToggleActive: { backgroundColor: t.accent.green },
    shareToggleDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },
    shareToggleDotActive: { alignSelf: 'flex-end' },
    // Export
    exportCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginHorizontal: 20, marginTop: 12, alignItems: 'center' },
    exportIcon: { fontSize: 48, marginBottom: 12 },
    exportTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', textAlign: 'center' },
    exportDesc: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 20 },
    actionBtn: { backgroundColor: t.accent.purple, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginHorizontal: 20, marginTop: 16 },
    actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    secondaryBtn: { backgroundColor: t.bg.card, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginHorizontal: 20, marginTop: 10 },
    secondaryBtnText: { color: t.accent.purple, fontSize: 16, fontWeight: '700' },
    note: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginHorizontal: 24, marginTop: 16, lineHeight: 18 },
  }), [t]);

  // ─── Timeline Tab ───
  const renderTimeline = useCallback(() => (
    <>
      <View style={s.viewToggle}>
        <TouchableOpacity
          style={[s.toggleBtn, viewMode === 'timeline' && s.toggleBtnActive]}
          onPress={() => setViewMode('timeline')}
        >
          <Text style={[s.toggleText, viewMode === 'timeline' && s.toggleTextActive]}>Year by Year</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.toggleBtn, viewMode === 'milestones' && s.toggleBtnActive]}
          onPress={() => setViewMode('milestones')}
        >
          <Text style={[s.toggleText, viewMode === 'milestones' && s.toggleTextActive]}>Milestones Only</Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'timeline' ? (
        // Year-by-year view
        Object.entries(groupedByYear).map(([year, items]) => (
          <View key={year}>
            <Text style={s.yearHeader}>{year}</Text>
            {items.map((m) => renderMilestoneItem(m))}
          </View>
        ))
      ) : (
        // Milestone view (major only)
        <>
          <Text style={s.section}>Major Milestones</Text>
          {sortedMilestones.filter(m => m.significance === 'major').map((m) => renderMilestoneItem(m))}
        </>
      )}
    </>
  ), [viewMode, groupedByYear, sortedMilestones, s]);

  const renderMilestoneItem = useCallback((m: Milestone) => (
    <View key={m.id} style={s.timelineItem}>
      <View>
        <View style={[s.timelineDot, { backgroundColor: SIGNIFICANCE_COLORS[m.significance] }]} />
        <View style={s.timelineLine} />
      </View>
      <View style={s.timelineContent}>
        <Text style={s.timelineDate}>{m.date}</Text>
        <View style={s.timelineHeader}>
          <Text style={s.timelineIcon}>{m.icon}</Text>
          <Text style={s.timelineTitle}>{m.title}</Text>
        </View>
        <Text style={s.timelineDesc}>{m.description}</Text>
        {m.source === 'chain' && (
          <View style={s.timelineChain}>
            <View style={s.chainBadge}>
              <Text style={s.chainBadgeText}>On-Chain</Text>
            </View>
            {m.chainRef && <Text style={s.chainRef}>{m.chainRef}</Text>}
            {m.otkAmount != null && (
              <View style={s.otkBadge}>
                <Text style={s.otkBadgeText}>{m.otkAmount.toLocaleString()} OTK</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  ), [s]);

  // ─── Add Tab ───
  const renderAdd = useCallback(() => (
    <>
      <Text style={s.section}>Add Personal Milestone</Text>

      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Milestone Title</Text>
        <TextInput
          style={s.input}
          value={newTitle}
          onChangeText={setNewTitle}
          placeholder="e.g., First Day at Work"
          placeholderTextColor={t.text.muted}
        />
      </View>

      <View style={[s.inputCard, { marginTop: 12 }]}>
        <Text style={s.inputLabel}>Date (YYYY-MM-DD)</Text>
        <TextInput
          style={s.input}
          value={newDate}
          onChangeText={setNewDate}
          placeholder="2026-01-15"
          placeholderTextColor={t.text.muted}
        />
      </View>

      <View style={[s.inputCard, { marginTop: 12 }]}>
        <Text style={s.inputLabel}>Description</Text>
        <TextInput
          style={s.messageInput}
          value={newDescription}
          onChangeText={setNewDescription}
          placeholder="What happened and why it matters..."
          placeholderTextColor={t.text.muted}
          multiline
        />
      </View>

      <View style={[s.inputCard, { marginTop: 12 }]}>
        <Text style={s.inputLabel}>Significance</Text>
        <View style={s.sigRow}>
          {(['major', 'moderate', 'minor'] as const).map((sig) => (
            <TouchableOpacity
              key={sig}
              style={[
                s.sigChip,
                newSignificance === sig && s.sigChipActive,
                newSignificance === sig && { borderColor: SIGNIFICANCE_COLORS[sig] },
              ]}
              onPress={() => setNewSignificance(sig)}
            >
              <View style={[s.significanceDot, { backgroundColor: SIGNIFICANCE_COLORS[sig], alignSelf: 'center', marginBottom: 4 }]} />
              <Text style={s.sigChipLabel}>{sig.charAt(0).toUpperCase() + sig.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={s.actionBtn}
        onPress={() => {
          if (!newTitle.trim()) {
            Alert.alert('Title Required', 'Please enter a milestone title.');
            return;
          }
          if (!newDate.trim()) {
            Alert.alert('Date Required', 'Please enter a date for this milestone.');
            return;
          }
          Alert.alert('Milestone Added', `"${newTitle}" has been added to your life timeline.`);
          setNewTitle('');
          setNewDate('');
          setNewDescription('');
          setNewSignificance('moderate');
        }}
      >
        <Text style={s.actionBtnText}>Add Milestone</Text>
      </TouchableOpacity>

      <Text style={s.note}>
        Manually added milestones are stored locally and optionally synced on-chain. Auto-populated milestones from OTK transactions and achievements are always on-chain.
      </Text>
    </>
  ), [newTitle, newDate, newDescription, newSignificance, s, t]);

  // ─── Share Tab ───
  const renderShare = useCallback(() => (
    <>
      <Text style={s.section}>Share Your Timeline</Text>

      <View style={s.shareCard}>
        <View style={s.shareRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.shareLabel}>Public Timeline</Text>
            <Text style={s.shareDesc}>Anyone with your Universal ID can view your milestones</Text>
          </View>
          <TouchableOpacity
            style={[s.shareToggle, sharePublic && s.shareToggleActive]}
            onPress={() => setSharePublic(!sharePublic)}
          >
            <View style={[s.shareToggleDot, sharePublic && s.shareToggleDotActive]} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[s.shareCard, { marginTop: 12 }]}>
        <View style={s.shareRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.shareLabel}>Selective Sharing</Text>
            <Text style={s.shareDesc}>Choose specific milestones and who can see them</Text>
          </View>
        </View>
        <TouchableOpacity style={[s.actionBtn, { marginHorizontal: 0, marginTop: 12 }]} onPress={() => Alert.alert('Selective Share', 'Choose which milestones to share and with whom.')}>
          <Text style={s.actionBtnText}>Configure Sharing</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.note}>
        On-chain milestones are always verifiable. Private milestones are encrypted and only shared with your explicit permission.
      </Text>
    </>
  ), [sharePublic, s]);

  // ─── Export Tab ───
  const renderExport = useCallback(() => (
    <>
      <Text style={s.section}>Life Story Export</Text>

      <View style={s.exportCard}>
        <Text style={s.exportIcon}>{'\ud83d\udcd6'}</Text>
        <Text style={s.exportTitle}>Generate Your Life Story</Text>
        <Text style={s.exportDesc}>
          Create a readable narrative summary of your life journey based on your milestones, achievements, gratitude received, and community contributions.
        </Text>
      </View>

      <TouchableOpacity style={s.actionBtn} onPress={() => Alert.alert('Life Story Generated', 'Your life story has been generated from 12 milestones spanning 25 years. It includes 5 on-chain verified achievements.')}>
        <Text style={s.actionBtnText}>Generate Life Story</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.secondaryBtn} onPress={() => Alert.alert('Export JSON', 'Your timeline data has been exported as a verifiable JSON document with on-chain proofs.')}>
        <Text style={s.secondaryBtnText}>Export as JSON (Verifiable)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.secondaryBtn} onPress={() => Alert.alert('Export PDF', 'Your life story has been exported as a printable PDF document.')}>
        <Text style={s.secondaryBtnText}>Export as PDF</Text>
      </TouchableOpacity>

      <Text style={s.note}>
        Exported life stories include cryptographic proofs for on-chain milestones, making them independently verifiable by anyone with the document.
      </Text>
    </>
  ), [s]);

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Life Timeline</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={s.heroCard}>
          <Text style={s.heroIcon}>{'\ud83d\udcc5'}</Text>
          <Text style={s.heroTitle}>Your Life Journey</Text>
          <Text style={s.heroSubtitle}>
            Every milestone tells a story.{'\n'}
            Your timeline, your legacy on the chain of humanity.
          </Text>
        </View>

        {/* Summary Stats */}
        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={s.statValue}>{milestones.length}</Text>
            <Text style={s.statLabel}>Milestones</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>{chainMilestones.length}</Text>
            <Text style={s.statLabel}>On-Chain</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>{manualMilestones.length}</Text>
            <Text style={s.statLabel}>Manual</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>{totalOTK.toLocaleString()}</Text>
            <Text style={s.statLabel}>OTK Earned</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={s.tabRow}>
          {TABS.map((tb) => (
            <TouchableOpacity
              key={tb.key}
              style={[s.tabBtn, tab === tb.key && s.tabBtnActive]}
              onPress={() => setTab(tb.key)}
            >
              <Text style={s.tabIcon}>{tb.icon}</Text>
              <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {tab === 'timeline' && renderTimeline()}
        {tab === 'add' && renderAdd()}
        {tab === 'share' && renderShare()}
        {tab === 'export' && renderExport()}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
