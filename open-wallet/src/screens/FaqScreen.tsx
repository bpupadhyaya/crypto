import { fonts } from '../utils/theme';
/**
 * FAQ Screen — Frequently asked questions organized by category.
 *
 * Covers general, wallet, chain, and OTK topics with expandable
 * question/answer cards for easy browsing.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// --- Types ---

type Tab = 'general' | 'wallet' | 'chain' | 'otk';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

// --- Demo data ---

const FAQ_DATA: Record<Tab, FaqItem[]> = {
  general: [
    { id: 'g1', question: 'What is Open Wallet?', answer: 'Open Wallet is a free, open-source multi-chain cryptocurrency wallet that supports Bitcoin, Ethereum, Solana, Polygon, and Open Chain. It is built with the mission of maintaining and improving human life at near-zero cost.' },
    { id: 'g2', question: 'Is Open Wallet free to use?', answer: 'Yes, completely free. There are no subscription fees, hidden charges, or premium tiers. The code is open-source and auditable by anyone.' },
    { id: 'g3', question: 'How is my data protected?', answer: 'All sensitive data is encrypted using post-quantum cryptography (PQC). Your seed phrase never leaves your device, and all network connections use TLS 1.3 encryption.' },
    { id: 'g4', question: 'What devices are supported?', answer: 'Open Wallet is designed mobile-first for iOS and Android. Desktop and web versions are planned for future releases.' },
    { id: 'g5', question: 'Who is behind Open Wallet?', answer: 'Open Wallet is an open-source project driven by the mission of maintaining and improving human life at near-zero cost. All development is transparent and community-driven.' },
    { id: 'g6', question: 'How can I contribute?', answer: 'You can contribute by testing, reporting bugs, suggesting features, or joining as an ambassador. Visit the Feedback screen or the Ambassador program to get started.' },
  ],
  wallet: [
    { id: 'w1', question: 'How do I back up my wallet?', answer: 'During wallet creation, you receive a 24-word seed phrase. Write it down on paper and store it securely offline. Never share it digitally or with anyone.' },
    { id: 'w2', question: 'What is paper trading mode?', answer: 'Paper trading lets you practice transactions with simulated funds before using real money. We require at least 1 paper trade session (recommend 3) before enabling real transactions.' },
    { id: 'w3', question: 'How do atomic swaps work?', answer: 'Atomic swaps enable trustless cross-chain exchanges directly between your wallets without intermediaries. They use hash time-locked contracts to ensure both parties complete the trade or it is cancelled.' },
    { id: 'w4', question: 'Can I connect a hardware wallet?', answer: 'Hardware wallet support is coming in Q2 2026, including Solana Saga seed vault integration and external hardware signers.' },
  ],
  chain: [
    { id: 'c1', question: 'What is Open Chain?', answer: 'Open Chain is a blockchain designed to model all human value transfer — from raising children and education to community building. It uses Proof of Humanity + Proof of Contribution consensus.' },
    { id: 'c2', question: 'What is the Human Constitution?', answer: 'The Human Constitution is a set of universal principles embedded in Open Chain that guide how value is recognized and rewarded. It emphasizes human dignity, equal opportunity, and collective well-being.' },
    { id: 'c3', question: 'How does consensus work?', answer: 'Open Chain uses PoH (Proof of Humanity) ensuring one human = one vote, combined with PoC (Proof of Contribution) where you earn by contributing to society. There is no pre-mining and rewards are flat.' },
    { id: 'c4', question: 'What is Universal ID?', answer: 'Universal ID is a biometric-verified on-chain identity system ensuring one person has exactly one identity. It prevents sybil attacks and ensures fair participation in governance.' },
  ],
  otk: [
    { id: 'o1', question: 'What is OTK?', answer: 'OTK (Open Token) is the native token of Open Chain. Unlike traditional crypto, OTK represents quantified human value — contributions to nurture, education, health, community, governance, and economics.' },
    { id: 'o2', question: 'What is nOTK?', answer: 'nOTK (Nurture OTK) specifically tracks nurture value — the care, emotional support, and guidance provided to children and dependents. It is the heart of the Open Chain value system.' },
    { id: 'o3', question: 'How are OTK tokens minted?', answer: 'OTK tokens are minted when verified human contributions are recorded across the six channels: nurture, education, health, community, governance, and economic. Each channel has its own verification process.' },
    { id: 'o4', question: 'Can OTK be traded for money?', answer: 'OTK carries non-monetary human value. While it can be exchanged on the network, its primary purpose is recognizing and rewarding real human contributions, not financial speculation.' },
    { id: 'o5', question: 'How is OTK different from other tokens?', answer: 'Unlike Bitcoin or Ethereum, OTK has no pre-mine, no ICO, and flat rewards. Every person earns equally for equal contribution. One human equals one vote in governance decisions.' },
    { id: 'o6', question: 'What are soulbound achievements?', answer: 'Soulbound achievements are non-transferable NFTs permanently bound to your Universal ID. They represent verified milestones like mentoring students or community building, and cannot be bought or sold.' },
  ],
};

const TAB_ICONS: Record<Tab, string> = {
  general: '\u2139\uFE0F', wallet: '\u{1F4B0}', chain: '\u26D3\uFE0F', otk: '\u{1FA99}',
};

// --- Component ---

interface Props {
  onClose: () => void;
}

export function FaqScreen({ onClose }: Props) {
  const t = useTheme();
  const walletStore = useWalletStore();
  const [tab, setTab] = useState<Tab>('general');
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = useCallback((id: string) => {
    setExpanded(prev => prev === id ? null : id);
  }, []);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'general', label: 'General' },
    { key: 'wallet', label: 'Wallet' },
    { key: 'chain', label: 'Chain' },
    { key: 'otk', label: 'OTK' },
  ];

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    headerTitle: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.bold },
    closeText: { color: t.accent.blue, fontSize: fonts.lg },
    tabRow: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: 10,
      backgroundColor: t.bg.card,
      overflow: 'hidden',
    },
    tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
    tabBtnActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    scroll: { paddingHorizontal: 16, paddingBottom: 40 },
    section: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 8, marginBottom: 12 },
    faqCard: { backgroundColor: t.bg.card, borderRadius: 14, marginBottom: 10, overflow: 'hidden' },
    faqHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    faqIcon: { fontSize: fonts.lg, marginRight: 10 },
    faqQuestion: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold, flex: 1 },
    faqArrow: { color: t.text.muted, fontSize: fonts.lg, fontWeight: fonts.bold },
    faqAnswer: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 0 },
    faqAnswerText: { color: t.text.secondary, fontSize: fonts.sm, lineHeight: 20 },
    divider: { height: 1, backgroundColor: t.border, marginHorizontal: 16 },
    countBadge: { color: t.text.muted, fontSize: fonts.xs, textAlign: 'center', marginBottom: 12 },
  }), [t]);

  const questions = FAQ_DATA[tab];

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.headerTitle}>FAQ</Text>
        <TouchableOpacity onPress={onClose}><Text style={st.closeText}>Back</Text></TouchableOpacity>
      </View>

      <View style={st.tabRow}>
        {tabs.map(tb => (
          <TouchableOpacity key={tb.key} style={[st.tabBtn, tab === tb.key && st.tabBtnActive]} onPress={() => { setTab(tb.key); setExpanded(null); }}>
            <Text style={[st.tabText, tab === tb.key && st.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll}>
        <Text style={st.section}>{TAB_ICONS[tab]} {tab.charAt(0).toUpperCase() + tab.slice(1)} Questions</Text>
        <Text style={st.countBadge}>{questions.length} questions</Text>

        {questions.map(faq => (
          <View key={faq.id} style={st.faqCard}>
            <TouchableOpacity style={st.faqHeader} onPress={() => toggle(faq.id)} activeOpacity={0.7}>
              <Text style={st.faqIcon}>{TAB_ICONS[tab]}</Text>
              <Text style={st.faqQuestion}>{faq.question}</Text>
              <Text style={st.faqArrow}>{expanded === faq.id ? '\u25B2' : '\u25BC'}</Text>
            </TouchableOpacity>
            {expanded === faq.id && (
              <>
                <View style={st.divider} />
                <View style={st.faqAnswer}>
                  <Text style={st.faqAnswerText}>{faq.answer}</Text>
                </View>
              </>
            )}
          </View>
        ))}

        {/* Help note */}
        <View style={{
          backgroundColor: t.accent.blue + '15',
          borderRadius: 14,
          padding: 16,
          marginTop: 12,
        }}>
          <Text style={{
            color: t.accent.blue,
            fontSize: fonts.sm,
            fontWeight: fonts.bold,
            marginBottom: 4,
          }}>
            Still have questions?
          </Text>
          <Text style={{
            color: t.text.secondary,
            fontSize: fonts.sm,
            lineHeight: 18,
          }}>
            Visit our community forum or submit feedback through the Feedback screen. We respond to every question within 48 hours.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
