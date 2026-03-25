/**
 * Token Detail — Price chart, balance, quick actions.
 * Opened by tapping a token on the Home screen.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { LineChart } from '../components/LineChart';
import type { TokenInfo } from '../core/tokens/registry';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const TIMEFRAMES = [
  { label: '24H', days: 1 },
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '1Y', days: 365 },
];

interface Props {
  token: TokenInfo;
  price: number;
  onClose: () => void;
}

export const TokenDetailScreen = React.memo(({ token, price, onClose }: Props) => {
  const [chartData, setChartData] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState(7);
  const [priceChange, setPriceChange] = useState(0);

  const fetchChart = useCallback(async (days: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${COINGECKO_API}/coins/${token.coingeckoId}/market_chart?vs_currency=usd&days=${days}`
      );
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      const prices = (data.prices ?? []).map(([_, p]: [number, number]) => p);
      setChartData(prices);
      if (prices.length > 1) {
        const change = ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100;
        setPriceChange(change);
      }
    } catch {}
    setLoading(false);
  }, [token.coingeckoId]);

  useEffect(() => { fetchChart(selectedTimeframe); }, [selectedTimeframe, fetchChart]);

  const changeColor = priceChange >= 0 ? '#22c55e' : '#ef4444';
  const changeSign = priceChange >= 0 ? '+' : '';

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.backBtn}>← Back</Text>
        </TouchableOpacity>
        <View style={s.headerTitle}>
          <View style={[s.dot, { backgroundColor: token.color }]} />
          <Text style={s.tokenName}>{token.symbol}</Text>
        </View>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Price */}
        <View style={s.priceSection}>
          <Text style={s.price}>
            ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: price < 1 ? 6 : 2 })}
          </Text>
          <Text style={[s.change, { color: changeColor }]}>
            {changeSign}{priceChange.toFixed(2)}%
          </Text>
          <Text style={s.fullName}>{token.name}</Text>
        </View>

        {/* Chart */}
        <View style={s.chartContainer}>
          {loading ? (
            <View style={s.chartLoading}>
              <ActivityIndicator color="#22c55e" />
            </View>
          ) : (
            <LineChart
              data={chartData}
              width={340}
              height={200}
              color={token.color}
            />
          )}
        </View>

        {/* Timeframe selector */}
        <View style={s.timeframes}>
          {TIMEFRAMES.map((tf) => (
            <TouchableOpacity
              key={tf.days}
              style={[s.tfBtn, selectedTimeframe === tf.days && s.tfBtnActive]}
              onPress={() => setSelectedTimeframe(tf.days)}
            >
              <Text style={[s.tfText, selectedTimeframe === tf.days && s.tfTextActive]}>
                {tf.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Balance */}
        <View style={s.balanceCard}>
          <Text style={s.balanceLabel}>Your Balance</Text>
          <Text style={s.balanceAmount}>0.00 {token.symbol}</Text>
          <Text style={s.balanceUsd}>$0.00</Text>
        </View>

        {/* Quick Actions */}
        <View style={s.actions}>
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#f9731620' }]}>
            <Text style={[s.actionText, { color: '#f97316' }]}>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#22c55e20' }]}>
            <Text style={[s.actionText, { color: '#22c55e' }]}>Receive</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#3b82f620' }]}>
            <Text style={[s.actionText, { color: '#3b82f6' }]}>Swap</Text>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={s.infoCard}>
          <InfoRow label="Network" value={token.chainId} />
          <InfoRow label="Decimals" value={token.decimals.toString()} />
          <InfoRow label="Type" value={token.isNative ? 'Native' : 'Token'} />
          {token.contractAddress && (
            <InfoRow label="Contract" value={`${token.contractAddress.slice(0, 10)}...${token.contractAddress.slice(-6)}`} />
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
});

const InfoRow = React.memo(({ label, value }: { label: string; value: string }) => (
  <View style={s.infoRow}>
    <Text style={s.infoLabel}>{label}</Text>
    <Text style={s.infoValue}>{value}</Text>
  </View>
));

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { color: '#3b82f6', fontSize: 16, fontWeight: '600' },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  tokenName: { color: '#f0f0f5', fontSize: 18, fontWeight: '800' },
  priceSection: { alignItems: 'center', paddingTop: 8, paddingBottom: 16 },
  price: { color: '#f0f0f5', fontSize: 36, fontWeight: '800' },
  change: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  fullName: { color: '#606070', fontSize: 14, marginTop: 4 },
  chartContainer: { marginHorizontal: 16 },
  chartLoading: { width: '100%', height: 200, justifyContent: 'center', alignItems: 'center', backgroundColor: '#16161f', borderRadius: 12 },
  timeframes: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 16, marginBottom: 24 },
  tfBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#16161f' },
  tfBtnActive: { backgroundColor: '#22c55e' },
  tfText: { color: '#a0a0b0', fontSize: 13, fontWeight: '600' },
  tfTextActive: { color: '#0a0a0f' },
  balanceCard: { backgroundColor: '#16161f', borderRadius: 16, padding: 20, marginHorizontal: 16, alignItems: 'center' },
  balanceLabel: { color: '#606070', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  balanceAmount: { color: '#f0f0f5', fontSize: 24, fontWeight: '700', marginTop: 8 },
  balanceUsd: { color: '#a0a0b0', fontSize: 16, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginTop: 16 },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  actionText: { fontSize: 15, fontWeight: '700' },
  infoCard: { backgroundColor: '#16161f', borderRadius: 16, padding: 4, marginHorizontal: 16, marginTop: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  infoLabel: { color: '#606070', fontSize: 14 },
  infoValue: { color: '#a0a0b0', fontSize: 14 },
});
