import Cycles "mo:base/ExperimentalCycles";
import Nat "mo:base/Nat";
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

actor {
    type Profile = Types.Profile;
    type Favorite = Types.Favorite;
    type Inbox = Types.Inbox;
    type Canister = Types.Canister;

    stable var stableProfiles : [(Text, Profile)] = [];
    stable var stableFeaturedProfiles : [Profile] = [];

    stable var userProfiles : [(Principal, Text)] = [];
    stable var upgradeInboxes : [(Text, Inbox)] = [];
    stable var userWallets : [(Text, [Types.Wallet])] = [];
    stable var upgradeFavorites : [(Principal, [Favorite])] = [];
    stable var upgradeCanisters : [(Principal, Canister)] = [];

    stable var reserveIds : [Text] = ["oneblock", "block", "about", "admin", "status", "update"];

    stable var _admins : [Text] = ["3z4ue-dry77-pvwdh-4ugn3-lu2wi-sbfp6-7xzaf-jupqw-vqiit-zi7m7-gae"];

    var profiles = TrieMap.TrieMap<Text, Profile>(Text.equal, Text.hash);
    profiles := TrieMap.fromEntries<Text, Profile>(Iter.fromArray(stableProfiles), Text.equal, Text.hash);

    var featuredProfiles = Buffer.Buffer<Profile>(0);

    var inboxes = TrieMap.TrieMap<Text, Inbox>(Text.equal, Text.hash);
    inboxes := TrieMap.fromEntries<Text, Inbox>(Iter.fromArray(upgradeInboxes), Text.equal, Text.hash);

    var userprofiles = TrieMap.TrieMap<Principal, Text>(Principal.equal, Principal.hash);
    userprofiles := TrieMap.fromEntries<Principal, Text>(Iter.fromArray(userProfiles), Principal.equal, Principal.hash);

    var wallets = TrieMap.TrieMap<Text, [Types.Wallet]>(Text.equal, Text.hash);
    wallets := TrieMap.fromEntries<Text, [Types.Wallet]>(Iter.fromArray(userWallets), Text.equal, Text.hash);

    var myFavorites = TrieMap.TrieMap<Principal, [Favorite]>(Principal.equal, Principal.hash);
    myFavorites := TrieMap.fromEntries<Principal, [Favorite]>(Iter.fromArray(upgradeFavorites), Principal.equal, Principal.hash);

    var myCanisters = TrieMap.TrieMap<Principal, Canister>(Principal.equal, Principal.hash);
    myCanisters := TrieMap.fromEntries<Principal, Canister>(Iter.fromArray(upgradeCanisters), Principal.equal, Principal.hash);

    system func preupgrade() {
        stableProfiles := Iter.toArray(profiles.entries());
        userProfiles := Iter.toArray(userprofiles.entries());
        upgradeInboxes := Iter.toArray(inboxes.entries());
        userWallets := Iter.toArray(wallets.entries());
        upgradeFavorites := Iter.toArray(myFavorites.entries());
        upgradeCanisters := Iter.toArray(myCanisters.entries());
        stableFeaturedProfiles := Buffer.toArray(featuredProfiles)
    };

    system func postupgrade() {
        stableProfiles := [];
        userProfiles := [];
        upgradeInboxes := [];
        userWallets := [];
        upgradeFavorites := [];
        upgradeCanisters := [];
        featuredProfiles := Buffer.fromArray(stableFeaturedProfiles)
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
                                        owner = caller;
                                        createtime = Time.now()
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
                                owner = p.owner;
                                createtime = p.createtime
                            },
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
                                        owner = p.owner;
                                        createtime = p.createtime
                                    },
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
                                owner = p.owner;
                                createtime = p.createtime
                            },
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
                                owner = p.owner;
                                createtime = p.createtime
                            },
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

    //===================================
    // inbox
    //===================================

    public shared ({ caller }) func addInbox(inboxid : Text) : async Result.Result<Nat, Text> {
        let pid = userprofiles.get(caller);
        switch (pid) {
            case (?pid) {
                let i = inboxes.get(pid);
                switch (i) {
                    case (?i) {
                        if (i.owner == caller) {
                            inboxes.put(
                                pid,
                                {
                                    inboxid = inboxid;
                                    owner = caller
                                },
                            );
                            #ok(1)
                        } else {
                            #err("no permission")
                        }
                    };
                    case (_) {
                        inboxes.put(
                            pid,
                            {
                                inboxid = inboxid;
                                owner = caller
                            },
                        );
                        #ok(1)
                    }
                }
            };
            case (_) {
                #err("no profile found")
            }
        };

    };

    public query func getInbox(name : Text) : async ?Inbox {
        inboxes.get(name)
    };

    public query ({ caller }) func getMyInbox() : async ?Inbox {
        let inboxArr = Iter.toArray(inboxes.vals());
        Array.find<Inbox>(inboxArr, func(i : Inbox) : Bool { i.owner == caller })
    };

    //===================================
    // Canister
    //===================================

    public shared ({ caller }) func editCanister(canister : Canister) : async Result.Result<Nat, Text> {

        myCanisters.put(
            caller,
            canister,
        );
        #ok(1)

    };

    public query ({ caller }) func getMyCanister() : async ?Canister {
        myCanisters.get(caller)
    };

    public query func getProfileCanister(uid : Principal) : async ?Canister {
        myCanisters.get(uid)
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
