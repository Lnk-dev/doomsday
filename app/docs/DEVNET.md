# Solana Devnet Deployment Guide

This document describes the Doomsday platform's Solana devnet deployment, including addresses, testing scripts, and development workflows.

## Deployed Programs

### Prediction Market
- **Program ID:** `BMmGykphijTgvB7WMim9UVqi9976iibKf6uYAiGXC7Mc`
- **Status:** ✅ Fully operational
- **Explorer:** [View on Solana Explorer](https://explorer.solana.com/address/BMmGykphijTgvB7WMim9UVqi9976iibKf6uYAiGXC7Mc?cluster=devnet)

### AMM (Liquidity Pool)
- **Program ID:** `9k1WNiR3e7yDkothG5LiAhm1ocJbRYy1Er3coNCYwkHK`
- **Status:** ⚠️ Deployed, pool initialization pending
- **Explorer:** [View on Solana Explorer](https://explorer.solana.com/address/9k1WNiR3e7yDkothG5LiAhm1ocJbRYy1Er3coNCYwkHK?cluster=devnet)

## Platform Configuration

### Platform Config PDA
- **Address:** `Ee9Qe1XBC6kvJTNwQ9pqEycwqHMJY1cPNguvMs2KWD79`
- **Fee:** 200 basis points (2%)
- **Seeds:** `["platform_config"]`

### Token Mints
| Token | Mint Address | Decimals |
|-------|--------------|----------|
| $DOOM | `9Dc8sELJerfzPfk9DMP5vahLFxvr6rzn7PB8E6EK4Ah5` | 9 |
| $LIFE | `D2DDKv5JXjL1APVBP1ySY3PMUFEjL7R8NRz9r9a4JCvE` | 9 |

## PDA Derivation

### Prediction Market PDAs

```typescript
// Platform Config
const [platformConfig] = PublicKey.findProgramAddressSync(
  [Buffer.from('platform_config')],
  PREDICTION_MARKET_PROGRAM_ID
);

// Event (by event ID)
const [event] = PublicKey.findProgramAddressSync(
  [Buffer.from('event'), eventId.toArrayLike(Buffer, 'le', 8)],
  PREDICTION_MARKET_PROGRAM_ID
);

// User Bet
const [userBet] = PublicKey.findProgramAddressSync(
  [Buffer.from('user_bet'), eventPubkey.toBuffer(), userPubkey.toBuffer()],
  PREDICTION_MARKET_PROGRAM_ID
);

// User Stats
const [userStats] = PublicKey.findProgramAddressSync(
  [Buffer.from('user_stats'), userPubkey.toBuffer()],
  PREDICTION_MARKET_PROGRAM_ID
);
```

### AMM PDAs

```typescript
// Liquidity Pool
const [pool] = PublicKey.findProgramAddressSync(
  [Buffer.from('pool')],
  AMM_PROGRAM_ID
);

// LP Token Mint
const [lpMint] = PublicKey.findProgramAddressSync(
  [Buffer.from('lp_mint')],
  AMM_PROGRAM_ID
);

// Pool DOOM Vault
const [poolDoom] = PublicKey.findProgramAddressSync(
  [Buffer.from('pool_doom')],
  AMM_PROGRAM_ID
);

// Pool LIFE Vault
const [poolLife] = PublicKey.findProgramAddressSync(
  [Buffer.from('pool_life')],
  AMM_PROGRAM_ID
);
```

## Testing Scripts

All scripts are located in the `scripts/` directory. Run with:

```bash
npx tsx scripts/<script-name>.ts
```

### Platform Management

| Script | Description | Usage |
|--------|-------------|-------|
| `initialize-platform.ts` | Initialize platform config | Run once to set up platform |
| `initialize-amm.ts` | Initialize AMM pool | Run once after AMM deployed |

### Event Operations

| Script | Description | Usage |
|--------|-------------|-------|
| `create-test-event.ts` | Create a prediction event | Modify EVENT_ID, TITLE, DESCRIPTION |
| `create-quick-event.ts` | Create short-deadline event | For testing resolution flow |
| `resolve-event.ts` | Resolve event (oracle) | Modify EVENT_ID, OUTCOME |
| `check-event.ts` | Check event status | `npx tsx scripts/check-event.ts <event_id>` |
| `fetch-events.ts` | Fetch all events | Lists all events with details |

### Betting Operations

| Script | Description | Usage |
|--------|-------------|-------|
| `place-bet.ts` | Place a bet on event | Modify EVENT_ID, OUTCOME, AMOUNT |
| `fetch-user-bets.ts` | Fetch user's bets | Shows all bets for wallet |
| `claim-winnings.ts` | Claim winnings | Documents claim flow |

## Test Data on Devnet

### Existing Events

| ID | Title | Status | DOOM Pool | LIFE Pool |
|----|-------|--------|-----------|-----------|
| 1 | Will BTC hit $100k by Q1 2026? | Active | 1 | 0 |
| 2 | Will ETH flip BTC market cap? | Active | 0 | 2 |
| 3 | Will AI surpass human reasoning? | Active | 0 | 0 |
| 100 | Quick Test Event | Resolved (DOOM) | 0 | 0 |

### Test Wallet
- **Address:** `ET4GnuqB9Pa9rYuAyh83amD3yCD9uq6TGnEKF1BVi5Jx`
- **Bets:** 2 (1 DOOM on Event #1, 2 LIFE on Event #2)

## Development Workflow

### 1. Set Up Local Environment

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Configure for devnet
solana config set --url devnet

# Create or import wallet
solana-keygen new  # or recover existing
```

### 2. Get Devnet SOL

```bash
# Request airdrop (rate-limited)
solana airdrop 2

# Alternative: Use Solana Faucet website
# https://faucet.solana.com/
```

### 3. Run Tests

```bash
# Fetch current events
npx tsx scripts/fetch-events.ts

# Create a new event
npx tsx scripts/create-test-event.ts

# Place a bet
npx tsx scripts/place-bet.ts

# Check event status
npx tsx scripts/check-event.ts 1
```

### 4. Frontend Development

```bash
# Start dev server
npm run dev

# The app connects to devnet automatically
# Configure RPC in .env if needed:
# VITE_SOLANA_NETWORK=devnet
# VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
```

## Troubleshooting

### "Airdrop request failed"
Devnet airdrops are rate-limited. Wait 24 hours or use [Solana Faucet](https://faucet.solana.com/).

### "Account not found"
The account hasn't been created yet. For events, run `create-test-event.ts` first.

### "InstructionFallbackNotFound"
Wrong instruction discriminator. Verify the discriminator matches the program's expected value:
```typescript
// Calculate discriminator
const discriminator = createHash('sha256')
  .update('global:<instruction_name>')
  .digest()
  .slice(0, 8)
```

### "DeclaredProgramIdMismatch"
The program was compiled with a different ID than deployed. Update `declare_id!()` in lib.rs and redeploy.

### Variable-length string parsing issues
Anchor strings use 4-byte length prefix + variable content, NOT fixed size:
```typescript
const titleLen = data.readUInt32LE(offset)
offset += 4
const title = data.slice(offset, offset + titleLen).toString('utf-8')
offset += titleLen  // Variable, not fixed!
```

## Environment Variables

```env
# Network configuration
VITE_SOLANA_NETWORK=devnet
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com

# Token mints (devnet)
VITE_DOOM_TOKEN_MINT=9Dc8sELJerfzPfk9DMP5vahLFxvr6rzn7PB8E6EK4Ah5
VITE_LIFE_TOKEN_MINT=D2DDKv5JXjL1APVBP1ySY3PMUFEjL7R8NRz9r9a4JCvE

# Program IDs (devnet)
VITE_PREDICTION_MARKET_PROGRAM=BMmGykphijTgvB7WMim9UVqi9976iibKf6uYAiGXC7Mc
VITE_AMM_PROGRAM=9k1WNiR3e7yDkothG5LiAhm1ocJbRYy1Er3coNCYwkHK
```

## Related Documentation

- [Solana Developer Docs](https://docs.solana.com/)
- [Anchor Framework](https://www.anchor-lang.com/)
- [SPL Token Program](https://spl.solana.com/token)
