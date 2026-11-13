#!/usr/bin/env node
/**
 * Live local ICP certified query end-to-end test.
 *
 * Only fetches the root key from a CONTROLLED LOCAL REPLICA.
 * Never copy this trust bootstrap strategy to mainnet.
 *
 * args: <claimId> <expectedSha256Hex> <active|revoked>
 */
import assert from "node:assert/strict";
import { HttpAgent, Actor } from "@dfinity/agent";
import { IDL } from "@dfinity/candid";
import { Principal } from "@dfinity/principal";
import { verifyCertifiedSchema } from "../sdk/verifyCertifiedSchema.mjs";
import { verifyCertifiedClaim } from "../sdk/verifyCertifiedClaim.mjs";

const [claimId, digestHex, expectedStatus] = process.argv.slice(2);
if (!claimId || !digestHex || !["active", "revoked", "issuer_suspended", "consent_withdrawn"].includes(expectedStatus)) {
  throw new Error("usage: node tests/verifyCertifiedClaim.e2e.mjs <claimId> <sha256> <active|revoked>");
}
const canisterId = process.env.PROOF_REGISTRY_CANISTER_ID;
if (!canisterId) throw new Error("PROOF_REGISTRY_CANISTER_ID is required");
const host = process.env.PROOF_REGISTRY_HOST ?? "http://127.0.0.1:8000";
if (!/^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?\/?$/.test(host)) {
  throw new Error("this E2E only trusts a local replica");
}

const idlFactory = ({ IDL }) => IDL.Service({
  getCertifiedSchema: IDL.Func([IDL.Principal, IDL.Text], [IDL.Record({
    value: IDL.Opt(IDL.Vec(IDL.Nat8)),
    certificate: IDL.Opt(IDL.Vec(IDL.Nat8)),
    witness: IDL.Vec(IDL.Nat8),
  })], ["query"]),
  getCertifiedClaim: IDL.Func([IDL.Text], [IDL.Record({
    value: IDL.Opt(IDL.Vec(IDL.Nat8)),
    certificate: IDL.Opt(IDL.Vec(IDL.Nat8)),
    witness: IDL.Vec(IDL.Nat8),
  })], ["query"]),
});

const agent = new HttpAgent({ host });
await agent.fetchRootKey();
const actor = Actor.createActor(idlFactory, { agent, canisterId });
const response = await actor.getCertifiedClaim(claimId);
const trusted = {
  claimId, expectedSha256: digestHex, canisterId,
  rootKey: new Uint8Array(agent.rootKey), response,
};

const verified = await verifyCertifiedClaim(trusted);
assert.equal(verified.certificateVerified, true);
assert.equal(verified.status, expectedStatus);
assert.equal(verified.sha256, digestHex);

// A different digest is not the certified claim.
await assert.rejects(
  verifyCertifiedClaim({ ...trusted, expectedSha256: "ff".repeat(32) }),
);

// A different canister ID must fail certification.
await assert.rejects(
  verifyCertifiedClaim({ ...trusted, canisterId: "aaaaa-aa" }),
);

// Tamper the returned leaf, while keeping the same IC certificate/witness.
const tamperedValue = Uint8Array.from(response.value[0]);
tamperedValue[33] ^= 1;
await assert.rejects(
  verifyCertifiedClaim({ ...trusted, response: { ...response, value: [tamperedValue] } }),
);

// Invalid witness is never equivalent to a proof of absence.
await assert.rejects(
  verifyCertifiedClaim({ ...trusted, response: { ...response, witness: new Uint8Array([1, 2, 3]) } }),
);

const issuerPrincipal = claimId.split("/")[0];
const schemaId = "hortsun.service.v1";
const certifiedSchema = await actor.getCertifiedSchema(Principal.fromText(issuerPrincipal), schemaId);
const schemaTrusted = {
  issuerPrincipal, schemaId, expectedSha256: "55".repeat(32), canisterId,
  rootKey: new Uint8Array(agent.rootKey), response: certifiedSchema,
};
assert.equal((await verifyCertifiedSchema(schemaTrusted)).schemaDigestVerified, true);
await assert.rejects(verifyCertifiedSchema({ ...schemaTrusted, expectedSha256: "44".repeat(32) }));
await assert.rejects(verifyCertifiedSchema({ ...schemaTrusted, schemaId: "another.schema" }));
await assert.rejects(verifyCertifiedSchema({ ...schemaTrusted, issuerPrincipal: "aaaaa-aa" }));
const flippedSchema = Uint8Array.from(certifiedSchema.value[0]);
flippedSchema[0] ^= 1;
await assert.rejects(
  verifyCertifiedSchema({ ...schemaTrusted, response: { ...certifiedSchema, value: [flippedSchema] } }),
);
console.log(`PASS: independently certified ${expectedStatus} claim plus issuer-scoped schema; tampering rejected`);
