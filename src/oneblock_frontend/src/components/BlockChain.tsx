import React from 'react';
import { Block } from '../types/block';
import BlockCard from './BlockCard';
import '../styles/Block.css';

interface BlockChainProps {
  blocks: Block[];
  showPrivacy?: boolean;
}

const BlockChain: React.FC<BlockChainProps> = ({ blocks, showPrivacy = false }) => {
  if (!blocks || blocks.length === 0) {
    return (
      <div className="blocks-empty">
        <span className="material-icons">timeline</span>
        <p>No blocks yet</p>
        <span>Start building your chain of life events</span>
      </div>
    );
  }

  // Sort blocks by start_time (chronological order)
  const sortedBlocks = [...blocks].sort((a, b) => {
    const timeA = Number(a.start_time);
    const timeB = Number(b.start_time);
    return timeA - timeB;
  });

  return (
    <div className="block-chain">
      <div className="block-chain-header">
        <h3>Life Chain</h3>
        <p className="block-count">{blocks.length} block{blocks.length !== 1 ? 's' : ''}</p>
      </div>
      {sortedBlocks.map((block) => (
        <BlockCard key={block.id} block={block} showPrivacy={showPrivacy} />
      ))}
    </div>
  );
};

export default BlockChain;
