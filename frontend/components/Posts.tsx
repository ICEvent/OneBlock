//@ts-nocheck
import { Box, Button, Container, Grid, TextField, IconButton, Modal } from "@mui/material";
import CircularProgress from '@mui/material/CircularProgress';
import SettingsIcon from '@mui/icons-material/Settings';
import React, { useEffect, useState } from "react";
import { Principal } from "@dfinity/principal";
import { useOneblock, useProfile } from "./Store";
import { toast } from "react-toastify";
import { Inbox, Canister } from "../api/profile/service.did";
import moment from "moment";
import { setDoc, initSatellite } from "@junobuild/core";
import PostForm from "./PostForm";
import PostList from "./PostList";

const ConfigModal = ({ open, handleClose, values, handleChange, updateSatellite, loading }) => (
    <Modal 
      open={open} 
      onClose={handleClose}
      disableEscapeKeyDown
      hideBackdrop={false}
      slotProps={{
        backdrop: {
          onClick: () => null
        }
      }}
    >
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
        borderRadius: 2
      }}>
        <TextField
          label="Storage (satellite id)"
          fullWidth
          variant="outlined"
          sx={{ mb: 2 }}
          value={values.satelliteid}
          onChange={handleChange("satelliteid")}
        />
        <TextField
          label="Collection name for post"
          fullWidth
          sx={{ mb: 2 }}
          value={values.posts}
          onChange={handleChange("posts")}
        />
        <TextField
          label="Collection name for picture"
          fullWidth
          sx={{ mb: 2 }}
          value={values.gallery}
          onChange={handleChange("gallery")}
        />
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>

          <Button 
            fullWidth 
            variant="contained" 
            disabled={loading} 
            onClick={updateSatellite}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
          <Button 
            fullWidth 
            variant="outlined" 
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
        </Box>
      </Box>
    </Modal>
);
export default function Posts() {
    const [configOpen, setConfigOpen] = useState(false);
    const oneblock = useOneblock();
    const [inbox, setInbox] = useState<Inbox | null>();
    const { profile } = useProfile();
    const [loading, setLoading] = useState(false);

    const [values, setValues] = useState({
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
            if (res.length > 0) {
                setValues({
                    ...values,
                    satelliteid: res[0].canisterid.toString(),
                    posts: res[0].posts,
                    gallery: res[0].gallery
                })
            }
        })
    }, []);

    // useEffect(() => {
    //     if (values.satelliteid) initSatellite({ satelliteId: values.satelliteid });
    // }, [values.satelliteid]);

    const handleChange = (prop: keyof typeof values) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setValues({ ...values, [prop]: event.target.value });
    };

    function importInbox() {
        oneblock.addInbox(values.inboxid).then(res => {
            if (res["ok"]) {
                setInbox({
                    inboxid: values.inboxid,
                    owner: null
                });
                toast.success("import inbox id successfully!")
            }
        })
    };

    function updateSatellite() {
        setLoading(true)
        try {

            oneblock.editCanister({
                canisterid: Principal.fromText(values.satelliteid),
                name: "Posts",
                desc: "user storage for post and photo",
                posts: values.posts,
                gallery: values.gallery
            }).then(res => {
                setLoading(false)
                if (res["ok"]) {
                    toast.success("update satellite id successfully!")
                    setConfigOpen(false);
                }
            })
        } catch (err) {
            setLoading(false)
            toast.error("satellite id is not valid!")
        }

    };

    const savePost = (data: PostFormData) => {
        setLoading(true);
        setDoc<Post>({
            satellite:{ "satelliteId": values.satelliteid},
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
        }).then(r => {
            setLoading(false);
            toast.success("post has been saved!");
        });
    };

    return (
        <Box sx={{ position: 'relative', p: 3 }}>
            <IconButton
                onClick={() => setConfigOpen(true)}
                sx={{ position: 'absolute', top: 16, right: 16 }}
            >
                <SettingsIcon />
            </IconButton>

            <ConfigModal
                open={configOpen}
                handleClose={() => setConfigOpen(false)}
                values={values}
                handleChange={handleChange}
                updateSatellite={updateSatellite}
                loading={loading}
            />

            <Grid container spacing={3}>
                <Grid item xs={12} md={12}>
                    {values.satelliteid && <PostForm onSubmit={savePost} />}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {values.satelliteid && <PostList canister={{ posts: values.posts }} />}
                        {/* Gallery component can be added here */}
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};