export const idlFactory = ({ IDL }) => {
  const Result = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
  const Result_2 = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const Favorite = IDL.Record({
    'owner' : IDL.Principal,
    'name' : IDL.Text,
    'address' : IDL.Text,
  });
  const Result_1 = IDL.Variant({ 'ok' : Favorite, 'err' : IDL.Text });
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
  const NewProfile = IDL.Record({
    'id' : IDL.Text,
    'bio' : IDL.Text,
    'pfp' : IDL.Text,
    'name' : IDL.Text,
  });
  const Canister = IDL.Record({
    'desc' : IDL.Text,
    'name' : IDL.Text,
    'posts' : IDL.Text,
    'canisterid' : IDL.Principal,
    'gallery' : IDL.Text,
  });
  const Visibility = IDL.Variant({
    'global' : IDL.Null,
    'unlisted' : IDL.Null,
    'personal' : IDL.Null,
  });
  const Profile = IDL.Record({
    'id' : IDL.Text,
    'bio' : IDL.Text,
    'pfp' : IDL.Text,
    'owner' : IDL.Principal,
    'name' : IDL.Text,
    'createtime' : IDL.Int,
    'links' : IDL.Vec(Link),
    'blocks' : IDL.Vec(IDL.Text),
    'traits' : IDL.Vec(IDL.Text),
    'visibility' : Visibility,
    'last_updated' : IDL.Int,
  });
  const Inbox = IDL.Record({ 'owner' : IDL.Principal, 'inboxid' : IDL.Text });
  const UpdateProfile = IDL.Record({
    'bio' : IDL.Text,
    'pfp' : IDL.Text,
    'name' : IDL.Text,
  });
  const Strength = IDL.Variant({
    'low' : IDL.Null,
    'medium' : IDL.Null,
    'high' : IDL.Null,
  });
  const NewBlock = IDL.Record({
    'profile_id' : IDL.Text,
    'start_time' : IDL.Int,
    'end_time' : IDL.Opt(IDL.Int),
    'evidence_refs' : IDL.Vec(IDL.Text),
    'narrative' : IDL.Opt(IDL.Text),
    'visibility' : Visibility,
  });
  const Block = IDL.Record({
    'id' : IDL.Text,
    'profile_id' : IDL.Text,
    'start_time' : IDL.Int,
    'end_time' : IDL.Opt(IDL.Int),
    'evidence_refs' : IDL.Vec(IDL.Text),
    'derived_traits' : IDL.Vec(IDL.Text),
    'narrative' : IDL.Opt(IDL.Text),
    'visibility' : Visibility,
    'hash' : IDL.Text,
    'created_at' : IDL.Int,
  });
  const NewTrait = IDL.Record({
    'tlabel' : IDL.Text,
    'strength' : Strength,
    'confidence' : IDL.Float64,
    'explanation' : IDL.Text,
    'derived_from' : IDL.Vec(IDL.Text),
    'visibility' : Visibility,
  });
  const Trait = IDL.Record({
    'id' : IDL.Text,
    'tlabel' : IDL.Text,
    'strength' : Strength,
    'confidence' : IDL.Float64,
    'explanation' : IDL.Text,
    'derived_from' : IDL.Vec(IDL.Text),
    'visibility' : Visibility,
    'updated_at' : IDL.Int,
  });
  // Integration system types
  const AppCategory = IDL.Variant({
    'donation' : IDL.Null,
    'fitness' : IDL.Null,
    'education' : IDL.Null,
    'finance' : IDL.Null,
    'social' : IDL.Null,
    'other' : IDL.Null,
  });
  const VerificationPolicy = IDL.Variant({
    'none' : IDL.Null,
    'idempotency_only' : IDL.Null,
    'signed_payload' : IDL.Null,
  });
  const IntegrationApp = IDL.Record({
    'id' : IDL.Text,
    'name' : IDL.Text,
    'description' : IDL.Text,
    'category' : AppCategory,
    'owner' : IDL.Principal,
    'verification_policy' : VerificationPolicy,
    'schema_version' : IDL.Nat,
    'active' : IDL.Bool,
    'created_at' : IDL.Int,
  });
  const NewIntegrationApp = IDL.Record({
    'id' : IDL.Text,
    'name' : IDL.Text,
    'description' : IDL.Text,
    'category' : AppCategory,
    'verification_policy' : VerificationPolicy,
  });
  const ConnectionStatus = IDL.Variant({
    'active' : IDL.Null,
    'revoked' : IDL.Null,
    'pending' : IDL.Null,
  });
  const IntegrationConnection = IDL.Record({
    'profile_id' : IDL.Text,
    'app_id' : IDL.Text,
    'external_user_id' : IDL.Text,
    'scopes' : IDL.Vec(IDL.Text),
    'status' : ConnectionStatus,
    'created_at' : IDL.Int,
    'revoked_at' : IDL.Opt(IDL.Int),
  });
  const FieldDef = IDL.Record({
    'name' : IDL.Text,
    'field_type' : IDL.Text,
    'required' : IDL.Bool,
    'description' : IDL.Text,
  });
  const ActivityType = IDL.Record({
    'app_id' : IDL.Text,
    'type_key' : IDL.Text,
    'label' : IDL.Text,
    'description' : IDL.Text,
    'fields' : IDL.Vec(FieldDef),
    'version' : IDL.Nat,
    'created_at' : IDL.Int,
  });
  const NewActivityType = IDL.Record({
    'app_id' : IDL.Text,
    'type_key' : IDL.Text,
    'label' : IDL.Text,
    'description' : IDL.Text,
    'fields' : IDL.Vec(FieldDef),
  });
  const SignatureStatus = IDL.Variant({
    'unverified' : IDL.Null,
    'verified' : IDL.Null,
    'invalid' : IDL.Null,
  });
  const Attestation = IDL.Record({
    'tx_hash' : IDL.Opt(IDL.Text),
    'receipt_url' : IDL.Opt(IDL.Text),
    'signed_payload' : IDL.Opt(IDL.Text),
    'issuer' : IDL.Opt(IDL.Text),
    'signature_status' : SignatureStatus,
  });
  const MetadataEntry = IDL.Record({
    'key' : IDL.Text,
    'value' : IDL.Text,
  });
  const VerificationLevel = IDL.Variant({
    'self' : IDL.Null,
    'platform' : IDL.Null,
    'verifiable' : IDL.Null,
    'third_party' : IDL.Null,
  });
  const ActivityRecord = IDL.Record({
    'id' : IDL.Text,
    'profile_id' : IDL.Text,
    'app_id' : IDL.Text,
    'activity_type' : IDL.Text,
    'amount' : IDL.Opt(IDL.Float64),
    'currency' : IDL.Opt(IDL.Text),
    'event_timestamp' : IDL.Int,
    'ingest_timestamp' : IDL.Int,
    'payload' : IDL.Vec(MetadataEntry),
    'schema_version' : IDL.Nat,
    'idempotency_key' : IDL.Text,
    'attestation' : IDL.Opt(Attestation),
    'verification_level' : VerificationLevel,
    'visibility' : Visibility,
    'hash' : IDL.Text,
  });
  const NewActivityRecord = IDL.Record({
    'profile_id' : IDL.Text,
    'app_id' : IDL.Text,
    'activity_type' : IDL.Text,
    'amount' : IDL.Opt(IDL.Float64),
    'currency' : IDL.Opt(IDL.Text),
    'event_timestamp' : IDL.Int,
    'payload' : IDL.Vec(MetadataEntry),
    'schema_version' : IDL.Nat,
    'idempotency_key' : IDL.Text,
    'attestation' : IDL.Opt(Attestation),
    'visibility' : Visibility,
  });
  const DerivedSummary = IDL.Record({
    'profile_id' : IDL.Text,
    'app_id' : IDL.Text,
    'activity_type' : IDL.Text,
    'record_count' : IDL.Nat,
    'total_amount' : IDL.Opt(IDL.Float64),
    'currency' : IDL.Opt(IDL.Text),
    'last_updated' : IDL.Int,
  });
  return IDL.Service({
    'addAdmin' : IDL.Func([IDL.Text], [Result], []),
    'addFavorite' : IDL.Func(
        [IDL.Record({ 'name' : IDL.Text, 'address' : IDL.Text })],
        [Result_1],
        [],
      ),
    'addFeaturedProfile' : IDL.Func([IDL.Text], [Result], []),
    'addInbox' : IDL.Func([IDL.Text], [Result], []),
    'addLink' : IDL.Func([IDL.Text, Link], [Result], []),
    'addWallet' : IDL.Func([IDL.Text, Wallet], [Result], []),
    'availableCycles' : IDL.Func([], [IDL.Nat], ['query']),
    'changeId' : IDL.Func([IDL.Text, IDL.Text], [Result], []),
    'connectApp' : IDL.Func([IDL.Text, IDL.Text, IDL.Vec(IDL.Text)], [Result], []),
    'createBlock' : IDL.Func([NewBlock], [Result_2], []),
    'createProfile' : IDL.Func([NewProfile], [Result], []),
    'createTrait' : IDL.Func([IDL.Text, NewTrait], [Result_2], []),
    'deleteLink' : IDL.Func([IDL.Text, IDL.Text], [Result], []),
    'editCanister' : IDL.Func([Canister], [Result], []),
    'getActivityType' : IDL.Func([IDL.Text, IDL.Text], [IDL.Opt(ActivityType)], ['query']),
    'getActivityRecord' : IDL.Func([IDL.Text], [IDL.Opt(ActivityRecord)], ['query']),
    'getActivityRecords' : IDL.Func(
        [IDL.Text, IDL.Opt(IDL.Text), IDL.Opt(IDL.Text)],
        [IDL.Vec(ActivityRecord)],
        ['query'],
      ),
    'getApp' : IDL.Func([IDL.Text], [IDL.Opt(IntegrationApp)], ['query']),
    'getBlock' : IDL.Func([IDL.Text], [IDL.Opt(Block)], ['query']),
    'getChain' : IDL.Func([IDL.Text], [IDL.Vec(Block)], ['query']),
    'getConnection' : IDL.Func(
        [IDL.Text, IDL.Text],
        [IDL.Opt(IntegrationConnection)],
        ['query'],
      ),
    'getDefaultProfiles' : IDL.Func([IDL.Nat], [IDL.Vec(Profile)], ['query']),
    'getDerivedSummary' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text],
        [IDL.Opt(DerivedSummary)],
        ['query'],
      ),
    'getInbox' : IDL.Func([IDL.Text], [IDL.Opt(Inbox)], ['query']),
    'getMyCanister' : IDL.Func([], [IDL.Opt(Canister)], ['query']),
    'getMyFavorites' : IDL.Func([], [IDL.Vec(Favorite)], ['query']),
    'getMyInbox' : IDL.Func([], [IDL.Opt(Inbox)], ['query']),
    'getMyProfile' : IDL.Func([], [IDL.Opt(Profile)], ['query']),
    'getProfile' : IDL.Func([IDL.Text], [IDL.Opt(Profile)], ['query']),
    'getProfileByPrincipal' : IDL.Func(
        [IDL.Text],
        [IDL.Opt(Profile)],
        ['query'],
      ),
    'getProfileCanister' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(Canister)],
        ['query'],
      ),
    'getProfileCount' : IDL.Func([], [IDL.Nat], ['query']),
    'getProfiles' : IDL.Func([IDL.Nat, IDL.Nat], [IDL.Vec(Profile)], ['query']),
    'getTrait' : IDL.Func([IDL.Text], [IDL.Opt(Trait)], ['query']),
    'getTraits' : IDL.Func([IDL.Text], [IDL.Vec(Trait)], ['query']),
    'listActivityTypes' : IDL.Func([IDL.Text], [IDL.Vec(ActivityType)], ['query']),
    'listApps' : IDL.Func([], [IDL.Vec(IntegrationApp)], ['query']),
    'listBlocks' : IDL.Func([IDL.Text], [IDL.Vec(Block)], ['query']),
    'listConnections' : IDL.Func([IDL.Text], [IDL.Vec(IntegrationConnection)], ['query']),
    'registerActivityType' : IDL.Func([NewActivityType], [Result_2], []),
    'registerApp' : IDL.Func([NewIntegrationApp], [Result_2], []),
    'removeFeaturedProfile' : IDL.Func([IDL.Text], [Result], []),
    'reserveid' : IDL.Func([IDL.Text], [Result], []),
    'revokeConnection' : IDL.Func([IDL.Text], [Result], []),
    'searchProfilesByName' : IDL.Func(
        [IDL.Text],
        [IDL.Vec(Profile)],
        ['query'],
      ),
    'submitActivityRecord' : IDL.Func([NewActivityRecord], [Result_2], []),
    'updateProfile' : IDL.Func([IDL.Text, UpdateProfile], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
