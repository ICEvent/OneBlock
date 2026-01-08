import React, { useEffect, useState } from "react";
import { Profile, Link, Canister } from "../api/profile/service.did.d";
import { useNavigate } from 'react-router-dom';

import '../styles/Console.css';
import { ProfilePanel } from "../components/console/ProfilePanel";
import { LinksPanel } from "../components/console/LinksPanel";
import { BlocksPanel } from "../components/console/BlocksPanel";

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
      case 'blocks':
        return <BlocksPanel />;
      
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
            <span className="material-icons">person</span>
            Profile
          </div>
          <div
            className={`menu-item ${activePanel === 'links' ? 'active' : ''}`}
            onClick={() => setActivePanel('links')}
          > <span className="material-icons">link</span>
            Links
          </div>
          <div
            className={`menu-item ${activePanel === 'blocks' ? 'active' : ''}`}
            onClick={() => setActivePanel('blocks')}
          >
            <span className="material-icons">view_timeline</span>
            Blocks
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
