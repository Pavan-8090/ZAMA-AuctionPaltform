# Deployment Checklist

## Pre-Deployment

### Smart Contracts
- [ ] All tests passing (`pnpm test` in contracts/)
- [ ] Contract compiled successfully (`pnpm compile`)
- [ ] Security review completed
- [ ] Gas optimization reviewed
- [ ] Contract addresses documented

### Frontend
- [ ] Build succeeds (`pnpm build` in frontend/)
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] All environment variables set
- [ ] WalletConnect Project ID configured
- [ ] IPFS/Pinata API keys configured

## Deployment Steps

### 1. Deploy Smart Contracts

```bash
cd contracts

# Test deployment on local network first
npx hardhat node
# In another terminal:
pnpm deploy --network localhost

# Deploy to Fhenix testnet
pnpm deploy --network fhenix
```

**After deployment:**
- [ ] Copy contract address
- [ ] Verify contract on block explorer
- [ ] Update `frontend/.env.local` with contract address

### 2. Configure Frontend

Update `frontend/.env.local`:
```env
NEXT_PUBLIC_AUCTION_CONTRACT_ADDRESS=0x... # From deployment
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
PINATA_API_KEY=your_key
PINATA_SECRET_KEY=your_secret
```

### 3. Build Frontend

```bash
cd frontend
pnpm build
```

### 4. Deploy Frontend

**Vercel:**
```bash
vercel --prod
```

**Netlify:**
- Connect GitHub repo
- Build command: `cd frontend && pnpm build`
- Publish directory: `frontend/.next`

**Manual:**
```bash
cd frontend
pnpm start
```

## Post-Deployment

### Testing
- [ ] Connect wallet (MetaMask)
- [ ] Switch to Fhenix testnet
- [ ] Create test auction
- [ ] Submit encrypted bid
- [ ] Wait for auction end
- [ ] Reveal bids
- [ ] Verify winner selection
- [ ] Test refund withdrawal

### Monitoring
- [ ] Setup error tracking (Sentry)
- [ ] Monitor transaction failures
- [ ] Check gas usage
- [ ] Monitor IPFS uploads

### Documentation
- [ ] Update README with deployed addresses
- [ ] Document known issues
- [ ] Create user guide

## Rollback Plan

If issues occur:
1. Pause contract (owner only): `auction.pause()`
2. Revert frontend deployment
3. Investigate and fix issues
4. Redeploy after fixes

## Security Checklist

- [ ] Private keys secured (never commit)
- [ ] Environment variables not exposed
- [ ] Contract verified on explorer
- [ ] Access controls tested
- [ ] Reentrancy guards verified
- [ ] FHE key management secure

## Support

- Contract issues: Check Hardhat logs
- Frontend issues: Check browser console
- FHEVM issues: Verify network connection
- IPFS issues: Check Pinata dashboard

