import { fonts } from '../utils/theme';
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
import { useWalletStore } from '../store/walletStore';
import { ConfirmTransactionScreen } from './ConfirmTransactionScreen';
import { checkRealTransactionAllowed, recordPaperTrade, getTrafficLightColor, getTrafficLightEmoji, type TrafficLight } from '../core/paperTrading';
import { isTestnet } from '../core/network';

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
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPaperMode, setIsPaperMode] = useState(false);
  const [paperLight, setPaperLight] = useState<TrafficLight>('red');
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    heroCard: { backgroundColor: t.accent.purple + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    section: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 24 },
    typeRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, flexWrap: 'wrap', marginBottom: 8 },
    typeChip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: t.bg.card, alignItems: 'center', minWidth: 80 },
    typeChipActive: { backgroundColor: t.accent.purple },
    typeIcon: { fontSize: fonts.xxl, marginBottom: 4 },
    typeLabel: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    typeLabelActive: { color: '#fff' },
    channelRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, flexWrap: 'wrap' },
    channelChip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: t.bg.card, flexDirection: 'row', alignItems: 'center', gap: 6 },
    channelChipActive: { backgroundColor: t.accent.purple },
    channelLabel: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    channelLabelActive: { color: '#fff' },
    inputCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 12 },
    inputLabel: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md },
    messageInput: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md, minHeight: 100, textAlignVertical: 'top' },
    sendBtn: { backgroundColor: t.accent.purple, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginHorizontal: 20, marginTop: 24 },
    sendBtnText: { color: '#fff', fontSize: fonts.lg, fontWeight: fonts.bold },
    paperBtn: { backgroundColor: t.bg.card, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginHorizontal: 20, marginTop: 12 },
    paperBtnText: { color: t.accent.purple, fontSize: fonts.lg, fontWeight: fonts.bold },
    note: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginHorizontal: 24, marginTop: 16, lineHeight: 18 },
  }), [t]);

  const handleSend = useCallback(async (paperMode: boolean) => {
    if (!recipientAddress.trim()) {
      Alert.alert('Recipient Required', 'Enter the Universal ID or address of the person you want to thank.');
      return;
    }
    if (!amount.trim() || parseFloat(amount) <= 0) {
      Alert.alert('Amount Required', 'Enter the amount of OTK to send as gratitude.');
      return;
    }

    setIsPaperMode(paperMode);

    // Check paper trading status for real sends (unless already in paper mode)
    if (!paperMode && !isTestnet()) {
      const check = await checkRealTransactionAllowed('gratitude-openchain');

      if (!check.allowed) {
        Alert.alert(
          `${getTrafficLightEmoji(check.light)} Paper Trade Required`,
          check.message,
          [
            { text: 'Do Paper Trade', onPress: () => handleSend(true) },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        return;
      }

      if (check.light === 'orange') {
        setPaperLight('orange');
      }
    }

    setShowConfirm(true);
  }, [recipientAddress, amount]);

  const executeGratitude = useCallback(async (vaultPassword?: string) => {
    try {
      setSending(true);
      const selectedChannel = CHANNEL_OPTIONS.find(c => c.key === channel);
      const gratitudeMessage = message || 'Thank you.';

      // Paper trade mode — simulate without real transaction
      if (isPaperMode) {
        await new Promise((r) => setTimeout(r, 1500));
        const status = await recordPaperTrade('gratitude-openchain');
        Alert.alert(
          `${getTrafficLightEmoji(status.light)} Paper Gratitude Complete`,
          `${amount} ${selectedChannel?.label ?? ''} OTK sent (simulated).\n\n"${gratitudeMessage}"\n\nPaper trades completed: ${status.count}/3 recommended.\n\n${status.light === 'green' ? 'You are now cleared for real gratitude transactions!' : status.light === 'orange' ? 'You can now send real gratitude, but we recommend more practice.' : 'Complete at least 1 more paper trade to unlock real transactions.'}`,
        );
        setAmount('');
        setRecipientAddress('');
        setMessage('');
        setShowConfirm(false);
        setIsPaperMode(false);
        return;
      }

      // Demo mode — simulate success
      const demoMode = useWalletStore.getState().demoMode;
      if (demoMode) {
        await new Promise((r) => setTimeout(r, 1500));
        Alert.alert(
          'Gratitude Sent (Demo)',
          `${amount} ${selectedChannel?.label ?? ''} OTK sent with love.\n\n"${gratitudeMessage}"\n\nThis is a demo transaction — no real funds were moved.`,
          [{ text: 'Close', onPress: onClose }]
        );
        setShowConfirm(false);
        return;
      }

      // Real transaction — unlock vault, sign, broadcast
      const store = useWalletStore.getState();
      const password = vaultPassword ?? store.tempVaultPassword;
      if (!password) throw new Error('Wallet not unlocked. Please sign in again.');

      // 1. Unlock vault -> get mnemonic
      const { Vault } = await import('../core/vault/vault');
      const vault = new Vault();
      const contents = await vault.unlock(password);
      const mnemonic = contents.mnemonic;

      // 2. Restore HD wallet
      const { HDWallet } = await import('../core/wallet/hdwallet');
      const wallet = HDWallet.fromMnemonic(mnemonic);

      // 3. Sign & broadcast via CosmosSigner (openchain)
      const { CosmosSigner } = await import('../core/chains/cosmos-signer');
      const signer = CosmosSigner.fromWallet(wallet, store.activeAccountIndex, 'openchain');
      const txHash = await signer.sendTokens(recipientAddress.trim(), amount.trim());

      // 4. Clean up private key material
      wallet.destroy();

      // 5. Show success with gratitude message
      Alert.alert(
        'Gratitude Sent',
        `${amount} ${selectedChannel?.label ?? ''} OTK sent with love.\n\n"${gratitudeMessage}"\n\nThis gratitude transaction is now visible on Open Chain — a permanent record of your appreciation.\n\nTx: ${txHash.slice(0, 16)}...${txHash.slice(-8)}`,
        [{ text: 'Close', onPress: onClose }]
      );
      setAmount('');
      setRecipientAddress('');
      setMessage('');
      setShowConfirm(false);
    } catch (err) {
      let msg = err instanceof Error ? err.message : 'Transaction failed';
      if (msg.includes('insufficient funds') || msg.includes('Insufficient')) {
        msg = 'Not enough OTK to cover this gratitude transaction and gas fees.';
      } else if (msg.includes('timed out') || msg.includes('timeout') || msg.includes('too long')) {
        msg = 'Network request timed out. Please check your connection and try again.';
      }
      Alert.alert('Gratitude Send Failed', msg);
      throw err; // Re-throw so ConfirmTransactionScreen resets to review
    } finally {
      setSending(false);
    }
  }, [recipientAddress, amount, message, channel, isPaperMode, onClose]);

  // Show confirm/auth screen
  if (showConfirm) {
    return (
      <ConfirmTransactionScreen
        tx={{
          type: 'send',
          fromSymbol: 'OTK',
          fromAmount: amount,
          recipient: recipientAddress,
        }}
        onConfirm={executeGratitude}
        onCancel={() => setShowConfirm(false)}
      />
    );
  }

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

        {/* Paper Trade button */}
        <TouchableOpacity style={s.paperBtn} onPress={() => handleSend(true)}>
          <Text style={s.paperBtnText}>Paper Trade (Practice)</Text>
        </TouchableOpacity>

        {/* Real Send button */}
        <TouchableOpacity style={s.sendBtn} onPress={() => handleSend(false)} disabled={sending}>
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.sendBtnText}>Send Gratitude (Real)</Text>
          )}
        </TouchableOpacity>

        {paperLight === 'orange' && (
          <Text style={{ color: t.accent.orange, fontSize: fonts.sm, textAlign: 'center', marginTop: 8, marginHorizontal: 20 }}>
            You have less than 3 paper trades. We recommend more practice before real gratitude transactions.
          </Text>
        )}

        <Text style={s.note}>
          Gratitude transactions carry special significance on Open Chain. They are marked, visible, and celebrated — a permanent record of the love and support you received.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
