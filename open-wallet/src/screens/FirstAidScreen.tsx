import { fonts } from '../utils/theme';
/**
 * First Aid Screen — First aid training, emergency response skills, CPR certification.
 *
 * Article I: "The ability to save a life is the highest expression of
 *  human capability. Every person trained in first aid strengthens the
 *  entire community."
 * — Human Constitution, Article I (hOTK)
 *
 * Features:
 * - First aid guide (offline-accessible: bleeding, burns, choking, fractures, CPR, AED)
 * - Training courses (community first aid classes, CPR certification)
 * - Emergency response drills (practice scenarios)
 * - First responder registration (register as trained community responder)
 * - Supply checklist (first aid kit contents, where to get supplies)
 * - hOTK earned for completing training and responding to emergencies
 * - Demo mode with sample data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// ─── Types ───

interface FirstAidGuide {
  id: string;
  title: string;
  category: string;
  summary: string;
  steps: string[];
  severity: 'life-threatening' | 'serious' | 'minor';
  offlineAvailable: boolean;
}

interface TrainingCourse {
  id: string;
  title: string;
  provider: string;
  duration: string;
  certification: boolean;
  hotkReward: number;
  nextDate: string;
  location: string;
  spotsLeft: number;
  description: string;
}

interface EmergencyDrill {
  id: string;
  title: string;
  scenario: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  hotkReward: number;
  completions: number;
}

interface SupplyItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  essential: boolean;
  notes: string;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const SEVERITY_COLORS: Record<string, string> = {
  'life-threatening': '#FF3B30',
  serious: '#FF9500',
  minor: '#34C759',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: '#34C759',
  intermediate: '#FF9500',
  advanced: '#FF3B30',
};

// ─── Demo Data ───

const DEMO_GUIDES: FirstAidGuide[] = [
  {
    id: 'g1', title: 'Severe Bleeding Control', category: 'Bleeding',
    summary: 'How to stop severe bleeding using direct pressure, tourniquets, and wound packing.',
    steps: ['Apply direct pressure with clean cloth', 'Elevate the injured area above heart level', 'If bleeding continues, apply tourniquet 2-3 inches above wound', 'Note the time tourniquet was applied', 'Call emergency services immediately'],
    severity: 'life-threatening', offlineAvailable: true,
  },
  {
    id: 'g2', title: 'CPR for Adults', category: 'CPR',
    summary: 'Cardiopulmonary resuscitation for unresponsive adults with no normal breathing.',
    steps: ['Check for responsiveness — tap shoulders, shout', 'Call emergency services or direct someone to call', 'Place heel of hand on center of chest', '30 compressions at 2 inches deep, 100-120/min', '2 rescue breaths (tilt head, lift chin)', 'Continue 30:2 cycle until help arrives or AED available'],
    severity: 'life-threatening', offlineAvailable: true,
  },
  {
    id: 'g3', title: 'AED Usage', category: 'AED',
    summary: 'How to use an Automated External Defibrillator during cardiac arrest.',
    steps: ['Turn on AED and follow voice prompts', 'Expose chest and dry if wet', 'Apply pads: one upper-right chest, one lower-left ribs', 'Ensure no one is touching the person', 'Press shock button if advised', 'Resume CPR immediately after shock'],
    severity: 'life-threatening', offlineAvailable: true,
  },
  {
    id: 'g4', title: 'Choking (Heimlich Maneuver)', category: 'Choking',
    summary: 'Abdominal thrusts for conscious choking adults and children over 1 year.',
    steps: ['Ask "Are you choking?" — if they cannot speak or cough, act', 'Stand behind the person, wrap arms around waist', 'Make a fist above the navel, below the ribcage', 'Grasp fist with other hand, thrust inward and upward', 'Repeat until object is expelled or person becomes unconscious', 'If unconscious, begin CPR and check mouth for object'],
    severity: 'life-threatening', offlineAvailable: true,
  },
  {
    id: 'g5', title: 'Burns Treatment', category: 'Burns',
    summary: 'First aid for thermal, chemical, and electrical burns.',
    steps: ['Remove from heat source, ensure your safety first', 'Cool burn under cool running water for 20 minutes', 'Remove clothing and jewelry near the burn (not stuck items)', 'Cover with clean, non-stick dressing', 'Do NOT apply ice, butter, or creams', 'Seek medical help for burns larger than palm size'],
    severity: 'serious', offlineAvailable: true,
  },
  {
    id: 'g6', title: 'Fracture Immobilization', category: 'Fractures',
    summary: 'How to stabilize suspected broken bones until medical help arrives.',
    steps: ['Do not move the person unless in immediate danger', 'Immobilize the injury in the position found', 'Apply a splint above and below the fracture site', 'Use padding between splint and skin', 'Check circulation beyond the injury (pulse, color, sensation)', 'Apply ice wrapped in cloth to reduce swelling'],
    severity: 'serious', offlineAvailable: true,
  },
  {
    id: 'g7', title: 'Allergic Reaction (Anaphylaxis)', category: 'Allergic',
    summary: 'Recognizing and responding to severe allergic reactions.',
    steps: ['Identify signs: swelling, hives, difficulty breathing, dizziness', 'Help administer epinephrine auto-injector if available', 'Inject into outer thigh, hold for 10 seconds', 'Call emergency services immediately', 'Keep person lying down with legs elevated', 'Be prepared to give CPR if breathing stops'],
    severity: 'life-threatening', offlineAvailable: true,
  },
  {
    id: 'g8', title: 'Heat Exhaustion & Heat Stroke', category: 'Heat',
    summary: 'Treating heat-related illness from mild exhaustion to life-threatening heat stroke.',
    steps: ['Move person to cool, shaded area', 'Remove excess clothing', 'Apply cool water to skin, fan the person', 'Give small sips of cool water if conscious', 'If confused, unconscious, or not sweating: call emergency services', 'Apply ice packs to neck, armpits, and groin'],
    severity: 'serious', offlineAvailable: true,
  },
];

const DEMO_COURSES: TrainingCourse[] = [
  {
    id: 'c1', title: 'Community First Aid & CPR', provider: 'Red Cross Chapter',
    duration: '8 hours (2 sessions)', certification: true, hotkReward: 2400,
    nextDate: '2026-04-05', location: 'Community Center, Rm 201',
    spotsLeft: 12, description: 'Comprehensive first aid and CPR/AED certification. Covers bleeding, burns, choking, fractures, cardiac emergencies. Certificate valid 2 years.',
  },
  {
    id: 'c2', title: 'Wilderness First Responder', provider: 'Outdoor Safety Institute',
    duration: '16 hours (4 sessions)', certification: true, hotkReward: 4800,
    nextDate: '2026-04-12', location: 'Riverside Park Pavilion',
    spotsLeft: 8, description: 'Advanced first aid for remote settings. Includes improvised splinting, wound management, hypothermia, altitude sickness, evacuation techniques.',
  },
];

const DEMO_DRILLS: EmergencyDrill[] = [
  {
    id: 'd1', title: 'Cardiac Arrest Response',
    scenario: 'A person collapses in a park. They are unresponsive and not breathing normally. An AED is available 50 meters away. Walk through the full response.',
    difficulty: 'beginner', duration: '15 min', hotkReward: 200, completions: 342,
  },
];

const DEMO_SUPPLIES: SupplyItem[] = [
  { id: 'su1', name: 'Adhesive bandages (assorted)', quantity: '25', category: 'Wound Care', essential: true, notes: 'Various sizes for minor cuts and scrapes' },
  { id: 'su2', name: 'Sterile gauze pads (4x4)', quantity: '10', category: 'Wound Care', essential: true, notes: 'For larger wounds and bleeding control' },
  { id: 'su3', name: 'Medical tape', quantity: '1 roll', category: 'Wound Care', essential: true, notes: 'Hypoallergenic, for securing dressings' },
  { id: 'su4', name: 'Elastic bandage (ACE wrap)', quantity: '2', category: 'Support', essential: true, notes: 'For sprains, strains, and compression' },
  { id: 'su5', name: 'Triangular bandage', quantity: '2', category: 'Support', essential: true, notes: 'Arm sling, tourniquet, or head bandage' },
  { id: 'su6', name: 'Disposable gloves (nitrile)', quantity: '4 pairs', category: 'Protection', essential: true, notes: 'Infection control for wound care' },
  { id: 'su7', name: 'CPR pocket mask', quantity: '1', category: 'CPR', essential: true, notes: 'One-way valve for rescue breathing' },
  { id: 'su8', name: 'Scissors (trauma shears)', quantity: '1', category: 'Tools', essential: true, notes: 'Cut clothing, tape, bandages' },
  { id: 'su9', name: 'Tweezers', quantity: '1', category: 'Tools', essential: true, notes: 'Splinter and debris removal' },
  { id: 'su10', name: 'Antiseptic wipes', quantity: '10', category: 'Wound Care', essential: true, notes: 'Clean wounds to prevent infection' },
  { id: 'su11', name: 'Instant cold pack', quantity: '2', category: 'Treatment', essential: false, notes: 'Reduce swelling for sprains and bumps' },
  { id: 'su12', name: 'Emergency blanket (mylar)', quantity: '1', category: 'Treatment', essential: false, notes: 'Retain body heat in shock or hypothermia' },
  { id: 'su13', name: 'Tourniquet (CAT)', quantity: '1', category: 'Bleeding', essential: false, notes: 'For life-threatening extremity bleeding' },
  { id: 'su14', name: 'First aid manual', quantity: '1', category: 'Reference', essential: true, notes: 'Quick reference guide for emergencies' },
];

type Tab = 'guide' | 'training' | 'respond' | 'supplies';

export function FirstAidScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('guide');
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: '#FF3B30' + '20' },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    tabTextActive: { color: '#FF3B30' },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    heroCard: { backgroundColor: '#FF3B30' + '10', borderRadius: 20, padding: 24, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    heroIcon: { fontSize: 40, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 17, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    guideCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 10, borderLeftWidth: 4 },
    guideTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    guideMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    guideSummary: { color: t.text.secondary, fontSize: 13, marginTop: 6, lineHeight: 20 },
    stepsList: { marginTop: 12, backgroundColor: t.bg.primary, borderRadius: 10, padding: 12 },
    stepItem: { flexDirection: 'row', marginBottom: 8 },
    stepNumber: { color: '#FF3B30', fontSize: 13, fontWeight: fonts.heavy, width: 24 },
    stepText: { color: t.text.primary, fontSize: 13, flex: 1, lineHeight: 20 },
    expandBtn: { marginTop: 8, alignSelf: 'flex-start' },
    expandBtnText: { color: t.accent.blue, fontSize: 13, fontWeight: fonts.semibold },
    offlineBadge: { backgroundColor: t.accent.green + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
    offlineText: { color: t.accent.green, fontSize: 11, fontWeight: fonts.bold },
    courseCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    courseName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    courseMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    courseDesc: { color: t.text.secondary, fontSize: 13, marginTop: 8, lineHeight: 20 },
    courseReward: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: t.bg.primary },
    courseHotk: { color: '#FF3B30', fontSize: 14, fontWeight: fonts.bold },
    enrollBtn: { backgroundColor: '#FF3B30', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    enrollBtnText: { color: '#fff', fontSize: 13, fontWeight: fonts.semibold },
    certBadge: { backgroundColor: t.accent.blue + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start', marginTop: 6 },
    certText: { color: t.accent.blue, fontSize: 11, fontWeight: fonts.bold },
    drillCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    drillTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    drillScenario: { color: t.text.secondary, fontSize: 13, marginTop: 8, lineHeight: 20 },
    drillMeta: { color: t.text.muted, fontSize: 12, marginTop: 8 },
    drillReward: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    startBtn: { backgroundColor: '#FF3B30', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    startBtnText: { color: '#fff', fontSize: 13, fontWeight: fonts.semibold },
    diffBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start', marginTop: 6 },
    diffText: { fontSize: 11, fontWeight: fonts.bold },
    registerCard: { backgroundColor: '#FF3B30' + '10', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    registerTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, textAlign: 'center' },
    registerDesc: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },
    registerBtn: { backgroundColor: '#FF3B30', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, marginTop: 16 },
    registerBtnText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    registeredBadge: { backgroundColor: t.accent.green + '20', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, marginTop: 16 },
    registeredText: { color: t.accent.green, fontSize: 15, fontWeight: fonts.bold },
    supplyCategory: { color: t.text.secondary, fontSize: 13, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1, marginTop: 12, marginBottom: 6 },
    supplyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.bg.primary },
    supplyName: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold, flex: 1 },
    supplyQty: { color: t.text.muted, fontSize: 13, marginLeft: 12 },
    supplyNotes: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    essentialDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    supplyLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },
  }), [t]);

  const handleToggleGuide = useCallback((id: string) => {
    setExpandedGuide((prev) => (prev === id ? null : id));
  }, []);

  const handleRegister = useCallback(() => {
    Alert.alert(
      'First Responder Registration',
      'You are registering as a trained community first responder. When emergencies are reported near you, you may be notified to help.\n\nhOTK will be earned for verified emergency responses.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Register', onPress: () => setIsRegistered(true) },
      ],
    );
  }, []);

  // Group supplies by category
  const supplyCategories = useMemo(() => {
    const cats: Record<string, SupplyItem[]> = {};
    DEMO_SUPPLIES.forEach((item) => {
      if (!cats[item.category]) cats[item.category] = [];
      cats[item.category].push(item);
    });
    return cats;
  }, []);

  // ─── Tabs ───

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'guide', label: 'Guide' },
    { key: 'training', label: 'Training' },
    { key: 'respond', label: 'Respond' },
    { key: 'supplies', label: 'Supplies' },
  ];

  // ─── Guide Tab ───

  const renderGuide = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'+'}</Text>
        <Text style={s.heroTitle}>First Aid Guide</Text>
        <Text style={s.heroSubtitle}>
          Offline-accessible emergency guides for bleeding, burns,{'\n'}
          choking, fractures, CPR, AED, and more. Knowledge{'\n'}
          that saves lives earns hOTK.
        </Text>
      </View>

      {DEMO_GUIDES.map((guide) => {
        const isExpanded = expandedGuide === guide.id;
        const sevColor = SEVERITY_COLORS[guide.severity] || t.text.muted;
        return (
          <View key={guide.id} style={[s.guideCard, { borderLeftColor: sevColor }]}>
            <Text style={s.guideTitle}>{guide.title}</Text>
            <Text style={s.guideMeta}>
              {guide.category} | {guide.severity.replace('-', ' ').toUpperCase()}
            </Text>
            <Text style={s.guideSummary}>{guide.summary}</Text>

            {isExpanded && (
              <View style={s.stepsList}>
                {guide.steps.map((step, idx) => (
                  <View key={idx} style={s.stepItem}>
                    <Text style={s.stepNumber}>{idx + 1}.</Text>
                    <Text style={s.stepText}>{step}</Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity style={s.expandBtn} onPress={() => handleToggleGuide(guide.id)}>
              <Text style={s.expandBtnText}>{isExpanded ? 'Collapse Steps' : 'Show Steps'}</Text>
            </TouchableOpacity>

            {guide.offlineAvailable && (
              <View style={s.offlineBadge}>
                <Text style={s.offlineText}>OFFLINE AVAILABLE</Text>
              </View>
            )}
          </View>
        );
      })}
    </>
  );

  // ─── Training Tab ───

  const renderTraining = () => (
    <>
      <Text style={s.sectionTitle}>Training Courses</Text>
      {DEMO_COURSES.map((course) => (
        <View key={course.id} style={s.courseCard}>
          <Text style={s.courseName}>{course.title}</Text>
          <Text style={s.courseMeta}>
            {course.provider} | {course.duration} | {course.location}
          </Text>
          <Text style={s.courseMeta}>
            Next session: {course.nextDate} | {course.spotsLeft} spots left
          </Text>
          {course.certification && (
            <View style={s.certBadge}>
              <Text style={s.certText}>CERTIFICATION INCLUDED</Text>
            </View>
          )}
          <Text style={s.courseDesc}>{course.description}</Text>
          <View style={s.courseReward}>
            <Text style={s.courseHotk}>+{course.hotkReward.toLocaleString()} hOTK</Text>
            <TouchableOpacity
              style={s.enrollBtn}
              onPress={() => Alert.alert('Enrolled', `You enrolled in "${course.title}". See you on ${course.nextDate}!`)}
            >
              <Text style={s.enrollBtnText}>Enroll</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </>
  );

  // ─── Respond Tab ───

  const renderRespond = () => (
    <>
      <Text style={s.sectionTitle}>Emergency Response Drills</Text>
      {DEMO_DRILLS.map((drill) => {
        const diffColor = DIFFICULTY_COLORS[drill.difficulty] || t.text.muted;
        return (
          <View key={drill.id} style={s.drillCard}>
            <Text style={s.drillTitle}>{drill.title}</Text>
            <View style={[s.diffBadge, { backgroundColor: diffColor + '20' }]}>
              <Text style={[s.diffText, { color: diffColor }]}>{drill.difficulty.toUpperCase()}</Text>
            </View>
            <Text style={s.drillScenario}>{drill.scenario}</Text>
            <Text style={s.drillMeta}>
              Duration: {drill.duration} | {drill.completions} completions
            </Text>
            <View style={s.drillReward}>
              <Text style={s.courseHotk}>+{drill.hotkReward} hOTK</Text>
              <TouchableOpacity
                style={s.startBtn}
                onPress={() => Alert.alert('Drill Started', `Walk through the "${drill.title}" scenario step by step. Your response will be evaluated.`)}
              >
                <Text style={s.startBtnText}>Start Drill</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      <Text style={[s.sectionTitle, { marginTop: 8 }]}>First Responder Registration</Text>
      <View style={s.registerCard}>
        <Text style={s.registerTitle}>Become a Community First Responder</Text>
        <Text style={s.registerDesc}>
          Register as a trained first responder in your community.{'\n'}
          When emergencies are reported nearby, you will be notified{'\n'}
          and can choose to respond. Earn hOTK for every verified{'\n'}
          emergency response.
        </Text>
        {isRegistered ? (
          <View style={s.registeredBadge}>
            <Text style={s.registeredText}>Registered as First Responder</Text>
          </View>
        ) : (
          <TouchableOpacity style={s.registerBtn} onPress={handleRegister}>
            <Text style={s.registerBtnText}>Register Now</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );

  // ─── Supplies Tab ───

  const renderSupplies = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'+'}</Text>
        <Text style={s.heroTitle}>First Aid Kit Checklist</Text>
        <Text style={s.heroSubtitle}>
          Essential supplies every household and community space{'\n'}
          should have ready. Green dot = essential item.
        </Text>
      </View>

      <View style={s.card}>
        {Object.entries(supplyCategories).map(([category, items]) => (
          <View key={category}>
            <Text style={s.supplyCategory}>{category}</Text>
            {items.map((item) => (
              <View key={item.id}>
                <View style={s.supplyRow}>
                  <View style={s.supplyLeft}>
                    <View style={[s.essentialDot, { backgroundColor: item.essential ? '#34C759' : t.text.muted + '40' }]} />
                    <Text style={s.supplyName}>{item.name}</Text>
                  </View>
                  <Text style={s.supplyQty}>{item.quantity}</Text>
                </View>
                <Text style={s.supplyNotes}>{item.notes}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>

      <View style={[s.card, { marginTop: 4 }]}>
        <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Where to Get Supplies</Text>
        <Text style={[s.guideSummary, { marginTop: 0 }]}>
          Most items are available at pharmacies, grocery stores, or online.{'\n\n'}
          Pre-assembled first aid kits are available from the Red Cross, local pharmacies, and outdoor retailers. Ensure your kit is checked and restocked every 6 months.{'\n\n'}
          Community organizations may provide free kits for qualifying households.
        </Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>First Aid</Text>
        <View style={{ width: 60 }} />
      </View>

      {demoMode && (
        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO MODE</Text>
        </View>
      )}

      <View style={s.tabRow}>
        {tabs.map((tb) => (
          <TouchableOpacity
            key={tb.key}
            style={[s.tabBtn, tab === tb.key && s.tabActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {tab === 'guide' && renderGuide()}
        {tab === 'training' && renderTraining()}
        {tab === 'respond' && renderRespond()}
        {tab === 'supplies' && renderSupplies()}
      </ScrollView>
    </SafeAreaView>
  );
}
