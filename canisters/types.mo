
module {
    public type Profile = {
        id : Text;
        name : Text;
        bio : Text;
        pfp : Text;
        links : [Link];
        owner : Principal;
        createtime : Int
    };

    public type NewProfile = {
        id : Text;
        name : Text;
        bio : Text;
        pfp : Text
    };
    public type UpdateProfile = {
        name : Text;
        bio : Text;
        pfp : Text
    };
    public type Link = {
        name : Text;
        url : Text
    };

    public type Wallet = {
        name : Text;
        addresses : [{
            address : Text;
            network : Network
        }]
    };

    public type Network = {
        #ic;
        #ethereum;
        #bitcoin
    };

    public type Favorite = {
        owner: Principal;
        name: Text;
        address: Text;
    };

    public type Inbox = {
        inboxid: Text;
        owner: Principal;
    };

    //satellite on Juno to store posts
    public type Canister = {
        canisterid: Principal;
        name: Text;
        desc: Text;
        posts: Text;
        gallery: Text;
    }
}
