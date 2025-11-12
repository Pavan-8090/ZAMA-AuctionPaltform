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
    { href: "/auctions", label: "Marketplace" },
    ...(mounted && isConnected
      ? [
          { href: "/create-auction", label: "Create" },
          { href: "/dashboard", label: "Dashboard" },
        ]
      : []),
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-800 bg-black/80 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-light tracking-tight">
            EncryptedBid
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm transition-colors ${
                    isActive ? "text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
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
              className="md:hidden text-gray-400 hover:text-white"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-800 py-4">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-2 text-sm transition-colors ${
                      isActive
                        ? "text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
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
