export type CertifiedClaimResponse = {
  value: [] | [Uint8Array] | Uint8Array | null;
  certificate: [] | [Uint8Array] | Uint8Array | null;
  witness: Uint8Array;
};
export function unpackClaimLeaf(bytes: Uint8Array): { sha256: string; status: "active" | "revoked" };
export function verifyCertifiedClaim(input: {
  claimId: string;
  expectedSha256: string;
  canisterId: string;
  rootKey: Uint8Array;
  response: CertifiedClaimResponse;
}): Promise<{ status: "active" | "revoked"; sha256: string; certificateVerified: true }>;
