import { fonts } from '../utils/theme';
/**
 * News Screen — Article I of The Human Constitution.
 *
 * Community journalism with verified reporting. Every community
 * member can submit articles, and fact-checking is crowdsourced.
 * Reporter credibility scores are built over time through
 * community verification — truth emerges from transparency.
 *
 * Features:
 * - Community news feed (articles by verified community reporters)
 * - Categories: governance, community, health, education, environment, economy, culture, events
 * - Submit article (title, content, category, sources)
 * - Fact-check system — community members verify/dispute claims
 * - Reporter profiles with credibility scores
 * - Breaking alerts for urgent community news
 * - Demo: 5 articles, 2 reporters, 1 breaking alert
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

interface Props {
  onClose: () => void;
}

type Tab = 'feed' | 'submit' | 'reporters' | 'alerts';

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  author: string;
  authorId: string;
  date: string;
  verified: number;
  disputed: number;
  factCheckStatus: 'verified' | 'pending' | 'disputed';
  sources: string[];
  isBreaking: boolean;
}

interface Reporter {
  id: string;
  name: string;
  address: string;
  articlesPublished: number;
  credibilityScore: number;
  verifiedCount: number;
  disputedCount: number;
  joinedDate: string;
  specialties: string[];
}

interface BreakingAlert {
  id: string;
  title: string;
  summary: string;
  category: string;
  timestamp: string;
  articleId: string;
  severity: 'info' | 'important' | 'urgent';
}

const CATEGORIES = [
  { id: 'all', label: 'All', icon: '\u{1F4F0}', color: '#6b7280' },
  { id: 'governance', label: 'Governance', icon: '\u{1F5F3}', color: '#eab308' },
  { id: 'community', label: 'Community', icon: '\u{1F91D}', color: '#8b5cf6' },
  { id: 'health', label: 'Health', icon: '\u{1FA7A}', color: '#22c55e' },
  { id: 'education', label: 'Education', icon: '\u{1F4DA}', color: '#3b82f6' },
  { id: 'environment', label: 'Environment', icon: '\u{1F33F}', color: '#10b981' },
  { id: 'economy', label: 'Economy', icon: '\u{1F4B0}', color: '#f7931a' },
  { id: 'culture', label: 'Culture', icon: '\u{1F3AD}', color: '#ec4899' },
  { id: 'events', label: 'Events', icon: '\u{1F4C5}', color: '#06b6d4' },
];

const FACT_CHECK_COLORS: Record<string, string> = {
  verified: '#22c55e',
  pending: '#eab308',
  disputed: '#ef4444',
};

const SEVERITY_COLORS: Record<string, string> = {
  info: '#3b82f6',
  important: '#f7931a',
  urgent: '#ef4444',
};

const DEMO_ARTICLES: Article[] = [
  {
    id: 'art-1',
    title: 'Community solar project reaches 80% funding milestone',
    content: 'The community-funded solar microgrid initiative has reached 80% of its 4,500 OTK target. Over 340 community members have contributed, with the infrastructure committee reporting that equipment procurement can begin once the final 20% is secured. Expected completion: Q2 2026.',
    category: 'community',
    author: 'Maya Chen',
    authorId: 'reporter-1',
    date: 'Mar 29, 2026',
    verified: 42,
    disputed: 1,
    factCheckStatus: 'verified',
    sources: ['Budget Proposal BP-1', 'Infrastructure Committee Report'],
    isBreaking: false,
  },
  {
    id: 'art-2',
    title: 'Governance proposal: Extend voting period to 10 days',
    content: 'A new governance proposal suggests extending the standard voting period from 7 to 10 days. Proponents argue this gives more community members time to participate, especially those in different time zones. Critics worry it will slow decision-making. The proposal currently has 612 votes for and 445 against.',
    category: 'governance',
    author: 'Raj Patel',
    authorId: 'reporter-2',
    date: 'Mar 28, 2026',
    verified: 28,
    disputed: 3,
    factCheckStatus: 'verified',
    sources: ['Governance Proposal #14', 'Community Forum Discussion'],
    isBreaking: false,
  },
  {
    id: 'art-3',
    title: 'Free health screening event this Saturday',
    content: 'The community health committee is hosting free screenings at the community center from 9am-4pm this Saturday. Services include blood pressure, diabetes, vision, and dental checks. No appointment needed. Funded through the Q1 health budget allocation.',
    category: 'health',
    author: 'Maya Chen',
    authorId: 'reporter-1',
    date: 'Mar 27, 2026',
    verified: 35,
    disputed: 0,
    factCheckStatus: 'verified',
    sources: ['Health Committee Announcement', 'Budget Line Item H-23'],
    isBreaking: false,
  },
  {
    id: 'art-4',
    title: 'After-school coding bootcamp accepting applications',
    content: 'The education-funded coding program for youth ages 12-18 is now accepting applications for its second cohort. The first cohort of 48 students reported 92% completion rates. Applications close April 15. The program covers web development, blockchain basics, and AI fundamentals.',
    category: 'education',
    author: 'Raj Patel',
    authorId: 'reporter-2',
    date: 'Mar 26, 2026',
    verified: 19,
    disputed: 2,
    factCheckStatus: 'pending',
    sources: ['Education Committee Report'],
    isBreaking: false,
  },
  {
    id: 'art-5',
    title: 'Emergency water main repair completed ahead of schedule',
    content: 'The infrastructure team completed emergency repairs to the Oak Street water main two days ahead of the projected timeline. The repair, funded through an emergency budget allocation of 800 OTK, restored water service to 120 households. Full audit report available on-chain.',
    category: 'community',
    author: 'Maya Chen',
    authorId: 'reporter-1',
    date: 'Mar 25, 2026',
    verified: 51,
    disputed: 0,
    factCheckStatus: 'verified',
    sources: ['Infrastructure Emergency Report', 'On-chain Tx: 0xabc...123'],
    isBreaking: true,
  },
];

const DEMO_REPORTERS: Reporter[] = [
  {
    id: 'reporter-1',
    name: 'Maya Chen',
    address: 'openchain1abc...chen',
    articlesPublished: 47,
    credibilityScore: 94,
    verifiedCount: 43,
    disputedCount: 2,
    joinedDate: 'Jan 2026',
    specialties: ['community', 'health', 'environment'],
  },
  {
    id: 'reporter-2',
    name: 'Raj Patel',
    address: 'openchain1def...patel',
    articlesPublished: 31,
    credibilityScore: 87,
    verifiedCount: 26,
    disputedCount: 4,
    joinedDate: 'Feb 2026',
    specialties: ['governance', 'economy', 'education'],
  },
];

const DEMO_ALERTS: BreakingAlert[] = [
  {
    id: 'alert-1',
    title: 'Emergency water main repair completed',
    summary: 'Oak Street water service restored to 120 households. Full audit on-chain.',
    category: 'community',
    timestamp: 'Mar 25, 3:45 PM',
    articleId: 'art-5',
    severity: 'urgent',
  },
];

export function NewsScreen({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('feed');
  const [articles, setArticles] = useState<Article[]>(DEMO_ARTICLES);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('community');
  const [newSources, setNewSources] = useState('');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const filteredArticles = useMemo(() => {
    if (selectedCategory === 'all') return articles;
    return articles.filter((a) => a.category === selectedCategory);
  }, [articles, selectedCategory]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, backgroundColor: t.bg.card, borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    catRow: { flexDirection: 'row', marginBottom: 16, paddingHorizontal: 20 },
    catChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginRight: 8, backgroundColor: t.bg.card },
    catChipActive: { backgroundColor: t.accent.blue },
    catChipText: { fontSize: 12, fontWeight: fonts.semibold, color: t.text.muted },
    catChipTextActive: { color: '#fff' },
    breakingBanner: { backgroundColor: '#ef4444' + '15', borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#ef4444' },
    breakingLabel: { color: '#ef4444', fontSize: 11, fontWeight: fonts.heavy, textTransform: 'uppercase', letterSpacing: 1.5 },
    breakingTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold, marginTop: 4 },
    articleCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    articleTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    articleMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
    articleAuthor: { color: t.accent.blue, fontSize: 12, fontWeight: fonts.semibold },
    articleDate: { color: t.text.muted, fontSize: 12 },
    articleCatBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    articleCatText: { fontSize: 12, fontWeight: fonts.semibold, marginLeft: 4 },
    articleContent: { color: t.text.secondary, fontSize: 13, lineHeight: 20, marginTop: 10 },
    factCheckRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 12 },
    factBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    factBadgeText: { fontSize: 11, fontWeight: fonts.bold, color: '#fff' },
    verifyCount: { fontSize: 12, fontWeight: fonts.semibold },
    sourcesLabel: { color: t.text.muted, fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1, marginTop: 12 },
    sourceItem: { color: t.accent.blue, fontSize: 12, marginTop: 4 },
    backBtn: { color: t.accent.blue, fontSize: 16 },
    detailTitle: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy, marginHorizontal: 20, marginTop: 8 },
    detailMeta: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 20, marginTop: 8 },
    detailContent: { color: t.text.primary, fontSize: 15, lineHeight: 24, marginHorizontal: 20, marginTop: 16 },
    detailFactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 20, marginTop: 16 },
    detailSources: { marginHorizontal: 20, marginTop: 16 },
    factActions: { flexDirection: 'row', gap: 12, marginHorizontal: 20, marginTop: 16 },
    factBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    factBtnText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    inputCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: fonts.semibold, marginBottom: 8 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15 },
    contentInput: { minHeight: 160, textAlignVertical: 'top' },
    catPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    submitBtn: { backgroundColor: t.accent.blue, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
    submitBtnText: { color: '#fff', fontSize: 17, fontWeight: fonts.bold },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, marginTop: 8 },
    reporterCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    reporterName: { color: t.text.primary, fontSize: 17, fontWeight: fonts.heavy },
    reporterAddress: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    reporterStats: { flexDirection: 'row', gap: 16, marginTop: 12 },
    rStat: { alignItems: 'center' },
    rStatValue: { color: t.text.primary, fontSize: 18, fontWeight: fonts.bold },
    rStatLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    credBar: { height: 8, backgroundColor: t.border, borderRadius: 4, marginTop: 12 },
    credFill: { height: 8, borderRadius: 4 },
    credLabel: { color: t.text.muted, fontSize: 11, marginTop: 4 },
    specialties: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    specChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: t.bg.primary },
    specChipText: { color: t.text.secondary, fontSize: 11, fontWeight: fonts.semibold },
    alertCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4 },
    alertTime: { color: t.text.muted, fontSize: 11 },
    alertTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold, marginTop: 4 },
    alertSummary: { color: t.text.secondary, fontSize: 13, lineHeight: 20, marginTop: 6 },
    alertCategory: { color: t.text.muted, fontSize: 12, marginTop: 6 },
    heroCard: { backgroundColor: t.accent.blue + '10', borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 20 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSub: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },
    emptyText: { color: t.text.muted, textAlign: 'center', marginTop: 20, fontSize: 14 },
  }), [t]);

  const handleSubmitArticle = useCallback(async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      Alert.alert('Required', 'Enter both title and content.');
      return;
    }
    setLoading(true);
    if (demoMode) {
      await new Promise((r) => setTimeout(r, 1200));
      const newArticle: Article = {
        id: `art-${Date.now()}`,
        title: newTitle.trim(),
        content: newContent.trim(),
        category: newCategory,
        author: 'You (Demo)',
        authorId: 'demo-user',
        date: 'Mar 29, 2026',
        verified: 0,
        disputed: 0,
        factCheckStatus: 'pending',
        sources: newSources.trim() ? newSources.split(',').map((s) => s.trim()) : [],
        isBreaking: false,
      };
      setArticles([newArticle, ...articles]);
      Alert.alert('Article Submitted', 'Your article is now pending community fact-check verification.');
      setNewTitle('');
      setNewContent('');
      setNewSources('');
      setActiveTab('feed');
    }
    setLoading(false);
  }, [newTitle, newContent, newCategory, newSources, demoMode, articles]);

  const handleFactCheck = useCallback((articleId: string, action: 'verify' | 'dispute') => {
    if (demoMode) {
      setArticles((prev) =>
        prev.map((a) => {
          if (a.id !== articleId) return a;
          return {
            ...a,
            verified: a.verified + (action === 'verify' ? 1 : 0),
            disputed: a.disputed + (action === 'dispute' ? 1 : 0),
          };
        })
      );
      Alert.alert(
        action === 'verify' ? 'Verified' : 'Disputed',
        action === 'verify'
          ? 'Thank you for verifying this article. Community trust builds on shared verification.'
          : 'Your dispute has been recorded. The reporter will be notified to provide additional sources.'
      );
    }
  }, [demoMode]);

  // ─── Tab Bar ───
  const renderTabs = () => (
    <View style={s.tabRow}>
      {(['feed', 'submit', 'reporters', 'alerts'] as Tab[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[s.tab, activeTab === tab && s.tabActive]}
          onPress={() => { setActiveTab(tab); setSelectedArticle(null); }}
        >
          <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
            {tab === 'feed' ? 'Feed' : tab === 'submit' ? 'Submit' : tab === 'reporters' ? 'Reporters' : 'Alerts'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // ─── Article Detail ───
  if (selectedArticle) {
    const a = selectedArticle;
    const catMeta = CATEGORIES.find((c) => c.id === a.category);
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setSelectedArticle(null)}><Text style={s.backBtn}>← Back</Text></TouchableOpacity>
          <Text style={s.title}>Article</Text>
          <View style={{ width: 50 }} />
        </View>
        <ScrollView>
          <Text style={s.detailTitle}>{a.title}</Text>
          <View style={s.detailMeta}>
            <Text style={{ color: t.accent.blue, fontSize: 13, fontWeight: fonts.semibold }}>{a.author}</Text>
            <Text style={{ color: t.text.muted, fontSize: 13 }}>{a.date}</Text>
          </View>
          {catMeta && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 8 }}>
              <Text style={{ fontSize: 14 }}>{catMeta.icon}</Text>
              <Text style={{ color: catMeta.color, fontSize: 13, fontWeight: fonts.semibold, marginLeft: 4 }}>{catMeta.label}</Text>
            </View>
          )}
          <Text style={s.detailContent}>{a.content}</Text>

          <View style={s.detailFactRow}>
            <View style={[s.factBadge, { backgroundColor: FACT_CHECK_COLORS[a.factCheckStatus] }]}>
              <Text style={s.factBadgeText}>{a.factCheckStatus.toUpperCase()}</Text>
            </View>
            <Text style={[s.verifyCount, { color: t.accent.green }]}>{a.verified} verified</Text>
            <Text style={[s.verifyCount, { color: t.accent.red }]}>{a.disputed} disputed</Text>
          </View>

          {a.sources.length > 0 && (
            <View style={s.detailSources}>
              <Text style={s.sourcesLabel}>Sources</Text>
              {a.sources.map((src, i) => (
                <Text key={i} style={s.sourceItem}>{i + 1}. {src}</Text>
              ))}
            </View>
          )}

          <View style={s.factActions}>
            <TouchableOpacity
              style={[s.factBtn, { backgroundColor: t.accent.green }]}
              onPress={() => handleFactCheck(a.id, 'verify')}
            >
              <Text style={s.factBtnText}>Verify</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.factBtn, { backgroundColor: t.accent.red }]}
              onPress={() => handleFactCheck(a.id, 'dispute')}
            >
              <Text style={s.factBtnText}>Dispute</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Feed Tab ───
  const renderFeed = () => (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[s.catChip, selectedCategory === cat.id && s.catChipActive]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text style={[s.catChipText, selectedCategory === cat.id && s.catChipTextActive]}>
              {cat.icon} {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView contentContainerStyle={s.scroll}>
        {filteredArticles.filter((a) => a.isBreaking).map((a) => (
          <TouchableOpacity key={a.id} style={s.breakingBanner} onPress={() => setSelectedArticle(a)}>
            <Text style={s.breakingLabel}>Breaking</Text>
            <Text style={s.breakingTitle}>{a.title}</Text>
          </TouchableOpacity>
        ))}
        {filteredArticles.length === 0 ? (
          <Text style={s.emptyText}>No articles in this category yet.</Text>
        ) : (
          filteredArticles.map((a) => {
            const catMeta = CATEGORIES.find((c) => c.id === a.category);
            return (
              <TouchableOpacity key={a.id} style={s.articleCard} onPress={() => setSelectedArticle(a)}>
                <Text style={s.articleTitle}>{a.title}</Text>
                <View style={s.articleMeta}>
                  <Text style={s.articleAuthor}>{a.author}</Text>
                  <Text style={s.articleDate}>{a.date}</Text>
                </View>
                {catMeta && (
                  <View style={s.articleCatBadge}>
                    <Text style={{ fontSize: 12 }}>{catMeta.icon}</Text>
                    <Text style={[s.articleCatText, { color: catMeta.color }]}>{catMeta.label}</Text>
                  </View>
                )}
                <Text style={s.articleContent} numberOfLines={2}>{a.content}</Text>
                <View style={s.factCheckRow}>
                  <View style={[s.factBadge, { backgroundColor: FACT_CHECK_COLORS[a.factCheckStatus] }]}>
                    <Text style={s.factBadgeText}>{a.factCheckStatus.toUpperCase()}</Text>
                  </View>
                  <Text style={[s.verifyCount, { color: t.accent.green }]}>{a.verified} verified</Text>
                  <Text style={[s.verifyCount, { color: t.accent.red }]}>{a.disputed} disputed</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </>
  );

  // ─── Submit Tab ───
  const renderSubmit = () => (
    <ScrollView contentContainerStyle={s.scroll}>
      <View style={s.heroCard}>
        <Text style={s.heroTitle}>Community Journalism</Text>
        <Text style={s.heroSub}>
          Submit articles for your community. All claims are fact-checked by community members. Build your credibility through accurate reporting.
        </Text>
      </View>

      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Headline</Text>
        <TextInput style={s.input} placeholder="Article title..." placeholderTextColor={t.text.muted} value={newTitle} onChangeText={setNewTitle} />
      </View>
      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Content</Text>
        <TextInput style={[s.input, s.contentInput]} placeholder="Write your article..." placeholderTextColor={t.text.muted} value={newContent} onChangeText={setNewContent} multiline numberOfLines={8} />
      </View>
      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Category</Text>
        <View style={s.catPicker}>
          {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[s.catChip, newCategory === cat.id && s.catChipActive]}
              onPress={() => setNewCategory(cat.id)}
            >
              <Text style={[s.catChipText, newCategory === cat.id && s.catChipTextActive]}>
                {cat.icon} {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Sources (comma-separated)</Text>
        <TextInput style={s.input} placeholder="e.g. Budget Report, Meeting Minutes" placeholderTextColor={t.text.muted} value={newSources} onChangeText={setNewSources} />
      </View>
      <TouchableOpacity style={s.submitBtn} onPress={handleSubmitArticle} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>Submit Article</Text>}
      </TouchableOpacity>
      <Text style={{ color: t.text.muted, fontSize: 12, textAlign: 'center', marginTop: 16, lineHeight: 18 }}>
        Articles are published immediately and subject to community fact-checking. Provide sources to increase credibility.
      </Text>
    </ScrollView>
  );

  // ─── Reporters Tab ───
  const renderReporters = () => (
    <ScrollView contentContainerStyle={s.scroll}>
      <Text style={s.section}>Community Reporters</Text>
      {DEMO_REPORTERS.map((rep) => (
        <View key={rep.id} style={s.reporterCard}>
          <Text style={s.reporterName}>{rep.name}</Text>
          <Text style={s.reporterAddress}>{rep.address} — joined {rep.joinedDate}</Text>
          <View style={s.reporterStats}>
            <View style={s.rStat}>
              <Text style={s.rStatValue}>{rep.articlesPublished}</Text>
              <Text style={s.rStatLabel}>Articles</Text>
            </View>
            <View style={s.rStat}>
              <Text style={[s.rStatValue, { color: t.accent.green }]}>{rep.verifiedCount}</Text>
              <Text style={s.rStatLabel}>Verified</Text>
            </View>
            <View style={s.rStat}>
              <Text style={[s.rStatValue, { color: t.accent.red }]}>{rep.disputedCount}</Text>
              <Text style={s.rStatLabel}>Disputed</Text>
            </View>
          </View>
          <View style={s.credBar}>
            <View style={[s.credFill, { width: `${rep.credibilityScore}%`, backgroundColor: rep.credibilityScore >= 80 ? t.accent.green : rep.credibilityScore >= 50 ? '#eab308' : t.accent.red }]} />
          </View>
          <Text style={s.credLabel}>Credibility: {rep.credibilityScore}%</Text>
          <View style={s.specialties}>
            {rep.specialties.map((spec) => {
              const catMeta = CATEGORIES.find((c) => c.id === spec);
              return (
                <View key={spec} style={s.specChip}>
                  <Text style={s.specChipText}>{catMeta?.icon ?? ''} {catMeta?.label ?? spec}</Text>
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );

  // ─── Alerts Tab ───
  const renderAlerts = () => (
    <ScrollView contentContainerStyle={s.scroll}>
      <Text style={s.section}>Breaking Alerts</Text>
      {DEMO_ALERTS.length === 0 ? (
        <Text style={s.emptyText}>No breaking alerts at this time.</Text>
      ) : (
        DEMO_ALERTS.map((alert) => (
          <TouchableOpacity
            key={alert.id}
            style={[s.alertCard, { borderLeftColor: SEVERITY_COLORS[alert.severity] }]}
            onPress={() => {
              const linked = articles.find((a) => a.id === alert.articleId);
              if (linked) setSelectedArticle(linked);
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: SEVERITY_COLORS[alert.severity], fontSize: 11, fontWeight: fonts.heavy, textTransform: 'uppercase', letterSpacing: 1 }}>
                {alert.severity}
              </Text>
              <Text style={s.alertTime}>{alert.timestamp}</Text>
            </View>
            <Text style={s.alertTitle}>{alert.title}</Text>
            <Text style={s.alertSummary}>{alert.summary}</Text>
            <Text style={s.alertCategory}>{CATEGORIES.find((c) => c.id === alert.category)?.icon ?? ''} {alert.category}</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Community News</Text>
        <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>Close</Text></TouchableOpacity>
      </View>
      {renderTabs()}
      {activeTab === 'feed' && renderFeed()}
      {activeTab === 'submit' && renderSubmit()}
      {activeTab === 'reporters' && renderReporters()}
      {activeTab === 'alerts' && renderAlerts()}
    </SafeAreaView>
  );
}
