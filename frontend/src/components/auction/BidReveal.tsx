"use client";

import { useState } from "react";
import { useAuction } from "@/hooks/useAuction";
import { useFHE } from "@/hooks/useFHE";
import { useAuctionBids } from "@/hooks/useAuction";
import { useAccount } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { Shield, Unlock } from "lucide-react";
import { parseEther } from "viem";
import { fromEncryptedValue } from "@/lib/fhevm-helpers";
import { getStoredEncryptedValue, getAllEncryptedStorage } from "@/lib/fhevm";

interface BidRevealProps {
  auctionId: bigint;
}

export function BidReveal({ auctionId }: BidRevealProps) {
  const { revealBids, isPending } = useAuction();
  const { decrypt, isInitialized } = useFHE();
  const { bids, isLoading } = useAuctionBids(auctionId);
  const { address } = useAccount();
  const [isRevealing, setIsRevealing] = useState(false);

  const handleReveal = async () => {
    if (!isInitialized) {
      toast.error("FHEVM not initialized");
      return;
    }

    if (!bids || bids.length === 0) {
      toast.error("No bids to reveal");
      return;
    }

    setIsRevealing(true);
    toast.loading("Decrypting bids...");

    try {
      // Decrypt all bids using stored values
      const decryptedAmounts: bigint[] = [];
      const storage = getAllEncryptedStorage();
      
      for (const bid of bids) {
        try {
          const bidderAddress = (bid as any).bidder?.toLowerCase();
          const encryptedValue = bid.encryptedAmount as `0x${string}`;
          
          // Try to find stored value for this bidder and auction
          let decrypted: number | null = null;
          
          // Check all bidders in storage for this auction
          for (const storedBidder in storage) {
            const stored = storage[storedBidder]?.[auctionId.toString()];
            if (stored && stored.encrypted === encryptedValue) {
              decrypted = stored.originalValue;
              break;
            }
          }
          
          // If not found in storage, try to decrypt (may fail for bids we didn't create)
          if (decrypted === null) {
            try {
              const decryptedValue = await decrypt(encryptedValue);
              decrypted = fromEncryptedValue(decryptedValue);
            } catch (err) {
              // If we can't decrypt, we can't reveal this bid
              // In a real app, each bidder would reveal their own bid
              console.warn(`Cannot decrypt bid from ${bidderAddress}:`, err);
              toast.error(`Cannot decrypt bid from ${bidderAddress}. Each bidder must reveal their own bid.`);
              setIsRevealing(false);
              return;
            }
          }
          
          // Convert to wei (decrypted is already in ETH from storage)
          decryptedAmounts.push(parseEther(decrypted.toString()));
        } catch (error) {
          console.error("Decryption error:", error);
          toast.error("Failed to decrypt some bids. Each bidder must reveal their own bid.");
          setIsRevealing(false);
          return;
        }
      }

      if (decryptedAmounts.length !== bids.length) {
        toast.error("Could not decrypt all bids. Each bidder must reveal their own bid individually.");
        setIsRevealing(false);
        return;
      }

      toast.loading("Revealing bids on-chain...");
      await revealBids(auctionId, decryptedAmounts);
      toast.success("Bids revealed successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to reveal bids");
    } finally {
      setIsRevealing(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Loading bids...</div>
        </CardContent>
      </Card>
    );
  }

  const hasUnrevealedBids = bids?.some((bid: any) => !bid.revealed) ?? false;

  if (!hasUnrevealedBids) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Unlock className="h-5 w-5" />
            Bids Revealed
          </CardTitle>
          <CardDescription>All bids have been revealed</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Reveal Bids
        </CardTitle>
        <CardDescription>
          Decrypt and reveal all bids to determine the winner
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {bids?.length || 0} bid(s) to reveal. This will decrypt all encrypted bids and determine the winner.
            {bids?.some((bid: any) => {
              const bidderAddress = bid.bidder?.toLowerCase();
              const storage = getAllEncryptedStorage();
              return !Object.keys(storage).some(b => b.toLowerCase() === bidderAddress && storage[b]?.[auctionId.toString()]);
            }) && (
              <span className="block mt-2 text-yellow-600">
                ⚠️ Some bids cannot be decrypted. Each bidder must reveal their own bid individually.
              </span>
            )}
          </p>
          <Button
            onClick={handleReveal}
            className="w-full"
            disabled={isPending || isRevealing || !isInitialized}
          >
            {isRevealing ? "Decrypting..." : isPending ? "Revealing..." : "Reveal All Bids"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
