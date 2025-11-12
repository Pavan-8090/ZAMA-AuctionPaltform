// Deployed contract address
// Sepolia Testnet (Zama): 0x1A5A0041BbD5654d3AdA5e969B54407F3C6fe2FC
// Localhost: 0x5FbDB2315678afecb367f032d93F642f64180aa3
export const AUCTION_ADDRESS = (process.env.NEXT_PUBLIC_AUCTION_CONTRACT_ADDRESS || "0x1A5A0041BbD5654d3AdA5e969B54407F3C6fe2FC") as `0x${string}`;

export const AUCTION_ABI = [
  {
    inputs: [
      { internalType: "string", name: "itemName", type: "string" },
      { internalType: "string", name: "itemDescription", type: "string" },
      { internalType: "string", name: "imageURI", type: "string" },
      { internalType: "bytes32", name: "reserveHandle", type: "bytes32" },
      { internalType: "bytes", name: "reserveInputProof", type: "bytes" },
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
      { internalType: "bytes32", name: "bidHandle", type: "bytes32" },
      { internalType: "bytes", name: "bidInputProof", type: "bytes" },
    ],
    name: "submitBid",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "auctionId", type: "uint256" },
      { internalType: "uint256", name: "bidIndex", type: "uint256" },
      { internalType: "uint256", name: "decryptedAmount", type: "uint256" },
    ],
    name: "revealBid",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "auctionId", type: "uint256" },
      { internalType: "uint256[]", name: "bidIndices", type: "uint256[]" },
      { internalType: "uint256[]", name: "decryptedAmounts", type: "uint256[]" },
    ],
    name: "completeReveal",
    outputs: [],
    stateMutability: "nonpayable",
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
          { internalType: "bytes32", name: "reserveHandle", type: "bytes32" },
          { internalType: "bytes", name: "reserveProof", type: "bytes" },
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
          { internalType: "bytes32", name: "ciphertextHandle", type: "bytes32" },
          { internalType: "bytes", name: "inputProof", type: "bytes" },
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

