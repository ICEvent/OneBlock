import { Box, Button, Container, TextField } from "@mui/material";
import React, { useEffect, useState } from "react";

import { useOneblock, useProfile } from "./Store";

import { Inbox } from "../api/profile/profile.did";

interface State {
    inboxid: string;
}

export default function Inbox() {

    const oneblock = useOneblock();
    const [inbox, setInbox] = useState<Inbox | null>();
    const { profile } = useProfile();

    const [values, setValues] = useState<State>({
        inboxid: null
    });



    useEffect(() => {
        oneblock.getMyInbox().then(res => {
            if (res.length > 0) {
                setInbox(res[0])
            }
        })
    }, [profile]);

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
                })
            }
        })
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
                    /><Button onClick={importInbox}>Import</Button>
                </Box>
            }
        </Container>
    );
};