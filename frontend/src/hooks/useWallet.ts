"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { targetChainId, targetChainName } from "@/lib/network";

export function useWallet() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const isCorrectNetwork = chain ? chain.id === targetChainId : false;

  const connectWallet = async (connectorId?: string) => {
    try {
      const connector = connectorId
        ? connectors.find((c) => c.id === connectorId)
        : connectors[0];
      
      if (!connector) {
        const availableIds = connectors.map(c => `${c.id} (${c.name})`).join(", ");
        console.error("No connector found", { 
          requested: connectorId, 
          available: availableIds,
          totalConnectors: connectors.length 
        });
        throw new Error(`Wallet connector not found. Available: ${availableIds || "None"}`);
      }

      if (!connector.ready) {
        throw new Error(`${connector.name} is not ready. Please ensure the wallet extension is installed and unlocked.`);
      }

      console.log("Connecting with connector:", connector.id, connector.name, "ready:", connector.ready);
      
      // Use connect mutation - it doesn't return a promise, it's a mutation
      return new Promise((resolve, reject) => {
        connect(
          { connector },
          {
            onSuccess: (data) => {
              console.log("Connection successful:", data);
              resolve(data);
            },
            onError: (error: any) => {
              console.error("Connection error:", error);
              // Provide more helpful error messages
              if (error?.code === 4001 || error?.message?.includes("User rejected") || error?.message?.includes("rejected")) {
                reject(new Error("Connection rejected. Please approve the connection in your wallet."));
              } else {
                reject(error);
              }
            },
          }
        );
      });
    } catch (error: any) {
      console.error("Connection error:", error);
      throw error;
    }
  };

  const disconnectWallet = () => {
    disconnect();
  };

  const switchToTargetChain = async () => {
    try {
      await switchChain({ chainId: targetChainId });
    } catch (error) {
      console.error("Failed to switch chain:", error);
    }
  };

  return {
    address,
    isConnected,
    chain,
    connectWallet,
    disconnectWallet,
    switchToTargetChain,
    connectors,
    isPending,
    connectError,
    targetChainId,
    targetChainName,
    isCorrectNetwork,
    needsNetworkSwitch: !isCorrectNetwork,
  };
}

