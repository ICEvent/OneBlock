import React from 'react';
import { ListItem, ListItemText, ListItemIcon, IconButton, Typography } from '@mui/material';
import { Email, Delete, MarkEmailRead } from '@mui/icons-material';
import moment from 'moment';
import { Message } from '../lib/types';
interface MessageItemProps {
  message: Message;
  onDelete?: (id: string) => void;
  onMarkRead?: (id: string) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, onDelete, onMarkRead }) => {
  const formattedDate = moment(Number(message.timestamp)/1000000).format('MMM DD, YYYY HH:mm');
  
  return (
    <ListItem
      secondaryAction={
        <>
          <IconButton edge="end" onClick={() => onMarkRead?.(message.id)}>
            <MarkEmailRead color={message.read ? "disabled" : "primary"} />
          </IconButton>
          <IconButton edge="end" onClick={() => onDelete?.(message.id)}>
            <Delete />
          </IconButton>
        </>
      }
    >
      <ListItemIcon>
        <Email color={message.read ? "disabled" : "primary"} />
      </ListItemIcon>
      <ListItemText 
        primary={message.content}
        secondary={
          <Typography variant="caption" color="text.secondary">
            From: {message.sender.toString()} • {formattedDate}
          </Typography>
        }
      />
    </ListItem>
  );
};

export default MessageItem;
