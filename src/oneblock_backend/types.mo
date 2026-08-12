module {
    // ========== Core Type Aliases ==========
    public type BlockId = Text;
    public type ProfileId = Text;
    public type TraitId = Text;
    public type Timestamp = Int;

    // ========== Oneblock Protocol v0.1 ==========
    // Apps submit facts. The ledger creates chain metadata.
    public type AppId = Text;
    public type SchemaId = Text;
    public type JourneyId = Text;

    public type MetadataEntry = {
        key : Text;
        value : Text;
    };

    public type Block = {
        block_id : BlockId;
        prev_block_id : ?BlockId;
        prev_hash : ?Text;
        timestamp : Timestamp;

        profile_id : ProfileId;
        journey_id : ?JourneyId;

        app_id : AppId;
        producer : Principal;
        schema_id : SchemaId;
        external_id : Text;
        payload : [MetadataEntry];
        evidence_hash : ?Text;
        app_signature : ?Text;

        hash : Text;
    };

    // This is the only shape an application submits. Chain-owned fields are absent by design.
    public type SubmitEvent = {
        profile_id : ProfileId;
        journey_id : ?JourneyId;
        app_id : AppId;
        schema_id : SchemaId;
        external_id : Text;
        payload : [MetadataEntry];
        evidence_hash : ?Text;
        app_signature : ?Text;
    };

    public type Journey = {
        id : JourneyId;
        profile_id : ProfileId;
        title : Text;
        created_at : Timestamp;
        updated_at : Timestamp;
    };

    public type NewJourney = {
        profile_id : ProfileId;
        title : Text;
    };

    public type AppCategory = {
        #event;
        #activity;
        #creation;
        #contribution;
        #finance;
        #education;
        #social;
        #other;
    };

    public type VerificationPolicy = {
        #idempotency_only;
        #signed_payload;
    };

    public type IntegrationApp = {
        id : AppId;
        name : Text;
        description : Text;
        category : AppCategory;
        owner : Principal;
        verification_policy : VerificationPolicy;
        active : Bool;
        created_at : Timestamp;
    };

    public type NewIntegrationApp = {
        id : AppId;
        name : Text;
        description : Text;
        category : AppCategory;
        verification_policy : VerificationPolicy;
    };

    public type ConnectionStatus = { #active; #revoked; #pending };

    public type IntegrationConnection = {
        profile_id : ProfileId;
        app_id : AppId;
        external_user_id : Text;
        scopes : [SchemaId];
        status : ConnectionStatus;
        created_at : Timestamp;
        revoked_at : ?Timestamp;
    };

    public type FieldDef = {
        name : Text;
        field_type : Text;
        required : Bool;
        description : Text;
    };

    public type EventSchema = {
        id : SchemaId;
        app_id : AppId;
        name : Text;
        description : Text;
        fields : [FieldDef];
        version : Nat;
        active : Bool;
        created_at : Timestamp;
    };

    public type NewEventSchema = {
        id : SchemaId;
        app_id : AppId;
        name : Text;
        description : Text;
        fields : [FieldDef];
        version : Nat;
    };

    public type SubmitError = {
        #unauthorized_app;
        #app_inactive;
        #connection_not_active;
        #schema_not_found;
        #schema_not_allowed;
        #invalid_payload : Text;
        #duplicate_external_id;
        #journey_not_found;
        #journey_profile_mismatch;
        #signature_required;
    };

    public type SubmitResult = {
        #ok : Block;
        #err : SubmitError;
    };

    // ========== Legacy profile shell ==========
    // Kept temporarily so the existing frontend/API can migrate incrementally.
    public type Visibility = { #global; #unlisted; #personal };
    public type VerificationLevel = { #self; #platform; #verifiable; #third_party };
    public type Strength = { #low; #medium; #high };

    public type Trait = {
        id : TraitId;
        tlabel : Text;
        strength : Strength;
        confidence : Float;
        explanation : Text;
        derived_from : [BlockId];
        visibility : Visibility;
        updated_at : Timestamp;
    };

    public type Profile = {
        id : ProfileId;
        name : Text;
        bio : Text;
        pfp : Text;
        links : [Link];
        blocks : [BlockId];
        traits : [TraitId];
        owner : Principal;
        createtime : Int;
        visibility : Visibility;
        last_updated : Timestamp;
    };

    public type NewProfile = { id : Text; name : Text; bio : Text; pfp : Text };
    public type UpdateProfile = { name : Text; bio : Text; pfp : Text };
    public type Link = { name : Text; url : Text };
    public type Wallet = { name : Text; addresses : [{ address : Text; network : Network }] };
    public type Network = { #ic; #ethereum; #bitcoin };
    public type Favorite = { owner : Principal; name : Text; address : Text };
    public type Inbox = { inboxid : Text; owner : Principal };
    public type Canister = { canisterid : Principal; name : Text; desc : Text; posts : Text; gallery : Text };

    // ========== OIP identity types ==========
    public type IdentityPrincipal = Text;
    public type FactorId = Text;
    public type PolicyId = Text;
    public type EntityKind = { #human; #ai_agent; #hybrid; #organization };
    public type FactorCategory = { #existence; #continuity; #human; #social; #economic; #reputation };
    public type FactorStatus = { #active; #revoked; #expired };

    public type Factor = {
        id : FactorId; principal : IdentityPrincipal; category : FactorCategory;
        factor_type : Text; provider : Text; value : Text; verified : Bool;
        confidence : Float; reliability : Float; weight_hint : Float;
        issued_at : Timestamp; updated_at : Timestamp; expires_at : ?Timestamp;
        revoked_at : ?Timestamp; status : FactorStatus; metadata : [MetadataEntry];
    };

    public type ProbabilityScores = {
        human_score : Float; uniqueness_score : Float; trust_score : Float;
        reputation_score : Float; ai_probability : Float; organization_probability : Float;
        updated_at : Timestamp; model_version : Text;
    };

    public type PolicyRequirements = {
        min_human_score : ?Float; min_uniqueness_score : ?Float; min_trust_score : ?Float;
        min_reputation_score : ?Float; min_wallet_age_days : ?Nat;
    };
    public type PolicyWeights = { existence : Float; continuity : Float; human : Float; social : Float; economic : Float; reputation : Float };
    public type ContextPolicy = {
        policy_id : PolicyId; name : Text; description : Text; requirements : PolicyRequirements;
        weights : PolicyWeights; decay_lambda : Float; active : Bool; created_at : Timestamp; updated_at : Timestamp;
    };
    public type FactorEventAction = { #created; #updated; #revoked; #expired; #recomputed };
    public type FactorEvent = {
        principal : IdentityPrincipal; factor_id : ?FactorId; action : FactorEventAction;
        reason : ?Text; triggered_by : Text; timestamp : Timestamp; metadata : [MetadataEntry];
    };
    public type IdentityGraph = {
        principal : IdentityPrincipal; entity_kind : EntityKind; factors : [Factor];
        scores : ProbabilityScores; history : [FactorEvent]; created_at : Timestamp; updated_at : Timestamp;
    };
    public type NewIdentityGraph = { principal : IdentityPrincipal; entity_kind : EntityKind };
    public type NewFactor = {
        principal : IdentityPrincipal; category : FactorCategory; factor_type : Text; provider : Text;
        value : Text; verified : Bool; confidence : Float; reliability : Float; weight_hint : Float;
        expires_at : ?Timestamp; metadata : [MetadataEntry];
    };
    public type NewContextPolicy = {
        policy_id : PolicyId; name : Text; description : Text; requirements : PolicyRequirements;
        weights : PolicyWeights; decay_lambda : Float; active : Bool;
    };
    public type TrustEdge = {
        id : Text; from_principal : IdentityPrincipal; to_principal : IdentityPrincipal;
        context : Text; trust : Float; confidence : Float; created_at : Timestamp; updated_at : Timestamp;
    };
    public type PolicyEvaluationItem = { key : Text; passed : Bool; expected : Text; actual : Text };
    public type PolicyEvaluation = {
        policy_id : PolicyId; principal : IdentityPrincipal; passed : Bool;
        items : [PolicyEvaluationItem]; evaluated_at : Timestamp;
    };

    public type ProviderStatus = { #active; #suspended };
    public type ProviderCapability = { #factor; #reputation; #risk };
    public type ProviderVerification = { #none; #idempotency_only; #signed_payload };
    public type OipProvider = {
        provider_id : Text; owner : Principal; name : Text; capabilities : [ProviderCapability];
        verification : ProviderVerification; reliability : Float; status : ProviderStatus;
        created_at : Timestamp; updated_at : Timestamp;
    };
    public type NewOipProvider = {
        provider_id : Text; name : Text; capabilities : [ProviderCapability];
        verification : ProviderVerification; reliability : Float;
    };
    public type ProviderFactorSubmission = {
        provider_id : Text; idempotency_key : Text; principal : IdentityPrincipal;
        category : FactorCategory; factor_type : Text; value : Text; confidence : Float;
        reliability : ?Float; weight_hint : Float; expires_at : ?Timestamp; signed_payload : ?Text;
    };
}
