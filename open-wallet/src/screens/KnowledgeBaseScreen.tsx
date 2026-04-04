import { fonts } from '../utils/theme';
/**
 * Knowledge Base — Community wiki/FAQ and crowdsourced knowledge repository.
 *
 * A decentralized knowledge repository where community members contribute
 * articles, guides, and FAQs. Contributors earn edOTK for verified
 * knowledge contributions. Content is peer-reviewed and rated.
 *
 * Features:
 * - Articles: browse curated articles by category
 * - Search: find specific knowledge across the repository
 * - Contribute: submit new articles or improve existing ones
 * - Demo mode with sample knowledge data
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

type KBTab = 'articles' | 'search' | 'contribute';

interface Article {
  id: string;
  title: string;
  summary: string;
  category: string;
  categoryIcon: string;
  author: string;
  authorUID: string;
  rating: number;
  reviews: number;
  edOTKEarned: number;
  readTime: string;
  lastUpdated: string;
  verified: boolean;
}

interface Category {
  name: string;
  icon: string;
  color: string;
  articleCount: number;
}

interface ContributionGuide {
  title: string;
  description: string;
  icon: string;
  reward: string;
}

const DEMO_CATEGORIES: Category[] = [
  { name: 'Getting Started', icon: '\u{1F680}', color: '#3b82f6', articleCount: 24 },
  { name: 'Open Chain', icon: '\u{26D3}', color: '#8b5cf6', articleCount: 18 },
  { name: 'OTK Channels', icon: '\u{1F4CA}', color: '#22c55e', articleCount: 32 },
  { name: 'Governance', icon: '\u{1F5F3}', color: '#eab308', articleCount: 15 },
  { name: 'Security', icon: '\u{1F512}', color: '#ef4444', articleCount: 21 },
  { name: 'Community', icon: '\u{1F91D}', color: '#f7931a', articleCount: 28 },
];

const DEMO_ARTICLES: Article[] = [
  { id: 'a1', title: 'What is OTK and How Does It Work?', summary: 'A comprehensive guide to Open Token (OTK), the multi-channel value token that represents real human contributions.', category: 'Getting Started', categoryIcon: '\u{1F680}', author: 'Community Team', authorUID: 'UID-0001', rating: 4.9, reviews: 342, edOTKEarned: 1200, readTime: '8 min', lastUpdated: '2 days ago', verified: true },
  { id: 'a2', title: 'Understanding the Six OTK Channels', summary: 'Deep dive into nurture, education, health, community, economic, and governance channels — how they track different types of human value.', category: 'OTK Channels', categoryIcon: '\u{1F4CA}', author: 'Amara K.', authorUID: 'UID-8372', rating: 4.8, reviews: 218, edOTKEarned: 800, readTime: '12 min', lastUpdated: '1 week ago', verified: true },
  { id: 'a3', title: 'How Governance Voting Works', summary: 'Step-by-step guide to participating in community governance: proposals, voting, delegation, and the one-human-one-vote principle.', category: 'Governance', categoryIcon: '\u{1F5F3}', author: 'Raj P.', authorUID: 'UID-1290', rating: 4.7, reviews: 156, edOTKEarned: 650, readTime: '10 min', lastUpdated: '3 days ago', verified: true },
  { id: 'a4', title: 'Securing Your Wallet and Seed Phrase', summary: 'Essential security practices for protecting your Open Wallet, including seed phrase management and hardware key integration.', category: 'Security', categoryIcon: '\u{1F512}', author: 'Security Guild', authorUID: 'UID-0002', rating: 4.9, reviews: 410, edOTKEarned: 1500, readTime: '7 min', lastUpdated: '5 days ago', verified: true },
  { id: 'a5', title: 'Building Trust in the Network', summary: 'How the web-of-trust system works, how to build your trust score, and why trust is the foundation of Open Chain consensus.', category: 'Community', categoryIcon: '\u{1F91D}', author: 'Fatima A.', authorUID: 'UID-7742', rating: 4.6, reviews: 128, edOTKEarned: 550, readTime: '9 min', lastUpdated: '1 week ago', verified: true },
  { id: 'a6', title: 'Proof of Humanity Explained', summary: 'Technical overview of PoH + PoC consensus mechanism — one human, one vote, earned through real contributions.', category: 'Open Chain', categoryIcon: '\u{26D3}', author: 'Li Wei', authorUID: 'UID-4451', rating: 4.5, reviews: 94, edOTKEarned: 480, readTime: '15 min', lastUpdated: '2 weeks ago', verified: true },
];

const CONTRIBUTION_GUIDES: ContributionGuide[] = [
  { title: 'Write a New Article', description: 'Share your knowledge on any topic. Articles are peer-reviewed before publishing.', icon: '\u{270D}', reward: '100-500 edOTK' },
  { title: 'Improve Existing Content', description: 'Fix errors, add details, or update outdated information in existing articles.', icon: '\u{1F527}', reward: '50-200 edOTK' },
  { title: 'Translate an Article', description: 'Help make knowledge accessible by translating articles into other languages.', icon: '\u{1F310}', reward: '150-400 edOTK' },
  { title: 'Review Submissions', description: 'Peer-review submitted articles for accuracy and completeness.', icon: '\u{1F50D}', reward: '30-100 edOTK' },
  { title: 'Create a Tutorial', description: 'Build step-by-step tutorials with screenshots or videos for complex topics.', icon: '\u{1F3AC}', reward: '200-800 edOTK' },
];

export function KnowledgeBaseScreen({ onClose }: Props) {
  const { demoMode } = useWalletStore();
  const t = useTheme();
  const [activeTab, setActiveTab] = useState<KBTab>('articles');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 8 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.bold },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { flex: 1, paddingHorizontal: 16 },
    subtitle: { color: t.text.muted, fontSize: 13, lineHeight: 19, marginBottom: 16 },
    tabRow: { flexDirection: 'row', marginBottom: 16, gap: 4 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: t.bg.card, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    card: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    label: { color: t.text.muted, fontSize: 12 },
    val: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.semibold },
    empty: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40 },
    summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    summaryCard: { flex: 1, backgroundColor: t.bg.card, borderRadius: 12, padding: 14, alignItems: 'center' },
    summaryNum: { fontSize: 20, fontWeight: fonts.heavy, marginBottom: 2 },
    summaryLabel: { color: t.text.muted, fontSize: 10, fontWeight: fonts.semibold, textAlign: 'center' },
    catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
    catCard: { width: '47%', backgroundColor: t.bg.card, borderRadius: 12, padding: 14, alignItems: 'center' },
    catIcon: { fontSize: 28, marginBottom: 6 },
    catName: { color: t.text.primary, fontSize: 13, fontWeight: fonts.bold, textAlign: 'center' },
    catCount: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    articleTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold, marginBottom: 4 },
    articleSummary: { color: t.text.secondary, fontSize: 12, lineHeight: 17, marginBottom: 8 },
    articleMeta: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
    metaText: { color: t.text.muted, fontSize: 11 },
    ratingText: { color: t.accent.yellow, fontSize: 12, fontWeight: fonts.bold },
    verifiedBadge: { color: t.accent.green, fontSize: 11, fontWeight: fonts.bold },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, marginTop: 8 },
    guideTitle: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    guideDesc: { color: t.text.secondary, fontSize: 12, lineHeight: 17, marginTop: 4 },
    rewardBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: t.accent.green + '20', marginTop: 6, alignSelf: 'flex-start' },
    rewardText: { color: t.accent.green, fontSize: 11, fontWeight: fonts.bold },
    backBtn: { paddingVertical: 10, alignItems: 'center' },
    backText: { color: t.accent.blue, fontSize: 15 },
    searchHint: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 20, lineHeight: 19 },
  }), [t]);

  const articles = demoMode ? DEMO_ARTICLES : [];
  const categories = demoMode ? DEMO_CATEGORIES : [];
  const totalArticles = categories.reduce((s, c) => s + c.articleCount, 0);

  const filteredArticles = useMemo(() => {
    if (!selectedCategory) return articles;
    return articles.filter(a => a.category === selectedCategory);
  }, [articles, selectedCategory]);

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.title}>Knowledge Base</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={st.scroll}>
        <Text style={st.subtitle}>
          Community-built knowledge repository. Learn, contribute, and earn edOTK.
        </Text>

        {demoMode && (
          <View style={st.summaryRow}>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: t.accent.blue }]}>{totalArticles}</Text>
              <Text style={st.summaryLabel}>Articles</Text>
            </View>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: t.accent.green }]}>{categories.length}</Text>
              <Text style={st.summaryLabel}>Categories</Text>
            </View>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: t.accent.yellow }]}>4.7</Text>
              <Text style={st.summaryLabel}>Avg Rating</Text>
            </View>
          </View>
        )}

        <View style={st.tabRow}>
          {(['articles', 'search', 'contribute'] as KBTab[]).map(tab => (
            <TouchableOpacity key={tab} style={[st.tab, activeTab === tab && st.tabActive]}
              onPress={() => setActiveTab(tab)}>
              <Text style={[st.tabText, activeTab === tab && st.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'articles' && (
          articles.length === 0 ? (
            <Text style={st.empty}>Enable Demo Mode in Settings to see knowledge base.</Text>
          ) : (
            <>
              {!selectedCategory && (
                <View style={st.catGrid}>
                  {categories.map(cat => (
                    <TouchableOpacity key={cat.name} style={st.catCard} onPress={() => setSelectedCategory(cat.name)}>
                      <Text style={st.catIcon}>{cat.icon}</Text>
                      <Text style={st.catName}>{cat.name}</Text>
                      <Text style={st.catCount}>{cat.articleCount} articles</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {selectedCategory && (
                <TouchableOpacity style={st.backBtn} onPress={() => setSelectedCategory(null)}>
                  <Text style={st.backText}>All Categories</Text>
                </TouchableOpacity>
              )}
              {filteredArticles.map(art => (
                <View key={art.id} style={st.card}>
                  <Text style={st.articleTitle}>{art.title}</Text>
                  <Text style={st.articleSummary}>{art.summary}</Text>
                  <View style={st.articleMeta}>
                    <Text style={st.ratingText}>{'\u2605'} {art.rating}</Text>
                    <Text style={st.metaText}>{art.reviews} reviews</Text>
                    <Text style={st.metaText}>{art.readTime}</Text>
                    <Text style={st.metaText}>{art.categoryIcon} {art.category}</Text>
                    {art.verified && <Text style={st.verifiedBadge}>{'\u2713'} Verified</Text>}
                  </View>
                </View>
              ))}
            </>
          )
        )}

        {activeTab === 'search' && (
          <View style={st.card}>
            <Text style={st.searchHint}>
              Search functionality connects to the community knowledge graph.
              {'\n\n'}In Demo Mode, browse articles by category in the Articles tab.
              {'\n\n'}Full-text search with filters by category, rating, and recency will be available when connected to the P2P network.
            </Text>
          </View>
        )}

        {activeTab === 'contribute' && (
          <>
            <Text style={st.section}>Ways to contribute</Text>
            {CONTRIBUTION_GUIDES.map((guide, i) => (
              <View key={i} style={st.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 22, marginRight: 12 }}>{guide.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={st.guideTitle}>{guide.title}</Text>
                    <Text style={st.guideDesc}>{guide.description}</Text>
                    <View style={st.rewardBadge}>
                      <Text style={st.rewardText}>{guide.reward}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {!demoMode && activeTab !== 'contribute' && (
          <View style={[st.card, { marginTop: 20 }]}>
            <Text style={{ color: t.text.muted, fontSize: 13, textAlign: 'center' }}>
              Enable Demo Mode in Settings to see sample knowledge base data.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
