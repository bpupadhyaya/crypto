import { fonts } from '../utils/theme';
/**
 * Pledge Screen — Formally pledge support for The Human Constitution.
 *
 * Users can sign a pledge, which is recorded on-chain (or simulated in demo mode).
 * Shows global pledge count, personal pledge info, and a soulbound badge.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

interface PledgePrinciple {
  id: string;
  text: string;
  icon: string;
}

const PRINCIPLES: PledgePrinciple[] = [
  {
    id: 'value',
    text: 'I pledge to recognize and value every human contribution — nurture, education, health, community, economic participation, and governance.',
    icon: '♦',
  },
  {
    id: 'governance',
    text: 'I pledge to support one-human-one-vote governance, where no amount of wealth amplifies any individual\'s voice.',
    icon: '⚖',
  },
  {
    id: 'betterment',
    text: 'I pledge to use this technology for the betterment of humanity, and to strive toward a world where war becomes irrational.',
    icon: '☮',
  },
  {
    id: 'life',
    text: 'I pledge to uphold the immutable Article I: every human being has the inherent right to exist.',
    icon: '★',
  },
  {
    id: 'peace',
    text: 'I pledge to measure success not by profit, but by the Peace Index — the wellbeing of all people.',
    icon: '◆',
  },
];

// Demo data
const DEMO_GLOBAL_PLEDGES = 12_847;
const DEMO_TX_HASH = '0x7a3f...c291';
const DEMO_PLEDGE_DATE = '2026-03-15';

export function PledgeScreen({ onClose }: Props) {
  const t = useTheme();
  const { demoMode } = useWalletStore();
  const [hasPledged, setHasPledged] = useState(false);
  const [signing, setSigning] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [pledgeDate, setPledgeDate] = useState<string | null>(null);

  const handlePledge = useCallback(async () => {
    if (hasPledged) return;

    if (!demoMode) {
      Alert.alert(
        'Sign Pledge',
        'This will create a special transaction on Open Chain recording your pledge to The Human Constitution. This is a permanent, soulbound commitment.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign & Pledge',
            onPress: () => {
              // In production, this would create an actual on-chain tx
              Alert.alert('Coming Soon', 'On-chain pledge signing will be available when Open Chain mainnet launches. Enable Demo Mode to try it now.');
            },
          },
        ],
      );
      return;
    }

    // Demo mode — simulate
    setSigning(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setHasPledged(true);
    setTxHash(DEMO_TX_HASH);
    setPledgeDate(new Date().toISOString().split('T')[0]);
    setSigning(false);
  }, [hasPledged, demoMode]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    subtitle: { color: t.text.secondary, fontSize: 14, lineHeight: 22, marginBottom: 24, textAlign: 'center' },
    globalCounter: { backgroundColor: t.accent.purple + '15', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 24 },
    counterNum: { color: t.accent.purple, fontSize: 36, fontWeight: fonts.heavy },
    counterLabel: { color: t.text.secondary, fontSize: 13, marginTop: 4 },
    oathCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: t.accent.blue + '60' },
    oathIcon: { fontSize: 22, marginBottom: 8 },
    oathText: { color: t.text.primary, fontSize: 15, lineHeight: 24, fontStyle: 'italic' },
    pledgeBtn: { backgroundColor: t.accent.green, borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 20, marginBottom: 16 },
    pledgeBtnDisabled: { backgroundColor: t.text.muted },
    pledgeBtnText: { color: '#fff', fontSize: 17, fontWeight: fonts.heavy },
    signingRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 16 },
    signingText: { color: t.text.secondary, fontSize: 14 },
    pledgedCard: { backgroundColor: t.accent.green + '15', borderRadius: 16, padding: 20, alignItems: 'center', marginTop: 16, marginBottom: 16, borderWidth: 2, borderColor: t.accent.green + '40' },
    badgeIcon: { fontSize: 48, marginBottom: 12 },
    pledgedTitle: { color: t.accent.green, fontSize: 18, fontWeight: fonts.heavy, marginBottom: 4 },
    pledgedSub: { color: t.text.secondary, fontSize: 13, marginBottom: 12, textAlign: 'center' },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 6 },
    infoLabel: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    infoValue: { color: t.text.primary, fontSize: 12, fontWeight: fonts.bold },
    soulboundNote: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginTop: 8, fontStyle: 'italic' },
    demoTag: { backgroundColor: t.accent.yellow + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'center', marginBottom: 16 },
    demoText: { color: t.accent.yellow, fontSize: 12, fontWeight: fonts.bold },
  }), [t]);

  const globalCount = hasPledged ? DEMO_GLOBAL_PLEDGES + 1 : DEMO_GLOBAL_PLEDGES;

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Constitution Pledge</Text>
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

        <Text style={s.subtitle}>
          Formally pledge your support for The Human Constitution.{'\n'}
          Your pledge is recorded permanently on Open Chain.
        </Text>

        <View style={s.globalCounter}>
          <Text style={s.counterNum}>{globalCount.toLocaleString()}</Text>
          <Text style={s.counterLabel}>People have pledged worldwide</Text>
        </View>

        {PRINCIPLES.map((p) => (
          <View key={p.id} style={s.oathCard}>
            <Text style={s.oathIcon}>{p.icon}</Text>
            <Text style={s.oathText}>{p.text}</Text>
          </View>
        ))}

        {signing && (
          <View style={s.signingRow}>
            <ActivityIndicator size="small" color={t.accent.green} />
            <Text style={s.signingText}>Signing pledge on Open Chain...</Text>
          </View>
        )}

        {!hasPledged && !signing && (
          <TouchableOpacity
            style={s.pledgeBtn}
            onPress={handlePledge}
            activeOpacity={0.8}
          >
            <Text style={s.pledgeBtnText}>Sign the Pledge</Text>
          </TouchableOpacity>
        )}

        {hasPledged && (
          <View style={s.pledgedCard}>
            <Text style={s.badgeIcon}>{'★'}</Text>
            <Text style={s.pledgedTitle}>Pledge Signed</Text>
            <Text style={s.pledgedSub}>
              You have formally pledged to uphold The Human Constitution. This is a soulbound achievement — it cannot be transferred or revoked.
            </Text>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Pledge Date</Text>
              <Text style={s.infoValue}>{pledgeDate ?? DEMO_PLEDGE_DATE}</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Transaction</Text>
              <Text style={s.infoValue}>{txHash ?? DEMO_TX_HASH}</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Badge</Text>
              <Text style={s.infoValue}>Constitution Signer (Soulbound)</Text>
            </View>
            <Text style={s.soulboundNote}>
              This badge is permanently bound to your identity and cannot be sold or transferred.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
