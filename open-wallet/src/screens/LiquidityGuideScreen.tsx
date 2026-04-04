import { fonts } from '../utils/theme';
/**
 * Liquidity Guide Screen (xOTK) — Educational guide for liquidity provision.
 *
 * Tabs: Learn, Calculator, Strategies, Glossary.
 * Learn: What is LP, impermanent loss explained, step-by-step guide.
 * Calculator: Interactive IL calculator with token inputs.
 * Strategies: Stable pairs, volatile pairs, concentrated liquidity.
 * Glossary: AMM, LP tokens, slippage, TVL, APR vs APY.
 * Demo mode provides realistic sample calculations.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

type Tab = 'learn' | 'calculator' | 'strategies' | 'glossary';

interface GlossaryEntry {
  term: string;
  definition: string;
}

interface Strategy {
  name: string;
  risk: 'Low' | 'Medium' | 'High';
  description: string;
  bestFor: string;
  examplePair: string;
  expectedApy: string;
}

const GLOSSARY: GlossaryEntry[] = [
  { term: 'AMM (Automated Market Maker)', definition: 'A smart contract that holds reserves of two or more tokens and allows anyone to trade against those reserves. Prices are determined algorithmically by the ratio of tokens in the pool, not by order books.' },
  { term: 'LP Tokens', definition: 'Tokens you receive when you deposit liquidity into a pool. They represent your share of the pool and can be redeemed for your portion of the pooled assets plus any earned fees.' },
  { term: 'Slippage', definition: 'The difference between the expected price of a trade and the actual executed price. Larger trades relative to pool size cause more slippage. Set a slippage tolerance to protect against unfavorable price movements.' },
  { term: 'TVL (Total Value Locked)', definition: 'The total dollar value of all assets deposited in a liquidity pool or DeFi protocol. Higher TVL generally means lower slippage and more stable pricing for traders.' },
  { term: 'APR vs APY', definition: 'APR (Annual Percentage Rate) is the simple interest rate over a year. APY (Annual Percentage Yield) includes compound interest. APY is always >= APR. A 100% APR compounded daily = ~171.5% APY.' },
];

const STRATEGIES: Strategy[] = [
  {
    name: 'Stable Pair Farming',
    risk: 'Low',
    description: 'Provide liquidity to pairs of assets that maintain similar values (e.g., USDT/USDC). Impermanent loss is minimal because prices rarely diverge significantly.',
    bestFor: 'Conservative LPs seeking steady yield with minimal IL risk',
    examplePair: 'USDT / USDC',
    expectedApy: '8-25%',
  },
  {
    name: 'Blue-Chip Volatile Pairs',
    risk: 'Medium',
    description: 'Pair a major asset with a stablecoin (e.g., OTK/USDT). Higher fees from trading volume, but you face impermanent loss if OTK price moves significantly.',
    bestFor: 'LPs who believe in the long-term value of the volatile asset',
    examplePair: 'OTK / USDT',
    expectedApy: '40-150%',
  },
  {
    name: 'Concentrated Liquidity',
    risk: 'High',
    description: 'Instead of spreading liquidity across the entire price range, you concentrate it in a narrow band. Earns much higher fees when price stays in range, but IL is amplified if price moves out.',
    bestFor: 'Active managers who can monitor and adjust positions',
    examplePair: 'OTK / ETH (range: $0.008 - $0.015)',
    expectedApy: '100-500%+',
  },
];

const LEARN_SECTIONS = [
  {
    title: 'What is Liquidity Provision?',
    content: `When you provide liquidity, you deposit two tokens into a pool. Traders swap against your pool and pay fees — you earn a share of those fees proportional to your pool share.

  [Pool Diagram]
  You deposit:  100 OTK + 1 USDT
        |
        v
  +-----------------+
  | OTK/USDT Pool   |
  | TVL: $2.45M     |
  | Your share: 0.05% |
  +-----------------+
        |
  Traders swap OTK <-> USDT
  You earn 0.05% of every swap fee`,
  },
  {
    title: 'Impermanent Loss Explained',
    content: `Impermanent Loss (IL) occurs when the price ratio of your deposited tokens changes compared to when you deposited.

  If OTK price doubles:
  - Held separately: $200 worth
  - In LP pool:      $183 worth (8.5% IL)

  Price Change  |  IL
  -------------|------
  1.25x        |  0.6%
  1.50x        |  2.0%
  2.00x        |  5.7%
  3.00x        |  13.4%
  5.00x        |  25.5%

  Key insight: IL is only realized when you withdraw. If you earn enough fees over time, they can offset the IL.`,
  },
  {
    title: 'How to Provide Liquidity on Open Chain DEX',
    content: `Step 1: Choose a Pool
  Go to Liquidity Pools and find a pair (e.g., OTK/USDT).

Step 2: Check the Numbers
  Look at TVL (higher = more stable), APY, and 24h volume.

Step 3: Deposit Both Tokens
  You must deposit equal dollar value of both tokens.
  Example: 100 OTK ($1.00) + 1.00 USDT

Step 4: Receive LP Tokens
  You get LP tokens representing your pool share.

Step 5: Earn Fees
  Every trade in the pool generates fees for you.

Step 6: Withdraw Anytime
  Redeem LP tokens for your share of the pool.
  You get back both tokens at current ratio.`,
  },
];

// IL Calculator formula: IL = 2 * sqrt(priceRatio) / (1 + priceRatio) - 1
function calculateIL(priceChangePercent: number): number {
  const priceRatio = 1 + priceChangePercent / 100;
  if (priceRatio <= 0) return 0;
  const il = 2 * Math.sqrt(priceRatio) / (1 + priceRatio) - 1;
  return Math.abs(il) * 100;
}

function getRiskColor(risk: 'Low' | 'Medium' | 'High', accent: { green: string; yellow: string; red: string }): string {
  if (risk === 'Low') return accent.green;
  if (risk === 'Medium') return accent.yellow;
  return accent.red;
}

export function LiquidityGuideScreen({ onClose }: Props) {
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const [tab, setTab] = useState<Tab>('learn');
  const [priceChange, setPriceChange] = useState('100');
  const [depositAmount, setDepositAmount] = useState('1000');
  const [feesEarned, setFeesEarned] = useState('50');

  const ilPercent = useMemo(() => {
    const pct = parseFloat(priceChange) || 0;
    return calculateIL(pct);
  }, [priceChange]);

  const ilDollar = useMemo(() => {
    const deposit = parseFloat(depositAmount) || 0;
    return deposit * (ilPercent / 100);
  }, [depositAmount, ilPercent]);

  const netResult = useMemo(() => {
    const fees = parseFloat(feesEarned) || 0;
    return fees - ilDollar;
  }, [feesEarned, ilDollar]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    tabs: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.green },
    tabInactive: { backgroundColor: t.bg.card },
    tabText: { fontSize: 13, fontWeight: fonts.bold },
    tabTextActive: { color: t.bg.primary },
    tabTextInactive: { color: t.text.muted },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginBottom: 16 },
    cardTitle: { color: t.text.secondary, fontSize: 14, fontWeight: fonts.heavy, marginBottom: 12 },
    cardBody: { color: t.text.primary, fontSize: 13, lineHeight: 20 },
    sectionHeader: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, marginTop: 8 },
    // Calculator
    calcCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginBottom: 16 },
    calcLabel: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
    calcInput: { backgroundColor: t.bg.primary, color: t.text.primary, fontSize: 18, fontWeight: fonts.bold, padding: 14, borderRadius: 12, marginBottom: 16 },
    calcResult: { alignItems: 'center', paddingVertical: 16, borderTopWidth: 1, borderTopColor: t.border },
    calcResultLabel: { color: t.text.muted, fontSize: 12, marginBottom: 4 },
    calcResultValue: { fontSize: 28, fontWeight: fonts.heavy },
    calcResultGreen: { color: t.accent.green },
    calcResultRed: { color: t.accent.red },
    calcDivider: { height: 1, backgroundColor: t.border, marginVertical: 12 },
    calcRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    calcRowLabel: { color: t.text.muted, fontSize: 13 },
    calcRowValue: { color: t.text.primary, fontSize: 13, fontWeight: fonts.semibold },
    // Strategies
    strategyCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginBottom: 16 },
    strategyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    strategyName: { color: t.text.primary, fontSize: 16, fontWeight: fonts.heavy, flex: 1 },
    riskBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    riskText: { fontSize: 11, fontWeight: fonts.heavy, color: t.bg.primary },
    strategyDesc: { color: t.text.primary, fontSize: 13, lineHeight: 20, marginBottom: 12 },
    strategyMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    strategyMetaLabel: { color: t.text.muted, fontSize: 12 },
    strategyMetaValue: { color: t.text.primary, fontSize: 12, fontWeight: fonts.semibold },
    // Glossary
    glossaryCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginBottom: 12 },
    glossaryTerm: { color: t.accent.green, fontSize: 15, fontWeight: fonts.heavy, marginBottom: 8 },
    glossaryDef: { color: t.text.primary, fontSize: 13, lineHeight: 20 },
    // Quick IL table in calculator
    tableRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: t.border },
    tableHeader: { fontWeight: fonts.heavy },
    tableCell: { flex: 1, color: t.text.primary, fontSize: 12, textAlign: 'center' },
    tableCellMuted: { flex: 1, color: t.text.muted, fontSize: 12, textAlign: 'center' },
    demoBanner: { backgroundColor: t.accent.blue + '20', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, marginBottom: 12 },
    demoBannerText: { color: t.accent.blue, fontSize: 12, fontWeight: fonts.semibold, textAlign: 'center' },
  }), [t]);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'learn', label: 'Learn' },
    { key: 'calculator', label: 'IL Calc' },
    { key: 'strategies', label: 'Strategies' },
    { key: 'glossary', label: 'Glossary' },
  ];

  const ilPresets = [
    { change: '25%', il: '0.6%' },
    { change: '50%', il: '2.0%' },
    { change: '100%', il: '5.7%' },
    { change: '200%', il: '13.4%' },
    { change: '400%', il: '25.5%' },
  ];

  const renderLearn = useCallback(() => (
    <>
      {demoMode && (
        <View style={s.demoBanner}>
          <Text style={s.demoBannerText}>Demo Mode — Educational content with sample calculations</Text>
        </View>
      )}
      {LEARN_SECTIONS.map((section, i) => (
        <View key={i} style={s.card}>
          <Text style={s.cardTitle}>{section.title}</Text>
          <Text style={s.cardBody}>{section.content}</Text>
        </View>
      ))}
    </>
  ), [demoMode, s]);

  const renderCalculator = useCallback(() => (
    <>
      <View style={s.calcCard}>
        <Text style={s.sectionHeader}>Impermanent Loss Calculator</Text>

        <Text style={s.calcLabel}>Deposit Amount ($)</Text>
        <TextInput
          style={s.calcInput}
          value={depositAmount}
          onChangeText={setDepositAmount}
          keyboardType="numeric"
          placeholder="1000"
          placeholderTextColor={t.text.muted}
        />

        <Text style={s.calcLabel}>Price Change (%)</Text>
        <TextInput
          style={s.calcInput}
          value={priceChange}
          onChangeText={setPriceChange}
          keyboardType="numeric"
          placeholder="100"
          placeholderTextColor={t.text.muted}
        />

        <Text style={s.calcLabel}>Fees Earned ($)</Text>
        <TextInput
          style={s.calcInput}
          value={feesEarned}
          onChangeText={setFeesEarned}
          keyboardType="numeric"
          placeholder="50"
          placeholderTextColor={t.text.muted}
        />

        <View style={s.calcResult}>
          <Text style={s.calcResultLabel}>Impermanent Loss</Text>
          <Text style={[s.calcResultValue, s.calcResultRed]}>
            -{ilPercent.toFixed(2)}% (${ilDollar.toFixed(2)})
          </Text>
        </View>

        <View style={s.calcDivider} />

        <View style={s.calcRow}>
          <Text style={s.calcRowLabel}>Fees earned</Text>
          <Text style={s.calcRowValue}>+${parseFloat(feesEarned || '0').toFixed(2)}</Text>
        </View>
        <View style={s.calcRow}>
          <Text style={s.calcRowLabel}>Impermanent loss</Text>
          <Text style={[s.calcRowValue, { color: t.accent.red }]}>-${ilDollar.toFixed(2)}</Text>
        </View>
        <View style={s.calcDivider} />
        <View style={s.calcResult}>
          <Text style={s.calcResultLabel}>Net Result</Text>
          <Text style={[s.calcResultValue, netResult >= 0 ? s.calcResultGreen : s.calcResultRed]}>
            {netResult >= 0 ? '+' : ''}${netResult.toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Quick IL Reference Table</Text>
        <View style={s.tableRow}>
          <Text style={[s.tableCell, s.tableHeader]}>Price Change</Text>
          <Text style={[s.tableCell, s.tableHeader]}>IL %</Text>
        </View>
        {ilPresets.map((row, i) => (
          <View key={i} style={s.tableRow}>
            <Text style={s.tableCellMuted}>{row.change}</Text>
            <Text style={s.tableCell}>{row.il}</Text>
          </View>
        ))}
      </View>
    </>
  ), [depositAmount, priceChange, feesEarned, ilPercent, ilDollar, netResult, s, t]);

  const renderStrategies = useCallback(() => (
    <>
      {STRATEGIES.map((strat, i) => (
        <View key={i} style={s.strategyCard}>
          <View style={s.strategyHeader}>
            <Text style={s.strategyName}>{strat.name}</Text>
            <View style={[s.riskBadge, { backgroundColor: getRiskColor(strat.risk, t.accent) }]}>
              <Text style={s.riskText}>{strat.risk} Risk</Text>
            </View>
          </View>
          <Text style={s.strategyDesc}>{strat.description}</Text>
          <View style={s.strategyMeta}>
            <Text style={s.strategyMetaLabel}>Best for</Text>
            <Text style={s.strategyMetaValue}>{strat.bestFor}</Text>
          </View>
          <View style={s.strategyMeta}>
            <Text style={s.strategyMetaLabel}>Example pair</Text>
            <Text style={s.strategyMetaValue}>{strat.examplePair}</Text>
          </View>
          <View style={s.strategyMeta}>
            <Text style={s.strategyMetaLabel}>Expected APY</Text>
            <Text style={[s.strategyMetaValue, { color: t.accent.green }]}>{strat.expectedApy}</Text>
          </View>
        </View>
      ))}
    </>
  ), [s, t]);

  const renderGlossary = useCallback(() => (
    <>
      {GLOSSARY.map((entry, i) => (
        <View key={i} style={s.glossaryCard}>
          <Text style={s.glossaryTerm}>{entry.term}</Text>
          <Text style={s.glossaryDef}>{entry.definition}</Text>
        </View>
      ))}
    </>
  ), [s]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Liquidity Guide</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={s.tabs}>
        {TABS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[s.tab, tab === item.key ? s.tabActive : s.tabInactive]}
            onPress={() => setTab(item.key)}
          >
            <Text style={[s.tabText, tab === item.key ? s.tabTextActive : s.tabTextInactive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {tab === 'learn' && renderLearn()}
        {tab === 'calculator' && renderCalculator()}
        {tab === 'strategies' && renderStrategies()}
        {tab === 'glossary' && renderGlossary()}
      </ScrollView>
    </SafeAreaView>
  );
}
