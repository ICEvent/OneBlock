import React, { useState } from 'react';
import { TextField, Button, Box } from '@mui/material';

interface PostFormData {
  content: string;
}

interface PostFormProps {
  onSubmit: (data: PostFormData) => void;
}

const PostForm: React.FC<PostFormProps> = ({ onSubmit }) => {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (content.trim() === '') {
      setError('Post is required');
      setIsSubmitting(false);
      return;
    }

    onSubmit({ content });
    setContent('');
    setError('');
    setIsSubmitting(false);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: 400, mx: 'auto', mt: 4 }}>
      <TextField
        label="What's new?"
        variant="outlined"
        multiline
        rows={4}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        error={!!error}
        helperText={error}
      />
      <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
        {isSubmitting ? 'Posting...' : 'Post'}
      </Button>
    </Box>
  );
};

export default PostForm;
