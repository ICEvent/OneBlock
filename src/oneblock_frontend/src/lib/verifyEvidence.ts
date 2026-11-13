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
      "签发者身份及签名未核验", "ICP 认证状态与撤销记录未核验", "声明所述事实尚未核实",
    ],
  };
  if (!raw.trim()) return { ...empty, problems: ["请输入第三方 Claim JSON。"] };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ...empty, problems: ["不是有效的 JSON，无法检查声明结构。"] };
  }
  if (!isRecord(parsed)) return { ...empty, problems: ["Claim 根节点必须是 JSON 对象。"] };
  const claim = parsed;
  const problems: string[] = [];
  if (claim.protocol !== "oneblock.claim" || claim.version !== "1.0") {
    problems.push("缺少受支持的 protocol=oneblock.claim / version=1.0。")
  }
  if (!nonempty(claim.issuer_id)) problems.push("缺少 issuer_id（签发者）。");
  if (!nonempty(claim.predicate)) problems.push("缺少 predicate（声明内容类型）。");
  if (!nonempty(claim.schema_id)) problems.push("缺少 schema_id（数据标准版本）。");
  if (!isRecord(claim.subject) || !nonempty(claim.subject.namespace) || !nonempty(claim.subject.id) || !nonempty(claim.subject.kind)) {
    problems.push("缺少有效 subject（namespace / id / kind）。");
  }
  if (!isRecord(claim.claim_data)) problems.push("缺少 claim_data 对象。")
  if (!nonempty(claim.event_at) || !nonempty(claim.issued_at)) problems.push("缺少 event_at 或 issued_at。")
  if (!nonempty(claim.source_event_id)) problems.push("缺少 source_event_id（来源事件 ID）。")
  if (!["public", "unlisted", "restricted"].includes(String(claim.visibility))) {
    problems.push("visibility 应为 public / unlisted / restricted。")
  }
  const evidence = Array.isArray(claim.evidence) ? claim.evidence : null;
  if (!evidence) problems.push("缺少 evidence 数组。")
  else if (evidence.length === 0) problems.push("没有提供支持性证据；声明不能仅凭结构认定为真实。")
  else {
    evidence.forEach((value, i) => {
      if (!isRecord(value) || !nonempty(value.content_sha256) || !/^[a-f0-9]{64}$/i.test(value.content_sha256) || !nonempty(value.evidence_id)) {
        problems.push(`第 ${i + 1} 条 evidence 缺少 evidence_id 或合法的 SHA-256 摘要。`);
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
