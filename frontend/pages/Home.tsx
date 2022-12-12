import React, { useState } from "react"
import { useEffect } from "react"

import { useBalance, useCanister, useWallet } from "@connect2ic/react"
import CssBaseline from '@mui/material/CssBaseline';
/*
 * Connect2ic provides essential utilities for IC app development
 */

import { ConnectButton, ConnectDialog, Connect2ICProvider, useConnect } from "@connect2ic/react"
import "@connect2ic/core/style.css"


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


import { Profile } from ".dfx/local/canisters/profile/profile.did";

import { ProfileForm } from "../components/ProfileForm";
import { LinkDialog } from "../components/LinkDialog";
import { DefaultHome } from "../components/DefaultHome";


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

  const [wallet] = useWallet()
  const [assets] = useBalance()
  const [profileCanister] = useCanister("profile");
  const [profiles, setProfiles] = useState<[Profile]>();
  const [profile, setProfile] = useState();

  const { isConnected, principal, activeProvider } = useConnect()

  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  useEffect(() => {

    profileCanister.getMyProfile().then(res => {

      if (res[0]) {
        setProfile(res[0])
      }
    });
  }, [profileCanister]);

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

        {isConnected && <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
          <Tab label="profile" {...a11yProps(0)} />
          <Tab label="links" {...a11yProps(1)} />
          <Tab label="wallets" {...a11yProps(2)} />
        </Tabs>
        }
        {isConnected && <Box maxWidth="md">
          <TabPanel value={value} index={0}>
            <ProfileForm profile={profile} />

          </TabPanel>
          <TabPanel value={value} index={1}>
            <LinkDialog profile={profile} />
          </TabPanel>
          <TabPanel value={value} index={2}>
            <Box>Principal: {principal}</Box>
            <Button><ConnectButton /></Button>
          </TabPanel>
        </Box>}
        {!isConnected &&
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
              <Button><ConnectButton dark={false}/></Button>
            </Box>
          </Box>}
      </Container>

      <ConnectDialog />
    </Box>

  )
}

export { Home }
