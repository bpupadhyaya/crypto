/**
 * Trading Screen — Advanced trading interface for experienced users.
 *
 * Tabs: Trade, Orders, Book, History.
 * Trade: Order form (buy/sell, market/limit, amount, price).
 * Orders: Open orders with cancel action.
 * Book: Order book visualization with buy/sell walls.
 * History: Recent trades for selected pair.
 * Demo mode provides OTK/USDT pair data.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

type Tab = 'trade' | 'orders' | 'book' | 'history';
type Side = 'buy' | 'sell';
type OrderType = 'market' | 'limit';

interface Order {
  id: string;
  pair: string;
  side: Side;
  type: OrderType;
  price: number;
  amount: number;
  filled: number;
  total: number;
  time: string;
}

interface BookEntry {
  price: number;
  amount: number;
  total: number;
}

interface Trade {
  id: string;
  price: number;
  amount: number;
  side: Side;
  time: string;
}

interface TradingPair {
  symbol: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  totalTrades: number;
}

const DEMO_PAIRS: TradingPair[] = [
  { symbol: 'OTK/USDT', price: 0.0105, change24h: 5.2, high24h: 0.0112, low24h: 0.0098, volume24h: 890_000, totalTrades: 4_523 },
  { symbol: 'OTK/BTC', price: 0.00000015, change24h: 3.1, high24h: 0.00000016, low24h: 0.00000014, volume24h: 310_000, totalTrades: 1_892 },
  { symbol: 'OTK/ETH', price: 0.0000042, change24h: -1.8, high24h: 0.0000045, low24h: 0.0000040, volume24h: 650_000, totalTrades: 2_745 },
  { symbol: 'BTC/USDT', price: 69_420.50, change24h: 1.4, high24h: 70_100.00, low24h: 68_500.00, volume24h: 2_100_000, totalTrades: 12_340 },
  { symbol: 'ETH/USDT', price: 2_510.25, change24h: -0.6, high24h: 2_560.00, low24h: 2_480.00, volume24h: 1_500_000, totalTrades: 8_920 },
];

const DEMO_ORDERS: Order[] = [
  { id: 'o1', pair: 'OTK/USDT', side: 'buy', type: 'limit', price: 0.0098, amount: 10_000, filled: 0, total: 98.00, time: '14:32:05' },
  { id: 'o2', pair: 'OTK/USDT', side: 'sell', type: 'limit', price: 0.0120, amount: 5_000, filled: 0, total: 60.00, time: '14:28:41' },
  { id: 'o3', pair: 'OTK/USDT', side: 'buy', type: 'limit', price: 0.0095, amount: 20_000, filled: 4_000, total: 190.00, time: '13:55:12' },
  { id: 'o4', pair: 'OTK/USDT', side: 'sell', type: 'limit', price: 0.0115, amount: 8_000, filled: 2_000, total: 92.00, time: '13:40:33' },
  { id: 'o5', pair: 'OTK/USDT', side: 'buy', type: 'limit', price: 0.0090, amount: 15_000, filled: 0, total: 135.00, time: '12:15:07' },
];

const DEMO_BOOK_BIDS: BookEntry[] = [
  { price: 0.0104, amount: 45_000, total: 468.00 },
  { price: 0.0103, amount: 82_000, total: 844.60 },
  { price: 0.0102, amount: 120_000, total: 1_224.00 },
  { price: 0.0101, amount: 65_000, total: 656.50 },
  { price: 0.0100, amount: 200_000, total: 2_000.00 },
  { price: 0.0099, amount: 150_000, total: 1_485.00 },
  { price: 0.0098, amount: 95_000, total: 931.00 },
  { price: 0.0097, amount: 55_000, total: 533.50 },
];

const DEMO_BOOK_ASKS: BookEntry[] = [
  { price: 0.0106, amount: 38_000, total: 402.80 },
  { price: 0.0107, amount: 72_000, total: 770.40 },
  { price: 0.0108, amount: 95_000, total: 1_026.00 },
  { price: 0.0109, amount: 110_000, total: 1_199.00 },
  { price: 0.0110, amount: 180_000, total: 1_980.00 },
  { price: 0.0112, amount: 60_000, total: 672.00 },
  { price: 0.0115, amount: 140_000, total: 1_610.00 },
  { price: 0.0120, amount: 45_000, total: 540.00 },
];

const DEMO_TRADES: Trade[] = [
  { id: 't1', price: 0.0105, amount: 2_500, side: 'buy', time: '14:35:12' },
  { id: 't2', price: 0.0105, amount: 1_800, side: 'sell', time: '14:34:58' },
  { id: 't3', price: 0.0106, amount: 5_000, side: 'buy', time: '14:34:42' },
  { id: 't4', price: 0.0104, amount: 3_200, side: 'sell', time: '14:34:15' },
  { id: 't5', price: 0.0104, amount: 8_000, side: 'buy', time: '14:33:51' },
  { id: 't6', price: 0.0103, amount: 1_500, side: 'sell', time: '14:33:28' },
  { id: 't7', price: 0.0105, amount: 4_200, side: 'buy', time: '14:32:59' },
  { id: 't8', price: 0.0106, amount: 6_800, side: 'buy', time: '14:32:33' },
  { id: 't9', price: 0.0104, amount: 2_100, side: 'sell', time: '14:31:47' },
  { id: 't10', price: 0.0103, amount: 9_500, side: 'sell', time: '14:31:12' },
];

function formatNum(n: number, decimals: number = 2): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(decimals)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(decimals)}K`;
  return n.toFixed(decimals);
}

function formatPrice(n: number): string {
  if (n >= 1) return n.toFixed(2);
  if (n >= 0.001) return n.toFixed(4);
  return n.toFixed(8);
}

export function TradingScreen({ onClose }: Props) {
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const [tab, setTab] = useState<Tab>('trade');
  const [selectedPair, setSelectedPair] = useState(DEMO_PAIRS[0]);
  const [showPairSelector, setShowPairSelector] = useState(false);
  const [side, setSide] = useState<Side>('buy');
  const [orderType, setOrderType] = useState<OrderType>('limit');
  const [price, setPrice] = useState(formatPrice(DEMO_PAIRS[0].price));
  const [amount, setAmount] = useState('');
  const [orders, setOrders] = useState<Order[]>(DEMO_ORDERS);

  const total = useMemo(() => {
    const p = parseFloat(price) || 0;
    const a = parseFloat(amount) || 0;
    return p * a;
  }, [price, amount]);

  const maxBookAmount = useMemo(() => {
    const maxBid = Math.max(...DEMO_BOOK_BIDS.map((b) => b.amount));
    const maxAsk = Math.max(...DEMO_BOOK_ASKS.map((a) => a.amount));
    return Math.max(maxBid, maxAsk);
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    tabs: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.green },
    tabInactive: { backgroundColor: t.bg.card },
    tabText: { fontSize: 13, fontWeight: '700' },
    tabTextActive: { color: t.bg.primary },
    tabTextInactive: { color: t.text.muted },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    // Pair selector
    pairBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: t.bg.card, borderRadius: 12, padding: 14, marginHorizontal: 20, marginBottom: 12 },
    pairSymbol: { color: t.text.primary, fontSize: 18, fontWeight: '800' },
    pairPrice: { color: t.accent.green, fontSize: 16, fontWeight: '700' },
    pairChange: { fontSize: 13, fontWeight: '700' },
    pairChangePos: { color: t.accent.green },
    pairChangeNeg: { color: t.accent.red },
    pairChevron: { color: t.text.muted, fontSize: 16 },
    pairDropdown: { backgroundColor: t.bg.card, borderRadius: 12, marginHorizontal: 20, marginBottom: 12, overflow: 'hidden' },
    pairOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: t.border },
    pairOptionText: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    pairOptionPrice: { color: t.text.muted, fontSize: 13 },
    // Stats bar
    statsBar: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 12 },
    statItem: { flex: 1, alignItems: 'center' },
    statLabel: { color: t.text.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
    statValue: { color: t.text.primary, fontSize: 12, fontWeight: '700', marginTop: 2 },
    // Order form
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginBottom: 16 },
    sideToggle: { flexDirection: 'row', marginBottom: 16, borderRadius: 10, overflow: 'hidden' },
    sideBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
    sideBuyActive: { backgroundColor: t.accent.green },
    sideSellActive: { backgroundColor: t.accent.red },
    sideBtnInactive: { backgroundColor: t.bg.primary },
    sideText: { fontSize: 14, fontWeight: '800' },
    sideTextActive: { color: t.bg.primary },
    sideTextInactive: { color: t.text.muted },
    typeToggle: { flexDirection: 'row', marginBottom: 16 },
    typeBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, marginHorizontal: 4 },
    typeActive: { backgroundColor: t.accent.blue + '30' },
    typeInactive: { backgroundColor: 'transparent' },
    typeText: { fontSize: 13, fontWeight: '600' },
    typeTextActive: { color: t.accent.blue },
    typeTextInactive: { color: t.text.muted },
    inputLabel: { color: t.text.muted, fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
    input: { backgroundColor: t.bg.primary, color: t.text.primary, fontSize: 16, fontWeight: '700', padding: 14, borderRadius: 12, marginBottom: 14 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    totalLabel: { color: t.text.muted, fontSize: 13 },
    totalValue: { color: t.text.primary, fontSize: 16, fontWeight: '800' },
    submitBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
    submitBuy: { backgroundColor: t.accent.green },
    submitSell: { backgroundColor: t.accent.red },
    submitText: { color: t.bg.primary, fontSize: 16, fontWeight: '800' },
    // Orders list
    orderCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 10 },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    orderPair: { color: t.text.primary, fontSize: 14, fontWeight: '700' },
    orderSideBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    orderSideText: { fontSize: 11, fontWeight: '800', color: t.bg.primary },
    orderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    orderLabel: { color: t.text.muted, fontSize: 12 },
    orderValue: { color: t.text.primary, fontSize: 12, fontWeight: '600' },
    cancelBtn: { marginTop: 8, paddingVertical: 8, borderRadius: 8, backgroundColor: t.accent.red + '20', alignItems: 'center' },
    cancelText: { color: t.accent.red, fontSize: 12, fontWeight: '700' },
    progressBar: { height: 4, borderRadius: 2, backgroundColor: t.bg.primary, marginTop: 8 },
    progressFill: { height: 4, borderRadius: 2, backgroundColor: t.accent.green },
    // Order book
    bookHeader: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: t.border },
    bookHeaderText: { flex: 1, color: t.text.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    bookRow: { flexDirection: 'row', paddingVertical: 6, position: 'relative' },
    bookBar: { position: 'absolute', top: 0, bottom: 0, opacity: 0.12, borderRadius: 2 },
    bookBidBar: { backgroundColor: t.accent.green, right: 0 },
    bookAskBar: { backgroundColor: t.accent.red, right: 0 },
    bookPrice: { flex: 1, fontSize: 12, fontWeight: '600' },
    bookPriceBid: { color: t.accent.green },
    bookPriceAsk: { color: t.accent.red },
    bookAmount: { flex: 1, color: t.text.primary, fontSize: 12, textAlign: 'center' },
    bookTotal: { flex: 1, color: t.text.muted, fontSize: 12, textAlign: 'right' },
    spreadRow: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 10, backgroundColor: t.bg.card, marginVertical: 2, borderRadius: 8 },
    spreadText: { color: t.text.muted, fontSize: 12 },
    spreadValue: { color: t.text.primary, fontSize: 12, fontWeight: '700', marginLeft: 6 },
    // Trade history
    tradeRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: t.border },
    tradePrice: { flex: 1, fontSize: 13, fontWeight: '600' },
    tradeAmount: { flex: 1, color: t.text.primary, fontSize: 13, textAlign: 'center' },
    tradeTime: { flex: 1, color: t.text.muted, fontSize: 13, textAlign: 'right' },
    // Empty state
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', paddingVertical: 20 },
    sectionLabel: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, marginTop: 8 },
    demoBanner: { backgroundColor: t.accent.blue + '20', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, marginBottom: 12 },
    demoBannerText: { color: t.accent.blue, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  }), [t]);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'trade', label: 'Trade' },
    { key: 'orders', label: 'Orders' },
    { key: 'book', label: 'Book' },
    { key: 'history', label: 'History' },
  ];

  const handleSelectPair = useCallback((pair: TradingPair) => {
    setSelectedPair(pair);
    setPrice(formatPrice(pair.price));
    setShowPairSelector(false);
  }, []);

  const handleCancelOrder = useCallback((orderId: string) => {
    if (demoMode) {
      Alert.alert('Demo Mode', 'Order cancelled (simulated)');
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      return;
    }
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Cancel Order', style: 'destructive', onPress: () => setOrders((prev) => prev.filter((o) => o.id !== orderId)) },
    ]);
  }, [demoMode]);

  const handleSubmitOrder = useCallback(() => {
    const p = parseFloat(price) || 0;
    const a = parseFloat(amount) || 0;
    if (a <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    if (orderType === 'limit' && p <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price for limit order.');
      return;
    }
    const finalPrice = orderType === 'market' ? selectedPair.price : p;
    if (demoMode) {
      const newOrder: Order = {
        id: `o${Date.now()}`,
        pair: selectedPair.symbol,
        side,
        type: orderType,
        price: finalPrice,
        amount: a,
        filled: 0,
        total: finalPrice * a,
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      };
      setOrders((prev) => [newOrder, ...prev]);
      setAmount('');
      Alert.alert('Order Placed', `${side.toUpperCase()} ${formatNum(a, 0)} ${selectedPair.symbol.split('/')[0]} at ${formatPrice(finalPrice)} (demo)`);
      return;
    }
    Alert.alert('Coming Soon', 'Live trading requires a connected wallet on mainnet.');
  }, [price, amount, side, orderType, selectedPair, demoMode]);

  const renderTrade = useCallback(() => (
    <>
      {demoMode && (
        <View style={s.demoBanner}>
          <Text style={s.demoBannerText}>Demo Mode — Orders are simulated</Text>
        </View>
      )}

      <View style={s.card}>
        {/* Side toggle */}
        <View style={s.sideToggle}>
          <TouchableOpacity
            style={[s.sideBtn, side === 'buy' ? s.sideBuyActive : s.sideBtnInactive]}
            onPress={() => setSide('buy')}
          >
            <Text style={[s.sideText, side === 'buy' ? s.sideTextActive : s.sideTextInactive]}>BUY</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.sideBtn, side === 'sell' ? s.sideSellActive : s.sideBtnInactive]}
            onPress={() => setSide('sell')}
          >
            <Text style={[s.sideText, side === 'sell' ? s.sideTextActive : s.sideTextInactive]}>SELL</Text>
          </TouchableOpacity>
        </View>

        {/* Order type toggle */}
        <View style={s.typeToggle}>
          <TouchableOpacity
            style={[s.typeBtn, orderType === 'limit' ? s.typeActive : s.typeInactive]}
            onPress={() => setOrderType('limit')}
          >
            <Text style={[s.typeText, orderType === 'limit' ? s.typeTextActive : s.typeTextInactive]}>Limit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.typeBtn, orderType === 'market' ? s.typeActive : s.typeInactive]}
            onPress={() => setOrderType('market')}
          >
            <Text style={[s.typeText, orderType === 'market' ? s.typeTextActive : s.typeTextInactive]}>Market</Text>
          </TouchableOpacity>
        </View>

        {/* Price input (only for limit) */}
        {orderType === 'limit' && (
          <>
            <Text style={s.inputLabel}>Price ({selectedPair.symbol.split('/')[1]})</Text>
            <TextInput
              style={s.input}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              placeholder={formatPrice(selectedPair.price)}
              placeholderTextColor={t.text.muted}
            />
          </>
        )}

        {/* Amount input */}
        <Text style={s.inputLabel}>Amount ({selectedPair.symbol.split('/')[0]})</Text>
        <TextInput
          style={s.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="0.00"
          placeholderTextColor={t.text.muted}
        />

        {/* Total */}
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>Total</Text>
          <Text style={s.totalValue}>
            {total > 0 ? `${total.toFixed(4)} ${selectedPair.symbol.split('/')[1]}` : '--'}
          </Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[s.submitBtn, side === 'buy' ? s.submitBuy : s.submitSell]}
          onPress={handleSubmitOrder}
        >
          <Text style={s.submitText}>
            {side === 'buy' ? 'Buy' : 'Sell'} {selectedPair.symbol.split('/')[0]}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  ), [demoMode, side, orderType, price, amount, total, selectedPair, s, t, handleSubmitOrder]);

  const renderOrders = useCallback(() => (
    <>
      <Text style={s.sectionLabel}>Open Orders ({orders.length})</Text>
      {orders.length === 0 ? (
        <Text style={s.emptyText}>No open orders</Text>
      ) : (
        orders.map((order) => (
          <View key={order.id} style={s.orderCard}>
            <View style={s.orderHeader}>
              <Text style={s.orderPair}>{order.pair}</Text>
              <View style={[s.orderSideBadge, { backgroundColor: order.side === 'buy' ? t.accent.green : t.accent.red }]}>
                <Text style={s.orderSideText}>{order.side.toUpperCase()}</Text>
              </View>
            </View>
            <View style={s.orderRow}>
              <Text style={s.orderLabel}>Type</Text>
              <Text style={s.orderValue}>{order.type.charAt(0).toUpperCase() + order.type.slice(1)}</Text>
            </View>
            <View style={s.orderRow}>
              <Text style={s.orderLabel}>Price</Text>
              <Text style={s.orderValue}>{formatPrice(order.price)}</Text>
            </View>
            <View style={s.orderRow}>
              <Text style={s.orderLabel}>Amount</Text>
              <Text style={s.orderValue}>{formatNum(order.amount, 0)}</Text>
            </View>
            <View style={s.orderRow}>
              <Text style={s.orderLabel}>Filled</Text>
              <Text style={s.orderValue}>{formatNum(order.filled, 0)} / {formatNum(order.amount, 0)}</Text>
            </View>
            <View style={s.orderRow}>
              <Text style={s.orderLabel}>Total</Text>
              <Text style={s.orderValue}>${order.total.toFixed(2)}</Text>
            </View>
            <View style={s.orderRow}>
              <Text style={s.orderLabel}>Time</Text>
              <Text style={s.orderValue}>{order.time}</Text>
            </View>
            {order.filled > 0 && (
              <View style={s.progressBar}>
                <View style={[s.progressFill, { width: `${(order.filled / order.amount) * 100}%` }]} />
              </View>
            )}
            <TouchableOpacity style={s.cancelBtn} onPress={() => handleCancelOrder(order.id)}>
              <Text style={s.cancelText}>Cancel Order</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </>
  ), [orders, s, t, handleCancelOrder]);

  const renderBook = useCallback(() => (
    <>
      <Text style={s.sectionLabel}>Order Book — {selectedPair.symbol}</Text>

      <View style={s.card}>
        {/* Header */}
        <View style={s.bookHeader}>
          <Text style={s.bookHeaderText}>Price</Text>
          <Text style={[s.bookHeaderText, { textAlign: 'center' }]}>Amount</Text>
          <Text style={[s.bookHeaderText, { textAlign: 'right' }]}>Total</Text>
        </View>

        {/* Asks (reversed so lowest ask is at bottom) */}
        {[...DEMO_BOOK_ASKS].reverse().map((entry, i) => (
          <View key={`ask-${i}`} style={s.bookRow}>
            <View style={[s.bookBar, s.bookAskBar, { width: `${(entry.amount / maxBookAmount) * 100}%` }]} />
            <Text style={[s.bookPrice, s.bookPriceAsk]}>{formatPrice(entry.price)}</Text>
            <Text style={s.bookAmount}>{formatNum(entry.amount, 0)}</Text>
            <Text style={s.bookTotal}>${formatNum(entry.total, 0)}</Text>
          </View>
        ))}

        {/* Spread */}
        <View style={s.spreadRow}>
          <Text style={s.spreadText}>Spread:</Text>
          <Text style={s.spreadValue}>
            {formatPrice(DEMO_BOOK_ASKS[0].price - DEMO_BOOK_BIDS[0].price)} ({((DEMO_BOOK_ASKS[0].price - DEMO_BOOK_BIDS[0].price) / DEMO_BOOK_BIDS[0].price * 100).toFixed(2)}%)
          </Text>
        </View>

        {/* Bids */}
        {DEMO_BOOK_BIDS.map((entry, i) => (
          <View key={`bid-${i}`} style={s.bookRow}>
            <View style={[s.bookBar, s.bookBidBar, { width: `${(entry.amount / maxBookAmount) * 100}%` }]} />
            <Text style={[s.bookPrice, s.bookPriceBid]}>{formatPrice(entry.price)}</Text>
            <Text style={s.bookAmount}>{formatNum(entry.amount, 0)}</Text>
            <Text style={s.bookTotal}>${formatNum(entry.total, 0)}</Text>
          </View>
        ))}
      </View>
    </>
  ), [selectedPair, maxBookAmount, s]);

  const renderHistory = useCallback(() => (
    <>
      <Text style={s.sectionLabel}>Recent Trades — {selectedPair.symbol}</Text>

      <View style={s.card}>
        <View style={s.bookHeader}>
          <Text style={s.bookHeaderText}>Price</Text>
          <Text style={[s.bookHeaderText, { textAlign: 'center' }]}>Amount</Text>
          <Text style={[s.bookHeaderText, { textAlign: 'right' }]}>Time</Text>
        </View>

        {DEMO_TRADES.map((trade) => (
          <View key={trade.id} style={s.tradeRow}>
            <Text style={[s.tradePrice, { color: trade.side === 'buy' ? t.accent.green : t.accent.red }]}>
              {formatPrice(trade.price)}
            </Text>
            <Text style={s.tradeAmount}>{formatNum(trade.amount, 0)}</Text>
            <Text style={s.tradeTime}>{trade.time}</Text>
          </View>
        ))}
      </View>
    </>
  ), [selectedPair, s, t]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Trading</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      {/* Pair selector bar */}
      <TouchableOpacity style={s.pairBar} onPress={() => setShowPairSelector(!showPairSelector)}>
        <Text style={s.pairSymbol}>{selectedPair.symbol}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={s.pairPrice}>{formatPrice(selectedPair.price)}</Text>
          <Text style={[s.pairChange, selectedPair.change24h >= 0 ? s.pairChangePos : s.pairChangeNeg]}>
            {selectedPair.change24h >= 0 ? '+' : ''}{selectedPair.change24h.toFixed(1)}%
          </Text>
          <Text style={s.pairChevron}>{showPairSelector ? '\u25B2' : '\u25BC'}</Text>
        </View>
      </TouchableOpacity>

      {/* Pair dropdown */}
      {showPairSelector && (
        <View style={s.pairDropdown}>
          {DEMO_PAIRS.map((pair) => (
            <TouchableOpacity key={pair.symbol} style={s.pairOption} onPress={() => handleSelectPair(pair)}>
              <Text style={s.pairOptionText}>{pair.symbol}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={s.pairOptionPrice}>{formatPrice(pair.price)}</Text>
                <Text style={[s.pairChange, pair.change24h >= 0 ? s.pairChangePos : s.pairChangeNeg]}>
                  {pair.change24h >= 0 ? '+' : ''}{pair.change24h.toFixed(1)}%
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Stats bar */}
      <View style={s.statsBar}>
        <View style={s.statItem}>
          <Text style={s.statLabel}>24h Vol</Text>
          <Text style={s.statValue}>${formatNum(selectedPair.volume24h)}</Text>
        </View>
        <View style={s.statItem}>
          <Text style={s.statLabel}>24h High</Text>
          <Text style={s.statValue}>{formatPrice(selectedPair.high24h)}</Text>
        </View>
        <View style={s.statItem}>
          <Text style={s.statLabel}>24h Low</Text>
          <Text style={s.statValue}>{formatPrice(selectedPair.low24h)}</Text>
        </View>
        <View style={s.statItem}>
          <Text style={s.statLabel}>Trades</Text>
          <Text style={s.statValue}>{formatNum(selectedPair.totalTrades, 0)}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {TABS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[s.tab, tab === item.key ? s.tabActive : s.tabInactive]}
            onPress={() => setTab(item.key)}
          >
            <Text style={[s.tabText, tab === item.key ? s.tabTextActive : s.tabTextInactive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {tab === 'trade' && renderTrade()}
        {tab === 'orders' && renderOrders()}
        {tab === 'book' && renderBook()}
        {tab === 'history' && renderHistory()}
      </ScrollView>
    </SafeAreaView>
  );
}
