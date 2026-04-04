import { fonts } from '../utils/theme';
/**
 * Community Kitchen Screen — Shared community kitchen, meal prep, food distribution.
 *
 * Features:
 * - Kitchen schedule and bookings
 * - Volunteer for cooking shifts
 * - Meal distribution tracking
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

interface KitchenSlot {
  id: string;
  date: string;
  time: string;
  kitchen: string;
  activity: string;
  capacity: number;
  booked: number;
  organizer: string;
}

interface VolunteerShift {
  id: string;
  date: string;
  time: string;
  role: string;
  kitchen: string;
  spotsLeft: number;
  cotkReward: number;
}

interface MealRecord {
  id: string;
  name: string;
  date: string;
  servings: number;
  distributed: number;
  kitchen: string;
  volunteers: number;
  cotkEarned: number;
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_SCHEDULE: KitchenSlot[] = [
  { id: 'k1', date: '2026-03-30', time: '8:00 AM - 12:00 PM', kitchen: 'Main Community Kitchen', activity: 'Weekly Soup Kitchen', capacity: 12, booked: 10, organizer: 'Food For All' },
  { id: 'k2', date: '2026-03-30', time: '2:00 PM - 5:00 PM', kitchen: 'Main Community Kitchen', activity: 'Meal Prep Workshop', capacity: 8, booked: 5, organizer: 'Healthy Families' },
  { id: 'k3', date: '2026-03-31', time: '9:00 AM - 1:00 PM', kitchen: 'Eastside Kitchen', activity: 'Cultural Cooking Class', capacity: 15, booked: 12, organizer: 'Unity Kitchen' },
  { id: 'k4', date: '2026-04-01', time: '10:00 AM - 2:00 PM', kitchen: 'Main Community Kitchen', activity: 'Senior Lunch Program', capacity: 6, booked: 6, organizer: 'Elder Care Network' },
  { id: 'k5', date: '2026-04-02', time: '3:00 PM - 6:00 PM', kitchen: 'Eastside Kitchen', activity: 'Youth Cooking Club', capacity: 10, booked: 7, organizer: 'Youth Futures' },
];

const DEMO_SHIFTS: VolunteerShift[] = [
  { id: 's1', date: '2026-03-30', time: '7:00 AM - 12:30 PM', role: 'Head Cook', kitchen: 'Main Community Kitchen', spotsLeft: 1, cotkReward: 200 },
  { id: 's2', date: '2026-03-30', time: '7:00 AM - 12:30 PM', role: 'Prep Assistant', kitchen: 'Main Community Kitchen', spotsLeft: 3, cotkReward: 150 },
  { id: 's3', date: '2026-03-30', time: '11:00 AM - 1:00 PM', role: 'Serving', kitchen: 'Main Community Kitchen', spotsLeft: 4, cotkReward: 100 },
  { id: 's4', date: '2026-03-31', time: '8:00 AM - 1:30 PM', role: 'Instructor Assistant', kitchen: 'Eastside Kitchen', spotsLeft: 2, cotkReward: 175 },
  { id: 's5', date: '2026-04-01', time: '9:00 AM - 2:30 PM', role: 'Cleanup Crew', kitchen: 'Main Community Kitchen', spotsLeft: 5, cotkReward: 120 },
];

const DEMO_MEALS: MealRecord[] = [
  { id: 'ml1', name: 'Vegetable Soup & Bread', date: '2026-03-23', servings: 150, distributed: 148, kitchen: 'Main Community Kitchen', volunteers: 8, cotkEarned: 180 },
  { id: 'ml2', name: 'Rice & Bean Bowls', date: '2026-03-22', servings: 120, distributed: 120, kitchen: 'Eastside Kitchen', volunteers: 6, cotkEarned: 150 },
  { id: 'ml3', name: 'Pasta Night', date: '2026-03-16', servings: 180, distributed: 175, kitchen: 'Main Community Kitchen', volunteers: 10, cotkEarned: 200 },
  { id: 'ml4', name: 'Cultural Feast (Lunar New Year)', date: '2026-03-09', servings: 250, distributed: 250, kitchen: 'Eastside Kitchen', volunteers: 15, cotkEarned: 300 },
];

type Tab = 'schedule' | 'volunteer' | 'meals';

export function CommunityKitchenScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('schedule');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const handleBook = useCallback((slot: KitchenSlot) => {
    if (slot.booked >= slot.capacity) { Alert.alert('Full', 'This slot is fully booked.'); return; }
    Alert.alert('Book Slot', `Join "${slot.activity}"?\n\n${slot.date} ${slot.time}\n${slot.kitchen}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Book', onPress: () => Alert.alert('Booked!', 'You are registered.') },
    ]);
  }, []);

  const handleVolunteer = useCallback((shift: VolunteerShift) => {
    Alert.alert('Volunteer', `Sign up as ${shift.role}?\n\n${shift.date} ${shift.time}\nReward: ${shift.cotkReward} cOTK`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Up', onPress: () => Alert.alert('Signed Up!', 'Thank you for volunteering!') },
    ]);
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.orange + '20' },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.orange },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    slotCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    slotTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    slotMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    slotCapacity: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    bookBtn: { backgroundColor: t.accent.orange, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-start', marginTop: 10 },
    bookBtnText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.semibold },
    fullBadge: { backgroundColor: '#FF3B30', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginTop: 10 },
    fullText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.semibold },
    shiftCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    shiftRole: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    shiftMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    shiftReward: { color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.bold, marginTop: 6 },
    volBtn: { backgroundColor: t.accent.green, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-start', marginTop: 8 },
    volBtnText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.semibold },
    mealCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    mealName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    mealMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    mealStats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12, paddingTop: 12, borderTopColor: t.bg.primary, borderTopWidth: 1 },
    mealStat: { alignItems: 'center' },
    mealStatVal: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.heavy },
    mealStatLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
    summaryItem: { alignItems: 'center' },
    summaryValue: { color: t.text.primary, fontSize: fonts.xxl, fontWeight: fonts.heavy },
    summaryLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.bold },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'schedule', label: 'Schedule' },
    { key: 'volunteer', label: 'Volunteer' },
    { key: 'meals', label: 'Meals' },
  ];

  const renderSchedule = () => (
    <>
      <Text style={s.sectionTitle}>Kitchen Schedule</Text>
      {DEMO_SCHEDULE.map((slot) => (
        <View key={slot.id} style={s.slotCard}>
          <Text style={s.slotTitle}>{slot.activity}</Text>
          <Text style={s.slotMeta}>{slot.date} | {slot.time}</Text>
          <Text style={s.slotMeta}>{slot.kitchen} | Organized by {slot.organizer}</Text>
          <Text style={s.slotCapacity}>{slot.booked}/{slot.capacity} spots filled</Text>
          {slot.booked < slot.capacity ? (
            <TouchableOpacity style={s.bookBtn} onPress={() => handleBook(slot)}>
              <Text style={s.bookBtnText}>Book Spot</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.fullBadge}><Text style={s.fullText}>FULL</Text></View>
          )}
        </View>
      ))}
    </>
  );

  const renderVolunteer = () => (
    <>
      <Text style={s.sectionTitle}>Open Volunteer Shifts</Text>
      {DEMO_SHIFTS.map((shift) => (
        <View key={shift.id} style={s.shiftCard}>
          <Text style={s.shiftRole}>{shift.role}</Text>
          <Text style={s.shiftMeta}>{shift.date} | {shift.time}</Text>
          <Text style={s.shiftMeta}>{shift.kitchen} | {shift.spotsLeft} spots left</Text>
          <Text style={s.shiftReward}>+{shift.cotkReward} cOTK</Text>
          <TouchableOpacity style={s.volBtn} onPress={() => handleVolunteer(shift)}>
            <Text style={s.volBtnText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      ))}
    </>
  );

  const renderMeals = () => (
    <>
      <View style={s.card}>
        <View style={s.summaryRow}>
          <View style={s.summaryItem}>
            <Text style={s.summaryValue}>{DEMO_MEALS.reduce((s, m) => s + m.distributed, 0)}</Text>
            <Text style={s.summaryLabel}>Meals Served</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={[s.summaryValue, { color: t.accent.green }]}>{DEMO_MEALS.reduce((s, m) => s + m.cotkEarned, 0)}</Text>
            <Text style={s.summaryLabel}>cOTK Earned</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={s.summaryValue}>{DEMO_MEALS.reduce((s, m) => s + m.volunteers, 0)}</Text>
            <Text style={s.summaryLabel}>Volunteers</Text>
          </View>
        </View>
      </View>
      {DEMO_MEALS.map((meal) => (
        <View key={meal.id} style={s.mealCard}>
          <Text style={s.mealName}>{meal.name}</Text>
          <Text style={s.mealMeta}>{meal.date} | {meal.kitchen}</Text>
          <View style={s.mealStats}>
            <View style={s.mealStat}>
              <Text style={s.mealStatVal}>{meal.servings}</Text>
              <Text style={s.mealStatLabel}>Prepared</Text>
            </View>
            <View style={s.mealStat}>
              <Text style={[s.mealStatVal, { color: t.accent.green }]}>{meal.distributed}</Text>
              <Text style={s.mealStatLabel}>Served</Text>
            </View>
            <View style={s.mealStat}>
              <Text style={s.mealStatVal}>{meal.volunteers}</Text>
              <Text style={s.mealStatLabel}>Helpers</Text>
            </View>
          </View>
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
        <Text style={s.title}>Community Kitchen</Text>
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
        {tab === 'schedule' && renderSchedule()}
        {tab === 'volunteer' && renderVolunteer()}
        {tab === 'meals' && renderMeals()}
      </ScrollView>
    </SafeAreaView>
  );
}
