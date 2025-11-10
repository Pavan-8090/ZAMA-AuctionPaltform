export interface FHEKeyPair {
  publicKey: string;
  privateKey: string;
}

export interface EncryptedValue {
  data: string;
  publicKey: string;
}

