export const idlFactory = ({ IDL }) => {
  const Result = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
  const IdentityPrincipal = IDL.Text;
  const MetadataEntry = IDL.Record({ 'key' : IDL.Text, 'value' : IDL.Text });
  const FactorCategory = IDL.Variant({
    'existence' : IDL.Null,
    'social' : IDL.Null,
    'human' : IDL.Null,
    'reputation' : IDL.Null,
    'economic' : IDL.Null,
    'continuity' : IDL.Null,
  });
  const Timestamp = IDL.Int;
  const NewFactor = IDL.Record({
    'principal' : IdentityPrincipal,
    'verified' : IDL.Bool,
    'provider' : IDL.Text,
    'value' : IDL.Text,
    'metadata' : IDL.Vec(MetadataEntry),
    'factor_type' : IDL.Text,
    'reliability' : IDL.Float64,
    'weight_hint' : IDL.Float64,
    'category' : FactorCategory,
    'confidence' : IDL.Float64,
    'expires_at' : IDL.Opt(Timestamp),
  });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const Favorite = IDL.Record({
    'owner' : IDL.Principal,
    'name' : IDL.Text,
    'address' : IDL.Text,
  });
  const Result_4 = IDL.Variant({ 'ok' : Favorite, 'err' : IDL.Text });
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
  const EntityKind = IDL.Variant({
    'human' : IDL.Null,
    'hybrid' : IDL.Null,
    'organization' : IDL.Null,
    'ai_agent' : IDL.Null,
  });
  const NewIdentityGraph = IDL.Record({
    'principal' : IdentityPrincipal,
    'entity_kind' : EntityKind,
  });
  const PolicyWeights = IDL.Record({
    'existence' : IDL.Float64,
    'social' : IDL.Float64,
    'human' : IDL.Float64,
    'reputation' : IDL.Float64,
    'economic' : IDL.Float64,
    'continuity' : IDL.Float64,
  });
  const PolicyRequirements = IDL.Record({
    'min_wallet_age_days' : IDL.Opt(IDL.Nat),
    'min_trust_score' : IDL.Opt(IDL.Float64),
    'min_reputation_score' : IDL.Opt(IDL.Float64),
    'min_uniqueness_score' : IDL.Opt(IDL.Float64),
    'min_human_score' : IDL.Opt(IDL.Float64),
  });
  const PolicyId = IDL.Text;
  const NewContextPolicy = IDL.Record({
    'active' : IDL.Bool,
    'name' : IDL.Text,
    'description' : IDL.Text,
    'weights' : PolicyWeights,
    'decay_lambda' : IDL.Float64,
    'requirements' : PolicyRequirements,
    'policy_id' : PolicyId,
  });
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
  const PolicyEvaluationItem = IDL.Record({
    'key' : IDL.Text,
    'actual' : IDL.Text,
    'expected' : IDL.Text,
    'passed' : IDL.Bool,
  });
  const PolicyEvaluation = IDL.Record({
    'principal' : IdentityPrincipal,
    'items' : IDL.Vec(PolicyEvaluationItem),
    'evaluated_at' : Timestamp,
    'policy_id' : PolicyId,
    'passed' : IDL.Bool,
  });
  const Result_3 = IDL.Variant({ 'ok' : PolicyEvaluation, 'err' : IDL.Text });
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
  const TrustEdge = IDL.Record({
    'id' : IDL.Text,
    'updated_at' : Timestamp,
    'trust' : IDL.Float64,
    'to_principal' : IdentityPrincipal,
    'context' : IDL.Text,
    'created_at' : Timestamp,
    'from_principal' : IdentityPrincipal,
    'confidence' : IDL.Float64,
  });
  const ProviderStatus = IDL.Variant({
    'active' : IDL.Null,
    'suspended' : IDL.Null,
  });
  const ProviderCapability = IDL.Variant({
    'risk' : IDL.Null,
    'reputation' : IDL.Null,
    'factor' : IDL.Null,
  });
  const ProviderVerification = IDL.Variant({
    'none' : IDL.Null,
    'signed_payload' : IDL.Null,
    'idempotency_only' : IDL.Null,
  });
  const OipProvider = IDL.Record({
    'status' : ProviderStatus,
    'updated_at' : Timestamp,
    'capabilities' : IDL.Vec(ProviderCapability),
    'owner' : IDL.Principal,
    'name' : IDL.Text,
    'provider_id' : IDL.Text,
    'reliability' : IDL.Float64,
    'created_at' : Timestamp,
    'verification' : ProviderVerification,
  });
  const ProbabilityScores = IDL.Record({
    'human_score' : IDL.Float64,
    'updated_at' : Timestamp,
    'model_version' : IDL.Text,
    'uniqueness_score' : IDL.Float64,
    'trust_score' : IDL.Float64,
    'organization_probability' : IDL.Float64,
    'ai_probability' : IDL.Float64,
    'reputation_score' : IDL.Float64,
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
  const Result_2 = IDL.Variant({ 'ok' : ProbabilityScores, 'err' : IDL.Text });
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
  const NewOipProvider = IDL.Record({
    'capabilities' : IDL.Vec(ProviderCapability),
    'name' : IDL.Text,
    'provider_id' : IDL.Text,
    'reliability' : IDL.Float64,
    'verification' : ProviderVerification,
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
  const ProviderFactorSubmission = IDL.Record({
    'principal' : IdentityPrincipal,
    'value' : IDL.Text,
    'signed_payload' : IDL.Opt(IDL.Text),
    'factor_type' : IDL.Text,
    'provider_id' : IDL.Text,
    'reliability' : IDL.Opt(IDL.Float64),
    'weight_hint' : IDL.Float64,
    'category' : FactorCategory,
    'confidence' : IDL.Float64,
    'expires_at' : IDL.Opt(Timestamp),
    'idempotency_key' : IDL.Text,
  });
  const UpdateProfile = IDL.Record({
    'bio' : IDL.Text,
    'pfp' : IDL.Text,
    'name' : IDL.Text,
  });
  return IDL.Service({
    'addAdmin' : IDL.Func([IDL.Text], [Result], []),
    'addFactor' : IDL.Func([NewFactor], [Result_1], []),
    'addFavorite' : IDL.Func(
        [IDL.Record({ 'name' : IDL.Text, 'address' : IDL.Text })],
        [Result_4],
        [],
      ),
    'addFeaturedProfile' : IDL.Func([IDL.Text], [Result], []),
    'addLink' : IDL.Func([IDL.Text, Link], [Result], []),
    'addTrustEdge' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Float64, IDL.Float64],
        [Result],
        [],
      ),
    'addWallet' : IDL.Func([IDL.Text, Wallet], [Result], []),
    'availableCycles' : IDL.Func([], [IDL.Nat], ['query']),
    'changeId' : IDL.Func([IDL.Text, IDL.Text], [Result], []),
    'connectApp' : IDL.Func([AppId, IDL.Text, IDL.Vec(IDL.Text)], [Result], []),
    'createBlock' : IDL.Func([NewBlock], [Result_1], []),
    'createIdentityGraph' : IDL.Func([NewIdentityGraph], [Result], []),
    'createPolicy' : IDL.Func([NewContextPolicy], [Result], []),
    'createProfile' : IDL.Func([NewProfile], [Result], []),
    'createTrait' : IDL.Func([IDL.Text, NewTrait], [Result_1], []),
    'deleteLink' : IDL.Func([IDL.Text, IDL.Text], [Result], []),
    'evaluatePolicy' : IDL.Func([IDL.Text, IDL.Text], [Result_3], ['query']),
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
    'getInboundTrust' : IDL.Func([IDL.Text], [IDL.Vec(TrustEdge)], ['query']),
    'getMyFavorites' : IDL.Func([], [IDL.Vec(Favorite)], ['query']),
    'getMyProfile' : IDL.Func([], [IDL.Opt(Profile)], ['query']),
    'getOipProvider' : IDL.Func([IDL.Text], [IDL.Opt(OipProvider)], ['query']),
    'getProfile' : IDL.Func([IDL.Text], [IDL.Opt(Profile)], ['query']),
    'getProfileByPrincipal' : IDL.Func(
        [IDL.Text],
        [IDL.Opt(Profile)],
        ['query'],
      ),
    'getProfileCount' : IDL.Func([], [IDL.Nat], ['query']),
    'getProfiles' : IDL.Func([IDL.Nat, IDL.Nat], [IDL.Vec(Profile)], ['query']),
    'getScores' : IDL.Func([IDL.Text], [IDL.Opt(ProbabilityScores)], ['query']),
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
    'listOipProviders' : IDL.Func([], [IDL.Vec(OipProvider)], ['query']),
    'recomputeScores' : IDL.Func([IDL.Text, IDL.Opt(IDL.Text)], [Result_2], []),
    'registerActivityType' : IDL.Func([NewActivityType], [Result_1], []),
    'registerApp' : IDL.Func([NewIntegrationApp], [Result_1], []),
    'registerOipProvider' : IDL.Func([NewOipProvider], [Result], []),
    'removeFeaturedProfile' : IDL.Func([IDL.Text], [Result], []),
    'reserveid' : IDL.Func([IDL.Text], [Result], []),
    'revokeConnection' : IDL.Func([AppId], [Result], []),
    'runDecaySweep' : IDL.Func([], [IDL.Nat], []),
    'searchProfilesByName' : IDL.Func(
        [IDL.Text],
        [IDL.Vec(Profile)],
        ['query'],
      ),
    'setProviderStatus' : IDL.Func([IDL.Text, IDL.Bool], [Result], []),
    'submitActivityRecord' : IDL.Func([NewActivityRecord], [Result_1], []),
    'submitProviderFactor' : IDL.Func(
        [ProviderFactorSubmission],
        [Result_1],
        [],
      ),
    'updateProfile' : IDL.Func([IDL.Text, UpdateProfile], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
