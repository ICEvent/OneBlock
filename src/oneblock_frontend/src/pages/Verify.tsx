import React, { useState } from "react";
import Navbar from "../components/Navbar";
import { compareSha256, inspectClaimJson, sha256Hex } from "../lib/verifyEvidence";
import type { ClaimInspection, DigestComparison } from "../lib/verifyEvidence";
import { configuredRegistryId, verifyProofFromClaimJson } from "../lib/certifiedClaimService";
import type { CertifiedProofReport } from "../lib/certifiedClaimService";
import "../styles/Verify.css";

type VerifyTab = "integrity" | "claim" | "proof";
type SourceKind = "text" | "file";
type DigestResult = { sha256: string; comparison: DigestComparison; source: string };
const MAX_FILE_BYTES = 20 * 1024 * 1024;

const DEMO_CLAIM = JSON.stringify({
  protocol: "oneblock.claim",
  version: "1.0",
  issuer_id: "hortsun",
  subject: { namespace: "oneblock:profile", id: "example-person", kind: "person" },
  predicate: "hortsun:service.completed",
  schema_id: "urn:oneblock:schema:hortsun.service.completed:1.0.0",
  claim_data: { service: "hedge_trimming", status: "completed" },
  evidence: [{ evidence_id: "job-receipt-example", content_sha256: "0".repeat(64), availability: "authorized" }],
  event_at: "2026-11-12T18:00:00Z",
  issued_at: "2026-11-12T18:01:00Z",
  source_event_id: "job-example-1024",
  visibility: "restricted",
}, null, 2);

const comparisons: Record<DigestComparison, string> = {
  match: "Digests match: the input matches the provided SHA-256 fingerprint.",
  mismatch: "Digests do not match: the content differs or the reference digest is incorrect.",
  "not-provided": "Fingerprint generated. Provide a reference digest to compare integrity.",
  "invalid-reference": "Invalid reference digest: enter a 64-character hexadecimal SHA-256 value.",
};

const Verify = () => {
  const [tab, setTab] = useState<VerifyTab>("integrity");
  const [kind, setKind] = useState<SourceKind>("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [expected, setExpected] = useState("");
  const [digest, setDigest] = useState<DigestResult | null>(null);
  const [claimRaw, setClaimRaw] = useState("");
  const [inspection, setInspection] = useState<ClaimInspection | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [proofClaimId, setProofClaimId] = useState("");
  const [proofJson, setProofJson] = useState("");
  const [proofSchemaJson, setProofSchemaJson] = useState("");
  const [proofResult, setProofResult] = useState<CertifiedProofReport | null>(null);
  const [proofError, setProofError] = useState("");
  const [proofBusy, setProofBusy] = useState(false);

  const runDigest = async () => {
    setDigest(null);
    setError("");
    setBusy(true);
    try {
      if (kind === "file" && !file) throw new Error("Please select a file first.");
      if (kind === "text" && !text) throw new Error("Please enter the text to check.");
      if (file && kind === "file" && file.size > MAX_FILE_BYTES) {
        throw new Error("This prototype supports files up to 20 MB.");
      }
      const bytes = kind === "file" ? new Uint8Array(await file!.arrayBuffer()) : text;
      const sha256 = await sha256Hex(bytes);
      setDigest({ sha256, comparison: compareSha256(sha256, expected), source: kind === "file" ? file!.name : "UTF-8 text" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to read or hash the content. Please retry in a browser over HTTPS.");
    } finally {
      setBusy(false);
    }
  };

  const runCertifiedProof = async () => {
    setProofResult(null);
    setProofError("");
    setProofBusy(true);
    try {
      const report = await verifyProofFromClaimJson(proofClaimId, proofJson, proofSchemaJson);
      setProofResult(report);
    } catch (err) {
      setProofError(err instanceof Error ? err.message : "Proof verification failed. Check the Claim ID, original claim, and ICP connection.");
    } finally {
      setProofBusy(false);
    }
  };

  return (
    <div className="verify-page">
      <Navbar />
      <main className="verify-shell">
        <header className="verify-hero">
          <span className="verify-eyebrow">ONEBLOCK · VERIFICATION TOOLS</span>
          <h1>Verify information, not assumptions.</h1>
          <p>Check whether original content has changed and identify missing evidence in third-party claims. Each step explains what has and has not been verified.</p>
          <span className="verify-privacy">No sign-in required · Text, files, and Claim JSON are processed locally · On-chain checks query only the Record ID, issuer Principal, and Schema ID</span>
        </header>

        <div className="verify-layout">
          <section className="verify-panel" aria-label="Verification workbench">
            <div className="verify-tabs" role="tablist" aria-label="Verification tools">
              <button type="button" role="tab" aria-selected={tab === "integrity"} className={tab === "integrity" ? "selected" : ""} onClick={() => setTab("integrity")}>Content integrity</button>
              <button type="button" role="tab" aria-selected={tab === "claim"} className={tab === "claim" ? "selected" : ""} onClick={() => setTab("claim")}>Claim structure</button>
              <button type="button" role="tab" aria-selected={tab === "proof"} className={tab === "proof" ? "selected" : ""} onClick={() => setTab("proof")}>ICP certified proof</button>
            </div>

            {tab === "integrity" ? (
              <div className="verify-content" role="tabpanel">
                <h2>Evidence Fingerprint</h2>
                <p className="verify-muted">Calculate a fingerprint of the original content using SHA-256 in your browser and compare it with the publisher's digest.</p>
                <div className="verify-choice" aria-label="Source kind">
                  <button type="button" className={kind === "text" ? "active" : ""} onClick={() => { setKind("text"); setDigest(null); setError(""); }}>Text</button>
                  <button type="button" className={kind === "file" ? "active" : ""} onClick={() => { setKind("file"); setDigest(null); setError(""); }}>Local file</button>
                </div>
                {kind === "text" ? (
                  <label className="verify-field">Text to check
                    <textarea value={text} onChange={(e) => { setText(e.target.value); setDigest(null); }} rows={6} placeholder="Paste the original text. Spaces, line breaks, and punctuation affect the fingerprint." />
                  </label>
                ) : (
                  <label className="verify-field">File to check (up to 20 MB)
                    <input type="file" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setDigest(null); }} />
                  </label>
                )}
                <label className="verify-field">Reference SHA-256 (optional)
                  <input value={expected} spellCheck={false} onChange={(e) => { setExpected(e.target.value); setDigest(null); }} placeholder="64 hexadecimal characters, optionally prefixed with sha256:" />
                </label>
                <button type="button" className="verify-primary" onClick={() => void runDigest()} disabled={busy}>{busy ? "Calculating…" : "Check integrity"}</button>
                {error && <p className="verify-error" role="alert">{error}</p>}
                {digest && <div className="verify-result" role="status">
                  <h3>Check results</h3>
                  <p className="verify-status">{comparisons[digest.comparison]}</p>
                  <div className="verify-kv"><span>Source</span><strong>{digest.source}</strong></div>
                  <div className="verify-kv"><span>SHA-256</span><code>{digest.sha256}</code></div>
                  <p className="verify-disclaimer">A matching digest only confirms that this content matches the reference fingerprint. It does not verify the publisher's identity, factual accuracy, or original publication time.</p>
                </div>}
              </div>
            ) : tab === "claim" ? (
              <div className="verify-content" role="tabpanel">
                <h2>Claim Inspector</h2>
                <p className="verify-muted">Inspect the basic fields and evidence references of a OneBlock Claim v1. This is a preliminary structure check; it does not verify signatures or ICP certificates.</p>
                <label className="verify-field">Claim JSON
                  <textarea rows={12} spellCheck={false} value={claimRaw} onChange={(e) => { setClaimRaw(e.target.value); setInspection(null); }} placeholder="Paste the third-party Claim JSON…" />
                </label>
                <div className="verify-actions">
                  <button type="button" className="verify-primary" onClick={() => setInspection(inspectClaimJson(claimRaw))}>Inspect claim</button>
                  <button type="button" className="verify-secondary" onClick={() => { setClaimRaw(DEMO_CLAIM); setInspection(null); }}>Load fictional example</button>
                </div>
                {inspection && <div className="verify-result" role="status">
                  <h3>{inspection.shapeReady ? "Basic fields complete (authenticity not verified)" : "Missing fields or evidence found"}</h3>
                  <div className="verify-kv"><span>Issuer</span><strong>{inspection.issuer}</strong></div>
                  <div className="verify-kv"><span>Subject</span><strong>{inspection.subject}</strong></div>
                  <div className="verify-kv"><span>Predicate</span><strong>{inspection.predicate}</strong></div>
                  <div className="verify-kv"><span>Schema</span><strong>{inspection.schema}</strong></div>
                  <div className="verify-kv"><span>Evidence references</span><strong>{inspection.evidenceCount}</strong></div>
                  {inspection.problems.length > 0 && <><h4>Issues found</h4><ul>{inspection.problems.map((p, i) => <li key={i}>{p}</li>)}</ul></>}
                  <h4>Not yet verified</h4>
                  <ul>{inspection.unanswered.map((p, i) => <li key={i}>{p}</li>)}</ul>
                  <p className="verify-disclaimer">Field inspection is not full JSON Schema validation and does not detect duplicate JSON keys. This check does not establish that a Claim has been proven by OneBlock.</p>
                </div>}
              </div>
            ) : (
              <div className="verify-content" role="tabpanel">
                <h2>Certified Proof Verification</h2>
                <p className="verify-muted">Provide the registered Record ID, full Claim JSON, and issuer's Domain Schema JSON. Your browser checks the format, issuer Principal, schema content, and both ICP-certified digests locally. Original data is not uploaded.</p>
                <div className="verify-config">
                  <strong>Trusted Proof Registry</strong>
                  <code>{configuredRegistryId() || "Not configured (on-chain verification unavailable)"}</code>
                  <small>The Canister ID is set by the site deployment configuration and cannot be changed through this form.</small>
                </div>
                <label className="verify-field">Record ID (issuer Principal / random event ID)
                  <input disabled={proofBusy} spellCheck={false} value={proofClaimId} onChange={(e) => { setProofClaimId(e.target.value); setProofResult(null); setProofError(""); }} placeholder="issuer-principal/32-or-64-character-random-hex" />
                </label>
                <label className="verify-field">Original Claim JSON
                  <textarea disabled={proofBusy} rows={11} spellCheck={false} value={proofJson} onChange={(e) => { setProofJson(e.target.value); setProofResult(null); setProofError(""); }} placeholder='{"protocol":"oneblock.claim","version":"1.0",...}' />
                </label>
                <label className="verify-field">Original Domain Schema JSON (issuer's registered version)
                  <textarea disabled={proofBusy} rows={8} spellCheck={false} value={proofSchemaJson} onChange={(e) => { setProofSchemaJson(e.target.value); setProofResult(null); setProofError(""); }} placeholder='{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:issuer:schema:1",...}' />
                </label>
                <button type="button" className="verify-primary" disabled={proofBusy || !configuredRegistryId() || !proofClaimId.trim() || !proofJson.trim() || !proofSchemaJson.trim()} onClick={() => void runCertifiedProof()}>{proofBusy ? "Verifying independently…" : "Verify ICP certified proof"}</button>
                {!configuredRegistryId() && <p className="verify-muted" role="status">No trusted registry canister is configured. Ask the administrator to set VITE_PROOF_REGISTRY_CANISTER_ID. Verification is unavailable until configured.</p>}
                {proofError && <p className="verify-error" role="alert">Verification failed: {proofError}</p>}
                {proofResult && <div className="verify-result" role="status" aria-live="polite">
                  <h3>{proofResult.status === "active" ? "ICP registration and schema verified · Recent status: Active" : "ICP certified record verified · Currently invalid as proof"}</h3>
                  <p className={proofResult.status === "active" ? "verify-status verified" : "verify-status revoked"}>
                    {proofResult.status === "active"
                      ? "Claim and schema digests match the Merkle proofs within the recent valid certification window."
                      : proofResult.status === "revoked"
                        ? "The issuer has revoked this claim."
                        : proofResult.status === "issuer_suspended"
                          ? "The administrator has suspended the issuer Principal."
                          : "The user has withdrawn consent, or this is a legacy record without valid consent."}
                  </p>
                  <div className="verify-kv"><span>Issuer Principal</span><code>{proofResult.issuerPrincipal}</code></div>
                  <div className="verify-kv"><span>Schema SHA-256</span><code>{proofResult.schemaSha256}</code></div>
                  <div className="verify-kv"><span>Schema verification</span><strong>Certified digest and data meet requirements</strong></div>
                  <div className="verify-kv"><span>Check time (local device)</span><strong>{new Date(proofResult.checkPerformedAt).toLocaleString()}</strong></div>
                  <div className="verify-kv"><span>Claim SHA-256</span><code>{proofResult.claimSha256}</code></div>
                  <div className="verify-kv"><span>Registration status</span><strong>{proofResult.status}</strong></div>
                  <div className="verify-kv"><span>IC certified proof</span><strong>Passed</strong></div>
                  <div className="verify-kv"><span>Organization / brand identity</span><strong>Not verified</strong></div>
                  <div className="verify-kv"><span>Subject identity binding</span><strong>Not verified</strong></div>
                  <div className="verify-kv"><span>Factual accuracy</span><strong>Not verified</strong></div>
                  <p className="verify-disclaimer">Certification only confirms that the Claim and schema digests registered by the specified Principal match the recent certified state. The registry checks consent for the exact digest before submission, but this proof alone does not establish the subject's real-world identity, organizational credentials, or factual accuracy. Certificates allow up to one minute of clock skew; high-risk actions such as transfers and authorizations still require a fresh consensus check.</p>
                </div>}
              </div>
            )}
          </section>

          <aside className="verify-aside" aria-label="Verification limits">
            <div className="verify-info-card">
              <h2>Three types of evidence</h2>
              <div><strong>1. Source</strong><p>Who issued the claim? Can their signature, public key, and authority be verified?</p></div>
              <div><strong>2. Integrity</strong><p>Do the original bytes match the digest? Is the on-chain registration valid?</p></div>
              <div><strong>3. Factual accuracy</strong><p>Does the evidence support the claim? Is there independent evidence against it?</p></div>
            </div>
            <div className="verify-info-card">
              <h2>Current tool limits</h2>
              <p>This version provides local SHA-256 hashing, Claim inspection, and, when configured, ICP-certified Claim and schema digest verification with invalidation status checks.</p>
              <p>Organization identity checks, full schema validation, and cross-checking user consent against real-world facts are not yet implemented.</p>
              <p>Conclusions without supporting evidence must be labeled “Not verified” and cannot be presented as fact.</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Verify;
