import { fonts } from '../utils/theme';
/**
 * PQC Key Screen — Article VII of The Human Constitution.
 *
 * Post-Quantum Cryptography Key Management.
 *
 * Three tabs:
 *   STATUS  — Key type dashboard, PQC readiness score, quantum threat warning
 *   MIGRATE — 3-step wizard: generate PQC key, create hybrid, verify + activate
 *   INFO    — Current key details, comparison table (sizes, speed)
 *
 * Demo mode shows a hybrid key active with migration stats.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

type Tab = 'status' | 'migrate' | 'info';
type MigrationStep = 0 | 1 | 2 | 3; // 0 = not started, 1-3 = wizard steps

interface KeyType {
  id: 'classical' | 'hybrid' | 'post-quantum';
  label: string;
  algorithm: string;
  status: 'active' | 'recommended' | 'future';
  description: string;
}

interface ComparisonRow {
  label: string;
  classical: string;
  hybrid: string;
  postQuantum: string;
}

// ─── Demo Data ───

const KEY_TYPES: KeyType[] = [
  {
    id: 'classical',
    label: 'Classical',
    algorithm: 'Ed25519',
    status: 'active',
    description: 'Current signing key. Fast and widely supported, but vulnerable to future quantum computers.',
  },
  {
    id: 'hybrid',
    label: 'Hybrid',
    algorithm: 'Ed25519 + ML-DSA-65',
    status: 'recommended',
    description: 'Combines classical and post-quantum signatures. Recommended migration target — secure against both classical and quantum attacks.',
  },
  {
    id: 'post-quantum',
    label: 'Post-Quantum',
    algorithm: 'ML-DSA-65',
    status: 'future',
    description: 'Standalone post-quantum signature. Will become the default once the ecosystem fully transitions.',
  },
];

const COMPARISON_DATA: ComparisonRow[] = [
  { label: 'Public Key Size', classical: '32 bytes', hybrid: '1,984 bytes', postQuantum: '1,952 bytes' },
  { label: 'Signature Size', classical: '64 bytes', hybrid: '3,373 bytes', postQuantum: '3,309 bytes' },
  { label: 'Key Generation', classical: '~0.1 ms', hybrid: '~2.5 ms', postQuantum: '~2.3 ms' },
  { label: 'Sign Speed', classical: '~0.1 ms', hybrid: '~3.0 ms', postQuantum: '~2.8 ms' },
  { label: 'Verify Speed', classical: '~0.2 ms', hybrid: '~3.5 ms', postQuantum: '~3.2 ms' },
  { label: 'NIST Level', classical: '—', hybrid: 'Level 3', postQuantum: 'Level 3' },
  { label: 'Quantum Safe', classical: 'No', hybrid: 'Yes', postQuantum: 'Yes' },
];

const DEMO_KEY_INFO = {
  algorithm: 'Ed25519 + ML-DSA-65 (Hybrid)',
  created: '2026-03-15',
  signatureCount: 1_247,
  strengthRating: 'Strong',
  fingerprint: 'a3f8:c91b:27d4:e605',
  hybridActiveSince: '2026-03-18',
};

const DEMO_READINESS = {
  hybridPercent: 73,
  totalTransactions: 1_712,
  hybridTransactions: 1_250,
  classicalRemaining: 462,
  migrationStarted: '2026-03-18',
};

const DEMO_THREAT_LEVEL: 'low' | 'moderate' | 'elevated' | 'high' = 'moderate';

export function PQCKeyScreen({ onClose }: Props) {
  const { demoMode } = useWalletStore();
  const t = useTheme();

  const [activeTab, setActiveTab] = useState<Tab>('status');
  const [migrationStep, setMigrationStep] = useState<MigrationStep>(demoMode ? 3 : 0);
  const [activeKeyType, setActiveKeyType] = useState<'classical' | 'hybrid' | 'post-quantum'>(
    demoMode ? 'hybrid' : 'classical',
  );

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 20, paddingVertical: 16,
    },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    subtitle: { color: t.text.secondary, fontSize: fonts.sm, marginHorizontal: 20, marginBottom: 16 },

    // ─── Tabs ───
    tabRow: {
      flexDirection: 'row', marginHorizontal: 20, marginBottom: 20,
      backgroundColor: t.bg.card, borderRadius: 12, padding: 4,
    },
    tab: {
      flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10,
    },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.bold },

    // ─── Cards ───
    card: {
      backgroundColor: t.bg.card, borderRadius: 16, padding: 16,
      marginHorizontal: 20, marginBottom: 12,
    },
    cardHighlight: { borderWidth: 2, borderColor: t.accent.green },
    cardRecommended: { borderWidth: 1, borderColor: t.accent.blue + '60' },
    cardFuture: { borderWidth: 1, borderColor: t.border },

    sectionHeader: {
      color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase',
      letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 20,
    },

    // ─── Key Type Cards ───
    keyTypeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    keyTypeDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
    keyTypeLabel: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, flex: 1 },
    keyTypeBadge: {
      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    },
    keyTypeBadgeText: { fontSize: fonts.xs, fontWeight: fonts.bold },
    keyTypeAlgo: { color: t.accent.blue, fontSize: fonts.sm, fontWeight: fonts.semibold, marginBottom: 6 },
    keyTypeDesc: { color: t.text.muted, fontSize: fonts.sm, lineHeight: 19 },

    // ─── Readiness Score ───
    readinessContainer: {
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: t.bg.card, borderRadius: 20,
      paddingVertical: 24, marginHorizontal: 20, marginBottom: 16,
    },
    readinessNumber: { fontSize: 52, fontWeight: fonts.heavy },
    readinessLabel: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 4 },
    readinessBar: {
      height: 8, backgroundColor: t.border, borderRadius: 4,
      marginHorizontal: 32, marginTop: 16, width: '80%' as any,
    },
    readinessFill: { height: 8, borderRadius: 4 },
    readinessStats: {
      flexDirection: 'row', justifyContent: 'space-around',
      marginTop: 16, width: '100%',
    },
    readinessStat: { alignItems: 'center' },
    readinessStatValue: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold },
    readinessStatLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },

    // ─── Threat Warning ───
    warningCard: {
      backgroundColor: t.accent.yellow + '15', borderRadius: 16, padding: 16,
      marginHorizontal: 20, marginBottom: 12, borderWidth: 1,
      borderColor: t.accent.yellow + '40',
    },
    warningTitle: { color: t.accent.yellow, fontSize: fonts.md, fontWeight: fonts.bold, marginBottom: 6 },
    warningText: { color: t.text.primary, fontSize: fonts.sm, lineHeight: 19 },

    // ─── Migration Wizard ───
    wizardStepRow: {
      flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 20,
    },
    wizardStepCircle: {
      width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    },
    wizardStepCircleActive: { backgroundColor: t.accent.blue },
    wizardStepCircleDone: { backgroundColor: t.accent.green },
    wizardStepCirclePending: { backgroundColor: t.border },
    wizardStepNumber: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    wizardStepLine: { flex: 1, height: 2, marginHorizontal: 8 },
    wizardStepLineDone: { backgroundColor: t.accent.green },
    wizardStepLinePending: { backgroundColor: t.border },

    wizardCard: {
      backgroundColor: t.bg.card, borderRadius: 16, padding: 20,
      marginHorizontal: 20, marginBottom: 16,
    },
    wizardTitle: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy, marginBottom: 8 },
    wizardDesc: { color: t.text.muted, fontSize: fonts.md, lineHeight: 21, marginBottom: 16 },
    wizardDetail: { color: t.text.secondary, fontSize: fonts.sm, lineHeight: 20, marginBottom: 12 },

    actionBtn: {
      backgroundColor: t.accent.blue, borderRadius: 12,
      paddingVertical: 14, alignItems: 'center',
    },
    actionBtnGreen: { backgroundColor: t.accent.green },
    actionBtnDisabled: { backgroundColor: t.border },
    actionBtnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },

    // ─── Info Tab ───
    infoRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingVertical: 10,
    },
    infoLabel: { color: t.text.muted, fontSize: fonts.sm },
    infoValue: { color: t.text.primary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    infoDivider: { height: 1, backgroundColor: t.border },

    // ─── Comparison Table ───
    tableHeader: {
      flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 2,
      borderBottomColor: t.border,
    },
    tableHeaderCell: {
      flex: 1, color: t.text.secondary, fontSize: fonts.xs, fontWeight: fonts.bold,
      textTransform: 'uppercase', textAlign: 'center',
    },
    tableHeaderCellFirst: { flex: 1.2, textAlign: 'left' },
    tableRow: {
      flexDirection: 'row', paddingVertical: 10,
      borderBottomWidth: 1, borderBottomColor: t.border + '40',
    },
    tableCell: {
      flex: 1, color: t.text.primary, fontSize: fonts.sm, textAlign: 'center',
    },
    tableCellFirst: { flex: 1.2, textAlign: 'left', color: t.text.muted, fontWeight: fonts.semibold },
    tableCellHighlight: { color: t.accent.green, fontWeight: fonts.bold },
    tableCellWarn: { color: t.accent.red, fontWeight: fonts.semibold },

    // ─── Strength Rating ───
    strengthRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    strengthDot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },

    bottomPadding: { height: 40 },
  }), [t]);

  // ─── Helpers ───

  const badgeColor = (status: 'active' | 'recommended' | 'future') => {
    switch (status) {
      case 'active': return { bg: t.accent.green + '20', text: t.accent.green };
      case 'recommended': return { bg: t.accent.blue + '20', text: t.accent.blue };
      case 'future': return { bg: t.border, text: t.text.muted };
    }
  };

  const dotColor = (id: 'classical' | 'hybrid' | 'post-quantum') => {
    if (id === activeKeyType) return t.accent.green;
    if (id === 'hybrid' && activeKeyType === 'classical') return t.accent.blue;
    return t.text.muted;
  };

  const readinessColor = (percent: number) => {
    if (percent >= 80) return t.accent.green;
    if (percent >= 50) return t.accent.yellow;
    return t.accent.red;
  };

  const threatColor = (level: typeof DEMO_THREAT_LEVEL) => {
    switch (level) {
      case 'low': return t.accent.green;
      case 'moderate': return t.accent.yellow;
      case 'elevated': return t.accent.red;
      case 'high': return t.accent.red;
    }
  };

  // ─── Migration Wizard Handlers ───

  const handleMigrationStep = useCallback(() => {
    if (migrationStep === 0) {
      // Step 1: Generate PQC key
      Alert.alert(
        'Generate PQC Key',
        'This will generate a new ML-DSA-65 post-quantum key pair alongside your existing Ed25519 key.\n\n' +
        'The key is stored in your encrypted vault.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Generate',
            onPress: () => setMigrationStep(1),
          },
        ],
      );
    } else if (migrationStep === 1) {
      // Step 2: Create hybrid
      Alert.alert(
        'Create Hybrid Key',
        'This will create a hybrid signing configuration that produces both Ed25519 and ML-DSA-65 signatures.\n\n' +
        'Transactions will be verifiable by both classical and quantum-safe validators.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Create Hybrid',
            onPress: () => setMigrationStep(2),
          },
        ],
      );
    } else if (migrationStep === 2) {
      // Step 3: Verify and activate
      Alert.alert(
        'Verify & Activate',
        'A test signature will be created and verified using the hybrid key.\n\n' +
        'If verification succeeds, the hybrid key becomes your active signing key.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Verify & Activate',
            onPress: () => {
              setMigrationStep(3);
              setActiveKeyType('hybrid');
              Alert.alert('Migration Complete', 'Hybrid key is now active. All new transactions will use dual signatures.');
            },
          },
        ],
      );
    }
  }, [migrationStep]);

  const migrationStepLabel = (step: MigrationStep): string => {
    switch (step) {
      case 0: return 'Start Migration';
      case 1: return 'Create Hybrid Key';
      case 2: return 'Verify & Activate';
      case 3: return 'Migration Complete';
    }
  };

  const migrationStepTitle = (): string => {
    switch (migrationStep) {
      case 0: return 'Step 1: Generate PQC Key';
      case 1: return 'Step 2: Create Hybrid Configuration';
      case 2: return 'Step 3: Verify & Activate';
      case 3: return 'Migration Complete';
    }
  };

  const migrationStepDesc = (): string => {
    switch (migrationStep) {
      case 0:
        return 'Generate a new ML-DSA-65 (Dilithium) post-quantum key pair. This key will be stored alongside your existing Ed25519 key in the encrypted vault.';
      case 1:
        return 'Link your Ed25519 and ML-DSA-65 keys into a hybrid signing configuration. Every transaction will carry both signatures for maximum compatibility.';
      case 2:
        return 'Create a test signature, verify it against both algorithms, and activate the hybrid key as your primary signing key.';
      case 3:
        return 'Your wallet now uses hybrid Ed25519 + ML-DSA-65 signatures. You are protected against both classical and quantum attacks. All new transactions carry dual signatures.';
    }
  };

  // ─── Render: Status Tab ───

  const renderStatus = () => {
    const readiness = demoMode ? DEMO_READINESS : { hybridPercent: 0, totalTransactions: 0, hybridTransactions: 0, classicalRemaining: 0, migrationStarted: '—' };
    const threatLevel = demoMode ? DEMO_THREAT_LEVEL : 'low';

    return (
      <>
        {/* Key Types */}
        <Text style={s.sectionHeader}>Key Types</Text>
        {KEY_TYPES.map((keyType) => {
          const badge = badgeColor(keyType.status);
          const isActive = keyType.id === activeKeyType;
          const cardStyle = isActive
            ? s.cardHighlight
            : keyType.status === 'recommended'
              ? s.cardRecommended
              : s.cardFuture;
          return (
            <View key={keyType.id} style={[s.card, cardStyle]}>
              <View style={s.keyTypeHeader}>
                <View style={[s.keyTypeDot, { backgroundColor: dotColor(keyType.id) }]} />
                <Text style={s.keyTypeLabel}>{keyType.label}</Text>
                <View style={[s.keyTypeBadge, { backgroundColor: badge.bg }]}>
                  <Text style={[s.keyTypeBadgeText, { color: badge.text }]}>
                    {isActive ? 'ACTIVE' : keyType.status === 'recommended' ? 'RECOMMENDED' : 'FUTURE'}
                  </Text>
                </View>
              </View>
              <Text style={s.keyTypeAlgo}>{keyType.algorithm}</Text>
              <Text style={s.keyTypeDesc}>{keyType.description}</Text>
            </View>
          );
        })}

        {/* PQC Readiness Score */}
        <Text style={s.sectionHeader}>PQC Readiness</Text>
        <View style={s.readinessContainer}>
          <Text style={[s.readinessNumber, { color: readinessColor(readiness.hybridPercent) }]}>
            {readiness.hybridPercent}%
          </Text>
          <Text style={s.readinessLabel}>Transactions using hybrid signatures</Text>
          <View style={s.readinessBar}>
            <View
              style={[
                s.readinessFill,
                {
                  width: `${readiness.hybridPercent}%`,
                  backgroundColor: readinessColor(readiness.hybridPercent),
                },
              ]}
            />
          </View>
          <View style={s.readinessStats}>
            <View style={s.readinessStat}>
              <Text style={s.readinessStatValue}>
                {readiness.totalTransactions.toLocaleString()}
              </Text>
              <Text style={s.readinessStatLabel}>Total Tx</Text>
            </View>
            <View style={s.readinessStat}>
              <Text style={s.readinessStatValue}>
                {readiness.hybridTransactions.toLocaleString()}
              </Text>
              <Text style={s.readinessStatLabel}>Hybrid Tx</Text>
            </View>
            <View style={s.readinessStat}>
              <Text style={s.readinessStatValue}>
                {readiness.classicalRemaining.toLocaleString()}
              </Text>
              <Text style={s.readinessStatLabel}>Classical Tx</Text>
            </View>
          </View>
        </View>

        {/* Quantum Threat Warning */}
        {(threatLevel === 'moderate' || threatLevel === 'elevated' || threatLevel === 'high') && (
          <View style={[s.warningCard, {
            backgroundColor: threatColor(threatLevel) + '15',
            borderColor: threatColor(threatLevel) + '40',
          }]}>
            <Text style={[s.warningTitle, { color: threatColor(threatLevel) }]}>
              Quantum Threat Level: {threatLevel.charAt(0).toUpperCase() + threatLevel.slice(1)}
            </Text>
            <Text style={s.warningText}>
              {threatLevel === 'moderate'
                ? 'Current estimates suggest cryptographically relevant quantum computers may emerge within 10-15 years. Migrating to hybrid keys now ensures your historical transactions remain secure.'
                : threatLevel === 'elevated'
                  ? 'Quantum computing advances are accelerating. Immediate migration to hybrid or post-quantum keys is strongly recommended.'
                  : 'Quantum threat is imminent. All classical keys should be migrated immediately.'}
            </Text>
            {activeKeyType === 'classical' && (
              <TouchableOpacity
                style={[s.actionBtn, { marginTop: 12 }]}
                onPress={() => setActiveTab('migrate')}
              >
                <Text style={s.actionBtnText}>Start Migration Now</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </>
    );
  };

  // ─── Render: Migrate Tab ───

  const renderMigrate = () => (
    <>
      {/* Step Indicators */}
      <View style={s.wizardStepRow}>
        {[1, 2, 3].map((step, i) => (
          <React.Fragment key={step}>
            {i > 0 && (
              <View
                style={[
                  s.wizardStepLine,
                  migrationStep >= step ? s.wizardStepLineDone : s.wizardStepLinePending,
                ]}
              />
            )}
            <View
              style={[
                s.wizardStepCircle,
                migrationStep > step
                  ? s.wizardStepCircleDone
                  : migrationStep === step || (migrationStep === 0 && step === 1)
                    ? s.wizardStepCircleActive
                    : s.wizardStepCirclePending,
              ]}
            >
              <Text style={s.wizardStepNumber}>
                {migrationStep > step ? 'OK' : String(step)}
              </Text>
            </View>
          </React.Fragment>
        ))}
      </View>

      {/* Current Step Card */}
      <View style={s.wizardCard}>
        <Text style={s.wizardTitle}>{migrationStepTitle()}</Text>
        <Text style={s.wizardDesc}>{migrationStepDesc()}</Text>

        {migrationStep < 3 && (
          <>
            <Text style={s.wizardDetail}>
              {migrationStep === 0
                ? 'Algorithm: ML-DSA-65 (FIPS 204)\nKey size: 1,952 bytes (public) + 4,032 bytes (private)\nSecurity level: NIST Level 3 (128-bit quantum security)'
                : migrationStep === 1
                  ? 'Hybrid mode: Ed25519 signature (64 bytes) + ML-DSA-65 signature (3,309 bytes)\nBoth signatures must verify for the transaction to be valid.\nBackward compatible with classical-only validators.'
                  : 'Test transaction will be signed with both algorithms.\nVerification checks both Ed25519 and ML-DSA-65 signatures.\nOn success, hybrid key becomes the default signer.'}
            </Text>
            <TouchableOpacity style={s.actionBtn} onPress={handleMigrationStep}>
              <Text style={s.actionBtnText}>{migrationStepLabel(migrationStep)}</Text>
            </TouchableOpacity>
          </>
        )}

        {migrationStep === 3 && (
          <>
            <View style={[s.card, { marginHorizontal: 0, backgroundColor: t.accent.green + '10' }]}>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Active Key</Text>
                <Text style={[s.infoValue, { color: t.accent.green }]}>Hybrid (Ed25519 + ML-DSA-65)</Text>
              </View>
              <View style={s.infoDivider} />
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Migration Date</Text>
                <Text style={s.infoValue}>{demoMode ? DEMO_READINESS.migrationStarted : 'Today'}</Text>
              </View>
              <View style={s.infoDivider} />
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Quantum Protection</Text>
                <Text style={[s.infoValue, { color: t.accent.green }]}>Active</Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* Reset option (for re-testing) */}
      {migrationStep === 3 && !demoMode && (
        <TouchableOpacity
          style={[s.card, { alignItems: 'center' }]}
          onPress={() => {
            Alert.alert(
              'Reset Migration',
              'This will revert to classical Ed25519 signing. Are you sure?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Reset',
                  style: 'destructive',
                  onPress: () => { setMigrationStep(0); setActiveKeyType('classical'); },
                },
              ],
            );
          }}
        >
          <Text style={{ color: t.accent.red, fontSize: fonts.md, fontWeight: fonts.semibold }}>
            Reset Migration
          </Text>
        </TouchableOpacity>
      )}
    </>
  );

  // ─── Render: Info Tab ───

  const renderInfo = () => {
    const info = demoMode ? DEMO_KEY_INFO : {
      algorithm: activeKeyType === 'hybrid' ? 'Ed25519 + ML-DSA-65 (Hybrid)' : 'Ed25519',
      created: '—',
      signatureCount: 0,
      strengthRating: activeKeyType === 'hybrid' ? 'Strong' : 'Classical',
      fingerprint: '—',
      hybridActiveSince: '—',
    };

    const strengthColor = info.strengthRating === 'Strong'
      ? t.accent.green
      : info.strengthRating === 'Classical'
        ? t.accent.yellow
        : t.text.muted;

    return (
      <>
        {/* Current Key Info */}
        <Text style={s.sectionHeader}>Current Key</Text>
        <View style={s.card}>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Algorithm</Text>
            <Text style={s.infoValue}>{info.algorithm}</Text>
          </View>
          <View style={s.infoDivider} />
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Created</Text>
            <Text style={s.infoValue}>{info.created}</Text>
          </View>
          <View style={s.infoDivider} />
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Signatures Issued</Text>
            <Text style={s.infoValue}>{info.signatureCount.toLocaleString()}</Text>
          </View>
          <View style={s.infoDivider} />
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Strength Rating</Text>
            <View style={s.strengthRow}>
              <View style={[s.strengthDot, { backgroundColor: strengthColor }]} />
              <Text style={[s.infoValue, { color: strengthColor }]}>{info.strengthRating}</Text>
            </View>
          </View>
          <View style={s.infoDivider} />
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Key Fingerprint</Text>
            <Text style={[s.infoValue, { fontFamily: 'monospace' as any }]}>{info.fingerprint}</Text>
          </View>
          {info.hybridActiveSince !== '—' && (
            <>
              <View style={s.infoDivider} />
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Hybrid Active Since</Text>
                <Text style={s.infoValue}>{info.hybridActiveSince}</Text>
              </View>
            </>
          )}
        </View>

        {/* Comparison Table */}
        <Text style={s.sectionHeader}>Algorithm Comparison</Text>
        <View style={[s.card, { paddingHorizontal: 12 }]}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, s.tableHeaderCellFirst, { color: t.text.secondary }]}>Metric</Text>
            <Text style={[s.tableHeaderCell, { color: t.text.secondary }]}>Ed25519</Text>
            <Text style={[s.tableHeaderCell, { color: t.text.secondary }]}>Hybrid</Text>
            <Text style={[s.tableHeaderCell, { color: t.text.secondary }]}>ML-DSA</Text>
          </View>
          {COMPARISON_DATA.map((row, i) => (
            <View key={i} style={s.tableRow}>
              <Text style={[s.tableCell, s.tableCellFirst, { color: t.text.muted }]}>{row.label}</Text>
              <Text style={[
                s.tableCell,
                { color: t.text.primary },
                row.label === 'Quantum Safe' && row.classical === 'No' && { color: t.accent.red, fontWeight: fonts.semibold as any },
              ]}>{row.classical}</Text>
              <Text style={[
                s.tableCell,
                { color: t.text.primary },
                row.label === 'Quantum Safe' && row.hybrid === 'Yes' && { color: t.accent.green, fontWeight: fonts.bold as any },
              ]}>{row.hybrid}</Text>
              <Text style={[
                s.tableCell,
                { color: t.text.primary },
                row.label === 'Quantum Safe' && row.postQuantum === 'Yes' && { color: t.accent.green, fontWeight: fonts.bold as any },
              ]}>{row.postQuantum}</Text>
            </View>
          ))}
        </View>

        {/* Note */}
        <View style={[s.card, { backgroundColor: t.accent.blue + '08' }]}>
          <Text style={[s.keyTypeDesc, { color: t.text.secondary }]}>
            ML-DSA-65 (formerly Dilithium) is a NIST-standardized post-quantum digital signature algorithm (FIPS 204). Hybrid mode ensures backward compatibility while providing quantum resistance.
          </Text>
        </View>
      </>
    );
  };

  // ─── Main Render ───

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>PQC Key Management</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>
      <Text style={s.subtitle}>Article VII — Post-Quantum Cryptography</Text>

      {/* Tab Bar */}
      <View style={s.tabRow}>
        {(['status', 'migrate', 'info'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[s.tab, activeTab === tab && s.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={activeTab === tab ? s.tabTextActive : s.tabText}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {activeTab === 'status' && renderStatus()}
        {activeTab === 'migrate' && renderMigrate()}
        {activeTab === 'info' && renderInfo()}
        <View style={s.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}
