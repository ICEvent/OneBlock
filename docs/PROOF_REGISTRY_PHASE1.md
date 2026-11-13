# OneBlock Proof Registry — Phase 1 (caller-bound commitment receipts)

**State:** development PR; not deployed or independently certified. This component is a staging point between [Protocol V1](../PROTOCOL_V1.md) / [OVDP proposal in PR #23](https://github.com/ICEvent/OneBlock/pull/23) and a genuine verifiable claim network.

## What this version actually establishes

- Every issuer ID is exactly the **authenticated ICP caller principal**. `registerIssuer("Hortsun")` by itself does not prove ownership of the Hortsun brand, legal identity or website.
- Each registered caller can register **immutable schema digest metadata** under its own principal. A digest is not verification that the external schema exists or conforms to a standard.
- `submitCommitment` accepts only a registered issuer and a schema registered by that same issuer. It records **issuer-supplied** 32-byte SHA-256 commitments to a full claim, pseudonymous subject and up to eight evidence objects.
- Submission is immutable and idempotent under `issuer principal + source_event_id`. The exact same tuple is accepted as a retry; changed fields with the same key are rejected. No claim overwrites.
- Only the originating issuer can add a terminal `#revoked` status event. The original attestation is never changed.
- All data persists across upgrades in a separate `persistent actor` with no migrations of Profile, ActivityRecord or OIP.
- `getClaimState` is explicitly **not certified** and `certified = false`. `getClaimStateUpdate` is an update call, but does not provide a portable Merkle witness or IC certificate.

### Critical limitations

**DO NOT** call returned records "cryptographically verified", "certified", "signed claim" or "true". ICP authenticates **who called the update method**, not whether an off-chain claim happened, whether an issuer name is real, whether a submitted SHA-256 was calculated correctly, or whether the subject consented. Direct canister-to-canister or authenticated user-principal calls are currently the **only** authorization mechanism; HTTP gateway signature verification is NOT implemented.

This phase intentionally does not accept entire claim JSON, financial amounts, personal identifiers or private evidence. Only use opaque, unpredictable `source_event_id` values and salted/randomized subject commitments (e.g. SHA-256 of a large random nonce concatenated with an internal ID). **A simple unsalted digest of an email, address or small dollar amount is not private.** If a hashed value is guessable, it must not be submitted.

The arrays have hard capacity limits (128 issuers, 512 schemas, 2,000 claims, 2,000 status events). No pagination, removal or public mainnet activation until bounded-state behaviour is addressed.

## API (typed Candid generated from Motoko)

| Method | Auth | Effect |
|---|---|---|
| `registerIssuer(displayName)` | non-anonymous caller | self-register principal; name is unvetted |
| `registerSchema(schemaId, sha256Blob)` | registered caller | bind immutable schema hash to caller |
| `submitCommitment(NewCommitment)` | registered schema owner | store issuer-supplied commitment; idempotent |
| `revokeCommitment(claimId, reasonCode)` | original issuer only | append a permanent revocation |
| `getIssuer(principal)` | public query | metadata, **not independently certified** |
| `getSchema(principal,schemaId)` | public query | schema hash, **not independently certified** |
| `getClaimState(claimId)` | public query | receipt and last status, `certified=false` |
| `getClaimStateUpdate(claimId)` | public update | consensus-executed state read, no witness |
| `getRegistryCounts()` | public query | aggregate counts |

`NewCommitment` fields:

```text
source_event_id: Text             // unique, non-sensitive opaque id per issuer
schema_id: Text                   // pre-registered immutable namespace/version
claim_sha256: Blob                // exactly 32 bytes, *issuer supplied*
subject_commitment: Blob         // exactly 32 bytes, salted/private reference
evidence_sha256: [Blob]           // 0..8, exactly 32 bytes each
event_at: Int                     // nanoseconds (issuer-supplied)
```

The returned ID is `Principal.toText(caller) + "/" + source_event_id` and the registry captures `accepted_at` with `Time.now()`. Replays after revocation still return the historical attestation; **always check status separately**.

## Local developer testing

```bash
dfx start --background
dfx deploy proof_registry
python3 tests/proof_registry_e2e.py
dfx stop
```

The test exercises successful registration, a same-payload retry, different-hash conflict, an adversarial principal's attempts to register another issuer's schema, submit the issuer's commitments, revoke someone else's record, then owner revocation and status observation.

The CI job `Proof Registry Phase 1` compiles and executes this test with DFX 0.30.1 on a local replica. This cannot substitute a full upgrade/reinstall test, canister caller-to-caller E2E or review of cross-canister identity and consent.

## What third-party apps do

An ICP-based ICEvent/Hortsun application registers **from its own canister principal**, registers its schema and calls `submitCommitment` as that principal, without exposing raw customer data. Retain the full canonical source claim and evidence **off this registry**, and let the user compare those bytes to the submitted digest using a trusted verifier.

A website or centralized backend **cannot** claim the same issuer identity by POSTing to a generic proxy. Require a registered signing key, signed authorization envelope, anti-replay checks and caller mapping before introducing a public HTTP gateway.

## Required work before this becomes a true verifiable proof platform

1. Implement RFC 8785/JCS payload canonicalization with cross-language SHA-256 vectors and **verify the digest against provided canonical bytes or a signed digest**, with an explicit binding to issuer and expected schema/subject.
2. Add authenticated, scoped identity links and user consent, including revocation. Restrict private claims and evidence.
3. Add issuer key registration/rotation, real signature verification, replay-resistant gateway authorization and optional institutional vetting.
4. Replace bounded arrays with indexed/capacity-accounted stable storage and pagination.
5. Build a certified Merkle map for attestation and current status; publish a witness plus IC certificate and **independently verify them** in the web/SDK. Protect against stale certificates after status updates.
6. Add integration tests for upgrades, canister-to-canister submission, certificate tampering, claims conflict, unauthorized access and no leakage through indexes.
7. Connect ICEvent completion -> authenticated issuer canister -> proof registry -> **independent verifier**. Keep real-world truth/corroboration separate from cryptographic validity.

## Security invariant

OneBlock must separate **authenticated origin**, **content integrity**, **current state**, and **real-world truth**. A working registry update is only the first part, never a global claim that something is true.
