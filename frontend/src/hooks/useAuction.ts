"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { parseEther } from "viem";
import { config } from "@/lib/wagmi";
import { AUCTION_ABI, AUCTION_ADDRESS } from "@/lib/contracts";
import { targetChainId } from "@/lib/network";

export function useAuction() {
  const { chain } = useAccount();

  const { writeContractAsync, data: hash, isPending, error, status } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    chainId: targetChainId as 11155111 | 1337 | 42069 | 8009 | 9000,
  });

  const createAuction = async (
    itemName: string,
    itemDescription: string,
    imageURI: string,
    reserveHandle: string | `0x${string}`,
    reserveInputProof: string | `0x${string}`,
    duration: number | bigint
  ) => {
    try {
      if (chain && chain.id !== targetChainId) {
        throw new Error("Wrong network selected. Please switch to the target chain.");
      }

      if (!reserveHandle || !reserveInputProof) {
        throw new Error("Encrypted reserve price payload missing");
      }

      const normalizedDuration =
        typeof duration === "bigint"
          ? duration
          : Number.isFinite(duration)
          ? BigInt(Math.max(0, Math.floor(duration)))
          : (() => {
              throw new Error("Invalid duration value");
            })();

      if (normalizedDuration <= 0n) {
        throw new Error("Duration must be greater than zero");
      }

      console.log("Creating auction with params:", {
        itemName,
        itemDescription,
        imageURI,
        reserveHandle,
        reserveInputProof,
        duration: normalizedDuration.toString(),
        contractAddress: AUCTION_ADDRESS,
      });

      const hash = await writeContractAsync(
        {
          address: AUCTION_ADDRESS,
          abi: AUCTION_ABI,
          functionName: "createAuction",
          chainId: targetChainId as 11155111 | 1337 | 42069 | 8009 | 9000,
          args: [
            itemName,
            itemDescription,
            imageURI,
            reserveHandle as `0x${string}`,
            reserveInputProof as `0x${string}`,
            normalizedDuration,
          ],
        },
        {
          onError(error) {
            if ((error as Error).message?.includes("User rejected")) {
              throw new Error("User rejected transaction signature");
            }
          },
        }
      );

      console.log("Transaction hash:", hash);

      // Wait for transaction receipt
      const receipt = await waitForTransactionReceipt(config, { hash, chainId: targetChainId as 11155111 | 1337 | 42069 | 8009 | 9000 });

      console.log("Transaction receipt:", receipt);

      if (receipt.status === "success") {
        console.log("Auction created successfully! Block:", receipt.blockNumber);
        return { receipt, hash };
      }

      if (receipt.status === "reverted" || receipt.status === "failure") {
        throw new Error("Transaction reverted");
      }

      throw new Error("Transaction status unknown");
    } catch (err: any) {
      console.error("Create auction error:", err);
      throw new Error(err.message || "Failed to create auction");
    }
  };

  const submitBid = async (
    auctionId: bigint,
    bidHandle: string | `0x${string}`,
    bidInputProof: string | `0x${string}`,
    value: string
  ) => {
    try {
      if (chain && chain.id !== targetChainId) {
        throw new Error("Wrong network selected. Please switch to the target chain.");
      }

      const result = await writeContractAsync({
        address: AUCTION_ADDRESS,
        abi: AUCTION_ABI,
        functionName: "submitBid",
        args: [auctionId, bidHandle as `0x${string}`, bidInputProof as `0x${string}`],
        chainId: targetChainId as 11155111 | 1337 | 42069 | 8009 | 9000,
        value: parseEther(value),
      });
      return result;
    } catch (err) {
      console.error("Submit bid error:", err);
      throw err;
    }
  };

  const revealBids = async (auctionId: bigint, decryptedAmounts: bigint[]) => {
    try {
      if (chain && chain.id !== targetChainId) {
        throw new Error("Wrong network selected. Please switch to the target chain.");
      }

      const result = await writeContractAsync({
        address: AUCTION_ADDRESS,
        abi: AUCTION_ABI,
        functionName: "revealBids",
        chainId: targetChainId as 11155111 | 1337 | 42069 | 8009 | 9000,
        args: [auctionId, decryptedAmounts],
      });
      return result;
    } catch (err) {
      console.error("Reveal bids error:", err);
      throw err;
    }
  };

  const withdrawRefund = async (auctionId: bigint) => {
    try {
      if (chain && chain.id !== targetChainId) {
        throw new Error("Wrong network selected. Please switch to the target chain.");
      }

      const result = await writeContractAsync({
        address: AUCTION_ADDRESS,
        abi: AUCTION_ABI,
        functionName: "withdrawRefund",
        chainId: targetChainId as 11155111 | 1337 | 42069 | 8009 | 9000,
        args: [auctionId],
      });
      return result;
    } catch (err) {
      console.error("Withdraw refund error:", err);
      throw err;
    }
  };

  const cancelAuction = async (auctionId: bigint) => {
    try {
      if (chain && chain.id !== targetChainId) {
        throw new Error("Wrong network selected. Please switch to the target chain.");
      }

      const result = await writeContractAsync({
        address: AUCTION_ADDRESS,
        abi: AUCTION_ABI,
        functionName: "cancelAuction",
        chainId: targetChainId as 11155111 | 1337 | 42069 | 8009 | 9000,
        args: [auctionId],
      });
      return result;
    } catch (err) {
      console.error("Cancel auction error:", err);
      throw err;
    }
  };

  return {
    createAuction,
    submitBid,
    revealBids,
    withdrawRefund,
    cancelAuction,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

export function useAuctionDetails(auctionId: bigint | null) {
  const { data, isLoading, error } = useReadContract({
    address: AUCTION_ADDRESS,
    abi: AUCTION_ABI,
    functionName: "getAuctionDetails",
    chainId: targetChainId as 11155111 | 1337 | 42069 | 8009 | 9000,
    args: auctionId ? [auctionId] : undefined,
    query: {
      enabled: auctionId !== null,
    },
  });

  return {
    auction: data,
    isLoading,
    error,
  };
}

export function useAuctionBids(auctionId: bigint | null) {
  const { data, isLoading, error } = useReadContract({
    address: AUCTION_ADDRESS,
    abi: AUCTION_ABI,
    functionName: "getBids",
    chainId: targetChainId as 11155111 | 1337 | 42069 | 8009 | 9000,
    args: auctionId ? [auctionId] : undefined,
    query: {
      enabled: auctionId !== null,
    },
  });

  return {
    bids: (data as any[]) || [],
    isLoading,
    error,
  };
}

