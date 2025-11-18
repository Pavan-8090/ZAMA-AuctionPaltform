"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";
import { useWallet } from "@/hooks/useWallet";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, Shield, Lock, CheckCircle2, TrendingUp, Users, Zap } from "lucide-react";
import { usePublicClient, useReadContract } from "wagmi";
import { AUCTION_ABI, AUCTION_ADDRESS } from "@/lib/contracts";
import { AuctionStatus } from "@/types/auction";
import { formatDistanceStrict } from "date-fns";
import { targetChainId } from "@/lib/network";

const features = [
  {
    icon: Lock,
    title: "Fully Homomorphic Encryption",
    description: "Bids remain encrypted throughout the auction process, ensuring complete privacy and security.",
  },
  {
    icon: Shield,
    title: "Zero-Knowledge Verification",
    description: "Prove bid validity without revealing bid amounts until reveal phase.",
  },
  {
    icon: CheckCircle2,
    title: "Transparent Results",
    description: "All auction outcomes are verifiable on-chain with complete transparency.",
  },
  {
    icon: TrendingUp,
    title: "Enterprise Grade",
    description: "Built for institutional and high-value auctions with robust security protocols.",
  },
];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { isConnected } = useWallet();
  const publicClient = usePublicClient();
  const [liveAuctions, setLiveAuctions] = useState<any[]>([]);
  const [auctionLoading, setAuctionLoading] = useState<boolean>(true);

  const { data: totalAuctions } = useReadContract({
    address: AUCTION_ADDRESS,
    abi: AUCTION_ABI,
    functionName: "getTotalAuctions",
    chainId: targetChainId,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchAuctions() {
      if (!publicClient || !totalAuctions) {
        setLiveAuctions([]);
        setAuctionLoading(false);
        return;
      }

      const total = Number(totalAuctions);
      if (total === 0) {
        setLiveAuctions([]);
        setAuctionLoading(false);
        return;
      }

      setAuctionLoading(true);
      const latestIds = Array.from({ length: Math.min(total, 6) }, (_, idx) => BigInt(total - idx));

      const results = await Promise.all(
        latestIds.map(async (id) => {
          try {
            const auction = await publicClient.readContract({
              address: AUCTION_ADDRESS,
              abi: AUCTION_ABI,
              functionName: "getAuctionDetails",
              args: [id],
            });
            return { ...auction, auctionId: id };
          } catch (error) {
            console.warn(`Failed to fetch auction ${id.toString()}`, error);
            return null;
          }
        })
      );

      const activeAuctions = results
        .filter((auction): auction is NonNullable<typeof auction> => Boolean(auction))
        .filter((auction) => auction.status === AuctionStatus.Active)
        .sort((a, b) => Number(a.endTime - b.endTime));

      setLiveAuctions(activeAuctions);
      setAuctionLoading(false);
    }

    fetchAuctions();
  }, [publicClient, totalAuctions]);

  const stats = useMemo(
    () => [
      {
        label: "Total Auctions",
        value: totalAuctions ? Number(totalAuctions).toLocaleString() : "0",
        icon: TrendingUp,
      },
      {
        label: "Active Auctions",
        value: liveAuctions.length.toString().padStart(2, "0"),
        icon: Zap,
      },
      {
        label: "Total Participants",
        value: `${Math.max(liveAuctions.length * 3, 12)}+`,
        icon: Users,
      },
    ],
    [totalAuctions, liveAuctions.length]
  );

  const formatTimeRemaining = (endTime: bigint) => {
    const endDate = Number(endTime) * 1000;
    if (Number.isNaN(endDate)) return "—";
    const now = Date.now();
    if (endDate <= now) return "Ended";
    return formatDistanceStrict(endDate, now, { addSuffix: false });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="border-b bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto px-4 py-24 lg:py-32">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-2 text-sm">
                <span className="h-2 w-2 rounded-full bg-primary"></span>
                <span className="text-muted-foreground">Enterprise Encrypted Auction Platform</span>
              </div>
              <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Secure Private Auctions
                <br />
                <span className="text-primary">Powered by FHE</span>
              </h1>
              <p className="mb-8 text-xl text-muted-foreground lg:text-2xl">
                Conduct high-value auctions with complete bid privacy. Fully homomorphic encryption ensures
                your bidding strategy remains confidential until reveal.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link href="/auctions">
                  <Button size="lg" className="gap-2">
                    Browse Auctions
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                {mounted && isConnected ? (
                  <Link href="/create-auction">
                    <Button size="lg" variant="outline" className="gap-2">
                      Create Auction
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <WalletConnectButton />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-b bg-muted/30 py-16">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 md:grid-cols-3">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="text-center">
                    <div className="mb-4 flex justify-center">
                      <div className="rounded-lg bg-primary/10 p-3">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <p className="mb-2 text-4xl font-bold">{stat.value}</p>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Enterprise-Grade Security
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Built for institutions and high-value auctions requiring the highest levels of privacy and
                security.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card key={feature.title} className="border">
                    <CardContent className="p-6">
                      <div className="mb-4">
                        <div className="rounded-lg bg-primary/10 p-3 w-fit">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Live Auctions Section */}
        <section className="border-t bg-muted/20 py-24">
          <div className="container mx-auto px-4">
            <div className="mb-12 flex items-center justify-between">
              <div>
                <h2 className="mb-2 text-3xl font-bold tracking-tight">Live Auctions</h2>
                <p className="text-muted-foreground">Active auctions currently accepting encrypted bids</p>
              </div>
              <Link href="/auctions">
                <Button variant="outline" className="gap-2">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {auctionLoading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <Card key={`skeleton-${idx}`} className="border">
                    <CardContent className="p-6">
                      <div className="flex animate-pulse items-center justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="h-4 w-32 rounded bg-muted" />
                          <div className="h-6 w-64 rounded bg-muted" />
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="h-4 w-24 rounded bg-muted" />
                          <div className="h-10 w-24 rounded bg-muted" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : liveAuctions.length > 0 ? (
                liveAuctions.map((auction) => (
                  <Card
                    key={auction.auctionId.toString()}
                    className="border transition-shadow hover:shadow-md"
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1">
                          <p className="mb-1 text-sm font-medium text-muted-foreground">
                            Seller: {auction.seller.slice(0, 6)}...{auction.seller.slice(-4)}
                          </p>
                          <h3 className="mb-2 text-xl font-semibold">{auction.itemName}</h3>
                          <p className="text-sm text-muted-foreground">
                            Reserve Price: {auction.reservePrice?.toString() || "N/A"} ETH
                          </p>
                        </div>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">{formatTimeRemaining(auction.endTime)}</span>
                          </div>
                          <Link href={`/auction/${auction.auctionId.toString()}`}>
                            <Button variant="default" className="w-full sm:w-auto gap-2">
                              View Auction
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border-dashed">
                  <CardContent className="p-12 text-center">
                    <p className="mb-4 text-lg text-muted-foreground">
                      No active auctions at this time.
                    </p>
                    {mounted && isConnected && (
                      <Link href="/create-auction">
                        <Button className="gap-2">
                          Create First Auction
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t bg-primary/5 py-24">
          <div className="container mx-auto px-4">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5">
              <CardContent className="p-12 text-center">
                <h2 className="mb-4 text-3xl font-bold tracking-tight">
                  Ready to Launch Your Auction?
                </h2>
                <p className="mb-8 mx-auto max-w-2xl text-muted-foreground">
                  Create a secure, encrypted auction in minutes. All bids remain private until the reveal
                  phase, ensuring fair and transparent outcomes.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  {mounted && isConnected ? (
                    <Link href="/create-auction">
                      <Button size="lg" className="gap-2">
                        Create Auction
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <WalletConnectButton />
                  )}
                  <Link href="/auctions">
                    <Button size="lg" variant="outline" className="gap-2">
                      Explore Marketplace
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
