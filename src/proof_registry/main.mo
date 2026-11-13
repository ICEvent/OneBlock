import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Nat8 "mo:base/Nat8";
import CertTree "mo:ic-certification/CertTree";
import CertifiedData "mo:base/CertifiedData";

// OVDP phase-1 registry: caller-bound issuer commitments.
// This is NOT a certified Merkle proof registry, signature validator,
// canonical JSON validator, or truth oracle. See docs/PROOF_REGISTRY_PHASE1.md.
persistent actor ProofRegistry {
  public type Issuer = {
    issuer : Principal;
    display_name : Text;
    registered_at : Int;
  };

  public type Schema = {
    issuer : Principal;
    schema_id : Text;
    schema_sha256 : Blob;
    registered_at : Int;
  };

  public type NewCommitment = {
    source_event_id : Text;
    schema_id : Text;
    // SHA-256 digest of the FULL canonical claim bytes, supplied by issuer.
    // The canister cannot recompute it because no original bytes are ingested.
    claim_sha256 : Blob;
    // Opaque, randomized commitment; never a plain user identifier.
    subject_commitment : Blob;
    evidence_sha256 : [Blob];
    event_at : Int;
  };

  public type Attestation = {
    id : Text;
    issuer : Principal;
    source_event_id : Text;
    schema_id : Text;
    claim_sha256 : Blob;
    subject_commitment : Blob;
    evidence_sha256 : [Blob];
    event_at : Int;
    accepted_at : Int;
  };

  public type StatusAction = { #revoked };
  public type StatusEvent = {
    claim_id : Text;
    issuer : Principal;
    action : StatusAction;
    reason_code : Text;
    at : Int;
    sequence : Nat;
  };

  public type ClaimState = {
    attestation : Attestation;
    status : { #active; #revoked };
    last_status_event : ?StatusEvent;
    // Always false in phase 1. A query response is not a certified proof.
    certified : Bool;
  };

  // Explicit caps until pagination, stable map indexes and storage accounting
  // are implemented. Avoids unbounded O(n) searches on public update methods.
  let issuerLimit : Nat = 128;
  let schemaLimit : Nat = 512;
  let claimLimit : Nat = 2_000;
  let evidenceLimit : Nat = 8;
  let statusEventLimit : Nat = 2_000;

  // Persistent actor fields survive upgrades (orthogonal persistence).
  // No legacy OneBlock Profile or ActivityRecord state is read or mutated.
  var issuers : [Issuer] = [];
  var schemas : [Schema] = [];
  var attestations : [Attestation] = [];
  var statusEvents : [StatusEvent] = [];

  // Stable certified map; per-key evidence is a 34-byte commitment+status.
  // Never put raw personal/business data in this public tree.
  let certifiedStore : CertTree.Store = CertTree.newStore();
  transient let certifiedTree = CertTree.Ops(certifiedStore);

  func authenticated(caller : Principal) : Bool {
    not Principal.isAnonymous(caller)
  };

  func issuerFor(principal : Principal) : ?Issuer {
    for (item in issuers.vals()) {
      if (item.issuer == principal) return ?item;
    };
    null
  };

  func schemaFor(principal : Principal, schemaId : Text) : ?Schema {
    for (item in schemas.vals()) {
      if (item.issuer == principal and item.schema_id == schemaId) return ?item;
    };
    null
  };

  func claimFor(claimId : Text) : ?Attestation {
    for (item in attestations.vals()) {
      if (item.id == claimId) return ?item;
    };
    null
  };

  func statusFor(claimId : Text) : ?StatusEvent {
    // Phase-1 only permits a terminal revocation, so no sorting needed.
    for (item in statusEvents.vals()) {
      if (item.claim_id == claimId) return ?item;
    };
    null
  };

  func claimPath(claimId : Text) : [Blob] {
    [Text.encodeUtf8("claims"), Text.encodeUtf8(claimId)]
  };

  // V1 wire value = version 0x01 || 32-byte SHA-256 claim commitment || status.
  // 0x00 active, 0x01 revoked. A signed digest alone is not proof of truth.
  func certifiedValue(claim : Attestation, revoked : Bool) : Blob {
    let statusByte : Nat8 = if (revoked) 1 else 0;
    Blob.fromArray(
      Array.append<Nat8>(
        [1],
        Array.append<Nat8>(Blob.toArray(claim.claim_sha256), [statusByte]),
      ),
    )
  };

  // On install/upgrade rebuild from persistent claims and revocations.
  // In particular this handles upgrades from phase 1 (without CertTree).
  func synchronizeCertifiedTree() {
    for (claim in attestations.vals()) {
      certifiedTree.put(
        claimPath(claim.id),
        certifiedValue(claim, statusFor(claim.id) != null),
      );
    };
    certifiedTree.setCertifiedData();
  };
  synchronizeCertifiedTree();

  func isDigest(value : Blob) : Bool {
    value.size() == 32
  };

  func validShortId(value : Text) : Bool {
    Text.size(value) > 0 and Text.size(value) <= 160
  };

  func attestationId(principal : Principal, sourceEventId : Text) : Text {
    // Principal text is separator-free and immutable. Prefix is unambiguous
    // across issuers, and source_event_id uniqueness is scoped to caller.
    Principal.toText(principal) # "/" # sourceEventId
  };

  // This binds the issuer ID to the actual ICP caller principal.
  // A display name is unverified and confers NO institutional standing.
  public shared ({ caller }) func registerIssuer(displayName : Text) : async Result.Result<Issuer, Text> {
    if (not authenticated(caller)) return #err("anonymous caller");
    if (Text.size(displayName) < 2 or Text.size(displayName) > 80) return #err("invalid display name");
    switch (issuerFor(caller)) {
      case (?_) return #err("issuer already registered");
      case null {};
    };
    if (issuers.size() >= issuerLimit) return #err("issuer registry capacity reached");
    let item : Issuer = {
      issuer = caller;
      display_name = displayName;
      registered_at = Time.now();
    };
    issuers := Array.append(issuers, [item]);
    #ok(item)
  };

  // Registry metadata only: cannot independently verify remote schema bytes.
  public shared ({ caller }) func registerSchema(schemaId : Text, schemaHash : Blob) : async Result.Result<Schema, Text> {
    if (not authenticated(caller)) return #err("anonymous caller");
    if (issuerFor(caller) == null) return #err("unregistered issuer");
    if (not validShortId(schemaId)) return #err("invalid schema id");
    if (not isDigest(schemaHash)) return #err("schema hash must contain exactly 32 bytes");
    if (schemaFor(caller, schemaId) != null) return #err("schema id already registered; release a new version");
    if (schemas.size() >= schemaLimit) return #err("schema registry capacity reached");
    let item : Schema = {
      issuer = caller;
      schema_id = schemaId;
      schema_sha256 = schemaHash;
      registered_at = Time.now();
    };
    schemas := Array.append(schemas, [item]);
    #ok(item)
  };

  // Only the registered issuer principal can submit its own commitments.
  // No claim body or private evidence is written to this canister.
  public shared ({ caller }) func submitCommitment(input : NewCommitment) : async Result.Result<Attestation, Text> {
    if (not authenticated(caller)) return #err("anonymous caller");
    if (issuerFor(caller) == null) return #err("unregistered issuer");
    if (schemaFor(caller, input.schema_id) == null) return #err("schema is not registered to caller");
    if (not validShortId(input.source_event_id)) return #err("invalid source event id");
    if (not isDigest(input.claim_sha256)) return #err("claim hash must contain exactly 32 bytes");
    if (not isDigest(input.subject_commitment)) return #err("subject commitment must contain exactly 32 bytes");
    if (input.evidence_sha256.size() > evidenceLimit) return #err("too many evidence commitments");
    for (hash in input.evidence_sha256.vals()) {
      if (not isDigest(hash)) return #err("evidence hash must contain exactly 32 bytes");
    };

    let id = attestationId(caller, input.source_event_id);
    switch (claimFor(id)) {
      case (?existing) {
        if (
          existing.schema_id == input.schema_id and
          existing.claim_sha256 == input.claim_sha256 and
          existing.subject_commitment == input.subject_commitment and
          existing.evidence_sha256 == input.evidence_sha256 and
          existing.event_at == input.event_at
        ) return #ok(existing);
        return #err("conflicting idempotency key: existing commitment cannot be overwritten");
      };
      case null {};
    };

    if (attestations.size() >= claimLimit) return #err("claim registry capacity reached");
    let item : Attestation = {
      id = id;
      issuer = caller;
      source_event_id = input.source_event_id;
      schema_id = input.schema_id;
      claim_sha256 = input.claim_sha256;
      subject_commitment = input.subject_commitment;
      evidence_sha256 = input.evidence_sha256;
      event_at = input.event_at;
      accepted_at = Time.now();
    };
    attestations := Array.append(attestations, [item]);
    certifiedTree.put(claimPath(id), certifiedValue(item, false));
    certifiedTree.setCertifiedData();
    #ok(item)
  };

  // Only the original issuer can append a terminal revocation.
  public shared ({ caller }) func revokeCommitment(claimId : Text, reasonCode : Text) : async Result.Result<StatusEvent, Text> {
    if (not authenticated(caller)) return #err("anonymous caller");
    let claim = switch (claimFor(claimId)) {
      case null return #err("claim not found");
      case (?item) item;
    };
    if (claim.issuer != caller) return #err("only the original issuer may revoke");
    if (statusFor(claimId) != null) return #err("already revoked");
    if (Text.size(reasonCode) == 0 or Text.size(reasonCode) > 80) return #err("invalid reason code");
    if (statusEvents.size() >= statusEventLimit) return #err("status registry capacity reached");

    let event : StatusEvent = {
      claim_id = claimId;
      issuer = caller;
      action = #revoked;
      reason_code = reasonCode;
      at = Time.now();
      sequence = statusEvents.size() + 1;
    };
    statusEvents := Array.append(statusEvents, [event]);
    certifiedTree.put(claimPath(claimId), certifiedValue(claim, true));
    certifiedTree.setCertifiedData();
    #ok(event)
  };

  public query func getIssuer(principal : Principal) : async ?Issuer {
    issuerFor(principal)
  };

  public query func getSchema(principal : Principal, schemaId : Text) : async ?Schema {
    schemaFor(principal, schemaId)
  };

  // Plain queries are NOT IC-certified. No signature/certificate is returned.
  public query func getClaimState(claimId : Text) : async ?ClaimState {
    switch (claimFor(claimId)) {
      case null null;
      case (?claim) {
        let statusEvent = statusFor(claimId);
        ?{
          attestation = claim;
          status = switch (statusEvent) {
            case null #active;
            case (?_) #revoked;
          };
          last_status_event = statusEvent;
          certified = false;
        }
      };
    }
  };

  // An update read goes through ICP consensus, but does not return an
  // offline-verifiable certified witness either.
  public shared func getClaimStateUpdate(claimId : Text) : async ?ClaimState {
    switch (claimFor(claimId)) {
      case null null;
      case (?claim) {
        let statusEvent = statusFor(claimId);
        ?{
          attestation = claim;
          status = switch (statusEvent) {
            case null #active;
            case (?_) #revoked;
          };
          last_status_event = statusEvent;
          certified = false;
        }
      };
    }
  };

  // Candid queries are only trustworthy after clients verify the
  // BLS certificate, Merkle witness and exact claim leaf contents.
  public query func getCertifiedClaim(claimId : Text) : async {
    value : ?Blob;
    certificate : ?Blob;
    witness : Blob;
  } {
    let path = claimPath(claimId);
    {
      value = certifiedTree.lookup(path);
      certificate = CertifiedData.getCertificate();
      witness = certifiedTree.encodeWitness(certifiedTree.reveal(path));
    }
  };

  public query func getRegistryCounts() : async { issuers : Nat; schemas : Nat; claims : Nat; status_events : Nat } {
    {
      issuers = issuers.size();
      schemas = schemas.size();
      claims = attestations.size();
      status_events = statusEvents.size();
    }
  };
};
