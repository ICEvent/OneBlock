import Cycles "mo:base/ExperimentalCycles";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Int "mo:base/Int";
import Text "mo:base/Text";
import TrieMap "mo:base/TrieMap";
import Principal "mo:base/Principal";
import Iter "mo:base/Iter";
import Result "mo:base/Result";
import Time "mo:base/Time";
import Buffer "mo:base/Buffer";
import Array "mo:base/Array";
import Order "mo:base/Order";
import Float "mo:base/Float";
import Blob "mo:base/Blob";

import Types "types";
import ProfileGraph "profile_graph";

persistent actor {
    type Profile = Types.Profile;
    type Favorite = Types.Favorite;
    type Inbox = Types.Inbox;
    type Canister = Types.Canister;
    type Block = Types.Block;
    type Trait = Types.Trait;
    type NewBlock = Types.NewBlock;
    type NewTrait = Types.NewTrait;

    type AppId = Types.AppId;
    type ActivityTypeKey = Types.ActivityTypeKey;
    type RecordId = Types.RecordId;
    type ProfileId = Types.ProfileId;
    type IntegrationApp = Types.IntegrationApp;
    type IntegrationConnection = Types.IntegrationConnection;
    type ActivityType = Types.ActivityType;
    type ActivityRecord = Types.ActivityRecord;
    type Attestation = Types.Attestation;
    type MetadataEntry = Types.MetadataEntry;
    type DerivedSummary = Types.DerivedSummary;
    type NewIntegrationApp = Types.NewIntegrationApp;
    type NewActivityType = Types.NewActivityType;
    type NewActivityRecord = Types.NewActivityRecord;
    type IdentityGraph = Types.IdentityGraph;
    type NewIdentityGraph = Types.NewIdentityGraph;
    type Factor = Types.Factor;
    type NewFactor = Types.NewFactor;
    type ProbabilityScores = Types.ProbabilityScores;
    type ContextPolicy = Types.ContextPolicy;
    type NewContextPolicy = Types.NewContextPolicy;
    type PolicyEvaluation = Types.PolicyEvaluation;
    type PolicyEvaluationItem = Types.PolicyEvaluationItem;
    type PolicyWeights = Types.PolicyWeights;
    type TrustEdge = Types.TrustEdge;
    type OipProvider = Types.OipProvider;
    type NewOipProvider = Types.NewOipProvider;
    type ProviderFactorSubmission = Types.ProviderFactorSubmission;
    type ProfileClaim = ProfileGraph.ProfileClaim;
    type NewSelfClaim = ProfileGraph.NewSelfClaim;
    type PeerReview = ProfileGraph.PeerReview;
    type NewPeerReview = ProfileGraph.NewPeerReview;
    type ProfileClaimPage = { items : [ProfileClaim]; next_cursor : ?Nat };
    type PeerReviewPage = { items : [PeerReview]; next_cursor : ?Nat };
    type LegacyOwnershipEpoch = {
        legacy_profile_id : Text;
        current_profile_id : Text;
        subject : Principal;
        from_timestamp : Int;
        to_timestamp : ?Int;
    };

    var stableProfiles : [(Text, Profile)] = [];
    var stableFeaturedProfiles : [Profile] = [];
    var stableBlocks : [(Text, Block)] = [];
    var stableTraits : [(Text, Trait)] = [];

    var userProfiles : [(Principal, Text)] = [];
    var upgradeInboxes : [(Text, Inbox)] = [];
    var userWallets : [(Text, [Types.Wallet])] = [];
    var upgradeFavorites : [(Principal, [Favorite])] = [];
    var upgradeCanisters : [(Principal, Canister)] = [];

    var stableIntegrationApps : [(Text, IntegrationApp)] = [];
    var stableActivityTypes : [(Text, ActivityType)] = [];
    var stableConnections : [(Text, IntegrationConnection)] = [];
    var stableProfileConnectionIndex : [(Text, [Text])] = []; // profileId -> appIds
    // Immutable ownership metadata for connection epochs. This is kept
    // separately to avoid rewriting the legacy IntegrationConnection type.
    var stableConnectionSubjects : [(Text, Principal)] = [];
    var stableConnectionEpochStarts : [(Text, Int)] = [];
    var stableActivityRecords : [(Text, ActivityRecord)] = [];
    // Immutable subject binding for external activity evidence. Legacy records
    // without a binding are intentionally not projected until ownership can be
    // established safely.
    var stableActivityRecordSubjects : [(Text, Principal)] = [];
    var stableIdempotencyKeys : [(Text, Text)] = []; // idempotency_key -> record_id
    var stableProfileActivityIndex : [(Text, [Text])] = []; // profileId -> [recordId]
    var stableDerivedSummaries : [(Text, DerivedSummary)] = [];
    var stableProfileSummaryIndex : [(Text, [Text])] = []; // profileId -> summary keys
    var stableIdentityGraphs : [(Text, IdentityGraph)] = [];
    var stableContextPolicies : [(Text, ContextPolicy)] = [];
    var stableTrustEdges : [(Text, TrustEdge)] = [];
    var stableOipProviders : [(Text, OipProvider)] = [];

    // Additive profile graph state. Kept separate from legacy Profile/Block
    // storage so this can be deployed without rewriting existing stable data.
    var stableProfileClaims : [(Text, ProfileClaim)] = [];
    var stableProfileClaimIndex : [(Text, [Text])] = [];
    var stablePeerReviews : [(Text, PeerReview)] = [];
    var stableProfileReviewIndex : [(Text, [Text])] = [];
    var stableHistoricalProfileOwners : [(Text, Principal)] = [];
    var stableLegacyOwnershipEpochs : [LegacyOwnershipEpoch] = [];

    var reserveIds : [Text] = ["oneblock", "block", "about", "admin", "status", "update"];

    var _admins : [Text] = ["3z4ue-dry77-pvwdh-4ugn3-lu2wi-sbfp6-7xzaf-jupqw-vqiit-zi7m7-gae"];

    var blockIdCounter : Nat = 0;
    var traitIdCounter : Nat = 0;
    var activityRecordCounter : Nat = 0;
    var factorIdCounter : Nat = 0;
    var profileClaimCounter : Nat = 0;
    var peerReviewCounter : Nat = 0;

    transient var profiles = TrieMap.TrieMap<Text, Profile>(Text.equal, Text.hash);
    profiles := TrieMap.fromEntries<Text, Profile>(Iter.fromArray(stableProfiles), Text.equal, Text.hash);

    transient var blocks = TrieMap.TrieMap<Text, Block>(Text.equal, Text.hash);
    blocks := TrieMap.fromEntries<Text, Block>(Iter.fromArray(stableBlocks), Text.equal, Text.hash);

    transient var traits = TrieMap.TrieMap<Text, Trait>(Text.equal, Text.hash);
    traits := TrieMap.fromEntries<Text, Trait>(Iter.fromArray(stableTraits), Text.equal, Text.hash);

    transient var featuredProfiles = Buffer.Buffer<Profile>(0);

    transient var inboxes = TrieMap.TrieMap<Text, Inbox>(Text.equal, Text.hash);
    inboxes := TrieMap.fromEntries<Text, Inbox>(Iter.fromArray(upgradeInboxes), Text.equal, Text.hash);

    transient var userprofiles = TrieMap.TrieMap<Principal, Text>(Principal.equal, Principal.hash);
    userprofiles := TrieMap.fromEntries<Principal, Text>(Iter.fromArray(userProfiles), Principal.equal, Principal.hash);

    transient var wallets = TrieMap.TrieMap<Text, [Types.Wallet]>(Text.equal, Text.hash);
    wallets := TrieMap.fromEntries<Text, [Types.Wallet]>(Iter.fromArray(userWallets), Text.equal, Text.hash);

    transient var myFavorites = TrieMap.TrieMap<Principal, [Favorite]>(Principal.equal, Principal.hash);
    myFavorites := TrieMap.fromEntries<Principal, [Favorite]>(Iter.fromArray(upgradeFavorites), Principal.equal, Principal.hash);

    transient var myCanisters = TrieMap.TrieMap<Principal, Canister>(Principal.equal, Principal.hash);
    myCanisters := TrieMap.fromEntries<Principal, Canister>(Iter.fromArray(upgradeCanisters), Principal.equal, Principal.hash);

    transient var integrationApps = TrieMap.TrieMap<Text, IntegrationApp>(Text.equal, Text.hash);
    integrationApps := TrieMap.fromEntries<Text, IntegrationApp>(Iter.fromArray(stableIntegrationApps), Text.equal, Text.hash);

    transient var activityTypesMap = TrieMap.TrieMap<Text, ActivityType>(Text.equal, Text.hash);
    activityTypesMap := TrieMap.fromEntries<Text, ActivityType>(Iter.fromArray(stableActivityTypes), Text.equal, Text.hash);

    transient var connections = TrieMap.TrieMap<Text, IntegrationConnection>(Text.equal, Text.hash);
    connections := TrieMap.fromEntries<Text, IntegrationConnection>(Iter.fromArray(stableConnections), Text.equal, Text.hash);
    transient var profileConnectionIndex = TrieMap.TrieMap<Text, [Text]>(Text.equal, Text.hash);
    profileConnectionIndex := TrieMap.fromEntries<Text, [Text]>(Iter.fromArray(stableProfileConnectionIndex), Text.equal, Text.hash);

    transient var connectionSubjects = TrieMap.TrieMap<Text, Principal>(Text.equal, Text.hash);
    connectionSubjects := TrieMap.fromEntries<Text, Principal>(Iter.fromArray(stableConnectionSubjects), Text.equal, Text.hash);
    transient var connectionEpochStarts = TrieMap.TrieMap<Text, Int>(Text.equal, Text.hash);
    connectionEpochStarts := TrieMap.fromEntries<Text, Int>(Iter.fromArray(stableConnectionEpochStarts), Text.equal, Text.hash);

    transient var activityRecordsMap = TrieMap.TrieMap<Text, ActivityRecord>(Text.equal, Text.hash);
    activityRecordsMap := TrieMap.fromEntries<Text, ActivityRecord>(Iter.fromArray(stableActivityRecords), Text.equal, Text.hash);

    transient var activityRecordSubjects = TrieMap.TrieMap<Text, Principal>(Text.equal, Text.hash);
    activityRecordSubjects := TrieMap.fromEntries<Text, Principal>(Iter.fromArray(stableActivityRecordSubjects), Text.equal, Text.hash);

    transient var idempotencyKeys = TrieMap.TrieMap<Text, Text>(Text.equal, Text.hash);
    idempotencyKeys := TrieMap.fromEntries<Text, Text>(Iter.fromArray(stableIdempotencyKeys), Text.equal, Text.hash);

    transient var profileActivityIndex = TrieMap.TrieMap<Text, [Text]>(Text.equal, Text.hash);
    profileActivityIndex := TrieMap.fromEntries<Text, [Text]>(Iter.fromArray(stableProfileActivityIndex), Text.equal, Text.hash);

    transient var derivedSummaries = TrieMap.TrieMap<Text, DerivedSummary>(Text.equal, Text.hash);
    derivedSummaries := TrieMap.fromEntries<Text, DerivedSummary>(Iter.fromArray(stableDerivedSummaries), Text.equal, Text.hash);
    transient var profileSummaryIndex = TrieMap.TrieMap<Text, [Text]>(Text.equal, Text.hash);
    profileSummaryIndex := TrieMap.fromEntries<Text, [Text]>(Iter.fromArray(stableProfileSummaryIndex), Text.equal, Text.hash);
    transient var identityGraphs = TrieMap.TrieMap<Text, IdentityGraph>(Text.equal, Text.hash);
    identityGraphs := TrieMap.fromEntries<Text, IdentityGraph>(Iter.fromArray(stableIdentityGraphs), Text.equal, Text.hash);
    transient var contextPolicies = TrieMap.TrieMap<Text, ContextPolicy>(Text.equal, Text.hash);
    contextPolicies := TrieMap.fromEntries<Text, ContextPolicy>(Iter.fromArray(stableContextPolicies), Text.equal, Text.hash);
    transient var trustEdges = TrieMap.TrieMap<Text, TrustEdge>(Text.equal, Text.hash);
    trustEdges := TrieMap.fromEntries<Text, TrustEdge>(Iter.fromArray(stableTrustEdges), Text.equal, Text.hash);
    transient var oipProviders = TrieMap.TrieMap<Text, OipProvider>(Text.equal, Text.hash);
    oipProviders := TrieMap.fromEntries<Text, OipProvider>(Iter.fromArray(stableOipProviders), Text.equal, Text.hash);

    transient var profileClaims = TrieMap.TrieMap<Text, ProfileClaim>(Text.equal, Text.hash);
    profileClaims := TrieMap.fromEntries<Text, ProfileClaim>(Iter.fromArray(stableProfileClaims), Text.equal, Text.hash);
    transient var profileClaimIndex = TrieMap.TrieMap<Text, [Text]>(Text.equal, Text.hash);
    profileClaimIndex := TrieMap.fromEntries<Text, [Text]>(Iter.fromArray(stableProfileClaimIndex), Text.equal, Text.hash);
    transient var peerReviews = TrieMap.TrieMap<Text, PeerReview>(Text.equal, Text.hash);
    peerReviews := TrieMap.fromEntries<Text, PeerReview>(Iter.fromArray(stablePeerReviews), Text.equal, Text.hash);
    transient var profileReviewIndex = TrieMap.TrieMap<Text, [Text]>(Text.equal, Text.hash);
    profileReviewIndex := TrieMap.fromEntries<Text, [Text]>(Iter.fromArray(stableProfileReviewIndex), Text.equal, Text.hash);
    transient var historicalProfileOwners = TrieMap.TrieMap<Text, Principal>(Text.equal, Text.hash);
    historicalProfileOwners := TrieMap.fromEntries<Text, Principal>(Iter.fromArray(stableHistoricalProfileOwners), Text.equal, Text.hash);
    transient var legacyOwnershipEpochs = Buffer.fromArray<LegacyOwnershipEpoch>(stableLegacyOwnershipEpochs);

    private func mergeTextIndex(index : TrieMap.TrieMap<Text, [Text]>, fromId : Text, toId : Text) {
        switch (index.get(fromId)) {
            case null {};
            case (?fromIds) {
                let existing = switch (index.get(toId)) {
                    case (?ids) ids;
                    case null [];
                };
                let merged = Buffer.fromArray<Text>(existing);
                for (candidate in fromIds.vals()) {
                    if (Array.find<Text>(existing, func(id : Text) : Bool { id == candidate }) == null) {
                        merged.add(candidate)
                    }
                };
                index.put(toId, Buffer.toArray(merged))
            };
        }
    };

    private func timestampInEpoch(ts : Int, epoch : LegacyOwnershipEpoch) : Bool {
        if (ts < epoch.from_timestamp) { return false };
        switch (epoch.to_timestamp) {
            case null true;
            case (?until) ts <= until;
        }
    };

    private func applyLegacyOwnershipEpoch(epoch : LegacyOwnershipEpoch) {
        switch (profiles.get(epoch.current_profile_id)) {
            case null {};
            case (?profile) {
                if (profile.owner != epoch.subject) { return };
                // Never apply an epoch while the historical ID is active again.
                if (profiles.get(epoch.legacy_profile_id) != null) { return };
                historicalProfileOwners.put(epoch.legacy_profile_id, epoch.subject);
                let migratedIds = Buffer.Buffer<Text>(0);
                switch (profileActivityIndex.get(epoch.legacy_profile_id)) {
                    case null {};
                    case (?recordIds) {
                        for (recordId in recordIds.vals()) {
                            switch (activityRecordsMap.get(recordId)) {
                                case null {};
                                case (?record) {
                                    if (
                                        record.profile_id == epoch.legacy_profile_id and
                                        timestampInEpoch(record.ingest_timestamp, epoch)
                                    ) {
                                        let safelyBound = switch (activityRecordSubjects.get(recordId)) {
                                            case null {
                                                activityRecordSubjects.put(recordId, epoch.subject);
                                                true
                                            };
                                            case (?existing) {
                                                existing == epoch.subject
                                            };
                                        };
                                        if (safelyBound) {
                                            migratedIds.add(recordId)
                                        }
                                    }
                                };
                            }
                        }
                    };
                };
                if (migratedIds.size() > 0) {
                    let existing = switch (profileActivityIndex.get(epoch.current_profile_id)) {
                        case (?ids) ids;
                        case null [];
                    };
                    let merged = Buffer.fromArray<Text>(existing);
                    for (recordId in migratedIds.vals()) {
                        if (Array.find<Text>(existing, func(id : Text) : Bool { id == recordId }) == null) {
                            merged.add(recordId)
                        }
                    };
                    profileActivityIndex.put(epoch.current_profile_id, Buffer.toArray(merged));
                    rebuildDerivedSummariesForProfile(epoch.current_profile_id, epoch.subject)
                }
            };
        }
    };

    private func applyLegacyOwnershipEpochs() {
        for (epoch in legacyOwnershipEpochs.vals()) {
            applyLegacyOwnershipEpoch(epoch)
        }
    };

    private func rebuildIntegrationProfileIndexes() {
        // One-time upgrade repair for legacy state. Accumulate in mutable
        // buffers and materialize once per profile to keep this O(N).
        let connectionBuffers = TrieMap.TrieMap<Text, Buffer.Buffer<Text>>(Text.equal, Text.hash);
        for ((_, connection) in connections.entries()) {
            let buf = switch (connectionBuffers.get(connection.profile_id)) {
                case (?existing) existing;
                case null {
                    let created = Buffer.Buffer<Text>(1);
                    connectionBuffers.put(connection.profile_id, created);
                    created
                };
            };
            buf.add(connection.app_id)
        };
        for ((profileId, buf) in connectionBuffers.entries()) {
            profileConnectionIndex.put(profileId, Buffer.toArray(buf))
        };

        let summaryBuffers = TrieMap.TrieMap<Text, Buffer.Buffer<Text>>(Text.equal, Text.hash);
        for ((key, summary) in derivedSummaries.entries()) {
            let buf = switch (summaryBuffers.get(summary.profile_id)) {
                case (?existing) existing;
                case null {
                    let created = Buffer.Buffer<Text>(1);
                    summaryBuffers.put(summary.profile_id, created);
                    created
                };
            };
            buf.add(key)
        };
        for ((profileId, buf) in summaryBuffers.entries()) {
            profileSummaryIndex.put(profileId, Buffer.toArray(buf))
        }
    };

    private func backfillLegacyConnectionOwnership() {
        // For pre-upgrade state, only a connection created during the current
        // Profile instance can be attributed safely. Reconnects after this
        // release preserve the earliest epoch start instead of overwriting it.
        for ((key, connection) in connections.entries()) {
            if (connectionSubjects.get(key) == null) {
                switch (profiles.get(connection.profile_id)) {
                    case (?profile) {
                        if (connection.created_at >= profile.createtime) {
                            connectionSubjects.put(key, profile.owner);
                            connectionEpochStarts.put(key, connection.created_at)
                        }
                    };
                    case null {};
                }
            }
        }
    };

    private func backfillLegacyActivitySubjects() {
        // Precompute per-profile reuse once so upgrade work stays linear.
        let reusedProfiles = TrieMap.TrieMap<Text, Bool>(Text.equal, Text.hash);
        for ((profileId, recordIds) in profileActivityIndex.entries()) {
            switch (profiles.get(profileId)) {
                case null {};
                case (?profile) {
                    var reused = false;
                    label scan for (recordId in recordIds.vals()) {
                        switch (activityRecordsMap.get(recordId)) {
                            case (?record) {
                                if (record.ingest_timestamp < profile.createtime) {
                                    reused := true;
                                    break scan
                                }
                            };
                            case null {};
                        }
                    };
                    reusedProfiles.put(profileId, reused)
                };
            }
        };
        for ((_, connection) in connections.entries()) {
            switch (profiles.get(connection.profile_id)) {
                case (?profile) {
                    if (connection.created_at < profile.createtime) {
                        reusedProfiles.put(profile.id, true)
                    }
                };
                case null {};
            }
        };

        for ((recordId, record) in activityRecordsMap.entries()) {
            if (activityRecordSubjects.get(recordId) == null) {
                switch (profiles.get(record.profile_id)) {
                    case null {};
                    case (?profile) {
                        let key = connectionKey(record.profile_id, record.app_id);
                        switch (
                            connectionSubjects.get(key),
                            connectionEpochStarts.get(key)
                        ) {
                            case (?subject, ?epochStart) {
                                if (subject == profile.owner) {
                                    let reused = switch (reusedProfiles.get(profile.id)) {
                                        case (?value) value;
                                        case null false;
                                    };
                                    let belongsToCurrentInstance =
                                        record.ingest_timestamp >= profile.createtime;
                                    // For reused IDs, only the verified current-owner
                                    // connection epoch is safe. Records before that
                                    // boundary are irrecoverably ambiguous in legacy
                                    // state and remain quarantined.
                                    if (
                                        belongsToCurrentInstance and
                                        (not reused or record.ingest_timestamp >= epochStart)
                                    ) {
                                        activityRecordSubjects.put(recordId, profile.owner)
                                    }
                                }
                            };
                            case _ {};
                        }
                    };
                }
            }
        }
    };

    system func preupgrade() {
        stableProfiles := Iter.toArray(profiles.entries());
        stableBlocks := Iter.toArray(blocks.entries());
        stableTraits := Iter.toArray(traits.entries());
        userProfiles := Iter.toArray(userprofiles.entries());
        upgradeInboxes := Iter.toArray(inboxes.entries());
        userWallets := Iter.toArray(wallets.entries());
        upgradeFavorites := Iter.toArray(myFavorites.entries());
        upgradeCanisters := Iter.toArray(myCanisters.entries());
        stableFeaturedProfiles := Buffer.toArray(featuredProfiles);
        stableIntegrationApps := Iter.toArray(integrationApps.entries());
        stableActivityTypes := Iter.toArray(activityTypesMap.entries());
        stableConnections := Iter.toArray(connections.entries());
        stableProfileConnectionIndex := Iter.toArray(profileConnectionIndex.entries());
        stableConnectionSubjects := Iter.toArray(connectionSubjects.entries());
        stableConnectionEpochStarts := Iter.toArray(connectionEpochStarts.entries());
        stableActivityRecords := Iter.toArray(activityRecordsMap.entries());
        stableActivityRecordSubjects := Iter.toArray(activityRecordSubjects.entries());
        stableIdempotencyKeys := Iter.toArray(idempotencyKeys.entries());
        stableProfileActivityIndex := Iter.toArray(profileActivityIndex.entries());
        stableDerivedSummaries := Iter.toArray(derivedSummaries.entries());
        stableProfileSummaryIndex := Iter.toArray(profileSummaryIndex.entries());
        stableIdentityGraphs := Iter.toArray(identityGraphs.entries());
        stableContextPolicies := Iter.toArray(contextPolicies.entries());
        stableTrustEdges := Iter.toArray(trustEdges.entries());
        stableOipProviders := Iter.toArray(oipProviders.entries());
        stableProfileClaims := Iter.toArray(profileClaims.entries());
        stableProfileClaimIndex := Iter.toArray(profileClaimIndex.entries());
        stablePeerReviews := Iter.toArray(peerReviews.entries());
        stableProfileReviewIndex := Iter.toArray(profileReviewIndex.entries());
        stableHistoricalProfileOwners := Iter.toArray(historicalProfileOwners.entries());
        stableLegacyOwnershipEpochs := Buffer.toArray(legacyOwnershipEpochs)
    };

    system func postupgrade() {
        // Restore only provenance that can be proven. Explicit ownership
        // epochs handle pre-upgrade renames, including profiles with no blocks.
        // Rebuild integration indexes once so legacy state benefits from the
        // bounded per-profile rename path immediately after upgrade.
        rebuildIntegrationProfileIndexes();
        applyLegacyOwnershipEpochs();
        backfillLegacyConnectionOwnership();
        backfillLegacyActivitySubjects();
        stableProfiles := [];
        stableBlocks := [];
        stableTraits := [];
        userProfiles := [];
        upgradeInboxes := [];
        userWallets := [];
        upgradeFavorites := [];
        upgradeCanisters := [];
        featuredProfiles := Buffer.fromArray(stableFeaturedProfiles);
        stableIntegrationApps := [];
        stableActivityTypes := [];
        stableConnections := [];
        stableProfileConnectionIndex := [];
        stableConnectionSubjects := [];
        stableConnectionEpochStarts := [];
        stableActivityRecords := [];
        stableActivityRecordSubjects := [];
        stableIdempotencyKeys := [];
        stableProfileActivityIndex := [];
        stableDerivedSummaries := [];
        stableProfileSummaryIndex := [];
        stableIdentityGraphs := [];
        stableContextPolicies := [];
        stableTrustEdges := [];
        stableOipProviders := [];
        stableProfileClaims := [];
        stableProfileClaimIndex := [];
        stablePeerReviews := [];
        stableProfileReviewIndex := [];
        stableHistoricalProfileOwners := [];
        stableLegacyOwnershipEpochs := []
    };
    private func clamp01(v : Float) : Float {
        if (v < 0.0) { 0.0 } else if (v > 1.0) { 1.0 } else { v }
    };
    private func defaultPolicyWeights() : PolicyWeights {
        { existence = 0.20; continuity = 0.15; human = 0.25; social = 0.15; economic = 0.10; reputation = 0.15 }
    };
    private func defaultScores(now : Int) : ProbabilityScores {
        {
            human_score = 0.0; uniqueness_score = 0.0; trust_score = 0.0; reputation_score = 0.0;
            ai_probability = 0.6; organization_probability = 0.4; updated_at = now; model_version = "oip-v0.2-m2";
        }
    };
    private func generateFactorId() : Text {
        factorIdCounter += 1;
        "factor_" # Nat.toText(factorIdCounter)
    };
    private func edgeKey(fromP : Text, toP : Text, context : Text) : Text { fromP # "->" # toP # ":" # context };
    private func providerIdemKey(providerId : Text, idem : Text) : Text { "provider:" # providerId # ":" # idem };
    private func scoreForCategory(weights : PolicyWeights, c : Types.FactorCategory) : Float {
        switch (c) { case (#existence) weights.existence; case (#continuity) weights.continuity; case (#human) weights.human; case (#social) weights.social; case (#economic) weights.economic; case (#reputation) weights.reputation }
    };
    private func freshness(f : Factor, now : Int) : Float {
        if (f.status == #revoked or f.status == #expired) { return 0.0 };
        switch (f.expires_at) { case null { 1.0 }; case (?exp) { if (now >= exp) { 0.0 } else { 0.9 } } }
    };
    private func decayMultiplier(lastUpdated : Int, now : Int, lambda : Float) : Float {
        let dt : Float = Float.fromInt(now - lastUpdated) / 1_000_000_000.0 / 86400.0;
        if (dt <= 0.0) { 1.0 } else { Float.exp(0.0 - (lambda * dt)) }
    };
    private func recomputeScoresInternal(g : IdentityGraph, policyOpt : ?ContextPolicy, now : Int) : ProbabilityScores {
        let weights = switch (policyOpt) { case (?p) p.weights; case null defaultPolicyWeights() };
        let lambda = switch (policyOpt) { case (?p) p.decay_lambda; case null 0.08 };
        var human : Float = 0.0;
        var uniq : Float = 0.0;
        var trust : Float = 0.0;
        var rep : Float = 0.0;
        for (f in g.factors.vals()) {
            let base = clamp01(f.confidence) * clamp01(f.reliability) * clamp01(scoreForCategory(weights, f.category)) * freshness(f, now);
            switch (f.category) {
                case (#human) { human += base; trust += base };
                case (#existence) { uniq += base; trust += base };
                case (#continuity) { trust += base };
                case (#social) { human += base * 0.5; trust += base };
                case (#economic) { uniq += base * 0.3; trust += base };
                case (#reputation) { rep += base; trust += base * 0.7 };
            }
        };
        let d = decayMultiplier(g.scores.updated_at, now, lambda);
        human := clamp01(human * d); uniq := clamp01(uniq * d); rep := clamp01(rep * d); trust := clamp01(trust * d);
        {
            human_score = human; uniqueness_score = uniq; trust_score = trust; reputation_score = rep;
            ai_probability = clamp01((1.0 - human) * 0.6);
            organization_probability = clamp01((1.0 - human) * 0.4);
            updated_at = now;
            model_version = "oip-v0.2-m2";
        }
    };

    public shared ({ caller }) func registerLegacyOwnershipEpoch(
        legacyProfileId : Text,
        currentProfileId : Text,
        fromTimestamp : Int,
        toTimestamp : ?Int
    ) : async Result.Result<Nat, Text> {
        if (not isAdmin(caller)) {
            return #err("admin only")
        };
        if (legacyProfileId == currentProfileId) {
            return #err("legacy and current profile ids must differ")
        };
        if (profiles.get(legacyProfileId) != null) {
            return #err("legacy profile id is currently active")
        };
        let current = switch (profiles.get(currentProfileId)) {
            case null { return #err("current profile not found") };
            case (?profile) profile;
        };
        switch (toTimestamp) {
            case (?until) {
                if (until < fromTimestamp) {
                    return #err("invalid ownership epoch")
                }
            };
            case null {};
        };
        let epoch : LegacyOwnershipEpoch = {
            legacy_profile_id = legacyProfileId;
            current_profile_id = currentProfileId;
            subject = current.owner;
            from_timestamp = fromTimestamp;
            to_timestamp = toTimestamp;
        };
        legacyOwnershipEpochs.add(epoch);
        applyLegacyOwnershipEpoch(epoch);
        #ok(1)
    };

    public shared ({ caller }) func createProfile(newProfile : Types.NewProfile) : async Result.Result<Nat, Text> {
        if (Principal.isAnonymous(caller)) {
            #err("no authenticated")
        } else {
            let up = userprofiles.get(caller);
            switch (up) {
                case (?up) {
                    #err("you already have profile ")
                };
                case (_) {
                    let p = profiles.get(newProfile.id);
                    switch (p) {
                        case (?p) {
                            #err("the id is taken!")
                        };
                        case (_) {
                            switch (historicalProfileOwners.get(newProfile.id)) {
                                case (?_) { return #err("the id was previously used and is reserved") };
                                case null {};
                            };

                            if (Text.size(newProfile.id) < 4) {
                                #err("profile id length must be greater than 3")
                            } else if (Array.find(reserveIds, func(id : Text) : Bool { id == newProfile.id }) != null) {
                                #err("the id is reserved")
                            } else {
                                profiles.put(
                                    newProfile.id,
                                    {
                                        id = newProfile.id;
                                        name = newProfile.name;
                                        bio = newProfile.bio;
                                        pfp = newProfile.pfp;
                                        links = [];
                                        blocks = [];
                                        traits = [];
                                        owner = caller;
                                        createtime = Time.now();
                                        visibility = #global;
                                        last_updated = Time.now();
                                    },
                                );
                                userprofiles.put(caller, newProfile.id);
                                #ok(1)
                            }

                        }
                    }
                }
            };

        }
    };

    public shared ({ caller }) func addFeaturedProfile(pid : Text) : async Result.Result<Nat, Text> {
        if (isAdmin(caller)) {
            let featuredProfile = profiles.get(pid);
            switch (featuredProfile) {
                case (?featuredProfile) {
                    featuredProfiles.add(featuredProfile);
                    #ok(1)
                };
                case (_) {
                    #err("the profile is not found")
                }
            };

        } else {
            #err("No permission to add featured profile")
        }
    };

    public shared ({ caller }) func removeFeaturedProfile(id : Text) : async Result.Result<Nat, Text> {
        if (isAdmin(caller)) {
            let newFeaturedProfiles = Buffer.Buffer<Profile>(0);
            for (featuredProfile in featuredProfiles.vals()) {
                if (featuredProfile.id != id) {
                    newFeaturedProfiles.add(featuredProfile)
                }
            };
            featuredProfiles := newFeaturedProfiles;
            #ok(1)
        } else {
            #err("No permission to remove featured profile")
        }
    };

    public shared ({ caller }) func updateProfile(id : Text, updateProfile : Types.UpdateProfile) : async Result.Result<Nat, Text> {
        if (Principal.isAnonymous(caller)) {
            #err("no authenticated")
        } else {

            let p = profiles.get(id);
            switch (p) {
                case (?p) {
                    if (p.owner == caller) {
                        profiles.put(
                            id,
                            {
                                id = p.id;
                                name = updateProfile.name;
                                bio = updateProfile.bio;
                                pfp = updateProfile.pfp;
                                links = p.links;
                                blocks = p.blocks;
                                traits = p.traits;
                                owner = p.owner;
                                createtime = p.createtime;
                                visibility = p.visibility;
                                last_updated = Time.now()
                            }
                        );
                        #ok(1)
                    } else {
                        #err("no permission to update")
                    };

                };
                case (_) {
                    #err("no profile found")
                }
            };

        }
    };

    private func migrateTextIndex(index : TrieMap.TrieMap<Text, [Text]>, oldId : Text, newId : Text) {
        switch (index.get(oldId)) {
            case null {};
            case (?ids) {
                index.put(newId, ids);
                ignore index.remove(oldId);
            };
        }
    };

    private func appendUniqueTextIndex(index : TrieMap.TrieMap<Text, [Text]>, profileId : Text, value : Text) {
        let existing = switch (index.get(profileId)) {
            case (?values) values;
            case null [];
        };
        if (Array.find<Text>(existing, func(candidate : Text) : Bool { candidate == value }) == null) {
            let buf = Buffer.fromArray<Text>(existing);
            buf.add(value);
            index.put(profileId, Buffer.toArray(buf))
        }
    };

    private func rebuildDerivedSummariesForProfile(profileId : Text, owner : Principal) {
        let existingKeys = switch (profileSummaryIndex.get(profileId)) {
            case (?values) values;
            case null [];
        };
        for (key in existingKeys.vals()) {
            ignore derivedSummaries.remove(key)
        };
        ignore profileSummaryIndex.remove(profileId);

        let rebuilt = TrieMap.TrieMap<Text, DerivedSummary>(Text.equal, Text.hash);
        let recordIds = switch (profileActivityIndex.get(profileId)) {
            case (?ids) ids;
            case null [];
        };
        for (recordId in recordIds.vals()) {
            switch (activityRecordSubjects.get(recordId), activityRecordsMap.get(recordId)) {
                case (?subject, ?record) {
                    if (subject == owner) {
                        let key = summaryKey(profileId, record.app_id, record.activity_type);
                        let previous = rebuilt.get(key);
                        let (count, total, currency, updatedAt) = switch (previous) {
                            case null { (0, null, record.currency, record.ingest_timestamp) };
                            case (?summary) {
                                (
                                    summary.record_count,
                                    summary.total_amount,
                                    summary.currency,
                                    if (record.ingest_timestamp > summary.last_updated) {
                                        record.ingest_timestamp
                                    } else {
                                        summary.last_updated
                                    }
                                )
                            };
                        };
                        let nextTotal : ?Float = switch (record.amount) {
                            case null total;
                            case (?amount) {
                                switch (total) {
                                    case null ?amount;
                                    case (?existing) ?(existing + amount);
                                }
                            };
                        };
                        rebuilt.put(key, {
                            profile_id = profileId;
                            app_id = record.app_id;
                            activity_type = record.activity_type;
                            record_count = count + 1;
                            total_amount = nextTotal;
                            currency = currency;
                            last_updated = updatedAt;
                        })
                    }
                };
                case _ {};
            }
        };
        let keys = Buffer.Buffer<Text>(0);
        for ((key, summary) in rebuilt.entries()) {
            derivedSummaries.put(key, summary);
            keys.add(key)
        };
        if (keys.size() > 0) {
            profileSummaryIndex.put(profileId, Buffer.toArray(keys))
        }
    };

    private func migrateDerivedSummaries(oldId : Text, newId : Text, owner : Principal) {
        // Legacy aggregates may span multiple ownership epochs after ID reuse.
        // Rebuild summaries exclusively from records immutably bound to owner.
        let oldKeys = switch (profileSummaryIndex.get(oldId)) {
            case (?values) values;
            case null [];
        };
        for (oldKey in oldKeys.vals()) {
            ignore derivedSummaries.remove(oldKey)
        };
        ignore profileSummaryIndex.remove(oldId);

        let rebuilt = TrieMap.TrieMap<Text, DerivedSummary>(Text.equal, Text.hash);
        let recordIds = switch (profileActivityIndex.get(oldId)) {
            case (?ids) ids;
            case null [];
        };
        for (recordId in recordIds.vals()) {
            switch (activityRecordSubjects.get(recordId), activityRecordsMap.get(recordId)) {
                case (?subject, ?record) {
                    if (subject == owner) {
                        let key = summaryKey(newId, record.app_id, record.activity_type);
                        let previous = rebuilt.get(key);
                        let (count, total, currency, updatedAt) = switch (previous) {
                            case null {
                                (0, null, record.currency, record.ingest_timestamp)
                            };
                            case (?summary) {
                                (
                                    summary.record_count,
                                    summary.total_amount,
                                    summary.currency,
                                    if (record.ingest_timestamp > summary.last_updated) {
                                        record.ingest_timestamp
                                    } else {
                                        summary.last_updated
                                    }
                                )
                            };
                        };
                        let nextTotal : ?Float = switch (record.amount) {
                            case null total;
                            case (?amount) {
                                switch (total) {
                                    case null ?amount;
                                    case (?existing) ?(existing + amount);
                                }
                            };
                        };
                        rebuilt.put(key, {
                            profile_id = newId;
                            app_id = record.app_id;
                            activity_type = record.activity_type;
                            record_count = count + 1;
                            total_amount = nextTotal;
                            currency = currency;
                            last_updated = updatedAt;
                        })
                    }
                };
                case _ {};
            }
        };

        let newKeys = Buffer.Buffer<Text>(0);
        for ((key, summary) in rebuilt.entries()) {
            derivedSummaries.put(key, summary);
            newKeys.add(key)
        };
        if (newKeys.size() > 0) {
            profileSummaryIndex.put(newId, Buffer.toArray(newKeys))
        } else {
            ignore profileSummaryIndex.remove(newId)
        }
    };

    private func migrateConnections(oldId : Text, newId : Text) {
        let appIds = switch (profileConnectionIndex.get(oldId)) {
            case (?values) values;
            case null [];
        };
        for (appId in appIds.vals()) {
            let oldKey = connectionKey(oldId, appId);
            switch (connections.get(oldKey)) {
                case null {};
                case (?conn) {
                    let newKey = connectionKey(newId, appId);
                    connections.put(newKey, {
                        profile_id = newId;
                        app_id = conn.app_id;
                        external_user_id = conn.external_user_id;
                        scopes = conn.scopes;
                        status = conn.status;
                        created_at = conn.created_at;
                        revoked_at = conn.revoked_at;
                    });
                    switch (connectionSubjects.get(oldKey)) {
                        case (?subject) {
                            connectionSubjects.put(newKey, subject);
                            ignore connectionSubjects.remove(oldKey);
                        };
                        case null {};
                    };
                    switch (connectionEpochStarts.get(oldKey)) {
                        case (?startedAt) {
                            connectionEpochStarts.put(newKey, startedAt);
                            ignore connectionEpochStarts.remove(oldKey);
                        };
                        case null {};
                    };
                    ignore connections.remove(oldKey);
                };
            }
        };
        if (appIds.size() > 0) {
            profileConnectionIndex.put(newId, appIds)
        };
        ignore profileConnectionIndex.remove(oldId)
    };

    private func migrateGraphLocators(oldId : Text, newId : Text) {
        switch (profileClaimIndex.get(oldId)) {
            case null {};
            case (?ids) {
                for (id in ids.vals()) {
                    switch (profileClaims.get(id)) {
                        case null {};
                        case (?claim) {
                            profileClaims.put(id, {
                                id = claim.id;
                                profile_id = newId;
                                subject = claim.subject;
                                predicate = claim.predicate;
                                value = claim.value;
                                capability = claim.capability;
                                context = claim.context;
                                provenance = claim.provenance;
                                valid_from = claim.valid_from;
                                valid_until = claim.valid_until;
                                visibility = claim.visibility;
                                created_at = claim.created_at;
                            })
                        };
                    }
                }
            };
        };
        switch (profileReviewIndex.get(oldId)) {
            case null {};
            case (?ids) {
                for (id in ids.vals()) {
                    switch (peerReviews.get(id)) {
                        case null {};
                        case (?review) {
                            peerReviews.put(id, {
                                id = review.id;
                                profile_id = newId;
                                subject = review.subject;
                                reviewer = review.reviewer;
                                relationship = review.relationship;
                                capability = review.capability;
                                context = review.context;
                                assessment_tags = review.assessment_tags;
                                narrative = review.narrative;
                                evidence = review.evidence;
                                related_claims = review.related_claims;
                                status = review.status;
                                response = review.response;
                                visibility = review.visibility;
                                created_at = review.created_at;
                                updated_at = review.updated_at;
                            })
                        };
                    }
                }
            };
        }
    };

    public shared ({ caller }) func changeId(oid : Text, nid : Text) : async Result.Result<Nat, Text> {
        if (Principal.isAnonymous(caller)) {
            #err("no authenticated")
        } else {

            let p = profiles.get(oid);
            switch (p) {
                case (?p) {
                    if (p.owner == caller or isAdmin(caller)) {
                        let existp = profiles.get(nid);
                        switch (existp) {
                            case (?existp) {
                                #err("this id has been taken")
                            };
                            case (_) {
                                switch (historicalProfileOwners.get(nid)) {
                                    case (?_) { return #err("this id was previously used and is reserved") };
                                    case null {};
                                };
                                historicalProfileOwners.put(oid, p.owner);
                                // Keep ambiguous legacy activity records unbound.
                                // Only pre-established immutable subject bindings move
                                // safely with the profile's activity index.
                                migrateConnections(oid, nid);
                                migrateDerivedSummaries(oid, nid, p.owner);
                                migrateGraphLocators(oid, nid);
                                migrateTextIndex(profileActivityIndex, oid, nid);
                                migrateTextIndex(profileClaimIndex, oid, nid);
                                migrateTextIndex(profileReviewIndex, oid, nid);
                                profiles.put(
                                    nid,
                                    {
                                        id = nid;
                                        name = p.name;
                                        bio = p.bio;
                                        pfp = p.pfp;
                                        links = p.links;
                                        blocks = p.blocks;
                                        traits = p.traits;
                                        owner = p.owner;
                                        createtime = p.createtime;
                                        visibility = p.visibility;
                                        last_updated = Time.now()
                                    }
                                );
                                ignore profiles.remove(oid);
                                userprofiles.put(p.owner, nid);
                                #ok(1)
                            };

                        };

                    } else {
                        #err("no permission to update")
                    };

                };
                case (_) {
                    #err("no profile found")
                }
            };

        }
    };

    public query func getProfiles(pageSize : Nat, pageNumber : Nat) : async [Profile] {
        let profileEntries = Iter.toArray(profiles.entries());
        let totalProfiles = profileEntries.size();
        let startIndex = pageNumber * pageSize;
        let endIndex = startIndex + pageSize;

        let slicedProfiles = Array.tabulate<Profile>(
            Nat.min(endIndex - startIndex, totalProfiles - startIndex),
            func(i) {
                let (_, profile) = profileEntries[startIndex + i];
                profile
            },
        );

        slicedProfiles
    };

    public query func getDefaultProfiles(size : Nat) : async [Profile] {

        let profileEntries = Iter.toArray(profiles.vals());
        let filteredProfiles = Array.filter<Profile>(
            profileEntries,
            func(profile) {
                profile.name != "" and profile.pfp != ""
            },
        );

        let sortedProfiles = Array.sort<Profile>(
            filteredProfiles,
            func(x : Profile, y : Profile) : Order.Order {
                if (y.createtime < x.createtime) { #less } else if (y.createtime == x.createtime) {
                    #equal
                } else {
                    #greater
                }
            },
        );

        Array.tabulate<Profile>(
            Nat.min(size, sortedProfiles.size()),
            func(i) { sortedProfiles[i] },
        )
    };

    public query func searchProfilesByName(q : Text) : async [Profile] {
        let profileEntries = Iter.toArray(profiles.vals());
        let filteredProfiles = Array.filter<Profile>(
            profileEntries,
            func(entry) {
                let (profile) = entry;
                Text.contains(profile.name, #text q)
            },
        );

        let sortedProfiles = Array.sort<Profile>(
            filteredProfiles,
            func(x : Profile, y : Profile) : Order.Order {
                if (y.createtime < x.createtime) { #less } else if (y.createtime == x.createtime) {
                    #equal
                } else {
                    #greater
                }
            },
        );

        Array.tabulate<Profile>(
            Nat.min(100, sortedProfiles.size()),
            func(i) {
                let (profile) = sortedProfiles[i];
                profile
            },
        )
    };

    public query func getProfileCount() : async Nat {
        Iter.size(profiles.entries())
    };

    public shared ({ caller }) func addLink(id : Text, link : Types.Link) : async Result.Result<Nat, Text> {
        if (Principal.isAnonymous(caller)) {
            #err("no authenticated")
        } else {

            let p = profiles.get(id);
            switch (p) {
                case (?p) {
                    if (p.owner == caller) {

                        let blinks = Buffer.fromArray<Types.Link>(p.links);

                        blinks.add(link);

                        profiles.put(
                            id,
                            {
                                id = p.id;
                                name = p.name;
                                bio = p.bio;
                                pfp = p.pfp;
                                links = Buffer.toArray(blinks);
                                blocks = p.blocks;
                                traits = p.traits;
                                owner = p.owner;
                                createtime = p.createtime;
                                visibility = p.visibility;
                                last_updated = Time.now()
                            }
                        );
                        #ok(1)
                    } else {

                        #err("no permission to add link")
                    };

                };
                case (_) {
                    #err("no profile found")
                }
            };

        }
    };
    public shared ({ caller }) func deleteLink(id : Text, name : Text) : async Result.Result<Nat, Text> {
        if (Principal.isAnonymous(caller)) {
            #err("no authenticated")
        } else {

            let p = profiles.get(id);
            switch (p) {
                case (?p) {
                    if (p.owner == caller) {

                        let blinks = Array.filter<Types.Link>(
                            p.links,
                            func(l : Types.Link) : Bool {
                                l.name != name
                            },
                        );
                        profiles.put(
                            id,
                            {
                                id = p.id;
                                name = p.name;
                                bio = p.bio;
                                pfp = p.pfp;
                                links = blinks;
                                blocks = p.blocks;
                                traits = p.traits;
                                owner = p.owner;
                                createtime = p.createtime;
                                visibility = p.visibility;
                                last_updated = Time.now()
                            }
                        );
                        #ok(1)
                    } else {

                        #err("no permission to add link")
                    };

                };
                case (_) {
                    #err("no profile found")
                }
            };

        }
    };

    public query func getProfile(id : Text) : async ?Profile {
        profiles.get(id)
    };

    public query func getProfileByPrincipal(principal : Text) : async ?Profile {
        let pt = userprofiles.get(Principal.fromText(principal));
        switch (pt) {
            case (?pt) {
                profiles.get(pt)
            };
            case (_) {
                null
            }
        }
    };

    public query ({ caller }) func getMyProfile() : async ?Profile {
        let pt = userprofiles.get(caller);
        switch (pt) {
            case (?pt) {
                profiles.get(pt)
            };
            case (_) {
                null
            }
        }

    };

    //----------------------------- Block Management ------------------------------------
    
    private func generateBlockId() : Text {
        blockIdCounter := blockIdCounter + 1;
        "block_" # Nat.toText(blockIdCounter)
    };

    private func generateTraitId() : Text {
        traitIdCounter := traitIdCounter + 1;
        "trait_" # Nat.toText(traitIdCounter)
    };

    private func generateHash(text : Text) : Text {
        // Simple hash implementation - in production use proper crypto hash
        let size = Text.size(text);
        "hash_" # Nat.toText(size) # "_" # Int.toText(Time.now())
    };

    public shared ({ caller }) func createBlock(newBlock : NewBlock) : async Result.Result<Text, Text> {
        if (Principal.isAnonymous(caller)) {
            return #err("not authenticated");
        };

        let profile = profiles.get(newBlock.profile_id);
        switch (profile) {
            case (?p) {
                if (p.owner != caller) {
                    return #err("not authorized to add blocks to this profile");
                };

                let blockId = generateBlockId();
                let now = Time.now();
                
                // Create block content for hashing
                let blockContent = blockId # newBlock.profile_id # Int.toText(newBlock.start_time);
                let hash = generateHash(blockContent);

                let block : Block = {
                    id = blockId;
                    profile_id = newBlock.profile_id;
                    start_time = newBlock.start_time;
                    end_time = newBlock.end_time;
                    evidence_refs = newBlock.evidence_refs;
                    derived_traits = [];
                    narrative = newBlock.narrative;
                    visibility = newBlock.visibility;
                    hash = hash;
                    created_at = now
                };

                blocks.put(blockId, block);

                // Update profile's block list
                let bblocks = Buffer.fromArray<Text>(p.blocks);
                bblocks.add(blockId);

                profiles.put(
                    newBlock.profile_id,
                    {
                        id = p.id;
                        name = p.name;
                        bio = p.bio;
                        pfp = p.pfp;
                        links = p.links;
                        blocks = Buffer.toArray(bblocks);
                        traits = p.traits;
                        owner = p.owner;
                        createtime = p.createtime;
                        visibility = p.visibility;
                        last_updated = now
                    }
                );

                #ok(blockId)
            };
            case null {
                #err("profile not found")
            };
        };
    };

    // Block visibility is enforced at the read boundary. Owners can always read
    // their own blocks. Non-owners can read global blocks only. Unlisted
    // remains owner-only until OneBlock has unguessable capability-based share links.
    private func canReadBlock(caller : Principal, profile : Profile, block : Block) : Bool {
        if (caller == profile.owner) {
            return true
        };
        switch (block.visibility) {
            case (#global) { true };
            case (#unlisted) { false };
            case (#personal) { false };
        }
    };

    private func callerOwnsBlock(caller : Principal, blockId : Text) : Bool {
        switch (userprofiles.get(caller)) {
            case null { false };
            case (?profileId) {
                switch (profiles.get(profileId)) {
                    case null { false };
                    case (?profile) {
                        for (candidateId in profile.blocks.vals()) {
                            if (candidateId == blockId) {
                                return true
                            }
                        };
                        false
                    };
                }
            };
        }
    };

    // Direct reads do not trust block.profile_id for authorization. Profile IDs
    // can change, while a historical block keeps the ID it was created under.
    // Ownership is resolved through the caller's current profile block index,
    // which also prevents a reused old profile ID from hijacking block access.
    public query ({ caller }) func getBlock(blockId : Text) : async ?Block {
        switch (blocks.get(blockId)) {
            case null { null };
            case (?block) {
                switch (block.visibility) {
                    case (#global) { ?block };
                    case (#unlisted) {
                        if (callerOwnsBlock(caller, blockId)) { ?block } else { null }
                    };
                    case (#personal) {
                        if (callerOwnsBlock(caller, blockId)) { ?block } else { null }
                    };
                }
            };
        }
    };

    public query ({ caller }) func listBlocks(profileId : Text) : async [Block] {
        let profile = profiles.get(profileId);
        switch (profile) {
            case (?p) {
                let blockList = Buffer.Buffer<Block>(0);
                for (blockId in p.blocks.vals()) {
                    switch (blocks.get(blockId)) {
                        case (?b) {
                            if (canReadBlock(caller, p, b)) {
                                blockList.add(b)
                            }
                        };
                        case null {};
                    };
                };
                Buffer.toArray(blockList)
            };
            case null { [] };
        };
    };

    public query ({ caller }) func getChain(profileId : Text) : async [Block] {
        let profile = profiles.get(profileId);
        let blockList = switch (profile) {
            case (?p) {
                let list = Buffer.Buffer<Block>(0);
                for (blockId in p.blocks.vals()) {
                    switch (blocks.get(blockId)) {
                        case (?b) {
                            if (canReadBlock(caller, p, b)) {
                                list.add(b)
                            }
                        };
                        case null {};
                    };
                };
                Buffer.toArray(list)
            };
            case null { [] };
        };
        // Sort by start_time (chronological order)
        Array.sort<Block>(
            blockList,
            func(a : Block, b : Block) : Order.Order {
                if (a.start_time < b.start_time) { #less }
                else if (a.start_time == b.start_time) { #equal }
                else { #greater }
            }
        )
    };

    public shared ({ caller }) func createTrait(profileId : Text, newTrait : NewTrait) : async Result.Result<Text, Text> {
        if (Principal.isAnonymous(caller)) {
            return #err("not authenticated");
        };

        let profile = profiles.get(profileId);
        switch (profile) {
            case (?p) {
                if (p.owner != caller) {
                    return #err("not authorized to add traits to this profile");
                };

                let traitId = generateTraitId();
                let now = Time.now();

                let trait : Trait = {
                    id = traitId;
                    tlabel = newTrait.tlabel;
                    strength = newTrait.strength;
                    confidence = newTrait.confidence;
                    explanation = newTrait.explanation;
                    derived_from = newTrait.derived_from;
                    visibility = newTrait.visibility;
                    updated_at = now
                };

                traits.put(traitId, trait);

                // Update profile's trait list
                let btraits = Buffer.fromArray<Text>(p.traits);
                btraits.add(traitId);

                profiles.put(
                    profileId,
                    {
                        id = p.id;
                        name = p.name;
                        bio = p.bio;
                        pfp = p.pfp;
                        links = p.links;
                        blocks = p.blocks;
                        traits = Buffer.toArray(btraits);
                        owner = p.owner;
                        createtime = p.createtime;
                        visibility = p.visibility;
                        last_updated = now
                    }
                );

                #ok(traitId)
            };
            case null {
                #err("profile not found")
            };
        };
    };

    public query func getTrait(traitId : Text) : async ?Trait {
        traits.get(traitId)
    };

    public query func getTraits(profileId : Text) : async [Trait] {
        let profile = profiles.get(profileId);
        switch (profile) {
            case (?p) {
                let traitList = Buffer.Buffer<Trait>(0);
                for (traitId in p.traits.vals()) {
                    let trait = traits.get(traitId);
                    switch (trait) {
                        case (?t) {
                            traitList.add(t);
                        };
                        case null {};
                    };
                };
                Buffer.toArray(traitList)
            };
            case null { [] };
        };
    };

    //----------------------------- Profile Provenance Graph ------------------------------------

    private func generateProfileClaimId() : Text {
        profileClaimCounter += 1;
        "claim_" # Nat.toText(profileClaimCounter)
    };

    private func generatePeerReviewId() : Text {
        peerReviewCounter += 1;
        "review_" # Nat.toText(peerReviewCounter)
    };

    private func graphVisibility(v : Types.Visibility) : ProfileGraph.Visibility {
        switch (v) {
            case (#global) #global;
            case (#unlisted) #unlisted;
            case (#personal) #personal;
        }
    };

    private func canReadGraphItem(caller : Principal, owner : Principal, visibility : ProfileGraph.Visibility) : Bool {
        if (caller == owner) {
            return true
        };
        switch (visibility) {
            case (#global) true;
            case (#unlisted) false;
            case (#personal) false;
        }
    };

    private func appendClaimIndex(profileId : Text, claimId : Text) {
        let current = switch (profileClaimIndex.get(profileId)) {
            case (?ids) ids;
            case null [];
        };
        let buf = Buffer.fromArray<Text>(current);
        buf.add(claimId);
        profileClaimIndex.put(profileId, Buffer.toArray(buf))
    };

    private func appendReviewIndex(profileId : Text, reviewId : Text) {
        let current = switch (profileReviewIndex.get(profileId)) {
            case (?ids) ids;
            case null [];
        };
        let buf = Buffer.fromArray<Text>(current);
        buf.add(reviewId);
        profileReviewIndex.put(profileId, Buffer.toArray(buf))
    };

    private func textBytes(value : Text) : Nat {
        Blob.toArray(Text.encodeUtf8(value)).size()
    };

    private func optionalTextBytes(value : ?Text) : Nat {
        switch (value) {
            case (?text) textBytes(text);
            case null 0;
        }
    };

    private func claimValueBytes(value : ProfileGraph.ClaimValue) : Nat {
        switch (value) {
            case (#text(text)) textBytes(text);
            case (#reference(text)) textBytes(text);
            case (#number(_)) 16;
            case (#boolean(_)) 1;
        }
    };

    private func evidenceBytes(evidence : ProfileGraph.EvidenceRef) : Nat {
        textBytes(evidence.schema)
        + optionalTextBytes(evidence.uri)
        + optionalTextBytes(evidence.hash)
        + optionalTextBytes(evidence.external_id)
    };

    private func profileClaimApproxBytes(claim : ProfileClaim) : Nat {
        var total =
            textBytes(claim.id)
            + textBytes(claim.profile_id)
            + textBytes(claim.predicate)
            + claimValueBytes(claim.value)
            + textBytes(claim.provenance.issuer_id)
            + 256;
        switch (claim.context) {
            case (?value) { total += textBytes(value) };
            case null {};
        };
        switch (claim.capability) {
            case (?capability) {
                total += textBytes(capability.path);
                total += optionalTextBytes(capability.display_label)
            };
            case null {};
        };
        for (evidence in claim.provenance.evidence.vals()) {
            total += evidenceBytes(evidence)
        };
        total
    };

    private func addClaimWithinBudget(
        buf : Buffer.Buffer<ProfileClaim>,
        usedBytes : Nat,
        claim : ProfileClaim
    ) : (Nat, Bool) {
        if (buf.size() >= 200) {
            return (usedBytes, false)
        };
        let claimBytes = profileClaimApproxBytes(claim);
        if (usedBytes + claimBytes > 1_500_000) {
            return (usedBytes, false)
        };
        buf.add(claim);
        (usedBytes + claimBytes, true)
    };

    public shared ({ caller }) func createSelfClaim(input : NewSelfClaim) : async Result.Result<Text, Text> {
        if (Principal.isAnonymous(caller)) {
            return #err("not authenticated")
        };
        if (Text.size(input.predicate) == 0) {
            return #err("predicate is required")
        };
        if (textBytes(input.predicate) > 256) {
            return #err("predicate is too long")
        };
        var selfClaimBytes : Nat = textBytes(input.predicate) + claimValueBytes(input.value);
        switch (input.context) {
            case (?value) { selfClaimBytes += textBytes(value) };
            case null {};
        };
        switch (input.capability) {
            case (?capability) {
                selfClaimBytes += textBytes(capability.path);
                selfClaimBytes += optionalTextBytes(capability.display_label)
            };
            case null {};
        };
        if (input.evidence.size() > 16) {
            return #err("too many evidence references")
        };
        for (evidence in input.evidence.vals()) {
            selfClaimBytes += evidenceBytes(evidence)
        };
        if (selfClaimBytes > 16_384) {
            return #err("claim payload is too large")
        };
        let profile = switch (profiles.get(input.profile_id)) {
            case null { return #err("profile not found") };
            case (?p) p;
        };
        if (profile.owner != caller) {
            return #err("not authorized")
        };
        let now = Time.now();
        let id = generateProfileClaimId();
        let claim : ProfileClaim = {
            id = id;
            profile_id = input.profile_id;
            subject = profile.owner;
            predicate = input.predicate;
            value = input.value;
            capability = input.capability;
            context = input.context;
            provenance = {
                source_kind = #self_declared;
                issuer = ?caller;
                issuer_id = Principal.toText(caller);
                verification = #none;
                evidence = input.evidence;
                observed_at = ?now;
                recorded_at = now;
            };
            valid_from = input.valid_from;
            valid_until = input.valid_until;
            visibility = input.visibility;
            created_at = now;
        };
        profileClaims.put(id, claim);
        appendClaimIndex(input.profile_id, id);
        #ok(id)
    };

    private func legacyClaimId(profile : Profile, suffix : Text) : Text {
        "legacy:profile:" # Principal.toText(profile.owner) # ":" # suffix
    };

    private func projectedVersionDigest(value : Text) : Text {
        // Keep projected IDs fixed-size while still versioning mutable content.
        // Two independently salted Text.hash values plus length make accidental
        // collisions materially less likely than a single 32-bit hash.
        Nat.toText(Text.size(value))
        # "-"
        # Nat.toText(Nat32.toNat(Text.hash("oneblock:a:" # value)))
        # "-"
        # Nat.toText(Nat32.toNat(Text.hash("oneblock:b:" # value)))
    };

    private func legacyTextClaimId(profile : Profile, field : Text, value : Text) : Text {
        legacyClaimId(profile, field # ":" # projectedVersionDigest(value))
    };

    private func legacyLinkClaimId(profile : Profile, link : Types.Link) : Text {
        let versioned = link.name # "\u{1f}" # link.url;
        legacyClaimId(profile, "link:" # projectedVersionDigest(versioned))
    };

    private func findProfileByOwner(owner : Principal) : ?Profile {
        switch (userprofiles.get(owner)) {
            case null null;
            case (?profileId) profiles.get(profileId);
        }
    };

    private func resolveClaim(claimId : Text) : ?ProfileClaim {
        switch (profileClaims.get(claimId)) {
            case (?claim) { return ?claim };
            case null {};
        };

        // External projected IDs encode the ActivityRecord key, so resolve
        // them directly before touching legacy profile projections.
        switch (Text.stripStart(claimId, #text "external:activity:")) {
            case (?recordId) {
                switch (activityRecordsMap.get(recordId)) {
                    case (?record) { return activityClaim(record) };
                    case null { return null };
                }
            };
            case null {};
        };

        // Legacy projections use owner-stable IDs so profile renames do not
        // change identity or transfer authorization to a future ID holder.
        for ((_, profile) in profiles.entries()) {
            if (claimId == legacyTextClaimId(profile, "name", profile.name)) {
                return ?legacyProfileClaim(profile, claimId, "profile.name", #text(profile.name))
            };
            if (Text.size(profile.bio) > 0 and claimId == legacyTextClaimId(profile, "bio", profile.bio)) {
                return ?legacyProfileClaim(profile, claimId, "profile.bio", #text(profile.bio))
            };
            for (link in profile.links.vals()) {
                let candidateId = legacyLinkClaimId(profile, link);
                if (claimId == candidateId) {
                    return ?legacyProfileClaim(profile, candidateId, "profile.link." # link.name, #reference(link.url))
                }
            }
        };

        null
    };

    public query ({ caller }) func getProfileClaim(claimId : Text) : async ?ProfileClaim {
        switch (resolveClaim(claimId)) {
            case null null;
            case (?claim) {
                if (caller == claim.subject or canReadGraphItem(caller, claim.subject, claim.visibility)) {
                    ?claim
                } else {
                    null
                }
            };
        }
    };

    private func legacyProfileClaim(
        profile : Profile,
        id : Text,
        predicate : Text,
        value : ProfileGraph.ClaimValue
    ) : ProfileClaim {
        {
            id = id;
            profile_id = profile.id;
            subject = profile.owner;
            predicate = predicate;
            value = value;
            capability = null;
            context = ?"legacy-profile";
            provenance = {
                source_kind = #self_declared;
                issuer = ?profile.owner;
                issuer_id = Principal.toText(profile.owner);
                verification = #none;
                evidence = [];
                observed_at = ?profile.last_updated;
                recorded_at = profile.last_updated;
            };
            valid_from = ?profile.createtime;
            valid_until = null;
            visibility = graphVisibility(profile.visibility);
            created_at = profile.createtime;
        }
    };

    private func activityClaim(record : ActivityRecord) : ?ProfileClaim {
        // Never infer an external record's subject from a mutable/reusable
        // profile ID. Pre-upgrade records without an immutable binding are
        // omitted rather than risk attributing evidence to the wrong person.
        let subject = switch (activityRecordSubjects.get(record.id)) {
            case null { return null };
            case (?owner) owner;
        };
        let profile = switch (findProfileByOwner(subject)) {
            case null { return null };
            case (?p) p;
        };
        let issuer = switch (integrationApps.get(record.app_id)) {
            case (?app) ?app.owner;
            case null null;
        };
        let schema = record.app_id # "." # record.activity_type # ".v" # Nat.toText(record.schema_version);
        ?{
            id = "external:activity:" # record.id;
            profile_id = profile.id;
            subject = subject;
            predicate = record.activity_type;
            value = #reference("oneblock://activity/" # record.id);
            capability = null;
            context = ?record.app_id;
            provenance = {
                source_kind = #external;
                issuer = issuer;
                issuer_id = record.app_id;
                verification = externalVerification(record);
                evidence = [{
                    schema = schema;
                    uri = ?("oneblock://activity/" # record.id);
                    hash = ?record.hash;
                    external_id = ?record.idempotency_key;
                }];
                observed_at = ?record.event_timestamp;
                recorded_at = record.ingest_timestamp;
            };
            valid_from = ?record.event_timestamp;
            valid_until = null;
            visibility = graphVisibility(record.visibility);
            created_at = record.ingest_timestamp;
        }
    };

    private func buildProfileClaimPage(
        caller : Principal,
        profileId : Text,
        cursor : Nat,
        requestedPageSize : Nat
    ) : ProfileClaimPage {
        let profile = switch (profiles.get(profileId)) {
            case null { return { items = []; next_cursor = null } };
            case (?p) p;
        };
        let pageSize = if (requestedPageSize == 0) 1 else if (requestedPageSize > 50) 50 else requestedPageSize;
        let profileVisibility = graphVisibility(profile.visibility);
        let legacyVisible = canReadGraphItem(caller, profile.owner, profileVisibility);
        let bioCount : Nat = if (Text.size(profile.bio) > 0) 1 else 0;
        let legacyCount : Nat = 1 + bioCount + profile.links.size();
        let claimIds = switch (profileClaimIndex.get(profileId)) { case (?ids) ids; case null [] };
        let activityIds = switch (profileActivityIndex.get(profileId)) { case (?ids) ids; case null [] };
        let total = legacyCount + claimIds.size() + activityIds.size();
        let buf = Buffer.Buffer<ProfileClaim>(pageSize);
        var usedBytes : Nat = 0;
        var pos = if (cursor > total) total else cursor;
        var scanned : Nat = 0;
        let maxScan : Nat = pageSize * 4 + 32;

        label scan while (pos < total and buf.size() < pageSize and usedBytes < 1_500_000 and scanned < maxScan) {
            let current = pos;
            pos += 1;
            scanned += 1;
            var candidate : ?ProfileClaim = null;
            if (current < legacyCount) {
                if (legacyVisible) {
                    if (current == 0) {
                        candidate := ?legacyProfileClaim(profile, legacyTextClaimId(profile, "name", profile.name), "profile.name", #text(profile.name))
                    } else if (bioCount == 1 and current == 1) {
                        candidate := ?legacyProfileClaim(profile, legacyTextClaimId(profile, "bio", profile.bio), "profile.bio", #text(profile.bio))
                    } else {
                        let linkOffset = current - 1 - bioCount;
                        if (linkOffset < profile.links.size()) {
                            let link = profile.links[linkOffset];
                            candidate := ?legacyProfileClaim(profile, legacyLinkClaimId(profile, link), "profile.link." # link.name, #reference(link.url))
                        }
                    }
                }
            } else if (current < legacyCount + claimIds.size()) {
                let claimId = claimIds[current - legacyCount];
                switch (profileClaims.get(claimId)) {
                    case (?claim) {
                        if (claim.subject == profile.owner and canReadGraphItem(caller, claim.subject, claim.visibility)) {
                            candidate := ?claim
                        }
                    };
                    case null {};
                }
            } else {
                let recordId = activityIds[current - legacyCount - claimIds.size()];
                switch (activityRecordsMap.get(recordId)) {
                    case (?record) {
                        switch (activityClaim(record)) {
                            case (?claim) {
                                if (claim.subject == profile.owner and canReadGraphItem(caller, claim.subject, claim.visibility)) {
                                    candidate := ?claim
                                }
                            };
                            case null {};
                        }
                    };
                    case null {};
                }
            };
            switch (candidate) {
                case (?claim) {
                    let bytes = profileClaimApproxBytes(claim);
                    if (usedBytes + bytes <= 1_500_000) {
                        buf.add(claim);
                        usedBytes += bytes
                    } else {
                        // Cursor already advanced past this oversized page item;
                        // individual claims remain directly retrievable by ID.
                    }
                };
                case null {};
            }
        };
        { items = Buffer.toArray(buf); next_cursor = if (pos < total) ?pos else null }
    };

    public query ({ caller }) func listProfileClaimsPage(
        profileId : Text,
        cursor : Nat,
        pageSize : Nat
    ) : async ProfileClaimPage {
        buildProfileClaimPage(caller, profileId, cursor, pageSize)
    };

    public query ({ caller }) func listProfileClaims(profileId : Text) : async [ProfileClaim] {
        buildProfileClaimPage(caller, profileId, 0, 50).items
    };

    public shared ({ caller }) func createPeerReview(input : NewPeerReview) : async Result.Result<Text, Text> {
        if (Principal.isAnonymous(caller)) {
            return #err("not authenticated")
        };
        if (Text.size(input.context) == 0) {
            return #err("review context is required")
        };
        if (textBytes(input.context) > 512) {
            return #err("review context is too long")
        };
        switch (input.narrative) {
            case (?value) {
                if (textBytes(value) > 4000) {
                    return #err("review narrative is too long")
                }
            };
            case null {};
        };
        if (input.assessment_tags.size() > 16) {
            return #err("too many assessment tags")
        };
        if (input.evidence.size() > 16) {
            return #err("too many evidence references")
        };
        if (input.related_claims.size() > 32) {
            return #err("too many related claims")
        };

        var reviewTextBudget : Nat = textBytes(input.context);
        switch (input.narrative) {
            case (?value) { reviewTextBudget += textBytes(value) };
            case null {};
        };
        switch (input.capability) {
            case (?capability) {
                if (textBytes(capability.path) > 256) {
                    return #err("capability path is too long")
                };
                reviewTextBudget += textBytes(capability.path);
                switch (capability.display_label) {
                    case (?displayLabel) {
                        if (textBytes(displayLabel) > 256) {
                            return #err("capability label is too long")
                        };
                        reviewTextBudget += textBytes(displayLabel)
                    };
                    case null {};
                }
            };
            case null {};
        };
        switch (input.relationship) {
            case (#other(value)) {
                if (textBytes(value) > 128) {
                    return #err("review relationship is too long")
                };
                reviewTextBudget += textBytes(value)
            };
            case _ {};
        };
        for (tag in input.assessment_tags.vals()) {
            if (textBytes(tag) > 128) {
                return #err("assessment tag is too long")
            };
            reviewTextBudget += textBytes(tag)
        };
        for (claimId in input.related_claims.vals()) {
            if (textBytes(claimId) > 256) {
                return #err("related claim id is too long")
            };
            reviewTextBudget += textBytes(claimId)
        };
        for (evidence in input.evidence.vals()) {
            if (textBytes(evidence.schema) > 256) {
                return #err("evidence schema is too long")
            };
            reviewTextBudget += textBytes(evidence.schema);
            switch (evidence.uri) {
                case (?value) {
                    if (textBytes(value) > 1024) {
                        return #err("evidence uri is too long")
                    };
                    reviewTextBudget += textBytes(value)
                };
                case null {};
            };
            switch (evidence.hash) {
                case (?value) {
                    if (textBytes(value) > 256) {
                        return #err("evidence hash is too long")
                    };
                    reviewTextBudget += textBytes(value)
                };
                case null {};
            };
            switch (evidence.external_id) {
                case (?value) {
                    if (textBytes(value) > 256) {
                        return #err("evidence external id is too long")
                    };
                    reviewTextBudget += textBytes(value)
                };
                case null {};
            }
        };
        if (reviewTextBudget > 4096) {
            return #err("review payload is too large")
        };
        let profile = switch (profiles.get(input.profile_id)) {
            case null { return #err("profile not found") };
            case (?p) p;
        };
        if (profile.owner == caller) {
            return #err("self review is not allowed; use a self-declared claim")
        };

        // Bound victim-controlled review indexes against spam. The total
        // subject cap keeps listPeerReviews work bounded; the per-reviewer cap
        // prevents one principal from consuming the entire allowance.
        let existingReviewIds = switch (profileReviewIndex.get(input.profile_id)) {
            case (?ids) ids;
            case null [];
        };
        var reviewerReviewCount : Nat = 0;
        label reviewCount for (existingId in existingReviewIds.vals()) {
            switch (peerReviews.get(existingId)) {
                case (?existingReview) {
                    if (existingReview.reviewer == caller and existingReview.status != #withdrawn) {
                        reviewerReviewCount += 1;
                        if (reviewerReviewCount >= 20) {
                            return #err("review limit reached for this reviewer and profile")
                        }
                    }
                };
                case null {};
            }
        };
        // Related references may point to native or projected claims, but the
        // immutable subject must match the reviewed person. Projected claims
        // are snapshotted once accepted so later profile edits cannot leave
        // the review with a dangling historical reference.
        let projectedSnapshots = Buffer.Buffer<ProfileClaim>(input.related_claims.size());
        for (claimId in input.related_claims.vals()) {
            switch (resolveClaim(claimId)) {
                case null { return #err("related claim unavailable") };
                case (?claim) {
                    // Do not reveal whether an unreadable claim exists or who
                    // owns it. All invalid/unreadable references fail alike.
                    if (
                        not canReadGraphItem(caller, claim.subject, claim.visibility) or
                        claim.subject != profile.owner
                    ) {
                        return #err("related claim unavailable")
                    };
                    if (profileClaims.get(claimId) == null) {
                        projectedSnapshots.add(claim)
                    }
                };
            }
        };
        for (snapshot in projectedSnapshots.vals()) {
            profileClaims.put(snapshot.id, snapshot)
        };
        let now = Time.now();
        let id = generatePeerReviewId();
        let review : PeerReview = {
            id = id;
            profile_id = input.profile_id;
            subject = profile.owner;
            reviewer = caller;
            relationship = input.relationship;
            capability = input.capability;
            context = input.context;
            assessment_tags = input.assessment_tags;
            narrative = input.narrative;
            evidence = input.evidence;
            related_claims = input.related_claims;
            status = #active;
            response = null;
            visibility = input.visibility;
            created_at = now;
            updated_at = now;
        };
        peerReviews.put(id, review);
        appendReviewIndex(input.profile_id, id);
        #ok(id)
    };

    public query ({ caller }) func getPeerReview(reviewId : Text) : async ?PeerReview {
        switch (peerReviews.get(reviewId)) {
            case null null;
            case (?review) {
                if (
                    caller == review.reviewer or
                    canReadGraphItem(caller, review.subject, review.visibility)
                ) { ?review } else { null }
            };
        }
    };

    private func buildPeerReviewPage(
        caller : Principal,
        profileId : Text,
        cursor : Nat,
        requestedPageSize : Nat
    ) : PeerReviewPage {
        let profile = switch (profiles.get(profileId)) {
            case null { return { items = []; next_cursor = null } };
            case (?p) p;
        };
        let ids = switch (profileReviewIndex.get(profileId)) { case (?value) value; case null [] };
        let pageSize = if (requestedPageSize == 0) 1 else if (requestedPageSize > 50) 50 else requestedPageSize;
        let buf = Buffer.Buffer<PeerReview>(pageSize);
        var pos = if (cursor > ids.size()) ids.size() else cursor;
        var scanned : Nat = 0;
        let maxScan : Nat = pageSize * 4 + 32;
        label scan while (pos < ids.size() and buf.size() < pageSize and scanned < maxScan) {
            let id = ids[pos];
            pos += 1;
            scanned += 1;
            switch (peerReviews.get(id)) {
                case (?review) {
                    if (
                        review.subject == profile.owner and
                        (
                            caller == review.reviewer or
                            canReadGraphItem(caller, review.subject, review.visibility)
                        )
                    ) {
                        buf.add(review)
                    }
                };
                case null {};
            }
        };
        { items = Buffer.toArray(buf); next_cursor = if (pos < ids.size()) ?pos else null }
    };

    public query ({ caller }) func listPeerReviewsPage(
        profileId : Text,
        cursor : Nat,
        pageSize : Nat
    ) : async PeerReviewPage {
        buildPeerReviewPage(caller, profileId, cursor, pageSize)
    };

    public query ({ caller }) func listPeerReviews(profileId : Text) : async [PeerReview] {
        buildPeerReviewPage(caller, profileId, 0, 50).items
    };

    public shared ({ caller }) func respondToPeerReview(reviewId : Text, response : Text) : async Result.Result<Nat, Text> {
        if (textBytes(response) > 1024) {
            return #err("review response is too long")
        };
        let review = switch (peerReviews.get(reviewId)) {
            case null { return #err("review unavailable") };
            case (?r) r;
        };
        if (review.subject != caller) {
            return #err("review unavailable")
        };
        peerReviews.put(reviewId, {
            id = review.id;
            profile_id = review.profile_id;
            subject = review.subject;
            reviewer = review.reviewer;
            relationship = review.relationship;
            capability = review.capability;
            context = review.context;
            assessment_tags = review.assessment_tags;
            narrative = review.narrative;
            evidence = review.evidence;
            related_claims = review.related_claims;
            status = review.status;
            response = ?response;
            visibility = review.visibility;
            created_at = review.created_at;
            updated_at = Time.now();
        });
        #ok(1)
    };

    public shared ({ caller }) func disputePeerReview(reviewId : Text, response : ?Text) : async Result.Result<Nat, Text> {
        switch (response) {
            case (?value) {
                if (textBytes(value) > 1024) {
                    return #err("review response is too long")
                }
            };
            case null {};
        };
        let review = switch (peerReviews.get(reviewId)) {
            case null { return #err("review unavailable") };
            case (?r) r;
        };
        if (review.subject != caller) {
            return #err("review unavailable")
        };
        switch (review.status) {
            case (#withdrawn) { return #err("withdrawn reviews cannot be disputed") };
            case (_) {};
        };
        peerReviews.put(reviewId, {
            id = review.id;
            profile_id = review.profile_id;
            subject = review.subject;
            reviewer = review.reviewer;
            relationship = review.relationship;
            capability = review.capability;
            context = review.context;
            assessment_tags = review.assessment_tags;
            narrative = review.narrative;
            evidence = review.evidence;
            related_claims = review.related_claims;
            status = #disputed;
            response = response;
            visibility = review.visibility;
            created_at = review.created_at;
            updated_at = Time.now();
        });
        #ok(1)
    };

    public shared ({ caller }) func withdrawPeerReview(reviewId : Text) : async Result.Result<Nat, Text> {
        let review = switch (peerReviews.get(reviewId)) {
            case null { return #err("review unavailable") };
            case (?r) r;
        };
        if (review.reviewer != caller) {
            return #err("review unavailable")
        };
        peerReviews.put(reviewId, {
            id = review.id;
            profile_id = review.profile_id;
            subject = review.subject;
            reviewer = review.reviewer;
            relationship = review.relationship;
            capability = review.capability;
            context = review.context;
            assessment_tags = review.assessment_tags;
            narrative = review.narrative;
            evidence = review.evidence;
            related_claims = review.related_claims;
            status = #withdrawn;
            response = review.response;
            visibility = review.visibility;
            created_at = review.created_at;
            updated_at = Time.now();
        });
        #ok(1)
    };

    private func externalVerification(record : ActivityRecord) : ProfileGraph.VerificationMethod {
        // ActivityRecord.signature_status is currently supplied by the
        // integration and is not cryptographically verified by this canister.
        // Until policy-specific signature validation exists, external records
        // must not be represented as #signed.
        #imported
    };

    //----------------------------- Integration System ------------------------------------

    private func generateActivityRecordId() : Text {
        activityRecordCounter := activityRecordCounter + 1;
        "activity_" # Nat.toText(activityRecordCounter)
    };

    // Composite keys used in TrieMaps
    private func connectionKey(profileId : Text, appId : Text) : Text {
        profileId # ":" # appId
    };

    private func activityTypeKey(appId : Text, typeKey : Text) : Text {
        appId # ":" # typeKey
    };

    private func summaryKey(profileId : Text, appId : Text, activityType : Text) : Text {
        profileId # ":" # appId # ":" # activityType
    };

    // Register a new 3rd-party app (admin only).
    public shared ({ caller }) func registerApp(newApp : NewIntegrationApp) : async Result.Result<Text, Text> {
        if (not isAdmin(caller)) {
            return #err("no permission")
        };
        switch (integrationApps.get(newApp.id)) {
            case (?_) { #err("app id already registered") };
            case null {
                let app : IntegrationApp = {
                    id = newApp.id;
                    name = newApp.name;
                    description = newApp.description;
                    category = newApp.category;
                    owner = caller;
                    verification_policy = newApp.verification_policy;
                    schema_version = 1;
                    active = true;
                    created_at = Time.now()
                };
                integrationApps.put(newApp.id, app);
                #ok(newApp.id)
            }
        }
    };

    // Register or update an activity type schema (app owner or admin).
    public shared ({ caller }) func registerActivityType(newType : NewActivityType) : async Result.Result<Text, Text> {
        if (Principal.isAnonymous(caller)) {
            return #err("not authenticated")
        };
        let app = integrationApps.get(newType.app_id);
        switch (app) {
            case null { #err("app not found") };
            case (?a) {
                if (a.owner != caller and not isAdmin(caller)) {
                    return #err("not authorized")
                };
                let key = activityTypeKey(newType.app_id, newType.type_key);
                let existing = activityTypesMap.get(key);
                let version = switch (existing) {
                    case (?e) { e.version + 1 };
                    case null { 1 }
                };
                let at : ActivityType = {
                    app_id = newType.app_id;
                    type_key = newType.type_key;
                    type_label = newType.type_label;
                    description = newType.description;
                    fields = newType.fields;
                    version = version;
                    created_at = Time.now()
                };
                activityTypesMap.put(key, at);
                #ok(key)
            }
        }
    };

    // User connects their OneBlock profile to a 3rd-party app.
    public shared ({ caller }) func connectApp(
        appId : AppId,
        externalUserId : Text,
        scopes : [Text]
    ) : async Result.Result<Nat, Text> {
        if (Principal.isAnonymous(caller)) {
            return #err("not authenticated")
        };
        let profileIdOpt = userprofiles.get(caller);
        switch (profileIdOpt) {
            case null { #err("profile not found") };
            case (?profileId) {
                switch (integrationApps.get(appId)) {
                    case null { #err("app not found") };
                    case (?a) {
                        if (not a.active) {
                            return #err("app is not active")
                        };
                        let key = connectionKey(profileId, appId);
                        let now = Time.now();
                        let epochStart = switch (connectionSubjects.get(key)) {
                            case (?subject) {
                                if (subject == caller) {
                                    switch (connectionEpochStarts.get(key)) {
                                        case (?startedAt) startedAt;
                                        case null now;
                                    }
                                } else {
                                    now
                                }
                            };
                            case null now;
                        };
                        let conn : IntegrationConnection = {
                            profile_id = profileId;
                            app_id = appId;
                            external_user_id = externalUserId;
                            scopes = scopes;
                            status = #active;
                            created_at = now;
                            revoked_at = null
                        };
                        connections.put(key, conn);
                        appendUniqueTextIndex(profileConnectionIndex, profileId, appId);
                        connectionSubjects.put(key, caller);
                        connectionEpochStarts.put(key, epochStart);
                        #ok(1)
                    }
                }
            }
        }
    };

    // User revokes a previously granted connection.
    public shared ({ caller }) func revokeConnection(appId : AppId) : async Result.Result<Nat, Text> {
        if (Principal.isAnonymous(caller)) {
            return #err("not authenticated")
        };
        let profileIdOpt = userprofiles.get(caller);
        switch (profileIdOpt) {
            case null { #err("profile not found") };
            case (?profileId) {
                let key = connectionKey(profileId, appId);
                switch (connections.get(key)) {
                    case null { #err("connection not found") };
                    case (?c) {
                        let now = Time.now();
                        connections.put(key, {
                            profile_id = c.profile_id;
                            app_id = c.app_id;
                            external_user_id = c.external_user_id;
                            scopes = c.scopes;
                            status = #revoked;
                            created_at = c.created_at;
                            revoked_at = ?now
                        });
                        #ok(1)
                    }
                }
            }
        }
    };

    public query func getConnection(profileId : ProfileId, appId : AppId) : async ?IntegrationConnection {
        connections.get(connectionKey(profileId, appId))
    };

    public query func listConnections(profileId : ProfileId) : async [IntegrationConnection] {
        let appIds = switch (profileConnectionIndex.get(profileId)) {
            case (?values) values;
            case null [];
        };
        let buf = Buffer.Buffer<IntegrationConnection>(appIds.size());
        for (appId in appIds.vals()) {
            switch (connections.get(connectionKey(profileId, appId))) {
                case (?conn) { buf.add(conn) };
                case null {};
            }
        };
        Buffer.toArray(buf)
    };

    // Submit an activity record on behalf of a user (called by the registered app owner).
    public shared ({ caller }) func submitActivityRecord(newRecord : NewActivityRecord) : async Result.Result<Text, Text> {
        if (Principal.isAnonymous(caller)) {
            return #err("not authenticated")
        };
        // Verify caller is the registered app owner or an admin
        let appOpt = integrationApps.get(newRecord.app_id);
        let app = switch (appOpt) {
            case null { return #err("app not found") };
            case (?a) { a }
        };
        if (app.owner != caller and not isAdmin(caller)) {
            return #err("not authorized to submit records for this app")
        };
        if (not app.active) {
            return #err("app is not active")
        };
        let targetProfile = switch (profiles.get(newRecord.profile_id)) {
            case null { return #err("profile not found") };
            case (?p) p;
        };
        // Check an active connection exists for this profile+app and that
        // the consent belongs to the current immutable profile owner.
        let connKey = connectionKey(newRecord.profile_id, newRecord.app_id);
        switch (connections.get(connKey)) {
            case null { return #err("no active connection for this profile and app") };
            case (?c) {
                if (c.status != #active) {
                    return #err("connection is not active")
                };
                switch (connectionSubjects.get(connKey)) {
                    case (?subject) {
                        if (subject != targetProfile.owner) {
                            return #err("connection ownership does not match current profile owner")
                        }
                    };
                    case null {
                        // Legacy/unbound connections are intentionally
                        // quarantined until the current owner reconnects.
                        return #err("connection ownership is not established; reconnect app")
                    };
                }
            }
        };
        // Enforce idempotency: reject duplicate external events
        let idemKey = newRecord.app_id # ":" # newRecord.idempotency_key;
        switch (idempotencyKeys.get(idemKey)) {
            case (?existingId) { return #err("duplicate event: already recorded as " # existingId) };
            case null {}
        };
        let recordId = generateActivityRecordId();
        let now = Time.now();
        let content = recordId # newRecord.profile_id # newRecord.app_id # Int.toText(newRecord.event_timestamp);
        let record : ActivityRecord = {
            id = recordId;
            profile_id = newRecord.profile_id;
            app_id = newRecord.app_id;
            activity_type = newRecord.activity_type;
            amount = newRecord.amount;
            currency = newRecord.currency;
            event_timestamp = newRecord.event_timestamp;
            ingest_timestamp = now;
            payload = newRecord.payload;
            schema_version = newRecord.schema_version;
            idempotency_key = newRecord.idempotency_key;
            attestation = newRecord.attestation;
            verification_level = #third_party;
            visibility = newRecord.visibility;
            hash = generateHash(content)
        };
        activityRecordsMap.put(recordId, record);
        activityRecordSubjects.put(recordId, targetProfile.owner);
        idempotencyKeys.put(idemKey, recordId);
        // Update per-profile index
        let currentIndex = switch (profileActivityIndex.get(newRecord.profile_id)) {
            case (?ids) { ids };
            case null { [] }
        };
        let idxBuf = Buffer.fromArray<Text>(currentIndex);
        idxBuf.add(recordId);
        profileActivityIndex.put(newRecord.profile_id, Buffer.toArray(idxBuf));
        // Update derived summary
        let sKey = summaryKey(newRecord.profile_id, newRecord.app_id, newRecord.activity_type);
        let existing = derivedSummaries.get(sKey);
        let (prevCount, prevTotal, prevCurrency) = switch (existing) {
            case null { (0, null, newRecord.currency) };
            case (?s) { (s.record_count, s.total_amount, s.currency) }
        };
        let newTotal : ?Float = switch (newRecord.amount) {
            case null { prevTotal };
            case (?amt) {
                switch (prevTotal) {
                    case null { ?amt };
                    case (?prev) { ?(prev + amt) }
                }
            }
        };
        derivedSummaries.put(sKey, {
            profile_id = newRecord.profile_id;
            app_id = newRecord.app_id;
            activity_type = newRecord.activity_type;
            record_count = prevCount + 1;
            total_amount = newTotal;
            currency = prevCurrency;
            last_updated = now
        });
        appendUniqueTextIndex(profileSummaryIndex, newRecord.profile_id, sKey);
        #ok(recordId)
    };

    public query func getActivityRecord(recordId : RecordId) : async ?ActivityRecord {
        activityRecordsMap.get(recordId)
    };

    // List activity records for a profile, optionally filtered by app and/or activity type.
    public query func getActivityRecords(
        profileId : ProfileId,
        appId : ?AppId,
        activityType : ?ActivityTypeKey
    ) : async [ActivityRecord] {
        let ids = switch (profileActivityIndex.get(profileId)) {
            case null { return [] };
            case (?ids) { ids }
        };
        let profile = switch (profiles.get(profileId)) {
            case null { return [] };
            case (?p) p;
        };
        let buf = Buffer.Buffer<ActivityRecord>(0);
        for (rid in ids.vals()) {
            switch (activityRecordSubjects.get(rid), activityRecordsMap.get(rid)) {
                case (?subject, ?r) {
                    if (subject == profile.owner) {
                        let appMatch = switch (appId) {
                            case null { true };
                            case (?aid) { r.app_id == aid }
                        };
                        let typeMatch = switch (activityType) {
                            case null { true };
                            case (?at) { r.activity_type == at }
                        };
                        if (appMatch and typeMatch) {
                            buf.add(r)
                        }
                    }
                };
                case _ {};
            }
        };
        Buffer.toArray(buf)
    };

    public query func getDerivedSummary(
        profileId : ProfileId,
        appId : AppId,
        activityType : ActivityTypeKey
    ) : async ?DerivedSummary {
        derivedSummaries.get(summaryKey(profileId, appId, activityType))
    };

    public query func getApp(appId : AppId) : async ?IntegrationApp {
        integrationApps.get(appId)
    };

    public query func listApps() : async [IntegrationApp] {
        Iter.toArray(integrationApps.vals())
    };

    public query func getActivityType(appId : AppId, typeKey : ActivityTypeKey) : async ?ActivityType {
        activityTypesMap.get(activityTypeKey(appId, typeKey))
    };

    public query func listActivityTypes(appId : AppId) : async [ActivityType] {
        let buf = Buffer.Buffer<ActivityType>(0);
        for ((_, at) in activityTypesMap.entries()) {
            if (at.app_id == appId) {
                buf.add(at)
            }
        };
        Buffer.toArray(buf)
    };

    //----------------------------- Favorites ------------------------------------
    public shared ({ caller }) func addFavorite(favorite : { name : Text; address : Text }) : async Result.Result<Favorite, Text> {
        if (Principal.isAnonymous(caller)) {
            #err("no authenticated")
        } else {
            let f = {
                owner = caller;
                name = favorite.name;
                address = favorite.address
            };
            let fs = myFavorites.get(caller);
            switch (fs) {
                case (?fs) {
                    let bfs = Buffer.fromArray<Favorite>(fs);
                    bfs.add(f);
                    myFavorites.put(caller, Buffer.toArray(bfs))
                };
                case (_) {
                    myFavorites.put(caller, [f])
                }
            };
            #ok(f)
        }
    };

    public query ({ caller }) func getMyFavorites() : async [Favorite] {
        let fs = myFavorites.get(caller);
        switch (fs) {
            case (?fs) { fs };
            case (_) { [] }
        }

    };

    //-----------------------------wallet----------------------------------
    public shared ({ caller }) func addWallet(id : Text, wallet : Types.Wallet) : async Result.Result<Nat, Text> {
        if (Principal.isAnonymous(caller)) {
            #err("no authenticated")
        } else {

            let p = profiles.get(id);
            switch (p) {
                case (?p) {
                    if (p.owner == caller) {
                        let uwallets = wallets.get(id);
                        switch (uwallets) {
                            case (?uwallets) {
                                let bwallets = Buffer.fromArray<Types.Wallet>(uwallets);
                                bwallets.add(wallet);
                                wallets.put(id, Buffer.toArray(bwallets))
                            };
                            case (_) {
                                wallets.put(id, [wallet])
                            }
                        };
                        #ok(1)
                    } else {

                        #err("no permission to add link")
                    };

                };
                case (_) {
                    #err("no profile found")
                }
            };

        }
    };

    

    //=======================================
    // system
    //=======================================

    public shared ({ caller }) func reserveid(id : Text) : async Result.Result<Nat, Text> {
        if (isAdmin(caller)) {
            if (Array.find(reserveIds, func(existingId : Text) : Bool { existingId == id }) != null) {
                return #err("ID already reserved")
            };
            let b = Buffer.fromArray<Text>(reserveIds);
            b.add(id);
            reserveIds := Buffer.toArray<Text>(b);
            #ok(1)
        } else {
            #err("no permission")
        }
    };

    public query ({ caller }) func availableCycles() : async Nat {
        if (isAdmin(caller)) {
            return Cycles.balance()
        } else {
            return 0
        }

    };

    public shared ({ caller }) func addAdmin(pid : Text) : async Result.Result<Nat, Text> {
        if (isAdmin(caller)) {
            let b = Buffer.fromArray<Text>(_admins);
            b.add(pid);
            _admins := Buffer.toArray<Text>(b);
            #ok(1)
        } else {
            #err("no permission")
        }
    };

    private func isAdmin(pid : Principal) : Bool {
        let fa = Array.find(_admins, func(a : Text) : Bool { a == Principal.toText(pid) });
        switch (fa) {
            case (?fa) { true };
            case (_) (false)
        }
    };

    // --------------------------- OIP M2 ---------------------------
    public shared ({ caller }) func createIdentityGraph(input : NewIdentityGraph) : async Result.Result<Nat, Text> {
        if (Principal.isAnonymous(caller)) { return #err("no authenticated") };
        let callerText = Principal.toText(caller);
        if (callerText != input.principal and not isAdmin(caller)) { return #err("no permission") };
        switch (identityGraphs.get(input.principal)) {
            case (?_) { #err("identity graph already exists") };
            case null {
                let now = Time.now();
                identityGraphs.put(input.principal, {
                    principal = input.principal; entity_kind = input.entity_kind; factors = [];
                    scores = defaultScores(now); history = []; created_at = now; updated_at = now;
                });
                #ok(1)
            }
        }
    };

    public shared ({ caller }) func createPolicy(input : NewContextPolicy) : async Result.Result<Nat, Text> {
        if (not isAdmin(caller)) { return #err("no permission") };
        let now = Time.now();
        contextPolicies.put(input.policy_id, {
            policy_id = input.policy_id; name = input.name; description = input.description;
            requirements = input.requirements; weights = input.weights; decay_lambda = input.decay_lambda;
            active = input.active; created_at = now; updated_at = now;
        });
        #ok(1)
    };

    public shared ({ caller }) func registerOipProvider(input : NewOipProvider) : async Result.Result<Nat, Text> {
        if (Principal.isAnonymous(caller)) { return #err("not authenticated") };
        if (Text.size(input.provider_id) < 3) { return #err("provider_id too short") };
        switch (oipProviders.get(input.provider_id)) {
            case (?_) { #err("provider already exists") };
            case null {
                let now = Time.now();
                oipProviders.put(input.provider_id, {
                    provider_id = input.provider_id;
                    owner = caller;
                    name = input.name;
                    capabilities = input.capabilities;
                    verification = input.verification;
                    reliability = clamp01(input.reliability);
                    status = #active;
                    created_at = now;
                    updated_at = now;
                });
                #ok(1)
            }
        }
    };

    public shared ({ caller }) func setProviderStatus(providerId : Text, active : Bool) : async Result.Result<Nat, Text> {
        switch (oipProviders.get(providerId)) {
            case null { #err("provider not found") };
            case (?p) {
                if (p.owner != caller and not isAdmin(caller)) { return #err("no permission") };
                oipProviders.put(providerId, {
                    p with status = if (active) { #active } else { #suspended }; updated_at = Time.now()
                });
                #ok(1)
            }
        }
    };

    public shared ({ caller }) func addFactor(input : NewFactor) : async Result.Result<Text, Text> {
        if (Principal.isAnonymous(caller)) { return #err("no authenticated") };
        let callerText = Principal.toText(caller);
        if (callerText != input.principal and not isAdmin(caller)) { return #err("no permission") };
        switch (identityGraphs.get(input.principal)) {
            case null { #err("identity graph not found") };
            case (?g) {
                let now = Time.now();
                let factor : Factor = {
                    id = generateFactorId(); principal = input.principal; category = input.category;
                    factor_type = input.factor_type; provider = input.provider; value = input.value; verified = input.verified;
                    confidence = clamp01(input.confidence); reliability = clamp01(input.reliability); weight_hint = clamp01(input.weight_hint);
                    issued_at = now; updated_at = now; expires_at = input.expires_at; revoked_at = null; status = #active; metadata = input.metadata;
                };
                let updatedFactors = Array.append(g.factors, [factor]);
                let updatedScores = recomputeScoresInternal({ g with factors = updatedFactors }, null, now);
                let event : Types.FactorEvent = { principal = input.principal; factor_id = ?factor.id; action = #created; reason = null; triggered_by = callerText; timestamp = now; metadata = [] };
                identityGraphs.put(input.principal, { g with factors = updatedFactors; scores = updatedScores; history = Array.append(g.history, [event]); updated_at = now });
                #ok(factor.id)
            }
        }
    };

    public shared ({ caller }) func submitProviderFactor(input : ProviderFactorSubmission) : async Result.Result<Text, Text> {
        if (Principal.isAnonymous(caller)) { return #err("not authenticated") };
        let provider = switch (oipProviders.get(input.provider_id)) {
            case null { return #err("provider not found") };
            case (?p) { p }
        };
        if (provider.owner != caller and not isAdmin(caller)) { return #err("not authorized provider") };
        if (provider.status != #active) { return #err("provider suspended") };
        let idemKey = providerIdemKey(input.provider_id, input.idempotency_key);
        switch (idempotencyKeys.get(idemKey)) {
            case (?rid) { return #err("duplicate submission: " # rid) };
            case null {}
        };
        if (provider.verification == #signed_payload and input.signed_payload == null) {
            return #err("signed_payload required")
        };
        switch (identityGraphs.get(input.principal)) {
            case null { return #err("identity graph not found") };
            case (?g) {
                let now = Time.now();
                let factor : Factor = {
                    id = generateFactorId();
                    principal = input.principal;
                    category = input.category;
                    factor_type = input.factor_type;
                    provider = input.provider_id;
                    value = input.value;
                    verified = true;
                    confidence = clamp01(input.confidence);
                    reliability = clamp01(
                        switch (input.reliability) {
                            case (?r) { r * provider.reliability };
                            case null { provider.reliability };
                        }
                    );
                    weight_hint = clamp01(input.weight_hint);
                    issued_at = now;
                    updated_at = now;
                    expires_at = input.expires_at;
                    revoked_at = null;
                    status = #active;
                    metadata = [
                        { key = "provider_id"; value = input.provider_id },
                        { key = "idempotency_key"; value = input.idempotency_key }
                    ];
                };
                let updatedFactors = Array.append(g.factors, [factor]);
                let updatedScores = recomputeScoresInternal({ g with factors = updatedFactors }, null, now);
                let event : Types.FactorEvent = {
                    principal = input.principal; factor_id = ?factor.id; action = #created;
                    reason = ?"provider_submission"; triggered_by = Principal.toText(caller); timestamp = now; metadata = factor.metadata;
                };
                identityGraphs.put(input.principal, {
                    g with factors = updatedFactors; scores = updatedScores; history = Array.append(g.history, [event]); updated_at = now
                });
                idempotencyKeys.put(idemKey, factor.id);
                #ok(factor.id)
            }
        }
    };

    public query func getOipProvider(providerId : Text) : async ?OipProvider {
        oipProviders.get(providerId)
    };

    public query func listOipProviders() : async [OipProvider] {
        Iter.toArray(oipProviders.vals())
    };

    public shared ({ caller }) func addTrustEdge(to_principal : Text, context : Text, trust : Float, confidence : Float) : async Result.Result<Nat, Text> {
        if (Principal.isAnonymous(caller)) { return #err("no authenticated") };
        let fromP = Principal.toText(caller);
        let key = edgeKey(fromP, to_principal, context);
        let now = Time.now();
        trustEdges.put(key, { id = key; from_principal = fromP; to_principal = to_principal; context = context; trust = clamp01(trust); confidence = clamp01(confidence); created_at = now; updated_at = now });
        #ok(1)
    };

    public query func getInboundTrust(principal : Text) : async [TrustEdge] {
        let b = Buffer.Buffer<TrustEdge>(0);
        for ((_, e) in trustEdges.entries()) { if (e.to_principal == principal) { b.add(e) } };
        Buffer.toArray(b)
    };

    public shared ({ caller }) func recomputeScores(principal : Text, policyId : ?Text) : async Result.Result<ProbabilityScores, Text> {
        if (Principal.isAnonymous(caller)) { return #err("no authenticated") };
        let callerText = Principal.toText(caller);
        if (callerText != principal and not isAdmin(caller)) { return #err("no permission") };
        switch (identityGraphs.get(principal)) {
            case null { #err("identity graph not found") };
            case (?g) {
                let policy = switch (policyId) { case null null; case (?id) contextPolicies.get(id) };
                let now = Time.now();
                let s = recomputeScoresInternal(g, policy, now);
                let event : Types.FactorEvent = { principal = principal; factor_id = null; action = #recomputed; reason = policyId; triggered_by = callerText; timestamp = now; metadata = [] };
                identityGraphs.put(principal, { g with scores = s; history = Array.append(g.history, [event]); updated_at = now });
                #ok(s)
            }
        }
    };

    public shared ({ caller }) func runDecaySweep() : async Nat {
        if (not isAdmin(caller)) { return 0 };
        let now = Time.now();
        var count : Nat = 0;
        for ((pid, g) in identityGraphs.entries()) {
            let s = recomputeScoresInternal(g, null, now);
            identityGraphs.put(pid, { g with scores = s; updated_at = now });
            count += 1;
        };
        count
    };

    public query func getScores(principal : Text) : async ?ProbabilityScores {
        switch (identityGraphs.get(principal)) { case null null; case (?g) ?g.scores }
    };

    public query func evaluatePolicy(principal : Text, policyId : Text) : async Result.Result<PolicyEvaluation, Text> {
        switch (identityGraphs.get(principal)) {
            case null { #err("identity graph not found") };
            case (?g) {
                switch (contextPolicies.get(policyId)) {
                    case null { #err("policy not found") };
                    case (?p) {
                        let b = Buffer.Buffer<PolicyEvaluationItem>(0);
                        let s = g.scores;
                        switch (p.requirements.min_human_score) { case (?v) b.add({ key = "min_human_score"; passed = s.human_score >= v; expected = Float.toText(v); actual = Float.toText(s.human_score) }); case null {} };
                        switch (p.requirements.min_uniqueness_score) { case (?v) b.add({ key = "min_uniqueness_score"; passed = s.uniqueness_score >= v; expected = Float.toText(v); actual = Float.toText(s.uniqueness_score) }); case null {} };
                        switch (p.requirements.min_trust_score) { case (?v) b.add({ key = "min_trust_score"; passed = s.trust_score >= v; expected = Float.toText(v); actual = Float.toText(s.trust_score) }); case null {} };
                        switch (p.requirements.min_reputation_score) { case (?v) b.add({ key = "min_reputation_score"; passed = s.reputation_score >= v; expected = Float.toText(v); actual = Float.toText(s.reputation_score) }); case null {} };
                        let items = Buffer.toArray(b);
                        var allPass = true;
                        for (it in items.vals()) { if (not it.passed) { allPass := false } };
                        #ok({ policy_id = policyId; principal = principal; passed = allPass; items = items; evaluated_at = Time.now() })
                    }
                }
            }
        }
    }
}
