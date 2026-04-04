import { fonts } from '../utils/theme';
/**
 * Donor Wall Screen — Public recognition of donors to community causes.
 *
 * Celebrates generosity by displaying donors, the causes they support,
 * and the tangible impact of their contributions. All verified on-chain.
 * "Generosity, recognized and amplified."
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

interface Donor {
  id: string;
  name: string;
  icon: string;
  totalDonated: number;
  causeCount: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  topCause: string;
  lastDonation: string;
}

interface Cause {
  id: string;
  title: string;
  icon: string;
  goal: number;
  raised: number;
  donors: number;
  description: string;
  color: string;
}

interface ImpactMetric {
  label: string;
  value: string;
  icon: string;
  description: string;
}

const TIER_CONFIG = {
  bronze: { label: 'Bronze', color: '#cd7f32', min: 0 },
  silver: { label: 'Silver', color: '#c0c0c0', min: 500 },
  gold: { label: 'Gold', color: '#ffd700', min: 2000 },
  platinum: { label: 'Platinum', color: '#e5e4e2', min: 5000 },
};

const DEMO_DONORS: Donor[] = [
  { id: 'd1', name: 'Elena Rodriguez', icon: '\u{1F469}', totalDonated: 8500, causeCount: 7, tier: 'platinum', topCause: 'Education Fund', lastDonation: '2026-03-28' },
  { id: 'd2', name: 'Akira Tanaka', icon: '\u{1F468}', totalDonated: 4200, causeCount: 5, tier: 'gold', topCause: 'Community Garden', lastDonation: '2026-03-27' },
  { id: 'd3', name: 'Maya Krishnan', icon: '\u{1F469}', totalDonated: 3100, causeCount: 4, tier: 'gold', topCause: 'Youth Programs', lastDonation: '2026-03-25' },
  { id: 'd4', name: 'Carlos Mendez', icon: '\u{1F468}', totalDonated: 1800, causeCount: 3, tier: 'silver', topCause: 'Health Clinic', lastDonation: '2026-03-26' },
  { id: 'd5', name: 'Preet Singh', icon: '\u{1F9D4}', totalDonated: 1200, causeCount: 3, tier: 'silver', topCause: 'Elder Care', lastDonation: '2026-03-24' },
  { id: 'd6', name: 'Fatima Al-Rashid', icon: '\u{1F469}', totalDonated: 600, causeCount: 2, tier: 'silver', topCause: 'Language School', lastDonation: '2026-03-23' },
  { id: 'd7', name: 'Liam Walsh', icon: '\u{1F468}', totalDonated: 350, causeCount: 2, tier: 'bronze', topCause: 'Community Garden', lastDonation: '2026-03-22' },
  { id: 'd8', name: 'Amara Okafor', icon: '\u{1F469}', totalDonated: 280, causeCount: 1, tier: 'bronze', topCause: 'Wellness Center', lastDonation: '2026-03-20' },
];

const DEMO_CAUSES: Cause[] = [
  { id: 'c1', title: 'Education Fund', icon: '\u{1F4DA}', goal: 10000, raised: 7200, donors: 24, description: 'Scholarships and learning materials for underprivileged youth.', color: '#3b82f6' },
  { id: 'c2', title: 'Community Garden', icon: '\u{1F33F}', goal: 3000, raised: 2800, donors: 18, description: 'Sustainable food production for 50 local families.', color: '#22c55e' },
  { id: 'c3', title: 'Health Clinic Equipment', icon: '\u{1F3E5}', goal: 8000, raised: 4500, donors: 15, description: 'Medical equipment for the community health clinic.', color: '#ef4444' },
  { id: 'c4', title: 'Youth Programs', icon: '\u{1F3A8}', goal: 5000, raised: 3400, donors: 20, description: 'After-school arts, sports, and coding programs.', color: '#f59e0b' },
  { id: 'c5', title: 'Elder Care Support', icon: '\u{1F9D3}', goal: 4000, raised: 2100, donors: 12, description: 'Daily support services for elderly community members.', color: '#8b5cf6' },
];

const IMPACT_METRICS: ImpactMetric[] = [
  { label: 'Students Supported', value: '47', icon: '\u{1F393}', description: 'Through education fund scholarships' },
  { label: 'Families Fed', value: '50', icon: '\u{1F96C}', description: 'By the community garden program' },
  { label: 'Health Screenings', value: '312', icon: '\u{1FA7A}', description: 'Provided at the community clinic' },
  { label: 'Youth Enrolled', value: '85', icon: '\u{1F3AF}', description: 'In after-school programs' },
  { label: 'Elders Served', value: '23', icon: '\u{1F49C}', description: 'Daily elder care recipients' },
  { label: 'Total OTK Donated', value: '20,030', icon: '\u{1F4B0}', description: 'Community generosity in action' },
];

export function DonorWallScreen({ onClose }: Props) {
  const t = useTheme();
  const { demoMode } = useWalletStore();
  const [activeTab, setActiveTab] = useState<'wall' | 'causes' | 'impact'>('wall');

  const handleDonate = (cause: Cause) => {
    Alert.alert('Donate', `Support "${cause.title}"\n\nDonation flow coming soon. All donations are verified on-chain.`);
  };

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    demoTag: { backgroundColor: t.accent.yellow + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'center', marginBottom: 16 },
    demoText: { color: t.accent.yellow, fontSize: fonts.sm, fontWeight: fonts.bold },
    tabRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: t.bg.card, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    quote: { color: t.text.secondary, fontSize: fonts.md, fontStyle: 'italic', textAlign: 'center', lineHeight: 22, marginBottom: 20, paddingHorizontal: 12 },
    donorCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
    donorRank: { width: 28, color: t.text.muted, fontSize: fonts.md, fontWeight: fonts.heavy, textAlign: 'center' },
    donorIcon: { fontSize: fonts.xxxl },
    donorInfo: { flex: 1 },
    donorName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    donorMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    donorAmount: { alignItems: 'flex-end' },
    donorOTK: { fontSize: fonts.lg, fontWeight: fonts.heavy },
    tierBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
    tierText: { fontSize: fonts.xs, fontWeight: fonts.bold, color: '#fff' },
    causeCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    causeHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    causeIcon: { fontSize: fonts.xxxl },
    causeTitle: { flex: 1, fontSize: fonts.md, fontWeight: fonts.bold },
    causeDonors: { color: t.text.muted, fontSize: fonts.sm },
    causeDesc: { color: t.text.secondary, fontSize: fonts.sm, lineHeight: 18, marginBottom: 10 },
    causeBarBg: { height: 8, backgroundColor: t.border, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
    causeBarFill: { height: 8, borderRadius: 4 },
    causeProgress: { flexDirection: 'row', justifyContent: 'space-between' },
    causeRaised: { fontSize: fonts.sm, fontWeight: fonts.bold },
    causeGoal: { color: t.text.muted, fontSize: fonts.sm },
    donateBtn: { backgroundColor: t.accent.green, borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 10 },
    donateBtnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    impactCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 14 },
    impactIcon: { fontSize: fonts.hero },
    impactInfo: { flex: 1 },
    impactValue: { color: t.text.primary, fontSize: fonts.xxl, fontWeight: fonts.heavy },
    impactLabel: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold, marginTop: 2 },
    impactDesc: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.heavy, marginBottom: 12 },
  }), [t]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Donor Wall</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {demoMode && (
          <View style={s.demoTag}>
            <Text style={s.demoText}>DEMO MODE</Text>
          </View>
        )}

        <Text style={s.quote}>"Generosity, recognized and amplified."</Text>

        <View style={s.tabRow}>
          {(['wall', 'causes', 'impact'] as const).map((tab) => (
            <TouchableOpacity key={tab} style={[s.tab, activeTab === tab && s.tabActive]} onPress={() => setActiveTab(tab)}>
              <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                {tab === 'wall' ? 'Wall' : tab === 'causes' ? 'Causes' : 'Impact'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'wall' && (
          <>
            <Text style={s.sectionTitle}>Top Donors</Text>
            {DEMO_DONORS.map((donor, idx) => {
              const tier = TIER_CONFIG[donor.tier];
              return (
                <View key={donor.id} style={s.donorCard}>
                  <Text style={s.donorRank}>#{idx + 1}</Text>
                  <Text style={s.donorIcon}>{donor.icon}</Text>
                  <View style={s.donorInfo}>
                    <Text style={s.donorName}>{donor.name}</Text>
                    <Text style={s.donorMeta}>{donor.causeCount} causes · Top: {donor.topCause}</Text>
                  </View>
                  <View style={s.donorAmount}>
                    <Text style={[s.donorOTK, { color: tier.color }]}>{donor.totalDonated}</Text>
                    <View style={[s.tierBadge, { backgroundColor: tier.color }]}>
                      <Text style={s.tierText}>{tier.label}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {activeTab === 'causes' && (
          <>
            <Text style={s.sectionTitle}>Active Causes</Text>
            {DEMO_CAUSES.map(cause => {
              const pct = Math.min(cause.raised / cause.goal, 1);
              return (
                <View key={cause.id} style={s.causeCard}>
                  <View style={s.causeHeader}>
                    <Text style={s.causeIcon}>{cause.icon}</Text>
                    <Text style={[s.causeTitle, { color: cause.color }]}>{cause.title}</Text>
                    <Text style={s.causeDonors}>{cause.donors} donors</Text>
                  </View>
                  <Text style={s.causeDesc}>{cause.description}</Text>
                  <View style={s.causeBarBg}>
                    <View style={[s.causeBarFill, { width: `${pct * 100}%`, backgroundColor: cause.color }]} />
                  </View>
                  <View style={s.causeProgress}>
                    <Text style={[s.causeRaised, { color: cause.color }]}>{cause.raised} OTK</Text>
                    <Text style={s.causeGoal}>Goal: {cause.goal} OTK ({Math.round(pct * 100)}%)</Text>
                  </View>
                  <TouchableOpacity style={s.donateBtn} onPress={() => handleDonate(cause)}>
                    <Text style={s.donateBtnText}>Donate</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </>
        )}

        {activeTab === 'impact' && (
          <>
            <Text style={s.sectionTitle}>Community Impact</Text>
            {IMPACT_METRICS.map(metric => (
              <View key={metric.label} style={s.impactCard}>
                <Text style={s.impactIcon}>{metric.icon}</Text>
                <View style={s.impactInfo}>
                  <Text style={s.impactValue}>{metric.value}</Text>
                  <Text style={s.impactLabel}>{metric.label}</Text>
                  <Text style={s.impactDesc}>{metric.description}</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
