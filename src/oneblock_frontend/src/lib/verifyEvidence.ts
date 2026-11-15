/**
 * OneBlock Verify MVP: local integrity and claim-shape inspection only.
 * No issuer authentication, IC certificate verification or factual corroboration.
 */

export type DigestComparison = "match" | "mismatch" | "not-provided" | "invalid-reference";

export async function sha256Hex(input: Uint8Array | string): Promise<string> {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  const safeBytes = new Uint8Array(bytes.byteLength);
  safeBytes.set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", safeBytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function compareSha256(actualHex: string, expectedRaw: string): DigestComparison {
  if (!expectedRaw.trim()) return "not-provided";
  const normalized = expectedRaw.trim().toLowerCase().replace(/^sha256:/, "");
  if (!/^[a-f0-9]{64}$/.test(normalized)) return "invalid-reference";
  return actualHex.toLowerCase() === normalized ? "match" : "mismatch";
}

export type ClaimInspection = {
  parsed: boolean;
  shapeReady: boolean;
  issuer: string;
  subject: string;
  predicate: string;
  schema: string;
  evidenceCount: number;
  problems: string[];
  unanswered: string[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const nonempty = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

/** Syntactic inspection, NOT complete JSON Schema validation or a proof check. */
export function inspectClaimJson(raw: string): ClaimInspection {
  const empty: ClaimInspection = {
    parsed: false, shapeReady: false, issuer: "—", subject: "—", predicate: "—", schema: "—",
    evidenceCount: 0, problems: [], unanswered: [
      "Issuer identity and signature have not been verified", "ICP certification status and revocation records have not been verified", "The facts stated in the claim have not been verified",
    ],
  };
  if (!raw.trim()) return { ...empty, problems: ["Please enter the third-party Claim JSON."] };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ...empty, problems: ["Invalid JSON; unable to inspect the claim structure."] };
  }
  if (!isRecord(parsed)) return { ...empty, problems: ["The Claim root must be a JSON object."] };
  const claim = parsed;
  const problems: string[] = [];
  if (claim.protocol !== "oneblock.claim" || claim.version !== "1.0") {
    problems.push("Missing supported protocol=oneblock.claim / version=1.0.")
  }
  if (!nonempty(claim.issuer_id)) problems.push("Missing issuer_id (issuer).");
  if (!nonempty(claim.predicate)) problems.push("Missing predicate (claim type).");
  if (!nonempty(claim.schema_id)) problems.push("Missing schema_id (data standard version).");
  if (!isRecord(claim.subject) || !nonempty(claim.subject.namespace) || !nonempty(claim.subject.id) || !nonempty(claim.subject.kind)) {
    problems.push("Missing a valid subject (namespace / id / kind).");
  }
  if (!isRecord(claim.claim_data)) problems.push("Missing claim_data object.")
  if (!nonempty(claim.event_at) || !nonempty(claim.issued_at)) problems.push("Missing event_at or issued_at.")
  if (!nonempty(claim.source_event_id)) problems.push("Missing source_event_id (source event ID).")
  if (!["public", "unlisted", "restricted"].includes(String(claim.visibility))) {
    problems.push("visibility must be public / unlisted / restricted.")
  }
  const evidence = Array.isArray(claim.evidence) ? claim.evidence : null;
  if (!evidence) problems.push("Missing evidence array.")
  else if (evidence.length === 0) problems.push("No supporting evidence provided; structure alone cannot establish a claim as true.")
  else {
    evidence.forEach((value, i) => {
      if (!isRecord(value) || !nonempty(value.content_sha256) || !/^[a-f0-9]{64}$/i.test(value.content_sha256) || !nonempty(value.evidence_id)) {
        problems.push(`Evidence item ${i + 1} is missing evidence_id or a valid SHA-256 digest.`);
      }
    });
  }
  return {
    ...empty,
    parsed: true,
    shapeReady: problems.length === 0,
    issuer: nonempty(claim.issuer_id) ? claim.issuer_id : "—",
    subject: isRecord(claim.subject) && nonempty(claim.subject.namespace) && nonempty(claim.subject.id)
      ? `${claim.subject.namespace}:${claim.subject.id}` : "—",
    predicate: nonempty(claim.predicate) ? claim.predicate : "—",
    schema: nonempty(claim.schema_id) ? claim.schema_id : "—",
    evidenceCount: evidence?.length ?? 0,
    problems,
  };
}
