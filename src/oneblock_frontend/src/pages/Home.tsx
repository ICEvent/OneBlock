import React, { useEffect, useState } from 'react';

import '../styles/Home.css';
import ProfileLayout from '../layouts/ProfileLayout';
import ProfileSidebar from '../components/ProfileSidebar';
import ProfileMain from '../components/ProfileStats';
import { StatsCollection } from '../types/userStat';
import Navbar from '../components/Navbar';
import { Principal } from '@dfinity/principal';

const Home = () => {
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
    pfp: null,    
    createtime : 1685197200,
  });
  const [stats, setStats] = useState<StatsCollection>({
    Profiles: {
      description: " ",
      data: {
        profiles: 100,
        dataSources: profile.links.length,
      }

    }
  });

  return (
    <>
      <Navbar />
      <div className="main-content">
      <ProfileLayout      
        sidebar={<ProfileSidebar profile={profile} tags={ ["Web3", "Blockchain", "Decentralized", "Internet Computer", "Profile"]} />}
        main={<ProfileMain posts={[]} stats={stats} />} />
        </div>
    </>
  );
};

export default Home;