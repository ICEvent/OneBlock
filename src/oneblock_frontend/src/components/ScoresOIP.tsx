import React from "react";

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

const Row = ({ label, value }: { label: string; value: number }) => (
  <div style={{ marginBottom: 8 }}>
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span>{label}</span>
      <span>{toPct(value)}%</span>
    </div>
    <progress value={toPct(value)} max={100} style={{ width: "100%" }} />
  </div>
);

export default function ScoresOIP({ scores }: { scores: Scores | null }) {
  if (!scores) return <div>No OIP scores yet.</div>;

  return (
    <div>
      <Row label="Human" value={scores.human_score} />
      <Row label="Uniqueness" value={scores.uniqueness_score} />
      <Row label="Trust" value={scores.trust_score} />
      <Row label="Reputation" value={scores.reputation_score} />
      <Row label="AI Probability" value={scores.ai_probability} />
      <Row label="Organization Probability" value={scores.organization_probability} />
      <small>Model: {scores.model_version}</small>
    </div>
  );
}
