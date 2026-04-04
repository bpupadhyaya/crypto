import { fonts } from '../utils/theme';
/**
 * Financial Literacy Screen — Financial education for adults.
 *
 * "Economic freedom begins with financial understanding.
 *  Every person deserves the knowledge to build a secure future."
 * — Human Constitution, Article I
 *
 * Budgeting, saving, investing basics, debt management,
 * retirement planning, tax basics — all rewarded with xOTK.
 * Community financial mentors guide members on their journey.
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

interface CourseModule {
  id: string;
  title: string;
  icon: string;
  lessons: number;
  completed: number;
  xOTKReward: number;
  description: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  xOTKReward: number;
}

interface Mentor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  mentees: number;
  icon: string;
  available: boolean;
}

interface HealthMetric {
  label: string;
  value: number;
  max: number;
  icon: string;
  status: 'good' | 'fair' | 'needs-work';
}

/* ── demo data ── */

const DEMO_COURSES: CourseModule[] = [
  { id: 'c1', title: 'Budgeting Basics', icon: '\u{1F4CB}', lessons: 8, completed: 8, xOTKReward: 50, description: 'Track income, categorize expenses, build a monthly budget' },
  { id: 'c2', title: 'Smart Saving', icon: '\u{1F3E6}', lessons: 6, completed: 6, xOTKReward: 40, description: 'Emergency funds, saving strategies, automating savings' },
  { id: 'c3', title: 'Investing Basics', icon: '\u{1F4C8}', lessons: 10, completed: 10, xOTKReward: 80, description: 'Stocks, bonds, index funds, risk tolerance, compound growth' },
  { id: 'c4', title: 'Debt Management', icon: '\u{1F4B3}', lessons: 7, completed: 3, xOTKReward: 45, description: 'Snowball vs avalanche, negotiation, credit scores' },
  { id: 'c5', title: 'Retirement Planning', icon: '\u{1F3D6}', lessons: 8, completed: 0, xOTKReward: 60, description: '401k, IRA, pension, withdrawal strategies, target dates' },
  { id: 'c6', title: 'Tax Basics', icon: '\u{1F4DD}', lessons: 6, completed: 0, xOTKReward: 40, description: 'Deductions, credits, filing strategies, tax-advantaged accounts' },
];

const DEMO_QUIZZES: QuizQuestion[] = [
  { id: 'q1', question: 'What is the recommended size of an emergency fund?', options: ['1 month expenses', '3-6 months expenses', '1 year salary', '10% of savings'], correctIndex: 1, xOTKReward: 5 },
  { id: 'q2', question: 'What does compound interest mean?', options: ['Interest on principal only', 'Interest on interest + principal', 'Fixed monthly payment', 'Government bond rate'], correctIndex: 1, xOTKReward: 5 },
  { id: 'q3', question: 'Which debt payoff strategy targets smallest balance first?', options: ['Avalanche', 'Snowball', 'Consolidation', 'Minimum payment'], correctIndex: 1, xOTKReward: 5 },
];

const DEMO_MENTORS: Mentor[] = [
  { id: 'm1', name: 'Sarah Chen', specialty: 'Investing & Retirement', rating: 4.9, mentees: 23, icon: '\u{1F469}\u{200D}\u{1F4BC}', available: true },
  { id: 'm2', name: 'Marcus Johnson', specialty: 'Budgeting & Debt Freedom', rating: 4.8, mentees: 31, icon: '\u{1F468}\u{200D}\u{1F3EB}', available: true },
  { id: 'm3', name: 'Priya Patel', specialty: 'Tax Planning & Savings', rating: 4.7, mentees: 18, icon: '\u{1F469}\u{200D}\u{1F4BB}', available: false },
];

const DEMO_HEALTH_METRICS: HealthMetric[] = [
  { label: 'Savings Rate', value: 18, max: 100, icon: '\u{1F4B0}', status: 'fair' },
  { label: 'Debt-to-Income', value: 28, max: 100, icon: '\u{1F4CA}', status: 'fair' },
  { label: 'Emergency Fund', value: 75, max: 100, icon: '\u{1F6E1}', status: 'good' },
  { label: 'Investment Diversity', value: 45, max: 100, icon: '\u{1F4C8}', status: 'needs-work' },
  { label: 'Credit Score Health', value: 82, max: 100, icon: '\u{2B50}', status: 'good' },
];

const DEMO_HEALTH_SCORE = 64;
const DEMO_COMPLETED_MODULES = 3;
const DEMO_TOTAL_XOTK = 170;

type Tab = 'courses' | 'tools' | 'mentors' | 'health';

export function FinancialLiteracyScreen({ onClose }: Props) {
  const t = useTheme();
  const { demoMode } = useWalletStore();
  const [activeTab, setActiveTab] = useState<Tab>('courses');
  const [selectedQuiz, setSelectedQuiz] = useState<number | null>(null);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [calcPrincipal] = useState(10000);
  const [calcRate] = useState(7);
  const [calcYears] = useState(20);

  const compoundResult = useMemo(() => {
    return Math.round(calcPrincipal * Math.pow(1 + calcRate / 100, calcYears));
  }, [calcPrincipal, calcRate, calcYears]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    heroCard: { backgroundColor: t.accent.green + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, width: '100%' },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 22, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 16, backgroundColor: t.bg.card, borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: t.accent.green },
    tabText: { color: t.text.muted, fontSize: 11, fontWeight: fonts.semibold },
    tabTextActive: { color: t.bg.primary },
    section: { marginHorizontal: 20, marginTop: 20 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    cardRow: { flexDirection: 'row', alignItems: 'center' },
    cardIcon: { fontSize: 32, marginRight: 14 },
    cardInfo: { flex: 1 },
    cardTitle: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    cardDesc: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    progressBar: { height: 6, backgroundColor: t.border, borderRadius: 3, marginTop: 8 },
    progressFill: { height: 6, borderRadius: 3, backgroundColor: t.accent.green },
    progressText: { color: t.text.secondary, fontSize: 11, marginTop: 4 },
    xotkBadge: { color: t.accent.green, fontSize: 13, fontWeight: fonts.bold, marginTop: 4 },
    completedBadge: { backgroundColor: t.accent.green + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    completedText: { color: t.accent.green, fontSize: 11, fontWeight: fonts.bold },
    // Quiz styles
    quizCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 18, marginBottom: 12 },
    quizQuestion: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold, marginBottom: 12 },
    quizOption: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: t.border },
    quizOptionSelected: { borderColor: t.accent.blue, backgroundColor: t.accent.blue + '10' },
    quizOptionCorrect: { borderColor: t.accent.green, backgroundColor: t.accent.green + '10' },
    quizOptionWrong: { borderColor: t.accent.red, backgroundColor: t.accent.red + '10' },
    quizOptionText: { color: t.text.primary, fontSize: 14 },
    quizReward: { color: t.accent.green, fontSize: 12, fontWeight: fonts.semibold, textAlign: 'center', marginTop: 8 },
    // Calculator styles
    calcCard: { backgroundColor: t.bg.card, borderRadius: 20, padding: 20, marginBottom: 16 },
    calcTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12 },
    calcRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    calcLabel: { color: t.text.secondary, fontSize: 13 },
    calcValue: { color: t.text.primary, fontSize: 13, fontWeight: fonts.bold },
    calcResult: { backgroundColor: t.accent.green + '15', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
    calcResultLabel: { color: t.text.muted, fontSize: 12 },
    calcResultValue: { color: t.accent.green, fontSize: 28, fontWeight: fonts.heavy, marginTop: 4 },
    calcResultGain: { color: t.text.secondary, fontSize: 12, marginTop: 4 },
    // Mentor styles
    mentorCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
    mentorIcon: { fontSize: 36, marginRight: 14 },
    mentorInfo: { flex: 1 },
    mentorName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    mentorSpecialty: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    mentorStats: { flexDirection: 'row', marginTop: 6, gap: 12 },
    mentorStat: { color: t.text.secondary, fontSize: 11 },
    connectBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
    connectBtnDisabled: { backgroundColor: t.border },
    connectBtnText: { color: '#fff', fontSize: 12, fontWeight: fonts.bold },
    // Health styles
    healthScoreCard: { backgroundColor: t.bg.card, borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 16 },
    healthScoreCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 6, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    healthScoreValue: { fontSize: 32, fontWeight: fonts.heavy },
    healthScoreLabel: { color: t.text.muted, fontSize: 13 },
    healthMetricCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 14, marginBottom: 10 },
    healthMetricRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    healthMetricIcon: { fontSize: 22, marginRight: 10 },
    healthMetricLabel: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold, flex: 1 },
    healthMetricValue: { fontSize: 14, fontWeight: fonts.bold },
    healthBar: { height: 8, backgroundColor: t.border, borderRadius: 4 },
    healthBarFill: { height: 8, borderRadius: 4 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.semibold },
    goalCard: { backgroundColor: t.accent.blue + '10', borderRadius: 16, padding: 16, marginBottom: 12 },
    goalTitle: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    goalDesc: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    goalAmount: { color: t.accent.blue, fontSize: 20, fontWeight: fonts.heavy, marginTop: 8 },
  }), [t]);

  const getHealthColor = (status: 'good' | 'fair' | 'needs-work') => {
    switch (status) {
      case 'good': return t.accent.green;
      case 'fair': return t.accent.orange;
      case 'needs-work': return t.accent.red;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return t.accent.green;
    if (score >= 50) return t.accent.orange;
    return t.accent.red;
  };

  const renderTabs = () => {
    const tabs: { key: Tab; label: string }[] = [
      { key: 'courses', label: 'Courses' },
      { key: 'tools', label: 'Tools' },
      { key: 'mentors', label: 'Mentors' },
      { key: 'health', label: 'Health' },
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

  const renderCourses = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Course Modules</Text>
      {DEMO_COURSES.map((course) => {
        const isComplete = course.completed >= course.lessons;
        const progress = course.lessons > 0 ? course.completed / course.lessons : 0;
        return (
          <View key={course.id} style={s.card}>
            <View style={s.cardRow}>
              <Text style={s.cardIcon}>{course.icon}</Text>
              <View style={s.cardInfo}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={s.cardTitle}>{course.title}</Text>
                  {isComplete && (
                    <View style={s.completedBadge}>
                      <Text style={s.completedText}>Completed</Text>
                    </View>
                  )}
                </View>
                <Text style={s.cardDesc}>{course.description}</Text>
                <View style={s.progressBar}>
                  <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
                </View>
                <Text style={s.progressText}>{course.completed}/{course.lessons} lessons</Text>
                <Text style={s.xotkBadge}>+{course.xOTKReward} xOTK on completion</Text>
              </View>
            </View>
          </View>
        );
      })}

      <Text style={[s.sectionTitle, { marginTop: 8 }]}>Quick Quiz</Text>
      {DEMO_QUIZZES.map((quiz, idx) => (
        <View key={quiz.id} style={s.quizCard}>
          <Text style={s.quizQuestion}>{quiz.question}</Text>
          {quiz.options.map((opt, optIdx) => {
            const isSelected = selectedQuiz === idx && quizAnswer === optIdx;
            const showResult = selectedQuiz === idx && quizAnswer !== null;
            const isCorrect = optIdx === quiz.correctIndex;
            return (
              <TouchableOpacity
                key={optIdx}
                style={[
                  s.quizOption,
                  isSelected && s.quizOptionSelected,
                  showResult && isCorrect && s.quizOptionCorrect,
                  showResult && isSelected && !isCorrect && s.quizOptionWrong,
                ]}
                onPress={() => { setSelectedQuiz(idx); setQuizAnswer(optIdx); }}
              >
                <Text style={s.quizOptionText}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
          {selectedQuiz === idx && quizAnswer !== null && quizAnswer === quiz.correctIndex && (
            <Text style={s.quizReward}>Correct! +{quiz.xOTKReward} xOTK earned</Text>
          )}
        </View>
      ))}
    </View>
  );

  const renderTools = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Savings Calculator</Text>

      <View style={s.calcCard}>
        <Text style={s.calcTitle}>Compound Interest Calculator</Text>
        <View style={s.calcRow}>
          <Text style={s.calcLabel}>Initial Investment</Text>
          <Text style={s.calcValue}>${calcPrincipal.toLocaleString()}</Text>
        </View>
        <View style={s.calcRow}>
          <Text style={s.calcLabel}>Annual Return</Text>
          <Text style={s.calcValue}>{calcRate}%</Text>
        </View>
        <View style={s.calcRow}>
          <Text style={s.calcLabel}>Time Period</Text>
          <Text style={s.calcValue}>{calcYears} years</Text>
        </View>
        <View style={s.calcResult}>
          <Text style={s.calcResultLabel}>Future Value</Text>
          <Text style={s.calcResultValue}>${compoundResult.toLocaleString()}</Text>
          <Text style={s.calcResultGain}>
            Total gain: ${(compoundResult - calcPrincipal).toLocaleString()} ({Math.round((compoundResult / calcPrincipal - 1) * 100)}%)
          </Text>
        </View>
      </View>

      <Text style={s.sectionTitle}>Goal Planner</Text>

      <View style={s.goalCard}>
        <Text style={s.goalTitle}>Emergency Fund Goal</Text>
        <Text style={s.goalDesc}>6 months of expenses saved</Text>
        <Text style={s.goalAmount}>$15,000 / $20,000</Text>
        <View style={[s.progressBar, { marginTop: 8 }]}>
          <View style={[s.progressFill, { width: '75%' }]} />
        </View>
        <Text style={s.progressText}>75% complete — on track for August 2026</Text>
      </View>

      <View style={s.goalCard}>
        <Text style={s.goalTitle}>Investment Portfolio</Text>
        <Text style={s.goalDesc}>Build diversified portfolio to $50k</Text>
        <Text style={s.goalAmount}>$22,500 / $50,000</Text>
        <View style={[s.progressBar, { marginTop: 8 }]}>
          <View style={[s.progressFill, { width: '45%', backgroundColor: t.accent.blue }]} />
        </View>
        <Text style={s.progressText}>45% complete — target Dec 2027</Text>
      </View>

      <View style={s.goalCard}>
        <Text style={s.goalTitle}>Debt Freedom</Text>
        <Text style={s.goalDesc}>Pay off remaining credit card balance</Text>
        <Text style={s.goalAmount}>$2,100 remaining</Text>
        <View style={[s.progressBar, { marginTop: 8 }]}>
          <View style={[s.progressFill, { width: '80%', backgroundColor: t.accent.purple }]} />
        </View>
        <Text style={s.progressText}>80% paid off — 4 months to go</Text>
      </View>
    </View>
  );

  const renderMentors = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Community Financial Mentors</Text>
      <Text style={[s.cardDesc, { marginBottom: 16 }]}>
        Experienced members who volunteer to guide others on their financial journey.
      </Text>
      {DEMO_MENTORS.map((mentor) => (
        <View key={mentor.id} style={s.mentorCard}>
          <Text style={s.mentorIcon}>{mentor.icon}</Text>
          <View style={s.mentorInfo}>
            <Text style={s.mentorName}>{mentor.name}</Text>
            <Text style={s.mentorSpecialty}>{mentor.specialty}</Text>
            <View style={s.mentorStats}>
              <Text style={s.mentorStat}>Rating: {mentor.rating}/5</Text>
              <Text style={s.mentorStat}>{mentor.mentees} mentees</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[s.connectBtn, !mentor.available && s.connectBtnDisabled]}
            onPress={() => {}}
          >
            <Text style={s.connectBtnText}>{mentor.available ? 'Connect' : 'Busy'}</Text>
          </TouchableOpacity>
        </View>
      ))}

      <View style={[s.card, { marginTop: 8, alignItems: 'center' }]}>
        <Text style={{ fontSize: 32, marginBottom: 8 }}>{'\u{1F31F}'}</Text>
        <Text style={[s.cardTitle, { textAlign: 'center' }]}>Become a Mentor</Text>
        <Text style={[s.cardDesc, { textAlign: 'center', marginTop: 4 }]}>
          Share your financial knowledge and earn xOTK by helping others build financial literacy.
        </Text>
        <TouchableOpacity style={[s.connectBtn, { marginTop: 12, paddingHorizontal: 20, paddingVertical: 10 }]}>
          <Text style={s.connectBtnText}>Apply to Mentor</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHealth = () => (
    <View style={s.section}>
      <View style={s.healthScoreCard}>
        <View style={[s.healthScoreCircle, { borderColor: getScoreColor(DEMO_HEALTH_SCORE) }]}>
          <Text style={[s.healthScoreValue, { color: getScoreColor(DEMO_HEALTH_SCORE) }]}>
            {DEMO_HEALTH_SCORE}
          </Text>
        </View>
        <Text style={s.healthScoreLabel}>Financial Health Score</Text>
        <Text style={[s.cardDesc, { textAlign: 'center', marginTop: 8 }]}>
          Based on savings rate, debt-to-income ratio, emergency fund, investment diversity, and credit health.
        </Text>
      </View>

      <Text style={s.sectionTitle}>Health Breakdown</Text>
      {DEMO_HEALTH_METRICS.map((metric) => (
        <View key={metric.label} style={s.healthMetricCard}>
          <View style={s.healthMetricRow}>
            <Text style={s.healthMetricIcon}>{metric.icon}</Text>
            <Text style={s.healthMetricLabel}>{metric.label}</Text>
            <Text style={[s.healthMetricValue, { color: getHealthColor(metric.status) }]}>
              {metric.value}%
            </Text>
          </View>
          <View style={s.healthBar}>
            <View style={[s.healthBarFill, { width: `${metric.value}%`, backgroundColor: getHealthColor(metric.status) }]} />
          </View>
        </View>
      ))}

      <View style={[s.card, { marginTop: 8 }]}>
        <Text style={s.cardTitle}>Recommendations</Text>
        <Text style={[s.cardDesc, { marginTop: 8 }]}>
          {'\u{2022}'} Increase savings rate from 18% to 20% — small change, big impact{'\n'}
          {'\u{2022}'} Diversify investments beyond index funds{'\n'}
          {'\u{2022}'} Complete Debt Management course to optimize payoff strategy{'\n'}
          {'\u{2022}'} Start Retirement Planning course — early start = exponential gains
        </Text>
      </View>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'courses': return renderCourses();
      case 'tools': return renderTools();
      case 'mentors': return renderMentors();
      case 'health': return renderHealth();
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Financial Literacy</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.heroCard}>
          <Text style={s.heroIcon}>{'\u{1F4B0}'}</Text>
          <Text style={s.heroTitle}>Your Financial Journey</Text>
          <Text style={s.heroSubtitle}>
            Master money management, build wealth, achieve freedom
          </Text>
          <View style={s.statRow}>
            <View style={s.statItem}>
              <Text style={s.statValue}>{DEMO_HEALTH_SCORE}</Text>
              <Text style={s.statLabel}>Health Score</Text>
            </View>
            <View style={s.statItem}>
              <Text style={s.statValue}>{DEMO_COMPLETED_MODULES}</Text>
              <Text style={s.statLabel}>Completed</Text>
            </View>
            <View style={s.statItem}>
              <Text style={[s.statValue, { color: t.accent.green }]}>{DEMO_TOTAL_XOTK}</Text>
              <Text style={s.statLabel}>xOTK Earned</Text>
            </View>
            <View style={s.statItem}>
              <Text style={s.statValue}>2</Text>
              <Text style={s.statLabel}>Mentors</Text>
            </View>
          </View>
        </View>

        {demoMode && (
          <View style={s.demoTag}>
            <Text style={s.demoText}>Demo Mode — Sample Data</Text>
          </View>
        )}

        {renderTabs()}
        {renderContent()}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
