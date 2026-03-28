/**
 * Messages Screen — P2P encrypted messaging between Universal IDs.
 *
 * Messages are stored on Open Chain as memo fields in micro-OTK transfers
 * (0.000001 OTK), encrypted with the recipient's public key for end-to-end
 * encryption. Each conversation is identified by the recipient's UID/address.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput, Alert, FlatList,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// --- Types ---

interface Message {
  id: string;
  from: string;
  to: string;
  text: string;
  timestamp: number;
  encrypted: boolean;
  txHash?: string;
}

interface Conversation {
  peerId: string;
  peerName?: string;
  lastMessage: string;
  lastTimestamp: number;
  unread: number;
  messages: Message[];
}

// --- Demo data ---

const now = Date.now();

const DEMO_CONVERSATIONS: Conversation[] = [
  {
    peerId: 'uid-alice-7f3a',
    peerName: 'Alice',
    lastMessage: 'Thanks for the OTK! Really appreciate the support.',
    lastTimestamp: now - 1000 * 60 * 12,
    unread: 1,
    messages: [
      { id: 'm1', from: 'uid-self', to: 'uid-alice-7f3a', text: 'Hey Alice, sending some gratitude OTK your way for the mentoring sessions.', timestamp: now - 1000 * 60 * 60, encrypted: true, txHash: '0xabc1...' },
      { id: 'm2', from: 'uid-alice-7f3a', to: 'uid-self', text: 'Thanks for the OTK! Really appreciate the support.', timestamp: now - 1000 * 60 * 12, encrypted: true, txHash: '0xabc2...' },
    ],
  },
  {
    peerId: 'uid-bob-2e9c',
    peerName: 'Bob (Verifier)',
    lastMessage: 'Your milestone has been verified. Congratulations!',
    lastTimestamp: now - 1000 * 60 * 60 * 3,
    unread: 0,
    messages: [
      { id: 'm3', from: 'uid-self', to: 'uid-bob-2e9c', text: 'Hi Bob, I submitted my education milestone for verification. Could you take a look?', timestamp: now - 1000 * 60 * 60 * 5, encrypted: true, txHash: '0xdef1...' },
      { id: 'm4', from: 'uid-bob-2e9c', to: 'uid-self', text: 'Sure, I will review it today.', timestamp: now - 1000 * 60 * 60 * 4, encrypted: true, txHash: '0xdef2...' },
      { id: 'm5', from: 'uid-bob-2e9c', to: 'uid-self', text: 'Your milestone has been verified. Congratulations!', timestamp: now - 1000 * 60 * 60 * 3, encrypted: true, txHash: '0xdef3...' },
    ],
  },
  {
    peerId: 'uid-carol-8b1d',
    peerName: 'Carol',
    lastMessage: 'The governance proposal passed! 87% approval.',
    lastTimestamp: now - 1000 * 60 * 60 * 24,
    unread: 0,
    messages: [
      { id: 'm6', from: 'uid-carol-8b1d', to: 'uid-self', text: 'Have you voted on proposal #42 yet?', timestamp: now - 1000 * 60 * 60 * 26, encrypted: true, txHash: '0xghi1...' },
      { id: 'm7', from: 'uid-self', to: 'uid-carol-8b1d', text: 'Yes, I voted in favor. The education fund expansion is important.', timestamp: now - 1000 * 60 * 60 * 25, encrypted: true, txHash: '0xghi2...' },
      { id: 'm8', from: 'uid-carol-8b1d', to: 'uid-self', text: 'The governance proposal passed! 87% approval.', timestamp: now - 1000 * 60 * 60 * 24, encrypted: true, txHash: '0xghi3...' },
    ],
  },
  {
    peerId: 'uid-dave-4f5e',
    peerName: 'Dave',
    lastMessage: 'Welcome to Open Chain! Let me know if you need help.',
    lastTimestamp: now - 1000 * 60 * 60 * 72,
    unread: 0,
    messages: [
      { id: 'm9', from: 'uid-dave-4f5e', to: 'uid-self', text: 'Welcome to Open Chain! Let me know if you need help.', timestamp: now - 1000 * 60 * 60 * 72, encrypted: true, txHash: '0xjkl1...' },
    ],
  },
];

const MAX_MESSAGE_LENGTH = 256;

// --- Helpers ---

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 1000 * 60) return 'Just now';
  if (diff < 1000 * 60 * 60) return `${Math.floor(diff / (1000 * 60))}m ago`;
  if (diff < 1000 * 60 * 60 * 24) return `${Math.floor(diff / (1000 * 60 * 60))}h ago`;
  return `${Math.floor(diff / (1000 * 60 * 60 * 24))}d ago`;
}

function truncateAddress(addr: string): string {
  if (addr.length <= 16) return addr;
  return addr.slice(0, 10) + '...' + addr.slice(-6);
}

// --- Component ---

interface Props {
  onClose: () => void;
}

type ViewMode = 'list' | 'thread' | 'compose';

export function MessagesScreen({ onClose }: Props) {
  const t = useTheme();
  const demoMode = useWalletStore((s) => s.demoMode);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>(DEMO_CONVERSATIONS);
  const [composeRecipient, setComposeRecipient] = useState('');
  const [composeText, setComposeText] = useState('');
  const [replyText, setReplyText] = useState('');

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    headerTitle: { color: t.text.primary, fontSize: 20, fontWeight: '700' },
    closeText: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 20, marginBottom: 8, marginLeft: 4 },
    demoTag: { backgroundColor: t.accent.purple + '30', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, alignSelf: 'center', marginBottom: 12 },
    demoTagText: { color: t.accent.purple, fontSize: 11, fontWeight: '700' },
    card: { backgroundColor: t.bg.card, borderRadius: 16, overflow: 'hidden' },
    convRow: { flexDirection: 'row', padding: 16, alignItems: 'center' },
    convAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: t.accent.blue + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    convAvatarText: { color: t.accent.blue, fontSize: 18, fontWeight: '700' },
    convInfo: { flex: 1 },
    convNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    convName: { color: t.text.primary, fontSize: 15, fontWeight: '600' },
    convTime: { color: t.text.muted, fontSize: 11 },
    convLastMsg: { color: t.text.secondary, fontSize: 13 },
    convUnread: { backgroundColor: t.accent.green, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 8, paddingHorizontal: 6 },
    convUnreadText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    divider: { height: 1, backgroundColor: t.border, marginLeft: 72 },
    composeBtn: { backgroundColor: t.accent.green, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
    composeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    // Thread
    bubbleRow: { marginBottom: 12 },
    bubbleSelf: { alignSelf: 'flex-end', backgroundColor: t.accent.blue + '20', borderRadius: 16, borderBottomRightRadius: 4, padding: 12, maxWidth: '80%' as any },
    bubbleOther: { alignSelf: 'flex-start', backgroundColor: t.bg.card, borderRadius: 16, borderBottomLeftRadius: 4, padding: 12, maxWidth: '80%' as any },
    bubbleText: { color: t.text.primary, fontSize: 14, lineHeight: 20 },
    bubbleMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, gap: 8 },
    bubbleTime: { color: t.text.muted, fontSize: 10 },
    bubbleTx: { color: t.accent.blue, fontSize: 10 },
    // Compose / Reply
    inputCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginTop: 12 },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15 },
    charCount: { color: t.text.muted, fontSize: 11, textAlign: 'right', marginTop: 4 },
    replyBar: { flexDirection: 'row', backgroundColor: t.bg.card, borderRadius: 16, padding: 8, marginTop: 12, alignItems: 'center', gap: 8 },
    replyInput: { flex: 1, backgroundColor: t.bg.primary, borderRadius: 12, padding: 12, color: t.text.primary, fontSize: 14, maxHeight: 80 },
    sendMsgBtn: { backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16 },
    sendMsgBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    encryptionNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, gap: 4 },
    encryptionText: { color: t.text.muted, fontSize: 11 },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40 },
    costNote: { color: t.text.muted, fontSize: 11, textAlign: 'center', marginTop: 8 },
  }), [t]);

  const openThread = useCallback((conv: Conversation) => {
    setActiveConversation(conv);
    setViewMode('thread');
  }, []);

  const handleSendMessage = useCallback((recipient: string, text: string) => {
    if (!recipient.trim() || !text.trim()) {
      Alert.alert('Missing Info', 'Please enter a recipient and message.');
      return;
    }
    if (text.length > MAX_MESSAGE_LENGTH) {
      Alert.alert('Too Long', `Messages are limited to ${MAX_MESSAGE_LENGTH} characters.`);
      return;
    }

    const newMsg: Message = {
      id: `m_${Date.now()}`,
      from: 'uid-self',
      to: recipient.trim(),
      text: text.trim(),
      timestamp: Date.now(),
      encrypted: true,
      txHash: `0x${Math.random().toString(16).slice(2, 10)}...`,
    };

    // Find or create conversation
    const existing = conversations.find(c => c.peerId === recipient.trim());
    if (existing) {
      const updated = conversations.map(c => {
        if (c.peerId === recipient.trim()) {
          return {
            ...c,
            lastMessage: text.trim(),
            lastTimestamp: Date.now(),
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      });
      setConversations(updated);
      const updatedConv = updated.find(c => c.peerId === recipient.trim()) || null;
      setActiveConversation(updatedConv);
    } else {
      const newConv: Conversation = {
        peerId: recipient.trim(),
        lastMessage: text.trim(),
        lastTimestamp: Date.now(),
        unread: 0,
        messages: [newMsg],
      };
      setConversations([newConv, ...conversations]);
      setActiveConversation(newConv);
    }

    if (demoMode) {
      Alert.alert('Message Sent (Demo)', `Encrypted message delivered via micro-OTK transfer (0.000001 OTK).\n\nTx: ${newMsg.txHash}`);
    }

    setComposeText('');
    setComposeRecipient('');
    setReplyText('');
    if (viewMode === 'compose') setViewMode('thread');
  }, [conversations, demoMode, viewMode]);

  // --- Thread View ---
  if (viewMode === 'thread' && activeConversation) {
    return (
      <SafeAreaView style={st.container}>
        <View style={st.header}>
          <TouchableOpacity onPress={() => { setViewMode('list'); setActiveConversation(null); }}>
            <Text style={st.closeText}>Back</Text>
          </TouchableOpacity>
          <Text style={st.headerTitle} numberOfLines={1}>
            {activeConversation.peerName || truncateAddress(activeConversation.peerId)}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={st.scroll}>
          <View style={st.encryptionNote}>
            <Text style={{ fontSize: 12 }}>{'\u{1F512}'}</Text>
            <Text style={st.encryptionText}>End-to-end encrypted via recipient public key</Text>
          </View>

          <View style={{ marginTop: 16 }}>
            {activeConversation.messages.map((msg) => {
              const isSelf = msg.from === 'uid-self';
              return (
                <View key={msg.id} style={st.bubbleRow}>
                  <View style={isSelf ? st.bubbleSelf : st.bubbleOther}>
                    <Text style={st.bubbleText}>{msg.text}</Text>
                    <View style={st.bubbleMeta}>
                      <Text style={st.bubbleTime}>{formatTime(msg.timestamp)}</Text>
                      {msg.txHash && <Text style={st.bubbleTx}>Tx: {msg.txHash}</Text>}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <View style={st.replyBar}>
            <TextInput
              style={st.replyInput}
              placeholder="Type a message..."
              placeholderTextColor={t.text.muted}
              value={replyText}
              onChangeText={(txt) => setReplyText(txt.slice(0, MAX_MESSAGE_LENGTH))}
              multiline
            />
            <TouchableOpacity
              style={st.sendMsgBtn}
              onPress={() => handleSendMessage(activeConversation.peerId, replyText)}
            >
              <Text style={st.sendMsgBtnText}>Send</Text>
            </TouchableOpacity>
          </View>
          <Text style={st.charCount}>{replyText.length}/{MAX_MESSAGE_LENGTH}</Text>
          <Text style={st.costNote}>Each message costs 0.000001 OTK (memo in micro-transfer)</Text>
        </View>
      </SafeAreaView>
    );
  }

  // --- Compose View ---
  if (viewMode === 'compose') {
    return (
      <SafeAreaView style={st.container}>
        <View style={st.header}>
          <TouchableOpacity onPress={() => setViewMode('list')}>
            <Text style={st.closeText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={st.headerTitle}>New Message</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView contentContainerStyle={st.scroll}>
          <View style={st.encryptionNote}>
            <Text style={{ fontSize: 12 }}>{'\u{1F512}'}</Text>
            <Text style={st.encryptionText}>Messages are encrypted with recipient's public key</Text>
          </View>

          <View style={st.inputCard}>
            <Text style={st.inputLabel}>Recipient (Universal ID or Address)</Text>
            <TextInput
              style={st.input}
              placeholder="uid-... or openchain1..."
              placeholderTextColor={t.text.muted}
              value={composeRecipient}
              onChangeText={setComposeRecipient}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={st.inputCard}>
            <Text style={st.inputLabel}>Message</Text>
            <TextInput
              style={[st.input, { minHeight: 100, textAlignVertical: 'top' }]}
              placeholder="Type your message..."
              placeholderTextColor={t.text.muted}
              value={composeText}
              onChangeText={(txt) => setComposeText(txt.slice(0, MAX_MESSAGE_LENGTH))}
              multiline
              numberOfLines={4}
            />
            <Text style={st.charCount}>{composeText.length}/{MAX_MESSAGE_LENGTH}</Text>
          </View>

          <TouchableOpacity
            style={st.composeBtn}
            onPress={() => handleSendMessage(composeRecipient, composeText)}
          >
            <Text style={st.composeBtnText}>Send Encrypted Message</Text>
          </TouchableOpacity>

          <Text style={st.costNote}>
            Messages are sent as memo fields in 0.000001 OTK micro-transfers on Open Chain.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- Conversation List View ---
  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.headerTitle}>Messages</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll}>
        <View style={st.demoTag}>
          <Text style={st.demoTagText}>DEMO MODE</Text>
        </View>

        <View style={st.encryptionNote}>
          <Text style={{ fontSize: 12 }}>{'\u{1F512}'}</Text>
          <Text style={st.encryptionText}>All messages are end-to-end encrypted on Open Chain</Text>
        </View>

        <TouchableOpacity style={st.composeBtn} onPress={() => setViewMode('compose')}>
          <Text style={st.composeBtnText}>New Message</Text>
        </TouchableOpacity>

        <Text style={st.section}>Conversations</Text>

        {conversations.length === 0 ? (
          <Text style={st.emptyText}>No conversations yet. Send a message to get started.</Text>
        ) : (
          <View style={st.card}>
            {conversations.map((conv, idx) => (
              <React.Fragment key={conv.peerId}>
                <TouchableOpacity style={st.convRow} onPress={() => openThread(conv)}>
                  <View style={st.convAvatar}>
                    <Text style={st.convAvatarText}>
                      {(conv.peerName || conv.peerId).charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={st.convInfo}>
                    <View style={st.convNameRow}>
                      <Text style={st.convName} numberOfLines={1}>
                        {conv.peerName || truncateAddress(conv.peerId)}
                      </Text>
                      <Text style={st.convTime}>{formatTime(conv.lastTimestamp)}</Text>
                    </View>
                    <Text style={st.convLastMsg} numberOfLines={1}>{conv.lastMessage}</Text>
                  </View>
                  {conv.unread > 0 && (
                    <View style={st.convUnread}>
                      <Text style={st.convUnreadText}>{conv.unread}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {idx < conversations.length - 1 && <View style={st.divider} />}
              </React.Fragment>
            ))}
          </View>
        )}

        <Text style={st.costNote}>
          Each message is a micro-OTK transfer (0.000001 OTK) with an encrypted memo on Open Chain.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
