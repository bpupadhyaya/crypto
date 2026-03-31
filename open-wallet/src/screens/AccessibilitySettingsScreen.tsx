/**
 * Accessibility Settings Screen — Detailed accessibility configuration (Art IX).
 *
 * Provides granular control over display, motion, and audio accessibility
 * settings in accordance with Article IX of the Human Constitution.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Switch,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// --- Types ---

type Tab = 'display' | 'motion' | 'audio';

interface SettingToggle {
  id: string;
  label: string;
  description: string;
  defaultValue: boolean;
}

// --- Demo data ---

const DISPLAY_SETTINGS: SettingToggle[] = [
  { id: 'd1', label: 'High Contrast Mode', description: 'Increase contrast between text and backgrounds for better readability.', defaultValue: false },
  { id: 'd2', label: 'Large Text', description: 'Increase base font size by 25% across all screens.', defaultValue: false },
  { id: 'd3', label: 'Bold Text', description: 'Use bold weight for all body text elements.', defaultValue: false },
  { id: 'd4', label: 'Color Blind Mode', description: 'Replace color-dependent indicators with patterns and labels.', defaultValue: false },
  { id: 'd5', label: 'Monochrome Icons', description: 'Use single-color icons instead of multi-colored variants.', defaultValue: false },
];

const MOTION_SETTINGS: SettingToggle[] = [
  { id: 'm1', label: 'Reduce Motion', description: 'Minimize animations and transitions throughout the app.', defaultValue: false },
  { id: 'm2', label: 'Disable Auto-Play', description: 'Stop automatic playback of animations and visual effects.', defaultValue: true },
  { id: 'm3', label: 'Reduce Transparency', description: 'Use solid backgrounds instead of translucent overlays.', defaultValue: false },
  { id: 'm4', label: 'Simple Transitions', description: 'Use fade transitions instead of slide or zoom effects.', defaultValue: false },
];

const AUDIO_SETTINGS: SettingToggle[] = [
  { id: 'a1', label: 'Screen Reader Support', description: 'Optimize layout and labels for VoiceOver and TalkBack compatibility.', defaultValue: true },
  { id: 'a2', label: 'Haptic Feedback', description: 'Provide tactile feedback for button presses and confirmations.', defaultValue: true },
  { id: 'a3', label: 'Sound Effects', description: 'Play audio cues for transaction confirmations and alerts.', defaultValue: true },
  { id: 'a4', label: 'Spoken Amounts', description: 'Read transaction amounts aloud before confirmation.', defaultValue: false },
  { id: 'a5', label: 'Navigation Announcements', description: 'Announce screen changes and navigation events audibly.', defaultValue: false },
  { id: 'a6', label: 'Vibration Alerts', description: 'Use distinct vibration patterns for different notification types.', defaultValue: true },
];

// --- Component ---

interface Props {
  onClose: () => void;
}

export function AccessibilitySettingsScreen({ onClose }: Props) {
  const t = useTheme();
  const walletStore = useWalletStore();
  const [tab, setTab] = useState<Tab>('display');
  const [toggles, setToggles] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    [...DISPLAY_SETTINGS, ...MOTION_SETTINGS, ...AUDIO_SETTINGS].forEach(s => { init[s.id] = s.defaultValue; });
    return init;
  });

  const handleToggle = (id: string) => {
    setToggles(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'display', label: 'Display' },
    { key: 'motion', label: 'Motion' },
    { key: 'audio', label: 'Audio' },
  ];

  const settings = tab === 'display' ? DISPLAY_SETTINGS : tab === 'motion' ? MOTION_SETTINGS : AUDIO_SETTINGS;

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    headerTitle: { color: t.text.primary, fontSize: 20, fontWeight: '700' },
    closeText: { color: t.accent.blue, fontSize: 16 },
    tabRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, borderRadius: 10, backgroundColor: t.bg.card, overflow: 'hidden' },
    tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
    tabBtnActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.muted, fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: '#fff' },
    scroll: { paddingHorizontal: 16, paddingBottom: 40 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 8, marginBottom: 12 },
    settingCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 10 },
    settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    settingLabel: { color: t.text.primary, fontSize: 15, fontWeight: '600', flex: 1, marginRight: 12 },
    settingDesc: { color: t.text.muted, fontSize: 12, lineHeight: 17, marginTop: 8 },
    articleBanner: { backgroundColor: t.accent.purple + '20', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: t.accent.purple + '40' },
    articleTitle: { color: t.accent.purple, fontSize: 13, fontWeight: '700', marginBottom: 4 },
    articleText: { color: t.text.secondary, fontSize: 12, lineHeight: 18 },
    resetBtn: { backgroundColor: t.bg.card, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16, borderWidth: 1, borderColor: t.border },
    resetText: { color: t.accent.red, fontSize: 14, fontWeight: '700' },
    activeCount: { color: t.text.muted, fontSize: 11, textAlign: 'center', marginBottom: 12 },
  }), [t]);

  const activeCount = settings.filter(s => toggles[s.id]).length;

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.headerTitle}>Accessibility</Text>
        <TouchableOpacity onPress={onClose}><Text style={st.closeText}>Back</Text></TouchableOpacity>
      </View>

      <View style={st.tabRow}>
        {tabs.map(tb => (
          <TouchableOpacity key={tb.key} style={[st.tabBtn, tab === tb.key && st.tabBtnActive]} onPress={() => setTab(tb.key)}>
            <Text style={[st.tabText, tab === tb.key && st.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll}>
        <View style={st.articleBanner}>
          <Text style={st.articleTitle}>Article IX — Universal Accessibility</Text>
          <Text style={st.articleText}>
            Every person shall have equal access to tools and technology regardless of ability. These settings ensure Open Wallet is usable by everyone.
          </Text>
        </View>

        <Text style={st.section}>{tab} Settings</Text>
        <Text style={st.activeCount}>{activeCount} of {settings.length} enabled</Text>

        {settings.map(setting => (
          <View key={setting.id} style={st.settingCard}>
            <View style={st.settingRow}>
              <Text style={st.settingLabel}>{setting.label}</Text>
              <Switch
                value={toggles[setting.id]}
                onValueChange={() => handleToggle(setting.id)}
                trackColor={{ false: t.border, true: t.accent.green }}
              />
            </View>
            <Text style={st.settingDesc}>{setting.description}</Text>
          </View>
        ))}

        <TouchableOpacity style={st.resetBtn} onPress={() => {
          const reset: Record<string, boolean> = {};
          settings.forEach(s => { reset[s.id] = s.defaultValue; });
          setToggles(prev => ({ ...prev, ...reset }));
        }}>
          <Text style={st.resetText}>Reset to Defaults</Text>
        </TouchableOpacity>

        {/* Info note */}
        <View style={{
          backgroundColor: t.accent.green + '15',
          borderRadius: 14,
          padding: 16,
          marginTop: 16,
        }}>
          <Text style={{
            color: t.accent.green,
            fontSize: 13,
            fontWeight: '700',
            marginBottom: 4,
          }}>
            Accessibility Commitment
          </Text>
          <Text style={{
            color: t.text.secondary,
            fontSize: 12,
            lineHeight: 18,
          }}>
            Open Wallet is committed to WCAG 2.1 AA compliance. These settings go beyond minimum requirements to ensure the best possible experience for all users regardless of ability.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
