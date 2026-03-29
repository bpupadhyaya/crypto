/**
 * Parenting Stages Screen — Age-specific parenting guides and resources.
 *
 * Article I (nOTK): "Every stage of a child's development is sacred.
 *  The nurturing value created at each age deserves recognition
 *  and community support."
 * — Human Constitution, Article I
 *
 * Features:
 * - Parenting stages: newborn (0-3mo), infant (3-12mo), toddler (1-3yr),
 *   preschool (3-5yr), elementary (5-12yr), teen (12-18yr)
 * - Stage-specific tips (development milestones, nutrition, safety, activities)
 * - Expert resources per stage (articles, videos referenced by hash)
 * - Parent community per stage (connect with parents at same stage)
 * - nOTK earned for sharing parenting tips that help others
 * - Demo mode with sample data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// ─── Types ───

interface ParentingStage {
  key: string;
  label: string;
  ageRange: string;
  icon: string;
  color: string;
  description: string;
  milestones: string[];
}

interface ParentingTip {
  id: string;
  stageKey: string;
  category: 'development' | 'nutrition' | 'safety' | 'activities';
  title: string;
  summary: string;
  authorUID: string;
  authorName: string;
  helpfulCount: number;
  notkEarned: number;
  date: string;
}

interface CommunityPost {
  id: string;
  stageKey: string;
  authorName: string;
  authorUID: string;
  content: string;
  replies: number;
  helpful: number;
  date: string;
}

interface ExpertResource {
  id: string;
  stageKey: string;
  type: 'article' | 'video';
  title: string;
  source: string;
  contentHash: string;
  rating: number;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const STAGES: ParentingStage[] = [
  {
    key: 'newborn', label: 'Newborn', ageRange: '0-3 months', icon: 'N',
    color: '#FF6B9D', description: 'Bonding, feeding rhythms, sleep patterns',
    milestones: ['First smile', 'Head lifting', 'Tracking objects', 'Recognizing voices'],
  },
  {
    key: 'infant', label: 'Infant', ageRange: '3-12 months', icon: 'I',
    color: '#FF9500', description: 'Motor skills, first foods, sensory exploration',
    milestones: ['Sitting up', 'First solid foods', 'Babbling', 'Crawling', 'Object permanence'],
  },
  {
    key: 'toddler', label: 'Toddler', ageRange: '1-3 years', icon: 'T',
    color: '#34C759', description: 'Walking, language explosion, independence',
    milestones: ['First steps', 'Two-word phrases', 'Potty training', 'Parallel play'],
  },
  {
    key: 'preschool', label: 'Preschool', ageRange: '3-5 years', icon: 'P',
    color: '#007AFF', description: 'Social skills, pre-reading, imaginative play',
    milestones: ['Letter recognition', 'Counting to 10', 'Sharing', 'Drawing shapes'],
  },
  {
    key: 'elementary', label: 'Elementary', ageRange: '5-12 years', icon: 'E',
    color: '#AF52DE', description: 'Academic foundations, friendships, responsibilities',
    milestones: ['Reading fluency', 'Math operations', 'Team sports', 'Self-regulation'],
  },
  {
    key: 'teen', label: 'Teen', ageRange: '12-18 years', icon: 'Te',
    color: '#5856D6', description: 'Identity formation, critical thinking, preparation for life',
    milestones: ['Abstract thinking', 'Career exploration', 'Emotional independence', 'Community engagement'],
  },
];

const TIP_CATEGORIES = [
  { key: 'development', label: 'Development', icon: 'D' },
  { key: 'nutrition', label: 'Nutrition', icon: 'N' },
  { key: 'safety', label: 'Safety', icon: 'S' },
  { key: 'activities', label: 'Activities', icon: 'A' },
] as const;

// ─── Demo Data ───

const DEMO_TIPS: ParentingTip[] = [
  {
    id: 't1', stageKey: 'elementary', category: 'development',
    title: 'Building reading habits with daily 20-minute sessions',
    summary: 'Reading together for 20 minutes daily builds vocabulary faster than any program. Let the child choose the book to build intrinsic motivation.',
    authorUID: 'openchain1abc...parent_sarah', authorName: 'Sarah M.',
    helpfulCount: 142, notkEarned: 2840, date: '2026-03-27',
  },
  {
    id: 't2', stageKey: 'elementary', category: 'nutrition',
    title: 'Balanced lunchbox ideas for school-age kids',
    summary: 'Include protein, complex carbs, fruits, and healthy fats. Involve kids in meal prep to teach nutrition awareness and build responsibility.',
    authorUID: 'openchain1def...parent_raj', authorName: 'Raj P.',
    helpfulCount: 98, notkEarned: 1960, date: '2026-03-25',
  },
  {
    id: 't3', stageKey: 'elementary', category: 'safety',
    title: 'Digital safety: age-appropriate internet guidelines',
    summary: 'Set up parental controls but also teach critical thinking about online content. Regular conversations about what they see online are more effective than restrictions alone.',
    authorUID: 'openchain1ghi...parent_lisa', authorName: 'Lisa K.',
    helpfulCount: 215, notkEarned: 4300, date: '2026-03-22',
  },
  {
    id: 't4', stageKey: 'elementary', category: 'activities',
    title: 'Nature journaling: science + creativity combined',
    summary: 'Weekly nature walks with a journal encourage observation, drawing, and writing skills. Kids develop patience, curiosity, and a connection to the environment.',
    authorUID: 'openchain1jkl...parent_david', authorName: 'David W.',
    helpfulCount: 76, notkEarned: 1520, date: '2026-03-20',
  },
];

const DEMO_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 'c1', stageKey: 'elementary', authorName: 'Maria G.',
    authorUID: 'openchain1mno...parent_maria',
    content: 'My 8-year-old just started asking deep questions about fairness and justice. Any book recommendations that explore these themes at an age-appropriate level?',
    replies: 12, helpful: 34, date: '2026-03-28',
  },
  {
    id: 'c2', stageKey: 'elementary', authorName: 'James T.',
    authorUID: 'openchain1pqr...parent_james',
    content: 'We started a "family meeting" tradition every Sunday. Each kid gets to raise one topic. It has transformed how we resolve conflicts. Highly recommend!',
    replies: 8, helpful: 56, date: '2026-03-26',
  },
];

const DEMO_RESOURCES: ExpertResource[] = [
  { id: 'r1', stageKey: 'elementary', type: 'article', title: 'Growth Mindset in Elementary-Age Children', source: 'Dr. Carol Dweck', contentHash: 'Qm7f2a3b...article_growth', rating: 4.8 },
  { id: 'r2', stageKey: 'elementary', type: 'video', title: 'Teaching Emotional Intelligence: Ages 5-12', source: 'Yale Center for Emotional Intelligence', contentHash: 'Qm9c4d5e...video_eq', rating: 4.9 },
  { id: 'r3', stageKey: 'elementary', type: 'article', title: 'Nutrition for Active School-Age Kids', source: 'American Academy of Pediatrics', contentHash: 'Qm1e6f7g...article_nutrition', rating: 4.6 },
  { id: 'r4', stageKey: 'elementary', type: 'video', title: 'Fostering Independence Without Neglect', source: 'Dr. Laura Markham', contentHash: 'Qm2h8i9j...video_independence', rating: 4.7 },
];

type Tab = 'stages' | 'tips' | 'community' | 'resources';

// ─── Component ───

export function ParentingStagesScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('stages');
  const [selectedStage, setSelectedStage] = useState<string>('elementary');
  const [tipFilter, setTipFilter] = useState<string>('all');
  const demoMode = useWalletStore(s => s.demoMode);
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 4, marginBottom: 16 },
    tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: t.bg.card, alignItems: 'center' },
    tabBtnActive: { backgroundColor: t.accent.purple },
    tabLabel: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
    tabLabelActive: { color: '#fff' },
    heroCard: { backgroundColor: t.accent.purple + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    heroIcon: { fontSize: 40, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: '800', textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 20 },
    stageCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 14 },
    stageCardSelected: { borderWidth: 2, borderColor: t.accent.purple },
    stageIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    stageIconText: { color: '#fff', fontSize: 18, fontWeight: '800' },
    stageInfo: { flex: 1 },
    stageLabel: { color: t.text.primary, fontSize: 16, fontWeight: '700' },
    stageAge: { color: t.text.secondary, fontSize: 13, marginTop: 2 },
    stageDesc: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    milestonePill: { backgroundColor: t.accent.green + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginRight: 6, marginTop: 6 },
    milestoneText: { color: t.accent.green, fontSize: 11, fontWeight: '600' },
    milestoneRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
    filterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 12 },
    filterChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, backgroundColor: t.bg.card },
    filterChipActive: { backgroundColor: t.accent.blue },
    filterLabel: { color: t.text.secondary, fontSize: 12, fontWeight: '600' },
    filterLabelActive: { color: '#fff' },
    tipCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 10 },
    tipCategory: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    tipTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700', marginTop: 6 },
    tipSummary: { color: t.text.secondary, fontSize: 13, lineHeight: 20, marginTop: 6 },
    tipFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    tipAuthor: { color: t.text.muted, fontSize: 12 },
    tipStats: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    tipStatText: { color: t.text.secondary, fontSize: 12, fontWeight: '600' },
    notkBadge: { color: t.accent.purple, fontSize: 12, fontWeight: '700' },
    communityCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 10 },
    communityAuthor: { color: t.text.primary, fontSize: 14, fontWeight: '700' },
    communityDate: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    communityContent: { color: t.text.secondary, fontSize: 14, lineHeight: 22, marginTop: 8 },
    communityStats: { flexDirection: 'row', gap: 16, marginTop: 10 },
    communityStatText: { color: t.text.muted, fontSize: 12, fontWeight: '600' },
    resourceCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 10, flexDirection: 'row', gap: 12, alignItems: 'center' },
    resourceTypeBadge: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    resourceInfo: { flex: 1 },
    resourceTitle: { color: t.text.primary, fontSize: 14, fontWeight: '700' },
    resourceSource: { color: t.text.secondary, fontSize: 12, marginTop: 2 },
    resourceHash: { color: t.text.muted, fontSize: 10, fontFamily: 'Courier', marginTop: 4 },
    resourceRating: { color: t.accent.orange || '#FF9500', fontSize: 13, fontWeight: '700' },
    connectBtn: { backgroundColor: t.accent.purple, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginHorizontal: 20, marginTop: 12, marginBottom: 20 },
    connectBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', padding: 40 },
    currentBadge: { backgroundColor: t.accent.purple, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
    currentBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
    notkEarnedCard: { backgroundColor: t.accent.purple + '10', borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    notkLabel: { color: t.text.secondary, fontSize: 13 },
    notkValue: { color: t.accent.purple, fontSize: 20, fontWeight: '800' },
  }), [t]);

  const currentStage = useMemo(() => STAGES.find(st => st.key === selectedStage), [selectedStage]);

  const filteredTips = useMemo(() => {
    return DEMO_TIPS
      .filter(tip => tip.stageKey === selectedStage)
      .filter(tip => tipFilter === 'all' || tip.category === tipFilter);
  }, [selectedStage, tipFilter]);

  const stageResources = useMemo(() => {
    return DEMO_RESOURCES.filter(r => r.stageKey === selectedStage);
  }, [selectedStage]);

  const stagePosts = useMemo(() => {
    return DEMO_COMMUNITY_POSTS.filter(p => p.stageKey === selectedStage);
  }, [selectedStage]);

  const handleStageSelect = useCallback((key: string) => {
    setSelectedStage(key);
  }, []);

  const getCategoryColor = useCallback((cat: string) => {
    switch (cat) {
      case 'development': return t.accent.blue;
      case 'nutrition': return '#34C759';
      case 'safety': return '#FF3B30';
      case 'activities': return '#FF9500';
      default: return t.text.secondary;
    }
  }, [t]);

  // ─── Tab: Stages ───

  const renderStages = () => (
    <>
      <Text style={s.section}>Current Stage</Text>
      <View style={s.notkEarnedCard}>
        <View>
          <Text style={s.notkLabel}>nOTK earned from sharing tips</Text>
          <Text style={{ color: t.text.muted, fontSize: 11, marginTop: 2 }}>Help others, earn nurture tokens</Text>
        </View>
        <Text style={s.notkValue}>10,620</Text>
      </View>

      <Text style={s.section}>All Stages</Text>
      {STAGES.map(stage => (
        <TouchableOpacity
          key={stage.key}
          style={[s.stageCard, selectedStage === stage.key && s.stageCardSelected]}
          onPress={() => handleStageSelect(stage.key)}
        >
          <View style={[s.stageIcon, { backgroundColor: stage.color }]}>
            <Text style={s.stageIconText}>{stage.icon}</Text>
          </View>
          <View style={s.stageInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={s.stageLabel}>{stage.label}</Text>
              {stage.key === 'elementary' && (
                <View style={s.currentBadge}>
                  <Text style={s.currentBadgeText}>CURRENT</Text>
                </View>
              )}
            </View>
            <Text style={s.stageAge}>{stage.ageRange}</Text>
            <Text style={s.stageDesc}>{stage.description}</Text>
            <View style={s.milestoneRow}>
              {stage.milestones.slice(0, 3).map(m => (
                <View key={m} style={s.milestonePill}>
                  <Text style={s.milestoneText}>{m}</Text>
                </View>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </>
  );

  // ─── Tab: Tips ───

  const renderTips = () => (
    <>
      <Text style={s.section}>
        Tips for {currentStage?.label || 'Selected Stage'}
      </Text>

      <View style={s.filterRow}>
        <TouchableOpacity
          style={[s.filterChip, tipFilter === 'all' && s.filterChipActive]}
          onPress={() => setTipFilter('all')}
        >
          <Text style={[s.filterLabel, tipFilter === 'all' && s.filterLabelActive]}>All</Text>
        </TouchableOpacity>
        {TIP_CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[s.filterChip, tipFilter === cat.key && s.filterChipActive]}
            onPress={() => setTipFilter(cat.key)}
          >
            <Text style={[s.filterLabel, tipFilter === cat.key && s.filterLabelActive]}>
              {cat.icon} {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredTips.length === 0 ? (
        <Text style={s.emptyText}>No tips yet for this stage. Be the first to share!</Text>
      ) : (
        filteredTips.map(tip => (
          <View key={tip.id} style={s.tipCard}>
            <Text style={[s.tipCategory, { color: getCategoryColor(tip.category) }]}>
              {tip.category}
            </Text>
            <Text style={s.tipTitle}>{tip.title}</Text>
            <Text style={s.tipSummary}>{tip.summary}</Text>
            <View style={s.tipFooter}>
              <Text style={s.tipAuthor}>{tip.authorName} - {tip.date}</Text>
              <View style={s.tipStats}>
                <Text style={s.tipStatText}>{tip.helpfulCount} helpful</Text>
                <Text style={s.notkBadge}>+{tip.notkEarned.toLocaleString()} nOTK</Text>
              </View>
            </View>
          </View>
        ))
      )}

      <TouchableOpacity style={s.connectBtn}>
        <Text style={s.connectBtnText}>Share a Tip (Earn nOTK)</Text>
      </TouchableOpacity>
    </>
  );

  // ─── Tab: Community ───

  const renderCommunity = () => (
    <>
      <Text style={s.section}>
        {currentStage?.label || 'Stage'} Parent Community
      </Text>

      {stagePosts.length === 0 ? (
        <Text style={s.emptyText}>No community posts yet for this stage.</Text>
      ) : (
        stagePosts.map(post => (
          <View key={post.id} style={s.communityCard}>
            <Text style={s.communityAuthor}>{post.authorName}</Text>
            <Text style={s.communityDate}>{post.date}</Text>
            <Text style={s.communityContent}>{post.content}</Text>
            <View style={s.communityStats}>
              <Text style={s.communityStatText}>{post.replies} replies</Text>
              <Text style={s.communityStatText}>{post.helpful} found helpful</Text>
            </View>
          </View>
        ))
      )}

      <TouchableOpacity style={s.connectBtn}>
        <Text style={s.connectBtnText}>Connect with Parents at This Stage</Text>
      </TouchableOpacity>
    </>
  );

  // ─── Tab: Resources ───

  const renderResources = () => (
    <>
      <Text style={s.section}>
        Expert Resources - {currentStage?.label || 'Stage'}
      </Text>

      {stageResources.length === 0 ? (
        <Text style={s.emptyText}>No resources available for this stage yet.</Text>
      ) : (
        stageResources.map(res => (
          <View key={res.id} style={s.resourceCard}>
            <View style={[s.resourceTypeBadge, { backgroundColor: res.type === 'article' ? t.accent.blue + '20' : '#FF3B30' + '20' }]}>
              <Text style={{ color: res.type === 'article' ? t.accent.blue : '#FF3B30', fontSize: 16, fontWeight: '800' }}>
                {res.type === 'article' ? 'A' : 'V'}
              </Text>
            </View>
            <View style={s.resourceInfo}>
              <Text style={s.resourceTitle}>{res.title}</Text>
              <Text style={s.resourceSource}>{res.source}</Text>
              <Text style={s.resourceHash}>{res.contentHash}</Text>
            </View>
            <Text style={s.resourceRating}>{res.rating}</Text>
          </View>
        ))
      )}
    </>
  );

  // ─── Main Render ───

  const TABS: { key: Tab; label: string }[] = [
    { key: 'stages', label: 'Stages' },
    { key: 'tips', label: 'Tips' },
    { key: 'community', label: 'Community' },
    { key: 'resources', label: 'Resources' },
  ];

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Parenting Stages</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      {/* Hero */}
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>N</Text>
        <Text style={s.heroTitle}>Age-Specific Parenting Guides</Text>
        <Text style={s.heroSubtitle}>
          Every stage of childhood is unique. Find stage-specific tips,{'\n'}
          connect with parents, and earn nOTK by helping others.
        </Text>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[s.tabBtn, tab === t.key && s.tabBtnActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[s.tabLabel, tab === t.key && s.tabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {tab === 'stages' && renderStages()}
        {tab === 'tips' && renderTips()}
        {tab === 'community' && renderCommunity()}
        {tab === 'resources' && renderResources()}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
