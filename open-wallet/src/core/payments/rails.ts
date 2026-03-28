/**
 * Regional Payment Rails — fiat on/off ramp via local payment systems.
 *
 * Connects Open Wallet to regional payment networks for buying/selling
 * crypto with local currency. No single global provider — each region
 * uses its preferred system.
 *
 * Supported rails:
 *   - UPI (India) — Unified Payments Interface
 *   - M-Pesa (East Africa) — mobile money
 *   - FedNow (USA) — instant bank transfers
 *   - SEPA (Europe) — Single Euro Payments Area
 *   - PIX (Brazil) — instant payment system
 *   - PayNow (Singapore) — P2P payments
 *   - PromptPay (Thailand) — instant transfers
 */

export type PaymentRail =
  | 'upi'        // India
  | 'mpesa'      // Kenya, Tanzania, etc.
  | 'fednow'     // USA
  | 'sepa'       // EU/EEA
  | 'pix'        // Brazil
  | 'paynow'     // Singapore
  | 'promptpay'; // Thailand

export interface PaymentRailConfig {
  id: PaymentRail;
  name: string;
  region: string;
  currency: string;
  currencySymbol: string;
  minAmount: number;
  maxAmount: number;
  estimatedTime: string;
  fee: string;
  available: boolean;
  icon: string;
}

export const PAYMENT_RAILS: PaymentRailConfig[] = [
  {
    id: 'upi',
    name: 'UPI',
    region: 'India',
    currency: 'INR',
    currencySymbol: '₹',
    minAmount: 100,
    maxAmount: 100000,
    estimatedTime: 'Instant',
    fee: '0%',
    available: true,
    icon: '🇮🇳',
  },
  {
    id: 'mpesa',
    name: 'M-Pesa',
    region: 'East Africa',
    currency: 'KES',
    currencySymbol: 'KSh',
    minAmount: 50,
    maxAmount: 150000,
    estimatedTime: 'Instant',
    fee: '1%',
    available: true,
    icon: '🇰🇪',
  },
  {
    id: 'fednow',
    name: 'FedNow',
    region: 'United States',
    currency: 'USD',
    currencySymbol: '$',
    minAmount: 1,
    maxAmount: 500000,
    estimatedTime: 'Instant',
    fee: '0.1%',
    available: true,
    icon: '🇺🇸',
  },
  {
    id: 'sepa',
    name: 'SEPA Instant',
    region: 'Europe',
    currency: 'EUR',
    currencySymbol: '€',
    minAmount: 1,
    maxAmount: 100000,
    estimatedTime: '10 seconds',
    fee: '0.2%',
    available: true,
    icon: '🇪🇺',
  },
  {
    id: 'pix',
    name: 'PIX',
    region: 'Brazil',
    currency: 'BRL',
    currencySymbol: 'R$',
    minAmount: 1,
    maxAmount: 50000,
    estimatedTime: 'Instant',
    fee: '0%',
    available: true,
    icon: '🇧🇷',
  },
  {
    id: 'paynow',
    name: 'PayNow',
    region: 'Singapore',
    currency: 'SGD',
    currencySymbol: 'S$',
    minAmount: 1,
    maxAmount: 200000,
    estimatedTime: 'Instant',
    fee: '0%',
    available: true,
    icon: '🇸🇬',
  },
  {
    id: 'promptpay',
    name: 'PromptPay',
    region: 'Thailand',
    currency: 'THB',
    currencySymbol: '฿',
    minAmount: 1,
    maxAmount: 2000000,
    estimatedTime: 'Instant',
    fee: '0%',
    available: true,
    icon: '🇹🇭',
  },
];

/**
 * Get available payment rails for a given currency/region.
 */
export function getRailsForCurrency(currency: string): PaymentRailConfig[] {
  return PAYMENT_RAILS.filter((r) => r.currency === currency && r.available);
}

/**
 * Get all available payment rails.
 */
export function getAllRails(): PaymentRailConfig[] {
  return PAYMENT_RAILS.filter((r) => r.available);
}

/**
 * Detect user's likely payment rail based on locale.
 */
export function detectRailForLocale(locale: string): PaymentRailConfig | undefined {
  const map: Record<string, PaymentRail> = {
    'en-IN': 'upi', 'hi-IN': 'upi', 'hi': 'upi',
    'sw-KE': 'mpesa', 'en-KE': 'mpesa', 'sw-TZ': 'mpesa',
    'en-US': 'fednow',
    'de-DE': 'sepa', 'fr-FR': 'sepa', 'es-ES': 'sepa', 'it-IT': 'sepa', 'nl-NL': 'sepa',
    'pt-BR': 'pix',
    'en-SG': 'paynow', 'zh-SG': 'paynow',
    'th-TH': 'promptpay',
  };
  const rail = map[locale];
  if (rail) return PAYMENT_RAILS.find((r) => r.id === rail);
  return undefined;
}

/**
 * Generate a payment intent for buying crypto via a regional rail.
 * Returns a deep link or payment URI that opens the user's banking app.
 */
export interface PaymentIntent {
  rail: PaymentRail;
  amount: number;
  currency: string;
  cryptoAmount: number;
  cryptoSymbol: string;
  paymentURI: string;    // Deep link to open banking app
  qrData: string;        // QR code data for the payment
  expiresAt: number;     // Timestamp
  reference: string;     // Unique payment reference
}

export function createPaymentIntent(params: {
  rail: PaymentRail;
  fiatAmount: number;
  cryptoSymbol: string;
  cryptoPrice: number;
  receiverAddress: string;
}): PaymentIntent {
  const { rail, fiatAmount, cryptoSymbol, cryptoPrice, receiverAddress } = params;
  const cryptoAmount = fiatAmount / cryptoPrice;
  const reference = `OW-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // Generate payment URI based on rail
  let paymentURI = '';
  let qrData = '';

  switch (rail) {
    case 'upi':
      // UPI deep link format
      paymentURI = `upi://pay?pa=openwallet@upi&pn=Open%20Wallet&am=${fiatAmount}&cu=INR&tn=${reference}`;
      qrData = paymentURI;
      break;
    case 'mpesa':
      // M-Pesa payment reference
      paymentURI = `mpesa://pay?phone=254000000000&amount=${fiatAmount}&reference=${reference}`;
      qrData = reference;
      break;
    case 'pix':
      // PIX QR code (simplified — real PIX uses EMV format)
      paymentURI = `pix://pay?key=openwallet@pix&amount=${fiatAmount}&reference=${reference}`;
      qrData = paymentURI;
      break;
    case 'fednow':
      // FedNow uses ISO 20022 — simplified
      paymentURI = `fednow://transfer?amount=${fiatAmount}&reference=${reference}`;
      qrData = reference;
      break;
    case 'sepa':
      // SEPA credit transfer
      paymentURI = `sepa://transfer?iban=DE89370400440532013000&amount=${fiatAmount}&reference=${reference}`;
      qrData = `BCD\n002\n1\nSCT\n\nOpen Wallet\nDE89370400440532013000\nEUR${fiatAmount}\n\n\n${reference}`;
      break;
    default:
      paymentURI = `pay://${rail}?amount=${fiatAmount}&reference=${reference}`;
      qrData = reference;
  }

  return {
    rail,
    amount: fiatAmount,
    currency: PAYMENT_RAILS.find((r) => r.id === rail)?.currency ?? 'USD',
    cryptoAmount,
    cryptoSymbol,
    paymentURI,
    qrData,
    expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
    reference,
  };
}
