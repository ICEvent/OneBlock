import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import moment from 'moment';
import { Profile } from "../api/profile/service.did";

interface NameCardProps {
    profile: Profile;
  }
  
const NameCard: React.FC<NameCardProps> = ({profile}) => {
  return (
    <>
   {profile && <Box p={2} textAlign="center">
      <Avatar alt="User Name" src={ profile.pfp} sx={{ width: 56, height: 56, margin: '0 auto' }} />
      <Typography variant="h6">{profile.name}</Typography>
      <Typography variant="body2">{profile.bio}</Typography>
      
    </Box>}</>
  );
};

export default NameCard;
