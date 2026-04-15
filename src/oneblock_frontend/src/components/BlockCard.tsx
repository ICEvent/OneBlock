import React from 'react';
import moment from 'moment';
import { Block } from '../types/block';
import '../styles/Block.css';

type Visibility = Block['visibility'];

interface BlockCardProps {
  block: Block;
  showPrivacy?: boolean;
}

const BlockCard: React.FC<BlockCardProps> = ({ block, showPrivacy = false }) => {
  const formatTimestamp = (timestamp: bigint): string => {
    const ts = Number(timestamp);
    // Convert nanoseconds to milliseconds if needed
    const ms = ts > 1e12 ? ts / 1000000 : ts;
    return moment(ms).format('MMM DD, YYYY');
  };

  const getVisibilityIcon = (visibility: Visibility): string => {
    if ('global' in visibility) return 'public';
    if ('unlisted' in visibility) return 'link';
    if ('personal' in visibility) return 'lock';
    return 'public';
  };

  const endTimestamp = block.end_time.length > 0 ? (block.end_time[0] as bigint) : undefined;
  const duration = endTimestamp !== undefined
    ? `${formatTimestamp(block.start_time)} → ${formatTimestamp(endTimestamp)}`
    : `${formatTimestamp(block.start_time)} → ongoing`;

  return (
    <div className="block-card">
      <div className="block-header">
        <div className="block-timestamp">
          <span className="material-icons">schedule</span>
          <span>{duration}</span>
        </div>
        {showPrivacy && (
          <div className="block-visibility">
            <span className="material-icons">{getVisibilityIcon(block.visibility)}</span>
          </div>
        )}
      </div>

      {block.narrative.length > 0 && (
        <div className="block-narrative">
          <p>{block.narrative[0]}</p>
        </div>
      )}

      {block.evidence_refs && block.evidence_refs.length > 0 && (
        <div className="block-evidence">
          <div className="evidence-header">
            <span className="material-icons">verified</span>
            <span>Evidence</span>
          </div>
          <ul className="evidence-list">
            {block.evidence_refs.map((ref, index) => (
              <li key={index}>
                <a href={ref} target="_blank" rel="noopener noreferrer">
                  {ref}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {block.derived_traits && block.derived_traits.length > 0 && (
        <div className="block-traits">
          <span className="traits-count">
            {block.derived_traits.length} trait{block.derived_traits.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      <div className="block-footer">
        <span className="block-hash" title={`Hash: ${block.hash}`}>
          #{block.hash.substring(0, 12)}...
        </span>
      </div>
    </div>
  );
};

export default BlockCard;
