import React from 'react';
import { TextField, Button, Box } from '@mui/material';
interface MessageComposerProps {
  recipient: string;
  onClose: () => void;
}
const MessageComposer: React.FC<MessageComposerProps> = ({recipient}) => {
  return (
    <Box sx={{p: 2}}>
      <TextField
        fullWidth
        multiline
        rows={4}
        placeholder="Type your message..."
      />
      <Button variant="contained" sx={{mt: 1}}>
        Send Message
      </Button>
    </Box>
  );
}

export default MessageComposer;