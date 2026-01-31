#!/bin/bash
# Deploy AMM and Initialize Pool Script
# Run this when you have enough SOL (need ~2.5 SOL total)

set -e

echo "=== AMM Deployment Script ==="
echo "Current time: $(date)"

WALLET_ADDRESS="ET4GnuqB9Pa9rYuAyh83amD3yCD9uq6TGnEKF1BVi5Jx"
REQUIRED_SOL="2.5"

# Check current balance
echo ""
echo "Checking wallet balance..."
BALANCE_LAMPORTS=$(curl -s -X POST -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getBalance\",\"params\":[\"$WALLET_ADDRESS\"]}" \
  https://api.devnet.solana.com | jq -r '.result.value')

BALANCE_SOL=$(echo "scale=4; $BALANCE_LAMPORTS / 1000000000" | bc)
echo "Current balance: $BALANCE_SOL SOL"
echo "Required: ~$REQUIRED_SOL SOL"

# Check if we have enough
if (( $(echo "$BALANCE_SOL < $REQUIRED_SOL" | bc -l) )); then
  echo ""
  echo "Insufficient balance for deployment!"
  echo "Trying to request airdrop..."

  # Try airdrop
  AIRDROP_RESULT=$(curl -s -X POST -H "Content-Type: application/json" \
    -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"requestAirdrop\",\"params\":[\"$WALLET_ADDRESS\", 2000000000]}" \
    https://api.devnet.solana.com)

  if echo "$AIRDROP_RESULT" | grep -q '"result"'; then
    echo "Airdrop successful! Waiting 15 seconds for confirmation..."
    sleep 15

    # Re-check balance
    BALANCE_LAMPORTS=$(curl -s -X POST -H "Content-Type: application/json" \
      -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getBalance\",\"params\":[\"$WALLET_ADDRESS\"]}" \
      https://api.devnet.solana.com | jq -r '.result.value')
    BALANCE_SOL=$(echo "scale=4; $BALANCE_LAMPORTS / 1000000000" | bc)
    echo "New balance: $BALANCE_SOL SOL"
  else
    echo "Airdrop failed (rate limited). Please try again later or use:"
    echo "  - https://faucet.solana.com"
    echo "  - https://faucet.quicknode.com/solana/devnet"
    exit 1
  fi
fi

# Verify we now have enough
if (( $(echo "$BALANCE_SOL < $REQUIRED_SOL" | bc -l) )); then
  echo ""
  echo "Still insufficient balance. Please get more SOL and try again."
  exit 1
fi

echo ""
echo "=== Step 1: Deploy AMM Program ==="
cd "$(dirname "$0")/../programs"

# Check if AMM is already deployed
AMM_PROGRAM_ID="7w8ZdJZYBGtv8bZYo2sua6qjphwLVSqij2ebcBcsdtuF"
AMM_STATUS=$(curl -s -X POST -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getAccountInfo\",\"params\":[\"$AMM_PROGRAM_ID\"]}" \
  https://api.devnet.solana.com | jq -r '.result.value // "null"')

if [ "$AMM_STATUS" != "null" ]; then
  echo "AMM program already deployed!"
else
  echo "Deploying AMM program..."
  anchor deploy --program-name amm --provider.cluster devnet

  if [ $? -ne 0 ]; then
    echo "AMM deployment failed!"
    exit 1
  fi
  echo "AMM deployed successfully!"
fi

echo ""
echo "=== Step 2: Initialize AMM Pool ==="
cd "$(dirname "$0")/.."
npx tsx scripts/initialize-amm.ts

if [ $? -ne 0 ]; then
  echo "Pool initialization failed!"
  exit 1
fi

echo ""
echo "=== Deployment Complete! ==="
echo ""
echo "Verifying programs..."

# Verify prediction market
PM_STATUS=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getAccountInfo","params":["BMmGykphijTgvB7WMim9UVqi9976iibKf6uYAiGXC7Mc",{"encoding":"base64"}]}' \
  https://api.devnet.solana.com | jq -r '.result.value.executable // "false"')
echo "Prediction Market: $([ "$PM_STATUS" = "true" ] && echo "DEPLOYED" || echo "NOT FOUND")"

# Verify AMM
AMM_STATUS=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getAccountInfo","params":["7w8ZdJZYBGtv8bZYo2sua6qjphwLVSqij2ebcBcsdtuF",{"encoding":"base64"}]}' \
  https://api.devnet.solana.com | jq -r '.result.value.executable // "false"')
echo "AMM: $([ "$AMM_STATUS" = "true" ] && echo "DEPLOYED" || echo "NOT FOUND")"

# Final balance
FINAL_BALANCE=$(curl -s -X POST -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getBalance\",\"params\":[\"$WALLET_ADDRESS\"]}" \
  https://api.devnet.solana.com | jq -r '.result.value / 1000000000')
echo "Final balance: $FINAL_BALANCE SOL"
