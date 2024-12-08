import React, { useEffect, useState } from 'react';
import { Profile } from '../../api/profile/service.did.d';
import { CircularProgress } from '@mui/material';

import { useGlobalContext } from '../Store';
import { useOneblock } from '../Store';
interface Link {
  name: string;
  url: string;
}
interface LinksPanelProps {
  profile: Profile | null;
  onLinkChange?: () => void;  // Add callback prop
}
export const LinksPanel = ({ profile, onLinkChange }: LinksPanelProps) => {
  const oneblock = useOneblock();
  const { state: { principal } } = useGlobalContext();

  const [newLink, setNewLink] = useState({ name: "", url: "" });
  const [progress, setProgress] = useState(false);
  const [deletingLinks, setDeletingLinks] = useState<{ [key: string]: boolean }>({});


  const addLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profile && newLink.name && newLink.url) {
      setProgress(true);
      try {
        await oneblock.addLink(profile.id, newLink);
        setNewLink({ name: "", url: "" });
        onLinkChange?.();
      } finally {
        setProgress(false);
      }
    }
  };

  const deleteLink = async (name: string) => {
    if (profile) {
      setDeletingLinks(prev => ({ ...prev, [name]: true }));
      try {
        await oneblock.deleteLink(profile.id, name);
        onLinkChange?.();
      } finally {
        setDeletingLinks(prev => ({ ...prev, [name]: false }));
      }
    }
  };

  return (
    <div className="panel">
      <h2>Manage Links</h2>
      <form onSubmit={addLink}>
        <div className="form-group">
          <label>Link Name</label>
          <input
            type="text"
            value={newLink.name}
            onChange={(e) => setNewLink(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>
        <div className="form-group">
          <label>URL</label>
          <input
            type="url"
            value={newLink.url}
            onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
          />
        </div>
        <button
          type="submit"
          disabled={progress || !newLink.name || !newLink.url}
          style={{
            width: 'auto',
            minWidth: '100px',
            alignSelf: 'flex-start'
          }}
        >
          {progress ? <CircularProgress size={20} /> : 'Add Link'}
        </button>
      </form>

      <div className="links-list">
        {profile?.links.map((link, index) => (
          <div key={index} className="link-item">
            <div className="link-info">
              <span className="link-name">{typeof link.name === 'string' ? link.name : ''}</span>
              <span className="link-url">{typeof link.url === 'string' ? link.url : ''}</span>
            </div>
            <button
              onClick={() => deleteLink(link.name)}
              className="delete-btn"
              disabled={deletingLinks[link.name]}
            >
              {deletingLinks[link.name] ? <CircularProgress size={16} /> : 'Delete'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
