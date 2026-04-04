import { fonts } from '../utils/theme';
/**
 * Cleanup Drive Screen — Community cleanup events, environmental action days.
 *
 * Article I: "Every act of environmental care strengthens the community."
 * Article III: cOTK represents community value.
 *
 * Features:
 * - Upcoming cleanup drives (beach, river, park, neighborhood, roadside)
 * - Join/organize drives (location, date, supplies needed, volunteers target)
 * - Cleanup stats (trash collected kg, area cleaned, volunteers participated)
 * - Photo evidence hashes (before/after documented on-chain)
 * - cOTK earned per cleanup event
 * - Leaderboard (top cleanup volunteers)
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

interface CleanupDrive {
  id: string;
  title: string;
  type: 'beach' | 'river' | 'park' | 'neighborhood' | 'roadside';
  location: string;
  date: string;
  time: string;
  organizer: string;
  suppliesNeeded: string[];
  volunteersTarget: number;
  volunteersJoined: number;
  status: 'upcoming' | 'completed';
}

interface CleanupStats {
  driveId: string;
  trashCollectedKg: number;
  areaCleanedSqM: number;
  volunteersParticipated: number;
  durationHours: number;
  beforePhotoHash: string;
  afterPhotoHash: string;
  cotkEarned: number;
  verifiedOnChain: boolean;
}

interface LeaderboardEntry {
  uid: string;
  name: string;
  drivesCompleted: number;
  totalTrashKg: number;
  totalCotkEarned: number;
  rank: number;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const DRIVE_TYPES = [
  { key: 'beach', label: 'Beach', icon: 'B' },
  { key: 'river', label: 'River', icon: 'R' },
  { key: 'park', label: 'Park', icon: 'P' },
  { key: 'neighborhood', label: 'Neighborhood', icon: 'N' },
  { key: 'roadside', label: 'Roadside', icon: 'D' },
];

const TYPE_COLORS: Record<string, string> = {
  beach: '#007AFF',
  river: '#34C759',
  park: '#AF52DE',
  neighborhood: '#FF9500',
  roadside: '#8E8E93',
};

// ─── Demo Data ───

const DEMO_UPCOMING: CleanupDrive[] = [
  {
    id: 'u1', title: 'Sunrise Beach Cleanup', type: 'beach', location: 'Sunrise Beach, South Bay',
    date: '2026-04-05', time: '7:00 AM', organizer: 'openchain1abc...eco_sam',
    suppliesNeeded: ['Trash bags', 'Gloves', 'Grabbers'], volunteersTarget: 30, volunteersJoined: 18, status: 'upcoming',
  },
  {
    id: 'u2', title: 'River Walk Restoration', type: 'river', location: 'Elm Creek Trail',
    date: '2026-04-12', time: '9:00 AM', organizer: 'openchain1def...green_maria',
    suppliesNeeded: ['Waders', 'Trash bags', 'Buckets'], volunteersTarget: 20, volunteersJoined: 7, status: 'upcoming',
  },
  {
    id: 'u3', title: 'Neighborhood Spring Sweep', type: 'neighborhood', location: 'Maplewood District',
    date: '2026-04-19', time: '8:00 AM', organizer: 'openchain1ghi...civic_raj',
    suppliesNeeded: ['Brooms', 'Trash bags', 'Rakes'], volunteersTarget: 40, volunteersJoined: 25, status: 'upcoming',
  },
];

const DEMO_COMPLETED: CleanupDrive[] = [
  {
    id: 'c1', title: 'Oakwood Park Earth Day', type: 'park', location: 'Oakwood Community Park',
    date: '2026-03-22', time: '8:00 AM', organizer: 'you',
    suppliesNeeded: ['Trash bags', 'Gloves'], volunteersTarget: 25, volunteersJoined: 25, status: 'completed',
  },
  {
    id: 'c2', title: 'Highway 9 Roadside Cleanup', type: 'roadside', location: 'Highway 9, Mile 12-15',
    date: '2026-03-15', time: '6:30 AM', organizer: 'openchain1jkl...road_li',
    suppliesNeeded: ['Safety vests', 'Trash bags', 'Grabbers'], volunteersTarget: 15, volunteersJoined: 15, status: 'completed',
  },
];

const DEMO_STATS: Record<string, CleanupStats> = {
  c1: {
    driveId: 'c1', trashCollectedKg: 182, areaCleanedSqM: 15000, volunteersParticipated: 25,
    durationHours: 4, beforePhotoHash: '0xab3f...9c21', afterPhotoHash: '0xde71...4f88',
    cotkEarned: 2400, verifiedOnChain: true,
  },
  c2: {
    driveId: 'c2', trashCollectedKg: 96, areaCleanedSqM: 8500, volunteersParticipated: 15,
    durationHours: 3, beforePhotoHash: '0x1a2b...7d44', afterPhotoHash: '0x8e9f...2c11',
    cotkEarned: 1600, verifiedOnChain: true,
  },
};

const DEMO_LEADERBOARD: LeaderboardEntry[] = [
  { uid: 'openchain1abc...eco_sam', name: 'eco_sam', drivesCompleted: 42, totalTrashKg: 1840, totalCotkEarned: 48200, rank: 1 },
  { uid: 'openchain1def...green_maria', name: 'green_maria', drivesCompleted: 35, totalTrashKg: 1520, totalCotkEarned: 39800, rank: 2 },
  { uid: 'you', name: 'You', drivesCompleted: 18, totalTrashKg: 680, totalCotkEarned: 17400, rank: 3 },
  { uid: 'openchain1ghi...civic_raj', name: 'civic_raj', drivesCompleted: 14, totalTrashKg: 510, totalCotkEarned: 12600, rank: 4 },
  { uid: 'openchain1jkl...road_li', name: 'road_li', drivesCompleted: 11, totalTrashKg: 390, totalCotkEarned: 9200, rank: 5 },
];

type Tab = 'upcoming' | 'organize' | 'completed' | 'leaderboard';

export function CleanupDriveScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('upcoming');
  const [orgTitle, setOrgTitle] = useState('');
  const [orgType, setOrgType] = useState('');
  const [orgLocation, setOrgLocation] = useState('');
  const [orgDate, setOrgDate] = useState('');
  const [orgTime, setOrgTime] = useState('');
  const [orgSupplies, setOrgSupplies] = useState('');
  const [orgTarget, setOrgTarget] = useState('');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const handleOrganize = useCallback(() => {
    if (!orgTitle.trim()) { Alert.alert('Required', 'Enter a drive title.'); return; }
    if (!orgType) { Alert.alert('Required', 'Select a cleanup type.'); return; }
    if (!orgLocation.trim()) { Alert.alert('Required', 'Enter a location.'); return; }
    if (!orgDate.trim()) { Alert.alert('Required', 'Enter a date.'); return; }
    const target = parseInt(orgTarget, 10);
    if (!target || target <= 0) { Alert.alert('Required', 'Enter a valid volunteer target.'); return; }

    Alert.alert(
      'Drive Created',
      `"${orgTitle}" at ${orgLocation} on ${orgDate}.\nVolunteer target: ${target}\n\nShared with community. Earn cOTK when volunteers join!`,
    );
    setOrgTitle('');
    setOrgType('');
    setOrgLocation('');
    setOrgDate('');
    setOrgTime('');
    setOrgSupplies('');
    setOrgTarget('');
    setTab('upcoming');
  }, [orgTitle, orgType, orgLocation, orgDate, orgTarget]);

  const handleJoinDrive = useCallback((drive: CleanupDrive) => {
    Alert.alert(
      'Joined Drive',
      `You joined "${drive.title}" on ${drive.date} at ${drive.time}.\nLocation: ${drive.location}\n\nSupplies to bring: ${drive.suppliesNeeded.join(', ')}`,
    );
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.green + '20' },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.green },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    driveCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    driveHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    driveTypeIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    driveTypeText: { color: '#fff', fontSize: 14, fontWeight: fonts.bold },
    driveInfo: { flex: 1 },
    driveTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    driveMeta: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    driveSupplies: { color: t.text.muted, fontSize: 11, marginTop: 6, fontStyle: 'italic' },
    driveFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    volunteerProgress: { flex: 1 },
    volunteerText: { color: t.text.muted, fontSize: 12 },
    progressBar: { height: 6, backgroundColor: t.bg.primary, borderRadius: 3, marginTop: 4, overflow: 'hidden' as const },
    progressFill: { height: 6, backgroundColor: t.accent.green, borderRadius: 3 },
    joinBtn: { backgroundColor: t.accent.green, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, marginLeft: 12 },
    joinBtnText: { color: '#fff', fontSize: 13, fontWeight: fonts.semibold },
    statsCard: { backgroundColor: t.accent.green + '12', borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    hashRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopColor: t.bg.primary, borderTopWidth: 1 },
    hashLabel: { color: t.text.muted, fontSize: 11 },
    hashValue: { color: t.accent.blue, fontSize: 11, fontWeight: fonts.semibold },
    cotkBadge: { alignItems: 'center', marginTop: 12 },
    cotkText: { color: t.accent.green, fontSize: 18, fontWeight: fonts.heavy },
    cotkLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    verifiedBadge: { color: t.accent.green, fontSize: 11, fontWeight: fonts.semibold, marginTop: 4 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: t.bg.primary },
    typeChipSelected: { backgroundColor: t.accent.green + '20', borderColor: t.accent.green },
    typeChipText: { color: t.text.muted, fontSize: 13, fontWeight: fonts.semibold },
    typeChipTextSelected: { color: t.accent.green },
    submitBtn: { backgroundColor: t.accent.green, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    leaderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    rankNum: { width: 32, color: t.text.muted, fontSize: 16, fontWeight: fonts.heavy, textAlign: 'center' },
    leaderInfo: { flex: 1, marginLeft: 8 },
    leaderName: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    leaderMeta: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    leaderTrash: { alignItems: 'flex-end' },
    leaderTrashText: { color: t.accent.green, fontSize: 16, fontWeight: fonts.heavy },
    leaderTrashLabel: { color: t.text.muted, fontSize: 10 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },
  }), [t]);

  // ─── Tabs ───

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'organize', label: 'Organize' },
    { key: 'completed', label: 'Completed' },
    { key: 'leaderboard', label: 'Leaderboard' },
  ];

  // ─── Upcoming Tab ───

  const renderUpcoming = () => (
    <>
      <Text style={s.sectionTitle}>Upcoming Cleanup Drives</Text>
      {DEMO_UPCOMING.map((drive) => {
        const typeColor = TYPE_COLORS[drive.type] || t.text.muted;
        const typeInfo = DRIVE_TYPES.find((dt) => dt.key === drive.type);
        const progress = drive.volunteersJoined / drive.volunteersTarget;
        return (
          <View key={drive.id} style={s.driveCard}>
            <View style={s.driveHeader}>
              <View style={[s.driveTypeIcon, { backgroundColor: typeColor }]}>
                <Text style={s.driveTypeText}>{typeInfo?.icon || '?'}</Text>
              </View>
              <View style={s.driveInfo}>
                <Text style={s.driveTitle}>{drive.title}</Text>
                <Text style={s.driveMeta}>{drive.location} | {drive.date} at {drive.time}</Text>
              </View>
            </View>
            <Text style={s.driveSupplies}>Supplies: {drive.suppliesNeeded.join(', ')}</Text>
            <View style={s.driveFooter}>
              <View style={s.volunteerProgress}>
                <Text style={s.volunteerText}>
                  {drive.volunteersJoined}/{drive.volunteersTarget} volunteers
                </Text>
                <View style={s.progressBar}>
                  <View style={[s.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
                </View>
              </View>
              <TouchableOpacity style={s.joinBtn} onPress={() => handleJoinDrive(drive)}>
                <Text style={s.joinBtnText}>Join</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </>
  );

  // ─── Organize Tab ───

  const renderOrganize = () => (
    <View style={s.card}>
      <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Organize a Cleanup Drive</Text>

      <TextInput
        style={s.input}
        placeholder="Drive title"
        placeholderTextColor={t.text.muted}
        value={orgTitle}
        onChangeText={setOrgTitle}
      />

      <Text style={[s.driveMeta, { marginBottom: 8 }]}>Cleanup Type</Text>
      <View style={s.typeGrid}>
        {DRIVE_TYPES.map((dt) => (
          <TouchableOpacity
            key={dt.key}
            style={[s.typeChip, orgType === dt.key && s.typeChipSelected]}
            onPress={() => setOrgType(dt.key)}
          >
            <Text style={[s.typeChipText, orgType === dt.key && s.typeChipTextSelected]}>
              {dt.icon} {dt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={s.input}
        placeholder="Location"
        placeholderTextColor={t.text.muted}
        value={orgLocation}
        onChangeText={setOrgLocation}
      />

      <TextInput
        style={s.input}
        placeholder="Date (YYYY-MM-DD)"
        placeholderTextColor={t.text.muted}
        value={orgDate}
        onChangeText={setOrgDate}
      />

      <TextInput
        style={s.input}
        placeholder="Time (e.g. 8:00 AM)"
        placeholderTextColor={t.text.muted}
        value={orgTime}
        onChangeText={setOrgTime}
      />

      <TextInput
        style={s.input}
        placeholder="Supplies needed (comma-separated)"
        placeholderTextColor={t.text.muted}
        value={orgSupplies}
        onChangeText={setOrgSupplies}
      />

      <TextInput
        style={s.input}
        placeholder="Volunteer target"
        placeholderTextColor={t.text.muted}
        keyboardType="numeric"
        value={orgTarget}
        onChangeText={setOrgTarget}
      />

      <TouchableOpacity style={s.submitBtn} onPress={handleOrganize}>
        <Text style={s.submitText}>Create Cleanup Drive</Text>
      </TouchableOpacity>
    </View>
  );

  // ─── Completed Tab ───

  const renderCompleted = () => (
    <>
      <Text style={s.sectionTitle}>Completed Drives</Text>
      {DEMO_COMPLETED.map((drive) => {
        const stats = DEMO_STATS[drive.id];
        const typeColor = TYPE_COLORS[drive.type] || t.text.muted;
        const typeInfo = DRIVE_TYPES.find((dt) => dt.key === drive.type);
        return (
          <View key={drive.id}>
            <View style={s.driveCard}>
              <View style={s.driveHeader}>
                <View style={[s.driveTypeIcon, { backgroundColor: typeColor }]}>
                  <Text style={s.driveTypeText}>{typeInfo?.icon || '?'}</Text>
                </View>
                <View style={s.driveInfo}>
                  <Text style={s.driveTitle}>{drive.title}</Text>
                  <Text style={s.driveMeta}>{drive.location} | {drive.date}</Text>
                </View>
              </View>
            </View>
            {stats && (
              <View style={s.statsCard}>
                <View style={s.statsRow}>
                  <View style={s.statItem}>
                    <Text style={s.statValue}>{stats.trashCollectedKg}</Text>
                    <Text style={s.statLabel}>kg Trash</Text>
                  </View>
                  <View style={s.statItem}>
                    <Text style={s.statValue}>{(stats.areaCleanedSqM / 1000).toFixed(1)}k</Text>
                    <Text style={s.statLabel}>sq m Cleaned</Text>
                  </View>
                  <View style={s.statItem}>
                    <Text style={s.statValue}>{stats.volunteersParticipated}</Text>
                    <Text style={s.statLabel}>Volunteers</Text>
                  </View>
                  <View style={s.statItem}>
                    <Text style={s.statValue}>{stats.durationHours}h</Text>
                    <Text style={s.statLabel}>Duration</Text>
                  </View>
                </View>
                <View style={s.hashRow}>
                  <View>
                    <Text style={s.hashLabel}>Before Photo Hash</Text>
                    <Text style={s.hashValue}>{stats.beforePhotoHash}</Text>
                  </View>
                  <View>
                    <Text style={s.hashLabel}>After Photo Hash</Text>
                    <Text style={s.hashValue}>{stats.afterPhotoHash}</Text>
                  </View>
                </View>
                <View style={s.cotkBadge}>
                  <Text style={s.cotkText}>+{stats.cotkEarned} cOTK</Text>
                  <Text style={s.cotkLabel}>earned from this drive</Text>
                  {stats.verifiedOnChain && (
                    <Text style={s.verifiedBadge}>Verified On-Chain</Text>
                  )}
                </View>
              </View>
            )}
          </View>
        );
      })}
    </>
  );

  // ─── Leaderboard Tab ───

  const renderLeaderboard = () => (
    <>
      <Text style={s.sectionTitle}>Top Cleanup Volunteers</Text>
      <View style={s.card}>
        {DEMO_LEADERBOARD.map((entry) => {
          const isYou = entry.uid === 'you';
          return (
            <View key={entry.uid} style={[s.leaderRow, isYou && { backgroundColor: t.accent.green + '10', borderRadius: 10, paddingHorizontal: 8 }]}>
              <Text style={[s.rankNum, entry.rank <= 3 && { color: t.accent.orange }]}>
                #{entry.rank}
              </Text>
              <View style={s.leaderInfo}>
                <Text style={[s.leaderName, isYou && { color: t.accent.green }]}>
                  {entry.name}
                </Text>
                <Text style={s.leaderMeta}>
                  {entry.drivesCompleted} drives | {entry.totalCotkEarned.toLocaleString()} cOTK
                </Text>
              </View>
              <View style={s.leaderTrash}>
                <Text style={s.leaderTrashText}>{entry.totalTrashKg}</Text>
                <Text style={s.leaderTrashLabel}>kg collected</Text>
              </View>
            </View>
          );
        })}
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Cleanup Drives</Text>
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
        {tab === 'upcoming' && renderUpcoming()}
        {tab === 'organize' && renderOrganize()}
        {tab === 'completed' && renderCompleted()}
        {tab === 'leaderboard' && renderLeaderboard()}
      </ScrollView>
    </SafeAreaView>
  );
}
