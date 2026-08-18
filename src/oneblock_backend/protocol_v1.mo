import Blob "mo:base/Blob";
import Nat8 "mo:base/Nat8";
import Principal "mo:base/Principal";
import Text "mo:base/Text";

module {
  public let VERSION : Nat = 1;

  public type BlockId = Text;
  public type Timestamp = Int;

  public type Action = {
    #created;
    #completed;
    #attended;
    #organized;
    #issued;
    #received;
    #transferred;
    #published;
    #contributed;
    #verified;
    #endorsed;
    #achieved;
    #custom : Text;
  };

  public type ObjectRef = {
    object_type : Text;
    uri : Text;
  };

  public type Evidence = {
    schema : Text;
    reference : ?Text;
    hash : Text;
  };

  public type VerificationClass = {
    #self_attested;
    #application_attested;
    #institution_attested;
    #cryptographically_verified;
  };

  public type Link = {
    relation : Text;
    target : Text;
  };

  public type Provenance = {
    verification : VerificationClass;
    signature : ?Text;
  };

  // The caller supplies the claim; OneBlock derives id, issuer and previous.
  public type NewBlock = {
    subject : Principal;
    action : Action;
    object : ObjectRef;
    timestamp : Timestamp;
    evidence : Evidence;
    links : [Link];
    provenance : Provenance;
  };

  public type Block = {
    version : Nat;
    id : BlockId;
    previous : ?BlockId;
    subject : Principal;
    issuer : Principal;
    action : Action;
    object : ObjectRef;
    timestamp : Timestamp;
    evidence : Evidence;
    links : [Link];
    provenance : Provenance;
    accepted_at : Timestamp;
  };

  public type IssuerStatus = { #active; #suspended; #revoked };

  public type Issuer = {
    principal : Principal;
    name : Text;
    schemas : [Text];
    status : IssuerStatus;
    institution : Bool;
    created_at : Timestamp;
  };

  public type Schema = {
    id : Text;
    description : Text;
    active : Bool;
    created_at : Timestamp;
  };

  public type AppendError = {
    #invalid_subject;
    #invalid_action;
    #invalid_object;
    #invalid_evidence;
    #unknown_schema;
    #issuer_not_registered;
    #issuer_not_active;
    #issuer_not_authorized_for_schema;
    #invalid_provenance;
    #duplicate_block;
  };

  public type AppendResult = { #ok : Block; #err : AppendError };

  public func actionText(action : Action) : Text {
    switch action {
      case (#created) "created";
      case (#completed) "completed";
      case (#attended) "attended";
      case (#organized) "organized";
      case (#issued) "issued";
      case (#received) "received";
      case (#transferred) "transferred";
      case (#published) "published";
      case (#contributed) "contributed";
      case (#verified) "verified";
      case (#endorsed) "endorsed";
      case (#achieved) "achieved";
      case (#custom(value)) "custom:" # value;
    }
  };

  private func optText(value : ?Text) : Text {
    switch value { case null ""; case (?v) v }
  };

  private func verificationText(value : VerificationClass) : Text {
    switch value {
      case (#self_attested) "self";
      case (#application_attested) "application";
      case (#institution_attested) "institution";
      case (#cryptographically_verified) "crypto";
    }
  };

  private func linkText(link : Link) : Text { link.relation # ">" # link.target };

  // Deterministic serialization used as the committed block header.
  // Length-prefixing prevents field-boundary ambiguity.
  public func canonicalHeader(
    previous : ?BlockId,
    subject : Principal,
    issuer : Principal,
    claim : NewBlock,
  ) : Text {
    var out = "";
    func add(value : Text) { out #= Nat.toText(Text.size(value)) # ":" # value };
    add(Nat.toText(VERSION));
    add(optText(previous));
    add(Principal.toText(subject));
    add(Principal.toText(issuer));
    add(actionText(claim.action));
    add(claim.object.object_type);
    add(claim.object.uri);
    add(Int.toText(claim.timestamp));
    add(claim.evidence.schema);
    add(optText(claim.evidence.reference));
    add(claim.evidence.hash);
    add(verificationText(claim.provenance.verification));
    add(optText(claim.provenance.signature));
    for (link in claim.links.vals()) { add(linkText(link)) };
    out
  };

  // Stable deterministic content identifier. This is deliberately isolated so
  // it can be upgraded to SHA-256 without changing append/validation semantics.
  public func contentId(header : Text) : BlockId {
    var hash : Nat32 = 2_166_136_261;
    for (c in Text.encodeUtf8(header).vals()) {
      hash := (hash ^ Nat32.fromNat(Nat8.toNat(c))) *% 16_777_619;
    };
    "ob1:" # Nat32.toText(hash)
  };
}
