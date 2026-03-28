/**
 * Milestone Definitions Screen — Browse and submit regional milestones.
 *
 * "Milestones may vary by region" — Human Constitution, Article III
 *
 * Features:
 *   - Browse milestones by channel (nurture, education, health, community)
 *   - Filter by region (global, south-asia, east-africa, europe, etc.)
 *   - See milestone requirements and OTK mint amount
 *   - Submit a milestone for oracle verification
 *   - View submitted milestones and their status
 *   - Demo mode with sample milestones in various states
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput, Alert, FlatList,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';
import {
  getMilestones,
  getChannels,
  getChannelDisplay,
  getAvailableRegions,
  getRegionDisplay,
  type MilestoneDefinition,
  type MilestoneChannel,
  type MilestoneRegion,
  type MilestoneStatus,
  type SubmittedMilestone,
} from '../core/milestones/regional';

interface Props {
  onClose: () => void;
}

// Demo submitted milestones for demo mode
const DEMO_SUBMISSIONS: SubmittedMilestone[] = [
  { id: 'sub-1', milestoneId: 'n-birth', submittedAt: Date.now() - 86400000 * 30, status: 'verified', verifiedAt: Date.now() - 86400000 * 25, verifiedBy: 'oracle-1' },
  { id: 'sub-2', milestoneId: 'n-first-year', submittedAt: Date.now() - 86400000 * 10, status: 'verified', verifiedAt: Date.now() - 86400000 * 7, verifiedBy: 'oracle-1' },
  { id: 'sub-3', milestoneId: 'e-read', submittedAt: Date.now() - 86400000 * 3, status: 'submitted', evidence: 'Reading assessment from school' },
  { id: 'sub-4', milestoneId: 'h-vaccine', submittedAt: Date.now() - 86400000, status: 'submitted', evidence: 'Vaccination card photo' },
  { id: 'sub-5', milestoneId: 'c-volunteer-100', submittedAt: Date.now() - 86400000 * 60, status: 'rejected' },
];

type TabView = 'browse' | 'my-milestones';

function statusColor(status: MilestoneStatus): string {
  switch (status) {
    case 'verified': return '#22c55e';
    case 'submitted': return '#eab308';
    case 'rejected': return '#ef4444';
    default: return '#606070';
  }
}

function statusLabel(status: MilestoneStatus): string {
  switch (status) {
    case 'verified': return 'Verified';
    case 'submitted': return 'Pending';
    case 'rejected': return 'Rejected';
    default: return 'Available';
  }
}

export function MilestoneDefinitionsScreen({ onClose }: Props) {
  const t = useTheme();
  const demoMode = useWalletStore((s) => s.demoMode);
  const [tab, setTab] = useState<TabView>('browse');
  const [selectedChannel, setSelectedChannel] = useState<MilestoneChannel | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<MilestoneRegion>('global');
  const [submissions, setSubmissions] = useState<SubmittedMilestone[]>(demoMode ? DEMO_SUBMISSIONS : []);
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneDefinition | null>(null);
  const [evidence, setEvidence] = useState('');

  const milestones = useMemo(() => {
    return getMilestones({
      region: selectedRegion,
      channel: selectedChannel ?? undefined,
    });
  }, [selectedRegion, selectedChannel]);

  const submittedIds = useMemo(() => new Set(submissions.map((s) => s.milestoneId)), [submissions]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16, fontWeight: '600' },
    tabRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, gap: 8 },
    tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: t.border },
    tabBtnActive: { backgroundColor: t.accent.green },
    tabText: { color: t.text.secondary, fontSize: 14, fontWeight: '600' },
    tabTextActive: { color: t.bg.primary },
    filterRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8, gap: 6 },
    filterChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: t.border },
    filterChipActive: { backgroundColor: t.accent.blue },
    filterText: { color: t.text.secondary, fontSize: 12, fontWeight: '600' },
    filterTextActive: { color: '#fff' },
    sectionLabel: { color: t.text.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 16, marginTop: 12, marginBottom: 6 },
    card: { backgroundColor: t.bg.card, marginHorizontal: 16, borderRadius: 14, padding: 14, marginBottom: 10 },
    cardTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    cardDesc: { color: t.text.muted, fontSize: 13, marginTop: 4, lineHeight: 18 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' },
    mintBadge: { backgroundColor: t.accent.green + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    mintText: { color: t.accent.green, fontSize: 12, fontWeight: '700' },
    verifyBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    verifyText: { fontSize: 11, fontWeight: '600' },
    channelIcon: { fontSize: 18, marginRight: 6 },
    submitBtn: { backgroundColor: t.accent.green, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
    submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    disabledBtn: { backgroundColor: t.border },
    input: { backgroundColor: t.bg.card, borderRadius: 10, padding: 12, color: t.text.primary, fontSize: 14, marginTop: 8, minHeight: 60, textAlignVertical: 'top' },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40 },
    detailOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: t.bg.primary, padding: 16 },
    detailTitle: { color: t.text.primary, fontSize: 22, fontWeight: '800', marginTop: 16, marginBottom: 8 },
    detailDesc: { color: t.text.secondary, fontSize: 15, lineHeight: 22, marginBottom: 16 },
    detailMeta: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    metaChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: t.border },
    metaText: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
  }), [t]);

  const handleSubmit = useCallback((milestone: MilestoneDefinition) => {
    if (!evidence.trim()) {
      Alert.alert('Evidence Required', 'Please describe the evidence for this milestone.');
      return;
    }
    const submission: SubmittedMilestone = {
      id: `sub-${Date.now()}`,
      milestoneId: milestone.id,
      submittedAt: Date.now(),
      status: 'submitted',
      evidence: evidence.trim(),
    };
    setSubmissions((prev) => [...prev, submission]);
    setEvidence('');
    setSelectedMilestone(null);
    Alert.alert('Submitted', `Your milestone "${milestone.title}" has been submitted to the oracle for verification.`);
  }, [evidence]);

  // ─── Milestone Detail View ───

  if (selectedMilestone) {
    const alreadySubmitted = submittedIds.has(selectedMilestone.id);
    const channelInfo = getChannelDisplay(selectedMilestone.channel);
    return (
      <SafeAreaView style={s.container}>
        <ScrollView>
          <View style={s.header}>
            <TouchableOpacity onPress={() => setSelectedMilestone(null)}>
              <Text style={s.closeBtn}>Back</Text>
            </TouchableOpacity>
          </View>

          <View style={{ paddingHorizontal: 16 }}>
            <Text style={{ fontSize: 40, textAlign: 'center', marginTop: 8 }}>{channelInfo.icon}</Text>
            <Text style={s.detailTitle}>{selectedMilestone.title}</Text>
            <Text style={s.detailDesc}>{selectedMilestone.description}</Text>

            <View style={s.detailMeta}>
              <View style={s.metaChip}>
                <Text style={s.metaText}>{getRegionDisplay(selectedMilestone.region)}</Text>
              </View>
              <View style={[s.metaChip, { backgroundColor: t.accent.green + '20' }]}>
                <Text style={[s.metaText, { color: t.accent.green }]}>{selectedMilestone.mintAmount} OTK</Text>
              </View>
              <View style={s.metaChip}>
                <Text style={s.metaText}>{selectedMilestone.verificationMethod}</Text>
              </View>
            </View>

            {alreadySubmitted ? (
              <View style={[s.submitBtn, s.disabledBtn]}>
                <Text style={s.submitBtnText}>Already Submitted</Text>
              </View>
            ) : (
              <>
                <Text style={{ color: t.text.secondary, fontSize: 14, fontWeight: '600', marginTop: 8 }}>
                  Describe your evidence:
                </Text>
                <TextInput
                  style={s.input}
                  placeholder="e.g., Birth certificate, school report, vaccination card..."
                  placeholderTextColor={t.text.muted}
                  value={evidence}
                  onChangeText={setEvidence}
                  multiline
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={s.submitBtn}
                  onPress={() => handleSubmit(selectedMilestone)}
                  activeOpacity={0.7}
                >
                  <Text style={s.submitBtnText}>Submit for Verification</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Main View ───

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Milestones</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs: Browse / My Milestones */}
      <View style={s.tabRow}>
        <TouchableOpacity
          style={[s.tabBtn, tab === 'browse' && s.tabBtnActive]}
          onPress={() => setTab('browse')}
        >
          <Text style={[s.tabText, tab === 'browse' && s.tabTextActive]}>Browse</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tabBtn, tab === 'my-milestones' && s.tabBtnActive]}
          onPress={() => setTab('my-milestones')}
        >
          <Text style={[s.tabText, tab === 'my-milestones' && s.tabTextActive]}>
            My Milestones ({submissions.length})
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'browse' ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Region filter */}
          <Text style={s.sectionLabel}>Region</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
            {getAvailableRegions().filter((r) => {
              // Only show regions that have milestones defined
              return r === 'global' || getMilestones({ region: r }).length > getMilestones({ region: 'global', channel: undefined }).length;
            }).map((region) => (
              <TouchableOpacity
                key={region}
                style={[s.filterChip, selectedRegion === region && s.filterChipActive]}
                onPress={() => setSelectedRegion(region)}
              >
                <Text style={[s.filterText, selectedRegion === region && s.filterTextActive]}>
                  {getRegionDisplay(region)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Channel filter */}
          <Text style={s.sectionLabel}>Channel</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
            <TouchableOpacity
              style={[s.filterChip, selectedChannel === null && s.filterChipActive]}
              onPress={() => setSelectedChannel(null)}
            >
              <Text style={[s.filterText, selectedChannel === null && s.filterTextActive]}>All</Text>
            </TouchableOpacity>
            {getChannels().map((ch) => {
              const info = getChannelDisplay(ch);
              return (
                <TouchableOpacity
                  key={ch}
                  style={[s.filterChip, selectedChannel === ch && s.filterChipActive]}
                  onPress={() => setSelectedChannel(ch)}
                >
                  <Text style={[s.filterText, selectedChannel === ch && s.filterTextActive]}>
                    {info.icon} {info.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Milestone cards */}
          {milestones.length === 0 ? (
            <Text style={s.emptyText}>No milestones defined for this region yet.</Text>
          ) : (
            milestones.map((milestone) => {
              const channelInfo = getChannelDisplay(milestone.channel);
              const isSubmitted = submittedIds.has(milestone.id);
              return (
                <TouchableOpacity
                  key={milestone.id}
                  style={s.card}
                  onPress={() => setSelectedMilestone(milestone)}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={s.channelIcon}>{channelInfo.icon}</Text>
                    <Text style={s.cardTitle}>{milestone.title}</Text>
                    {isSubmitted && (
                      <View style={[s.statusDot, { backgroundColor: '#22c55e', marginLeft: 8 }]} />
                    )}
                  </View>
                  <Text style={s.cardDesc} numberOfLines={2}>{milestone.description}</Text>
                  <View style={s.cardFooter}>
                    <View style={s.mintBadge}>
                      <Text style={s.mintText}>{milestone.mintAmount} OTK</Text>
                    </View>
                    <View style={[s.verifyBadge, { backgroundColor: t.border }]}>
                      <Text style={[s.verifyText, { color: t.text.muted }]}>
                        {milestone.verificationMethod}
                      </Text>
                    </View>
                    {milestone.region !== 'global' && (
                      <View style={[s.verifyBadge, { backgroundColor: t.accent.blue + '15' }]}>
                        <Text style={[s.verifyText, { color: t.accent.blue }]}>
                          {getRegionDisplay(milestone.region)}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        /* My Milestones Tab */
        <ScrollView showsVerticalScrollIndicator={false}>
          {submissions.length === 0 ? (
            <Text style={s.emptyText}>No milestones submitted yet. Browse milestones and submit your achievements.</Text>
          ) : (
            submissions.map((sub) => {
              const milestoneAll = getMilestones({});
              const milestone = milestoneAll.find((m) => m.id === sub.milestoneId);
              if (!milestone) return null;
              const channelInfo = getChannelDisplay(milestone.channel);
              return (
                <View key={sub.id} style={s.card}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={s.channelIcon}>{channelInfo.icon}</Text>
                    <Text style={s.cardTitle}>{milestone.title}</Text>
                  </View>
                  <Text style={s.cardDesc}>{milestone.description}</Text>
                  <View style={s.cardFooter}>
                    <View style={s.mintBadge}>
                      <Text style={s.mintText}>{milestone.mintAmount} OTK</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={[s.statusDot, { backgroundColor: statusColor(sub.status) }]} />
                      <Text style={{ color: statusColor(sub.status), fontSize: 13, fontWeight: '700' }}>
                        {statusLabel(sub.status)}
                      </Text>
                    </View>
                  </View>
                  {sub.evidence && (
                    <Text style={{ color: t.text.muted, fontSize: 12, marginTop: 6 }}>
                      Evidence: {sub.evidence}
                    </Text>
                  )}
                  <Text style={{ color: t.text.muted, fontSize: 11, marginTop: 4 }}>
                    Submitted {new Date(sub.submittedAt).toLocaleDateString()}
                    {sub.verifiedAt ? ` | Verified ${new Date(sub.verifiedAt).toLocaleDateString()}` : ''}
                  </Text>
                </View>
              );
            })
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
