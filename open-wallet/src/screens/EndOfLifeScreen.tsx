import { fonts } from '../utils/theme';
/**
 * End of Life Screen — Advance directives, legacy planning, memorial wishes.
 *
 * Article I: "Every human being possesses inherent worth from birth to death."
 * Dignified end-of-life planning is a fundamental right — preferences stored
 * encrypted on-chain, disclosed only to designated UIDs.
 *
 * Features:
 * - Advance directive (medical wishes, DNR, organ donation, healthcare proxy UID)
 * - Legacy letter (personal message to loved ones, stored as encrypted on-chain hash)
 * - Memorial wishes (burial/cremation preference, ceremony type, music, readings)
 * - Digital estate plan (who inherits your UID, wallet, achievements)
 * - Guardian succession (who becomes guardian of your dependents)
 * - All stored encrypted, disclosed only to designated UIDs
 * - Demo mode with sample data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// ─── Types ───

type Tab = 'directives' | 'legacy' | 'memorial' | 'estate';

interface AdvanceDirective {
  id: string;
  type: 'medical_wishes' | 'dnr' | 'organ_donation' | 'healthcare_proxy';
  label: string;
  value: string;
  proxyUid?: string;
  lastUpdated: string;
  encrypted: boolean;
}

interface LegacyLetter {
  id: string;
  recipientUid: string;
  recipientName: string;
  subject: string;
  onChainHash: string;
  createdAt: string;
  lastEdited: string;
  encrypted: boolean;
}

interface MemorialWish {
  preference: 'burial' | 'cremation' | 'green_burial' | 'donation_to_science';
  ceremonyType: 'religious' | 'secular' | 'celebration_of_life' | 'private' | 'none';
  musicSelections: string[];
  readings: string[];
  specialRequests: string;
  locationPreference: string;
}

interface DigitalEstatePlan {
  walletInheritorUid: string;
  walletInheritorName: string;
  uidSuccessorUid: string;
  uidSuccessorName: string;
  achievementRecipientUid: string;
  achievementRecipientName: string;
}

interface GuardianSuccession {
  id: string;
  dependentName: string;
  dependentUid: string;
  guardianUid: string;
  guardianName: string;
  alternateGuardianUid: string;
  alternateGuardianName: string;
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_DIRECTIVES: AdvanceDirective[] = [
  {
    id: 'dir-1', type: 'medical_wishes', label: 'Medical Wishes',
    value: 'No extraordinary life-sustaining measures if prognosis is terminal with no reasonable chance of recovery.',
    lastUpdated: '2026-02-15', encrypted: true,
  },
  {
    id: 'dir-2', type: 'dnr', label: 'DNR Status',
    value: 'Do Not Resuscitate — signed and witnessed',
    lastUpdated: '2026-02-15', encrypted: true,
  },
  {
    id: 'dir-3', type: 'organ_donation', label: 'Organ Donation',
    value: 'Full organ and tissue donor — all viable organs',
    lastUpdated: '2026-01-10', encrypted: true,
  },
  {
    id: 'dir-4', type: 'healthcare_proxy', label: 'Healthcare Proxy',
    value: 'Designated healthcare decision-maker', proxyUid: 'UID-8472-ABCD',
    lastUpdated: '2026-02-15', encrypted: true,
  },
];

const DEMO_LETTERS: LegacyLetter[] = [
  {
    id: 'letter-1', recipientUid: 'UID-8472-ABCD', recipientName: 'Maya',
    subject: 'To my daughter — on living fully',
    onChainHash: '0x7f3a...c291', createdAt: '2026-01-20', lastEdited: '2026-03-10',
    encrypted: true,
  },
];

const DEMO_MEMORIAL: MemorialWish = {
  preference: 'green_burial',
  ceremonyType: 'celebration_of_life',
  musicSelections: ['Clair de Lune — Debussy', 'What a Wonderful World — Louis Armstrong'],
  readings: ['The Prophet — Kahlil Gibran (On Death)', 'Do Not Stand at My Grave and Weep — Mary Elizabeth Frye'],
  specialRequests: 'Plant a tree in my memory. No formal dress code.',
  locationPreference: 'Outdoors, near water if possible',
};

const DEMO_ESTATE: DigitalEstatePlan = {
  walletInheritorUid: 'UID-8472-ABCD', walletInheritorName: 'Maya',
  uidSuccessorUid: 'UID-8472-ABCD', uidSuccessorName: 'Maya',
  achievementRecipientUid: 'UID-9173-EFGH', achievementRecipientName: 'James',
};

const DEMO_GUARDIANS: GuardianSuccession[] = [
  {
    id: 'guard-1', dependentName: 'Leo', dependentUid: 'UID-1234-WXYZ',
    guardianUid: 'UID-9173-EFGH', guardianName: 'James',
    alternateGuardianUid: 'UID-5566-MNOP', alternateGuardianName: 'Sara',
  },
];

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'directives', label: 'Directives', icon: '\u{1F4CB}' },
  { key: 'legacy', label: 'Legacy', icon: '\u{1F48C}' },
  { key: 'memorial', label: 'Memorial', icon: '\u{1F56F}\uFE0F' },
  { key: 'estate', label: 'Estate', icon: '\u{1F3DB}\uFE0F' },
];

const DIRECTIVE_ICONS: Record<string, string> = {
  medical_wishes: '\u{1FA7A}',
  dnr: '\u{2764}\uFE0F\u{200D}\u{1FA79}',
  organ_donation: '\u{1FAC0}',
  healthcare_proxy: '\u{1F9D1}\u{200D}\u{2696}\uFE0F',
};

const PREFERENCE_LABELS: Record<string, string> = {
  burial: 'Traditional Burial',
  cremation: 'Cremation',
  green_burial: 'Green Burial',
  donation_to_science: 'Donation to Science',
};

const CEREMONY_LABELS: Record<string, string> = {
  religious: 'Religious Ceremony',
  secular: 'Secular Ceremony',
  celebration_of_life: 'Celebration of Life',
  private: 'Private Gathering',
  none: 'No Ceremony',
};

// ─── Component ───

export function EndOfLifeScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('directives');
  const [directives] = useState<AdvanceDirective[]>(DEMO_DIRECTIVES);
  const [letters] = useState<LegacyLetter[]>(DEMO_LETTERS);
  const [memorial] = useState<MemorialWish>(DEMO_MEMORIAL);
  const [estate] = useState<DigitalEstatePlan>(DEMO_ESTATE);
  const [guardians] = useState<GuardianSuccession[]>(DEMO_GUARDIANS);
  const t = useTheme();
  const demoMode = useWalletStore((s: any) => s.demoMode);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    heroCard: { backgroundColor: t.accent.purple + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 20, backgroundColor: t.bg.card, borderRadius: 16, padding: 4 },
    tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
    tabBtnActive: { backgroundColor: t.accent.purple },
    tabText: { color: t.text.secondary, fontSize: 11, fontWeight: fonts.bold },
    tabTextActive: { color: '#fff' },
    tabIcon: { fontSize: 18, marginBottom: 2 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 24 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    cardIcon: { fontSize: 24, marginRight: 10 },
    cardTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold, flex: 1 },
    cardSubtitle: { color: t.text.secondary, fontSize: 12 },
    cardValue: { color: t.text.primary, fontSize: 14, lineHeight: 22 },
    cardMeta: { color: t.text.muted, fontSize: 11, marginTop: 8 },
    badge: { backgroundColor: t.accent.green + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    badgeText: { color: t.accent.green, fontSize: 11, fontWeight: fonts.bold },
    proxyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.bg.primary, borderRadius: 12, padding: 12, marginTop: 8 },
    proxyLabel: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.semibold },
    proxyUid: { color: t.accent.blue, fontSize: 13, fontWeight: fonts.bold, marginLeft: 8 },
    letterCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    letterSubject: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    letterRecipient: { color: t.text.secondary, fontSize: 13, marginTop: 4 },
    letterHash: { color: t.text.muted, fontSize: 11, fontFamily: 'Courier', marginTop: 8 },
    letterDate: { color: t.text.muted, fontSize: 11, marginTop: 4 },
    encryptedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
    encryptedText: { color: t.accent.green, fontSize: 11, fontWeight: fonts.bold },
    memorialSection: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    memLabel: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
    memValue: { color: t.text.primary, fontSize: 14, lineHeight: 22 },
    memList: { marginTop: 4 },
    memListItem: { color: t.text.primary, fontSize: 14, lineHeight: 24, paddingLeft: 8 },
    estateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, marginBottom: 8 },
    estateLabel: { color: t.text.secondary, fontSize: 13, fontWeight: fonts.semibold },
    estateName: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    estateUid: { color: t.text.muted, fontSize: 11 },
    guardianCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    guardianRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    guardianLabel: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.semibold },
    guardianName: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    actionBtn: { backgroundColor: t.accent.purple, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginHorizontal: 20, marginTop: 16 },
    actionBtnText: { color: '#fff', fontSize: 16, fontWeight: fonts.bold },
    secondaryBtn: { backgroundColor: t.bg.card, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginHorizontal: 20, marginTop: 10 },
    secondaryBtnText: { color: t.accent.purple, fontSize: 16, fontWeight: fonts.bold },
    disclaimer: { color: t.text.muted, fontSize: 11, textAlign: 'center', marginHorizontal: 32, marginTop: 16, lineHeight: 18 },
    emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 32 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', lineHeight: 22 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 20, marginTop: 16 },
    statBox: { alignItems: 'center', flex: 1 },
    statValue: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
  }), [t]);

  // ─── Directives Tab ───
  const renderDirectives = useCallback(() => (
    <>
      <Text style={s.section}>Advance Directives</Text>
      {directives.map((d) => (
        <View key={d.id} style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardIcon}>{DIRECTIVE_ICONS[d.type] || '\u{1F4CB}'}</Text>
            <Text style={s.cardTitle}>{d.label}</Text>
            <View style={s.badge}>
              <Text style={s.badgeText}>Active</Text>
            </View>
          </View>
          <Text style={s.cardValue}>{d.value}</Text>
          {d.proxyUid && (
            <View style={s.proxyRow}>
              <Text style={s.proxyLabel}>Proxy UID:</Text>
              <Text style={s.proxyUid}>{d.proxyUid}</Text>
            </View>
          )}
          <View style={s.encryptedBadge}>
            <Text style={s.encryptedText}>{'\u{1F512}'} Encrypted on-chain</Text>
          </View>
          <Text style={s.cardMeta}>Last updated: {d.lastUpdated}</Text>
        </View>
      ))}
      <TouchableOpacity style={s.actionBtn} onPress={() => Alert.alert('Edit Directive', 'Update your advance directives securely.')}>
        <Text style={s.actionBtnText}>Edit Directives</Text>
      </TouchableOpacity>
      <Text style={s.disclaimer}>
        All directives are encrypted end-to-end and stored on-chain. They will only be disclosed to your designated healthcare proxy upon verified trigger conditions.
      </Text>
    </>
  ), [directives, s]);

  // ─── Legacy Tab ───
  const renderLegacy = useCallback(() => (
    <>
      <Text style={s.section}>Legacy Letters</Text>
      {letters.length === 0 ? (
        <View style={s.emptyState}>
          <Text style={s.emptyIcon}>{'\u{1F48C}'}</Text>
          <Text style={s.emptyText}>No legacy letters yet. Write a heartfelt message to be delivered to your loved ones.</Text>
        </View>
      ) : (
        letters.map((l) => (
          <View key={l.id} style={s.letterCard}>
            <Text style={s.letterSubject}>{'\u{1F48C}'} {l.subject}</Text>
            <Text style={s.letterRecipient}>To: {l.recipientName} ({l.recipientUid})</Text>
            <Text style={s.letterHash}>On-chain hash: {l.onChainHash}</Text>
            <View style={s.encryptedBadge}>
              <Text style={s.encryptedText}>{'\u{1F512}'} Encrypted — recipient only</Text>
            </View>
            <Text style={s.letterDate}>Created: {l.createdAt} | Last edited: {l.lastEdited}</Text>
          </View>
        ))
      )}
      <TouchableOpacity style={s.actionBtn} onPress={() => Alert.alert('New Letter', 'Compose a new legacy letter.')}>
        <Text style={s.actionBtnText}>Write Legacy Letter</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.secondaryBtn} onPress={() => Alert.alert('Manage Recipients', 'Add or update letter recipients.')}>
        <Text style={s.secondaryBtnText}>Manage Recipients</Text>
      </TouchableOpacity>
      <Text style={s.disclaimer}>
        Letters are encrypted with the recipient's public key. Only they can decrypt them, and only after verified disclosure conditions are met.
      </Text>
    </>
  ), [letters, s]);

  // ─── Memorial Tab ───
  const renderMemorial = useCallback(() => (
    <>
      <Text style={s.section}>Memorial Preferences</Text>
      <View style={s.memorialSection}>
        <Text style={s.memLabel}>Disposition</Text>
        <Text style={s.memValue}>{PREFERENCE_LABELS[memorial.preference]}</Text>
      </View>
      <View style={s.memorialSection}>
        <Text style={s.memLabel}>Ceremony Type</Text>
        <Text style={s.memValue}>{CEREMONY_LABELS[memorial.ceremonyType]}</Text>
      </View>
      <View style={s.memorialSection}>
        <Text style={s.memLabel}>Location</Text>
        <Text style={s.memValue}>{memorial.locationPreference}</Text>
      </View>
      <View style={s.memorialSection}>
        <Text style={s.memLabel}>Music Selections</Text>
        <View style={s.memList}>
          {memorial.musicSelections.map((m, i) => (
            <Text key={i} style={s.memListItem}>{'\u{266B}'} {m}</Text>
          ))}
        </View>
      </View>
      <View style={s.memorialSection}>
        <Text style={s.memLabel}>Readings</Text>
        <View style={s.memList}>
          {memorial.readings.map((r, i) => (
            <Text key={i} style={s.memListItem}>{'\u{1F4D6}'} {r}</Text>
          ))}
        </View>
      </View>
      <View style={s.memorialSection}>
        <Text style={s.memLabel}>Special Requests</Text>
        <Text style={s.memValue}>{memorial.specialRequests}</Text>
      </View>
      <TouchableOpacity style={s.actionBtn} onPress={() => Alert.alert('Edit Wishes', 'Update your memorial preferences.')}>
        <Text style={s.actionBtnText}>Edit Memorial Wishes</Text>
      </TouchableOpacity>
    </>
  ), [memorial, s]);

  // ─── Estate Tab ───
  const renderEstate = useCallback(() => (
    <>
      <Text style={s.section}>Digital Estate Plan</Text>
      <View style={s.card}>
        <View style={s.estateRow}>
          <View>
            <Text style={s.estateLabel}>Wallet Inheritor</Text>
            <Text style={s.estateName}>{estate.walletInheritorName}</Text>
            <Text style={s.estateUid}>{estate.walletInheritorUid}</Text>
          </View>
          <Text style={{ fontSize: 24 }}>{'\u{1F4B0}'}</Text>
        </View>
        <View style={[s.estateRow, { marginTop: 8 }]}>
          <View>
            <Text style={s.estateLabel}>UID Successor</Text>
            <Text style={s.estateName}>{estate.uidSuccessorName}</Text>
            <Text style={s.estateUid}>{estate.uidSuccessorUid}</Text>
          </View>
          <Text style={{ fontSize: 24 }}>{'\u{1F194}'}</Text>
        </View>
        <View style={[s.estateRow, { marginTop: 8 }]}>
          <View>
            <Text style={s.estateLabel}>Achievement Recipient</Text>
            <Text style={s.estateName}>{estate.achievementRecipientName}</Text>
            <Text style={s.estateUid}>{estate.achievementRecipientUid}</Text>
          </View>
          <Text style={{ fontSize: 24 }}>{'\u{1F3C6}'}</Text>
        </View>
      </View>

      <Text style={s.section}>Guardian Succession</Text>
      {guardians.map((g) => (
        <View key={g.id} style={s.guardianCard}>
          <View style={s.guardianRow}>
            <View>
              <Text style={s.guardianLabel}>Dependent</Text>
              <Text style={s.guardianName}>{g.dependentName}</Text>
              <Text style={s.estateUid}>{g.dependentUid}</Text>
            </View>
            <Text style={{ fontSize: 28 }}>{'\u{1F9D2}'}</Text>
          </View>
          <View style={[s.guardianRow, { marginTop: 12 }]}>
            <View>
              <Text style={s.guardianLabel}>Primary Guardian</Text>
              <Text style={s.guardianName}>{g.guardianName}</Text>
              <Text style={s.estateUid}>{g.guardianUid}</Text>
            </View>
            <Text style={{ fontSize: 20 }}>{'\u{1F6E1}\uFE0F'}</Text>
          </View>
          <View style={[s.guardianRow, { marginTop: 12 }]}>
            <View>
              <Text style={s.guardianLabel}>Alternate Guardian</Text>
              <Text style={s.guardianName}>{g.alternateGuardianName}</Text>
              <Text style={s.estateUid}>{g.alternateGuardianUid}</Text>
            </View>
            <Text style={{ fontSize: 20 }}>{'\u{1F91D}'}</Text>
          </View>
        </View>
      ))}
      <TouchableOpacity style={s.actionBtn} onPress={() => Alert.alert('Edit Estate', 'Update your digital estate plan.')}>
        <Text style={s.actionBtnText}>Edit Estate Plan</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.secondaryBtn} onPress={() => Alert.alert('Add Guardian', 'Add guardian succession for a dependent.')}>
        <Text style={s.secondaryBtnText}>Add Guardian Succession</Text>
      </TouchableOpacity>
      <Text style={s.disclaimer}>
        Digital estate and guardian succession plans are encrypted and disclosed only to designated successors upon verified conditions.
      </Text>
    </>
  ), [estate, guardians, s]);

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>End of Life</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={s.heroCard}>
          <Text style={s.heroIcon}>{'\u{1F56F}\uFE0F'}</Text>
          <Text style={s.heroTitle}>Dignified Legacy Planning</Text>
          <Text style={s.heroSubtitle}>
            Your wishes, your way. All plans are encrypted{'\n'}and disclosed only to those you designate.
          </Text>
        </View>

        {/* Summary Stats */}
        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={s.statValue}>{directives.length}</Text>
            <Text style={s.statLabel}>Directives</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>{letters.length}</Text>
            <Text style={s.statLabel}>Letters</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>{guardians.length}</Text>
            <Text style={s.statLabel}>Guardians</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>{'\u{2705}'}</Text>
            <Text style={s.statLabel}>Memorial Set</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={s.tabRow}>
          {TABS.map((tb) => (
            <TouchableOpacity
              key={tb.key}
              style={[s.tabBtn, tab === tb.key && s.tabBtnActive]}
              onPress={() => setTab(tb.key)}
            >
              <Text style={s.tabIcon}>{tb.icon}</Text>
              <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {tab === 'directives' && renderDirectives()}
        {tab === 'legacy' && renderLegacy()}
        {tab === 'memorial' && renderMemorial()}
        {tab === 'estate' && renderEstate()}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
