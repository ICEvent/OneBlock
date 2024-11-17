import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';
import Navbar from '../components/Navbar';

const Home = () => {
  const navigate = useNavigate();

  const handleGetStarted = async () => {

    navigate('/console');
  };

  return (
    <>
      <Navbar />

      <div className="home">
        <section className="hero">
          <div className="hero-content">
            <h1>Your Web3 Profile on the Internet Computer</h1>
            <p>Create, manage and share your decentralized profile</p>
            <button onClick={handleGetStarted} className="cta-button">
              Get Started
            </button>
          </div>
          <div className="hero-image">
            <img src="/hero600x400.png" alt="OneBlock Platform" />
          </div>
        </section>

        <section className="features">

          <div className="feature-grid">
            <div className="feature-card">
              <h3>Decentralized Profile</h3>
              <p>Own your data on the Internet Computer blockchain</p>
            </div>
            <div className="feature-card">
              <h3>Custom Links</h3>
              <p>Share all your important links in one place</p>
            </div>
            <div className="feature-card">
              <h3>Blog Posts</h3>
              <p>Share your thoughts with decentralized content</p>
            </div>
            <div className="feature-card">
              <h3>Achievement Score</h3>
              <p>Track your progress and showcase achievements</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Home;