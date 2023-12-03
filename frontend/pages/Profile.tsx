import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom";

import moment from "moment";

import { Box } from '@mui/material';
import Container from '@mui/material/Container';


import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';

import { LinkList } from "../components/LinkList";
import { Hikings } from "../components/Hikings";
import { useOneblock } from "../components/Store";

interface State {
  id: string;
  name: string;
  pfp: string;
  bio: string;
  createtime: string;
  principal: string;
}


const Profile = () => {


  const oneblock = useOneblock()
  const [links, setLinks] = useState([])
  const [currentTab, setCurrentTab] = useState(0)

  const [values, setValues] = React.useState<State>({
    id: '',
    name: '',
    pfp: '',
    bio: '',
    createtime: '',
    principal:''
  });
  let params = useParams();

  useEffect(() => {

    oneblock.getProfile(params.id).then(res => {
      if (res[0]) {
        console.log("profile:",res[0])
        setLinks(res[0].links);
        setValues({
          ...values,
          id: res[0].id,
          name: res[0].name,
          pfp: res[0].pfp,
          bio: res[0].bio,
          createtime: (moment.unix(Number(res[0].createtime) / 1000000000)).format("MMM Do YYYY, h:mm a"),
          principal: res[0].owner.toText()
        });

      };

    });
  }, []);


  interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
  }

  function CustomTabPanel(props: TabPanelProps) {
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


  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };
  return (

    <Container maxWidth="md">
      <Box
        m={10}

      >
        <Card >
          {values.pfp && <CardMedia
            component="img"
            height="140"
            image={values.pfp}
            alt=""
          />}
          <CardContent>

            <Typography gutterBottom variant="h4" component="div">
              {values.name}
            </Typography>
            <Typography sx={{ mb: 1.5 }} color="text.secondary">
              since {values.createtime}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {values.bio}
            </Typography>
          </CardContent>

        </Card>
      </Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={currentTab} onChange={handleChange} aria-label="basic tabs example">
          <Tab label="Links" {...a11yProps(0)} />
          <Tab label="Hikings" {...a11yProps(1)} />
        </Tabs>
      </Box>
      <CustomTabPanel value={currentTab} index={0}>
      <LinkList links={links} />
      </CustomTabPanel>
      <CustomTabPanel value={currentTab} index={1}>
        <Hikings id={values.principal}/>
      </CustomTabPanel>
      <CustomTabPanel value={currentTab} index={2}>
        
      </CustomTabPanel>
      

    </Container>
  )
}

export { Profile }
