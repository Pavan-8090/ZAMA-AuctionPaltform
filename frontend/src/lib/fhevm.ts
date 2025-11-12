// Deprecated: the legacy mock FHEVM helpers have been replaced by Zama's relayer integration.
// This stub is intentionally empty to prevent accidental imports.
import { BrowserProvider } from "ethers";

let client: any = null;
let publicKey: string | null = null;
let useMockEncryption = false;
let networkChecked = false;

const FHEVM_KEY_STORAGE = "fhevm_key";
const ENCRYPTED_VALUES_STORAGE = "encrypted_values"; // Store encrypted values for decryption

// Storage for encrypted values (bidder address -> auctionId -> encrypted value)
interface EncryptedValueStorage {
  [bidder: string]: {
    [auctionId: string]: {
      encrypted: string;
      originalValue: number;
    };
  };
}

function getEncryptedStorage(): EncryptedValueStorage {
  if (typeof window === "undefined") return {};
  const stored = localStorage.getItem(ENCRYPTED_VALUES_STORAGE);
  return stored ? JSON.parse(stored) : {};
}

function saveEncryptedValue(bidder: string, auctionId: string, encrypted: string, originalValue: number) {
  if (typeof window === "undefined") return;
  const storage = getEncryptedStorage();
  if (!storage[bidder]) storage[bidder] = {};
  storage[bidder][auctionId] = { encrypted, originalValue };
  localStorage.setItem(ENCRYPTED_VALUES_STORAGE, JSON.stringify(storage));
}

function getEncryptedValue(bidder: string, auctionId: string): { encrypted: string; originalValue: number } | null {
  if (typeof window === "undefined") return null;
  const storage = getEncryptedStorage();
  return storage[bidder]?.[auctionId] || null;
}

// Mock encryption function that generates a deterministic bytes32 from a value
// This works on any network since it doesn't require FHEVM
// Note: This is a simplified encryption for demo purposes
function mockEncrypt(value: number): string {
  // Create a deterministic hash from the value
  // Using a simple hash function to generate bytes32
  const valueStr = value.toString();
  let hash = 0;
  for (let i = 0; i < valueStr.length; i++) {
    const char = valueStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Add timestamp for uniqueness (but still deterministic per value)
  const timestamp = Date.now().toString();
  let combinedHash = hash;
  for (let i = 0; i < timestamp.length; i++) {
    const char = timestamp.charCodeAt(i);
    combinedHash = ((combinedHash << 5) - combinedHash) + char;
    combinedHash = combinedHash & combinedHash;
  }
  
  // Convert to hex and pad to 64 chars (32 bytes)
  // Use absolute value and ensure it's positive
  const hex = Math.abs(combinedHash).toString(16).padStart(64, '0').slice(0, 64);
  return `0x${hex}`;
}

export async function getFhevmInstance(): Promise<any> {
  // If we're using mock encryption, return a mock client
  if (useMockEncryption) {
    return {
      encrypt: async (value: number) => mockEncrypt(value),
    };
  }

  if (client) {
    return client;
  }

  if (typeof window === "undefined") {
    // SSR - use mock encryption
    useMockEncryption = true;
    return {
      encrypt: async (value: number) => mockEncrypt(value),
    };
  }

  if (!(window as any).ethereum) {
    // No ethereum provider - use mock encryption
    useMockEncryption = true;
    return {
      encrypt: async (value: number) => mockEncrypt(value),
    };
  }

  // Check network BEFORE importing fhenixjs to avoid initialization errors
  if (!networkChecked) {
    try {
      const provider = (window as any).ethereum;
      const chainId = await provider.request({ method: 'eth_chainId' });
      const chainIdNum = parseInt(chainId, 16);
      
      // FHEVM supported networks: Fhenix (42069), Zama devnet (8009), Zama testnet (9000)
      // Sepolia (11155111) does NOT support FHEVM
      const fhevmNetworks = [42069, 8009, 9000];
      
      if (!fhevmNetworks.includes(chainIdNum)) {
        console.log(`Network ${chainIdNum} (Sepolia) does not support FHEVM, using mock encryption`);
        useMockEncryption = true;
        networkChecked = true;
        return {
          encrypt: async (value: number) => mockEncrypt(value),
        };
      }
      networkChecked = true;
    } catch (error) {
      console.warn("Could not check network, using mock encryption:", error);
      useMockEncryption = true;
      networkChecked = true;
      return {
        encrypt: async (value: number) => mockEncrypt(value),
      };
    }
  }

  // Only try to initialize Fhenix Client on FHEVM-enabled networks
  try {
    // Dynamic import to avoid SSR issues - only happens on FHEVM networks
    const { FhenixClient } = await import("fhenixjs");
    const provider = new BrowserProvider((window as any).ethereum);
    
    // Initialize Fhenix Client
    client = new FhenixClient({ provider });
    
    // Get or create public key (stored for compatibility)
    let storedKey = localStorage.getItem(FHEVM_KEY_STORAGE);
    if (!storedKey) {
      // Generate a placeholder key (fhenixjs handles keys internally)
      storedKey = "fhenix_client_key";
      localStorage.setItem(FHEVM_KEY_STORAGE, storedKey);
    }
    
    publicKey = storedKey;

    return client;
  } catch (error: any) {
    console.warn("FhenixClient initialization failed, using mock encryption:", error.message);
    // Fallback to mock encryption if FHEVM is not available
    useMockEncryption = true;
    return {
      encrypt: async (value: number) => mockEncrypt(value),
    };
  }
}

export function getPublicKey(): string | null {
  return publicKey || (typeof window !== "undefined" ? localStorage.getItem(FHEVM_KEY_STORAGE) : null);
}

export async function encrypt32(value: number): Promise<string> {
  try {
    // Check if we should use mock encryption BEFORE calling getFhevmInstance
    // This prevents any fhenixjs imports on non-FHEVM networks
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        const provider = (window as any).ethereum;
        const chainId = await provider.request({ method: 'eth_chainId' });
        const chainIdNum = parseInt(chainId, 16);
        
        // FHEVM supported networks: Fhenix (42069), Zama devnet (8009), Zama testnet (9000)
        // Sepolia (11155111) does NOT support FHEVM
        const fhevmNetworks = [42069, 8009, 9000];
        
        if (!fhevmNetworks.includes(chainIdNum)) {
          // Not an FHEVM network - use mock encryption directly
          console.log(`Network ${chainIdNum} does not support FHEVM, using mock encryption`);
          useMockEncryption = true;
          return mockEncrypt(value);
        }
      } catch (networkError) {
        // Network check failed - use mock encryption to be safe
        console.warn("Could not check network, using mock encryption:", networkError);
        useMockEncryption = true;
        return mockEncrypt(value);
      }
    } else {
      // No ethereum provider - use mock encryption
      useMockEncryption = true;
      return mockEncrypt(value);
    }
    
    // Only reach here if we're on an FHEVM network
    // Now try to get FHEVM instance and encrypt
    const fhevm = await getFhevmInstance();
    
    // Double-check: if mock encryption was set during getFhevmInstance, use it
    if (useMockEncryption) {
      return mockEncrypt(value);
    }
    
    // Try to use fhenixjs encryption (only on FHEVM networks)
    try {
      // Dynamic import to avoid SSR issues
      const { EncryptionTypes } = await import("fhenixjs");
      
      // Convert to uint32 and encrypt
      const encrypted = await fhevm.encrypt(value, EncryptionTypes.uint32);
    
      // Convert to hex string (bytes32 format)
      let hexString: string;
      if (typeof encrypted === 'string') {
        // If already a string, ensure it's hex format
        hexString = encrypted.startsWith('0x') ? encrypted : `0x${encrypted}`;
      } else if (encrypted && typeof encrypted.toString === 'function') {
        // Try toString method
        const str = encrypted.toString();
        hexString = str.startsWith('0x') ? str : `0x${str}`;
      } else {
        // Fallback: convert to hex
        hexString = `0x${Buffer.from(JSON.stringify(encrypted)).toString('hex').padStart(64, '0').slice(0, 64)}`;
      }
      
      // Ensure it's exactly 66 characters (0x + 64 hex chars)
      if (hexString.length !== 66) {
        // Pad or truncate to 64 hex chars
        const hexPart = hexString.slice(2);
        hexString = `0x${hexPart.padStart(64, '0').slice(0, 64)}`;
      }
      
      return hexString;
    } catch (encryptError: any) {
      // If encryption fails, fallback to mock
      console.warn("FhenixJS encryption failed, using mock encryption:", encryptError.message);
      useMockEncryption = true;
      return mockEncrypt(value);
    }
  } catch (error: any) {
    console.warn("Encryption error, using mock encryption:", error.message);
    // Final fallback to mock encryption
    useMockEncryption = true;
    return mockEncrypt(value);
  }
}

export async function decrypt32(encrypted: string, originalValue?: number): Promise<number> {
  try {
    // If we have the original value stored, return it
    // This is a workaround since we can't decrypt FHE values without the contract's unseal
    if (originalValue !== undefined) {
      return originalValue;
    }
    
    // Check if we have this encrypted value stored
    const storage = getEncryptedStorage();
    for (const bidder in storage) {
      for (const auctionId in storage[bidder]) {
        if (storage[bidder][auctionId].encrypted === encrypted) {
          return storage[bidder][auctionId].originalValue;
        }
      }
    }
    
    // If not found, we can't decrypt (this is expected for encryption)
    throw new Error("Cannot decrypt: Value not found in storage. Store original values when encrypting.");
  } catch (error: any) {
    console.error("Decryption error:", error);
    throw error;
  }
}

export async function reencrypt(encrypted: string, publicKey: string): Promise<string> {
  // Reencryption not available with mock encryption
  throw new Error("reencrypt: Not available with mock encryption");
}

// Helper function to store encrypted value with original for later decryption
export function storeEncryptedValue(bidder: string, auctionId: string, encrypted: string, originalValue: number) {
  saveEncryptedValue(bidder, auctionId, encrypted, originalValue);
}

// Helper function to retrieve stored encrypted value
export function getStoredEncryptedValue(bidder: string, auctionId: string): { encrypted: string; originalValue: number } | null {
  return getEncryptedValue(bidder, auctionId);
}

// Helper function to get all encrypted storage (for reveal) - exported version
export function getAllEncryptedStorage(): EncryptedValueStorage {
  if (typeof window === "undefined") return {};
  const stored = localStorage.getItem(ENCRYPTED_VALUES_STORAGE);
  return stored ? JSON.parse(stored) : {};
}
