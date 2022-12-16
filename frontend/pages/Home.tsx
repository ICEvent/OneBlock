import React, { useState } from "react"
import { useEffect } from "react"
import { AuthClient } from "@dfinity/auth-client";
import { HttpAgent,Identity } from "@dfinity/agent";
import { HOST } from "../lib/canisters";
import { ONE_WEEK_NS,IDENTITY_PROVIDER } from "../lib/constants";

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Container from '@mui/material/Container';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';



import { ProfileForm } from "../components/ProfileForm";
import { LinkDialog } from "../components/LinkDialog";
import { DefaultHome } from "../components/DefaultHome";
import Tooltip from '@mui/material/Tooltip';

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
  const { state: { isAuthed, principal } } = useGlobalContext();
  
  const [profile, setProfile] = useState<Profile>();
  const [authClient, setAuthClient] = useState<AuthClient>(null);

  const [value, setValue] = useState(0);
  const [message, setMessage] = useState();
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  useEffect(() => {

    (async () => {
      const authClient = await AuthClient.create(
        {idleOptions: {
          disableIdle: true,
          disableDefaultIdleCallback: true
        }}
      );
      setAuthClient(authClient);

     
      if (await authClient.isAuthenticated()) {
        handleAuthenticated(authClient);
        loadProfile();
      }

    })();

  }, [isAuthed]);

  const handleAuthenticated = async (authClient: AuthClient) => {

    const identity: Identity = authClient.getIdentity();
    setAgent({
      agent: new HttpAgent({
        identity,
        host: HOST,
      }),
      isAuthed: true,

    });

  };

  const login = async () => {
    authClient.login({
      identityProvider: IDENTITY_PROVIDER,
      maxTimeToLive: ONE_WEEK_NS,
      onSuccess: () => handleAuthenticated(authClient),
    });
  };

  const logout = async () => {
    await authClient.logout();
    setAgent({ agent: null });
  };

  async function loadProfile(){
    if(principal){
      oneblock.getMyProfile().then(res => {
        if (res[0]) {
          setProfile(res[0])
        }
      });
    }
  }
  
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
          {!isAuthed &&<Button  color="inherit" onClick={login}>Login</Button>}
          {principal && <Tooltip title={principal.toString()}><Button  color="inherit" onClick={logout}>{principal.toString().slice(0,5)+"..."+principal.toString().slice(-5)}</Button></Tooltip>}

        </Toolbar>
      </AppBar>

      <Container
        sx={{ textAlign: "center" }}
        maxWidth="md"
      >

        {isAuthed && <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
          <Tab label="profile" {...a11yProps(0)} />
          {profile && <Tab label="links" {...a11yProps(1)} />}
          {profile && <Tab label="wallets" {...a11yProps(2)} />}
        </Tabs>
        }
        {isAuthed && <Box maxWidth="md">
          <TabPanel value={value} index={0}>
            <ProfileForm profile={profile}  reload={loadProfile}/>

          </TabPanel>
          <TabPanel value={value} index={1}>
            <LinkDialog profile={profile} />
          </TabPanel>
          <TabPanel value={value} index={2}>
            building...
          </TabPanel>
        </Box>}
        {!isAuthed &&
          <Box m={10}><DefaultHome /></Box> 
          }
      </Container>

    </Box>

  )
}

export { Home }
