/**
 * Bike Share Screen — Community bike/scooter sharing program.
 *
 * Features:
 * - Browse available bikes and scooters
 * - Borrow a vehicle with time/location
 * - Borrowing history and stats
 * - Demo mode with sample data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface Vehicle {
  id: string;
  type: 'bike' | 'e-bike' | 'scooter';
  name: string;
  location: string;
  distance: string;
  battery?: number;
  condition: 'excellent' | 'good' | 'fair';
  cotkPerHour: number;
}

interface BorrowRecord {
  id: string;
  vehicleName: string;
  type: string;
  date: string;
  duration: number;
  distance: number;
  cotkSpent: number;
  co2Saved: number;
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_AVAILABLE: Vehicle[] = [
  { id: 'v1', type: 'bike', name: 'Blue Cruiser #12', location: 'Main St Station', distance: '0.2 mi', condition: 'excellent', cotkPerHour: 5 },
  { id: 'v2', type: 'e-bike', name: 'Thunder E-Bike #7', location: 'Park Ave Dock', distance: '0.5 mi', battery: 85, condition: 'good', cotkPerHour: 10 },
  { id: 'v3', type: 'scooter', name: 'Zip Scooter #22', location: 'Library Plaza', distance: '0.3 mi', battery: 72, condition: 'excellent', cotkPerHour: 8 },
  { id: 'v4', type: 'bike', name: 'Red Racer #5', location: 'Community Center', distance: '0.8 mi', condition: 'good', cotkPerHour: 5 },
  { id: 'v5', type: 'e-bike', name: 'Breeze E-Bike #3', location: 'Train Station', distance: '1.2 mi', battery: 45, condition: 'fair', cotkPerHour: 8 },
  { id: 'v6', type: 'scooter', name: 'Glide Scooter #15', location: 'Market Square', distance: '0.4 mi', battery: 95, condition: 'excellent', cotkPerHour: 8 },
];

const DEMO_HISTORY: BorrowRecord[] = [
  { id: 'b1', vehicleName: 'Blue Cruiser #12', type: 'bike', date: '2026-03-27', duration: 45, distance: 3.2, cotkSpent: 4, co2Saved: 1.8 },
  { id: 'b2', vehicleName: 'Thunder E-Bike #7', type: 'e-bike', date: '2026-03-25', duration: 30, distance: 5.1, cotkSpent: 5, co2Saved: 2.9 },
  { id: 'b3', vehicleName: 'Zip Scooter #22', type: 'scooter', date: '2026-03-22', duration: 20, distance: 2.4, cotkSpent: 3, co2Saved: 1.4 },
  { id: 'b4', vehicleName: 'Red Racer #5', type: 'bike', date: '2026-03-20', duration: 60, distance: 7.8, cotkSpent: 5, co2Saved: 4.5 },
  { id: 'b5', vehicleName: 'Breeze E-Bike #3', type: 'e-bike', date: '2026-03-18', duration: 25, distance: 4.0, cotkSpent: 4, co2Saved: 2.3 },
];

const TYPE_ICONS: Record<string, string> = { bike: 'B', 'e-bike': 'E', scooter: 'S' };
const COND_COLORS: Record<string, string> = { excellent: '#34C759', good: '#FF9500', fair: '#FF3B30' };

type Tab = 'available' | 'borrow' | 'history';

export function BikeShareScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('available');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const handleBorrow = useCallback((vehicle: Vehicle) => {
    Alert.alert(
      'Borrow Vehicle',
      `${vehicle.name}\nLocation: ${vehicle.location}\nRate: ${vehicle.cotkPerHour} cOTK/hr${vehicle.battery ? `\nBattery: ${vehicle.battery}%` : ''}\n\nConfirm borrowing?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Borrow', onPress: () => { setSelectedVehicle(vehicle); Alert.alert('Borrowed!', `Unlock code: 4829\nReturn to any station within 24 hours.`); } },
      ],
    );
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.green + '20' },
    tabText: { color: t.text.muted, fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: t.accent.green },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 12, marginHorizontal: 20 },
    vehCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    vehRow: { flexDirection: 'row', alignItems: 'center' },
    vehIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: t.accent.green + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    vehIconText: { color: t.accent.green, fontSize: 16, fontWeight: '800' },
    vehInfo: { flex: 1 },
    vehName: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    vehMeta: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    vehRight: { alignItems: 'flex-end' },
    vehRate: { color: t.accent.green, fontSize: 14, fontWeight: '700' },
    vehDist: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    condBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
    condText: { color: '#fff', fontSize: 11, fontWeight: '600' },
    batteryRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
    batteryBar: { width: 60, height: 6, borderRadius: 3, backgroundColor: t.bg.primary, marginRight: 6 },
    batteryFill: { height: 6, borderRadius: 3 },
    batteryText: { color: t.text.muted, fontSize: 11 },
    borrowBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-end', marginTop: 10 },
    borrowBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    activeCard: { backgroundColor: t.accent.green + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    activeText: { color: t.text.primary, fontSize: 15, fontWeight: '600', textAlign: 'center', lineHeight: 22 },
    returnBtn: { backgroundColor: '#FF3B30', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginTop: 12 },
    returnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    histRow: { flexDirection: 'row', paddingVertical: 12, borderBottomColor: t.bg.primary, borderBottomWidth: 1, alignItems: 'center' },
    histIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: t.accent.green + '20', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    histIconText: { color: t.accent.green, fontSize: 12, fontWeight: '700' },
    histInfo: { flex: 1 },
    histName: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    histMeta: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    histRight: { alignItems: 'flex-end' },
    histCotk: { color: t.accent.green, fontSize: 13, fontWeight: '700' },
    histCo2: { color: t.accent.blue, fontSize: 11, marginTop: 2 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
    summaryItem: { alignItems: 'center' },
    summaryValue: { color: t.text.primary, fontSize: 22, fontWeight: '800' },
    summaryLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: '700' },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'available', label: 'Available' },
    { key: 'borrow', label: 'Borrow' },
    { key: 'history', label: 'History' },
  ];

  const renderAvailable = () => (
    <>
      <Text style={s.sectionTitle}>Nearby Vehicles</Text>
      {DEMO_AVAILABLE.map((v) => (
        <View key={v.id} style={s.vehCard}>
          <View style={s.vehRow}>
            <View style={s.vehIcon}><Text style={s.vehIconText}>{TYPE_ICONS[v.type]}</Text></View>
            <View style={s.vehInfo}>
              <Text style={s.vehName}>{v.name}</Text>
              <Text style={s.vehMeta}>{v.location}</Text>
            </View>
            <View style={s.vehRight}>
              <Text style={s.vehRate}>{v.cotkPerHour} cOTK/hr</Text>
              <Text style={s.vehDist}>{v.distance}</Text>
            </View>
          </View>
          {v.battery !== undefined && (
            <View style={s.batteryRow}>
              <View style={s.batteryBar}>
                <View style={[s.batteryFill, { width: `${v.battery}%` as any, backgroundColor: v.battery > 50 ? '#34C759' : '#FF9500' }]} />
              </View>
              <Text style={s.batteryText}>{v.battery}%</Text>
            </View>
          )}
          <View style={[s.condBadge, { backgroundColor: COND_COLORS[v.condition] }]}>
            <Text style={s.condText}>{v.condition.toUpperCase()}</Text>
          </View>
          <TouchableOpacity style={s.borrowBtn} onPress={() => handleBorrow(v)}>
            <Text style={s.borrowBtnText}>Borrow</Text>
          </TouchableOpacity>
        </View>
      ))}
    </>
  );

  const renderBorrow = () => (
    <>
      {selectedVehicle ? (
        <View style={s.activeCard}>
          <Text style={s.activeText}>
            Currently borrowing:{'\n'}{selectedVehicle.name}{'\n'}
            Return to any station within 24 hours.
          </Text>
          <TouchableOpacity style={s.returnBtn} onPress={() => { setSelectedVehicle(null); Alert.alert('Returned', 'Vehicle returned. Thank you!'); }}>
            <Text style={s.returnText}>Return Vehicle</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.card}>
          <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>No Active Borrow</Text>
          <Text style={s.vehMeta}>Browse the Available tab to borrow a bike or scooter. Vehicles cost cOTK per hour of use. Return to any community station when done.</Text>
        </View>
      )}
    </>
  );

  const renderHistory = () => (
    <>
      <View style={s.card}>
        <View style={s.summaryRow}>
          <View style={s.summaryItem}>
            <Text style={s.summaryValue}>{DEMO_HISTORY.length}</Text>
            <Text style={s.summaryLabel}>Rides</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={[s.summaryValue, { color: t.accent.green }]}>{DEMO_HISTORY.reduce((s, h) => s + h.distance, 0).toFixed(1)}</Text>
            <Text style={s.summaryLabel}>Miles</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={[s.summaryValue, { color: t.accent.blue }]}>{DEMO_HISTORY.reduce((s, h) => s + h.co2Saved, 0).toFixed(1)}</Text>
            <Text style={s.summaryLabel}>lbs CO2 Saved</Text>
          </View>
        </View>
      </View>
      <View style={s.card}>
        {DEMO_HISTORY.map((h) => (
          <View key={h.id} style={s.histRow}>
            <View style={s.histIcon}><Text style={s.histIconText}>{TYPE_ICONS[h.type as keyof typeof TYPE_ICONS] || '?'}</Text></View>
            <View style={s.histInfo}>
              <Text style={s.histName}>{h.vehicleName}</Text>
              <Text style={s.histMeta}>{h.date} | {h.duration} min | {h.distance} mi</Text>
            </View>
            <View style={s.histRight}>
              <Text style={s.histCotk}>{h.cotkSpent} cOTK</Text>
              <Text style={s.histCo2}>-{h.co2Saved} lbs CO2</Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Bike Share</Text>
        <View style={{ width: 60 }} />
      </View>

      {demoMode && (
        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO MODE</Text>
        </View>
      )}

      <View style={s.tabRow}>
        {tabs.map((tb) => (
          <TouchableOpacity key={tb.key} style={[s.tabBtn, tab === tb.key && s.tabActive]} onPress={() => setTab(tb.key)}>
            <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {tab === 'available' && renderAvailable()}
        {tab === 'borrow' && renderBorrow()}
        {tab === 'history' && renderHistory()}
      </ScrollView>
    </SafeAreaView>
  );
}
