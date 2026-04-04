import { fonts } from '../utils/theme';
/**
 * Simple Mode Home Screen — Icon-driven, accessible to anyone.
 *
 * "Simple Mode: Accessible to anyone — icon-driven, multilingual,
 *  works on 2G networks"
 * — Human Constitution, Article VII
 *
 * Design principles:
 *   - Large icons, no text required to understand actions
 *   - Very large balance font (readable by elderly)
 *   - Color-coded: green = receive, red/orange = send, blue = info
 *   - Minimal text, multilingual where text exists
 *   - No charts, no complicated data — just essentials
 */

import React, { useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';
import { usePortfolio } from '../hooks/useBalances';
import { useTranslation } from 'react-i18next';
import { GratitudeScreen } from './GratitudeScreen';
import { HelpScreen } from './HelpScreen';

interface Props {
  onSwitchToPro: () => void;
}

export function SimpleModeHomeScreen({ onSwitchToPro }: Props) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const addresses = useWalletStore((s) => s.addresses);
  const demoMode = useWalletStore((s) => s.demoMode);
  const networkMode = useWalletStore((s) => s.networkMode);
  const { totalUsdValue } = usePortfolio(addresses);

  const [activeView, setActiveView] = React.useState<'home' | 'gratitude' | 'help'>('home');

  const displayBalance = useMemo(() => {
    if (demoMode) return '$12,345.67';
    if (totalUsdValue <= 0) return '$0.00';
    return `$${totalUsdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [totalUsdValue, demoMode]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    testnetBanner: {
      backgroundColor: t.accent.yellow + '20', paddingVertical: 8,
      alignItems: 'center', marginHorizontal: 24, borderRadius: 12, marginTop: 12,
    },
    testnetText: { color: t.accent.yellow, fontSize: 14, fontWeight: fonts.bold, letterSpacing: 1 },
    balanceContainer: {
      alignItems: 'center', justifyContent: 'center',
      paddingVertical: 40, paddingHorizontal: 24,
    },
    balanceLabel: {
      color: t.text.muted, fontSize: 16, fontWeight: fonts.medium,
      marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1,
    },
    balanceValue: {
      color: t.text.primary, fontSize: 56, fontWeight: fonts.heavy,
      letterSpacing: -1,
    },
    actionsGrid: {
      flexDirection: 'row', flexWrap: 'wrap',
      justifyContent: 'center', alignItems: 'center',
      paddingHorizontal: 24, gap: 20,
      marginTop: 20,
    },
    actionButton: {
      width: 120, height: 120, borderRadius: 28,
      justifyContent: 'center', alignItems: 'center',
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
    },
    actionIcon: { fontSize: 48, marginBottom: 4 },
    actionLabel: { fontSize: 14, fontWeight: fonts.bold, marginTop: 4 },
    switchModeBtn: {
      alignSelf: 'center', marginTop: 40,
      paddingVertical: 12, paddingHorizontal: 24,
      borderRadius: 12, backgroundColor: t.border,
    },
    switchModeText: { color: t.text.secondary, fontSize: 14, fontWeight: fonts.semibold },
  }), [t]);

  const handleSend = useCallback(() => {
    // In Simple Mode, send is a placeholder — will navigate to a simplified send flow
  }, []);

  const handleReceive = useCallback(() => {
    // In Simple Mode, receive shows QR code for the primary address
  }, []);

  if (activeView === 'gratitude') {
    return <GratitudeScreen onClose={() => setActiveView('home')} />;
  }
  if (activeView === 'help') {
    return <HelpScreen onClose={() => setActiveView('home')} />;
  }

  return (
    <SafeAreaView style={s.container}>
      {/* Testnet / Demo banners */}
      {networkMode === 'testnet' && (
        <View style={s.testnetBanner}>
          <Text style={s.testnetText}>TESTNET</Text>
        </View>
      )}
      {demoMode && (
        <View style={[s.testnetBanner, { backgroundColor: t.accent.purple + '20' }]}>
          <Text style={[s.testnetText, { color: t.accent.purple }]}>DEMO</Text>
        </View>
      )}

      {/* Balance — very large */}
      <View style={s.balanceContainer}>
        <Text style={s.balanceLabel}>{tr('balance', 'My Balance')}</Text>
        <Text style={s.balanceValue} adjustsFontSizeToFit numberOfLines={1}>
          {displayBalance}
        </Text>
      </View>

      {/* Action buttons — large, icon-driven, color-coded */}
      <View style={s.actionsGrid}>
        {/* Send — orange/red arrow up */}
        <TouchableOpacity
          style={[s.actionButton, { backgroundColor: t.accent.orange + '25' }]}
          onPress={handleSend}
          activeOpacity={0.7}
          accessibilityLabel={tr('send', 'Send')}
          accessibilityRole="button"
        >
          <Text style={s.actionIcon}>{'\u2B06\uFE0F'}</Text>
          <Text style={[s.actionLabel, { color: t.accent.orange }]}>{tr('send', 'Send')}</Text>
        </TouchableOpacity>

        {/* Receive — green arrow down */}
        <TouchableOpacity
          style={[s.actionButton, { backgroundColor: t.accent.green + '25' }]}
          onPress={handleReceive}
          activeOpacity={0.7}
          accessibilityLabel={tr('receive', 'Receive')}
          accessibilityRole="button"
        >
          <Text style={s.actionIcon}>{'\u2B07\uFE0F'}</Text>
          <Text style={[s.actionLabel, { color: t.accent.green }]}>{tr('receive', 'Receive')}</Text>
        </TouchableOpacity>

        {/* Gratitude — purple heart */}
        <TouchableOpacity
          style={[s.actionButton, { backgroundColor: t.accent.purple + '25' }]}
          onPress={() => setActiveView('gratitude')}
          activeOpacity={0.7}
          accessibilityLabel={tr('gratitude', 'Gratitude')}
          accessibilityRole="button"
        >
          <Text style={s.actionIcon}>{'\u2764\uFE0F'}</Text>
          <Text style={[s.actionLabel, { color: t.accent.purple }]}>{tr('gratitude', 'Gratitude')}</Text>
        </TouchableOpacity>

        {/* Help — blue question mark */}
        <TouchableOpacity
          style={[s.actionButton, { backgroundColor: t.accent.blue + '25' }]}
          onPress={() => setActiveView('help')}
          activeOpacity={0.7}
          accessibilityLabel={tr('help', 'Help')}
          accessibilityRole="button"
        >
          <Text style={s.actionIcon}>{'\u2753'}</Text>
          <Text style={[s.actionLabel, { color: t.accent.blue }]}>{tr('help', 'Help')}</Text>
        </TouchableOpacity>
      </View>

      {/* Toggle to Pro mode */}
      <TouchableOpacity style={s.switchModeBtn} onPress={onSwitchToPro} activeOpacity={0.7}>
        <Text style={s.switchModeText}>{tr('switchToPro', 'Switch to Pro Mode')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
