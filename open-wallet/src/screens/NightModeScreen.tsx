import { fonts } from '../utils/theme';
/**
 * Night Mode Screen — Blue light filter and night reading settings.
 *
 * Provides controls for blue light filtering, screen warmth,
 * brightness overrides, and scheduled night mode activation.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Switch,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// --- Types ---

interface WarmthLevel {
  id: string;
  label: string;
  value: number;
  color: string;
}

// --- Demo data ---

const WARMTH_LEVELS: WarmthLevel[] = [
  { id: 'w1', label: 'Off', value: 0, color: '#ffffff' },
  { id: 'w2', label: 'Low', value: 25, color: '#fff4e0' },
  { id: 'w3', label: 'Medium', value: 50, color: '#ffe8b8' },
  { id: 'w4', label: 'High', value: 75, color: '#ffd080' },
  { id: 'w5', label: 'Maximum', value: 100, color: '#ffb840' },
];

const SCHEDULE_OPTIONS = [
  { id: 'sch1', label: 'Sunset to Sunrise', description: 'Automatically activate based on local sunrise/sunset times.' },
  { id: 'sch2', label: 'Custom Schedule', description: 'Set specific on/off times for night mode.' },
  { id: 'sch3', label: 'Always On', description: 'Keep night mode active at all times.' },
  { id: 'sch4', label: 'Manual Only', description: 'Only activate when you manually toggle it.' },
];

// --- Component ---

interface Props {
  onClose: () => void;
}

export function NightModeScreen({ onClose }: Props) {
  const t = useTheme();
  const walletStore = useWalletStore();
  const [enabled, setEnabled] = useState(false);
  const [warmth, setWarmth] = useState('w3');
  const [dimScreen, setDimScreen] = useState(false);
  const [darkCharts, setDarkCharts] = useState(true);
  const [reduceWhite, setReduceWhite] = useState(false);
  const [schedule, setSchedule] = useState('sch1');

  const selectedWarmth = useMemo(() => WARMTH_LEVELS.find(w => w.id === warmth), [warmth]);

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    headerTitle: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.bold },
    closeText: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingHorizontal: 16, paddingBottom: 40 },
    section: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 20, marginBottom: 8 },
    card: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 10 },
    masterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 16 },
    masterLabel: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold },
    masterStatus: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    previewCard: { borderRadius: 14, padding: 20, alignItems: 'center', marginBottom: 16 },
    previewText: { fontSize: fonts.md, fontWeight: fonts.semibold, marginTop: 8 },
    previewMoon: { fontSize: fonts.hero },
    warmthRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
    warmthBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 2 },
    warmthLabel: { fontSize: fonts.xs, fontWeight: fonts.bold, marginTop: 4 },
    warmthDot: { width: 20, height: 20, borderRadius: 10 },
    settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
    settingLabel: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold, flex: 1 },
    settingDesc: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    scheduleCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 8, borderWidth: 2 },
    scheduleLabel: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    scheduleDesc: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4, lineHeight: 17 },
    tipCard: { backgroundColor: t.accent.blue + '15', borderRadius: 14, padding: 16, marginTop: 12 },
    tipTitle: { color: t.accent.blue, fontSize: fonts.sm, fontWeight: fonts.bold, marginBottom: 4 },
    tipText: { color: t.text.secondary, fontSize: fonts.sm, lineHeight: 18 },
  }), [t]);

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.headerTitle}>Night Mode</Text>
        <TouchableOpacity onPress={onClose}><Text style={st.closeText}>Back</Text></TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll}>
        {/* Master toggle */}
        <View style={st.masterRow}>
          <View>
            <Text style={st.masterLabel}>Night Mode</Text>
            <Text style={st.masterStatus}>{enabled ? 'Active' : 'Inactive'}</Text>
          </View>
          <Switch value={enabled} onValueChange={setEnabled} trackColor={{ false: t.border, true: t.accent.green }} />
        </View>

        {/* Preview */}
        <View style={[st.previewCard, { backgroundColor: enabled && selectedWarmth ? selectedWarmth.color + '40' : t.bg.card }]}>
          <Text style={st.previewMoon}>{enabled ? '\u{1F31C}' : '\u2600\uFE0F'}</Text>
          <Text style={[st.previewText, { color: t.text.primary }]}>
            {enabled ? `Warmth: ${selectedWarmth?.label || 'Medium'}` : 'Night mode is off'}
          </Text>
        </View>

        {/* Warmth levels */}
        <Text style={st.section}>Blue Light Filter</Text>
        <View style={st.card}>
          <View style={st.warmthRow}>
            {WARMTH_LEVELS.map(level => (
              <TouchableOpacity
                key={level.id}
                style={[st.warmthBtn, { borderColor: warmth === level.id ? t.accent.blue : t.border, backgroundColor: level.color + '30' }]}
                onPress={() => setWarmth(level.id)}
              >
                <View style={[st.warmthDot, { backgroundColor: level.color }]} />
                <Text style={[st.warmthLabel, { color: warmth === level.id ? t.accent.blue : t.text.muted }]}>{level.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Additional settings */}
        <Text style={st.section}>Display Options</Text>
        <View style={st.card}>
          <View style={st.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={st.settingLabel}>Dim Screen</Text>
              <Text style={st.settingDesc}>Reduce overall screen brightness by 20%</Text>
            </View>
            <Switch value={dimScreen} onValueChange={setDimScreen} trackColor={{ false: t.border, true: t.accent.green }} />
          </View>
        </View>
        <View style={st.card}>
          <View style={st.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={st.settingLabel}>Dark Charts</Text>
              <Text style={st.settingDesc}>Use dark backgrounds for price and portfolio charts</Text>
            </View>
            <Switch value={darkCharts} onValueChange={setDarkCharts} trackColor={{ false: t.border, true: t.accent.green }} />
          </View>
        </View>
        <View style={st.card}>
          <View style={st.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={st.settingLabel}>Reduce White Space</Text>
              <Text style={st.settingDesc}>Minimize bright white areas in the interface</Text>
            </View>
            <Switch value={reduceWhite} onValueChange={setReduceWhite} trackColor={{ false: t.border, true: t.accent.green }} />
          </View>
        </View>

        {/* Schedule */}
        <Text style={st.section}>Schedule</Text>
        {SCHEDULE_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.id}
            style={[st.scheduleCard, { borderColor: schedule === opt.id ? t.accent.blue : 'transparent' }]}
            onPress={() => setSchedule(opt.id)}
            activeOpacity={0.7}
          >
            <Text style={st.scheduleLabel}>{opt.label}</Text>
            <Text style={st.scheduleDesc}>{opt.description}</Text>
          </TouchableOpacity>
        ))}

        {/* Tip */}
        <View style={st.tipCard}>
          <Text style={st.tipTitle}>Eye Health Tip</Text>
          <Text style={st.tipText}>
            Blue light exposure before sleep can disrupt your circadian rhythm. Enable night mode in the evening for better sleep quality.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
