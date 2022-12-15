import React, { useState } from "react"
import { useEffect } from "react"
import { AuthClient } from "@dfinity/auth-client";
import { HttpAgent } from "@dfinity/agent";
import { HOST } from "../lib/canisters";

import CssBaseline from '@mui/material/CssBaseline';


import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Container from '@mui/material/Container';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';



import { ProfileForm } from "../components/ProfileForm";
import { LinkDialog } from "../components/LinkDialog";
import { DefaultHome } from "../components/DefaultHome";
import { Identity } from "@dfinity/agent";

import { useOneblock, useSetAgent, useGlobalContext } from "../components/Store";
import { Profile } from "frontend/api/profile/profile.did";


interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}
const Home = (props) => {

  const oneblock = useOneblock();
  const setAgent = useSetAgent();
  const { state: { isAuthed } } = useGlobalContext();
  
  const [profile, setProfile] = useState<Profile>();



  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  useEffect(() => {

    oneblock.getMyProfile().then(res => {

      if (res[0]) {
        setProfile(res[0])
      }
    });
  }, [oneblock]);

  async function login() {
    const authClient = await AuthClient.create(
      {idleOptions: {
        disableIdle: true,
        disableDefaultIdleCallback: true
      }}
    );
   
    authClient.login({
      identityProvider: "https://identity.ic0.app",
      onSuccess: () => {
        const identity = authClient.getIdentity();
        
          setAgent({
            agent: new HttpAgent({
              identity,
              host: HOST,
            }),
            isAuthed: true,

          });
        
      },
    });
  };

  return (

    <Box sx={{ flexGrow: 1 }}>

      <AppBar position="static">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
          >

          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            ONEBLOCK
          </Typography>

        </Toolbar>
      </AppBar>

      <Container
        sx={{ textAlign: "center" }}
        maxWidth="md"
      >

        {isAuthed && <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
          <Tab label="profile" {...a11yProps(0)} />
          <Tab label="links" {...a11yProps(1)} />
          <Tab label="wallets" {...a11yProps(2)} />
        </Tabs>
        }
        {isAuthed && <Box maxWidth="md">
          <TabPanel value={value} index={0}>
            <ProfileForm profile={profile} />

          </TabPanel>
          <TabPanel value={value} index={1}>
            <LinkDialog profile={profile} />
          </TabPanel>
          <TabPanel value={value} index={2}>

          </TabPanel>
        </Box>}
        {!isAuthed &&
          <Box 
          m={5}
          sx={{
            maxWidth: '100%'
          }}

          >
            <Box>
              <DefaultHome />
            </Box>
            <Box mt={10} >
             
             {!isAuthed &&<Button  variant="contained" onClick={login}>Login</Button>}
            </Box>
          </Box>}
      </Container>

    </Box>

  )
}

export { Home }
