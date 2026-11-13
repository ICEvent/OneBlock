import type { CertifiedClaimResponse } from "./verifyCertifiedClaim.mjs";
export function verifyCertifiedSchema(input: {
  issuerPrincipal: string;
  schemaId: string;
  expectedSha256: string;
  canisterId: string;
  rootKey: Uint8Array;
  response: CertifiedClaimResponse;
}): Promise<{ schemaDigestVerified: true; issuerPrincipal: string; schemaId: string }>;
