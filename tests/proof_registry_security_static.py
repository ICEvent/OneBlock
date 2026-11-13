#!/usr/bin/env python3
"""Source-level regression guards, not a replacement for E2E or security audit."""
from pathlib import Path

registry = Path("src/proof_registry/main.mo").read_text()
sdk = Path("sdk/verifyCertifiedClaim.mjs").read_text()
source = Path("src/oneblock_backend/main.mo")
assert "persistent actor class ProofRegistry(initialAdmin : Principal)" in registry
assert 'administrator approval required' in registry
assert "if (not approved(caller))" in registry
assert "setIssuerNamespace" in registry
assert "schema namespace not approved" in registry
assert "requestFor(issuer, caller, claimHash, subjectHash)" in registry
assert "issuer request quota reached" in registry
assert "PublicAttestation" in registry
assert "validReasonCode" in registry
assert "getCertifiedSchema" in registry
assert "approvalFor(caller, input.claim_sha256, input.subject_commitment)" in registry
assert "isWithdrawn(caller, input.claim_sha256)" in registry
assert "certifyAllForIssuer(issuer);" in registry
assert "issuer_suspended" in registry and "consent_withdrawn" in registry
assert "setCertifiedData()" in registry and "getCertifiedClaim" in registry
assert "verifyCertification" in sdk
assert "lookup_path" in sdk
assert "trustedRootKey" in sdk
if source.exists():
    backend = source.read_text()
    if "public shared ({ caller }) func submitProviderFactor" in backend:
        print("NOTE: legacy backend main.mo is reviewed separately in PR for legacy proof semantics.")
print("PASS: governance, consent and certified-status static invariants")
