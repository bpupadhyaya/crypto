/**
 * Legacy Plan Screen — Plan your digital legacy comprehensively.
 *
 * Configure digital will, legacy messages, memorial funds,
 * and guardian succession for dependents.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput, Switch,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// --- Types ---

interface WillBeneficiary {
  uid: string;
  name: string;
  relationship: string;
  assets: string[];
}

interface LegacyMessage {
  id: string;
  recipient: string;
  triggerType: 'date' | 'event' | 'inactivity';
  triggerValue: string;
  preview: string;
  status: 'sealed' | 'draft';
}

interface MemorialFund {
  id: string;
  cause: string;
  monthlyAmount: number;
  currency: string;
  active: boolean;
}

interface SuccessionEntry {
  dependentName: string;
  currentGuardian: string;
  successorGuardian: string;
  relationship: string;
}

type TabKey = 'will' | 'messages' | 'fund' | 'succession';

interface Props {
  onClose: () => void;
}

// --- Demo data ---

const DEMO_BENEFICIARIES: WillBeneficiary[] = [
  {
    uid: 'uid_spouse_001', name: 'Priya Sharma', relationship: 'Spouse',
    assets: ['OTK Wallet', 'Achievement Badges', 'Living Ledger (read)'],
  },
  {
    uid: 'uid_child_001', name: 'Arjun Sharma', relationship: 'Son',
    assets: ['OTK Wallet (50%)', 'Ancestry Records', 'Education Credits'],
  },
];

const DEMO_MESSAGES: LegacyMessage[] = [
  {
    id: 'msg_01', recipient: 'Arjun Sharma', triggerType: 'date',
    triggerValue: '2040-01-01', preview: 'Dear Arjun, when you turn 18...',
    status: 'sealed',
  },
  {
    id: 'msg_02', recipient: 'Community Council', triggerType: 'inactivity',
    triggerValue: '365 days', preview: 'If I am no longer active, please ensure...',
    status: 'sealed',
  },
];

const DEMO_FUNDS: MemorialFund[] = [
  { id: 'fund_01', cause: 'Village School Scholarship Fund', monthlyAmount: 50, currency: 'OTK', active: true },
];

const DEMO_SUCCESSION: SuccessionEntry[] = [
  {
    dependentName: 'Arjun Sharma', currentGuardian: 'Self',
    successorGuardian: 'Alice Sharma', relationship: 'Aunt',
  },
];

const TABS: { key: TabKey; label: string }[] = [
  { key: 'will', label: 'Will' },
  { key: 'messages', label: 'Messages' },
  { key: 'fund', label: 'Fund' },
  { key: 'succession', label: 'Succession' },
];

// --- Component ---

export function LegacyPlanScreen({ onClose }: Props) {
  const t = useTheme();
  const demoMode = useWalletStore((s) => s.demoMode);

  const [activeTab, setActiveTab] = useState<TabKey>('will');
  const [beneficiaries] = useState(DEMO_BENEFICIARIES);
  const [messages] = useState(DEMO_MESSAGES);
  const [funds, setFunds] = useState(DEMO_FUNDS);
  const [succession] = useState(DEMO_SUCCESSION);
  const [willLocked, setWillLocked] = useState(true);
  const [newCause, setNewCause] = useState('');
  const [newAmount, setNewAmount] = useState('');

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    title: { fontSize: 18, fontWeight: '700', color: t.text.primary },
    closeBtn: { fontSize: 16, color: t.accent.green },
    tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: t.border },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
    tabActive: { borderBottomWidth: 2, borderBottomColor: t.accent.green },
    tabText: { fontSize: 13, color: t.text.secondary },
    tabTextActive: { color: t.accent.green, fontWeight: '600' },
    scroll: { flex: 1 },
    section: { padding: 16, borderBottomWidth: 1, borderBottomColor: t.border },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: t.text.primary, marginBottom: 8 },
    card: {
      backgroundColor: t.bg.card, borderRadius: 12, padding: 14,
      marginBottom: 10, borderWidth: 1, borderColor: t.border,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    label: { fontSize: 13, color: t.text.secondary, marginBottom: 2 },
    value: { fontSize: 15, color: t.text.primary, fontWeight: '500' },
    subtext: { fontSize: 12, color: t.text.secondary },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    badgeText: { fontSize: 11, fontWeight: '600', color: '#fff' },
    assetChip: {
      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
      backgroundColor: t.bg.primary, marginRight: 6, marginBottom: 4,
    },
    assetText: { fontSize: 11, color: t.text.primary },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
    input: {
      borderWidth: 1, borderColor: t.border, borderRadius: 8,
      padding: 10, fontSize: 14, color: t.text.primary, marginBottom: 10,
      backgroundColor: t.bg.card,
    },
    button: {
      backgroundColor: t.accent.green, borderRadius: 10, paddingVertical: 12,
      alignItems: 'center', marginTop: 8,
    },
    buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
    buttonDisabled: { opacity: 0.5 },
    lockBox: {
      backgroundColor: '#fef3c7', borderRadius: 10, padding: 12, marginBottom: 12,
    },
    lockText: { fontSize: 13, color: '#92400e', lineHeight: 18 },
    infoText: { fontSize: 13, color: t.text.secondary, lineHeight: 20, marginTop: 4 },
    triggerBadge: {
      paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
      backgroundColor: t.bg.primary, marginTop: 4, alignSelf: 'flex-start',
    },
    triggerText: { fontSize: 10, color: t.text.secondary, fontWeight: '600' },
    switchRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingVertical: 10,
    },
    successorCard: {
      backgroundColor: t.bg.card, borderRadius: 12, padding: 14,
      marginBottom: 10, borderWidth: 1, borderColor: t.border,
      borderLeftWidth: 4, borderLeftColor: t.accent.green,
    },
  }), [t]);

  const handleAddFund = () => {
    if (!newCause || !newAmount) return;
    const f: MemorialFund = {
      id: `fund_${Date.now()}`, cause: newCause,
      monthlyAmount: parseInt(newAmount, 10) || 0, currency: 'OTK', active: true,
    };
    setFunds((prev) => [...prev, f]);
    setNewCause(''); setNewAmount('');
  };

  const renderWill = () => (
    <ScrollView style={styles.scroll}>
      <View style={styles.section}>
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.sectionTitle}>Digital Will</Text>
            <Text style={styles.subtext}>
              {willLocked ? 'Will is locked and sealed' : 'Will is unlocked for editing'}
            </Text>
          </View>
          <Switch value={!willLocked} onValueChange={(v) => setWillLocked(!v)} />
        </View>
        {willLocked && (
          <View style={styles.lockBox}>
            <Text style={styles.lockText}>
              Your will is sealed. Unlock to make changes. Changes require
              re-verification with your guardians.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Beneficiaries ({beneficiaries.length})</Text>
        {beneficiaries.map((b) => (
          <View key={b.uid} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.value}>{b.name}</Text>
              <View style={[styles.badge, { backgroundColor: '#3b82f6' }]}>
                <Text style={styles.badgeText}>{b.relationship}</Text>
              </View>
            </View>
            <Text style={styles.label}>UID: {b.uid}</Text>
            <Text style={[styles.label, { marginTop: 6 }]}>Inherits:</Text>
            <View style={styles.chipRow}>
              {b.assets.map((a, i) => (
                <View key={i} style={styles.assetChip}>
                  <Text style={styles.assetText}>{a}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.infoText}>
          Your digital will ensures your OTK, achievements, Living Ledger access,
          and other digital assets are transferred to your chosen beneficiaries.
          All transfers are verified by your social recovery guardians.
        </Text>
      </View>
    </ScrollView>
  );

  const renderMessages = () => (
    <ScrollView style={styles.scroll}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legacy Messages ({messages.length})</Text>
        <Text style={styles.infoText}>
          Messages are encrypted and sealed. They unlock only when the trigger
          condition is met (date reached, event occurs, or inactivity detected).
        </Text>
      </View>

      <View style={styles.section}>
        {messages.map((m) => (
          <View key={m.id} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.value}>To: {m.recipient}</Text>
              <View style={[styles.badge, {
                backgroundColor: m.status === 'sealed' ? '#22c55e' : '#f59e0b',
              }]}>
                <Text style={styles.badgeText}>{m.status}</Text>
              </View>
            </View>
            <View style={styles.triggerBadge}>
              <Text style={styles.triggerText}>
                Trigger: {m.triggerType} — {m.triggerValue}
              </Text>
            </View>
            <Text style={[styles.subtext, { marginTop: 8, fontStyle: 'italic' }]}>
              "{m.preview}"
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Create New Message</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderFund = () => (
    <ScrollView style={styles.scroll}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Memorial Funds ({funds.length})</Text>
        <Text style={styles.infoText}>
          Set up automatic donations to causes you care about. These activate
          after your passing, verified by your guardians and inactivity detection.
        </Text>
      </View>

      <View style={styles.section}>
        {funds.map((f) => (
          <View key={f.id} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.value}>{f.cause}</Text>
              <View style={[styles.badge, {
                backgroundColor: f.active ? '#22c55e' : '#6b7280',
              }]}>
                <Text style={styles.badgeText}>{f.active ? 'Active' : 'Paused'}</Text>
              </View>
            </View>
            <Text style={styles.label}>
              {f.monthlyAmount} {f.currency} / month (upon activation)
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add Memorial Fund</Text>
        <TextInput style={styles.input} placeholder="Cause name" placeholderTextColor={t.text.secondary} value={newCause} onChangeText={setNewCause} />
        <TextInput style={styles.input} placeholder="Monthly OTK amount" placeholderTextColor={t.text.secondary} value={newAmount} onChangeText={setNewAmount} keyboardType="numeric" />
        <TouchableOpacity
          style={[styles.button, (!newCause || !newAmount) && styles.buttonDisabled]}
          onPress={handleAddFund}
          disabled={!newCause || !newAmount}
        >
          <Text style={styles.buttonText}>Add Fund</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderSuccession = () => (
    <ScrollView style={styles.scroll}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Guardian Succession</Text>
        <Text style={styles.infoText}>
          Designate who takes over caregiving responsibilities for your dependents.
          Succession is verified through the social recovery network.
        </Text>
      </View>

      <View style={styles.section}>
        {succession.map((s, i) => (
          <View key={i} style={styles.successorCard}>
            <Text style={styles.value}>{s.dependentName}</Text>
            <Text style={styles.label}>Current Guardian: {s.currentGuardian}</Text>
            <Text style={[styles.label, { marginTop: 6 }]}>Successor:</Text>
            <View style={[styles.row, { marginTop: 4 }]}>
              <Text style={[styles.value, { color: t.accent.green }]}>
                {s.successorGuardian}
              </Text>
              <View style={[styles.badge, { backgroundColor: '#3b82f6' }]}>
                <Text style={styles.badgeText}>{s.relationship}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Add Succession Plan</Text>
        </TouchableOpacity>
        {demoMode && (
          <Text style={[styles.infoText, { marginTop: 12 }]}>
            Demo Mode: succession plans are simulated. In production, all parties
            must consent and verify via their Universal IDs.
          </Text>
        )}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Legacy Plan</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'will' && renderWill()}
      {activeTab === 'messages' && renderMessages()}
      {activeTab === 'fund' && renderFund()}
      {activeTab === 'succession' && renderSuccession()}
    </SafeAreaView>
  );
}
