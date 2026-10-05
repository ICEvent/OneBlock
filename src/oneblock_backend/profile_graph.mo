import Principal "mo:base/Principal";

module {
  public type ClaimId = Text;
  public type ReviewId = Text;
  public type SignalId = Text;
  public type Timestamp = Int;

  public type Visibility = {
    #global;
    #unlisted;
    #personal;
  };

  // Where a profile fact came from. This is independent from how strongly it
  // was verified; provenance must never be collapsed into a single score.
  public type SourceKind = {
    #self_declared;
    #external;
    #peer;
    #derived;
  };

  public type VerificationMethod = {
    #none;
    #imported;
    #oauth;
    #signed;
    #onchain;
    #institutional;
    #system_derived;
    #custom : Text;
  };

  public type EvidenceRef = {
    schema : Text;
    uri : ?Text;
    hash : ?Text;
    external_id : ?Text;
  };

  public type Provenance = {
    source_kind : SourceKind;
    issuer : ?Principal;
    issuer_id : Text;
    verification : VerificationMethod;
    evidence : [EvidenceRef];
    observed_at : ?Timestamp;
    recorded_at : Timestamp;
  };

  // Capability paths are deliberately open and hierarchical. Examples:
  // "landscaping.hedge_trimming", "coding.react", "hiking.long_distance".
  public type CapabilityRef = {
    path : Text;
    display_label : ?Text;
  };

  public type ClaimValue = {
    #text : Text;
    #number : Float;
    #boolean : Bool;
    #reference : Text;
  };

  // Generic statement used by self-declared and externally attested profile data.
  public type ProfileClaim = {
    id : ClaimId;
    profile_id : Text;
    subject : Principal;
    predicate : Text;
    value : ClaimValue;
    capability : ?CapabilityRef;
    context : ?Text;
    provenance : Provenance;
    valid_from : ?Timestamp;
    valid_until : ?Timestamp;
    visibility : Visibility;
    created_at : Timestamp;
  };

  public type NewSelfClaim = {
    profile_id : Text;
    predicate : Text;
    value : ClaimValue;
    capability : ?CapabilityRef;
    context : ?Text;
    evidence : [EvidenceRef];
    valid_from : ?Timestamp;
    valid_until : ?Timestamp;
    visibility : Visibility;
  };

  public type ReviewRelationship = {
    #customer;
    #provider;
    #coworker;
    #collaborator;
    #manager;
    #peer;
    #participant;
    #other : Text;
  };

  public type ReviewStatus = {
    #active;
    #disputed;
    #withdrawn;
  };

  // Reviews are attestations in context, not global star ratings.
  public type PeerReview = {
    id : ReviewId;
    profile_id : Text;
    subject : Principal;
    reviewer : Principal;
    relationship : ReviewRelationship;
    capability : ?CapabilityRef;
    context : Text;
    assessment_tags : [Text];
    narrative : ?Text;
    evidence : [EvidenceRef];
    related_claims : [ClaimId];
    status : ReviewStatus;
    response : ?Text;
    visibility : Visibility;
    created_at : Timestamp;
    updated_at : Timestamp;
  };

  public type NewPeerReview = {
    profile_id : Text;
    relationship : ReviewRelationship;
    capability : ?CapabilityRef;
    context : Text;
    assessment_tags : [Text];
    narrative : ?Text;
    evidence : [EvidenceRef];
    related_claims : [ClaimId];
    visibility : Visibility;
  };

  public type SignalMethod = {
    model : Text;
    version : Text;
  };

  // Derived signals are rebuildable views above immutable claims/reviews.
  public type DerivedSignal = {
    id : SignalId;
    profile_id : Text;
    subject : Principal;
    signal_type : Text;
    capability : ?CapabilityRef;
    value : ClaimValue;
    confidence : ?Float;
    explanation : ?Text;
    derived_from_claims : [ClaimId];
    derived_from_reviews : [ReviewId];
    method : SignalMethod;
    computed_at : Timestamp;
  };
}
