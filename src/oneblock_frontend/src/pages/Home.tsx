import React, { useEffect, useState } from 'react';

import '../styles/Home.css';
import ProfileLayout from '../layouts/ProfileLayout';
import ProfileSidebar from '../components/ProfileSidebar';
import ProfileMain from '../components/ProfileStats';
import { StatsCollection } from '../types/userStat';
import Navbar from '../components/Navbar';
import {  useOneblock } from '../components/Store';
import { Post } from "../types/post"
import { getDoc, listDocs } from "@junobuild/core"
import moment from 'moment';

const Home = () => {
  const oneblock = useOneblock();
  const [count, setCount] = useState(0);
  const [posts, setPosts] = useState<Post[]>([])
  const [profile, setProfile] = useState({
    id: "",
    name: '',
    bio: 'OneBlock is a decentralized profile platform that aggregates and displays user achievements across multiple IC ecosystem projects',
    links: [
      { name: 'ICEvent', url: 'https://icevent.app' },
      { name: 'BlockList', url: 'https://vansday.net' },
      { name: 'Defund', url: 'https://gncpj-jyaaa-aaaan-qagta-cai.ic0.app' },
      { name: 'AllTracks', url: 'https://alltracks.icevent.app' },
      { name: 'IC Dashboard', url: 'https://dashboard.internetcomputer.org/' },

    ],
    owner: null,    
    pfp: "https://ruc7a-fiaaa-aaaal-ab4ha-cai.icp0.io/photos/yitrh-h2eal-kecr4-qojuq-vrrdv-wva4i-sgroh-qjkuo-57s4x-2555z-mae-_ced1d1f6-fcf1-4148-9a12-fd611327d021.jpg",    
    createtime : 1685197200,
  });
  const [stats, setStats] = useState<StatsCollection>({
    Profiles: {
      description: " ",
      data: {
        profiles: 0,
        dataSources: profile.links.length,
      }

    }
  });

  useEffect(() => {
    const fetchProfileCount = async () => {
      const cnt = await oneblock.getProfileCount();
      console.log('Profile count:', cnt);
      setCount(Number(cnt));
    };
    fetchProfileCount();
  },[])

  useEffect(() => {
    setStats({
      Profiles: {
        description: " ",
        data: {
          Created: count,
          Sources: profile.links.length,
        }
  
      }
    });
  }, [count]);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {

    const docs = await listDocs<Post>({
      satellite: { satelliteId: "ruc7a-fiaaa-aaaal-ab4ha-cai" },
      collection: "oneblock",
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
  return (
    <>
      <Navbar />
      <div className="main-content">
      <ProfileLayout      
        sidebar={<ProfileSidebar profile={profile} tags={ ["Web3", "Blockchain", "Profile", "Decentralized", "Internet Computer"]} />}
        main={<ProfileMain posts={posts} stats={stats} />} />
        </div>
    </>
  );
};

export default Home;