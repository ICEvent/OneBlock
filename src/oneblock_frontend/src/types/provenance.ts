export type SourceKind =
  | "self_declared"
  | "external"
  | "peer"
  | "derived";

export type VerificationMethod =
  | "none"
  | "imported"
  | "oauth"
  | "signed"
  | "onchain"
  | "institutional"
  | "system_derived"
  | { custom: string };

export interface EvidenceRef {
  schema: string;
  uri?: string;
  hash?: string;
  externalId?: string;
}

export interface Provenance {
  sourceKind: SourceKind;
  issuer?: string;
  issuerId: string;
  verification: VerificationMethod;
  evidence: EvidenceRef[];
  observedAt?: bigint;
  recordedAt: bigint;
}

export interface CapabilityRef {
  path: string;
  displayLabel?: string;
}

export type ClaimValue =
  | { type: "text"; value: string }
  | { type: "number"; value: number }
  | { type: "boolean"; value: boolean }
  | { type: "reference"; value: string };

export type Visibility = "global" | "unlisted" | "personal";

export interface ProfileClaim {
  id: string;
  profileId: string;
  subject: string;
  predicate: string;
  value: ClaimValue;
  capability?: CapabilityRef;
  context?: string;
  provenance: Provenance;
  validFrom?: bigint;
  validUntil?: bigint;
  visibility: Visibility;
  createdAt: bigint;
}

export type ReviewRelationship =
  | "customer"
  | "provider"
  | "coworker"
  | "collaborator"
  | "manager"
  | "peer"
  | "participant"
  | { other: string };

export type ReviewStatus = "active" | "disputed" | "withdrawn";

export interface PeerReview {
  id: string;
  profileId: string;
  subject: string;
  reviewer: string;
  relationship: ReviewRelationship;
  capability?: CapabilityRef;
  context: string;
  assessmentTags: string[];
  narrative?: string;
  evidence: EvidenceRef[];
  relatedClaims: string[];
  status: ReviewStatus;
  response?: string;
  visibility: Visibility;
  createdAt: bigint;
  updatedAt: bigint;
}

export interface DerivedSignal {
  id: string;
  profileId: string;
  subject: string;
  signalType: string;
  capability?: CapabilityRef;
  value: ClaimValue;
  confidence?: number;
  explanation?: string;
  derivedFromClaims: string[];
  derivedFromReviews: string[];
  method: {
    model: string;
    version: string;
  };
  computedAt: bigint;
}

export const provenanceLabel = (source: SourceKind): string => {
  switch (source) {
    case "self_declared":
      return "Self-declared";
    case "external":
      return "External evidence";
    case "peer":
      return "Peer review";
    case "derived":
      return "Derived";
  }
};
