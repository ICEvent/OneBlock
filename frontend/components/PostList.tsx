//@ts-nocheck
import React, { useEffect, useState } from 'react';

import moment from 'moment';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { Post } from '../lib/types';
import { Canister } from '../api/profile/service.did';

import { listDocs } from "@junobuild/core";

import { useGlobalContext } from './Store';


interface PostsProps {
  canister: Canister;
}


const PostList: React.FC<PostsProps> = ({ canister }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false)
  const { state: { isAuthed, principal } } = useGlobalContext();

  useEffect(() => {
    loadPosts();
  }, [canister]);

  const loadPosts = async () => {
    setLoading(true)
    if (canister) {
      console.log(canister.posts);

      const docs = await listDocs({
        collection: canister.posts,
        filter: {
          order: {
            desc: true,
            field: "created_at",
          },
        },
      });

      if (docs.items_length > 0) {
        let parsePosts: Post[] = [];

        docs.items.map(item => {

          if (item.created_at && item.data && typeof item.data == "object") {

            const createat = parseInt(item.created_at.toString());
            console.log("createat: ", createat);

            parsePosts.push({
              id: item.key,
              post: item.data.post,
              timestamp: moment.unix(createat / 1000000000).format("MMMM Do YYYY, h:mm a")
            })

          }
        }
        );
        setPosts(parsePosts);
      }

    }
    setLoading(false)

};


return (
  <Box p={2}>
    
    {posts.length>0 ? posts.map((post) => (
      <Card key={post.id} variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="body2" color="textSecondary">{post.timestamp}</Typography>
          <Typography variant="body2">{post.post}</Typography>
        </CardContent>
      </Card>
    )) :
      <Typography variant="body1" color="textSecondary" align="center">
        {canister && !loading && "No posts available."}
        
      </Typography>}
  </Box>
);
};

export default PostList;
