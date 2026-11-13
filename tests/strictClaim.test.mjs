import test from "node:test";
import assert from "node:assert/strict";
import { parseStrictClaimJson } from "../sdk/strictJson.mjs";
import { canonicalizeJson, computeClaimDigest } from "../sdk/claimDigest.mjs";

const claim = {
  protocol: "oneblock.claim", version: "1.0", issuer_id: "hortsun",
  subject: { namespace: "oneblock:profile", id: "anonymous", kind: "person" },
  predicate: "hortsun:service.completed", schema_id: "hortsun.v1",
  source_event_id: "job-id", claim_data: { amount_minor: "1000", status: "completed" },
  evidence: [{ evidence_id: "receipt1", content_sha256: "aa".repeat(32) }],
  issued_at: "2026-11-12T00:00:00Z", event_at: "2026-11-12T00:00:00Z",
  visibility: "restricted",
};

test("strict JSON preserves safe claims and deterministic hash", async () => {
  const raw = JSON.stringify(claim);
  const strict = parseStrictClaimJson(raw);
  assert.deepEqual(strict, claim);
  assert.equal(await computeClaimDigest(strict), await computeClaimDigest(parseStrictClaimJson(JSON.stringify(Object.fromEntries(Object.entries(claim).reverse())))));
});

test("top-level and nested duplicate JSON keys fail closed", () => {
  assert.throws(() => parseStrictClaimJson('{"a":1,"a":2}'), /Duplicate JSON/);
  assert.throws(() => parseStrictClaimJson('{"a":1,"\\u0061":2}'), /Duplicate JSON/);
  assert.throws(() => parseStrictClaimJson('{"x":{"y":"first","y":"second"}}'), /Duplicate JSON/);
  assert.throws(() => parseStrictClaimJson('{"arr":[{"x":1},{"x":2,"x":3}]}'), /Duplicate JSON/);
});

test("reject bad JSON, deep nesting and unsafe inputs", () => {
  assert.throws(() => parseStrictClaimJson('{"a":'), SyntaxError);
  assert.throws(() => parseStrictClaimJson("[]"), /JSON object/);
  assert.throws(() => parseStrictClaimJson('{"a":' + '['.repeat(65) + '1' + ']'.repeat(65) + '}'), /nesting/);
  assert.throws(() => parseStrictClaimJson('{"a":"' + "x".repeat(270000) + '"}'), /256 KiB/);
});

test("signed claims change hash when any field or evidence changes", async () => {
  const base = await computeClaimDigest(parseStrictClaimJson(JSON.stringify(claim)));
  const changed = structuredClone(claim);
  changed.evidence[0].content_sha256 = "bb".repeat(32);
  assert.notEqual(await computeClaimDigest(parseStrictClaimJson(JSON.stringify(changed))), base);
  const swapped = structuredClone(claim);
  swapped.source_event_id = "different-job";
  assert.notEqual(await computeClaimDigest(parseStrictClaimJson(JSON.stringify(swapped))), base);
});

test("JCS rejects unsafe amount-like numbers; financial amounts are decimal strings", () => {
  assert.throws(() => canonicalizeJson({ amount_minor: 9007199254740993 }), /unsafe/);
  assert.equal(canonicalizeJson({ amount_minor: "9007199254740993" }), '{"amount_minor":"9007199254740993"}');
});
