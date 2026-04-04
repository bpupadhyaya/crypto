import { fonts } from '../utils/theme';
/**
 * STEM Screen — Science, technology, engineering, math education for all ages.
 *
 * "Every human being deserves access to the tools of understanding —
 *  science, technology, engineering, and mathematics are the languages
 *  of progress."
 * — Human Constitution, Article I (eOTK)
 *
 * Features:
 * - STEM projects (community experiments, build projects, coding challenges)
 * - STEM mentors (scientists, engineers, programmers offering guidance)
 * - Science fair (community science competition with OTK prizes)
 * - Experiment library (step-by-step science experiments doable at home)
 * - STEM stats (projects completed, mentors active, eOTK earned)
 * - Age tracks: kids (6-12), teens (13-17), adults
 * - Demo mode with sample data
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

/* ── data types ── */

interface STEMProject {
  id: string;
  title: string;
  category: 'science' | 'technology' | 'engineering' | 'math';
  ageTrack: 'kids' | 'teens' | 'adults';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  participants: number;
  eOTKReward: number;
  icon: string;
  status: 'active' | 'completed' | 'upcoming';
  description: string;
}

interface STEMMentor {
  id: string;
  name: string;
  field: string;
  speciality: string;
  studentsHelped: number;
  eOTKEarned: number;
  rating: number;
  icon: string;
  available: boolean;
}

interface Experiment {
  id: string;
  title: string;
  category: string;
  ageTrack: 'kids' | 'teens' | 'adults';
  duration: string;
  materials: string[];
  eOTKReward: number;
  icon: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface ScienceFair {
  id: string;
  title: string;
  date: string;
  entries: number;
  prizePool: number;
  status: 'upcoming' | 'active' | 'completed';
  categories: string[];
  icon: string;
}

/* ── demo data ── */

const DEMO_PROJECTS: STEMProject[] = [
  {
    id: 'sp1', title: 'Build a Weather Station', category: 'engineering',
    ageTrack: 'teens', difficulty: 'intermediate', participants: 34,
    eOTKReward: 80, icon: '\u{1F321}\u{FE0F}', status: 'active',
    description: 'Build a Raspberry Pi weather station that reports temperature, humidity, and pressure to the community dashboard.',
  },
  {
    id: 'sp2', title: 'Scratch Coding Challenge', category: 'technology',
    ageTrack: 'kids', difficulty: 'beginner', participants: 72,
    eOTKReward: 40, icon: '\u{1F4BB}', status: 'active',
    description: 'Create a game or animation in Scratch. Best projects win bonus eOTK.',
  },
  {
    id: 'sp3', title: 'Bridge Building Contest', category: 'engineering',
    ageTrack: 'kids', difficulty: 'beginner', participants: 45,
    eOTKReward: 50, icon: '\u{1F309}', status: 'completed',
    description: 'Design and build a bridge from popsicle sticks. Strongest bridge wins.',
  },
  {
    id: 'sp4', title: 'Machine Learning Basics', category: 'technology',
    ageTrack: 'adults', difficulty: 'advanced', participants: 18,
    eOTKReward: 150, icon: '\u{1F916}', status: 'active',
    description: 'Introduction to ML with Python — train a simple model and deploy it.',
  },
];

const DEMO_MENTORS: STEMMentor[] = [
  {
    id: 'sm1', name: 'Dr. Priya Sharma', field: 'Physics',
    speciality: 'Renewable Energy', studentsHelped: 48, eOTKEarned: 960,
    rating: 4.9, icon: '\u{1F52C}', available: true,
  },
  {
    id: 'sm2', name: 'Marcus Chen', field: 'Software Engineering',
    speciality: 'Open Source & Web Dev', studentsHelped: 112, eOTKEarned: 2240,
    rating: 4.8, icon: '\u{1F468}\u{200D}\u{1F4BB}', available: true,
  },
];

const DEMO_EXPERIMENTS: Experiment[] = [
  {
    id: 'se1', title: 'Volcano Eruption', category: 'Chemistry',
    ageTrack: 'kids', duration: '30 min', materials: ['Baking soda', 'Vinegar', 'Food coloring', 'Clay'],
    eOTKReward: 15, icon: '\u{1F30B}', difficulty: 'easy',
  },
  {
    id: 'se2', title: 'Crystal Growing', category: 'Chemistry',
    ageTrack: 'kids', duration: '3 days', materials: ['Sugar', 'Water', 'String', 'Jar'],
    eOTKReward: 25, icon: '\u{1F48E}', difficulty: 'easy',
  },
  {
    id: 'se3', title: 'Solar Oven', category: 'Physics',
    ageTrack: 'teens', duration: '2 hours', materials: ['Cardboard box', 'Aluminum foil', 'Plastic wrap', 'Black paper'],
    eOTKReward: 40, icon: '\u{2600}\u{FE0F}', difficulty: 'medium',
  },
  {
    id: 'se4', title: 'DNA Extraction', category: 'Biology',
    ageTrack: 'teens', duration: '45 min', materials: ['Strawberry', 'Dish soap', 'Salt', 'Rubbing alcohol'],
    eOTKReward: 35, icon: '\u{1F9EC}', difficulty: 'medium',
  },
  {
    id: 'se5', title: 'Arduino LED Circuit', category: 'Electronics',
    ageTrack: 'adults', duration: '1 hour', materials: ['Arduino Uno', 'LEDs', 'Resistors', 'Breadboard'],
    eOTKReward: 50, icon: '\u{1F4A1}', difficulty: 'hard',
  },
];

const DEMO_FAIR: ScienceFair = {
  id: 'sf1', title: 'Spring Community Science Fair 2026',
  date: '2026-04-20', entries: 38, prizePool: 5000,
  status: 'upcoming', icon: '\u{1F3C6}',
  categories: ['Physics', 'Biology', 'Chemistry', 'Engineering', 'Computer Science'],
};

/* ── stats ── */

const DEMO_STATS = {
  projectsCompleted: 127,
  mentorsActive: 24,
  experimentsCompleted: 843,
  totalEOTKEarned: 34520,
  participantsByAge: { kids: 312, teens: 198, adults: 87 },
};

type Tab = 'projects' | 'mentors' | 'experiments' | 'fair';

const AGE_LABELS: Record<string, string> = { kids: 'Kids (6-12)', teens: 'Teens (13-17)', adults: 'Adults' };
const DIFFICULTY_COLORS: Record<string, string> = { beginner: '#4CAF50', easy: '#4CAF50', intermediate: '#FF9800', medium: '#FF9800', advanced: '#F44336', hard: '#F44336' };

export function STEMScreen({ onClose }: Props) {
  const t = useTheme();
  const demoMode = useWalletStore((s) => s.demoMode);
  const [activeTab, setActiveTab] = useState<Tab>('projects');
  const [ageFilter, setAgeFilter] = useState<'all' | 'kids' | 'teens' | 'adults'>('all');

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    heroCard: { backgroundColor: t.accent.blue + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy, textAlign: 'center' },
    heroQuote: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginTop: 8, lineHeight: 18, fontStyle: 'italic' },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
    demoText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.semibold },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 16, backgroundColor: t.bg.card, borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.muted, fontSize: fonts.xs, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    ageRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginTop: 12 },
    ageChip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 10, backgroundColor: t.bg.card },
    ageChipActive: { backgroundColor: t.accent.blue },
    ageChipText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    ageChipTextActive: { color: '#fff' },
    section: { marginHorizontal: 20, marginTop: 20 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    label: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    sublabel: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 2 },
    muted: { color: t.text.muted, fontSize: fonts.xs, marginTop: 4 },
    eotk: { color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.bold },
    badge: { fontSize: fonts.xxxl, marginRight: 12 },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    diffBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 6, alignSelf: 'flex-start' },
    diffText: { color: '#fff', fontSize: fonts.xs, fontWeight: fonts.bold, textTransform: 'uppercase' },
    mentorCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
    mentorInfo: { flex: 1, marginLeft: 12 },
    mentorName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    mentorField: { color: t.accent.blue, fontSize: fonts.sm, fontWeight: fonts.semibold, marginTop: 2 },
    mentorSpec: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 2 },
    mentorStats: { flexDirection: 'row', gap: 12, marginTop: 6 },
    mentorStat: { color: t.text.muted, fontSize: fonts.xs },
    availBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    availText: { fontSize: fonts.xs, fontWeight: fonts.bold },
    expCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    expHeader: { flexDirection: 'row', alignItems: 'center' },
    expInfo: { flex: 1, marginLeft: 12 },
    expTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    expCategory: { color: t.accent.blue, fontSize: fonts.xs, fontWeight: fonts.semibold, marginTop: 2 },
    expMeta: { flexDirection: 'row', gap: 12, marginTop: 8 },
    expMetaText: { color: t.text.muted, fontSize: fonts.xs },
    materialsTitle: { color: t.text.secondary, fontSize: fonts.xs, fontWeight: fonts.semibold, marginTop: 10, marginBottom: 4 },
    materialChip: { backgroundColor: t.bg.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 6, marginBottom: 4 },
    materialText: { color: t.text.secondary, fontSize: fonts.xs },
    fairCard: { backgroundColor: t.accent.purple + '10', borderRadius: 20, padding: 20, marginBottom: 16 },
    fairTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.heavy, textAlign: 'center', marginTop: 8 },
    fairDate: { color: t.accent.purple, fontSize: fonts.sm, fontWeight: fonts.semibold, textAlign: 'center', marginTop: 4 },
    fairStatus: { color: t.accent.orange, fontSize: fonts.sm, fontWeight: fonts.bold, textAlign: 'center', marginTop: 4, textTransform: 'uppercase' },
    fairStats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
    fairStatValue: { color: t.text.primary, fontSize: fonts.xxl, fontWeight: fonts.heavy, textAlign: 'center' },
    fairStatLabel: { color: t.text.muted, fontSize: fonts.xs, textAlign: 'center', marginTop: 2 },
    catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12, justifyContent: 'center' },
    catChip: { backgroundColor: t.bg.card, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    catText: { color: t.text.secondary, fontSize: fonts.xs, fontWeight: fonts.semibold },
    note: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginHorizontal: 24, marginTop: 16, lineHeight: 18 },
  }), [t]);

  const filteredProjects = useMemo(() =>
    ageFilter === 'all' ? DEMO_PROJECTS : DEMO_PROJECTS.filter(p => p.ageTrack === ageFilter),
  [ageFilter]);

  const filteredExperiments = useMemo(() =>
    ageFilter === 'all' ? DEMO_EXPERIMENTS : DEMO_EXPERIMENTS.filter(e => e.ageTrack === ageFilter),
  [ageFilter]);

  const renderTabs = () => {
    const tabs: { key: Tab; label: string }[] = [
      { key: 'projects', label: 'Projects' },
      { key: 'mentors', label: 'Mentors' },
      { key: 'experiments', label: 'Experiments' },
      { key: 'fair', label: 'Science Fair' },
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

  const renderAgeFilter = () => {
    const ages: { key: typeof ageFilter; label: string }[] = [
      { key: 'all', label: 'All Ages' },
      { key: 'kids', label: 'Kids (6-12)' },
      { key: 'teens', label: 'Teens (13-17)' },
      { key: 'adults', label: 'Adults' },
    ];
    return (
      <View style={s.ageRow}>
        {ages.map((a) => (
          <TouchableOpacity
            key={a.key}
            style={[s.ageChip, ageFilter === a.key && s.ageChipActive]}
            onPress={() => setAgeFilter(a.key)}
          >
            <Text style={[s.ageChipText, ageFilter === a.key && s.ageChipTextActive]}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderProjects = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>STEM Projects</Text>
      <View style={s.card}>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{DEMO_STATS.projectsCompleted}</Text>
            <Text style={s.statLabel}>Completed</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.green }]}>{DEMO_STATS.totalEOTKEarned.toLocaleString()}</Text>
            <Text style={s.statLabel}>eOTK Earned</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.blue }]}>{DEMO_STATS.participantsByAge.kids + DEMO_STATS.participantsByAge.teens + DEMO_STATS.participantsByAge.adults}</Text>
            <Text style={s.statLabel}>Participants</Text>
          </View>
        </View>
      </View>
      {filteredProjects.map((project) => (
        <View key={project.id} style={s.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={s.badge}>{project.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>{project.title}</Text>
              <Text style={s.sublabel}>{project.category.charAt(0).toUpperCase() + project.category.slice(1)} {'\u2022'} {AGE_LABELS[project.ageTrack]}</Text>
            </View>
            <Text style={s.eotk}>+{project.eOTKReward} eOTK</Text>
          </View>
          <Text style={s.muted}>{project.description}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <View style={[s.diffBadge, { backgroundColor: DIFFICULTY_COLORS[project.difficulty] }]}>
              <Text style={s.diffText}>{project.difficulty}</Text>
            </View>
            <Text style={s.muted}>{project.participants} participants</Text>
            <Text style={[s.muted, { color: project.status === 'active' ? t.accent.green : project.status === 'completed' ? t.text.muted : t.accent.orange }]}>
              {project.status.toUpperCase()}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderMentors = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>STEM Mentors</Text>
      <View style={s.card}>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{DEMO_STATS.mentorsActive}</Text>
            <Text style={s.statLabel}>Active Mentors</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.blue }]}>{DEMO_MENTORS.reduce((sum, m) => sum + m.studentsHelped, 0)}</Text>
            <Text style={s.statLabel}>Students Helped</Text>
          </View>
        </View>
      </View>
      {DEMO_MENTORS.map((mentor) => (
        <View key={mentor.id} style={s.mentorCard}>
          <Text style={{ fontSize: fonts.hero }}>{mentor.icon}</Text>
          <View style={s.mentorInfo}>
            <Text style={s.mentorName}>{mentor.name}</Text>
            <Text style={s.mentorField}>{mentor.field}</Text>
            <Text style={s.mentorSpec}>{mentor.speciality}</Text>
            <View style={s.mentorStats}>
              <Text style={s.mentorStat}>{mentor.studentsHelped} students</Text>
              <Text style={[s.mentorStat, { color: t.accent.green }]}>{mentor.eOTKEarned} eOTK</Text>
              <Text style={s.mentorStat}>{mentor.rating}/5.0</Text>
            </View>
          </View>
          <View style={[s.availBadge, { backgroundColor: mentor.available ? t.accent.green + '20' : t.text.muted + '20' }]}>
            <Text style={[s.availText, { color: mentor.available ? t.accent.green : t.text.muted }]}>
              {mentor.available ? 'AVAILABLE' : 'BUSY'}
            </Text>
          </View>
        </View>
      ))}
      <Text style={s.note}>
        Mentors earn eOTK for every student they guide through a project or experiment. Connect with a mentor to accelerate your learning.
      </Text>
    </View>
  );

  const renderExperiments = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Experiment Library</Text>
      <View style={s.card}>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{DEMO_EXPERIMENTS.length}</Text>
            <Text style={s.statLabel}>Experiments</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.green }]}>{DEMO_STATS.experimentsCompleted}</Text>
            <Text style={s.statLabel}>Completed</Text>
          </View>
        </View>
      </View>
      {filteredExperiments.map((exp) => (
        <View key={exp.id} style={s.expCard}>
          <View style={s.expHeader}>
            <Text style={{ fontSize: fonts.hero }}>{exp.icon}</Text>
            <View style={s.expInfo}>
              <Text style={s.expTitle}>{exp.title}</Text>
              <Text style={s.expCategory}>{exp.category} {'\u2022'} {AGE_LABELS[exp.ageTrack]}</Text>
            </View>
            <Text style={s.eotk}>+{exp.eOTKReward} eOTK</Text>
          </View>
          <View style={s.expMeta}>
            <Text style={s.expMetaText}>Duration: {exp.duration}</Text>
            <View style={[s.diffBadge, { backgroundColor: DIFFICULTY_COLORS[exp.difficulty], marginTop: 0 }]}>
              <Text style={s.diffText}>{exp.difficulty}</Text>
            </View>
          </View>
          <Text style={s.materialsTitle}>Materials Needed:</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {exp.materials.map((mat) => (
              <View key={mat} style={s.materialChip}>
                <Text style={s.materialText}>{mat}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );

  const renderFair = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Science Fair</Text>
      <View style={s.fairCard}>
        <Text style={{ fontSize: 48, textAlign: 'center' }}>{DEMO_FAIR.icon}</Text>
        <Text style={s.fairTitle}>{DEMO_FAIR.title}</Text>
        <Text style={s.fairDate}>{DEMO_FAIR.date}</Text>
        <Text style={s.fairStatus}>{DEMO_FAIR.status}</Text>
        <View style={s.fairStats}>
          <View>
            <Text style={s.fairStatValue}>{DEMO_FAIR.entries}</Text>
            <Text style={s.fairStatLabel}>Entries</Text>
          </View>
          <View>
            <Text style={[s.fairStatValue, { color: t.accent.green }]}>{DEMO_FAIR.prizePool.toLocaleString()}</Text>
            <Text style={s.fairStatLabel}>OTK Prize Pool</Text>
          </View>
        </View>
        <Text style={s.materialsTitle}>Categories:</Text>
        <View style={s.catRow}>
          {DEMO_FAIR.categories.map((cat) => (
            <View key={cat} style={s.catChip}>
              <Text style={s.catText}>{cat}</Text>
            </View>
          ))}
        </View>
      </View>
      <Text style={s.note}>
        Science fairs are community-organized events. Submit your project to compete for OTK prizes and recognition on Open Chain. All ages welcome.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>STEM Education</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.heroCard}>
          <Text style={s.heroIcon}>{'\u{1F52C}'}</Text>
          <Text style={s.heroTitle}>Science for Everyone</Text>
          <Text style={s.heroQuote}>
            "Every human being deserves access to the tools of understanding — science, technology, engineering, and mathematics are the languages of progress."
            {'\n'}— Human Constitution, Article I
          </Text>
        </View>

        {demoMode && (
          <View style={s.demoTag}>
            <Text style={s.demoText}>DEMO MODE — Sample Data</Text>
          </View>
        )}

        {renderTabs()}
        {(activeTab === 'projects' || activeTab === 'experiments') && renderAgeFilter()}

        {activeTab === 'projects' && renderProjects()}
        {activeTab === 'mentors' && renderMentors()}
        {activeTab === 'experiments' && renderExperiments()}
        {activeTab === 'fair' && renderFair()}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
