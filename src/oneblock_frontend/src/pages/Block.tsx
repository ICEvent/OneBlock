import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useGlobalContext, useOneblock } from '../components/Store';
import { Profile } from '../types/profile';
import BlockChain from '../components/BlockChain';
import Navbar from '../components/Navbar';
import TrustReputation from '../components/TrustReputation';
import { Block } from '../types/block';
import ScoresOIP from '../components/ScoresOIP';
import '../styles/Block.css';

const BlockPage = () => {
  const { id } = useParams<{ id: string }>();
  const oneblock = useOneblock();
  const { state: { agent } } = useGlobalContext();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [scores, setScores] = useState<any | null>(null);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [profileData] = await oneblock.getProfile(id);
        if (!active || !profileData) return;

        setProfile({
          id: profileData.id,
          name: profileData.name,
          bio: profileData.bio,
          pfp: profileData.pfp || null,
          links: profileData.links || [],
          owner: profileData.owner,
          createtime: typeof profileData.createtime === 'bigint' ? Number(profileData.createtime) : (profileData.createtime as number) || Date.now(),
          blocks: profileData.blocks || [],
          traits: profileData.traits || [],
          visibility: profileData.visibility as any,
          last_updated: typeof profileData.last_updated === 'bigint' ? Number(profileData.last_updated) : profileData.last_updated as number | undefined,
        });

        const ownerText = typeof profileData.owner === 'object' && profileData.owner?.toText
          ? profileData.owner.toText()
          : profileData.owner ? String(profileData.owner) : '';
        const [blocksData, scoreResult] = await Promise.all([
          oneblock.listBlocks(profileData.id),
          ownerText ? oneblock.getScores(ownerText).catch(() => []) : Promise.resolve([]),
        ]);
        if (!active) return;
        setBlocks(blocksData as Block[]);
        const [scoreData] = scoreResult;
        if (scoreData) setScores(scoreData);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadProfile();
    return () => { active = false; };
  }, [id, oneblock]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="block-page loading">
          <div className="loading-spinner">
            <span className="material-icons">hourglass_empty</span>
            <p>Loading profile chain…</p>
          </div>
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Navbar />
        <div className="block-page not-found">
          <span className="material-icons">person_off</span>
          <h2>Profile not found</h2>
          <p>This profile does not exist or is no longer available.</p>
          <Link to="/" className="home-link">Return home</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="block-page">
        <div className="block-page-header">
          <div className="header-content">
            <div className="profile-info-compact">
              {profile.pfp ? <img src={profile.pfp} alt={profile.name} className="profile-avatar-small" /> : <div className="profile-avatar-small" />}
              <div className="profile-text">
                <h1>{profile.name}</h1>
                <p className="profile-bio-short">{profile.bio}</p>
              </div>
            </div>

            <div className="header-stats">
              <div className="stat-box"><span className="stat-number">{blocks.length}</span><span className="stat-label">Blocks</span></div>
              <div className="stat-box"><span className="stat-number">{profile.links?.length || 0}</span><span className="stat-label">Sources</span></div>
              <div className="stat-box">
                <span className="stat-number">{blocks.reduce((sum, block) => sum + (block.derived_traits?.length || 0), 0)}</span>
                <span className="stat-label">Traits</span>
              </div>
            </div>
          </div>
        </div>

        <div className="block-page-content">
          <div className="blockchain-container">
            <BlockChain blocks={blocks} showPrivacy={false} />
          </div>

          <div className="block-sidebar">
            {profile.owner && <TrustReputation subject={profile.owner} agent={agent} compact />}

            <div className="sidebar-section">
              <h3>Connected sources</h3>
              {profile.links && profile.links.length > 0 ? (
                <ul className="sources-list">
                  {profile.links.map((link, index) => (
                    <li key={index}>
                      <a href={link.url} target="_blank" rel="noopener noreferrer">
                        <span className="material-icons">link</span>
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : <p className="no-sources">No sources connected</p>}
            </div>

            <div className="sidebar-section">
              <h3>About blocks</h3>
              <p className="info-text">Each block is a provenance-bearing activity claim connected into the subject's chronology.</p>
            </div>

            <div className="sidebar-section">
              <h3>Identity confidence</h3>
              <p className="info-text">Derived model signals, separate from verified reputation evidence.</p>
              <ScoresOIP scores={scores} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BlockPage;
