"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useReadContract } from "wagmi";
import { AUCTION_ABI, AUCTION_ADDRESS } from "@/lib/contracts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AuctionStatus } from "@/types/auction";
import { Clock, Flame, Gavel } from "lucide-react";
import { useAuctionEvents } from "@/hooks/useAuctionEvents";
import { AuctionCardSkeleton } from "@/components/auction/AuctionCardSkeleton";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useWallet } from "@/hooks/useWallet";
import { formatDistanceStrict } from "date-fns";
import { targetChainName, targetChainId } from "@/lib/network";

export default function AuctionsPage() {
  const [auctionIds, setAuctionIds] = useState<bigint[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const { isConnected, isCorrectNetwork } = useWallet();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Listen for real-time events
  useAuctionEvents();

  const {
    data: total,
    isLoading,
    error,
  } = useReadContract({
    address: AUCTION_ADDRESS,
    abi: AUCTION_ABI,
    functionName: "getTotalAuctions",
    chainId: targetChainId,
    query: {
      enabled: isCorrectNetwork,
    },
  });

  useEffect(() => {
    if (!isCorrectNetwork || total === undefined) {
      setAuctionIds([]);
      return;
    }

    const count = BigInt(total);
    const ids: bigint[] = [];
    for (let i = 1n; i <= count; i++) {
      ids.push(i);
    }
    setAuctionIds(ids.reverse());
  }, [total, isCorrectNetwork]);

  const content = useMemo(() => {
    if (!isMounted) {
      return (
        <Card className="border-white/5 bg-white/5">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Loading auctions...</p>
          </CardContent>
        </Card>
      );
    }

    if (!isConnected) {
      return (
        <Card className="border-white/10 bg-black/30 backdrop-blur">
          <CardHeader>
            <CardTitle>Connect your wallet</CardTitle>
            <CardDescription>
              Connect to {targetChainName} to browse encrypted auctions and place bids.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/">Connect Wallet</Link>
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (!isCorrectNetwork) {
      return (
        <Card className="border-amber-500/40 bg-amber-500/10 backdrop-blur">
          <CardHeader>
            <CardTitle>Switch network</CardTitle>
            <CardDescription>
              Please switch your wallet to {targetChainName} to view live auctions.
            </CardDescription>
          </CardHeader>
        </Card>
      );
    }

    if (isLoading) {
      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <AuctionCardSkeleton key={`skeleton-${idx}`} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <Card className="border-red-500/40 bg-red-500/10 backdrop-blur">
          <CardContent className="pt-6">
            <p className="text-center text-red-200">
              Error loading auctions: {error.message || "Unknown error"}
            </p>
            <p className="text-center text-xs uppercase tracking-[0.3em] text-red-200/70 mt-4">
              Contract: {AUCTION_ADDRESS}
            </p>
          </CardContent>
        </Card>
      );
    }

    if (auctionIds.length === 0) {
      return (
        <Card className="border-dashed border-white/20 bg-white/5 backdrop-blur">
          <CardContent className="space-y-6 pt-10 pb-10 text-center text-muted-foreground">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Flame className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-semibold text-foreground">No auctions yet</p>
              <p className="text-sm text-muted-foreground">
                Launch the first encrypted auction and define the market narrative.
              </p>
            </div>
            <Button asChild className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/create-auction">Create auction</Link>
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {auctionIds.map((id) => (
          <AuctionCard key={id.toString()} auctionId={id} />
        ))}
      </div>
    );
  }, [isMounted, isConnected, isCorrectNetwork, isLoading, error, auctionIds]);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-primary/25 blur-[180px]" />
        <div className="absolute right-[-15rem] top-[20vh] h-[28rem] w-[28rem] rounded-full bg-accent/20 blur-[180px]" />
        <div className="absolute inset-x-0 bottom-[-10rem] h-[22rem] bg-[radial-gradient(70%_70%_at_50%_0%,rgba(255,255,255,0.04),rgba(0,0,0,0))]" />
      </div>

      <Navbar />

      <main className="container mx-auto px-4 pb-24 pt-16">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Marketplace
            </p>
            <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Live encrypted auctions</h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
              Explore ongoing drops sourced from our fully homomorphic auction contracts.
              Every bid stays private until reveal—making bidding fair and transparent.
            </p>
          </div>
          <Button
            asChild
            className="group rounded-full bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
          >
            <Link href="/create-auction">
              <Gavel className="mr-2 h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              Launch new auction
            </Link>
          </Button>
        </div>

        <section className="mt-12">{content}</section>
      </main>

      <Footer />
    </div>
  );
}

function AuctionCard({ auctionId }: { auctionId: bigint }) {
  const { data: auction, isLoading, error } = useReadContract({
    address: AUCTION_ADDRESS,
    abi: AUCTION_ABI,
    functionName: "getAuctionDetails",
    args: [auctionId],
    chainId: targetChainId,
  });

  if (isLoading) {
    return <AuctionCardSkeleton />;
  }

  if (error || !auction) {
    return null;
  }

  const isActive = auction.status === AuctionStatus.Active;
  const endTimestamp = Number(auction.endTime) * 1000;
  const isEnded = Date.now() >= endTimestamp;
  const statusLabel = isEnded
    ? "Ended"
    : auction.status === AuctionStatus.Cancelled
    ? "Cancelled"
    : "Active";

  const timeRemaining =
    isEnded || auction.status !== AuctionStatus.Active
      ? "Awaiting reveal"
      : formatDistanceStrict(endTimestamp, Date.now(), { addSuffix: false });

  const imageSrc = auction.imageURI
    ? auction.imageURI.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")
    : undefined;

  return (
    <Card className="group h-full overflow-hidden border border-white/10 bg-white/5 backdrop-blur transition-all hover:border-white/20 hover:bg-white/10">
      <div className="relative">
        <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
          #{auctionId.toString().padStart(3, "0")}
        </div>
        <div className="absolute right-4 top-4 rounded-full border border-white/20 bg-black/60 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-primary">
          {statusLabel}
        </div>
        {imageSrc ? (
          <div className="relative h-60 w-full overflow-hidden">
            <Image
              src={imageSrc}
              alt={auction.itemName}
              fill
              priority={false}
              sizes="(min-width: 1280px) 320px, (min-width: 768px) 45vw, 100vw"
              className="object-cover transition-transform group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="flex h-60 w-full items-center justify-center bg-gradient-to-br from-primary/20 via-black/40 to-black">
            <Gavel className="h-10 w-10 text-primary" />
          </div>
        )}
      </div>

      <CardHeader className="space-y-3">
        <CardTitle className="line-clamp-1 text-xl font-semibold">
          {auction.itemName}
        </CardTitle>
        <CardDescription className="line-clamp-2 text-sm text-muted-foreground">
          {auction.itemDescription}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pb-6">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-muted-foreground">
          <span>
            {auction.seller.slice(0, 6)}...{auction.seller.slice(-4)}
          </span>
          <span className="flex items-center gap-2 text-foreground">
            <Clock className="h-4 w-4 text-primary" />
            {timeRemaining}
          </span>
        </div>
        <Button
          asChild
          disabled={!isActive}
          className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:border disabled:border-white/10 disabled:bg-white/10 disabled:text-muted-foreground"
        >
          <Link href={`/auction/${auctionId.toString()}`}>{isActive ? "Enter auction" : statusLabel}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

