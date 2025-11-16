# Encrypted Bidding Marketplace - Complete Build Prompt

```markdown
Build a production-ready Encrypted Bidding Marketplace dApp using Zama's FHEVM SDK. This platform enables sealed-bid auctions where all bids remain encrypted until reveal time, preventing bid manipulation and ensuring fair competition.

## Project Overview

Create a decentralized auction platform where:
- Sellers create auctions with encrypted reserve prices
- Bidders submit encrypted bids (amounts hidden from everyone)
- All bids remain encrypted until auction end
- Bids are revealed and winner determined automatically
- Complete privacy throughout the bidding process

## Technical Stack

**Frontend:**
- Next.js 14+ (App Router) with TypeScript
- Tailwind CSS + shadcn/ui components
- @wagmi/core v2+ for wallet connection
- @tanstack/react-query for data fetching
- viem for Ethereum interactions
- WalletConnect v2 for multi-wallet support
- @fhenixprotocol/fhevm-js for Zama FHEVM integration
- date-fns for auction timing

**Smart Contracts:**
- Solidity ^0.8.20+
- Hardhat framework
- OpenZeppelin Contracts (Ownable, ReentrancyGuard, Pausable)
- Hardhat Test Suite with Chai/Mocha
- Slither for security audits
- FHE-enabled contracts for encrypted operations

**Development:**
- pnpm package manager
- ESLint + Prettier
- TypeScript strict mode
- Husky + lint-staged
- GitHub Actions CI/CD

## Core Features Required

### 1. Auction Management
- Create auction (seller sets item, description, end time, encrypted reserve price)
- List active auctions with encrypted details
- View auction details (item info visible, prices encrypted)
- Cancel auction (seller only, before bidding starts)
- Extend auction time (if bids near end)

### 2. Encrypted Bidding System (FHEVM)
- Submit encrypted bid (amount encrypted using FHEVM)
- View own encrypted bid (for verification)
- Cannot see other bidders' bids until reveal
- Bid validation (must be higher than previous encrypted bid)
- Multiple bids per user (allow bid increases)
- Encrypted reserve price check (bid must exceed if set)

### 3. Bid Reveal & Winner Selection
- Automatic reveal at auction end time
- Decrypt all bids simultaneously
- Determine winner (highest bidder)
- Handle ties (first bidder wins or custom logic)
- Refund losing bidders automatically
- Transfer item ownership to winner

### 4. Wallet Connection System
- Multi-wallet support (MetaMask, WalletConnect, Coinbase Wallet)
- Network switching (Fhenix testnet/mainnet)
- Account management and disconnection
- Transaction status tracking (bid submission, reveal, refunds)
- Error handling for wallet rejections
- Persistent connection state

### 5. User Interface
- Dashboard (my auctions, my bids, won items)
- Create auction form with image upload (IPFS integration)
- Active auctions listing with countdown timers
- Bid submission interface with encrypted amount input
- Auction detail page with bid history (encrypted until reveal)
- Winner announcement page
- Transaction history
- Responsive design (mobile-first)
- Dark/light theme toggle

### 6. Security Features
- Reentrancy guards on all payment functions
- Access control (only seller can cancel, only bidders can bid)
- Input validation (bid amounts, auction times)
- Encrypted data validation (FHE key verification)
- Pause functionality for emergencies
- Rate limiting for API calls

## Smart Contract Architecture

### Main Contract: EncryptedAuction.sol

```solidity
// Key functions:
- createAuction(itemId, encryptedReservePrice, endTime) -> auctionId
- submitBid(auctionId, encryptedBidAmount) -> bidId
- revealBids(auctionId) -> winner address
- withdrawRefund(auctionId) -> refund amount
- cancelAuction(auctionId) -> (seller only)
- getAuctionDetails(auctionId) -> Auction struct
- getMyBids(auctionId) -> encrypted bid array
```

### Data Structures:
- Auction: id, seller, itemId, encryptedReservePrice, endTime, status, winner
- Bid: bidder, encryptedAmount, timestamp, revealed, refunded
- Item: name, description, imageURI, category

### FHEVM Integration:
- Use FHE types (euint32, euint64) for encrypted values
- Re-encryption for bid comparisons
- Encrypted balance queries for bid validation
- Private computation for winner determination

## Project Structure

```
encrypted-bidding-marketplace/
├── contracts/
│   ├── contracts/
│   │   ├── EncryptedAuction.sol
│   │   ├── AuctionItem.sol
│   │   ├── interfaces/
│   │   │   ├── IFHEVM.sol
│   │   │   └── IAuction.sol
│   ├── scripts/
│   │   ├── deploy.ts
│   │   ├── verify.ts
│   │   └── seed-auctions.ts
│   ├── test/
│   │   ├── EncryptedAuction.test.ts
│   │   ├── FHEOperations.test.ts
│   │   └── helpers/
│   ├── hardhat.config.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx (home/dashboard)
│   │   │   ├── create-auction/
│   │   │   │   └── page.tsx
│   │   │   ├── auction/[id]/
│   │   │   │   └── page.tsx
│   │   │   └── providers.tsx
│   │   ├── components/
│   │   │   ├── wallet/
│   │   │   │   ├── WalletConnectButton.tsx
│   │   │   │   └── WalletInfo.tsx
│   │   │   ├── auction/
│   │   │   │   ├── AuctionCard.tsx
│   │   │   │   ├── AuctionDetail.tsx
│   │   │   │   ├── CreateAuctionForm.tsx
│   │   │   │   ├── BidForm.tsx
│   │   │   │   └── CountdownTimer.tsx
│   │   │   ├── fhe/
│   │   │   │   ├── EncryptedBidInput.tsx
│   │   │   │   └── BidRevealStatus.tsx
│   │   │   └── ui/ (shadcn components)
│   │   ├── hooks/
│   │   │   ├── useWallet.ts
│   │   │   ├── useAuction.ts
│   │   │   ├── useBid.ts
│   │   │   ├── useFHE.ts
│   │   │   └── useIPFS.ts
│   │   ├── lib/
│   │   │   ├── wagmi.ts
│   │   │   ├── fhevm.ts
│   │   │   ├── ipfs.ts
│   │   │   └── utils.ts
│   │   ├── types/
│   │   │   ├── auction.ts
│   │   │   └── fhe.ts
│   │   └── styles/
│   ├── public/
│   ├── next.config.js
│   ├── tailwind.config.ts
│   └── package.json
├── .env.example
├── .gitignore
├── README.md
└── package.json (workspace root)
```

## Implementation Phases

### Phase 1: Setup & Configuration (Week 1)
- [ ] Initialize monorepo structure
- [ ] Configure Hardhat with Fhenix testnet
- [ ] Setup Next.js 14 with TypeScript and Tailwind
- [ ] Install and configure wagmi v2, viem, WalletConnect
- [ ] Install @fhenixprotocol/fhevm-js
- [ ] Setup IPFS client (Pinata or Web3.Storage)
- [ ] Configure ESLint, Prettier, Husky
- [ ] Create environment variable templates

### Phase 2: Smart Contract Development (Week 2-3)
- [ ] Write EncryptedAuction.sol with FHE types
- [ ] Implement auction creation with encrypted reserve price
- [ ] Implement encrypted bid submission
- [ ] Add bid reveal mechanism
- [ ] Implement winner selection logic
- [ ] Add refund functionality for losing bidders
- [ ] Implement access control (Ownable, roles)
- [ ] Add events (AuctionCreated, BidSubmitted, AuctionEnded, WinnerSelected)
- [ ] Write comprehensive unit tests (>90% coverage)
- [ ] Test FHE operations (encrypted comparisons)
- [ ] Add NatSpec documentation
- [ ] Run Slither security audit
- [ ] Fix any security issues
- [ ] Deploy to Fhenix testnet
- [ ] Verify contracts on block explorer

### Phase 3: FHEVM Integration (Week 3-4)
- [ ] Initialize FHEVM instance with provider
- [ ] Implement FHE key generation (generatePublicKey)
- [ ] Create useFHE hook for encrypted operations
- [ ] Implement encrypted bid amount handling
- [ ] Add re-encryption for bid comparisons
- [ ] Create encrypted reserve price handling
- [ ] Implement encrypted balance queries
- [ ] Add FHE key management (store/retrieve)
- [ ] Create UI components for encrypted inputs
- [ ] Test encrypted operations end-to-end

### Phase 4: Wallet Integration (Week 4)
- [ ] Create WalletConnectButton component
- [ ] Implement wagmi hooks (useAccount, useConnect, useDisconnect)
- [ ] Add network switching (useSwitchChain)
- [ ] Create network indicator component
- [ ] Implement transaction status tracking
- [ ] Add error handling with user-friendly messages
- [ ] Create wallet disconnection flow
- [ ] Add persistent connection state

### Phase 5: Frontend Auction Features (Week 5-6)
- [ ] Create auction listing page with filters
- [ ] Build CreateAuctionForm with IPFS image upload
- [ ] Implement auction detail page
- [ ] Create BidForm component with encrypted input
- [ ] Add countdown timer component
- [ ] Implement bid history display (encrypted until reveal)
- [ ] Create winner announcement component
- [ ] Build user dashboard (my auctions, my bids)
- [ ] Add auction status indicators
- [ ] Implement search and filter functionality

### Phase 6: Contract Interaction Layer (Week 6)
- [ ] Create useAuction hook (read/write operations)
- [ ] Implement useBid hook for bid operations
- [ ] Add useContractRead for auction data
- [ ] Implement useContractWrite for transactions
- [ ] Setup event listeners (useContractEvent)
- [ ] Create transaction queue system
- [ ] Add gas estimation hooks
- [ ] Implement transaction confirmation flow
- [ ] Add retry logic for failed transactions

### Phase 7: UI/UX Polish (Week 7)
- [ ] Design responsive layout (mobile/tablet/desktop)
- [ ] Implement loading states and skeletons
- [ ] Add React Error Boundaries
- [ ] Create toast notification system (react-hot-toast)
- [ ] Build transaction history component
- [ ] Implement dark/light theme switcher
- [ ] Add ARIA labels for accessibility
- [ ] Create empty states for no auctions/bids
- [ ] Add loading animations
- [ ] Implement smooth transitions

### Phase 8: Testing & Security (Week 8)
- [ ] Write E2E tests with Playwright
- [ ] Test wallet connection flows
- [ ] Test auction creation flow
- [ ] Test encrypted bid submission
- [ ] Test bid reveal and winner selection
- [ ] Test refund functionality
- [ ] Security audit of frontend code
- [ ] Performance optimization (Lighthouse)
- [ ] Cross-browser testing
- [ ] Mobile device testing

### Phase 9: Deployment (Week 8)
- [ ] Deploy contracts to Fhenix testnet
- [ ] Verify contracts on block explorer
- [ ] Deploy frontend to Vercel
- [ ] Configure environment variables
- [ ] Setup monitoring (Sentry)
- [ ] Add analytics (optional)
- [ ] Create deployment documentation
- [ ] Write user guide

## Smart Contract Key Functions

### EncryptedAuction.sol Structure:

```solidity
// State Variables
mapping(uint256 => Auction) public auctions;
mapping(uint256 => Bid[]) public bids; // auctionId => bids
mapping(uint256 => mapping(address => bool)) public hasBid;
uint256 public auctionCounter;

// Events
event AuctionCreated(uint256 indexed auctionId, address indexed seller, uint256 endTime);
event BidSubmitted(uint256 indexed auctionId, address indexed bidder, uint256 bidId);
event AuctionEnded(uint256 indexed auctionId, address indexed winner, uint256 winningBid);
event RefundProcessed(uint256 indexed auctionId, address indexed bidder, uint256 amount);

// Functions
function createAuction(
    string memory itemName,
    string memory itemDescription,
    string memory imageURI,
    euint32 encryptedReservePrice, // FHE encrypted
    uint256 duration // in seconds
) external returns (uint256);

function submitBid(
    uint256 auctionId,
    euint32 encryptedBidAmount // FHE encrypted
) external payable returns (uint256);

function revealBids(uint256 auctionId) external;

function withdrawRefund(uint256 auctionId) external;

function cancelAuction(uint256 auctionId) external; // seller only

function getAuctionDetails(uint256 auctionId) external view returns (Auction memory);

function getMyBids(uint256 auctionId) external view returns (Bid[] memory);
```

## FHEVM Integration Details

### Encrypted Bid Flow:
1. User enters bid amount in UI
2. Frontend encrypts amount using FHEVM: `fhevm.encrypt32(bidAmount)`
3. Encrypted bid sent to contract
4. Contract stores encrypted bid
5. Contract can compare encrypted bids using FHE operations
6. At reveal time, contract decrypts all bids
7. Winner determined from decrypted values

### Key FHEVM Operations:
```typescript
// Initialize FHEVM
const instance = await FhevmInstance.create({ publicKey, provider });

// Encrypt bid amount
const encryptedBid = instance.encrypt32(bidAmount);

// Re-encrypt for contract comparison
const reencrypted = await instance.reencrypt(encryptedBid, publicKey);

// Decrypt result (after reveal)
const decrypted = instance.decrypt32(encryptedValue);
```

## Code Quality Standards

### Smart Contracts:
- Follow Solidity Style Guide
- Use OpenZeppelin contracts (Ownable, ReentrancyGuard, Pausable)
- Checks-effects-interactions pattern
- NatSpec comments for all public functions
- Custom errors instead of require strings (gas optimization)
- Proper access control (only seller can cancel)
- Pause functionality for emergencies
- FHE type safety (euint32, euint64)

### Frontend:
- TypeScript strict mode enabled
- Component-based architecture
- Custom hooks for reusable logic
- Error boundaries at route level
- Loading states for all async operations
- Responsive design (mobile, tablet, desktop)
- Accessibility (WCAG 2.1 AA compliance)
- Proper FHE key management (never expose keys)

## Environment Variables

```env
# Blockchain
NEXT_PUBLIC_CHAIN_ID=42069
NEXT_PUBLIC_RPC_URL=https://api.testnet.fhenix.xyz
NEXT_PUBLIC_BLOCK_EXPLORER=https://explorer.testnet.fhenix.xyz

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Contracts
NEXT_PUBLIC_AUCTION_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_ITEM_CONTRACT_ADDRESS=0x...

# FHEVM
NEXT_PUBLIC_FHEVM_RPC_URL=https://api.testnet.fhenix.xyz

# IPFS
NEXT_PUBLIC_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
PINATA_API_KEY=your_key
PINATA_SECRET_KEY=your_secret

# API Keys
ETHERSCAN_API_KEY=your_key
```

## Developer Documentation & Resources

### Zama/FHEVM:
- **Zama Official Docs**: https://docs.zama.ai/
- **FHEVM GitHub**: https://github.com/zama-ai/fhevm
- **FHEVM NPM**: https://www.npmjs.com/package/@fhenixprotocol/fhevm-js
- **Fhenix Network**: https://docs.fhenix.io/
- **FHEVM Examples**: https://github.com/zama-ai/fhevm-examples

### Wallet Integration:
- **wagmi Documentation**: https://wagmi.sh/
- **viem Documentation**: https://viem.sh/
- **WalletConnect Docs**: https://docs.walletconnect.com/
- **EIP-1193 Standard**: https://eips.ethereum.org/EIPS/eip-1193

### Smart Contract Development:
- **Solidity Docs**: https://docs.soliditylang.org/
- **Hardhat Docs**: https://hardhat.org/docs
- **OpenZeppelin Contracts**: https://docs.openzeppelin.com/contracts/
- **Consensys Best Practices**: https://consensys.github.io/smart-contract-best-practices/
- **FHEVM Solidity Guide**: https://docs.fhenix.io/developers/solidity

### IPFS Integration:
- **Pinata Docs**: https://docs.pinata.cloud/
- **Web3.Storage**: https://web3.storage/docs/
- **IPFS Gateway**: https://docs.ipfs.tech/concepts/ipfs-gateway/

### Frontend Development:
- **Next.js Docs**: https://nextjs.org/docs
- **React Query**: https://tanstack.com/query/latest
- **Tailwind CSS**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com/
- **date-fns**: https://date-fns.org/

### Testing:
- **Hardhat Testing**: https://hardhat.org/hardhat-runner/docs/guides/test-contracts
- **Playwright**: https://playwright.dev/
- **Testing Library**: https://testing-library.com/

### Security:
- **Smart Contract Security**: https://consensys.github.io/smart-contract-best-practices/
- **SWC Registry**: https://swcregistry.io/
- **Slither**: https://github.com/crytic/slither
- **FHE Security Considerations**: https://docs.zama.ai/fhevm/security

## Success Criteria

- ✅ Multi-wallet connection works (MetaMask, WalletConnect, Coinbase)
- ✅ Smart contracts deploy and verify on Fhenix testnet
- ✅ Auction creation works with encrypted reserve price
- ✅ Encrypted bid submission functions correctly
- ✅ Bid reveal mechanism works (all bids decrypt properly)
- ✅ Winner selection is accurate
- ✅ Refunds process automatically for losing bidders
- ✅ FHE operations execute correctly (encrypted comparisons)
- ✅ UI is fully responsive and accessible
- ✅ Code passes ESLint, Prettier, TypeScript checks
- ✅ Contract test coverage >90%
- ✅ No critical security vulnerabilities
- ✅ Lighthouse performance score >90
- ✅ All transactions show proper status updates
- ✅ IPFS image uploads work correctly

## Key Implementation Notes

1. **FHE Key Management**: Store FHE keys securely in browser localStorage, never expose in code
2. **Bid Encryption**: Always encrypt bids client-side before sending to contract
3. **Gas Optimization**: Batch operations where possible, use events for off-chain indexing
4. **Auction Timing**: Use block.timestamp for auction end, add buffer for reveal transactions
5. **Error Handling**: Handle FHE encryption failures gracefully, show user-friendly errors
6. **Testing**: Test encrypted operations thoroughly, including edge cases (zero bids, ties, etc.)

Start by setting up the project structure, then implement smart contracts, followed by FHEVM integration, wallet connection, and finally the frontend UI. Test thoroughly on Fhenix testnet before any mainnet deployment.
```

