import React, { ReactNode } from 'react';
import '../styles/ProfileLayout.css';

type ProfileLayoutProps = {
  sidebar: ReactNode;
  main: ReactNode;
};

const ProfileLayout = ({ sidebar, main }: ProfileLayoutProps) => {
  return (
    <div className="profile-layout">
      <aside className="profile-sidebar">{sidebar}</aside>
      <main className="profile-main">{main}</main>
    </div>
  );
};

export default ProfileLayout;
