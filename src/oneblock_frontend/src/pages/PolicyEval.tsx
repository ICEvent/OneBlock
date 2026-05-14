import React, { useState } from "react";
import { evaluatePolicy, recomputeScores } from "../api/oip";

export default function PolicyEval() {
  const [principal, setPrincipal] = useState("oneblock:alice");
  const [policyId, setPolicyId] = useState("dao-voting");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const onRun = async () => {
    setError("");
    try {
      await recomputeScores(principal, policyId);
      const res: any = await evaluatePolicy(principal, policyId);
      if ("ok" in res) setResult(res.ok);
      else setError(res.err || "evaluation failed");
    } catch (e: any) {
      setError(e?.message || "evaluation failed");
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Policy Evaluation</h2>
      <input value={principal} onChange={(e) => setPrincipal(e.target.value)} />
      <input value={policyId} onChange={(e) => setPolicyId(e.target.value)} />
      <button onClick={onRun}>Evaluate</button>
      {error ? <p>{error}</p> : null}
      {result ? <pre>{JSON.stringify(result, null, 2)}</pre> : null}
    </div>
  );
}
