import { fonts } from '../utils/theme';
/**
 * P2P Settings Screen — Node status, peers, network mode.
 *
 * Shows:
 *   - P2P node running/stopped status
 *   - Connected peers with latency
 *   - Start/Stop node
 *   - Peer ID
 *   - Latest synced block height
 *   - Bootstrap peer configuration
 *   - mDNS toggle for local testing
 *   - Network mode: Server / P2P / Hybrid
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Switch, Alert, TextInput, Modal,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useWalletStore } from '../store/walletStore';
import { p2pManager, type PeerInfo } from '../core/providers/mobile/p2p';
import { QRScanner } from '../components/QRScanner';
import { P2PSetupGuideScreen } from './P2PSetupGuideScreen';
import { useTheme } from '../hooks/useTheme';
import type { BackendType } from '../core/abstractions/types';

interface P2PScreenProps {
  onClose: () => void;
}

export function P2PScreen({ onClose }: P2PScreenProps) {
  const {
    backendType, setBackendType,
    p2pEnabled, setP2PEnabled,
    p2pBootstrapPeers, setP2PBootstrapPeers,
    p2pEnableMDNS, setP2PEnableMDNS,
  } = useWalletStore();

  const [nodeRunning, setNodeRunning] = useState(p2pManager.isRunning());
  const [peerId, setPeerId] = useState(p2pManager.getPeerId());
  const [peers, setPeers] = useState<PeerInfo[]>([]);
  const [blockHeight, setBlockHeight] = useState(0);
  const [newPeerAddress, setNewPeerAddress] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const t = useTheme();

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    scroll: { paddingHorizontal: 16, paddingTop: 8 },
    header: { color: t.text.primary, fontSize: 20, fontWeight: fonts.bold, textAlign: 'center', marginVertical: 16 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 24, marginBottom: 8, marginLeft: 4 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 4 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    label: { color: t.text.primary, fontSize: 15 },
    value: { color: t.text.secondary, fontSize: 14 },
    valueGreen: { color: t.accent.green, fontSize: 13, fontWeight: fonts.semibold },
    valueRed: { color: t.accent.red, fontSize: 13, fontWeight: fonts.semibold },
    valueMono: { color: t.text.secondary, fontSize: 11, fontFamily: 'monospace' },
    divider: { height: 1, backgroundColor: t.border, marginHorizontal: 16 },
    modeToggle: { flexDirection: 'row', gap: 4 },
    modeBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 8, backgroundColor: t.border },
    modeBtnActive: { backgroundColor: t.accent.green },
    modeBtnText: { color: t.text.secondary, fontSize: 13, fontWeight: fonts.semibold },
    modeBtnTextActive: { color: t.bg.primary },
    startBtn: { backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
    stopBtn: { backgroundColor: t.accent.red + '20', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
    btnText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    stopBtnText: { color: t.accent.red, fontSize: 15, fontWeight: fonts.bold },
    peerCard: { backgroundColor: t.bg.card, borderRadius: 12, padding: 12, marginBottom: 8 },
    peerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    peerId: { color: t.text.primary, fontSize: 13, fontFamily: 'monospace', flex: 1 },
    peerLatency: { color: t.accent.green, fontSize: 12, fontWeight: fonts.semibold, marginLeft: 8 },
    peerAge: { color: t.text.muted, fontSize: 11, marginTop: 4 },
    input: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 14, fontFamily: 'monospace', marginTop: 8 },
    addPeerBtn: { backgroundColor: t.accent.blue, borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 8 },
    addPeerText: { color: '#fff', fontSize: 14, fontWeight: fonts.semibold },
    emptyText: { color: t.text.muted, fontSize: 13, textAlign: 'center', padding: 20 },
    backBtn: { paddingVertical: 20, alignItems: 'center' },
    backText: { color: t.accent.blue, fontSize: 16 },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    statusRow: { flexDirection: 'row', alignItems: 'center' },
    qrRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    qrBtn: { flex: 1, backgroundColor: t.accent.blue, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    qrBtnScan: { flex: 1, backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    qrBtnText: { color: '#fff', fontSize: 14, fontWeight: fonts.bold },
    qrOverlay: { flex: 1, backgroundColor: t.bg.primary, justifyContent: 'center', alignItems: 'center', padding: 24 },
    qrTitle: { color: t.text.primary, fontSize: 18, fontWeight: fonts.bold, marginBottom: 20 },
    qrWrapper: { padding: 20, backgroundColor: '#ffffff', borderRadius: 20, marginBottom: 20 },
    qrInfo: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginBottom: 20, lineHeight: 18 },
    qrCloseBtn: { backgroundColor: t.accent.red + '20', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40, alignItems: 'center' },
    qrCloseText: { color: t.accent.red, fontSize: 15, fontWeight: fonts.bold },
    setupGuideBtn: { backgroundColor: t.accent.blue + '15', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
    setupGuideBtnText: { color: t.accent.blue, fontSize: 15, fontWeight: fonts.bold },
  }), [t]);

  // ─── Peer & Block Updates ───

  useEffect(() => {
    const unsubPeers = p2pManager.onPeerUpdate((updatedPeers) => {
      setPeers(updatedPeers);
    });
    const unsubBlocks = p2pManager.onNewBlock((block) => {
      setBlockHeight(block.height);
    });

    // Initial state
    p2pManager.getPeers().then(setPeers);
    p2pManager.getLatestHeight().then(setBlockHeight);

    return () => { unsubPeers(); unsubBlocks(); };
  }, []);

  // ─── Start/Stop Node ───

  const handleStartNode = useCallback(async () => {
    try {
      const id = await p2pManager.start({
        bootstrapPeers: p2pBootstrapPeers,
        enableMDNS: p2pEnableMDNS,
        chainID: 'openchain-testnet-1',
        dataDir: '',
      });
      setPeerId(id);
      setNodeRunning(true);
      setP2PEnabled(true);
    } catch (err) {
      Alert.alert('Start Failed', err instanceof Error ? err.message : 'Could not start P2P node');
    }
  }, [p2pBootstrapPeers, p2pEnableMDNS, setP2PEnabled]);

  const handleStopNode = useCallback(async () => {
    await p2pManager.stop();
    setNodeRunning(false);
    setPeers([]);
    setBlockHeight(0);
    setP2PEnabled(false);
  }, [setP2PEnabled]);

  // ─── Add Peer ───

  const handleAddPeer = useCallback(async () => {
    const address = newPeerAddress.trim();
    if (!address) return;

    try {
      await p2pManager.addPeer(address);
      if (!p2pBootstrapPeers.includes(address)) {
        setP2PBootstrapPeers([...p2pBootstrapPeers, address]);
      }
      setNewPeerAddress('');
    } catch (err) {
      Alert.alert('Failed', err instanceof Error ? err.message : 'Could not add peer');
    }
  }, [newPeerAddress, p2pBootstrapPeers, setP2PBootstrapPeers]);

  // ─── QR Peer Sharing ───

  const peerQRData = useMemo(() => JSON.stringify({
    nodeId: peerId || 'not-started',
    address: '0.0.0.0:26657', // In production, detect local IP
    chainId: 'openchain-testnet-1',
  }), [peerId]);

  const handleScanPeer = useCallback(async (data: string) => {
    setShowScanner(false);
    try {
      const parsed = JSON.parse(data);
      if (!parsed.address || !parsed.chainId) {
        Alert.alert('Invalid QR', 'This QR code does not contain valid peer information.');
        return;
      }

      const address = parsed.nodeId
        ? `${parsed.nodeId}@${parsed.address}`
        : parsed.address;

      // Add to bootstrap peers
      if (!p2pBootstrapPeers.includes(address)) {
        setP2PBootstrapPeers([...p2pBootstrapPeers, address]);
      }

      // If node is running, attempt connection immediately
      if (nodeRunning) {
        try {
          await p2pManager.addPeer(address);
          Alert.alert('Peer Added', `Connected to ${parsed.nodeId ? parsed.nodeId.slice(0, 12) + '...' : parsed.address}`);
        } catch (err) {
          Alert.alert('Peer Saved', `Added ${parsed.address} to bootstrap peers. Connection will be attempted when the node starts.`);
        }
      } else {
        Alert.alert('Peer Saved', `Added ${parsed.address} to bootstrap peers. Start the node to connect.`);
      }
    } catch {
      Alert.alert('Invalid QR', 'Could not parse peer information from this QR code.');
    }
  }, [nodeRunning, p2pBootstrapPeers, setP2PBootstrapPeers]);

  // ─── Backend Type Switch ───

  const handleBackendSwitch = useCallback((type: BackendType) => {
    if (type === 'mobile' && !nodeRunning) {
      Alert.alert('Start P2P First', 'Start the P2P node before switching to mobile mode.');
      return;
    }
    setBackendType(type);
  }, [nodeRunning, setBackendType]);

  // ─── Peer Time Ago ───

  const timeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <SafeAreaView style={st.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll}>
        <Text style={st.header}>P2P Network</Text>

        {/* Node Status */}
        <Text style={st.section}>Node Status</Text>
        <View style={st.card}>
          <View style={st.row}>
            <Text style={st.label}>Status</Text>
            <View style={st.statusRow}>
              <View style={[st.statusDot, { backgroundColor: nodeRunning ? t.accent.green : t.accent.red }]} />
              <Text style={nodeRunning ? st.valueGreen : st.valueRed}>
                {nodeRunning ? 'Running' : 'Stopped'}
              </Text>
            </View>
          </View>
          <View style={st.divider} />
          <View style={st.row}>
            <Text style={st.label}>Peer ID</Text>
            <Text style={st.valueMono} numberOfLines={1}>
              {peerId || 'Not started'}
            </Text>
          </View>
          <View style={st.divider} />
          <View style={st.row}>
            <Text style={st.label}>Block Height</Text>
            <Text style={st.valueGreen}>
              {blockHeight > 0 ? blockHeight.toLocaleString() : '--'}
            </Text>
          </View>
          <View style={st.divider} />
          <View style={st.row}>
            <Text style={st.label}>Connected Peers</Text>
            <Text style={st.value}>{peers.length}</Text>
          </View>
        </View>

        {/* Start/Stop Button */}
        {nodeRunning ? (
          <TouchableOpacity style={st.stopBtn} onPress={handleStopNode}>
            <Text style={st.stopBtnText}>Stop Node</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={st.startBtn} onPress={handleStartNode}>
            <Text style={st.btnText}>Start Node</Text>
          </TouchableOpacity>
        )}

        {/* QR Peer Sharing */}
        <View style={st.qrRow}>
          <TouchableOpacity style={st.qrBtn} onPress={() => setShowQR(true)}>
            <Text style={st.qrBtnText}>Show My Peer QR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={st.qrBtnScan} onPress={() => setShowScanner(true)}>
            <Text style={st.qrBtnText}>Scan Peer QR</Text>
          </TouchableOpacity>
        </View>

        {/* Setup Guide */}
        <TouchableOpacity style={st.setupGuideBtn} onPress={() => setShowSetupGuide(true)}>
          <Text style={st.setupGuideBtnText}>Setup Guide (10-Phone Testnet)</Text>
        </TouchableOpacity>

        {/* Network Mode */}
        <Text style={st.section}>Network Mode</Text>
        <View style={st.card}>
          <View style={st.row}>
            <Text style={st.label}>Backend</Text>
            <View style={st.modeToggle}>
              {(['server', 'mobile', 'hybrid'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[st.modeBtn, backendType === m && st.modeBtnActive]}
                  onPress={() => handleBackendSwitch(m)}
                >
                  <Text style={[st.modeBtnText, backendType === m && st.modeBtnTextActive]}>
                    {m === 'server' ? 'Server' : m === 'mobile' ? 'P2P' : 'Hybrid'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
            <Text style={{ color: t.text.muted, fontSize: 12 }}>
              {backendType === 'server' && 'All queries go through centralized RPC servers.'}
              {backendType === 'mobile' && 'All queries go directly to peer nodes. No central server.'}
              {backendType === 'hybrid' && 'Uses P2P for Open Chain, servers for other chains.'}
            </Text>
          </View>
        </View>

        {/* Connected Peers */}
        <Text style={st.section}>Connected Peers</Text>
        {peers.length === 0 ? (
          <Text style={st.emptyText}>
            {nodeRunning ? 'Searching for peers...' : 'Start the node to connect to peers'}
          </Text>
        ) : (
          peers.map((peer) => (
            <View key={peer.id} style={st.peerCard}>
              <View style={st.peerRow}>
                <Text style={st.peerId} numberOfLines={1}>{peer.id}</Text>
                <Text style={st.peerLatency}>{peer.latency}ms</Text>
              </View>
              <Text style={st.peerAge}>{peer.address} · {timeAgo(peer.lastSeen)}</Text>
            </View>
          ))
        )}

        {/* Add Peer */}
        {nodeRunning && (
          <>
            <Text style={st.section}>Add Peer</Text>
            <TextInput
              style={st.input}
              placeholder="192.168.1.5:26657"
              placeholderTextColor={t.text.muted}
              value={newPeerAddress}
              onChangeText={setNewPeerAddress}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={st.addPeerBtn} onPress={handleAddPeer}>
              <Text style={st.addPeerText}>Add Peer</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Discovery Settings */}
        <Text style={st.section}>Discovery</Text>
        <View style={st.card}>
          <View style={st.row}>
            <Text style={st.label}>mDNS (Local Network)</Text>
            <Switch
              value={p2pEnableMDNS}
              onValueChange={setP2PEnableMDNS}
              trackColor={{ false: '#333', true: t.accent.green + '40' }}
              thumbColor={p2pEnableMDNS ? t.accent.green : '#666'}
            />
          </View>
          <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
            <Text style={{ color: t.text.muted, fontSize: 12 }}>
              Auto-discover Open Wallet peers on your local Wi-Fi network. Useful for testing with multiple phones.
            </Text>
          </View>
        </View>

        {/* Bootstrap Peers */}
        <Text style={st.section}>Bootstrap Peers ({p2pBootstrapPeers.length})</Text>
        <View style={st.card}>
          {p2pBootstrapPeers.length === 0 ? (
            <View style={{ padding: 16 }}>
              <Text style={{ color: t.text.muted, fontSize: 13 }}>
                No bootstrap peers configured. Add peers above or use mDNS for local discovery.
              </Text>
            </View>
          ) : (
            p2pBootstrapPeers.map((addr, i) => (
              <React.Fragment key={addr}>
                {i > 0 && <View style={st.divider} />}
                <TouchableOpacity
                  style={st.row}
                  onLongPress={() => {
                    Alert.alert('Remove Peer', `Remove ${addr} from bootstrap list?`, [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Remove', style: 'destructive',
                        onPress: () => setP2PBootstrapPeers(p2pBootstrapPeers.filter((p) => p !== addr)),
                      },
                    ]);
                  }}
                >
                  <Text style={st.valueMono}>{addr}</Text>
                </TouchableOpacity>
              </React.Fragment>
            ))
          )}
        </View>

        {/* Back */}
        <TouchableOpacity style={st.backBtn} onPress={onClose}>
          <Text style={st.backText}>Back to Settings</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
      {/* QR Code Modal */}
      <Modal visible={showQR} animationType="slide" presentationStyle="fullScreen">
        <View style={st.qrOverlay}>
          <Text style={st.qrTitle}>My Peer Info</Text>
          <View style={st.qrWrapper}>
            <QRCode value={peerQRData} size={220} backgroundColor="#ffffff" color="#0a0a0f" />
          </View>
          <Text style={st.qrInfo}>
            Another phone running Open Wallet can scan this{'\n'}
            QR code to connect to your P2P node.
          </Text>
          <TouchableOpacity style={st.qrCloseBtn} onPress={() => setShowQR(false)}>
            <Text style={st.qrCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* QR Scanner Modal */}
      <Modal visible={showScanner} animationType="slide" presentationStyle="fullScreen">
        <QRScanner
          onScan={handleScanPeer}
          onClose={() => setShowScanner(false)}
        />
      </Modal>

      {/* Setup Guide Modal */}
      <Modal visible={showSetupGuide} animationType="slide" presentationStyle="fullScreen">
        <P2PSetupGuideScreen onClose={() => setShowSetupGuide(false)} />
      </Modal>
    </SafeAreaView>
  );
}
