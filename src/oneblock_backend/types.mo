
module {
    // ========== Core Type Aliases ==========
    public type BlockId = Text;
    public type ProfileId = Text;
    public type TraitId = Text;
    public type Timestamp = Int;

    // ========== Enums ==========
    public type Visibility = {
        #public;
        #unlisted;
        #private;
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
        label : Text;
        
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

    //satellite on Juno to store posts
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
        label : Text;
        strength : Strength;
        confidence : Float;
        explanation : Text;
        derived_from : [BlockId];
        visibility : Visibility;
    };
}
