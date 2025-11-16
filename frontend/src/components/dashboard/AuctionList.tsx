import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CountdownTimer } from "@/components/auction/CountdownTimer";
import { cn, formatAddress } from "@/lib/utils";
import type { UserAuction } from "@/hooks/useUserAuctions";

interface AuctionListProps {
  auctions: UserAuction[];
}

const statusStyles: Record<string, string> = {
  Active: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
  Ended: "border-blue-400/40 bg-blue-500/10 text-blue-200",
  Cancelled: "border-rose-400/40 bg-rose-500/10 text-rose-200",
};

export function AuctionList({ auctions }: AuctionListProps) {
  if (!auctions.length) return null;

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur">
      <CardHeader>
        <CardTitle>My encrypted listings</CardTitle>
        <CardDescription>Full history and status of every auction you launched.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {auctions.map((auction) => {
          const statusClassName = statusStyles[auction.status] ?? "border-white/20 bg-white/10 text-foreground";
          const endDate = Number(auction.endTime) * 1000;
          const startDate = Number(auction.startTime) * 1000;
          const timeline = auction.timeline.slice(0, 4);

          return (
            <div
              key={auction.auctionId.toString()}
              className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-5 shadow-sm transition hover:border-white/20 hover:bg-black/50"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold text-foreground">{auction.itemName}</h3>
                    <span
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.25em]",
                        statusClassName
                      )}
                    >
                      {auction.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{auction.itemDescription}</p>
                  <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                    Auction #{auction.auctionId.toString()}
                  </p>
                </div>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="rounded-full border-white/20 bg-white/5 text-foreground hover:bg-white/10"
                >
                  <Link href={`/auction/${auction.auctionId}`}>Open auction</Link>
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <Information label="Created" value={format(startDate, "PPpp")} />
                <Information
                  label="Ends"
                  value={
                    auction.status === "Active"
                      ? format(endDate, "PPpp")
                      : `${format(endDate, "PPpp")} • ${formatDistanceToNow(endDate, { addSuffix: true })}`
                  }
                />
                <Information label="Total bids" value={auction.bidCount.toString()} />
                <Information
                  label="Winner"
                  value={
                    auction.winner && auction.winner !== "0x0000000000000000000000000000000000000000"
                      ? formatAddress(auction.winner)
                      : "—"
                  }
                />
              </div>

              {auction.status === "Active" ? (
                <CountdownTimer endTime={auction.endTime} className="text-sm" />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Auction concluded {formatDistanceToNow(endDate, { addSuffix: true })}
                </p>
              )}

              {!!timeline.length && (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Timeline</p>
                  <ul className="space-y-2">
                    {timeline.map((event) => (
                      <li
                        key={event.id}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                      >
                        <span className="text-foreground">{event.description}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(event.timestamp * 1000, { addSuffix: true })}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function Information({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}


