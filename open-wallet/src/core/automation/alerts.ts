/**
 * Price-Based Automation Rules — trigger buy/sell/send actions
 * when token prices cross configured thresholds.
 * Persisted in AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@open_wallet/automation_rules';
const HISTORY_KEY = '@open_wallet/automation_history';

export interface AutomationRule {
  id: string;
  token: string;
  direction: 'above' | 'below';
  targetPrice: number;
  action: 'buy' | 'sell' | 'send';
  amount: number; // dollar amount for buy, percentage for sell, token amount for send
  recipient?: string; // required for 'send' action
  note?: string; // optional note (e.g. "send gratitude to parent")
  status: 'active' | 'triggered' | 'paused';
  createdAt: number;
  triggeredAt?: number;
  label?: string;
}

export interface AutomationExecution {
  id: string;
  ruleId: string;
  token: string;
  action: 'buy' | 'sell' | 'send';
  amount: number;
  priceAtTrigger: number;
  executedAt: number;
  status: 'confirmed' | 'pending' | 'failed';
}

// ─── CRUD ───

export async function getAutomationRules(): Promise<AutomationRule[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveRules(rules: AutomationRule[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
}

export async function createAutomationRule(
  rule: Omit<AutomationRule, 'id' | 'createdAt' | 'status'>,
): Promise<AutomationRule> {
  const rules = await getAutomationRules();
  const newRule: AutomationRule = {
    ...rule,
    id: `ar_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    status: 'active',
  };
  rules.push(newRule);
  await saveRules(rules);
  return newRule;
}

export async function updateRuleStatus(
  id: string,
  status: AutomationRule['status'],
): Promise<void> {
  const rules = await getAutomationRules();
  const idx = rules.findIndex((r) => r.id === id);
  if (idx >= 0) {
    rules[idx].status = status;
    await saveRules(rules);
  }
}

export async function deleteAutomationRule(id: string): Promise<void> {
  const rules = await getAutomationRules();
  await saveRules(rules.filter((r) => r.id !== id));
}

// ─── Execution ───

export async function checkTriggeredRules(
  prices: Record<string, number>,
): Promise<AutomationRule[]> {
  const rules = await getAutomationRules();
  return rules.filter((r) => {
    if (r.status !== 'active') return false;
    const price = prices[r.token];
    if (price == null) return false;
    return r.direction === 'above' ? price >= r.targetPrice : price <= r.targetPrice;
  });
}

export async function markRuleTriggered(
  id: string,
  priceAtTrigger: number,
): Promise<void> {
  const rules = await getAutomationRules();
  const idx = rules.findIndex((r) => r.id === id);
  if (idx < 0) return;

  const rule = rules[idx];
  rule.status = 'triggered';
  rule.triggeredAt = Date.now();
  rules[idx] = rule;
  await saveRules(rules);

  // Record in history
  const execution: AutomationExecution = {
    id: `ae_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ruleId: rule.id,
    token: rule.token,
    action: rule.action,
    amount: rule.amount,
    priceAtTrigger,
    executedAt: Date.now(),
    status: 'confirmed',
  };
  const history = await getAutomationHistory();
  history.unshift(execution);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 200)));
}

export async function getAutomationHistory(): Promise<AutomationExecution[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ─── Demo Data ───

export function getDemoRules(): AutomationRule[] {
  const now = Date.now();
  return [
    {
      id: 'demo_ar_1',
      token: 'BTC',
      direction: 'below',
      targetPrice: 80000,
      action: 'buy',
      amount: 100,
      status: 'active',
      createdAt: now - 7 * 86400000,
      label: 'Buy the dip',
    },
    {
      id: 'demo_ar_2',
      token: 'SOL',
      direction: 'above',
      targetPrice: 200,
      action: 'sell',
      amount: 10,
      status: 'active',
      createdAt: now - 3 * 86400000,
      label: 'Take profits',
    },
    {
      id: 'demo_ar_3',
      token: 'OTK',
      direction: 'above',
      targetPrice: 0.10,
      action: 'send',
      amount: 1000,
      recipient: 'parent.openchain',
      note: 'Send gratitude to parent',
      status: 'active',
      createdAt: now - 86400000,
      label: 'Gratitude to parent',
    },
    {
      id: 'demo_ar_4',
      token: 'ETH',
      direction: 'above',
      targetPrice: 5000,
      action: 'sell',
      amount: 25,
      status: 'triggered',
      createdAt: now - 14 * 86400000,
      triggeredAt: now - 2 * 86400000,
      label: 'ETH moon sell',
    },
  ];
}
