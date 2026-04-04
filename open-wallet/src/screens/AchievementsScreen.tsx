import { fonts } from '../utils/theme';
/**
 * Achievements Screen — Soulbound milestone achievement NFTs.
 *
 * Displays the user's non-transferable achievement badges earned
 * through verified milestones on Open Chain. Each achievement is
 * permanently bound to the owner's Universal ID.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Modal,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

// --- Types ---

interface Achievement {
  id: string;
  uid: string;
  milestoneId: string;
  channel: string;
  title: string;
  description: string;
  level: number;       // 1=bronze, 2=silver, 3=gold, 4=platinum, 5=diamond
  mintedAt: number;    // block height
  imageUri: string;
  metadata: Record<string, string>;
}

const LEVEL_NAMES: Record<number, string> = {
  1: 'Bronze', 2: 'Silver', 3: 'Gold', 4: 'Platinum', 5: 'Diamond',
};

const LEVEL_COLORS: Record<number, string> = {
  1: '#cd7f32', 2: '#c0c0c0', 3: '#ffd700', 4: '#e5e4e2', 5: '#b9f2ff',
};

const LEVEL_ICONS: Record<number, string> = {
  1: '\u2B50',    // star
  2: '\u{1F31F}', // glowing star
  3: '\u{1F3C6}', // trophy
  4: '\u{1F48E}', // gem
  5: '\u{1F537}', // diamond
};

const CHANNEL_ICONS: Record<string, string> = {
  nurture: '\u{1F49B}',     // yellow heart
  education: '\u{1F4DA}',   // books
  health: '\u{1F49A}',      // green heart
  community: '\u{1F91D}',   // handshake
  governance: '\u{1F3DB}',  // classical building
  economic: '\u{1F4B0}',    // money bag
};

// --- Demo data ---

const DEMO_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach_001', uid: 'uid_demo_self', milestoneId: 'ms_001',
    channel: 'education', title: 'First Steps in Reading',
    description: 'Child achieved grade-level reading proficiency at age 6. Verified by 3 educators.',
    level: 2, mintedAt: 1000, imageUri: '',
    metadata: { verifiers: '3', otkMinted: '50' },
  },
  {
    id: 'ach_002', uid: 'uid_demo_self', milestoneId: 'ms_002',
    channel: 'nurture', title: 'Nurturing Foundation',
    description: 'Provided consistent emotional support and stability for a child through early development years.',
    level: 3, mintedAt: 2500, imageUri: '',
    metadata: { verifiers: '5', otkMinted: '200' },
  },
  {
    id: 'ach_003', uid: 'uid_demo_self', milestoneId: 'ms_003',
    channel: 'health', title: 'Wellness Champion',
    description: 'Maintained comprehensive health checkups and vaccinations for family members over 5 years.',
    level: 1, mintedAt: 3200, imageUri: '',
    metadata: { verifiers: '2', otkMinted: '5' },
  },
  {
    id: 'ach_004', uid: 'uid_demo_self', milestoneId: 'ms_004',
    channel: 'community', title: 'Community Builder',
    description: 'Organized and led neighborhood improvement projects benefiting 200+ families.',
    level: 4, mintedAt: 5100, imageUri: '',
    metadata: { verifiers: '8', otkMinted: '1500' },
  },
  {
    id: 'ach_005', uid: 'uid_demo_self', milestoneId: 'ms_005',
    channel: 'education', title: 'Mentor of the Year',
    description: 'Mentored 15 students who all achieved college admission. Recognized by the education council.',
    level: 3, mintedAt: 6800, imageUri: '',
    metadata: { verifiers: '6', otkMinted: '500' },
  },
  {
    id: 'ach_006', uid: 'uid_demo_self', milestoneId: 'ms_006',
    channel: 'governance', title: 'Civic Participation Pioneer',
    description: 'Participated in 10 governance proposals and helped shape local policy on education funding.',
    level: 2, mintedAt: 7500, imageUri: '',
    metadata: { verifiers: '4', otkMinted: '30' },
  },
  {
    id: 'ach_007', uid: 'uid_demo_self', milestoneId: 'ms_007',
    channel: 'nurture', title: 'Diamond Caregiver',
    description: 'Lifetime dedication to raising children who became positive contributors to society across multiple communities.',
    level: 5, mintedAt: 12000, imageUri: '',
    metadata: { verifiers: '12', otkMinted: '15000' },
  },
];

// --- Component ---

interface Props {
  onClose: () => void;
}

export function AchievementsScreen({ onClose }: Props) {
  const t = useTheme();
  const [selected, setSelected] = useState<Achievement | null>(null);
  const [filterChannel, setFilterChannel] = useState<string | null>(null);

  const achievements = DEMO_ACHIEVEMENTS;

  const filtered = useMemo(() => {
    if (!filterChannel) return achievements;
    return achievements.filter(a => a.channel === filterChannel);
  }, [achievements, filterChannel]);

  const stats = useMemo(() => {
    const byChannel: Record<string, number> = {};
    const byLevel: Record<number, number> = {};
    let highest = 0;
    for (const a of achievements) {
      byChannel[a.channel] = (byChannel[a.channel] || 0) + 1;
      byLevel[a.level] = (byLevel[a.level] || 0) + 1;
      if (a.level > highest) highest = a.level;
    }
    return { total: achievements.length, byChannel, byLevel, highest };
  }, [achievements]);

  const channels = useMemo(() => {
    const set = new Set(achievements.map(a => a.channel));
    return Array.from(set).sort();
  }, [achievements]);

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    headerTitle: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.bold },
    closeText: { color: t.accent.blue, fontSize: fonts.lg },
    section: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 20, marginBottom: 8, marginLeft: 4 },
    statsCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
    statBox: { alignItems: 'center' },
    statNumber: { color: t.text.primary, fontSize: fonts.xxl, fontWeight: fonts.bold },
    statLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    soulboundBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg.primary, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, marginTop: 8 },
    soulboundText: { color: t.text.secondary, fontSize: fonts.xs, fontWeight: fonts.semibold, marginLeft: 6 },
    filterRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
    filterChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: t.border },
    filterChipActive: { backgroundColor: t.accent.green },
    filterText: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    filterTextActive: { color: t.bg.primary },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    badge: { width: '47%' as any, backgroundColor: t.bg.card, borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 2 },
    badgeIcon: { fontSize: fonts.hero, marginBottom: 6 },
    badgeTitle: { color: t.text.primary, fontSize: fonts.sm, fontWeight: fonts.bold, textAlign: 'center', marginBottom: 4 },
    badgeChannel: { fontSize: fonts.xs, fontWeight: fonts.semibold, textTransform: 'uppercase', letterSpacing: 1 },
    badgeLevel: { fontSize: fonts.xs, fontWeight: fonts.bold, marginTop: 4 },
    badgeBlock: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    // Detail modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalCard: { backgroundColor: t.bg.card, borderRadius: 20, padding: 24, width: '100%', maxWidth: 360, borderWidth: 3 },
    modalIcon: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
    modalTitle: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.bold, textAlign: 'center', marginBottom: 4 },
    modalLevel: { fontSize: fonts.md, fontWeight: fonts.bold, textAlign: 'center', marginBottom: 12 },
    modalDesc: { color: t.text.secondary, fontSize: fonts.md, lineHeight: 20, marginBottom: 16 },
    modalMeta: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 12, marginBottom: 16 },
    modalMetaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    modalMetaLabel: { color: t.text.muted, fontSize: fonts.sm },
    modalMetaValue: { color: t.text.primary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    modalSoulbound: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg.primary, borderRadius: 8, paddingVertical: 8, marginBottom: 16 },
    modalSoulboundText: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, marginLeft: 6 },
    modalClose: { backgroundColor: t.accent.blue, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    modalCloseText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    emptyText: { color: t.text.muted, fontSize: fonts.md, textAlign: 'center', marginTop: 40 },
    demoTag: { backgroundColor: t.accent.purple + '30', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, alignSelf: 'center', marginBottom: 12 },
    demoTagText: { color: t.accent.purple, fontSize: fonts.xs, fontWeight: fonts.bold },
  }), [t]);

  const renderBadge = (ach: Achievement) => {
    const color = LEVEL_COLORS[ach.level] || '#888';
    const icon = CHANNEL_ICONS[ach.channel] || '\u2B50';
    return (
      <TouchableOpacity
        key={ach.id}
        style={[st.badge, { borderColor: color }]}
        onPress={() => setSelected(ach)}
        activeOpacity={0.7}
      >
        <Text style={st.badgeIcon}>{icon}</Text>
        <Text style={st.badgeTitle} numberOfLines={2}>{ach.title}</Text>
        <Text style={[st.badgeChannel, { color: t.text.muted }]}>
          {ach.channel}
        </Text>
        <Text style={[st.badgeLevel, { color }]}>
          {LEVEL_ICONS[ach.level]} {LEVEL_NAMES[ach.level]}
        </Text>
        <Text style={st.badgeBlock}>Block #{ach.mintedAt}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.headerTitle}>Achievements</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll}>

        {/* Demo mode tag */}
        <View style={st.demoTag}>
          <Text style={st.demoTagText}>DEMO MODE</Text>
        </View>

        {/* Stats */}
        <Text style={st.section}>Overview</Text>
        <View style={st.statsCard}>
          <View style={st.statsRow}>
            <View style={st.statBox}>
              <Text style={st.statNumber}>{stats.total}</Text>
              <Text style={st.statLabel}>Total</Text>
            </View>
            <View style={st.statBox}>
              <Text style={st.statNumber}>{Object.keys(stats.byChannel).length}</Text>
              <Text style={st.statLabel}>Channels</Text>
            </View>
            <View style={st.statBox}>
              <Text style={[st.statNumber, { color: LEVEL_COLORS[stats.highest] }]}>
                {LEVEL_NAMES[stats.highest] || 'None'}
              </Text>
              <Text style={st.statLabel}>Rarest</Text>
            </View>
          </View>

          {/* Level breakdown */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            {[5, 4, 3, 2, 1].map(level => {
              const count = stats.byLevel[level] || 0;
              if (count === 0) return null;
              return (
                <View key={level} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Text style={{ color: LEVEL_COLORS[level], fontSize: fonts.sm, fontWeight: fonts.bold }}>
                    {LEVEL_ICONS[level]} {count}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Soulbound badge */}
          <View style={st.soulboundBadge}>
            <Text style={{ fontSize: fonts.md }}>{'\u{1F512}'}</Text>
            <Text style={st.soulboundText}>Soulbound — Non-Transferable</Text>
          </View>
        </View>

        {/* Channel filter */}
        <Text style={st.section}>Achievements</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <View style={st.filterRow}>
            <TouchableOpacity
              style={[st.filterChip, !filterChannel && st.filterChipActive]}
              onPress={() => setFilterChannel(null)}
            >
              <Text style={[st.filterText, !filterChannel && st.filterTextActive]}>All</Text>
            </TouchableOpacity>
            {channels.map(ch => (
              <TouchableOpacity
                key={ch}
                style={[st.filterChip, filterChannel === ch && st.filterChipActive]}
                onPress={() => setFilterChannel(filterChannel === ch ? null : ch)}
              >
                <Text style={[st.filterText, filterChannel === ch && st.filterTextActive]}>
                  {CHANNEL_ICONS[ch] || ''} {ch.charAt(0).toUpperCase() + ch.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Badge grid */}
        {filtered.length === 0 ? (
          <Text style={st.emptyText}>No achievements yet. Verify milestones to earn soulbound badges.</Text>
        ) : (
          <View style={st.grid}>
            {filtered.map(renderBadge)}
          </View>
        )}

      </ScrollView>

      {/* Detail modal */}
      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        {selected && (
          <TouchableOpacity style={st.modalOverlay} activeOpacity={1} onPress={() => setSelected(null)}>
            <TouchableOpacity activeOpacity={1} style={[st.modalCard, { borderColor: LEVEL_COLORS[selected.level] }]}>
              <Text style={st.modalIcon}>{CHANNEL_ICONS[selected.channel] || '\u2B50'}</Text>
              <Text style={st.modalTitle}>{selected.title}</Text>
              <Text style={[st.modalLevel, { color: LEVEL_COLORS[selected.level] }]}>
                {LEVEL_ICONS[selected.level]} {LEVEL_NAMES[selected.level]} Achievement
              </Text>
              <Text style={st.modalDesc}>{selected.description}</Text>

              <View style={st.modalMeta}>
                <View style={st.modalMetaRow}>
                  <Text style={st.modalMetaLabel}>Channel</Text>
                  <Text style={st.modalMetaValue}>{selected.channel.charAt(0).toUpperCase() + selected.channel.slice(1)}</Text>
                </View>
                <View style={st.modalMetaRow}>
                  <Text style={st.modalMetaLabel}>Minted at Block</Text>
                  <Text style={st.modalMetaValue}>#{selected.mintedAt}</Text>
                </View>
                <View style={st.modalMetaRow}>
                  <Text style={st.modalMetaLabel}>Achievement ID</Text>
                  <Text style={st.modalMetaValue}>{selected.id}</Text>
                </View>
                {selected.metadata.verifiers && (
                  <View style={st.modalMetaRow}>
                    <Text style={st.modalMetaLabel}>Verifiers</Text>
                    <Text style={st.modalMetaValue}>{selected.metadata.verifiers}</Text>
                  </View>
                )}
                {selected.metadata.otkMinted && (
                  <View style={st.modalMetaRow}>
                    <Text style={st.modalMetaLabel}>OTK Minted</Text>
                    <Text style={st.modalMetaValue}>{selected.metadata.otkMinted} OTK</Text>
                  </View>
                )}
              </View>

              <View style={st.modalSoulbound}>
                <Text style={{ fontSize: fonts.md }}>{'\u{1F512}'}</Text>
                <Text style={st.modalSoulboundText}>Soulbound — Cannot be transferred or traded</Text>
              </View>

              <TouchableOpacity style={st.modalClose} onPress={() => setSelected(null)}>
                <Text style={st.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      </Modal>
    </SafeAreaView>
  );
}
