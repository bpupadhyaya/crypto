# Privacy Policy — Open Wallet

**Effective Date:** March 27, 2026

Open Wallet is an open-source, non-custodial cryptocurrency wallet developed by Bhim Upadhyaya. This policy explains how the application handles your data.

## 1. Non-Custodial Architecture

Open Wallet is fully non-custodial. Your private keys, seed phrases, and wallet credentials are generated and stored exclusively on your device. They are never transmitted to any server, cloud service, or third party. If you lose your device and have not backed up your seed phrase, your funds cannot be recovered by anyone, including the developers.

## 2. Personal Data Collection

Open Wallet does not collect, store, or transmit any personal data. There are no analytics, no usage tracking, no telemetry, no crash reporters, and no advertising SDKs. The application does not require an account, email address, or any form of registration.

## 3. Camera Access

The application requests camera access solely for the purpose of scanning QR codes containing recipient wallet addresses. Camera data is processed locally on the device in real time and is never recorded, stored, or transmitted.

## 4. Biometric Authentication

Open Wallet may use your device's biometric capabilities (Face ID, Touch ID, or fingerprint) for local authentication to unlock the wallet. Biometric data is processed entirely by your device's secure enclave. Open Wallet never accesses, stores, or transmits biometric data. The application only receives a success or failure response from the operating system.

## 5. Third-Party Services

Open Wallet interacts with the following third-party services for specific features. Each service may have its own privacy policy:

- **CoinGecko** (coingecko.com): Used to fetch cryptocurrency price data. No user-identifying information is sent; only token identifiers are included in API requests.

- **Li.Fi** (li.fi): Used for cross-chain bridge quotes and routing on EVM chains. Bridge quote requests contain token and amount information but no personal data.

- **THORChain** (thorchain.org): Used for native Bitcoin bridge swaps. Swap quote requests contain token and amount information but no personal data.

- **On-Ramp Providers** — MoonPay, Transak, and Ramp: If you choose to purchase cryptocurrency through one of these providers, you will interact with their service directly via an embedded web view. These providers require identity verification (KYC) under their own privacy policies. Open Wallet does not have access to the data you provide to these services.

## 6. Network Communication

When you submit a transaction, the signed transaction data is broadcast to the relevant blockchain network via public RPC endpoints. This is inherent to how blockchains operate. Transaction data on public blockchains is permanently visible to anyone.

## 7. Local Storage

Wallet data (encrypted vault, settings, paper trade history) is stored locally on your device using the operating system's secure storage mechanisms. This data is not synced to any cloud service.

## 8. Open Source

Open Wallet is open source. You can audit the complete source code to verify these privacy claims:

**Repository:** https://github.com/bpupadhyaya/crypto

## 9. Children's Privacy

Open Wallet is not directed at children under 17. The application involves financial transactions and is rated 17+ on app stores.

## 10. Changes to This Policy

Any changes to this privacy policy will be published in the source code repository and reflected in updated app versions. The effective date at the top of this document will be updated accordingly.

## 11. Contact

For questions about this privacy policy, please open an issue on the GitHub repository:

https://github.com/bpupadhyaya/crypto/issues
