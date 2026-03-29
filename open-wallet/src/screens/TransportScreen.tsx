/**
 * Transport Screen — Community transport, ride sharing, accessible mobility.
 *
 * Article I: "Every person deserves access to safe, affordable transportation."
 *
 * Features:
 * - Available rides (ride sharing from community members)
 * - Offer a ride (destination, seats, time)
 * - Community bus routes
 * - Accessible transport (wheelchair accessible, medical transport)
 * - Community transport stats (rides shared, emissions saved)
 * - Demo mode with sample data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface RideOffer {
  id: string;
  driverUID: string;
  driverName: string;
  destination: string;
  origin: string;
  departureTime: string;
  seatsAvailable: number;
  seatsTotal: number;
  accessible: boolean;
  vehicleType: string;
  estimatedCO2Saved: number;
  date: string;
}

interface BusRoute {
  id: string;
  name: string;
  stops: string[];
  frequency: string;
  operatingHours: string;
  accessible: boolean;
  nextDeparture: string;
  riderCount: number;
}

interface AccessibleOption {
  id: string;
  type: string;
  provider: string;
  description: string;
  features: string[];
  availability: string;
  bookingRequired: boolean;
  contact: string;
}

interface TransportStats {
  totalRidesShared: number;
  totalCO2SavedKg: number;
  activeDrivers: number;
  activeRoutes: number;
  accessibleTripsThisMonth: number;
  walkingGroupMembers: number;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const TRANSPORT_TYPES = [
  { key: 'carpool', label: 'Carpool', icon: 'C' },
  { key: 'bicycle', label: 'Bicycle', icon: 'B' },
  { key: 'walking', label: 'Walking', icon: 'W' },
  { key: 'van', label: 'Van', icon: 'V' },
];

// ─── Demo Data ───

const DEMO_STATS: TransportStats = {
  totalRidesShared: 1284,
  totalCO2SavedKg: 3842,
  activeDrivers: 47,
  activeRoutes: 2,
  accessibleTripsThisMonth: 38,
  walkingGroupMembers: 65,
};

const DEMO_RIDES: RideOffer[] = [
  { id: 'r1', driverUID: 'openchain1abc...driver_maria', driverName: 'Maria', destination: 'Community Health Center', origin: 'Oak Street', departureTime: '08:30 AM', seatsAvailable: 3, seatsTotal: 4, accessible: false, vehicleType: 'Sedan', estimatedCO2Saved: 2.4, date: '2026-03-30' },
  { id: 'r2', driverUID: 'openchain1def...driver_raj', driverName: 'Raj', destination: 'Downtown Market', origin: 'Pine Avenue', departureTime: '10:00 AM', seatsAvailable: 2, seatsTotal: 3, accessible: false, vehicleType: 'Hatchback', estimatedCO2Saved: 1.8, date: '2026-03-30' },
  { id: 'r3', driverUID: 'openchain1ghi...driver_sam', driverName: 'Sam', destination: 'University Campus', origin: 'Elm Road', departureTime: '07:45 AM', seatsAvailable: 1, seatsTotal: 4, accessible: true, vehicleType: 'Accessible Van', estimatedCO2Saved: 3.1, date: '2026-03-30' },
];

const DEMO_BUS_ROUTES: BusRoute[] = [
  { id: 'b1', name: 'Green Line — North Loop', stops: ['Community Center', 'Library', 'Health Clinic', 'Senior Center', 'Park'], frequency: 'Every 30 min', operatingHours: '6:00 AM - 9:00 PM', accessible: true, nextDeparture: '9:15 AM', riderCount: 342 },
  { id: 'b2', name: 'Blue Line — Market Route', stops: ['Town Square', 'Farmers Market', 'School District', 'Recreation Center', 'Hospital'], frequency: 'Every 45 min', operatingHours: '7:00 AM - 8:00 PM', accessible: true, nextDeparture: '9:45 AM', riderCount: 218 },
];

const DEMO_ACCESSIBLE: AccessibleOption[] = [
  { id: 'a1', type: 'Wheelchair Van', provider: 'Community Care Transport', description: 'Door-to-door wheelchair accessible van service', features: ['Wheelchair ramp', 'Trained driver', 'Medical escort option'], availability: 'Mon-Sat, 7 AM - 7 PM', bookingRequired: true, contact: 'community-transport@openchain' },
  { id: 'a2', type: 'Medical Transport', provider: 'Health Ride Network', description: 'Non-emergency medical transport to appointments', features: ['Climate controlled', 'Stretcher capable', 'Oxygen compatible'], availability: 'Daily, 6 AM - 8 PM', bookingRequired: true, contact: 'health-ride@openchain' },
  { id: 'a3', type: 'Walking Group (Assisted)', provider: 'Neighborhood Walkers', description: 'Guided walking groups with volunteer assistants for mobility-impaired residents', features: ['Slow pace option', 'Rest stops', 'Volunteer arm support'], availability: 'Tue, Thu, Sat — 9 AM', bookingRequired: false, contact: 'walkers@openchain' },
];

type Tab = 'rides' | 'offer' | 'routes' | 'accessible';

export function TransportScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('rides');
  const [offerDestination, setOfferDestination] = useState('');
  const [offerOrigin, setOfferOrigin] = useState('');
  const [offerSeats, setOfferSeats] = useState('');
  const [offerTime, setOfferTime] = useState('');
  const [offerType, setOfferType] = useState('');
  const [offerAccessible, setOfferAccessible] = useState(false);
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const stats = DEMO_STATS;
  const rides = DEMO_RIDES;
  const busRoutes = DEMO_BUS_ROUTES;
  const accessibleOptions = DEMO_ACCESSIBLE;

  const handleOfferRide = useCallback(() => {
    if (!offerDestination.trim()) { Alert.alert('Required', 'Enter a destination.'); return; }
    if (!offerOrigin.trim()) { Alert.alert('Required', 'Enter a pickup location.'); return; }
    const seats = parseInt(offerSeats, 10);
    if (!seats || seats <= 0) { Alert.alert('Required', 'Enter available seats.'); return; }
    if (!offerTime.trim()) { Alert.alert('Required', 'Enter departure time.'); return; }

    Alert.alert(
      'Ride Offered',
      `${offerOrigin} →${offerDestination}\n${seats} seat(s) at ${offerTime}\n\nYour ride is now visible to the community.`,
    );
    setOfferDestination('');
    setOfferOrigin('');
    setOfferSeats('');
    setOfferTime('');
    setOfferType('');
    setOfferAccessible(false);
    setTab('rides');
  }, [offerDestination, offerOrigin, offerSeats, offerTime]);

  const handleRequestRide = useCallback((ride: RideOffer) => {
    Alert.alert(
      'Request Ride',
      `Request a seat with ${ride.driverName}?\n\n${ride.origin} →${ride.destination}\nDeparts: ${ride.departureTime}\nSeats left: ${ride.seatsAvailable}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Request', onPress: () => Alert.alert('Requested', `Your ride request has been sent to ${ride.driverName}. You will be notified when confirmed.`) },
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
    tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.green + '20' },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: '600' },
    tabTextActive: { color: t.accent.green },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 12, marginHorizontal: 20 },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap', gap: 12 },
    statItem: { alignItems: 'center', minWidth: 80 },
    statValue: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2, textAlign: 'center' },
    impactCard: { backgroundColor: t.accent.green + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    impactText: { color: t.text.primary, fontSize: 15, fontWeight: '600', textAlign: 'center', lineHeight: 22 },
    rideCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    rideHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rideDriver: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    rideAccessibleBadge: { backgroundColor: t.accent.blue + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    rideAccessibleText: { color: t.accent.blue, fontSize: 10, fontWeight: '700' },
    rideRoute: { color: t.text.primary, fontSize: 14, fontWeight: '600', marginTop: 8 },
    rideMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    rideFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    rideCO2: { color: t.accent.green, fontSize: 13, fontWeight: '600' },
    rideRequestBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    rideRequestText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    seatsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
    seatDot: { width: 10, height: 10, borderRadius: 5, marginRight: 4 },
    seatAvailable: { backgroundColor: t.accent.green },
    seatTaken: { backgroundColor: t.text.muted + '40' },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: t.bg.primary },
    typeChipSelected: { backgroundColor: t.accent.green + '20', borderColor: t.accent.green },
    typeChipText: { color: t.text.muted, fontSize: 13, fontWeight: '600' },
    typeChipTextSelected: { color: t.accent.green },
    accessibleToggle: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingVertical: 8 },
    accessibleToggleText: { color: t.text.primary, fontSize: 14, fontWeight: '600', marginLeft: 8 },
    checkBox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: t.text.muted, justifyContent: 'center', alignItems: 'center' },
    checkBoxActive: { backgroundColor: t.accent.blue, borderColor: t.accent.blue },
    checkMark: { color: '#fff', fontSize: 14, fontWeight: '700' },
    submitBtn: { backgroundColor: t.accent.green, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    routeCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    routeName: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    routeMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    routeStops: { marginTop: 10 },
    stopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    stopDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: t.accent.blue, marginRight: 10 },
    stopLine: { width: 2, height: 12, backgroundColor: t.accent.blue + '40', marginLeft: 3, marginBottom: 2 },
    stopText: { color: t.text.primary, fontSize: 13 },
    routeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: t.bg.primary },
    nextDeparture: { color: t.accent.green, fontSize: 14, fontWeight: '700' },
    riderCount: { color: t.text.muted, fontSize: 12 },
    accessCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    accessType: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    accessProvider: { color: t.accent.blue, fontSize: 13, fontWeight: '600', marginTop: 2 },
    accessDesc: { color: t.text.muted, fontSize: 13, marginTop: 6 },
    featureList: { marginTop: 8 },
    featureItem: { color: t.text.primary, fontSize: 12, marginBottom: 2 },
    accessMeta: { color: t.text.muted, fontSize: 12, marginTop: 8 },
    bookBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-start', marginTop: 10 },
    bookBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: '700' },
  }), [t]);

  // ─── Tabs ───

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'rides', label: 'Rides' },
    { key: 'offer', label: 'Offer Ride' },
    { key: 'routes', label: 'Routes' },
    { key: 'accessible', label: 'Accessible' },
  ];

  // ─── Rides Tab ───

  const renderRides = () => (
    <>
      {/* Community Stats */}
      <View style={s.card}>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{stats.totalRidesShared.toLocaleString()}</Text>
            <Text style={s.statLabel}>Rides Shared</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.green }]}>{stats.totalCO2SavedKg.toLocaleString()}</Text>
            <Text style={s.statLabel}>kg CO2 Saved</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statValue}>{stats.activeDrivers}</Text>
            <Text style={s.statLabel}>Active Drivers</Text>
          </View>
        </View>
      </View>

      <View style={s.impactCard}>
        <Text style={s.impactText}>
          Community transport has saved {stats.totalCO2SavedKg.toLocaleString()} kg of CO2.{'\n'}
          {stats.walkingGroupMembers} neighbors walk together weekly.{'\n'}
          Every shared ride strengthens our community.
        </Text>
      </View>

      {/* Available Rides */}
      <Text style={s.sectionTitle}>Available Rides</Text>
      {rides.map((ride) => (
        <View key={ride.id} style={s.rideCard}>
          <View style={s.rideHeader}>
            <Text style={s.rideDriver}>{ride.driverName} — {ride.vehicleType}</Text>
            {ride.accessible && (
              <View style={s.rideAccessibleBadge}>
                <Text style={s.rideAccessibleText}>ACCESSIBLE</Text>
              </View>
            )}
          </View>
          <Text style={s.rideRoute}>{ride.origin} →{ride.destination}</Text>
          <Text style={s.rideMeta}>{ride.date} | Departs {ride.departureTime}</Text>
          <View style={s.seatsRow}>
            {Array.from({ length: ride.seatsTotal }).map((_, i) => (
              <View
                key={i}
                style={[s.seatDot, i < ride.seatsAvailable ? s.seatAvailable : s.seatTaken]}
              />
            ))}
            <Text style={[s.rideMeta, { marginTop: 0, marginLeft: 8 }]}>
              {ride.seatsAvailable}/{ride.seatsTotal} seats
            </Text>
          </View>
          <View style={s.rideFooter}>
            <Text style={s.rideCO2}>~{ride.estimatedCO2Saved} kg CO2 saved</Text>
            <TouchableOpacity style={s.rideRequestBtn} onPress={() => handleRequestRide(ride)}>
              <Text style={s.rideRequestText}>Request Seat</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </>
  );

  // ─── Offer Ride Tab ───

  const renderOffer = () => (
    <View style={s.card}>
      <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Offer a Ride</Text>

      <TextInput
        style={s.input}
        placeholder="Pickup location"
        placeholderTextColor={t.text.muted}
        value={offerOrigin}
        onChangeText={setOfferOrigin}
      />

      <TextInput
        style={s.input}
        placeholder="Destination"
        placeholderTextColor={t.text.muted}
        value={offerDestination}
        onChangeText={setOfferDestination}
      />

      <TextInput
        style={s.input}
        placeholder="Available seats"
        placeholderTextColor={t.text.muted}
        keyboardType="numeric"
        value={offerSeats}
        onChangeText={setOfferSeats}
      />

      <TextInput
        style={s.input}
        placeholder="Departure time (e.g. 08:30 AM)"
        placeholderTextColor={t.text.muted}
        value={offerTime}
        onChangeText={setOfferTime}
      />

      <Text style={[s.rideMeta, { marginBottom: 8 }]}>Vehicle Type</Text>
      <View style={s.typeGrid}>
        {TRANSPORT_TYPES.map((tt) => (
          <TouchableOpacity
            key={tt.key}
            style={[s.typeChip, offerType === tt.key && s.typeChipSelected]}
            onPress={() => setOfferType(tt.key)}
          >
            <Text style={[s.typeChipText, offerType === tt.key && s.typeChipTextSelected]}>
              {tt.icon} {tt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={s.accessibleToggle}
        onPress={() => setOfferAccessible(!offerAccessible)}
      >
        <View style={[s.checkBox, offerAccessible && s.checkBoxActive]}>
          {offerAccessible && <Text style={s.checkMark}>Y</Text>}
        </View>
        <Text style={s.accessibleToggleText}>Wheelchair accessible</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.submitBtn} onPress={handleOfferRide}>
        <Text style={s.submitText}>Offer Ride</Text>
      </TouchableOpacity>
    </View>
  );

  // ─── Routes Tab ───

  const renderRoutes = () => (
    <>
      <Text style={s.sectionTitle}>Community Bus Routes</Text>
      {busRoutes.map((route) => (
        <View key={route.id} style={s.routeCard}>
          <Text style={s.routeName}>{route.name}</Text>
          <Text style={s.routeMeta}>{route.frequency} | {route.operatingHours}</Text>
          {route.accessible && (
            <View style={[s.rideAccessibleBadge, { alignSelf: 'flex-start', marginTop: 6 }]}>
              <Text style={s.rideAccessibleText}>ACCESSIBLE</Text>
            </View>
          )}
          <View style={s.routeStops}>
            {route.stops.map((stop, idx) => (
              <View key={stop}>
                <View style={s.stopRow}>
                  <View style={s.stopDot} />
                  <Text style={s.stopText}>{stop}</Text>
                </View>
                {idx < route.stops.length - 1 && (
                  <View style={s.stopLine} />
                )}
              </View>
            ))}
          </View>
          <View style={s.routeFooter}>
            <Text style={s.nextDeparture}>Next: {route.nextDeparture}</Text>
            <Text style={s.riderCount}>{route.riderCount} riders this month</Text>
          </View>
        </View>
      ))}
    </>
  );

  // ─── Accessible Tab ───

  const renderAccessible = () => (
    <>
      <Text style={s.sectionTitle}>Accessible Transport</Text>

      <View style={s.card}>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{stats.accessibleTripsThisMonth}</Text>
            <Text style={s.statLabel}>Trips This Month</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statValue}>{stats.walkingGroupMembers}</Text>
            <Text style={s.statLabel}>Walking Group</Text>
          </View>
        </View>
      </View>

      {accessibleOptions.map((opt) => (
        <View key={opt.id} style={s.accessCard}>
          <Text style={s.accessType}>{opt.type}</Text>
          <Text style={s.accessProvider}>{opt.provider}</Text>
          <Text style={s.accessDesc}>{opt.description}</Text>
          <View style={s.featureList}>
            {opt.features.map((feat) => (
              <Text key={feat} style={s.featureItem}>* {feat}</Text>
            ))}
          </View>
          <Text style={s.accessMeta}>{opt.availability}</Text>
          <Text style={s.accessMeta}>Contact: {opt.contact}</Text>
          {opt.bookingRequired ? (
            <TouchableOpacity
              style={s.bookBtn}
              onPress={() => Alert.alert('Book Transport', `Contact ${opt.provider} at ${opt.contact} to book your ride.`)}
            >
              <Text style={s.bookBtnText}>Book Now</Text>
            </TouchableOpacity>
          ) : (
            <Text style={[s.accessMeta, { color: t.accent.green, fontWeight: '600' }]}>No booking required — just show up!</Text>
          )}
        </View>
      ))}
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Transport</Text>
        <View style={{ width: 60 }} />
      </View>

      {demoMode && (
        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO MODE</Text>
        </View>
      )}

      <View style={s.tabRow}>
        {tabs.map((tb) => (
          <TouchableOpacity
            key={tb.key}
            style={[s.tabBtn, tab === tb.key && s.tabActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {tab === 'rides' && renderRides()}
        {tab === 'offer' && renderOffer()}
        {tab === 'routes' && renderRoutes()}
        {tab === 'accessible' && renderAccessible()}
      </ScrollView>
    </SafeAreaView>
  );
}
