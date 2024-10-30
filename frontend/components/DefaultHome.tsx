import React, { useEffect, useState } from "react";
import { useOneblock } from "./Store";
import { Profile } from "../api/profile/service.did";
import { Box, Typography, TextField, Container,    Grid, Card, CardContent,  Avatar    } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import { Link } from "react-router-dom";

const DefaultHome = () => {
  const oneblock = useOneblock();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    const fetchedProfiles = await oneblock.searchProfilesByName(event.target.value);
    setProfiles(fetchedProfiles);
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          height: '40vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 4,
          textAlign: 'center',
          mt: 1,
        }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h2" component="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
            Your Web3 Profile
          </Typography>
          <Typography variant="h5" color="text.secondary">
            Show your data to the world
          </Typography>
        </Box>

        <TextField
          fullWidth
          placeholder="Search for profiles..."
          variant="outlined"
          sx={{ maxWidth: 600 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          onChange={handleSearch}
        />
      </Box>
      <Grid container spacing={2}>
          {profiles.map((profile) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={profile.id}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Link to={`/${profile.id}`}>
                      <Avatar alt={profile.name} src={profile.pfp} />
                    </Link>
                    <Box ml={2}>
                      <Typography variant="h5">{profile.name}</Typography>
                      <Typography variant="h6">@{profile.id}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {profile.bio}
                      </Typography>

                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
    </Container>
  );
};

export default DefaultHome;
