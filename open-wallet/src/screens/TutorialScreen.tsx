import { fonts } from '../utils/theme';
/**
 * Tutorial Screen — Interactive step-by-step onboarding for new users.
 * 8 swipeable tutorial cards introducing Open Wallet features.
 * Shows on first launch, re-accessible from Settings > About > Tutorial.
 */

import React, { useState, useRef, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  Dimensions, FlatList, type ViewToken,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../hooks/useTheme';

const TUTORIAL_COMPLETED_KEY = 'tutorialCompleted';

interface TutorialStep {
  icon: string;
  title: string;
  description: string;
}

const STEPS: TutorialStep[] = [
  {
    icon: '\uD83D\uDD10',
    title: 'Welcome to Open Wallet',
    description:
      'Your self-custody crypto wallet — 100% open source, no tracking, no ads, no VC funding. You own your keys, you own your money. Built for humanity, not profit.',
  },
  {
    icon: '\uD83D\uDDD1\uFE0F',
    title: 'Your Seed Phrase',
    description:
      'Your seed phrase is the master key to your wallet. Write it down and store it safely offline. Never share it with anyone — not even us. If you lose it, your funds are gone forever.',
  },
  {
    icon: '\u2194\uFE0F',
    title: 'Send & Receive',
    description:
      'Send crypto to any address or scan a QR code. Share your address or QR to receive funds. Supports Bitcoin, Ethereum, Solana, Cosmos, and more.',
  },
  {
    icon: '\uD83D\uDD04',
    title: 'Swap & Exchange',
    description:
      'Exchange any token for any other token — across chains. Atomic swaps, DEX aggregation, and order book trading. Find the best rates automatically.',
  },
  {
    icon: '\uD83C\uDFAE',
    title: 'Demo Mode',
    description:
      'Try everything safely with simulated balances. No real funds are used. Toggle Demo Mode in Settings to explore all features risk-free before going live.',
  },
  {
    icon: '\uD83D\uDCDD',
    title: 'Paper Trading',
    description:
      'Practice trading with virtual money before risking real funds. Paper trading is required before mainnet access — at least 1 successful trade, 3 recommended. Your safety matters.',
  },
  {
    icon: '\u26D3\uFE0F',
    title: 'Open Chain & OTK',
    description:
      'Open Token (OTK) runs on Open Chain — a human-centered blockchain where one human equals one vote. Earn by contributing, not mining. Every parent, teacher, and caregiver gets valued.',
  },
  {
    icon: '\uD83C\uDF10',
    title: 'P2P Network',
    description:
      'Fully decentralized — no central servers. Connect directly with peers via QR codes, local network, or the internet. Your wallet works even when the cloud is down.',
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  onClose: () => void;
}

export function TutorialScreen({ onClose }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const flatListRef = useRef<FlatList<TutorialStep>>(null);
  const t = useTheme();

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
    },
    stepIndicator: { color: t.text.muted, fontSize: 14 },
    skipBtn: { paddingVertical: 8, paddingHorizontal: 16 },
    skipText: { color: t.accent.blue, fontSize: 15 },
    card: {
      width: SCREEN_WIDTH - 40, marginHorizontal: 20, flex: 1,
      justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24,
    },
    icon: { fontSize: 72, marginBottom: 24 },
    title: { color: t.text.primary, fontSize: 24, fontWeight: fonts.bold, textAlign: 'center', marginBottom: 16 },
    description: { color: t.text.secondary, fontSize: 16, lineHeight: 24, textAlign: 'center' },
    footer: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 20, paddingBottom: 40, paddingTop: 16,
    },
    dots: { flexDirection: 'row', gap: 8 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: t.border },
    dotActive: { backgroundColor: t.accent.green, width: 24 },
    nextBtn: {
      backgroundColor: t.accent.green, borderRadius: 12,
      paddingVertical: 14, paddingHorizontal: 32,
    },
    nextText: { color: '#fff', fontSize: 16, fontWeight: fonts.bold },
    backBtn: { paddingVertical: 14, paddingHorizontal: 16 },
    backText: { color: t.text.muted, fontSize: 15 },
  }), [t]);

  const handleComplete = async () => {
    await AsyncStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
    onClose();
  };

  const goToStep = (step: number) => {
    flatListRef.current?.scrollToIndex({ index: step, animated: true });
    setCurrentStep(step);
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      goToStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setCurrentStep(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderStep = ({ item }: { item: TutorialStep }) => (
    <View style={st.card}>
      <Text style={st.icon}>{item.icon}</Text>
      <Text style={st.title}>{item.title}</Text>
      <Text style={st.description}>{item.description}</Text>
    </View>
  );

  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.stepIndicator}>{currentStep + 1} / {STEPS.length}</Text>
        <TouchableOpacity style={st.skipBtn} onPress={handleComplete}>
          <Text style={st.skipText}>Skip Tutorial</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={STEPS}
        renderItem={renderStep}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        snapToInterval={SCREEN_WIDTH}
        decelerationRate="fast"
      />

      <View style={st.footer}>
        {currentStep > 0 ? (
          <TouchableOpacity style={st.backBtn} onPress={handleBack}>
            <Text style={st.backText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={st.backBtn} />
        )}

        <View style={st.dots}>
          {STEPS.map((_, i) => (
            <View key={i} style={[st.dot, i === currentStep && st.dotActive]} />
          ))}
        </View>

        <TouchableOpacity style={st.nextBtn} onPress={handleNext}>
          <Text style={st.nextText}>{isLastStep ? 'Get Started' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/** Check if the tutorial has been completed */
export async function isTutorialCompleted(): Promise<boolean> {
  const val = await AsyncStorage.getItem(TUTORIAL_COMPLETED_KEY);
  return val === 'true';
}

/** Reset tutorial completion (for testing or re-showing) */
export async function resetTutorial(): Promise<void> {
  await AsyncStorage.removeItem(TUTORIAL_COMPLETED_KEY);
}
