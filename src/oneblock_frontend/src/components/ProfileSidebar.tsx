import React, { useEffect } from 'react';
import moment from 'moment';
import { Profile } from '../types/profile';

interface ProfileSidebarProps  {
  profile: Profile;
    tags: string[]  
}
const ProfileSidebar: React.FC<ProfileSidebarProps>  = ( {profile, tags} ) => {

  return (
    <div className="profile-sidebar-container">
      <section className="profile-section">
      <div className="profile-avatar">
        {profile.pfp ? (
          <img src={profile.pfp} alt={profile.name} />
        ) : (
          <div className="avatar-placeholder">
            {profile.name?.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <h2>{profile.name}</h2>
      {profile.id && <h5>@{profile.id}</h5>}
      
      <p className="intro">{profile.bio}</p>
      
      {tags.length > 0 && <div className="tags-section">
        
        <div className="tags-list">
          {tags.map((tag, i) => (
            <span key={i} className="tag">{tag}</span>
          ))}
        </div>
      </div>}
      
      </section>      

      <div className="links-section">        
        <ul>
          {profile.links?.map((link, i) => (
            <li key={i}>
            <a href={link.url} className="link-item" target="_blank" rel="noopener noreferrer">
            <span className="link-title">{link.name}</span>
            <span className="material-icons link-icon">link</span>
              
            </a>
          </li>
          ))}
        </ul>
      </div>
      {/* <div>Since {moment.unix((profile.createtime)).format("MMM DD, YY")}</div> */}
    </div>
  );
};

export default ProfileSidebar;
