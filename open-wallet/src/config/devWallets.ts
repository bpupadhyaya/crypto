/**
 * Dev Testing Wallets — 10 pre-built wallets for fast testing.
 *
 * ⚠️  REMOVE THIS FILE BEFORE PRODUCTION RELEASE ⚠️
 *
 * Each wallet has a unique BIP-39 seed phrase, password, and PIN.
 * Full encryption strength (Argon2id vault, real key derivation).
 * Pre-assigned demo balances for all tokens.
 */

// ── REMOVE BEFORE PRODUCTION ──
export const DEV_TESTING_ENABLED = true;
// ── REMOVE BEFORE PRODUCTION ──

export interface DevWallet {
  id: string;
  label: string;
  mnemonic: string;
  password: string;
  pin: string;
}

export const DEV_WALLETS: DevWallet[] = [
  {
    id: 'w1', label: 'W1',
    mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
    password: 'testpass01!', pin: '111111',
  },
  {
    id: 'w2', label: 'W2',
    mnemonic: 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong',
    password: 'testpass02!', pin: '222222',
  },
  {
    id: 'w3', label: 'W3',
    mnemonic: 'letter advice cage absurd amount doctor acoustic avoid letter advice cage above',
    password: 'testpass03!', pin: '333333',
  },
  {
    id: 'w4', label: 'W4',
    mnemonic: 'void come effort suffer camp survey warrior heavy shoot primary clutch crush open amazing screen patrol group space point ten exist slush involve unfold',
    password: 'testpass04!', pin: '444444',
  },
  {
    id: 'w5', label: 'W5',
    mnemonic: 'all hour make first leader extend hole alien behind guard gospel lava path output census museum junior mass reopen famous sing advance salt reform',
    password: 'testpass05!', pin: '555555',
  },
  {
    id: 'w6', label: 'W6',
    mnemonic: 'gesture rare since turn prosper digital poverty cotton remove behave afraid rural brave during aircraft aware lunch soccer grit river charge lonely convince vessel',
    password: 'testpass06!', pin: '666666',
  },
  {
    id: 'w7', label: 'W7',
    mnemonic: 'corn nut shell market exchange ostrich echo cousin play gas detect drip poet twin impact steak expect invest basket ankle prefer already music shoe',
    password: 'testpass07!', pin: '777777',
  },
  {
    id: 'w8', label: 'W8',
    mnemonic: 'trim elder concert people fiber rich rotate deal observe strategy wish key robust panic flee best parent resist bring wash cloth catalog supreme year',
    password: 'testpass08!', pin: '888888',
  },
  {
    id: 'w9', label: 'W9',
    mnemonic: 'faculty metal current umbrella hobby captain unusual range elite trophy problem planet virtual emerge kitten moral motor charge adapt chef venture flag flip approve',
    password: 'testpass09!', pin: '999999',
  },
  {
    id: 'w10', label: 'W10',
    mnemonic: 'organ clean ski output noise write piece suggest camp pottery purity scheme essay trust dune alert face seat carry expand member document annual supply',
    password: 'testpass10!', pin: '101010',
  },
];

// Default dev balances assigned to each wallet for testing
export const DEV_TEST_BALANCES: Record<string, number> = {
  BTC: 1.5,
  ETH: 15.0,
  SOL: 500,
  OTK: 10000,
  ATOM: 200,
  USDT: 5000,
  USDC: 5000,
  ADA: 10000,
  XRP: 8000,
  DOGE: 50000,
  DOT: 800,
  AVAX: 250,
  LINK: 1500,
  SUI: 3000,
  POL: 20000,
  BNB: 15,
  TON: 2000,
};
