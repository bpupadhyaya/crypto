import { fonts } from '../utils/theme';
/**
 * Cooperative Screen — Cooperative Economics for Article I (xOTK).
 *
 * Article I: Shared ownership structures empower communities.
 * xOTK is earned through cooperative participation, shared ownership, and equitable distribution.
 *
 * Features:
 * - Browse cooperatives (worker, consumer, housing, producer co-ops)
 * - Co-op detail: members, shared treasury, revenue distribution, governance rules
 * - Create a cooperative (name, type, description, revenue sharing model, membership rules)
 * - My cooperatives — dashboard of co-ops I belong to
 * - Dividend distribution — view and claim share of co-op revenue
 * - Co-op governance — vote on co-op decisions (one member one vote)
 * - Shared equipment/resource pool
 * - Demo: 3 co-ops (community farm, tech worker co-op, housing co-op)
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

type CoopType = 'worker' | 'consumer' | 'housing' | 'producer';
type RevenueModel = 'equal_split' | 'hours_based' | 'patronage' | 'hybrid';
type MemberRole = 'founder' | 'member' | 'board';
type ProposalStatus = 'active' | 'passed' | 'rejected';
type Tab = 'browse' | 'my-coops' | 'create';

interface CoopMember {
  uid: string;
  name: string;
  role: MemberRole;
  joinedDate: string;
  sharesOwned: number;
  xotkEarned: number;
  hoursContributed: number;
}

interface Dividend {
  id: string;
  period: string;
  totalRevenue: number;
  perMemberShare: number;
  distributedDate: string;
  claimed: boolean;
}

interface Proposal {
  id: string;
  title: string;
  description: string;
  proposedBy: string;
  status: ProposalStatus;
  votesFor: number;
  votesAgainst: number;
  totalEligible: number;
  deadline: string;
}

interface SharedResource {
  id: string;
  name: string;
  description: string;
  value: number;
  availableNow: boolean;
  checkedOutBy?: string;
}

interface GovernanceRules {
  votingThreshold: number;
  membershipFee: number;
  dividendFrequency: string;
  maxMembers: number;
  decisionMethod: string;
}

interface Cooperative {
  id: string;
  name: string;
  type: CoopType;
  description: string;
  revenueModel: RevenueModel;
  members: CoopMember[];
  treasury: number;
  totalRevenue: number;
  dividends: Dividend[];
  proposals: Proposal[];
  sharedResources: SharedResource[];
  governance: GovernanceRules;
  foundedDate: string;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const COOP_TYPES: { key: CoopType; label: string; icon: string }[] = [
  { key: 'worker', label: 'Worker', icon: 'W' },
  { key: 'consumer', label: 'Consumer', icon: 'C' },
  { key: 'housing', label: 'Housing', icon: 'H' },
  { key: 'producer', label: 'Producer', icon: 'P' },
];

const REVENUE_MODELS: { key: RevenueModel; label: string; desc: string }[] = [
  { key: 'equal_split', label: 'Equal Split', desc: 'Revenue divided equally among all members' },
  { key: 'hours_based', label: 'Hours Based', desc: 'Revenue distributed proportional to hours contributed' },
  { key: 'patronage', label: 'Patronage', desc: 'Revenue distributed based on usage/patronage' },
  { key: 'hybrid', label: 'Hybrid', desc: 'Base share + bonus for hours and patronage' },
];

const TYPE_COLORS: Record<CoopType, string> = {
  worker: '#007AFF',
  consumer: '#34C759',
  housing: '#FF9500',
  producer: '#AF52DE',
};

const TYPE_LABELS: Record<CoopType, string> = {
  worker: 'Worker Co-op',
  consumer: 'Consumer Co-op',
  housing: 'Housing Co-op',
  producer: 'Producer Co-op',
};

const MODEL_LABELS: Record<RevenueModel, string> = {
  equal_split: 'Equal Split',
  hours_based: 'Hours Based',
  patronage: 'Patronage',
  hybrid: 'Hybrid',
};

const ROLE_COLORS: Record<MemberRole, string> = {
  founder: '#AF52DE',
  board: '#FF9500',
  member: '#007AFF',
};

const PROPOSAL_COLORS: Record<ProposalStatus, string> = {
  active: '#007AFF',
  passed: '#34C759',
  rejected: '#FF3B30',
};

// ─── Demo Data ───

const DEMO_COOPS: Cooperative[] = [
  {
    id: 'coop-1',
    name: 'Sunrise Community Farm',
    type: 'producer',
    description: 'A collectively-owned organic farm producing vegetables, herbs, and honey for the local community. Members share labor, equipment, and profits from weekly farmers market sales.',
    revenueModel: 'hours_based',
    foundedDate: '2025-06-15',
    treasury: 12400,
    totalRevenue: 48200,
    members: [
      { uid: 'oc1abc...farm_lead', name: 'Elena Vasquez', role: 'founder', joinedDate: '2025-06-15', sharesOwned: 1, xotkEarned: 6800, hoursContributed: 420 },
      { uid: 'oc1def...farmer2', name: 'Michael Obi', role: 'board', joinedDate: '2025-07-01', sharesOwned: 1, xotkEarned: 5200, hoursContributed: 340 },
      { uid: 'oc1ghi...farmer3', name: 'Kenji Nakamura', role: 'member', joinedDate: '2025-08-10', sharesOwned: 1, xotkEarned: 3600, hoursContributed: 220 },
      { uid: 'oc1jkl...farmer4', name: 'Amara Diallo', role: 'member', joinedDate: '2025-09-20', sharesOwned: 1, xotkEarned: 2800, hoursContributed: 180 },
      { uid: 'oc1mno...farmer5', name: 'Rosa Jimenez', role: 'member', joinedDate: '2026-01-05', sharesOwned: 1, xotkEarned: 1400, hoursContributed: 90 },
    ],
    dividends: [
      { id: 'd1', period: 'Q4 2025', totalRevenue: 14600, perMemberShare: 3650, distributedDate: '2026-01-10', claimed: true },
      { id: 'd2', period: 'Q1 2026', totalRevenue: 18200, perMemberShare: 3640, distributedDate: '2026-03-28', claimed: false },
    ],
    proposals: [
      { id: 'p1', title: 'Expand greenhouse capacity', description: 'Build a second greenhouse (est. 8,000 OTK) to grow year-round greens. Would increase winter revenue by ~40%.', proposedBy: 'Elena Vasquez', status: 'active', votesFor: 3, votesAgainst: 1, totalEligible: 5, deadline: '2026-04-10' },
      { id: 'p2', title: 'Add beekeeping program', description: 'Invest in 10 hives and training. Honey sales projected at 2,000 OTK/quarter.', proposedBy: 'Kenji Nakamura', status: 'passed', votesFor: 4, votesAgainst: 0, totalEligible: 4, deadline: '2026-02-15' },
    ],
    sharedResources: [
      { id: 'r1', name: 'John Deere Tractor', description: '2024 compact utility tractor for field work', value: 18000, availableNow: true },
      { id: 'r2', name: 'Irrigation System', description: 'Drip irrigation covering 2 acres', value: 4500, availableNow: true },
      { id: 'r3', name: 'Market Stall Kit', description: 'Tent, tables, signage for farmers market', value: 1200, availableNow: false, checkedOutBy: 'Rosa Jimenez' },
      { id: 'r4', name: 'Cold Storage Unit', description: 'Walk-in cooler for produce storage', value: 6000, availableNow: true },
    ],
    governance: { votingThreshold: 60, membershipFee: 500, dividendFrequency: 'Quarterly', maxMembers: 12, decisionMethod: 'One member, one vote' },
  },
  {
    id: 'coop-2',
    name: 'CodeCraft Worker Collective',
    type: 'worker',
    description: 'A worker-owned software development cooperative. Members collaborate on client projects, share revenue based on hours contributed, and collectively decide which contracts to accept.',
    revenueModel: 'hybrid',
    foundedDate: '2025-03-01',
    treasury: 34800,
    totalRevenue: 128500,
    members: [
      { uid: 'oc1pqr...dev_lead', name: 'Priya Mehta', role: 'founder', joinedDate: '2025-03-01', sharesOwned: 1, xotkEarned: 14200, hoursContributed: 860 },
      { uid: 'oc1stu...dev2', name: 'Alex Kovacs', role: 'board', joinedDate: '2025-03-01', sharesOwned: 1, xotkEarned: 12800, hoursContributed: 780 },
      { uid: 'oc1vwx...dev3', name: 'Jordan Williams', role: 'board', joinedDate: '2025-04-15', sharesOwned: 1, xotkEarned: 10400, hoursContributed: 640 },
      { uid: 'oc1yza...dev4', name: 'Lin Zhao', role: 'member', joinedDate: '2025-06-01', sharesOwned: 1, xotkEarned: 8200, hoursContributed: 520 },
      { uid: 'oc1bcd...dev5', name: 'Sam Okafor', role: 'member', joinedDate: '2025-08-20', sharesOwned: 1, xotkEarned: 5600, hoursContributed: 340 },
      { uid: 'oc1efg...dev6', name: 'Maya Jensen', role: 'member', joinedDate: '2025-11-01', sharesOwned: 1, xotkEarned: 3200, hoursContributed: 200 },
    ],
    dividends: [
      { id: 'd1', period: 'Q2 2025', totalRevenue: 28400, perMemberShare: 7100, distributedDate: '2025-07-05', claimed: true },
      { id: 'd2', period: 'Q3 2025', totalRevenue: 36200, perMemberShare: 7240, distributedDate: '2025-10-05', claimed: true },
      { id: 'd3', period: 'Q4 2025', totalRevenue: 38600, perMemberShare: 6433, distributedDate: '2026-01-05', claimed: true },
      { id: 'd4', period: 'Q1 2026', totalRevenue: 25300, perMemberShare: 4217, distributedDate: '2026-03-28', claimed: false },
    ],
    proposals: [
      { id: 'p1', title: 'Accept DAO governance platform contract', description: 'New client project: build a DAO governance UI. 6 week timeline, 45,000 OTK budget. Requires 3 full-time developers.', proposedBy: 'Priya Mehta', status: 'active', votesFor: 4, votesAgainst: 0, totalEligible: 6, deadline: '2026-04-05' },
      { id: 'p2', title: 'Hire junior apprentice program', description: 'Bring on 2 junior developers as paid apprentices (6 months). Invest in next generation of cooperative developers.', proposedBy: 'Jordan Williams', status: 'active', votesFor: 3, votesAgainst: 2, totalEligible: 6, deadline: '2026-04-12' },
      { id: 'p3', title: 'Switch to 4-day work week trial', description: '3-month trial of 4-day work weeks. Research shows productivity maintains at ~90% with improved wellbeing.', proposedBy: 'Maya Jensen', status: 'passed', votesFor: 5, votesAgainst: 1, totalEligible: 6, deadline: '2026-02-28' },
    ],
    sharedResources: [
      { id: 'r1', name: 'MacBook Pro M4 Pool (4 units)', description: 'Shared high-performance laptops for development', value: 12000, availableNow: true },
      { id: 'r2', name: 'Cloud Infrastructure Credits', description: 'AWS/GCP credits for client project hosting', value: 8000, availableNow: true },
      { id: 'r3', name: 'Figma Enterprise License', description: 'Shared design tool subscription', value: 900, availableNow: true },
      { id: 'r4', name: 'Conference Room (WeWork)', description: 'Reserved meeting space for client presentations', value: 2400, availableNow: false, checkedOutBy: 'Alex Kovacs' },
    ],
    governance: { votingThreshold: 67, membershipFee: 1000, dividendFrequency: 'Quarterly', maxMembers: 15, decisionMethod: 'One member, one vote' },
  },
  {
    id: 'coop-3',
    name: 'Harmony Heights Housing Co-op',
    type: 'housing',
    description: 'A resident-owned housing cooperative with 24 units. Members collectively own the building, share maintenance responsibilities, and make decisions about shared spaces, repairs, and community events.',
    revenueModel: 'equal_split',
    foundedDate: '2024-09-01',
    treasury: 52600,
    totalRevenue: 86400,
    members: [
      { uid: 'oc1hij...resident1', name: 'David Chen', role: 'founder', joinedDate: '2024-09-01', sharesOwned: 1, xotkEarned: 4200, hoursContributed: 160 },
      { uid: 'oc1klm...resident2', name: 'Fatima Al-Rashid', role: 'board', joinedDate: '2024-09-01', sharesOwned: 1, xotkEarned: 3800, hoursContributed: 140 },
      { uid: 'oc1nop...resident3', name: 'Tom Brennan', role: 'board', joinedDate: '2024-10-15', sharesOwned: 1, xotkEarned: 3200, hoursContributed: 120 },
      { uid: 'oc1qrs...resident4', name: 'Lucia Moretti', role: 'member', joinedDate: '2025-01-10', sharesOwned: 1, xotkEarned: 2400, hoursContributed: 80 },
      { uid: 'oc1tuv...resident5', name: 'Kwame Asante', role: 'member', joinedDate: '2025-03-20', sharesOwned: 1, xotkEarned: 1800, hoursContributed: 60 },
      { uid: 'oc1wxy...resident6', name: 'Nina Petrov', role: 'member', joinedDate: '2025-06-01', sharesOwned: 1, xotkEarned: 1200, hoursContributed: 40 },
      { uid: 'oc1zab...resident7', name: 'James Okonkwo', role: 'member', joinedDate: '2025-09-15', sharesOwned: 1, xotkEarned: 600, hoursContributed: 20 },
    ],
    dividends: [
      { id: 'd1', period: 'H2 2025', totalRevenue: 43200, perMemberShare: 7200, distributedDate: '2026-01-15', claimed: true },
      { id: 'd2', period: 'H1 2026 (projected)', totalRevenue: 43200, perMemberShare: 6171, distributedDate: '2026-07-15', claimed: false },
    ],
    proposals: [
      { id: 'p1', title: 'Install rooftop solar panels', description: 'Invest 28,000 OTK in rooftop solar. Projected savings of 6,000 OTK/year on energy, with payback in under 5 years.', proposedBy: 'David Chen', status: 'active', votesFor: 5, votesAgainst: 1, totalEligible: 7, deadline: '2026-04-15' },
      { id: 'p2', title: 'Create shared community garden', description: 'Convert unused courtyard space into raised-bed garden plots. One per unit. Materials budget: 3,000 OTK.', proposedBy: 'Lucia Moretti', status: 'passed', votesFor: 6, votesAgainst: 0, totalEligible: 7, deadline: '2026-03-01' },
      { id: 'p3', title: 'Allow short-term subletting', description: 'Permit members to sublet for up to 30 days/year when traveling. Revenue shared 80% member / 20% co-op treasury.', proposedBy: 'Nina Petrov', status: 'rejected', votesFor: 2, votesAgainst: 5, totalEligible: 7, deadline: '2026-02-15' },
    ],
    sharedResources: [
      { id: 'r1', name: 'Rooftop Deck & Grill', description: 'Shared outdoor space with BBQ grills and seating for 30', value: 8000, availableNow: true },
      { id: 'r2', name: 'Workshop & Tools', description: 'Basement workshop with power tools, workbench, hardware supplies', value: 5500, availableNow: true },
      { id: 'r3', name: 'Cargo Bike', description: 'Electric cargo bike for errands and grocery runs', value: 3200, availableNow: false, checkedOutBy: 'Tom Brennan' },
      { id: 'r4', name: 'Guest Suite', description: 'Furnished unit for member guests (book up to 7 nights)', value: 15000, availableNow: true },
      { id: 'r5', name: 'Laundry Room (8 machines)', description: 'Commercial washers and dryers, maintained from co-op funds', value: 12000, availableNow: true },
    ],
    governance: { votingThreshold: 75, membershipFee: 2000, dividendFrequency: 'Semi-annually', maxMembers: 24, decisionMethod: 'One member, one vote' },
  },
];

const MY_COOP_IDS = ['coop-1', 'coop-2'];

// ─── Component ───

export function CooperativeScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('browse');
  const [selectedCoop, setSelectedCoop] = useState<Cooperative | null>(null);
  const [coops] = useState<Cooperative[]>(DEMO_COOPS);
  const [typeFilter, setTypeFilter] = useState<CoopType | 'all'>('all');
  const [detailSection, setDetailSection] = useState<'overview' | 'dividends' | 'governance' | 'resources'>('overview');

  // Create form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<CoopType | ''>('');
  const [formRevenueModel, setFormRevenueModel] = useState<RevenueModel | ''>('');
  const [formMembershipFee, setFormMembershipFee] = useState('');
  const [formMaxMembers, setFormMaxMembers] = useState('');
  const [formVotingThreshold, setFormVotingThreshold] = useState('');

  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const filteredCoops = useMemo(() => {
    let list = coops;
    if (tab === 'my-coops') {
      list = list.filter((c) => MY_COOP_IDS.includes(c.id));
    }
    if (typeFilter !== 'all') {
      list = list.filter((c) => c.type === typeFilter);
    }
    return list;
  }, [coops, tab, typeFilter]);

  const handleCreateCoop = useCallback(() => {
    if (!formName.trim()) { Alert.alert('Required', 'Enter a cooperative name.'); return; }
    if (!formDescription.trim()) { Alert.alert('Required', 'Enter a description.'); return; }
    if (!formType) { Alert.alert('Required', 'Select a co-op type.'); return; }
    if (!formRevenueModel) { Alert.alert('Required', 'Select a revenue sharing model.'); return; }
    const fee = parseInt(formMembershipFee, 10);
    if (!fee || fee <= 0) { Alert.alert('Required', 'Enter a valid membership fee.'); return; }
    const maxMem = parseInt(formMaxMembers, 10);
    if (!maxMem || maxMem < 2) { Alert.alert('Required', 'Enter maximum members (at least 2).'); return; }
    const threshold = parseInt(formVotingThreshold, 10);
    if (!threshold || threshold < 50 || threshold > 100) { Alert.alert('Required', 'Enter a voting threshold between 50-100%.'); return; }

    Alert.alert(
      'Cooperative Created',
      `"${formName.trim()}" has been established!\n\nType: ${TYPE_LABELS[formType]}\nRevenue Model: ${MODEL_LABELS[formRevenueModel]}\nMembership Fee: ${fee} OTK\n\nYou are the founding member. Invite others to join and earn xOTK together.`,
    );
    setFormName('');
    setFormDescription('');
    setFormType('');
    setFormRevenueModel('');
    setFormMembershipFee('');
    setFormMaxMembers('');
    setFormVotingThreshold('');
    setTab('browse');
  }, [formName, formDescription, formType, formRevenueModel, formMembershipFee, formMaxMembers, formVotingThreshold]);

  const handleJoinCoop = useCallback((coop: Cooperative) => {
    Alert.alert(
      'Join Cooperative',
      `Apply to join "${coop.name}"?\n\nMembership fee: ${coop.governance.membershipFee} OTK\nRevenue model: ${MODEL_LABELS[coop.revenueModel]}\n\nYou will have equal voting rights and share in dividends.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Apply', onPress: () => Alert.alert('Application Sent', 'The co-op board will review your membership request.') },
      ],
    );
  }, []);

  const handleClaimDividend = useCallback((coop: Cooperative, dividend: Dividend) => {
    Alert.alert(
      'Claim Dividend',
      `Claim your share of ${dividend.period} revenue?\n\nTotal revenue: ${dividend.totalRevenue.toLocaleString()} OTK\nYour share: ${dividend.perMemberShare.toLocaleString()} OTK`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Claim', onPress: () => Alert.alert('Dividend Claimed', `${dividend.perMemberShare.toLocaleString()} xOTK has been credited to your account.`) },
      ],
    );
  }, []);

  const handleVote = useCallback((coop: Cooperative, proposal: Proposal, vote: 'for' | 'against') => {
    Alert.alert(
      'Cast Vote',
      `Vote ${vote === 'for' ? 'FOR' : 'AGAINST'} "${proposal.title}"?\n\nOne member, one vote. This cannot be changed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Vote ${vote === 'for' ? 'For' : 'Against'}`,
          onPress: () => Alert.alert('Vote Recorded', `Your vote has been recorded. ${proposal.votesFor + (vote === 'for' ? 1 : 0)} / ${proposal.totalEligible} votes for.`),
        },
      ],
    );
  }, []);

  const handleCheckoutResource = useCallback((resource: SharedResource) => {
    if (!resource.availableNow) {
      Alert.alert('Unavailable', `Currently checked out by ${resource.checkedOutBy || 'another member'}.`);
      return;
    }
    Alert.alert(
      'Check Out Resource',
      `Reserve "${resource.name}" for your use?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Check Out', onPress: () => Alert.alert('Reserved', `"${resource.name}" is now checked out to you.`) },
      ],
    );
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.blue + '20' },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.blue },
    filterRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, flexWrap: 'wrap', gap: 6 },
    filterChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: t.border },
    filterChipActive: { backgroundColor: t.accent.blue + '15', borderColor: t.accent.blue },
    filterChipText: { color: t.text.muted, fontSize: 11, fontWeight: fonts.semibold },
    filterChipTextActive: { color: t.accent.blue },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    cardName: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold },
    cardDesc: { color: t.text.secondary, fontSize: 13, marginTop: 6, lineHeight: 19 },
    typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, marginTop: 8 },
    typeText: { color: '#fff', fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase' },
    cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
    cardMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    cardMetaLabel: { color: t.text.muted, fontSize: 11 },
    cardMetaValue: { color: t.text.primary, fontSize: 13, fontWeight: fonts.bold },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    sectionLabel: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 20, marginBottom: 8, marginTop: 20 },
    backBtn: { color: t.accent.blue, fontSize: 16 },
    detailHeader: { paddingHorizontal: 20, paddingTop: 8 },
    detailName: { color: t.text.primary, fontSize: 22, fontWeight: fonts.heavy },
    detailDesc: { color: t.text.secondary, fontSize: 14, lineHeight: 22, marginTop: 8 },
    detailMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaLabel: { color: t.text.muted, fontSize: 11 },
    metaValue: { color: t.text.primary, fontSize: 13, fontWeight: fonts.bold },
    detailTabs: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 16, marginBottom: 12, gap: 4 },
    detailTab: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14 },
    detailTabActive: { backgroundColor: t.accent.blue + '20' },
    detailTabText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    detailTabTextActive: { color: t.accent.blue },
    teamRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border },
    teamName: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    teamRole: { fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
    teamStats: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    dividendCard: { backgroundColor: t.bg.secondary, borderRadius: 12, padding: 14, marginHorizontal: 20, marginBottom: 8 },
    dividendPeriod: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    dividendAmount: { color: t.accent.green, fontSize: 18, fontWeight: fonts.heavy, marginTop: 4 },
    dividendTotal: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    dividendStatus: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginTop: 8 },
    dividendStatusText: { color: '#fff', fontSize: 11, fontWeight: fonts.bold },
    claimBtn: { backgroundColor: t.accent.green, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, marginTop: 8, alignSelf: 'flex-start' },
    claimBtnText: { color: '#fff', fontSize: 13, fontWeight: fonts.bold },
    proposalCard: { backgroundColor: t.bg.secondary, borderRadius: 12, padding: 14, marginHorizontal: 20, marginBottom: 8 },
    proposalTitle: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    proposalDesc: { color: t.text.secondary, fontSize: 13, lineHeight: 19, marginTop: 4 },
    proposalMeta: { color: t.text.muted, fontSize: 11, marginTop: 6 },
    proposalStatusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 6 },
    proposalStatusText: { color: '#fff', fontSize: 10, fontWeight: fonts.bold, textTransform: 'uppercase' },
    voteBar: { height: 8, backgroundColor: t.border, borderRadius: 4, marginTop: 8, flexDirection: 'row', overflow: 'hidden' },
    voteFor: { backgroundColor: '#34C759', height: 8 },
    voteAgainst: { backgroundColor: '#FF3B30', height: 8 },
    voteLabel: { color: t.text.muted, fontSize: 11, marginTop: 4 },
    voteRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
    voteBtn: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
    voteBtnText: { color: '#fff', fontSize: 13, fontWeight: fonts.bold },
    resourceCard: { backgroundColor: t.bg.secondary, borderRadius: 12, padding: 14, marginHorizontal: 20, marginBottom: 8 },
    resourceName: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    resourceDesc: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    resourceMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    resourceValue: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.semibold },
    resourceAvail: { fontSize: 11, fontWeight: fonts.bold, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    checkoutBtn: { backgroundColor: t.accent.blue, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, marginTop: 8, alignSelf: 'flex-start' },
    checkoutBtnText: { color: '#fff', fontSize: 12, fontWeight: fonts.bold },
    govCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    govRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border },
    govLabel: { color: t.text.secondary, fontSize: 13, fontWeight: fonts.semibold },
    govValue: { color: t.text.primary, fontSize: 13, fontWeight: fonts.bold },
    inputCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 12 },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: fonts.semibold, marginBottom: 8 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15 },
    descInput: { minHeight: 100, textAlignVertical: 'top' },
    typePicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1.5, borderColor: t.border },
    typeChipActive: { borderColor: t.accent.blue, backgroundColor: t.accent.blue + '15' },
    typeChipText: { color: t.text.muted, fontSize: 13, fontWeight: fonts.semibold },
    typeChipTextActive: { color: t.accent.blue },
    modelCard: { padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: t.border, marginBottom: 8 },
    modelCardActive: { borderColor: t.accent.blue, backgroundColor: t.accent.blue + '10' },
    modelLabel: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    modelLabelActive: { color: t.accent.blue },
    modelDesc: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    submitBtn: { backgroundColor: t.accent.blue, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginHorizontal: 20, marginTop: 24 },
    submitBtnText: { color: '#fff', fontSize: 17, fontWeight: fonts.bold },
    actionRow: { flexDirection: 'row', gap: 10, marginHorizontal: 20, marginTop: 16 },
    actionBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    actionBtnText: { color: '#fff', fontSize: 14, fontWeight: fonts.bold },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40, marginHorizontal: 40, lineHeight: 22 },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20, marginTop: 8, marginBottom: 16 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    summaryCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 16 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    summaryLabel: { color: t.text.secondary, fontSize: 13 },
    summaryValue: { color: t.text.primary, fontSize: 13, fontWeight: fonts.bold },
  }), [t]);

  // ─── Tab buttons ───

  const tabs: { key: Tab; label: string }[] = [
    { key: 'browse', label: 'Browse Co-ops' },
    { key: 'my-coops', label: 'My Co-ops' },
    { key: 'create', label: 'Create' },
  ];

  const detailSections: { key: typeof detailSection; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'dividends', label: 'Dividends' },
    { key: 'governance', label: 'Governance' },
    { key: 'resources', label: 'Resources' },
  ];

  // ─── Detail View ───

  if (selectedCoop) {
    const coop = selectedCoop;
    const totalXotk = coop.members.reduce((sum, m) => sum + m.xotkEarned, 0);
    const totalHours = coop.members.reduce((sum, m) => sum + m.hoursContributed, 0);
    const isMyCoop = MY_COOP_IDS.includes(coop.id);

    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => { setSelectedCoop(null); setDetailSection('overview'); }}>
            <Text style={s.backBtn}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}>
            <Text style={s.closeBtn}>Close</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.scroll}>
          <View style={s.detailHeader}>
            <View style={[s.typeBadge, { backgroundColor: TYPE_COLORS[coop.type] }]}>
              <Text style={s.typeText}>{TYPE_LABELS[coop.type]}</Text>
            </View>
            <Text style={[s.detailName, { marginTop: 8 }]}>{coop.name}</Text>
            <Text style={s.detailDesc}>{coop.description}</Text>

            <View style={s.detailMeta}>
              <View style={s.metaItem}>
                <Text style={s.metaLabel}>Members</Text>
                <Text style={s.metaValue}>{coop.members.length}</Text>
              </View>
              <View style={s.metaItem}>
                <Text style={s.metaLabel}>Treasury</Text>
                <Text style={s.metaValue}>{coop.treasury.toLocaleString()} OTK</Text>
              </View>
              <View style={s.metaItem}>
                <Text style={s.metaLabel}>Revenue</Text>
                <Text style={s.metaValue}>{coop.totalRevenue.toLocaleString()} OTK</Text>
              </View>
              <View style={s.metaItem}>
                <Text style={s.metaLabel}>Founded</Text>
                <Text style={s.metaValue}>{coop.foundedDate}</Text>
              </View>
            </View>
          </View>

          {/* Detail Section Tabs */}
          <View style={s.detailTabs}>
            {detailSections.map((sec) => (
              <TouchableOpacity
                key={sec.key}
                style={[s.detailTab, detailSection === sec.key && s.detailTabActive]}
                onPress={() => setDetailSection(sec.key)}
              >
                <Text style={[s.detailTabText, detailSection === sec.key && s.detailTabTextActive]}>
                  {sec.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Overview Section */}
          {detailSection === 'overview' && (
            <>
              {/* Stats Summary */}
              <View style={s.statRow}>
                <View style={s.statItem}>
                  <Text style={s.statValue}>{coop.members.length}</Text>
                  <Text style={s.statLabel}>Members</Text>
                </View>
                <View style={s.statItem}>
                  <Text style={s.statValue}>{totalXotk.toLocaleString()}</Text>
                  <Text style={s.statLabel}>xOTK Earned</Text>
                </View>
                <View style={s.statItem}>
                  <Text style={s.statValue}>{totalHours.toLocaleString()}</Text>
                  <Text style={s.statLabel}>Total Hours</Text>
                </View>
              </View>

              {/* Members */}
              <Text style={s.sectionLabel}>Members</Text>
              {coop.members.map((member) => (
                <View key={member.uid} style={s.teamRow}>
                  <View>
                    <Text style={s.teamName}>{member.name}</Text>
                    <Text style={s.teamStats}>
                      {member.hoursContributed}h contributed | {member.xotkEarned.toLocaleString()} xOTK | Joined {member.joinedDate}
                    </Text>
                  </View>
                  <Text style={[s.teamRole, { color: ROLE_COLORS[member.role] }]}>
                    {member.role}
                  </Text>
                </View>
              ))}

              {/* Active Proposals */}
              <Text style={s.sectionLabel}>Active Proposals</Text>
              {coop.proposals.filter((p) => p.status === 'active').length === 0 ? (
                <Text style={s.emptyText}>No active proposals</Text>
              ) : (
                coop.proposals.filter((p) => p.status === 'active').map((proposal) => {
                  const forPct = proposal.totalEligible > 0 ? (proposal.votesFor / proposal.totalEligible) * 100 : 0;
                  const againstPct = proposal.totalEligible > 0 ? (proposal.votesAgainst / proposal.totalEligible) * 100 : 0;
                  return (
                    <View key={proposal.id} style={s.proposalCard}>
                      <Text style={s.proposalTitle}>{proposal.title}</Text>
                      <Text style={s.proposalDesc}>{proposal.description}</Text>
                      <Text style={s.proposalMeta}>
                        Proposed by {proposal.proposedBy} | Deadline: {proposal.deadline}
                      </Text>
                      <View style={s.voteBar}>
                        <View style={[s.voteFor, { width: `${forPct}%` }]} />
                        <View style={[s.voteAgainst, { width: `${againstPct}%` }]} />
                      </View>
                      <Text style={s.voteLabel}>
                        {proposal.votesFor} for / {proposal.votesAgainst} against / {proposal.totalEligible} eligible
                      </Text>
                      {isMyCoop && (
                        <View style={s.voteRow}>
                          <TouchableOpacity
                            style={[s.voteBtn, { backgroundColor: '#34C759' }]}
                            onPress={() => handleVote(coop, proposal, 'for')}
                          >
                            <Text style={s.voteBtnText}>Vote For</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[s.voteBtn, { backgroundColor: '#FF3B30' }]}
                            onPress={() => handleVote(coop, proposal, 'against')}
                          >
                            <Text style={s.voteBtnText}>Vote Against</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })
              )}

              {/* Join button for non-members */}
              {!isMyCoop && (
                <View style={s.actionRow}>
                  <TouchableOpacity
                    style={[s.actionBtn, { backgroundColor: t.accent.blue }]}
                    onPress={() => handleJoinCoop(coop)}
                  >
                    <Text style={s.actionBtnText}>Apply to Join</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {/* Dividends Section */}
          {detailSection === 'dividends' && (
            <>
              <View style={s.summaryCard}>
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>Revenue Model</Text>
                  <Text style={s.summaryValue}>{MODEL_LABELS[coop.revenueModel]}</Text>
                </View>
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>Total Revenue</Text>
                  <Text style={s.summaryValue}>{coop.totalRevenue.toLocaleString()} OTK</Text>
                </View>
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>Distribution Frequency</Text>
                  <Text style={s.summaryValue}>{coop.governance.dividendFrequency}</Text>
                </View>
              </View>

              <Text style={s.sectionLabel}>Distribution History</Text>
              {coop.dividends.map((div) => (
                <View key={div.id} style={s.dividendCard}>
                  <Text style={s.dividendPeriod}>{div.period}</Text>
                  <Text style={s.dividendAmount}>{div.perMemberShare.toLocaleString()} xOTK</Text>
                  <Text style={s.dividendTotal}>
                    Total distributed: {div.totalRevenue.toLocaleString()} OTK | {div.distributedDate}
                  </Text>
                  {div.claimed ? (
                    <View style={[s.dividendStatus, { backgroundColor: '#34C759' }]}>
                      <Text style={s.dividendStatusText}>Claimed</Text>
                    </View>
                  ) : isMyCoop ? (
                    <TouchableOpacity
                      style={s.claimBtn}
                      onPress={() => handleClaimDividend(coop, div)}
                    >
                      <Text style={s.claimBtnText}>Claim {div.perMemberShare.toLocaleString()} xOTK</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[s.dividendStatus, { backgroundColor: '#FF9500' }]}>
                      <Text style={s.dividendStatusText}>Pending</Text>
                    </View>
                  )}
                </View>
              ))}
            </>
          )}

          {/* Governance Section */}
          {detailSection === 'governance' && (
            <>
              <View style={s.govCard}>
                <View style={s.govRow}>
                  <Text style={s.govLabel}>Decision Method</Text>
                  <Text style={s.govValue}>{coop.governance.decisionMethod}</Text>
                </View>
                <View style={s.govRow}>
                  <Text style={s.govLabel}>Voting Threshold</Text>
                  <Text style={s.govValue}>{coop.governance.votingThreshold}%</Text>
                </View>
                <View style={s.govRow}>
                  <Text style={s.govLabel}>Membership Fee</Text>
                  <Text style={s.govValue}>{coop.governance.membershipFee.toLocaleString()} OTK</Text>
                </View>
                <View style={s.govRow}>
                  <Text style={s.govLabel}>Dividend Frequency</Text>
                  <Text style={s.govValue}>{coop.governance.dividendFrequency}</Text>
                </View>
                <View style={[s.govRow, { borderBottomWidth: 0 }]}>
                  <Text style={s.govLabel}>Max Members</Text>
                  <Text style={s.govValue}>{coop.governance.maxMembers}</Text>
                </View>
              </View>

              <Text style={s.sectionLabel}>All Proposals</Text>
              {coop.proposals.map((proposal) => {
                const forPct = proposal.totalEligible > 0 ? (proposal.votesFor / proposal.totalEligible) * 100 : 0;
                const againstPct = proposal.totalEligible > 0 ? (proposal.votesAgainst / proposal.totalEligible) * 100 : 0;
                return (
                  <View key={proposal.id} style={s.proposalCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Text style={[s.proposalTitle, { flex: 1 }]}>{proposal.title}</Text>
                      <View style={[s.proposalStatusBadge, { backgroundColor: PROPOSAL_COLORS[proposal.status] }]}>
                        <Text style={s.proposalStatusText}>{proposal.status}</Text>
                      </View>
                    </View>
                    <Text style={s.proposalDesc}>{proposal.description}</Text>
                    <Text style={s.proposalMeta}>
                      Proposed by {proposal.proposedBy} | Deadline: {proposal.deadline}
                    </Text>
                    <View style={s.voteBar}>
                      <View style={[s.voteFor, { width: `${forPct}%` }]} />
                      <View style={[s.voteAgainst, { width: `${againstPct}%` }]} />
                    </View>
                    <Text style={s.voteLabel}>
                      {proposal.votesFor} for / {proposal.votesAgainst} against / {proposal.totalEligible} eligible ({Math.round(forPct)}% approval)
                    </Text>
                    {proposal.status === 'active' && isMyCoop && (
                      <View style={s.voteRow}>
                        <TouchableOpacity
                          style={[s.voteBtn, { backgroundColor: '#34C759' }]}
                          onPress={() => handleVote(coop, proposal, 'for')}
                        >
                          <Text style={s.voteBtnText}>Vote For</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[s.voteBtn, { backgroundColor: '#FF3B30' }]}
                          onPress={() => handleVote(coop, proposal, 'against')}
                        >
                          <Text style={s.voteBtnText}>Vote Against</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </>
          )}

          {/* Resources Section */}
          {detailSection === 'resources' && (
            <>
              <Text style={s.sectionLabel}>Shared Equipment & Resources</Text>
              {coop.sharedResources.map((resource) => (
                <View key={resource.id} style={s.resourceCard}>
                  <Text style={s.resourceName}>{resource.name}</Text>
                  <Text style={s.resourceDesc}>{resource.description}</Text>
                  <View style={s.resourceMeta}>
                    <Text style={s.resourceValue}>Value: {resource.value.toLocaleString()} OTK</Text>
                    <Text style={[s.resourceAvail, {
                      color: resource.availableNow ? '#34C759' : '#FF9500',
                      backgroundColor: (resource.availableNow ? '#34C759' : '#FF9500') + '15',
                    }]}>
                      {resource.availableNow ? 'Available' : 'In Use'}
                    </Text>
                  </View>
                  {!resource.availableNow && resource.checkedOutBy && (
                    <Text style={[s.resourceDesc, { marginTop: 6 }]}>Checked out by: {resource.checkedOutBy}</Text>
                  )}
                  {isMyCoop && (
                    <TouchableOpacity
                      style={[s.checkoutBtn, !resource.availableNow && { backgroundColor: t.text.muted }]}
                      onPress={() => handleCheckoutResource(resource)}
                    >
                      <Text style={s.checkoutBtnText}>
                        {resource.availableNow ? 'Check Out' : 'Unavailable'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {/* Resource pool summary */}
              <View style={[s.summaryCard, { marginTop: 16 }]}>
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>Total Resources</Text>
                  <Text style={s.summaryValue}>{coop.sharedResources.length}</Text>
                </View>
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>Total Pool Value</Text>
                  <Text style={s.summaryValue}>
                    {coop.sharedResources.reduce((sum, r) => sum + r.value, 0).toLocaleString()} OTK
                  </Text>
                </View>
                <View style={[s.summaryRow, { borderBottomWidth: 0 }]}>
                  <Text style={s.summaryLabel}>Currently Available</Text>
                  <Text style={s.summaryValue}>
                    {coop.sharedResources.filter((r) => r.availableNow).length} / {coop.sharedResources.length}
                  </Text>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Main View ───

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Cooperatives</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[s.tabBtn, tab === t.key && s.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {/* Browse / My Co-ops Tab */}
        {(tab === 'browse' || tab === 'my-coops') && (
          <>
            {/* Type Filter */}
            {tab === 'browse' && (
              <View style={s.filterRow}>
                <TouchableOpacity
                  style={[s.filterChip, typeFilter === 'all' && s.filterChipActive]}
                  onPress={() => setTypeFilter('all')}
                >
                  <Text style={[s.filterChipText, typeFilter === 'all' && s.filterChipTextActive]}>All</Text>
                </TouchableOpacity>
                {COOP_TYPES.map((ct) => (
                  <TouchableOpacity
                    key={ct.key}
                    style={[s.filterChip, typeFilter === ct.key && s.filterChipActive]}
                    onPress={() => setTypeFilter(ct.key)}
                  >
                    <Text style={[s.filterChipText, typeFilter === ct.key && s.filterChipTextActive]}>
                      {ct.icon} {ct.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* My Co-ops summary */}
            {tab === 'my-coops' && (
              <>
                <View style={s.statRow}>
                  <View style={s.statItem}>
                    <Text style={s.statValue}>{filteredCoops.length}</Text>
                    <Text style={s.statLabel}>My Co-ops</Text>
                  </View>
                  <View style={s.statItem}>
                    <Text style={s.statValue}>
                      {filteredCoops.reduce((sum, c) => sum + c.treasury, 0).toLocaleString()}
                    </Text>
                    <Text style={s.statLabel}>Combined Treasury</Text>
                  </View>
                  <View style={s.statItem}>
                    <Text style={s.statValue}>
                      {filteredCoops.reduce((sum, c) =>
                        sum + c.dividends.filter((d) => !d.claimed).reduce((ds, d) => ds + d.perMemberShare, 0), 0
                      ).toLocaleString()}
                    </Text>
                    <Text style={s.statLabel}>Unclaimed xOTK</Text>
                  </View>
                </View>
              </>
            )}

            {filteredCoops.length === 0 ? (
              <Text style={s.emptyText}>
                {tab === 'my-coops'
                  ? 'You haven\'t joined any cooperatives yet. Browse co-ops to find one that matches your interests.'
                  : 'No cooperatives match your filter.'}
              </Text>
            ) : (
              filteredCoops.map((coop) => (
                <TouchableOpacity
                  key={coop.id}
                  style={s.card}
                  onPress={() => setSelectedCoop(coop)}
                >
                  <View style={[s.typeBadge, { backgroundColor: TYPE_COLORS[coop.type] }]}>
                    <Text style={s.typeText}>{TYPE_LABELS[coop.type]}</Text>
                  </View>
                  <Text style={[s.cardName, { marginTop: 8 }]}>{coop.name}</Text>
                  <Text style={s.cardDesc} numberOfLines={2}>{coop.description}</Text>
                  <View style={s.cardMeta}>
                    <View style={s.cardMetaItem}>
                      <Text style={s.cardMetaLabel}>Members </Text>
                      <Text style={s.cardMetaValue}>{coop.members.length}</Text>
                    </View>
                    <View style={s.cardMetaItem}>
                      <Text style={s.cardMetaLabel}>Treasury </Text>
                      <Text style={s.cardMetaValue}>{coop.treasury.toLocaleString()} OTK</Text>
                    </View>
                    <View style={s.cardMetaItem}>
                      <Text style={s.cardMetaLabel}>Revenue </Text>
                      <Text style={s.cardMetaValue}>{coop.totalRevenue.toLocaleString()} OTK</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        {/* Create Tab */}
        {tab === 'create' && (
          <>
            <Text style={s.sectionTitle}>Create a Cooperative</Text>

            <View style={s.inputCard}>
              <Text style={s.inputLabel}>Cooperative Name</Text>
              <TextInput
                style={s.input}
                placeholder="e.g., Neighborhood Bakery Co-op"
                placeholderTextColor={t.text.muted}
                value={formName}
                onChangeText={setFormName}
              />
            </View>

            <View style={s.inputCard}>
              <Text style={s.inputLabel}>Description</Text>
              <TextInput
                style={[s.input, s.descInput]}
                placeholder="Describe the cooperative's mission, what members will share, and how xOTK will be earned..."
                placeholderTextColor={t.text.muted}
                value={formDescription}
                onChangeText={setFormDescription}
                multiline
              />
            </View>

            <View style={s.inputCard}>
              <Text style={s.inputLabel}>Co-op Type</Text>
              <View style={s.typePicker}>
                {COOP_TYPES.map((ct) => (
                  <TouchableOpacity
                    key={ct.key}
                    style={[s.typeChip, formType === ct.key && s.typeChipActive]}
                    onPress={() => setFormType(ct.key)}
                  >
                    <Text style={[s.typeChipText, formType === ct.key && s.typeChipTextActive]}>
                      {ct.icon} {ct.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={s.inputCard}>
              <Text style={s.inputLabel}>Revenue Sharing Model</Text>
              {REVENUE_MODELS.map((rm) => (
                <TouchableOpacity
                  key={rm.key}
                  style={[s.modelCard, formRevenueModel === rm.key && s.modelCardActive]}
                  onPress={() => setFormRevenueModel(rm.key)}
                >
                  <Text style={[s.modelLabel, formRevenueModel === rm.key && s.modelLabelActive]}>
                    {rm.label}
                  </Text>
                  <Text style={s.modelDesc}>{rm.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.inputCard}>
              <Text style={s.inputLabel}>Membership Fee (OTK)</Text>
              <TextInput
                style={s.input}
                placeholder="e.g., 500"
                placeholderTextColor={t.text.muted}
                value={formMembershipFee}
                onChangeText={setFormMembershipFee}
                keyboardType="numeric"
              />
            </View>

            <View style={s.inputCard}>
              <Text style={s.inputLabel}>Maximum Members</Text>
              <TextInput
                style={s.input}
                placeholder="e.g., 20"
                placeholderTextColor={t.text.muted}
                value={formMaxMembers}
                onChangeText={setFormMaxMembers}
                keyboardType="numeric"
              />
            </View>

            <View style={s.inputCard}>
              <Text style={s.inputLabel}>Voting Threshold (%)</Text>
              <TextInput
                style={s.input}
                placeholder="e.g., 67 (minimum 50)"
                placeholderTextColor={t.text.muted}
                value={formVotingThreshold}
                onChangeText={setFormVotingThreshold}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity style={s.submitBtn} onPress={handleCreateCoop}>
              <Text style={s.submitBtnText}>Establish Cooperative</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
