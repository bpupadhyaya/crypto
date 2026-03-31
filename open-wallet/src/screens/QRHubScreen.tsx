/**
 * QR Hub Screen — Central QR code hub: scan, generate, share for any purpose.
 *
 * One place for all QR interactions: scanning incoming codes, generating
 * your own for payments/identity/sharing, and reviewing QR history.
 * "Every connection starts with a scan."
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

interface QRHistoryEntry {
  id: string;
  type: 'scanned' | 'generated';
  label: string;
  data: string;
  timestamp: string;
  category: string;
}

interface QRTemplate {
  key: string;
  title: string;
  icon: string;
  description: string;
  color: string;
}

const QR_TEMPLATES: QRTemplate[] = [
  { key: 'payment', title: 'Payment Request', icon: '\u{1F4B3}', description: 'Generate a QR for receiving OTK payments', color: '#10b981' },
  { key: 'identity', title: 'Universal ID', icon: '\u{1F464}', description: 'Share your Open Chain identity securely', color: '#3b82f6' },
  { key: 'contact', title: 'Contact Card', icon: '\u{1F4C7}', description: 'Share your contact information', color: '#8b5cf6' },
  { key: 'invite', title: 'Community Invite', icon: '\u{1F91D}', description: 'Invite someone to join your community', color: '#f59e0b' },
  { key: 'document', title: 'Document Link', icon: '\u{1F4C4}', description: 'Link to a verified document on-chain', color: '#ef4444' },
  { key: 'wifi', title: 'Wi-Fi Access', icon: '\u{1F4F6}', description: 'Share Wi-Fi credentials via QR', color: '#06b6d4' },
];

const DEMO_HISTORY: QRHistoryEntry[] = [
  { id: 'h1', type: 'scanned', label: 'Payment from MayaK', data: 'otk:pay:maya_k:150', timestamp: '2026-03-29 14:23', category: 'Payment' },
  { id: 'h2', type: 'generated', label: 'My Universal ID', data: 'otk:uid:demo_user', timestamp: '2026-03-29 10:05', category: 'Identity' },
  { id: 'h3', type: 'scanned', label: 'Community Garden Invite', data: 'otk:invite:garden_2026', timestamp: '2026-03-28 16:44', category: 'Invite' },
  { id: 'h4', type: 'generated', label: 'Payment Request — 50 OTK', data: 'otk:pay:self:50', timestamp: '2026-03-28 09:12', category: 'Payment' },
  { id: 'h5', type: 'scanned', label: 'Verified Diploma', data: 'otk:doc:diploma_hash', timestamp: '2026-03-27 11:30', category: 'Document' },
  { id: 'h6', type: 'generated', label: 'Contact Card Shared', data: 'otk:contact:demo_user', timestamp: '2026-03-26 15:00', category: 'Contact' },
  { id: 'h7', type: 'scanned', label: 'Wi-Fi — Community Center', data: 'wifi:WPA:cc_guest:pass123', timestamp: '2026-03-25 08:45', category: 'Wi-Fi' },
];

export function QRHubScreen({ onClose }: Props) {
  const t = useTheme();
  const { demoMode } = useWalletStore();
  const [activeTab, setActiveTab] = useState<'scan' | 'generate' | 'history'>('scan');

  const handleScan = () => {
    Alert.alert('Scanner', 'Camera-based QR scanning will open here.\n\nIn demo mode, this simulates a successful scan.');
  };

  const handleGenerate = (template: QRTemplate) => {
    Alert.alert('Generate QR', `Generating "${template.title}" QR code.\n\nThe QR image will appear here for sharing.`);
  };

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    demoTag: { backgroundColor: t.accent.yellow + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'center', marginBottom: 16 },
    demoText: { color: t.accent.yellow, fontSize: 12, fontWeight: '700' },
    tabRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: t.bg.card, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: '#fff' },
    quote: { color: t.text.secondary, fontSize: 14, fontStyle: 'italic', textAlign: 'center', lineHeight: 22, marginBottom: 20, paddingHorizontal: 12 },
    scanArea: { backgroundColor: t.bg.card, borderRadius: 20, padding: 40, alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: t.accent.blue + '40', borderStyle: 'dashed' },
    scanIcon: { fontSize: 64, marginBottom: 16 },
    scanTitle: { color: t.text.primary, fontSize: 18, fontWeight: '700', marginBottom: 8 },
    scanDesc: { color: t.text.secondary, fontSize: 14, textAlign: 'center', lineHeight: 22 },
    scanBtn: { backgroundColor: t.accent.blue, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, marginTop: 20 },
    scanBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    recentLabel: { color: t.text.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 },
    recentItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.bg.card, borderRadius: 12, padding: 14, marginBottom: 8 },
    recentDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
    recentInfo: { flex: 1 },
    recentName: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    recentTime: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    templateCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 14 },
    templateIcon: { fontSize: 32 },
    templateInfo: { flex: 1 },
    templateTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700', marginBottom: 2 },
    templateDesc: { color: t.text.secondary, fontSize: 13, lineHeight: 18 },
    templateArrow: { color: t.text.muted, fontSize: 18 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: '800', marginBottom: 12 },
    historyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.bg.card, borderRadius: 12, padding: 14, marginBottom: 8 },
    historyBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 12 },
    historyBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
    historyInfo: { flex: 1 },
    historyLabel: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    historyMeta: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    historyCat: { color: t.text.secondary, fontSize: 12, fontWeight: '600' },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    statCard: { flex: 1, backgroundColor: t.bg.card, borderRadius: 12, padding: 16, alignItems: 'center' },
    statNum: { fontSize: 24, fontWeight: '900', marginBottom: 4 },
    statLabel: { color: t.text.muted, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  }), [t]);

  const scannedCount = DEMO_HISTORY.filter(h => h.type === 'scanned').length;
  const generatedCount = DEMO_HISTORY.filter(h => h.type === 'generated').length;

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>QR Hub</Text>
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

        <Text style={s.quote}>
          "Every connection starts with a scan."
        </Text>

        <View style={s.tabRow}>
          {(['scan', 'generate', 'history'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[s.tab, activeTab === tab && s.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                {tab === 'scan' ? 'Scan' : tab === 'generate' ? 'Generate' : 'History'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'scan' && (
          <>
            <View style={s.scanArea}>
              <Text style={s.scanIcon}>{'\u{1F4F7}'}</Text>
              <Text style={s.scanTitle}>Scan QR Code</Text>
              <Text style={s.scanDesc}>
                Point your camera at any QR code to scan payments, identities, invites, documents, and more.
              </Text>
              <TouchableOpacity style={s.scanBtn} onPress={handleScan}>
                <Text style={s.scanBtnText}>Open Scanner</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.recentLabel}>Recently Scanned</Text>
            {DEMO_HISTORY.filter(h => h.type === 'scanned').slice(0, 3).map((entry) => (
              <View key={entry.id} style={s.recentItem}>
                <View style={[s.recentDot, { backgroundColor: t.accent.green }]} />
                <View style={s.recentInfo}>
                  <Text style={s.recentName}>{entry.label}</Text>
                  <Text style={s.recentTime}>{entry.timestamp}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {activeTab === 'generate' && (
          <>
            <Text style={s.sectionTitle}>Choose a Template</Text>
            {QR_TEMPLATES.map((tmpl) => (
              <TouchableOpacity key={tmpl.key} style={s.templateCard} onPress={() => handleGenerate(tmpl)}>
                <Text style={s.templateIcon}>{tmpl.icon}</Text>
                <View style={s.templateInfo}>
                  <Text style={s.templateTitle}>{tmpl.title}</Text>
                  <Text style={s.templateDesc}>{tmpl.description}</Text>
                </View>
                <Text style={s.templateArrow}>{'\u203A'}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {activeTab === 'history' && (
          <>
            <View style={s.statsRow}>
              <View style={s.statCard}>
                <Text style={[s.statNum, { color: t.accent.green }]}>{scannedCount}</Text>
                <Text style={s.statLabel}>Scanned</Text>
              </View>
              <View style={s.statCard}>
                <Text style={[s.statNum, { color: t.accent.blue }]}>{generatedCount}</Text>
                <Text style={s.statLabel}>Generated</Text>
              </View>
              <View style={s.statCard}>
                <Text style={[s.statNum, { color: t.accent.purple }]}>{DEMO_HISTORY.length}</Text>
                <Text style={s.statLabel}>Total</Text>
              </View>
            </View>

            <Text style={s.sectionTitle}>All Activity</Text>
            {DEMO_HISTORY.map((entry) => (
              <View key={entry.id} style={s.historyRow}>
                <View style={[s.historyBadge, { backgroundColor: entry.type === 'scanned' ? t.accent.green : t.accent.blue }]}>
                  <Text style={s.historyBadgeText}>{entry.type === 'scanned' ? 'IN' : 'OUT'}</Text>
                </View>
                <View style={s.historyInfo}>
                  <Text style={s.historyLabel}>{entry.label}</Text>
                  <Text style={s.historyMeta}>{entry.timestamp}</Text>
                </View>
                <Text style={s.historyCat}>{entry.category}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
