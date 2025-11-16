"use client";

import Link from "next/link";

const footerLinks = [
  {
    heading: "Marketplace",
    links: [
      { label: "Live Auctions", href: "/auctions" },
      { label: "Create Auction", href: "/create-auction" },
      { label: "My Dashboard", href: "/dashboard" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Docs", href: "https://docs.zama.ai" },
      { label: "Protocol Guides", href: "https://docs.zama.ai/protocol/overview" },
      { label: "Support", href: "mailto:support@encryptedbid.xyz" },
    ],
  },
  {
    heading: "Community",
    links: [
      { label: "Twitter", href: "https://twitter.com" },
      { label: "Discord", href: "https://discord.gg" },
      { label: "Mirror", href: "https://mirror.xyz" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black/40 backdrop-blur-3xl">
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-xs font-semibold uppercase tracking-[0.35em]">
                EB
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.4em] text-muted-foreground">
                  Encrypted auctions
                </p>
                <p className="text-lg font-semibold">EncryptedBidSecure</p>
              </div>
            </div>
            <p className="max-w-sm text-sm text-muted-foreground">
              A private auction house for on-chain creators. Bid anonymously, reveal transparently, own
              the future of encrypted art.
            </p>
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
              © {new Date().getFullYear()} EncryptedBidSecure. All rights reserved.
            </p>
          </div>

          {footerLinks.map((section) => (
            <div key={section.heading}>
              <h4 className="text-sm uppercase tracking-[0.35em] text-muted-foreground">
                {section.heading}
              </h4>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="hover:text-foreground transition-colors"
                      target={link.href.startsWith("http") ? "_blank" : undefined}
                      rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}


