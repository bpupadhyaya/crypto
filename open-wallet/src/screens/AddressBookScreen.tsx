/**
 * Address Book — Save and manage frequent recipient addresses.
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';

export interface Contact {
  id: string;
  name: string;
  address: string;
  chain: string;
}

interface Props {
  onSelect?: (contact: Contact) => void;
  onClose: () => void;
}

export const AddressBookScreen = React.memo(({ onSelect, onClose }: Props) => {
  const contacts = useWalletStore((s) => s.contacts);
  const addContact = useWalletStore((s) => s.addContact);
  const removeContact = useWalletStore((s) => s.removeContact);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [chain, setChain] = useState('ethereum');

  const handleAdd = useCallback(() => {
    if (!name.trim() || !address.trim()) {
      Alert.alert('Missing Info', 'Enter both name and address.');
      return;
    }
    addContact({ id: Date.now().toString(), name: name.trim(), address: address.trim(), chain });
    setName('');
    setAddress('');
    setShowAdd(false);
  }, [name, address, chain, addContact]);

  const handleDelete = useCallback((id: string, contactName: string) => {
    Alert.alert('Delete', `Remove ${contactName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeContact(id) },
    ]);
  }, [removeContact]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Address Book</Text>
        <TouchableOpacity onPress={() => setShowAdd(!showAdd)}>
          <Text style={s.addBtn}>{showAdd ? 'Cancel' : '+ Add'}</Text>
        </TouchableOpacity>
      </View>

      {showAdd && (
        <View style={s.addForm}>
          <TextInput style={s.input} placeholder="Name" placeholderTextColor="#606070" value={name} onChangeText={setName} />
          <TextInput style={s.input} placeholder="Address" placeholderTextColor="#606070" value={address} onChangeText={setAddress} autoCapitalize="none" />
          <View style={s.chainRow}>
            {['ethereum', 'bitcoin', 'solana'].map((c) => (
              <TouchableOpacity key={c} style={[s.chainChip, chain === c && s.chainActive]} onPress={() => setChain(c)}>
                <Text style={[s.chainText, chain === c && s.chainTextActive]}>{c.slice(0, 3).toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={s.saveBtn} onPress={handleAdd}>
            <Text style={s.saveBtnText}>Save Contact</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={contacts}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.contactRow}
            onPress={() => onSelect?.(item)}
            onLongPress={() => handleDelete(item.id, item.name)}
          >
            <View style={s.contactInfo}>
              <Text style={s.contactName}>{item.name}</Text>
              <Text style={s.contactAddress} numberOfLines={1} ellipsizeMode="middle">
                {item.address}
              </Text>
            </View>
            <Text style={s.contactChain}>{item.chain.slice(0, 3).toUpperCase()}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>No saved contacts</Text>
            <Text style={s.emptyHint}>Tap "+ Add" to save a recipient address</Text>
          </View>
        }
        contentContainerStyle={contacts.length === 0 ? { flex: 1, justifyContent: 'center' } : undefined}
      />
    </SafeAreaView>
  );
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  back: { color: '#3b82f6', fontSize: 16, fontWeight: '600' },
  title: { color: '#f0f0f5', fontSize: 18, fontWeight: '800' },
  addBtn: { color: '#22c55e', fontSize: 15, fontWeight: '700' },
  addForm: { backgroundColor: '#16161f', marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 16 },
  input: { backgroundColor: '#0a0a0f', borderRadius: 12, padding: 14, color: '#f0f0f5', fontSize: 15, marginBottom: 10 },
  chainRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  chainChip: { backgroundColor: '#0a0a0f', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14 },
  chainActive: { backgroundColor: '#22c55e' },
  chainText: { color: '#a0a0b0', fontSize: 13 },
  chainTextActive: { color: '#0a0a0f', fontWeight: '700' },
  saveBtn: { backgroundColor: '#22c55e', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#0a0a0f', fontSize: 15, fontWeight: '700' },
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  contactInfo: { flex: 1 },
  contactName: { color: '#f0f0f5', fontSize: 16, fontWeight: '600' },
  contactAddress: { color: '#606070', fontSize: 12, marginTop: 2, maxWidth: 250 },
  contactChain: { color: '#a0a0b0', fontSize: 12, fontWeight: '600' },
  empty: { alignItems: 'center' },
  emptyText: { color: '#a0a0b0', fontSize: 16, fontWeight: '600' },
  emptyHint: { color: '#606070', fontSize: 13, marginTop: 4 },
});
