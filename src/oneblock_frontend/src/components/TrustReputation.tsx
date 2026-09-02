import React, { useEffect, useMemo, useState } from 'react';
import type { HttpAgent } from '@dfinity/agent';
import type { Principal } from '@dfinity/principal';
import { ActorTrustStats, TrustService, VerifiedReview } from '../api/trust/TrustService';
import '../styles/TrustReputation.css';

type Props = {
  subject: Principal | string;
  agent: HttpAgent;
  compact?: boolean;
  showPrivateStats?: boolean;
};

type DimensionSummary = {
  key: string;
  average: number;
  count: number;
};

const titleCase = (value: string) => value
  .replace(/[._-]+/g, ' ')
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

const shortPrincipal = (value: Principal) => {
  const text = value.toText();
  return text.length <= 16 ? text : `${text.slice(0, 7)}…${text.slice(-5)}`;
};

const reviewDate = (seconds: bigint) => {
  const millis = Number(seconds) * 1000;
  return Number.isFinite(millis)
    ? new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(millis))
    : '';
};

const schemaLabel = (schemaId: string) => {
  const parts = schemaId.split('.').filter(Boolean);
  if (parts.length < 2) return schemaId;
  const versionless = parts.filter((part) => !/^v\d+$/i.test(part));
  return versionless.map(titleCase).join(' · ');
};

function summarizeDimensions(reviews: VerifiedReview[]): DimensionSummary[] {
  const values = new Map<string, number[]>();
  reviews.forEach((review) => {
    review.dimensions.forEach(({ key, score }) => {
      const normalized = key.trim().toLowerCase();
      if (!normalized) return;
      values.set(normalized, [...(values.get(normalized) || []), score]);
    });
  });

  return [...values.entries()]
    .map(([key, scores]) => ({
      key,
      average: scores.reduce((sum, score) => sum + score, 0) / scores.length,
      count: scores.length,
    }))
    .sort((a, b) => {
      if (a.key === 'overall') return -1;
      if (b.key === 'overall') return 1;
      return b.count - a.count || a.key.localeCompare(b.key);
    });
}

export default function TrustReputation({ subject, agent, compact = false, showPrivateStats = false }: Props) {
  const service = useMemo(() => new TrustService(agent), [agent]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<VerifiedReview[]>([]);
  const [privateStats, setPrivateStats] = useState<ActorTrustStats | undefined>();
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setUnavailable(false);
      try {
        const [reviewViews, stats] = await Promise.all([
          service.getVerifiedReviews(subject),
          showPrivateStats ? service.getActorTrustStats(subject).catch(() => undefined) : Promise.resolve(undefined),
        ]);
        if (!active) return;
        setReviews(reviewViews.filter((view) => view.revealed).map((view) => view.review));
        setPrivateStats(stats);
      } catch (error) {
        console.warn('Unable to load Trust Protocol reputation', error);
        if (active) {
          setReviews([]);
          setPrivateStats(undefined);
          setUnavailable(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => { active = false; };
  }, [service, subject, showPrivateStats]);

  const dimensions = useMemo(() => summarizeDimensions(reviews), [reviews]);
  const overall = dimensions.find((dimension) => dimension.key === 'overall');

  if (loading) {
    return <section className={`trust-card ${compact ? 'trust-card-compact' : ''}`} aria-busy="true">
      <div className="trust-card-header">
        <div>
          <span className="trust-eyebrow">Verified reputation</span>
          <h3>Loading trust evidence…</h3>
        </div>
      </div>
      <div className="trust-skeleton" />
    </section>;
  }

  return (
    <section className={`trust-card ${compact ? 'trust-card-compact' : ''}`}>
      <div className="trust-card-header">
        <div>
          <span className="trust-eyebrow">Verified reputation</span>
          <h3>{reviews.length ? 'Evidence-backed feedback' : 'Trust history'}</h3>
          {!compact && <p>Portable reputation from ICEVENT Trust Protocol interactions, evidence and double-blind verified reviews.</p>}
        </div>
        <span className="trust-verified-badge">{reviews.length ? '✓ Verified reviews' : 'Trust Protocol'}</span>
      </div>

      <div className="trust-summary-grid">
        <div className="trust-summary-item">
          <strong>{reviews.length}</strong>
          <span>Revealed reviews</span>
        </div>
        <div className="trust-summary-item">
          <strong>{overall ? `${overall.average.toFixed(1)} / 5` : '—'}</strong>
          <span>Average overall</span>
        </div>
        {privateStats && !compact && <>
          <div className="trust-summary-item private">
            <strong>{privateStats.completedInteractions.toString()}</strong>
            <span>Completed interactions</span>
          </div>
          <div className="trust-summary-item private">
            <strong>{privateStats.uniqueCounterparties.toString()}</strong>
            <span>Unique counterparties</span>
          </div>
        </>}
      </div>

      {unavailable ? (
        <div className="trust-empty">Trust data is temporarily unavailable. The rest of this profile is still usable.</div>
      ) : reviews.length === 0 ? (
        <div className="trust-empty">
          No revealed verified reviews yet.
          {!compact && <span> Reviews remain sealed until both expected sides submit or the review window closes.</span>}
        </div>
      ) : (
        <>
          {!compact && dimensions.length > 0 && <div className="trust-dimensions" aria-label="Verified review dimensions">
            {dimensions.slice(0, 6).map((dimension) => (
              <div className="trust-dimension" key={dimension.key}>
                <span>{titleCase(dimension.key)}</span>
                <strong>{dimension.average.toFixed(1)}</strong>
                <small>{dimension.count} review{dimension.count === 1 ? '' : 's'}</small>
              </div>
            ))}
          </div>}

          {!compact && <div className="trust-review-list">
            {reviews.slice(0, 6).map((review) => (
              <article className="trust-review" key={review.id.toString()}>
                <div className="trust-review-topline">
                  <span className="trust-review-schema">{schemaLabel(review.schemaId)}</span>
                  <time>{reviewDate(review.createdAt)}</time>
                </div>
                <div className="trust-review-scores">
                  {review.dimensions.map((dimension) => (
                    <span key={dimension.key}>{titleCase(dimension.key)} <strong>{dimension.score}/5</strong></span>
                  ))}
                </div>
                {review.comment && <p>{review.comment}</p>}
                <div className="trust-review-footer">Verified reviewer {shortPrincipal(review.reviewer)}</div>
              </article>
            ))}
          </div>}
        </>
      )}

      {!compact && <div className="trust-footnote">
        OneBlock shows provenance and verified evidence rather than collapsing identity into one universal reputation score.
      </div>}
    </section>
  );
}
