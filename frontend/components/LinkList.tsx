import React from 'react';
import { List, ListItem, ListItemText, ListItemIcon, Link as LinkComponent } from '@mui/material';


import { Link } from '../api/profile/service.did';
import LinkIcon from '@mui/icons-material/Link';
interface LinkListProps {
  links: Link[];
}

const LinkList: React.FC<LinkListProps> = ({ links }) => {
  let ll = links.map((l,i)=> <ListItem key={i} component={LinkComponent} href={l.url} target="_blank">
    <ListItemIcon>
      <LinkIcon />
    </ListItemIcon>
    <ListItemText primary={l.name} />
  </ListItem>)
  return (
    <List>
      {ll}
    </List>
  );
};

export default LinkList;
