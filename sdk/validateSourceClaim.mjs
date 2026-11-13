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
  const domainSchema = parseStrictClaimJson(domainSchemaRaw);
  const recordId = recordIdRaw.trim();

  const sep = recordId.indexOf("/");
  if (sep <= 0 || sep !== recordId.lastIndexOf("/") || sep === recordId.length - 1) {
    throw new Error("Record ID 应为 issuer-principal/opaque-event-id。");
  }
  const principalRaw = recordId.slice(0, sep);
  let issuer;
  try {
    issuer = Principal.fromText(principalRaw);
    if (issuer.toText() !== principalRaw) throw new Error("noncanonical");
  } catch {
    throw new Error("Record ID 中的 Issuer Principal 无效。");
  }

  const opaqueEventId = recordId.slice(sep + 1);
  if (!/^[a-f0-9]{32}([a-f0-9]{32})?$/.test(opaqueEventId)) {
    throw new Error("来源事件 ID 必须是 128 或 256 位不可预测的十六进制标识。");
  }
  if (claim.issuer_id !== principalRaw) {
    throw new Error("Claim issuer_id 与通过 Principal 认证的签发者不一致。");
  }
  if (claim.source_event_id !== opaqueEventId) {
    throw new Error("Claim 的 source_event_id 与 Record ID 不一致。");
  }

  if (!validateEnvelope(claim)) {
    throw new Error("Claim 不符合 OVDP 1.0 格式：" +
      (validateEnvelope.errors ?? []).slice(0, 3).map(e => `${e.instancePath || "/"} ${e.message}`).join("; "));
  }

  if (domainSchema.$id !== claim.schema_id) {
    throw new Error("Domain Schema 的 $id 与 Claim schema_id 不一致。");
  }
  if (typeof domainSchema.$schema !== "string" ||
      !domainSchema.$schema.startsWith("https://json-schema.org/draft/2020-12/")) {
    throw new Error("当前只接受 JSON Schema 2020-12。");
  }
  forbidRemoteRefs(domainSchema);
  const domainAjv = makeValidator();
  let validator;
  try {
    validator = domainAjv.compile(domainSchema);
  } catch (e) {
    throw new Error("Domain Schema 无效或包含不支持的引用：" + (e instanceof Error ? e.message : "unknown"));
  }
  if (!validator(claim.claim_data)) {
    throw new Error("Claim 数据不符合签发者登记的 Domain Schema：" +
      (validator.errors ?? []).slice(0, 3).map(e => `${e.instancePath || "/"} ${e.message}`).join("; "));
  }

  const issuedAt = Date.parse(String(claim.issued_at));
  if (!Number.isFinite(issuedAt) || issuedAt > Date.now() + 60_000) {
    throw new Error("Claim 签发时间无效或超出允许的未来偏差。");
  }
  if (typeof claim.valid_until === "string" && Date.parse(claim.valid_until) <= Date.now()) {
    throw new Error("Claim 已超过有效期，不能判定为有效登记。");
  }

  return { claim, domainSchema, recordId, issuerPrincipal: principalRaw };
}

