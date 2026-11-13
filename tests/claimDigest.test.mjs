import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  canonicalizeJson, computeClaimDigest, hexToBytes, bytesToHex,
} from "../sdk/claimDigest.mjs";
import { unpackClaimLeaf } from "../sdk/verifyCertifiedClaim.mjs";

test("JCS-like canonical JSON follows ECMAScript number/string and UTF-16 key sorting", () => {
  const input = { z: 0.002, B: -0, a: [true, null, { b: "hi", a: "世界" }], A: 1e-30 };
  assert.equal(
    canonicalizeJson(input),
    '{"A":1e-30,"B":0,"a":[true,null,{"a":"世界","b":"hi"}],"z":0.002}',
  );
  assert.equal(canonicalizeJson({ "\u20ac": 1, "\r": 2 }), '{"\\r":2,"€":1}');
});

test("unsafe/non-JSON data cannot be committed", () => {
  assert.throws(() => canonicalizeJson({ n: Number.MAX_SAFE_INTEGER + 1 }), /unsafe/);
  assert.throws(() => canonicalizeJson({ n: Number.POSITIVE_INFINITY }), /invalid/);
  assert.throws(() => canonicalizeJson({ x: undefined }), /strict JSON/);
  assert.throws(() => canonicalizeJson({ s: "\ud800" }), /surrogate/);
  assert.throws(() => canonicalizeJson(new Date()), /plain JSON/);
});

test("full canonical claim is content addressed with a domain separator", async () => {
  const claim = {
    protocol: "oneblock.claim",
    version: "1.0",
    issuer_id: "hortsun",
    schema_id: "hortsun.service.completed.v1",
    subject: { kind: "person", id: "pseudonym1", namespace: "oneblock:profile" },
    predicate: "hortsun:service.completed",
    source_event_id: "job-test-1",
    claim_data: { outcome: "completed", amount_minor: "1000" },
    evidence: [{ content_sha256: "11".repeat(32), evidence_id: "receipt1" }],
    event_at: "2026-11-12T00:00:00Z",
    issued_at: "2026-11-12T00:01:00Z",
    visibility: "restricted",
  };
  const digest1 = await computeClaimDigest(claim);
  const reordered = Object.fromEntries(Object.entries(claim).reverse());
  assert.equal(await computeClaimDigest(reordered), digest1);
  const independentDigest = createHash("sha256")
    .update("oneblock:claim:v1\n")
    .update(canonicalizeJson(claim), "utf8").digest("hex");
  assert.equal(digest1, independentDigest);
  assert.notEqual(await computeClaimDigest({ ...claim, claim_data: { ...claim.claim_data, outcome: "failed" } }), digest1);
  assert.notEqual(await computeClaimDigest({ ...claim, issuer_id: "other" }), digest1);
  assert.deepEqual(hexToBytes(digest1), Uint8Array.from(Buffer.from(digest1, "hex")));
  assert.equal(bytesToHex(hexToBytes(digest1)), digest1);
});

test("certified leaf status is encoded and rejected if invalid", () => {
  const digest = hexToBytes("11".repeat(32));
  const active = Uint8Array.from([1, ...digest, 0]);
  const revoked = Uint8Array.from([1, ...digest, 1]);
  assert.deepEqual(unpackClaimLeaf(active), { sha256: "11".repeat(32), status: "active" });
  assert.deepEqual(unpackClaimLeaf(revoked), { sha256: "11".repeat(32), status: "revoked" });
  assert.throws(() => unpackClaimLeaf(Uint8Array.from([1, ...digest])), /format/);
  assert.throws(() => unpackClaimLeaf(Uint8Array.from([1, ...digest, 99])), /unknown/);
});
