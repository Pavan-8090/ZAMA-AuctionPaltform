"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useReadContract } from "wagmi";
import { AUCTION_ABI, AUCTION_ADDRESS } from "@/lib/contracts";
import { useAuction } from "@/hooks/useAuction";
import { useFHE } from "@/hooks/useFHE";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatAddress } from "@/lib/utils";
import { toEncryptedValue, formatEncryptedValue } from "@/lib/fhevm-helpers";
import { AuctionStatus } from "@/types/auction";
import { toast } from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  Gavel,
  Shield,
  User,
} from "lucide-react";
import { CountdownTimer } from "@/components/auction/CountdownTimer";
import { BidReveal } from "@/components/auction/BidReveal";
import { RefundButton } from "@/components/auction/RefundButton";
import { WinnerAnnouncement } from "@/components/auction/WinnerAnnouncement";
import { useAuctionBids } from "@/hooks/useAuction";
import { useAuctionEvents } from "@/hooks/useAuctionEvents";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useWallet } from "@/hooks/useWallet";
import { targetChainId } from "@/lib/network";
import { handleTransaction, getErrorMessage } from "@/lib/errorHandler";
import { trackEvent, Events } from "@/lib/monitoring";

export default function AuctionDetailPage() {
  const params = useParams();
  const auctionId = useMemo(() => BigInt(params.id as string), [params.id]);
  const { address, isConnected, isCorrectNetwork, switchToTargetChain, chain, targetChainName } =
    useWallet();
  const { submitBid, isPending } = useAuction();
  const { encrypt32, isInitialized } = useFHE();
  const [bidAmount, setBidAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: auction,
    isLoading: auctionLoading,
    error: auctionError,
  } = useReadContract({
    address: AUCTION_ADDRESS,
    abi: AUCTION_ABI,
    functionName: "getAuctionDetails",
    args: [auctionId],
    chainId: targetChainId,
  });

  const { bids, isLoading: bidsLoading } = useAuctionBids(auctionId);

  useAuctionEvents(auctionId);

  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      toast.error("Connect your wallet to place a bid");
      return;
    }

    if (!isCorrectNetwork) {
      toast.error(`Switch to ${targetChainName} to place a bid.`);
      return;
    }

    if (!address) {
      toast.error("Connect your wallet to place a bid");
      return;
    }

    if (!isInitialized) {
      toast.error("Encryption engine not ready yet. Please wait a moment.");
      return;
    }

    const amount = parseFloat(bidAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid bid amount");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Encrypting and submitting your bid…");

    try {
      const { handle: bidHandle, inputProof } = await encrypt32(
        toEncryptedValue(amount),
        AUCTION_ADDRESS,
        address!
      );
      
      await handleTransaction(
        () => submitBid(auctionId, bidHandle, inputProof, bidAmount),
        {
          maxRetries: 2,
          retryDelay: 2000,
          onRetry: (attempt) => {
            toast.loading(`Retrying bid submission (attempt ${attempt}/2)...`, { id: toastId });
          },
        }
      );
      
      toast.success("Encrypted bid submitted", { id: toastId });
      trackEvent(Events.BID_SUBMITTED, { 
        auctionId: auctionId.toString(), 
        amount: bidAmount 
      });
      setBidAmount("");
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage, { id: toastId });
      trackEvent(Events.ERROR_OCCURRED, { 
        error: errorMessage, 
        context: "bid_submission",
        auctionId: auctionId.toString() 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStateBanner = () => {
    if (!isConnected) {
      return (
        <div className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 text-foreground">
            <AlertCircle className="h-4 w-4 text-primary" />
            Connect wallet to participate
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Viewing is open to everyone, but only connected wallets can place encrypted bids.
          </p>
        </div>
      );
    }

    if (!isCorrectNetwork) {
      return (
        <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4" />
            Wrong network detected
          </div>
          <p className="mt-1 text-xs">
            You are currently on {chain?.name || "another network"}. Switch to {targetChainName} to bid or
            reveal encrypted amounts.
          </p>
          <Button
            onClick={switchToTargetChain}
            className="mt-3 w-full rounded-full border border-amber-200/50 bg-transparent text-amber-100 hover:bg-amber-400/20"
            variant="outline"
          >
            Switch network
          </Button>
        </div>
      );
    }

    return null;
  };

  if (auctionLoading) {
    return (
      <div className="relative min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="container mx-auto px-4 pb-24 pt-16">
          <div className="rounded-2xl border border-white/10 bg-black/30 px-6 py-10 text-center text-muted-foreground">
            Loading encrypted auction…
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (auctionError || !auction) {
    return (
      <div className="relative min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="container mx-auto px-4 pb-24 pt-16">
          <div className="rounded-2xl border border-white/10 bg-black/30 px-6 py-10 text-center text-muted-foreground">
            Auction not found or unavailable.
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isEnded = BigInt(Math.floor(Date.now() / 1000)) >= auction.endTime;
  const isActive = auction.status === AuctionStatus.Active && !isEnded;
  const isSeller = address?.toLowerCase() === auction.seller.toLowerCase();
  const hasWinner =
    auction.winner !== "0x0000000000000000000000000000000000000000" &&
    auction.winner !== null;

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-primary/25 blur-[180px]" />
        <div className="absolute right-[-12rem] top-[30vh] h-[28rem] w-[28rem] rounded-full bg-accent/20 blur-[180px]" />
        <div className="absolute inset-x-0 bottom-[-10rem] h-[22rem] bg-[radial-gradient(70%_70%_at_50%_0%,rgba(255,255,255,0.04),rgba(0,0,0,0))]" />
      </div>

      <Navbar />

      <main className="container mx-auto px-4 pb-24 pt-16">
        <Link
          href="/auctions"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to marketplace
        </Link>

        <section className="mt-8 grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="overflow-hidden border-white/10 bg-white/5 backdrop-blur">
            {auction.imageURI ? (
              <div className="relative h-[420px] w-full overflow-hidden">
                <Image
                  src={auction.imageURI.replace(
                    "ipfs://",
                    "https://gateway.pinata.cloud/ipfs/"
                  )}
                  alt={auction.itemName}
                  fill
                  priority={false}
                  sizes="(min-width: 1280px) 540px, (min-width: 768px) 60vw, 100vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-[420px] w-full items-center justify-center bg-gradient-to-br from-primary/30 via-black/40 to-black">
                <Gavel className="h-14 w-14 text-primary" />
              </div>
            )}

            <CardHeader className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-1 text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
                Auction #{auction.id.toString()}
              </div>
              <div className="space-y-2">
                <CardTitle className="text-3xl font-semibold">{auction.itemName}</CardTitle>
                <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                  {auction.itemDescription}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pb-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoPill label="Seller" value={formatAddress(auction.seller)} icon={User} />
                <InfoPill
                  label="Reserve"
                  value="Encrypted"
                  icon={Shield}
                />
                <InfoPill
                  label="Status"
                  value={
                    auction.status === AuctionStatus.Cancelled
                      ? "Cancelled"
                      : isEnded
                      ? "Ended"
                      : "Active"
                  }
                  icon={Clock}
                />
                <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    Countdown
                  </p>
                  <CountdownTimer endTime={auction.endTime} className="mt-1" />
                </div>
              </div>

              {hasWinner && (
                <WinnerAnnouncement
                  winner={auction.winner}
                  winningBid={auction.winningBid}
                  isYou={address?.toLowerCase() === auction.winner.toLowerCase()}
                />
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            {renderStateBanner()}

            {isActive && !isSeller && isConnected && isCorrectNetwork && (
              <Card className="border-white/10 bg-white/5 backdrop-blur">
                <CardHeader>
                  <CardTitle>Place sealed bid</CardTitle>
                  <CardDescription>
                    Bid stays encrypted until reveal. Only winning bid is revealed after deadline.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleBid} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="bidAmount">Bid amount (ETH)</Label>
                      <Input
                        id="bidAmount"
                        type="number"
                        step="0.001"
                        min="0"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder="0.25"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                      disabled={isPending || isSubmitting || !isInitialized}
                    >
                      {isSubmitting || isPending ? "Submitting…" : "Submit encrypted bid"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {isEnded && auction.status === AuctionStatus.Active && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-1 backdrop-blur">
                <BidReveal auctionId={auctionId} />
              </div>
            )}

            {auction.status === AuctionStatus.Ended && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-1 backdrop-blur">
                <RefundButton auctionId={auctionId} />
              </div>
            )}

            <Card className="border-white/10 bg-white/5 backdrop-blur">
              <CardHeader>
                <CardTitle>Encrypted bid log</CardTitle>
                <CardDescription>
                  {bidsLoading ? "Loading private bids…" : `${bids?.length || 0} total submission(s)`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bidsLoading ? (
                  <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-6 text-center text-muted-foreground">
                    Fetching encrypted bid entries…
                  </div>
                ) : bids && bids.length > 0 ? (
                  <div className="space-y-3">
                    {bids.map((bid: any, index: number) => {
                      const bidderAddress = formatAddress(bid.bidder);
                      const isYou = address?.toLowerCase() === bid.bidder.toLowerCase();
                      const displayValue = formatEncryptedValue(bid.encryptedAmount as string);

                      return (
                        <div
                          key={`${bid.bidder}-${index}`}
                          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/40 px-5 py-4"
                        >
                          <div>
                            <p className="text-sm font-semibold text-foreground">{bidderAddress}</p>
                            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                              {bid.revealed ? "Revealed" : "Encrypted"} •{" "}
                              {bid.refunded ? "Refunded" : "Locked"}
                            </p>
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {displayValue}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-white/10 bg-black/30 px-4 py-6 text-center text-muted-foreground">
                    No bids yet. Be the first to place an encrypted offer.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function InfoPill({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof User;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
      <Icon className="h-4 w-4 text-primary" />
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

