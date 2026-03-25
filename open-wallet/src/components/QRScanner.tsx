/**
 * QR Scanner — Camera-based QR code reader for recipient addresses.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

interface Props {
  onScan: (data: string) => void;
  onClose: () => void;
}

export const QRScanner = React.memo(({ onScan, onClose }: Props) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarCodeScanned = useCallback(({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    // Strip common URI prefixes (bitcoin:, ethereum:, solana:)
    const cleanData = data.replace(/^(bitcoin|ethereum|solana|cardano):/, '').split('?')[0];
    onScan(cleanData);
  }, [scanned, onScan]);

  if (!permission) {
    return (
      <SafeAreaView style={s.container}>
        <Text style={s.text}>Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={s.container}>
        <Text style={s.title}>Camera Permission</Text>
        <Text style={s.text}>We need camera access to scan QR codes</Text>
        <TouchableOpacity style={s.grantBtn} onPress={requestPermission}>
          <Text style={s.grantText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
          <Text style={s.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Scan QR Code</Text>
        <View style={{ width: 70 }} />
      </View>

      <View style={s.cameraContainer}>
        <CameraView
          style={s.camera}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
        <View style={s.overlay}>
          <View style={s.scanFrame} />
        </View>
      </View>

      <Text style={s.hint}>Point camera at a wallet QR code</Text>

      {scanned && (
        <TouchableOpacity style={s.rescanBtn} onPress={() => setScanned(false)}>
          <Text style={s.rescanText}>Scan Again</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  closeBtn: { color: '#3b82f6', fontSize: 16, fontWeight: '600' },
  headerTitle: { color: '#f0f0f5', fontSize: 18, fontWeight: '800' },
  cameraContainer: { flex: 1, marginHorizontal: 16, borderRadius: 20, overflow: 'hidden', position: 'relative' },
  camera: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: 250, height: 250, borderWidth: 2, borderColor: '#22c55e', borderRadius: 20 },
  hint: { color: '#a0a0b0', fontSize: 14, textAlign: 'center', marginTop: 16, marginBottom: 8 },
  title: { color: '#f0f0f5', fontSize: 22, fontWeight: '800', textAlign: 'center', marginTop: 100 },
  text: { color: '#a0a0b0', fontSize: 15, textAlign: 'center', marginTop: 12, marginHorizontal: 40 },
  grantBtn: { backgroundColor: '#22c55e', borderRadius: 16, paddingVertical: 16, marginHorizontal: 40, marginTop: 24, alignItems: 'center' },
  grantText: { color: '#0a0a0f', fontSize: 16, fontWeight: '700' },
  cancelBtn: { paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  cancelText: { color: '#606070', fontSize: 16 },
  rescanBtn: { backgroundColor: '#16161f', borderRadius: 12, paddingVertical: 12, marginHorizontal: 40, marginBottom: 20, alignItems: 'center' },
  rescanText: { color: '#22c55e', fontSize: 15, fontWeight: '700' },
});
