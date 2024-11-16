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
          <img src={profile?.pfp || '/logo.webp'} alt={profile?.name} />
        </div>
        <div className="profile-info">
          <h1>{canister ? profile?.name : "No Setup Yet"}</h1>
          <p className="bio">{canister ? profile?.bio : "no bio either, go to create one "}</p>
          <div className="links-section">
          <div className="links-grid" >
            
            {links.map((link, index) => (
              <a 
                key={index}
                href={link.url}
                className="link-item"
                target="_blank"
                rel="noopener noreferrer"
                
              >
                {link.name}
              </a>
            ))}
          
            {links.length == 0 && <a 
                key={1}
                href="https://icevent.app"
                className="link-item"
                target="_blank"
                rel="noopener noreferrer"
                
              >
                ICEvent
              </a>}    
              {links.length == 0 && <a 
                key={2}
                href="https://alltracks.icevent.app"
                className="link-item"
                target="_blank"
                rel="noopener noreferrer"
                
              >
                AllTracks
              </a>}       
          
          </div>
        </div>

        </div>
      </header>
      <main >
        
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
