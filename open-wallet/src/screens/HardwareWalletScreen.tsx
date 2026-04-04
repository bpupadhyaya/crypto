import { fonts } from '../utils/theme';
/**
 * Hardware Wallet Screen — Connect Ledger/Trezor via Bluetooth.
 *
 * Phase 1: UI and connection flow (BLE scanning, pairing)
 * Phase 2: Transaction signing on device
 * Phase 3: Full account management
 *
 * Note: Actual BLE communication requires native modules.
 * This implements the UI and mock flow. Real integration needs:
 * - @ledgerhq/react-native-hw-transport-ble (Ledger)
 * - react-native-ble-plx (BLE scanning)
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

type HWType = 'ledger' | 'trezor' | 'keystone';
type ConnectionStatus = 'disconnected' | 'scanning' | 'connecting' | 'connected';

interface HWDevice {
  id: string;
  type: HWType;
  name: string;
  model: string;
}

interface Props {
  onClose: () => void;
}

const SUPPORTED_DEVICES: Array<{ type: HWType; name: string; models: string[]; icon: string; supported: boolean }> = [
  { type: 'ledger', name: 'Ledger', models: ['Nano X', 'Nano S Plus', 'Stax'], icon: '🔐', supported: true },
  { type: 'trezor', name: 'Trezor', models: ['Model T', 'Safe 3', 'Safe 5'], icon: '🛡️', supported: true },
  { type: 'keystone', name: 'Keystone', models: ['Pro', '3 Pro'], icon: '🗝️', supported: false },
];

export function HardwareWalletScreen({ onClose }: Props) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [selectedType, setSelectedType] = useState<HWType | null>(null);
  const [discoveredDevices, setDiscoveredDevices] = useState<HWDevice[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<HWDevice | null>(null);
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 12, marginTop: 24 },
    deviceCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
    deviceCardActive: { borderWidth: 2, borderColor: t.accent.green },
    deviceCardDisabled: { opacity: 0.4 },
    deviceIcon: { fontSize: 32, marginRight: 16 },
    deviceInfo: { flex: 1 },
    deviceName: { color: t.text.primary, fontSize: 17, fontWeight: fonts.bold },
    deviceModels: { color: t.text.muted, fontSize: 13, marginTop: 2 },
    comingSoon: { color: t.accent.yellow, fontSize: 11, fontWeight: fonts.bold, marginTop: 4 },
    scanBtn: { backgroundColor: t.accent.blue, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginHorizontal: 20, marginTop: 24 },
    scanBtnText: { color: '#fff', fontSize: 17, fontWeight: fonts.bold },
    discoveredCard: { backgroundColor: t.bg.card, borderRadius: 12, padding: 16, marginHorizontal: 20, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    discoveredName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.semibold },
    discoveredModel: { color: t.text.muted, fontSize: 13 },
    connectBtn: { backgroundColor: t.accent.green, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
    connectBtnText: { color: '#fff', fontSize: 13, fontWeight: fonts.bold },
    statusCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 24, marginHorizontal: 20, marginTop: 24, alignItems: 'center' },
    statusIcon: { fontSize: 48, marginBottom: 12 },
    statusText: { color: t.text.primary, fontSize: 18, fontWeight: fonts.bold },
    statusSub: { color: t.text.muted, fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20 },
    actionRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
    actionBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    actionBtnText: { color: '#fff', fontSize: 14, fontWeight: fonts.bold },
    instructions: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginHorizontal: 24, marginTop: 24, lineHeight: 20 },
  }), [t]);

  const startScan = useCallback(async () => {
    if (!selectedType) {
      Alert.alert('Select Device', 'Please select a hardware wallet type first.');
      return;
    }
    setStatus('scanning');
    setDiscoveredDevices([]);

    // Simulate BLE scanning (real implementation uses react-native-ble-plx)
    setTimeout(() => {
      const device = SUPPORTED_DEVICES.find((d) => d.type === selectedType);
      if (device) {
        setDiscoveredDevices([
          { id: 'hw-001', type: selectedType, name: device.name, model: device.models[0] },
        ]);
      }
      setStatus('disconnected');
    }, 3000);
  }, [selectedType]);

  const connectDevice = useCallback(async (device: HWDevice) => {
    setStatus('connecting');

    // Simulate BLE connection (real implementation uses Ledger/Trezor SDKs)
    setTimeout(() => {
      setConnectedDevice(device);
      setStatus('connected');
      Alert.alert(
        'Connected',
        `${device.name} ${device.model} connected successfully.\n\nYou can now sign transactions using your hardware wallet.`,
      );
    }, 2000);
  }, []);

  const disconnectDevice = useCallback(() => {
    setConnectedDevice(null);
    setDiscoveredDevices([]);
    setStatus('disconnected');
  }, []);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Hardware Wallet</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Connected Device */}
        {connectedDevice && status === 'connected' && (
          <>
            <View style={s.statusCard}>
              <Text style={s.statusIcon}>✅</Text>
              <Text style={s.statusText}>{connectedDevice.name} {connectedDevice.model}</Text>
              <Text style={s.statusSub}>Connected via Bluetooth{'\n'}Transactions will be signed on device</Text>
              <View style={s.actionRow}>
                <TouchableOpacity style={[s.actionBtn, { backgroundColor: t.accent.blue }]} onPress={() => Alert.alert('Accounts', 'Fetching accounts from hardware wallet...')}>
                  <Text style={s.actionBtnText}>View Accounts</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.actionBtn, { backgroundColor: t.accent.red }]} onPress={disconnectDevice}>
                  <Text style={s.actionBtnText}>Disconnect</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* Scanning */}
        {status === 'scanning' && (
          <View style={s.statusCard}>
            <ActivityIndicator color={t.accent.blue} size="large" />
            <Text style={[s.statusText, { marginTop: 16 }]}>Scanning for devices...</Text>
            <Text style={s.statusSub}>Make sure your hardware wallet is powered on{'\n'}and Bluetooth is enabled</Text>
          </View>
        )}

        {status === 'connecting' && (
          <View style={s.statusCard}>
            <ActivityIndicator color={t.accent.green} size="large" />
            <Text style={[s.statusText, { marginTop: 16 }]}>Connecting...</Text>
            <Text style={s.statusSub}>Please confirm pairing on your device</Text>
          </View>
        )}

        {/* Device Selection */}
        {status === 'disconnected' && !connectedDevice && (
          <>
            <Text style={s.section}>Select Device</Text>
            {SUPPORTED_DEVICES.map((device) => (
              <TouchableOpacity
                key={device.type}
                style={[
                  s.deviceCard,
                  selectedType === device.type && s.deviceCardActive,
                  !device.supported && s.deviceCardDisabled,
                ]}
                onPress={() => device.supported && setSelectedType(device.type)}
                disabled={!device.supported}
              >
                <Text style={s.deviceIcon}>{device.icon}</Text>
                <View style={s.deviceInfo}>
                  <Text style={s.deviceName}>{device.name}</Text>
                  <Text style={s.deviceModels}>{device.models.join(' · ')}</Text>
                  {!device.supported && <Text style={s.comingSoon}>Coming Soon</Text>}
                </View>
              </TouchableOpacity>
            ))}

            {/* Discovered Devices */}
            {discoveredDevices.length > 0 && (
              <>
                <Text style={s.section}>Found Devices</Text>
                {discoveredDevices.map((device) => (
                  <View key={device.id} style={s.discoveredCard}>
                    <View>
                      <Text style={s.discoveredName}>{device.name}</Text>
                      <Text style={s.discoveredModel}>{device.model}</Text>
                    </View>
                    <TouchableOpacity style={s.connectBtn} onPress={() => connectDevice(device)}>
                      <Text style={s.connectBtnText}>Connect</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}

            <TouchableOpacity style={s.scanBtn} onPress={startScan}>
              <Text style={s.scanBtnText}>
                {discoveredDevices.length > 0 ? 'Scan Again' : 'Scan for Devices'}
              </Text>
            </TouchableOpacity>

            <Text style={s.instructions}>
              1. Turn on your hardware wallet{'\n'}
              2. Enable Bluetooth on your device{'\n'}
              3. Open the crypto app on your hardware wallet{'\n'}
              4. Tap "Scan for Devices" above
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
