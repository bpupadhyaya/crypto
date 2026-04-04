import { fonts } from '../utils/theme';
/**
 * Transaction Notes Screen — manage personal notes, tags, and categories on transactions.
 * Demo mode provides sample data. Filter by tag, category, or free-text search.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';
import {
  type TxNote, getAllNotes, setTxNote, deleteTxNote,
  searchByTag, searchByCategory, searchNotes,
} from '../core/transactions/notes';

interface Props { onClose: () => void }

// ─── Constants ───

const CATEGORIES = ['income', 'expense', 'transfer', 'swap', 'gift', 'business', 'personal'] as const;
const PREDEFINED_TAGS = ['tax-deductible', 'business-expense', 'donation', 'salary', 'investment'] as const;

const DEMO_NOTES: TxNote[] = [
  { txHash: '0xabc123...def456', note: 'Monthly salary from Acme Corp', tags: ['salary', 'income'], category: 'income', createdAt: Date.now() - 86400000 * 2 },
  { txHash: '0x789abc...012def', note: 'Donated to Wikipedia', tags: ['donation', 'tax-deductible'], category: 'gift', createdAt: Date.now() - 86400000 * 5 },
  { txHash: '5Ht9Vk...mZpQ3', note: 'Swapped SOL for USDC on Jupiter', tags: ['investment'], category: 'swap', createdAt: Date.now() - 86400000 * 1 },
  { txHash: 'bc1q...7x8r', note: 'Payment for freelance design work', tags: ['business-expense'], category: 'expense', createdAt: Date.now() - 86400000 * 7 },
  { txHash: '0xfed987...654cba', note: 'Transferred to cold storage', tags: ['investment'], category: 'transfer', createdAt: Date.now() - 86400000 * 3 },
  { txHash: 'cosmos1...abc', note: 'Staking rewards claim', tags: ['income', 'investment'], category: 'income', createdAt: Date.now() - 86400000 * 10 },
];

type ViewMode = 'list' | 'add' | 'edit';

export function TxNotesScreen({ onClose }: Props) {
  const { demoMode } = useWalletStore();
  const t = useTheme();

  const [notes, setNotes] = useState<TxNote[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNote, setEditingNote] = useState<TxNote | null>(null);

  // Form state
  const [formHash, setFormHash] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formTags, setFormTags] = useState<string[]>([]);
  const [formCategory, setFormCategory] = useState<string>('expense');

  const loadNotes = useCallback(async () => {
    if (demoMode) { setNotes(DEMO_NOTES); return; }
    try {
      let result: TxNote[];
      if (filterTag) result = await searchByTag(filterTag);
      else if (filterCategory) result = await searchByCategory(filterCategory);
      else if (searchQuery.trim()) result = await searchNotes(searchQuery);
      else result = await getAllNotes();
      setNotes(result);
    } catch { setNotes([]); }
  }, [demoMode, filterTag, filterCategory, searchQuery]);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  const filteredNotes = useMemo(() => {
    let result = notes;
    if (demoMode) {
      if (filterTag) result = result.filter((n) => n.tags.includes(filterTag));
      if (filterCategory) result = result.filter((n) => n.category === filterCategory);
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        result = result.filter((n) =>
          n.note.toLowerCase().includes(q) ||
          n.tags.some((tg) => tg.toLowerCase().includes(q)) ||
          n.txHash.toLowerCase().includes(q),
        );
      }
    }
    return result;
  }, [notes, demoMode, filterTag, filterCategory, searchQuery]);

  const resetForm = () => {
    setFormHash(''); setFormNote(''); setFormTags([]); setFormCategory('expense');
    setEditingNote(null);
  };

  const openAdd = () => { resetForm(); setViewMode('add'); };
  const openEdit = (note: TxNote) => {
    setEditingNote(note);
    setFormHash(note.txHash);
    setFormNote(note.note);
    setFormTags([...note.tags]);
    setFormCategory(note.category);
    setViewMode('edit');
  };

  const handleSave = async () => {
    if (!formHash.trim()) { Alert.alert('Error', 'Transaction hash is required.'); return; }
    if (demoMode) { Alert.alert('Demo Mode', 'Notes are read-only in demo mode.'); return; }
    try {
      await setTxNote(formHash.trim(), formNote.trim(), formTags, formCategory);
      resetForm();
      setViewMode('list');
      await loadNotes();
    } catch { Alert.alert('Error', 'Failed to save note.'); }
  };

  const handleDelete = async (txHash: string) => {
    if (demoMode) { Alert.alert('Demo Mode', 'Cannot delete in demo mode.'); return; }
    Alert.alert('Delete Note', 'Remove this transaction note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteTxNote(txHash);
          await loadNotes();
        },
      },
    ]);
  };

  const toggleTag = (tag: string) => {
    setFormTags((prev) => prev.includes(tag) ? prev.filter((t2) => t2 !== tag) : [...prev, tag]);
  };

  const clearFilters = () => { setFilterTag(null); setFilterCategory(null); setSearchQuery(''); };

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.bold },
    backText: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingHorizontal: 16 },
    section: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 20, marginBottom: 8, marginLeft: 4 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    label: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    muted: { color: t.text.muted, fontSize: fonts.sm },
    noteText: { color: t.text.secondary, fontSize: fonts.md, marginTop: 6, lineHeight: 20 },
    hashText: { color: t.text.muted, fontSize: fonts.sm, fontFamily: 'Courier', marginTop: 4 },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    tag: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 12, backgroundColor: t.accent.blue + '20' },
    tagActive: { backgroundColor: t.accent.blue },
    tagText: { color: t.accent.blue, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tagTextActive: { color: '#fff' },
    categoryBadge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 8 },
    categoryText: { fontSize: fonts.xs, fontWeight: fonts.bold, textTransform: 'uppercase' },
    searchBox: { backgroundColor: t.bg.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: t.text.primary, fontSize: fonts.md, marginBottom: 12 },
    input: { backgroundColor: t.bg.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: t.text.primary, fontSize: fonts.md, marginBottom: 12, borderWidth: 1, borderColor: t.border },
    multilineInput: { minHeight: 80, textAlignVertical: 'top' },
    filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
    filterChip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, backgroundColor: t.border },
    filterChipActive: { backgroundColor: t.accent.green },
    filterChipText: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    filterChipTextActive: { color: '#fff' },
    addBtn: { backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
    addBtnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    deleteBtn: { marginTop: 8 },
    deleteText: { color: t.accent.red, fontSize: fonts.sm, fontWeight: fonts.semibold },
    emptyText: { color: t.text.muted, fontSize: fonts.md, textAlign: 'center', marginTop: 40 },
    actionRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  }), [t]);

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'income': return t.accent.green;
      case 'expense': return t.accent.red;
      case 'transfer': return t.accent.blue;
      case 'swap': return t.accent.purple;
      case 'gift': return t.accent.orange;
      case 'business': return t.accent.yellow;
      case 'personal': return t.text.secondary;
      default: return t.text.muted;
    }
  };

  // ─── Add / Edit Form ───

  if (viewMode === 'add' || viewMode === 'edit') {
    return (
      <SafeAreaView style={st.container}>
        <View style={st.header}>
          <TouchableOpacity onPress={() => { resetForm(); setViewMode('list'); }}>
            <Text style={st.backText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={st.title}>{viewMode === 'add' ? 'Add Note' : 'Edit Note'}</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={[st.backText, { fontWeight: fonts.bold }]}>Save</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={st.scroll}>
          <Text style={st.section}>Transaction Hash</Text>
          <TextInput
            style={st.input}
            value={formHash}
            onChangeText={setFormHash}
            placeholder="0xabc123... or bc1q..."
            placeholderTextColor={t.text.muted}
            editable={viewMode === 'add'}
            autoCapitalize="none"
          />

          <Text style={st.section}>Note</Text>
          <TextInput
            style={[st.input, st.multilineInput]}
            value={formNote}
            onChangeText={setFormNote}
            placeholder="What was this transaction for?"
            placeholderTextColor={t.text.muted}
            multiline
          />

          <Text style={st.section}>Category</Text>
          <View style={st.filterRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[st.filterChip, formCategory === cat && { backgroundColor: getCategoryColor(cat) }]}
                onPress={() => setFormCategory(cat)}
              >
                <Text style={[st.filterChipText, formCategory === cat && st.filterChipTextActive]}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={st.section}>Tags</Text>
          <View style={st.filterRow}>
            {PREDEFINED_TAGS.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[st.tag, formTags.includes(tag) && st.tagActive]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={[st.tagText, formTags.includes(tag) && st.tagTextActive]}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {formTags.filter((tg) => !(PREDEFINED_TAGS as readonly string[]).includes(tg)).length > 0 && (
            <View style={[st.tagRow, { marginBottom: 12 }]}>
              {formTags.filter((tg) => !(PREDEFINED_TAGS as readonly string[]).includes(tg)).map((tg) => (
                <TouchableOpacity key={tg} style={[st.tag, st.tagActive]} onPress={() => toggleTag(tg)}>
                  <Text style={st.tagTextActive}>{tg} x</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── List View ───

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={st.title}>Transaction Notes</Text>
        <TouchableOpacity onPress={openAdd}>
          <Text style={[st.backText, { fontWeight: fonts.bold }]}>+ Add</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={st.scroll}>
        {/* Search */}
        <TextInput
          style={st.searchBox}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search notes, tags, or hashes..."
          placeholderTextColor={t.text.muted}
          autoCapitalize="none"
        />

        {/* Category Filters */}
        <Text style={st.section}>Filter by Category</Text>
        <View style={st.filterRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[st.filterChip, filterCategory === cat && st.filterChipActive]}
              onPress={() => setFilterCategory(filterCategory === cat ? null : cat)}
            >
              <Text style={[st.filterChipText, filterCategory === cat && st.filterChipTextActive]}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tag Filters */}
        <Text style={st.section}>Filter by Tag</Text>
        <View style={st.filterRow}>
          {PREDEFINED_TAGS.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[st.filterChip, filterTag === tag && { backgroundColor: t.accent.blue }]}
              onPress={() => setFilterTag(filterTag === tag ? null : tag)}
            >
              <Text style={[st.filterChipText, filterTag === tag && st.filterChipTextActive]}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {(filterTag || filterCategory || searchQuery) && (
          <TouchableOpacity onPress={clearFilters} style={{ marginBottom: 12 }}>
            <Text style={{ color: t.accent.red, fontSize: fonts.sm }}>Clear Filters</Text>
          </TouchableOpacity>
        )}

        {/* Notes List */}
        <Text style={st.section}>
          {filteredNotes.length} Note{filteredNotes.length !== 1 ? 's' : ''}
        </Text>

        {filteredNotes.length === 0 && (
          <Text style={st.emptyText}>
            {filterTag || filterCategory || searchQuery
              ? 'No notes match your filters.'
              : 'No transaction notes yet. Tap + Add to annotate a transaction.'}
          </Text>
        )}

        {filteredNotes.map((n) => (
          <TouchableOpacity key={n.txHash} style={st.card} onPress={() => openEdit(n)} activeOpacity={0.7}>
            <View style={st.row}>
              <View style={[st.categoryBadge, { backgroundColor: getCategoryColor(n.category) + '20' }]}>
                <Text style={[st.categoryText, { color: getCategoryColor(n.category) }]}>
                  {n.category}
                </Text>
              </View>
              <Text style={st.muted}>{new Date(n.createdAt).toLocaleDateString()}</Text>
            </View>
            <Text style={st.noteText}>{n.note}</Text>
            <Text style={st.hashText}>{n.txHash}</Text>
            {n.tags.length > 0 && (
              <View style={st.tagRow}>
                {n.tags.map((tg) => (
                  <View key={tg} style={st.tag}>
                    <Text style={st.tagText}>{tg}</Text>
                  </View>
                ))}
              </View>
            )}
            <View style={st.actionRow}>
              <TouchableOpacity onPress={() => openEdit(n)}>
                <Text style={{ color: t.accent.blue, fontSize: fonts.sm }}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(n.txHash)}>
                <Text style={st.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
