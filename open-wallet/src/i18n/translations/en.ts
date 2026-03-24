/**
 * English translations — the base language.
 * All other languages translate from this file.
 *
 * Naming convention: screen.component.key
 * Keep strings short — they must fit on small phone screens.
 */

export default {
  // ─── Common ───
  common: {
    send: 'Send',
    receive: 'Receive',
    swap: 'Swap',
    bridge: 'Bridge',
    stake: 'Stake',
    history: 'History',
    cancel: 'Cancel',
    confirm: 'Confirm',
    copy: 'Copy',
    share: 'Share',
    back: 'Back',
    next: 'Next',
    done: 'Done',
    error: 'Error',
    success: 'Success',
    loading: 'Loading...',
  },

  // ─── Home ───
  home: {
    appName: 'Open Wallet',
    simpleTagline: 'Your money, your control',
    proTagline: 'Universal DeFi Terminal',
    yourBalance: 'Your Balance',
    portfolioValue: 'Portfolio Value',
    tokens: '{{count}} token',
    tokens_other: '{{count}} tokens',
    chains: 'Chains',
    networkStatus: 'Network Status',
    backend: 'Backend',
    target: 'Target',
    server: 'Server',
    mobileP2P: 'Mobile P2P',
  },

  // ─── Onboarding ───
  onboarding: {
    title: 'Open Wallet',
    subtitle: 'Your money. Your control.\nEvery token. Every chain. One app.',
    createWallet: 'Create New Wallet',
    restoreWallet: 'Restore Existing Wallet',
    footer: '100% Open Source • Post-Quantum Encrypted',
    saveRecoveryPhrase: 'Save Your Recovery Phrase',
    saveWarning: 'Write these {{count}} words down in order. This is the ONLY way to recover your wallet. Never share it.',
    iveSavedIt: "I've Saved It",
    restoreTitle: 'Restore Your Wallet',
    restoreHint: 'Enter your 12 or 24 word recovery phrase, separated by spaces.',
    enterRecoveryPhrase: 'Enter recovery phrase...',
    setPassword: 'Set Your Password',
    passwordHint: 'This password encrypts your wallet on this device using post-quantum resistant encryption.',
    passwordPlaceholder: 'Password (8+ characters)',
    confirmPassword: 'Confirm password',
    createButton: 'Create Wallet',
    weakPassword: 'Password must be at least 8 characters.',
    passwordMismatch: 'Passwords do not match.',
    invalidPhrase: 'Please enter a 12 or 24 word recovery phrase.',
  },

  // ─── Send ───
  send: {
    title: 'Send',
    to: 'To',
    recipientPlaceholder: 'Recipient address',
    amount: 'Amount',
    estimatedFee: 'Estimated fee',
    confirmTitle: 'Confirm Transaction',
    confirmMessage: 'Send {{amount}} {{token}} to {{address}}?',
    sent: 'Transaction submitted successfully.',
    failed: 'Transaction failed. Please try again.',
    missingAddress: 'Please enter a recipient address.',
    invalidAmount: 'Please enter a valid amount.',
    invalidAddress: 'This is not a valid {{chain}} address.',
    irreversibleWarning: 'Double-check the address before sending. Transactions cannot be reversed.',
  },

  // ─── Receive ───
  receive: {
    title: 'Receive',
    scanToSend: 'Scan to send {{chain}}',
    yourAddress: 'Your {{chain}} address',
    tapToCopy: 'Tap to copy • Long press to share',
    copied: 'Address copied to clipboard',
    wrongTokenWarning: 'Only send {{chain}} and {{chain}}-compatible tokens to this address. Sending other tokens may result in permanent loss.',
  },

  // ─── Swap ───
  swap: {
    title: 'Swap',
    subtitle: 'Any token to any token, one tap',
    from: 'From',
    to: 'To',
    slippage: 'Slippage',
    route: 'Route',
    priceImpact: 'Price impact',
    bestRoute: 'Best route via DEX aggregator',
    popular: 'Popular',
    confirmTitle: 'Confirm Swap',
    confirmMessage: 'Swap {{fromAmount}} {{fromToken}} → ~{{toAmount}} {{toToken}}?',
    swapButton: 'Swap {{from}} → {{to}}',
    success: 'Swap executed successfully.',
    failed: 'Swap failed. Please try again.',
  },

  // ─── Mode ───
  mode: {
    pro: 'PRO',
    simple: 'SIMPLE',
  },
} as const;
