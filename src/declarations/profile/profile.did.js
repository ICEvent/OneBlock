export const idlFactory = ({ IDL }) => {
  const Result = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
  const Favorite = IDL.Record({
    'owner' : IDL.Principal,
    'name' : IDL.Text,
    'address' : IDL.Text,
  });
  const Result_2 = IDL.Variant({ 'ok' : Favorite, 'err' : IDL.Text });
  const Link = IDL.Record({ 'url' : IDL.Text, 'name' : IDL.Text });
  const Network = IDL.Variant({
    'ic' : IDL.Null,
    'ethereum' : IDL.Null,
    'bitcoin' : IDL.Null,
  });
  const Wallet = IDL.Record({
    'name' : IDL.Text,
    'addresses' : IDL.Vec(
      IDL.Record({ 'network' : Network, 'address' : IDL.Text })
    ),
  });
  const AppId = IDL.Text;
  const Timestamp = IDL.Int;
  const Visibility = IDL.Variant({
    'personal' : IDL.Null,
    'global' : IDL.Null,
    'unlisted' : IDL.Null,
  });
  const ProfileId = IDL.Text;
  const NewBlock = IDL.Record({
    'evidence_refs' : IDL.Vec(IDL.Text),
    'end_time' : IDL.Opt(Timestamp),
    'start_time' : Timestamp,
    'narrative' : IDL.Opt(IDL.Text),
    'visibility' : Visibility,
    'profile_id' : ProfileId,
  });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const NewProfile = IDL.Record({
    'id' : IDL.Text,
    'bio' : IDL.Text,
    'pfp' : IDL.Text,
    'name' : IDL.Text,
  });
  const BlockId = IDL.Text;
  const Strength = IDL.Variant({
    'low' : IDL.Null,
    'high' : IDL.Null,
    'medium' : IDL.Null,
  });
  const NewTrait = IDL.Record({
    'explanation' : IDL.Text,
    'derived_from' : IDL.Vec(BlockId),
    'strength' : Strength,
    'confidence' : IDL.Float64,
    'tlabel' : IDL.Text,
    'visibility' : Visibility,
  });
  const RecordId = IDL.Text;
  const ActivityTypeKey = IDL.Text;
  const VerificationLevel = IDL.Variant({
    'self' : IDL.Null,
    'platform' : IDL.Null,
    'third_party' : IDL.Null,
    'verifiable' : IDL.Null,
  });
  const SignatureStatus = IDL.Variant({
    'verified' : IDL.Null,
    'invalid' : IDL.Null,
    'unverified' : IDL.Null,
  });
  const Attestation = IDL.Record({
    'signature_status' : SignatureStatus,
    'receipt_url' : IDL.Opt(IDL.Text),
    'signed_payload' : IDL.Opt(IDL.Text),
    'issuer' : IDL.Opt(IDL.Text),
    'tx_hash' : IDL.Opt(IDL.Text),
  });
  const MetadataEntry = IDL.Record({ 'key' : IDL.Text, 'value' : IDL.Text });
  const ActivityRecord = IDL.Record({
    'id' : RecordId,
    'activity_type' : ActivityTypeKey,
    'verification_level' : VerificationLevel,
    'hash' : IDL.Text,
    'attestation' : IDL.Opt(Attestation),
    'schema_version' : IDL.Nat,
    'ingest_timestamp' : Timestamp,
    'app_id' : AppId,
    'currency' : IDL.Opt(IDL.Text),
    'event_timestamp' : Timestamp,
    'visibility' : Visibility,
    'amount' : IDL.Opt(IDL.Float64),
    'profile_id' : ProfileId,
    'payload' : IDL.Vec(MetadataEntry),
    'idempotency_key' : IDL.Text,
  });
  const FieldDef = IDL.Record({
    'field_type' : IDL.Text,
    'name' : IDL.Text,
    'description' : IDL.Text,
    'required' : IDL.Bool,
  });
  const ActivityType = IDL.Record({
    'description' : IDL.Text,
    'created_at' : Timestamp,
    'version' : IDL.Nat,
    'fields' : IDL.Vec(FieldDef),
    'app_id' : AppId,
    'type_label' : IDL.Text,
    'type_key' : ActivityTypeKey,
  });
  const VerificationPolicy = IDL.Variant({
    'none' : IDL.Null,
    'signed_payload' : IDL.Null,
    'idempotency_only' : IDL.Null,
  });
  const AppCategory = IDL.Variant({
    'finance' : IDL.Null,
    'social' : IDL.Null,
    'other' : IDL.Null,
    'education' : IDL.Null,
    'donation' : IDL.Null,
    'fitness' : IDL.Null,
  });
  const IntegrationApp = IDL.Record({
    'id' : AppId,
    'active' : IDL.Bool,
    'owner' : IDL.Principal,
    'name' : IDL.Text,
    'description' : IDL.Text,
    'verification_policy' : VerificationPolicy,
    'created_at' : Timestamp,
    'schema_version' : IDL.Nat,
    'category' : AppCategory,
  });
  const TraitId = IDL.Text;
  const Block = IDL.Record({
    'id' : BlockId,
    'evidence_refs' : IDL.Vec(IDL.Text),
    'hash' : IDL.Text,
    'created_at' : Timestamp,
    'end_time' : IDL.Opt(Timestamp),
    'start_time' : Timestamp,
    'narrative' : IDL.Opt(IDL.Text),
    'derived_traits' : IDL.Vec(TraitId),
    'visibility' : Visibility,
    'profile_id' : ProfileId,
  });
  const ConnectionStatus = IDL.Variant({
    'active' : IDL.Null,
    'revoked' : IDL.Null,
    'pending' : IDL.Null,
  });
  const IntegrationConnection = IDL.Record({
    'status' : ConnectionStatus,
    'scopes' : IDL.Vec(IDL.Text),
    'external_user_id' : IDL.Text,
    'created_at' : Timestamp,
    'revoked_at' : IDL.Opt(Timestamp),
    'app_id' : AppId,
    'profile_id' : ProfileId,
  });
  const Profile = IDL.Record({
    'id' : ProfileId,
    'bio' : IDL.Text,
    'pfp' : IDL.Text,
    'owner' : IDL.Principal,
    'traits' : IDL.Vec(TraitId),
    'name' : IDL.Text,
    'last_updated' : Timestamp,
    'createtime' : IDL.Int,
    'links' : IDL.Vec(Link),
    'blocks' : IDL.Vec(BlockId),
    'visibility' : Visibility,
  });
  const DerivedSummary = IDL.Record({
    'activity_type' : ActivityTypeKey,
    'total_amount' : IDL.Opt(IDL.Float64),
    'last_updated' : Timestamp,
    'app_id' : AppId,
    'currency' : IDL.Opt(IDL.Text),
    'profile_id' : ProfileId,
    'record_count' : IDL.Nat,
  });
  const Trait = IDL.Record({
    'id' : TraitId,
    'updated_at' : Timestamp,
    'explanation' : IDL.Text,
    'derived_from' : IDL.Vec(BlockId),
    'strength' : Strength,
    'confidence' : IDL.Float64,
    'tlabel' : IDL.Text,
    'visibility' : Visibility,
  });
  const NewActivityType = IDL.Record({
    'description' : IDL.Text,
    'fields' : IDL.Vec(FieldDef),
    'app_id' : AppId,
    'type_label' : IDL.Text,
    'type_key' : ActivityTypeKey,
  });
  const NewIntegrationApp = IDL.Record({
    'id' : AppId,
    'name' : IDL.Text,
    'description' : IDL.Text,
    'verification_policy' : VerificationPolicy,
    'category' : AppCategory,
  });
  const NewActivityRecord = IDL.Record({
    'activity_type' : ActivityTypeKey,
    'attestation' : IDL.Opt(Attestation),
    'schema_version' : IDL.Nat,
    'app_id' : AppId,
    'currency' : IDL.Opt(IDL.Text),
    'event_timestamp' : Timestamp,
    'visibility' : Visibility,
    'amount' : IDL.Opt(IDL.Float64),
    'profile_id' : ProfileId,
    'payload' : IDL.Vec(MetadataEntry),
    'idempotency_key' : IDL.Text,
  });
  const UpdateProfile = IDL.Record({
    'bio' : IDL.Text,
    'pfp' : IDL.Text,
    'name' : IDL.Text,
  });
  return IDL.Service({
    'addAdmin' : IDL.Func([IDL.Text], [Result], []),
    'addFavorite' : IDL.Func(
        [IDL.Record({ 'name' : IDL.Text, 'address' : IDL.Text })],
        [Result_2],
        [],
      ),
    'addFeaturedProfile' : IDL.Func([IDL.Text], [Result], []),
    'addLink' : IDL.Func([IDL.Text, Link], [Result], []),
    'addWallet' : IDL.Func([IDL.Text, Wallet], [Result], []),
    'availableCycles' : IDL.Func([], [IDL.Nat], ['query']),
    'changeId' : IDL.Func([IDL.Text, IDL.Text], [Result], []),
    'connectApp' : IDL.Func([AppId, IDL.Text, IDL.Vec(IDL.Text)], [Result], []),
    'createBlock' : IDL.Func([NewBlock], [Result_1], []),
    'createProfile' : IDL.Func([NewProfile], [Result], []),
    'createTrait' : IDL.Func([IDL.Text, NewTrait], [Result_1], []),
    'deleteLink' : IDL.Func([IDL.Text, IDL.Text], [Result], []),
    'getActivityRecord' : IDL.Func(
        [RecordId],
        [IDL.Opt(ActivityRecord)],
        ['query'],
      ),
    'getActivityRecords' : IDL.Func(
        [ProfileId, IDL.Opt(AppId), IDL.Opt(ActivityTypeKey)],
        [IDL.Vec(ActivityRecord)],
        ['query'],
      ),
    'getActivityType' : IDL.Func(
        [AppId, ActivityTypeKey],
        [IDL.Opt(ActivityType)],
        ['query'],
      ),
    'getApp' : IDL.Func([AppId], [IDL.Opt(IntegrationApp)], ['query']),
    'getBlock' : IDL.Func([IDL.Text], [IDL.Opt(Block)], ['query']),
    'getChain' : IDL.Func([IDL.Text], [IDL.Vec(Block)], ['query']),
    'getConnection' : IDL.Func(
        [ProfileId, AppId],
        [IDL.Opt(IntegrationConnection)],
        ['query'],
      ),
    'getDefaultProfiles' : IDL.Func([IDL.Nat], [IDL.Vec(Profile)], ['query']),
    'getDerivedSummary' : IDL.Func(
        [ProfileId, AppId, ActivityTypeKey],
        [IDL.Opt(DerivedSummary)],
        ['query'],
      ),
    'getMyFavorites' : IDL.Func([], [IDL.Vec(Favorite)], ['query']),
    'getMyProfile' : IDL.Func([], [IDL.Opt(Profile)], ['query']),
    'getProfile' : IDL.Func([IDL.Text], [IDL.Opt(Profile)], ['query']),
    'getProfileByPrincipal' : IDL.Func(
        [IDL.Text],
        [IDL.Opt(Profile)],
        ['query'],
      ),
    'getProfileCount' : IDL.Func([], [IDL.Nat], ['query']),
    'getProfiles' : IDL.Func([IDL.Nat, IDL.Nat], [IDL.Vec(Profile)], ['query']),
    'getTrait' : IDL.Func([IDL.Text], [IDL.Opt(Trait)], ['query']),
    'getTraits' : IDL.Func([IDL.Text], [IDL.Vec(Trait)], ['query']),
    'listActivityTypes' : IDL.Func([AppId], [IDL.Vec(ActivityType)], ['query']),
    'listApps' : IDL.Func([], [IDL.Vec(IntegrationApp)], ['query']),
    'listBlocks' : IDL.Func([IDL.Text], [IDL.Vec(Block)], ['query']),
    'listConnections' : IDL.Func(
        [ProfileId],
        [IDL.Vec(IntegrationConnection)],
        ['query'],
      ),
    'registerActivityType' : IDL.Func([NewActivityType], [Result_1], []),
    'registerApp' : IDL.Func([NewIntegrationApp], [Result_1], []),
    'removeFeaturedProfile' : IDL.Func([IDL.Text], [Result], []),
    'reserveid' : IDL.Func([IDL.Text], [Result], []),
    'revokeConnection' : IDL.Func([AppId], [Result], []),
    'searchProfilesByName' : IDL.Func(
        [IDL.Text],
        [IDL.Vec(Profile)],
        ['query'],
      ),
    'submitActivityRecord' : IDL.Func([NewActivityRecord], [Result_1], []),
    'updateProfile' : IDL.Func([IDL.Text, UpdateProfile], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
