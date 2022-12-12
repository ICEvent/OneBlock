import React, { useEffect, useState } from "react"
import { useBalance, useCanister, useWallet, useConnect } from "@connect2ic/react"
import { useParams } from "react-router-dom";

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Input from '@mui/material/Input';
import FilledInput from '@mui/material/FilledInput';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import Button from "@mui/material/Button";

import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';

import { LinkList } from "../components/LinkList";

interface State {
  id: string;
  name: string;
  pfp: string;
  bio: string;
  linkname: String;
  linkurl: String;
}


const Profile = () => {

  const [profile] = useCanister("profile");

  const [links, setLinks] = useState([])

  const [values, setValues] = React.useState<State>({
    id: '',
    name: '',
    pfp: '',
    bio: '',
    linkname: '',
    linkurl: ''
  });
  let params = useParams();

  useEffect(() => {

    profile.getProfile(params.id).then(res => {
      if (res[0]) {
        setLinks(res[0].links);
        setValues({
          ...values,
          id: res[0].id,
          name: res[0].name,
          pfp: res[0].pfp,
          bio: res[0].bio,
        });

      };

    });
  }, [profile]);




  return (

    <Grid
      container
      spacing={1}
      alignItems="center"
      justifyContent="center"

    >

      <Grid item>
        <Box minWidth={600}
        m={10}

        >
        <Card >
          <CardMedia
            component="img"
            height="140"
            image={values.pfp}
            alt=""
          />
          <CardContent>
            <Typography gutterBottom variant="h5" component="div">
              @{values.id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
             {values.bio}
            </Typography>
          </CardContent>

        </Card>
        </Box>
        <LinkList links={links} />
      </Grid>

    </Grid>

  )
}

export { Profile }
