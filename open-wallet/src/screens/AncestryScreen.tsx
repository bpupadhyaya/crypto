/**
 * Ancestry Screen — Deep genealogy tracking and ancestry exploration.
 *
 * Art I (nOTK) — Document your family tree, heritage origins,
 * migration paths, family milestones, and ancestral stories.
 * Earn nOTK for preserving family history.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Modal, TextInput,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// --- Types ---

type Relationship =
  | 'self' | 'parent' | 'grandparent' | 'great-grandparent'
  | 'sibling' | 'child' | 'spouse' | 'uncle/aunt' | 'cousin';

interface Ancestor {
  id: string;
  name: string;
  relationship: Relationship;
  generation: number;   // 0 = self, 1 = parents, 2 = grandparents, 3 = great-grandparents
  birthYear?: number;
  deathYear?: number;
  region: string;       // origin region
  migrationPath?: string[];  // regions migrated through
  parentId?: string;    // link to parent ancestor
  stories: string[];    // IDs of linked stories
}

interface FamilyStory {
  id: string;
  ancestorId: string;
  title: string;
  content: string;
  era: string;
  addedAt: number;
}

interface FamilyMilestone {
  id: string;
  title: string;
  year: number;
  description: string;
  ancestorId?: string;
  type: 'achievement' | 'tradition' | 'migration' | 'celebration';
}

interface HeritageRegion {
  region: string;
  percentage: number;  // self-reported heritage percentage
  notes: string;
}

type TabKey = 'tree' | 'add' | 'stories' | 'heritage';

const GENERATION_LABELS: Record<number, string> = {
  0: 'You',
  1: 'Parents',
  2: 'Grandparents',
  3: 'Great-Grandparents',
};

const GENERATION_ICONS: Record<number, string> = {
  0: '\u{1F9D1}',   // person
  1: '\u{1F468}',   // adult
  2: '\u{1F9D3}',   // older person
  3: '\u{1F3DB}',   // classical building (ancestors)
};

const MILESTONE_ICONS: Record<string, string> = {
  achievement: '\u{1F3C6}',  // trophy
  tradition: '\u{1F3AD}',    // performing arts
  migration: '\u{1F30D}',    // globe
  celebration: '\u{1F389}',  // party popper
};

const RELATIONSHIP_COLORS: Record<string, string> = {
  self: '#6366f1',
  parent: '#10b981',
  grandparent: '#f59e0b',
  'great-grandparent': '#ef4444',
  sibling: '#8b5cf6',
  child: '#ec4899',
  spouse: '#14b8a6',
  'uncle/aunt': '#64748b',
  cousin: '#a855f7',
};

// --- Demo data ---

const DEMO_ANCESTORS: Ancestor[] = [
  {
    id: 'anc_001', name: 'You', relationship: 'self', generation: 0,
    birthYear: 1990, region: 'New York, USA',
    migrationPath: ['New York, USA'], stories: [], parentId: 'anc_002',
  },
  {
    id: 'anc_002', name: 'Raj Sharma', relationship: 'parent', generation: 1,
    birthYear: 1962, region: 'Mumbai, India',
    migrationPath: ['Mumbai, India', 'London, UK', 'New York, USA'],
    stories: ['story_001'], parentId: 'anc_004',
  },
  {
    id: 'anc_003', name: 'Maria Garcia-Sharma', relationship: 'parent', generation: 1,
    birthYear: 1965, region: 'Mexico City, Mexico',
    migrationPath: ['Mexico City, Mexico', 'Los Angeles, USA', 'New York, USA'],
    stories: [], parentId: 'anc_006',
  },
  {
    id: 'anc_004', name: 'Vikram Sharma', relationship: 'grandparent', generation: 2,
    birthYear: 1935, deathYear: 2010, region: 'Jaipur, India',
    migrationPath: ['Jaipur, India', 'Mumbai, India'],
    stories: ['story_002'], parentId: 'anc_008',
  },
  {
    id: 'anc_005', name: 'Priya Sharma', relationship: 'grandparent', generation: 2,
    birthYear: 1938, deathYear: 2018, region: 'Delhi, India',
    migrationPath: ['Delhi, India', 'Mumbai, India'],
    stories: [], parentId: undefined,
  },
  {
    id: 'anc_006', name: 'Carlos Garcia', relationship: 'grandparent', generation: 2,
    birthYear: 1940, deathYear: 2015, region: 'Oaxaca, Mexico',
    migrationPath: ['Oaxaca, Mexico', 'Mexico City, Mexico'],
    stories: [], parentId: undefined,
  },
  {
    id: 'anc_007', name: 'Elena Reyes-Garcia', relationship: 'grandparent', generation: 2,
    birthYear: 1942, region: 'Guadalajara, Mexico',
    migrationPath: ['Guadalajara, Mexico', 'Mexico City, Mexico'],
    stories: [], parentId: undefined,
  },
  {
    id: 'anc_008', name: 'Hari Sharma', relationship: 'great-grandparent', generation: 3,
    birthYear: 1908, deathYear: 1985, region: 'Udaipur, India',
    migrationPath: ['Udaipur, India', 'Jaipur, India'],
    stories: [], parentId: undefined,
  },
];

const DEMO_STORIES: FamilyStory[] = [
  {
    id: 'story_001', ancestorId: 'anc_002',
    title: 'The Journey to London',
    content: 'In 1988, Raj left Mumbai with just a suitcase and a scholarship letter. He spent three years in London studying engineering, working night shifts at a corner shop. He always said those years taught him that home is wherever you build something meaningful.',
    era: '1988-1991', addedAt: Date.now() - 86400000,
  },
  {
    id: 'story_002', ancestorId: 'anc_004',
    title: 'The Spice Merchant\'s Legacy',
    content: 'Vikram inherited a small spice trading business from his father in Jaipur. He transformed it from a single stall in the bazaar to a respected wholesale operation that supplied restaurants across Rajasthan. He believed that honest weights and genuine quality were the only business strategy needed.',
    era: '1960-1995', addedAt: Date.now() - 172800000,
  },
];

const DEMO_MILESTONES: FamilyMilestone[] = [
  {
    id: 'ms_001', title: 'First in Family to Attend University',
    year: 1985, description: 'Raj became the first person in the Sharma family to attend university, breaking a generational barrier.',
    ancestorId: 'anc_002', type: 'achievement',
  },
  {
    id: 'ms_002', title: 'Annual Diwali Gathering',
    year: 1970, description: 'The Sharma family began a tradition of hosting the entire neighborhood for Diwali celebrations. This tradition continues today.',
    ancestorId: 'anc_004', type: 'tradition',
  },
  {
    id: 'ms_003', title: 'Garcia Family Crosses the Border',
    year: 1955, description: 'Carlos Garcia moved from Oaxaca to Mexico City seeking better opportunities, beginning a new chapter for the family.',
    ancestorId: 'anc_006', type: 'migration',
  },
];

const DEMO_HERITAGE: HeritageRegion[] = [
  { region: 'Rajasthan, India', percentage: 30, notes: 'Paternal grandfather\'s lineage, Jaipur and Udaipur region' },
  { region: 'Delhi/Punjab, India', percentage: 20, notes: 'Paternal grandmother\'s roots in northern India' },
  { region: 'Oaxaca, Mexico', percentage: 25, notes: 'Maternal grandfather, indigenous Zapotec heritage' },
  { region: 'Jalisco, Mexico', percentage: 20, notes: 'Maternal grandmother, from Guadalajara' },
  { region: 'United States', percentage: 5, notes: 'Born and raised, first generation American' },
];

// nOTK tracking
const NOTK_PER_ANCESTOR = 15;
const NOTK_PER_STORY = 25;
const NOTK_PER_MILESTONE = 10;
const NOTK_PER_HERITAGE = 5;

// --- Component ---

interface Props {
  onClose: () => void;
}

export function AncestryScreen({ onClose }: Props) {
  const t = useTheme();
  const demoMode = useWalletStore(s => s.demoMode);
  const [tab, setTab] = useState<TabKey>('tree');
  const [ancestors, setAncestors] = useState<Ancestor[]>(DEMO_ANCESTORS);
  const [stories, setStories] = useState<FamilyStory[]>(DEMO_STORIES);
  const [milestones] = useState<FamilyMilestone[]>(DEMO_MILESTONES);
  const [heritage] = useState<HeritageRegion[]>(DEMO_HERITAGE);
  const [selectedAncestor, setSelectedAncestor] = useState<Ancestor | null>(null);
  const [selectedStory, setSelectedStory] = useState<FamilyStory | null>(null);

  // Add ancestor form
  const [newName, setNewName] = useState('');
  const [newRelationship, setNewRelationship] = useState<Relationship>('parent');
  const [newBirthYear, setNewBirthYear] = useState('');
  const [newDeathYear, setNewDeathYear] = useState('');
  const [newRegion, setNewRegion] = useState('');
  const [newStoryTitle, setNewStoryTitle] = useState('');
  const [newStoryContent, setNewStoryContent] = useState('');

  const generationMap = useMemo(() => {
    const map: Record<number, Ancestor[]> = {};
    for (const anc of ancestors) {
      if (!map[anc.generation]) map[anc.generation] = [];
      map[anc.generation].push(anc);
    }
    return Object.entries(map)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([gen, members]) => ({ generation: Number(gen), members }));
  }, [ancestors]);

  const notkEarned = useMemo(() => {
    const fromAncestors = ancestors.length * NOTK_PER_ANCESTOR;
    const fromStories = stories.length * NOTK_PER_STORY;
    const fromMilestones = milestones.length * NOTK_PER_MILESTONE;
    const fromHeritage = heritage.length * NOTK_PER_HERITAGE;
    return fromAncestors + fromStories + fromMilestones + fromHeritage;
  }, [ancestors, stories, milestones, heritage]);

  const stats = useMemo(() => ({
    totalMembers: ancestors.length,
    generations: generationMap.length,
    stories: stories.length,
    milestones: milestones.length,
    regions: heritage.length,
  }), [ancestors, generationMap, stories, milestones, heritage]);

  function generationForRelationship(rel: Relationship): number {
    switch (rel) {
      case 'self': return 0;
      case 'child': return -1;
      case 'spouse': case 'sibling': return 0;
      case 'parent': return 1;
      case 'uncle/aunt': case 'cousin': return 1;
      case 'grandparent': return 2;
      case 'great-grandparent': return 3;
      default: return 0;
    }
  }

  function addAncestor() {
    if (!newName.trim()) return;
    const anc: Ancestor = {
      id: `anc_new_${Date.now()}`,
      name: newName.trim(),
      relationship: newRelationship,
      generation: generationForRelationship(newRelationship),
      birthYear: newBirthYear ? parseInt(newBirthYear, 10) : undefined,
      deathYear: newDeathYear ? parseInt(newDeathYear, 10) : undefined,
      region: newRegion.trim() || 'Unknown',
      stories: [],
    };
    setAncestors(prev => [...prev, anc]);
    setNewName('');
    setNewBirthYear('');
    setNewDeathYear('');
    setNewRegion('');
    setTab('tree');
  }

  function addStory() {
    if (!newStoryTitle.trim() || !newStoryContent.trim()) return;
    const story: FamilyStory = {
      id: `story_new_${Date.now()}`,
      ancestorId: selectedAncestor?.id || 'anc_001',
      title: newStoryTitle.trim(),
      content: newStoryContent.trim(),
      era: 'Present',
      addedAt: Date.now(),
    };
    setStories(prev => [...prev, story]);
    setNewStoryTitle('');
    setNewStoryContent('');
    setSelectedAncestor(null);
  }

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    title: { fontSize: 20, fontWeight: '700', color: t.text.primary },
    closeBtn: {
      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
      backgroundColor: t.bg.card,
    },
    closeTxt: { color: t.text.secondary, fontSize: 14, fontWeight: '600' },

    tabs: {
      flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 8,
    },
    tab: {
      flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center',
      backgroundColor: t.bg.card,
    },
    tabActive: { backgroundColor: t.accent.green },
    tabTxt: { fontSize: 13, fontWeight: '600', color: t.text.secondary },
    tabTxtActive: { color: '#fff' },

    notkBanner: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      paddingVertical: 8, backgroundColor: t.accent + '12', gap: 8,
    },
    notkTxt: { fontSize: 13, fontWeight: '700', color: t.accent.green },
    notkSub: { fontSize: 11, color: t.text.secondary },

    statsRow: {
      flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8,
    },
    statBox: {
      flex: 1, padding: 10, borderRadius: 10, backgroundColor: t.bg.card,
      alignItems: 'center',
    },
    statVal: { fontSize: 18, fontWeight: '700', color: t.accent.green },
    statLabel: { fontSize: 10, color: t.text.secondary, marginTop: 2, textAlign: 'center' },

    scroll: { flex: 1 },

    // Tree view
    genSection: { marginBottom: 16 },
    genHeader: {
      flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
      paddingTop: 14, paddingBottom: 6, gap: 8,
    },
    genIcon: { fontSize: 20 },
    genLabel: { fontSize: 14, fontWeight: '700', color: t.text.secondary },
    genLine: { height: 1, flex: 1, backgroundColor: t.border, marginLeft: 8 },

    memberCard: {
      marginHorizontal: 16, marginBottom: 8, padding: 14, borderRadius: 12,
      backgroundColor: t.bg.card, borderLeftWidth: 4, flexDirection: 'row',
    },
    memberInfo: { flex: 1 },
    memberName: { fontSize: 15, fontWeight: '600', color: t.text.primary },
    memberRel: { fontSize: 12, color: t.text.secondary, marginTop: 2 },
    memberDates: { fontSize: 11, color: t.text.secondary, marginTop: 2 },
    memberRegion: { fontSize: 12, color: t.accent.green, marginTop: 4 },
    memberRight: { alignItems: 'flex-end', justifyContent: 'center' },
    migBadge: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: t.bg.primary,
      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    },
    migTxt: { fontSize: 10, color: t.text.secondary, marginLeft: 4 },
    storyBadge: {
      flexDirection: 'row', alignItems: 'center', marginTop: 4,
      backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    },
    storyBadgeTxt: { fontSize: 10, color: '#92400e', marginLeft: 4 },

    connector: {
      width: 2, height: 20, backgroundColor: t.border, marginLeft: 32,
    },

    // Stories
    storyCard: {
      marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 12,
      backgroundColor: t.bg.card, borderLeftWidth: 4, borderLeftColor: '#f59e0b',
    },
    storyTitle: { fontSize: 15, fontWeight: '600', color: t.text.primary },
    storyEra: { fontSize: 12, color: t.text.secondary, marginTop: 2 },
    storyAncestor: { fontSize: 12, color: t.accent.green, marginTop: 2 },
    storyContent: { fontSize: 14, color: t.text.primary, lineHeight: 21, marginTop: 8 },

    // Heritage
    heritageCard: {
      marginHorizontal: 16, marginBottom: 10, padding: 14, borderRadius: 12,
      backgroundColor: t.bg.card,
    },
    heritageRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    heritageRegion: { fontSize: 15, fontWeight: '600', color: t.text.primary, flex: 1 },
    heritagePct: { fontSize: 16, fontWeight: '700', color: t.accent.green },
    heritageBar: {
      height: 6, borderRadius: 3, backgroundColor: t.border, marginBottom: 6,
    },
    heritageFill: { height: 6, borderRadius: 3, backgroundColor: t.accent.green },
    heritageNotes: { fontSize: 12, color: t.text.secondary },

    // Milestones
    milestoneSection: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
    milestoneSectionTitle: { fontSize: 15, fontWeight: '700', color: t.text.primary, marginBottom: 8 },
    milestoneCard: {
      marginHorizontal: 16, marginBottom: 8, padding: 12, borderRadius: 10,
      backgroundColor: t.bg.card, flexDirection: 'row', gap: 10,
    },
    msIcon: { fontSize: 22, marginTop: 2 },
    msInfo: { flex: 1 },
    msTitle: { fontSize: 14, fontWeight: '600', color: t.text.primary },
    msYear: { fontSize: 12, color: t.accent.green, marginTop: 2 },
    msDesc: { fontSize: 12, color: t.text.secondary, marginTop: 4, lineHeight: 18 },

    // Detail modal
    modalOverlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center', padding: 20,
    },
    modalCard: {
      backgroundColor: t.bg.primary, borderRadius: 16, padding: 20,
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: t.text.primary, marginBottom: 4 },
    modalSub: { fontSize: 13, color: t.text.secondary, marginBottom: 12 },
    modalBody: { fontSize: 14, color: t.text.primary, lineHeight: 21, marginBottom: 12 },
    modalInfo: { fontSize: 13, color: t.text.secondary, marginBottom: 4 },
    modalClose: {
      marginTop: 12, paddingVertical: 10, borderRadius: 10,
      backgroundColor: t.bg.card, alignItems: 'center',
    },
    modalCloseTxt: { fontWeight: '600', color: t.text.secondary, fontSize: 14 },

    // Form
    formSection: { paddingHorizontal: 16, paddingTop: 12 },
    formLabel: { fontSize: 13, fontWeight: '600', color: t.text.secondary, marginBottom: 4, marginTop: 12 },
    formInput: {
      borderWidth: 1, borderColor: t.border, borderRadius: 10, padding: 10,
      fontSize: 14, color: t.text.primary, backgroundColor: t.bg.card,
    },
    formTextArea: { minHeight: 80, textAlignVertical: 'top' },
    relPicker: {
      flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4,
    },
    relOption: {
      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
      borderWidth: 1, borderColor: t.border,
    },
    relOptionActive: { borderWidth: 2 },
    relOptionTxt: { fontSize: 12, fontWeight: '600' },
    addBtn: {
      marginTop: 20, marginBottom: 20, paddingVertical: 14, borderRadius: 12,
      backgroundColor: t.accent.green, alignItems: 'center',
    },
    addBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },

    divider: { height: 1, backgroundColor: t.border, marginHorizontal: 16, marginVertical: 16 },

    empty: { alignItems: 'center', paddingTop: 60 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyTxt: { fontSize: 15, color: t.text.secondary },

    demoBar: {
      backgroundColor: '#fef3c7', paddingVertical: 6, alignItems: 'center',
    },
    demoTxt: { fontSize: 11, color: '#92400e', fontWeight: '600' },
  }), [t]);

  // --- Render helpers ---

  function renderTabs() {
    const tabItems: { key: TabKey; label: string }[] = [
      { key: 'tree', label: 'Family Tree' },
      { key: 'add', label: '+ Add' },
      { key: 'stories', label: 'Stories' },
      { key: 'heritage', label: 'Heritage' },
    ];
    return (
      <View style={styles.tabs}>
        {tabItems.map(tb => (
          <TouchableOpacity
            key={tb.key}
            style={[styles.tab, tab === tb.key && styles.tabActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={[styles.tabTxt, tab === tb.key && styles.tabTxtActive]}>
              {tb.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  function renderNotkBanner() {
    return (
      <View style={styles.notkBanner}>
        <Text style={styles.notkTxt}>{'\u{1F49B}'} {notkEarned.toLocaleString()} nOTK earned</Text>
        <Text style={styles.notkSub}>for documenting family history</Text>
      </View>
    );
  }

  function renderStats() {
    return (
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{stats.totalMembers}</Text>
          <Text style={styles.statLabel}>Members</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{stats.generations}</Text>
          <Text style={styles.statLabel}>Generations</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{stats.stories}</Text>
          <Text style={styles.statLabel}>Stories</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{stats.regions}</Text>
          <Text style={styles.statLabel}>Regions</Text>
        </View>
      </View>
    );
  }

  function renderTree() {
    return (
      <ScrollView style={styles.scroll}>
        {renderStats()}
        {generationMap.map(({ generation, members }, gi) => (
          <View key={generation} style={styles.genSection}>
            <View style={styles.genHeader}>
              <Text style={styles.genIcon}>{GENERATION_ICONS[generation] || '\u{1F3DB}'}</Text>
              <Text style={styles.genLabel}>
                {GENERATION_LABELS[generation] || `Generation ${generation}`}
              </Text>
              <View style={styles.genLine} />
            </View>
            {gi > 0 && <View style={styles.connector} />}
            {members.map(anc => {
              const relColor = RELATIONSHIP_COLORS[anc.relationship] || t.text.secondary;
              return (
                <TouchableOpacity
                  key={anc.id}
                  style={[styles.memberCard, { borderLeftColor: relColor }]}
                  onPress={() => setSelectedAncestor(anc)}
                >
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{anc.name}</Text>
                    <Text style={styles.memberRel}>
                      {anc.relationship.charAt(0).toUpperCase() + anc.relationship.slice(1)}
                    </Text>
                    <Text style={styles.memberDates}>
                      {anc.birthYear ? `b. ${anc.birthYear}` : ''}
                      {anc.deathYear ? ` \u2014 d. ${anc.deathYear}` : ''}
                    </Text>
                    <Text style={styles.memberRegion}>
                      {'\u{1F4CD}'} {anc.region}
                    </Text>
                  </View>
                  <View style={styles.memberRight}>
                    {anc.migrationPath && anc.migrationPath.length > 1 && (
                      <View style={styles.migBadge}>
                        <Text style={{ fontSize: 10 }}>{'\u{1F30D}'}</Text>
                        <Text style={styles.migTxt}>{anc.migrationPath.length} places</Text>
                      </View>
                    )}
                    {anc.stories.length > 0 && (
                      <View style={styles.storyBadge}>
                        <Text style={{ fontSize: 10 }}>{'\u{1F4D6}'}</Text>
                        <Text style={styles.storyBadgeTxt}>{anc.stories.length} stories</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  function renderStories() {
    return (
      <ScrollView style={styles.scroll}>
        <View style={styles.milestoneSection}>
          <Text style={styles.milestoneSectionTitle}>
            {'\u{1F4D6}'} Family Stories ({stories.length})
          </Text>
        </View>
        {stories.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>{'\u{1F4D6}'}</Text>
            <Text style={styles.emptyTxt}>No stories yet. Add one to preserve family memory.</Text>
          </View>
        ) : (
          stories.map(story => {
            const ancestor = ancestors.find(a => a.id === story.ancestorId);
            return (
              <TouchableOpacity
                key={story.id}
                style={styles.storyCard}
                onPress={() => setSelectedStory(story)}
              >
                <Text style={styles.storyTitle}>{story.title}</Text>
                <Text style={styles.storyEra}>Era: {story.era}</Text>
                {ancestor && (
                  <Text style={styles.storyAncestor}>
                    About: {ancestor.name} ({ancestor.relationship})
                  </Text>
                )}
                <Text style={styles.storyContent} numberOfLines={3}>
                  {story.content}
                </Text>
              </TouchableOpacity>
            );
          })
        )}

        <View style={styles.divider} />

        <View style={styles.milestoneSection}>
          <Text style={styles.milestoneSectionTitle}>
            {'\u{1F3C6}'} Family Milestones ({milestones.length})
          </Text>
        </View>
        {milestones.map(ms => (
          <View key={ms.id} style={styles.milestoneCard}>
            <Text style={styles.msIcon}>{MILESTONE_ICONS[ms.type]}</Text>
            <View style={styles.msInfo}>
              <Text style={styles.msTitle}>{ms.title}</Text>
              <Text style={styles.msYear}>{ms.year}</Text>
              <Text style={styles.msDesc}>{ms.description}</Text>
            </View>
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  function renderHeritage() {
    return (
      <ScrollView style={styles.scroll}>
        <View style={styles.milestoneSection}>
          <Text style={styles.milestoneSectionTitle}>
            {'\u{1F30D}'} Heritage Regions (Self-Reported)
          </Text>
          <Text style={{ fontSize: 12, color: t.text.secondary, marginBottom: 12 }}>
            Based on family knowledge and oral history, not genetic testing.
          </Text>
        </View>
        {heritage.map((hr, i) => (
          <View key={i} style={styles.heritageCard}>
            <View style={styles.heritageRow}>
              <Text style={styles.heritageRegion}>{hr.region}</Text>
              <Text style={styles.heritagePct}>{hr.percentage}%</Text>
            </View>
            <View style={styles.heritageBar}>
              <View style={[styles.heritageFill, { width: `${hr.percentage}%` }]} />
            </View>
            <Text style={styles.heritageNotes}>{hr.notes}</Text>
          </View>
        ))}

        <View style={styles.divider} />

        <View style={styles.milestoneSection}>
          <Text style={styles.milestoneSectionTitle}>
            {'\u{1F5FA}'} Migration Paths
          </Text>
        </View>
        {ancestors
          .filter(a => a.migrationPath && a.migrationPath.length > 1)
          .map(anc => (
            <View key={anc.id} style={[styles.milestoneCard, { marginHorizontal: 16 }]}>
              <Text style={styles.msIcon}>{'\u{1F6EB}'}</Text>
              <View style={styles.msInfo}>
                <Text style={styles.msTitle}>{anc.name}</Text>
                <Text style={styles.msDesc}>
                  {anc.migrationPath!.join(' \u2192 ')}
                </Text>
              </View>
            </View>
          ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  function renderAddForm() {
    const relationships: Relationship[] = [
      'parent', 'grandparent', 'great-grandparent', 'sibling',
      'child', 'spouse', 'uncle/aunt', 'cousin',
    ];
    return (
      <ScrollView style={styles.scroll}>
        <View style={styles.formSection}>
          <Text style={[styles.title, { marginBottom: 4 }]}>Add Family Member</Text>
          <Text style={{ fontSize: 13, color: t.text.secondary }}>
            Document your ancestry and earn {NOTK_PER_ANCESTOR} nOTK per member
          </Text>

          <Text style={styles.formLabel}>Name</Text>
          <TextInput
            style={styles.formInput}
            value={newName}
            onChangeText={setNewName}
            placeholder="Full name"
            placeholderTextColor={t.text.secondary}
          />

          <Text style={styles.formLabel}>Relationship</Text>
          <View style={styles.relPicker}>
            {relationships.map(rel => {
              const active = newRelationship === rel;
              const color = RELATIONSHIP_COLORS[rel] || t.text.secondary;
              return (
                <TouchableOpacity
                  key={rel}
                  style={[
                    styles.relOption,
                    active && styles.relOptionActive,
                    active && { borderColor: color, backgroundColor: color + '18' },
                  ]}
                  onPress={() => setNewRelationship(rel)}
                >
                  <Text style={[styles.relOptionTxt, { color: active ? color : t.text.secondary }]}>
                    {rel.charAt(0).toUpperCase() + rel.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.formLabel}>Birth Year</Text>
          <TextInput
            style={styles.formInput}
            value={newBirthYear}
            onChangeText={setNewBirthYear}
            placeholder="e.g. 1950"
            placeholderTextColor={t.text.secondary}
            keyboardType="numeric"
          />

          <Text style={styles.formLabel}>Death Year (if applicable)</Text>
          <TextInput
            style={styles.formInput}
            value={newDeathYear}
            onChangeText={setNewDeathYear}
            placeholder="Leave blank if living"
            placeholderTextColor={t.text.secondary}
            keyboardType="numeric"
          />

          <Text style={styles.formLabel}>Region of Origin</Text>
          <TextInput
            style={styles.formInput}
            value={newRegion}
            onChangeText={setNewRegion}
            placeholder="e.g. Jaipur, India"
            placeholderTextColor={t.text.secondary}
          />

          <TouchableOpacity style={styles.addBtn} onPress={addAncestor}>
            <Text style={styles.addBtnTxt}>Add Family Member (+{NOTK_PER_ANCESTOR} nOTK)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.formSection}>
          <Text style={[styles.title, { marginBottom: 4 }]}>Add Family Story</Text>
          <Text style={{ fontSize: 13, color: t.text.secondary }}>
            Preserve oral history and earn {NOTK_PER_STORY} nOTK per story
          </Text>

          <Text style={styles.formLabel}>Story Title</Text>
          <TextInput
            style={styles.formInput}
            value={newStoryTitle}
            onChangeText={setNewStoryTitle}
            placeholder="Give your story a title"
            placeholderTextColor={t.text.secondary}
          />

          <Text style={styles.formLabel}>Story</Text>
          <TextInput
            style={[styles.formInput, styles.formTextArea]}
            value={newStoryContent}
            onChangeText={setNewStoryContent}
            placeholder="Tell the story in your own words..."
            placeholderTextColor={t.text.secondary}
            multiline
          />

          <TouchableOpacity style={styles.addBtn} onPress={addStory}>
            <Text style={styles.addBtnTxt}>Save Story (+{NOTK_PER_STORY} nOTK)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  function renderAncestorModal() {
    if (!selectedAncestor) return null;
    const relColor = RELATIONSHIP_COLORS[selectedAncestor.relationship] || t.text.secondary;
    const ancestorStories = stories.filter(s => s.ancestorId === selectedAncestor.id);
    return (
      <Modal transparent animationType="fade" visible onRequestClose={() => setSelectedAncestor(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { borderLeftWidth: 5, borderLeftColor: relColor }]}>
            <Text style={styles.modalTitle}>{selectedAncestor.name}</Text>
            <Text style={styles.modalSub}>
              {selectedAncestor.relationship.charAt(0).toUpperCase() + selectedAncestor.relationship.slice(1)}
              {' \u2022 Generation '}{selectedAncestor.generation}
            </Text>
            <Text style={styles.modalInfo}>
              {'\u{1F4CD}'} Origin: {selectedAncestor.region}
            </Text>
            {selectedAncestor.birthYear && (
              <Text style={styles.modalInfo}>
                Born: {selectedAncestor.birthYear}
                {selectedAncestor.deathYear ? ` \u2014 Died: ${selectedAncestor.deathYear}` : ' \u2014 Living'}
              </Text>
            )}
            {selectedAncestor.migrationPath && selectedAncestor.migrationPath.length > 1 && (
              <Text style={styles.modalInfo}>
                {'\u{1F30D}'} Migration: {selectedAncestor.migrationPath.join(' \u2192 ')}
              </Text>
            )}
            {ancestorStories.length > 0 && (
              <>
                <Text style={[styles.modalInfo, { fontWeight: '700', marginTop: 8 }]}>
                  Stories ({ancestorStories.length}):
                </Text>
                {ancestorStories.map(s => (
                  <Text key={s.id} style={[styles.modalInfo, { marginLeft: 8 }]}>
                    {'\u{1F4D6}'} {s.title} ({s.era})
                  </Text>
                ))}
              </>
            )}
            <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedAncestor(null)}>
              <Text style={styles.modalCloseTxt}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  function renderStoryModal() {
    if (!selectedStory) return null;
    const ancestor = ancestors.find(a => a.id === selectedStory.ancestorId);
    return (
      <Modal transparent animationType="fade" visible onRequestClose={() => setSelectedStory(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { borderLeftWidth: 5, borderLeftColor: '#f59e0b' }]}>
            <Text style={styles.modalTitle}>{'\u{1F4D6}'} {selectedStory.title}</Text>
            <Text style={styles.modalSub}>
              Era: {selectedStory.era}
              {ancestor ? ` \u2022 About: ${ancestor.name}` : ''}
            </Text>
            <Text style={styles.modalBody}>{selectedStory.content}</Text>
            <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedStory(null)}>
              <Text style={styles.modalCloseTxt}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // --- Main render ---

  return (
    <SafeAreaView style={styles.container}>
      {demoMode && (
        <View style={styles.demoBar}>
          <Text style={styles.demoTxt}>Demo Mode \u2014 Sample family data shown</Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.title}>{'\u{1F333}'} Ancestry</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeTxt}>Close</Text>
        </TouchableOpacity>
      </View>

      {renderNotkBanner()}
      {renderTabs()}

      {tab === 'tree' && renderTree()}
      {tab === 'stories' && renderStories()}
      {tab === 'heritage' && renderHeritage()}
      {tab === 'add' && renderAddForm()}

      {renderAncestorModal()}
      {renderStoryModal()}
    </SafeAreaView>
  );
}
