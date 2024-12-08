import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Profile } from '../../api/profile/service.did.d';
import { useGlobalContext } from '../Store';
import { useOneblock } from '../Store';


export const ProfilePanel = () => {
  const oneblock = useOneblock();
  const navigate = useNavigate();
  const { state: { principal } } = useGlobalContext();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    bio: '',
    pfp: ''
  });

  useEffect(() => {
   
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!principal) return;  // Early return if null
    const [profileData] = await oneblock.getProfile(principal.toText());
    if (profileData) {
      setProfile(profileData);
      setFormData({
        id: profileData.id,
        name: profileData.name,
        bio: profileData.bio,
        pfp: profileData.pfp
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profile) {
      await oneblock.updateProfile(profile.id,formData);
    } else {
      await oneblock.createProfile(formData);
    }
    loadProfile();
  };

  return (
    <div className="panel">
      <h2>{profile ? 'Update Profile' : 'Create Profile'}</h2>
      <div>Principal: {principal?.toText()}</div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div className="form-group">
          <label>Bio</label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            required
          />
        </div>
        <div className="form-group">
          <label>Profile Picture URL</label>
          <input
            type="text"
            value={formData.pfp}
            onChange={(e) => setFormData(prev => ({ ...prev, pfp: e.target.value }))}
          />
        </div>
        <button type="submit">
          {profile ? 'Save Changes' : 'Create Profile'}
        </button>
      </form>
    </div>
  );
};
