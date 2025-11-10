"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { targetChainId, targetChainName } from "@/lib/network";

export function useWallet() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const isCorrectNetwork = chain ? chain.id === targetChainId : false;

  const connectWallet = async (connectorId?: string) => {
    const connector = connectorId
      ? connectors.find((c) => c.id === connectorId)
      : connectors[0];
    
    if (connector) {
      connect({ connector });
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
    targetChainId,
    targetChainName,
    isCorrectNetwork,
    needsNetworkSwitch: !isCorrectNetwork,
  };
}

