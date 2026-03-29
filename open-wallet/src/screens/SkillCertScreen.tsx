/**
 * Skill Certification Screen — On-chain soulbound skill certifications.
 *
 * Certifications are soulbound tokens: they cannot be transferred,
 * only earned through demonstrated competence and verified by
 * community validators.
 *
 * "Reputation is earned by contribution, not by wealth."
 * — Human Constitution, Article IV
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface Props {
  onClose: () => void;
}

/* ── data types ── */

type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

interface Certification {
  id: string;
  skill: string;
  category: string;
  level: SkillLevel;
  verifiedBy: string;
  date: string;
  badge: string;
  color: string;
}

interface SkillCategory {
  name: string;
  icon: string;
  skills: string[];
}

/* ── demo data ── */

const DEMO_CERTS: Certification[] = [
  { id: 'cert1', skill: 'Reading Comprehension', category: 'Reading', level: 'Advanced', verifiedBy: 'Teacher Maria (uid-teach-001)', date: '2026-02-10', badge: '\u{1F4D6}', color: '#3b82f6' },
  { id: 'cert2', skill: 'Arithmetic', category: 'Math', level: 'Intermediate', verifiedBy: 'Teacher Raj (uid-teach-002)', date: '2026-01-20', badge: '\u{1F522}', color: '#22c55e' },
  { id: 'cert3', skill: 'Basic Biology', category: 'Science', level: 'Beginner', verifiedBy: 'Teacher Sarah (uid-teach-003)', date: '2025-12-15', badge: '\u{1F52C}', color: '#8b5cf6' },
  { id: 'cert4', skill: 'HTML & CSS', category: 'Coding', level: 'Intermediate', verifiedBy: 'Mentor Alex (uid-ment-001)', date: '2026-03-05', badge: '\u{1F4BB}', color: '#f97316' },
  { id: 'cert5', skill: 'Watercolor Painting', category: 'Art', level: 'Beginner', verifiedBy: 'Teacher Yuki (uid-teach-004)', date: '2025-11-28', badge: '\u{1F3A8}', color: '#ec4899' },
  { id: 'cert6', skill: 'Piano Basics', category: 'Music', level: 'Beginner', verifiedBy: 'Mentor Clara (uid-ment-002)', date: '2026-02-22', badge: '\u{1F3B9}', color: '#eab308' },
  { id: 'cert7', skill: 'Creative Writing', category: 'Reading', level: 'Intermediate', verifiedBy: 'Teacher Maria (uid-teach-001)', date: '2026-03-18', badge: '\u{270D}\u{FE0F}', color: '#06b6d4' },
];

const SKILL_CATEGORIES: SkillCategory[] = [
  { name: 'Reading', icon: '\u{1F4D6}', skills: ['Reading Comprehension', 'Creative Writing', 'Speed Reading', 'Literary Analysis'] },
  { name: 'Math', icon: '\u{1F522}', skills: ['Arithmetic', 'Algebra', 'Geometry', 'Statistics', 'Calculus'] },
  { name: 'Science', icon: '\u{1F52C}', skills: ['Basic Biology', 'Chemistry', 'Physics', 'Earth Science', 'Environmental Science'] },
  { name: 'Coding', icon: '\u{1F4BB}', skills: ['HTML & CSS', 'JavaScript', 'Python', 'Data Structures', 'App Development'] },
  { name: 'Art', icon: '\u{1F3A8}', skills: ['Watercolor Painting', 'Drawing', 'Sculpture', 'Digital Art', 'Photography'] },
  { name: 'Music', icon: '\u{1F3B9}', skills: ['Piano Basics', 'Guitar', 'Singing', 'Music Theory', 'Composition'] },
];

const LEVELS: SkillLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

const LEVEL_COLORS: Record<SkillLevel, string> = {
  Beginner: '#22c55e',
  Intermediate: '#3b82f6',
  Advanced: '#8b5cf6',
  Expert: '#f97316',
};

type Tab = 'certs' | 'request';

export function SkillCertScreen({ onClose }: Props) {
  const t = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('certs');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel | null>(null);
  const [evidence, setEvidence] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const filteredCerts = useMemo(() => {
    if (!filterCategory) return DEMO_CERTS;
    return DEMO_CERTS.filter((c) => c.category === filterCategory);
  }, [filterCategory]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    heroCard: { backgroundColor: t.accent.purple + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: '800', textAlign: 'center' },
    heroSub: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginTop: 6, lineHeight: 18, fontStyle: 'italic' },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 16, backgroundColor: t.bg.card, borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: t.accent.purple },
    tabText: { color: t.text.muted, fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: t.bg.primary },
    section: { marginHorizontal: 20, marginTop: 20 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 12 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: '600' },
    filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    filterChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, backgroundColor: t.bg.card, borderWidth: 1, borderColor: t.border },
    filterChipActive: { borderColor: t.accent.purple, backgroundColor: t.accent.purple + '20' },
    filterChipText: { color: t.text.secondary, fontSize: 12, fontWeight: '600' },
    filterChipTextActive: { color: t.accent.purple },
    certCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4 },
    certBadge: { fontSize: 36, marginBottom: 8 },
    certSkill: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    certLevel: { fontSize: 12, fontWeight: '700', marginTop: 4 },
    certVerified: { color: t.text.muted, fontSize: 11, marginTop: 4 },
    certDate: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    soulbound: { color: t.accent.orange, fontSize: 10, fontWeight: '700', marginTop: 6, textTransform: 'uppercase', letterSpacing: 1 },
    // Badge grid
    badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
    badgeItem: { width: 70, alignItems: 'center' },
    badgeIcon: { fontSize: 40, marginBottom: 4 },
    badgeLabel: { color: t.text.secondary, fontSize: 10, textAlign: 'center' },
    // Request tab
    catChip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, backgroundColor: t.bg.card, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: t.border },
    catChipActive: { borderColor: t.accent.purple, backgroundColor: t.accent.purple + '20' },
    catChipText: { color: t.text.secondary, fontSize: 13 },
    catChipTextActive: { color: t.accent.purple, fontWeight: '600' },
    skillChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, backgroundColor: t.bg.card, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: t.border },
    skillChipActive: { borderColor: t.accent.blue, backgroundColor: t.accent.blue + '20' },
    skillChipText: { color: t.text.secondary, fontSize: 12 },
    skillChipTextActive: { color: t.accent.blue, fontWeight: '600' },
    levelRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    levelChip: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: t.bg.card, borderWidth: 1, borderColor: t.border },
    levelChipActive: { borderWidth: 2 },
    levelChipText: { fontSize: 12, fontWeight: '600' },
    input: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 14, borderWidth: 1, borderColor: t.border, marginBottom: 12, height: 80, textAlignVertical: 'top' },
    submitBtn: { backgroundColor: t.accent.purple, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    sublabel: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginTop: 12, lineHeight: 18 },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 22, fontWeight: '800' },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
  }), [t]);

  const renderCerts = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>My Certifications</Text>

      <View style={s.statRow}>
        <View style={s.statItem}>
          <Text style={s.statValue}>{DEMO_CERTS.length}</Text>
          <Text style={s.statLabel}>Total Certs</Text>
        </View>
        <View style={s.statItem}>
          <Text style={[s.statValue, { color: t.accent.purple }]}>{new Set(DEMO_CERTS.map((c) => c.category)).size}</Text>
          <Text style={s.statLabel}>Categories</Text>
        </View>
        <View style={s.statItem}>
          <Text style={[s.statValue, { color: t.accent.blue }]}>{DEMO_CERTS.filter((c) => c.level === 'Advanced' || c.level === 'Expert').length}</Text>
          <Text style={s.statLabel}>Adv+</Text>
        </View>
      </View>

      {/* Badge gallery */}
      <View style={s.badgeGrid}>
        {DEMO_CERTS.map((cert) => (
          <View key={cert.id} style={s.badgeItem}>
            <Text style={s.badgeIcon}>{cert.badge}</Text>
            <Text style={s.badgeLabel}>{cert.skill.split(' ')[0]}</Text>
          </View>
        ))}
      </View>

      {/* Filter */}
      <Text style={[s.sectionTitle, { marginTop: 20 }]}>Filter by Category</Text>
      <View style={s.filterRow}>
        <TouchableOpacity
          style={[s.filterChip, !filterCategory && s.filterChipActive]}
          onPress={() => setFilterCategory(null)}
        >
          <Text style={[s.filterChipText, !filterCategory && s.filterChipTextActive]}>All</Text>
        </TouchableOpacity>
        {SKILL_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.name}
            style={[s.filterChip, filterCategory === cat.name && s.filterChipActive]}
            onPress={() => setFilterCategory(filterCategory === cat.name ? null : cat.name)}
          >
            <Text style={[s.filterChipText, filterCategory === cat.name && s.filterChipTextActive]}>
              {cat.icon} {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Cert cards */}
      {filteredCerts.map((cert) => (
        <View key={cert.id} style={[s.certCard, { borderLeftColor: cert.color }]}>
          <Text style={s.certBadge}>{cert.badge}</Text>
          <Text style={s.certSkill}>{cert.skill}</Text>
          <Text style={[s.certLevel, { color: LEVEL_COLORS[cert.level] }]}>{cert.level}</Text>
          <Text style={s.certVerified}>Verified by: {cert.verifiedBy}</Text>
          <Text style={s.certDate}>{cert.date}</Text>
          <Text style={s.soulbound}>Soulbound — Non-Transferable</Text>
        </View>
      ))}
    </View>
  );

  const handleRequestCert = () => {
    if (!selectedCategory || !selectedSkill || !selectedLevel) {
      Alert.alert('Incomplete', 'Please select a category, skill, and level.');
      return;
    }
    Alert.alert(
      'Certification Requested (Demo)',
      `Request for "${selectedSkill}" at ${selectedLevel} level has been submitted to community verifiers.\n\nIn production, verifiers will review your evidence and issue a soulbound certification on Open Chain.`,
    );
    setSelectedCategory(null);
    setSelectedSkill(null);
    setSelectedLevel(null);
    setEvidence('');
  };

  const renderRequest = () => {
    const availableSkills = selectedCategory
      ? SKILL_CATEGORIES.find((c) => c.name === selectedCategory)?.skills ?? []
      : [];

    return (
      <View style={s.section}>
        <Text style={s.sectionTitle}>Request Certification</Text>

        <Text style={[s.certSkill, { marginBottom: 8 }]}>1. Select Category</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {SKILL_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.name}
              style={[s.catChip, selectedCategory === cat.name && s.catChipActive]}
              onPress={() => { setSelectedCategory(cat.name); setSelectedSkill(null); }}
            >
              <Text style={[s.catChipText, selectedCategory === cat.name && s.catChipTextActive]}>
                {cat.icon} {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedCategory && (
          <>
            <Text style={[s.certSkill, { marginBottom: 8, marginTop: 16 }]}>2. Select Skill</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {availableSkills.map((skill) => (
                <TouchableOpacity
                  key={skill}
                  style={[s.skillChip, selectedSkill === skill && s.skillChipActive]}
                  onPress={() => setSelectedSkill(skill)}
                >
                  <Text style={[s.skillChipText, selectedSkill === skill && s.skillChipTextActive]}>{skill}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {selectedSkill && (
          <>
            <Text style={[s.certSkill, { marginBottom: 8, marginTop: 16 }]}>3. Select Level</Text>
            <View style={s.levelRow}>
              {LEVELS.map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[s.levelChip, selectedLevel === level && [s.levelChipActive, { borderColor: LEVEL_COLORS[level] }]]}
                  onPress={() => setSelectedLevel(level)}
                >
                  <Text style={[s.levelChipText, { color: selectedLevel === level ? LEVEL_COLORS[level] : t.text.secondary }]}>{level}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {selectedLevel && (
          <>
            <Text style={[s.certSkill, { marginBottom: 8, marginTop: 8 }]}>4. Submit Evidence</Text>
            <TextInput
              style={s.input}
              placeholder="Describe your evidence (link to portfolio, test scores, project URL, etc.)"
              placeholderTextColor={t.text.muted}
              value={evidence}
              onChangeText={setEvidence}
              multiline
            />
          </>
        )}

        <TouchableOpacity style={s.submitBtn} onPress={handleRequestCert}>
          <Text style={s.submitBtnText}>Request Certification</Text>
        </TouchableOpacity>

        <Text style={s.sublabel}>
          Soulbound certifications live permanently on Open Chain. They prove your skills without revealing personal data. Verifiers earn eOTK for honest certification.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Skill Certifications</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.heroCard}>
          <Text style={s.heroIcon}>{'\u{1F3C5}'}</Text>
          <Text style={s.heroTitle}>Soulbound Achievements</Text>
          <Text style={s.heroSub}>
            Skills you earn, verified by your community. Cannot be bought or transferred — only demonstrated and recognized.
          </Text>
        </View>

        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO MODE — Sample Data</Text>
        </View>

        <View style={s.tabRow}>
          <TouchableOpacity
            style={[s.tab, activeTab === 'certs' && s.tabActive]}
            onPress={() => setActiveTab('certs')}
          >
            <Text style={[s.tabText, activeTab === 'certs' && s.tabTextActive]}>My Certs</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.tab, activeTab === 'request' && s.tabActive]}
            onPress={() => setActiveTab('request')}
          >
            <Text style={[s.tabText, activeTab === 'request' && s.tabTextActive]}>Request Cert</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'certs' && renderCerts()}
        {activeTab === 'request' && renderRequest()}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
