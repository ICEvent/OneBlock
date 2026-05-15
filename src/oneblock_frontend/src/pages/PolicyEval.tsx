import React, { useState } from "react";
import Navbar from "../components/Navbar";
import { evaluatePolicy, recomputeScores } from "../api/oip";
import "../styles/OIP.css";

const POLICY_PRESETS = [
  { id: "dao-voting", label: "DAO Voting" },
  { id: "airdrop-claim", label: "Airdrop Claim" },
  { id: "kyc-lite", label: "KYC Lite" },
];

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value ?? 0)) * 100);
  return (
    <div className="oip-score-row">
      <div className="oip-score-header">
        <span className="oip-score-label">{label}</span>
        <span className="oip-score-pct">{pct}%</span>
      </div>
      <div className="oip-bar-track">
        <div className={`oip-bar-fill ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function PolicyEval() {
  const [principal, setPrincipal] = useState("");
  const [policyId, setPolicyId] = useState("dao-voting");
  const [customPolicy, setCustomPolicy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onRun = async () => {
    if (!principal.trim()) {
      setError("Please enter a principal ID to evaluate.");
      return;
    }
    setError("");
    setResult(null);
    setLoading(true);
    try {
      await recomputeScores(principal.trim(), policyId);
      const res: any = await evaluatePolicy(principal.trim(), policyId);
      if ("ok" in res) setResult(res.ok);
      else setError(res.err || "Evaluation failed — the identity graph may not exist yet.");
    } catch (e: any) {
      setError(e?.message || "Evaluation failed. Check the principal and try again.");
    } finally {
      setLoading(false);
    }
  };

  const passed = result && result.passed;

  return (
    <div>
      <Navbar />
      <div className="oip-page">
        <div className="oip-hero">
          <h2>Policy Evaluation</h2>
          <p>
            Check whether a principal meets the requirements of an OIP policy.
            The system recomputes identity scores from on-chain factors before evaluating.
          </p>
        </div>

        <div className="oip-steps">
          <div className="oip-step">
            <div className="oip-step-num">1</div>
            <span>Enter the principal ID of the identity to check</span>
          </div>
          <div className="oip-step">
            <div className="oip-step-num">2</div>
            <span>Choose the policy that defines the requirements</span>
          </div>
          <div className="oip-step">
            <div className="oip-step-num">3</div>
            <span>Run evaluation and review the score breakdown</span>
          </div>
        </div>

        <div className="oip-card">
          <div className="oip-field">
            <label>Principal ID</label>
            <div className="oip-hint">The on-chain identity to evaluate (e.g. a canister principal or a custom ID like <code>oneblock:alice</code>)</div>
            <input
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              placeholder="e.g. oneblock:alice or 2vxsx-fae"
            />
          </div>

          <div className="oip-field">
            <label>Policy</label>
            <div className="oip-hint">Policies define minimum score thresholds the identity must meet</div>
            {!customPolicy ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <select value={policyId} onChange={(e) => setPolicyId(e.target.value)}>
                  {POLICY_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>{p.label} ({p.id})</option>
                  ))}
                </select>
                <button className="oip-btn oip-btn-sm" onClick={() => setCustomPolicy(true)}>Custom…</button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  value={policyId}
                  onChange={(e) => setPolicyId(e.target.value)}
                  placeholder="policy-id"
                  style={{ flex: 1 }}
                />
                <button className="oip-btn oip-btn-sm" onClick={() => setCustomPolicy(false)}>Presets</button>
              </div>
            )}
          </div>

          <button className="oip-btn oip-btn-primary" onClick={onRun} disabled={loading}>
            {loading ? "Evaluating…" : "Run Evaluation"}
          </button>

          {error && <div className="oip-error">⚠ {error}</div>}
        </div>

        {result && (
          <div className="oip-result">
            <div className={`oip-result-banner ${passed ? "pass" : "fail"}`}>
              {passed ? "✓ Passed" : "✗ Failed"} — policy <strong>{policyId}</strong>
            </div>
            <div className="oip-result-body">
              {result.scores && (
                <div className="oip-scores">
                  <ScoreBar label="Human Score"      value={result.scores.human_score}      color="green" />
                  <ScoreBar label="Uniqueness"        value={result.scores.uniqueness_score}  color="blue" />
                  <ScoreBar label="Trust"             value={result.scores.trust_score}       color="purple" />
                  <ScoreBar label="Reputation"        value={result.scores.reputation_score}  color="yellow" />
                  <ScoreBar label="AI Probability"    value={result.scores.ai_probability}    color="red" />
                </div>
              )}
              {result.items && result.items.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  {result.items.map((item: any, i: number) => (
                    <div key={i} style={{ fontSize: "0.8rem", color: item.passed ? "#4ade80" : "#f87171", marginBottom: 4 }}>
                      {item.passed ? "✓" : "✗"} {item.requirement}: required {String(item.required_value)}, got {String(item.actual_value)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
