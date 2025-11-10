"use client";

import { useAccount, useWatchContractEvent } from "wagmi";
import { AUCTION_ABI, AUCTION_ADDRESS } from "@/lib/contracts";
import { toast } from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { targetChainId } from "@/lib/network";

export function useAuctionEvents(auctionId?: bigint) {
  const queryClient = useQueryClient();
  const { chain } = useAccount();
  const isCorrectNetwork = chain?.id === targetChainId;

  // Watch for new auctions
  useWatchContractEvent({
    address: AUCTION_ADDRESS,
    abi: AUCTION_ABI,
    eventName: "AuctionCreated",
    chainId: targetChainId,
    enabled: isCorrectNetwork,
    onLogs(logs) {
      logs.forEach((log) => {
        toast.success("New auction created!");
        // Invalidate auction list queries
        queryClient.invalidateQueries({ queryKey: ["auctions"] });
      });
    },
  });

  // Watch for new bids
  useWatchContractEvent({
    address: AUCTION_ADDRESS,
    abi: AUCTION_ABI,
    eventName: "BidSubmitted",
    chainId: targetChainId,
    enabled: isCorrectNetwork,
    onLogs(logs) {
      logs.forEach((log: any) => {
        const logAuctionId = log.args?.auctionId;
        if (!auctionId || logAuctionId === auctionId) {
          toast.success("New bid submitted!");
          // Invalidate auction and bids queries
          queryClient.invalidateQueries({ queryKey: ["auction", auctionId] });
          queryClient.invalidateQueries({ queryKey: ["bids", auctionId] });
        }
      });
    },
  });

  // Watch for auction end
  useWatchContractEvent({
    address: AUCTION_ADDRESS,
    abi: AUCTION_ABI,
    eventName: "AuctionEnded",
    chainId: targetChainId,
    enabled: isCorrectNetwork,
    onLogs(logs) {
      logs.forEach((log: any) => {
        const logAuctionId = log.args?.auctionId;
        if (!auctionId || logAuctionId === auctionId) {
          toast.success("Auction ended! Winner determined.");
          // Invalidate auction queries
          queryClient.invalidateQueries({ queryKey: ["auction", auctionId] });
          queryClient.invalidateQueries({ queryKey: ["bids", auctionId] });
        }
      });
    },
  });

  // Watch for refunds
  useWatchContractEvent({
    address: AUCTION_ADDRESS,
    abi: AUCTION_ABI,
    eventName: "RefundProcessed",
    chainId: targetChainId,
    enabled: isCorrectNetwork,
    onLogs(logs) {
      logs.forEach((log: any) => {
        const logAuctionId = log.args?.auctionId;
        if (!auctionId || logAuctionId === auctionId) {
          toast.success("Refund processed!");
          // Invalidate refund queries
          queryClient.invalidateQueries({ queryKey: ["refunds", auctionId] });
        }
      });
    },
  });
}

