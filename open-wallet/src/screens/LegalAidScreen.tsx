import { fonts } from '../utils/theme';
/**
 * Legal Aid Screen — Community legal support, know your rights.
 *
 * Article V: "Every person deserves access to justice."
 * Community-powered legal assistance and rights education.
 *
 * Features:
 * - Know Your Rights — region-specific legal information cards
 * - Community legal advisors — volunteer lawyers/paralegals
 * - Request legal help form (category, urgency, description)
 * - Active cases — track legal requests and responses
 * - Legal templates — common documents
 * - Rights violations reporting — on-chain documentation
 * - Legal education — workshops, guides
 * - Demo mode
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert, TextInput,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface RightsCard {
  id: string;
  category: 'property' | 'labor' | 'family' | 'digital';
  title: string;
  summary: string;
  region: string;
  keyPoints: string[];
}

interface LegalAdvisor {
  id: string;
  name: string;
  specialty: string;
  availability: string;
  rating: number;
  casesHelped: number;
  isVolunteer: boolean;
}

interface LegalHelpRequest {
  id: string;
  category: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  status: 'submitted' | 'assigned' | 'in_progress' | 'resolved';
  assignedAdvisor?: string;
  submittedDate: string;
  lastUpdate: string;
}

interface LegalTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  downloads: number;
}

interface EducationItem {
  id: string;
  title: string;
  type: 'workshop' | 'guide' | 'video' | 'article';
  topic: string;
  duration: string;
  participants?: number;
  date?: string;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const CATEGORY_COLORS: Record<string, string> = {
  property: '#FF9500',
  labor: '#007AFF',
  family: '#AF52DE',
  digital: '#34C759',
};

const URGENCY_COLORS: Record<string, string> = {
  low: '#34C759',
  medium: '#FF9500',
  high: '#FF3B30',
  critical: '#FF2D55',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  submitted: { label: 'Submitted', color: '#8E8E93' },
  assigned: { label: 'Assigned', color: '#007AFF' },
  in_progress: { label: 'In Progress', color: '#FF9500' },
  resolved: { label: 'Resolved', color: '#34C759' },
};

// ─── Demo Data ───

const DEMO_RIGHTS: RightsCard[] = [
  {
    id: 'r1',
    category: 'property',
    title: 'Tenant Rights & Protections',
    summary: 'Know your rights as a tenant — eviction protections, repair obligations, deposit rules.',
    region: 'Universal',
    keyPoints: [
      'Landlords must provide habitable conditions',
      'Written notice required before eviction proceedings',
      'Security deposits must be returned within 30 days',
      'Retaliation for complaints is illegal',
    ],
  },
  {
    id: 'r2',
    category: 'labor',
    title: 'Worker Rights & Fair Wages',
    summary: 'Your rights in the workplace — minimum wage, overtime, discrimination protections.',
    region: 'Universal',
    keyPoints: [
      'Right to minimum wage and overtime pay',
      'Protection from workplace discrimination',
      'Safe working conditions guaranteed by law',
      'Right to organize and collective bargaining',
    ],
  },
  {
    id: 'r3',
    category: 'family',
    title: 'Family & Child Welfare Rights',
    summary: 'Custody, child support, domestic protection orders, and family court basics.',
    region: 'Universal',
    keyPoints: [
      'Best interests of the child standard for custody',
      'Right to petition for protection orders',
      'Child support obligations and enforcement',
      'Access to family mediation services',
    ],
  },
  {
    id: 'r4',
    category: 'digital',
    title: 'Digital Privacy & Data Rights',
    summary: 'Your rights online — data privacy, digital identity, consent requirements.',
    region: 'Universal',
    keyPoints: [
      'Right to know what data is collected about you',
      'Right to request data deletion',
      'Consent required before data sharing',
      'Protection against unauthorized surveillance',
    ],
  },
];

const DEMO_ADVISORS: LegalAdvisor[] = [
  {
    id: 'a1',
    name: 'Advocate Priya Sharma',
    specialty: 'Labor & Employment Law',
    availability: 'Weekdays 6-9 PM',
    rating: 4.8,
    casesHelped: 127,
    isVolunteer: true,
  },
  {
    id: 'a2',
    name: 'Paralegal Marcus Chen',
    specialty: 'Tenant & Property Rights',
    availability: 'Weekends 10 AM-2 PM',
    rating: 4.6,
    casesHelped: 84,
    isVolunteer: true,
  },
];

const DEMO_TEMPLATES: LegalTemplate[] = [
  {
    id: 't1',
    name: 'Rental Agreement Template',
    category: 'Property',
    description: 'Standard residential lease with tenant protection clauses.',
    downloads: 2340,
  },
  {
    id: 't2',
    name: 'Employment Contract Template',
    category: 'Labor',
    description: 'Fair employment agreement with worker rights provisions.',
    downloads: 1856,
  },
  {
    id: 't3',
    name: 'Dispute Resolution Letter',
    category: 'General',
    description: 'Formal letter template for filing complaints and disputes.',
    downloads: 3102,
  },
];

const DEMO_ACTIVE_REQUEST: LegalHelpRequest = {
  id: 'req1',
  category: 'Labor',
  urgency: 'medium',
  description: 'Employer withholding overtime pay for past 3 months despite documented hours.',
  status: 'assigned',
  assignedAdvisor: 'Advocate Priya Sharma',
  submittedDate: '2026-03-25',
  lastUpdate: '2026-03-27',
};

const DEMO_EDUCATION: EducationItem[] = [
  { id: 'e1', title: 'Understanding Your Tenant Rights', type: 'workshop', topic: 'Property', duration: '90 min', participants: 45, date: '2026-04-02' },
  { id: 'e2', title: 'Workplace Discrimination: Know the Signs', type: 'guide', topic: 'Labor', duration: '15 min read' },
  { id: 'e3', title: 'Filing a Small Claims Case', type: 'video', topic: 'General', duration: '22 min' },
  { id: 'e4', title: 'Digital Privacy in the Age of AI', type: 'article', topic: 'Digital', duration: '10 min read' },
];

type Tab = 'rights' | 'help' | 'templates' | 'education';

export function LegalAidScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('rights');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  // Help form state
  const [helpCategory, setHelpCategory] = useState('');
  const [helpUrgency, setHelpUrgency] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [helpDescription, setHelpDescription] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Violation report state
  const [showViolationForm, setShowViolationForm] = useState(false);
  const [violationDesc, setViolationDesc] = useState('');

  const [expandedRight, setExpandedRight] = useState<string | null>(null);

  const activeRequest = DEMO_ACTIVE_REQUEST;

  const handleSubmitHelp = useCallback(() => {
    if (!helpCategory.trim() || !helpDescription.trim()) {
      Alert.alert('Missing Info', 'Please fill in category and description.');
      return;
    }
    Alert.alert('Request Submitted', 'Your legal help request has been submitted. A community advisor will review it within 24 hours.');
    setHelpCategory('');
    setHelpDescription('');
    setHelpUrgency('medium');
    setShowForm(false);
  }, [helpCategory, helpDescription]);

  const handleReportViolation = useCallback(() => {
    if (!violationDesc.trim()) {
      Alert.alert('Missing Info', 'Please describe the rights violation.');
      return;
    }
    Alert.alert('Violation Reported', 'Your rights violation report has been documented on-chain. Community advisors will be notified.');
    setViolationDesc('');
    setShowViolationForm(false);
  }, [violationDesc]);

  const handleDownloadTemplate = useCallback((name: string) => {
    Alert.alert('Template Ready', `"${name}" has been downloaded to your documents.`);
  }, []);

  const handleContactAdvisor = useCallback((name: string) => {
    Alert.alert('Contact Request', `A consultation request has been sent to ${name}. You'll be notified when they respond.`);
  }, []);

  const handleJoinWorkshop = useCallback((title: string) => {
    Alert.alert('Registered', `You've been registered for "${title}". A reminder will be sent before the session.`);
  }, []);

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
    heroCard: { backgroundColor: t.accent.blue + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    heroText: { color: t.text.primary, fontSize: 15, fontWeight: fonts.semibold, textAlign: 'center', lineHeight: 22 },
    heroSub: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginTop: 6 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },

    // Rights cards
    rightsCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    rightsCatBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-start', marginBottom: 8 },
    rightsCatText: { color: '#fff', fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase' },
    rightsTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold },
    rightsSummary: { color: t.text.muted, fontSize: 13, marginTop: 6, lineHeight: 19 },
    rightsRegion: { color: t.text.muted, fontSize: 11, marginTop: 4 },
    keyPointsContainer: { marginTop: 12 },
    keyPoint: { color: t.text.primary, fontSize: 13, marginBottom: 6, lineHeight: 18 },
    expandBtn: { color: t.accent.blue, fontSize: 13, fontWeight: fonts.semibold, marginTop: 8 },

    // Advisors
    advisorCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    advisorName: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold },
    advisorSpecialty: { color: t.accent.blue, fontSize: 13, fontWeight: fonts.semibold, marginTop: 2 },
    advisorMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    advisorRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    advisorStat: { color: t.text.muted, fontSize: 12 },
    advisorRating: { color: t.accent.orange, fontSize: 14, fontWeight: fonts.bold },
    contactBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    contactBtnText: { color: '#fff', fontSize: 13, fontWeight: fonts.semibold },
    volunteerBadge: { backgroundColor: t.accent.green + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start', marginTop: 6 },
    volunteerText: { color: t.accent.green, fontSize: 11, fontWeight: fonts.semibold },

    // Help form
    formCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    inputLabel: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { backgroundColor: t.bg.primary, borderRadius: 10, padding: 12, color: t.text.primary, fontSize: 14, marginBottom: 16 },
    inputMultiline: { backgroundColor: t.bg.primary, borderRadius: 10, padding: 12, color: t.text.primary, fontSize: 14, marginBottom: 16, minHeight: 80, textAlignVertical: 'top' },
    urgencyRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    urgencyBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: t.bg.primary },
    urgencyActive: { borderWidth: 0 },
    urgencyText: { fontSize: 12, fontWeight: fonts.semibold },
    submitBtn: { backgroundColor: t.accent.blue, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    submitText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    newRequestBtn: { backgroundColor: t.accent.blue, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginHorizontal: 20, marginBottom: 16 },

    // Active cases
    caseCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    caseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    caseCat: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    caseStatusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
    caseStatusText: { color: '#fff', fontSize: 11, fontWeight: fonts.bold },
    caseDesc: { color: t.text.muted, fontSize: 13, marginTop: 8, lineHeight: 19 },
    caseRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    caseMeta: { color: t.text.muted, fontSize: 12 },
    caseAdvisor: { color: t.accent.blue, fontSize: 12, fontWeight: fonts.semibold },
    urgencyTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start', marginTop: 6 },
    urgencyTagText: { color: '#fff', fontSize: 10, fontWeight: fonts.bold, textTransform: 'uppercase' },

    // Violation
    violationBtn: { backgroundColor: t.accent.red + '15', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginHorizontal: 20, marginBottom: 16 },
    violationBtnText: { color: t.accent.red, fontSize: 14, fontWeight: fonts.bold },

    // Templates
    templateCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    templateName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    templateCat: { color: t.accent.blue, fontSize: 12, fontWeight: fonts.semibold, marginTop: 2 },
    templateDesc: { color: t.text.muted, fontSize: 13, marginTop: 6, lineHeight: 19 },
    templateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    templateDownloads: { color: t.text.muted, fontSize: 12 },
    downloadBtn: { backgroundColor: t.accent.green, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    downloadBtnText: { color: '#fff', fontSize: 13, fontWeight: fonts.semibold },

    // Education
    eduCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    eduTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    eduTypeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start', marginTop: 6 },
    eduTypeText: { fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase' },
    eduMeta: { color: t.text.muted, fontSize: 12, marginTop: 6 },
    eduAction: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    joinBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    joinBtnText: { color: '#fff', fontSize: 13, fontWeight: fonts.semibold },
  }), [t]);

  // ─── Tabs ───

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'rights', label: 'Rights' },
    { key: 'help', label: 'Get Help' },
    { key: 'templates', label: 'Templates' },
    { key: 'education', label: 'Education' },
  ];

  // ─── Rights Tab ───

  const renderRights = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroText}>Know Your Rights</Text>
        <Text style={s.heroSub}>Region-specific legal information to protect yourself and your community</Text>
      </View>

      {DEMO_RIGHTS.map((right) => {
        const isExpanded = expandedRight === right.id;
        const catColor = CATEGORY_COLORS[right.category] || '#8E8E93';
        return (
          <TouchableOpacity
            key={right.id}
            style={s.rightsCard}
            onPress={() => setExpandedRight(isExpanded ? null : right.id)}
            activeOpacity={0.7}
          >
            <View style={[s.rightsCatBadge, { backgroundColor: catColor }]}>
              <Text style={s.rightsCatText}>{right.category}</Text>
            </View>
            <Text style={s.rightsTitle}>{right.title}</Text>
            <Text style={s.rightsSummary}>{right.summary}</Text>
            <Text style={s.rightsRegion}>Region: {right.region}</Text>

            {isExpanded && (
              <View style={s.keyPointsContainer}>
                {right.keyPoints.map((point, idx) => (
                  <Text key={idx} style={s.keyPoint}>
                    {'\u2022'} {point}
                  </Text>
                ))}
              </View>
            )}

            <Text style={s.expandBtn}>
              {isExpanded ? 'Show less' : 'Show key points'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </>
  );

  // ─── Help Tab ───

  const renderHelp = () => (
    <>
      {/* Active cases */}
      <Text style={s.sectionTitle}>Active Cases</Text>

      <View style={s.caseCard}>
        <View style={s.caseHeader}>
          <Text style={s.caseCat}>{activeRequest.category}</Text>
          <View style={[s.caseStatusBadge, { backgroundColor: STATUS_LABELS[activeRequest.status].color }]}>
            <Text style={s.caseStatusText}>{STATUS_LABELS[activeRequest.status].label}</Text>
          </View>
        </View>
        <Text style={s.caseDesc}>{activeRequest.description}</Text>
        <View style={[s.urgencyTag, { backgroundColor: URGENCY_COLORS[activeRequest.urgency] }]}>
          <Text style={s.urgencyTagText}>{activeRequest.urgency} urgency</Text>
        </View>
        <View style={s.caseRow}>
          <Text style={s.caseMeta}>Submitted: {activeRequest.submittedDate}</Text>
          <Text style={s.caseMeta}>Updated: {activeRequest.lastUpdate}</Text>
        </View>
        {activeRequest.assignedAdvisor && (
          <Text style={s.caseAdvisor}>Advisor: {activeRequest.assignedAdvisor}</Text>
        )}
      </View>

      {/* Request help */}
      {!showForm ? (
        <TouchableOpacity style={s.newRequestBtn} onPress={() => setShowForm(true)}>
          <Text style={s.submitText}>Request Legal Help</Text>
        </TouchableOpacity>
      ) : (
        <View style={s.formCard}>
          <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>New Help Request</Text>

          <Text style={s.inputLabel}>Category</Text>
          <TextInput
            style={s.input}
            value={helpCategory}
            onChangeText={setHelpCategory}
            placeholder="e.g., Labor, Property, Family..."
            placeholderTextColor={t.text.muted}
          />

          <Text style={s.inputLabel}>Urgency</Text>
          <View style={s.urgencyRow}>
            {(['low', 'medium', 'high', 'critical'] as const).map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  s.urgencyBtn,
                  helpUrgency === level && [s.urgencyActive, { backgroundColor: URGENCY_COLORS[level] }],
                ]}
                onPress={() => setHelpUrgency(level)}
              >
                <Text style={[s.urgencyText, { color: helpUrgency === level ? '#fff' : t.text.muted }]}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.inputLabel}>Description</Text>
          <TextInput
            style={s.inputMultiline}
            value={helpDescription}
            onChangeText={setHelpDescription}
            placeholder="Describe your legal situation..."
            placeholderTextColor={t.text.muted}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity style={s.submitBtn} onPress={handleSubmitHelp}>
            <Text style={s.submitText}>Submit Request</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Report violation */}
      <Text style={s.sectionTitle}>Rights Violations</Text>

      {!showViolationForm ? (
        <TouchableOpacity style={s.violationBtn} onPress={() => setShowViolationForm(true)}>
          <Text style={s.violationBtnText}>Report a Rights Violation</Text>
        </TouchableOpacity>
      ) : (
        <View style={s.formCard}>
          <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Report Violation</Text>
          <Text style={[s.heroSub, { textAlign: 'left', marginBottom: 12 }]}>
            Your report will be documented on-chain for transparency and accountability.
          </Text>

          <Text style={s.inputLabel}>Description</Text>
          <TextInput
            style={s.inputMultiline}
            value={violationDesc}
            onChangeText={setViolationDesc}
            placeholder="Describe the rights violation..."
            placeholderTextColor={t.text.muted}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity style={[s.submitBtn, { backgroundColor: t.accent.red }]} onPress={handleReportViolation}>
            <Text style={s.submitText}>Submit Report On-Chain</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Community advisors */}
      <Text style={s.sectionTitle}>Community Legal Advisors</Text>

      {DEMO_ADVISORS.map((advisor) => (
        <View key={advisor.id} style={s.advisorCard}>
          <Text style={s.advisorName}>{advisor.name}</Text>
          <Text style={s.advisorSpecialty}>{advisor.specialty}</Text>
          <Text style={s.advisorMeta}>Available: {advisor.availability}</Text>
          {advisor.isVolunteer && (
            <View style={s.volunteerBadge}>
              <Text style={s.volunteerText}>Volunteer</Text>
            </View>
          )}
          <View style={s.advisorRow}>
            <Text style={s.advisorStat}>
              {advisor.casesHelped} cases helped {'  '} <Text style={s.advisorRating}>{advisor.rating}</Text>
            </Text>
            <TouchableOpacity style={s.contactBtn} onPress={() => handleContactAdvisor(advisor.name)}>
              <Text style={s.contactBtnText}>Request Consult</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </>
  );

  // ─── Templates Tab ───

  const renderTemplates = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroText}>Legal Templates</Text>
        <Text style={s.heroSub}>Free, community-reviewed document templates for common legal needs</Text>
      </View>

      {DEMO_TEMPLATES.map((tmpl) => (
        <View key={tmpl.id} style={s.templateCard}>
          <Text style={s.templateName}>{tmpl.name}</Text>
          <Text style={s.templateCat}>{tmpl.category}</Text>
          <Text style={s.templateDesc}>{tmpl.description}</Text>
          <View style={s.templateRow}>
            <Text style={s.templateDownloads}>{tmpl.downloads.toLocaleString()} downloads</Text>
            <TouchableOpacity style={s.downloadBtn} onPress={() => handleDownloadTemplate(tmpl.name)}>
              <Text style={s.downloadBtnText}>Download</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </>
  );

  // ─── Education Tab ───

  const EDU_TYPE_COLORS: Record<string, string> = {
    workshop: '#AF52DE',
    guide: '#007AFF',
    video: '#FF9500',
    article: '#34C759',
  };

  const renderEducation = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroText}>Legal Education</Text>
        <Text style={s.heroSub}>Workshops, guides, and resources to help you understand your legal rights</Text>
      </View>

      {DEMO_EDUCATION.map((item) => {
        const typeColor = EDU_TYPE_COLORS[item.type] || '#8E8E93';
        return (
          <View key={item.id} style={s.eduCard}>
            <Text style={s.eduTitle}>{item.title}</Text>
            <View style={[s.eduTypeBadge, { backgroundColor: typeColor + '20' }]}>
              <Text style={[s.eduTypeText, { color: typeColor }]}>{item.type}</Text>
            </View>
            <Text style={s.eduMeta}>
              Topic: {item.topic} {'  |  '} {item.duration}
              {item.participants != null && `  |  ${item.participants} registered`}
            </Text>
            <View style={s.eduAction}>
              {item.date && <Text style={s.caseMeta}>{item.date}</Text>}
              {!item.date && <View />}
              <TouchableOpacity
                style={s.joinBtn}
                onPress={() => {
                  if (item.type === 'workshop') {
                    handleJoinWorkshop(item.title);
                  } else {
                    Alert.alert('Opening', `Opening "${item.title}"...`);
                  }
                }}
              >
                <Text style={s.joinBtnText}>
                  {item.type === 'workshop' ? 'Register' : item.type === 'video' ? 'Watch' : 'Read'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </>
  );

  // ─── Render ───

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Legal Aid</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      {demoMode && (
        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO DATA</Text>
        </View>
      )}

      {/* Tab bar */}
      <View style={s.tabRow}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[s.tabBtn, tab === t.key && s.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {tab === 'rights' && renderRights()}
        {tab === 'help' && renderHelp()}
        {tab === 'templates' && renderTemplates()}
        {tab === 'education' && renderEducation()}
      </ScrollView>
    </SafeAreaView>
  );
}
