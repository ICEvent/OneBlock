import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface ActivityRecord {
  'id' : RecordId,
  'activity_type' : ActivityTypeKey,
  'verification_level' : VerificationLevel,
  'hash' : string,
  'attestation' : [] | [Attestation],
  'schema_version' : bigint,
  'ingest_timestamp' : Timestamp,
  'app_id' : AppId,
  'currency' : [] | [string],
  'event_timestamp' : Timestamp,
  'visibility' : Visibility,
  'amount' : [] | [number],
  'profile_id' : ProfileId,
  'payload' : Array<MetadataEntry>,
  'idempotency_key' : string,
}
export interface ActivityType {
  'description' : string,
  'created_at' : Timestamp,
  'version' : bigint,
  'fields' : Array<FieldDef>,
  'app_id' : AppId,
  'type_label' : string,
  'type_key' : ActivityTypeKey,
}
export type ActivityTypeKey = string;
export type AppCategory = { 'finance' : null } |
  { 'social' : null } |
  { 'other' : null } |
  { 'education' : null } |
  { 'donation' : null } |
  { 'fitness' : null };
export type AppId = string;
export interface Attestation {
  'signature_status' : SignatureStatus,
  'receipt_url' : [] | [string],
  'signed_payload' : [] | [string],
  'issuer' : [] | [string],
  'tx_hash' : [] | [string],
}
export interface Block {
  'id' : BlockId,
  'evidence_refs' : Array<string>,
  'hash' : string,
  'created_at' : Timestamp,
  'end_time' : [] | [Timestamp],
  'start_time' : Timestamp,
  'narrative' : [] | [string],
  'derived_traits' : Array<TraitId>,
  'visibility' : Visibility,
  'profile_id' : ProfileId,
}
export type BlockId = string;
export type ConnectionStatus = { 'active' : null } |
  { 'revoked' : null } |
  { 'pending' : null };
export interface DerivedSummary {
  'activity_type' : ActivityTypeKey,
  'total_amount' : [] | [number],
  'last_updated' : Timestamp,
  'app_id' : AppId,
  'currency' : [] | [string],
  'profile_id' : ProfileId,
  'record_count' : bigint,
}
export interface Favorite {
  'owner' : Principal,
  'name' : string,
  'address' : string,
}
export interface FieldDef {
  'field_type' : string,
  'name' : string,
  'description' : string,
  'required' : boolean,
}
export interface IntegrationApp {
  'id' : AppId,
  'active' : boolean,
  'owner' : Principal,
  'name' : string,
  'description' : string,
  'verification_policy' : VerificationPolicy,
  'created_at' : Timestamp,
  'schema_version' : bigint,
  'category' : AppCategory,
}
export interface IntegrationConnection {
  'status' : ConnectionStatus,
  'scopes' : Array<string>,
  'external_user_id' : string,
  'created_at' : Timestamp,
  'revoked_at' : [] | [Timestamp],
  'app_id' : AppId,
  'profile_id' : ProfileId,
}
export interface Link { 'url' : string, 'name' : string }
export interface MetadataEntry { 'key' : string, 'value' : string }
export type Network = { 'ic' : null } |
  { 'ethereum' : null } |
  { 'bitcoin' : null };
export interface NewActivityRecord {
  'activity_type' : ActivityTypeKey,
  'attestation' : [] | [Attestation],
  'schema_version' : bigint,
  'app_id' : AppId,
  'currency' : [] | [string],
  'event_timestamp' : Timestamp,
  'visibility' : Visibility,
  'amount' : [] | [number],
  'profile_id' : ProfileId,
  'payload' : Array<MetadataEntry>,
  'idempotency_key' : string,
}
export interface NewActivityType {
  'description' : string,
  'fields' : Array<FieldDef>,
  'app_id' : AppId,
  'type_label' : string,
  'type_key' : ActivityTypeKey,
}
export interface NewBlock {
  'evidence_refs' : Array<string>,
  'end_time' : [] | [Timestamp],
  'start_time' : Timestamp,
  'narrative' : [] | [string],
  'visibility' : Visibility,
  'profile_id' : ProfileId,
}
export interface NewIntegrationApp {
  'id' : AppId,
  'name' : string,
  'description' : string,
  'verification_policy' : VerificationPolicy,
  'category' : AppCategory,
}
export interface NewProfile {
  'id' : string,
  'bio' : string,
  'pfp' : string,
  'name' : string,
}
export interface NewTrait {
  'explanation' : string,
  'derived_from' : Array<BlockId>,
  'strength' : Strength,
  'confidence' : number,
  'tlabel' : string,
  'visibility' : Visibility,
}
export interface Profile {
  'id' : ProfileId,
  'bio' : string,
  'pfp' : string,
  'owner' : Principal,
  'traits' : Array<TraitId>,
  'name' : string,
  'last_updated' : Timestamp,
  'createtime' : bigint,
  'links' : Array<Link>,
  'blocks' : Array<BlockId>,
  'visibility' : Visibility,
}
export type ProfileId = string;
export type RecordId = string;
export type Result = { 'ok' : bigint } |
  { 'err' : string };
export type Result_1 = { 'ok' : string } |
  { 'err' : string };
export type Result_2 = { 'ok' : Favorite } |
  { 'err' : string };
export type SignatureStatus = { 'verified' : null } |
  { 'invalid' : null } |
  { 'unverified' : null };
export type Strength = { 'low' : null } |
  { 'high' : null } |
  { 'medium' : null };
export type Timestamp = bigint;
export interface Trait {
  'id' : TraitId,
  'updated_at' : Timestamp,
  'explanation' : string,
  'derived_from' : Array<BlockId>,
  'strength' : Strength,
  'confidence' : number,
  'tlabel' : string,
  'visibility' : Visibility,
}
export type TraitId = string;
export interface UpdateProfile {
  'bio' : string,
  'pfp' : string,
  'name' : string,
}
export type VerificationLevel = { 'self' : null } |
  { 'platform' : null } |
  { 'third_party' : null } |
  { 'verifiable' : null };
export type VerificationPolicy = { 'none' : null } |
  { 'signed_payload' : null } |
  { 'idempotency_only' : null };
export type Visibility = { 'personal' : null } |
  { 'global' : null } |
  { 'unlisted' : null };
export interface Wallet {
  'name' : string,
  'addresses' : Array<{ 'network' : Network, 'address' : string }>,
}
export interface _SERVICE {
  'addAdmin' : ActorMethod<[string], Result>,
  'addFavorite' : ActorMethod<
    [{ 'name' : string, 'address' : string }],
    Result_2
  >,
  'addFeaturedProfile' : ActorMethod<[string], Result>,
  'addLink' : ActorMethod<[string, Link], Result>,
  'addWallet' : ActorMethod<[string, Wallet], Result>,
  'availableCycles' : ActorMethod<[], bigint>,
  'changeId' : ActorMethod<[string, string], Result>,
  'connectApp' : ActorMethod<[AppId, string, Array<string>], Result>,
  'createBlock' : ActorMethod<[NewBlock], Result_1>,
  'createProfile' : ActorMethod<[NewProfile], Result>,
  'createTrait' : ActorMethod<[string, NewTrait], Result_1>,
  'deleteLink' : ActorMethod<[string, string], Result>,
  'getActivityRecord' : ActorMethod<[RecordId], [] | [ActivityRecord]>,
  'getActivityRecords' : ActorMethod<
    [ProfileId, [] | [AppId], [] | [ActivityTypeKey]],
    Array<ActivityRecord>
  >,
  'getActivityType' : ActorMethod<
    [AppId, ActivityTypeKey],
    [] | [ActivityType]
  >,
  'getApp' : ActorMethod<[AppId], [] | [IntegrationApp]>,
  'getBlock' : ActorMethod<[string], [] | [Block]>,
  'getChain' : ActorMethod<[string], Array<Block>>,
  'getConnection' : ActorMethod<
    [ProfileId, AppId],
    [] | [IntegrationConnection]
  >,
  'getDefaultProfiles' : ActorMethod<[bigint], Array<Profile>>,
  'getDerivedSummary' : ActorMethod<
    [ProfileId, AppId, ActivityTypeKey],
    [] | [DerivedSummary]
  >,
  'getMyFavorites' : ActorMethod<[], Array<Favorite>>,
  'getMyProfile' : ActorMethod<[], [] | [Profile]>,
  'getProfile' : ActorMethod<[string], [] | [Profile]>,
  'getProfileByPrincipal' : ActorMethod<[string], [] | [Profile]>,
  'getProfileCount' : ActorMethod<[], bigint>,
  'getProfiles' : ActorMethod<[bigint, bigint], Array<Profile>>,
  'getTrait' : ActorMethod<[string], [] | [Trait]>,
  'getTraits' : ActorMethod<[string], Array<Trait>>,
  'listActivityTypes' : ActorMethod<[AppId], Array<ActivityType>>,
  'listApps' : ActorMethod<[], Array<IntegrationApp>>,
  'listBlocks' : ActorMethod<[string], Array<Block>>,
  'listConnections' : ActorMethod<[ProfileId], Array<IntegrationConnection>>,
  'registerActivityType' : ActorMethod<[NewActivityType], Result_1>,
  'registerApp' : ActorMethod<[NewIntegrationApp], Result_1>,
  'removeFeaturedProfile' : ActorMethod<[string], Result>,
  'reserveid' : ActorMethod<[string], Result>,
  'revokeConnection' : ActorMethod<[AppId], Result>,
  'searchProfilesByName' : ActorMethod<[string], Array<Profile>>,
  'submitActivityRecord' : ActorMethod<[NewActivityRecord], Result_1>,
  'updateProfile' : ActorMethod<[string, UpdateProfile], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
