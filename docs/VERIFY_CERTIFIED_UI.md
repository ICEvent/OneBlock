# OneBlock Verify — certified proof UI integration (PR #27)

## What changed

On top of the PR #24 Verify workbench, the public `/verify` route now has an **ICP 认证证明** tab. It connects to a single build-time trusted Proof Registry canister from #25/#26, and checks the registered commitment against a locally provided **full Claim JSON**.

An untrusted webpage, a user-entered proof URL, and the issuer display name are NOT valid trust anchors. The site operator must configure a trusted registry Canister Principal. No fake fallback or demo claim is treated as verified.

### Required deployment configuration

```bash
# Deployment's real published proof_registry canister Principal:
VITE_PROOF_REGISTRY_CANISTER_ID=<actual-canister-principal>

# Optional ONLY when developing locally and running Vite in DEV mode:
VITE_PROOF_REGISTRY_HOST=http://127.0.0.1:8000
```

The registry ID is never inferred from the user's JSON, account, current URL, URL search parameters, or arbitrary query arguments.

If `VITE_PROOF_REGISTRY_CANISTER_ID` is absent, the certified verification action is **disabled** with a clear message. No mainnet deployment or Canister ID is currently configured in this PR.

In production the verification agent uses `https://ic0.app` and the DFINITY library's built-in **pinned IC root key**. It must never call `fetchRootKey` on a production gateway. A root key is fetched ONLY when `import.meta.env.DEV` and `VITE_PROOF_REGISTRY_HOST` is exactly localhost/127.0.0.1. This PR also removes the legacy, unconditional mainnet `defaultAgent.fetchRootKey()` invocation.

## User flow

1. Open `/verify` → `ICP 认证证明` (no login).
2. Enter the trusted issuer principal and source event claim ID in the exact `issuerPrincipal/source_event_id` format from the proof receipt.
3. Paste the full original OneBlock Claim JSON supplied by the source system (e.g. an authorized ICEvent claim). Avoid sharing private content with unknown sites.
4. The browser rejects duplicate JSON keys (including \u escapes), unsupported protocol/version, invalid claim fields and source event mismatch.
5. Client computes `SHA256(UTF8("oneblock:claim:v1\\n") || UTF8(JCS(fullClaim)))` locally. **Only the Claim ID** is sent to the configured ICP Canister.
6. The client independently validates the ICP BLS certificate, expected canister root, witness path, claim digest and status.
7. Result clearly distinguishes:
    - `active`: certified registration digest and present status, **not factual truth**;
    - `revoked`: certified registration found but explicitly withdrawn;
    - malformed/missing/invalid/tampered proof: verification error, never a success badge.

**Issuer organization's verified legal identity**, the user's consent, evidence authenticity and the claim's real-world truth remain **unverified** even if the ICP commitment is certified.

The fictional Hortsun claim in the older *Claim Inspector* is deliberately not on-chain and will not pass a certified proof check.

## Tests

```bash
npm ci
node --test tests/strictClaim.test.mjs
npx tsc -p src/oneblock_frontend/tsconfig.json --noEmit
cd src/oneblock_frontend && npx vite build
```

The new strict JSON tests cover canonical byte-for-byte full claims, duplicate root/nested/escaped keys, malformed/deep/oversized claims and evidence tampering. The independent ICP verifier itself was tested against active/revoked real local replica certificates and invalid witnesses in PR #26. Frontend Browser E2E is **not** yet complete.

## Dependency order / release gates

This is a **stacked PR on #24**. Related backend dependencies are **#25** (issuer-bound registry) and **#26** (IC certification SDK, stacked on #25). Production verification requires:

- Review #23 OVDP proposal independently and fix schema alignment.
- Merge reviewed #24, #25, then #26, then #27; resolve duplicate SDK files by reusing the identical upstream SDK version.
- Mainnet or controlled staging deployment of `proof_registry` by a responsible operator, explicit safe root-key and canister ID configuration, then manual browser testing against **actual** signed/certified receipts.
- Add issuer governance, verified subject consent, full canonical schema validation, time-sensitive status freshness policies and privacy/risk review before calling the whole system a production trust service.

This UI does **not** provide a public HTTP signing gateway and does not accept unauthenticated arbitrary proof submissions.

## Security review changes after PR #27 (PR #31)

The original verification MVP was *not* sufficient for a complete issuer data claim. These additional steps are now mandatory:

- The supplied `issuer_id` must equal the canonical authenticated issuer Principal prefix in the **registry_record_id**; a brand label is never authenticated identity.
- The `source_event_id` must be an opaque 128/256-bit lowercase hexadecimal identifier and equal the record ID suffix; a name, invoice number or address is rejected.
- OVDP envelope validated against the Draft 2020-12 schema, including person-linked `consent_ref`, timestamp format and the phase-2 cap of eight evidence references.
- The user supplies original **Domain Schema JSON**. The app validates its `$id` against `claim.schema_id`, forbids remote refs, dynamic refs and issuer-defined regex/pattern properties, limits schema payload to 64KiB, validates `claim_data` locally using AJV 2020-12, and computes canonical JSON Schema SHA256.
- The app independently checks a second ICP certificate/Merkle witness from `getCertifiedSchema(issuerPrincipal, schemaId)`. The issuer-scoped Schema hash must match the submitted source Schema bytes. Without a verified Schema, there is **no successful verification**.
- The certified claim status distinguishes `active`, `revoked`, `issuer_suspended` and `consent_withdrawn`. Old consentless records are invalid. No result implies legal organization vetting or bilateral subject identity control.
- The certificate age tolerance was tightened from five minutes to one minute. The displayed time is the **client-side checking time**, not an IC-certified timestamp. High-stakes transfers require additional up-to-date consensus checks.
- No arbitrary external JSON Schema is downloaded or evaluated from a user-chosen URL.

### Safe release gates

PR #31 depends on PR #28's governed issuer/consent/certified-schema APIs and PR #30's OVDP schema. For production, all upstream PRs require joint review: the frontend must not be deployed before the matching backend. A real browser Playwright test on a controlled deployed canister is still required, as is independently confirmed issuer-brand vetting and subject identity control for use cases that need those guarantees.

The root npm audit was reduced to **zero** known advisories by compatible dependency updates and a tested Vite 8 / React plugin 6 migration; Frontend CI now checks `npm audit --audit-level=moderate` and the strict issuer/schema tests. This is a time-of-check result, not a guarantee against new future advisories.
