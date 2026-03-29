/**
 * TimeBank Screen — Time-Based Value Exchange.
 *
 * "All time is equal — one hour of teaching equals one hour of gardening.
 *  Every person's time has the same inherent worth."
 * — Human Constitution, Article IV, Section 2
 *
 * Features:
 * - Time balance (hours given vs hours received, 1h = 1h regardless of skill)
 * - Offer services (list skills you can provide to the community)
 * - Request services (browse available services from community members)
 * - Active exchanges (ongoing time exchanges with status)
 * - Exchange history (completed exchanges with ratings)
 * - Community time stats (total hours exchanged, popular skills, active members)
 * - Philosophy card explaining time equality
 * - Demo data with realistic sample exchanges
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface TimeBalance {
  hoursGiven: number;
  hoursReceived: number;
  activeExchanges: number;
  completedExchanges: number;
  averageRating: number;
  memberSince: string;
}

interface ServiceOffer {
  id: string;
  providerUID: string;
  providerName: string;
  skill: string;
  category: string;
  description: string;
  availableHours: number;
  rating: number;
  completedExchanges: number;
}

interface ActiveExchange {
  id: string;
  partnerUID: string;
  partnerName: string;
  skill: string;
  hours: number;
  direction: 'giving' | 'receiving';
  status: 'scheduled' | 'in_progress' | 'pending_confirm';
  scheduledDate: string;
}

interface CompletedExchange {
  id: string;
  partnerUID: string;
  partnerName: string;
  skill: string;
  hours: number;
  direction: 'gave' | 'received';
  rating: number;
  date: string;
  feedback: string;
}

interface CommunityStats {
  totalHoursExchanged: number;
  activeMembers: number;
  totalExchanges: number;
  mostPopularSkills: Array<{ skill: string; hours: number }>;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const SKILL_CATEGORIES = [
  { key: 'tutoring', label: 'Tutoring', icon: 'T' },
  { key: 'cooking', label: 'Cooking', icon: 'C' },
  { key: 'repair', label: 'Repair', icon: 'R' },
  { key: 'gardening', label: 'Gardening', icon: 'G' },
  { key: 'tech', label: 'Tech Help', icon: '#' },
  { key: 'music', label: 'Music', icon: 'M' },
  { key: 'language', label: 'Language', icon: 'L' },
  { key: 'fitness', label: 'Fitness', icon: 'F' },
  { key: 'crafts', label: 'Crafts', icon: '*' },
  { key: 'childcare', label: 'Childcare', icon: 'K' },
];

// ─── Demo Data ───

const DEMO_BALANCE: TimeBalance = {
  hoursGiven: 12,
  hoursReceived: 8,
  activeExchanges: 2,
  completedExchanges: 14,
  averageRating: 4.7,
  memberSince: '2025-11-15',
};

const DEMO_MY_OFFERS: ServiceOffer[] = [
  { id: 'mo1', providerUID: 'you', providerName: 'You', skill: 'Python Programming', category: 'tech', description: 'Help with Python scripting, data analysis, and automation', availableHours: 4, rating: 4.8, completedExchanges: 6 },
  { id: 'mo2', providerUID: 'you', providerName: 'You', skill: 'Guitar Lessons', category: 'music', description: 'Beginner to intermediate acoustic guitar', availableHours: 2, rating: 5.0, completedExchanges: 3 },
  { id: 'mo3', providerUID: 'you', providerName: 'You', skill: 'Vegetable Gardening', category: 'gardening', description: 'Seasonal planting, composting, raised bed setup', availableHours: 3, rating: 4.5, completedExchanges: 5 },
];

const DEMO_AVAILABLE_SERVICES: ServiceOffer[] = [
  { id: 'as1', providerUID: 'openchain1abc...maria', providerName: 'Maria S.', skill: 'Home Cooking Classes', category: 'cooking', description: 'Traditional recipes, meal prep, baking basics', availableHours: 6, rating: 4.9, completedExchanges: 22 },
  { id: 'as2', providerUID: 'openchain1def...james', providerName: 'James K.', skill: 'Bicycle Repair', category: 'repair', description: 'Tune-ups, flat tires, brake adjustments, chain replacement', availableHours: 3, rating: 4.6, completedExchanges: 15 },
  { id: 'as3', providerUID: 'openchain1ghi...priya', providerName: 'Priya R.', skill: 'Math Tutoring', category: 'tutoring', description: 'Algebra, calculus, statistics — high school and college level', availableHours: 5, rating: 5.0, completedExchanges: 31 },
  { id: 'as4', providerUID: 'openchain1jkl...diego', providerName: 'Diego M.', skill: 'Spanish Conversation', category: 'language', description: 'Conversational Spanish practice, pronunciation, culture tips', availableHours: 4, rating: 4.7, completedExchanges: 18 },
];

const DEMO_ACTIVE_EXCHANGES: ActiveExchange[] = [
  { id: 'ae1', partnerUID: 'openchain1abc...maria', partnerName: 'Maria S.', skill: 'Home Cooking Classes', hours: 2, direction: 'receiving', status: 'scheduled', scheduledDate: '2026-04-01' },
  { id: 'ae2', partnerUID: 'openchain1ghi...priya', partnerName: 'Priya R.', skill: 'Python Programming', hours: 1, direction: 'giving', status: 'pending_confirm', scheduledDate: '2026-03-27' },
];

const DEMO_HISTORY: CompletedExchange[] = [
  { id: 'h1', partnerUID: 'openchain1def...james', partnerName: 'James K.', skill: 'Bicycle Repair', hours: 1, direction: 'received', rating: 5, date: '2026-03-20', feedback: 'James fixed my bike perfectly. Great teacher!' },
  { id: 'h2', partnerUID: 'openchain1jkl...diego', partnerName: 'Diego M.', skill: 'Guitar Lessons', hours: 2, direction: 'gave', rating: 5, date: '2026-03-18', feedback: 'Wonderful lesson, very patient.' },
  { id: 'h3', partnerUID: 'openchain1abc...maria', partnerName: 'Maria S.', skill: 'Vegetable Gardening', hours: 3, direction: 'gave', rating: 4, date: '2026-03-14', feedback: 'Learned so much about composting.' },
  { id: 'h4', partnerUID: 'openchain1ghi...priya', partnerName: 'Priya R.', skill: 'Math Tutoring', hours: 2, direction: 'received', rating: 5, date: '2026-03-10', feedback: 'Priya made calculus actually understandable.' },
  { id: 'h5', partnerUID: 'openchain1mno...chen', partnerName: 'Chen W.', skill: 'Python Programming', hours: 2, direction: 'gave', rating: 5, date: '2026-03-06', feedback: 'Excellent session on data analysis.' },
  { id: 'h6', partnerUID: 'openchain1pqr...sara', partnerName: 'Sara L.', skill: 'Yoga Session', hours: 1, direction: 'received', rating: 4, date: '2026-03-01', feedback: 'Very calming and well-structured.' },
];

const DEMO_COMMUNITY_STATS: CommunityStats = {
  totalHoursExchanged: 4_832,
  activeMembers: 347,
  totalExchanges: 2_416,
  mostPopularSkills: [
    { skill: 'Tutoring', hours: 892 },
    { skill: 'Cooking', hours: 674 },
    { skill: 'Gardening', hours: 548 },
    { skill: 'Tech Help', hours: 512 },
    { skill: 'Repair', hours: 446 },
  ],
};

type Tab = 'balance' | 'offer' | 'request' | 'history';

export function TimeBankScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('balance');
  const [offerSkill, setOfferSkill] = useState('');
  const [offerCategory, setOfferCategory] = useState('');
  const [offerDescription, setOfferDescription] = useState('');
  const [offerHours, setOfferHours] = useState('');
  const [requestFilter, setRequestFilter] = useState('');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const balance = DEMO_BALANCE;
  const myOffers = DEMO_MY_OFFERS;
  const availableServices = DEMO_AVAILABLE_SERVICES;
  const activeExchanges = DEMO_ACTIVE_EXCHANGES;
  const history = DEMO_HISTORY;
  const communityStats = DEMO_COMMUNITY_STATS;

  const filteredServices = useMemo(() => {
    if (!requestFilter) return availableServices;
    return availableServices.filter((svc) =>
      svc.skill.toLowerCase().includes(requestFilter.toLowerCase()) ||
      svc.category.toLowerCase().includes(requestFilter.toLowerCase()) ||
      svc.description.toLowerCase().includes(requestFilter.toLowerCase())
    );
  }, [requestFilter, availableServices]);

  const handlePostOffer = useCallback(() => {
    if (!offerSkill.trim()) { Alert.alert('Required', 'Enter the skill you want to offer.'); return; }
    if (!offerCategory) { Alert.alert('Required', 'Select a category.'); return; }
    const hours = parseInt(offerHours, 10);
    if (!hours || hours <= 0) { Alert.alert('Required', 'Enter available hours.'); return; }

    Alert.alert(
      'Offer Posted',
      `Your offer of "${offerSkill}" (${hours} hours available) has been posted to the TimeBank.\n\nCommunity members can now request your time.`,
    );
    setOfferSkill('');
    setOfferCategory('');
    setOfferDescription('');
    setOfferHours('');
  }, [offerSkill, offerCategory, offerHours]);

  const handleRequestService = useCallback((service: ServiceOffer) => {
    Alert.alert(
      'Request Time Exchange',
      `Request 1 hour of "${service.skill}" from ${service.providerName}?\n\nRemember: 1 hour = 1 hour. You will owe 1 hour of any skill in return.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Request', onPress: () => Alert.alert('Request Sent', `Your request has been sent to ${service.providerName}. You will be notified when they respond.`) },
      ],
    );
  }, []);

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    let stars = '';
    for (let i = 0; i < full; i++) stars += '*';
    if (half) stars += '.';
    return stars + ` ${rating.toFixed(1)}`;
  };

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.purple + '20' },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: '600' },
    tabTextActive: { color: t.accent.purple },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 12, marginHorizontal: 20 },
    // Balance
    balanceHeader: { alignItems: 'center', marginBottom: 16 },
    balanceRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'baseline', gap: 20 },
    balanceNum: { fontSize: 42, fontWeight: '900' },
    balanceLabel: { color: t.text.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2, textAlign: 'center' },
    balanceDivider: { color: t.text.muted, fontSize: 24, fontWeight: '300' },
    netBalance: { marginTop: 8, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, alignSelf: 'center' },
    netBalanceText: { fontSize: 14, fontWeight: '700' },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    // Philosophy
    philosophyCard: { backgroundColor: t.accent.purple + '10', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    philosophyTitle: { color: t.accent.purple, fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
    philosophyText: { color: t.text.primary, fontSize: 14, textAlign: 'center', lineHeight: 22 },
    // Active exchanges
    exchangeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    exchangeIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    exchangeIconText: { fontSize: 14, fontWeight: '700' },
    exchangeInfo: { flex: 1 },
    exchangeTitle: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    exchangeMeta: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    exchangeRight: { alignItems: 'flex-end' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    // Community stats
    communityRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
    communityItem: { alignItems: 'center' },
    communityValue: { color: t.text.primary, fontSize: 22, fontWeight: '900' },
    communityLabel: { color: t.text.muted, fontSize: 11, marginTop: 2, textAlign: 'center' },
    skillBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    skillLabel: { color: t.text.primary, fontSize: 13, fontWeight: '600', width: 80 },
    skillBarBg: { flex: 1, height: 8, backgroundColor: t.bg.primary, borderRadius: 4, marginLeft: 8 },
    skillBarFill: { height: 8, borderRadius: 4, backgroundColor: t.accent.purple },
    skillHours: { color: t.text.muted, fontSize: 11, marginLeft: 8, width: 40, textAlign: 'right' },
    // Offer form
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    categoryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: t.bg.primary },
    categoryChipSelected: { backgroundColor: t.accent.purple + '20', borderColor: t.accent.purple },
    categoryChipText: { color: t.text.muted, fontSize: 13, fontWeight: '600' },
    categoryChipTextSelected: { color: t.accent.purple },
    submitBtn: { backgroundColor: t.accent.purple, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    // My offers
    offerCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    offerTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    offerMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    offerStats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    offerRating: { color: t.accent.orange, fontSize: 13, fontWeight: '700' },
    offerAvailable: { color: t.accent.purple, fontSize: 13, fontWeight: '700' },
    // Service request
    serviceCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    serviceTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    serviceMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    serviceProvider: { color: t.text.secondary, fontSize: 13, fontWeight: '600', marginTop: 6 },
    serviceActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    requestBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    requestBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    // History
    historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    historyIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    historyIconText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    historyInfo: { flex: 1 },
    historyTitle: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    historyMeta: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    historyFeedback: { color: t.text.secondary, fontSize: 12, fontStyle: 'italic', marginTop: 4 },
    historyRight: { alignItems: 'flex-end' },
    historyHours: { fontSize: 16, fontWeight: '800' },
    historyRating: { color: t.accent.orange, fontSize: 11, marginTop: 2 },
    // Demo tag
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: '700' },
    // Search
    searchInput: { backgroundColor: t.bg.secondary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginHorizontal: 20, marginBottom: 16 },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'balance', label: 'Balance' },
    { key: 'offer', label: 'Offer' },
    { key: 'request', label: 'Request' },
    { key: 'history', label: 'History' },
  ];

  // ─── Balance Tab ───

  const netHours = balance.hoursGiven - balance.hoursReceived;
  const netPositive = netHours >= 0;

  const renderBalance = () => (
    <>
      {/* Philosophy Card */}
      <View style={s.philosophyCard}>
        <Text style={s.philosophyTitle}>Time Equality Principle</Text>
        <Text style={s.philosophyText}>
          All time is equal — one hour of teaching equals one hour of gardening.
          Every person's time has the same inherent worth. No skill is valued above another.
        </Text>
      </View>

      {/* Time Balance */}
      <View style={s.card}>
        <View style={s.balanceHeader}>
          <Text style={s.balanceLabel}>Your Time Balance</Text>
          <View style={s.balanceRow}>
            <View style={{ alignItems: 'center' }}>
              <Text style={[s.balanceNum, { color: t.accent.green }]}>{balance.hoursGiven}</Text>
              <Text style={s.balanceLabel}>Hours Given</Text>
            </View>
            <Text style={s.balanceDivider}>|</Text>
            <View style={{ alignItems: 'center' }}>
              <Text style={[s.balanceNum, { color: t.accent.blue }]}>{balance.hoursReceived}</Text>
              <Text style={s.balanceLabel}>Hours Received</Text>
            </View>
          </View>
          <View style={[s.netBalance, { backgroundColor: netPositive ? t.accent.green + '20' : t.accent.orange + '20' }]}>
            <Text style={[s.netBalanceText, { color: netPositive ? t.accent.green : t.accent.orange }]}>
              Net: {netPositive ? '+' : ''}{netHours}h {netPositive ? '(giving more)' : '(receiving more)'}
            </Text>
          </View>
        </View>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{balance.activeExchanges}</Text>
            <Text style={s.statLabel}>Active</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statValue}>{balance.completedExchanges}</Text>
            <Text style={s.statLabel}>Completed</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.orange }]}>{balance.averageRating}</Text>
            <Text style={s.statLabel}>Avg Rating</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statValue}>{balance.memberSince.slice(0, 7)}</Text>
            <Text style={s.statLabel}>Member Since</Text>
          </View>
        </View>
      </View>

      {/* Active Exchanges */}
      {activeExchanges.length > 0 && (
        <>
          <Text style={s.sectionTitle}>Active Exchanges</Text>
          <View style={s.card}>
            {activeExchanges.map((ex) => {
              const isGiving = ex.direction === 'giving';
              const statusColors: Record<string, string> = {
                scheduled: t.accent.blue,
                in_progress: t.accent.green,
                pending_confirm: t.accent.orange,
              };
              const statusLabels: Record<string, string> = {
                scheduled: 'Scheduled',
                in_progress: 'In Progress',
                pending_confirm: 'Pending',
              };
              return (
                <View key={ex.id} style={s.exchangeRow}>
                  <View style={[s.exchangeIcon, { backgroundColor: (isGiving ? t.accent.green : t.accent.blue) + '20' }]}>
                    <Text style={[s.exchangeIconText, { color: isGiving ? t.accent.green : t.accent.blue }]}>
                      {isGiving ? '>' : '<'}
                    </Text>
                  </View>
                  <View style={s.exchangeInfo}>
                    <Text style={s.exchangeTitle}>{ex.skill}</Text>
                    <Text style={s.exchangeMeta}>
                      {isGiving ? 'Giving to' : 'Receiving from'} {ex.partnerName} | {ex.hours}h | {ex.scheduledDate}
                    </Text>
                  </View>
                  <View style={s.exchangeRight}>
                    <View style={[s.statusBadge, { backgroundColor: statusColors[ex.status] + '20' }]}>
                      <Text style={[s.statusText, { color: statusColors[ex.status] }]}>
                        {statusLabels[ex.status]}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </>
      )}

      {/* Community Stats */}
      <Text style={s.sectionTitle}>Community Time Stats</Text>
      <View style={s.card}>
        <View style={s.communityRow}>
          <View style={s.communityItem}>
            <Text style={s.communityValue}>{communityStats.totalHoursExchanged.toLocaleString()}</Text>
            <Text style={s.communityLabel}>Hours{'\n'}Exchanged</Text>
          </View>
          <View style={s.communityItem}>
            <Text style={s.communityValue}>{communityStats.activeMembers}</Text>
            <Text style={s.communityLabel}>Active{'\n'}Members</Text>
          </View>
          <View style={s.communityItem}>
            <Text style={s.communityValue}>{communityStats.totalExchanges.toLocaleString()}</Text>
            <Text style={s.communityLabel}>Total{'\n'}Exchanges</Text>
          </View>
        </View>

        <Text style={[s.sectionTitle, { marginHorizontal: 0, marginTop: 8 }]}>Most Popular Skills</Text>
        {communityStats.mostPopularSkills.map((skill) => {
          const maxHours = communityStats.mostPopularSkills[0].hours;
          const pct = (skill.hours / maxHours) * 100;
          return (
            <View key={skill.skill} style={s.skillBar}>
              <Text style={s.skillLabel}>{skill.skill}</Text>
              <View style={s.skillBarBg}>
                <View style={[s.skillBarFill, { width: `${pct}%` }]} />
              </View>
              <Text style={s.skillHours}>{skill.hours}h</Text>
            </View>
          );
        })}
      </View>
    </>
  );

  // ─── Offer Tab ───

  const renderOffer = () => (
    <>
      {/* My Current Offers */}
      <Text style={s.sectionTitle}>Your Active Offers</Text>
      {myOffers.map((offer) => (
        <View key={offer.id} style={s.offerCard}>
          <Text style={s.offerTitle}>{offer.skill}</Text>
          <Text style={s.offerMeta}>{offer.description}</Text>
          <View style={s.offerStats}>
            <Text style={s.offerRating}>{renderStars(offer.rating)}</Text>
            <Text style={s.offerAvailable}>{offer.availableHours}h available</Text>
          </View>
          <Text style={[s.offerMeta, { marginTop: 4 }]}>{offer.completedExchanges} exchanges completed</Text>
        </View>
      ))}

      {/* Post New Offer */}
      <Text style={s.sectionTitle}>Post a New Offer</Text>
      <View style={s.card}>
        <Text style={[s.exchangeMeta, { marginBottom: 8 }]}>Category</Text>
        <View style={s.categoryGrid}>
          {SKILL_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[s.categoryChip, offerCategory === cat.key && s.categoryChipSelected]}
              onPress={() => setOfferCategory(cat.key)}
            >
              <Text style={[s.categoryChipText, offerCategory === cat.key && s.categoryChipTextSelected]}>
                {cat.icon} {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={s.input}
          placeholder="Skill name (e.g., Piano Lessons)"
          placeholderTextColor={t.text.muted}
          value={offerSkill}
          onChangeText={setOfferSkill}
        />

        <TextInput
          style={s.input}
          placeholder="Description of what you offer"
          placeholderTextColor={t.text.muted}
          value={offerDescription}
          onChangeText={setOfferDescription}
          multiline
        />

        <TextInput
          style={s.input}
          placeholder="Available hours per week"
          placeholderTextColor={t.text.muted}
          keyboardType="numeric"
          value={offerHours}
          onChangeText={setOfferHours}
        />

        <TouchableOpacity style={s.submitBtn} onPress={handlePostOffer}>
          <Text style={s.submitText}>Post Offer</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // ─── Request Tab ───

  const renderRequest = () => (
    <>
      <TextInput
        style={s.searchInput}
        placeholder="Search skills, categories..."
        placeholderTextColor={t.text.muted}
        value={requestFilter}
        onChangeText={setRequestFilter}
      />

      <Text style={s.sectionTitle}>Available Services ({filteredServices.length})</Text>
      {filteredServices.map((svc) => (
        <View key={svc.id} style={s.serviceCard}>
          <Text style={s.serviceTitle}>{svc.skill}</Text>
          <Text style={s.serviceMeta}>{svc.description}</Text>
          <Text style={s.serviceProvider}>
            {svc.providerName} | {renderStars(svc.rating)} | {svc.completedExchanges} exchanges
          </Text>
          <View style={s.serviceActions}>
            <Text style={s.offerAvailable}>{svc.availableHours}h available</Text>
            <TouchableOpacity
              style={s.requestBtn}
              onPress={() => handleRequestService(svc)}
            >
              <Text style={s.requestBtnText}>Request</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {filteredServices.length === 0 && (
        <View style={[s.card, { alignItems: 'center' }]}>
          <Text style={s.exchangeMeta}>No services match your search.</Text>
        </View>
      )}
    </>
  );

  // ─── History Tab ───

  const renderHistory = () => {
    const totalGave = history.filter((h) => h.direction === 'gave').reduce((sum, h) => sum + h.hours, 0);
    const totalReceived = history.filter((h) => h.direction === 'received').reduce((sum, h) => sum + h.hours, 0);

    return (
      <>
        {/* Summary */}
        <View style={s.card}>
          <View style={s.communityRow}>
            <View style={s.communityItem}>
              <Text style={[s.communityValue, { color: t.accent.green }]}>{totalGave}h</Text>
              <Text style={s.communityLabel}>Given</Text>
            </View>
            <View style={s.communityItem}>
              <Text style={[s.communityValue, { color: t.accent.blue }]}>{totalReceived}h</Text>
              <Text style={s.communityLabel}>Received</Text>
            </View>
            <View style={s.communityItem}>
              <Text style={s.communityValue}>{history.length}</Text>
              <Text style={s.communityLabel}>Exchanges</Text>
            </View>
          </View>
        </View>

        {/* Exchange History */}
        <Text style={s.sectionTitle}>Exchange History</Text>
        <View style={s.card}>
          {history.map((ex) => {
            const isGave = ex.direction === 'gave';
            return (
              <View key={ex.id} style={s.historyRow}>
                <View style={[s.historyIcon, { backgroundColor: isGave ? t.accent.green : t.accent.blue }]}>
                  <Text style={s.historyIconText}>{isGave ? '>' : '<'}</Text>
                </View>
                <View style={s.historyInfo}>
                  <Text style={s.historyTitle}>{ex.skill}</Text>
                  <Text style={s.historyMeta}>
                    {isGave ? 'Gave to' : 'Received from'} {ex.partnerName} | {ex.date}
                  </Text>
                  <Text style={s.historyFeedback}>"{ex.feedback}"</Text>
                </View>
                <View style={s.historyRight}>
                  <Text style={[s.historyHours, { color: isGave ? t.accent.green : t.accent.blue }]}>
                    {isGave ? '-' : '+'}{ex.hours}h
                  </Text>
                  <Text style={s.historyRating}>{renderStars(ex.rating)}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>TimeBank</Text>
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
        {tab === 'balance' && renderBalance()}
        {tab === 'offer' && renderOffer()}
        {tab === 'request' && renderRequest()}
        {tab === 'history' && renderHistory()}
      </ScrollView>
    </SafeAreaView>
  );
}
