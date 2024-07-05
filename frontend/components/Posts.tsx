//@ts-nocheck
import { Box, Button, Container, Grid,TextField } from "@mui/material";
import React, { useEffect, useState } from "react";
import { Principal } from "@dfinity/principal";
import { useOneblock, useProfile } from "./Store";
import { toast } from "react-toastify";
import { Inbox,Canister} from "../api/profile/service.did";
import moment from "moment";
import { setDoc,initSatellite } from "@junobuild/core";
import PostForm from "./PostForm";
import PostList from "./PostList";

interface State {
    inboxid: string;
    satelliteid: string;
    posts: string;
    gallery: string;
}
interface PostsProps {
    canister: Canister;
  }
  
export default function Posts() {

    const oneblock = useOneblock();
    const [inbox, setInbox] = useState<Inbox | null>();
    const { profile } = useProfile();
    const [loading, setLoading] = useState(false)

    const [values, setValues] = useState<State>({
        inboxid: null,
        satelliteid: null,

        posts: "posts",
        gallery: "pictures"
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

    useEffect(()=>{
        if(values.satelliteid) initSatellite({satelliteId:  values.satelliteid});
    },[values.satelliteid]);

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
        setLoading(true)
        try{
            
            oneblock.editCanister({
                canisterid: Principal.fromText(values.satelliteid),
                name: "Posts",                
                desc: "user storage for post and photo",
                posts: values.posts,
                gallery: values.gallery
            }).then(res=>{
                setLoading(false)
                if(res["ok"]){
                    toast.success("update satellite id successfully!")
                }
            })
        }catch(err){
            setLoading(false)
            toast.error("satellite id is not valid!")
        }
        
    };

    const savePost = (data: PostFormData) =>{
        setLoading(true)
        setDoc<Post>({
          collection: values.posts,
          doc: {
            key: moment().format("YYYYMMHHhhmmss"),
            data: {
              post: data.content,
              tags: [],
              attachement: ""
          },
            description: "This is a description"
          }
        }).then(r=>{
          setLoading(false)
          toast.success("post has been saved!")
        });
      };

      
    return (

        <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
                {/* Post storage */}
                <Box>
                    Setup your own storage for posts
                    <TextField
                        label="Storage (satellite id on https://juno.build)"
                        fullWidth
                        variant="outlined"
                        autoFocus
                        sx={{ m: 1 }}
                        value={values.satelliteid}
                        onChange={handleChange("satelliteid")}
                    />

                    <TextField
                        label="collection name for post"
                        fullWidth
                        sx={{ m: 1 }}
                        value={values.posts}
                        onChange={handleChange("posts")}
                    />
                    <TextField
                        label="collection name for picture"
                        fullWidth
                        sx={{ m: 1 }}
                        value={values.gallery}
                        onChange={handleChange("gallery")}
                    />
                    <Button disabled={loading} onClick={updateSatellite}>
                        Save
                    </Button>
                </Box>
                
            </Grid>
            <Grid item xs={12} md={8}>
                {/* Post form */}
                {values.satelliteid && <PostForm onSubmit={savePost} />}
                {values.satelliteid && <PostList canister={{ posts: values.posts }} />}
            </Grid>
        </Grid>

    );
};