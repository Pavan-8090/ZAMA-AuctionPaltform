/* Deterministic mock TFHE client when NEXT_PUBLIC_FHE_MODE=MOCK
 * Docs: https://docs.zama.ai
 */
export async function initZamaWasm(): Promise<void> {
  // no-op in mock
}

export async function generateKeypair(): Promise<{ publicKey: Uint8Array; secretKey: Uint8Array }> {
  const pk = new Uint8Array(32).fill(1);
  const sk = new Uint8Array(32).fill(2);
  return { publicKey: pk, secretKey: sk };
}

export async function encryptUint256(value: number | string): Promise<Uint8Array> {
  const v = BigInt(value as any);
  const buf = new Uint8Array(32);
  const dv = new DataView(buf.buffer);
  dv.setBigUint64(24, v & ((1n << 64n) - 1n)); // store low 64 bits
  return buf;
}

export function serializeCiphertext(blob: Uint8Array): string {
  return "0x" + Buffer.from(blob).toString("hex");
}

export function deserializeCiphertext(hex: string): Uint8Array {
  return new Uint8Array(Buffer.from(hex.replace(/^0x/, ""), "hex"));
}

export function mockDecrypt(ciphertext: Uint8Array): number {
  const dv = new DataView(ciphertext.buffer);
  return Number(dv.getBigUint64(24));
}

