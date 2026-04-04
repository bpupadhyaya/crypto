import { fonts } from '../utils/theme';
/**
 * Sports Screen — Community fitness, sports leagues, and physical wellness.
 *
 * Article I (hOTK): "Every dimension of human contribution is valued equally."
 * Physical wellness through sports and fitness earns hOTK — community
 * sports leagues, fitness groups, activity tracking, and facility access.
 *
 * Features:
 * - Community sports leagues (soccer, basketball, cricket, running, yoga)
 * - Fitness groups (walking, cycling, swimming, gym buddies)
 * - Track activity (steps, workouts, sports participation, hOTK earned)
 * - Community fitness challenges (monthly step goals, team competitions)
 * - Facility finder (parks, fields, courts, gyms)
 * - Demo: 3 leagues, 2 fitness groups, weekly activity log, 1 challenge
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface League {
  id: string;
  name: string;
  sport: string;
  members: number;
  schedule: string;
  level: string;
  nextGame: string;
  spotsOpen: number;
}

interface FitnessGroup {
  id: string;
  name: string;
  activity: string;
  members: number;
  schedule: string;
  meetPoint: string;
  open: boolean;
}

interface ActivityLog {
  id: string;
  date: string;
  type: string;
  duration: number; // minutes
  steps: number;
  hotkEarned: number;
  sport?: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  goal: string;
  progress: number; // 0-100
  participants: number;
  endDate: string;
  reward: number; // hOTK
}

interface Facility {
  id: string;
  name: string;
  type: string;
  distance: string;
  amenities: string[];
  hours: string;
  free: boolean;
}

interface WeeklyStats {
  totalSteps: number;
  totalWorkouts: number;
  totalMinutes: number;
  totalHOTK: number;
  sportsParticipations: number;
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_LEAGUES: League[] = [
  { id: '1', name: 'Community Soccer League', sport: 'Soccer', members: 48, schedule: 'Saturdays 9AM', level: 'All levels', nextGame: '2026-04-05', spotsOpen: 4 },
  { id: '2', name: 'Pickup Basketball', sport: 'Basketball', members: 24, schedule: 'Wed/Fri 6PM', level: 'Intermediate', nextGame: '2026-04-02', spotsOpen: 2 },
  { id: '3', name: 'Weekend Cricket Club', sport: 'Cricket', members: 32, schedule: 'Sundays 10AM', level: 'All levels', nextGame: '2026-04-06', spotsOpen: 6 },
];

const DEMO_FITNESS_GROUPS: FitnessGroup[] = [
  { id: '1', name: 'Morning Walkers', activity: 'Walking', members: 18, schedule: 'Daily 6:30AM', meetPoint: 'Central Park entrance', open: true },
  { id: '2', name: 'Cycle Squad', activity: 'Cycling', members: 12, schedule: 'Tue/Thu/Sat 7AM', meetPoint: 'Riverside trailhead', open: true },
];

const DEMO_ACTIVITY_LOG: ActivityLog[] = [
  { id: '1', date: '2026-03-29', type: 'workout', duration: 45, steps: 6200, hotkEarned: 180, sport: 'Running' },
  { id: '2', date: '2026-03-28', type: 'sport', duration: 90, steps: 8400, hotkEarned: 280, sport: 'Soccer' },
  { id: '3', date: '2026-03-27', type: 'workout', duration: 30, steps: 3800, hotkEarned: 120 },
  { id: '4', date: '2026-03-26', type: 'steps', duration: 0, steps: 10200, hotkEarned: 100 },
  { id: '5', date: '2026-03-25', type: 'sport', duration: 60, steps: 5600, hotkEarned: 220, sport: 'Basketball' },
  { id: '6', date: '2026-03-24', type: 'workout', duration: 40, steps: 4100, hotkEarned: 150 },
  { id: '7', date: '2026-03-23', type: 'steps', duration: 0, steps: 8900, hotkEarned: 90 },
];

const DEMO_CHALLENGES: Challenge[] = [
  { id: '1', title: 'March Step Challenge', description: 'Walk 300,000 steps this month as a community. Every step counts toward our collective goal.', goal: '300,000 steps', progress: 72, participants: 156, endDate: '2026-03-31', reward: 500 },
];

const DEMO_FACILITIES: Facility[] = [
  { id: '1', name: 'Central Park', type: 'Park', distance: '0.3 mi', amenities: ['Running trail', 'Open field', 'Playground'], hours: '6AM - 10PM', free: true },
  { id: '2', name: 'Community Sports Complex', type: 'Complex', distance: '1.2 mi', amenities: ['Basketball courts', 'Soccer field', 'Swimming pool'], hours: '7AM - 9PM', free: true },
  { id: '3', name: 'Riverside Courts', type: 'Courts', distance: '0.8 mi', amenities: ['Tennis courts', 'Volleyball', 'Picnic area'], hours: '6AM - Sunset', free: true },
  { id: '4', name: 'FitLife Gym', type: 'Gym', distance: '0.5 mi', amenities: ['Weight room', 'Cardio machines', 'Yoga studio', 'Showers'], hours: '5AM - 11PM', free: false },
];

const DEMO_WEEKLY_STATS: WeeklyStats = {
  totalSteps: 47400,
  totalWorkouts: 4,
  totalMinutes: 265,
  totalHOTK: 1140,
  sportsParticipations: 2,
};

type Tab = 'leagues' | 'fitness' | 'track' | 'facilities';

export function SportsScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('leagues');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const leagues = DEMO_LEAGUES;
  const fitnessGroups = DEMO_FITNESS_GROUPS;
  const activityLog = DEMO_ACTIVITY_LOG;
  const challenges = DEMO_CHALLENGES;
  const facilities = DEMO_FACILITIES;
  const weeklyStats = DEMO_WEEKLY_STATS;

  const handleJoinLeague = useCallback((league: League) => {
    if (league.spotsOpen <= 0) {
      Alert.alert('League Full', `${league.name} is currently full. You have been added to the waitlist.`);
      return;
    }
    Alert.alert(
      'Joined League',
      `Welcome to ${league.name}!\n\nSport: ${league.sport}\nSchedule: ${league.schedule}\nNext game: ${league.nextGame}\n\nYou will earn hOTK for each participation.`,
    );
  }, []);

  const handleJoinGroup = useCallback((group: FitnessGroup) => {
    Alert.alert(
      'Joined Group',
      `Welcome to ${group.name}!\n\nActivity: ${group.activity}\nSchedule: ${group.schedule}\nMeet at: ${group.meetPoint}\n\nStay active, earn hOTK!`,
    );
  }, []);

  const handleLogActivity = useCallback(() => {
    Alert.alert(
      'Activity Logged',
      'Your activity has been recorded.\n\nEstimated hOTK: 150\nSteps and duration will sync from your device.\n\nKeep moving!',
    );
  }, []);

  const handleJoinChallenge = useCallback((challenge: Challenge) => {
    Alert.alert(
      'Challenge Joined',
      `You are now part of "${challenge.title}"!\n\nGoal: ${challenge.goal}\nProgress: ${challenge.progress}%\nReward: ${challenge.reward} hOTK\nEnds: ${challenge.endDate}\n\nEvery step counts!`,
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
    tabActive: { backgroundColor: t.accent.green + '20' },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.green },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    // Weekly stats
    statsCard: { backgroundColor: t.accent.green + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap' },
    statItem: { alignItems: 'center', minWidth: 80, marginBottom: 8 },
    statValue: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2, textAlign: 'center' },
    // League cards
    leagueCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    leagueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    leagueName: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, flex: 1 },
    leagueSport: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold },
    leagueMeta: { color: t.text.muted, fontSize: fonts.sm, marginBottom: 4 },
    spotsTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 8 },
    spotsOpen: { backgroundColor: t.accent.green + '20' },
    spotsFull: { backgroundColor: t.accent.red + '20' },
    spotsText: { fontSize: fonts.xs, fontWeight: fonts.bold },
    spotsTextOpen: { color: t.accent.green },
    spotsTextFull: { color: t.accent.red || '#FF3B30' },
    joinBtn: { backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginTop: 4 },
    joinBtnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    // Fitness groups
    groupCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    groupName: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 4 },
    groupActivity: { color: t.accent.blue, fontSize: fonts.sm, fontWeight: fonts.semibold, marginBottom: 8 },
    groupMeta: { color: t.text.muted, fontSize: fonts.sm, marginBottom: 4 },
    // Activity log
    activityRow: { flexDirection: 'row', borderBottomColor: t.bg.primary, borderBottomWidth: 1, paddingVertical: 12 },
    activityIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: t.accent.green + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    activityIconText: { color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.bold },
    activityInfo: { flex: 1 },
    activityTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    activityMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    activityRight: { alignItems: 'flex-end', justifyContent: 'center' },
    activityHotk: { color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.bold },
    activitySteps: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    logBtn: { backgroundColor: t.accent.green, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginHorizontal: 20, marginBottom: 16 },
    logBtnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    // Challenges
    challengeCard: { backgroundColor: t.accent.orange + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    challengeTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 4 },
    challengeDesc: { color: t.text.muted, fontSize: fonts.sm, lineHeight: 20, marginBottom: 12 },
    challengeMeta: { color: t.text.secondary, fontSize: fonts.sm, marginBottom: 4 },
    progressBarOuter: { height: 8, backgroundColor: t.bg.primary, borderRadius: 4, marginTop: 8, marginBottom: 4 },
    progressBarInner: { height: 8, borderRadius: 4, backgroundColor: t.accent.orange },
    progressText: { color: t.accent.orange, fontSize: fonts.sm, fontWeight: fonts.bold, textAlign: 'center', marginTop: 4 },
    challengeBtn: { backgroundColor: t.accent.orange, borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginTop: 8 },
    challengeBtnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    // Facilities
    facilityCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    facilityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    facilityName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    facilityDistance: { color: t.accent.blue, fontSize: fonts.sm, fontWeight: fonts.semibold },
    facilityType: { color: t.text.secondary, fontSize: fonts.sm, marginBottom: 8 },
    facilityMeta: { color: t.text.muted, fontSize: fonts.sm, marginBottom: 4 },
    amenitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
    amenityTag: { backgroundColor: t.bg.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    amenityText: { color: t.text.secondary, fontSize: fonts.xs, fontWeight: fonts.semibold },
    freeTag: { backgroundColor: t.accent.green + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
    freeTagText: { color: t.accent.green, fontSize: fonts.xs, fontWeight: fonts.bold },
    // Misc
    educationCard: { backgroundColor: t.accent.green + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    educationText: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold, textAlign: 'center', lineHeight: 22 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.bold },
  }), [t]);

  // ─── Tabs ───

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'leagues', label: 'Leagues' },
    { key: 'fitness', label: 'Fitness' },
    { key: 'track', label: 'Track' },
    { key: 'facilities', label: 'Facilities' },
  ];

  const getActivityIcon = (type: string): string => {
    switch (type) {
      case 'sport': return 'S';
      case 'workout': return 'W';
      case 'steps': return '#';
      default: return '?';
    }
  };

  const getActivityLabel = (log: ActivityLog): string => {
    if (log.sport) return log.sport;
    if (log.type === 'workout') return 'Workout';
    if (log.type === 'steps') return 'Daily Steps';
    return 'Activity';
  };

  // ─── Leagues Tab ───

  const renderLeagues = () => (
    <>
      <Text style={s.sectionTitle}>Community Sports Leagues</Text>
      <View style={s.educationCard}>
        <Text style={s.educationText}>
          Join a league, play with your community,{'\n'}
          and earn hOTK for every participation.{'\n'}
          All skill levels welcome.
        </Text>
      </View>

      {leagues.map((league) => (
        <View key={league.id} style={s.leagueCard}>
          <View style={s.leagueHeader}>
            <Text style={s.leagueName}>{league.name}</Text>
            <Text style={s.leagueSport}>{league.sport}</Text>
          </View>
          <Text style={s.leagueMeta}>Schedule: {league.schedule}</Text>
          <Text style={s.leagueMeta}>Level: {league.level} | Members: {league.members}</Text>
          <Text style={s.leagueMeta}>Next game: {league.nextGame}</Text>
          <View style={[s.spotsTag, league.spotsOpen > 0 ? s.spotsOpen : s.spotsFull]}>
            <Text style={[s.spotsText, league.spotsOpen > 0 ? s.spotsTextOpen : s.spotsTextFull]}>
              {league.spotsOpen > 0 ? `${league.spotsOpen} spots open` : 'Full — waitlist'}
            </Text>
          </View>
          <TouchableOpacity style={s.joinBtn} onPress={() => handleJoinLeague(league)}>
            <Text style={s.joinBtnText}>{league.spotsOpen > 0 ? 'Join League' : 'Join Waitlist'}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </>
  );

  // ─── Fitness Tab ───

  const renderFitness = () => (
    <>
      <Text style={s.sectionTitle}>Fitness Groups</Text>
      <View style={s.educationCard}>
        <Text style={s.educationText}>
          Fitness is better together.{'\n'}
          Join a group, stay consistent,{'\n'}
          and earn hOTK for staying active.
        </Text>
      </View>

      {fitnessGroups.map((group) => (
        <View key={group.id} style={s.groupCard}>
          <Text style={s.groupName}>{group.name}</Text>
          <Text style={s.groupActivity}>{group.activity}</Text>
          <Text style={s.groupMeta}>Schedule: {group.schedule}</Text>
          <Text style={s.groupMeta}>Meet at: {group.meetPoint}</Text>
          <Text style={s.groupMeta}>Members: {group.members}</Text>
          {group.open && (
            <TouchableOpacity style={s.joinBtn} onPress={() => handleJoinGroup(group)}>
              <Text style={s.joinBtnText}>Join Group</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {/* Challenges */}
      <Text style={s.sectionTitle}>Community Challenges</Text>
      {challenges.map((challenge) => (
        <View key={challenge.id} style={s.challengeCard}>
          <Text style={s.challengeTitle}>{challenge.title}</Text>
          <Text style={s.challengeDesc}>{challenge.description}</Text>
          <Text style={s.challengeMeta}>Goal: {challenge.goal}</Text>
          <Text style={s.challengeMeta}>Participants: {challenge.participants} | Reward: {challenge.reward} hOTK</Text>
          <Text style={s.challengeMeta}>Ends: {challenge.endDate}</Text>
          <View style={s.progressBarOuter}>
            <View style={[s.progressBarInner, { width: `${challenge.progress}%` }]} />
          </View>
          <Text style={s.progressText}>{challenge.progress}% complete</Text>
          <TouchableOpacity style={s.challengeBtn} onPress={() => handleJoinChallenge(challenge)}>
            <Text style={s.challengeBtnText}>Join Challenge</Text>
          </TouchableOpacity>
        </View>
      ))}
    </>
  );

  // ─── Track Tab ───

  const renderTrack = () => (
    <>
      {/* Weekly Stats */}
      <View style={s.statsCard}>
        <Text style={[s.sectionTitle, { marginHorizontal: 0, textAlign: 'center' }]}>This Week</Text>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{weeklyStats.totalSteps.toLocaleString()}</Text>
            <Text style={s.statLabel}>Steps</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.green }]}>{weeklyStats.totalWorkouts}</Text>
            <Text style={s.statLabel}>Workouts</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.blue }]}>{weeklyStats.totalMinutes}</Text>
            <Text style={s.statLabel}>Minutes</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.orange }]}>{weeklyStats.sportsParticipations}</Text>
            <Text style={s.statLabel}>Sports</Text>
          </View>
        </View>
        <View style={{ alignItems: 'center', marginTop: 12 }}>
          <Text style={[s.statValue, { color: t.accent.green, fontSize: fonts.xxl }]}>+{weeklyStats.totalHOTK} hOTK</Text>
          <Text style={s.statLabel}>Earned This Week</Text>
        </View>
      </View>

      <TouchableOpacity style={s.logBtn} onPress={handleLogActivity}>
        <Text style={s.logBtnText}>Log Activity</Text>
      </TouchableOpacity>

      {/* Activity Log */}
      <Text style={s.sectionTitle}>Activity Log</Text>
      <View style={s.card}>
        {activityLog.map((log) => (
          <View key={log.id} style={s.activityRow}>
            <View style={s.activityIcon}>
              <Text style={s.activityIconText}>{getActivityIcon(log.type)}</Text>
            </View>
            <View style={s.activityInfo}>
              <Text style={s.activityTitle}>{getActivityLabel(log)}</Text>
              <Text style={s.activityMeta}>
                {log.date}{log.duration > 0 ? ` | ${log.duration} min` : ''}
              </Text>
            </View>
            <View style={s.activityRight}>
              <Text style={s.activityHotk}>+{log.hotkEarned} hOTK</Text>
              <Text style={s.activitySteps}>{log.steps.toLocaleString()} steps</Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );

  // ─── Facilities Tab ───

  const renderFacilities = () => (
    <>
      <Text style={s.sectionTitle}>Nearby Facilities</Text>
      {facilities.map((facility) => (
        <View key={facility.id} style={s.facilityCard}>
          <View style={s.facilityHeader}>
            <Text style={s.facilityName}>{facility.name}</Text>
            <Text style={s.facilityDistance}>{facility.distance}</Text>
          </View>
          <Text style={s.facilityType}>{facility.type}</Text>
          <Text style={s.facilityMeta}>Hours: {facility.hours}</Text>
          <View style={s.amenitiesRow}>
            {facility.amenities.map((amenity) => (
              <View key={amenity} style={s.amenityTag}>
                <Text style={s.amenityText}>{amenity}</Text>
              </View>
            ))}
          </View>
          {facility.free && (
            <View style={s.freeTag}>
              <Text style={s.freeTagText}>FREE</Text>
            </View>
          )}
        </View>
      ))}

      <View style={s.educationCard}>
        <Text style={s.educationText}>
          Physical wellness is a community right.{'\n'}
          Parks, fields, and courts are open to all.{'\n'}
          Stay active, earn hOTK, and build{'\n'}
          a healthier community together.
        </Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Sports & Fitness</Text>
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
        {tab === 'leagues' && renderLeagues()}
        {tab === 'fitness' && renderFitness()}
        {tab === 'track' && renderTrack()}
        {tab === 'facilities' && renderFacilities()}
      </ScrollView>
    </SafeAreaView>
  );
}
