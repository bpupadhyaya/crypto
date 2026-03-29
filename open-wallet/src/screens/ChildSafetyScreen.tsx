/**
 * Child Safety — Article I of The Human Constitution.
 *
 * "Every child deserves to feel safe — at home, at school, in the community."
 *
 * Community-powered child safety infrastructure: verified safe walking routes,
 * trusted adult networks, age-appropriate safety education, check-in systems,
 * emergency SOS, and missing child alerts.
 *
 * Features:
 * - Safe routes to school/park (community-verified safe walking paths)
 * - Trusted adults network (verified adults children can go to in emergency)
 * - Safety education for kids (stranger danger, online safety, body safety — age-appropriate)
 * - Check-in system (kids check in when arriving at destinations, guardians notified)
 * - Emergency button for kids (simplified SOS that alerts guardians + trusted adults)
 * - Missing child alert system (community-wide notification)
 * - Demo: 3 safe routes, 4 trusted adults, 5 safety lessons, check-in history
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

interface SafeRoute {
  id: string;
  name: string;
  from: string;
  to: string;
  distanceKm: number;
  verifiedBy: number;
  safetyRating: number; // 1-5
  features: string[];
  lastVerified: string;
}

interface TrustedAdult {
  id: string;
  name: string;
  role: string;
  relation: string;
  phone: string;
  verified: boolean;
  verifiedBy: number;
  location: string;
  available: boolean;
}

interface SafetyLesson {
  id: string;
  title: string;
  category: 'stranger' | 'online' | 'body' | 'emergency' | 'traffic';
  ageRange: string;
  icon: string;
  duration: string;
  completed: boolean;
  description: string;
}

interface CheckIn {
  id: string;
  childName: string;
  destination: string;
  time: string;
  status: 'arrived' | 'departed' | 'en-route';
  routeUsed: string;
}

const DEMO_ROUTES: SafeRoute[] = [
  {
    id: 'r1', name: 'Oak Street School Route', from: 'Maple Neighborhood',
    to: 'Lincoln Elementary', distanceKm: 0.8, verifiedBy: 23,
    safetyRating: 5, features: ['Crossing guard', 'Well-lit', 'Sidewalks entire way'],
    lastVerified: '2026-03-25',
  },
  {
    id: 'r2', name: 'Community Park Path', from: 'Elm Street Block',
    to: 'Riverside Community Park', distanceKm: 0.5, verifiedBy: 18,
    safetyRating: 4, features: ['Low traffic', 'Neighborhood watch area', 'Bike lane'],
    lastVerified: '2026-03-20',
  },
  {
    id: 'r3', name: 'Library Walking Trail', from: 'Central Neighborhood',
    to: 'Public Library', distanceKm: 1.1, verifiedBy: 12,
    safetyRating: 4, features: ['Sidewalks', 'Store-front visibility', 'Bus stop nearby'],
    lastVerified: '2026-03-18',
  },
];

const DEMO_ADULTS: TrustedAdult[] = [
  {
    id: 'a1', name: 'Mrs. Johnson', role: 'Neighbor',
    relation: 'Next-door neighbor (12 years)', phone: '555-0101',
    verified: true, verifiedBy: 8, location: '42 Maple Dr', available: true,
  },
  {
    id: 'a2', name: 'Mr. Garcia', role: 'Teacher',
    relation: 'Homeroom teacher', phone: '555-0102',
    verified: true, verifiedBy: 15, location: 'Lincoln Elementary', available: true,
  },
  {
    id: 'a3', name: 'Officer Chen', role: 'Community Officer',
    relation: 'School resource officer', phone: '555-0103',
    verified: true, verifiedBy: 30, location: 'Precinct 7', available: true,
  },
  {
    id: 'a4', name: 'Aunt Maria', role: 'Family',
    relation: 'Maternal aunt', phone: '555-0104',
    verified: true, verifiedBy: 5, location: '88 Oak Lane', available: false,
  },
];

const DEMO_LESSONS: SafetyLesson[] = [
  {
    id: 'l1', title: 'Stranger Safety Basics', category: 'stranger',
    ageRange: '5-8', icon: '\u{1F6A8}', duration: '10 min', completed: true,
    description: 'Who is a stranger? When to say no. How to get help.',
  },
  {
    id: 'l2', title: 'Online Safety & Privacy', category: 'online',
    ageRange: '8-12', icon: '\u{1F4F1}', duration: '15 min', completed: true,
    description: 'Never share personal info. Recognizing scams. Safe browsing.',
  },
  {
    id: 'l3', title: 'My Body, My Rules', category: 'body',
    ageRange: '5-10', icon: '\u{1F6E1}\uFE0F', duration: '12 min', completed: false,
    description: 'Good touch vs. bad touch. Saying no. Telling a trusted adult.',
  },
  {
    id: 'l4', title: 'What To Do In An Emergency', category: 'emergency',
    ageRange: '6-12', icon: '\u{1F6D1}', duration: '8 min', completed: false,
    description: 'Calling for help. Finding safe places. Staying calm.',
  },
  {
    id: 'l5', title: 'Road & Traffic Safety', category: 'traffic',
    ageRange: '5-10', icon: '\u{1F6B6}', duration: '10 min', completed: true,
    description: 'Crossing streets safely. Signals. Walking with a buddy.',
  },
];

const DEMO_CHECKINS: CheckIn[] = [
  { id: 'c1', childName: 'Emma', destination: 'Lincoln Elementary', time: '8:12 AM', status: 'arrived', routeUsed: 'Oak Street School Route' },
  { id: 'c2', childName: 'Emma', destination: 'Lincoln Elementary', time: '3:05 PM', status: 'departed', routeUsed: 'Oak Street School Route' },
  { id: 'c3', childName: 'Liam', destination: 'Riverside Community Park', time: '10:30 AM', status: 'arrived', routeUsed: 'Community Park Path' },
  { id: 'c4', childName: 'Liam', destination: 'Home', time: '12:15 PM', status: 'arrived', routeUsed: 'Community Park Path' },
  { id: 'c5', childName: 'Emma', destination: 'Public Library', time: '2:00 PM', status: 'en-route', routeUsed: 'Library Walking Trail' },
];

type Tab = 'routes' | 'trusted' | 'learn' | 'check-in';

const TAB_LABELS: Record<Tab, string> = {
  routes: 'Safe Routes',
  trusted: 'Trusted Adults',
  learn: 'Learn',
  'check-in': 'Check-In',
};

const RATING_STARS = (n: number) => '\u2605'.repeat(n) + '\u2606'.repeat(5 - n);

const STATUS_COLORS: Record<string, string> = {
  arrived: '#22c55e',
  departed: '#3b82f6',
  'en-route': '#f59e0b',
};

const STATUS_LABELS: Record<string, string> = {
  arrived: 'Arrived',
  departed: 'Departed',
  'en-route': 'En Route',
};

const CATEGORY_LABELS: Record<string, string> = {
  stranger: 'Stranger Safety',
  online: 'Online Safety',
  body: 'Body Safety',
  emergency: 'Emergency',
  traffic: 'Traffic Safety',
};

export function ChildSafetyScreen({ onClose }: Props) {
  const { demoMode } = useWalletStore();
  const t = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('routes');

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 8 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '700' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { flex: 1, paddingHorizontal: 16 },
    subtitle: { color: t.text.muted, fontSize: 13, lineHeight: 19, marginBottom: 16 },
    tabRow: { flexDirection: 'row', marginBottom: 16, gap: 4 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: t.bg.card, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: 11, fontWeight: '600' },
    tabTextActive: { color: '#fff' },
    card: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    cardTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 4 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    label: { color: t.text.muted, fontSize: 12 },
    val: { color: t.text.secondary, fontSize: 12, fontWeight: '600' },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 8 },
    badgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
    featureTag: { backgroundColor: t.bg.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 6, marginBottom: 4 },
    featureText: { color: t.text.secondary, fontSize: 11 },
    featureRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
    stars: { color: '#f59e0b', fontSize: 14, letterSpacing: 2 },
    divider: { height: 1, backgroundColor: t.border, marginVertical: 8 },
    empty: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40 },
    summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    summaryCard: { flex: 1, backgroundColor: t.bg.card, borderRadius: 12, padding: 14, alignItems: 'center' },
    summaryNum: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
    summaryLabel: { color: t.text.muted, fontSize: 10, fontWeight: '600', textAlign: 'center' },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 8, marginBottom: 8 },
    availableDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
    adultRow: { flexDirection: 'row', alignItems: 'center' },
    lessonIcon: { fontSize: 28, marginRight: 12 },
    lessonMeta: { flex: 1 },
    lessonCategory: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    lessonTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700', marginTop: 2 },
    lessonDesc: { color: t.text.muted, fontSize: 12, marginTop: 4, lineHeight: 17 },
    lessonFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    completedBadge: { backgroundColor: '#22c55e', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    pendingBadge: { backgroundColor: t.accent.yellow, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8, marginTop: 2 },
    checkinRow: { flexDirection: 'row', alignItems: 'flex-start' },
    checkinMeta: { flex: 1 },
    checkinChild: { color: t.text.primary, fontSize: 14, fontWeight: '700' },
    checkinDest: { color: t.text.secondary, fontSize: 12, marginTop: 1 },
    checkinTime: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    sosBtn: { backgroundColor: '#ef4444', borderRadius: 14, padding: 18, alignItems: 'center', marginBottom: 16 },
    sosBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
    sosSubtext: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 },
    alertBtn: { backgroundColor: '#f59e0b', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 20 },
    alertBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    alertSubtext: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 4 },
  }), [t]);

  const routes = demoMode ? DEMO_ROUTES : [];
  const adults = demoMode ? DEMO_ADULTS : [];
  const lessons = demoMode ? DEMO_LESSONS : [];
  const checkins = demoMode ? DEMO_CHECKINS : [];

  const completedLessons = useMemo(() => lessons.filter(l => l.completed).length, [lessons]);
  const availableAdults = useMemo(() => adults.filter(a => a.available).length, [adults]);

  const renderRoutes = () => (
    <>
      <View style={st.summaryRow}>
        <View style={st.summaryCard}>
          <Text style={[st.summaryNum, { color: t.accent.green }]}>{routes.length}</Text>
          <Text style={st.summaryLabel}>Verified Routes</Text>
        </View>
        <View style={st.summaryCard}>
          <Text style={[st.summaryNum, { color: t.accent.blue }]}>
            {routes.reduce((s, r) => s + r.verifiedBy, 0)}
          </Text>
          <Text style={st.summaryLabel}>Community Verifications</Text>
        </View>
      </View>

      <Text style={st.section}>Community-Verified Safe Paths</Text>

      {routes.map(route => (
        <View key={route.id} style={st.card}>
          <Text style={st.cardTitle}>{route.name}</Text>
          <View style={st.row}>
            <Text style={st.label}>From</Text>
            <Text style={st.val}>{route.from}</Text>
          </View>
          <View style={st.row}>
            <Text style={st.label}>To</Text>
            <Text style={st.val}>{route.to}</Text>
          </View>
          <View style={st.row}>
            <Text style={st.label}>Distance</Text>
            <Text style={st.val}>{route.distanceKm} km</Text>
          </View>
          <View style={st.row}>
            <Text style={st.label}>Safety Rating</Text>
            <Text style={st.stars}>{RATING_STARS(route.safetyRating)}</Text>
          </View>
          <View style={st.row}>
            <Text style={st.label}>Verified by</Text>
            <Text style={st.val}>{route.verifiedBy} community members</Text>
          </View>
          <View style={st.featureRow}>
            {route.features.map((f, i) => (
              <View key={i} style={st.featureTag}>
                <Text style={st.featureText}>{f}</Text>
              </View>
            ))}
          </View>
          <Text style={[st.label, { marginTop: 8 }]}>Last verified: {route.lastVerified}</Text>
        </View>
      ))}
    </>
  );

  const renderTrusted = () => (
    <>
      <View style={st.summaryRow}>
        <View style={st.summaryCard}>
          <Text style={[st.summaryNum, { color: t.accent.green }]}>{adults.length}</Text>
          <Text style={st.summaryLabel}>Trusted Adults</Text>
        </View>
        <View style={st.summaryCard}>
          <Text style={[st.summaryNum, { color: t.accent.blue }]}>{availableAdults}</Text>
          <Text style={st.summaryLabel}>Available Now</Text>
        </View>
      </View>

      <Text style={st.section}>Emergency Contact Network</Text>

      {adults.map(adult => (
        <View key={adult.id} style={st.card}>
          <View style={st.adultRow}>
            <View style={[st.availableDot, { backgroundColor: adult.available ? '#22c55e' : '#9ca3af' }]} />
            <Text style={st.cardTitle}>{adult.name}</Text>
          </View>
          <View style={st.row}>
            <Text style={st.label}>Role</Text>
            <Text style={st.val}>{adult.role}</Text>
          </View>
          <View style={st.row}>
            <Text style={st.label}>Relation</Text>
            <Text style={st.val}>{adult.relation}</Text>
          </View>
          <View style={st.row}>
            <Text style={st.label}>Location</Text>
            <Text style={st.val}>{adult.location}</Text>
          </View>
          <View style={st.row}>
            <Text style={st.label}>Verified by</Text>
            <Text style={st.val}>{adult.verifiedBy} community members</Text>
          </View>
          <View style={st.row}>
            <Text style={st.label}>Status</Text>
            <Text style={[st.val, { color: adult.available ? '#22c55e' : '#9ca3af' }]}>
              {adult.available ? 'Available' : 'Unavailable'}
            </Text>
          </View>
          {adult.verified && (
            <View style={[st.badge, { backgroundColor: '#22c55e' }]}>
              <Text style={st.badgeText}>Verified</Text>
            </View>
          )}
        </View>
      ))}
    </>
  );

  const renderLearn = () => (
    <>
      <View style={st.summaryRow}>
        <View style={st.summaryCard}>
          <Text style={[st.summaryNum, { color: t.accent.green }]}>{completedLessons}</Text>
          <Text style={st.summaryLabel}>Completed</Text>
        </View>
        <View style={st.summaryCard}>
          <Text style={[st.summaryNum, { color: t.accent.yellow }]}>{lessons.length - completedLessons}</Text>
          <Text style={st.summaryLabel}>Remaining</Text>
        </View>
        <View style={st.summaryCard}>
          <Text style={[st.summaryNum, { color: t.accent.blue }]}>{lessons.length}</Text>
          <Text style={st.summaryLabel}>Total Lessons</Text>
        </View>
      </View>

      <Text style={st.section}>Age-Appropriate Safety Education</Text>

      {lessons.map(lesson => (
        <View key={lesson.id} style={st.card}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Text style={st.lessonIcon}>{lesson.icon}</Text>
            <View style={st.lessonMeta}>
              <Text style={[st.lessonCategory, { color: t.text.muted }]}>{CATEGORY_LABELS[lesson.category]}</Text>
              <Text style={st.lessonTitle}>{lesson.title}</Text>
              <Text style={st.lessonDesc}>{lesson.description}</Text>
              <View style={st.lessonFooter}>
                <Text style={st.label}>Ages {lesson.ageRange} · {lesson.duration}</Text>
                <View style={lesson.completed ? st.completedBadge : st.pendingBadge}>
                  <Text style={st.badgeText}>{lesson.completed ? 'Done' : 'Start'}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      ))}
    </>
  );

  const renderCheckIn = () => (
    <>
      {/* Emergency SOS */}
      <TouchableOpacity style={st.sosBtn} activeOpacity={0.8}>
        <Text style={st.sosBtnText}>SOS Emergency Button</Text>
        <Text style={st.sosSubtext}>Alerts all guardians + trusted adults immediately</Text>
      </TouchableOpacity>

      {/* Missing Child Alert */}
      <TouchableOpacity style={st.alertBtn} activeOpacity={0.8}>
        <Text style={st.alertBtnText}>Missing Child Alert</Text>
        <Text style={st.alertSubtext}>Sends community-wide notification</Text>
      </TouchableOpacity>

      <Text style={st.section}>Recent Check-Ins</Text>

      {checkins.map(ci => (
        <View key={ci.id} style={st.card}>
          <View style={st.checkinRow}>
            <View style={[st.statusDot, { backgroundColor: STATUS_COLORS[ci.status] }]} />
            <View style={st.checkinMeta}>
              <Text style={st.checkinChild}>{ci.childName}</Text>
              <Text style={st.checkinDest}>{ci.destination}</Text>
              <Text style={st.checkinTime}>{ci.time} · {ci.routeUsed}</Text>
            </View>
            <View style={[st.badge, { backgroundColor: STATUS_COLORS[ci.status] }]}>
              <Text style={st.badgeText}>{STATUS_LABELS[ci.status]}</Text>
            </View>
          </View>
        </View>
      ))}

      {checkins.length === 0 && (
        <Text style={st.empty}>No check-ins yet. Enable demo mode to see sample data.</Text>
      )}
    </>
  );

  const TABS: Tab[] = ['routes', 'trusted', 'learn', 'check-in'];

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.title}>Child Safety</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={st.scroll}>
        <Text style={st.subtitle}>
          Community-powered child safety: verified safe routes, trusted adults network,
          age-appropriate education, and real-time check-ins. Every child deserves to feel safe.
        </Text>

        <View style={st.tabRow}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[st.tab, activeTab === tab && st.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[st.tabText, activeTab === tab && st.tabTextActive]}>
                {TAB_LABELS[tab]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {!demoMode && (
          <Text style={st.empty}>Enable demo mode to explore child safety features.</Text>
        )}

        {demoMode && activeTab === 'routes' && renderRoutes()}
        {demoMode && activeTab === 'trusted' && renderTrusted()}
        {demoMode && activeTab === 'learn' && renderLearn()}
        {demoMode && activeTab === 'check-in' && renderCheckIn()}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
