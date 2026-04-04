import { fonts } from '../utils/theme';
/**
 * Co-Working Screen — Community co-working spaces, shared office, freelancer hub.
 *
 * Article I (xOTK): "Productive work environments belong to everyone.
 *  Those who create spaces for collaboration earn community trust."
 * — Human Constitution, Article I
 *
 * Features:
 * - Available spaces list (desks, meeting rooms, quiet zones, maker areas)
 * - Book a space (date, time, duration, type)
 * - Community of freelancers/remote workers (skills, projects, collaboration)
 * - Networking events at co-working spaces
 * - Amenities (wifi, printing, coffee, childcare)
 * - xOTK earned for hosting/organizing workspace events
 * - Demo: 3 spaces, 2 upcoming events, 5 community members
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface Props {
  onClose: () => void;
}

type SpaceType = 'desk' | 'meeting_room' | 'quiet_zone' | 'maker_area';

interface CoWorkingSpace {
  id: string;
  name: string;
  type: SpaceType;
  location: string;
  capacity: number;
  amenities: string[];
  hourlyRate: number; // xOTK, 0 = free
  available: boolean;
  description: string;
}

interface SpaceBooking {
  id: string;
  spaceId: string;
  spaceName: string;
  spaceType: SpaceType;
  date: string;
  time: string;
  durationHours: number;
  xOTKCost: number;
  status: 'confirmed' | 'pending' | 'completed';
}

interface CommunityMember {
  uid: string;
  name: string;
  skills: string[];
  currentProject: string;
  openToCollab: boolean;
  xOTKEarned: number;
}

interface WorkspaceEvent {
  id: string;
  title: string;
  hostName: string;
  hostUid: string;
  spaceName: string;
  date: string;
  time: string;
  attendees: number;
  maxAttendees: number;
  xOTKReward: number;
  description: string;
}

// ─── Demo Data ───

const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  desk: 'Hot Desk',
  meeting_room: 'Meeting Room',
  quiet_zone: 'Quiet Zone',
  maker_area: 'Maker Area',
};

const SPACE_TYPE_ICONS: Record<SpaceType, string> = {
  desk: '🪑',
  meeting_room: '🏢',
  quiet_zone: '🤫',
  maker_area: '🔧',
};

const ALL_AMENITIES = ['WiFi', 'Printing', 'Coffee', 'Childcare', 'Standing Desk', 'Whiteboard', '3D Printer', 'Lockers'];

const DEMO_SPACES: CoWorkingSpace[] = [
  {
    id: 'sp-001', name: 'Sunrise Hub', type: 'desk', location: 'Community Center, Floor 2',
    capacity: 20, amenities: ['WiFi', 'Coffee', 'Printing', 'Standing Desk'],
    hourlyRate: 5, available: true,
    description: 'Open plan hot desks with natural light and fast WiFi. Perfect for focused work.',
  },
  {
    id: 'sp-002', name: 'The Quiet Room', type: 'quiet_zone', location: 'Library Building, Room 104',
    capacity: 8, amenities: ['WiFi', 'Lockers'],
    hourlyRate: 0, available: true,
    description: 'Silent workspace for deep focus. No calls, no meetings. Free for all community members.',
  },
  {
    id: 'sp-003', name: 'Maker Garage', type: 'maker_area', location: 'Innovation Park, Unit 7',
    capacity: 12, amenities: ['WiFi', '3D Printer', 'Whiteboard', 'Coffee'],
    hourlyRate: 10, available: true,
    description: 'Full workshop with 3D printers, tools, and project space. Bring your ideas to life.',
  },
];

const DEMO_BOOKINGS: SpaceBooking[] = [
  {
    id: 'bk-001', spaceId: 'sp-001', spaceName: 'Sunrise Hub', spaceType: 'desk',
    date: '2026-03-30', time: '09:00', durationHours: 4, xOTKCost: 20, status: 'confirmed',
  },
  {
    id: 'bk-002', spaceId: 'sp-003', spaceName: 'Maker Garage', spaceType: 'maker_area',
    date: '2026-03-28', time: '14:00', durationHours: 3, xOTKCost: 30, status: 'completed',
  },
];

const DEMO_MEMBERS: CommunityMember[] = [
  { uid: 'uid-cw-001', name: 'Dana Kim', skills: ['UX Design', 'Figma', 'User Research'], currentProject: 'Community health app', openToCollab: true, xOTKEarned: 320 },
  { uid: 'uid-cw-002', name: 'Raj Mehta', skills: ['Backend Dev', 'Python', 'APIs'], currentProject: 'Local marketplace API', openToCollab: true, xOTKEarned: 480 },
  { uid: 'uid-cw-003', name: 'Sofia Reyes', skills: ['Content Writing', 'SEO', 'Marketing'], currentProject: 'Nonprofit newsletter', openToCollab: false, xOTKEarned: 150 },
  { uid: 'uid-cw-004', name: 'Omar Farouk', skills: ['Hardware', 'IoT', 'Electronics'], currentProject: 'Community sensor network', openToCollab: true, xOTKEarned: 560 },
  { uid: 'uid-cw-005', name: 'Lena Johansson', skills: ['Photography', 'Video', 'Social Media'], currentProject: 'Documenting local artisans', openToCollab: true, xOTKEarned: 210 },
];

const DEMO_EVENTS: WorkspaceEvent[] = [
  {
    id: 'ev-001', title: 'Freelancer Friday Mixer', hostName: 'Dana Kim', hostUid: 'uid-cw-001',
    spaceName: 'Sunrise Hub', date: '2026-04-04', time: '17:00', attendees: 12, maxAttendees: 25,
    xOTKReward: 15, description: 'Weekly networking for freelancers and remote workers. Share projects, find collaborators.',
  },
  {
    id: 'ev-002', title: 'Maker Workshop: IoT Basics', hostName: 'Omar Farouk', hostUid: 'uid-cw-004',
    spaceName: 'Maker Garage', date: '2026-04-06', time: '10:00', attendees: 6, maxAttendees: 12,
    xOTKReward: 25, description: 'Hands-on intro to IoT. Build a temperature sensor from scratch. All materials provided.',
  },
];

type Tab = 'spaces' | 'book' | 'community' | 'events';

const TAB_LABELS: Record<Tab, string> = {
  spaces: 'Spaces',
  book: 'Bookings',
  community: 'Community',
  events: 'Events',
};

export function CoWorkingScreen({ onClose }: Props) {
  const t = useTheme();
  const demoMode = useWalletStore((s) => s.demoMode);
  const [activeTab, setActiveTab] = useState<Tab>('spaces');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<SpaceType | null>(null);

  const filteredSpaces = useMemo(() => {
    let list = DEMO_SPACES;
    if (typeFilter) {
      list = list.filter((sp) => sp.type === typeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (sp) => sp.name.toLowerCase().includes(q) || sp.location.toLowerCase().includes(q) || sp.amenities.some((a) => a.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [searchQuery, typeFilter]);

  const bookingStats = useMemo(() => {
    const confirmed = DEMO_BOOKINGS.filter((b) => b.status === 'confirmed').length;
    const completed = DEMO_BOOKINGS.filter((b) => b.status === 'completed').length;
    const totalSpent = DEMO_BOOKINGS.reduce((sum, b) => sum + b.xOTKCost, 0);
    return { confirmed, completed, totalSpent };
  }, []);

  const handleBookSpace = useCallback((space: CoWorkingSpace) => {
    Alert.alert(
      'Book Space',
      `Reserve a spot at ${space.name}?\n\nType: ${SPACE_TYPE_LABELS[space.type]}\nRate: ${space.hourlyRate === 0 ? 'Free' : space.hourlyRate + ' xOTK/hr'}\nAmenities: ${space.amenities.join(', ')}`,
      [{ text: 'Cancel' }, { text: 'Book', onPress: () => Alert.alert('Booked!', 'Space reserved successfully.') }],
    );
  }, []);

  const handleCollaborate = useCallback((member: CommunityMember) => {
    Alert.alert(
      'Collaborate',
      `Connect with ${member.name}?\n\nProject: ${member.currentProject}\nSkills: ${member.skills.join(', ')}`,
      [{ text: 'Cancel' }, { text: 'Connect', onPress: () => Alert.alert('Connected!', `Collaboration request sent to ${member.name}.`) }],
    );
  }, []);

  const handleJoinEvent = useCallback((event: WorkspaceEvent) => {
    if (event.attendees >= event.maxAttendees) {
      Alert.alert('Full', 'This event is at capacity. Try joining the waitlist.');
      return;
    }
    Alert.alert('Join Event', `Attend "${event.title}"?\n\nEarn ${event.xOTKReward} xOTK for participating.`,
      [{ text: 'Cancel' }, { text: 'Join', onPress: () => Alert.alert('Joined!', `You're signed up for ${event.title}.`) }],
    );
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    heroCard: { backgroundColor: t.accent.blue + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSub: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginTop: 6, lineHeight: 18, fontStyle: 'italic' },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 16, backgroundColor: t.bg.card, borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.muted, fontSize: fonts.xs, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    section: { marginHorizontal: 20, marginTop: 20 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
    demoText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.semibold },
    searchInput: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md, borderWidth: 1, borderColor: t.border, marginBottom: 12 },
    filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
    filterChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, backgroundColor: t.bg.card, borderWidth: 1, borderColor: t.border },
    filterChipActive: { borderColor: t.accent.blue, backgroundColor: t.accent.blue + '20' },
    filterText: { color: t.text.secondary, fontSize: fonts.sm },
    filterTextActive: { color: t.accent.blue, fontWeight: fonts.semibold },
    // Space cards
    spaceCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    spaceHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    spaceIcon: { fontSize: fonts.xxxl },
    spaceName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, flex: 1 },
    spaceType: { color: t.accent.blue, fontSize: fonts.xs, fontWeight: fonts.semibold },
    spaceLocation: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    spaceDesc: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 6, lineHeight: 18 },
    amenityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    amenityTag: { backgroundColor: t.accent.green + '15', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 },
    amenityText: { color: t.accent.green, fontSize: fonts.xs, fontWeight: fonts.semibold },
    spaceFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    spaceRate: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold },
    spaceCapacity: { color: t.text.muted, fontSize: fonts.sm },
    bookBtn: { backgroundColor: t.accent.blue, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16 },
    bookBtnText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.bold },
    // Bookings tab
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 16 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: fonts.xxl, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    bookingCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4 },
    bookingName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    bookingType: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 2 },
    bookingDetails: { color: t.text.muted, fontSize: fonts.sm, marginTop: 6 },
    bookingStatus: { fontSize: fonts.sm, fontWeight: fonts.bold, marginTop: 6 },
    // Community tab
    memberCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    memberName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    memberUid: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    memberProject: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 6 },
    memberSkills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    skillTag: { backgroundColor: t.accent.blue + '20', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
    skillText: { color: t.accent.blue, fontSize: fonts.xs, fontWeight: fonts.semibold },
    memberFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    memberXOTK: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.semibold },
    collabBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
    collabText: { fontSize: fonts.xs, fontWeight: fonts.bold },
    collabBtn: { backgroundColor: t.accent.blue, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'flex-end', marginTop: 8 },
    collabBtnText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.bold },
    // Events tab
    eventCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: t.accent.blue },
    eventTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    eventHost: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 2 },
    eventLocation: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    eventDateTime: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    eventDesc: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 6, lineHeight: 18 },
    eventFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    eventAttendees: { color: t.text.muted, fontSize: fonts.sm },
    eventReward: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold },
    joinBtn: { backgroundColor: t.accent.green, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'flex-end', marginTop: 8 },
    joinBtnText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.bold },
    submitBtn: { backgroundColor: t.accent.blue, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
    submitBtnText: { color: '#fff', fontSize: fonts.lg, fontWeight: fonts.bold },
    sublabel: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginTop: 12, lineHeight: 18 },
    emptyText: { color: t.text.muted, fontSize: fonts.md, textAlign: 'center', marginTop: 40, lineHeight: 22 },
  }), [t]);

  /* ── Render: Spaces ── */

  const renderSpaces = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Available Spaces</Text>
      <TextInput
        style={s.searchInput}
        placeholder="Search by name, location, or amenity..."
        placeholderTextColor={t.text.muted}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <View style={s.filterRow}>
        <TouchableOpacity
          style={[s.filterChip, !typeFilter && s.filterChipActive]}
          onPress={() => setTypeFilter(null)}
        >
          <Text style={[s.filterText, !typeFilter && s.filterTextActive]}>All</Text>
        </TouchableOpacity>
        {(Object.keys(SPACE_TYPE_LABELS) as SpaceType[]).map((st) => (
          <TouchableOpacity
            key={st}
            style={[s.filterChip, typeFilter === st && s.filterChipActive]}
            onPress={() => setTypeFilter(typeFilter === st ? null : st)}
          >
            <Text style={[s.filterText, typeFilter === st && s.filterTextActive]}>
              {SPACE_TYPE_ICONS[st]} {SPACE_TYPE_LABELS[st]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {filteredSpaces.length === 0 ? (
        <Text style={s.emptyText}>No spaces match your search.</Text>
      ) : (
        filteredSpaces.map((space) => (
          <View key={space.id} style={s.spaceCard}>
            <View style={s.spaceHeader}>
              <Text style={s.spaceIcon}>{SPACE_TYPE_ICONS[space.type]}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.spaceName}>{space.name}</Text>
                <Text style={s.spaceType}>{SPACE_TYPE_LABELS[space.type]}</Text>
              </View>
            </View>
            <Text style={s.spaceLocation}>{space.location}</Text>
            <Text style={s.spaceDesc}>{space.description}</Text>
            <View style={s.amenityRow}>
              {space.amenities.map((am) => (
                <View key={am} style={s.amenityTag}>
                  <Text style={s.amenityText}>{am}</Text>
                </View>
              ))}
            </View>
            <View style={s.spaceFooter}>
              <Text style={s.spaceRate}>
                {space.hourlyRate === 0 ? 'Free' : `${space.hourlyRate} xOTK/hr`}
              </Text>
              <Text style={s.spaceCapacity}>Capacity: {space.capacity}</Text>
            </View>
            {space.available && (
              <TouchableOpacity style={s.bookBtn} onPress={() => handleBookSpace(space)}>
                <Text style={s.bookBtnText}>Book Space</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}
    </View>
  );

  /* ── Render: Bookings ── */

  const renderBook = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>My Bookings</Text>
      <View style={s.statsRow}>
        <View style={s.statItem}>
          <Text style={s.statValue}>{bookingStats.confirmed}</Text>
          <Text style={s.statLabel}>Confirmed</Text>
        </View>
        <View style={s.statItem}>
          <Text style={s.statValue}>{bookingStats.completed}</Text>
          <Text style={s.statLabel}>Completed</Text>
        </View>
        <View style={s.statItem}>
          <Text style={s.statValue}>{bookingStats.totalSpent}</Text>
          <Text style={s.statLabel}>xOTK Spent</Text>
        </View>
      </View>
      {DEMO_BOOKINGS.length === 0 ? (
        <Text style={s.emptyText}>No bookings yet. Find a space to get started!</Text>
      ) : (
        DEMO_BOOKINGS.map((booking) => {
          const borderColor = booking.status === 'confirmed' ? t.accent.blue
            : booking.status === 'completed' ? t.accent.green
            : t.accent.orange;
          return (
            <View key={booking.id} style={[s.bookingCard, { borderLeftColor: borderColor }]}>
              <Text style={s.bookingName}>{booking.spaceName}</Text>
              <Text style={s.bookingType}>{SPACE_TYPE_LABELS[booking.spaceType]}</Text>
              <Text style={s.bookingDetails}>
                {booking.date} at {booking.time} — {booking.durationHours}h — {booking.xOTKCost === 0 ? 'Free' : `${booking.xOTKCost} xOTK`}
              </Text>
              <Text style={[s.bookingStatus, { color: borderColor }]}>
                {booking.status.toUpperCase()}
              </Text>
            </View>
          );
        })
      )}
    </View>
  );

  /* ── Render: Community ── */

  const renderCommunity = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Community Members</Text>
      <Text style={s.sublabel}>
        Freelancers, remote workers, and creators sharing this space.{'\n'}
        Find collaborators for your next project.
      </Text>
      {DEMO_MEMBERS.map((member) => (
        <View key={member.uid} style={s.memberCard}>
          <Text style={s.memberName}>{member.name}</Text>
          <Text style={s.memberUid}>{member.uid}</Text>
          <Text style={s.memberProject}>Working on: {member.currentProject}</Text>
          <View style={s.memberSkills}>
            {member.skills.map((skill) => (
              <View key={skill} style={s.skillTag}>
                <Text style={s.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
          <View style={s.memberFooter}>
            <Text style={s.memberXOTK}>{member.xOTKEarned} xOTK earned</Text>
            <View style={[s.collabBadge, { backgroundColor: member.openToCollab ? t.accent.green + '20' : t.accent.red + '20' }]}>
              <Text style={[s.collabText, { color: member.openToCollab ? t.accent.green : t.accent.red }]}>
                {member.openToCollab ? 'Open to Collab' : 'Busy'}
              </Text>
            </View>
          </View>
          {member.openToCollab && (
            <TouchableOpacity style={s.collabBtn} onPress={() => handleCollaborate(member)}>
              <Text style={s.collabBtnText}>Connect</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );

  /* ── Render: Events ── */

  const renderEvents = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Upcoming Events</Text>
      <Text style={s.sublabel}>
        Networking, workshops, and community gatherings.{'\n'}
        Earn xOTK for hosting or attending events.
      </Text>
      {DEMO_EVENTS.length === 0 ? (
        <Text style={s.emptyText}>No upcoming events.</Text>
      ) : (
        DEMO_EVENTS.map((event) => (
          <View key={event.id} style={s.eventCard}>
            <Text style={s.eventTitle}>{event.title}</Text>
            <Text style={s.eventHost}>Hosted by {event.hostName}</Text>
            <Text style={s.eventLocation}>{event.spaceName}</Text>
            <Text style={s.eventDateTime}>{event.date} at {event.time}</Text>
            <Text style={s.eventDesc}>{event.description}</Text>
            <View style={s.eventFooter}>
              <Text style={s.eventAttendees}>
                {event.attendees}/{event.maxAttendees} attending
              </Text>
              <Text style={s.eventReward}>+{event.xOTKReward} xOTK</Text>
            </View>
            <TouchableOpacity style={s.joinBtn} onPress={() => handleJoinEvent(event)}>
              <Text style={s.joinBtnText}>Join Event</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      <TouchableOpacity
        style={[s.submitBtn, { marginTop: 20 }]}
        onPress={() => Alert.alert('Host Event', 'Event creation coming soon! Earn xOTK for organizing.')}
      >
        <Text style={s.submitBtnText}>Host an Event</Text>
      </TouchableOpacity>
    </View>
  );

  /* ── Main Render ── */

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Co-Working</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.heroCard}>
          <Text style={s.heroIcon}>{'🏢'}</Text>
          <Text style={s.heroTitle}>Community Co-Working Hub</Text>
          <Text style={s.heroSub}>
            {"\"Productive work environments belong to everyone.\nThose who create spaces for collaboration earn community trust.\""}
          </Text>
        </View>

        {demoMode && (
          <View style={s.demoTag}>
            <Text style={s.demoText}>Demo — 3 spaces, 2 events, 5 members</Text>
          </View>
        )}

        <View style={s.tabRow}>
          {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[s.tab, activeTab === tab && s.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                {TAB_LABELS[tab]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'spaces' && renderSpaces()}
        {activeTab === 'book' && renderBook()}
        {activeTab === 'community' && renderCommunity()}
        {activeTab === 'events' && renderEvents()}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
