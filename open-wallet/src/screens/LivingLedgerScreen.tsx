/**
 * Living Ledger Screen — View your lifelong record of human value.
 *
 * "The Living Ledger begins at Universal ID registration and continues indefinitely."
 * — Human Constitution, Article IV, Section 1
 *
 * Shows:
 * - Total value received and given across all channels
 * - Channel breakdown (nOTK, eOTK, hOTK, cOTK, xOTK, gOTK)
 * - Contribution score
 * - Gratitude received/given
 * - Recent ledger entries
 */

import React, { useMemo, useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';
import { getNetworkConfig } from '../core/network';

interface Props {
  onClose: () => void;
  onSendGratitude?: () => void;
}

// Channel metadata (icons, labels, colors) keyed by channel code
const CHANNEL_META: Record<string, { label: string; icon: string; color: string }> = {
  xotk: { label: 'Economic', icon: '\u{1F4B0}', color: '#f7931a' },
  notk: { label: 'Nurture', icon: '\u{1F49B}', color: '#ef4444' },
  eotk: { label: 'Education', icon: '\u{1F4DA}', color: '#3b82f6' },
  hotk: { label: 'Health', icon: '\u{1FA7A}', color: '#22c55e' },
  cotk: { label: 'Community', icon: '\u{1F91D}', color: '#8b5cf6' },
  gotk: { label: 'Governance', icon: '\u{1F5F3}', color: '#eab308' },
};

// Demo data returned when demoMode is enabled
const DEMO_LEDGER = {
  totalReceived: 1250,
  totalGiven: 480,
  totalMinted: 200,
  gratitudeReceived: 200,
  gratitudeGiven: 150,
  contributionScore: 2860,
  channels: {
    xotk: { received: 500, given: 300, minted: 0 },
    notk: { received: 350, given: 50, minted: 100 },
    eotk: { received: 200, given: 80, minted: 50 },
    hotk: { received: 100, given: 20, minted: 30 },
    cotk: { received: 80, given: 25, minted: 15 },
    gotk: { received: 20, given: 5, minted: 5 },
  },
  recentEntries: [
    { from_uid: 'uid-a83f...', to_uid: 'You', channel: 'notk', amount: 50, is_gratitude: true, timestamp: Date.now() - 7200_000, message: 'Thank you for everything, Mom' },
    { from_uid: 'System', to_uid: 'You', channel: 'eotk', amount: 200, is_gratitude: false, timestamp: Date.now() - 86400_000, message: 'Milestone: Primary education completed' },
    { from_uid: 'You', to_uid: 'uid-7b2c...', channel: 'eotk', amount: 30, is_gratitude: false, timestamp: Date.now() - 259200_000, message: 'Tutoring session' },
    { from_uid: 'uid-4e9a...', to_uid: 'You', channel: 'cotk', amount: 15, is_gratitude: false, timestamp: Date.now() - 432000_000, message: 'Community cleanup participation' },
    { from_uid: 'uid-c12d...', to_uid: 'You', channel: 'eotk', amount: 100, is_gratitude: true, timestamp: Date.now() - 604800_000, message: 'Your teaching changed my life' },
  ],
};

// Empty / zero state
const EMPTY_LEDGER = {
  totalReceived: 0,
  totalGiven: 0,
  totalMinted: 0,
  gratitudeReceived: 0,
  gratitudeGiven: 0,
  contributionScore: 0,
  channels: {} as Record<string, { received: number; given: number; minted: number }>,
  recentEntries: [] as typeof DEMO_LEDGER['recentEntries'],
};

interface LedgerData {
  totalReceived: number;
  totalGiven: number;
  totalMinted: number;
  gratitudeReceived: number;
  gratitudeGiven: number;
  contributionScore: number;
  channels: Record<string, { received: number; given: number; minted: number }>;
  recentEntries: Array<{ from_uid: string; to_uid: string; channel: string; amount: number; is_gratitude: boolean; timestamp: number; message?: string }>;
}

function useLivingLedger(): { data: LedgerData; loading: boolean; error: string | null } {
  const demoMode = useWalletStore((s) => s.demoMode);
  const address = useWalletStore((s) => s.addresses).openchain ?? '';
  const [data, setData] = useState<LedgerData>(EMPTY_LEDGER);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchLedger() {
      setLoading(true);
      setError(null);

      // Demo mode — return realistic mock data immediately
      if (demoMode) {
        await new Promise((r) => setTimeout(r, 400));
        if (!cancelled) {
          setData(DEMO_LEDGER);
          setLoading(false);
        }
        return;
      }

      if (!address) {
        if (!cancelled) {
          setData(EMPTY_LEDGER);
          setLoading(false);
        }
        return;
      }

      try {
        const { restUrl } = getNetworkConfig().openchain;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10_000);

        const resp = await fetch(
          `${restUrl}/openchain/otk/v1/living_ledger/${address}`,
          { signal: controller.signal },
        );
        clearTimeout(timeoutId);

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();

        if (!cancelled) {
          // Map chain response to our data shape
          const raw = json.living_ledger ?? json;
          const channels: Record<string, { received: number; given: number; minted: number }> = {};
          for (const cb of (raw.channel_breakdown ?? [])) {
            channels[cb.channel] = {
              received: Number(cb.received ?? 0),
              given: Number(cb.given ?? 0),
              minted: Number(cb.minted ?? 0),
            };
          }

          const entries = (raw.recent_entries ?? []).map((e: any) => ({
            from_uid: e.from_uid ?? '',
            to_uid: e.to_uid ?? '',
            channel: e.channel ?? '',
            amount: Number(e.amount ?? 0),
            is_gratitude: Boolean(e.is_gratitude),
            timestamp: Number(e.timestamp ?? 0),
            message: e.message,
          }));

          setData({
            totalReceived: Number(raw.total_received ?? 0),
            totalGiven: Number(raw.total_given ?? 0),
            totalMinted: Number(raw.total_minted ?? 0),
            gratitudeReceived: Number(raw.gratitude_received ?? 0),
            gratitudeGiven: Number(raw.gratitude_given ?? 0),
            contributionScore: Number(raw.contribution_score ?? 0),
            channels,
            recentEntries: entries,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load ledger');
          setData(EMPTY_LEDGER);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchLedger();
    return () => { cancelled = true; };
  }, [address, demoMode]);

  return { data, loading, error };
}

// Helper: relative time display
function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 3600_000) return `${Math.max(1, Math.floor(diff / 60_000))}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  if (diff < 604800_000) return `${Math.floor(diff / 86400_000)}d ago`;
  return `${Math.floor(diff / 604800_000)}w ago`;
}

export function LivingLedgerScreen({ onClose, onSendGratitude }: Props) {
  const t = useTheme();
  const { data: ledger, loading, error } = useLivingLedger();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scoreCard: { backgroundColor: t.accent.green + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center' },
    scoreLabel: { color: t.text.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5 },
    scoreValue: { color: t.accent.green, fontSize: 42, fontWeight: '900', marginTop: 4 },
    scoreSubtext: { color: t.text.secondary, fontSize: 13, marginTop: 8 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
    summaryItem: { alignItems: 'center' },
    summaryNumber: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    summaryLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 12, marginTop: 28 },
    channelCard: { backgroundColor: t.bg.card, borderRadius: 16, marginHorizontal: 20, overflow: 'hidden' },
    channelRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: t.border },
    channelIcon: { fontSize: 24, marginRight: 12 },
    channelInfo: { flex: 1 },
    channelName: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    channelValues: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    channelBar: { height: 4, borderRadius: 2, marginTop: 6 },
    channelAmount: { color: t.text.secondary, fontSize: 14, fontWeight: '700' },
    entryCard: { backgroundColor: t.bg.card, borderRadius: 16, marginHorizontal: 20, overflow: 'hidden' },
    entryRow: { padding: 14, borderBottomWidth: 1, borderBottomColor: t.border },
    entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    entryType: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    entryTime: { color: t.text.muted, fontSize: 11 },
    entryMessage: { color: t.text.secondary, fontSize: 13, marginTop: 4, fontStyle: 'italic' },
    entryAmount: { color: t.accent.green, fontSize: 14, fontWeight: '700', marginTop: 4 },
    gratitudeBtn: { backgroundColor: t.accent.purple, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginHorizontal: 20, marginTop: 24 },
    gratitudeBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    quote: { color: t.text.muted, fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginHorizontal: 32, marginTop: 24, lineHeight: 20 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
    errorText: { color: t.accent.red ?? '#ef4444', fontSize: 14, textAlign: 'center', marginHorizontal: 24, marginTop: 20 },
  }), [t]);

  // Build channel display array with metadata
  const channelEntries = useMemo(() => {
    const keys = Object.keys(ledger.channels).length > 0
      ? Object.keys(ledger.channels)
      : Object.keys(CHANNEL_META);
    return keys.map((key) => {
      const ch = ledger.channels[key] ?? { received: 0, given: 0, minted: 0 };
      const meta = CHANNEL_META[key] ?? { label: key.toUpperCase(), icon: '\u{1F4E6}', color: '#888' };
      return { key, ...ch, ...meta };
    });
  }, [ledger.channels]);

  const maxChannelReceived = Math.max(1, ...channelEntries.map(c => c.received));

  // Determine entry display type
  function getEntryType(entry: typeof ledger.recentEntries[0]): string {
    if (entry.is_gratitude) return 'gratitude';
    if (entry.from_uid === 'System') return 'minted';
    if (entry.from_uid === 'You' || entry.to_uid !== 'You') return 'given';
    return 'received';
  }

  const typeColors: Record<string, string> = {
    gratitude: t.accent.purple,
    minted: t.accent.green,
    given: t.accent.orange,
    received: t.accent.blue,
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Living Ledger</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={t.accent.green} />
        </View>
      ) : (
        <ScrollView>
          {error && <Text style={s.errorText}>Could not load ledger: {error}</Text>}

          {/* Contribution Score */}
          <View style={s.scoreCard}>
            <Text style={s.scoreLabel}>Contribution Score</Text>
            <Text style={s.scoreValue}>{ledger.contributionScore.toLocaleString()}</Text>
            <Text style={s.scoreSubtext}>{ledger.totalMinted > 0 ? `${ledger.totalMinted} OTK minted` : 'No milestones yet'}</Text>
            <View style={s.summaryRow}>
              <View style={s.summaryItem}>
                <Text style={[s.summaryNumber, { color: t.accent.green }]}>{ledger.totalReceived}</Text>
                <Text style={s.summaryLabel}>Received</Text>
              </View>
              <View style={s.summaryItem}>
                <Text style={[s.summaryNumber, { color: t.accent.orange }]}>{ledger.totalGiven}</Text>
                <Text style={s.summaryLabel}>Given</Text>
              </View>
              <View style={s.summaryItem}>
                <Text style={[s.summaryNumber, { color: t.accent.purple }]}>{ledger.gratitudeReceived}</Text>
                <Text style={s.summaryLabel}>Gratitude</Text>
              </View>
            </View>
          </View>

          {/* Value Channels */}
          <Text style={s.section}>Value Channels</Text>
          <View style={s.channelCard}>
            {channelEntries.map((ch, i) => (
              <View key={ch.key} style={[s.channelRow, i === channelEntries.length - 1 && { borderBottomWidth: 0 }]}>
                <Text style={s.channelIcon}>{ch.icon}</Text>
                <View style={s.channelInfo}>
                  <Text style={s.channelName}>{ch.label}</Text>
                  <Text style={s.channelValues}>Received: {ch.received} | Given: {ch.given}</Text>
                  <View style={[s.channelBar, { width: `${(ch.received / maxChannelReceived) * 100}%`, backgroundColor: ch.color }]} />
                </View>
                <Text style={s.channelAmount}>{ch.received - ch.given}</Text>
              </View>
            ))}
          </View>

          {/* Send Gratitude */}
          <TouchableOpacity style={s.gratitudeBtn} onPress={onSendGratitude}>
            <Text style={s.gratitudeBtnText}>Send Gratitude</Text>
          </TouchableOpacity>

          {/* Recent Activity */}
          <Text style={s.section}>Recent Activity</Text>
          <View style={s.entryCard}>
            {ledger.recentEntries.length === 0 ? (
              <View style={s.entryRow}>
                <Text style={[s.entryMessage, { fontStyle: 'normal', textAlign: 'center' }]}>No recent activity</Text>
              </View>
            ) : (
              ledger.recentEntries.map((entry, i) => {
                const entryType = getEntryType(entry);
                return (
                  <View key={i} style={[s.entryRow, i === ledger.recentEntries.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={s.entryHeader}>
                      <Text style={[s.entryType, { color: typeColors[entryType] ?? t.text.muted }]}>
                        {entryType === 'gratitude' ? 'Gratitude' : entryType === 'minted' ? 'Milestone' : entryType === 'given' ? 'Given' : 'Received'}
                      </Text>
                      <Text style={s.entryTime}>{relativeTime(entry.timestamp)}</Text>
                    </View>
                    {entry.message && <Text style={s.entryMessage}>{entry.message}</Text>}
                    <Text style={[s.entryAmount, { color: entryType === 'given' ? t.accent.orange : t.accent.green }]}>
                      {entryType === 'given' ? '-' : '+'}{entry.amount} {entry.channel.toUpperCase()}
                    </Text>
                  </View>
                );
              })
            )}
          </View>

          <Text style={s.quote}>
            "The world is all about value transfer. When we make it visible, we make it better."
          </Text>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
