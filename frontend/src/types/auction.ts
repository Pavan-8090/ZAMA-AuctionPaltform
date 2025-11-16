export interface Auction {
  id: bigint;
  seller: string;
  itemName: string;
  itemDescription: string;
  imageURI: string;
  encryptedReservePrice: string;
  startTime: bigint;
  endTime: bigint;
  status: AuctionStatus;
  winner: string;
  winningBid: bigint;
}

export interface Bid {
  bidder: string;
  encryptedAmount: string;
  timestamp: bigint;
  revealed: boolean;
  refunded: boolean;
}

export enum AuctionStatus {
  Active = 0,
  Ended = 1,
  Cancelled = 2,
}

export interface CreateAuctionData {
  itemName: string;
  itemDescription: string;
  imageFile: File | null;
  encryptedReservePrice: string;
  duration: number; // in seconds
}

