import { fonts } from '../utils/theme';
/**
 * Farm to Table Screen — Direct producer-to-consumer food, supporting local farmers.
 *
 * Article I: "Every person shall have access to nutritious food at minimal cost."
 * Open Chain connects local producers directly with community members.
 *
 * Features:
 * - Local producers list (farmers, bakers, fishers, beekeepers with products)
 * - Weekly harvest — what's available this week from local farms
 * - Order/reserve system (pre-order from producer, pay in OTK)
 * - Delivery/pickup coordination (community drop-off points)
 * - Producer stories (meet the farmer, learn about their practices)
 * - Seasonal produce guide by region
 * - Demo mode with sample data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface Producer {
  id: string;
  name: string;
  type: string;
  icon: string;
  location: string;
  distanceKm: number;
  rating: number;
  products: string[];
  bio: string;
  practicesSummary: string;
  memberSince: string;
  totalSales: number;
}

interface HarvestItem {
  id: string;
  producerId: string;
  producerName: string;
  product: string;
  category: string;
  quantity: string;
  priceOTK: number;
  availableUntil: string;
  organic: boolean;
  icon: string;
}

interface Order {
  id: string;
  items: { product: string; quantity: string; priceOTK: number }[];
  producerId: string;
  producerName: string;
  status: 'pending' | 'confirmed' | 'ready' | 'picked_up';
  pickupPoint: string;
  pickupDate: string;
  totalOTK: number;
  placedDate: string;
}

interface DropOffPoint {
  id: string;
  name: string;
  address: string;
  hours: string;
  nextAvailable: string;
  producersServed: string[];
}

interface ProducerStory {
  id: string;
  producerId: string;
  producerName: string;
  title: string;
  excerpt: string;
  practiceHighlights: string[];
  yearsExperience: number;
  date: string;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const PRODUCER_TYPES = [
  { key: 'farmer', label: 'Farmer', icon: 'F' },
  { key: 'baker', label: 'Baker', icon: 'B' },
  { key: 'fisher', label: 'Fisher', icon: '~' },
  { key: 'beekeeper', label: 'Beekeeper', icon: '*' },
];

const SEASONS: Record<string, string[]> = {
  spring: ['Asparagus', 'Peas', 'Strawberries', 'Spinach', 'Radishes'],
  summer: ['Tomatoes', 'Corn', 'Peaches', 'Zucchini', 'Blueberries'],
  fall: ['Apples', 'Pumpkins', 'Squash', 'Sweet Potatoes', 'Grapes'],
  winter: ['Kale', 'Citrus', 'Root Vegetables', 'Cabbage', 'Leeks'],
};

// ─── Demo Data ───

const DEMO_PRODUCERS: Producer[] = [
  {
    id: 'p1', name: 'Green Acres Farm', type: 'farmer', icon: 'F',
    location: 'Valley Road, 3.2km', distanceKm: 3.2, rating: 4.8,
    products: ['Tomatoes', 'Lettuce', 'Carrots', 'Peppers', 'Herbs'],
    bio: 'Family-owned farm since 1985. We grow seasonal vegetables using sustainable practices, no pesticides, and regenerative soil methods.',
    practicesSummary: 'Organic, no-till, cover crops, rainwater harvest',
    memberSince: '2025-06', totalSales: 342,
  },
  {
    id: 'p2', name: 'Sunrise Bakery', type: 'baker', icon: 'B',
    location: 'Main Street, 1.1km', distanceKm: 1.1, rating: 4.9,
    products: ['Sourdough', 'Whole Wheat', 'Rye Bread', 'Pastries'],
    bio: 'Artisan bakery using locally sourced grains. Every loaf is hand-shaped and stone-oven baked fresh each morning.',
    practicesSummary: 'Local grains, stone-oven, zero waste packaging',
    memberSince: '2025-09', totalSales: 518,
  },
  {
    id: 'p3', name: 'River Catch Co-op', type: 'fisher', icon: '~',
    location: 'Harbor Dock, 5.8km', distanceKm: 5.8, rating: 4.6,
    products: ['Trout', 'Salmon', 'Shrimp', 'Smoked Fish'],
    bio: 'A cooperative of small-boat fishers committed to sustainable catch limits. Fresh from river to table within hours.',
    practicesSummary: 'Sustainable catch limits, small-boat only, same-day delivery',
    memberSince: '2025-11', totalSales: 189,
  },
  {
    id: 'p4', name: 'Golden Hive Apiaries', type: 'beekeeper', icon: '*',
    location: 'Hillside Lane, 4.5km', distanceKm: 4.5, rating: 4.7,
    products: ['Raw Honey', 'Honeycomb', 'Beeswax Candles', 'Propolis'],
    bio: 'Third-generation beekeeper nurturing 60 hives across wildflower meadows. Our bees pollinate local farms and orchards.',
    practicesSummary: 'Treatment-free, wildflower forage, pollination services',
    memberSince: '2026-01', totalSales: 97,
  },
];

const DEMO_HARVEST: HarvestItem[] = [
  { id: 'h1', producerId: 'p1', producerName: 'Green Acres Farm', product: 'Heirloom Tomatoes', category: 'vegetable', quantity: '2kg bags', priceOTK: 45, availableUntil: '2026-04-02', organic: true, icon: 'T' },
  { id: 'h2', producerId: 'p1', producerName: 'Green Acres Farm', product: 'Mixed Lettuce Box', category: 'vegetable', quantity: '1 box', priceOTK: 30, availableUntil: '2026-04-01', organic: true, icon: 'L' },
  { id: 'h3', producerId: 'p2', producerName: 'Sunrise Bakery', product: 'Sourdough Loaf', category: 'bread', quantity: '1 loaf', priceOTK: 25, availableUntil: '2026-03-31', organic: false, icon: 'S' },
  { id: 'h4', producerId: 'p3', producerName: 'River Catch Co-op', product: 'Fresh Rainbow Trout', category: 'fish', quantity: '500g', priceOTK: 60, availableUntil: '2026-03-30', organic: false, icon: '~' },
  { id: 'h5', producerId: 'p4', producerName: 'Golden Hive Apiaries', product: 'Raw Wildflower Honey', category: 'honey', quantity: '500ml jar', priceOTK: 55, availableUntil: '2026-04-05', organic: true, icon: '*' },
  { id: 'h6', producerId: 'p1', producerName: 'Green Acres Farm', product: 'Fresh Herb Bundle', category: 'herb', quantity: 'Basil, Cilantro, Dill', priceOTK: 20, availableUntil: '2026-04-01', organic: true, icon: 'H' },
];

const DEMO_DROP_OFF_POINTS: DropOffPoint[] = [
  { id: 'd1', name: 'Community Center Hub', address: '42 Elm Street', hours: 'Tue & Fri 4-7pm', nextAvailable: '2026-04-01', producersServed: ['Green Acres Farm', 'Golden Hive Apiaries'] },
  { id: 'd2', name: 'Library Pickup Point', address: '15 Oak Avenue', hours: 'Wed & Sat 9am-12pm', nextAvailable: '2026-04-02', producersServed: ['Sunrise Bakery', 'River Catch Co-op', 'Green Acres Farm'] },
];

const DEMO_ORDERS: Order[] = [
  {
    id: 'ord1',
    items: [
      { product: 'Heirloom Tomatoes', quantity: '2kg', priceOTK: 45 },
      { product: 'Fresh Herb Bundle', quantity: '1 bundle', priceOTK: 20 },
    ],
    producerId: 'p1', producerName: 'Green Acres Farm',
    status: 'confirmed', pickupPoint: 'Community Center Hub',
    pickupDate: '2026-04-01', totalOTK: 65, placedDate: '2026-03-28',
  },
];

const DEMO_STORIES: ProducerStory[] = [
  {
    id: 's1', producerId: 'p1', producerName: 'Green Acres Farm',
    title: 'From Corporate to Compost: A Family\'s Return to the Land',
    excerpt: 'After 20 years in tech, the Chen family traded keyboards for cultivators. Their regenerative methods have restored 40 acres of depleted soil into thriving farmland that feeds 200 families weekly.',
    practiceHighlights: ['No-till regenerative farming', 'Cover crop rotation', 'Community-supported agriculture model'],
    yearsExperience: 8, date: '2026-03-15',
  },
  {
    id: 's2', producerId: 'p4', producerName: 'Golden Hive Apiaries',
    title: 'Guardians of the Pollinators',
    excerpt: 'Maria learned beekeeping from her grandmother in rural Mexico. Now managing 60 hives, her treatment-free approach has achieved a 95% colony survival rate while providing essential pollination services to neighboring farms.',
    practiceHighlights: ['Treatment-free beekeeping', 'Wildflower meadow restoration', 'Pollination partnership program'],
    yearsExperience: 22, date: '2026-03-10',
  },
];

type Tab = 'producers' | 'harvest' | 'order' | 'stories';

export function FarmToTableScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('producers');
  const [selectedProducer, setSelectedProducer] = useState<Producer | null>(null);
  const [selectedStory, setSelectedStory] = useState<ProducerStory | null>(null);
  const [cart, setCart] = useState<HarvestItem[]>([]);
  const [selectedPickup, setSelectedPickup] = useState<DropOffPoint | null>(null);
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const currentSeason = useMemo(() => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }, []);

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.priceOTK, 0), [cart]);

  const addToCart = useCallback((item: HarvestItem) => {
    setCart(prev => [...prev, item]);
    Alert.alert('Added', `${item.product} added to your order.`);
  }, []);

  const placeOrder = useCallback(() => {
    if (cart.length === 0) { Alert.alert('Empty', 'Add items from the weekly harvest first.'); return; }
    if (!selectedPickup) { Alert.alert('Pickup Point', 'Select a drop-off point for your order.'); return; }
    Alert.alert(
      'Order Placed',
      `${cart.length} item(s) for ${cartTotal} OTK.\nPickup: ${selectedPickup.name}\nNext available: ${selectedPickup.nextAvailable}\n\nProducer will confirm shortly.`,
    );
    setCart([]);
    setSelectedPickup(null);
  }, [cart, cartTotal, selectedPickup]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.green + '20' },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.green },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    subText: { color: t.text.muted, fontSize: 13, marginTop: 4 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    producerName: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold },
    producerType: { color: t.text.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
    producerIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: t.accent.green + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    iconText: { color: t.accent.green, fontSize: 18, fontWeight: fonts.heavy },
    producerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    ratingText: { color: t.accent.orange || '#FF9500', fontSize: 13, fontWeight: fonts.bold },
    distanceText: { color: t.text.muted, fontSize: 12 },
    productTag: { backgroundColor: t.accent.green + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 6, marginBottom: 6 },
    productTagText: { color: t.accent.green, fontSize: 11, fontWeight: fonts.semibold },
    productRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
    harvestCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    harvestProduct: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    harvestProducer: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    priceText: { color: t.accent.green, fontSize: 16, fontWeight: fonts.heavy },
    organicBadge: { backgroundColor: '#34C759' + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    organicText: { color: '#34C759', fontSize: 10, fontWeight: fonts.bold },
    addBtn: { backgroundColor: t.accent.green, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, marginTop: 10 },
    addBtnText: { color: '#fff', fontSize: 13, fontWeight: fonts.bold, textAlign: 'center' },
    orderSummary: { backgroundColor: t.accent.green + '10', borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 16 },
    orderTotal: { color: t.accent.green, fontSize: 22, fontWeight: fonts.heavy },
    orderLabel: { color: t.text.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
    pickupCard: { backgroundColor: t.bg.secondary, borderRadius: 12, padding: 14, marginHorizontal: 20, marginBottom: 10, borderWidth: 2, borderColor: 'transparent' },
    pickupSelected: { borderColor: t.accent.green },
    pickupName: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    pickupAddress: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    pickupHours: { color: t.accent.blue, fontSize: 12, marginTop: 4 },
    placeOrderBtn: { backgroundColor: t.accent.green, borderRadius: 16, padding: 18, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    placeOrderText: { color: '#fff', fontSize: 16, fontWeight: fonts.heavy },
    existingOrder: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    statusText: { fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase' },
    storyCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    storyTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold, marginBottom: 8 },
    storyExcerpt: { color: t.text.muted, fontSize: 13, lineHeight: 20 },
    storyProducer: { color: t.accent.green, fontSize: 12, fontWeight: fonts.semibold, marginTop: 8 },
    highlightItem: { color: t.text.primary, fontSize: 13, marginTop: 4, paddingLeft: 8 },
    seasonCard: { backgroundColor: t.accent.green + '10', borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 16 },
    seasonTitle: { color: t.accent.green, fontSize: 14, fontWeight: fonts.bold, marginBottom: 8, textTransform: 'capitalize' },
    seasonItem: { color: t.text.primary, fontSize: 13, marginLeft: 8, marginBottom: 4 },
    detailBack: { color: t.accent.blue, fontSize: 14, marginHorizontal: 20, marginBottom: 12 },
    detailBio: { color: t.text.primary, fontSize: 14, lineHeight: 22, marginBottom: 12 },
    detailPractices: { color: t.text.muted, fontSize: 12, fontStyle: 'italic', marginBottom: 8 },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', padding: 40 },
    cartItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    cartProduct: { color: t.text.primary, fontSize: 13 },
    cartPrice: { color: t.accent.green, fontSize: 13, fontWeight: fonts.bold },
    demoBanner: { backgroundColor: t.accent.orange + '15', padding: 10, marginHorizontal: 20, borderRadius: 10, marginBottom: 12 },
    demoText: { color: t.accent.orange || '#FF9500', fontSize: 12, textAlign: 'center', fontWeight: fonts.semibold },
  }), [t]);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'producers', label: 'Producers' },
    { key: 'harvest', label: 'Harvest' },
    { key: 'order', label: 'Order' },
    { key: 'stories', label: 'Stories' },
  ];

  const statusColors: Record<string, string> = {
    pending: '#FF9500',
    confirmed: '#007AFF',
    ready: '#34C759',
    picked_up: '#8E8E93',
  };

  // ─── Producer Detail View ───

  const renderProducerDetail = () => {
    if (!selectedProducer) return null;
    const p = selectedProducer;
    return (
      <>
        <TouchableOpacity onPress={() => setSelectedProducer(null)}>
          <Text style={s.detailBack}>{'< Back to Producers'}</Text>
        </TouchableOpacity>
        <View style={s.card}>
          <View style={s.producerRow}>
            <View style={s.producerIcon}>
              <Text style={s.iconText}>{p.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.producerName}>{p.name}</Text>
              <Text style={s.producerType}>{p.type}</Text>
            </View>
            <Text style={s.ratingText}>{p.rating}/5</Text>
          </View>
          <Text style={s.detailBio}>{p.bio}</Text>
          <Text style={s.detailPractices}>{p.practicesSummary}</Text>
          <View style={s.productRow}>
            {p.products.map((prod) => (
              <View key={prod} style={s.productTag}>
                <Text style={s.productTagText}>{prod}</Text>
              </View>
            ))}
          </View>
          <View style={s.statRow}>
            <View style={s.statItem}>
              <Text style={s.statValue}>{p.totalSales}</Text>
              <Text style={s.statLabel}>Sales</Text>
            </View>
            <View style={s.statItem}>
              <Text style={s.statValue}>{p.distanceKm}km</Text>
              <Text style={s.statLabel}>Distance</Text>
            </View>
            <View style={s.statItem}>
              <Text style={s.statValue}>{p.memberSince}</Text>
              <Text style={s.statLabel}>Member Since</Text>
            </View>
          </View>
        </View>
      </>
    );
  };

  // ─── Producers Tab ───

  const renderProducers = () => {
    if (selectedProducer) return renderProducerDetail();
    return (
      <>
        <Text style={s.sectionTitle}>Local Producers</Text>
        {DEMO_PRODUCERS.map((p) => (
          <TouchableOpacity key={p.id} style={s.card} onPress={() => setSelectedProducer(p)}>
            <View style={s.producerRow}>
              <View style={s.producerIcon}>
                <Text style={s.iconText}>{p.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.producerName}>{p.name}</Text>
                <Text style={s.producerType}>{p.type} -- {p.location}</Text>
              </View>
              <Text style={s.ratingText}>{p.rating}/5</Text>
            </View>
            <View style={s.productRow}>
              {p.products.slice(0, 3).map((prod) => (
                <View key={prod} style={s.productTag}>
                  <Text style={s.productTagText}>{prod}</Text>
                </View>
              ))}
              {p.products.length > 3 && (
                <View style={s.productTag}>
                  <Text style={s.productTagText}>+{p.products.length - 3} more</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </>
    );
  };

  // ─── Harvest Tab ───

  const renderHarvest = () => (
    <>
      <Text style={s.sectionTitle}>This Week's Harvest</Text>
      {DEMO_HARVEST.map((item) => (
        <View key={item.id} style={s.harvestCard}>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <View style={[s.row, { justifyContent: 'flex-start', gap: 8 }]}>
                <Text style={s.harvestProduct}>{item.product}</Text>
                {item.organic && (
                  <View style={s.organicBadge}>
                    <Text style={s.organicText}>ORGANIC</Text>
                  </View>
                )}
              </View>
              <Text style={s.harvestProducer}>{item.producerName} -- {item.quantity}</Text>
              <Text style={s.subText}>Available until {item.availableUntil}</Text>
            </View>
            <Text style={s.priceText}>{item.priceOTK} OTK</Text>
          </View>
          <TouchableOpacity style={s.addBtn} onPress={() => addToCart(item)}>
            <Text style={s.addBtnText}>Add to Order</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Text style={[s.sectionTitle, { marginTop: 8 }]}>Seasonal Produce Guide</Text>
      <View style={s.seasonCard}>
        <Text style={s.seasonTitle}>Current Season: {currentSeason}</Text>
        {SEASONS[currentSeason].map((item) => (
          <Text key={item} style={s.seasonItem}>-- {item}</Text>
        ))}
      </View>
      {Object.entries(SEASONS)
        .filter(([key]) => key !== currentSeason)
        .map(([season, items]) => (
          <View key={season} style={[s.seasonCard, { opacity: 0.6 }]}>
            <Text style={s.seasonTitle}>{season}</Text>
            {items.map((item) => (
              <Text key={item} style={s.seasonItem}>-- {item}</Text>
            ))}
          </View>
        ))}
    </>
  );

  // ─── Order Tab ───

  const renderOrder = () => (
    <>
      {cart.length > 0 && (
        <>
          <Text style={s.sectionTitle}>Your Cart</Text>
          <View style={s.orderSummary}>
            {cart.map((item, idx) => (
              <View key={`${item.id}-${idx}`} style={s.cartItem}>
                <Text style={s.cartProduct}>{item.product} ({item.quantity})</Text>
                <Text style={s.cartPrice}>{item.priceOTK} OTK</Text>
              </View>
            ))}
            <View style={[s.row, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: t.text.muted + '20' }]}>
              <Text style={s.orderLabel}>Total</Text>
              <Text style={s.orderTotal}>{cartTotal} OTK</Text>
            </View>
          </View>

          <Text style={s.sectionTitle}>Select Pickup Point</Text>
          {DEMO_DROP_OFF_POINTS.map((point) => (
            <TouchableOpacity
              key={point.id}
              style={[s.pickupCard, selectedPickup?.id === point.id && s.pickupSelected]}
              onPress={() => setSelectedPickup(point)}
            >
              <Text style={s.pickupName}>{point.name}</Text>
              <Text style={s.pickupAddress}>{point.address}</Text>
              <Text style={s.pickupHours}>{point.hours}</Text>
              <Text style={s.subText}>Serves: {point.producersServed.join(', ')}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={s.placeOrderBtn} onPress={placeOrder}>
            <Text style={s.placeOrderText}>Place Order -- {cartTotal} OTK</Text>
          </TouchableOpacity>
        </>
      )}

      {cart.length === 0 && (
        <Text style={s.emptyText}>
          Your cart is empty.{'\n'}Browse the Harvest tab to add items.
        </Text>
      )}

      <Text style={s.sectionTitle}>Your Orders</Text>
      {DEMO_ORDERS.map((order) => (
        <View key={order.id} style={s.existingOrder}>
          <View style={s.row}>
            <Text style={s.producerName}>{order.producerName}</Text>
            <View style={[s.statusBadge, { backgroundColor: (statusColors[order.status] || '#8E8E93') + '20' }]}>
              <Text style={[s.statusText, { color: statusColors[order.status] || '#8E8E93' }]}>{order.status.replace('_', ' ')}</Text>
            </View>
          </View>
          {order.items.map((item, idx) => (
            <Text key={idx} style={s.subText}>-- {item.product} ({item.quantity})</Text>
          ))}
          <View style={[s.row, { marginTop: 8 }]}>
            <Text style={s.subText}>Pickup: {order.pickupPoint}</Text>
            <Text style={s.priceText}>{order.totalOTK} OTK</Text>
          </View>
          <Text style={s.subText}>Pickup date: {order.pickupDate}</Text>
        </View>
      ))}

      <Text style={s.sectionTitle}>Drop-off Points</Text>
      {DEMO_DROP_OFF_POINTS.map((point) => (
        <View key={point.id} style={s.card}>
          <Text style={s.pickupName}>{point.name}</Text>
          <Text style={s.pickupAddress}>{point.address}</Text>
          <Text style={s.pickupHours}>{point.hours}</Text>
          <Text style={s.subText}>Next available: {point.nextAvailable}</Text>
          <Text style={s.subText}>Producers: {point.producersServed.join(', ')}</Text>
        </View>
      ))}
    </>
  );

  // ─── Stories Tab ───

  const renderStories = () => {
    if (selectedStory) {
      return (
        <>
          <TouchableOpacity onPress={() => setSelectedStory(null)}>
            <Text style={s.detailBack}>{'< Back to Stories'}</Text>
          </TouchableOpacity>
          <View style={s.storyCard}>
            <Text style={s.storyTitle}>{selectedStory.title}</Text>
            <Text style={s.storyProducer}>{selectedStory.producerName} -- {selectedStory.yearsExperience} years experience</Text>
            <Text style={[s.storyExcerpt, { marginTop: 12 }]}>{selectedStory.excerpt}</Text>
            <Text style={[s.sectionTitle, { marginHorizontal: 0, marginTop: 16 }]}>Practice Highlights</Text>
            {selectedStory.practiceHighlights.map((h) => (
              <Text key={h} style={s.highlightItem}>-- {h}</Text>
            ))}
          </View>
        </>
      );
    }

    return (
      <>
        <Text style={s.sectionTitle}>Producer Stories</Text>
        {DEMO_STORIES.map((story) => (
          <TouchableOpacity key={story.id} style={s.storyCard} onPress={() => setSelectedStory(story)}>
            <Text style={s.storyTitle}>{story.title}</Text>
            <Text style={s.storyProducer}>{story.producerName}</Text>
            <Text style={s.storyExcerpt} numberOfLines={3}>{story.excerpt}</Text>
            <Text style={[s.subText, { marginTop: 8 }]}>{story.date} -- {story.yearsExperience} years experience</Text>
          </TouchableOpacity>
        ))}
      </>
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Farm to Table</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      {demoMode && (
        <View style={s.demoBanner}>
          <Text style={s.demoText}>Demo Mode -- 4 producers, 6 products, 2 drop-off points</Text>
        </View>
      )}

      <View style={s.tabRow}>
        {TABS.map((t_) => (
          <TouchableOpacity
            key={t_.key}
            style={[s.tabBtn, tab === t_.key && s.tabActive]}
            onPress={() => { setTab(t_.key); setSelectedProducer(null); setSelectedStory(null); }}
          >
            <Text style={[s.tabText, tab === t_.key && s.tabTextActive]}>{t_.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {tab === 'producers' && renderProducers()}
        {tab === 'harvest' && renderHarvest()}
        {tab === 'order' && renderOrder()}
        {tab === 'stories' && renderStories()}
      </ScrollView>
    </SafeAreaView>
  );
}
