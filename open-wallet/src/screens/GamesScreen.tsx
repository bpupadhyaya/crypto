/**
 * Games Screen — Community games, board game nights, traditional games.
 *
 * Article I: "Play is the foundation of human connection. Community games
 *  preserve culture, build bonds, and nurture the spirit of togetherness."
 * — Human Constitution, Article I
 *
 * Features:
 * - Game nights schedule (board games, card games, traditional games, trivia)
 * - Game library — community-shared games available to borrow
 * - Host a game night (location, game, capacity, snacks)
 * - Tournament brackets for competitive games
 * - Traditional games preservation (rules and history of cultural games)
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

interface GameNight {
  id: string;
  title: string;
  host: string;
  location: string;
  date: string;
  time: string;
  gameType: string;
  capacity: number;
  attending: number;
  snacks: string;
  description: string;
}

interface LibraryGame {
  id: string;
  title: string;
  category: string;
  players: string;
  duration: string;
  owner: string;
  available: boolean;
  rating: number;
  borrowCount: number;
}

interface Tournament {
  id: string;
  title: string;
  game: string;
  startDate: string;
  rounds: number;
  participants: number;
  maxParticipants: number;
  status: 'upcoming' | 'active' | 'completed';
  winner?: string;
}

interface TraditionalGame {
  id: string;
  name: string;
  origin: string;
  players: string;
  description: string;
  rules: string;
  history: string;
  materials: string;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const GAME_TYPES = [
  { key: 'strategy', label: 'Strategy', icon: 'S' },
  { key: 'trivia', label: 'Trivia', icon: 'T' },
  { key: 'traditional', label: 'Traditional', icon: 'H' },
  { key: 'word', label: 'Word', icon: 'W' },
  { key: 'sports', label: 'Sports', icon: 'P' },
  { key: 'puzzle', label: 'Puzzle', icon: 'Z' },
];

// ─── Demo Data ───

const DEMO_NIGHTS: GameNight[] = [
  {
    id: 'n1', title: 'Friday Strategy Night', host: 'openchain1abc...game_sam',
    location: 'Community Center, Room 3', date: '2026-04-04', time: '7:00 PM',
    gameType: 'strategy', capacity: 16, attending: 11, snacks: 'Pizza and drinks provided',
    description: 'Settlers of Catan, Ticket to Ride, and Carcassonne. All skill levels welcome!',
  },
  {
    id: 'n2', title: 'Trivia Tuesday', host: 'openchain1def...quiz_maria',
    location: 'Riverside Library', date: '2026-04-01', time: '6:30 PM',
    gameType: 'trivia', capacity: 40, attending: 28, snacks: 'Bring a snack to share',
    description: 'Teams of 4. Categories: science, history, pop culture, geography, wild card.',
  },
  {
    id: 'n3', title: 'Traditional Games Afternoon', host: 'openchain1ghi...elder_raj',
    location: 'Sunset Park Pavilion', date: '2026-04-06', time: '2:00 PM',
    gameType: 'traditional', capacity: 30, attending: 14, snacks: 'Tea and homemade snacks',
    description: 'Mancala, Go, Carrom, Pachisi. Elders teaching youth the games of their heritage.',
  },
];

const DEMO_LIBRARY: LibraryGame[] = [
  { id: 'g1', title: 'Settlers of Catan', category: 'strategy', players: '3-4', duration: '60-120 min', owner: 'openchain1abc...game_sam', available: true, rating: 4.7, borrowCount: 23 },
  { id: 'g2', title: 'Codenames', category: 'word', players: '4-8', duration: '15-30 min', owner: 'openchain1def...quiz_maria', available: true, rating: 4.8, borrowCount: 31 },
  { id: 'g3', title: 'Ticket to Ride', category: 'strategy', players: '2-5', duration: '30-60 min', owner: 'openchain1jkl...train_li', available: false, rating: 4.5, borrowCount: 18 },
  { id: 'g4', title: 'Scrabble', category: 'word', players: '2-4', duration: '60-90 min', owner: 'openchain1mno...word_yuki', available: true, rating: 4.3, borrowCount: 15 },
  { id: 'g5', title: 'Chess Set (Hand-carved)', category: 'strategy', players: '2', duration: '30-120 min', owner: 'openchain1ghi...elder_raj', available: true, rating: 4.9, borrowCount: 42 },
];

const DEMO_TOURNAMENT: Tournament = {
  id: 't1', title: 'Spring Chess Championship', game: 'Chess',
  startDate: '2026-04-10', rounds: 5, participants: 12, maxParticipants: 16,
  status: 'upcoming',
};

const DEMO_TRADITIONAL: TraditionalGame[] = [
  {
    id: 'tr1', name: 'Mancala', origin: 'East Africa', players: '2',
    description: 'One of the oldest known board games in human history.',
    rules: 'Players take turns sowing seeds around the board. Capture opponent seeds by landing in an empty pit on your side when the opposite pit has seeds.',
    history: 'Archaeological evidence suggests Mancala dates back to at least 6,000 years ago. Found carved into stone in ancient African and Middle Eastern sites.',
    materials: 'Board with 12 small pits and 2 large pits (stores), 48 seeds or stones.',
  },
  {
    id: 'tr2', name: 'Go (Weiqi)', origin: 'China', players: '2',
    description: 'Ancient strategy game of territory control, over 4,000 years old.',
    rules: 'Players alternate placing black and white stones on intersections. Surround territory and capture opponent stones. The player with more territory wins.',
    history: 'Originated in ancient China more than 4,000 years ago. Considered one of the four essential arts of a cultured Chinese scholar.',
    materials: '19x19 grid board, 181 black stones and 180 white stones.',
  },
  {
    id: 'tr3', name: 'Carrom', origin: 'South Asia', players: '2-4',
    description: 'Tabletop game of flicking discs into corner pockets.',
    rules: 'Use a striker to flick carrom men into corner pockets. Pot the Queen (red piece) and cover it. First to pocket all their pieces wins.',
    history: 'Believed to have originated in India. Popular across South Asia, the Middle East, and parts of Europe. Some trace it to 18th century Indian maharajas.',
    materials: 'Carrom board, 9 black pieces, 9 white pieces, 1 red Queen, 1 striker, boric acid powder.',
  },
  {
    id: 'tr4', name: 'Pachisi', origin: 'India', players: '2-4',
    description: 'The "Royal Game of India" — ancestor of modern Ludo and Parcheesi.',
    rules: 'Roll cowrie shells to move pieces around the cross-shaped board. Get all four pieces to the center to win. Capture opponent pieces by landing on them.',
    history: 'Played in India since at least the 4th century. Mughal Emperor Akbar played life-sized Pachisi using servants as game pieces in his palace courtyard.',
    materials: 'Cross-shaped cloth board, 16 wooden pawns (4 per player), 6 cowrie shells.',
  },
];

type Tab = 'events' | 'library' | 'host' | 'traditional';

export function GamesScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('events');
  const [hostTitle, setHostTitle] = useState('');
  const [hostLocation, setHostLocation] = useState('');
  const [hostGame, setHostGame] = useState('');
  const [hostCapacity, setHostCapacity] = useState('');
  const [hostSnacks, setHostSnacks] = useState('');
  const [hostType, setHostType] = useState('');
  const [expandedTraditional, setExpandedTraditional] = useState<string | null>(null);
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.purple + '20' },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: '600' },
    tabTextActive: { color: t.accent.purple },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 12, marginHorizontal: 20 },
    heroCard: { backgroundColor: t.accent.purple + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: '800', textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    nightCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    nightTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    nightMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    nightDesc: { color: t.text.secondary, fontSize: 13, marginTop: 8, lineHeight: 20 },
    nightFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    attendingText: { color: t.accent.purple, fontSize: 13, fontWeight: '600' },
    joinBtn: { backgroundColor: t.accent.purple, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    joinBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    gameRow: { flexDirection: 'row', borderBottomColor: t.bg.primary, borderBottomWidth: 1, paddingVertical: 12 },
    gameIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: t.accent.purple + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    gameIconText: { color: t.accent.purple, fontSize: 14, fontWeight: '700' },
    gameInfo: { flex: 1 },
    gameTitle: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    gameMeta: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    gameRight: { alignItems: 'flex-end', justifyContent: 'center' },
    gameRating: { color: t.accent.orange, fontSize: 14, fontWeight: '700' },
    gameAvail: { fontSize: 11, marginTop: 2 },
    borrowBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginTop: 4 },
    borrowBtnText: { color: '#fff', fontSize: 11, fontWeight: '600' },
    tournamentCard: { backgroundColor: t.accent.orange + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    tournamentTitle: { color: t.text.primary, fontSize: 16, fontWeight: '800' },
    tournamentMeta: { color: t.text.muted, fontSize: 13, marginTop: 4 },
    tournamentStatus: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    tournamentBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
    tournamentBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
    registerBtn: { backgroundColor: t.accent.green, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    registerBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    tradCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    tradName: { color: t.text.primary, fontSize: 16, fontWeight: '700' },
    tradOrigin: { color: t.accent.purple, fontSize: 12, fontWeight: '600', marginTop: 2 },
    tradDesc: { color: t.text.secondary, fontSize: 13, marginTop: 8, lineHeight: 20 },
    tradSection: { marginTop: 12 },
    tradSectionLabel: { color: t.text.primary, fontSize: 13, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
    tradSectionText: { color: t.text.secondary, fontSize: 13, lineHeight: 20 },
    expandBtn: { marginTop: 10, paddingVertical: 6 },
    expandBtnText: { color: t.accent.blue, fontSize: 13, fontWeight: '600' },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: t.bg.primary },
    typeChipSelected: { backgroundColor: t.accent.purple + '20', borderColor: t.accent.purple },
    typeChipText: { color: t.text.muted, fontSize: 13, fontWeight: '600' },
    typeChipTextSelected: { color: t.accent.purple },
    submitBtn: { backgroundColor: t.accent.purple, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    snacksNote: { color: t.text.muted, fontSize: 11, fontStyle: 'italic', marginTop: -4, marginBottom: 8 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: '700' },
  }), [t]);

  const handleHostNight = useCallback(() => {
    if (!hostTitle.trim()) { Alert.alert('Required', 'Enter a title for your game night.'); return; }
    if (!hostLocation.trim()) { Alert.alert('Required', 'Enter a location.'); return; }
    if (!hostGame.trim()) { Alert.alert('Required', 'Enter which game(s) will be played.'); return; }
    if (!hostType) { Alert.alert('Required', 'Select a game type.'); return; }
    const cap = parseInt(hostCapacity, 10);
    if (!cap || cap <= 0) { Alert.alert('Required', 'Enter a valid capacity.'); return; }

    Alert.alert(
      'Game Night Created!',
      `"${hostTitle}" at ${hostLocation}\nGame: ${hostGame}\nCapacity: ${cap}\n\nYour game night is now visible to the community.`,
    );
    setHostTitle('');
    setHostLocation('');
    setHostGame('');
    setHostCapacity('');
    setHostSnacks('');
    setHostType('');
    setTab('events');
  }, [hostTitle, hostLocation, hostGame, hostCapacity, hostType]);

  // ─── Tabs ───

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'events', label: 'Game Nights' },
    { key: 'library', label: 'Library' },
    { key: 'host', label: 'Host' },
    { key: 'traditional', label: 'Heritage' },
  ];

  // ─── Events Tab ───

  const renderEvents = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>G</Text>
        <Text style={s.heroTitle}>Community Game Nights</Text>
        <Text style={s.heroSubtitle}>
          Board games, card games, trivia, traditional games.{'\n'}
          Play together. Build bonds. Preserve culture.
        </Text>
      </View>

      <Text style={s.sectionTitle}>Upcoming Nights</Text>
      {DEMO_NIGHTS.map((night) => {
        const typeInfo = GAME_TYPES.find((gt) => gt.key === night.gameType);
        return (
          <View key={night.id} style={s.nightCard}>
            <Text style={s.nightTitle}>{night.title}</Text>
            <Text style={s.nightMeta}>
              {night.date} at {night.time} | {night.location}
            </Text>
            <Text style={s.nightMeta}>
              Type: {typeInfo?.label || night.gameType} | Host: {night.host.slice(0, 20)}...
            </Text>
            <Text style={s.nightDesc}>{night.description}</Text>
            <Text style={[s.nightMeta, { fontStyle: 'italic' }]}>{night.snacks}</Text>
            <View style={s.nightFooter}>
              <Text style={s.attendingText}>{night.attending}/{night.capacity} attending</Text>
              <TouchableOpacity
                style={s.joinBtn}
                onPress={() => Alert.alert('Joined!', `You are now attending "${night.title}".`)}
              >
                <Text style={s.joinBtnText}>Join</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      {/* Tournament */}
      <Text style={s.sectionTitle}>Tournament</Text>
      <View style={s.tournamentCard}>
        <Text style={s.tournamentTitle}>{DEMO_TOURNAMENT.title}</Text>
        <Text style={s.tournamentMeta}>
          {DEMO_TOURNAMENT.game} | {DEMO_TOURNAMENT.rounds} rounds | Starts {DEMO_TOURNAMENT.startDate}
        </Text>
        <View style={s.tournamentStatus}>
          <View style={[s.tournamentBadge, { backgroundColor: t.accent.blue }]}>
            <Text style={s.tournamentBadgeText}>{DEMO_TOURNAMENT.status}</Text>
          </View>
          <Text style={s.attendingText}>
            {DEMO_TOURNAMENT.participants}/{DEMO_TOURNAMENT.maxParticipants} players
          </Text>
          <TouchableOpacity
            style={s.registerBtn}
            onPress={() => Alert.alert('Registered!', `You are registered for "${DEMO_TOURNAMENT.title}".`)}
          >
            <Text style={s.registerBtnText}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  // ─── Library Tab ───

  const renderLibrary = () => (
    <>
      <Text style={s.sectionTitle}>Community Game Library</Text>
      <View style={s.card}>
        {DEMO_LIBRARY.map((game) => {
          const catInfo = GAME_TYPES.find((gt) => gt.key === game.category);
          return (
            <View key={game.id} style={s.gameRow}>
              <View style={s.gameIcon}>
                <Text style={s.gameIconText}>{catInfo?.icon || '?'}</Text>
              </View>
              <View style={s.gameInfo}>
                <Text style={s.gameTitle}>{game.title}</Text>
                <Text style={s.gameMeta}>
                  {catInfo?.label || game.category} | {game.players} players | {game.duration}
                </Text>
                <Text style={s.gameMeta}>Borrowed {game.borrowCount} times</Text>
              </View>
              <View style={s.gameRight}>
                <Text style={s.gameRating}>{game.rating.toFixed(1)}</Text>
                <Text style={[s.gameAvail, { color: game.available ? t.accent.green : t.accent.orange }]}>
                  {game.available ? 'Available' : 'Borrowed'}
                </Text>
                {game.available && (
                  <TouchableOpacity
                    style={s.borrowBtn}
                    onPress={() => Alert.alert('Borrowed!', `"${game.title}" is reserved for you. Pick it up from the owner.`)}
                  >
                    <Text style={s.borrowBtnText}>Borrow</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </>
  );

  // ─── Host Tab ───

  const renderHost = () => (
    <View style={s.card}>
      <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Host a Game Night</Text>

      <Text style={s.gameMeta}>Game Type</Text>
      <View style={[s.typeGrid, { marginTop: 8 }]}>
        {GAME_TYPES.map((gt) => (
          <TouchableOpacity
            key={gt.key}
            style={[s.typeChip, hostType === gt.key && s.typeChipSelected]}
            onPress={() => setHostType(gt.key)}
          >
            <Text style={[s.typeChipText, hostType === gt.key && s.typeChipTextSelected]}>
              {gt.icon} {gt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={s.input}
        placeholder="Game night title"
        placeholderTextColor={t.text.muted}
        value={hostTitle}
        onChangeText={setHostTitle}
      />

      <TextInput
        style={s.input}
        placeholder="Location (e.g. Community Center, Room 3)"
        placeholderTextColor={t.text.muted}
        value={hostLocation}
        onChangeText={setHostLocation}
      />

      <TextInput
        style={s.input}
        placeholder="Game(s) to play"
        placeholderTextColor={t.text.muted}
        value={hostGame}
        onChangeText={setHostGame}
      />

      <TextInput
        style={s.input}
        placeholder="Maximum capacity"
        placeholderTextColor={t.text.muted}
        keyboardType="numeric"
        value={hostCapacity}
        onChangeText={setHostCapacity}
      />

      <TextInput
        style={s.input}
        placeholder="Snacks plan (optional)"
        placeholderTextColor={t.text.muted}
        value={hostSnacks}
        onChangeText={setHostSnacks}
      />
      <Text style={s.snacksNote}>e.g. "Pizza provided" or "Bring a snack to share"</Text>

      <TouchableOpacity style={s.submitBtn} onPress={handleHostNight}>
        <Text style={s.submitText}>Create Game Night</Text>
      </TouchableOpacity>
    </View>
  );

  // ─── Traditional Tab ───

  const renderTraditional = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>H</Text>
        <Text style={s.heroTitle}>Traditional Games Heritage</Text>
        <Text style={s.heroSubtitle}>
          Preserving the rules, history, and spirit of games{'\n'}
          that have connected humans for millennia.
        </Text>
      </View>

      {DEMO_TRADITIONAL.map((game) => {
        const expanded = expandedTraditional === game.id;
        return (
          <View key={game.id} style={s.tradCard}>
            <Text style={s.tradName}>{game.name}</Text>
            <Text style={s.tradOrigin}>Origin: {game.origin} | Players: {game.players}</Text>
            <Text style={s.tradDesc}>{game.description}</Text>

            {expanded && (
              <>
                <View style={s.tradSection}>
                  <Text style={s.tradSectionLabel}>Rules</Text>
                  <Text style={s.tradSectionText}>{game.rules}</Text>
                </View>
                <View style={s.tradSection}>
                  <Text style={s.tradSectionLabel}>History</Text>
                  <Text style={s.tradSectionText}>{game.history}</Text>
                </View>
                <View style={s.tradSection}>
                  <Text style={s.tradSectionLabel}>Materials</Text>
                  <Text style={s.tradSectionText}>{game.materials}</Text>
                </View>
              </>
            )}

            <TouchableOpacity
              style={s.expandBtn}
              onPress={() => setExpandedTraditional(expanded ? null : game.id)}
            >
              <Text style={s.expandBtnText}>{expanded ? 'Show Less' : 'Rules & History'}</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </>
  );

  // ─── Main Render ───

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Community Games</Text>
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
        {tab === 'events' && renderEvents()}
        {tab === 'library' && renderLibrary()}
        {tab === 'host' && renderHost()}
        {tab === 'traditional' && renderTraditional()}
      </ScrollView>
    </SafeAreaView>
  );
}
