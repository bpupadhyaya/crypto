import { fonts } from '../utils/theme';
/**
 * Help & FAQ Screen — Searchable accordion of help topics and FAQ.
 * Covers getting started, security, Open Chain, DeFi, P2P, and troubleshooting.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  SafeAreaView, TextInput, Linking,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface QA {
  question: string;
  answer: string;
}

interface HelpSection {
  title: string;
  items: QA[];
}

const HELP_DATA: HelpSection[] = [
  {
    title: 'Getting Started',
    items: [
      {
        question: 'How do I create a new wallet?',
        answer: 'Open the app and tap "Create Wallet". A seed phrase (12 or 24 words) will be generated. Write it down on paper and store it safely. You will be asked to verify it before proceeding.',
      },
      {
        question: 'How do I back up my wallet?',
        answer: 'Go to Settings > Backup / Recovery Phrase. You will need to enter your PIN to view your seed phrase. Write it down and store it in a secure, offline location. Never take a screenshot.',
      },
      {
        question: 'How do I restore a wallet from a seed phrase?',
        answer: 'On the welcome screen, tap "Import Wallet" and enter your 12 or 24 word seed phrase. Your wallet and balances will be restored automatically.',
      },
      {
        question: 'What chains does Open Wallet support?',
        answer: 'Bitcoin, Ethereum, Solana, Cosmos, and Open Chain (OTK). More chains are being added. You can use testnet or mainnet for all supported chains.',
      },
    ],
  },
  {
    title: 'Sending & Receiving',
    items: [
      {
        question: 'How do I send crypto?',
        answer: 'Tap the Send button on the home screen. Enter the recipient address (or scan a QR code), choose the token and amount, review the transaction details, then confirm.',
      },
      {
        question: 'How do I receive crypto?',
        answer: 'Tap the Receive button on the home screen. Your address and QR code will be displayed. Share the QR code or copy the address to receive funds.',
      },
      {
        question: 'What address formats are supported?',
        answer: 'Bitcoin (bc1, 1, 3 prefixes), Ethereum (0x prefix), Solana (base58), Cosmos (cosmos prefix), and Open Chain (otk prefix). The app validates addresses before sending.',
      },
      {
        question: 'How long do transactions take?',
        answer: 'Bitcoin: 10-60 minutes. Ethereum: 15 seconds to a few minutes. Solana: a few seconds. Cosmos: 6 seconds. Times vary with network congestion.',
      },
    ],
  },
  {
    title: 'Swapping & Bridging',
    items: [
      {
        question: 'How does token exchange work?',
        answer: 'Open Wallet supports atomic swaps (trustless, on-chain), DEX aggregation (best rates across liquidity pools), and order book trading. Go to the Swap tab to exchange any token.',
      },
      {
        question: 'What are the fees?',
        answer: 'Open Wallet charges zero platform fees. You only pay network gas fees and any DEX/liquidity pool fees (typically 0.1-0.3%). Atomic swaps only cost gas.',
      },
      {
        question: 'What is slippage?',
        answer: 'Slippage is the difference between the expected price and the actual execution price. You can set a slippage tolerance in swap settings. Default is 0.5%.',
      },
      {
        question: 'Can I swap across different blockchains?',
        answer: 'Yes. Cross-chain swaps use bridges or atomic swaps to exchange tokens between Bitcoin, Ethereum, Solana, Cosmos, and Open Chain.',
      },
    ],
  },
  {
    title: 'Security',
    items: [
      {
        question: 'How do I set up a PIN?',
        answer: 'Go to Settings > Set Up PIN. Choose a 6-digit PIN and confirm it. Your PIN is required to unlock the wallet, view your seed phrase, and confirm transactions.',
      },
      {
        question: 'Does Open Wallet support biometric unlock?',
        answer: 'Yes. If your device supports Face ID or fingerprint scanning, you can enable biometric unlock in Settings > Security after setting up a PIN.',
      },
      {
        question: 'What is paper trading and why is it required?',
        answer: 'Paper trading lets you practice with simulated funds before using real money. It is required before mainnet access — at least 1 successful paper trade (3 recommended). This protects new users from costly mistakes.',
      },
      {
        question: 'What is PQC (Post-Quantum Cryptography)?',
        answer: 'PQC protects your wallet against future quantum computer attacks. Open Wallet uses AES-256-GCM encryption with PBKDF2 key derivation, and is preparing PQC-ready signing for chain transactions.',
      },
      {
        question: 'Is my data collected or tracked?',
        answer: 'No. Open Wallet collects zero user data. There are no analytics, no tracking, no telemetry. Your keys and transactions stay on your device. Read our Privacy Policy for details.',
      },
    ],
  },
  {
    title: 'Open Chain',
    items: [
      {
        question: 'What is Open Token (OTK)?',
        answer: 'OTK is the native token of Open Chain. It uses Proof of Humanity + Proof of Contribution consensus: one human = one vote. No pre-mine, no founder allocation. You earn OTK by contributing value to the network.',
      },
      {
        question: 'What is Universal ID?',
        answer: 'Universal ID is a self-sovereign identity on Open Chain. It links your identity to your contributions without revealing personal information. One person, one ID, one vote.',
      },
      {
        question: 'How does the Gratitude system work?',
        answer: 'Send gratitude tokens to recognize people who have positively impacted your life — parents, teachers, mentors. These are tracked on the Living Ledger as a permanent record of human value.',
      },
      {
        question: 'How does governance work?',
        answer: 'OTK holders can propose and vote on network changes. One human = one vote (not one token = one vote). This ensures fair, democratic governance.',
      },
    ],
  },
  {
    title: 'DeFi',
    items: [
      {
        question: 'How does staking work?',
        answer: 'Stake your tokens to earn rewards. Go to Settings > Staking to see available staking options. Current APY varies by token and network conditions.',
      },
      {
        question: 'What are liquidity pools?',
        answer: 'Liquidity pools let you provide tokens for others to trade against. You earn a share of trading fees. Go to Settings > DeFi > Liquidity Pools to add or remove liquidity.',
      },
      {
        question: 'How does lending and borrowing work?',
        answer: 'Supply tokens to earn interest, or borrow against your holdings. Collateral ratios and interest rates are determined by market conditions. Go to Settings > DeFi > Lend & Borrow.',
      },
      {
        question: 'What is yield farming?',
        answer: 'Yield farming lets you earn additional OTK rewards by providing liquidity or participating in protocol incentive programs. Go to Settings > DeFi > Yield Farming.',
      },
    ],
  },
  {
    title: 'P2P Network',
    items: [
      {
        question: 'What is the P2P network?',
        answer: 'Open Wallet operates on a fully decentralized peer-to-peer network. There are no central servers. Your wallet communicates directly with other peers to broadcast transactions and sync data.',
      },
      {
        question: 'How do I connect to peers?',
        answer: 'Go to Settings > P2P Network. You can connect via QR code scanning (nearby peers), local network discovery, or internet relay nodes. The app automatically finds peers.',
      },
      {
        question: 'Can I use the wallet offline?',
        answer: 'You can view your balances and prepare transactions offline. Transactions will be broadcast when you reconnect. P2P sync resumes automatically.',
      },
      {
        question: 'How do I share my peer connection via QR?',
        answer: 'In Settings > P2P Network, tap "Share Connection". A QR code will be displayed that another Open Wallet user can scan to connect directly.',
      },
    ],
  },
  {
    title: 'Troubleshooting',
    items: [
      {
        question: 'My transaction is stuck or pending. What do I do?',
        answer: 'Check the transaction in History. For Ethereum, you may need to speed up or cancel with a higher gas fee. For Bitcoin, wait for confirmation or use RBF (Replace-By-Fee) if supported. Most transactions confirm within 30 minutes.',
      },
      {
        question: 'I sent to the wrong address. Can I get my funds back?',
        answer: 'Unfortunately, blockchain transactions are irreversible. Always double-check the recipient address before confirming. Use the Address Book to save frequently used addresses.',
      },
      {
        question: 'The app crashed. Did I lose my funds?',
        answer: 'No. Your funds are on the blockchain, not in the app. Reopen the app and your wallet will resync. If the app data is corrupted, restore from your seed phrase.',
      },
      {
        question: 'My balance shows zero but I have funds.',
        answer: 'Check your network setting (testnet vs mainnet). Make sure you are on the correct network. Pull down to refresh balances. If the issue persists, try restarting the app.',
      },
      {
        question: 'How do I report a bug or request a feature?',
        answer: 'Open a GitHub issue at https://github.com/bpupadhyaya/crypto/issues. Include your device type, OS version, and steps to reproduce the bug. Screenshots help.',
      },
    ],
  },
];

interface Props {
  onClose: () => void;
}

export function HelpScreen({ onClose }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const t = useTheme();

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
    },
    headerTitle: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.bold },
    closeBtn: { paddingVertical: 8, paddingHorizontal: 16 },
    closeText: { color: t.accent.blue, fontSize: fonts.md },
    searchContainer: {
      marginHorizontal: 16, marginTop: 8, marginBottom: 16,
      backgroundColor: t.bg.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    },
    searchInput: { color: t.text.primary, fontSize: fonts.md },
    scroll: { paddingHorizontal: 16, paddingBottom: 40 },
    sectionHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      backgroundColor: t.bg.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
      marginTop: 12,
    },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.semibold, flex: 1 },
    sectionArrow: { color: t.text.muted, fontSize: fonts.xl },
    questionRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: t.border,
    },
    questionText: { color: t.text.primary, fontSize: fonts.md, flex: 1, paddingRight: 8 },
    questionArrow: { color: t.text.muted, fontSize: fonts.md },
    answerContainer: {
      paddingHorizontal: 16, paddingVertical: 12,
      backgroundColor: t.bg.primary, borderBottomWidth: 1, borderBottomColor: t.border,
    },
    answerText: { color: t.text.secondary, fontSize: fonts.sm, lineHeight: 20 },
    linksContainer: {
      marginTop: 24, backgroundColor: t.bg.card, borderRadius: 12, padding: 16,
    },
    linksTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.semibold, marginBottom: 12 },
    linkRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingVertical: 12, borderTopWidth: 1, borderTopColor: t.border,
    },
    linkText: { color: t.accent.blue, fontSize: fonts.md },
    linkArrow: { color: t.text.muted, fontSize: fonts.md },
    noResults: { color: t.text.muted, fontSize: fonts.md, textAlign: 'center', marginTop: 40 },
  }), [t]);

  const toggleSection = useCallback((title: string) => {
    setExpandedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  }, []);

  const toggleQuestion = useCallback((key: string) => {
    setExpandedQuestions((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return HELP_DATA;
    const q = searchQuery.toLowerCase();
    return HELP_DATA.map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.question.toLowerCase().includes(q) ||
          item.answer.toLowerCase().includes(q)
      ),
    })).filter((section) => section.items.length > 0);
  }, [searchQuery]);

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.headerTitle}>Help & FAQ</Text>
        <TouchableOpacity style={st.closeBtn} onPress={onClose}>
          <Text style={st.closeText}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={st.searchContainer}>
        <TextInput
          style={st.searchInput}
          placeholder="Search help topics..."
          placeholderTextColor={t.text.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll}>
        {filteredData.length === 0 ? (
          <Text style={st.noResults}>No results found for "{searchQuery}"</Text>
        ) : (
          filteredData.map((section) => {
            const isExpanded = expandedSections[section.title] ?? (searchQuery.length > 0);
            return (
              <View key={section.title}>
                <TouchableOpacity style={st.sectionHeader} onPress={() => toggleSection(section.title)}>
                  <Text style={st.sectionTitle}>{section.title}</Text>
                  <Text style={st.sectionArrow}>{isExpanded ? '\u25B2' : '\u25BC'}</Text>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={{ backgroundColor: t.bg.card, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, marginTop: -4 }}>
                    {section.items.map((item, idx) => {
                      const qKey = `${section.title}-${idx}`;
                      const qExpanded = expandedQuestions[qKey] ?? false;
                      return (
                        <View key={qKey}>
                          <TouchableOpacity style={st.questionRow} onPress={() => toggleQuestion(qKey)}>
                            <Text style={st.questionText}>{item.question}</Text>
                            <Text style={st.questionArrow}>{qExpanded ? '-' : '+'}</Text>
                          </TouchableOpacity>
                          {qExpanded && (
                            <View style={st.answerContainer}>
                              <Text style={st.answerText}>{item.answer}</Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })
        )}

        {/* Support Links */}
        <View style={st.linksContainer}>
          <Text style={st.linksTitle}>Need More Help?</Text>
          <TouchableOpacity
            style={[st.linkRow, { borderTopWidth: 0 }]}
            onPress={() => Linking.openURL('https://github.com/bpupadhyaya/crypto/issues')}
          >
            <Text style={st.linkText}>Report a Bug / Request a Feature</Text>
            <Text style={st.linkArrow}>&rsaquo;</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={st.linkRow}
            onPress={() => Linking.openURL('https://github.com/bpupadhyaya/crypto')}
          >
            <Text style={st.linkText}>View Source Code on GitHub</Text>
            <Text style={st.linkArrow}>&rsaquo;</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={st.linkRow}
            onPress={() => Linking.openURL('https://bpupadhyaya.github.io/privacy-openwallet.html')}
          >
            <Text style={st.linkText}>Privacy Policy</Text>
            <Text style={st.linkArrow}>&rsaquo;</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
