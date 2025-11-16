"use client";
import { useEffect, useMemo, useState } from "react";
import useWalletEncryptionKey from "../hooks/useWalletEncryptionKey";
import EncryptProgress from "./EncryptProgress";
import ResultDisplay from "./ResultDisplay";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { initZamaWasm, encryptUint256, serializeCiphertext } from "../lib/tfheClient";
import { parseEther } from "viem";

// Minimal ABI for WhaleSafeRouter
const ROUTER_ABI = [
  {
    type: "function",
    name: "submitEncryptedOrder",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenIn", type: "address" },
      { name: "tokenOut", type: "address" },
      { name: "ciphertext", type: "bytes" },
      { name: "metadata", type: "bytes" }
    ],
    outputs: [{ name: "orderId", type: "uint256" }]
  },
  {
    type: "event",
    name: "SwapExecuted",
    inputs: [
      { name: "orderId", type: "uint256", indexed: true },
      { name: "tokenIn", type: "address", indexed: true },
      { name: "tokenOut", type: "address", indexed: true },
      { name: "publicAmountOut", type: "uint256", indexed: false },
      { name: "publicPrice", type: "uint256", indexed: false }
    ],
    anonymous: false
  }
] as const;

export default function SwapForm() {
  const { address } = useAccount();
  const router = process.env.NEXT_PUBLIC_ROUTER_ADDRESS as `0x${string}` | undefined;
  const [tokenIn, setTokenIn] = useState<string>("0x0000000000000000000000000000000000000000");
  const [tokenOut, setTokenOut] = useState<string>("0x0000000000000000000000000000000000000000");
  const [amount, setAmount] = useState<string>("0.0");
  const [slippage, setSlippage] = useState<string>("0.5");
  const [encrypting, setEncrypting] = useState<string>("");
  const [result, setResult] = useState<{ amountOut: string; price: string } | null>(null);
  const { keyBytes, generate, loading } = useWalletEncryptionKey();

  const { writeContractAsync, data: txHash } = useWriteContract();
  const { isLoading: pending } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => { void initZamaWasm(); }, []);

  const ready = useMemo(() => Boolean(address && router), [address, router]);

  async function onGenerate() {
    await generate();
  }

  async function onSubmit() {
    if (!router) throw new Error("Router address missing");
    const amt = parseEther(amount || "0");
    const sl = Math.round(parseFloat(slippage || "0") * 100); // bps-ish

    setEncrypting("Encrypting amount...");
    const encAmount = await encryptUint256(amt.toString());
    setEncrypting("Encrypting slippage...");
    const encSlippage = await encryptUint256(sl.toString());
    // Serialize both and concatenate
    const blob = serializeCiphertext(encAmount) + serializeCiphertext(encSlippage).slice(2);
    const blobBytes = blob as `0x${string}`;
    const metaBytes = "0x"; // could include client version

    setEncrypting("Submitting order...");
    await writeContractAsync({
      abi: ROUTER_ABI,
      address: router,
      functionName: "submitEncryptedOrder",
      args: [tokenIn as `0x${string}`, tokenOut as `0x${string}`, blobBytes, metaBytes]
    });
    setEncrypting("");
  }

  return (
    <div className="card">
      <div className="row">
        <div className="col">
          <label>Token In</label>
          <input value={tokenIn} onChange={(e) => setTokenIn(e.target.value)} style={{ width: "100%" }} />
        </div>
        <div className="col">
          <label>Token Out</label>
          <input value={tokenOut} onChange={(e) => setTokenOut(e.target.value)} style={{ width: "100%" }} />
        </div>
      </div>
      <div className="row" style={{ marginTop: 8 }}>
        <div className="col">
          <label>Amount</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: "100%" }} />
        </div>
        <div className="col">
          <label>Slippage %</label>
          <input value={slippage} onChange={(e) => setSlippage(e.target.value)} style={{ width: "100%" }} />
        </div>
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn" onClick={onGenerate} disabled={!address || loading}>
          {keyBytes ? "Re-generate Key" : "Generate TFHE Key"}
        </button>
        <button className="btn" onClick={onSubmit} disabled={!ready || !keyBytes || pending}>
          Submit Encrypted Order
        </button>
      </div>
      {encrypting && <EncryptProgress text={encrypting} />}
      {result && <ResultDisplay amountOut={result.amountOut} price={result.price} />}
      <div className="muted" style={{ marginTop: 12 }}>
        Privacy: amount and slippage are encrypted in-browser. Only the public outcome is revealed.
      </div>
    </div>
  );
}

