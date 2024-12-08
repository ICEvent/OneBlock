import React, { useEffect, useState } from 'react';
import { Principal } from '@dfinity/principal';
import { useGlobalContext } from '../Store';
import { useOneblock } from '../Store';
import moment from 'moment';
import { CircularProgress } from '@mui/material';
import { toast } from 'react-toastify';
import { listDocs, setDoc } from '@junobuild/core';
import { Canister, Result } from '../../api/profile/service.did.d';
import { Post } from '../../types/post';
import '../../styles/Post.css'


export const PostsPanel: React.FC = () => {
  const oneblock = useOneblock();
  const { state: { principal } } = useGlobalContext();
  const [canister, setCanister] = useState<Canister | null>(null);
  const [newPost, setNewPost] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [postProgress, setPostProgress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [values, setValues] = useState({
    satelliteid: '',
    posts: '',
    gallery: ''
  });

  useEffect(() => {
    loadCanister();
  }, []);

  const loadCanister = async () => {
    if (!principal) return;  // Early return if null

    const [canisterData] = await oneblock.getProfileCanister(principal);
    if (canisterData) {
      setCanister(canisterData);
      setValues({
        satelliteid: canisterData.canisterid.toText(),
        posts: canisterData.posts,
        gallery: canisterData.gallery
      });
      loadPosts(canisterData);
    }
  };

  const loadPosts = async (canisterData: Canister) => {
    const docs = await listDocs<Post>({
      satellite: { satelliteId: canisterData.canisterid.toText() },
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
        timestamp: item.created_at ? moment.unix(parseInt(item.created_at.toString()) / 1000000000).format("MMMM Do YYYY, h:mm a") : "",
      }));
      setPosts(parsePosts);
    }
  };

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (canister && newPost.trim()) {
      setPostProgress(true);
      setError(null);
      try {
        const res = await setDoc({
          satellite: { satelliteId: canister.canisterid.toText() },
          collection: canister.posts,
          doc: {
            key: Date.now().toString(),
            data: { post: newPost }
          }
        });
        setNewPost("");
        loadPosts(canister);
      } catch (error) {
        setError("Failed to create post: " + (error as Error).message);
      } finally {
        setPostProgress(false);
      }
    }
  };

  const updateSatellite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true)
    try {
      console.log('values', values)
      const res = await oneblock.editCanister({
        canisterid: Principal.fromText(values.satelliteid),
        name: "Posts",
        desc: "user storage for post and photo",
        posts: values.posts,
        gallery: values.gallery
      });

      if ('ok' in res) {
        console.log('Satellite updated successfully:', res.ok);
        toast.success("update satellite id successfully!")
        setConfigOpen(false);
        loadCanister();
      } else {
        console.log('Failed to update satellite:', res.err);
        toast.error("error when update satellite id!")
      }
      setLoading(false)

    } catch (err) {
      setLoading(false)
      toast.error("satellite id is not valid!")
    }
  };


  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Posts</h2>
        {canister && <button
          className="settings-btn"
          onClick={() => setConfigOpen(true)}
        >
          <span className="material-icons">settings</span>
        </button>}
      </div>

      {/* Settings Modal */}
      {configOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Canister Settings</h3>
            <form onSubmit={updateSatellite}>
              <div className="form-group">
                <label>Satellite ID</label>
                <input
                  type="text"
                  value={values.satelliteid}
                  onChange={(e) => setValues({ ...values, satelliteid: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Posts Collection</label>
                <input
                  type="text"
                  value={values.posts}
                  onChange={(e) => setValues({ ...values, posts: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Photo Collection</label>
                <input
                  type="text"
                  value={values.gallery}
                  onChange={(e) => setValues({ ...values, gallery: e.target.value })}
                />
              </div>
              <div className="notice-box" style={{
                background: '#f8f9fa',
                padding: '15px',
                borderRadius: '4px',
                marginBottom: '20px'
              }}>
                <p><strong>Important:</strong> To enable post creation, please:</p>
                <ol style={{ marginLeft: '20px' }}>
                  <li>Copy your principal ID: <code>{principal?.toText()}</code></li>
                  <li>Go to <a href="https://console.juno.build" target="_blank" rel="noopener noreferrer">Juno Console</a></li>
                  <li>Add this principal as a controller to your collection</li>
                </ol>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setConfigOpen(false)}>Cancel</button>
                <button disabled={loading} type="submit">
                  {loading ? <CircularProgress size={20} /> : 'Save'}
                </button>
              </div>


            </form>

          </div>
        </div>
      )}

      {!canister ? (
        <div className="notice-box">
          <span className="material-icons">info</span>
          <p>Please configure your canister settings first</p>
          <button onClick={() => setConfigOpen(true)}>Configure Now</button>
        </div>
      ) : (
        <>
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
            <button type="submit" disabled={postProgress} style={{
              width: 'auto',
              minWidth: '100px',
              alignSelf: 'flex-start'
            }}>
              {postProgress ? <CircularProgress size={20} /> : 'Publish'}
            </button>
            {error && (
              <div className="error-message" style={{ color: 'red', marginTop: '10px' }}>
                {error}
              </div>
            )}
          </form>
          <div className="posts-list">
            {posts.map((post, index) => (
              <div key={index} className="post-item">
                <p className="post-content">{post.post}</p>
                <time>{post.timestamp}</time>
              </div>
            ))}
          </div>
        </>
      )};
    </div>
  );
};



