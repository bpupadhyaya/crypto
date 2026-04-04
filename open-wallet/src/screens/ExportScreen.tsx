import { fonts } from '../utils/theme';
/**
 * Export Screen — Export transaction history for tax reporting.
 *
 * Features:
 * - Date range selector (start/end)
 * - Export as CSV or JSON
 * - Includes: date, type, token, amount, USD value, tx hash, chain
 * - Uses Share API to share the exported file
 * - Demo mode with sample transaction data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert, Share, Platform,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

type ExportFormat = 'csv' | 'json';

interface ExportTransaction {
  date: string;
  type: 'send' | 'receive' | 'swap';
  token: string;
  amount: string;
  usdValue: string;
  txHash: string;
  chain: string;
  from: string;
  to: string;
  fee: string;
}

interface Props {
  onClose: () => void;
}

// ─── Demo Transactions ───

function generateDemoTransactions(): ExportTransaction[] {
  const now = Date.now();
  const DAY = 86400000;

  return [
    { date: new Date(now - 1 * DAY).toISOString(), type: 'receive', token: 'SOL', amount: '50.000000', usdValue: '7250.00', txHash: '5xK9...mN3v', chain: 'solana', from: '8Kz...fQ2', to: 'Your Wallet', fee: '0.000005' },
    { date: new Date(now - 2 * DAY).toISOString(), type: 'send', token: 'ETH', amount: '0.500000', usdValue: '1700.00', txHash: '0xa3f...8c2d', chain: 'ethereum', from: 'Your Wallet', to: '0x1a2...3b4', fee: '0.002100' },
    { date: new Date(now - 3 * DAY).toISOString(), type: 'swap', token: 'BTC', amount: '0.010000', usdValue: '670.00', txHash: 'bc1q...7f8g', chain: 'bitcoin', from: 'BTC', to: 'ETH', fee: '0.000150' },
    { date: new Date(now - 5 * DAY).toISOString(), type: 'receive', token: 'USDC', amount: '1000.000000', usdValue: '1000.00', txHash: '0xb7e...1d3a', chain: 'ethereum', from: '0x9c8...4d5', to: 'Your Wallet', fee: '0.001800' },
    { date: new Date(now - 7 * DAY).toISOString(), type: 'send', token: 'SOL', amount: '100.000000', usdValue: '14500.00', txHash: '3pR7...kL9m', chain: 'solana', from: 'Your Wallet', to: '6Hx...jT4', fee: '0.000005' },
    { date: new Date(now - 10 * DAY).toISOString(), type: 'swap', token: 'ETH', amount: '1.000000', usdValue: '3400.00', txHash: '0xc1d...5e6f', chain: 'ethereum', from: 'ETH', to: 'USDC', fee: '0.003200' },
    { date: new Date(now - 14 * DAY).toISOString(), type: 'receive', token: 'OTK', amount: '5000.000000', usdValue: '50.00', txHash: 'otk_...x9z1', chain: 'openchain', from: 'Contribution Reward', to: 'Your Wallet', fee: '0.000000' },
    { date: new Date(now - 20 * DAY).toISOString(), type: 'send', token: 'ATOM', amount: '25.000000', usdValue: '237.50', txHash: 'cosmos1...a2b3', chain: 'cosmos', from: 'Your Wallet', to: 'cosmos1...9z8', fee: '0.005000' },
    { date: new Date(now - 25 * DAY).toISOString(), type: 'receive', token: 'BTC', amount: '0.050000', usdValue: '3350.00', txHash: 'bc1q...h5j6', chain: 'bitcoin', from: 'bc1q...4k7', to: 'Your Wallet', fee: '0.000100' },
    { date: new Date(now - 30 * DAY).toISOString(), type: 'swap', token: 'SOL', amount: '200.000000', usdValue: '29000.00', txHash: '7nQ2...pW4x', chain: 'solana', from: 'SOL', to: 'USDC', fee: '0.000005' },
  ];
}

export const ExportScreen = React.memo(({ onClose }: Props) => {
  const { demoMode } = useWalletStore();
  const t = useTheme();

  const [format, setFormat] = useState<ExportFormat>('csv');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');
  const [exporting, setExporting] = useState(false);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    scroll: { padding: 20 },
    title: { color: t.text.primary, fontSize: 24, fontWeight: fonts.heavy, marginBottom: 4 },
    subtitle: { color: t.text.muted, fontSize: 14, marginBottom: 24, lineHeight: 20 },
    sectionLabel: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, marginTop: 16 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginTop: 8 },
    row: { flexDirection: 'row', gap: 8 },
    chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: t.bg.card, borderWidth: 1, borderColor: 'transparent' },
    chipActive: { borderColor: t.accent.green, backgroundColor: t.accent.green + '15' },
    chipText: { color: t.text.secondary, fontSize: 14, fontWeight: fonts.semibold },
    chipTextActive: { color: t.accent.green },
    formatRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    formatBtn: { flex: 1, paddingVertical: 16, borderRadius: 14, backgroundColor: t.bg.card, alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent' },
    formatBtnActive: { borderColor: t.accent.green, backgroundColor: t.accent.green + '10' },
    formatIcon: { fontSize: 28, marginBottom: 6 },
    formatLabel: { color: t.text.secondary, fontSize: 15, fontWeight: fonts.bold },
    formatLabelActive: { color: t.accent.green },
    formatDesc: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    previewCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginTop: 16 },
    previewTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold, marginBottom: 12 },
    previewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    previewLabel: { color: t.text.muted, fontSize: 13 },
    previewValue: { color: t.text.primary, fontSize: 13, fontWeight: fonts.semibold },
    exportBtn: { backgroundColor: t.accent.green, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 24 },
    exportBtnText: { color: '#fff', fontSize: 17, fontWeight: fonts.bold },
    cancelBtn: { paddingVertical: 20, alignItems: 'center' },
    cancelText: { color: t.accent.blue, fontSize: 16 },
    hint: { color: t.text.muted, fontSize: 12, marginTop: 8, textAlign: 'center', lineHeight: 18 },
    sampleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: t.border },
    sampleDate: { color: t.text.muted, fontSize: 11, width: 70 },
    sampleType: { fontSize: 12, fontWeight: fonts.semibold, width: 50 },
    sampleToken: { color: t.text.primary, fontSize: 12, fontWeight: fonts.semibold, width: 45 },
    sampleAmount: { color: t.text.secondary, fontSize: 12, textAlign: 'right', flex: 1 },
  }), [t]);

  const transactions = useMemo(() => {
    const allTx = generateDemoTransactions();
    const now = Date.now();
    const ranges: Record<string, number> = {
      '7d': 7 * 86400000,
      '30d': 30 * 86400000,
      '90d': 90 * 86400000,
      '1y': 365 * 86400000,
      'all': Infinity,
    };
    const cutoff = now - (ranges[dateRange] ?? Infinity);
    return allTx.filter((tx) => new Date(tx.date).getTime() >= cutoff);
  }, [dateRange]);

  const formatCSV = useCallback((txs: ExportTransaction[]): string => {
    const header = 'Date,Type,Token,Amount,USD Value,TX Hash,Chain,From,To,Fee';
    const rows = txs.map((tx) =>
      `${tx.date},${tx.type},${tx.token},${tx.amount},${tx.usdValue},${tx.txHash},${tx.chain},${tx.from},${tx.to},${tx.fee}`
    );
    return [header, ...rows].join('\n');
  }, []);

  const formatJSON = useCallback((txs: ExportTransaction[]): string => {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      walletApp: 'Open Wallet',
      transactionCount: txs.length,
      transactions: txs,
    }, null, 2);
  }, []);

  const handleExport = useCallback(async () => {
    setExporting(true);

    try {
      // Brief delay for UX feedback
      await new Promise((resolve) => setTimeout(resolve, 300));

      const content = format === 'csv'
        ? formatCSV(transactions)
        : formatJSON(transactions);

      const filename = `open-wallet-transactions-${dateRange}.${format}`;

      await Share.share({
        title: filename,
        message: content,
        ...(Platform.OS === 'ios' ? {} : { title: `Open Wallet Export — ${transactions.length} transactions` }),
      });
    } catch (err) {
      if ((err as { code?: string }).code !== 'ERR_SHARE_CANCELLED') {
        Alert.alert('Export Failed', err instanceof Error ? err.message : 'Unknown error');
      }
    } finally {
      setExporting(false);
    }
  }, [format, transactions, dateRange, formatCSV, formatJSON]);

  const totalUsd = useMemo(() =>
    transactions.reduce((sum, tx) => sum + parseFloat(tx.usdValue), 0),
    [transactions],
  );

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Text style={s.title}>Export Transactions</Text>
        <Text style={s.subtitle}>
          Export your transaction history for tax reporting or record keeping.
          {demoMode ? ' Using sample data in demo mode.' : ''}
        </Text>

        {/* Date Range */}
        <Text style={s.sectionLabel}>Date Range</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={s.row}>
            {([
              { id: '7d' as const, label: '7 Days' },
              { id: '30d' as const, label: '30 Days' },
              { id: '90d' as const, label: '90 Days' },
              { id: '1y' as const, label: '1 Year' },
              { id: 'all' as const, label: 'All Time' },
            ]).map((r) => (
              <TouchableOpacity
                key={r.id}
                style={[s.chip, dateRange === r.id && s.chipActive]}
                onPress={() => setDateRange(r.id)}
              >
                <Text style={[s.chipText, dateRange === r.id && s.chipTextActive]}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Export Format */}
        <Text style={s.sectionLabel}>Format</Text>
        <View style={s.formatRow}>
          <TouchableOpacity
            style={[s.formatBtn, format === 'csv' && s.formatBtnActive]}
            onPress={() => setFormat('csv')}
          >
            <Text style={s.formatIcon}>📊</Text>
            <Text style={[s.formatLabel, format === 'csv' && s.formatLabelActive]}>CSV</Text>
            <Text style={s.formatDesc}>Spreadsheets</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.formatBtn, format === 'json' && s.formatBtnActive]}
            onPress={() => setFormat('json')}
          >
            <Text style={s.formatIcon}>{ }</Text>
            <Text style={[s.formatLabel, format === 'json' && s.formatLabelActive]}>JSON</Text>
            <Text style={s.formatDesc}>Developers</Text>
          </TouchableOpacity>
        </View>

        {/* Preview */}
        <View style={s.previewCard}>
          <Text style={s.previewTitle}>Export Preview</Text>
          <View style={s.previewRow}>
            <Text style={s.previewLabel}>Transactions</Text>
            <Text style={s.previewValue}>{transactions.length}</Text>
          </View>
          <View style={s.previewRow}>
            <Text style={s.previewLabel}>Date Range</Text>
            <Text style={s.previewValue}>
              {transactions.length > 0
                ? `${new Date(transactions[transactions.length - 1].date).toLocaleDateString()} — ${new Date(transactions[0].date).toLocaleDateString()}`
                : 'No data'}
            </Text>
          </View>
          <View style={s.previewRow}>
            <Text style={s.previewLabel}>Total Volume (USD)</Text>
            <Text style={s.previewValue}>${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          </View>
          <View style={s.previewRow}>
            <Text style={s.previewLabel}>Format</Text>
            <Text style={s.previewValue}>{format.toUpperCase()}</Text>
          </View>
        </View>

        {/* Sample Transactions */}
        {transactions.length > 0 && (
          <View style={[s.card, { marginTop: 16 }]}>
            <Text style={[s.previewTitle, { marginBottom: 8 }]}>Recent Transactions</Text>
            {transactions.slice(0, 5).map((tx, i) => (
              <View key={i} style={s.sampleRow}>
                <Text style={s.sampleDate}>{new Date(tx.date).toLocaleDateString()}</Text>
                <Text style={[s.sampleType, {
                  color: tx.type === 'send' ? t.accent.red : tx.type === 'receive' ? t.accent.green : t.accent.blue,
                }]}>
                  {tx.type === 'send' ? 'SEND' : tx.type === 'receive' ? 'RECV' : 'SWAP'}
                </Text>
                <Text style={s.sampleToken}>{tx.token}</Text>
                <Text style={s.sampleAmount}>${parseFloat(tx.usdValue).toLocaleString()}</Text>
              </View>
            ))}
            {transactions.length > 5 && (
              <Text style={[s.hint, { marginTop: 8 }]}>
                +{transactions.length - 5} more transactions
              </Text>
            )}
          </View>
        )}

        {/* Export Button */}
        <TouchableOpacity
          style={s.exportBtn}
          onPress={handleExport}
          disabled={exporting || transactions.length === 0}
        >
          <Text style={s.exportBtnText}>
            {exporting ? 'Preparing...' : `Export ${transactions.length} Transactions as ${format.toUpperCase()}`}
          </Text>
        </TouchableOpacity>

        <Text style={s.hint}>
          Uses your device's share sheet. Save to Files, email, or any app.
        </Text>

        {/* Cancel */}
        <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
          <Text style={s.cancelText}>Back to Settings</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
});
