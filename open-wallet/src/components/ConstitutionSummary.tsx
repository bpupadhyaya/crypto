/**
 * Constitution Summary Card — Reusable component for various screens.
 *
 * Two modes:
 * - compact: "Powered by The Human Constitution" with a small icon
 * - expanded: shows 3 core principles + link to full reader
 */

import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface Props {
  /** Start expanded (default false = compact) */
  initialExpanded?: boolean;
  /** Called when user taps "Read Full Constitution" */
  onReadFull?: () => void;
}

const CORE_PRINCIPLES = [
  {
    icon: '★',
    title: 'Every Human Has Value',
    text: 'All contributions — nurture, education, health, community, economic, governance — are recognized and rewarded.',
  },
  {
    icon: '⚖',
    title: 'One Human, One Vote',
    text: 'No amount of wealth amplifies governance power. Every person has an equal voice.',
  },
  {
    icon: '☮',
    title: 'Peace Through Fulfillment',
    text: 'When all needs are met, war becomes irrational. The Peace Index is the ultimate metric.',
  },
];

export function ConstitutionSummary({ initialExpanded = false, onReadFull }: Props) {
  const t = useTheme();
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  const s = useMemo(() => StyleSheet.create({
    compactCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.bg.card,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      gap: 10,
      borderLeftWidth: 3,
      borderLeftColor: '#d4a017',
    },
    compactIcon: { fontSize: 16, color: '#d4a017' },
    compactText: { color: t.text.secondary, fontSize: 13, flex: 1 },
    compactBold: { color: t.text.primary, fontWeight: '700' },
    expandIcon: { color: t.text.muted, fontSize: 14 },
    expandedCard: {
      backgroundColor: t.bg.card,
      borderRadius: 16,
      padding: 16,
      borderLeftWidth: 3,
      borderLeftColor: '#d4a017',
    },
    expandedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    expandedTitle: { color: '#d4a017', fontSize: 14, fontWeight: '800' },
    collapseBtn: { color: t.text.muted, fontSize: 14 },
    principleRow: { flexDirection: 'row', gap: 10, marginBottom: 12, alignItems: 'flex-start' },
    principleIcon: { fontSize: 16, marginTop: 2 },
    principleInfo: { flex: 1 },
    principleTitle: { color: t.text.primary, fontSize: 13, fontWeight: '700', marginBottom: 2 },
    principleText: { color: t.text.secondary, fontSize: 12, lineHeight: 18 },
    readBtn: { backgroundColor: '#d4a017' + '15', borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 4 },
    readBtnText: { color: '#d4a017', fontSize: 13, fontWeight: '700' },
  }), [t]);

  if (!isExpanded) {
    return (
      <TouchableOpacity style={s.compactCard} onPress={() => setIsExpanded(true)} activeOpacity={0.7}>
        <Text style={s.compactIcon}>{'★'}</Text>
        <Text style={s.compactText}>
          Powered by <Text style={s.compactBold}>The Human Constitution</Text>
        </Text>
        <Text style={s.expandIcon}>{'▸'}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={s.expandedCard}>
      <View style={s.expandedHeader}>
        <Text style={s.expandedTitle}>The Human Constitution</Text>
        <TouchableOpacity onPress={() => setIsExpanded(false)}>
          <Text style={s.collapseBtn}>{'▾'}</Text>
        </TouchableOpacity>
      </View>

      {CORE_PRINCIPLES.map((p) => (
        <View key={p.title} style={s.principleRow}>
          <Text style={s.principleIcon}>{p.icon}</Text>
          <View style={s.principleInfo}>
            <Text style={s.principleTitle}>{p.title}</Text>
            <Text style={s.principleText}>{p.text}</Text>
          </View>
        </View>
      ))}

      {onReadFull && (
        <TouchableOpacity style={s.readBtn} onPress={onReadFull} activeOpacity={0.7}>
          <Text style={s.readBtnText}>Read Full Constitution</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
