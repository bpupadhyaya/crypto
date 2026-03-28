/**
 * Accessibility Settings Screen — font size, contrast, motion, screen reader, haptics.
 * Includes a live preview section so users can see changes immediately.
 */

import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Switch,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

type FontSize = 'small' | 'medium' | 'large' | 'xlarge';

const FONT_SCALE: Record<FontSize, number> = {
  small: 0.85,
  medium: 1.0,
  large: 1.2,
  xlarge: 1.4,
};

const FONT_LABELS: { key: FontSize; label: string }[] = [
  { key: 'small', label: 'S' },
  { key: 'medium', label: 'M' },
  { key: 'large', label: 'L' },
  { key: 'xlarge', label: 'XL' },
];

interface Props {
  onClose: () => void;
}

export function AccessibilityScreen({ onClose }: Props) {
  const {
    fontSize, setFontSize,
    highContrast, setHighContrast,
    reduceMotion, setReduceMotion,
    screenReaderHints, setScreenReaderHints,
    hapticFeedback, setHapticFeedback,
  } = useWalletStore();
  const t = useTheme();

  const scale = FONT_SCALE[fontSize];

  const hcText = highContrast ? '#FFFFFF' : t.text.primary;
  const hcSecondary = highContrast ? '#CCCCCC' : t.text.secondary;
  const hcBg = highContrast ? '#000000' : t.bg.primary;
  const hcCard = highContrast ? '#1A1A1A' : t.bg.card;
  const hcBorder = highContrast ? '#666666' : t.border;

  const st = StyleSheet.create({
    container: { flex: 1, backgroundColor: hcBg },
    scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    title: { color: hcText, fontSize: 20 * scale, fontWeight: '700' },
    backText: { color: t.accent.blue, fontSize: 16 * scale },
    section: { color: hcSecondary, fontSize: 12 * scale, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 24, marginBottom: 8, marginLeft: 4 },
    card: { backgroundColor: hcCard, borderRadius: 16, padding: 4 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    label: { color: hcText, fontSize: 15 * scale, flex: 1 },
    sublabel: { color: hcSecondary, fontSize: 12 * scale, marginTop: 2 },
    divider: { height: 1, backgroundColor: hcBorder, marginHorizontal: 16 },
    sizeToggle: { flexDirection: 'row', gap: 4 },
    sizeBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8, backgroundColor: hcBorder },
    sizeBtnActive: { backgroundColor: t.accent.green },
    sizeBtnText: { color: hcSecondary, fontSize: 13 * scale, fontWeight: '600' },
    sizeBtnTextActive: { color: hcBg },
    previewCard: { backgroundColor: hcCard, borderRadius: 16, padding: 20, marginTop: 8 },
    previewTitle: { color: hcText, fontSize: 18 * scale, fontWeight: '700', marginBottom: 12 },
    previewBalance: { color: t.accent.green, fontSize: 28 * scale, fontWeight: '700', marginBottom: 4 },
    previewSub: { color: hcSecondary, fontSize: 13 * scale },
    previewRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
    previewToken: { color: hcText, fontSize: 15 * scale, fontWeight: '600' },
    previewAmount: { color: hcSecondary, fontSize: 14 * scale },
  });

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={st.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={st.title}>Accessibility</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll}>

        {/* Font Size */}
        <Text style={st.section}>Display</Text>
        <View style={st.card}>
          <View style={st.row}>
            <View style={{ flex: 1 }}>
              <Text style={st.label}>Font Size</Text>
              <Text style={st.sublabel}>Adjust text size across the app</Text>
            </View>
            <View style={st.sizeToggle}>
              {FONT_LABELS.map((f) => (
                <TouchableOpacity
                  key={f.key}
                  style={[st.sizeBtn, fontSize === f.key && st.sizeBtnActive]}
                  onPress={() => setFontSize(f.key)}
                  accessibilityRole="button"
                  accessibilityLabel={`Font size ${f.key}`}
                  accessibilityState={{ selected: fontSize === f.key }}
                >
                  <Text style={[st.sizeBtnText, fontSize === f.key && st.sizeBtnTextActive]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={st.divider} />

          <View style={st.row}>
            <View style={{ flex: 1 }}>
              <Text style={st.label}>High Contrast</Text>
              <Text style={st.sublabel}>Increase contrast for better readability</Text>
            </View>
            <Switch
              value={highContrast}
              onValueChange={setHighContrast}
              trackColor={{ false: hcBorder, true: t.accent.green }}
              accessibilityLabel="High contrast mode"
            />
          </View>
        </View>

        {/* Motion & Feedback */}
        <Text style={st.section}>Motion & Feedback</Text>
        <View style={st.card}>
          <View style={st.row}>
            <View style={{ flex: 1 }}>
              <Text style={st.label}>Reduce Motion</Text>
              <Text style={st.sublabel}>Disable animations throughout the app</Text>
            </View>
            <Switch
              value={reduceMotion}
              onValueChange={setReduceMotion}
              trackColor={{ false: hcBorder, true: t.accent.green }}
              accessibilityLabel="Reduce motion"
            />
          </View>

          <View style={st.divider} />

          <View style={st.row}>
            <View style={{ flex: 1 }}>
              <Text style={st.label}>Screen Reader Hints</Text>
              <Text style={st.sublabel}>Add extra labels for screen readers</Text>
            </View>
            <Switch
              value={screenReaderHints}
              onValueChange={setScreenReaderHints}
              trackColor={{ false: hcBorder, true: t.accent.green }}
              accessibilityLabel="Screen reader hints"
            />
          </View>

          <View style={st.divider} />

          <View style={st.row}>
            <View style={{ flex: 1 }}>
              <Text style={st.label}>Haptic Feedback</Text>
              <Text style={st.sublabel}>Vibration on button presses</Text>
            </View>
            <Switch
              value={hapticFeedback}
              onValueChange={setHapticFeedback}
              trackColor={{ false: hcBorder, true: t.accent.green }}
              accessibilityLabel="Haptic feedback"
            />
          </View>
        </View>

        {/* Preview */}
        <Text style={st.section}>Preview</Text>
        <View style={st.previewCard}>
          <Text style={st.previewTitle}>Open Wallet</Text>
          <Text style={st.previewBalance}>$12,345.67</Text>
          <Text style={st.previewSub}>Total portfolio value</Text>
          <View style={st.previewRow}>
            <Text style={st.previewToken}>BTC</Text>
            <Text style={st.previewAmount}>0.5432 BTC</Text>
          </View>
          <View style={st.previewRow}>
            <Text style={st.previewToken}>ETH</Text>
            <Text style={st.previewAmount}>12.345 ETH</Text>
          </View>
          <View style={st.previewRow}>
            <Text style={st.previewToken}>SOL</Text>
            <Text style={st.previewAmount}>234.56 SOL</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
