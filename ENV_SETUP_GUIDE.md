# Environment Variables Setup Guide

## Quick Setup

1. **Copy the template:**
   ```bash
   cd frontend
   cp .env.example .env.local
   ```

2. **Fill in your values** (see details below)

3. **Restart dev server:**
   ```bash
   pnpm dev
   ```

## Required Variables

### 1. WalletConnect Project ID

**How to get it:**
1. Visit https://cloud.walletconnect.com
2. Sign up or log in
3. Click "Create New Project"
4. Enter project name (e.g., "Encrypted Bidding Marketplace")
5. Copy the Project ID
6. Paste it in `.env.local`:
   ```
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=abc123def456...
   ```

### 2. Pinata API Keys

**How to get them:**
1. Visit https://pinata.cloud
2. Sign up or log in
3. Go to "API Keys" in the dashboard
4. Click "New Key"
5. Give it a name (e.g., "Bidding Marketplace")
6. Copy both:
   - API Key
   - Secret Key
7. Paste in `.env.local`:
   ```
   PINATA_API_KEY=your_api_key_here
   PINATA_SECRET_KEY=your_secret_key_here
   ```

### 3. Contract Address

**How to get it:**
1. Deploy contracts first:
   ```bash
   cd contracts
   pnpm deploy --network fhenix
   ```
2. Copy the contract address from the output
3. Paste in `.env.local`:
   ```
   NEXT_PUBLIC_AUCTION_CONTRACT_ADDRESS=0x1234567890abcdef...
   ```

## Optional Variables

### Etherscan API Key
Only needed for contract verification:
1. Visit https://etherscan.io/apis (or Fhenix explorer equivalent)
2. Create account and generate API key
3. Add to `.env.local`:
   ```
   ETHERSCAN_API_KEY=your_key_here
   ```

## Verification

After setting up, verify your configuration:

1. **Check variables are loaded:**
   ```bash
   # In browser console (F12)
   console.log(process.env.NEXT_PUBLIC_CHAIN_ID)
   ```

2. **Test wallet connection:**
   - Open the app
   - Click "Connect Wallet"
   - Should see WalletConnect modal

3. **Test IPFS upload:**
   - Create an auction
   - Upload an image
   - Should upload successfully

## Troubleshooting

### Variables not loading?
- ✅ Restart dev server after changing `.env.local`
- ✅ Make sure file is named `.env.local` (not `.env`)
- ✅ Check for typos in variable names
- ✅ Ensure all `NEXT_PUBLIC_*` variables are prefixed correctly

### WalletConnect not working?
- ✅ Verify Project ID is correct
- ✅ Check network tab for API errors
- ✅ Ensure you're using HTTPS in production

### IPFS uploads failing?
- ✅ Verify Pinata API keys are correct
- ✅ Check Pinata dashboard for usage limits
- ✅ Ensure file size is under limits

### Contract calls failing?
- ✅ Verify contract address is correct
- ✅ Ensure contract is deployed to correct network
- ✅ Check you're connected to Fhenix testnet

## Security Best Practices

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **Use different keys for testnet/mainnet**
3. **Rotate keys periodically**
4. **Don't share keys publicly**
5. **Use environment-specific files** (`.env.development`, `.env.production`)

## Production Setup

For production deployment (Vercel/Netlify):

1. Add environment variables in platform dashboard
2. Use same variable names
3. Set production values (mainnet contract addresses, etc.)
4. Redeploy after adding variables

## Example Complete `.env.local`

```env
NEXT_PUBLIC_CHAIN_ID=42069
NEXT_PUBLIC_RPC_URL=https://api.testnet.fhenix.xyz
NEXT_PUBLIC_BLOCK_EXPLORER=https://explorer.testnet.fhenix.xyz
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=abc123def456ghi789
NEXT_PUBLIC_AUCTION_CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
NEXT_PUBLIC_FHEVM_RPC_URL=https://api.testnet.fhenix.xyz
NEXT_PUBLIC_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
PINATA_API_KEY=your_actual_api_key_here
PINATA_SECRET_KEY=your_actual_secret_key_here
```

## Need Help?

- Check `SETUP.md` for detailed setup instructions
- Review `DEPLOYMENT_CHECKLIST.md` for deployment steps
- Check browser console for specific errors

