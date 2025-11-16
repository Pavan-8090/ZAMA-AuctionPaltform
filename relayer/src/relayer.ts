/**
 * Relayer service:
 * - Subscribes to EncryptedOrderSubmitted
 * - Queues ciphertext-only orders
 * - Batch worker evaluates (mock) and executes via executeEncryptedSwap
 * Security: Never logs plaintext; only ciphertext hex and orderId.
 */
import "dotenv/config";
import { ethers } from "ethers";
import pino from "pino";
import express from "express";
import { RateLimiterMemory } from "rate-limiter-flexible";
import RouterAbi from "./abi/WhaleSafeRouter.json" assert { type: "json" };

const logger = pino({ level: "info" });

const RPC_URL = process.env.RELAYER_RPC_URL || "http://127.0.0.1:8545";
const RELAYER_KEY = process.env.RELAYER_KEY!;
const ROUTER_ADDRESS = process.env.NEXT_PUBLIC_ROUTER_ADDRESS as `0x${string}`;
const PORT = Number(process.env.RELAYER_HEALTH_PORT || 8080);
const ZAMA_URL = process.env.ZAMA_COPROCESSOR_URL || "";
const ZAMA_API_KEY = process.env.ZAMA_API_KEY || "";

type Order = { orderId: bigint; submitter: string; tokenIn: string; tokenOut: string; ciphertext?: string };
const queue: Order[] = [];

async function main() {
  if (!RELAYER_KEY || !ROUTER_ADDRESS) {
    logger.error("Missing RELAYER_KEY or NEXT_PUBLIC_ROUTER_ADDRESS");
    process.exit(1);
  }
  if (!ZAMA_URL || !ZAMA_API_KEY) {
    logger.warn("Zama coprocessor not configured; execution will fail until configured");
  }
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(RELAYER_KEY, provider);
  const router = new ethers.Contract(ROUTER_ADDRESS, RouterAbi, wallet);

  const app = express();
  const limiter = new RateLimiterMemory({ points: 10, duration: 1 });
  app.get("/health", async (req, res) => {
    try {
      await limiter.consume(req.ip || "unknown");
      res.json({ ok: true });
    } catch {
      res.status(429).json({ ok: false });
    }
  });
  app.listen(PORT, () => logger.info({ PORT }, "Relayer health server listening"));

  // Subscribe to orders
  router.on("EncryptedOrderSubmitted", (orderId: bigint, submitter: string, tokenIn: string, tokenOut: string) => {
    logger.info({ orderId: orderId.toString(), submitter, tokenIn, tokenOut }, "Order received");
    queue.push({ orderId, submitter, tokenIn, tokenOut });
  });

  // Worker loop
  setInterval(async () => {
    if (queue.length === 0) return;
    const batch = queue.splice(0, 5);
    for (const o of batch) {
      try {
        // Call Zama coprocessor to evaluate ciphertext and compute routing (server-side).
        // Expected response shape: { ok: boolean, amountIn: string, minOut: string, publicAmountOut: string, publicPrice: string, fheResultBlob: string }
        const res = await fetch(ZAMA_URL + "/evaluate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${ZAMA_API_KEY}`
          },
          body: JSON.stringify({
            orderId: o.orderId.toString(),
            submitter: o.submitter,
            tokenIn: o.tokenIn,
            tokenOut: o.tokenOut
          })
        });
        if (!res.ok) throw new Error(`Zama eval failed: ${res.status}`);
        const body = await res.json();
        if (!body.ok) throw new Error("Zama eval returned not ok");
        const amountIn = ethers.getBigInt(body.amountIn);
        const minOut = ethers.getBigInt(body.minOut);
        const publicAmountOut = ethers.getBigInt(body.publicAmountOut);
        const publicPrice = ethers.getBigInt(body.publicPrice);
        const fheBlob = body.fheResultBlob as string;
        const tx = await router.executeEncryptedSwap(o.orderId, fheBlob, amountIn, minOut, publicAmountOut, publicPrice);
        logger.info({ orderId: o.orderId.toString(), hash: tx.hash }, "Executed order");
        await tx.wait();
      } catch (e: any) {
        logger.error({ err: e?.message, orderId: o.orderId.toString() }, "Execution failed");
      }
    }
  }, 1000);
}

main().catch((e) => {
  logger.error(e);
  process.exit(1);
});

