import React, { useEffect, useState } from "react";
import { Profile, Link, Canister } from "../api/profile/service.did.d";
import { useNavigate } from 'react-router-dom';

import { setDoc } from "@junobuild/core";
import '../styles/Console.css';
import { ProfilePanel } from "../components/console/ProfilePanel";
import { LinksPanel } from "../components/console/LinksPanel";
import { PostsPanel } from "../components/console/PostsPanel";

import { ProfileForm } from "../components/ProfileForm";

import Navbar from "../components/Navbar";
import { useOneblock, useGlobalContext } from "../components/Store";


const Console = () => {
  const oneblock = useOneblock();
  const [activePanel, setActivePanel] = useState('profile');
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const { state: { isAuthed } } = useGlobalContext();

  useEffect(() => {
    if (isAuthed) {
      loadProfile();
    }else{
      navigate('/');
    }
  }, [isAuthed])

  const loadProfile = async () => {
    const [profileData] = await oneblock.getMyProfile();
    if (profileData) {
      setProfile(profileData);
    }
  }


  const renderPanel = () => {
    switch (activePanel) {
      case 'profile':
        return <ProfileForm profile={profile} />;
      case 'links':
        return <LinksPanel profile={profile} onLinkChange={loadProfile}  />;
      case 'posts':
        return <PostsPanel />;
      
      default:
        return <ProfilePanel />;
    }
  };

  return (
    <div>
      <Navbar />
      <div className="console-layout">
        <nav className="console-menu">
          <div
            className={`menu-item ${activePanel === 'profile' ? 'active' : ''}`}
            onClick={() => setActivePanel('profile')}
          >
            Profile
          </div>
          <div
            className={`menu-item ${activePanel === 'links' ? 'active' : ''}`}
            onClick={() => setActivePanel('links')}
          >
            Links
          </div>
          <div
            className={`menu-item ${activePanel === 'posts' ? 'active' : ''}`}
            onClick={() => setActivePanel('posts')}
          >
            Posts
          </div>
          
        </nav>

        <main className="console-panel">
          {renderPanel()}
        </main>
      </div>
    </div>
  );
};

export default Console;
