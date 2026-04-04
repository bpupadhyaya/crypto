import { fonts } from '../utils/theme';
/**
 * Civic Education Screen — How governance works, citizen rights, civic participation guide.
 *
 * Article VI: "Every person has the right to understand and participate in governance."
 * gOTK represents governance participation value.
 *
 * Features:
 * - Governance explainers (how proposals work, voting, amendments, DAO creation)
 * - Your civic profile (proposals voted on, governance participation rate, gOTK earned)
 * - Civic quiz/challenge (test governance knowledge, earn gOTK)
 * - Active governance calendar (upcoming votes, proposal deadlines, amendment deliberations)
 * - Constitution study guide (article-by-article breakdown)
 * - Demo: civic score 68, 3 completed quizzes, 2 upcoming votes
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface CivicProfile {
  civicScore: number;
  proposalsVoted: number;
  totalProposals: number;
  participationRate: number;
  gotkEarned: number;
  quizzesCompleted: number;
  streak: number;
  level: string;
}

interface GovernanceExplainer {
  id: string;
  title: string;
  category: 'proposals' | 'voting' | 'amendments' | 'dao';
  summary: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  readTime: number;
  gotkReward: number;
  completed: boolean;
}

interface QuizChallenge {
  id: string;
  title: string;
  category: string;
  questions: number;
  gotkReward: number;
  completed: boolean;
  score: number | null;
  passingScore: number;
}

interface GovernanceEvent {
  id: string;
  title: string;
  type: 'vote' | 'deadline' | 'deliberation' | 'workshop';
  date: string;
  description: string;
  urgent: boolean;
}

interface ConstitutionArticle {
  number: number;
  title: string;
  summary: string;
  keyRights: string[];
  studied: boolean;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const LEVEL_THRESHOLDS: Record<string, { min: number; color: string }> = {
  'Novice Citizen': { min: 0, color: '#8E8E93' },
  'Informed Voter': { min: 30, color: '#34C759' },
  'Active Participant': { min: 50, color: '#007AFF' },
  'Civic Leader': { min: 75, color: '#AF52DE' },
  'Constitutional Scholar': { min: 90, color: '#FF9500' },
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: '#34C759',
  intermediate: '#007AFF',
  advanced: '#AF52DE',
};

// ─── Demo Data ───

const DEMO_PROFILE: CivicProfile = {
  civicScore: 68,
  proposalsVoted: 14,
  totalProposals: 22,
  participationRate: 63.6,
  gotkEarned: 4200,
  quizzesCompleted: 3,
  streak: 5,
  level: 'Active Participant',
};

const DEMO_EXPLAINERS: GovernanceExplainer[] = [
  { id: 'e1', title: 'How Proposals Work', category: 'proposals', summary: 'Learn how community proposals are created, discussed, and decided. From initial idea submission through deliberation to final vote.', difficulty: 'beginner', readTime: 5, gotkReward: 50, completed: true },
  { id: 'e2', title: 'Voting Mechanisms Explained', category: 'voting', summary: 'Understand different voting types: simple majority, supermajority, quadratic voting, and conviction voting used in Open Chain governance.', difficulty: 'beginner', readTime: 7, gotkReward: 70, completed: true },
  { id: 'e3', title: 'Constitutional Amendments', category: 'amendments', summary: 'How The Human Constitution evolves. Amendment proposal requirements, deliberation periods, ratification thresholds, and implementation.', difficulty: 'intermediate', readTime: 10, gotkReward: 100, completed: false },
  { id: 'e4', title: 'Creating a DAO', category: 'dao', summary: 'Step-by-step guide to creating a Decentralized Autonomous Organization within Open Chain. Treasury setup, member roles, and governance rules.', difficulty: 'advanced', readTime: 15, gotkReward: 150, completed: false },
  { id: 'e5', title: 'Delegation and Representatives', category: 'voting', summary: 'How to delegate your voting power to trusted community members and how representative governance works in Open Chain.', difficulty: 'intermediate', readTime: 8, gotkReward: 80, completed: true },
  { id: 'e6', title: 'Proposal Templates and Best Practices', category: 'proposals', summary: 'Write effective proposals that get community support. Templates, formatting guidelines, and strategies for building consensus.', difficulty: 'intermediate', readTime: 12, gotkReward: 120, completed: false },
];

const DEMO_QUIZZES: QuizChallenge[] = [
  { id: 'q1', title: 'Governance Basics', category: 'proposals', questions: 10, gotkReward: 100, completed: true, score: 90, passingScore: 70 },
  { id: 'q2', title: 'Voting Rights & Methods', category: 'voting', questions: 12, gotkReward: 120, completed: true, score: 83, passingScore: 70 },
  { id: 'q3', title: 'The Human Constitution', category: 'amendments', questions: 15, gotkReward: 150, completed: true, score: 73, passingScore: 70 },
  { id: 'q4', title: 'DAO Fundamentals', category: 'dao', questions: 10, gotkReward: 100, completed: false, score: null, passingScore: 70 },
  { id: 'q5', title: 'Advanced Governance', category: 'voting', questions: 20, gotkReward: 200, completed: false, score: null, passingScore: 75 },
];

const DEMO_CALENDAR: GovernanceEvent[] = [
  { id: 'ev1', title: 'Community Fund Allocation Vote', type: 'vote', date: '2026-03-31', description: 'Vote on Q2 community fund distribution across education, infrastructure, and wellness programs.', urgent: true },
  { id: 'ev2', title: 'Amendment 7 Deliberation', type: 'deliberation', date: '2026-04-02', description: 'Open discussion on proposed Amendment 7: expanding digital privacy rights in The Human Constitution.', urgent: false },
  { id: 'ev3', title: 'Parks DAO Proposal Deadline', type: 'deadline', date: '2026-04-05', description: 'Last day to submit proposals for the Parks & Recreation DAO spring initiative.', urgent: true },
  { id: 'ev4', title: 'Governance Workshop: Quadratic Voting', type: 'workshop', date: '2026-04-08', description: 'Interactive workshop on how quadratic voting prevents plutocracy in community decisions.', urgent: false },
  { id: 'ev5', title: 'Infrastructure Upgrade Vote', type: 'vote', date: '2026-04-12', description: 'Vote on network infrastructure upgrades for improved P2P performance.', urgent: false },
];

const DEMO_ARTICLES: ConstitutionArticle[] = [
  { number: 1, title: 'Universal Human Dignity', summary: 'Every person possesses inherent dignity that no institution, technology, or system may diminish.', keyRights: ['Right to dignity', 'Right to basic needs', 'Right to community participation'], studied: true },
  { number: 2, title: 'Education & Knowledge', summary: 'Every person has the right to education and the free exchange of knowledge.', keyRights: ['Right to learn', 'Right to teach', 'Right to access information'], studied: true },
  { number: 3, title: 'Community & Belonging', summary: 'Every person has the right to belong to a community and contribute to its wellbeing.', keyRights: ['Right to community', 'Right to volunteer', 'Right to mutual aid'], studied: true },
  { number: 4, title: 'Health & Wellness', summary: 'Every person has the right to health, wellness, and a life of physical and mental wellbeing.', keyRights: ['Right to healthcare', 'Right to wellness', 'Right to rest'], studied: false },
  { number: 5, title: 'Fair Economy', summary: 'Every person has the right to participate in a fair economic system that values all contributions.', keyRights: ['Right to fair exchange', 'Right to earn', 'Right to financial access'], studied: false },
  { number: 6, title: 'Governance & Voice', summary: 'Every person has the right to participate in decisions that affect their life and community.', keyRights: ['Right to vote', 'Right to propose', 'Right to amend'], studied: true },
  { number: 7, title: 'Privacy & Security', summary: 'Every person has the right to privacy, data sovereignty, and protection from surveillance.', keyRights: ['Right to privacy', 'Right to data ownership', 'Right to encryption'], studied: false },
  { number: 8, title: 'Environment & Stewardship', summary: 'Every person has the responsibility to protect the natural world for future generations.', keyRights: ['Right to clean environment', 'Duty of stewardship', 'Right to sustainable resources'], studied: false },
];

type Tab = 'learn' | 'profile' | 'quiz' | 'calendar';

export function CivicEducationScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('learn');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const profile = DEMO_PROFILE;
  const levelColor = LEVEL_THRESHOLDS[profile.level]?.color || t.text.muted;

  const completedExplainers = useMemo(() =>
    DEMO_EXPLAINERS.filter((e) => e.completed).length,
    [],
  );

  const upcomingVotes = useMemo(() =>
    DEMO_CALENDAR.filter((ev) => ev.type === 'vote'),
    [],
  );

  const handleReadExplainer = useCallback((explainer: GovernanceExplainer) => {
    if (explainer.completed) {
      Alert.alert(explainer.title, `${explainer.summary}\n\nYou have already completed this lesson.`);
    } else {
      Alert.alert(
        explainer.title,
        `${explainer.summary}\n\nRead time: ~${explainer.readTime} min\nReward: ${explainer.gotkReward} gOTK`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Start Reading', onPress: () => Alert.alert('Completed', `You earned ${explainer.gotkReward} gOTK for completing "${explainer.title}".`) },
        ],
      );
    }
  }, []);

  const handleStartQuiz = useCallback((quiz: QuizChallenge) => {
    if (quiz.completed) {
      Alert.alert(
        quiz.title,
        `Score: ${quiz.score}%\nPassing: ${quiz.passingScore}%\nResult: ${(quiz.score || 0) >= quiz.passingScore ? 'PASSED' : 'FAILED'}\n\ngOTK earned: ${quiz.gotkReward}`,
      );
    } else {
      Alert.alert(
        'Start Quiz',
        `${quiz.title}\n${quiz.questions} questions\nPassing score: ${quiz.passingScore}%\nReward: ${quiz.gotkReward} gOTK`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Begin', onPress: () => Alert.alert('Quiz Complete', `You scored 85%! Earned ${quiz.gotkReward} gOTK.`) },
        ],
      );
    }
  }, []);

  const handleEventAction = useCallback((event: GovernanceEvent) => {
    const actions: Record<string, string> = {
      vote: 'Go to Vote',
      deadline: 'Submit Proposal',
      deliberation: 'Join Discussion',
      workshop: 'Register',
    };
    Alert.alert(
      event.title,
      `${event.description}\n\nDate: ${event.date}`,
      [
        { text: 'Dismiss', style: 'cancel' },
        { text: actions[event.type] || 'View', onPress: () => Alert.alert('Action', `Navigating to ${event.type} action...`) },
      ],
    );
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.blue + '20' },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.blue },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    profileHeader: { alignItems: 'center', marginBottom: 16 },
    scoreText: { color: t.text.primary, fontSize: 56, fontWeight: fonts.heavy },
    scoreLabel: { color: t.text.muted, fontSize: fonts.sm, textTransform: 'uppercase', letterSpacing: 1 },
    levelBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 8 },
    levelText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    progressBar: { height: 8, borderRadius: 4, backgroundColor: t.bg.primary, marginTop: 16 },
    progressFill: { height: 8, borderRadius: 4 },
    progressLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 4, textAlign: 'center' },
    explainerCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    explainerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    explainerTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, flex: 1 },
    difficultyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    difficultyText: { fontSize: fonts.xs, fontWeight: fonts.bold, textTransform: 'uppercase' },
    explainerSummary: { color: t.text.muted, fontSize: fonts.sm, marginTop: 8, lineHeight: 19 },
    explainerFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    explainerMeta: { color: t.text.muted, fontSize: fonts.sm },
    explainerReward: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold },
    readBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
    readBtnCompleted: { backgroundColor: t.accent.green + '20' },
    readBtnText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.semibold },
    readBtnTextCompleted: { color: t.accent.green },
    quizCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    quizTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    quizMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    quizFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    quizScore: { fontSize: fonts.md, fontWeight: fonts.bold },
    quizReward: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold },
    quizBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
    quizBtnCompleted: { backgroundColor: t.accent.green + '20' },
    quizBtnText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.semibold },
    quizBtnTextCompleted: { color: t.accent.green },
    eventCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    eventHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    eventTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, flex: 1 },
    urgentBadge: { backgroundColor: '#FF3B30' + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    urgentText: { color: '#FF3B30', fontSize: fonts.xs, fontWeight: fonts.bold },
    eventType: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 6, alignSelf: 'flex-start' },
    eventTypeText: { fontSize: fonts.xs, fontWeight: fonts.bold, textTransform: 'uppercase' },
    eventDesc: { color: t.text.muted, fontSize: fonts.sm, marginTop: 8, lineHeight: 19 },
    eventDate: { color: t.accent.blue, fontSize: fonts.sm, fontWeight: fonts.semibold, marginTop: 8 },
    eventBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-start', marginTop: 10 },
    eventBtnText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.semibold },
    articleCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    articleHeader: { flexDirection: 'row', alignItems: 'center' },
    articleNumber: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    articleNumText: { color: '#fff', fontSize: fonts.lg, fontWeight: fonts.heavy },
    articleTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, flex: 1 },
    articleStudied: { color: t.accent.green, fontSize: fonts.xs, fontWeight: fonts.bold },
    articleSummary: { color: t.text.muted, fontSize: fonts.sm, marginTop: 8, lineHeight: 19 },
    rightsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    rightChip: { backgroundColor: t.accent.blue + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    rightText: { color: t.accent.blue, fontSize: fonts.xs, fontWeight: fonts.semibold },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16, marginHorizontal: 20 },
    summaryItem: { alignItems: 'center', backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, flex: 1, marginHorizontal: 4 },
    summaryValue: { color: t.text.primary, fontSize: fonts.xxl, fontWeight: fonts.heavy },
    summaryLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 4, textAlign: 'center' },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.bold },
    infoCard: { backgroundColor: t.accent.blue + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    infoText: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold, textAlign: 'center', lineHeight: 22 },
  }), [t]);

  // ─── Tabs ───

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'learn', label: 'Learn' },
    { key: 'profile', label: 'Profile' },
    { key: 'quiz', label: 'Quiz' },
    { key: 'calendar', label: 'Calendar' },
  ];

  // ─── Learn Tab ───

  const renderLearn = () => (
    <>
      <View style={s.infoCard}>
        <Text style={s.infoText}>
          Understand how governance works.{'\n'}
          Knowledge is the foundation of participation.
        </Text>
      </View>

      <Text style={s.sectionTitle}>Governance Explainers</Text>
      {DEMO_EXPLAINERS.map((explainer) => (
        <View key={explainer.id} style={s.explainerCard}>
          <View style={s.explainerHeader}>
            <Text style={s.explainerTitle}>{explainer.title}</Text>
            <View style={[s.difficultyBadge, { backgroundColor: DIFFICULTY_COLORS[explainer.difficulty] + '20' }]}>
              <Text style={[s.difficultyText, { color: DIFFICULTY_COLORS[explainer.difficulty] }]}>{explainer.difficulty}</Text>
            </View>
          </View>
          <Text style={s.explainerSummary}>{explainer.summary}</Text>
          <View style={s.explainerFooter}>
            <Text style={s.explainerMeta}>~{explainer.readTime} min read</Text>
            <Text style={s.explainerReward}>{explainer.gotkReward} gOTK</Text>
            <TouchableOpacity
              style={[s.readBtn, explainer.completed && s.readBtnCompleted]}
              onPress={() => handleReadExplainer(explainer)}
            >
              <Text style={[s.readBtnText, explainer.completed && s.readBtnTextCompleted]}>
                {explainer.completed ? 'Completed' : 'Read'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <Text style={s.sectionTitle}>Constitution Study Guide</Text>
      {DEMO_ARTICLES.map((article) => (
        <View key={article.number} style={s.articleCard}>
          <View style={s.articleHeader}>
            <View style={[s.articleNumber, { backgroundColor: article.studied ? t.accent.green : t.accent.blue }]}>
              <Text style={s.articleNumText}>{article.number}</Text>
            </View>
            <Text style={s.articleTitle}>Art. {article.number}: {article.title}</Text>
          </View>
          {article.studied && <Text style={s.articleStudied}>STUDIED</Text>}
          <Text style={s.articleSummary}>{article.summary}</Text>
          <View style={s.rightsRow}>
            {article.keyRights.map((right) => (
              <View key={right} style={s.rightChip}>
                <Text style={s.rightText}>{right}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </>
  );

  // ─── Profile Tab ───

  const renderProfile = () => (
    <>
      <View style={s.card}>
        <View style={s.profileHeader}>
          <Text style={s.scoreLabel}>Civic Score</Text>
          <Text style={s.scoreText}>{profile.civicScore}</Text>
          <View style={[s.levelBadge, { backgroundColor: levelColor }]}>
            <Text style={s.levelText}>{profile.level}</Text>
          </View>
          <Text style={[s.explainerMeta, { marginTop: 6 }]}>
            {profile.streak}-day governance streak
          </Text>
        </View>

        <View style={s.progressBar}>
          <View style={[s.progressFill, { width: `${profile.civicScore}%`, backgroundColor: levelColor }]} />
        </View>
        <Text style={s.progressLabel}>
          {profile.civicScore >= 75 ? 'Almost Civic Leader!' : `${75 - profile.civicScore} points to Civic Leader`}
        </Text>

        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{profile.proposalsVoted}</Text>
            <Text style={s.statLabel}>Votes Cast</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.green }]}>{profile.gotkEarned.toLocaleString()}</Text>
            <Text style={s.statLabel}>gOTK Earned</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statValue}>{profile.quizzesCompleted}</Text>
            <Text style={s.statLabel}>Quizzes</Text>
          </View>
        </View>
      </View>

      <View style={s.card}>
        <Text style={[s.explainerTitle, { marginBottom: 12 }]}>Participation Rate</Text>
        <View style={s.progressBar}>
          <View style={[s.progressFill, { width: `${profile.participationRate}%`, backgroundColor: t.accent.blue }]} />
        </View>
        <Text style={s.progressLabel}>
          {profile.proposalsVoted} of {profile.totalProposals} proposals ({profile.participationRate.toFixed(1)}%)
        </Text>
      </View>

      <View style={s.summaryRow}>
        <View style={s.summaryItem}>
          <Text style={[s.summaryValue, { color: t.accent.blue }]}>{completedExplainers}</Text>
          <Text style={s.summaryLabel}>Lessons Done</Text>
        </View>
        <View style={s.summaryItem}>
          <Text style={[s.summaryValue, { color: t.accent.green }]}>{DEMO_ARTICLES.filter((a) => a.studied).length}</Text>
          <Text style={s.summaryLabel}>Articles Studied</Text>
        </View>
        <View style={s.summaryItem}>
          <Text style={[s.summaryValue, { color: t.accent.orange }]}>{upcomingVotes.length}</Text>
          <Text style={s.summaryLabel}>Upcoming Votes</Text>
        </View>
      </View>

      <View style={s.infoCard}>
        <Text style={s.infoText}>
          You have participated in {profile.participationRate.toFixed(0)}% of governance decisions.{'\n'}
          Keep learning and voting to increase your civic score!
        </Text>
      </View>
    </>
  );

  // ─── Quiz Tab ───

  const renderQuiz = () => (
    <>
      <View style={s.infoCard}>
        <Text style={s.infoText}>
          Test your governance knowledge.{'\n'}
          Pass quizzes to earn gOTK rewards.
        </Text>
      </View>

      <Text style={s.sectionTitle}>Civic Challenges</Text>
      {DEMO_QUIZZES.map((quiz) => (
        <View key={quiz.id} style={s.quizCard}>
          <Text style={s.quizTitle}>{quiz.title}</Text>
          <Text style={s.quizMeta}>
            {quiz.questions} questions | Passing: {quiz.passingScore}% | Category: {quiz.category}
          </Text>
          <View style={s.quizFooter}>
            {quiz.completed ? (
              <Text style={[s.quizScore, { color: (quiz.score || 0) >= quiz.passingScore ? t.accent.green : '#FF3B30' }]}>
                Score: {quiz.score}%
              </Text>
            ) : (
              <Text style={s.quizReward}>{quiz.gotkReward} gOTK</Text>
            )}
            <TouchableOpacity
              style={[s.quizBtn, quiz.completed && s.quizBtnCompleted]}
              onPress={() => handleStartQuiz(quiz)}
            >
              <Text style={[s.quizBtnText, quiz.completed && s.quizBtnTextCompleted]}>
                {quiz.completed ? 'Review' : 'Start Quiz'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <View style={s.card}>
        <Text style={[s.explainerTitle, { textAlign: 'center', marginBottom: 8 }]}>Quiz Stats</Text>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{DEMO_QUIZZES.filter((q) => q.completed).length}/{DEMO_QUIZZES.length}</Text>
            <Text style={s.statLabel}>Completed</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.green }]}>
              {Math.round(DEMO_QUIZZES.filter((q) => q.completed).reduce((sum, q) => sum + (q.score || 0), 0) / Math.max(DEMO_QUIZZES.filter((q) => q.completed).length, 1))}%
            </Text>
            <Text style={s.statLabel}>Avg Score</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.blue }]}>
              {DEMO_QUIZZES.filter((q) => q.completed).reduce((sum, q) => sum + q.gotkReward, 0)}
            </Text>
            <Text style={s.statLabel}>gOTK Earned</Text>
          </View>
        </View>
      </View>
    </>
  );

  // ─── Calendar Tab ───

  const EVENT_TYPE_COLORS: Record<string, string> = {
    vote: t.accent.blue,
    deadline: '#FF3B30',
    deliberation: t.accent.green,
    workshop: '#AF52DE',
  };

  const renderCalendar = () => (
    <>
      <View style={s.summaryRow}>
        <View style={s.summaryItem}>
          <Text style={[s.summaryValue, { color: t.accent.blue }]}>{DEMO_CALENDAR.filter((e) => e.type === 'vote').length}</Text>
          <Text style={s.summaryLabel}>Votes</Text>
        </View>
        <View style={s.summaryItem}>
          <Text style={[s.summaryValue, { color: '#FF3B30' }]}>{DEMO_CALENDAR.filter((e) => e.urgent).length}</Text>
          <Text style={s.summaryLabel}>Urgent</Text>
        </View>
        <View style={s.summaryItem}>
          <Text style={[s.summaryValue, { color: '#AF52DE' }]}>{DEMO_CALENDAR.length}</Text>
          <Text style={s.summaryLabel}>Total Events</Text>
        </View>
      </View>

      <Text style={s.sectionTitle}>Governance Calendar</Text>
      {DEMO_CALENDAR.map((event) => (
        <View key={event.id} style={s.eventCard}>
          <View style={s.eventHeader}>
            <Text style={s.eventTitle}>{event.title}</Text>
            {event.urgent && (
              <View style={s.urgentBadge}>
                <Text style={s.urgentText}>URGENT</Text>
              </View>
            )}
          </View>
          <View style={[s.eventType, { backgroundColor: (EVENT_TYPE_COLORS[event.type] || t.accent.blue) + '20' }]}>
            <Text style={[s.eventTypeText, { color: EVENT_TYPE_COLORS[event.type] || t.accent.blue }]}>{event.type}</Text>
          </View>
          <Text style={s.eventDesc}>{event.description}</Text>
          <Text style={s.eventDate}>{event.date}</Text>
          <TouchableOpacity style={s.eventBtn} onPress={() => handleEventAction(event)}>
            <Text style={s.eventBtnText}>
              {event.type === 'vote' ? 'Go to Vote' : event.type === 'deadline' ? 'Submit' : event.type === 'deliberation' ? 'Join' : 'Register'}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </>
  );

  // ─── Render ───

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Civic Education</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
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

      <ScrollView contentContainerStyle={s.scroll}>
        {tab === 'learn' && renderLearn()}
        {tab === 'profile' && renderProfile()}
        {tab === 'quiz' && renderQuiz()}
        {tab === 'calendar' && renderCalendar()}
      </ScrollView>
    </SafeAreaView>
  );
}
