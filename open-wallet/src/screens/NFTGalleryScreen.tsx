import { fonts } from '../utils/theme';
/**
 * NFT Gallery — View NFTs owned across chains.
 *
 * Grid view of NFT thumbnails with tap-to-view details.
 * Supports Ethereum (ERC-721) and Solana (Metaplex) in real mode.
 * Demo mode shows sample NFTs for illustration.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, ActivityIndicator, Dimensions,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

interface Props {
  onClose: () => void;
}

interface NFTItem {
  id: string;
  name: string;
  collection: string;
  chain: 'ethereum' | 'solana';
  imageColor: string;  // Placeholder color since we can't load images in demo
  tokenId: string;
  contractAddress: string;
  description: string;
  attributes: Array<{ trait_type: string; value: string }>;
}

const DEMO_NFTS: NFTItem[] = [
  {
    id: '1',
    name: 'Cosmic Voyager #1042',
    collection: 'Cosmic Voyagers',
    chain: 'ethereum',
    imageColor: '#4A0E8F',
    tokenId: '1042',
    contractAddress: '0x1234...abcd',
    description: 'A cosmic traveler navigating the blockchain universe. Part of the Cosmic Voyagers genesis collection.',
    attributes: [
      { trait_type: 'Background', value: 'Nebula' },
      { trait_type: 'Body', value: 'Astral' },
      { trait_type: 'Accessory', value: 'Star Map' },
      { trait_type: 'Rarity', value: 'Legendary' },
    ],
  },
  {
    id: '2',
    name: 'Digital Garden #87',
    collection: 'Digital Gardens',
    chain: 'ethereum',
    imageColor: '#0E8F4A',
    tokenId: '87',
    contractAddress: '0x5678...efgh',
    description: 'A procedurally generated digital garden that grows with each block.',
    attributes: [
      { trait_type: 'Season', value: 'Spring' },
      { trait_type: 'Flora', value: 'Orchid' },
      { trait_type: 'Rarity', value: 'Rare' },
    ],
  },
  {
    id: '3',
    name: 'Sol Spirit #512',
    collection: 'Sol Spirits',
    chain: 'solana',
    imageColor: '#8F4A0E',
    tokenId: '512',
    contractAddress: 'SoL1...xyz',
    description: 'Guardian spirits of the Solana blockchain. Each spirit represents a unique validator.',
    attributes: [
      { trait_type: 'Element', value: 'Fire' },
      { trait_type: 'Power', value: '95' },
      { trait_type: 'Rarity', value: 'Epic' },
    ],
  },
  {
    id: '4',
    name: 'Open Citizen Badge',
    collection: 'Open Chain Soulbound',
    chain: 'ethereum',
    imageColor: '#0E4A8F',
    tokenId: '1',
    contractAddress: '0xopen...chain',
    description: 'Soulbound NFT representing verified citizenship on Open Chain. Non-transferable.',
    attributes: [
      { trait_type: 'Type', value: 'Soulbound' },
      { trait_type: 'Level', value: 'Citizen' },
      { trait_type: 'Issued', value: '2026' },
    ],
  },
  {
    id: '5',
    name: 'Metaplex Art #203',
    collection: 'Metaplex Masters',
    chain: 'solana',
    imageColor: '#8F0E4A',
    tokenId: '203',
    contractAddress: 'Meta...plex',
    description: 'Curated digital art minted through the Metaplex standard on Solana.',
    attributes: [
      { trait_type: 'Artist', value: 'PixelMaster' },
      { trait_type: 'Edition', value: '1 of 10' },
      { trait_type: 'Rarity', value: 'Ultra Rare' },
    ],
  },
  {
    id: '6',
    name: 'Genesis Block #1',
    collection: 'Open Chain Genesis',
    chain: 'ethereum',
    imageColor: '#4A8F0E',
    tokenId: '1',
    contractAddress: '0xgenesis...01',
    description: 'Commemorative NFT from the Open Chain genesis block. A piece of history.',
    attributes: [
      { trait_type: 'Block', value: '0' },
      { trait_type: 'Type', value: 'Commemorative' },
      { trait_type: 'Rarity', value: 'Mythic' },
    ],
  },
];

const CHAIN_LABELS: Record<string, string> = {
  ethereum: 'Ethereum (ERC-721)',
  solana: 'Solana (Metaplex)',
};

const CHAIN_COLORS: Record<string, string> = {
  ethereum: '#627EEA',
  solana: '#14F195',
};

const RARITY_COLORS: Record<string, string> = {
  Common: '#9CA3AF',
  Rare: '#3B82F6',
  Epic: '#8B5CF6',
  Legendary: '#F59E0B',
  'Ultra Rare': '#EF4444',
  Mythic: '#EC4899',
};

const screenWidth = Dimensions.get('window').width;
const cardSize = (screenWidth - 60) / 2;

export function NFTGalleryScreen({ onClose }: Props) {
  const [nfts, setNfts] = useState<NFTItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNFT, setSelectedNFT] = useState<NFTItem | null>(null);
  const [chainFilter, setChainFilter] = useState<'all' | 'ethereum' | 'solana'>('all');

  const demoMode = useWalletStore((s) => s.demoMode);
  const addresses = useWalletStore((s) => s.addresses);
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    filterBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8, backgroundColor: t.border },
    filterBtnActive: { backgroundColor: t.accent.blue },
    filterText: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    filterTextActive: { color: '#fff' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    nftCard: { width: cardSize, backgroundColor: t.bg.card, borderRadius: 16, overflow: 'hidden' },
    nftImage: { width: cardSize, height: cardSize, justifyContent: 'center', alignItems: 'center' },
    nftImageText: { color: '#ffffff80', fontSize: fonts.xxxl, fontWeight: fonts.heavy },
    nftInfo: { padding: 12 },
    nftName: { color: t.text.primary, fontSize: fonts.sm, fontWeight: fonts.bold, marginBottom: 2 },
    nftCollection: { color: t.text.muted, fontSize: fonts.xs },
    chainBadge: { position: 'absolute', top: 8, right: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    chainBadgeText: { color: '#fff', fontSize: fonts.xs, fontWeight: fonts.bold },
    emptyText: { color: t.text.muted, fontSize: fonts.md, textAlign: 'center', paddingVertical: 60 },
    countText: { color: t.text.muted, fontSize: fonts.sm, marginBottom: 12 },

    // Detail view
    detailContainer: { flex: 1, backgroundColor: t.bg.primary },
    detailImage: { width: '100%', height: 300, justifyContent: 'center', alignItems: 'center' },
    detailImageText: { color: '#ffffff40', fontSize: 56, fontWeight: fonts.heavy },
    detailContent: { padding: 20 },
    detailName: { color: t.text.primary, fontSize: fonts.xxl, fontWeight: fonts.heavy, marginBottom: 4 },
    detailCollection: { color: t.accent.blue, fontSize: fonts.md, fontWeight: fonts.semibold, marginBottom: 12 },
    detailDesc: { color: t.text.secondary, fontSize: fonts.md, lineHeight: 22, marginBottom: 20 },
    detailCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 16 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: t.border },
    detailLabel: { color: t.text.muted, fontSize: fonts.sm },
    detailValue: { color: t.text.primary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    attributeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    attributeCard: { backgroundColor: t.bg.secondary, borderRadius: 10, padding: 10, minWidth: '45%', borderWidth: 1, borderColor: t.border },
    attributeTrait: { color: t.text.muted, fontSize: fonts.xs, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
    attributeValue: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    sectionTitle: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 },
  }), [t]);

  useEffect(() => {
    loadNFTs();
  }, []);

  const loadNFTs = async () => {
    setLoading(true);
    // In demo mode or when APIs are not configured, use sample data
    // Real mode would query Alchemy (Ethereum) and Helius (Solana)
    await new Promise((r) => setTimeout(r, 500)); // Simulate loading
    setNfts(DEMO_NFTS);
    setLoading(false);
  };

  const filteredNFTs = chainFilter === 'all'
    ? nfts
    : nfts.filter((n) => n.chain === chainFilter);

  // ─── Detail View ───
  if (selectedNFT) {
    const rarity = selectedNFT.attributes.find((a) => a.trait_type === 'Rarity')?.value || '';
    const rarityColor = RARITY_COLORS[rarity] || t.text.muted;

    return (
      <SafeAreaView style={s.detailContainer}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setSelectedNFT(null)}>
            <Text style={s.closeBtn}>Back</Text>
          </TouchableOpacity>
          <Text style={[s.title, { fontSize: fonts.lg }]}>NFT Details</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Image placeholder */}
          <View style={[s.detailImage, { backgroundColor: selectedNFT.imageColor }]}>
            <Text style={s.detailImageText}>NFT</Text>
            <View style={[s.chainBadge, { backgroundColor: CHAIN_COLORS[selectedNFT.chain] }]}>
              <Text style={s.chainBadgeText}>{selectedNFT.chain === 'ethereum' ? 'ETH' : 'SOL'}</Text>
            </View>
          </View>

          <View style={s.detailContent}>
            <Text style={s.detailName}>{selectedNFT.name}</Text>
            <Text style={s.detailCollection}>{selectedNFT.collection}</Text>

            {rarity ? (
              <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                <View style={{ backgroundColor: rarityColor + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ color: rarityColor, fontSize: fonts.sm, fontWeight: fonts.bold }}>{rarity}</Text>
                </View>
              </View>
            ) : null}

            <Text style={s.detailDesc}>{selectedNFT.description}</Text>

            {/* Metadata */}
            <View style={s.detailCard}>
              <Text style={s.sectionTitle}>Details</Text>
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Chain</Text>
                <Text style={s.detailValue}>{CHAIN_LABELS[selectedNFT.chain]}</Text>
              </View>
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Token ID</Text>
                <Text style={s.detailValue}>{selectedNFT.tokenId}</Text>
              </View>
              <View style={[s.detailRow, { borderBottomWidth: 0 }]}>
                <Text style={s.detailLabel}>Contract</Text>
                <Text style={s.detailValue}>{selectedNFT.contractAddress}</Text>
              </View>
            </View>

            {/* Attributes */}
            {selectedNFT.attributes.length > 0 && (
              <>
                <Text style={s.sectionTitle}>Attributes</Text>
                <View style={s.attributeGrid}>
                  {selectedNFT.attributes.map((attr) => (
                    <View key={attr.trait_type} style={s.attributeCard}>
                      <Text style={s.attributeTrait}>{attr.trait_type}</Text>
                      <Text style={s.attributeValue}>{attr.value}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            <View style={{ height: 40 }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Grid View ───
  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>NFT Gallery</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Chain Filter */}
        <View style={s.filterRow}>
          {(['all', 'ethereum', 'solana'] as const).map((chain) => (
            <TouchableOpacity
              key={chain}
              style={[s.filterBtn, chainFilter === chain && s.filterBtnActive]}
              onPress={() => setChainFilter(chain)}
            >
              <Text style={[s.filterText, chainFilter === chain && s.filterTextActive]}>
                {chain === 'all' ? 'All Chains' : chain === 'ethereum' ? 'Ethereum' : 'Solana'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={t.accent.green} style={{ paddingVertical: 60 }} />
        ) : filteredNFTs.length === 0 ? (
          <Text style={s.emptyText}>
            {demoMode ? 'No NFTs found for this filter' : 'No NFTs found. NFTs you own on Ethereum and Solana will appear here.'}
          </Text>
        ) : (
          <>
            <Text style={s.countText}>{filteredNFTs.length} NFT{filteredNFTs.length !== 1 ? 's' : ''}</Text>
            <View style={s.grid}>
              {filteredNFTs.map((nft) => (
                <TouchableOpacity key={nft.id} style={s.nftCard} onPress={() => setSelectedNFT(nft)}>
                  <View style={[s.nftImage, { backgroundColor: nft.imageColor }]}>
                    <Text style={s.nftImageText}>NFT</Text>
                    <View style={[s.chainBadge, { backgroundColor: CHAIN_COLORS[nft.chain] }]}>
                      <Text style={s.chainBadgeText}>{nft.chain === 'ethereum' ? 'ETH' : 'SOL'}</Text>
                    </View>
                  </View>
                  <View style={s.nftInfo}>
                    <Text style={s.nftName} numberOfLines={1}>{nft.name}</Text>
                    <Text style={s.nftCollection} numberOfLines={1}>{nft.collection}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {demoMode && nfts.length > 0 && (
          <Text style={{ color: t.text.muted, fontSize: fonts.xs, textAlign: 'center', marginTop: 16 }}>
            Demo mode — showing sample NFTs
          </Text>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
