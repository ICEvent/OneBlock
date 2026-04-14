
module {
    // ========== Core Type Aliases ==========
    public type BlockId = Text;
    public type ProfileId = Text;
    public type TraitId = Text;
    public type Timestamp = Int;

    // ========== Enums ==========
    public type Visibility = {
        #global;
        #unlisted;
        #personal;
    };

    public type VerificationLevel = {
        #self;
        #platform;
        #verifiable;
        #third_party;
    };

    public type Strength = {
        #low;
        #medium;
        #high;
    };

    // ========== Block System Types ==========
    public type Block = {
        id : BlockId;
        profile_id : ProfileId;
        
        start_time : Timestamp;
        end_time : ?Timestamp;
        
        evidence_refs : [Text]; // e.g. alltrack://route/123, icevent://event/456
        derived_traits : [TraitId];
        
        narrative : ?Text;
        
        visibility : Visibility;
        
        hash : Text; // content hash for audit
        created_at : Timestamp;
    };

    public type Trait = {
        id : TraitId;
        tlabel : Text;
        
        strength : Strength;
        confidence : Float; // 0.0 to 1.0
        
        explanation : Text;
        derived_from : [BlockId];
        
        visibility : Visibility;
        updated_at : Timestamp;
    };

    // ========== Legacy Profile Types (Extended) ==========
    public type Profile = {
        id : ProfileId;
        
        // Display info
        name : Text;
        bio : Text;
        pfp : Text;
        
        // Legacy links
        links : [Link];
        
        // Block-chain system
        blocks : [BlockId];
        traits : [TraitId];
        
        // System fields
        owner : Principal;
        createtime : Int;
        visibility : Visibility;
        last_updated : Timestamp;
    };

    public type NewProfile = {
        id : Text;
        name : Text;
        bio : Text;
        pfp : Text
    };
    
    public type UpdateProfile = {
        name : Text;
        bio : Text;
        pfp : Text
    };
    
    public type Link = {
        name : Text;
        url : Text
    };

    public type Wallet = {
        name : Text;
        addresses : [{
            address : Text;
            network : Network
        }]
    };

    public type Network = {
        #ic;
        #ethereum;
        #bitcoin
    };

    public type Favorite = {
        owner: Principal;
        name: Text;
        address: Text;
    };

    public type Inbox = {
        inboxid: Text;
        owner: Principal;
    };

    public type Canister = {
        canisterid: Principal;
        name: Text;
        desc: Text;
        posts: Text;
        gallery: Text;
    };

    // ========== Input/Output Types ==========
    public type NewBlock = {
        profile_id : ProfileId;
        start_time : Timestamp;
        end_time : ?Timestamp;
        evidence_refs : [Text];
        narrative : ?Text;
        visibility : Visibility;
    };

    public type NewTrait = {
        tlabel : Text;
        strength : Strength;
        confidence : Float;
        explanation : Text;
        derived_from : [BlockId];
        visibility : Visibility;
    };

    // ========== Integration System ==========

    public type AppId = Text;
    public type ActivityTypeKey = Text; // e.g. "donation.made"
    public type RecordId = Text;

    public type AppCategory = {
        #donation;
        #fitness;
        #education;
        #finance;
        #social;
        #other;
    };

    public type VerificationPolicy = {
        #none;
        #idempotency_only;
        #signed_payload;
    };

    public type IntegrationApp = {
        id : AppId;
        name : Text;
        description : Text;
        category : AppCategory;
        owner : Principal; // principal of the app that is authorized to submit records
        verification_policy : VerificationPolicy;
        schema_version : Nat;
        active : Bool;
        created_at : Timestamp;
    };

    public type ConnectionStatus = {
        #active;
        #revoked;
        #pending;
    };

    // Links a OneBlock profile to a 3rd-party app user identity
    public type IntegrationConnection = {
        profile_id : ProfileId;
        app_id : AppId;
        external_user_id : Text; // the user's id inside the 3rd-party app
        scopes : [Text];         // permissions granted, e.g. ["donation.read"]
        status : ConnectionStatus;
        created_at : Timestamp;
        revoked_at : ?Timestamp;
    };

    // Describes the shape of a single event type emitted by an app
    public type FieldDef = {
        name : Text;
        field_type : Text;  // "text" | "nat" | "float" | "bool"
        required : Bool;
        description : Text;
    };

    public type ActivityType = {
        app_id : AppId;
        type_key : ActivityTypeKey; // e.g. "donation.made"
        label : Text;
        description : Text;
        fields : [FieldDef]; // schema for the payload entries
        version : Nat;
        created_at : Timestamp;
    };

    // Evidence / attestation attached to an activity record
    public type SignatureStatus = {
        #unverified;
        #verified;
        #invalid;
    };

    public type Attestation = {
        tx_hash : ?Text;
        receipt_url : ?Text;
        signed_payload : ?Text; // base64 or hex signed blob
        issuer : ?Text;         // who signed (principal text or app id)
        signature_status : SignatureStatus;
    };

    // Generic key-value entry for the extensible payload map
    public type MetadataEntry = {
        key : Text;
        value : Text;
    };

    // A single public activity event linked to a profile
    public type ActivityRecord = {
        id : RecordId;
        profile_id : ProfileId;
        app_id : AppId;
        activity_type : ActivityTypeKey;

        // Normalized queryable fields (null when not applicable)
        amount : ?Float;
        currency : ?Text;

        // When the event happened in the external app
        event_timestamp : Timestamp;
        // When it was ingested into OneBlock
        ingest_timestamp : Timestamp;

        // App-specific data as key-value pairs
        payload : [MetadataEntry];
        schema_version : Nat;

        // Idempotency key supplied by the app (app_id + external event id)
        idempotency_key : Text;

        attestation : ?Attestation;
        verification_level : VerificationLevel;
        visibility : Visibility;
        hash : Text;
    };

    // Per-(profile, app, activity_type) rollup recomputed on every submission
    public type DerivedSummary = {
        profile_id : ProfileId;
        app_id : AppId;
        activity_type : ActivityTypeKey;
        record_count : Nat;
        total_amount : ?Float;
        currency : ?Text;
        last_updated : Timestamp;
    };

    // ========== Integration Input Types ==========

    public type NewIntegrationApp = {
        id : AppId;
        name : Text;
        description : Text;
        category : AppCategory;
        verification_policy : VerificationPolicy;
    };

    public type NewActivityType = {
        app_id : AppId;
        type_key : ActivityTypeKey;
        label : Text;
        description : Text;
        fields : [FieldDef];
    };

    public type NewActivityRecord = {
        profile_id : ProfileId;
        app_id : AppId;
        activity_type : ActivityTypeKey;
        amount : ?Float;
        currency : ?Text;
        event_timestamp : Timestamp;
        payload : [MetadataEntry];
        schema_version : Nat;
        idempotency_key : Text; // must be unique per app; duplicate calls are rejected
        attestation : ?Attestation;
        visibility : Visibility;
    };
}
