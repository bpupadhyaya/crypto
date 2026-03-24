# Open Chain

A sovereign, mobile-first, post-quantum-ready blockchain for the Open Wallet ecosystem.

## Mission
Provide planet-scale financial infrastructure that every human can participate in — as a user and as a validator.

## Architecture
- **Framework:** Cosmos SDK + CometBFT
- **Consensus:** Delegated Proof of Stake with probabilistic mobile validator selection
- **Interoperability:** IBC (50+ Cosmos chains), Axelar/THORChain bridges for BTC/ETH/SOL
- **PQC:** Hybrid ML-DSA-65 + Ed25519 on-chain signatures (native quantum resistance)
- **Scalability:** Geographic sharding (regional zones) + sovereign rollups per country
- **ZK Proofs:** Plonky2/Nova recursive SNARKs — entire chain state in ~50KB proof

## Progressive Mobile-First Strategy
- 2026-2028: Server validators (standard Cosmos)
- 2028-2032: Hybrid phone + server validation
- 2032+: 100% mobile peer-to-peer validation

## Modules
- Auth (PQC signatures)
- Bank
- Staking
- DEX (concentrated liquidity AMM)
- Bridge (IBC + external chain adapters)
- Governance (DAO)
- Fee (near-zero fixed fees)

## License
Open Source
