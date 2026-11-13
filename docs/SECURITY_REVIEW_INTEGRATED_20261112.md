# OneBlock security fixes — second static review and integration gates

**Reviewed snapshot:** `1c7317c9a14fc317874ed13b7c23e8dbb25e2436` (all CI checks below ran against this code commit).

**Scope:** #23–#31 assembled without merging to `main` in integration-only Draft PR #32.

**Outcome:** No new *demonstrated* P0 cryptographic bypass in the inspected issuer/consent/claim-verification code. Former P0 problems have concrete code mitigations and green local tests. **NOT production-approved.** Important trust-model, identity, privacy, scalability and production E2E gates remain open.

## Verified CI evidence (same source snapshot)

- [Backend CI #43370112077](https://github.com/ICEvent/OneBlock/actions/runs/43370112077): success; Motoko Profile compilation and legacy-OIP fail-closed assertions.
- [Frontend CI #43370112081](https://github.com/ICEvent/OneBlock/actions/runs/43370112081): success; `npm ci`, `npm audit --audit-level=moderate`, strict JSON/schema negatives, TypeScript, Vite 8 production bundle, root-key/environment guard.
- [Verify evidence MVP #43370112096](https://github.com/ICEvent/OneBlock/actions/runs/43370112096): success; SHA-256 and basic claim-inspector tests.
- [Proof Registry local ICP E2E #43370112102](https://github.com/ICEvent/OneBlock/actions/runs/43370112102): success; local DFX 0.30.1 deployment, issuer authorization/quotas, holder approvals and withdrawal, namespace overlap, three-party issuer rotation, certified claim+schema witnesses, tampering rejection, revocation/issuer suspension and local upgrade.

**Important test scope:** Local DFX and static source tests; these are not independent security audits or a real browser-to-prod-issuer E2E.

The two copies of `schemas/ovdp/claim-body-v1.schema.json` (contract and browser) were manually checked **byte-identical**.

## Remediation review

| Original finding | Implementation | Assessment |
|---|---|---|
| No authenticated issuer–organization binding | Admin-approved issuer Principal, immutable assigned Schema namespace; UI enforces `claim.issuer_id` == `issuerPrincipal` | Principal identity binding implemented. Legal/organizational identity vetting **not** implemented |
| Permissionless global storage exhaustion | Administrator issuer admission; per-issuer Schema, Claim and consent request quotas; opaque event ID input constraints | Prototype DoS exposure reduced. Permanent quotas and arrays **not production scale** |
| Self-asserted verified factors drive legacy OIP scores | Force old factors unverified; quarantine score model; deny *all* legacy score-policy evaluation (even zero thresholds) | Mitigated; deliberate breaking change for old OIP policies |
| Signed-payload presence treated as signature verification | Reject legacy `#signed_payload` policy until real signature validation | Mitigated |
| No holder authorization | Issuer initiates digest-scoped request to holder Principal; named holder approves; withdrawn digest terminally invalidated; historic post-hoc authorization barred | Authenticated consent to digest implemented; **not** bilateral proof of JSON subject's identity |
| Revoked state untrusted / stale certification | Current claim status and schema hash in ICP certified Merkle tree, 60-second certificate drift cap, revocation/withdraw/suspension reflected in leaf; independent BLS/witness verification | Mitigated for certification snapshot; immediate finality **not** guaranteed |
| Claim ID versus registry ID / Schema mismatch | Explicit content `sha256:` and separate `issuerPrincipal/opaqueEventId`; registered issuer-scoped certified Domain Schema hash; JSON 2020-12 envelope + data validation | Mitigated for tested claim format; protocol is still evolving |
| Issuer credential rotation missing | Old issuer + admin + new Principal three-party rotation; retire old origin permanently; no reattribution of historic claims | Mitigated for cooperative rotation; lost-key recovery still requires governance |
| Privacy leakage / root-key and env hazards | Public claim projection redacts subject/evidence; strict reason codes; no implicit remote `fetchRootKey()`; allowlist browser build environment; harden DFX generated actors | Materially reduced; privacy/legal audit still needed |
| CI and package vulnerabilities | Dedicated cross-PR combined CI, verification SDK tests, Vite 8, patched lockfile, `npm audit` zero at time of check | Verified locally/CI; no browser Playwright or production app E2E |

## Remaining **release blockers**

1. **Legal issuer vetting / trusted business identity:** a principal and admin-approved namespace establish governance authorization, not independently verified company ownership. Build a reviewed issuer directory with verifiable controller/domain proof, dispute mechanism, expiry, audit history and explicit identity assurance level. Don't render 'verified business' until complete.
2. **Subject identity and privacy:** the holder signs approval for the exact Claim hash, but the registry does not prove that arbitrary `subject.id` in JSON belongs to that holder. If downstream applications need this assertion, require independently verifiable bilateral identity binding, scoped consent, access/redaction rules and deletion/legal review. Public metadata (schema ID, timestamps, event IDs, hashes) can still permit linkage.
3. **Claim-to-real-world evidence:** issuer-submitted SHA-256 is not recomputed on-chain from full bytes; the browser recomputes the supplied Claim and checks commitment but cannot establish the event actually happened or evidence authenticity. Separate corroboration, disputes and source verification are needed before describing facts as true.
4. **Storage/economic scaling:** arrays and fixed caps are for staging only. Request/approval arrays can fill permanently and O(n) logic has bounded but nontrivial cost. Indexed stable stores, pagination, quota reclamation, economic metering and stress tests are required before public traffic.
5. **Migration and rollback:** tests cover re-upgrading the same hardened canister, not migrating old #25/#26 stable state into the class constructor or rollback to old WASM. Review stable type compatibility, record conversion, consentless-record invalidation, recovery and controller permissions before upgrading existing deployments.
6. **Currentness under high stakes:** a recent certified snapshot can be replayed until its freshness limit; financial/contract/permission gating must obtain fresh status via a trusted update path and a precisely specified time bound, not rely on a UI 'Active' badge.
7. **Real third-party / browser E2E:** build an ICEvent issuer canister integration with a scoped holder approval UI, actual canonical full Claim bytes, real certified proof, independent browser verification, wrong subject/key/schema attack cases and revoke/rotate after issuance. A Playwright test that exercises the deployed local/controlled environment remains required.
8. **Protocol and dependency governance:** independently audit JSON Schema feature restrictions, implement cross-language RFC 8785 vectors, verify third-party package provenance, capture security review approvals, and define issuer key/controller emergency recovery. Candid producer/consumer interfaces still need a shared generated SDK and schema versioning beyond source-level CI.

## Safe merge/release posture

All component PRs and aggregate PR #32 remain **Draft**. Do not cherry-pick the aggregate blindly: review and sequence #23/#30 protocol, #24 workbench, #25/#26 proof infrastructure, #28 security hardening, #29 legacy OIP safeguards, and #27/#31 frontend (deduplicating shared SDK code). The earlier Backend CI missing-Mops issue was fixed **in aggregate** and must survive the final merge.

This review is static plus existing CI evidence, not proof of formal correctness or production readiness. No mainnet canister write, deployment, data migration or merge was performed as part of this review.
