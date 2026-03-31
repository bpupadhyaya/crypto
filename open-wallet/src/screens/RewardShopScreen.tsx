import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

type Tab = 'shop' | 'redeem' | 'history';

interface Props {
  onClose: () => void;
}

interface ShopItem {
  id: string;
  name: string;
  description: string;
  otkCost: number;
  category: string;
  available: number;
  provider: string;
}

interface RedemptionOption {
  id: string;
  name: string;
  otkCost: number;
  description: string;
}

interface HistoryEntry {
  id: string;
  item: string;
  otkSpent: number;
  date: string;
  status: 'completed' | 'processing';
  provider: string;
}

const DEMO_SHOP_ITEMS: ShopItem[] = [
  { id: '1', name: 'Community Garden Plot (1 season)', description: 'Access to a 4x8 garden plot for one growing season with seeds and tools included.', otkCost: 200, category: 'Goods', available: 12, provider: 'Open Tools Collective' },
  { id: '2', name: '1-on-1 Coding Mentorship (4 sessions)', description: 'Four one-hour mentoring sessions with an experienced developer.', otkCost: 300, category: 'Service', available: 8, provider: 'Youth Code Academy' },
  { id: '3', name: 'Elder Story Recording Session', description: 'Professional recording session to capture family stories and wisdom.', otkCost: 150, category: 'Experience', available: 20, provider: 'Elder Wisdom Network' },
  { id: '4', name: 'Tool Library Annual Pass', description: 'Unlimited borrowing from the community tool library for one year.', otkCost: 100, category: 'Service', available: 50, provider: 'Open Tools Collective' },
];

const DEMO_REDEEM_OPTIONS: RedemptionOption[] = [
  { id: '1', name: 'Volunteer Hours Credit', otkCost: 100, description: 'Convert OTK to recognized volunteer hours.' },
  { id: '2', name: 'Community Event Ticket', otkCost: 75, description: 'Entry to any upcoming community event.' },
  { id: '3', name: 'Skill Share Credit', otkCost: 50, description: 'One hour of skill sharing from any expert.' },
];

const DEMO_HISTORY: HistoryEntry[] = [
  { id: '1', item: 'Tool Library Annual Pass', otkSpent: 100, date: '2026-03-15', status: 'completed', provider: 'Open Tools Collective' },
  { id: '2', item: 'Skill Share Credit', otkSpent: 50, date: '2026-03-28', status: 'processing', provider: 'Community Pool' },
  { id: '3', item: 'Coding Mentorship Session', otkSpent: 300, date: '2026-02-20', status: 'completed', provider: 'Youth Code Academy' },
];

export function RewardShopScreen({ onClose }: Props) {
  const t = useTheme();
  const { demoMode } = useWalletStore();
  const [activeTab, setActiveTab] = useState<Tab>('shop');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: t.bg.primary },
        header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.border },
        headerTitle: { fontSize: 18, fontWeight: '700', color: t.text.primary },
        closeButton: { padding: 8 },
        closeText: { fontSize: 16, color: t.accent.green },
        tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: t.border },
        tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
        activeTab: { borderBottomWidth: 2, borderBottomColor: t.accent.green },
        tabText: { fontSize: 14, color: t.text.secondary },
        activeTabText: { color: t.accent.green, fontWeight: '600' },
        content: { flex: 1 },
        balanceBar: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, backgroundColor: t.bg.card, borderBottomWidth: 1, borderBottomColor: t.border },
        balanceLabel: { fontSize: 14, color: t.text.secondary, marginRight: 8 },
        balanceValue: { fontSize: 18, fontWeight: '700', color: t.accent.green },
        shopCard: { marginHorizontal: 16, marginTop: 12, padding: 14, backgroundColor: t.bg.card, borderRadius: 12, borderWidth: 1, borderColor: t.border },
        shopName: { fontSize: 15, fontWeight: '700', color: t.text.primary, marginBottom: 2 },
        shopProvider: { fontSize: 12, color: t.accent.green, marginBottom: 6 },
        shopDesc: { fontSize: 13, color: t.text.secondary, lineHeight: 18, marginBottom: 8 },
        shopFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        shopMeta: { fontSize: 12, color: t.text.secondary },
        shopCost: { fontSize: 14, fontWeight: '700', color: t.accent.green },
        redeemButton: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: t.accent.green, borderRadius: 8 },
        redeemButtonText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
        redeemCard: { marginHorizontal: 16, marginTop: 12, padding: 14, backgroundColor: t.bg.card, borderRadius: 12, borderWidth: 1, borderColor: t.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        redeemInfo: { flex: 1, marginRight: 12 },
        redeemName: { fontSize: 14, fontWeight: '700', color: t.text.primary, marginBottom: 2 },
        redeemDesc: { fontSize: 12, color: t.text.secondary },
        redeemCostValue: { fontSize: 16, fontWeight: '700', color: t.accent.green },
        historyCard: { marginHorizontal: 16, marginTop: 12, padding: 14, backgroundColor: t.bg.card, borderRadius: 12, borderWidth: 1, borderColor: t.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        historyInfo: { flex: 1 },
        historyItem: { fontSize: 14, fontWeight: '600', color: t.text.primary, marginBottom: 2 },
        historyMeta: { fontSize: 12, color: t.text.secondary },
        historyOtk: { fontSize: 14, fontWeight: '700', color: t.text.primary },
        statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 4 },
        statusText: { fontSize: 11, fontWeight: '600' },
        sectionLabel: { fontSize: 14, fontWeight: '600', color: t.text.secondary, marginHorizontal: 16, marginTop: 16, marginBottom: 4 },
        emptyState: { margin: 16, padding: 20, backgroundColor: t.bg.card, borderRadius: 12, alignItems: 'center' },
        emptyText: { fontSize: 13, color: t.text.secondary },
        listFooter: { height: 32 },
        totalSpent: { margin: 16, padding: 14, backgroundColor: t.bg.card, borderRadius: 12, alignItems: 'center' },
        totalSpentValue: { fontSize: 20, fontWeight: '700', color: t.text.primary },
      }),
    [t],
  );

  const statusStyle = (s: string) => s === 'completed' ? { bg: t.accent.green + '20', color: t.accent.green } : { bg: '#FF980020', color: '#FF9800' };

  const totalSpent = useMemo(
    () => (demoMode ? DEMO_HISTORY : []).reduce((s, e) => s + e.otkSpent, 0),
    [demoMode],
  );

  const renderShopItem = useCallback(
    ({ item }: { item: ShopItem }) => (
      <View style={styles.shopCard}>
        <Text style={styles.shopName}>{item.name}</Text>
        <Text style={styles.shopProvider}>{item.provider}</Text>
        <Text style={styles.shopDesc}>{item.description}</Text>
        <View style={styles.shopFooter}>
          <Text style={styles.shopMeta}>{item.category} | {item.available} available</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.shopCost}>{item.otkCost} OTK</Text>
            <TouchableOpacity style={styles.redeemButton}><Text style={styles.redeemButtonText}>Get</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    ),
    [styles],
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'shop':
        return (
          <FlatList
            data={demoMode ? DEMO_SHOP_ITEMS : []}
            keyExtractor={(item) => item.id}
            renderItem={renderShopItem}
            ListHeaderComponent={
              <>
                <View style={styles.balanceBar}>
                  <Text style={styles.balanceLabel}>Your Balance:</Text>
                  <Text style={styles.balanceValue}>{demoMode ? '2,450' : '0'} OTK</Text>
                </View>
                <Text style={styles.sectionLabel}>Available Items</Text>
              </>
            }
            ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyText}>No items in the shop yet</Text></View>}
            ListFooterComponent={<View style={styles.listFooter} />}
          />
        );

      case 'redeem':
        return (
          <ScrollView>
            <View style={styles.balanceBar}>
              <Text style={styles.balanceLabel}>Your Balance:</Text>
              <Text style={styles.balanceValue}>{demoMode ? '2,450' : '0'} OTK</Text>
            </View>
            <Text style={styles.sectionLabel}>Quick Redemption Options</Text>
            {(demoMode ? DEMO_REDEEM_OPTIONS : []).map((item) => (
              <TouchableOpacity key={item.id} style={styles.redeemCard}>
                <View style={styles.redeemInfo}>
                  <Text style={styles.redeemName}>{item.name}</Text>
                  <Text style={styles.redeemDesc}>{item.description}</Text>
                </View>
                <Text style={styles.redeemCostValue}>{item.otkCost} OTK</Text>
              </TouchableOpacity>
            ))}
            {!demoMode && (
              <View style={styles.emptyState}><Text style={styles.emptyText}>No redemption options available</Text></View>
            )}
            <View style={styles.listFooter} />
          </ScrollView>
        );

      case 'history':
        return (
          <FlatList
            data={demoMode ? DEMO_HISTORY : []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const s = statusStyle(item.status);
              return (
                <View style={styles.historyCard}>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyItem}>{item.item}</Text>
                    <Text style={styles.historyMeta}>{item.provider} | {item.date}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.historyOtk}>-{item.otkSpent} OTK</Text>
                    <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                      <Text style={[styles.statusText, { color: s.color }]}>{item.status}</Text>
                    </View>
                  </View>
                </View>
              );
            }}
            ListHeaderComponent={
              <View style={styles.totalSpent}>
                <Text style={styles.totalSpentValue}>{totalSpent} OTK Redeemed</Text>
              </View>
            }
            ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyText}>No redemption history</Text></View>}
            ListFooterComponent={<View style={styles.listFooter} />}
          />
        );
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'shop', label: 'Shop' },
    { key: 'redeem', label: 'Redeem' },
    { key: 'history', label: 'History' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reward Shop</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity key={tab.key} style={[styles.tab, activeTab === tab.key && styles.activeTab]} onPress={() => setActiveTab(tab.key)}>
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.content}>{renderContent()}</View>
    </SafeAreaView>
  );
}
