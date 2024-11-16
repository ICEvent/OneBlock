//@ts-nocheck
import React, { useEffect, useState } from 'react';
import moment from 'moment';
import { listDocs } from "@junobuild/core";
import { Post } from '../lib/types';
import { Canister } from '../api/profile/service.did';
import { useGlobalContext } from './Store';

interface PostsProps {
  canister: Canister;
}

const PostList: React.FC<PostsProps> = ({ canister }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const { state: { isAuthed, principal } } = useGlobalContext();

  useEffect(() => {
    loadPosts();
  }, [canister]);

  const loadPosts = async () => {
    setLoading(true);
    if (canister) {
      const docs = await listDocs({
        satellite: { satelliteId: canister.canisterid },
        collection: canister.posts,
        filter: {
          matcher: {            
            updatedAt: {
              matcher: "between",
              timestamps: {
                start: BigInt((new Date().getTime() - 30* 24 * 60 * 60 * 1000) * 1000000),
                end: BigInt(new Date().getTime() *1000000)
              }
            }
          },
          order: {
            desc: true,
            field: "created_at",
          },
        },
      });

      if (docs.items_length > 0) {
        const parsePosts = docs.items.map(item => ({
          id: item.key,
          post: item.data.post,
          timestamp: moment.unix(parseInt(item.created_at.toString()) / 1000000000).format("MMMM Do YYYY, h:mm a")
        }));
        setPosts(parsePosts);
      }
    }
    setLoading(false);
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px'
    }}>
      {posts.length > 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {posts.map((post) => (
            <article key={post.id} style={{
              padding: '24px',
              borderRadius: '12px',
              backgroundColor: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              transition: 'transform 0.2s ease',
              cursor: 'pointer'
            }}>
              <time style={{
                display: 'block',
                fontSize: '14px',
                color: '#666',
                marginBottom: '12px'
              }}>
                {post.timestamp}
              </time>
              <p style={{
                fontSize: '16px',
                lineHeight: '1.6',
                margin: 0,
                color: '#333'
              }}>
                {post.post}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          color: '#666',
          padding: '40px'
        }}>
          {canister && !loading && "No posts available."}
        </div>
      )}
    </div>
  );
};

export default PostList;
