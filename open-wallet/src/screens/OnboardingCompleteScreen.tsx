import { fonts } from '../utils/theme';
/**
 * Onboarding Complete Screen — Congratulations after persona onboarding.
 *
 * Shows a welcome message, personalized tips, quick feature tour,
 * and a "Start exploring" call-to-action based on the user's persona.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// --- Types ---

interface PersonaConfig {
  name: string;
  icon: string;
  greeting: string;
  tipOfDay: string;
  topFeatures: Feature[];
}

interface Feature {
  name: string;
  description: string;
  icon: string;
  screen: string;
}

interface Props {
  onClose: () => void;
}

// --- Demo data (Farmer persona) ---

const DEMO_PERSONA: PersonaConfig = {
  name: 'Farmer',
  icon: '\u{1F33E}',
  greeting: 'Welcome to Open Wallet, fellow steward of the land! Your journey toward sustainable farming, community cooperation, and economic dignity begins here.',
  tipOfDay: 'Did you know? You can earn OTK by sharing your harvest data with your local cooperative. This helps build a transparent food supply chain and rewards you for your contribution.',
  topFeatures: [
    {
      name: 'Cooperative Hub',
      description: 'Join or create farming cooperatives. Pool resources, share equipment, and trade directly with consumers — no middlemen.',
      icon: '\u{1F91D}',
      screen: 'Cooperative',
    },
    {
      name: 'Weather & Harvest Tracker',
      description: 'Log your planting cycles, weather conditions, and harvest yields. This data earns you OTK and helps your region plan better.',
      icon: '\u{1F327}',
      screen: 'HarvestTracker',
    },
    {
      name: 'Local Market',
      description: 'List your produce for sale, set fair prices, and accept OTK or local currency. Your buyers see your full farming history.',
      icon: '\u{1F34E}',
      screen: 'LocalMarket',
    },
    {
      name: 'Soil Health Dashboard',
      description: 'Track soil quality, water usage, and sustainability metrics. Earn environmental stewardship badges for regenerative practices.',
      icon: '\u{1F331}',
      screen: 'SoilHealth',
    },
    {
      name: 'Community Feed',
      description: 'Connect with other farmers in your region. Share tips, ask questions, and celebrate harvests together.',
      icon: '\u{1F4AC}',
      screen: 'CommunityFeed',
    },
  ],
};

const ALL_PERSONAS: { name: string; icon: string }[] = [
  { name: 'Farmer', icon: '\u{1F33E}' },
  { name: 'Teacher', icon: '\u{1F4DA}' },
  { name: 'Healthcare Worker', icon: '\u{1F3E5}' },
  { name: 'Artisan', icon: '\u{1F3A8}' },
  { name: 'Elder', icon: '\u{1F9D3}' },
  { name: 'Student', icon: '\u{1F393}' },
  { name: 'Community Leader', icon: '\u{1F3DB}' },
  { name: 'Parent', icon: '\u{1F476}' },
];

// --- Component ---

export function OnboardingCompleteScreen({ onClose }: Props) {
  const t = useTheme();
  const demoMode = useWalletStore((s) => s.demoMode);

  const [persona] = useState(DEMO_PERSONA);
  const [expandedFeature, setExpandedFeature] = useState<number | null>(null);
  const [tourStep, setTourStep] = useState(0);
  const [showTour, setShowTour] = useState(false);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    title: { fontSize: 18, fontWeight: fonts.bold, color: t.text.primary },
    closeBtn: { fontSize: 16, color: t.accent.green },
    scroll: { flex: 1 },
    heroSection: {
      padding: 24, alignItems: 'center', borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    heroIcon: { fontSize: 64, marginBottom: 12 },
    congratsText: {
      fontSize: 24, fontWeight: fonts.heavy, color: t.accent.green,
      textAlign: 'center', marginBottom: 8,
    },
    personaLabel: {
      fontSize: 16, fontWeight: fonts.semibold, color: t.text.primary,
      textAlign: 'center', marginBottom: 12,
    },
    greetingText: {
      fontSize: 14, color: t.text.secondary, textAlign: 'center',
      lineHeight: 22, paddingHorizontal: 8,
    },
    section: { padding: 16, borderBottomWidth: 1, borderBottomColor: t.border },
    sectionTitle: { fontSize: 16, fontWeight: fonts.semibold, color: t.text.primary, marginBottom: 10 },
    tipBox: {
      backgroundColor: '#f0fdf4', borderRadius: 12, padding: 16,
      borderWidth: 1, borderColor: '#bbf7d0',
    },
    tipLabel: { fontSize: 12, fontWeight: fonts.bold, color: '#16a34a', marginBottom: 6 },
    tipText: { fontSize: 14, color: '#166534', lineHeight: 22 },
    featureCard: {
      backgroundColor: t.bg.card, borderRadius: 12, padding: 14,
      marginBottom: 10, borderWidth: 1, borderColor: t.border,
    },
    featureHeader: {
      flexDirection: 'row', alignItems: 'center',
    },
    featureIcon: { fontSize: 28, marginRight: 12 },
    featureName: { fontSize: 15, fontWeight: fonts.semibold, color: t.text.primary },
    featureScreen: { fontSize: 11, color: t.text.secondary },
    featureDesc: {
      fontSize: 13, color: t.text.secondary, lineHeight: 20,
      marginTop: 8, paddingLeft: 40,
    },
    stepIndicator: {
      flexDirection: 'row', justifyContent: 'center', marginBottom: 12,
    },
    stepDot: {
      width: 8, height: 8, borderRadius: 4, marginHorizontal: 4,
    },
    tourCard: {
      backgroundColor: t.bg.card, borderRadius: 16, padding: 20,
      borderWidth: 2, borderColor: t.accent.green, alignItems: 'center',
    },
    tourIcon: { fontSize: 48, marginBottom: 10 },
    tourTitle: { fontSize: 18, fontWeight: fonts.bold, color: t.text.primary, marginBottom: 6 },
    tourDesc: {
      fontSize: 14, color: t.text.secondary, textAlign: 'center',
      lineHeight: 22, marginBottom: 16,
    },
    tourNav: {
      flexDirection: 'row', justifyContent: 'space-between', width: '100%',
    },
    tourBtn: {
      paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8,
    },
    tourBtnText: { fontSize: 14, fontWeight: fonts.semibold, color: t.accent.green },
    startButton: {
      backgroundColor: t.accent.green, borderRadius: 14, paddingVertical: 16,
      alignItems: 'center', marginHorizontal: 16, marginVertical: 16,
    },
    startButtonText: { color: '#fff', fontWeight: fonts.bold, fontSize: 18 },
    personaGrid: {
      flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    },
    personaChip: {
      paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
      backgroundColor: t.bg.card, margin: 4, borderWidth: 1,
      borderColor: t.border, alignItems: 'center',
    },
    personaChipActive: { borderColor: t.accent.green, borderWidth: 2 },
    personaChipText: { fontSize: 12, color: t.text.primary, marginTop: 2 },
    label: { fontSize: 13, color: t.text.secondary },
    infoText: { fontSize: 13, color: t.text.secondary, lineHeight: 20 },
  }), [t]);

  const currentTourFeature = persona.topFeatures[tourStep];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome!</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll}>
        {/* Hero */}
        <View style={styles.heroSection}>
          <Text style={styles.heroIcon}>{persona.icon}</Text>
          <Text style={styles.congratsText}>Congratulations!</Text>
          <Text style={styles.personaLabel}>
            Your persona: {persona.name}
          </Text>
          <Text style={styles.greetingText}>{persona.greeting}</Text>
        </View>

        {/* Tip of the Day */}
        <View style={styles.section}>
          <View style={styles.tipBox}>
            <Text style={styles.tipLabel}>TIP OF THE DAY</Text>
            <Text style={styles.tipText}>{persona.tipOfDay}</Text>
          </View>
        </View>

        {/* Quick Tour */}
        {!showTour ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Top 5 Features for {persona.name}s
            </Text>
            {persona.topFeatures.map((f, i) => (
              <TouchableOpacity
                key={i}
                style={styles.featureCard}
                onPress={() => setExpandedFeature(expandedFeature === i ? null : i)}
              >
                <View style={styles.featureHeader}>
                  <Text style={styles.featureIcon}>{f.icon}</Text>
                  <View>
                    <Text style={styles.featureName}>{f.name}</Text>
                    <Text style={styles.featureScreen}>{f.screen}</Text>
                  </View>
                </View>
                {expandedFeature === i && (
                  <Text style={styles.featureDesc}>{f.description}</Text>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: t.bg.card, borderWidth: 1, borderColor: t.accent.green }]}
              onPress={() => setShowTour(true)}
            >
              <Text style={[styles.startButtonText, { color: t.accent.green, fontSize: 15 }]}>
                Take Guided Tour
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Guided Tour</Text>
            <View style={styles.stepIndicator}>
              {persona.topFeatures.map((_, i) => (
                <View key={i} style={[styles.stepDot, {
                  backgroundColor: i === tourStep ? t.accent.green : t.border,
                }]} />
              ))}
            </View>
            <View style={styles.tourCard}>
              <Text style={styles.tourIcon}>{currentTourFeature.icon}</Text>
              <Text style={styles.tourTitle}>{currentTourFeature.name}</Text>
              <Text style={styles.tourDesc}>{currentTourFeature.description}</Text>
              <View style={styles.tourNav}>
                <TouchableOpacity
                  style={styles.tourBtn}
                  onPress={() => setTourStep(Math.max(0, tourStep - 1))}
                  disabled={tourStep === 0}
                >
                  <Text style={[styles.tourBtnText, tourStep === 0 && { opacity: 0.3 }]}>
                    Previous
                  </Text>
                </TouchableOpacity>
                <Text style={styles.label}>{tourStep + 1} / {persona.topFeatures.length}</Text>
                <TouchableOpacity
                  style={styles.tourBtn}
                  onPress={() => {
                    if (tourStep < persona.topFeatures.length - 1) {
                      setTourStep(tourStep + 1);
                    } else {
                      setShowTour(false);
                    }
                  }}
                >
                  <Text style={styles.tourBtnText}>
                    {tourStep === persona.topFeatures.length - 1 ? 'Done' : 'Next'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Available Personas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Personas</Text>
          <View style={styles.personaGrid}>
            {ALL_PERSONAS.map((p, i) => (
              <View key={i} style={[styles.personaChip,
                p.name === persona.name && styles.personaChipActive]}>
                <Text style={{ fontSize: 20 }}>{p.icon}</Text>
                <Text style={styles.personaChipText}>{p.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Start Button */}
        <TouchableOpacity style={styles.startButton} onPress={onClose}>
          <Text style={styles.startButtonText}>Start Exploring</Text>
        </TouchableOpacity>

        {demoMode && (
          <View style={[styles.section, { borderBottomWidth: 0, paddingBottom: 32 }]}>
            <Text style={styles.infoText}>
              Demo Mode: Showing the Farmer persona. Your actual persona is
              determined during onboarding based on your profile and interests.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
