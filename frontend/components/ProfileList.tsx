import React, { useEffect, useState } from "react";
import { useOneblock } from "./Store";
import { Profile } from "../api/profile/service.did";
import { Box, Grid, Card, CardContent, Typography, Avatar, Button, Container } from "@mui/material";
import { PAGING_LENGTH } from "../lib/constants";
import { Link } from "react-router-dom";

const ProfileList = () => {
  const oneblock = useOneblock();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const profileCount = Number(await oneblock.getProfileCount());
        const totalPages = Math.ceil(profileCount / PAGING_LENGTH);
        setTotalPages(totalPages);

        const offset = (currentPage - 1) * PAGING_LENGTH;
        const fetchedProfiles = await oneblock.getDefaultProfiles(BigInt(PAGING_LENGTH));
        setProfiles(fetchedProfiles);
      } catch (error) {
        console.error("Error fetching profiles:", error);
      }
    };

    fetchProfiles();
  }, [oneblock, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <Container maxWidth={false}>
      <Box p={4} border={1} borderColor="grey.300" borderRadius={4}>
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
      {/* <Box mt={2} display="flex" justifyContent="center">
        <Button
          variant="contained"
          color="primary"
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
        >
          Previous
        </Button>
        <Box mx={2}>
          Page {currentPage} of {totalPages}
        </Box>
        <Button
          variant="contained"
          color="primary"
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
        >
          Next
        </Button>
      </Box> */}
    </Container>
  );
};

export default ProfileList;
