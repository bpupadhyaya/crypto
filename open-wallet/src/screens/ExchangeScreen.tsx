/**
 * Universal Exchange Screen — Any token to any token, across any chain.
 *
 * Features:
 * - From/To token selectors showing all supported tokens across all chains
 * - Shows best route with step visualization
 * - Shows alternative routes ranked by: best price, fastest, lowest fee, most secure
 * - Execute button with ConfirmTransactionScreen flow
 * - Demo mode supported
 * - Paper trading for first-time users
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator, Modal,
  FlatList,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { ConfirmTransactionScreen } from './ConfirmTransactionScreen';
import { useTheme } from '../hooks/useTheme';
import {
  findExchangeRoutes,
  executeExchangeRoute,
  getRankLabel,
  getRankColor,
  SUPPORTED_TOKENS,
  type ExchangeRoute,
  type ExchangeStep,
  type TokenInfo,
} from '../core/swap/universalExchange';
import { checkRealTransactionAllowed, recordPaperTrade, getTrafficLightEmoji } from '../core/paperTrading';
import type { TradeFlow } from '../core/paperTrading';
import { isTestnet } from '../core/network';
import { getAllLivePrices } from '../core/swap/prices';

interface Props {
  onClose: () => void;
}

export function ExchangeScreen({ onClose }: Props) {
  const { mode, addresses, demoMode, balances } = useWalletStore();
  const [fromToken, setFromToken] = useState('BTC');
  const [toToken, setToToken] = useState('SOL');
  const [amountStr, setAmountStr] = useState('');
  const [routes, setRoutes] = useState<ExchangeRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<ExchangeRoute | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPaperTrade, setIsPaperTrade] = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const t = useTheme();

  // Load prices for token selector display
  useEffect(() => {
    getAllLivePrices().then(setPrices).catch(() => {});
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    scroll: { paddingHorizontal: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 4 },
    title: { color: t.text.primary, fontSize: 24, fontWeight: '800' },
    closeBtn: { padding: 8 },
    closeText: { color: t.accent.blue, fontSize: 16, fontWeight: '600' },
    subtitle: { color: t.text.muted, fontSize: 13, marginBottom: 16 },
    // Token selector cards
    tokenCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 8 },
    cardLabel: { color: t.text.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    tokenSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    tokenLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    tokenSymbol: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    tokenChain: { color: t.text.muted, fontSize: 12 },
    tokenBalance: { color: t.text.secondary, fontSize: 12, marginTop: 2 },
    tokenPrice: { color: t.text.muted, fontSize: 11 },
    chevron: { color: t.text.muted, fontSize: 18 },
    amountInput: { color: t.text.primary, fontSize: 24, fontWeight: '600', marginTop: 10, borderTopWidth: 1, borderTopColor: t.border, paddingTop: 10 },
    // Flip button
    flipBtn: { alignSelf: 'center', backgroundColor: t.accent.green, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginVertical: -12, zIndex: 1 },
    flipIcon: { color: t.bg.primary, fontSize: 20, fontWeight: '800' },
    // Output card
    outputCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 16 },
    outputAmount: { color: t.accent.green, fontSize: 22, fontWeight: '800', textAlign: 'center' },
    outputSub: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 4 },
    // Route cards
    sectionLabel: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 16, marginBottom: 10 },
    routeCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 10 },
    routeCardSelected: { borderWidth: 2, borderColor: t.accent.green },
    routeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    routeName: { color: t.text.primary, fontSize: 15, fontWeight: '700', flex: 1 },
    routeOutput: { color: t.accent.green, fontSize: 16, fontWeight: '800' },
    routeMeta: { flexDirection: 'row', gap: 10, marginTop: 8, flexWrap: 'wrap' },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    metaText: { color: t.text.muted, fontSize: 12 },
    // Steps visualization
    stepsContainer: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: t.border },
    stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: t.accent.green, marginRight: 10 },
    stepLine: { position: 'absolute', left: 3, top: 12, width: 2, height: 20, backgroundColor: t.border },
    stepText: { color: t.text.secondary, fontSize: 13, flex: 1 },
    stepMeta: { color: t.text.muted, fontSize: 11 },
    expandBtn: { color: t.accent.blue, fontSize: 12, fontWeight: '600', marginTop: 8 },
    // Action buttons
    actionRow: { marginTop: 16, gap: 10 },
    paperBtn: { backgroundColor: t.accent.purple, borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
    exchangeBtn: { backgroundColor: t.accent.blue, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 10 },
    btnDisabled: { opacity: 0.5 },
    btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    // Loading
    loadingBox: { padding: 40, alignItems: 'center' },
    loadingText: { color: t.text.muted, fontSize: 14, marginTop: 12 },
    // Token picker modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
    modalContent: { flex: 1, marginTop: 100, backgroundColor: t.bg.primary, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
    modalTitle: { color: t.text.primary, fontSize: 20, fontWeight: '800', marginBottom: 16 },
    modalClose: { color: t.accent.blue, fontSize: 16, fontWeight: '600', textAlign: 'right', paddingBottom: 10 },
    tokenListItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: t.border },
    tokenListLeft: { gap: 2 },
    tokenListSymbol: { color: t.text.primary, fontSize: 16, fontWeight: '700' },
    tokenListName: { color: t.text.muted, fontSize: 13 },
    tokenListRight: { alignItems: 'flex-end' },
    tokenListPrice: { color: t.text.secondary, fontSize: 14, fontWeight: '600' },
    tokenListChain: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    // Fallback note
    fallbackNote: { backgroundColor: t.accent.green + '10', borderRadius: 12, padding: 14, marginTop: 16, marginBottom: 20 },
    fallbackText: { color: t.accent.green, fontSize: 12, lineHeight: 18, textAlign: 'center' },
    securityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    securityText: { fontSize: 11, fontWeight: '700' },
  }), [t]);

  // Fetch routes when amount changes
  useEffect(() => {
    const amount = parseFloat(amountStr);
    if (!amount || amount <= 0) { setRoutes([]); setSelectedRoute(null); return; }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await findExchangeRoutes({
          fromToken,
          toToken,
          fromChain: getChainForSymbol(fromToken),
          toChain: getChainForSymbol(toToken),
          amount,
        });
        setRoutes(results);
        // Auto-select best route
        if (results.length > 0) {
          setSelectedRoute(results[0]);
        } else {
          setSelectedRoute(null);
        }
      } catch {
        setRoutes([]);
        setSelectedRoute(null);
      }
      setLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [amountStr, fromToken, toToken]);

  const flipTokens = useCallback(() => {
    setFromToken(toToken);
    setToToken(fromToken);
    setAmountStr('');
    setRoutes([]);
    setSelectedRoute(null);
  }, [fromToken, toToken]);

  const getBalanceForToken = useCallback((symbol: string): string | null => {
    if (demoMode) {
      const demoBalances: Record<string, string> = { BTC: '0.5', ETH: '5', SOL: '1000', USDT: '50000', USDC: '50000', OTK: '10000', ATOM: '100' };
      return demoBalances[symbol] ?? null;
    }
    const bal = balances.find((b) => b.token.symbol === symbol);
    return bal ? bal.amount.toString() : null;
  }, [demoMode, balances]);

  const handleExchange = useCallback(async (paperMode: boolean) => {
    if (!selectedRoute) {
      Alert.alert('Select Route', 'Please choose an exchange route.');
      return;
    }
    setIsPaperTrade(paperMode);

    // Paper trading check for real trades
    if (!paperMode && !isTestnet()) {
      const flow: TradeFlow = 'swap-ow-atomic'; // universal exchange uses generic flow
      const check = await checkRealTransactionAllowed(flow);
      if (!check.allowed) {
        Alert.alert(
          `${getTrafficLightEmoji(check.light)} Paper Trade Required`,
          check.message,
          [
            { text: 'Do Paper Trade', onPress: () => { setIsPaperTrade(true); setShowConfirm(true); } },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        return;
      }
    }

    setShowConfirm(true);
  }, [selectedRoute]);

  const executeExchange = useCallback(async (vaultPassword?: string) => {
    if (!selectedRoute) return;

    if (isPaperTrade) {
      // Simulate paper trade
      await new Promise((r) => setTimeout(r, 1500));
      const flow: TradeFlow = 'swap-ow-atomic';
      const status = await recordPaperTrade(flow);
      Alert.alert(
        `${getTrafficLightEmoji(status.light)} Paper Exchange Complete`,
        `${amountStr} ${fromToken} -> ~${selectedRoute.totalEstimatedOutput.toFixed(4)} ${toToken} (simulated)\n\nVia: ${selectedRoute.provider}\nSteps: ${selectedRoute.steps.length}\nPaper trades: ${status.count}/3 recommended\n\n${status.light === 'green' ? 'Cleared for real exchanges!' : 'Complete more paper trades for full access.'}`
      );
    } else {
      // Real execution
      const password = vaultPassword ?? useWalletStore.getState().tempVaultPassword;
      if (!password) {
        Alert.alert('Error', 'Wallet not unlocked. Please sign in again.');
        throw new Error('Wallet not unlocked');
      }

      try {
        const { Vault } = await import('../core/vault/vault');
        const vault = new Vault();
        const contents = await vault.unlock(password);

        const addrMap: Record<string, string> = {};
        for (const [chain, addr] of Object.entries(addresses)) {
          if (addr) addrMap[chain] = addr;
        }

        const result = await executeExchangeRoute(
          selectedRoute,
          contents.mnemonic,
          useWalletStore.getState().activeAccountIndex,
          addrMap,
        );

        Alert.alert(
          result.success ? 'Exchange Complete' : 'Exchange Failed',
          result.message + (result.txHashes.length > 0 ? `\n\nTx: ${result.txHashes.map(h => h.slice(0, 12) + '...').join(', ')}` : ''),
        );

        if (!result.success) throw new Error(result.message);
      } catch (err) {
        throw err;
      }
    }

    setAmountStr('');
    setRoutes([]);
    setSelectedRoute(null);
    setShowConfirm(false);
    setIsPaperTrade(false);
  }, [amountStr, fromToken, toToken, selectedRoute, isPaperTrade, addresses]);

  // ─── Confirm screen ───

  if (showConfirm && selectedRoute) {
    return (
      <ConfirmTransactionScreen
        tx={{
          type: 'swap',
          fromSymbol: fromToken,
          fromAmount: amountStr,
          toSymbol: toToken,
          toAmount: selectedRoute.totalEstimatedOutput.toFixed(4),
          fee: `~$${selectedRoute.totalFeeUsd.toFixed(2)}`,
          route: `${selectedRoute.provider} (${selectedRoute.steps.length} step${selectedRoute.steps.length > 1 ? 's' : ''}, Security: ${selectedRoute.securityRating}/5)`,
        }}
        onConfirm={executeExchange}
        onCancel={() => setShowConfirm(false)}
      />
    );
  }

  // ─── Token Picker Modal ───

  const renderTokenPicker = (
    visible: boolean,
    excludeSymbol: string,
    onSelect: (symbol: string) => void,
    onCloseModal: () => void,
  ) => (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.modalOverlay}>
        <View style={s.modalContent}>
          <TouchableOpacity onPress={onCloseModal}>
            <Text style={s.modalClose}>Close</Text>
          </TouchableOpacity>
          <Text style={s.modalTitle}>Select Token</Text>
          <FlatList
            data={SUPPORTED_TOKENS.filter((tk) => tk.symbol !== excludeSymbol)}
            keyExtractor={(item) => item.symbol}
            renderItem={({ item }) => {
              const balance = getBalanceForToken(item.symbol);
              const price = prices[item.symbol];
              return (
                <TouchableOpacity
                  style={s.tokenListItem}
                  onPress={() => { onSelect(item.symbol); onCloseModal(); }}
                >
                  <View style={s.tokenListLeft}>
                    <Text style={s.tokenListSymbol}>{item.symbol}</Text>
                    <Text style={s.tokenListName}>{item.name}</Text>
                    {balance != null && (
                      <Text style={[s.tokenListName, { color: t.accent.green }]}>Balance: {balance}</Text>
                    )}
                  </View>
                  <View style={s.tokenListRight}>
                    {price != null && price > 0 && (
                      <Text style={s.tokenListPrice}>${price < 1 ? price.toFixed(4) : price.toLocaleString()}</Text>
                    )}
                    <Text style={s.tokenListChain}>{item.chain}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );

  // ─── Route card ───

  const renderRouteCard = (route: ExchangeRoute) => {
    const isSelected = selectedRoute?.id === route.id;
    const isExpanded = expandedRouteId === route.id;
    const rankLabel = getRankLabel(route.rank);
    const rankColor = getRankColor(route.rank);

    return (
      <TouchableOpacity
        key={route.id}
        style={[s.routeCard, isSelected && s.routeCardSelected]}
        onPress={() => setSelectedRoute(route)}
        activeOpacity={0.7}
      >
        <View style={s.routeHeader}>
          <Text style={s.routeName} numberOfLines={1}>{route.provider}</Text>
          <Text style={s.routeOutput}>~{formatOutput(route.totalEstimatedOutput, toToken)}</Text>
        </View>

        <View style={s.routeMeta}>
          <View style={[s.badge, { backgroundColor: rankColor + '20' }]}>
            <Text style={[s.badgeText, { color: rankColor }]}>{rankLabel}</Text>
          </View>
          <Text style={s.metaText}>{formatTime(route.totalTimeSeconds)}</Text>
          <Text style={s.metaText}>Fee: ~${route.totalFeeUsd.toFixed(2)}</Text>
          <View style={[s.securityBadge, { backgroundColor: getSecurityBg(route.securityRating, t) }]}>
            <Text style={[s.securityText, { color: getSecurityColor(route.securityRating, t) }]}>
              {'*'.repeat(Math.floor(route.securityRating))}{route.securityRating % 1 ? '.5' : ''}/5
            </Text>
          </View>
          {route.steps.length > 1 && (
            <Text style={s.metaText}>{route.steps.length} steps</Text>
          )}
        </View>

        <TouchableOpacity onPress={() => setExpandedRouteId(isExpanded ? null : route.id)}>
          <Text style={s.expandBtn}>{isExpanded ? 'Hide Steps' : 'Show Steps'}</Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={s.stepsContainer}>
            {route.steps.map((step, idx) => (
              <View key={idx}>
                <View style={s.stepRow}>
                  <View style={s.stepDot} />
                  {idx < route.steps.length - 1 && <View style={s.stepLine} />}
                  <View style={{ flex: 1 }}>
                    <Text style={s.stepText}>
                      {step.type === 'bridge' ? 'Bridge' : 'Swap'}: {step.fromToken} {'→'} {step.toToken}
                    </Text>
                    <Text style={s.stepMeta}>
                      via {step.provider} | ~{formatOutput(step.estimatedOutput, step.toToken)} | {formatTime(step.timeSeconds)} | ${step.feeUsd.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const fromBalance = getBalanceForToken(fromToken);
  const fromInfo = SUPPORTED_TOKENS.find((tk) => tk.symbol === fromToken);
  const toInfo = SUPPORTED_TOKENS.find((tk) => tk.symbol === toToken);

  return (
    <SafeAreaView style={s.container}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Exchange</Text>
          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <Text style={s.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.subtitle}>Any token to any token, across any chain.</Text>

        {/* From Token */}
        <Text style={s.cardLabel}>From</Text>
        <View style={s.tokenCard}>
          <TouchableOpacity style={s.tokenSelector} onPress={() => setShowFromPicker(true)}>
            <View style={s.tokenLeft}>
              <View>
                <Text style={s.tokenSymbol}>{fromToken}</Text>
                <Text style={s.tokenChain}>{fromInfo?.chain ?? ''}</Text>
                {fromBalance != null && (
                  <Text style={s.tokenBalance}>Balance: {fromBalance}</Text>
                )}
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              {prices[fromToken] != null && prices[fromToken] > 0 && (
                <Text style={s.tokenPrice}>${prices[fromToken] < 1 ? prices[fromToken].toFixed(4) : prices[fromToken].toLocaleString()}</Text>
              )}
              <Text style={s.chevron}>{'›'}</Text>
            </View>
          </TouchableOpacity>
          <TextInput
            style={s.amountInput}
            placeholder="0.00"
            placeholderTextColor={t.text.muted}
            value={amountStr}
            onChangeText={setAmountStr}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Flip */}
        <TouchableOpacity style={s.flipBtn} onPress={flipTokens}>
          <Text style={s.flipIcon}>{'<>'}</Text>
        </TouchableOpacity>

        {/* To Token */}
        <Text style={s.cardLabel}>To</Text>
        <View style={s.tokenCard}>
          <TouchableOpacity style={s.tokenSelector} onPress={() => setShowToPicker(true)}>
            <View style={s.tokenLeft}>
              <View>
                <Text style={s.tokenSymbol}>{toToken}</Text>
                <Text style={s.tokenChain}>{toInfo?.chain ?? ''}</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              {prices[toToken] != null && prices[toToken] > 0 && (
                <Text style={s.tokenPrice}>${prices[toToken] < 1 ? prices[toToken].toFixed(4) : prices[toToken].toLocaleString()}</Text>
              )}
              <Text style={s.chevron}>{'›'}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Best route output */}
        {selectedRoute && !loading && (
          <View style={s.outputCard}>
            <Text style={s.outputAmount}>
              ~{formatOutput(selectedRoute.totalEstimatedOutput, toToken)} {toToken}
            </Text>
            <Text style={s.outputSub}>
              via {selectedRoute.provider} | {formatTime(selectedRoute.totalTimeSeconds)} | Fee: ~${selectedRoute.totalFeeUsd.toFixed(2)}
            </Text>
          </View>
        )}

        {/* Loading */}
        {loading && (
          <View style={s.loadingBox}>
            <ActivityIndicator color={t.accent.green} size="large" />
            <Text style={s.loadingText}>Finding best routes across all providers...</Text>
          </View>
        )}

        {/* Routes */}
        {routes.length > 0 && !loading && (
          <>
            <Text style={s.sectionLabel}>Available Routes ({routes.length})</Text>
            {routes.map(renderRouteCard)}
          </>
        )}

        {/* Fallback note */}
        {routes.length > 0 && !loading && (
          <View style={s.fallbackNote}>
            <Text style={s.fallbackText}>
              Atomic Swap (5/5 security) is ALWAYS available as fallback. Uses pure cryptography -- no external service can shut it down.
            </Text>
          </View>
        )}

        {/* Action buttons */}
        {selectedRoute && !loading && (
          <View style={s.actionRow}>
            <TouchableOpacity style={s.paperBtn} onPress={() => handleExchange(true)}>
              <Text style={s.btnText}>Paper Exchange (Practice)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.exchangeBtn} onPress={() => handleExchange(false)}>
              <Text style={s.btnText}>Exchange via {selectedRoute.provider} (Real)</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Token picker modals */}
      {renderTokenPicker(showFromPicker, toToken, (sym) => { setFromToken(sym); setRoutes([]); setSelectedRoute(null); }, () => setShowFromPicker(false))}
      {renderTokenPicker(showToPicker, fromToken, (sym) => { setToToken(sym); setRoutes([]); setSelectedRoute(null); }, () => setShowToPicker(false))}
    </SafeAreaView>
  );
}

// ─── Helpers ───

function getChainForSymbol(symbol: string): string {
  const info = SUPPORTED_TOKENS.find((t) => t.symbol === symbol);
  return info?.chain ?? 'unknown';
}

function formatOutput(amount: number, symbol: string): string {
  if (amount >= 1000) return amount.toFixed(2);
  if (amount >= 1) return amount.toFixed(4);
  return amount.toFixed(6);
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `~${seconds}s`;
  if (seconds < 3600) return `~${Math.ceil(seconds / 60)}min`;
  return `~${(seconds / 3600).toFixed(1)}hr`;
}

function getSecurityColor(rating: number, t: ReturnType<typeof useTheme>): string {
  if (rating >= 4.5) return t.accent.green;
  if (rating >= 3.5) return t.accent.yellow;
  return t.accent.orange;
}

function getSecurityBg(rating: number, t: ReturnType<typeof useTheme>): string {
  return getSecurityColor(rating, t) + '20';
}
