//@ts-nocheck
import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { Profile, Link, Canister } from "../api/profile/service.did"
import { useOneblock } from "../components/Store"
import "../styles/Profile.css"
import PostList from "../components/PostList"
import moment from "moment"
import { getDoc } from "@junobuild/core"
import { CANISTER_ALLTRACKS } from "../lib/constants"

interface UserStats {
  totalDistance: number;
  totalHours: number;
  totalElevation: number;
  completedTrails: number;
  firstHikeDate: string;
}
const ProfilePage = () => {
  const oneblock = useOneblock()
  const [links, setLinks] = useState<Link[]>([])
  const [canister, setCanister] = useState<Canister | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [activeTab, setActiveTab] = useState('posts')
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(false)


  // Add state for stats
  const [userStats, setUserStats] = useState<UserStats>({
    totalDistance: 0,
    totalHours: 0,
    totalElevation: 0,
    completedTrails: 0,
    firstHikeDate: new Date().toDateString(),
  });

  useEffect(() => {
    setLoading(true)
    loadProfile()

    setLoading(false)
  }, [])

  useEffect(() => {
    loadScore()
  }, [profile])

  const loadProfile = async () => {

    const [profileData] = await oneblock.getProfile(id)
    if (profileData) {
      setLinks(profileData.links)
      setProfile(profileData)
      const [canisterData] = await oneblock.getProfileCanister(profileData.owner)
      if (canisterData) {
        setCanister(canisterData)
      }
    }

  }

  const loadScore = async () => {
    const stats = await getDoc({
      satellite: { satelliteId: CANISTER_ALLTRACKS },
      collection: "stats",
      key: profile.owner.toText()
    });

    console.log(stats)
    setUserStats(stats?.data || {
      totalDistance: 0,
      totalHours: 0,
      totalElevation: 0,
      completedTrails: 0,
      firstHikeDate: new Date().toDateString(),
    });

  }

  const calculateScore = (stats: UserStats): number => {
    const distancePoints = Math.floor(stats.totalDistance / 1000) * 10;
    const elevationPoints = Math.floor(stats.totalElevation / 100) * 5;
    const trailPoints = stats.completedTrails * 50;
    const hoursPoints = Math.floor(stats.totalHours) * 20;

    return distancePoints + elevationPoints + trailPoints + hoursPoints;
  };

  const ProfilePlaceholder = () => (
    <div className="profile-container">
      <header className="profile-header">
        <div className="profile-avatar">
          <div className="placeholder-avatar animate-pulse"></div>
        </div>
        <div className="profile-info">
          <div className="placeholder-text animate-pulse"></div>
          <div className="placeholder-bio animate-pulse"></div>
          <div className="links-section">
            <div className="links-grid">
              <div className="placeholder-link animate-pulse"></div>
              <div className="placeholder-link animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
      <main>
        <div className="posts-section">
          <div className="placeholder-posts animate-pulse"></div>
        </div>
      </main>
    </div>
  );

  return (
    <>
      {loading ? (
        <ProfilePlaceholder />
      ) : (
        <div className="profile-container">
          <header className="profile-header">
            <div className="profile-avatar">
              <img src={profile?.pfp || '/assets/logo.webp'} alt={profile?.name} />
            </div>

            <div className="profile-info">
              <h1>{canister ? profile?.name : "No Setup Yet"}</h1>

              <p className="bio">{canister ? profile?.bio : "no bio either, go to create one "}</p>
              <div className="links-section">
                <div className="links-grid" >
                  <div className="score-badge">
                    Score: {calculateScore(userStats)}
                  </div>
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
    </>
  )
}


export { ProfilePage }

