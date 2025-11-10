import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { UserBid } from "@/hooks/useUserAuctions";

interface BidListProps {
  bids: UserBid[];
}

export function BidList({ bids }: BidListProps) {
  if (!bids.length) return null;

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur">
      <CardHeader>
        <CardTitle>My encrypted bids</CardTitle>
        <CardDescription>Every bid you have placed, with reveal and refund status.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {bids.map((bid) => {
          const timestampMs = bid.timestamp * 1000;

          return (
            <div
              key={`${bid.auctionId.toString()}-${bid.timestamp}-${bid.bidder}`}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/40 px-5 py-4 transition hover:border-white/20 hover:bg-black/50 md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground">
                  {bid.auctionName || `Auction #${bid.auctionId.toString()}`}
                </h3>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Submitted {formatDistanceToNow(timestampMs, { addSuffix: true })} &middot;{" "}
                  {format(timestampMs, "PPpp")}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-[0.3em]">
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
          );
        })}
      </CardContent>
    </Card>
  );
}


