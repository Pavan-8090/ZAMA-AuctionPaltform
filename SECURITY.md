# Security and Threat Model

## Goals
- Hide trade amounts and slippage from mempool and chain observers.
- Restrict on-chain public data to final executed price/result.

## Threats
- Malicious relayer: might delay or reorder. Mitigation: EIP-712 cancel, batch auctions, private RPC recommendation.
- Replay/fraud: Nonces per-submitter; `order.status` gating; signatures bound with deadline.
- Frontrunning: No plaintext amounts; recommend private RPC for final tx.
- Decryption leakage: Never decrypt client-side secret in logs; MOCK mode deterministic but not secure; production uses Zama TFHE.
- Reentrancy: Router uses ReentrancyGuard and pulls tokens with SafeERC20.

## Operational guidance
- Use rate limits and auth on relayer endpoints (see relayer health).
- Log ciphertext/orderId only; no plaintext anywhere.
- Minimal privileges: only RELAYER_ROLE can execute.


