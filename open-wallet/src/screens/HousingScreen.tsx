/**
 * Housing Security — Article I basic needs.
 *
 * "Safe, stable housing is the foundation upon which a person builds
 *  their life. Without it, every other need becomes harder to meet."
 *
 * Features:
 * - Housing security score (0-100: affordability, stability, quality, access)
 * - Community housing initiatives (co-housing, land trusts, building co-ops)
 * - Housing needs assessment form
 * - Emergency shelter directory
 * - Housing improvement fund — community OTK pool
 * - Building skills exchange
 * - Demo mode with sample data
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

type HousingTab = 'dashboard' | 'initiatives' | 'needs' | 'shelters';

/* ── Data types ── */

interface ScoreDimension {
  key: string;
  label: string;
  icon: string;
  score: number;
  description: string;
}

interface Initiative {
  id: string;
  name: string;
  type: 'co-housing' | 'land-trust' | 'building-co-op';
  members: number;
  location: string;
  status: 'active' | 'forming' | 'planned';
  description: string;
  otkCommitted: number;
}

interface Shelter {
  id: string;
  name: string;
  type: 'shelter' | 'temporary' | 'host-family';
  capacity: number;
  available: number;
  location: string;
  phone: string;
  services: string[];
}

interface ImprovementProject {
  id: string;
  title: string;
  description: string;
  otkGoal: number;
  otkRaised: number;
  contributors: number;
  status: 'funding' | 'in-progress' | 'complete';
}

interface SkillExchange {
  id: string;
  skill: string;
  category: 'construction' | 'plumbing' | 'electrical' | 'carpentry' | 'painting';
  teacher: string;
  learners: number;
  nextSession: string;
}

interface NeedsForm {
  currentSituation: string;
  typeNeeded: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  householdSize: string;
  notes: string;
}

/* ── Demo data ── */

const DEMO_DIMENSIONS: ScoreDimension[] = [
  { key: 'affordability', label: 'Affordability', icon: '\uD83D\uDCB0', score: 62, description: 'Housing costs < 30% of income' },
  { key: 'stability', label: 'Stability', icon: '\uD83C\uDFE0', score: 78, description: 'Secure tenure, low displacement risk' },
  { key: 'quality', label: 'Quality', icon: '\u2B50', score: 74, description: 'Safe structure, utilities, maintenance' },
  { key: 'access', label: 'Access', icon: '\uD83D\uDEAA', score: 70, description: 'Availability of housing in area' },
];

const DEMO_INITIATIVES: Initiative[] = [
  {
    id: 'i1', name: 'Green Commons Co-Housing', type: 'co-housing',
    members: 18, location: 'Portland, OR', status: 'active',
    description: 'Shared living community with private units and common spaces. Focus on sustainability and mutual aid.',
    otkCommitted: 45_200,
  },
  {
    id: 'i2', name: 'Valley Land Trust', type: 'land-trust',
    members: 42, location: 'Asheville, NC', status: 'active',
    description: 'Community land trust ensuring permanently affordable homes. Land owned collectively, homes owned individually.',
    otkCommitted: 128_000,
  },
];

const DEMO_SHELTERS: Shelter[] = [
  {
    id: 's1', name: 'Harbor Light Center', type: 'shelter',
    capacity: 120, available: 14, location: '1234 Main St',
    phone: '(555) 234-5678',
    services: ['meals', 'showers', 'case management', 'job training'],
  },
  {
    id: 's2', name: 'Family Bridge Temporary Housing', type: 'temporary',
    capacity: 30, available: 5, location: '890 Oak Ave',
    phone: '(555) 345-6789',
    services: ['furnished units', 'childcare', 'financial counseling'],
  },
  {
    id: 's3', name: 'Open Doors Host Network', type: 'host-family',
    capacity: 25, available: 8, location: 'Various neighborhoods',
    phone: '(555) 456-7890',
    services: ['private room', 'family meals', 'community support', 'flexible duration'],
  },
];

const DEMO_IMPROVEMENT: ImprovementProject[] = [
  {
    id: 'p1', title: 'Riverside Roof Repairs',
    description: '12 homes with leaking roofs in the Riverside community. Community fund covers materials, volunteers provide labor.',
    otkGoal: 24_000, otkRaised: 17_800, contributors: 34,
    status: 'funding',
  },
];

const DEMO_SKILLS: SkillExchange[] = [
  { id: 'sk1', skill: 'Basic Framing & Drywall', category: 'construction', teacher: 'Marcus W.', learners: 8, nextSession: 'Apr 5, 2026' },
  { id: 'sk2', skill: 'Pipe Fitting & Leak Repair', category: 'plumbing', teacher: 'Rosa M.', learners: 5, nextSession: 'Apr 8, 2026' },
  { id: 'sk3', skill: 'Home Wiring Safety', category: 'electrical', teacher: 'James K.', learners: 6, nextSession: 'Apr 12, 2026' },
];

const TYPE_LABELS: Record<Initiative['type'], string> = {
  'co-housing': 'Co-Housing',
  'land-trust': 'Land Trust',
  'building-co-op': 'Building Co-op',
};

const SHELTER_TYPE_LABELS: Record<Shelter['type'], string> = {
  'shelter': 'Emergency Shelter',
  'temporary': 'Temporary Housing',
  'host-family': 'Host Family',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#16a34a', forming: '#eab308', planned: '#6b7280',
  funding: '#eab308', 'in-progress': '#3b82f6', complete: '#16a34a',
};

const URGENCY_COLORS: Record<string, string> = {
  low: '#16a34a', medium: '#eab308', high: '#f97316', emergency: '#ef4444',
};

const CATEGORY_ICONS: Record<string, string> = {
  construction: '\uD83D\uDD28', plumbing: '\uD83D\uDEB0', electrical: '\u26A1',
  carpentry: '\uD83E\uDE9A', painting: '\uD83C\uDFA8',
};

function scoreColor(score: number): string {
  if (score >= 80) return '#16a34a';
  if (score >= 60) return '#22c55e';
  if (score >= 40) return '#eab308';
  if (score >= 20) return '#f97316';
  return '#ef4444';
}

export function HousingScreen({ onClose }: Props) {
  const { demoMode } = useWalletStore();
  const t = useTheme();
  const [activeTab, setActiveTab] = useState<HousingTab>('dashboard');
  const [needsForm, setNeedsForm] = useState<NeedsForm>({
    currentSituation: '', typeNeeded: '', urgency: 'medium', householdSize: '', notes: '',
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const dimensions = demoMode ? DEMO_DIMENSIONS : [];
  const initiatives = demoMode ? DEMO_INITIATIVES : [];
  const shelters = demoMode ? DEMO_SHELTERS : [];
  const improvements = demoMode ? DEMO_IMPROVEMENT : [];
  const skills = demoMode ? DEMO_SKILLS : [];

  const overallScore = useMemo(() => {
    if (dimensions.length === 0) return 0;
    return Math.round(dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length);
  }, [dimensions]);

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
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    label: { color: t.text.muted, fontSize: 12 },
    val: { color: t.text.secondary, fontSize: 12, fontWeight: '600' },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 8, marginBottom: 8 },
    summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    summaryCard: { flex: 1, backgroundColor: t.bg.card, borderRadius: 12, padding: 14, alignItems: 'center' },
    summaryNum: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
    summaryLabel: { color: t.text.muted, fontSize: 10, fontWeight: '600', textAlign: 'center' },
    barContainer: { height: 8, backgroundColor: t.border, borderRadius: 4, marginVertical: 4, overflow: 'hidden' },
    barFill: { height: 8, borderRadius: 4 },
    scoreCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 8 },
    scoreNum: { fontSize: 22, fontWeight: '800', color: '#fff' },
    scoreLabel: { color: t.text.muted, fontSize: 11, textAlign: 'center', marginBottom: 12 },
    dimRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    dimIcon: { fontSize: 18, width: 28 },
    dimContent: { flex: 1 },
    dimLabel: { color: t.text.primary, fontSize: 13, fontWeight: '600' },
    dimDesc: { color: t.text.muted, fontSize: 11 },
    dimScore: { color: t.text.primary, fontSize: 15, fontWeight: '800', width: 36, textAlign: 'right' },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    cardTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700', marginBottom: 4 },
    cardDesc: { color: t.text.muted, fontSize: 12, lineHeight: 18, marginBottom: 8 },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
    tag: { backgroundColor: t.accent.blue + '18', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    tagText: { color: t.accent.blue, fontSize: 10, fontWeight: '600' },
    shelterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
    availBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#16a34a' + '20' },
    availText: { color: '#16a34a', fontSize: 11, fontWeight: '700' },
    phone: { color: t.accent.blue, fontSize: 13, fontWeight: '600', marginBottom: 6 },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 12 },
    input: { backgroundColor: t.bg.card, borderRadius: 10, padding: 12, color: t.text.primary, fontSize: 14, borderWidth: 1, borderColor: t.border },
    textArea: { backgroundColor: t.bg.card, borderRadius: 10, padding: 12, color: t.text.primary, fontSize: 14, borderWidth: 1, borderColor: t.border, minHeight: 80, textAlignVertical: 'top' },
    urgencyRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
    urgencyBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: t.border },
    urgencyActive: { borderWidth: 2 },
    urgencyText: { fontSize: 11, fontWeight: '700' },
    submitBtn: { backgroundColor: t.accent.blue, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 20, marginBottom: 20 },
    submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    successCard: { backgroundColor: t.accent.green + '10', borderRadius: 14, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: t.accent.green + '30', alignItems: 'center' },
    successTitle: { color: t.accent.green, fontSize: 16, fontWeight: '700', marginBottom: 4 },
    successText: { color: t.text.muted, fontSize: 13, textAlign: 'center', lineHeight: 20 },
    fundCard: { backgroundColor: t.accent.green + '08', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: t.accent.green + '20' },
    fundTitle: { color: t.accent.green, fontSize: 14, fontWeight: '700', marginBottom: 4 },
    fundRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
    fundLabel: { color: t.text.muted, fontSize: 12 },
    fundVal: { color: t.text.primary, fontSize: 12, fontWeight: '700' },
    skillCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 14, marginBottom: 10 },
    skillHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    skillIcon: { fontSize: 16, marginRight: 8 },
    skillName: { color: t.text.primary, fontSize: 14, fontWeight: '700', flex: 1 },
    skillDetail: { color: t.text.muted, fontSize: 11 },
    empty: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40 },
    ctaCard: { backgroundColor: t.accent.blue + '10', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: t.accent.blue + '30' },
    ctaTitle: { color: t.accent.blue, fontSize: 13, fontWeight: '700', marginBottom: 4 },
    ctaText: { color: t.text.muted, fontSize: 12, lineHeight: 18 },
  }), [t]);

  const tabs: { key: HousingTab; label: string }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'initiatives', label: 'Initiatives' },
    { key: 'needs', label: 'Needs' },
    { key: 'shelters', label: 'Shelters' },
  ];

  /* ── Renderers ── */

  const renderDashboard = () => (
    <>
      {/* Overall score */}
      <View style={st.scoreCircle}>
        <View style={[st.scoreCircle, { backgroundColor: scoreColor(overallScore) }]}>
          <Text style={st.scoreNum}>{overallScore}</Text>
        </View>
      </View>
      <Text style={st.scoreLabel}>Housing Security Score</Text>

      {/* Summary cards */}
      <View style={st.summaryRow}>
        <View style={st.summaryCard}>
          <Text style={[st.summaryNum, { color: t.accent.blue }]}>{initiatives.length}</Text>
          <Text style={st.summaryLabel}>Initiatives</Text>
        </View>
        <View style={st.summaryCard}>
          <Text style={[st.summaryNum, { color: t.accent.green }]}>{shelters.length}</Text>
          <Text style={st.summaryLabel}>Shelters</Text>
        </View>
        <View style={st.summaryCard}>
          <Text style={[st.summaryNum, { color: '#eab308' }]}>{improvements.length}</Text>
          <Text style={st.summaryLabel}>Projects</Text>
        </View>
      </View>

      {/* Dimension breakdown */}
      <Text style={st.section}>Score Breakdown</Text>
      <View style={st.card}>
        {dimensions.map(d => (
          <View key={d.key}>
            <View style={st.dimRow}>
              <Text style={st.dimIcon}>{d.icon}</Text>
              <View style={st.dimContent}>
                <Text style={st.dimLabel}>{d.label}</Text>
                <Text style={st.dimDesc}>{d.description}</Text>
              </View>
              <Text style={[st.dimScore, { color: scoreColor(d.score) }]}>{d.score}</Text>
            </View>
            <View style={st.barContainer}>
              <View style={[st.barFill, { width: `${d.score}%`, backgroundColor: scoreColor(d.score) }]} />
            </View>
          </View>
        ))}
      </View>

      {/* Housing improvement fund */}
      <Text style={st.section}>Housing Improvement Fund</Text>
      {improvements.map(p => (
        <View key={p.id} style={st.fundCard}>
          <Text style={st.fundTitle}>{p.title}</Text>
          <Text style={st.cardDesc}>{p.description}</Text>
          <View style={st.fundRow}>
            <Text style={st.fundLabel}>Progress</Text>
            <Text style={st.fundVal}>{p.otkRaised.toLocaleString()} / {p.otkGoal.toLocaleString()} OTK</Text>
          </View>
          <View style={st.barContainer}>
            <View style={[st.barFill, { width: `${Math.min(100, (p.otkRaised / p.otkGoal) * 100)}%`, backgroundColor: '#16a34a' }]} />
          </View>
          <View style={st.fundRow}>
            <Text style={st.fundLabel}>Contributors</Text>
            <Text style={st.fundVal}>{p.contributors}</Text>
          </View>
          <View style={[st.badge, { backgroundColor: STATUS_COLORS[p.status] + '20', marginTop: 6 }]}>
            <Text style={[st.badgeText, { color: STATUS_COLORS[p.status] }]}>{p.status}</Text>
          </View>
        </View>
      ))}

      {/* Skills exchange preview */}
      <Text style={st.section}>Building Skills Exchange</Text>
      {skills.map(sk => (
        <View key={sk.id} style={st.skillCard}>
          <View style={st.skillHeader}>
            <Text style={st.skillIcon}>{CATEGORY_ICONS[sk.category] || '\uD83D\uDD27'}</Text>
            <Text style={st.skillName}>{sk.skill}</Text>
          </View>
          <Text style={st.skillDetail}>Teacher: {sk.teacher}  |  {sk.learners} learners  |  Next: {sk.nextSession}</Text>
        </View>
      ))}

      <View style={st.ctaCard}>
        <Text style={st.ctaTitle}>Strengthen Housing Security</Text>
        <Text style={st.ctaText}>
          When people have safe, stable homes, they can focus on growth, education, and community.
          Housing security is a cornerstone of peace.
        </Text>
      </View>
    </>
  );

  const renderInitiatives = () => (
    <>
      <Text style={st.section}>Community Housing Initiatives</Text>
      {initiatives.length === 0 ? (
        <Text style={st.empty}>No initiatives yet. Enable demo mode to explore.</Text>
      ) : (
        initiatives.map(ini => (
          <View key={ini.id} style={st.card}>
            <View style={[st.row, { marginBottom: 6 }]}>
              <Text style={st.cardTitle}>{ini.name}</Text>
              <View style={[st.badge, { backgroundColor: STATUS_COLORS[ini.status] + '20' }]}>
                <Text style={[st.badgeText, { color: STATUS_COLORS[ini.status] }]}>{ini.status}</Text>
              </View>
            </View>
            <View style={[st.badge, { backgroundColor: t.accent.blue + '18', marginBottom: 8 }]}>
              <Text style={[st.badgeText, { color: t.accent.blue }]}>{TYPE_LABELS[ini.type]}</Text>
            </View>
            <Text style={st.cardDesc}>{ini.description}</Text>
            <View style={st.row}>
              <Text style={st.label}>Location</Text>
              <Text style={st.val}>{ini.location}</Text>
            </View>
            <View style={st.row}>
              <Text style={st.label}>Members</Text>
              <Text style={st.val}>{ini.members}</Text>
            </View>
            <View style={st.row}>
              <Text style={st.label}>OTK Committed</Text>
              <Text style={[st.val, { color: t.accent.green }]}>{ini.otkCommitted.toLocaleString()}</Text>
            </View>
          </View>
        ))
      )}

      <Text style={st.section}>Start an Initiative</Text>
      <View style={st.ctaCard}>
        <Text style={st.ctaTitle}>Build Together</Text>
        <Text style={st.ctaText}>
          Co-housing projects, land trusts, and building co-ops put housing in the hands of communities.
          Start with 3 or more committed neighbors.
        </Text>
      </View>
    </>
  );

  const renderNeeds = () => {
    if (formSubmitted) {
      return (
        <View style={st.successCard}>
          <Text style={st.successTitle}>Assessment Submitted</Text>
          <Text style={st.successText}>
            Your housing needs assessment has been recorded. A community housing coordinator will review it
            and connect you with available resources. Typical response time: 24-48 hours.
          </Text>
          <TouchableOpacity
            style={[st.submitBtn, { marginTop: 16, paddingHorizontal: 24 }]}
            onPress={() => { setFormSubmitted(false); setNeedsForm({ currentSituation: '', typeNeeded: '', urgency: 'medium', householdSize: '', notes: '' }); }}
          >
            <Text style={st.submitText}>Submit Another</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        <Text style={st.section}>Housing Needs Assessment</Text>
        <Text style={st.subtitle}>
          Tell us about your housing situation so the community can match you with the right resources.
        </Text>

        <Text style={st.inputLabel}>Current Situation</Text>
        <TextInput
          style={st.textArea}
          placeholder="Describe your current housing (renting, homeless, overcrowded, unsafe, etc.)"
          placeholderTextColor={t.text.muted}
          value={needsForm.currentSituation}
          onChangeText={v => setNeedsForm(f => ({ ...f, currentSituation: v }))}
          multiline
        />

        <Text style={st.inputLabel}>Type of Housing Needed</Text>
        <TextInput
          style={st.input}
          placeholder="e.g., apartment, shared housing, temporary shelter, family home"
          placeholderTextColor={t.text.muted}
          value={needsForm.typeNeeded}
          onChangeText={v => setNeedsForm(f => ({ ...f, typeNeeded: v }))}
        />

        <Text style={st.inputLabel}>Household Size</Text>
        <TextInput
          style={st.input}
          placeholder="Number of people"
          placeholderTextColor={t.text.muted}
          value={needsForm.householdSize}
          onChangeText={v => setNeedsForm(f => ({ ...f, householdSize: v }))}
          keyboardType="numeric"
        />

        <Text style={st.inputLabel}>Urgency</Text>
        <View style={st.urgencyRow}>
          {(['low', 'medium', 'high', 'emergency'] as const).map(u => (
            <TouchableOpacity
              key={u}
              style={[
                st.urgencyBtn,
                needsForm.urgency === u && [st.urgencyActive, { borderColor: URGENCY_COLORS[u] }],
              ]}
              onPress={() => setNeedsForm(f => ({ ...f, urgency: u }))}
            >
              <Text style={[st.urgencyText, { color: needsForm.urgency === u ? URGENCY_COLORS[u] : t.text.muted }]}>
                {u.charAt(0).toUpperCase() + u.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={st.inputLabel}>Additional Notes</Text>
        <TextInput
          style={st.textArea}
          placeholder="Any other details (accessibility needs, pets, location preference, etc.)"
          placeholderTextColor={t.text.muted}
          value={needsForm.notes}
          onChangeText={v => setNeedsForm(f => ({ ...f, notes: v }))}
          multiline
        />

        <TouchableOpacity
          style={[st.submitBtn, { opacity: needsForm.currentSituation.length > 0 ? 1 : 0.5 }]}
          onPress={() => { if (needsForm.currentSituation.length > 0) setFormSubmitted(true); }}
          disabled={needsForm.currentSituation.length === 0}
        >
          <Text style={st.submitText}>Submit Assessment</Text>
        </TouchableOpacity>
      </>
    );
  };

  const renderShelters = () => (
    <>
      <Text style={st.section}>Emergency Shelter Directory</Text>
      {shelters.length === 0 ? (
        <Text style={st.empty}>No shelters listed. Enable demo mode to explore.</Text>
      ) : (
        shelters.map(sh => (
          <View key={sh.id} style={st.card}>
            <View style={st.shelterHeader}>
              <View style={{ flex: 1 }}>
                <Text style={st.cardTitle}>{sh.name}</Text>
                <View style={[st.badge, { backgroundColor: t.accent.blue + '18', marginTop: 2, marginBottom: 4 }]}>
                  <Text style={[st.badgeText, { color: t.accent.blue }]}>{SHELTER_TYPE_LABELS[sh.type]}</Text>
                </View>
              </View>
              <View style={st.availBadge}>
                <Text style={st.availText}>{sh.available} avail</Text>
              </View>
            </View>
            <Text style={st.phone}>{sh.phone}</Text>
            <View style={st.row}>
              <Text style={st.label}>Location</Text>
              <Text style={st.val}>{sh.location}</Text>
            </View>
            <View style={st.row}>
              <Text style={st.label}>Capacity</Text>
              <Text style={st.val}>{sh.capacity} beds</Text>
            </View>
            <View style={st.tagRow}>
              {sh.services.map(s => (
                <View key={s} style={st.tag}>
                  <Text style={st.tagText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        ))
      )}

      <Text style={st.section}>If You Need Help Now</Text>
      <View style={[st.card, { borderWidth: 1, borderColor: t.accent.red + '30', backgroundColor: t.accent.red + '08' }]}>
        <Text style={[st.cardTitle, { color: t.accent.red }]}>Emergency Housing</Text>
        <Text style={st.cardDesc}>
          If you are experiencing homelessness or unsafe housing tonight, call any shelter above or submit
          a needs assessment with "emergency" urgency. Community coordinators will respond within hours.
        </Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.title}>{'\uD83C\uDFE0'} Housing Security</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={st.scroll}>
        <Text style={st.subtitle}>
          Safe, stable housing is a fundamental human need. Track your housing security,
          connect with community initiatives, and find help when you need it.
        </Text>

        {/* Tab bar */}
        <View style={st.tabRow}>
          {tabs.map(tb => (
            <TouchableOpacity
              key={tb.key}
              style={[st.tab, activeTab === tb.key && st.tabActive]}
              onPress={() => setActiveTab(tb.key)}
            >
              <Text style={[st.tabText, activeTab === tb.key && st.tabTextActive]}>{tb.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {!demoMode && activeTab !== 'needs' ? (
          <Text style={st.empty}>Enable demo mode in Settings to explore housing features with sample data.</Text>
        ) : (
          <>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'initiatives' && renderInitiatives()}
            {activeTab === 'needs' && renderNeeds()}
            {activeTab === 'shelters' && renderShelters()}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
