/**
 * Workshop Screen — Shared tools, makerspace, community workshop.
 *
 * Article I: "Every person deserves access to tools for creation and self-sufficiency."
 * xOTK represents exchange/sharing value.
 *
 * Features:
 * - Tool library — browse/borrow community tools (power tools, gardening, cooking, sewing, electronics)
 * - Borrow/return tracking with due dates
 * - Makerspace schedule — book time slots for shared workshop space
 * - Skill sharing — members teach tool usage (earn eOTK)
 * - Equipment maintenance log
 * - Demo: 8 tools, 2 active borrows, 3 upcoming makerspace slots
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface Tool {
  id: string;
  name: string;
  category: string;
  icon: string;
  available: boolean;
  condition: 'excellent' | 'good' | 'fair' | 'needs-repair';
  borrowedBy: string | null;
  dueDate: string | null;
  totalBorrows: number;
}

interface BorrowRecord {
  id: string;
  toolId: string;
  toolName: string;
  borrowerUID: string;
  borrowDate: string;
  dueDate: string;
  returnDate: string | null;
  status: 'active' | 'returned' | 'overdue';
}

interface MakerspaceSlot {
  id: string;
  date: string;
  timeSlot: string;
  area: string;
  bookedBy: string | null;
  capacity: number;
  enrolled: number;
}

interface SkillSession {
  id: string;
  title: string;
  teacherUID: string;
  teacherName: string;
  toolCategory: string;
  date: string;
  duration: number;
  spotsLeft: number;
  eotkReward: number;
}

interface MaintenanceEntry {
  id: string;
  toolId: string;
  toolName: string;
  date: string;
  type: 'cleaning' | 'repair' | 'inspection' | 'replacement';
  notes: string;
  performedBy: string;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const TOOL_CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'power', label: 'Power Tools', icon: 'P' },
  { key: 'garden', label: 'Gardening', icon: 'G' },
  { key: 'cooking', label: 'Cooking', icon: 'C' },
  { key: 'sewing', label: 'Sewing', icon: 'S' },
  { key: 'electronics', label: 'Electronics', icon: 'E' },
  { key: 'woodwork', label: 'Woodwork', icon: 'W' },
];

const CONDITION_COLORS: Record<string, string> = {
  excellent: '#34C759',
  good: '#007AFF',
  fair: '#FF9500',
  'needs-repair': '#FF3B30',
};

// ─── Demo Data ───

const DEMO_TOOLS: Tool[] = [
  { id: 't1', name: 'Cordless Drill', category: 'power', icon: 'P', available: true, condition: 'excellent', borrowedBy: null, dueDate: null, totalBorrows: 42 },
  { id: 't2', name: 'Circular Saw', category: 'power', icon: 'P', available: false, condition: 'good', borrowedBy: 'openchain1abc...maker_sam', dueDate: '2026-04-01', totalBorrows: 28 },
  { id: 't3', name: 'Garden Tiller', category: 'garden', icon: 'G', available: true, condition: 'good', borrowedBy: null, dueDate: null, totalBorrows: 19 },
  { id: 't4', name: 'Stand Mixer', category: 'cooking', icon: 'C', available: true, condition: 'excellent', borrowedBy: null, dueDate: null, totalBorrows: 56 },
  { id: 't5', name: 'Sewing Machine', category: 'sewing', icon: 'S', available: false, condition: 'fair', borrowedBy: 'openchain1def...crafter_li', dueDate: '2026-03-31', totalBorrows: 34 },
  { id: 't6', name: 'Soldering Station', category: 'electronics', icon: 'E', available: true, condition: 'excellent', borrowedBy: null, dueDate: null, totalBorrows: 22 },
  { id: 't7', name: 'Table Saw', category: 'woodwork', icon: 'W', available: true, condition: 'good', borrowedBy: null, dueDate: null, totalBorrows: 31 },
  { id: 't8', name: 'Pressure Washer', category: 'garden', icon: 'G', available: true, condition: 'fair', borrowedBy: null, dueDate: null, totalBorrows: 15 },
];

const DEMO_BORROWS: BorrowRecord[] = [
  { id: 'b1', toolId: 't2', toolName: 'Circular Saw', borrowerUID: 'you', borrowDate: '2026-03-25', dueDate: '2026-04-01', returnDate: null, status: 'active' },
  { id: 'b2', toolId: 't5', toolName: 'Sewing Machine', borrowerUID: 'you', borrowDate: '2026-03-27', dueDate: '2026-03-31', returnDate: null, status: 'active' },
  { id: 'b3', toolId: 't1', toolName: 'Cordless Drill', borrowerUID: 'you', borrowDate: '2026-03-10', dueDate: '2026-03-17', returnDate: '2026-03-16', status: 'returned' },
  { id: 'b4', toolId: 't4', toolName: 'Stand Mixer', borrowerUID: 'you', borrowDate: '2026-03-01', dueDate: '2026-03-08', returnDate: '2026-03-07', status: 'returned' },
];

const DEMO_MAKERSPACE: MakerspaceSlot[] = [
  { id: 'm1', date: '2026-03-30', timeSlot: '10:00 AM - 1:00 PM', area: 'Woodshop', bookedBy: null, capacity: 6, enrolled: 4 },
  { id: 'm2', date: '2026-03-31', timeSlot: '2:00 PM - 5:00 PM', area: 'Electronics Lab', bookedBy: null, capacity: 8, enrolled: 3 },
  { id: 'm3', date: '2026-04-01', timeSlot: '9:00 AM - 12:00 PM', area: 'Textile Studio', bookedBy: null, capacity: 10, enrolled: 7 },
  { id: 'm4', date: '2026-04-02', timeSlot: '1:00 PM - 4:00 PM', area: 'Woodshop', bookedBy: 'you', capacity: 6, enrolled: 6 },
  { id: 'm5', date: '2026-04-03', timeSlot: '10:00 AM - 1:00 PM', area: 'Kitchen', bookedBy: null, capacity: 12, enrolled: 5 },
];

const DEMO_SKILLS: SkillSession[] = [
  { id: 's1', title: 'Intro to Soldering', teacherUID: 'openchain1ghi...tech_raj', teacherName: 'Raj', toolCategory: 'electronics', date: '2026-04-01', duration: 2, spotsLeft: 4, eotkReward: 200 },
  { id: 's2', title: 'Safe Circular Saw Usage', teacherUID: 'openchain1jkl...wood_maria', teacherName: 'Maria', toolCategory: 'power', date: '2026-04-03', duration: 1.5, spotsLeft: 6, eotkReward: 150 },
  { id: 's3', title: 'Basic Sewing Repairs', teacherUID: 'openchain1mno...craft_yuki', teacherName: 'Yuki', toolCategory: 'sewing', date: '2026-04-05', duration: 2, spotsLeft: 3, eotkReward: 200 },
  { id: 's4', title: 'Garden Tool Maintenance', teacherUID: 'openchain1pqr...green_aisha', teacherName: 'Aisha', toolCategory: 'garden', date: '2026-04-06', duration: 1, spotsLeft: 8, eotkReward: 100 },
];

const DEMO_MAINTENANCE: MaintenanceEntry[] = [
  { id: 'mt1', toolId: 't2', toolName: 'Circular Saw', date: '2026-03-20', type: 'inspection', notes: 'Blade alignment checked, guard lubricated', performedBy: 'Workshop Admin' },
  { id: 'mt2', toolId: 't5', toolName: 'Sewing Machine', date: '2026-03-18', type: 'repair', notes: 'Tension spring replaced, bobbin case cleaned', performedBy: 'Maria' },
  { id: 'mt3', toolId: 't8', toolName: 'Pressure Washer', date: '2026-03-15', type: 'cleaning', notes: 'Nozzle descaled, filter cleaned', performedBy: 'Workshop Admin' },
  { id: 'mt4', toolId: 't1', toolName: 'Cordless Drill', date: '2026-03-12', type: 'inspection', notes: 'Battery tested at 94% capacity, chuck lubricated', performedBy: 'Raj' },
];

type Tab = 'tools' | 'borrow' | 'makerspace' | 'skills';

export function WorkshopScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('tools');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const filteredTools = useMemo(() =>
    categoryFilter === 'all'
      ? DEMO_TOOLS
      : DEMO_TOOLS.filter((tl) => tl.category === categoryFilter),
    [categoryFilter],
  );

  const activeBorrows = useMemo(() =>
    DEMO_BORROWS.filter((b) => b.status === 'active'),
    [],
  );

  const upcomingSlots = useMemo(() =>
    DEMO_MAKERSPACE.filter((m) => m.enrolled < m.capacity),
    [],
  );

  const handleBorrow = useCallback((tool: Tool) => {
    if (!tool.available) {
      Alert.alert('Unavailable', `${tool.name} is currently borrowed. Due back: ${tool.dueDate}`);
      return;
    }
    Alert.alert(
      'Borrow Tool',
      `Borrow ${tool.name} for 7 days?\n\nDue date: 2026-04-05\nCondition: ${tool.condition}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => Alert.alert('Borrowed', `${tool.name} checked out. Due: 2026-04-05`) },
      ],
    );
  }, []);

  const handleReturn = useCallback((record: BorrowRecord) => {
    Alert.alert(
      'Return Tool',
      `Return ${record.toolName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm Return', onPress: () => Alert.alert('Returned', `${record.toolName} returned successfully. Thank you!`) },
      ],
    );
  }, []);

  const handleBookSlot = useCallback((slot: MakerspaceSlot) => {
    if (slot.bookedBy === 'you') {
      Alert.alert('Already Booked', 'You are already enrolled in this slot.');
      return;
    }
    if (slot.enrolled >= slot.capacity) {
      Alert.alert('Full', 'This slot is at capacity.');
      return;
    }
    Alert.alert(
      'Book Slot',
      `Book ${slot.area}\n${slot.date} ${slot.timeSlot}?\n\nSpots remaining: ${slot.capacity - slot.enrolled}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Book', onPress: () => Alert.alert('Booked', `${slot.area} reserved for ${slot.date}.`) },
      ],
    );
  }, []);

  const handleJoinSkill = useCallback((session: SkillSession) => {
    Alert.alert(
      'Join Session',
      `${session.title}\nTaught by: ${session.teacherName}\n${session.date} (${session.duration}h)\n\nTeacher earns ${session.eotkReward} eOTK`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Join', onPress: () => Alert.alert('Enrolled', `You are signed up for "${session.title}".`) },
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
    tabActive: { backgroundColor: t.accent.blue + '20' },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: '600' },
    tabTextActive: { color: t.accent.blue },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 12, marginHorizontal: 20 },
    filterRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginBottom: 12, gap: 6 },
    filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: t.bg.secondary },
    filterChipActive: { backgroundColor: t.accent.blue + '20', borderColor: t.accent.blue },
    filterChipText: { color: t.text.muted, fontSize: 12, fontWeight: '600' },
    filterChipTextActive: { color: t.accent.blue },
    toolCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    toolHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    toolName: { color: t.text.primary, fontSize: 15, fontWeight: '700', flex: 1 },
    toolBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    toolBadgeText: { fontSize: 11, fontWeight: '700' },
    toolMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    toolFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    conditionDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    conditionRow: { flexDirection: 'row', alignItems: 'center' },
    conditionText: { color: t.text.muted, fontSize: 12 },
    borrowBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    borrowBtnDisabled: { backgroundColor: t.text.muted + '30' },
    borrowBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    borrowRow: { flexDirection: 'row', borderBottomColor: t.bg.primary, borderBottomWidth: 1, paddingVertical: 12 },
    borrowIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: t.accent.orange + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    borrowIconText: { color: t.accent.orange, fontSize: 16, fontWeight: '700' },
    borrowInfo: { flex: 1 },
    borrowName: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    borrowDue: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    borrowStatus: { fontSize: 11, fontWeight: '700', marginTop: 2 },
    returnBtn: { backgroundColor: t.accent.green, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, alignSelf: 'center' },
    returnBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    slotCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    slotHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    slotArea: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    slotDate: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    slotTime: { color: t.accent.blue, fontSize: 13, fontWeight: '600', marginTop: 2 },
    slotFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    slotCapacity: { color: t.text.muted, fontSize: 12 },
    slotBookBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    slotBookBtnFull: { backgroundColor: t.text.muted + '30' },
    slotBookBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    skillCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    skillTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    skillTeacher: { color: t.accent.blue, fontSize: 13, fontWeight: '600', marginTop: 4 },
    skillMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    skillFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    skillReward: { color: t.accent.green, fontSize: 14, fontWeight: '700' },
    skillJoinBtn: { backgroundColor: t.accent.green, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    skillJoinText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    maintenanceRow: { flexDirection: 'row', borderBottomColor: t.bg.primary, borderBottomWidth: 1, paddingVertical: 10 },
    maintenanceInfo: { flex: 1 },
    maintenanceTool: { color: t.text.primary, fontSize: 13, fontWeight: '600' },
    maintenanceNotes: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    maintenanceDate: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    maintenanceType: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
    maintenanceTypeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16, marginHorizontal: 20 },
    summaryItem: { alignItems: 'center', backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, flex: 1, marginHorizontal: 4 },
    summaryValue: { color: t.text.primary, fontSize: 24, fontWeight: '900' },
    summaryLabel: { color: t.text.muted, fontSize: 10, marginTop: 4, textAlign: 'center' },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: '700' },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
  }), [t]);

  // ─── Tabs ───

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'tools', label: 'Tools' },
    { key: 'borrow', label: 'Borrows' },
    { key: 'makerspace', label: 'Makerspace' },
    { key: 'skills', label: 'Skills' },
  ];

  // ─── Tools Tab ───

  const renderTools = () => (
    <>
      <View style={s.summaryRow}>
        <View style={s.summaryItem}>
          <Text style={s.summaryValue}>{DEMO_TOOLS.length}</Text>
          <Text style={s.summaryLabel}>Total Tools</Text>
        </View>
        <View style={s.summaryItem}>
          <Text style={[s.summaryValue, { color: t.accent.green }]}>{DEMO_TOOLS.filter((tl) => tl.available).length}</Text>
          <Text style={s.summaryLabel}>Available</Text>
        </View>
        <View style={s.summaryItem}>
          <Text style={[s.summaryValue, { color: t.accent.orange }]}>{activeBorrows.length}</Text>
          <Text style={s.summaryLabel}>Your Borrows</Text>
        </View>
      </View>

      <View style={s.filterRow}>
        {TOOL_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[s.filterChip, categoryFilter === cat.key && s.filterChipActive]}
            onPress={() => setCategoryFilter(cat.key)}
          >
            <Text style={[s.filterChipText, categoryFilter === cat.key && s.filterChipTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredTools.map((tool) => (
        <View key={tool.id} style={s.toolCard}>
          <View style={s.toolHeader}>
            <Text style={s.toolName}>{tool.name}</Text>
            <View style={[s.toolBadge, { backgroundColor: tool.available ? t.accent.green + '20' : t.accent.orange + '20' }]}>
              <Text style={[s.toolBadgeText, { color: tool.available ? t.accent.green : t.accent.orange }]}>
                {tool.available ? 'Available' : 'Borrowed'}
              </Text>
            </View>
          </View>
          <Text style={s.toolMeta}>
            Category: {tool.category} | Borrowed {tool.totalBorrows} times
          </Text>
          {!tool.available && tool.dueDate && (
            <Text style={[s.toolMeta, { color: t.accent.orange }]}>Due back: {tool.dueDate}</Text>
          )}
          <View style={s.toolFooter}>
            <View style={s.conditionRow}>
              <View style={[s.conditionDot, { backgroundColor: CONDITION_COLORS[tool.condition] }]} />
              <Text style={s.conditionText}>{tool.condition}</Text>
            </View>
            <TouchableOpacity
              style={[s.borrowBtn, !tool.available && s.borrowBtnDisabled]}
              onPress={() => handleBorrow(tool)}
            >
              <Text style={s.borrowBtnText}>{tool.available ? 'Borrow' : 'Unavailable'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </>
  );

  // ─── Borrow Tab ───

  const renderBorrow = () => (
    <>
      <Text style={s.sectionTitle}>Active Borrows</Text>
      {activeBorrows.length === 0 ? (
        <View style={s.card}>
          <Text style={[s.toolMeta, { textAlign: 'center' }]}>No active borrows</Text>
        </View>
      ) : (
        <View style={s.card}>
          {activeBorrows.map((record) => (
            <View key={record.id} style={s.borrowRow}>
              <View style={s.borrowIcon}>
                <Text style={s.borrowIconText}>T</Text>
              </View>
              <View style={s.borrowInfo}>
                <Text style={s.borrowName}>{record.toolName}</Text>
                <Text style={s.borrowDue}>Borrowed: {record.borrowDate}</Text>
                <Text style={[s.borrowDue, { color: t.accent.orange }]}>Due: {record.dueDate}</Text>
                <Text style={[s.borrowStatus, { color: record.status === 'overdue' ? '#FF3B30' : t.accent.green }]}>
                  {record.status.toUpperCase()}
                </Text>
              </View>
              <TouchableOpacity style={s.returnBtn} onPress={() => handleReturn(record)}>
                <Text style={s.returnBtnText}>Return</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <Text style={s.sectionTitle}>Return History</Text>
      <View style={s.card}>
        {DEMO_BORROWS.filter((b) => b.status === 'returned').map((record) => (
          <View key={record.id} style={s.borrowRow}>
            <View style={[s.borrowIcon, { backgroundColor: t.accent.green + '20' }]}>
              <Text style={[s.borrowIconText, { color: t.accent.green }]}>R</Text>
            </View>
            <View style={s.borrowInfo}>
              <Text style={s.borrowName}>{record.toolName}</Text>
              <Text style={s.borrowDue}>Borrowed: {record.borrowDate} - Returned: {record.returnDate}</Text>
              <Text style={[s.borrowStatus, { color: t.accent.green }]}>RETURNED</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={s.sectionTitle}>Equipment Maintenance Log</Text>
      <View style={s.card}>
        {DEMO_MAINTENANCE.map((entry) => (
          <View key={entry.id} style={s.maintenanceRow}>
            <View style={s.maintenanceInfo}>
              <Text style={s.maintenanceTool}>{entry.toolName}</Text>
              <Text style={s.maintenanceNotes}>{entry.notes}</Text>
              <Text style={s.maintenanceDate}>{entry.date} - {entry.performedBy}</Text>
            </View>
            <View style={[s.maintenanceType, { backgroundColor: entry.type === 'repair' ? '#FF3B30' + '20' : t.accent.blue + '20' }]}>
              <Text style={[s.maintenanceTypeText, { color: entry.type === 'repair' ? '#FF3B30' : t.accent.blue }]}>{entry.type}</Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );

  // ─── Makerspace Tab ───

  const renderMakerspace = () => (
    <>
      <Text style={s.sectionTitle}>Available Time Slots</Text>
      {DEMO_MAKERSPACE.map((slot) => {
        const full = slot.enrolled >= slot.capacity;
        const isYours = slot.bookedBy === 'you';
        return (
          <View key={slot.id} style={s.slotCard}>
            <View style={s.slotHeader}>
              <Text style={s.slotArea}>{slot.area}</Text>
              {isYours && (
                <View style={[s.toolBadge, { backgroundColor: t.accent.green + '20' }]}>
                  <Text style={[s.toolBadgeText, { color: t.accent.green }]}>Your Booking</Text>
                </View>
              )}
            </View>
            <Text style={s.slotDate}>{slot.date}</Text>
            <Text style={s.slotTime}>{slot.timeSlot}</Text>
            <View style={s.slotFooter}>
              <Text style={s.slotCapacity}>
                {slot.enrolled}/{slot.capacity} enrolled
              </Text>
              <TouchableOpacity
                style={[s.slotBookBtn, full && s.slotBookBtnFull]}
                onPress={() => handleBookSlot(slot)}
              >
                <Text style={s.slotBookBtnText}>
                  {isYours ? 'Booked' : full ? 'Full' : 'Book Slot'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </>
  );

  // ─── Skills Tab ───

  const renderSkills = () => (
    <>
      <View style={[s.card, { backgroundColor: t.accent.green + '12' }]}>
        <Text style={[s.skillTitle, { textAlign: 'center', marginBottom: 4 }]}>Skill Sharing</Text>
        <Text style={[s.toolMeta, { textAlign: 'center' }]}>
          Learn tool usage from community experts.{'\n'}
          Teachers earn eOTK for sharing knowledge.
        </Text>
      </View>

      <Text style={s.sectionTitle}>Upcoming Sessions</Text>
      {DEMO_SKILLS.map((session) => (
        <View key={session.id} style={s.skillCard}>
          <Text style={s.skillTitle}>{session.title}</Text>
          <Text style={s.skillTeacher}>Taught by {session.teacherName}</Text>
          <Text style={s.skillMeta}>
            {session.date} | {session.duration}h | {session.spotsLeft} spots left
          </Text>
          <View style={s.skillFooter}>
            <Text style={s.skillReward}>Teacher earns {session.eotkReward} eOTK</Text>
            <TouchableOpacity style={s.skillJoinBtn} onPress={() => handleJoinSkill(session)}>
              <Text style={s.skillJoinText}>Join</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <View style={s.card}>
        <Text style={[s.skillTitle, { textAlign: 'center', marginBottom: 8 }]}>Want to Teach?</Text>
        <Text style={[s.toolMeta, { textAlign: 'center' }]}>
          Share your tool expertise with the community.{'\n'}
          Earn eOTK for every session you teach.
        </Text>
        <TouchableOpacity
          style={[s.skillJoinBtn, { alignSelf: 'center', marginTop: 12 }]}
          onPress={() => Alert.alert('Coming Soon', 'Session creation will be available in a future update.')}
        >
          <Text style={s.skillJoinText}>Create Session</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // ─── Render ───

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Community Workshop</Text>
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
        {tab === 'tools' && renderTools()}
        {tab === 'borrow' && renderBorrow()}
        {tab === 'makerspace' && renderMakerspace()}
        {tab === 'skills' && renderSkills()}
      </ScrollView>
    </SafeAreaView>
  );
}
