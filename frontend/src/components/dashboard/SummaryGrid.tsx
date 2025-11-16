import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface SummaryItem {
  title: string;
  description: string;
  value: string | number;
  icon: LucideIcon;
  cta?: ReactNode;
  highlight?: boolean;
}

interface SummaryGridProps {
  items: SummaryItem[];
  className?: string;
}

export function SummaryGrid({ items, className }: SummaryGridProps) {
  if (!items.length) return null;

  return (
    <div className={cn("grid gap-6 md:grid-cols-3", className)}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card
            key={item.title}
            className={cn(
              "border-white/10 bg-white/5 backdrop-blur transition hover:border-white/20 hover:bg-white/10",
              item.highlight && "border-primary/40 bg-primary/10"
            )}
          >
            <CardHeader className="space-y-4">
              <Icon className="h-6 w-6 text-primary" />
              <div>
                <CardTitle className="text-xl">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </div>
              <p className="text-3xl font-semibold text-foreground">{item.value}</p>
            </CardHeader>
            {item.cta && <CardContent>{item.cta}</CardContent>}
          </Card>
        );
      })}
    </div>
  );
}


