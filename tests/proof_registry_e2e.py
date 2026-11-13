#!/usr/bin/env python3
"""Local-only adversarial E2E: authorization, quotas, certified status and upgrades."""
from __future__ import annotations

import os
import subprocess
import time

EVENT_ID = "a1" * 16


def dfx(*args: str) -> str:
    proc = subprocess.run(("dfx", *args), capture_output=True, text=True)
    if proc.returncode:
        raise AssertionError(f"dfx {' '.join(args)} exited {proc.returncode}\n{proc.stdout}\n{proc.stderr}")
    return proc.stdout + proc.stderr


def call(method: str, args: str = "()", identity: str | None = None) -> str:
    prefix = ["--identity", identity] if identity else []
    return dfx(*prefix, "canister", "call", "proof_registry", method, args)


def expect(output: str, term: str) -> None:
    assert term in output, f"Expected {term!r} in:\n{output}"


def blob(byte: int) -> str:
    return 'blob "' + (f"\\{byte:02x}" * 32) + '"'


def submission(digest_byte: int = 0x11, event_id: str = EVENT_ID) -> str:
    return (
        "(record { "
        f'source_event_id = "{event_id}"; '
        'schema_id = "hortsun.service.v1"; '
        f"claim_sha256 = {blob(digest_byte)}; "
        f"subject_commitment = {blob(0x22)}; "
        f"evidence_sha256 = vec {{ {blob(0x33)} }}; "
        "event_at = 1794506400000000000 : int "
        "})"
    )


def certified(claim_id: str, status: str) -> None:
    env = os.environ.copy()
    env["PROOF_REGISTRY_CANISTER_ID"] = dfx("canister", "id", "proof_registry").strip()
    subprocess.run(
        ["node", "tests/verifyCertifiedClaim.e2e.mjs", claim_id, "11" * 32, status],
        env=env, check=True,
    )


def main() -> None:
    owner = dfx("identity", "get-principal").strip()
    claim_id = f"{owner}/{EVENT_ID}"
    print("admin+issuer principal:", owner)
    dfx("identity", "new", "holder", "--storage-mode", "plaintext")
    dfx("identity", "new", "adversary", "--storage-mode", "plaintext")
    adversary = dfx("--identity", "adversary", "identity", "get-principal").strip()

    expect(call("getRegistryCounts"), "claims = 0")
    expect(call("registerIssuer", '("Hortsun example (unvetted)")', "adversary"), "administrator approval required")
    expect(call("registerIssuer", '("Hortsun example (unvetted)")'), "ok = record")
    expect(call("registerSchema", f'("hortsun.service.v1", {blob(0x55)})'), "ok = record")
    expect(call("registerSchema", f'("adversary.schema", {blob(0x55)})', "adversary"), "issuer not approved")
    expect(call("submitCommitment", submission(), "adversary"), "issuer not approved")

    # No holder authorization means no issued claim, even from a registered issuer.
    expect(call("submitCommitment", submission()), "holder approval for exact claim digest is required")
    expiry = time.time_ns() + 3600 * 1_000_000_000
    grant_arg = f'(principal "{owner}", {blob(0x11)}, {blob(0x22)}, {expiry} : int)'
    expect(call("approveCommitment", grant_arg, "holder"), "ok = record")
    expect(call("approveCommitment", grant_arg, "holder"), "already authorized")
    # This holder cannot impersonate issuer (and may not revoke another issuer's records).
    expect(call("setIssuerActive", f'(principal "{owner}", false)', "holder"), "administrator approval required")

    expect(call("submitCommitment", submission("bogus" if False else 0x11, "job-customer-name")), "source_event_id must be 32 or 64")
    expect(call("submitCommitment", submission().replace(blob(0x11), 'blob "\\00"')), "claim hash must contain exactly 32 bytes")
    first = call("submitCommitment", submission())
    expect(first, "ok = record")
    expect(first, claim_id)
    expect(call("submitCommitment", submission()), "ok = record")
    expect(call("getRegistryCounts"), "claims = 1")
    certified(claim_id, "active")

    # Valid approval for a *different* digest still cannot overwrite an event.
    grant_other = f'(principal "{owner}", {blob(0x44)}, {blob(0x22)}, {expiry} : int)'
    expect(call("approveCommitment", grant_other, "holder"), "ok = record")
    expect(call("submitCommitment", submission(0x44)), "conflicting idempotency key")

    # Suspend issuer: all existing active leaves must be certified as suspended.
    expect(call("setIssuerActive", f'(principal "{owner}", false)'), "ok = record")
    certified(claim_id, "issuer_suspended")
    expect(call("submitCommitment", submission()), "issuer not approved")
    expect(call("setIssuerActive", f'(principal "{owner}", true)'), "ok = record")
    certified(claim_id, "active")

    # Holder withdrawal is a terminal state; re-approval of the same digest is forbidden.
    withdraw_arg = f'(principal "{owner}", {blob(0x11)})'
    expect(call("withdrawConsent", withdraw_arg, "adversary"), "no authorization owned by caller")
    expect(call("withdrawConsent", withdraw_arg, "holder"), "ok = 1")
    certified(claim_id, "consent_withdrawn")
    expect(call("approveCommitment", grant_arg, "holder"), "withdrawn authorization cannot be reused")
    expect(call("submitCommitment", submission()), "holder withdrew consent")

    # Issuer revocation has priority over other invalidity conditions.
    expect(call("revokeCommitment", f'("{claim_id}", "corrected")', "adversary"), "only the original issuer")
    expect(call("revokeCommitment", f'("{claim_id}", "corrected")'), "ok = record")
    expect(call("revokeCommitment", f'("{claim_id}", "corrected")'), "already revoked")
    expect(call("getClaimState", f'("{claim_id}")'), "revoked")
    certified(claim_id, "revoked")

    dfx("canister", "install", "proof_registry", "--mode", "upgrade",
        "--argument", f'(principal "{owner}")')
    expect(call("getClaimState", f'("{claim_id}")'), "revoked")
    expect(call("getRegistryCounts"), "status_events = 1")
    certified(claim_id, "revoked")

    # Rotating the governor requires acceptance by the named successor.
    expect(call("nominateAdministrator", f'(principal "{adversary}")'), "ok = principal")
    expect(call("acceptAdministration", "()", "holder"), "no pending appointment")
    expect(call("acceptAdministration", "()", "adversary"), "ok = principal")
    expect(call("setIssuerActive", f'(principal "{owner}", true)'), "administrator approval required")
    print("PASS: admin control, explicit holder approval, quotas, certified statuses, withdrawal, upgrade, rotation")


if __name__ == "__main__":
    main()
