import { fonts } from '../utils/theme';
/**
 * Library Screen — Community book exchange and knowledge sharing.
 *
 * Article I: "Every shared book multiplies human knowledge."
 * eOTK represents education and knowledge value.
 *
 * Features:
 * - Book catalog — community-shared books with availability status
 * - Borrow/lend tracking (who has what, due dates, waitlist)
 * - Reading groups — join book clubs, discuss, earn eOTK
 * - Knowledge sharing — share tutorials, guides, how-tos
 * - Book donations — donate books to community library
 * - Reading stats (books read, pages, genres, eOTK earned)
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

interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  donatedBy: string;
  available: boolean;
  borrowedBy: string | null;
  dueDate: string | null;
  waitlist: number;
  pages: number;
  eOTKValue: number;
}

interface BorrowRecord {
  id: string;
  bookId: string;
  bookTitle: string;
  borrower: string;
  borrowDate: string;
  dueDate: string;
  returned: boolean;
  eOTKEarned: number;
}

interface ReadingGroup {
  id: string;
  name: string;
  currentBook: string;
  members: number;
  meetingDay: string;
  eOTKReward: number;
  nextMeeting: string;
  description: string;
}

interface KnowledgeItem {
  id: string;
  title: string;
  type: 'tutorial' | 'guide' | 'howto' | 'review';
  author: string;
  views: number;
  eOTKEarned: number;
  date: string;
}

interface ReadingStats {
  booksRead: number;
  pagesRead: number;
  booksLent: number;
  booksDonated: number;
  topGenre: string;
  totalEOTK: number;
  groupsJoined: number;
  guidesShared: number;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const GENRES = [
  { key: 'fiction', label: 'Fiction', icon: 'F' },
  { key: 'science', label: 'Science', icon: 'S' },
  { key: 'history', label: 'History', icon: 'H' },
  { key: 'philosophy', label: 'Philosophy', icon: 'P' },
  { key: 'selfhelp', label: 'Self-Help', icon: '+' },
  { key: 'tech', label: 'Technology', icon: 'T' },
];

const KNOWLEDGE_TYPES: Record<string, string> = {
  tutorial: 'Tutorial',
  guide: 'Guide',
  howto: 'How-To',
  review: 'Review',
};

// ─── Demo Data ───

const DEMO_BOOKS: Book[] = [
  { id: 'b1', title: 'Sapiens: A Brief History of Humankind', author: 'Yuval Noah Harari', genre: 'history', donatedBy: 'openchain1abc...reader_sam', available: true, borrowedBy: null, dueDate: null, waitlist: 0, pages: 443, eOTKValue: 50 },
  { id: 'b2', title: 'The Pragmatic Programmer', author: 'David Thomas & Andrew Hunt', genre: 'tech', donatedBy: 'you', available: false, borrowedBy: 'openchain1def...coder_maria', dueDate: '2026-04-10', waitlist: 2, pages: 352, eOTKValue: 45 },
  { id: 'b3', title: 'Meditations', author: 'Marcus Aurelius', genre: 'philosophy', donatedBy: 'openchain1ghi...thinker_raj', available: true, borrowedBy: null, dueDate: null, waitlist: 0, pages: 256, eOTKValue: 40 },
  { id: 'b4', title: 'Atomic Habits', author: 'James Clear', genre: 'selfhelp', donatedBy: 'openchain1jkl...coach_li', available: false, borrowedBy: 'you', dueDate: '2026-04-05', waitlist: 1, pages: 320, eOTKValue: 42 },
  { id: 'b5', title: 'A Short History of Nearly Everything', author: 'Bill Bryson', genre: 'science', donatedBy: 'openchain1mno...science_yuki', available: true, borrowedBy: null, dueDate: null, waitlist: 0, pages: 544, eOTKValue: 55 },
  { id: 'b6', title: 'One Hundred Years of Solitude', author: 'Gabriel Garcia Marquez', genre: 'fiction', donatedBy: 'openchain1pqr...lit_aisha', available: true, borrowedBy: null, dueDate: null, waitlist: 0, pages: 417, eOTKValue: 48 },
];

const DEMO_BORROWS: BorrowRecord[] = [
  { id: 'br1', bookId: 'b4', bookTitle: 'Atomic Habits', borrower: 'you', borrowDate: '2026-03-20', dueDate: '2026-04-05', returned: false, eOTKEarned: 42 },
  { id: 'br2', bookId: 'b1', bookTitle: 'Sapiens: A Brief History of Humankind', borrower: 'you', borrowDate: '2026-03-01', dueDate: '2026-03-15', returned: true, eOTKEarned: 50 },
  { id: 'br3', bookId: 'b3', bookTitle: 'Meditations', borrower: 'you', borrowDate: '2026-02-10', dueDate: '2026-02-24', returned: true, eOTKEarned: 40 },
];

const DEMO_GROUPS: ReadingGroup[] = [
  { id: 'g1', name: 'Philosophy Circle', currentBook: 'Meditations', members: 12, meetingDay: 'Wednesday', eOTKReward: 30, nextMeeting: '2026-04-02', description: 'Weekly discussion of classical and modern philosophy texts.' },
  { id: 'g2', name: 'Tech Book Club', currentBook: 'The Pragmatic Programmer', members: 8, meetingDay: 'Saturday', eOTKReward: 25, nextMeeting: '2026-04-05', description: 'Bi-weekly deep dives into software engineering classics.' },
];

const DEMO_KNOWLEDGE: KnowledgeItem[] = [
  { id: 'k1', title: 'Getting Started with Open Chain Validators', type: 'tutorial', author: 'you', views: 142, eOTKEarned: 85, date: '2026-03-25' },
  { id: 'k2', title: 'Home Composting: A Complete Guide', type: 'guide', author: 'openchain1abc...green_sam', views: 89, eOTKEarned: 62, date: '2026-03-22' },
  { id: 'k3', title: 'How to Set Up a Community Library Shelf', type: 'howto', author: 'openchain1def...reader_maria', views: 67, eOTKEarned: 48, date: '2026-03-18' },
  { id: 'k4', title: 'Review: Sapiens by Yuval Noah Harari', type: 'review', author: 'you', views: 54, eOTKEarned: 35, date: '2026-03-15' },
];

const DEMO_STATS: ReadingStats = {
  booksRead: 14,
  pagesRead: 4820,
  booksLent: 6,
  booksDonated: 3,
  topGenre: 'philosophy',
  totalEOTK: 1240,
  groupsJoined: 2,
  guidesShared: 4,
};

type Tab = 'catalog' | 'borrow' | 'groups' | 'share';

export function LibraryScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('catalog');
  const [filterGenre, setFilterGenre] = useState('');
  const [shareTitle, setShareTitle] = useState('');
  const [shareType, setShareType] = useState('');
  const [shareContent, setShareContent] = useState('');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const books = useMemo(() =>
    filterGenre ? DEMO_BOOKS.filter((b) => b.genre === filterGenre) : DEMO_BOOKS,
    [filterGenre],
  );

  const handleBorrow = useCallback((book: Book) => {
    if (!book.available) {
      Alert.alert('Unavailable', `This book is currently borrowed. Waitlist: ${book.waitlist} people.\n\nJoin waitlist?`);
      return;
    }
    Alert.alert('Book Borrowed', `You borrowed "${book.title}".\nDue date: 2 weeks from today.\n\n+${book.eOTKValue} eOTK when you return it.`);
  }, []);

  const handleDonate = useCallback(() => {
    Alert.alert('Donate a Book', 'Enter book details to add to the community library.\n\nYou will earn eOTK when others borrow your donated books.');
  }, []);

  const handleShareKnowledge = useCallback(() => {
    if (!shareTitle.trim()) { Alert.alert('Required', 'Enter a title for your knowledge share.'); return; }
    if (!shareType) { Alert.alert('Required', 'Select a content type.'); return; }
    if (!shareContent.trim()) { Alert.alert('Required', 'Enter the content.'); return; }

    Alert.alert(
      'Knowledge Shared',
      `Your ${KNOWLEDGE_TYPES[shareType] || 'content'} "${shareTitle}" has been published.\n\nYou will earn eOTK as others read it.`,
    );
    setShareTitle('');
    setShareType('');
    setShareContent('');
  }, [shareTitle, shareType, shareContent]);

  const handleJoinGroup = useCallback((group: ReadingGroup) => {
    Alert.alert('Joined Group', `You joined "${group.name}"!\n\nNext meeting: ${group.nextMeeting} (${group.meetingDay})\nCurrent book: ${group.currentBook}\n\n+${group.eOTKReward} eOTK per meeting attended.`);
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.blue + '20' },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.blue },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    // Catalog
    genreRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginBottom: 12, gap: 8 },
    genreChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: t.bg.secondary },
    genreChipActive: { backgroundColor: t.accent.blue + '20', borderColor: t.accent.blue },
    genreChipText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    genreChipTextActive: { color: t.accent.blue },
    bookCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    bookTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    bookAuthor: { color: t.text.muted, fontSize: 13, marginTop: 2 },
    bookMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    bookGenre: { color: t.accent.blue, fontSize: 12, fontWeight: fonts.semibold, textTransform: 'capitalize' },
    bookPages: { color: t.text.muted, fontSize: 12 },
    bookStatus: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    availableBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    availableText: { fontSize: 12, fontWeight: fonts.bold },
    borrowBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    borrowBtnText: { color: '#fff', fontSize: 13, fontWeight: fonts.semibold },
    donateBtn: { backgroundColor: t.accent.green, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginHorizontal: 20, marginBottom: 16 },
    donateBtnText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    eOTKText: { color: t.accent.blue, fontSize: 13, fontWeight: fonts.bold },
    // Borrow
    borrowRow: { flexDirection: 'row', borderBottomColor: t.bg.primary, borderBottomWidth: 1, paddingVertical: 12 },
    borrowIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: t.accent.blue + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    borrowIconText: { color: t.accent.blue, fontSize: 14, fontWeight: fonts.bold },
    borrowInfo: { flex: 1 },
    borrowTitle: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    borrowMeta: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    borrowRight: { alignItems: 'flex-end', justifyContent: 'center' },
    returnBtn: { backgroundColor: t.accent.green, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    returnBtnText: { color: '#fff', fontSize: 12, fontWeight: fonts.semibold },
    // Stats
    statsCard: { backgroundColor: t.accent.blue + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    // Groups
    groupCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    groupName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    groupDesc: { color: t.text.muted, fontSize: 13, marginTop: 4, lineHeight: 18 },
    groupMeta: { color: t.text.muted, fontSize: 12, marginTop: 6 },
    groupFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    groupReward: { color: t.accent.blue, fontSize: 14, fontWeight: fonts.bold },
    joinBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    joinBtnText: { color: '#fff', fontSize: 13, fontWeight: fonts.semibold },
    // Share
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: t.bg.primary },
    typeChipSelected: { backgroundColor: t.accent.blue + '20', borderColor: t.accent.blue },
    typeChipText: { color: t.text.muted, fontSize: 13, fontWeight: fonts.semibold },
    typeChipTextSelected: { color: t.accent.blue },
    submitBtn: { backgroundColor: t.accent.blue, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    knowledgeRow: { flexDirection: 'row', borderBottomColor: t.bg.primary, borderBottomWidth: 1, paddingVertical: 12 },
    knowledgeInfo: { flex: 1 },
    knowledgeTitle: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    knowledgeMeta: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    knowledgeRight: { alignItems: 'flex-end', justifyContent: 'center' },
    knowledgeViews: { color: t.text.muted, fontSize: 12 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },
  }), [t]);

  // ─── Tabs ───

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'catalog', label: 'Catalog' },
    { key: 'borrow', label: 'My Books' },
    { key: 'groups', label: 'Groups' },
    { key: 'share', label: 'Share' },
  ];

  // ─── Catalog Tab ───

  const renderCatalog = () => (
    <>
      <View style={s.genreRow}>
        <TouchableOpacity
          style={[s.genreChip, !filterGenre && s.genreChipActive]}
          onPress={() => setFilterGenre('')}
        >
          <Text style={[s.genreChipText, !filterGenre && s.genreChipTextActive]}>All</Text>
        </TouchableOpacity>
        {GENRES.map((g) => (
          <TouchableOpacity
            key={g.key}
            style={[s.genreChip, filterGenre === g.key && s.genreChipActive]}
            onPress={() => setFilterGenre(filterGenre === g.key ? '' : g.key)}
          >
            <Text style={[s.genreChipText, filterGenre === g.key && s.genreChipTextActive]}>
              {g.icon} {g.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {books.map((book) => (
        <View key={book.id} style={s.bookCard}>
          <Text style={s.bookTitle}>{book.title}</Text>
          <Text style={s.bookAuthor}>{book.author}</Text>
          <View style={s.bookMeta}>
            <Text style={s.bookGenre}>{book.genre}</Text>
            <Text style={s.bookPages}>{book.pages} pages</Text>
            <Text style={s.eOTKText}>+{book.eOTKValue} eOTK</Text>
          </View>
          <View style={s.bookStatus}>
            <View style={[s.availableBadge, { backgroundColor: book.available ? t.accent.green + '20' : t.accent.orange + '20' }]}>
              <Text style={[s.availableText, { color: book.available ? t.accent.green : t.accent.orange }]}>
                {book.available ? 'Available' : `Borrowed${book.waitlist > 0 ? ` (${book.waitlist} waiting)` : ''}`}
              </Text>
            </View>
            <TouchableOpacity style={s.borrowBtn} onPress={() => handleBorrow(book)}>
              <Text style={s.borrowBtnText}>{book.available ? 'Borrow' : 'Join Waitlist'}</Text>
            </TouchableOpacity>
          </View>
          {book.donatedBy === 'you' && (
            <Text style={[s.bookAuthor, { marginTop: 6, fontStyle: 'italic' }]}>Donated by you</Text>
          )}
        </View>
      ))}

      <TouchableOpacity style={s.donateBtn} onPress={handleDonate}>
        <Text style={s.donateBtnText}>Donate a Book</Text>
      </TouchableOpacity>
    </>
  );

  // ─── Borrow Tab ───

  const renderBorrow = () => (
    <>
      {/* Reading Stats */}
      <Text style={s.sectionTitle}>Reading Stats</Text>
      <View style={s.statsCard}>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{DEMO_STATS.booksRead}</Text>
            <Text style={s.statLabel}>Books Read</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statValue}>{DEMO_STATS.pagesRead.toLocaleString()}</Text>
            <Text style={s.statLabel}>Pages</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.blue }]}>{DEMO_STATS.totalEOTK.toLocaleString()}</Text>
            <Text style={s.statLabel}>eOTK Earned</Text>
          </View>
        </View>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{DEMO_STATS.booksLent}</Text>
            <Text style={s.statLabel}>Lent</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statValue}>{DEMO_STATS.booksDonated}</Text>
            <Text style={s.statLabel}>Donated</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statValue}>{DEMO_STATS.groupsJoined}</Text>
            <Text style={s.statLabel}>Groups</Text>
          </View>
        </View>
        <Text style={[s.bookAuthor, { textAlign: 'center', marginTop: 8 }]}>Top genre: {DEMO_STATS.topGenre}</Text>
      </View>

      {/* Borrow History */}
      <Text style={s.sectionTitle}>Borrow History</Text>
      <View style={s.card}>
        {DEMO_BORROWS.map((br) => (
          <View key={br.id} style={s.borrowRow}>
            <View style={s.borrowIcon}>
              <Text style={s.borrowIconText}>B</Text>
            </View>
            <View style={s.borrowInfo}>
              <Text style={s.borrowTitle}>{br.bookTitle}</Text>
              <Text style={s.borrowMeta}>
                {br.borrowDate} — Due: {br.dueDate}
              </Text>
            </View>
            <View style={s.borrowRight}>
              {br.returned ? (
                <>
                  <Text style={s.eOTKText}>+{br.eOTKEarned} eOTK</Text>
                  <Text style={[s.borrowMeta, { color: t.accent.green }]}>Returned</Text>
                </>
              ) : (
                <TouchableOpacity
                  style={s.returnBtn}
                  onPress={() => Alert.alert('Return Book', `Return "${br.bookTitle}" to earn +${br.eOTKEarned} eOTK.`)}
                >
                  <Text style={s.returnBtnText}>Return</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>
    </>
  );

  // ─── Groups Tab ───

  const renderGroups = () => (
    <>
      <Text style={s.sectionTitle}>Reading Groups</Text>
      {DEMO_GROUPS.map((group) => (
        <View key={group.id} style={s.groupCard}>
          <Text style={s.groupName}>{group.name}</Text>
          <Text style={s.groupDesc}>{group.description}</Text>
          <Text style={s.groupMeta}>
            Current book: {group.currentBook} | {group.members} members
          </Text>
          <Text style={s.groupMeta}>
            Meets: {group.meetingDay} | Next: {group.nextMeeting}
          </Text>
          <View style={s.groupFooter}>
            <Text style={s.groupReward}>+{group.eOTKReward} eOTK/meeting</Text>
            <TouchableOpacity style={s.joinBtn} onPress={() => handleJoinGroup(group)}>
              <Text style={s.joinBtnText}>Join</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </>
  );

  // ─── Share Tab ───

  const renderShare = () => (
    <>
      <Text style={s.sectionTitle}>Share Knowledge</Text>
      <View style={s.card}>
        <TextInput
          style={s.input}
          placeholder="Title"
          placeholderTextColor={t.text.muted}
          value={shareTitle}
          onChangeText={setShareTitle}
        />

        <Text style={[s.borrowMeta, { marginBottom: 8 }]}>Content Type</Text>
        <View style={s.typeGrid}>
          {Object.entries(KNOWLEDGE_TYPES).map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[s.typeChip, shareType === key && s.typeChipSelected]}
              onPress={() => setShareType(key)}
            >
              <Text style={[s.typeChipText, shareType === key && s.typeChipTextSelected]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={[s.input, { minHeight: 100, textAlignVertical: 'top' }]}
          placeholder="Write your content here..."
          placeholderTextColor={t.text.muted}
          value={shareContent}
          onChangeText={setShareContent}
          multiline
        />

        <TouchableOpacity style={s.submitBtn} onPress={handleShareKnowledge}>
          <Text style={s.submitText}>Publish</Text>
        </TouchableOpacity>
      </View>

      {/* Community Knowledge */}
      <Text style={s.sectionTitle}>Community Knowledge</Text>
      <View style={s.card}>
        {DEMO_KNOWLEDGE.map((item) => (
          <View key={item.id} style={s.knowledgeRow}>
            <View style={s.knowledgeInfo}>
              <Text style={s.knowledgeTitle}>{item.title}</Text>
              <Text style={s.knowledgeMeta}>
                {KNOWLEDGE_TYPES[item.type]} | {item.author === 'you' ? 'You' : item.author.split('...')[1] || item.author} | {item.date}
              </Text>
            </View>
            <View style={s.knowledgeRight}>
              <Text style={s.eOTKText}>+{item.eOTKEarned} eOTK</Text>
              <Text style={s.knowledgeViews}>{item.views} views</Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Library</Text>
        <View style={{ width: 60 }} />
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {tab === 'catalog' && renderCatalog()}
        {tab === 'borrow' && renderBorrow()}
        {tab === 'groups' && renderGroups()}
        {tab === 'share' && renderShare()}
      </ScrollView>
    </SafeAreaView>
  );
}
