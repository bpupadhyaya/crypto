/**
 * Recurring Payments — schedule and manage automatic crypto payments.
 * Persisted in AsyncStorage. On app open, check for due payments.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@open_wallet/recurring_payments';
const HISTORY_KEY = '@open_wallet/recurring_history';

export interface RecurringPayment {
  id: string;
  recipient: string;
  amount: number;
  token: string;
  chain: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  nextExecution: number; // timestamp
  lastExecuted?: number;
  status: 'active' | 'paused' | 'cancelled';
  createdAt: number;
  executionCount: number;
  label?: string;
}

export interface PaymentExecution {
  id: string;
  paymentId: string;
  recipient: string;
  amount: number;
  token: string;
  chain: string;
  executedAt: number;
  status: 'confirmed' | 'pending' | 'failed';
}

// ─── CRUD ───

export async function getRecurringPayments(): Promise<RecurringPayment[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function savePayments(payments: RecurringPayment[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payments));
}

export async function createRecurringPayment(
  payment: Omit<RecurringPayment, 'id' | 'createdAt' | 'executionCount' | 'status'>,
): Promise<RecurringPayment> {
  const payments = await getRecurringPayments();
  const newPayment: RecurringPayment = {
    ...payment,
    id: `rp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    executionCount: 0,
    status: 'active',
  };
  payments.push(newPayment);
  await savePayments(payments);
  return newPayment;
}

export async function updatePaymentStatus(
  id: string,
  status: RecurringPayment['status'],
): Promise<void> {
  const payments = await getRecurringPayments();
  const idx = payments.findIndex((p) => p.id === id);
  if (idx >= 0) {
    payments[idx].status = status;
    await savePayments(payments);
  }
}

export async function deleteRecurringPayment(id: string): Promise<void> {
  const payments = await getRecurringPayments();
  await savePayments(payments.filter((p) => p.id !== id));
}

// ─── Execution ───

function getNextExecution(frequency: RecurringPayment['frequency'], from: number): number {
  const d = new Date(from);
  switch (frequency) {
    case 'daily':
      d.setDate(d.getDate() + 1);
      break;
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
  }
  return d.getTime();
}

export async function checkDuePayments(): Promise<RecurringPayment[]> {
  const payments = await getRecurringPayments();
  const now = Date.now();
  return payments.filter(
    (p) => p.status === 'active' && p.nextExecution <= now,
  );
}

export async function markExecuted(id: string): Promise<void> {
  const payments = await getRecurringPayments();
  const idx = payments.findIndex((p) => p.id === id);
  if (idx < 0) return;

  const payment = payments[idx];
  const now = Date.now();

  // Record execution in history
  const execution: PaymentExecution = {
    id: `pe_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    paymentId: payment.id,
    recipient: payment.recipient,
    amount: payment.amount,
    token: payment.token,
    chain: payment.chain,
    executedAt: now,
    status: 'confirmed',
  };
  const history = await getExecutionHistory();
  history.unshift(execution);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 200)));

  // Update payment
  payment.lastExecuted = now;
  payment.executionCount += 1;
  payment.nextExecution = getNextExecution(payment.frequency, now);
  payments[idx] = payment;
  await savePayments(payments);
}

export async function getExecutionHistory(): Promise<PaymentExecution[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ─── Demo Data ───

export function getDemoPayments(): RecurringPayment[] {
  const now = Date.now();
  const day = 86400000;
  return [
    {
      id: 'demo_1',
      recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD78',
      amount: 50,
      token: 'USDC',
      chain: 'ethereum',
      frequency: 'monthly',
      nextExecution: now + 5 * day,
      lastExecuted: now - 25 * day,
      status: 'active',
      createdAt: now - 60 * day,
      executionCount: 2,
      label: 'Rent to landlord',
    },
    {
      id: 'demo_2',
      recipient: 'GkXn6PUbcvpwAzVBPRWJ3Mf9jDmKTzA5NU3uFvwxKHr',
      amount: 10,
      token: 'SOL',
      chain: 'solana',
      frequency: 'weekly',
      nextExecution: now + 2 * day,
      lastExecuted: now - 5 * day,
      status: 'active',
      createdAt: now - 30 * day,
      executionCount: 4,
      label: 'DCA into SOL',
    },
    {
      id: 'demo_3',
      recipient: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      amount: 0.001,
      token: 'BTC',
      chain: 'bitcoin',
      frequency: 'daily',
      nextExecution: now - 3600000, // overdue
      lastExecuted: now - day,
      status: 'active',
      createdAt: now - 14 * day,
      executionCount: 13,
      label: 'Daily BTC savings',
    },
    {
      id: 'demo_4',
      recipient: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
      amount: 100,
      token: 'USDT',
      chain: 'ethereum',
      frequency: 'monthly',
      nextExecution: now + 20 * day,
      status: 'paused',
      createdAt: now - 90 * day,
      executionCount: 3,
      label: 'Charity donation',
    },
  ];
}
