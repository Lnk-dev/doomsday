# ADR-005: Solana for Blockchain

## Status
Accepted

## Context
We needed to choose a blockchain platform for the prediction market and token economy. Options considered:
- Ethereum (most popular, largest ecosystem)
- Solana (high throughput, low fees)
- Polygon (Ethereum L2, low fees)
- Arbitrum (Ethereum L2, EVM compatible)
- Base (Coinbase L2)

## Decision
Use Solana blockchain for all on-chain functionality.

## Consequences

### Positive
- Sub-second transaction finality
- Very low transaction fees (~$0.00025)
- High throughput (65,000 TPS theoretical)
- Growing DeFi and NFT ecosystem
- Good wallet support (Phantom, Solflare)
- Rust-based programs are performant
- SPL token standard is well-established

### Negative
- Network has had stability issues historically
- Smaller developer ecosystem than Ethereum
- Different programming model (accounts vs contracts)
- Rust learning curve for on-chain programs
- Less battle-tested for complex DeFi

### Mitigation
- Use established libraries (@solana/web3.js, Anchor)
- Build in retry logic for transaction failures
- Monitor network status and have fallback UX
- Start with simple token operations, add complexity gradually
