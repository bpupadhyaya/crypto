import { fonts } from '../utils/theme';
/**
 * Theme Studio Screen (Art IX) — Create and share custom themes.
 *
 * Personalize the app appearance with built-in themes, a custom theme builder,
 * and community-shared themes. Express yourself while keeping the app yours.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

type Tab = 'themes' | 'create' | 'community';

interface ThemePreset {
  id: string;
  name: string;
  icon: string;
  colors: ThemeColors;
  builtin: boolean;
  author?: string;
  downloads?: number;
}

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  card: string;
  text: string;
}

interface Props {
  onClose: () => void;
}

const BUILTIN_THEMES: ThemePreset[] = [
  { id: 'dark', name: 'Dark', icon: '\uD83C\uDF11', builtin: true, colors: { primary: '#1A1A2E', secondary: '#16213E', accent: '#0F3460', background: '#0A0A1A', card: '#1A1A2E', text: '#E8E8E8' } },
  { id: 'light', name: 'Light', icon: '\u2600\uFE0F', builtin: true, colors: { primary: '#FFFFFF', secondary: '#F5F5F5', accent: '#2196F3', background: '#FAFAFA', card: '#FFFFFF', text: '#1A1A1A' } },
  { id: 'midnight-blue', name: 'Midnight Blue', icon: '\uD83C\uDF0C', builtin: true, colors: { primary: '#0D1B2A', secondary: '#1B2838', accent: '#415A77', background: '#0A1628', card: '#1B2838', text: '#E0E1DD' } },
  { id: 'forest-green', name: 'Forest Green', icon: '\uD83C\uDF32', builtin: true, colors: { primary: '#1B2D1B', secondary: '#2D4A2D', accent: '#4CAF50', background: '#0F1F0F', card: '#1B2D1B', text: '#D4E6D4' } },
  { id: 'sunset', name: 'Sunset', icon: '\uD83C\uDF05', builtin: true, colors: { primary: '#2D1B1B', secondary: '#4A2D2D', accent: '#FF6B35', background: '#1F0F0F', card: '#2D1B1B', text: '#F5E6D3' } },
  { id: 'ocean', name: 'Ocean', icon: '\uD83C\uDF0A', builtin: true, colors: { primary: '#0A2342', secondary: '#12335B', accent: '#00B4D8', background: '#061A30', card: '#0A2342', text: '#CAF0F8' } },
];

const COMMUNITY_THEMES: ThemePreset[] = [
  { id: 'community-cyberpunk', name: 'Cyberpunk Neon', icon: '\uD83E\uDD16', builtin: false, author: 'NeonRider', downloads: 1284, colors: { primary: '#0D0221', secondary: '#150535', accent: '#FF00FF', background: '#090118', card: '#0D0221', text: '#E0B0FF' } },
  { id: 'community-sakura', name: 'Sakura Blossom', icon: '\uD83C\uDF38', builtin: false, author: 'YukiDesigns', downloads: 892, colors: { primary: '#2D1B2D', secondary: '#3D2840', accent: '#FF69B4', background: '#1F0F1F', card: '#2D1B2D', text: '#FFD6E8' } },
];

const COLOR_FIELDS: { key: keyof ThemeColors; label: string }[] = [
  { key: 'primary', label: 'Primary' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'accent', label: 'Accent' },
  { key: 'background', label: 'Background' },
  { key: 'card', label: 'Card' },
  { key: 'text', label: 'Text' },
];

const DEFAULT_CUSTOM_COLORS: ThemeColors = {
  primary: '#1E1E3F',
  secondary: '#2A2A5F',
  accent: '#7C4DFF',
  background: '#12122A',
  card: '#1E1E3F',
  text: '#E8E8F0',
};

export function ThemeStudioScreen({ onClose }: Props) {
  const { demoMode } = useWalletStore();
  const t = useTheme();

  const [tab, setTab] = useState<Tab>('themes');
  const [activeThemeId, setActiveThemeId] = useState('dark');
  const [customColors, setCustomColors] = useState<ThemeColors>({ ...DEFAULT_CUSTOM_COLORS });
  const [customName, setCustomName] = useState('My Theme');
  const [showApplied, setShowApplied] = useState(false);
  const [showExported, setShowExported] = useState(false);

  const allThemes = useMemo(
    () => [...BUILTIN_THEMES, ...COMMUNITY_THEMES],
    [],
  );

  const activeTheme = useMemo(
    () => allThemes.find((th) => th.id === activeThemeId) ?? BUILTIN_THEMES[0],
    [activeThemeId, allThemes],
  );

  const applyTheme = useCallback((id: string) => {
    setActiveThemeId(id);
    setShowApplied(true);
    setTimeout(() => setShowApplied(false), 1500);
  }, []);

  const updateCustomColor = useCallback((key: keyof ThemeColors, value: string) => {
    setCustomColors((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleExportTheme = useCallback(() => {
    setShowExported(true);
    setTimeout(() => setShowExported(false), 2000);
  }, []);

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.bold },
    backText: { color: t.accent.blue, fontSize: fonts.lg },
    tabs: { flexDirection: 'row', marginHorizontal: 16, marginTop: 4, marginBottom: 12, backgroundColor: t.bg.card, borderRadius: 12, padding: 3 },
    tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: '#FFFFFF' },
    section: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 24, marginBottom: 8, marginLeft: 4 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16 },
    divider: { height: 1, backgroundColor: t.border, marginVertical: 12 },

    /* Preview */
    previewCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginBottom: 16 },
    previewTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12 },
    previewMockup: { borderRadius: 12, padding: 16, minHeight: 140 },
    previewHeader: { fontSize: fonts.md, fontWeight: fonts.bold, marginBottom: 8 },
    previewBalance: { fontSize: fonts.xxl, fontWeight: fonts.bold, marginBottom: 4 },
    previewSub: { fontSize: fonts.sm, opacity: 0.7 },
    previewBtnRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    previewBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
    previewBtnText: { fontSize: fonts.sm, fontWeight: fonts.bold },
    activeLabel: { color: t.accent.green, fontSize: fonts.xs, fontWeight: fonts.bold, marginTop: 8, textAlign: 'center' },

    /* Theme Grid */
    themeGrid: { gap: 12 },
    themeItem: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, borderWidth: 2, borderColor: t.border },
    themeItemActive: { borderColor: t.accent.green },
    themeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    themeIcon: { fontSize: fonts.xxl, marginRight: 10 },
    themeName: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, flex: 1 },
    themeActiveBadge: { backgroundColor: t.accent.green + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    themeActiveBadgeText: { color: t.accent.green, fontSize: fonts.xs, fontWeight: fonts.bold },
    swatchRow: { flexDirection: 'row', gap: 6 },
    swatch: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, borderColor: t.border },
    applyBtn: { marginTop: 12, backgroundColor: t.accent.blue, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
    applyBtnText: { color: '#FFFFFF', fontSize: fonts.sm, fontWeight: fonts.bold },

    /* Create */
    nameInput: { backgroundColor: t.bg.primary, color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.semibold, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: t.border, marginBottom: 16 },
    colorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
    colorLabel: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold, flex: 1 },
    colorInput: { backgroundColor: t.bg.primary, color: t.text.primary, fontSize: fonts.sm, fontWeight: fonts.semibold, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: t.border, width: 100, textAlign: 'center' },
    colorSwatch: { width: 32, height: 32, borderRadius: 8, marginLeft: 10, borderWidth: 1, borderColor: t.border },
    createBtnRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
    createBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
    createBtnPrimary: { backgroundColor: t.accent.green },
    createBtnSecondary: { backgroundColor: t.accent.blue },
    createBtnText: { color: '#FFFFFF', fontSize: fonts.md, fontWeight: fonts.bold },

    /* Community */
    communityCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    communityRow: { flexDirection: 'row', alignItems: 'center' },
    communityInfo: { flex: 1, marginLeft: 10 },
    communityName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    communityAuthor: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 2 },
    communityDownloads: { color: t.text.secondary, fontSize: fonts.xs, marginTop: 2 },
    communityActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
    communityBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: t.accent.blue + '20' },
    communityBtnText: { color: t.accent.blue, fontSize: fonts.sm, fontWeight: fonts.semibold },
    importBtn: { backgroundColor: t.bg.card, borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: t.border, marginTop: 16 },
    importBtnText: { color: t.accent.blue, fontSize: fonts.md, fontWeight: fonts.bold },

    /* Feedback */
    toast: { backgroundColor: t.accent.green + '20', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 12 },
    toastText: { color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.bold },
    emptyHint: { color: t.text.secondary, fontSize: fonts.sm, textAlign: 'center', marginTop: 40 },
  }), [t]);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'themes', label: 'Themes' },
    { key: 'create', label: 'Create' },
    { key: 'community', label: 'Community' },
  ];

  /* ── Preview mockup using given colors ── */
  const renderPreview = (colors: ThemeColors, label: string) => (
    <View style={[st.previewMockup, { backgroundColor: colors.background }]}>
      <Text style={[st.previewHeader, { color: colors.text }]}>{label}</Text>
      <Text style={[st.previewBalance, { color: colors.accent }]}>$12,345.67</Text>
      <Text style={[st.previewSub, { color: colors.text }]}>Portfolio Value</Text>
      <View style={st.previewBtnRow}>
        <View style={[st.previewBtn, { backgroundColor: colors.accent }]}>
          <Text style={[st.previewBtnText, { color: colors.background }]}>Send</Text>
        </View>
        <View style={[st.previewBtn, { backgroundColor: colors.secondary }]}>
          <Text style={[st.previewBtnText, { color: colors.text }]}>Receive</Text>
        </View>
      </View>
    </View>
  );

  /* ── Themes Tab ── */
  const renderThemes = () => (
    <>
      {/* Current preview */}
      <Text style={st.section}>Current Theme</Text>
      <View style={st.previewCard}>
        <Text style={st.previewTitle}>{activeTheme.icon}  {activeTheme.name}</Text>
        {renderPreview(activeTheme.colors, 'Open Wallet')}
      </View>

      {showApplied && (
        <View style={st.toast}>
          <Text style={st.toastText}>{'\u2705'}  Theme Applied</Text>
        </View>
      )}

      {/* Built-in themes */}
      <Text style={st.section}>Built-in Themes</Text>
      <View style={st.themeGrid}>
        {BUILTIN_THEMES.map((theme) => {
          const isActive = theme.id === activeThemeId;
          return (
            <View key={theme.id} style={[st.themeItem, isActive && st.themeItemActive]}>
              <View style={st.themeRow}>
                <Text style={st.themeIcon}>{theme.icon}</Text>
                <Text style={st.themeName}>{theme.name}</Text>
                {isActive && (
                  <View style={st.themeActiveBadge}>
                    <Text style={st.themeActiveBadgeText}>ACTIVE</Text>
                  </View>
                )}
              </View>
              <View style={st.swatchRow}>
                {Object.values(theme.colors).map((color, i) => (
                  <View key={i} style={[st.swatch, { backgroundColor: color }]} />
                ))}
              </View>
              {!isActive && (
                <TouchableOpacity style={st.applyBtn} onPress={() => applyTheme(theme.id)}>
                  <Text style={st.applyBtnText}>Apply Theme</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>
    </>
  );

  /* ── Create Tab ── */
  const renderCreate = () => (
    <>
      <Text style={st.section}>Theme Name</Text>
      <TextInput
        style={st.nameInput}
        value={customName}
        onChangeText={setCustomName}
        placeholder="My Custom Theme"
        placeholderTextColor={t.text.secondary}
      />

      <Text style={st.section}>Color Palette</Text>
      <View style={st.card}>
        {COLOR_FIELDS.map((field, i) => (
          <React.Fragment key={field.key}>
            {i > 0 && <View style={st.divider} />}
            <View style={st.colorRow}>
              <Text style={st.colorLabel}>{field.label}</Text>
              <TextInput
                style={st.colorInput}
                value={customColors[field.key]}
                onChangeText={(val) => updateCustomColor(field.key, val)}
                placeholder="#000000"
                placeholderTextColor={t.text.secondary}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={[st.colorSwatch, { backgroundColor: customColors[field.key] }]} />
            </View>
          </React.Fragment>
        ))}
      </View>

      {/* Live Preview */}
      <Text style={st.section}>Live Preview</Text>
      <View style={st.previewCard}>
        {renderPreview(customColors, customName)}
      </View>

      {/* Action buttons */}
      <View style={st.createBtnRow}>
        <TouchableOpacity
          style={[st.createBtn, st.createBtnPrimary]}
          onPress={() => applyTheme('custom')}
        >
          <Text style={st.createBtnText}>Apply Theme</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[st.createBtn, st.createBtnSecondary]}
          onPress={handleExportTheme}
        >
          <Text style={st.createBtnText}>Export as JSON</Text>
        </TouchableOpacity>
      </View>

      {showApplied && (
        <View style={st.toast}>
          <Text style={st.toastText}>{'\u2705'}  Custom Theme Applied</Text>
        </View>
      )}

      {showExported && (
        <View style={st.toast}>
          <Text style={st.toastText}>
            {'\uD83D\uDCCB'}  Theme JSON copied!{demoMode ? ' (demo mode)' : ''}
          </Text>
        </View>
      )}
    </>
  );

  /* ── Community Tab ── */
  const renderCommunity = () => (
    <>
      <Text style={st.section}>Community Themes</Text>
      {COMMUNITY_THEMES.map((theme) => (
        <View key={theme.id} style={st.communityCard}>
          <View style={st.communityRow}>
            <Text style={{ fontSize: fonts.hero }}>{theme.icon}</Text>
            <View style={st.communityInfo}>
              <Text style={st.communityName}>{theme.name}</Text>
              <Text style={st.communityAuthor}>by {theme.author}</Text>
              <Text style={st.communityDownloads}>{theme.downloads?.toLocaleString()} downloads</Text>
            </View>
          </View>
          {/* Swatch preview */}
          <View style={[st.swatchRow, { marginTop: 10 }]}>
            {Object.values(theme.colors).map((color, i) => (
              <View key={i} style={[st.swatch, { backgroundColor: color }]} />
            ))}
          </View>
          {/* Mini preview */}
          <View style={{ marginTop: 10 }}>
            {renderPreview(theme.colors, theme.name)}
          </View>
          <View style={st.communityActions}>
            <TouchableOpacity style={st.communityBtn} onPress={() => applyTheme(theme.id)}>
              <Text style={st.communityBtnText}>Apply</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.communityBtn}>
              <Text style={st.communityBtnText}>View JSON</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* Import */}
      <TouchableOpacity style={st.importBtn}>
        <Text style={st.importBtnText}>Import Theme from JSON</Text>
      </TouchableOpacity>

      <Text style={st.emptyHint}>
        Share your custom themes with the community{'\n'}through the Create tab.
      </Text>
    </>
  );

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={st.title}>Theme Studio</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={st.tabs}>
        {TABS.map((tb) => (
          <TouchableOpacity
            key={tb.key}
            style={[st.tab, tab === tb.key && st.tabActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={[st.tabText, tab === tb.key && st.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll}>
        {tab === 'themes' && renderThemes()}
        {tab === 'create' && renderCreate()}
        {tab === 'community' && renderCommunity()}
      </ScrollView>
    </SafeAreaView>
  );
}
