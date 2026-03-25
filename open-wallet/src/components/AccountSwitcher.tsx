/**
 * Account Switcher — Switch between multiple HD wallet accounts.
 * Same seed phrase, different BIP-44 account indexes.
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Modal,
  StyleSheet, Alert, TextInput,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';

export const AccountSwitcher = React.memo(() => {
  const accounts = useWalletStore((s) => s.accounts);
  const activeAccountIndex = useWalletStore((s) => s.activeAccountIndex);
  const addAccount = useWalletStore((s) => s.addAccountEntry);
  const switchAccount = useWalletStore((s) => s.switchAccount);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');

  const handleAdd = useCallback(() => {
    const name = newName.trim() || `Account ${accounts.length + 1}`;
    addAccount(name);
    setNewName('');
    setShowModal(false);
    // In production: derive new addresses for this account index
    Alert.alert('Account Added', `${name} created. Switch to it from the account menu.`);
  }, [newName, accounts.length, addAccount]);

  const activeAccount = accounts[activeAccountIndex] ?? { name: 'Main Account' };

  return (
    <>
      <TouchableOpacity style={s.trigger} onPress={() => setShowModal(true)}>
        <Text style={s.accountName}>{activeAccount.name}</Text>
        <Text style={s.arrow}>▾</Text>
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="fade">
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setShowModal(false)}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Accounts</Text>

            {accounts.map((acc, i) => (
              <TouchableOpacity
                key={i}
                style={[s.accountRow, i === activeAccountIndex && s.accountActive]}
                onPress={() => { switchAccount(i); setShowModal(false); }}
              >
                <Text style={s.accountRowName}>{acc.name}</Text>
                {i === activeAccountIndex && <Text style={s.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}

            <View style={s.addSection}>
              <TextInput
                style={s.addInput}
                placeholder="Account name (optional)"
                placeholderTextColor="#606070"
                value={newName}
                onChangeText={setNewName}
              />
              <TouchableOpacity style={s.addBtn} onPress={handleAdd}>
                <Text style={s.addBtnText}>+ Add Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
});

const s = StyleSheet.create({
  trigger: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  accountName: { color: '#a0a0b0', fontSize: 13, fontWeight: '600' },
  arrow: { color: '#606070', fontSize: 12 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: '#16161f', borderRadius: 20, padding: 20, width: '80%', maxWidth: 320 },
  modalTitle: { color: '#f0f0f5', fontSize: 18, fontWeight: '800', marginBottom: 16 },
  accountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12, marginBottom: 4 },
  accountActive: { backgroundColor: '#22c55e15' },
  accountRowName: { color: '#f0f0f5', fontSize: 16 },
  checkmark: { color: '#22c55e', fontSize: 18, fontWeight: '700' },
  addSection: { marginTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 12 },
  addInput: { backgroundColor: '#0a0a0f', borderRadius: 12, padding: 12, color: '#f0f0f5', fontSize: 14, marginBottom: 8 },
  addBtn: { backgroundColor: '#22c55e20', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  addBtnText: { color: '#22c55e', fontSize: 15, fontWeight: '700' },
});
