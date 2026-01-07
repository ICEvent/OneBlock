import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/IntroSection.css';

interface IntroSectionProps {
  exampleProfileId?: string;
}

const IntroSection: React.FC<IntroSectionProps> = ({ exampleProfileId = "demo" }) => {
  return (
    <div className="intro-section">
      <div className="intro-content">
        <h1 className="intro-title">oneblock</h1>
        <p className="intro-tagline">One person. One block. A life in sequence.</p>
        
        <div className="intro-philosophy">
          <p className="philosophy-statement">We believe a person is not a résumé.</p>
          
          <div className="philosophy-contrast">
            <p>A résumé is edited, compressed, and optimized for approval.</p>
            <p>A life is not.</p>
          </div>
          
          <div className="philosophy-explanation">
            <p>At oneblock, each person is treated as a block in time —<br />
            defined not by titles, but by actions, persistence, and change.</p>
          </div>
          
          <div className="block-properties">
            <p>A block has:</p>
            <ul>
              <li>a timestamp</li>
              <li>a history</li>
              <li>evidence of what actually happened</li>
            </ul>
            <p className="parallel">So does a person.</p>
          </div>
          
          <div className="philosophy-core">
            <p><strong>oneblock is a public profile system built on this idea:</strong></p>
            <p className="core-principle">Your life unfolds forward. It does not reset.</p>
          </div>
          
          <div className="values-list">
            <p>We do not rank people.</p>
            <p>We do not score lives.</p>
            <p>We do not optimize for attention.</p>
          </div>
          
          <div className="mission-statement">
            <p>We make life paths readable —<br />
            through verified activity, long-term behavior, and honest narrative.</p>
          </div>
          
          <div className="world-context">
            <p>In a world where careers are non-linear,<br />
            and value is created outside institutions,<br />
            oneblock exists so real paths can be seen, understood, and trusted.</p>
          </div>
          
          <div className="closing-statement">
            <p>Your life is already a chain.</p>
            <p className="call-to-action-text">oneblock simply lets you show it.</p>
          </div>
          
          <Link to={`/${exampleProfileId}`} className="view-example-btn">
            View a real oneblock →
          </Link>
          <p className="no-signup">(no sign-up required)</p>
        </div>
      </div>
    </div>
  );
};

export default IntroSection;
