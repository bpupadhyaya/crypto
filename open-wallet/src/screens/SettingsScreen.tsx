/**
 * Settings Screen — Grid-based category home with drill-down item lists.
 * Tapping a category tile shows the full list of items for that category.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Switch, Alert, Linking,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { authManager } from '../core/auth/auth';
import { PinPad } from '../components/PinPad';
import { MOBILE_PROVIDERS_STATUS } from '../core/providers/mobile/stub';
import { BackupScreen } from './BackupScreen';
import { SUPPORTED_CURRENCIES } from '../utils/currency';
import { PriceAlertsScreen } from './PriceAlertsScreen';
import { AddressBookScreen } from './AddressBookScreen';
import { HardwareWalletScreen } from './HardwareWalletScreen';
import { WalletConnectScreen } from './WalletConnectScreen';
import { StakingScreen } from './StakingScreen';
import { UniversalIDScreen } from './UniversalIDScreen';
import { LivingLedgerScreen } from './LivingLedgerScreen';
import { GratitudeScreen } from './GratitudeScreen';
import { GovernanceScreen } from './GovernanceScreen';
import { OracleScreen } from './OracleScreen';
import { ContributionScoreScreen } from './ContributionScoreScreen';
import { PrivacyPolicyScreen } from './PrivacyPolicyScreen';
import { WhatsNewScreen } from './WhatsNewScreen';
import { DeFiScreen } from './DeFiScreen';
import { P2PScreen } from './P2PScreen';
import { AchievementsScreen } from './AchievementsScreen';
import { PaymentRailsScreen } from './PaymentRailsScreen';
import { NotificationHistoryScreen } from './NotificationHistoryScreen';
import { PortfolioAnalyticsScreen } from './PortfolioAnalyticsScreen';
import { MarketScreen } from './MarketScreen';
import { ExchangeScreen } from './ExchangeScreen';
import { ImportWalletScreen } from './ImportWalletScreen';
import { ExportScreen } from './ExportScreen';
import { DAppBrowserScreen } from './DAppBrowserScreen';
import { TokenLaunchScreen } from './TokenLaunchScreen';
import { NFTGalleryScreen } from './NFTGalleryScreen';
import { SecurityAuditScreen } from './SecurityAuditScreen';
import { CloudBackupScreen } from './CloudBackupScreen';
import { RewardsScreen } from './RewardsScreen';
import { MessagesScreen } from './MessagesScreen';
import { SocialFeedScreen } from './SocialFeedScreen';
import { ProfileScreen } from './ProfileScreen';
import { RecurringPaymentsScreen } from './RecurringPaymentsScreen';
import { AutomationScreen } from './AutomationScreen';
import { MultiSigScreen } from './MultiSigScreen';
import { SpendingLimitsScreen } from './SpendingLimitsScreen';
import { LiquidityScreen } from './LiquidityScreen';
import { YieldFarmScreen } from './YieldFarmScreen';
import { LendBorrowScreen } from './LendBorrowScreen';
import { TaxCalculatorScreen } from './TaxCalculatorScreen';
import { WalletAnalyticsScreen } from './WalletAnalyticsScreen';
import { WatchlistScreen } from './WatchlistScreen';
import { AccessibilityScreen } from './AccessibilityScreen';
import { TutorialScreen } from './TutorialScreen';
import { HelpScreen } from './HelpScreen';
import { IdentityScreen } from './IdentityScreen';
import { AddressVerifyScreen } from './AddressVerifyScreen';
import { TxSimulatorScreen } from './TxSimulatorScreen';
import { ChainInfoScreen } from './ChainInfoScreen';
import { EscrowScreen } from './EscrowScreen';
import { DisputeScreen } from './DisputeScreen';
import { CorrectionScreen } from './CorrectionScreen';
import { CommunityHealthScreen } from './CommunityHealthScreen';
import { DAOScreen } from './DAOScreen';
import { DelegationScreen } from './DelegationScreen';
import { VotingPowerScreen } from './VotingPowerScreen';
import { MilestoneDefinitionsScreen } from './MilestoneDefinitionsScreen';
import { FamilyTreeScreen } from './FamilyTreeScreen';
import { ParentingJourneyScreen } from './ParentingJourneyScreen';
import { TeacherImpactScreen } from './TeacherImpactScreen';
import { PortfolioChartScreen } from './PortfolioChartScreen';
import { AdvancedAlertsScreen } from './AdvancedAlertsScreen';
import { TokenCompareScreen } from './TokenCompareScreen';
import { useTheme } from '../hooks/useTheme';
import { isLowBandwidth, setLowBandwidthOverride, getLowBandwidthOverride } from '../core/network/lowBandwidth';
import { isTestnet } from '../core/network';
import { DevToolsScreen } from './DevToolsScreen';
import { OfflineQueueScreen } from './OfflineQueueScreen';
import { PendingTxScreen } from './PendingTxScreen';
import { TxNotesScreen } from './TxNotesScreen';
import { GasTrackerScreen } from './GasTrackerScreen';
import { BatchTxScreen } from './BatchTxScreen';
import { AddressLabelScreen } from './AddressLabelScreen';
import { HardwareKeyScreen } from './HardwareKeyScreen';
import { TreasuryScreen } from './TreasuryScreen';
import { PaymentRequestScreen } from './PaymentRequestScreen';
import { ValidatorDashboardScreen } from './ValidatorDashboardScreen';
import { VolunteerScreen } from './VolunteerScreen';
import { CommunityBoardScreen } from './CommunityBoardScreen';
import { EducationHubScreen } from './EducationHubScreen';
import { SkillCertScreen } from './SkillCertScreen';
import { MentorshipScreen } from './MentorshipScreen';
import i18n from '../i18n';

type SettingsView = 'main' | 'change-pin' | 'new-pin' | 'confirm-pin' | 'backup' | 'alerts' | 'contacts' | 'hardware' | 'hardware-key' | 'walletconnect' | 'staking' | 'rewards' | 'uid' | 'ledger' | 'gratitude' | 'governance' | 'oracle' | 'scores' | 'privacy' | 'whatsnew' | 'defi' | 'p2p' | 'achievements' | 'rails' | 'notifications' | 'analytics' | 'market' | 'exchange' | 'import-wallet' | 'export' | 'dapp-browser' | 'token-launch' | 'nft-gallery' | 'security-audit' | 'cloud-backup' | 'messages' | 'social-feed' | 'profile' | 'recurring-payments' | 'automation' | 'multisig' | 'spending-limits' | 'liquidity' | 'yield-farm' | 'lend-borrow' | 'tax-calculator' | 'wallet-analytics' | 'watchlist' | 'tutorial' | 'help' | 'accessibility' | 'address-verify' | 'tx-simulator' | 'chain-info' | 'identity' | 'escrow' | 'disputes' | 'dao' | 'delegation' | 'voting-power' | 'milestones' | 'correction' | 'community-health' | 'dev-tools' | 'offline-queue' | 'pending-tx' | 'portfolio-chart' | 'advanced-alerts' | 'token-compare' | 'tx-notes' | 'gas-tracker' | 'batch-tx' | 'address-labels' | 'treasury' | 'family-tree' | 'parenting-journey' | 'teacher-impact' | 'payment-request' | 'validator-dashboard' | 'volunteer' | 'community-board' | 'education-hub' | 'skill-cert' | 'mentorship';

type SettingsCategory = 'account' | 'network' | 'wallet' | 'exchange' | 'chain' | 'tools' | 'about' | 'support' | 'developer';

export function SettingsScreen() {
  const { mode, setMode, demoMode, setDemoMode, setStatus, biometricEnabled, setBiometricEnabled, currency, setCurrency, networkMode, setNetworkMode: setNetwork, themeMode, setThemeMode, autoLockTimeout, setAutoLockTimeout } = useWalletStore();
  const [view, setView] = useState<SettingsView>('main');
  const [category, setCategory] = useState<SettingsCategory | null>(null);
  const [pinToChange, setPinToChange] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [pinConfigured, setPinConfigured] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const t = useTheme();

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    scroll: { paddingHorizontal: 16, paddingTop: 8 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4, paddingTop: 12, paddingBottom: 8 },
    headerTitle: { color: t.text.primary, fontSize: 24, fontWeight: '800' },
    signOutBtn: { paddingVertical: 6, paddingHorizontal: 12 },
    signOutText: { color: t.accent.red, fontSize: 14, fontWeight: '600' },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 24, marginBottom: 8, marginLeft: 4 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 4 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    label: { color: t.text.primary, fontSize: 15 },
    value: { color: t.text.secondary, fontSize: 14 },
    valueGreen: { color: t.accent.green, fontSize: 13, fontWeight: '600' },
    valueYellow: { color: t.accent.yellow, fontSize: 13, fontWeight: '600' },
    divider: { height: 1, backgroundColor: t.border, marginHorizontal: 16 },
    modeToggle: { flexDirection: 'row', gap: 4 },
    modeBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 8, backgroundColor: t.border },
    modeBtnActive: { backgroundColor: t.accent.green },
    networkTestnet: { backgroundColor: t.accent.yellow },
    networkMainnet: { backgroundColor: t.accent.red },
    modeBtnText: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
    modeBtnTextActive: { color: t.bg.primary },
    currencyRow: { flexDirection: 'row', gap: 4 },
    currencyChip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, backgroundColor: t.border },
    currencyActive: { backgroundColor: t.accent.green },
    currencyText: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
    currencyTextActive: { color: t.bg.primary },
    showMoreBtn: { paddingVertical: 10, paddingHorizontal: 16 },
    showMoreText: { color: t.accent.blue, fontSize: 14, fontWeight: '600' },
    backBtn: { paddingVertical: 20, alignItems: 'center' },
    backText: { color: t.accent.blue, fontSize: 16 },
    // Grid styles
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16, paddingTop: 12 },
    tile: {
      backgroundColor: t.bg.card,
      borderRadius: 16,
      padding: 20,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      minHeight: 100,
      width: '47%' as unknown as number,
    },
    tileIcon: { fontSize: 32, marginBottom: 8 },
    tileLabel: { color: t.text.primary, fontSize: 14, fontWeight: '700', textAlign: 'center' as const },
    tileBadge: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    categoryHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingTop: 12, paddingBottom: 8, gap: 12 },
    categoryBackBtn: { paddingVertical: 4, paddingHorizontal: 8 },
    categoryBackText: { color: t.accent.blue, fontSize: 22 },
    categoryTitle: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
  }), [t]);

  useEffect(() => {
    authManager.isBiometricAvailable().then(({ available }) => setBiometricAvailable(available));
    authManager.isPinConfigured().then(setPinConfigured);
  }, []);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ─── PIN Change Flow ───

  const handleCurrentPin = async (pin: string) => {
    try {
      const valid = await authManager.verifyPin(pin);
      if (valid) {
        setView('new-pin');
      } else {
        Alert.alert('Wrong PIN', 'The PIN you entered is incorrect.');
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleNewPin = (pin: string) => {
    setPinToChange(pin);
    setView('confirm-pin');
  };

  const handleConfirmPin = async (pin: string) => {
    if (pin !== pinToChange) {
      Alert.alert('Mismatch', 'PINs do not match. Try again.');
      setView('new-pin');
      setPinToChange('');
      return;
    }
    try {
      await authManager.setupPin(pin);
      setPinConfigured(true);
      Alert.alert('Success', 'PIN updated successfully.');
      setView('main');
    } catch {
      Alert.alert('Error', 'Failed to update PIN.');
    }
  };

  const handleSetupPin = (pin: string) => {
    setPinToChange(pin);
    setView('confirm-pin');
  };

  // ─── Biometric Toggle ───

  const toggleBiometric = async (enable: boolean) => {
    if (enable) {
      const success = await authManager.enableBiometric();
      if (success) {
        setBiometricEnabled(true);
      } else {
        Alert.alert('Failed', 'Could not enable biometric unlock.');
      }
    } else {
      await authManager.disableBiometric();
      setBiometricEnabled(false);
    }
  };

  // ─── PIN Screens ───

  if (view === 'change-pin') {
    return (
      <SafeAreaView style={st.container}>
        <PinPad title="Enter Current PIN" subtitle="Verify before changing" onComplete={handleCurrentPin} />
        <TouchableOpacity style={st.backBtn} onPress={() => setView('main')}>
          <Text style={st.backText}>Cancel</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (view === 'new-pin') {
    return (
      <SafeAreaView style={st.container}>
        <PinPad title={pinConfigured ? 'New PIN' : 'Set Your PIN'} subtitle="Choose a 6-digit PIN" onComplete={pinConfigured ? handleNewPin : handleSetupPin} />
        <TouchableOpacity style={st.backBtn} onPress={() => setView('main')}>
          <Text style={st.backText}>Cancel</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (view === 'confirm-pin') {
    return (
      <SafeAreaView style={st.container}>
        <PinPad title="Confirm PIN" subtitle="Enter the same PIN again" onComplete={handleConfirmPin} />
        <TouchableOpacity style={st.backBtn} onPress={() => { setView('new-pin'); setPinToChange(''); }}>
          <Text style={st.backText}>Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (view === 'backup') return <BackupScreen onClose={() => setView('main')} />;
  if (view === 'alerts') return <PriceAlertsScreen onClose={() => setView('main')} />;
  if (view === 'contacts') return <AddressBookScreen onClose={() => setView('main')} />;
  if (view === 'hardware') return <HardwareWalletScreen onClose={() => setView('main')} />;
  if (view === 'hardware-key') return <HardwareKeyScreen onClose={() => setView('main')} />;
  if (view === 'walletconnect') return <WalletConnectScreen onClose={() => setView('main')} />;
  if (view === 'staking') return <StakingScreen onClose={() => setView('main')} />;
  if (view === 'rewards') return <RewardsScreen onClose={() => setView('main')} />;
  if (view === 'uid') return <UniversalIDScreen onClose={() => setView('main')} />;
  if (view === 'ledger') return <LivingLedgerScreen onClose={() => setView('main')} onSendGratitude={() => setView('gratitude')} />;
  if (view === 'gratitude') return <GratitudeScreen onClose={() => setView('main')} />;
  if (view === 'governance') return <GovernanceScreen onClose={() => setView('main')} />;
  if (view === 'oracle') return <OracleScreen onClose={() => setView('main')} />;
  if (view === 'scores') return <ContributionScoreScreen onClose={() => setView('main')} />;
  if (view === 'identity') return <IdentityScreen onClose={() => setView('main')} />;
  if (view === 'privacy') return <PrivacyPolicyScreen onClose={() => setView('main')} />;
  if (view === 'whatsnew') return <WhatsNewScreen onClose={() => setView('main')} />;
  if (view === 'defi') return <DeFiScreen onClose={() => setView('main')} />;
  if (view === 'p2p') return <P2PScreen onClose={() => setView('main')} />;
  if (view === 'achievements') return <AchievementsScreen onClose={() => setView('main')} />;
  if (view === 'rails') return <PaymentRailsScreen onClose={() => setView('main')} />;
  if (view === 'notifications') return <NotificationHistoryScreen onClose={() => setView('main')} />;
  if (view === 'analytics') return <PortfolioAnalyticsScreen onClose={() => setView('main')} />;
  if (view === 'market') return <MarketScreen onClose={() => setView('main')} />;
  if (view === 'exchange') return <ExchangeScreen onClose={() => setView('main')} />;
  if (view === 'import-wallet') return <ImportWalletScreen onClose={() => setView('main')} />;
  if (view === 'export') return <ExportScreen onClose={() => setView('main')} />;
  if (view === 'dapp-browser') return <DAppBrowserScreen onClose={() => setView('main')} />;
  if (view === 'token-launch') return <TokenLaunchScreen onClose={() => setView('main')} />;
  if (view === 'nft-gallery') return <NFTGalleryScreen onClose={() => setView('main')} />;
  if (view === 'security-audit') return <SecurityAuditScreen onClose={() => setView('main')} />;
  if (view === 'cloud-backup') return <CloudBackupScreen onClose={() => setView('main')} />;
  if (view === 'messages') return <MessagesScreen onClose={() => setView('main')} />;
  if (view === 'social-feed') return <SocialFeedScreen onClose={() => setView('main')} />;
  if (view === 'profile') return <ProfileScreen onClose={() => setView('main')} />;
  if (view === 'recurring-payments') return <RecurringPaymentsScreen onClose={() => setView('main')} />;
  if (view === 'automation') return <AutomationScreen onClose={() => setView('main')} />;
  if (view === 'multisig') return <MultiSigScreen onClose={() => setView('main')} />;
  if (view === 'spending-limits') return <SpendingLimitsScreen onClose={() => setView('main')} />;
  if (view === 'liquidity') return <LiquidityScreen onClose={() => setView('main')} />;
  if (view === 'yield-farm') return <YieldFarmScreen onClose={() => setView('main')} />;
  if (view === 'lend-borrow') return <LendBorrowScreen onClose={() => setView('main')} />;
  if (view === 'tax-calculator') return <TaxCalculatorScreen onClose={() => setView('main')} />;
  if (view === 'wallet-analytics') return <WalletAnalyticsScreen onClose={() => setView('main')} />;
  if (view === 'watchlist') return <WatchlistScreen onClose={() => setView('main')} />;
  if (view === 'tutorial') return <TutorialScreen onClose={() => setView('main')} />;
  if (view === 'help') return <HelpScreen onClose={() => setView('main')} />;
  if (view === 'accessibility') return <AccessibilityScreen onClose={() => setView('main')} />;
  if (view === 'address-verify') return <AddressVerifyScreen onClose={() => setView('main')} />;
  if (view === 'tx-simulator') return <TxSimulatorScreen onClose={() => setView('main')} />;
  if (view === 'chain-info') return <ChainInfoScreen onClose={() => setView('main')} />;
  if (view === 'escrow') return <EscrowScreen onClose={() => setView('main')} />;
  if (view === 'disputes') return <DisputeScreen onClose={() => setView('main')} />;
  if (view === 'correction') return <CorrectionScreen onClose={() => setView('main')} />;
  if (view === 'community-health') return <CommunityHealthScreen onClose={() => setView('main')} />;
  if (view === 'dao') return <DAOScreen onClose={() => setView('main')} />;
  if (view === 'delegation') return <DelegationScreen onClose={() => setView('main')} />;
  if (view === 'voting-power') return <VotingPowerScreen onClose={() => setView('main')} />;
  if (view === 'milestones') return <MilestoneDefinitionsScreen onClose={() => setView('main')} />;
  if (view === 'offline-queue') return <OfflineQueueScreen onClose={() => setView('main')} />;
  if (view === 'pending-tx') return <PendingTxScreen onClose={() => setView('main')} />;
  if (view === 'portfolio-chart') return <PortfolioChartScreen onClose={() => setView('main')} />;
  if (view === 'advanced-alerts') return <AdvancedAlertsScreen onClose={() => setView('main')} />;
  if (view === 'token-compare') return <TokenCompareScreen onClose={() => setView('main')} />;
  if (view === 'tx-notes') return <TxNotesScreen onClose={() => setView('main')} />;
  if (view === 'gas-tracker') return <GasTrackerScreen onClose={() => setView('main')} />;
  if (view === 'batch-tx') return <BatchTxScreen onClose={() => setView('main')} />;
  if (view === 'address-labels') return <AddressLabelScreen onClose={() => setView('main')} />;
  if (view === 'dev-tools') return <DevToolsScreen onClose={() => setView('main')} />;
  if (view === 'treasury') return <TreasuryScreen onClose={() => setView('main')} />;
  if (view === 'family-tree') return <FamilyTreeScreen onClose={() => setView('main')} onSendGratitude={() => setView('gratitude')} />;
  if (view === 'parenting-journey') return <ParentingJourneyScreen onClose={() => setView('main')} />;
  if (view === 'teacher-impact') return <TeacherImpactScreen onClose={() => setView('main')} />;
  if (view === 'payment-request') return <PaymentRequestScreen onClose={() => setView('main')} />;
  if (view === 'validator-dashboard') return <ValidatorDashboardScreen onClose={() => setView('main')} />;
  if (view === 'volunteer') return <VolunteerScreen onClose={() => setView('main')} />;
  if (view === 'community-board') return <CommunityBoardScreen onClose={() => setView('main')} />;
  if (view === 'education-hub') return <EducationHubScreen onClose={() => setView('main')} />;
  if (view === 'skill-cert') return <SkillCertScreen onClose={() => setView('main')} />;
  if (view === 'mentorship') return <MentorshipScreen onClose={() => setView('main')} />;

  // ─── Low Bandwidth State ───
  const lowBandwidthOverride = getLowBandwidthOverride();
  const lowBandwidthEnabled = lowBandwidthOverride !== null ? lowBandwidthOverride : isLowBandwidth();
  const toggleLowBandwidth = (enabled: boolean) => {
    setLowBandwidthOverride(enabled ? true : null);
  };

  // ─── Collapsible Section Helper ───
  const renderCollapsibleItems = (
    sectionKey: string,
    items: Array<{ label: string; onPress: () => void; rightText?: string; rightColor?: string; rightComponent?: React.ReactNode }>,
    visibleCount: number = 4,
  ) => {
    const expanded = expandedSections[sectionKey] || false;
    const visibleItems = expanded ? items : items.slice(0, visibleCount);
    const hasMore = items.length > visibleCount;

    return (
      <>
        {visibleItems.map((item, i) => (
          <React.Fragment key={item.label}>
            {i > 0 && <View style={st.divider} />}
            {item.rightComponent ? (
              <View style={st.row}>
                <Text style={st.label}>{item.label}</Text>
                {item.rightComponent}
              </View>
            ) : (
              <TouchableOpacity style={st.row} onPress={item.onPress}>
                <Text style={st.label}>{item.label}</Text>
                <Text style={{ color: item.rightColor || t.text.secondary, fontSize: 14, fontWeight: item.rightColor ? '600' : '400' }}>
                  {item.rightText || '>'}
                </Text>
              </TouchableOpacity>
            )}
          </React.Fragment>
        ))}
        {hasMore && !expanded && (
          <>
            <View style={st.divider} />
            <TouchableOpacity style={st.showMoreBtn} onPress={() => toggleSection(sectionKey)}>
              <Text style={st.showMoreText}>Show {items.length - visibleCount} more...</Text>
            </TouchableOpacity>
          </>
        )}
        {hasMore && expanded && (
          <>
            <View style={st.divider} />
            <TouchableOpacity style={st.showMoreBtn} onPress={() => toggleSection(sectionKey)}>
              <Text style={st.showMoreText}>Show less</Text>
            </TouchableOpacity>
          </>
        )}
      </>
    );
  };

  // ─── Category Item Definitions ───

  const accountItems = [
    {
      label: pinConfigured ? 'Change PIN' : 'Set Up PIN',
      onPress: () => setView(pinConfigured ? 'change-pin' : 'new-pin'),
      rightText: pinConfigured ? '••••••' : 'Not set',
    },
    ...(biometricAvailable ? [{
      label: 'Biometric Unlock',
      onPress: () => {},
      rightComponent: (
        <Switch
          value={biometricEnabled}
          onValueChange={toggleBiometric}
          trackColor={{ false: '#333', true: t.accent.green + '40' }}
          thumbColor={biometricEnabled ? t.accent.green : '#666'}
        />
      ),
    }] : []),
    {
      label: 'Auto-Lock Timeout',
      onPress: () => {},
      rightComponent: (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxWidth: 200 }}>
          <View style={st.modeToggle}>
            {([
              { label: '1m', ms: 60000 },
              { label: '5m', ms: 300000 },
              { label: '15m', ms: 900000 },
              { label: '30m', ms: 1800000 },
              { label: '1h', ms: 3600000 },
              { label: 'Never', ms: 0 },
            ] as const).map((opt) => (
              <TouchableOpacity
                key={opt.ms}
                style={[st.modeBtn, autoLockTimeout === opt.ms && st.modeBtnActive]}
                onPress={() => setAutoLockTimeout(opt.ms)}
              >
                <Text style={[st.modeBtnText, autoLockTimeout === opt.ms && st.modeBtnTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      ),
    },
    {
      label: 'Security Audit',
      onPress: () => setView('security-audit'),
      rightText: 'Health Check',
      rightColor: t.accent.green,
    },
    {
      label: 'Multi-Sig Wallets',
      onPress: () => setView('multisig'),
      rightText: 'M-of-N',
      rightColor: t.accent.purple,
    },
    {
      label: 'Spending Limits',
      onPress: () => setView('spending-limits'),
      rightText: 'Per Token',
      rightColor: t.accent.orange,
    },
    {
      label: 'Import External Wallet',
      onPress: () => setView('import-wallet'),
      rightText: 'Add',
      rightColor: t.accent.green,
    },
    {
      label: 'Cloud Backup',
      onPress: () => setView('cloud-backup'),
      rightText: 'Encrypted Export',
    },
    {
      label: 'Backup / Recovery Phrase',
      onPress: () => setView('backup'),
    },
  ];

  const networkItems: Array<{ label: string; onPress: () => void; rightText?: string; rightColor?: string; rightComponent?: React.ReactNode }> = [
    {
      label: 'Network',
      onPress: () => {},
      rightComponent: (
        <View style={st.modeToggle}>
          {(['testnet', 'mainnet'] as const).map((n) => (
            <TouchableOpacity
              key={n}
              style={[st.modeBtn, networkMode === n && (n === 'testnet' ? st.networkTestnet : st.networkMainnet)]}
              onPress={() => {
                if (n === 'mainnet') {
                  Alert.alert('Switch to Mainnet', 'Real funds will be used. Are you sure?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Switch', onPress: () => setNetwork(n) },
                  ]);
                } else {
                  setNetwork(n);
                }
              }}
            >
              <Text style={[st.modeBtnText, networkMode === n && st.modeBtnTextActive]}>
                {n === 'testnet' ? 'Testnet' : 'Mainnet'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ),
    },
    {
      label: 'P2P Network',
      onPress: () => setView('p2p'),
      rightText: 'Configure',
      rightColor: t.accent.green,
    },
    {
      label: 'Low Bandwidth Mode',
      onPress: () => {},
      rightComponent: (
        <Switch
          value={lowBandwidthEnabled}
          onValueChange={toggleLowBandwidth}
          trackColor={{ false: '#333', true: t.accent.green + '40' }}
          thumbColor={lowBandwidthEnabled ? t.accent.green : '#666'}
        />
      ),
    },
    {
      label: 'Chain Information',
      onPress: () => setView('chain-info'),
      rightText: '5 Chains',
      rightColor: t.accent.purple,
    },
  ];

  const walletItems = [
    {
      label: 'Mode',
      onPress: () => {},
      rightComponent: (
        <View style={st.modeToggle}>
          {(['simple', 'pro'] as const).map((m) => (
            <TouchableOpacity key={m} style={[st.modeBtn, mode === m && st.modeBtnActive]} onPress={() => setMode(m)}>
              <Text style={[st.modeBtnText, mode === m && st.modeBtnTextActive]}>{m === 'simple' ? 'Simple' : 'Pro'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ),
    },
    {
      label: 'Demo Mode',
      onPress: () => {},
      rightComponent: (
        <Switch
          value={demoMode}
          onValueChange={setDemoMode}
          trackColor={{ false: '#333', true: t.accent.purple + '40' }}
          thumbColor={demoMode ? t.accent.purple : '#666'}
        />
      ),
    },
    {
      label: 'Theme',
      onPress: () => {},
      rightComponent: (
        <View style={st.modeToggle}>
          {(['dark', 'light', 'system'] as const).map((m) => (
            <TouchableOpacity key={m} style={[st.modeBtn, themeMode === m && st.modeBtnActive]} onPress={() => setThemeMode(m)}>
              <Text style={[st.modeBtnText, themeMode === m && st.modeBtnTextActive]}>
                {m === 'dark' ? 'Dark' : m === 'light' ? 'Light' : 'Auto'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ),
    },
    {
      label: 'Language',
      onPress: () => {},
      rightComponent: (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxWidth: 200 }}>
          <View style={st.modeToggle}>
            {[
              { code: 'en', label: 'EN' },
              { code: 'hi', label: 'HI' },
              { code: 'es', label: 'ES' },
              { code: 'zh', label: 'ZH' },
              { code: 'vi', label: 'VI' },
              { code: 'ar', label: 'AR' },
              { code: 'pt', label: 'PT' },
              { code: 'fr', label: 'FR' },
              { code: 'ja', label: 'JA' },
              { code: 'ko', label: 'KO' },
            ].map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[st.modeBtn, i18n.language === lang.code && st.modeBtnActive]}
                onPress={() => i18n.changeLanguage(lang.code)}
              >
                <Text style={[st.modeBtnText, i18n.language === lang.code && st.modeBtnTextActive]}>
                  {lang.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      ),
    },
    {
      label: 'Currency',
      onPress: () => {},
      rightComponent: (
        <View style={st.currencyRow}>
          {SUPPORTED_CURRENCIES.slice(0, 5).map((c) => (
            <TouchableOpacity key={c.code} style={[st.currencyChip, currency === c.code && st.currencyActive]} onPress={() => setCurrency(c.code)}>
              <Text style={[st.currencyText, currency === c.code && st.currencyTextActive]}>{c.symbol}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ),
    },
    {
      label: 'Accessibility',
      onPress: () => setView('accessibility'),
      rightText: 'Font, Contrast, Motion',
    },
    {
      label: 'Notification History',
      onPress: () => setView('notifications'),
      rightText: 'Received TXs',
    },
    {
      label: 'Recurring Payments',
      onPress: () => setView('recurring-payments'),
      rightText: 'Schedule',
      rightColor: t.accent.green,
    },
    {
      label: 'Automation Rules',
      onPress: () => setView('automation'),
      rightText: 'Auto-Trade',
      rightColor: t.accent.blue,
    },
    {
      label: 'Payment Requests',
      onPress: () => setView('payment-request'),
      rightText: 'Generate Link',
      rightColor: t.accent.green,
    },
  ];

  const exchangeItems = [
    {
      label: 'Universal Exchange',
      onPress: () => setView('exchange'),
      rightText: 'Any-to-Any',
      rightColor: t.accent.green,
    },
    {
      label: 'Buy with Local Currency',
      onPress: () => setView('rails'),
      rightText: 'UPI, PIX, M-Pesa...',
      rightColor: t.accent.green,
    },
    {
      label: 'Staking',
      onPress: () => setView('staking'),
      rightText: '5% APY',
      rightColor: t.accent.green,
    },
    {
      label: 'Staking Rewards',
      onPress: () => setView('rewards'),
      rightText: 'Claim',
      rightColor: t.accent.green,
    },
    {
      label: 'Liquidity Pools',
      onPress: () => setView('liquidity'),
      rightText: 'AMM',
      rightColor: t.accent.green,
    },
    {
      label: 'Yield Farming',
      onPress: () => setView('yield-farm'),
      rightText: 'Earn OTK',
      rightColor: t.accent.purple,
    },
    {
      label: 'Lend & Borrow',
      onPress: () => setView('lend-borrow'),
      rightText: 'Supply / Borrow',
      rightColor: t.accent.blue,
    },
  ];

  const chainItems = [
    {
      label: 'DeFi Dashboard',
      onPress: () => setView('defi'),
      rightText: 'View',
      rightColor: t.accent.green,
    },
    {
      label: 'Universal ID',
      onPress: () => setView('uid'),
      rightText: 'Register',
      rightColor: t.accent.green,
    },
    {
      label: 'Identity & Reputation',
      onPress: () => setView('identity'),
      rightText: 'View',
      rightColor: t.accent.green,
    },
    {
      label: 'Living Ledger',
      onPress: () => setView('ledger'),
    },
    {
      label: 'Send Gratitude',
      onPress: () => setView('gratitude'),
      rightText: 'Send',
      rightColor: t.accent.purple,
    },
    {
      label: 'Governance',
      onPress: () => setView('governance'),
      rightText: 'Vote',
      rightColor: t.accent.blue,
    },
    {
      label: 'DAOs',
      onPress: () => setView('dao'),
      rightText: 'Manage',
      rightColor: t.accent.purple,
    },
    {
      label: 'Voting Power',
      onPress: () => setView('voting-power'),
      rightText: '1 Vote',
      rightColor: t.accent.blue,
    },
    {
      label: 'Milestone Oracle',
      onPress: () => setView('oracle'),
      rightText: 'Verify',
      rightColor: t.accent.orange,
    },
    {
      label: 'Regional Milestones',
      onPress: () => setView('milestones'),
      rightText: 'Browse & Submit',
      rightColor: t.accent.green,
    },
    {
      label: 'Contribution Scores',
      onPress: () => setView('scores'),
      rightText: 'Leaderboard',
      rightColor: t.accent.green,
    },
    {
      label: 'Achievements',
      onPress: () => setView('achievements'),
      rightText: 'Soulbound NFTs',
      rightColor: t.accent.orange,
    },
    {
      label: 'Community Health',
      onPress: () => setView('community-health'),
      rightText: 'Dashboard',
      rightColor: t.accent.green,
    },
    {
      label: 'Correction Reports',
      onPress: () => setView('correction'),
      rightText: 'Article V',
      rightColor: t.accent.red,
    },
    {
      label: 'Escrow & Disputes',
      onPress: () => setView('escrow'),
      rightText: 'P2P Trades',
      rightColor: t.accent.green,
    },
    {
      label: 'Treasury',
      onPress: () => setView('treasury'),
      rightText: 'View',
      rightColor: t.accent.green,
    },
    {
      label: 'Family Tree',
      onPress: () => setView('family-tree'),
      rightText: 'Connections',
      rightColor: t.accent.green,
    },
    {
      label: 'Parenting Journey',
      onPress: () => setView('parenting-journey'),
      rightText: 'Milestones',
      rightColor: t.accent.purple,
    },
    {
      label: 'Teacher Impact',
      onPress: () => setView('teacher-impact'),
      rightText: 'eOTK',
      rightColor: t.accent.blue,
    },
    {
      label: 'Education Hub',
      onPress: () => setView('education-hub'),
      rightText: 'Article I',
      rightColor: t.accent.green,
    },
    {
      label: 'Skill Certifications',
      onPress: () => setView('skill-cert'),
      rightText: 'Soulbound',
      rightColor: t.accent.purple,
    },
    {
      label: 'Mentorship',
      onPress: () => setView('mentorship'),
      rightText: 'Connect',
      rightColor: t.accent.blue,
    },
    {
      label: 'Volunteer Service',
      onPress: () => setView('volunteer'),
      rightText: 'cOTK',
      rightColor: t.accent.green,
    },
    {
      label: 'Community Board',
      onPress: () => setView('community-board'),
      rightText: 'Opportunities',
      rightColor: t.accent.purple,
    },
    {
      label: 'Encrypted Messages',
      onPress: () => setView('messages'),
      rightText: 'P2P',
      rightColor: t.accent.green,
    },
    {
      label: 'Community Feed',
      onPress: () => setView('social-feed'),
      rightText: 'Activity',
      rightColor: t.accent.blue,
    },
    {
      label: 'My Profile',
      onPress: () => setView('profile'),
      rightText: 'View',
      rightColor: t.accent.purple,
    },
    {
      label: 'Validator Dashboard',
      onPress: () => setView('validator-dashboard'),
      rightText: 'Node Stats',
      rightColor: t.accent.green,
    },
  ];

  const toolsItems = [
    {
      label: 'Price Alerts',
      onPress: () => setView('alerts'),
    },
    {
      label: 'Advanced Alerts',
      onPress: () => setView('advanced-alerts'),
      rightText: 'Multi-Condition',
      rightColor: t.accent.orange,
    },
    {
      label: 'Portfolio Analytics',
      onPress: () => setView('analytics'),
    },
    {
      label: 'Portfolio Chart',
      onPress: () => setView('portfolio-chart'),
      rightText: 'History',
      rightColor: t.accent.green,
    },
    {
      label: 'Market',
      onPress: () => setView('market'),
      rightText: 'Top tokens',
    },
    {
      label: 'Token Compare',
      onPress: () => setView('token-compare'),
      rightText: 'Side by Side',
      rightColor: t.accent.purple,
    },
    {
      label: 'Watchlist',
      onPress: () => setView('watchlist'),
      rightText: 'Track Tokens',
      rightColor: t.accent.purple,
    },
    {
      label: 'Tax Calculator',
      onPress: () => setView('tax-calculator'),
      rightText: 'Multi-Country',
      rightColor: t.accent.orange,
    },
    {
      label: 'Wallet Analytics',
      onPress: () => setView('wallet-analytics'),
      rightText: 'Activity',
      rightColor: t.accent.blue,
    },
    {
      label: 'Transaction Notes',
      onPress: () => setView('tx-notes'),
      rightText: 'Tags & Notes',
      rightColor: t.accent.purple,
    },
    {
      label: 'Gas Tracker',
      onPress: () => setView('gas-tracker'),
      rightText: 'All Chains',
      rightColor: t.accent.orange,
    },
    {
      label: 'Batch Transactions',
      onPress: () => setView('batch-tx'),
      rightText: 'Multi-Send',
      rightColor: t.accent.green,
    },
    {
      label: 'Address Labels',
      onPress: () => setView('address-labels'),
      rightText: 'Manage',
      rightColor: t.accent.blue,
    },
    {
      label: 'Address Verification',
      onPress: () => setView('address-verify'),
      rightText: 'Verify',
      rightColor: t.accent.green,
    },
    {
      label: 'Transaction Simulator',
      onPress: () => setView('tx-simulator'),
      rightText: 'Preview',
      rightColor: t.accent.blue,
    },
    {
      label: 'Transaction Export',
      onPress: () => setView('export'),
      rightText: 'CSV / JSON',
    },
    {
      label: 'DApp Browser',
      onPress: () => setView('dapp-browser'),
      rightText: 'Browse',
      rightColor: t.accent.blue,
    },
    {
      label: 'Token Launch Pad',
      onPress: () => setView('token-launch'),
      rightText: 'Create',
      rightColor: t.accent.purple,
    },
    {
      label: 'NFT Gallery',
      onPress: () => setView('nft-gallery'),
      rightText: 'View',
      rightColor: t.accent.orange,
    },
    {
      label: 'Offline Queue',
      onPress: () => setView('offline-queue'),
      rightText: 'Pending',
      rightColor: t.accent.yellow,
    },
    {
      label: 'Pending Transactions',
      onPress: () => setView('pending-tx'),
      rightText: 'Track',
      rightColor: t.accent.orange,
    },
    {
      label: 'Hardware Key',
      onPress: () => setView('hardware-key'),
      rightText: 'Manage',
      rightColor: t.accent.green,
    },
  ];

  const aboutItems = [
    {
      label: 'Version',
      onPress: () => {},
      rightText: '0.3.0-alpha',
    },
    {
      label: "What's New",
      onPress: () => setView('whatsnew'),
      rightText: 'v0.3.0',
      rightColor: t.accent.green,
    },
    {
      label: 'License',
      onPress: () => Linking.openURL('https://github.com/bpupadhyaya/crypto'),
      rightText: 'MIT (Open Source)',
      rightColor: t.accent.green,
    },
    {
      label: 'Source Code',
      onPress: () => Linking.openURL('https://github.com/bpupadhyaya/crypto'),
      rightText: 'GitHub',
      rightColor: t.accent.blue,
    },
    {
      label: 'Privacy Policy',
      onPress: () => setView('privacy'),
      rightText: 'Read',
      rightColor: t.accent.blue,
    },
    {
      label: 'Privacy Policy (Web)',
      onPress: () => Linking.openURL('https://bpupadhyaya.github.io/privacy-openwallet.html'),
      rightText: 'External',
      rightColor: t.accent.blue,
    },
    {
      label: 'The Human Constitution',
      onPress: () => Linking.openURL('https://github.com/bpupadhyaya/crypto/blob/main/docs/HUMAN_CONSTITUTION.md'),
      rightText: 'Read',
      rightColor: t.accent.blue,
    },
    {
      label: 'Tutorial',
      onPress: () => setView('tutorial'),
      rightText: 'Walkthrough',
      rightColor: t.accent.green,
    },
    {
      label: 'Help & FAQ',
      onPress: () => setView('help'),
      rightText: 'Support',
      rightColor: t.accent.blue,
    },
  ];

  // ─── Category Content Renderer ───

  const renderCategoryContent = (cat: SettingsCategory) => {
    type CategoryItem = { label: string; onPress: () => void; rightText?: string; rightColor?: string; rightComponent?: React.ReactNode };
    const categoryMap: Record<string, { title: string; sectionKey: string; items: CategoryItem[] }> = {
      account: { title: 'Account & Security', sectionKey: 'security', items: accountItems },
      network: { title: 'Network & P2P', sectionKey: 'network', items: networkItems },
      wallet: { title: 'Wallet', sectionKey: 'wallet', items: walletItems },
      exchange: { title: 'Exchange & DeFi', sectionKey: 'defi', items: exchangeItems },
      chain: { title: 'Open Chain', sectionKey: 'openchain', items: chainItems },
      tools: { title: 'Tools', sectionKey: 'tools', items: toolsItems },
      about: { title: 'About', sectionKey: 'about', items: aboutItems },
    };

    // Support the Mission — special layout
    if (cat === 'support') {
      return (
        <SafeAreaView style={st.container}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll}>
            <View style={st.categoryHeader}>
              <TouchableOpacity style={st.categoryBackBtn} onPress={() => setCategory(null)}>
                <Text style={st.categoryBackText}>{'\u2190'}</Text>
              </TouchableOpacity>
              <Text style={st.categoryTitle}>Support the Mission</Text>
            </View>
            <View style={[st.card, { padding: 20, marginTop: 12 }]}>
              <Text style={{ color: t.text.primary, fontSize: 15, fontWeight: '700', marginBottom: 8 }}>
                Help build financial infrastructure for all of humanity
              </Text>
              <Text style={{ color: t.text.muted, fontSize: 13, lineHeight: 20, marginBottom: 16 }}>
                Open Wallet, Open Chain, and Open Token are 100% open source with no VC funding, no pre-mine, and no founder allocation. Every line of code is a gift to humanity. Your donation keeps development going — toward a world where every parent's sacrifice is valued, every teacher's impact is visible, and every human has equal access to the global economy.
              </Text>
              <TouchableOpacity
                style={{ backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 10 }}
                onPress={() => Linking.openURL('https://github.com/sponsors/bpupadhyaya')}
              >
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Sponsor on GitHub</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: t.accent.blue, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 10 }}
                onPress={() => Linking.openURL('https://bpupadhyaya.github.io/support-openwallet.html')}
              >
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Donation Options</Text>
              </TouchableOpacity>
              <Text style={{ color: t.text.muted, fontSize: 11, textAlign: 'center', lineHeight: 16 }}>
                No features are locked behind donations. Your support is entirely voluntary and goes directly toward building tools that serve humanity.
              </Text>
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      );
    }

    // Developer — special layout
    if (cat === 'developer') {
      return (
        <SafeAreaView style={st.container}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll}>
            <View style={st.categoryHeader}>
              <TouchableOpacity style={st.categoryBackBtn} onPress={() => setCategory(null)}>
                <Text style={st.categoryBackText}>{'\u2190'}</Text>
              </TouchableOpacity>
              <Text style={st.categoryTitle}>Developer</Text>
            </View>
            <View style={[st.card, { marginTop: 12 }]}>
              <TouchableOpacity style={st.row} onPress={() => setView('dev-tools')}>
                <Text style={st.label}>Dev Tools</Text>
                <Text style={{ color: t.accent.purple, fontSize: 14 }}>Debug</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      );
    }

    const config = categoryMap[cat];
    if (!config) return null;

    return (
      <SafeAreaView style={st.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll}>
          <View style={st.categoryHeader}>
            <TouchableOpacity style={st.categoryBackBtn} onPress={() => setCategory(null)}>
              <Text style={st.categoryBackText}>{'\u2190'}</Text>
            </TouchableOpacity>
            <Text style={st.categoryTitle}>{config.title}</Text>
          </View>
          <View style={[st.card, { marginTop: 12 }]}>
            {renderCollapsibleItems(config.sectionKey, config.items, config.items.length)}
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  };

  // ─── Category Drill-Down ───

  if (category !== null) {
    return renderCategoryContent(category)!;
  }

  // ─── Grid Tile Data ───

  const tiles: Array<{ key: SettingsCategory; icon: string; label: string; badge: string }> = [
    { key: 'account', icon: '\uD83D\uDD12', label: 'Account\n& Security', badge: '9 items' },
    { key: 'network', icon: '\uD83C\uDF10', label: 'Network\n& P2P', badge: '4 items' },
    { key: 'wallet', icon: '\uD83D\uDC5B', label: 'Wallet', badge: '10 items' },
    { key: 'exchange', icon: '\uD83D\uDCB1', label: 'Exchange\n& DeFi', badge: '7 items' },
    { key: 'chain', icon: '\u26D3\uFE0F', label: 'Open Chain', badge: '28 items' },
    { key: 'tools', icon: '\uD83D\uDD27', label: 'Tools', badge: '22 items' },
    { key: 'about', icon: '\u2139\uFE0F', label: 'About', badge: '9 items' },
    { key: 'support', icon: '\uD83D\uDC9A', label: 'Support\nthe Mission', badge: '' },
  ];

  const showDev = isTestnet() || demoMode;

  // ─── Main Grid View ───

  return (
    <SafeAreaView style={st.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll}>

        {/* Header with Sign Out */}
        <View style={st.headerRow}>
          <Text style={st.headerTitle}>Settings</Text>
          <TouchableOpacity
            style={st.signOutBtn}
            onPress={() => setTimeout(() => setStatus('locked'), 0)}
          >
            <Text style={st.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Category Grid */}
        <View style={st.gridContainer}>
          {tiles.map((tile) => (
            <TouchableOpacity
              key={tile.key}
              style={st.tile}
              onPress={() => setCategory(tile.key)}
            >
              <Text style={st.tileIcon}>{tile.icon}</Text>
              <Text style={st.tileLabel}>{tile.label}</Text>
              {tile.badge ? <Text style={st.tileBadge}>({tile.badge})</Text> : null}
            </TouchableOpacity>
          ))}
          {showDev && (
            <TouchableOpacity
              style={st.tile}
              onPress={() => setCategory('developer')}
            >
              <Text style={st.tileIcon}>{'\uD83E\uDDEA'}</Text>
              <Text style={st.tileLabel}>Developer</Text>
              <Text style={st.tileBadge}>(testnet only)</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
