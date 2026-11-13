import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateSourceClaim } from "../sdk/validateSourceClaim.mjs";
import { computeClaimDigest, computeSchemaDigest } from "../sdk/claimDigest.mjs";

const envelope = JSON.parse(readFileSync(
  new URL("../src/oneblock_frontend/src/schemas/claim-body-v1.schema.json", import.meta.url), "utf8",
));
const issuer = "aaaaa-aa";
const eventId = "a1".repeat(16);
const recordId = issuer + "/" + eventId;
const schema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "hortsun.service.v1",
  type: "object",
  additionalProperties: false,
  required: ["completed"],
  properties: { completed: { type: "boolean", const: true } },
};
const claim = {
  protocol: "oneblock.claim", version: "1.0", issuer_id: issuer,
  subject: { namespace: "org", id: "example", kind: "organization" },
  predicate: "hortsun:service.completed", schema_id: schema.$id,
  claim_data: { completed: true },
  evidence: [{ evidence_id: "receipt", content_sha256: "11".repeat(32), availability: "authorized" }],
  event_at: "2025-01-01T00:00:00Z",
  issued_at: "2025-01-01T00:01:00Z",
  source_event_id: eventId, visibility: "restricted",
};
const testCall = (v = claim, domain = schema, id = recordId) =>
  validateSourceClaim(JSON.stringify(v), JSON.stringify(domain), id, envelope);

test("valid strict issuer-scoped claim and canonical hashes", async () => {
  const result = testCall();
  assert.equal(result.issuerPrincipal, issuer);
  assert.equal(result.recordId, recordId);
  assert.match(await computeSchemaDigest(result.domainSchema), /^[0-9a-f]{64}$/);
  assert.match(await computeClaimDigest(result.claim), /^[0-9a-f]{64}$/);
});

test("issuer Principal, event ID and schema ID must all agree", () => {
  assert.throws(() => testCall({ ...claim, issuer_id: "fake-company" }), /issuer_id/);
  assert.throws(() => testCall({ ...claim, source_event_id: "b2".repeat(16) }), /source_event_id/);
  assert.throws(() => testCall(claim, schema, issuer + "/invoice-abc"), /十六进制/);
  assert.throws(() => testCall(claim, { ...schema, $id: "fake.schema" }), /schema_id/);
});

test("domain data and envelope must both pass 2020-12 validation", () => {
  assert.throws(() => testCall({ ...claim, claim_data: { completed: false } }), /Domain Schema/);
  assert.throws(() => testCall({ ...claim, claim_data: { completed: true, private: 1 } }), /Domain Schema/);
  assert.throws(() => testCall({ ...claim, visibility: "unknown" }), /OVDP/);
  assert.throws(() => testCall({ ...claim, evidence: [{ evidence_id: "a", content_sha256: "no" }] }), /OVDP/);
  const many = Array.from({ length: 9 }, (_, i) => ({ evidence_id: "e" + i, content_sha256: "11".repeat(32), availability: "offline" }));
  assert.throws(() => testCall({ ...claim, evidence: many }), /OVDP/);
});

test("person-linked claim needs a consent reference and timestamps must be valid", () => {
  assert.throws(() => testCall({ ...claim, subject: { ...claim.subject, kind: "person" } }), /OVDP/);
  assert.doesNotThrow(() => testCall({ ...claim, subject: { ...claim.subject, kind: "person" }, consent_ref: "private-consent-reference" }));
  assert.throws(() => testCall({ ...claim, valid_until: "2020-01-01T00:00:00Z" }), /有效期/);
  assert.throws(() => testCall({ ...claim, issued_at: "2099-01-01T00:00:00Z" }), /签发时间/);
});

test("duplicate raw keys, external schema refs and malicious schema IDs are rejected", () => {
  const raw = JSON.stringify(claim).replace('"issuer_id":"aaaaa-aa"', '"issuer_id":"aaaaa-aa","issuer_id":"attacker"');
  assert.throws(() => validateSourceClaim(raw, JSON.stringify(schema), recordId, envelope), /Duplicate JSON/);
  assert.throws(() => testCall(claim, { ...schema, $ref: "https://attacker.example/x" }), /Remote or non-local/);
  assert.throws(() => testCall(claim, { ...schema, properties: { completed: { type: "string", pattern: "(a+)+$" } } }), /regular expressions/);
  assert.throws(() => testCall(claim, { ...schema, patternProperties: { ".*": { type: "number" } } }), /regular expressions/);
  assert.throws(() => testCall(claim, { ...schema, $dynamicRef: "#/$defs/loop" }), /regular expressions/);
  assert.throws(() => testCall(claim, { ...schema, $schema: "http://json-schema.org/draft-07/schema#" }), /2020-12/);
});
