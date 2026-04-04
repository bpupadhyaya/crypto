import { fonts } from '../utils/theme';
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

type Tab = 'issues' | 'contribute' | 'bounties';

interface Props {
  onClose: () => void;
}

interface Issue {
  id: string;
  title: string;
  repo: string;
  labels: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  openedAt: string;
  comments: number;
  assignee: string | null;
}

interface ContributionGuide {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  repo: string;
  estimatedHours: number;
}

interface Bounty {
  id: string;
  title: string;
  description: string;
  otkReward: number;
  repo: string;
  difficulty: string;
  deadline: string;
  claimedBy: string | null;
  status: 'open' | 'claimed' | 'in-review';
}

const DEMO_ISSUES: Issue[] = [
  { id: '1', title: 'P2P sync fails on iOS when app backgrounded', repo: 'open-wallet', labels: ['bug', 'P2P', 'iOS'], priority: 'high', openedAt: '2026-03-29', comments: 7, assignee: null },
  { id: '2', title: 'Add hardware wallet detection for Solana Saga', repo: 'open-wallet', labels: ['feature', 'hardware'], priority: 'medium', openedAt: '2026-03-27', comments: 3, assignee: 'User_a3f2' },
  { id: '3', title: 'OTK minting rate inconsistent across channels', repo: 'open-chain', labels: ['bug', 'consensus'], priority: 'critical', openedAt: '2026-03-25', comments: 12, assignee: null },
  { id: '4', title: 'Add accessibility labels to all screens', repo: 'open-wallet', labels: ['accessibility', 'good-first-issue'], priority: 'low', openedAt: '2026-03-20', comments: 2, assignee: null },
];

const DEMO_GUIDES: ContributionGuide[] = [
  { id: '1', title: 'Setting Up the Development Environment', description: 'Step-by-step guide to clone, build, and run Open Wallet locally on macOS, Linux, and Windows.', difficulty: 'beginner', repo: 'open-wallet', estimatedHours: 2 },
  { id: '2', title: 'Writing Your First Screen Component', description: 'Learn the screen pattern used in Open Wallet: theme hooks, wallet store, StyleSheet.create in useMemo.', difficulty: 'beginner', repo: 'open-wallet', estimatedHours: 3 },
  { id: '3', title: 'Understanding P2P Validation', description: 'Deep dive into how Open Chain validates transactions peer-to-peer without central servers.', difficulty: 'intermediate', repo: 'open-chain', estimatedHours: 6 },
];

const DEMO_BOUNTIES: Bounty[] = [
  { id: '1', title: 'Fix P2P background sync on iOS', description: 'Resolve the issue where P2P sync drops when the app is backgrounded on iOS devices.', otkReward: 500, repo: 'open-wallet', difficulty: 'advanced', deadline: '2026-04-15', claimedBy: null, status: 'open' },
  { id: '2', title: 'Add accessibility to 10 screens', description: 'Add proper accessibility labels, hints, and roles to at least 10 existing screens.', otkReward: 300, repo: 'open-wallet', difficulty: 'beginner', deadline: '2026-04-30', claimedBy: null, status: 'open' },
  { id: '3', title: 'Protobuf compression optimization', description: 'Reduce Protobuf message size by 30% while maintaining backward compatibility.', otkReward: 400, repo: 'open-chain', difficulty: 'intermediate', deadline: '2026-04-20', claimedBy: 'User_b2c1', status: 'claimed' },
];

export function OpenSourceScreen({ onClose }: Props) {
  const t = useTheme();
  const { demoMode } = useWalletStore();
  const [activeTab, setActiveTab] = useState<Tab>('issues');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: t.bg.primary },
        header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.border },
        headerTitle: { fontSize: fonts.xl, fontWeight: fonts.bold, color: t.text.primary },
        closeButton: { padding: 8 },
        closeText: { fontSize: fonts.lg, color: t.accent.green },
        tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: t.border },
        tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
        activeTab: { borderBottomWidth: 2, borderBottomColor: t.accent.green },
        tabText: { fontSize: fonts.md, color: t.text.secondary },
        activeTabText: { color: t.accent.green, fontWeight: fonts.semibold },
        content: { flex: 1 },
        issueCard: { marginHorizontal: 16, marginTop: 12, padding: 14, backgroundColor: t.bg.card, borderRadius: 12, borderWidth: 1, borderColor: t.border },
        issueTitle: { fontSize: fonts.md, fontWeight: fonts.bold, color: t.text.primary, marginBottom: 4 },
        labelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 6 },
        label: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: t.bg.primary },
        labelText: { fontSize: fonts.xs, color: t.text.secondary },
        issueFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        issueMeta: { fontSize: fonts.xs, color: t.text.secondary },
        priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
        priorityText: { fontSize: fonts.xs, fontWeight: fonts.semibold },
        guideCard: { marginHorizontal: 16, marginTop: 12, padding: 14, backgroundColor: t.bg.card, borderRadius: 12, borderWidth: 1, borderColor: t.border },
        guideTitle: { fontSize: fonts.md, fontWeight: fonts.bold, color: t.text.primary, marginBottom: 2 },
        guideDesc: { fontSize: fonts.sm, color: t.text.secondary, lineHeight: 18, marginBottom: 8 },
        guideDifficulty: { fontSize: fonts.sm, fontWeight: fonts.semibold },
        bountyCard: { marginHorizontal: 16, marginTop: 12, padding: 14, backgroundColor: t.bg.card, borderRadius: 12, borderWidth: 1, borderColor: t.border },
        bountyTitle: { fontSize: fonts.md, fontWeight: fonts.bold, color: t.text.primary, marginBottom: 2 },
        bountyDesc: { fontSize: fonts.sm, color: t.text.secondary, lineHeight: 18, marginBottom: 8 },
        bountyFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        bountyReward: { fontSize: fonts.lg, fontWeight: fonts.bold, color: t.accent.green },
        statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
        statusText: { fontSize: fonts.xs, fontWeight: fonts.semibold },
        claimButton: { marginTop: 8, paddingVertical: 10, backgroundColor: t.accent.green, borderRadius: 8, alignItems: 'center' },
        sectionLabel: { fontSize: fonts.md, fontWeight: fonts.semibold, color: t.text.secondary, marginHorizontal: 16, marginTop: 16, marginBottom: 4 },
        emptyState: { margin: 16, padding: 20, backgroundColor: t.bg.card, borderRadius: 12, alignItems: 'center' },
        emptyText: { fontSize: fonts.sm, color: t.text.secondary },
        listFooter: { height: 32 },
        infoBox: { margin: 16, padding: 14, backgroundColor: t.accent.green + '10', borderRadius: 12 },
        infoText: { fontSize: fonts.sm, color: t.text.primary, lineHeight: 18 },
      }),
    [t],
  );

  const priorityColor = (p: string) => p === 'critical' ? '#F44336' : p === 'high' ? '#FF9800' : p === 'medium' ? t.accent.green : t.text.secondary;
  const difficultyColor = (d: string) => d === 'advanced' ? '#F44336' : d === 'intermediate' ? '#FF9800' : t.accent.green;
  const bountyStatusStyle = (s: string) => s === 'open' ? { bg: t.accent.green + '20', color: t.accent.green } : { bg: '#FF980020', color: '#FF9800' };

  const renderIssue = useCallback(
    ({ item }: { item: Issue }) => {
      const pc = priorityColor(item.priority);
      return (
        <View style={styles.issueCard}>
          <Text style={styles.issueTitle}>{item.title} ({item.repo})</Text>
          <View style={styles.labelRow}>
            {item.labels.map((l) => (
              <View key={l} style={styles.label}><Text style={styles.labelText}>{l}</Text></View>
            ))}
          </View>
          <View style={styles.issueFooter}>
            <Text style={styles.issueMeta}>{item.openedAt} | {item.comments} comments{item.assignee ? ` | ${item.assignee}` : ''}</Text>
            <View style={[styles.priorityBadge, { backgroundColor: pc + '20' }]}>
              <Text style={[styles.priorityText, { color: pc }]}>{item.priority}</Text>
            </View>
          </View>
        </View>
      );
    },
    [styles],
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'issues':
        return (
          <FlatList
            data={demoMode ? DEMO_ISSUES : []}
            keyExtractor={(item) => item.id}
            renderItem={renderIssue}
            ListHeaderComponent={<Text style={styles.sectionLabel}>{demoMode ? DEMO_ISSUES.length : 0} Open Issues</Text>}
            ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyText}>No open issues</Text></View>}
            ListFooterComponent={<View style={styles.listFooter} />}
          />
        );

      case 'contribute':
        return (
          <ScrollView>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Open Chain, Open Wallet, and Open Token are fully open source. Every contribution earns OTK. Start with beginner guides and work your way up.
              </Text>
            </View>
            <Text style={styles.sectionLabel}>Contribution Guides</Text>
            {(demoMode ? DEMO_GUIDES : []).map((guide) => (
              <View key={guide.id} style={styles.guideCard}>
                <Text style={styles.guideTitle}>{guide.title} ({guide.repo})</Text>
                <Text style={styles.guideDesc}>{guide.description}</Text>
                <Text style={[styles.guideDifficulty, { color: difficultyColor(guide.difficulty) }]}>{guide.difficulty} | ~{guide.estimatedHours} hrs</Text>
              </View>
            ))}
            {!demoMode && <View style={styles.emptyState}><Text style={styles.emptyText}>No guides available</Text></View>}
            <View style={styles.listFooter} />
          </ScrollView>
        );

      case 'bounties':
        return (
          <FlatList
            data={demoMode ? DEMO_BOUNTIES : []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const s = bountyStatusStyle(item.status);
              return (
                <View style={styles.bountyCard}>
                  <Text style={styles.bountyTitle}>{item.title} ({item.repo})</Text>
                  <Text style={styles.bountyDesc}>{item.description}</Text>
                  <View style={styles.bountyFooter}>
                    <Text style={styles.bountyReward}>{item.otkReward} OTK | {item.difficulty}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                      <Text style={[styles.statusText, { color: s.color }]}>{item.status}</Text>
                    </View>
                  </View>
                  {item.status === 'open' && (
                    <TouchableOpacity style={styles.claimButton}>
                      <Text style={{ fontSize: fonts.sm, fontWeight: fonts.semibold, color: '#FFF' }}>Claim Bounty</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            }}
            ListHeaderComponent={<Text style={styles.sectionLabel}>Available Bounties</Text>}
            ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyText}>No bounties available</Text></View>}
            ListFooterComponent={<View style={styles.listFooter} />}
          />
        );
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'issues', label: 'Issues' },
    { key: 'contribute', label: 'Contribute' },
    { key: 'bounties', label: 'Bounties' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Open Source</Text>
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
