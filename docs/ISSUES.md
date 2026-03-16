# Issues

> Pending implementations for the Lance freelancer platform.
> **Not wired into any build, test, or CI step — safe to ignore.**

---

## Issue 1: Escrow Contract Implementation

**Description**
The `contracts/escrow/src/lib.rs` file contains only type definitions and `todo!()` stubs. The escrow contract is the core of the platform — it holds client funds in trust and releases them based on milestone approval or judge verdict.

**Requirements**

- `initialize(env, admin)` — persist admin key in instance storage; guard against double-init

- `deposit(env, job_id, client, freelancer, token, amount, milestones)` — transfer USDC from client → contract via `token::Client::transfer`; store `EscrowJob` in persistent storage
- `release_milestone(env, job_id, caller)` — verify caller is client; compute proportional release (`total / milestones`); transfer to freelancer; mark `Completed` when all milestones done
- `open_dispute(env, job_id, caller)` — verify caller is client or freelancer; set status to `Disputed`
- `resolve_dispute(env, job_id, freelancer_share_bps)` — require admin auth; split remaining funds by BPS; transfer to both parties; set status to `Resolved`
- `refund(env, job_id, client)` — require client auth and `Active` status; return remaining funds to client

**Acceptance Criteria**

- Contract compiles to WASM with `cargo build --target wasm32-unknown-unknown -p escrow`
- All six functions pass Soroban unit tests covering happy path, double-init guard, and unauthorized caller rejection
- Funds are correctly split when `freelancer_share_bps = 5000` (50/50 split)

---

## Issue 2: Reputation Contract Implementation

**Description**
The `contracts/reputation/src/lib.rs` contains stubs for an on-chain reputation system inspired by ERC-8004. Reputation scores influence trust signals displayed in the frontend and may gate future features.

**Requirements**

- `initialize(env, admin)` — persist admin key; guard double-init
- `update_score(env, address, role, delta)` — require admin auth; load or default score to 5000 bps; add delta; clamp result to `[0, 10000]`; increment `total_jobs`
- `slash(env, address, role, reason)` — require admin auth; deduct 2000 bps from score; clamp to 0
- `get_score(env, address, role)` — return stored `ReputationScore` or a default (score=5000, total_jobs=0)

**Acceptance Criteria**

- Contract compiles to WASM
- Score cannot exceed 10000 or go below 0 regardless of inputs
- Slash reduces score by exactly 20% of max (2000 bps)
- Unauthenticated callers to `update_score` and `slash` are rejected

---

## Issue 3: Job Registry Contract Implementation

**Description**
The `contracts/job_registry/src/lib.rs` stubs out on-chain job lifecycle management. Job metadata (IPFS CIDs) and state transitions are stored on-chain for auditability.

**Requirements**

- `post_job(env, job_id, client, metadata_hash, budget)` — require client auth; guard duplicate `job_id`; store `JobRecord` and empty bids vec
- `submit_bid(env, job_id, freelancer, proposal_hash)` — require freelancer auth; verify job status is `Open`; append `BidRecord`
- `accept_bid(env, job_id, client, freelancer)` — require client auth; set freelancer and status to `InProgress`
- `submit_deliverable(env, job_id, freelancer, hash)` — require freelancer auth; verify status `InProgress` and correct freelancer; set status to `DeliverableSubmitted`; persist hash
- `mark_disputed(env, job_id)` — no auth guard (called cross-contract from escrow); set status to `Disputed`

**Acceptance Criteria**

- Contract compiles to WASM
- Full lifecycle (post → bid → accept → deliverable) passes as a single Soroban test
- Submitting a bid on a non-Open job panics with a clear message
- `mark_disputed` can only transition from `InProgress` or `DeliverableSubmitted`

---

## Issue 4: OpenClaw AI Judge Integration

**Description**
`backend/src/services/judge.rs` contains a stub that panics at runtime. The judge service is the AI core of the platform — it analyses job specs, deliverables, and evidence, and returns a structured verdict.

**Requirements**

- Read `OPENCLAW_API_KEY` and `OPENCLAW_BASE_URL` from environment
- POST job spec, deliverable hash, and evidence arrays to the OpenClaw API
- Parse response into `JudgeVerdict { winner, freelancer_share_bps, reasoning }`
- Implement exponential backoff for rate-limit (429) and transient (5xx) errors
- Return a typed `anyhow::Result<JudgeVerdict>`

**Acceptance Criteria**

- Integration test mocking the OpenClaw endpoint passes
- A 429 response is retried up to 3 times before failing
- An invalid API key returns `Err(...)` without panicking
- `reasoning` is non-empty in all successful responses

---

## Issue 5: Soroban RPC Contract Calls (Backend)

**Description**
`backend/src/services/stellar.rs` stubs out all contract invocations. These must be wired to the live Soroban contracts so the backend can trigger on-chain state changes (milestone releases, dispute resolution).

**Requirements**

- Load judge authority keypair from `JUDGE_AUTHORITY_SECRET`
- For each method, build a Soroban `InvokeHostFunctionOp` XDR transaction using the `stellar-xdr` crate
- Fetch current sequence number from Horizon before signing each transaction
- Submit via Soroban RPC `sendTransaction`; poll `getTransaction` until confirmed or failed
- Implement `release_milestone`, `open_dispute`, and `resolve_dispute`

**Acceptance Criteria**

- Testnet integration test: `release_milestone` submits a real transaction and returns a valid tx hash
- A failed submission (e.g. wrong contract ID) returns `Err(...)` with a descriptive message
- Sequence number collision errors are retried once with a refreshed sequence number

---

## Issue 6: Background Judge Worker

**Description**
`backend/src/worker.rs` is a single `todo!()` stub. The worker polls the database for open disputes, coordinates the AI judge, and resolves disputes on-chain automatically.

**Requirements**

- Spawn as a `tokio::task` from `main.rs` alongside the HTTP server
- Poll every 30 seconds for disputes with `status = 'open'`
- For each open dispute: gather evidence, mark as `under_review`, call `JudgeService::judge()`
- On success: persist `Verdict`, call `StellarService::resolve_dispute()`, update dispute to `resolved`
- On failure: reset dispute to `open` and log the error; retry on next cycle

**Acceptance Criteria**

- Worker starts without blocking the HTTP server
- A mocked judge service triggers a verdict insert and dispute status update in an integration test
- Failed judge calls do not leave disputes stuck in `under_review`

---

## Issue 7: Wallet Connection (Frontend)

**Description**
`apps/web/lib/stellar.ts` stubs `connectWallet()` and `signTransaction()`. These are required for any authenticated user action (posting jobs, releasing milestones, opening disputes).

**Requirements**

- `connectWallet()` — open the `StellarWalletsKit` modal; on selection persist public key to a React context/store; return the public key
- `signTransaction(xdr)` — pass the XDR string to the connected wallet for signing; return signed XDR
- Handle user cancellation gracefully (return `null`, do not throw)
- Support Freighter as the default wallet; kit handles others

**Acceptance Criteria**

- Connecting Freighter in a browser returns a valid `G…` public key
- Signing a test transaction with Freighter returns a valid signed XDR string
- Cancelling the modal returns `null` without an unhandled error

---

## Issue 8: Soroban Contract Call Helpers (Frontend)

**Description**
`apps/web/lib/contracts.ts` stubs `depositEscrow`, `releaseMilestone`, and `openDispute`. These helpers bridge the UI to the on-chain contracts via Freighter.

**Requirements**

- Build a Soroban invocation XDR for each contract function using `@stellar/stellar-sdk`
- Pass XDR to `signTransaction()` (from `stellar.ts`); submit signed XDR to Soroban RPC
- Return the confirmed transaction hash
- Display a loading state during submission (handled by the calling component)

**Acceptance Criteria**

- `depositEscrow` on Testnet locks USDC and returns a tx hash
- `releaseMilestone` transitions the escrow job milestone on-chain
- Invalid parameters (e.g. zero amount) throw before submitting a transaction

---

## Issue 9: IPFS Deliverable Storage

**Description**
Deliverable files are currently referenced by hash only — actual file storage is not wired. Both the backend (evidence submission) and frontend (file upload) need IPFS integration.

**Requirements**

- Backend `evidence.rs`: accept file uploads; pin to IPFS via Web3.Storage or Pinata; store returned CID in `evidence.file_hash`
- Frontend: file picker component that uploads to backend and displays the CID
- CID must be stored in the job's on-chain `metadata_hash` via `job_registry.submit_deliverable`

**Acceptance Criteria**

- Uploading a file returns a valid IPFS CID (e.g. `bafybei…`)
- The CID is retrievable from a public IPFS gateway within 60 seconds
- Empty or oversized files (> 50 MB) are rejected before upload

---

## Issue 10: Appeal Process for Large Disputes

**Description**
The current dispute flow goes directly to the AI judge. For high-value disputes a human appeal layer should be available.

**Requirements**

- Define a threshold (e.g. disputes where `budget_usdc > 1_000_0000000`) that triggers the appeal option
- Stub API route `POST /disputes/:id/appeal` exists — implement: create an appeal record, notify a configured set of arbiter addresses
- Arbiters vote via a Soroban multisig or an off-chain weighted vote stored in the DB
- Final appeal verdict overrides the AI judge's decision

**Acceptance Criteria**

- Appeals are only available for disputes above the configured threshold
- A 3-of-5 arbiter vote closes the appeal and updates the dispute verdict
- The API returns 400 if appeal is requested on a low-value dispute

---

## Issue 11: Cross-Chain Stablecoin Support (Multichain)

**Description**
The platform uses Stellar USDC. Future support for cross-chain stablecoins (e.g., Celo CUSD, Ethereum USDC, Polygon USDT) requires a cross-chain bridge to allow freelancers and clients to operate asynchronously across varying networks.

**Requirements**

- Evaluate Wormhole, LayerZero, and Squid Router for EVM ↔ Stellar bridging
- Implement a bridge adapter service that wraps the chosen bridge SDK
- Expose a backend endpoint `POST /bridge/to-stellar` accepting amount + source chain address
- Display estimated bridge fee and time to the user before confirmation

**Acceptance Criteria**

- A testnet stablecoin amount successfully bridges to a Stellar Testnet USDC balance from at least two different chains
- Bridge fee estimate is shown to the user before any transaction is signed
- Bridge failure is surfaced as a clear error message (not a silent hang)
