# Private Whale-Safe Swapper (FHE / Zama-ready, MOCK_FHE local)

Privacy-first DEX router that hides trade size using FHE so whales can swap without MEV or sandwich attacks. Only the final executed price/result is public.

## Quick start

1) Clone and install
```
git clone <repo>
cd private-whale-safe-swapper
yarn install
```

2) Start local dev (MOCK_FHE=true): launches Hardhat node, Next.js, and Relayer
```
yarn dev
```

3) Run contracts tests
```
cd contracts
yarn test
```

4) Deploy to local and simulate
```
cd contracts
yarn deploy:local
yarn simulate
```

## Environments

- MOCK mode: `FHE_MODE=MOCK`, `MOCK_FHE=true`. Uses deterministic mock encryption/decryption.
- Zama: set `FHE_MODE=ZAMA`, `ZAMA_API_KEY`, `NEXT_PUBLIC_ZAMA_*` values.

See `.env.example` for all vars (contracts, frontend, relayer).

## How to switch to real Zama

- Frontend `frontend/lib/tfheClient.ts`: replace mock implementations with Zama TFHE WASM client.
  - Docs: https://docs.zama.ai (Concrete / FHEVM)
- Solidity: replace `FHEVerifierMock` by calls to FHEVM precompile/coprocessor in relayer flow.
  - Reference: https://docs.zama.ai/concrete/fhevm
- Set:
  - `FHE_MODE=ZAMA`
  - `ZAMA_API_KEY=...`
  - `NEXT_PUBLIC_ZAMA_RELAYER_URL`, `NEXT_PUBLIC_ZAMA_*` contract addresses
  - `ZAMA_CHAIN_PRECOMPILE_ADDRESS` in contracts config if used

## Scripts

- `yarn dev` → run local stack with MOCK FHE.
- `yarn test` → run all packages tests.
- `yarn deploy:local` → deploy contracts to localhost.

## CI

GitHub Actions runs lint, build, and tests for contracts, frontend, and relayer on PRs and pushes.

## Docs

- ARCHITECTURE.md: system design and sequence diagrams.
- SECURITY.md: threat model, MEV protections, mitigations.


