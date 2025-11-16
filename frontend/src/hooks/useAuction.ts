"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { parseEther } from "viem";
import { config } from "@/lib/wagmi";
import { AUCTION_ABI, AUCTION_ADDRESS } from "@/lib/contracts";
import { storeEncryptedValue } from "@/lib/fhevm";
import { targetChainId } from "@/lib/network";

export function useAuction() {
  const { address, chain } = useAccount();

  const { writeContractAsync, data: hash, isPending, error, status } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    chainId: targetChainId,
  });

  const createAuction = async (
    itemName: string,
    itemDescription: string,
    imageURI: string,
    encryptedReservePrice: string | `0x${string}`,
    duration: number | bigint
  ) => {
    try {
      if (chain && chain.id !== targetChainId) {
        throw new Error("Wrong network selected. Please switch to the target chain.");
      }

      if (!encryptedReservePrice) {
        throw new Error("Encrypted reserve price missing");
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
        encryptedReservePrice,
        duration: normalizedDuration.toString(),
        contractAddress: AUCTION_ADDRESS,
      });

      const hash = await writeContractAsync(
        {
          address: AUCTION_ADDRESS,
          abi: AUCTION_ABI,
          functionName: "createAuction",
          chainId: targetChainId,
          args: [
            itemName,
            itemDescription,
            imageURI,
            encryptedReservePrice as `0x${string}`,
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
      const receipt = await waitForTransactionReceipt(config, { hash, chainId: targetChainId });

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

  const submitBid = async (auctionId: bigint, encryptedBidAmount: string, value: string) => {
    try {
      if (chain && chain.id !== targetChainId) {
        throw new Error("Wrong network selected. Please switch to the target chain.");
      }

      // Store the encrypted value with original for later decryption
      if (address) {
        storeEncryptedValue(address, auctionId.toString(), encryptedBidAmount, parseFloat(value));
      }
      
      const result = await writeContractAsync({
        address: AUCTION_ADDRESS,
        abi: AUCTION_ABI,
        functionName: "submitBid",
        args: [auctionId, encryptedBidAmount as `0x${string}`],
        chainId: targetChainId,
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
        chainId: targetChainId,
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
        chainId: targetChainId,
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
        chainId: targetChainId,
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
    chainId: targetChainId,
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
    chainId: targetChainId,
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

