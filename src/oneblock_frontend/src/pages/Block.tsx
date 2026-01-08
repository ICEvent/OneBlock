import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOneblock } from '../components/Store';
import { Profile } from '../types/profile';
import { Link as ProfileLink } from '../api/profile/service.did.d';
import BlockChain from '../components/BlockChain';
import { Block } from '../types/block';
import Navbar from '../components/Navbar';
import '../styles/Block.css';

const BlockPage = () => {
  const { id } = useParams<{ id: string }>();
  const oneblock = useOneblock();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);

  useEffect(() => {
    if (id) {
      loadProfile();
    }
  }, [id]);

  const loadProfile = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const [profileData] = await oneblock.getProfile(id as string);
      
      if (profileData) {
        setProfile({
          id: profileData.id,
          name: profileData.name,
          bio: profileData.bio,
          pfp: profileData.pfp || null,
          links: profileData.links || [],
          owner: profileData.owner,
          createtime: typeof profileData.createtime === 'bigint' 
            ? Number(profileData.createtime) 
            : (profileData.createtime as number) || Date.now(),
          blocks: profileData.blocks || [],
          traits: profileData.traits || [],
          visibility: profileData.visibility as any,
          last_updated: typeof profileData.last_updated === 'bigint' 
            ? Number(profileData.last_updated) 
            : profileData.last_updated as number | undefined,
        });

        // Load blocks for this profile
        // For now, create sample blocks to demonstrate the UI
        const sampleBlocks: Block[] = [
          {
            id: '1',
            profile_id: profileData.id,
            start_time: Date.now() - 365 * 24 * 60 * 60 * 1000,
            end_time: Date.now() - 180 * 24 * 60 * 60 * 1000,
            evidence_refs: ['https://icevent.app', 'https://alltracks.icevent.app'],
            derived_traits: ['builder', 'consistent'],
            narrative: 'Started building on the Internet Computer. Launched multiple projects and contributed to the IC ecosystem.',
            visibility: 'public' as any,
            hash: 'a1b2c3d4e5f6',
            created_at: Date.now() - 365 * 24 * 60 * 60 * 1000,
          },
          {
            id: '2',
            profile_id: profileData.id,
            start_time: Date.now() - 180 * 24 * 60 * 60 * 1000,
            end_time: Date.now() - 90 * 24 * 60 * 60 * 1000,
            evidence_refs: ['https://vansday.net'],
            derived_traits: ['community', 'active'],
            narrative: 'Engaged with the community through events and collaborations. Built tools to help others in the ecosystem.',
            visibility: 'public' as any,
            hash: 'b2c3d4e5f6a1',
            created_at: Date.now() - 180 * 24 * 60 * 60 * 1000,
          },
          {
            id: '3',
            profile_id: profileData.id,
            start_time: Date.now() - 90 * 24 * 60 * 60 * 1000,
            evidence_refs: ['https://dashboard.internetcomputer.org/'],
            derived_traits: ['persistent', 'innovative'],
            narrative: 'Continuing to build and expand. Focusing on creating value for the entire ecosystem.',
            visibility: 'public' as any,
            hash: 'c3d4e5f6a1b2',
            created_at: Date.now() - 90 * 24 * 60 * 60 * 1000,
          },
        ];
        
        setBlocks(sampleBlocks);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="block-page loading">
          <div className="loading-spinner">
            <span className="material-icons">hourglass_empty</span>
            <p>Loading blocks...</p>
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
          <h2>Profile Not Found</h2>
          <p>The profile you're looking for doesn't exist or has been removed.</p>
          <Link to="/" className="home-link">Return Home</Link>
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
              <img src={profile.pfp || ''} alt={profile.name} className="profile-avatar-small" />
              <div className="profile-text">
                <h1>{profile.name}</h1>
                <p className="profile-bio-short">{profile.bio}</p>
              </div>
            </div>
            
            <div className="header-stats">
              <div className="stat-box">
                <span className="stat-number">{blocks.length}</span>
                <span className="stat-label">Blocks</span>
              </div>
              <div className="stat-box">
                <span className="stat-number">{profile.links?.length || 0}</span>
                <span className="stat-label">Sources</span>
              </div>
              <div className="stat-box">
                <span className="stat-number">
                  {blocks.reduce((sum, b) => sum + (b.derived_traits?.length || 0), 0)}
                </span>
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
            <div className="sidebar-section">
              <h3>Connected Sources</h3>
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
              ) : (
                <p className="no-sources">No sources connected</p>
              )}
            </div>

            <div className="sidebar-section">
              <h3>About Blocks</h3>
              <p className="info-text">
                Each block represents a period of activity and growth. Blocks are 
                connected chronologically to form your unique chain of experiences.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BlockPage;
