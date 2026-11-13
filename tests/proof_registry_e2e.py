#!/usr/bin/env python3
"""Local dfx E2E smoke test for the phase-1 registry, no mainnet/network writes."""
from __future__ import annotations

import subprocess
import os


def dfx(*args: str) -> str:
    proc = subprocess.run(("dfx", *args), capture_output=True, text=True)
    if proc.returncode:
        raise AssertionError(f"dfx {' '.join(args)} exited {proc.returncode}\n{proc.stdout}\n{proc.stderr}")
    return proc.stdout + proc.stderr


def call(method: str, args: str = "()", identity: str | None = None) -> str:
    prefix = ["--identity", identity] if identity else []
    return dfx(*prefix, "canister", "call", "proof_registry", method, args)


def verify_certified(claim_id: str, status: str) -> None:
    env = os.environ.copy()
    env["PROOF_REGISTRY_CANISTER_ID"] = dfx("canister", "id", "proof_registry").strip()
    subprocess.run([
        "node", "tests/verifyCertifiedClaim.e2e.mjs",
        claim_id, "11" * 32, status,
    ], env=env, check=True)


def expect(output: str, term: str) -> None:
    assert term in output, f"Expected {term!r} in:\n{output}"


def blob(byte: int) -> str:
    return 'blob "' + (f"\\{byte:02x}" * 32) + '"'


def submission(digest_byte: int = 0x11) -> str:
    return (
        "(record { "
        'source_event_id = "job-1024"; '
        'schema_id = "hortsun.service.v1"; '
        f"claim_sha256 = {blob(digest_byte)}; "
        f"subject_commitment = {blob(0x22)}; "
        f"evidence_sha256 = vec {{ {blob(0x33)} }}; "
        "event_at = 1794506400000000000 : int "
        "})"
    )


def main() -> None:
    owner = dfx("identity", "get-principal").strip()
    print("issuer principal:", owner)
    expect(call("getRegistryCounts"), "claims = 0")
    expect(call("registerIssuer", '("Hortsun example (unvetted)")'), "ok = record")
    expect(call("registerSchema", f'("hortsun.service.v1", {blob(0x55)})'), "ok = record")

    first = call("submitCommitment", submission())
    expect(first, "ok = record")
    expect(first, f"{owner}/job-1024")
    expect(call("submitCommitment", submission()), "ok = record")
    expect(call("getRegistryCounts"), "claims = 1")
    claim_id = f"{owner}/job-1024"
    certified_active = dfx("canister", "call", "--query", "proof_registry", "getCertifiedClaim", f'("{claim_id}")')
    expect(certified_active, "certificate = opt blob")
    expect(certified_active, "witness = blob")
    expect(certified_active, "value = opt blob")
    verify_certified(claim_id, "active")
    absent = dfx("canister", "call", "--query", "proof_registry", "getCertifiedClaim", '("not-found")')
    expect(absent, "value = null")
    expect(call("submitCommitment", submission(0x44)), "conflicting idempotency key")
    expect(call("submitCommitment", submission().replace(blob(0x11), 'blob "\\00"')), "claim hash must contain exactly 32 bytes")

    dfx("identity", "new", "adversary", "--storage-mode", "plaintext")
    expect(call("registerSchema", f'("hortsun.service.v1", {blob(0x55)})', "adversary"), "unregistered issuer")
    expect(call("submitCommitment", submission(), "adversary"), "unregistered issuer")
    claim_id = f"{owner}/job-1024"
    expect(call("revokeCommitment", f'("{claim_id}", "corrected")', "adversary"), "only the original issuer")

    expect(call("revokeCommitment", f'("{claim_id}", "corrected")'), "ok = record")
    expect(call("revokeCommitment", f'("{claim_id}", "corrected")'), "already revoked")
    state = call("getClaimState", f'("{claim_id}")')
    expect(state, "revoked")
    expect(state, "certified = false")
    expect(call("getRegistryCounts"), "status_events = 1")
    certified_revoked = dfx("canister", "call", "--query", "proof_registry", "getCertifiedClaim", f'("{claim_id}")')
    expect(certified_revoked, "certificate = opt blob")
    expect(certified_revoked, "witness = blob")
    assert certified_active != certified_revoked, "revocation must change certified witness/value"
    verify_certified(claim_id, "revoked")
    dfx("canister", "install", "proof_registry", "--mode", "upgrade")
    expect(call("getClaimState", f'("{claim_id}")'), "revoked")
    expect(call("getRegistryCounts"), "status_events = 1")
    certified_after_upgrade = dfx("canister", "call", "--query", "proof_registry", "getCertifiedClaim", f'("{claim_id}")')
    expect(certified_after_upgrade, "certificate = opt blob")
    expect(certified_after_upgrade, "witness = blob")
    verify_certified(claim_id, "revoked")
    print("PASS: authority, schema, commitment, idempotency, mutation prevention, revocation")


if __name__ == "__main__":
    main()
