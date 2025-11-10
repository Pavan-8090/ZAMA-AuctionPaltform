# Encrypted Bidding Marketplace

A decentralized auction platform built with Zama's FHEVM SDK, enabling sealed-bid auctions where all bids remain encrypted until reveal time.

## Features

- 🔐 Encrypted bidding using FHEVM
- 💼 Multi-wallet support (MetaMask, WalletConnect, Coinbase)
- 🖼️ IPFS integration for auction images
- ⏰ Real-time countdown timers
- 🎨 Modern, responsive UI
- 🔒 Secure smart contracts with OpenZeppelin

## Project Structure

```
encrypted-bidding-marketplace/
├── contracts/          # Smart contracts (Hardhat)
├── frontend/          # Next.js frontend
└── package.json       # Root workspace config
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- MetaMask or compatible wallet

### Installation

```bash
# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env
# Edit .env with your keys
```

### Development

```bash
# Start frontend dev server
pnpm dev

# Run contract tests
pnpm test

# Deploy contracts
pnpm deploy
```

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Blockchain**: Solidity, Hardhat, FHEVM
- **Wallet**: wagmi, viem, WalletConnect
- **Storage**: IPFS (Pinata)

## License

MIT

