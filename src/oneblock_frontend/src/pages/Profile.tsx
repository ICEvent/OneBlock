//@ts-nocheck
import React, { useEffect, useState } from "react";
import { Link as NavLink, useParams } from "react-router-dom";
import { Profile } from "../api/profile/service.did.d";
import { useGlobalContext, useOneblock } from "../components/Store";
import Navbar from "../components/Navbar";
import ProfileLayout from "../layouts/ProfileLayout";
import ProfileSidebar from "../components/ProfileSidebar";
import ScoresOIP from "../components/ScoresOIP";
import TrustReputation from "../components/TrustReputation";
import "../styles/Profile.css";

const ProfilePage = () => {
  const oneblock = useOneblock();
  const { state: { agent, isAuthed, principal } } = useGlobalContext();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [scores, setScores] = useState<any | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setProfile(null);
      setScores(null);

      try {
        if (!id) return;
        const [profileData] = await oneblock.getProfile(id);
        if (!active || !profileData) return;

        const nextProfile = {
          id: profileData.id,
          name: profileData.name,
          bio: profileData.bio,
          pfp: profileData.pfp,
          links: profileData.links,
          owner: profileData.owner,
        } as Profile;
        setProfile(nextProfile);

        const ownerText = profileData.owner && typeof profileData.owner === 'object' && profileData.owner.toText
          ? profileData.owner.toText()
          : profileData.owner ? String(profileData.owner) : '';
        const [scoreData] = ownerText ? await oneblock.getScores(ownerText).catch(() => []) : [];
        if (active && scoreData) setScores(scoreData);
      } catch (error) {
        console.error('Error loading profile', error);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => { active = false; };
  }, [id, oneblock]);

  const ProfilePlaceholder = () => (
    <div className="profile-container">
      <header className="profile-header">
        <div className="profile-avatar"><div className="placeholder-avatar animate-pulse" /></div>
        <div className="profile-info">
          <div className="placeholder-text animate-pulse" />
          <div className="placeholder-bio animate-pulse" />
        </div>
      </header>
    </div>
  );

  const ProfileNotFound = () => (
    <div style={{ textAlign: 'center', padding: '48px 24px', margin: '40px auto', maxWidth: '520px' }}>
      <span className="material-icons" style={{ fontSize: '48px', color: '#64748b' }}>person_off</span>
      <h2>Profile not found</h2>
      <p>This profile does not exist or is no longer available.</p>
      <NavLink to="/" style={{ display: 'inline-block', marginTop: '16px' }}>Return home</NavLink>
    </div>
  );

  const ownerText = profile?.owner && typeof profile.owner === 'object' && profile.owner.toText
    ? profile.owner.toText()
    : profile?.owner ? String(profile.owner) : '';
  const isOwnProfile = Boolean(isAuthed && principal && ownerText && principal.toText() === ownerText);

  return (
    <>
      <Navbar />
      {loading ? (
        <ProfilePlaceholder />
      ) : !profile ? (
        <ProfileNotFound />
      ) : (
        <ProfileLayout
          sidebar={<ProfileSidebar profile={profile} tags={[]} />}
          main={
            <div style={{ display: 'grid', gap: '20px' }}>
              {profile.owner && (
                <TrustReputation
                  subject={profile.owner}
                  agent={agent}
                  showPrivateStats={isOwnProfile}
                />
              )}

              <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '20px' }}>
                <div style={{ marginBottom: '14px' }}>
                  <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Derived identity model</span>
                  <h3 style={{ margin: '4px 0 6px', color: '#0f172a' }}>Identity confidence</h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.86rem', lineHeight: 1.5 }}>
                    OIP signals are probabilistic interpretations built above the evidence layer. They are not the same as verified Trust Protocol reputation.
                  </p>
                </div>
                <ScoresOIP scores={scores} />
              </section>
            </div>
          }
        />
      )}
    </>
  );
};

export { ProfilePage };
