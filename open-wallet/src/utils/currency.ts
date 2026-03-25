/**
 * Currency formatting utilities.
 * Supports USD, EUR, GBP, INR, JPY, CNY, BRL, KES, VND, PHP.
 */

export const SUPPORTED_CURRENCIES = [
  { code: 'usd', symbol: '$', name: 'US Dollar' },
  { code: 'eur', symbol: '€', name: 'Euro' },
  { code: 'gbp', symbol: '£', name: 'British Pound' },
  { code: 'inr', symbol: '₹', name: 'Indian Rupee' },
  { code: 'jpy', symbol: '¥', name: 'Japanese Yen' },
  { code: 'cny', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'brl', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'kes', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'vnd', symbol: '₫', name: 'Vietnamese Dong' },
  { code: 'php', symbol: '₱', name: 'Philippine Peso' },
] as const;

export type CurrencyCode = typeof SUPPORTED_CURRENCIES[number]['code'];

export function formatCurrency(amount: number, currencyCode: CurrencyCode = 'usd'): string {
  const currency = SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode);
  if (!currency) return `$${amount.toFixed(2)}`;

  const decimals = currencyCode === 'jpy' ? 0 : currencyCode === 'vnd' ? 0 : 2;

  return `${currency.symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function formatTokenAmount(amount: number, decimals: number = 6): string {
  if (amount === 0) return '0.00';
  if (amount < 0.001) return '<0.001';
  const dp = amount < 1 ? Math.min(decimals, 6) : amount < 100 ? 4 : 2;
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: dp });
}
