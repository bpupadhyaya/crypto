import { fonts } from '../utils/theme';
/**
 * Crowdfund Screen — Community crowdfunding for projects.
 *
 * Article I: "Every human is born with infinite potential worth."
 * Article III: cOTK represents community value invested in shared goals.
 *
 * Features:
 * - Active campaigns (title, goal OTK, raised, backers, deadline, progress bar)
 * - Back a campaign (pledge OTK amount)
 * - Create campaign (title, description, goal, deadline, rewards/tiers)
 * - My campaigns (backed and created)
 * - Demo mode with 3 active campaigns, 1 user-backed
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface Campaign {
  id: string;
  title: string;
  description: string;
  goalOTK: number;
  raisedOTK: number;
  backers: number;
  deadline: string;
  creator: string;
  category: string;
  backed: boolean;
  userPledge: number;
  tiers: RewardTier[];
}

interface RewardTier {
  minPledge: number;
  reward: string;
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_CAMPAIGNS: Campaign[] = [
  {
    id: 'c1',
    title: 'Community Solar Panels',
    description: 'Install solar panels on the community center roof to provide free electricity for local events and reduce carbon footprint. Excess energy goes back to the grid as community credits.',
    goalOTK: 10000,
    raisedOTK: 6540,
    backers: 47,
    deadline: '2026-05-15',
    creator: 'Green Energy Collective',
    category: 'Infrastructure',
    backed: true,
    userPledge: 200,
    tiers: [
      { minPledge: 50, reward: 'Name on donor wall' },
      { minPledge: 200, reward: 'Free event space booking (1 day)' },
      { minPledge: 500, reward: 'Solar panel naming rights' },
    ],
  },
  {
    id: 'c2',
    title: 'Youth Coding Bootcamp',
    description: 'Fund a 12-week intensive coding bootcamp for 30 underserved teens. Covers laptops, curriculum, mentors, and meals. Graduates earn Open Chain Skill Certificates.',
    goalOTK: 5000,
    raisedOTK: 2100,
    backers: 23,
    deadline: '2026-06-01',
    creator: 'Future Coders Foundation',
    category: 'Education',
    backed: false,
    userPledge: 0,
    tiers: [
      { minPledge: 25, reward: 'Thank you postcard from a student' },
      { minPledge: 100, reward: 'Bootcamp demo day invite' },
      { minPledge: 300, reward: 'Mentor a student for a week' },
    ],
  },
  {
    id: 'c3',
    title: 'Neighborhood Food Forest',
    description: 'Transform the abandoned lot on 5th & Oak into a permaculture food forest. Fruit trees, berry bushes, and herb gardens — free food for the neighborhood, forever.',
    goalOTK: 8000,
    raisedOTK: 1200,
    backers: 14,
    deadline: '2026-07-20',
    creator: 'Urban Roots Collective',
    category: 'Environment',
    backed: false,
    userPledge: 0,
    tiers: [
      { minPledge: 30, reward: 'Plant a tree with your name' },
      { minPledge: 150, reward: 'Garden plot reservation (1 year)' },
      { minPledge: 400, reward: 'Harvest share for 2 seasons' },
    ],
  },
];

const CATEGORIES = ['All', 'Infrastructure', 'Education', 'Environment', 'Health', 'Arts'];

type Tab = 'campaigns' | 'create' | 'backed';

export function CrowdfundScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('campaigns');
  const [campaigns, setCampaigns] = useState(DEMO_CAMPAIGNS);
  const [filterCategory, setFilterCategory] = useState('All');
  const [pledgeAmounts, setPledgeAmounts] = useState<Record<string, string>>({});

  // Create form state
  const [createTitle, setCreateTitle] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createGoal, setCreateGoal] = useState('');
  const [createDeadline, setCreateDeadline] = useState('');
  const [createCategory, setCreateCategory] = useState('');
  const [createTier1Min, setCreateTier1Min] = useState('');
  const [createTier1Reward, setCreateTier1Reward] = useState('');
  const [createTier2Min, setCreateTier2Min] = useState('');
  const [createTier2Reward, setCreateTier2Reward] = useState('');

  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const filtered = useMemo(() => {
    if (filterCategory === 'All') return campaigns;
    return campaigns.filter((c) => c.category === filterCategory);
  }, [campaigns, filterCategory]);

  const backedCampaigns = useMemo(() => campaigns.filter((c) => c.backed), [campaigns]);

  const handlePledge = useCallback((id: string) => {
    const amount = parseInt(pledgeAmounts[id] || '0', 10);
    if (!amount || amount <= 0) {
      Alert.alert('Invalid Amount', 'Enter a valid OTK amount to pledge.');
      return;
    }
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, raisedOTK: c.raisedOTK + amount, backers: c.backed ? c.backers : c.backers + 1, backed: true, userPledge: c.userPledge + amount }
          : c,
      ),
    );
    setPledgeAmounts((prev) => ({ ...prev, [id]: '' }));
    const campaign = campaigns.find((c) => c.id === id);
    Alert.alert('Pledge Confirmed!', `You pledged ${amount} OTK to "${campaign?.title}".`);
  }, [campaigns, pledgeAmounts]);

  const handleCreate = useCallback(() => {
    if (!createTitle.trim()) { Alert.alert('Required', 'Enter a campaign title.'); return; }
    if (!createDesc.trim()) { Alert.alert('Required', 'Enter a description.'); return; }
    const goal = parseInt(createGoal, 10);
    if (!goal || goal <= 0) { Alert.alert('Required', 'Enter a valid goal amount.'); return; }
    if (!createDeadline.trim()) { Alert.alert('Required', 'Enter a deadline.'); return; }
    if (!createCategory) { Alert.alert('Required', 'Select a category.'); return; }

    Alert.alert('Campaign Created!', `"${createTitle}" is now live. Goal: ${goal} OTK.`);
    setCreateTitle('');
    setCreateDesc('');
    setCreateGoal('');
    setCreateDeadline('');
    setCreateCategory('');
    setCreateTier1Min('');
    setCreateTier1Reward('');
    setCreateTier2Min('');
    setCreateTier2Reward('');
    setTab('campaigns');
  }, [createTitle, createDesc, createGoal, createDeadline, createCategory]);

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
    campaignCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    campaignTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    campaignDesc: { color: t.text.muted, fontSize: 13, lineHeight: 19, marginTop: 6 },
    campaignMeta: { color: t.text.muted, fontSize: 12, marginTop: 8 },
    progressBarBg: { height: 8, backgroundColor: t.bg.primary, borderRadius: 4, marginTop: 10 },
    progressBarFill: { height: 8, borderRadius: 4, backgroundColor: t.accent.green },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    progressText: { color: t.text.muted, fontSize: 12 },
    raisedText: { color: t.accent.green, fontSize: 14, fontWeight: fonts.bold },
    goalText: { color: t.text.muted, fontSize: 12 },
    backersText: { color: t.accent.blue, fontSize: 12, fontWeight: fonts.semibold, marginTop: 4 },
    pledgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
    pledgeInput: { flex: 1, backgroundColor: t.bg.primary, borderRadius: 10, padding: 10, color: t.text.primary, fontSize: 14 },
    pledgeBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
    pledgeText: { color: '#fff', fontSize: 13, fontWeight: fonts.semibold },
    backedBadge: { backgroundColor: t.accent.green + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
    backedText: { color: t.accent.green, fontSize: 12, fontWeight: fonts.semibold },
    tierRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    tierMin: { color: t.accent.purple, fontSize: 12, fontWeight: fonts.semibold },
    tierReward: { color: t.text.muted, fontSize: 12, flex: 1, marginLeft: 10 },
    tiersLabel: { color: t.text.primary, fontSize: 13, fontWeight: fonts.bold, marginTop: 12, marginBottom: 6 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    inputMulti: { minHeight: 80, textAlignVertical: 'top' },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    categoryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: t.bg.primary },
    categoryChipSelected: { backgroundColor: t.accent.purple + '20', borderColor: t.accent.purple },
    categoryChipText: { color: t.text.muted, fontSize: 13, fontWeight: fonts.semibold },
    categoryChipTextSelected: { color: t.accent.purple },
    submitBtn: { backgroundColor: t.accent.purple, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    tierInputRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    tierMinInput: { width: 80, backgroundColor: t.bg.primary, borderRadius: 10, padding: 10, color: t.text.primary, fontSize: 13 },
    tierRewardInput: { flex: 1, backgroundColor: t.bg.primary, borderRadius: 10, padding: 10, color: t.text.primary, fontSize: 13 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', paddingVertical: 40 },
    myPledge: { color: t.accent.blue, fontSize: 12, fontWeight: fonts.semibold, marginTop: 4 },
    deadlineText: { color: t.accent.orange, fontSize: 12, fontWeight: fonts.semibold, marginTop: 4 },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'campaigns', label: 'Campaigns' },
    { key: 'create', label: 'Create' },
    { key: 'backed', label: 'My Backed' },
  ];

  // ─── Render Helpers ───

  const renderProgressBar = (raised: number, goal: number) => {
    const pct = Math.min((raised / goal) * 100, 100);
    return (
      <View>
        <View style={s.progressBarBg}>
          <View style={[s.progressBarFill, { width: `${pct}%` }]} />
        </View>
        <View style={s.progressRow}>
          <Text style={s.raisedText}>{raised.toLocaleString()} OTK</Text>
          <Text style={s.goalText}>of {goal.toLocaleString()} OTK ({Math.round(pct)}%)</Text>
        </View>
      </View>
    );
  };

  const renderCampaignCard = (c: Campaign) => (
    <View key={c.id} style={s.campaignCard}>
      <Text style={s.campaignTitle}>{c.title}</Text>
      <Text style={s.campaignMeta}>{c.category} — by {c.creator}</Text>
      <Text style={s.campaignDesc}>{c.description}</Text>
      {renderProgressBar(c.raisedOTK, c.goalOTK)}
      <Text style={s.backersText}>{c.backers} backers</Text>
      <Text style={s.deadlineText}>Deadline: {c.deadline}</Text>
      {c.backed && (
        <View style={s.backedBadge}>
          <Text style={s.backedText}>You pledged {c.userPledge} OTK</Text>
        </View>
      )}
      <Text style={s.tiersLabel}>Reward Tiers</Text>
      {c.tiers.map((tier, i) => (
        <View key={i} style={s.tierRow}>
          <Text style={s.tierMin}>{tier.minPledge}+ OTK</Text>
          <Text style={s.tierReward}>{tier.reward}</Text>
        </View>
      ))}
      <View style={s.pledgeRow}>
        <TextInput
          style={s.pledgeInput}
          placeholder="Pledge OTK"
          placeholderTextColor={t.text.muted}
          keyboardType="numeric"
          value={pledgeAmounts[c.id] || ''}
          onChangeText={(v) => setPledgeAmounts((prev) => ({ ...prev, [c.id]: v }))}
        />
        <TouchableOpacity style={s.pledgeBtn} onPress={() => handlePledge(c.id)}>
          <Text style={s.pledgeText}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCampaigns = () => (
    <>
      <View style={s.filterRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[s.filterChip, filterCategory === cat && s.filterActive]}
            onPress={() => setFilterCategory(cat)}
          >
            <Text style={[s.filterText, filterCategory === cat && s.filterTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={s.sectionTitle}>Active Campaigns ({filtered.length})</Text>
      {filtered.map(renderCampaignCard)}
    </>
  );

  const renderCreate = () => (
    <View style={s.card}>
      <Text style={s.sectionTitle}>Create a Campaign</Text>
      <TextInput style={s.input} placeholder="Campaign Title" placeholderTextColor={t.text.muted} value={createTitle} onChangeText={setCreateTitle} />
      <TextInput style={[s.input, s.inputMulti]} placeholder="Description — what are you raising funds for?" placeholderTextColor={t.text.muted} value={createDesc} onChangeText={setCreateDesc} multiline />
      <TextInput style={s.input} placeholder="Goal (OTK)" placeholderTextColor={t.text.muted} keyboardType="numeric" value={createGoal} onChangeText={setCreateGoal} />
      <TextInput style={s.input} placeholder="Deadline (YYYY-MM-DD)" placeholderTextColor={t.text.muted} value={createDeadline} onChangeText={setCreateDeadline} />
      <Text style={{ color: t.text.muted, fontSize: 13, marginBottom: 8 }}>Category</Text>
      <View style={s.categoryGrid}>
        {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[s.categoryChip, createCategory === cat && s.categoryChipSelected]}
            onPress={() => setCreateCategory(cat)}
          >
            <Text style={[s.categoryChipText, createCategory === cat && s.categoryChipTextSelected]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={{ color: t.text.muted, fontSize: 13, marginBottom: 8 }}>Reward Tiers (optional)</Text>
      <View style={s.tierInputRow}>
        <TextInput style={s.tierMinInput} placeholder="Min OTK" placeholderTextColor={t.text.muted} keyboardType="numeric" value={createTier1Min} onChangeText={setCreateTier1Min} />
        <TextInput style={s.tierRewardInput} placeholder="Reward description" placeholderTextColor={t.text.muted} value={createTier1Reward} onChangeText={setCreateTier1Reward} />
      </View>
      <View style={s.tierInputRow}>
        <TextInput style={s.tierMinInput} placeholder="Min OTK" placeholderTextColor={t.text.muted} keyboardType="numeric" value={createTier2Min} onChangeText={setCreateTier2Min} />
        <TextInput style={s.tierRewardInput} placeholder="Reward description" placeholderTextColor={t.text.muted} value={createTier2Reward} onChangeText={setCreateTier2Reward} />
      </View>
      <TouchableOpacity style={s.submitBtn} onPress={handleCreate}>
        <Text style={s.submitText}>Launch Campaign</Text>
      </TouchableOpacity>
    </View>
  );

  const renderBacked = () => (
    <>
      <Text style={s.sectionTitle}>Campaigns I Backed ({backedCampaigns.length})</Text>
      {backedCampaigns.length === 0 ? (
        <Text style={s.emptyText}>You haven't backed any campaigns yet.</Text>
      ) : (
        backedCampaigns.map(renderCampaignCard)
      )}
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Crowdfunding</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
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

      <ScrollView contentContainerStyle={s.scroll}>
        {tab === 'campaigns' && renderCampaigns()}
        {tab === 'create' && renderCreate()}
        {tab === 'backed' && renderBacked()}
      </ScrollView>
    </SafeAreaView>
  );
}
