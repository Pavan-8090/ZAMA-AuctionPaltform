/**
 * Zama FHEVM Relayer SDK - React Hook
 * 
 * Provides encryption and decryption functionality using Zama's FHEVM Relayer SDK
 * Based on official documentation: https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer
 * 
 * @example
 * ```tsx
 * const { encrypt32, publicDecrypt, isInitialized } = useFHE();
 * 
 * // Encrypt a value
 * const { handle, inputProof } = await encrypt32(100, contractAddress, userAddress);
 * 
 * // Decrypt handles
 * const result = await publicDecrypt([handle]);
 * ```
 */

"use client";

import { useCallback, useState } from "react";
import { getRelayerConfig, getRelayerInstance, bytesToHex } from "@/lib/relayer";

type EncryptResult = {
  handle: `0x${string}`;
  handles: `0x${string}`[];
  inputProof: `0x${string}`;
};

type PublicDecryptResult = {
  clearValues: Record<`0x${string}`, bigint | boolean | `0x${string}`>;
  abiEncodedClearValues: `0x${string}`;
  decryptionProof: `0x${string}`;
};

export function useFHE() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  /**
   * Initialize the Zama FHEVM Relayer SDK
   * Lazy initialization - only runs when encryption/decryption is first called
   */
  const initialize = useCallback(async () => {
    if (isInitialized || isInitializing) return;
    
    // Guard against SSR
    if (typeof window === "undefined") {
      console.warn("FHE initialization skipped during SSR");
      return;
    }
    
    setIsInitializing(true);
    try {
      getRelayerConfig(); // validate env early (already guarded by window check above)
      await getRelayerInstance();
      setIsInitialized(true);
      setError(null);
      console.log("Zama FHEVM Relayer SDK initialized successfully");
    } catch (err) {
      const e = err instanceof Error ? err : new Error("Failed to initialise Zama relayer");
      console.error("Zama SDK initialization error:", e);
      setError(e);
      throw e; // Re-throw so callers can handle it
    } finally {
      setIsInitializing(false);
    }
  }, [isInitialized, isInitializing]);

  /**
   * Encrypt a 32-bit unsigned integer value
   * Uses createEncryptedInput pattern from Zama SDK docs
   * @see https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/input
   * 
   * @param value - The value to encrypt (uint32)
   * @param contractAddress - Address of the contract that will receive the encrypted value
   * @param userAddress - Address of the user encrypting the value
   * @returns Encrypted handle and input proof
   */
  const encrypt32 = useCallback(
    async (value: number, contractAddress: string, userAddress: string): Promise<EncryptResult> => {
      if (!userAddress) {
        throw new Error("Wallet address is required for encryption");
      }

      if (!contractAddress) {
        throw new Error("Contract address is required for encryption");
      }

      // Initialize if not already done
      if (!isInitialized && !isInitializing) {
        await initialize();
      }

      try {
        const instance = await getRelayerInstance();
        
        // Create encrypted input buffer (matches Zama SDK pattern)
        // https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/input
        const buffer = instance.createEncryptedInput(contractAddress, userAddress);
        buffer.add32(value);

        // Encrypt and get handles + proof
        const { handles, inputProof } = await buffer.encrypt();
        
        if (!handles || handles.length === 0) {
          throw new Error("Relayer returned empty handle list");
        }

        // Convert handles to hex format
        const handlesHex = handles.map((h) => bytesToHex(h, true) as `0x${string}`);
        
        return {
          handle: handlesHex[0],
          handles: handlesHex,
          inputProof: bytesToHex(inputProof, true) as `0x${string}`,
        };
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Encryption failed");
        console.error("Encryption error:", error);
        setError(error);
        throw error;
      }
    },
    [isInitialized, isInitializing, initialize]
  );

  /**
   * Encrypt a 64-bit unsigned integer value
   * For larger values that exceed uint32 range
   */
  const encrypt64 = useCallback(
    async (value: bigint | number, contractAddress: string, userAddress: string): Promise<EncryptResult> => {
      if (!userAddress) {
        throw new Error("Wallet address is required for encryption");
      }

      if (!isInitialized && !isInitializing) {
        await initialize();
      }

      try {
        const instance = await getRelayerInstance();
        const buffer = instance.createEncryptedInput(contractAddress, userAddress);
        buffer.add64(typeof value === "bigint" ? value : BigInt(value));

        const { handles, inputProof } = await buffer.encrypt();
        if (!handles || handles.length === 0) {
          throw new Error("Relayer returned empty handle list");
        }

        const handlesHex = handles.map((h) => bytesToHex(h, true) as `0x${string}`);
        return {
          handle: handlesHex[0],
          handles: handlesHex,
          inputProof: bytesToHex(inputProof, true) as `0x${string}`,
        };
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Encryption failed");
        setError(error);
        throw error;
      }
    },
    [isInitialized, isInitializing, initialize]
  );

  /**
   * Public decrypt ciphertext handles
   * @see https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/decryption
   * 
   * @param handles - Array of ciphertext handles to decrypt
   * @returns Decrypted clear values
   */
  const publicDecrypt = useCallback(async (handles: (`0x${string}` | string)[]): Promise<PublicDecryptResult> => {
    if (!handles.length) {
      throw new Error("No ciphertext handles supplied for decryption");
    }
    
    // Initialize if not already done
    if (!isInitialized && !isInitializing) {
      await initialize();
    }
    
    try {
      const instance = await getRelayerInstance();
      const result = await instance.publicDecrypt(handles);
      return result as PublicDecryptResult;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Decryption failed");
      console.error("Decryption error:", error);
      setError(error);
      throw error;
    }
  }, [isInitialized, isInitializing, initialize]);

  return {
    isInitialized,
    isInitializing,
    encrypt32,
    encrypt64,
    publicDecrypt,
    error,
    initialize, // Expose for manual initialization if needed
  };
}
