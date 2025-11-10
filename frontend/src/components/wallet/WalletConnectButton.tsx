"use client";

import { useState, useEffect, useMemo } from "react";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { formatAddress } from "@/lib/utils";
import { Loader2, Wallet as WalletIcon, LogOut, AlertCircle } from "lucide-react";

export function WalletConnectButton() {
  const [mounted, setMounted] = useState(false);
  const {
    address,
    isConnected,
    connectWallet,
    disconnectWallet,
    connectors,
    isPending,
    isCorrectNetwork,
    switchToTargetChain,
    targetChainName,
  } = useWallet();

  useEffect(() => {
    setMounted(true);
  }, []);

  const readyConnectors = useMemo(
    () => (connectors ?? []).filter((connector) => connector.ready && connector.id !== "injected"),
    [connectors]
  );

  const injectedConnector = useMemo(
    () => connectors?.find((connector) => connector.id === "injected"),
    [connectors]
  );

  const hasEthereum = typeof window !== "undefined" && Boolean((window as any).ethereum);

  if (!mounted) {
    return (
      <div className="flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
        <Loader2 className="mr-2 h-3 w-3 animate-spin text-primary" />
        Loading wallet
      </div>
    );
  }

  if (isConnected && !isCorrectNetwork) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-amber-100">
        <AlertCircle className="h-3 w-3" />
        Wrong network
        <Button
          variant="outline"
          size="sm"
          onClick={switchToTargetChain}
          className="border-amber-500/50 bg-transparent text-amber-100 hover:bg-amber-500/20"
        >
          Switch to {targetChainName}
        </Button>
      </div>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm tracking-wide">
          <WalletIcon className="h-4 w-4 text-primary" />
          <span className="font-medium">{formatAddress(address)}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={disconnectWallet}
          className="border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </Button>
      </div>
    );
  }

  const handleConnect = (connectorId?: string) => {
    connectWallet(connectorId);
  };

  if ((readyConnectors && readyConnectors.length > 0) || injectedConnector) {
    const connectorsToRender = readyConnectors.length > 0 ? readyConnectors : injectedConnector ? [injectedConnector] : [];

    return (
      <div className="flex flex-col gap-2 min-w-[200px]">
        {connectorsToRender.map((connector) => (
          <Button
            key={connector.id}
            onClick={() => handleConnect(connector.id)}
            className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <WalletIcon className="mr-2 h-4 w-4" />
            )}
            {isPending ? "Connecting..." : `Connect ${connector.name}`}
          </Button>
        ))}
      </div>
    );
  }

  if (hasEthereum) {
    return (
      <Button
        onClick={() => handleConnect()}
        className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <WalletIcon className="mr-2 h-4 w-4" />
        )}
        {isPending ? "Connecting..." : "Connect Wallet"}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
      <AlertCircle className="h-3 w-3 text-accent" />
      Install a Web3 wallet to connect
    </div>
  );
}
