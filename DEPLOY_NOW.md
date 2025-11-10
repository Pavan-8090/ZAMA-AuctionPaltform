# 🚀 Deployment Steps - Let's Deploy!

## Step 1: Verify Environment Setup

Make sure your root `.env` file has:
```env
PRIVATE_KEY=your_private_key_here
NEXT_PUBLIC_RPC_URL=https://api.testnet.fhenix.xyz
```

## Step 2: Install Dependencies

```bash
# Install root dependencies
pnpm install

# Install contract dependencies
cd contracts
pnpm install

# Install frontend dependencies
cd ../frontend
pnpm install
cd ..
```

## Step 3: Compile Contracts

```bash
cd contracts
pnpm compile
```

Expected output: `Compiled X Solidity files successfully`

## Step 4: Test Contracts (Optional but Recommended)

```bash
cd contracts
pnpm test
```

This verifies everything works before deployment.

## Step 5: Deploy Contracts

```bash
cd contracts
pnpm deploy
```

**What to expect:**
- Shows deployer address
- Shows account balance
- Deploys contract
- Prints contract address
- **Copy the contract address!**

**Example output:**
```
EncryptedAuction deployed to: 0x1234567890abcdef...
Add to .env:
NEXT_PUBLIC_AUCTION_CONTRACT_ADDRESS=0x1234567890abcdef...
```

## Step 6: Update Frontend Environment

1. Copy the contract address from deployment output
2. Create/update `frontend/.env.local`:
   ```bash
   cd frontend
   cp env.local.template .env.local
   ```

3. Edit `frontend/.env.local` and add:
   ```env
   NEXT_PUBLIC_AUCTION_CONTRACT_ADDRESS=0x... # Paste your deployed address
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
   PINATA_API_KEY=your_key
   PINATA_SECRET_KEY=your_secret
   ```

## Step 7: Start Frontend

```bash
cd frontend
pnpm dev
```

Visit: http://localhost:3000

## Step 8: Test the dApp

1. **Connect Wallet**
   - Click "Connect Wallet"
   - Select MetaMask or WalletConnect
   - Switch to Fhenix Testnet (Chain ID: 42069)

2. **Get Testnet Tokens**
   - Visit: https://faucet.testnet.fhenix.xyz
   - Request testnet tokens

3. **Create Test Auction**
   - Click "Create Auction"
   - Fill in details
   - Upload image (optional)
   - Set reserve price
   - Submit

4. **Test Bidding**
   - Go to auctions page
   - Click on an auction
   - Place an encrypted bid
   - Verify bid is submitted

## Troubleshooting

### Deployment Fails?
- ✅ Check PRIVATE_KEY is set in root `.env`
- ✅ Verify you have testnet tokens
- ✅ Check RPC URL is correct
- ✅ Ensure network is Fhenix testnet

### Frontend Not Connecting?
- ✅ Verify contract address in `.env.local`
- ✅ Check WalletConnect Project ID is set
- ✅ Ensure wallet is on Fhenix testnet
- ✅ Restart dev server after changing `.env.local`

### Contract Calls Failing?
- ✅ Verify contract address matches deployment
- ✅ Check you're on correct network
- ✅ Ensure sufficient gas/tokens
- ✅ Check browser console for errors

## Next Steps After Deployment

1. ✅ Test all features
2. ✅ Verify encrypted bidding works
3. ✅ Test bid reveal mechanism
4. ✅ Test refund withdrawal
5. ✅ Share with testers!

## 🎉 You're Ready!

Your dApp should now be running locally. Once everything works, you can deploy the frontend to Vercel/Netlify for public access.





