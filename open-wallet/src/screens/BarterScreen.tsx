import { fonts } from '../utils/theme';
/**
 * Barter Screen — Direct goods/services barter matching.
 *
 * Article I: "Every exchange creates value for both parties."
 * Barter is the oldest form of human trade — no money needed, just mutual value.
 *
 * Features:
 * - Offer items/services for barter (what you have, what you want)
 * - Browse barter offers with matching algorithm (you have X, they want X)
 * - Propose trade (your offer for their offer)
 * - Trade history with ratings
 * - Community barter stats (items exchanged, value created without money)
 * - Demo: 5 barter offers, 2 proposed trades, 3 completed
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface BarterOffer {
  id: string;
  offeredBy: string;
  haveTitle: string;
  haveDescription: string;
  haveCategory: string;
  wantTitle: string;
  wantDescription: string;
  wantCategory: string;
  location: string;
  date: string;
  matchScore: number; // 0-100 how well it matches your wants
  status: 'open' | 'proposed' | 'accepted' | 'completed';
}

interface ProposedTrade {
  id: string;
  theirOffer: string;
  theirName: string;
  theyGive: string;
  youGive: string;
  status: 'pending' | 'accepted' | 'declined';
  date: string;
}

interface CompletedTrade {
  id: string;
  partnerName: string;
  youGave: string;
  youReceived: string;
  rating: number;
  partnerRating: number;
  date: string;
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_OFFERS: BarterOffer[] = [
  { id: 'b1', offeredBy: 'Elena V.', haveTitle: 'Fresh Homemade Bread (weekly)', haveDescription: 'I bake sourdough and whole wheat every Saturday. Can provide 2 loaves/week.', haveCategory: 'food', wantTitle: 'Guitar Lessons', wantDescription: 'Beginner guitar lessons, 1 hour/week. I have my own guitar.', wantCategory: 'skills', location: 'Maplewood', date: '2026-03-28', matchScore: 85, status: 'open' },
  { id: 'b2', offeredBy: 'Kwame A.', haveTitle: 'Bicycle Repair & Tune-Up', haveDescription: 'Professional mechanic — can fix any bike issue. Brakes, gears, tires, full tune-ups.', haveCategory: 'skills', wantTitle: 'Fresh Vegetables', wantDescription: 'Seasonal vegetables from home garden. Any variety welcome.', wantCategory: 'food', location: 'Downtown', date: '2026-03-27', matchScore: 72, status: 'open' },
  { id: 'b3', offeredBy: 'Sophie L.', haveTitle: 'Web Design (5 pages)', haveDescription: 'I will design and build a simple website. HTML/CSS, mobile-responsive. Portfolio available.', haveCategory: 'skills', wantTitle: 'Carpentry Work', wantDescription: 'Need custom shelving built for my apartment. Materials provided.', wantCategory: 'skills', location: 'Riverside', date: '2026-03-25', matchScore: 40, status: 'open' },
  { id: 'b4', offeredBy: 'Raj P.', haveTitle: 'Math Tutoring (K-12)', haveDescription: 'Experienced math teacher. Can tutor any level from arithmetic to calculus. Patient and clear.', haveCategory: 'education', wantTitle: 'Lawn Mowing Service', wantDescription: 'Weekly lawn mowing for my 1/4 acre lot during spring and summer.', wantCategory: 'labor', location: 'Oak Park', date: '2026-03-26', matchScore: 30, status: 'open' },
  { id: 'b5', offeredBy: 'Maria C.', haveTitle: 'Handmade Pottery (3 pieces)', haveDescription: 'Custom pottery — bowls, mugs, planters. You choose colors and sizes. Glazed and kiln-fired.', haveCategory: 'crafts', wantTitle: 'Photography Session', wantDescription: 'Family portrait session (1 hour, 10 edited photos). Outdoor preferred.', wantCategory: 'skills', location: 'Lakeview', date: '2026-03-24', matchScore: 55, status: 'open' },
];

const DEMO_PROPOSED: ProposedTrade[] = [
  { id: 'pt1', theirOffer: 'b1', theirName: 'Elena V.', theyGive: 'Fresh Homemade Bread (weekly)', youGive: 'Guitar Lessons (1hr/week)', status: 'pending', date: '2026-03-28' },
  { id: 'pt2', theirOffer: 'b5', theirName: 'Maria C.', theyGive: 'Handmade Pottery (3 pieces)', youGive: 'Family Photo Session', status: 'accepted', date: '2026-03-26' },
];

const DEMO_COMPLETED: CompletedTrade[] = [
  { id: 'ct1', partnerName: 'Tomoko H.', youGave: 'Python Tutoring (4 sessions)', youReceived: 'Japanese Cooking Class (4 sessions)', rating: 5, partnerRating: 5, date: '2026-03-15' },
  { id: 'ct2', partnerName: 'Marcus W.', youGave: 'Bicycle Tune-Up', youReceived: 'Firewood (1 cord)', rating: 4, partnerRating: 5, date: '2026-03-08' },
  { id: 'ct3', partnerName: 'Lin Z.', youGave: 'Garden Compost (20 lbs)', youReceived: 'Homemade Kimchi (6 jars)', rating: 5, partnerRating: 4, date: '2026-02-28' },
];

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'food', label: 'Food' },
  { key: 'skills', label: 'Skills' },
  { key: 'education', label: 'Education' },
  { key: 'labor', label: 'Labor' },
  { key: 'crafts', label: 'Crafts' },
  { key: 'goods', label: 'Goods' },
];

type Tab = 'browse' | 'offer' | 'trades' | 'history';

export function BarterScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('browse');
  const [filterCategory, setFilterCategory] = useState('all');
  const [offers, setOffers] = useState(DEMO_OFFERS);

  // New offer form
  const [haveTitle, setHaveTitle] = useState('');
  const [haveDesc, setHaveDesc] = useState('');
  const [haveCategory, setHaveCategory] = useState('');
  const [wantTitle, setWantTitle] = useState('');
  const [wantDesc, setWantDesc] = useState('');
  const [wantCategory, setWantCategory] = useState('');
  const [offerLocation, setOfferLocation] = useState('');

  // Propose trade
  const [proposeId, setProposeId] = useState<string | null>(null);
  const [proposeOffer, setProposeOffer] = useState('');

  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const filtered = useMemo(() => {
    if (filterCategory === 'all') return offers;
    return offers.filter((o) => o.haveCategory === filterCategory || o.wantCategory === filterCategory);
  }, [offers, filterCategory]);

  const sortedByMatch = useMemo(() => {
    return [...filtered].sort((a, b) => b.matchScore - a.matchScore);
  }, [filtered]);

  const handleProposeTrade = useCallback((id: string) => {
    if (!proposeOffer.trim()) { Alert.alert('Required', 'Describe what you offer in return.'); return; }
    const offer = offers.find((o) => o.id === id);
    Alert.alert(
      'Trade Proposed!',
      `You proposed "${proposeOffer}" in exchange for "${offer?.haveTitle}". ${offer?.offeredBy} will be notified.`,
    );
    setOffers((prev) =>
      prev.map((o) => o.id === id ? { ...o, status: 'proposed' as const } : o),
    );
    setProposeId(null);
    setProposeOffer('');
  }, [proposeOffer, offers]);

  const handleSubmitOffer = useCallback(() => {
    if (!haveTitle.trim()) { Alert.alert('Required', 'Describe what you have to offer.'); return; }
    if (!wantTitle.trim()) { Alert.alert('Required', 'Describe what you want in return.'); return; }
    if (!haveCategory) { Alert.alert('Required', 'Select a category for what you have.'); return; }

    Alert.alert(
      'Offer Posted!',
      `Your barter offer "${haveTitle}" has been listed. The matching algorithm will notify potential partners.`,
    );
    setHaveTitle('');
    setHaveDesc('');
    setHaveCategory('');
    setWantTitle('');
    setWantDesc('');
    setWantCategory('');
    setOfferLocation('');
    setTab('browse');
  }, [haveTitle, wantTitle, haveCategory]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.purple + '20' },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.purple },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    filterRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 6, marginBottom: 12 },
    filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: t.bg.secondary },
    filterActive: { backgroundColor: t.accent.purple + '20', borderColor: t.accent.purple },
    filterText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    filterTextActive: { color: t.accent.purple },
    // Barter offer cards
    offerCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    offerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    offerName: { color: t.accent.purple, fontSize: fonts.sm, fontWeight: fonts.bold },
    matchBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    matchText: { fontSize: fonts.xs, fontWeight: fonts.bold },
    exchangeRow: { flexDirection: 'row', alignItems: 'stretch', marginBottom: 8 },
    exchangeBox: { flex: 1, borderRadius: 10, padding: 10 },
    exchangeLabel: { fontSize: fonts.xs, fontWeight: fonts.bold, marginBottom: 4, textTransform: 'uppercase' as const },
    exchangeTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    exchangeDesc: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4, lineHeight: 17 },
    exchangeArrow: { justifyContent: 'center', paddingHorizontal: 8 },
    arrowText: { color: t.text.muted, fontSize: fonts.xl, fontWeight: '300' },
    offerMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    proposeBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-start' as const, marginTop: 10 },
    proposeBtnText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.semibold },
    proposedBadge: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, alignSelf: 'flex-start' as const, marginTop: 10 },
    proposedText: { color: t.accent.orange, fontSize: fonts.sm, fontWeight: fonts.semibold },
    proposeInput: { backgroundColor: t.bg.primary, borderRadius: 10, padding: 10, color: t.text.primary, fontSize: fonts.md, marginTop: 8 },
    proposeRow: { marginTop: 8 },
    proposeConfirmBtn: { backgroundColor: t.accent.blue, paddingVertical: 10, borderRadius: 10, alignItems: 'center', marginTop: 8 },
    proposeConfirmText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.semibold },
    // Trade status
    tradeCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    tradeStatus: { fontSize: fonts.sm, fontWeight: fonts.bold },
    tradeExchange: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold, marginTop: 6 },
    tradeDetail: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    // History
    historyCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    historyTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    historyMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    ratingRow: { flexDirection: 'row', gap: 4, marginTop: 6 },
    starFilled: { color: t.accent.orange, fontSize: fonts.md },
    starEmpty: { color: t.text.muted, fontSize: fonts.md },
    // Form
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md, marginBottom: 12 },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: t.bg.primary },
    typeChipSelected: { backgroundColor: t.accent.purple + '20', borderColor: t.accent.purple },
    typeChipText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    typeChipTextSelected: { color: t.accent.purple },
    submitBtn: { backgroundColor: t.accent.purple, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.bold },
    philosophy: { backgroundColor: t.accent.green + '15', borderRadius: 12, padding: 14, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' as const },
    philosophyText: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold, textAlign: 'center', fontStyle: 'italic' },
    statsCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 16 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
    statBox: { alignItems: 'center' as const },
    statNum: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 4, textAlign: 'center' },
  }), [t]);

  const matchColor = (score: number) => {
    if (score >= 75) return t.accent.green;
    if (score >= 50) return t.accent.orange;
    return t.text.muted;
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={i <= rating ? s.starFilled : s.starEmpty}>
          {'\u2605'}
        </Text>,
      );
    }
    return stars;
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'accepted': return t.accent.green;
      case 'pending': return t.accent.orange;
      case 'declined': return t.accent.red || '#ff4444';
      default: return t.text.muted;
    }
  };

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'browse', label: 'Browse' },
    { key: 'offer', label: 'Offer' },
    { key: 'trades', label: 'Trades' },
    { key: 'history', label: 'History' },
  ];

  // ─── Browse Tab ───

  const renderBrowse = () => (
    <>
      <View style={s.philosophy}>
        <Text style={s.philosophyText}>
          "Every exchange creates value for both parties"
        </Text>
      </View>

      <View style={s.filterRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[s.filterChip, filterCategory === cat.key && s.filterActive]}
            onPress={() => setFilterCategory(cat.key)}
          >
            <Text style={[s.filterText, filterCategory === cat.key && s.filterTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.sectionTitle}>Barter Offers (sorted by match)</Text>
      {sortedByMatch.length === 0 ? (
        <View style={s.card}>
          <Text style={{ color: t.text.muted, textAlign: 'center' }}>No offers in this category.</Text>
        </View>
      ) : (
        sortedByMatch.map((offer) => (
          <View key={offer.id} style={s.offerCard}>
            <View style={s.offerHeader}>
              <Text style={s.offerName}>{offer.offeredBy}</Text>
              <View style={[s.matchBadge, { backgroundColor: matchColor(offer.matchScore) + '20' }]}>
                <Text style={[s.matchText, { color: matchColor(offer.matchScore) }]}>
                  {offer.matchScore}% match
                </Text>
              </View>
            </View>

            <View style={s.exchangeRow}>
              <View style={[s.exchangeBox, { backgroundColor: t.accent.green + '10' }]}>
                <Text style={[s.exchangeLabel, { color: t.accent.green }]}>They have</Text>
                <Text style={s.exchangeTitle}>{offer.haveTitle}</Text>
                <Text style={s.exchangeDesc}>{offer.haveDescription}</Text>
              </View>
              <View style={s.exchangeArrow}>
                <Text style={s.arrowText}>{'\u21C4'}</Text>
              </View>
              <View style={[s.exchangeBox, { backgroundColor: t.accent.blue + '10' }]}>
                <Text style={[s.exchangeLabel, { color: t.accent.blue }]}>They want</Text>
                <Text style={s.exchangeTitle}>{offer.wantTitle}</Text>
                <Text style={s.exchangeDesc}>{offer.wantDescription}</Text>
              </View>
            </View>

            <Text style={s.offerMeta}>{offer.location} | Posted {offer.date}</Text>

            {offer.status === 'open' ? (
              <>
                <TouchableOpacity
                  style={s.proposeBtn}
                  onPress={() => setProposeId(proposeId === offer.id ? null : offer.id)}
                >
                  <Text style={s.proposeBtnText}>Propose Trade</Text>
                </TouchableOpacity>

                {proposeId === offer.id && (
                  <View style={s.proposeRow}>
                    <TextInput
                      style={s.proposeInput}
                      placeholder="What do you offer in exchange?"
                      placeholderTextColor={t.text.muted}
                      value={proposeOffer}
                      onChangeText={setProposeOffer}
                      multiline
                    />
                    <TouchableOpacity style={s.proposeConfirmBtn} onPress={() => handleProposeTrade(offer.id)}>
                      <Text style={s.proposeConfirmText}>Send Proposal</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            ) : (
              <View style={s.proposedBadge}>
                <Text style={s.proposedText}>Trade Proposed</Text>
              </View>
            )}
          </View>
        ))
      )}
    </>
  );

  // ─── Offer Tab ───

  const renderOffer = () => (
    <View style={s.card}>
      <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Create a Barter Offer</Text>

      <Text style={{ color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold, marginBottom: 8 }}>What You Have</Text>
      <TextInput
        style={s.input}
        placeholder="Item or service title"
        placeholderTextColor={t.text.muted}
        value={haveTitle}
        onChangeText={setHaveTitle}
      />
      <TextInput
        style={s.input}
        placeholder="Describe what you're offering"
        placeholderTextColor={t.text.muted}
        value={haveDesc}
        onChangeText={setHaveDesc}
        multiline
      />
      <Text style={{ color: t.text.muted, fontSize: fonts.sm, marginBottom: 6 }}>Category (have)</Text>
      <View style={s.typeGrid}>
        {CATEGORIES.filter((c) => c.key !== 'all').map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[s.typeChip, haveCategory === cat.key && s.typeChipSelected]}
            onPress={() => setHaveCategory(cat.key)}
          >
            <Text style={[s.typeChipText, haveCategory === cat.key && s.typeChipTextSelected]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 1, backgroundColor: t.bg.primary, marginVertical: 12 }} />

      <Text style={{ color: t.accent.blue, fontSize: fonts.sm, fontWeight: fonts.bold, marginBottom: 8 }}>What You Want</Text>
      <TextInput
        style={s.input}
        placeholder="Item or service you want"
        placeholderTextColor={t.text.muted}
        value={wantTitle}
        onChangeText={setWantTitle}
      />
      <TextInput
        style={s.input}
        placeholder="Describe what you're looking for"
        placeholderTextColor={t.text.muted}
        value={wantDesc}
        onChangeText={setWantDesc}
        multiline
      />
      <Text style={{ color: t.text.muted, fontSize: fonts.sm, marginBottom: 6 }}>Category (want)</Text>
      <View style={s.typeGrid}>
        {CATEGORIES.filter((c) => c.key !== 'all').map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[s.typeChip, wantCategory === cat.key && s.typeChipSelected]}
            onPress={() => setWantCategory(cat.key)}
          >
            <Text style={[s.typeChipText, wantCategory === cat.key && s.typeChipTextSelected]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 1, backgroundColor: t.bg.primary, marginVertical: 12 }} />

      <TextInput
        style={s.input}
        placeholder="Your location / area"
        placeholderTextColor={t.text.muted}
        value={offerLocation}
        onChangeText={setOfferLocation}
      />

      <TouchableOpacity style={s.submitBtn} onPress={handleSubmitOffer}>
        <Text style={s.submitText}>Post Barter Offer</Text>
      </TouchableOpacity>
    </View>
  );

  // ─── Trades Tab ───

  const renderTrades = () => (
    <>
      <Text style={s.sectionTitle}>Proposed Trades</Text>
      {DEMO_PROPOSED.length === 0 ? (
        <View style={s.card}>
          <Text style={{ color: t.text.muted, textAlign: 'center' }}>No proposed trades yet.</Text>
        </View>
      ) : (
        DEMO_PROPOSED.map((trade) => (
          <View key={trade.id} style={s.tradeCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={s.offerName}>{trade.theirName}</Text>
              <Text style={[s.tradeStatus, { color: statusColor(trade.status) }]}>
                {trade.status.charAt(0).toUpperCase() + trade.status.slice(1)}
              </Text>
            </View>
            <Text style={s.tradeExchange}>
              They give: {trade.theyGive}
            </Text>
            <Text style={s.tradeExchange}>
              You give: {trade.youGive}
            </Text>
            <Text style={s.tradeDetail}>Proposed {trade.date}</Text>

            {trade.status === 'pending' && (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <TouchableOpacity
                  style={[s.proposeBtn, { backgroundColor: t.accent.green }]}
                  onPress={() => Alert.alert('Accepted!', `Trade with ${trade.theirName} accepted. Coordinate the exchange!`)}
                >
                  <Text style={s.proposeBtnText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.proposeBtn, { backgroundColor: t.text.muted + '40' }]}
                  onPress={() => Alert.alert('Declined', 'Trade proposal declined.')}
                >
                  <Text style={[s.proposeBtnText, { color: t.text.primary }]}>Decline</Text>
                </TouchableOpacity>
              </View>
            )}

            {trade.status === 'accepted' && (
              <TouchableOpacity
                style={[s.proposeBtn, { backgroundColor: t.accent.purple, marginTop: 10 }]}
                onPress={() => Alert.alert('Marked Complete', 'Trade marked as complete. Please rate your exchange partner.')}
              >
                <Text style={s.proposeBtnText}>Mark Complete</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}
    </>
  );

  // ─── History Tab ───

  const renderHistory = () => (
    <>
      <View style={s.statsCard}>
        <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Community Barter Stats</Text>
        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={s.statNum}>847</Text>
            <Text style={s.statLabel}>Items{'\n'}Exchanged</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statNum}>312</Text>
            <Text style={s.statLabel}>Active{'\n'}Barterers</Text>
          </View>
          <View style={s.statBox}>
            <Text style={[s.statNum, { color: t.accent.green }]}>$42.3K</Text>
            <Text style={s.statLabel}>Value Created{'\n'}Without Money</Text>
          </View>
        </View>
      </View>

      <Text style={s.sectionTitle}>Your Trade History</Text>
      {DEMO_COMPLETED.map((trade) => (
        <View key={trade.id} style={s.historyCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={s.historyTitle}>with {trade.partnerName}</Text>
            <Text style={s.historyMeta}>{trade.date}</Text>
          </View>
          <Text style={{ color: t.accent.green, fontSize: fonts.sm, marginTop: 6 }}>
            You gave: {trade.youGave}
          </Text>
          <Text style={{ color: t.accent.blue, fontSize: fonts.sm, marginTop: 2 }}>
            You received: {trade.youReceived}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <View>
              <Text style={{ color: t.text.muted, fontSize: fonts.xs }}>Your rating</Text>
              <View style={s.ratingRow}>{renderStars(trade.rating)}</View>
            </View>
            <View style={{ alignItems: 'flex-end' as const }}>
              <Text style={{ color: t.text.muted, fontSize: fonts.xs }}>Their rating</Text>
              <View style={s.ratingRow}>{renderStars(trade.partnerRating)}</View>
            </View>
          </View>
        </View>
      ))}

      <View style={[s.card, { alignItems: 'center' }]}>
        <Text style={{ color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold }}>
          {DEMO_COMPLETED.length} trades completed
        </Text>
        <Text style={{ color: t.text.muted, fontSize: fonts.sm, marginTop: 4 }}>
          Average rating: {(DEMO_COMPLETED.reduce((sum, t) => sum + t.rating, 0) / DEMO_COMPLETED.length).toFixed(1)} / 5
        </Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Barter Exchange</Text>
        <View style={{ width: 60 }} />
      </View>

      {demoMode && (
        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO MODE</Text>
        </View>
      )}

      <View style={s.tabRow}>
        {tabs.map((tb) => (
          <TouchableOpacity
            key={tb.key}
            style={[s.tabBtn, tab === tb.key && s.tabActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {tab === 'browse' && renderBrowse()}
        {tab === 'offer' && renderOffer()}
        {tab === 'trades' && renderTrades()}
        {tab === 'history' && renderHistory()}
      </ScrollView>
    </SafeAreaView>
  );
}
