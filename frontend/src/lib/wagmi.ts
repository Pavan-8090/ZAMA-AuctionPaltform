import { createConfig, http } from "@wagmi/core";
import { createPublicClient, type Chain } from "viem";
import { injected, metaMask, walletConnect, coinbaseWallet } from "@wagmi/connectors";

// Define chains - Sepolia (Zama FHEVM supported), localhost, Fhenix testnet, and Zama networks
import { sepolia } from "viem/chains";
import { targetChainId } from "@/lib/network";

const localhost = {
  id: 1337,
  name: "Localhost",
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

const zamaDevnet = {
  id: 8009,
  name: "Zama Devnet",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || "https://devnet.zama.ai"],
    },
  },
  blockExplorers: {
    default: {
      name: "Zama Explorer",
      url: process.env.NEXT_PUBLIC_BLOCK_EXPLORER || "https://main.explorer.zama.ai",
    },
  },
  testnet: true,
} as const satisfies Chain;

const zamaTestnet = {
  id: 9000,
  name: "Zama Testnet",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || "https://testnet.zama.ai"],
    },
  },
  blockExplorers: {
    default: {
      name: "Zama Explorer",
      url: process.env.NEXT_PUBLIC_BLOCK_EXPLORER || "https://testnet.explorer.zama.ai",
    },
  },
  testnet: true,
} as const satisfies Chain;

// Use Sepolia as default (Zama FHEVM is available on Sepolia)
// According to Zama docs, FHEVM is available on Sepolia testnet
// Sepolia is the primary network for this application

const chainsMap = {
  [sepolia.id]: sepolia,
  [localhost.id]: localhost,
  [fhenix.id]: fhenix,
  [zamaDevnet.id]: zamaDevnet,
  [zamaTestnet.id]: zamaTestnet,
} as const;

// Always default to Sepolia if targetChainId is not in chainsMap
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

  if (chain.id === zamaDevnet.id) {
    return process.env.NEXT_PUBLIC_RPC_URL || "https://devnet.zama.ai";
  }

  if (chain.id === zamaTestnet.id) {
    return process.env.NEXT_PUBLIC_RPC_URL || "https://testnet.zama.ai";
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

// Add all wallet connectors
// Note: Don't add both injected() and metaMask() - metaMask() is already included in injected()
// Only add metaMask() separately if you want to force MetaMask SDK usage
const connectors = [
  injected(), // Supports MetaMask, OKX, Rabby, and other injected wallets (includes MetaMask)
  coinbaseWallet({
    appName: "EncryptedBid",
    appLogoUrl: "https://encryptedbid.xyz/logo.png",
  }),
];

// Only include WalletConnect if a valid project ID is provided
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
if (
  walletConnectProjectId && 
  walletConnectProjectId !== "your_walletconnect_project_id_here" && 
  walletConnectProjectId.trim() !== "" &&
  walletConnectProjectId.length > 10 // Basic validation - real project IDs are longer
) {
  try {
    connectors.push(walletConnect({ projectId: walletConnectProjectId }) as typeof connectors[number]);
    console.log("WalletConnect connector added successfully");
  } catch (error) {
    console.error("Failed to initialize WalletConnect:", error);
    // Continue without WalletConnect - not critical for basic functionality
  }
} else {
  console.warn("WalletConnect Project ID not configured. WalletConnect will not be available.");
  console.warn("Get your Project ID from: https://cloud.walletconnect.com");
}

export const config = createConfig({
  chains: [sepolia, localhost, fhenix, zamaDevnet, zamaTestnet],
  connectors,
  transports: {
    [sepolia.id]: buildTransport(sepolia),
    [localhost.id]: buildTransport(localhost as Chain),
    [fhenix.id]: buildTransport(fhenix),
    [zamaDevnet.id]: buildTransport(zamaDevnet),
    [zamaTestnet.id]: buildTransport(zamaTestnet),
  },
});

export const publicClient = createPublicClient({
  chain: activeChain,
  transport: buildTransport(activeChain),
});

