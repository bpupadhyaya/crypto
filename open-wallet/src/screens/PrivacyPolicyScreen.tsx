import { fonts } from '../utils/theme';
/**
 * Privacy Policy Screen — Full in-app privacy policy text.
 *
 * Users can read the entire policy without network access.
 * External link also available for App Store requirements.
 */

import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Linking,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

const EXTERNAL_URL = 'https://bpupadhyaya.github.io/privacy-openwallet.html';

interface Props {
  onClose: () => void;
}

export function PrivacyPolicyScreen({ onClose }: Props) {
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingHorizontal: 24, paddingBottom: 40 },
    heading: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginTop: 24, marginBottom: 8 },
    body: { color: t.text.secondary, fontSize: 14, lineHeight: 22 },
    bullet: { color: t.text.secondary, fontSize: 14, lineHeight: 22, paddingLeft: 16, marginBottom: 4 },
    date: { color: t.text.muted, fontSize: 13, marginTop: 8, marginBottom: 16 },
    link: { color: t.accent.blue, fontSize: 14, textDecorationLine: 'underline' },
    externalBtn: { backgroundColor: t.accent.blue + '15', borderRadius: 12, padding: 16, marginTop: 24, alignItems: 'center' },
    externalText: { color: t.accent.blue, fontSize: 14, fontWeight: fonts.semibold },
  }), [t]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Privacy Policy</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.body}>
          Open Wallet is an open-source, non-custodial cryptocurrency wallet developed by Bhim Upadhyaya. This policy explains how the application handles your data.
        </Text>
        <Text style={s.date}>Effective Date: March 27, 2026</Text>

        <Text style={s.heading}>1. Non-Custodial Architecture</Text>
        <Text style={s.body}>
          Open Wallet is fully non-custodial. Your private keys, seed phrases, and wallet credentials are generated and stored exclusively on your device. They are never transmitted to any server, cloud service, or third party. If you lose your device and have not backed up your seed phrase, your funds cannot be recovered by anyone, including the developers.
        </Text>

        <Text style={s.heading}>2. Personal Data Collection</Text>
        <Text style={s.body}>
          Open Wallet does not collect, store, or transmit any personal data. There are no analytics, no usage tracking, no telemetry, no crash reporters, and no advertising SDKs. The application does not require an account, email address, or any form of registration.
        </Text>

        <Text style={s.heading}>3. Camera Access</Text>
        <Text style={s.body}>
          The application requests camera access solely for the purpose of scanning QR codes containing recipient wallet addresses. Camera data is processed locally on the device in real time and is never recorded, stored, or transmitted.
        </Text>

        <Text style={s.heading}>4. Biometric Authentication</Text>
        <Text style={s.body}>
          Open Wallet may use your device's biometric capabilities (Face ID, Touch ID, or fingerprint) for local authentication to unlock the wallet. Biometric data is processed entirely by your device's secure enclave. Open Wallet never accesses, stores, or transmits biometric data. The application only receives a success or failure response from the operating system.
        </Text>

        <Text style={s.heading}>5. Third-Party Services</Text>
        <Text style={s.body}>
          Open Wallet interacts with the following third-party services for specific features. Each service may have its own privacy policy:
        </Text>
        <Text style={s.bullet}>
          {'\u2022'} CoinGecko (coingecko.com) — Used to fetch cryptocurrency price data. No user-identifying information is sent; only token identifiers are included in API requests.
        </Text>
        <Text style={s.bullet}>
          {'\u2022'} Li.Fi (li.fi) — Used for cross-chain bridge quotes and routing on EVM chains. Bridge quote requests contain token and amount information but no personal data.
        </Text>
        <Text style={s.bullet}>
          {'\u2022'} THORChain (thorchain.org) — Used for native Bitcoin bridge swaps. Swap quote requests contain token and amount information but no personal data.
        </Text>
        <Text style={s.bullet}>
          {'\u2022'} On-Ramp Providers (MoonPay, Transak, Ramp) — If you choose to purchase cryptocurrency through one of these providers, you will interact with their service directly via an embedded web view. These providers require identity verification (KYC) under their own privacy policies. Open Wallet does not have access to the data you provide to these services.
        </Text>

        <Text style={s.heading}>6. Network Communication</Text>
        <Text style={s.body}>
          When you submit a transaction, the signed transaction data is broadcast to the relevant blockchain network via public RPC endpoints. This is inherent to how blockchains operate. Transaction data on public blockchains is permanently visible to anyone.
        </Text>

        <Text style={s.heading}>7. Local Storage</Text>
        <Text style={s.body}>
          Wallet data (encrypted vault, settings, paper trade history) is stored locally on your device using the operating system's secure storage mechanisms. This data is not synced to any cloud service.
        </Text>

        <Text style={s.heading}>8. Open Source</Text>
        <Text style={s.body}>
          Open Wallet is open source. You can audit the complete source code to verify these privacy claims:
        </Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://github.com/bpupadhyaya/crypto')}>
          <Text style={s.link}>github.com/bpupadhyaya/crypto</Text>
        </TouchableOpacity>

        <Text style={s.heading}>9. Children's Privacy</Text>
        <Text style={s.body}>
          Open Wallet is not directed at children under 17. The application involves financial transactions and is rated 17+ on app stores.
        </Text>

        <Text style={s.heading}>10. Changes to This Policy</Text>
        <Text style={s.body}>
          Any changes to this privacy policy will be published in the source code repository and reflected in updated app versions. The effective date at the top of this document will be updated accordingly.
        </Text>

        <Text style={s.heading}>11. Contact</Text>
        <Text style={s.body}>
          For questions about this privacy policy, please open an issue on the GitHub repository:
        </Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://github.com/bpupadhyaya/crypto/issues')}>
          <Text style={s.link}>github.com/bpupadhyaya/crypto/issues</Text>
        </TouchableOpacity>

        {/* External link */}
        <TouchableOpacity style={s.externalBtn} onPress={() => Linking.openURL(EXTERNAL_URL)}>
          <Text style={s.externalText}>View on Web</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
