/**
 * Emergency Contacts Screen — Personal emergency contacts & ICE card management.
 *
 * "Every human being deserves a safety net — people who will answer
 *  the call when crisis strikes. This is the foundation of mutual care."
 * — Human Constitution, Article I
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput, Alert, Switch,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

type Tab = 'contacts' | 'medical' | 'settings' | 'share';

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  uid: string;
  priority: number;
  notifyOnEmergency: boolean;
  canSeeLocation: boolean;
  canSeeMedical: boolean;
}

interface MedicalICE {
  bloodType: string;
  allergies: string[];
  conditions: string[];
  medications: string[];
  organDonor: boolean;
  emergencyNotes: string;
}

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'contacts', label: 'Contacts', icon: '\u{1F4DE}' },
  { key: 'medical', label: 'Medical', icon: '\u{1FA7A}' },
  { key: 'settings', label: 'Settings', icon: '\u{2699}\u{FE0F}' },
  { key: 'share', label: 'Share', icon: '\u{1F4F2}' },
];

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const RELATIONSHIPS = ['Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Doctor', 'Neighbor', 'Other'];

const DEMO_CONTACTS: EmergencyContact[] = [
  { id: '1', name: 'Sarah Chen', relationship: 'Spouse', phone: '+1 (555) 234-5678', uid: 'UID-SC-2024-001', priority: 1, notifyOnEmergency: true, canSeeLocation: true, canSeeMedical: true },
  { id: '2', name: 'Dr. James Park', relationship: 'Doctor', phone: '+1 (555) 345-6789', uid: 'UID-JP-2024-002', priority: 2, notifyOnEmergency: true, canSeeLocation: false, canSeeMedical: true },
  { id: '3', name: 'Maria Chen', relationship: 'Parent', phone: '+1 (555) 456-7890', uid: 'UID-MC-2024-003', priority: 3, notifyOnEmergency: true, canSeeLocation: true, canSeeMedical: true },
  { id: '4', name: 'Alex Rivera', relationship: 'Friend', phone: '+1 (555) 567-8901', uid: 'UID-AR-2024-004', priority: 4, notifyOnEmergency: false, canSeeLocation: true, canSeeMedical: false },
];

const DEMO_MEDICAL: MedicalICE = {
  bloodType: 'O+',
  allergies: ['Penicillin', 'Shellfish'],
  conditions: ['Mild asthma'],
  medications: ['Albuterol inhaler (as needed)'],
  organDonor: true,
  emergencyNotes: 'Inhaler kept in left pocket. Spouse Sarah is primary contact.',
};

const DEFAULT_SOS_TEMPLATE = 'EMERGENCY: I need help. My current location is attached. Please contact my emergency contacts. Medical info available via ICE QR code.';

export function EmergencyContactsScreen({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('contacts');
  const { demoMode } = useWalletStore();
  const t = useTheme();

  const [contacts, setContacts] = useState<EmergencyContact[]>(demoMode ? DEMO_CONTACTS : []);
  const [medical, setMedical] = useState<MedicalICE>(demoMode ? DEMO_MEDICAL : {
    bloodType: '', allergies: [], conditions: [], medications: [], organDonor: false, emergencyNotes: '',
  });
  const [sosTemplate, setSosTemplate] = useState(DEFAULT_SOS_TEMPLATE);
  const [autoNotifyEnabled, setAutoNotifyEnabled] = useState(demoMode);
  const [shareLocationOnSOS, setShareLocationOnSOS] = useState(demoMode);
  const [shareMedicalOnSOS, setShareMedicalOnSOS] = useState(demoMode);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRelationship, setNewRelationship] = useState('Friend');
  const [newPhone, setNewPhone] = useState('');
  const [newUID, setNewUID] = useState('');
  const [editMedicalField, setEditMedicalField] = useState<string | null>(null);
  const [tempFieldValue, setTempFieldValue] = useState('');

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 8 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.blue },
    tabIcon: { fontSize: 18, marginBottom: 2 },
    tabLabel: { color: t.text.muted, fontSize: 11, fontWeight: '600' },
    tabLabelActive: { color: '#fff' },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 20 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    contactRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    contactInfo: { flex: 1 },
    contactName: { color: t.text.primary, fontSize: 16, fontWeight: '700' },
    contactDetail: { color: t.text.muted, fontSize: 13, marginTop: 2 },
    contactPhone: { color: t.accent.blue, fontSize: 13, marginTop: 2 },
    priorityBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: t.accent.blue, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    priorityText: { color: '#fff', fontSize: 13, fontWeight: '800' },
    iceBadge: { backgroundColor: t.accent.red + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4, alignSelf: 'flex-start' },
    iceBadgeText: { color: t.accent.red, fontSize: 11, fontWeight: '700' },
    actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
    smallBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: t.bg.primary },
    smallBtnText: { color: t.accent.blue, fontSize: 12, fontWeight: '600' },
    dangerBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: t.accent.red + '15' },
    dangerBtnText: { color: t.accent.red, fontSize: 12, fontWeight: '600' },
    addBtn: { backgroundColor: t.accent.blue, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginHorizontal: 20, marginTop: 16 },
    addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 10 },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
    chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
    chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, backgroundColor: t.bg.primary },
    chipActive: { backgroundColor: t.accent.blue },
    chipText: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
    chipTextActive: { color: '#fff' },
    medicalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border },
    medicalLabel: { color: t.text.secondary, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    medicalValue: { color: t.text.primary, fontSize: 15, fontWeight: '600', marginTop: 4 },
    tagRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 6 },
    tag: { backgroundColor: t.accent.red + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    tagText: { color: t.accent.red, fontSize: 12, fontWeight: '600' },
    conditionTag: { backgroundColor: t.accent.orange + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    conditionTagText: { color: t.accent.orange, fontSize: 12, fontWeight: '600' },
    medTag: { backgroundColor: t.accent.blue + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    medTagText: { color: t.accent.blue, fontSize: 12, fontWeight: '600' },
    donorBadge: { backgroundColor: t.accent.green + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, alignSelf: 'flex-start', marginTop: 6 },
    donorBadgeText: { color: t.accent.green, fontSize: 13, fontWeight: '700' },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border },
    settingLabel: { color: t.text.primary, fontSize: 15, fontWeight: '600', flex: 1 },
    settingDesc: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    templateCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 12 },
    templateInput: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 14, minHeight: 100, textAlignVertical: 'top' },
    shareCard: { backgroundColor: t.bg.card, borderRadius: 20, padding: 24, marginHorizontal: 20, marginTop: 12, alignItems: 'center' },
    qrPlaceholder: { width: 200, height: 200, borderRadius: 16, backgroundColor: t.bg.primary, justifyContent: 'center', alignItems: 'center', marginVertical: 16, borderWidth: 2, borderColor: t.accent.red, borderStyle: 'dashed' },
    qrText: { color: t.text.muted, fontSize: 14, textAlign: 'center' },
    shareTitle: { color: t.text.primary, fontSize: 18, fontWeight: '800', marginBottom: 4 },
    shareSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', lineHeight: 20 },
    shareBtn: { backgroundColor: t.accent.red, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, marginTop: 16 },
    shareBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    lockScreenBtn: { backgroundColor: t.bg.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, marginTop: 10 },
    lockScreenBtnText: { color: t.accent.blue, fontSize: 15, fontWeight: '700' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroCard: { backgroundColor: t.accent.red + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center' },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: '800', textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    emptyState: { alignItems: 'center', paddingVertical: 40 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { color: t.text.muted, fontSize: 15, textAlign: 'center' },
    notifyIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    notifyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: t.accent.green },
    notifyText: { color: t.accent.green, fontSize: 11, fontWeight: '600' },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, marginHorizontal: 20, backgroundColor: t.bg.card, borderRadius: 16, marginBottom: 8 },
    summaryItem: { alignItems: 'center' },
    summaryNumber: { color: t.text.primary, fontSize: 22, fontWeight: '800' },
    summaryLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
  }), [t]);

  const handleAddContact = useCallback(() => {
    if (!newName.trim() || !newPhone.trim()) {
      Alert.alert('Required', 'Name and phone number are required.');
      return;
    }
    const contact: EmergencyContact = {
      id: Date.now().toString(),
      name: newName.trim(),
      relationship: newRelationship,
      phone: newPhone.trim(),
      uid: newUID.trim() || `UID-${Date.now()}`,
      priority: contacts.length + 1,
      notifyOnEmergency: true,
      canSeeLocation: true,
      canSeeMedical: false,
    };
    setContacts(prev => [...prev, contact]);
    setShowAddForm(false);
    setNewName('');
    setNewPhone('');
    setNewUID('');
  }, [newName, newPhone, newRelationship, newUID, contacts.length]);

  const handleRemoveContact = useCallback((id: string) => {
    Alert.alert('Remove Contact', 'Remove this emergency contact?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
        setContacts(prev => prev.filter(c => c.id !== id).map((c, i) => ({ ...c, priority: i + 1 })));
      }},
    ]);
  }, []);

  const handleMovePriority = useCallback((id: string, direction: 'up' | 'down') => {
    setContacts(prev => {
      const idx = prev.findIndex(c => c.id === id);
      if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === prev.length - 1)) return prev;
      const next = [...prev];
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next.map((c, i) => ({ ...c, priority: i + 1 }));
    });
  }, []);

  const notifyCount = contacts.filter(c => c.notifyOnEmergency).length;

  const renderContacts = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'\u{1F6A8}'}</Text>
        <Text style={s.heroTitle}>Emergency Contacts</Text>
        <Text style={s.heroSubtitle}>
          ICE — In Case of Emergency. These people will be notified when you need help.
        </Text>
      </View>

      <View style={s.summaryRow}>
        <View style={s.summaryItem}>
          <Text style={s.summaryNumber}>{contacts.length}</Text>
          <Text style={s.summaryLabel}>Contacts</Text>
        </View>
        <View style={s.summaryItem}>
          <Text style={s.summaryNumber}>{notifyCount}</Text>
          <Text style={s.summaryLabel}>Auto-Notify</Text>
        </View>
        <View style={s.summaryItem}>
          <Text style={s.summaryNumber}>{medical.bloodType || '--'}</Text>
          <Text style={s.summaryLabel}>Blood Type</Text>
        </View>
      </View>

      <Text style={s.section}>{'\u{1F4CB}'} Priority Order</Text>

      {contacts.length === 0 ? (
        <View style={s.emptyState}>
          <Text style={s.emptyIcon}>{'\u{1F4DE}'}</Text>
          <Text style={s.emptyText}>No emergency contacts yet.{'\n'}Add someone you trust.</Text>
        </View>
      ) : (
        contacts.map((contact) => (
          <View key={contact.id} style={s.card}>
            <View style={s.contactRow}>
              <View style={s.priorityBadge}>
                <Text style={s.priorityText}>{contact.priority}</Text>
              </View>
              <View style={s.contactInfo}>
                <Text style={s.contactName}>{contact.name}</Text>
                <Text style={s.contactDetail}>{contact.relationship}</Text>
                <Text style={s.contactPhone}>{contact.phone}</Text>
                <Text style={[s.contactDetail, { fontSize: 11 }]}>UID: {contact.uid}</Text>
                {contact.notifyOnEmergency && (
                  <View style={s.notifyIndicator}>
                    <View style={s.notifyDot} />
                    <Text style={s.notifyText}>Auto-notify enabled</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={s.actionRow}>
              <TouchableOpacity style={s.smallBtn} onPress={() => handleMovePriority(contact.id, 'up')}>
                <Text style={s.smallBtnText}>{'\u2B06'} Up</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.smallBtn} onPress={() => handleMovePriority(contact.id, 'down')}>
                <Text style={s.smallBtnText}>{'\u2B07'} Down</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.smallBtn} onPress={() => setEditingContact(contact)}>
                <Text style={s.smallBtnText}>{'\u270F\u{FE0F}'} Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.dangerBtn} onPress={() => handleRemoveContact(contact.id)}>
                <Text style={s.dangerBtnText}>{'\u{1F5D1}'} Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {showAddForm ? (
        <View style={s.card}>
          <Text style={s.inputLabel}>Name</Text>
          <TextInput style={s.input} value={newName} onChangeText={setNewName} placeholder="Full name" placeholderTextColor={t.text.muted} />

          <Text style={s.inputLabel}>Relationship</Text>
          <View style={s.chipRow}>
            {RELATIONSHIPS.map(rel => (
              <TouchableOpacity key={rel} style={[s.chip, newRelationship === rel && s.chipActive]} onPress={() => setNewRelationship(rel)}>
                <Text style={[s.chipText, newRelationship === rel && s.chipTextActive]}>{rel}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.inputLabel}>Phone</Text>
          <TextInput style={s.input} value={newPhone} onChangeText={setNewPhone} placeholder="+1 (555) 000-0000" placeholderTextColor={t.text.muted} keyboardType="phone-pad" />

          <Text style={s.inputLabel}>Universal ID (optional)</Text>
          <TextInput style={s.input} value={newUID} onChangeText={setNewUID} placeholder="UID-XX-XXXX-XXX" placeholderTextColor={t.text.muted} />

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={[s.addBtn, { flex: 1 }]} onPress={handleAddContact}>
              <Text style={s.addBtnText}>Save Contact</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.addBtn, { flex: 1, backgroundColor: t.bg.card }]} onPress={() => setShowAddForm(false)}>
              <Text style={[s.addBtnText, { color: t.text.muted }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={s.addBtn} onPress={() => setShowAddForm(true)}>
          <Text style={s.addBtnText}>{'\u2795'} Add Emergency Contact</Text>
        </TouchableOpacity>
      )}
    </>
  );

  const renderMedical = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'\u{1FA7A}'}</Text>
        <Text style={s.heroTitle}>Medical ICE Card</Text>
        <Text style={s.heroSubtitle}>
          Critical medical information for first responders. Keep this current — it could save your life.
        </Text>
      </View>

      <View style={s.card}>
        <View style={s.medicalRow}>
          <View>
            <Text style={s.medicalLabel}>Blood Type</Text>
            <Text style={s.medicalValue}>{medical.bloodType || 'Not set'}</Text>
          </View>
        </View>

        {!editMedicalField || editMedicalField !== 'bloodType' ? (
          <View style={s.chipRow}>
            {BLOOD_TYPES.map(bt => (
              <TouchableOpacity key={bt} style={[s.chip, medical.bloodType === bt && s.chipActive]} onPress={() => setMedical(prev => ({ ...prev, bloodType: bt }))}>
                <Text style={[s.chipText, medical.bloodType === bt && s.chipTextActive]}>{bt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <View style={s.medicalRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.medicalLabel}>Allergies</Text>
            {medical.allergies.length > 0 ? (
              <View style={s.tagRow}>
                {medical.allergies.map((a, i) => (
                  <TouchableOpacity key={i} style={s.tag} onPress={() => {
                    Alert.alert('Remove', `Remove "${a}"?`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Remove', style: 'destructive', onPress: () => setMedical(prev => ({ ...prev, allergies: prev.allergies.filter((_, j) => j !== i) })) },
                    ]);
                  }}>
                    <Text style={s.tagText}>{'\u26A0\u{FE0F}'} {a}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={[s.medicalValue, { color: t.text.muted }]}>None listed</Text>
            )}
          </View>
        </View>

        {editMedicalField === 'allergies' ? (
          <View style={{ marginTop: 8 }}>
            <TextInput style={s.input} value={tempFieldValue} onChangeText={setTempFieldValue} placeholder="Add allergy..." placeholderTextColor={t.text.muted} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={[s.smallBtn, { backgroundColor: t.accent.blue }]} onPress={() => {
                if (tempFieldValue.trim()) {
                  setMedical(prev => ({ ...prev, allergies: [...prev.allergies, tempFieldValue.trim()] }));
                  setTempFieldValue('');
                  setEditMedicalField(null);
                }
              }}>
                <Text style={[s.smallBtnText, { color: '#fff' }]}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.smallBtn} onPress={() => { setEditMedicalField(null); setTempFieldValue(''); }}>
                <Text style={s.smallBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={s.smallBtn} onPress={() => setEditMedicalField('allergies')}>
            <Text style={s.smallBtnText}>{'\u2795'} Add Allergy</Text>
          </TouchableOpacity>
        )}

        <View style={s.medicalRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.medicalLabel}>Conditions</Text>
            {medical.conditions.length > 0 ? (
              <View style={s.tagRow}>
                {medical.conditions.map((c, i) => (
                  <TouchableOpacity key={i} style={s.conditionTag} onPress={() => {
                    Alert.alert('Remove', `Remove "${c}"?`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Remove', style: 'destructive', onPress: () => setMedical(prev => ({ ...prev, conditions: prev.conditions.filter((_, j) => j !== i) })) },
                    ]);
                  }}>
                    <Text style={s.conditionTagText}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={[s.medicalValue, { color: t.text.muted }]}>None listed</Text>
            )}
          </View>
        </View>

        {editMedicalField === 'conditions' ? (
          <View style={{ marginTop: 8 }}>
            <TextInput style={s.input} value={tempFieldValue} onChangeText={setTempFieldValue} placeholder="Add condition..." placeholderTextColor={t.text.muted} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={[s.smallBtn, { backgroundColor: t.accent.blue }]} onPress={() => {
                if (tempFieldValue.trim()) {
                  setMedical(prev => ({ ...prev, conditions: [...prev.conditions, tempFieldValue.trim()] }));
                  setTempFieldValue('');
                  setEditMedicalField(null);
                }
              }}>
                <Text style={[s.smallBtnText, { color: '#fff' }]}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.smallBtn} onPress={() => { setEditMedicalField(null); setTempFieldValue(''); }}>
                <Text style={s.smallBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={s.smallBtn} onPress={() => setEditMedicalField('conditions')}>
            <Text style={s.smallBtnText}>{'\u2795'} Add Condition</Text>
          </TouchableOpacity>
        )}

        <View style={s.medicalRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.medicalLabel}>Medications</Text>
            {medical.medications.length > 0 ? (
              <View style={s.tagRow}>
                {medical.medications.map((m, i) => (
                  <TouchableOpacity key={i} style={s.medTag} onPress={() => {
                    Alert.alert('Remove', `Remove "${m}"?`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Remove', style: 'destructive', onPress: () => setMedical(prev => ({ ...prev, medications: prev.medications.filter((_, j) => j !== i) })) },
                    ]);
                  }}>
                    <Text style={s.medTagText}>{'\u{1F48A}'} {m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={[s.medicalValue, { color: t.text.muted }]}>None listed</Text>
            )}
          </View>
        </View>

        {editMedicalField === 'medications' ? (
          <View style={{ marginTop: 8 }}>
            <TextInput style={s.input} value={tempFieldValue} onChangeText={setTempFieldValue} placeholder="Add medication..." placeholderTextColor={t.text.muted} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={[s.smallBtn, { backgroundColor: t.accent.blue }]} onPress={() => {
                if (tempFieldValue.trim()) {
                  setMedical(prev => ({ ...prev, medications: [...prev.medications, tempFieldValue.trim()] }));
                  setTempFieldValue('');
                  setEditMedicalField(null);
                }
              }}>
                <Text style={[s.smallBtnText, { color: '#fff' }]}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.smallBtn} onPress={() => { setEditMedicalField(null); setTempFieldValue(''); }}>
                <Text style={s.smallBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={s.smallBtn} onPress={() => setEditMedicalField('medications')}>
            <Text style={s.smallBtnText}>{'\u2795'} Add Medication</Text>
          </TouchableOpacity>
        )}

        <View style={s.medicalRow}>
          <View>
            <Text style={s.medicalLabel}>Organ Donor</Text>
            {medical.organDonor ? (
              <View style={s.donorBadge}>
                <Text style={s.donorBadgeText}>{'\u2764\u{FE0F}'} Registered Organ Donor</Text>
              </View>
            ) : (
              <Text style={[s.medicalValue, { color: t.text.muted }]}>Not registered</Text>
            )}
          </View>
          <Switch value={medical.organDonor} onValueChange={(v) => setMedical(prev => ({ ...prev, organDonor: v }))} trackColor={{ true: t.accent.green }} />
        </View>

        <View style={{ marginTop: 12 }}>
          <Text style={s.medicalLabel}>Emergency Notes</Text>
          <TextInput
            style={[s.input, { minHeight: 80, textAlignVertical: 'top', marginTop: 6 }]}
            value={medical.emergencyNotes}
            onChangeText={(v) => setMedical(prev => ({ ...prev, emergencyNotes: v }))}
            placeholder="Additional info for first responders..."
            placeholderTextColor={t.text.muted}
            multiline
          />
        </View>
      </View>
    </>
  );

  const renderSettings = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'\u2699\u{FE0F}'}</Text>
        <Text style={s.heroTitle}>Auto-Notify Settings</Text>
        <Text style={s.heroSubtitle}>
          Configure who gets alerted and what information they receive in an emergency.
        </Text>
      </View>

      <Text style={s.section}>{'\u{1F514}'} Notification Settings</Text>
      <View style={s.card}>
        <View style={s.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.settingLabel}>Auto-Notify on SOS</Text>
            <Text style={s.settingDesc}>Alert all enabled contacts when SOS is triggered</Text>
          </View>
          <Switch value={autoNotifyEnabled} onValueChange={setAutoNotifyEnabled} trackColor={{ true: t.accent.blue }} />
        </View>

        <View style={s.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.settingLabel}>Share Location</Text>
            <Text style={s.settingDesc}>Include GPS coordinates in emergency alert</Text>
          </View>
          <Switch value={shareLocationOnSOS} onValueChange={setShareLocationOnSOS} trackColor={{ true: t.accent.blue }} />
        </View>

        <View style={[s.settingRow, { borderBottomWidth: 0 }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.settingLabel}>Share Medical Info</Text>
            <Text style={s.settingDesc}>Include ICE card data with emergency contacts who have medical access</Text>
          </View>
          <Switch value={shareMedicalOnSOS} onValueChange={setShareMedicalOnSOS} trackColor={{ true: t.accent.blue }} />
        </View>
      </View>

      <Text style={s.section}>{'\u{1F4AC}'} Per-Contact Permissions</Text>
      {contacts.map((contact) => (
        <View key={contact.id} style={s.card}>
          <Text style={s.contactName}>{contact.name}</Text>
          <Text style={s.contactDetail}>{contact.relationship} — Priority #{contact.priority}</Text>
          <View style={s.settingRow}>
            <Text style={s.settingLabel}>Notify on Emergency</Text>
            <Switch
              value={contact.notifyOnEmergency}
              onValueChange={(v) => setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, notifyOnEmergency: v } : c))}
              trackColor={{ true: t.accent.blue }}
            />
          </View>
          <View style={s.settingRow}>
            <Text style={s.settingLabel}>Can See Location</Text>
            <Switch
              value={contact.canSeeLocation}
              onValueChange={(v) => setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, canSeeLocation: v } : c))}
              trackColor={{ true: t.accent.blue }}
            />
          </View>
          <View style={[s.settingRow, { borderBottomWidth: 0 }]}>
            <Text style={s.settingLabel}>Can See Medical</Text>
            <Switch
              value={contact.canSeeMedical}
              onValueChange={(v) => setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, canSeeMedical: v } : c))}
              trackColor={{ true: t.accent.blue }}
            />
          </View>
        </View>
      ))}

      <Text style={s.section}>{'\u{1F4E9}'} SOS Message Template</Text>
      <View style={s.templateCard}>
        <Text style={s.inputLabel}>Emergency Message</Text>
        <TextInput
          style={s.templateInput}
          value={sosTemplate}
          onChangeText={setSosTemplate}
          placeholder="Your emergency message..."
          placeholderTextColor={t.text.muted}
          multiline
        />
        <TouchableOpacity style={[s.smallBtn, { marginTop: 10 }]} onPress={() => setSosTemplate(DEFAULT_SOS_TEMPLATE)}>
          <Text style={s.smallBtnText}>Reset to Default</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderShare = () => (
    <>
      <View style={s.shareCard}>
        <Text style={s.heroIcon}>{'\u{1F4F2}'}</Text>
        <Text style={s.shareTitle}>ICE QR Code</Text>
        <Text style={s.shareSubtitle}>
          Generate a QR code for your lock screen so first responders can access your emergency information.
        </Text>

        <View style={s.qrPlaceholder}>
          <Text style={{ fontSize: 64 }}>{'\u{1F6A8}'}</Text>
          <Text style={s.qrText}>ICE QR Code{'\n'}(Tap to generate)</Text>
        </View>

        <Text style={[s.shareSubtitle, { marginTop: 8 }]}>
          Contains: Blood type, allergies, conditions, emergency contact phones, and organ donor status.
        </Text>

        <TouchableOpacity style={s.shareBtn} onPress={() => Alert.alert('Generate QR', 'ICE QR code generated. Save to your lock screen wallpaper for instant access by first responders.')}>
          <Text style={s.shareBtnText}>{'\u{1F4F1}'} Generate ICE QR</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.lockScreenBtn} onPress={() => Alert.alert('Lock Screen', 'QR code saved. Set as your lock screen widget for emergency access.')}>
          <Text style={s.lockScreenBtnText}>{'\u{1F512}'} Add to Lock Screen</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.section}>{'\u{1F4CB}'} ICE Card Preview</Text>
      <View style={s.card}>
        <View style={{ alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border }}>
          <Text style={{ color: t.accent.red, fontSize: 18, fontWeight: '900', letterSpacing: 2 }}>{'\u{1F6A8}'} ICE CARD {'\u{1F6A8}'}</Text>
        </View>

        <View style={s.medicalRow}>
          <Text style={s.medicalLabel}>Blood Type</Text>
          <Text style={s.medicalValue}>{medical.bloodType || '--'}</Text>
        </View>

        {medical.allergies.length > 0 && (
          <View style={s.medicalRow}>
            <View>
              <Text style={s.medicalLabel}>Allergies</Text>
              <View style={s.tagRow}>
                {medical.allergies.map((a, i) => (
                  <View key={i} style={s.tag}><Text style={s.tagText}>{a}</Text></View>
                ))}
              </View>
            </View>
          </View>
        )}

        {medical.conditions.length > 0 && (
          <View style={s.medicalRow}>
            <View>
              <Text style={s.medicalLabel}>Conditions</Text>
              <View style={s.tagRow}>
                {medical.conditions.map((c, i) => (
                  <View key={i} style={s.conditionTag}><Text style={s.conditionTagText}>{c}</Text></View>
                ))}
              </View>
            </View>
          </View>
        )}

        {medical.medications.length > 0 && (
          <View style={s.medicalRow}>
            <View>
              <Text style={s.medicalLabel}>Medications</Text>
              <View style={s.tagRow}>
                {medical.medications.map((m, i) => (
                  <View key={i} style={s.medTag}><Text style={s.medTagText}>{m}</Text></View>
                ))}
              </View>
            </View>
          </View>
        )}

        {medical.organDonor && (
          <View style={s.donorBadge}>
            <Text style={s.donorBadgeText}>{'\u2764\u{FE0F}'} Organ Donor</Text>
          </View>
        )}

        <Text style={[s.section, { marginLeft: 0, marginTop: 16 }]}>Emergency Contacts</Text>
        {contacts.filter(c => c.notifyOnEmergency).map((c) => (
          <View key={c.id} style={{ paddingVertical: 6 }}>
            <Text style={s.contactName}>{c.name} ({c.relationship})</Text>
            <Text style={s.contactPhone}>{c.phone}</Text>
          </View>
        ))}

        {medical.emergencyNotes ? (
          <View style={{ marginTop: 12, backgroundColor: t.accent.orange + '10', borderRadius: 10, padding: 12 }}>
            <Text style={[s.medicalLabel, { color: t.accent.orange }]}>Notes</Text>
            <Text style={[s.contactDetail, { color: t.text.primary, marginTop: 4 }]}>{medical.emergencyNotes}</Text>
          </View>
        ) : null}
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>{'\u{1F6A8}'} Emergency</Text>
        {demoMode && (
          <View style={s.iceBadge}>
            <Text style={s.iceBadgeText}>DEMO</Text>
          </View>
        )}
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Done</Text>
        </TouchableOpacity>
      </View>

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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {activeTab === 'contacts' && renderContacts()}
        {activeTab === 'medical' && renderMedical()}
        {activeTab === 'settings' && renderSettings()}
        {activeTab === 'share' && renderShare()}
      </ScrollView>
    </SafeAreaView>
  );
}
