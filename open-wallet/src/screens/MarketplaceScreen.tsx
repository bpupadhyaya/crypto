import { fonts } from '../utils/theme';
/**
 * Marketplace Screen — Local goods and services exchange.
 *
 * Article I: "Every community thrives when people can trade freely and fairly."
 * xOTK represents exchange value in local commerce.
 *
 * Features:
 * - Browse listings by category (food, crafts, services, equipment, clothing, electronics, furniture)
 * - Price types: OTK, time exchange, barter, free (pay-it-forward)
 * - Post item (title, description, category, price, condition, photo hash)
 * - Transaction history with ratings
 * - Regional market stats
 * - Demo mode with sample data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

type ListingCategory = 'food' | 'crafts' | 'services' | 'equipment' | 'clothing' | 'electronics' | 'furniture';
type PriceType = 'OTK' | 'time_exchange' | 'barter' | 'free';
type ItemCondition = 'new' | 'like_new' | 'good' | 'fair' | 'for_parts';

interface MarketListing {
  id: string;
  title: string;
  description: string;
  category: ListingCategory;
  priceType: PriceType;
  priceAmount: number;
  condition: ItemCondition;
  photoHash: string;
  sellerUID: string;
  sellerName: string;
  location: string;
  postedDate: string;
  views: number;
}

interface MarketTransaction {
  id: string;
  listingId: string;
  itemTitle: string;
  buyerUID: string;
  sellerUID: string;
  otherPartyName: string;
  priceType: PriceType;
  priceAmount: number;
  date: string;
  rating: number;
  review: string;
  role: 'buyer' | 'seller';
}

interface MarketStats {
  region: string;
  activeListings: number;
  completedThisMonth: number;
  totalVolumeOTK: number;
  topCategories: { category: string; count: number }[];
  averageRating: number;
  payItForwardCount: number;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const LISTING_CATEGORIES: { key: ListingCategory; label: string; icon: string }[] = [
  { key: 'food', label: 'Food', icon: 'F' },
  { key: 'crafts', label: 'Crafts', icon: '*' },
  { key: 'services', label: 'Services', icon: 'S' },
  { key: 'equipment', label: 'Equipment', icon: 'E' },
  { key: 'clothing', label: 'Clothing', icon: 'C' },
  { key: 'electronics', label: 'Electronics', icon: 'e' },
  { key: 'furniture', label: 'Furniture', icon: '#' },
];

const PRICE_TYPES: { key: PriceType; label: string }[] = [
  { key: 'OTK', label: 'OTK' },
  { key: 'time_exchange', label: 'Time Exchange' },
  { key: 'barter', label: 'Barter' },
  { key: 'free', label: 'Free (Pay-it-Forward)' },
];

const CONDITIONS: { key: ItemCondition; label: string }[] = [
  { key: 'new', label: 'New' },
  { key: 'like_new', label: 'Like New' },
  { key: 'good', label: 'Good' },
  { key: 'fair', label: 'Fair' },
  { key: 'for_parts', label: 'For Parts' },
];

const CONDITION_LABELS: Record<ItemCondition, string> = {
  new: 'New',
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
  for_parts: 'For Parts',
};

const PRICE_TYPE_LABELS: Record<PriceType, string> = {
  OTK: 'OTK',
  time_exchange: 'Time Exchange',
  barter: 'Barter',
  free: 'Pay-it-Forward',
};

const RATING_COLORS: Record<number, string> = {
  5: '#34C759',
  4: '#30D158',
  3: '#FF9500',
  2: '#FF3B30',
  1: '#FF3B30',
};

// ─── Demo Data ───

const DEMO_LISTINGS: MarketListing[] = [
  { id: 'm1', title: 'Fresh Organic Tomatoes (5 lbs)', description: 'Locally grown heirloom tomatoes from our community garden. Picked this morning.', category: 'food', priceType: 'OTK', priceAmount: 150, condition: 'new', photoHash: 'Qm...abc123', sellerUID: 'openchain1abc...farm_sarah', sellerName: 'Sarah\'s Garden', location: 'Riverside Farmers Market', postedDate: '2026-03-28', views: 24 },
  { id: 'm2', title: 'Hand-Knit Winter Scarf', description: 'Merino wool scarf, hand-knit with traditional patterns. Great for gifting.', category: 'crafts', priceType: 'barter', priceAmount: 0, condition: 'new', photoHash: 'Qm...def456', sellerUID: 'openchain1def...knitter_mei', sellerName: 'Mei\'s Crafts', location: 'Downtown', postedDate: '2026-03-27', views: 18 },
  { id: 'm3', title: 'Lawn Mowing Service', description: 'Weekly lawn mowing for standard residential yard. Equipment provided.', category: 'services', priceType: 'time_exchange', priceAmount: 2, condition: 'new', photoHash: '', sellerUID: 'openchain1ghi...handy_carlos', sellerName: 'Carlos Handyman', location: 'Riverside County', postedDate: '2026-03-27', views: 31 },
  { id: 'm4', title: 'Cordless Drill (DeWalt 20V)', description: 'Lightly used cordless drill with two batteries and charger. Works perfectly.', category: 'equipment', priceType: 'OTK', priceAmount: 800, condition: 'like_new', photoHash: 'Qm...ghi789', sellerUID: 'openchain1jkl...tools_dave', sellerName: 'Dave\'s Tools', location: 'Oak Street', postedDate: '2026-03-26', views: 42 },
  { id: 'm5', title: 'Children\'s Winter Coat (Size 8)', description: 'Gently worn puffer coat, still in great shape. Paying it forward to a family in need.', category: 'clothing', priceType: 'free', priceAmount: 0, condition: 'good', photoHash: 'Qm...jkl012', sellerUID: 'openchain1mno...mom_priya', sellerName: 'Priya M.', location: 'Community Center', postedDate: '2026-03-25', views: 56 },
  { id: 'm6', title: 'Solid Oak Bookshelf', description: '5-shelf solid oak bookshelf. Minor scratches on one side. Must pick up.', category: 'furniture', priceType: 'OTK', priceAmount: 1200, condition: 'good', photoHash: 'Qm...mno345', sellerUID: 'openchain1pqr...moving_jin', sellerName: 'Jin\'s Moving Sale', location: 'Elm Street', postedDate: '2026-03-24', views: 38 },
];

const DEMO_TRANSACTIONS: MarketTransaction[] = [
  { id: 't1', listingId: 'mx1', itemTitle: 'Homemade Sourdough Bread', buyerUID: 'you', sellerUID: 'openchain1abc...baker_rosa', otherPartyName: 'Rosa\'s Bakery', priceType: 'OTK', priceAmount: 80, date: '2026-03-22', rating: 5, review: 'Best sourdough in the community! Fresh and delicious.', role: 'buyer' },
  { id: 't2', listingId: 'mx2', itemTitle: 'Guitar Lessons (4 sessions)', buyerUID: 'openchain1stu...learner_tom', sellerUID: 'you', otherPartyName: 'Tom L.', priceType: 'time_exchange', priceAmount: 4, date: '2026-03-18', rating: 4, review: 'Great teacher, very patient. Learned a lot.', role: 'seller' },
];

const DEMO_STATS: MarketStats = {
  region: 'Riverside Community',
  activeListings: 89,
  completedThisMonth: 34,
  totalVolumeOTK: 45200,
  topCategories: [
    { category: 'Food', count: 28 },
    { category: 'Services', count: 19 },
    { category: 'Crafts', count: 14 },
    { category: 'Equipment', count: 12 },
    { category: 'Clothing', count: 9 },
  ],
  averageRating: 4.6,
  payItForwardCount: 17,
};

type Tab = 'browse' | 'sell' | 'history' | 'stats';

export function MarketplaceScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('browse');
  const [filterCategory, setFilterCategory] = useState<ListingCategory | ''>('');
  const [filterPriceType, setFilterPriceType] = useState<PriceType | ''>('');

  // Sell form state
  const [sellTitle, setSellTitle] = useState('');
  const [sellDescription, setSellDescription] = useState('');
  const [sellCategory, setSellCategory] = useState<ListingCategory | ''>('');
  const [sellPriceType, setSellPriceType] = useState<PriceType | ''>('');
  const [sellPrice, setSellPrice] = useState('');
  const [sellCondition, setSellCondition] = useState<ItemCondition | ''>('');
  const [sellPhotoHash, setSellPhotoHash] = useState('');

  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const filteredListings = useMemo(() => {
    let listings = [...DEMO_LISTINGS];
    if (filterCategory) listings = listings.filter((l) => l.category === filterCategory);
    if (filterPriceType) listings = listings.filter((l) => l.priceType === filterPriceType);
    return listings;
  }, [filterCategory, filterPriceType]);

  const handleContact = useCallback((listing: MarketListing) => {
    Alert.alert(
      'Contact Seller',
      `Send a message to ${listing.sellerName} about "${listing.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Message',
          onPress: () => Alert.alert('Message Sent', `Your inquiry about "${listing.title}" has been sent to ${listing.sellerName}.`),
        },
      ],
    );
  }, []);

  const handlePostListing = useCallback(() => {
    if (!sellTitle.trim()) { Alert.alert('Required', 'Enter an item title.'); return; }
    if (!sellDescription.trim()) { Alert.alert('Required', 'Enter a description.'); return; }
    if (!sellCategory) { Alert.alert('Required', 'Select a category.'); return; }
    if (!sellPriceType) { Alert.alert('Required', 'Select a price type.'); return; }
    if (!sellCondition) { Alert.alert('Required', 'Select item condition.'); return; }

    const priceDisplay = sellPriceType === 'free'
      ? 'Pay-it-Forward (Free)'
      : sellPriceType === 'barter'
        ? 'Barter'
        : sellPriceType === 'time_exchange'
          ? `${sellPrice || '0'} hours`
          : `${sellPrice || '0'} xOTK`;

    Alert.alert(
      'Listing Posted',
      `"${sellTitle}" has been listed.\n\nCategory: ${sellCategory}\nCondition: ${CONDITION_LABELS[sellCondition]}\nPrice: ${priceDisplay}`,
    );

    setSellTitle('');
    setSellDescription('');
    setSellCategory('');
    setSellPriceType('');
    setSellPrice('');
    setSellCondition('');
    setSellPhotoHash('');
    setTab('browse');
  }, [sellTitle, sellDescription, sellCategory, sellPriceType, sellPrice, sellCondition]);

  const priceLabel = (listing: MarketListing) => {
    if (listing.priceType === 'free') return 'Free';
    if (listing.priceType === 'barter') return 'Barter';
    if (listing.priceType === 'time_exchange') return `${listing.priceAmount}h exchange`;
    return `${listing.priceAmount.toLocaleString()} xOTK`;
  };

  const renderStars = (rating: number) => {
    const filled = Math.round(rating);
    return Array.from({ length: 5 }, (_, i) => i < filled ? '*' : '-').join('');
  };

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border },
    headerTitle: { fontSize: 18, fontWeight: fonts.bold, color: t.text.primary },
    closeBtn: { paddingHorizontal: 12, paddingVertical: 6 },
    closeTxt: { fontSize: 16, color: t.accent.blue },
    tabBar: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border },
    tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
    tabBtnActive: { borderBottomWidth: 2, borderBottomColor: t.accent.blue },
    tabTxt: { fontSize: 13, color: t.text.muted },
    tabTxtActive: { fontSize: 13, color: t.accent.blue, fontWeight: fonts.semibold },
    scroll: { flex: 1 },
    pad: { padding: 16 },
    sectionTitle: { fontSize: 16, fontWeight: fonts.bold, color: t.text.primary, marginBottom: 12 },
    subTitle: { fontSize: 14, fontWeight: fonts.semibold, color: t.text.primary, marginBottom: 8, marginTop: 12 },

    // Filter row
    filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
    filterChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1, borderColor: t.border, backgroundColor: t.bg.secondary },
    filterChipActive: { backgroundColor: t.accent.blue, borderColor: t.accent.blue },
    filterChipTxt: { fontSize: 12, color: t.text.muted },
    filterChipTxtActive: { fontSize: 12, color: '#FFFFFF', fontWeight: fonts.semibold },

    // Listing card
    listingCard: { backgroundColor: t.bg.secondary, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    listingTitle: { fontSize: 15, fontWeight: fonts.bold, color: t.text.primary, marginBottom: 4 },
    listingSeller: { fontSize: 13, color: t.accent.blue, marginBottom: 6 },
    listingDesc: { fontSize: 13, color: t.text.secondary, marginBottom: 8, lineHeight: 18 },
    listingMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    listingTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: t.bg.primary },
    listingTagTxt: { fontSize: 11, color: t.text.muted },
    listingFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    listingPrice: { fontSize: 14, fontWeight: fonts.bold, color: '#34C759' },
    listingViews: { fontSize: 12, color: t.text.muted },
    contactBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
    contactBtnTxt: { fontSize: 13, fontWeight: fonts.semibold, color: '#FFFFFF' },
    freeTag: { backgroundColor: '#AF52DE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    freeTagTxt: { fontSize: 11, fontWeight: fonts.semibold, color: '#FFFFFF' },

    // Transaction card
    txCard: { backgroundColor: t.bg.secondary, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    txTitle: { fontSize: 15, fontWeight: fonts.bold, color: t.text.primary, marginBottom: 2 },
    txParty: { fontSize: 13, color: t.text.secondary, marginBottom: 6 },
    txRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    txDate: { fontSize: 12, color: t.text.muted },
    txPrice: { fontSize: 13, fontWeight: fonts.bold, color: t.text.primary },
    txRating: { fontSize: 13, fontWeight: fonts.semibold, letterSpacing: 2 },
    txReview: { fontSize: 13, color: t.text.secondary, fontStyle: 'italic', marginTop: 6, lineHeight: 18 },
    txRole: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: t.bg.primary },
    txRoleTxt: { fontSize: 11, fontWeight: fonts.semibold, color: t.text.muted },

    // Sell form
    label: { fontSize: 13, fontWeight: fonts.semibold, color: t.text.secondary, marginBottom: 4, marginTop: 12 },
    input: { backgroundColor: t.bg.secondary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: t.text.primary, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    inputMulti: { height: 80, textAlignVertical: 'top' },
    pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
    pickerChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: t.border, backgroundColor: t.bg.secondary },
    pickerChipActive: { backgroundColor: t.accent.blue, borderColor: t.accent.blue },
    pickerChipTxt: { fontSize: 12, color: t.text.muted },
    pickerChipTxtActive: { fontSize: 12, color: '#FFFFFF', fontWeight: fonts.semibold },
    postBtn: { backgroundColor: '#34C759', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 20 },
    postBtnTxt: { fontSize: 16, fontWeight: fonts.bold, color: '#FFFFFF' },

    // Stats
    statsCard: { backgroundColor: t.bg.secondary, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    statsRegion: { fontSize: 16, fontWeight: fonts.bold, color: t.text.primary, marginBottom: 12, textAlign: 'center' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    statsLabel: { fontSize: 13, color: t.text.secondary },
    statsValue: { fontSize: 13, fontWeight: fonts.bold, color: t.text.primary },
    statsBar: { height: 6, borderRadius: 3, backgroundColor: t.bg.primary, marginTop: 2, marginBottom: 8 },
    statsBarFill: { height: 6, borderRadius: 3 },
    statsHighlight: { fontSize: 14, fontWeight: fonts.bold, color: '#AF52DE', textAlign: 'center', marginTop: 8 },

    empty: { fontSize: 14, color: t.text.muted, textAlign: 'center', marginTop: 40 },
    demoBanner: { backgroundColor: '#FF9500', paddingVertical: 4, alignItems: 'center' },
    demoBannerTxt: { fontSize: 11, fontWeight: fonts.semibold, color: '#FFFFFF' },
  }), [t]);

  // ─── Tabs ───

  const TABS: { key: Tab; label: string }[] = [
    { key: 'browse', label: 'Browse' },
    { key: 'sell', label: 'Sell' },
    { key: 'history', label: 'History' },
    { key: 'stats', label: 'Stats' },
  ];

  // ─── Render: Browse ───

  const renderBrowse = () => (
    <ScrollView style={s.scroll}>
      <View style={s.pad}>
        <Text style={s.sectionTitle}>Categories</Text>
        <View style={s.filterRow}>
          <TouchableOpacity
            style={[s.filterChip, !filterCategory && s.filterChipActive]}
            onPress={() => setFilterCategory('')}
          >
            <Text style={[s.filterChipTxt, !filterCategory && s.filterChipTxtActive]}>All</Text>
          </TouchableOpacity>
          {LISTING_CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.key}
              style={[s.filterChip, filterCategory === c.key && s.filterChipActive]}
              onPress={() => setFilterCategory(filterCategory === c.key ? '' : c.key)}
            >
              <Text style={[s.filterChipTxt, filterCategory === c.key && s.filterChipTxtActive]}>
                {c.icon} {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.subTitle}>Price Type</Text>
        <View style={s.filterRow}>
          <TouchableOpacity
            style={[s.filterChip, !filterPriceType && s.filterChipActive]}
            onPress={() => setFilterPriceType('')}
          >
            <Text style={[s.filterChipTxt, !filterPriceType && s.filterChipTxtActive]}>All</Text>
          </TouchableOpacity>
          {PRICE_TYPES.map((pt) => (
            <TouchableOpacity
              key={pt.key}
              style={[s.filterChip, filterPriceType === pt.key && s.filterChipActive]}
              onPress={() => setFilterPriceType(filterPriceType === pt.key ? '' : pt.key)}
            >
              <Text style={[s.filterChipTxt, filterPriceType === pt.key && s.filterChipTxtActive]}>
                {pt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.sectionTitle}>{filteredListings.length} Listing{filteredListings.length !== 1 ? 's' : ''}</Text>

        {filteredListings.length === 0 && (
          <Text style={s.empty}>No listings match the current filters.</Text>
        )}

        {filteredListings.map((listing) => (
          <View key={listing.id} style={s.listingCard}>
            <Text style={s.listingTitle}>{listing.title}</Text>
            <Text style={s.listingSeller}>{listing.sellerName} — {listing.location}</Text>
            <Text style={s.listingDesc}>{listing.description}</Text>
            <View style={s.listingMeta}>
              <View style={s.listingTag}><Text style={s.listingTagTxt}>{listing.category}</Text></View>
              <View style={s.listingTag}><Text style={s.listingTagTxt}>{CONDITION_LABELS[listing.condition]}</Text></View>
              <View style={s.listingTag}><Text style={s.listingTagTxt}>{PRICE_TYPE_LABELS[listing.priceType]}</Text></View>
              {listing.priceType === 'free' && (
                <View style={s.freeTag}><Text style={s.freeTagTxt}>Pay-it-Forward</Text></View>
              )}
            </View>
            <View style={s.listingFooter}>
              <Text style={s.listingPrice}>{priceLabel(listing)}</Text>
              <Text style={s.listingViews}>{listing.views} views</Text>
              <TouchableOpacity style={s.contactBtn} onPress={() => handleContact(listing)}>
                <Text style={s.contactBtnTxt}>Contact</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  // ─── Render: Sell ───

  const renderSell = () => (
    <ScrollView style={s.scroll}>
      <View style={s.pad}>
        <Text style={s.sectionTitle}>Post an Item or Service</Text>

        <Text style={s.label}>Title</Text>
        <TextInput style={s.input} value={sellTitle} onChangeText={setSellTitle} placeholder="e.g. Fresh Honey (1 jar)" placeholderTextColor={t.text.muted} />

        <Text style={s.label}>Description</Text>
        <TextInput style={[s.input, s.inputMulti]} value={sellDescription} onChangeText={setSellDescription} placeholder="Describe your item or service..." placeholderTextColor={t.text.muted} multiline />

        <Text style={s.label}>Category</Text>
        <View style={s.pickerRow}>
          {LISTING_CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.key}
              style={[s.pickerChip, sellCategory === c.key && s.pickerChipActive]}
              onPress={() => setSellCategory(c.key)}
            >
              <Text style={[s.pickerChipTxt, sellCategory === c.key && s.pickerChipTxtActive]}>
                {c.icon} {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>Condition</Text>
        <View style={s.pickerRow}>
          {CONDITIONS.map((cond) => (
            <TouchableOpacity
              key={cond.key}
              style={[s.pickerChip, sellCondition === cond.key && s.pickerChipActive]}
              onPress={() => setSellCondition(cond.key)}
            >
              <Text style={[s.pickerChipTxt, sellCondition === cond.key && s.pickerChipTxtActive]}>
                {cond.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>Price Type</Text>
        <View style={s.pickerRow}>
          {PRICE_TYPES.map((pt) => (
            <TouchableOpacity
              key={pt.key}
              style={[s.pickerChip, sellPriceType === pt.key && s.pickerChipActive]}
              onPress={() => setSellPriceType(pt.key)}
            >
              <Text style={[s.pickerChipTxt, sellPriceType === pt.key && s.pickerChipTxtActive]}>
                {pt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {sellPriceType && sellPriceType !== 'free' && sellPriceType !== 'barter' && (
          <>
            <Text style={s.label}>{sellPriceType === 'OTK' ? 'Price (xOTK)' : 'Hours'}</Text>
            <TextInput style={s.input} value={sellPrice} onChangeText={setSellPrice} placeholder="0" placeholderTextColor={t.text.muted} keyboardType="numeric" />
          </>
        )}

        <Text style={s.label}>Photo Hash (IPFS, optional)</Text>
        <TextInput style={s.input} value={sellPhotoHash} onChangeText={setSellPhotoHash} placeholder="Qm..." placeholderTextColor={t.text.muted} />

        <TouchableOpacity style={s.postBtn} onPress={handlePostListing}>
          <Text style={s.postBtnTxt}>Post Listing</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // ─── Render: History ───

  const renderHistory = () => (
    <ScrollView style={s.scroll}>
      <View style={s.pad}>
        <Text style={s.sectionTitle}>Transaction History ({DEMO_TRANSACTIONS.length})</Text>

        {DEMO_TRANSACTIONS.length === 0 && (
          <Text style={s.empty}>No transactions yet.</Text>
        )}

        {DEMO_TRANSACTIONS.map((tx) => {
          const ratingColor = RATING_COLORS[Math.round(tx.rating)] || t.text.muted;
          return (
            <View key={tx.id} style={s.txCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={s.txTitle}>{tx.itemTitle}</Text>
                <View style={s.txRole}>
                  <Text style={s.txRoleTxt}>{tx.role === 'buyer' ? 'Bought' : 'Sold'}</Text>
                </View>
              </View>
              <Text style={s.txParty}>{tx.role === 'buyer' ? 'From' : 'To'}: {tx.otherPartyName}</Text>
              <View style={s.txRow}>
                <Text style={s.txDate}>{tx.date}</Text>
                <Text style={s.txPrice}>
                  {tx.priceType === 'OTK' ? `${tx.priceAmount} xOTK` : tx.priceType === 'time_exchange' ? `${tx.priceAmount}h` : PRICE_TYPE_LABELS[tx.priceType]}
                </Text>
              </View>
              <Text style={[s.txRating, { color: ratingColor }]}>{renderStars(tx.rating)} ({tx.rating}/5)</Text>
              {tx.review && <Text style={s.txReview}>"{tx.review}"</Text>}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );

  // ─── Render: Stats ───

  const renderStats = () => (
    <ScrollView style={s.scroll}>
      <View style={s.pad}>
        <View style={s.statsCard}>
          <Text style={s.statsRegion}>{DEMO_STATS.region}</Text>

          <View style={s.statsRow}>
            <Text style={s.statsLabel}>Active Listings</Text>
            <Text style={s.statsValue}>{DEMO_STATS.activeListings}</Text>
          </View>
          <View style={s.statsRow}>
            <Text style={s.statsLabel}>Completed This Month</Text>
            <Text style={s.statsValue}>{DEMO_STATS.completedThisMonth}</Text>
          </View>
          <View style={s.statsRow}>
            <Text style={s.statsLabel}>Total Volume (xOTK)</Text>
            <Text style={s.statsValue}>{DEMO_STATS.totalVolumeOTK.toLocaleString()}</Text>
          </View>
          <View style={s.statsRow}>
            <Text style={s.statsLabel}>Average Rating</Text>
            <Text style={s.statsValue}>{renderStars(Math.round(DEMO_STATS.averageRating))} {DEMO_STATS.averageRating}/5</Text>
          </View>
          <Text style={s.statsHighlight}>{DEMO_STATS.payItForwardCount} Pay-it-Forward items this month</Text>
        </View>

        <Text style={s.sectionTitle}>Top Categories</Text>
        {DEMO_STATS.topCategories.map((cat, idx) => {
          const maxCount = DEMO_STATS.topCategories[0].count;
          const pct = maxCount > 0 ? (cat.count / maxCount) * 100 : 0;
          return (
            <View key={cat.category} style={{ marginBottom: 8 }}>
              <View style={s.statsRow}>
                <Text style={s.statsLabel}>{idx + 1}. {cat.category}</Text>
                <Text style={s.statsValue}>{cat.count} listings</Text>
              </View>
              <View style={s.statsBar}>
                <View style={[s.statsBarFill, { width: `${pct}%`, backgroundColor: t.accent.blue }]} />
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={s.container}>
      {demoMode && (
        <View style={s.demoBanner}>
          <Text style={s.demoBannerTxt}>DEMO MODE — Sample marketplace data</Text>
        </View>
      )}

      <View style={s.header}>
        <Text style={s.headerTitle}>Marketplace</Text>
        <TouchableOpacity style={s.closeBtn} onPress={onClose}>
          <Text style={s.closeTxt}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={s.tabBar}>
        {TABS.map((tb) => (
          <TouchableOpacity
            key={tb.key}
            style={[s.tabBtn, tab === tb.key && s.tabBtnActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={tab === tb.key ? s.tabTxtActive : s.tabTxt}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'browse' && renderBrowse()}
      {tab === 'sell' && renderSell()}
      {tab === 'history' && renderHistory()}
      {tab === 'stats' && renderStats()}
    </SafeAreaView>
  );
}
