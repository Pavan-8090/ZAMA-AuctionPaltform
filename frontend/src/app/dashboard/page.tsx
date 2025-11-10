"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatAddress } from "@/lib/utils";
import Link from "next/link";
import { CircleDot, Gavel, Package, Trophy } from "lucide-react";
import { useUserAuctions } from "@/hooks/useUserAuctions";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useWallet } from "@/hooks/useWallet";
import { useReadContract } from "wagmi";
import { AUCTION_ABI, AUCTION_ADDRESS } from "@/lib/contracts";
import { targetChainId } from "@/lib/network";

export default function DashboardPage() {
  const {
    address,
    isConnected,
    isCorrectNetwork,
    targetChainName: expectedChainName,
    switchToTargetChain,
    chain,
  } = useWallet();
  const { userAuctions, userBids, isLoading: userDataLoading } = useUserAuctions();

  const { data: totalAuctions } = useReadContract({
    address: AUCTION_ADDRESS,
    abi: AUCTION_ABI,
    functionName: "getTotalAuctions",
    chainId: targetChainId,
    query: {
      enabled: isConnected && isCorrectNetwork,
    },
  });

  const wonAuctions = userAuctions.filter(
    (auction: any) => auction.winner?.toLowerCase() === address?.toLowerCase()
  );

  const summaryCards = [
    {
      title: "My Auctions",
      description: "Encrypted sales you launched",
      value: userAuctions.length,
      icon: Gavel,
      cta: (
        <Button asChild variant="outline" className="mt-4 w-full rounded-full border-white/20 bg-white/5 text-foreground hover:bg-white/10">
          <Link href="/create-auction">Create new auction</Link>
        </Button>
      ),
    },
    {
      title: "My Bids",
      description: "Encrypted bids you placed",
      value: userBids.length,
      icon: Package,
      cta:
        userBids.length > 0 ? (
          <Button asChild variant="outline" className="mt-4 w-full rounded-full border-white/20 bg-white/5 text-foreground hover:bg-white/10" size="sm">
            <Link href="/auctions">Review bids</Link>
          </Button>
        ) : null,
    },
    {
      title: "Won Auctions",
      description: "Auctions where you secured the piece",
      value: wonAuctions.length,
      icon: Trophy,
      cta:
        wonAuctions.length > 0 ? (
          <Button asChild variant="outline" className="mt-4 w-full rounded-full border-white/20 bg-white/5 text-foreground hover:bg-white/10" size="sm">
            <Link href="/auctions">View results</Link>
          </Button>
        ) : null,
    },
  ];

  const renderBody = () => {
    if (!isConnected) {
      return (
        <Card className="max-w-lg border-white/10 bg-black/40 backdrop-blur">
          <CardHeader className="space-y-4">
            <CircleDot className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl">Connect wallet to view dashboard</CardTitle>
            <CardDescription>
              Securely connect your wallet to monitor auctions you launched, bids you placed, and settlements awaiting reveal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/">Connect wallet</Link>
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (!isCorrectNetwork) {
      return (
        <Card className="max-w-lg border-amber-500/40 bg-amber-500/10 backdrop-blur">
          <CardHeader className="space-y-4">
            <CircleDot className="h-8 w-8 text-amber-200" />
            <CardTitle className="text-2xl text-amber-100">Switch to {expectedChainName}</CardTitle>
            <CardDescription className="text-amber-200/80">
              Your wallet is connected to {chain?.name || "another network"}. Switch to {expectedChainName} to view your encrypted auction activity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={switchToTargetChain}
              className="w-full rounded-full border border-amber-300/50 bg-transparent text-amber-100 hover:bg-amber-400/20"
              variant="outline"
            >
              Switch network
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (userDataLoading) {
      return (
        <Card className="border-white/10 bg-black/40 backdrop-blur">
          <CardContent className="py-10 text-center text-muted-foreground">Loading your encrypted activity…</CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-10">
        <div className="grid gap-6 md:grid-cols-3">
          {summaryCards.map((item) => (
            <Card key={item.title} className="border-white/10 bg-white/5 backdrop-blur transition hover:border-white/20 hover:bg-white/10">
              <CardHeader className="space-y-4">
                <item.icon className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </div>
                <p className="text-3xl font-semibold text-foreground">{item.value}</p>
              </CardHeader>
              {item.cta && <CardContent>{item.cta}</CardContent>}
            </Card>
          ))}
        </div>

        {userAuctions.length > 0 && (
          <Card className="border-white/10 bg-white/5 backdrop-blur">
            <CardHeader>
              <CardTitle>My encrypted listings</CardTitle>
              <CardDescription>Track the auctions you’ve launched and jump into reveal workflows.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {userAuctions.map((auction: any) => (
                <div
                  key={auction.auctionId?.toString()}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/40 px-5 py-4"
                >
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-foreground">{auction.itemName}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">{auction.itemDescription}</p>
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                      Auction #{auction.auctionId?.toString()}
                    </p>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="rounded-full border-white/20 bg-white/5 text-foreground hover:bg-white/10"
                  >
                    <Link href={`/auction/${auction.auctionId}`}>Open auction</Link>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {userBids.length > 0 && (
          <Card className="border-white/10 bg-white/5 backdrop-blur">
            <CardHeader>
              <CardTitle>My encrypted bids</CardTitle>
              <CardDescription>All sealed bids submitted across the marketplace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {userBids.map((bid: any, index: number) => (
                <div
                  key={`${bid.auctionId}-${index}`}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/40 px-5 py-4"
                >
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-foreground">
                      {bid.auctionName || `Auction #${bid.auctionId?.toString()}`}
                    </h3>
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                      {bid.revealed ? "Revealed" : "Encrypted"} • {bid.refunded ? "Refunded" : "Locked"}
                    </p>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="rounded-full border-white/20 bg-white/5 text-foreground hover:bg-white/10"
                  >
                    <Link href={`/auction/${bid.auctionId}`}>View auction</Link>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="border-white/10 bg-white/5 backdrop-blur">
          <CardHeader>
            <CardTitle>Account footprint</CardTitle>
            <CardDescription>Contract `0x` activity snapshot across the {expectedChainName} network.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Address" value={address ? formatAddress(address) : "—"} />
            <Metric label="Total auctions (global)" value={totalAuctions?.toString() || "0"} />
            <Metric label="Auctions created" value={userAuctions.length.toString()} />
            <Metric label="Bids submitted" value={userBids.length.toString()} />
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-20 top-24 h-80 w-80 rounded-full bg-primary/25 blur-[160px]" />
        <div className="absolute right-[-12rem] top-[35vh] h-[26rem] w-[26rem] rounded-full bg-accent/20 blur-[180px]" />
        <div className="absolute inset-x-0 bottom-[-10rem] h-[18rem] bg-[radial-gradient(70%_70%_at_50%_0%,rgba(255,255,255,0.04),rgba(0,0,0,0))]" />
      </div>

      <Navbar />

      <main className="container mx-auto px-4 pb-24 pt-16">
        <header className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Personal studio</p>
            <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Encrypted auction dashboard</h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
              Monitor every encrypted sale you launch, track sealed bids, and manage post-reveal settlements—all powered by fully homomorphic privacy.
            </p>
          </div>
          <Button
            asChild
            className="rounded-full bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
          >
            <Link href="/create-auction">Launch new auction</Link>
          </Button>
        </header>

        <section className="mt-12">{renderBody()}</section>
      </main>

      <Footer />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

