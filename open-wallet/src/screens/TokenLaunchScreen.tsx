/**
 * Token Launch Pad — Create custom tokens on Open Chain.
 *
 * Users can define token name, symbol, decimals, initial supply, and description.
 * Demo mode simulates creation; real mode constructs MsgCreateDenom transactions.
 * Shows "My Tokens" section for previously created tokens.
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';
import { createToken, getCreatedTokens, type CreatedToken } from '../core/tokens/tokenFactory';

interface Props {
  onClose: () => void;
}

type LaunchView = 'main' | 'create' | 'preview';

export function TokenLaunchScreen({ onClose }: Props) {
  const [view, setView] = useState<LaunchView>('main');
  const [myTokens, setMyTokens] = useState<CreatedToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [decimals, setDecimals] = useState('18');
  const [initialSupply, setInitialSupply] = useState('');
  const [description, setDescription] = useState('');

  const demoMode = useWalletStore((s) => s.demoMode);
  const addresses = useWalletStore((s) => s.addresses);
  const t = useTheme();

  const creatorAddress = addresses?.openchain || addresses?.cosmos || 'open1demo...address';

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginBottom: 16 },
    cardTitle: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 },
    inputGroup: { marginBottom: 16 },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: '600', marginBottom: 6 },
    input: { backgroundColor: t.bg.secondary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, borderWidth: 1, borderColor: t.border },
    inputHint: { color: t.text.muted, fontSize: 11, marginTop: 4 },
    row: { flexDirection: 'row', gap: 12 },
    halfInput: { flex: 1 },
    createBtn: { backgroundColor: t.accent.green, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
    createBtnDisabled: { opacity: 0.5 },
    createBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    previewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.border },
    previewLabel: { color: t.text.muted, fontSize: 14 },
    previewValue: { color: t.text.primary, fontSize: 14, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
    tokenCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    tokenHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    tokenSymbol: { color: t.accent.green, fontSize: 18, fontWeight: '800' },
    tokenName: { color: t.text.primary, fontSize: 15, fontWeight: '600' },
    tokenDetail: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    tokenDenom: { color: t.text.muted, fontSize: 11, marginTop: 6, fontFamily: 'monospace' },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', paddingVertical: 40 },
    badge: { backgroundColor: t.accent.purple + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    badgeText: { color: t.accent.purple, fontSize: 11, fontWeight: '700' },
    economicsCard: { backgroundColor: t.accent.blue + '10', borderRadius: 12, padding: 16, marginTop: 12 },
    economicsTitle: { color: t.accent.blue, fontSize: 13, fontWeight: '700', marginBottom: 8 },
    economicsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    economicsLabel: { color: t.text.muted, fontSize: 12 },
    economicsValue: { color: t.text.primary, fontSize: 12, fontWeight: '600' },
    backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    backText: { color: t.accent.blue, fontSize: 15 },
  }), [t]);

  // Load created tokens
  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = useCallback(async () => {
    setLoading(true);
    try {
      const tokens = await getCreatedTokens(creatorAddress);
      setMyTokens(tokens);
    } catch {
      // Ignore load errors
    } finally {
      setLoading(false);
    }
  }, [creatorAddress]);

  const isFormValid = name.trim().length >= 1 && symbol.trim().length >= 2 && initialSupply.trim().length > 0 && Number(initialSupply) > 0;

  const handlePreview = () => {
    if (!isFormValid) {
      Alert.alert('Incomplete', 'Please fill in all required fields.');
      return;
    }
    setView('preview');
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const result = await createToken(
        {
          name: name.trim(),
          symbol: symbol.trim().toUpperCase(),
          decimals: Number(decimals) || 18,
          initialSupply: Number(initialSupply),
          description: description.trim(),
          creator: creatorAddress,
        },
        '', // mnemonic not used in demo
        0,
      );

      Alert.alert(
        'Token Created!',
        `${symbol.toUpperCase()} has been created.\n\nDenom: ${result.denom}\nTx: ${result.txHash.slice(0, 16)}...`,
        [{ text: 'OK', onPress: () => {
          // Reset form
          setName('');
          setSymbol('');
          setDecimals('18');
          setInitialSupply('');
          setDescription('');
          setView('main');
          loadTokens();
        }}],
      );
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create token');
    } finally {
      setCreating(false);
    }
  };

  const supplyNum = Number(initialSupply) || 0;
  const decNum = Number(decimals) || 18;

  // ─── Preview ───
  if (view === 'preview') {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setView('create')}>
            <Text style={s.closeBtn}>Back</Text>
          </TouchableOpacity>
          <Text style={s.title}>Preview Token</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <View style={s.card}>
            <Text style={s.cardTitle}>Token Details</Text>

            <View style={s.previewRow}>
              <Text style={s.previewLabel}>Name</Text>
              <Text style={s.previewValue}>{name}</Text>
            </View>
            <View style={s.previewRow}>
              <Text style={s.previewLabel}>Symbol</Text>
              <Text style={s.previewValue}>{symbol.toUpperCase()}</Text>
            </View>
            <View style={s.previewRow}>
              <Text style={s.previewLabel}>Decimals</Text>
              <Text style={s.previewValue}>{decimals}</Text>
            </View>
            <View style={s.previewRow}>
              <Text style={s.previewLabel}>Initial Supply</Text>
              <Text style={s.previewValue}>{supplyNum.toLocaleString()}</Text>
            </View>
            <View style={s.previewRow}>
              <Text style={s.previewLabel}>Description</Text>
              <Text style={s.previewValue} numberOfLines={3}>{description || 'None'}</Text>
            </View>
            <View style={[s.previewRow, { borderBottomWidth: 0 }]}>
              <Text style={s.previewLabel}>Creator</Text>
              <Text style={[s.previewValue, { fontSize: 11 }]} numberOfLines={1}>{creatorAddress}</Text>
            </View>
          </View>

          {/* Token Economics Preview */}
          <View style={s.economicsCard}>
            <Text style={s.economicsTitle}>Token Economics</Text>
            <View style={s.economicsRow}>
              <Text style={s.economicsLabel}>Total Supply</Text>
              <Text style={s.economicsValue}>{supplyNum.toLocaleString()} {symbol.toUpperCase()}</Text>
            </View>
            <View style={s.economicsRow}>
              <Text style={s.economicsLabel}>Smallest Unit</Text>
              <Text style={s.economicsValue}>{'1'.padEnd(decNum + 1, '0').replace(/^1/, '0.')} {symbol.toUpperCase()}</Text>
            </View>
            <View style={s.economicsRow}>
              <Text style={s.economicsLabel}>Denom (predicted)</Text>
              <Text style={[s.economicsValue, { fontSize: 10 }]}>factory/{creatorAddress.slice(0, 12)}.../{symbol.toLowerCase()}</Text>
            </View>
            <View style={s.economicsRow}>
              <Text style={s.economicsLabel}>Chain</Text>
              <Text style={s.economicsValue}>Open Chain</Text>
            </View>
            <View style={s.economicsRow}>
              <Text style={s.economicsLabel}>Standard</Text>
              <Text style={s.economicsValue}>Cosmos SDK Token Factory</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[s.createBtn, creating && s.createBtnDisabled]}
            onPress={handleCreate}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.createBtnText}>Create Token</Text>
            )}
          </TouchableOpacity>

          {demoMode && (
            <Text style={{ color: t.text.muted, fontSize: 11, textAlign: 'center', marginTop: 8 }}>
              Demo mode — token creation is simulated locally
            </Text>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Create Form ───
  if (view === 'create') {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setView('main')}>
            <Text style={s.closeBtn}>Back</Text>
          </TouchableOpacity>
          <Text style={s.title}>New Token</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <View style={s.card}>
            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Token Name *</Text>
              <TextInput
                style={s.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g., My Community Token"
                placeholderTextColor={t.text.muted}
                maxLength={64}
              />
              <Text style={s.inputHint}>1-64 characters</Text>
            </View>

            <View style={s.row}>
              <View style={[s.inputGroup, s.halfInput]}>
                <Text style={s.inputLabel}>Symbol *</Text>
                <TextInput
                  style={s.input}
                  value={symbol}
                  onChangeText={(v) => setSymbol(v.toUpperCase())}
                  placeholder="e.g., MCT"
                  placeholderTextColor={t.text.muted}
                  maxLength={12}
                  autoCapitalize="characters"
                />
                <Text style={s.inputHint}>2-12 characters</Text>
              </View>

              <View style={[s.inputGroup, s.halfInput]}>
                <Text style={s.inputLabel}>Decimals</Text>
                <TextInput
                  style={s.input}
                  value={decimals}
                  onChangeText={setDecimals}
                  placeholder="18"
                  placeholderTextColor={t.text.muted}
                  keyboardType="numeric"
                  maxLength={2}
                />
                <Text style={s.inputHint}>0-18</Text>
              </View>
            </View>

            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Initial Supply *</Text>
              <TextInput
                style={s.input}
                value={initialSupply}
                onChangeText={setInitialSupply}
                placeholder="e.g., 1000000"
                placeholderTextColor={t.text.muted}
                keyboardType="numeric"
              />
              <Text style={s.inputHint}>Maximum 1 trillion</Text>
            </View>

            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Description</Text>
              <TextInput
                style={[s.input, { minHeight: 80, textAlignVertical: 'top' }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your token's purpose..."
                placeholderTextColor={t.text.muted}
                multiline
                maxLength={500}
              />
              <Text style={s.inputHint}>{description.length}/500</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[s.createBtn, !isFormValid && s.createBtnDisabled]}
            onPress={handlePreview}
            disabled={!isFormValid}
          >
            <Text style={s.createBtnText}>Preview Token</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Main: My Tokens + Launch Button ───
  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Token Launch Pad</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Launch CTA */}
        <TouchableOpacity
          style={[s.card, { borderWidth: 1, borderColor: t.accent.green + '40', borderStyle: 'dashed' }]}
          onPress={() => setView('create')}
        >
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <Text style={{ color: t.accent.green, fontSize: 32, marginBottom: 8 }}>+</Text>
            <Text style={{ color: t.text.primary, fontSize: 17, fontWeight: '700', marginBottom: 4 }}>Create New Token</Text>
            <Text style={{ color: t.text.muted, fontSize: 13, textAlign: 'center' }}>
              Launch your own token on Open Chain with custom supply, decimals, and metadata
            </Text>
          </View>
        </TouchableOpacity>

        {/* My Tokens */}
        <Text style={s.cardTitle}>My Tokens</Text>

        {loading ? (
          <ActivityIndicator color={t.accent.green} style={{ paddingVertical: 40 }} />
        ) : myTokens.length === 0 ? (
          <Text style={s.emptyText}>No tokens created yet. Tap above to launch your first token!</Text>
        ) : (
          myTokens.map((token, idx) => (
            <View key={`${token.symbol}-${idx}`} style={s.tokenCard}>
              <View style={s.tokenHeader}>
                <View>
                  <Text style={s.tokenSymbol}>{token.symbol}</Text>
                  <Text style={s.tokenName}>{token.name}</Text>
                </View>
                <View style={s.badge}>
                  <Text style={s.badgeText}>Open Chain</Text>
                </View>
              </View>
              {token.description ? (
                <Text style={s.tokenDetail} numberOfLines={2}>{token.description}</Text>
              ) : null}
              <Text style={s.tokenDetail}>
                Supply: {token.initialSupply.toLocaleString()} | Decimals: {token.decimals}
              </Text>
              <Text style={s.tokenDenom} numberOfLines={1}>
                {token.denom}
              </Text>
              <Text style={[s.tokenDetail, { marginTop: 4 }]}>
                Created: {new Date(token.createdAt).toLocaleDateString()}
              </Text>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
