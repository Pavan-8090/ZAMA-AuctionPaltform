const FALLBACK_CHAIN_ID = 11155111;

type ChainMetadata = {
  name: string;
  explorerBaseUrl?: string;
};

const KNOWN_CHAIN_METADATA: Record<number, ChainMetadata> = {
  11155111: { name: "Sepolia", explorerBaseUrl: "https://sepolia.etherscan.io" },
  42069: {
    name: "Fhenix Nitrogen",
    explorerBaseUrl: process.env.NEXT_PUBLIC_BLOCK_EXPLORER || "https://explorer.testnet.fhenix.xyz",
  },
  8009: { name: "Zama Devnet" },
  9000: { name: "Zama Testnet" },
  1337: { name: "Localhost" },
};

const envChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID);
const targetChainId =
  Number.isInteger(envChainId) && envChainId > 0 ? envChainId : FALLBACK_CHAIN_ID;

const targetChainName = KNOWN_CHAIN_METADATA[targetChainId]?.name ?? `Chain ${targetChainId}`;

// FHEVM supported chains: Sepolia (Zama FHEVM), Fhenix, Zama networks
// Note: Sepolia (11155111) has Zama FHEVM support
const FHEVM_CHAIN_IDS = [11155111, 42069, 8009, 9000];

const explorerBaseEnv = process.env.NEXT_PUBLIC_BLOCK_EXPLORER?.replace(/\/$/, "");
const targetChainExplorerBaseUrl =
  explorerBaseEnv || KNOWN_CHAIN_METADATA[targetChainId]?.explorerBaseUrl;

export function getExplorerTxUrl(hash: string | null | undefined): string | null {
  if (!hash || !targetChainExplorerBaseUrl) return null;
  const base = targetChainExplorerBaseUrl.replace(/\/$/, "");
  // If base already includes /tx path, avoid duplicating
  if (base.endsWith("/tx")) {
    return `${base}/${hash}`;
  }
  return `${base}/tx/${hash}`;
}

export {
  targetChainId,
  targetChainName,
  KNOWN_CHAIN_METADATA,
  FHEVM_CHAIN_IDS,
  targetChainExplorerBaseUrl,
};

