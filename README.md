# Encrypted Bidding Marketplace

A decentralized auction platform built with Zama's FHEVM Relayer SDK, enabling sealed-bid auctions where all bids remain encrypted until reveal time.

## Features

- 🔐 Encrypted bidding using Zama FHEVM Relayer SDK
- 💼 Multi-wallet support (MetaMask, WalletConnect, Coinbase Wallet)
- 🖼️ IPFS integration for auction images (Pinata)
- ⏰ Real-time countdown timers
- 🎨 Modern, responsive UI with shadcn/ui
- 🔒 Secure smart contracts with OpenZeppelin
- 🌐 Multi-network support (Sepolia, Zama Devnet/Testnet, Fhenix, Localhost)

## Project Structure

```
encrypted-bidding-marketplace/
├── contracts/              # Smart contracts (Hardhat + FHEVM)
│   ├── contracts/         # Solidity contracts
│   ├── scripts/           # Deployment scripts
│   └── test/              # Contract tests
├── frontend/              # Next.js 14 frontend
│   ├── src/
│   │   ├── app/          # Next.js app router pages
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom React hooks
│   │   └── lib/          # Utilities & configs
│   └── env.local.template # Environment variables template
└── package.json          # Root workspace config (pnpm workspaces)
```

## Getting Started

### Prerequisites

- **Node.js 18+** (recommended: Node.js 20+)
- **pnpm** (or npm/yarn) - pnpm is recommended for monorepo
- **MetaMask** or compatible Web3 wallet
- **WalletConnect Project ID** - Get from [cloud.walletconnect.com](https://cloud.walletconnect.com)
- **Pinata Account** - For IPFS storage ([pinata.cloud](https://pinata.cloud))
- **Zama Relayer Configuration** - Required for encryption (see below)

### Installation

```bash
# Install all dependencies (root + contracts + frontend)
pnpm install

# Setup environment variables
cd frontend
cp env.local.template .env.local
# Edit .env.local with your actual values (see SETUP.md for details)
```

### Required Environment Variables

**Critical:** The app requires Zama FHEVM Relayer configuration to work. Copy `frontend/env.local.template` to `frontend/.env.local` and fill in:

1. **WalletConnect Project ID** - Required for wallet connections
2. **Pinata API Keys** - Required for IPFS image uploads
3. **Zama Relayer Variables** - Required for encryption (already in template, verify values)
4. **Contract Address** - After deploying contracts

See `SETUP.md` or `ENV_SETUP_GUIDE.md` for detailed instructions.

### Development

```bash
# Start frontend dev server (from root)
pnpm dev

# Or from frontend directory
cd frontend
pnpm dev

# Run contract tests
pnpm test

# Deploy contracts
pnpm deploy
```

The app will be available at `http://localhost:3000`

### Deploy Contracts First

**Important:** You must deploy contracts before the frontend will work:

```bash
cd contracts
pnpm compile
pnpm deploy
# Copy the contract address to frontend/.env.local
```

## Supported Networks

- **Sepolia Testnet** (Chain ID: 11155111) - Zama FHEVM supported
- **Zama Devnet** (Chain ID: 8009)
- **Zama Testnet** (Chain ID: 9000)
- **Fhenix Testnet** (Chain ID: 42069)
- **Localhost** (Chain ID: 1337) - For local development

Configure the target network in `frontend/.env.local` via `NEXT_PUBLIC_CHAIN_ID`.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Blockchain**: Solidity 0.8.20, Hardhat, Zama FHEVM
- **Wallet**: wagmi, viem, WalletConnect v2
- **Encryption**: Zama FHEVM Relayer SDK (`@zama-fhe/relayer-sdk`)
- **Storage**: IPFS via Pinata
- **UI**: React 18, Tailwind CSS, Lucide icons

## Documentation

- **SETUP.md** - Detailed setup instructions
- **ENV_SETUP_GUIDE.md** - Environment variables guide
- **QUICKSTART.md** - Quick start guide
- **ZAMA_SDK_INTEGRATION.md** - Zama SDK integration details

## Troubleshooting

### "Nothing happens when creating auction"
- Check browser console (F12) for errors
- Verify FHE initialization status (green indicator on create page)
- Ensure all environment variables are set correctly
- Check wallet is connected and on correct network

### "Encryption not initializing"
- Verify all `NEXT_PUBLIC_ZAMA_*` variables are set in `.env.local`
- Check browser console for specific error messages
- Ensure wallet is connected (FHE initializes after wallet connection)

### "WalletConnect not working"
- Verify `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set
- Get a valid Project ID from [cloud.walletconnect.com](https://cloud.walletconnect.com)
- Restart dev server after changing env vars

See `SETUP.md` for more troubleshooting tips.

## License

MIT

