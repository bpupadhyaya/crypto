/**
 * Petition Screen — Art VI: Community petitions, collective action, signature campaigns.
 *
 * One Universal ID = one signature. Petitions empower communities to demand change
 * through verified collective voice, not money or influence.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator, FlatList,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

interface Petition {
  id: string;
  title: string;
  description: string;
  creator: string;
  target: string;
  signaturesNeeded: number;
  signaturesCollected: number;
  deadline: string;
  status: 'active' | 'delivered' | 'expired';
  outcome?: string;
  signed: boolean;
  milestoneReached: number; // 0, 25, 50, 75, 100
}

interface Props {
  onClose: () => void;
}

type TabKey = 'active' | 'create' | 'signed' | 'delivered';

const TAB_LABELS: Record<TabKey, string> = {
  active: 'Active',
  create: 'Create',
  signed: 'My Signed',
  delivered: 'Delivered',
};

const MILESTONE_THRESHOLDS = [25, 50, 75, 100];

const DEMO_PETITIONS: Petition[] = [
  {
    id: 'pet-1',
    title: 'Universal Free School Meals for All Children',
    description: 'Every child deserves nutrition regardless of family income. We petition local governments to provide free school meals universally, removing the stigma of means-testing and ensuring no child learns hungry.',
    creator: 'openchain1abc...xyz',
    target: 'Local Education Authorities',
    signaturesNeeded: 5000,
    signaturesCollected: 3842,
    deadline: '2026-06-15',
    status: 'active',
    signed: true,
    milestoneReached: 75,
  },
  {
    id: 'pet-2',
    title: 'Community Garden on Vacant Lot — Pine Street',
    description: 'The vacant lot at 142 Pine Street has sat unused for 8 years. We petition the city to convert it into a community garden, providing fresh food access and a gathering space for the neighborhood.',
    creator: 'openchain1def...uvw',
    target: 'City Planning Department',
    signaturesNeeded: 1000,
    signaturesCollected: 612,
    deadline: '2026-05-01',
    status: 'active',
    signed: true,
    milestoneReached: 50,
  },
  {
    id: 'pet-3',
    title: 'Extend Public Library Hours to Include Evenings',
    description: 'Working families cannot access the library during current hours (9am-5pm). We petition for extended hours until 9pm on weekdays so all community members can benefit from this essential resource.',
    creator: 'openchain1ghi...rst',
    target: 'Public Library Board',
    signaturesNeeded: 2000,
    signaturesCollected: 487,
    deadline: '2026-07-30',
    status: 'active',
    signed: false,
    milestoneReached: 25,
  },
  {
    id: 'pet-4',
    title: 'Safe Crosswalks Near Riverside Elementary',
    description: 'Three near-misses this year alone. We petitioned the city to install proper crosswalks, speed bumps, and crossing guards near Riverside Elementary School.',
    creator: 'openchain1jkl...opq',
    target: 'City Transportation Department',
    signaturesNeeded: 3000,
    signaturesCollected: 3000,
    deadline: '2026-01-15',
    status: 'delivered',
    signed: false,
    milestoneReached: 100,
    outcome: 'Approved! Two new crosswalks installed in February 2026. Speed bumps added on Oak Avenue. Crossing guard hired for morning and afternoon shifts.',
  },
];

export function PetitionScreen({ onClose }: Props) {
  const [tab, setTab] = useState<TabKey>('active');
  const [petitions, setPetitions] = useState<Petition[]>(DEMO_PETITIONS);
  const [loading, setLoading] = useState(false);
  const [signing, setSigning] = useState(false);

  // Create form
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newSignaturesNeeded, setNewSignaturesNeeded] = useState('');
  const [newDeadline, setNewDeadline] = useState('');

  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    tabs: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, backgroundColor: t.bg.card, borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.muted, fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: '#fff', fontSize: 13, fontWeight: '700' },
    heroCard: { backgroundColor: t.accent.blue + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, alignItems: 'center', marginBottom: 16 },
    heroEmoji: { fontSize: 40, marginBottom: 12 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: '800', textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 16 },
    petCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    petTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    petMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    petMetaText: { color: t.text.muted, fontSize: 12 },
    progressBar: { height: 8, backgroundColor: t.border, borderRadius: 4, marginTop: 12 },
    progressFill: { height: 8, borderRadius: 4 },
    sigCount: { color: t.text.secondary, fontSize: 13, fontWeight: '600', marginTop: 6 },
    milestoneRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
    milestoneDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    milestoneDotText: { fontSize: 10, fontWeight: '700', color: '#fff' },
    signBtn: { backgroundColor: t.accent.blue, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
    signBtnSigned: { backgroundColor: '#4caf50' },
    signBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    targetLabel: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    deadlineLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    outcomeCard: { backgroundColor: '#4caf50' + '15', borderRadius: 12, padding: 14, marginTop: 12 },
    outcomeTitle: { color: '#4caf50', fontSize: 13, fontWeight: '700' },
    outcomeText: { color: t.text.secondary, fontSize: 13, lineHeight: 20, marginTop: 4 },
    inputCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 12 },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: '600', marginBottom: 8 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15 },
    descInput: { minHeight: 100, textAlignVertical: 'top' },
    submitBtn: { backgroundColor: t.accent.blue, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginHorizontal: 20, marginTop: 24, marginBottom: 32 },
    submitBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40, marginHorizontal: 40 },
    signedBadge: { color: '#4caf50', fontSize: 12, fontWeight: '700', marginTop: 4 },
  }), [t]);

  const activePetitions = useMemo(() => petitions.filter((p) => p.status === 'active'), [petitions]);
  const signedPetitions = useMemo(() => petitions.filter((p) => p.signed), [petitions]);
  const deliveredPetitions = useMemo(() => petitions.filter((p) => p.status === 'delivered'), [petitions]);

  const getProgressColor = useCallback((pct: number) => {
    if (pct >= 100) return '#4caf50';
    if (pct >= 75) return '#8bc34a';
    if (pct >= 50) return '#ff9800';
    if (pct >= 25) return '#ffc107';
    return t.accent.blue;
  }, [t]);

  const handleSign = useCallback(async (petitionId: string) => {
    const pet = petitions.find((p) => p.id === petitionId);
    if (!pet) return;
    if (pet.signed) {
      Alert.alert('Already Signed', 'You have already signed this petition. One UID = one signature.');
      return;
    }
    setSigning(true);
    if (demoMode) {
      await new Promise((r) => setTimeout(r, 1200));
      setPetitions((prev) =>
        prev.map((p) => {
          if (p.id !== petitionId) return p;
          const newCollected = p.signaturesCollected + 1;
          const pct = (newCollected / p.signaturesNeeded) * 100;
          let milestone = p.milestoneReached;
          for (const th of MILESTONE_THRESHOLDS) {
            if (pct >= th && th > milestone) milestone = th;
          }
          return { ...p, signaturesCollected: newCollected, signed: true, milestoneReached: milestone };
        })
      );
      Alert.alert('Petition Signed', 'Your verified signature has been added. Thank you for taking action!');
    } else {
      Alert.alert('Coming Soon', 'On-chain petition signing will be available when the network launches.');
    }
    setSigning(false);
  }, [petitions, demoMode]);

  const handleCreatePetition = useCallback(async () => {
    if (!newTitle.trim() || !newDescription.trim() || !newTarget.trim()) {
      Alert.alert('Required', 'Please fill in title, description, and target.');
      return;
    }
    const needed = parseInt(newSignaturesNeeded, 10);
    if (!needed || needed < 10) {
      Alert.alert('Invalid', 'Signatures needed must be at least 10.');
      return;
    }
    setLoading(true);
    if (demoMode) {
      await new Promise((r) => setTimeout(r, 1500));
      const newPet: Petition = {
        id: `pet-${Date.now()}`,
        title: newTitle.trim(),
        description: newDescription.trim(),
        creator: 'you',
        target: newTarget.trim(),
        signaturesNeeded: needed,
        signaturesCollected: 1, // creator auto-signs
        deadline: newDeadline.trim() || '2026-12-31',
        status: 'active',
        signed: true,
        milestoneReached: 0,
      };
      setPetitions((prev) => [newPet, ...prev]);
      Alert.alert('Petition Created', 'Your petition is now live. Share it with your community!');
      setNewTitle('');
      setNewDescription('');
      setNewTarget('');
      setNewSignaturesNeeded('');
      setNewDeadline('');
      setTab('active');
    } else {
      Alert.alert('Coming Soon', 'On-chain petition creation will be available when the network launches.');
    }
    setLoading(false);
  }, [newTitle, newDescription, newTarget, newSignaturesNeeded, newDeadline, demoMode]);

  const renderMilestones = useCallback((petition: Petition) => {
    const pct = (petition.signaturesCollected / petition.signaturesNeeded) * 100;
    return (
      <View style={s.milestoneRow}>
        {MILESTONE_THRESHOLDS.map((th) => (
          <View
            key={th}
            style={[
              s.milestoneDot,
              { backgroundColor: pct >= th ? getProgressColor(th) : t.border },
            ]}
          >
            <Text style={s.milestoneDotText}>{th}</Text>
          </View>
        ))}
      </View>
    );
  }, [s, t, getProgressColor]);

  const renderPetitionCard = useCallback((petition: Petition, showSignBtn: boolean) => {
    const pct = Math.min(100, (petition.signaturesCollected / petition.signaturesNeeded) * 100);
    return (
      <View key={petition.id} style={s.petCard}>
        <Text style={s.petTitle}>{petition.title}</Text>
        <Text style={s.targetLabel}>Target: {petition.target}</Text>
        <Text style={s.deadlineLabel}>Deadline: {petition.deadline}</Text>
        {petition.signed && <Text style={s.signedBadge}>You signed this petition</Text>}
        <View style={s.petMeta}>
          <Text style={s.petMetaText}>by {petition.creator}</Text>
          <Text style={s.petMetaText}>{petition.status.toUpperCase()}</Text>
        </View>
        <View style={s.progressBar}>
          <View style={[s.progressFill, { width: `${pct}%`, backgroundColor: getProgressColor(pct) }]} />
        </View>
        <Text style={s.sigCount}>
          {petition.signaturesCollected.toLocaleString()} / {petition.signaturesNeeded.toLocaleString()} signatures ({Math.round(pct)}%)
        </Text>
        {renderMilestones(petition)}
        {petition.status === 'delivered' && petition.outcome && (
          <View style={s.outcomeCard}>
            <Text style={s.outcomeTitle}>Outcome</Text>
            <Text style={s.outcomeText}>{petition.outcome}</Text>
          </View>
        )}
        {showSignBtn && petition.status === 'active' && (
          <TouchableOpacity
            style={[s.signBtn, petition.signed && s.signBtnSigned]}
            onPress={() => handleSign(petition.id)}
            disabled={petition.signed || signing}
          >
            {signing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={s.signBtnText}>{petition.signed ? 'Signed' : 'Sign This Petition'}</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  }, [s, getProgressColor, renderMilestones, handleSign, signing]);

  const renderActiveTab = () => (
    <ScrollView>
      <View style={s.heroCard}>
        <Text style={s.heroEmoji}>{'✊'}</Text>
        <Text style={s.heroTitle}>Community Petitions</Text>
        <Text style={s.heroSubtitle}>
          One Universal ID = one verified signature.{'\n'}
          Collective action powered by truth, not bots.
        </Text>
      </View>
      <Text style={s.section}>Active Petitions ({activePetitions.length})</Text>
      {activePetitions.length === 0 ? (
        <Text style={s.emptyText}>No active petitions. Be the first to start one!</Text>
      ) : (
        activePetitions.map((p) => renderPetitionCard(p, true))
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderCreateTab = () => (
    <ScrollView>
      <View style={s.heroCard}>
        <Text style={s.heroEmoji}>{'📝'}</Text>
        <Text style={s.heroTitle}>Start a Petition</Text>
        <Text style={s.heroSubtitle}>
          Give your community a voice. Define your cause,{'\n'}
          set a goal, and let verified citizens sign.
        </Text>
      </View>
      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Petition Title</Text>
        <TextInput
          style={s.input}
          value={newTitle}
          onChangeText={setNewTitle}
          placeholder="e.g., Safe bike lanes on Main Street"
          placeholderTextColor={t.text.muted}
        />
      </View>
      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Description</Text>
        <TextInput
          style={[s.input, s.descInput]}
          value={newDescription}
          onChangeText={setNewDescription}
          placeholder="Explain why this matters and what change you seek..."
          placeholderTextColor={t.text.muted}
          multiline
        />
      </View>
      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Target (who should act)</Text>
        <TextInput
          style={s.input}
          value={newTarget}
          onChangeText={setNewTarget}
          placeholder="e.g., City Council, School Board"
          placeholderTextColor={t.text.muted}
        />
      </View>
      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Signatures Needed</Text>
        <TextInput
          style={s.input}
          value={newSignaturesNeeded}
          onChangeText={setNewSignaturesNeeded}
          placeholder="e.g., 1000"
          placeholderTextColor={t.text.muted}
          keyboardType="numeric"
        />
      </View>
      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Deadline (YYYY-MM-DD)</Text>
        <TextInput
          style={s.input}
          value={newDeadline}
          onChangeText={setNewDeadline}
          placeholder="e.g., 2026-12-31"
          placeholderTextColor={t.text.muted}
        />
      </View>
      <TouchableOpacity style={s.submitBtn} onPress={handleCreatePetition} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={s.submitBtnText}>Launch Petition</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  const renderSignedTab = () => (
    <ScrollView>
      <Text style={s.section}>Petitions You Signed ({signedPetitions.length})</Text>
      {signedPetitions.length === 0 ? (
        <Text style={s.emptyText}>You have not signed any petitions yet. Browse active petitions to lend your voice.</Text>
      ) : (
        signedPetitions.map((p) => renderPetitionCard(p, false))
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderDeliveredTab = () => (
    <ScrollView>
      <Text style={s.section}>Delivered Petitions ({deliveredPetitions.length})</Text>
      {deliveredPetitions.length === 0 ? (
        <Text style={s.emptyText}>No delivered petitions yet. When a petition reaches its goal and is delivered, outcomes will appear here.</Text>
      ) : (
        deliveredPetitions.map((p) => renderPetitionCard(p, false))
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Petitions</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={s.tabs}>
        {(Object.keys(TAB_LABELS) as TabKey[]).map((key) => (
          <TouchableOpacity
            key={key}
            style={[s.tab, tab === key && s.tabActive]}
            onPress={() => setTab(key)}
          >
            <Text style={tab === key ? s.tabTextActive : s.tabText}>{TAB_LABELS[key]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'active' && renderActiveTab()}
      {tab === 'create' && renderCreateTab()}
      {tab === 'signed' && renderSignedTab()}
      {tab === 'delivered' && renderDeliveredTab()}
    </SafeAreaView>
  );
}
