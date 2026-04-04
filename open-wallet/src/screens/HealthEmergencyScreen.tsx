import { fonts } from '../utils/theme';
/**
 * Health Emergency Screen — Emergency SOS & Health Network.
 *
 * Article I: "Every dimension of human contribution is valued equally."
 * hOTK represents health value — emergency response is the highest form of care.
 *
 * Features:
 * - Emergency SOS button — broadcasts to nearby UIDs
 * - Emergency contacts (guardian UIDs, health workers, community responders)
 * - Medical profile (blood type, allergies, conditions, medications — ZK-encrypted)
 * - Nearby health workers (registered community responders)
 * - Emergency history (past alerts, response times, outcomes)
 * - First aid guide (offline-accessible)
 * - Emergency fund — quick access to hOTK for medical payments
 * - Regional emergency stats (response times, active responders)
 * - Demo mode with sample data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface EmergencyContact {
  id: string;
  uid: string;
  name: string;
  role: 'guardian' | 'health_worker' | 'community_responder';
  distance: string; // e.g. "0.3 km"
  responseTime: string; // avg e.g. "2 min"
  available: boolean;
}

interface MedicalProfile {
  uid: string;
  bloodType: string;
  allergies: string[];
  conditions: string[];
  medications: string[];
  organDonor: boolean;
  emergencyNotes: string;
  lastUpdated: string;
  zkEncrypted: boolean;
}

interface NearbyResponder {
  id: string;
  uid: string;
  name: string;
  role: string;
  distance: string;
  specialization: string;
  available: boolean;
  avgResponseTime: string;
}

interface EmergencyEvent {
  id: string;
  type: string;
  date: string;
  responseTime: string;
  respondersCount: number;
  outcome: 'resolved' | 'escalated' | 'hospitalized';
  hotkUsed: number;
  description: string;
}

interface FirstAidGuide {
  id: string;
  title: string;
  category: string;
  steps: string[];
  offlineAvailable: boolean;
}

interface RegionalStats {
  avgResponseTime: string;
  activeResponders: number;
  totalEmergencies30d: number;
  resolutionRate: number; // %
  coverageRadius: string;
  hotkPoolAvailable: number;
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_MEDICAL_PROFILE: MedicalProfile = {
  uid: 'you',
  bloodType: 'O+',
  allergies: ['Penicillin', 'Shellfish'],
  conditions: ['Mild asthma'],
  medications: ['Albuterol inhaler (as needed)'],
  organDonor: true,
  emergencyNotes: 'Asthma inhaler in left pocket. Emergency contact: Priya (guardian).',
  lastUpdated: '2026-03-15',
  zkEncrypted: true,
};

const DEMO_CONTACTS: EmergencyContact[] = [
  { id: '1', uid: 'uid-priya-8291', name: 'Priya S.', role: 'guardian', distance: '1.2 km', responseTime: '3 min', available: true },
  { id: '2', uid: 'uid-drrao-4517', name: 'Dr. Rao K.', role: 'health_worker', distance: '0.8 km', responseTime: '5 min', available: true },
  { id: '3', uid: 'uid-anil-6034', name: 'Anil M.', role: 'community_responder', distance: '0.3 km', responseTime: '2 min', available: false },
];

const DEMO_NEARBY_RESPONDERS: NearbyResponder[] = [
  { id: '1', uid: 'uid-drrao-4517', name: 'Dr. Rao K.', role: 'Health Worker', distance: '0.8 km', specialization: 'General Medicine', available: true, avgResponseTime: '5 min' },
  { id: '2', uid: 'uid-sunita-7720', name: 'Sunita P.', role: 'Community Responder', distance: '0.5 km', specialization: 'First Aid / CPR', available: true, avgResponseTime: '3 min' },
  { id: '3', uid: 'uid-anil-6034', name: 'Anil M.', role: 'Community Responder', distance: '0.3 km', specialization: 'Emergency Transport', available: false, avgResponseTime: '2 min' },
  { id: '4', uid: 'uid-maya-1198', name: 'Maya D.', role: 'Health Worker', distance: '1.4 km', specialization: 'Pediatrics', available: true, avgResponseTime: '7 min' },
];

const DEMO_HISTORY: EmergencyEvent[] = [
  { id: '1', type: 'Asthma Attack', date: '2026-03-10', responseTime: '3 min', respondersCount: 2, outcome: 'resolved', hotkUsed: 500, description: 'Mild asthma episode at community park. Inhaler administered by Sunita P.' },
  { id: '2', type: 'Fall Injury', date: '2026-02-18', responseTime: '5 min', respondersCount: 3, outcome: 'escalated', hotkUsed: 1200, description: 'Slip on wet surface. Dr. Rao assessed, recommended clinic visit. Transport by Anil M.' },
  { id: '3', type: 'Allergic Reaction', date: '2026-01-05', responseTime: '2 min', respondersCount: 1, outcome: 'resolved', hotkUsed: 350, description: 'Minor shellfish exposure at community meal. Antihistamine administered.' },
];

const DEMO_FIRST_AID: FirstAidGuide[] = [
  { id: '1', title: 'CPR — Adult', category: 'Life-Threatening', steps: ['Check responsiveness — tap shoulder, shout', 'Call for help / activate SOS', '30 chest compressions (hard, fast, center of chest)', '2 rescue breaths', 'Repeat until help arrives'], offlineAvailable: true },
  { id: '2', title: 'Choking', category: 'Life-Threatening', steps: ['Ask "Are you choking?"', 'Stand behind, wrap arms around waist', '5 abdominal thrusts (Heimlich)', 'Repeat until object dislodges', 'If unconscious, begin CPR'], offlineAvailable: true },
  { id: '3', title: 'Severe Bleeding', category: 'Trauma', steps: ['Apply direct pressure with clean cloth', 'Elevate the injured area above heart', 'Do NOT remove embedded objects', 'Apply tourniquet only if life-threatening', 'Activate SOS for health worker'], offlineAvailable: true },
  { id: '4', title: 'Burns', category: 'Trauma', steps: ['Cool burn under running water for 10+ minutes', 'Remove jewelry near burn', 'Cover with clean, non-stick dressing', 'Do NOT apply ice, butter, or toothpaste', 'Seek medical help for large or deep burns'], offlineAvailable: true },
  { id: '5', title: 'Asthma Attack', category: 'Respiratory', steps: ['Help person sit upright', 'Assist with their inhaler (2 puffs)', 'Encourage slow, steady breathing', 'If no improvement in 5 min, repeat inhaler', 'Activate SOS if breathing worsens'], offlineAvailable: true },
];

const DEMO_REGIONAL_STATS: RegionalStats = {
  avgResponseTime: '4 min',
  activeResponders: 23,
  totalEmergencies30d: 47,
  resolutionRate: 89,
  coverageRadius: '2 km',
  hotkPoolAvailable: 45000,
};

const DEMO_EMERGENCY_FUND = {
  balance: 8500,
  monthlyAllocation: 2000,
  lastUsed: '2026-03-10',
  lastUsedAmount: 500,
};

type Tab = 'emergency' | 'profile' | 'responders' | 'history';

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  guardian: { label: 'Guardian', color: '#AF52DE' },
  health_worker: { label: 'Health Worker', color: '#007AFF' },
  community_responder: { label: 'Responder', color: '#34C759' },
};

const OUTCOME_INFO: Record<string, { label: string; color: string }> = {
  resolved: { label: 'Resolved', color: '#34C759' },
  escalated: { label: 'Escalated', color: '#FF9500' },
  hospitalized: { label: 'Hospitalized', color: '#FF3B30' },
};

// ─── Component ───

export function HealthEmergencyScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('emergency');
  const [sosActive, setSosActive] = useState(false);
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const profile = DEMO_MEDICAL_PROFILE;
  const contacts = DEMO_CONTACTS;
  const responders = DEMO_NEARBY_RESPONDERS;
  const history = DEMO_HISTORY;
  const firstAid = DEMO_FIRST_AID;
  const regionalStats = DEMO_REGIONAL_STATS;
  const emergencyFund = DEMO_EMERGENCY_FUND;

  const handleSOS = useCallback(() => {
    Alert.alert(
      'EMERGENCY SOS',
      'This will broadcast your location and medical profile to all nearby responders and your emergency contacts.\n\nYour encrypted medical data will be disclosed via zero-knowledge proof to verified responders only.\n\nProceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'SEND SOS',
          style: 'destructive',
          onPress: () => {
            setSosActive(true);
            Alert.alert(
              'SOS Broadcast Sent',
              `Alert sent to ${contacts.filter((c) => c.available).length} contacts and ${responders.filter((r) => r.available).length} nearby responders.\n\nNearest responder: ${responders.filter((r) => r.available).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))[0]?.name || 'None'}\n\nEstimated response: ~3 min`,
            );
          },
        },
      ],
    );
  }, [contacts, responders]);

  const handleCancelSOS = useCallback(() => {
    Alert.alert(
      'Cancel SOS',
      'Are you sure you want to cancel the active emergency alert?',
      [
        { text: 'Keep Active', style: 'cancel' },
        { text: 'Cancel SOS', style: 'destructive', onPress: () => setSosActive(false) },
      ],
    );
  }, []);

  const handleEmergencyFund = useCallback(() => {
    Alert.alert(
      'Emergency Fund',
      `Available: ${emergencyFund.balance.toLocaleString()} hOTK\nMonthly allocation: ${emergencyFund.monthlyAllocation.toLocaleString()} hOTK\n\nThis fund is reserved for medical emergencies. Payments go directly to verified health providers.`,
    );
  }, [emergencyFund]);

  const handleContactAlert = useCallback((contact: EmergencyContact) => {
    if (!contact.available) {
      Alert.alert('Unavailable', `${contact.name} is currently offline. SOS will queue for when they come online.`);
      return;
    }
    Alert.alert('Direct Alert', `Send direct emergency alert to ${contact.name} (${ROLE_LABELS[contact.role]?.label})?\n\nDistance: ${contact.distance}\nAvg response: ${contact.responseTime}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send Alert', onPress: () => Alert.alert('Sent', `Alert sent to ${contact.name}.`) },
    ]);
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: '#FF3B30' + '20' },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: '#FF3B30' },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },

    // SOS
    sosContainer: { alignItems: 'center', marginVertical: 20, marginHorizontal: 20 },
    sosButton: { width: 160, height: 160, borderRadius: 80, backgroundColor: '#FF3B30', justifyContent: 'center', alignItems: 'center', shadowColor: '#FF3B30', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 12 },
    sosButtonActive: { backgroundColor: '#FF9500' },
    sosText: { color: '#fff', fontSize: fonts.hero, fontWeight: fonts.heavy, letterSpacing: 2 },
    sosSubtext: { color: '#fff', fontSize: fonts.xs, fontWeight: fonts.semibold, marginTop: 4 },
    sosHint: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginTop: 16, lineHeight: 20 },
    sosActiveTag: { backgroundColor: '#FF3B30' + '20', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, marginTop: 12 },
    sosActiveText: { color: '#FF3B30', fontSize: fonts.sm, fontWeight: fonts.bold },

    // Contacts
    contactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    contactAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    contactAvatarText: { color: '#fff', fontSize: fonts.lg, fontWeight: fonts.bold },
    contactInfo: { flex: 1 },
    contactName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    contactMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    contactRight: { alignItems: 'flex-end' },
    roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    roleBadgeText: { fontSize: fonts.xs, fontWeight: fonts.bold },
    availDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },

    // Medical profile
    profileSection: { marginBottom: 16 },
    profileLabel: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
    profileValue: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    profileChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    profileChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: t.bg.primary },
    profileChipText: { color: t.text.primary, fontSize: fonts.sm },
    profileChipAllergy: { backgroundColor: '#FF3B30' + '15' },
    profileChipAllergyText: { color: '#FF3B30', fontSize: fonts.sm, fontWeight: fonts.semibold },
    profileChipCondition: { backgroundColor: '#FF9500' + '15' },
    profileChipConditionText: { color: '#FF9500', fontSize: fonts.sm, fontWeight: fonts.semibold },
    zkBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.accent.green + '15', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginTop: 12, alignSelf: 'flex-start' },
    zkText: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold },

    // Responders
    responderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    responderInfo: { flex: 1, marginLeft: 12 },
    responderName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    responderRole: { color: t.text.muted, fontSize: fonts.sm, marginTop: 1 },
    responderSpec: { color: t.accent.blue, fontSize: fonts.sm, marginTop: 1 },
    responderRight: { alignItems: 'flex-end' },
    responderDistance: { color: t.text.primary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    responderTime: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },

    // History
    historyRow: { paddingVertical: 14, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    historyType: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    historyDesc: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4, lineHeight: 18 },
    historyMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
    historyMetaItem: { flexDirection: 'row', alignItems: 'center' },
    historyMetaLabel: { color: t.text.muted, fontSize: fonts.xs },
    historyMetaValue: { color: t.text.primary, fontSize: fonts.xs, fontWeight: fonts.semibold, marginLeft: 4 },
    outcomeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    outcomeBadgeText: { fontSize: fonts.xs, fontWeight: fonts.bold },

    // First Aid
    firstAidCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    firstAidTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    firstAidCategory: { color: t.accent.blue, fontSize: fonts.xs, fontWeight: fonts.semibold, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
    firstAidStep: { flexDirection: 'row', marginTop: 8 },
    firstAidStepNum: { color: '#FF3B30', fontSize: fonts.sm, fontWeight: fonts.heavy, width: 22 },
    firstAidStepText: { color: t.text.primary, fontSize: fonts.sm, flex: 1, lineHeight: 18 },
    offlineTag: { backgroundColor: t.accent.green + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', marginTop: 8 },
    offlineTagText: { color: t.accent.green, fontSize: fonts.xs, fontWeight: fonts.bold },

    // Fund
    fundCard: { backgroundColor: '#FF3B30' + '10', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    fundBalance: { color: t.text.primary, fontSize: fonts.hero, fontWeight: fonts.heavy },
    fundLabel: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    fundRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
    fundMeta: { color: t.text.muted, fontSize: fonts.sm },
    fundMetaValue: { color: t.text.primary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    fundBtn: { backgroundColor: '#FF3B30', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 16 },
    fundBtnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },

    // Stats
    statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    statLabel: { color: t.text.muted, fontSize: fonts.md },
    statValue: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },

    // Demo
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.bold },

    // Education
    educationCard: { backgroundColor: '#FF3B30' + '10', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    educationText: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold, textAlign: 'center', lineHeight: 22 },
  }), [t]);

  // ─── Tabs ───

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'emergency', label: 'Emergency' },
    { key: 'profile', label: 'Medical' },
    { key: 'responders', label: 'Responders' },
    { key: 'history', label: 'History' },
  ];

  // ─── Emergency Tab ───

  const renderEmergency = () => (
    <>
      {/* SOS Button */}
      <View style={s.sosContainer}>
        <TouchableOpacity
          style={[s.sosButton, sosActive && s.sosButtonActive]}
          onPress={sosActive ? handleCancelSOS : handleSOS}
          activeOpacity={0.7}
        >
          <Text style={s.sosText}>{sosActive ? 'ACTIVE' : 'SOS'}</Text>
          <Text style={s.sosSubtext}>{sosActive ? 'Tap to cancel' : 'Tap for help'}</Text>
        </TouchableOpacity>
        {sosActive ? (
          <View style={s.sosActiveTag}>
            <Text style={s.sosActiveText}>Broadcasting to nearby responders...</Text>
          </View>
        ) : (
          <Text style={s.sosHint}>
            Broadcasts your location and encrypted medical{'\n'}
            profile to nearby UIDs and emergency contacts.{'\n'}
            Medical data disclosed only via ZK proof.
          </Text>
        )}
      </View>

      {/* Emergency Contacts */}
      <Text style={s.sectionTitle}>Emergency Contacts</Text>
      <View style={s.card}>
        {contacts.map((contact, i) => {
          const role = ROLE_LABELS[contact.role] || ROLE_LABELS.community_responder;
          return (
            <TouchableOpacity key={contact.id} style={[s.contactRow, i === contacts.length - 1 && { borderBottomWidth: 0 }]} onPress={() => handleContactAlert(contact)}>
              <View style={[s.contactAvatar, { backgroundColor: role.color }]}>
                <Text style={s.contactAvatarText}>{contact.name.charAt(0)}</Text>
              </View>
              <View style={s.contactInfo}>
                <Text style={s.contactName}>{contact.name}</Text>
                <Text style={s.contactMeta}>{contact.distance} away  ·  ~{contact.responseTime}</Text>
              </View>
              <View style={s.contactRight}>
                <View style={[s.roleBadge, { backgroundColor: role.color + '20' }]}>
                  <Text style={[s.roleBadgeText, { color: role.color }]}>{role.label}</Text>
                </View>
                <View style={[s.availDot, { backgroundColor: contact.available ? '#34C759' : '#8E8E93' }]} />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Emergency Fund */}
      <Text style={s.sectionTitle}>Emergency Fund</Text>
      <View style={s.fundCard}>
        <Text style={s.fundBalance}>{emergencyFund.balance.toLocaleString()} hOTK</Text>
        <Text style={s.fundLabel}>Available for medical emergencies</Text>
        <View style={s.fundRow}>
          <Text style={s.fundMeta}>Monthly allocation</Text>
          <Text style={s.fundMetaValue}>{emergencyFund.monthlyAllocation.toLocaleString()} hOTK</Text>
        </View>
        <View style={s.fundRow}>
          <Text style={s.fundMeta}>Last used</Text>
          <Text style={s.fundMetaValue}>{emergencyFund.lastUsed} ({emergencyFund.lastUsedAmount} hOTK)</Text>
        </View>
        <TouchableOpacity style={s.fundBtn} onPress={handleEmergencyFund}>
          <Text style={s.fundBtnText}>Access Emergency Fund</Text>
        </TouchableOpacity>
      </View>

      {/* Regional Stats */}
      <Text style={s.sectionTitle}>Regional Emergency Stats</Text>
      <View style={s.card}>
        <View style={s.statRow}>
          <Text style={s.statLabel}>Avg Response Time</Text>
          <Text style={s.statValue}>{regionalStats.avgResponseTime}</Text>
        </View>
        <View style={s.statRow}>
          <Text style={s.statLabel}>Active Responders</Text>
          <Text style={s.statValue}>{regionalStats.activeResponders}</Text>
        </View>
        <View style={s.statRow}>
          <Text style={s.statLabel}>Emergencies (30 days)</Text>
          <Text style={s.statValue}>{regionalStats.totalEmergencies30d}</Text>
        </View>
        <View style={s.statRow}>
          <Text style={s.statLabel}>Resolution Rate</Text>
          <Text style={[s.statValue, { color: t.accent.green }]}>{regionalStats.resolutionRate}%</Text>
        </View>
        <View style={s.statRow}>
          <Text style={s.statLabel}>Coverage Radius</Text>
          <Text style={s.statValue}>{regionalStats.coverageRadius}</Text>
        </View>
        <View style={[s.statRow, { borderBottomWidth: 0 }]}>
          <Text style={s.statLabel}>hOTK Pool Available</Text>
          <Text style={s.statValue}>{regionalStats.hotkPoolAvailable.toLocaleString()}</Text>
        </View>
      </View>
    </>
  );

  // ─── Medical Profile Tab ───

  const renderProfile = () => (
    <>
      <View style={s.card}>
        <View style={s.profileSection}>
          <Text style={s.profileLabel}>Blood Type</Text>
          <Text style={s.profileValue}>{profile.bloodType}</Text>
        </View>

        <View style={s.profileSection}>
          <Text style={s.profileLabel}>Allergies</Text>
          <View style={s.profileChips}>
            {profile.allergies.map((a) => (
              <View key={a} style={[s.profileChip, s.profileChipAllergy]}>
                <Text style={s.profileChipAllergyText}>{a}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.profileSection}>
          <Text style={s.profileLabel}>Conditions</Text>
          <View style={s.profileChips}>
            {profile.conditions.map((c) => (
              <View key={c} style={[s.profileChip, s.profileChipCondition]}>
                <Text style={s.profileChipConditionText}>{c}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.profileSection}>
          <Text style={s.profileLabel}>Medications</Text>
          <View style={s.profileChips}>
            {profile.medications.map((m) => (
              <View key={m} style={s.profileChip}>
                <Text style={s.profileChipText}>{m}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.profileSection}>
          <Text style={s.profileLabel}>Organ Donor</Text>
          <Text style={s.profileValue}>{profile.organDonor ? 'Yes' : 'No'}</Text>
        </View>

        <View style={s.profileSection}>
          <Text style={s.profileLabel}>Emergency Notes</Text>
          <Text style={[s.profileValue, { fontSize: fonts.sm, lineHeight: 20 }]}>{profile.emergencyNotes}</Text>
        </View>

        <View style={s.zkBadge}>
          <Text style={s.zkText}>ZK-Encrypted  ·  Disclosed only in verified emergencies</Text>
        </View>

        <Text style={[s.contactMeta, { marginTop: 12 }]}>Last updated: {profile.lastUpdated}</Text>
      </View>

      {/* First Aid Guide */}
      <Text style={s.sectionTitle}>First Aid Guide (Offline)</Text>
      {firstAid.map((guide) => (
        <View key={guide.id} style={s.firstAidCard}>
          <Text style={s.firstAidTitle}>{guide.title}</Text>
          <Text style={s.firstAidCategory}>{guide.category}</Text>
          {guide.steps.map((step, i) => (
            <View key={i} style={s.firstAidStep}>
              <Text style={s.firstAidStepNum}>{i + 1}.</Text>
              <Text style={s.firstAidStepText}>{step}</Text>
            </View>
          ))}
          {guide.offlineAvailable && (
            <View style={s.offlineTag}>
              <Text style={s.offlineTagText}>OFFLINE AVAILABLE</Text>
            </View>
          )}
        </View>
      ))}

      <View style={s.educationCard}>
        <Text style={s.educationText}>
          Your medical profile is encrypted with zero-knowledge proofs.{'\n'}
          In an emergency, only verified responders can access{'\n'}
          the specific data they need — nothing more.{'\n\n'}
          Your privacy is your right. Your safety is our mission.
        </Text>
      </View>
    </>
  );

  // ─── Responders Tab ───

  const renderResponders = () => (
    <>
      <Text style={s.sectionTitle}>Nearby Health Workers & Responders</Text>
      <View style={s.card}>
        {responders.map((r, i) => (
          <View key={r.id} style={[s.responderRow, i === responders.length - 1 && { borderBottomWidth: 0 }]}>
            <View style={[s.contactAvatar, { backgroundColor: r.available ? t.accent.green : '#8E8E93' }]}>
              <Text style={s.contactAvatarText}>{r.name.charAt(0)}</Text>
            </View>
            <View style={s.responderInfo}>
              <Text style={s.responderName}>{r.name}</Text>
              <Text style={s.responderRole}>{r.role}</Text>
              <Text style={s.responderSpec}>{r.specialization}</Text>
            </View>
            <View style={s.responderRight}>
              <Text style={s.responderDistance}>{r.distance}</Text>
              <Text style={s.responderTime}>~{r.avgResponseTime}</Text>
              <View style={[s.availDot, { backgroundColor: r.available ? '#34C759' : '#8E8E93', marginTop: 4 }]} />
            </View>
          </View>
        ))}
      </View>

      <View style={s.educationCard}>
        <Text style={s.educationText}>
          Community responders earn hOTK for every emergency they help resolve.{'\n'}
          Faster response = higher reward.{'\n\n'}
          Register as a responder to serve your community{'\n'}
          and earn health value tokens.
        </Text>
      </View>
    </>
  );

  // ─── History Tab ───

  const renderHistory = () => (
    <>
      <Text style={s.sectionTitle}>Emergency History</Text>
      <View style={s.card}>
        {history.map((event, i) => {
          const outcome = OUTCOME_INFO[event.outcome] || OUTCOME_INFO.resolved;
          return (
            <View key={event.id} style={[s.historyRow, i === history.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={s.historyType}>{event.type}</Text>
              <Text style={s.historyDesc}>{event.description}</Text>
              <View style={s.historyMeta}>
                <View style={s.historyMetaItem}>
                  <Text style={s.historyMetaLabel}>Date:</Text>
                  <Text style={s.historyMetaValue}>{event.date}</Text>
                </View>
                <View style={s.historyMetaItem}>
                  <Text style={s.historyMetaLabel}>Response:</Text>
                  <Text style={s.historyMetaValue}>{event.responseTime}</Text>
                </View>
                <View style={s.historyMetaItem}>
                  <Text style={s.historyMetaLabel}>Responders:</Text>
                  <Text style={s.historyMetaValue}>{event.respondersCount}</Text>
                </View>
                <View style={s.historyMetaItem}>
                  <Text style={s.historyMetaLabel}>hOTK:</Text>
                  <Text style={s.historyMetaValue}>{event.hotkUsed}</Text>
                </View>
                <View style={[s.outcomeBadge, { backgroundColor: outcome.color + '20' }]}>
                  <Text style={[s.outcomeBadgeText, { color: outcome.color }]}>{outcome.label}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Summary Stats */}
      <View style={s.card}>
        <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Summary</Text>
        <View style={s.statRow}>
          <Text style={s.statLabel}>Total Emergencies</Text>
          <Text style={s.statValue}>{history.length}</Text>
        </View>
        <View style={s.statRow}>
          <Text style={s.statLabel}>Avg Response Time</Text>
          <Text style={s.statValue}>{Math.round(history.reduce((sum, e) => sum + parseInt(e.responseTime), 0) / history.length)} min</Text>
        </View>
        <View style={s.statRow}>
          <Text style={s.statLabel}>Total hOTK Used</Text>
          <Text style={s.statValue}>{history.reduce((sum, e) => sum + e.hotkUsed, 0).toLocaleString()}</Text>
        </View>
        <View style={[s.statRow, { borderBottomWidth: 0 }]}>
          <Text style={s.statLabel}>Resolved On-Site</Text>
          <Text style={[s.statValue, { color: t.accent.green }]}>{history.filter((e) => e.outcome === 'resolved').length} / {history.length}</Text>
        </View>
      </View>
    </>
  );

  // ─── Render ───

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Health Emergency</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      {demoMode && (
        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO DATA</Text>
        </View>
      )}

      <View style={s.tabRow}>
        {tabs.map((t_) => (
          <TouchableOpacity
            key={t_.key}
            style={[s.tabBtn, tab === t_.key && s.tabActive]}
            onPress={() => setTab(t_.key)}
          >
            <Text style={[s.tabText, tab === t_.key && s.tabTextActive]}>{t_.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {tab === 'emergency' && renderEmergency()}
        {tab === 'profile' && renderProfile()}
        {tab === 'responders' && renderResponders()}
        {tab === 'history' && renderHistory()}
      </ScrollView>
    </SafeAreaView>
  );
}
