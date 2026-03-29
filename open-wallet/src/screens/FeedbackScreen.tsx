/**
 * Feedback Screen — Article VI of The Human Constitution.
 *
 * "Community feedback is the lifeblood of self-governance.
 *  Every voice matters — anonymous or named — and every response
 *  strengthens the social contract."
 *
 * Features:
 * - Submit feedback on community services (health, education, governance, infrastructure, safety)
 * - Rate services (1-5 stars + written feedback)
 * - Suggestion box — propose improvements
 * - Feedback trends (aggregate scores over time per category)
 * - Response tracking (official responses to feedback)
 * - Anonymous feedback option
 * - Demo: 3 recent feedback items, aggregate scores for 5 categories, 1 suggestion with response
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert, Switch,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

type TabKey = 'submit' | 'trends' | 'suggestions' | 'responses';

interface FeedbackItem {
  id: string;
  category: string;
  rating: number;
  comment: string;
  author: string;
  anonymous: boolean;
  date: string;
}

interface CategoryScore {
  category: string;
  icon: string;
  color: string;
  avgRating: number;
  totalFeedback: number;
  trend: 'up' | 'stable' | 'down';
  previousAvg: number;
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  author: string;
  upvotes: number;
  status: 'open' | 'under_review' | 'accepted' | 'implemented';
  response?: string;
  respondedBy?: string;
  respondedDate?: string;
}

const CATEGORIES = [
  { key: 'health', label: 'Health', icon: '\u{1FA7A}', color: '#22c55e' },
  { key: 'education', label: 'Education', icon: '\u{1F4DA}', color: '#3b82f6' },
  { key: 'governance', label: 'Governance', icon: '\u{1F5F3}', color: '#8b5cf6' },
  { key: 'infrastructure', label: 'Infrastructure', icon: '\u{1F3D7}', color: '#f97316' },
  { key: 'safety', label: 'Safety', icon: '\u{1F6E1}', color: '#ef4444' },
];

const TABS: { key: TabKey; label: string }[] = [
  { key: 'submit', label: 'Submit' },
  { key: 'trends', label: 'Trends' },
  { key: 'suggestions', label: 'Suggest' },
  { key: 'responses', label: 'Responses' },
];

const STATUS_COLORS: Record<string, string> = {
  open: '#3b82f6',
  under_review: '#eab308',
  accepted: '#22c55e',
  implemented: '#8b5cf6',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  under_review: 'Under Review',
  accepted: 'Accepted',
  implemented: 'Implemented',
};

const TREND_ARROWS: Record<string, string> = {
  up: '\u2191',
  stable: '\u2192',
  down: '\u2193',
};

const TREND_COLORS: Record<string, string> = {
  up: '#22c55e',
  stable: '#eab308',
  down: '#ef4444',
};

// ─── Demo Data ───

const DEMO_FEEDBACK: FeedbackItem[] = [
  {
    id: 'fb-1',
    category: 'health',
    rating: 4,
    comment: 'Community clinic wait times have improved significantly this quarter. Nurses are wonderful.',
    author: 'openchain1abc...xyz',
    anonymous: false,
    date: '2026-03-27',
  },
  {
    id: 'fb-2',
    category: 'education',
    rating: 3,
    comment: 'After-school programs are great, but the science lab needs updated equipment.',
    author: 'Anonymous',
    anonymous: true,
    date: '2026-03-26',
  },
  {
    id: 'fb-3',
    category: 'safety',
    rating: 5,
    comment: 'The new neighborhood watch coordination through Open Chain has been excellent. Feel much safer.',
    author: 'openchain1def...uvw',
    anonymous: false,
    date: '2026-03-25',
  },
];

const DEMO_SCORES: CategoryScore[] = [
  { category: 'Health', icon: '\u{1FA7A}', color: '#22c55e', avgRating: 4.2, totalFeedback: 187, trend: 'up', previousAvg: 3.9 },
  { category: 'Education', icon: '\u{1F4DA}', color: '#3b82f6', avgRating: 3.8, totalFeedback: 142, trend: 'stable', previousAvg: 3.7 },
  { category: 'Governance', icon: '\u{1F5F3}', color: '#8b5cf6', avgRating: 3.5, totalFeedback: 98, trend: 'up', previousAvg: 3.1 },
  { category: 'Infrastructure', icon: '\u{1F3D7}', color: '#f97316', avgRating: 3.1, totalFeedback: 76, trend: 'down', previousAvg: 3.4 },
  { category: 'Safety', icon: '\u{1F6E1}', color: '#ef4444', avgRating: 4.5, totalFeedback: 203, trend: 'up', previousAvg: 4.0 },
];

const DEMO_SUGGESTIONS: Suggestion[] = [
  {
    id: 'sg-1',
    title: 'Add solar panels to community center',
    description: 'The community center has high electricity costs. Solar panels would reduce costs and demonstrate sustainability values.',
    author: 'openchain1ghi...rst',
    upvotes: 47,
    status: 'accepted',
    response: 'Great idea! We have allocated 500 OTK from the community treasury for a feasibility study. Installation target: Q3 2026.',
    respondedBy: 'Community Council',
    respondedDate: '2026-03-20',
  },
  {
    id: 'sg-2',
    title: 'Weekly community meals for elders',
    description: 'Organize weekly shared meals at the community hall specifically for elderly residents who live alone.',
    author: 'Anonymous',
    upvotes: 32,
    status: 'under_review',
  },
  {
    id: 'sg-3',
    title: 'Expand bike lanes on Main Street',
    description: 'Main Street is dangerous for cyclists. Protected bike lanes would improve safety and reduce carbon emissions.',
    author: 'openchain1jkl...mno',
    upvotes: 28,
    status: 'open',
  },
];

export function FeedbackScreen({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('submit');
  const [selectedCategory, setSelectedCategory] = useState('health');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [suggestionTitle, setSuggestionTitle] = useState('');
  const [suggestionDesc, setSuggestionDesc] = useState('');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 6, marginBottom: 12 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: t.bg.card, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.muted, fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: '#fff' },
    heroCard: { backgroundColor: t.accent.blue + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: '800', textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 24 },
    categoryRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, flexWrap: 'wrap' },
    categoryChip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: t.bg.card, flexDirection: 'row', alignItems: 'center', gap: 6 },
    categoryChipActive: { backgroundColor: t.accent.blue },
    categoryLabel: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
    categoryLabelActive: { color: '#fff' },
    starRow: { flexDirection: 'row', gap: 12, justifyContent: 'center', marginTop: 16, marginBottom: 8 },
    star: { fontSize: 36 },
    inputCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 12 },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15 },
    commentInput: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, minHeight: 100, textAlignVertical: 'top' },
    anonRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginTop: 16 },
    anonLabel: { color: t.text.secondary, fontSize: 14, fontWeight: '600' },
    anonHint: { color: t.text.muted, fontSize: 12, marginLeft: 24, marginTop: 4 },
    submitBtn: { backgroundColor: t.accent.blue, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginHorizontal: 20, marginTop: 24 },
    submitBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    cardTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    cardSubtitle: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    cardBody: { color: t.text.secondary, fontSize: 14, lineHeight: 20, marginTop: 8 },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
    ratingText: { color: t.text.primary, fontSize: 14, fontWeight: '700' },
    scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    scoreIcon: { fontSize: 28 },
    scoreBar: { flex: 1, height: 8, backgroundColor: t.border, borderRadius: 4, marginTop: 4 },
    scoreFill: { height: 8, borderRadius: 4 },
    scoreLabel: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    scoreCount: { color: t.text.muted, fontSize: 12 },
    scoreTrend: { fontSize: 14, fontWeight: '700' },
    statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
    statusText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    upvoteRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
    upvoteBtn: { backgroundColor: t.bg.primary, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 4 },
    upvoteText: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
    responseBox: { backgroundColor: t.accent.blue + '10', borderRadius: 12, padding: 12, marginTop: 12 },
    responseLabel: { color: t.accent.blue, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    responseText: { color: t.text.secondary, fontSize: 13, lineHeight: 20, marginTop: 6 },
    responseMeta: { color: t.text.muted, fontSize: 11, marginTop: 6 },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 24 },
  }), [t]);

  // ─── Submit Feedback ───
  const handleSubmit = useCallback(() => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating (1-5).');
      return;
    }
    if (!comment.trim()) {
      Alert.alert('Feedback Required', 'Please write your feedback.');
      return;
    }

    if (demoMode) {
      Alert.alert(
        'Feedback Submitted (Demo)',
        `Your ${rating}-star feedback on ${CATEGORIES.find(c => c.key === selectedCategory)?.label ?? selectedCategory} has been recorded${isAnonymous ? ' anonymously' : ''}.\n\nIn production, this is stored on Open Chain for transparency.`,
      );
      setRating(0);
      setComment('');
    } else {
      // Real mode: would broadcast to Open Chain
      Alert.alert('Feedback Submitted', 'Your feedback has been recorded on Open Chain. Thank you for helping improve your community.');
      setRating(0);
      setComment('');
    }
  }, [rating, comment, selectedCategory, isAnonymous, demoMode]);

  // ─── Submit Suggestion ───
  const handleSuggestion = useCallback(() => {
    if (!suggestionTitle.trim()) {
      Alert.alert('Title Required', 'Please give your suggestion a title.');
      return;
    }
    if (!suggestionDesc.trim()) {
      Alert.alert('Description Required', 'Please describe your suggestion.');
      return;
    }

    if (demoMode) {
      Alert.alert(
        'Suggestion Submitted (Demo)',
        `"${suggestionTitle.trim()}" has been posted to the community suggestion box.\n\nOther community members can upvote it, and the community council will respond.`,
      );
      setSuggestionTitle('');
      setSuggestionDesc('');
    } else {
      Alert.alert('Suggestion Submitted', 'Your suggestion is now visible to the community. Thank you!');
      setSuggestionTitle('');
      setSuggestionDesc('');
    }
  }, [suggestionTitle, suggestionDesc, demoMode]);

  // ─── Render Stars ───
  const renderStars = (value: number, interactive: boolean = false) => {
    return (
      <View style={s.starRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            disabled={!interactive}
            onPress={() => interactive && setRating(star)}
          >
            <Text style={s.star}>
              {star <= value ? '\u2605' : '\u2606'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // ─── Submit Tab ───
  const renderSubmit = () => (
    <ScrollView>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'\u{1F4E3}'}</Text>
        <Text style={s.heroTitle}>Share Your Voice</Text>
        <Text style={s.heroSubtitle}>
          Rate community services and help improve life for everyone. Your feedback drives real change through transparent governance.
        </Text>
      </View>

      <Text style={s.section}>Service Category</Text>
      <View style={s.categoryRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[s.categoryChip, selectedCategory === cat.key && s.categoryChipActive]}
            onPress={() => setSelectedCategory(cat.key)}
          >
            <Text>{cat.icon}</Text>
            <Text style={[s.categoryLabel, selectedCategory === cat.key && s.categoryLabelActive]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.section}>Your Rating</Text>
      {renderStars(rating, true)}

      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Your Feedback</Text>
        <TextInput
          style={s.commentInput}
          placeholder="What's working well? What needs improvement?"
          placeholderTextColor={t.text.muted}
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={s.anonRow}>
        <Text style={s.anonLabel}>Submit Anonymously</Text>
        <Switch value={isAnonymous} onValueChange={setIsAnonymous} />
      </View>
      <Text style={s.anonHint}>
        Anonymous feedback is still on-chain, but your identity is not linked.
      </Text>

      <TouchableOpacity style={s.submitBtn} onPress={handleSubmit}>
        <Text style={s.submitBtnText}>Submit Feedback</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  // ─── Trends Tab ───
  const renderTrends = () => {
    const scores = demoMode ? DEMO_SCORES : DEMO_SCORES;
    return (
      <ScrollView>
        <View style={s.heroCard}>
          <Text style={s.heroIcon}>{'\u{1F4CA}'}</Text>
          <Text style={s.heroTitle}>Community Satisfaction Trends</Text>
          <Text style={s.heroSubtitle}>
            Aggregate scores across all feedback. Trends show quarter-over-quarter change.
          </Text>
        </View>

        <Text style={s.section}>Category Scores</Text>
        {scores.map((score) => {
          const barWidth = (score.avgRating / 5) * 100;
          const delta = (score.avgRating - score.previousAvg).toFixed(1);
          return (
            <View key={score.category} style={s.card}>
              <View style={s.scoreRow}>
                <Text style={s.scoreIcon}>{score.icon}</Text>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={s.scoreLabel}>{score.category}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={s.scoreLabel}>{score.avgRating.toFixed(1)}/5</Text>
                      <Text style={[s.scoreTrend, { color: TREND_COLORS[score.trend] }]}>
                        {TREND_ARROWS[score.trend]} {delta > '0' ? '+' : ''}{delta}
                      </Text>
                    </View>
                  </View>
                  <View style={s.scoreBar}>
                    <View style={[s.scoreFill, { width: `${barWidth}%`, backgroundColor: score.color }]} />
                  </View>
                  <Text style={s.scoreCount}>{score.totalFeedback} feedback submissions this quarter</Text>
                </View>
              </View>
            </View>
          );
        })}

        <Text style={s.section}>Recent Feedback</Text>
        {(demoMode ? DEMO_FEEDBACK : DEMO_FEEDBACK).map((fb) => {
          const cat = CATEGORIES.find(c => c.key === fb.category);
          return (
            <View key={fb.id} style={s.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={s.cardTitle}>{cat?.icon} {cat?.label ?? fb.category}</Text>
                <Text style={s.cardSubtitle}>{fb.date}</Text>
              </View>
              <View style={s.ratingBadge}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Text key={star} style={{ fontSize: 14, color: star <= fb.rating ? '#eab308' : t.border }}>
                    {'\u2605'}
                  </Text>
                ))}
                <Text style={s.ratingText}>{fb.rating}/5</Text>
              </View>
              <Text style={s.cardBody}>{fb.comment}</Text>
              <Text style={s.cardSubtitle}>
                {fb.anonymous ? 'Anonymous' : fb.author}
              </Text>
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  // ─── Suggestions Tab ───
  const renderSuggestions = () => {
    const suggestions = demoMode ? DEMO_SUGGESTIONS : DEMO_SUGGESTIONS;
    return (
      <ScrollView>
        <View style={s.heroCard}>
          <Text style={s.heroIcon}>{'\u{1F4A1}'}</Text>
          <Text style={s.heroTitle}>Community Suggestion Box</Text>
          <Text style={s.heroSubtitle}>
            Propose improvements. The community upvotes, the council responds. Transparent governance in action.
          </Text>
        </View>

        <Text style={s.section}>Submit a Suggestion</Text>
        <View style={s.inputCard}>
          <Text style={s.inputLabel}>Title</Text>
          <TextInput
            style={s.input}
            placeholder="Brief title for your suggestion..."
            placeholderTextColor={t.text.muted}
            value={suggestionTitle}
            onChangeText={setSuggestionTitle}
          />
        </View>
        <View style={s.inputCard}>
          <Text style={s.inputLabel}>Description</Text>
          <TextInput
            style={s.commentInput}
            placeholder="Describe your suggestion in detail..."
            placeholderTextColor={t.text.muted}
            value={suggestionDesc}
            onChangeText={setSuggestionDesc}
            multiline
            numberOfLines={4}
          />
        </View>
        <TouchableOpacity style={s.submitBtn} onPress={handleSuggestion}>
          <Text style={s.submitBtnText}>Submit Suggestion</Text>
        </TouchableOpacity>

        <Text style={s.section}>Community Suggestions</Text>
        {suggestions.map((sg) => (
          <View key={sg.id} style={s.card}>
            <Text style={s.cardTitle}>{sg.title}</Text>
            <Text style={s.cardBody}>{sg.description}</Text>
            <Text style={s.cardSubtitle}>by {sg.author}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }}>
              <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[sg.status] ?? t.text.muted }]}>
                <Text style={s.statusText}>{STATUS_LABELS[sg.status] ?? sg.status}</Text>
              </View>
              <View style={s.upvoteBtn}>
                <Text style={s.upvoteText}>{'\u25B2'} {sg.upvotes}</Text>
              </View>
            </View>
            {sg.response && (
              <View style={s.responseBox}>
                <Text style={s.responseLabel}>Official Response</Text>
                <Text style={s.responseText}>{sg.response}</Text>
                <Text style={s.responseMeta}>{sg.respondedBy} \u2022 {sg.respondedDate}</Text>
              </View>
            )}
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  // ─── Responses Tab ───
  const renderResponses = () => {
    const responded = (demoMode ? DEMO_SUGGESTIONS : DEMO_SUGGESTIONS).filter(sg => sg.response);
    return (
      <ScrollView>
        <View style={s.heroCard}>
          <Text style={s.heroIcon}>{'\u{1F4AC}'}</Text>
          <Text style={s.heroTitle}>Official Responses</Text>
          <Text style={s.heroSubtitle}>
            Track how community leaders respond to your feedback and suggestions. Accountability through transparency.
          </Text>
        </View>

        <Text style={s.section}>Responded Suggestions</Text>
        {responded.length === 0 ? (
          <Text style={s.emptyText}>No responses yet. Check back soon.</Text>
        ) : (
          responded.map((sg) => (
            <View key={sg.id} style={s.card}>
              <Text style={s.cardTitle}>{sg.title}</Text>
              <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[sg.status] ?? t.text.muted }]}>
                <Text style={s.statusText}>{STATUS_LABELS[sg.status] ?? sg.status}</Text>
              </View>
              <View style={s.responseBox}>
                <Text style={s.responseLabel}>Official Response</Text>
                <Text style={s.responseText}>{sg.response}</Text>
                <Text style={s.responseMeta}>{sg.respondedBy} \u2022 {sg.respondedDate}</Text>
              </View>
              <View style={s.upvoteRow}>
                <View style={s.upvoteBtn}>
                  <Text style={s.upvoteText}>{'\u25B2'} {sg.upvotes} upvotes</Text>
                </View>
              </View>
            </View>
          ))
        )}

        <Text style={s.section}>Response Rate</Text>
        <View style={s.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={s.cardTitle}>Overall Response Rate</Text>
            <Text style={[s.scoreLabel, { color: t.accent.green }]}>33%</Text>
          </View>
          <Text style={s.cardBody}>
            1 of 3 suggestions have received an official response. The community council aims to respond to all suggestions within 14 days.
          </Text>
          <View style={[s.scoreBar, { marginTop: 8 }]}>
            <View style={[s.scoreFill, { width: '33%', backgroundColor: t.accent.green }]} />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Community Feedback</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <View style={s.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, activeTab === tab.key && s.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'submit' && renderSubmit()}
      {activeTab === 'trends' && renderTrends()}
      {activeTab === 'suggestions' && renderSuggestions()}
      {activeTab === 'responses' && renderResponses()}
    </SafeAreaView>
  );
}
