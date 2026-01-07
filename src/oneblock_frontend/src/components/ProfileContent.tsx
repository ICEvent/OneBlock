import React from 'react';
import { Post } from '../types/post';
import { Block, Trait } from '../types/block';
import { PostList } from './console/PostList';
import BlockChain from './BlockChain';
import { TraitList } from './TraitBadge';
import '../styles/ProfileContent.css';

interface ProfileContentProps {
  posts?: Post[];
  blocks?: Block[];
  traits?: Trait[];
  activeTab?: 'posts' | 'blocks' | 'traits' | 'all';
}

const ProfileContent: React.FC<ProfileContentProps> = ({ 
  posts = [], 
  blocks = [], 
  traits = [],
  activeTab = 'all'
}) => {
  const [currentTab, setCurrentTab] = React.useState(activeTab);

  const hasContent = posts.length > 0 || blocks.length > 0 || traits.length > 0;

  if (!hasContent) {
    return (
      <div className="profile-content-empty">
        <span className="material-icons">account_circle</span>
        <p>This profile is just getting started</p>
        <span>Check back later to see their chain of life events</span>
      </div>
    );
  }

  // If there are blocks, prioritize showing them
  const showBlocks = blocks.length > 0;
  const showTraits = traits.length > 0;
  const showPosts = posts.length > 0;

  return (
    <div className="profile-content">
      {showBlocks && currentTab === 'all' && (
        <section className="content-section">
          <BlockChain blocks={blocks} />
        </section>
      )}

      {showTraits && currentTab === 'all' && (
        <section className="content-section">
          <TraitList traits={traits} />
        </section>
      )}

      {showPosts && currentTab === 'all' && (
        <section className="content-section">
          <div className="posts-section">
            <h3>Activity</h3>
            <PostList posts={posts} />
          </div>
        </section>
      )}

      {currentTab === 'blocks' && <BlockChain blocks={blocks} />}
      {currentTab === 'traits' && <TraitList traits={traits} />}
      {currentTab === 'posts' && (
        <div className="posts-section">
          <PostList posts={posts} />
        </div>
      )}
    </div>
  );
};

export default ProfileContent;
