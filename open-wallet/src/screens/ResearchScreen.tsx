import { fonts } from '../utils/theme';
/**
 * Research Screen (Art I / eOTK) — Community research collaboration.
 *
 * Open-access research where anyone can contribute data, analysis, or peer review.
 * Contributors earn eOTK for meaningful participation. Results are hash-verified on-chain.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator, FlatList,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

type ProjectCategory = 'health' | 'agriculture' | 'education' | 'environment' | 'technology';

interface ResearchProject {
  id: string;
  title: string;
  description: string;
  category: ProjectCategory;
  status: 'active' | 'completed' | 'peer_review';
  contributors: number;
  dataPoints: number;
  eOTKPool: number;
  lead: string;
  createdAt: string;
}

interface Contribution {
  id: string;
  projectId: string;
  projectTitle: string;
  type: 'data' | 'analysis' | 'peer_review';
  description: string;
  eOTKEarned: number;
  date: string;
  status: 'accepted' | 'pending' | 'revision';
}

interface PublishedResult {
  id: string;
  projectId: string;
  title: string;
  category: ProjectCategory;
  authors: number;
  dataPoints: number;
  hashOnChain: string;
  publishedDate: string;
  citations: number;
}

interface Props {
  onClose: () => void;
}

type TabKey = 'projects' | 'contribute' | 'published' | 'start';

const CATEGORY_COLORS: Record<ProjectCategory, string> = {
  health: '#e91e63',
  agriculture: '#4caf50',
  education: '#2196f3',
  environment: '#00bcd4',
  technology: '#9c27b0',
};

const CATEGORY_ICONS: Record<ProjectCategory, string> = {
  health: '\u2695\ufe0f',
  agriculture: '\ud83c\udf3e',
  education: '\ud83c\udf93',
  environment: '\ud83c\udf0d',
  technology: '\ud83d\udd2c',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#4caf50',
  completed: '#2196f3',
  peer_review: '#ff9800',
  accepted: '#4caf50',
  pending: '#ff9800',
  revision: '#f44336',
};

const DEMO_PROJECTS: ResearchProject[] = [
  {
    id: 'rp-1',
    title: 'Community Nutrition Patterns in Rural Areas',
    description: 'Mapping dietary diversity and micronutrient intake across 50 rural communities. Seeking data collectors and nutritionists for analysis.',
    category: 'health',
    status: 'active',
    contributors: 34,
    dataPoints: 2847,
    eOTKPool: 5000,
    lead: 'openchain1abc...xyz',
    createdAt: '2026-02-15',
  },
  {
    id: 'rp-2',
    title: 'Open-Source Drought-Resistant Crop Varieties',
    description: 'Collaborative field trials of 12 drought-resistant seed varieties across different climate zones. Data needed on yield, water usage, and soil impact.',
    category: 'agriculture',
    status: 'active',
    contributors: 67,
    dataPoints: 8312,
    eOTKPool: 12000,
    lead: 'openchain1def...uvw',
    createdAt: '2026-01-08',
  },
  {
    id: 'rp-3',
    title: 'Peer Tutoring Effectiveness in K-12',
    description: 'Measuring learning outcomes when older students tutor younger ones. Currently in peer review phase with 6 months of data.',
    category: 'education',
    status: 'peer_review',
    contributors: 21,
    dataPoints: 4156,
    eOTKPool: 3500,
    lead: 'openchain1ghi...rst',
    createdAt: '2025-11-20',
  },
];

const DEMO_CONTRIBUTIONS: Contribution[] = [
  {
    id: 'c-1',
    projectId: 'rp-1',
    projectTitle: 'Community Nutrition Patterns in Rural Areas',
    type: 'data',
    description: 'Submitted dietary survey data for 45 households in Region 3',
    eOTKEarned: 120,
    date: '2026-03-25',
    status: 'accepted',
  },
  {
    id: 'c-2',
    projectId: 'rp-2',
    projectTitle: 'Open-Source Drought-Resistant Crop Varieties',
    type: 'analysis',
    description: 'Statistical analysis of Variety B yield data across 8 sites',
    eOTKEarned: 250,
    date: '2026-03-20',
    status: 'pending',
  },
];

const DEMO_PUBLISHED: PublishedResult[] = [
  {
    id: 'pub-1',
    projectId: 'rp-0',
    title: 'Solar Water Purification: A Zero-Cost Community Solution',
    category: 'technology',
    authors: 14,
    dataPoints: 6230,
    hashOnChain: '0xa3f7c2...d91e',
    publishedDate: '2026-03-01',
    citations: 8,
  },
];

export function ResearchScreen({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('projects');
  const [selectedProject, setSelectedProject] = useState<ResearchProject | null>(null);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [published, setPublished] = useState<PublishedResult[]>([]);
  const [filterCategory, setFilterCategory] = useState<ProjectCategory | 'all'>('all');
  // Start new project fields
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<ProjectCategory>('health');
  const [newDataNeeds, setNewDataNeeds] = useState('');
  // Contribute fields
  const [contributeType, setContributeType] = useState<'data' | 'analysis' | 'peer_review'>('data');
  const [contributeNote, setContributeNote] = useState('');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, backgroundColor: t.bg.card, borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.bold },
    tabTextActive: { color: '#fff' },
    heroCard: { backgroundColor: t.accent.blue + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, alignItems: 'center', marginBottom: 16 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },
    filterRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 12, flexWrap: 'wrap', gap: 8 },
    filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: t.border },
    filterChipActive: { backgroundColor: t.accent.blue, borderColor: t.accent.blue },
    filterChipText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    filterChipTextActive: { color: '#fff' },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 20 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    cardTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    cardDesc: { color: t.text.secondary, fontSize: 13, lineHeight: 20, marginTop: 6 },
    cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaLabel: { color: t.text.muted, fontSize: 11 },
    metaValue: { color: t.text.primary, fontSize: 13, fontWeight: fonts.bold },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase' },
    categoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
    categoryText: { color: '#fff', fontSize: 11, fontWeight: fonts.bold },
    statsRow: { flexDirection: 'row', marginHorizontal: 20, gap: 12, marginBottom: 16 },
    statCard: { flex: 1, backgroundColor: t.bg.card, borderRadius: 16, padding: 16, alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 22, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 4 },
    inputCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 12 },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: fonts.semibold, marginBottom: 8 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15 },
    descInput: { minHeight: 100, textAlignVertical: 'top' },
    categorySelect: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    catOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: t.border },
    catOptionActive: { borderColor: t.accent.blue, backgroundColor: t.accent.blue + '20' },
    catOptionText: { color: t.text.muted, fontSize: 13, fontWeight: fonts.semibold },
    catOptionTextActive: { color: t.accent.blue },
    submitBtn: { backgroundColor: t.accent.blue, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginHorizontal: 20, marginTop: 24, marginBottom: 24 },
    submitBtnText: { color: '#fff', fontSize: 17, fontWeight: fonts.bold },
    contributeTypeRow: { flexDirection: 'row', gap: 8, marginHorizontal: 20, marginBottom: 12 },
    typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: t.border },
    typeBtnActive: { borderColor: t.accent.blue, backgroundColor: t.accent.blue + '15' },
    typeBtnText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.bold },
    typeBtnTextActive: { color: t.accent.blue },
    detailHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
    backBtn: { color: t.accent.blue, fontSize: 16 },
    detailTitle: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy, marginHorizontal: 20 },
    detailDesc: { color: t.text.secondary, fontSize: 14, lineHeight: 22, marginHorizontal: 20, marginTop: 12 },
    detailLead: { color: t.text.muted, fontSize: 12, marginHorizontal: 20, marginTop: 8 },
    hashText: { color: t.text.muted, fontSize: 11, fontFamily: 'monospace', marginTop: 4 },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40 },
    eOTKBadge: { backgroundColor: '#e91e63' + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    eOTKText: { color: '#e91e63', fontSize: 12, fontWeight: fonts.bold },
  }), [t]);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    if (demoMode) {
      setProjects(DEMO_PROJECTS);
      setContributions(DEMO_CONTRIBUTIONS);
      setPublished(DEMO_PUBLISHED);
      setLoading(false);
      return;
    }
    // Live fetch would go here
    setProjects([]);
    setContributions([]);
    setPublished([]);
    setLoading(false);
  }, [demoMode]);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  const filteredProjects = useMemo(() => {
    if (filterCategory === 'all') return projects;
    return projects.filter((p) => p.category === filterCategory);
  }, [projects, filterCategory]);

  const handleStartProject = useCallback(async () => {
    if (!newTitle.trim() || !newDescription.trim()) {
      Alert.alert('Required', 'Enter title and description.');
      return;
    }
    setLoading(true);
    if (demoMode) {
      await new Promise((r) => setTimeout(r, 1200));
      const newProject: ResearchProject = {
        id: `rp-${Date.now()}`,
        title: newTitle.trim(),
        description: newDescription.trim(),
        category: newCategory,
        status: 'active',
        contributors: 1,
        dataPoints: 0,
        eOTKPool: 0,
        lead: 'you',
        createdAt: new Date().toISOString().split('T')[0],
      };
      setProjects([newProject, ...projects]);
      Alert.alert('Project Created', 'Your research project is now live. Others can contribute.');
      setNewTitle('');
      setNewDescription('');
      setNewDataNeeds('');
      setActiveTab('projects');
    }
    setLoading(false);
  }, [demoMode, newTitle, newDescription, newCategory, projects]);

  const handleContribute = useCallback(async (project: ResearchProject) => {
    if (!contributeNote.trim()) {
      Alert.alert('Required', 'Describe your contribution.');
      return;
    }
    setLoading(true);
    if (demoMode) {
      await new Promise((r) => setTimeout(r, 1000));
      const newContrib: Contribution = {
        id: `c-${Date.now()}`,
        projectId: project.id,
        projectTitle: project.title,
        type: contributeType,
        description: contributeNote.trim(),
        eOTKEarned: contributeType === 'peer_review' ? 300 : contributeType === 'analysis' ? 200 : 100,
        date: new Date().toISOString().split('T')[0],
        status: 'pending',
      };
      setContributions([newContrib, ...contributions]);
      Alert.alert('Contribution Submitted', `Pending review. Estimated reward: ${newContrib.eOTKEarned} eOTK`);
      setContributeNote('');
      setSelectedProject(null);
    }
    setLoading(false);
  }, [demoMode, contributeType, contributeNote, contributions]);

  const renderTab = (key: TabKey, label: string) => (
    <TouchableOpacity
      key={key}
      style={[s.tab, activeTab === key && s.tabActive]}
      onPress={() => { setActiveTab(key); setSelectedProject(null); }}
    >
      <Text style={[s.tabText, activeTab === key && s.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderCategoryFilter = () => (
    <View style={s.filterRow}>
      {(['all', 'health', 'agriculture', 'education', 'environment', 'technology'] as const).map((cat) => (
        <TouchableOpacity
          key={cat}
          style={[s.filterChip, filterCategory === cat && s.filterChipActive]}
          onPress={() => setFilterCategory(cat)}
        >
          <Text style={[s.filterChipText, filterCategory === cat && s.filterChipTextActive]}>
            {cat === 'all' ? 'All' : `${CATEGORY_ICONS[cat]} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderProjectDetail = () => {
    if (!selectedProject) return null;
    return (
      <ScrollView>
        <View style={s.detailHeader}>
          <TouchableOpacity onPress={() => setSelectedProject(null)}>
            <Text style={s.backBtn}>{'\u2190'} Back</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.detailTitle}>{selectedProject.title}</Text>
        <View style={[s.categoryBadge, { backgroundColor: CATEGORY_COLORS[selectedProject.category], marginLeft: 20, marginTop: 8 }]}>
          <Text style={s.categoryText}>{CATEGORY_ICONS[selectedProject.category]} {selectedProject.category}</Text>
        </View>
        <Text style={s.detailDesc}>{selectedProject.description}</Text>
        <Text style={s.detailLead}>Lead: {selectedProject.lead}</Text>

        <View style={[s.statsRow, { marginTop: 20 }]}>
          <View style={s.statCard}>
            <Text style={s.statValue}>{selectedProject.contributors}</Text>
            <Text style={s.statLabel}>Contributors</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statValue}>{selectedProject.dataPoints.toLocaleString()}</Text>
            <Text style={s.statLabel}>Data Points</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statValue}>{selectedProject.eOTKPool.toLocaleString()}</Text>
            <Text style={s.statLabel}>eOTK Pool</Text>
          </View>
        </View>

        <View style={[s.badge, { backgroundColor: STATUS_COLORS[selectedProject.status], marginLeft: 20 }]}>
          <Text style={s.badgeText}>{selectedProject.status.replace('_', ' ')}</Text>
        </View>

        {selectedProject.status === 'active' && (
          <>
            <Text style={s.section}>Contribute to This Project</Text>
            <View style={s.contributeTypeRow}>
              {(['data', 'analysis', 'peer_review'] as const).map((ct) => (
                <TouchableOpacity
                  key={ct}
                  style={[s.typeBtn, contributeType === ct && s.typeBtnActive]}
                  onPress={() => setContributeType(ct)}
                >
                  <Text style={[s.typeBtnText, contributeType === ct && s.typeBtnTextActive]}>
                    {ct === 'peer_review' ? 'Peer Review' : ct.charAt(0).toUpperCase() + ct.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.inputCard}>
              <Text style={s.inputLabel}>Describe your contribution</Text>
              <TextInput
                style={[s.input, s.descInput]}
                value={contributeNote}
                onChangeText={setContributeNote}
                placeholder="What data, analysis, or review are you submitting?"
                placeholderTextColor={t.text.muted}
                multiline
              />
            </View>
            <TouchableOpacity
              style={[s.submitBtn, loading && { opacity: 0.5 }]}
              onPress={() => handleContribute(selectedProject)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.submitBtnText}>Submit Contribution</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    );
  };

  const renderProjects = () => (
    <ScrollView>
      <View style={s.heroCard}>
        <Text style={s.heroTitle}>Community Research</Text>
        <Text style={s.heroSubtitle}>
          Collaborate on open-access research. Contribute data, analysis, or peer review to earn eOTK.
        </Text>
      </View>

      {renderCategoryFilter()}

      <Text style={s.section}>Active Projects ({filteredProjects.length})</Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} color={t.accent.blue} />
      ) : filteredProjects.length === 0 ? (
        <Text style={s.emptyText}>No projects found</Text>
      ) : (
        filteredProjects.map((project) => (
          <TouchableOpacity
            key={project.id}
            style={s.card}
            onPress={() => setSelectedProject(project)}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Text style={[s.cardTitle, { flex: 1 }]}>{project.title}</Text>
              <View style={[s.categoryBadge, { backgroundColor: CATEGORY_COLORS[project.category] }]}>
                <Text style={s.categoryText}>{CATEGORY_ICONS[project.category]}</Text>
              </View>
            </View>
            <Text style={s.cardDesc} numberOfLines={2}>{project.description}</Text>
            <View style={s.cardMeta}>
              <View style={s.metaItem}>
                <Text style={s.metaLabel}>Contributors</Text>
                <Text style={s.metaValue}>{project.contributors}</Text>
              </View>
              <View style={s.metaItem}>
                <Text style={s.metaLabel}>Data pts</Text>
                <Text style={s.metaValue}>{project.dataPoints.toLocaleString()}</Text>
              </View>
              <View style={s.eOTKBadge}>
                <Text style={s.eOTKText}>{project.eOTKPool.toLocaleString()} eOTK</Text>
              </View>
            </View>
            <View style={[s.badge, { backgroundColor: STATUS_COLORS[project.status] }]}>
              <Text style={s.badgeText}>{project.status.replace('_', ' ')}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );

  const renderContributions = () => (
    <ScrollView>
      <Text style={s.section}>My Contributions ({contributions.length})</Text>

      {contributions.length === 0 ? (
        <Text style={s.emptyText}>No contributions yet. Browse projects to get started.</Text>
      ) : (
        contributions.map((c) => (
          <View key={c.id} style={s.card}>
            <Text style={s.cardTitle}>{c.projectTitle}</Text>
            <Text style={s.cardDesc}>{c.description}</Text>
            <View style={s.cardMeta}>
              <View style={[s.badge, { backgroundColor: STATUS_COLORS[c.status], marginTop: 0 }]}>
                <Text style={s.badgeText}>{c.status}</Text>
              </View>
              <View style={s.metaItem}>
                <Text style={s.metaLabel}>Type</Text>
                <Text style={s.metaValue}>{c.type === 'peer_review' ? 'Peer Review' : c.type}</Text>
              </View>
              <View style={s.eOTKBadge}>
                <Text style={s.eOTKText}>+{c.eOTKEarned} eOTK</Text>
              </View>
            </View>
            <Text style={[s.metaLabel, { marginTop: 8 }]}>{c.date}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderPublished = () => (
    <ScrollView>
      <Text style={s.section}>Published Results ({published.length})</Text>

      {published.length === 0 ? (
        <Text style={s.emptyText}>No published results yet.</Text>
      ) : (
        published.map((pub) => (
          <View key={pub.id} style={s.card}>
            <Text style={s.cardTitle}>{pub.title}</Text>
            <View style={[s.categoryBadge, { backgroundColor: CATEGORY_COLORS[pub.category], marginTop: 8 }]}>
              <Text style={s.categoryText}>{CATEGORY_ICONS[pub.category]} {pub.category}</Text>
            </View>
            <View style={s.cardMeta}>
              <View style={s.metaItem}>
                <Text style={s.metaLabel}>Authors</Text>
                <Text style={s.metaValue}>{pub.authors}</Text>
              </View>
              <View style={s.metaItem}>
                <Text style={s.metaLabel}>Data pts</Text>
                <Text style={s.metaValue}>{pub.dataPoints.toLocaleString()}</Text>
              </View>
              <View style={s.metaItem}>
                <Text style={s.metaLabel}>Citations</Text>
                <Text style={s.metaValue}>{pub.citations}</Text>
              </View>
            </View>
            <Text style={s.hashText}>On-chain hash: {pub.hashOnChain}</Text>
            <Text style={[s.metaLabel, { marginTop: 4 }]}>Published: {pub.publishedDate}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderStartProject = () => (
    <ScrollView>
      <View style={s.heroCard}>
        <Text style={s.heroTitle}>Start a Research Project</Text>
        <Text style={s.heroSubtitle}>
          Define your research goals and invite the community to contribute data, analysis, and peer review.
        </Text>
      </View>

      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Project Title</Text>
        <TextInput
          style={s.input}
          value={newTitle}
          onChangeText={setNewTitle}
          placeholder="e.g., Soil Health in Urban Gardens"
          placeholderTextColor={t.text.muted}
        />
      </View>

      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Description</Text>
        <TextInput
          style={[s.input, s.descInput]}
          value={newDescription}
          onChangeText={setNewDescription}
          placeholder="What are you researching and why?"
          placeholderTextColor={t.text.muted}
          multiline
        />
      </View>

      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Category</Text>
        <View style={s.categorySelect}>
          {(['health', 'agriculture', 'education', 'environment', 'technology'] as ProjectCategory[]).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[s.catOption, newCategory === cat && s.catOptionActive]}
              onPress={() => setNewCategory(cat)}
            >
              <Text style={[s.catOptionText, newCategory === cat && s.catOptionTextActive]}>
                {CATEGORY_ICONS[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Data Needs (optional)</Text>
        <TextInput
          style={[s.input, s.descInput]}
          value={newDataNeeds}
          onChangeText={setNewDataNeeds}
          placeholder="What kind of data are you looking for?"
          placeholderTextColor={t.text.muted}
          multiline
        />
      </View>

      <TouchableOpacity
        style={[s.submitBtn, loading && { opacity: 0.5 }]}
        onPress={handleStartProject}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.submitBtnText}>Create Research Project</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  const renderContent = () => {
    if (selectedProject && activeTab === 'projects') return renderProjectDetail();
    switch (activeTab) {
      case 'projects': return renderProjects();
      case 'contribute': return renderContributions();
      case 'published': return renderPublished();
      case 'start': return renderStartProject();
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Research</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={s.tabRow}>
        {renderTab('projects', 'Projects')}
        {renderTab('contribute', 'My Work')}
        {renderTab('published', 'Published')}
        {renderTab('start', 'Start New')}
      </View>

      {renderContent()}
    </SafeAreaView>
  );
}
