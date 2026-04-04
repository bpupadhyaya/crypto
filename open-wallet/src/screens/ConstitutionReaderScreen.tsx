import { fonts } from '../utils/theme';
/**
 * Constitution Reader Screen — Read The Human Constitution in-app.
 *
 * All 10 Articles rendered with collapsible sections,
 * implementation badges, and links to propose amendments.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Linking, Share,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface Props {
  onClose: () => void;
}

const GITHUB_URL = 'https://github.com/bpupadhyaya/crypto/blob/main/docs/HUMAN_CONSTITUTION.md';
const AMENDMENT_URL = 'https://github.com/bpupadhyaya/crypto/issues/new?title=Amendment+Proposal&labels=constitution';

interface Article {
  number: number;
  title: string;
  text: string;
  immutable: boolean;
  walletFeature: string;
}

const ARTICLES: Article[] = [
  {
    number: 1,
    title: 'The Right to Exist',
    text: 'Every human being has the inherent right to exist, and no system, institution, or technology shall diminish this right. All tools built on Open Chain must preserve and protect human life above all other objectives.',
    immutable: true,
    walletFeature: 'Non-custodial wallet — you control your own assets, your own existence in the digital economy.',
  },
  {
    number: 2,
    title: 'The Right to Nurture',
    text: 'The act of raising children and nurturing the next generation is the most valuable contribution a human can make. This value shall be recognized, quantified, and rewarded through the Nurture Channel (nOTK).',
    immutable: false,
    walletFeature: 'Parenting Journey, Family Tree, nOTK channel — nurture is valued and rewarded.',
  },
  {
    number: 3,
    title: 'The Right to Education',
    text: 'Every human has the right to learn and to teach. Knowledge transfer is a fundamental value channel. Teachers and learners both create value that shall be recognized through the Education Channel (eOTK).',
    immutable: false,
    walletFeature: 'Education Hub, Skill Certs, Teacher Impact, eOTK channel.',
  },
  {
    number: 4,
    title: 'The Right to Health',
    text: 'Every human has the right to health and wellbeing. Maintaining one\'s health and helping others maintain theirs creates value recognized through the Health Channel (hOTK).',
    immutable: false,
    walletFeature: 'Wellness tracking, hOTK channel — health contributions are valued.',
  },
  {
    number: 5,
    title: 'The Right to Community',
    text: 'Humans are social beings. Building community, volunteering, and providing services to others creates value recognized through the Community Channel (cOTK).',
    immutable: false,
    walletFeature: 'Volunteer hours, Community Board, Community Health, cOTK channel.',
  },
  {
    number: 6,
    title: 'The Right to Economic Participation',
    text: 'Every human has the right to participate in economic activity. Trade, employment, and charitable giving create value recognized through the Economic Channel (xOTK).',
    immutable: false,
    walletFeature: 'Multi-chain wallet, DEX, Bridge, Exchange — full economic participation.',
  },
  {
    number: 7,
    title: 'The Right to Governance',
    text: 'Every human has an equal voice in governance. One human, one vote. No amount of wealth shall amplify one\'s governance power. Participation in governance creates value recognized through the Governance Channel (gOTK).',
    immutable: false,
    walletFeature: 'DAO, Delegation, Voting Power, Governance, gOTK channel.',
  },
  {
    number: 8,
    title: 'The Right to Correction',
    text: 'When harm is done, the system shall support correction and restoration rather than punishment. Restorative justice creates stronger communities than retributive justice.',
    immutable: false,
    walletFeature: 'Correction system, Disputes, Escrow — restorative mechanisms built in.',
  },
  {
    number: 9,
    title: 'The Right to Identity',
    text: 'Every human has the right to a unique, self-sovereign identity. This identity shall be controlled solely by the individual and shall not be revocable by any authority.',
    immutable: false,
    walletFeature: 'Universal ID, Identity verification — self-sovereign identity.',
  },
  {
    number: 10,
    title: 'The Path to Peace',
    text: 'When all human needs are met — when nurture, education, health, community, economic participation, and governance are valued and accessible — war becomes irrational. The ultimate measure of this system\'s success is the Peace Index.',
    immutable: false,
    walletFeature: 'Peace Index — the ultimate metric measuring whether we are succeeding.',
  },
];

export function ConstitutionReaderScreen({ onClose }: Props) {
  const t = useTheme();
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 1: true });

  const toggle = (n: number) => {
    setExpanded((prev) => ({ ...prev, [n]: !prev[n] }));
  };

  const shareArticle = async (article: Article) => {
    try {
      await Share.share({
        message: `The Human Constitution — Article ${article.number}: ${article.title}\n\n${article.text}\n\nRead more: ${GITHUB_URL}`,
      });
    } catch (_) {
      // user cancelled
    }
  };

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    subtitle: { color: t.text.secondary, fontSize: 14, lineHeight: 22, marginBottom: 16 },
    progressBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.accent.green + '15', borderRadius: 12, padding: 12, marginBottom: 20 },
    progressText: { color: t.accent.green, fontSize: 14, fontWeight: fonts.bold, marginLeft: 8 },
    articleCard: { backgroundColor: t.bg.card, borderRadius: 16, marginBottom: 12, overflow: 'hidden' },
    articleCardImmutable: { borderWidth: 2, borderColor: '#d4a017' },
    articleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    articleNumBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: t.accent.blue + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    articleNumBadgeImmutable: { backgroundColor: '#d4a017' + '30' },
    articleNum: { color: t.accent.blue, fontSize: 14, fontWeight: fonts.heavy },
    articleNumImmutable: { color: '#d4a017' },
    articleTitleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    articleTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold, flex: 1 },
    immutableBadge: { backgroundColor: '#d4a017' + '20', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    immutableText: { color: '#d4a017', fontSize: 10, fontWeight: fonts.heavy, letterSpacing: 0.5 },
    chevron: { color: t.text.muted, fontSize: 18, marginLeft: 8 },
    articleBody: { paddingHorizontal: 16, paddingBottom: 16 },
    articleText: { color: t.text.secondary, fontSize: 14, lineHeight: 22, marginBottom: 12 },
    featureBox: { backgroundColor: t.accent.green + '10', borderRadius: 10, padding: 12, marginBottom: 8 },
    featureLabel: { color: t.accent.green, fontSize: 11, fontWeight: fonts.bold, letterSpacing: 0.5, marginBottom: 4 },
    featureText: { color: t.text.secondary, fontSize: 13, lineHeight: 20 },
    implementedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    implementedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: t.accent.green },
    implementedText: { color: t.accent.green, fontSize: 12, fontWeight: fonts.bold },
    articleActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
    shareBtn: { color: t.accent.blue, fontSize: 13, fontWeight: fonts.semibold },
    amendBtn: { color: t.accent.purple, fontSize: 13, fontWeight: fonts.semibold },
    linksRow: { flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 16 },
    linkBtn: { flex: 1, backgroundColor: t.accent.blue + '15', borderRadius: 12, padding: 14, alignItems: 'center' },
    linkText: { color: t.accent.blue, fontSize: 14, fontWeight: fonts.semibold },
  }), [t]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>The Human Constitution</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.subtitle}>
          The foundational document of Open Chain. These 10 Articles define what it means to value every human contribution.
        </Text>

        <View style={s.progressBar}>
          <Text style={{ fontSize: 18 }}>{'✓'}</Text>
          <Text style={s.progressText}>10/10 Articles Implemented</Text>
        </View>

        {ARTICLES.map((article) => {
          const isExpanded = expanded[article.number] ?? false;
          return (
            <View
              key={article.number}
              style={[s.articleCard, article.immutable && s.articleCardImmutable]}
            >
              <TouchableOpacity
                style={s.articleHeader}
                onPress={() => toggle(article.number)}
                activeOpacity={0.7}
              >
                <View style={[s.articleNumBadge, article.immutable && s.articleNumBadgeImmutable]}>
                  <Text style={[s.articleNum, article.immutable && s.articleNumImmutable]}>
                    {article.number}
                  </Text>
                </View>
                <View style={s.articleTitleRow}>
                  <Text style={s.articleTitle}>{article.title}</Text>
                  {article.immutable && (
                    <View style={s.immutableBadge}>
                      <Text style={s.immutableText}>IMMUTABLE</Text>
                    </View>
                  )}
                </View>
                <Text style={s.chevron}>{isExpanded ? '▾' : '▸'}</Text>
              </TouchableOpacity>

              {isExpanded && (
                <View style={s.articleBody}>
                  <Text style={s.articleText}>{article.text}</Text>

                  <View style={s.implementedBadge}>
                    <View style={s.implementedDot} />
                    <Text style={s.implementedText}>This Article is implemented</Text>
                  </View>

                  <View style={s.featureBox}>
                    <Text style={s.featureLabel}>WALLET FEATURE</Text>
                    <Text style={s.featureText}>{article.walletFeature}</Text>
                  </View>

                  <View style={s.articleActions}>
                    <TouchableOpacity onPress={() => shareArticle(article)}>
                      <Text style={s.shareBtn}>Share Article</Text>
                    </TouchableOpacity>
                    {!article.immutable && (
                      <TouchableOpacity onPress={() => Linking.openURL(AMENDMENT_URL)}>
                        <Text style={s.amendBtn}>Propose Amendment</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </View>
          );
        })}

        <View style={s.linksRow}>
          <TouchableOpacity style={s.linkBtn} onPress={() => Linking.openURL(GITHUB_URL)}>
            <Text style={s.linkText}>Full Source on GitHub</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.linkBtn} onPress={() => Linking.openURL(AMENDMENT_URL)}>
            <Text style={s.linkText}>Propose Amendment</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
