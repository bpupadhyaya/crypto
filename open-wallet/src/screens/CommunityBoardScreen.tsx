import { fonts } from '../utils/theme';
/**
 * Community Board Screen — Bulletin board for community needs.
 *
 * Article I: "Every community volunteer's effort deserves recognition."
 * Article III: cOTK represents community value.
 *
 * Features:
 * - Post volunteer opportunities (need, location, date/time, hours, cOTK reward)
 * - Browse opportunities by category
 * - Sign up for opportunities
 * - Track participation
 * - "Thank a volunteer" — send gratitude cOTK
 * - Demo mode with sample opportunities
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface Opportunity {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  date: string;
  hoursNeeded: number;
  cotkReward: number;
  spotsTotal: number;
  spotsLeft: number;
  postedBy: string;
  signedUp: boolean;
  completed: boolean;
}

interface Participation {
  opportunityId: string;
  title: string;
  date: string;
  hours: number;
  status: 'upcoming' | 'completed' | 'verified';
  cotkEarned: number;
}

interface GratitudeEntry {
  id: string;
  fromName: string;
  toName: string;
  message: string;
  cotkAmount: number;
  date: string;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'cleanup', label: 'Cleanup' },
  { key: 'tutoring', label: 'Tutoring' },
  { key: 'eldercare', label: 'Elder Care' },
  { key: 'food_bank', label: 'Food Bank' },
  { key: 'coaching', label: 'Coaching' },
  { key: 'mentoring', label: 'Mentoring' },
  { key: 'other', label: 'Other' },
];

// ─── Demo Data ───

const DEMO_OPPORTUNITIES: Opportunity[] = [
  { id: 'o1', title: 'Community Garden Spring Planting', description: 'Help plant vegetables and herbs in the community garden. All skill levels welcome. Tools and gloves provided.', category: 'cleanup', location: 'Riverside Community Garden', date: '2026-04-02', hoursNeeded: 4, cotkReward: 400, spotsTotal: 20, spotsLeft: 8, postedBy: 'Green Earth Foundation', signedUp: false, completed: false },
  { id: 'o2', title: 'After-School Math Tutoring', description: 'Tutor 3rd-5th graders in basic math. Must be comfortable with fractions and word problems.', category: 'tutoring', location: 'Lincoln Elementary School', date: '2026-04-03', hoursNeeded: 2, cotkReward: 200, spotsTotal: 10, spotsLeft: 5, postedBy: 'School District 12', signedUp: true, completed: false },
  { id: 'o3', title: 'Senior Center Companion Visit', description: 'Visit elderly residents for conversation, card games, and companionship. Many residents have no family nearby.', category: 'eldercare', location: 'Sunshine Senior Center', date: '2026-04-05', hoursNeeded: 3, cotkReward: 300, spotsTotal: 15, spotsLeft: 12, postedBy: 'Sunshine Senior Center', signedUp: false, completed: false },
  { id: 'o4', title: 'Weekend Food Distribution', description: 'Sort and distribute food packages to families in need. Lifting required (up to 30 lbs).', category: 'food_bank', location: 'Downtown Community Center', date: '2026-04-06', hoursNeeded: 5, cotkReward: 500, spotsTotal: 25, spotsLeft: 20, postedBy: 'City Food Bank', signedUp: false, completed: false },
  { id: 'o5', title: 'Youth Coding Workshop', description: 'Teach basic Python to teens aged 13-17. Bring your own laptop if possible.', category: 'mentoring', location: 'Public Library - Main Branch', date: '2026-04-08', hoursNeeded: 3, cotkReward: 300, spotsTotal: 8, spotsLeft: 3, postedBy: 'Youth Futures Alliance', signedUp: false, completed: false },
  { id: 'o6', title: 'Basketball Coaching (Ages 8-12)', description: 'Coach a youth basketball session. Focus on fundamentals and teamwork.', category: 'coaching', location: 'Parks & Rec Center', date: '2026-04-10', hoursNeeded: 2, cotkReward: 200, spotsTotal: 4, spotsLeft: 2, postedBy: 'Parks & Recreation', signedUp: false, completed: false },
  { id: 'o7', title: 'River Cleanup Day', description: 'Annual river bank cleanup. We provide bags, grabbers, and refreshments. Great for families!', category: 'cleanup', location: 'Oak River Trail - Mile 3', date: '2026-04-12', hoursNeeded: 4, cotkReward: 400, spotsTotal: 50, spotsLeft: 35, postedBy: 'Green Earth Foundation', signedUp: false, completed: false },
  { id: 'o8', title: 'ESL Conversation Partner', description: 'Practice conversational English with adult immigrants. No teaching experience needed, just patience.', category: 'tutoring', location: 'Community Center Room 204', date: '2026-04-14', hoursNeeded: 2, cotkReward: 200, spotsTotal: 12, spotsLeft: 7, postedBy: 'Newcomer Services', signedUp: false, completed: false },
];

const DEMO_PARTICIPATIONS: Participation[] = [
  { opportunityId: 'o2', title: 'After-School Math Tutoring', date: '2026-04-03', hours: 2, status: 'upcoming', cotkEarned: 0 },
  { opportunityId: 'p1', title: 'Park Bench Painting', date: '2026-03-20', hours: 3, status: 'verified', cotkEarned: 300 },
  { opportunityId: 'p2', title: 'Senior Bingo Night', date: '2026-03-15', hours: 2, status: 'verified', cotkEarned: 200 },
  { opportunityId: 'p3', title: 'Food Drive Weekend', date: '2026-03-10', hours: 5, status: 'completed', cotkEarned: 0 },
];

const DEMO_GRATITUDES: GratitudeEntry[] = [
  { id: 'g1', fromName: 'Maria G.', toName: 'You', message: 'Thank you for tutoring my daughter! She passed her math test!', cotkAmount: 50, date: '2026-03-26' },
  { id: 'g2', fromName: 'Senior Center', toName: 'You', message: 'The residents loved your visit. Please come again!', cotkAmount: 30, date: '2026-03-16' },
  { id: 'g3', fromName: 'You', toName: 'Coach Raj', message: 'Great basketball session for the kids!', cotkAmount: 25, date: '2026-03-12' },
];

type Tab = 'browse' | 'post' | 'my-signups' | 'gratitude';

export function CommunityBoardScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('browse');
  const [filterCategory, setFilterCategory] = useState('all');
  const [opportunities, setOpportunities] = useState(DEMO_OPPORTUNITIES);

  // Post form state
  const [postTitle, setPostTitle] = useState('');
  const [postDesc, setPostDesc] = useState('');
  const [postCategory, setPostCategory] = useState('');
  const [postLocation, setPostLocation] = useState('');
  const [postDate, setPostDate] = useState('');
  const [postHours, setPostHours] = useState('');
  const [postReward, setPostReward] = useState('');
  const [postSpots, setPostSpots] = useState('');

  // Gratitude
  const [gratVolunteer, setGratVolunteer] = useState('');
  const [gratMessage, setGratMessage] = useState('');
  const [gratAmount, setGratAmount] = useState('');

  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const filtered = useMemo(() => {
    if (filterCategory === 'all') return opportunities;
    return opportunities.filter((o) => o.category === filterCategory);
  }, [opportunities, filterCategory]);

  const handleSignUp = useCallback((id: string) => {
    setOpportunities((prev) =>
      prev.map((o) =>
        o.id === id && o.spotsLeft > 0
          ? { ...o, signedUp: true, spotsLeft: o.spotsLeft - 1 }
          : o,
      ),
    );
    const opp = opportunities.find((o) => o.id === id);
    if (opp) {
      Alert.alert('Signed Up!', `You signed up for "${opp.title}" on ${opp.date}.`);
    }
  }, [opportunities]);

  const handlePost = useCallback(() => {
    if (!postTitle.trim()) { Alert.alert('Required', 'Enter a title.'); return; }
    if (!postCategory) { Alert.alert('Required', 'Select a category.'); return; }
    if (!postLocation.trim()) { Alert.alert('Required', 'Enter a location.'); return; }
    if (!postDate.trim()) { Alert.alert('Required', 'Enter a date.'); return; }
    const hours = parseInt(postHours, 10);
    if (!hours || hours <= 0) { Alert.alert('Required', 'Enter valid hours.'); return; }

    Alert.alert('Opportunity Posted', `"${postTitle}" has been posted to the community board.`);
    setPostTitle('');
    setPostDesc('');
    setPostCategory('');
    setPostLocation('');
    setPostDate('');
    setPostHours('');
    setPostReward('');
    setPostSpots('');
    setTab('browse');
  }, [postTitle, postCategory, postLocation, postDate, postHours]);

  const handleSendGratitude = useCallback(() => {
    if (!gratVolunteer.trim()) { Alert.alert('Required', 'Enter volunteer UID or name.'); return; }
    if (!gratMessage.trim()) { Alert.alert('Required', 'Enter a message.'); return; }
    const amt = parseInt(gratAmount, 10) || 10;

    Alert.alert(
      'Gratitude Sent!',
      `You sent ${amt} cOTK to ${gratVolunteer} with your thanks.`,
    );
    setGratVolunteer('');
    setGratMessage('');
    setGratAmount('');
  }, [gratVolunteer, gratMessage, gratAmount]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.purple + '20' },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.purple },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    filterRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 6, marginBottom: 12 },
    filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: t.bg.secondary },
    filterActive: { backgroundColor: t.accent.purple + '20', borderColor: t.accent.purple },
    filterText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    filterTextActive: { color: t.accent.purple },
    oppCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    oppTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    oppDesc: { color: t.text.muted, fontSize: 13, lineHeight: 19, marginTop: 6 },
    oppMeta: { color: t.text.muted, fontSize: 12, marginTop: 8 },
    oppFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    oppReward: { color: t.accent.green, fontSize: 14, fontWeight: fonts.bold },
    oppSpots: { color: t.text.muted, fontSize: 12 },
    signupBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    signupBtnDisabled: { backgroundColor: t.bg.primary },
    signupText: { color: '#fff', fontSize: 13, fontWeight: fonts.semibold },
    signedUpBadge: { backgroundColor: t.accent.green + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    signedUpText: { color: t.accent.green, fontSize: 12, fontWeight: fonts.semibold },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: t.bg.primary },
    typeChipSelected: { backgroundColor: t.accent.purple + '20', borderColor: t.accent.purple },
    typeChipText: { color: t.text.muted, fontSize: 13, fontWeight: fonts.semibold },
    typeChipTextSelected: { color: t.accent.purple },
    submitBtn: { backgroundColor: t.accent.purple, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    participationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    partTitle: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold, flex: 1 },
    partMeta: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    partStatus: { fontSize: 12, fontWeight: fonts.semibold },
    gratCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 14, marginHorizontal: 20, marginBottom: 10 },
    gratFrom: { color: t.accent.purple, fontSize: 13, fontWeight: fonts.bold },
    gratMessage: { color: t.text.primary, fontSize: 14, marginTop: 4, fontStyle: 'italic' },
    gratAmount: { color: t.accent.green, fontSize: 13, fontWeight: fonts.semibold, marginTop: 4 },
    gratDate: { color: t.text.muted, fontSize: 11, marginTop: 4 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },
    sendGratBtn: { backgroundColor: t.accent.green, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'browse', label: 'Browse' },
    { key: 'post', label: 'Post Need' },
    { key: 'my-signups', label: 'My Signups' },
    { key: 'gratitude', label: 'Thank' },
  ];

  // ─── Browse Tab ───

  const renderBrowse = () => (
    <>
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

      {filtered.length === 0 ? (
        <View style={s.card}>
          <Text style={{ color: t.text.muted, textAlign: 'center' }}>No opportunities in this category.</Text>
        </View>
      ) : (
        filtered.map((opp) => (
          <View key={opp.id} style={s.oppCard}>
            <Text style={s.oppTitle}>{opp.title}</Text>
            <Text style={s.oppDesc}>{opp.description}</Text>
            <Text style={s.oppMeta}>
              {opp.location} | {opp.date} | {opp.hoursNeeded}h
            </Text>
            <Text style={s.oppMeta}>Posted by: {opp.postedBy}</Text>
            <View style={s.oppFooter}>
              <View>
                <Text style={s.oppReward}>+{opp.cotkReward} cOTK</Text>
                <Text style={s.oppSpots}>{opp.spotsLeft}/{opp.spotsTotal} spots left</Text>
              </View>
              {opp.signedUp ? (
                <View style={s.signedUpBadge}>
                  <Text style={s.signedUpText}>Signed Up</Text>
                </View>
              ) : opp.spotsLeft > 0 ? (
                <TouchableOpacity style={s.signupBtn} onPress={() => handleSignUp(opp.id)}>
                  <Text style={s.signupText}>Sign Up</Text>
                </TouchableOpacity>
              ) : (
                <View style={s.signupBtnDisabled}>
                  <Text style={[s.signupText, { color: t.text.muted }]}>Full</Text>
                </View>
              )}
            </View>
          </View>
        ))
      )}
    </>
  );

  // ─── Post Tab ───

  const renderPost = () => (
    <View style={s.card}>
      <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Post a Volunteer Need</Text>

      <TextInput
        style={s.input}
        placeholder="Opportunity title"
        placeholderTextColor={t.text.muted}
        value={postTitle}
        onChangeText={setPostTitle}
      />

      <TextInput
        style={s.input}
        placeholder="Description"
        placeholderTextColor={t.text.muted}
        value={postDesc}
        onChangeText={setPostDesc}
        multiline
      />

      <Text style={[s.oppMeta, { marginBottom: 8 }]}>Category</Text>
      <View style={s.typeGrid}>
        {CATEGORIES.filter((c) => c.key !== 'all').map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[s.typeChip, postCategory === cat.key && s.typeChipSelected]}
            onPress={() => setPostCategory(cat.key)}
          >
            <Text style={[s.typeChipText, postCategory === cat.key && s.typeChipTextSelected]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={s.input}
        placeholder="Location"
        placeholderTextColor={t.text.muted}
        value={postLocation}
        onChangeText={setPostLocation}
      />

      <TextInput
        style={s.input}
        placeholder="Date (YYYY-MM-DD)"
        placeholderTextColor={t.text.muted}
        value={postDate}
        onChangeText={setPostDate}
      />

      <TextInput
        style={s.input}
        placeholder="Hours needed"
        placeholderTextColor={t.text.muted}
        keyboardType="numeric"
        value={postHours}
        onChangeText={setPostHours}
      />

      <TextInput
        style={s.input}
        placeholder="cOTK reward (optional)"
        placeholderTextColor={t.text.muted}
        keyboardType="numeric"
        value={postReward}
        onChangeText={setPostReward}
      />

      <TextInput
        style={s.input}
        placeholder="Number of spots"
        placeholderTextColor={t.text.muted}
        keyboardType="numeric"
        value={postSpots}
        onChangeText={setPostSpots}
      />

      <TouchableOpacity style={s.submitBtn} onPress={handlePost}>
        <Text style={s.submitText}>Post Opportunity</Text>
      </TouchableOpacity>
    </View>
  );

  // ─── My Signups Tab ───

  const statusColor = (status: string) => {
    switch (status) {
      case 'verified': return t.accent.green;
      case 'completed': return t.accent.orange;
      default: return t.accent.blue;
    }
  };

  const renderMySignups = () => (
    <>
      <Text style={s.sectionTitle}>My Participation</Text>
      <View style={s.card}>
        {DEMO_PARTICIPATIONS.map((p) => (
          <View key={p.opportunityId} style={s.participationRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.partTitle}>{p.title}</Text>
              <Text style={s.partMeta}>{p.date} | {p.hours}h</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[s.partStatus, { color: statusColor(p.status) }]}>
                {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
              </Text>
              {p.cotkEarned > 0 && (
                <Text style={{ color: t.accent.green, fontSize: 12, fontWeight: fonts.semibold, marginTop: 2 }}>
                  +{p.cotkEarned} cOTK
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>

      <View style={[s.card, { alignItems: 'center' }]}>
        <Text style={{ color: t.text.primary, fontSize: 15, fontWeight: fonts.semibold }}>
          Total Earned: {DEMO_PARTICIPATIONS.reduce((sum, p) => sum + p.cotkEarned, 0)} cOTK
        </Text>
        <Text style={{ color: t.text.muted, fontSize: 12, marginTop: 4 }}>
          {DEMO_PARTICIPATIONS.filter((p) => p.status === 'verified').length} verified | {DEMO_PARTICIPATIONS.filter((p) => p.status === 'upcoming').length} upcoming
        </Text>
      </View>
    </>
  );

  // ─── Gratitude Tab ───

  const renderGratitude = () => (
    <>
      <Text style={s.sectionTitle}>Thank a Volunteer</Text>
      <View style={s.card}>
        <TextInput
          style={s.input}
          placeholder="Volunteer UID or name"
          placeholderTextColor={t.text.muted}
          value={gratVolunteer}
          onChangeText={setGratVolunteer}
        />
        <TextInput
          style={s.input}
          placeholder="Your thank-you message"
          placeholderTextColor={t.text.muted}
          value={gratMessage}
          onChangeText={setGratMessage}
          multiline
        />
        <TextInput
          style={s.input}
          placeholder="cOTK amount (default: 10)"
          placeholderTextColor={t.text.muted}
          keyboardType="numeric"
          value={gratAmount}
          onChangeText={setGratAmount}
        />
        <TouchableOpacity style={s.sendGratBtn} onPress={handleSendGratitude}>
          <Text style={s.submitText}>Send Gratitude cOTK</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.sectionTitle}>Recent Gratitude</Text>
      {DEMO_GRATITUDES.map((g) => (
        <View key={g.id} style={s.gratCard}>
          <Text style={s.gratFrom}>
            {g.fromName} {'\u2192'} {g.toName}
          </Text>
          <Text style={s.gratMessage}>"{g.message}"</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
            <Text style={s.gratAmount}>+{g.cotkAmount} cOTK</Text>
            <Text style={s.gratDate}>{g.date}</Text>
          </View>
        </View>
      ))}
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Community Board</Text>
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
        {tab === 'post' && renderPost()}
        {tab === 'my-signups' && renderMySignups()}
        {tab === 'gratitude' && renderGratitude()}
      </ScrollView>
    </SafeAreaView>
  );
}
