# Environment Variables Setup

## Quick Setup

### Option 1: Copy Template (Recommended)
```bash
cd frontend
cp env.local.template .env.local
```

Then edit `.env.local` and fill in your values.

### Option 2: Use Setup Script
```bash
cd frontend
bash setup-env.sh
```

## Required Values to Fill

### 1. WalletConnect Project ID
- Visit: https://cloud.walletconnect.com
- Create a project
- Copy the Project ID
- Replace `your_walletconnect_project_id_here` in `.env.local`

### 2. Pinata API Keys
- Visit: https://pinata.cloud
- Go to API Keys section
- Create a new key
- Copy API Key and Secret
- Replace `your_pinata_api_key_here` and `your_pinata_secret_key_here`

### 3. Contract Address
- Deploy contracts first: `cd contracts && pnpm deploy`
- Copy the deployed address
- Replace empty value in `NEXT_PUBLIC_AUCTION_CONTRACT_ADDRESS`

## Example .env.local

```env
NEXT_PUBLIC_CHAIN_ID=42069
NEXT_PUBLIC_RPC_URL=https://api.testnet.fhenix.xyz
NEXT_PUBLIC_BLOCK_EXPLORER=https://explorer.testnet.fhenix.xyz
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=abc123def456ghi789
NEXT_PUBLIC_AUCTION_CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
NEXT_PUBLIC_FHEVM_RPC_URL=https://api.testnet.fhenix.xyz
NEXT_PUBLIC_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
PINATA_API_KEY=your_actual_key_here
PINATA_SECRET_KEY=your_actual_secret_here
```

## After Setup

1. Save `.env.local`
2. Restart dev server: `pnpm dev`
3. Verify in browser console that variables are loaded

See `ENV_SETUP_GUIDE.md` for detailed instructions.

