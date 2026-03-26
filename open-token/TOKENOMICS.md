# Open Token (OTK) — Tokenomics

## Overview

**Open Token (OTK)** is the native token of Open Chain — a multi-dimensional representation of human value.

- **Ticker:** OTK
- **Base unit:** uotk (micro-OTK)
- **Conversion:** 1 OTK = 1,000,000 uotk
- **Decimals:** 6
- **Chain:** Open Chain (Cosmos SDK + CometBFT)

## Distribution

As stated in the **Human Constitution** (Article III):

| Allocation | Amount | Percentage |
|---|---|---|
| Pre-mine | 0 | 0% |
| VC allocation | 0 | 0% |
| Founder tokens | 0 | 0% |
| **Earned through contribution** | **All** | **100%** |

OTK has no initial supply. All tokens are minted through verified human contributions.

## Value Channels

OTK flows through six distinct channels, each representing a different dimension of human value:

| Channel | Symbol | Represents | Examples |
|---|---|---|---|
| Economic | xOTK | Financial value transfer | Payments, trades, purchases |
| Nurture | nOTK | Parenting and caregiving | Childcare, emotional support, feeding |
| Education | eOTK | Teaching and mentoring | Tutoring, skill transfer, knowledge sharing |
| Health | hOTK | Healthcare and wellness | Medical care, nutrition, fitness |
| Community | cOTK | Service and social cohesion | Volunteering, conflict resolution, mutual aid |
| Governance | gOTK | Civic participation | Voting, proposals, public service |

## Minting Mechanism

OTK is minted when **verifiable human development milestones** are achieved:

### Nurture Milestones (nOTK)
- Healthy birth → 100 nOTK to parents + community
- Child thriving at ages 1, 2, 3, 5 → 50 nOTK each
- Positive upbringing report (at age of agency) → 500 nOTK retroactive

### Education Milestones (eOTK)
- Literacy achieved → 200 eOTK
- Primary education completed → 300 eOTK
- Vocational/higher education → 500 eOTK
- Teaching certification → 200 eOTK

### Health Milestones (hOTK)
- Vaccinations completed → 50 hOTK
- Regular health checkups → 20 hOTK per year
- Physical fitness benchmarks → 30 hOTK

### Community Milestones (cOTK)
- Community service (per 10 hours) → 10 cOTK
- Mentorship provided → 50 cOTK
- Conflict resolution → 30 cOTK

### Governance Milestones (gOTK)
- Vote participation → 5 gOTK per vote
- Proposal creation → 20 gOTK
- Public service → 100 gOTK per year

## Ripple Attribution

When OTK is minted for a milestone, it's distributed across Contribution Rings:

```
attribution = base_value / (ring_distance²)
```

| Ring | Distance | Attribution (% of 200 base) |
|---|---|---|
| Ring 1: Self | 1 | 200 (100%) |
| Ring 2: Family | 2 | 50 (25%) |
| Ring 3: Teachers | 3 | 22 (11%) |
| Ring 4: Community | 4 | 12 (6.25%) |
| Ring 5: City | 5 | 8 (4%) |
| Ring 6: Country | 6 | 5 (2.8%) |
| Ring 7: Humanity | 7 | 4 (2%) |

## Fee Model

- **Near-zero fixed fees** (not percentage-based)
- Default: 1000 uotk (0.001 OTK) per transaction
- Fees go to the validator reward pool
- Governance can adjust fees

## Staking

- Validators stake OTK to participate in consensus
- **Flat rewards** per epoch — not proportional to stake
- All active validators earn the same base reward
- This prevents wealth concentration

## Governance Weight

- **One human = one vote** (via Universal ID)
- NOT one token = one vote
- Token holdings do not increase voting power
- This is democracy, not plutocracy

## Supply Growth

- Supply grows with verified human contributions
- No arbitrary cap — as humanity does more good, more OTK exists
- Bounded by the rate of milestone verification
- Negative OTK (correction mechanism) provides deflationary pressure

## Interoperability

- OTK is IBC-compatible (Cosmos ecosystem)
- Can be bridged to Ethereum, Solana, and other chains via Open Wallet
- xOTK channel is directly tradeable on DEXs
- Other channels (nOTK, eOTK, etc.) are non-transferable reputation tokens
