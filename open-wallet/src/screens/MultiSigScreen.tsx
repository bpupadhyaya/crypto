/**
 * Multi-Signature Wallet Screen — Create, manage, and sign multi-sig transactions.
 *
 * Features:
 * - Create M-of-N multi-sig wallets with co-signers
 * - View and sign/reject pending transactions
 * - Transaction history for executed multi-sig txs
 * - Demo mode with sample wallet and pending txs
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';
import {
  type MultiSigWallet,
  type PendingMultiSigTx,
  type ExecutedMultiSigTx,
  getMultiSigWallets,
  createMultiSigWallet,
  deleteMultiSigWallet,
  proposeTx,
  signTx,
  rejectTx,
  getPendingTxs,
  getExecutedTxs,
  getDemoMultiSigWallet,
  getDemoPendingTxs,
  getDemoExecutedTxs,
} from '../core/multisig/multisig';

interface Props {
  onClose: () => void;
}

type Tab = 'wallets' | 'pending' | 'history' | 'create';

export const MultiSigScreen = React.memo(({ onClose }: Props) => {
  const t = useTheme();
  const { demoMode } = useWalletStore();
  const [tab, setTab] = useState<Tab>('wallets');
  const [loading, setLoading] = useState(true);
  const [wallets, setWallets] = useState<MultiSigWallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<MultiSigWallet | null>(null);
  const [pendingTxs, setPendingTxs] = useState<PendingMultiSigTx[]>([]);
  const [executedTxs, setExecutedTxs] = useState<ExecutedMultiSigTx[]>([]);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newThreshold, setNewThreshold] = useState('2');
  const [newSigners, setNewSigners] = useState('');

  // Propose form state
  const [showPropose, setShowPropose] = useState(false);
  const [propType, setPropType] = useState<'send' | 'swap' | 'stake'>('send');
  const [propDesc, setPropDesc] = useState('');
  const [propAmount, setPropAmount] = useState('');
  const [propToken, setPropToken] = useState('ETH');

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    scroll: { padding: 20, paddingBottom: 40 },
    title: { color: t.text.primary, fontSize: 24, fontWeight: '800', marginBottom: 4 },
    subtitle: { color: t.text.muted, fontSize: 14, marginBottom: 20 },
    tabRow: { flexDirection: 'row', marginBottom: 20, gap: 8 },
    tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: t.bg.card },
    tabActive: { backgroundColor: t.accent.green },
    tabText: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: t.bg.primary },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    cardTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 4 },
    cardSub: { color: t.text.muted, fontSize: 13, marginBottom: 8 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    label: { color: t.text.secondary, fontSize: 13 },
    value: { color: t.text.primary, fontSize: 13, fontWeight: '600' },
    badge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 8, marginLeft: 8 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    signerTag: { backgroundColor: t.border, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, marginRight: 6, marginBottom: 6 },
    signerText: { color: t.text.secondary, fontSize: 12 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 14, marginBottom: 12, borderWidth: 1, borderColor: t.border },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: '600', marginBottom: 6 },
    btnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
    btnGreen: { flex: 1, backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    btnRed: { flex: 1, backgroundColor: t.accent.red + '20', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    btnBlue: { backgroundColor: t.accent.blue, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
    btnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    btnTextRed: { color: t.accent.red, fontSize: 14, fontWeight: '700' },
    progressBar: { height: 6, backgroundColor: t.border, borderRadius: 3, marginTop: 8 },
    progressFill: { height: 6, borderRadius: 3 },
    empty: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40 },
    backBtn: { paddingVertical: 20, alignItems: 'center' },
    backText: { color: t.accent.blue, fontSize: 16 },
    divider: { height: 1, backgroundColor: t.border, marginVertical: 10 },
    demoTag: { backgroundColor: t.accent.purple + '20', borderRadius: 8, paddingVertical: 2, paddingHorizontal: 8, alignSelf: 'flex-start', marginBottom: 12 },
    demoText: { color: t.accent.purple, fontSize: 11, fontWeight: '700' },
    typeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    typeBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8, backgroundColor: t.border },
    typeBtnActive: { backgroundColor: t.accent.blue },
    typeText: { color: t.text.secondary, fontSize: 13 },
    typeTextActive: { color: '#fff' },
  }), [t]);

  // ─── Load Data ───

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (demoMode) {
        setWallets([getDemoMultiSigWallet()]);
        setPendingTxs(getDemoPendingTxs());
        setExecutedTxs(getDemoExecutedTxs());
        if (!selectedWallet) setSelectedWallet(getDemoMultiSigWallet());
      } else {
        const ws = await getMultiSigWallets();
        setWallets(ws);
        if (ws.length > 0) {
          const sel = selectedWallet && ws.find((w) => w.id === selectedWallet.id)
            ? selectedWallet : ws[0];
          setSelectedWallet(sel);
          const [pend, exec] = await Promise.all([
            getPendingTxs(sel.id),
            getExecutedTxs(sel.id),
          ]);
          setPendingTxs(pend);
          setExecutedTxs(exec);
        }
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load');
    }
    setLoading(false);
  }, [demoMode, selectedWallet]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Handlers ───

  const handleCreate = async () => {
    const signers = newSigners.split('\n').map((s) => s.trim()).filter(Boolean);
    const threshold = parseInt(newThreshold, 10);
    if (!newName.trim()) { Alert.alert('Error', 'Enter a wallet name'); return; }
    if (isNaN(threshold) || threshold < 1) { Alert.alert('Error', 'Invalid threshold'); return; }
    if (signers.length < 2) { Alert.alert('Error', 'Add at least 2 signer addresses (one per line)'); return; }
    if (threshold > signers.length) { Alert.alert('Error', `Threshold (${threshold}) exceeds signers (${signers.length})`); return; }

    try {
      await createMultiSigWallet({ name: newName, threshold, signers });
      setNewName(''); setNewThreshold('2'); setNewSigners('');
      setTab('wallets');
      await loadData();
      Alert.alert('Created', `Multi-sig wallet "${newName}" created`);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleSign = async (txId: string) => {
    if (demoMode) {
      Alert.alert('Demo', 'Transaction signed (demo mode)');
      setPendingTxs((prev) => prev.map((tx) =>
        tx.id === txId ? { ...tx, signatures: [...tx.signatures, 'you'] } : tx,
      ));
      return;
    }
    try {
      await signTx(txId, 'your_address'); // In production, use actual signer
      await loadData();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleReject = async (txId: string) => {
    if (demoMode) {
      Alert.alert('Demo', 'Transaction rejected (demo mode)');
      setPendingTxs((prev) => prev.filter((tx) => tx.id !== txId));
      return;
    }
    try {
      await rejectTx(txId, 'your_address');
      await loadData();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed');
    }
  };

  const handlePropose = async () => {
    if (!selectedWallet) return;
    if (!propDesc.trim()) { Alert.alert('Error', 'Enter a description'); return; }
    if (demoMode) {
      Alert.alert('Demo', 'Transaction proposed (demo mode)');
      setShowPropose(false);
      return;
    }
    try {
      await proposeTx(selectedWallet.id, {
        type: propType,
        description: propDesc,
        amount: propAmount ? parseFloat(propAmount) : undefined,
        token: propToken,
        createdBy: 'your_address',
      });
      setPropDesc(''); setPropAmount('');
      setShowPropose(false);
      await loadData();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleDelete = (wallet: MultiSigWallet) => {
    Alert.alert('Delete Wallet', `Remove "${wallet.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteMultiSigWallet(wallet.id);
            await loadData();
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed');
          }
        },
      },
    ]);
  };

  // ─── Time Helpers ───

  const formatTime = (ms: number) => {
    const h = Math.floor(ms / 3600_000);
    if (h > 24) return `${Math.floor(h / 24)}d left`;
    if (h > 0) return `${h}h left`;
    return `${Math.floor(ms / 60_000)}m left`;
  };

  const formatDate = (ts: number) => new Date(ts).toLocaleDateString();

  // ─── Render ───

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <ActivityIndicator size="large" color={t.accent.green} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Text style={s.title}>Multi-Sig Wallets</Text>
        <Text style={s.subtitle}>Shared wallets requiring multiple signatures</Text>

        {demoMode && (
          <View style={s.demoTag}>
            <Text style={s.demoText}>DEMO MODE</Text>
          </View>
        )}

        {/* Tabs */}
        <View style={s.tabRow}>
          {(['wallets', 'pending', 'history', 'create'] as Tab[]).map((t2) => (
            <TouchableOpacity
              key={t2}
              style={[s.tab, tab === t2 && s.tabActive]}
              onPress={() => setTab(t2)}
            >
              <Text style={[s.tabText, tab === t2 && s.tabTextActive]}>
                {t2 === 'wallets' ? 'Wallets' : t2 === 'pending' ? `Pending (${pendingTxs.length})` : t2 === 'history' ? 'History' : '+ Create'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── Wallets Tab ─── */}
        {tab === 'wallets' && (
          <>
            {wallets.length === 0 ? (
              <Text style={s.empty}>No multi-sig wallets yet. Create one to get started.</Text>
            ) : wallets.map((w) => (
              <TouchableOpacity
                key={w.id}
                style={[s.card, selectedWallet?.id === w.id && { borderWidth: 2, borderColor: t.accent.green }]}
                onPress={() => { setSelectedWallet(w); setTab('pending'); }}
              >
                <Text style={s.cardTitle}>{w.name}</Text>
                <Text style={s.cardSub}>{w.threshold}-of-{w.signers.length} signatures required</Text>
                <View style={s.divider} />
                <Text style={[s.label, { marginBottom: 6 }]}>Co-signers:</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {w.signers.map((addr, i) => (
                    <View key={i} style={s.signerTag}>
                      <Text style={s.signerText}>{addr}</Text>
                    </View>
                  ))}
                </View>
                <View style={s.row}>
                  <Text style={s.label}>Created</Text>
                  <Text style={s.value}>{formatDate(w.createdAt)}</Text>
                </View>
                {!demoMode && (
                  <TouchableOpacity
                    style={[s.btnRed, { marginTop: 8 }]}
                    onPress={() => handleDelete(w)}
                  >
                    <Text style={s.btnTextRed}>Delete Wallet</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* ─── Pending Tab ─── */}
        {tab === 'pending' && (
          <>
            {selectedWallet && (
              <View style={[s.card, { backgroundColor: t.accent.blue + '10' }]}>
                <Text style={s.cardTitle}>{selectedWallet.name}</Text>
                <Text style={s.cardSub}>{selectedWallet.threshold}-of-{selectedWallet.signers.length}</Text>
              </View>
            )}

            {!showPropose && (
              <TouchableOpacity style={s.btnBlue} onPress={() => setShowPropose(true)}>
                <Text style={s.btnText}>+ Propose Transaction</Text>
              </TouchableOpacity>
            )}

            {showPropose && (
              <View style={[s.card, { marginTop: 12 }]}>
                <Text style={s.cardTitle}>New Proposal</Text>
                <View style={s.typeRow}>
                  {(['send', 'swap', 'stake'] as const).map((tp) => (
                    <TouchableOpacity
                      key={tp}
                      style={[s.typeBtn, propType === tp && s.typeBtnActive]}
                      onPress={() => setPropType(tp)}
                    >
                      <Text style={[s.typeText, propType === tp && s.typeTextActive]}>
                        {tp.charAt(0).toUpperCase() + tp.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={s.inputLabel}>Description</Text>
                <TextInput style={s.input} value={propDesc} onChangeText={setPropDesc}
                  placeholder="e.g., Send 0.5 ETH to treasury" placeholderTextColor={t.text.muted} />
                <Text style={s.inputLabel}>Amount (optional)</Text>
                <TextInput style={s.input} value={propAmount} onChangeText={setPropAmount}
                  placeholder="0.0" placeholderTextColor={t.text.muted} keyboardType="decimal-pad" />
                <Text style={s.inputLabel}>Token</Text>
                <TextInput style={s.input} value={propToken} onChangeText={setPropToken}
                  placeholder="ETH" placeholderTextColor={t.text.muted} />
                <View style={s.btnRow}>
                  <TouchableOpacity style={s.btnRed} onPress={() => setShowPropose(false)}>
                    <Text style={s.btnTextRed}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.btnGreen} onPress={handlePropose}>
                    <Text style={s.btnText}>Propose</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {pendingTxs.length === 0 ? (
              <Text style={s.empty}>No pending transactions</Text>
            ) : pendingTxs.map((tx) => {
              const timeLeft = tx.expiresAt - Date.now();
              const sigProgress = tx.signatures.length / tx.requiredSignatures;
              return (
                <View key={tx.id} style={[s.card, { marginTop: 12 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={s.cardTitle}>{tx.type.toUpperCase()}</Text>
                    <View style={[s.badge, { backgroundColor: tx.type === 'send' ? t.accent.blue + '20' : tx.type === 'swap' ? t.accent.purple + '20' : t.accent.green + '20' }]}>
                      <Text style={[s.badgeText, { color: tx.type === 'send' ? t.accent.blue : tx.type === 'swap' ? t.accent.purple : t.accent.green }]}>
                        {tx.type}
                      </Text>
                    </View>
                  </View>
                  <Text style={s.cardSub}>{tx.description}</Text>
                  <View style={s.row}>
                    <Text style={s.label}>Signatures</Text>
                    <Text style={s.value}>{tx.signatures.length} / {tx.requiredSignatures}</Text>
                  </View>
                  <View style={s.progressBar}>
                    <View style={[s.progressFill, {
                      width: `${Math.min(100, sigProgress * 100)}%`,
                      backgroundColor: sigProgress >= 1 ? t.accent.green : t.accent.yellow,
                    }]} />
                  </View>
                  <View style={[s.row, { marginTop: 8 }]}>
                    <Text style={s.label}>Proposed by</Text>
                    <Text style={s.value}>{tx.createdBy}</Text>
                  </View>
                  <View style={s.row}>
                    <Text style={s.label}>Expires</Text>
                    <Text style={[s.value, { color: timeLeft < 3600_000 ? t.accent.red : t.text.primary }]}>
                      {timeLeft > 0 ? formatTime(timeLeft) : 'Expired'}
                    </Text>
                  </View>
                  {tx.signatures.length > 0 && (
                    <>
                      <View style={s.divider} />
                      <Text style={[s.label, { marginBottom: 4 }]}>Signed by:</Text>
                      {tx.signatures.map((addr, i) => (
                        <Text key={i} style={[s.signerText, { marginBottom: 2 }]}>{addr}</Text>
                      ))}
                    </>
                  )}
                  <View style={s.btnRow}>
                    <TouchableOpacity style={s.btnRed} onPress={() => handleReject(tx.id)}>
                      <Text style={s.btnTextRed}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.btnGreen} onPress={() => handleSign(tx.id)}>
                      <Text style={s.btnText}>Sign</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* ─── History Tab ─── */}
        {tab === 'history' && (
          <>
            {executedTxs.length === 0 ? (
              <Text style={s.empty}>No executed multi-sig transactions yet</Text>
            ) : executedTxs.map((tx) => (
              <View key={tx.id} style={s.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={s.cardTitle}>{tx.type.toUpperCase()}</Text>
                  <View style={[s.badge, { backgroundColor: t.accent.green + '20' }]}>
                    <Text style={[s.badgeText, { color: t.accent.green }]}>Executed</Text>
                  </View>
                </View>
                <Text style={s.cardSub}>{tx.description}</Text>
                <View style={s.row}>
                  <Text style={s.label}>Signatures</Text>
                  <Text style={s.value}>{tx.signatures.length} / {tx.requiredSignatures}</Text>
                </View>
                <View style={s.row}>
                  <Text style={s.label}>Executed</Text>
                  <Text style={s.value}>{formatDate(tx.executedAt)}</Text>
                </View>
                <View style={s.divider} />
                <Text style={[s.label, { marginBottom: 4 }]}>Signed by:</Text>
                {tx.signatures.map((addr, i) => (
                  <Text key={i} style={[s.signerText, { marginBottom: 2 }]}>{addr}</Text>
                ))}
              </View>
            ))}
          </>
        )}

        {/* ─── Create Tab ─── */}
        {tab === 'create' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Create Multi-Sig Wallet</Text>
            <Text style={[s.cardSub, { marginBottom: 16 }]}>
              Add co-signers and set the signature threshold
            </Text>

            <Text style={s.inputLabel}>Wallet Name</Text>
            <TextInput style={s.input} value={newName} onChangeText={setNewName}
              placeholder="e.g., Family Vault" placeholderTextColor={t.text.muted} />

            <Text style={s.inputLabel}>Required Signatures (M)</Text>
            <TextInput style={s.input} value={newThreshold} onChangeText={setNewThreshold}
              placeholder="2" placeholderTextColor={t.text.muted} keyboardType="number-pad" />

            <Text style={s.inputLabel}>Co-signer Addresses (one per line)</Text>
            <TextInput
              style={[s.input, { height: 120, textAlignVertical: 'top' }]}
              value={newSigners}
              onChangeText={setNewSigners}
              placeholder={'0xAlice...a1b2\n0xBob...c3d4\n0xCharlie...e5f6'}
              placeholderTextColor={t.text.muted}
              multiline
            />

            {newSigners.split('\n').filter(Boolean).length > 0 && (
              <Text style={[s.label, { marginBottom: 12 }]}>
                Configuration: {newThreshold}-of-{newSigners.split('\n').filter(Boolean).length}
              </Text>
            )}

            <TouchableOpacity style={s.btnGreen} onPress={handleCreate}>
              <Text style={s.btnText}>Create Wallet</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      <TouchableOpacity style={s.backBtn} onPress={onClose}>
        <Text style={s.backText}>Back to Settings</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
});
