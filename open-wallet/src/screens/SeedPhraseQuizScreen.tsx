import { fonts } from '../utils/theme';
/**
 * Seed Phrase Quiz Screen — Verify user knows their seed phrase.
 *
 * Random word verification quiz, full phrase review with warnings,
 * backup health score tracking, and verification reminder scheduling.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// --- Types ---

interface QuizQuestion {
  position: number;
  correctWord: string;
}

interface VerificationRecord {
  date: string;
  score: number;
  questionsCorrect: number;
  questionsTotal: number;
}

interface Props {
  onClose: () => void;
}

// --- Demo data ---

const DEMO_SEED_WORDS = [
  'abandon', 'ability', 'able', 'about', 'above', 'absent',
  'absorb', 'abstract', 'absurd', 'abuse', 'access', 'accident',
  'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire',
  'across', 'act', 'action', 'actor', 'actress', 'actual',
];

const DEMO_QUIZ: QuizQuestion[] = [
  { position: 5, correctWord: 'above' },
  { position: 12, correctWord: 'accident' },
  { position: 19, correctWord: 'across' },
];

const DEMO_HISTORY: VerificationRecord[] = [
  { date: '2026-03-28', score: 100, questionsCorrect: 3, questionsTotal: 3 },
  { date: '2026-03-01', score: 67, questionsCorrect: 2, questionsTotal: 3 },
  { date: '2026-02-15', score: 100, questionsCorrect: 3, questionsTotal: 3 },
];

// --- Component ---

export function SeedPhraseQuizScreen({ onClose }: Props) {
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showPhrase, setShowPhrase] = useState(false);
  const [reminderSchedule, setReminderSchedule] = useState<'quarterly' | 'annual'>('quarterly');

  const quiz = demoMode ? DEMO_QUIZ : [];
  const seedWords = demoMode ? DEMO_SEED_WORDS : [];
  const history = demoMode ? DEMO_HISTORY : [];

  const healthScore = demoMode ? 85 : 0;
  const lastVerified = demoMode ? '2026-03-28' : 'Never';
  const timesVerified = demoMode ? 3 : 0;
  const daysSinceVerification = demoMode ? 1 : 0;

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    back: { color: t.accent.blue, fontSize: 16, fontWeight: fonts.semibold },
    title: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy },
    placeholder: { width: 50 },
    scroll: { paddingHorizontal: 16, paddingBottom: 40 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginTop: 20, marginBottom: 10 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    healthRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16 },
    healthStat: { alignItems: 'center' },
    healthValue: { fontSize: 28, fontWeight: fonts.heavy },
    healthLabel: { color: t.text.muted, fontSize: 11, marginTop: 4 },
    healthBar: { height: 8, borderRadius: 4, backgroundColor: t.bg.primary, marginTop: 12 },
    healthFill: { height: 8, borderRadius: 4 },
    healthHint: { color: t.text.muted, fontSize: 12, marginTop: 8, textAlign: 'center' },
    quizQuestion: { marginBottom: 16 },
    questionLabel: { color: t.text.primary, fontSize: 15, fontWeight: fonts.semibold, marginBottom: 8 },
    questionInput: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 16, borderWidth: 2, borderColor: 'transparent' },
    inputCorrect: { borderColor: t.accent.green },
    inputIncorrect: { borderColor: t.accent.red },
    resultText: { fontSize: 13, fontWeight: fonts.semibold, marginTop: 4 },
    submitBtn: { backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitBtnText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    retryBtn: { backgroundColor: t.accent.blue, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    retryBtnText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    scoreResult: { alignItems: 'center', paddingVertical: 16 },
    scoreResultValue: { fontSize: 36, fontWeight: fonts.heavy },
    scoreResultLabel: { color: t.text.secondary, fontSize: 14, marginTop: 4 },
    warningBox: { backgroundColor: t.accent.red + '15', borderRadius: 12, padding: 14, marginBottom: 12 },
    warningText: { color: t.accent.red, fontSize: 13, fontWeight: fonts.semibold, lineHeight: 20 },
    revealBtn: { backgroundColor: t.accent.orange, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    revealBtnText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    hideBtn: { backgroundColor: t.accent.red, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    hideBtnText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    phraseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    wordChip: { backgroundColor: t.bg.primary, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, minWidth: 90 },
    wordNumber: { color: t.text.muted, fontSize: 10 },
    wordText: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    historyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.border },
    historyDate: { color: t.text.secondary, fontSize: 13 },
    historyScore: { fontSize: 14, fontWeight: fonts.bold },
    historyDetail: { color: t.text.muted, fontSize: 12 },
    reminderRow: { flexDirection: 'row', gap: 8 },
    reminderBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: t.bg.primary },
    reminderBtnActive: { backgroundColor: t.accent.blue },
    reminderBtnText: { color: t.text.secondary, fontSize: 14, fontWeight: fonts.semibold },
    reminderBtnTextActive: { color: '#fff', fontWeight: fonts.bold },
    setReminderBtn: { backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
    setReminderBtnText: { color: '#fff', fontSize: 14, fontWeight: fonts.bold },
  }), [t]);

  const healthColor = healthScore >= 80 ? t.accent.green : healthScore >= 50 ? t.accent.orange : t.accent.red;

  const getQuizScore = useCallback(() => {
    let correct = 0;
    quiz.forEach((q) => {
      if ((answers[q.position] || '').trim().toLowerCase() === q.correctWord) correct++;
    });
    return { correct, total: quiz.length, percentage: Math.round((correct / quiz.length) * 100) };
  }, [answers, quiz]);

  const handleSubmitQuiz = () => {
    const unanswered = quiz.some((q) => !(answers[q.position] || '').trim());
    if (unanswered) {
      Alert.alert('Incomplete', 'Please answer all questions before submitting.');
      return;
    }
    setSubmitted(true);
    const score = getQuizScore();
    if (score.percentage === 100) {
      Alert.alert('Perfect Score!', 'You correctly identified all seed phrase words. Your backup health score has been updated.');
    } else {
      Alert.alert('Quiz Complete', `You got ${score.correct}/${score.total} correct. Review your seed phrase and try again.`);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
  };

  const handleRevealPhrase = () => {
    Alert.alert(
      'Security Warning',
      'Your seed phrase will be displayed on screen. Make sure no one is watching and you are in a private location.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Show Phrase', onPress: () => setShowPhrase(true) },
      ],
    );
  };

  const handleSetReminder = () => {
    Alert.alert('Reminder Set', `You will be reminded to verify your seed phrase ${reminderSchedule === 'quarterly' ? 'every 3 months' : 'once a year'}.`);
  };

  const quizScore = submitted ? getQuizScore() : null;

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.back}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Seed Phrase Quiz</Text>
        <View style={s.placeholder} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {/* --- Backup Health Score --- */}
        <Text style={s.sectionTitle}>Backup Health</Text>
        <View style={s.card}>
          <View style={s.healthRow}>
            <View style={s.healthStat}>
              <Text style={[s.healthValue, { color: healthColor }]}>{healthScore}</Text>
              <Text style={s.healthLabel}>Health Score</Text>
            </View>
            <View style={s.healthStat}>
              <Text style={[s.healthValue, { color: t.text.primary }]}>{timesVerified}</Text>
              <Text style={s.healthLabel}>Verifications</Text>
            </View>
            <View style={s.healthStat}>
              <Text style={[s.healthValue, { color: daysSinceVerification <= 7 ? t.accent.green : t.accent.orange }]}>{daysSinceVerification}d</Text>
              <Text style={s.healthLabel}>Since Last</Text>
            </View>
          </View>
          <View style={s.healthBar}>
            <View style={[s.healthFill, { width: `${healthScore}%`, backgroundColor: healthColor }]} />
          </View>
          <Text style={s.healthHint}>Last verified: {lastVerified}</Text>
        </View>

        {/* --- Quiz Section --- */}
        <Text style={s.sectionTitle}>Verification Quiz</Text>
        <View style={s.card}>
          {submitted && quizScore && (
            <View style={s.scoreResult}>
              <Text style={[s.scoreResultValue, { color: quizScore.percentage === 100 ? t.accent.green : t.accent.orange }]}>
                {quizScore.percentage}%
              </Text>
              <Text style={s.scoreResultLabel}>{quizScore.correct}/{quizScore.total} correct</Text>
            </View>
          )}

          {quiz.map((q) => {
            const userAnswer = (answers[q.position] || '').trim().toLowerCase();
            const isCorrect = submitted && userAnswer === q.correctWord;
            const isIncorrect = submitted && userAnswer !== q.correctWord;

            return (
              <View key={q.position} style={s.quizQuestion}>
                <Text style={s.questionLabel}>What is word #{q.position}?</Text>
                <TextInput
                  style={[
                    s.questionInput,
                    isCorrect && s.inputCorrect,
                    isIncorrect && s.inputIncorrect,
                  ]}
                  placeholder={`Enter word #${q.position}`}
                  placeholderTextColor={t.text.muted}
                  value={answers[q.position] || ''}
                  onChangeText={(text) => setAnswers((prev) => ({ ...prev, [q.position]: text }))}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!submitted}
                />
                {isCorrect && <Text style={[s.resultText, { color: t.accent.green }]}>Correct!</Text>}
                {isIncorrect && <Text style={[s.resultText, { color: t.accent.red }]}>Incorrect — correct answer: {q.correctWord}</Text>}
              </View>
            );
          })}

          {!submitted ? (
            <TouchableOpacity style={s.submitBtn} onPress={handleSubmitQuiz}>
              <Text style={s.submitBtnText}>Submit Answers</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.retryBtn} onPress={handleRetry}>
              <Text style={s.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* --- Full Phrase Review --- */}
        <Text style={s.sectionTitle}>Full Phrase Review</Text>
        <View style={s.card}>
          <View style={s.warningBox}>
            <Text style={s.warningText}>
              Never share your seed phrase with anyone. Never enter it on a website.
              Anyone with your seed phrase has full control of your wallet.
              Store it offline in a secure location.
            </Text>
          </View>

          {!showPhrase ? (
            <TouchableOpacity style={s.revealBtn} onPress={handleRevealPhrase}>
              <Text style={s.revealBtnText}>Reveal Seed Phrase</Text>
            </TouchableOpacity>
          ) : (
            <>
              <View style={s.phraseGrid}>
                {seedWords.map((word, i) => (
                  <View key={i} style={s.wordChip}>
                    <Text style={s.wordNumber}>#{i + 1}</Text>
                    <Text style={s.wordText}>{word}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity style={[s.hideBtn, { marginTop: 16 }]} onPress={() => setShowPhrase(false)}>
                <Text style={s.hideBtnText}>Hide Seed Phrase</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* --- Verification History --- */}
        <Text style={s.sectionTitle}>Verification History</Text>
        <View style={s.card}>
          {history.map((record, i) => (
            <View key={i} style={[s.historyRow, i === history.length - 1 && { borderBottomWidth: 0 }]}>
              <View>
                <Text style={s.historyDate}>{record.date}</Text>
                <Text style={s.historyDetail}>{record.questionsCorrect}/{record.questionsTotal} correct</Text>
              </View>
              <Text style={[s.historyScore, { color: record.score === 100 ? t.accent.green : t.accent.orange }]}>
                {record.score}%
              </Text>
            </View>
          ))}
        </View>

        {/* --- Schedule Reminders --- */}
        <Text style={s.sectionTitle}>Verification Reminders</Text>
        <View style={s.card}>
          <View style={s.reminderRow}>
            <TouchableOpacity
              style={[s.reminderBtn, reminderSchedule === 'quarterly' && s.reminderBtnActive]}
              onPress={() => setReminderSchedule('quarterly')}
            >
              <Text style={[s.reminderBtnText, reminderSchedule === 'quarterly' && s.reminderBtnTextActive]}>Quarterly</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.reminderBtn, reminderSchedule === 'annual' && s.reminderBtnActive]}
              onPress={() => setReminderSchedule('annual')}
            >
              <Text style={[s.reminderBtnText, reminderSchedule === 'annual' && s.reminderBtnTextActive]}>Annual</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={s.setReminderBtn} onPress={handleSetReminder}>
            <Text style={s.setReminderBtnText}>Set Reminder</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
