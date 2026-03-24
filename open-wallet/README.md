# Open Wallet

The universal crypto wallet — one app for every token, every chain, every exchange.

## Mission
Maintaining and improving human life at near-zero cost — from the financial perspective.

## What It Does
- Accept ANY token (BTC, ETH, SOL, ADA, and future tokens)
- Swap any token to any other token without leaving the wallet
- Built-in DEX aggregation and cross-chain bridges
- Post-quantum encryption for local key storage
- Adaptive UI: Simple Mode (general users) and Pro Mode (institutional/advanced)
- Bank account and fiat integration (UPI, M-Pesa, FedNow, SEPA, etc.)
- Hardware wallet support (Ledger, Trezor, Keystone)

## Tech Stack
- **Mobile:** React Native (mobile-first)
- **Core:** Rust (crypto operations, chain logic) via UniFFI
- **PQC:** ML-KEM-1024, ML-DSA, SPHINCS+ (hybrid schemes)
- **Networking:** libp2p (P2P ready)
- **State:** Zustand

## License
Open Source — 100% transparent, buildable from source
