/**
 * Independent verification of an issuer-scoped, immutable JSON Schema
 * commitment. Never treat an ordinary getSchema() query as certified.
 */
import { verifyCertification } from "@dfinity/certificate-verification";
import { lookup_path, LookupPathStatus } from "@icp-sdk/core/agent";
import { Principal } from "@icp-sdk/core/principal";
import { hexToBytes } from "./claimDigest.mjs";

const enc = new TextEncoder();
const MAX_CERT_AGE_MS = 60_000;

function unwrap(opt) {
  if (Array.isArray(opt)) {
    if (opt.length !== 1) return null;
    return opt[0];
  }
  return opt ?? null;
}
function bytes(value) {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  throw new Error("invalid byte array");
}
function equal(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= (a[i] ^ b[i]);
  return diff === 0;
}

/**
 * @returns {Promise<{schemaDigestVerified:true,issuerPrincipal:string,schemaId:string}>}
 */
export async function verifyCertifiedSchema({
  issuerPrincipal, schemaId, expectedSha256, canisterId, rootKey, response,
}) {
  if (!schemaId || typeof schemaId !== "string") throw new Error("missing trusted schema ID");
  const issuer = Principal.fromText(issuerPrincipal);
  if (issuer.toText() !== issuerPrincipal) throw new Error("noncanonical issuer Principal");
  const certificate = unwrap(response?.certificate);
  const reported = unwrap(response?.value);
  if (!certificate || !reported) throw new Error("no certified schema found");
  const tree = await verifyCertification({
    canisterId: Principal.fromText(canisterId),
    encodedCertificate: bytes(certificate),
    encodedTree: bytes(response.witness),
    rootKey: bytes(rootKey),
    maxCertificateTimeOffsetMs: MAX_CERT_AGE_MS,
  });
  const p = lookup_path([enc.encode("schemas"), enc.encode(issuerPrincipal), enc.encode(schemaId)], tree);
  if (p.status !== LookupPathStatus.Found) throw new Error("schema path not certified");
  const fromWitness = bytes(p.value);
  const digest = hexToBytes(expectedSha256);
  if (!equal(fromWitness, digest) || !equal(fromWitness, bytes(reported))) {
    throw new Error("schema digest differs from the issuer-certified bytes");
  }
  if (fromWitness.length !== 32) throw new Error("bad schema hash length");
  return { schemaDigestVerified: true, issuerPrincipal, schemaId };
}
