import { fonts } from '../utils/theme';
/**
 * Skill Tree — Visual progression tree for all life skills across OTK channels.
 *
 * Each channel (nurture, education, health, community, economic, governance)
 * has a skill tree with nodes that unlock as you earn OTK in that channel.
 * This gamifies personal growth while keeping it grounded in real contributions.
 *
 * Features:
 * - Tree view: hierarchical skill nodes per channel
 * - Progress: overall completion percentage and level
 * - Unlock: view requirements and unlock new skills
 * - Demo mode with sample skill data
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

type SkillTab = 'tree' | 'progress' | 'unlock';

interface SkillNode {
  id: string;
  name: string;
  channel: string;
  icon: string;
  level: number;
  maxLevel: number;
  otkRequired: number;
  otkEarned: number;
  unlocked: boolean;
  children: string[];
  description: string;
}

interface ChannelProgress {
  channel: string;
  label: string;
  icon: string;
  color: string;
  totalSkills: number;
  unlockedSkills: number;
  totalOTK: number;
  earnedOTK: number;
}

const CHANNEL_META: Record<string, { label: string; icon: string; color: string }> = {
  nurture:    { label: 'Nurture',    icon: '\u{1F49B}', color: '#ef4444' },
  education:  { label: 'Education',  icon: '\u{1F4DA}', color: '#3b82f6' },
  health:     { label: 'Health',     icon: '\u{1FA7A}', color: '#22c55e' },
  community:  { label: 'Community',  icon: '\u{1F91D}', color: '#8b5cf6' },
  economic:   { label: 'Economic',   icon: '\u{1F4B0}', color: '#f7931a' },
  governance: { label: 'Governance', icon: '\u{1F5F3}', color: '#eab308' },
};

const DEMO_SKILLS: SkillNode[] = [
  { id: 's1', name: 'First Mentor Session', channel: 'nurture', icon: '\u{1F331}', level: 3, maxLevel: 5, otkRequired: 100, otkEarned: 150, unlocked: true, children: ['s2', 's3'], description: 'Complete your first mentoring session with a community member.' },
  { id: 's2', name: 'Family Support', channel: 'nurture', icon: '\u{1F3E0}', level: 2, maxLevel: 5, otkRequired: 300, otkEarned: 200, unlocked: true, children: ['s4'], description: 'Provide documented support to family members in need.' },
  { id: 's3', name: 'Childcare Champion', channel: 'nurture', icon: '\u{1F476}', level: 1, maxLevel: 5, otkRequired: 500, otkEarned: 120, unlocked: true, children: ['s4'], description: 'Log consistent childcare contributions over 30 days.' },
  { id: 's4', name: 'Nurture Leader', channel: 'nurture', icon: '\u{1F451}', level: 0, maxLevel: 5, otkRequired: 1000, otkEarned: 0, unlocked: false, children: [], description: 'Reach top-tier nurture status with sustained contributions.' },
  { id: 's5', name: 'First Lesson', channel: 'education', icon: '\u{270D}', level: 4, maxLevel: 5, otkRequired: 100, otkEarned: 400, unlocked: true, children: ['s6'], description: 'Teach or attend your first community lesson.' },
  { id: 's6', name: 'Knowledge Sharer', channel: 'education', icon: '\u{1F4D6}', level: 2, maxLevel: 5, otkRequired: 500, otkEarned: 280, unlocked: true, children: ['s7'], description: 'Share knowledge articles that get verified by peers.' },
  { id: 's7', name: 'Curriculum Builder', channel: 'education', icon: '\u{1F3EB}', level: 0, maxLevel: 5, otkRequired: 1500, otkEarned: 0, unlocked: false, children: [], description: 'Design and publish a complete learning curriculum.' },
  { id: 's8', name: 'Wellness Beginner', channel: 'health', icon: '\u{1F3C3}', level: 5, maxLevel: 5, otkRequired: 50, otkEarned: 300, unlocked: true, children: ['s9'], description: 'Log your first week of wellness activities.' },
  { id: 's9', name: 'Health Advocate', channel: 'health', icon: '\u{2764}', level: 1, maxLevel: 5, otkRequired: 400, otkEarned: 100, unlocked: true, children: [], description: 'Promote community health initiatives consistently.' },
  { id: 's10', name: 'Community Builder', channel: 'community', icon: '\u{1F3D7}', level: 3, maxLevel: 5, otkRequired: 200, otkEarned: 350, unlocked: true, children: ['s11'], description: 'Organize or lead community building events.' },
  { id: 's11', name: 'Conflict Resolver', channel: 'community', icon: '\u{1F54A}', level: 0, maxLevel: 5, otkRequired: 800, otkEarned: 0, unlocked: false, children: [], description: 'Successfully mediate community disputes.' },
  { id: 's12', name: 'First Voter', channel: 'governance', icon: '\u{2705}', level: 4, maxLevel: 5, otkRequired: 50, otkEarned: 200, unlocked: true, children: ['s13'], description: 'Cast your first governance vote.' },
  { id: 's13', name: 'Proposal Author', channel: 'governance', icon: '\u{1F4DD}', level: 0, maxLevel: 5, otkRequired: 600, otkEarned: 0, unlocked: false, children: [], description: 'Draft and submit a governance proposal.' },
];

export function SkillTreeScreen({ onClose }: Props) {
  const { demoMode } = useWalletStore();
  const t = useTheme();
  const [activeTab, setActiveTab] = useState<SkillTab>('tree');
  const [selectedChannel, setSelectedChannel] = useState<string>('nurture');

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 8 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.bold },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { flex: 1, paddingHorizontal: 16 },
    subtitle: { color: t.text.muted, fontSize: fonts.sm, lineHeight: 19, marginBottom: 16 },
    tabRow: { flexDirection: 'row', marginBottom: 16, gap: 4 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: t.bg.card, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    card: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    label: { color: t.text.muted, fontSize: fonts.sm },
    val: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    empty: { color: t.text.muted, fontSize: fonts.md, textAlign: 'center', marginTop: 40 },
    channelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    channelChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: t.bg.card },
    channelChipActive: { backgroundColor: t.accent.blue },
    channelChipText: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    channelChipTextActive: { color: '#fff' },
    skillName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, marginBottom: 2 },
    skillDesc: { color: t.text.muted, fontSize: fonts.sm, lineHeight: 17, marginTop: 4 },
    barContainer: { height: 8, backgroundColor: t.border, borderRadius: 4, marginVertical: 6, overflow: 'hidden' },
    barFill: { height: 8, borderRadius: 4 },
    levelText: { color: t.text.secondary, fontSize: fonts.xs, fontWeight: fonts.bold },
    lockIcon: { fontSize: fonts.xl, marginRight: 10 },
    progressNum: { fontSize: fonts.xxl, fontWeight: fonts.heavy, marginBottom: 2 },
    progressLabel: { color: t.text.muted, fontSize: fonts.xs, fontWeight: fonts.semibold },
    summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    summaryCard: { flex: 1, backgroundColor: t.bg.card, borderRadius: 12, padding: 14, alignItems: 'center' },
    unlockReq: { color: t.accent.yellow, fontSize: fonts.sm, fontWeight: fonts.bold, marginTop: 4 },
  }), [t]);

  const skills = demoMode ? DEMO_SKILLS : [];
  const channelSkills = useMemo(() => skills.filter(s => s.channel === selectedChannel), [skills, selectedChannel]);

  const channelProgress: ChannelProgress[] = useMemo(() => {
    return Object.entries(CHANNEL_META).map(([ch, meta]) => {
      const chSkills = skills.filter(s => s.channel === ch);
      const unlocked = chSkills.filter(s => s.unlocked).length;
      const totalOTK = chSkills.reduce((sum, s) => sum + s.otkRequired, 0);
      const earned = chSkills.reduce((sum, s) => sum + s.otkEarned, 0);
      return { channel: ch, ...meta, totalSkills: chSkills.length, unlockedSkills: unlocked, totalOTK: totalOTK, earnedOTK: earned };
    });
  }, [skills]);

  const lockedSkills = useMemo(() => skills.filter(s => !s.unlocked), [skills]);
  const totalUnlocked = skills.filter(s => s.unlocked).length;

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.title}>Skill Tree</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={st.scroll}>
        <Text style={st.subtitle}>
          Your progression tree across all life skill channels. Earn OTK to unlock new abilities.
        </Text>

        {demoMode && (
          <View style={st.summaryRow}>
            <View style={st.summaryCard}>
              <Text style={[st.progressNum, { color: t.accent.green }]}>{totalUnlocked}</Text>
              <Text style={st.progressLabel}>Skills Unlocked</Text>
            </View>
            <View style={st.summaryCard}>
              <Text style={[st.progressNum, { color: t.text.primary }]}>{skills.length}</Text>
              <Text style={st.progressLabel}>Total Skills</Text>
            </View>
            <View style={st.summaryCard}>
              <Text style={[st.progressNum, { color: t.accent.blue }]}>{Math.round((totalUnlocked / Math.max(skills.length, 1)) * 100)}%</Text>
              <Text style={st.progressLabel}>Complete</Text>
            </View>
          </View>
        )}

        <View style={st.tabRow}>
          {(['tree', 'progress', 'unlock'] as SkillTab[]).map(tab => (
            <TouchableOpacity key={tab} style={[st.tab, activeTab === tab && st.tabActive]}
              onPress={() => setActiveTab(tab)}>
              <Text style={[st.tabText, activeTab === tab && st.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'tree' && (
          skills.length === 0 ? (
            <Text style={st.empty}>Enable Demo Mode in Settings to see skill tree.</Text>
          ) : (
            <>
              <View style={st.channelRow}>
                {Object.entries(CHANNEL_META).map(([ch, meta]) => (
                  <TouchableOpacity key={ch} style={[st.channelChip, selectedChannel === ch && st.channelChipActive]}
                    onPress={() => setSelectedChannel(ch)}>
                    <Text style={[st.channelChipText, selectedChannel === ch && st.channelChipTextActive]}>
                      {meta.icon} {meta.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {channelSkills.map(skill => {
                const pct = Math.min((skill.otkEarned / Math.max(skill.otkRequired, 1)) * 100, 100);
                const meta = CHANNEL_META[skill.channel];
                return (
                  <View key={skill.id} style={[st.card, !skill.unlocked && { opacity: 0.5 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={st.lockIcon}>{skill.unlocked ? skill.icon : '\u{1F512}'}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={st.skillName}>{skill.name}</Text>
                        <Text style={st.levelText}>Level {skill.level}/{skill.maxLevel}</Text>
                      </View>
                      <Text style={{ color: meta?.color || t.text.muted, fontSize: fonts.sm, fontWeight: fonts.bold }}>
                        {skill.otkEarned}/{skill.otkRequired} OTK
                      </Text>
                    </View>
                    <View style={st.barContainer}>
                      <View style={[st.barFill, { width: `${pct}%`, backgroundColor: meta?.color || t.accent.blue }]} />
                    </View>
                    <Text style={st.skillDesc}>{skill.description}</Text>
                  </View>
                );
              })}
            </>
          )
        )}

        {activeTab === 'progress' && (
          channelProgress.length === 0 ? (
            <Text style={st.empty}>Enable Demo Mode to see progress.</Text>
          ) : channelProgress.map(cp => {
            const pct = cp.totalSkills > 0 ? (cp.unlockedSkills / cp.totalSkills) * 100 : 0;
            return (
              <View key={cp.channel} style={st.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontSize: fonts.xl, marginRight: 10 }}>{cp.icon}</Text>
                  <Text style={{ color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, flex: 1 }}>{cp.label}</Text>
                  <Text style={{ color: cp.color, fontSize: fonts.md, fontWeight: fonts.heavy }}>{cp.unlockedSkills}/{cp.totalSkills}</Text>
                </View>
                <View style={st.barContainer}>
                  <View style={[st.barFill, { width: `${pct}%`, backgroundColor: cp.color }]} />
                </View>
                <View style={st.row}>
                  <Text style={st.label}>OTK Earned</Text>
                  <Text style={st.val}>{cp.earnedOTK.toLocaleString()} / {cp.totalOTK.toLocaleString()}</Text>
                </View>
              </View>
            );
          })
        )}

        {activeTab === 'unlock' && (
          lockedSkills.length === 0 ? (
            <View style={st.card}>
              <Text style={{ color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.bold, textAlign: 'center' }}>All Skills Unlocked!</Text>
              <Text style={{ color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginTop: 4 }}>You have unlocked every available skill.</Text>
            </View>
          ) : lockedSkills.map(skill => {
            const remaining = skill.otkRequired - skill.otkEarned;
            const meta = CHANNEL_META[skill.channel];
            return (
              <View key={skill.id} style={st.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: fonts.xl, marginRight: 10 }}>{meta?.icon || '\u{1F512}'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={st.skillName}>{skill.name}</Text>
                    <Text style={st.skillDesc}>{skill.description}</Text>
                    <Text style={st.unlockReq}>Needs {remaining} more OTK in {meta?.label || skill.channel}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}

        {!demoMode && (
          <View style={[st.card, { marginTop: 20 }]}>
            <Text style={{ color: t.text.muted, fontSize: fonts.sm, textAlign: 'center' }}>
              Enable Demo Mode in Settings to see sample skill tree data.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
