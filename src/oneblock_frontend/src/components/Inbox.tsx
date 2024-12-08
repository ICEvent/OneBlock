import React from 'react';
import { Box, List, Typography, Button, Fab } from '@mui/material';
import { Send } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { Message, InboxConfig } from '../lib/types';
import MessageItem from './MessageItem';
import MessageComposer from './MessageComposer';

const Inbox: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [config, setConfig] = useState<InboxConfig>();
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState('');

  return (
    <Box sx={{ position: 'relative', minHeight: '300px' }}>
      <Typography variant="h6">Inbox</Typography>
      <List>
        {messages.map(msg => (
          <MessageItem key={msg.id} message={msg} />
        ))}
      </List>

      {isComposerOpen && (
        <MessageComposer
          recipient=""
          onClose={() => setIsComposerOpen(false)}
        />
      )}


      <Fab
        color="primary"
        sx={{ position: 'absolute', bottom: 16, right: 16 }}
        onClick={() => setIsComposerOpen(true)}
      >
        <Send />
      </Fab>
    </Box>
  );
}

export default Inbox;