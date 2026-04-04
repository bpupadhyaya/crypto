import { fonts } from '../utils/theme';
/**
 * Volunteer Abroad Screen — Cross-border volunteering, international service.
 *
 * Article X: "International service strengthens bonds between peoples."
 * Open Chain facilitates cross-border volunteering with OTK stipends.
 *
 * Features:
 * - Volunteer opportunities abroad (teaching, healthcare, construction, environment, disaster relief)
 * - Program details (duration, location, skills needed, OTK stipend, housing)
 * - Application process (apply, prepare, travel, serve, return)
 * - Impact stories from returned volunteers
 * - Inter-regional partnership connections
 * - Cultural preparation guides for destination regions
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

interface Opportunity {
  id: string;
  title: string;
  category: string;
  icon: string;
  country: string;
  region: string;
  duration: string;
  startDate: string;
  skillsNeeded: string[];
  otkStipend: number;
  housingProvided: boolean;
  housingType: string;
  description: string;
  spotsAvailable: number;
  partnerOrg: string;
  urgency: 'normal' | 'high' | 'critical';
}

interface Application {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  country: string;
  status: 'submitted' | 'reviewing' | 'accepted' | 'preparing' | 'traveling' | 'serving' | 'returned';
  submittedDate: string;
  notes: string;
}

interface ImpactStory {
  id: string;
  volunteerName: string;
  country: string;
  category: string;
  title: string;
  excerpt: string;
  impactMetrics: { label: string; value: string }[];
  duration: string;
  returnDate: string;
}

interface CulturalGuide {
  region: string;
  language: string;
  greetingPhrase: string;
  customsTips: string[];
  climateSummary: string;
  essentialPacking: string[];
}

interface Partnership {
  id: string;
  orgName: string;
  country: string;
  focusAreas: string[];
  activeSince: string;
  volunteersHosted: number;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const CATEGORIES = [
  { key: 'teaching', label: 'Teaching', icon: 'T' },
  { key: 'healthcare', label: 'Healthcare', icon: '+' },
  { key: 'construction', label: 'Construction', icon: '#' },
  { key: 'environment', label: 'Environment', icon: '~' },
  { key: 'disaster_relief', label: 'Disaster Relief', icon: '!' },
];

const APPLICATION_STEPS = [
  { key: 'submitted', label: 'Apply', description: 'Submit your application and skills profile' },
  { key: 'accepted', label: 'Prepare', description: 'Complete cultural training and logistics' },
  { key: 'traveling', label: 'Travel', description: 'Journey to your destination' },
  { key: 'serving', label: 'Serve', description: 'Contribute your skills on the ground' },
  { key: 'returned', label: 'Return', description: 'Share your experience and impact' },
];

// ─── Demo Data ───

const DEMO_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'op1', title: 'Rural School English Program', category: 'teaching', icon: 'T',
    country: 'Nepal', region: 'South Asia', duration: '3 months',
    startDate: '2026-06-01', skillsNeeded: ['English fluency', 'Teaching experience', 'Patience'],
    otkStipend: 4500, housingProvided: true, housingType: 'Shared volunteer house',
    description: 'Teach English to children aged 8-14 in rural mountain villages. Classes of 15-20 students. You will develop curriculum, lead daily lessons, and train local teachers to continue after your departure.',
    spotsAvailable: 4, partnerOrg: 'Himalayan Education Trust', urgency: 'normal',
  },
  {
    id: 'op2', title: 'Community Health Clinic Support', category: 'healthcare', icon: '+',
    country: 'Kenya', region: 'East Africa', duration: '6 months',
    startDate: '2026-05-15', skillsNeeded: ['Medical training', 'First aid certified', 'Adaptable'],
    otkStipend: 8200, housingProvided: true, housingType: 'Private room in clinic compound',
    description: 'Support a rural health clinic serving 3,000 community members. Assist with patient intake, health education workshops, maternal care visits, and supply chain management. Medical professionals and trained volunteers welcome.',
    spotsAvailable: 2, partnerOrg: 'East Africa Health Alliance', urgency: 'high',
  },
  {
    id: 'op3', title: 'Rainforest Restoration Project', category: 'environment', icon: '~',
    country: 'Costa Rica', region: 'Central America', duration: '2 months',
    startDate: '2026-07-01', skillsNeeded: ['Physical fitness', 'Environmental awareness', 'Teamwork'],
    otkStipend: 3200, housingProvided: true, housingType: 'Eco-lodge dormitory',
    description: 'Join a team restoring degraded rainforest corridors. Plant native trees, monitor wildlife, maintain trails, and support community reforestation education. No prior experience required — full training provided.',
    spotsAvailable: 8, partnerOrg: 'Bosque Verde Foundation', urgency: 'normal',
  },
];

const DEMO_APPLICATION: Application = {
  id: 'app1', opportunityId: 'op1', opportunityTitle: 'Rural School English Program',
  country: 'Nepal', status: 'preparing', submittedDate: '2026-03-10',
  notes: 'Cultural orientation scheduled for April 15. Visa application in progress.',
};

const DEMO_IMPACT_STORIES: ImpactStory[] = [
  {
    id: 'is1', volunteerName: 'Aisha K.', country: 'Senegal', category: 'teaching',
    title: 'A Year of Stories: Literacy That Lasts',
    excerpt: 'What started as a 3-month reading program became a year-long journey. Aisha helped establish a community library with 2,000 donated books and trained 8 local reading mentors who continue the program today.',
    impactMetrics: [
      { label: 'Students reached', value: '180' },
      { label: 'Books donated', value: '2,000' },
      { label: 'Local mentors trained', value: '8' },
    ],
    duration: '12 months', returnDate: '2026-01-15',
  },
  {
    id: 'is2', volunteerName: 'Carlos M.', country: 'Philippines', category: 'disaster_relief',
    title: 'Rebuilding After the Storm',
    excerpt: 'After Typhoon Mara, Carlos joined a rapid-response team that rebuilt 14 homes and 2 schools in 4 months. The community now has a disaster preparedness plan and early warning system that Carlos helped design.',
    impactMetrics: [
      { label: 'Homes rebuilt', value: '14' },
      { label: 'Schools restored', value: '2' },
      { label: 'Families supported', value: '62' },
    ],
    duration: '4 months', returnDate: '2025-11-20',
  },
];

const DEMO_CULTURAL_GUIDES: CulturalGuide[] = [
  {
    region: 'South Asia', language: 'Nepali (Nepal), Hindi (India), Sinhala (Sri Lanka)',
    greetingPhrase: 'Namaste (palms together, slight bow)',
    customsTips: [
      'Remove shoes before entering homes and temples',
      'Use right hand for eating and passing items',
      'Dress modestly, especially at religious sites',
      'Bargaining is expected at markets but keep it friendly',
      'Tea is a social ritual — never refuse the first cup',
    ],
    climateSummary: 'Varies from tropical lowlands to alpine highlands. Monsoon season June-September.',
    essentialPacking: ['Light layers', 'Rain gear', 'Modest clothing', 'Reusable water bottle', 'Basic first aid kit'],
  },
  {
    region: 'East Africa', language: 'Swahili (Kenya/Tanzania), English widely spoken',
    greetingPhrase: 'Jambo! / Habari (How are you?)',
    customsTips: [
      'Greet elders first and use both hands for handshakes',
      'Ask permission before photographing people',
      'Punctuality is flexible — relationships matter more than schedules',
      'Learn basic Swahili phrases — locals deeply appreciate the effort',
      'Communal meals are common — eat with your right hand',
    ],
    climateSummary: 'Equatorial with dry and rainy seasons. Highlands are cool year-round.',
    essentialPacking: ['Sun protection', 'Antimalarial medication', 'Sturdy walking shoes', 'Light long sleeves', 'Insect repellent'],
  },
  {
    region: 'Central America', language: 'Spanish (Costa Rica, Guatemala)',
    greetingPhrase: 'Hola! / Pura Vida (Costa Rica)',
    customsTips: [
      'Personal space is closer than in North America or Europe',
      'Lunch is the main meal of the day',
      'Tico time — expect a relaxed approach to schedules',
      'Biodiversity is a point of national pride — respect nature',
      'Learn to say Pura Vida — it means everything positive',
    ],
    climateSummary: 'Tropical with dry season (Dec-Apr) and rainy season (May-Nov). Cooler in highlands.',
    essentialPacking: ['Rain jacket', 'Hiking boots', 'Sunscreen', 'Spanish phrasebook', 'Reusable containers'],
  },
];

const DEMO_PARTNERSHIPS: Partnership[] = [
  { id: 'pt1', orgName: 'Himalayan Education Trust', country: 'Nepal', focusAreas: ['Education', 'Teacher training'], activeSince: '2025-06', volunteersHosted: 28 },
  { id: 'pt2', orgName: 'East Africa Health Alliance', country: 'Kenya', focusAreas: ['Healthcare', 'Maternal care', 'Health education'], activeSince: '2025-03', volunteersHosted: 45 },
  { id: 'pt3', orgName: 'Bosque Verde Foundation', country: 'Costa Rica', focusAreas: ['Reforestation', 'Wildlife conservation'], activeSince: '2025-09', volunteersHosted: 62 },
];

type Tab = 'opportunities' | 'apply' | 'stories' | 'prepare';

export function VolunteerAbroadScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('opportunities');
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [selectedStory, setSelectedStory] = useState<ImpactStory | null>(null);
  const [selectedGuide, setSelectedGuide] = useState<CulturalGuide | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const filteredOpps = useMemo(() => {
    if (!filterCategory) return DEMO_OPPORTUNITIES;
    return DEMO_OPPORTUNITIES.filter((o) => o.category === filterCategory);
  }, [filterCategory]);

  const handleApply = useCallback((opp: Opportunity) => {
    Alert.alert(
      'Apply to Program',
      `${opp.title}\n${opp.country} -- ${opp.duration}\nStipend: ${opp.otkStipend} OTK\n\nYour application will be reviewed by ${opp.partnerOrg}. You will be notified within 7 days.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit Application', onPress: () => {
          Alert.alert('Application Submitted', 'Your application has been sent. Check the Apply tab for status updates.');
          setTab('apply');
        }},
      ],
    );
  }, []);

  const urgencyColors: Record<string, string> = {
    normal: '#8E8E93',
    high: '#FF9500',
    critical: '#FF3B30',
  };

  const statusColors: Record<string, string> = {
    submitted: '#FF9500',
    reviewing: '#FF9500',
    accepted: '#007AFF',
    preparing: '#AF52DE',
    traveling: '#007AFF',
    serving: '#34C759',
    returned: '#8E8E93',
  };

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.blue + '20' },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.blue },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    subText: { color: t.text.muted, fontSize: 13, marginTop: 4 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    filterRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, flexWrap: 'wrap' },
    filterBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, marginRight: 8, marginBottom: 6, backgroundColor: t.bg.secondary },
    filterActive: { backgroundColor: t.accent.blue + '20' },
    filterText: { color: t.text.muted, fontSize: 11, fontWeight: fonts.semibold },
    filterTextActive: { color: t.accent.blue },
    oppTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold },
    oppCategory: { color: t.text.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
    oppIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: t.accent.blue + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    iconText: { color: t.accent.blue, fontSize: 18, fontWeight: fonts.heavy },
    oppRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    countryText: { color: t.accent.blue, fontSize: 13, fontWeight: fonts.semibold },
    durationText: { color: t.text.muted, fontSize: 12 },
    stipendText: { color: t.accent.green, fontSize: 18, fontWeight: fonts.heavy },
    stipendLabel: { color: t.text.muted, fontSize: 11, textTransform: 'uppercase' },
    skillTag: { backgroundColor: t.accent.blue + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 6, marginBottom: 6 },
    skillTagText: { color: t.accent.blue, fontSize: 11, fontWeight: fonts.semibold },
    skillRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
    urgencyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    urgencyText: { fontSize: 10, fontWeight: fonts.bold, textTransform: 'uppercase' },
    applyBtn: { backgroundColor: t.accent.blue, borderRadius: 14, padding: 14, marginTop: 12, alignItems: 'center' },
    applyBtnText: { color: '#fff', fontSize: 14, fontWeight: fonts.bold },
    detailBack: { color: t.accent.blue, fontSize: 14, marginHorizontal: 20, marginBottom: 12 },
    detailDesc: { color: t.text.primary, fontSize: 14, lineHeight: 22, marginBottom: 12 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 12 },
    detailItem: { alignItems: 'center' },
    detailValue: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy },
    detailLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    housingText: { color: t.text.primary, fontSize: 13, marginTop: 4 },
    housingLabel: { color: t.text.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginTop: 12 },
    stepsContainer: { marginHorizontal: 20, marginBottom: 20 },
    stepRow: { flexDirection: 'row', marginBottom: 16 },
    stepIndicator: { width: 32, alignItems: 'center' },
    stepDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
    stepLine: { width: 2, flex: 1, marginTop: 4 },
    stepContent: { flex: 1, marginLeft: 12 },
    stepLabel: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    stepDesc: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    appCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 16 },
    appTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    appCountry: { color: t.accent.blue, fontSize: 13, marginTop: 2 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    statusText: { fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase' },
    appNotes: { color: t.text.muted, fontSize: 13, marginTop: 8, fontStyle: 'italic' },
    storyCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    storyTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold, marginBottom: 8 },
    storyExcerpt: { color: t.text.muted, fontSize: 13, lineHeight: 20 },
    storyVolunteer: { color: t.accent.blue, fontSize: 12, fontWeight: fonts.semibold, marginTop: 8 },
    metricRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: t.text.muted + '15' },
    metricItem: { alignItems: 'center' },
    metricValue: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy },
    metricLabel: { color: t.text.muted, fontSize: 10, marginTop: 2, textAlign: 'center' },
    guideCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    guideRegion: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 4 },
    guideLanguage: { color: t.accent.blue, fontSize: 13, marginBottom: 8 },
    guideGreeting: { color: t.accent.green, fontSize: 14, fontWeight: fonts.semibold, fontStyle: 'italic', marginBottom: 12 },
    guideTip: { color: t.text.primary, fontSize: 13, marginBottom: 6, paddingLeft: 8 },
    guideClimate: { color: t.text.muted, fontSize: 12, marginTop: 8, fontStyle: 'italic' },
    guidePacking: { color: t.text.primary, fontSize: 13, marginLeft: 8, marginBottom: 4 },
    guideSubhead: { color: t.text.muted, fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1, marginTop: 12, marginBottom: 6 },
    partnerCard: { backgroundColor: t.bg.secondary, borderRadius: 12, padding: 14, marginHorizontal: 20, marginBottom: 10 },
    partnerName: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    partnerCountry: { color: t.accent.blue, fontSize: 12, marginTop: 2 },
    partnerFocus: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    partnerStat: { color: t.text.primary, fontSize: 12, marginTop: 4 },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', padding: 40 },
    demoBanner: { backgroundColor: t.accent.orange + '15', padding: 10, marginHorizontal: 20, borderRadius: 10, marginBottom: 12 },
    demoText: { color: t.accent.orange || '#FF9500', fontSize: 12, textAlign: 'center', fontWeight: fonts.semibold },
    spotsText: { color: t.accent.green, fontSize: 12, fontWeight: fonts.semibold },
  }), [t]);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'opportunities', label: 'Opportunities' },
    { key: 'apply', label: 'Apply' },
    { key: 'stories', label: 'Stories' },
    { key: 'prepare', label: 'Prepare' },
  ];

  // ─── Opportunity Detail ───

  const renderOppDetail = () => {
    if (!selectedOpp) return null;
    const opp = selectedOpp;
    return (
      <>
        <TouchableOpacity onPress={() => setSelectedOpp(null)}>
          <Text style={s.detailBack}>{'< Back to Opportunities'}</Text>
        </TouchableOpacity>
        <View style={s.card}>
          <View style={s.oppRow}>
            <View style={s.oppIcon}>
              <Text style={s.iconText}>{opp.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.oppTitle}>{opp.title}</Text>
              <Text style={s.oppCategory}>{opp.category.replace('_', ' ')}</Text>
            </View>
            {opp.urgency !== 'normal' && (
              <View style={[s.urgencyBadge, { backgroundColor: urgencyColors[opp.urgency] + '20' }]}>
                <Text style={[s.urgencyText, { color: urgencyColors[opp.urgency] }]}>{opp.urgency}</Text>
              </View>
            )}
          </View>

          <Text style={s.detailDesc}>{opp.description}</Text>

          <View style={s.detailRow}>
            <View style={s.detailItem}>
              <Text style={s.detailValue}>{opp.country}</Text>
              <Text style={s.detailLabel}>Location</Text>
            </View>
            <View style={s.detailItem}>
              <Text style={s.detailValue}>{opp.duration}</Text>
              <Text style={s.detailLabel}>Duration</Text>
            </View>
            <View style={s.detailItem}>
              <Text style={s.stipendText}>{opp.otkStipend}</Text>
              <Text style={s.detailLabel}>OTK Stipend</Text>
            </View>
          </View>

          <Text style={s.housingLabel}>Housing</Text>
          <Text style={s.housingText}>{opp.housingProvided ? opp.housingType : 'Not provided — stipend includes housing allowance'}</Text>

          <Text style={s.housingLabel}>Skills Needed</Text>
          <View style={s.skillRow}>
            {opp.skillsNeeded.map((skill) => (
              <View key={skill} style={s.skillTag}>
                <Text style={s.skillTagText}>{skill}</Text>
              </View>
            ))}
          </View>

          <View style={[s.row, { marginTop: 12 }]}>
            <Text style={s.spotsText}>{opp.spotsAvailable} spots available</Text>
            <Text style={s.subText}>Starts {opp.startDate}</Text>
          </View>
          <Text style={s.subText}>Partner: {opp.partnerOrg}</Text>

          <TouchableOpacity style={s.applyBtn} onPress={() => handleApply(opp)}>
            <Text style={s.applyBtnText}>Apply Now</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  };

  // ─── Opportunities Tab ───

  const renderOpportunities = () => {
    if (selectedOpp) return renderOppDetail();
    return (
      <>
        <Text style={s.sectionTitle}>Volunteer Opportunities Abroad</Text>
        <View style={s.filterRow}>
          <TouchableOpacity
            style={[s.filterBtn, !filterCategory && s.filterActive]}
            onPress={() => setFilterCategory(null)}
          >
            <Text style={[s.filterText, !filterCategory && s.filterTextActive]}>All</Text>
          </TouchableOpacity>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[s.filterBtn, filterCategory === cat.key && s.filterActive]}
              onPress={() => setFilterCategory(filterCategory === cat.key ? null : cat.key)}
            >
              <Text style={[s.filterText, filterCategory === cat.key && s.filterTextActive]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {filteredOpps.map((opp) => (
          <TouchableOpacity key={opp.id} style={s.card} onPress={() => setSelectedOpp(opp)}>
            <View style={s.oppRow}>
              <View style={s.oppIcon}>
                <Text style={s.iconText}>{opp.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.oppTitle}>{opp.title}</Text>
                <Text style={s.oppCategory}>{opp.category.replace('_', ' ')} -- {opp.country}</Text>
              </View>
              {opp.urgency !== 'normal' && (
                <View style={[s.urgencyBadge, { backgroundColor: urgencyColors[opp.urgency] + '20' }]}>
                  <Text style={[s.urgencyText, { color: urgencyColors[opp.urgency] }]}>{opp.urgency}</Text>
                </View>
              )}
            </View>
            <View style={s.row}>
              <Text style={s.durationText}>{opp.duration} -- starts {opp.startDate}</Text>
              <Text style={s.stipendText}>{opp.otkStipend} OTK</Text>
            </View>
            <View style={[s.row, { marginTop: 6 }]}>
              <Text style={s.spotsText}>{opp.spotsAvailable} spots</Text>
              <Text style={s.subText}>{opp.housingProvided ? 'Housing provided' : 'Housing allowance'}</Text>
            </View>
          </TouchableOpacity>
        ))}
        {filteredOpps.length === 0 && (
          <Text style={s.emptyText}>No opportunities in this category right now.</Text>
        )}
      </>
    );
  };

  // ─── Apply Tab ───

  const renderApply = () => (
    <>
      <Text style={s.sectionTitle}>Application Process</Text>
      <View style={s.stepsContainer}>
        {APPLICATION_STEPS.map((step, idx) => {
          const stepIdx = APPLICATION_STEPS.findIndex((s_) => s_.key === DEMO_APPLICATION.status);
          const isComplete = idx <= stepIdx;
          const isCurrent = idx === stepIdx;
          const dotColor = isComplete ? t.accent.blue : t.text.muted + '40';
          const lineColor = idx < stepIdx ? t.accent.blue : t.text.muted + '20';
          return (
            <View key={step.key} style={s.stepRow}>
              <View style={s.stepIndicator}>
                <View style={[s.stepDot, {
                  backgroundColor: isCurrent ? t.accent.blue : 'transparent',
                  borderColor: dotColor,
                }]} />
                {idx < APPLICATION_STEPS.length - 1 && (
                  <View style={[s.stepLine, { backgroundColor: lineColor }]} />
                )}
              </View>
              <View style={s.stepContent}>
                <Text style={[s.stepLabel, { opacity: isComplete ? 1 : 0.5 }]}>{step.label}</Text>
                <Text style={[s.stepDesc, { opacity: isComplete ? 1 : 0.5 }]}>{step.description}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <Text style={s.sectionTitle}>Your Applications</Text>
      <View style={s.appCard}>
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={s.appTitle}>{DEMO_APPLICATION.opportunityTitle}</Text>
            <Text style={s.appCountry}>{DEMO_APPLICATION.country}</Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor: (statusColors[DEMO_APPLICATION.status] || '#8E8E93') + '20' }]}>
            <Text style={[s.statusText, { color: statusColors[DEMO_APPLICATION.status] || '#8E8E93' }]}>
              {DEMO_APPLICATION.status}
            </Text>
          </View>
        </View>
        <Text style={s.subText}>Submitted: {DEMO_APPLICATION.submittedDate}</Text>
        <Text style={s.appNotes}>{DEMO_APPLICATION.notes}</Text>
      </View>

      <Text style={s.sectionTitle}>Partner Organizations</Text>
      {DEMO_PARTNERSHIPS.map((partner) => (
        <View key={partner.id} style={s.partnerCard}>
          <Text style={s.partnerName}>{partner.orgName}</Text>
          <Text style={s.partnerCountry}>{partner.country}</Text>
          <Text style={s.partnerFocus}>Focus: {partner.focusAreas.join(', ')}</Text>
          <Text style={s.partnerStat}>Active since {partner.activeSince} -- {partner.volunteersHosted} volunteers hosted</Text>
        </View>
      ))}
    </>
  );

  // ─── Stories Tab ───

  const renderStories = () => {
    if (selectedStory) {
      return (
        <>
          <TouchableOpacity onPress={() => setSelectedStory(null)}>
            <Text style={s.detailBack}>{'< Back to Stories'}</Text>
          </TouchableOpacity>
          <View style={s.storyCard}>
            <Text style={s.storyTitle}>{selectedStory.title}</Text>
            <Text style={s.storyVolunteer}>{selectedStory.volunteerName} -- {selectedStory.country} -- {selectedStory.duration}</Text>
            <Text style={[s.storyExcerpt, { marginTop: 12 }]}>{selectedStory.excerpt}</Text>
            <View style={s.metricRow}>
              {selectedStory.impactMetrics.map((m) => (
                <View key={m.label} style={s.metricItem}>
                  <Text style={s.metricValue}>{m.value}</Text>
                  <Text style={s.metricLabel}>{m.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </>
      );
    }

    return (
      <>
        <Text style={s.sectionTitle}>Impact Stories</Text>
        {DEMO_IMPACT_STORIES.map((story) => (
          <TouchableOpacity key={story.id} style={s.storyCard} onPress={() => setSelectedStory(story)}>
            <Text style={s.storyTitle}>{story.title}</Text>
            <Text style={s.storyVolunteer}>{story.volunteerName} -- {story.country}</Text>
            <Text style={s.storyExcerpt} numberOfLines={3}>{story.excerpt}</Text>
            <View style={s.metricRow}>
              {story.impactMetrics.map((m) => (
                <View key={m.label} style={s.metricItem}>
                  <Text style={s.metricValue}>{m.value}</Text>
                  <Text style={s.metricLabel}>{m.label}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </>
    );
  };

  // ─── Prepare Tab ───

  const renderPrepare = () => {
    if (selectedGuide) {
      return (
        <>
          <TouchableOpacity onPress={() => setSelectedGuide(null)}>
            <Text style={s.detailBack}>{'< Back to Guides'}</Text>
          </TouchableOpacity>
          <View style={s.guideCard}>
            <Text style={s.guideRegion}>{selectedGuide.region}</Text>
            <Text style={s.guideLanguage}>{selectedGuide.language}</Text>
            <Text style={s.guideGreeting}>"{selectedGuide.greetingPhrase}"</Text>

            <Text style={s.guideSubhead}>Cultural Tips</Text>
            {selectedGuide.customsTips.map((tip) => (
              <Text key={tip} style={s.guideTip}>-- {tip}</Text>
            ))}

            <Text style={s.guideSubhead}>Climate</Text>
            <Text style={s.guideClimate}>{selectedGuide.climateSummary}</Text>

            <Text style={s.guideSubhead}>Essential Packing</Text>
            {selectedGuide.essentialPacking.map((item) => (
              <Text key={item} style={s.guidePacking}>-- {item}</Text>
            ))}
          </View>
        </>
      );
    }

    return (
      <>
        <Text style={s.sectionTitle}>Cultural Preparation Guides</Text>
        {DEMO_CULTURAL_GUIDES.map((guide) => (
          <TouchableOpacity key={guide.region} style={s.guideCard} onPress={() => setSelectedGuide(guide)}>
            <Text style={s.guideRegion}>{guide.region}</Text>
            <Text style={s.guideLanguage}>{guide.language}</Text>
            <Text style={s.guideGreeting}>"{guide.greetingPhrase}"</Text>
            <Text style={s.subText}>{guide.customsTips.length} cultural tips -- {guide.essentialPacking.length} packing items</Text>
          </TouchableOpacity>
        ))}

        <Text style={s.sectionTitle}>Inter-Regional Partnerships</Text>
        {DEMO_PARTNERSHIPS.map((partner) => (
          <View key={partner.id} style={s.partnerCard}>
            <Text style={s.partnerName}>{partner.orgName}</Text>
            <Text style={s.partnerCountry}>{partner.country}</Text>
            <Text style={s.partnerFocus}>Focus: {partner.focusAreas.join(', ')}</Text>
            <Text style={s.partnerStat}>{partner.volunteersHosted} volunteers hosted since {partner.activeSince}</Text>
          </View>
        ))}
      </>
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Volunteer Abroad</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      {demoMode && (
        <View style={s.demoBanner}>
          <Text style={s.demoText}>Demo Mode -- 3 opportunities, 2 impact stories, 1 active application</Text>
        </View>
      )}

      <View style={s.tabRow}>
        {TABS.map((t_) => (
          <TouchableOpacity
            key={t_.key}
            style={[s.tabBtn, tab === t_.key && s.tabActive]}
            onPress={() => { setTab(t_.key); setSelectedOpp(null); setSelectedStory(null); setSelectedGuide(null); }}
          >
            <Text style={[s.tabText, tab === t_.key && s.tabTextActive]}>{t_.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {tab === 'opportunities' && renderOpportunities()}
        {tab === 'apply' && renderApply()}
        {tab === 'stories' && renderStories()}
        {tab === 'prepare' && renderPrepare()}
      </ScrollView>
    </SafeAreaView>
  );
}
