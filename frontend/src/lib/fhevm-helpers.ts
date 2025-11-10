/**
 * FHEVM Helper Functions
 * Utilities for working with FHE encrypted values
 */

/**
 * Convert a number to encrypted format (multiply by 100 for cents precision)
 */
export function toEncryptedValue(value: number): number {
  return Math.floor(value * 100);
}

/**
 * Convert from encrypted format back to original value
 */
export function fromEncryptedValue(encrypted: number): number {
  return encrypted / 100;
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

