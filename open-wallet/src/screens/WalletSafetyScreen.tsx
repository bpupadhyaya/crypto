/**
 * Wallet Safety Screen — FAQ about updates, backups, and what to never do.
 * Accessible from Settings > About > Wallet Safety.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { fonts } from '../utils/theme';
import { WALLET_SAFETY_FAQ, UPDATE_GUIDE } from '../core/docs/walletSafety';

interface Props {
  onClose: () => void;
}

export function WalletSafetyScreen({ onClose }: Props) {
  const t = useTheme();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    scroll: { padding: 20 },
    title: { color: t.text.primary, fontSize: fonts.xxl, fontWeight: fonts.heavy as any, marginBottom: 4 },
    subtitle: { color: t.text.muted, fontSize: fonts.md, marginBottom: 24 },
    sectionTitle: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold as any, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12, marginTop: 20 },
    faqCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 10 },
    faqQuestion: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold as any },
    faqAnswer: { color: t.text.secondary, fontSize: fonts.sm, lineHeight: 20, marginTop: 10 },
    safeItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
    safeIcon: { fontSize: fonts.md, marginRight: 8, marginTop: 1 },
    safeText: { color: t.text.secondary, fontSize: fonts.sm, flex: 1, lineHeight: 18 },
    dangerItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
    dangerText: { color: t.accent.red, fontSize: fonts.sm, flex: 1, lineHeight: 18 },
    backBtn: { paddingVertical: 20, alignItems: 'center' },
    backText: { color: t.accent.blue, fontSize: fonts.lg },
  }), [t]);

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Wallet Safety</Text>
        <Text style={s.subtitle}>
          Everything you need to know about keeping your wallet safe during updates, phone changes, and more.
        </Text>

        {/* Update Guide */}
        <Text style={s.sectionTitle}>{UPDATE_GUIDE.title}</Text>

        <View style={[s.faqCard, { borderWidth: 1, borderColor: t.accent.green + '40' }]}>
          <Text style={{ color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold as any, marginBottom: 8 }}>
            SAFE — your wallet data is preserved
          </Text>
          {UPDATE_GUIDE.safe.map((item, i) => (
            <View key={i} style={s.safeItem}>
              <Text style={s.safeIcon}>✅</Text>
              <Text style={s.safeText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={[s.faqCard, { borderWidth: 1, borderColor: t.accent.red + '40' }]}>
          <Text style={{ color: t.accent.red, fontSize: fonts.sm, fontWeight: fonts.bold as any, marginBottom: 8 }}>
            DANGEROUS — your wallet data is DELETED
          </Text>
          {UPDATE_GUIDE.dangerous.map((item, i) => (
            <View key={i} style={s.dangerItem}>
              <Text style={s.safeIcon}>❌</Text>
              <Text style={s.dangerText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* FAQ */}
        <Text style={s.sectionTitle}>Frequently Asked Questions</Text>

        {WALLET_SAFETY_FAQ.map((faq, i) => (
          <TouchableOpacity
            key={i}
            style={s.faqCard}
            onPress={() => setExpandedIdx(expandedIdx === i ? null : i)}
            activeOpacity={0.7}
          >
            <Text style={s.faqQuestion}>
              {expandedIdx === i ? '▼' : '▶'} {faq.question}
            </Text>
            {expandedIdx === i && (
              <Text style={s.faqAnswer}>{faq.answer}</Text>
            )}
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={s.backBtn} onPress={onClose}>
          <Text style={s.backText}>Back to Settings</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
