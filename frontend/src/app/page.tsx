"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Clock, ArrowRight } from "lucide-react";
import { usePublicClient, useReadContract } from "wagmi";
import { AUCTION_ABI, AUCTION_ADDRESS } from "@/lib/contracts";
import { AuctionStatus } from "@/types/auction";
import { formatDistanceStrict } from "date-fns";
import { targetChainId } from "@/lib/network";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { isConnected } = useWallet();
  const publicClient = usePublicClient();
  const [liveAuctions, setLiveAuctions] = useState<any[]>([]);
  const [auctionLoading, setAuctionLoading] = useState<boolean>(false); // Start as false to render immediately

  const { data: totalAuctions } = useReadContract({
    address: AUCTION_ADDRESS,
    abi: AUCTION_ABI,
    functionName: "getTotalAuctions",
    chainId: targetChainId,
    query: {
      retry: 1,
      retryDelay: 1000,
      refetchOnWindowFocus: false,
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchAuctions() {
      // Don't block page load - set loading to false immediately
      setAuctionLoading(false);
      
      if (!publicClient || !totalAuctions) {
        setLiveAuctions([]);
        return;
      }

      const total = Number(totalAuctions);
      if (total === 0) {
        setLiveAuctions([]);
        return;
      }

      // Fetch in background without blocking
      setAuctionLoading(true);
      const latestIds = Array.from({ length: Math.min(total, 6) }, (_, idx) => BigInt(total - idx));

      try {
        const results = await Promise.allSettled(
          latestIds.map(async (id) => {
            try {
              const auction = await Promise.race([
                publicClient.readContract({
                  address: AUCTION_ADDRESS,
                  abi: AUCTION_ABI,
                  functionName: "getAuctionDetails",
                  args: [id],
                }),
                new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000))
              ]);
              return { ...(auction as any), auctionId: id };
            } catch (error) {
              console.warn(`Failed to fetch auction ${id.toString()}`, error);
              return null;
            }
          })
        );

        const activeAuctions = results
          .map((result) => result.status === "fulfilled" ? result.value : null)
          .filter((auction): auction is NonNullable<typeof auction> => Boolean(auction))
          .filter((auction) => auction.status === AuctionStatus.Active)
          .sort((a, b) => Number(a.endTime - b.endTime));

        setLiveAuctions(activeAuctions);
      } catch (error) {
        console.error("Error fetching auctions:", error);
        setLiveAuctions([]);
      } finally {
        setAuctionLoading(false);
      }
    }

    fetchAuctions();
  }, [publicClient, totalAuctions]);

  const formatTimeRemaining = (endTime: bigint) => {
    const endDate = Number(endTime) * 1000;
    if (Number.isNaN(endDate)) return "—";
    const now = Date.now();
    if (endDate <= now) return "Ended";
    const timeStr = formatDistanceStrict(endDate, now, { addSuffix: false });
    // Format as "Xd Xh Xm Xs" style like SuperRare
    return timeStr;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section - SuperRare Style */}
        <section className="mb-16 text-center">
          <h1 className="mb-4 text-5xl font-light tracking-tight md:text-7xl">
            Encrypted Art Auctions
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-400">
            Private bidding on encrypted artwork. Reveal only when it counts.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/auctions">
              <Button className="rounded-full bg-white px-8 py-6 text-black hover:bg-gray-200">
                Explore Auctions
              </Button>
            </Link>
            {mounted && isConnected && (
              <Link href="/create-auction">
                <Button variant="outline" className="rounded-full border-white/20 px-8 py-6">
                  Create Auction
                </Button>
              </Link>
            )}
          </div>
        </section>

        {/* Auctions Section - SuperRare Style */}
        <section className="mb-16">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-light">Auctions</h2>
            <Link href="/auctions" className="text-sm text-gray-400 hover:text-white">
              See All <ArrowRight className="ml-1 inline h-4 w-4" />
            </Link>
          </div>

          {auctionLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={`skeleton-${idx}`}
                  className="animate-pulse space-y-4 rounded-lg bg-gray-900 p-4"
                >
                  <div className="aspect-square w-full rounded-lg bg-gray-800" />
                  <div className="h-4 w-3/4 rounded bg-gray-800" />
                  <div className="h-4 w-1/2 rounded bg-gray-800" />
                </div>
              ))}
            </div>
          ) : liveAuctions.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {liveAuctions.slice(0, 6).map((auction) => (
                <Link
                  key={auction.auctionId.toString()}
                  href={`/auction/${auction.auctionId.toString()}`}
                  className="group"
                >
                  <div className="space-y-3">
                    <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-900">
                      {auction.imageURI ? (
                        <img
                          src={auction.imageURI}
                          alt={auction.itemName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                          <span className="text-4xl text-gray-600">🎨</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-300">{auction.itemName}</p>
                      <p className="text-xs text-gray-500">
                        {auction.seller.slice(0, 6)}...{auction.seller.slice(-4)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock className="h-4 w-4" />
                      <span>{formatTimeRemaining(auction.endTime)}</span>
                      <span className="ml-auto font-medium text-white">Place a Bid</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-12 text-center">
              <p className="mb-4 text-gray-400">No live auctions yet.</p>
              {mounted && isConnected ? (
                <Link href="/create-auction">
                  <Button className="rounded-full bg-white px-6 py-3 text-black hover:bg-gray-200">
                    Create First Auction
                  </Button>
                </Link>
              ) : (
                <WalletConnectButton />
              )}
            </div>
          )}
        </section>

        {/* Featured Section - Only show if we have auctions */}
        {liveAuctions.length > 0 && (
          <section className="mb-16">
            <h2 className="mb-8 text-2xl font-light">Featured</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {liveAuctions.slice(0, 4).map((auction) => (
                <Link
                  key={auction.auctionId.toString()}
                  href={`/auction/${auction.auctionId.toString()}`}
                  className="group"
                >
                  <div className="space-y-3">
                    <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-900">
                      {auction.imageURI ? (
                        <img
                          src={auction.imageURI}
                          alt={auction.itemName}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 transition-transform group-hover:scale-105">
                          <span className="text-4xl text-gray-600">🎨</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{auction.itemName}</p>
                      <p className="text-xs text-gray-500">
                        {auction.seller.slice(0, 6)}...{auction.seller.slice(-4)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock className="h-4 w-4" />
                      <span>{formatTimeRemaining(auction.endTime)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Newsletter Section - SuperRare Style */}
        <section className="mb-16 rounded-lg border border-gray-800 bg-gray-900/30 p-12 text-center">
          <h2 className="mb-4 text-2xl font-light">Subscribe for weekly updates</h2>
          <p className="mb-6 text-gray-400">Get notified about new encrypted art auctions</p>
          <form className="mx-auto flex max-w-md gap-3">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 rounded-full border border-gray-700 bg-black px-6 py-3 text-white placeholder:text-gray-500 focus:border-white focus:outline-none"
            />
            <Button
              type="submit"
              className="rounded-full bg-white px-6 py-3 text-black hover:bg-gray-200"
            >
              Subscribe
            </Button>
          </form>
        </section>
      </main>

      <Footer />
    </div>
  );
}
