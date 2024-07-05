import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { TextField, Button, Box, CircularProgress } from '@mui/material';

interface PostFormData {
  title: string;
  content: string;
}

interface PostFormProps {
  onSubmit: (data: PostFormData) => void;
}

const PostForm: React.FC<PostFormProps> = ({ onSubmit }) => {
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<PostFormData>();

  const onFormSubmit = (data: PostFormData) => {
    onSubmit(data);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onFormSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: 400, mx: 'auto', mt: 4 }}>
      <Controller
        name="content"
        control={control}
        defaultValue=""
        rules={{ required: 'Post is required' }}
        render={({ field }) => (
          <TextField
            {...field}
            label="What's new?"
            variant="outlined"
            multiline
            rows={4}
            error={!!errors.content}
            helperText={errors.content ? errors.content.message : ''}
          />
        )}
      />

      <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
        {isSubmitting ? <CircularProgress size={24} /> : 'Post'}
      </Button>
    </Box>
  );
};

export default PostForm;
