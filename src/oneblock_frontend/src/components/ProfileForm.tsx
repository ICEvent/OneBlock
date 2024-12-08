
import React, { useEffect, useState } from "react"
import { Alert } from '@mui/material';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Container,
  Paper,
  Avatar,
  InputAdornment
} from '@mui/material';

import { useOneblock, useGlobalContext } from "./Store";

import {Profile, Result } from "../api/profile/service.did.d"

interface State {
  id: string;
  name: string;
  pfp: string;
  bio: string;

}
interface ProfileFormProps {
  profile?: Profile | null;
}
export const ProfileForm : React.FC<ProfileFormProps>= ({ profile: initialProfile  }) => {

  const oneblock = useOneblock();
  const { state: { principal } } = useGlobalContext();
  const [progress, setProgress] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(initialProfile || null);
  const [values, setValues] = React.useState<State>({
    id: initialProfile?.id || '',
    name: initialProfile?.name || '',
    pfp: initialProfile?.pfp || '',
    bio: initialProfile?.bio || '',
  });

  useEffect(() => {
    if (initialProfile) {
      console.log('initialProfile', initialProfile);
      setProfile(initialProfile);
      setValues({
        id: initialProfile.id,
        name: initialProfile.name,
        pfp: initialProfile.pfp,
        bio: initialProfile.bio,
      });
    }
  }, [initialProfile]);

  const handleChange =
    (prop: keyof State) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues({ ...values, [prop]: event.target.value });
    };

  function createProfile() {
    setMessage(null);
    setProgress(true);
    oneblock.createProfile({
      id: values.id,
      name: values.name,
      pfp: values.pfp,
      bio: values.bio
    }).then((res: Result) => {
      if ('ok' in res) {
        setMessage('Profile created successfully');
      } else {
        setMessage(`Error: ${res.err}`);
      }
      setProgress(false);
    }).catch(error => {
      setMessage(`Error: ${error.message}`);
      setProgress(false);
    });
  }

  function saveProfile() {
    setMessage(null);
    setProgress(true)
    const updateProfile = {
      name: values.name,
      pfp: values.pfp,
      bio: values.bio
    };
    console.log('updateProfile', updateProfile);
    oneblock.updateProfile(values.id, updateProfile ).then((res: Result) => {
      if ('ok' in res) {
        setMessage('Profile updated successfully')
      } else {
        setMessage(res.err)
      }

    })
  };

  return (
    <Container maxWidth="md">
      {message && (
        <Alert
          severity={message.includes('error') ? 'error' : 'success'}
          sx={{ mt: 2 }}
          onClose={() => setMessage(null)}
        >
          {message}
        </Alert>
      )}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box component="form">
          {/* Profile Info Section */}
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>Profile Information</Typography>
            
            <TextField
              label="ID"
              required
              fullWidth
              sx={{ mb: 2 }}
              value={values.id}
              onChange={handleChange('id')}
              disabled={!!profile}
              InputProps={{
                startAdornment: <InputAdornment position="start">@</InputAdornment>,
              }}
            />
            <TextField
              label="Name"
              fullWidth
              sx={{ mb: 2 }}
              value={values.name}
              onChange={handleChange('name')}
            />
            <TextField
              label="Avatar URL"
              fullWidth
              sx={{ mb: 2 }}
              value={values.pfp}
              onChange={handleChange('pfp')}
            />
            <TextField
              label="Bio"
              multiline
              rows={4}
              fullWidth
              value={values.bio}
              onChange={handleChange('bio')}
            />
          </Box>

          {/* Preview Section */}
          {values.pfp && (
            <Box mb={3}>
              <Typography variant="h6" gutterBottom>Avatar Preview</Typography>
              <Avatar
                src={values.pfp}
                alt={values.name}
                sx={{ width: 100, height: 100 }}
              />
            </Box>
          )}

          {/* Action Buttons */}
          <Box display="flex" gap={2}>
            {profile ? (
              <>
              <Button
                variant="contained"
                disabled={progress}
                onClick={saveProfile}
                startIcon={progress ? <CircularProgress size={20} /> : null}
              >
                {progress ? 'Saving...' : 'Save Changes'}
              </Button>
              <Link to={`/${values.id}`} style={{ textDecoration: 'none' }}>
              <Button variant="outlined">
                View Profile
              </Button>
            </Link>
            </>
            ) : (
              <Button
                variant="contained"
                disabled={progress}
                onClick={createProfile}
                startIcon={progress ? <CircularProgress size={20} /> : null}
              >
                {progress ? 'Creating...' : 'Create Profile'}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};
