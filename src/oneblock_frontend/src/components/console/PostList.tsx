import React from 'react';
import { Post } from '../../types/post';
import '../../styles/Post.css'

interface PostListProps {
  posts: Post[];
}

export const PostList: React.FC<PostListProps> = ({ posts }) => {
  if (!posts || posts.length === 0) {
    return (
      <div className="posts-empty">
        <p>No posts yet</p>
        <span>Start sharing your thoughts!</span>
      </div>
    );
  }

  return (
    <div className="posts-list">
      {posts.map((post, index) => (
        <div key={index} className="post-item">
          <p className="post-content">{post.post}</p>
          <time>{post.timestamp}</time>
        </div>
      ))}
    </div>
  );
};
