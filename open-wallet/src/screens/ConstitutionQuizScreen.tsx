/**
 * Constitution Quiz Screen — Art VI (gOTK): Test knowledge of The Human Constitution.
 *
 * Quiz categories mapped to Articles I–X. Earn gOTK for correct answers.
 * Certificate of completion when all 10 Articles are passed.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert, FlatList,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

type Tab = 'quiz' | 'history' | 'leaderboard' | 'certificate';

interface Question {
  id: string;
  text: string;
  type: 'multiple' | 'truefalse';
  options: string[];
  correctIndex: number;
}

interface ArticleQuiz {
  article: number;
  title: string;
  description: string;
  questions: Question[];
}

interface QuizAttempt {
  articleNum: number;
  articleTitle: string;
  score: number;
  total: number;
  date: string;
  gOtkEarned: number;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  articlesCompleted: number;
  gOtkEarned: number;
}

// ─── Quiz Data: Articles I–X ───
const ARTICLE_QUIZZES: ArticleQuiz[] = [
  {
    article: 1, title: 'Right to Life & Dignity',
    description: 'Every human being has inherent dignity and the right to life from birth.',
    questions: [
      { id: 'a1q1', text: 'Article I states that human dignity is conditional on economic productivity.', type: 'truefalse', options: ['True', 'False'], correctIndex: 1 },
      { id: 'a1q2', text: 'What is the foundational right in Article I?', type: 'multiple', options: ['Right to property', 'Right to life and dignity', 'Right to vote', 'Right to work'], correctIndex: 1 },
      { id: 'a1q3', text: 'Article I applies to:', type: 'multiple', options: ['Citizens of democracies', 'All human beings', 'Token holders only', 'Adults over 18'], correctIndex: 1 },
    ],
  },
  {
    article: 2, title: 'Right to Nurture',
    description: 'Every child deserves loving care. Caregivers deserve recognition.',
    questions: [
      { id: 'a2q1', text: 'Nurture is measured in which OTK channel?', type: 'multiple', options: ['eOTK', 'nOTK', 'hOTK', 'cOTK'], correctIndex: 1 },
      { id: 'a2q2', text: 'Article II recognizes that raising children is economically valuable work.', type: 'truefalse', options: ['True', 'False'], correctIndex: 0 },
      { id: 'a2q3', text: 'Who benefits from ripple attribution in nurture?', type: 'multiple', options: ['Only the child', 'Only the parent', 'The entire chain of caregivers', 'No one — it is symbolic'], correctIndex: 2 },
    ],
  },
  {
    article: 3, title: 'Right to Education',
    description: 'Knowledge is a human right. Teachers shape the future.',
    questions: [
      { id: 'a3q1', text: 'Education contributions earn which token channel?', type: 'multiple', options: ['nOTK', 'eOTK', 'gOTK', 'hOTK'], correctIndex: 1 },
      { id: 'a3q2', text: 'In Open Chain, education is limited to formal schooling only.', type: 'truefalse', options: ['True', 'False'], correctIndex: 1 },
      { id: 'a3q3', text: 'A mentor who helps someone learn a skill earns:', type: 'multiple', options: ['Nothing — only schools count', 'eOTK for teaching contribution', 'Cryptocurrency from the student', 'Government salary'], correctIndex: 1 },
      { id: 'a3q4', text: 'Teacher Impact tracking recognizes educators across how many generations?', type: 'multiple', options: ['1 generation', '3 generations', '7 generations (ripple rings)', 'Unlimited'], correctIndex: 2 },
    ],
  },
  {
    article: 4, title: 'Right to Health',
    description: 'Physical and mental health are fundamental human rights.',
    questions: [
      { id: 'a4q1', text: 'Health contributions are tracked as hOTK.', type: 'truefalse', options: ['True', 'False'], correctIndex: 0 },
      { id: 'a4q2', text: 'Article IV covers:', type: 'multiple', options: ['Physical health only', 'Mental health only', 'Both physical and mental health', 'Financial health'], correctIndex: 2 },
      { id: 'a4q3', text: 'A community health worker who helps neighbors earns hOTK at what rate compared to a hospital doctor?', type: 'multiple', options: ['Less — hospitals are more important', 'The same flat rate', 'More — community work is harder', 'Depends on their stake'], correctIndex: 1 },
    ],
  },
  {
    article: 5, title: 'Right to Community',
    description: 'Humans thrive in connected communities, not isolation.',
    questions: [
      { id: 'a5q1', text: 'Community contributions earn which channel?', type: 'multiple', options: ['nOTK', 'cOTK', 'gOTK', 'vOTK'], correctIndex: 1 },
      { id: 'a5q2', text: 'Volunteering is recognized as valuable labor in Article V.', type: 'truefalse', options: ['True', 'False'], correctIndex: 0 },
      { id: 'a5q3', text: 'Community Health Score measures:', type: 'multiple', options: ['Token price', 'Social media followers', 'Connection strength and mutual support', 'GDP per capita'], correctIndex: 2 },
    ],
  },
  {
    article: 6, title: 'Right to Governance',
    description: 'One human, one vote. Democratic self-governance for all.',
    questions: [
      { id: 'a6q1', text: 'In Open Chain governance, voting power is proportional to OTK balance.', type: 'truefalse', options: ['True', 'False'], correctIndex: 1 },
      { id: 'a6q2', text: 'What is the governance model?', type: 'multiple', options: ['Plutocratic — more tokens, more votes', 'One human, one vote via Universal ID', 'Delegated proof of stake', 'Core team decides'], correctIndex: 1 },
      { id: 'a6q3', text: 'Governance participation earns:', type: 'multiple', options: ['Nothing', 'gOTK', 'Bitcoin', 'Social credit'], correctIndex: 1 },
      { id: 'a6q4', text: 'A whale with 1 million OTK gets how many votes?', type: 'multiple', options: ['1 million votes', '1,000 votes', 'Exactly 1 vote', 'Votes proportional to square root of balance'], correctIndex: 2 },
    ],
  },
  {
    article: 7, title: 'Right to Environment',
    description: 'Every human has the right to a healthy planet. Stewardship earns vOTK.',
    questions: [
      { id: 'a7q1', text: 'Environmental stewardship earns vOTK.', type: 'truefalse', options: ['True', 'False'], correctIndex: 0 },
      { id: 'a7q2', text: 'Article VII recognizes environmental care as:', type: 'multiple', options: ['Optional charity', 'Core human contribution', 'Government responsibility only', 'Corporate ESG'], correctIndex: 1 },
      { id: 'a7q3', text: 'The "v" in vOTK stands for:', type: 'multiple', options: ['Virtual', 'Volunteer', 'Verde (green)', 'Verified'], correctIndex: 2 },
    ],
  },
  {
    article: 8, title: 'Right to Identity',
    description: 'Universal ID — one verified identity per human, privacy-preserving.',
    questions: [
      { id: 'a8q1', text: 'Universal ID allows one person to create multiple voting identities.', type: 'truefalse', options: ['True', 'False'], correctIndex: 1 },
      { id: 'a8q2', text: 'Universal ID is:', type: 'multiple', options: ['A government-issued passport', 'A privacy-preserving proof of unique humanity', 'A social media profile', 'An email address'], correctIndex: 1 },
      { id: 'a8q3', text: 'Why is one-human-one-ID important?', type: 'multiple', options: ['For advertising targeting', 'To prevent Sybil attacks and ensure fair governance', 'For government surveillance', 'To limit token supply'], correctIndex: 1 },
    ],
  },
  {
    article: 9, title: 'Right to Peace',
    description: 'World peace through better upbringing — the ultimate goal.',
    questions: [
      { id: 'a9q1', text: 'Open Chain believes peace comes from:', type: 'multiple', options: ['Military strength', 'Economic dominance', 'Better upbringing and human value recognition', 'Ignoring conflicts'], correctIndex: 2 },
      { id: 'a9q2', text: 'The Peace Index measures global well-being across Open Chain communities.', type: 'truefalse', options: ['True', 'False'], correctIndex: 0 },
      { id: 'a9q3', text: 'Article IX connects peace to:', type: 'multiple', options: ['Token price appreciation', 'The chain of causation — nurture leads to peace', 'Weapons reduction treaties', 'Internet access'], correctIndex: 1 },
    ],
  },
  {
    article: 10, title: 'Right to Evolve',
    description: 'The Constitution is a living document — it evolves with humanity.',
    questions: [
      { id: 'a10q1', text: 'The Human Constitution can be amended through governance.', type: 'truefalse', options: ['True', 'False'], correctIndex: 0 },
      { id: 'a10q2', text: 'Who can propose amendments to the Constitution?', type: 'multiple', options: ['Only the founding team', 'Only validators', 'Any human with a Universal ID', 'Nobody — it is immutable'], correctIndex: 2 },
      { id: 'a10q3', text: 'Article X ensures the Constitution:', type: 'multiple', options: ['Never changes', 'Evolves through democratic governance', 'Is controlled by developers', 'Expires after 100 years'], correctIndex: 1 },
    ],
  },
];

// ─── Demo Data ───
const DEMO_HISTORY: QuizAttempt[] = [
  { articleNum: 1, articleTitle: 'Right to Life & Dignity', score: 3, total: 3, date: '2026-03-25', gOtkEarned: 30 },
  { articleNum: 2, articleTitle: 'Right to Nurture', score: 2, total: 3, date: '2026-03-26', gOtkEarned: 20 },
  { articleNum: 6, articleTitle: 'Right to Governance', score: 4, total: 4, date: '2026-03-27', gOtkEarned: 40 },
];

const DEMO_IN_PROGRESS: { articleNum: number; answeredCount: number; totalCount: number } = {
  articleNum: 3, answeredCount: 2, totalCount: 4,
};

const DEMO_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: 'Peace Scholar', score: 98, articlesCompleted: 10, gOtkEarned: 320 },
  { rank: 2, name: 'Constitution Maven', score: 94, articlesCompleted: 10, gOtkEarned: 290 },
  { rank: 3, name: 'Rights Advocate', score: 91, articlesCompleted: 9, gOtkEarned: 270 },
  { rank: 4, name: 'Humanity Student', score: 85, articlesCompleted: 8, gOtkEarned: 240 },
  { rank: 5, name: 'Open Learner', score: 78, articlesCompleted: 7, gOtkEarned: 210 },
  { rank: 6, name: 'You', score: 78, articlesCompleted: 3, gOtkEarned: 90 },
  { rank: 7, name: 'New Citizen', score: 72, articlesCompleted: 5, gOtkEarned: 160 },
  { rank: 8, name: 'Global Thinker', score: 65, articlesCompleted: 4, gOtkEarned: 120 },
];

const GOTK_PER_CORRECT = 10;

export function ConstitutionQuizScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('quiz');
  const [activeQuiz, setActiveQuiz] = useState<ArticleQuiz | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [history, setHistory] = useState<QuizAttempt[]>(DEMO_HISTORY);
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    backBtn: { color: t.accent.blue, fontSize: 16 },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, backgroundColor: t.bg.card, borderRadius: 12, padding: 3 },
    tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    tabBtnActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: '600' },
    tabTextActive: { color: '#fff', fontWeight: '700' },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 24 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    cardTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    cardDesc: { color: t.text.secondary, fontSize: 13, lineHeight: 20, marginTop: 6 },
    articleRow: { flexDirection: 'row', alignItems: 'center' },
    articleNum: { width: 40, height: 40, borderRadius: 20, backgroundColor: t.accent.blue + '20', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    articleNumText: { color: t.accent.blue, fontSize: 16, fontWeight: '800' },
    articleInfo: { flex: 1 },
    articleTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    articleStatus: { fontSize: 12, marginTop: 3 },
    startBtn: { backgroundColor: t.accent.blue, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16, marginTop: 10, alignSelf: 'flex-start' },
    startBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    progressText: { color: t.text.muted, fontSize: 13 },
    progressBar: { height: 6, backgroundColor: t.border, borderRadius: 3, marginBottom: 20 },
    progressFill: { height: 6, borderRadius: 3, backgroundColor: t.accent.blue },
    questionText: { color: t.text.primary, fontSize: 17, fontWeight: '700', lineHeight: 24, marginBottom: 20 },
    optionBtn: { backgroundColor: t.bg.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 10, borderWidth: 2, borderColor: t.border },
    optionSelected: { borderColor: t.accent.blue, backgroundColor: t.accent.blue + '10' },
    optionCorrect: { borderColor: t.accent.green, backgroundColor: t.accent.green + '15' },
    optionWrong: { borderColor: t.accent.red, backgroundColor: t.accent.red + '10' },
    optionText: { color: t.text.primary, fontSize: 15 },
    optionTextSelected: { color: t.accent.blue, fontWeight: '700' },
    navRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
    navBtn: { backgroundColor: t.accent.blue, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24 },
    navBtnDisabled: { opacity: 0.4 },
    navBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    resultCard: { backgroundColor: t.accent.green + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, alignItems: 'center' },
    resultScore: { color: t.text.primary, fontSize: 48, fontWeight: '800' },
    resultLabel: { color: t.text.muted, fontSize: 14, marginTop: 4 },
    resultReward: { color: t.accent.green, fontSize: 18, fontWeight: '700', marginTop: 16 },
    historyCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 10 },
    historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    historyTitle: { color: t.text.primary, fontSize: 14, fontWeight: '700' },
    historyScore: { color: t.accent.green, fontSize: 14, fontWeight: '700' },
    historyDate: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    historyReward: { color: t.accent.blue, fontSize: 12, fontWeight: '600' },
    lbRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border },
    lbRank: { width: 30, color: t.text.primary, fontSize: 15, fontWeight: '800' },
    lbName: { flex: 1, color: t.text.primary, fontSize: 14, fontWeight: '600' },
    lbScore: { color: t.accent.green, fontSize: 14, fontWeight: '700', width: 45, textAlign: 'right' },
    lbGotk: { color: t.accent.blue, fontSize: 12, fontWeight: '600', width: 60, textAlign: 'right' },
    lbHighlight: { backgroundColor: t.accent.blue + '10' },
    certCard: { backgroundColor: t.bg.card, borderRadius: 24, padding: 28, marginHorizontal: 20, alignItems: 'center', borderWidth: 2, borderColor: t.accent.yellow ?? '#ffd700' },
    certTitle: { color: t.accent.yellow ?? '#ffd700', fontSize: 20, fontWeight: '800', textAlign: 'center' },
    certSubtitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', textAlign: 'center', marginTop: 8 },
    certDesc: { color: t.text.secondary, fontSize: 14, textAlign: 'center', marginTop: 12, lineHeight: 22 },
    certStatus: { color: t.text.muted, fontSize: 13, marginTop: 20 },
    certProgress: { color: t.accent.blue, fontSize: 16, fontWeight: '800', marginTop: 8 },
    overallCard: { backgroundColor: t.accent.blue + '10', borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-around' },
    overallStat: { alignItems: 'center' },
    overallValue: { color: t.text.primary, fontSize: 22, fontWeight: '800' },
    overallLabel: { color: t.text.muted, fontSize: 11, marginTop: 4 },
  }), [t]);

  // Compute completed articles from history
  const completedArticles = useMemo(() => {
    const passed = new Set<number>();
    for (const h of history) {
      if (h.score === h.total) passed.add(h.articleNum);
    }
    return passed;
  }, [history]);

  const overallScore = useMemo(() => {
    if (history.length === 0) return 0;
    const totalCorrect = history.reduce((sum, h) => sum + h.score, 0);
    const totalQuestions = history.reduce((sum, h) => sum + h.total, 0);
    return totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  }, [history]);

  const totalGotk = useMemo(() => history.reduce((sum, h) => sum + h.gOtkEarned, 0), [history]);

  const startQuiz = useCallback((quiz: ArticleQuiz) => {
    setActiveQuiz(quiz);
    setCurrentQ(0);
    setAnswers(new Array(quiz.questions.length).fill(null));
    setShowResult(false);
  }, []);

  const selectAnswer = useCallback((optionIndex: number) => {
    if (showResult) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[currentQ] = optionIndex;
      return next;
    });
  }, [currentQ, showResult]);

  const submitQuiz = useCallback(() => {
    if (!activeQuiz) return;
    const correct = activeQuiz.questions.reduce((sum, q, i) => sum + (answers[i] === q.correctIndex ? 1 : 0), 0);
    const earned = correct * GOTK_PER_CORRECT;
    const attempt: QuizAttempt = {
      articleNum: activeQuiz.article,
      articleTitle: activeQuiz.title,
      score: correct,
      total: activeQuiz.questions.length,
      date: new Date().toISOString().split('T')[0],
      gOtkEarned: earned,
    };
    setHistory((prev) => [attempt, ...prev]);
    setShowResult(true);
    if (earned > 0) {
      Alert.alert('Quiz Complete!', `You scored ${correct}/${activeQuiz.questions.length} and earned ${earned} gOTK!`);
    }
  }, [activeQuiz, answers]);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'quiz',        label: 'Quiz' },
    { key: 'history',     label: 'History' },
    { key: 'leaderboard', label: 'Leaders' },
    { key: 'certificate', label: 'Cert' },
  ];

  // ─── Active Quiz View ───
  if (activeQuiz && !showResult) {
    const q = activeQuiz.questions[currentQ];
    const selected = answers[currentQ];
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setActiveQuiz(null)}><Text style={s.backBtn}>Exit Quiz</Text></TouchableOpacity>
          <Text style={s.title}>Art. {activeQuiz.article}</Text>
          <View style={{ width: 70 }} />
        </View>
        <ScrollView style={{ paddingHorizontal: 20 }}>
          <View style={s.progressRow}>
            <Text style={s.progressText}>Question {currentQ + 1} of {activeQuiz.questions.length}</Text>
            <Text style={s.progressText}>{GOTK_PER_CORRECT} gOTK each</Text>
          </View>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${((currentQ + 1) / activeQuiz.questions.length) * 100}%` }]} />
          </View>
          <Text style={s.questionText}>{q.text}</Text>
          {q.options.map((opt, i) => (
            <TouchableOpacity
              key={i}
              style={[s.optionBtn, selected === i && s.optionSelected]}
              onPress={() => selectAnswer(i)}
            >
              <Text style={[s.optionText, selected === i && s.optionTextSelected]}>{opt}</Text>
            </TouchableOpacity>
          ))}
          <View style={s.navRow}>
            <TouchableOpacity
              style={[s.navBtn, currentQ === 0 && s.navBtnDisabled]}
              onPress={() => currentQ > 0 && setCurrentQ(currentQ - 1)}
              disabled={currentQ === 0}
            >
              <Text style={s.navBtnText}>Previous</Text>
            </TouchableOpacity>
            {currentQ < activeQuiz.questions.length - 1 ? (
              <TouchableOpacity
                style={[s.navBtn, selected === null && s.navBtnDisabled]}
                onPress={() => selected !== null && setCurrentQ(currentQ + 1)}
                disabled={selected === null}
              >
                <Text style={s.navBtnText}>Next</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[s.navBtn, { backgroundColor: t.accent.green }, answers.includes(null) && s.navBtnDisabled]}
                onPress={() => !answers.includes(null) && submitQuiz()}
                disabled={answers.includes(null)}
              >
                <Text style={s.navBtnText}>Submit</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Quiz Result View ───
  if (activeQuiz && showResult) {
    const correct = activeQuiz.questions.reduce((sum, q, i) => sum + (answers[i] === q.correctIndex ? 1 : 0), 0);
    const earned = correct * GOTK_PER_CORRECT;
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <View style={{ width: 70 }} />
          <Text style={s.title}>Results</Text>
          <TouchableOpacity onPress={() => { setActiveQuiz(null); setShowResult(false); }}><Text style={s.closeBtn}>Done</Text></TouchableOpacity>
        </View>
        <ScrollView>
          <View style={s.resultCard}>
            <Text style={s.resultScore}>{correct}/{activeQuiz.questions.length}</Text>
            <Text style={s.resultLabel}>Article {activeQuiz.article}: {activeQuiz.title}</Text>
            <Text style={s.resultReward}>+{earned} gOTK earned</Text>
          </View>

          <Text style={s.section}>Review Answers</Text>
          {activeQuiz.questions.map((q, i) => {
            const isCorrect = answers[i] === q.correctIndex;
            return (
              <View key={q.id} style={s.card}>
                <Text style={s.cardTitle}>{i + 1}. {q.text}</Text>
                {q.options.map((opt, oi) => (
                  <View
                    key={oi}
                    style={[
                      s.optionBtn,
                      { marginTop: 6 },
                      oi === q.correctIndex && s.optionCorrect,
                      oi === answers[i] && oi !== q.correctIndex && s.optionWrong,
                    ]}
                  >
                    <Text style={[
                      s.optionText,
                      oi === q.correctIndex && { color: t.accent.green, fontWeight: '700' },
                      oi === answers[i] && oi !== q.correctIndex && { color: t.accent.red },
                    ]}>
                      {opt} {oi === q.correctIndex ? ' (correct)' : ''}{oi === answers[i] && oi !== q.correctIndex ? ' (your answer)' : ''}
                    </Text>
                  </View>
                ))}
              </View>
            );
          })}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Quiz Tab: Article List ───
  const renderQuiz = () => (
    <>
      <View style={s.overallCard}>
        <View style={s.overallStat}>
          <Text style={s.overallValue}>{overallScore}%</Text>
          <Text style={s.overallLabel}>Overall Score</Text>
        </View>
        <View style={s.overallStat}>
          <Text style={s.overallValue}>{completedArticles.size}/10</Text>
          <Text style={s.overallLabel}>Completed</Text>
        </View>
        <View style={s.overallStat}>
          <Text style={s.overallValue}>{totalGotk}</Text>
          <Text style={s.overallLabel}>gOTK Earned</Text>
        </View>
      </View>

      <Text style={s.section}>Articles I — X</Text>
      {ARTICLE_QUIZZES.map((aq) => {
        const completed = completedArticles.has(aq.article);
        const attempted = history.some((h) => h.articleNum === aq.article);
        const inProgress = demoMode && DEMO_IN_PROGRESS.articleNum === aq.article && !attempted;
        return (
          <View key={aq.article} style={s.card}>
            <View style={s.articleRow}>
              <View style={[s.articleNum, completed && { backgroundColor: t.accent.green + '20' }]}>
                <Text style={[s.articleNumText, completed && { color: t.accent.green }]}>
                  {completed ? '\u2713' : aq.article}
                </Text>
              </View>
              <View style={s.articleInfo}>
                <Text style={s.articleTitle}>Art. {aq.article} — {aq.title}</Text>
                <Text style={[s.articleStatus, { color: completed ? t.accent.green : inProgress ? t.accent.blue : t.text.muted }]}>
                  {completed ? 'Passed' : inProgress ? `In progress (${DEMO_IN_PROGRESS.answeredCount}/${DEMO_IN_PROGRESS.totalCount})` : attempted ? 'Attempted — retry for perfect score' : `${aq.questions.length} questions`}
                </Text>
              </View>
            </View>
            <Text style={s.cardDesc}>{aq.description}</Text>
            <TouchableOpacity style={s.startBtn} onPress={() => startQuiz(aq)}>
              <Text style={s.startBtnText}>{completed || attempted ? 'Retake' : inProgress ? 'Continue' : 'Start'}</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </>
  );

  // ─── History Tab ───
  const renderHistory = () => (
    <>
      <Text style={s.section}>Quiz History</Text>
      {history.length === 0 ? (
        <Text style={{ color: t.text.muted, textAlign: 'center', marginTop: 20 }}>No quiz attempts yet. Start learning!</Text>
      ) : (
        history.map((h, i) => (
          <View key={`${h.articleNum}-${h.date}-${i}`} style={s.historyCard}>
            <View style={s.historyRow}>
              <View>
                <Text style={s.historyTitle}>Art. {h.articleNum} — {h.articleTitle}</Text>
                <Text style={s.historyDate}>{h.date}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.historyScore}>{h.score}/{h.total}</Text>
                <Text style={s.historyReward}>+{h.gOtkEarned} gOTK</Text>
              </View>
            </View>
          </View>
        ))
      )}
    </>
  );

  // ─── Leaderboard Tab ───
  const renderLeaderboard = () => (
    <>
      <Text style={s.section}>Top Constitution Scholars</Text>
      <View style={s.card}>
        <View style={[s.lbRow, { borderBottomColor: t.text.muted }]}>
          <Text style={[s.lbRank, { fontWeight: '800', color: t.text.muted }]}>#</Text>
          <Text style={[s.lbName, { color: t.text.muted, fontWeight: '700' }]}>Scholar</Text>
          <Text style={[s.lbScore, { color: t.text.muted }]}>Score</Text>
          <Text style={[s.lbGotk, { color: t.text.muted }]}>gOTK</Text>
        </View>
        {DEMO_LEADERBOARD.map((entry) => (
          <View key={entry.rank} style={[s.lbRow, entry.name === 'You' && s.lbHighlight]}>
            <Text style={s.lbRank}>{entry.rank <= 3 ? ['', '\uD83E\uDD47', '\uD83E\uDD48', '\uD83E\uDD49'][entry.rank] : `${entry.rank}`}</Text>
            <Text style={[s.lbName, entry.name === 'You' && { color: t.accent.blue, fontWeight: '800' }]}>{entry.name}</Text>
            <Text style={s.lbScore}>{entry.score}%</Text>
            <Text style={s.lbGotk}>{entry.gOtkEarned}</Text>
          </View>
        ))}
      </View>
      <View style={[s.card, { marginTop: 4 }]}>
        <Text style={s.cardDesc}>
          Leaderboard ranks scholars by overall quiz score across all Articles.
          Scores update as you retake quizzes and improve. Keep learning!
        </Text>
      </View>
    </>
  );

  // ─── Certificate Tab ───
  const renderCertificate = () => {
    const allPassed = completedArticles.size === 10;
    return (
      <>
        <View style={s.certCard}>
          <Text style={s.certTitle}>Certificate of Completion</Text>
          <Text style={s.certSubtitle}>The Human Constitution</Text>
          <Text style={s.certDesc}>
            {allPassed
              ? 'Congratulations! You have demonstrated comprehensive knowledge of all 10 Articles of The Human Constitution. You are a certified Constitution Scholar.'
              : 'Pass all 10 Article quizzes with a perfect score to earn your Certificate of Completion. Each Article must be passed individually.'}
          </Text>
          <Text style={s.certStatus}>{allPassed ? 'EARNED' : 'IN PROGRESS'}</Text>
          <Text style={s.certProgress}>{completedArticles.size} / 10 Articles Passed</Text>
        </View>

        <Text style={s.section}>Article Status</Text>
        {ARTICLE_QUIZZES.map((aq) => {
          const passed = completedArticles.has(aq.article);
          return (
            <View key={aq.article} style={[s.card, { flexDirection: 'row', alignItems: 'center' }]}>
              <Text style={{ fontSize: 20, marginRight: 12 }}>{passed ? '\u2705' : '\u2B1C'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>Art. {aq.article} — {aq.title}</Text>
                <Text style={{ color: passed ? t.accent.green : t.text.muted, fontSize: 12, marginTop: 2 }}>
                  {passed ? 'Perfect score achieved' : 'Not yet passed'}
                </Text>
              </View>
            </View>
          );
        })}
      </>
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Constitution Quiz</Text>
        <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>Close</Text></TouchableOpacity>
      </View>

      <View style={s.tabRow}>
        {TABS.map((tb) => (
          <TouchableOpacity
            key={tb.key}
            style={[s.tabBtn, tab === tb.key && s.tabBtnActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView>
        {tab === 'quiz'        && renderQuiz()}
        {tab === 'history'     && renderHistory()}
        {tab === 'leaderboard' && renderLeaderboard()}
        {tab === 'certificate' && renderCertificate()}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
