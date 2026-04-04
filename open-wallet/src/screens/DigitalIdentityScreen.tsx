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

type Tab = 'ids' | 'documents' | 'verify';

interface Props {
  onClose: () => void;
}

interface DigitalID {
  id: string;
  type: string;
  issuer: string;
  identifier: string;
  status: 'verified' | 'pending' | 'expired';
  issuedAt: string;
  expiresAt: string;
}

interface Document {
  id: string;
  name: string;
  category: string;
  addedAt: string;
  verified: boolean;
  size: string;
}

interface VerificationRequest {
  id: string;
  requester: string;
  field: string;
  purpose: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'denied';
}

const DEMO_IDS: DigitalID[] = [
  { id: '1', type: 'OTK Universal ID', issuer: 'Open Chain Network', identifier: 'OTK-7a3f-b2c1-d4e9', status: 'verified', issuedAt: '2026-01-15', expiresAt: 'Never' },
  { id: '2', type: 'Community Member ID', issuer: 'Local Community DAO', identifier: 'CM-2026-00142', status: 'verified', issuedAt: '2026-02-01', expiresAt: '2027-02-01' },
  { id: '3', type: 'Verifier Credential', issuer: 'Verification Oracle', identifier: 'VER-0089-A', status: 'verified', issuedAt: '2026-02-15', expiresAt: '2026-08-15' },
  { id: '4', type: 'Peace Ambassador Badge', issuer: 'Peace Council', identifier: 'PA-2026-0034', status: 'pending', issuedAt: '2026-03-20', expiresAt: '2027-03-20' },
  { id: '5', type: 'Education Contributor', issuer: 'Learning Co-op', identifier: 'EDU-0567', status: 'expired', issuedAt: '2025-06-01', expiresAt: '2026-01-01' },
];

const DEMO_DOCUMENTS: Document[] = [
  { id: '1', name: 'OTK Genesis Certificate', category: 'Certificate', addedAt: '2026-01-15', verified: true, size: '2.1 KB' },
  { id: '2', name: 'Community Contribution Record', category: 'Record', addedAt: '2026-03-01', verified: true, size: '4.7 KB' },
  { id: '3', name: 'Verifier Training Completion', category: 'Certificate', addedAt: '2026-02-15', verified: true, size: '1.8 KB' },
  { id: '4', name: 'Governance Vote History', category: 'Record', addedAt: '2026-03-25', verified: true, size: '3.2 KB' },
];

const DEMO_VERIFICATION_REQUESTS: VerificationRequest[] = [
  { id: '1', requester: 'Youth Code Academy', field: 'Education Contributor ID', purpose: 'Verify teaching credentials for program enrollment', requestedAt: '2026-03-29', status: 'pending' },
  { id: '2', requester: 'Peace Builders Alliance', field: 'Community Member ID', purpose: 'Confirm membership for ambassador nomination', requestedAt: '2026-03-27', status: 'pending' },
  { id: '3', requester: 'Open Tools Collective', field: 'OTK Universal ID', purpose: 'Verify identity for tool sharing program', requestedAt: '2026-03-20', status: 'approved' },
  { id: '4', requester: 'Governance DAO', field: 'Verifier Credential', purpose: 'Confirm verifier status for voting weight', requestedAt: '2026-03-15', status: 'approved' },
];

export function DigitalIdentityScreen({ onClose }: Props) {
  const t = useTheme();
  const { demoMode } = useWalletStore();
  const [activeTab, setActiveTab] = useState<Tab>('ids');

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
        idCard: { marginHorizontal: 16, marginTop: 12, padding: 14, backgroundColor: t.bg.card, borderRadius: 12, borderWidth: 1, borderColor: t.border },
        idType: { fontSize: fonts.md, fontWeight: fonts.bold, color: t.text.primary, marginBottom: 2 },
        idIssuer: { fontSize: fonts.sm, color: t.accent.green, marginBottom: 6 },
        idIdentifier: { fontSize: fonts.sm, fontFamily: 'monospace', color: t.text.secondary, backgroundColor: t.bg.primary, padding: 6, borderRadius: 6, marginBottom: 8 },
        idFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        idDates: { fontSize: fonts.xs, color: t.text.secondary },
        statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
        statusText: { fontSize: fonts.xs, fontWeight: fonts.semibold },
        docCard: { marginHorizontal: 16, marginTop: 12, padding: 14, backgroundColor: t.bg.card, borderRadius: 12, borderWidth: 1, borderColor: t.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        docInfo: { flex: 1 },
        docName: { fontSize: fonts.md, fontWeight: fonts.semibold, color: t.text.primary, marginBottom: 2 },
        docMeta: { fontSize: fonts.sm, color: t.text.secondary },
        docVerified: { fontSize: fonts.xs, fontWeight: fonts.semibold },
        verifyCard: { marginHorizontal: 16, marginTop: 12, padding: 14, backgroundColor: t.bg.card, borderRadius: 12, borderWidth: 1, borderColor: t.border },
        verifyRequester: { fontSize: fonts.md, fontWeight: fonts.bold, color: t.text.primary, marginBottom: 2 },
        verifyField: { fontSize: fonts.sm, color: t.accent.green, marginBottom: 4 },
        verifyPurpose: { fontSize: fonts.sm, color: t.text.secondary, lineHeight: 18, marginBottom: 8 },
        verifyFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        verifyDate: { fontSize: fonts.xs, color: t.text.secondary },
        actionRow: { flexDirection: 'row', gap: 8 },
        approveBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: t.accent.green + '20' },
        approveBtnText: { fontSize: fonts.sm, fontWeight: fonts.semibold, color: t.accent.green },
        denyBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F4433620' },
        denyBtnText: { fontSize: fonts.sm, fontWeight: fonts.semibold, color: '#F44336' },
        infoBox: { margin: 16, padding: 14, backgroundColor: t.accent.green + '10', borderRadius: 12, borderLeftWidth: 4, borderLeftColor: t.accent.green },
        infoText: { fontSize: fonts.sm, color: t.text.primary, lineHeight: 18 },
        sectionLabel: { fontSize: fonts.md, fontWeight: fonts.semibold, color: t.text.secondary, marginHorizontal: 16, marginTop: 16, marginBottom: 4 },
        emptyState: { margin: 16, padding: 20, backgroundColor: t.bg.card, borderRadius: 12, alignItems: 'center' },
        emptyText: { fontSize: fonts.sm, color: t.text.secondary },
        listFooter: { height: 32 },
      }),
    [t],
  );

  const statusStyle = (status: string) => {
    if (status === 'verified' || status === 'approved') return { bg: t.accent.green + '20', color: t.accent.green };
    if (status === 'pending') return { bg: '#FF980020', color: '#FF9800' };
    if (status === 'expired' || status === 'denied') return { bg: '#F4433620', color: '#F44336' };
    return { bg: t.text.secondary + '20', color: t.text.secondary };
  };

  const renderID = useCallback(
    ({ item }: { item: DigitalID }) => {
      const s = statusStyle(item.status);
      return (
        <View style={styles.idCard}>
          <Text style={styles.idType}>{item.type}</Text>
          <Text style={styles.idIssuer}>{item.issuer}</Text>
          <Text style={styles.idIdentifier}>{item.identifier}</Text>
          <View style={styles.idFooter}>
            <Text style={styles.idDates}>Issued: {item.issuedAt} | Expires: {item.expiresAt}</Text>
            <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
              <Text style={[styles.statusText, { color: s.color }]}>{item.status}</Text>
            </View>
          </View>
        </View>
      );
    },
    [styles],
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'ids':
        return (
          <FlatList
            data={demoMode ? DEMO_IDS : []}
            keyExtractor={(item) => item.id}
            renderItem={renderID}
            ListHeaderComponent={
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>Your digital identities are stored locally and shared only with your explicit consent. One human, one identity — secured by Open Chain.</Text>
              </View>
            }
            ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyText}>No digital IDs yet</Text></View>}
            ListFooterComponent={<View style={styles.listFooter} />}
          />
        );

      case 'documents':
        return (
          <FlatList
            data={demoMode ? DEMO_DOCUMENTS : []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.docCard}>
                <View style={styles.docInfo}>
                  <Text style={styles.docName}>{item.name}</Text>
                  <Text style={styles.docMeta}>{item.category} | {item.addedAt} | {item.size}</Text>
                </View>
                <Text style={[styles.docVerified, { color: item.verified ? t.accent.green : '#FF9800' }]}>
                  {item.verified ? 'Verified' : 'Pending'}
                </Text>
              </View>
            )}
            ListHeaderComponent={<Text style={styles.sectionLabel}>Your Documents</Text>}
            ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyText}>No documents stored</Text></View>}
            ListFooterComponent={<View style={styles.listFooter} />}
          />
        );

      case 'verify':
        return (
          <FlatList
            data={demoMode ? DEMO_VERIFICATION_REQUESTS : []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const s = statusStyle(item.status);
              return (
                <View style={styles.verifyCard}>
                  <Text style={styles.verifyRequester}>{item.requester}</Text>
                  <Text style={styles.verifyField}>Requesting: {item.field}</Text>
                  <Text style={styles.verifyPurpose}>{item.purpose}</Text>
                  <View style={styles.verifyFooter}>
                    <Text style={styles.verifyDate}>{item.requestedAt}</Text>
                    {item.status === 'pending' ? (
                      <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.approveBtn}><Text style={styles.approveBtnText}>Share</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.denyBtn}><Text style={styles.denyBtnText}>Deny</Text></TouchableOpacity>
                      </View>
                    ) : (
                      <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                        <Text style={[styles.statusText, { color: s.color }]}>{item.status}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            }}
            ListHeaderComponent={<Text style={styles.sectionLabel}>Verification Requests</Text>}
            ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyText}>No verification requests</Text></View>}
            ListFooterComponent={<View style={styles.listFooter} />}
          />
        );
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'ids', label: 'IDs' },
    { key: 'documents', label: 'Documents' },
    { key: 'verify', label: 'Verify' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Digital Identity</Text>
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
