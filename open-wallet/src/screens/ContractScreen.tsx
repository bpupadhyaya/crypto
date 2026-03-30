/**
 * Contract Screen — Smart contract interaction for Open Chain.
 *
 * Deploy custom contracts, manage deployed contracts, interact with
 * contract functions, and browse common contract templates.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, FlatList,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// --- Types ---

interface DeployedContract {
  id: string;
  name: string;
  address: string;
  codeHash: string;
  deployedAt: string;
  chain: string;
  status: 'active' | 'paused' | 'terminated';
  functions: ContractFunction[];
}

interface ContractFunction {
  name: string;
  params: string[];
  returns: string;
  mutability: 'view' | 'write';
}

interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  popularity: number;
}

type Tab = 'my-contracts' | 'deploy' | 'interact' | 'templates';

interface Props {
  onClose: () => void;
}

// --- Demo data ---

const DEMO_CONTRACTS: DeployedContract[] = [
  {
    id: 'ct_001',
    name: 'Community Voting',
    address: 'ochain1qz7v...4f9k2',
    codeHash: 'a3b8c1d4e5f6',
    deployedAt: '2026-03-15',
    chain: 'Open Chain',
    status: 'active',
    functions: [
      { name: 'castVote', params: ['proposalId: u64', 'vote: bool'], returns: 'void', mutability: 'write' },
      { name: 'getResults', params: ['proposalId: u64'], returns: 'VoteResult', mutability: 'view' },
      { name: 'createProposal', params: ['title: string', 'description: string'], returns: 'u64', mutability: 'write' },
    ],
  },
  {
    id: 'ct_002',
    name: 'Escrow Service',
    address: 'ochain1xm3p...7h2j8',
    codeHash: 'f7e8d9c0b1a2',
    deployedAt: '2026-03-22',
    chain: 'Open Chain',
    status: 'active',
    functions: [
      { name: 'deposit', params: ['amount: u128'], returns: 'void', mutability: 'write' },
      { name: 'release', params: ['recipient: address'], returns: 'void', mutability: 'write' },
      { name: 'getBalance', params: [], returns: 'u128', mutability: 'view' },
    ],
  },
];

const DEMO_TEMPLATES: ContractTemplate[] = [
  { id: 'tpl_001', name: 'Token Contract', description: 'Create a fungible token with mint, burn, and transfer', category: 'token', icon: '\u{1F4B0}', popularity: 95 },
  { id: 'tpl_002', name: 'Voting DAO', description: 'Decentralized governance with proposal and voting', category: 'voting', icon: '\u{1F5F3}', popularity: 82 },
  { id: 'tpl_003', name: 'Escrow', description: 'Trustless escrow with multi-party release', category: 'escrow', icon: '\u{1F510}', popularity: 78 },
];

// --- Component ---

export function ContractScreen({ onClose }: Props) {
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();
  const [tab, setTab] = useState<Tab>('my-contracts');
  const [selectedContract, setSelectedContract] = useState<DeployedContract | null>(null);
  const [deployName, setDeployName] = useState('');
  const [deployCodeHash, setDeployCodeHash] = useState('');
  const [deployParams, setDeployParams] = useState('');
  const [callResult, setCallResult] = useState<string | null>(null);

  const contracts = demoMode ? DEMO_CONTRACTS : [];
  const templates = demoMode ? DEMO_TEMPLATES : [];

  const tabs: { key: Tab; label: string }[] = [
    { key: 'my-contracts', label: 'My Contracts' },
    { key: 'deploy', label: 'Deploy' },
    { key: 'interact', label: 'Interact' },
    { key: 'templates', label: 'Templates' },
  ];

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    back: { color: t.accent.blue, fontSize: 16, fontWeight: '600' },
    title: { color: t.text.primary, fontSize: 18, fontWeight: '800' },
    placeholder: { width: 50 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12, gap: 6 },
    tabBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: t.bg.card },
    tabBtnActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: '#fff', fontWeight: '700' },
    card: { backgroundColor: t.bg.card, marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 12 },
    contractName: { color: t.text.primary, fontSize: 16, fontWeight: '700' },
    contractAddress: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    contractMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    metaText: { color: t.text.secondary, fontSize: 12 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
    statusText: { fontSize: 11, fontWeight: '700' },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 10 },
    deployBtn: { backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    deployBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', paddingHorizontal: 16, marginBottom: 10, marginTop: 8 },
    funcRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.border },
    funcName: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    funcType: { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    callBtn: { backgroundColor: t.accent.blue, borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 12 },
    callBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    resultBox: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, marginTop: 10 },
    resultText: { color: t.accent.green, fontSize: 13, fontFamily: 'Courier' },
    templateIcon: { fontSize: 28 },
    templateName: { color: t.text.primary, fontSize: 15, fontWeight: '700', marginTop: 6 },
    templateDesc: { color: t.text.secondary, fontSize: 13, marginTop: 4, lineHeight: 18 },
    templatePop: { color: t.text.muted, fontSize: 11, marginTop: 6 },
    useBtn: { backgroundColor: t.accent.blue, borderRadius: 10, paddingVertical: 8, alignItems: 'center', marginTop: 10 },
    useBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    empty: { alignItems: 'center', paddingTop: 60 },
    emptyText: { color: t.text.secondary, fontSize: 16, fontWeight: '600' },
    emptyHint: { color: t.text.muted, fontSize: 13, marginTop: 4 },
    selectHint: { color: t.text.muted, fontSize: 14, textAlign: 'center', paddingTop: 40 },
  }), [t]);

  const handleDeploy = () => {
    if (!deployName.trim() || !deployCodeHash.trim()) {
      Alert.alert('Missing Info', 'Enter contract name and code hash.');
      return;
    }
    Alert.alert('Contract Deployed', `"${deployName}" deployed successfully on Open Chain.`);
    setDeployName('');
    setDeployCodeHash('');
    setDeployParams('');
  };

  const handleCallFunction = (fn: ContractFunction) => {
    if (fn.mutability === 'view') {
      setCallResult(`Result: ${fn.returns === 'u128' ? '15,000 OTK' : fn.returns === 'VoteResult' ? '{ yes: 42, no: 7, abstain: 3 }' : '0x00'}`);
    } else {
      Alert.alert('Transaction Sent', `${fn.name} executed. Tx hash: 0xabc...def`);
      setCallResult(`Tx confirmed in block #1,247,891`);
    }
  };

  const renderMyContracts = () => (
    <FlatList
      data={contracts}
      keyExtractor={(c) => c.id}
      renderItem={({ item }) => (
        <TouchableOpacity style={s.card} onPress={() => { setSelectedContract(item); setTab('interact'); }}>
          <Text style={s.contractName}>{item.name}</Text>
          <Text style={s.contractAddress}>{item.address}</Text>
          <View style={s.contractMeta}>
            <Text style={s.metaText}>Deployed {item.deployedAt}</Text>
            <View style={[s.statusBadge, { backgroundColor: item.status === 'active' ? t.accent.green + '22' : t.accent.red + '22' }]}>
              <Text style={[s.statusText, { color: item.status === 'active' ? t.accent.green : t.accent.red }]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={[s.metaText, { marginTop: 4 }]}>{item.functions.length} functions \u00B7 {item.chain}</Text>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <View style={s.empty}>
          <Text style={s.emptyText}>No deployed contracts</Text>
          <Text style={s.emptyHint}>Deploy your first contract from the Deploy tab</Text>
        </View>
      }
      contentContainerStyle={contracts.length === 0 ? { flex: 1, justifyContent: 'center' } : { paddingTop: 4 }}
    />
  );

  const renderDeploy = () => (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={s.sectionTitle}>Deploy Custom Contract</Text>
      <View style={s.card}>
        <TextInput style={s.input} placeholder="Contract Name" placeholderTextColor={t.text.muted} value={deployName} onChangeText={setDeployName} />
        <TextInput style={s.input} placeholder="Code Hash" placeholderTextColor={t.text.muted} value={deployCodeHash} onChangeText={setDeployCodeHash} autoCapitalize="none" />
        <TextInput style={s.input} placeholder="Constructor Params (JSON)" placeholderTextColor={t.text.muted} value={deployParams} onChangeText={setDeployParams} autoCapitalize="none" multiline />
        <TouchableOpacity style={s.deployBtn} onPress={handleDeploy}>
          <Text style={s.deployBtnText}>Deploy to Open Chain</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderInteract = () => (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {selectedContract ? (
        <>
          <View style={s.card}>
            <Text style={s.contractName}>{selectedContract.name}</Text>
            <Text style={s.contractAddress}>{selectedContract.address}</Text>
          </View>
          <Text style={s.sectionTitle}>Functions</Text>
          <View style={s.card}>
            {selectedContract.functions.map((fn) => (
              <View key={fn.name}>
                <View style={s.funcRow}>
                  <View>
                    <Text style={s.funcName}>{fn.name}</Text>
                    <Text style={s.metaText}>({fn.params.join(', ')}) → {fn.returns}</Text>
                  </View>
                  <Text style={[s.funcType, {
                    backgroundColor: fn.mutability === 'view' ? t.accent.blue + '22' : t.accent.orange + '22',
                    color: fn.mutability === 'view' ? t.accent.blue : t.accent.orange,
                  }]}>
                    {fn.mutability.toUpperCase()}
                  </Text>
                </View>
                <TouchableOpacity style={s.callBtn} onPress={() => handleCallFunction(fn)}>
                  <Text style={s.callBtnText}>{fn.mutability === 'view' ? 'Query' : 'Execute'}</Text>
                </TouchableOpacity>
              </View>
            ))}
            {callResult && (
              <View style={s.resultBox}>
                <Text style={s.resultText}>{callResult}</Text>
              </View>
            )}
          </View>
        </>
      ) : (
        <Text style={s.selectHint}>Select a contract from My Contracts to interact with it</Text>
      )}
    </ScrollView>
  );

  const renderTemplates = () => (
    <FlatList
      data={templates}
      keyExtractor={(tp) => tp.id}
      renderItem={({ item }) => (
        <View style={s.card}>
          <Text style={s.templateIcon}>{item.icon}</Text>
          <Text style={s.templateName}>{item.name}</Text>
          <Text style={s.templateDesc}>{item.description}</Text>
          <Text style={s.templatePop}>{item.popularity}% popularity</Text>
          <TouchableOpacity style={s.useBtn} onPress={() => {
            setDeployName(item.name);
            setTab('deploy');
          }}>
            <Text style={s.useBtnText}>Use Template</Text>
          </TouchableOpacity>
        </View>
      )}
      contentContainerStyle={{ paddingTop: 4 }}
    />
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.back}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Smart Contracts</Text>
        <View style={s.placeholder} />
      </View>

      <View style={s.tabRow}>
        {tabs.map((tb) => (
          <TouchableOpacity
            key={tb.key}
            style={[s.tabBtn, tab === tb.key && s.tabBtnActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'my-contracts' && renderMyContracts()}
      {tab === 'deploy' && renderDeploy()}
      {tab === 'interact' && renderInteract()}
      {tab === 'templates' && renderTemplates()}
    </SafeAreaView>
  );
}
