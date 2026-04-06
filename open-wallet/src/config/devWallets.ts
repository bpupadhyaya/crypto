/**
 * Dev Testing Wallets — 10 pre-built wallets for fast testing.
 *
 * ⚠️  REMOVE THIS FILE BEFORE PRODUCTION RELEASE ⚠️
 *
 * Each wallet has a valid BIP-39 seed phrase, password, and PIN.
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

// All mnemonics generated with @scure/bip39 generateMnemonic — valid checksums
export const DEV_WALLETS: DevWallet[] = [
  {
    id: 'w1', label: 'W1',
    mnemonic: 'obey combine speak keep rent fashion razor cinnamon rally decrease erosion ceiling',
    password: 'testpass01!', pin: '111111',
  },
  {
    id: 'w2', label: 'W2',
    mnemonic: 'foot choose office result melt infant company night foil dial payment matter',
    password: 'testpass02!', pin: '222222',
  },
  {
    id: 'w3', label: 'W3',
    mnemonic: 'theory gloom celery jewel art boss favorite combine skate erode valid cabin',
    password: 'testpass03!', pin: '333333',
  },
  {
    id: 'w4', label: 'W4',
    mnemonic: 'weekend plastic side nothing shy card talent ship lava index domain fresh',
    password: 'testpass04!', pin: '444444',
  },
  {
    id: 'w5', label: 'W5',
    mnemonic: 'diet custom flame blossom sheriff pear mixed entire fix goose make favorite',
    password: 'testpass05!', pin: '555555',
  },
  {
    id: 'w6', label: 'W6',
    mnemonic: 'problem best tomorrow silver blur glue bargain episode rural treat step annual park enable omit use type dwarf want garlic hungry sell protect joy',
    password: 'testpass06!', pin: '666666',
  },
  {
    id: 'w7', label: 'W7',
    mnemonic: 'joke very horn pool ghost educate trim deputy click matter crawl comic retreat original trash tower force avocado despair silver head repair moon prison',
    password: 'testpass07!', pin: '777777',
  },
  {
    id: 'w8', label: 'W8',
    mnemonic: 'siege author social vehicle foam correct carry screen betray unveil square hamster identify erupt flip ridge notable idle defense razor peace palm wreck animal',
    password: 'testpass08!', pin: '888888',
  },
  {
    id: 'w9', label: 'W9',
    mnemonic: 'tell will outdoor release forum parade daughter voice alpha mandate crime insect apology slice art diet include female labor begin rug bread success fragile',
    password: 'testpass09!', pin: '999999',
  },
  {
    id: 'w10', label: 'W10',
    mnemonic: 'cinnamon suffer august solve because hurry frequent pause erase acid unique submit orbit tenant square around very blouse core ranch scan mango talent roof',
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
