//@ts-nocheck
import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom";

import moment from "moment";
import { initSatellite } from "@junobuild/core";
import { Profile, Link, Canister } from "../api/profile/service.did";
import LinkList from "../components/LinkList";
import NameCard from "../components/NameCard";
import PostList from "../components/PostList";
import { Hikings } from "../components/Hikings";
import { useOneblock } from "../components/Store";
import { Container, Grid, Box, Paper } from '@mui/material';

const ProfilePage = () => {


  const oneblock = useOneblock()
  const [links, setLinks] = useState<Link[]>([])
  const [currentTab, setCurrentTab] = useState(0);

  const [canister, setCanister] = useState<Canister | null>(null)
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true)
    oneblock.getProfile(id).then(res => {
      if (res[0]) {
        console.log("profile:", res[0])
        setLinks(res[0].links);
        setProfile(res[0]);
        oneblock.getProfileCanister(res[0].owner).then(canister => {
          
          if (canister[0]) {
            console.log("canister: ", canister[0])
            initSatellite({
              satelliteId: canister[0].canisterid.toString()
            });
            setCanister(canister[0])

          }
          setLoading(false)
        })
      };
    });

  }, []);


  return (

    <Container>
      <Grid container spacing={3}>
        <Grid item xs={3}>
          <Paper>
            <NameCard profile={profile} />
            <LinkList links={links} />
          </Paper>
        </Grid>
        <Grid item xs={9}>
          <Paper>
            {canister && <PostList canister={canister} />}
            {!canister && !loading && <>
              <h2>Bring your own post storage</h2>
              follow below steps to setup your own storage:
              <li>create a satellite on Juno(https://juno.build)</li>
              <li>create a collection(e.g "posts") under datastore</li>
              <li>copy satellite id, then login https://oneblock.page, go to "Posts", input satelliteid and update posts name "posts" created at previous step, and save it</li>
            </>}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}

export { ProfilePage }
