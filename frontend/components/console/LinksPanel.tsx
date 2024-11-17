import React, { useEffect, useState } from 'react';
import { Profile } from '../../api/profile/service.did';
import { useGlobalContext } from '../Store';
import { useOneblock } from '../Store';

export const LinksPanel = () => {
  const oneblock = useOneblock();
  const { state: { principal } } = useGlobalContext();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [newLink, setNewLink] = useState({ name: "", url: "" });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const [profileData] = await oneblock.getProfile(principal);
    if (profileData) {
      setProfile(profileData);
    }
  };

  const addLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profile) {
      await oneblock.addLink(profile.id, newLink);
      setNewLink({ name: "", url: "" });
      loadProfile();
    }
  };

  const deleteLink = async (name: string) => {
    if (profile) {
      await oneblock.deleteLink(profile.id, name);
      loadProfile();
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
        <button type="submit">Add Link</button>
      </form>

      <div className="links-list">
        {profile?.links.map((link, index) => (
          <div key={index} className="link-item">
            <div className="link-info">
              <span className="link-name">{link.name}</span>
              <span className="link-url">{link.url}</span>
            </div>
            <button onClick={() => deleteLink(link.name)} className="delete-btn">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};
