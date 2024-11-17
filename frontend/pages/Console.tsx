import React, { useEffect, useState } from "react";
import { Profile, Link, Canister } from "../api/profile/service.did";
import { useOneblock } from "../components/Store";
import { useGlobalContext } from "../components/Store";
import { setDoc } from "@junobuild/core";
import '../styles/Console.css';
import { ProfilePanel } from "../components/console/ProfilePanel";
import { LinksPanel } from "../components/console/LinksPanel";
import { PostsPanel } from "../components/console/PostsPanel";
import Navbar from "../components/Navbar";

const Console = () => {
  const [activePanel, setActivePanel] = useState('profile');

  const renderPanel = () => {
    switch (activePanel) {
      case 'profile':
        return <ProfilePanel />;
      case 'links':
        return <LinksPanel />;
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
