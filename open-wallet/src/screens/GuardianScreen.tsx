import { fonts } from '../utils/theme';
/**
 * Guardian Screen — Article II: Parent/Elder Approval Workflow.
 *
 * Enables guardians (parents, elders) to manage dependent accounts.
 * Features:
 *   - Add/remove dependents (children, elderly family members)
 *   - Approve/reject transactions above threshold
 *   - Set spending limits per dependent
 *   - Transfer guardianship when dependent comes of age
 *   - Emergency access controls
 *   - Multi-guardian support (both parents)
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  SafeAreaView, TextInput, Alert, Switch,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props { onClose: () => void; }

interface Dependent {
  uid: string;
  name: string;
  relationship: 'child' | 'elder' | 'ward';
  age: number;
  spendingLimit: number; // uotk per day
  pendingApprovals: number;
  status: 'active' | 'transitioning' | 'graduated';
  guardians: string[];
  addedAt: string;
}

interface PendingApproval {
  id: string;
  dependentName: string;
  type: 'transaction' | 'identity_change' | 'guardian_add' | 'graduation';
  description: string;
  amount?: number;
  denom?: string;
  timestamp: string;
  urgency: 'normal' | 'high' | 'emergency';
}

const DEMO_DEPENDENTS: Dependent[] = [
  { uid: 'open1child1...abc', name: 'Aria', relationship: 'child', age: 12, spendingLimit: 100000, pendingApprovals: 2, status: 'active', guardians: ['You', 'open1spouse...xyz'], addedAt: '2026-01-15' },
  { uid: 'open1child2...def', name: 'Kai', relationship: 'child', age: 17, spendingLimit: 500000, pendingApprovals: 0, status: 'transitioning', guardians: ['You', 'open1spouse...xyz'], addedAt: '2025-06-01' },
  { uid: 'open1elder1...ghi', name: 'Grandmother Priya', relationship: 'elder', age: 82, spendingLimit: 1000000, pendingApprovals: 1, status: 'active', guardians: ['You', 'open1sibling...jkl'], addedAt: '2025-09-10' },
];

const DEMO_APPROVALS: PendingApproval[] = [
  { id: 'appr-1', dependentName: 'Aria', type: 'transaction', description: 'Send 50 OTK to Education Hub subscription', amount: 50000000, denom: 'ueotk', timestamp: '2 hours ago', urgency: 'normal' },
  { id: 'appr-2', dependentName: 'Aria', type: 'identity_change', description: 'Update profile photo on Universal ID', timestamp: '5 hours ago', urgency: 'normal' },
  { id: 'appr-3', dependentName: 'Grandmother Priya', type: 'transaction', description: 'Send 200 OTK to medical payment', amount: 200000000, denom: 'uhotk', timestamp: '1 day ago', urgency: 'high' },
  { id: 'appr-4', dependentName: 'Kai', type: 'graduation', description: 'Kai turns 18 — transfer full account ownership', timestamp: '3 days away', urgency: 'high' },
];

export function GuardianScreen({ onClose }: Props) {
  const t = useTheme();
  const { demoMode } = useWalletStore();
  const [tab, setTab] = useState<'dependents' | 'approvals' | 'add'>('dependents');
  const [dependents] = useState<Dependent[]>(demoMode ? DEMO_DEPENDENTS : []);
  const [approvals, setApprovals] = useState<PendingApproval[]>(demoMode ? DEMO_APPROVALS : []);
  const [newName, setNewName] = useState('');
  const [newRelation, setNewRelation] = useState<'child' | 'elder' | 'ward'>('child');
  const [newUID, setNewUID] = useState('');
  const [selectedDependent, setSelectedDependent] = useState<Dependent | null>(null);

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    title: { color: t.text.primary, fontSize: fonts.xxl, fontWeight: fonts.heavy },
    close: { color: t.accent.blue, fontSize: fonts.lg },
    tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16 },
    tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: t.bg.card },
    tabActive: { backgroundColor: t.accent.green },
    tabText: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: t.bg.primary },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 12 },
    cardTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 4 },
    cardSub: { color: t.text.secondary, fontSize: fonts.sm },
    cardMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    badge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 8, backgroundColor: t.accent.yellow + '30' },
    badgeText: { color: t.accent.yellow, fontSize: fonts.xs, fontWeight: fonts.bold },
    badgeActive: { backgroundColor: t.accent.green + '30' },
    badgeActiveText: { color: t.accent.green },
    badgeAlert: { backgroundColor: t.accent.red + '30' },
    badgeAlertText: { color: t.accent.red },
    approvalCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 12 },
    actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    approveBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: t.accent.green, alignItems: 'center' },
    rejectBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: t.accent.red, alignItems: 'center' },
    btnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    input: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md, marginHorizontal: 16, marginBottom: 12 },
    section: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 20, marginTop: 16, marginBottom: 8 },
    addBtn: { marginHorizontal: 16, paddingVertical: 14, borderRadius: 12, backgroundColor: t.accent.green, alignItems: 'center', marginTop: 8 },
    emptyText: { color: t.text.muted, textAlign: 'center', marginTop: 40, fontSize: fonts.md },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
    detailLabel: { color: t.text.secondary, fontSize: fonts.md },
    detailValue: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    guardianList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
    guardianChip: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 12, backgroundColor: t.accent.blue + '20' },
    guardianText: { color: t.accent.blue, fontSize: fonts.sm, fontWeight: fonts.semibold },
    emergencyBtn: { marginHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: t.accent.red + '20', alignItems: 'center', marginTop: 12 },
    emergencyText: { color: t.accent.red, fontSize: fonts.md, fontWeight: fonts.bold },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    relChip: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 8 },
  }), [t]);

  const handleApprove = (id: string) => {
    Alert.alert('Approved', 'Transaction approved for dependent.');
    setApprovals(prev => prev.filter(a => a.id !== id));
  };

  const handleReject = (id: string) => {
    Alert.alert('Rejected', 'Transaction rejected.');
    setApprovals(prev => prev.filter(a => a.id !== id));
  };

  const handleAddDependent = () => {
    if (!newName || !newUID) {
      Alert.alert('Error', 'Name and UID are required');
      return;
    }
    Alert.alert('Guardian Request Sent', `A guardian request has been sent to ${newName}. They must accept from their device.`);
    setNewName('');
    setNewUID('');
    setTab('dependents');
  };

  if (selectedDependent) {
    const d = selectedDependent;
    return (
      <SafeAreaView style={st.container}>
        <View style={st.header}>
          <TouchableOpacity onPress={() => setSelectedDependent(null)}><Text style={st.close}>Back</Text></TouchableOpacity>
          <Text style={st.title}>{d.name}</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView>
          <View style={st.card}>
            <View style={st.detailRow}><Text style={st.detailLabel}>Relationship</Text><Text style={st.detailValue}>{d.relationship}</Text></View>
            <View style={st.detailRow}><Text style={st.detailLabel}>Age</Text><Text style={st.detailValue}>{d.age}</Text></View>
            <View style={st.detailRow}><Text style={st.detailLabel}>Status</Text>
              <View style={[st.badge, d.status === 'active' ? st.badgeActive : d.status === 'transitioning' ? st.badgeAlert : {}]}>
                <Text style={[st.badgeText, d.status === 'active' ? st.badgeActiveText : d.status === 'transitioning' ? st.badgeAlertText : {}]}>{d.status.toUpperCase()}</Text>
              </View>
            </View>
            <View style={st.detailRow}><Text style={st.detailLabel}>Daily Limit</Text><Text style={st.detailValue}>{(d.spendingLimit / 1000000).toFixed(1)} OTK</Text></View>
            <View style={st.detailRow}><Text style={st.detailLabel}>UID</Text><Text style={[st.detailValue, { fontSize: fonts.sm }]}>{d.uid}</Text></View>
            <View style={st.detailRow}><Text style={st.detailLabel}>Added</Text><Text style={st.detailValue}>{d.addedAt}</Text></View>
          </View>

          <Text style={st.section}>GUARDIANS</Text>
          <View style={[st.card, { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }]}>
            {d.guardians.map((g, i) => (
              <View key={i} style={st.guardianChip}><Text style={st.guardianText}>{g}</Text></View>
            ))}
            <TouchableOpacity style={[st.guardianChip, { backgroundColor: t.border }]} onPress={() => Alert.alert('Add Guardian', 'Enter the UID of the additional guardian.')}>
              <Text style={{ color: t.text.muted, fontSize: fonts.sm }}>+ Add Guardian</Text>
            </TouchableOpacity>
          </View>

          <Text style={st.section}>CONTROLS</Text>
          <View style={st.card}>
            <View style={st.detailRow}>
              <Text style={st.detailLabel}>Require approval above</Text>
              <Text style={st.detailValue}>{(d.spendingLimit / 1000000).toFixed(1)} OTK</Text>
            </View>
            <View style={st.detailRow}>
              <Text style={st.detailLabel}>Identity changes need approval</Text>
              <Switch value={true} />
            </View>
            <View style={st.detailRow}>
              <Text style={st.detailLabel}>Location sharing (safety)</Text>
              <Switch value={d.relationship === 'child' && d.age < 16} />
            </View>
          </View>

          {d.status === 'transitioning' && (
            <>
              <Text style={st.section}>GRADUATION</Text>
              <View style={st.card}>
                <Text style={st.cardTitle}>Transfer Ownership</Text>
                <Text style={st.cardSub}>{d.name} is approaching adulthood. When ready, transfer full account control.</Text>
                <TouchableOpacity style={[st.approveBtn, { marginTop: 12 }]} onPress={() => Alert.alert('Graduation', `${d.name} will receive full account control. Both guardians must approve.`)}>
                  <Text style={st.btnText}>Begin Graduation Process</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <TouchableOpacity style={st.emergencyBtn} onPress={() => Alert.alert('Emergency Access', 'This will freeze the dependent account and alert all guardians.')}>
            <Text style={st.emergencyText}>Emergency Freeze Account</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <TouchableOpacity onPress={onClose}><Text style={st.close}>Close</Text></TouchableOpacity>
        <Text style={st.title}>Guardian</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={st.tabs}>
        {(['dependents', 'approvals', 'add'] as const).map(t2 => (
          <TouchableOpacity key={t2} style={[st.tab, tab === t2 && st.tabActive]} onPress={() => setTab(t2)}>
            <Text style={[st.tabText, tab === t2 && st.tabTextActive]}>
              {t2 === 'dependents' ? `Dependents (${dependents.length})` : t2 === 'approvals' ? `Approvals (${approvals.length})` : '+ Add'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView>
        {tab === 'dependents' && (
          dependents.length === 0 ? <Text style={st.emptyText}>No dependents added yet</Text> :
          dependents.map(d => (
            <TouchableOpacity key={d.uid} style={st.card} onPress={() => setSelectedDependent(d)}>
              <View style={st.statusRow}>
                <Text style={st.cardTitle}>{d.name}</Text>
                <View style={[st.relChip, { backgroundColor: d.relationship === 'child' ? t.accent.blue + '20' : t.accent.yellow + '20' }]}>
                  <Text style={{ color: d.relationship === 'child' ? t.accent.blue : t.accent.yellow, fontSize: fonts.xs, fontWeight: fonts.bold }}>{d.relationship}</Text>
                </View>
              </View>
              <Text style={st.cardSub}>Age {d.age} | Limit: {(d.spendingLimit / 1000000).toFixed(1)} OTK/day</Text>
              <View style={st.cardMeta}>
                <View style={[st.badge, d.status === 'active' ? st.badgeActive : st.badgeAlert]}>
                  <Text style={[st.badgeText, d.status === 'active' ? st.badgeActiveText : st.badgeAlertText]}>{d.status}</Text>
                </View>
                {d.pendingApprovals > 0 && (
                  <View style={[st.badge, st.badgeAlert]}>
                    <Text style={st.badgeAlertText}>{d.pendingApprovals} pending</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}

        {tab === 'approvals' && (
          approvals.length === 0 ? <Text style={st.emptyText}>No pending approvals</Text> :
          approvals.map(a => (
            <View key={a.id} style={st.approvalCard}>
              <View style={st.statusRow}>
                <Text style={st.cardTitle}>{a.dependentName}</Text>
                {a.urgency === 'high' && <View style={[st.badge, st.badgeAlert]}><Text style={st.badgeAlertText}>URGENT</Text></View>}
              </View>
              <Text style={st.cardSub}>{a.description}</Text>
              {a.amount && <Text style={[st.cardSub, { marginTop: 4, fontWeight: fonts.semibold, color: t.text.primary }]}>{(a.amount / 1000000).toFixed(2)} OTK</Text>}
              <Text style={[st.cardSub, { fontSize: fonts.xs }]}>{a.timestamp}</Text>
              <View style={st.actionRow}>
                <TouchableOpacity style={st.approveBtn} onPress={() => handleApprove(a.id)}><Text style={st.btnText}>Approve</Text></TouchableOpacity>
                <TouchableOpacity style={st.rejectBtn} onPress={() => handleReject(a.id)}><Text style={st.btnText}>Reject</Text></TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {tab === 'add' && (
          <>
            <Text style={st.section}>ADD DEPENDENT</Text>
            <TextInput style={st.input} placeholder="Dependent's Name" placeholderTextColor={t.text.muted} value={newName} onChangeText={setNewName} />
            <TextInput style={st.input} placeholder="Dependent's Universal ID" placeholderTextColor={t.text.muted} value={newUID} onChangeText={setNewUID} autoCapitalize="none" />
            <View style={[st.tabs, { marginBottom: 0, marginLeft: 4 }]}>
              {(['child', 'elder', 'ward'] as const).map(r => (
                <TouchableOpacity key={r} style={[st.tab, newRelation === r && st.tabActive]} onPress={() => setNewRelation(r)}>
                  <Text style={[st.tabText, newRelation === r && st.tabTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={st.addBtn} onPress={handleAddDependent}>
              <Text style={st.btnText}>Send Guardian Request</Text>
            </TouchableOpacity>
            <Text style={[st.cardSub, { textAlign: 'center', marginTop: 12, marginHorizontal: 32 }]}>
              The dependent must accept the guardian request from their device. Both parties retain their private keys.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
