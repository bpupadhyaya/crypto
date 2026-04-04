import { fonts } from '../utils/theme';
/**
 * App Info Screen — About the app, credits, licenses, and stats.
 *
 * Displays version info, open source license, project statistics,
 * contributors, technology stack, links, and the mission statement
 * from The Human Constitution preamble.
 */

import React, { useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Linking,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// --- Types ---

interface LinkItem {
  label: string;
  url: string;
  icon: string;
}

interface StatItem {
  label: string;
  value: string;
}

interface Contributor {
  name: string;
  role: string;
}

interface Props {
  onClose: () => void;
}

// --- Static data ---

const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '2026.03.29.001';
const LAST_UPDATED = '2026-03-29';
const LICENSE = 'MIT License';

const PROJECT_STATS: StatItem[] = [
  { label: 'Screens', value: '275+' },
  { label: 'Chain Modules', value: '5 (BTC, ETH, SOL, ATOM, OTK)' },
  { label: 'API Endpoints', value: '48' },
  { label: 'Languages', value: 'TypeScript, Go, Rust' },
  { label: 'Lines of Code', value: '~120,000' },
];

const TECH_STACK: StatItem[] = [
  { label: 'Frontend', value: 'React Native + TypeScript' },
  { label: 'Blockchain', value: 'Cosmos SDK + CometBFT' },
  { label: 'Consensus', value: 'Proof of Humanity + Proof of Contribution' },
  { label: 'Cryptography', value: 'PQC (Post-Quantum)' },
  { label: 'Smart Contracts', value: 'CosmWasm' },
  { label: 'State Management', value: 'Zustand' },
  { label: 'Backend Language', value: 'Go' },
];

const CONTRIBUTORS: Contributor[] = [
  { name: 'Bhim Upadhyaya', role: 'Creator & Lead Developer' },
  { name: 'Open Chain Community', role: 'Contributors & Validators' },
  { name: 'The Human Constitution', role: 'Governance Framework' },
];

const LINKS: LinkItem[] = [
  { label: 'GitHub Repository', url: 'https://github.com/open-chain', icon: '\u{1F4BB}' },
  { label: 'The Human Constitution', url: 'https://humanconstitution.org', icon: '\u{1F4DC}' },
  { label: 'Project Website', url: 'https://openchain.org', icon: '\u{1F310}' },
  { label: 'Support & Feedback', url: 'https://openchain.org/support', icon: '\u{1F4E9}' },
];

const MISSION_STATEMENT = `We, the people of Earth, recognizing the inherent dignity and equal worth of every human being, establish this Constitution to ensure that the fruits of technological progress serve all of humanity.

We hold that every person has the right to the basic necessities of life — food, shelter, health, education, and opportunity — and that technology must be wielded as a tool for universal upliftment, not concentrated power.

Open Chain exists to model, measure, and reward the creation of human value — from nurturing a child to teaching a student, from healing the sick to building community. Every act of genuine contribution deserves recognition, and no person's labor of love should go unvalued.

Our mission: Maintaining and improving human life at near-zero cost.`;

// --- Component ---

export function AppInfoScreen({ onClose }: Props) {
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    back: { color: t.accent.blue, fontSize: fonts.lg, fontWeight: fonts.semibold },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    placeholder: { width: 50 },
    scroll: { paddingHorizontal: 16, paddingBottom: 40 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginTop: 20, marginBottom: 10 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    appIcon: { fontSize: 48, textAlign: 'center' },
    appName: { color: t.text.primary, fontSize: fonts.xxl, fontWeight: fonts.heavy, textAlign: 'center', marginTop: 8 },
    appTagline: { color: t.text.secondary, fontSize: fonts.md, textAlign: 'center', marginTop: 4 },
    versionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: t.border },
    versionLabel: { color: t.text.secondary, fontSize: fonts.md },
    versionValue: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    licenseBox: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, marginTop: 8 },
    licenseTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    licenseText: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 6, lineHeight: 18 },
    statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.border },
    statLabel: { color: t.text.secondary, fontSize: fonts.md, flex: 1 },
    statValue: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold, flex: 1, textAlign: 'right' },
    contributorRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.border },
    contributorName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    contributorRole: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    linkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.border, gap: 12 },
    linkIcon: { fontSize: fonts.xl },
    linkLabel: { color: t.accent.blue, fontSize: fonts.md, fontWeight: fonts.semibold, flex: 1 },
    linkArrow: { color: t.text.muted, fontSize: fonts.lg },
    missionText: { color: t.text.secondary, fontSize: fonts.md, lineHeight: 22 },
    missionQuote: { borderLeftWidth: 3, borderLeftColor: t.accent.blue, paddingLeft: 14 },
    demoNote: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', fontStyle: 'italic', marginTop: 20 },
  }), [t]);

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      // silently handle link failure
    });
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.back}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>About</Text>
        <View style={s.placeholder} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {/* --- App Identity --- */}
        <View style={[s.card, { alignItems: 'center', paddingVertical: 24 }]}>
          <Text style={s.appIcon}>{'\u26D3'}</Text>
          <Text style={s.appName}>Open Wallet</Text>
          <Text style={s.appTagline}>The wallet for The Human Constitution</Text>
        </View>

        {/* --- Version Info --- */}
        <Text style={s.sectionTitle}>Version Info</Text>
        <View style={s.card}>
          <View style={s.versionRow}>
            <Text style={s.versionLabel}>Version</Text>
            <Text style={s.versionValue}>{APP_VERSION}</Text>
          </View>
          <View style={s.versionRow}>
            <Text style={s.versionLabel}>Build</Text>
            <Text style={s.versionValue}>{BUILD_NUMBER}</Text>
          </View>
          <View style={[s.versionRow, { borderBottomWidth: 0 }]}>
            <Text style={s.versionLabel}>Last Updated</Text>
            <Text style={s.versionValue}>{LAST_UPDATED}</Text>
          </View>
        </View>

        {/* --- License --- */}
        <Text style={s.sectionTitle}>License</Text>
        <View style={s.card}>
          <View style={s.licenseBox}>
            <Text style={s.licenseTitle}>{LICENSE}</Text>
            <Text style={s.licenseText}>
              Copyright (c) 2026 Open Chain Project{'\n\n'}
              Permission is hereby granted, free of charge, to any person obtaining a copy
              of this software and associated documentation files, to deal in the Software
              without restriction, including without limitation the rights to use, copy,
              modify, merge, publish, distribute, sublicense, and/or sell copies of the
              Software, subject to the conditions of the MIT License.
            </Text>
          </View>
        </View>

        {/* --- Project Stats --- */}
        <Text style={s.sectionTitle}>Project Statistics</Text>
        <View style={s.card}>
          {PROJECT_STATS.map((stat, i) => (
            <View key={i} style={[s.statRow, i === PROJECT_STATS.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={s.statLabel}>{stat.label}</Text>
              <Text style={s.statValue}>{stat.value}</Text>
            </View>
          ))}
        </View>

        {/* --- Technology Stack --- */}
        <Text style={s.sectionTitle}>Technology Stack</Text>
        <View style={s.card}>
          {TECH_STACK.map((tech, i) => (
            <View key={i} style={[s.statRow, i === TECH_STACK.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={s.statLabel}>{tech.label}</Text>
              <Text style={s.statValue}>{tech.value}</Text>
            </View>
          ))}
        </View>

        {/* --- Contributors --- */}
        <Text style={s.sectionTitle}>Contributors & Credits</Text>
        <View style={s.card}>
          {CONTRIBUTORS.map((person, i) => (
            <View key={i} style={[s.contributorRow, i === CONTRIBUTORS.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={s.contributorName}>{person.name}</Text>
              <Text style={s.contributorRole}>{person.role}</Text>
            </View>
          ))}
        </View>

        {/* --- Links --- */}
        <Text style={s.sectionTitle}>Links</Text>
        <View style={s.card}>
          {LINKS.map((link, i) => (
            <TouchableOpacity
              key={i}
              style={[s.linkRow, i === LINKS.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => handleOpenLink(link.url)}
            >
              <Text style={s.linkIcon}>{link.icon}</Text>
              <Text style={s.linkLabel}>{link.label}</Text>
              <Text style={s.linkArrow}>{'\u203A'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* --- Mission Statement --- */}
        <Text style={s.sectionTitle}>Our Mission</Text>
        <View style={s.card}>
          <View style={s.missionQuote}>
            <Text style={s.missionText}>{MISSION_STATEMENT}</Text>
          </View>
        </View>

        {demoMode && (
          <Text style={s.demoNote}>Running in demo mode — connect a wallet for live data</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
