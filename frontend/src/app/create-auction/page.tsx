"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useAuction } from "@/hooks/useAuction";
import { useFHE } from "@/hooks/useFHE";
import { useIPFS } from "@/hooks/useIPFS";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Image as ImageIcon, Loader2, Shield, Sparkles } from "lucide-react";
import { toEncryptedValue } from "@/lib/fhevm-helpers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getExplorerTxUrl } from "@/lib/network";

export default function CreateAuctionPage() {
  const { isConnected, isCorrectNetwork, switchToTargetChain, targetChainName, chain } = useWallet();
  const { createAuction, isPending } = useAuction();
  const { encrypt, isInitialized } = useFHE();
  const { uploadFile, isUploading } = useIPFS();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);


  const [formData, setFormData] = useState({
    itemName: "",
    itemDescription: "",
    imageFile: null as File | null,
    reservePrice: "",
    duration: "7",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      toast.error("Connect your wallet to launch an auction");
      return;
    }

    if (!isCorrectNetwork) {
      toast.error(`Switch to ${targetChainName} to create auctions.`);
      return;
    }

    if (!isInitialized) {
      toast.error("Encryption client is still initializing. Please retry in a moment.");
      return;
    }

    const reservePriceNum = parseFloat(formData.reservePrice);
    if (Number.isNaN(reservePriceNum) || reservePriceNum <= 0) {
      toast.error("Reserve price must be greater than zero");
      return;
    }

    const durationDays = Number(formData.duration);
    if (!Number.isFinite(durationDays) || durationDays <= 0) {
      toast.error("Duration must be at least 1 day");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Encrypting reserve and publishing auction…");

    try {
      let imageURI = "";
      if (formData.imageFile) {
        imageURI = await uploadFile(formData.imageFile);
      }

      const encryptedReservePrice = await encrypt(toEncryptedValue(reservePriceNum));
      const durationSeconds = Math.round(durationDays * 24 * 60 * 60);

      const { receipt, hash: txHash } = await createAuction(
        formData.itemName,
        formData.itemDescription,
        imageURI,
        encryptedReservePrice,
        durationSeconds
      );

      toast.dismiss(toastId);

      const explorerUrl = getExplorerTxUrl(txHash);
      const hashLabel = txHash ? `${txHash.slice(0, 6)}...${txHash.slice(-4)}` : "View transaction";

      toast.custom(
        () => (
          <div className="pointer-events-auto flex w-80 flex-col gap-2 rounded-2xl border border-white/10 bg-black/90 p-4 text-sm text-white shadow-lg">
            <p className="text-xs uppercase tracking-[0.3em] text-primary/80">Transaction confirmed</p>
            <p className="text-sm">Auction deployed to contract.</p>
            {explorerUrl && (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-between rounded-full border border-primary/50 bg-primary/10 px-3 py-2 text-xs uppercase tracking-[0.25em] text-primary transition hover:bg-primary/20"
              >
                {hashLabel}
                <span aria-hidden>↗</span>
              </a>
            )}
          </div>
        ),
        {
          position: "bottom-right",
          duration: 8000,
        }
      );

      router.push("/auctions");
    } catch (error: any) {
      toast.dismiss(toastId);
      toast.error(error.message || "Failed to create auction", { position: "bottom-right" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderGuard = () => {
    if (!isConnected) {
      return (
        <Card className="border-white/10 bg-black/40 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl">Connect wallet to launch</CardTitle>
            <CardDescription>
              Link your wallet to encrypt reserves and push auction metadata on-chain.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/">Connect wallet</Link>
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (!isCorrectNetwork) {
      return (
        <Card className="border-amber-400/40 bg-amber-500/10 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl text-amber-100">Switch to {targetChainName}</CardTitle>
            <CardDescription className="text-amber-200/80">
              You are currently on {chain?.name || "another network"}. Switch networks to deploy encrypted auctions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={switchToTargetChain}
              className="w-full rounded-full border border-amber-200/50 bg-transparent text-amber-100 hover:bg-amber-400/20"
              variant="outline"
            >
              Switch network
            </Button>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
          Loading create auction…
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/3 h-96 w-96 rounded-full bg-primary/25 blur-[180px]" />
        <div className="absolute right-[-10rem] top-[30vh] h-[26rem] w-[26rem] rounded-full bg-accent/20 blur-[160px]" />
        <div className="absolute inset-x-0 bottom-[-10rem] h-[20rem] bg-[radial-gradient(70%_70%_at_50%_0%,rgba(255,255,255,0.04),rgba(0,0,0,0))]" />
      </div>

      <Navbar />

      <main className="container mx-auto px-4 pb-24 pt-16">
        <Link
          href="/auctions"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to auctions
        </Link>

        <section className="mt-8 grid gap-10 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-6">
            <Card className="border-white/10 bg-white/5 backdrop-blur">
              <CardHeader className="space-y-4">
                <Sparkles className="h-6 w-6 text-primary" />
                <CardTitle className="text-3xl font-semibold">
                  Mint an encrypted auction drop
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                  Upload artwork metadata, encrypt your reserve price with homomorphic privacy, and
                  publish the listing directly to the smart contract. All bids remain sealed until
                  the reveal window.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-white/10 bg-black/40 backdrop-blur">
              <CardHeader>
                <CardTitle>How it works</CardTitle>
                <CardDescription>Three silent steps to launch.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <Step
                  title="1. Curate your drop"
                  description="Provide name, description, media, and reserve price. Your reserve stays private."
                />
                <Step
                  title="2. Encrypt reserve"
                  description="We transform the reserve into an encrypted commitment compatible with the contract."
                />
                <Step
                  title="3. Publish to chain"
                  description="Transaction is sent to the auction contract on your configured network."
                />
              </CardContent>
            </Card>

            {renderGuard()}
          </div>

          <Card className="border-white/10 bg-white/5 backdrop-blur">
            <CardHeader>
              <CardTitle>Encrypted auction form</CardTitle>
              <CardDescription>
                Fill out the listing. Reserve price is encrypted locally before sending on-chain.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="itemName">Artwork title *</Label>
                  <Input
                    id="itemName"
                    value={formData.itemName}
                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                    placeholder="Encrypted Horizon No. 5"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="itemDescription">Description *</Label>
                  <textarea
                    id="itemDescription"
                    value={formData.itemDescription}
                    onChange={(e) => setFormData({ ...formData, itemDescription: e.target.value })}
                    className="min-h-[100px] w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    placeholder="Share the story behind this encrypted drop."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">Cover media</Label>
                  <div className="rounded-xl border border-dashed border-white/20 bg-black/30 px-4 py-6 text-center">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setFormData({ ...formData, imageFile: e.target.files?.[0] || null })
                      }
                    />
                    <p className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <ImageIcon className="h-4 w-4" />
                      PNG, JPG, GIF supported
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="reservePrice">Reserve price (ETH) *</Label>
                    <Input
                      id="reservePrice"
                      type="number"
                      step="0.001"
                      min="0"
                      value={formData.reservePrice}
                      onChange={(e) =>
                        setFormData({ ...formData, reservePrice: e.target.value })
                      }
                    placeholder="0.10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (days) *</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      max="30"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="7"
                      required
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 text-foreground">
                    <Shield className="h-4 w-4 text-primary" />
                    Encryption ready
                  </div>
                  <p className="mt-1">
                    We encrypt client-side. Nothing is broadcast until you confirm the transaction in
                    your wallet.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isPending || isUploading || isSubmitting || !isInitialized}
                >
                  {isPending || isUploading || isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publishing…
                    </>
                  ) : (
                    "Create auction"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Step({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

