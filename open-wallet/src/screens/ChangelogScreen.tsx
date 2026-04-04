import { fonts } from '../utils/theme';
/**
 * Changelog Screen — App version changelog with all releases.
 *
 * Displays a single scrollable list of version releases with
 * their dates, highlights, and detailed change entries.
 */

import React, { useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// --- Types ---

interface ChangeEntry {
  type: 'added' | 'changed' | 'fixed' | 'removed';
  text: string;
}

interface Release {
  version: string;
  date: string;
  highlight: string;
  changes: ChangeEntry[];
  current?: boolean;
}

// --- Demo data ---

const TYPE_ICON: Record<string, string> = {
  added: '\u2795', changed: '\u{1F504}', fixed: '\u{1F41B}', removed: '\u2796',
};

const TYPE_LABEL: Record<string, string> = {
  added: 'Added', changed: 'Changed', fixed: 'Fixed', removed: 'Removed',
};

const RELEASES: Release[] = [
  {
    version: '0.9.4', date: '2026-03-28', current: true,
    highlight: 'Needs assessment dashboard and resource matching',
    changes: [
      { type: 'added', text: 'Basic needs tracking and assessment screens' },
      { type: 'added', text: 'Resource matching engine for community needs' },
      { type: 'added', text: 'Needs dashboard with priority indicators' },
      { type: 'fixed', text: 'Chain of causation data flow consistency' },
    ],
  },
  {
    version: '0.9.3', date: '2026-03-26',
    highlight: 'Eldercare, intergenerational features, and constitution reader',
    changes: [
      { type: 'added', text: 'Eldercare tracking and support screens' },
      { type: 'added', text: 'Intergenerational connection features' },
      { type: 'added', text: 'Gratitude wall for community appreciation' },
      { type: 'added', text: 'Human Constitution reader and pledge system' },
      { type: 'added', text: 'Ambassador program enrollment' },
    ],
  },
  {
    version: '0.9.2', date: '2026-03-25',
    highlight: 'Nurture value tracking (nOTK) — the heart of Open Chain',
    changes: [
      { type: 'added', text: 'nOTK nurture value tracking system' },
      { type: 'added', text: 'Multi-channel contribution recording' },
      { type: 'changed', text: 'Improved milestone verification flow' },
    ],
  },
  {
    version: '0.9.1', date: '2026-03-24',
    highlight: 'Global impact dashboards and peace index',
    changes: [
      { type: 'added', text: 'Global Impact dashboard' },
      { type: 'added', text: 'My Impact personal contribution view' },
      { type: 'added', text: 'Peace Index visualization' },
      { type: 'changed', text: 'Refined achievement gallery layout' },
    ],
  },
  {
    version: '0.9.0', date: '2026-03-20',
    highlight: 'Multi-chain wallet with PQC encryption',
    changes: [
      { type: 'added', text: 'Bitcoin, Ethereum, Solana, Polygon support' },
      { type: 'added', text: 'Post-quantum cryptography signing' },
      { type: 'added', text: 'Atomic swap engine (beta)' },
      { type: 'added', text: 'Paper trading safety mode' },
      { type: 'fixed', text: 'RPC connection stability improvements' },
    ],
  },
  {
    version: '0.8.0', date: '2026-03-10',
    highlight: 'Initial Open Chain integration',
    changes: [
      { type: 'added', text: 'Open Chain network connectivity' },
      { type: 'added', text: 'OTK token display and basic transfers' },
      { type: 'added', text: 'Soulbound achievement NFT viewer' },
      { type: 'changed', text: 'Redesigned wallet home screen' },
      { type: 'removed', text: 'Legacy single-chain mode' },
    ],
  },
];

// --- Component ---

interface Props {
  onClose: () => void;
}

export function ChangelogScreen({ onClose }: Props) {
  const t = useTheme();
  const walletStore = useWalletStore();

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    headerTitle: { color: t.text.primary, fontSize: 20, fontWeight: fonts.bold },
    closeText: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingHorizontal: 16, paddingBottom: 40 },
    releaseCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 14 },
    versionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    versionText: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy },
    dateText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    currentBadge: { backgroundColor: t.accent.green + '30', borderRadius: 6, paddingVertical: 2, paddingHorizontal: 8, marginLeft: 8 },
    currentBadgeText: { color: t.accent.green, fontSize: 10, fontWeight: fonts.bold },
    highlight: { color: t.text.secondary, fontSize: 14, fontWeight: fonts.semibold, marginBottom: 12, lineHeight: 20 },
    changeRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, paddingLeft: 4 },
    changeIcon: { fontSize: 12, marginRight: 8, marginTop: 2 },
    changeType: { fontSize: 11, fontWeight: fonts.bold, width: 64, marginRight: 4, marginTop: 1 },
    changeText: { color: t.text.secondary, fontSize: 13, flex: 1, lineHeight: 18 },
    divider: { height: 1, backgroundColor: t.border, marginVertical: 8 },
    footerText: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
  }), [t]);

  const typeColor = (type: string) => {
    switch (type) {
      case 'added': return t.accent.green;
      case 'changed': return t.accent.blue;
      case 'fixed': return t.accent.yellow;
      case 'removed': return t.accent.red;
      default: return t.text.muted;
    }
  };

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.headerTitle}>Changelog</Text>
        <TouchableOpacity onPress={onClose}><Text style={st.closeText}>Back</Text></TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll}>
        {RELEASES.map(release => (
          <View key={release.version} style={st.releaseCard}>
            <View style={st.versionRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={st.versionText}>v{release.version}</Text>
                {release.current && (
                  <View style={st.currentBadge}>
                    <Text style={st.currentBadgeText}>CURRENT</Text>
                  </View>
                )}
              </View>
              <Text style={st.dateText}>{release.date}</Text>
            </View>
            <Text style={st.highlight}>{release.highlight}</Text>
            <View style={st.divider} />
            {release.changes.map((ch, idx) => (
              <View key={idx} style={st.changeRow}>
                <Text style={st.changeIcon}>{TYPE_ICON[ch.type]}</Text>
                <Text style={[st.changeType, { color: typeColor(ch.type) }]}>{TYPE_LABEL[ch.type]}</Text>
                <Text style={st.changeText}>{ch.text}</Text>
              </View>
            ))}
          </View>
        ))}

        <Text style={st.footerText}>
          Open Wallet is built with love for humanity.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
