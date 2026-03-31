/**
 * Community Radio Live Screen — Live community radio streaming, schedule, and archive.
 *
 * Tune in to live broadcasts, check the upcoming schedule, and browse
 * archived shows. Hosts earn cOTK for creating community content.
 * "Every voice matters when the community listens."
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

interface LiveShow {
  id: string;
  title: string;
  host: string;
  icon: string;
  listeners: number;
  startedAt: string;
  topic: string;
  cOTKPerHour: number;
}

interface ScheduleSlot {
  id: string;
  day: string;
  time: string;
  title: string;
  host: string;
  icon: string;
  recurring: boolean;
}

interface ArchivedShow {
  id: string;
  title: string;
  host: string;
  icon: string;
  date: string;
  duration: string;
  listens: number;
  topic: string;
}

const DEMO_LIVE: LiveShow | null = {
  id: 'live1',
  title: 'Morning Community Check-In',
  host: 'Maya Krishnan',
  icon: '\u{1F399}\uFE0F',
  listeners: 47,
  startedAt: '8:00 AM',
  topic: 'This week\'s community achievements and upcoming events',
  cOTKPerHour: 20,
};

const DEMO_SCHEDULE: ScheduleSlot[] = [
  { id: 'sch1', day: 'Monday', time: '8:00 AM', title: 'Morning Check-In', host: 'Maya K.', icon: '\u2600\uFE0F', recurring: true },
  { id: 'sch2', day: 'Monday', time: '6:00 PM', title: 'Health & Wellness Hour', host: 'Dr. Amara O.', icon: '\u{1F49A}', recurring: true },
  { id: 'sch3', day: 'Tuesday', time: '10:00 AM', title: 'Parenting Circle', host: 'Elena R.', icon: '\u{1F49B}', recurring: true },
  { id: 'sch4', day: 'Tuesday', time: '7:00 PM', title: 'Youth Voices', host: 'Liam W.', icon: '\u{1F31F}', recurring: true },
  { id: 'sch5', day: 'Wednesday', time: '9:00 AM', title: 'Financial Literacy', host: 'Preet S.', icon: '\u{1F4B0}', recurring: true },
  { id: 'sch6', day: 'Wednesday', time: '5:00 PM', title: 'Cultural Exchange', host: 'Fatima A.', icon: '\u{1F30D}', recurring: true },
  { id: 'sch7', day: 'Thursday', time: '8:00 AM', title: 'Governance Forum', host: 'Carlos M.', icon: '\u{1F3DB}\uFE0F', recurring: true },
  { id: 'sch8', day: 'Thursday', time: '6:00 PM', title: 'Tech & Innovation', host: 'Akira T.', icon: '\u{1F4BB}', recurring: true },
  { id: 'sch9', day: 'Friday', time: '10:00 AM', title: 'Story Time', host: 'Amara O.', icon: '\u{1F4D6}', recurring: true },
  { id: 'sch10', day: 'Friday', time: '7:00 PM', title: 'Weekend Preview', host: 'Maya K.', icon: '\u{1F389}', recurring: true },
];

const DEMO_ARCHIVE: ArchivedShow[] = [
  { id: 'a1', title: 'Community Garden Launch', host: 'Akira T.', icon: '\u{1F33F}', date: '2026-03-28', duration: '45 min', listens: 128, topic: 'New community garden opening and volunteer signup' },
  { id: 'a2', title: 'Children\'s Health Special', host: 'Dr. Amara O.', icon: '\u{1F49A}', date: '2026-03-27', duration: '60 min', listens: 203, topic: 'Spring vaccination schedule and child wellness tips' },
  { id: 'a3', title: 'OTK Economics Explained', host: 'Preet S.', icon: '\u{1F4B0}', date: '2026-03-26', duration: '50 min', listens: 167, topic: 'How OTK flows through the community ecosystem' },
  { id: 'a4', title: 'Elder Wisdom Session', host: 'Elena R.', icon: '\u{1F9D3}', date: '2026-03-25', duration: '55 min', listens: 145, topic: 'Intergenerational stories and life lessons' },
  { id: 'a5', title: 'Youth Coding Workshop Recap', host: 'Liam W.', icon: '\u{1F4BB}', date: '2026-03-24', duration: '40 min', listens: 98, topic: 'Highlights from the weekend coding bootcamp' },
  { id: 'a6', title: 'Peace Index Discussion', host: 'Carlos M.', icon: '\u{1F54A}\uFE0F', date: '2026-03-23', duration: '65 min', listens: 189, topic: 'What the Peace Index means for our community' },
];

export function CommunityRadioLiveScreen({ onClose }: Props) {
  const t = useTheme();
  const { demoMode } = useWalletStore();
  const [activeTab, setActiveTab] = useState<'live' | 'schedule' | 'archive'>('live');

  const handleTuneIn = () => {
    Alert.alert('Tune In', 'Live audio streaming will connect here.\n\nIn demo mode, this simulates joining the broadcast.');
  };

  const handlePlayArchive = (show: ArchivedShow) => {
    Alert.alert('Play Recording', `"${show.title}" by ${show.host}\n\n${show.duration} · ${show.listens} listens\n\nAudio playback coming soon.`);
  };

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    demoTag: { backgroundColor: t.accent.yellow + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'center', marginBottom: 16 },
    demoText: { color: t.accent.yellow, fontSize: 12, fontWeight: '700' },
    tabRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: t.bg.card, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: '#fff' },
    quote: { color: t.text.secondary, fontSize: 14, fontStyle: 'italic', textAlign: 'center', lineHeight: 22, marginBottom: 20, paddingHorizontal: 12 },
    liveCard: { backgroundColor: t.bg.card, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: '#ef4444' + '40' },
    liveBadge: { backgroundColor: '#ef4444', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 12 },
    liveBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
    liveIcon: { fontSize: 48, marginBottom: 12 },
    liveTitle: { color: t.text.primary, fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
    liveHost: { color: t.text.secondary, fontSize: 14, marginBottom: 8 },
    liveTopic: { color: t.text.secondary, fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 12, paddingHorizontal: 10 },
    liveStats: { flexDirection: 'row', gap: 20, marginBottom: 16 },
    liveStat: { alignItems: 'center' },
    liveStatNum: { color: t.text.primary, fontSize: 18, fontWeight: '800' },
    liveStatLabel: { color: t.text.muted, fontSize: 11 },
    tuneInBtn: { backgroundColor: '#ef4444', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40 },
    tuneInText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    noLiveCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20 },
    noLiveIcon: { fontSize: 40, marginBottom: 8 },
    noLiveText: { color: t.text.muted, fontSize: 14, textAlign: 'center' },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: '800', marginBottom: 12 },
    dayHeader: { color: t.text.primary, fontSize: 14, fontWeight: '700', marginTop: 12, marginBottom: 8, backgroundColor: t.bg.card, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
    scheduleCard: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, marginBottom: 6, flexDirection: 'row', alignItems: 'center', gap: 12 },
    scheduleTime: { color: t.accent.blue, fontSize: 13, fontWeight: '700', width: 70 },
    scheduleIcon: { fontSize: 20 },
    scheduleInfo: { flex: 1 },
    scheduleTitle: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    scheduleHost: { color: t.text.muted, fontSize: 12 },
    archiveCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
    archiveIcon: { fontSize: 24 },
    archiveInfo: { flex: 1 },
    archiveTitle: { color: t.text.primary, fontSize: 14, fontWeight: '700', marginBottom: 2 },
    archiveMeta: { color: t.text.muted, fontSize: 12 },
    archivePlay: { backgroundColor: t.accent.blue, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
    archivePlayText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    archiveListens: { color: t.text.muted, fontSize: 11, marginTop: 2 },
  }), [t]);

  const groupedSchedule = useMemo(() => {
    const groups: Record<string, ScheduleSlot[]> = {};
    DEMO_SCHEDULE.forEach(slot => {
      if (!groups[slot.day]) groups[slot.day] = [];
      groups[slot.day].push(slot);
    });
    return groups;
  }, []);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Community Radio</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {demoMode && (
          <View style={s.demoTag}>
            <Text style={s.demoText}>DEMO MODE</Text>
          </View>
        )}

        <Text style={s.quote}>"Every voice matters when the community listens."</Text>

        <View style={s.tabRow}>
          {(['live', 'schedule', 'archive'] as const).map((tab) => (
            <TouchableOpacity key={tab} style={[s.tab, activeTab === tab && s.tabActive]} onPress={() => setActiveTab(tab)}>
              <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                {tab === 'live' ? 'Live' : tab === 'schedule' ? 'Schedule' : 'Archive'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'live' && (
          <>
            {DEMO_LIVE ? (
              <View style={s.liveCard}>
                <View style={s.liveBadge}>
                  <Text style={s.liveBadgeText}>LIVE NOW</Text>
                </View>
                <Text style={s.liveIcon}>{DEMO_LIVE.icon}</Text>
                <Text style={s.liveTitle}>{DEMO_LIVE.title}</Text>
                <Text style={s.liveHost}>Hosted by {DEMO_LIVE.host}</Text>
                <Text style={s.liveTopic}>{DEMO_LIVE.topic}</Text>
                <View style={s.liveStats}>
                  <View style={s.liveStat}>
                    <Text style={s.liveStatNum}>{DEMO_LIVE.listeners}</Text>
                    <Text style={s.liveStatLabel}>Listeners</Text>
                  </View>
                  <View style={s.liveStat}>
                    <Text style={s.liveStatNum}>{DEMO_LIVE.startedAt}</Text>
                    <Text style={s.liveStatLabel}>Started</Text>
                  </View>
                  <View style={s.liveStat}>
                    <Text style={s.liveStatNum}>{DEMO_LIVE.cOTKPerHour}</Text>
                    <Text style={s.liveStatLabel}>cOTK/hr</Text>
                  </View>
                </View>
                <TouchableOpacity style={s.tuneInBtn} onPress={handleTuneIn}>
                  <Text style={s.tuneInText}>Tune In</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={s.noLiveCard}>
                <Text style={s.noLiveIcon}>{'\u{1F4FB}'}</Text>
                <Text style={s.noLiveText}>No live broadcasts right now. Check the schedule for upcoming shows.</Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'schedule' && (
          <>
            <Text style={s.sectionTitle}>Weekly Schedule</Text>
            {Object.entries(groupedSchedule).map(([day, slots]) => (
              <View key={day}>
                <Text style={s.dayHeader}>{day}</Text>
                {slots.map(slot => (
                  <View key={slot.id} style={s.scheduleCard}>
                    <Text style={s.scheduleTime}>{slot.time}</Text>
                    <Text style={s.scheduleIcon}>{slot.icon}</Text>
                    <View style={s.scheduleInfo}>
                      <Text style={s.scheduleTitle}>{slot.title}</Text>
                      <Text style={s.scheduleHost}>{slot.host}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </>
        )}

        {activeTab === 'archive' && (
          <>
            <Text style={s.sectionTitle}>Recent Recordings</Text>
            {DEMO_ARCHIVE.map(show => (
              <View key={show.id} style={s.archiveCard}>
                <Text style={s.archiveIcon}>{show.icon}</Text>
                <View style={s.archiveInfo}>
                  <Text style={s.archiveTitle}>{show.title}</Text>
                  <Text style={s.archiveMeta}>{show.host} · {show.date} · {show.duration}</Text>
                  <Text style={s.archiveListens}>{show.listens} listens</Text>
                </View>
                <TouchableOpacity style={s.archivePlay} onPress={() => handlePlayArchive(show)}>
                  <Text style={s.archivePlayText}>Play</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
