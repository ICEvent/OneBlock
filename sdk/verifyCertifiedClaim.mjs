/**
 * Independent ICP-certified claim verification for OVDP phase 2.
 * This module checks a Merkle witness and a BLS chain certificate using the
 * official DFINITY verifier. It does not prove a real-world statement true.
 *
 * The caller MUST supply an independently trusted IC root key. Only use
 * agent.fetchRootKey()/shouldFetchRootKey on a controlled *local* replica.
 * Never fetch a new root key from an untrusted mainnet gateway.
 */
import { verifyCertification } from "@dfinity/certificate-verification";
import { lookup_path, LookupPathStatus } from "@icp-sdk/core/agent";
import { Principal } from "@icp-sdk/core/principal";
import { bytesToHex, hexToBytes } from "./claimDigest.mjs";

const encoder = new TextEncoder();
const STATUS = Object.freeze({ 0: "active", 1: "revoked", 2: "issuer_suspended", 3: "consent_withdrawn" });
const MAX_CERT_AGE_MS = 60 * 1000; // Last-certified state, not real-time consensus.

export function unpackClaimLeaf(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length !== 34 || bytes[0] !== 1) {
    throw new Error("unrecognized certified claim leaf format");
  }
  const status = STATUS[bytes[33]];
  if (!status) throw new Error("unknown claim status byte");
  return { sha256: bytesToHex(bytes.subarray(1, 33)), status };
}

function toBytes(input) {
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  throw new Error("expected a byte array");
}

function unboxOpt(value, label) {
  if (Array.isArray(value)) {
    if (value.length > 1) throw new Error(`invalid optional ${label}`);
    return value.length ? toBytes(value[0]) : null;
  }
  if (value == null) return null;
  return toBytes(value);
}

function sameBytes(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/**
 * @param {Object} input
 * @param {string} input.claimId issuerPrincipal/source_event_id, untrusted.
 * @param {string} input.expectedSha256 computed independently from a canonical claim.
 * @param {string} input.canisterId trusted proof_registry canister principal.
 * @param {Uint8Array} input.rootKey independently trusted IC root public key.
 * @param {{value: Uint8Array|null|Uint8Array[],certificate:Uint8Array|null|Uint8Array[],witness:Uint8Array}} input.response
 * @returns {Promise<{status:"active"|"revoked"|"issuer_suspended"|"consent_withdrawn",sha256:string,certificateVerified:true}>}
 */
export async function verifyCertifiedClaim({ claimId, expectedSha256, canisterId, rootKey, response }) {
  if (typeof claimId !== "string" || claimId.length < 3) throw new Error("missing claim ID");
  if (typeof canisterId !== "string" || !canisterId) throw new Error("missing trusted canister ID");
  const trustedHash = hexToBytes(expectedSha256);
  const trustedRootKey = toBytes(rootKey);
  if (!trustedRootKey.byteLength) throw new Error("missing trusted IC root key");
  if (!response || typeof response !== "object") throw new Error("missing certificate response");

  const certificate = unboxOpt(response.certificate, "certificate");
  if (!certificate?.byteLength) throw new Error("missing IC certificate; use query, not update");
  const witness = toBytes(response.witness);
  const reportedValue = unboxOpt(response.value, "value");

  const tree = await verifyCertification({
    canisterId: Principal.fromText(canisterId),
    encodedCertificate: certificate,
    encodedTree: witness,
    rootKey: trustedRootKey,
    maxCertificateTimeOffsetMs: MAX_CERT_AGE_MS,
  });

  const result = lookup_path([encoder.encode("claims"), encoder.encode(claimId)], tree);
  switch (result.status) {
    case LookupPathStatus.Absent:
      // Correctly authenticated absence is not a valid claim.
      if (reportedValue !== null) throw new Error("untrusted response conflicts with certified absence");
      throw new Error("claim ID does not exist in the certified registry");
    case LookupPathStatus.Found: {
      const certifiedValue = toBytes(result.value);
      if (!reportedValue || !sameBytes(certifiedValue, reportedValue)) {
        throw new Error("response claim value does not match Merkle witness");
      }
      const leaf = unpackClaimLeaf(certifiedValue);
      if (!sameBytes(hexToBytes(leaf.sha256), trustedHash)) {
        throw new Error("claim content digest differs from certified commitment");
      }
      return { ...leaf, certificateVerified: true };
    }
    default:
      throw new Error(`witness does not prove requested claim ID (status: ${result.status})`);
  }
}
