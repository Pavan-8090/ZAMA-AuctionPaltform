# Setup Guide - Encrypted Bidding Marketplace

## Prerequisites

- Node.js 18+ and pnpm (or npm/yarn)
- MetaMask or compatible Web3 wallet
- Fhenix testnet configured in wallet
- Pinata account for IPFS (or use Web3.Storage)
- WalletConnect Project ID (get from https://cloud.walletconnect.com)

## Installation

### 1. Install Dependencies

```bash
# Install root dependencies
pnpm install

# Install contract dependencies
cd contracts
pnpm install

# Install frontend dependencies
cd ../frontend
pnpm install
```

### 2. Configure Environment Variables

Create `.env` files in both `contracts/` and `frontend/` directories:

**contracts/.env:**
```env
PRIVATE_KEY=your_private_key_here
NEXT_PUBLIC_RPC_URL=https://api.testnet.fhenix.xyz
ETHERSCAN_API_KEY=your_etherscan_key
```

**frontend/.env.local:**
```env
NEXT_PUBLIC_CHAIN_ID=42069
NEXT_PUBLIC_RPC_URL=https://api.testnet.fhenix.xyz
NEXT_PUBLIC_BLOCK_EXPLORER=https://explorer.testnet.fhenix.xyz
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_AUCTION_CONTRACT_ADDRESS=0x... # Fill after deployment
NEXT_PUBLIC_FHEVM_RPC_URL=https://api.testnet.fhenix.xyz
NEXT_PUBLIC_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
PINATA_API_KEY=your_pinata_key
PINATA_SECRET_KEY=your_pinata_secret
```

### 3. Deploy Smart Contracts

```bash
cd contracts

# Compile contracts
pnpm compile

# Run tests
pnpm test

# Deploy to Fhenix testnet
pnpm deploy
```

After deployment, copy the contract address and add it to `frontend/.env.local` as `NEXT_PUBLIC_AUCTION_CONTRACT_ADDRESS`.

### 4. Start Development Server

```bash
# From root directory
pnpm dev
```

Or from frontend directory:
```bash
cd frontend
pnpm dev
```

The app will be available at http://localhost:3000

## Getting Testnet Tokens

1. Visit Fhenix faucet: https://faucet.testnet.fhenix.xyz
2. Connect your wallet
3. Request testnet tokens

## Wallet Setup

### MetaMask Configuration

1. Open MetaMask
2. Go to Settings > Networks > Add Network
3. Add Fhenix Testnet:
   - Network Name: Fhenix Testnet
   - RPC URL: https://api.testnet.fhenix.xyz
   - Chain ID: 42069
   - Currency Symbol: tFHE
   - Block Explorer: https://explorer.testnet.fhenix.xyz

## Features

- ✅ Encrypted bidding using FHEVM
- ✅ Multi-wallet support (MetaMask, WalletConnect)
- ✅ IPFS image storage
- ✅ Real-time auction updates
- ✅ Encrypted reserve prices
- ✅ Secure bid reveal mechanism

## Troubleshooting

### FHEVM Not Initializing
- Ensure MetaMask is connected
- Check browser console for errors
- Verify Fhenix network is selected

### Contract Calls Failing
- Verify contract address in .env
- Check network is Fhenix testnet
- Ensure sufficient gas/tokens

### IPFS Upload Failing
- Verify Pinata API keys
- Check file size limits
- Try alternative IPFS service

## Production Deployment

1. Deploy contracts to Fhenix mainnet (when available)
2. Update environment variables
3. Build frontend: `cd frontend && pnpm build`
4. Deploy to Vercel/Netlify
5. Update contract addresses in production env vars

