"use client";

import { useEffect, useState } from "react";
import { useWaitForTransactionReceipt } from "wagmi";
import { toast } from "react-hot-toast";

export function useTransactionStatus(hash: `0x${string}` | undefined, successMessage?: string) {
  const [toastId, setToastId] = useState<string | null>(null);
  
  const { isLoading, isSuccess, isError, error } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (hash && !toastId) {
      const id = toast.loading("Transaction pending...");
      setToastId(id);
    }
  }, [hash, toastId]);

  useEffect(() => {
    if (isSuccess && toastId) {
      toast.success(successMessage || "Transaction confirmed!", { id: toastId });
      setToastId(null);
    }
  }, [isSuccess, toastId, successMessage]);

  useEffect(() => {
    if (isError && toastId) {
      toast.error(error?.message || "Transaction failed", { id: toastId });
      setToastId(null);
    }
  }, [isError, error, toastId]);

  return {
    isLoading,
    isSuccess,
    isError,
    error,
  };
}

