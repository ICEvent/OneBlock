# Proof Registry security hardening (PR #28)

**Read this before any controlled staging deployment.** This is an isolated, non-production Canister built on PR #26. No mainnet install or upgrade is authorized.

## Administrator/bootstrap

Proof Registry uses a `persistent actor class ProofRegistry(initialAdmin : Principal)`. A non-anonymous, explicitly configured administrator is required at **initial installation**:

```sh
ADMIN="$(dfx identity get-principal)"
dfx deploy proof_registry --argument "(principal \"$ADMIN\")"
```

There is **no permissionless issuer self-registration**. On the first local installation the initial administrator may register its own issuer Principal; for external issuer Canisters it calls `approveIssuer(issuerPrincipal, displayName)` after reviewing the intended operator. Display names are NOT automatically legally vetted.

Administrator must explicitly bind the issuer to one **immutable namespace prefix** via `setIssuerNamespace(issuerPrincipal, "hortsun.")` before issuer can register schemas. Schema ID must begin with that approved prefix. Prefix is permanently bound; changing company/operator ownership requires an explicit governance migration, not silent relabeling.

Only admin can assign per-issuer quotas, suspend/reactivate issuers and nominate a new admin. Administrator rotation requires `nominateAdministrator` from current admin and `acceptAdministration` from the nominee; nominee cannot unilaterally take control. For production, use a well-controlled governance canister rather than a personal device key.

## Holder consent / anti-spam

All new commitments require a two-party, exact-digest authorization sequence:

1. The approved issuer builds the **complete OVDP JSON claim**, including unpredictable lowercase-hex `source_event_id`, selected Schema ID, evidence references and subject commitment.
2. Issuer computes `SHA256("oneblock:claim:v1\\n" || JCS(claim))`, plus a salted, unpredictable 32-byte subject commitment. Raw customer names, contracts and low-entropy hashes should not be published to this registry.
3. The issuer makes a quota-limited `requestConsent(holderPrincipal, claimDigest, subjectCommitment, expiresAt)` update. The request's holder Principal is not published by the public proof query.
4. **Only the named holder Principal** may `approveCommitment(issuer, claimDigest, subjectCommitment, expiresAt)` with a lifetime no longer than the issuer request. An unrelated Principal cannot authorize that digest.
5. The issuer calls `submitCommitment` with the exact digest and subject commitment. The canister rejects absent, expired, or withdrawn holder authorization; it also checks caller authorization and namespace-bound schema registration.
6. The holder can call `withdrawConsent` even when issuer is suspended. The withdrawal permanently invalidates the digest and recertifies existing related claims as `consent_withdrawn`. Corrected claims need new content digest and event ID.

This authorization proves that **an authenticated Principal approved these bytes**; it does NOT, by itself, establish that the JSON `subject` corresponds to that Principal or that the real-world claim is factual. A separate signed, bilateral subject-identity link is required for that stronger assertion.

## Issuer states and proof bytes

The certified claim leaf format remains 34 bytes:

- `0x01 || SHA256(full claim bytes) || status_byte`
- `0x00`: active
- `0x01`: issuer-revoked (terminal)
- `0x02`: issuer suspended
- `0x03`: holder withdrew consent, **or historic claim had no admissible holder authorization** (fail-closed)

Suspension updates all existing claim leaves. Reactivation only restores active state if claim is neither revoked nor consent withdrawn. The original claim remains in the append-only registry, unmodified. Certificate verification permits at most **60 seconds of drift** in the independent JS SDK; do not display it as instantaneous reality. High-risk access or transfers require a fresh consensus check.

Schema hashes are independently certified at `["schemas", canonicalIssuerPrincipal, schemaId]`. The issuer supplies a SHA256 of the **canonical JCS JSON Schema bytes**. Verifiers recompute this hash from the exact supplied schema, verify the IC BLS certificate/witness, then locally validate the claim against the envelope schema and the `claim_data` against the certified domain schema. Registered Schema Hash ≠ business facts are true.

## Privacy and quotas

The public `getClaimState` is an **uncertified** reduced projection; it excludes subject commitment, holder Principal and evidence hashes. Only the record ID, issuer, schema ID, claim digest and timestamps remain public. Use randomized 16/32-byte `source_event_id` encoded as lowercase hex (32/64 characters); do not encode a name, location, contract number or invoice ID. Reason codes must be short lowercase machine codes, not narrative personal data.

There is no user data in the certified claim leaf beyond the full claim digest and current status. Raw source JSON is never needed on this Canister.

A newly approved issuer defaults to 4 schemas and 32 claims; admin can increase within bounded limits (up to 32 schemas and 128 claims). Consent requests are capped at twice that issuer's claim quota; a holder cannot create consent entries unless an approved issuer first requested authorization. Global staging caps are intentionally retained (128 issuers, 512 schemas, 2,000 claims, 4,000 requests and 4,000 holder approvals).

**This is staging only**: bounded arrays and O(n) scans are not an acceptable final production storage strategy. Before public production use, implement indexed stable maps, pagination, proper economic metering / fee quotas and stress tests. Legal-brand verification and bilateral subject identity proof remain independent governance/security gates.

## Security test matrix

The local DFX E2E covers:

- Unauthorized issuer registration and schema use; namespace not granted / namespace impersonation rejected.
- No commit without an issuer request and an authenticated holder approval of the exact claim digest.
- Unrelated Principal cannot initiate issuer requests or withdraw another holder's consent.
- Same-claim retry, conflicting idempotency, malformed digest and opaque ID checks.
- Issuer suspension/reinstatement, holder withdrawal, terminal issuer revocation, and independently certified status changes.
- Real Merkle witness and BLS verification of claim and schema, incorrect canister / issuer / schema / digest / witness rejection.
- Local upgrade retention of revoked claims, and two-stage administrator succession.

A passing test does **not** establish compliance with privacy laws, real-world factual correctness, legal issuer status, or actual external user account control.

## Upgrade gate

Prior #25/#26 actor forms did not require an admin constructor. This hardening changes the installation signature. None of these PRs has been deployed to production. **Do not attempt an existing mainnet upgrade without an explicit stable migration and operator/recovery plan.** Fresh controlled staging installs are tested. Keep all PRs Draft until any existing proof data has been assessed and migration rehearsed.
