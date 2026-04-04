/**
 * Display Settings — User-adjustable font sizes, icon sizes, and text weight.
 * Sliders with live preview so users can see changes instantly.
 */

import React, { useMemo, useCallback, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';
import { fonts, getDisplayScales, DEFAULT_DISPLAY_SCALES, type DisplayScales } from '../utils/theme';

interface Props {
  onClose: () => void;
}

interface ScaleConfig {
  key: keyof DisplayScales;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
}

const SCALE_CONFIGS: ScaleConfig[] = [
  {
    key: 'appScale', label: 'App Font Size',
    description: 'Master control — scales ALL text across the entire app',
    min: 0.7, max: 2.0, step: 0.05,
    format: (v) => `${Math.round(v * 100)}%`,
  },
  {
    key: 'contentScale', label: 'Content Text Size',
    description: 'Body text, descriptions, paragraphs — multiplied on top of App Font Size',
    min: 0.7, max: 2.0, step: 0.05,
    format: (v) => `${Math.round(v * 100)}%`,
  },
  {
    key: 'menuScale', label: 'Menu & Button Size',
    description: 'Navigation items, buttons, tab labels, chips',
    min: 0.7, max: 2.0, step: 0.05,
    format: (v) => `${Math.round(v * 100)}%`,
  },
  {
    key: 'iconScale', label: 'Icon & Emoji Size',
    description: 'Icons, emojis, and decorative symbols throughout the app',
    min: 0.7, max: 2.5, step: 0.05,
    format: (v) => `${Math.round(v * 100)}%`,
  },
  {
    key: 'weightBoost', label: 'Text Boldness',
    description: 'Make all text bolder for better readability',
    min: 0, max: 200, step: 100,
    format: (v) => v === 0 ? 'Normal' : v === 100 ? 'Bold' : 'Extra Bold',
  },
];

export function DisplaySettingsScreen({ onClose }: Props) {
  const { displayScales, setDisplayScale, resetDisplayScales } = useWalletStore();
  const t = useTheme();
  const [, forceRender] = useState(0);

  const handleChange = useCallback((key: keyof DisplayScales, value: number) => {
    setDisplayScale(key, value);
    forceRender(n => n + 1); // force re-render to pick up new fonts values
  }, [setDisplayScale]);

  const handleReset = useCallback(() => {
    Alert.alert('Reset Display', 'Reset all display settings to defaults?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => { resetDisplayScales(); forceRender(n => n + 1); } },
    ]);
  }, [resetDisplayScales]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 60 },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 12,
    },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.bold },
    backText: { color: t.accent.blue, fontSize: fonts.lg },
    // Card
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginTop: 12 },
    cardTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 2 },
    cardDesc: { color: t.text.muted, fontSize: fonts.xs, lineHeight: fonts.md, marginBottom: 12 },
    stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    stepperBtn: {
      width: 44, height: 44, borderRadius: 22, backgroundColor: t.accent.green + '20',
      justifyContent: 'center', alignItems: 'center',
    },
    stepperBtnText: { color: t.accent.green, fontSize: fonts.xl, fontWeight: fonts.heavy },
    stepperValue: {
      color: t.accent.green, fontSize: fonts.xl, fontWeight: fonts.bold,
      minWidth: 80, textAlign: 'center',
    },
    stepperBar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: t.text.muted + '20', marginHorizontal: 12 },
    stepperFill: { height: 6, borderRadius: 3, backgroundColor: t.accent.green },
    // Preview
    previewCard: {
      backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginTop: 20,
      borderWidth: 1, borderColor: t.accent.blue + '30',
    },
    previewLabel: {
      color: t.accent.blue, fontSize: fonts.xs, fontWeight: fonts.bold,
      textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12,
    },
    previewTitle: { color: t.text.primary, fontSize: fonts.xxl, fontWeight: fonts.heavy, marginBottom: 4 },
    previewBody: { color: t.text.secondary, fontSize: fonts.md, lineHeight: fonts.xl, marginBottom: 8 },
    previewMuted: { color: t.text.muted, fontSize: fonts.sm, marginBottom: 12 },
    previewBtn: {
      backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 12, alignItems: 'center',
      marginBottom: 8,
    },
    previewBtnText: { color: t.bg.primary, fontSize: fonts.lg, fontWeight: fonts.bold },
    previewChipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 },
    previewChip: {
      backgroundColor: t.accent.blue + '15', borderRadius: 10,
      paddingVertical: 6, paddingHorizontal: 12,
    },
    previewChipText: { color: t.accent.blue, fontSize: fonts.sm, fontWeight: fonts.semibold },
    previewIcon: { fontSize: fonts.iconLg, marginBottom: 8 },
    // Reset
    resetBtn: {
      backgroundColor: t.accent.red + '15', borderRadius: 16, paddingVertical: 16,
      alignItems: 'center', marginTop: 20,
    },
    resetText: { color: t.accent.red, fontSize: fonts.md, fontWeight: fonts.bold },
  }), [t, displayScales]); // re-create styles when scales change

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Display Settings</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.backText}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Live Preview */}
        <View style={s.previewCard}>
          <Text style={s.previewLabel}>Live Preview</Text>
          <Text style={s.previewIcon}>{'🔐'}</Text>
          <Text style={s.previewTitle}>Open Wallet</Text>
          <Text style={s.previewBody}>
            Your secure, decentralized wallet. Manage tokens, swap assets, and stake across multiple chains.
          </Text>
          <Text style={s.previewMuted}>Last updated 2 minutes ago</Text>
          <TouchableOpacity style={s.previewBtn} activeOpacity={0.8}>
            <Text style={s.previewBtnText}>Send Tokens</Text>
          </TouchableOpacity>
          <View style={s.previewChipRow}>
            <View style={s.previewChip}><Text style={s.previewChipText}>BTC</Text></View>
            <View style={s.previewChip}><Text style={s.previewChipText}>ETH</Text></View>
            <View style={s.previewChip}><Text style={s.previewChipText}>SOL</Text></View>
            <View style={s.previewChip}><Text style={s.previewChipText}>USDT</Text></View>
          </View>
        </View>

        {/* Scale Sliders */}
        {SCALE_CONFIGS.map((cfg) => {
          const val = displayScales[cfg.key];
          const pct = (val - cfg.min) / (cfg.max - cfg.min);
          return (
            <View key={cfg.key} style={s.card}>
              <Text style={s.cardTitle}>{cfg.label}</Text>
              <Text style={s.cardDesc}>{cfg.description}</Text>
              <View style={s.stepperRow}>
                <TouchableOpacity
                  style={s.stepperBtn}
                  onPress={() => handleChange(cfg.key, Math.max(cfg.min, Math.round((val - cfg.step) * 100) / 100))}
                >
                  <Text style={s.stepperBtnText}>-</Text>
                </TouchableOpacity>
                <View style={{ flex: 1, marginHorizontal: 12 }}>
                  <Text style={s.stepperValue}>{cfg.format(val)}</Text>
                  <View style={s.stepperBar}>
                    <View style={[s.stepperFill, { width: `${Math.round(pct * 100)}%` }]} />
                  </View>
                </View>
                <TouchableOpacity
                  style={s.stepperBtn}
                  onPress={() => handleChange(cfg.key, Math.min(cfg.max, Math.round((val + cfg.step) * 100) / 100))}
                >
                  <Text style={s.stepperBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Reset Button */}
        <TouchableOpacity style={s.resetBtn} onPress={handleReset}>
          <Text style={s.resetText}>Reset All to Defaults</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
