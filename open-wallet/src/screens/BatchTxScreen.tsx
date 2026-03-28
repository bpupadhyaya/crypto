/**
 * Batch Transactions Screen — send multiple transactions at once.
 * CSV import, preview, sequential execution with progress, and completion summary.
 * Demo mode simulates batch execution.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

interface Props { onClose: () => void }

// ─── Types ───

interface BatchRecipient {
  id: string;
  address: string;
  amount: string;
  token: string;
  label?: string;
  status: 'pending' | 'sending' | 'success' | 'failed';
  txHash?: string;
  error?: string;
}

type BatchView = 'compose' | 'csv' | 'preview' | 'executing' | 'summary';

// ─── Demo Data ───

const DEMO_RECIPIENTS: BatchRecipient[] = [
  { id: '1', address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2BD3e', amount: '0.5', token: 'ETH', label: 'Alice (Salary)', status: 'pending' },
  { id: '2', address: '0x8Ba1f109551bD432803012645Ac136ddd64DBA72', amount: '0.3', token: 'ETH', label: 'Bob (Contractor)', status: 'pending' },
  { id: '3', address: '5Ht9VkXY...mZpQ3', amount: '25', token: 'SOL', label: 'Charlie (Gratitude)', status: 'pending' },
  { id: '4', address: 'bc1q...7x8r', amount: '0.01', token: 'BTC', label: 'Dave (Reimbursement)', status: 'pending' },
  { id: '5', address: 'cosmos1...xyz', amount: '50', token: 'ATOM', label: 'Eve (Delegation)', status: 'pending' },
];

const SUPPORTED_TOKENS = ['ETH', 'BTC', 'SOL', 'ATOM', 'OTK', 'USDC', 'USDT'];

let nextId = 100;

export function BatchTxScreen({ onClose }: Props) {
  const { demoMode } = useWalletStore();
  const t = useTheme();

  const [batchView, setBatchView] = useState<BatchView>('compose');
  const [recipients, setRecipients] = useState<BatchRecipient[]>(demoMode ? DEMO_RECIPIENTS : []);
  const [csvText, setCsvText] = useState('');
  const [progress, setProgress] = useState(0);
  const [executing, setExecuting] = useState(false);

  // Form for adding a single recipient
  const [addAddress, setAddAddress] = useState('');
  const [addAmount, setAddAmount] = useState('');
  const [addToken, setAddToken] = useState('ETH');
  const [addLabel, setAddLabel] = useState('');

  const handleAddRecipient = () => {
    if (!addAddress.trim() || !addAmount.trim()) {
      Alert.alert('Error', 'Address and amount are required.');
      return;
    }
    const num = parseFloat(addAmount);
    if (isNaN(num) || num <= 0) {
      Alert.alert('Error', 'Amount must be a positive number.');
      return;
    }
    setRecipients((prev) => [
      ...prev,
      {
        id: String(nextId++),
        address: addAddress.trim(),
        amount: addAmount.trim(),
        token: addToken,
        label: addLabel.trim() || undefined,
        status: 'pending',
      },
    ]);
    setAddAddress(''); setAddAmount(''); setAddLabel('');
  };

  const handleRemove = (id: string) => {
    setRecipients((prev) => prev.filter((r) => r.id !== id));
  };

  const handleImportCsv = () => {
    const lines = csvText.trim().split('\n').filter((l) => l.trim());
    const parsed: BatchRecipient[] = [];
    for (const line of lines) {
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length < 2) continue;
      const [address, amount, token, label] = parts;
      if (!address || !amount) continue;
      parsed.push({
        id: String(nextId++),
        address,
        amount,
        token: token || 'ETH',
        label: label || undefined,
        status: 'pending',
      });
    }
    if (parsed.length === 0) {
      Alert.alert('Error', 'No valid entries found. Format: address,amount,token,label');
      return;
    }
    setRecipients((prev) => [...prev, ...parsed]);
    setCsvText('');
    setBatchView('compose');
    Alert.alert('Imported', `${parsed.length} recipient(s) added.`);
  };

  const handleExecute = useCallback(async () => {
    if (recipients.length === 0) return;
    setBatchView('executing');
    setExecuting(true);
    setProgress(0);

    const updated = [...recipients];
    for (let i = 0; i < updated.length; i++) {
      updated[i] = { ...updated[i], status: 'sending' };
      setRecipients([...updated]);
      setProgress(i);

      // Simulate transaction delay
      await new Promise((resolve) => setTimeout(resolve, demoMode ? 800 : 1500));

      // In demo mode, simulate mixed results
      if (demoMode) {
        const success = Math.random() > 0.15; // 85% success rate in demo
        updated[i] = {
          ...updated[i],
          status: success ? 'success' : 'failed',
          txHash: success ? `0x${Math.random().toString(16).slice(2, 18)}...` : undefined,
          error: success ? undefined : 'Insufficient balance',
        };
      } else {
        // Real execution would go here
        updated[i] = { ...updated[i], status: 'failed', error: 'Real execution not yet implemented' };
      }
      setRecipients([...updated]);
    }

    setProgress(updated.length);
    setExecuting(false);
    setBatchView('summary');
  }, [recipients, demoMode]);

  const successCount = recipients.filter((r) => r.status === 'success').length;
  const failCount = recipients.filter((r) => r.status === 'failed').length;
  const totalAmount = recipients.reduce((sum, r) => {
    const grouped: Record<string, number> = {};
    const key = r.token;
    grouped[key] = (grouped[key] || 0) + parseFloat(r.amount || '0');
    return sum + parseFloat(r.amount || '0');
  }, 0);

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '700' },
    backText: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingHorizontal: 16 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 20, marginBottom: 8, marginLeft: 4 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    label: { color: t.text.primary, fontSize: 15, fontWeight: '600' },
    muted: { color: t.text.muted, fontSize: 13 },
    input: { backgroundColor: t.bg.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: t.text.primary, fontSize: 15, marginBottom: 10, borderWidth: 1, borderColor: t.border },
    multilineInput: { minHeight: 100, textAlignVertical: 'top' },
    tokenRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
    tokenChip: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 10, backgroundColor: t.border },
    tokenChipActive: { backgroundColor: t.accent.green },
    tokenText: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
    tokenTextActive: { color: '#fff' },
    addBtn: { backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
    addBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    dangerBtn: { backgroundColor: t.accent.red, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
    secondaryBtn: { backgroundColor: t.accent.blue, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
    btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    recipientCard: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, marginBottom: 8 },
    addressText: { color: t.text.primary, fontSize: 13, fontFamily: 'Courier' },
    amountText: { color: t.accent.green, fontSize: 15, fontWeight: '700' },
    labelText: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    statusBadge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 8, marginTop: 6, alignSelf: 'flex-start' },
    statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    progressBar: { height: 8, backgroundColor: t.border, borderRadius: 4, marginVertical: 16 },
    progressFill: { height: 8, backgroundColor: t.accent.green, borderRadius: 4 },
    summaryCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16 },
    summaryBig: { color: t.text.primary, fontSize: 32, fontWeight: '700' },
    summaryLabel: { color: t.text.muted, fontSize: 14, marginTop: 4 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 16 },
    removeBtn: { marginTop: 6 },
    removeText: { color: t.accent.red, fontSize: 12 },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40 },
    useCaseCard: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, marginBottom: 8 },
    useCaseText: { color: t.text.secondary, fontSize: 14, lineHeight: 20 },
    useCaseLabel: { color: t.accent.purple, fontSize: 12, fontWeight: '700', marginBottom: 4 },
  }), [t]);

  const getStatusColor = (status: BatchRecipient['status']) => {
    switch (status) {
      case 'success': return t.accent.green;
      case 'failed': return t.accent.red;
      case 'sending': return t.accent.yellow;
      default: return t.text.muted;
    }
  };

  // ─── CSV Import View ───

  if (batchView === 'csv') {
    return (
      <SafeAreaView style={st.container}>
        <View style={st.header}>
          <TouchableOpacity onPress={() => setBatchView('compose')}>
            <Text style={st.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={st.title}>CSV Import</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={st.scroll}>
          <Text style={st.section}>Paste CSV Data</Text>
          <Text style={st.muted}>Format: address,amount,token,label (one per line)</Text>
          <View style={{ height: 8 }} />
          <TextInput
            style={[st.input, st.multilineInput, { minHeight: 200 }]}
            value={csvText}
            onChangeText={setCsvText}
            placeholder={'0x742d...BD3e,0.5,ETH,Alice\n0x8Ba1...BA72,0.3,ETH,Bob\n5Ht9V...pQ3,25,SOL,Charlie'}
            placeholderTextColor={t.text.muted}
            multiline
            autoCapitalize="none"
          />
          <TouchableOpacity style={st.addBtn} onPress={handleImportCsv}>
            <Text style={st.addBtnText}>Import Recipients</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Executing View ───

  if (batchView === 'executing') {
    const pct = recipients.length > 0 ? (progress / recipients.length) * 100 : 0;
    return (
      <SafeAreaView style={st.container}>
        <View style={st.header}>
          <View style={{ width: 40 }} />
          <Text style={st.title}>Executing...</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={st.scroll}>
          <View style={st.progressBar}>
            <View style={[st.progressFill, { width: `${Math.max(pct, 2)}%` }]} />
          </View>
          <Text style={[st.muted, { textAlign: 'center', marginBottom: 16 }]}>
            {progress} of {recipients.length} transactions processed
          </Text>
          {recipients.map((r) => (
            <View key={r.id} style={st.recipientCard}>
              <View style={st.row}>
                <Text style={st.addressText} numberOfLines={1}>
                  {r.label || r.address.slice(0, 20) + '...'}
                </Text>
                <Text style={st.amountText}>{r.amount} {r.token}</Text>
              </View>
              <View style={[st.statusBadge, { backgroundColor: getStatusColor(r.status) + '20' }]}>
                <Text style={[st.statusText, { color: getStatusColor(r.status) }]}>{r.status}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Summary View ───

  if (batchView === 'summary') {
    return (
      <SafeAreaView style={st.container}>
        <View style={st.header}>
          <View style={{ width: 40 }} />
          <Text style={st.title}>Batch Complete</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={st.scroll}>
          <View style={st.summaryCard}>
            <Text style={st.summaryBig}>{recipients.length}</Text>
            <Text style={st.summaryLabel}>Total Transactions</Text>
            <View style={st.summaryRow}>
              <View style={{ alignItems: 'center' }}>
                <Text style={[st.summaryBig, { fontSize: 24, color: t.accent.green }]}>{successCount}</Text>
                <Text style={st.summaryLabel}>Succeeded</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={[st.summaryBig, { fontSize: 24, color: t.accent.red }]}>{failCount}</Text>
                <Text style={st.summaryLabel}>Failed</Text>
              </View>
            </View>
          </View>

          {recipients.map((r) => (
            <View key={r.id} style={st.recipientCard}>
              <View style={st.row}>
                <Text style={st.addressText} numberOfLines={1}>
                  {r.label || r.address.slice(0, 20) + '...'}
                </Text>
                <Text style={st.amountText}>{r.amount} {r.token}</Text>
              </View>
              <View style={[st.statusBadge, { backgroundColor: getStatusColor(r.status) + '20' }]}>
                <Text style={[st.statusText, { color: getStatusColor(r.status) }]}>{r.status}</Text>
              </View>
              {r.txHash && <Text style={[st.muted, { marginTop: 4, fontFamily: 'Courier' }]}>{r.txHash}</Text>}
              {r.error && <Text style={{ color: t.accent.red, fontSize: 12, marginTop: 4 }}>{r.error}</Text>}
            </View>
          ))}

          <TouchableOpacity style={st.addBtn} onPress={onClose}>
            <Text style={st.addBtnText}>Done</Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Preview View ───

  if (batchView === 'preview') {
    return (
      <SafeAreaView style={st.container}>
        <View style={st.header}>
          <TouchableOpacity onPress={() => setBatchView('compose')}>
            <Text style={st.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={st.title}>Preview Batch</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={st.scroll}>
          <View style={st.summaryCard}>
            <Text style={st.summaryBig}>{recipients.length}</Text>
            <Text style={st.summaryLabel}>Transactions to Send</Text>
          </View>

          {recipients.map((r) => (
            <View key={r.id} style={st.recipientCard}>
              <View style={st.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  {r.label && <Text style={st.labelText}>{r.label}</Text>}
                  <Text style={st.addressText} numberOfLines={1}>{r.address}</Text>
                </View>
                <Text style={st.amountText}>{r.amount} {r.token}</Text>
              </View>
            </View>
          ))}

          <TouchableOpacity style={st.dangerBtn} onPress={() => {
            Alert.alert(
              'Confirm Batch Send',
              `Send ${recipients.length} transactions?${demoMode ? ' (Demo mode — no real funds)' : ''}`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Send All', style: 'destructive', onPress: handleExecute },
              ],
            );
          }}>
            <Text style={st.btnText}>Execute {recipients.length} Transactions</Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Compose View (default) ───

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={st.title}>Batch Send</Text>
        <TouchableOpacity onPress={() => setBatchView('csv')}>
          <Text style={[st.backText, { fontWeight: '700' }]}>CSV</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={st.scroll}>
        {/* Add Recipient Form */}
        <Text style={st.section}>Add Recipient</Text>
        <TextInput
          style={st.input}
          value={addAddress}
          onChangeText={setAddAddress}
          placeholder="Recipient address"
          placeholderTextColor={t.text.muted}
          autoCapitalize="none"
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            style={[st.input, { flex: 1 }]}
            value={addAmount}
            onChangeText={setAddAmount}
            placeholder="Amount"
            placeholderTextColor={t.text.muted}
            keyboardType="decimal-pad"
          />
          <TextInput
            style={[st.input, { flex: 1 }]}
            value={addLabel}
            onChangeText={setAddLabel}
            placeholder="Label (optional)"
            placeholderTextColor={t.text.muted}
          />
        </View>

        <View style={st.tokenRow}>
          {SUPPORTED_TOKENS.map((tok) => (
            <TouchableOpacity
              key={tok}
              style={[st.tokenChip, addToken === tok && st.tokenChipActive]}
              onPress={() => setAddToken(tok)}
            >
              <Text style={[st.tokenText, addToken === tok && st.tokenTextActive]}>{tok}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={st.addBtn} onPress={handleAddRecipient}>
          <Text style={st.addBtnText}>+ Add Recipient</Text>
        </TouchableOpacity>

        {/* Recipients List */}
        <Text style={st.section}>
          {recipients.length} Recipient{recipients.length !== 1 ? 's' : ''}
        </Text>

        {recipients.length === 0 && (
          <Text style={st.emptyText}>No recipients yet. Add addresses above or import CSV.</Text>
        )}

        {recipients.map((r) => (
          <View key={r.id} style={st.recipientCard}>
            <View style={st.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                {r.label && <Text style={st.labelText}>{r.label}</Text>}
                <Text style={st.addressText} numberOfLines={1}>{r.address}</Text>
              </View>
              <Text style={st.amountText}>{r.amount} {r.token}</Text>
            </View>
            <TouchableOpacity style={st.removeBtn} onPress={() => handleRemove(r.id)}>
              <Text style={st.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}

        {recipients.length > 0 && (
          <>
            <TouchableOpacity style={st.secondaryBtn} onPress={() => setBatchView('preview')}>
              <Text style={st.btnText}>Preview & Send</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Use Cases */}
        <Text style={st.section}>Use Cases</Text>
        {[
          { label: 'Payroll', text: 'Send salaries to multiple team members in one batch.' },
          { label: 'Airdrops', text: 'Distribute tokens to a list of community members.' },
          { label: 'Bulk Gratitude', text: 'Send OTK gratitude to multiple contributors at once.' },
          { label: 'Reimbursements', text: 'Process expense reimbursements for your organization.' },
        ].map((uc) => (
          <View key={uc.label} style={st.useCaseCard}>
            <Text style={st.useCaseLabel}>{uc.label}</Text>
            <Text style={st.useCaseText}>{uc.text}</Text>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
