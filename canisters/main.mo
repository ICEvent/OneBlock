import Text "mo:base/Text";
import TrieMap "mo:base/TrieMap";
import Principal "mo:base/Principal";
import Iter "mo:base/Iter";
import Result "mo:base/Result";
import Time "mo:base/Time";
import Buffer "mo:base/Buffer";
import Array "mo:base/Array";

import Types "types";

actor {
    type Profile = Types.Profile;
    

    stable var profileIds: [Text] = [];
    stable var stableProfiles : [(Text,Profile)] = [];
    stable var userProfiles : [(Principal,Text)] = [];

    var profiles = TrieMap.TrieMap<Text, Profile>(Text.equal, Text.hash);
    profiles := TrieMap.fromEntries<Text, Profile>(Iter.fromArray(stableProfiles), Text.equal, Text.hash);


    var userprofiles = TrieMap.TrieMap<Principal, Text>(Principal.equal, Principal.hash);
    userprofiles := TrieMap.fromEntries<Principal, Text>(Iter.fromArray(userProfiles), Principal.equal, Principal.hash);

    system func preupgrade() {
        stableProfiles := Iter.toArray(profiles.entries());  
        userProfiles:= Iter.toArray(userprofiles.entries());  
    };

    system func postupgrade(){
        stableProfiles:=[];
        userProfiles:=[];
    };

    public shared({caller}) func createProfile(newProfile: Types.NewProfile): async Result.Result<Nat,Text>{
        if(Principal.isAnonymous(caller)){
            #err("no authenticated")
        }else{
            let up = userprofiles.get(caller);
            switch(up){
                case(?up){
                    #err("you already have profile ")
                };
                case(_){
                    let p = profiles.get(newProfile.id);
                    switch(p){
                        case(?p){
                            #err("the profile is existed!")
                        };
                        case(_){
                            profiles.put(newProfile.id,{
                                id = newProfile.id;
                                name= newProfile.name;
                                bio = newProfile.bio;
                                pfp= newProfile.pfp;
                                links = [];
                                owner = caller;
                                createtime = Time.now();
                            });
                            userprofiles.put(caller,newProfile.id);
                            #ok(1);
                        };
                    };
                }
            };
        
        };
    };

    public shared({caller}) func updateProfile(id: Text, updateProfile: Types.UpdateProfile): async Result.Result<Nat,Text>{
        if(Principal.isAnonymous(caller)){
            #err("no authenticated")
        }else{
                    
            let p = profiles.get(id);
            switch(p){
                case(?p){
                    if(p.owner == caller){
                        profiles.put(id,{
                            id = p.id;
                            name= updateProfile.name;
                            bio = updateProfile.bio;
                            pfp= updateProfile.pfp;
                            links = p.links;
                            owner = p.owner;
                            createtime = p.createtime;
                        });
                        #ok(1);
                    }else{
                        #err("no permission to update");
                    };
                    
            
                };
                case(_){
                    #err("no profile found")
                };
            };
                    
                
        
        };
    };

    public shared({caller}) func addLink(id: Text, link: Types.Link): async Result.Result<Nat,Text>{
        if(Principal.isAnonymous(caller)){
            #err("no authenticated")
        }else{
                 
            let p = profiles.get(id);
            switch(p){
                case(?p){
                    if(p.owner == caller){

                        let blinks = Buffer.fromArray<Types.Link>(p.links);                       
                        
                        blinks.add(link);

                        profiles.put(id,{
                            id = p.id;
                            name= p.name;
                            bio = p.bio;
                            pfp= p.pfp;
                            links = Buffer.toArray(blinks);
                            owner = p.owner;
                            createtime = p.createtime;
                        });
                        #ok(1);
                    }else{

                     #err("no permission to add link")
                    };
            
                };
                case(_){
                    #err("no profile found")
                };
            };
                    
                
        
        };
    };
   public shared({caller}) func deleteLink(id: Text, name: Text): async Result.Result<Nat,Text>{
        if(Principal.isAnonymous(caller)){
            #err("no authenticated")
        }else{
                 
            let p = profiles.get(id);
            switch(p){
                case(?p){
                    if(p.owner == caller){

                        let blinks = Array.filter<Types.Link>(p.links, func(l: Types.Link):Bool{
                            l.name != name
                        });                  
                        profiles.put(id,{
                            id = p.id;
                            name= p.name;
                            bio = p.bio;
                            pfp= p.pfp;
                            links = blinks;
                            owner = p.owner;
                            createtime = p.createtime;
                        });
                        #ok(1);
                    }else{

                     #err("no permission to add link")
                    };
            
                };
                case(_){
                    #err("no profile found")
                };
            };
                    
                
        
        };
    };

    public query func getProfile(id: Text): async ?Profile{
        profiles.get(id);
    };

    public query({caller}) func getMyProfile(): async ?Profile{
        let pt = userprofiles.get(caller);
        switch(pt){
            case(?pt){
                profiles.get(pt);
            };
            case(_){
                null;
            }
        }
        
    };


    public query func dumpProfiles(): async [(Text,Profile)]{
        Iter.toArray(profiles.entries());  
    };

    public query func dumpUserProfiles(): async [(Principal,Text)]{
        Iter.toArray(userprofiles.entries());  
    };

    public query func listProfiles(): async [Profile]{
        Iter.toArray(profiles.vals());  
    };
    
};
