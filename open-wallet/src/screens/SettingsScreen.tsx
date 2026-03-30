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
import { WellnessScreen } from './WellnessScreen';
import { CivicScreen } from './CivicScreen';
import { ValueChannelScreen } from './ValueChannelScreen';
import { GlobalImpactScreen } from './GlobalImpactScreen';
import { MyImpactScreen } from './MyImpactScreen';
import { PeaceIndexScreen } from './PeaceIndexScreen';
import { ConstitutionReaderScreen } from './ConstitutionReaderScreen';
import { PledgeScreen } from './PledgeScreen';
import { AmbassadorScreen } from './AmbassadorScreen';
import { EldercareScreen } from './EldercareScreen';
import { IntergenerationScreen } from './IntergenerationScreen';
import { GratitudeWallScreen } from './GratitudeWallScreen';
import { NeedsAssessmentScreen } from './NeedsAssessmentScreen';
import { ResourceMatchScreen } from './ResourceMatchScreen';
import { BasicNeedsScreen } from './BasicNeedsScreen';
import { GuardianScreen } from './GuardianScreen';
import { CrossChainIdentityScreen } from './CrossChainIdentityScreen';
import { AppealScreen } from './AppealScreen';
import { PQCKeyScreen } from './PQCKeyScreen';
import { ZKProofScreen } from './ZKProofScreen';
import { DataSovereigntyScreen } from './DataSovereigntyScreen';
import { MediationScreen } from './MediationScreen';
import { CurriculumScreen } from './CurriculumScreen';
import { HealthEmergencyScreen } from './HealthEmergencyScreen';
import { CommunityProjectScreen } from './CommunityProjectScreen';
import { MicroGrantScreen } from './MicroGrantScreen';
import { InterRegionalScreen } from './InterRegionalScreen';
import { TimeBankScreen } from './TimeBankScreen';
import { MentorMatchScreen } from './MentorMatchScreen';
import { EnvironmentalImpactScreen } from './EnvironmentalImpactScreen';
import { DisasterResponseScreen } from './DisasterResponseScreen';
import { CooperativeScreen } from './CooperativeScreen';
import { YouthCouncilScreen } from './YouthCouncilScreen';
import { CulturalHeritageScreen } from './CulturalHeritageScreen';
import { SkillVerificationScreen } from './SkillVerificationScreen';
import { FamilyFinanceScreen } from './FamilyFinanceScreen';
import { ReputationDashboardScreen } from './ReputationDashboardScreen';
import { CommunityRadioScreen } from './CommunityRadioScreen';
import { FoodSecurityScreen } from './FoodSecurityScreen';
import { WaterSanitationScreen } from './WaterSanitationScreen';
import { HousingScreen } from './HousingScreen';
import { MentalWellnessScreen } from './MentalWellnessScreen';
import { DigitalLiteracyScreen } from './DigitalLiteracyScreen';
import { LegalAidScreen } from './LegalAidScreen';
import { RenewableEnergyScreen } from './RenewableEnergyScreen';
import { LanguageExchangeScreen } from './LanguageExchangeScreen';
import { ElderWisdomScreen } from './ElderWisdomScreen';
import { ArtStudioScreen } from './ArtStudioScreen';
import { SafetyNetScreen } from './SafetyNetScreen';
import { TransportScreen } from './TransportScreen';
import { ChildcareScreen } from './ChildcareScreen';
import { DisabilitySupportScreen } from './DisabilitySupportScreen';
import { EmergencyPrepScreen } from './EmergencyPrepScreen';
import { ImmigrationSupportScreen } from './ImmigrationSupportScreen';
import { SportsScreen } from './SportsScreen';
import { LibraryScreen } from './LibraryScreen';
import { WasteManagementScreen } from './WasteManagementScreen';
import { ConflictPreventionScreen } from './ConflictPreventionScreen';
import { PetWelfareScreen } from './PetWelfareScreen';
import { JobBoardScreen } from './JobBoardScreen';
import { MarketplaceScreen } from './MarketplaceScreen';
import { MaternalHealthScreen } from './MaternalHealthScreen';
import { SeniorActivitiesScreen } from './SeniorActivitiesScreen';
import { GriefSupportScreen } from './GriefSupportScreen';
import { RecoveryScreen } from './RecoveryScreen';
import { WorkshopScreen } from './WorkshopScreen';
import { CivicEducationScreen } from './CivicEducationScreen';
import { FarmToTableScreen } from './FarmToTableScreen';
import { VolunteerAbroadScreen } from './VolunteerAbroadScreen';
import { ResearchScreen } from './ResearchScreen';
import { InsurancePoolScreen } from './InsurancePoolScreen';
import { StorytellingScreen } from './StorytellingScreen';
import { TravelScreen } from './TravelScreen';
import { InnovationScreen } from './InnovationScreen';
import { BarterScreen } from './BarterScreen';
import { MusicScreen } from './MusicScreen';
import { ElectionScreen } from './ElectionScreen';
import { BudgetScreen } from './BudgetScreen';
import { NewsScreen } from './NewsScreen';
import { InfrastructureScreen } from './InfrastructureScreen';
import { WeatherScreen } from './WeatherScreen';
import { HomeSchoolScreen } from './HomeSchoolScreen';
import { MeditationScreen } from './MeditationScreen';
import { CalendarScreen } from './CalendarScreen';
import { AncestryScreen } from './AncestryScreen';
import { ArbitrationScreen } from './ArbitrationScreen';
import { SupplyChainScreen } from './SupplyChainScreen';
import { VolunteerMatchScreen } from './VolunteerMatchScreen';
import { CommunityMapScreen } from './CommunityMapScreen';
import { PrayerScreen } from './PrayerScreen';
import { PermacultureScreen } from './PermacultureScreen';
import { FinancialLiteracyScreen } from './FinancialLiteracyScreen';
import { TeenScreen } from './TeenScreen';
import { TutorScreen } from './TutorScreen';
import { CoWorkingScreen } from './CoWorkingScreen';
import { FeedbackScreen } from './FeedbackScreen';
import { GratitudeJournalScreen } from './GratitudeJournalScreen';
import { EmergencyContactsScreen } from './EmergencyContactsScreen';
import { VisionBoardScreen } from './VisionBoardScreen';
import { PetitionScreen } from './PetitionScreen';
import { BarrierFreeScreen } from './BarrierFreeScreen';
import { CleanupDriveScreen } from './CleanupDriveScreen';
import { NutritionScreen } from './NutritionScreen';
import { SleepScreen } from './SleepScreen';
import { JournalScreen } from './JournalScreen';
import { TreePlantingScreen } from './TreePlantingScreen';
import { BookClubScreen } from './BookClubScreen';
import { ApprenticeshipScreen } from './ApprenticeshipScreen';
import { NeighborHelpScreen } from './NeighborHelpScreen';
import { DanceScreen } from './DanceScreen';
import { GardeningScreen } from './GardeningScreen';
import { PhotoScreen } from './PhotoScreen';
import { PoetryScreen } from './PoetryScreen';
import { RepairCafeScreen } from './RepairCafeScreen';
import { SkillSwapScreen } from './SkillSwapScreen';
import { CeremonyScreen } from './CeremonyScreen';
import { WildlifeScreen } from './WildlifeScreen';
import { GamesScreen } from './GamesScreen';
import { CookingScreen } from './CookingScreen';
import { EndOfLifeScreen } from './EndOfLifeScreen';
import { AstronomyScreen } from './AstronomyScreen';
import { BeekeepingScreen } from './BeekeepingScreen';
import { TextileScreen } from './TextileScreen';
import { VeteranScreen } from './VeteranScreen';
import { DigitalArchiveScreen } from './DigitalArchiveScreen';
import { YogaScreen } from './YogaScreen';
import { PodcastScreen } from './PodcastScreen';
import { ChildSafetyScreen } from './ChildSafetyScreen';
import { ClimateActionScreen } from './ClimateActionScreen';
import { HabitatScreen } from './HabitatScreen';
import { FirstAidScreen } from './FirstAidScreen';
import { NeighborhoodScreen } from './NeighborhoodScreen';
import { DigitalWellbeingScreen } from './DigitalWellbeingScreen';
import { AllergyScreen } from './AllergyScreen';
import { IncidentReportScreen } from './IncidentReportScreen';
import { PenPalScreen } from './PenPalScreen';
import { SeasonalScreen } from './SeasonalScreen';
import { MemorialScreen } from './MemorialScreen';
import { TimelineScreen } from './TimelineScreen';
import { RelationshipScreen } from './RelationshipScreen';
import { PhilanthropyScreen } from './PhilanthropyScreen';
import { FilmScreen } from './FilmScreen';
import { DebateScreen } from './DebateScreen';
import { STEMScreen } from './STEMScreen';
import { AquaponicsScreen } from './AquaponicsScreen';
import { PublicSpeakingScreen } from './PublicSpeakingScreen';
import { NetworkingScreen } from './NetworkingScreen';
import { ParentingStagesScreen } from './ParentingStagesScreen';
import { SoilScreen } from './SoilScreen';
import { PersonaOnboardingScreen } from './PersonaOnboardingScreen';
import { MyDayScreen } from './MyDayScreen';
import { GlobalSearchScreen } from './GlobalSearchScreen';
import { ImpactReportScreen } from './ImpactReportScreen';
import { CommunityStatsScreen } from './CommunityStatsScreen';
import { TokenomicsScreen } from './TokenomicsScreen';
import { ConstitutionQuizScreen } from './ConstitutionQuizScreen';
import { StatusScreen } from './StatusScreen';
import { LeaderboardScreen } from './LeaderboardScreen';
import { NotificationCenterScreen } from './NotificationCenterScreen';
import { ShortcutsScreen } from './ShortcutsScreen';
import { DataExportScreen } from './DataExportScreen';
import { ThemeStudioScreen } from './ThemeStudioScreen';
import { ReferralScreen } from './ReferralScreen';
import { WellnessHubScreen } from './WellnessHubScreen';
import { DCAScreen } from './DCAScreen';
import { YieldOptimizerScreen } from './YieldOptimizerScreen';
import { CrossChainBridgeScreen } from './CrossChainBridgeScreen';
import { TokenSwapHistoryScreen } from './TokenSwapHistoryScreen';
import { PortfolioRebalanceScreen } from './PortfolioRebalanceScreen';
import { PriceChartScreen } from './PriceChartScreen';
import { AirdropScreen } from './AirdropScreen';
import { StakingCalcScreen } from './StakingCalcScreen';
import { LiquidityGuideScreen } from './LiquidityGuideScreen';
import { TradingScreen } from './TradingScreen';
import { ContractScreen } from './ContractScreen';
import { GovernanceHistoryScreen } from './GovernanceHistoryScreen';
import { MultiWalletScreen } from './MultiWalletScreen';
import { GasOptimizeScreen } from './GasOptimizeScreen';
import { SeedPhraseQuizScreen } from './SeedPhraseQuizScreen';
import { AppInfoScreen } from './AppInfoScreen';
import { TimeCapsuleScreen } from './TimeCapsuleScreen';
import { CommunityAwardsScreen } from './CommunityAwardsScreen';
import { MicrofinanceScreen } from './MicrofinanceScreen';
import { PredictionScreen } from './PredictionScreen';
import { CommunityConstitutionScreen } from './CommunityConstitutionScreen';
import i18n from '../i18n';

type SettingsView = 'main' | 'change-pin' | 'new-pin' | 'confirm-pin' | 'backup' | 'alerts' | 'contacts' | 'hardware' | 'hardware-key' | 'walletconnect' | 'staking' | 'rewards' | 'uid' | 'ledger' | 'gratitude' | 'governance' | 'oracle' | 'scores' | 'privacy' | 'whatsnew' | 'defi' | 'p2p' | 'achievements' | 'rails' | 'notifications' | 'analytics' | 'market' | 'exchange' | 'import-wallet' | 'export' | 'dapp-browser' | 'token-launch' | 'nft-gallery' | 'security-audit' | 'cloud-backup' | 'messages' | 'social-feed' | 'profile' | 'recurring-payments' | 'automation' | 'multisig' | 'spending-limits' | 'liquidity' | 'yield-farm' | 'lend-borrow' | 'tax-calculator' | 'wallet-analytics' | 'watchlist' | 'tutorial' | 'help' | 'accessibility' | 'address-verify' | 'tx-simulator' | 'chain-info' | 'identity' | 'escrow' | 'disputes' | 'dao' | 'delegation' | 'voting-power' | 'milestones' | 'correction' | 'community-health' | 'dev-tools' | 'offline-queue' | 'pending-tx' | 'portfolio-chart' | 'advanced-alerts' | 'token-compare' | 'tx-notes' | 'gas-tracker' | 'batch-tx' | 'address-labels' | 'treasury' | 'family-tree' | 'parenting-journey' | 'teacher-impact' | 'payment-request' | 'validator-dashboard' | 'volunteer' | 'community-board' | 'education-hub' | 'skill-cert' | 'mentorship' | 'wellness' | 'civic' | 'value-channels' | 'global-impact' | 'my-impact' | 'peace-index' | 'constitution-reader' | 'pledge' | 'ambassador' | 'eldercare' | 'intergeneration' | 'gratitude-wall' | 'needs-assessment' | 'resource-match' | 'basic-needs' | 'guardian' | 'cross-chain-id' | 'appeal' | 'pqc-key' | 'zk-proof' | 'data-sovereignty' | 'mediation' | 'curriculum' | 'health-emergency' | 'community-projects' | 'micro-grants' | 'inter-regional' | 'time-bank' | 'mentor-match' | 'environmental' | 'disaster-response' | 'cooperative' | 'youth-council' | 'cultural-heritage' | 'skill-verification' | 'family-finance' | 'reputation' | 'community-radio' | 'food-security' | 'water-sanitation' | 'housing' | 'mental-wellness' | 'digital-literacy' | 'legal-aid' | 'renewable-energy' | 'language-exchange' | 'elder-wisdom' | 'art-studio' | 'safety-net' | 'transport' | 'childcare' | 'disability-support' | 'emergency-prep' | 'immigration-support' | 'sports' | 'library' | 'waste-management' | 'conflict-prevention' | 'pet-welfare' | 'job-board' | 'marketplace' | 'maternal-health' | 'senior-activities' | 'grief-support' | 'recovery' | 'workshop' | 'civic-education' | 'farm-to-table' | 'volunteer-abroad' | 'research' | 'insurance-pool' | 'storytelling' | 'travel' | 'innovation' | 'barter' | 'music' | 'election' | 'budget' | 'news' | 'infrastructure' | 'weather' | 'homeschool' | 'meditation' | 'calendar' | 'ancestry' | 'arbitration' | 'supply-chain' | 'volunteer-match' | 'community-map' | 'prayer' | 'permaculture' | 'financial-literacy' | 'teen' | 'tutor' | 'coworking' | 'feedback' | 'gratitude-journal' | 'emergency-contacts' | 'vision-board' | 'petition' | 'barrier-free' | 'cleanup-drive' | 'nutrition' | 'sleep' | 'journal' | 'tree-planting' | 'book-club' | 'apprenticeship' | 'neighbor-help' | 'dance' | 'gardening' | 'photo' | 'poetry' | 'repair-cafe' | 'skill-swap' | 'ceremony' | 'wildlife' | 'games' | 'cooking' | 'end-of-life' | 'astronomy' | 'beekeeping' | 'textile' | 'veteran' | 'digital-archive' | 'yoga' | 'podcast' | 'child-safety' | 'climate-action' | 'habitat' | 'first-aid' | 'neighborhood' | 'digital-wellbeing' | 'allergy' | 'incident-report' | 'pen-pal' | 'seasonal' | 'memorial' | 'personal-timeline' | 'relationship' | 'philanthropy' | 'film' | 'debate' | 'stem' | 'aquaponics' | 'public-speaking' | 'networking' | 'parenting-stages' | 'soil' | 'persona-onboarding' | 'my-day' | 'global-search' | 'impact-report' | 'community-stats' | 'tokenomics' | 'constitution-quiz' | 'system-status' | 'leaderboard' | 'notification-center' | 'shortcuts' | 'data-export' | 'theme-studio' | 'referral' | 'wellness-hub' | 'dca' | 'yield-optimizer' | 'cross-chain-bridge' | 'swap-history' | 'portfolio-rebalance' | 'price-chart' | 'airdrop' | 'staking-calc' | 'liquidity-guide' | 'trading' | 'contracts' | 'governance-history' | 'multi-wallet' | 'gas-optimize' | 'seed-quiz' | 'app-info' | 'time-capsule' | 'community-awards' | 'microfinance' | 'prediction' | 'community-constitution';

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
  if (view === 'wellness') return <WellnessScreen onClose={() => setView('main')} />;
  if (view === 'civic') return <CivicScreen onClose={() => setView('main')} />;
  if (view === 'global-impact') return <GlobalImpactScreen onClose={() => setView('main')} />;
  if (view === 'my-impact') return <MyImpactScreen onClose={() => setView('main')} />;
  if (view === 'peace-index') return <PeaceIndexScreen onClose={() => setView('main')} />;
  if (view === 'value-channels') return <ValueChannelScreen onClose={() => setView('main')} onNavigate={(screen) => setView(screen as any)} />;
  if (view === 'constitution-reader') return <ConstitutionReaderScreen onClose={() => setView('main')} />;
  if (view === 'pledge') return <PledgeScreen onClose={() => setView('main')} />;
  if (view === 'ambassador') return <AmbassadorScreen onClose={() => setView('main')} />;
  if (view === 'eldercare') return <EldercareScreen onClose={() => setView('main')} />;
  if (view === 'intergeneration') return <IntergenerationScreen onClose={() => setView('main')} />;
  if (view === 'gratitude-wall') return <GratitudeWallScreen onClose={() => setView('main')} onSendGratitude={() => setView('gratitude')} />;
  if (view === 'needs-assessment') return <NeedsAssessmentScreen onClose={() => setView('main')} />;
  if (view === 'resource-match') return <ResourceMatchScreen onClose={() => setView('main')} />;
  if (view === 'basic-needs') return <BasicNeedsScreen onClose={() => setView('main')} />;
  if (view === 'guardian') return <GuardianScreen onClose={() => setView('main')} />;
  if (view === 'cross-chain-id') return <CrossChainIdentityScreen onClose={() => setView('main')} />;
  if (view === 'appeal') return <AppealScreen onClose={() => setView('main')} />;
  if (view === 'pqc-key') return <PQCKeyScreen onClose={() => setView('main')} />;
  if (view === 'zk-proof') return <ZKProofScreen onClose={() => setView('main')} />;
  if (view === 'data-sovereignty') return <DataSovereigntyScreen onClose={() => setView('main')} />;
  if (view === 'mediation') return <MediationScreen onClose={() => setView('main')} />;
  if (view === 'curriculum') return <CurriculumScreen onClose={() => setView('main')} />;
  if (view === 'health-emergency') return <HealthEmergencyScreen onClose={() => setView('main')} />;
  if (view === 'community-projects') return <CommunityProjectScreen onClose={() => setView('main')} />;
  if (view === 'micro-grants') return <MicroGrantScreen onClose={() => setView('main')} />;
  if (view === 'inter-regional') return <InterRegionalScreen onClose={() => setView('main')} />;
  if (view === 'time-bank') return <TimeBankScreen onClose={() => setView('main')} />;
  if (view === 'mentor-match') return <MentorMatchScreen onClose={() => setView('main')} />;
  if (view === 'environmental') return <EnvironmentalImpactScreen onClose={() => setView('main')} />;
  if (view === 'disaster-response') return <DisasterResponseScreen onClose={() => setView('main')} />;
  if (view === 'cooperative') return <CooperativeScreen onClose={() => setView('main')} />;
  if (view === 'youth-council') return <YouthCouncilScreen onClose={() => setView('main')} />;
  if (view === 'cultural-heritage') return <CulturalHeritageScreen onClose={() => setView('main')} />;
  if (view === 'skill-verification') return <SkillVerificationScreen onClose={() => setView('main')} />;
  if (view === 'family-finance') return <FamilyFinanceScreen onClose={() => setView('main')} />;
  if (view === 'reputation') return <ReputationDashboardScreen onClose={() => setView('main')} />;
  if (view === 'community-radio') return <CommunityRadioScreen onClose={() => setView('main')} />;
  if (view === 'food-security') return <FoodSecurityScreen onClose={() => setView('main')} />;
  if (view === 'water-sanitation') return <WaterSanitationScreen onClose={() => setView('main')} />;
  if (view === 'housing') return <HousingScreen onClose={() => setView('main')} />;
  if (view === 'mental-wellness') return <MentalWellnessScreen onClose={() => setView('main')} />;
  if (view === 'digital-literacy') return <DigitalLiteracyScreen onClose={() => setView('main')} />;
  if (view === 'legal-aid') return <LegalAidScreen onClose={() => setView('main')} />;
  if (view === 'renewable-energy') return <RenewableEnergyScreen onClose={() => setView('main')} />;
  if (view === 'language-exchange') return <LanguageExchangeScreen onClose={() => setView('main')} />;
  if (view === 'elder-wisdom') return <ElderWisdomScreen onClose={() => setView('main')} />;
  if (view === 'art-studio') return <ArtStudioScreen onClose={() => setView('main')} />;
  if (view === 'safety-net') return <SafetyNetScreen onClose={() => setView('main')} />;
  if (view === 'transport') return <TransportScreen onClose={() => setView('main')} />;
  if (view === 'childcare') return <ChildcareScreen onClose={() => setView('main')} />;
  if (view === 'disability-support') return <DisabilitySupportScreen onClose={() => setView('main')} />;
  if (view === 'emergency-prep') return <EmergencyPrepScreen onClose={() => setView('main')} />;
  if (view === 'immigration-support') return <ImmigrationSupportScreen onClose={() => setView('main')} />;
  if (view === 'sports') return <SportsScreen onClose={() => setView('main')} />;
  if (view === 'library') return <LibraryScreen onClose={() => setView('main')} />;
  if (view === 'waste-management') return <WasteManagementScreen onClose={() => setView('main')} />;
  if (view === 'conflict-prevention') return <ConflictPreventionScreen onClose={() => setView('main')} />;
  if (view === 'pet-welfare') return <PetWelfareScreen onClose={() => setView('main')} />;
  if (view === 'job-board') return <JobBoardScreen onClose={() => setView('main')} />;
  if (view === 'marketplace') return <MarketplaceScreen onClose={() => setView('main')} />;
  if (view === 'maternal-health') return <MaternalHealthScreen onClose={() => setView('main')} />;
  if (view === 'senior-activities') return <SeniorActivitiesScreen onClose={() => setView('main')} />;
  if (view === 'grief-support') return <GriefSupportScreen onClose={() => setView('main')} />;
  if (view === 'recovery') return <RecoveryScreen onClose={() => setView('main')} />;
  if (view === 'workshop') return <WorkshopScreen onClose={() => setView('main')} />;
  if (view === 'civic-education') return <CivicEducationScreen onClose={() => setView('main')} />;
  if (view === 'farm-to-table') return <FarmToTableScreen onClose={() => setView('main')} />;
  if (view === 'volunteer-abroad') return <VolunteerAbroadScreen onClose={() => setView('main')} />;
  if (view === 'research') return <ResearchScreen onClose={() => setView('main')} />;
  if (view === 'insurance-pool') return <InsurancePoolScreen onClose={() => setView('main')} />;
  if (view === 'storytelling') return <StorytellingScreen onClose={() => setView('main')} />;
  if (view === 'travel') return <TravelScreen onClose={() => setView('main')} />;
  if (view === 'innovation') return <InnovationScreen onClose={() => setView('main')} />;
  if (view === 'barter') return <BarterScreen onClose={() => setView('main')} />;
  if (view === 'music') return <MusicScreen onClose={() => setView('main')} />;
  if (view === 'election') return <ElectionScreen onClose={() => setView('main')} />;
  if (view === 'budget') return <BudgetScreen onClose={() => setView('main')} />;
  if (view === 'news') return <NewsScreen onClose={() => setView('main')} />;
  if (view === 'infrastructure') return <InfrastructureScreen onClose={() => setView('main')} />;
  if (view === 'weather') return <WeatherScreen onClose={() => setView('main')} />;
  if (view === 'homeschool') return <HomeSchoolScreen onClose={() => setView('main')} />;
  if (view === 'meditation') return <MeditationScreen onClose={() => setView('main')} />;
  if (view === 'calendar') return <CalendarScreen onClose={() => setView('main')} />;
  if (view === 'ancestry') return <AncestryScreen onClose={() => setView('main')} />;
  if (view === 'arbitration') return <ArbitrationScreen onClose={() => setView('main')} />;
  if (view === 'supply-chain') return <SupplyChainScreen onClose={() => setView('main')} />;
  if (view === 'volunteer-match') return <VolunteerMatchScreen onClose={() => setView('main')} />;
  if (view === 'community-map') return <CommunityMapScreen onClose={() => setView('main')} />;
  if (view === 'prayer') return <PrayerScreen onClose={() => setView('main')} />;
  if (view === 'permaculture') return <PermacultureScreen onClose={() => setView('main')} />;
  if (view === 'financial-literacy') return <FinancialLiteracyScreen onClose={() => setView('main')} />;
  if (view === 'teen') return <TeenScreen onClose={() => setView('main')} />;
  if (view === 'tutor') return <TutorScreen onClose={() => setView('main')} />;
  if (view === 'coworking') return <CoWorkingScreen onClose={() => setView('main')} />;
  if (view === 'feedback') return <FeedbackScreen onClose={() => setView('main')} />;
  if (view === 'gratitude-journal') return <GratitudeJournalScreen onClose={() => setView('main')} />;
  if (view === 'emergency-contacts') return <EmergencyContactsScreen onClose={() => setView('main')} />;
  if (view === 'vision-board') return <VisionBoardScreen onClose={() => setView('main')} />;
  if (view === 'petition') return <PetitionScreen onClose={() => setView('main')} />;
  if (view === 'barrier-free') return <BarrierFreeScreen onClose={() => setView('main')} />;
  if (view === 'cleanup-drive') return <CleanupDriveScreen onClose={() => setView('main')} />;
  if (view === 'nutrition') return <NutritionScreen onClose={() => setView('main')} />;
  if (view === 'sleep') return <SleepScreen onClose={() => setView('main')} />;
  if (view === 'journal') return <JournalScreen onClose={() => setView('main')} />;
  if (view === 'tree-planting') return <TreePlantingScreen onClose={() => setView('main')} />;
  if (view === 'book-club') return <BookClubScreen onClose={() => setView('main')} />;
  if (view === 'apprenticeship') return <ApprenticeshipScreen onClose={() => setView('main')} />;
  if (view === 'neighbor-help') return <NeighborHelpScreen onClose={() => setView('main')} />;
  if (view === 'dance') return <DanceScreen onClose={() => setView('main')} />;
  if (view === 'gardening') return <GardeningScreen onClose={() => setView('main')} />;
  if (view === 'photo') return <PhotoScreen onClose={() => setView('main')} />;
  if (view === 'poetry') return <PoetryScreen onClose={() => setView('main')} />;
  if (view === 'repair-cafe') return <RepairCafeScreen onClose={() => setView('main')} />;
  if (view === 'skill-swap') return <SkillSwapScreen onClose={() => setView('main')} />;
  if (view === 'ceremony') return <CeremonyScreen onClose={() => setView('main')} />;
  if (view === 'wildlife') return <WildlifeScreen onClose={() => setView('main')} />;
  if (view === 'games') return <GamesScreen onClose={() => setView('main')} />;
  if (view === 'cooking') return <CookingScreen onClose={() => setView('main')} />;
  if (view === 'end-of-life') return <EndOfLifeScreen onClose={() => setView('main')} />;
  if (view === 'astronomy') return <AstronomyScreen onClose={() => setView('main')} />;
  if (view === 'beekeeping') return <BeekeepingScreen onClose={() => setView('main')} />;
  if (view === 'textile') return <TextileScreen onClose={() => setView('main')} />;
  if (view === 'veteran') return <VeteranScreen onClose={() => setView('main')} />;
  if (view === 'digital-archive') return <DigitalArchiveScreen onClose={() => setView('main')} />;
  if (view === 'yoga') return <YogaScreen onClose={() => setView('main')} />;
  if (view === 'podcast') return <PodcastScreen onClose={() => setView('main')} />;
  if (view === 'child-safety') return <ChildSafetyScreen onClose={() => setView('main')} />;
  if (view === 'climate-action') return <ClimateActionScreen onClose={() => setView('main')} />;
  if (view === 'habitat') return <HabitatScreen onClose={() => setView('main')} />;
  if (view === 'first-aid') return <FirstAidScreen onClose={() => setView('main')} />;
  if (view === 'neighborhood') return <NeighborhoodScreen onClose={() => setView('main')} />;
  if (view === 'digital-wellbeing') return <DigitalWellbeingScreen onClose={() => setView('main')} />;
  if (view === 'allergy') return <AllergyScreen onClose={() => setView('main')} />;
  if (view === 'incident-report') return <IncidentReportScreen onClose={() => setView('main')} />;
  if (view === 'pen-pal') return <PenPalScreen onClose={() => setView('main')} />;
  if (view === 'seasonal') return <SeasonalScreen onClose={() => setView('main')} />;
  if (view === 'memorial') return <MemorialScreen onClose={() => setView('main')} />;
  if (view === 'personal-timeline') return <TimelineScreen onClose={() => setView('main')} />;
  if (view === 'relationship') return <RelationshipScreen onClose={() => setView('main')} />;
  if (view === 'philanthropy') return <PhilanthropyScreen onClose={() => setView('main')} />;
  if (view === 'film') return <FilmScreen onClose={() => setView('main')} />;
  if (view === 'debate') return <DebateScreen onClose={() => setView('main')} />;
  if (view === 'stem') return <STEMScreen onClose={() => setView('main')} />;
  if (view === 'aquaponics') return <AquaponicsScreen onClose={() => setView('main')} />;
  if (view === 'public-speaking') return <PublicSpeakingScreen onClose={() => setView('main')} />;
  if (view === 'networking') return <NetworkingScreen onClose={() => setView('main')} />;
  if (view === 'parenting-stages') return <ParentingStagesScreen onClose={() => setView('main')} />;
  if (view === 'soil') return <SoilScreen onClose={() => setView('main')} />;
  if (view === 'persona-onboarding') return <PersonaOnboardingScreen onClose={() => setView('main')} />;
  if (view === 'my-day') return <MyDayScreen onClose={() => setView('main')} />;
  if (view === 'global-search') return <GlobalSearchScreen onClose={() => setView('main')} onNavigate={(v) => setView(v as any)} />;
  if (view === 'impact-report') return <ImpactReportScreen onClose={() => setView('main')} />;
  if (view === 'community-stats') return <CommunityStatsScreen onClose={() => setView('main')} />;
  if (view === 'tokenomics') return <TokenomicsScreen onClose={() => setView('main')} />;
  if (view === 'constitution-quiz') return <ConstitutionQuizScreen onClose={() => setView('main')} />;
  if (view === 'system-status') return <StatusScreen onClose={() => setView('main')} />;
  if (view === 'leaderboard') return <LeaderboardScreen onClose={() => setView('main')} />;
  if (view === 'notification-center') return <NotificationCenterScreen onClose={() => setView('main')} />;
  if (view === 'shortcuts') return <ShortcutsScreen onClose={() => setView('main')} />;
  if (view === 'data-export') return <DataExportScreen onClose={() => setView('main')} />;
  if (view === 'theme-studio') return <ThemeStudioScreen onClose={() => setView('main')} />;
  if (view === 'referral') return <ReferralScreen onClose={() => setView('main')} />;
  if (view === 'wellness-hub') return <WellnessHubScreen onClose={() => setView('main')} />;
  if (view === 'dca') return <DCAScreen onClose={() => setView('main')} />;
  if (view === 'yield-optimizer') return <YieldOptimizerScreen onClose={() => setView('main')} />;
  if (view === 'cross-chain-bridge') return <CrossChainBridgeScreen onClose={() => setView('main')} />;
  if (view === 'swap-history') return <TokenSwapHistoryScreen onClose={() => setView('main')} />;
  if (view === 'portfolio-rebalance') return <PortfolioRebalanceScreen onClose={() => setView('main')} />;
  if (view === 'price-chart') return <PriceChartScreen onClose={() => setView('main')} />;
  if (view === 'airdrop') return <AirdropScreen onClose={() => setView('main')} />;
  if (view === 'staking-calc') return <StakingCalcScreen onClose={() => setView('main')} />;
  if (view === 'liquidity-guide') return <LiquidityGuideScreen onClose={() => setView('main')} />;
  if (view === 'trading') return <TradingScreen onClose={() => setView('main')} />;
  if (view === 'contracts') return <ContractScreen onClose={() => setView('main')} />;
  if (view === 'governance-history') return <GovernanceHistoryScreen onClose={() => setView('main')} />;
  if (view === 'multi-wallet') return <MultiWalletScreen onClose={() => setView('main')} />;
  if (view === 'gas-optimize') return <GasOptimizeScreen onClose={() => setView('main')} />;
  if (view === 'seed-quiz') return <SeedPhraseQuizScreen onClose={() => setView('main')} />;
  if (view === 'app-info') return <AppInfoScreen onClose={() => setView('main')} />;
  if (view === 'time-capsule') return <TimeCapsuleScreen onClose={() => setView('main')} />;
  if (view === 'community-awards') return <CommunityAwardsScreen onClose={() => setView('main')} />;
  if (view === 'microfinance') return <MicrofinanceScreen onClose={() => setView('main')} />;
  if (view === 'prediction') return <PredictionScreen onClose={() => setView('main')} />;
  if (view === 'community-constitution') return <CommunityConstitutionScreen onClose={() => setView('main')} />;

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
      label: 'My Day',
      onPress: () => setView('my-day'),
      rightText: 'Today',
      rightColor: t.accent.green,
    },
    {
      label: 'Search Everything',
      onPress: () => setView('global-search'),
      rightText: '249 Screens',
      rightColor: t.accent.blue,
    },
    {
      label: 'Setup Persona',
      onPress: () => setView('persona-onboarding'),
      rightText: 'Customize',
      rightColor: t.accent.purple,
    },
    {
      label: 'Impact Report',
      onPress: () => setView('impact-report'),
      rightText: 'Annual Summary',
      rightColor: t.accent.green,
    },
    {
      label: 'Community Stats',
      onPress: () => setView('community-stats'),
      rightText: 'Aggregate Data',
      rightColor: t.accent.blue,
    },
    {
      label: 'Leaderboard',
      onPress: () => setView('leaderboard'),
      rightText: 'Top Contributors',
      rightColor: t.accent.yellow,
    },
    {
      label: 'OTK Tokenomics',
      onPress: () => setView('tokenomics'),
      rightText: 'How OTK Works',
      rightColor: t.accent.green,
    },
    {
      label: 'Constitution Quiz',
      onPress: () => setView('constitution-quiz'),
      rightText: 'gOTK Rewards',
      rightColor: t.accent.purple,
    },
    {
      label: 'System Status',
      onPress: () => setView('system-status'),
      rightText: 'Health & Sync',
      rightColor: t.accent.blue,
    },
    {
      label: 'Notifications',
      onPress: () => setView('notification-center'),
      rightText: 'All Alerts',
      rightColor: t.accent.red,
    },
    {
      label: 'Shortcuts',
      onPress: () => setView('shortcuts'),
      rightText: 'Quick Actions',
      rightColor: t.accent.purple,
    },
    {
      label: 'Data Export',
      onPress: () => setView('data-export'),
      rightText: 'Your Data',
      rightColor: t.accent.blue,
    },
    {
      label: 'Theme Studio',
      onPress: () => setView('theme-studio'),
      rightText: 'Customize Look',
      rightColor: t.accent.orange,
    },
    {
      label: 'Referral Program',
      onPress: () => setView('referral'),
      rightText: 'Invite & Grow',
      rightColor: t.accent.green,
    },
    {
      label: 'Wellness Hub',
      onPress: () => setView('wellness-hub'),
      rightText: 'All Health',
      rightColor: t.accent.green,
    },
    {
      label: 'DCA (Auto-Buy)',
      onPress: () => setView('dca'),
      rightText: 'Recurring',
      rightColor: t.accent.blue,
    },
    {
      label: 'Yield Optimizer',
      onPress: () => setView('yield-optimizer'),
      rightText: 'Auto-Compound',
      rightColor: t.accent.green,
    },
    {
      label: 'Cross-Chain Bridge',
      onPress: () => setView('cross-chain-bridge'),
      rightText: 'Bridge Tokens',
      rightColor: t.accent.purple,
    },
    {
      label: 'Swap History',
      onPress: () => setView('swap-history'),
      rightText: 'All 8 Providers',
      rightColor: t.accent.orange,
    },
    {
      label: 'Portfolio Rebalance',
      onPress: () => setView('portfolio-rebalance'),
      rightText: 'Target Allocation',
      rightColor: t.accent.blue,
    },
    {
      label: 'Price Charts',
      onPress: () => setView('price-chart'),
      rightText: 'Detailed Charts',
      rightColor: t.accent.green,
    },
    {
      label: 'Airdrops',
      onPress: () => setView('airdrop'),
      rightText: 'Claim Tokens',
      rightColor: t.accent.yellow,
    },
    {
      label: 'Staking Calculator',
      onPress: () => setView('staking-calc'),
      rightText: 'Rewards Projector',
      rightColor: t.accent.green,
    },
    {
      label: 'Liquidity Guide',
      onPress: () => setView('liquidity-guide'),
      rightText: 'Learn LP',
      rightColor: t.accent.blue,
    },
    {
      label: 'Advanced Trading',
      onPress: () => setView('trading'),
      rightText: 'Order Book UI',
      rightColor: t.accent.orange,
    },
    {
      label: 'Smart Contracts',
      onPress: () => setView('contracts'),
      rightText: 'Deploy & Interact',
      rightColor: t.accent.blue,
    },
    {
      label: 'Governance History',
      onPress: () => setView('governance-history'),
      rightText: 'Your Votes',
      rightColor: t.accent.purple,
    },
    {
      label: 'Multi-Wallet',
      onPress: () => setView('multi-wallet'),
      rightText: 'Manage Accounts',
      rightColor: t.accent.blue,
    },
    {
      label: 'Gas Optimizer',
      onPress: () => setView('gas-optimize'),
      rightText: 'Save on Fees',
      rightColor: t.accent.green,
    },
    {
      label: 'Seed Phrase Quiz',
      onPress: () => setView('seed-quiz'),
      rightText: 'Backup Check',
      rightColor: t.accent.yellow,
    },
    {
      label: 'About Open Wallet',
      onPress: () => setView('app-info'),
      rightText: 'Credits & Info',
      rightColor: t.accent.blue,
    },
    {
      label: 'Time Capsules',
      onPress: () => setView('time-capsule'),
      rightText: 'Future Messages',
      rightColor: t.accent.purple,
    },
    {
      label: 'Community Awards',
      onPress: () => setView('community-awards'),
      rightText: 'Recognize Heroes',
      rightColor: t.accent.yellow,
    },
    {
      label: 'Microfinance',
      onPress: () => setView('microfinance'),
      rightText: 'Savings Circles',
      rightColor: t.accent.green,
    },
    {
      label: 'Predictions',
      onPress: () => setView('prediction'),
      rightText: 'Community Bets',
      rightColor: t.accent.orange,
    },
    {
      label: 'Community Charter',
      onPress: () => setView('community-constitution'),
      rightText: 'Local Rules',
      rightColor: t.accent.blue,
    },
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
    {
      label: 'Wellness',
      onPress: () => setView('wellness'),
      rightText: 'hOTK',
      rightColor: t.accent.green,
    },
    {
      label: 'Civic Participation',
      onPress: () => setView('civic'),
      rightText: 'gOTK',
      rightColor: t.accent.blue,
    },
    {
      label: 'Value Channels',
      onPress: () => setView('value-channels'),
      rightText: 'All 6 Channels',
      rightColor: t.accent.purple,
    },
    {
      label: 'Global Impact',
      onPress: () => setView('global-impact'),
      rightText: 'World Map',
      rightColor: t.accent.green,
    },
    {
      label: 'My Impact',
      onPress: () => setView('my-impact'),
      rightText: 'Your Story',
      rightColor: t.accent.purple,
    },
    {
      label: 'Peace Index',
      onPress: () => setView('peace-index'),
      rightText: 'Article X',
      rightColor: t.accent.blue,
    },
    {
      label: 'Eldercare',
      onPress: () => setView('eldercare'),
      rightText: 'nOTK',
      rightColor: t.accent.purple,
    },
    {
      label: 'Generations',
      onPress: () => setView('intergeneration'),
      rightText: 'Legacy',
      rightColor: t.accent.blue,
    },
    {
      label: 'Gratitude Wall',
      onPress: () => setView('gratitude-wall'),
      rightText: 'Live Feed',
      rightColor: t.accent.green,
    },
    {
      label: 'Needs Assessment',
      onPress: () => setView('needs-assessment'),
      rightText: 'Article I \u00A7 3',
      rightColor: t.accent.green,
    },
    {
      label: 'Resource Matching',
      onPress: () => setView('resource-match'),
      rightText: 'Give & Get Help',
      rightColor: t.accent.purple,
    },
    {
      label: 'Basic Needs Dashboard',
      onPress: () => setView('basic-needs'),
      rightText: 'Needs = Peace',
      rightColor: t.accent.blue,
    },
    {
      label: 'Guardian Accounts',
      onPress: () => setView('guardian'),
      rightText: 'Art. II',
      rightColor: t.accent.purple,
    },
    {
      label: 'Cross-Chain Identity',
      onPress: () => setView('cross-chain-id'),
      rightText: 'Multi-Chain UID',
      rightColor: t.accent.blue,
    },
    {
      label: 'Appeal & Contest',
      onPress: () => setView('appeal'),
      rightText: 'Art. V',
      rightColor: t.accent.yellow,
    },
    {
      label: 'Mediation',
      onPress: () => setView('mediation'),
      rightText: 'Conflict Resolution',
      rightColor: t.accent.orange,
    },
    {
      label: 'Curriculum & Pathways',
      onPress: () => setView('curriculum'),
      rightText: 'eOTK Learning',
      rightColor: t.accent.green,
    },
    {
      label: 'Health Emergency',
      onPress: () => setView('health-emergency'),
      rightText: 'SOS Network',
      rightColor: t.accent.red,
    },
    {
      label: 'Community Projects',
      onPress: () => setView('community-projects'),
      rightText: 'cOTK Projects',
      rightColor: t.accent.green,
    },
    {
      label: 'Micro-Grants',
      onPress: () => setView('micro-grants'),
      rightText: 'Treasury Funded',
      rightColor: t.accent.yellow,
    },
    {
      label: 'Inter-Regional Cooperation',
      onPress: () => setView('inter-regional'),
      rightText: 'Cross-Region',
      rightColor: t.accent.blue,
    },
    {
      label: 'Time Bank',
      onPress: () => setView('time-bank'),
      rightText: '1 Hour = 1 Hour',
      rightColor: t.accent.purple,
    },
    {
      label: 'Mentor Match',
      onPress: () => setView('mentor-match'),
      rightText: 'Smart Matching',
      rightColor: t.accent.green,
    },
    {
      label: 'PQC Key Management',
      onPress: () => setView('pqc-key'),
      rightText: 'Quantum-Safe',
      rightColor: t.accent.orange,
    },
    {
      label: 'ZK Proofs',
      onPress: () => setView('zk-proof'),
      rightText: 'Art. VIII Privacy',
      rightColor: t.accent.purple,
    },
    {
      label: 'Data Sovereignty',
      onPress: () => setView('data-sovereignty'),
      rightText: 'Your Data, Your Rules',
      rightColor: t.accent.red,
    },
    {
      label: 'Environmental Impact',
      onPress: () => setView('environmental'),
      rightText: 'Eco Score',
      rightColor: t.accent.green,
    },
    {
      label: 'Disaster Response',
      onPress: () => setView('disaster-response'),
      rightText: 'Relief Coordination',
      rightColor: t.accent.red,
    },
    {
      label: 'Cooperatives',
      onPress: () => setView('cooperative'),
      rightText: 'Shared Ownership',
      rightColor: t.accent.blue,
    },
    {
      label: 'Youth Council',
      onPress: () => setView('youth-council'),
      rightText: 'Youth Governance',
      rightColor: t.accent.purple,
    },
    {
      label: 'Cultural Heritage',
      onPress: () => setView('cultural-heritage'),
      rightText: 'Preserve Traditions',
      rightColor: t.accent.orange,
    },
    {
      label: 'Skill Verification',
      onPress: () => setView('skill-verification'),
      rightText: 'On-Chain Credentials',
      rightColor: t.accent.green,
    },
    {
      label: 'Family Finance',
      onPress: () => setView('family-finance'),
      rightText: 'Shared Budgets',
      rightColor: t.accent.blue,
    },
    {
      label: 'Reputation Dashboard',
      onPress: () => setView('reputation'),
      rightText: 'Score Breakdown',
      rightColor: t.accent.yellow,
    },
    {
      label: 'Community Radio',
      onPress: () => setView('community-radio'),
      rightText: 'Announcements',
      rightColor: t.accent.purple,
    },
    {
      label: 'Food Security',
      onPress: () => setView('food-security'),
      rightText: 'Gardens & Sharing',
      rightColor: t.accent.green,
    },
    {
      label: 'Water & Sanitation',
      onPress: () => setView('water-sanitation'),
      rightText: 'Clean Water Access',
      rightColor: t.accent.blue,
    },
    {
      label: 'Housing Security',
      onPress: () => setView('housing'),
      rightText: 'Shelter & Co-Housing',
      rightColor: t.accent.orange,
    },
    {
      label: 'Mental Wellness',
      onPress: () => setView('mental-wellness'),
      rightText: 'Peer Support',
      rightColor: t.accent.purple,
    },
    {
      label: 'Digital Literacy',
      onPress: () => setView('digital-literacy'),
      rightText: 'Tech For All',
      rightColor: t.accent.blue,
    },
    {
      label: 'Legal Aid',
      onPress: () => setView('legal-aid'),
      rightText: 'Know Your Rights',
      rightColor: t.accent.yellow,
    },
    {
      label: 'Renewable Energy',
      onPress: () => setView('renewable-energy'),
      rightText: 'Community Power',
      rightColor: t.accent.green,
    },
    {
      label: 'Language Exchange',
      onPress: () => setView('language-exchange'),
      rightText: 'Cross-Cultural',
      rightColor: t.accent.purple,
    },
    {
      label: 'Elder Wisdom',
      onPress: () => setView('elder-wisdom'),
      rightText: 'nOTK Knowledge',
      rightColor: t.accent.orange,
    },
    {
      label: 'Art Studio',
      onPress: () => setView('art-studio'),
      rightText: 'Creative Expression',
      rightColor: t.accent.red,
    },
    {
      label: 'Safety Net',
      onPress: () => setView('safety-net'),
      rightText: 'Neighborhood Watch',
      rightColor: t.accent.yellow,
    },
    {
      label: 'Community Transport',
      onPress: () => setView('transport'),
      rightText: 'Ride Sharing',
      rightColor: t.accent.blue,
    },
    {
      label: 'Childcare Co-ops',
      onPress: () => setView('childcare'),
      rightText: 'nOTK Babysitting',
      rightColor: t.accent.purple,
    },
    {
      label: 'Disability Support',
      onPress: () => setView('disability-support'),
      rightText: 'Inclusion',
      rightColor: t.accent.blue,
    },
    {
      label: 'Emergency Preparedness',
      onPress: () => setView('emergency-prep'),
      rightText: 'Be Ready',
      rightColor: t.accent.orange,
    },
    {
      label: 'Newcomer Integration',
      onPress: () => setView('immigration-support'),
      rightText: 'Welcome Program',
      rightColor: t.accent.green,
    },
    {
      label: 'Sports & Fitness',
      onPress: () => setView('sports'),
      rightText: 'hOTK Active',
      rightColor: t.accent.red,
    },
    {
      label: 'Community Library',
      onPress: () => setView('library'),
      rightText: 'eOTK Knowledge',
      rightColor: t.accent.blue,
    },
    {
      label: 'Waste Management',
      onPress: () => setView('waste-management'),
      rightText: 'Recycle & Upcycle',
      rightColor: t.accent.green,
    },
    {
      label: 'Conflict Prevention',
      onPress: () => setView('conflict-prevention'),
      rightText: 'Early Warning',
      rightColor: t.accent.yellow,
    },
    {
      label: 'Pet Welfare',
      onPress: () => setView('pet-welfare'),
      rightText: 'Animal Care',
      rightColor: t.accent.orange,
    },
    {
      label: 'Job Board',
      onPress: () => setView('job-board'),
      rightText: 'xOTK Employment',
      rightColor: t.accent.blue,
    },
    {
      label: 'Marketplace',
      onPress: () => setView('marketplace'),
      rightText: 'Local Exchange',
      rightColor: t.accent.green,
    },
    {
      label: 'Maternal Health',
      onPress: () => setView('maternal-health'),
      rightText: 'Pregnancy & Care',
      rightColor: t.accent.purple,
    },
    {
      label: 'Senior Activities',
      onPress: () => setView('senior-activities'),
      rightText: 'Active Aging',
      rightColor: t.accent.orange,
    },
    {
      label: 'Grief Support',
      onPress: () => setView('grief-support'),
      rightText: 'Peer Support',
      rightColor: t.accent.blue,
    },
    {
      label: 'Recovery Support',
      onPress: () => setView('recovery'),
      rightText: 'Wellness Journey',
      rightColor: t.accent.green,
    },
    {
      label: 'Community Workshop',
      onPress: () => setView('workshop'),
      rightText: 'Shared Tools',
      rightColor: t.accent.yellow,
    },
    {
      label: 'Civic Education',
      onPress: () => setView('civic-education'),
      rightText: 'gOTK Learning',
      rightColor: t.accent.purple,
    },
    {
      label: 'Farm to Table',
      onPress: () => setView('farm-to-table'),
      rightText: 'Local Produce',
      rightColor: t.accent.green,
    },
    {
      label: 'Volunteer Abroad',
      onPress: () => setView('volunteer-abroad'),
      rightText: 'International Service',
      rightColor: t.accent.blue,
    },
    {
      label: 'Community Research',
      onPress: () => setView('research'),
      rightText: 'eOTK Science',
      rightColor: t.accent.green,
    },
    {
      label: 'Insurance Pools',
      onPress: () => setView('insurance-pool'),
      rightText: 'Mutual Aid',
      rightColor: t.accent.blue,
    },
    {
      label: 'Storytelling',
      onPress: () => setView('storytelling'),
      rightText: 'Community Stories',
      rightColor: t.accent.purple,
    },
    {
      label: 'Community Travel',
      onPress: () => setView('travel'),
      rightText: 'Ethical Tourism',
      rightColor: t.accent.orange,
    },
    {
      label: 'Innovation Hub',
      onPress: () => setView('innovation'),
      rightText: 'Open Source Ideas',
      rightColor: t.accent.yellow,
    },
    {
      label: 'Barter Exchange',
      onPress: () => setView('barter'),
      rightText: 'Direct Trade',
      rightColor: t.accent.green,
    },
    {
      label: 'Music & Performance',
      onPress: () => setView('music'),
      rightText: 'Creative Arts',
      rightColor: t.accent.red,
    },
    {
      label: 'Elections',
      onPress: () => setView('election'),
      rightText: 'Community Voting',
      rightColor: t.accent.blue,
    },
    {
      label: 'Community Budget',
      onPress: () => setView('budget'),
      rightText: 'Transparent Finance',
      rightColor: t.accent.green,
    },
    {
      label: 'Community News',
      onPress: () => setView('news'),
      rightText: 'Verified Reporting',
      rightColor: t.accent.yellow,
    },
    {
      label: 'Infrastructure',
      onPress: () => setView('infrastructure'),
      rightText: 'Public Works',
      rightColor: t.accent.orange,
    },
    {
      label: 'Weather & Climate',
      onPress: () => setView('weather'),
      rightText: 'Local Conditions',
      rightColor: t.accent.blue,
    },
    {
      label: 'Home School',
      onPress: () => setView('homeschool'),
      rightText: 'eOTK Education',
      rightColor: t.accent.green,
    },
    {
      label: 'Meditation & Wellness',
      onPress: () => setView('meditation'),
      rightText: 'hOTK Mindfulness',
      rightColor: t.accent.purple,
    },
    {
      label: 'Community Calendar',
      onPress: () => setView('calendar'),
      rightText: 'All Events',
      rightColor: t.accent.blue,
    },
    {
      label: 'Ancestry & Genealogy',
      onPress: () => setView('ancestry'),
      rightText: 'nOTK Family History',
      rightColor: t.accent.orange,
    },
    {
      label: 'Arbitration',
      onPress: () => setView('arbitration'),
      rightText: 'Binding Resolution',
      rightColor: t.accent.red,
    },
    {
      label: 'Supply Chain',
      onPress: () => setView('supply-chain'),
      rightText: 'Farm to Fork',
      rightColor: t.accent.green,
    },
    {
      label: 'Volunteer Match',
      onPress: () => setView('volunteer-match'),
      rightText: 'cOTK Smart Match',
      rightColor: t.accent.purple,
    },
    {
      label: 'Community Map',
      onPress: () => setView('community-map'),
      rightText: 'Resource Directory',
      rightColor: t.accent.blue,
    },
    {
      label: 'Interfaith & Prayer',
      onPress: () => setView('prayer'),
      rightText: 'Spiritual Community',
      rightColor: t.accent.purple,
    },
    {
      label: 'Permaculture',
      onPress: () => setView('permaculture'),
      rightText: 'Sustainable Agriculture',
      rightColor: t.accent.green,
    },
    {
      label: 'Financial Literacy',
      onPress: () => setView('financial-literacy'),
      rightText: 'xOTK Education',
      rightColor: t.accent.yellow,
    },
    {
      label: 'Teen Space',
      onPress: () => setView('teen'),
      rightText: 'Ages 13-17',
      rightColor: t.accent.blue,
    },
    {
      label: 'Peer Tutoring',
      onPress: () => setView('tutor'),
      rightText: 'eOTK Help',
      rightColor: t.accent.green,
    },
    {
      label: 'Co-Working',
      onPress: () => setView('coworking'),
      rightText: 'Shared Workspace',
      rightColor: t.accent.orange,
    },
    {
      label: 'Community Feedback',
      onPress: () => setView('feedback'),
      rightText: 'Rate & Improve',
      rightColor: t.accent.yellow,
    },
    {
      label: 'Gratitude Journal',
      onPress: () => setView('gratitude-journal'),
      rightText: 'Daily Reflection',
      rightColor: t.accent.purple,
    },
    {
      label: 'Emergency Contacts',
      onPress: () => setView('emergency-contacts'),
      rightText: 'ICE Card',
      rightColor: t.accent.red,
    },
    {
      label: 'Vision Board',
      onPress: () => setView('vision-board'),
      rightText: 'Goals & Dreams',
      rightColor: t.accent.blue,
    },
    {
      label: 'Petitions',
      onPress: () => setView('petition'),
      rightText: 'Collective Action',
      rightColor: t.accent.red,
    },
    {
      label: 'Barrier-Free',
      onPress: () => setView('barrier-free'),
      rightText: 'Accessibility Audit',
      rightColor: t.accent.blue,
    },
    {
      label: 'Cleanup Drives',
      onPress: () => setView('cleanup-drive'),
      rightText: 'cOTK Environmental',
      rightColor: t.accent.green,
    },
    {
      label: 'Nutrition',
      onPress: () => setView('nutrition'),
      rightText: 'hOTK Diet',
      rightColor: t.accent.orange,
    },
    {
      label: 'Sleep Tracker',
      onPress: () => setView('sleep'),
      rightText: 'hOTK Rest',
      rightColor: t.accent.purple,
    },
    {
      label: 'Personal Journal',
      onPress: () => setView('journal'),
      rightText: 'Daily Reflection',
      rightColor: t.accent.blue,
    },
    {
      label: 'Tree Planting',
      onPress: () => setView('tree-planting'),
      rightText: 'cOTK Reforestation',
      rightColor: t.accent.green,
    },
    {
      label: 'Book Clubs',
      onPress: () => setView('book-club'),
      rightText: 'eOTK Reading',
      rightColor: t.accent.yellow,
    },
    {
      label: 'Apprenticeships',
      onPress: () => setView('apprenticeship'),
      rightText: 'Trade Skills',
      rightColor: t.accent.orange,
    },
    {
      label: 'Neighbor Help',
      onPress: () => setView('neighbor-help'),
      rightText: 'Quick Mutual Aid',
      rightColor: t.accent.green,
    },
    {
      label: 'Dance & Movement',
      onPress: () => setView('dance'),
      rightText: 'Cultural Dance',
      rightColor: t.accent.purple,
    },
    {
      label: 'Gardening',
      onPress: () => setView('gardening'),
      rightText: 'Plant Tracker',
      rightColor: t.accent.green,
    },
    {
      label: 'Photography',
      onPress: () => setView('photo'),
      rightText: 'Visual Stories',
      rightColor: t.accent.blue,
    },
    {
      label: 'Poetry',
      onPress: () => setView('poetry'),
      rightText: 'Literary Arts',
      rightColor: t.accent.purple,
    },
    {
      label: 'Repair Cafe',
      onPress: () => setView('repair-cafe'),
      rightText: 'xOTK Fix-It',
      rightColor: t.accent.orange,
    },
    {
      label: 'Skill Swap',
      onPress: () => setView('skill-swap'),
      rightText: 'Teach & Learn',
      rightColor: t.accent.blue,
    },
    {
      label: 'Ceremonies',
      onPress: () => setView('ceremony'),
      rightText: 'Rites of Passage',
      rightColor: t.accent.purple,
    },
    {
      label: 'Wildlife',
      onPress: () => setView('wildlife'),
      rightText: 'Biodiversity',
      rightColor: t.accent.green,
    },
    {
      label: 'Games & Play',
      onPress: () => setView('games'),
      rightText: 'Community Fun',
      rightColor: t.accent.yellow,
    },
    {
      label: 'Cooking',
      onPress: () => setView('cooking'),
      rightText: 'Recipes & Culture',
      rightColor: t.accent.orange,
    },
    {
      label: 'End-of-Life Planning',
      onPress: () => setView('end-of-life'),
      rightText: 'Legacy & Directives',
      rightColor: t.accent.blue,
    },
    {
      label: 'Astronomy',
      onPress: () => setView('astronomy'),
      rightText: 'Night Sky',
      rightColor: t.accent.purple,
    },
    {
      label: 'Beekeeping',
      onPress: () => setView('beekeeping'),
      rightText: 'Pollinators',
      rightColor: t.accent.yellow,
    },
    {
      label: 'Textile Arts',
      onPress: () => setView('textile'),
      rightText: 'Knit & Weave',
      rightColor: t.accent.purple,
    },
    {
      label: 'Veteran Support',
      onPress: () => setView('veteran'),
      rightText: 'Transition Help',
      rightColor: t.accent.green,
    },
    {
      label: 'Digital Archive',
      onPress: () => setView('digital-archive'),
      rightText: 'Community Memory',
      rightColor: t.accent.blue,
    },
    {
      label: 'Yoga',
      onPress: () => setView('yoga'),
      rightText: 'hOTK Practice',
      rightColor: t.accent.purple,
    },
    {
      label: 'Community Podcast',
      onPress: () => setView('podcast'),
      rightText: 'Audio Stories',
      rightColor: t.accent.orange,
    },
    {
      label: 'Child Safety',
      onPress: () => setView('child-safety'),
      rightText: 'Safe Routes',
      rightColor: t.accent.red,
    },
    {
      label: 'Climate Action',
      onPress: () => setView('climate-action'),
      rightText: 'Carbon Pledges',
      rightColor: t.accent.green,
    },
    {
      label: 'Habitat Restoration',
      onPress: () => setView('habitat'),
      rightText: 'Ecosystems',
      rightColor: t.accent.green,
    },
    {
      label: 'First Aid',
      onPress: () => setView('first-aid'),
      rightText: 'Emergency Skills',
      rightColor: t.accent.red,
    },
    {
      label: 'My Neighborhood',
      onPress: () => setView('neighborhood'),
      rightText: 'Community Identity',
      rightColor: t.accent.blue,
    },
    {
      label: 'Digital Wellbeing',
      onPress: () => setView('digital-wellbeing'),
      rightText: 'Screen Balance',
      rightColor: t.accent.purple,
    },
    {
      label: 'Allergy Management',
      onPress: () => setView('allergy'),
      rightText: 'hOTK Safety',
      rightColor: t.accent.orange,
    },
    {
      label: 'Incident Reports',
      onPress: () => setView('incident-report'),
      rightText: 'Community Reports',
      rightColor: t.accent.yellow,
    },
    {
      label: 'Pen Pals',
      onPress: () => setView('pen-pal'),
      rightText: 'Global Friends',
      rightColor: t.accent.blue,
    },
    {
      label: 'Seasonal Living',
      onPress: () => setView('seasonal'),
      rightText: 'Nature Cycles',
      rightColor: t.accent.green,
    },
    {
      label: 'Memorials',
      onPress: () => setView('memorial'),
      rightText: 'Honor & Remember',
      rightColor: t.accent.purple,
    },
    {
      label: 'Life Timeline',
      onPress: () => setView('personal-timeline'),
      rightText: 'Your Journey',
      rightColor: t.accent.blue,
    },
    {
      label: 'Relationship Wellness',
      onPress: () => setView('relationship'),
      rightText: 'nOTK Partners',
      rightColor: t.accent.red,
    },
    {
      label: 'Philanthropy',
      onPress: () => setView('philanthropy'),
      rightText: 'Give & Impact',
      rightColor: t.accent.green,
    },
    {
      label: 'Community Cinema',
      onPress: () => setView('film'),
      rightText: 'Film & Documentary',
      rightColor: t.accent.orange,
    },
    {
      label: 'Debates',
      onPress: () => setView('debate'),
      rightText: 'gOTK Discourse',
      rightColor: t.accent.blue,
    },
    {
      label: 'STEM Education',
      onPress: () => setView('stem'),
      rightText: 'eOTK Science',
      rightColor: t.accent.green,
    },
    {
      label: 'Aquaponics',
      onPress: () => setView('aquaponics'),
      rightText: 'Modern Farming',
      rightColor: t.accent.blue,
    },
    {
      label: 'Public Speaking',
      onPress: () => setView('public-speaking'),
      rightText: 'eOTK Skills',
      rightColor: t.accent.purple,
    },
    {
      label: 'Professional Networking',
      onPress: () => setView('networking'),
      rightText: 'xOTK Connections',
      rightColor: t.accent.blue,
    },
    {
      label: 'Parenting Stages',
      onPress: () => setView('parenting-stages'),
      rightText: 'nOTK by Age',
      rightColor: t.accent.orange,
    },
    {
      label: 'Soil Health',
      onPress: () => setView('soil'),
      rightText: 'Regenerative',
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
      onPress: () => setView('constitution-reader'),
      rightText: 'Read',
      rightColor: t.accent.blue,
    },
    {
      label: 'Constitution Pledge',
      onPress: () => setView('pledge'),
      rightText: 'Sign',
      rightColor: t.accent.green,
    },
    {
      label: 'Ambassador Program',
      onPress: () => setView('ambassador'),
      rightText: 'Join',
      rightColor: t.accent.purple,
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
    { key: 'chain', icon: '\u26D3\uFE0F', label: 'Open Chain', badge: '40 items' },
    { key: 'tools', icon: '\uD83D\uDD27', label: 'Tools', badge: '22 items' },
    { key: 'about', icon: '\u2139\uFE0F', label: 'About', badge: '11 items' },
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
