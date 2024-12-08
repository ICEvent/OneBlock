import React from 'react';
import { Dialog, DialogTitle, DialogContent, FormControl, Switch, TextField } from '@mui/material';

const InboxConfig: React.FC<{open: boolean, onClose: () => void}> = ({open, onClose}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Inbox Settings</DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{mb: 2}}>
          <TextField 
            label="Storage Limit (MB)"
            type="number"
          />
        </FormControl>
        <FormControl fullWidth>
          <Switch 
            checked={false}
            onChange={() => {}}
          /> Auto-delete old messages
        </FormControl>
      </DialogContent>
    </Dialog>
  );
}
