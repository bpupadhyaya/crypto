/**
 * Community Radio Screen — Community announcements and broadcasts.
 *
 * Article I: "Every community voice deserves to be heard."
 * Article III: cOTK represents community value.
 *
 * Features:
 * - Community announcements feed with broadcasts from leaders, DAOs, governance
 * - Create announcement (title, message, category, target audience)
 * - Filter announcements by category chips
 * - Pinned announcements (important, stays at top)
 * - Event calendar — upcoming community events
 * - Celebration board — milestones, achievements, gratitude highlights
 * - Read receipts — how many people saw the announcement
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

type AnnouncementCategory = 'general' | 'emergency' | 'event' | 'governance' | 'celebration';
type TargetAudience = 'all' | 'region' | 'DAO';

interface Announcement {
  id: string;
  title: string;
  message: string;
  category: AnnouncementCategory;
  target: TargetAudience;
  author: string;
  authorRole: string;
  date: string;
  pinned: boolean;
  readCount: number;
  totalRecipients: number;
}

interface CommunityEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  sourceAnnouncementId: string;
  attendees: number;
}

interface Celebration {
  id: string;
  title: string;
  description: string;
  type: 'milestone' | 'achievement' | 'gratitude';
  date: string;
  cotkAwarded: number;
  celebrant: string;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const CATEGORY_FILTERS: { key: AnnouncementCategory | 'all'; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: '' },
  { key: 'general', label: 'General', icon: '' },
  { key: 'emergency', label: 'Emergency', icon: '' },
  { key: 'event', label: 'Events', icon: '' },
  { key: 'governance', label: 'Governance', icon: '' },
  { key: 'celebration', label: 'Celebrations', icon: '' },
];

const TARGET_OPTIONS: { key: TargetAudience; label: string }[] = [
  { key: 'all', label: 'Everyone' },
  { key: 'region', label: 'My Region' },
  { key: 'DAO', label: 'My DAO' },
];

// ─── Demo Data ───

const DEMO_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'a1', title: 'Emergency: Water Main Break on Elm Street',
    message: 'Water service disrupted on Elm Street between 3rd and 7th Ave. Bottled water available at the Community Center. Repair crews are on-site. Estimated restoration: 6 PM today.',
    category: 'emergency', target: 'region', author: 'City Utilities DAO',
    authorRole: 'Infrastructure Council', date: '2026-03-28', pinned: true,
    readCount: 1842, totalRecipients: 2500,
  },
  {
    id: 'a2', title: 'Governance Vote: Community Garden Expansion',
    message: 'Proposal #47 to expand the Riverside Community Garden by 2 acres is now open for voting. Voting closes April 5. All DAO members with 100+ cOTK staked are eligible. Review the full proposal in the Governance tab.',
    category: 'governance', target: 'DAO', author: 'Green Earth Foundation',
    authorRole: 'DAO Steward', date: '2026-03-27', pinned: true,
    readCount: 623, totalRecipients: 1200,
  },
  {
    id: 'a3', title: 'Spring Festival — April 12th',
    message: 'Join us for the annual Spring Festival! Live music, food trucks, kids activities, and a community art wall. Volunteers needed for setup (8 AM) and teardown (6 PM). Sign up on the Community Board.',
    category: 'event', target: 'all', author: 'Parks & Recreation',
    authorRole: 'Event Coordinator', date: '2026-03-26',
    pinned: false, readCount: 3201, totalRecipients: 5000,
  },
  {
    id: 'a4', title: 'New Mentorship Matching Round — Apply by April 1',
    message: 'The Q2 mentorship matching is open. Whether you want to mentor or be mentored in tech, trades, or life skills, apply through the Mentorship tab. Mentors earn 500 cOTK per quarter.',
    category: 'general', target: 'all', author: 'Youth Futures Alliance',
    authorRole: 'Program Director', date: '2026-03-25',
    pinned: false, readCount: 987, totalRecipients: 5000,
  },
  {
    id: 'a5', title: 'Community Milestone: 10,000 Volunteer Hours!',
    message: 'Our community just crossed 10,000 verified volunteer hours this quarter! That is a new record. Special thanks to the top 50 contributors — bonus cOTK rewards are being distributed now.',
    category: 'celebration', target: 'all', author: 'Open Chain Council',
    authorRole: 'Community Lead', date: '2026-03-24',
    pinned: false, readCount: 4102, totalRecipients: 5000,
  },
  {
    id: 'a6', title: 'Governance Result: Library Funding Approved',
    message: 'Proposal #45 passed with 78% approval. 50,000 cOTK allocated to the public library digitization project. Implementation begins April 15. Thank you to all 892 voters.',
    category: 'governance', target: 'DAO', author: 'Treasury Committee',
    authorRole: 'Treasurer', date: '2026-03-22',
    pinned: false, readCount: 756, totalRecipients: 1200,
  },
];

const DEMO_EVENTS: CommunityEvent[] = [
  { id: 'e1', title: 'Spring Festival', date: '2026-04-12', time: '10:00 AM - 6:00 PM', location: 'Central Park Pavilion', sourceAnnouncementId: 'a3', attendees: 342 },
  { id: 'e2', title: 'Governance Town Hall Q2', date: '2026-04-08', time: '7:00 PM - 9:00 PM', location: 'Virtual — Open Chain P2P', sourceAnnouncementId: '', attendees: 128 },
  { id: 'e3', title: 'River Cleanup Day', date: '2026-04-15', time: '8:00 AM - 12:00 PM', location: 'Oak River Trail — Mile 3', sourceAnnouncementId: '', attendees: 89 },
];

const DEMO_CELEBRATIONS: Celebration[] = [
  { id: 'c1', title: '10,000 Volunteer Hours', description: 'Community-wide record for quarterly volunteer engagement.', type: 'milestone', date: '2026-03-24', cotkAwarded: 10000, celebrant: 'Entire Community' },
  { id: 'c2', title: 'Maria G. — 500 Tutoring Hours', description: 'Maria has logged 500 verified hours tutoring children in math and reading.', type: 'achievement', date: '2026-03-20', cotkAwarded: 2500, celebrant: 'Maria G.' },
  { id: 'c3', title: 'Senior Center Thank You', description: 'Residents of Sunshine Senior Center sent a collective thank-you to all 45 companion visitors this quarter.', type: 'gratitude', date: '2026-03-18', cotkAwarded: 1350, celebrant: '45 Volunteers' },
  { id: 'c4', title: 'Youth Coding Workshop Graduates', description: '24 teens completed the 8-week Python fundamentals course and built their first apps.', type: 'achievement', date: '2026-03-15', cotkAwarded: 4800, celebrant: '24 Graduates' },
];

type Tab = 'feed' | 'create' | 'events' | 'celebrations';

// ─── Component ───

export function CommunityRadioScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('feed');
  const [filterCategory, setFilterCategory] = useState<AnnouncementCategory | 'all'>('all');
  const [announcements] = useState(DEMO_ANNOUNCEMENTS);

  // Create form state
  const [formTitle, setFormTitle] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formCategory, setFormCategory] = useState<AnnouncementCategory>('general');
  const [formTarget, setFormTarget] = useState<TargetAudience>('all');

  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  // ─── Derived Data ───

  const filteredAnnouncements = useMemo(() => {
    const base = filterCategory === 'all'
      ? announcements
      : announcements.filter((a) => a.category === filterCategory);
    // Pinned always on top
    return [...base].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.date.localeCompare(a.date);
    });
  }, [announcements, filterCategory]);

  const pinnedCount = useMemo(() => announcements.filter((a) => a.pinned).length, [announcements]);

  // ─── Handlers ───

  const handleCreateAnnouncement = useCallback(() => {
    if (!formTitle.trim()) { Alert.alert('Required', 'Enter an announcement title.'); return; }
    if (!formMessage.trim()) { Alert.alert('Required', 'Enter the announcement message.'); return; }

    Alert.alert(
      'Announcement Created',
      `"${formTitle}" will be broadcast to ${formTarget === 'all' ? 'everyone' : formTarget === 'region' ? 'your region' : 'your DAO'}.`,
    );
    setFormTitle('');
    setFormMessage('');
    setFormCategory('general');
    setFormTarget('all');
    setTab('feed');
  }, [formTitle, formMessage, formTarget]);

  // ─── Styles ───

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.purple + '20' },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: '600' },
    tabTextActive: { color: t.accent.purple },

    // Filter chips
    filterRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 6, marginBottom: 12 },
    filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: t.bg.secondary },
    filterActive: { backgroundColor: t.accent.purple + '20', borderColor: t.accent.purple },
    filterText: { color: t.text.muted, fontSize: 12, fontWeight: '600' },
    filterTextActive: { color: t.accent.purple },

    // Cards
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    announcementCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    pinnedBorder: { borderLeftWidth: 3, borderLeftColor: t.accent.yellow || '#F5A623' },
    emergencyBorder: { borderLeftWidth: 3, borderLeftColor: t.accent.red || '#FF3B30' },

    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 12, marginHorizontal: 20 },
    cardTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700', marginBottom: 4 },
    cardBody: { color: t.text.secondary, fontSize: 13, lineHeight: 19, marginBottom: 8 },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    metaText: { color: t.text.muted, fontSize: 11 },
    badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    badgeText: { fontSize: 10, fontWeight: '700' },
    readReceipt: { color: t.text.muted, fontSize: 11, marginTop: 6 },

    // Stat row
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
    statBox: { alignItems: 'center' },
    statNum: { color: t.text.primary, fontSize: 22, fontWeight: '800' },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },

    // Events
    eventCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    eventDate: { color: t.accent.blue, fontSize: 13, fontWeight: '700', marginBottom: 2 },
    eventTime: { color: t.text.muted, fontSize: 12, marginBottom: 4 },
    eventLocation: { color: t.text.secondary, fontSize: 12 },
    eventAttendees: { color: t.accent.green, fontSize: 12, fontWeight: '600', marginTop: 4 },

    // Celebrations
    celebCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    celebType: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
    celebCotk: { color: t.accent.green, fontSize: 13, fontWeight: '700', marginTop: 6 },
    celebrant: { color: t.text.muted, fontSize: 12, marginTop: 2 },

    // Form
    label: { color: t.text.secondary, fontSize: 13, fontWeight: '600', marginBottom: 6, marginHorizontal: 20 },
    input: { backgroundColor: t.bg.secondary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: t.text.primary, fontSize: 15, marginHorizontal: 20, marginBottom: 12 },
    textArea: { minHeight: 100, textAlignVertical: 'top' },
    optionRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8, marginBottom: 16 },
    optionChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: t.bg.secondary },
    optionActive: { backgroundColor: t.accent.blue + '20', borderColor: t.accent.blue },
    optionText: { color: t.text.muted, fontSize: 13, fontWeight: '600' },
    optionTextActive: { color: t.accent.blue },
    submitBtn: { backgroundColor: t.accent.purple, borderRadius: 14, paddingVertical: 16, marginHorizontal: 20, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    pinnedTag: { color: t.accent.yellow || '#F5A623', fontSize: 10, fontWeight: '700', marginBottom: 4 },
  }), [t]);

  // ─── Category badge color ───

  const categoryColor = useCallback((cat: AnnouncementCategory) => {
    switch (cat) {
      case 'emergency': return t.accent.red || '#FF3B30';
      case 'event': return t.accent.blue;
      case 'governance': return t.accent.purple;
      case 'celebration': return t.accent.green;
      default: return t.text.muted;
    }
  }, [t]);

  const categoryLabel = useCallback((cat: AnnouncementCategory) => {
    switch (cat) {
      case 'emergency': return 'EMERGENCY';
      case 'event': return 'EVENT';
      case 'governance': return 'GOVERNANCE';
      case 'celebration': return 'CELEBRATION';
      default: return 'GENERAL';
    }
  }, []);

  // ─── Tabs Config ───

  const TABS: { key: Tab; label: string }[] = [
    { key: 'feed', label: 'Feed' },
    { key: 'create', label: 'Create' },
    { key: 'events', label: 'Events' },
    { key: 'celebrations', label: 'Celebrations' },
  ];

  // ─── Render: Feed ───

  const renderFeed = () => (
    <>
      {/* Stats */}
      <View style={[s.card, { marginBottom: 16 }]}>
        <View style={s.statRow}>
          <View style={s.statBox}>
            <Text style={s.statNum}>{announcements.length}</Text>
            <Text style={s.statLabel}>Active</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statNum}>{pinnedCount}</Text>
            <Text style={s.statLabel}>Pinned</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statNum}>{announcements.reduce((sum, a) => sum + a.readCount, 0).toLocaleString()}</Text>
            <Text style={s.statLabel}>Total Reads</Text>
          </View>
        </View>
      </View>

      {/* Category Filters */}
      <View style={s.filterRow}>
        {CATEGORY_FILTERS.map((cf) => (
          <TouchableOpacity
            key={cf.key}
            style={[s.filterChip, filterCategory === cf.key && s.filterActive]}
            onPress={() => setFilterCategory(cf.key)}
          >
            <Text style={[s.filterText, filterCategory === cf.key && s.filterTextActive]}>
              {cf.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Announcements */}
      {filteredAnnouncements.map((a) => (
        <View
          key={a.id}
          style={[
            s.announcementCard,
            a.pinned && s.pinnedBorder,
            a.category === 'emergency' && !a.pinned && s.emergencyBorder,
          ]}
        >
          {a.pinned && <Text style={s.pinnedTag}>PINNED</Text>}
          <View style={[s.badge, { backgroundColor: categoryColor(a.category) + '20', alignSelf: 'flex-start', marginBottom: 6 }]}>
            <Text style={[s.badgeText, { color: categoryColor(a.category) }]}>
              {categoryLabel(a.category)}
            </Text>
          </View>
          <Text style={s.cardTitle}>{a.title}</Text>
          <Text style={s.cardBody}>{a.message}</Text>
          <View style={s.metaRow}>
            <Text style={s.metaText}>{a.author} — {a.authorRole}</Text>
            <Text style={s.metaText}>{a.date}</Text>
          </View>
          <Text style={s.readReceipt}>
            Seen by {a.readCount.toLocaleString()} of {a.totalRecipients.toLocaleString()} ({Math.round((a.readCount / a.totalRecipients) * 100)}%)
          </Text>
        </View>
      ))}
    </>
  );

  // ─── Render: Create ───

  const renderCreate = () => (
    <>
      <Text style={[s.sectionTitle, { marginTop: 8 }]}>New Announcement</Text>

      <Text style={s.label}>Title</Text>
      <TextInput
        style={s.input}
        placeholder="Announcement title..."
        placeholderTextColor={t.text.muted}
        value={formTitle}
        onChangeText={setFormTitle}
      />

      <Text style={s.label}>Message</Text>
      <TextInput
        style={[s.input, s.textArea]}
        placeholder="Write your announcement..."
        placeholderTextColor={t.text.muted}
        value={formMessage}
        onChangeText={setFormMessage}
        multiline
      />

      <Text style={s.label}>Category</Text>
      <View style={s.optionRow}>
        {(['general', 'emergency', 'event', 'governance', 'celebration'] as AnnouncementCategory[]).map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[s.optionChip, formCategory === cat && s.optionActive]}
            onPress={() => setFormCategory(cat)}
          >
            <Text style={[s.optionText, formCategory === cat && s.optionTextActive]}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>Target Audience</Text>
      <View style={s.optionRow}>
        {TARGET_OPTIONS.map((to) => (
          <TouchableOpacity
            key={to.key}
            style={[s.optionChip, formTarget === to.key && s.optionActive]}
            onPress={() => setFormTarget(to.key)}
          >
            <Text style={[s.optionText, formTarget === to.key && s.optionTextActive]}>
              {to.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={s.submitBtn} onPress={handleCreateAnnouncement}>
        <Text style={s.submitText}>Broadcast Announcement</Text>
      </TouchableOpacity>
    </>
  );

  // ─── Render: Events ───

  const renderEvents = () => (
    <>
      <Text style={[s.sectionTitle, { marginTop: 8 }]}>Upcoming Community Events</Text>
      <View style={[s.card, { marginBottom: 16 }]}>
        <View style={s.statRow}>
          <View style={s.statBox}>
            <Text style={s.statNum}>{DEMO_EVENTS.length}</Text>
            <Text style={s.statLabel}>Upcoming</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statNum}>{DEMO_EVENTS.reduce((sum, e) => sum + e.attendees, 0)}</Text>
            <Text style={s.statLabel}>RSVPs</Text>
          </View>
        </View>
      </View>

      {DEMO_EVENTS.map((ev) => (
        <View key={ev.id} style={s.eventCard}>
          <Text style={s.cardTitle}>{ev.title}</Text>
          <Text style={s.eventDate}>{ev.date}</Text>
          <Text style={s.eventTime}>{ev.time}</Text>
          <Text style={s.eventLocation}>{ev.location}</Text>
          <Text style={s.eventAttendees}>{ev.attendees} attending</Text>
          <TouchableOpacity
            style={[s.submitBtn, { marginHorizontal: 0, marginTop: 12, backgroundColor: t.accent.blue }]}
            onPress={() => Alert.alert('RSVP', `You have RSVP'd to "${ev.title}" on ${ev.date}.`)}
          >
            <Text style={s.submitText}>RSVP</Text>
          </TouchableOpacity>
        </View>
      ))}
    </>
  );

  // ─── Render: Celebrations ───

  const celebTypeColor = useCallback((type: Celebration['type']) => {
    switch (type) {
      case 'milestone': return t.accent.purple;
      case 'achievement': return t.accent.blue;
      case 'gratitude': return t.accent.green;
    }
  }, [t]);

  const renderCelebrations = () => (
    <>
      <Text style={[s.sectionTitle, { marginTop: 8 }]}>Community Celebrations</Text>
      <View style={[s.card, { marginBottom: 16 }]}>
        <View style={s.statRow}>
          <View style={s.statBox}>
            <Text style={s.statNum}>{DEMO_CELEBRATIONS.length}</Text>
            <Text style={s.statLabel}>Celebrations</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statNum}>{DEMO_CELEBRATIONS.reduce((sum, c) => sum + c.cotkAwarded, 0).toLocaleString()}</Text>
            <Text style={s.statLabel}>cOTK Awarded</Text>
          </View>
        </View>
      </View>

      {DEMO_CELEBRATIONS.map((c) => (
        <View key={c.id} style={s.celebCard}>
          <Text style={[s.celebType, { color: celebTypeColor(c.type) }]}>
            {c.type}
          </Text>
          <Text style={s.cardTitle}>{c.title}</Text>
          <Text style={s.cardBody}>{c.description}</Text>
          <Text style={s.celebrant}>{c.celebrant} — {c.date}</Text>
          <Text style={s.celebCotk}>+{c.cotkAwarded.toLocaleString()} cOTK</Text>
        </View>
      ))}
    </>
  );

  // ─── Main Render ───

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Community Radio</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {TABS.map((tb) => (
          <TouchableOpacity
            key={tb.key}
            style={[s.tabBtn, tab === tb.key && s.tabActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>
              {tb.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={s.scroll}>
        {tab === 'feed' && renderFeed()}
        {tab === 'create' && renderCreate()}
        {tab === 'events' && renderEvents()}
        {tab === 'celebrations' && renderCelebrations()}
      </ScrollView>
    </SafeAreaView>
  );
}
