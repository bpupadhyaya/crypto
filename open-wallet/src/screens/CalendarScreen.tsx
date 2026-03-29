/**
 * Calendar Screen — Unified community events calendar.
 *
 * Art I — Aggregates governance, health, education, community,
 * sports, culture, worship, and environment events into a single
 * color-coded calendar with RSVP tracking and personal events.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Modal, TextInput,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// --- Types ---

type EventCategory =
  | 'governance' | 'health' | 'education' | 'community'
  | 'sports' | 'culture' | 'worship' | 'environment'
  | 'personal';

interface CalendarEvent {
  id: string;
  title: string;
  category: EventCategory;
  date: string;        // YYYY-MM-DD
  time: string;        // HH:MM
  duration: number;    // minutes
  location: string;
  description: string;
  rsvpCount: number;
  rsvped: boolean;
  isPersonal: boolean;
}

type TabKey = 'today' | 'week' | 'month' | 'add';

const CATEGORY_COLORS: Record<EventCategory, string> = {
  governance: '#6366f1',
  health: '#10b981',
  education: '#f59e0b',
  community: '#ec4899',
  sports: '#ef4444',
  culture: '#8b5cf6',
  worship: '#14b8a6',
  environment: '#22c55e',
  personal: '#64748b',
};

const CATEGORY_ICONS: Record<EventCategory, string> = {
  governance: '\u{1F3DB}',   // classical building
  health: '\u{1F49A}',       // green heart
  education: '\u{1F4DA}',    // books
  community: '\u{1F91D}',    // handshake
  sports: '\u26BD',           // soccer ball
  culture: '\u{1F3A8}',      // palette
  worship: '\u{1F54C}',      // mosque / place of worship
  environment: '\u{1F333}',  // deciduous tree
  personal: '\u{1F4CC}',     // pushpin
};

// --- Helpers ---

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function weekDates(): string[] {
  const dates: string[] = [];
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    );
  }
  return dates;
}

function monthDates(): string[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dates: string[] = [];
  for (let i = 1; i <= daysInMonth; i++) {
    dates.push(
      `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
    );
  }
  return dates;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

// --- Demo data ---

function demoDates(): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    dates.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    );
  }
  return dates;
}

function buildDemoEvents(): CalendarEvent[] {
  const dd = demoDates();
  return [
    {
      id: 'evt_001', title: 'Town Hall: Budget Review',
      category: 'governance', date: dd[0], time: '18:00', duration: 90,
      location: 'Community Center Hall A',
      description: 'Quarterly budget review and open discussion on allocation priorities for next quarter.',
      rsvpCount: 47, rsvped: true, isPersonal: false,
    },
    {
      id: 'evt_002', title: 'Free Health Screening Camp',
      category: 'health', date: dd[1], time: '09:00', duration: 240,
      location: 'Public Library Annex',
      description: 'Blood pressure, diabetes, and vision screening. No appointment needed.',
      rsvpCount: 132, rsvped: false, isPersonal: false,
    },
    {
      id: 'evt_003', title: 'Youth Coding Workshop',
      category: 'education', date: dd[2], time: '14:00', duration: 120,
      location: 'Innovation Hub, Room 3',
      description: 'Introduction to programming for ages 10-16. Laptops provided.',
      rsvpCount: 24, rsvped: false, isPersonal: false,
    },
    {
      id: 'evt_004', title: 'Neighborhood Clean-Up Drive',
      category: 'environment', date: dd[2], time: '08:00', duration: 180,
      location: 'Riverside Park Entrance',
      description: 'Monthly community clean-up. Gloves and bags provided. All ages welcome.',
      rsvpCount: 56, rsvped: true, isPersonal: false,
    },
    {
      id: 'evt_005', title: 'Weekend Soccer Tournament',
      category: 'sports', date: dd[4], time: '10:00', duration: 300,
      location: 'Central Sports Ground',
      description: 'Inter-neighborhood 5-a-side tournament. Registration open until Thursday.',
      rsvpCount: 88, rsvped: false, isPersonal: false,
    },
    {
      id: 'evt_006', title: 'Cultural Heritage Festival',
      category: 'culture', date: dd[5], time: '16:00', duration: 240,
      location: 'Town Square',
      description: 'Music, dance, food, and storytelling from diverse community traditions.',
      rsvpCount: 215, rsvped: true, isPersonal: false,
    },
    {
      id: 'evt_007', title: 'Interfaith Dialogue Circle',
      category: 'worship', date: dd[3], time: '11:00', duration: 90,
      location: 'Peace Center',
      description: 'Monthly gathering for sharing spiritual wisdom across traditions.',
      rsvpCount: 19, rsvped: false, isPersonal: false,
    },
    {
      id: 'evt_008', title: 'Community Garden Planting Day',
      category: 'community', date: dd[6], time: '07:30', duration: 150,
      location: 'Block 7 Community Garden',
      description: 'Seasonal planting session. Seeds and tools provided. Bring water!',
      rsvpCount: 34, rsvped: false, isPersonal: false,
    },
    // Personal events
    {
      id: 'evt_p01', title: 'Dentist Appointment',
      category: 'personal', date: dd[1], time: '15:30', duration: 60,
      location: 'Dr. Patel Dental Clinic',
      description: 'Regular 6-month check-up and cleaning.',
      rsvpCount: 0, rsvped: false, isPersonal: true,
    },
    {
      id: 'evt_p02', title: 'Family Dinner at Grandma\'s',
      category: 'personal', date: dd[5], time: '19:00', duration: 120,
      location: 'Grandma\'s House',
      description: 'Monthly family gathering. Bring dessert.',
      rsvpCount: 0, rsvped: false, isPersonal: true,
    },
  ];
}

// --- Component ---

interface Props {
  onClose: () => void;
}

export function CalendarScreen({ onClose }: Props) {
  const t = useTheme();
  const demoMode = useWalletStore(s => s.demoMode);
  const [tab, setTab] = useState<TabKey>('today');
  const [events, setEvents] = useState<CalendarEvent[]>(buildDemoEvents);
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [filterCategory, setFilterCategory] = useState<EventCategory | null>(null);

  // Add-event form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<EventCategory>('personal');
  const [newTime, setNewTime] = useState('12:00');
  const [newLocation, setNewLocation] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDuration, setNewDuration] = useState('60');

  const today = todayStr();
  const week = useMemo(() => weekDates(), []);
  const month = useMemo(() => monthDates(), []);

  const visibleEvents = useMemo(() => {
    let pool = events;
    if (filterCategory) {
      pool = pool.filter(e => e.category === filterCategory);
    }
    if (tab === 'today') return pool.filter(e => e.date === today);
    if (tab === 'week') return pool.filter(e => week.includes(e.date));
    if (tab === 'month') return pool.filter(e => month.includes(e.date));
    return pool;
  }, [events, tab, today, week, month, filterCategory]);

  const grouped = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const ev of visibleEvents) {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    }
    const sorted = Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
    for (const [, list] of sorted) {
      list.sort((a, b) => a.time.localeCompare(b.time));
    }
    return sorted;
  }, [visibleEvents]);

  const stats = useMemo(() => {
    const byCat: Record<string, number> = {};
    let rsvped = 0;
    for (const ev of events) {
      byCat[ev.category] = (byCat[ev.category] || 0) + 1;
      if (ev.rsvped) rsvped++;
    }
    return { total: events.length, byCat, rsvped };
  }, [events]);

  function toggleRsvp(id: string) {
    setEvents(prev => prev.map(e =>
      e.id === id
        ? { ...e, rsvped: !e.rsvped, rsvpCount: e.rsvpCount + (e.rsvped ? -1 : 1) }
        : e,
    ));
    if (selected?.id === id) {
      setSelected(prev => prev
        ? { ...prev, rsvped: !prev.rsvped, rsvpCount: prev.rsvpCount + (prev.rsvped ? -1 : 1) }
        : null,
      );
    }
  }

  function addEvent() {
    if (!newTitle.trim()) return;
    const ev: CalendarEvent = {
      id: `evt_new_${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      date: today,
      time: newTime,
      duration: parseInt(newDuration, 10) || 60,
      location: newLocation.trim() || 'TBD',
      description: newDescription.trim(),
      rsvpCount: 0,
      rsvped: false,
      isPersonal: newCategory === 'personal',
    };
    setEvents(prev => [...prev, ev]);
    setNewTitle('');
    setNewLocation('');
    setNewDescription('');
    setNewDuration('60');
    setTab('today');
  }

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    title: { fontSize: 20, fontWeight: '700', color: t.text.primary },
    closeBtn: {
      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
      backgroundColor: t.bg.card,
    },
    closeTxt: { color: t.text.secondary, fontSize: 14, fontWeight: '600' },

    tabs: {
      flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 8,
    },
    tab: {
      flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center',
      backgroundColor: t.bg.card,
    },
    tabActive: { backgroundColor: t.accent.green },
    tabTxt: { fontSize: 13, fontWeight: '600', color: t.text.secondary },
    tabTxtActive: { color: '#fff' },

    filterRow: {
      flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12,
      paddingBottom: 8, gap: 6,
    },
    filterChip: {
      flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10,
      paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: t.border,
    },
    filterChipActive: { borderWidth: 2 },
    filterChipTxt: { fontSize: 11, color: t.text.secondary, marginLeft: 4 },

    statsRow: {
      flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 12,
    },
    statBox: {
      flex: 1, padding: 10, borderRadius: 10, backgroundColor: t.bg.card,
      alignItems: 'center',
    },
    statVal: { fontSize: 18, fontWeight: '700', color: t.accent.green },
    statLabel: { fontSize: 11, color: t.text.secondary, marginTop: 2 },

    scroll: { flex: 1 },
    dateHeader: {
      paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6,
    },
    dateTxt: { fontSize: 14, fontWeight: '700', color: t.text.secondary },

    card: {
      marginHorizontal: 16, marginBottom: 8, padding: 14, borderRadius: 12,
      backgroundColor: t.bg.card, borderLeftWidth: 4,
    },
    cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    cardIcon: { fontSize: 18, marginRight: 8 },
    cardTitle: { fontSize: 15, fontWeight: '600', color: t.text.primary, flex: 1 },
    cardTime: { fontSize: 12, color: t.text.secondary },
    cardLoc: { fontSize: 12, color: t.text.secondary, marginTop: 2 },
    cardBottom: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      marginTop: 8,
    },
    rsvpBadge: {
      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    },
    rsvpTxt: { fontSize: 11, fontWeight: '600' },
    rsvpCount: { fontSize: 11, color: t.text.secondary },
    personalBadge: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: t.bg.primary,
      paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
    },
    personalTxt: { fontSize: 10, color: t.text.secondary, marginLeft: 4 },

    empty: { alignItems: 'center', paddingTop: 60 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyTxt: { fontSize: 15, color: t.text.secondary },

    // Detail modal
    modalOverlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center', padding: 20,
    },
    modalCard: {
      backgroundColor: t.bg.primary, borderRadius: 16, padding: 20, borderLeftWidth: 5,
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: t.text.primary, marginBottom: 4 },
    modalCat: { fontSize: 13, color: t.text.secondary, marginBottom: 12 },
    modalDesc: { fontSize: 14, color: t.text.primary, lineHeight: 20, marginBottom: 12 },
    modalInfo: { fontSize: 13, color: t.text.secondary, marginBottom: 4 },
    modalActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
    modalBtn: {
      flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
    },
    modalBtnTxt: { fontWeight: '600', fontSize: 14 },

    // Add event form
    formSection: { paddingHorizontal: 16, paddingTop: 12 },
    formLabel: { fontSize: 13, fontWeight: '600', color: t.text.secondary, marginBottom: 4, marginTop: 12 },
    formInput: {
      borderWidth: 1, borderColor: t.border, borderRadius: 10, padding: 10,
      fontSize: 14, color: t.text.primary, backgroundColor: t.bg.card,
    },
    formTextArea: { minHeight: 80, textAlignVertical: 'top' },
    catPicker: {
      flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4,
    },
    catOption: {
      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
      borderWidth: 1, borderColor: t.border,
    },
    catOptionActive: { borderWidth: 2 },
    catOptionTxt: { fontSize: 12, fontWeight: '600' },
    addBtn: {
      marginTop: 20, marginBottom: 40, paddingVertical: 14, borderRadius: 12,
      backgroundColor: t.accent.green, alignItems: 'center',
    },
    addBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },

    demoBar: {
      backgroundColor: '#fef3c7', paddingVertical: 6, alignItems: 'center',
    },
    demoTxt: { fontSize: 11, color: '#92400e', fontWeight: '600' },
  }), [t]);

  // --- Render helpers ---

  function renderTabs() {
    const tabs: { key: TabKey; label: string }[] = [
      { key: 'today', label: 'Today' },
      { key: 'week', label: 'Week' },
      { key: 'month', label: 'Month' },
      { key: 'add', label: '+ Add' },
    ];
    return (
      <View style={styles.tabs}>
        {tabs.map(tb => (
          <TouchableOpacity
            key={tb.key}
            style={[styles.tab, tab === tb.key && styles.tabActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={[styles.tabTxt, tab === tb.key && styles.tabTxtActive]}>
              {tb.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  function renderFilters() {
    const categories = Object.keys(CATEGORY_COLORS) as EventCategory[];
    return (
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, !filterCategory && { backgroundColor: t.accent + '22' }]}
          onPress={() => setFilterCategory(null)}
        >
          <Text style={[styles.filterChipTxt, !filterCategory && { color: t.accent.green, fontWeight: '700' }]}>
            All
          </Text>
        </TouchableOpacity>
        {categories.map(cat => {
          const active = filterCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filterChip,
                active && styles.filterChipActive,
                active && { borderColor: CATEGORY_COLORS[cat], backgroundColor: CATEGORY_COLORS[cat] + '18' },
              ]}
              onPress={() => setFilterCategory(active ? null : cat)}
            >
              <Text style={{ fontSize: 12 }}>{CATEGORY_ICONS[cat]}</Text>
              <Text style={[styles.filterChipTxt, active && { color: CATEGORY_COLORS[cat], fontWeight: '700' }]}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  function renderStats() {
    return (
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{stats.total}</Text>
          <Text style={styles.statLabel}>Events</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{stats.rsvped}</Text>
          <Text style={styles.statLabel}>RSVP'd</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{visibleEvents.length}</Text>
          <Text style={styles.statLabel}>Showing</Text>
        </View>
      </View>
    );
  }

  function renderEventCard(ev: CalendarEvent) {
    const catColor = CATEGORY_COLORS[ev.category];
    return (
      <TouchableOpacity
        key={ev.id}
        style={[styles.card, { borderLeftColor: catColor }]}
        onPress={() => setSelected(ev)}
      >
        <View style={styles.cardRow}>
          <Text style={styles.cardIcon}>{CATEGORY_ICONS[ev.category]}</Text>
          <Text style={styles.cardTitle} numberOfLines={1}>{ev.title}</Text>
          <Text style={styles.cardTime}>{ev.time}</Text>
        </View>
        <Text style={styles.cardLoc}>{ev.location} \u2022 {ev.duration} min</Text>
        <View style={styles.cardBottom}>
          {ev.isPersonal ? (
            <View style={styles.personalBadge}>
              <Text style={{ fontSize: 10 }}>{CATEGORY_ICONS.personal}</Text>
              <Text style={styles.personalTxt}>Personal</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.rsvpBadge, { backgroundColor: ev.rsvped ? catColor + '22' : t.bg.primary }]}
              onPress={() => toggleRsvp(ev.id)}
            >
              <Text style={[styles.rsvpTxt, { color: ev.rsvped ? catColor : t.text.secondary }]}>
                {ev.rsvped ? '\u2713 RSVP\'d' : 'RSVP'}
              </Text>
            </TouchableOpacity>
          )}
          {!ev.isPersonal && (
            <Text style={styles.rsvpCount}>{ev.rsvpCount} attending</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  function renderEventList() {
    if (grouped.length === 0) {
      return (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>{'\u{1F4C5}'}</Text>
          <Text style={styles.emptyTxt}>No events for this period</Text>
        </View>
      );
    }
    return grouped.map(([date, evts]) => (
      <View key={date}>
        <View style={styles.dateHeader}>
          <Text style={styles.dateTxt}>
            {date === today ? `Today \u2014 ${formatDate(date)}` : formatDate(date)}
          </Text>
        </View>
        {evts.map(renderEventCard)}
      </View>
    ));
  }

  function renderAddForm() {
    const categories = Object.keys(CATEGORY_COLORS) as EventCategory[];
    return (
      <ScrollView style={styles.scroll}>
        <View style={styles.formSection}>
          <Text style={[styles.title, { marginBottom: 4 }]}>Add Event</Text>
          <Text style={{ fontSize: 13, color: t.text.secondary }}>
            Create a personal or community event
          </Text>

          <Text style={styles.formLabel}>Title</Text>
          <TextInput
            style={styles.formInput}
            value={newTitle}
            onChangeText={setNewTitle}
            placeholder="Event title"
            placeholderTextColor={t.text.secondary}
          />

          <Text style={styles.formLabel}>Category</Text>
          <View style={styles.catPicker}>
            {categories.map(cat => {
              const active = newCategory === cat;
              const color = CATEGORY_COLORS[cat];
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catOption,
                    active && styles.catOptionActive,
                    active && { borderColor: color, backgroundColor: color + '18' },
                  ]}
                  onPress={() => setNewCategory(cat)}
                >
                  <Text style={[styles.catOptionTxt, { color: active ? color : t.text.secondary }]}>
                    {CATEGORY_ICONS[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.formLabel}>Time (HH:MM)</Text>
          <TextInput
            style={styles.formInput}
            value={newTime}
            onChangeText={setNewTime}
            placeholder="12:00"
            placeholderTextColor={t.text.secondary}
          />

          <Text style={styles.formLabel}>Duration (minutes)</Text>
          <TextInput
            style={styles.formInput}
            value={newDuration}
            onChangeText={setNewDuration}
            placeholder="60"
            placeholderTextColor={t.text.secondary}
            keyboardType="numeric"
          />

          <Text style={styles.formLabel}>Location</Text>
          <TextInput
            style={styles.formInput}
            value={newLocation}
            onChangeText={setNewLocation}
            placeholder="Where is this event?"
            placeholderTextColor={t.text.secondary}
          />

          <Text style={styles.formLabel}>Description</Text>
          <TextInput
            style={[styles.formInput, styles.formTextArea]}
            value={newDescription}
            onChangeText={setNewDescription}
            placeholder="What is this event about?"
            placeholderTextColor={t.text.secondary}
            multiline
          />

          <TouchableOpacity style={styles.addBtn} onPress={addEvent}>
            <Text style={styles.addBtnTxt}>Add Event</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  function renderDetailModal() {
    if (!selected) return null;
    const catColor = CATEGORY_COLORS[selected.category];
    return (
      <Modal transparent animationType="fade" visible onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { borderLeftColor: catColor }]}>
            <Text style={styles.modalTitle}>
              {CATEGORY_ICONS[selected.category]} {selected.title}
            </Text>
            <Text style={styles.modalCat}>
              {selected.category.charAt(0).toUpperCase() + selected.category.slice(1)}
              {selected.isPersonal ? ' \u2022 Personal' : ''}
            </Text>
            <Text style={styles.modalDesc}>{selected.description}</Text>
            <Text style={styles.modalInfo}>
              {'\u{1F4CD}'} {selected.location}
            </Text>
            <Text style={styles.modalInfo}>
              {'\u{1F552}'} {selected.time} \u2022 {selected.duration} min
            </Text>
            <Text style={styles.modalInfo}>
              {'\u{1F4C5}'} {formatDate(selected.date)}
            </Text>
            {!selected.isPersonal && (
              <Text style={styles.modalInfo}>
                {'\u{1F465}'} {selected.rsvpCount} attending
              </Text>
            )}
            <View style={styles.modalActions}>
              {!selected.isPersonal && (
                <TouchableOpacity
                  style={[styles.modalBtn, {
                    backgroundColor: selected.rsvped ? t.bg.card : catColor,
                  }]}
                  onPress={() => toggleRsvp(selected.id)}
                >
                  <Text style={[styles.modalBtnTxt, {
                    color: selected.rsvped ? t.text.secondary : '#fff',
                  }]}>
                    {selected.rsvped ? 'Cancel RSVP' : 'RSVP'}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: t.bg.card }]}
                onPress={() => setSelected(null)}
              >
                <Text style={[styles.modalBtnTxt, { color: t.text.secondary }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // --- Main render ---

  return (
    <SafeAreaView style={styles.container}>
      {demoMode && (
        <View style={styles.demoBar}>
          <Text style={styles.demoTxt}>Demo Mode \u2014 Sample events shown</Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.title}>{'\u{1F4C5}'} Community Calendar</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeTxt}>Close</Text>
        </TouchableOpacity>
      </View>

      {renderTabs()}

      {tab !== 'add' && (
        <>
          {renderFilters()}
          {renderStats()}
          <ScrollView style={styles.scroll}>
            {renderEventList()}
            <View style={{ height: 40 }} />
          </ScrollView>
        </>
      )}

      {tab === 'add' && renderAddForm()}
      {renderDetailModal()}
    </SafeAreaView>
  );
}
