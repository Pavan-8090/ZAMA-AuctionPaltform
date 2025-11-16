// Deployed contract address
// Sepolia Testnet: 0x0FE17cAc1D8df16a28B1d0CD7FF05bD2fA606C4b
// Localhost: 0x5FbDB2315678afecb367f032d93F642f64180aa3
export const AUCTION_ADDRESS = (process.env.NEXT_PUBLIC_AUCTION_CONTRACT_ADDRESS || "0x0FE17cAc1D8df16a28B1d0CD7FF05bD2fA606C4b") as `0x${string}`;

export const AUCTION_ABI = [
  {
    inputs: [
      { internalType: "string", name: "itemName", type: "string" },
      { internalType: "string", name: "itemDescription", type: "string" },
      { internalType: "string", name: "imageURI", type: "string" },
      { internalType: "bytes32", name: "encryptedReservePrice", type: "bytes32" },
      { internalType: "uint256", name: "duration", type: "uint256" },
    ],
    name: "createAuction",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "auctionId", type: "uint256" },
      { internalType: "bytes32", name: "encryptedBidAmount", type: "bytes32" },
    ],
    name: "submitBid",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "auctionId", type: "uint256" },
      { internalType: "uint256[]", name: "decryptedAmounts", type: "uint256[]" },
    ],
    name: "revealBids",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "auctionId", type: "uint256" }],
    name: "withdrawRefund",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "auctionId", type: "uint256" }],
    name: "cancelAuction",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "auctionId", type: "uint256" }],
    name: "getAuctionDetails",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id", type: "uint256" },
          { internalType: "address", name: "seller", type: "address" },
          { internalType: "string", name: "itemName", type: "string" },
          { internalType: "string", name: "itemDescription", type: "string" },
          { internalType: "string", name: "imageURI", type: "string" },
          { internalType: "bytes32", name: "encryptedReservePrice", type: "bytes32" },
          { internalType: "uint256", name: "startTime", type: "uint256" },
          { internalType: "uint256", name: "endTime", type: "uint256" },
          { internalType: "uint8", name: "status", type: "uint8" },
          { internalType: "address", name: "winner", type: "address" },
          { internalType: "uint256", name: "winningBid", type: "uint256" },
        ],
        internalType: "struct IAuction.Auction",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "auctionId", type: "uint256" }],
    name: "getBids",
    outputs: [
      {
        components: [
          { internalType: "address", name: "bidder", type: "address" },
          { internalType: "bytes32", name: "encryptedAmount", type: "bytes32" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "bool", name: "revealed", type: "bool" },
          { internalType: "bool", name: "refunded", type: "bool" },
        ],
        internalType: "struct IAuction.Bid[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "auctionId", type: "uint256" }],
    name: "getMyBids",
    outputs: [
      {
        components: [
          { internalType: "address", name: "bidder", type: "address" },
          { internalType: "bytes32", name: "encryptedAmount", type: "bytes32" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "bool", name: "revealed", type: "bool" },
          { internalType: "bool", name: "refunded", type: "bool" },
        ],
        internalType: "struct IAuction.Bid[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalAuctions",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "auctionId", type: "uint256" }],
    name: "isAuctionEnded",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "address", name: "", type: "address" },
    ],
    name: "refunds",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "auctionCounter",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

