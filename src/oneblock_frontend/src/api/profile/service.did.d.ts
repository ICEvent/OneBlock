import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

// Block system types
export type BlockId = string;
export type TraitId = string;
export type Timestamp = bigint;

export type Visibility = { 'global' : null } |
  { 'unlisted' : null } |
  { 'personal' : null };

export type Strength = { 'low' : null } |
  { 'medium' : null } |
  { 'high' : null };

export interface Block {
  'id' : BlockId,
  'profile_id' : string,
  'start_time' : Timestamp,
  'end_time' : [] | [Timestamp],
  'evidence_refs' : Array<string>,
  'derived_traits' : Array<TraitId>,
  'narrative' : [] | [string],
  'visibility' : Visibility,
  'hash' : string,
  'created_at' : Timestamp,
}

export interface Trait {
  'id' : TraitId,
  'tlabel' : string,
  'strength' : Strength,
  'confidence' : number,
  'explanation' : string,
  'derived_from' : Array<BlockId>,
  'visibility' : Visibility,
  'updated_at' : Timestamp,
}

export interface NewBlock {
  'profile_id' : string,
  'start_time' : Timestamp,
  'end_time' : [] | [Timestamp],
  'evidence_refs' : Array<string>,
  'narrative' : [] | [string],
  'visibility' : Visibility,
}

export interface NewTrait {
  'tlabel' : string,
  'strength' : Strength,
  'confidence' : number,
  'explanation' : string,
  'derived_from' : Array<BlockId>,
  'visibility' : Visibility,
}

// Integration system types
export type AppId = string;
export type ActivityTypeKey = string;
export type RecordId = string;
export type ProfileId = string;

export type AppCategory =
  { 'donation' : null } |
  { 'fitness' : null } |
  { 'education' : null } |
  { 'finance' : null } |
  { 'social' : null } |
  { 'other' : null };

export type VerificationPolicy =
  { 'none' : null } |
  { 'idempotency_only' : null } |
  { 'signed_payload' : null };

export interface IntegrationApp {
  'id' : AppId,
  'name' : string,
  'description' : string,
  'category' : AppCategory,
  'owner' : Principal,
  'verification_policy' : VerificationPolicy,
  'schema_version' : bigint,
  'active' : boolean,
  'created_at' : Timestamp,
}

export type ConnectionStatus =
  { 'active' : null } |
  { 'revoked' : null } |
  { 'pending' : null };

export interface IntegrationConnection {
  'profile_id' : ProfileId,
  'app_id' : AppId,
  'external_user_id' : string,
  'scopes' : Array<string>,
  'status' : ConnectionStatus,
  'created_at' : Timestamp,
  'revoked_at' : [] | [Timestamp],
}

export interface FieldDef {
  'name' : string,
  'field_type' : string,
  'required' : boolean,
  'description' : string,
}

export interface ActivityType {
  'app_id' : AppId,
  'type_key' : ActivityTypeKey,
  'type_label' : string,
  'description' : string,
  'fields' : Array<FieldDef>,
  'version' : bigint,
  'created_at' : Timestamp,
}

export type SignatureStatus =
  { 'unverified' : null } |
  { 'verified' : null } |
  { 'invalid' : null };

export interface Attestation {
  'tx_hash' : [] | [string],
  'receipt_url' : [] | [string],
  'signed_payload' : [] | [string],
  'issuer' : [] | [string],
  'signature_status' : SignatureStatus,
}

export interface MetadataEntry {
  'key' : string,
  'value' : string,
}

export type VerificationLevel =
  { 'self' : null } |
  { 'platform' : null } |
  { 'verifiable' : null } |
  { 'third_party' : null };

export interface ActivityRecord {
  'id' : RecordId,
  'profile_id' : ProfileId,
  'app_id' : AppId,
  'activity_type' : ActivityTypeKey,
  'amount' : [] | [number],
  'currency' : [] | [string],
  'event_timestamp' : Timestamp,
  'ingest_timestamp' : Timestamp,
  'payload' : Array<MetadataEntry>,
  'schema_version' : bigint,
  'idempotency_key' : string,
  'attestation' : [] | [Attestation],
  'verification_level' : VerificationLevel,
  'visibility' : Visibility,
  'hash' : string,
}

export interface DerivedSummary {
  'profile_id' : ProfileId,
  'app_id' : AppId,
  'activity_type' : ActivityTypeKey,
  'record_count' : bigint,
  'total_amount' : [] | [number],
  'currency' : [] | [string],
  'last_updated' : Timestamp,
}

export interface NewIntegrationApp {
  'id' : AppId,
  'name' : string,
  'description' : string,
  'category' : AppCategory,
  'verification_policy' : VerificationPolicy,
}

export interface NewActivityType {
  'app_id' : AppId,
  'type_key' : ActivityTypeKey,
  'type_label' : string,
  'description' : string,
  'fields' : Array<FieldDef>,
}

export interface NewActivityRecord {
  'profile_id' : ProfileId,
  'app_id' : AppId,
  'activity_type' : ActivityTypeKey,
  'amount' : [] | [number],
  'currency' : [] | [string],
  'event_timestamp' : Timestamp,
  'payload' : Array<MetadataEntry>,
  'schema_version' : bigint,
  'idempotency_key' : string,
  'attestation' : [] | [Attestation],
  'visibility' : Visibility,
}

export interface Canister {
  'desc' : string,
  'name' : string,
  'posts' : string,
  'canisterid' : Principal,
  'gallery' : string,
}
export interface Favorite {
  'owner' : Principal,
  'name' : string,
  'address' : string,
}
export interface Inbox { 'owner' : Principal, 'inboxid' : string }
export interface Link { 'url' : string, 'name' : string }
export type Network = { 'ic' : null } |
  { 'ethereum' : null } |
  { 'bitcoin' : null };
export interface NewProfile {
  'id' : string,
  'bio' : string,
  'pfp' : string,
  'name' : string,
}
export interface Profile {
  'id' : string,
  'bio' : string,
  'pfp' : string,
  'owner' : Principal,
  'name' : string,
  'createtime' : bigint,
  'links' : Array<Link>,
  'blocks' : Array<BlockId>,
  'traits' : Array<TraitId>,
  'visibility' : Visibility,
  'last_updated' : Timestamp,
}
export type Result = { 'ok' : bigint } |
  { 'err' : string };
export type Result_1 = { 'ok' : Favorite } |
  { 'err' : string };
export type Result_2 = { 'ok' : string } |
  { 'err' : string };
export interface UpdateProfile {
  'bio' : string,
  'pfp' : string,
  'name' : string,
}
export interface Wallet {
  'name' : string,
  'addresses' : Array<{ 'network' : Network, 'address' : string }>,
}
export interface _SERVICE {
  'addAdmin' : ActorMethod<[string], Result>,
  'addFavorite' : ActorMethod<
    [{ 'name' : string, 'address' : string }],
    Result_1
  >,
  'addInbox' : ActorMethod<[string], Result>,
  'addLink' : ActorMethod<[string, Link], Result>,
  'addWallet' : ActorMethod<[string, Wallet], Result>,
  'availableCycles' : ActorMethod<[], bigint>,
  'changeId' : ActorMethod<[string, string], Result>,
  'connectApp' : ActorMethod<[AppId, string, Array<string>], Result>,
  'createBlock' : ActorMethod<[NewBlock], Result_2>,
  'createProfile' : ActorMethod<[NewProfile], Result>,
  'createTrait' : ActorMethod<[string, NewTrait], Result_2>,
  'deleteLink' : ActorMethod<[string, string], Result>,
  'editCanister' : ActorMethod<[Canister], Result>,
  'getActivityType' : ActorMethod<[AppId, ActivityTypeKey], [] | [ActivityType]>,
  'getActivityRecord' : ActorMethod<[RecordId], [] | [ActivityRecord]>,
  'getActivityRecords' : ActorMethod<[ProfileId, [] | [AppId], [] | [ActivityTypeKey]], Array<ActivityRecord>>,
  'getApp' : ActorMethod<[AppId], [] | [IntegrationApp]>,
  'getBlock' : ActorMethod<[BlockId], [] | [Block]>,
  'getChain' : ActorMethod<[string], Array<Block>>,
  'getConnection' : ActorMethod<[ProfileId, AppId], [] | [IntegrationConnection]>,
  'getDefaultProfiles' : ActorMethod<[bigint], Array<Profile>>,
  'getDerivedSummary' : ActorMethod<[ProfileId, AppId, ActivityTypeKey], [] | [DerivedSummary]>,
  'getInbox' : ActorMethod<[string], [] | [Inbox]>,
  'getMyCanister' : ActorMethod<[], [] | [Canister]>,
  'getMyFavorites' : ActorMethod<[], Array<Favorite>>,
  'getMyInbox' : ActorMethod<[], [] | [Inbox]>,
  'getMyProfile' : ActorMethod<[], [] | [Profile]>,
  'getProfile' : ActorMethod<[string], [] | [Profile]>,
  'getProfileByPrincipal' : ActorMethod<[string], [] | [Profile]>,
  'getProfileCanister' : ActorMethod<[Principal], [] | [Canister]>,
  'getProfileCount' : ActorMethod<[], bigint>,
  'getProfiles' : ActorMethod<[bigint, bigint], Array<Profile>>,
  'getTrait' : ActorMethod<[TraitId], [] | [Trait]>,
  'getTraits' : ActorMethod<[string], Array<Trait>>,
  'listActivityTypes' : ActorMethod<[AppId], Array<ActivityType>>,
  'listApps' : ActorMethod<[], Array<IntegrationApp>>,
  'listBlocks' : ActorMethod<[string], Array<Block>>,
  'listConnections' : ActorMethod<[ProfileId], Array<IntegrationConnection>>,
  'registerActivityType' : ActorMethod<[NewActivityType], Result_2>,
  'registerApp' : ActorMethod<[NewIntegrationApp], Result_2>,
  'reserveid' : ActorMethod<[string], Result>,
  'revokeConnection' : ActorMethod<[AppId], Result>,
  'searchProfilesByName' : ActorMethod<[string], Array<Profile>>,
  'submitActivityRecord' : ActorMethod<[NewActivityRecord], Result_2>,
  'updateProfile' : ActorMethod<[string, UpdateProfile], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
