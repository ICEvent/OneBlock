// Integration system types for OneBlock 3rd-party app support

export type AppId = string;
export type ActivityTypeKey = string; // e.g. "donation.made"
export type RecordId = string;
export type ProfileId = string;

export type AppCategory =
  | { donation: null }
  | { fitness: null }
  | { education: null }
  | { finance: null }
  | { social: null }
  | { other: null };

export type VerificationPolicy =
  | { none: null }
  | { idempotency_only: null }
  | { signed_payload: null };

export interface IntegrationApp {
  id: AppId;
  name: string;
  description: string;
  category: AppCategory;
  owner: string; // principal text
  verification_policy: VerificationPolicy;
  schema_version: bigint;
  active: boolean;
  created_at: bigint;
}

export type ConnectionStatus =
  | { active: null }
  | { revoked: null }
  | { pending: null };

export interface IntegrationConnection {
  profile_id: ProfileId;
  app_id: AppId;
  external_user_id: string;
  scopes: string[];
  status: ConnectionStatus;
  created_at: bigint;
  revoked_at: [] | [bigint];
}

export interface FieldDef {
  name: string;
  field_type: string; // "text" | "nat" | "float" | "bool"
  required: boolean;
  description: string;
}

export interface ActivityType {
  app_id: AppId;
  type_key: ActivityTypeKey;
  label: string;
  description: string;
  fields: FieldDef[];
  version: bigint;
  created_at: bigint;
}

export type SignatureStatus =
  | { unverified: null }
  | { verified: null }
  | { invalid: null };

export interface Attestation {
  tx_hash: [] | [string];
  receipt_url: [] | [string];
  signed_payload: [] | [string];
  issuer: [] | [string];
  signature_status: SignatureStatus;
}

export interface MetadataEntry {
  key: string;
  value: string;
}

export interface ActivityRecord {
  id: RecordId;
  profile_id: ProfileId;
  app_id: AppId;
  activity_type: ActivityTypeKey;
  amount: [] | [number];
  currency: [] | [string];
  event_timestamp: bigint;
  ingest_timestamp: bigint;
  payload: MetadataEntry[];
  schema_version: bigint;
  idempotency_key: string;
  attestation: [] | [Attestation];
  verification_level: { self: null } | { platform: null } | { verifiable: null } | { third_party: null };
  visibility: { global: null } | { unlisted: null } | { personal: null };
  hash: string;
}

export interface DerivedSummary {
  profile_id: ProfileId;
  app_id: AppId;
  activity_type: ActivityTypeKey;
  record_count: bigint;
  total_amount: [] | [number];
  currency: [] | [string];
  last_updated: bigint;
}

// ---- Input types ----

export interface NewIntegrationApp {
  id: AppId;
  name: string;
  description: string;
  category: AppCategory;
  verification_policy: VerificationPolicy;
}

export interface NewActivityType {
  app_id: AppId;
  type_key: ActivityTypeKey;
  label: string;
  description: string;
  fields: FieldDef[];
}

export interface NewActivityRecord {
  profile_id: ProfileId;
  app_id: AppId;
  activity_type: ActivityTypeKey;
  amount: [] | [number];
  currency: [] | [string];
  event_timestamp: bigint;
  payload: MetadataEntry[];
  schema_version: bigint;
  idempotency_key: string;
  attestation: [] | [Attestation];
  visibility: { global: null } | { unlisted: null } | { personal: null };
}
