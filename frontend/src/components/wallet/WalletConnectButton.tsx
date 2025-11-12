"use client";

import { useState, useEffect, useMemo } from "react";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { formatAddress } from "@/lib/utils";
import { Loader2, Wallet as WalletIcon, LogOut, AlertCircle } from "lucide-react";
import { WalletModal } from "./WalletModal";

export function WalletConnectButton() {
  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
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

  // All hooks must be called before any conditional returns
  useEffect(() => {
    setMounted(true);
  }, []);

  // Debug: Log state changes - MUST be before any early returns
  useEffect(() => {
    if (mounted) {
      console.log("WalletConnectButton state:", { 
        showModal, 
        isConnected, 
        isPending, 
        connectorsCount: connectors?.length 
      });
    }
  }, [mounted, showModal, isConnected, isPending, connectors]);

  // All useMemo hooks must be called before any conditional returns
  const readyConnectors = useMemo(
    () => (connectors ?? []).filter((connector) => connector.ready && connector.id !== "injected"),
    [connectors]
  );

  const injectedConnector = useMemo(
    () => connectors?.find((connector) => connector.id === "injected"),
    [connectors]
  );

  const hasEthereum = typeof window !== "undefined" && Boolean((window as any).ethereum);

  // Prevent hydration mismatch - render same on server and client initially
  // Show simple button until mounted to avoid server/client mismatch
  if (!mounted) {
    return (
      <div className="rounded-full bg-white text-black px-6 py-2 flex items-center justify-center gap-2 font-medium">
        <WalletIcon className="h-4 w-4" />
        <span>Connect Wallet</span>
      </div>
    );
  }

  // Don't show loading state - show connect button immediately
  // if (!mounted) {
  //   return (
  //     <div className="flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
  //       <Loader2 className="mr-2 h-3 w-3 animate-spin text-primary" />
  //       Loading wallet
  //     </div>
  //   );
  // }

  // If connected and wrong network
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

  // If connected, show address and disconnect button
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

  // Show connect button that opens modal - ALWAYS show this if not connected
  const handleOpenModal = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    console.log("Connect button clicked, opening modal", { 
      showModal, 
      isPending, 
      connectorsCount: connectors?.length || 0 
    });
    
    if (isPending) {
      console.warn("Connection in progress, modal not opened");
      return;
    }
    
    setShowModal(true);
    console.log("Modal state set to true");
  };

  // Direct connect if only one ready connector (skip modal)
  const handleDirectConnect = async () => {
    const readyConnector = connectors?.find(c => c.ready);
    if (readyConnector && connectors?.length === 1) {
      console.log("Direct connecting with single ready connector:", readyConnector.id);
      try {
        await connectWallet(readyConnector.id);
      } catch (error) {
        console.error("Direct connect failed, opening modal:", error);
        setShowModal(true);
      }
      return;
    }
    handleOpenModal();
  };

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log("Button clicked!", { showModal, isPending });
          handleOpenModal(e);
        }}
        onMouseDown={(e) => {
          // Prevent any default behavior
          e.preventDefault();
        }}
        disabled={isPending}
        className="rounded-full bg-white text-black hover:bg-gray-200 active:bg-gray-300 px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50"
        type="button"
        aria-label="Connect Wallet"
        data-testid="connect-wallet-button"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <WalletIcon className="h-4 w-4" />
            Connect Wallet
          </>
        )}
      </button>
      <WalletModal 
        isOpen={showModal} 
        onClose={() => {
          console.log("Closing modal");
          setShowModal(false);
        }} 
      />
    </>
  );
}
