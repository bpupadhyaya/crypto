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

type Tab = 'live' | 'resources' | 'alerts';

interface Props {
  onClose: () => void;
}

interface LiveActivity {
  id: string;
  type: string;
  location: string;
  description: string;
  participants: number;
  startedAt: string;
  otkFlow: number;
  channel: string;
}

interface Resource {
  id: string;
  name: string;
  type: string;
  location: string;
  status: 'available' | 'in-use' | 'maintenance';
  lastUpdated: string;
}

interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'urgent';
  title: string;
  message: string;
  location: string;
  issuedAt: string;
  expiresAt: string;
}

const DEMO_ACTIVITIES: LiveActivity[] = [
  { id: '1', type: 'Tutoring Session', location: 'Block 7 Community Center', description: 'Math tutoring for 8 students, ages 10-14', participants: 10, startedAt: '14:00', otkFlow: 160, channel: 'Education' },
  { id: '2', type: 'Elder Circle', location: 'Sunset Park Pavilion', description: 'Weekly storytelling circle with 12 elders and 8 youth listeners', participants: 20, startedAt: '15:30', otkFlow: 240, channel: 'Eldercare' },
  { id: '3', type: 'Tool Share', location: 'Main Street Tool Library', description: 'Open hours - 6 tools currently checked out', participants: 4, startedAt: '10:00', otkFlow: 60, channel: 'Community' },
  { id: '5', type: 'Code Workshop', location: 'Youth Academy Lab', description: 'Open-source contribution session for Open Wallet', participants: 7, startedAt: '13:00', otkFlow: 210, channel: 'Open Source' },
];

const DEMO_RESOURCES: Resource[] = [
  { id: '1', name: 'Community Center Hall A', type: 'Venue', location: 'Block 7', status: 'in-use', lastUpdated: '14:00' },
  { id: '2', name: 'Portable Projector', type: 'Equipment', location: 'Tool Library', status: 'available', lastUpdated: '12:30' },
  { id: '3', name: 'First Aid Station', type: 'Service', location: 'Park Entrance', status: 'available', lastUpdated: '08:00' },
];

const DEMO_ALERTS: Alert[] = [
  { id: '1', severity: 'info', title: 'Community Meeting Tomorrow', message: 'Quarterly governance vote at 18:00 in Hall B. All welcome.', location: 'Block 7 Community Center', issuedAt: '2026-03-30 10:00', expiresAt: '2026-03-31 20:00' },
  { id: '2', severity: 'warning', title: 'Tool Library Closing Early', message: 'Closes at 14:00 today for inventory. Return items before then.', location: 'Main Street Tool Library', issuedAt: '2026-03-31 08:00', expiresAt: '2026-03-31 14:00' },
  { id: '3', severity: 'urgent', title: 'Volunteer Needed - Elder Transport', message: 'Elder Chen needs transport to medical appointment at 15:30. Can anyone help?', location: 'Block 3 Residence', issuedAt: '2026-03-31 12:00', expiresAt: '2026-03-31 15:00' },
];

export function CommunityMapLiveScreen({ onClose }: Props) {
  const t = useTheme();
  const { demoMode } = useWalletStore();
  const [activeTab, setActiveTab] = useState<Tab>('live');

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
        summaryBar: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 16, backgroundColor: t.bg.card, borderBottomWidth: 1, borderBottomColor: t.border, justifyContent: 'space-around' },
        summaryItem: { alignItems: 'center' },
        summaryValue: { fontSize: fonts.lg, fontWeight: fonts.bold, color: t.accent.green },
        summaryLabel: { fontSize: fonts.xs, color: t.text.secondary },
        activityCard: { marginHorizontal: 16, marginTop: 12, padding: 14, backgroundColor: t.bg.card, borderRadius: 12, borderWidth: 1, borderColor: t.border },
        activityType: { fontSize: fonts.xs, fontWeight: fonts.semibold, color: t.accent.green, textTransform: 'uppercase', marginBottom: 2 },
        activityDesc: { fontSize: fonts.md, fontWeight: fonts.semibold, color: t.text.primary, marginBottom: 4 },
        activityLocation: { fontSize: fonts.sm, color: t.text.secondary, marginBottom: 6 },
        activityFooter: { flexDirection: 'row', justifyContent: 'space-between' },
        activityStat: { fontSize: fonts.sm, color: t.text.secondary },
        activityOtk: { fontSize: fonts.sm, fontWeight: fonts.semibold, color: t.accent.green },
        resourceCard: { marginHorizontal: 16, marginTop: 12, padding: 14, backgroundColor: t.bg.card, borderRadius: 12, borderWidth: 1, borderColor: t.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        resourceInfo: { flex: 1 },
        resourceName: { fontSize: fonts.md, fontWeight: fonts.semibold, color: t.text.primary, marginBottom: 2 },
        resourceMeta: { fontSize: fonts.sm, color: t.text.secondary },
        statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
        statusLabel: { fontSize: fonts.sm, fontWeight: fonts.semibold },
        alertCard: { marginHorizontal: 16, marginTop: 12, padding: 14, borderRadius: 12, borderWidth: 1, borderLeftWidth: 4 },
        alertTitle: { fontSize: fonts.md, fontWeight: fonts.bold, color: t.text.primary, marginBottom: 4 },
        alertMessage: { fontSize: fonts.sm, color: t.text.secondary, lineHeight: 18, marginBottom: 6 },
        alertMeta: { fontSize: fonts.xs, color: t.text.secondary },
        respondButton: { marginTop: 8, paddingVertical: 8, backgroundColor: t.accent.green, borderRadius: 8, alignItems: 'center' },
        sectionLabel: { fontSize: fonts.md, fontWeight: fonts.semibold, color: t.text.secondary, marginHorizontal: 16, marginTop: 16, marginBottom: 4 },
        emptyState: { margin: 16, padding: 20, backgroundColor: t.bg.card, borderRadius: 12, alignItems: 'center' },
        emptyText: { fontSize: fonts.sm, color: t.text.secondary },
        listFooter: { height: 32 },
      }),
    [t],
  );

  const activities = demoMode ? DEMO_ACTIVITIES : [];
  const totalParticipants = useMemo(() => activities.reduce((s, a) => s + a.participants, 0), [activities]);
  const totalOtkFlow = useMemo(() => activities.reduce((s, a) => s + a.otkFlow, 0), [activities]);

  const statusColor = (s: string) => s === 'available' ? t.accent.green : s === 'in-use' ? '#FF9800' : '#F44336';

  const alertStyle = (severity: string) => {
    if (severity === 'urgent') return { border: '#F44336', bg: '#F4433610' };
    if (severity === 'warning') return { border: '#FF9800', bg: '#FF980010' };
    return { border: t.accent.green, bg: t.accent.green + '10' };
  };

  const renderActivity = useCallback(
    ({ item }: { item: LiveActivity }) => (
      <View style={styles.activityCard}>
        <Text style={styles.activityType}>{item.channel} - {item.type}</Text>
        <Text style={styles.activityDesc}>{item.description}</Text>
        <Text style={styles.activityLocation}>{item.location}</Text>
        <View style={styles.activityFooter}>
          <Text style={styles.activityStat}>Started {item.startedAt} | {item.participants} people</Text>
          <Text style={styles.activityOtk}>{item.otkFlow} OTK flowing</Text>
        </View>
      </View>
    ),
    [styles],
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'live':
        return (
          <FlatList
            data={activities}
            keyExtractor={(item) => item.id}
            renderItem={renderActivity}
            ListHeaderComponent={
              <View style={styles.summaryBar}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{activities.length}</Text>
                  <Text style={styles.summaryLabel}>Active Now</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{totalParticipants}</Text>
                  <Text style={styles.summaryLabel}>People</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{totalOtkFlow}</Text>
                  <Text style={styles.summaryLabel}>OTK Flowing</Text>
                </View>
              </View>
            }
            ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyText}>No live activity right now</Text></View>}
            ListFooterComponent={<View style={styles.listFooter} />}
          />
        );

      case 'resources':
        return (
          <FlatList
            data={demoMode ? DEMO_RESOURCES : []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.resourceCard}>
                <View style={styles.resourceInfo}>
                  <Text style={styles.resourceName}>{item.name}</Text>
                  <Text style={styles.resourceMeta}>{item.type} | {item.location} | Updated {item.lastUpdated}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor(item.status) }]} />
                  <Text style={[styles.statusLabel, { color: statusColor(item.status) }]}>{item.status}</Text>
                </View>
              </View>
            )}
            ListHeaderComponent={<Text style={styles.sectionLabel}>Community Resources</Text>}
            ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyText}>No resources tracked</Text></View>}
            ListFooterComponent={<View style={styles.listFooter} />}
          />
        );

      case 'alerts':
        return (
          <ScrollView>
            <Text style={styles.sectionLabel}>Community Alerts</Text>
            {(demoMode ? DEMO_ALERTS : []).map((alert) => {
              const a = alertStyle(alert.severity);
              return (
                <View key={alert.id} style={[styles.alertCard, { borderColor: a.border, borderLeftColor: a.border, backgroundColor: a.bg }]}>
                  <Text style={styles.alertTitle}>[{alert.severity.toUpperCase()}] {alert.title}</Text>
                  <Text style={styles.alertMessage}>{alert.message}</Text>
                  <Text style={styles.alertMeta}>{alert.location} | {alert.issuedAt}</Text>
                  {alert.severity === 'urgent' && (
                    <TouchableOpacity style={styles.respondButton}>
                      <Text style={{ fontSize: fonts.sm, fontWeight: fonts.semibold, color: '#FFFFFF' }}>Respond</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
            {!demoMode && <View style={styles.emptyState}><Text style={styles.emptyText}>No alerts</Text></View>}
            <View style={styles.listFooter} />
          </ScrollView>
        );
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'live', label: 'Live' },
    { key: 'resources', label: 'Resources' },
    { key: 'alerts', label: 'Alerts' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community Map</Text>
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
