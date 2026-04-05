/**
 * Transaction Confirmation — Security gate before any send/swap/bridge.
 * Shows details + requires biometric or PIN before signing.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { authManager } from '../core/auth/auth';
import { decodeTransaction, type DecodedTransaction } from '../core/transactions/decoder';
import { PinPad } from '../components/PinPad';
import { useTheme } from '../hooks/useTheme';
import { TransactionPipeline, getPipelineSteps, type PipelineStep, type StepStatus } from '../components/TransactionPipeline';
import type { Theme } from '../utils/theme';
import { fonts } from '../utils/theme';

type FeePriority = 'slow' | 'medium' | 'fast';

interface TxDetails {
  type: 'send' | 'swap' | 'bridge';
  fromSymbol: string;
  fromAmount: string;
  toSymbol?: string;
  toAmount?: string;
  recipient?: string;
  fee?: string;
  route?: string;
  /** Swap provider ID for pipeline display (e.g. 'ow-orderbook', 'ext-thorchain') */
  swapProviderId?: string;
  /** Swap provider name for display */
  swapProviderName?: string;
  /** Fee estimates for priority selector */
  feeEstimates?: {
    slow: { fee: string; time: string };
    medium: { fee: string; time: string };
    fast: { fee: string; time: string };
  };
  /** Raw transaction data for simulation/decoding */
  txData?: { chain: string; to?: string; value?: string; data?: string };
}

interface Props {
  tx: TxDetails;
  onConfirm: (vaultPassword?: string, onProgress?: (update: { stepId: string; status: StepStatus; detail?: string; info?: string }) => void) => Promise<void>;
  onCancel: () => void;
}

export const ConfirmTransactionScreen = React.memo(({ tx, onConfirm, onCancel }: Props) => {
  const [step, setStep] = useState<'review' | 'auth' | 'executing'>('review');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([]);
  const [executionDone, setExecutionDone] = useState(false);
  const [feePriority, setFeePriority] = useState<FeePriority>('medium');
  const t = useTheme();

  // Initialize pipeline steps when we have a swap provider
  const initPipeline = useCallback(() => {
    if (tx.swapProviderId && tx.toSymbol) {
      const steps = getPipelineSteps(tx.swapProviderId, tx.fromSymbol, tx.toSymbol);
      setPipelineSteps(steps);
      return steps;
    }
    return [];
  }, [tx]);

  // Progress callback that updates pipeline steps in real time
  const handleProgress = useCallback((update: { stepId: string; status: StepStatus; detail?: string; info?: string }) => {
    setPipelineSteps(prev => prev.map(s =>
      s.id === update.stepId
        ? { ...s, status: update.status, ...(update.detail !== undefined ? { detail: update.detail } : {}), ...(update.info !== undefined ? { info: update.info } : {}) }
        : s
    ));
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
    typeBadge: { alignSelf: 'center', paddingVertical: 6, paddingHorizontal: 20, borderRadius: 20, marginBottom: 16 },
    typeText: { fontSize: fonts.md, fontWeight: fonts.bold },
    title: { color: t.text.primary, fontSize: fonts.xxl, fontWeight: fonts.heavy, textAlign: 'center', marginBottom: 24 },
    amountCard: { backgroundColor: t.bg.card, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16 },
    amountLabel: { color: t.text.muted, fontSize: fonts.sm, textTransform: 'uppercase', letterSpacing: 1 },
    amount: { color: t.text.primary, fontSize: fonts.xxxl, fontWeight: fonts.heavy, marginTop: 4 },
    arrow: { color: t.text.muted, fontSize: fonts.xl, marginVertical: 8 },
    detailsCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 4, marginBottom: 16 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: t.border },
    detailLabel: { color: t.text.muted, fontSize: fonts.md },
    detailValue: { color: t.text.secondary, fontSize: fonts.md, maxWidth: '60%', textAlign: 'right' },
    warning: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginBottom: 24, lineHeight: 18 },
    confirmBtn: { borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
    confirmText: { color: '#ffffff', fontSize: fonts.lg, fontWeight: fonts.bold },
    cancelBtn: { paddingVertical: 16, alignItems: 'center' },
    cancelText: { color: t.text.muted, fontSize: fonts.lg },
    executing: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    executingText: { color: t.text.secondary, fontSize: fonts.lg, marginTop: 16 },
  }), [t]);

  const DetailRow = useMemo(() => {
    return React.memo(({ label, value }: { label: string; value: string }) => (
      <View style={s.detailRow}>
        <Text style={s.detailLabel}>{label}</Text>
        <Text style={s.detailValue}>{value}</Text>
      </View>
    ));
  }, [s]);

  const executeWithPassword = useCallback(async (password?: string) => {
    initPipeline();
    setStep('executing');
    setExecutionDone(false);
    try {
      await onConfirm(password, handleProgress);
      setExecutionDone(true);
    } catch {
      setExecutionDone(true);
    }
  }, [onConfirm, initPipeline, handleProgress]);

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

  // ─── Executing (with pipeline) ───
  if (step === 'executing') {
    const hasPipeline = pipelineSteps.length > 0;
    return (
      <SafeAreaView style={s.container}>
        {hasPipeline ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            <TransactionPipeline
              steps={pipelineSteps}
              fromSymbol={tx.fromSymbol}
              toSymbol={tx.toSymbol ?? ''}
              amount={tx.fromAmount}
              provider={tx.swapProviderName ?? tx.route ?? 'Swap'}
            />
            {executionDone && (
              <TouchableOpacity
                style={[s.confirmBtn, { marginHorizontal: 20, marginTop: 20, marginBottom: 40, backgroundColor: t.accent.blue }]}
                onPress={onCancel}
              >
                <Text style={s.confirmText}>Done</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        ) : (
          <View style={s.executing}>
            <ActivityIndicator color={t.accent.green} size="large" />
            <Text style={s.executingText}>Processing transaction...</Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // ─── Review ───
  const typeLabel = tx.type === 'send' ? 'Send' : tx.type === 'swap' ? 'Swap' : 'Bridge';
  const typeColor = tx.type === 'send' ? t.accent.orange : tx.type === 'swap' ? t.accent.blue : t.accent.purple;

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
          {tx.fee && !tx.feeEstimates && <DetailRow label="Network Fee" value={tx.fee} />}
          {tx.route && <DetailRow label="Route" value={tx.route} />}
        </View>

        {/* Fee Priority Selector */}
        {tx.feeEstimates && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: t.text.muted, fontSize: fonts.sm, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 8 }}>
              Fee Priority
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {([
                { key: 'slow' as FeePriority, label: 'Slow', icon: '🐢', data: tx.feeEstimates.slow },
                { key: 'medium' as FeePriority, label: 'Medium', icon: '⚡', data: tx.feeEstimates.medium },
                { key: 'fast' as FeePriority, label: 'Fast', icon: '🚀', data: tx.feeEstimates.fast },
              ]).map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setFeePriority(opt.key)}
                  style={{
                    flex: 1, padding: 12, borderRadius: 12,
                    backgroundColor: feePriority === opt.key ? t.accent.green + '20' : t.bg.card,
                    borderWidth: 1,
                    borderColor: feePriority === opt.key ? t.accent.green : 'transparent',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: fonts.lg }}>{opt.icon}</Text>
                  <Text style={{ color: feePriority === opt.key ? t.accent.green : t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold as any, marginTop: 2 }}>
                    {opt.label}
                  </Text>
                  <Text style={{ color: t.text.muted, fontSize: fonts.xs, marginTop: 2 }}>{opt.data.fee}</Text>
                  <Text style={{ color: t.text.muted, fontSize: fonts.xs }}>{opt.data.time}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Transaction Simulation */}
        {tx.txData && (() => {
          const decoded = decodeTransaction(tx.txData);
          const riskColor = decoded.risk === 'danger' ? t.accent.red
            : decoded.risk === 'warning' ? t.accent.yellow
            : t.accent.green;
          return (
            <View style={{ backgroundColor: riskColor + '10', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: riskColor + '40' }}>
              <Text style={{ color: riskColor, fontSize: fonts.sm, fontWeight: fonts.bold as any, marginBottom: 6 }}>
                {decoded.risk === 'danger' ? 'DANGER' : decoded.risk === 'warning' ? 'REVIEW CAREFULLY' : 'SAFE'}
              </Text>
              {decoded.actions.map((action, i) => (
                <Text key={i} style={{ color: t.text.secondary, fontSize: fonts.sm, lineHeight: 18 }}>
                  • {action}
                </Text>
              ))}
              {decoded.warnings.map((w, i) => (
                <Text key={`w${i}`} style={{ color: riskColor, fontSize: fonts.xs, marginTop: 4, lineHeight: 16 }}>
                  ⚠ {w}
                </Text>
              ))}
            </View>
          );
        })()}

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
