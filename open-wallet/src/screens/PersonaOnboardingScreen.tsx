import { fonts } from '../utils/theme';
/**
 * Persona Onboarding Screen — Art IX
 *
 * Tailors the first-run experience based on who you are.
 * Five-step wizard: Persona > Interests > Region > Language > Ready.
 *
 * "Every human is unique — their gateway to the chain should be too."
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Dimensions,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

// ─── Persona Definitions ───

interface PersonaDef {
  key: string;
  label: string;
  icon: string;
  focus: string;
  shortcuts: string[];
}

const PERSONAS: PersonaDef[] = [
  { key: 'parent', label: 'Parent / Guardian', icon: '\u{1F46A}', focus: 'Family, parenting, childcare, education',
    shortcuts: ['FamilyTree', 'ParentingJourney', 'EducationHub', 'Wellness', 'Mentorship', 'CommunityBoard', 'Volunteer', 'GratitudeWall', 'SkillCert', 'Governance'] },
  { key: 'farmer', label: 'Farmer / Producer', icon: '\u{1F33E}', focus: 'Agriculture, permaculture, farm-to-table, weather',
    shortcuts: ['Marketplace', 'CommunityBoard', 'Wellness', 'Volunteer', 'SkillCert', 'EducationHub', 'Treasury', 'CoopBoard', 'Governance', 'GlobalImpact'] },
  { key: 'student', label: 'Student / Learner', icon: '\u{1F393}', focus: 'Education, STEM, library, tutoring, skills',
    shortcuts: ['EducationHub', 'SkillCert', 'Mentorship', 'CommunityBoard', 'Volunteer', 'DebateClub', 'Tutorial', 'Achievements', 'GratitudeWall', 'GlobalImpact'] },
  { key: 'elder', label: 'Elder / Retiree', icon: '\u{1F9D3}', focus: 'Wellness, elder wisdom, senior activities, legacy',
    shortcuts: ['Wellness', 'Mentorship', 'GratitudeWall', 'CommunityBoard', 'Volunteer', 'FamilyTree', 'ConstitutionReader', 'Governance', 'GlobalImpact', 'LegacyJournal'] },
  { key: 'teen', label: 'Teen', icon: '\u{1F9D1}', focus: 'Teen space, challenges, safety, youth council',
    shortcuts: ['EducationHub', 'SkillCert', 'Achievements', 'CommunityBoard', 'Volunteer', 'Mentorship', 'DebateClub', 'Tutorial', 'Wellness', 'GratitudeWall'] },
  { key: 'leader', label: 'Community Leader', icon: '\u{1F3DB}\uFE0F', focus: 'Governance, budgets, events, projects',
    shortcuts: ['Governance', 'Treasury', 'CommunityBoard', 'CommunityHealth', 'Volunteer', 'GlobalImpact', 'MyImpact', 'ConstitutionReader', 'DAO', 'Delegation'] },
  { key: 'health', label: 'Health Worker', icon: '\u{1FA7A}', focus: 'Health, first aid, emergency, maternal care',
    shortcuts: ['Wellness', 'CommunityBoard', 'Volunteer', 'SkillCert', 'EducationHub', 'Mentorship', 'Governance', 'GlobalImpact', 'GratitudeWall', 'Treasury'] },
  { key: 'entrepreneur', label: 'Entrepreneur', icon: '\u{1F4BC}', focus: 'Jobs, marketplace, innovation, co-working',
    shortcuts: ['Marketplace', 'Treasury', 'SkillCert', 'CommunityBoard', 'Governance', 'Mentorship', 'Achievements', 'Volunteer', 'GlobalImpact', 'DeFi'] },
  { key: 'artist', label: 'Artist / Creator', icon: '\u{1F3A8}', focus: 'Art, music, dance, poetry, film, cooking',
    shortcuts: ['CommunityBoard', 'Marketplace', 'SkillCert', 'Achievements', 'Mentorship', 'Volunteer', 'GratitudeWall', 'NFTGallery', 'GlobalImpact', 'EducationHub'] },
  { key: 'newcomer', label: 'Newcomer', icon: '\u{1F30D}', focus: 'Immigration support, language, community map, buddy',
    shortcuts: ['CommunityBoard', 'Mentorship', 'EducationHub', 'Volunteer', 'Wellness', 'SkillCert', 'Tutorial', 'GratitudeWall', 'ConstitutionReader', 'Governance'] },
];

// ─── Interest Options ───

const INTERESTS = [
  'Education', 'Health & Wellness', 'Agriculture', 'Environment',
  'Arts & Culture', 'Technology', 'Governance', 'Family',
  'Finance', 'Community Service', 'Youth Development', 'Elder Care',
  'Food & Nutrition', 'Housing', 'Safety', 'Sports & Fitness',
  'Spirituality', 'Innovation', 'Trade & Commerce', 'Human Rights',
];

// ─── Regions ───

const REGIONS = [
  { key: 'africa', label: 'Africa' },
  { key: 'asia', label: 'Asia' },
  { key: 'europe', label: 'Europe' },
  { key: 'north_america', label: 'North America' },
  { key: 'south_america', label: 'South America' },
  { key: 'oceania', label: 'Oceania' },
  { key: 'middle_east', label: 'Middle East' },
  { key: 'central_america', label: 'Central America & Caribbean' },
];

// ─── Languages ───

const LANGUAGES = [
  { key: 'en', label: 'English' },
  { key: 'es', label: 'Espa\u00F1ol' },
  { key: 'fr', label: 'Fran\u00E7ais' },
  { key: 'zh', label: '\u4E2D\u6587' },
  { key: 'hi', label: '\u0939\u093F\u0928\u094D\u0926\u0940' },
  { key: 'ar', label: '\u0627\u0644\u0639\u0631\u0628\u064A\u0629' },
  { key: 'pt', label: 'Portugu\u00EAs' },
  { key: 'sw', label: 'Kiswahili' },
  { key: 'bn', label: '\u09AC\u09BE\u0982\u09B2\u09BE' },
  { key: 'ru', label: '\u0420\u0443\u0441\u0441\u043A\u0438\u0439' },
];

const TOTAL_STEPS = 5;
const { width: SCREEN_W } = Dimensions.get('window');

export function PersonaOnboardingScreen({ onClose }: Props) {
  const [step, setStep] = useState(1);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');

  const { demoMode, setPersona, setPersonaInterests, setPersonaRegion, setPersonaLanguage, setPersonaShortcuts } = useWalletStore();
  const t = useTheme();

  // ─── Derived ───

  const personaDef = useMemo(() => PERSONAS.find((p) => p.key === selectedPersona), [selectedPersona]);

  const canNext = useMemo(() => {
    switch (step) {
      case 1: return selectedPersona !== null;
      case 2: return selectedInterests.length >= 1 && selectedInterests.length <= 3;
      case 3: return selectedRegion !== null;
      case 4: return selectedLanguage !== null;
      case 5: return true;
      default: return false;
    }
  }, [step, selectedPersona, selectedInterests, selectedRegion, selectedLanguage]);

  // ─── Actions ───

  const toggleInterest = useCallback((interest: string) => {
    setSelectedInterests((prev) => {
      if (prev.includes(interest)) return prev.filter((i) => i !== interest);
      if (prev.length >= 3) return prev;
      return [...prev, interest];
    });
  }, []);

  const handleNext = useCallback(() => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      // Finalize — save to store
      setPersona(selectedPersona);
      setPersonaInterests(selectedInterests);
      setPersonaRegion(selectedRegion);
      setPersonaLanguage(selectedLanguage);
      if (personaDef) setPersonaShortcuts(personaDef.shortcuts);
      onClose();
    }
  }, [step, selectedPersona, selectedInterests, selectedRegion, selectedLanguage, personaDef, setPersona, setPersonaInterests, setPersonaRegion, setPersonaLanguage, setPersonaShortcuts, onClose]);

  const handleBack = useCallback(() => {
    if (step > 1) setStep(step - 1);
  }, [step]);

  // ─── Styles ───

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.bg.primary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    backBtn: {
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    backText: {
      color: t.accent.green,
      fontSize: 16,
      fontWeight: fonts.semibold,
    },
    skipBtn: {
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    skipText: {
      color: t.text.muted,
      fontSize: 14,
    },
    progressRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      paddingBottom: 16,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: t.bg.card,
    },
    dotActive: {
      backgroundColor: t.accent.green,
    },
    dotDone: {
      backgroundColor: t.accent.green,
      opacity: 0.5,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 120,
    },
    stepTitle: {
      color: t.text.primary,
      fontSize: 26,
      fontWeight: fonts.heavy,
      textAlign: 'center',
      marginBottom: 4,
    },
    stepSubtitle: {
      color: t.text.secondary,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 24,
    },
    personaCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.bg.secondary,
      borderRadius: 14,
      padding: 16,
      marginBottom: 10,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    personaCardSelected: {
      borderColor: t.accent.green,
      backgroundColor: t.bg.card,
    },
    personaIcon: {
      fontSize: 32,
      marginRight: 14,
    },
    personaLabel: {
      color: t.text.primary,
      fontSize: 16,
      fontWeight: fonts.bold,
    },
    personaFocus: {
      color: t.text.muted,
      fontSize: 12,
      marginTop: 2,
    },
    interestGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      justifyContent: 'center',
    },
    interestChip: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: t.bg.secondary,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    interestChipSelected: {
      borderColor: t.accent.green,
      backgroundColor: t.bg.card,
    },
    interestText: {
      color: t.text.secondary,
      fontSize: 14,
      fontWeight: fonts.semibold,
    },
    interestTextSelected: {
      color: t.accent.green,
    },
    optionRow: {
      backgroundColor: t.bg.secondary,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    optionRowSelected: {
      borderColor: t.accent.green,
      backgroundColor: t.bg.card,
    },
    optionLabel: {
      color: t.text.primary,
      fontSize: 16,
      fontWeight: fonts.semibold,
    },
    readyTitle: {
      color: t.accent.green,
      fontSize: 32,
      fontWeight: fonts.heavy,
      textAlign: 'center',
      marginBottom: 8,
    },
    readySummary: {
      color: t.text.secondary,
      fontSize: 15,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 22,
    },
    shortcutGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      justifyContent: 'center',
    },
    shortcutTile: {
      width: (SCREEN_W - 70) / 3,
      backgroundColor: t.bg.secondary,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 8,
      alignItems: 'center',
    },
    shortcutLabel: {
      color: t.text.primary,
      fontSize: 12,
      fontWeight: fonts.semibold,
      textAlign: 'center',
      marginTop: 4,
    },
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 20,
      paddingBottom: 36,
      paddingTop: 12,
      backgroundColor: t.bg.primary,
    },
    nextBtn: {
      backgroundColor: t.accent.green,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
    },
    nextBtnDisabled: {
      opacity: 0.4,
    },
    nextText: {
      color: '#000',
      fontSize: 17,
      fontWeight: fonts.heavy,
    },
    demoTag: {
      color: t.accent.yellow,
      fontSize: 11,
      fontWeight: fonts.bold,
      textAlign: 'center',
      marginBottom: 8,
    },
  }), [t]);

  // ─── Step Renderers ───

  const renderPersonaStep = () => (
    <>
      <Text style={styles.stepTitle}>Who are you?</Text>
      <Text style={styles.stepSubtitle}>Choose the role that best describes you</Text>
      {PERSONAS.map((p) => (
        <TouchableOpacity
          key={p.key}
          style={[styles.personaCard, selectedPersona === p.key && styles.personaCardSelected]}
          onPress={() => setSelectedPersona(p.key)}
          activeOpacity={0.7}
        >
          <Text style={styles.personaIcon}>{p.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.personaLabel}>{p.label}</Text>
            <Text style={styles.personaFocus}>{p.focus}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </>
  );

  const renderInterestsStep = () => (
    <>
      <Text style={styles.stepTitle}>What matters most?</Text>
      <Text style={styles.stepSubtitle}>
        Select up to 3 interests ({selectedInterests.length}/3)
      </Text>
      <View style={styles.interestGrid}>
        {INTERESTS.map((interest) => {
          const selected = selectedInterests.includes(interest);
          return (
            <TouchableOpacity
              key={interest}
              style={[styles.interestChip, selected && styles.interestChipSelected]}
              onPress={() => toggleInterest(interest)}
              activeOpacity={0.7}
            >
              <Text style={[styles.interestText, selected && styles.interestTextSelected]}>
                {interest}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );

  const renderRegionStep = () => (
    <>
      <Text style={styles.stepTitle}>Your region</Text>
      <Text style={styles.stepSubtitle}>We'll tailor content for your area</Text>
      {REGIONS.map((r) => (
        <TouchableOpacity
          key={r.key}
          style={[styles.optionRow, selectedRegion === r.key && styles.optionRowSelected]}
          onPress={() => setSelectedRegion(r.key)}
          activeOpacity={0.7}
        >
          <Text style={styles.optionLabel}>{r.label}</Text>
        </TouchableOpacity>
      ))}
    </>
  );

  const renderLanguageStep = () => (
    <>
      <Text style={styles.stepTitle}>Your language</Text>
      <Text style={styles.stepSubtitle}>Choose your preferred language</Text>
      {LANGUAGES.map((lang) => (
        <TouchableOpacity
          key={lang.key}
          style={[styles.optionRow, selectedLanguage === lang.key && styles.optionRowSelected]}
          onPress={() => setSelectedLanguage(lang.key)}
          activeOpacity={0.7}
        >
          <Text style={styles.optionLabel}>{lang.label}</Text>
        </TouchableOpacity>
      ))}
    </>
  );

  const renderReadyStep = () => (
    <>
      <Text style={styles.readyTitle}>Ready!</Text>
      <Text style={styles.readySummary}>
        Welcome, {personaDef?.label ?? 'friend'}.{'\n'}
        Your home has been personalized with quick-access tiles{'\n'}
        based on your role and interests.
      </Text>
      <Text style={[styles.stepSubtitle, { marginBottom: 16 }]}>Your home shortcuts</Text>
      <View style={styles.shortcutGrid}>
        {(personaDef?.shortcuts ?? []).map((name) => (
          <View key={name} style={styles.shortcutTile}>
            <Text style={styles.shortcutLabel}>{formatShortcutName(name)}</Text>
          </View>
        ))}
      </View>
    </>
  );

  // ─── Render ───

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {step > 1 ? (
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
        <TouchableOpacity style={styles.skipBtn} onPress={onClose}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Progress dots */}
      <View style={styles.progressRow}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => {
          const idx = i + 1;
          return (
            <View
              key={idx}
              style={[
                styles.dot,
                idx === step && styles.dotActive,
                idx < step && styles.dotDone,
              ]}
            />
          );
        })}
      </View>

      {demoMode && <Text style={styles.demoTag}>DEMO MODE</Text>}

      {/* Content */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {step === 1 && renderPersonaStep()}
        {step === 2 && renderInterestsStep()}
        {step === 3 && renderRegionStep()}
        {step === 4 && renderLanguageStep()}
        {step === 5 && renderReadyStep()}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, !canNext && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={!canNext}
          activeOpacity={0.7}
        >
          <Text style={styles.nextText}>
            {step === TOTAL_STEPS ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Helpers ───

function formatShortcutName(name: string): string {
  // CamelCase -> spaced: "FamilyTree" -> "Family Tree"
  return name.replace(/([a-z])([A-Z])/g, '$1 $2');
}
