import React, { useEffect, useState } from "react"

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import ImageIcon from '@mui/icons-material/Image';
import WorkIcon from '@mui/icons-material/Work';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';

import moment from "moment";

import { useGlobalContext, useRam } from "./Store";

const Comments = (props) => {

  const { state: {
    isAuthed,
    principal
  } } = useGlobalContext();

  const ram = useRam();

  const [comments, setComments] = useState([]);

  useEffect(() => {
    if (principal) {
      ram.getComments({ "user": principal.toText() }, BigInt(1)).then(cs => {
        console.log("load user comments:", cs);
        setComments(cs)

      });
    }

  }, [principal]);





  const commentList = comments.map((link, index) =>
    <ListItem>

      <ListItemText primary={link.comment} secondary={moment.unix(parseInt(link.timestamp) / 1000000000).format("MMMM Do YYYY, h:mm")} />
    </ListItem>


  )



  return (

    <Box >
      <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
        {commentList}
      </List>
    </Box>

  )
}

export { Comments }
