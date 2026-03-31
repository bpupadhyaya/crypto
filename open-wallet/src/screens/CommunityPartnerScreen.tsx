import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  FlatList,
  TextInput,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

type Tab = 'partners' | 'programs' | 'join';

interface Props {
  onClose: () => void;
}

interface Partner {
  id: string;
  name: string;
  type: string;
  focus: string;
  members: number;
  otkContributed: number;
  since: string;
}

interface Program {
  id: string;
  name: string;
  partner: string;
  description: string;
  otkPool: number;
  participants: number;
  status: 'active' | 'upcoming' | 'completed';
}

const DEMO_PARTNERS: Partner[] = [
  { id: '1', name: 'Neighborhood Learning Co-op', type: 'Education', focus: 'Free tutoring and skill-sharing for all ages', members: 120, otkContributed: 8500, since: '2026-01' },
  { id: '2', name: 'Elder Wisdom Network', type: 'Eldercare', focus: 'Connecting elders with youth for storytelling and mentorship', members: 85, otkContributed: 5200, since: '2026-01' },
  { id: '3', name: 'Peace Builders Alliance', type: 'Peace', focus: 'Conflict resolution training and mediation services', members: 64, otkContributed: 3800, since: '2026-02' },
  { id: '4', name: 'Open Tools Collective', type: 'Community', focus: 'Shared tool libraries and maker spaces', members: 210, otkContributed: 12000, since: '2025-11' },
  { id: '5', name: 'Youth Code Academy', type: 'Education', focus: 'Teaching programming to underserved youth', members: 95, otkContributed: 6700, since: '2026-02' },
];

const DEMO_PROGRAMS: Program[] = [
  { id: '1', name: 'Spring Reading Challenge', partner: 'Neighborhood Learning Co-op', description: 'Read 20 books as a community and earn OTK for each review shared.', otkPool: 2000, participants: 340, status: 'active' },
  { id: '2', name: 'Elder Story Archive', partner: 'Elder Wisdom Network', description: 'Record and preserve elder stories in a permanent community archive.', otkPool: 1500, participants: 78, status: 'active' },
  { id: '3', name: 'Conflict-Free Zones', partner: 'Peace Builders Alliance', description: 'Establish 10 designated peace zones in the neighborhood.', otkPool: 3000, participants: 156, status: 'upcoming' },
  { id: '4', name: 'Tool Swap Day', partner: 'Open Tools Collective', description: 'Monthly event to exchange, repair, and share community tools.', otkPool: 800, participants: 420, status: 'active' },
  { id: '5', name: 'Code for Good Hackathon', partner: 'Youth Code Academy', description: 'Build apps that solve real community problems.', otkPool: 5000, participants: 62, status: 'upcoming' },
];

export function CommunityPartnerScreen({ onClose }: Props) {
  const t = useTheme();
  const { demoMode } = useWalletStore();
  const [activeTab, setActiveTab] = useState<Tab>('partners');
  const [orgName, setOrgName] = useState('');
  const [orgFocus, setOrgFocus] = useState('');
  const [orgReason, setOrgReason] = useState('');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: t.bg.primary },
        header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.border },
        headerTitle: { fontSize: 18, fontWeight: '700', color: t.text.primary },
        closeButton: { padding: 8 },
        closeText: { fontSize: 16, color: t.accent.green },
        tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: t.border },
        tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
        activeTab: { borderBottomWidth: 2, borderBottomColor: t.accent.green },
        tabText: { fontSize: 14, color: t.text.secondary },
        activeTabText: { color: t.accent.green, fontWeight: '600' },
        content: { flex: 1 },
        partnerCard: { marginHorizontal: 16, marginTop: 12, padding: 14, backgroundColor: t.bg.card, borderRadius: 12, borderWidth: 1, borderColor: t.border },
        partnerName: { fontSize: 16, fontWeight: '700', color: t.text.primary, marginBottom: 2 },
        partnerType: { fontSize: 11, fontWeight: '600', color: t.accent.green, textTransform: 'uppercase', marginBottom: 6 },
        partnerFocus: { fontSize: 13, color: t.text.secondary, lineHeight: 18, marginBottom: 8 },
        partnerStats: { flexDirection: 'row', justifyContent: 'space-between' },
        partnerStat: { alignItems: 'center' },
        statValue: { fontSize: 14, fontWeight: '700', color: t.text.primary },
        statLabel: { fontSize: 10, color: t.text.secondary },
        programCard: { marginHorizontal: 16, marginTop: 12, padding: 14, backgroundColor: t.bg.card, borderRadius: 12, borderWidth: 1, borderColor: t.border },
        programName: { fontSize: 15, fontWeight: '700', color: t.text.primary, marginBottom: 2 },
        programPartner: { fontSize: 12, color: t.accent.green, marginBottom: 6 },
        programDesc: { fontSize: 13, color: t.text.secondary, lineHeight: 18, marginBottom: 8 },
        programFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        programOtk: { fontSize: 12, fontWeight: '600', color: t.accent.green },
        programParticipants: { fontSize: 12, color: t.text.secondary },
        statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
        statusText: { fontSize: 11, fontWeight: '600' },
        formContainer: { padding: 16 },
        label: { fontSize: 14, fontWeight: '600', color: t.text.primary, marginBottom: 6, marginTop: 16 },
        input: { backgroundColor: t.bg.card, borderRadius: 8, borderWidth: 1, borderColor: t.border, padding: 12, fontSize: 14, color: t.text.primary },
        textArea: { height: 100, textAlignVertical: 'top' },
        submitButton: { marginTop: 24, backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
        submitButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
        infoBox: { margin: 16, padding: 14, backgroundColor: t.accent.green + '10', borderRadius: 12, borderLeftWidth: 4, borderLeftColor: t.accent.green },
        infoText: { fontSize: 13, color: t.text.primary, lineHeight: 18 },
        sectionLabel: { fontSize: 14, fontWeight: '600', color: t.text.secondary, marginHorizontal: 16, marginTop: 16, marginBottom: 4 },
        emptyState: { margin: 16, padding: 20, backgroundColor: t.bg.card, borderRadius: 12, alignItems: 'center' },
        emptyText: { fontSize: 13, color: t.text.secondary },
        listFooter: { height: 32 },
      }),
    [t],
  );

  const statusStyle = (status: string) => {
    if (status === 'active') return { bg: t.accent.green + '20', color: t.accent.green };
    if (status === 'upcoming') return { bg: '#FF980020', color: '#FF9800' };
    return { bg: t.text.secondary + '20', color: t.text.secondary };
  };

  const handleSubmit = useCallback(() => {
    setOrgName('');
    setOrgFocus('');
    setOrgReason('');
  }, []);

  const renderPartner = useCallback(
    ({ item }: { item: Partner }) => (
      <View style={styles.partnerCard}>
        <Text style={styles.partnerType}>{item.type}</Text>
        <Text style={styles.partnerName}>{item.name}</Text>
        <Text style={styles.partnerFocus}>{item.focus}</Text>
        <View style={styles.partnerStats}>
          <View style={styles.partnerStat}>
            <Text style={styles.statValue}>{item.members}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
          <View style={styles.partnerStat}>
            <Text style={styles.statValue}>{item.otkContributed.toLocaleString()}</Text>
            <Text style={styles.statLabel}>OTK Contributed</Text>
          </View>
          <View style={styles.partnerStat}>
            <Text style={styles.statValue}>{item.since}</Text>
            <Text style={styles.statLabel}>Since</Text>
          </View>
        </View>
      </View>
    ),
    [styles],
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'partners':
        return (
          <FlatList
            data={demoMode ? DEMO_PARTNERS : []}
            keyExtractor={(item) => item.id}
            renderItem={renderPartner}
            ListHeaderComponent={<Text style={styles.sectionLabel}>{demoMode ? DEMO_PARTNERS.length : 0} Partner Organizations</Text>}
            ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyText}>No partners yet</Text></View>}
            ListFooterComponent={<View style={styles.listFooter} />}
          />
        );

      case 'programs':
        return (
          <FlatList
            data={demoMode ? DEMO_PROGRAMS : []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const s = statusStyle(item.status);
              return (
                <View style={styles.programCard}>
                  <Text style={styles.programName}>{item.name}</Text>
                  <Text style={styles.programPartner}>{item.partner}</Text>
                  <Text style={styles.programDesc}>{item.description}</Text>
                  <View style={styles.programFooter}>
                    <Text style={styles.programOtk}>{item.otkPool.toLocaleString()} OTK pool</Text>
                    <Text style={styles.programParticipants}>{item.participants} joined</Text>
                    <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                      <Text style={[styles.statusText, { color: s.color }]}>{item.status}</Text>
                    </View>
                  </View>
                </View>
              );
            }}
            ListHeaderComponent={<Text style={styles.sectionLabel}>Community Programs</Text>}
            ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyText}>No programs available</Text></View>}
            ListFooterComponent={<View style={styles.listFooter} />}
          />
        );

      case 'join':
        return (
          <ScrollView style={styles.formContainer}>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Partner organizations work with the OTK community to amplify impact. Partners can create programs, manage OTK pools, and coordinate volunteers.
              </Text>
            </View>
            <Text style={styles.label}>Organization Name</Text>
            <TextInput style={styles.input} value={orgName} onChangeText={setOrgName} placeholder="Your organization's name" placeholderTextColor={t.text.secondary} />
            <Text style={styles.label}>Area of Focus</Text>
            <TextInput style={styles.input} value={orgFocus} onChangeText={setOrgFocus} placeholder="e.g. Education, Eldercare, Peace" placeholderTextColor={t.text.secondary} />
            <Text style={styles.label}>Why Partner with OTK?</Text>
            <TextInput style={[styles.input, styles.textArea]} value={orgReason} onChangeText={setOrgReason} placeholder="Describe how your organization aligns with OTK values..." placeholderTextColor={t.text.secondary} multiline />
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Apply to Partner</Text>
            </TouchableOpacity>
            <View style={styles.listFooter} />
          </ScrollView>
        );
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'partners', label: 'Partners' },
    { key: 'programs', label: 'Programs' },
    { key: 'join', label: 'Join' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community Partners</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity key={tab.key} style={[styles.tab, activeTab === tab.key && styles.activeTab]} onPress={() => setActiveTab(tab.key)}>
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.content}>{renderContent()}</View>
    </SafeAreaView>
  );
}
