/* TFHE client wrapper with MOCK and ZAMA modes.
 * - initZamaWasm()
 * - generateKeypair()
 * - encryptUint256()
 * - serializeCiphertext()
 * - deserializeCiphertext()
 * - mockDecrypt() DEVELOPMENT ONLY
 *
 * Production integration:
 * - Replace implementations with Zama TFHE JS/WASM client.
 *   Docs: https://docs.zama.ai/concrete/fhevm
 *   Coprocessor: set NEXT_PUBLIC_ZAMA_RELAYER_URL and related contracts in .env
 */
const MODE = (process.env.NEXT_PUBLIC_FHE_MODE || "ZAMA").toUpperCase();

export async function initZamaWasm(): Promise<void> {
  // Expect a global TFHE client to be available (loaded via external script per Zama docs).
  // Reference: https://docs.zama.ai/concrete/fhevm
  if (!(window as any).TFHE && MODE === "ZAMA") {
    throw new Error("TFHE WASM not found. Load Zama TFHE client script before using.");
  }
}

export async function generateKeypair(): Promise<{ publicKey: Uint8Array; secretKey: Uint8Array }> {
  if (MODE !== "ZAMA") throw new Error("Only ZAMA mode is supported");
  const TFHE = (window as any).TFHE;
  const kp = await TFHE.generateKeypair();
  return { publicKey: kp.publicKey, secretKey: kp.secretKey };
}

export async function encryptUint256(value: number | string): Promise<Uint8Array> {
  if (MODE !== "ZAMA") throw new Error("Only ZAMA mode is supported");
  const TFHE = (window as any).TFHE;
  const v = BigInt(value as any);
  return await TFHE.encryptUint256(v);
}

export function serializeCiphertext(blob: Uint8Array): string {
  return "0x" + Buffer.from(blob).toString("hex");
}

export function deserializeCiphertext(hex: string): Uint8Array {
  return new Uint8Array(Buffer.from(hex.replace(/^0x/, ""), "hex"));
}

export function mockDecrypt(ciphertext: Uint8Array): number {
  throw new Error("mockDecrypt is not available in non-mock builds");
}

