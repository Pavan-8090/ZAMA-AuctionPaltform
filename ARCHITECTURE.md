# Architecture

## One-line
Privacy-first DEX router that hides trade size using FHE so whales can swap without MEV. Only the executed swap price/result is public.

## Components
- Client: Wagmi/RainbowKit wallet connect. Browser TFHE keypair (WASM), encrypt amount and slippage into `ciphertextBlob`.
- On-chain: `WhaleSafeRouter.submitEncryptedOrder(tokenIn, tokenOut, ciphertext, metadata)` emits `EncryptedOrderSubmitted`. Authorized relayer calls `executeEncryptedSwap` with public outputs.
- Relayer/Batcher: collects encrypted orders, evaluates FHE (mock in dev), batches execution, calls router on private RPC.

## Privacy guarantees
- No plaintext amounts/slippage on-chain or in relayer logs.
- Public outputs limited to executed price and amount out.

## Fallbacks
- MOCK_FHE for local dev.
- Commit-reveal EIP-712 cancel path to prevent stale execution.
- Recommend private RPC / Flashbots-like relay for execution.

## Sequence diagram (MOCK_FHE)
```
User Wallet      Browser (TFHE)        Router             Relayer/Worker          Exchange
    |                  |                  |                     |                    |
    |-- Connect ------>|                  |                     |                    |
    |                  |-- gen keypair -->|                     |                    |
    |                  |-- encrypt amt/sl |                     |                    |
    |-- submit tx ----------------------->|                     |                    |
    |                  |                  |-- EncryptedOrderSubmitted event ------->|
    |                  |                  |                     |-- pick+batch ----->|
    |                  |                  |                     |-- mock eval (FHE)  |
    |                  |                  |<-- executeEncryptedSwap (public out) ---|
    |                  |                  |-- SwapExecuted ------------------------>|
    |<----------------- UI shows public outcome                                      |
```

## Data model
- `ciphertext`: opaque bytes containing encrypted amount and slippage.
- `metadata`: opaque bytes (client version, hints) – never plaintext amounts.
- `SwapExecuted(orderId, tokenIn, tokenOut, publicAmountOut, publicPrice)`.

## Zama integration points
- Frontend: `frontend/lib/tfheClient.ts` functions:
  - `initZamaWasm`, `generateKeypair`, `encryptUint256`, `serializeCiphertext`, `deserializeCiphertext`, `mockDecrypt`.
  - Replace with Concrete / FHEVM client – see https://docs.zama.ai
- Solidity: replace `FHEVerifierMock` with precompile/coprocessor calls. See https://docs.zama.ai/concrete/fhevm

## Batch auctions / MEV
- Relayer batches orders and executes together.
- Recommend Flashbots/private RPC for execution to avoid temporal MEV.


