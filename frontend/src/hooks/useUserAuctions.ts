"use client";

import { useAccount } from "wagmi";
import { useReadContract, usePublicClient, useWatchContractEvent } from "wagmi";
import { AUCTION_ABI, AUCTION_ADDRESS } from "@/lib/contracts";
import { useState, useEffect, useCallback, useMemo } from "react";
import { targetChainId } from "@/lib/network";

export function useUserAuctions() {
  const { address, chain } = useAccount();
  const publicClient = usePublicClient();
  const [userAuctions, setUserAuctions] = useState<any[]>([]);
  const [userBids, setUserBids] = useState<any[]>([]);
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
      return;
    }

    setIsLoading(true);
    const auctions: any[] = [];
    const bids: any[] = [];

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
          auctions.push({
            ...auctionData,
            auctionId: i,
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

            if (userAuctionBids.length > 0) {
              userAuctionBids.forEach((bid: any) => {
                bids.push({
                  ...bid,
                  auctionId: i,
                  auctionName: auctionData.itemName,
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

    console.log(`Found ${auctions.length} auctions and ${bids.length} bids for user`);
    setUserAuctions(auctions);
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
    listener: () => {
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
    listener: (log) => {
      const bidder = Array.isArray(log) ? log[0]?.args?.bidder : (log as any)?.args?.bidder;
      if (!bidder || !address) return;
      if (bidder.toLowerCase() === address.toLowerCase()) {
        console.log("BidSubmitted event for user – refreshing bids");
        fetchUserData();
      }
    },
  });

  return {
    userAuctions,
    userBids,
    isLoading,
    lastUpdated,
    totalAuctions: totalAuctionsBigInt,
    refetch: fetchUserData,
  };
}

