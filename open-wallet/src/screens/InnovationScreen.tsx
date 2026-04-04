import { fonts } from '../utils/theme';
/**
 * Innovation Screen — Community innovation hub and startup incubator.
 *
 * Article I: "Every human innovation belongs to humanity."
 * xOTK represents innovation value — ideas that uplift communities.
 *
 * Features:
 * - Idea board — pitch ideas, get community feedback and support
 * - Innovation challenges — solve community problems (posted by DAOs/governance)
 * - Incubator program — mentorship, micro-grants, milestones for promising ideas
 * - Patent-free zone — all innovations are open-source for humanity
 * - Success stories — ideas that became community projects
 * - Demo: 4 ideas, 2 challenges, 1 incubator program
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface Idea {
  id: string;
  title: string;
  description: string;
  author: string;
  category: string;
  upvotes: number;
  comments: number;
  xotkPledged: number;
  status: 'open' | 'funded' | 'incubating' | 'launched';
  date: string;
  tags: string[];
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  postedBy: string;
  xotkReward: number;
  deadline: string;
  submissions: number;
  status: 'active' | 'judging' | 'completed';
  category: string;
}

interface IncubatorProgram {
  id: string;
  ideaTitle: string;
  founder: string;
  mentor: string;
  grantAmount: number;
  milestones: Array<{ label: string; completed: boolean }>;
  progress: number;
  startDate: string;
}

interface SuccessStory {
  id: string;
  title: string;
  founder: string;
  description: string;
  impactStat: string;
  xotkGenerated: number;
  launchDate: string;
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_IDEAS: Idea[] = [
  { id: 'i1', title: 'Solar-Powered Community Wi-Fi Mesh', description: 'Deploy solar-powered mesh network nodes across underserved neighborhoods. Each node costs ~$50 in parts and can be assembled by volunteers. Provides free internet access within 200m radius.', author: 'Priya M.', category: 'infrastructure', upvotes: 142, comments: 23, xotkPledged: 4200, status: 'funded', date: '2026-03-15', tags: ['solar', 'connectivity', 'open-hardware'] },
  { id: 'i2', title: 'Open-Source Seed Library App', description: 'A mobile app for community seed libraries — track seed inventory, swaps, growing guides, and harvest data. All data shared freely. Helps communities achieve food sovereignty.', author: 'Carlos R.', category: 'food', upvotes: 89, comments: 14, xotkPledged: 1800, status: 'open', date: '2026-03-20', tags: ['agriculture', 'food-security', 'app'] },
  { id: 'i3', title: 'Repair Cafe Booking Platform', description: 'Platform to organize community repair cafes — volunteers with fix-it skills meet people with broken items. Reduces waste, builds skills, strengthens community bonds.', author: 'Aisha K.', category: 'sustainability', upvotes: 67, comments: 8, xotkPledged: 950, status: 'open', date: '2026-03-22', tags: ['repair', 'sustainability', 'skills'] },
  { id: 'i4', title: 'Elder Wisdom Archive', description: 'Record and preserve stories, skills, and life lessons from community elders. Searchable video archive with transcripts. Intergenerational knowledge transfer that honors our elders.', author: 'Tomoko H.', category: 'culture', upvotes: 203, comments: 31, xotkPledged: 5500, status: 'incubating', date: '2026-03-10', tags: ['elders', 'wisdom', 'preservation'] },
];

const DEMO_CHALLENGES: Challenge[] = [
  { id: 'c1', title: 'Clean Water Access for Rural Communities', description: 'Design a low-cost (<$100) water purification system that can be built from locally available materials. Must purify 50L/day minimum. Submit working prototype designs.', postedBy: 'Water for All DAO', xotkReward: 10000, deadline: '2026-05-01', submissions: 12, status: 'active', category: 'infrastructure' },
  { id: 'c2', title: 'Zero-Waste School Lunch Program', description: 'Create a replicable model for school lunch programs that produce zero landfill waste. Must include sourcing, preparation, serving, and composting plans.', postedBy: 'Education DAO', xotkReward: 5000, deadline: '2026-04-15', submissions: 7, status: 'active', category: 'food' },
];

const DEMO_INCUBATOR: IncubatorProgram[] = [
  { id: 'inc1', ideaTitle: 'Solar-Powered Community Wi-Fi Mesh', founder: 'Priya M.', mentor: 'Dr. James Chen (Network Engineer)', grantAmount: 4200, milestones: [{ label: 'Prototype single node', completed: true }, { label: 'Test with 3 households', completed: true }, { label: 'Deploy 10-node mesh in pilot neighborhood', completed: false }, { label: 'Open-source hardware schematics published', completed: false }, { label: 'Community maintenance training complete', completed: false }], progress: 40, startDate: '2026-02-01' },
];

const DEMO_SUCCESS: SuccessStory[] = [
  { id: 's1', title: 'Community Tool Library', founder: 'Marcus W.', description: 'Started as an idea on this board 8 months ago. Now a thriving tool library with 500+ items shared among 200 families. Saved the community an estimated $45,000 in tool purchases.', impactStat: '500 tools shared, 200 families served', xotkGenerated: 12000, launchDate: '2025-08-15' },
  { id: 's2', title: 'Neighborhood Composting Collective', founder: 'Lin Z.', description: 'A shared composting system across 3 blocks. Diverts 2 tons of food waste monthly from landfill. Produces compost for community gardens. All processes documented and open-source.', impactStat: '24 tons diverted/year, 15 gardens fed', xotkGenerated: 8500, launchDate: '2025-11-01' },
];

type Tab = 'ideas' | 'challenges' | 'incubator' | 'success';

export function InnovationScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('ideas');
  const [ideas, setIdeas] = useState(DEMO_IDEAS);

  // New idea form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);

  // Pledge form
  const [pledgeId, setPledgeId] = useState<string | null>(null);
  const [pledgeAmount, setPledgeAmount] = useState('');

  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const handleUpvote = useCallback((id: string) => {
    setIdeas((prev) =>
      prev.map((idea) =>
        idea.id === id ? { ...idea, upvotes: idea.upvotes + 1 } : idea,
      ),
    );
  }, []);

  const handlePledge = useCallback((id: string) => {
    const amt = parseInt(pledgeAmount, 10);
    if (!amt || amt <= 0) { Alert.alert('Invalid', 'Enter a valid xOTK amount.'); return; }
    setIdeas((prev) =>
      prev.map((idea) =>
        idea.id === id ? { ...idea, xotkPledged: idea.xotkPledged + amt } : idea,
      ),
    );
    Alert.alert('Pledged!', `You pledged ${amt} xOTK to support this idea.`);
    setPledgeId(null);
    setPledgeAmount('');
  }, [pledgeAmount]);

  const handleSubmitIdea = useCallback(() => {
    if (!newTitle.trim()) { Alert.alert('Required', 'Enter an idea title.'); return; }
    if (!newDesc.trim()) { Alert.alert('Required', 'Describe your idea.'); return; }
    Alert.alert(
      'Idea Submitted!',
      'Your idea has been posted to the community board. All innovations here are patent-free and open-source for humanity.',
    );
    setNewTitle('');
    setNewDesc('');
    setShowNewForm(false);
  }, [newTitle, newDesc]);

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
    // Idea cards
    ideaCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    ideaTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    ideaDesc: { color: t.text.muted, fontSize: 13, lineHeight: 19, marginTop: 6 },
    ideaMeta: { color: t.text.muted, fontSize: 12, marginTop: 8 },
    ideaFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    ideaStats: { flexDirection: 'row', gap: 12 },
    statBox: { alignItems: 'center' as const },
    statNum: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    statLabel: { color: t.text.muted, fontSize: 10, marginTop: 2 },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    tag: { backgroundColor: t.accent.blue + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    tagText: { color: t.accent.blue, fontSize: 10, fontWeight: fonts.semibold },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 11, fontWeight: fonts.bold },
    upvoteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: t.accent.green + '40' },
    upvoteText: { color: t.accent.green, fontSize: 13, fontWeight: fonts.semibold },
    pledgeBtn: { backgroundColor: t.accent.purple + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    pledgeText: { color: t.accent.purple, fontSize: 12, fontWeight: fonts.semibold },
    xotkAmount: { color: t.accent.green, fontSize: 14, fontWeight: fonts.bold },
    // Challenge cards
    challengeCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    challengeReward: { color: t.accent.green, fontSize: 16, fontWeight: fonts.heavy },
    challengeDeadline: { color: t.accent.orange, fontSize: 12, fontWeight: fonts.semibold },
    submitChallengeBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, marginTop: 12, alignSelf: 'flex-start' as const },
    submitChallengeText: { color: '#fff', fontSize: 13, fontWeight: fonts.semibold },
    // Incubator
    milestoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    milestoneCheck: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center' as const, justifyContent: 'center' as const },
    milestoneLabel: { color: t.text.primary, fontSize: 13, flex: 1 },
    progressBar: { height: 8, borderRadius: 4, backgroundColor: t.bg.primary, marginTop: 12, marginBottom: 8 },
    progressFill: { height: 8, borderRadius: 4, backgroundColor: t.accent.green },
    // Success stories
    successCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    successTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold },
    successDesc: { color: t.text.muted, fontSize: 13, lineHeight: 19, marginTop: 8 },
    successImpact: { color: t.accent.green, fontSize: 13, fontWeight: fonts.semibold, marginTop: 8 },
    // Form
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    submitBtn: { backgroundColor: t.accent.purple, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    newIdeaBtn: { backgroundColor: t.accent.purple, borderRadius: 14, paddingVertical: 12, alignItems: 'center', marginHorizontal: 20, marginBottom: 16 },
    newIdeaBtnText: { color: '#fff', fontSize: 14, fontWeight: fonts.bold },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },
    patentFree: { backgroundColor: t.accent.green + '15', borderRadius: 12, padding: 14, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' as const },
    patentFreeText: { color: t.accent.green, fontSize: 12, fontWeight: fonts.bold, textAlign: 'center' },
    pledgeInput: { backgroundColor: t.bg.primary, borderRadius: 10, padding: 10, color: t.text.primary, fontSize: 14, marginTop: 8, flex: 1 },
    pledgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    pledgeConfirmBtn: { backgroundColor: t.accent.purple, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, marginTop: 8 },
    pledgeConfirmText: { color: '#fff', fontSize: 13, fontWeight: fonts.semibold },
  }), [t]);

  const statusColor = (status: string) => {
    switch (status) {
      case 'funded': return t.accent.green;
      case 'incubating': return t.accent.blue;
      case 'launched': return t.accent.purple;
      case 'active': return t.accent.green;
      case 'judging': return t.accent.orange;
      case 'completed': return t.accent.purple;
      default: return t.text.muted;
    }
  };

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'ideas', label: 'Ideas' },
    { key: 'challenges', label: 'Challenges' },
    { key: 'incubator', label: 'Incubator' },
    { key: 'success', label: 'Success' },
  ];

  // ─── Ideas Tab ───

  const renderIdeas = () => (
    <>
      <View style={s.patentFree}>
        <Text style={s.patentFreeText}>
          Patent-Free Zone — All innovations here are open-source for humanity
        </Text>
      </View>

      {!showNewForm ? (
        <TouchableOpacity style={s.newIdeaBtn} onPress={() => setShowNewForm(true)}>
          <Text style={s.newIdeaBtnText}>+ Pitch a New Idea</Text>
        </TouchableOpacity>
      ) : (
        <View style={s.card}>
          <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Pitch Your Idea</Text>
          <TextInput
            style={s.input}
            placeholder="Idea title"
            placeholderTextColor={t.text.muted}
            value={newTitle}
            onChangeText={setNewTitle}
          />
          <TextInput
            style={s.input}
            placeholder="Describe your idea — how does it help the community?"
            placeholderTextColor={t.text.muted}
            value={newDesc}
            onChangeText={setNewDesc}
            multiline
          />
          <TouchableOpacity style={s.submitBtn} onPress={handleSubmitIdea}>
            <Text style={s.submitText}>Submit Idea (Open-Source)</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowNewForm(false)} style={{ marginTop: 10, alignItems: 'center' }}>
            <Text style={{ color: t.text.muted, fontSize: 13 }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={s.sectionTitle}>Community Ideas</Text>
      {ideas.map((idea) => (
        <View key={idea.id} style={s.ideaCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text style={[s.ideaTitle, { flex: 1 }]}>{idea.title}</Text>
            <View style={[s.statusBadge, { backgroundColor: statusColor(idea.status) + '20' }]}>
              <Text style={[s.statusText, { color: statusColor(idea.status) }]}>
                {idea.status.charAt(0).toUpperCase() + idea.status.slice(1)}
              </Text>
            </View>
          </View>
          <Text style={s.ideaDesc}>{idea.description}</Text>
          <Text style={s.ideaMeta}>By {idea.author} | {idea.date}</Text>

          <View style={s.tagRow}>
            {idea.tags.map((tag) => (
              <View key={tag} style={s.tag}>
                <Text style={s.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          <View style={s.ideaFooter}>
            <View style={s.ideaStats}>
              <View style={s.statBox}>
                <Text style={s.statNum}>{idea.upvotes}</Text>
                <Text style={s.statLabel}>upvotes</Text>
              </View>
              <View style={s.statBox}>
                <Text style={s.statNum}>{idea.comments}</Text>
                <Text style={s.statLabel}>comments</Text>
              </View>
              <View style={s.statBox}>
                <Text style={s.xotkAmount}>{idea.xotkPledged}</Text>
                <Text style={s.statLabel}>xOTK pledged</Text>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <TouchableOpacity style={s.upvoteBtn} onPress={() => handleUpvote(idea.id)}>
              <Text style={s.upvoteText}>Upvote</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.pledgeBtn} onPress={() => setPledgeId(pledgeId === idea.id ? null : idea.id)}>
              <Text style={s.pledgeText}>Pledge xOTK</Text>
            </TouchableOpacity>
          </View>

          {pledgeId === idea.id && (
            <View style={s.pledgeRow}>
              <TextInput
                style={s.pledgeInput}
                placeholder="xOTK amount"
                placeholderTextColor={t.text.muted}
                keyboardType="numeric"
                value={pledgeAmount}
                onChangeText={setPledgeAmount}
              />
              <TouchableOpacity style={s.pledgeConfirmBtn} onPress={() => handlePledge(idea.id)}>
                <Text style={s.pledgeConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}
    </>
  );

  // ─── Challenges Tab ───

  const renderChallenges = () => (
    <>
      <Text style={s.sectionTitle}>Innovation Challenges</Text>
      <View style={[s.card, { marginBottom: 12 }]}>
        <Text style={{ color: t.text.muted, fontSize: 13, lineHeight: 19 }}>
          Solve real community problems posted by DAOs and governance bodies.
          Winners receive xOTK grants — all solutions remain open-source.
        </Text>
      </View>

      {DEMO_CHALLENGES.map((ch) => (
        <View key={ch.id} style={s.challengeCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text style={[s.ideaTitle, { flex: 1 }]}>{ch.title}</Text>
            <View style={[s.statusBadge, { backgroundColor: statusColor(ch.status) + '20' }]}>
              <Text style={[s.statusText, { color: statusColor(ch.status) }]}>
                {ch.status.charAt(0).toUpperCase() + ch.status.slice(1)}
              </Text>
            </View>
          </View>
          <Text style={s.ideaDesc}>{ch.description}</Text>
          <Text style={s.ideaMeta}>Posted by: {ch.postedBy}</Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <View>
              <Text style={s.challengeReward}>{ch.xotkReward.toLocaleString()} xOTK</Text>
              <Text style={{ color: t.text.muted, fontSize: 11 }}>reward pool</Text>
            </View>
            <View style={{ alignItems: 'flex-end' as const }}>
              <Text style={s.challengeDeadline}>Deadline: {ch.deadline}</Text>
              <Text style={{ color: t.text.muted, fontSize: 11, marginTop: 2 }}>
                {ch.submissions} submissions
              </Text>
            </View>
          </View>

          {ch.status === 'active' && (
            <TouchableOpacity
              style={s.submitChallengeBtn}
              onPress={() => Alert.alert('Submit Solution', 'In a full build, you would upload your solution here. All submissions are open-source.')}
            >
              <Text style={s.submitChallengeText}>Submit Solution</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </>
  );

  // ─── Incubator Tab ───

  const renderIncubator = () => (
    <>
      <Text style={s.sectionTitle}>Incubator Programs</Text>
      <View style={[s.card, { marginBottom: 12 }]}>
        <Text style={{ color: t.text.muted, fontSize: 13, lineHeight: 19 }}>
          Promising ideas receive mentorship, micro-grants, and milestone tracking.
          Mentors volunteer their expertise. Grants come from community xOTK pledges.
        </Text>
      </View>

      {DEMO_INCUBATOR.map((prog) => (
        <View key={prog.id} style={s.card}>
          <Text style={s.ideaTitle}>{prog.ideaTitle}</Text>
          <Text style={s.ideaMeta}>Founder: {prog.founder}</Text>
          <Text style={s.ideaMeta}>Mentor: {prog.mentor}</Text>
          <Text style={s.ideaMeta}>Grant: {prog.grantAmount.toLocaleString()} xOTK | Started: {prog.startDate}</Text>

          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${prog.progress}%` }]} />
          </View>
          <Text style={{ color: t.text.muted, fontSize: 11, marginBottom: 12 }}>
            {prog.progress}% complete
          </Text>

          <Text style={{ color: t.text.primary, fontSize: 13, fontWeight: fonts.semibold, marginBottom: 8 }}>Milestones</Text>
          {prog.milestones.map((ms, idx) => (
            <View key={idx} style={s.milestoneRow}>
              <View style={[s.milestoneCheck, { borderColor: ms.completed ? t.accent.green : t.text.muted, backgroundColor: ms.completed ? t.accent.green : 'transparent' }]}>
                {ms.completed && <Text style={{ color: '#fff', fontSize: 12, fontWeight: fonts.bold }}>{'✓'}</Text>}
              </View>
              <Text style={[s.milestoneLabel, ms.completed && { color: t.text.muted }]}>
                {ms.label}
              </Text>
            </View>
          ))}
        </View>
      ))}

      <View style={[s.card, { alignItems: 'center' }]}>
        <Text style={{ color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold }}>Want to incubate your idea?</Text>
        <Text style={{ color: t.text.muted, fontSize: 12, marginTop: 4, textAlign: 'center' }}>
          Post it on the Ideas tab, gather community support, and apply when your idea reaches 100+ upvotes.
        </Text>
      </View>
    </>
  );

  // ─── Success Stories Tab ───

  const renderSuccess = () => (
    <>
      <Text style={s.sectionTitle}>Success Stories</Text>
      <View style={[s.card, { marginBottom: 12 }]}>
        <Text style={{ color: t.text.muted, fontSize: 13, lineHeight: 19 }}>
          Ideas that started right here and became real community projects.
          Every success is open-source — anyone can replicate these in their own community.
        </Text>
      </View>

      {DEMO_SUCCESS.map((story) => (
        <View key={story.id} style={s.successCard}>
          <Text style={s.successTitle}>{story.title}</Text>
          <Text style={s.ideaMeta}>Founded by {story.founder} | Launched {story.launchDate}</Text>
          <Text style={s.successDesc}>{story.description}</Text>
          <Text style={s.successImpact}>{story.impactStat}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={s.xotkAmount}>{story.xotkGenerated.toLocaleString()} xOTK generated</Text>
          </View>
        </View>
      ))}

      <View style={[s.card, { alignItems: 'center' }]}>
        <Text style={{ color: t.text.primary, fontSize: 22, fontWeight: fonts.heavy }}>
          {DEMO_SUCCESS.reduce((sum, s) => sum + s.xotkGenerated, 0).toLocaleString()}
        </Text>
        <Text style={{ color: t.text.muted, fontSize: 12, marginTop: 4 }}>
          Total xOTK generated by community innovations
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
        <Text style={s.title}>Innovation Hub</Text>
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
        {tab === 'ideas' && renderIdeas()}
        {tab === 'challenges' && renderChallenges()}
        {tab === 'incubator' && renderIncubator()}
        {tab === 'success' && renderSuccess()}
      </ScrollView>
    </SafeAreaView>
  );
}
