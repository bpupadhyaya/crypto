/**
 * Insurance Pool Screen (Art I) — Community mutual aid insurance pools.
 *
 * Members pool OTK premiums to collectively insure against life risks.
 * Claims are approved by pool member vote — no corporate middleman.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

type PoolType = 'health' | 'crop' | 'disaster' | 'job_loss' | 'equipment' | 'general';

interface InsurancePool {
  id: string;
  name: string;
  type: PoolType;
  members: number;
  balance: number;
  monthlyPremium: number;
  maxClaim: number;
  description: string;
  claimsPaid: number;
  claimsDenied: number;
  joined: boolean;
}

interface Claim {
  id: string;
  poolId: string;
  poolName: string;
  claimant: string;
  reason: string;
  amount: number;
  evidenceHash: string;
  status: 'voting' | 'approved' | 'rejected' | 'paid';
  votesFor: number;
  votesAgainst: number;
  totalVoters: number;
  filedDate: string;
  myVote?: 'for' | 'against' | null;
}

interface MyPool {
  poolId: string;
  poolName: string;
  type: PoolType;
  premiumPaid: number;
  memberSince: string;
  claimsFiled: number;
}

interface Props {
  onClose: () => void;
}

type TabKey = 'browse' | 'my-pools' | 'claims' | 'vote';

const POOL_TYPE_COLORS: Record<PoolType, string> = {
  health: '#e91e63',
  crop: '#4caf50',
  disaster: '#ff5722',
  job_loss: '#ff9800',
  equipment: '#607d8b',
  general: '#2196f3',
};

const POOL_TYPE_ICONS: Record<PoolType, string> = {
  health: '\u2695\ufe0f',
  crop: '\ud83c\udf3e',
  disaster: '\ud83c\udf0a',
  job_loss: '\ud83d\udcbc',
  equipment: '\ud83d\udd27',
  general: '\ud83e\uddf1',
};

const POOL_TYPE_LABELS: Record<PoolType, string> = {
  health: 'Health',
  crop: 'Crop',
  disaster: 'Disaster',
  job_loss: 'Job Loss',
  equipment: 'Equipment',
  general: 'General',
};

const STATUS_COLORS: Record<string, string> = {
  voting: '#ff9800',
  approved: '#4caf50',
  rejected: '#f44336',
  paid: '#2196f3',
};

const DEMO_POOLS: InsurancePool[] = [
  {
    id: 'pool-1',
    name: 'Community Health Shield',
    type: 'health',
    members: 142,
    balance: 28400,
    monthlyPremium: 50,
    maxClaim: 5000,
    description: 'Medical emergency coverage for community members. Covers unexpected health costs not handled by public systems.',
    claimsPaid: 12,
    claimsDenied: 2,
    joined: true,
  },
  {
    id: 'pool-2',
    name: 'Smallholder Crop Insurance',
    type: 'crop',
    members: 89,
    balance: 15600,
    monthlyPremium: 30,
    maxClaim: 3000,
    description: 'Protection against crop failure from drought, flooding, or pest damage for small-scale farmers.',
    claimsPaid: 7,
    claimsDenied: 1,
    joined: false,
  },
  {
    id: 'pool-3',
    name: 'Regional Disaster Fund',
    type: 'disaster',
    members: 310,
    balance: 62000,
    monthlyPremium: 20,
    maxClaim: 10000,
    description: 'Emergency relief for members affected by natural disasters — floods, earthquakes, storms.',
    claimsPaid: 3,
    claimsDenied: 0,
    joined: false,
  },
];

const DEMO_CLAIMS: Claim[] = [
  {
    id: 'claim-1',
    poolId: 'pool-1',
    poolName: 'Community Health Shield',
    claimant: 'openchain1abc...xyz',
    reason: 'Emergency surgery — appendectomy. Hospital bill attached.',
    amount: 3200,
    evidenceHash: '0xb4e2a1...f83c',
    status: 'voting',
    votesFor: 87,
    votesAgainst: 12,
    totalVoters: 142,
    filedDate: '2026-03-26',
    myVote: null,
  },
  {
    id: 'claim-2',
    poolId: 'pool-1',
    poolName: 'Community Health Shield',
    claimant: 'openchain1def...uvw',
    reason: 'Prescription medication for chronic condition — 3 month supply.',
    amount: 800,
    evidenceHash: '0xc7f3d2...a91b',
    status: 'paid',
    votesFor: 118,
    votesAgainst: 8,
    totalVoters: 142,
    filedDate: '2026-03-10',
    myVote: 'for',
  },
  {
    id: 'claim-3',
    poolId: 'pool-2',
    poolName: 'Smallholder Crop Insurance',
    claimant: 'openchain1ghi...rst',
    reason: 'Drought damage — lost 60% of maize harvest. Satellite imagery hash attached.',
    amount: 2500,
    evidenceHash: '0xd9a1e4...c72f',
    status: 'paid',
    votesFor: 71,
    votesAgainst: 5,
    totalVoters: 89,
    filedDate: '2026-02-28',
    myVote: null,
  },
];

const DEMO_MY_POOLS: MyPool[] = [
  {
    poolId: 'pool-1',
    poolName: 'Community Health Shield',
    type: 'health',
    premiumPaid: 250,
    memberSince: '2025-10-15',
    claimsFiled: 0,
  },
];

export function InsurancePoolScreen({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('browse');
  const [loading, setLoading] = useState(false);
  const [pools, setPools] = useState<InsurancePool[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [myPools, setMyPools] = useState<MyPool[]>([]);
  const [selectedPool, setSelectedPool] = useState<InsurancePool | null>(null);
  const [filterType, setFilterType] = useState<PoolType | 'all'>('all');
  // File claim fields
  const [claimReason, setClaimReason] = useState('');
  const [claimAmount, setClaimAmount] = useState('');
  const [claimEvidence, setClaimEvidence] = useState('');
  const [showFileClaim, setShowFileClaim] = useState(false);
  const [fileClaimPool, setFileClaimPool] = useState<string | null>(null);
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, backgroundColor: t.bg.card, borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: '700' },
    tabTextActive: { color: '#fff' },
    heroCard: { backgroundColor: t.accent.blue + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, alignItems: 'center', marginBottom: 16 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: '800', textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },
    filterRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 12, flexWrap: 'wrap', gap: 8 },
    filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: t.border },
    filterChipActive: { backgroundColor: t.accent.blue, borderColor: t.accent.blue },
    filterChipText: { color: t.text.muted, fontSize: 12, fontWeight: '600' },
    filterChipTextActive: { color: '#fff' },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 20 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    cardTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    cardDesc: { color: t.text.secondary, fontSize: 13, lineHeight: 20, marginTop: 6 },
    cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaLabel: { color: t.text.muted, fontSize: 11 },
    metaValue: { color: t.text.primary, fontSize: 13, fontWeight: '700' },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
    typeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    statsRow: { flexDirection: 'row', marginHorizontal: 20, gap: 12, marginBottom: 16 },
    statCard: { flex: 1, backgroundColor: t.bg.card, borderRadius: 16, padding: 16, alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 22, fontWeight: '800' },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 4 },
    joinBtn: { backgroundColor: t.accent.blue, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, marginTop: 12, alignSelf: 'flex-start' },
    joinBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    joinedBadge: { backgroundColor: '#4caf50' + '20', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, marginTop: 12, alignSelf: 'flex-start' },
    joinedText: { color: '#4caf50', fontSize: 14, fontWeight: '700' },
    detailHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
    backBtn: { color: t.accent.blue, fontSize: 16 },
    detailTitle: { color: t.text.primary, fontSize: 18, fontWeight: '800', marginHorizontal: 20 },
    detailDesc: { color: t.text.secondary, fontSize: 14, lineHeight: 22, marginHorizontal: 20, marginTop: 12 },
    inputCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 12 },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: '600', marginBottom: 8 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15 },
    descInput: { minHeight: 100, textAlignVertical: 'top' },
    submitBtn: { backgroundColor: t.accent.blue, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginHorizontal: 20, marginTop: 24, marginBottom: 24 },
    submitBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    voteRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
    voteBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    voteBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    progressBar: { height: 6, backgroundColor: t.border, borderRadius: 3, marginTop: 8 },
    progressFill: { height: 6, borderRadius: 3 },
    claimantText: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    evidenceText: { color: t.text.muted, fontSize: 11, fontFamily: 'monospace', marginTop: 4 },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40 },
    premiumBadge: { backgroundColor: '#ff9800' + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    premiumText: { color: '#ff9800', fontSize: 12, fontWeight: '700' },
    actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    actionBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: t.border },
    actionBtnText: { color: t.accent.blue, fontSize: 13, fontWeight: '700' },
  }), [t]);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    if (demoMode) {
      setPools(DEMO_POOLS);
      setClaims(DEMO_CLAIMS);
      setMyPools(DEMO_MY_POOLS);
      setLoading(false);
      return;
    }
    setPools([]);
    setClaims([]);
    setMyPools([]);
    setLoading(false);
  }, [demoMode]);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  const filteredPools = useMemo(() => {
    if (filterType === 'all') return pools;
    return pools.filter((p) => p.type === filterType);
  }, [pools, filterType]);

  const votingClaims = useMemo(() => claims.filter((c) => c.status === 'voting'), [claims]);

  const handleJoinPool = useCallback(async (pool: InsurancePool) => {
    if (pool.joined) return;
    Alert.alert(
      'Join Pool',
      `Monthly premium: ${pool.monthlyPremium} OTK\nMax claim: ${pool.maxClaim} OTK\n\nJoin ${pool.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
          onPress: async () => {
            setLoading(true);
            if (demoMode) {
              await new Promise((r) => setTimeout(r, 1000));
              setPools(pools.map((p) =>
                p.id === pool.id ? { ...p, joined: true, members: p.members + 1 } : p
              ));
              const newMyPool: MyPool = {
                poolId: pool.id,
                poolName: pool.name,
                type: pool.type,
                premiumPaid: pool.monthlyPremium,
                memberSince: new Date().toISOString().split('T')[0],
                claimsFiled: 0,
              };
              setMyPools([...myPools, newMyPool]);
              Alert.alert('Joined', `You are now a member of ${pool.name}. First premium of ${pool.monthlyPremium} OTK deducted.`);
            }
            setLoading(false);
          },
        },
      ]
    );
  }, [demoMode, pools, myPools]);

  const handleFileClaim = useCallback(async () => {
    if (!claimReason.trim() || !claimAmount.trim()) {
      Alert.alert('Required', 'Enter reason and amount.');
      return;
    }
    const amount = parseFloat(claimAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid', 'Enter a valid claim amount.');
      return;
    }
    setLoading(true);
    if (demoMode) {
      await new Promise((r) => setTimeout(r, 1200));
      const pool = pools.find((p) => p.id === fileClaimPool);
      if (pool && amount > pool.maxClaim) {
        Alert.alert('Exceeds Maximum', `Max claim for this pool is ${pool.maxClaim} OTK.`);
        setLoading(false);
        return;
      }
      const newClaim: Claim = {
        id: `claim-${Date.now()}`,
        poolId: fileClaimPool!,
        poolName: pool?.name ?? 'Unknown Pool',
        claimant: 'you',
        reason: claimReason.trim(),
        amount,
        evidenceHash: claimEvidence.trim() || '0x(none)',
        status: 'voting',
        votesFor: 0,
        votesAgainst: 0,
        totalVoters: pool?.members ?? 0,
        filedDate: new Date().toISOString().split('T')[0],
        myVote: null,
      };
      setClaims([newClaim, ...claims]);
      Alert.alert('Claim Filed', 'Your claim is now open for pool member voting.');
      setClaimReason('');
      setClaimAmount('');
      setClaimEvidence('');
      setShowFileClaim(false);
      setFileClaimPool(null);
      setActiveTab('claims');
    }
    setLoading(false);
  }, [demoMode, claimReason, claimAmount, claimEvidence, fileClaimPool, pools, claims]);

  const handleVote = useCallback(async (claim: Claim, vote: 'for' | 'against') => {
    if (claim.myVote !== null) {
      Alert.alert('Already Voted', 'You have already voted on this claim.');
      return;
    }
    setLoading(true);
    if (demoMode) {
      await new Promise((r) => setTimeout(r, 800));
      setClaims(claims.map((c) =>
        c.id === claim.id
          ? {
              ...c,
              myVote: vote,
              votesFor: vote === 'for' ? c.votesFor + 1 : c.votesFor,
              votesAgainst: vote === 'against' ? c.votesAgainst + 1 : c.votesAgainst,
            }
          : c
      ));
      Alert.alert('Vote Recorded', `You voted ${vote === 'for' ? 'to approve' : 'to reject'} this claim.`);
    }
    setLoading(false);
  }, [demoMode, claims]);

  const renderTab = (key: TabKey, label: string) => (
    <TouchableOpacity
      key={key}
      style={[s.tab, activeTab === key && s.tabActive]}
      onPress={() => { setActiveTab(key); setSelectedPool(null); setShowFileClaim(false); }}
    >
      <Text style={[s.tabText, activeTab === key && s.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderTypeFilter = () => (
    <View style={s.filterRow}>
      {(['all', 'health', 'crop', 'disaster', 'job_loss', 'equipment', 'general'] as const).map((pt) => (
        <TouchableOpacity
          key={pt}
          style={[s.filterChip, filterType === pt && s.filterChipActive]}
          onPress={() => setFilterType(pt)}
        >
          <Text style={[s.filterChipText, filterType === pt && s.filterChipTextActive]}>
            {pt === 'all' ? 'All' : `${POOL_TYPE_ICONS[pt]} ${POOL_TYPE_LABELS[pt]}`}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPoolDetail = () => {
    if (!selectedPool) return null;
    return (
      <ScrollView>
        <View style={s.detailHeader}>
          <TouchableOpacity onPress={() => setSelectedPool(null)}>
            <Text style={s.backBtn}>{'\u2190'} Back</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.detailTitle}>{selectedPool.name}</Text>
        <View style={[s.typeBadge, { backgroundColor: POOL_TYPE_COLORS[selectedPool.type], marginLeft: 20, marginTop: 8 }]}>
          <Text style={s.typeText}>{POOL_TYPE_ICONS[selectedPool.type]} {POOL_TYPE_LABELS[selectedPool.type]}</Text>
        </View>
        <Text style={s.detailDesc}>{selectedPool.description}</Text>

        <View style={[s.statsRow, { marginTop: 20 }]}>
          <View style={s.statCard}>
            <Text style={s.statValue}>{selectedPool.members}</Text>
            <Text style={s.statLabel}>Members</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statValue}>{selectedPool.balance.toLocaleString()}</Text>
            <Text style={s.statLabel}>OTK Balance</Text>
          </View>
        </View>

        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statValue}>{selectedPool.monthlyPremium}</Text>
            <Text style={s.statLabel}>Monthly Premium</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statValue}>{selectedPool.maxClaim.toLocaleString()}</Text>
            <Text style={s.statLabel}>Max Claim</Text>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Claims History</Text>
          <View style={s.cardMeta}>
            <View style={s.metaItem}>
              <Text style={s.metaLabel}>Paid</Text>
              <Text style={[s.metaValue, { color: '#4caf50' }]}>{selectedPool.claimsPaid}</Text>
            </View>
            <View style={s.metaItem}>
              <Text style={s.metaLabel}>Denied</Text>
              <Text style={[s.metaValue, { color: '#f44336' }]}>{selectedPool.claimsDenied}</Text>
            </View>
          </View>
        </View>

        {selectedPool.joined ? (
          <View style={{ marginHorizontal: 20 }}>
            <View style={s.joinedBadge}>
              <Text style={s.joinedText}>Member</Text>
            </View>
            <View style={s.actionRow}>
              <TouchableOpacity
                style={s.actionBtn}
                onPress={() => {
                  setFileClaimPool(selectedPool.id);
                  setShowFileClaim(true);
                }}
              >
                <Text style={s.actionBtnText}>File a Claim</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={{ marginHorizontal: 20 }}>
            <TouchableOpacity
              style={[s.joinBtn, loading && { opacity: 0.5 }]}
              onPress={() => handleJoinPool(selectedPool)}
              disabled={loading}
            >
              <Text style={s.joinBtnText}>Join Pool ({selectedPool.monthlyPremium} OTK/month)</Text>
            </TouchableOpacity>
          </View>
        )}

        {showFileClaim && fileClaimPool === selectedPool.id && renderFileClaimForm()}
      </ScrollView>
    );
  };

  const renderFileClaimForm = () => (
    <>
      <Text style={s.section}>File a Claim</Text>
      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Reason</Text>
        <TextInput
          style={[s.input, s.descInput]}
          value={claimReason}
          onChangeText={setClaimReason}
          placeholder="Describe what happened and why you need coverage"
          placeholderTextColor={t.text.muted}
          multiline
        />
      </View>
      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Amount (OTK)</Text>
        <TextInput
          style={s.input}
          value={claimAmount}
          onChangeText={setClaimAmount}
          placeholder="e.g., 2500"
          placeholderTextColor={t.text.muted}
          keyboardType="numeric"
        />
      </View>
      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Evidence Hash (optional)</Text>
        <TextInput
          style={s.input}
          value={claimEvidence}
          onChangeText={setClaimEvidence}
          placeholder="IPFS or on-chain hash of supporting evidence"
          placeholderTextColor={t.text.muted}
        />
      </View>
      <TouchableOpacity
        style={[s.submitBtn, loading && { opacity: 0.5 }]}
        onPress={handleFileClaim}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.submitBtnText}>Submit Claim</Text>
        )}
      </TouchableOpacity>
    </>
  );

  const renderBrowse = () => (
    <ScrollView>
      <View style={s.heroCard}>
        <Text style={s.heroTitle}>Mutual Aid Insurance</Text>
        <Text style={s.heroSubtitle}>
          Community pools where members protect each other. No corporations, no profit motive — just neighbors helping neighbors.
        </Text>
      </View>

      {renderTypeFilter()}

      <Text style={s.section}>Available Pools ({filteredPools.length})</Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} color={t.accent.blue} />
      ) : filteredPools.length === 0 ? (
        <Text style={s.emptyText}>No pools found</Text>
      ) : (
        filteredPools.map((pool) => (
          <TouchableOpacity
            key={pool.id}
            style={s.card}
            onPress={() => setSelectedPool(pool)}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Text style={[s.cardTitle, { flex: 1 }]}>{pool.name}</Text>
              <View style={[s.typeBadge, { backgroundColor: POOL_TYPE_COLORS[pool.type] }]}>
                <Text style={s.typeText}>{POOL_TYPE_ICONS[pool.type]}</Text>
              </View>
            </View>
            <Text style={s.cardDesc} numberOfLines={2}>{pool.description}</Text>
            <View style={s.cardMeta}>
              <View style={s.metaItem}>
                <Text style={s.metaLabel}>Members</Text>
                <Text style={s.metaValue}>{pool.members}</Text>
              </View>
              <View style={s.metaItem}>
                <Text style={s.metaLabel}>Balance</Text>
                <Text style={s.metaValue}>{pool.balance.toLocaleString()} OTK</Text>
              </View>
              <View style={s.premiumBadge}>
                <Text style={s.premiumText}>{pool.monthlyPremium} OTK/mo</Text>
              </View>
            </View>
            {pool.joined && (
              <View style={[s.badge, { backgroundColor: '#4caf50' }]}>
                <Text style={s.badgeText}>Joined</Text>
              </View>
            )}
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );

  const renderMyPools = () => (
    <ScrollView>
      <Text style={s.section}>My Pools ({myPools.length})</Text>

      {myPools.length === 0 ? (
        <Text style={s.emptyText}>You haven't joined any pools yet.</Text>
      ) : (
        myPools.map((mp) => (
          <View key={mp.poolId} style={s.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Text style={s.cardTitle}>{mp.poolName}</Text>
              <View style={[s.typeBadge, { backgroundColor: POOL_TYPE_COLORS[mp.type] }]}>
                <Text style={s.typeText}>{POOL_TYPE_ICONS[mp.type]}</Text>
              </View>
            </View>
            <View style={s.cardMeta}>
              <View style={s.metaItem}>
                <Text style={s.metaLabel}>Premium Paid</Text>
                <Text style={s.metaValue}>{mp.premiumPaid} OTK</Text>
              </View>
              <View style={s.metaItem}>
                <Text style={s.metaLabel}>Member Since</Text>
                <Text style={s.metaValue}>{mp.memberSince}</Text>
              </View>
              <View style={s.metaItem}>
                <Text style={s.metaLabel}>Claims</Text>
                <Text style={s.metaValue}>{mp.claimsFiled}</Text>
              </View>
            </View>
            <View style={s.actionRow}>
              <TouchableOpacity
                style={s.actionBtn}
                onPress={() => {
                  setFileClaimPool(mp.poolId);
                  setShowFileClaim(true);
                  setActiveTab('claims');
                }}
              >
                <Text style={s.actionBtnText}>File Claim</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderClaims = () => (
    <ScrollView>
      {showFileClaim && fileClaimPool && renderFileClaimForm()}

      <Text style={s.section}>All Claims ({claims.length})</Text>

      {claims.length === 0 ? (
        <Text style={s.emptyText}>No claims filed.</Text>
      ) : (
        claims.map((claim) => (
          <View key={claim.id} style={s.card}>
            <Text style={[s.metaLabel, { marginBottom: 4 }]}>{claim.poolName}</Text>
            <Text style={s.cardTitle}>{claim.reason}</Text>
            <Text style={s.claimantText}>Claimant: {claim.claimant}</Text>
            <View style={s.cardMeta}>
              <View style={s.metaItem}>
                <Text style={s.metaLabel}>Amount</Text>
                <Text style={s.metaValue}>{claim.amount.toLocaleString()} OTK</Text>
              </View>
              <View style={[s.badge, { backgroundColor: STATUS_COLORS[claim.status], marginTop: 0 }]}>
                <Text style={s.badgeText}>{claim.status}</Text>
              </View>
            </View>
            {claim.status === 'voting' && (
              <>
                <View style={s.progressBar}>
                  <View
                    style={[
                      s.progressFill,
                      {
                        backgroundColor: '#4caf50',
                        width: `${((claim.votesFor + claim.votesAgainst) / claim.totalVoters) * 100}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[s.metaLabel, { marginTop: 4 }]}>
                  {claim.votesFor} approve / {claim.votesAgainst} reject ({claim.totalVoters} eligible)
                </Text>
              </>
            )}
            <Text style={s.evidenceText}>Evidence: {claim.evidenceHash}</Text>
            <Text style={[s.metaLabel, { marginTop: 4 }]}>Filed: {claim.filedDate}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderVote = () => (
    <ScrollView>
      <Text style={s.section}>Claims Awaiting Your Vote ({votingClaims.length})</Text>

      {votingClaims.length === 0 ? (
        <Text style={s.emptyText}>No claims need your vote right now.</Text>
      ) : (
        votingClaims.map((claim) => (
          <View key={claim.id} style={s.card}>
            <Text style={[s.metaLabel, { marginBottom: 4 }]}>{claim.poolName}</Text>
            <Text style={s.cardTitle}>{claim.reason}</Text>
            <Text style={s.claimantText}>Claimant: {claim.claimant}</Text>
            <View style={s.cardMeta}>
              <View style={s.metaItem}>
                <Text style={s.metaLabel}>Requesting</Text>
                <Text style={s.metaValue}>{claim.amount.toLocaleString()} OTK</Text>
              </View>
            </View>
            <View style={s.progressBar}>
              <View
                style={[
                  s.progressFill,
                  {
                    backgroundColor: '#4caf50',
                    width: `${((claim.votesFor + claim.votesAgainst) / claim.totalVoters) * 100}%`,
                  },
                ]}
              />
            </View>
            <Text style={[s.metaLabel, { marginTop: 4 }]}>
              {claim.votesFor} approve / {claim.votesAgainst} reject ({claim.totalVoters} eligible)
            </Text>
            <Text style={s.evidenceText}>Evidence: {claim.evidenceHash}</Text>

            {claim.myVote !== null ? (
              <View style={[s.badge, { backgroundColor: claim.myVote === 'for' ? '#4caf50' : '#f44336' }]}>
                <Text style={s.badgeText}>You voted: {claim.myVote === 'for' ? 'Approve' : 'Reject'}</Text>
              </View>
            ) : (
              <View style={s.voteRow}>
                <TouchableOpacity
                  style={[s.voteBtn, { backgroundColor: '#4caf50' }]}
                  onPress={() => handleVote(claim, 'for')}
                  disabled={loading}
                >
                  <Text style={s.voteBtnText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.voteBtn, { backgroundColor: '#f44336' }]}
                  onPress={() => handleVote(claim, 'against')}
                  disabled={loading}
                >
                  <Text style={s.voteBtnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderContent = () => {
    if (selectedPool && activeTab === 'browse') return renderPoolDetail();
    switch (activeTab) {
      case 'browse': return renderBrowse();
      case 'my-pools': return renderMyPools();
      case 'claims': return renderClaims();
      case 'vote': return renderVote();
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Insurance Pools</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={s.tabRow}>
        {renderTab('browse', 'Browse')}
        {renderTab('my-pools', 'My Pools')}
        {renderTab('claims', 'Claims')}
        {renderTab('vote', 'Vote')}
      </View>

      {renderContent()}
    </SafeAreaView>
  );
}
