import React from "react";
import { Box, Container, Grid, Typography, List, ListItem, ListItemText, Divider } from "@mui/material";
import { useOneblock, useProfile } from "./Store";
import { useState, useEffect } from "react";
import { useGlobalContext } from "./Store";
import moment from "moment";

export default function Scores() {
  const oneblock = useOneblock();
  const { state:{profile }} = useGlobalContext();
  const [totalScore, setTotalScore] = useState(0);
  const [loading, setLoading] = useState(true);

  const [totalDistance, setTotalDistance] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [elevationGain, setElevationGain] = useState(0);
  const [completedTrails, setCompletedTrails] = useState(0);
  
  const calculateHikingPoints = () => {
    // Points formula: 
    // Distance: 10 points per km
    // Duration: 5 points per hour
    // Elevation: 1 point per 10m gained
    // Completed trails: 100 points per trail
    const distancePoints = totalDistance * 10;
    const durationPoints = totalDuration * 5;
    const elevationPoints = Math.floor(elevationGain / 10);
    const completedTrailPoints = completedTrails * 100;
    
    return distancePoints + durationPoints + elevationPoints + completedTrailPoints;
  };
  const calculateDaysActive = () => {
    if (!profile?.createtime) return 0;
    const created = moment(Number(profile.createtime)/1000000);
    return moment().diff(created, 'days');
  };

  const scoreItems = [
    {
      title: "Days Active",
      value: calculateDaysActive(),
      points: calculateDaysActive(),
      description: "1 points per day since profile creation"
    },
    {
      title: "Hiking Performance",
      value: `${totalDistance}km • ${totalDuration}h • ${elevationGain}m`,
      points: calculateHikingPoints(),
      description: "Points based on distance, duration, elevation gain and completed trails"
    },
    {
      title: "Defund Donations",
      value: "0 ICP", // Replace with actual donation amount
      points: 0, // Calculate based on donation amount
      description: "100 points per ICP donated"
    }
  ];

  useEffect(() => {
    const total = scoreItems.reduce((acc, item) => acc + item.points, 0);
    setTotalScore(total);
    setLoading(false);
  }, [profile]);


  
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ mb: 4 }}>
          Scores & Achievements
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ 
              p: 3, 
              bgcolor: 'background.paper', 
              borderRadius: 2, 
              boxShadow: 1,
              textAlign: 'center' 
            }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Total Score
              </Typography>
              <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold' }}>
                {totalScore}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Score Breakdown
              </Typography>
              {loading ? (
                <Typography>Loading...</Typography>
              ) : (
                <List>
                  {scoreItems.map((item, index) => (
                    <Box key={item.title}>
                      <ListItem sx={{ py: 2 }}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="subtitle1">{item.title}</Typography>
                              <Typography variant="h6" color="primary">+{item.points}</Typography>
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                {item.description}
                              </Typography>
                              <Typography variant="body2">
                                Current: {item.value}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < scoreItems.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}


