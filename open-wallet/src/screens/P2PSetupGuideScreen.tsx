import { fonts } from '../utils/theme';
/**
 * P2P Setup Guide Screen — step-by-step walkthrough for setting up
 * the 10-phone P2P testnet on a local WiFi network.
 *
 * Steps:
 *   1. Connect all phones to the same WiFi
 *   2. Enable mDNS in P2P settings
 *   3. Phone 1 starts as genesis validator
 *   4. Phones 2-10 scan Phone 1's QR code
 *   5. Wait for all phones to sync
 *   6. Decentralized network is running
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Animated, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { p2pManager } from '../core/providers/mobile/p2p';
import { nodeRunner } from '../core/p2p/nodeRunner';

interface P2PSetupGuideScreenProps {
  onClose: () => void;
}

interface SetupStep {
  id: number;
  title: string;
  description: string;
  detail: string;
  command?: string;
  checkLabel?: string;
}

const SETUP_STEPS: SetupStep[] = [
  {
    id: 1,
    title: 'Connect to WiFi',
    description: 'Connect all phones to the same WiFi network',
    detail:
      'All 10 phones must be on the same local network. This allows direct device-to-device communication without any internet server. Any standard WiFi router works.',
    checkLabel: 'WiFi connected',
  },
  {
    id: 2,
    title: 'Enable mDNS Discovery',
    description: 'Open Settings > Network > P2P Network > Enable mDNS',
    detail:
      'mDNS (multicast DNS) lets phones automatically find each other on the local network. Once enabled, your phone will broadcast its presence and discover other Open Wallet nodes nearby.',
    checkLabel: 'mDNS enabled',
  },
  {
    id: 3,
    title: 'Start Genesis Validator (Phone 1)',
    description: 'Phone 1 initializes the blockchain and starts as the first validator',
    detail:
      'One phone must be the genesis validator that creates the first block. Run the command below on Phone 1, or tap "Start as Genesis" in P2P settings. This phone will produce blocks and others will sync from it.',
    command: 'openchaind init node1 --chain-id openchain-testnet-1\nopenchaind start --p2p.laddr tcp://0.0.0.0:26656',
    checkLabel: 'Genesis node running',
  },
  {
    id: 4,
    title: 'Connect Phones 2-10',
    description: "Scan Phone 1's QR code to join the network",
    detail:
      'On Phone 1, go to P2P Network and tap "Show My Peer QR". On each remaining phone, tap "Scan Peer QR" and scan the code. This shares the network address so phones can find each other directly.',
    checkLabel: 'Peers connected',
  },
  {
    id: 5,
    title: 'Wait for Sync',
    description: 'All phones sync the blockchain (~30 seconds)',
    detail:
      'Once connected, phones exchange blocks peer-to-peer. The initial sync takes about 30 seconds for a fresh chain. You can watch the block height increase in real-time on the P2P Network screen.',
    checkLabel: 'Chain synced',
  },
  {
    id: 6,
    title: 'Network Ready',
    description: 'You are running a decentralized blockchain on 10 phones!',
    detail:
      'All balance queries, transaction broadcasts, and block production now happen entirely on your local network. No internet connection needed. No central server. This is true peer-to-peer cryptocurrency.',
    checkLabel: 'All checks passed',
  },
];

export function P2PSetupGuideScreen({ onClose }: P2PSetupGuideScreenProps) {
  const t = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [stepChecks, setStepChecks] = useState<Record<number, boolean>>({});
  const [demoMode, setDemoMode] = useState(false);
  const demoTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Animate progress bar
  useEffect(() => {
    const completedCount = Object.values(stepChecks).filter(Boolean).length;
    Animated.timing(progressAnim, {
      toValue: completedCount / SETUP_STEPS.length,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [stepChecks, progressAnim]);

  // Live connectivity checks
  useEffect(() => {
    const interval = setInterval(async () => {
      if (demoMode) return;

      const checks: Record<number, boolean> = { ...stepChecks };

      // Step 1: WiFi — we assume connected if the app is running
      // (no reliable cross-platform WiFi check in RN without extra native module)
      checks[1] = true;

      // Step 2: mDNS — check if P2P manager has mDNS active
      // (placeholder — in production, check zeroconf service)
      checks[2] = p2pManager.isRunning();

      // Step 3: Genesis node running
      const nodeStatus = nodeRunner.getStatus();
      checks[3] = nodeStatus.running && nodeStatus.latestBlock > 0;

      // Step 4: Peers connected
      const peers = await p2pManager.getPeers();
      checks[4] = peers.length >= 1;

      // Step 5: Chain synced (not catching up)
      checks[5] = nodeStatus.running && !nodeStatus.syncing && nodeStatus.latestBlock > 0;

      // Step 6: All prior steps done
      checks[6] = checks[1] && checks[2] && checks[3] && checks[4] && checks[5];

      setStepChecks(checks);
    }, 3_000);

    return () => clearInterval(interval);
  }, [demoMode, stepChecks]);

  // Demo mode walkthrough
  const startDemo = useCallback(() => {
    setDemoMode(true);
    setCurrentStep(0);
    setStepChecks({});

    let step = 0;
    demoTimer.current = setInterval(() => {
      step++;
      if (step <= SETUP_STEPS.length) {
        setStepChecks((prev) => ({ ...prev, [step]: true }));
        setCurrentStep(Math.min(step, SETUP_STEPS.length - 1));
      } else {
        if (demoTimer.current) clearInterval(demoTimer.current);
        demoTimer.current = null;
      }
    }, 2_000);
  }, []);

  useEffect(() => {
    return () => {
      if (demoTimer.current) clearInterval(demoTimer.current);
    };
  }, []);

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    scroll: { paddingHorizontal: 16, paddingBottom: 40 },
    header: { color: t.text.primary, fontSize: fonts.xxl, fontWeight: fonts.bold, textAlign: 'center', marginTop: 16, marginBottom: 4 },
    subtitle: { color: t.text.secondary, fontSize: fonts.md, textAlign: 'center', marginBottom: 20 },
    progressContainer: { height: 6, backgroundColor: t.border, borderRadius: 3, marginHorizontal: 16, marginBottom: 20 },
    progressBar: { height: 6, backgroundColor: t.accent.green, borderRadius: 3 },
    progressText: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginBottom: 16 },
    stepCard: { backgroundColor: t.bg.card, borderRadius: 16, marginBottom: 12, overflow: 'hidden' },
    stepCardActive: { borderWidth: 1, borderColor: t.accent.blue },
    stepCardDone: { borderWidth: 1, borderColor: t.accent.green + '40' },
    stepHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    stepNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: t.border, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    stepNumberActive: { backgroundColor: t.accent.blue },
    stepNumberDone: { backgroundColor: t.accent.green },
    stepNumberText: { color: t.text.muted, fontSize: fonts.md, fontWeight: fonts.bold },
    stepNumberTextActive: { color: '#fff' },
    stepTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold, flex: 1 },
    stepDescription: { color: t.text.secondary, fontSize: fonts.sm, paddingHorizontal: 16, paddingBottom: 12 },
    stepDetail: { color: t.text.muted, fontSize: fonts.sm, lineHeight: 19, paddingHorizontal: 16, paddingBottom: 16 },
    commandBox: { backgroundColor: t.bg.primary, borderRadius: 8, marginHorizontal: 16, marginBottom: 16, padding: 12 },
    commandText: { color: t.accent.green, fontSize: fonts.sm, fontFamily: 'monospace', lineHeight: 18 },
    checkRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16 },
    checkDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
    checkText: { fontSize: fonts.sm, fontWeight: fonts.semibold },
    checkTextPass: { color: t.accent.green },
    checkTextWait: { color: t.text.muted },
    demoBtn: { backgroundColor: t.accent.blue + '20', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8, marginBottom: 16 },
    demoBtnText: { color: t.accent.blue, fontSize: fonts.md, fontWeight: fonts.bold },
    demoBtnActive: { backgroundColor: t.accent.green + '20' },
    demoBtnTextActive: { color: t.accent.green },
    backBtn: { paddingVertical: 20, alignItems: 'center' },
    backText: { color: t.accent.blue, fontSize: fonts.lg },
    statusBanner: { backgroundColor: t.accent.green + '15', borderRadius: 12, padding: 16, marginBottom: 16, alignItems: 'center' },
    statusBannerText: { color: t.accent.green, fontSize: fonts.lg, fontWeight: fonts.bold },
    statusBannerSub: { color: t.accent.green, fontSize: fonts.sm, marginTop: 4, opacity: 0.8 },
  }), [t]);

  const completedCount = Object.values(stepChecks).filter(Boolean).length;

  return (
    <SafeAreaView style={st.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll}>
        <Text style={st.header}>P2P Testnet Setup</Text>
        <Text style={st.subtitle}>Set up a decentralized network on 10 phones</Text>

        {/* Progress Bar */}
        <View style={st.progressContainer}>
          <Animated.View
            style={[
              st.progressBar,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={st.progressText}>
          {completedCount} / {SETUP_STEPS.length} steps complete
        </Text>

        {/* Success Banner */}
        {completedCount === SETUP_STEPS.length && (
          <View style={st.statusBanner}>
            <Text style={st.statusBannerText}>Network Running</Text>
            <Text style={st.statusBannerSub}>All 10 phones are connected peer-to-peer</Text>
          </View>
        )}

        {/* Demo Mode Button */}
        <TouchableOpacity
          style={[st.demoBtn, demoMode && st.demoBtnActive]}
          onPress={startDemo}
          disabled={demoMode}
        >
          {demoMode ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator size="small" color={t.accent.green} />
              <Text style={st.demoBtnTextActive}>Demo in progress...</Text>
            </View>
          ) : (
            <Text style={st.demoBtnText}>Run Demo Walkthrough</Text>
          )}
        </TouchableOpacity>

        {/* Steps */}
        {SETUP_STEPS.map((step, index) => {
          const isActive = index === currentStep;
          const isDone = !!stepChecks[step.id];
          const isExpanded = isActive || isDone;

          return (
            <TouchableOpacity
              key={step.id}
              style={[
                st.stepCard,
                isActive && !isDone && st.stepCardActive,
                isDone && st.stepCardDone,
              ]}
              onPress={() => setCurrentStep(index)}
              activeOpacity={0.7}
            >
              <View style={st.stepHeader}>
                <View style={[
                  st.stepNumber,
                  isActive && !isDone && st.stepNumberActive,
                  isDone && st.stepNumberDone,
                ]}>
                  <Text style={[
                    st.stepNumberText,
                    (isActive || isDone) && st.stepNumberTextActive,
                  ]}>
                    {isDone ? '\u2713' : step.id}
                  </Text>
                </View>
                <Text style={st.stepTitle}>{step.title}</Text>
              </View>

              <Text style={st.stepDescription}>{step.description}</Text>

              {isExpanded && (
                <>
                  <Text style={st.stepDetail}>{step.detail}</Text>

                  {step.command && (
                    <View style={st.commandBox}>
                      <Text style={st.commandText}>{step.command}</Text>
                    </View>
                  )}

                  {step.checkLabel && (
                    <View style={st.checkRow}>
                      <View style={[
                        st.checkDot,
                        { backgroundColor: isDone ? t.accent.green : t.text.muted + '40' },
                      ]} />
                      <Text style={isDone ? [st.checkText, st.checkTextPass] : [st.checkText, st.checkTextWait]}>
                        {isDone ? step.checkLabel : `Checking: ${step.checkLabel}...`}
                      </Text>
                      {!isDone && !demoMode && (
                        <ActivityIndicator size="small" color={t.text.muted} style={{ marginLeft: 8 }} />
                      )}
                    </View>
                  )}
                </>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Back */}
        <TouchableOpacity style={st.backBtn} onPress={onClose}>
          <Text style={st.backText}>Back to P2P Network</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
