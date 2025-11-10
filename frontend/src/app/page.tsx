"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";
import { useWallet } from "@/hooks/useWallet";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Clock, Diamond, Flame, Sparkles } from "lucide-react";
import { usePublicClient, useReadContract } from "wagmi";
import { AUCTION_ABI, AUCTION_ADDRESS } from "@/lib/contracts";
import { AuctionStatus } from "@/types/auction";
import { formatDistanceStrict } from "date-fns";
import { targetChainId } from "@/lib/network";

const featuredCollections = [
  {
    title: "Quantum Bloom",
    artist: "@aurora",
    blurb: "Generative forms exploring encrypted motion and archival light.",
    tag: "Reserve",
  },
  {
    title: "Ciphered Echoes",
    artist: "@noirwave",
    blurb: "A study of secrecy and revelation in fully homomorphic space.",
    tag: "Live Auction",
  },
  {
    title: "Spectral Rebuild",
    artist: "@voidworks",
    blurb: "Industrial palettes reconstructed through private liquidity.",
    tag: "Edition of 5",
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
      },
      {
        label: "Active Auctions",
        value: liveAuctions.length.toString().padStart(2, "0"),
      },
      {
        label: "Private Bids Sealed",
        value: `${Math.max(liveAuctions.length * 3, 12)}+`,
      },
    ],
    [totalAuctions, liveAuctions.length]
  );

  const spotlightCreators = [
    {
      handle: "@anodic",
      description: "Architect of encrypted glitches and luminous decay.",
    },
    {
      handle: "@cipherpunk",
      description: "Bridging ZK cryptography with immersive lightscapes.",
    },
    {
      handle: "@0xMeridian",
      description: "Procedural anthropologies revealed at reveal time.",
    },
  ];

  const formatTimeRemaining = (endTime: bigint) => {
    const endDate = Number(endTime) * 1000;
    if (Number.isNaN(endDate)) return "—";
    const now = Date.now();
    if (endDate <= now) return "Ended";
    return formatDistanceStrict(endDate, now, { addSuffix: false });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 top-32 h-96 w-96 rounded-full bg-primary/20 blur-[140px]" />
        <div className="absolute right-[-12rem] top-16 h-[28rem] w-[28rem] rounded-full bg-accent/20 blur-[160px]" />
        <div className="absolute inset-x-0 bottom-[-12rem] h-[22rem] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(255,255,255,0.05),rgba(0,0,0,0))]" />
      </div>

      <Navbar />

      <main className="container mx-auto px-4 pb-32 pt-16">
        <section className="grid items-start gap-16 lg:grid-cols-[1.25fr_1fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-widest text-muted-foreground">
              <span className="inline-flex h-2 w-2 rounded-full bg-primary"></span>
              Live encrypted marketplace
            </div>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Collect encrypted art,
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-white via-white/80 to-white/40 bg-clip-text text-transparent">
                reveal only when it counts.
              </span>
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              EncryptedBidSecure is the private auction house for on-chain creators. Every bid is sealed
              under fully homomorphic encryption—transparent results, invisible strategies.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/auctions">
                <Button className="group bg-primary text-primary-foreground hover:bg-primary/90">
                  Explore Auctions
                  <ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Button>
              </Link>
              {mounted && isConnected ? (
                <Link href="/create-auction">
                  <Button
                    variant="outline"
                    className="border-white/20 bg-white/5 text-foreground hover:bg-white/10"
                  >
                    Launch Auction
                  </Button>
                </Link>
              ) : (
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  <WalletConnectButton />
                </div>
              )}
              <div className="flex items-center gap-6 text-xs uppercase tracking-widest text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Zero knowledge reveal
                </span>
                <span className="hidden sm:inline-flex items-center gap-2">
                  <Diamond className="h-4 w-4 text-accent" />
                  Curated drops
                </span>
              </div>
            </div>
          </div>

          <div className="relative rounded-[2.5rem] border border-white/5 bg-card p-6 shadow-[0_0_120px_-40px_rgba(130,130,255,0.35)]">
            <div className="absolute -top-6 left-6 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Featured Lot
            </div>
            <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-white/20 via-white/5 to-transparent">
              <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(168,149,255,0.8),_rgba(15,15,35,0.9))]" />
            </div>
            <div className="mt-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Encrypted reserve</p>
                <p className="text-lg font-semibold">0xA1B...F92</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase text-muted-foreground">Ending in</p>
                <p className="text-lg font-semibold">05h 18m</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-3 rounded-[2rem] border border-white/5 bg-black/30 p-8 backdrop-blur">
          <div className="grid gap-6 text-center sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-semibold">{stat.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-24 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Featured drops</p>
              <h2 className="mt-2 text-2xl font-semibold">Curated encrypted works</h2>
            </div>
            <Link href="/auctions" className="text-sm text-muted-foreground hover:text-foreground">
              View all
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {featuredCollections.map((item) => (
              <Card
                key={item.title}
                className="group overflow-hidden border-white/5 bg-gradient-to-b from-white/5 via-transparent to-transparent transition-all hover:border-white/15"
              >
                <CardContent className="space-y-6 p-6">
                  <div className="space-y-3">
                    <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{item.tag}</span>
                    <h3 className="text-xl font-semibold transition-colors group-hover:text-primary">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{item.blurb}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    <span>{item.artist}</span>
                    <Link href="/auctions" className="inline-flex items-center gap-1 text-foreground">
                      Explore <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-24 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Live auctions</p>
                <h2 className="mt-2 text-2xl font-semibold">Streaming on-chain activity</h2>
              </div>
              <Link href="/auctions" className="text-sm text-muted-foreground hover:text-foreground">
                Browse marketplace
              </Link>
            </div>
            <div className="space-y-4">
              {auctionLoading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={`skeleton-${idx}`}
                    className="flex animate-pulse items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-6 py-4"
                  >
                    <div className="space-y-2">
                      <div className="h-3 w-32 rounded-full bg-white/10" />
                      <div className="h-5 w-48 rounded-full bg-white/10" />
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="h-4 w-20 rounded-full bg-white/10" />
                      <div className="h-4 w-24 rounded-full bg-white/10" />
                    </div>
                  </div>
                ))
              ) : liveAuctions.length > 0 ? (
                liveAuctions.map((auction) => (
                  <div
                    key={auction.auctionId.toString()}
                    className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-6 py-4 backdrop-blur transition-all hover:border-white/15 hover:bg-white/10"
                  >
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                        {auction.seller.slice(0, 6)}...{auction.seller.slice(-4)}
                      </p>
                      <p className="text-lg font-semibold">{auction.itemName}</p>
                    </div>
                    <div className="flex items-center gap-8 text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4 text-primary" />
                        {formatTimeRemaining(auction.endTime)}
                      </span>
                      <Link
                        href={`/auction/${auction.auctionId.toString()}`}
                        className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-4 py-2 text-xs uppercase tracking-[0.3em] text-primary transition hover:bg-primary/10"
                      >
                        Enter
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-between rounded-2xl border border-dashed border-white/10 bg-white/5 px-6 py-6 text-sm text-muted-foreground">
                  <span>No live auctions yet. Be the first to list an encrypted piece.</span>
                  <Link
                    href="/create-auction"
                    className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-4 py-2 text-xs uppercase tracking-[0.3em] text-primary transition hover:bg-primary/10"
                  >
                    List now
                    <Flame className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          <Card className="border-white/5 bg-gradient-to-br from-white/10 via-white/5 to-transparent">
            <CardContent className="space-y-8 p-8">
              <div className="space-y-3">
                <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Newsletter</span>
                <h3 className="text-2xl font-semibold">Weekly curation dispatch</h3>
                <p className="text-sm text-muted-foreground">
                  Receive encrypted auction theses and curator spotlights in your inbox.
                </p>
              </div>
              <form className="space-y-3">
                <input
                  type="email"
                  placeholder="your@email"
                  className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-white/30 focus:outline-none focus:ring-0"
                />
                <Button type="submit" className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                  Subscribe
                </Button>
              </form>
              <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
                Zero spam • Encrypted intel only
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="mt-24 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <Card className="border-white/5 bg-white/5">
            <CardContent className="space-y-6 p-8">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Editorial spotlight
              </p>
              <h3 className="text-2xl font-semibold">
                Private markets, public culture: a curator’s thesis on encrypted auctions
              </h3>
              <p className="text-sm text-muted-foreground">
                EncryptedBidSecure empowers creators to run silent auctions without sacrificing the
                storytelling that collectors crave. Dive into weekly essays from curators covering privacy-as-performance,
                sealed bid patronage, and collective reveals.
              </p>
              <Link
                href="/auctions"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Read the curation brief
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>

          <Card className="border-white/5 bg-white/5">
            <CardContent className="space-y-6 p-8">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Creator spotlight</p>
              <div className="space-y-6">
                {spotlightCreators.map((creator) => (
                  <div key={creator.handle} className="space-y-2">
                    <p className="text-sm uppercase tracking-[0.3em] text-primary">{creator.handle}</p>
                    <p className="text-sm text-muted-foreground">{creator.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
}
