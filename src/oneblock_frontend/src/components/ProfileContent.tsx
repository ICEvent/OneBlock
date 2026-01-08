import React from 'react';
import { Block, Trait } from '../types/block';
import BlockChain from './BlockChain';
import { TraitList } from './TraitBadge';
import '../styles/ProfileContent.css';

interface ProfileContentProps {
  blocks?: Block[];
  traits?: Trait[];
  activeTab?: 'blocks' | 'traits' | 'all';
}

const ProfileContent: React.FC<ProfileContentProps> = ({ 
  blocks = [], 
  traits = [],
  activeTab = 'all'
}) => {
  const [currentTab, setCurrentTab] = React.useState(activeTab);

  const hasContent = blocks.length > 0 || traits.length > 0;

  if (!hasContent) {
    return (
      <div className="profile-content-empty">
        <span className="material-icons">account_circle</span>
        <p>This profile is just getting started</p>
        <span>Check back later to see their chain of life events</span>
      </div>
    );
  }

  const showBlocks = blocks.length > 0;
  const showTraits = traits.length > 0;

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

      {currentTab === 'blocks' && <BlockChain blocks={blocks} />}
      {currentTab === 'traits' && <TraitList traits={traits} />}
    </div>
  );
};

export default ProfileContent;
