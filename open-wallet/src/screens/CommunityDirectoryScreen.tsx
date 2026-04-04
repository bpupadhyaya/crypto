import { fonts } from '../utils/theme';
/**
 * Community Directory Screen — Browse all community members by role/skill/interest.
 *
 * A searchable, filterable directory of everyone in your local Open Chain
 * community. Find mentors, collaborators, neighbors, and leaders.
 * "Every person has something to contribute."
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

interface Member {
  id: string;
  name: string;
  role: string;
  skills: string[];
  interests: string[];
  icon: string;
  otkEarned: number;
  joined: string;
}

interface RoleInfo {
  key: string;
  title: string;
  icon: string;
  color: string;
  count: number;
}

const DEMO_MEMBERS: Member[] = [
  { id: 'm1', name: 'Maya Krishnan', role: 'educator', skills: ['Teaching', 'Curriculum Design'], interests: ['Literacy', 'Youth'], icon: '\u{1F469}\u200D\u{1F3EB}', otkEarned: 3200, joined: '2025-06' },
  { id: 'm2', name: 'Rajesh Patel', role: 'mentor', skills: ['Engineering', 'Career Coaching'], interests: ['STEM', 'Entrepreneurship'], icon: '\u{1F468}\u200D\u{1F4BC}', otkEarned: 2800, joined: '2025-08' },
  { id: 'm3', name: 'Sarah Liu', role: 'healer', skills: ['Nutrition', 'First Aid'], interests: ['Preventive Health', 'Elderly Care'], icon: '\u{1F469}\u200D\u2695\uFE0F', otkEarned: 1950, joined: '2025-09' },
  { id: 'm4', name: 'Akira Tanaka', role: 'builder', skills: ['Carpentry', 'Solar Installation'], interests: ['Sustainability', 'Housing'], icon: '\u{1F468}\u200D\u{1F527}', otkEarned: 4100, joined: '2025-05' },
  { id: 'm5', name: 'Elena Rodriguez', role: 'caregiver', skills: ['Child Development', 'Elderly Support'], interests: ['Nurture', 'Family'], icon: '\u{1F469}\u200D\u{1F467}', otkEarned: 5600, joined: '2025-04' },
  { id: 'm6', name: 'Carlos Mendez', role: 'organizer', skills: ['Event Planning', 'Conflict Resolution'], interests: ['Governance', 'Community Building'], icon: '\u{1F468}\u200D\u{1F4CB}', otkEarned: 2100, joined: '2025-10' },
  { id: 'm7', name: 'Fatima Al-Rashid', role: 'educator', skills: ['Language Teaching', 'Translation'], interests: ['Multilingual Education', 'Cultural Exchange'], icon: '\u{1F469}\u200D\u{1F393}', otkEarned: 1800, joined: '2025-11' },
  { id: 'm8', name: 'Liam Walsh', role: 'builder', skills: ['Plumbing', 'Electrical'], interests: ['Infrastructure', 'Green Energy'], icon: '\u{1F468}\u200D\u{1F3ED}', otkEarned: 3400, joined: '2025-07' },
  { id: 'm9', name: 'Preet Singh', role: 'mentor', skills: ['Financial Literacy', 'Business Planning'], interests: ['Economic Empowerment', 'Youth'], icon: '\u{1F9D4}', otkEarned: 2600, joined: '2025-08' },
  { id: 'm10', name: 'Amara Okafor', role: 'healer', skills: ['Mental Health', 'Counseling'], interests: ['Wellness', 'Trauma Recovery'], icon: '\u{1F469}\u200D\u2695\uFE0F', otkEarned: 3000, joined: '2025-06' },
];

const ROLES: RoleInfo[] = [
  { key: 'educator', title: 'Educators', icon: '\u{1F4DA}', color: '#3b82f6', count: 2 },
  { key: 'mentor', title: 'Mentors', icon: '\u{1F31F}', color: '#f59e0b', count: 2 },
  { key: 'healer', title: 'Healers', icon: '\u{1F49A}', color: '#10b981', count: 2 },
  { key: 'builder', title: 'Builders', icon: '\u{1F528}', color: '#ef4444', count: 2 },
  { key: 'caregiver', title: 'Caregivers', icon: '\u{1F49B}', color: '#ec4899', count: 1 },
  { key: 'organizer', title: 'Organizers', icon: '\u{1F3DB}\uFE0F', color: '#8b5cf6', count: 1 },
];

export function CommunityDirectoryScreen({ onClose }: Props) {
  const t = useTheme();
  const { demoMode } = useWalletStore();
  const [activeTab, setActiveTab] = useState<'browse' | 'search' | 'roles'>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const filteredMembers = useMemo(() => {
    let list = DEMO_MEMBERS;
    if (selectedRole) list = list.filter(m => m.role === selectedRole);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.skills.some(s => s.toLowerCase().includes(q)) ||
        m.interests.some(i => i.toLowerCase().includes(q))
      );
    }
    return list;
  }, [selectedRole, searchQuery]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    demoTag: { backgroundColor: t.accent.yellow + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'center', marginBottom: 16 },
    demoText: { color: t.accent.yellow, fontSize: fonts.sm, fontWeight: fonts.bold },
    tabRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: t.bg.card, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    quote: { color: t.text.secondary, fontSize: fonts.md, fontStyle: 'italic', textAlign: 'center', lineHeight: 22, marginBottom: 20, paddingHorizontal: 12 },
    searchBox: { backgroundColor: t.bg.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: fonts.md, color: t.text.primary, marginBottom: 16, borderWidth: 1, borderColor: t.border },
    memberCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', gap: 14, alignItems: 'center' },
    memberIcon: { fontSize: fonts.hero },
    memberInfo: { flex: 1 },
    memberName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, marginBottom: 2 },
    memberRole: { fontSize: fonts.sm, fontWeight: fonts.semibold, textTransform: 'capitalize', marginBottom: 4 },
    memberSkills: { color: t.text.secondary, fontSize: fonts.sm, lineHeight: 18 },
    memberOTK: { alignItems: 'flex-end' },
    memberOTKNum: { color: t.accent.green, fontSize: fonts.lg, fontWeight: fonts.heavy },
    memberOTKLabel: { color: t.text.muted, fontSize: fonts.xs },
    memberJoined: { color: t.text.muted, fontSize: fonts.xs, marginTop: 4 },
    filterRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 16 },
    filterChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: t.bg.card },
    filterChipActive: { backgroundColor: t.accent.blue },
    filterChipText: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    filterChipTextActive: { color: '#fff' },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.heavy, marginBottom: 12 },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    statCard: { flex: 1, backgroundColor: t.bg.card, borderRadius: 12, padding: 16, alignItems: 'center' },
    statNum: { fontSize: fonts.xxl, fontWeight: fonts.heavy, marginBottom: 4 },
    statLabel: { color: t.text.muted, fontSize: fonts.xs, fontWeight: fonts.semibold, textAlign: 'center' },
    roleCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 14 },
    roleIcon: { fontSize: fonts.hero },
    roleInfo: { flex: 1 },
    roleTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    roleCount: { color: t.text.secondary, fontSize: fonts.sm },
    roleArrow: { color: t.text.muted, fontSize: fonts.xl },
    emptyText: { color: t.text.muted, fontSize: fonts.md, textAlign: 'center', marginTop: 40 },
    resultCount: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold, marginBottom: 12 },
  }), [t]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Community Directory</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {demoMode && (
          <View style={s.demoTag}>
            <Text style={s.demoText}>DEMO MODE</Text>
          </View>
        )}

        <Text style={s.quote}>"Every person has something to contribute."</Text>

        <View style={s.tabRow}>
          {(['browse', 'search', 'roles'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[s.tab, activeTab === tab && s.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                {tab === 'browse' ? 'Browse' : tab === 'search' ? 'Search' : 'Roles'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'browse' && (
          <>
            <View style={s.statsRow}>
              <View style={s.statCard}>
                <Text style={[s.statNum, { color: t.accent.blue }]}>{DEMO_MEMBERS.length}</Text>
                <Text style={s.statLabel}>Members</Text>
              </View>
              <View style={s.statCard}>
                <Text style={[s.statNum, { color: t.accent.purple }]}>{ROLES.length}</Text>
                <Text style={s.statLabel}>Roles</Text>
              </View>
              <View style={s.statCard}>
                <Text style={[s.statNum, { color: t.accent.green }]}>
                  {Math.round(DEMO_MEMBERS.reduce((a, m) => a + m.otkEarned, 0) / 1000)}k
                </Text>
                <Text style={s.statLabel}>Total OTK</Text>
              </View>
            </View>

            <View style={s.filterRow}>
              <TouchableOpacity style={[s.filterChip, !selectedRole && s.filterChipActive]} onPress={() => setSelectedRole(null)}>
                <Text style={[s.filterChipText, !selectedRole && s.filterChipTextActive]}>All</Text>
              </TouchableOpacity>
              {ROLES.map(r => (
                <TouchableOpacity key={r.key} style={[s.filterChip, selectedRole === r.key && s.filterChipActive]} onPress={() => setSelectedRole(selectedRole === r.key ? null : r.key)}>
                  <Text style={[s.filterChipText, selectedRole === r.key && s.filterChipTextActive]}>{r.icon} {r.title}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {filteredMembers.map(m => (
              <View key={m.id} style={s.memberCard}>
                <Text style={s.memberIcon}>{m.icon}</Text>
                <View style={s.memberInfo}>
                  <Text style={s.memberName}>{m.name}</Text>
                  <Text style={[s.memberRole, { color: ROLES.find(r => r.key === m.role)?.color ?? t.text.secondary }]}>{m.role}</Text>
                  <Text style={s.memberSkills}>{m.skills.join(' \u00B7 ')}</Text>
                </View>
                <View style={s.memberOTK}>
                  <Text style={s.memberOTKNum}>{m.otkEarned}</Text>
                  <Text style={s.memberOTKLabel}>OTK</Text>
                  <Text style={s.memberJoined}>{m.joined}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {activeTab === 'search' && (
          <>
            <TextInput
              style={s.searchBox}
              placeholder="Search by name, skill, or interest..."
              placeholderTextColor={t.text.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            <Text style={s.resultCount}>{filteredMembers.length} result{filteredMembers.length !== 1 ? 's' : ''}</Text>
            {filteredMembers.length === 0 ? (
              <Text style={s.emptyText}>No members match your search.</Text>
            ) : (
              filteredMembers.map(m => (
                <View key={m.id} style={s.memberCard}>
                  <Text style={s.memberIcon}>{m.icon}</Text>
                  <View style={s.memberInfo}>
                    <Text style={s.memberName}>{m.name}</Text>
                    <Text style={s.memberSkills}>{m.skills.join(' \u00B7 ')} | {m.interests.join(' \u00B7 ')}</Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {activeTab === 'roles' && (
          <>
            <Text style={s.sectionTitle}>Community Roles</Text>
            {ROLES.map(r => (
              <TouchableOpacity key={r.key} style={s.roleCard} onPress={() => { setSelectedRole(r.key); setActiveTab('browse'); }}>
                <Text style={s.roleIcon}>{r.icon}</Text>
                <View style={s.roleInfo}>
                  <Text style={s.roleTitle}>{r.title}</Text>
                  <Text style={s.roleCount}>{r.count} member{r.count !== 1 ? 's' : ''}</Text>
                </View>
                <Text style={s.roleArrow}>{'\u203A'}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
