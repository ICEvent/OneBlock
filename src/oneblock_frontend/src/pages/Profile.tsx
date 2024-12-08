//@ts-nocheck
import React, { useEffect, useState } from "react"
import { useParams, Link as NavLink } from "react-router-dom"
import { Profile, Link, Canister } from "../api/profile/service.did.d"
import { useOneblock } from "../components/Store"
import "../styles/Profile.css"
import PostList from "../components/PostList"
import moment from "moment"
import { getDoc, listDocs } from "@junobuild/core"
import { CANISTER_ALLTRACKS } from "../lib/constants"
import ProfileLayout from "../layouts/ProfileLayout";
import ProfileSidebar from "../components/ProfileSidebar"
import ProfileMain from "../components/ProfileStats";
import { Post } from "../types/post"


const ProfilePage = () => {
  const oneblock = useOneblock()
  const [links, setLinks] = useState<Link[]>([])
  const [canister, setCanister] = useState<Canister | null>(null)

  const [activeTab, setActiveTab] = useState('posts')
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [profile, setProfile] = useState<Profile | null>(null);

  const [stats, setStats] = useState<StatsCollection>({
    UserStats: {
      description: " ",
      data: {
        BlockList: 0,
        Defund: 0,
        AllTracks: 0,
        OG: 0,
      }

    }
  });


  useEffect(() => {
    setLoading(true)
    loadProfile()

    setLoading(false)
  }, [])

  useEffect(() => {
    if (canister) {
      loadPosts(canister)
    }

  }, [canister])

  useEffect(() => {
    if (profile) {
      loadCanister()
    }

  }, [profile]);

  const loadCanister = async () => {

    const [canisterData] = await oneblock.getProfileCanister(profile.owner);

    if (canisterData) {
      setCanister(canisterData);
    }
  };

  const loadPosts = async (canisterData: Canister) => {

    const docs = await listDocs<Post>({
      satellite: { satelliteId: canisterData.canisterid.toText() },
      collection: canisterData.posts,
      filter: {
        order: {
          desc: true,
          field: "created_at",
        },
      },
    });
    console.log("docs", docs);
    if (docs.items_length > 0) {
      const parsePosts = docs.items.map(item => ({
        id: item.key,
        post: item.data.post,
        timestamp: item.created_at ? moment.unix(parseInt(item.created_at.toString()) / 1000000000).format("MMMM Do YYYY, h:mm a") : "",
      }));
      setPosts(parsePosts);
    }
  };



  const loadProfile = async () => {
    const [profileData] = await oneblock.getProfile(id);

    if (profileData) {
      setProfile({
        id: profileData.id,
        name: profileData.name,
        bio: profileData.bio,
        pfp: profileData.pfp,
        links: profileData.links,
        owner: profileData.owner,
      })

    }

  }

  const loadScore = async () => {
    const stats = await getDoc({
      satellite: { satelliteId: CANISTER_ALLTRACKS },
      collection: "stats",
      key: profile.owner.toText()
    });


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
  const ProfileNotFound = () => (
    <div style={{ 
      textAlign: 'center', 
      padding: '40px',
      margin: '40px auto',
      maxWidth: '500px',
      background: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <span className="material-icons" style={{ fontSize: '48px', color: '#666' }}>
        person_off
      </span>
      <h2>Profile Not Found</h2>
      <p>The profile you're looking for doesn't exist or has been removed.</p>
      <NavLink to="/" style={{ 
        display: 'inline-block',
        marginTop: '20px',
        padding: '8px 16px',
        background: '#4CAF50',
        color: 'white',
        borderRadius: '4px',
        textDecoration: 'none'
      }}>
        Return Home
      </NavLink>
    </div>
  );
  
  return (
    <>
      {loading ? (
        <ProfilePlaceholder />        
      ) : !profile ? (
        <ProfileNotFound />
      ) : (
        <ProfileLayout
          sidebar={<ProfileSidebar profile={profile} tags={[]} />}
          main={<ProfileMain posts={posts} stats={stats} />} />

      )}
    </>
  )
}


export { ProfilePage }

