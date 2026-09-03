import Cycles "mo:base/ExperimentalCycles";
import Nat "mo:base/Nat";
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

import Types "types";

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
    var stableActivityRecords : [(Text, ActivityRecord)] = [];
    var stableActivityConnectionEpochs : [(Text, Int)] = []; // recordId -> connection.created_at
    var stableIdempotencyKeys : [(Text, Text)] = []; // idempotency_key -> record_id
    var stableProfileActivityIndex : [(Text, [Text])] = []; // profileId -> [recordId]
    var stableDerivedSummaries : [(Text, DerivedSummary)] = [];
    var stablePublicDerivedSummaries : [(Text, DerivedSummary)] = [];
    var integrationCompositeKeysMigratedV1 : Bool = false;
    var summaryCachesMigratedV1 : Bool = false;
    var stableIdentityGraphs : [(Text, IdentityGraph)] = [];
    var stableContextPolicies : [(Text, ContextPolicy)] = [];
    var stableTrustEdges : [(Text, TrustEdge)] = [];
    var stableOipProviders : [(Text, OipProvider)] = [];

    var reserveIds : [Text] = ["oneblock", "block", "about", "admin", "status", "update"];

    var _admins : [Text] = ["3z4ue-dry77-pvwdh-4ugn3-lu2wi-sbfp6-7xzaf-jupqw-vqiit-zi7m7-gae"];

    var blockIdCounter : Nat = 0;
    var traitIdCounter : Nat = 0;
    var activityRecordCounter : Nat = 0;
    var factorIdCounter : Nat = 0;

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

    transient var activityRecordsMap = TrieMap.TrieMap<Text, ActivityRecord>(Text.equal, Text.hash);
    activityRecordsMap := TrieMap.fromEntries<Text, ActivityRecord>(Iter.fromArray(stableActivityRecords), Text.equal, Text.hash);

    transient var activityConnectionEpochs = TrieMap.TrieMap<Text, Int>(Text.equal, Text.hash);
    activityConnectionEpochs := TrieMap.fromEntries<Text, Int>(Iter.fromArray(stableActivityConnectionEpochs), Text.equal, Text.hash);

    transient var idempotencyKeys = TrieMap.TrieMap<Text, Text>(Text.equal, Text.hash);
    idempotencyKeys := TrieMap.fromEntries<Text, Text>(Iter.fromArray(stableIdempotencyKeys), Text.equal, Text.hash);

    transient var profileActivityIndex = TrieMap.TrieMap<Text, [Text]>(Text.equal, Text.hash);
    profileActivityIndex := TrieMap.fromEntries<Text, [Text]>(Iter.fromArray(stableProfileActivityIndex), Text.equal, Text.hash);

    transient var derivedSummaries = TrieMap.TrieMap<Text, DerivedSummary>(Text.equal, Text.hash);
    derivedSummaries := TrieMap.fromEntries<Text, DerivedSummary>(Iter.fromArray(stableDerivedSummaries), Text.equal, Text.hash);
    transient var publicDerivedSummaries = TrieMap.TrieMap<Text, DerivedSummary>(Text.equal, Text.hash);
    publicDerivedSummaries := TrieMap.fromEntries<Text, DerivedSummary>(Iter.fromArray(stablePublicDerivedSummaries), Text.equal, Text.hash);
    transient var identityGraphs = TrieMap.TrieMap<Text, IdentityGraph>(Text.equal, Text.hash);
    identityGraphs := TrieMap.fromEntries<Text, IdentityGraph>(Iter.fromArray(stableIdentityGraphs), Text.equal, Text.hash);
    transient var contextPolicies = TrieMap.TrieMap<Text, ContextPolicy>(Text.equal, Text.hash);
    contextPolicies := TrieMap.fromEntries<Text, ContextPolicy>(Iter.fromArray(stableContextPolicies), Text.equal, Text.hash);
    transient var trustEdges = TrieMap.TrieMap<Text, TrustEdge>(Text.equal, Text.hash);
    trustEdges := TrieMap.fromEntries<Text, TrustEdge>(Iter.fromArray(stableTrustEdges), Text.equal, Text.hash);
    transient var oipProviders = TrieMap.TrieMap<Text, OipProvider>(Text.equal, Text.hash);
    oipProviders := TrieMap.fromEntries<Text, OipProvider>(Iter.fromArray(stableOipProviders), Text.equal, Text.hash);

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
        stableActivityRecords := Iter.toArray(activityRecordsMap.entries());
        stableActivityConnectionEpochs := Iter.toArray(activityConnectionEpochs.entries());
        stableIdempotencyKeys := Iter.toArray(idempotencyKeys.entries());
        stableProfileActivityIndex := Iter.toArray(profileActivityIndex.entries());
        stableDerivedSummaries := Iter.toArray(derivedSummaries.entries());
        stablePublicDerivedSummaries := Iter.toArray(publicDerivedSummaries.entries());
        stableIdentityGraphs := Iter.toArray(identityGraphs.entries());
        stableContextPolicies := Iter.toArray(contextPolicies.entries());
        stableTrustEdges := Iter.toArray(trustEdges.entries());
        stableOipProviders := Iter.toArray(oipProviders.entries())
    };

    system func postupgrade() {
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
        stableActivityRecords := [];
        stableActivityConnectionEpochs := [];
        stableIdempotencyKeys := [];
        stableProfileActivityIndex := [];
        stableDerivedSummaries := [];

        // Migrate delimiter-based integration keys to collision-free length-prefixed
        // keys. Re-key from stored identities rather than trusting the old key text.
        if (not integrationCompositeKeysMigratedV1) {
            let connectionValues = Iter.toArray(connections.vals());
            connections := TrieMap.TrieMap<Text, IntegrationConnection>(Text.equal, Text.hash);
            for (connection in connectionValues.vals()) {
                connections.put(connectionKey(connection.profile_id, connection.app_id), connection)
            };

            let activityTypeValues = Iter.toArray(activityTypesMap.vals());
            activityTypesMap := TrieMap.TrieMap<Text, ActivityType>(Text.equal, Text.hash);
            for (activityType in activityTypeValues.vals()) {
                activityTypesMap.put(activityTypeKey(activityType.app_id, activityType.type_key), activityType)
            };

            // Summary keys used the same ambiguous delimiter scheme. Force the
            // record-by-record rebuild below so mixed/collided legacy aggregates
            // are never carried forward under the new key format.
            summaryCachesMigratedV1 := false;
            integrationCompositeKeysMigratedV1 := true
        };

        // One-time compatibility migration for deployments created before the
        // visibility-separated summary caches existed. Rebuild both owner/full
        // and public/global caches from each current profile's append-only activity
        // index. The index preserves submission order, so currency selection remains
        // deterministic even when multiple records share an ingest timestamp.
        if (not summaryCachesMigratedV1) {
            derivedSummaries := TrieMap.TrieMap<Text, DerivedSummary>(Text.equal, Text.hash);
            publicDerivedSummaries := TrieMap.TrieMap<Text, DerivedSummary>(Text.equal, Text.hash);

            for ((profileId, profile) in profiles.entries()) {
                switch (profileActivityIndex.get(profileId)) {
                    case null {};
                    case (?recordIds) {
                        for (recordId in recordIds.vals()) {
                            switch (activityRecordsMap.get(recordId)) {
                                case null {};
                                case (?record) {
                                    // Fail closed across reusable profile IDs and legacy
                                    // connections. A record must be attributable to a connection
                                    // epoch belonging to the current profile incarnation.
                                    if (recordBelongsToProfileIncarnation(profileId, profile, record)) {
                                        let key = summaryKey(profileId, record.app_id, record.activity_type);
                                        let existing = derivedSummaries.get(key);
                                        let (prevCount, prevTotal, prevCurrency) = switch (existing) {
                                            case null { (0, null, record.currency) };
                                            case (?summary) { (summary.record_count, summary.total_amount, summary.currency) };
                                        };
                                        let nextTotal : ?Float = switch (record.amount) {
                                            case null { prevTotal };
                                            case (?amount) {
                                                switch (prevTotal) {
                                                    case null { ?amount };
                                                    case (?total) { ?(total + amount) };
                                                }
                                            };
                                        };
                                        derivedSummaries.put(key, {
                                            profile_id = profileId;
                                            app_id = record.app_id;
                                            activity_type = record.activity_type;
                                            record_count = prevCount + 1;
                                            total_amount = nextTotal;
                                            currency = prevCurrency;
                                            last_updated = record.ingest_timestamp;
                                        });

                                        if (record.visibility == #global) {
                                            let publicExisting = publicDerivedSummaries.get(key);
                                            let (publicPrevCount, publicPrevTotal, publicPrevCurrency) = switch (publicExisting) {
                                                case null { (0, null, record.currency) };
                                                case (?summary) { (summary.record_count, summary.total_amount, summary.currency) };
                                            };
                                            let publicNextTotal : ?Float = switch (record.amount) {
                                                case null { publicPrevTotal };
                                                case (?amount) {
                                                    switch (publicPrevTotal) {
                                                        case null { ?amount };
                                                        case (?total) { ?(total + amount) };
                                                    }
                                                };
                                            };
                                            publicDerivedSummaries.put(key, {
                                                profile_id = profileId;
                                                app_id = record.app_id;
                                                activity_type = record.activity_type;
                                                record_count = publicPrevCount + 1;
                                                total_amount = publicNextTotal;
                                                currency = publicPrevCurrency;
                                                last_updated = record.ingest_timestamp;
                                            })
                                        }
                                    }
                                };
                            }
                        }
                    };
                }
            };
            summaryCachesMigratedV1 := true
        };
        stablePublicDerivedSummaries := [];
        stableIdentityGraphs := [];
        stableContextPolicies := [];
        stableTrustEdges := [];
        stableOipProviders := []
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
                                // A public profile ID is reusable. Purge any destination-only
                                // integration state left behind by a legacy rename before moving
                                // the current profile into that ID, then migrate only source state.
                                ignore profileActivityIndex.remove(nid);
                                for ((connectionKeyToRemove, connection) in Iter.toArray(connections.entries()).vals()) {
                                    if (connection.profile_id == nid) {
                                        ignore connections.remove(connectionKeyToRemove)
                                    }
                                };
                                for ((summaryKeyToRemove, summary) in Iter.toArray(derivedSummaries.entries()).vals()) {
                                    if (summary.profile_id == nid) {
                                        ignore derivedSummaries.remove(summaryKeyToRemove)
                                    }
                                };
                                for ((summaryKeyToRemove, summary) in Iter.toArray(publicDerivedSummaries.entries()).vals()) {
                                    if (summary.profile_id == nid) {
                                        ignore publicDerivedSummaries.remove(summaryKeyToRemove)
                                    }
                                };

                                // Keep integration ownership/indexes attached to the profile when its public id changes.
                                switch (profileActivityIndex.get(oid)) {
                                    case (?recordIds) {
                                        profileActivityIndex.put(nid, recordIds);
                                        ignore profileActivityIndex.remove(oid);
                                    };
                                    case null {};
                                };
                                for ((oldConnectionKey, connection) in Iter.toArray(connections.entries()).vals()) {
                                    if (connection.profile_id == oid) {
                                        ignore connections.remove(oldConnectionKey);
                                        connections.put(
                                            connectionKey(nid, connection.app_id),
                                            { connection with profile_id = nid }
                                        )
                                    }
                                };
                                for ((oldSummaryKey, summary) in Iter.toArray(derivedSummaries.entries()).vals()) {
                                    if (summary.profile_id == oid) {
                                        let newSummaryKey = summaryKey(nid, summary.app_id, summary.activity_type);
                                        derivedSummaries.put(newSummaryKey, { summary with profile_id = nid });
                                        ignore derivedSummaries.remove(oldSummaryKey);
                                    }
                                };
                                for ((oldSummaryKey, summary) in Iter.toArray(publicDerivedSummaries.entries()).vals()) {
                                    if (summary.profile_id == oid) {
                                        let newSummaryKey = summaryKey(nid, summary.app_id, summary.activity_type);
                                        publicDerivedSummaries.put(newSummaryKey, { summary with profile_id = nid });
                                        ignore publicDerivedSummaries.remove(oldSummaryKey);
                                    }
                                };

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

    // Public profile reads expose only public evidence indexes. The owner keeps
    // the full block/trait index through caller-aware reads and getMyProfile.
    private func sanitizeProfileEvidence(caller : Principal, profile : Profile) : Profile {
        if (caller == profile.owner) {
            return profile
        };

        let publicBlocks = Buffer.Buffer<Text>(0);
        for (blockId in profile.blocks.vals()) {
            switch (blocks.get(blockId)) {
                case (?block) {
                    if (block.visibility == #global) {
                        publicBlocks.add(blockId)
                    }
                };
                case null {};
            }
        };

        let publicTraits = Buffer.Buffer<Text>(0);
        for (traitId in profile.traits.vals()) {
            switch (traits.get(traitId)) {
                case (?trait) {
                    if (trait.visibility == #global) {
                        publicTraits.add(traitId)
                    }
                };
                case null {};
            }
        };

        {
            profile with
            blocks = Buffer.toArray(publicBlocks);
            traits = Buffer.toArray(publicTraits);
        }
    };

    public query ({ caller }) func getProfiles(pageSize : Nat, pageNumber : Nat) : async [Profile] {
        let profileEntries = Iter.toArray(profiles.entries());
        let totalProfiles = profileEntries.size();
        let startIndex = pageNumber * pageSize;
        if (startIndex >= totalProfiles) {
            return []
        };
        let resultSize = Nat.min(pageSize, totalProfiles - startIndex);

        Array.tabulate<Profile>(
            resultSize,
            func(i) {
                let (_, profile) = profileEntries[startIndex + i];
                sanitizeProfileEvidence(caller, profile)
            },
        )
    };

    public query ({ caller }) func getDefaultProfiles(size : Nat) : async [Profile] {

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
            func(i) { sanitizeProfileEvidence(caller, sortedProfiles[i]) },
        )
    };

    public query ({ caller }) func searchProfilesByName(q : Text) : async [Profile] {
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
                sanitizeProfileEvidence(caller, profile)
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

    public query ({ caller }) func getProfile(id : Text) : async ?Profile {
        switch (profiles.get(id)) {
            case null { null };
            case (?profile) { ?sanitizeProfileEvidence(caller, profile) };
        }
    };

    public query ({ caller }) func getProfileByPrincipal(principal : Text) : async ?Profile {
        let pt = userprofiles.get(Principal.fromText(principal));
        switch (pt) {
            case (?pt) {
                switch (profiles.get(pt)) {
                    case null { null };
                    case (?profile) { ?sanitizeProfileEvidence(caller, profile) };
                }
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

    private func profileContainsTrait(profile : Profile, traitId : Text) : Bool {
        for (candidateId in profile.traits.vals()) {
            if (candidateId == traitId) {
                return true
            }
        };
        false
    };

    private func callerOwnsTrait(caller : Principal, traitId : Text) : Bool {
        switch (userprofiles.get(caller)) {
            case null { false };
            case (?profileId) {
                switch (profiles.get(profileId)) {
                    case null { false };
                    case (?profile) { profileContainsTrait(profile, traitId) };
                }
            };
        }
    };

    private func canReadTrait(caller : Principal, profile : Profile, trait : Trait) : Bool {
        if (caller == profile.owner) {
            return true
        };
        switch (trait.visibility) {
            case (#global) { true };
            case (#unlisted) { false };
            case (#personal) { false };
        }
    };

    public query ({ caller }) func getTrait(traitId : Text) : async ?Trait {
        switch (traits.get(traitId)) {
            case null { null };
            case (?trait) {
                switch (trait.visibility) {
                    case (#global) { ?trait };
                    case (#unlisted) { if (callerOwnsTrait(caller, traitId)) { ?trait } else { null } };
                    case (#personal) { if (callerOwnsTrait(caller, traitId)) { ?trait } else { null } };
                }
            };
        }
    };

    public query ({ caller }) func getTraits(profileId : Text) : async [Trait] {
        switch (profiles.get(profileId)) {
            case (?profile) {
                let traitList = Buffer.Buffer<Trait>(0);
                for (traitId in profile.traits.vals()) {
                    switch (traits.get(traitId)) {
                        case (?trait) {
                            if (canReadTrait(caller, profile, trait)) {
                                traitList.add(trait)
                            }
                        };
                        case null {};
                    }
                };
                Buffer.toArray(traitList)
            };
            case null { [] };
        }
    };

    //----------------------------- Integration System ------------------------------------

    private func generateActivityRecordId() : Text {
        activityRecordCounter := activityRecordCounter + 1;
        "activity_" # Nat.toText(activityRecordCounter)
    };

    // Collision-free composite keys. Length-prefixing keeps arbitrary Text IDs,
    // including values containing ':', unambiguous without changing public APIs.
    private func keyPart(value : Text) : Text {
        Nat.toText(Text.size(value)) # ":" # value
    };

    private func connectionKey(profileId : Text, appId : Text) : Text {
        "connection:" # keyPart(profileId) # keyPart(appId)
    };

    private func activityTypeKey(appId : Text, typeKey : Text) : Text {
        "activity-type:" # keyPart(appId) # keyPart(typeKey)
    };

    private func summaryKey(profileId : Text, appId : Text, activityType : Text) : Text {
        "summary:" # keyPart(profileId) # keyPart(appId) # keyPart(activityType)
    };

    private func getConnectionExact(profileId : ProfileId, appId : AppId) : ?IntegrationConnection {
        switch (connections.get(connectionKey(profileId, appId))) {
            case (?connection) {
                if (connection.profile_id == profileId and connection.app_id == appId) {
                    ?connection
                } else {
                    null
                }
            };
            case null { null };
        }
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
                        let conn : IntegrationConnection = {
                            profile_id = profileId;
                            app_id = appId;
                            external_user_id = externalUserId;
                            scopes = scopes;
                            status = #active;
                            created_at = Time.now();
                            revoked_at = null
                        };
                        connections.put(key, conn);
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
        getConnectionExact(profileId, appId)
    };

    public query func listConnections(profileId : ProfileId) : async [IntegrationConnection] {
        let buf = Buffer.Buffer<IntegrationConnection>(0);
        for ((_, conn) in connections.entries()) {
            if (conn.profile_id == profileId) {
                buf.add(conn)
            }
        };
        Buffer.toArray(buf)
    };

    // Submit an activity record on behalf of a user (called by the registered app owner).
    public shared ({ caller }) func submitActivityRecord(newRecord : NewActivityRecord) : async Result.Result<Text, Text> {
        if (Principal.isAnonymous(caller)) {
            return #err("not authenticated")
        };
        // Resolve the current profile incarnation before trusting integration
        // indexes keyed by a reusable public profile id.
        let profile = switch (profiles.get(newRecord.profile_id)) {
            case null { return #err("profile not found") };
            case (?profile) { profile };
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
        // Check an exact active connection exists for this profile+app and bind
        // the record to that connection epoch for future ownership checks.
        let connection = switch (getConnectionExact(newRecord.profile_id, newRecord.app_id)) {
            case null { return #err("no active connection for this profile and app") };
            case (?connection) {
                if (connection.status != #active) {
                    return #err("connection is not active")
                };
                if (connection.created_at < profile.createtime) {
                    return #err("connection belongs to an earlier profile incarnation")
                };
                connection
            };
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
        activityConnectionEpochs.put(recordId, connection.created_at);
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
        let existing = switch (derivedSummaries.get(sKey)) {
            case (?summary) {
                if (summary.last_updated >= profile.createtime) { ?summary } else { null }
            };
            case null { null };
        };
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

        // Maintain a second aggregate containing public evidence only. This keeps
        // public summary reads O(1) without allowing private counts/amounts to leak.
        if (newRecord.visibility == #global) {
            let publicExisting = switch (publicDerivedSummaries.get(sKey)) {
                case (?summary) {
                    if (summary.last_updated >= profile.createtime) { ?summary } else { null }
                };
                case null { null };
            };
            let (publicPrevCount, publicPrevTotal, publicPrevCurrency) = switch (publicExisting) {
                case null { (0, null, newRecord.currency) };
                case (?summary) { (summary.record_count, summary.total_amount, summary.currency) };
            };
            let publicNewTotal : ?Float = switch (newRecord.amount) {
                case null { publicPrevTotal };
                case (?amount) {
                    switch (publicPrevTotal) {
                        case null { ?amount };
                        case (?total) { ?(total + amount) };
                    }
                };
            };
            publicDerivedSummaries.put(sKey, {
                profile_id = newRecord.profile_id;
                app_id = newRecord.app_id;
                activity_type = newRecord.activity_type;
                record_count = publicPrevCount + 1;
                total_amount = publicNewTotal;
                currency = publicPrevCurrency;
                last_updated = now
            })
        };
        #ok(recordId)
    };

    private func activityIndexContains(profileId : ProfileId, recordId : RecordId) : Bool {
        switch (profileActivityIndex.get(profileId)) {
            case null { false };
            case (?recordIds) {
                for (candidateId in recordIds.vals()) {
                    if (candidateId == recordId) {
                        return true
                    }
                };
                false
            };
        }
    };

    private func recordBelongsToProfileIncarnation(
        profileId : ProfileId,
        profile : Profile,
        record : ActivityRecord
    ) : Bool {
        if (record.ingest_timestamp < profile.createtime) {
            return false
        };

        switch (activityConnectionEpochs.get(record.id)) {
            case (?connectionEpoch) {
                // New records carry the exact connection epoch used at submission.
                connectionEpoch >= profile.createtime and record.ingest_timestamp >= connectionEpoch
            };
            case null {
      // Legacy records have no verifiable connection-incarnation provenance.
      // Timestamps from the current connection are insufficient because a
      // reusable profile ID may have inherited stale destination state.
      // Fail closed rather than guessing historical ownership.
      false
  };
        }
    };

    private func callerOwnsActivityRecord(caller : Principal, recordId : RecordId) : Bool {
        switch (userprofiles.get(caller)) {
            case null { false };
            case (?profileId) {
                switch (profiles.get(profileId)) {
                    case null { false };
                    case (?profile) {
                        switch (activityRecordsMap.get(recordId)) {
                            case null { false };
                            case (?record) {
                                activityIndexContains(profileId, recordId) and
                                recordBelongsToProfileIncarnation(profileId, profile, record)
                            };
                        }
                    };
                }
            };
        }
    };

    private func canReadActivityRecord(
        caller : Principal,
        profileId : ProfileId,
        profile : Profile,
        record : ActivityRecord
    ) : Bool {
        if (not recordBelongsToProfileIncarnation(profileId, profile, record)) {
            return false
        };
        if (caller == profile.owner) {
            return true
        };
        switch (record.visibility) {
            case (#global) { true };
            case (#unlisted) { false };
            case (#personal) { false };
        }
    };

    public query ({ caller }) func getActivityRecord(recordId : RecordId) : async ?ActivityRecord {
        switch (activityRecordsMap.get(recordId)) {
            case null { null };
            case (?record) {
                switch (record.visibility) {
                    case (#global) { ?record };
                    case (#unlisted) { if (callerOwnsActivityRecord(caller, recordId)) { ?record } else { null } };
                    case (#personal) { if (callerOwnsActivityRecord(caller, recordId)) { ?record } else { null } };
                }
            };
        }
    };

    // List activity records for a profile, optionally filtered by app and/or activity type.
    public query ({ caller }) func getActivityRecords(
        profileId : ProfileId,
        appId : ?AppId,
        activityType : ?ActivityTypeKey
    ) : async [ActivityRecord] {
        let profile = switch (profiles.get(profileId)) {
            case null { return [] };
            case (?profile) { profile };
        };
        let ids = switch (profileActivityIndex.get(profileId)) {
            case null { return [] };
            case (?ids) { ids };
        };
        let buf = Buffer.Buffer<ActivityRecord>(0);
        for (rid in ids.vals()) {
            switch (activityRecordsMap.get(rid)) {
                case null {};
                case (?record) {
                    let appMatch = switch (appId) {
                        case null { true };
                        case (?aid) { record.app_id == aid };
                    };
                    let typeMatch = switch (activityType) {
                        case null { true };
                        case (?at) { record.activity_type == at };
                    };
                    if (appMatch and typeMatch and canReadActivityRecord(caller, profileId, profile, record)) {
                        buf.add(record)
                    }
                };
            }
        };
        Buffer.toArray(buf)
    };

    // Keep summary reads O(1) while preserving visibility: owners read the full
    // aggregate; everyone else reads the global-only aggregate.
    public query ({ caller }) func getDerivedSummary(
        profileId : ProfileId,
        appId : AppId,
        activityType : ActivityTypeKey
    ) : async ?DerivedSummary {
        switch (profiles.get(profileId)) {
            case null { null };
            case (?profile) {
                let key = summaryKey(profileId, appId, activityType);
                let summary = if (caller == profile.owner) {
                    derivedSummaries.get(key)
                } else {
                    publicDerivedSummaries.get(key)
                };
                switch (summary) {
                    case (?value) {
                        if (value.last_updated >= profile.createtime) { ?value } else { null }
                    };
                    case null { null };
                }
            };
        }
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
