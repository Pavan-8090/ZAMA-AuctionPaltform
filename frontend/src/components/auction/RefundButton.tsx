"use client";

import { useAuction } from "@/hooks/useAuction";
import { useReadContract, useAccount } from "wagmi";
import { AUCTION_ABI, AUCTION_ADDRESS } from "@/lib/contracts";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { Wallet } from "lucide-react";
import { formatEther } from "@/lib/utils";

interface RefundButtonProps {
  auctionId: bigint;
}

export function RefundButton({ auctionId }: RefundButtonProps) {
  const { withdrawRefund, isPending } = useAuction();
  const { address } = useAccount();
  
  const { data: refundAmount } = useReadContract({
    address: AUCTION_ADDRESS,
    abi: AUCTION_ABI,
    functionName: "refunds",
    args: address ? [auctionId, address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const handleWithdraw = async () => {
    if (!refundAmount || refundAmount === 0n) {
      toast.error("No refund available");
      return;
    }

    try {
      toast.loading("Withdrawing refund...");
      await withdrawRefund(auctionId);
      toast.success("Refund withdrawn successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to withdraw refund");
    }
  };

  if (!refundAmount || refundAmount === 0n) {
    return null;
  }

  return (
    <Button
      onClick={handleWithdraw}
      variant="outline"
      disabled={isPending}
      className="w-full"
    >
      <Wallet className="h-4 w-4 mr-2" />
      {isPending ? "Withdrawing..." : `Withdraw Refund (${formatEther(refundAmount)} ETH)`}
    </Button>
  );
}

