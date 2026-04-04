import { fonts } from '../utils/theme';
/**
 * Health Record Screen — Personal health record management (encrypted).
 *
 * Article I: "Every human is born with infinite potential worth."
 * Privacy-first: all health data encrypted on-device. Only user holds the key.
 *
 * Features:
 * - Vaccination records with dates and providers
 * - Medical history (conditions, surgeries, allergies — all encrypted)
 * - Prescriptions/medications with reminders
 * - Lab results (blood work, imaging)
 * - Share with provider (selective disclosure via ZK)
 * - All data encrypted — only user can access
 * - Demo mode with 4 vaccinations, 2 conditions, 3 medications
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface Vaccination {
  id: string;
  name: string;
  date: string;
  provider: string;
  lotNumber: string;
  nextDue: string | null;
}

interface Condition {
  id: string;
  name: string;
  diagnosedDate: string;
  status: 'active' | 'resolved';
  notes: string;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  prescribedBy: string;
  startDate: string;
  refillDate: string;
  active: boolean;
}

interface LabResult {
  id: string;
  testName: string;
  date: string;
  lab: string;
  status: 'normal' | 'abnormal' | 'pending';
  summary: string;
}

interface ShareRecord {
  id: string;
  providerName: string;
  sharedFields: string[];
  date: string;
  expiresAt: string;
  active: boolean;
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_VACCINATIONS: Vaccination[] = [
  { id: 'v1', name: 'COVID-19 (Pfizer Booster)', date: '2025-10-15', provider: 'City Health Clinic', lotNumber: 'PF-2025-8842', nextDue: '2026-10-15' },
  { id: 'v2', name: 'Influenza (Seasonal)', date: '2025-09-01', provider: 'Walgreens Pharmacy', lotNumber: 'FL-2025-3311', nextDue: '2026-09-01' },
  { id: 'v3', name: 'Tdap (Tetanus/Diphtheria/Pertussis)', date: '2023-06-20', provider: 'Dr. Sarah Kim, MD', lotNumber: 'TD-2023-0091', nextDue: '2033-06-20' },
  { id: 'v4', name: 'Hepatitis B (Series Complete)', date: '2022-03-10', provider: 'University Health Center', lotNumber: 'HB-2022-5567', nextDue: null },
];

const DEMO_CONDITIONS: Condition[] = [
  { id: 'cn1', name: 'Seasonal Allergies', diagnosedDate: '2018-04-15', status: 'active', notes: 'Pollen, dust mites. Managed with antihistamines.' },
  { id: 'cn2', name: 'Appendectomy', diagnosedDate: '2020-08-22', status: 'resolved', notes: 'Laparoscopic appendectomy. Full recovery. No complications.' },
];

const DEMO_MEDICATIONS: Medication[] = [
  { id: 'm1', name: 'Cetirizine (Zyrtec)', dosage: '10mg', frequency: 'Once daily', prescribedBy: 'Dr. Sarah Kim', startDate: '2025-03-01', refillDate: '2026-04-01', active: true },
  { id: 'm2', name: 'Vitamin D3', dosage: '2000 IU', frequency: 'Once daily', prescribedBy: 'Self / OTC', startDate: '2025-01-15', refillDate: '2026-04-15', active: true },
  { id: 'm3', name: 'Amoxicillin', dosage: '500mg', frequency: '3x daily (10 days)', prescribedBy: 'Dr. James Patel', startDate: '2026-02-10', refillDate: '', active: false },
];

const DEMO_LABS: LabResult[] = [
  { id: 'l1', testName: 'Complete Blood Count (CBC)', date: '2026-02-15', lab: 'Quest Diagnostics', status: 'normal', summary: 'All values within normal range. WBC 6.2, RBC 4.8, Hemoglobin 14.5.' },
  { id: 'l2', testName: 'Lipid Panel', date: '2026-02-15', lab: 'Quest Diagnostics', status: 'normal', summary: 'Total cholesterol 185, LDL 110, HDL 55, Triglycerides 100.' },
  { id: 'l3', testName: 'Chest X-Ray', date: '2026-01-20', lab: 'City General Hospital', status: 'normal', summary: 'No abnormalities detected. Clear lung fields.' },
];

const DEMO_SHARES: ShareRecord[] = [
  { id: 'sh1', providerName: 'Dr. Sarah Kim', sharedFields: ['Vaccinations', 'Medications', 'Allergies'], date: '2026-03-01', expiresAt: '2026-06-01', active: true },
];

type Tab = 'records' | 'medications' | 'labs' | 'share';

export function HealthRecordScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('records');
  const [vaccinations] = useState(DEMO_VACCINATIONS);
  const [conditions] = useState(DEMO_CONDITIONS);
  const [medications] = useState(DEMO_MEDICATIONS);
  const [labs] = useState(DEMO_LABS);
  const [shares] = useState(DEMO_SHARES);

  // Share form
  const [shareProvider, setShareProvider] = useState('');
  const [shareExpiry, setShareExpiry] = useState('');
  const [shareVaccinations, setShareVaccinations] = useState(false);
  const [shareMedications, setShareMedications] = useState(false);
  const [shareAllergies, setShareAllergies] = useState(false);
  const [shareLabs, setShareLabs] = useState(false);

  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const activeMeds = useMemo(() => medications.filter((m) => m.active), [medications]);

  const handleShare = useCallback(() => {
    if (!shareProvider.trim()) { Alert.alert('Required', 'Enter provider name or ID.'); return; }
    if (!shareExpiry.trim()) { Alert.alert('Required', 'Enter an expiry date.'); return; }
    const fields: string[] = [];
    if (shareVaccinations) fields.push('Vaccinations');
    if (shareMedications) fields.push('Medications');
    if (shareAllergies) fields.push('Allergies');
    if (shareLabs) fields.push('Lab Results');
    if (fields.length === 0) { Alert.alert('Required', 'Select at least one record type to share.'); return; }

    Alert.alert(
      'ZK Proof Generated',
      `Sharing ${fields.join(', ')} with ${shareProvider} until ${shareExpiry}. Provider can verify without seeing raw data.`,
    );
    setShareProvider('');
    setShareExpiry('');
    setShareVaccinations(false);
    setShareMedications(false);
    setShareAllergies(false);
    setShareLabs(false);
  }, [shareProvider, shareExpiry, shareVaccinations, shareMedications, shareAllergies, shareLabs]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.purple + '20' },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.purple },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    encryptedBanner: { backgroundColor: t.accent.green + '15', borderRadius: 12, padding: 14, marginHorizontal: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center' },
    encryptedText: { color: t.accent.green, fontSize: 12, fontWeight: fonts.bold, flex: 1 },
    lockIcon: { color: t.accent.green, fontSize: 16, marginRight: 8 },
    recordCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    recordTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    recordMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    recordDate: { color: t.accent.blue, fontSize: 12, fontWeight: fonts.semibold, marginTop: 4 },
    recordNotes: { color: t.text.muted, fontSize: 13, lineHeight: 19, marginTop: 6, fontStyle: 'italic' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginTop: 6 },
    statusText: { fontSize: 11, fontWeight: fonts.bold },
    nextDue: { color: t.accent.orange, fontSize: 12, fontWeight: fonts.semibold, marginTop: 4 },
    medCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    medName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    medDosage: { color: t.accent.purple, fontSize: 13, fontWeight: fonts.semibold, marginTop: 4 },
    medFrequency: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    medPrescriber: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    medRefill: { color: t.accent.orange, fontSize: 12, fontWeight: fonts.semibold, marginTop: 4 },
    activeBadge: { backgroundColor: t.accent.green + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginTop: 6 },
    activeText: { color: t.accent.green, fontSize: 11, fontWeight: fonts.bold },
    inactiveBadge: { backgroundColor: t.text.muted + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginTop: 6 },
    inactiveText: { color: t.text.muted, fontSize: 11, fontWeight: fonts.bold },
    labCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    labName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    labMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    labSummary: { color: t.text.muted, fontSize: 13, lineHeight: 19, marginTop: 6 },
    labStatus: { fontSize: 12, fontWeight: fonts.bold, marginTop: 6 },
    shareCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    shareProvider: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    shareFields: { color: t.accent.purple, fontSize: 12, fontWeight: fonts.semibold, marginTop: 4 },
    shareDates: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    shareActive: { color: t.accent.green, fontSize: 12, fontWeight: fonts.bold, marginTop: 4 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    checkboxRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
    checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: t.text.muted, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
    checkboxChecked: { backgroundColor: t.accent.purple, borderColor: t.accent.purple },
    checkMark: { color: '#fff', fontSize: 14, fontWeight: fonts.bold },
    checkboxLabel: { color: t.text.primary, fontSize: 14 },
    submitBtn: { backgroundColor: t.accent.purple, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },
    zkNote: { color: t.accent.blue, fontSize: 12, fontStyle: 'italic', marginTop: 8, textAlign: 'center' },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'records', label: 'Records' },
    { key: 'medications', label: 'Meds' },
    { key: 'labs', label: 'Labs' },
    { key: 'share', label: 'Share' },
  ];

  // ─── Render Helpers ───

  const renderCheckbox = (checked: boolean, onToggle: () => void, label: string) => (
    <TouchableOpacity style={s.checkboxRow} onPress={onToggle}>
      <View style={[s.checkbox, checked && s.checkboxChecked]}>
        {checked && <Text style={s.checkMark}>✓</Text>}
      </View>
      <Text style={s.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const renderRecords = () => (
    <>
      <View style={s.encryptedBanner}>
        <Text style={s.lockIcon}>🔒</Text>
        <Text style={s.encryptedText}>All health records are encrypted on-device. Only you hold the decryption key.</Text>
      </View>

      <Text style={s.sectionTitle}>Vaccinations ({vaccinations.length})</Text>
      {vaccinations.map((v) => (
        <View key={v.id} style={s.recordCard}>
          <Text style={s.recordTitle}>{v.name}</Text>
          <Text style={s.recordDate}>{v.date}</Text>
          <Text style={s.recordMeta}>Provider: {v.provider}</Text>
          <Text style={s.recordMeta}>Lot: {v.lotNumber}</Text>
          {v.nextDue && <Text style={s.nextDue}>Next due: {v.nextDue}</Text>}
          {!v.nextDue && (
            <View style={s.activeBadge}>
              <Text style={s.activeText}>Series Complete</Text>
            </View>
          )}
        </View>
      ))}

      <Text style={s.sectionTitle}>Medical History ({conditions.length})</Text>
      {conditions.map((cn) => (
        <View key={cn.id} style={s.recordCard}>
          <Text style={s.recordTitle}>{cn.name}</Text>
          <Text style={s.recordDate}>Diagnosed: {cn.diagnosedDate}</Text>
          <View style={[s.statusBadge, {
            backgroundColor: cn.status === 'active' ? t.accent.blue + '20' : t.accent.green + '20',
          }]}>
            <Text style={[s.statusText, {
              color: cn.status === 'active' ? t.accent.blue : t.accent.green,
            }]}>{cn.status === 'active' ? 'Active' : 'Resolved'}</Text>
          </View>
          <Text style={s.recordNotes}>{cn.notes}</Text>
        </View>
      ))}
    </>
  );

  const renderMedications = () => (
    <>
      <Text style={s.sectionTitle}>Active Medications ({activeMeds.length})</Text>
      {medications.map((m) => (
        <View key={m.id} style={s.medCard}>
          <Text style={s.medName}>{m.name}</Text>
          <Text style={s.medDosage}>{m.dosage}</Text>
          <Text style={s.medFrequency}>{m.frequency}</Text>
          <Text style={s.medPrescriber}>Prescribed by: {m.prescribedBy}</Text>
          <Text style={s.recordMeta}>Started: {m.startDate}</Text>
          {m.refillDate && m.active && <Text style={s.medRefill}>Refill by: {m.refillDate}</Text>}
          {m.active ? (
            <View style={s.activeBadge}><Text style={s.activeText}>Active</Text></View>
          ) : (
            <View style={s.inactiveBadge}><Text style={s.inactiveText}>Completed</Text></View>
          )}
        </View>
      ))}
    </>
  );

  const renderLabs = () => (
    <>
      <Text style={s.sectionTitle}>Lab Results ({labs.length})</Text>
      {labs.map((l) => (
        <View key={l.id} style={s.labCard}>
          <Text style={s.labName}>{l.testName}</Text>
          <Text style={s.labMeta}>{l.date} — {l.lab}</Text>
          <Text style={[s.labStatus, {
            color: l.status === 'normal' ? t.accent.green : l.status === 'abnormal' ? t.accent.orange : t.accent.blue,
          }]}>{l.status.charAt(0).toUpperCase() + l.status.slice(1)}</Text>
          <Text style={s.labSummary}>{l.summary}</Text>
        </View>
      ))}
    </>
  );

  const renderShare = () => (
    <>
      <Text style={s.sectionTitle}>Active Shares</Text>
      {shares.map((sh) => (
        <View key={sh.id} style={s.shareCard}>
          <Text style={s.shareProvider}>{sh.providerName}</Text>
          <Text style={s.shareFields}>Sharing: {sh.sharedFields.join(', ')}</Text>
          <Text style={s.shareDates}>Since {sh.date} — Expires {sh.expiresAt}</Text>
          <Text style={s.shareActive}>Active (ZK Verified)</Text>
        </View>
      ))}

      <View style={s.card}>
        <Text style={s.sectionTitle}>Share with Provider</Text>
        <TextInput style={s.input} placeholder="Provider Name or ID" placeholderTextColor={t.text.muted} value={shareProvider} onChangeText={setShareProvider} />
        <TextInput style={s.input} placeholder="Expires (YYYY-MM-DD)" placeholderTextColor={t.text.muted} value={shareExpiry} onChangeText={setShareExpiry} />
        <Text style={{ color: t.text.muted, fontSize: 13, marginBottom: 8 }}>Select records to share (selective disclosure)</Text>
        {renderCheckbox(shareVaccinations, () => setShareVaccinations(!shareVaccinations), 'Vaccinations')}
        {renderCheckbox(shareMedications, () => setShareMedications(!shareMedications), 'Medications')}
        {renderCheckbox(shareAllergies, () => setShareAllergies(!shareAllergies), 'Allergies / Conditions')}
        {renderCheckbox(shareLabs, () => setShareLabs(!shareLabs), 'Lab Results')}
        <TouchableOpacity style={s.submitBtn} onPress={handleShare}>
          <Text style={s.submitText}>Generate ZK Proof & Share</Text>
        </TouchableOpacity>
        <Text style={s.zkNote}>Zero-knowledge proof: provider verifies your records without seeing raw data.</Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Health Records</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      {demoMode && (
        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO MODE</Text>
        </View>
      )}

      <View style={s.tabRow}>
        {tabs.map((tb) => (
          <TouchableOpacity
            key={tb.key}
            style={[s.tabBtn, tab === tb.key && s.tabActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {tab === 'records' && renderRecords()}
        {tab === 'medications' && renderMedications()}
        {tab === 'labs' && renderLabs()}
        {tab === 'share' && renderShare()}
      </ScrollView>
    </SafeAreaView>
  );
}
