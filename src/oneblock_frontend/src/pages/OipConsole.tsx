import React, { useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { useOneblock } from "../components/Store";

type Tab = "identity" | "policy" | "provider" | "trust";

const toOpt = <T,>(v: T | ""): [] | [T] => (v === "" ? [] : [v as T]);
const fmt = (x: any) => JSON.stringify(x, null, 2);

export default function OipConsole() {
  const oneblock = useOneblock() as any;
  const [tab, setTab] = useState<Tab>("identity");
  const [principal, setPrincipal] = useState("oneblock:alice");
  const [policyId, setPolicyId] = useState("dao-voting");
  const [output, setOutput] = useState("ready");

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
      weights: {
        existence: 0.2,
        continuity: 0.15,
        human: 0.25,
        social: 0.15,
        economic: 0.1,
        reputation: 0.15,
      },
      decay_lambda: 0.08,
      active: true,
    }),
    [policyId]
  );

  const run = async (fn: () => Promise<any>) => {
    try {
      const res = await fn();
      setOutput(fmt(res));
    } catch (e: any) {
      setOutput(`ERROR: ${e?.message ?? "unknown"}`);
    }
  };

  return (
    <div>
      <Navbar />
      <div style={{ padding: 16, maxWidth: 1080, margin: "0 auto" }}>
        <h2>OIP Console (M3)</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {(["identity", "policy", "provider", "trust"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ fontWeight: tab === t ? 700 : 400 }}>{t}</button>
          ))}
        </div>

        {(tab === "identity" || tab === "policy") && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            <input value={principal} onChange={(e) => setPrincipal(e.target.value)} placeholder="principal" />
            <input value={policyId} onChange={(e) => setPolicyId(e.target.value)} placeholder="policy id" />
          </div>
        )}

        {tab === "identity" && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button onClick={() => run(() => oneblock.createIdentityGraph({ principal, entity_kind: { human: null } }))}>createIdentityGraph</button>
            <button onClick={() => run(() => oneblock.getScores(principal))}>getScores</button>
            <button onClick={() => run(() => oneblock.recomputeScores(principal, toOpt(policyId)))}>recomputeScores</button>
            <button onClick={() => run(() => oneblock.addFactor({ principal, category: { human: null }, factor_type: "captcha", provider: "manual", value: "pass", verified: true, confidence: 0.84, reliability: 0.82, weight_hint: 0.2, expires_at: [], metadata: [] }))}>addHumanFactor</button>
            <button onClick={() => run(() => oneblock.runDecaySweep())}>runDecaySweep(admin)</button>
          </div>
        )}

        {tab === "policy" && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button onClick={() => run(() => oneblock.createPolicy(basePolicy))}>createPolicy</button>
            <button onClick={() => run(() => oneblock.evaluatePolicy(principal, policyId))}>evaluatePolicy</button>
          </div>
        )}

        {tab === "provider" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              <input value={providerId} onChange={(e) => setProviderId(e.target.value)} placeholder="provider id" />
              <input value={principal} onChange={(e) => setPrincipal(e.target.value)} placeholder="target principal" />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <button onClick={() => run(() => oneblock.registerOipProvider({ provider_id: providerId, name: providerId, capabilities: [{ factor: null }], verification: { idempotency_only: null }, reliability: 0.9 }))}>registerProvider</button>
              <button onClick={() => run(() => oneblock.getOipProvider(providerId))}>getProvider</button>
              <button onClick={() => run(() => oneblock.listOipProviders())}>listProviders</button>
              <button onClick={() => run(() => oneblock.setProviderStatus(providerId, true))}>activateProvider</button>
              <button onClick={() => run(() => oneblock.submitProviderFactor({ provider_id: providerId, idempotency_key: `seed-${Date.now()}`, principal, category: { social: null }, factor_type: "github", value: "user:alice", confidence: 0.76, reliability: [], weight_hint: 0.15, expires_at: [], signed_payload: [] }))}>submitProviderFactor</button>
            </div>
          </div>
        )}

        {tab === "trust" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              <input value={trustTo} onChange={(e) => setTrustTo(e.target.value)} placeholder="to principal" />
              <input value={principal} onChange={(e) => setPrincipal(e.target.value)} placeholder="query inbound principal" />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <button onClick={() => run(() => oneblock.addTrustEdge(trustTo, "social", 0.8, 0.9))}>addTrustEdge</button>
              <button onClick={() => run(() => oneblock.getInboundTrust(principal))}>getInboundTrust</button>
            </div>
          </div>
        )}

        <pre style={{ marginTop: 16, background: "#111", color: "#9ef", padding: 12, borderRadius: 6, minHeight: 260 }}>{output}</pre>
      </div>
    </div>
  );
}
