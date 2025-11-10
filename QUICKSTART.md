# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies

```bash
pnpm install
```

### Step 2: Setup Environment

Copy `.env.example` to `.env` in both `contracts/` and `frontend/` directories and fill in your keys.

**Required:**
- WalletConnect Project ID: https://cloud.walletconnect.com
- Pinata API keys: https://pinata.cloud
- Private key for deployment (keep secure!)

### Step 3: Deploy Contracts

```bash
cd contracts
pnpm compile
pnpm deploy
```

Copy the deployed contract address to `frontend/.env.local` as `NEXT_PUBLIC_AUCTION_CONTRACT_ADDRESS`.

### Step 4: Start Frontend

```bash
cd ../frontend
pnpm dev
```

Visit http://localhost:3000

### Step 5: Connect Wallet

1. Install MetaMask
2. Add Fhenix Testnet (Chain ID: 42069)
3. Get testnet tokens from faucet
4. Connect wallet in the app

## ✅ You're Ready!

- Create auctions with encrypted reserve prices
- Place encrypted bids
- Reveal bids after auction ends
- Winner automatically determined

## 📚 Documentation

- Full setup: See `SETUP.md`
- Contract docs: See `contracts/README.md`
- Frontend docs: See `frontend/README.md`

## 🐛 Issues?

Check `SETUP.md` troubleshooting section or open an issue on GitHub.

