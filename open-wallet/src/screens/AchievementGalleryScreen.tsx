import { fonts } from '../utils/theme';
/**
 * Achievement Gallery Screen — Visual gallery of all soulbound achievements.
 *
 * Browse earned, available, and rare achievements.
 * Demo mode with sample achievement data.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  channel: string;
  earnedDate?: string;
  requirement: string;
  holders: number;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const RARITY_COLORS: Record<string, string> = {
  common: '#8E8E93', uncommon: '#34C759', rare: '#007AFF', legendary: '#FF9500',
};

// ─── Demo Data ───

const DEMO_ACHIEVEMENTS: Achievement[] = [
  { id: '1', title: 'First Contribution', description: 'Made your first verified contribution', icon: '*', rarity: 'common', channel: 'general', earnedDate: '2026-02-15', requirement: 'Submit 1 contribution', holders: 12400 },
  { id: '2', title: 'Nurture Champion', description: 'Logged 100+ hours of childcare', icon: 'N', rarity: 'rare', channel: 'nurture', earnedDate: '2026-03-20', requirement: '100 hours nurture', holders: 342 },
  { id: '3', title: 'Knowledge Keeper', description: 'Completed 50 tutoring sessions', icon: 'K', rarity: 'uncommon', channel: 'education', earnedDate: '2026-03-10', requirement: '50 sessions', holders: 1840 },
  { id: '4', title: 'Community Pillar', description: 'Active in 5+ channels simultaneously', icon: 'P', rarity: 'uncommon', channel: 'general', earnedDate: '2026-03-25', requirement: '5 active channels', holders: 2100 },
  { id: '5', title: 'Governance Voice', description: 'Voted on 25+ proposals', icon: 'G', rarity: 'uncommon', channel: 'governance', earnedDate: '2026-03-28', requirement: '25 votes', holders: 1560 },
  { id: '6', title: 'Elder Guardian', description: '200+ hours of eldercare service', icon: 'E', rarity: 'rare', channel: 'eldercare', requirement: '200 hours eldercare', holders: 189 },
  { id: '7', title: 'Peace Builder', description: 'Contributed to peace index improvement in your region', icon: 'B', rarity: 'rare', channel: 'general', requirement: 'Regional peace impact', holders: 267 },
  { id: '8', title: 'Genesis Member', description: 'Joined during the first month of Open Chain', icon: 'G', rarity: 'legendary', channel: 'general', earnedDate: '2026-01-15', requirement: 'Join in month 1', holders: 84 },
  { id: '9', title: 'Oracle Trust', description: 'Maintained 99%+ verifier accuracy for 6 months', icon: 'O', rarity: 'legendary', channel: 'oracle', requirement: '99% accuracy 6mo', holders: 31 },
  { id: '10', title: 'Thousand Hours', description: 'Logged 1,000 total volunteer hours', icon: 'T', rarity: 'legendary', channel: 'volunteer', requirement: '1000 hours', holders: 12 },
];

type Tab = 'earned' | 'available' | 'rare';

export function AchievementGalleryScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('earned');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const earned = useMemo(() => DEMO_ACHIEVEMENTS.filter((a) => a.earnedDate), []);
  const available = useMemo(() => DEMO_ACHIEVEMENTS.filter((a) => !a.earnedDate), []);
  const rare = useMemo(() => DEMO_ACHIEVEMENTS.filter((a) => a.rarity === 'rare' || a.rarity === 'legendary').sort((a, b) => a.holders - b.holders), []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.purple + '20' },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.purple },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
    summaryItem: { alignItems: 'center' },
    summaryValue: { color: t.text.primary, fontSize: fonts.xxl, fontWeight: fonts.heavy },
    summaryLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    achCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
    achIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    achIconText: { color: '#fff', fontSize: fonts.xl, fontWeight: fonts.heavy },
    achInfo: { flex: 1 },
    achTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    achDesc: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    achMeta: { color: t.text.muted, fontSize: fonts.xs, marginTop: 4 },
    rarityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
    rarityText: { fontSize: fonts.xs, fontWeight: fonts.bold, textTransform: 'uppercase' },
    lockedOverlay: { opacity: 0.5 },
    holdersText: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.bold },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'earned', label: 'Earned' },
    { key: 'available', label: 'Available' },
    { key: 'rare', label: 'Rare' },
  ];

  const renderAchievement = (ach: Achievement, locked: boolean) => {
    const rarityColor = RARITY_COLORS[ach.rarity];
    return (
      <TouchableOpacity
        key={ach.id}
        style={[s.achCard, locked && s.lockedOverlay]}
        onPress={() => Alert.alert(ach.title, `${ach.description}\n\nRequirement: ${ach.requirement}\nHolders: ${ach.holders}\nRarity: ${ach.rarity}${ach.earnedDate ? `\nEarned: ${ach.earnedDate}` : ''}\n\nSoulbound — non-transferable.`)}
      >
        <View style={[s.achIcon, { backgroundColor: rarityColor }]}>
          <Text style={s.achIconText}>{ach.icon}</Text>
        </View>
        <View style={s.achInfo}>
          <Text style={s.achTitle}>{ach.title}</Text>
          <Text style={s.achDesc}>{ach.description}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 }}>
            <View style={[s.rarityBadge, { backgroundColor: rarityColor + '20' }]}>
              <Text style={[s.rarityText, { color: rarityColor }]}>{ach.rarity}</Text>
            </View>
            <Text style={s.holdersText}>{ach.holders} holders</Text>
          </View>
          {ach.earnedDate && <Text style={s.achMeta}>Earned {ach.earnedDate}</Text>}
          {!ach.earnedDate && <Text style={s.achMeta}>Req: {ach.requirement}</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEarned = () => (
    <>
      <View style={s.card}>
        <View style={s.summaryRow}>
          <View style={s.summaryItem}><Text style={[s.summaryValue, { color: t.accent.purple }]}>{earned.length}</Text><Text style={s.summaryLabel}>Earned</Text></View>
          <View style={s.summaryItem}><Text style={s.summaryValue}>{DEMO_ACHIEVEMENTS.length}</Text><Text style={s.summaryLabel}>Total</Text></View>
          <View style={s.summaryItem}><Text style={[s.summaryValue, { color: t.accent.orange }]}>{earned.filter((a) => a.rarity === 'legendary').length}</Text><Text style={s.summaryLabel}>Legendary</Text></View>
        </View>
      </View>
      {earned.map((a) => renderAchievement(a, false))}
    </>
  );

  const renderAvailable = () => (
    <>
      <Text style={s.sectionTitle}>Locked Achievements</Text>
      {available.map((a) => renderAchievement(a, true))}
    </>
  );

  const renderRare = () => (
    <>
      <Text style={s.sectionTitle}>Rare & Legendary</Text>
      {rare.map((a) => renderAchievement(a, !a.earnedDate))}
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>{'\u2190'} Back</Text></TouchableOpacity>
        <Text style={s.title}>Achievements</Text>
        <View style={{ width: 60 }} />
      </View>
      {demoMode && (<View style={s.demoTag}><Text style={s.demoText}>DEMO MODE</Text></View>)}
      <View style={s.tabRow}>
        {tabs.map((tb) => (
          <TouchableOpacity key={tb.key} style={[s.tabBtn, tab === tb.key && s.tabActive]} onPress={() => setTab(tb.key)}>
            <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {tab === 'earned' && renderEarned()}
        {tab === 'available' && renderAvailable()}
        {tab === 'rare' && renderRare()}
      </ScrollView>
    </SafeAreaView>
  );
}
