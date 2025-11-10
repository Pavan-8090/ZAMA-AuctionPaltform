#!/bin/bash

# Quick Deployment Script
# Run: bash QUICK_DEPLOY.sh

set -e

echo "🚀 Starting deployment process..."
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found in root directory"
    echo "Please create .env file with PRIVATE_KEY and RPC_URL"
    exit 1
fi

# Step 1: Install dependencies
echo "📦 Step 1: Installing dependencies..."
pnpm install
cd contracts && pnpm install && cd ..
cd frontend && pnpm install && cd ..
echo "✅ Dependencies installed"
echo ""

# Step 2: Compile contracts
echo "🔨 Step 2: Compiling contracts..."
cd contracts
pnpm compile
echo "✅ Contracts compiled"
echo ""

# Step 3: Deploy contracts
echo "🚀 Step 3: Deploying contracts to Fhenix testnet..."
echo "⚠️  Make sure you have:"
echo "   - PRIVATE_KEY in .env"
echo "   - Testnet tokens in your wallet"
echo ""
read -p "Continue with deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

pnpm deploy
CONTRACT_ADDRESS=$(pnpm deploy 2>&1 | grep "Contract Address:" | awk '{print $3}')

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo "⚠️  Could not extract contract address automatically"
    echo "Please copy it manually from the deployment output above"
else
    echo ""
    echo "✅ Contract deployed!"
    echo "📝 Contract Address: $CONTRACT_ADDRESS"
    echo ""
    echo "Next steps:"
    echo "1. Copy the contract address above"
    echo "2. Add it to frontend/.env.local as NEXT_PUBLIC_AUCTION_CONTRACT_ADDRESS"
    echo "3. Run: cd frontend && pnpm dev"
fi

cd ..





