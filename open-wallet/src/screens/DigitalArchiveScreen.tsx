import { fonts } from '../utils/theme';
/**
 * Digital Archive Screen — Community memory, historical preservation.
 *
 * Article I: "A community's history belongs to all its members.
 *  Preserving collective memory — photographs, documents, oral histories —
 *  strengthens identity and honors those who came before."
 * — Human Constitution, Article I
 *
 * Features:
 * - Community timeline (key events with dates and descriptions)
 * - Photo archive (historical photos with descriptions, dates, people)
 * - Document preservation (founding docs, newspapers, records — hashes on-chain)
 * - Oral history recordings (hash references to audio/video interviews)
 * - Contribute to archive (submit photos, documents, stories)
 * - Demo mode with sample data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert, TextInput,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// ─── Types ───

type TabKey = 'timeline' | 'photos' | 'documents' | 'contribute';

interface TimelineEvent {
  id: string;
  year: number;
  month?: string;
  title: string;
  description: string;
  category: 'founding' | 'milestone' | 'cultural' | 'infrastructure' | 'recognition';
  significance: 'major' | 'notable' | 'standard';
}

interface ArchivedPhoto {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  people: string[];
  onChainHash: string;
  contributedBy: string;
}

interface ArchivedDocument {
  id: string;
  title: string;
  type: 'founding' | 'newspaper' | 'record' | 'letter' | 'map';
  date: string;
  description: string;
  onChainHash: string;
  preservedDate: string;
  contributedBy: string;
}

interface OralHistory {
  id: string;
  title: string;
  narrator: string;
  interviewer: string;
  date: string;
  duration: string;
  topics: string[];
  onChainHash: string;
  format: 'audio' | 'video';
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'timeline', label: 'Timeline', icon: 'T' },
  { key: 'photos', label: 'Photos', icon: 'P' },
  { key: 'documents', label: 'Docs', icon: 'D' },
  { key: 'contribute', label: 'Add', icon: '+' },
];

const EVENT_CATEGORY_COLORS: Record<string, string> = {
  founding: '#FF9500',
  milestone: '#007AFF',
  cultural: '#AF52DE',
  infrastructure: '#34C759',
  recognition: '#FF3B30',
};

const DOC_TYPE_LABELS: Record<string, string> = {
  founding: 'Founding Document',
  newspaper: 'Newspaper',
  record: 'Official Record',
  letter: 'Correspondence',
  map: 'Map',
};

const CONTRIBUTION_TYPES = [
  { key: 'photo', label: 'Photo', icon: 'P' },
  { key: 'document', label: 'Document', icon: 'D' },
  { key: 'story', label: 'Story', icon: 'S' },
  { key: 'oral_history', label: 'Oral History', icon: 'O' },
];

// ─── Demo Data ───

const DEMO_TIMELINE: TimelineEvent[] = [
  {
    id: 't1',
    year: 1847,
    month: 'March',
    title: 'Community Founded',
    description: 'Twelve families settled along the river valley, establishing the first homesteads and agreeing on a shared governance charter. The original charter emphasized mutual aid and collective stewardship of the land.',
    category: 'founding',
    significance: 'major',
  },
  {
    id: 't2',
    year: 1892,
    title: 'First School Established',
    description: 'The community built its first schoolhouse, a one-room building that served 34 children from the surrounding farms. Teacher Martha Henderson traveled 20 miles weekly to teach.',
    category: 'milestone',
    significance: 'major',
  },
  {
    id: 't3',
    year: 1923,
    month: 'June',
    title: 'Annual Heritage Festival Begins',
    description: 'The first Heritage Festival was held in the town square, celebrating the diverse cultural traditions of community members. It has been held every June since, now in its 103rd year.',
    category: 'cultural',
    significance: 'notable',
  },
  {
    id: 't4',
    year: 1956,
    title: 'Community Center Built',
    description: 'After a decade of fundraising, the community center was constructed entirely by volunteer labor. Over 200 community members contributed more than 15,000 hours of work.',
    category: 'infrastructure',
    significance: 'major',
  },
  {
    id: 't5',
    year: 2008,
    month: 'November',
    title: 'National Historic Designation',
    description: 'The town center and surrounding historic district received National Historic Place designation, recognizing the community significance and architectural heritage spanning over 160 years.',
    category: 'recognition',
    significance: 'notable',
  },
];

const DEMO_PHOTOS: ArchivedPhoto[] = [
  {
    id: 'p1',
    title: 'Original Settlement, River Valley',
    description: 'Daguerreotype showing the first three homesteads along the river, with the original community meeting tree visible in the background.',
    date: '1852',
    location: 'River Valley Settlement',
    people: ['Thomas Whitfield', 'Sarah Whitfield', 'James Running Bear'],
    onChainHash: '0x7a3f...e91c',
    contributedBy: 'Whitfield Family Estate',
  },
  {
    id: 'p2',
    title: 'Schoolhouse Construction',
    description: 'Community members raising the roof beams of the first schoolhouse. Note the diversity of settlers working together — a hallmark of this community from its earliest days.',
    date: '1891',
    location: 'Main Street',
    people: ['William Chen', 'Robert O\'Brien', 'Martha Henderson', 'Community volunteers'],
    onChainHash: '0x2b8d...4f17',
    contributedBy: 'Historical Society',
  },
  {
    id: 'p3',
    title: 'First Heritage Festival',
    description: 'The inaugural Heritage Festival in the town square. Music, food, and crafts from a dozen different cultural traditions. The banner reads "Many Roots, One Community."',
    date: '1923',
    location: 'Town Square',
    people: ['Festival Committee', 'Mayor Eleanor Garcia'],
    onChainHash: '0x5c1e...8a23',
    contributedBy: 'Garcia Family',
  },
  {
    id: 'p4',
    title: 'Community Center Groundbreaking',
    description: 'Hundreds of community members gathered for the groundbreaking ceremony. Children from the school presented a time capsule to be sealed in the foundation.',
    date: '1954',
    location: 'Community Center Site',
    people: ['Mayor Harold Kim', 'School children', 'Building Committee'],
    onChainHash: '0x9d4a...2b56',
    contributedBy: 'Community Archives',
  },
];

const DEMO_DOCUMENTS: ArchivedDocument[] = [
  {
    id: 'd1',
    title: 'Original Community Charter (1847)',
    type: 'founding',
    date: '1847-03-15',
    description: 'The founding governance charter signed by all twelve original families. Establishes principles of mutual aid, shared resources, and democratic decision-making. A remarkably progressive document for its era.',
    onChainHash: '0x1a2b...3c4d',
    preservedDate: '2026-01-15',
    contributedBy: 'Town Hall Archives',
  },
  {
    id: 'd2',
    title: 'Valley Gazette - School Opening Issue',
    type: 'newspaper',
    date: '1892-09-01',
    description: 'Front page coverage of the schoolhouse opening, including interviews with parents and teacher Martha Henderson. Contains the first published photograph from the community.',
    onChainHash: '0x5e6f...7g8h',
    preservedDate: '2026-02-20',
    contributedBy: 'Library Special Collections',
  },
];

const DEMO_ORAL_HISTORIES: OralHistory[] = [
  {
    id: 'o1',
    title: 'Memories of the Great Flood of 1962',
    narrator: 'Margaret Chen-Williams, age 94',
    interviewer: 'Community History Project',
    date: '2024-06-15',
    duration: '1h 23m',
    topics: ['1962 flood', 'Community rebuilding', 'Neighbor helping neighbor', 'Loss and resilience'],
    onChainHash: '0xab12...cd34',
    format: 'video',
  },
];

// ─── Component ───

export function DigitalArchiveScreen({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('timeline');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);
  const [contributionType, setContributionType] = useState('photo');
  const [contributionTitle, setContributionTitle] = useState('');
  const [contributionDesc, setContributionDesc] = useState('');
  const [contributionDate, setContributionDate] = useState('');
  const { demoMode } = useWalletStore();
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    heroCard: { backgroundColor: t.accent.purple + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 20, backgroundColor: t.bg.card, borderRadius: 16, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.purple },
    tabIcon: { fontSize: 16, marginBottom: 2 },
    tabLabel: { color: t.text.secondary, fontSize: 11, fontWeight: fonts.bold },
    tabLabelActive: { color: '#fff' },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 24 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    cardTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold },
    cardDesc: { color: t.text.muted, fontSize: 13, marginTop: 6, lineHeight: 20 },
    cardMeta: { color: t.text.secondary, fontSize: 12, marginTop: 8 },
    timelineCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 2 },
    timelineLine: { position: 'absolute', left: 36, top: 0, bottom: 0, width: 2, backgroundColor: t.accent.purple + '30' },
    timelineYear: { color: t.accent.purple, fontSize: 14, fontWeight: fonts.heavy },
    timelineMonth: { color: t.text.muted, fontSize: 12 },
    timelineTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold, marginTop: 4 },
    timelineDesc: { color: t.text.muted, fontSize: 13, marginTop: 6, lineHeight: 20 },
    categoryBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
    categoryBadgeText: { fontSize: 11, fontWeight: fonts.bold, color: '#fff' },
    significanceDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8, marginTop: 2 },
    eventRow: { flexDirection: 'row', alignItems: 'flex-start' },
    photoCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    photoPlaceholder: { backgroundColor: t.bg.primary, borderRadius: 12, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    photoPlaceholderText: { color: t.text.muted, fontSize: 40 },
    photoTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    photoDate: { color: t.accent.purple, fontSize: 12, fontWeight: fonts.semibold, marginTop: 4 },
    photoLocation: { color: t.text.secondary, fontSize: 12, marginTop: 2 },
    photoDesc: { color: t.text.muted, fontSize: 13, marginTop: 8, lineHeight: 20 },
    peopleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    personChip: { backgroundColor: t.accent.purple + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    personText: { color: t.accent.purple, fontSize: 11, fontWeight: fonts.semibold },
    hashRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    hashLabel: { color: t.text.secondary, fontSize: 11, fontWeight: fonts.semibold },
    hashValue: { color: t.accent.green, fontSize: 11, fontFamily: 'monospace', marginLeft: 6 },
    docCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    docType: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', backgroundColor: t.accent.blue + '20' },
    docTypeText: { color: t.accent.blue, fontSize: 11, fontWeight: fonts.bold },
    docTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold, marginTop: 8 },
    docDate: { color: t.text.secondary, fontSize: 12, marginTop: 4 },
    docDesc: { color: t.text.muted, fontSize: 13, marginTop: 8, lineHeight: 20 },
    preservedDate: { color: t.accent.green, fontSize: 11, marginTop: 8 },
    oralCard: { backgroundColor: t.accent.purple + '08', borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12, borderWidth: 1, borderColor: t.accent.purple + '20' },
    oralTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    oralNarrator: { color: t.accent.purple, fontSize: 13, fontWeight: fonts.semibold, marginTop: 4 },
    oralMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    topicRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    topicChip: { backgroundColor: t.bg.card, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    topicText: { color: t.text.secondary, fontSize: 11, fontWeight: fonts.semibold },
    formatBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
    formatText: { fontSize: 11, fontWeight: fonts.bold, color: '#fff' },
    contributeCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 12 },
    typeRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
    typeChip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: t.bg.primary, alignItems: 'center', minWidth: 72 },
    typeChipActive: { backgroundColor: t.accent.purple },
    typeIcon: { fontSize: 18, marginBottom: 2 },
    typeLabel: { color: t.text.secondary, fontSize: 11, fontWeight: fonts.semibold },
    typeLabelActive: { color: '#fff' },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: fonts.semibold, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 16 },
    textArea: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, minHeight: 100, textAlignVertical: 'top', marginBottom: 16 },
    submitBtn: { backgroundColor: t.accent.purple, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 8 },
    submitBtnText: { color: '#fff', fontSize: 17, fontWeight: fonts.bold },
    infoCard: { backgroundColor: t.accent.green + '10', borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    infoTitle: { color: t.accent.green, fontSize: 14, fontWeight: fonts.bold },
    infoDesc: { color: t.text.muted, fontSize: 13, marginTop: 6, lineHeight: 20 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 20, marginTop: 16, marginBottom: 8 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 22, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 4 },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', padding: 40 },
    demoLabel: { color: t.accent.purple, fontSize: 11, fontWeight: fonts.bold, textAlign: 'center', marginTop: 12 },
    expandBtn: { color: t.accent.blue, fontSize: 12, fontWeight: fonts.semibold, marginTop: 8 },
  }), [t]);

  const handleSubmitContribution = useCallback(() => {
    if (!contributionTitle.trim()) {
      Alert.alert('Required', 'Please enter a title for your contribution.');
      return;
    }
    if (!contributionDesc.trim()) {
      Alert.alert('Required', 'Please enter a description.');
      return;
    }
    Alert.alert(
      'Contribution Submitted',
      `Your ${contributionType} "${contributionTitle}" has been submitted for review. Once approved by the community archivists, it will be preserved on-chain permanently.`,
      [{ text: 'OK', onPress: () => { setContributionTitle(''); setContributionDesc(''); setContributionDate(''); } }],
    );
  }, [contributionType, contributionTitle, contributionDesc]);

  // ─── Tab Renderers ───

  const renderTimeline = useCallback(() => (
    <>
      <View style={s.statsRow}>
        <View style={s.statItem}>
          <Text style={s.statValue}>{DEMO_TIMELINE.length}</Text>
          <Text style={s.statLabel}>Events</Text>
        </View>
        <View style={s.statItem}>
          <Text style={s.statValue}>{DEMO_PHOTOS.length}</Text>
          <Text style={s.statLabel}>Photos</Text>
        </View>
        <View style={s.statItem}>
          <Text style={s.statValue}>{DEMO_DOCUMENTS.length}</Text>
          <Text style={s.statLabel}>Documents</Text>
        </View>
        <View style={s.statItem}>
          <Text style={s.statValue}>{DEMO_ORAL_HISTORIES.length}</Text>
          <Text style={s.statLabel}>Oral Histories</Text>
        </View>
      </View>

      <Text style={s.section}>Community Timeline</Text>
      {DEMO_TIMELINE.map((event, idx) => (
        <TouchableOpacity
          key={event.id}
          style={[s.timelineCard, { marginBottom: idx < DEMO_TIMELINE.length - 1 ? 2 : 12 }]}
          onPress={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
        >
          <View style={s.eventRow}>
            <View style={[s.significanceDot, { backgroundColor: event.significance === 'major' ? EVENT_CATEGORY_COLORS[event.category] : EVENT_CATEGORY_COLORS[event.category] + '80' }]} />
            <View style={{ flex: 1 }}>
              <Text style={s.timelineYear}>
                {event.year}{event.month ? `, ${event.month}` : ''}
              </Text>
              <Text style={s.timelineTitle}>{event.title}</Text>
              {expandedEvent === event.id && (
                <>
                  <Text style={s.timelineDesc}>{event.description}</Text>
                  <View style={[s.categoryBadge, { backgroundColor: EVENT_CATEGORY_COLORS[event.category] }]}>
                    <Text style={s.categoryBadgeText}>{event.category.toUpperCase()}</Text>
                  </View>
                </>
              )}
              {expandedEvent !== event.id && (
                <Text style={s.expandBtn}>Tap to read more</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </>
  ), [s, expandedEvent]);

  const renderPhotos = useCallback(() => (
    <>
      <Text style={s.section}>Historical Photo Archive</Text>
      {DEMO_PHOTOS.map(photo => (
        <TouchableOpacity
          key={photo.id}
          style={s.photoCard}
          onPress={() => setExpandedPhoto(expandedPhoto === photo.id ? null : photo.id)}
        >
          <View style={s.photoPlaceholder}>
            <Text style={s.photoPlaceholderText}>[P]</Text>
          </View>
          <Text style={s.photoTitle}>{photo.title}</Text>
          <Text style={s.photoDate}>{photo.date}</Text>
          <Text style={s.photoLocation}>{photo.location}</Text>

          {expandedPhoto === photo.id && (
            <>
              <Text style={s.photoDesc}>{photo.description}</Text>
              <Text style={[s.cardMeta, { marginTop: 10 }]}>People in photo:</Text>
              <View style={s.peopleRow}>
                {photo.people.map(person => (
                  <View key={person} style={s.personChip}>
                    <Text style={s.personText}>{person}</Text>
                  </View>
                ))}
              </View>
              <View style={s.hashRow}>
                <Text style={s.hashLabel}>On-chain:</Text>
                <Text style={s.hashValue}>{photo.onChainHash}</Text>
              </View>
              <Text style={[s.cardMeta, { marginTop: 4 }]}>Contributed by: {photo.contributedBy}</Text>
            </>
          )}

          {expandedPhoto !== photo.id && (
            <Text style={s.expandBtn}>Tap for details</Text>
          )}
        </TouchableOpacity>
      ))}
    </>
  ), [s, expandedPhoto]);

  const renderDocuments = useCallback(() => (
    <>
      <Text style={s.section}>Preserved Documents</Text>
      {DEMO_DOCUMENTS.map(doc => (
        <View key={doc.id} style={s.docCard}>
          <View style={s.docType}>
            <Text style={s.docTypeText}>{DOC_TYPE_LABELS[doc.type] || doc.type}</Text>
          </View>
          <Text style={s.docTitle}>{doc.title}</Text>
          <Text style={s.docDate}>{doc.date}</Text>
          <Text style={s.docDesc}>{doc.description}</Text>
          <View style={s.hashRow}>
            <Text style={s.hashLabel}>On-chain hash:</Text>
            <Text style={s.hashValue}>{doc.onChainHash}</Text>
          </View>
          <Text style={s.preservedDate}>Preserved on-chain: {doc.preservedDate}</Text>
          <Text style={[s.cardMeta, { marginTop: 4 }]}>Contributed by: {doc.contributedBy}</Text>
        </View>
      ))}

      <Text style={s.section}>Oral History Collection</Text>
      {DEMO_ORAL_HISTORIES.map(oral => (
        <View key={oral.id} style={s.oralCard}>
          <Text style={s.oralTitle}>{oral.title}</Text>
          <Text style={s.oralNarrator}>{oral.narrator}</Text>
          <Text style={s.oralMeta}>Interviewed by: {oral.interviewer}</Text>
          <Text style={s.oralMeta}>{oral.date} -- Duration: {oral.duration}</Text>
          <View style={s.topicRow}>
            {oral.topics.map(topic => (
              <View key={topic} style={s.topicChip}>
                <Text style={s.topicText}>{topic}</Text>
              </View>
            ))}
          </View>
          <View style={[s.formatBadge, { backgroundColor: oral.format === 'video' ? '#AF52DE' : '#007AFF' }]}>
            <Text style={s.formatText}>{oral.format.toUpperCase()}</Text>
          </View>
          <View style={s.hashRow}>
            <Text style={s.hashLabel}>On-chain:</Text>
            <Text style={s.hashValue}>{oral.onChainHash}</Text>
          </View>
        </View>
      ))}

      <View style={s.infoCard}>
        <Text style={s.infoTitle}>On-Chain Preservation</Text>
        <Text style={s.infoDesc}>
          Document and media hashes are stored permanently on the Open Chain. This creates an immutable record that the community's history has been preserved exactly as submitted — no alterations possible. The actual files are stored securely off-chain with the hash serving as proof of authenticity.
        </Text>
      </View>
    </>
  ), [s]);

  const renderContribute = useCallback(() => (
    <>
      <Text style={s.section}>Submit to the Archive</Text>
      <View style={s.contributeCard}>
        <Text style={s.inputLabel}>What are you contributing?</Text>
        <View style={s.typeRow}>
          {CONTRIBUTION_TYPES.map(ct => (
            <TouchableOpacity
              key={ct.key}
              style={[s.typeChip, contributionType === ct.key && s.typeChipActive]}
              onPress={() => setContributionType(ct.key)}
            >
              <Text style={s.typeIcon}>{ct.icon}</Text>
              <Text style={[s.typeLabel, contributionType === ct.key && s.typeLabelActive]}>{ct.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.inputLabel}>Title</Text>
        <TextInput
          style={s.input}
          placeholder="e.g., Town Hall Photo 1965"
          placeholderTextColor={t.text.muted}
          value={contributionTitle}
          onChangeText={setContributionTitle}
        />

        <Text style={s.inputLabel}>Description</Text>
        <TextInput
          style={s.textArea}
          placeholder="Describe what this is, when it's from, who's in it, and why it matters to the community..."
          placeholderTextColor={t.text.muted}
          value={contributionDesc}
          onChangeText={setContributionDesc}
          multiline
        />

        <Text style={s.inputLabel}>Date (approximate is fine)</Text>
        <TextInput
          style={s.input}
          placeholder="e.g., 1965, Summer 1978, March 15 2001"
          placeholderTextColor={t.text.muted}
          value={contributionDate}
          onChangeText={setContributionDate}
        />

        <TouchableOpacity style={s.submitBtn} onPress={handleSubmitContribution}>
          <Text style={s.submitBtnText}>Submit for Review</Text>
        </TouchableOpacity>
      </View>

      <View style={s.infoCard}>
        <Text style={s.infoTitle}>How Contributions Work</Text>
        <Text style={s.infoDesc}>
          1. Submit your photo, document, story, or oral history recording.{'\n'}
          2. Community archivists review for accuracy and relevance.{'\n'}
          3. Once approved, a cryptographic hash is stored on the Open Chain.{'\n'}
          4. Your contribution is permanently preserved in the community archive.{'\n'}
          5. You receive cOTK recognition for preserving community memory.
        </Text>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Guidelines for Contributors</Text>
        <Text style={s.cardDesc}>
          - Include as much context as possible (dates, names, locations).{'\n'}
          - For photos, identify people if you can — future generations will thank you.{'\n'}
          - Oral histories are especially valuable — record elders sharing their memories.{'\n'}
          - All contributions are reviewed to ensure accuracy and respect.{'\n'}
          - You retain ownership; the archive preserves a verified copy.
        </Text>
      </View>
    </>
  ), [s, t, contributionType, contributionTitle, contributionDesc, contributionDate, handleSubmitContribution]);

  const renderContent = useCallback(() => {
    switch (activeTab) {
      case 'timeline': return renderTimeline();
      case 'photos': return renderPhotos();
      case 'documents': return renderDocuments();
      case 'contribute': return renderContribute();
      default: return null;
    }
  }, [activeTab, renderTimeline, renderPhotos, renderDocuments, renderContribute]);

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Digital Archive</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={s.heroCard}>
          <Text style={s.heroIcon}>*</Text>
          <Text style={s.heroTitle}>Community Memory</Text>
          <Text style={s.heroSubtitle}>
            Preserving our history — photographs, documents,{'\n'}and stories — for generations to come
          </Text>
        </View>

        {/* Tabs */}
        <View style={s.tabRow}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[s.tab, activeTab === tab.key && s.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={s.tabIcon}>{tab.icon}</Text>
              <Text style={[s.tabLabel, activeTab === tab.key && s.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {renderContent()}

        {demoMode && <Text style={s.demoLabel}>DEMO MODE -- Sample archive data</Text>}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
