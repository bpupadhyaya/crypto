import { fonts } from '../utils/theme';
/**
 * Curriculum Screen — Education Curriculum & Pathway Tracking.
 *
 * Enriches Article I (Education channel, eOTK) with structured
 * learning pathways, skill trees, peer study groups, mentor
 * assignments, and soulbound certificate previews.
 *
 * "The greatest investment any civilization can make is in the raising
 *  and education of its children."
 * — Human Constitution, Article I
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

/* ── data types ── */

type NodeStatus = 'completed' | 'in-progress' | 'locked';

interface SkillNode {
  id: string;
  title: string;
  status: NodeStatus;
  eOTKReward: number;
  prerequisiteIds: string[];
}

interface Pathway {
  id: string;
  name: string;
  category: PathwayCategory;
  icon: string;
  color: string;
  nodes: SkillNode[];
  mentor: { name: string; uid: string } | null;
  certificateName: string;
}

interface StudyGroup {
  id: string;
  name: string;
  pathwayId: string;
  members: number;
  maxMembers: number;
  nextSession: string;
  topic: string;
}

type PathwayCategory = 'Technology' | 'Science' | 'Arts' | 'Languages' | 'Life Skills' | 'Trade Skills';

type Tab = 'pathways' | 'progress' | 'groups';

/* ── category meta ── */

const CATEGORY_META: Record<PathwayCategory, { icon: string; color: string }> = {
  Technology: { icon: '\u{1F4BB}', color: '#3b82f6' },
  Science: { icon: '\u{1F52C}', color: '#8b5cf6' },
  Arts: { icon: '\u{1F3A8}', color: '#ec4899' },
  Languages: { icon: '\u{1F30D}', color: '#06b6d4' },
  'Life Skills': { icon: '\u{1F331}', color: '#22c55e' },
  'Trade Skills': { icon: '\u{1F527}', color: '#f97316' },
};

const STATUS_ICONS: Record<NodeStatus, string> = {
  completed: '\u2705',
  'in-progress': '\u{1F7E1}',
  locked: '\u{1F512}',
};

/* ── demo data ── */

const DEMO_PATHWAYS: Pathway[] = [
  {
    id: 'pw-web',
    name: 'Web Development Fundamentals',
    category: 'Technology',
    icon: '\u{1F310}',
    color: '#3b82f6',
    certificateName: 'Web Development — Foundations',
    mentor: { name: 'Mentor Alex', uid: 'uid-ment-001' },
    nodes: [
      { id: 'web1', title: 'HTML Basics', status: 'completed', eOTKReward: 30, prerequisiteIds: [] },
      { id: 'web2', title: 'CSS Styling', status: 'completed', eOTKReward: 30, prerequisiteIds: ['web1'] },
      { id: 'web3', title: 'JavaScript Essentials', status: 'completed', eOTKReward: 50, prerequisiteIds: ['web2'] },
      { id: 'web4', title: 'Responsive Design', status: 'in-progress', eOTKReward: 40, prerequisiteIds: ['web2'] },
      { id: 'web5', title: 'React Fundamentals', status: 'locked', eOTKReward: 60, prerequisiteIds: ['web3'] },
      { id: 'web6', title: 'Full-Stack Project', status: 'locked', eOTKReward: 100, prerequisiteIds: ['web5', 'web4'] },
    ],
  },
  {
    id: 'pw-bio',
    name: 'Biology & Life Sciences',
    category: 'Science',
    icon: '\u{1F9EC}',
    color: '#8b5cf6',
    certificateName: 'Biology — Foundations',
    mentor: { name: 'Teacher Sarah', uid: 'uid-teach-003' },
    nodes: [
      { id: 'bio1', title: 'Cell Biology', status: 'completed', eOTKReward: 40, prerequisiteIds: [] },
      { id: 'bio2', title: 'Genetics Basics', status: 'in-progress', eOTKReward: 50, prerequisiteIds: ['bio1'] },
      { id: 'bio3', title: 'Ecology & Ecosystems', status: 'locked', eOTKReward: 40, prerequisiteIds: ['bio1'] },
      { id: 'bio4', title: 'Human Anatomy', status: 'locked', eOTKReward: 60, prerequisiteIds: ['bio2'] },
      { id: 'bio5', title: 'Lab Practicals', status: 'locked', eOTKReward: 80, prerequisiteIds: ['bio3', 'bio4'] },
    ],
  },
  {
    id: 'pw-cook',
    name: 'Culinary Arts & Nutrition',
    category: 'Trade Skills',
    icon: '\u{1F373}',
    color: '#f97316',
    certificateName: 'Culinary Arts — Foundations',
    mentor: null,
    nodes: [
      { id: 'cook1', title: 'Kitchen Safety & Hygiene', status: 'completed', eOTKReward: 20, prerequisiteIds: [] },
      { id: 'cook2', title: 'Basic Cooking Techniques', status: 'completed', eOTKReward: 30, prerequisiteIds: ['cook1'] },
      { id: 'cook3', title: 'Nutrition Fundamentals', status: 'completed', eOTKReward: 40, prerequisiteIds: ['cook1'] },
      { id: 'cook4', title: 'Meal Planning', status: 'in-progress', eOTKReward: 40, prerequisiteIds: ['cook2', 'cook3'] },
      { id: 'cook5', title: 'Regional Cuisines', status: 'locked', eOTKReward: 50, prerequisiteIds: ['cook2'] },
      { id: 'cook6', title: 'Capstone: Community Meal', status: 'locked', eOTKReward: 100, prerequisiteIds: ['cook4', 'cook5'] },
    ],
  },
];

const DEMO_GROUPS: StudyGroup[] = [
  { id: 'sg1', name: 'React Builders', pathwayId: 'pw-web', members: 5, maxMembers: 8, nextSession: '2026-04-02 18:00', topic: 'Component Lifecycle' },
  { id: 'sg2', name: 'Bio Lab Partners', pathwayId: 'pw-bio', members: 3, maxMembers: 6, nextSession: '2026-04-01 15:00', topic: 'Genetics Problem Sets' },
  { id: 'sg3', name: 'Kitchen Crew', pathwayId: 'pw-cook', members: 7, maxMembers: 10, nextSession: '2026-03-30 10:00', topic: 'Healthy Meal Prep' },
  { id: 'sg4', name: 'JS Deep Dive', pathwayId: 'pw-web', members: 4, maxMembers: 6, nextSession: '2026-04-03 20:00', topic: 'Async/Await Patterns' },
];

/* ── helpers ── */

function pathwayProgress(pw: Pathway): { completed: number; total: number; percent: number; eOTKEarned: number; eOTKTotal: number } {
  const completed = pw.nodes.filter((n) => n.status === 'completed').length;
  const total = pw.nodes.length;
  const percent = Math.round((completed / total) * 100);
  const eOTKEarned = pw.nodes.filter((n) => n.status === 'completed').reduce((s, n) => s + n.eOTKReward, 0);
  const eOTKTotal = pw.nodes.reduce((s, n) => s + n.eOTKReward, 0);
  return { completed, total, percent, eOTKEarned, eOTKTotal };
}

function recommendedNext(pw: Pathway): SkillNode | null {
  // First in-progress node, otherwise first locked node whose prereqs are all completed
  const inProgress = pw.nodes.find((n) => n.status === 'in-progress');
  if (inProgress) return inProgress;
  const completedIds = new Set(pw.nodes.filter((n) => n.status === 'completed').map((n) => n.id));
  return pw.nodes.find((n) => n.status === 'locked' && n.prerequisiteIds.every((pid) => completedIds.has(pid))) ?? null;
}

/* ── component ── */

export function CurriculumScreen({ onClose }: Props) {
  const t = useTheme();
  const { demoMode } = useWalletStore();
  const [activeTab, setActiveTab] = useState<Tab>('pathways');
  const [expandedPathway, setExpandedPathway] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<PathwayCategory | null>(null);

  const filteredPathways = useMemo(() => {
    if (!filterCategory) return DEMO_PATHWAYS;
    return DEMO_PATHWAYS.filter((pw) => pw.category === filterCategory);
  }, [filterCategory]);

  const totalEOTKEarned = useMemo(
    () => DEMO_PATHWAYS.reduce((sum, pw) => sum + pathwayProgress(pw).eOTKEarned, 0),
    [],
  );

  const totalCompleted = useMemo(
    () => DEMO_PATHWAYS.reduce((sum, pw) => sum + pathwayProgress(pw).completed, 0),
    [],
  );

  const totalModules = useMemo(
    () => DEMO_PATHWAYS.reduce((sum, pw) => sum + pw.nodes.length, 0),
    [],
  );

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    heroCard: { backgroundColor: t.accent.green + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSub: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginTop: 6, lineHeight: 18, fontStyle: 'italic' },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.semibold },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 16, backgroundColor: t.bg.card, borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: t.accent.green },
    tabText: { color: t.text.muted, fontSize: 13, fontWeight: fonts.semibold },
    tabTextActive: { color: t.bg.primary },
    section: { marginHorizontal: 20, marginTop: 20 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    label: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    sublabel: { color: t.text.secondary, fontSize: 12, marginTop: 2 },
    eotk: { color: t.accent.green, fontSize: 14, fontWeight: fonts.bold },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 22, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    // Category filter
    filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    filterChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, backgroundColor: t.bg.card, borderWidth: 1, borderColor: t.border },
    filterChipActive: { borderColor: t.accent.green, backgroundColor: t.accent.green + '20' },
    filterChipText: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.semibold },
    filterChipTextActive: { color: t.accent.green },
    // Pathway card
    pathwayCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4 },
    pathwayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    pathwayIcon: { fontSize: 32, marginRight: 12 },
    pathwayName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold, flex: 1 },
    pathwayCategory: { fontSize: 11, fontWeight: fonts.semibold, marginTop: 2 },
    expandArrow: { color: t.text.muted, fontSize: 16, marginLeft: 8 },
    // Progress bar
    barContainer: { height: 8, backgroundColor: t.border, borderRadius: 4, marginTop: 10 },
    barFill: { height: 8, borderRadius: 4 },
    progressText: { color: t.text.muted, fontSize: 11, marginTop: 4 },
    // Skill tree nodes
    nodeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.border },
    nodeStatus: { fontSize: 20, marginRight: 12 },
    nodeInfo: { flex: 1 },
    nodeTitle: { fontSize: 13, fontWeight: fonts.semibold },
    nodeReward: { color: t.accent.green, fontSize: 12, fontWeight: fonts.bold },
    nodeLocked: { color: t.text.muted },
    nodeCompleted: { color: t.text.primary },
    nodeInProgress: { color: t.accent.blue },
    // Mentor
    mentorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: t.border },
    mentorIcon: { fontSize: 20, marginRight: 8 },
    mentorName: { color: t.text.primary, fontSize: 13, fontWeight: fonts.semibold },
    mentorUid: { color: t.text.muted, fontSize: 11 },
    // Certificate preview
    certPreview: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: t.border },
    certIcon: { fontSize: 20, marginRight: 8 },
    certName: { color: t.accent.purple, fontSize: 12, fontWeight: fonts.bold },
    certSoulbound: { color: t.accent.orange, fontSize: 10, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1, marginLeft: 8 },
    // Recommended
    recommendCard: { backgroundColor: t.accent.blue + '10', borderRadius: 14, padding: 14, marginTop: 8 },
    recommendLabel: { color: t.accent.blue, fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
    recommendTitle: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold, marginTop: 4 },
    recommendReward: { color: t.accent.green, fontSize: 12, fontWeight: fonts.semibold, marginTop: 2 },
    // Study groups
    groupCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    groupName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    groupPathway: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    groupDetail: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    groupDetailItem: { alignItems: 'center' },
    groupDetailValue: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    groupDetailLabel: { color: t.text.muted, fontSize: 10, marginTop: 2 },
    groupTopic: { color: t.text.secondary, fontSize: 12, marginTop: 8 },
    joinBtn: { backgroundColor: t.accent.green, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'flex-start', marginTop: 10 },
    joinBtnText: { color: t.bg.primary, fontSize: 13, fontWeight: fonts.bold },
    createBtn: { backgroundColor: t.accent.blue, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
    createBtnText: { color: '#fff', fontSize: 16, fontWeight: fonts.bold },
    // Progress tab
    progressCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    progressName: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    progressStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    progressStatItem: { alignItems: 'center' },
    progressStatValue: { color: t.text.primary, fontSize: 16, fontWeight: fonts.heavy },
    progressStatLabel: { color: t.text.muted, fontSize: 10, marginTop: 2 },
  }), [t]);

  /* ── tab renderers ── */

  const renderTabs = () => {
    const tabs: { key: Tab; label: string }[] = [
      { key: 'pathways', label: 'Pathways' },
      { key: 'progress', label: 'Progress' },
      { key: 'groups', label: 'Groups' },
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

  const renderPathways = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Learning Pathways</Text>

      {/* Category filter */}
      <View style={s.filterRow}>
        <TouchableOpacity
          style={[s.filterChip, !filterCategory && s.filterChipActive]}
          onPress={() => setFilterCategory(null)}
        >
          <Text style={[s.filterChipText, !filterCategory && s.filterChipTextActive]}>All</Text>
        </TouchableOpacity>
        {(Object.keys(CATEGORY_META) as PathwayCategory[]).map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[s.filterChip, filterCategory === cat && s.filterChipActive]}
            onPress={() => setFilterCategory(filterCategory === cat ? null : cat)}
          >
            <Text style={[s.filterChipText, filterCategory === cat && s.filterChipTextActive]}>
              {CATEGORY_META[cat].icon} {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Pathway cards with skill tree */}
      {filteredPathways.map((pw) => {
        const prog = pathwayProgress(pw);
        const isExpanded = expandedPathway === pw.id;
        const next = recommendedNext(pw);

        return (
          <View key={pw.id} style={[s.pathwayCard, { borderLeftColor: pw.color }]}>
            <TouchableOpacity
              style={s.pathwayHeader}
              onPress={() => setExpandedPathway(isExpanded ? null : pw.id)}
            >
              <Text style={s.pathwayIcon}>{pw.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.pathwayName}>{pw.name}</Text>
                <Text style={[s.pathwayCategory, { color: pw.color }]}>{pw.category}</Text>
              </View>
              <Text style={s.eotk}>{prog.eOTKEarned}/{prog.eOTKTotal} eOTK</Text>
              <Text style={s.expandArrow}>{isExpanded ? '\u25B2' : '\u25BC'}</Text>
            </TouchableOpacity>

            {/* Progress bar */}
            <View style={s.barContainer}>
              <View style={[s.barFill, { width: `${prog.percent}%`, backgroundColor: pw.color }]} />
            </View>
            <Text style={s.progressText}>
              {prog.completed}/{prog.total} modules completed ({prog.percent}%)
            </Text>

            {isExpanded && (
              <>
                {/* Skill tree nodes */}
                {pw.nodes.map((node) => (
                  <View key={node.id} style={s.nodeRow}>
                    <Text style={s.nodeStatus}>{STATUS_ICONS[node.status]}</Text>
                    <View style={s.nodeInfo}>
                      <Text style={[
                        s.nodeTitle,
                        node.status === 'completed' && s.nodeCompleted,
                        node.status === 'in-progress' && s.nodeInProgress,
                        node.status === 'locked' && s.nodeLocked,
                      ]}>
                        {node.title}
                      </Text>
                      {node.prerequisiteIds.length > 0 && (
                        <Text style={[s.sublabel, { fontSize: 10 }]}>
                          Requires: {node.prerequisiteIds.map(
                            (pid) => pw.nodes.find((n) => n.id === pid)?.title ?? pid
                          ).join(', ')}
                        </Text>
                      )}
                    </View>
                    <Text style={[s.nodeReward, node.status === 'locked' && { color: t.text.muted }]}>
                      {node.status === 'completed' ? '+' : ''}{node.eOTKReward} eOTK
                    </Text>
                  </View>
                ))}

                {/* Recommended next step */}
                {next && (
                  <View style={s.recommendCard}>
                    <Text style={s.recommendLabel}>Recommended Next</Text>
                    <Text style={s.recommendTitle}>{next.title}</Text>
                    <Text style={s.recommendReward}>Earn {next.eOTKReward} eOTK on completion</Text>
                  </View>
                )}

                {/* Mentor */}
                {pw.mentor ? (
                  <View style={s.mentorRow}>
                    <Text style={s.mentorIcon}>{'\u{1F9D1}\u200D\u{1F3EB}'}</Text>
                    <View>
                      <Text style={s.mentorName}>{pw.mentor.name}</Text>
                      <Text style={s.mentorUid}>{pw.mentor.uid}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={s.mentorRow}>
                    <Text style={s.mentorIcon}>{'\u{1F9D1}\u200D\u{1F3EB}'}</Text>
                    <Text style={[s.mentorName, { color: t.text.muted }]}>No mentor assigned — request one</Text>
                  </View>
                )}

                {/* Certificate preview */}
                <View style={s.certPreview}>
                  <Text style={s.certIcon}>{'\u{1F3C5}'}</Text>
                  <Text style={s.certName}>{pw.certificateName}</Text>
                  <Text style={s.certSoulbound}>Soulbound</Text>
                </View>
              </>
            )}
          </View>
        );
      })}
    </View>
  );

  const renderProgress = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Overall Progress</Text>

      {/* Summary stats */}
      <View style={s.card}>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{DEMO_PATHWAYS.length}</Text>
            <Text style={s.statLabel}>Pathways</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.green }]}>{totalCompleted}/{totalModules}</Text>
            <Text style={s.statLabel}>Modules Done</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.blue }]}>{totalEOTKEarned}</Text>
            <Text style={s.statLabel}>eOTK Earned</Text>
          </View>
        </View>
      </View>

      {/* Per-pathway progress */}
      {DEMO_PATHWAYS.map((pw) => {
        const prog = pathwayProgress(pw);
        const next = recommendedNext(pw);

        return (
          <View key={pw.id} style={s.progressCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 24, marginRight: 10 }}>{pw.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.progressName}>{pw.name}</Text>
                <Text style={[s.sublabel, { color: pw.color }]}>{pw.category}</Text>
              </View>
            </View>

            <View style={s.barContainer}>
              <View style={[s.barFill, { width: `${prog.percent}%`, backgroundColor: pw.color }]} />
            </View>

            <View style={s.progressStats}>
              <View style={s.progressStatItem}>
                <Text style={s.progressStatValue}>{prog.percent}%</Text>
                <Text style={s.progressStatLabel}>Complete</Text>
              </View>
              <View style={s.progressStatItem}>
                <Text style={[s.progressStatValue, { color: t.accent.green }]}>{prog.eOTKEarned}</Text>
                <Text style={s.progressStatLabel}>eOTK Earned</Text>
              </View>
              <View style={s.progressStatItem}>
                <Text style={[s.progressStatValue, { color: t.text.muted }]}>{prog.eOTKTotal - prog.eOTKEarned}</Text>
                <Text style={s.progressStatLabel}>eOTK Remaining</Text>
              </View>
            </View>

            {next && (
              <View style={s.recommendCard}>
                <Text style={s.recommendLabel}>Up Next</Text>
                <Text style={s.recommendTitle}>{next.title}</Text>
                <Text style={s.recommendReward}>+{next.eOTKReward} eOTK</Text>
              </View>
            )}

            {/* Mentor info */}
            {pw.mentor && (
              <View style={[s.mentorRow, { borderTopWidth: 0, marginTop: 6 }]}>
                <Text style={s.mentorIcon}>{'\u{1F9D1}\u200D\u{1F3EB}'}</Text>
                <Text style={s.mentorName}>{pw.mentor.name}</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );

  const renderGroups = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Peer Study Groups</Text>

      {DEMO_GROUPS.map((group) => {
        const pw = DEMO_PATHWAYS.find((p) => p.id === group.pathwayId);
        const spotsLeft = group.maxMembers - group.members;

        return (
          <View key={group.id} style={s.groupCard}>
            <Text style={s.groupName}>{group.name}</Text>
            <Text style={s.groupPathway}>
              {pw?.icon ?? ''} {pw?.name ?? group.pathwayId}
            </Text>

            <View style={s.groupDetail}>
              <View style={s.groupDetailItem}>
                <Text style={s.groupDetailValue}>{group.members}/{group.maxMembers}</Text>
                <Text style={s.groupDetailLabel}>Members</Text>
              </View>
              <View style={s.groupDetailItem}>
                <Text style={[s.groupDetailValue, { color: spotsLeft <= 2 ? t.accent.orange : t.accent.green }]}>{spotsLeft}</Text>
                <Text style={s.groupDetailLabel}>Spots Left</Text>
              </View>
              <View style={s.groupDetailItem}>
                <Text style={[s.groupDetailValue, { color: t.accent.blue, fontSize: 12 }]}>{group.nextSession}</Text>
                <Text style={s.groupDetailLabel}>Next Session</Text>
              </View>
            </View>

            <Text style={s.groupTopic}>Topic: {group.topic}</Text>

            <TouchableOpacity
              style={s.joinBtn}
              onPress={() => Alert.alert(
                'Joined Group (Demo)',
                `You have joined "${group.name}". Next session: ${group.nextSession}.\n\nIn production, this will sync with your calendar and group members via Open Chain P2P messaging.`,
              )}
            >
              <Text style={s.joinBtnText}>Join Group</Text>
            </TouchableOpacity>
          </View>
        );
      })}

      <TouchableOpacity
        style={s.createBtn}
        onPress={() => Alert.alert(
          'Create Study Group (Demo)',
          'In production, you can create a study group linked to any pathway. Group members earn bonus eOTK for collaborative learning milestones.',
        )}
      >
        <Text style={s.createBtnText}>Create New Study Group</Text>
      </TouchableOpacity>
    </View>
  );

  /* ── main render ── */

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Curriculum</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.heroCard}>
          <Text style={s.heroIcon}>{'\u{1F4DA}'}</Text>
          <Text style={s.heroTitle}>Education Pathways</Text>
          <Text style={s.heroSub}>
            "The greatest investment any civilization can make is in the raising and education of its children."
            {'\n'}— Human Constitution, Article I
          </Text>
        </View>

        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO MODE — Sample Data</Text>
        </View>

        {renderTabs()}

        {activeTab === 'pathways' && renderPathways()}
        {activeTab === 'progress' && renderProgress()}
        {activeTab === 'groups' && renderGroups()}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
