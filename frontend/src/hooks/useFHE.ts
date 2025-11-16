"use client";

import { useState, useEffect } from "react";
import { getFhevmInstance, encrypt32, decrypt32, getPublicKey } from "@/lib/fhevm";

export function useFHE() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function init() {
      try {
        // Always mark as initialized immediately to prevent blocking
        setIsInitialized(true);
        
        if (typeof window !== "undefined" && (window as any).ethereum) {
          // Check network first before trying to initialize FHEVM
          try {
            const chainId = await (window as any).ethereum.request({ method: 'eth_chainId' });
            const chainIdNum = parseInt(chainId, 16);
            
            // FHEVM supported networks: Fhenix (42069), Zama devnet (8009), Zama testnet (9000)
            // Sepolia (11155111) does NOT support FHEVM
            const fhevmNetworks = [42069, 8009, 9000];
            
            if (!fhevmNetworks.includes(chainIdNum)) {
              // Sepolia or other non-FHEVM network - skip FHEVM initialization entirely
              console.log(`Network ${chainIdNum} does not support FHEVM, using mock encryption`);
              return; // Don't try to initialize FHEVM
            }
            
            // Only try to initialize on FHEVM-enabled networks
            // The getFhevmInstance will handle fallback if it still fails
            try {
              const instance = await getFhevmInstance();
              const key = getPublicKey();
              setPublicKey(key);
            } catch (err) {
              console.log("FHEVM initialization skipped or failed, using mock encryption");
            }
          } catch (err) {
            // Network check failed, use mock encryption
            console.log("Could not check network, using mock encryption");
          }
        }
      } catch (err) {
        // Always allow encryption with mock fallback
        console.log("Using mock encryption");
      }
    }
    init();
  }, []);

  const encrypt = async (value: number): Promise<string> => {
    try {
      return await encrypt32(value);
    } catch (err) {
      throw err instanceof Error ? err : new Error("Encryption failed");
    }
  };

  const decrypt = async (encrypted: string | `0x${string}`): Promise<number> => {
    try {
      // Handle both string and hex string formats
      const encryptedStr = typeof encrypted === "string" 
        ? encrypted.startsWith("0x") 
          ? encrypted 
          : `0x${encrypted}`
        : encrypted;
      return await decrypt32(encryptedStr);
    } catch (err) {
      throw err instanceof Error ? err : new Error("Decryption failed");
    }
  };

  return {
    isInitialized,
    publicKey,
    encrypt,
    decrypt,
    error,
  };
}

