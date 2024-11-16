//@ts-nocheck
import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { Profile, Link, Canister } from "../api/profile/service.did"
import { useOneblock } from "../components/Store"
import "../styles/Profile.css"
import PostList from "../components/PostList"
import moment from "moment"
const ProfilePage = () => {
  const oneblock = useOneblock()
  const [links, setLinks] = useState<Link[]>([])
  const [canister, setCanister] = useState<Canister | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [activeTab, setActiveTab] = useState('posts')
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setLoading(true)
    const [profileData] = await oneblock.getProfile(id)
    if (profileData) {
      setLinks(profileData.links)
      setProfile(profileData)
      const [canisterData] = await oneblock.getProfileCanister(profileData.owner)
      if (canisterData) {
        setCanister(canisterData)
      }
    }
    setLoading(false)
  }
  return (
    <div className="profile-container">
      <header className="profile-header">
        <div className="profile-avatar">
          <img src={profile?.pfp || '/default-avatar.png'} alt={profile?.name} />
        </div>
        <div className="profile-info">
          <h1>{profile?.name}</h1>
          <p className="bio">{profile?.bio}</p>
          
        </div>
      </header>

      <hr style={{
        width: '100%',
        height: '1px',
        backgroundColor: '#e0e0e0',
        border: 'none',
        margin: '32px 0'
      }} />

      <main style={{
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gap: '32px'
      }}>
        <div className="links-section">
          <div className="links-grid" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {links.map((link, index) => (
              <a 
                key={index}
                href={link.url}
                className="link-item"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  backgroundColor: '#f0f0f0',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  textDecoration: 'none',
                  color: '#333',
                  margin: '4px',
                  whiteSpace: 'nowrap',
                  
                }}
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>

        <div className="posts-section">
          {canister ? (
            <PostList canister={canister} />
          ) : (
            !loading && (
              <div className="setup-guide">
                <h2>Setup Your Post Storage</h2>
                <ol>
                  <li>Create a satellite on <a href="https://juno.build">Juno</a></li>
                  <li>Create a collection named "posts" under datastore</li>
                  <li>Copy satellite ID and configure it in your OneBlock settings</li>
                </ol>
              </div>
            )
          )}
        </div>
      </main>
    </div>
  )}

export { ProfilePage }
