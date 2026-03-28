/**
 * Currency formatting — handles fiat and crypto display.
 *
 * Fiat: locale-aware with correct symbols and decimal places.
 * Crypto: smart precision — shows significant digits for tiny amounts,
 *         standard formatting for larger values.
 */

const CURRENCY_CONFIG: Record<string, { symbol: string; decimals: number }> = {
  USD: { symbol: '$', decimals: 2 },
  EUR: { symbol: '\u20AC', decimals: 2 },
  GBP: { symbol: '\u00A3', decimals: 2 },
  INR: { symbol: '\u20B9', decimals: 2 },
  JPY: { symbol: '\u00A5', decimals: 0 },
  CNY: { symbol: '\u00A5', decimals: 2 },
  BRL: { symbol: 'R$', decimals: 2 },
  KES: { symbol: 'KSh', decimals: 2 },
  VND: { symbol: '\u20AB', decimals: 0 },
  PHP: { symbol: '\u20B1', decimals: 2 },
  KRW: { symbol: '\u20A9', decimals: 0 },
  BTC: { symbol: '\u20BF', decimals: 8 },
  ETH: { symbol: '\u039E', decimals: 6 },
};

/**
 * Format a monetary value in the given fiat or crypto currency.
 *
 * @example
 * formatCurrency(1234.56, 'USD') // '$1,234.56'
 * formatCurrency(1234.56, 'EUR') // '€1,234.56'
 * formatCurrency(1234.56, 'INR') // '₹1,234.56'
 * formatCurrency(1234.56, 'JPY') // '¥1,235'
 * formatCurrency(1234.56, 'BTC') // '₿1,234.56'
 */
export function formatCurrency(amount: number, currency: string): string {
  const upper = currency.toUpperCase();
  const config = CURRENCY_CONFIG[upper];

  if (!config) {
    // Fallback: use the currency code as-is
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${upper}`;
  }

  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  });

  return `${config.symbol}${formatted}`;
}

/**
 * Smart-format a crypto amount with its symbol.
 * Preserves significant digits for tiny amounts, uses commas for large ones.
 *
 * @example
 * formatCryptoAmount(0.00000123, 'BTC')  // '0.00000123 BTC'
 * formatCryptoAmount(1234.5, 'SOL')      // '1,234.50 SOL'
 * formatCryptoAmount(0.0, 'ETH')         // '0.00 ETH'
 */
export function formatCryptoAmount(amount: number, symbol: string): string {
  if (amount === 0) return `0.00 ${symbol}`;

  const abs = Math.abs(amount);

  // Tiny amounts: show all significant digits (up to 8)
  if (abs < 0.001) {
    // Find how many decimals we need to show the first significant digit
    const str = abs.toFixed(8);
    // Trim trailing zeros but keep at least 2 decimals
    const trimmed = str.replace(/0+$/, '');
    const decPart = trimmed.split('.')[1] ?? '';
    const decimals = Math.max(2, decPart.length);
    const formatted = amount.toFixed(decimals);
    return `${formatted} ${symbol}`;
  }

  // Small amounts (< 1): up to 6 decimal places
  if (abs < 1) {
    const formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
    return `${formatted} ${symbol}`;
  }

  // Medium amounts (< 1000): up to 4 decimals
  if (abs < 1000) {
    const formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
    return `${formatted} ${symbol}`;
  }

  // Large amounts: 2 decimals with commas
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${symbol}`;
}
