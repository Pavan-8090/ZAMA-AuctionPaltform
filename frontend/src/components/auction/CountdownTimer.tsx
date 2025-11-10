"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  endTime: bigint;
  className?: string;
}

export function CountdownTimer({ endTime, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isEnded, setIsEnded] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const end = Number(endTime);
      const difference = end - now;

      if (difference <= 0) {
        setIsEnded(true);
        setTimeLeft("Ended");
        return;
      }

      const days = Math.floor(difference / 86400);
      const hours = Math.floor((difference % 86400) / 3600);
      const minutes = Math.floor((difference % 3600) / 60);
      const seconds = difference % 60;

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Clock className={cn("h-4 w-4", isEnded ? "text-muted-foreground" : "text-primary")} />
      <span
        className={cn(
          "text-sm font-medium",
          isEnded ? "text-muted-foreground" : "text-foreground"
        )}
      >
        {isEnded ? "Auction Ended" : timeLeft}
      </span>
    </div>
  );
}

