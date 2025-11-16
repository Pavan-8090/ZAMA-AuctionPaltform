import axios from "axios";

const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY || "";
const PINATA_SECRET = process.env.NEXT_PUBLIC_PINATA_SECRET || "";
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs/";

export async function uploadToIPFS(file: File): Promise<string> {
  if (!PINATA_API_KEY || !PINATA_SECRET) {
    throw new Error("Pinata API keys not configured");
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET,
        },
      }
    );

    const hash = response.data.IpfsHash;
    return `ipfs://${hash}`;
  } catch (error) {
    console.error("IPFS upload error:", error);
    throw new Error("Failed to upload to IPFS");
  }
}

export function getIPFSURL(ipfsHash: string): string {
  if (ipfsHash.startsWith("ipfs://")) {
    const hash = ipfsHash.replace("ipfs://", "");
    return `${PINATA_GATEWAY}${hash}`;
  }
  return ipfsHash;
}

