import { fonts } from '../utils/theme';
/**
 * Tax Calculator — Cross-chain crypto tax calculation with multi-country support.
 * Supports FIFO, LIFO, Average Cost methods. Export via Share API.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Share, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

interface Props {
  onClose: () => void;
}

// ─── Types ───

interface TaxTransaction {
  id: string;
  date: string;
  type: 'buy' | 'sell' | 'swap' | 'receive' | 'send';
  token: string;
  chain: string;
  amount: number;
  priceUsd: number;
  feeUsd: number;
}

interface TaxResult {
  shortTermGains: number;
  longTermGains: number;
  shortTermLosses: number;
  longTermLosses: number;
  netGainLoss: number;
  taxableEvents: number;
  totalVolume: number;
  estimatedTax: number;
  byToken: { token: string; gain: number; loss: number; net: number }[];
}

type TaxMethod = 'fifo' | 'lifo' | 'avg';
type Country = 'US' | 'UK' | 'IN' | 'DE' | 'AU' | 'CA' | 'JP';

interface CountryConfig {
  name: string;
  flag: string;
  shortTermRate: number;
  longTermRate: number;
  notes: string;
}

const COUNTRIES: Record<Country, CountryConfig> = {
  US: { name: 'United States', flag: 'US', shortTermRate: 0.24, longTermRate: 0.15, notes: '0-37% short-term, 0-20% long-term' },
  UK: { name: 'United Kingdom', flag: 'UK', shortTermRate: 0.20, longTermRate: 0.20, notes: '10-20% CGT' },
  IN: { name: 'India', flag: 'IN', shortTermRate: 0.30, longTermRate: 0.30, notes: '30% flat on crypto' },
  DE: { name: 'Germany', flag: 'DE', shortTermRate: 0.26, longTermRate: 0.00, notes: '0% if held > 1 year' },
  AU: { name: 'Australia', flag: 'AU', shortTermRate: 0.325, longTermRate: 0.1625, notes: 'CGT with 50% discount if held > 1 year' },
  CA: { name: 'Canada', flag: 'CA', shortTermRate: 0.265, longTermRate: 0.1325, notes: '50% inclusion rate on capital gains' },
  JP: { name: 'Japan', flag: 'JP', shortTermRate: 0.55, longTermRate: 0.55, notes: 'Up to 55% as miscellaneous income' },
};

const TAX_METHODS: { key: TaxMethod; label: string; desc: string }[] = [
  { key: 'fifo', label: 'FIFO', desc: 'First In, First Out' },
  { key: 'lifo', label: 'LIFO', desc: 'Last In, First Out' },
  { key: 'avg', label: 'Avg Cost', desc: 'Average Cost Basis' },
];

// ─── Demo Data ───

function generateDemoTransactions(year: number): TaxTransaction[] {
  const txs: TaxTransaction[] = [
    { id: '1', date: `${year}-01-15`, type: 'buy', token: 'BTC', chain: 'bitcoin', amount: 0.5, priceUsd: 42000, feeUsd: 12 },
    { id: '2', date: `${year}-02-20`, type: 'buy', token: 'ETH', chain: 'ethereum', amount: 10, priceUsd: 2200, feeUsd: 8 },
    { id: '3', date: `${year}-03-10`, type: 'buy', token: 'SOL', chain: 'solana', amount: 200, priceUsd: 95, feeUsd: 2 },
    { id: '4', date: `${year}-04-05`, type: 'sell', token: 'BTC', chain: 'bitcoin', amount: 0.2, priceUsd: 65000, feeUsd: 15 },
    { id: '5', date: `${year}-05-18`, type: 'swap', token: 'ETH', chain: 'ethereum', amount: 5, priceUsd: 3100, feeUsd: 25 },
    { id: '6', date: `${year}-06-22`, type: 'sell', token: 'SOL', chain: 'solana', amount: 100, priceUsd: 145, feeUsd: 1.5 },
    { id: '7', date: `${year}-07-14`, type: 'buy', token: 'DOGE', chain: 'dogecoin', amount: 10000, priceUsd: 0.12, feeUsd: 3 },
    { id: '8', date: `${year}-08-30`, type: 'sell', token: 'ETH', chain: 'ethereum', amount: 3, priceUsd: 2800, feeUsd: 10 },
    { id: '9', date: `${year}-09-15`, type: 'sell', token: 'DOGE', chain: 'dogecoin', amount: 5000, priceUsd: 0.15, feeUsd: 2 },
    { id: '10', date: `${year}-10-01`, type: 'swap', token: 'SOL', chain: 'solana', amount: 50, priceUsd: 160, feeUsd: 1 },
    { id: '11', date: `${year}-11-12`, type: 'buy', token: 'XRP', chain: 'xrp', amount: 5000, priceUsd: 0.55, feeUsd: 4 },
    { id: '12', date: `${year}-12-20`, type: 'sell', token: 'XRP', chain: 'xrp', amount: 2500, priceUsd: 0.72, feeUsd: 3 },
  ];
  return txs;
}

function computeTax(
  transactions: TaxTransaction[],
  _method: TaxMethod,
  country: Country,
): TaxResult {
  const config = COUNTRIES[country];
  const tokenMap: Record<string, { gain: number; loss: number }> = {};
  let shortTermGains = 0;
  let longTermGains = 0;
  let shortTermLosses = 0;
  let longTermLosses = 0;
  let taxableEvents = 0;
  let totalVolume = 0;

  // Simplified cost-basis calculation for demo
  const costBasis: Record<string, number[]> = {};

  for (const tx of transactions) {
    const value = tx.amount * tx.priceUsd;
    totalVolume += value;

    if (tx.type === 'buy' || tx.type === 'receive') {
      if (!costBasis[tx.token]) costBasis[tx.token] = [];
      costBasis[tx.token].push(tx.priceUsd);
    } else if (tx.type === 'sell' || tx.type === 'swap') {
      taxableEvents++;
      const bases = costBasis[tx.token] ?? [];
      let basis = 0;

      if (_method === 'fifo' && bases.length > 0) {
        basis = bases.shift()!;
      } else if (_method === 'lifo' && bases.length > 0) {
        basis = bases.pop()!;
      } else if (_method === 'avg' && bases.length > 0) {
        basis = bases.reduce((a, b) => a + b, 0) / bases.length;
      } else {
        basis = tx.priceUsd * 0.7; // fallback estimate
      }

      const gainPerUnit = tx.priceUsd - basis;
      const totalGain = gainPerUnit * tx.amount - tx.feeUsd;

      // For demo, assume all within same year = short-term
      // In a real implementation, we'd check actual hold period
      const isLongTerm = false;

      if (!tokenMap[tx.token]) tokenMap[tx.token] = { gain: 0, loss: 0 };

      if (totalGain >= 0) {
        if (isLongTerm) {
          longTermGains += totalGain;
        } else {
          shortTermGains += totalGain;
        }
        tokenMap[tx.token].gain += totalGain;
      } else {
        if (isLongTerm) {
          longTermLosses += Math.abs(totalGain);
        } else {
          shortTermLosses += Math.abs(totalGain);
        }
        tokenMap[tx.token].loss += Math.abs(totalGain);
      }
    }
  }

  const netGainLoss = (shortTermGains + longTermGains) - (shortTermLosses + longTermLosses);
  const estimatedTax = Math.max(0,
    shortTermGains * config.shortTermRate +
    longTermGains * config.longTermRate -
    (shortTermLosses + longTermLosses) * config.shortTermRate * 0.5
  );

  const byToken = Object.entries(tokenMap).map(([token, { gain, loss }]) => ({
    token,
    gain,
    loss,
    net: gain - loss,
  })).sort((a, b) => Math.abs(b.net) - Math.abs(a.net));

  return {
    shortTermGains,
    longTermGains,
    shortTermLosses,
    longTermLosses,
    netGainLoss,
    taxableEvents,
    totalVolume,
    estimatedTax,
    byToken,
  };
}

// ─── Component ───

export const TaxCalculatorScreen = React.memo(({ onClose }: Props) => {
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const [taxYear, setTaxYear] = useState<number>(2026);
  const [method, setMethod] = useState<TaxMethod>('fifo');
  const [country, setCountry] = useState<Country>('US');
  const [showCountries, setShowCountries] = useState(false);
  const [calculated, setCalculated] = useState(false);

  const transactions = useMemo(() => generateDemoTransactions(taxYear), [taxYear]);
  const result = useMemo(() => computeTax(transactions, method, country), [transactions, method, country]);

  const fmt = useCallback((n: number) => {
    const abs = Math.abs(n);
    const str = abs >= 1000 ? `$${(abs / 1000).toFixed(1)}k` : `$${abs.toFixed(2)}`;
    return n < 0 ? `-${str}` : str;
  }, []);

  const handleCalculate = useCallback(() => {
    setCalculated(true);
  }, []);

  const handleExport = useCallback(async () => {
    const lines = [
      'Token,Type,Gain/Loss,Amount',
      ...result.byToken.map((r) =>
        `${r.token},${r.net >= 0 ? 'Gain' : 'Loss'},${r.net.toFixed(2)},${Math.abs(r.net).toFixed(2)}`
      ),
      '',
      `Tax Year,${taxYear}`,
      `Method,${method.toUpperCase()}`,
      `Country,${COUNTRIES[country].name}`,
      `Short-Term Gains,${result.shortTermGains.toFixed(2)}`,
      `Long-Term Gains,${result.longTermGains.toFixed(2)}`,
      `Short-Term Losses,${result.shortTermLosses.toFixed(2)}`,
      `Long-Term Losses,${result.longTermLosses.toFixed(2)}`,
      `Net Gain/Loss,${result.netGainLoss.toFixed(2)}`,
      `Estimated Tax,${result.estimatedTax.toFixed(2)}`,
    ];
    const csv = lines.join('\n');

    try {
      await Share.share({
        message: csv,
        title: `Open Wallet Tax Report ${taxYear}`,
      });
    } catch {
      Alert.alert('Export Failed', 'Could not share the tax report.');
    }
  }, [result, taxYear, method, country]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    back: { color: t.accent.blue, fontSize: 16, fontWeight: fonts.semibold },
    title: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy },
    placeholder: { width: 50 },
    scroll: { paddingHorizontal: 16, paddingBottom: 40 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 20, marginBottom: 8 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
    label: { color: t.text.secondary, fontSize: 14 },
    value: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    valueGreen: { color: t.accent.green, fontSize: 14, fontWeight: fonts.bold },
    valueRed: { color: t.accent.red, fontSize: 14, fontWeight: fonts.bold },
    chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, backgroundColor: t.border },
    chipActive: { backgroundColor: t.accent.green },
    chipText: { color: t.text.secondary, fontSize: 13, fontWeight: fonts.semibold },
    chipTextActive: { color: t.bg.primary, fontWeight: fonts.bold },
    countryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.bg.card, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 12 },
    countryName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.semibold, flex: 1 },
    countryNote: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    countryList: { backgroundColor: t.bg.card, borderRadius: 16, marginBottom: 12, overflow: 'hidden' },
    countryItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: t.border },
    countryItemActive: { backgroundColor: t.accent.green + '15' },
    summaryCard: { backgroundColor: t.accent.green + '10', borderRadius: 16, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: t.accent.green + '30' },
    summaryTitle: { color: t.accent.green, fontSize: 16, fontWeight: fonts.heavy, marginBottom: 12 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    summaryLabel: { color: t.text.secondary, fontSize: 14 },
    summaryValue: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    summaryBig: { color: t.accent.green, fontSize: 22, fontWeight: fonts.heavy },
    tokenRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.border },
    tokenSymbol: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold, width: 60 },
    tokenGain: { color: t.accent.green, fontSize: 13, fontWeight: fonts.semibold, width: 80, textAlign: 'right' },
    tokenLoss: { color: t.accent.red, fontSize: 13, fontWeight: fonts.semibold, width: 80, textAlign: 'right' },
    tokenNet: { fontSize: 14, fontWeight: fonts.bold, width: 90, textAlign: 'right' },
    calculateBtn: { backgroundColor: t.accent.green, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8, marginBottom: 12 },
    calculateText: { color: '#fff', fontSize: 16, fontWeight: fonts.bold },
    exportBtn: { backgroundColor: t.accent.blue, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
    exportText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    demoTag: { backgroundColor: t.accent.purple + '20', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, alignSelf: 'flex-start', marginBottom: 12 },
    demoText: { color: t.accent.purple, fontSize: 12, fontWeight: fonts.semibold },
    divider: { height: 1, backgroundColor: t.border, marginVertical: 4 },
  }), [t]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.back}>Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Tax Calculator</Text>
        <View style={s.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {(demoMode || true) && (
          <View style={s.demoTag}>
            <Text style={s.demoText}>Demo Mode — Sample Data</Text>
          </View>
        )}

        {/* Tax Year */}
        <Text style={s.section}>Tax Year</Text>
        <View style={s.chipRow}>
          {[2025, 2026].map((yr) => (
            <TouchableOpacity
              key={yr}
              style={[s.chip, taxYear === yr && s.chipActive]}
              onPress={() => { setTaxYear(yr); setCalculated(false); }}
            >
              <Text style={[s.chipText, taxYear === yr && s.chipTextActive]}>{yr}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tax Method */}
        <Text style={s.section}>Calculation Method</Text>
        <View style={s.chipRow}>
          {TAX_METHODS.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[s.chip, method === m.key && s.chipActive]}
              onPress={() => { setMethod(m.key); setCalculated(false); }}
            >
              <Text style={[s.chipText, method === m.key && s.chipTextActive]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={{ color: t.text.muted, fontSize: 12, marginTop: 4 }}>
          {TAX_METHODS.find((m) => m.key === method)?.desc}
        </Text>

        {/* Country */}
        <Text style={s.section}>Country</Text>
        <TouchableOpacity style={s.countryBtn} onPress={() => setShowCountries(!showCountries)}>
          <View style={{ flex: 1 }}>
            <Text style={s.countryName}>{COUNTRIES[country].flag} {COUNTRIES[country].name}</Text>
            <Text style={s.countryNote}>{COUNTRIES[country].notes}</Text>
          </View>
          <Text style={{ color: t.text.muted, fontSize: 16 }}>{showCountries ? 'v' : '>'}</Text>
        </TouchableOpacity>

        {showCountries && (
          <View style={s.countryList}>
            {(Object.keys(COUNTRIES) as Country[]).map((c) => (
              <TouchableOpacity
                key={c}
                style={[s.countryItem, country === c && s.countryItemActive]}
                onPress={() => { setCountry(c); setShowCountries(false); setCalculated(false); }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold }}>
                    {COUNTRIES[c].flag} {COUNTRIES[c].name}
                  </Text>
                  <Text style={{ color: t.text.muted, fontSize: 11, marginTop: 2 }}>
                    {COUNTRIES[c].notes}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: t.text.secondary, fontSize: 12 }}>
                    ST: {(COUNTRIES[c].shortTermRate * 100).toFixed(0)}%
                  </Text>
                  <Text style={{ color: t.text.secondary, fontSize: 12 }}>
                    LT: {(COUNTRIES[c].longTermRate * 100).toFixed(0)}%
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Calculate Button */}
        <TouchableOpacity style={s.calculateBtn} onPress={handleCalculate}>
          <Text style={s.calculateText}>Calculate Tax</Text>
        </TouchableOpacity>

        {calculated && (
          <>
            {/* Summary Card */}
            <View style={s.summaryCard}>
              <Text style={s.summaryTitle}>Tax Summary — {taxYear}</Text>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Taxable Events</Text>
                <Text style={s.summaryValue}>{result.taxableEvents}</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Total Volume</Text>
                <Text style={s.summaryValue}>{fmt(result.totalVolume)}</Text>
              </View>
              <View style={[s.divider, { marginVertical: 8 }]} />
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Estimated Tax</Text>
                <Text style={s.summaryBig}>{fmt(result.estimatedTax)}</Text>
              </View>
            </View>

            {/* Gains & Losses */}
            <Text style={s.section}>Gains & Losses</Text>
            <View style={s.card}>
              <View style={s.row}>
                <Text style={s.label}>Short-Term Gains</Text>
                <Text style={s.valueGreen}>{fmt(result.shortTermGains)}</Text>
              </View>
              <View style={s.row}>
                <Text style={s.label}>Long-Term Gains</Text>
                <Text style={s.valueGreen}>{fmt(result.longTermGains)}</Text>
              </View>
              <View style={s.divider} />
              <View style={s.row}>
                <Text style={s.label}>Short-Term Losses</Text>
                <Text style={s.valueRed}>-{fmt(result.shortTermLosses)}</Text>
              </View>
              <View style={s.row}>
                <Text style={s.label}>Long-Term Losses</Text>
                <Text style={s.valueRed}>-{fmt(result.longTermLosses)}</Text>
              </View>
              <View style={s.divider} />
              <View style={s.row}>
                <Text style={{ color: t.text.primary, fontSize: 15, fontWeight: fonts.bold }}>Net Gain/Loss</Text>
                <Text style={{
                  color: result.netGainLoss >= 0 ? t.accent.green : t.accent.red,
                  fontSize: 16, fontWeight: fonts.heavy,
                }}>
                  {fmt(result.netGainLoss)}
                </Text>
              </View>
            </View>

            {/* By Token */}
            <Text style={s.section}>Breakdown by Token</Text>
            <View style={s.card}>
              <View style={{ flexDirection: 'row', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: t.border }}>
                <Text style={{ color: t.text.muted, fontSize: 12, width: 60 }}>Token</Text>
                <Text style={{ color: t.text.muted, fontSize: 12, width: 80, textAlign: 'right' }}>Gains</Text>
                <Text style={{ color: t.text.muted, fontSize: 12, width: 80, textAlign: 'right' }}>Losses</Text>
                <Text style={{ color: t.text.muted, fontSize: 12, flex: 1, textAlign: 'right' }}>Net</Text>
              </View>
              {result.byToken.map((item) => (
                <View key={item.token} style={s.tokenRow}>
                  <Text style={s.tokenSymbol}>{item.token}</Text>
                  <Text style={s.tokenGain}>{fmt(item.gain)}</Text>
                  <Text style={s.tokenLoss}>-{fmt(item.loss)}</Text>
                  <Text style={[s.tokenNet, { color: item.net >= 0 ? t.accent.green : t.accent.red }]}>
                    {fmt(item.net)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Tax Rates */}
            <Text style={s.section}>Applied Tax Rates ({COUNTRIES[country].name})</Text>
            <View style={s.card}>
              <View style={s.row}>
                <Text style={s.label}>Short-Term Rate</Text>
                <Text style={s.value}>{(COUNTRIES[country].shortTermRate * 100).toFixed(1)}%</Text>
              </View>
              <View style={s.row}>
                <Text style={s.label}>Long-Term Rate</Text>
                <Text style={s.value}>{(COUNTRIES[country].longTermRate * 100).toFixed(1)}%</Text>
              </View>
              <View style={s.row}>
                <Text style={s.label}>Notes</Text>
                <Text style={{ color: t.text.muted, fontSize: 12, flex: 1, textAlign: 'right', marginLeft: 16 }}>
                  {COUNTRIES[country].notes}
                </Text>
              </View>
            </View>

            {/* Export */}
            <TouchableOpacity style={s.exportBtn} onPress={handleExport}>
              <Text style={s.exportText}>Export Tax Report (CSV)</Text>
            </TouchableOpacity>
          </>
        )}

        <Text style={{ color: t.text.muted, fontSize: 11, textAlign: 'center', marginTop: 8, marginBottom: 32, lineHeight: 16 }}>
          This is an estimate only. Consult a qualified tax professional for actual tax obligations.
          Tax rates shown are simplified approximations.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
});
