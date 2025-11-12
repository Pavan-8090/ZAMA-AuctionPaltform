"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useConnect, useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Loader2, Wallet, X } from "lucide-react";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Wallet icons mapping
const getWalletIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("metamask")) return "🦊";
  if (lowerName.includes("okx") || lowerName.includes("okex")) return "🟢";
  if (lowerName.includes("rabby")) return "🐰";
  if (lowerName.includes("coinbase")) return "🔵";
  if (lowerName.includes("walletconnect")) return "🔷";
  if (lowerName.includes("safe")) return "🛡️";
  return "💼";
};

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { connectors: walletConnectors } = useWallet();
  const { connect, connectors, isPending, error: connectError } = useConnect();
  const { isConnected } = useAccount();
  const [detectedWallets, setDetectedWallets] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Use connectors from useConnect hook (more reliable)
  const availableConnectors = connectors || walletConnectors || [];

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;
      const wallets: string[] = [];

      // Check for specific wallet providers
      if (ethereum.isMetaMask) wallets.push("MetaMask");
      if (ethereum.isOKExWallet || ethereum.isOkxWallet) wallets.push("OKX Wallet");
      if (ethereum.isRabby) wallets.push("Rabby");
      if (ethereum.isCoinbaseWallet) wallets.push("Coinbase Wallet");
      if (ethereum.isTrust) wallets.push("Trust Wallet");
      if (ethereum.isBraveWallet) wallets.push("Brave Wallet");

      setDetectedWallets(wallets);
    }
  }, []);

  // Close modal when connected - MUST be before early return
  useEffect(() => {
    if (isConnected) {
      onClose();
    }
  }, [isConnected, onClose]);

  // Show connect error if any - MUST be before early return
  useEffect(() => {
    if (connectError) {
      setError(connectError.message || "Failed to connect wallet");
    }
  }, [connectError]);

  // Always render but conditionally show - helps with debugging
  if (!isOpen) {
    return null;
  }

  console.log("WalletModal rendered", { isOpen, availableConnectors: availableConnectors.length });

  const handleConnect = (connectorId?: string) => {
    setError(null);
    try {
      const connector = connectorId
        ? availableConnectors.find((c) => c.id === connectorId)
        : availableConnectors.find((c) => c.ready) || availableConnectors[0];
      
      if (!connector) {
        const availableIds = availableConnectors.map(c => `${c.id} (${c.name})`).join(", ");
        setError(`Wallet connector not found. Available connectors: ${availableIds || "None"}`);
        console.error("Connector not found", { requested: connectorId, available: availableConnectors });
        return;
      }

      if (!connector.ready) {
        // Provide helpful error messages based on connector type
        if (connector.id === "injected") {
          setError("No wallet extension detected. Please install MetaMask or another Web3 wallet extension.");
        } else if (connector.id.includes("walletConnect")) {
          setError("WalletConnect is not ready. Please check your internet connection and try again.");
        } else {
          setError(`${connector.name} is not ready. Please ensure the wallet extension is installed and unlocked.`);
        }
        console.warn("Connector not ready", { id: connector.id, name: connector.name, ready: connector.ready });
        return;
      }

      console.log("Connecting with connector:", { id: connector.id, name: connector.name, ready: connector.ready });
      
      connect(
        { connector },
        {
          onSuccess: (data) => {
            console.log("Connection successful:", data);
            // Modal will close via useEffect when isConnected becomes true
          },
          onError: (err: any) => {
            console.error("Connection failed:", err);
            let errorMsg = "Failed to connect wallet. Please try again.";
            
            // Provide user-friendly error messages
            if (err?.code === 4001 || err?.message?.includes("rejected") || err?.message?.includes("denied")) {
              errorMsg = "Connection rejected. Please approve the connection request in your wallet.";
            } else if (err?.code === -32002) {
              errorMsg = "Connection request already pending. Please check your wallet.";
            } else if (err?.message) {
              errorMsg = err.message;
            } else if (err?.cause?.message) {
              errorMsg = err.cause.message;
            }
            
            setError(errorMsg);
          },
        }
      );
    } catch (err: any) {
      console.error("Connection error:", err);
      const errorMsg = err?.message || err?.toString() || "Failed to connect wallet. Please try again.";
      setError(errorMsg);
    }
  };

  console.log("Available connectors:", availableConnectors.map(c => ({ id: c.id, name: c.name, ready: c.ready })));
  
  // Find MetaMask connector - check multiple possible IDs
  const metaMaskConnector = availableConnectors.find((c) => 
    c.id === "metaMaskSDK" || 
    c.id === "io.metamask" ||
    c.name?.toLowerCase().includes("metamask") ||
    (c.id === "injected" && typeof window !== "undefined" && (window as any).ethereum?.isMetaMask)
  );
  
  const injectedConnector = availableConnectors.find((c) => c.id === "injected");
  const otherConnectors = availableConnectors.filter((c) => 
    c.id !== "injected" && 
    c.id !== "metaMaskSDK" &&
    c.id !== "io.metamask" &&
    c.ready !== false
  );

  // Always show at least injected connector if ethereum is available
  const hasEthereum = typeof window !== "undefined" && Boolean((window as any).ethereum);
  const isMetaMask = typeof window !== "undefined" && Boolean((window as any).ethereum?.isMetaMask);

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm" 
      onClick={onClose}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div
        className="relative w-full max-w-md rounded-lg border border-gray-800 bg-gray-900 p-6 shadow-xl z-[10000]"
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative', zIndex: 10000 }}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-light text-white">Connect Wallet</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          {/* MetaMask - Always show first if detected */}
          {isMetaMask && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-gray-500">Connect MetaMask</p>
              <Button
                onClick={() => {
                  console.log("Connecting MetaMask...", { metaMaskConnector, injectedConnector });
                  // Try MetaMask connector first, then injected, then just "injected" ID
                  if (metaMaskConnector) {
                    handleConnect(metaMaskConnector.id);
                  } else if (injectedConnector) {
                    handleConnect(injectedConnector.id);
                  } else {
                    // Direct fallback
                    const connector = availableConnectors.find(c => c.id === "injected") || availableConnectors[0];
                    if (connector) {
                      handleConnect(connector.id);
                    } else {
                      setError("MetaMask connector not available. Please refresh the page.");
                    }
                  }
                }}
                disabled={isPending}
                className="w-full justify-start rounded-lg border-2 border-orange-500 bg-orange-500/10 px-4 py-4 text-left text-white hover:bg-orange-500/20"
              >
                <span className="mr-3 text-2xl">🦊</span>
                <div className="flex-1">
                  <div className="text-lg font-semibold">MetaMask</div>
                  <div className="text-xs text-gray-300">Click to connect your MetaMask wallet</div>
                </div>
                {isPending && <Loader2 className="h-5 w-5 animate-spin" />}
              </Button>
            </div>
          )}

          {/* Detected injected wallets */}
          {detectedWallets.length > 0 && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-gray-500">Detected Wallets</p>
              {detectedWallets.map((wallet) => {
                // Use MetaMask connector if it's MetaMask, otherwise use injected
                const connectorToUse = wallet.toLowerCase().includes("metamask") && metaMaskConnector
                  ? metaMaskConnector.id
                  : injectedConnector?.id;
                
                return (
                  <Button
                    key={wallet}
                    onClick={() => handleConnect(connectorToUse)}
                    disabled={isPending}
                    className="w-full justify-start rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-left text-white hover:bg-gray-700"
                  >
                    <span className="mr-3 text-xl">{getWalletIcon(wallet)}</span>
                    <div className="flex-1">
                      <div className="font-medium">{wallet}</div>
                      <div className="text-xs text-gray-400">Click to connect</div>
                    </div>
                    {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  </Button>
                );
              })}
            </div>
          )}

          {/* Injected connector (for any other injected wallet) - Show if MetaMask not detected */}
          {(injectedConnector || hasEthereum) && detectedWallets.length === 0 && !isMetaMask && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-gray-500">Browser Wallet</p>
              <Button
                onClick={() => handleConnect(injectedConnector?.id || "injected")}
                disabled={isPending}
                className="w-full justify-start rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-left text-white hover:bg-gray-700"
              >
                <span className="mr-3 text-xl">💼</span>
                <div className="flex-1">
                  <div className="font-medium">Browser Extension</div>
                  <div className="text-xs text-gray-400">MetaMask, OKX, Rabby, etc.</div>
                </div>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              </Button>
            </div>
          )}

          {/* Other connectors */}
          {otherConnectors.length > 0 && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-gray-500">Other Wallets</p>
              {otherConnectors.map((connector) => (
                <Button
                  key={connector.id}
                  onClick={() => handleConnect(connector.id)}
                  disabled={isPending}
                  className="w-full justify-start rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-left text-white hover:bg-gray-700"
                >
                  <span className="mr-3 text-xl">{getWalletIcon(connector.name)}</span>
                  <div className="flex-1">
                    <div className="font-medium">{connector.name}</div>
                    <div className="text-xs text-gray-400">Click to connect</div>
                  </div>
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                </Button>
              ))}
            </div>
          )}

          {availableConnectors.length === 0 && !hasEthereum && (
            <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 text-center text-gray-400">
              <Wallet className="mx-auto mb-2 h-8 w-8" />
              <p>No wallets detected</p>
              <p className="mt-1 text-xs">Please install a Web3 wallet extension</p>
              <a
                href="https://metamask.io/download"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block rounded-lg bg-white px-4 py-2 text-sm text-black hover:bg-gray-200"
              >
                Install MetaMask
              </a>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Debug info (only in development) */}
          {process.env.NODE_ENV === "development" && (
            <details className="mt-4 rounded-lg border border-gray-700 bg-gray-800 p-3 text-xs text-gray-500">
              <summary className="cursor-pointer">Debug Info</summary>
              <div className="mt-2 space-y-1">
                <div>Connectors: {availableConnectors.length}</div>
                <div>Connector IDs: {availableConnectors.map(c => c.id).join(", ")}</div>
                <div>Connector Names: {availableConnectors.map(c => c.name).join(", ")}</div>
                <div>Ready Connectors: {availableConnectors.filter(c => c.ready).map(c => c.name).join(", ") || "None"}</div>
                <div>Detected: {detectedWallets.join(", ") || "None"}</div>
                <div>Has Ethereum: {typeof window !== "undefined" && Boolean((window as any).ethereum) ? "Yes" : "No"}</div>
                <div>Is MetaMask: {isMetaMask ? "Yes" : "No"}</div>
                <div>WalletConnect Project ID: {process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ? "Set" : "Not Set"}</div>
              </div>
            </details>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            New to Web3?{" "}
            <a
              href="https://metamask.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white underline hover:text-gray-300"
            >
              Learn about wallets
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

