import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ClientMonitoring } from "@/components/ClientMonitoring";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Encrypted Bidding Marketplace",
  description: "Decentralized auction platform with encrypted bids",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <Providers>
            <ClientMonitoring />
            {children}
            <Toaster />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}

