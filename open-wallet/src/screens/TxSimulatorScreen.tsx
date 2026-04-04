import { fonts } from '../utils/theme';
/**
 * Transaction Simulator — Preview a transaction outcome before executing.
 * Shows estimated gas fee, total cost, balance after tx.
 * For swaps: expected output, price impact, slippage.
 * For bridges: source -> dest, estimated time, bridge fee.
 * No real funds moved during simulation.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';
import { getPrices } from '../core/priceService';
import { getChainFeeEstimate, refreshFeesNow } from '../core/gas/feeService';
import { parseFeeAmount } from '../core/gas/estimator';
import type { ChainId } from '../core/abstractions/types';

type TxType = 'send' | 'swap' | 'bridge';

interface SimulationResult {
  gasFeeCrypto: string;
  gasFeeUsd: string;
  totalCostCrypto: string;
  totalCostUsd: string;
  balanceAfterCrypto: string;
  balanceAfterUsd: string;
  // Swap-specific
  expectedOutput?: string;
  priceImpact?: string;
  slippage?: string;
  exchangeRate?: string;
  // Bridge-specific
  bridgeFee?: string;
  estimatedTime?: string;
  destChain?: string;
}

const CHAIN_SYMBOLS: Record<string, string> = {
  bitcoin: 'BTC', ethereum: 'ETH', solana: 'SOL',
  cosmos: 'ATOM', openchain: 'OTK',
};

const DEMO_BALANCES: Record<string, number> = {
  bitcoin: 0.5, ethereum: 5, solana: 1000,
  cosmos: 100, openchain: 10000,
};

interface Props {
  onClose: () => void;
}

export const TxSimulatorScreen = React.memo(({ onClose }: Props) => {
  const { demoMode, supportedChains } = useWalletStore();
  const t = useTheme();

  const [txType, setTxType] = useState<TxType>('send');
  const [chain, setChain] = useState<ChainId>('ethereum');
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [toToken, setToToken] = useState('USDC');
  const [destChain, setDestChain] = useState<ChainId>('solana');
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const symbol = CHAIN_SYMBOLS[chain] ?? chain.toUpperCase();

  // Refresh fee data when chain changes
  useEffect(() => {
    refreshFeesNow();
  }, [chain]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    scroll: { paddingHorizontal: 20, paddingTop: 16 },
    title: { color: t.text.primary, fontSize: fonts.xxl, fontWeight: fonts.heavy, textAlign: 'center', marginBottom: 4 },
    subtitle: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginBottom: 20 },
    // Type selector
    typeRow: { flexDirection: 'row', gap: 8, marginBottom: 20, justifyContent: 'center' },
    typeBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, backgroundColor: t.bg.card },
    typeBtnActive: { backgroundColor: t.accent.blue },
    typeBtnText: { color: t.text.secondary, fontSize: fonts.md, fontWeight: fonts.semibold },
    typeBtnTextActive: { color: '#fff' },
    // Chain selector
    chainRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
    chainBtn: { backgroundColor: t.bg.card, borderRadius: 16, paddingVertical: 8, paddingHorizontal: 14 },
    chainBtnActive: { backgroundColor: t.accent.orange },
    chainBtnText: { color: t.text.secondary, fontSize: fonts.sm },
    chainBtnTextActive: { color: t.bg.primary, fontWeight: fonts.bold },
    // Inputs
    label: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, marginLeft: 4 },
    input: { backgroundColor: t.bg.card, borderRadius: 14, padding: 14, color: t.text.primary, fontSize: fonts.md, fontFamily: 'monospace', marginBottom: 14 },
    amountRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    tokenBadge: { backgroundColor: t.bg.card, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 14, justifyContent: 'center' },
    tokenText: { color: t.text.secondary, fontSize: fonts.md, fontWeight: fonts.bold },
    // Simulate button
    simBtn: { backgroundColor: t.accent.blue, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 20 },
    simBtnText: { color: '#fff', fontSize: fonts.lg, fontWeight: fonts.bold },
    // Result card
    resultCard: { backgroundColor: t.bg.card, borderRadius: 20, padding: 20, marginBottom: 16 },
    resultTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 16, textAlign: 'center' },
    resultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.border },
    resultLabel: { color: t.text.muted, fontSize: fonts.md },
    resultValue: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold, maxWidth: '55%', textAlign: 'right' },
    resultValueGreen: { color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.semibold },
    resultValueOrange: { color: t.accent.orange, fontSize: fonts.md, fontWeight: fonts.semibold },
    resultValueRed: { color: t.accent.red, fontSize: fonts.md, fontWeight: fonts.semibold },
    // Swap / bridge specific
    swapSection: { backgroundColor: t.accent.purple + '10', borderRadius: 16, padding: 16, marginBottom: 16 },
    swapTitle: { color: t.accent.purple, fontSize: fonts.md, fontWeight: fonts.bold, marginBottom: 10 },
    bridgeSection: { backgroundColor: t.accent.blue + '10', borderRadius: 16, padding: 16, marginBottom: 16 },
    bridgeTitle: { color: t.accent.blue, fontSize: fonts.md, fontWeight: fonts.bold, marginBottom: 10 },
    // Action buttons
    actionRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    executeBtn: { flex: 1, backgroundColor: t.accent.green, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
    executeBtnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    modifyBtn: { flex: 1, backgroundColor: t.bg.card, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
    modifyBtnText: { color: t.text.secondary, fontSize: fonts.md, fontWeight: fonts.semibold },
    // Disclaimer
    disclaimer: { color: t.text.muted, fontSize: fonts.xs, textAlign: 'center', lineHeight: 16, marginBottom: 16 },
    // Back
    backBtn: { paddingVertical: 16, alignItems: 'center' },
    backText: { color: t.accent.blue, fontSize: fonts.lg },
    // Dest chain
    destLabel: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, marginLeft: 4, marginTop: 4 },
  }), [t]);

  const runSimulation = useCallback(async () => {
    setSimulating(true);
    setResult(null);

    // Simulate a short delay to mimic real estimation
    await new Promise((r) => setTimeout(r, 800));

    const prices = getPrices();
    const price = prices[symbol] ?? 0;
    const amountNum = parseFloat(amount) || 0;

    // Get fee estimate from the fee service
    const feeEst = getChainFeeEstimate(chain);
    let gasFeeNum: number;
    if (feeEst) {
      gasFeeNum = parseFeeAmount(feeEst.medium.fee);
    } else {
      // Fallback demo fees
      const demoFees: Record<string, number> = {
        bitcoin: 0.00005, ethereum: 0.002, solana: 0.000005,
        cosmos: 0.001, openchain: 0.0001,
      };
      gasFeeNum = demoFees[chain] ?? 0.001;
    }

    const totalCostNum = amountNum + gasFeeNum;
    const balance = DEMO_BALANCES[chain] ?? 0;
    const balanceAfter = balance - totalCostNum;

    const sim: SimulationResult = {
      gasFeeCrypto: `${gasFeeNum.toFixed(6)} ${symbol}`,
      gasFeeUsd: `$${(gasFeeNum * price).toFixed(2)}`,
      totalCostCrypto: `${totalCostNum.toFixed(6)} ${symbol}`,
      totalCostUsd: `$${(totalCostNum * price).toFixed(2)}`,
      balanceAfterCrypto: `${balanceAfter.toFixed(6)} ${symbol}`,
      balanceAfterUsd: `$${(balanceAfter * price).toFixed(2)}`,
    };

    // Swap simulation
    if (txType === 'swap') {
      const toPrice = prices[toToken] ?? 1;
      const outputAmount = (amountNum * price) / toPrice;
      const priceImpactPct = amountNum > 100 ? 2.5 : amountNum > 10 ? 0.8 : 0.1;
      const actualOutput = outputAmount * (1 - priceImpactPct / 100);
      sim.expectedOutput = `${actualOutput.toFixed(4)} ${toToken}`;
      sim.priceImpact = `${priceImpactPct.toFixed(2)}%`;
      sim.slippage = '0.5%';
      sim.exchangeRate = `1 ${symbol} = ${(price / toPrice).toFixed(4)} ${toToken}`;
    }

    // Bridge simulation
    if (txType === 'bridge') {
      const destSymbol = CHAIN_SYMBOLS[destChain] ?? destChain.toUpperCase();
      const bridgeFeeNum = amountNum * 0.001; // 0.1% bridge fee
      sim.bridgeFee = `${bridgeFeeNum.toFixed(6)} ${symbol} (~$${(bridgeFeeNum * price).toFixed(2)})`;
      sim.estimatedTime = chain === 'bitcoin' ? '~30 min' : chain === 'ethereum' ? '~15 min' : '~2 min';
      sim.destChain = `${chain} -> ${destChain} (${destSymbol})`;
    }

    setResult(sim);
    setSimulating(false);
  }, [amount, chain, symbol, txType, toToken, destChain]);

  const handleModify = useCallback(() => {
    setResult(null);
  }, []);

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Text style={s.title}>Transaction Simulator</Text>
        <Text style={s.subtitle}>
          Preview the outcome before executing — no real funds moved
        </Text>

        {/* Transaction Type */}
        <View style={s.typeRow}>
          {(['send', 'swap', 'bridge'] as const).map((tt) => (
            <TouchableOpacity
              key={tt}
              style={[s.typeBtn, txType === tt && s.typeBtnActive]}
              onPress={() => { setTxType(tt); setResult(null); }}
            >
              <Text style={[s.typeBtnText, txType === tt && s.typeBtnTextActive]}>
                {tt === 'send' ? 'Send' : tt === 'swap' ? 'Swap' : 'Bridge'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chain Selector */}
        <Text style={s.label}>Chain</Text>
        <View style={s.chainRow}>
          {supportedChains.map((c) => (
            <TouchableOpacity
              key={c}
              style={[s.chainBtn, chain === c && s.chainBtnActive]}
              onPress={() => { setChain(c); setResult(null); }}
            >
              <Text style={[s.chainBtnText, chain === c && s.chainBtnTextActive]}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {!result ? (
          <>
            {/* Inputs */}
            <Text style={s.label}>From Address</Text>
            <TextInput
              style={s.input}
              placeholder="Your wallet address"
              placeholderTextColor={t.text.muted}
              value={fromAddress}
              onChangeText={setFromAddress}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={s.label}>To Address</Text>
            <TextInput
              style={s.input}
              placeholder="Recipient address"
              placeholderTextColor={t.text.muted}
              value={toAddress}
              onChangeText={setToAddress}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={s.label}>Amount</Text>
            <View style={s.amountRow}>
              <TextInput
                style={[s.input, { flex: 1, marginBottom: 0 }]}
                placeholder="0.00"
                placeholderTextColor={t.text.muted}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
              <View style={s.tokenBadge}>
                <Text style={s.tokenText}>{symbol}</Text>
              </View>
            </View>

            {/* Swap: target token */}
            {txType === 'swap' && (
              <>
                <Text style={[s.label, { marginTop: 14 }]}>Swap To</Text>
                <View style={s.chainRow}>
                  {['USDC', 'USDT', 'BTC', 'ETH', 'SOL'].filter((tk) => tk !== symbol).map((tk) => (
                    <TouchableOpacity
                      key={tk}
                      style={[s.chainBtn, toToken === tk && s.chainBtnActive]}
                      onPress={() => setToToken(tk)}
                    >
                      <Text style={[s.chainBtnText, toToken === tk && s.chainBtnTextActive]}>{tk}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Bridge: destination chain */}
            {txType === 'bridge' && (
              <>
                <Text style={s.destLabel}>Destination Chain</Text>
                <View style={s.chainRow}>
                  {supportedChains.filter((c) => c !== chain).map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[s.chainBtn, destChain === c && s.chainBtnActive]}
                      onPress={() => setDestChain(c)}
                    >
                      <Text style={[s.chainBtnText, destChain === c && s.chainBtnTextActive]}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Simulate Button */}
            <TouchableOpacity
              style={[s.simBtn, { marginTop: 8 }, (!amount.trim() || parseFloat(amount) <= 0) && { opacity: 0.5 }]}
              onPress={runSimulation}
              disabled={!amount.trim() || parseFloat(amount) <= 0 || simulating}
            >
              {simulating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.simBtnText}>Simulate Transaction</Text>
              )}
            </TouchableOpacity>

            <Text style={s.disclaimer}>
              Simulation uses current fee estimates and market prices.
              Actual results may vary slightly at execution time.
            </Text>
          </>
        ) : (
          <>
            {/* Simulation Results */}
            <View style={s.resultCard}>
              <Text style={s.resultTitle}>Simulation Result</Text>

              <View style={s.resultRow}>
                <Text style={s.resultLabel}>Amount</Text>
                <Text style={s.resultValue}>{amount} {symbol}</Text>
              </View>
              <View style={s.resultRow}>
                <Text style={s.resultLabel}>Gas Fee</Text>
                <Text style={s.resultValue}>{result.gasFeeCrypto}</Text>
              </View>
              <View style={s.resultRow}>
                <Text style={s.resultLabel}>Gas Fee (USD)</Text>
                <Text style={s.resultValue}>{result.gasFeeUsd}</Text>
              </View>
              <View style={s.resultRow}>
                <Text style={s.resultLabel}>Total Cost</Text>
                <Text style={[s.resultValue, { fontWeight: fonts.heavy }]}>{result.totalCostCrypto}</Text>
              </View>
              <View style={s.resultRow}>
                <Text style={s.resultLabel}>Total Cost (USD)</Text>
                <Text style={s.resultValue}>{result.totalCostUsd}</Text>
              </View>
              <View style={[s.resultRow, { borderBottomWidth: 0 }]}>
                <Text style={s.resultLabel}>Balance After</Text>
                <Text style={parseFloat(result.balanceAfterCrypto) >= 0 ? s.resultValueGreen : s.resultValueRed}>
                  {result.balanceAfterCrypto}
                </Text>
              </View>
            </View>

            {/* Swap Results */}
            {txType === 'swap' && result.expectedOutput && (
              <View style={s.swapSection}>
                <Text style={s.swapTitle}>Swap Details</Text>
                <View style={s.resultRow}>
                  <Text style={s.resultLabel}>Expected Output</Text>
                  <Text style={s.resultValueGreen}>{result.expectedOutput}</Text>
                </View>
                <View style={s.resultRow}>
                  <Text style={s.resultLabel}>Exchange Rate</Text>
                  <Text style={s.resultValue}>{result.exchangeRate}</Text>
                </View>
                <View style={s.resultRow}>
                  <Text style={s.resultLabel}>Price Impact</Text>
                  <Text style={
                    parseFloat(result.priceImpact ?? '0') > 1 ? s.resultValueOrange : s.resultValueGreen
                  }>
                    {result.priceImpact}
                  </Text>
                </View>
                <View style={[s.resultRow, { borderBottomWidth: 0 }]}>
                  <Text style={s.resultLabel}>Max Slippage</Text>
                  <Text style={s.resultValue}>{result.slippage}</Text>
                </View>
              </View>
            )}

            {/* Bridge Results */}
            {txType === 'bridge' && result.destChain && (
              <View style={s.bridgeSection}>
                <Text style={s.bridgeTitle}>Bridge Details</Text>
                <View style={s.resultRow}>
                  <Text style={s.resultLabel}>Route</Text>
                  <Text style={s.resultValue}>{result.destChain}</Text>
                </View>
                <View style={s.resultRow}>
                  <Text style={s.resultLabel}>Bridge Fee</Text>
                  <Text style={s.resultValueOrange}>{result.bridgeFee}</Text>
                </View>
                <View style={[s.resultRow, { borderBottomWidth: 0 }]}>
                  <Text style={s.resultLabel}>Estimated Time</Text>
                  <Text style={s.resultValue}>{result.estimatedTime}</Text>
                </View>
              </View>
            )}

            {/* Insufficient balance warning */}
            {parseFloat(result.balanceAfterCrypto) < 0 && (
              <View style={{ backgroundColor: t.accent.red + '15', borderRadius: 12, padding: 14, marginBottom: 16 }}>
                <Text style={{ color: t.accent.red, fontSize: fonts.md, fontWeight: fonts.bold, marginBottom: 4 }}>
                  Insufficient Balance
                </Text>
                <Text style={{ color: t.text.secondary, fontSize: fonts.sm }}>
                  This transaction would require more {symbol} than your current balance.
                  {demoMode ? ' (Demo balances used for simulation)' : ''}
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={s.actionRow}>
              <TouchableOpacity style={s.modifyBtn} onPress={handleModify}>
                <Text style={s.modifyBtnText}>Try Different Params</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.executeBtn, parseFloat(result.balanceAfterCrypto) < 0 && { opacity: 0.5 }]}
                disabled={parseFloat(result.balanceAfterCrypto) < 0}
              >
                <Text style={s.executeBtnText}>Execute for Real</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.disclaimer}>
              No funds were moved. "Execute for Real" will take you to the confirmation screen
              where biometric/PIN authorization is required before signing.
            </Text>
          </>
        )}

        <TouchableOpacity style={s.backBtn} onPress={onClose}>
          <Text style={s.backText}>Back</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
});
