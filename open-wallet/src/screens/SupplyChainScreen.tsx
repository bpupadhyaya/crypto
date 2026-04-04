import { fonts } from '../utils/theme';
/**
 * Supply Chain Screen — Art I (xOTK): Track goods from production to consumption.
 *
 * Product journey tracking, origin verification, producer registration,
 * quality certifications — all verified on-chain for full transparency.
 * Demo mode provides sample products, producers, and certifications.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

interface JourneyStep {
  stage: string;
  location: string;
  date: string;
  handler: string;
  verified: boolean;
  txHash: string;
}

interface Product {
  id: string;
  name: string;
  producer: string;
  category: string;
  certifications: string[];
  transparencyScore: number;
  journey: JourneyStep[];
  currentStage: string;
}

interface Producer {
  id: string;
  name: string;
  location: string;
  products: number;
  registeredAt: string;
  verified: boolean;
  certifications: string[];
}

interface Certification {
  id: string;
  name: string;
  icon: string;
  description: string;
  verifiedOn: string;
  issuedBy: string;
  txHash: string;
}

type TabKey = 'track' | 'verify' | 'produce' | 'certify';

const DEMO_PRODUCTS: Product[] = [
  {
    id: 'prod-001', name: 'Organic Basmati Rice (5kg)', producer: 'Green Valley Farms',
    category: 'Grain', certifications: ['Organic', 'Fair Trade'],
    transparencyScore: 96,
    currentStage: 'Market',
    journey: [
      { stage: 'Farm', location: 'Punjab, India', date: '2026-01-15', handler: 'Green Valley Farms', verified: true, txHash: '0xabc1...farm' },
      { stage: 'Processing', location: 'Amritsar Mill', date: '2026-02-01', handler: 'Amritsar Grain Processing', verified: true, txHash: '0xabc2...proc' },
      { stage: 'Transport', location: 'Delhi Hub', date: '2026-02-10', handler: 'National Logistics Co.', verified: true, txHash: '0xabc3...trans' },
      { stage: 'Market', location: 'Mumbai Organic Store', date: '2026-02-18', handler: 'Fresh & Pure Market', verified: true, txHash: '0xabc4...mkt' },
    ],
  },
  {
    id: 'prod-002', name: 'Handwoven Silk Scarf', producer: 'Artisan Weavers Collective',
    category: 'Textile', certifications: ['Handmade', 'Fair Trade', 'Local'],
    transparencyScore: 92,
    currentStage: 'Consumer',
    journey: [
      { stage: 'Farm', location: 'Assam, India', date: '2026-01-05', handler: 'Silk Farm Cooperative', verified: true, txHash: '0xdef1...silk' },
      { stage: 'Processing', location: 'Varanasi Workshop', date: '2026-01-20', handler: 'Artisan Weavers Collective', verified: true, txHash: '0xdef2...weave' },
      { stage: 'Transport', location: 'Regional Courier', date: '2026-02-05', handler: 'Craft Logistics', verified: true, txHash: '0xdef3...ship' },
      { stage: 'Market', location: 'Craft Market Online', date: '2026-02-12', handler: 'Global Artisan Hub', verified: true, txHash: '0xdef4...list' },
      { stage: 'Consumer', location: 'Delivered', date: '2026-02-20', handler: 'End Consumer', verified: true, txHash: '0xdef5...dlvr' },
    ],
  },
  {
    id: 'prod-003', name: 'Cold-Pressed Coconut Oil (1L)', producer: 'Kerala Coco Co.',
    category: 'Food', certifications: ['Organic', 'Local'],
    transparencyScore: 88,
    currentStage: 'Transport',
    journey: [
      { stage: 'Farm', location: 'Kerala, India', date: '2026-02-20', handler: 'Kerala Coco Co.', verified: true, txHash: '0xghi1...coco' },
      { stage: 'Processing', location: 'Kochi Cold Press Unit', date: '2026-03-01', handler: 'Kerala Coco Co.', verified: true, txHash: '0xghi2...press' },
      { stage: 'Transport', location: 'In Transit', date: '2026-03-15', handler: 'Southern Express', verified: false, txHash: '0xghi3...pending' },
    ],
  },
];

const DEMO_PRODUCERS: Producer[] = [
  {
    id: 'producer-1', name: 'Green Valley Farms', location: 'Punjab, India',
    products: 12, registeredAt: '2025-06-10', verified: true,
    certifications: ['Organic', 'Fair Trade'],
  },
  {
    id: 'producer-2', name: 'Artisan Weavers Collective', location: 'Varanasi, India',
    products: 8, registeredAt: '2025-09-22', verified: true,
    certifications: ['Handmade', 'Fair Trade', 'Local'],
  },
];

const DEMO_CERTIFICATIONS: Certification[] = [
  { id: 'cert-1', name: 'Organic', icon: '🌿', description: 'Produced without synthetic pesticides, fertilizers, or GMOs. Verified through soil and product testing.', verifiedOn: '2026-01-10', issuedBy: 'Open Chain Certification DAO', txHash: '0xcert1...organic' },
  { id: 'cert-2', name: 'Fair Trade', icon: '🤝', description: 'Producer receives fair compensation. Workers have safe conditions and living wages.', verifiedOn: '2026-01-15', issuedBy: 'Fair Trade Validator Network', txHash: '0xcert2...fairtrade' },
  { id: 'cert-3', name: 'Local', icon: '📍', description: 'Sourced and produced within 200km radius. Supports local economy and reduces transport emissions.', verifiedOn: '2026-02-01', issuedBy: 'Regional Chain Validators', txHash: '0xcert3...local' },
  { id: 'cert-4', name: 'Handmade', icon: '✋', description: 'Crafted by hand using traditional methods. No mass production or factory involvement.', verifiedOn: '2026-02-05', issuedBy: 'Artisan Verification Guild', txHash: '0xcert4...handmade' },
];

const STAGE_COLORS: Record<string, string> = {
  Farm: '#10B981',
  Processing: '#3B82F6',
  Transport: '#F59E0B',
  Market: '#8B5CF6',
  Consumer: '#EC4899',
};

const CERT_COLORS: Record<string, string> = {
  Organic: '#10B981',
  'Fair Trade': '#3B82F6',
  Local: '#F59E0B',
  Handmade: '#8B5CF6',
};

export function SupplyChainScreen({ onClose }: Props) {
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const [tab, setTab] = useState<TabKey>('track');
  const [products] = useState<Product[]>(DEMO_PRODUCTS);
  const [producers] = useState<Producer[]>(DEMO_PRODUCERS);
  const [certifications] = useState<Certification[]>(DEMO_CERTIFICATIONS);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);

  // Verify form
  const [scanCode, setScanCode] = useState('');

  // Producer registration form
  const [regName, setRegName] = useState('');
  const [regLocation, setRegLocation] = useState('');
  const [regProducts, setRegProducts] = useState('');

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.bold },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingHorizontal: 16 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 20, marginBottom: 8, marginLeft: 4 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    label: { color: t.text.secondary, fontSize: 13 },
    value: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    titleText: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 4 },
    descText: { color: t.text.secondary, fontSize: 13, marginBottom: 8, lineHeight: 18 },
    tabRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: t.bg.card },
    tabActive: { backgroundColor: t.accent.green },
    tabText: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', paddingVertical: 40 },
    btn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
    btnPrimary: { backgroundColor: t.accent.green },
    btnSecondary: { backgroundColor: t.accent.blue },
    btnText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    input: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 14, marginBottom: 12 },
    inputMulti: { minHeight: 80, textAlignVertical: 'top' },
    journeyLine: { marginLeft: 12, borderLeftWidth: 2, borderLeftColor: t.border, paddingLeft: 16 },
    journeyStep: { marginBottom: 16, position: 'relative' },
    journeyDot: { width: 12, height: 12, borderRadius: 6, position: 'absolute', left: -23, top: 4 },
    journeyStage: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    journeyLocation: { color: t.text.secondary, fontSize: 13, marginTop: 2 },
    journeyHandler: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    journeyDate: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    journeyTx: { color: t.accent.blue, fontSize: 10, marginTop: 2 },
    verifiedBadge: { color: t.accent.green, fontSize: 11, fontWeight: fonts.bold, marginTop: 2 },
    certRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 6 },
    certTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    certText: { fontSize: 11, fontWeight: fonts.bold, color: '#fff' },
    scoreBar: { height: 8, borderRadius: 4, backgroundColor: t.bg.primary, marginTop: 6, marginBottom: 4 },
    scoreFill: { height: 8, borderRadius: 4 },
    producerCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    producerName: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 2 },
    producerLoc: { color: t.text.secondary, fontSize: 13, marginBottom: 8 },
    certCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    certIcon: { fontSize: 28, marginBottom: 8 },
    certName: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 4 },
    certDesc: { color: t.text.secondary, fontSize: 13, lineHeight: 18, marginBottom: 8 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: t.border },
    detailLabel: { color: t.text.secondary, fontSize: 13 },
    detailValue: { color: t.text.primary, fontSize: 13, fontWeight: fonts.semibold, maxWidth: '60%', textAlign: 'right' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
    statusText: { fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase', color: '#fff' },
  }), [t]);

  const handleVerify = useCallback(() => {
    if (!scanCode.trim()) { Alert.alert('Required', 'Enter or scan a product code to verify.'); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const found = products.find((p) => p.id === scanCode.trim() || p.name.toLowerCase().includes(scanCode.toLowerCase()));
      if (found) {
        setSelectedProduct(found);
        setTab('track');
      } else {
        Alert.alert('Not Found', 'No product found with that code. Try "prod-001", "prod-002", or "prod-003" in demo mode.');
      }
      setScanCode('');
    }, 1000);
  }, [scanCode, products]);

  const handleRegisterProducer = useCallback(() => {
    if (!regName.trim()) { Alert.alert('Required', 'Enter your farm or business name.'); return; }
    if (!regLocation.trim()) { Alert.alert('Required', 'Enter your location.'); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Registration Submitted', 'Your producer profile has been submitted for on-chain verification. You will be notified once verified.');
      setRegName('');
      setRegLocation('');
      setRegProducts('');
    }, 1200);
  }, [regName, regLocation]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return t.accent.green;
    if (score >= 70) return t.accent.blue;
    if (score >= 50) return '#F59E0B';
    return t.accent.red;
  };

  // ─── Product Detail View ───
  if (selectedProduct) {
    const p = selectedProduct;
    return (
      <SafeAreaView style={st.container}>
        <View style={st.header}>
          <TouchableOpacity onPress={() => setSelectedProduct(null)}>
            <Text style={st.closeBtn}>Back</Text>
          </TouchableOpacity>
          <Text style={st.title}>Product Journey</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={st.scroll}>
          <View style={st.card}>
            <Text style={st.titleText}>{p.name}</Text>
            <Text style={st.descText}>{p.producer} — {p.category}</Text>

            <View style={st.certRow}>
              {p.certifications.map((c) => (
                <View key={c} style={[st.certTag, { backgroundColor: CERT_COLORS[c] || '#666' }]}>
                  <Text style={st.certText}>{c}</Text>
                </View>
              ))}
            </View>

            <View style={st.row}>
              <Text style={st.label}>Transparency Score</Text>
              <Text style={[st.value, { color: getScoreColor(p.transparencyScore) }]}>{p.transparencyScore}%</Text>
            </View>
            <View style={st.scoreBar}>
              <View style={[st.scoreFill, {
                width: `${p.transparencyScore}%`,
                backgroundColor: getScoreColor(p.transparencyScore),
              }]} />
            </View>
          </View>

          <Text style={st.section}>Supply Chain Journey</Text>
          <View style={st.journeyLine}>
            {p.journey.map((step, i) => (
              <View key={i} style={st.journeyStep}>
                <View style={[st.journeyDot, { backgroundColor: STAGE_COLORS[step.stage] || '#666' }]} />
                <Text style={[st.journeyStage, { color: STAGE_COLORS[step.stage] || t.text.primary }]}>
                  {step.stage}
                </Text>
                <Text style={st.journeyLocation}>{step.location}</Text>
                <Text style={st.journeyHandler}>{step.handler}</Text>
                <Text style={st.journeyDate}>{step.date}</Text>
                <Text style={st.journeyTx}>tx: {step.txHash}</Text>
                <Text style={step.verified ? st.verifiedBadge : [st.verifiedBadge, { color: '#F59E0B' }]}>
                  {step.verified ? 'VERIFIED ON-CHAIN' : 'PENDING VERIFICATION'}
                </Text>
              </View>
            ))}
          </View>

          <View style={st.card}>
            <View style={st.row}>
              <Text style={st.label}>Current Stage</Text>
              <View style={[st.statusBadge, { backgroundColor: STAGE_COLORS[p.currentStage] || '#666' }]}>
                <Text style={st.statusText}>{p.currentStage}</Text>
              </View>
            </View>
            <View style={st.row}>
              <Text style={st.label}>Journey Steps</Text>
              <Text style={st.value}>{p.journey.length}</Text>
            </View>
            <View style={st.row}>
              <Text style={st.label}>Verified Steps</Text>
              <Text style={[st.value, { color: t.accent.green }]}>
                {p.journey.filter((s) => s.verified).length} / {p.journey.length}
              </Text>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Tabs ───
  const TABS: { key: TabKey; label: string }[] = [
    { key: 'track', label: 'Track' },
    { key: 'verify', label: 'Verify' },
    { key: 'produce', label: 'Produce' },
    { key: 'certify', label: 'Certify' },
  ];

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeBtn}>Close</Text>
        </TouchableOpacity>
        <Text style={st.title}>Supply Chain</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        <View style={st.tabRow}>
          {TABS.map((tb) => (
            <TouchableOpacity
              key={tb.key}
              style={[st.tab, tab === tb.key && st.tabActive]}
              onPress={() => setTab(tb.key)}
            >
              <Text style={[st.tabText, tab === tb.key && st.tabTextActive]}>{tb.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={st.scroll}>
        {/* ─── Track Products Tab ─── */}
        {tab === 'track' && (
          <>
            <Text style={st.section}>Products ({products.length})</Text>
            {products.map((p) => (
              <TouchableOpacity key={p.id} style={st.card} onPress={() => setSelectedProduct(p)} activeOpacity={0.7}>
                <Text style={st.titleText}>{p.name}</Text>
                <Text style={st.descText}>{p.producer}</Text>

                <View style={st.certRow}>
                  {p.certifications.map((c) => (
                    <View key={c} style={[st.certTag, { backgroundColor: CERT_COLORS[c] || '#666' }]}>
                      <Text style={st.certText}>{c}</Text>
                    </View>
                  ))}
                </View>

                <View style={st.row}>
                  <Text style={st.label}>Current Stage</Text>
                  <View style={[st.statusBadge, { backgroundColor: STAGE_COLORS[p.currentStage] || '#666' }]}>
                    <Text style={st.statusText}>{p.currentStage}</Text>
                  </View>
                </View>

                <View style={st.row}>
                  <Text style={st.label}>Transparency</Text>
                  <Text style={[st.value, { color: getScoreColor(p.transparencyScore) }]}>{p.transparencyScore}%</Text>
                </View>
                <View style={st.scoreBar}>
                  <View style={[st.scoreFill, {
                    width: `${p.transparencyScore}%`,
                    backgroundColor: getScoreColor(p.transparencyScore),
                  }]} />
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* ─── Verify Origin Tab ─── */}
        {tab === 'verify' && (
          <>
            <Text style={st.section}>Verify Product Origin</Text>
            <View style={st.card}>
              <Text style={st.descText}>
                Enter a product code or scan a QR code to see the full supply chain history verified on-chain.
              </Text>
              <TextInput
                style={st.input}
                placeholder="Enter product code (e.g. prod-001)"
                placeholderTextColor={t.text.muted}
                value={scanCode}
                onChangeText={setScanCode}
                autoCapitalize="none"
              />
              <TouchableOpacity style={[st.btn, st.btnPrimary]} onPress={handleVerify} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={st.btnText}>Verify Origin</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[st.btn, st.btnSecondary]}
                onPress={() => Alert.alert('Scan QR', 'Camera will open to scan product QR code.')}
              >
                <Text style={st.btnText}>Scan QR Code</Text>
              </TouchableOpacity>
            </View>

            <View style={st.card}>
              <Text style={[st.label, { textAlign: 'center', lineHeight: 20 }]}>
                Every step in the supply chain is recorded on Open Chain. Verify any product's journey from farm to your hands.
              </Text>
            </View>
          </>
        )}

        {/* ─── Producer Registration Tab ─── */}
        {tab === 'produce' && (
          <>
            <Text style={st.section}>Registered Producers</Text>
            {producers.map((pr) => (
              <View key={pr.id} style={st.producerCard}>
                <View style={st.row}>
                  <Text style={st.producerName}>{pr.name}</Text>
                  <View style={[st.statusBadge, { backgroundColor: pr.verified ? t.accent.green : '#F59E0B' }]}>
                    <Text style={st.statusText}>{pr.verified ? 'Verified' : 'Pending'}</Text>
                  </View>
                </View>
                <Text style={st.producerLoc}>{pr.location}</Text>

                <View style={st.certRow}>
                  {pr.certifications.map((c) => (
                    <View key={c} style={[st.certTag, { backgroundColor: CERT_COLORS[c] || '#666' }]}>
                      <Text style={st.certText}>{c}</Text>
                    </View>
                  ))}
                </View>

                <View style={st.row}>
                  <Text style={st.label}>Products Listed</Text>
                  <Text style={st.value}>{pr.products}</Text>
                </View>
                <View style={st.row}>
                  <Text style={st.label}>Registered</Text>
                  <Text style={st.label}>{pr.registeredAt}</Text>
                </View>
              </View>
            ))}

            <Text style={st.section}>Register as Producer</Text>
            <TextInput
              style={st.input}
              placeholder="Farm or business name"
              placeholderTextColor={t.text.muted}
              value={regName}
              onChangeText={setRegName}
            />
            <TextInput
              style={st.input}
              placeholder="Location (city, region, country)"
              placeholderTextColor={t.text.muted}
              value={regLocation}
              onChangeText={setRegLocation}
            />
            <TextInput
              style={[st.input, st.inputMulti]}
              placeholder="Describe your products (types, methods, certifications you hold)..."
              placeholderTextColor={t.text.muted}
              value={regProducts}
              onChangeText={setRegProducts}
              multiline
            />
            <TouchableOpacity style={[st.btn, st.btnPrimary]} onPress={handleRegisterProducer} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={st.btnText}>Register Producer</Text>}
            </TouchableOpacity>
          </>
        )}

        {/* ─── Certifications Tab ─── */}
        {tab === 'certify' && (
          <>
            <Text style={st.section}>On-Chain Certifications ({certifications.length})</Text>
            {certifications.map((cert) => (
              <View key={cert.id} style={st.certCard}>
                <Text style={st.certIcon}>{cert.icon}</Text>
                <Text style={st.certName}>{cert.name}</Text>
                <Text style={st.certDesc}>{cert.description}</Text>

                <View style={st.detailRow}>
                  <Text style={st.detailLabel}>Verified On</Text>
                  <Text style={st.detailValue}>{cert.verifiedOn}</Text>
                </View>
                <View style={st.detailRow}>
                  <Text style={st.detailLabel}>Issued By</Text>
                  <Text style={st.detailValue}>{cert.issuedBy}</Text>
                </View>
                <View style={[st.detailRow, { borderBottomWidth: 0 }]}>
                  <Text style={st.detailLabel}>Tx Hash</Text>
                  <Text style={[st.detailValue, { color: t.accent.blue }]}>{cert.txHash}</Text>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={[st.btn, st.btnSecondary]}
              onPress={() => Alert.alert('Apply for Certification', 'Submit your products for on-chain certification review. Validators will verify your claims.')}
            >
              <Text style={st.btnText}>Apply for Certification</Text>
            </TouchableOpacity>
          </>
        )}

        {!demoMode && tab === 'track' && products.length === 0 && (
          <View style={[st.card, { alignItems: 'center' }]}>
            <Text style={{ color: t.text.muted, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
              Enable Demo Mode in Settings to see sample supply chain products. Register as a producer to add your own products.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
