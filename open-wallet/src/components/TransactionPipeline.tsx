/**
 * Transaction Pipeline — Shows the end-to-end path of a swap transaction.
 * Each step displays real-time status with color coding:
 *   - Gray:   pending (not started)
 *   - Blue:   in-progress (currently executing)
 *   - Green:  complete (success)
 *   - Red:    failed (error)
 *   - Orange: delayed / warning
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../hooks/useTheme';

export type StepStatus = 'pending' | 'active' | 'complete' | 'failed' | 'delayed';

export interface PipelineStep {
  id: string;
  label: string;
  detail?: string; // shown when active or complete
  status: StepStatus;
  /** Optional sub-label like tx hash or error message */
  info?: string;
}

interface Props {
  steps: PipelineStep[];
  title?: string;
  fromSymbol: string;
  toSymbol: string;
  amount: string;
  provider: string;
}

export function TransactionPipeline({ steps, title, fromSymbol, toSymbol, amount, provider }: Props) {
  const t = useTheme();

  const colors = useMemo(() => ({
    pending:  { bg: t.text.muted + '15', fg: t.text.muted,    icon: t.text.muted },
    active:   { bg: t.accent.blue + '20', fg: t.accent.blue,  icon: t.accent.blue },
    complete: { bg: t.accent.green + '20', fg: t.accent.green, icon: t.accent.green },
    failed:   { bg: '#ef444420',           fg: '#ef4444',      icon: '#ef4444' },
    delayed:  { bg: t.accent.orange + '20', fg: t.accent.orange, icon: t.accent.orange },
  }), [t]);

  const statusIcons: Record<StepStatus, string> = {
    pending:  '○',
    active:   '',  // will use ActivityIndicator
    complete: '✓',
    failed:   '✗',
    delayed:  '⏳',
  };

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
    header: { alignItems: 'center', marginBottom: 24 },
    title: { color: t.text.primary, fontSize: 18, fontWeight: '700' },
    subtitle: { color: t.text.muted, fontSize: 13, marginTop: 4 },
    swapSummary: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      backgroundColor: t.bg.card, borderRadius: 12, padding: 14, marginBottom: 20, gap: 8,
    },
    swapToken: { color: t.text.primary, fontSize: 16, fontWeight: '700' },
    swapArrow: { color: t.text.muted, fontSize: 16 },
    providerBadge: {
      alignSelf: 'center', backgroundColor: t.accent.blue + '15',
      borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 20,
    },
    providerText: { color: t.accent.blue, fontSize: 12, fontWeight: '600' },
    // Pipeline
    stepRow: { flexDirection: 'row', minHeight: 56 },
    lineCol: { width: 32, alignItems: 'center' },
    dot: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    dotText: { fontSize: 13, fontWeight: '800' },
    line: { width: 2, flex: 1, marginVertical: 2 },
    contentCol: { flex: 1, paddingLeft: 12, paddingBottom: 16 },
    stepLabel: { fontSize: 14, fontWeight: '600' },
    stepDetail: { fontSize: 12, marginTop: 2, lineHeight: 17 },
    stepInfo: { fontSize: 11, marginTop: 3, fontFamily: 'Courier' },
  }), [t]);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>{title ?? 'Transaction Path'}</Text>
        <Text style={s.subtitle}>Showing every step of your swap</Text>
      </View>

      <View style={s.swapSummary}>
        <Text style={s.swapToken}>{amount} {fromSymbol}</Text>
        <Text style={s.swapArrow}>→</Text>
        <Text style={s.swapToken}>{toSymbol}</Text>
      </View>

      <View style={s.providerBadge}>
        <Text style={s.providerText}>via {provider}</Text>
      </View>

      {steps.map((step, i) => {
        const c = colors[step.status];
        const isLast = i === steps.length - 1;

        return (
          <View key={step.id} style={s.stepRow}>
            {/* Left column: dot + connecting line */}
            <View style={s.lineCol}>
              <View style={[s.dot, { backgroundColor: c.bg }]}>
                {step.status === 'active' ? (
                  <ActivityIndicator size="small" color={c.icon} />
                ) : (
                  <Text style={[s.dotText, { color: c.fg }]}>{statusIcons[step.status]}</Text>
                )}
              </View>
              {!isLast && (
                <View style={[
                  s.line,
                  { backgroundColor: step.status === 'complete' ? colors.complete.fg + '40' : t.text.muted + '20' },
                ]} />
              )}
            </View>

            {/* Right column: label + detail */}
            <View style={s.contentCol}>
              <Text style={[s.stepLabel, { color: step.status === 'pending' ? t.text.muted : c.fg }]}>
                {step.label}
              </Text>
              {step.detail && step.status !== 'pending' && (
                <Text style={[s.stepDetail, { color: step.status === 'failed' ? c.fg : t.text.muted }]}>
                  {step.detail}
                </Text>
              )}
              {step.info && (
                <Text style={[s.stepInfo, { color: c.fg + 'cc' }]} numberOfLines={1}>
                  {step.info}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ─── Pipeline step definitions per swap provider ───

export type SwapProviderId =
  | 'ow-atomic' | 'ow-dex' | 'ow-orderbook'
  | 'ext-thorchain' | 'ext-1inch' | 'ext-jupiter'
  | 'ext-li.fi-bridge' | 'ext-osmosis-(ibc)';

export function getPipelineSteps(providerId: string, fromSymbol: string, toSymbol: string): PipelineStep[] {
  const isERC20 = ['USDT', 'USDC', 'LINK', 'WBTC', 'DAI'].includes(fromSymbol);

  switch (providerId) {
    case 'ext-thorchain': {
      const steps: PipelineStep[] = [
        { id: 'vault', label: 'Unlock vault & derive keys', status: 'pending' },
        { id: 'quote', label: 'Get THORChain quote', detail: 'Fetching vault address and memo from THORChain', status: 'pending' },
      ];
      if (isERC20) {
        steps.push({ id: 'approve', label: `Approve ${fromSymbol} for THORChain Router`, detail: 'ERC-20 token approval transaction', status: 'pending' });
      }
      steps.push(
        { id: 'build', label: `Build ${fromSymbol} transaction`, detail: fromSymbol === 'BTC' ? 'Creating Bitcoin UTXO transaction with OP_RETURN memo' : `Creating ${fromSymbol === 'SOL' ? 'Solana' : 'Ethereum'} transaction`, status: 'pending' },
        { id: 'sign', label: 'Sign transaction locally', detail: 'Your private key never leaves this device', status: 'pending' },
        { id: 'broadcast', label: `Broadcast to ${fromSymbol === 'BTC' ? 'Bitcoin' : fromSymbol === 'SOL' ? 'Solana' : 'Ethereum'} network`, status: 'pending' },
        { id: 'thorchain', label: 'THORChain processes swap', detail: `Cross-chain swap via THORChain validators`, status: 'pending' },
        { id: 'receive', label: `Receive ${toSymbol} at destination`, detail: 'Funds arrive at your wallet address', status: 'pending' },
      );
      return steps;
    }

    case 'ow-dex':
      return [
        { id: 'vault', label: 'Unlock vault & derive keys', status: 'pending' },
        { id: 'check', label: 'Check Open Chain connectivity', detail: 'Verifying Open Chain RPC is reachable', status: 'pending' },
        { id: 'build', label: 'Build MsgSwap transaction', detail: `Swap ${fromSymbol} → ${toSymbol} via AMM pool`, status: 'pending' },
        { id: 'sign', label: 'Sign with Cosmos signer', detail: 'Signing the Cosmos SDK transaction locally', status: 'pending' },
        { id: 'broadcast', label: 'Broadcast to Open Chain', status: 'pending' },
        { id: 'execute', label: 'AMM pool executes swap', detail: 'Constant product formula (x * y = k)', status: 'pending' },
        { id: 'credit', label: `${toSymbol} credited to your account`, detail: 'Near-zero fees (~0.001 OTK)', status: 'pending' },
      ];

    case 'ow-orderbook':
      return [
        { id: 'vault', label: 'Unlock vault & derive keys', status: 'pending' },
        { id: 'check', label: 'Check Open Chain connectivity', status: 'pending' },
        { id: 'price', label: 'Fetch live prices', detail: `Getting market rate for ${fromSymbol}/${toSymbol}`, status: 'pending' },
        { id: 'build', label: 'Build MsgPlaceLimitOrder', detail: 'Creating limit order with 1% slippage protection', status: 'pending' },
        { id: 'sign', label: 'Sign with Cosmos signer', detail: 'Signing locally — keys never leave device', status: 'pending' },
        { id: 'broadcast', label: 'Broadcast to Open Chain', status: 'pending' },
        { id: 'place', label: 'Order placed in order book', detail: `Your ${fromSymbol} is locked in the order`, status: 'pending' },
        { id: 'fill', label: 'Waiting for order fill', detail: 'Fills when a counterparty matches your price', status: 'pending' },
      ];

    case 'ow-atomic':
      return [
        { id: 'vault', label: 'Unlock vault & derive keys', status: 'pending' },
        { id: 'check', label: 'Check Open Chain connectivity', status: 'pending' },
        { id: 'secret', label: 'Generate HTLC secret', detail: 'Cryptographic secret + hash for atomic swap', status: 'pending' },
        { id: 'build', label: 'Build atomic swap order', detail: `${fromSymbol} → ${toSymbol} via Hash Time-Locked Contract`, status: 'pending' },
        { id: 'sign', label: 'Sign with Cosmos signer', status: 'pending' },
        { id: 'broadcast', label: 'Broadcast to P2P mempool', detail: 'Order visible to all participants on Open Chain', status: 'pending' },
        { id: 'persist', label: 'Persist secret locally', detail: 'Critical for HTLC claim after app restart', status: 'pending' },
        { id: 'match', label: 'Waiting for counterparty match', detail: 'Pure cryptography — zero intermediary', status: 'pending' },
      ];

    case 'ext-1inch': {
      const steps: PipelineStep[] = [
        { id: 'vault', label: 'Unlock vault & derive keys', status: 'pending' },
        { id: 'quote', label: 'Get 1inch swap quote', detail: '1inch DEX aggregator finds best route', status: 'pending' },
      ];
      if (isERC20) {
        steps.push({ id: 'approve', label: `Approve ${fromSymbol} for 1inch Router`, status: 'pending' });
      }
      steps.push(
        { id: 'build', label: 'Build swap transaction', detail: 'Calldata from 1inch API', status: 'pending' },
        { id: 'sign', label: 'Sign transaction locally', status: 'pending' },
        { id: 'broadcast', label: 'Broadcast to Ethereum', status: 'pending' },
        { id: 'receive', label: `Receive ${toSymbol}`, detail: 'Tokens arrive in same transaction', status: 'pending' },
      );
      return steps;
    }

    case 'ext-jupiter':
      return [
        { id: 'vault', label: 'Unlock vault & derive keys', status: 'pending' },
        { id: 'quote', label: 'Get Jupiter quote', detail: 'Jupiter finds best route across Solana DEXes', status: 'pending' },
        { id: 'build', label: 'Build swap transaction', detail: 'Serialized Solana transaction from Jupiter', status: 'pending' },
        { id: 'sign', label: 'Sign Solana transaction', detail: 'Ed25519 signature — keys stay local', status: 'pending' },
        { id: 'broadcast', label: 'Broadcast to Solana', status: 'pending' },
        { id: 'receive', label: `Receive ${toSymbol}`, detail: 'Settles in ~400ms on Solana', status: 'pending' },
      ];

    case 'ext-li.fi-bridge': {
      const steps: PipelineStep[] = [
        { id: 'vault', label: 'Unlock vault & derive keys', status: 'pending' },
        { id: 'route', label: 'Get Li.Fi bridge route', detail: 'Finding optimal cross-chain path', status: 'pending' },
      ];
      if (isERC20) {
        steps.push({ id: 'approve', label: `Approve ${fromSymbol} for bridge`, status: 'pending' });
      }
      steps.push(
        { id: 'build', label: 'Build bridge transaction', status: 'pending' },
        { id: 'sign', label: 'Sign transaction locally', status: 'pending' },
        { id: 'broadcast', label: 'Broadcast to source chain', status: 'pending' },
        { id: 'bridge', label: 'Bridge processing', detail: 'Cross-chain transfer (5-30 minutes)', status: 'pending' },
        { id: 'receive', label: `Receive ${toSymbol} on destination chain`, status: 'pending' },
      );
      return steps;
    }

    case 'ext-osmosis-(ibc)':
      return [
        { id: 'vault', label: 'Unlock vault & derive keys', status: 'pending' },
        { id: 'build', label: 'Build IBC transfer', detail: `Sending ${fromSymbol} to Osmosis via IBC`, status: 'pending' },
        { id: 'sign', label: 'Sign with Cosmos signer', status: 'pending' },
        { id: 'broadcast', label: 'Broadcast IBC transfer', status: 'pending' },
        { id: 'osmosis', label: 'Osmosis DEX executes swap', detail: 'Swap on Osmosis AMM pools', status: 'pending' },
        { id: 'return', label: `${toSymbol} returned via IBC`, detail: 'IBC return transfer (~2-5 minutes)', status: 'pending' },
      ];

    default:
      return [
        { id: 'vault', label: 'Unlock vault & derive keys', status: 'pending' },
        { id: 'execute', label: 'Execute swap', status: 'pending' },
        { id: 'receive', label: `Receive ${toSymbol}`, status: 'pending' },
      ];
  }
}
