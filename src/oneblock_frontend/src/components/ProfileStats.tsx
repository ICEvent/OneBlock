import React from 'react';
import { StatsCollection } from '../types/userStat';
import { Post } from '../types/post';
import { PostList } from './console/PostList';

interface ProfileStatsProps {
  stats: StatsCollection;
  posts: Post[]; // Add posts prop
}

const ProfileStats: React.FC<ProfileStatsProps> = ({ stats, posts }) => {
  return (
    <>
    <div className="stats-container">
      {Object.entries(stats).map(([source, { description, data }]) => {
        const itemCount = Object.keys(data).length;
        const gridClass = `stats-grid ${itemCount === 1 ? 'single-item' : ''}`;
        
        return (
          <section key={source} className="stats-section">
            <h3>{source}</h3>
            <p className="stats-description">{description}</p>
            <div className={gridClass}>
              {Object.entries(data).map(([key, value]) => (
                <div key={key} className="stat-item">
                  <label>{key}</label>
                  <span className="stat-value">{value}</span>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
    <div className="posts-section">
        <h3>Recent Posts</h3>
        <PostList posts={posts} />
      </div>
    </>
  );
};

export default ProfileStats;
