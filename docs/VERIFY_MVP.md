# OneBlock Verify — MVP workbench

## Why

OneBlock has two user-facing product pillars:

1. **Trustworthy data**: provenance-aware, versioned, consent-scoped claims and evidence commitments from independent issuers.
2. **Useful verification tools**: help people determine what can be checked, show the supporting evidence and explicitly distinguish unverified claims from authenticated proof and corroborated fact.

OneBlock must never substitute a platform's global opinion for independent verification.

## What is in this PR

- Public **`/verify`** route and Navbar link, without signing in.
- Evidence Fingerprint: locally calculate exact UTF-8 text or raw file SHA-256 and compare against an independently supplied reference. Supports a `sha256:` prefix and 20MB file limit.
- Claim Inspector: locally inspect a third-party OVDP v1 claim's basic fields, issuer, subject, schema, predicate and evidence digest references; surface missing fields and unresolved verifications.
- Privacy: content is processed in the browser using WebCrypto. No new backend API or remote upload.
- A clearly marked fictional Hortsun sample claim.
- Node 22 tests in `tests/verifyEvidence.test.mjs`.

## Explicitly NOT provided

- Verifying a signature's public key, authorized issuer or control of a linked identity
- Validating the claimed domain schema against an immutable registry
- RFC 8785/JCS content address or cross-language canonicalization
- Verifying ICP certified data/Merkle witnesses or current revocation
- Proving a business event happened, an article is true, or a document was legitimately issued
- Full structural JSON Schema validation or duplicate-key detection

Even a matching hash establishes **byte integrity relative to a supplied digest only**, not authenticity. A structurally acceptable claim is NOT labeled verified. All unsupported checks remain visibly "未验证".

## Try it

From the repo:

```bash
npm install
npm --workspace src/oneblock_frontend run start
# Open /verify
```

To run isolated verification utility tests using Node >= 22:

```bash
node --experimental-strip-types --test tests/verifyEvidence.test.mjs
```

Browser smoke test:
1. Open `/verify` without login. Try text `abc`; expected SHA-256: `ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad` → match.
2. Change text to `abd` → mismatch. Provide malformed expected hash → invalid reference. Blank expected hash → not provided, never match.
3. Select a small file and compare with a known SHA-256 from an independent source. Confirm files are not sent over the network (DevTools Network tab).
4. Claim Inspector: click fictional example. Confirm **only** "基础字段齐全（非真伪验证）" appears and three unresolved checks remain.
5. Remove issuer, evidence or supply malformed JSON → missing fields/errors; never show verified.
6. Test mobile layout and keyboard navigation.

## Next implementation phases

### Phase 1 — Verified data
Separate `proof_registry` canister, named issuer controllers, signature verification, schema registry, authenticated updates, content hashes over ALL committed fields, certified current state, idempotency and append-only revocation. Build independent verifier and adversarial tests. See `docs/OVDP_V0_1_PROPOSAL.md` in PR #23 (not yet merged).

### Phase 2 — Meaningful fact-checking
An evidence graph of source documents, citations and contradictions. Distinguish primary sources, secondhand reports and syndicated copies. Date-sensitive checks and reproducible source snapshots. Avoid AI-generated unsubstantiated "truth scores".

### Phase 3 — Applications
ICEvent appointment completion, Hortsun signed work receipt, Vansday attendance, Defunds repayment, each with an audited source-to-OneBlock-to-independent-verifier E2E path and scoped consent. Invite external issuers through a documented Candid/HTTP SDK.

## Acceptance gates

Before any UI says "cryptographically verified": verify issuer authority, actual signature/caller, canonical full claim digest, IC certificate+witness and current status with an independent client. The user's own claim import is still just a self-declaration until re-attested. Never disclose private source evidence in public logs or indexes.

Before any UI says "fact corroborated": identify independently attributable evidence, its date, scope and limitations, and preserve counter-evidence/dispute history. Null/unknown must not become false or true by default.
