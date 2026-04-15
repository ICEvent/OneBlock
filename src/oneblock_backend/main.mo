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
    var stableIdempotencyKeys : [(Text, Text)] = []; // idempotency_key -> record_id
    var stableProfileActivityIndex : [(Text, [Text])] = []; // profileId -> [recordId]
    var stableDerivedSummaries : [(Text, DerivedSummary)] = [];

    var reserveIds : [Text] = ["oneblock", "block", "about", "admin", "status", "update"];

    var _admins : [Text] = ["3z4ue-dry77-pvwdh-4ugn3-lu2wi-sbfp6-7xzaf-jupqw-vqiit-zi7m7-gae"];

    var blockIdCounter : Nat = 0;
    var traitIdCounter : Nat = 0;
    var activityRecordCounter : Nat = 0;

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

    transient var idempotencyKeys = TrieMap.TrieMap<Text, Text>(Text.equal, Text.hash);
    idempotencyKeys := TrieMap.fromEntries<Text, Text>(Iter.fromArray(stableIdempotencyKeys), Text.equal, Text.hash);

    transient var profileActivityIndex = TrieMap.TrieMap<Text, [Text]>(Text.equal, Text.hash);
    profileActivityIndex := TrieMap.fromEntries<Text, [Text]>(Iter.fromArray(stableProfileActivityIndex), Text.equal, Text.hash);

    transient var derivedSummaries = TrieMap.TrieMap<Text, DerivedSummary>(Text.equal, Text.hash);
    derivedSummaries := TrieMap.fromEntries<Text, DerivedSummary>(Iter.fromArray(stableDerivedSummaries), Text.equal, Text.hash);

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
        stableIdempotencyKeys := Iter.toArray(idempotencyKeys.entries());
        stableProfileActivityIndex := Iter.toArray(profileActivityIndex.entries());
        stableDerivedSummaries := Iter.toArray(derivedSummaries.entries())
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
        stableIdempotencyKeys := [];
        stableProfileActivityIndex := [];
        stableDerivedSummaries := []
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

    public query func getBlock(blockId : Text) : async ?Block {
        blocks.get(blockId)
    };

    public query func listBlocks(profileId : Text) : async [Block] {
        let profile = profiles.get(profileId);
        switch (profile) {
            case (?p) {
                let blockList = Buffer.Buffer<Block>(0);
                for (blockId in p.blocks.vals()) {
                    let block = blocks.get(blockId);
                    switch (block) {
                        case (?b) {
                            blockList.add(b);
                        };
                        case null {};
                    };
                };
                Buffer.toArray(blockList)
            };
            case null { [] };
        };
    };

    public query func getChain(profileId : Text) : async [Block] {
        let profile = profiles.get(profileId);
        let blockList = switch (profile) {
            case (?p) {
                let list = Buffer.Buffer<Block>(0);
                for (blockId in p.blocks.vals()) {
                    let block = blocks.get(blockId);
                    switch (block) {
                        case (?b) { list.add(b); };
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
        connections.get(connectionKey(profileId, appId))
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
        // Check an active connection exists for this profile+app
        let connKey = connectionKey(newRecord.profile_id, newRecord.app_id);
        switch (connections.get(connKey)) {
            case null { return #err("no active connection for this profile and app") };
            case (?c) {
                if (c.status != #active) {
                    return #err("connection is not active")
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
        let buf = Buffer.Buffer<ActivityRecord>(0);
        for (rid in ids.vals()) {
            switch (activityRecordsMap.get(rid)) {
                case null {};
                case (?r) {
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
    }
}
