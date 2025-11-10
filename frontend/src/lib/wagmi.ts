import { createConfig, http } from "@wagmi/core";
import { createPublicClient, type Chain } from "viem";
import { injected, metaMask, walletConnect } from "@wagmi/connectors";

// Define chains - Sepolia (Zama FHEVM supported), localhost, and Fhenix testnet
import { sepolia } from "viem/chains";
import { targetChainId } from "@/lib/network";

const localhost = {
  id: 1337,
  name: "Localhost",
  network: "localhost",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"],
    },
  },
  blockExplorers: {
    default: {
      name: "Local Explorer",
      url: "http://127.0.0.1:8545",
    },
  },
  testnet: true,
} as const satisfies Chain;

const fhenix = {
  id: 42069,
  name: "Fhenix Testnet",
  network: "fhenix",
  nativeCurrency: { name: "tFHE", symbol: "tFHE", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || "https://api.testnet.fhenix.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Fhenix Explorer",
      url: process.env.NEXT_PUBLIC_BLOCK_EXPLORER || "https://explorer.testnet.fhenix.xyz",
    },
  },
  testnet: true,
} as const satisfies Chain;

// Use Sepolia as default (Zama FHEVM is available on Sepolia)
// According to Zama docs, FHEVM is available on Sepolia testnet

const chainsMap = {
  [sepolia.id]: sepolia,
  [localhost.id]: localhost,
  [fhenix.id]: fhenix,
} as const;

const activeChain =
  chainsMap[targetChainId as keyof typeof chainsMap] ?? sepolia;

const getRpcUrl = (chain: Chain) => {
  if (chain.id === sepolia.id) {
    return (
      process.env.NEXT_PUBLIC_RPC_URL ||
      "https://ethereum-sepolia-rpc.publicnode.com"
    );
  }

  if (chain.id === fhenix.id) {
    return (
      process.env.NEXT_PUBLIC_FHEVM_RPC_URL ||
      process.env.NEXT_PUBLIC_RPC_URL ||
      "https://api.testnet.fhenix.xyz"
    );
  }

  if (chain.id === localhost.id) {
    return localhost.rpcUrls.default.http[0];
  }

  return process.env.NEXT_PUBLIC_RPC_URL;
};

const buildTransport = (chain: Chain) => {
  const url = getRpcUrl(chain);
  return url ? http(url) : http();
};

export const config = createConfig({
  chains: [sepolia, localhost, fhenix],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({ projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "" }),
  ],
  transports: {
    [sepolia.id]: buildTransport(sepolia),
    [localhost.id]: buildTransport(localhost as Chain),
    [fhenix.id]: buildTransport(fhenix),
  },
});

export const publicClient = createPublicClient({
  chain: activeChain,
  transport: buildTransport(activeChain),
});

