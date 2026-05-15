import React, { useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { useOneblock } from "../components/Store";
import "../styles/OIP.css";

type Tab = "identity" | "policy" | "provider" | "trust";

const TAB_META: Record<Tab, { label: string; guide: string }> = {
  identity: {
    label: "Identity",
    guide:
      "Manage on-chain identity graphs and factors. Create an identity graph for a principal, then add trust factors (e.g. captcha, wallet) to build up their scores.",
  },
  policy: {
    label: "Policy",
    guide:
      "Define and evaluate access-control policies. A policy sets minimum score thresholds (human, trust, reputation) that an identity must reach to pass.",
  },
  provider: {
    label: "Provider",
    guide:
      "Register trusted third-party data providers (oracles). Providers submit signed factors on behalf of users — for example, a GitHub oracle attesting a social account.",
  },
  trust: {
    label: "Trust",
    guide:
      "Model peer-to-peer trust edges between principals. Adding a trust edge increases the reputation score of the target identity.",
  },
};

const toOpt = <T,>(v: T | ""): [] | [T] => (v === "" ? [] : [v as T]);
const fmt = (x: any) => JSON.stringify(x, (_, v) => (typeof v === "bigint" ? v.toString() : v), 2);

export default function OipConsole() {
  const oneblock = useOneblock() as any;
  const [tab, setTab] = useState<Tab>("identity");
  const [principal, setPrincipal] = useState("oneblock:alice");
  const [policyId, setPolicyId] = useState("dao-voting");
  const [output, setOutput] = useState("← Select an action to see the result here.");
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const [providerId, setProviderId] = useState("github-oracle");
  const [trustTo, setTrustTo] = useState("oneblock:bob");

  const basePolicy = useMemo(
    () => ({
      policy_id: policyId,
      name: policyId,
      description: "OIP M3 policy",
      requirements: {
        min_human_score: [0.6],
        min_uniqueness_score: [],
        min_trust_score: [0.55],
        min_reputation_score: [],
        min_wallet_age_days: [],
      },
      weights: { existence: 0.2, continuity: 0.15, human: 0.25, social: 0.15, economic: 0.1, reputation: 0.15 },
      decay_lambda: 0.08,
      active: true,
    }),
    [policyId]
  );

  const run = async (fn: () => Promise<any>) => {
    setLoading(true);
    setIsError(false);
    setOutput("Running…");
    try {
      const res = await fn();
      setOutput(fmt(res));
    } catch (e: any) {
      setIsError(true);
      setOutput(`ERROR: ${e?.message ?? "unknown"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="oip-page">
        <div className="oip-hero">
          <h2>OIP Console</h2>
          <p>
            Developer console for the OneBlock Open Identity Protocol (OIP M3). Manage identity
            graphs, policies, trust edges and oracle providers on the IC mainnet.
          </p>
        </div>

        <div className="oip-tabs">
          {(Object.keys(TAB_META) as Tab[]).map((t) => (
            <button
              key={t}
              className={`oip-tab${tab === t ? " active" : ""}`}
              onClick={() => setTab(t)}
            >
              {TAB_META[t].label}
            </button>
          ))}
        </div>

        <div className="oip-guide">
          <span className="oip-guide-icon">ℹ</span>
          <span>{TAB_META[tab].guide}</span>
        </div>

        {/* Shared inputs: identity & policy tabs */}
        {(tab === "identity" || tab === "policy") && (
          <div className="oip-card">
            <div className="oip-field-row">
              <div className="oip-field">
                <label>Principal ID</label>
                <div className="oip-hint">The identity to operate on</div>
                <input value={principal} onChange={(e) => setPrincipal(e.target.value)} placeholder="e.g. oneblock:alice" />
              </div>
              <div className="oip-field">
                <label>Policy ID</label>
                <div className="oip-hint">Used for recompute / evaluate</div>
                <input value={policyId} onChange={(e) => setPolicyId(e.target.value)} placeholder="e.g. dao-voting" />
              </div>
            </div>

            {tab === "identity" && (
              <div className="oip-btn-group">
                <button className="oip-btn" disabled={loading} onClick={() => run(() => oneblock.createIdentityGraph({ principal, entity_kind: { human: null } }))}>
                  Create Identity Graph
                </button>
                <button className="oip-btn" disabled={loading} onClick={() => run(() => oneblock.getScores(principal))}>
                  Get Scores
                </button>
                <button className="oip-btn" disabled={loading} onClick={() => run(() => oneblock.recomputeScores(principal, toOpt(policyId)))}>
                  Recompute Scores
                </button>
                <button className="oip-btn" disabled={loading} onClick={() => run(() => oneblock.addFactor({ principal, category: { human: null }, factor_type: "captcha", provider: "manual", value: "pass", verified: true, confidence: 0.84, reliability: 0.82, weight_hint: 0.2, expires_at: [], metadata: [] }))}>
                  Add Human Factor
                </button>
                <button className="oip-btn" style={{ borderColor: "#7f1d1d", color: "#f87171" }} disabled={loading} onClick={() => run(() => oneblock.runDecaySweep())}>
                  Run Decay Sweep (admin)
                </button>
              </div>
            )}

            {tab === "policy" && (
              <div className="oip-btn-group">
                <button className="oip-btn oip-btn-primary" disabled={loading} onClick={() => run(() => oneblock.createPolicy(basePolicy))}>
                  Create Policy
                </button>
                <button className="oip-btn" disabled={loading} onClick={() => run(() => oneblock.evaluatePolicy(principal, policyId))}>
                  Evaluate Policy
                </button>
              </div>
            )}
          </div>
        )}

        {/* Provider tab */}
        {tab === "provider" && (
          <div className="oip-card">
            <div className="oip-field-row">
              <div className="oip-field">
                <label>Provider ID</label>
                <div className="oip-hint">Unique identifier for the oracle</div>
                <input value={providerId} onChange={(e) => setProviderId(e.target.value)} placeholder="e.g. github-oracle" />
              </div>
              <div className="oip-field">
                <label>Target Principal</label>
                <div className="oip-hint">Submit a factor for this identity</div>
                <input value={principal} onChange={(e) => setPrincipal(e.target.value)} placeholder="e.g. oneblock:alice" />
              </div>
            </div>
            <div className="oip-btn-group">
              <button className="oip-btn oip-btn-primary" disabled={loading} onClick={() => run(() => oneblock.registerOipProvider({ provider_id: providerId, name: providerId, capabilities: [{ factor: null }], verification: { idempotency_only: null }, reliability: 0.9 }))}>
                Register Provider
              </button>
              <button className="oip-btn" disabled={loading} onClick={() => run(() => oneblock.getOipProvider(providerId))}>
                Get Provider
              </button>
              <button className="oip-btn" disabled={loading} onClick={() => run(() => oneblock.listOipProviders())}>
                List All Providers
              </button>
              <button className="oip-btn" disabled={loading} onClick={() => run(() => oneblock.setProviderStatus(providerId, true))}>
                Activate Provider
              </button>
              <button className="oip-btn" disabled={loading} onClick={() => run(() => oneblock.submitProviderFactor({ provider_id: providerId, idempotency_key: `seed-${Date.now()}`, principal, category: { social: null }, factor_type: "github", value: "user:alice", confidence: 0.76, reliability: [], weight_hint: 0.15, expires_at: [], signed_payload: [] }))}>
                Submit Provider Factor
              </button>
            </div>
          </div>
        )}

        {/* Trust tab */}
        {tab === "trust" && (
          <div className="oip-card">
            <div className="oip-field-row">
              <div className="oip-field">
                <label>Trust Target</label>
                <div className="oip-hint">Principal you want to vouch for</div>
                <input value={trustTo} onChange={(e) => setTrustTo(e.target.value)} placeholder="e.g. oneblock:bob" />
              </div>
              <div className="oip-field">
                <label>Query Principal</label>
                <div className="oip-hint">Look up inbound trust for this identity</div>
                <input value={principal} onChange={(e) => setPrincipal(e.target.value)} placeholder="e.g. oneblock:alice" />
              </div>
            </div>
            <div className="oip-btn-group">
              <button className="oip-btn oip-btn-primary" disabled={loading} onClick={() => run(() => oneblock.addTrustEdge(trustTo, "social", 0.8, 0.9))}>
                Add Trust Edge → {trustTo || "…"}
              </button>
              <button className="oip-btn" disabled={loading} onClick={() => run(() => oneblock.getInboundTrust(principal))}>
                Get Inbound Trust
              </button>
            </div>
          </div>
        )}

        <div className="oip-output-label">Output</div>
        <pre className={`oip-output${isError ? " is-error" : ""}`}>{output}</pre>
      </div>
    </div>
  );
}
