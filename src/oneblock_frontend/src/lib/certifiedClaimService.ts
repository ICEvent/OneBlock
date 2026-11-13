import { Actor, HttpAgent } from "@dfinity/agent";
import { IDL } from "@dfinity/candid";
import { Principal } from "@dfinity/principal";
import { HOST } from "./canisters";
import envelopeSchema from "../schemas/claim-body-v1.schema.json";
import { computeClaimDigest, computeSchemaDigest } from "../../../../sdk/claimDigest.mjs";
import { validateSourceClaim } from "../../../../sdk/validateSourceClaim.mjs";
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

export function configuredRegistryId(): string {
  return (import.meta.env.VITE_PROOF_REGISTRY_CANISTER_ID ?? "").trim();
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
    validateSourceClaim(claimRaw, domainSchemaRaw, recordIdRaw, envelopeSchema);

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
