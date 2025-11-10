import { formatDistanceToNow, format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gavel, Trophy, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { DashboardActivity } from "@/hooks/useUserAuctions";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface ActivityFeedProps {
  activity: DashboardActivity[];
}

const typeCopy: Record<DashboardActivity["type"], { label: string; icon: LucideIcon; tone: string }> = {
  "auction-created": {
    label: "Auction created",
    icon: Gavel,
    tone: "border-white/20 bg-white/5 text-foreground",
  },
  "bid-submitted": {
    label: "Bid submitted",
    icon: ShieldCheck,
    tone: "border-primary/30 bg-primary/10 text-primary-foreground",
  },
  "auction-ended": {
    label: "Auction ended",
    icon: Trophy,
    tone: "border-emerald-300/40 bg-emerald-500/10 text-emerald-100",
  },
};

export function ActivityFeed({ activity }: ActivityFeedProps) {
  if (!activity.length) return null;

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur">
      <CardHeader>
        <CardTitle>Activity feed</CardTitle>
        <CardDescription>Chronological list of your auction-side transactions and events.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activity.map((event) => {
          const copy = typeCopy[event.type];
          const Icon = copy.icon;
          const timestampMs = event.timestamp * 1000;

          return (
            <div
              key={event.id}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/40 px-5 py-4 transition hover:border-white/20 hover:bg-black/50 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border bg-black/60 text-foreground",
                    copy?.tone
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">{event.title}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    {copy.label} &middot; {formatDistanceToNow(timestampMs, { addSuffix: true })}
                  </p>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 text-right">
                <span className="text-xs text-muted-foreground">{format(timestampMs, "PPpp")}</span>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="rounded-full border-white/20 bg-white/5 text-foreground hover:bg-white/10"
                >
                  <Link href={`/auction/${event.auctionId}`}>Open auction</Link>
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}


