export function validateSourceClaim(
  raw: string,
  domainSchemaRaw: string,
  recordIdRaw: string,
  envelopeSchema: Record<string, unknown>,
): {
  claim: Record<string, unknown>;
  domainSchema: Record<string, unknown>;
  recordId: string;
  issuerPrincipal: string;
};
