/**
 * Settings Screen — Security, PIN, biometric, mode, sign out.
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
import { useTheme } from '../hooks/useTheme';
import i18n from '../i18n';

type SettingsView = 'main' | 'change-pin' | 'new-pin' | 'confirm-pin' | 'backup' | 'alerts' | 'contacts' | 'hardware' | 'walletconnect' | 'staking' | 'uid' | 'ledger' | 'gratitude';

export function SettingsScreen() {
  const { mode, setMode, setStatus, biometricEnabled, setBiometricEnabled, currency, setCurrency, networkMode, setNetworkMode: setNetwork, themeMode, setThemeMode } = useWalletStore();
  const [view, setView] = useState<SettingsView>('main');
  const [pinToChange, setPinToChange] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [pinConfigured, setPinConfigured] = useState(false);
  const t = useTheme();

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    scroll: { paddingHorizontal: 16, paddingTop: 8 },
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
    progressBar: { height: 4, backgroundColor: t.border, borderRadius: 2, marginHorizontal: 16, marginBottom: 8 },
    progressFill: { height: 4, backgroundColor: t.accent.green, borderRadius: 2 },
    migrationRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 6 },
    migrationName: { color: t.text.secondary, fontSize: 13 },
    migrationYear: { color: t.text.muted, fontSize: 12 },
    currencyRow: { flexDirection: 'row', gap: 4 },
    currencyChip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, backgroundColor: t.border },
    currencyActive: { backgroundColor: t.accent.green },
    currencyText: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
    currencyTextActive: { color: t.bg.primary },
    signOutBtn: { backgroundColor: t.accent.red + '20', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
    signOutText: { color: t.accent.red, fontSize: 16, fontWeight: '700' },
    backBtn: { paddingVertical: 20, alignItems: 'center' },
    backText: { color: t.accent.blue, fontSize: 16 },
  }), [t]);

  useEffect(() => {
    authManager.isBiometricAvailable().then(({ available }) => setBiometricAvailable(available));
    authManager.isPinConfigured().then(setPinConfigured);
  }, []);

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
  if (view === 'walletconnect') return <WalletConnectScreen onClose={() => setView('main')} />;
  if (view === 'staking') return <StakingScreen onClose={() => setView('main')} />;
  if (view === 'uid') return <UniversalIDScreen onClose={() => setView('main')} />;
  if (view === 'ledger') return <LivingLedgerScreen onClose={() => setView('main')} onSendGratitude={() => setView('gratitude')} />;
  if (view === 'gratitude') return <GratitudeScreen onClose={() => setView('main')} />;

  // ─── Main Settings ───

  const migrationServices = Object.entries(MOBILE_PROVIDERS_STATUS).map(([name, status]) => ({
    name, readiness: status.readiness, estimatedYear: status.estimatedYear,
  }));
  const totalReadiness = Math.round(
    migrationServices.reduce((sum, s) => sum + s.readiness, 0) / migrationServices.length
  );

  return (
    <SafeAreaView style={st.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll}>

        {/* Interface */}
        <Text style={st.section}>Interface</Text>
        <View style={st.card}>
          <View style={st.row}>
            <Text style={st.label}>Mode</Text>
            <View style={st.modeToggle}>
              {(['simple', 'pro'] as const).map((m) => (
                <TouchableOpacity key={m} style={[st.modeBtn, mode === m && st.modeBtnActive]} onPress={() => setMode(m)}>
                  <Text style={[st.modeBtnText, mode === m && st.modeBtnTextActive]}>{m === 'simple' ? 'Simple' : 'Pro'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={st.divider} />
          <View style={st.row}>
            <Text style={st.label}>Theme</Text>
            <View style={st.modeToggle}>
              {(['dark', 'light', 'system'] as const).map((m) => (
                <TouchableOpacity key={m} style={[st.modeBtn, themeMode === m && st.modeBtnActive]} onPress={() => setThemeMode(m)}>
                  <Text style={[st.modeBtnText, themeMode === m && st.modeBtnTextActive]}>
                    {m === 'dark' ? '🌙' : m === 'light' ? '☀️' : '⚙️'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={st.divider} />
          <View style={st.row}>
            <Text style={st.label}>Language</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxWidth: 200 }}>
              <View style={st.modeToggle}>
                {[
                  { code: 'en', label: 'EN' },
                  { code: 'hi', label: 'हिं' },
                  { code: 'es', label: 'ES' },
                  { code: 'zh', label: '中' },
                  { code: 'vi', label: 'VI' },
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
          </View>
          <View style={st.divider} />
          <View style={st.row}>
            <Text style={st.label}>Currency</Text>
            <View style={st.currencyRow}>
              {SUPPORTED_CURRENCIES.slice(0, 5).map((c) => (
                <TouchableOpacity key={c.code} style={[st.currencyChip, currency === c.code && st.currencyActive]} onPress={() => setCurrency(c.code)}>
                  <Text style={[st.currencyText, currency === c.code && st.currencyTextActive]}>{c.symbol}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={st.divider} />
          <TouchableOpacity style={st.row} onPress={() => setView('alerts')}>
            <Text style={st.label}>Price Alerts</Text>
            <Text style={st.value}>›</Text>
          </TouchableOpacity>
          <View style={st.divider} />
          <TouchableOpacity style={st.row} onPress={() => setView('hardware')}>
            <Text style={st.label}>Hardware Wallet</Text>
            <Text style={st.value}>Ledger · Trezor</Text>
          </TouchableOpacity>
          <View style={st.divider} />
          <TouchableOpacity style={st.row} onPress={() => setView('walletconnect')}>
            <Text style={st.label}>WalletConnect</Text>
            <Text style={st.value}>Connect to dApps</Text>
          </TouchableOpacity>
          <View style={st.divider} />
          <TouchableOpacity style={st.row} onPress={() => setView('staking')}>
            <Text style={st.label}>Staking</Text>
            <Text style={st.valueGreen}>5% APY</Text>
          </TouchableOpacity>
          <View style={st.divider} />
          <TouchableOpacity style={st.row} onPress={() => setView('contacts')}>
            <Text style={st.label}>Address Book</Text>
            <Text style={st.value}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Network */}
        <Text style={st.section}>Network</Text>
        <View style={st.card}>
          <View style={st.row}>
            <Text style={st.label}>Network</Text>
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
          </View>
          <View style={st.divider} />
          <View style={st.row}>
            <Text style={st.label}>Chains</Text>
            <Text style={st.value}>
              {networkMode === 'testnet' ? 'BTC Testnet · Sepolia · Devnet' : 'BTC · Ethereum · Solana'}
            </Text>
          </View>
        </View>

        {/* Security */}
        <Text style={st.section}>Security</Text>
        <View style={st.card}>
          <TouchableOpacity style={st.row} onPress={() => setView(pinConfigured ? 'change-pin' : 'new-pin')}>
            <Text style={st.label}>{pinConfigured ? 'Change PIN' : 'Set Up PIN'}</Text>
            <Text style={st.value}>{pinConfigured ? '••••••  ›' : 'Not set  ›'}</Text>
          </TouchableOpacity>
          <View style={st.divider} />
          {biometricAvailable && (
            <>
              <View style={st.row}>
                <Text style={st.label}>Biometric Unlock</Text>
                <Switch
                  value={biometricEnabled}
                  onValueChange={toggleBiometric}
                  trackColor={{ false: '#333', true: t.accent.green + '40' }}
                  thumbColor={biometricEnabled ? t.accent.green : '#666'}
                />
              </View>
              <View style={st.divider} />
            </>
          )}
          <View style={st.row}>
            <Text style={st.label}>Encryption</Text>
            <Text style={st.valueGreen}>AES-256-GCM + PBKDF2</Text>
          </View>
          <View style={st.divider} />
          <View style={st.row}>
            <Text style={st.label}>PQC Status</Text>
            <Text style={st.valueYellow}>Vault Ready • Chain Pending</Text>
          </View>
          <View style={st.divider} />
          <TouchableOpacity style={st.row} onPress={() => setView('backup')}>
            <Text style={st.label}>Backup / Recovery Phrase</Text>
            <Text style={st.value}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Network Migration */}
        <Text style={st.section}>Network Migration</Text>
        <View style={st.card}>
          <View style={st.row}>
            <Text style={st.label}>Progress</Text>
            <Text style={st.valueGreen}>{totalReadiness}% → Mobile P2P</Text>
          </View>
          <View style={st.progressBar}>
            <View style={[st.progressFill, { width: `${Math.max(totalReadiness, 2)}%` }]} />
          </View>
          {migrationServices.map((svc) => (
            <View key={svc.name} style={st.migrationRow}>
              <Text style={st.migrationName}>{svc.name.charAt(0).toUpperCase() + svc.name.slice(1)}</Text>
              <Text style={st.migrationYear}>~{svc.estimatedYear}</Text>
            </View>
          ))}
        </View>

        {/* Open Chain */}
        <Text style={st.section}>Open Chain</Text>
        <View style={st.card}>
          <TouchableOpacity style={st.row} onPress={() => setView('uid')}>
            <Text style={st.label}>Universal ID</Text>
            <Text style={st.valueGreen}>Register</Text>
          </TouchableOpacity>
          <View style={st.divider} />
          <TouchableOpacity style={st.row} onPress={() => setView('ledger')}>
            <Text style={st.label}>Living Ledger</Text>
            <Text style={st.value}>View</Text>
          </TouchableOpacity>
          <View style={st.divider} />
          <TouchableOpacity style={st.row} onPress={() => setView('gratitude')}>
            <Text style={st.label}>Send Gratitude</Text>
            <Text style={{ color: t.accent.purple, fontSize: 14 }}>Send</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <Text style={st.section}>About</Text>
        <View style={st.card}>
          <View style={st.row}>
            <Text style={st.label}>Version</Text>
            <Text style={st.value}>0.2.0-alpha</Text>
          </View>
          <View style={st.divider} />
          <TouchableOpacity style={st.row} onPress={() => Linking.openURL('https://github.com/bpupadhyaya/crypto')}>
            <Text style={st.label}>License</Text>
            <Text style={{ color: t.accent.green, fontSize: 14, fontWeight: '600' }}>MIT (Open Source)</Text>
          </TouchableOpacity>
          <View style={st.divider} />
          <TouchableOpacity style={st.row} onPress={() => Linking.openURL('https://github.com/bpupadhyaya/crypto')}>
            <Text style={st.label}>Source Code</Text>
            <Text style={{ color: t.accent.blue, fontSize: 14 }}>GitHub</Text>
          </TouchableOpacity>
          <View style={st.divider} />
          <TouchableOpacity style={st.row} onPress={() => Linking.openURL('https://github.com/bpupadhyaya/crypto/blob/main/docs/HUMAN_CONSTITUTION.md')}>
            <Text style={st.label}>Human Constitution</Text>
            <Text style={{ color: t.accent.blue, fontSize: 14 }}>Read</Text>
          </TouchableOpacity>
        </View>

        {/* Support the Mission */}
        <Text style={st.section}>Support the Mission</Text>
        <View style={[st.card, { padding: 20 }]}>
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

        {/* Sign Out */}
        <TouchableOpacity
          style={st.signOutBtn}
          onPress={() => Alert.alert('Sign Out', 'Lock your wallet?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: () => setStatus('locked') },
          ])}
        >
          <Text style={st.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
