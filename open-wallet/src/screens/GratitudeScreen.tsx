/**
 * Gratitude Screen — Send gratitude OTK to those who shaped you.
 *
 * "A grown child sending nOTK to their parent's Universal ID is a
 *  Gratitude Transaction — a formal recognition of the value received
 *  during upbringing."
 * — Human Constitution, Article III, Section 4
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface Props {
  onClose: () => void;
}

const CHANNEL_OPTIONS = [
  { key: 'notk', label: 'Nurture', icon: '\u{1F49B}', desc: 'For parents and caregivers' },
  { key: 'eotk', label: 'Education', icon: '\u{1F4DA}', desc: 'For teachers and mentors' },
  { key: 'cotk', label: 'Community', icon: '\u{1F91D}', desc: 'For community members' },
  { key: 'hotk', label: 'Health', icon: '\u{1FA7A}', desc: 'For healthcare providers' },
];

const RECIPIENT_TYPES = [
  { key: 'parent', label: 'Parent', icon: '\u{1F9D1}\u{200D}\u{1F37C}' },
  { key: 'teacher', label: 'Teacher', icon: '\u{1F9D1}\u{200D}\u{1F3EB}' },
  { key: 'mentor', label: 'Mentor', icon: '\u{1F31F}' },
  { key: 'community', label: 'Community', icon: '\u{1F3D8}' },
  { key: 'other', label: 'Other', icon: '\u{1F49C}' },
];

export function GratitudeScreen({ onClose }: Props) {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [recipientType, setRecipientType] = useState('parent');
  const [channel, setChannel] = useState('notk');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    heroCard: { backgroundColor: t.accent.purple + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: '800', textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 24 },
    typeRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, flexWrap: 'wrap', marginBottom: 8 },
    typeChip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: t.bg.card, alignItems: 'center', minWidth: 80 },
    typeChipActive: { backgroundColor: t.accent.purple },
    typeIcon: { fontSize: 24, marginBottom: 4 },
    typeLabel: { color: t.text.secondary, fontSize: 12, fontWeight: '600' },
    typeLabelActive: { color: '#fff' },
    channelRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, flexWrap: 'wrap' },
    channelChip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: t.bg.card, flexDirection: 'row', alignItems: 'center', gap: 6 },
    channelChipActive: { backgroundColor: t.accent.purple },
    channelLabel: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
    channelLabelActive: { color: '#fff' },
    inputCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 12 },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15 },
    messageInput: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, minHeight: 100, textAlignVertical: 'top' },
    sendBtn: { backgroundColor: t.accent.purple, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginHorizontal: 20, marginTop: 24 },
    sendBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    note: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginHorizontal: 24, marginTop: 16, lineHeight: 18 },
  }), [t]);

  const handleSend = useCallback(async () => {
    if (!recipientAddress.trim()) {
      Alert.alert('Recipient Required', 'Enter the Universal ID or address of the person you want to thank.');
      return;
    }
    if (!amount.trim() || parseFloat(amount) <= 0) {
      Alert.alert('Amount Required', 'Enter the amount of OTK to send as gratitude.');
      return;
    }

    setSending(true);

    // Simulate gratitude transaction
    setTimeout(() => {
      setSending(false);
      const selectedChannel = CHANNEL_OPTIONS.find(c => c.key === channel);
      Alert.alert(
        'Gratitude Sent',
        `${amount} ${selectedChannel?.label ?? ''} OTK sent with love.\n\n"${message || 'Thank you.'}"\n\nThis gratitude transaction is now visible on Open Chain — a permanent record of your appreciation.`,
        [{ text: 'Close', onPress: onClose }]
      );
    }, 2000);
  }, [recipientAddress, amount, message, channel, onClose]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Send Gratitude</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        <View style={s.heroCard}>
          <Text style={s.heroIcon}>{'\u{1F64F}'}</Text>
          <Text style={s.heroTitle}>Thank Those Who Shaped You</Text>
          <Text style={s.heroSubtitle}>
            Gratitude transactions are celebrated on Open Chain — a permanent, visible record of the value you received from parents, teachers, and mentors.
          </Text>
        </View>

        {/* Recipient Type */}
        <Text style={s.section}>Who Are You Thanking?</Text>
        <View style={s.typeRow}>
          {RECIPIENT_TYPES.map((rt) => (
            <TouchableOpacity
              key={rt.key}
              style={[s.typeChip, recipientType === rt.key && s.typeChipActive]}
              onPress={() => setRecipientType(rt.key)}
            >
              <Text style={s.typeIcon}>{rt.icon}</Text>
              <Text style={[s.typeLabel, recipientType === rt.key && s.typeLabelActive]}>{rt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Channel */}
        <Text style={s.section}>Value Channel</Text>
        <View style={s.channelRow}>
          {CHANNEL_OPTIONS.map((ch) => (
            <TouchableOpacity
              key={ch.key}
              style={[s.channelChip, channel === ch.key && s.channelChipActive]}
              onPress={() => setChannel(ch.key)}
            >
              <Text>{ch.icon}</Text>
              <Text style={[s.channelLabel, channel === ch.key && s.channelLabelActive]}>{ch.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recipient Address */}
        <View style={s.inputCard}>
          <Text style={s.inputLabel}>Recipient (Universal ID or Address)</Text>
          <TextInput
            style={s.input}
            placeholder="uid-... or openchain1..."
            placeholderTextColor={t.text.muted}
            value={recipientAddress}
            onChangeText={setRecipientAddress}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Amount */}
        <View style={s.inputCard}>
          <Text style={s.inputLabel}>Amount (OTK)</Text>
          <TextInput
            style={s.input}
            placeholder="0.00"
            placeholderTextColor={t.text.muted}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Message */}
        <View style={s.inputCard}>
          <Text style={s.inputLabel}>Personal Message (stored on-chain forever)</Text>
          <TextInput
            style={s.messageInput}
            placeholder="Write your gratitude message..."
            placeholderTextColor={t.text.muted}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity style={s.sendBtn} onPress={handleSend} disabled={sending}>
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.sendBtnText}>Send Gratitude</Text>
          )}
        </TouchableOpacity>

        <Text style={s.note}>
          Gratitude transactions carry special significance on Open Chain. They are marked, visible, and celebrated — a permanent record of the love and support you received.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
