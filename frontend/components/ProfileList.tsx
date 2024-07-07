import React, { useEffect, useState } from "react";
import { useOneblock } from "./Store";
import { Profile } from "../api/profile/service.did";
import { Box, Grid, Card, CardContent, Typography, Avatar, Button, Container, TextField } from "@mui/material";
import { PAGING_LENGTH } from "../lib/constants";
import { Link } from "react-router-dom";
import moment from 'moment';

const ProfileList = () => {
  const oneblock = useOneblock();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        // const profileCount = Number(await oneblock.getProfileCount());
        // const totalPages = Math.ceil(profileCount / PAGING_LENGTH);
        // setTotalPages(totalPages);

        // const offset = (currentPage - 1) * PAGING_LENGTH;
        const fetchedProfiles = await oneblock.getDefaultProfiles(BigInt(PAGING_LENGTH));
        // const filteredProfiles = fetchedProfiles.filter((profile) =>
        //   profile.name.toLowerCase().includes(searchTerm.toLowerCase())
        // );
        setProfiles(fetchedProfiles);
      } catch (error) {
        console.error("Error fetching profiles:", error);
      }
    };

    fetchProfiles();
  }, [oneblock, currentPage, searchTerm]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);

  };

  const handleSearchChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    const fetchedProfiles = await oneblock.searchProfilesByName(event.target.value);
    setProfiles(fetchedProfiles);

  };

  return (
    <Container maxWidth={false}>
      <Box p={4} border={1} borderColor="grey.300" borderRadius={4}>
        <TextField
          label="Search Profiles"
          variant="outlined"
          value={searchTerm}
          onChange={handleSearchChange}
          fullWidth
          margin="normal"
        />
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
      </Box>
      {/* Pagination controls */}
    </Container>
  );
};

export default ProfileList;
