import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/IntroSection.css';

interface IntroSectionProps {
  blockId?: string;
}

const IntroSection: React.FC<IntroSectionProps> = ({ blockId = "oneblock" }) => {
  return (
    <div className="intro-section">
      <div className="intro-hero">
        <div className="hero-left">
          <h1 className="intro-title">Oneblock</h1>
          <p className="intro-tagline">One identity. One block. A story in sequence.</p>
          <p className="hero-description">
            An identity is not a résumé. At oneblock, each identity is a block in time — 
            defined by actions, persistence, and change.
          </p>
          <Link to={`/${blockId}`} className="view-example-btn">
            View a real oneblock →
          </Link>
          
          <div className="intro-features">
            <div className="feature-card">
              <h3>No Rankings</h3>
              <p>We don't score lives or optimize for attention</p>
            </div>
            <div className="feature-card">
              <h3>Verified Path</h3>
              <p>Real activity, behavior, and honest narrative</p>
            </div>
            <div className="feature-card">
              <h3>Forward Only</h3>
              <p>Your life unfolds forward. It does not reset.</p>
            </div>
          </div>
        </div>
        
        <div className="hero-right">
          <div className="blockchain-visual">
            <div className="block-item">
              <div className="block-icon">⏱️</div>
              <div className="block-label">timestamp</div>
            </div>
            <div className="chain-connector"></div>
            <div className="block-item">
              <div className="block-icon">📜</div>
              <div className="block-label">history</div>
            </div>
            <div className="chain-connector"></div>
            <div className="block-item">
              <div className="block-icon">✓</div>
              <div className="block-label">evidence</div>
            </div>
            <div className="chain-connector"></div>
            <div className="block-item active">
              <div className="block-icon">👤</div>
              <div className="block-label">you</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntroSection;
