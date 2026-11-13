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
persistent actor class ProofRegistry(initialAdmin : Principal) = this {
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

  public type IssuerPolicy = {
    issuer : Principal;
    active : Bool;
    schema_limit : Nat;
    claim_limit : Nat;
    approved_at : Int;
  };
  // A holder explicitly authorizes exactly one complete claim digest and
  // pseudonymous subject commitment to a named approved issuer.
  public type HolderApproval = {
    holder : Principal;
    issuer : Principal;
    claim_sha256 : Blob;
    subject_commitment : Blob;
    expires_at : Int;
    approved_at : Int;
  };
  public type ConsentWithdrawal = {
    holder : Principal;
    issuer : Principal;
    claim_sha256 : Blob;
    at : Int;
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

  public type ClaimStatus = { #active; #revoked; #issuer_suspended; #consent_withdrawn };
  public type ClaimState = {
    attestation : Attestation;
    status : ClaimStatus;
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
  let approvalLimit : Nat = 4_000;
  let defaultSchemaLimit : Nat = 4;
  let defaultClaimLimit : Nat = 32;
  let maxClaimLimit : Nat = 128;
  let statusEventLimit : Nat = 2_000;

  // Persistent actor fields survive upgrades (orthogonal persistence).
  // No legacy OneBlock Profile or ActivityRecord state is read or mutated.
  var issuers : [Issuer] = [];
  var schemas : [Schema] = [];
  var attestations : [Attestation] = [];
  var statusEvents : [StatusEvent] = [];
  var administrator : Principal = initialAdmin;
  var pendingAdministrator : ?Principal = null;
  var issuerPolicies : [IssuerPolicy] = [];
  var approvals : [HolderApproval] = [];
  var withdrawals : [ConsentWithdrawal] = [];

  assert (not Principal.isAnonymous(administrator));

  // Stable certified map; per-key evidence is a 34-byte commitment+status.
  // Never put raw personal/business data in this public tree.
  let certifiedStore : CertTree.Store = CertTree.newStore();
  transient let certifiedTree = CertTree.Ops(certifiedStore);

  func admin(caller : Principal) : Bool { caller == administrator };

  func policyFor(issuer : Principal) : ?IssuerPolicy {
    for (policy in issuerPolicies.vals()) {
      if (policy.issuer == issuer) return ?policy;
    };
    null
  };

  func approved(issuer : Principal) : Bool {
    switch (policyFor(issuer)) {
      case (?p) p.active;
      case null false;
    }
  };

  func countIssuerSchemas(issuer : Principal) : Nat {
    var count = 0;
    for (item in schemas.vals()) { if (item.issuer == issuer) count += 1 };
    count
  };

  func countIssuerClaims(issuer : Principal) : Nat {
    var count = 0;
    for (item in attestations.vals()) { if (item.issuer == issuer) count += 1 };
    count
  };

  func isWithdrawn(issuer : Principal, digest : Blob) : Bool {
    for (event in withdrawals.vals()) {
      if (event.issuer == issuer and event.claim_sha256 == digest) return true;
    };
    false
  };

  func approvalFor(issuer : Principal, digest : Blob, subject : Blob) : ?HolderApproval {
    for (grant in approvals.vals()) {
      if (
        grant.issuer == issuer and grant.claim_sha256 == digest and
        grant.subject_commitment == subject
      ) return ?grant;
    };
    null
  };

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
  // Status: 0 active; 1 issuer-revoked; 2 issuer suspended; 3 consent withdrawn
  // (also used conservatively for historical records without consent).
  func currentStatus(claim : Attestation) : ClaimStatus {
    if (statusFor(claim.id) != null) return #revoked;
    if (isWithdrawn(claim.issuer, claim.claim_sha256)) return #consent_withdrawn;
    if (approvalFor(claim.issuer, claim.claim_sha256, claim.subject_commitment) == null) return #consent_withdrawn;
    if (not approved(claim.issuer)) return #issuer_suspended;
    #active
  };

  func certifiedValue(claim : Attestation) : Blob {
    let statusByte : Nat8 = switch (currentStatus(claim)) {
      case (#active) 0;
      case (#revoked) 1;
      case (#issuer_suspended) 2;
      case (#consent_withdrawn) 3;
    };
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
        certifiedValue(claim),
      );
    };
    certifiedTree.setCertifiedData();
  };
  synchronizeCertifiedTree();

  func certifyAllForIssuer(issuer : Principal) {
    for (claim in attestations.vals()) {
      if (claim.issuer == issuer) {
        certifiedTree.put(claimPath(claim.id), certifiedValue(claim));
      }
    };
    certifiedTree.setCertifiedData();
  };

  func isDigest(value : Blob) : Bool {
    value.size() == 32
  };

  func validShortId(value : Text) : Bool {
    Text.size(value) > 0 and Text.size(value) <= 160
  };

  // Public event keys must be opaque identifiers; this cannot prove entropy
  // but prevents names, emails, account numbers and narrative text.
  func validOpaqueId(value : Text) : Bool {
    let size = Text.size(value);
    if (size != 32 and size != 64) return false;
    for (ch in Text.toIter(value)) {
      if (not (
        (ch >= '0' and ch <= '9') or
        (ch >= 'a' and ch <= 'f')
      )) return false;
    };
    true
  };

  func attestationId(principal : Principal, sourceEventId : Text) : Text {
    // Principal text is separator-free and immutable. Prefix is unambiguous
    // across issuers, and source_event_id uniqueness is scoped to caller.
    Principal.toText(principal) # "/" # sourceEventId
  };

  // No public self-registration: installation supplies the initial administrator.
  // Names remain administrative labels, NOT legal-identity verification.
  public shared ({ caller }) func registerIssuer(displayName : Text) : async Result.Result<Issuer, Text> {
    if (not admin(caller)) return #err("administrator approval required");
    authorizeIssuerInternal(caller, displayName)
  };

  func authorizeIssuerInternal(issuer : Principal, displayName : Text) : Result.Result<Issuer, Text> {
    if (Principal.isAnonymous(issuer)) return #err("anonymous issuer");
    if (Text.size(displayName) < 2 or Text.size(displayName) > 80) return #err("invalid display name");
    if (issuerFor(issuer) != null) return #err("issuer already registered");
    if (issuers.size() >= issuerLimit) return #err("issuer registry capacity reached");
    let item : Issuer = {
      issuer = issuer;
      display_name = displayName;
      registered_at = Time.now();
    };
    issuers := Array.append(issuers, [item]);
    issuerPolicies := Array.append(issuerPolicies, [{
      issuer = issuer;
      active = true;
      schema_limit = defaultSchemaLimit;
      claim_limit = defaultClaimLimit;
      approved_at = Time.now();
    }]);
    #ok(item)
  };

  public shared ({ caller }) func approveIssuer(issuer : Principal, displayName : Text) : async Result.Result<Issuer, Text> {
    if (not admin(caller)) return #err("administrator approval required");
    authorizeIssuerInternal(issuer, displayName)
  };

  public shared ({ caller }) func setIssuerActive(issuer : Principal, active : Bool) : async Result.Result<IssuerPolicy, Text> {
    if (not admin(caller)) return #err("administrator approval required");
    let old = switch (policyFor(issuer)) {
      case null return #err("issuer not registered");
      case (?p) p;
    };
    issuerPolicies := Array.map<IssuerPolicy, IssuerPolicy>(
      issuerPolicies,
      func(p : IssuerPolicy) : IssuerPolicy {
        if (p.issuer == issuer) { { p with active = active } } else p
      }
    );
    certifyAllForIssuer(issuer);
    #ok({ old with active = active })
  };

  // Explicit per-issuer quotas supplement fixed global staging caps.
  public shared ({ caller }) func setIssuerQuota(issuer : Principal, schemaLimit : Nat, claimLimit : Nat) : async Result.Result<IssuerPolicy, Text> {
    if (not admin(caller)) return #err("administrator approval required");
    if (schemaLimit == 0 or schemaLimit > 32 or claimLimit == 0 or claimLimit > maxClaimLimit) {
      return #err("quota out of bounded range")
    };
    let old = switch (policyFor(issuer)) {
      case null return #err("issuer not registered");
      case (?p) p;
    };
    issuerPolicies := Array.map<IssuerPolicy, IssuerPolicy>(
      issuerPolicies,
      func(p : IssuerPolicy) : IssuerPolicy {
        if (p.issuer == issuer) {
          { p with schema_limit = schemaLimit; claim_limit = claimLimit }
        } else p
      }
    );
    #ok({ old with schema_limit = schemaLimit; claim_limit = claimLimit })
  };

  public shared ({ caller }) func nominateAdministrator(successor : Principal) : async Result.Result<Principal, Text> {
    if (not admin(caller)) return #err("administrator approval required");
    if (Principal.isAnonymous(successor) or successor == administrator) return #err("invalid successor");
    pendingAdministrator := ?successor;
    #ok(successor)
  };

  public shared ({ caller }) func acceptAdministration() : async Result.Result<Principal, Text> {
    if (pendingAdministrator != ?caller) return #err("no pending appointment");
    administrator := caller;
    pendingAdministrator := null;
    #ok(caller)
  };

  public query func getIssuerPolicy(issuer : Principal) : async ?IssuerPolicy {
    policyFor(issuer)
  };

  // Authorization is holder-signed at the ICP caller level: the holder must
  // approve the EXACT full canonical claim digest before issuer submission.
  // The holder's principal is never exposed by public query APIs.
  public shared ({ caller }) func approveCommitment(
    issuer : Principal,
    claimHash : Blob,
    subjectHash : Blob,
    expiresAt : Int
  ) : async Result.Result<HolderApproval, Text> {
    if (not authenticated(caller)) return #err("anonymous holder");
    if (not approved(issuer)) return #err("issuer not approved or suspended");
    if (not isDigest(claimHash) or not isDigest(subjectHash)) return #err("invalid commitment");
    if (expiresAt <= Time.now() or expiresAt > Time.now() + 2_592_000_000_000_000) {
      return #err("consent submission window must be within 30 days");
    };
    if (isWithdrawn(issuer, claimHash)) return #err("withdrawn authorization cannot be reused; sign a new claim");
    if (approvalFor(issuer, claimHash, subjectHash) != null) return #err("already authorized");
    if (approvals.size() >= approvalLimit) return #err("authorization registry capacity reached");
    var holderCount : Nat = 0;
    for (grant in approvals.vals()) { if (grant.holder == caller) holderCount += 1 };
    if (holderCount >= 32) return #err("holder authorization quota reached");
    let approval : HolderApproval = {
      holder = caller;
      issuer = issuer;
      claim_sha256 = claimHash;
      subject_commitment = subjectHash;
      expires_at = expiresAt;
      approved_at = Time.now();
    };
    approvals := Array.append(approvals, [approval]);
    #ok(approval)
  };

  public shared ({ caller }) func withdrawConsent(issuer : Principal, claimHash : Blob) : async Result.Result<Nat, Text> {
    if (not authenticated(caller)) return #err("anonymous holder");
    if (not isDigest(claimHash)) return #err("invalid claim digest");
    var allowed = false;
    for (grant in approvals.vals()) {
      if (grant.holder == caller and grant.issuer == issuer and grant.claim_sha256 == claimHash) allowed := true;
    };
    if (not allowed) return #err("no authorization owned by caller");
    if (isWithdrawn(issuer, claimHash)) return #err("already withdrawn");
    withdrawals := Array.append(withdrawals, [{ holder = caller; issuer = issuer; claim_sha256 = claimHash; at = Time.now() }]);
    certifyAllForIssuer(issuer);
    #ok(1)
  };

  // Registry metadata only: cannot independently verify remote schema bytes.
  public shared ({ caller }) func registerSchema(schemaId : Text, schemaHash : Blob) : async Result.Result<Schema, Text> {
    if (not authenticated(caller)) return #err("anonymous caller");
    if (not approved(caller)) return #err("issuer not approved or suspended");
    if (not validShortId(schemaId)) return #err("invalid schema id");
    if (not isDigest(schemaHash)) return #err("schema hash must contain exactly 32 bytes");
    if (schemaFor(caller, schemaId) != null) return #err("schema id already registered; release a new version");
    if (schemas.size() >= schemaLimit) return #err("schema registry capacity reached");
    switch (policyFor(caller)) {
      case (?policy) { if (countIssuerSchemas(caller) >= policy.schema_limit) return #err("issuer schema quota reached") };
      case null return #err("issuer policy missing");
    };
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
    if (not approved(caller)) return #err("issuer not approved or suspended");
    if (schemaFor(caller, input.schema_id) == null) return #err("schema is not registered to caller");
    if (not validOpaqueId(input.source_event_id)) return #err("source_event_id must be 32 or 64 lowercase hex characters");
    if (not isDigest(input.claim_sha256)) return #err("claim hash must contain exactly 32 bytes");
    if (not isDigest(input.subject_commitment)) return #err("subject commitment must contain exactly 32 bytes");
    if (input.evidence_sha256.size() > evidenceLimit) return #err("too many evidence commitments");
    if (isWithdrawn(caller, input.claim_sha256)) return #err("holder withdrew consent for this digest");
    let consent = switch (approvalFor(caller, input.claim_sha256, input.subject_commitment)) {
      case null return #err("holder approval for exact claim digest is required");
      case (?approval) approval;
    };
    if (consent.expires_at < Time.now()) return #err("holder approval expired before submission");
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
    switch (policyFor(caller)) {
      case (?policy) { if (countIssuerClaims(caller) >= policy.claim_limit) return #err("issuer claim quota reached") };
      case null return #err("issuer policy missing");
    };
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
    certifiedTree.put(claimPath(id), certifiedValue(item));
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
    certifiedTree.put(claimPath(claimId), certifiedValue(claim));
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
          status = currentStatus(claim);
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
          status = currentStatus(claim);
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
