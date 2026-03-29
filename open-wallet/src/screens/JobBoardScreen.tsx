/**
 * Job Board Screen — Community job board and employment matching.
 *
 * Article I: "Every person deserves dignified, meaningful work."
 * xOTK represents exchange value in employment and labor.
 *
 * Features:
 * - Browse jobs by category (technology, agriculture, education, health, construction, services, creative)
 * - Job types: full_time, part_time, gig, volunteer, apprentice
 * - Post a job (title, description, category, type, skills, pay type)
 * - My applications with status tracking (applied, shortlisted, accepted)
 * - Regional employment stats (open listings, fill rate)
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

type JobCategory = 'technology' | 'agriculture' | 'education' | 'health' | 'construction' | 'services' | 'creative';
type JobType = 'full_time' | 'part_time' | 'gig' | 'volunteer' | 'apprentice';
type PayType = 'OTK' | 'fiat' | 'time' | 'volunteer';
type ApplicationStatus = 'applied' | 'shortlisted' | 'accepted';

interface JobListing {
  id: string;
  title: string;
  description: string;
  category: JobCategory;
  type: JobType;
  skills: string[];
  payType: PayType;
  payAmount: number;
  posterUID: string;
  posterName: string;
  location: string;
  postedDate: string;
  applicants: number;
}

interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  status: ApplicationStatus;
  appliedDate: string;
  lastUpdate: string;
}

interface EmploymentStats {
  region: string;
  openListings: number;
  filledThisMonth: number;
  fillRate: number;
  topCategories: { category: string; count: number }[];
  averagePayOTK: number;
  totalApplicants: number;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const CATEGORIES: { key: JobCategory; label: string; icon: string }[] = [
  { key: 'technology', label: 'Technology', icon: 'T' },
  { key: 'agriculture', label: 'Agriculture', icon: 'A' },
  { key: 'education', label: 'Education', icon: 'E' },
  { key: 'health', label: 'Health', icon: 'H' },
  { key: 'construction', label: 'Construction', icon: 'C' },
  { key: 'services', label: 'Services', icon: 'S' },
  { key: 'creative', label: 'Creative', icon: '*' },
];

const JOB_TYPES: { key: JobType; label: string }[] = [
  { key: 'full_time', label: 'Full Time' },
  { key: 'part_time', label: 'Part Time' },
  { key: 'gig', label: 'Gig' },
  { key: 'volunteer', label: 'Volunteer' },
  { key: 'apprentice', label: 'Apprentice' },
];

const PAY_TYPES: { key: PayType; label: string }[] = [
  { key: 'OTK', label: 'OTK' },
  { key: 'fiat', label: 'Fiat' },
  { key: 'time', label: 'Time Exchange' },
  { key: 'volunteer', label: 'Volunteer' },
];

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  applied: '#8E8E93',
  shortlisted: '#FF9500',
  accepted: '#34C759',
};

const TYPE_LABELS: Record<JobType, string> = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  gig: 'Gig',
  volunteer: 'Volunteer',
  apprentice: 'Apprentice',
};

// ─── Demo Data ───

const DEMO_LISTINGS: JobListing[] = [
  { id: 'j1', title: 'Community App Developer', description: 'Build mobile tools for local cooperatives. React Native experience preferred.', category: 'technology', type: 'part_time', skills: ['React Native', 'TypeScript', 'P2P'], payType: 'OTK', payAmount: 5000, posterUID: 'openchain1abc...coop_tech', posterName: 'Local Tech Coop', location: 'Remote', postedDate: '2026-03-27', applicants: 12 },
  { id: 'j2', title: 'Organic Farm Assistant', description: 'Help manage seasonal planting and harvest at community farm.', category: 'agriculture', type: 'gig', skills: ['farming', 'irrigation', 'composting'], payType: 'time', payAmount: 20, posterUID: 'openchain1def...green_acres', posterName: 'Green Acres Farm', location: 'Riverside County', postedDate: '2026-03-26', applicants: 5 },
  { id: 'j3', title: 'After-School Tutor', description: 'Tutor K-8 students in math and reading at community center.', category: 'education', type: 'part_time', skills: ['teaching', 'math', 'reading'], payType: 'OTK', payAmount: 1200, posterUID: 'openchain1ghi...school_dist', posterName: 'Lincoln School District', location: 'Lincoln Elementary', postedDate: '2026-03-25', applicants: 8 },
  { id: 'j4', title: 'Community Health Worker', description: 'Conduct home health visits and wellness checks for elderly residents.', category: 'health', type: 'full_time', skills: ['first aid', 'eldercare', 'communication'], payType: 'fiat', payAmount: 3200, posterUID: 'openchain1jkl...health_net', posterName: 'Community Health Network', location: 'Downtown Clinic', postedDate: '2026-03-24', applicants: 15 },
  { id: 'j5', title: 'Mural Painter — Town Square', description: 'Design and paint a community mural celebrating local heritage.', category: 'creative', type: 'gig', skills: ['painting', 'mural design', 'community art'], payType: 'OTK', payAmount: 8000, posterUID: 'openchain1mno...arts_council', posterName: 'Arts Council', location: 'Town Square', postedDate: '2026-03-23', applicants: 3 },
];

const DEMO_APPLICATIONS: JobApplication[] = [
  { id: 'a1', jobId: 'j1', jobTitle: 'Community App Developer', company: 'Local Tech Coop', status: 'shortlisted', appliedDate: '2026-03-27', lastUpdate: '2026-03-28' },
  { id: 'a2', jobId: 'j3', jobTitle: 'After-School Tutor', company: 'Lincoln School District', status: 'applied', appliedDate: '2026-03-26', lastUpdate: '2026-03-26' },
];

const DEMO_STATS: EmploymentStats = {
  region: 'Riverside Community',
  openListings: 47,
  filledThisMonth: 23,
  fillRate: 0.72,
  topCategories: [
    { category: 'Services', count: 14 },
    { category: 'Education', count: 10 },
    { category: 'Technology', count: 8 },
    { category: 'Health', count: 7 },
    { category: 'Agriculture', count: 5 },
  ],
  averagePayOTK: 3400,
  totalApplicants: 186,
};

type Tab = 'browse' | 'post' | 'applications' | 'stats';

export function JobBoardScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('browse');
  const [filterCategory, setFilterCategory] = useState<JobCategory | ''>('');
  const [filterType, setFilterType] = useState<JobType | ''>('');

  // Post form state
  const [postTitle, setPostTitle] = useState('');
  const [postDescription, setPostDescription] = useState('');
  const [postCategory, setPostCategory] = useState<JobCategory | ''>('');
  const [postType, setPostType] = useState<JobType | ''>('');
  const [postSkills, setPostSkills] = useState('');
  const [postPayType, setPostPayType] = useState<PayType | ''>('');
  const [postPayAmount, setPostPayAmount] = useState('');

  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const filteredJobs = useMemo(() => {
    let jobs = [...DEMO_LISTINGS];
    if (filterCategory) jobs = jobs.filter((j) => j.category === filterCategory);
    if (filterType) jobs = jobs.filter((j) => j.type === filterType);
    return jobs;
  }, [filterCategory, filterType]);

  const handleApply = useCallback((job: JobListing) => {
    const existing = DEMO_APPLICATIONS.find((a) => a.jobId === job.id);
    if (existing) {
      Alert.alert('Already Applied', `You applied for "${job.title}" on ${existing.appliedDate}.`);
      return;
    }
    Alert.alert(
      'Apply',
      `Apply for "${job.title}" at ${job.posterName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: () => {
            Alert.alert('Application Sent', `Your application for "${job.title}" has been submitted.\n\nTrack it in the Applications tab.`);
            setTab('applications');
          },
        },
      ],
    );
  }, []);

  const handlePostJob = useCallback(() => {
    if (!postTitle.trim()) { Alert.alert('Required', 'Enter a job title.'); return; }
    if (!postDescription.trim()) { Alert.alert('Required', 'Enter a job description.'); return; }
    if (!postCategory) { Alert.alert('Required', 'Select a category.'); return; }
    if (!postType) { Alert.alert('Required', 'Select a job type.'); return; }
    if (!postPayType) { Alert.alert('Required', 'Select a pay type.'); return; }

    const skills = postSkills.split(',').map((s) => s.trim()).filter(Boolean);

    Alert.alert(
      'Job Posted',
      `"${postTitle}" has been listed under ${postCategory}.\n\nSkills: ${skills.length > 0 ? skills.join(', ') : 'None specified'}\nPay: ${postPayAmount || '0'} ${postPayType}`,
    );

    setPostTitle('');
    setPostDescription('');
    setPostCategory('');
    setPostType('');
    setPostSkills('');
    setPostPayType('');
    setPostPayAmount('');
    setTab('browse');
  }, [postTitle, postDescription, postCategory, postType, postSkills, postPayType, postPayAmount]);

  const payLabel = (job: JobListing) => {
    if (job.payType === 'volunteer') return 'Volunteer';
    if (job.payType === 'time') return `${job.payAmount}h time exchange`;
    if (job.payType === 'OTK') return `${job.payAmount.toLocaleString()} xOTK`;
    return `$${job.payAmount.toLocaleString()}`;
  };

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border },
    headerTitle: { fontSize: 18, fontWeight: '700', color: t.text.primary },
    closeBtn: { paddingHorizontal: 12, paddingVertical: 6 },
    closeTxt: { fontSize: 16, color: t.accent.blue },
    tabBar: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border },
    tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
    tabBtnActive: { borderBottomWidth: 2, borderBottomColor: t.accent.blue },
    tabTxt: { fontSize: 13, color: t.text.muted },
    tabTxtActive: { fontSize: 13, color: t.accent.blue, fontWeight: '600' },
    scroll: { flex: 1 },
    pad: { padding: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: t.text.primary, marginBottom: 12 },
    subTitle: { fontSize: 14, fontWeight: '600', color: t.text.primary, marginBottom: 8, marginTop: 12 },

    // Filter row
    filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
    filterChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1, borderColor: t.border, backgroundColor: t.bg.secondary },
    filterChipActive: { backgroundColor: t.accent.blue, borderColor: t.accent.blue },
    filterChipTxt: { fontSize: 12, color: t.text.muted },
    filterChipTxtActive: { fontSize: 12, color: '#FFFFFF', fontWeight: '600' },

    // Job card
    jobCard: { backgroundColor: t.bg.secondary, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    jobTitle: { fontSize: 15, fontWeight: '700', color: t.text.primary, marginBottom: 4 },
    jobCompany: { fontSize: 13, color: t.accent.blue, marginBottom: 6 },
    jobDesc: { fontSize: 13, color: t.text.secondary, marginBottom: 8, lineHeight: 18 },
    jobMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    jobTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: t.bg.primary },
    jobTagTxt: { fontSize: 11, color: t.text.muted },
    jobFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    jobPay: { fontSize: 14, fontWeight: '700', color: '#34C759' },
    jobApplicants: { fontSize: 12, color: t.text.muted },
    applyBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
    applyBtnTxt: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },

    // Application card
    appCard: { backgroundColor: t.bg.secondary, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    appTitle: { fontSize: 15, fontWeight: '700', color: t.text.primary, marginBottom: 2 },
    appCompany: { fontSize: 13, color: t.text.secondary, marginBottom: 8 },
    appRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    appDate: { fontSize: 12, color: t.text.muted },
    appStatus: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
    appStatusTxt: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },

    // Post form
    label: { fontSize: 13, fontWeight: '600', color: t.text.secondary, marginBottom: 4, marginTop: 12 },
    input: { backgroundColor: t.bg.secondary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: t.text.primary, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    inputMulti: { height: 80, textAlignVertical: 'top' },
    pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
    pickerChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: t.border, backgroundColor: t.bg.secondary },
    pickerChipActive: { backgroundColor: t.accent.blue, borderColor: t.accent.blue },
    pickerChipTxt: { fontSize: 12, color: t.text.muted },
    pickerChipTxtActive: { fontSize: 12, color: '#FFFFFF', fontWeight: '600' },
    postBtn: { backgroundColor: '#34C759', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 20 },
    postBtnTxt: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

    // Stats
    statsCard: { backgroundColor: t.bg.secondary, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    statsRegion: { fontSize: 16, fontWeight: '700', color: t.text.primary, marginBottom: 12, textAlign: 'center' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    statsLabel: { fontSize: 13, color: t.text.secondary },
    statsValue: { fontSize: 13, fontWeight: '700', color: t.text.primary },
    statsBar: { height: 6, borderRadius: 3, backgroundColor: t.bg.primary, marginTop: 2, marginBottom: 8 },
    statsBarFill: { height: 6, borderRadius: 3 },

    empty: { fontSize: 14, color: t.text.muted, textAlign: 'center', marginTop: 40 },
    demoBanner: { backgroundColor: '#FF9500', paddingVertical: 4, alignItems: 'center' },
    demoBannerTxt: { fontSize: 11, fontWeight: '600', color: '#FFFFFF' },
  }), [t]);

  // ─── Tabs ───

  const TABS: { key: Tab; label: string }[] = [
    { key: 'browse', label: 'Browse' },
    { key: 'post', label: 'Post Job' },
    { key: 'applications', label: 'My Apps' },
    { key: 'stats', label: 'Stats' },
  ];

  // ─── Render: Browse ───

  const renderBrowse = () => (
    <ScrollView style={s.scroll}>
      <View style={s.pad}>
        <Text style={s.sectionTitle}>Job Categories</Text>
        <View style={s.filterRow}>
          <TouchableOpacity
            style={[s.filterChip, !filterCategory && s.filterChipActive]}
            onPress={() => setFilterCategory('')}
          >
            <Text style={[s.filterChipTxt, !filterCategory && s.filterChipTxtActive]}>All</Text>
          </TouchableOpacity>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.key}
              style={[s.filterChip, filterCategory === c.key && s.filterChipActive]}
              onPress={() => setFilterCategory(filterCategory === c.key ? '' : c.key)}
            >
              <Text style={[s.filterChipTxt, filterCategory === c.key && s.filterChipTxtActive]}>
                {c.icon} {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.subTitle}>Job Type</Text>
        <View style={s.filterRow}>
          <TouchableOpacity
            style={[s.filterChip, !filterType && s.filterChipActive]}
            onPress={() => setFilterType('')}
          >
            <Text style={[s.filterChipTxt, !filterType && s.filterChipTxtActive]}>All</Text>
          </TouchableOpacity>
          {JOB_TYPES.map((jt) => (
            <TouchableOpacity
              key={jt.key}
              style={[s.filterChip, filterType === jt.key && s.filterChipActive]}
              onPress={() => setFilterType(filterType === jt.key ? '' : jt.key)}
            >
              <Text style={[s.filterChipTxt, filterType === jt.key && s.filterChipTxtActive]}>
                {jt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.sectionTitle}>{filteredJobs.length} Listing{filteredJobs.length !== 1 ? 's' : ''}</Text>

        {filteredJobs.length === 0 && (
          <Text style={s.empty}>No jobs match the current filters.</Text>
        )}

        {filteredJobs.map((job) => (
          <View key={job.id} style={s.jobCard}>
            <Text style={s.jobTitle}>{job.title}</Text>
            <Text style={s.jobCompany}>{job.posterName} — {job.location}</Text>
            <Text style={s.jobDesc}>{job.description}</Text>
            <View style={s.jobMeta}>
              <View style={s.jobTag}><Text style={s.jobTagTxt}>{TYPE_LABELS[job.type]}</Text></View>
              <View style={s.jobTag}><Text style={s.jobTagTxt}>{job.category}</Text></View>
              {job.skills.slice(0, 3).map((sk) => (
                <View key={sk} style={s.jobTag}><Text style={s.jobTagTxt}>{sk}</Text></View>
              ))}
            </View>
            <View style={s.jobFooter}>
              <Text style={s.jobPay}>{payLabel(job)}</Text>
              <Text style={s.jobApplicants}>{job.applicants} applicants</Text>
              <TouchableOpacity style={s.applyBtn} onPress={() => handleApply(job)}>
                <Text style={s.applyBtnTxt}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  // ─── Render: Post ───

  const renderPost = () => (
    <ScrollView style={s.scroll}>
      <View style={s.pad}>
        <Text style={s.sectionTitle}>Post a Job</Text>

        <Text style={s.label}>Job Title</Text>
        <TextInput style={s.input} value={postTitle} onChangeText={setPostTitle} placeholder="e.g. Community Garden Coordinator" placeholderTextColor={t.text.muted} />

        <Text style={s.label}>Description</Text>
        <TextInput style={[s.input, s.inputMulti]} value={postDescription} onChangeText={setPostDescription} placeholder="Describe the role, responsibilities, and requirements..." placeholderTextColor={t.text.muted} multiline />

        <Text style={s.label}>Category</Text>
        <View style={s.pickerRow}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.key}
              style={[s.pickerChip, postCategory === c.key && s.pickerChipActive]}
              onPress={() => setPostCategory(c.key)}
            >
              <Text style={[s.pickerChipTxt, postCategory === c.key && s.pickerChipTxtActive]}>
                {c.icon} {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>Job Type</Text>
        <View style={s.pickerRow}>
          {JOB_TYPES.map((jt) => (
            <TouchableOpacity
              key={jt.key}
              style={[s.pickerChip, postType === jt.key && s.pickerChipActive]}
              onPress={() => setPostType(jt.key)}
            >
              <Text style={[s.pickerChipTxt, postType === jt.key && s.pickerChipTxtActive]}>
                {jt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>Required Skills (comma-separated)</Text>
        <TextInput style={s.input} value={postSkills} onChangeText={setPostSkills} placeholder="e.g. farming, leadership, planning" placeholderTextColor={t.text.muted} />

        <Text style={s.label}>Pay Type</Text>
        <View style={s.pickerRow}>
          {PAY_TYPES.map((pt) => (
            <TouchableOpacity
              key={pt.key}
              style={[s.pickerChip, postPayType === pt.key && s.pickerChipActive]}
              onPress={() => setPostPayType(pt.key)}
            >
              <Text style={[s.pickerChipTxt, postPayType === pt.key && s.pickerChipTxtActive]}>
                {pt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {postPayType && postPayType !== 'volunteer' && (
          <>
            <Text style={s.label}>Pay Amount {postPayType === 'OTK' ? '(xOTK)' : postPayType === 'time' ? '(hours)' : '($)'}</Text>
            <TextInput style={s.input} value={postPayAmount} onChangeText={setPostPayAmount} placeholder="0" placeholderTextColor={t.text.muted} keyboardType="numeric" />
          </>
        )}

        <TouchableOpacity style={s.postBtn} onPress={handlePostJob}>
          <Text style={s.postBtnTxt}>Post Job</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // ─── Render: Applications ───

  const renderApplications = () => (
    <ScrollView style={s.scroll}>
      <View style={s.pad}>
        <Text style={s.sectionTitle}>My Applications ({DEMO_APPLICATIONS.length})</Text>

        {DEMO_APPLICATIONS.length === 0 && (
          <Text style={s.empty}>No applications yet. Browse jobs to get started.</Text>
        )}

        {DEMO_APPLICATIONS.map((app) => (
          <View key={app.id} style={s.appCard}>
            <Text style={s.appTitle}>{app.jobTitle}</Text>
            <Text style={s.appCompany}>{app.company}</Text>
            <View style={s.appRow}>
              <Text style={s.appDate}>Applied: {app.appliedDate}</Text>
              <View style={[s.appStatus, { backgroundColor: STATUS_COLORS[app.status] }]}>
                <Text style={s.appStatusTxt}>{app.status.charAt(0).toUpperCase() + app.status.slice(1)}</Text>
              </View>
            </View>
            {app.lastUpdate !== app.appliedDate && (
              <Text style={[s.appDate, { marginTop: 4 }]}>Last update: {app.lastUpdate}</Text>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );

  // ─── Render: Stats ───

  const renderStats = () => (
    <ScrollView style={s.scroll}>
      <View style={s.pad}>
        <View style={s.statsCard}>
          <Text style={s.statsRegion}>{DEMO_STATS.region}</Text>

          <View style={s.statsRow}>
            <Text style={s.statsLabel}>Open Listings</Text>
            <Text style={s.statsValue}>{DEMO_STATS.openListings}</Text>
          </View>
          <View style={s.statsRow}>
            <Text style={s.statsLabel}>Filled This Month</Text>
            <Text style={s.statsValue}>{DEMO_STATS.filledThisMonth}</Text>
          </View>
          <View style={s.statsRow}>
            <Text style={s.statsLabel}>Fill Rate</Text>
            <Text style={s.statsValue}>{(DEMO_STATS.fillRate * 100).toFixed(0)}%</Text>
          </View>
          <View style={s.statsBar}>
            <View style={[s.statsBarFill, { width: `${DEMO_STATS.fillRate * 100}%`, backgroundColor: '#34C759' }]} />
          </View>
          <View style={s.statsRow}>
            <Text style={s.statsLabel}>Average Pay (xOTK)</Text>
            <Text style={s.statsValue}>{DEMO_STATS.averagePayOTK.toLocaleString()}</Text>
          </View>
          <View style={s.statsRow}>
            <Text style={s.statsLabel}>Total Applicants</Text>
            <Text style={s.statsValue}>{DEMO_STATS.totalApplicants}</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>Top Categories</Text>
        {DEMO_STATS.topCategories.map((cat, idx) => {
          const maxCount = DEMO_STATS.topCategories[0].count;
          const pct = maxCount > 0 ? (cat.count / maxCount) * 100 : 0;
          return (
            <View key={cat.category} style={{ marginBottom: 8 }}>
              <View style={s.statsRow}>
                <Text style={s.statsLabel}>{idx + 1}. {cat.category}</Text>
                <Text style={s.statsValue}>{cat.count} listings</Text>
              </View>
              <View style={s.statsBar}>
                <View style={[s.statsBarFill, { width: `${pct}%`, backgroundColor: t.accent.blue }]} />
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={s.container}>
      {demoMode && (
        <View style={s.demoBanner}>
          <Text style={s.demoBannerTxt}>DEMO MODE — Sample job data</Text>
        </View>
      )}

      <View style={s.header}>
        <Text style={s.headerTitle}>Job Board</Text>
        <TouchableOpacity style={s.closeBtn} onPress={onClose}>
          <Text style={s.closeTxt}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={s.tabBar}>
        {TABS.map((tb) => (
          <TouchableOpacity
            key={tb.key}
            style={[s.tabBtn, tab === tb.key && s.tabBtnActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={tab === tb.key ? s.tabTxtActive : s.tabTxt}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'browse' && renderBrowse()}
      {tab === 'post' && renderPost()}
      {tab === 'applications' && renderApplications()}
      {tab === 'stats' && renderStats()}
    </SafeAreaView>
  );
}
