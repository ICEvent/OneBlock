import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Int "mo:base/Int";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";
import TrieMap "mo:base/TrieMap";

persistent actor PersonalChain {
  public type Timestamp = Int;
  public type BlockId = Text;

  public type ProofLevel = {
    #self;
    #device;
    #app;
    #peer;
    #institution;
    #onchain;
  };

  public type Source = {
    app_id : Text;
    issuer : Text;
    external_id : Text;
  };

  public type Action = {
    action_type : Text;
    reference : Text;
  };

  public type Proof = {
    level : ProofLevel;
    proof_type : Text;
    issuer : Text;
    signature : ?Text;
  };

  public type ContentRef = {
    uri : Text;
    hash : Text;
  };

  public type Block = {
    id : BlockId;
    previous_block_id : ?BlockId;
    owner : Principal;
    timestamp : Timestamp;
    journey : Text;
    source : Source;
    action : Action;
    proof : Proof;
    content : ?ContentRef;
    payload_hash : Text;
    block_hash : Text;
    created_at : Timestamp;
  };

  public type NewBlock = {
    timestamp : Timestamp;
    journey : Text;
    source : Source;
    action : Action;
    proof : Proof;
    content : ?ContentRef;
    payload_hash : Text;
  };

  public type ChainHead = {
    owner : Principal;
    block_id : BlockId;
    block_hash : Text;
    height : Nat;
  };

  var stableBlocks : [(Text, Block)] = [];
  var stableOwnerIndex : [(Principal, [Text])] = [];
  var stableIdempotency : [(Text, Text)] = [];
  var blockCounter : Nat = 0;

  transient var blocks = TrieMap.TrieMap<Text, Block>(Text.equal, Text.hash);
  blocks := TrieMap.fromEntries(Iter.fromArray(stableBlocks), Text.equal, Text.hash);

  transient var ownerIndex = TrieMap.TrieMap<Principal, [Text]>(Principal.equal, Principal.hash);
  ownerIndex := TrieMap.fromEntries(Iter.fromArray(stableOwnerIndex), Principal.equal, Principal.hash);

  transient var idempotency = TrieMap.TrieMap<Text, Text>(Text.equal, Text.hash);
  idempotency := TrieMap.fromEntries(Iter.fromArray(stableIdempotency), Text.equal, Text.hash);

  system func preupgrade() {
    stableBlocks := Iter.toArray(blocks.entries());
    stableOwnerIndex := Iter.toArray(ownerIndex.entries());
    stableIdempotency := Iter.toArray(idempotency.entries());
  };

  system func postupgrade() {
    stableBlocks := [];
    stableOwnerIndex := [];
    stableIdempotency := [];
  };

  private func nextBlockId() : Text {
    blockCounter += 1;
    "ob_" # Nat.toText(blockCounter)
  };

  // Deterministic chain commitment. Replace with SHA-256 before production anchoring.
  private func commit(text : Text) : Text {
    "obc1:" # Nat.toText(Text.hash(text))
  };

  private func canonicalPayload(owner : Principal, previousHash : Text, input : NewBlock) : Text {
    Principal.toText(owner) # "|" # previousHash # "|" # Int.toText(input.timestamp) # "|" #
    input.journey # "|" # input.source.app_id # "|" # input.source.issuer # "|" # input.source.external_id # "|" #
    input.action.action_type # "|" # input.action.reference # "|" # input.proof.proof_type # "|" # input.proof.issuer # "|" #
    input.payload_hash
  };

  private func idemKey(owner : Principal, source : Source) : Text {
    Principal.toText(owner) # ":" # source.app_id # ":" # source.external_id
  };

  public shared ({ caller }) func append(input : NewBlock) : async Result.Result<Block, Text> {
    if (Principal.isAnonymous(caller)) return #err("authentication required");
    if (Text.size(input.journey) == 0) return #err("journey is required");
    if (Text.size(input.source.app_id) == 0 or Text.size(input.source.external_id) == 0) return #err("source identity is required");
    if (Text.size(input.action.action_type) == 0) return #err("action type is required");
    if (Text.size(input.payload_hash) == 0) return #err("payload_hash is required");

    let ik = idemKey(caller, input.source);
    switch (idempotency.get(ik)) {
      case (?existing) return #err("source event already recorded as " # existing);
      case null {};
    };

    let ids = switch (ownerIndex.get(caller)) { case (?xs) xs; case null [] };
    let previousId : ?Text = if (ids.size() == 0) null else ?ids[ids.size() - 1];
    let previousHash = switch (previousId) {
      case null "GENESIS";
      case (?id) switch (blocks.get(id)) { case (?b) b.block_hash; case null return #err("chain head missing") };
    };

    let id = nextBlockId();
    let now = Time.now();
    let blockHash = commit(id # "|" # canonicalPayload(caller, previousHash, input));
    let block : Block = {
      id;
      previous_block_id = previousId;
      owner = caller;
      timestamp = input.timestamp;
      journey = input.journey;
      source = input.source;
      action = input.action;
      proof = input.proof;
      content = input.content;
      payload_hash = input.payload_hash;
      block_hash = blockHash;
      created_at = now;
    };

    blocks.put(id, block);
    ownerIndex.put(caller, Array.append(ids, [id]));
    idempotency.put(ik, id);
    #ok(block)
  };

  public query func getBlock(id : BlockId) : async ?Block { blocks.get(id) };

  public query func getChain(owner : Principal) : async [Block] {
    let ids = switch (ownerIndex.get(owner)) { case (?xs) xs; case null [] };
    let out = Buffer.Buffer<Block>(ids.size());
    for (id in ids.vals()) switch (blocks.get(id)) { case (?b) out.add(b); case null {} };
    Buffer.toArray(out)
  };

  public query func getJourney(owner : Principal, journey : Text) : async [Block] {
    let ids = switch (ownerIndex.get(owner)) { case (?xs) xs; case null [] };
    let out = Buffer.Buffer<Block>(0);
    for (id in ids.vals()) switch (blocks.get(id)) {
      case (?b) if (b.journey == journey) out.add(b);
      case null {};
    };
    Buffer.toArray(out)
  };

  public query func getHead(owner : Principal) : async ?ChainHead {
    let ids = switch (ownerIndex.get(owner)) { case (?xs) xs; case null [] };
    if (ids.size() == 0) return null;
    let id = ids[ids.size() - 1];
    switch (blocks.get(id)) {
      case (?b) ?{ owner; block_id = id; block_hash = b.block_hash; height = ids.size() };
      case null null;
    }
  };

  public query func verifyChain(owner : Principal) : async Bool {
    let ids = switch (ownerIndex.get(owner)) { case (?xs) xs; case null [] };
    var expectedPrevious : ?Text = null;
    for (id in ids.vals()) {
      switch (blocks.get(id)) {
        case null return false;
        case (?b) {
          if (b.previous_block_id != expectedPrevious) return false;
          expectedPrevious := ?b.id;
        };
      };
    };
    true
  };
}