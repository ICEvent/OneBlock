import React, { useEffect, useState } from 'react';
import { Profile } from '../../api/profile/service.did';
import { useGlobalContext } from '../Store';
import { useOneblock } from '../Store';

export const PostsPanel = () => {
  const { state: { principal } } = useGlobalContext();
  const [canister, setCanister] = useState<Canister | null>(null);
  const [newPost, setNewPost] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    loadCanister();
  }, []);

  const loadCanister = async () => {
    const [canisterData] = await oneblock.getProfileCanister(principal);
    if (canisterData) {
      setCanister(canisterData);
      loadPosts(canisterData);
    }
  };

  const loadPosts = async (canisterData: Canister) => {
    const docs = await listDocs({
      satellite: { satelliteId: canisterData.canisterid },
      collection: canisterData.posts,
      filter: {
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
  };

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (canister && newPost.trim()) {
      await setDoc({
        satellite: { satelliteId: canister.canisterid },
        collection: canister.posts,
        doc: {
          key: Date.now().toString(),
          data: { post: newPost }
        }
      });
      setNewPost("");
      loadPosts(canister);
    }
  };

  return (
    <div className="panel">
      <h2>Create Post</h2>
      <form onSubmit={createPost}>
        <div className="form-group">
          <label>New Post</label>
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="What's on your mind?"
            rows={4}
          />
        </div>
        <button type="submit">Publish</button>
      </form>

      <div className="posts-list">
        {posts.map((post) => (
          <div key={post.id} className="post-item">
            <p className="post-content">{post.post}</p>
            <time>{post.timestamp}</time>
          </div>
        ))}
      </div>
    </div>
  );
};
