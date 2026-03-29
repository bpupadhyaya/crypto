/**
 * Resource Matching Screen — Article I, Section 3 of The Human Constitution.
 *
 * "When people's basic needs are met, they are resilient against
 *  manipulation and exploitation."
 *
 * Connect people who need help with people who can help.
 * Privacy-preserving: needs are anonymous until match is accepted.
 * OTK rewards for successful matches (cOTK for helpers).
 *
 * Features:
 * - Offer Help: what you can provide
 * - Find Help: browse available resources
 * - Match Feed: suggested matches based on needs + offers
 * - Active Matches: ongoing help connections
 * - Impact: "You've helped X people meet Y needs"
 * - Demo mode
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

type MatchTab = 'offer' | 'find' | 'matches' | 'active' | 'impact';

interface ResourceCategory {
  key: string;
  label: string;
  icon: string;
  description: string;
}

interface ResourceOffer {
  id: string;
  category: string;
  provider: string;
  description: string;
  region: string;
  available: boolean;
  rating: number;
  matchCount: number;
}

interface MatchSuggestion {
  id: string;
  needCategory: string;
  needDescription: string;
  needRegion: string;
  offerCategory: string;
  offerDescription: string;
  offerProvider: string;
  compatibility: number;
  status: 'suggested' | 'pending' | 'accepted';
}

interface ActiveMatch {
  id: string;
  category: string;
  partnerName: string;
  role: 'helper' | 'recipient';
  description: string;
  startDate: string;
  status: 'in-progress' | 'completed';
  otkReward: number;
}

interface ImpactStats {
  peopleHelped: number;
  needsMet: number;
  totalCOTK: number;
  categories: Record<string, number>;
  monthlyHelped: Array<{ month: string; count: number }>;
}

const RESOURCE_CATEGORIES: ResourceCategory[] = [
  { key: 'food', label: 'Food', icon: '\u{1F33E}', description: 'Meals, groceries, food distribution' },
  { key: 'housing', label: 'Housing', icon: '\u{1F3E0}', description: 'Shelter, rent assistance, temporary stay' },
  { key: 'tutoring', label: 'Tutoring', icon: '\u{1F4DA}', description: 'Academic help, skill training' },
  { key: 'medical', label: 'Medical', icon: '\u{1FA7A}', description: 'Healthcare, counseling, medicine' },
  { key: 'transport', label: 'Transport', icon: '\u{1F698}', description: 'Rides, delivery, logistics' },
  { key: 'mentoring', label: 'Mentoring', icon: '\u{1F31F}', description: 'Guidance, career advice, life coaching' },
];

const DEMO_OFFERS: ResourceOffer[] = [
  { id: '1', category: 'food', provider: 'UID-7a2f...', description: 'Weekly community kitchen — 50 meals per session', region: 'East Africa', available: true, rating: 4.8, matchCount: 23 },
  { id: '2', category: 'tutoring', provider: 'UID-3b9c...', description: 'Math and science tutoring for secondary students', region: 'Appalachia', available: true, rating: 4.9, matchCount: 15 },
  { id: '3', category: 'medical', provider: 'UID-8d1e...', description: 'Mobile health clinic — basic checkups and vaccinations', region: 'Sahel Region', available: true, rating: 4.7, matchCount: 42 },
  { id: '4', category: 'housing', provider: 'UID-5f4a...', description: 'Emergency shelter — 10 beds available nightly', region: 'Central America', available: true, rating: 4.5, matchCount: 31 },
  { id: '5', category: 'mentoring', provider: 'UID-2c8b...', description: 'Career mentoring for young adults, weekly sessions', region: 'South Asia', available: true, rating: 4.6, matchCount: 18 },
  { id: '6', category: 'transport', provider: 'UID-9e3d...', description: 'Community van service for medical appointments', region: 'Appalachia', available: false, rating: 4.4, matchCount: 8 },
];

const DEMO_MATCH_SUGGESTIONS: MatchSuggestion[] = [
  { id: '1', needCategory: 'food', needDescription: 'Family of 6 needs weekly groceries', needRegion: 'East Africa', offerCategory: 'food', offerDescription: 'Weekly community kitchen — 50 meals per session', offerProvider: 'UID-7a2f...', compatibility: 95, status: 'suggested' },
  { id: '2', needCategory: 'tutoring', needDescription: 'Three students need math help for exams', needRegion: 'Appalachia', offerCategory: 'tutoring', offerDescription: 'Math and science tutoring for secondary students', offerProvider: 'UID-3b9c...', compatibility: 92, status: 'pending' },
  { id: '3', needCategory: 'medical', needDescription: 'Village needs vaccination campaign', needRegion: 'Sahel Region', offerCategory: 'medical', offerDescription: 'Mobile health clinic — basic checkups and vaccinations', offerProvider: 'UID-8d1e...', compatibility: 98, status: 'suggested' },
  { id: '4', needCategory: 'housing', needDescription: 'Single parent needs temporary shelter after flood', needRegion: 'Central America', offerCategory: 'housing', offerDescription: 'Emergency shelter — 10 beds available nightly', offerProvider: 'UID-5f4a...', compatibility: 88, status: 'accepted' },
];

const DEMO_ACTIVE_MATCHES: ActiveMatch[] = [
  { id: '1', category: 'food', partnerName: 'Anonymous (until confirmed)', role: 'helper', description: 'Providing weekly meals to family in need', startDate: '2026-03-15', status: 'in-progress', otkReward: 50 },
  { id: '2', category: 'tutoring', partnerName: 'Anonymous (until confirmed)', role: 'helper', description: 'Tutoring 3 students in algebra', startDate: '2026-03-20', status: 'in-progress', otkReward: 30 },
  { id: '3', category: 'medical', partnerName: 'UID-8d1e...', role: 'recipient', description: 'Receiving vaccinations for my village', startDate: '2026-02-28', status: 'completed', otkReward: 0 },
];

const DEMO_IMPACT: ImpactStats = {
  peopleHelped: 47,
  needsMet: 62,
  totalCOTK: 1250,
  categories: { food: 18, tutoring: 12, medical: 8, housing: 5, mentoring: 3, transport: 1 },
  monthlyHelped: [
    { month: 'Oct', count: 3 },
    { month: 'Nov', count: 5 },
    { month: 'Dec', count: 7 },
    { month: 'Jan', count: 9 },
    { month: 'Feb', count: 11 },
    { month: 'Mar', count: 12 },
  ],
};

function compatColor(pct: number): string {
  if (pct >= 90) return '#22c55e';
  if (pct >= 70) return '#eab308';
  return '#f97316';
}

export function ResourceMatchScreen({ onClose }: Props) {
  const { demoMode } = useWalletStore();
  const t = useTheme();
  const [activeTab, setActiveTab] = useState<MatchTab>('find');
  const [offerCategory, setOfferCategory] = useState('food');
  const [offerDescription, setOfferDescription] = useState('');
  const [offerRegion, setOfferRegion] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 8 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '700' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { flex: 1, paddingHorizontal: 16 },
    subtitle: { color: t.text.muted, fontSize: 13, lineHeight: 19, marginBottom: 16 },
    tabRow: { flexDirection: 'row', marginBottom: 16, gap: 4 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: t.bg.card, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: 10, fontWeight: '600' },
    tabTextActive: { color: '#fff' },
    card: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    label: { color: t.text.muted, fontSize: 12 },
    val: { color: t.text.secondary, fontSize: 12, fontWeight: '600' },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 8, marginBottom: 8 },
    heroCard: { backgroundColor: t.accent.purple + '10', borderRadius: 20, padding: 20, marginBottom: 16, alignItems: 'center' },
    heroIcon: { fontSize: 40, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 17, fontWeight: '800', textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, backgroundColor: t.border },
    chipActive: { backgroundColor: t.accent.blue },
    chipText: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
    chipTextActive: { color: '#fff' },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginTop: 8 },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginTop: 12 },
    submitBtn: { backgroundColor: t.accent.purple, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 16, marginBottom: 16 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    empty: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 6 },
    statusText: { fontSize: 10, fontWeight: '700', color: '#fff', textTransform: 'uppercase' },
    matchCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: t.accent.green + '30' },
    compatBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    compatText: { fontSize: 12, fontWeight: '700', color: '#fff' },
    summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    summaryCard: { flex: 1, backgroundColor: t.bg.card, borderRadius: 12, padding: 14, alignItems: 'center' },
    summaryNum: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
    summaryLabel: { color: t.text.muted, fontSize: 10, fontWeight: '600', textAlign: 'center' },
    barContainer: { height: 8, backgroundColor: t.border, borderRadius: 4, marginVertical: 4, overflow: 'hidden' },
    barFill: { height: 8, borderRadius: 4 },
    offerCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    privacyNote: { color: t.text.muted, fontSize: 11, textAlign: 'center', marginTop: 8, fontStyle: 'italic' },
    actionBtn: { backgroundColor: t.accent.green, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center', marginTop: 8 },
    actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    ratingText: { color: t.accent.yellow, fontSize: 12, fontWeight: '700' },
  }), [t]);

  const offers = demoMode ? DEMO_OFFERS : [];
  const matchSuggestions = demoMode ? DEMO_MATCH_SUGGESTIONS : [];
  const activeMatches = demoMode ? DEMO_ACTIVE_MATCHES : [];
  const impact = demoMode ? DEMO_IMPACT : null;

  const filteredOffers = useMemo(() => {
    if (!filterCategory) return offers;
    return offers.filter(o => o.category === filterCategory);
  }, [offers, filterCategory]);

  const handleSubmitOffer = useCallback(() => {
    if (!offerDescription.trim()) {
      Alert.alert('Description Required', 'Please describe what you can offer.');
      return;
    }
    if (!offerRegion.trim()) {
      Alert.alert('Region Required', 'Please enter your region.');
      return;
    }
    Alert.alert(
      'Offer Submitted',
      'Your offer to help has been posted. You will earn cOTK (community OTK) for every successful match. You will be notified when someone needs your help.',
    );
    setOfferDescription('');
    setOfferRegion('');
  }, [offerDescription, offerRegion]);

  const handleAcceptMatch = useCallback((matchId: string) => {
    Alert.alert(
      'Accept Match?',
      'By accepting, your identity will be shared with the person in need so you can coordinate. Your needs assessment remains anonymous.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Accept', onPress: () => Alert.alert('Match Accepted', 'You are now connected. Coordinate through encrypted messages. You will earn cOTK upon completion.') },
      ],
    );
  }, []);

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.title}>Resource Matching</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={st.scroll}>
        <Text style={st.subtitle}>
          Connect people who need help with people who can help. Privacy-preserving: needs are anonymous until a match is accepted.
        </Text>

        <View style={st.tabRow}>
          {(['offer', 'find', 'matches', 'active', 'impact'] as MatchTab[]).map(tab => (
            <TouchableOpacity key={tab} style={[st.tab, activeTab === tab && st.tabActive]}
              onPress={() => setActiveTab(tab)}>
              <Text style={[st.tabText, activeTab === tab && st.tabTextActive]}>
                {tab === 'offer' ? 'Offer' : tab === 'find' ? 'Find' : tab === 'matches' ? 'Matches' : tab === 'active' ? 'Active' : 'Impact'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Offer Help Tab */}
        {activeTab === 'offer' && (
          <>
            <View style={st.heroCard}>
              <Text style={st.heroIcon}>{'\u{1F49C}'}</Text>
              <Text style={st.heroTitle}>Offer Your Help</Text>
              <Text style={st.heroSubtitle}>
                What can you provide? Your offer will be matched with anonymous community needs. You earn cOTK for every successful help connection.
              </Text>
            </View>

            <View style={st.card}>
              <Text style={st.inputLabel}>What Can You Offer?</Text>
              <View style={st.chipRow}>
                {RESOURCE_CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[st.chip, offerCategory === cat.key && st.chipActive]}
                    onPress={() => setOfferCategory(cat.key)}
                  >
                    <Text style={[st.chipText, offerCategory === cat.key && st.chipTextActive]}>
                      {cat.icon} {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={st.inputLabel}>Description</Text>
              <TextInput
                style={[st.input, { minHeight: 80, textAlignVertical: 'top' }]}
                placeholder="Describe what you can provide..."
                placeholderTextColor={t.text.muted}
                value={offerDescription}
                onChangeText={setOfferDescription}
                multiline
                numberOfLines={4}
              />

              <Text style={st.inputLabel}>Your Region</Text>
              <TextInput
                style={st.input}
                placeholder="Region or community..."
                placeholderTextColor={t.text.muted}
                value={offerRegion}
                onChangeText={setOfferRegion}
              />
            </View>

            <TouchableOpacity style={st.submitBtn} onPress={handleSubmitOffer}>
              <Text style={st.submitBtnText}>Post Offer to Help</Text>
            </TouchableOpacity>

            <Text style={st.privacyNote}>
              Your offer is visible to the matching algorithm. Your identity is only revealed when both parties accept a match.
            </Text>
          </>
        )}

        {/* Find Help Tab */}
        {activeTab === 'find' && (
          offers.length === 0 ? (
            <Text style={st.empty}>Enable Demo Mode in Settings to see available resources.</Text>
          ) : (
            <>
              <Text style={st.section}>Filter by Category</Text>
              <View style={st.chipRow}>
                <TouchableOpacity
                  style={[st.chip, filterCategory === null && st.chipActive]}
                  onPress={() => setFilterCategory(null)}
                >
                  <Text style={[st.chipText, filterCategory === null && st.chipTextActive]}>All</Text>
                </TouchableOpacity>
                {RESOURCE_CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[st.chip, filterCategory === cat.key && st.chipActive]}
                    onPress={() => setFilterCategory(cat.key)}
                  >
                    <Text style={[st.chipText, filterCategory === cat.key && st.chipTextActive]}>
                      {cat.icon} {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={st.section}>Available Resources ({filteredOffers.length})</Text>
              {filteredOffers.map(offer => {
                const cat = RESOURCE_CATEGORIES.find(c => c.key === offer.category);
                return (
                  <View key={offer.id} style={st.offerCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ fontSize: 24, marginRight: 10 }}>{cat?.icon ?? '\u{2753}'}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: t.text.primary, fontSize: 14, fontWeight: '700' }}>{cat?.label ?? offer.category}</Text>
                        <Text style={{ color: t.text.muted, fontSize: 11 }}>{offer.region}</Text>
                      </View>
                      {offer.available ? (
                        <View style={[st.statusBadge, { backgroundColor: '#22c55e', marginBottom: 0 }]}>
                          <Text style={st.statusText}>Available</Text>
                        </View>
                      ) : (
                        <View style={[st.statusBadge, { backgroundColor: '#6b7280', marginBottom: 0 }]}>
                          <Text style={st.statusText}>Busy</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ color: t.text.secondary, fontSize: 13, lineHeight: 19, marginBottom: 8 }}>{offer.description}</Text>
                    <View style={st.row}>
                      <Text style={st.label}>Provider</Text>
                      <Text style={st.val}>{offer.provider}</Text>
                    </View>
                    <View style={st.row}>
                      <Text style={st.label}>Rating</Text>
                      <Text style={st.ratingText}>{'\u2605'} {offer.rating.toFixed(1)}</Text>
                    </View>
                    <View style={st.row}>
                      <Text style={st.label}>People helped</Text>
                      <Text style={st.val}>{offer.matchCount}</Text>
                    </View>
                    {offer.available && (
                      <TouchableOpacity style={st.actionBtn} onPress={() => Alert.alert('Request Help', 'Your anonymous need request will be sent to this provider. They will see the need but not your identity until you both accept.')}>
                        <Text style={st.actionBtnText}>Request Help</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </>
          )
        )}

        {/* Match Feed Tab */}
        {activeTab === 'matches' && (
          matchSuggestions.length === 0 ? (
            <Text style={st.empty}>Enable Demo Mode to see match suggestions.</Text>
          ) : (
            <>
              <View style={st.heroCard}>
                <Text style={st.heroIcon}>{'\u{1F91D}'}</Text>
                <Text style={st.heroTitle}>Suggested Matches</Text>
                <Text style={st.heroSubtitle}>
                  These matches are based on needs and offers in your region. Both parties remain anonymous until a match is accepted.
                </Text>
              </View>

              {matchSuggestions.map(match => {
                const needCat = RESOURCE_CATEGORIES.find(c => c.key === match.needCategory);
                const statusColors: Record<string, string> = { suggested: '#3b82f6', pending: '#f97316', accepted: '#22c55e' };
                return (
                  <View key={match.id} style={st.matchCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <View style={[st.statusBadge, { backgroundColor: statusColors[match.status], marginBottom: 0 }]}>
                        <Text style={st.statusText}>{match.status}</Text>
                      </View>
                      <View style={[st.compatBadge, { backgroundColor: compatColor(match.compatibility) }]}>
                        <Text style={st.compatText}>{match.compatibility}% match</Text>
                      </View>
                    </View>

                    <Text style={{ color: t.text.muted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Need</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ fontSize: 18, marginRight: 8 }}>{needCat?.icon ?? '\u{2753}'}</Text>
                      <Text style={{ color: t.text.primary, fontSize: 13, flex: 1 }}>{match.needDescription}</Text>
                    </View>

                    <Text style={{ color: t.text.muted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Offer</Text>
                    <Text style={{ color: t.text.secondary, fontSize: 13, marginBottom: 4 }}>{match.offerDescription}</Text>
                    <Text style={{ color: t.text.muted, fontSize: 11 }}>by {match.offerProvider} in {match.needRegion}</Text>

                    {match.status === 'suggested' && (
                      <TouchableOpacity style={st.actionBtn} onPress={() => handleAcceptMatch(match.id)}>
                        <Text style={st.actionBtnText}>Accept Match</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}

              <Text style={st.privacyNote}>
                Needs are anonymous. Identity is only shared when both parties accept the match.
              </Text>
            </>
          )
        )}

        {/* Active Matches Tab */}
        {activeTab === 'active' && (
          activeMatches.length === 0 ? (
            <Text style={st.empty}>Enable Demo Mode to see active matches.</Text>
          ) : (
            <>
              <Text style={st.section}>Ongoing Connections</Text>
              {activeMatches.filter(m => m.status === 'in-progress').map(match => {
                const cat = RESOURCE_CATEGORIES.find(c => c.key === match.category);
                return (
                  <View key={match.id} style={st.card}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ fontSize: 24, marginRight: 10 }}>{cat?.icon ?? '\u{2753}'}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: t.text.primary, fontSize: 14, fontWeight: '700' }}>{cat?.label ?? match.category}</Text>
                        <Text style={{ color: t.text.muted, fontSize: 11 }}>You are the {match.role}</Text>
                      </View>
                      <View style={[st.statusBadge, { backgroundColor: '#3b82f6', marginBottom: 0 }]}>
                        <Text style={st.statusText}>Active</Text>
                      </View>
                    </View>
                    <Text style={{ color: t.text.secondary, fontSize: 13, lineHeight: 19, marginBottom: 6 }}>{match.description}</Text>
                    <View style={st.row}>
                      <Text style={st.label}>Partner</Text>
                      <Text style={st.val}>{match.partnerName}</Text>
                    </View>
                    <View style={st.row}>
                      <Text style={st.label}>Since</Text>
                      <Text style={st.val}>{match.startDate}</Text>
                    </View>
                    {match.role === 'helper' && match.otkReward > 0 && (
                      <View style={st.row}>
                        <Text style={st.label}>cOTK reward on completion</Text>
                        <Text style={{ color: t.accent.green, fontSize: 12, fontWeight: '700' }}>+{match.otkReward} cOTK</Text>
                      </View>
                    )}
                    <TouchableOpacity style={st.actionBtn} onPress={() => Alert.alert('Mark Complete', 'Once both parties confirm, the match will be completed and cOTK rewards will be distributed.')}>
                      <Text style={st.actionBtnText}>Mark as Completed</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}

              <Text style={st.section}>Completed</Text>
              {activeMatches.filter(m => m.status === 'completed').map(match => {
                const cat = RESOURCE_CATEGORIES.find(c => c.key === match.category);
                return (
                  <View key={match.id} style={st.card}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={{ fontSize: 18, marginRight: 8 }}>{cat?.icon ?? '\u{2753}'}</Text>
                      <Text style={{ color: t.text.primary, fontSize: 14, fontWeight: '600', flex: 1 }}>{match.description}</Text>
                      <View style={[st.statusBadge, { backgroundColor: '#22c55e', marginBottom: 0 }]}>
                        <Text style={st.statusText}>Done</Text>
                      </View>
                    </View>
                    <View style={st.row}>
                      <Text style={st.label}>Role</Text>
                      <Text style={st.val}>{match.role}</Text>
                    </View>
                    <View style={st.row}>
                      <Text style={st.label}>Date</Text>
                      <Text style={st.val}>{match.startDate}</Text>
                    </View>
                  </View>
                );
              })}
            </>
          )
        )}

        {/* Impact Tab */}
        {activeTab === 'impact' && (
          impact === null ? (
            <Text style={st.empty}>Enable Demo Mode to see your impact stats.</Text>
          ) : (
            <>
              <View style={st.heroCard}>
                <Text style={st.heroIcon}>{'\u{1F30D}'}</Text>
                <Text style={st.heroTitle}>Your Impact</Text>
                <Text style={st.heroSubtitle}>
                  Every match helps fulfill basic needs — building resilience against manipulation and exploitation.
                </Text>
              </View>

              <View style={st.summaryRow}>
                <View style={st.summaryCard}>
                  <Text style={[st.summaryNum, { color: t.accent.green }]}>{impact.peopleHelped}</Text>
                  <Text style={st.summaryLabel}>People Helped</Text>
                </View>
                <View style={st.summaryCard}>
                  <Text style={[st.summaryNum, { color: t.accent.blue }]}>{impact.needsMet}</Text>
                  <Text style={st.summaryLabel}>Needs Met</Text>
                </View>
                <View style={st.summaryCard}>
                  <Text style={[st.summaryNum, { color: t.accent.purple }]}>{impact.totalCOTK}</Text>
                  <Text style={st.summaryLabel}>cOTK Earned</Text>
                </View>
              </View>

              <View style={st.card}>
                <Text style={{ color: t.text.primary, fontSize: 14, fontWeight: '700', marginBottom: 12 }}>Help by Category</Text>
                {RESOURCE_CATEGORIES.map(cat => {
                  const count = impact.categories[cat.key] ?? 0;
                  const maxCount = Math.max(...Object.values(impact.categories));
                  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  return (
                    <View key={cat.key} style={{ marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                        <Text style={{ color: t.text.secondary, fontSize: 12 }}>{cat.icon} {cat.label}</Text>
                        <Text style={{ color: t.text.primary, fontSize: 12, fontWeight: '700' }}>{count} people</Text>
                      </View>
                      <View style={st.barContainer}>
                        <View style={[st.barFill, { width: `${pct}%`, backgroundColor: t.accent.green }]} />
                      </View>
                    </View>
                  );
                })}
              </View>

              <View style={st.card}>
                <Text style={{ color: t.text.primary, fontSize: 14, fontWeight: '700', marginBottom: 12 }}>Monthly Growth</Text>
                {impact.monthlyHelped.map(m => (
                  <View key={m.month} style={{ marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                      <Text style={{ color: t.text.muted, fontSize: 11 }}>{m.month}</Text>
                      <Text style={{ color: t.accent.green, fontSize: 11, fontWeight: '700' }}>{m.count} helped</Text>
                    </View>
                    <View style={st.barContainer}>
                      <View style={[st.barFill, { width: `${(m.count / 15) * 100}%`, backgroundColor: t.accent.purple }]} />
                    </View>
                  </View>
                ))}
              </View>

              <View style={[st.card, { backgroundColor: t.accent.green + '10', borderWidth: 1, borderColor: t.accent.green + '30' }]}>
                <Text style={{ color: t.accent.green, fontSize: 14, fontWeight: '700', marginBottom: 4 }}>
                  You've helped {impact.peopleHelped} people meet {impact.needsMet} needs
                </Text>
                <Text style={{ color: t.text.muted, fontSize: 12, lineHeight: 18 }}>
                  Every need met makes a community more resilient. Your {impact.totalCOTK} cOTK reflects the community value you've created — not as payment, but as recognition.
                </Text>
              </View>
            </>
          )
        )}

        {!demoMode && (
          <View style={[st.card, { marginTop: 20 }]}>
            <Text style={{ color: t.text.muted, fontSize: 13, textAlign: 'center' }}>
              Enable Demo Mode in Settings to see sample resource matching data.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
