/**
 * DApp Browser — Browse decentralized applications with an in-app WebView.
 *
 * Features:
 * - URL bar with back/forward/refresh
 * - Bookmarks for popular DApps
 * - Connected wallet address display
 * - Visit history stored in state
 * - Demo mode shows bookmark grid without loading URLs
 */

import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput, FlatList,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// WebView may not be available in all environments; use optional import
let WebView: React.ComponentType<any> | null = null;
try {
  WebView = require('react-native-webview').default;
} catch {
  WebView = null;
}

interface Props {
  onClose: () => void;
}

interface Bookmark {
  name: string;
  url: string;
  chain: string;
  color: string;
  icon: string;
}

interface HistoryEntry {
  url: string;
  title: string;
  visitedAt: number;
}

const BOOKMARKS: Bookmark[] = [
  { name: 'Uniswap', url: 'https://uniswap.org', chain: 'Ethereum', color: '#FF007A', icon: 'UNI' },
  { name: 'Aave', url: 'https://app.aave.com', chain: 'Ethereum', color: '#B6509E', icon: 'AAVE' },
  { name: 'OpenSea', url: 'https://opensea.io', chain: 'Ethereum', color: '#2081E2', icon: 'OS' },
  { name: 'Jupiter', url: 'https://jup.ag', chain: 'Solana', color: '#19FB9B', icon: 'JUP' },
  { name: 'Osmosis', url: 'https://app.osmosis.zone', chain: 'Cosmos', color: '#5E12A0', icon: 'OSMO' },
  { name: 'Raydium', url: 'https://raydium.io', chain: 'Solana', color: '#2B6DEF', icon: 'RAY' },
];

export function DAppBrowserScreen({ onClose }: Props) {
  const [url, setUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [browsing, setBrowsing] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const webViewRef = useRef<any>(null);

  const demoMode = useWalletStore((s) => s.demoMode);
  const addresses = useWalletStore((s) => s.addresses);
  const t = useTheme();

  const connectedAddress = addresses?.ethereum || addresses?.solana || 'Not connected';
  const shortAddress = connectedAddress.length > 16
    ? `${connectedAddress.slice(0, 8)}...${connectedAddress.slice(-6)}`
    : connectedAddress;

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    addressBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.bg.card, marginHorizontal: 16, borderRadius: 12, paddingHorizontal: 12, marginBottom: 8 },
    addressChip: { backgroundColor: t.accent.green + '20', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginHorizontal: 16, marginBottom: 12, alignSelf: 'flex-start' },
    addressText: { color: t.accent.green, fontSize: 12, fontWeight: '600' },
    urlInput: { flex: 1, color: t.text.primary, fontSize: 14, paddingVertical: 12 },
    navBtn: { paddingHorizontal: 8, paddingVertical: 10 },
    navBtnText: { fontSize: 18 },
    navBtnDisabled: { opacity: 0.3 },
    content: { flex: 1, paddingHorizontal: 20 },
    sectionTitle: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 },
    bookmarkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    bookmarkCard: { width: '30%', backgroundColor: t.bg.card, borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 4 },
    bookmarkIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    bookmarkIconText: { color: '#fff', fontSize: 14, fontWeight: '800' },
    bookmarkName: { color: t.text.primary, fontSize: 13, fontWeight: '600', textAlign: 'center' },
    bookmarkChain: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    introText: { color: t.text.muted, fontSize: 14, lineHeight: 22, marginBottom: 24, textAlign: 'center' },
    historyItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.border },
    historyUrl: { color: t.text.primary, fontSize: 14, flex: 1 },
    historyTime: { color: t.text.muted, fontSize: 12 },
    webviewContainer: { flex: 1 },
    emptyHistory: { color: t.text.muted, fontSize: 14, textAlign: 'center', paddingTop: 20 },
    tabRow: { flexDirection: 'row', marginBottom: 16, gap: 8 },
    tab: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 8, backgroundColor: t.border },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: '#fff' },
  }), [t]);

  const navigateToUrl = useCallback((targetUrl: string) => {
    let normalized = targetUrl.trim();
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized;
    }
    setUrl(normalized);
    setCurrentUrl(normalized);
    setBrowsing(true);
    setShowHistory(false);
    setHistory((prev) => [
      { url: normalized, title: normalized, visitedAt: Date.now() },
      ...prev.filter((h) => h.url !== normalized).slice(0, 49),
    ]);
  }, []);

  const handleBookmarkPress = useCallback((bookmark: Bookmark) => {
    if (demoMode) {
      // In demo mode, just add to history but don't actually browse
      setHistory((prev) => [
        { url: bookmark.url, title: bookmark.name, visitedAt: Date.now() },
        ...prev.filter((h) => h.url !== bookmark.url).slice(0, 49),
      ]);
      setUrl(bookmark.url);
      setCurrentUrl(bookmark.url);
      setBrowsing(true);
    } else {
      navigateToUrl(bookmark.url);
    }
  }, [demoMode, navigateToUrl]);

  const handleSubmitUrl = useCallback(() => {
    if (url.trim()) {
      navigateToUrl(url);
    }
  }, [url, navigateToUrl]);

  // ─── Browsing Mode with WebView ───
  if (browsing && !demoMode && WebView) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setBrowsing(false)}>
            <Text style={s.closeBtn}>Home</Text>
          </TouchableOpacity>
          <Text style={[s.title, { fontSize: 16 }]}>DApp Browser</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={s.closeBtn}>Close</Text>
          </TouchableOpacity>
        </View>

        <View style={s.addressBar}>
          <TouchableOpacity
            style={[s.navBtn, !canGoBack && s.navBtnDisabled]}
            onPress={() => canGoBack && webViewRef.current?.goBack()}
            disabled={!canGoBack}
          >
            <Text style={[s.navBtnText, { color: t.text.secondary }]}>{'<'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.navBtn, !canGoForward && s.navBtnDisabled]}
            onPress={() => canGoForward && webViewRef.current?.goForward()}
            disabled={!canGoForward}
          >
            <Text style={[s.navBtnText, { color: t.text.secondary }]}>{'>'}</Text>
          </TouchableOpacity>
          <TextInput
            style={s.urlInput}
            value={url}
            onChangeText={setUrl}
            onSubmitEditing={handleSubmitUrl}
            placeholder="Enter URL..."
            placeholderTextColor={t.text.muted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
          />
          <TouchableOpacity style={s.navBtn} onPress={() => webViewRef.current?.reload()}>
            <Text style={[s.navBtnText, { color: t.text.secondary }]}>R</Text>
          </TouchableOpacity>
        </View>

        <View style={s.addressChip}>
          <Text style={s.addressText}>{shortAddress}</Text>
        </View>

        <View style={s.webviewContainer}>
          <WebView
            ref={webViewRef}
            source={{ uri: currentUrl }}
            onNavigationStateChange={(navState: any) => {
              setCanGoBack(navState.canGoBack);
              setCanGoForward(navState.canGoForward);
              if (navState.url) setUrl(navState.url);
            }}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
          />
        </View>
      </SafeAreaView>
    );
  }

  // ─── Demo Browsing Mode (no WebView) ───
  if (browsing && (demoMode || !WebView)) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setBrowsing(false)}>
            <Text style={s.closeBtn}>Home</Text>
          </TouchableOpacity>
          <Text style={[s.title, { fontSize: 16 }]}>DApp Browser</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={s.closeBtn}>Close</Text>
          </TouchableOpacity>
        </View>

        <View style={s.addressBar}>
          <TextInput
            style={s.urlInput}
            value={url}
            onChangeText={setUrl}
            placeholder="Enter URL..."
            placeholderTextColor={t.text.muted}
            autoCapitalize="none"
            autoCorrect={false}
            editable={false}
          />
        </View>

        <View style={s.addressChip}>
          <Text style={s.addressText}>{shortAddress}</Text>
        </View>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
          <Text style={{ color: t.text.primary, fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>
            {demoMode ? 'Demo Mode' : 'WebView Unavailable'}
          </Text>
          <Text style={{ color: t.text.muted, fontSize: 14, textAlign: 'center', lineHeight: 22 }}>
            {demoMode
              ? `Navigating to ${currentUrl}\n\nIn demo mode, DApp pages are not loaded. Disable demo mode to browse real DApps.`
              : 'WebView is not available in this environment. Install react-native-webview to enable DApp browsing.'}
          </Text>
          <TouchableOpacity
            style={{ marginTop: 24, backgroundColor: t.accent.blue, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 }}
            onPress={() => setBrowsing(false)}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Back to Bookmarks</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Home: Bookmarks + History ───
  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>DApp Browser</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={s.addressBar}>
        <TextInput
          style={s.urlInput}
          value={url}
          onChangeText={setUrl}
          onSubmitEditing={handleSubmitUrl}
          placeholder="Search or enter DApp URL..."
          placeholderTextColor={t.text.muted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
        />
        <TouchableOpacity style={s.navBtn} onPress={handleSubmitUrl}>
          <Text style={[s.navBtnText, { color: t.accent.blue }]}>Go</Text>
        </TouchableOpacity>
      </View>

      <View style={s.addressChip}>
        <Text style={s.addressText}>{shortAddress}</Text>
      </View>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.introText}>
          Connect to any decentralized application — swap tokens, lend, borrow, trade NFTs, and more.
        </Text>

        {/* Tabs */}
        <View style={s.tabRow}>
          <TouchableOpacity style={[s.tab, !showHistory && s.tabActive]} onPress={() => setShowHistory(false)}>
            <Text style={[s.tabText, !showHistory && s.tabTextActive]}>Bookmarks</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tab, showHistory && s.tabActive]} onPress={() => setShowHistory(true)}>
            <Text style={[s.tabText, showHistory && s.tabTextActive]}>History ({history.length})</Text>
          </TouchableOpacity>
        </View>

        {!showHistory ? (
          <>
            <Text style={s.sectionTitle}>Popular DApps</Text>
            <View style={s.bookmarkGrid}>
              {BOOKMARKS.map((bm) => (
                <TouchableOpacity key={bm.name} style={s.bookmarkCard} onPress={() => handleBookmarkPress(bm)}>
                  <View style={[s.bookmarkIcon, { backgroundColor: bm.color }]}>
                    <Text style={s.bookmarkIconText}>{bm.icon}</Text>
                  </View>
                  <Text style={s.bookmarkName}>{bm.name}</Text>
                  <Text style={s.bookmarkChain}>{bm.chain}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <>
            <Text style={s.sectionTitle}>Recent History</Text>
            {history.length === 0 ? (
              <Text style={s.emptyHistory}>No DApps visited yet</Text>
            ) : (
              history.map((entry, idx) => (
                <TouchableOpacity
                  key={`${entry.url}-${idx}`}
                  style={s.historyItem}
                  onPress={() => navigateToUrl(entry.url)}
                >
                  <Text style={s.historyUrl} numberOfLines={1}>{entry.title || entry.url}</Text>
                  <Text style={s.historyTime}>
                    {new Date(entry.visitedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
