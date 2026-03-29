/**
 * Micro-Grant Screen — Community development grants from Treasury/DAO.
 *
 * Part of The Human Constitution: DAOs and the community treasury post grants
 * for education, health, infrastructure, environment, arts, technology, and
 * small business. Anyone can apply, track milestones, and demonstrate impact.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

type GrantCategory = 'education' | 'health' | 'infrastructure' | 'environment' | 'arts' | 'technology' | 'small_business';
type GrantStatus = 'open' | 'reviewing' | 'closed';
type ApplicationStatus = 'submitted' | 'approved' | 'funded' | 'completed' | 'rejected';

interface Grant {
  id: string;
  title: string;
  amount: number;
  category: GrantCategory;
  deadline: string;
  applicants: number;
  status: GrantStatus;
  description: string;
  postedBy: string;
}

interface Milestone {
  title: string;
  target: string;
  completed: boolean;
}

interface Application {
  id: string;
  grantId: string;
  grantTitle: string;
  status: ApplicationStatus;
  description: string;
  milestones: Milestone[];
  amountReceived: number;
  amountUsed: number;
  communityBenefit: string;
  appliedDate: string;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const CATEGORY_LABELS: Record<GrantCategory, string> = {
  education: 'Education',
  health: 'Health',
  infrastructure: 'Infrastructure',
  environment: 'Environment',
  arts: 'Arts',
  technology: 'Technology',
  small_business: 'Small Business',
};

const CATEGORY_COLORS: Record<GrantCategory, string> = {
  education: '#2196f3',
  health: '#e91e63',
  infrastructure: '#ff9800',
  environment: '#4caf50',
  arts: '#9c27b0',
  technology: '#00bcd4',
  small_business: '#795548',
};

const STATUS_COLORS: Record<string, string> = {
  open: '#4caf50',
  reviewing: '#ff9800',
  closed: '#9e9e9e',
  submitted: '#2196f3',
  approved: '#4caf50',
  funded: '#9c27b0',
  completed: '#00bcd4',
  rejected: '#f44336',
};

const CATEGORIES: GrantCategory[] = [
  'education', 'health', 'infrastructure', 'environment', 'arts', 'technology', 'small_business',
];

// ─── Demo Data ───

const DEMO_GRANTS: Grant[] = [
  {
    id: 'grant-1',
    title: 'Community Literacy Program',
    amount: 5000,
    category: 'education',
    deadline: '2026-05-15',
    applicants: 12,
    status: 'open',
    description: 'Fund a 6-month literacy program for underserved youth in rural areas. Covers tutors, materials, and digital tablets.',
    postedBy: 'Open Chain Treasury',
  },
  {
    id: 'grant-2',
    title: 'Mobile Health Clinic Expansion',
    amount: 15000,
    category: 'health',
    deadline: '2026-04-30',
    applicants: 7,
    status: 'open',
    description: 'Expand mobile health clinics to three additional villages. Provides basic checkups, vaccinations, and maternal care.',
    postedBy: 'HealthDAO',
  },
  {
    id: 'grant-3',
    title: 'Solar-Powered Community Hub',
    amount: 25000,
    category: 'infrastructure',
    deadline: '2026-06-01',
    applicants: 3,
    status: 'open',
    description: 'Build a solar-powered community center with internet, charging stations, and meeting space for local governance.',
    postedBy: 'GreenFuture DAO',
  },
  {
    id: 'grant-4',
    title: 'Local Artisan Marketplace',
    amount: 8000,
    category: 'small_business',
    deadline: '2026-04-20',
    applicants: 19,
    status: 'reviewing',
    description: 'Create an online-to-local marketplace connecting artisans with buyers. Includes training, photography, and logistics support.',
    postedBy: 'Open Chain Treasury',
  },
  {
    id: 'grant-5',
    title: 'River Cleanup & Reforestation',
    amount: 12000,
    category: 'environment',
    deadline: '2026-07-01',
    applicants: 5,
    status: 'open',
    description: 'Organize community river cleanup events and plant 10,000 native trees along degraded riverbanks.',
    postedBy: 'EcoRestore DAO',
  },
];

const DEMO_APPLICATIONS: Application[] = [
  {
    id: 'app-1',
    grantId: 'grant-1',
    grantTitle: 'Community Literacy Program',
    status: 'funded',
    description: 'I will run an after-school reading program for 50 children aged 8-14 in my village, training 5 local volunteers as tutors.',
    milestones: [
      { title: 'Recruit 5 volunteer tutors', target: 'Month 1', completed: true },
      { title: 'Enroll 50 students', target: 'Month 1', completed: true },
      { title: 'Complete first reading level assessments', target: 'Month 3', completed: false },
      { title: 'Achieve 80% reading improvement', target: 'Month 6', completed: false },
    ],
    amountReceived: 5000,
    amountUsed: 2100,
    communityBenefit: '50 children enrolled, 5 tutors trained, reading scores up 35% after 2 months.',
    appliedDate: '2026-02-10',
  },
  {
    id: 'app-2',
    grantId: 'grant-4',
    grantTitle: 'Local Artisan Marketplace',
    status: 'submitted',
    description: 'Proposing to build a digital storefront for 30 local weavers and potters, with product photography workshops and shipping logistics.',
    milestones: [
      { title: 'Onboard 30 artisans', target: 'Month 1', completed: false },
      { title: 'Launch digital storefront', target: 'Month 2', completed: false },
      { title: 'First 100 sales', target: 'Month 4', completed: false },
    ],
    amountReceived: 0,
    amountUsed: 0,
    communityBenefit: '',
    appliedDate: '2026-03-25',
  },
];

// ─── Component ───

export function MicroGrantScreen({ onClose }: Props) {
  const [tab, setTab] = useState<'available' | 'my-grants' | 'apply'>('available');
  const [grants] = useState<Grant[]>(DEMO_GRANTS);
  const [applications, setApplications] = useState<Application[]>(DEMO_APPLICATIONS);
  const [selectedGrant, setSelectedGrant] = useState<Grant | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [applyDescription, setApplyDescription] = useState('');
  const [milestonesText, setMilestonesText] = useState('');
  const [applyGrantId, setApplyGrantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, backgroundColor: t.bg.card, borderRadius: 12, padding: 4 },
    tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabBtnActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.muted, fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: '#fff', fontSize: 13, fontWeight: '700' },
    heroCard: { backgroundColor: t.accent.blue + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, alignItems: 'center', marginBottom: 16 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: '800', textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 20 },
    grantCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    grantTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    grantRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    grantAmount: { color: t.accent.green, fontSize: 16, fontWeight: '800' },
    categoryBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    categoryText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    grantMeta: { flexDirection: 'row', gap: 16, marginTop: 8 },
    metaText: { color: t.text.muted, fontSize: 12 },
    statusBadge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginTop: 8 },
    statusText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    detailDesc: { color: t.text.secondary, fontSize: 14, lineHeight: 22, marginTop: 12 },
    postedBy: { color: t.text.muted, fontSize: 12, marginTop: 8 },
    applyBtn: { backgroundColor: t.accent.blue, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, marginTop: 16, alignSelf: 'center' },
    applyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    backBtn: { color: t.accent.blue, fontSize: 16 },
    inputCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 12 },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: '600', marginBottom: 8 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15 },
    descInput: { minHeight: 100, textAlignVertical: 'top' },
    submitBtn: { backgroundColor: t.accent.blue, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginHorizontal: 20, marginTop: 24 },
    submitBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    milestoneItem: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
    milestoneCheck: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    milestoneText: { color: t.text.primary, fontSize: 13, flex: 1 },
    milestoneTarget: { color: t.text.muted, fontSize: 11 },
    impactCard: { backgroundColor: t.accent.green + '10', borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 12 },
    impactTitle: { color: t.accent.green, fontSize: 14, fontWeight: '700', marginBottom: 8 },
    impactText: { color: t.text.secondary, fontSize: 13, lineHeight: 20 },
    progressBar: { height: 6, backgroundColor: t.border, borderRadius: 3, marginTop: 8 },
    progressFill: { height: 6, borderRadius: 3, backgroundColor: t.accent.green },
    fundsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
    fundsLabel: { color: t.text.muted, fontSize: 12 },
    fundsValue: { color: t.text.primary, fontSize: 14, fontWeight: '700' },
    emptyText: { color: t.text.muted, textAlign: 'center', marginTop: 40, fontSize: 14 },
    selectGrantBtn: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, marginHorizontal: 20, marginTop: 8, borderWidth: 2, borderColor: t.border },
    selectGrantBtnActive: { borderColor: t.accent.blue },
    selectGrantText: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    selectGrantAmount: { color: t.accent.green, fontSize: 12, fontWeight: '700', marginTop: 2 },
  }), [t]);

  // ─── Grant Detail View ───
  const renderGrantDetail = useCallback(() => {
    if (!selectedGrant) return null;
    const g = selectedGrant;
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setSelectedGrant(null)}><Text style={s.backBtn}>← Back</Text></TouchableOpacity>
          <Text style={s.title}>Grant Details</Text>
          <View style={{ width: 50 }} />
        </View>
        <ScrollView>
          <View style={s.grantCard}>
            <Text style={s.grantTitle}>{g.title}</Text>
            <View style={s.grantRow}>
              <Text style={s.grantAmount}>{g.amount.toLocaleString()} OTK</Text>
              <View style={[s.categoryBadge, { backgroundColor: CATEGORY_COLORS[g.category] }]}>
                <Text style={s.categoryText}>{CATEGORY_LABELS[g.category]}</Text>
              </View>
            </View>
            <Text style={s.detailDesc}>{g.description}</Text>
            <Text style={s.postedBy}>Posted by: {g.postedBy}</Text>
            <View style={s.grantMeta}>
              <Text style={s.metaText}>Deadline: {g.deadline}</Text>
              <Text style={s.metaText}>{g.applicants} applicants</Text>
            </View>
            <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[g.status] ?? t.text.muted }]}>
              <Text style={s.statusText}>{g.status.toUpperCase()}</Text>
            </View>
          </View>
          {g.status === 'open' && (
            <TouchableOpacity
              style={s.applyBtn}
              onPress={() => { setApplyGrantId(g.id); setSelectedGrant(null); setTab('apply'); }}
            >
              <Text style={s.applyBtnText}>Apply for This Grant</Text>
            </TouchableOpacity>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }, [selectedGrant, s, t]);

  // ─── Application Detail View ───
  const renderAppDetail = useCallback(() => {
    if (!selectedApp) return null;
    const a = selectedApp;
    const completedCount = a.milestones.filter((m) => m.completed).length;
    const milestonePct = a.milestones.length > 0 ? Math.round((completedCount / a.milestones.length) * 100) : 0;
    const fundsPct = a.amountReceived > 0 ? Math.round((a.amountUsed / a.amountReceived) * 100) : 0;

    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setSelectedApp(null)}><Text style={s.backBtn}>← Back</Text></TouchableOpacity>
          <Text style={s.title}>Application</Text>
          <View style={{ width: 50 }} />
        </View>
        <ScrollView>
          <View style={s.grantCard}>
            <Text style={s.grantTitle}>{a.grantTitle}</Text>
            <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[a.status] ?? t.text.muted }]}>
              <Text style={s.statusText}>{a.status.toUpperCase()}</Text>
            </View>
            <Text style={s.detailDesc}>{a.description}</Text>
            <Text style={s.postedBy}>Applied: {a.appliedDate}</Text>
          </View>

          <Text style={s.section}>Milestones ({completedCount}/{a.milestones.length})</Text>
          <View style={s.grantCard}>
            <View style={s.progressBar}>
              <View style={[s.progressFill, { width: `${milestonePct}%` }]} />
            </View>
            {a.milestones.map((m, idx) => (
              <View key={idx} style={s.milestoneItem}>
                <View style={[s.milestoneCheck, { borderColor: m.completed ? t.accent.green : t.border, backgroundColor: m.completed ? t.accent.green : 'transparent' }]}>
                  {m.completed && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✓</Text>}
                </View>
                <Text style={[s.milestoneText, m.completed && { textDecorationLine: 'line-through', color: t.text.muted }]}>{m.title}</Text>
                <Text style={s.milestoneTarget}>{m.target}</Text>
              </View>
            ))}
          </View>

          {(a.status === 'funded' || a.status === 'completed') && (
            <>
              <Text style={s.section}>Fund Usage</Text>
              <View style={s.grantCard}>
                <View style={s.progressBar}>
                  <View style={[s.progressFill, { width: `${fundsPct}%`, backgroundColor: t.accent.blue }]} />
                </View>
                <View style={s.fundsRow}>
                  <View>
                    <Text style={s.fundsLabel}>Received</Text>
                    <Text style={s.fundsValue}>{a.amountReceived.toLocaleString()} OTK</Text>
                  </View>
                  <View>
                    <Text style={s.fundsLabel}>Used</Text>
                    <Text style={s.fundsValue}>{a.amountUsed.toLocaleString()} OTK</Text>
                  </View>
                  <View>
                    <Text style={s.fundsLabel}>Remaining</Text>
                    <Text style={s.fundsValue}>{(a.amountReceived - a.amountUsed).toLocaleString()} OTK</Text>
                  </View>
                </View>
              </View>

              {a.communityBenefit.length > 0 && (
                <View style={s.impactCard}>
                  <Text style={s.impactTitle}>Community Impact</Text>
                  <Text style={s.impactText}>{a.communityBenefit}</Text>
                </View>
              )}
            </>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }, [selectedApp, s, t]);

  // ─── Submit Application ───
  const handleSubmitApplication = useCallback(async () => {
    if (!applyGrantId) {
      Alert.alert('Required', 'Please select a grant to apply for.');
      return;
    }
    if (!applyDescription.trim()) {
      Alert.alert('Required', 'Describe how you will use the funds.');
      return;
    }
    if (!milestonesText.trim()) {
      Alert.alert('Required', 'Add at least one milestone (one per line).');
      return;
    }

    setLoading(true);
    const grant = grants.find((g) => g.id === applyGrantId);

    if (demoMode) {
      await new Promise((r) => setTimeout(r, 1500));
      const milestoneLines = milestonesText.trim().split('\n').filter((l) => l.trim());
      const newApp: Application = {
        id: `app-${Date.now()}`,
        grantId: applyGrantId,
        grantTitle: grant?.title ?? 'Unknown Grant',
        status: 'submitted',
        description: applyDescription.trim(),
        milestones: milestoneLines.map((line, idx) => ({
          title: line.trim(),
          target: `Month ${idx + 1}`,
          completed: false,
        })),
        amountReceived: 0,
        amountUsed: 0,
        communityBenefit: '',
        appliedDate: new Date().toISOString().split('T')[0],
      };
      setApplications((prev) => [newApp, ...prev]);
      Alert.alert('Application Submitted', `Your application for "${grant?.title}" has been submitted for review.`);
      setApplyDescription('');
      setMilestonesText('');
      setApplyGrantId(null);
      setTab('my-grants');
    } else {
      Alert.alert('Coming Soon', 'On-chain grant applications will be available when the treasury module is live.');
    }
    setLoading(false);
  }, [applyGrantId, applyDescription, milestonesText, grants, demoMode]);

  // ─── Detail Views ───
  if (selectedGrant) return renderGrantDetail();
  if (selectedApp) return renderAppDetail();

  // ─── Tab Content ───
  const renderAvailableGrants = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroTitle}>Micro-Grants for Community Development</Text>
        <Text style={s.heroSubtitle}>
          DAOs and the community treasury fund real-world projects. Apply for a grant, deliver milestones, and demonstrate impact.
        </Text>
      </View>

      <Text style={s.section}>Available Grants ({grants.filter((g) => g.status === 'open').length})</Text>
      {grants.filter((g) => g.status === 'open').map((g) => (
        <TouchableOpacity key={g.id} style={s.grantCard} onPress={() => setSelectedGrant(g)}>
          <Text style={s.grantTitle}>{g.title}</Text>
          <View style={s.grantRow}>
            <Text style={s.grantAmount}>{g.amount.toLocaleString()} OTK</Text>
            <View style={[s.categoryBadge, { backgroundColor: CATEGORY_COLORS[g.category] }]}>
              <Text style={s.categoryText}>{CATEGORY_LABELS[g.category]}</Text>
            </View>
          </View>
          <View style={s.grantMeta}>
            <Text style={s.metaText}>Deadline: {g.deadline}</Text>
            <Text style={s.metaText}>{g.applicants} applicants</Text>
          </View>
        </TouchableOpacity>
      ))}

      <Text style={s.section}>Under Review</Text>
      {grants.filter((g) => g.status === 'reviewing').map((g) => (
        <TouchableOpacity key={g.id} style={s.grantCard} onPress={() => setSelectedGrant(g)}>
          <Text style={s.grantTitle}>{g.title}</Text>
          <View style={s.grantRow}>
            <Text style={s.grantAmount}>{g.amount.toLocaleString()} OTK</Text>
            <View style={[s.categoryBadge, { backgroundColor: CATEGORY_COLORS[g.category] }]}>
              <Text style={s.categoryText}>{CATEGORY_LABELS[g.category]}</Text>
            </View>
          </View>
          <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[g.status] }]}>
            <Text style={s.statusText}>{g.status.toUpperCase()}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </>
  );

  const renderMyGrants = () => (
    <>
      <Text style={s.section}>My Applications ({applications.length})</Text>
      {applications.length === 0 ? (
        <Text style={s.emptyText}>No applications yet. Browse available grants and apply!</Text>
      ) : (
        applications.map((a) => {
          const completedCount = a.milestones.filter((m) => m.completed).length;
          const milestonePct = a.milestones.length > 0 ? Math.round((completedCount / a.milestones.length) * 100) : 0;
          return (
            <TouchableOpacity key={a.id} style={s.grantCard} onPress={() => setSelectedApp(a)}>
              <Text style={s.grantTitle}>{a.grantTitle}</Text>
              <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[a.status] ?? t.text.muted }]}>
                <Text style={s.statusText}>{a.status.toUpperCase()}</Text>
              </View>
              {(a.status === 'funded' || a.status === 'completed') && (
                <>
                  <View style={[s.progressBar, { marginTop: 12 }]}>
                    <View style={[s.progressFill, { width: `${milestonePct}%` }]} />
                  </View>
                  <Text style={s.metaText}>{completedCount}/{a.milestones.length} milestones completed</Text>
                </>
              )}
              <Text style={s.metaText}>Applied: {a.appliedDate}</Text>
            </TouchableOpacity>
          );
        })
      )}
    </>
  );

  const renderApplyForm = () => {
    const openGrants = grants.filter((g) => g.status === 'open');
    return (
      <>
        <Text style={s.section}>Select a Grant</Text>
        {openGrants.map((g) => (
          <TouchableOpacity
            key={g.id}
            style={[s.selectGrantBtn, applyGrantId === g.id && s.selectGrantBtnActive]}
            onPress={() => setApplyGrantId(g.id)}
          >
            <Text style={s.selectGrantText}>{g.title}</Text>
            <Text style={s.selectGrantAmount}>{g.amount.toLocaleString()} OTK — {CATEGORY_LABELS[g.category]}</Text>
          </TouchableOpacity>
        ))}

        <View style={s.inputCard}>
          <Text style={s.inputLabel}>How will you use the funds?</Text>
          <TextInput
            style={[s.input, s.descInput]}
            placeholder="Describe your plan, who benefits, and expected outcomes..."
            placeholderTextColor={t.text.muted}
            value={applyDescription}
            onChangeText={setApplyDescription}
            multiline
            numberOfLines={5}
          />
        </View>

        <View style={s.inputCard}>
          <Text style={s.inputLabel}>Milestones (one per line)</Text>
          <TextInput
            style={[s.input, s.descInput]}
            placeholder={"Recruit volunteers\nLaunch program\nFirst progress report\nFinal impact assessment"}
            placeholderTextColor={t.text.muted}
            value={milestonesText}
            onChangeText={setMilestonesText}
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity style={s.submitBtn} onPress={handleSubmitApplication} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>Submit Application</Text>}
        </TouchableOpacity>

        <Text style={{ color: t.text.muted, fontSize: 12, textAlign: 'center', marginTop: 16, marginHorizontal: 24, lineHeight: 18 }}>
          Applications are reviewed by the DAO that posted the grant. Funded applicants must report milestone progress and demonstrate community benefit.
        </Text>
      </>
    );
  };

  // ─── Main Layout ───
  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Micro-Grants</Text>
        <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>Close</Text></TouchableOpacity>
      </View>

      <View style={s.tabRow}>
        {([['available', 'Available'], ['my-grants', 'My Grants'], ['apply', 'Apply']] as const).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[s.tabBtn, tab === key && s.tabBtnActive]}
            onPress={() => setTab(key)}
          >
            <Text style={tab === key ? s.tabTextActive : s.tabText}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView>
        {tab === 'available' && renderAvailableGrants()}
        {tab === 'my-grants' && renderMyGrants()}
        {tab === 'apply' && renderApplyForm()}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
