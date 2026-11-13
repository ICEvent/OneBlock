import { Actor, HttpAgent } from "@dfinity/agent";
import { IDL } from "@dfinity/candid";
import { Principal } from "@dfinity/principal";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { HOST } from "./canisters";
import envelopeSchema from "../schemas/claim-body-v1.schema.json";
import { computeClaimDigest, computeSchemaDigest } from "../../../../sdk/claimDigest.mjs";
import { parseStrictClaimJson } from "../../../../sdk/strictJson.mjs";
import { verifyCertifiedClaim } from "../../../../sdk/verifyCertifiedClaim.mjs";
import { verifyCertifiedSchema } from "../../../../sdk/verifyCertifiedSchema.mjs";

export type ProofState = "active" | "revoked" | "issuer_suspended" | "consent_withdrawn";

export type CertifiedProofReport = {
  recordId: string;
  canisterId: string;
  issuerPrincipal: string;
  claimSha256: string;
  schemaSha256: string;
  status: ProofState;
  certificateVerified: true;
  schemaVerified: true;
  issuerPrincipalAuthenticated: true;
  issuerOrganizationVerified: false;
  subjectIdentityVerified: false;
  factualTruthVerified: false;
  checkPerformedAt: string;
};

type CertifiedResponse = {
  value: [] | [Uint8Array];
  certificate: [] | [Uint8Array];
  witness: Uint8Array;
};

const idlFactory = ({ IDL: C }: { IDL: Pick<typeof IDL, "Service" | "Func" | "Record" | "Text" | "Opt" | "Vec" | "Nat8" | "Principal"> }) =>
  C.Service({
    getCertifiedClaim: C.Func([C.Text], [C.Record({
      value: C.Opt(C.Vec(C.Nat8)),
      certificate: C.Opt(C.Vec(C.Nat8)),
      witness: C.Vec(C.Nat8),
    })], ["query"]),
    getCertifiedSchema: C.Func([C.Principal, C.Text], [C.Record({
      value: C.Opt(C.Vec(C.Nat8)),
      certificate: C.Opt(C.Vec(C.Nat8)),
      witness: C.Vec(C.Nat8),
    })], ["query"]),
  });

function makeValidator() {
  const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: true });
  addFormats(ajv);
  return ajv;
}

const envelopeAjv = makeValidator();
const validateEnvelope = envelopeAjv.compile(envelopeSchema);

/** Reject off-domain schema references. Never fetch arbitrary remote schemas. */
function forbidRemoteRefs(value: unknown, depth = 0): void {
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

export function configuredRegistryId(): string {
  return (import.meta.env.VITE_PROOF_REGISTRY_CANISTER_ID ?? "").trim();
}

export function validateSourceClaim(raw: string, domainSchemaRaw: string, recordIdRaw: string) {
  const claim = parseStrictClaimJson(raw);
  const domainSchema = parseStrictClaimJson(domainSchemaRaw);
  const recordId = recordIdRaw.trim();

  const sep = recordId.indexOf("/");
  if (sep <= 0 || sep !== recordId.lastIndexOf("/") || sep === recordId.length - 1) {
    throw new Error("Record ID 应为 issuer-principal/opaque-event-id。");
  }
  const principalRaw = recordId.slice(0, sep);
  let issuer: Principal;
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
  let validator: ReturnType<typeof domainAjv.compile>;
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

/**
 * Proof scope: registered exact digest & schema, principal, certificate
 * and status at a recent certified point. Not proof of real-world truth,
 * legal organization, or bilateral control of a claim's subject.
 */
export async function verifyProofFromClaimJson(
  recordIdRaw: string, claimRaw: string, domainSchemaRaw: string
): Promise<CertifiedProofReport> {
  const canisterId = configuredRegistryId();
  if (!canisterId) throw new Error("Proof Registry 尚未配置，拒绝离线伪造验证结果。");
  let trustedRegistry: Principal;
  try {
    trustedRegistry = Principal.fromText(canisterId);
    if (trustedRegistry.toText() !== canisterId) throw new Error("noncanonical");
  } catch {
    throw new Error("可信的 Proof Registry Canister ID 配置错误。");
  }

  const { claim, domainSchema, recordId, issuerPrincipal } =
    validateSourceClaim(claimRaw, domainSchemaRaw, recordIdRaw);

  const [expectedSha256, expectedSchemaSha256] = await Promise.all([
    computeClaimDigest(claim), computeSchemaDigest(domainSchema),
  ]);

  // Mainnet agent uses the SDK's pinned IC root key. Local root key may be
  // fetched only from an explicitly configured localhost dev replica.
  const localUrl = (import.meta.env.VITE_PROOF_REGISTRY_HOST ?? "").trim();
  const developmentLocal = import.meta.env.DEV && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/.test(localUrl);
  const host = developmentLocal ? localUrl : HOST;
  const agent = new HttpAgent({ host });
  if (developmentLocal) await agent.fetchRootKey();
  if (!agent.rootKey) throw new Error("没有可信 IC 根公钥。");

  const actor = Actor.createActor(idlFactory, { agent, canisterId }) as unknown as {
    getCertifiedClaim: (id: string) => Promise<CertifiedResponse>;
    getCertifiedSchema: (issuer: Principal, schemaId: string) => Promise<CertifiedResponse>;
  };
  const [claimResponse, schemaResponse] = await Promise.all([
    actor.getCertifiedClaim(recordId),
    actor.getCertifiedSchema(Principal.fromText(issuerPrincipal), String(claim.schema_id)),
  ]);
  const rootKey = new Uint8Array(agent.rootKey);
  const [certifiedClaim, certifiedSchema] = await Promise.all([
    verifyCertifiedClaim({
      claimId: recordId,
      expectedSha256,
      canisterId: trustedRegistry.toText(),
      rootKey,
      response: claimResponse,
    }),
    verifyCertifiedSchema({
      issuerPrincipal,
      schemaId: String(claim.schema_id),
      expectedSha256: expectedSchemaSha256,
      canisterId: trustedRegistry.toText(),
      rootKey,
      response: schemaResponse,
    }),
  ]);

  return {
    recordId,
    canisterId,
    issuerPrincipal,
    claimSha256: certifiedClaim.sha256,
    schemaSha256: expectedSchemaSha256,
    status: certifiedClaim.status,
    certificateVerified: certifiedClaim.certificateVerified,
    schemaVerified: certifiedSchema.schemaDigestVerified,
    issuerPrincipalAuthenticated: true,
    issuerOrganizationVerified: false,
    subjectIdentityVerified: false,
    factualTruthVerified: false,
    checkPerformedAt: new Date().toISOString(),
  };
}
