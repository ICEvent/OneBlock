/**
 * RFC 8785 / JCS canonicalization for JSON data (not arbitrary JS values).
 *
 * This function accepts an already-parsed JSON object from a trusted JSON
 * parser. JSON.parse silently drops duplicate object keys, so the caller MUST
 * reject duplicate keys before parsing untrusted raw JSON for signed claims.
 * Do not feed Date, BigInt, Uint8Array, NaN, Infinity or custom objects.
 *
 * SHA256 claim commitment = sha256( UTF8("oneblock:claim:v1\n") ||
 *                                  UTF8(JCS(claimBody)) ).
 * It must cover every required field including issuer, schema, subject,
 * evidence and issued times. Do not include a signature or receipt.
 */
const PREFIX = new TextEncoder().encode("oneblock:claim:v1\n");
const HEX_SHA = /^[0-9a-f]{64}$/;

function validUnicode(value) {
  for (let i = 0; i < value.length; i++) {
    const ch = value.charCodeAt(i);
    if (ch >= 0xd800 && ch <= 0xdbff) {
      const next = value.charCodeAt(++i);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        throw new Error("lone high surrogate is not valid I-JSON");
      }
    } else if (ch >= 0xdc00 && ch <= 0xdfff) {
      throw new Error("lone low surrogate is not valid I-JSON");
    }
  }
}

export function canonicalizeJson(value) {
  if (value === null) return "null";
  switch (typeof value) {
    case "string":
      validUnicode(value);
      return JSON.stringify(value);
    case "boolean":
      return value ? "true" : "false";
    case "number":
      if (!Number.isFinite(value) || (Number.isInteger(value) && !Number.isSafeInteger(value))) {
        throw new Error("invalid or unsafe JSON number; encode large amounts/integers as strings");
      }
      return JSON.stringify(value);
    case "object":
      if (Array.isArray(value)) {
        return "[" + value.map((v) => canonicalizeJson(v)).join(",") + "]";
      }
      if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) {
        throw new Error("only plain JSON objects can be signed");
      }
      return "{" + Object.keys(value).sort().map((key) => {
        validUnicode(key);
        return JSON.stringify(key) + ":" + canonicalizeJson(value[key]);
      }).join(",") + "}";
    default:
      throw new Error("unsupported value: input must be strict JSON");
  }
}

/** SHA-256 over canonical JSON Schema bytes. Registered by the issuer. */
export async function computeSchemaDigest(schema) {
  if (schema === null || typeof schema !== "object" || Array.isArray(schema)) {
    throw new Error("domain schema must be a JSON object");
  }
  const payload = new TextEncoder().encode(canonicalizeJson(schema));
  const hash = await crypto.subtle.digest("SHA-256", payload);
  return bytesToHex(new Uint8Array(hash));
}

export function hexToBytes(hex) {
  const normalized = String(hex).replace(/^sha256:/, "").toLowerCase();
  if (!HEX_SHA.test(normalized)) throw new Error("SHA-256 must be a 64-character hex string");
  return Uint8Array.from({ length: 32 }, (_, i) => parseInt(normalized.slice(i * 2, i * 2 + 2), 16));
}

export function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function computeClaimDigest(claimBody) {
  if (claimBody === null || Array.isArray(claimBody) || typeof claimBody !== "object") {
    throw new Error("claim body must be a JSON object");
  }
  if (claimBody.protocol !== "oneblock.claim" || claimBody.version !== "1.0") {
    throw new Error("unsupported claim protocol/version");
  }
  const payload = new TextEncoder().encode(canonicalizeJson(claimBody));
  const bytes = new Uint8Array(PREFIX.byteLength + payload.byteLength);
  bytes.set(PREFIX);
  bytes.set(payload, PREFIX.byteLength);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return bytesToHex(new Uint8Array(digest));
}
