"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";
import { useWallet } from "@/hooks/useWallet";
import { Search, Plus, LayoutDashboard, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isConnected } = useWallet();

  useEffect(() => {
    setMounted(true);
  }, []);

  const navLinks = [
    { href: "/auctions", label: "Marketplace", icon: Search },
    ...(mounted && isConnected
      ? [
          { href: "/create-auction", label: "Create", icon: Plus },
          { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        ]
      : []),
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/10">
              <span className="text-sm font-semibold uppercase tracking-[0.35em] text-white">EB</span>
              <span className="absolute inset-0 rounded-full bg-primary/20 blur-lg" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold tracking-tight text-white">
                EncryptedBidSecure
              </span>
              <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
                Encrypted auctions
              </span>
            </div>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 text-xs uppercase tracking-[0.35em] transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            <WalletConnectButton />
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 py-4">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm uppercase tracking-[0.3em] transition-colors ${
                      isActive
                        ? "bg-white/10 text-primary"
                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

