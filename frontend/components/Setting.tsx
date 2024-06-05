import { Box, Button, Container, TextField } from "@mui/material";
import React, { useEffect, useState } from "react";
import { Principal } from "@dfinity/principal";
import { useOneblock, useProfile } from "./Store";
import { toast } from "react-toastify";
import { Inbox,Canister} from "../api/profile/service.did";


interface State {
    inboxid: string;
    satelliteid: string;
    posts: string;
    gallery: string;
}

export default function Setting() {

    const oneblock = useOneblock();
    const [inbox, setInbox] = useState<Inbox | null>();
    const { profile } = useProfile();

    const [values, setValues] = useState<State>({
        inboxid: null,
        satelliteid: null,

        posts: "posts",
        gallery: "gallery"
    });



    useEffect(() => {
        oneblock.getMyInbox().then(res => {
            if (res.length > 0) {
                setInbox(res[0])
            }
        });

        oneblock.getMyCanister().then(res => {
            if(res.length >0){
                setValues({...values, 
                    satelliteid: res[0].canisterid.toString(),
                    posts: res[0].posts,
                    gallery: res[0].gallery
                })
            }
        })
    }, []);

    const handleChange =
        (prop: keyof State) => (event: React.ChangeEvent<HTMLInputElement>) => {
            setValues({ ...values, [prop]: event.target.value });
        };

    function importInbox(){
        oneblock.addInbox(values.inboxid).then(res=>{
            if(res["ok"]){
                setInbox({
                    inboxid: values.inboxid,
                    owner:null
                });
                toast.success("import inbox id successfully!")
            }
        })
    };

    function updateSatellite(){
        try{
            oneblock.editCanister({
                canisterid: Principal.fromText(values.satelliteid),
                name: "Posts",                
                desc: "user storage for post and photo",
                posts: values.posts,
                gallery: values.gallery
            }).then(res=>{
                if(res["ok"]){
                    toast.success("update canister id successfully!")
                }
            })
        }catch(err){
            toast.error("canister id is not valid!")
        }
        
    };
    return (
        <Container>
            {inbox && inbox.inboxid}
            
            {!inbox &&
                <Box>
                    <TextField
                        label="inbox canister id"
                        fullWidth
                        sx={{ m: 1 }}
                        value={values.inboxid}
                        onChange={handleChange('inboxid')}
                    />
                   
                    <Button onClick={importInbox}>Import</Button>
                </Box>
            }

                <Box>

                    <TextField
                        label="Storage satellite id on Juno"
                        fullWidth
                        sx={{ m: 1 }}
                        value={  values.satelliteid}
                        onChange={handleChange('satelliteid')}
                    />  
                    <TextField
                        label="posts collection name in satellite"
                        fullWidth
                        sx={{ m: 1 }}
                        value={  values.posts}
                        onChange={handleChange('posts')}
                    />  
                    <TextField
                        label="Gallery collection name in satellite"
                        fullWidth
                        sx={{ m: 1 }}
                        value={  values.gallery}
                        onChange={handleChange('gallery')}
                    />                                       
                    <Button onClick={updateSatellite}>Update</Button>
                </Box>
            
        </Container>
    );
};