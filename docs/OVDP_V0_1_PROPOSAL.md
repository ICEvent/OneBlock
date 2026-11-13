# OneBlock Verifiable Data Protocol (OVDP) v0.1 — Proposal

Status: **Design proposal, not implemented**. Date: 2026-11-12. Target: `ICEvent/OneBlock`.

## 0. Executive decision

OneBlock is an **evidence and attestation network**, not a central copy of business databases and not an oracle of absolute truth.

- Domain applications (ICEvent, Hortsun, Vansday, Defunds, external providers) remain **systems of record**.
- An **issuer** claims something about a **subject**, attaching references and cryptographic commitments to evidence.
- OneBlock authenticates issuers, validates schemas and scope/consent, records immutable commitments, and returns **certified inclusion and current status proofs**.
- Independently verifiable proofs answer *who attested what, when, whether bytes changed, whether a record was committed, and whether it remains active*; they **do not automatically establish that a real-world assertion is true**.
- Consumer trust policies remain contextual. No protocol-wide trust/reputation score decides truth.
- Sensitive business data stay with their owner or encrypted BYOS storage; never write financial, location or identity secrets to a public on-chain log.

This document builds on `PROTOCOL_V1.md`, `PROFILE_PROVENANCE.md`, `ActivityRecord`, `IntegrationApp`, `IntegrationConnection`, and OIP providers, without changing existing record layouts in place.

## 1. Standards and interoperability

- Common claim envelope: **OVDP v0.1**, transport-neutral (Candid on ICP, HTTPS JSON gateway off-chain).
- Canonical JSON: **RFC 8785 JCS** with I-JSON restrictions. All financial amounts, currencies' minor units, large integers and high-precision timestamps are **strings**, never `float64`.
- Commitment: `SHA-256(UTF8("oneblock:claim:v1\n") || JCS(claim_body))`. `claim_body` excludes claim_id, proof/signature and registry receipt. The domain separator and canonical bytes must have cross-language test vectors before production. **Two distinct identifiers** are required: `claim_id` is `sha256:<lowercase-hex>` (content address), while `registry_record_id` is `<authenticated-issuer-principal>/<opaque-random-event-id>` (certified Merkle lookup key). Never treat a registry record ID as a content hash. Both must be returned in the receipt and checked independently.
- Cryptographic authorisation: (a) direct ICP inter-canister update with `caller` equal to a registered canister principal, or (b) explicitly verified supported signature suite (e.g. Ed25519 key with registered issuer binding). **A present `signed_payload` is not proof of a valid signature.** A public HTTP gateway must not lend its own identity to unverified input.
- Registry commitment: ICP `certified_data` with a Merkle witness and IC certificate. Ordinary query results alone are not cryptographically certified. The client checks the certificate against the IC root key, tree witness, claim digest and requested canister.
- Optional interoperability export: W3C VC Data Model 2.0 + applicable securing scheme and Bitstring Status List v1.0. Label an export a "W3C VC" **only if it actually conforms to W3C**; an OVDP receipt alone is not a compliant VC.
- Versioned schema IDs, immutable historical schema versions and explicit migration mappings.

References: https://www.w3.org/TR/vc-data-model/ ; https://www.w3.org/TR/vc-data-integrity/ ; https://www.w3.org/TR/vc-bitstring-status-list/ ; https://www.rfc-editor.org/rfc/rfc8785 ; https://docs.internetcomputer.org/concepts/certified-data/ ; https://docs.internetcomputer.org/guides/authentication/verifiable-credentials/

## 2. Core entities

### 2.1 EntityRef

```ts
type EntityRef = {
  namespace: string; // "ic:principal", "ic:canister", "oneblock:profile", "external:issuer-qualified"
  id: string;        // opaque, URI-safe within namespace
  kind: "person" | "organization" | "agent" | "app" | "asset" | "contract" | "event" | "transaction" | "object";
};
```

A `ProfileId` is **not** proof of control of a principal. An app-local external ID is **not** automatically the same person as a OneBlock profile or a principal on another origin. Subject linkages require scoped bilateral control proof, holder consent, explicit lifecycle epoch and revocation.

### 2.2 IssuerDescriptor

```ts
type IssuerDescriptor = {
  issuer_id: string;                 // immutable issuer namespace/ID
  controllers: string[];             // registered ICP principals or verification keys
  keys: { key_id: string; algorithm: string; public_key?: string; valid_from: string; valid_until?: string }[];
  allowed_schemas: string[];         // fully versioned schema IDs
  status: "active" | "suspended" | "retired";
  policies: { holder_consent_required: boolean; max_claim_bytes: number };
  metadata_uri?: string;
};
```

Issuer registration requires a control challenge and admin/policy checks. A controller rotation is an append-only registry event and must not silently rewrite earlier proofs. A legal/institutional label requires external vetting; it is not self-certified.

### 2.3 SchemaDescriptor

```ts
type SchemaDescriptor = {
  schema_id: string;           // e.g. "urn:oneblock:schema:icevent.appointment.completed:1.0.0"
  version: string;             // semver, immutable on release
  media_type: "application/schema+json";
  schema_uri: string;
  schema_sha256: string;       // hash of immutable schema bytes
  publisher_issuer_id: string;
  status: "draft" | "active" | "deprecated";
};
```

Providers own their extension namespaces; OneBlock maintains a small common vocabulary (`created`, `completed`, `attended`, `issued`, `paid`, `repaid`, `transferred`, `revoked`, `verified`). Schema validation is separate from issuer authority and factual verification.

### 2.4 ClaimBody (the canonical commitment target)

```ts
type ClaimBody = {
  protocol: "oneblock.claim";
  version: "1.0";
  issuer_id: string;
  subject: EntityRef;
  predicate: string;                   // namespaced, e.g. "icevent:appointment.completed"
  object?: EntityRef;
  schema_id: string;                   // immutable schema/version ID
  claim_data: Record<string, unknown>; // schema-validated, public/minimised or ciphertext reference
  evidence: EvidenceRef[];
  event_at: string;                    // UTC RFC 3339
  issued_at: string;                   // UTC RFC 3339, claimed by issuer
  valid_until?: string;
  source_event_id: string;             // 128-bit or 256-bit unpredictable lowercase hex ID, uniqueness scope = issuer Principal
  supersedes?: string;                 // prior claim ID, never mutate prior claim
  links?: string[];                    // related claim IDs
  visibility: "public" | "unlisted" | "restricted";
  consent_ref?: string;                // mandatory for protected person-linked publication
};
```

`issued_at` is issuer-provided, while registry `accepted_at` is observed by OneBlock. Do not treat issuer timestamps as independently attested time. `source_event_id` provides idempotency under `(issuer_id, source_event_id)`; retries with identical digest return the same receipt, conflicting digests fail.

### 2.5 EvidenceRef and SignedSubmission

```ts
type EvidenceRef = {
  evidence_id: string;
  schema_id?: string;
  content_sha256: string;             // exact source bytes or committed canonical source representation
  content_type?: string;
  locator?: string;                   // URI; may be private/permissioned
  availability: "public" | "authorized" | "offline";
  commitment_nonce_ref?: string;     // private salt/nonce reference for low-entropy data
};
type SignedSubmission = {
  claim_body: ClaimBody;
  claim_id: string;                   // sha256:<lowercase digest>, derived from full canonical body, not arbitrary
  auth: {
    method: "ic-caller" | "ed25519";
    issuer_key_id?: string;
    signature_base64url?: string;     // required and verified for ed25519 mode
    audience: string;                 // expected proof registry/gateway
    nonce: string;                    // replay protection
    expires_at: string;
  };
};
```

For external signed submissions, sign a clearly domain-separated, canonical **submission authorization envelope** including claim ID, `audience`, nonce, expiry, issuer ID and key ID. Do not sign an ambiguous concatenation. For direct inter-canister calls use verified `caller` and registry authorization; no fake signature field is needed. Gateways forward proof of authority, they do not become issuers.

Hashes of easily guessed private values (e.g. a small CAD amount, known email, yes/no) leak information by offline guessing; hash-only is **not** sufficient privacy. Use restricted evidence, encryption and, where appropriate, hidden random commitments with nonce retention.

### 2.6 AttestationReceipt and StatusEvent

```ts
type AttestationReceipt = {
  claim_id: string;                  // sha256:<hash>
  registry_record_id: string;        // issuer-principal/opaque-event-id; certificate Merkle path
  issuer_id: string;
  accepted_at: string;              // registry-observed time
  registry_canister: string;
  registry_sequence: string;         // nat encoded as decimal string
  commitment: string;
  certification: "pending" | "certified";
  certified_witness?: string;        // byte-encoded witness, client must check certificate
  ic_certificate?: string;
};
type ClaimStatusEvent = {
  event_id: string;
  claim_id: string;
  issuer_id: string;
  action: "revoke" | "suspend" | "reinstate" | "supersede" | "dispute" | "withdraw_consent";
  reason_code?: string;
  effective_at: string;
  sequence: string;
  authorization_digest: string;
};
```

Claims and status events are append-only. Certified state distinguishes `active`, `revoked`, `issuer_suspended`, `consent_withdrawn`, and `expired` where applicable. `active` is never a statement about factual truth. Current state is a derived view; `disputed` is not equivalent to `revoked`. Revocation must be signed/authorized by the issuer or a narrowly specified authority; subject rights to dispute or hide a personal presentation must not silently rewrite the issuer's historical assertion. A "certified receipt" must be returned only when proof material is actually available and verifiable.

### Phase-2 registration and verification invariants

**Issuer authorization:** Production registry signers are administrator-approved Principal identities with an immutable administrator-approved schema namespace; there is no public self-registration. Only the administrator can allocate issuer quotas, suspend an issuer, or nominate a successor. Namespace approval is not automatically legal or trademark verification. The cryptographically verified issuer is the Candid caller, not a display name. A Claim must set `issuer_id` to exactly `Principal.toText(caller)` in the initial principal-only profile; any display/organization name requires an independently certified registry binding and external vetting.

**Subject authorization:** Before the first claim submission, an administrator-approved issuer initiates a quota-limited consent request for one exact canonical claim hash, subject commitment, holder Principal and expiration; only that holder can approve the same tuple from their authenticated Principal. The issuer cannot submit until approval is recorded. A holder cannot exhaust global consent capacity by unilaterally generating approvals without a request. Withdrawal becomes permanently invalid for that digest; issuing a corrected claim requires a new content hash and event ID. Receipt-based user consent is an *authorization record*, not automatically proof the JSON `subject` refers to that person. Until a bilateral subject identity proof is implemented, UI must label subject identity `unverified`.

**Privacy:** The source ID is a 128/256-bit unpredictable lowercase hex identifier, never a job description, name, phone number or email. The holder's real Principal and raw evidence must not be published in a public certified leaf. A hash without an unpredictable nonce does not protect low-entropy information.

**Schema:** Certified proof status alone does not validate JSON Schema. A claim's envelope must validate against the immutable envelope schema and its `claim_data` must validate against issuer-registered, immutably content-addressed domain schema. Until both schema digest and schema body are available to the independent verifier, mark schema compliance `not verified`.

**Freshness:** A certificate proves status at certificate time, not globally real-time state. Avoid wording `current active` without a freshness window, and recheck immediately before high-risk transfers or access grants.

## 3. Example (illustrative, NOT a valid signed proof)

```json
{
  "protocol": "oneblock.claim",
  "version": "1.0",
  "issuer_id": "icevent",
  "subject": {
    "namespace": "oneblock:profile",
    "id": "example-user",
    "kind": "person"
  },
  "predicate": "icevent:appointment.completed",
  "object": {
    "namespace": "icevent:appointment",
    "id": "appointment-example-123",
    "kind": "event"
  },
  "schema_id": "urn:oneblock:schema:icevent.appointment.completed:1.0.0",
  "claim_data": {
    "outcome": "completed",
    "service_category": "landscaping.hedge_trimming"
  },
  "evidence": [{
    "evidence_id": "receipt-123",
    "content_sha256": "<64-hex-of-actual-evidence-bytes>",
    "availability": "authorized"
  }],
  "event_at": "2026-11-12T18:00:00Z",
  "issued_at": "2026-11-12T18:01:00Z",
  "source_event_id": "appointment-example-123:completed:v1",
  "visibility": "restricted",
  "consent_ref": "consent-example-123"
}
```

For a sensitive finance claim, replace personal IDs and full values with consent-scoped pseudonyms and salted commitments; preserve source financial ledger at Defunds. Do not imply on-chain consensus proves off-chain service completion.

## 4. Three distinguishable proof properties

| Dimension | Question | Verification |
|---|---|---|
| Authorship / authority | Who issued it and could they issue this schema for that subject? | registered issuer and key, verified caller/signature, subject-link consent |
| Integrity / inclusion / state | Did the claim bytes change, did ICP commit it, is it currently valid? | JCS/hash, certified tree witness + IC certificate, authoritative status feed |
| Real-world truth | Did the claimed action actually happen? | independently sourced corroboration (receipts, ledger tx, witnesses, evidence inspections), domain-specific policy |

API results must expose **separate** verification checks, not a blanket `verified: true`. E.g. `signature_valid`, `issuer_authorized`, `schema_valid`, `subject_link_valid`, `certified_inclusion_valid`, `current_status`, `evidence_available`, `corroboration_policy`. `claim_data` may be unproven even if first two dimensions succeed.

## 5. First-class identity and consent

- Support many principals/domains/app identities per OneBlock profile, including migration and key rotation. Link by **proof of control for both endpoints** or a documented identity-alias issuance/consent protocol; never infer equivalence from an unverified `external_user_id`.
- Store binding `subject`, `app_local_subject`, `issuer`, `scopes`, `consent_method`, `created_at`, `expires_at`, `revoked_at`, `profile_lifecycle_id`.
- Consent has separate scopes for **ingestion**, **public publication**, **sharing with a specific verifier** and **cross-platform correlation**.
- A claim about an organisation or an account may be recorded without exposing identity information of its members.
- Revoked consent blocks further disclosure; it does not guarantee erasure of bytes already published on a blockchain. Therefore never publish sensitive plaintext.
- On proof of holder consent, support short-lived challenge/response and replay rejection. No hidden auto-linking between apps.

## 6. Proposed Candid API (names are design, not implemented)

```candid
type Result = variant { ok: text; err: text };
service : {
  registerIssuer: (blob) -> (Result);
  rotateIssuerKey: (blob) -> (Result);
  registerSchema: (blob) -> (Result);
  requestSubjectLinkChallenge: (blob) -> (Result);
  confirmSubjectLink: (blob) -> (Result);
  revokeSubjectLink: (text) -> (Result);
  submitClaim: (blob) -> (Result);          // authenticated update, idempotent
  submitClaimBatch: (vec blob) -> (vec Result);
  updateClaimStatus: (blob) -> (Result);    // authorized, append-only
  getClaim: (text) -> (opt blob) query;     // subject to visibility
  listClaims: (blob) -> (blob) query;       // paged + ACL
  getCertifiedReceipt: (text) -> (opt blob) query;
  getClaimStatus: (text) -> (opt blob) query;
  getSchema: (text) -> (opt blob) query;
  getIssuer: (text) -> (opt blob) query;
}
```

`blob` placeholders are intentional to avoid claiming a deployable DID before Motoko types, atomicity, pagination and proof codecs are fixed. Implement typed Candid records in the next stage. A browser SDK should validate certified results *locally*. Do not mistake `getClaim` over query as certified unless its response includes and passes verification.

HTTP façade (for non-ICP integrations): `POST /v1/claims`, `POST /v1/claims/batch`, `POST /v1/claims/{id}/status`, `GET /v1/claims/{id}`, `GET /v1/claims/{id}/proof`, `POST /v1/verify`, `GET /v1/schemas/{id}`, `GET /v1/issuers/{id}`. Authentication is explicit; gateways rate-limit, forward and verify, but must never silently assert an external issuer's claims under their own principal.

Minimal issuer SDK: `registerSchema`, `createClaim`, `signOrCallAsIssuer`, `submitClaim`, `pollCertifiedReceipt`, `revokeClaim`. Minimal verifier SDK: `verifyClaimOffline` (given all certificate/proof/status inputs), `verifyClaimLive`, `explainVerification`. All negative checks fail closed.

## 7. Domain profile examples (schema adapters, not core hardcoding)

| Issuer | Suggested predicates | Main evidence | Privacy |
|---|---|---|---|
| ICEvent | `icevent:appointment.completed`, `icevent:contract.signed`, `icevent:ticket.valid` | source event/canister, participants' signatures, contract digest | participant consent, private contract |
| Hortsun | `hortsun:service.completed`, `hortsun:invoice.paid` | completion record, invoice digest, customer acknowledgment | keep customer identity and amounts private |
| Vansday | `vansday:activity.attended`, `vansday:community.contributed` | attendance check-in, organizer/co-signed receipt | avoid exposing location/history by default |
| Defunds | `defunds:loan.opened`, `defunds:repayment.recorded`, `defunds:asset.balance.attested` | ledger tx/canister event, signed book state hash | do not expose account balances, counterparties, amounts without consent |
| Other third party | `provider-name:event.type` | schema + signed attestation + evidence | scoped integration, revocation, verification policy |

For balances and positions, an attestation must include a clear **as-of timestamp**, asset identifier, network, custodian/wallet reference **pseudonym**, source snapshot commitment, and freshness period; it is not a perpetual ownership proof. For on-chain transactions, verification may check actual chain inclusion/finality, not merely accept a supplied transaction hash.

## 8. Integration with current repository

Existing `PROTOCOL_V1.md` is the activity-chain vision; this proposal specifies the reusable proofs layer for **any entity**, including non-human subjects. Preserve `Profile`, `Block`, `ActivityRecord`, `ProfileClaim`, `Factor`, `OipProvider` APIs. Add a versioned proof registry (prefer a new `proof_registry` canister to isolate certified state and upgrade risk) and build projections to old Profile/LifeBlocks.

### Confirmed gaps in current `main.mo` (checked against 2026-11-12 main)

1. `submitActivityRecord` computes `hash` from `recordId # profile_id # app_id # event_timestamp`. **Payload, amount/currency, evidence and attestation are not committed**. Existing hash cannot prove full record integrity.
2. `submitProviderFactor` for `#signed_payload` only checks `input.signed_payload != null`, then inserts a `verified = true` factor. **No signature cryptographic validation is shown in that code path**. Production proof APIs MUST reject unverified signatures.
3. `connectApp` accepts `externalUserId` supplied by the user; that alone is not proof that the external account is controlled by them. Add external proof-of-control and scoped consent without breaking existing links.
4. `getActivityRecord` and `getProfileClaim` are plain query APIs; add certified witness material for third-party-verifiable answers.
5. `ActivityRecord.amount: float64` is unsuitable for authoritative finance commitments; use decimal strings/integers in the new protocol, without changing legacy DID in-place.

### Safe migration

- Phase A: documentation, schemas, canonicalization/test vectors, security review, one ICP test issuer.
- Phase B: new proof canister + immutable submission/status + signature/authority/consent checks + certified digest/status query, with upgrade and rollback tests.
- Phase C: ICEvent appointment-completed end-to-end (source -> claim -> certified receipt -> independent verifier -> revocation); Hortsun and Vansday adapters.
- Phase D: Defunds finance adapters, selective disclosure, VC export and permissioned evidence retrieval.
- Phase E: external issuer SDK, paid API quotas if needed, independent audits.

Never backfill legacy records as "cryptographically verified": mark as `legacy_imported` until re-attested from its source with independently verifiable evidence.

## 9. Acceptance and adversarial test matrix

- [ ] A direct canister principal can submit only for its registered issuer and allowed schema.
- [ ] External signature altered, wrong key, wrong issuer, wrong audience, expired nonce, replayed nonce all fail.
- [ ] Altering **any committed field** (including payload, amount or evidence hash) changes claim digest or fails verification; independent JS/Motoko/other-language vectors match.
- [ ] Exact same `(issuer, source_event_id, digest)` returns original receipt; same id with different digest rejects.
- [ ] Wrong schema, unknown/deprecated schema, wrong holder link or revoked consent all fail per policy.
- [ ] Cross-app identity confusion and re-used profile IDs fail; lifecycle rebind requires fresh consent.
- [ ] A tampered Merkle witness or fake IC certificate fails offline client verification.
- [ ] Revoked claim is rejected by "currently valid" verifier while immutable historical receipt remains inspectable.
- [ ] Unlisted/restricted claims do not leak through query/list/index/graph/search endpoints; no private plaintext in certified tree.
- [ ] Upgrades preserve claim IDs, issuer keys, schema hashes, status sequence and certified state; rollback cannot silently accept stale status.
- [ ] Two independent issuers may attest contradictory facts; OneBlock preserves provenance without declaring an absolute truth or fabricating resolution.
- [ ] Production CI includes property-based fuzzing and adversarial cases above; demo/placeholder signatures can never yield `verified`.

## 10. Architecture decision points

1. **Default to small public commitments and private source evidence**.
2. **Separate proof validity from trust and truth**: cryptography cannot certify a fraudulent real-world statement.
3. **No breaking legacy DID migration before phase-B E2E passes**.
4. **Direct ICP canister calls are the preferred first-party integration**; HTTPS + cryptographic signature is for off-chain third parties.
5. **Issuer's history** can be append-only; personal chronology is a **derived projection**, not a single contended chain requiring all issuers to write one "previous" pointer.
6. A registry certificate is only meaningful if the client verifies it; API names must not imply certification without actual cryptographic proof.
