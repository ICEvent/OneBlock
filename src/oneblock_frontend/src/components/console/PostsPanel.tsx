import React, { useEffect, useState } from 'react';
import { CircularProgress } from '@mui/material';
import { toast } from 'react-toastify';
import { useOneblock } from '../Store';

export const PostsPanel: React.FC = () => {
  const oneblock = useOneblock();
  const [post, setPost] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadLatestPost = async () => {
    setLoading(true);
    try {
      const [profile] = await oneblock.getMyProfile();
      if (!profile) {
        setPost('');
        return;
      }

      const [canister] = await oneblock.getProfileCanister(profile.owner);
      setPost(canister?.posts ?? '');
    } catch (error) {
      console.error('Error loading latest post:', error);
      toast.error('Failed to load latest post');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLatestPost();
  }, []);

  const saveLatestPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post.trim()) {
      toast.error('Post cannot be empty');
      return;
    }

    setSaving(true);
    try {
      const result = await oneblock.updateLatestPost(post.trim());
      if ('ok' in result) {
        toast.success('Latest post updated');
      } else {
        toast.error(`Failed to update post: ${result.err}`);
      }
    } catch (error) {
      console.error('Error updating latest post:', error);
      toast.error('Failed to update latest post');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Latest Post</h2>
        <p className="panel-subtitle">Share your latest info on your public profile</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <CircularProgress />
        </div>
      ) : (
        <form onSubmit={saveLatestPost}>
          <div className="form-group">
            <label>Post Content</label>
            <textarea
              value={post}
              onChange={(e) => setPost(e.target.value)}
              placeholder="Share your latest update..."
              rows={5}
              maxLength={500}
            />
            <small>{post.length}/500</small>
          </div>

          <button type="submit" disabled={saving || !post.trim()}>
            {saving ? <CircularProgress size={20} /> : 'Save Latest Post'}
          </button>
        </form>
      )}
    </div>
  );
};
