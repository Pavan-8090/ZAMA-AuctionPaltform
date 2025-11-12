"use client";

import { useAccount } from "wagmi";
import { useReadContract, usePublicClient, useWatchContractEvent } from "wagmi";
import { AUCTION_ABI, AUCTION_ADDRESS } from "@/lib/contracts";
import { useState, useEffect, useCallback, useMemo } from "react";
import { targetChainId } from "@/lib/network";
import { formatAddress } from "@/lib/utils";

const STATUS_LABELS = ["Active", "Ended", "Cancelled"] as const;

export type StatusLabel = (typeof STATUS_LABELS)[number];

export interface DashboardActivity {
  id: string;
  type: "auction-created" | "bid-submitted" | "auction-ended";
  timestamp: number;
  title: string;
  description: string;
  auctionId: bigint;
}

export interface UserBid {
  auctionId: bigint;
  auctionName?: string;
  bidder: string;
  ciphertextHandle: string;
  inputProof: string;
  timestamp: number;
  revealed: boolean;
  refunded: boolean;
  index: number;
}

export interface UserAuction {
  auctionId: bigint;
  itemName: string;
  itemDescription: string;
  imageURI: string;
  seller: string;
  startTime: bigint;
  endTime: bigint;
  status: StatusLabel;
  winner: string;
  winningBid: bigint;
  bidCount: number;
  hasExpired: boolean;
  timeRemainingSeconds: number;
  bids: UserBid[];
  timeline: DashboardActivity[];
}

function toNumber(value: unknown): number {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return value;
  if (typeof value === "string" && value !== "") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value === "object" && value !== null && "toString" in value) {
    const parsed = Number((value as any).toString());
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function getStatusLabel(statusValue: unknown): StatusLabel {
  const index = toNumber(statusValue);
  return STATUS_LABELS[index] ?? "Active";
}

export function useUserAuctions() {
  const { address, chain } = useAccount();
  const publicClient = usePublicClient();
  const [userAuctions, setUserAuctions] = useState<UserAuction[]>([]);
  const [userBids, setUserBids] = useState<UserBid[]>([]);
  const [activity, setActivity] = useState<DashboardActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const isCorrectNetwork = chain?.id === targetChainId;

  const { data: totalAuctions, refetch: refetchTotalAuctions } = useReadContract({
    address: AUCTION_ADDRESS,
    abi: AUCTION_ABI,
    functionName: "getTotalAuctions",
    chainId: targetChainId,
    query: {
      enabled: Boolean(address) && isCorrectNetwork,
      refetchOnWindowFocus: true,
      refetchInterval: 10000,
    },
  });

  const totalAuctionsBigInt = useMemo(() => {
    if (!totalAuctions) return 0n;
    try {
      return BigInt(totalAuctions as bigint);
    } catch {
      return 0n;
    }
  }, [totalAuctions]);

  const resetData = useCallback(() => {
    setUserAuctions([]);
    setUserBids([]);
    setActivity([]);
  }, []);

  const fetchUserData = useCallback(async () => {
    if (!address || !publicClient) {
      setIsLoading(false);
      resetData();
      return;
    }

    if (!isCorrectNetwork) {
      setIsLoading(false);
      resetData();
      return;
    }

    if (totalAuctionsBigInt === 0n) {
      resetData();
      setIsLoading(false);
      setActivity([]);
      return;
    }

    setIsLoading(true);
    const auctions: UserAuction[] = [];
    const bids: UserBid[] = [];

    console.log(
      `Fetching user data for ${address}, total auctions: ${totalAuctionsBigInt.toString()}`
    );

    for (let i = 1n; i <= totalAuctionsBigInt; i++) {
      try {
        const auctionData = await publicClient.readContract({
          address: AUCTION_ADDRESS,
          abi: AUCTION_ABI,
          functionName: "getAuctionDetails",
          args: [i],
        });

        const seller = auctionData?.seller?.toLowerCase?.();

        if (seller && seller === address.toLowerCase()) {
          const startTimeSeconds = BigInt(auctionData.startTime ?? 0);
          const endTimeSeconds = BigInt(auctionData.endTime ?? 0);
          const statusLabel = getStatusLabel(auctionData.status);
          const nowSeconds = BigInt(Math.floor(Date.now() / 1000));
          const hasExpired = nowSeconds >= endTimeSeconds || statusLabel !== "Active";
          const timeRemainingSeconds = hasExpired
            ? 0
            : Number(endTimeSeconds - nowSeconds < 0n ? 0n : endTimeSeconds - nowSeconds);

          auctions.push({
            auctionId: i,
            itemName: auctionData.itemName,
            itemDescription: auctionData.itemDescription,
            imageURI: auctionData.imageURI,
            seller: auctionData.seller,
            startTime: startTimeSeconds,
            endTime: endTimeSeconds,
            status: statusLabel,
            winner: auctionData.winner,
            winningBid: BigInt(auctionData.winningBid ?? 0),
            bidCount: 0,
            hasExpired,
            timeRemainingSeconds,
            bids: [],
            timeline: [
              {
                id: `auction-${i.toString()}-created`,
                type: "auction-created",
                timestamp: Number(startTimeSeconds),
                title: auctionData.itemName,
                description: "Auction created",
                auctionId: i,
              },
            ],
          });
          console.log(`Found user auction #${i}: ${auctionData.itemName}`);
        }

        try {
          const auctionBids = await publicClient.readContract({
            address: AUCTION_ADDRESS,
            abi: AUCTION_ABI,
            functionName: "getBids",
            args: [i],
          });

          if (Array.isArray(auctionBids)) {
            const userAuctionBids = auctionBids.filter(
              (bid: any) => bid?.bidder?.toLowerCase?.() === address.toLowerCase()
            );

            const sanitizedBids = auctionBids.map((bid: any, index: number) => ({
              auctionId: i,
              auctionName: auctionData.itemName,
              bidder: bid.bidder,
              ciphertextHandle: bid.ciphertextHandle,
              inputProof: bid.inputProof,
              timestamp: toNumber(bid.timestamp),
              revealed: Boolean(bid.revealed),
              refunded: Boolean(bid.refunded),
              index,
            }));

            const targetAuctionIndex = auctions.findIndex((a) => a.auctionId === i);
            if (targetAuctionIndex >= 0) {
              auctions[targetAuctionIndex] = {
                ...auctions[targetAuctionIndex],
                bidCount: sanitizedBids.length,
                bids: sanitizedBids,
                timeline: [
                  ...auctions[targetAuctionIndex].timeline,
                  ...sanitizedBids.map((bid) => ({
                    id: `auction-${bid.auctionId.toString()}-bid-${bid.index}`,
                    type: "bid-submitted" as const,
                    timestamp: bid.timestamp,
                    title: auctionData.itemName,
                    description: `Encrypted bid from ${formatAddress(bid.bidder)}`,
                    auctionId: bid.auctionId,
                  })),
                ],
              };
            }

            if (userAuctionBids.length > 0) {
              userAuctionBids.forEach((bid: any) => {
                bids.push({
                  auctionId: i,
                  auctionName: auctionData.itemName,
                  bidder: bid.bidder,
                  ciphertextHandle: bid.ciphertextHandle,
                  inputProof: bid.inputProof,
                  timestamp: toNumber(bid.timestamp),
                  revealed: Boolean(bid.revealed),
                  refunded: Boolean(bid.refunded),
                  index: sanitizedBids.findIndex(
                    (entry) => entry.bidder === bid.bidder && entry.timestamp === toNumber(bid.timestamp)
                  ),
                });
              });
              console.log(`Found ${userAuctionBids.length} bid(s) for auction #${i}`);
            }
          }
        } catch (bidError) {
          console.warn(`Error fetching bids for auction ${i}:`, bidError);
        }
      } catch (error) {
        console.error(`Error fetching auction ${i}:`, error);
      }
    }

    const augmentedAuctions = auctions.map((auction) => {
      const hasWinner = auction.winner && auction.winner !== "0x0000000000000000000000000000000000000000";
      const timeline = [...auction.timeline];

      if (auction.status !== "Active") {
        timeline.push({
          id: `auction-${auction.auctionId.toString()}-ended`,
          type: "auction-ended",
          timestamp: Number(auction.endTime),
          title: auction.itemName,
          description: hasWinner
            ? `Auction ended • Winner ${formatAddress(auction.winner)}`
            : "Auction ended",
          auctionId: auction.auctionId,
        });
      }

      const sortedTimeline = timeline.sort((a, b) => b.timestamp - a.timestamp);

      return {
        ...auction,
        timeline: sortedTimeline,
      };
    });

    const activityFeed: DashboardActivity[] = [
      ...augmentedAuctions.flatMap((auction) => auction.timeline),
      ...bids.map((bid) => ({
        id: `bid-${bid.auctionId.toString()}-${bid.timestamp}-${bid.bidder}`,
        type: "bid-submitted" as const,
        timestamp: bid.timestamp,
        title: bid.auctionName || `Auction #${bid.auctionId.toString()}`,
        description: `You placed an encrypted bid (${bid.revealed ? "revealed" : "sealed"})`,
        auctionId: bid.auctionId,
      })),
    ].sort((a, b) => b.timestamp - a.timestamp);

    setActivity(activityFeed);
    console.log(`Found ${auctions.length} auctions and ${bids.length} bids for user`);
    setUserAuctions(augmentedAuctions);
    setUserBids(bids);
    setIsLoading(false);
    setLastUpdated(Date.now());
  }, [address, publicClient, resetData, totalAuctionsBigInt, isCorrectNetwork]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useWatchContractEvent({
    address: AUCTION_ADDRESS,
    abi: AUCTION_ABI,
    eventName: "AuctionCreated",
    chainId: targetChainId,
    enabled: Boolean(address) && isCorrectNetwork,
    onLogs: () => {
      console.log("AuctionCreated event detected – refreshing user data");
      refetchTotalAuctions();
      fetchUserData();
    },
  });

  useWatchContractEvent({
    address: AUCTION_ADDRESS,
    abi: AUCTION_ABI,
    eventName: "BidSubmitted",
    chainId: targetChainId,
    enabled: Boolean(address) && isCorrectNetwork,
    onLogs: (logs: any[]) => {
      logs.forEach((log) => {
        const bidder = log?.args?.bidder;
        if (!bidder || !address) return;
        if (bidder.toLowerCase() === address.toLowerCase()) {
          console.log("BidSubmitted event for user – refreshing bids");
          fetchUserData();
        }
      });
    },
  });

  return {
    userAuctions,
    userBids,
    isLoading,
    lastUpdated,
    totalAuctions: totalAuctionsBigInt,
    refetch: fetchUserData,
    activity,
  };
}

