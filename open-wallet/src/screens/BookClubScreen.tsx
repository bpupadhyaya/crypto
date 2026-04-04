import { fonts } from '../utils/theme';
/**
 * Book Club Screen — Community book clubs, reading challenges, literary discussions.
 *
 * Article I: "Education enriches the mind and earns eOTK recognition
 *  for every learner, reader, and thinker."
 * Article III: eOTK represents educational value.
 *
 * Features:
 * - Active book clubs (name, current book, members, meeting schedule)
 * - Join/create club
 * - Reading challenges (community reading goals — books per month/year)
 * - Book discussions (threads per chapter/theme)
 * - Book recommendations (community-curated, by genre)
 * - eOTK earned for completing books and active discussion participation
 * - Demo mode with sample data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface BookClub {
  id: string;
  name: string;
  currentBook: string;
  currentAuthor: string;
  memberCount: number;
  meetingSchedule: string;
  nextMeeting: string;
  genre: string;
  eotkPerCompletion: number;
  isJoined: boolean;
}

interface ReadingChallenge {
  id: string;
  title: string;
  description: string;
  goalBooks: number;
  completedBooks: number;
  participants: number;
  deadline: string;
  eotkReward: number;
  active: boolean;
}

interface DiscussionThread {
  id: string;
  bookTitle: string;
  topic: string;
  author: string;
  replies: number;
  lastActivity: string;
  eotkEarnedParticipation: number;
}

interface BookRecommendation {
  id: string;
  title: string;
  author: string;
  genre: string;
  recommender: string;
  upvotes: number;
  description: string;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const GENRES = [
  { key: 'all', label: 'All' },
  { key: 'fiction', label: 'Fiction' },
  { key: 'nonfiction', label: 'Non-Fiction' },
  { key: 'science', label: 'Science' },
  { key: 'philosophy', label: 'Philosophy' },
  { key: 'history', label: 'History' },
];

// ─── Demo Data ───

const DEMO_CLUBS: BookClub[] = [
  {
    id: 'c1', name: 'Riverside Readers', currentBook: 'Sapiens', currentAuthor: 'Yuval Noah Harari',
    memberCount: 24, meetingSchedule: 'Every Saturday 10am', nextMeeting: '2026-04-05',
    genre: 'nonfiction', eotkPerCompletion: 500, isJoined: true,
  },
  {
    id: 'c2', name: 'Sci-Fi Explorers', currentBook: 'Project Hail Mary', currentAuthor: 'Andy Weir',
    memberCount: 18, meetingSchedule: 'Bi-weekly Wednesday 7pm', nextMeeting: '2026-04-09',
    genre: 'fiction', eotkPerCompletion: 500, isJoined: false,
  },
];

const DEMO_CHALLENGE: ReadingChallenge = {
  id: 'ch1', title: '12 Books in 12 Months', description: 'Read one book per month as a community. Diverse genres encouraged.',
  goalBooks: 12, completedBooks: 3, participants: 142, deadline: '2026-12-31', eotkReward: 2400, active: true,
};

const DEMO_DISCUSSIONS: DiscussionThread[] = [
  { id: 'd1', bookTitle: 'Sapiens', topic: 'Ch. 5: The Agricultural Revolution — Progress or Trap?', author: 'openchain1abc...reader_sam', replies: 18, lastActivity: '2h ago', eotkEarnedParticipation: 50 },
  { id: 'd2', bookTitle: 'Sapiens', topic: 'What does "imagined order" mean for crypto?', author: 'openchain1def...thinker_li', replies: 32, lastActivity: '4h ago', eotkEarnedParticipation: 50 },
  { id: 'd3', bookTitle: 'Project Hail Mary', topic: 'Rocky is the best character — discuss', author: 'openchain1ghi...scifi_maya', replies: 45, lastActivity: '1d ago', eotkEarnedParticipation: 50 },
  { id: 'd4', bookTitle: 'Atomic Habits', topic: 'Habit stacking: real results from members', author: 'openchain1jkl...growth_raj', replies: 27, lastActivity: '2d ago', eotkEarnedParticipation: 50 },
];

const DEMO_RECOMMENDATIONS: BookRecommendation[] = [
  { id: 'r1', title: 'The Alchemist', author: 'Paulo Coelho', genre: 'fiction', recommender: 'openchain1abc...reader_sam', upvotes: 89, description: 'A timeless journey about following your personal legend.' },
  { id: 'r2', title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', genre: 'science', recommender: 'openchain1def...thinker_li', upvotes: 72, description: 'How two systems of thought shape our decisions and judgments.' },
  { id: 'r3', title: 'Meditations', author: 'Marcus Aurelius', genre: 'philosophy', recommender: 'openchain1ghi...stoic_nina', upvotes: 64, description: 'Timeless Stoic wisdom from a Roman emperor. Essential reading.' },
];

type Tab = 'clubs' | 'challenges' | 'discuss' | 'recommend';

export function BookClubScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('clubs');
  const [genreFilter, setGenreFilter] = useState('all');
  const [newClubName, setNewClubName] = useState('');
  const [newClubGenre, setNewClubGenre] = useState('');
  const [showCreateClub, setShowCreateClub] = useState(false);
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const clubs = DEMO_CLUBS;
  const challenge = DEMO_CHALLENGE;
  const discussions = DEMO_DISCUSSIONS;
  const recommendations = useMemo(() => {
    if (genreFilter === 'all') return DEMO_RECOMMENDATIONS;
    return DEMO_RECOMMENDATIONS.filter((r) => r.genre === genreFilter);
  }, [genreFilter]);

  const handleJoinClub = useCallback((club: BookClub) => {
    Alert.alert(
      'Joined!',
      `You joined "${club.name}". Next meeting: ${club.nextMeeting}.\nCurrently reading: ${club.currentBook} by ${club.currentAuthor}.`,
    );
  }, []);

  const handleCreateClub = useCallback(() => {
    if (!newClubName.trim()) {
      Alert.alert('Required', 'Enter a club name.');
      return;
    }
    Alert.alert(
      'Club Created!',
      `"${newClubName}" is now live. Invite members and pick your first book!`,
    );
    setNewClubName('');
    setNewClubGenre('');
    setShowCreateClub(false);
  }, [newClubName]);

  const handleJoinChallenge = useCallback(() => {
    Alert.alert(
      'Challenge Joined!',
      `You joined "${challenge.title}". Complete ${challenge.goalBooks} books by ${challenge.deadline} to earn ${challenge.eotkReward} eOTK.`,
    );
  }, [challenge]);

  const handleJoinDiscussion = useCallback((thread: DiscussionThread) => {
    Alert.alert(
      'Discussion',
      `"${thread.topic}"\n\n${thread.replies} replies. Earn ${thread.eotkEarnedParticipation} eOTK for thoughtful participation.`,
    );
  }, []);

  const handleUpvote = useCallback((book: BookRecommendation) => {
    Alert.alert('Upvoted', `You upvoted "${book.title}" by ${book.author}.`);
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.purple + '20' },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.purple },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    // Clubs
    clubCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    clubName: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold },
    clubBook: { color: t.accent.purple, fontSize: fonts.md, fontWeight: fonts.semibold, marginTop: 4 },
    clubAuthor: { color: t.text.muted, fontSize: fonts.sm },
    clubMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 6 },
    clubFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: t.bg.primary },
    eotkText: { color: t.accent.purple, fontSize: fonts.md, fontWeight: fonts.bold },
    joinedBadge: { backgroundColor: t.accent.green + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    joinedText: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold },
    joinBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    joinBtnText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.semibold },
    createBtn: { backgroundColor: t.accent.purple, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginHorizontal: 20, marginBottom: 16 },
    createBtnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md, marginBottom: 12 },
    // Challenge
    challengeCard: { backgroundColor: t.accent.purple + '10', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    challengeTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.heavy },
    challengeDesc: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 6, lineHeight: 20 },
    progressBar: { height: 8, backgroundColor: t.bg.primary, borderRadius: 4, marginTop: 14 },
    progressFill: { height: 8, backgroundColor: t.accent.purple, borderRadius: 4 },
    progressText: { color: t.text.muted, fontSize: fonts.sm, marginTop: 6 },
    challengeStats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 14 },
    challengeStat: { alignItems: 'center' },
    challengeStatValue: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    challengeStatLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    challengeJoinBtn: { backgroundColor: t.accent.purple, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 14 },
    challengeJoinText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    // Discussions
    threadCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    threadBook: { color: t.accent.purple, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1 },
    threadTopic: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, marginTop: 4 },
    threadMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 6 },
    threadFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    threadReplies: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    threadEotk: { color: t.accent.purple, fontSize: fonts.sm, fontWeight: fonts.semibold },
    discussBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
    discussBtnText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.semibold },
    // Recommendations
    genreRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, flexWrap: 'wrap', gap: 6 },
    genreChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: t.bg.secondary },
    genreChipActive: { backgroundColor: t.accent.purple + '20', borderColor: t.accent.purple },
    genreText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    genreTextActive: { color: t.accent.purple },
    recCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    recTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    recAuthor: { color: t.text.muted, fontSize: fonts.sm },
    recDesc: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 6, lineHeight: 20 },
    recFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    recGenre: { color: t.accent.purple, fontSize: fonts.xs, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1 },
    upvoteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: t.bg.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    upvoteText: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    // Misc
    impactCard: { backgroundColor: t.accent.purple + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    impactText: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold, textAlign: 'center', lineHeight: 22 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.bold },
  }), [t]);

  // ─── Tabs ───

  const tabDefs: Array<{ key: Tab; label: string }> = [
    { key: 'clubs', label: 'Clubs' },
    { key: 'challenges', label: 'Challenges' },
    { key: 'discuss', label: 'Discuss' },
    { key: 'recommend', label: 'Recommend' },
  ];

  // ─── Clubs Tab ───

  const renderClubs = () => (
    <>
      <Text style={s.sectionTitle}>Active Book Clubs</Text>
      {clubs.map((club) => (
        <View key={club.id} style={s.clubCard}>
          <Text style={s.clubName}>{club.name}</Text>
          <Text style={s.clubBook}>{club.currentBook}</Text>
          <Text style={s.clubAuthor}>by {club.currentAuthor}</Text>
          <Text style={s.clubMeta}>
            {club.memberCount} members -- {club.meetingSchedule}{'\n'}
            Next: {club.nextMeeting} -- Genre: {club.genre}
          </Text>
          <View style={s.clubFooter}>
            <Text style={s.eotkText}>{club.eotkPerCompletion} eOTK/book</Text>
            {club.isJoined ? (
              <View style={s.joinedBadge}>
                <Text style={s.joinedText}>Joined</Text>
              </View>
            ) : (
              <TouchableOpacity style={s.joinBtn} onPress={() => handleJoinClub(club)}>
                <Text style={s.joinBtnText}>Join Club</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}

      {showCreateClub ? (
        <View style={s.card}>
          <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Create New Club</Text>
          <TextInput
            style={s.input}
            placeholder="Club name"
            placeholderTextColor={t.text.muted}
            value={newClubName}
            onChangeText={setNewClubName}
          />
          <TextInput
            style={s.input}
            placeholder="Genre (e.g., fiction, science, philosophy)"
            placeholderTextColor={t.text.muted}
            value={newClubGenre}
            onChangeText={setNewClubGenre}
          />
          <TouchableOpacity style={s.createBtn} onPress={handleCreateClub}>
            <Text style={s.createBtnText}>Create Club</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={s.createBtn} onPress={() => setShowCreateClub(true)}>
          <Text style={s.createBtnText}>+ Create New Club</Text>
        </TouchableOpacity>
      )}
    </>
  );

  // ─── Challenges Tab ───

  const renderChallenges = () => {
    const progress = challenge.goalBooks > 0 ? challenge.completedBooks / challenge.goalBooks : 0;
    return (
      <>
        <View style={s.challengeCard}>
          <Text style={s.challengeTitle}>{challenge.title}</Text>
          <Text style={s.challengeDesc}>{challenge.description}</Text>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
          </View>
          <Text style={s.progressText}>
            {challenge.completedBooks} / {challenge.goalBooks} books ({Math.round(progress * 100)}%)
          </Text>
          <View style={s.challengeStats}>
            <View style={s.challengeStat}>
              <Text style={s.challengeStatValue}>{challenge.participants}</Text>
              <Text style={s.challengeStatLabel}>Participants</Text>
            </View>
            <View style={s.challengeStat}>
              <Text style={[s.challengeStatValue, { color: t.accent.purple }]}>{challenge.eotkReward}</Text>
              <Text style={s.challengeStatLabel}>eOTK Reward</Text>
            </View>
            <View style={s.challengeStat}>
              <Text style={s.challengeStatValue}>{challenge.deadline.slice(0, 7)}</Text>
              <Text style={s.challengeStatLabel}>Deadline</Text>
            </View>
          </View>
          <TouchableOpacity style={s.challengeJoinBtn} onPress={handleJoinChallenge}>
            <Text style={s.challengeJoinText}>Join Challenge</Text>
          </TouchableOpacity>
        </View>

        <View style={s.impactCard}>
          <Text style={s.impactText}>
            Reading expands consciousness.{'\n'}
            Complete books, discuss ideas, earn eOTK.{'\n'}
            Knowledge shared is knowledge multiplied.
          </Text>
        </View>
      </>
    );
  };

  // ─── Discuss Tab ───

  const renderDiscuss = () => (
    <>
      <Text style={s.sectionTitle}>Book Discussions</Text>
      {discussions.map((thread) => (
        <View key={thread.id} style={s.threadCard}>
          <Text style={s.threadBook}>{thread.bookTitle}</Text>
          <Text style={s.threadTopic}>{thread.topic}</Text>
          <Text style={s.threadMeta}>
            Started by {thread.author.slice(0, 20)}... -- {thread.lastActivity}
          </Text>
          <View style={s.threadFooter}>
            <Text style={s.threadReplies}>{thread.replies} replies</Text>
            <Text style={s.threadEotk}>{thread.eotkEarnedParticipation} eOTK/post</Text>
            <TouchableOpacity style={s.discussBtn} onPress={() => handleJoinDiscussion(thread)}>
              <Text style={s.discussBtnText}>Join</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </>
  );

  // ─── Recommend Tab ───

  const renderRecommend = () => (
    <>
      <View style={s.genreRow}>
        {GENRES.map((g) => (
          <TouchableOpacity
            key={g.key}
            style={[s.genreChip, genreFilter === g.key && s.genreChipActive]}
            onPress={() => setGenreFilter(g.key)}
          >
            <Text style={[s.genreText, genreFilter === g.key && s.genreTextActive]}>{g.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.sectionTitle}>Community Recommendations</Text>
      {recommendations.length === 0 ? (
        <View style={s.impactCard}>
          <Text style={s.impactText}>No recommendations in this genre yet. Be the first!</Text>
        </View>
      ) : (
        recommendations.map((book) => (
          <View key={book.id} style={s.recCard}>
            <Text style={s.recTitle}>{book.title}</Text>
            <Text style={s.recAuthor}>by {book.author}</Text>
            <Text style={s.recDesc}>{book.description}</Text>
            <View style={s.recFooter}>
              <Text style={s.recGenre}>{book.genre}</Text>
              <TouchableOpacity style={s.upvoteBtn} onPress={() => handleUpvote(book)}>
                <Text style={s.upvoteText}>^ {book.upvotes}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </>
  );

  // ─── Render ───

  const renderContent = () => {
    switch (tab) {
      case 'clubs': return renderClubs();
      case 'challenges': return renderChallenges();
      case 'discuss': return renderDiscuss();
      case 'recommend': return renderRecommend();
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Book Club</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      {demoMode && (
        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO DATA</Text>
        </View>
      )}

      <View style={s.tabRow}>
        {tabDefs.map((tb) => (
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
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}
