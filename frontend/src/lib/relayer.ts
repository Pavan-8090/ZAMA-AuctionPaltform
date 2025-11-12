/**
 * Zama FHEVM Relayer SDK Integration
 * Based on official documentation: https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/initialization
 */

import type { FhevmInstance, FhevmInstanceConfig } from "@zama-fhe/relayer-sdk/web";

type RelayerModule = typeof import("@zama-fhe/relayer-sdk/web");

let relayerModulePromise: Promise<RelayerModule> | null = null;

async function loadRelayerModule(): Promise<RelayerModule> {
  if (!relayerModulePromise) {
    // Setup global for browser environment (required by SDK)
    const globalLike: any =
      typeof globalThis !== "undefined"
        ? globalThis
        : typeof window !== "undefined"
        ? window
        : {};
    if (typeof globalLike.global === "undefined") {
      globalLike.global = globalLike;
    }
    relayerModulePromise = import("@zama-fhe/relayer-sdk/web");
  }
  return relayerModulePromise;
}

let instancePromise: Promise<FhevmInstance> | null = null;

function requireEnv(name: string): string {
  // Only check on client side to avoid SSR errors
  if (typeof window === "undefined") {
    // During SSR, return empty string to avoid crashes
    // Actual validation happens on client side
    return "";
  }
  const value = process.env[name];
  if (!value || value.length === 0) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

function parseEnvNumber(name: string): number {
  // Only check on client side to avoid SSR errors
  if (typeof window === "undefined") {
    // During SSR, return a default value to avoid crashes
    return 11155111; // Default to Sepolia
  }
  const value = Number(requireEnv(name));
  if (!Number.isFinite(value)) {
    throw new Error(`Environment variable ${name} must be a number`);
  }
  return value;
}

/**
 * Get relayer configuration from environment variables
 * Matches the official Zama SDK configuration format
 * @see https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/initialization
 * 
 * Note: This function should only be called on the client side.
 * During SSR, it will return a placeholder config that will be replaced on the client.
 */
export function getRelayerConfig(): FhevmInstanceConfig {
  // Guard against SSR - return placeholder config
  if (typeof window === "undefined") {
    return {
      aclContractAddress: "" as `0x${string}`,
      kmsContractAddress: "" as `0x${string}`,
      inputVerifierContractAddress: "" as `0x${string}`,
      verifyingContractAddressDecryption: "" as `0x${string}`,
      verifyingContractAddressInputVerification: "" as `0x${string}`,
      chainId: 11155111,
      gatewayChainId: 55815,
      network: "",
      relayerUrl: "",
    };
  }

  return {
    // ACL_CONTRACT_ADDRESS (FHEVM Host chain)
    aclContractAddress: requireEnv("NEXT_PUBLIC_ZAMA_ACL_CONTRACT") as `0x${string}`,
    // KMS_VERIFIER_CONTRACT_ADDRESS (FHEVM Host chain)
    kmsContractAddress: requireEnv("NEXT_PUBLIC_ZAMA_KMS_CONTRACT") as `0x${string}`,
    // INPUT_VERIFIER_CONTRACT_ADDRESS (FHEVM Host chain)
    inputVerifierContractAddress: requireEnv("NEXT_PUBLIC_ZAMA_INPUT_VERIFIER_CONTRACT") as `0x${string}`,
    // DECRYPTION_ADDRESS (Gateway chain)
    verifyingContractAddressDecryption: requireEnv("NEXT_PUBLIC_ZAMA_DECRYPTION_VERIFIER_CONTRACT") as `0x${string}`,
    // INPUT_VERIFICATION_ADDRESS (Gateway chain)
    verifyingContractAddressInputVerification: requireEnv("NEXT_PUBLIC_ZAMA_INPUT_VERIFICATION_ADDRESS") as `0x${string}`,
    // FHEVM Host chain id
    chainId: parseEnvNumber("NEXT_PUBLIC_CHAIN_ID"),
    // Gateway chain id
    gatewayChainId: parseEnvNumber("NEXT_PUBLIC_ZAMA_GATEWAY_CHAIN_ID"),
    // Optional RPC provider to host chain
    network: requireEnv("NEXT_PUBLIC_RPC_URL"),
    // Relayer URL
    relayerUrl: requireEnv("NEXT_PUBLIC_ZAMA_RELAYER_URL"),
  };
}

/**
 * Get or create FHEVM Relayer instance
 * Uses SepoliaConfig if available, otherwise uses custom config from env vars
 * @see https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/initialization
 * 
 * Note: This function should only be called on the client side.
 */
export async function getRelayerInstance(): Promise<FhevmInstance> {
  // Guard against SSR - throw error if called on server
  if (typeof window === "undefined") {
    throw new Error("getRelayerInstance() can only be called on the client side");
  }

  if (!instancePromise) {
    const relayerModule = await loadRelayerModule();
    const { createInstance, SepoliaConfig } = relayerModule;

    // Try to use SepoliaConfig first (simpler, recommended by docs)
    // If SepoliaConfig is available and we're on Sepolia, use it
    const chainId = parseEnvNumber("NEXT_PUBLIC_CHAIN_ID");
    
    if (SepoliaConfig && chainId === 11155111) {
      console.log("Using SepoliaConfig for Zama SDK initialization");
      instancePromise = createInstance(SepoliaConfig);
    } else {
      // Use custom configuration from environment variables
      console.log("Using custom configuration for Zama SDK initialization");
      const config = getRelayerConfig();
      instancePromise = createInstance(config);
    }
  }
  return instancePromise;
}

export function bytesToHex(data: Uint8Array, withPrefix = true): `0x${string}` | string {
  const hex = Array.from(data, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return withPrefix ? (`0x${hex}` as `0x${string}`) : hex;
}

export function hexToBytes(hex: string): Uint8Array {
  const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (normalized.length % 2 !== 0) {
    throw new Error("Invalid hex string");
  }
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    bytes[i / 2] = parseInt(normalized.slice(i, i + 2), 16);
  }
  return bytes;
}


