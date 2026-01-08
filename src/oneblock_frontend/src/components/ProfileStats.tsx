import React from 'react';
import { StatsCollection } from '../types/userStat';

interface ProfileStatsProps {
  stats: StatsCollection;
}

const ProfileStats: React.FC<ProfileStatsProps> = ({ stats }) => {
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
    </>
  );
};

export default ProfileStats;
