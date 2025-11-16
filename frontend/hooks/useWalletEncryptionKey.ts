/* Hook to derive deterministic TFHE seed via signer and store in IndexedDB (mocked with localStorage here).
 * Security: In production, use WebCrypto + IndexedDB with user passphrase.
 */
"use client";
import { useCallback, useEffect, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";

async function pbkdf2(input: Uint8Array, salt: Uint8Array, iterations = 100000): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", input, "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations, hash: "SHA-256" }, key, 256);
  return new Uint8Array(bits);
}

export default function useWalletEncryptionKey() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [keyBytes, setKeyBytes] = useState<Uint8Array | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!address) return;
    const cached = localStorage.getItem(`tfhe-key-${address}`);
    if (cached) {
      setKeyBytes(Uint8Array.from(JSON.parse(cached)));
    }
  }, [address]);

  useEffect(() => { void load(); }, [load]);

  const generate = useCallback(async () => {
    if (!address) throw new Error("Connect wallet");
    setLoading(true);
    try {
      const stamp = Date.now().toString();
      const message = `ZamaKeySeed:${stamp}`;
      const sig = await signMessageAsync({ message });
      const sigBytes = new TextEncoder().encode(sig);
      const seed = await pbkdf2(sigBytes, new TextEncoder().encode(address));
      localStorage.setItem(`tfhe-key-${address}`, JSON.stringify(Array.from(seed)));
      setKeyBytes(seed);
      return seed;
    } finally {
      setLoading(false);
    }
  }, [address, signMessageAsync]);

  return { keyBytes, generate, loading };
}

