"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, CheckCircle } from "lucide-react";
import { formatAddress, formatEther } from "@/lib/utils";

interface WinnerAnnouncementProps {
  winner: string;
  winningBid: bigint;
  isYou?: boolean;
}

export function WinnerAnnouncement({ winner, winningBid, isYou }: WinnerAnnouncementProps) {
  return (
    <Card className="border-primary bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          Auction Winner
        </CardTitle>
        <CardDescription>
          {isYou ? "Congratulations! You won this auction!" : "The auction has been won"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-primary" />
          <span className="font-semibold">Winner:</span>
          <span className="font-mono">{formatAddress(winner)}</span>
          {isYou && (
            <span className="ml-2 px-2 py-1 bg-primary text-primary-foreground rounded text-xs">
              You
            </span>
          )}
        </div>
        <div className="pt-2 border-t">
          <p className="text-sm text-muted-foreground">Winning Bid:</p>
          <p className="text-2xl font-bold text-primary">{formatEther(winningBid)} ETH</p>
        </div>
      </CardContent>
    </Card>
  );
}

