module {
    public type Profile = {
        id: Text;
        name: Text;
        bio: Text;
        pfp: Text;
        links: [Link];
        owner: Principal;
        createtime: Int;
    };

    public type NewProfile = {
        id: Text;
        name: Text;
        bio: Text;
        pfp: Text;
    };
    public type UpdateProfile = {
        name: Text;
        bio: Text;
        pfp: Text;
    };
    public type Link = {
        name: Text;
        url: Text;
    };

}