import { fonts } from '../utils/theme';
/**
 * Community Project Screen — Community Project Management for Article I (cOTK).
 *
 * Article I: Communities thrive when people organize around shared goals.
 * cOTK is earned through community project participation, leadership, and impact.
 *
 * Features:
 * - Browse active community projects with status tracking
 * - Create new projects (name, description, category, funding goal, timeline, team)
 * - Project detail view with milestones, team, funding, activity feed, impact metrics
 * - Categories: infrastructure, education, environment, health, culture, technology
 * - Join projects as volunteer
 * - Fund projects with OTK
 * - Demo data with projects in various stages
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

type ProjectStatus = 'planning' | 'fundraising' | 'in_progress' | 'completed';
type ProjectCategory = 'infrastructure' | 'education' | 'environment' | 'health' | 'culture' | 'technology';
type TeamRole = 'lead' | 'contributor' | 'volunteer';
type Tab = 'browse' | 'my-projects' | 'create';

interface TeamMember {
  uid: string;
  name: string;
  role: TeamRole;
  cotkEarned: number;
  hoursContributed: number;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  cotkReward: number;
  completedDate?: string;
}

interface ActivityItem {
  id: string;
  type: 'update' | 'photo' | 'milestone' | 'funding' | 'member_joined';
  description: string;
  date: string;
  author: string;
}

interface ImpactMetrics {
  beneficiaries: number;
  hoursContributed: number;
  cotkDistributed: number;
  volunteersEngaged: number;
}

interface CommunityProject {
  id: string;
  name: string;
  description: string;
  category: ProjectCategory;
  status: ProjectStatus;
  fundingGoal: number;
  fundingRaised: number;
  startDate: string;
  endDate: string;
  team: TeamMember[];
  milestones: Milestone[];
  activityFeed: ActivityItem[];
  impact: ImpactMetrics;
  createdBy: string;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const CATEGORIES: { key: ProjectCategory; label: string; icon: string }[] = [
  { key: 'infrastructure', label: 'Infrastructure', icon: 'I' },
  { key: 'education', label: 'Education', icon: 'E' },
  { key: 'environment', label: 'Environment', icon: 'N' },
  { key: 'health', label: 'Health', icon: 'H' },
  { key: 'culture', label: 'Culture', icon: 'C' },
  { key: 'technology', label: 'Technology', icon: 'T' },
];

const STATUS_COLORS: Record<ProjectStatus, string> = {
  planning: '#8E8E93',
  fundraising: '#FF9500',
  in_progress: '#007AFF',
  completed: '#34C759',
};

const STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: 'Planning',
  fundraising: 'Fundraising',
  in_progress: 'In Progress',
  completed: 'Completed',
};

const ROLE_COLORS: Record<TeamRole, string> = {
  lead: '#AF52DE',
  contributor: '#007AFF',
  volunteer: '#34C759',
};

// ─── Demo Data ───

const DEMO_PROJECTS: CommunityProject[] = [
  {
    id: 'proj-1',
    name: 'Riverside Community Garden',
    description: 'Transform the vacant lot on Riverside Drive into a thriving community garden with 40 plots, a greenhouse, composting station, and educational space for children.',
    category: 'environment',
    status: 'in_progress',
    fundingGoal: 25000,
    fundingRaised: 18750,
    startDate: '2026-01-15',
    endDate: '2026-06-30',
    createdBy: 'openchain1abc...garden_lead',
    team: [
      { uid: 'openchain1abc...garden_lead', name: 'Maria Santos', role: 'lead', cotkEarned: 4200, hoursContributed: 96 },
      { uid: 'openchain1def...soil_expert', name: 'James Chen', role: 'contributor', cotkEarned: 2800, hoursContributed: 64 },
      { uid: 'openchain1ghi...volunteer1', name: 'Aisha Patel', role: 'volunteer', cotkEarned: 1400, hoursContributed: 32 },
      { uid: 'openchain1jkl...volunteer2', name: 'Carlos Rivera', role: 'volunteer', cotkEarned: 900, hoursContributed: 18 },
    ],
    milestones: [
      { id: 'm1', title: 'Site cleared and soil tested', description: 'Remove debris, test soil quality, plan plot layout', completed: true, cotkReward: 2000, completedDate: '2026-02-10' },
      { id: 'm2', title: 'Infrastructure installed', description: 'Water lines, raised beds, pathways, fencing', completed: true, cotkReward: 3000, completedDate: '2026-03-05' },
      { id: 'm3', title: 'Greenhouse erected', description: 'Build and equip the community greenhouse', completed: false, cotkReward: 2500 },
      { id: 'm4', title: 'First harvest celebration', description: 'Community event celebrating the first produce harvest', completed: false, cotkReward: 1500 },
    ],
    activityFeed: [
      { id: 'a1', type: 'milestone', description: 'Infrastructure installed — water lines, raised beds, and fencing complete!', date: '2026-03-05', author: 'Maria Santos' },
      { id: 'a2', type: 'photo', description: 'Photo: 20 raised beds ready for planting, volunteers building pathways in the background', date: '2026-03-04', author: 'Aisha Patel' },
      { id: 'a3', type: 'update', description: 'Greenhouse materials arriving next week. Need 5 more volunteers for assembly.', date: '2026-03-01', author: 'James Chen' },
      { id: 'a4', type: 'funding', description: '500 OTK contributed by anonymous donor', date: '2026-02-28', author: 'System' },
      { id: 'a5', type: 'member_joined', description: 'Carlos Rivera joined as volunteer', date: '2026-02-20', author: 'System' },
    ],
    impact: { beneficiaries: 120, hoursContributed: 210, cotkDistributed: 9300, volunteersEngaged: 18 },
  },
  {
    id: 'proj-2',
    name: 'Youth Coding Bootcamp',
    description: 'Free 12-week coding program for underserved youth ages 14-18. Covers web development, Python, and basic blockchain concepts. Mentors paired 1:1.',
    category: 'education',
    status: 'fundraising',
    fundingGoal: 15000,
    fundingRaised: 6200,
    startDate: '2026-05-01',
    endDate: '2026-08-15',
    createdBy: 'openchain1mno...code_lead',
    team: [
      { uid: 'openchain1mno...code_lead', name: 'Priya Sharma', role: 'lead', cotkEarned: 1200, hoursContributed: 28 },
      { uid: 'openchain1pqr...mentor1', name: 'David Kim', role: 'contributor', cotkEarned: 600, hoursContributed: 12 },
    ],
    milestones: [
      { id: 'm1', title: 'Secure venue and equipment', description: 'Partner with library for space, acquire 20 laptops', completed: false, cotkReward: 2000 },
      { id: 'm2', title: 'Recruit mentors', description: 'Onboard 10 volunteer mentors from tech community', completed: false, cotkReward: 1500 },
      { id: 'm3', title: 'Launch bootcamp', description: 'First day of classes with 20 enrolled students', completed: false, cotkReward: 2500 },
      { id: 'm4', title: 'Demo day', description: 'Students present final projects to community', completed: false, cotkReward: 3000 },
    ],
    activityFeed: [
      { id: 'a1', type: 'update', description: 'Curriculum draft complete. Looking for mentors with Python experience.', date: '2026-03-26', author: 'Priya Sharma' },
      { id: 'a2', type: 'funding', description: '2,000 OTK contributed by Tech Community DAO', date: '2026-03-20', author: 'System' },
      { id: 'a3', type: 'member_joined', description: 'David Kim joined as contributor (curriculum design)', date: '2026-03-15', author: 'System' },
    ],
    impact: { beneficiaries: 0, hoursContributed: 40, cotkDistributed: 1800, volunteersEngaged: 2 },
  },
  {
    id: 'proj-3',
    name: 'Neighborhood Health Clinic Renovation',
    description: 'Renovate the aging Elm Street clinic to add a dental suite, upgrade the waiting area, and install modern diagnostic equipment for underinsured residents.',
    category: 'health',
    status: 'completed',
    fundingGoal: 50000,
    fundingRaised: 52300,
    startDate: '2025-09-01',
    endDate: '2026-02-28',
    createdBy: 'openchain1stu...dr_wong',
    team: [
      { uid: 'openchain1stu...dr_wong', name: 'Dr. Lisa Wong', role: 'lead', cotkEarned: 8500, hoursContributed: 180 },
      { uid: 'openchain1vwx...contractor', name: 'Bob Martinez', role: 'contributor', cotkEarned: 6200, hoursContributed: 140 },
      { uid: 'openchain1yza...nurse_kay', name: 'Kay Johnson', role: 'contributor', cotkEarned: 4800, hoursContributed: 110 },
      { uid: 'openchain1bcd...vol_team', name: 'Sarah Lee', role: 'volunteer', cotkEarned: 2400, hoursContributed: 56 },
      { uid: 'openchain1efg...vol_paint', name: 'Tom Harris', role: 'volunteer', cotkEarned: 1800, hoursContributed: 40 },
    ],
    milestones: [
      { id: 'm1', title: 'Permits and planning', description: 'Obtain construction permits and finalize architectural plans', completed: true, cotkReward: 3000, completedDate: '2025-10-01' },
      { id: 'm2', title: 'Structural renovation', description: 'Walls, plumbing, electrical for new dental suite', completed: true, cotkReward: 5000, completedDate: '2025-12-15' },
      { id: 'm3', title: 'Equipment installation', description: 'Install dental chairs, X-ray machine, and diagnostic tools', completed: true, cotkReward: 4000, completedDate: '2026-01-30' },
      { id: 'm4', title: 'Grand reopening', description: 'Community celebration and first patients served', completed: true, cotkReward: 3000, completedDate: '2026-02-28' },
    ],
    activityFeed: [
      { id: 'a1', type: 'milestone', description: 'Grand reopening! 85 patients served in the first week.', date: '2026-02-28', author: 'Dr. Lisa Wong' },
      { id: 'a2', type: 'photo', description: 'Photo: Ribbon cutting ceremony with mayor and 50+ community members', date: '2026-02-28', author: 'Sarah Lee' },
      { id: 'a3', type: 'milestone', description: 'All equipment installed and tested. Dental suite fully operational.', date: '2026-01-30', author: 'Bob Martinez' },
      { id: 'a4', type: 'update', description: 'Exceeded funding goal by 2,300 OTK! Extra funds going to supply budget.', date: '2026-01-15', author: 'Dr. Lisa Wong' },
    ],
    impact: { beneficiaries: 2400, hoursContributed: 526, cotkDistributed: 23700, volunteersEngaged: 34 },
  },
  {
    id: 'proj-4',
    name: 'Cultural Heritage Digital Archive',
    description: 'Create a digital archive preserving local oral histories, traditional music, recipes, and photographs from community elders before they are lost to time.',
    category: 'culture',
    status: 'planning',
    fundingGoal: 8000,
    fundingRaised: 0,
    startDate: '2026-06-01',
    endDate: '2026-12-31',
    createdBy: 'openchain1hij...archivist',
    team: [
      { uid: 'openchain1hij...archivist', name: 'Yuki Tanaka', role: 'lead', cotkEarned: 0, hoursContributed: 8 },
    ],
    milestones: [
      { id: 'm1', title: 'Community outreach', description: 'Identify 50 elders willing to share stories and artifacts', completed: false, cotkReward: 1500 },
      { id: 'm2', title: 'Recording equipment setup', description: 'Acquire audio/video equipment, train volunteers on recording', completed: false, cotkReward: 1000 },
      { id: 'm3', title: 'First 20 interviews recorded', description: 'Record and digitize first batch of oral histories', completed: false, cotkReward: 2000 },
      { id: 'm4', title: 'Archive launch', description: 'Public digital archive accessible via community website', completed: false, cotkReward: 2500 },
    ],
    activityFeed: [
      { id: 'a1', type: 'update', description: 'Project proposal submitted. Seeking volunteers with audio/video skills.', date: '2026-03-27', author: 'Yuki Tanaka' },
    ],
    impact: { beneficiaries: 0, hoursContributed: 8, cotkDistributed: 0, volunteersEngaged: 1 },
  },
];

const MY_PROJECT_IDS = ['proj-1', 'proj-3'];

// ─── Component ───

export function CommunityProjectScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('browse');
  const [selectedProject, setSelectedProject] = useState<CommunityProject | null>(null);
  const [projects] = useState<CommunityProject[]>(DEMO_PROJECTS);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<ProjectCategory | 'all'>('all');

  // Create form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<ProjectCategory | ''>('');
  const [formFundingGoal, setFormFundingGoal] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formTeamLead, setFormTeamLead] = useState('');

  // Funding form
  const [fundAmount, setFundAmount] = useState('');

  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const filteredProjects = useMemo(() => {
    let list = projects;
    if (tab === 'my-projects') {
      list = list.filter((p) => MY_PROJECT_IDS.includes(p.id));
    }
    if (statusFilter !== 'all') {
      list = list.filter((p) => p.status === statusFilter);
    }
    if (categoryFilter !== 'all') {
      list = list.filter((p) => p.category === categoryFilter);
    }
    return list;
  }, [projects, tab, statusFilter, categoryFilter]);

  const handleCreateProject = useCallback(() => {
    if (!formName.trim()) { Alert.alert('Required', 'Enter a project name.'); return; }
    if (!formDescription.trim()) { Alert.alert('Required', 'Enter a project description.'); return; }
    if (!formCategory) { Alert.alert('Required', 'Select a category.'); return; }
    const goal = parseInt(formFundingGoal, 10);
    if (!goal || goal <= 0) { Alert.alert('Required', 'Enter a valid funding goal.'); return; }
    if (!formStartDate.trim() || !formEndDate.trim()) { Alert.alert('Required', 'Enter start and end dates.'); return; }

    Alert.alert(
      'Project Created',
      `"${formName.trim()}" has been submitted for community review.\n\nCategory: ${formCategory}\nFunding Goal: ${goal} OTK\n\nYou will earn cOTK as the project progresses through milestones.`,
    );
    setFormName('');
    setFormDescription('');
    setFormCategory('');
    setFormFundingGoal('');
    setFormStartDate('');
    setFormEndDate('');
    setFormTeamLead('');
    setTab('browse');
  }, [formName, formDescription, formCategory, formFundingGoal, formStartDate, formEndDate]);

  const handleJoinProject = useCallback((project: CommunityProject) => {
    Alert.alert(
      'Apply to Join',
      `Join "${project.name}" as a volunteer?\n\nYou will earn cOTK for hours contributed and milestones completed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Apply', onPress: () => Alert.alert('Application Sent', 'The project lead will review your request.') },
      ],
    );
  }, []);

  const handleFundProject = useCallback((project: CommunityProject) => {
    const amount = parseInt(fundAmount, 10);
    if (!amount || amount <= 0) { Alert.alert('Invalid', 'Enter a valid OTK amount.'); return; }
    const remaining = project.fundingGoal - project.fundingRaised;
    Alert.alert(
      'Confirm Funding',
      `Contribute ${amount} OTK to "${project.name}"?\n\nRemaining goal: ${remaining} OTK`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Contribute',
          onPress: () => {
            Alert.alert('Contribution Recorded', `${amount} OTK contributed. Thank you for supporting your community!`);
            setFundAmount('');
          },
        },
      ],
    );
  }, [fundAmount]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.blue + '20' },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.blue },
    filterRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, flexWrap: 'wrap', gap: 6 },
    filterChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: t.border },
    filterChipActive: { backgroundColor: t.accent.blue + '15', borderColor: t.accent.blue },
    filterChipText: { color: t.text.muted, fontSize: 11, fontWeight: fonts.semibold },
    filterChipTextActive: { color: t.accent.blue },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    cardName: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold },
    cardDesc: { color: t.text.secondary, fontSize: 13, marginTop: 6, lineHeight: 19 },
    statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, marginTop: 8 },
    statusText: { color: '#fff', fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase' },
    categoryTag: { color: t.text.muted, fontSize: 11, fontWeight: fonts.semibold, textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 },
    progressBar: { height: 6, backgroundColor: t.border, borderRadius: 3, marginTop: 10 },
    progressFill: { height: 6, borderRadius: 3 },
    progressLabel: { color: t.text.muted, fontSize: 11, marginTop: 4 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    sectionLabel: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 20, marginBottom: 8, marginTop: 20 },
    backBtn: { color: t.accent.blue, fontSize: 16 },
    detailHeader: { paddingHorizontal: 20, paddingTop: 8 },
    detailName: { color: t.text.primary, fontSize: 22, fontWeight: fonts.heavy },
    detailDesc: { color: t.text.secondary, fontSize: 14, lineHeight: 22, marginTop: 8 },
    detailMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaLabel: { color: t.text.muted, fontSize: 11 },
    metaValue: { color: t.text.primary, fontSize: 13, fontWeight: fonts.bold },
    milestoneCard: { backgroundColor: t.bg.secondary, borderRadius: 12, padding: 14, marginHorizontal: 20, marginBottom: 8 },
    milestoneRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    milestoneCheck: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    milestoneCheckText: { fontSize: 14, fontWeight: fonts.bold },
    milestoneName: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold, flex: 1 },
    milestoneDesc: { color: t.text.muted, fontSize: 12, marginTop: 4, marginLeft: 34 },
    milestoneReward: { color: t.accent.green, fontSize: 12, fontWeight: fonts.bold, marginTop: 4, marginLeft: 34 },
    teamRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border },
    teamName: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    teamRole: { fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
    teamStats: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    activityCard: { backgroundColor: t.bg.secondary, borderRadius: 12, padding: 12, marginHorizontal: 20, marginBottom: 8 },
    activityType: { fontSize: 10, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    activityDesc: { color: t.text.primary, fontSize: 13, lineHeight: 19 },
    activityMeta: { color: t.text.muted, fontSize: 11, marginTop: 4 },
    impactGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12, marginTop: 8 },
    impactBox: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, width: '47%', alignItems: 'center' },
    impactValue: { color: t.text.primary, fontSize: 24, fontWeight: fonts.heavy },
    impactLabel: { color: t.text.muted, fontSize: 11, marginTop: 4, textAlign: 'center' },
    inputCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 12 },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: fonts.semibold, marginBottom: 8 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15 },
    descInput: { minHeight: 100, textAlignVertical: 'top' },
    categoryPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1.5, borderColor: t.border },
    catChipActive: { borderColor: t.accent.blue, backgroundColor: t.accent.blue + '15' },
    catChipText: { color: t.text.muted, fontSize: 13, fontWeight: fonts.semibold },
    catChipTextActive: { color: t.accent.blue },
    submitBtn: { backgroundColor: t.accent.blue, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginHorizontal: 20, marginTop: 24 },
    submitBtnText: { color: '#fff', fontSize: 17, fontWeight: fonts.bold },
    actionRow: { flexDirection: 'row', gap: 10, marginHorizontal: 20, marginTop: 16 },
    actionBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    actionBtnText: { color: '#fff', fontSize: 14, fontWeight: fonts.bold },
    fundInput: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 12, color: t.text.primary, fontSize: 15, flex: 1 },
    fundRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginHorizontal: 20, marginTop: 12 },
    fundBtn: { backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20 },
    fundBtnText: { color: '#fff', fontSize: 14, fontWeight: fonts.bold },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40, marginHorizontal: 40, lineHeight: 22 },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20, marginTop: 8, marginBottom: 16 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
  }), [t]);

  const ACTIVITY_TYPE_COLORS: Record<string, string> = {
    update: t.accent.blue,
    photo: '#AF52DE',
    milestone: '#34C759',
    funding: '#FF9500',
    member_joined: '#5AC8FA',
  };

  // ─── Tab buttons ───

  const tabs: { key: Tab; label: string }[] = [
    { key: 'browse', label: 'Browse' },
    { key: 'my-projects', label: 'My Projects' },
    { key: 'create', label: 'Create' },
  ];

  // ─── Detail view ───

  if (selectedProject) {
    const proj = selectedProject;
    const fundingPercent = proj.fundingGoal > 0 ? Math.min(proj.fundingRaised / proj.fundingGoal, 1) : 0;
    const completedMilestones = proj.milestones.filter((m) => m.completed).length;
    const canFund = proj.status === 'fundraising' || proj.status === 'in_progress';
    const canJoin = proj.status !== 'completed';

    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setSelectedProject(null)}>
            <Text style={s.backBtn}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}>
            <Text style={s.closeBtn}>Close</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.scroll}>
          {/* Header */}
          <View style={s.detailHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={s.detailName}>{proj.name}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[proj.status] }]}>
                <Text style={s.statusText}>{STATUS_LABELS[proj.status]}</Text>
              </View>
              <Text style={[s.categoryTag, { marginTop: 10 }]}>
                {CATEGORIES.find((c) => c.key === proj.category)?.label ?? proj.category}
              </Text>
            </View>
            <Text style={s.detailDesc}>{proj.description}</Text>
            <View style={s.detailMeta}>
              <View style={s.metaItem}>
                <Text style={s.metaLabel}>Start:</Text>
                <Text style={s.metaValue}>{proj.startDate}</Text>
              </View>
              <View style={s.metaItem}>
                <Text style={s.metaLabel}>End:</Text>
                <Text style={s.metaValue}>{proj.endDate}</Text>
              </View>
              <View style={s.metaItem}>
                <Text style={s.metaLabel}>Team:</Text>
                <Text style={s.metaValue}>{proj.team.length}</Text>
              </View>
            </View>
          </View>

          {/* Funding progress */}
          <Text style={s.sectionLabel}>Funding</Text>
          <View style={[s.card, { marginTop: 0 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[s.metaValue, { fontSize: 18 }]}>{proj.fundingRaised.toLocaleString()} OTK</Text>
              <Text style={s.metaLabel}>of {proj.fundingGoal.toLocaleString()} OTK</Text>
            </View>
            <View style={s.progressBar}>
              <View style={[s.progressFill, {
                width: `${fundingPercent * 100}%`,
                backgroundColor: fundingPercent >= 1 ? '#34C759' : '#FF9500',
              }]} />
            </View>
            <Text style={s.progressLabel}>{Math.round(fundingPercent * 100)}% funded</Text>
          </View>

          {/* Fund / Join actions */}
          {(canFund || canJoin) && (
            <>
              {canFund && (
                <View style={s.fundRow}>
                  <TextInput
                    style={s.fundInput}
                    placeholder="OTK amount"
                    placeholderTextColor={t.text.muted}
                    value={fundAmount}
                    onChangeText={setFundAmount}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity style={s.fundBtn} onPress={() => handleFundProject(proj)}>
                    <Text style={s.fundBtnText}>Fund</Text>
                  </TouchableOpacity>
                </View>
              )}
              {canJoin && (
                <View style={s.actionRow}>
                  <TouchableOpacity
                    style={[s.actionBtn, { backgroundColor: t.accent.blue }]}
                    onPress={() => handleJoinProject(proj)}
                  >
                    <Text style={s.actionBtnText}>Join as Volunteer</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {/* Milestones */}
          <Text style={s.sectionLabel}>
            Milestones ({completedMilestones}/{proj.milestones.length})
          </Text>
          {proj.milestones.map((m) => (
            <View key={m.id} style={s.milestoneCard}>
              <View style={s.milestoneRow}>
                <View style={[s.milestoneCheck, {
                  borderColor: m.completed ? '#34C759' : t.border,
                  backgroundColor: m.completed ? '#34C759' : 'transparent',
                }]}>
                  {m.completed && <Text style={[s.milestoneCheckText, { color: '#fff' }]}>+</Text>}
                </View>
                <Text style={[s.milestoneName, m.completed && { textDecorationLine: 'line-through', color: t.text.muted }]}>
                  {m.title}
                </Text>
              </View>
              <Text style={s.milestoneDesc}>{m.description}</Text>
              <Text style={s.milestoneReward}>
                {m.cotkReward.toLocaleString()} cOTK {m.completed && m.completedDate ? `(completed ${m.completedDate})` : '(pending)'}
              </Text>
            </View>
          ))}

          {/* Team */}
          <Text style={s.sectionLabel}>Team ({proj.team.length})</Text>
          {proj.team.map((member) => (
            <View key={member.uid} style={s.teamRow}>
              <View>
                <Text style={s.teamName}>{member.name}</Text>
                <Text style={[s.teamRole, { color: ROLE_COLORS[member.role] }]}>{member.role}</Text>
                <Text style={s.teamStats}>{member.hoursContributed}h contributed | {member.cotkEarned.toLocaleString()} cOTK</Text>
              </View>
            </View>
          ))}

          {/* Activity Feed */}
          <Text style={s.sectionLabel}>Activity</Text>
          {proj.activityFeed.map((item) => (
            <View key={item.id} style={s.activityCard}>
              <Text style={[s.activityType, { color: ACTIVITY_TYPE_COLORS[item.type] || t.text.muted }]}>{item.type.replace('_', ' ')}</Text>
              <Text style={s.activityDesc}>{item.description}</Text>
              <Text style={s.activityMeta}>{item.date} — {item.author}</Text>
            </View>
          ))}

          {/* Impact Metrics */}
          <Text style={s.sectionLabel}>Impact</Text>
          <View style={s.impactGrid}>
            <View style={s.impactBox}>
              <Text style={s.impactValue}>{proj.impact.beneficiaries.toLocaleString()}</Text>
              <Text style={s.impactLabel}>Beneficiaries</Text>
            </View>
            <View style={s.impactBox}>
              <Text style={s.impactValue}>{proj.impact.hoursContributed.toLocaleString()}</Text>
              <Text style={s.impactLabel}>Hours Contributed</Text>
            </View>
            <View style={s.impactBox}>
              <Text style={s.impactValue}>{proj.impact.cotkDistributed.toLocaleString()}</Text>
              <Text style={s.impactLabel}>cOTK Distributed</Text>
            </View>
            <View style={s.impactBox}>
              <Text style={s.impactValue}>{proj.impact.volunteersEngaged}</Text>
              <Text style={s.impactLabel}>Volunteers Engaged</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Main view ───

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Community Projects</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
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
        {/* Browse / My Projects */}
        {(tab === 'browse' || tab === 'my-projects') && (
          <>
            {/* Summary stats */}
            <View style={s.statRow}>
              <View style={s.statItem}>
                <Text style={s.statValue}>{projects.length}</Text>
                <Text style={s.statLabel}>Projects</Text>
              </View>
              <View style={s.statItem}>
                <Text style={s.statValue}>{projects.reduce((sum, p) => sum + p.team.length, 0)}</Text>
                <Text style={s.statLabel}>Members</Text>
              </View>
              <View style={s.statItem}>
                <Text style={s.statValue}>{projects.reduce((sum, p) => sum + p.impact.cotkDistributed, 0).toLocaleString()}</Text>
                <Text style={s.statLabel}>cOTK Distributed</Text>
              </View>
            </View>

            {/* Status filter */}
            {tab === 'browse' && (
              <>
                <View style={s.filterRow}>
                  {(['all', 'planning', 'fundraising', 'in_progress', 'completed'] as const).map((f) => (
                    <TouchableOpacity
                      key={f}
                      style={[s.filterChip, statusFilter === f && s.filterChipActive]}
                      onPress={() => setStatusFilter(f)}
                    >
                      <Text style={[s.filterChipText, statusFilter === f && s.filterChipTextActive]}>
                        {f === 'all' ? 'All' : STATUS_LABELS[f]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={s.filterRow}>
                  {(['all', ...CATEGORIES.map((c) => c.key)] as const).map((f) => (
                    <TouchableOpacity
                      key={f}
                      style={[s.filterChip, categoryFilter === f && s.filterChipActive]}
                      onPress={() => setCategoryFilter(f as ProjectCategory | 'all')}
                    >
                      <Text style={[s.filterChipText, categoryFilter === f && s.filterChipTextActive]}>
                        {f === 'all' ? 'All' : CATEGORIES.find((c) => c.key === f)?.label ?? f}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Project list */}
            {filteredProjects.length === 0 ? (
              <Text style={s.emptyText}>
                {tab === 'my-projects'
                  ? 'You have not joined any projects yet. Browse projects and join as a volunteer!'
                  : 'No projects match your filters.'}
              </Text>
            ) : (
              filteredProjects.map((proj) => {
                const fundingPercent = proj.fundingGoal > 0 ? Math.min(proj.fundingRaised / proj.fundingGoal, 1) : 0;
                const completedMilestones = proj.milestones.filter((m) => m.completed).length;

                return (
                  <TouchableOpacity key={proj.id} style={s.card} onPress={() => setSelectedProject(proj)}>
                    <Text style={s.cardName}>{proj.name}</Text>
                    <Text style={s.categoryTag}>
                      {CATEGORIES.find((c) => c.key === proj.category)?.label ?? proj.category}
                    </Text>
                    <Text style={s.cardDesc} numberOfLines={2}>{proj.description}</Text>
                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 8 }}>
                      <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[proj.status] }]}>
                        <Text style={s.statusText}>{STATUS_LABELS[proj.status]}</Text>
                      </View>
                      <Text style={s.metaLabel}>{proj.team.length} members</Text>
                      <Text style={s.metaLabel}>{completedMilestones}/{proj.milestones.length} milestones</Text>
                    </View>
                    <View style={s.progressBar}>
                      <View style={[s.progressFill, {
                        width: `${fundingPercent * 100}%`,
                        backgroundColor: fundingPercent >= 1 ? '#34C759' : '#FF9500',
                      }]} />
                    </View>
                    <Text style={s.progressLabel}>
                      {proj.fundingRaised.toLocaleString()} / {proj.fundingGoal.toLocaleString()} OTK ({Math.round(fundingPercent * 100)}%)
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </>
        )}

        {/* Create Tab */}
        {tab === 'create' && (
          <>
            <Text style={s.sectionTitle}>Create Community Project</Text>

            <View style={s.inputCard}>
              <Text style={s.inputLabel}>Project Name</Text>
              <TextInput
                style={s.input}
                placeholder="e.g., Community Solar Farm"
                placeholderTextColor={t.text.muted}
                value={formName}
                onChangeText={setFormName}
              />
            </View>

            <View style={s.inputCard}>
              <Text style={s.inputLabel}>Description</Text>
              <TextInput
                style={[s.input, s.descInput]}
                placeholder="Describe the project goals, expected impact, and how cOTK will be distributed..."
                placeholderTextColor={t.text.muted}
                value={formDescription}
                onChangeText={setFormDescription}
                multiline
              />
            </View>

            <View style={s.inputCard}>
              <Text style={s.inputLabel}>Category</Text>
              <View style={s.categoryPicker}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[s.catChip, formCategory === cat.key && s.catChipActive]}
                    onPress={() => setFormCategory(cat.key)}
                  >
                    <Text style={[s.catChipText, formCategory === cat.key && s.catChipTextActive]}>
                      {cat.icon} {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={s.inputCard}>
              <Text style={s.inputLabel}>Funding Goal (OTK)</Text>
              <TextInput
                style={s.input}
                placeholder="e.g., 10000"
                placeholderTextColor={t.text.muted}
                value={formFundingGoal}
                onChangeText={setFormFundingGoal}
                keyboardType="numeric"
              />
            </View>

            <View style={s.inputCard}>
              <Text style={s.inputLabel}>Timeline</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={s.input}
                    placeholder="Start (YYYY-MM-DD)"
                    placeholderTextColor={t.text.muted}
                    value={formStartDate}
                    onChangeText={setFormStartDate}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={s.input}
                    placeholder="End (YYYY-MM-DD)"
                    placeholderTextColor={t.text.muted}
                    value={formEndDate}
                    onChangeText={setFormEndDate}
                  />
                </View>
              </View>
            </View>

            <View style={s.inputCard}>
              <Text style={s.inputLabel}>Team Lead Name</Text>
              <TextInput
                style={s.input}
                placeholder="Your name or alias"
                placeholderTextColor={t.text.muted}
                value={formTeamLead}
                onChangeText={setFormTeamLead}
              />
            </View>

            <TouchableOpacity style={s.submitBtn} onPress={handleCreateProject}>
              <Text style={s.submitBtnText}>Submit Project</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
