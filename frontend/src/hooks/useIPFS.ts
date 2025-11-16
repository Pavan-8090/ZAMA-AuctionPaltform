"use client";

import { useState } from "react";
import { uploadToIPFS, getIPFSURL } from "@/lib/ipfs";

export function useIPFS() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const uploadFile = async (file: File): Promise<string> => {
    setIsUploading(true);
    setError(null);
    try {
      const ipfsHash = await uploadToIPFS(file);
      return ipfsHash;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Upload failed");
      setError(error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const getURL = (ipfsHash: string): string => {
    return getIPFSURL(ipfsHash);
  };

  return {
    uploadFile,
    getURL,
    isUploading,
    error,
  };
}

