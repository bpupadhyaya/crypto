/**
 * Paper Trading System — Mandatory safety layer before real money transactions.
 *
 * HARD RULES (per Human Constitution & developer mandate):
 * 🔴 Red (0 paper trades): BLOCKED — must complete at least 1 paper trade
 * 🟡 Orange (1-2 paper trades): WARNING — allowed but recommended to do 3
 * 🟢 Green (3+ paper trades): CLEAR — full access
 *
 * Paper trades simulate real transactions without moving real funds.
 * This builds user confidence and verifies software works correctly.
 *
 * Rules:
 * - Minimum 1 paper trade per flow is MANDATORY before real money
 * - Flows tracked independently: send, each swap option, bridge
 * - After uninstall + reinstall: paper trade counter resets (safety first)
 * - Recommended: 3 paper trades before real money
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const PAPER_TRADE_KEY = 'ow-paper-trades';

export type TradeFlow =
  | 'send-bitcoin'
  | 'send-ethereum'
  | 'send-solana'
  | 'send-openchain'
  | 'swap-ow-atomic'
  | 'swap-ow-dex'
  | 'swap-ow-orderbook'
  | 'swap-thorchain'
  | 'swap-1inch'
  | 'swap-jupiter'
  | 'swap-lifi'
  | 'swap-osmosis'
  | 'gratitude-openchain';

export type TrafficLight = 'red' | 'orange' | 'green';

export interface PaperTradeStatus {
  flow: TradeFlow;
  count: number;
  light: TrafficLight;
  canProceedReal: boolean;
  message: string;
}

interface PaperTradeStore {
  [flow: string]: {
    count: number;
    lastPaperTradeAt: number;
    firstPaperTradeAt: number;
  };
}

// ─── Core Functions ───

/**
 * Get paper trade status for a specific flow.
 */
export async function getPaperTradeStatus(flow: TradeFlow): Promise<PaperTradeStatus> {
  const store = await loadStore();
  const entry = store[flow];
  const count = entry?.count ?? 0;

  let light: TrafficLight;
  let canProceedReal: boolean;
  let message: string;

  if (count === 0) {
    light = 'red';
    canProceedReal = false;
    message = `We kindly ask you to complete at least 1 practice transaction before using real funds.\n\nPractice trading serves two important purposes:\n\n1. It helps you become familiar with how the transaction works, so you feel confident when using real funds.\n\n2. It verifies that everything in the transaction path is functioning correctly — from your wallet to the destination.\n\nWe do our very best to ensure your tokens are never lost. This practice step is one of the ways we protect you.\n\nTap "Paper Trade" to try it safely with simulated funds.`;
  } else if (count < 3) {
    light = 'orange';
    canProceedReal = true;
    message = `You've completed ${count} of 3 recommended practice trades — thank you for taking this step.\n\nYou may proceed with real funds now, but we gently recommend completing ${3 - count} more practice transaction${3 - count > 1 ? 's' : ''} first.\n\nEach practice trade helps confirm that this specific transaction path is working properly and gives you greater confidence. We care deeply about keeping your funds safe, and this is one of the ways we do that.`;
  } else {
    light = 'green';
    canProceedReal = true;
    message = `You've completed ${count} paper trades. You're cleared for real transactions on this flow.`;
  }

  return { flow, count, light, canProceedReal, message };
}

/**
 * Record a completed paper trade for a flow.
 */
export async function recordPaperTrade(flow: TradeFlow): Promise<PaperTradeStatus> {
  const store = await loadStore();
  const now = Date.now();

  if (!store[flow]) {
    store[flow] = { count: 0, firstPaperTradeAt: now, lastPaperTradeAt: now };
  }

  store[flow].count += 1;
  store[flow].lastPaperTradeAt = now;

  await saveStore(store);
  return getPaperTradeStatus(flow);
}

/**
 * Check if a real transaction is allowed for a flow.
 * Returns { allowed, light, message }.
 */
export async function checkRealTransactionAllowed(flow: TradeFlow): Promise<{
  allowed: boolean;
  light: TrafficLight;
  message: string;
}> {
  // In dev/test mode, paper trading is optional — always allow
  const { isTestnet } = await import('./network');
  if (isTestnet()) {
    return { allowed: true, light: 'green', message: 'Testnet mode — paper trading optional.' };
  }

  // Production: mandatory paper trading
  const status = await getPaperTradeStatus(flow);
  return {
    allowed: status.canProceedReal,
    light: status.light,
    message: status.message,
  };
}

/**
 * Get all paper trade statuses for display.
 */
export async function getAllPaperTradeStatuses(): Promise<PaperTradeStatus[]> {
  const flows: TradeFlow[] = [
    'send-bitcoin', 'send-ethereum', 'send-solana', 'send-openchain',
    'swap-ow-atomic', 'swap-ow-dex', 'swap-ow-orderbook',
    'swap-thorchain', 'swap-1inch', 'swap-jupiter', 'swap-lifi', 'swap-osmosis',
    'gratitude-openchain',
  ];
  return Promise.all(flows.map(getPaperTradeStatus));
}

/**
 * Reset all paper trades (for testing or after reinstall).
 */
export async function resetAllPaperTrades(): Promise<void> {
  await AsyncStorage.removeItem(PAPER_TRADE_KEY);
}

/**
 * Get the traffic light color for UI.
 */
export function getTrafficLightColor(light: TrafficLight): string {
  switch (light) {
    case 'red': return '#ef4444';
    case 'orange': return '#f97316';
    case 'green': return '#22c55e';
  }
}

/**
 * Get the traffic light emoji for UI.
 */
export function getTrafficLightEmoji(light: TrafficLight): string {
  switch (light) {
    case 'red': return '🔴';
    case 'orange': return '🟡';
    case 'green': return '🟢';
  }
}

/**
 * Map a chain ID to the corresponding send flow.
 */
export function getSendFlow(chainId: string): TradeFlow {
  const map: Record<string, TradeFlow> = {
    bitcoin: 'send-bitcoin',
    ethereum: 'send-ethereum',
    solana: 'send-solana',
    openchain: 'send-openchain',
    cosmos: 'send-openchain',
  };
  return map[chainId] ?? 'send-ethereum';
}

/**
 * Map a swap option ID to the corresponding swap flow.
 */
export function getSwapFlow(optionId: string): TradeFlow {
  const map: Record<string, TradeFlow> = {
    'ow-atomic': 'swap-ow-atomic',
    'ow-dex': 'swap-ow-dex',
    'ow-orderbook': 'swap-ow-orderbook',
    'ext-thorchain': 'swap-thorchain',
    'ext-1inch': 'swap-1inch',
    'ext-jupiter': 'swap-jupiter',
    'ext-li.fi-bridge': 'swap-lifi',
    'ext-osmosis-(ibc)': 'swap-osmosis',
  };
  return map[optionId] ?? 'swap-ow-atomic';
}

// ─── Persistence ───

async function loadStore(): Promise<PaperTradeStore> {
  try {
    const raw = await AsyncStorage.getItem(PAPER_TRADE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveStore(store: PaperTradeStore): Promise<void> {
  try {
    await AsyncStorage.setItem(PAPER_TRADE_KEY, JSON.stringify(store));
  } catch {}
}
