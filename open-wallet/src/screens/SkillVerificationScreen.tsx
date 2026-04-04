import { fonts } from '../utils/theme';
/**
 * Skill Verification Screen — On-chain credential verification and skill proofs.
 *
 * Enriches Art I (eOTK): credentials are soulbound attestations that
 * prove competence, education, and community recognition. Verifiers
 * stake reputation to vouch for credential authenticity.
 *
 * "Every person's skills belong to them — verified, portable, sovereign."
 * — Human Constitution, Article I
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

/* ── data types ── */

type CredentialStatus = 'verified' | 'pending' | 'revoked';
type CredentialType = 'academic' | 'professional' | 'language' | 'trade' | 'community';
type Tab = 'my-credentials' | 'verify' | 'endorsements';

interface Credential {
  id: string;
  title: string;
  type: CredentialType;
  issuer: string;
  issuerType: 'institution' | 'community';
  date: string;
  status: CredentialStatus;
  verificationCount: number;
  badge: string;
  color: string;
  description: string;
}

interface PeerEndorsement {
  id: string;
  skill: string;
  endorser: string;
  endorserScore: number;
  date: string;
  message: string;
  badge: string;
}

interface TrustedIssuer {
  id: string;
  name: string;
  type: 'institution' | 'community';
  credentialsIssued: number;
  trustScore: number;
  badge: string;
}

/* ── demo data ── */

const CREDENTIAL_TYPE_META: Record<CredentialType, { label: string; badge: string; color: string }> = {
  academic: { label: 'Academic Degree', badge: '\u{1F393}', color: '#3b82f6' },
  professional: { label: 'Professional Cert', badge: '\u{1F4BC}', color: '#8b5cf6' },
  language: { label: 'Language Proficiency', badge: '\u{1F30D}', color: '#06b6d4' },
  trade: { label: 'Trade Skill', badge: '\u{1F527}', color: '#f97316' },
  community: { label: 'Community Recognition', badge: '\u{1F91D}', color: '#22c55e' },
};

const DEMO_CREDENTIALS: Credential[] = [
  {
    id: 'cred-001', title: 'B.S. Computer Science', type: 'academic',
    issuer: 'State University (uid-inst-001)', issuerType: 'institution',
    date: '2024-05-15', status: 'verified', verificationCount: 12,
    badge: '\u{1F393}', color: '#3b82f6',
    description: 'Bachelor of Science in Computer Science, cum laude',
  },
  {
    id: 'cred-002', title: 'AWS Solutions Architect', type: 'professional',
    issuer: 'Amazon Web Services (uid-inst-002)', issuerType: 'institution',
    date: '2025-08-20', status: 'verified', verificationCount: 8,
    badge: '\u{1F4BC}', color: '#8b5cf6',
    description: 'Associate-level cloud architecture certification',
  },
  {
    id: 'cred-003', title: 'Spanish C1 (DELE)', type: 'language',
    issuer: 'Instituto Cervantes (uid-inst-003)', issuerType: 'institution',
    date: '2025-11-10', status: 'verified', verificationCount: 5,
    badge: '\u{1F30D}', color: '#06b6d4',
    description: 'Advanced proficiency in Spanish language',
  },
  {
    id: 'cred-004', title: 'Residential Electrician', type: 'trade',
    issuer: 'National Trade Board (uid-inst-004)', issuerType: 'institution',
    date: '2026-01-08', status: 'verified', verificationCount: 15,
    badge: '\u{1F527}', color: '#f97316',
    description: 'Licensed residential electrical installation and repair',
  },
  {
    id: 'cred-005', title: 'First Aid & CPR Instructor', type: 'professional',
    issuer: 'Red Cross Chapter (uid-inst-005)', issuerType: 'institution',
    date: '2026-02-28', status: 'pending', verificationCount: 0,
    badge: '\u{1F3E5}', color: '#ef4444',
    description: 'Certified to teach first aid and CPR courses',
  },
  {
    id: 'cred-006', title: 'Community Garden Leader', type: 'community',
    issuer: 'Neighborhood Council (uid-comm-001)', issuerType: 'community',
    date: '2026-03-12', status: 'pending', verificationCount: 0,
    badge: '\u{1F33B}', color: '#22c55e',
    description: 'Recognized for organizing and leading the community garden program',
  },
];

const DEMO_ENDORSEMENTS: PeerEndorsement[] = [
  {
    id: 'end-001', skill: 'JavaScript & React', endorser: 'openchain1abc...dev_sarah',
    endorserScore: 8200, date: '2026-03-10', badge: '\u{1F4BB}',
    message: 'Excellent problem-solving skills. Built our entire frontend together.',
  },
  {
    id: 'end-002', skill: 'Project Management', endorser: 'openchain1def...lead_james',
    endorserScore: 12400, date: '2026-02-22', badge: '\u{1F4CB}',
    message: 'Consistently delivers on time. Great at coordinating cross-functional teams.',
  },
  {
    id: 'end-003', skill: 'Public Speaking', endorser: 'openchain1ghi...coach_ana',
    endorserScore: 6800, date: '2026-01-15', badge: '\u{1F3A4}',
    message: 'Presented at our community meetup — clear, confident, engaging.',
  },
];

const DEMO_ISSUERS: TrustedIssuer[] = [
  { id: 'iss-001', name: 'State University', type: 'institution', credentialsIssued: 14200, trustScore: 98, badge: '\u{1F3EB}' },
  { id: 'iss-002', name: 'Amazon Web Services', type: 'institution', credentialsIssued: 248000, trustScore: 99, badge: '\u{2601}\u{FE0F}' },
  { id: 'iss-003', name: 'Instituto Cervantes', type: 'institution', credentialsIssued: 8700, trustScore: 97, badge: '\u{1F30D}' },
  { id: 'iss-004', name: 'National Trade Board', type: 'institution', credentialsIssued: 31500, trustScore: 96, badge: '\u{1F3ED}' },
  { id: 'iss-005', name: 'Neighborhood Council', type: 'community', credentialsIssued: 340, trustScore: 88, badge: '\u{1F3D8}\u{FE0F}' },
  { id: 'iss-006', name: 'Open Chain Validators', type: 'community', credentialsIssued: 5600, trustScore: 94, badge: '\u{1F6E1}\u{FE0F}' },
];

/* ── verification workflow steps ── */

const WORKFLOW_STEPS = [
  { step: 1, label: 'Submit Credential', desc: 'Upload proof and select issuer', icon: '\u{1F4E4}' },
  { step: 2, label: 'Verifier Reviews', desc: 'Trusted verifier examines evidence', icon: '\u{1F50D}' },
  { step: 3, label: 'On-Chain Attestation', desc: 'Verifier signs attestation tx', icon: '\u{26D3}\u{FE0F}' },
  { step: 4, label: 'Soulbound Badge', desc: 'Non-transferable credential issued', icon: '\u{1F3C5}' },
];

export function SkillVerificationScreen({ onClose }: Props) {
  const t = useTheme();
  const demoMode = useWalletStore((s) => s.demoMode);
  const [activeTab, setActiveTab] = useState<Tab>('my-credentials');
  const [filterType, setFilterType] = useState<CredentialType | null>(null);
  const [credentialIdInput, setCredentialIdInput] = useState('');
  const [showIssuers, setShowIssuers] = useState(false);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [shareCredentialId, setShareCredentialId] = useState<string | null>(null);

  const filteredCredentials = useMemo(() => {
    if (!filterType) return DEMO_CREDENTIALS;
    return DEMO_CREDENTIALS.filter((c) => c.type === filterType);
  }, [filterType]);

  const verifiedCount = DEMO_CREDENTIALS.filter((c) => c.status === 'verified').length;
  const pendingCount = DEMO_CREDENTIALS.filter((c) => c.status === 'pending').length;

  const handleVerifyCredential = useCallback(() => {
    if (!credentialIdInput.trim()) {
      Alert.alert('Enter Credential ID', 'Scan or paste a credential ID to verify.');
      return;
    }
    Alert.alert(
      'Credential Found',
      `Credential "${credentialIdInput.trim()}" located on-chain.\n\nIssuer: State University\nHolder: openchain1xyz...user_kim\nStatus: Verified (8 attestations)\n\nWould you like to add your attestation?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Attest', onPress: () => {
          Alert.alert('Attestation Submitted', 'Your on-chain attestation has been broadcast. Thank you for verifying!');
          setCredentialIdInput('');
        }},
      ],
    );
  }, [credentialIdInput]);

  const handleShareCredential = useCallback((credId: string) => {
    setShareCredentialId(credId === shareCredentialId ? null : credId);
  }, [shareCredentialId]);

  const handleSubmitNewCredential = useCallback(() => {
    Alert.alert(
      'Submit Credential',
      'This will initiate the verification workflow:\n\n1. Upload proof document\n2. Select issuer from registry\n3. Wait for verifier review\n4. Receive soulbound badge\n\nProceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start', onPress: () => Alert.alert('Submitted', 'Your credential has been submitted for verification. You will be notified when a verifier reviews it.') },
      ],
    );
  }, []);

  const handleEndorse = useCallback(() => {
    Alert.alert(
      'Endorse a Peer',
      'Enter the peer\'s Open Chain address and the skill you want to endorse. Your contribution score backs the endorsement weight.',
      [{ text: 'OK' }],
    );
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    heroCard: { backgroundColor: t.accent.blue + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSub: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginTop: 6, lineHeight: 18, fontStyle: 'italic' },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 22, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 16, backgroundColor: t.bg.card, borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    tabTextActive: { color: t.bg.primary },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.semibold },
    section: { marginHorizontal: 20, marginTop: 20 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12 },
    sectionSub: { color: t.text.muted, fontSize: 12, marginBottom: 12, lineHeight: 18 },
    filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    filterChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, backgroundColor: t.bg.card, borderWidth: 1, borderColor: t.border },
    filterChipActive: { borderColor: t.accent.blue, backgroundColor: t.accent.blue + '20' },
    filterChipText: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.semibold },
    filterChipTextActive: { color: t.accent.blue },
    credCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4 },
    credBadge: { fontSize: 36, marginBottom: 8 },
    credTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    credType: { fontSize: 11, fontWeight: fonts.bold, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.8 },
    credIssuer: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    credDate: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    credDesc: { color: t.text.secondary, fontSize: 12, marginTop: 6, lineHeight: 18 },
    credFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
    verifyCount: { color: t.text.muted, fontSize: 11 },
    soulbound: { color: t.accent.orange, fontSize: 10, fontWeight: fonts.bold, marginTop: 6, textTransform: 'uppercase', letterSpacing: 1 },
    shareBtn: { backgroundColor: t.accent.blue + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginTop: 8, alignSelf: 'flex-start' },
    shareBtnText: { color: t.accent.blue, fontSize: 12, fontWeight: fonts.semibold },
    shareBox: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, marginTop: 8, borderWidth: 1, borderColor: t.border },
    shareTitle: { color: t.text.primary, fontSize: 13, fontWeight: fonts.bold, marginBottom: 6 },
    shareOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
    shareOptionIcon: { fontSize: 20 },
    shareOptionText: { color: t.text.secondary, fontSize: 13 },
    shareNote: { color: t.text.muted, fontSize: 10, marginTop: 8, fontStyle: 'italic' },
    // Verify tab
    input: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 14, borderWidth: 1, borderColor: t.border, marginBottom: 12 },
    actionBtn: { backgroundColor: t.accent.blue, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
    actionBtnText: { color: '#fff', fontSize: 16, fontWeight: fonts.bold },
    secondaryBtn: { backgroundColor: t.accent.purple, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
    secondaryBtnText: { color: '#fff', fontSize: 16, fontWeight: fonts.bold },
    scanBtn: { backgroundColor: t.bg.card, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: t.border },
    scanBtnText: { color: t.text.secondary, fontSize: 14, fontWeight: fonts.semibold },
    orText: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginBottom: 12 },
    // Workflow
    workflowCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginTop: 12 },
    workflowTitle: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold, marginBottom: 12 },
    workflowStep: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 12 },
    workflowIcon: { fontSize: 24, width: 32, textAlign: 'center' },
    workflowInfo: { flex: 1 },
    workflowLabel: { color: t.text.primary, fontSize: 13, fontWeight: fonts.bold },
    workflowDesc: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    workflowLine: { width: 2, height: 12, backgroundColor: t.border, marginLeft: 15, marginBottom: 4 },
    // Issuer registry
    issuerCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
    issuerBadge: { fontSize: 28 },
    issuerInfo: { flex: 1 },
    issuerName: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    issuerMeta: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    issuerTrust: { alignItems: 'center' },
    issuerTrustValue: { color: t.accent.green, fontSize: 16, fontWeight: fonts.heavy },
    issuerTrustLabel: { color: t.text.muted, fontSize: 10 },
    toggleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, marginTop: 8 },
    toggleBtnText: { color: t.accent.blue, fontSize: 13, fontWeight: fonts.semibold },
    // Endorsements
    endorseCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    endorseBadge: { fontSize: 32, marginBottom: 8 },
    endorseSkill: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    endorseFrom: { color: t.accent.blue, fontSize: 12, fontWeight: fonts.semibold, marginTop: 4 },
    endorseScore: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    endorseMessage: { color: t.text.secondary, fontSize: 13, marginTop: 8, lineHeight: 20, fontStyle: 'italic' },
    endorseDate: { color: t.text.muted, fontSize: 11, marginTop: 6 },
    endorseNote: { color: t.text.muted, fontSize: 11, textAlign: 'center', marginTop: 8, lineHeight: 16 },
    emptyText: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 24 },
  }), [t]);

  const getStatusStyle = (status: CredentialStatus) => {
    switch (status) {
      case 'verified': return { bg: t.accent.green + '20', text: t.accent.green };
      case 'pending': return { bg: t.accent.orange + '20', text: t.accent.orange };
      case 'revoked': return { bg: '#ef4444' + '20', text: '#ef4444' };
    }
  };

  /* ── My Credentials tab ── */
  const renderMyCredentials = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>My Credentials</Text>

      {/* Type filter */}
      <View style={s.filterRow}>
        <TouchableOpacity
          style={[s.filterChip, !filterType && s.filterChipActive]}
          onPress={() => setFilterType(null)}
        >
          <Text style={[s.filterChipText, !filterType && s.filterChipTextActive]}>All</Text>
        </TouchableOpacity>
        {(Object.keys(CREDENTIAL_TYPE_META) as CredentialType[]).map((type) => (
          <TouchableOpacity
            key={type}
            style={[s.filterChip, filterType === type && s.filterChipActive]}
            onPress={() => setFilterType(filterType === type ? null : type)}
          >
            <Text style={[s.filterChipText, filterType === type && s.filterChipTextActive]}>
              {CREDENTIAL_TYPE_META[type].badge} {CREDENTIAL_TYPE_META[type].label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Credential cards */}
      {filteredCredentials.map((cred) => {
        const ss = getStatusStyle(cred.status);
        return (
          <View key={cred.id} style={[s.credCard, { borderLeftColor: cred.color }]}>
            <Text style={s.credBadge}>{cred.badge}</Text>
            <Text style={s.credTitle}>{cred.title}</Text>
            <Text style={[s.credType, { color: cred.color }]}>
              {CREDENTIAL_TYPE_META[cred.type].label}
            </Text>
            <Text style={s.credIssuer}>Issuer: {cred.issuer}</Text>
            <Text style={s.credDate}>Issued: {cred.date}</Text>
            <Text style={s.credDesc}>{cred.description}</Text>

            <View style={s.credFooter}>
              <View style={[s.statusBadge, { backgroundColor: ss.bg }]}>
                <Text style={[s.statusText, { color: ss.text }]}>{cred.status}</Text>
              </View>
              {cred.status === 'verified' && (
                <Text style={s.verifyCount}>{cred.verificationCount} attestations</Text>
              )}
            </View>

            {cred.status === 'verified' && (
              <Text style={s.soulbound}>Soulbound Badge</Text>
            )}

            {/* Share / selective disclosure */}
            {cred.status === 'verified' && (
              <>
                <TouchableOpacity style={s.shareBtn} onPress={() => handleShareCredential(cred.id)}>
                  <Text style={s.shareBtnText}>Share Credential</Text>
                </TouchableOpacity>

                {shareCredentialId === cred.id && (
                  <View style={s.shareBox}>
                    <Text style={s.shareTitle}>Selective Disclosure</Text>
                    <TouchableOpacity style={s.shareOption} onPress={() => Alert.alert('QR Generated', 'Show this QR code to share your credential. Only the fields you select will be visible.')}>
                      <Text style={s.shareOptionIcon}>{'\u{1F4F1}'}</Text>
                      <Text style={s.shareOptionText}>Generate QR Code</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.shareOption} onPress={() => Alert.alert('Link Copied', `openchain://verify/${cred.id}\n\nThis link allows selective disclosure of your credential.`)}>
                      <Text style={s.shareOptionIcon}>{'\u{1F517}'}</Text>
                      <Text style={s.shareOptionText}>Copy Shareable Link</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.shareOption} onPress={() => Alert.alert('Selective Fields', 'Choose which fields to disclose:\n\n- Title only\n- Title + Issuer\n- Title + Issuer + Date\n- Full credential\n\nZero-knowledge proofs ensure privacy.')}>
                      <Text style={s.shareOptionIcon}>{'\u{1F50F}'}</Text>
                      <Text style={s.shareOptionText}>Choose Fields to Disclose</Text>
                    </TouchableOpacity>
                    <Text style={s.shareNote}>Zero-knowledge proofs protect your privacy</Text>
                  </View>
                )}
              </>
            )}
          </View>
        );
      })}

      {filteredCredentials.length === 0 && (
        <Text style={s.emptyText}>No credentials match this filter.</Text>
      )}

      {/* Submit new credential */}
      <TouchableOpacity style={s.secondaryBtn} onPress={handleSubmitNewCredential}>
        <Text style={s.secondaryBtnText}>Submit New Credential</Text>
      </TouchableOpacity>

      {/* Verification workflow */}
      <TouchableOpacity style={s.toggleBtn} onPress={() => setShowWorkflow(!showWorkflow)}>
        <Text style={s.toggleBtnText}>{showWorkflow ? 'Hide' : 'Show'} Verification Workflow</Text>
      </TouchableOpacity>

      {showWorkflow && (
        <View style={s.workflowCard}>
          <Text style={s.workflowTitle}>How Verification Works</Text>
          {WORKFLOW_STEPS.map((ws, i) => (
            <React.Fragment key={ws.step}>
              <View style={s.workflowStep}>
                <Text style={s.workflowIcon}>{ws.icon}</Text>
                <View style={s.workflowInfo}>
                  <Text style={s.workflowLabel}>{ws.step}. {ws.label}</Text>
                  <Text style={s.workflowDesc}>{ws.desc}</Text>
                </View>
              </View>
              {i < WORKFLOW_STEPS.length - 1 && <View style={s.workflowLine} />}
            </React.Fragment>
          ))}
        </View>
      )}
    </View>
  );

  /* ── Verify tab ── */
  const renderVerify = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Verify Someone's Credential</Text>
      <Text style={s.sectionSub}>
        Scan a QR code or paste a credential ID to verify and optionally add your on-chain attestation.
      </Text>

      <TouchableOpacity style={s.scanBtn} onPress={() => Alert.alert('Scan QR', 'Camera would open to scan a credential QR code.')}>
        <Text style={s.scanBtnText}>{'\u{1F4F7}'}  Scan Credential QR</Text>
      </TouchableOpacity>

      <Text style={s.orText}>or paste credential ID</Text>

      <TextInput
        style={s.input}
        placeholder="e.g. cred-001-abc-xyz..."
        placeholderTextColor={t.text.muted}
        value={credentialIdInput}
        onChangeText={setCredentialIdInput}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TouchableOpacity style={s.actionBtn} onPress={handleVerifyCredential}>
        <Text style={s.actionBtnText}>Verify & Attest</Text>
      </TouchableOpacity>

      {/* Issuer registry */}
      <TouchableOpacity style={s.toggleBtn} onPress={() => setShowIssuers(!showIssuers)}>
        <Text style={s.toggleBtnText}>{showIssuers ? 'Hide' : 'Show'} Trusted Issuer Registry</Text>
      </TouchableOpacity>

      {showIssuers && (
        <View style={{ marginTop: 8 }}>
          <Text style={s.sectionTitle}>Trusted Issuers</Text>
          <Text style={s.sectionSub}>
            Institutions and community verifiers recognized by the Open Chain network.
          </Text>

          {DEMO_ISSUERS.map((issuer) => (
            <View key={issuer.id} style={s.issuerCard}>
              <Text style={s.issuerBadge}>{issuer.badge}</Text>
              <View style={s.issuerInfo}>
                <Text style={s.issuerName}>{issuer.name}</Text>
                <Text style={s.issuerMeta}>
                  {issuer.type === 'institution' ? 'Institution' : 'Community Verifier'} {'\u{2022}'} {issuer.credentialsIssued.toLocaleString()} credentials
                </Text>
              </View>
              <View style={s.issuerTrust}>
                <Text style={s.issuerTrustValue}>{issuer.trustScore}%</Text>
                <Text style={s.issuerTrustLabel}>Trust</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  /* ── Endorsements tab ── */
  const renderEndorsements = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Peer Endorsements</Text>
      <Text style={s.sectionSub}>
        On-chain skill endorsements from peers. Unlike centralized platforms, these are
        cryptographically signed and weighted by the endorser's contribution score.
      </Text>

      {DEMO_ENDORSEMENTS.map((end) => (
        <View key={end.id} style={s.endorseCard}>
          <Text style={s.endorseBadge}>{end.badge}</Text>
          <Text style={s.endorseSkill}>{end.skill}</Text>
          <Text style={s.endorseFrom}>From: {end.endorser}</Text>
          <Text style={s.endorseScore}>Endorser score: {end.endorserScore.toLocaleString()} (weight factor)</Text>
          <Text style={s.endorseMessage}>"{end.message}"</Text>
          <Text style={s.endorseDate}>{end.date}</Text>
        </View>
      ))}

      <Text style={s.endorseNote}>
        Endorsement weight scales with the endorser's contribution score.{'\n'}
        Higher-scored peers give stronger endorsements.
      </Text>

      <TouchableOpacity style={s.actionBtn} onPress={handleEndorse}>
        <Text style={s.actionBtnText}>Endorse a Peer</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Skill Verification</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={s.heroCard}>
          <Text style={s.heroIcon}>{'\u{1F3C5}'}</Text>
          <Text style={s.heroTitle}>On-Chain Credentials</Text>
          <Text style={s.heroSub}>
            "Verified skills, portable and sovereign — your proof travels with you."
          </Text>
          <View style={s.statRow}>
            <View style={s.statItem}>
              <Text style={[s.statValue, { color: t.accent.green }]}>{verifiedCount}</Text>
              <Text style={s.statLabel}>Verified</Text>
            </View>
            <View style={s.statItem}>
              <Text style={[s.statValue, { color: t.accent.orange }]}>{pendingCount}</Text>
              <Text style={s.statLabel}>Pending</Text>
            </View>
            <View style={s.statItem}>
              <Text style={[s.statValue, { color: t.accent.blue }]}>{DEMO_ENDORSEMENTS.length}</Text>
              <Text style={s.statLabel}>Endorsements</Text>
            </View>
          </View>
        </View>

        {/* Demo tag */}
        {demoMode && (
          <View style={s.demoTag}>
            <Text style={s.demoText}>DEMO DATA</Text>
          </View>
        )}

        {/* Tabs */}
        <View style={s.tabRow}>
          {([
            { key: 'my-credentials' as Tab, label: 'My Credentials' },
            { key: 'verify' as Tab, label: 'Verify' },
            { key: 'endorsements' as Tab, label: 'Endorsements' },
          ]).map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[s.tab, activeTab === tab.key && s.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        {activeTab === 'my-credentials' && renderMyCredentials()}
        {activeTab === 'verify' && renderVerify()}
        {activeTab === 'endorsements' && renderEndorsements()}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
