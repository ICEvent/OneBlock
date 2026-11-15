import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { Principal } from "@dfinity/principal";
import { parseStrictClaimJson } from "./strictJson.mjs";

// Shared, testable validation: no network access, no IC root trust decisions.
// Envelope schema must come from a trusted local package, not untrusted user input.
function makeValidator() {
  const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: true });
  addFormats(ajv);
  return ajv;
}


/** Reject off-domain schema references. Never fetch arbitrary remote schemas. */
function forbidRemoteRefs(value, depth = 0) {
  if (depth > 64) throw new Error("Schema nesting exceeds allowed depth");
  if (Array.isArray(value)) {
    value.forEach(v => forbidRemoteRefs(v, depth + 1));
  } else if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      // Native RegExp in AJV can have catastrophic backtracking on an
      // issuer-provided pattern. No issuer-supplied regex until an RE2-like
      // bounded engine and workload limits are available.
      if (key === "pattern" || key === "patternProperties" ||
          key === "$dynamicRef" || key === "$dynamicAnchor") {
        throw new Error("Issuer-defined regular expressions and dynamic references are unsupported");
      }
      if ((key === "$ref" || key === "$dynamicRef") &&
          (typeof nested !== "string" || !nested.startsWith("#/"))) {
        throw new Error("Remote or non-local Schema references are unsupported");
      }
      forbidRemoteRefs(nested, depth + 1);
    }
  }
}


export function validateSourceClaim(raw, domainSchemaRaw, recordIdRaw, envelopeSchema) {
  const validateEnvelope = makeValidator().compile(envelopeSchema);
  const claim = parseStrictClaimJson(raw);
  if (new TextEncoder().encode(domainSchemaRaw).length > 64 * 1024) {
    throw new Error("Domain Schema exceeds 64 KiB safety limit");
  }
  const domainSchema = parseStrictClaimJson(domainSchemaRaw);
  const recordId = recordIdRaw.trim();

  const sep = recordId.indexOf("/");
  if (sep <= 0 || sep !== recordId.lastIndexOf("/") || sep === recordId.length - 1) {
    throw new Error("Record ID must be issuer-principal/opaque-event-id.");
  }
  const principalRaw = recordId.slice(0, sep);
  let issuer;
  try {
    issuer = Principal.fromText(principalRaw);
    if (issuer.toText() !== principalRaw) throw new Error("noncanonical");
  } catch {
    throw new Error("Invalid issuer Principal in Record ID.");
  }

  const opaqueEventId = recordId.slice(sep + 1);
  if (!/^[a-f0-9]{32}([a-f0-9]{32})?$/.test(opaqueEventId)) {
    throw new Error("Source event ID must be an unpredictable 128-bit or 256-bit hexadecimal identifier.");
  }
  if (claim.issuer_id !== principalRaw) {
    throw new Error("Claim issuer_id does not match the Principal-authenticated issuer.");
  }
  if (claim.source_event_id !== opaqueEventId) {
    throw new Error("Claim source_event_id does not match Record ID.");
  }

  if (!validateEnvelope(claim)) {
    throw new Error("Claim does not conform to OVDP 1.0: " +
      (validateEnvelope.errors ?? []).slice(0, 3).map(e => `${e.instancePath || "/"} ${e.message}`).join("; "));
  }

  if (domainSchema.$id !== claim.schema_id) {
    throw new Error("Domain Schema $id does not match Claim schema_id.");
  }
  if (typeof domainSchema.$schema !== "string" ||
      !domainSchema.$schema.startsWith("https://json-schema.org/draft/2020-12/")) {
    throw new Error("Only JSON Schema 2020-12 is currently accepted.");
  }
  forbidRemoteRefs(domainSchema);
  const domainAjv = makeValidator();
  let validator;
  try {
    validator = domainAjv.compile(domainSchema);
  } catch (e) {
    throw new Error("Domain Schema is invalid or contains unsupported references: " + (e instanceof Error ? e.message : "unknown"));
  }
  if (!validator(claim.claim_data)) {
    throw new Error("Claim data does not conform to the issuer's registered Domain Schema: " +
      (validator.errors ?? []).slice(0, 3).map(e => `${e.instancePath || "/"} ${e.message}`).join("; "));
  }

  const issuedAt = Date.parse(String(claim.issued_at));
  if (!Number.isFinite(issuedAt) || issuedAt > Date.now() + 60_000) {
    throw new Error("Claim issue time is invalid or exceeds the allowed future clock skew.");
  }
  if (typeof claim.valid_until === "string" && Date.parse(claim.valid_until) <= Date.now()) {
    throw new Error("Claim has expired and cannot be considered a valid registration.");
  }

  return { claim, domainSchema, recordId, issuerPrincipal: principalRaw };
}

