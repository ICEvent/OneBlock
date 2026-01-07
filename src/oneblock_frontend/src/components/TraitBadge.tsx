import React from 'react';
import { Trait, Strength } from '../types/block';
import '../styles/Trait.css';

interface TraitBadgeProps {
  trait: Trait;
  compact?: boolean;
}

const TraitBadge: React.FC<TraitBadgeProps> = ({ trait, compact = false }) => {
  const getStrengthClass = (strength: Strength): string => {
    switch (strength) {
      case Strength.High:
        return 'strength-high';
      case Strength.Medium:
        return 'strength-medium';
      case Strength.Low:
        return 'strength-low';
      default:
        return 'strength-medium';
    }
  };

  const getConfidencePercent = (confidence: number): string => {
    return `${Math.round(confidence * 100)}%`;
  };

  if (compact) {
    return (
      <div className={`trait-badge compact ${getStrengthClass(trait.strength)}`}>
        <span className="trait-label">{trait.label}</span>
        <span className="trait-confidence">{getConfidencePercent(trait.confidence)}</span>
      </div>
    );
  }

  return (
    <div className={`trait-card ${getStrengthClass(trait.strength)}`}>
      <div className="trait-header">
        <h4 className="trait-label">{trait.label}</h4>
        <div className="trait-meta">
          <span className="trait-strength" title="Strength">
            {trait.strength}
          </span>
          <span className="trait-confidence" title="Confidence">
            {getConfidencePercent(trait.confidence)}
          </span>
        </div>
      </div>

      <p className="trait-explanation">{trait.explanation}</p>

      {trait.derived_from && trait.derived_from.length > 0 && (
        <div className="trait-blocks">
          <span className="material-icons">link</span>
          <span>Derived from {trait.derived_from.length} block{trait.derived_from.length !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
};

interface TraitListProps {
  traits: Trait[];
  compact?: boolean;
}

export const TraitList: React.FC<TraitListProps> = ({ traits, compact = false }) => {
  if (!traits || traits.length === 0) {
    return (
      <div className="traits-empty">
        <span className="material-icons">psychology</span>
        <p>No traits yet</p>
        <span>Traits are derived from your blocks</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="traits-compact">
        {traits.map((trait) => (
          <TraitBadge key={trait.id} trait={trait} compact />
        ))}
      </div>
    );
  }

  return (
    <div className="traits-list">
      <h3>Derived Traits</h3>
      {traits.map((trait) => (
        <TraitBadge key={trait.id} trait={trait} />
      ))}
    </div>
  );
};

export default TraitBadge;
