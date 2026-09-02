import React, { useEffect, useState } from "react";
import { Profile } from "../api/profile/service.did.d";
import { useNavigate } from 'react-router-dom';

import '../styles/Console.css';
import { LinksPanel } from "../components/console/LinksPanel";
import { BlocksPanel } from "../components/console/BlocksPanel";
import { ProfileForm } from "../components/ProfileForm";
import Navbar from "../components/Navbar";
import { useOneblock, useGlobalContext } from "../components/Store";

type PanelKey = 'profile' | 'links' | 'blocks';

const panels: Array<{ key: PanelKey; label: string; icon: string; note: string }> = [
  { key: 'profile', label: 'Profile', icon: 'person', note: 'Public identity' },
  { key: 'links', label: 'Sources', icon: 'link', note: 'Connected presence' },
  { key: 'blocks', label: 'Blocks', icon: 'view_timeline', note: 'Evidence & narrative' },
];

const Console = () => {
  const oneblock = useOneblock();
  const [activePanel, setActivePanel] = useState<PanelKey>('profile');
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const { state: { isAuthed } } = useGlobalContext();

  useEffect(() => {
    if (!isAuthed) {
      navigate('/');
      return;
    }
    void loadProfile();
  }, [isAuthed]);

  const loadProfile = async () => {
    const [profileData] = await oneblock.getMyProfile();
    setProfile(profileData || null);
  };

  const renderPanel = () => {
    switch (activePanel) {
      case 'profile':
        return <ProfileForm profile={profile} />;
      case 'links':
        return <LinksPanel profile={profile} onLinkChange={loadProfile} />;
      case 'blocks':
        return <BlocksPanel />;
      default:
        return null;
    }
  };

  return (
    <div className="console-page">
      <Navbar />
      <div className="console-shell">
        <header className="console-hero ecosystem-hero">
          <div className="console-hero-copy">
            <span className="section-eyebrow">OneBlock workspace</span>
            <h1>Identity workspace</h1>
            <p>
              Curate your public identity, connect source profiles, and add provenance-bearing life blocks from one operating context.
            </p>
          </div>
          <div className="console-context" aria-label="Current profile">
            <span>Current profile</span>
            <strong>{profile?.name || profile?.id || 'Not created yet'}</strong>
            <small>{profile ? 'Owner-controlled public record' : 'Create a profile to start your chain'}</small>
          </div>
        </header>

        <div className="console-layout">
          <nav className="console-menu ecosystem-panel" aria-label="Identity workspace sections">
            {panels.map((panel) => {
              const active = activePanel === panel.key;
              return (
                <button
                  key={panel.key}
                  type="button"
                  className={`menu-item ${active ? 'active' : ''}`}
                  aria-pressed={active}
                  onClick={() => setActivePanel(panel.key)}
                >
                  <span className="material-icons" aria-hidden="true">{panel.icon}</span>
                  <span className="menu-item-copy">
                    <strong>{panel.label}</strong>
                    <small>{panel.note}</small>
                  </span>
                </button>
              );
            })}
          </nav>

          <main className="console-panel ecosystem-panel">
            {renderPanel()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Console;
