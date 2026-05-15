import React from "react";
import "../styles/OIP.css";

type Scores = {
  human_score: number;
  uniqueness_score: number;
  trust_score: number;
  reputation_score: number;
  ai_probability: number;
  organization_probability: number;
  model_version: string;
  updated_at: bigint | number;
};

const toPct = (v: number) => Math.round(Math.max(0, Math.min(1, v ?? 0)) * 100);

const SCORE_ROWS: { key: keyof Scores; label: string; desc: string; color: string }[] = [
  { key: "human_score",             label: "Human",              desc: "Likelihood this identity belongs to a real human",              color: "green"  },
  { key: "uniqueness_score",        label: "Uniqueness",         desc: "How distinct this identity is across the network",              color: "blue"   },
  { key: "trust_score",             label: "Trust",              desc: "Peer-verified trust level from social connections",             color: "purple" },
  { key: "reputation_score",        label: "Reputation",         desc: "On-chain activity and contribution track record",               color: "yellow" },
  { key: "ai_probability",          label: "AI Probability",     desc: "Estimated chance this identity is AI-generated (lower = better)", color: "red"  },
  { key: "organization_probability",label: "Org Probability",    desc: "Estimated chance this identity represents an organization",     color: "yellow" },
];

export default function ScoresOIP({ scores }: { scores: Scores | null }) {
  if (!scores) {
    return (
      <div className="oip-scores-empty">
        <div className="oip-empty-icon">🔍</div>
        <p>No OIP scores yet.<br />Add identity factors to start building a score.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="oip-scores">
        {SCORE_ROWS.map(({ key, label, desc, color }) => {
          const pct = toPct(scores[key] as number);
          return (
            <div key={key} className="oip-score-row">
              <div className="oip-score-header">
                <span className="oip-score-label">{label}</span>
                <span className="oip-score-pct">{pct}%</span>
              </div>
              <div className="oip-score-desc">{desc}</div>
              <div className="oip-bar-track">
                <div className={`oip-bar-fill ${color}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="oip-model-tag">Model: {scores.model_version}</div>
    </div>
  );
}
