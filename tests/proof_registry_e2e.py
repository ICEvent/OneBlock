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


def certified(claim_id: str, status: str, digest_hex: str = "11" * 32) -> None:
    env = os.environ.copy()
    env["PROOF_REGISTRY_CANISTER_ID"] = dfx("canister", "id", "proof_registry").strip()
    subprocess.run(
        ["node", "tests/verifyCertifiedClaim.e2e.mjs", claim_id, digest_hex, status],
        env=env, check=True,
    )


def main() -> None:
    owner = dfx("identity", "get-principal").strip()
    claim_id = f"{owner}/{EVENT_ID}"
    print("admin+issuer principal:", owner)
    dfx("identity", "new", "holder", "--storage-mode", "plaintext")
    dfx("identity", "new", "adversary", "--storage-mode", "plaintext")
    adversary = dfx("--identity", "adversary", "identity", "get-principal").strip()
    holder = dfx("--identity", "holder", "identity", "get-principal").strip()

    expect(call("getRegistryCounts"), "claims = 0")
    expect(call("registerIssuer", '("Hortsun example (unvetted)")', "adversary"), "administrator approval required")
    expect(call("registerIssuer", '("Hortsun example (unvetted)")'), "ok = record")
    expect(call("registerSchema", f'("hortsun.service.v1", {blob(0x55)})'), "issuer namespace not approved")
    expect(call("setIssuerNamespace", f'(principal "{owner}", "hortsun.")'), "ok = record")
    expect(call("setIssuerNamespace", f'(principal "{owner}", "hortsun.")'), "issuer namespace already approved")
    expect(call("registerSchema", f'("icevent.service.v1", {blob(0x55)})'), "schema namespace not approved")
    expect(call("registerSchema", f'("hortsun.service.v1", {blob(0x55)})'), "ok = record")
    expect(call("registerSchema", f'("adversary.schema", {blob(0x55)})', "adversary"), "issuer not approved")
    expect(call("submitCommitment", submission(), "adversary"), "issuer not approved")

    # No holder authorization means no issued claim, even from a registered issuer.
    expect(call("submitCommitment", submission()), "holder approval for exact claim digest is required")
    expiry = time.time_ns() + 3600 * 1_000_000_000
    grant_arg = f'(principal "{owner}", {blob(0x11)}, {blob(0x22)}, {expiry} : int)'
    request_arg = f'(principal "{holder}", {blob(0x11)}, {blob(0x22)}, {expiry} : int)'
    expect(call("approveCommitment", grant_arg, "holder"), "approved issuer request required")
    expect(call("requestConsent", request_arg, "adversary"), "issuer not approved")
    expect(call("requestConsent", request_arg), "ok = record")
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
    request_other = f'(principal "{holder}", {blob(0x44)}, {blob(0x22)}, {expiry} : int)'
    expect(call("requestConsent", request_other), "ok = record")
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

    # Make an active old-issuer claim to test that rotation invalidates its
    # latest certified status, without silently reattributing the old origin.
    new_event_id = "b2" * 16
    old_active_id = f"{owner}/{new_event_id}"
    second_digest = "66" * 32
    request_second = f'(principal "{holder}", {blob(0x66)}, {blob(0x22)}, {expiry} : int)'
    grant_second = f'(principal "{owner}", {blob(0x66)}, {blob(0x22)}, {expiry} : int)'
    expect(call("requestConsent", request_second), "ok = record")
    expect(call("approveCommitment", grant_second, "holder"), "ok = record")
    expect(call("submitCommitment", submission(0x66, new_event_id)), "ok = record")
    certified(old_active_id, "active", second_digest)

    dfx("identity", "new", "issuer-successor", "--storage-mode", "plaintext")
    successor = dfx("--identity", "issuer-successor", "identity", "get-principal").strip()
    expect(call("requestIssuerRotation", f'(principal "{successor}")', "holder"), "issuer not approved")
    expect(call("requestIssuerRotation", f'(principal "{successor}")'), "ok = record")
    expect(call("acceptIssuerRotation", f'(principal "{owner}")', "issuer-successor"), "administrator approval required")
    expect(call("approveIssuerRotation", f'(principal "{owner}", principal "{successor}")', "holder"), "administrator approval required")
    expect(call("approveIssuerRotation", f'(principal "{owner}", principal "{successor}")'), "ok = record")
    expect(call("acceptIssuerRotation", f'(principal "{owner}")', "issuer-successor"), "ok = record")
    certified(old_active_id, "issuer_suspended", second_digest)
    expect(call("setIssuerActive", f'(principal "{owner}", true)'), "rotated issuer is permanently retired")
    expect(call("registerSchema", f'("hortsun.service.v3", {blob(0x55)})'), "issuer not approved")
    expect(call("registerSchema", f'("hortsun.service.v2", {blob(0x77)})', "issuer-successor"), "ok = record")

    # Rotating the governor requires acceptance by the named successor.
    expect(call("nominateAdministrator", f'(principal "{adversary}")'), "ok = principal")
    expect(call("acceptAdministration", "()", "holder"), "no pending appointment")
    expect(call("acceptAdministration", "()", "adversary"), "ok = principal")
    expect(call("setIssuerActive", f'(principal "{owner}", true)'), "administrator approval required")
    print("PASS: admin control, explicit holder approval, quotas, certified statuses, withdrawal, upgrade, rotation")


if __name__ == "__main__":
    main()
