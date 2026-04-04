import { fonts } from '../utils/theme';
/**
 * Support Group Screen — Find and join peer support groups on any topic.
 *
 * Article I: "No one should face life's challenges alone."
 * Article III: Community support is a fundamental human value.
 *
 * Features:
 * - Browse support groups by category (health, grief, career, addiction, etc.)
 * - View and manage joined groups
 * - Create new support groups
 * - Meeting schedules and attendance tracking
 * - Anonymous participation options
 * - Demo mode with sample support groups
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface SupportGroup {
  id: string;
  name: string;
  category: string;
  description: string;
  memberCount: number;
  meetingDay: string;
  meetingTime: string;
  facilitator: string;
  isAnonymous: boolean;
  isVirtual: boolean;
  joined: boolean;
}

interface MyGroup {
  id: string;
  name: string;
  category: string;
  nextMeeting: string;
  attendedCount: number;
  totalMeetings: number;
  role: 'member' | 'facilitator';
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'health', label: 'Health' },
  { key: 'grief', label: 'Grief' },
  { key: 'career', label: 'Career' },
  { key: 'addiction', label: 'Recovery' },
  { key: 'parenting', label: 'Parenting' },
  { key: 'mental', label: 'Mental Health' },
  { key: 'financial', label: 'Financial' },
];

const CATEGORY_COLORS: Record<string, string> = {
  health: '#34C759',
  grief: '#AF52DE',
  career: '#007AFF',
  addiction: '#FF9500',
  parenting: '#FF2D55',
  mental: '#5AC8FA',
  financial: '#FFCC00',
};

// ─── Demo Data ───

const DEMO_GROUPS: SupportGroup[] = [
  { id: 'sg1', name: 'Anxiety & Stress Circle', category: 'mental', description: 'A safe space to share coping strategies for anxiety and daily stress.', memberCount: 24, meetingDay: 'Tuesday', meetingTime: '7:00 PM', facilitator: 'Dr. Sarah Lin', isAnonymous: true, isVirtual: true, joined: true },
  { id: 'sg2', name: 'Grief Recovery Journey', category: 'grief', description: 'Supporting each other through loss. All forms of grief welcome.', memberCount: 18, meetingDay: 'Thursday', meetingTime: '6:30 PM', facilitator: 'Maria Gonzalez', isAnonymous: true, isVirtual: false, joined: false },
  { id: 'sg3', name: 'Career Transition Support', category: 'career', description: 'For professionals navigating career changes, layoffs, or new directions.', memberCount: 32, meetingDay: 'Wednesday', meetingTime: '8:00 PM', facilitator: 'James Park', isAnonymous: false, isVirtual: true, joined: true },
  { id: 'sg4', name: 'New Parents Circle', category: 'parenting', description: 'First-time parents sharing experiences, tips, and emotional support.', memberCount: 15, meetingDay: 'Saturday', meetingTime: '10:00 AM', facilitator: 'Lisa Chen', isAnonymous: false, isVirtual: false, joined: false },
  { id: 'sg5', name: 'Sobriety Together', category: 'addiction', description: 'Peer-led recovery group. Celebrating milestones and supporting struggles.', memberCount: 28, meetingDay: 'Monday', meetingTime: '7:30 PM', facilitator: 'Anonymous', isAnonymous: true, isVirtual: true, joined: false },
  { id: 'sg6', name: 'Chronic Pain Warriors', category: 'health', description: 'Living with chronic pain. Sharing treatments, coping methods, and hope.', memberCount: 21, meetingDay: 'Friday', meetingTime: '5:00 PM', facilitator: 'Dr. Raj Patel', isAnonymous: false, isVirtual: true, joined: false },
  { id: 'sg7', name: 'Debt-Free Journey', category: 'financial', description: 'Working together to become debt-free. Budgeting tips and accountability.', memberCount: 19, meetingDay: 'Sunday', meetingTime: '4:00 PM', facilitator: 'Amanda Brooks', isAnonymous: true, isVirtual: true, joined: true },
];

const DEMO_MY_GROUPS: MyGroup[] = [
  { id: 'sg1', name: 'Anxiety & Stress Circle', category: 'mental', nextMeeting: '2026-04-01 7:00 PM', attendedCount: 8, totalMeetings: 12, role: 'member' },
  { id: 'sg3', name: 'Career Transition Support', category: 'career', nextMeeting: '2026-04-02 8:00 PM', attendedCount: 5, totalMeetings: 6, role: 'member' },
  { id: 'sg7', name: 'Debt-Free Journey', category: 'financial', nextMeeting: '2026-04-06 4:00 PM', attendedCount: 3, totalMeetings: 4, role: 'facilitator' },
];

type Tab = 'browse' | 'my-groups' | 'create';

export function SupportGroupScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('browse');
  const [filterCat, setFilterCat] = useState('all');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newAnonymous, setNewAnonymous] = useState(false);
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const filteredGroups = useMemo(() =>
    filterCat === 'all' ? DEMO_GROUPS : DEMO_GROUPS.filter((g) => g.category === filterCat),
    [filterCat],
  );

  const handleJoin = useCallback((group: SupportGroup) => {
    Alert.alert('Joined Group', `Welcome to "${group.name}". Next meeting: ${group.meetingDay} at ${group.meetingTime}.`);
  }, []);

  const handleCreate = useCallback(() => {
    if (!newName.trim()) { Alert.alert('Required', 'Enter a group name.'); return; }
    if (!newCategory) { Alert.alert('Required', 'Select a category.'); return; }
    if (!newDesc.trim()) { Alert.alert('Required', 'Enter a description.'); return; }
    Alert.alert('Group Created', `"${newName}" has been created. You are the facilitator.`);
    setNewName('');
    setNewDesc('');
    setNewCategory('');
    setNewAnonymous(false);
    setTab('my-groups');
  }, [newName, newCategory, newDesc]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.blue + '20' },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.blue },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    filterRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 6, marginBottom: 12 },
    filterChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: t.bg.secondary },
    filterActive: { backgroundColor: t.accent.blue + '20', borderColor: t.accent.blue },
    filterText: { color: t.text.muted, fontSize: fonts.xs, fontWeight: fonts.semibold },
    filterTextActive: { color: t.accent.blue },
    groupCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    groupName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, flex: 1 },
    groupCat: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    groupCatText: { color: '#fff', fontSize: fonts.xs, fontWeight: fonts.bold },
    groupDesc: { color: t.text.muted, fontSize: fonts.sm, marginTop: 6, lineHeight: 20 },
    groupMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 8 },
    groupTags: { flexDirection: 'row', gap: 8, marginTop: 6 },
    groupTag: { color: t.accent.blue, fontSize: fonts.xs, fontWeight: fonts.semibold },
    groupFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    groupMembers: { color: t.text.muted, fontSize: fonts.sm },
    joinBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    joinBtnText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.semibold },
    joinedBadge: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold },
    myGroupCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    myGroupName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    myGroupMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    myGroupStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    myGroupStat: { alignItems: 'center' },
    myGroupStatVal: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    myGroupStatLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md, marginBottom: 12 },
    catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    catChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, borderWidth: 1, borderColor: t.bg.primary },
    catChipActive: { backgroundColor: t.accent.blue + '20', borderColor: t.accent.blue },
    catText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    catTextActive: { color: t.accent.blue },
    toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
    toggleLabel: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    toggleBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
    submitBtn: { backgroundColor: t.accent.blue, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.bold },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'browse', label: 'Browse' },
    { key: 'my-groups', label: 'My Groups' },
    { key: 'create', label: 'Create' },
  ];

  // ─── Browse Tab ───

  const renderBrowse = () => (
    <>
      <View style={s.filterRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity key={cat.key} style={[s.filterChip, filterCat === cat.key && s.filterActive]} onPress={() => setFilterCat(cat.key)}>
            <Text style={[s.filterText, filterCat === cat.key && s.filterTextActive]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredGroups.map((group) => (
        <View key={group.id} style={s.groupCard}>
          <View style={s.groupHeader}>
            <Text style={s.groupName}>{group.name}</Text>
            <View style={[s.groupCat, { backgroundColor: CATEGORY_COLORS[group.category] || t.text.muted }]}>
              <Text style={s.groupCatText}>{group.category.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={s.groupDesc}>{group.description}</Text>
          <Text style={s.groupMeta}>{group.meetingDay}s at {group.meetingTime} | Led by {group.facilitator}</Text>
          <View style={s.groupTags}>
            {group.isAnonymous && <Text style={s.groupTag}>Anonymous</Text>}
            {group.isVirtual && <Text style={s.groupTag}>Virtual</Text>}
          </View>
          <View style={s.groupFooter}>
            <Text style={s.groupMembers}>{group.memberCount} members</Text>
            {group.joined ? (
              <Text style={s.joinedBadge}>Joined</Text>
            ) : (
              <TouchableOpacity style={s.joinBtn} onPress={() => handleJoin(group)}>
                <Text style={s.joinBtnText}>Join Group</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}
    </>
  );

  // ─── My Groups Tab ───

  const renderMyGroups = () => (
    <>
      <Text style={s.sectionTitle}>My Support Groups</Text>
      {DEMO_MY_GROUPS.map((mg) => (
        <View key={mg.id} style={s.myGroupCard}>
          <Text style={s.myGroupName}>{mg.name}</Text>
          <Text style={s.myGroupMeta}>Next: {mg.nextMeeting} | Role: {mg.role}</Text>
          <View style={s.myGroupStats}>
            <View style={s.myGroupStat}>
              <Text style={s.myGroupStatVal}>{mg.attendedCount}</Text>
              <Text style={s.myGroupStatLabel}>Attended</Text>
            </View>
            <View style={s.myGroupStat}>
              <Text style={s.myGroupStatVal}>{mg.totalMeetings}</Text>
              <Text style={s.myGroupStatLabel}>Total</Text>
            </View>
            <View style={s.myGroupStat}>
              <Text style={[s.myGroupStatVal, { color: t.accent.green }]}>{Math.round((mg.attendedCount / mg.totalMeetings) * 100)}%</Text>
              <Text style={s.myGroupStatLabel}>Attendance</Text>
            </View>
          </View>
        </View>
      ))}
    </>
  );

  // ─── Create Tab ───

  const renderCreate = () => (
    <View style={s.card}>
      <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Create Support Group</Text>
      <TextInput style={s.input} placeholder="Group name" placeholderTextColor={t.text.muted} value={newName} onChangeText={setNewName} />
      <TextInput style={s.input} placeholder="Description" placeholderTextColor={t.text.muted} value={newDesc} onChangeText={setNewDesc} multiline />
      <Text style={[s.myGroupMeta, { marginBottom: 8 }]}>Category</Text>
      <View style={s.catRow}>
        {CATEGORIES.filter((c) => c.key !== 'all').map((cat) => (
          <TouchableOpacity key={cat.key} style={[s.catChip, newCategory === cat.key && s.catChipActive]} onPress={() => setNewCategory(cat.key)}>
            <Text style={[s.catText, newCategory === cat.key && s.catTextActive]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={s.toggleRow}>
        <Text style={s.toggleLabel}>Anonymous Group</Text>
        <TouchableOpacity
          style={[s.toggleBtn, { borderColor: newAnonymous ? t.accent.blue : t.text.muted, backgroundColor: newAnonymous ? t.accent.blue + '20' : 'transparent' }]}
          onPress={() => setNewAnonymous(!newAnonymous)}
        >
          <Text style={{ color: newAnonymous ? t.accent.blue : t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold }}>{newAnonymous ? 'Yes' : 'No'}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={s.submitBtn} onPress={handleCreate}>
        <Text style={s.submitText}>Create Group</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Support Groups</Text>
        <View style={{ width: 60 }} />
      </View>

      {demoMode && (
        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO MODE</Text>
        </View>
      )}

      <View style={s.tabRow}>
        {tabs.map((tb) => (
          <TouchableOpacity key={tb.key} style={[s.tabBtn, tab === tb.key && s.tabActive]} onPress={() => setTab(tb.key)}>
            <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {tab === 'browse' && renderBrowse()}
        {tab === 'my-groups' && renderMyGroups()}
        {tab === 'create' && renderCreate()}
      </ScrollView>
    </SafeAreaView>
  );
}
