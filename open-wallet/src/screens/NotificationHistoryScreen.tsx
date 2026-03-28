/**
 * Notification History Screen — shows past transaction notification alerts.
 *
 * Displays a list of received transaction notifications with timestamp,
 * chain, amount, and sender. Stored in AsyncStorage (max 100 entries).
 * Accessible from Settings > Interface.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert, RefreshControl,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import {
  getNotificationHistory,
  clearNotificationHistory,
  type NotificationEntry,
} from '../core/notificationService';

interface NotificationHistoryScreenProps {
  onClose: () => void;
}

export function NotificationHistoryScreen({ onClose }: NotificationHistoryScreenProps) {
  const [entries, setEntries] = useState<NotificationEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const t = useTheme();

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    scroll: { paddingHorizontal: 16, paddingTop: 8 },
    header: { color: t.text.primary, fontSize: 20, fontWeight: '700', textAlign: 'center', marginVertical: 16 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 10 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    chain: { color: t.accent.blue, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    timestamp: { color: t.text.muted, fontSize: 11 },
    amount: { color: t.accent.green, fontSize: 18, fontWeight: '700', marginTop: 6 },
    sender: { color: t.text.secondary, fontSize: 13, fontFamily: 'monospace', marginTop: 4 },
    senderLabel: { color: t.text.muted, fontSize: 11, marginTop: 8 },
    txHash: { color: t.text.muted, fontSize: 11, fontFamily: 'monospace', marginTop: 4 },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', paddingVertical: 60, lineHeight: 22 },
    clearBtn: { backgroundColor: t.accent.red + '20', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
    clearText: { color: t.accent.red, fontSize: 15, fontWeight: '700' },
    backBtn: { paddingVertical: 20, alignItems: 'center' },
    backText: { color: t.accent.blue, fontSize: 16 },
  }), [t]);

  const loadHistory = useCallback(async () => {
    const history = await getNotificationHistory();
    setEntries(history);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  }, [loadHistory]);

  const handleClear = useCallback(() => {
    Alert.alert(
      'Clear Notification History',
      'This will remove all notification records. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearNotificationHistory();
            setEntries([]);
          },
        },
      ]
    );
  }, []);

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Today ${time}`;

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return `Yesterday ${time}`;

    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${time}`;
  };

  const truncateHash = (hash: string): string => {
    if (!hash || hash.length < 12) return hash || 'N/A';
    return `${hash.slice(0, 6)}...${hash.slice(-6)}`;
  };

  return (
    <SafeAreaView style={st.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={st.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={t.text.muted} />
        }
      >
        <Text style={st.header}>Notifications</Text>

        {entries.length === 0 ? (
          <Text style={st.emptyText}>
            No transaction notifications yet.{'\n'}
            You will be notified when you receive transactions.
          </Text>
        ) : (
          <>
            {entries.map((entry) => (
              <View key={entry.id} style={st.card}>
                <View style={st.row}>
                  <Text style={st.chain}>{entry.chain}</Text>
                  <Text style={st.timestamp}>{formatTime(entry.timestamp)}</Text>
                </View>
                <Text style={st.amount}>+{entry.amount} {entry.token}</Text>
                <Text style={st.senderLabel}>From</Text>
                <Text style={st.sender} numberOfLines={1} ellipsizeMode="middle">
                  {entry.sender}
                </Text>
                {entry.txHash ? (
                  <Text style={st.txHash}>TX: {truncateHash(entry.txHash)}</Text>
                ) : null}
              </View>
            ))}

            <TouchableOpacity style={st.clearBtn} onPress={handleClear}>
              <Text style={st.clearText}>Clear History</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={st.backBtn} onPress={onClose}>
          <Text style={st.backText}>Back to Settings</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
