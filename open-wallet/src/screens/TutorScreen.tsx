/**
 * Tutor Screen — Peer tutoring marketplace, homework help, study sessions.
 *
 * Article I (eOTK): "Education is the birthright of every human being.
 *  Those who teach multiply human potential across generations."
 * — Human Constitution, Article I
 *
 * Features:
 * - Find tutors by subject (math, science, language, history, coding, music, art)
 * - Tutor profiles (subjects, rating, sessions completed, eOTK earned, availability)
 * - Book a session (time, duration, subject, OTK rate or free)
 * - Become a tutor (register subjects, set availability, set rates)
 * - Session history with ratings and notes
 * - Study room — open drop-in help sessions
 * - Demo: 4 tutors, 2 booked sessions, 1 study room open
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface Props {
  onClose: () => void;
}

interface TutorProfile {
  uid: string;
  name: string;
  subjects: string[];
  rating: number;
  sessionsCompleted: number;
  eOTKEarned: number;
  hourlyRate: number; // 0 = free
  available: boolean;
  bio: string;
}

interface BookedSession {
  id: string;
  tutorUid: string;
  tutorName: string;
  subject: string;
  date: string;
  time: string;
  durationMinutes: number;
  eOTKCost: number;
  status: 'upcoming' | 'completed' | 'cancelled';
  rating?: number;
  notes?: string;
}

interface StudyRoom {
  id: string;
  name: string;
  hostName: string;
  hostUid: string;
  subject: string;
  participantCount: number;
  maxParticipants: number;
  status: 'open' | 'full' | 'closed';
  startedAt: string;
}

// ─── Demo Data ───

const SUBJECTS = ['Math', 'Science', 'Language', 'History', 'Coding', 'Music', 'Art'];

const DEMO_TUTORS: TutorProfile[] = [
  {
    uid: 'uid-tut-001', name: 'Maria Santos', subjects: ['Math', 'Science', 'Coding'],
    rating: 4.9, sessionsCompleted: 47, eOTKEarned: 940, hourlyRate: 20,
    available: true, bio: 'PhD student in applied mathematics. Love making complex topics simple.',
  },
  {
    uid: 'uid-tut-002', name: 'Kenji Yamamoto', subjects: ['Language', 'History'],
    rating: 4.8, sessionsCompleted: 32, eOTKEarned: 480, hourlyRate: 15,
    available: true, bio: 'Polyglot — fluent in 5 languages. History nerd.',
  },
  {
    uid: 'uid-tut-003', name: 'Amara Okafor', subjects: ['Music', 'Art'],
    rating: 5.0, sessionsCompleted: 28, eOTKEarned: 0, hourlyRate: 0,
    available: true, bio: 'Music teacher by day, community artist by night. All sessions free!',
  },
  {
    uid: 'uid-tut-004', name: 'Liam Patel', subjects: ['Coding', 'Math', 'Science'],
    rating: 4.7, sessionsCompleted: 55, eOTKEarned: 1100, hourlyRate: 25,
    available: false, bio: 'Full-stack dev. Specializing in algorithms and data structures.',
  },
];

const DEMO_BOOKED: BookedSession[] = [
  {
    id: 'bs-001', tutorUid: 'uid-tut-001', tutorName: 'Maria Santos',
    subject: 'Calculus', date: '2026-03-30', time: '14:00', durationMinutes: 60,
    eOTKCost: 20, status: 'upcoming',
  },
  {
    id: 'bs-002', tutorUid: 'uid-tut-002', tutorName: 'Kenji Yamamoto',
    subject: 'Japanese Basics', date: '2026-03-28', time: '10:00', durationMinutes: 45,
    eOTKCost: 15, status: 'completed', rating: 5,
    notes: 'Great intro to hiragana and katakana. Very patient teacher!',
  },
];

const DEMO_ROOMS: StudyRoom[] = [
  {
    id: 'sr-001', name: 'Homework Help Hour', hostName: 'Amara Okafor',
    hostUid: 'uid-tut-003', subject: 'Art', participantCount: 4,
    maxParticipants: 10, status: 'open', startedAt: '2026-03-29T13:00:00Z',
  },
];

type Tab = 'find' | 'book' | 'teach' | 'rooms';

const TAB_LABELS: Record<Tab, string> = {
  find: 'Find',
  book: 'Sessions',
  teach: 'Teach',
  rooms: 'Rooms',
};

export function TutorScreen({ onClose }: Props) {
  const t = useTheme();
  const demoMode = useWalletStore((s) => s.demoMode);
  const [activeTab, setActiveTab] = useState<Tab>('find');
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);

  // Teach tab state
  const [regSubjects, setRegSubjects] = useState<string[]>([]);
  const [regBio, setRegBio] = useState('');
  const [regRate, setRegRate] = useState('');

  const filteredTutors = useMemo(() => {
    let list = DEMO_TUTORS;
    if (subjectFilter) {
      list = list.filter((tu) => tu.subjects.includes(subjectFilter));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (tu) => tu.name.toLowerCase().includes(q) || tu.subjects.some((s) => s.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [searchQuery, subjectFilter]);

  const sessionStats = useMemo(() => {
    const upcoming = DEMO_BOOKED.filter((b) => b.status === 'upcoming').length;
    const completed = DEMO_BOOKED.filter((b) => b.status === 'completed').length;
    const totalSpent = DEMO_BOOKED.reduce((sum, b) => sum + b.eOTKCost, 0);
    return { upcoming, completed, totalSpent };
  }, []);

  const toggleRegSubject = useCallback((subj: string) => {
    setRegSubjects((prev) =>
      prev.includes(subj) ? prev.filter((s) => s !== subj) : [...prev, subj],
    );
  }, []);

  const handleBookSession = useCallback((tutor: TutorProfile) => {
    Alert.alert(
      'Book Session',
      `Request a session with ${tutor.name}?\n\nRate: ${tutor.hourlyRate === 0 ? 'Free' : tutor.hourlyRate + ' eOTK/hr'}\nSubjects: ${tutor.subjects.join(', ')}`,
      [{ text: 'Cancel' }, { text: 'Book', onPress: () => Alert.alert('Booked!', 'Session request sent.') }],
    );
  }, []);

  const handleRegister = useCallback(() => {
    if (regSubjects.length === 0) {
      Alert.alert('Select Subjects', 'Pick at least one subject you can tutor.');
      return;
    }
    Alert.alert('Registered!', `You are now a tutor for: ${regSubjects.join(', ')}\n\nRate: ${regRate || '0'} eOTK/hr`);
  }, [regSubjects, regRate]);

  const handleJoinRoom = useCallback((room: StudyRoom) => {
    if (room.status !== 'open') {
      Alert.alert('Unavailable', 'This study room is currently full or closed.');
      return;
    }
    Alert.alert('Joined!', `You joined "${room.name}" hosted by ${room.hostName}.`);
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    heroCard: { backgroundColor: t.accent.blue + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: '800', textAlign: 'center' },
    heroSub: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginTop: 6, lineHeight: 18, fontStyle: 'italic' },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 16, backgroundColor: t.bg.card, borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.muted, fontSize: 11, fontWeight: '600' },
    tabTextActive: { color: '#fff' },
    section: { marginHorizontal: 20, marginTop: 20 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 12 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: '600' },
    searchInput: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 14, borderWidth: 1, borderColor: t.border, marginBottom: 12 },
    filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
    filterChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, backgroundColor: t.bg.card, borderWidth: 1, borderColor: t.border },
    filterChipActive: { borderColor: t.accent.blue, backgroundColor: t.accent.blue + '20' },
    filterText: { color: t.text.secondary, fontSize: 12 },
    filterTextActive: { color: t.accent.blue, fontWeight: '600' },
    tutorCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    tutorName: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    tutorUid: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    tutorBio: { color: t.text.secondary, fontSize: 12, marginTop: 6, lineHeight: 18 },
    tutorSubjects: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    subjectTag: { backgroundColor: t.accent.blue + '20', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
    subjectTagText: { color: t.accent.blue, fontSize: 11, fontWeight: '600' },
    tutorStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    tutorStat: { color: t.text.secondary, fontSize: 12 },
    rateTag: { color: t.accent.green, fontSize: 13, fontWeight: '700', marginTop: 6 },
    availableBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, marginTop: 8, alignSelf: 'flex-start' },
    availableText: { fontSize: 11, fontWeight: '700' },
    bookBtn: { backgroundColor: t.accent.blue, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'flex-end', marginTop: 8 },
    bookBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    // Sessions tab
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 16 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 22, fontWeight: '800' },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    sessionCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4 },
    sessionSubject: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    sessionTutor: { color: t.text.secondary, fontSize: 13, marginTop: 2 },
    sessionDetails: { color: t.text.muted, fontSize: 12, marginTop: 6 },
    sessionStatus: { fontSize: 12, fontWeight: '700', marginTop: 6 },
    sessionRating: { color: t.accent.orange, fontSize: 13, fontWeight: '700', marginTop: 4 },
    sessionNotes: { color: t.text.muted, fontSize: 12, fontStyle: 'italic', marginTop: 4, lineHeight: 18 },
    // Teach tab
    registerLabel: { color: t.text.primary, fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
    subjectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    regChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, backgroundColor: t.bg.card, borderWidth: 1, borderColor: t.border },
    regChipActive: { borderColor: t.accent.blue, backgroundColor: t.accent.blue + '20' },
    regChipText: { color: t.text.secondary, fontSize: 13 },
    regChipTextActive: { color: t.accent.blue, fontWeight: '600' },
    input: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 14, borderWidth: 1, borderColor: t.border },
    inputTall: { height: 80, textAlignVertical: 'top' },
    submitBtn: { backgroundColor: t.accent.blue, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    sublabel: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginTop: 12, lineHeight: 18 },
    // Rooms tab
    roomCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4 },
    roomName: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    roomHost: { color: t.text.secondary, fontSize: 13, marginTop: 2 },
    roomSubject: { color: t.accent.blue, fontSize: 12, fontWeight: '600', marginTop: 4 },
    roomParticipants: { color: t.text.muted, fontSize: 12, marginTop: 6 },
    roomStatus: { fontSize: 12, fontWeight: '700', marginTop: 4 },
    joinBtn: { backgroundColor: t.accent.green, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'flex-end', marginTop: 8 },
    joinBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40, lineHeight: 22 },
  }), [t]);

  /* ── Render: Find Tutors ── */

  const renderFind = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Find a Tutor</Text>
      <TextInput
        style={s.searchInput}
        placeholder="Search by name or subject..."
        placeholderTextColor={t.text.muted}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <View style={s.filterRow}>
        <TouchableOpacity
          style={[s.filterChip, !subjectFilter && s.filterChipActive]}
          onPress={() => setSubjectFilter(null)}
        >
          <Text style={[s.filterText, !subjectFilter && s.filterTextActive]}>All</Text>
        </TouchableOpacity>
        {SUBJECTS.map((subj) => (
          <TouchableOpacity
            key={subj}
            style={[s.filterChip, subjectFilter === subj && s.filterChipActive]}
            onPress={() => setSubjectFilter(subjectFilter === subj ? null : subj)}
          >
            <Text style={[s.filterText, subjectFilter === subj && s.filterTextActive]}>{subj}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {filteredTutors.length === 0 ? (
        <Text style={s.emptyText}>No tutors match your search.</Text>
      ) : (
        filteredTutors.map((tutor) => (
          <View key={tutor.uid} style={s.tutorCard}>
            <Text style={s.tutorName}>{tutor.name}</Text>
            <Text style={s.tutorUid}>{tutor.uid}</Text>
            <Text style={s.tutorBio}>{tutor.bio}</Text>
            <View style={s.tutorSubjects}>
              {tutor.subjects.map((subj) => (
                <View key={subj} style={s.subjectTag}>
                  <Text style={s.subjectTagText}>{subj}</Text>
                </View>
              ))}
            </View>
            <View style={s.tutorStats}>
              <Text style={s.tutorStat}>Rating: {tutor.rating}/5</Text>
              <Text style={s.tutorStat}>{tutor.sessionsCompleted} sessions</Text>
              <Text style={s.tutorStat}>{tutor.eOTKEarned} eOTK</Text>
            </View>
            <Text style={s.rateTag}>
              {tutor.hourlyRate === 0 ? 'Free' : `${tutor.hourlyRate} eOTK/hr`}
            </Text>
            <View style={[s.availableBadge, { backgroundColor: tutor.available ? t.accent.green + '20' : t.accent.red + '20' }]}>
              <Text style={[s.availableText, { color: tutor.available ? t.accent.green : t.accent.red }]}>
                {tutor.available ? 'Available' : 'Busy'}
              </Text>
            </View>
            {tutor.available && (
              <TouchableOpacity style={s.bookBtn} onPress={() => handleBookSession(tutor)}>
                <Text style={s.bookBtnText}>Book Session</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}
    </View>
  );

  /* ── Render: Sessions ── */

  const renderBook = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>My Sessions</Text>
      <View style={s.statsRow}>
        <View style={s.statItem}>
          <Text style={s.statValue}>{sessionStats.upcoming}</Text>
          <Text style={s.statLabel}>Upcoming</Text>
        </View>
        <View style={s.statItem}>
          <Text style={s.statValue}>{sessionStats.completed}</Text>
          <Text style={s.statLabel}>Completed</Text>
        </View>
        <View style={s.statItem}>
          <Text style={s.statValue}>{sessionStats.totalSpent}</Text>
          <Text style={s.statLabel}>eOTK Spent</Text>
        </View>
      </View>
      {DEMO_BOOKED.length === 0 ? (
        <Text style={s.emptyText}>No sessions yet. Find a tutor to get started!</Text>
      ) : (
        DEMO_BOOKED.map((session) => {
          const borderColor = session.status === 'upcoming' ? t.accent.blue
            : session.status === 'completed' ? t.accent.green
            : t.accent.red;
          return (
            <View key={session.id} style={[s.sessionCard, { borderLeftColor: borderColor }]}>
              <Text style={s.sessionSubject}>{session.subject}</Text>
              <Text style={s.sessionTutor}>with {session.tutorName}</Text>
              <Text style={s.sessionDetails}>
                {session.date} at {session.time} — {session.durationMinutes} min — {session.eOTKCost === 0 ? 'Free' : `${session.eOTKCost} eOTK`}
              </Text>
              <Text style={[s.sessionStatus, { color: borderColor }]}>
                {session.status.toUpperCase()}
              </Text>
              {session.rating !== undefined && (
                <Text style={s.sessionRating}>
                  {'*'.repeat(session.rating)} ({session.rating}/5)
                </Text>
              )}
              {session.notes && (
                <Text style={s.sessionNotes}>"{session.notes}"</Text>
              )}
            </View>
          );
        })
      )}
    </View>
  );

  /* ── Render: Teach ── */

  const renderTeach = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Become a Tutor</Text>
      <Text style={s.sublabel}>
        Share your knowledge with the community and earn eOTK.{'\n'}
        Every hour you teach strengthens the chain of education.
      </Text>

      <Text style={s.registerLabel}>Select Your Subjects</Text>
      <View style={s.subjectGrid}>
        {SUBJECTS.map((subj) => (
          <TouchableOpacity
            key={subj}
            style={[s.regChip, regSubjects.includes(subj) && s.regChipActive]}
            onPress={() => toggleRegSubject(subj)}
          >
            <Text style={[s.regChipText, regSubjects.includes(subj) && s.regChipTextActive]}>
              {subj}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.registerLabel}>About You</Text>
      <TextInput
        style={[s.input, s.inputTall]}
        placeholder="Describe your experience and teaching style..."
        placeholderTextColor={t.text.muted}
        value={regBio}
        onChangeText={setRegBio}
        multiline
      />

      <Text style={s.registerLabel}>Hourly Rate (eOTK, 0 = free)</Text>
      <TextInput
        style={s.input}
        placeholder="0"
        placeholderTextColor={t.text.muted}
        value={regRate}
        onChangeText={setRegRate}
        keyboardType="numeric"
      />

      <TouchableOpacity style={s.submitBtn} onPress={handleRegister}>
        <Text style={s.submitBtnText}>Register as Tutor</Text>
      </TouchableOpacity>

      <Text style={s.sublabel}>
        Tutors earn eOTK for every session completed.{'\n'}
        Free tutoring earns bonus eOTK from the community pool.
      </Text>
    </View>
  );

  /* ── Render: Study Rooms ── */

  const renderRooms = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Study Rooms</Text>
      <Text style={s.sublabel}>
        Drop-in help sessions — open to everyone.{'\n'}
        Join an active room or create your own.
      </Text>
      {DEMO_ROOMS.length === 0 ? (
        <Text style={s.emptyText}>No study rooms open right now.</Text>
      ) : (
        DEMO_ROOMS.map((room) => {
          const borderColor = room.status === 'open' ? t.accent.green
            : room.status === 'full' ? t.accent.orange
            : t.accent.red;
          return (
            <View key={room.id} style={[s.roomCard, { borderLeftColor: borderColor }]}>
              <Text style={s.roomName}>{room.name}</Text>
              <Text style={s.roomHost}>Hosted by {room.hostName}</Text>
              <Text style={s.roomSubject}>{room.subject}</Text>
              <Text style={s.roomParticipants}>
                {room.participantCount}/{room.maxParticipants} participants
              </Text>
              <Text style={[s.roomStatus, { color: borderColor }]}>
                {room.status.toUpperCase()}
              </Text>
              {room.status === 'open' && (
                <TouchableOpacity style={s.joinBtn} onPress={() => handleJoinRoom(room)}>
                  <Text style={s.joinBtnText}>Join Room</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })
      )}

      <TouchableOpacity
        style={[s.submitBtn, { marginTop: 20 }]}
        onPress={() => Alert.alert('Create Room', 'Study room creation coming soon!')}
      >
        <Text style={s.submitBtnText}>Create Study Room</Text>
      </TouchableOpacity>
    </View>
  );

  /* ── Main Render ── */

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Peer Tutoring</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.heroCard}>
          <Text style={s.heroIcon}>{'📚'}</Text>
          <Text style={s.heroTitle}>Peer Tutoring Marketplace</Text>
          <Text style={s.heroSub}>
            {"\"Education is the birthright of every human being.\nThose who teach multiply human potential across generations.\""}
          </Text>
        </View>

        {demoMode && (
          <View style={s.demoTag}>
            <Text style={s.demoText}>Demo — 4 tutors, 2 sessions, 1 study room</Text>
          </View>
        )}

        <View style={s.tabRow}>
          {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[s.tab, activeTab === tab && s.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                {TAB_LABELS[tab]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'find' && renderFind()}
        {activeTab === 'book' && renderBook()}
        {activeTab === 'teach' && renderTeach()}
        {activeTab === 'rooms' && renderRooms()}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
