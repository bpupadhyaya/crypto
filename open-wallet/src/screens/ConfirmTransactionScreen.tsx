/**
 * Transaction Confirmation — Security gate before any send/swap/bridge.
 * Shows details + requires biometric or PIN before signing.
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { authManager } from '../core/auth/auth';
import { PinPad } from '../components/PinPad';

interface TxDetails {
  type: 'send' | 'swap' | 'bridge';
  fromSymbol: string;
  fromAmount: string;
  toSymbol?: string;
  toAmount?: string;
  recipient?: string;
  fee?: string;
  route?: string;
}

interface Props {
  tx: TxDetails;
  onConfirm: (vaultPassword?: string) => Promise<void>;
  onCancel: () => void;
}

export const ConfirmTransactionScreen = React.memo(({ tx, onConfirm, onCancel }: Props) => {
  const [step, setStep] = useState<'review' | 'auth' | 'executing'>('review');
  const [pinError, setPinError] = useState<string | null>(null);

  const executeWithPassword = useCallback(async (password?: string) => {
    setStep('executing');
    try {
      await onConfirm(password);
    } catch (err) {
      Alert.alert('Failed', err instanceof Error ? err.message : 'Transaction failed');
      setStep('review');
    }
  }, [onConfirm]);

  const handleConfirm = useCallback(async () => {
    // Try biometric first
    const bioResult = await authManager.authenticateWithBiometric('Confirm transaction');
    if (bioResult.success) {
      // Biometric succeeded — try to get vault password from store
      const store = (await import('../store/walletStore')).useWalletStore.getState();
      await executeWithPassword(store.tempVaultPassword ?? undefined);
      return;
    }
    // Biometric failed or not available — show PIN
    setStep('auth');
  }, [executeWithPassword]);

  const handlePinAuth = useCallback(async (pin: string) => {
    try {
      const valid = await authManager.verifyPin(pin);
      if (valid) {
        setPinError(null);
        // Use PIN to decrypt vault password
        const vaultPassword = await authManager.getVaultPassword(pin);
        await executeWithPassword(vaultPassword ?? undefined);
      } else {
        setPinError('Wrong PIN');
      }
    } catch (err) {
      setPinError(err instanceof Error ? err.message : 'Auth failed');
    }
  }, [executeWithPassword]);

  // ─── PIN Auth ───
  if (step === 'auth') {
    return (
      <SafeAreaView style={s.container}>
        <PinPad
          title="Confirm Transaction"
          subtitle="Enter PIN to authorize"
          onComplete={handlePinAuth}
          error={pinError}
        />
        <TouchableOpacity style={s.cancelBtn} onPress={onCancel}>
          <Text style={s.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ─── Executing ───
  if (step === 'executing') {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.executing}>
          <ActivityIndicator color="#22c55e" size="large" />
          <Text style={s.executingText}>Processing transaction...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Review ───
  const typeLabel = tx.type === 'send' ? 'Send' : tx.type === 'swap' ? 'Swap' : 'Bridge';
  const typeColor = tx.type === 'send' ? '#f97316' : tx.type === 'swap' ? '#3b82f6' : '#8b5cf6';

  return (
    <SafeAreaView style={s.container}>
      <View style={s.content}>
        <View style={[s.typeBadge, { backgroundColor: typeColor + '20' }]}>
          <Text style={[s.typeText, { color: typeColor }]}>{typeLabel}</Text>
        </View>

        <Text style={s.title}>Confirm Transaction</Text>

        {/* Amount */}
        <View style={s.amountCard}>
          <Text style={s.amountLabel}>You {tx.type === 'send' ? 'send' : 'pay'}</Text>
          <Text style={s.amount}>{tx.fromAmount} {tx.fromSymbol}</Text>
          {tx.toSymbol && (
            <>
              <Text style={s.arrow}>↓</Text>
              <Text style={s.amountLabel}>You receive</Text>
              <Text style={s.amount}>{tx.toAmount} {tx.toSymbol}</Text>
            </>
          )}
        </View>

        {/* Details */}
        <View style={s.detailsCard}>
          {tx.recipient && (
            <DetailRow label="To" value={`${tx.recipient.slice(0, 12)}...${tx.recipient.slice(-8)}`} />
          )}
          {tx.fee && <DetailRow label="Network Fee" value={tx.fee} />}
          {tx.route && <DetailRow label="Route" value={tx.route} />}
        </View>

        <Text style={s.warning}>
          This transaction is irreversible. Verify all details before confirming.
        </Text>

        {/* Buttons */}
        <TouchableOpacity style={[s.confirmBtn, { backgroundColor: typeColor }]} onPress={handleConfirm}>
          <Text style={s.confirmText}>Confirm & Sign</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.cancelBtn} onPress={onCancel}>
          <Text style={s.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
});

const DetailRow = React.memo(({ label, value }: { label: string; value: string }) => (
  <View style={s.detailRow}>
    <Text style={s.detailLabel}>{label}</Text>
    <Text style={s.detailValue}>{value}</Text>
  </View>
));

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  typeBadge: { alignSelf: 'center', paddingVertical: 6, paddingHorizontal: 20, borderRadius: 20, marginBottom: 16 },
  typeText: { fontSize: 14, fontWeight: '700' },
  title: { color: '#f0f0f5', fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 24 },
  amountCard: { backgroundColor: '#16161f', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16 },
  amountLabel: { color: '#606070', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  amount: { color: '#f0f0f5', fontSize: 28, fontWeight: '800', marginTop: 4 },
  arrow: { color: '#606070', fontSize: 20, marginVertical: 8 },
  detailsCard: { backgroundColor: '#16161f', borderRadius: 16, padding: 4, marginBottom: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  detailLabel: { color: '#606070', fontSize: 14 },
  detailValue: { color: '#a0a0b0', fontSize: 14, maxWidth: '60%', textAlign: 'right' },
  warning: { color: '#606070', fontSize: 12, textAlign: 'center', marginBottom: 24, lineHeight: 18 },
  confirmBtn: { borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  confirmText: { color: '#ffffff', fontSize: 17, fontWeight: '700' },
  cancelBtn: { paddingVertical: 16, alignItems: 'center' },
  cancelText: { color: '#606070', fontSize: 16 },
  executing: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  executingText: { color: '#a0a0b0', fontSize: 16, marginTop: 16 },
});
