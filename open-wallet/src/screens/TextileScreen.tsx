import { fonts } from '../utils/theme';
/**
 * Textile Screen -- Sewing, knitting, weaving circles, textile arts community.
 *
 * Article I: "Every act of creation and teaching strengthens community bonds."
 * eOTK earned for teaching textile skills.
 *
 * Features:
 * - Textile circles (knitting groups, sewing bees, weaving workshops)
 * - Pattern library (community-shared patterns: knit, crochet, sew, weave)
 * - Teach textile skills (classes for eOTK)
 * - Textile exchange (yarn, fabric, buttons, supplies sharing)
 * - Community quilting projects (collaborative quilts for donations)
 * - Demo mode with sample data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// --- Types ---

interface TextileCircle {
  id: string;
  name: string;
  craft: 'knitting' | 'sewing' | 'weaving' | 'crochet' | 'mixed';
  meetingDay: string;
  location: string;
  members: number;
  leader: string;
  description: string;
  activeProject: string;
}

interface TextilePattern {
  id: string;
  name: string;
  craft: 'knit' | 'crochet' | 'sew' | 'weave';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  sharedBy: string;
  downloads: number;
  materials: string;
  estimatedTime: string;
}

interface TextileClass {
  id: string;
  title: string;
  craft: string;
  instructor: string;
  date: string;
  spotsLeft: number;
  maxSpots: number;
  eotkReward: number;
  level: string;
}

interface ExchangeItem {
  id: string;
  name: string;
  category: 'yarn' | 'fabric' | 'notions' | 'tools';
  quantity: string;
  condition: 'new' | 'gently_used' | 'used';
  offeredBy: string;
  description: string;
}

interface Props {
  onClose: () => void;
}

// --- Constants ---

const CRAFT_COLORS: Record<string, string> = {
  knitting: '#AF52DE',
  sewing: '#FF2D55',
  weaving: '#FF9500',
  crochet: '#5856D6',
  mixed: '#007AFF',
  knit: '#AF52DE',
  sew: '#FF2D55',
  weave: '#FF9500',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: '#34C759',
  intermediate: '#FF9500',
  advanced: '#FF3B30',
};

const CATEGORY_ICONS: Record<string, string> = {
  yarn: 'Y',
  fabric: 'F',
  notions: 'N',
  tools: 'T',
};

const CONDITION_LABELS: Record<string, string> = {
  new: 'New',
  gently_used: 'Gently Used',
  used: 'Used',
};

// --- Demo Data ---

const DEMO_CIRCLES: TextileCircle[] = [
  {
    id: 'c1', name: 'Riverside Knit & Stitch', craft: 'knitting',
    meetingDay: 'Wednesdays 6-8pm', location: 'Community Library',
    members: 14, leader: 'Eleanor Voss',
    description: 'Welcoming knitting circle for all levels. Beginners always welcome!',
    activeProject: 'Baby blankets for NICU donation',
  },
  {
    id: 'c2', name: 'The Weavers Guild', craft: 'weaving',
    meetingDay: 'Saturdays 10am-1pm', location: 'Arts & Crafts Center',
    members: 8, leader: 'Tomoko Hayashi',
    description: 'Floor loom and rigid heddle weaving. Monthly project challenges.',
    activeProject: 'Community tapestry for town hall',
  },
];

const DEMO_PATTERNS: TextilePattern[] = [
  { id: 'pt1', name: 'Cozy Cable Scarf', craft: 'knit', difficulty: 'intermediate', sharedBy: 'Eleanor Voss', downloads: 142, materials: 'Worsted wool, US 8 needles', estimatedTime: '8-10 hours' },
  { id: 'pt2', name: 'Granny Square Blanket', craft: 'crochet', difficulty: 'beginner', sharedBy: 'Rosa Martinez', downloads: 287, materials: 'Acrylic yarn, 5mm hook', estimatedTime: '20-30 hours' },
  { id: 'pt3', name: 'Tote Bag with Pockets', craft: 'sew', difficulty: 'beginner', sharedBy: 'Priya Sharma', downloads: 198, materials: 'Canvas fabric, thread, zipper', estimatedTime: '3-4 hours' },
  { id: 'pt4', name: 'Twill Table Runner', craft: 'weave', difficulty: 'advanced', sharedBy: 'Tomoko Hayashi', downloads: 56, materials: 'Cotton warp & weft, floor loom', estimatedTime: '12-15 hours' },
];

const DEMO_CLASS: TextileClass = {
  id: 'cl1', title: 'Learn to Knit', craft: 'knitting',
  instructor: 'Eleanor Voss', date: 'Apr 12, 2026',
  spotsLeft: 4, maxSpots: 10, eotkReward: 400, level: 'Beginner',
};

const DEMO_EXCHANGE: ExchangeItem[] = [
  { id: 'e1', name: 'Merino Wool Skeins (3)', category: 'yarn', quantity: '3 skeins', condition: 'new', offeredBy: 'Eleanor Voss', description: 'Forest green merino, DK weight. Bought extra for a project.' },
  { id: 'e2', name: 'Quilting Cotton Bundle', category: 'fabric', quantity: '2 yards assorted', condition: 'new', offeredBy: 'Rosa Martinez', description: 'Floral prints, pre-washed. Great for patchwork.' },
  { id: 'e3', name: 'Vintage Button Collection', category: 'notions', quantity: '~50 buttons', condition: 'gently_used', offeredBy: 'Priya Sharma', description: 'Mixed materials: shell, wood, metal. Various sizes.' },
];

type Tab = 'circles' | 'patterns' | 'teach' | 'exchange';

const TABS: { key: Tab; label: string }[] = [
  { key: 'circles', label: 'Circles' },
  { key: 'patterns', label: 'Patterns' },
  { key: 'teach', label: 'Teach' },
  { key: 'exchange', label: 'Exchange' },
];

export function TextileScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('circles');
  const [patternFilter, setPatternFilter] = useState<string>('all');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const circles = DEMO_CIRCLES;
  const patterns = DEMO_PATTERNS;
  const textileClass = DEMO_CLASS;
  const exchangeItems = DEMO_EXCHANGE;

  const filteredPatterns = useMemo(() => {
    if (patternFilter === 'all') return patterns;
    return patterns.filter(p => p.craft === patternFilter);
  }, [patternFilter, patterns]);

  const handleJoinCircle = useCallback((name: string) => {
    Alert.alert('Joined!', `You've joined ${name}. See you at the next meeting!`);
  }, []);

  const handleDownloadPattern = useCallback((name: string) => {
    Alert.alert('Downloaded', `"${name}" added to your pattern library.`);
  }, []);

  const handleVolunteerTeach = useCallback(() => {
    Alert.alert(
      'Teaching Registered',
      `You're signed up to teach "${textileClass.title}".\nEarn ${textileClass.eotkReward} eOTK for sharing your skills!`,
    );
  }, [textileClass]);

  const handleClaimItem = useCallback((name: string) => {
    Alert.alert('Claimed!', `${name} reserved for you. Contact the sharer to arrange pickup.`);
  }, []);

  const handlePostExchange = useCallback(() => {
    Alert.alert('Post Item', 'Listing form coming soon. Share your surplus supplies with the community!');
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: '#AF52DE' + '20' },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: '#AF52DE' },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    heroCard: { backgroundColor: '#AF52DE' + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, marginBottom: 16, alignItems: 'center' },
    heroTitle: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy, textAlign: 'center', marginTop: 8 },
    heroSubtitle: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    circleName: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold },
    circleMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    craftBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, alignSelf: 'flex-start', marginTop: 8 },
    craftBadgeText: { color: '#fff', fontSize: fonts.xs, fontWeight: fonts.bold, textTransform: 'uppercase' },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
    detailLabel: { color: t.text.muted, fontSize: fonts.sm },
    detailValue: { color: t.text.primary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    projectBanner: { backgroundColor: t.accent.green + '10', borderRadius: 12, padding: 12, marginTop: 12 },
    projectLabel: { color: t.accent.green, fontSize: fonts.xs, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1 },
    projectText: { color: t.text.primary, fontSize: fonts.sm, fontWeight: fonts.semibold, marginTop: 4 },
    joinBtn: { backgroundColor: '#AF52DE', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 14 },
    joinBtnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 12, flexWrap: 'wrap' },
    filterChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, backgroundColor: t.bg.secondary },
    filterChipActive: { backgroundColor: '#AF52DE' },
    filterChipText: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    filterChipTextActive: { color: '#fff' },
    patternCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    patternName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    patternMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 3 },
    diffBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start', marginTop: 6 },
    diffBadgeText: { fontSize: fonts.xs, fontWeight: fonts.bold, textTransform: 'uppercase' },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    downloadBtn: { backgroundColor: '#AF52DE' + '20', borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 12 },
    downloadBtnText: { color: '#AF52DE', fontSize: fonts.sm, fontWeight: fonts.bold },
    actionBtn: { backgroundColor: '#AF52DE', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginHorizontal: 20, marginTop: 12 },
    actionBtnText: { color: '#fff', fontSize: fonts.lg, fontWeight: fonts.bold },
    secondaryBtn: { backgroundColor: t.bg.secondary, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginHorizontal: 20, marginTop: 12 },
    secondaryBtnText: { color: '#AF52DE', fontSize: fonts.lg, fontWeight: fonts.bold },
    exchangeCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12, flexDirection: 'row', gap: 14 },
    exchangeIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FF2D55' + '20', alignItems: 'center', justifyContent: 'center' },
    exchangeIconText: { color: '#FF2D55', fontSize: fonts.lg, fontWeight: fonts.heavy },
    exchangeInfo: { flex: 1 },
    exchangeName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    exchangeMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    condBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: t.accent.green + '20', alignSelf: 'flex-start', marginTop: 4 },
    condBadgeText: { color: t.accent.green, fontSize: fonts.xs, fontWeight: fonts.bold },
    claimBtn: { backgroundColor: '#FF2D55' + '20', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, alignSelf: 'flex-start', marginTop: 8 },
    claimBtnText: { color: '#FF2D55', fontSize: fonts.sm, fontWeight: fonts.bold },
    demoTag: { backgroundColor: '#AF52DE' + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoTagText: { color: '#AF52DE', fontSize: fonts.xs, fontWeight: fonts.bold },
    quiltCard: { backgroundColor: '#FF9500' + '08', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    quiltTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold },
    quiltDesc: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4, lineHeight: 20 },
    progressBar: { height: 8, backgroundColor: t.bg.primary, borderRadius: 4, marginTop: 12, overflow: 'hidden' },
    progressFill: { height: 8, backgroundColor: '#FF9500', borderRadius: 4 },
    progressLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 4, textAlign: 'right' },
  }), [t]);

  // --- Circles Tab ---
  const renderCircles = () => (
    <>
      <View style={s.heroCard}>
        <Text style={{ fontSize: 48 }}>*</Text>
        <Text style={s.heroTitle}>Textile Circles</Text>
        <Text style={s.heroSubtitle}>
          Join a local group to knit, sew, weave, and create together.{'\n'}Every stitch builds community.
        </Text>
      </View>

      <Text style={s.sectionTitle}>Active Circles ({circles.length})</Text>

      {circles.map(circle => (
        <View key={circle.id} style={s.card}>
          <Text style={s.circleName}>{circle.name}</Text>
          <Text style={s.circleMeta}>{circle.description}</Text>
          <View style={[s.craftBadge, { backgroundColor: CRAFT_COLORS[circle.craft] || '#8E8E93' }]}>
            <Text style={s.craftBadgeText}>{circle.craft}</Text>
          </View>
          <View style={[s.detailRow, { marginTop: 12 }]}>
            <Text style={s.detailLabel}>Meeting</Text>
            <Text style={s.detailValue}>{circle.meetingDay}</Text>
          </View>
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Location</Text>
            <Text style={s.detailValue}>{circle.location}</Text>
          </View>
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Members</Text>
            <Text style={s.detailValue}>{circle.members}</Text>
          </View>
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Led by</Text>
            <Text style={s.detailValue}>{circle.leader}</Text>
          </View>
          <View style={s.projectBanner}>
            <Text style={s.projectLabel}>Active Project</Text>
            <Text style={s.projectText}>{circle.activeProject}</Text>
          </View>
          <TouchableOpacity style={s.joinBtn} onPress={() => handleJoinCircle(circle.name)}>
            <Text style={s.joinBtnText}>Join Circle</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Text style={[s.sectionTitle, { marginTop: 8 }]}>Community Quilting</Text>
      <View style={s.quiltCard}>
        <Text style={s.quiltTitle}>Memorial Quilt for Veterans' Home</Text>
        <Text style={s.quiltDesc}>
          A collaborative quilt honoring local veterans. Each square tells a story. Completed squares: 42 of 64.
        </Text>
        <View style={s.progressBar}>
          <View style={[s.progressFill, { width: '66%' }]} />
        </View>
        <Text style={s.progressLabel}>66% complete</Text>
        <View style={[s.detailRow, { marginTop: 8 }]}>
          <Text style={s.detailLabel}>Contributors</Text>
          <Text style={s.detailValue}>18 crafters</Text>
        </View>
        <View style={s.detailRow}>
          <Text style={s.detailLabel}>Deadline</Text>
          <Text style={s.detailValue}>May 30, 2026</Text>
        </View>
      </View>
    </>
  );

  // --- Patterns Tab ---
  const renderPatterns = () => (
    <>
      <Text style={s.sectionTitle}>Pattern Library</Text>

      <View style={s.filterRow}>
        {['all', 'knit', 'crochet', 'sew', 'weave'].map(f => (
          <TouchableOpacity
            key={f}
            style={[s.filterChip, patternFilter === f && s.filterChipActive]}
            onPress={() => setPatternFilter(f)}
          >
            <Text style={[s.filterChipText, patternFilter === f && s.filterChipTextActive]}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredPatterns.map(pattern => {
        const craftColor = CRAFT_COLORS[pattern.craft] || '#8E8E93';
        const diffColor = DIFFICULTY_COLORS[pattern.difficulty] || '#8E8E93';
        return (
          <View key={pattern.id} style={s.patternCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={s.patternName}>{pattern.name}</Text>
                <Text style={s.patternMeta}>by {pattern.sharedBy}</Text>
              </View>
              <View style={[s.craftBadge, { backgroundColor: craftColor, marginTop: 0 }]}>
                <Text style={s.craftBadgeText}>{pattern.craft}</Text>
              </View>
            </View>
            <View style={[s.diffBadge, { backgroundColor: diffColor + '20' }]}>
              <Text style={[s.diffBadgeText, { color: diffColor }]}>{pattern.difficulty}</Text>
            </View>
            <View style={[s.detailRow, { marginTop: 10 }]}>
              <Text style={s.detailLabel}>Materials</Text>
              <Text style={s.detailValue}>{pattern.materials}</Text>
            </View>
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Est. Time</Text>
              <Text style={s.detailValue}>{pattern.estimatedTime}</Text>
            </View>
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Downloads</Text>
              <Text style={s.detailValue}>{pattern.downloads}</Text>
            </View>
            <TouchableOpacity style={s.downloadBtn} onPress={() => handleDownloadPattern(pattern.name)}>
              <Text style={s.downloadBtnText}>Download Pattern</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </>
  );

  // --- Teach Tab ---
  const renderTeach = () => (
    <>
      <View style={s.heroCard}>
        <Text style={{ fontSize: 48 }}>*</Text>
        <Text style={s.heroTitle}>Teach Textile Skills</Text>
        <Text style={s.heroSubtitle}>
          Share your craft knowledge and earn eOTK.{'\n'}Every skill passed on strengthens the community.
        </Text>
      </View>

      <Text style={s.sectionTitle}>Upcoming Class</Text>
      <View style={s.card}>
        <Text style={s.circleName}>{textileClass.title}</Text>
        <Text style={s.circleMeta}>{textileClass.level} -- {textileClass.craft}</Text>
        <View style={[s.detailRow, { marginTop: 12 }]}>
          <Text style={s.detailLabel}>Instructor</Text>
          <Text style={s.detailValue}>{textileClass.instructor}</Text>
        </View>
        <View style={s.detailRow}>
          <Text style={s.detailLabel}>Date</Text>
          <Text style={s.detailValue}>{textileClass.date}</Text>
        </View>
        <View style={s.detailRow}>
          <Text style={s.detailLabel}>Spots</Text>
          <Text style={s.detailValue}>{textileClass.spotsLeft} of {textileClass.maxSpots} left</Text>
        </View>
        <View style={s.detailRow}>
          <Text style={s.detailLabel}>Teaching Reward</Text>
          <Text style={[s.detailValue, { color: '#AF52DE' }]}>{textileClass.eotkReward} eOTK</Text>
        </View>
        <TouchableOpacity style={s.actionBtn} onPress={handleVolunteerTeach}>
          <Text style={s.actionBtnText}>Volunteer to Teach</Text>
        </TouchableOpacity>
      </View>

      <Text style={[s.sectionTitle, { marginTop: 8 }]}>Teaching Impact</Text>
      <View style={s.card}>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>12</Text>
            <Text style={s.statLabel}>Classes Taught</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statValue}>86</Text>
            <Text style={s.statLabel}>Students</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: '#AF52DE' }]}>4,800</Text>
            <Text style={s.statLabel}>eOTK Earned</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={s.secondaryBtn}>
        <Text style={s.secondaryBtnText}>Propose a New Class</Text>
      </TouchableOpacity>
    </>
  );

  // --- Exchange Tab ---
  const renderExchange = () => (
    <>
      <View style={s.heroCard}>
        <Text style={{ fontSize: 48 }}>*</Text>
        <Text style={s.heroTitle}>Textile Exchange</Text>
        <Text style={s.heroSubtitle}>
          Share surplus yarn, fabric, buttons, and tools.{'\n'}One crafter's extra is another's treasure.
        </Text>
      </View>

      <Text style={s.sectionTitle}>Available Items ({exchangeItems.length})</Text>

      {exchangeItems.map(item => (
        <View key={item.id} style={s.exchangeCard}>
          <View style={s.exchangeIcon}>
            <Text style={s.exchangeIconText}>{CATEGORY_ICONS[item.category]}</Text>
          </View>
          <View style={s.exchangeInfo}>
            <Text style={s.exchangeName}>{item.name}</Text>
            <Text style={s.exchangeMeta}>{item.description}</Text>
            <Text style={s.exchangeMeta}>Qty: {item.quantity} -- From: {item.offeredBy}</Text>
            <View style={s.condBadge}>
              <Text style={s.condBadgeText}>{CONDITION_LABELS[item.condition]}</Text>
            </View>
            <TouchableOpacity style={s.claimBtn} onPress={() => handleClaimItem(item.name)}>
              <Text style={s.claimBtnText}>Claim</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <TouchableOpacity style={s.actionBtn} onPress={handlePostExchange}>
        <Text style={s.actionBtnText}>Share Your Supplies</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Textile Arts</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      {demoMode && (
        <View style={s.demoTag}>
          <Text style={s.demoTagText}>DEMO DATA</Text>
        </View>
      )}

      <View style={s.tabRow}>
        {TABS.map(tb => (
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
        {tab === 'circles' && renderCircles()}
        {tab === 'patterns' && renderPatterns()}
        {tab === 'teach' && renderTeach()}
        {tab === 'exchange' && renderExchange()}
      </ScrollView>
    </SafeAreaView>
  );
}
