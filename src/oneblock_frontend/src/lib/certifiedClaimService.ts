import { Actor, HttpAgent } from "@dfinity/agent";
import { IDL } from "@dfinity/candid";
import { Principal } from "@dfinity/principal";
import { HOST } from "./canisters";
import { inspectClaimJson } from "./verifyEvidence";
import { computeClaimDigest } from "../../../../sdk/claimDigest.mjs";
import { parseStrictClaimJson } from "../../../../sdk/strictJson.mjs";
import { verifyCertifiedClaim } from "../../../../sdk/verifyCertifiedClaim.mjs";

export type CertifiedProofReport = {
  claimId: string;
  canisterId: string;
  issuerPrincipal: string;
  claimSha256: string;
  status: "active" | "revoked";
  certificateVerified: true;
  // Proof validity is NOT legal/organizational identity or real-world truth.
  issuerOrganizationVerified: false;
  factualTruthVerified: false;
};

type CertifiedResponse = {
  value: [] | [Uint8Array];
  certificate: [] | [Uint8Array];
  witness: Uint8Array;
};

const idlFactory = ({ IDL: Candid }: { IDL: Pick<typeof IDL, "Service" | "Func" | "Record" | "Text" | "Opt" | "Vec" | "Nat8"> }) =>
  Candid.Service({
    getCertifiedClaim: Candid.Func([Candid.Text], [Candid.Record({
      value: Candid.Opt(Candid.Vec(Candid.Nat8)),
      certificate: Candid.Opt(Candid.Vec(Candid.Nat8)),
      witness: Candid.Vec(Candid.Nat8),
    })], ["query"]),
  });

export function configuredRegistryId(): string {
  return (import.meta.env.VITE_PROOF_REGISTRY_CANISTER_ID ?? "").trim();
}

/** Fail closed: only trust a pinned build-time canister ID and mainnet root key. */
export async function verifyProofFromClaimJson(claimIdRaw: string, raw: string): Promise<CertifiedProofReport> {
  const canisterId = configuredRegistryId();
  if (!canisterId) throw new Error("Proof Registry 尚未配置，当前不能执行链上认证验证。");

  let trustedRegistry: Principal;
  try {
    trustedRegistry = Principal.fromText(canisterId);
    if (trustedRegistry.toText() !== canisterId) throw new Error("noncanonical canister");
  } catch {
    throw new Error("部署配置中的 Proof Registry Canister ID 无效。");
  }

  const claimId = claimIdRaw.trim();
  const separator = claimId.indexOf("/");
  if (separator <= 0 || separator === claimId.length - 1 || claimId.length > 250) {
    throw new Error("Claim ID 应为 issuer-principal/opaque-source-event-id。");
  }

  let issuerPrincipal: Principal;
  try {
    issuerPrincipal = Principal.fromText(claimId.slice(0, separator));
    if (issuerPrincipal.toText() !== claimId.slice(0, separator)) throw new Error("noncanonical issuer");
  } catch {
    throw new Error("Claim ID 的签发者 Principal 无效。");
  }

  const claim = parseStrictClaimJson(raw);
  const shape = inspectClaimJson(raw);
  if (!shape.shapeReady) {
    throw new Error("Claim 字段未通过基础检查：" + shape.problems.join(" "));
  }
  if (claim.source_event_id !== claimId.slice(separator + 1)) {
    throw new Error("Claim JSON 的 source_event_id 与 Claim ID 不匹配。");
  }

  // Computed locally over all canonical claim fields. Never upload the raw
  // claim JSON, client evidence, or user identity to the proof registry.
  const expectedSha256 = await computeClaimDigest(claim);

  // The production agent starts with the library's pinned IC root key.
  // NEVER call fetchRootKey() against a remote mainnet HTTP gateway.
  const localUrl = (import.meta.env.VITE_PROOF_REGISTRY_HOST ?? "").trim();
  const developmentLocal = import.meta.env.DEV && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/.test(localUrl);
  const host = developmentLocal ? localUrl : HOST;
  const agent = new HttpAgent({ host });

  if (developmentLocal) {
    // Trusting a local replica is only permitted in a developer's local app.
    await agent.fetchRootKey();
  }
  if (!agent.rootKey) throw new Error("缺少已知可信的 ICP 根公钥，拒绝验证。");

  const actor = Actor.createActor(idlFactory, { agent, canisterId }) as unknown as {
    getCertifiedClaim: (id: string) => Promise<CertifiedResponse>;
  };
  const response = await actor.getCertifiedClaim(claimId);
  const result = await verifyCertifiedClaim({
    claimId,
    expectedSha256,
    canisterId: trustedRegistry.toText(),
    rootKey: new Uint8Array(agent.rootKey),
    response,
  });

  return {
    claimId,
    canisterId,
    issuerPrincipal: issuerPrincipal.toText(),
    claimSha256: result.sha256,
    status: result.status,
    certificateVerified: true,
    issuerOrganizationVerified: false,
    factualTruthVerified: false,
  };
}
