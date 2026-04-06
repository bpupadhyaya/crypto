/**
 * Practice/Test Wallets — Production feature for user training & verification.
 *
 * Purpose:
 * - Let users practice all wallet features before creating a real wallet
 * - Let users verify every aspect of the application
 * - Let developers test production builds without dev server
 * - Collect performance data, logs, and user feedback
 *
 * These wallets use the SAME code path as real wallets.
 * Only difference: pre-filled credentials + practice token balances.
 */

export interface PracticeWallet {
  id: string;
  label: string;
  mnemonic: string;
  password: string;
  pin: string;
}

// All mnemonics generated with @scure/bip39 — valid BIP-39 checksums
export const PRACTICE_WALLETS: PracticeWallet[] = [
  {
    id: 'w1', label: 'W1',
    mnemonic: 'obey combine speak keep rent fashion razor cinnamon rally decrease erosion ceiling',
    password: 'practice01!', pin: '111111',
  },
  {
    id: 'w2', label: 'W2',
    mnemonic: 'foot choose office result melt infant company night foil dial payment matter',
    password: 'practice02!', pin: '222222',
  },
  {
    id: 'w3', label: 'W3',
    mnemonic: 'theory gloom celery jewel art boss favorite combine skate erode valid cabin',
    password: 'practice03!', pin: '333333',
  },
  {
    id: 'w4', label: 'W4',
    mnemonic: 'weekend plastic side nothing shy card talent ship lava index domain fresh',
    password: 'practice04!', pin: '444444',
  },
  {
    id: 'w5', label: 'W5',
    mnemonic: 'diet custom flame blossom sheriff pear mixed entire fix goose make favorite',
    password: 'practice05!', pin: '555555',
  },
  {
    id: 'w6', label: 'W6',
    mnemonic: 'problem best tomorrow silver blur glue bargain episode rural treat step annual park enable omit use type dwarf want garlic hungry sell protect joy',
    password: 'practice06!', pin: '666666',
  },
  {
    id: 'w7', label: 'W7',
    mnemonic: 'joke very horn pool ghost educate trim deputy click matter crawl comic retreat original trash tower force avocado despair silver head repair moon prison',
    password: 'practice07!', pin: '777777',
  },
  {
    id: 'w8', label: 'W8',
    mnemonic: 'siege author social vehicle foam correct carry screen betray unveil square hamster identify erupt flip ridge notable idle defense razor peace palm wreck animal',
    password: 'practice08!', pin: '888888',
  },
  {
    id: 'w9', label: 'W9',
    mnemonic: 'tell will outdoor release forum parade daughter voice alpha mandate crime insect apology slice art diet include female labor begin rug bread success fragile',
    password: 'practice09!', pin: '999999',
  },
  {
    id: 'w10', label: 'W10',
    mnemonic: 'cinnamon suffer august solve because hurry frequent pause erase acid unique submit orbit tenant square around very blouse core ranch scan mango talent roof',
    password: 'practice10!', pin: '101010',
  },
];

// Practice token balances (not real — for training purposes)
export const PRACTICE_BALANCES: Record<string, number> = {
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

// Instructions shown to user (collapsible)
export const PRACTICE_INSTRUCTIONS = {
  title: 'Test & Practice Wallets',
  purpose: 'Practice every feature of Open Wallet safely before creating your real wallet.',
  intro:
    'Open Wallet is 100% open source and zero-trust. You are in charge. ' +
    'These practice wallets let you verify, test, and explore every feature ' +
    'of the application — sending, receiving, swapping, security, and more — ' +
    'all without risking real funds.',
  howItWorks: [
    'Tap any Practice wallet below to instantly create a fully functional wallet.',
    'Each practice wallet comes pre-loaded with test tokens for all supported chains.',
    'Practice wallets use the exact same security (Argon2id encryption, PIN, biometrics) as real wallets.',
    'You can switch between practice wallets to simulate multi-device or multi-user scenarios.',
    'All transactions within practice wallets are simulated — no real funds are moved.',
  ],
  differences: [
    'Practice wallets: pre-filled seed phrase, password, and PIN for convenience.',
    'Real wallets: you create your own seed phrase (24 words) and choose your own password.',
    'Practice wallets: tokens are simulated (not real cryptocurrency).',
    'Real wallets: tokens are real and transactions are irreversible.',
    'Practice wallets: can be deleted and recreated instantly.',
    'Real wallets: if you lose your seed phrase, your funds are gone forever.',
  ],
  similarities: [
    'Same encryption: Argon2id vault with AES-256-GCM (quantum-resistant).',
    'Same key derivation: BIP-39 seed → BIP-44 addresses for all chains.',
    'Same signing: real cryptographic signatures (just not broadcast to real networks).',
    'Same UI: every screen, button, and flow is identical to the real experience.',
    'Same code: practice wallets run through the exact same code as real wallets.',
  ],
  verification:
    'Open Wallet is free and open source. You have every right to inspect every line of code. ' +
    'Since not everyone is familiar with coding, these practice wallets provide a user-friendly way ' +
    'for anyone to verify that the app works correctly before trusting it with real funds. ' +
    'Source code: github.com/bpupadhyaya/crypto',
  disableNote:
    'Once you create your real wallet, you can hide practice wallets from the sign-in screen ' +
    'in Settings. To hide them, you must have: created at least 3 practice wallets, switched ' +
    'between them, and completed at least one transaction in each — ensuring you are fully ' +
    'trained before using real funds.',
};

// Track practice wallet usage for disable requirement
export interface PracticeProgress {
  walletsCreated: string[];       // IDs of created wallets
  walletsSwitched: string[];      // IDs of wallets switched to
  walletsTransacted: string[];    // IDs of wallets with at least 1 transaction
}

export const PRACTICE_DISABLE_REQUIREMENTS = {
  minWalletsCreated: 3,
  minWalletsSwitched: 2,     // Must have switched at least between 2
  minWalletsTransacted: 1,   // At least 1 transaction in each of 1 wallet
};
