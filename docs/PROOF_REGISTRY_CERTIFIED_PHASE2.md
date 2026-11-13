# Certified Proof Registry — Phase 2 (stacked on PR #25)

**Status:** Draft; local ICP certification prototype. Not a claim that real-world statements are true. Never deploy directly to mainnet without independent security review.

## Proof boundary

The registry authenticates an ICP **caller principal** that submits an issuer-supplied SHA-256 commitment. The Merkle tree plus the IC subnet certificate prove the **registered commitment** and **current status reported within the certificate freshness window** at a known canister ID. They do not prove that an external business event occurred, the issuer name belongs to a legal company, the source digest was honestly computed, or a user consented.

Use only hashed/salted opaque identifiers; raw customer identity, low-entropy email hashes, balances and contract contents are not suitable for a public certified tree.

## On-chain representation

Motoko `ic-certification@1.0.0` / `CertTree` stores a stable Merkle tree alongside the phase-1 append-only registry.

Path is two UTF-8 labels:

```text
["claims", "<caller-principal>/<opaque-source_event_id>"]
```

Leaf is **34 bytes**:

```text
byte 0:    0x01                     (leaf format version)
bytes 1-32: issuer-supplied SHA-256 digest of the canonical full claim
byte 33:   0x00 active / 0x01 revoked
```

`getCertifiedClaim(claimId)` is a Candid `query` returning `value : ?Blob`, `certificate : ?Blob`, `witness : Blob`. The raw response is still **untrusted until independently verified**. Missing claims have a non-membership witness, never a fabricated "verified" claim.

Any new or revoked claim updates the leaf **and** calls `CertifiedData.set` with the tree root. On install/upgrade the tree is rebuilt from persistent attestation+status arrays, including migration from PR #25 state. Existing Profile and LifeBlocks are not changed. `getClaimState` from phase 1 still explicitly reports `certified=false` because it returns ordinary uncoupled query data.

## Off-chain verification

`sdk/verifyCertifiedClaim.mjs` uses `@dfinity/certificate-verification@4.0.0` and `@icp-sdk/core@6` for:
1. BLS subnet certificate verification against **trusted root key** and expected canister.
2. certificate time freshness check (five minutes; shorter limits/high-stakes update reads needed for time-critical decisions).
3. CBOR witness hash reconstruction and equality against the certified root.
4. exact lookup path `["claims", claimId]` and response-value match.
5. leaf format, caller-provided **independently computed** expected digest and status validation.

It throws on certificate/witness/digest/value mismatch. A verified revoked record is returned as **revoked**, never currently valid. Unknown/Merkle absence is not a valid claim.

`sdk/claimDigest.mjs` provides deterministic restricted-JSON canonical serialization and `sha256(UTF8("oneblock:claim:v1\\n") || UTF8(JCS(claim)))`. Rejects NaN, Infinity, unsafe JS integers, non-JSON values, invalid UTF-16. It assumes raw untrusted JSON was parsed with a **duplicate-key-rejecting parser**, because JS `JSON.parse` loses duplicate keys. True protocol-compliant JSON Schema validation remains pending.

**Mainnet trust anchor:** never fetch the IC root key from a random gateway. Use the SDK's pinned production root key. `agent.fetchRootKey()` is permitted **only in local E2E**.

## Local verification

```bash
npm install --global ic-mops@3.5.1
mops install
npm install --no-save --package-lock=false --ignore-scripts @dfinity/certificate-verification@4.0.0 @icp-sdk/core@^6.0.0
node --test tests/claimDigest.test.mjs
dfx start --background --clean
dfx deploy proof_registry
python3 tests/proof_registry_e2e.py
dfx stop
```

E2E performs issuer registration, idempotency and denial checks, retrieves live certification for an active claim, verifies it externally, verifies revoked claim and successful preservation after local upgrade. The external verifier intentionally fails on changed SHA-256, incorrect canister ID, changed leaf content and invalid witness.

## Security review and non-goals

- No off-chain issuer Ed25519 signature verification or registered keys.
- No identity/consent binding, per-user ACL or selective-disclosure cryptography.
- The issuer's digest is **supplied**, not computed on-chain from original canonical claim bytes; consumers must independently recompute claim SHA-256 from source bytes. An issuer may attest to fabricated evidence.
- A live certified query can be replayed within certificate freshness tolerances. High-value real-time actions should use a fresh authenticated update call or stricter freshness / challenge constraints; never imply instantaneous revocation finality.
- The `mops.toml` dependency is pinned; package-lock, production build reproducibility, cross-language vectors and provenance security review remain prerequisites for merge.
- The phase-1 registry still has hard capacity caps and O(n) lookups, suitable for an internal staging prototype, not production traffic.
- Public certificate/witness queries are not linked into OneBlock /verify UI yet, because PR #24 is separate and still draft.

## Follow-up

1. Full structured claim validation, duplicate-key rejecting parser and schema registry.
2. Issuer signature keys, registration proof and subject consent.
3. Independent production client + UI integration of Proof API, with robust status semantics.
4. ICEvent appointment -> authenticated source canister -> OneBlock certified commitment -> external verifier E2E.
5. Cross-language hash vectors, scalability, DoS, upgrade and privacy audits.

References:
- https://docs.internetcomputer.org/guides/backends/certified-variables/
- https://docs.internetcomputer.org/guides/frontends/certification/
- https://github.com/nomeata/ic-certification
