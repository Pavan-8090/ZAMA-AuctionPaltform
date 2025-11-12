/**
 * FHEVM Helper Functions
 * Utilities for working with FHE encrypted values
 */

/**
 * Convert ETH amount to encrypted format (multiply by 100 for cents precision)
 * This allows us to encrypt values with 2 decimal places (e.g., 1.5 ETH = 150)
 * @param value - ETH amount (e.g., 1.5)
 * @returns Integer value for encryption (e.g., 150)
 */
export function toEncryptedValue(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid value for encryption: ${value}`);
  }
  // Multiply by 100 to preserve 2 decimal places
  // e.g., 1.5 ETH -> 150 (encrypted as integer)
  return Math.floor(value * 100);
}

/**
 * Convert from encrypted format back to original ETH value
 * @param encrypted - Encrypted integer value (e.g., 150)
 * @returns Original ETH amount (e.g., 1.5)
 */
export function fromEncryptedValue(encrypted: number | bigint): number {
  const num = typeof encrypted === "bigint" ? Number(encrypted) : encrypted;
  if (!Number.isFinite(num)) {
    throw new Error(`Invalid encrypted value: ${encrypted}`);
  }
  return num / 100;
}

/**
 * Convert decrypted value to wei (for contract interaction)
 * @param decryptedValue - Decrypted integer value (e.g., 150 from encryption of 1.5 ETH)
 * @returns Amount in wei (e.g., 1500000000000000000 for 1.5 ETH)
 */
export function decryptedToWei(decryptedValue: number | bigint): bigint {
  const ethAmount = fromEncryptedValue(decryptedValue);
  return BigInt(Math.floor(ethAmount * 1e18));
}

/**
 * Validate encrypted value format
 */
export function isValidEncryptedValue(value: any): boolean {
  return typeof value === "string" && value.startsWith("0x") && value.length === 66;
}

/**
 * Format encrypted value for display (shows as encrypted)
 */
export function formatEncryptedValue(value: string): string {
  if (!value) return "🔒 Encrypted";
  return `🔒 ${value.slice(0, 10)}...${value.slice(-8)}`;
}

