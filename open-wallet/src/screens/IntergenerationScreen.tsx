import { fonts } from '../utils/theme';
/**
 * Intergenerational Screen — Visualize value flowing across generations.
 *
 * "The greatest inheritance is not wealth — it is the love, knowledge, and
 *  values passed from one generation to the next."
 * — The Human Constitution, Article I
 *
 * This screen shows the chain of value across grandparents, parents, children,
 * and future generations. It visualizes the Gratitude Cascade — how gratitude
 * flows backward through time, honoring every link in the chain.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface Props {
  onClose: () => void;
}

interface GenerationNode {
  id: string;
  name: string;
  generation: string; // 'great-grandparent' | 'grandparent' | 'parent' | 'self' | 'child' | 'future'
  uid: string;
  totalOTKGiven: number;
  totalOTKReceived: number;
  gratitudeCount: number;
  badge: string;
  alive: boolean;
}

interface GratitudeCascade {
  id: string;
  fromName: string;
  toName: string;
  channel: string;
  amount: number;
  message: string;
  date: string;
  cascadeDepth: number; // how many generations the gratitude echoes
}

interface CrossGenImpact {
  ancestor: string;
  impact: string;
  generationsAffected: number;
  badge: string;
}

// Demo 4-generation family
const DEMO_GENERATIONS: GenerationNode[] = [
  { id: 'gg1', name: 'Great-Grandmother Amara', generation: 'great-grandparent', uid: 'uid-gg-001', totalOTKGiven: 45000, totalOTKReceived: 12000, gratitudeCount: 89, badge: '\u{1F331}', alive: false },
  { id: 'gp1', name: 'Grandfather Hiroshi', generation: 'grandparent', uid: 'uid-gp-001', totalOTKGiven: 38000, totalOTKReceived: 22000, gratitudeCount: 156, badge: '\u{1F333}', alive: true },
  { id: 'gp2', name: 'Grandmother Leela', generation: 'grandparent', uid: 'uid-gp-002', totalOTKGiven: 42000, totalOTKReceived: 19000, gratitudeCount: 203, badge: '\u{1F333}', alive: true },
  { id: 'p1', name: 'Father Kenji', generation: 'parent', uid: 'uid-p-001', totalOTKGiven: 28000, totalOTKReceived: 15000, gratitudeCount: 94, badge: '\u{1F33F}', alive: true },
  { id: 'p2', name: 'Mother Priya', generation: 'parent', uid: 'uid-p-002', totalOTKGiven: 31000, totalOTKReceived: 17000, gratitudeCount: 112, badge: '\u{1F33F}', alive: true },
  { id: 's1', name: 'You', generation: 'self', uid: 'uid-self', totalOTKGiven: 8500, totalOTKReceived: 6200, gratitudeCount: 47, badge: '\u{1F31F}', alive: true },
  { id: 'c1', name: 'Daughter Aiko', generation: 'child', uid: 'uid-c-001', totalOTKGiven: 1200, totalOTKReceived: 4500, gratitudeCount: 18, badge: '\u{1F476}', alive: true },
  { id: 'c2', name: 'Son Arjun', generation: 'child', uid: 'uid-c-002', totalOTKGiven: 800, totalOTKReceived: 3200, gratitudeCount: 12, badge: '\u{1F476}', alive: true },
  { id: 'f1', name: 'Future Generations', generation: 'future', uid: 'uid-future', totalOTKGiven: 0, totalOTKReceived: 0, gratitudeCount: 0, badge: '\u{1F52E}', alive: true },
];

const DEMO_CASCADES: GratitudeCascade[] = [
  { id: 'gc1', fromName: 'You', toName: 'Mother Priya', channel: 'nOTK', amount: 500, message: 'For every sleepless night and every warm meal', date: '2026-03-20', cascadeDepth: 3 },
  { id: 'gc2', fromName: 'Daughter Aiko', toName: 'You', channel: 'nOTK', amount: 200, message: 'Thank you for teaching me to read', date: '2026-03-18', cascadeDepth: 2 },
  { id: 'gc3', fromName: 'You', toName: 'Grandfather Hiroshi', channel: 'nOTK', amount: 1000, message: 'Your stories shaped who I am', date: '2026-03-15', cascadeDepth: 4 },
  { id: 'gc4', fromName: 'Mother Priya', toName: 'Grandmother Leela', channel: 'nOTK', amount: 800, message: 'You taught me strength and patience', date: '2026-03-10', cascadeDepth: 3 },
  { id: 'gc5', fromName: 'Son Arjun', toName: 'Father Kenji', channel: 'nOTK', amount: 150, message: 'For building my first bicycle', date: '2026-03-08', cascadeDepth: 2 },
];

const DEMO_CROSS_GEN_IMPACTS: CrossGenImpact[] = [
  { ancestor: 'Great-Grandmother Amara', impact: 'Her emphasis on education influenced 3 generations of scholars', generationsAffected: 3, badge: '\u{1F4DA}' },
  { ancestor: 'Grandfather Hiroshi', impact: 'His carpentry skills passed to children and grandchildren', generationsAffected: 2, badge: '\u{1F528}' },
  { ancestor: 'Grandmother Leela', impact: 'Her recipes and cultural traditions live in every family gathering', generationsAffected: 3, badge: '\u{1F372}' },
  { ancestor: 'Mother Priya', impact: 'Her compassion inspired community volunteering across the family', generationsAffected: 2, badge: '\u{2764}\u{FE0F}' },
];

const GENERATION_ORDER = ['great-grandparent', 'grandparent', 'parent', 'self', 'child', 'future'];
const GENERATION_LABELS: Record<string, string> = {
  'great-grandparent': 'Great-Grandparents',
  'grandparent': 'Grandparents',
  'parent': 'Parents',
  'self': 'You',
  'child': 'Children',
  'future': 'Future',
};

type TabKey = 'chain' | 'cascade' | 'impact' | 'legacy';

export function IntergenerationScreen({ onClose }: Props) {
  const [tab, setTab] = useState<TabKey>('chain');
  const t = useTheme();

  const legacyScore = useMemo(() => {
    return DEMO_GENERATIONS.reduce((sum, g) => sum + g.totalOTKGiven + g.gratitudeCount * 10, 0);
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    heroCard: { backgroundColor: t.accent.blue + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20, fontStyle: 'italic' },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginTop: 16, gap: 4 },
    tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: t.bg.card },
    tabBtnActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold },
    tabTextActive: { color: '#fff' },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 24 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 8 },
    // Generation chain styles
    genGroup: { marginHorizontal: 20, marginTop: 16 },
    genLabel: { color: t.text.muted, fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 },
    genNode: { backgroundColor: t.bg.card, borderRadius: 14, padding: 14, marginBottom: 8 },
    genNodeSelf: { backgroundColor: t.accent.blue + '20', borderWidth: 2, borderColor: t.accent.blue },
    genNodeHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    genBadge: { fontSize: 28 },
    genName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold, flex: 1 },
    genStats: { flexDirection: 'row', gap: 16, marginTop: 8 },
    genStat: { alignItems: 'center' },
    genStatValue: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    genStatLabel: { color: t.text.muted, fontSize: 10 },
    genDeceasedBadge: { color: t.text.muted, fontSize: 10, fontStyle: 'italic', marginTop: 4 },
    // Arrow connector
    arrowContainer: { alignItems: 'center', marginVertical: 4, marginHorizontal: 20 },
    arrow: { color: t.text.muted, fontSize: 18 },
    arrowLabel: { color: t.text.muted, fontSize: 10, fontStyle: 'italic' },
    // Cascade styles
    cascadeCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginHorizontal: 20, marginTop: 8 },
    cascadeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cascadeFrom: { color: t.accent.purple, fontSize: 14, fontWeight: fonts.bold },
    cascadeDate: { color: t.text.muted, fontSize: 12 },
    cascadeArrow: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    cascadeTo: { color: t.accent.blue, fontSize: 14, fontWeight: fonts.bold, marginTop: 2 },
    cascadeMessage: { color: t.text.secondary, fontSize: 13, marginTop: 8, fontStyle: 'italic', lineHeight: 19 },
    cascadeFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    cascadeAmount: { color: t.accent.green, fontSize: 13, fontWeight: fonts.bold },
    cascadeDepth: { color: t.accent.orange, fontSize: 12, fontWeight: fonts.semibold },
    // Impact styles
    impactCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginHorizontal: 20, marginTop: 8 },
    impactRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    impactBadge: { fontSize: 28 },
    impactAncestor: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    impactDesc: { color: t.text.secondary, fontSize: 13, marginTop: 6, lineHeight: 19 },
    impactGen: { color: t.accent.blue, fontSize: 12, fontWeight: fonts.bold, marginTop: 6 },
    // Legacy styles
    legacyCard: { backgroundColor: t.accent.purple + '10', borderRadius: 20, padding: 24, marginHorizontal: 20, marginTop: 12, alignItems: 'center' },
    legacyScore: { color: t.accent.purple, fontSize: 36, fontWeight: fonts.heavy },
    legacyLabel: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginTop: 4 },
    legacySub: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },
    legacyRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, width: '100%' },
    legacyItem: { alignItems: 'center' },
    legacyItemValue: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy },
    legacyItemLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
  }), [t]);

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'chain', label: 'Chain' },
    { key: 'cascade', label: 'Cascade' },
    { key: 'impact', label: 'Impact' },
    { key: 'legacy', label: 'Legacy' },
  ];

  const groupedGenerations = useMemo(() => {
    return GENERATION_ORDER.map(gen => ({
      generation: gen,
      label: GENERATION_LABELS[gen],
      members: DEMO_GENERATIONS.filter(g => g.generation === gen),
    })).filter(g => g.members.length > 0);
  }, []);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Generations</Text>
        <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>Close</Text></TouchableOpacity>
      </View>
      <ScrollView>
        {/* Hero */}
        <View style={s.heroCard}>
          <Text style={s.heroIcon}>{'\u{1F3AF}'}</Text>
          <Text style={s.heroTitle}>The Chain of Generations</Text>
          <Text style={s.heroSubtitle}>
            {"\"Every generation stands on the shoulders of those who came before — and builds the foundation for those who follow.\"\n— The Human Constitution"}
          </Text>
        </View>

        {/* Tabs */}
        <View style={s.tabRow}>
          {TABS.map(tb => (
            <TouchableOpacity
              key={tb.key}
              style={[s.tabBtn, tab === tb.key && s.tabBtnActive]}
              onPress={() => setTab(tb.key)}
            >
              <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Generation Chain Tab ── */}
        {tab === 'chain' && (
          <>
            <Text style={s.section}>GENERATION CHAIN</Text>
            {groupedGenerations.map((group, gi) => (
              <React.Fragment key={group.generation}>
                {gi > 0 && (
                  <View style={s.arrowContainer}>
                    <Text style={s.arrow}>{'\u{2193}'}</Text>
                    <Text style={s.arrowLabel}>value flows down</Text>
                  </View>
                )}
                <View style={s.genGroup}>
                  <Text style={s.genLabel}>{group.label}</Text>
                  {group.members.map(node => (
                    <View key={node.id} style={[s.genNode, node.generation === 'self' && s.genNodeSelf]}>
                      <View style={s.genNodeHeader}>
                        <Text style={s.genBadge}>{node.badge}</Text>
                        <Text style={s.genName}>{node.name}</Text>
                      </View>
                      {node.generation !== 'future' && (
                        <View style={s.genStats}>
                          <View style={s.genStat}>
                            <Text style={s.genStatValue}>{(node.totalOTKGiven / 1000).toFixed(1)}k</Text>
                            <Text style={s.genStatLabel}>OTK Given</Text>
                          </View>
                          <View style={s.genStat}>
                            <Text style={s.genStatValue}>{(node.totalOTKReceived / 1000).toFixed(1)}k</Text>
                            <Text style={s.genStatLabel}>OTK Received</Text>
                          </View>
                          <View style={s.genStat}>
                            <Text style={s.genStatValue}>{node.gratitudeCount}</Text>
                            <Text style={s.genStatLabel}>Gratitude</Text>
                          </View>
                        </View>
                      )}
                      {!node.alive && (
                        <Text style={s.genDeceasedBadge}>In loving memory — legacy lives on</Text>
                      )}
                    </View>
                  ))}
                </View>
              </React.Fragment>
            ))}
          </>
        )}

        {/* ── Gratitude Cascade Tab ── */}
        {tab === 'cascade' && (
          <>
            <Text style={s.section}>THE GRATITUDE CASCADE</Text>
            <View style={[s.card, { marginBottom: 8 }]}>
              <Text style={{ color: t.text.secondary, fontSize: 13, lineHeight: 20 }}>
                When a child sends gratitude to their parents, remember: those parents once received the same love from their own parents. The chain continues backward through time — every generation honoring the one before.
              </Text>
            </View>
            {DEMO_CASCADES.map(c => (
              <View key={c.id} style={s.cascadeCard}>
                <View style={s.cascadeHeader}>
                  <Text style={s.cascadeFrom}>{c.fromName}</Text>
                  <Text style={s.cascadeDate}>{c.date}</Text>
                </View>
                <Text style={s.cascadeArrow}>{'\u{2193}'} sends {c.channel} to</Text>
                <Text style={s.cascadeTo}>{c.toName}</Text>
                <Text style={s.cascadeMessage}>"{c.message}"</Text>
                <View style={s.cascadeFooter}>
                  <Text style={s.cascadeAmount}>+{c.amount} {c.channel}</Text>
                  <Text style={s.cascadeDepth}>Echoes {c.cascadeDepth} generations</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* ── Cross-Generation Impact Tab ── */}
        {tab === 'impact' && (
          <>
            <Text style={s.section}>CROSS-GENERATION IMPACT</Text>
            {DEMO_CROSS_GEN_IMPACTS.map((imp, i) => (
              <View key={i} style={s.impactCard}>
                <View style={s.impactRow}>
                  <Text style={s.impactBadge}>{imp.badge}</Text>
                  <Text style={s.impactAncestor}>{imp.ancestor}</Text>
                </View>
                <Text style={s.impactDesc}>{imp.impact}</Text>
                <Text style={s.impactGen}>Influenced {imp.generationsAffected} generation{imp.generationsAffected > 1 ? 's' : ''}</Text>
              </View>
            ))}

            <Text style={s.section}>YOUR CROSS-GENERATION STATS</Text>
            <View style={s.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                <Text style={{ color: t.text.secondary, fontSize: 13 }}>Generations Represented</Text>
                <Text style={{ color: t.text.primary, fontSize: 13, fontWeight: fonts.bold }}>4</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                <Text style={{ color: t.text.secondary, fontSize: 13 }}>Total Family Members</Text>
                <Text style={{ color: t.text.primary, fontSize: 13, fontWeight: fonts.bold }}>8</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                <Text style={{ color: t.text.secondary, fontSize: 13 }}>Gratitude Transactions</Text>
                <Text style={{ color: t.text.primary, fontSize: 13, fontWeight: fonts.bold }}>731</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                <Text style={{ color: t.text.secondary, fontSize: 13 }}>Oldest Record</Text>
                <Text style={{ color: t.text.primary, fontSize: 13, fontWeight: fonts.bold }}>Great-Grandmother Amara</Text>
              </View>
            </View>
          </>
        )}

        {/* ── Legacy Score Tab ── */}
        {tab === 'legacy' && (
          <>
            <Text style={s.section}>FAMILY LEGACY SCORE</Text>
            <View style={s.legacyCard}>
              <Text style={s.legacyScore}>{legacyScore.toLocaleString()}</Text>
              <Text style={s.legacyLabel}>Cumulative Family Value</Text>
              <Text style={s.legacySub}>
                The total value your family has created across all generations — every hour of care, every lesson taught, every act of love, quantified and celebrated.
              </Text>
              <View style={s.legacyRow}>
                <View style={s.legacyItem}>
                  <Text style={s.legacyItemValue}>4</Text>
                  <Text style={s.legacyItemLabel}>Generations</Text>
                </View>
                <View style={s.legacyItem}>
                  <Text style={s.legacyItemValue}>731</Text>
                  <Text style={s.legacyItemLabel}>Gratitude Txs</Text>
                </View>
                <View style={s.legacyItem}>
                  <Text style={s.legacyItemValue}>194.5k</Text>
                  <Text style={s.legacyItemLabel}>Total OTK</Text>
                </View>
              </View>
            </View>

            <Text style={s.section}>LEGACY BY GENERATION</Text>
            {groupedGenerations.filter(g => g.generation !== 'future').map(group => {
              const totalGiven = group.members.reduce((s, m) => s + m.totalOTKGiven, 0);
              const totalGratitude = group.members.reduce((s, m) => s + m.gratitudeCount, 0);
              return (
                <View key={group.generation} style={s.card}>
                  <Text style={{ color: t.text.primary, fontSize: 15, fontWeight: fonts.bold }}>{group.label}</Text>
                  <View style={{ flexDirection: 'row', gap: 20, marginTop: 8 }}>
                    <Text style={{ color: t.accent.green, fontSize: 13, fontWeight: fonts.semibold }}>
                      {(totalGiven / 1000).toFixed(1)}k OTK given
                    </Text>
                    <Text style={{ color: t.accent.purple, fontSize: 13, fontWeight: fonts.semibold }}>
                      {totalGratitude} gratitude
                    </Text>
                    <Text style={{ color: t.text.muted, fontSize: 13 }}>
                      {group.members.length} member{group.members.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
              );
            })}

            <View style={[s.card, { marginTop: 16, marginBottom: 8 }]}>
              <Text style={{ color: t.text.secondary, fontSize: 13, lineHeight: 20, fontStyle: 'italic', textAlign: 'center' }}>
                "The true wealth of a family is not what they accumulate, but what they give to each other and to the world."
              </Text>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
