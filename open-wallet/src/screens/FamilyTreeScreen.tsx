/**
 * Family Tree Screen — Visualize family connections on Open Chain.
 *
 * Shows parents above, children below, mentors/teachers to the side.
 * Each node displays UID (truncated), relationship type, and verification status.
 * Tap a family member to send a quick gratitude transaction.
 *
 * "The greatest investment any civilization can make is in the raising and
 *  education of its children."
 * — The Human Constitution
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface Props {
  onClose: () => void;
  onSendGratitude?: (uid: string) => void;
}

type RelationshipType = 'parent' | 'child' | 'guardian' | 'mentor' | 'teacher';

interface FamilyNode {
  uid: string;
  relationship: RelationshipType;
  verified: boolean;
  name?: string;
}

const RELATIONSHIP_ICONS: Record<RelationshipType, string> = {
  parent: '\u{1F9D1}\u{200D}\u{1F37C}',
  child: '\u{1F476}',
  guardian: '\u{1F6E1}\u{FE0F}',
  mentor: '\u{1F31F}',
  teacher: '\u{1F9D1}\u{200D}\u{1F3EB}',
};

const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  parent: 'Parent',
  child: 'Child',
  guardian: 'Guardian',
  mentor: 'Mentor',
  teacher: 'Teacher',
};

// Demo family tree: 2 parents, 3 children, 1 mentor
const DEMO_FAMILY: FamilyNode[] = [
  { uid: 'uid-a1b2c3d4e5f60001', relationship: 'parent', verified: true, name: 'Parent A' },
  { uid: 'uid-a1b2c3d4e5f60002', relationship: 'parent', verified: true, name: 'Parent B' },
  { uid: 'uid-a1b2c3d4e5f60003', relationship: 'child', verified: true, name: 'Child 1' },
  { uid: 'uid-a1b2c3d4e5f60004', relationship: 'child', verified: true, name: 'Child 2' },
  { uid: 'uid-a1b2c3d4e5f60005', relationship: 'child', verified: false, name: 'Child 3' },
  { uid: 'uid-a1b2c3d4e5f60006', relationship: 'mentor', verified: true, name: 'Mentor M' },
];

const DEMO_PENDING: FamilyNode[] = [
  { uid: 'uid-a1b2c3d4e5f60007', relationship: 'teacher', verified: false, name: 'Teacher pending' },
];

// Demo OTK ripple data
const DEMO_RIPPLES = [
  { milestone: 'First Day of School', otk: 100, recipients: ['Parent A (+50 nOTK)', 'Parent B (+50 nOTK)', 'Mentor M (+30 eOTK)'] },
  { milestone: 'Grade Level Achievement', otk: 200, recipients: ['Parent A (+100 nOTK)', 'Parent B (+100 nOTK)', 'Teacher (+60 eOTK)'] },
];

const ADD_TYPES: RelationshipType[] = ['parent', 'child', 'guardian', 'mentor', 'teacher'];

export function FamilyTreeScreen({ onClose, onSendGratitude }: Props) {
  const [family] = useState<FamilyNode[]>(DEMO_FAMILY);
  const [pending] = useState<FamilyNode[]>(DEMO_PENDING);
  const [showAdd, setShowAdd] = useState(false);
  const [addUID, setAddUID] = useState('');
  const [addType, setAddType] = useState<RelationshipType>('parent');
  const [showRipples, setShowRipples] = useState(false);
  const t = useTheme();

  const truncUID = useCallback((uid: string) => {
    if (uid.length <= 16) return uid;
    return uid.slice(0, 10) + '...' + uid.slice(-4);
  }, []);

  const parents = useMemo(() => family.filter(n => n.relationship === 'parent' || n.relationship === 'guardian'), [family]);
  const children = useMemo(() => family.filter(n => n.relationship === 'child'), [family]);
  const mentors = useMemo(() => family.filter(n => n.relationship === 'mentor' || n.relationship === 'teacher'), [family]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    heroCard: { backgroundColor: t.accent.green + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: '800', textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 24 },
    // Tree visualization
    treeContainer: { paddingHorizontal: 20, marginTop: 8 },
    tierLabel: { color: t.text.muted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, textAlign: 'center' },
    nodeRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
    node: { backgroundColor: t.bg.card, borderRadius: 16, padding: 14, alignItems: 'center', minWidth: 100, maxWidth: 140 },
    nodeVerified: { borderWidth: 2, borderColor: t.accent.green },
    nodeUnverified: { borderWidth: 2, borderColor: t.accent.yellow, borderStyle: 'dashed' },
    nodeIcon: { fontSize: 28, marginBottom: 4 },
    nodeName: { color: t.text.primary, fontSize: 13, fontWeight: '700', textAlign: 'center' },
    nodeUID: { color: t.text.muted, fontSize: 10, marginTop: 2, fontFamily: 'monospace' },
    nodeRelLabel: { color: t.accent.blue, fontSize: 11, fontWeight: '600', marginTop: 4 },
    nodeVerifiedBadge: { color: t.accent.green, fontSize: 10, fontWeight: '700', marginTop: 2 },
    nodeUnverifiedBadge: { color: t.accent.yellow, fontSize: 10, fontWeight: '700', marginTop: 2 },
    // You (center)
    youNode: { backgroundColor: t.accent.purple + '20', borderRadius: 20, padding: 18, alignItems: 'center', alignSelf: 'center', minWidth: 120, marginVertical: 8, borderWidth: 2, borderColor: t.accent.purple },
    youIcon: { fontSize: 36, marginBottom: 4 },
    youLabel: { color: t.accent.purple, fontSize: 15, fontWeight: '800' },
    // Connector lines
    connector: { height: 24, width: 2, backgroundColor: t.border, alignSelf: 'center', marginVertical: 4 },
    // Pending
    pendingCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
    pendingText: { color: t.text.primary, fontSize: 14, flex: 1 },
    confirmBtn: { backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 16 },
    confirmBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    // Add relationship
    addBtn: { backgroundColor: t.accent.purple, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginHorizontal: 20, marginTop: 16 },
    addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    addForm: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 12 },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    typeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
    typeChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: t.bg.primary },
    typeChipActive: { backgroundColor: t.accent.purple },
    typeChipLabel: { color: t.text.secondary, fontSize: 12, fontWeight: '600' },
    typeChipLabelActive: { color: '#fff' },
    submitBtn: { backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    // Ripple visualization
    rippleBtn: { backgroundColor: t.bg.card, borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginHorizontal: 20, marginTop: 12 },
    rippleBtnText: { color: t.accent.orange, fontSize: 15, fontWeight: '700' },
    rippleCard: { backgroundColor: t.accent.orange + '10', borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 8 },
    rippleMilestone: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    rippleOTK: { color: t.accent.orange, fontSize: 13, fontWeight: '600', marginTop: 4 },
    rippleRecipient: { color: t.text.secondary, fontSize: 13, marginTop: 2, marginLeft: 8 },
    note: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginHorizontal: 24, marginTop: 16, lineHeight: 18 },
  }), [t]);

  const handleAddRelationship = useCallback(() => {
    if (!addUID.trim()) {
      Alert.alert('UID Required', 'Enter the Universal ID of the person you want to connect with.');
      return;
    }
    Alert.alert(
      'Relationship Request Sent',
      `A ${RELATIONSHIP_LABELS[addType]} relationship request has been sent to ${truncUID(addUID)}. They must confirm it before it becomes active on-chain.\n\n(Demo mode — no real transaction sent.)`,
    );
    setAddUID('');
    setShowAdd(false);
  }, [addUID, addType, truncUID]);

  const handleGratitudeTap = useCallback((node: FamilyNode) => {
    if (onSendGratitude) {
      onSendGratitude(node.uid);
    } else {
      Alert.alert(
        `Send Gratitude to ${node.name || truncUID(node.uid)}?`,
        `Tap to send a gratitude OTK to your ${RELATIONSHIP_LABELS[node.relationship].toLowerCase()}.\n\n(Demo mode)`,
      );
    }
  }, [onSendGratitude, truncUID]);

  const renderNode = useCallback((node: FamilyNode) => (
    <TouchableOpacity
      key={node.uid}
      style={[s.node, node.verified ? s.nodeVerified : s.nodeUnverified]}
      onPress={() => handleGratitudeTap(node)}
    >
      <Text style={s.nodeIcon}>{RELATIONSHIP_ICONS[node.relationship]}</Text>
      <Text style={s.nodeName}>{node.name || 'Unknown'}</Text>
      <Text style={s.nodeUID}>{truncUID(node.uid)}</Text>
      <Text style={s.nodeRelLabel}>{RELATIONSHIP_LABELS[node.relationship]}</Text>
      {node.verified
        ? <Text style={s.nodeVerifiedBadge}>Verified</Text>
        : <Text style={s.nodeUnverifiedBadge}>Pending</Text>
      }
    </TouchableOpacity>
  ), [s, truncUID, handleGratitudeTap]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Family Tree</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        <View style={s.heroCard}>
          <Text style={s.heroIcon}>{'\u{1F333}'}</Text>
          <Text style={s.heroTitle}>Your Family Tree</Text>
          <Text style={s.heroSubtitle}>
            On-chain family connections linked to Universal IDs. Tap any member to send gratitude.
          </Text>
        </View>

        {/* Parents / Guardians — above */}
        <Text style={s.section}>Parents & Guardians</Text>
        <View style={s.treeContainer}>
          <Text style={s.tierLabel}>Above You</Text>
          <View style={s.nodeRow}>
            {parents.map(renderNode)}
          </View>
        </View>

        <View style={s.connector} />

        {/* You — center */}
        <View style={s.youNode}>
          <Text style={s.youIcon}>{'\u{1F464}'}</Text>
          <Text style={s.youLabel}>You</Text>
        </View>

        <View style={s.connector} />

        {/* Children — below */}
        <Text style={s.section}>Children</Text>
        <View style={s.treeContainer}>
          <Text style={s.tierLabel}>Below You</Text>
          <View style={s.nodeRow}>
            {children.length > 0 ? children.map(renderNode) : (
              <Text style={{ color: t.text.muted, fontSize: 13, textAlign: 'center' }}>No children registered yet</Text>
            )}
          </View>
        </View>

        {/* Mentors / Teachers — side */}
        {mentors.length > 0 && (
          <>
            <Text style={s.section}>Mentors & Teachers</Text>
            <View style={s.treeContainer}>
              <Text style={s.tierLabel}>Beside You</Text>
              <View style={s.nodeRow}>
                {mentors.map(renderNode)}
              </View>
            </View>
          </>
        )}

        {/* Pending confirmations */}
        {pending.length > 0 && (
          <>
            <Text style={s.section}>Pending Confirmations</Text>
            {pending.map(p => (
              <View key={p.uid} style={s.pendingCard}>
                <Text style={{ fontSize: 24 }}>{RELATIONSHIP_ICONS[p.relationship]}</Text>
                <Text style={s.pendingText}>
                  {p.name || truncUID(p.uid)} wants to connect as your {RELATIONSHIP_LABELS[p.relationship].toLowerCase()}
                </Text>
                <TouchableOpacity
                  style={s.confirmBtn}
                  onPress={() => Alert.alert('Confirmed', `Relationship with ${p.name || truncUID(p.uid)} is now active on-chain. (Demo mode)`)}
                >
                  <Text style={s.confirmBtnText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {/* OTK Ripple Visualization */}
        <TouchableOpacity style={s.rippleBtn} onPress={() => setShowRipples(!showRipples)}>
          <Text style={s.rippleBtnText}>
            {showRipples ? 'Hide OTK Ripple Flow' : 'Show OTK Ripple Flow'}
          </Text>
        </TouchableOpacity>

        {showRipples && (
          <>
            <Text style={s.section}>OTK Ripple Attribution</Text>
            {DEMO_RIPPLES.map((ripple, i) => (
              <View key={i} style={s.rippleCard}>
                <Text style={s.rippleMilestone}>{ripple.milestone}</Text>
                <Text style={s.rippleOTK}>{ripple.otk} OTK milestone reward ripples to:</Text>
                {ripple.recipients.map((r, j) => (
                  <Text key={j} style={s.rippleRecipient}>{r}</Text>
                ))}
              </View>
            ))}
            <Text style={s.note}>
              When a parenting milestone is verified, OTK automatically flows up the family tree. Parents receive 50%, teachers 30%, grandparents 10%.
            </Text>
          </>
        )}

        {/* Add relationship */}
        <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(!showAdd)}>
          <Text style={s.addBtnText}>{showAdd ? 'Cancel' : 'Add Relationship'}</Text>
        </TouchableOpacity>

        {showAdd && (
          <View style={s.addForm}>
            <Text style={s.inputLabel}>Universal ID</Text>
            <TextInput
              style={s.input}
              placeholder="uid-..."
              placeholderTextColor={t.text.muted}
              value={addUID}
              onChangeText={setAddUID}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={s.inputLabel}>Relationship Type</Text>
            <View style={s.typeRow}>
              {ADD_TYPES.map(rt => (
                <TouchableOpacity
                  key={rt}
                  style={[s.typeChip, addType === rt && s.typeChipActive]}
                  onPress={() => setAddType(rt)}
                >
                  <Text style={[s.typeChipLabel, addType === rt && s.typeChipLabelActive]}>
                    {RELATIONSHIP_ICONS[rt]} {RELATIONSHIP_LABELS[rt]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={s.submitBtn} onPress={handleAddRelationship}>
              <Text style={s.submitBtnText}>Send Request</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={s.note}>
          Family connections are stored on Open Chain and linked to Universal IDs. Both parties must confirm a relationship before it becomes active.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
