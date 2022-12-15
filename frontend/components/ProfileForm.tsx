import React, { useEffect, useState } from "react"


import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
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

import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import Container from '@mui/material/Container';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import { useOneblock } from "./Store";

interface State {
  id: string;
  name: string;
  pfp: string;
  bio: string;

}


const ProfileForm = (props) => {


  const oneblock = useOneblock();

  const [isexist, setIsexist] = useState(false)
  const [links, setLinks] = useState([])
  const [progress, setProgress] = useState(false);

  const [open, setOpen] = React.useState(false);

  const [values, setValues] = React.useState<State>({
    id: '',
    name: '',
    pfp: '',
    bio: '',
  });

  const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  }));

  useEffect(() => {

    if (props.profile) {

      setValues({
        ...values,
        id: props.profile.id,
        name: props.profile.name,
        pfp: props.profile.pfp,
        bio: props.profile.bio,
      });
    }

  }, [props.profile]);


  const linklist = links.map(link =>
    <Item>{link.name} - {link.url}</Item>
  )
  const handleChange =
    (prop: keyof State) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues({ ...values, [prop]: event.target.value });
    };



  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  function createProfile() {
    setProgress(true)
    oneblock.createProfile({
      id: values.id,
      name: values.name,
      pfp: values.pfp,
      bio: values.bio
    }).then(res => {
      console.log(res)
      setProgress(false)
    })
  };

  function saveProfile() {
    setProgress(true)
    oneblock.updateProfile(values.id, {
      name: values.name,
      pfp: values.pfp,
      bio: values.bio
    }).then(res => {
      console.log(res)
      setProgress(false)
      setIsexist(true)
    })
  };


  return (

    <Container>
      {values.pfp && 
      <Card variant="outlined" >
        
        <CardMedia
          component="img"
          height="140"
          image={values.pfp}
          alt="hello"
        />
      </Card>}


      <Box component="form">
      <TextField
        label="id"
        required
        fullWidth
        sx={{ m: 1 }}
        value={values.id}
        onChange={handleChange('id')}
        disabled={props.profile}
        InputProps={{
          startAdornment: <InputAdornment position="start">@</InputAdornment>,
        }}
      />
      <TextField
        label="name"
        fullWidth
        sx={{ m: 1 }}
        value={values.name}
        onChange={handleChange('name')}
      />
      <TextField
        label="pfp"
        fullWidth
        sx={{ m: 1 }}
        value={values.pfp}
        onChange={handleChange('pfp')}
      />
      <TextField
        label="bio"
        multiline
        maxRows={5}
        fullWidth
        sx={{ m: 1 }}
        value={values.bio}
        onChange={handleChange('bio')}
      />

      {props.profile && <Button variant="contained" disabled={progress} onClick={saveProfile}>{progress ? <CircularProgress /> : "Save"} </Button>}
      {!props.profile && <Button variant="contained" disabled={progress} onClick={createProfile}>{progress ? <CircularProgress /> : "Create"} </Button>}
      {props.profile && <Link p={2} href={"/" + props.profile.id} target={"_blank"}>Open</Link>}
      </Box>
    </Container>

  )
}

export { ProfileForm }
