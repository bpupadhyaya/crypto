import { fonts } from '../utils/theme';
/**
 * Resource Sharing Screen — Community resource sharing (tools, vehicles, spaces).
 *
 * Article I: "Every human is born with infinite potential worth."
 * Article III: cOTK represents community value — shared resources multiply it.
 *
 * Features:
 * - Available resources (lawnmower, projector, meeting room, van, printer)
 * - Reserve/borrow (select dates, confirm)
 * - Share your resources (list something you're willing to share)
 * - Active reservations and returns
 * - Demo mode with 6 available resources, 2 active borrows
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface Resource {
  id: string;
  name: string;
  description: string;
  category: string;
  owner: string;
  available: boolean;
  depositOTK: number;
  condition: string;
  location: string;
}

interface Reservation {
  id: string;
  resourceId: string;
  resourceName: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'returned' | 'overdue';
  depositOTK: number;
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_RESOURCES: Resource[] = [
  { id: 'r1', name: 'Electric Lawnmower', description: 'Cordless electric lawnmower with 40V battery. Good for small to medium lawns. Comes with charger.', category: 'Tools', owner: 'Marcus T.', available: true, depositOTK: 50, condition: 'Excellent', location: 'Oak Street Community Shed' },
  { id: 'r2', name: 'HD Projector', description: '1080p portable projector with HDMI and USB inputs. Great for movie nights, presentations, or outdoor screenings.', category: 'Electronics', owner: 'Priya S.', available: true, depositOTK: 75, condition: 'Good', location: 'Community Center Front Desk' },
  { id: 'r3', name: 'Meeting Room (4hr block)', description: 'Community center meeting room seats 20. Whiteboard, projector hookup, and Wi-Fi included.', category: 'Spaces', owner: 'Community Center', available: true, depositOTK: 0, condition: 'N/A', location: 'Community Center - Room 201' },
  { id: 'r4', name: 'Cargo Van', description: '2024 Ford Transit cargo van. Great for moving furniture or hauling supplies. Must return with full tank.', category: 'Vehicles', owner: 'Neighborhood Co-op', available: false, depositOTK: 200, condition: 'Good', location: 'Co-op Parking Lot' },
  { id: 'r5', name: 'Color Laser Printer', description: 'Brother color laser printer. Up to 100 pages per session. Bring your own paper or use community stock.', category: 'Electronics', owner: 'Library Annex', available: true, depositOTK: 20, condition: 'Excellent', location: 'Library Annex - 2nd Floor' },
  { id: 'r6', name: 'Camping Tent (6-person)', description: 'Large 6-person tent with rain fly, stakes, and carrying bag. Waterproof. Great for family camping.', category: 'Outdoor', owner: 'Jake & Luna W.', available: true, depositOTK: 60, condition: 'Good', location: 'Pickup at 412 Maple Ave' },
];

const DEMO_RESERVATIONS: Reservation[] = [
  { id: 'res1', resourceId: 'r4', resourceName: 'Cargo Van', startDate: '2026-03-28', endDate: '2026-03-29', status: 'active', depositOTK: 200 },
  { id: 'res2', resourceId: 'r2', resourceName: 'HD Projector', startDate: '2026-03-25', endDate: '2026-03-26', status: 'returned', depositOTK: 75 },
];

const RESOURCE_CATEGORIES = ['All', 'Tools', 'Electronics', 'Spaces', 'Vehicles', 'Outdoor'];

type Tab = 'browse' | 'share' | 'reservations';

export function ResourceSharingScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('browse');
  const [resources, setResources] = useState(DEMO_RESOURCES);
  const [reservations] = useState(DEMO_RESERVATIONS);
  const [filterCategory, setFilterCategory] = useState('All');

  // Reserve form
  const [reserveId, setReserveId] = useState<string | null>(null);
  const [reserveStart, setReserveStart] = useState('');
  const [reserveEnd, setReserveEnd] = useState('');

  // Share form
  const [shareName, setShareName] = useState('');
  const [shareDesc, setShareDesc] = useState('');
  const [shareCategory, setShareCategory] = useState('');
  const [shareDeposit, setShareDeposit] = useState('');
  const [shareLocation, setShareLocation] = useState('');
  const [shareCondition, setShareCondition] = useState('');

  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const filtered = useMemo(() => {
    const available = resources.filter((r) => r.available);
    if (filterCategory === 'All') return available;
    return available.filter((r) => r.category === filterCategory);
  }, [resources, filterCategory]);

  const activeReservations = useMemo(() => reservations.filter((r) => r.status === 'active'), [reservations]);

  const handleReserve = useCallback(() => {
    if (!reserveId) return;
    if (!reserveStart.trim() || !reserveEnd.trim()) {
      Alert.alert('Required', 'Enter start and end dates.');
      return;
    }
    const resource = resources.find((r) => r.id === reserveId);
    if (!resource) return;

    setResources((prev) => prev.map((r) => r.id === reserveId ? { ...r, available: false } : r));
    Alert.alert('Reserved!', `"${resource.name}" reserved from ${reserveStart} to ${reserveEnd}. Deposit: ${resource.depositOTK} OTK.`);
    setReserveId(null);
    setReserveStart('');
    setReserveEnd('');
  }, [reserveId, reserveStart, reserveEnd, resources]);

  const handleShare = useCallback(() => {
    if (!shareName.trim()) { Alert.alert('Required', 'Enter a resource name.'); return; }
    if (!shareDesc.trim()) { Alert.alert('Required', 'Enter a description.'); return; }
    if (!shareCategory) { Alert.alert('Required', 'Select a category.'); return; }
    if (!shareLocation.trim()) { Alert.alert('Required', 'Enter a pickup location.'); return; }

    Alert.alert('Resource Listed!', `"${shareName}" is now available for the community to borrow.`);
    setShareName('');
    setShareDesc('');
    setShareCategory('');
    setShareDeposit('');
    setShareLocation('');
    setShareCondition('');
    setTab('browse');
  }, [shareName, shareDesc, shareCategory, shareLocation]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.purple + '20' },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.purple },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    filterRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 6, marginBottom: 12 },
    filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: t.bg.secondary },
    filterActive: { backgroundColor: t.accent.purple + '20', borderColor: t.accent.purple },
    filterText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    filterTextActive: { color: t.accent.purple },
    resourceCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    resourceName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    resourceDesc: { color: t.text.muted, fontSize: fonts.sm, lineHeight: 19, marginTop: 6 },
    resourceMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 8 },
    resourceOwner: { color: t.accent.blue, fontSize: fonts.sm, fontWeight: fonts.semibold },
    resourceDeposit: { color: t.accent.orange, fontSize: fonts.sm, fontWeight: fonts.bold, marginTop: 6 },
    resourceCondition: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.semibold },
    reserveBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, alignSelf: 'flex-start', marginTop: 10 },
    reserveBtnText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.semibold },
    reserveForm: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, marginTop: 10 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md, marginBottom: 12 },
    inputMulti: { minHeight: 80, textAlignVertical: 'top' },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    categoryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: t.bg.primary },
    categoryChipSelected: { backgroundColor: t.accent.purple + '20', borderColor: t.accent.purple },
    categoryChipText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    categoryChipTextSelected: { color: t.accent.purple },
    submitBtn: { backgroundColor: t.accent.purple, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    confirmBtn: { backgroundColor: t.accent.green, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, alignSelf: 'flex-start', marginTop: 8 },
    confirmText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.semibold },
    cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, alignSelf: 'flex-start', marginTop: 8 },
    cancelText: { color: t.accent.blue, fontSize: fonts.sm, fontWeight: fonts.semibold },
    reservationCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    resName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    resDates: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    resStatus: { fontSize: fonts.sm, fontWeight: fonts.bold, marginTop: 6 },
    resDeposit: { color: t.accent.orange, fontSize: fonts.sm, fontWeight: fonts.semibold, marginTop: 4 },
    unavailableBadge: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginTop: 6 },
    unavailableText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.semibold },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.bold },
    emptyText: { color: t.text.muted, fontSize: fonts.md, textAlign: 'center', paddingVertical: 40 },
    dateRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
    dateInput: { flex: 1, backgroundColor: t.bg.secondary, borderRadius: 10, padding: 10, color: t.text.primary, fontSize: fonts.sm },
    btnRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'browse', label: 'Browse' },
    { key: 'share', label: 'Share Yours' },
    { key: 'reservations', label: 'Reservations' },
  ];

  // ─── Render Helpers ───

  const renderResourceCard = (r: Resource) => (
    <View key={r.id} style={s.resourceCard}>
      <Text style={s.resourceName}>{r.name}</Text>
      <Text style={s.resourceMeta}>{r.category} — <Text style={s.resourceCondition}>{r.condition}</Text></Text>
      <Text style={s.resourceDesc}>{r.description}</Text>
      <Text style={s.resourceMeta}>{r.location}</Text>
      <Text style={s.resourceOwner}>Shared by {r.owner}</Text>
      {r.depositOTK > 0 && (
        <Text style={s.resourceDeposit}>Deposit: {r.depositOTK} OTK (refunded on return)</Text>
      )}
      {reserveId === r.id ? (
        <View style={s.reserveForm}>
          <Text style={{ color: t.text.muted, fontSize: fonts.sm, marginBottom: 4 }}>Select dates</Text>
          <View style={s.dateRow}>
            <TextInput style={s.dateInput} placeholder="Start (YYYY-MM-DD)" placeholderTextColor={t.text.muted} value={reserveStart} onChangeText={setReserveStart} />
            <TextInput style={s.dateInput} placeholder="End (YYYY-MM-DD)" placeholderTextColor={t.text.muted} value={reserveEnd} onChangeText={setReserveEnd} />
          </View>
          <View style={s.btnRow}>
            <TouchableOpacity style={s.confirmBtn} onPress={handleReserve}>
              <Text style={s.confirmText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setReserveId(null)}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={s.reserveBtn} onPress={() => setReserveId(r.id)}>
          <Text style={s.reserveBtnText}>Reserve</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderBrowse = () => (
    <>
      <View style={s.filterRow}>
        {RESOURCE_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[s.filterChip, filterCategory === cat && s.filterActive]}
            onPress={() => setFilterCategory(cat)}
          >
            <Text style={[s.filterText, filterCategory === cat && s.filterTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={s.sectionTitle}>Available Resources ({filtered.length})</Text>
      {filtered.map(renderResourceCard)}
    </>
  );

  const renderShare = () => (
    <View style={s.card}>
      <Text style={s.sectionTitle}>Share a Resource</Text>
      <TextInput style={s.input} placeholder="Resource Name" placeholderTextColor={t.text.muted} value={shareName} onChangeText={setShareName} />
      <TextInput style={[s.input, s.inputMulti]} placeholder="Description — what is it, any instructions?" placeholderTextColor={t.text.muted} value={shareDesc} onChangeText={setShareDesc} multiline />
      <Text style={{ color: t.text.muted, fontSize: fonts.sm, marginBottom: 8 }}>Category</Text>
      <View style={s.categoryGrid}>
        {RESOURCE_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[s.categoryChip, shareCategory === cat && s.categoryChipSelected]}
            onPress={() => setShareCategory(cat)}
          >
            <Text style={[s.categoryChipText, shareCategory === cat && s.categoryChipTextSelected]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput style={s.input} placeholder="Condition (Excellent, Good, Fair)" placeholderTextColor={t.text.muted} value={shareCondition} onChangeText={setShareCondition} />
      <TextInput style={s.input} placeholder="Deposit OTK (0 if none)" placeholderTextColor={t.text.muted} keyboardType="numeric" value={shareDeposit} onChangeText={setShareDeposit} />
      <TextInput style={s.input} placeholder="Pickup Location" placeholderTextColor={t.text.muted} value={shareLocation} onChangeText={setShareLocation} />
      <TouchableOpacity style={s.submitBtn} onPress={handleShare}>
        <Text style={s.submitText}>List Resource</Text>
      </TouchableOpacity>
    </View>
  );

  const renderReservations = () => (
    <>
      <Text style={s.sectionTitle}>Active Reservations ({activeReservations.length})</Text>
      {reservations.length === 0 ? (
        <Text style={s.emptyText}>No reservations yet.</Text>
      ) : (
        reservations.map((res) => (
          <View key={res.id} style={s.reservationCard}>
            <Text style={s.resName}>{res.resourceName}</Text>
            <Text style={s.resDates}>{res.startDate} to {res.endDate}</Text>
            <Text style={[s.resStatus, {
              color: res.status === 'active' ? t.accent.blue : res.status === 'returned' ? t.accent.green : t.accent.orange,
            }]}>
              {res.status === 'active' ? 'Currently Borrowed' : res.status === 'returned' ? 'Returned' : 'Overdue'}
            </Text>
            <Text style={s.resDeposit}>Deposit: {res.depositOTK} OTK</Text>
          </View>
        ))
      )}
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Resource Sharing</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
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

      <ScrollView contentContainerStyle={s.scroll}>
        {tab === 'browse' && renderBrowse()}
        {tab === 'share' && renderShare()}
        {tab === 'reservations' && renderReservations()}
      </ScrollView>
    </SafeAreaView>
  );
}
