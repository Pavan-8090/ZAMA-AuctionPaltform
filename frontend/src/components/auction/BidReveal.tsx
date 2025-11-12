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
import { handleTransaction, getErrorMessage } from "@/lib/errorHandler";
import { trackEvent, Events } from "@/lib/monitoring";

interface BidRevealProps {
  auctionId: bigint;
}

export function BidReveal({ auctionId }: BidRevealProps) {
  const { revealBids, isPending } = useAuction();
  const { publicDecrypt, isInitialized } = useFHE();
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
    const toastId = toast.loading("Decrypting bids...");

    try {
      const handles = bids.map((bid: any) => bid.ciphertextHandle as `0x${string}`);
      
      // Decrypt all bids using relayer
      const decryptionResult = await publicDecrypt(handles);

      // Convert decrypted values to wei amounts
      const decryptedAmounts: bigint[] = handles.map((handle, index) => {
        const clearValue = decryptionResult.clearValues[handle.toLowerCase() as `0x${string}`] ??
          decryptionResult.clearValues[handle as `0x${string}`];

        if (typeof clearValue !== "bigint" && typeof clearValue !== "number") {
          throw new Error(`Unexpected clear value type for handle ${handle}: ${typeof clearValue}`);
        }

        // The encrypted value was multiplied by 100 (toEncryptedValue function)
        // So we need to divide by 100 to get the original ETH amount
        // Then convert to wei (multiply by 10^18)
        const ethAmount = Number(clearValue) / 100;
        const weiAmount = BigInt(Math.floor(ethAmount * 1e18));
        
        console.log(`Bid ${index}: encrypted value=${clearValue}, ETH=${ethAmount}, wei=${weiAmount}`);
        
        return weiAmount;
      });

      toast.loading("Revealing bids on-chain…", { id: toastId });
      
      // Use error handler with retry logic
      await handleTransaction(
        () => revealBids(auctionId, decryptedAmounts),
        {
          maxRetries: 2,
          retryDelay: 2000,
          onRetry: (attempt) => {
            toast.loading(`Retrying reveal (attempt ${attempt}/2)...`, { id: toastId });
          },
        }
      );
      
      toast.success("Bids revealed successfully!", { id: toastId });
      trackEvent(Events.BIDS_REVEALED, { auctionId: auctionId.toString(), bidCount: bids.length });
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage, { id: toastId });
      trackEvent(Events.ERROR_OCCURRED, { 
        error: errorMessage, 
        context: "bid_reveal",
        auctionId: auctionId.toString() 
      });
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
            {bids?.length || 0} bid(s) to reveal. This will request a relayer decryption for every encrypted handle.
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
