import assert from "node:assert/strict";
import test from "node:test";
import { sha256Hex, compareSha256, inspectClaimJson } from "../src/oneblock_frontend/src/lib/verifyEvidence.ts";

const abcSha = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";

test("sha256 matches public known vector (UTF-8)", async () => {
  assert.equal(await sha256Hex("abc"), abcSha);
  assert.equal(await sha256Hex(new TextEncoder().encode("abc")), abcSha);
  assert.notEqual(await sha256Hex("abd"), abcSha);
});

test("SHA-256 comparisons fail closed", () => {
  assert.equal(compareSha256(abcSha, abcSha), "match");
  assert.equal(compareSha256(abcSha, `SHA256:${abcSha.toUpperCase()}`), "match");
  assert.equal(compareSha256(abcSha, "0".repeat(64)), "mismatch");
  assert.equal(compareSha256(abcSha, ""), "not-provided");
  assert.equal(compareSha256(abcSha, "xyz"), "invalid-reference");
});

test("no claim or invalid JSON cannot pass", () => {
  assert.equal(inspectClaimJson("").shapeReady, false);
  assert.equal(inspectClaimJson('{"x":').parsed, false);
  assert.equal(inspectClaimJson("[]").shapeReady, false);
});

test("valid-shape claim still needs independent verification", () => {
  const claim = {
    protocol: "oneblock.claim", version: "1.0", issuer_id: "hortsun",
    subject: { namespace: "oneblock:profile", id: "demo", kind: "person" },
    predicate: "hortsun:service.completed", schema_id: "hortsun.service.v1",
    claim_data: { status: "completed" },
    evidence: [{ evidence_id: "r-1", content_sha256: "0".repeat(64) }],
    event_at: "2026-11-12T18:00:00Z", issued_at: "2026-11-12T18:00:00Z",
    source_event_id: "job-123", visibility: "restricted",
  };
  const result = inspectClaimJson(JSON.stringify(claim));
  assert.equal(result.shapeReady, true);
  assert.equal(result.evidenceCount, 1);
  assert.ok(result.unanswered.length >= 3);
  assert.equal(inspectClaimJson(JSON.stringify({ ...claim, evidence: [] })).shapeReady, false);
  assert.equal(inspectClaimJson(JSON.stringify({ ...claim, issuer_id: "" })).shapeReady, false);
});
