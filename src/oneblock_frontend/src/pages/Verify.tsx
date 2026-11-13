import React, { useState } from "react";
import Navbar from "../components/Navbar";
import { compareSha256, inspectClaimJson, sha256Hex } from "../lib/verifyEvidence";
import type { ClaimInspection, DigestComparison } from "../lib/verifyEvidence";
import "../styles/Verify.css";

type VerifyTab = "integrity" | "claim";
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
  match: "摘要相同：输入内容与提供的 SHA-256 指纹匹配。",
  mismatch: "摘要不匹配：内容不同或参考摘要错误。",
  "not-provided": "已生成指纹，但没有提供参考摘要，无法作完整性对比。",
  "invalid-reference": "参考摘要格式错误：应为 64 位十六进制 SHA-256。",
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

  const runDigest = async () => {
    setDigest(null);
    setError("");
    setBusy(true);
    try {
      if (kind === "file" && !file) throw new Error("请先选择文件。");
      if (kind === "text" && !text) throw new Error("请先输入要核对的文字。");
      if (file && kind === "file" && file.size > MAX_FILE_BYTES) {
        throw new Error("原型暂时只支持不超过 20 MB 的文件。");
      }
      const bytes = kind === "file" ? new Uint8Array(await file!.arrayBuffer()) : text;
      const sha256 = await sha256Hex(bytes);
      setDigest({ sha256, comparison: compareSha256(sha256, expected), source: kind === "file" ? file!.name : "UTF-8 text" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "无法读取或计算摘要，请使用 HTTPS 浏览器重试。");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="verify-page">
      <Navbar />
      <main className="verify-shell">
        <header className="verify-hero">
          <span className="verify-eyebrow">ONEBLOCK · VERIFICATION TOOLS</span>
          <h1>Verify information, not assumptions.</h1>
          <p>检查原始内容是否被修改，理解第三方声明缺少哪些可验证证据。每一步都说明已证实什么、尚未证实什么。</p>
          <span className="verify-privacy">本地浏览器检查 · 无需登录 · 不上传文字或文件</span>
        </header>

        <div className="verify-layout">
          <section className="verify-panel" aria-label="Verification workbench">
            <div className="verify-tabs" role="tablist" aria-label="验证工具">
              <button type="button" role="tab" aria-selected={tab === "integrity"} className={tab === "integrity" ? "selected" : ""} onClick={() => setTab("integrity")}>内容完整性</button>
              <button type="button" role="tab" aria-selected={tab === "claim"} className={tab === "claim" ? "selected" : ""} onClick={() => setTab("claim")}>Claim 结构检查</button>
            </div>

            {tab === "integrity" ? (
              <div className="verify-content" role="tabpanel">
                <h2>Evidence Fingerprint</h2>
                <p className="verify-muted">使用浏览器 SHA-256 算法计算原始内容的指纹，并与发布方提供的摘要比较。</p>
                <div className="verify-choice" aria-label="Source kind">
                  <button type="button" className={kind === "text" ? "active" : ""} onClick={() => { setKind("text"); setDigest(null); setError(""); }}>文字内容</button>
                  <button type="button" className={kind === "file" ? "active" : ""} onClick={() => { setKind("file"); setDigest(null); setError(""); }}>本地文件</button>
                </div>
                {kind === "text" ? (
                  <label className="verify-field">待检查文字
                    <textarea value={text} onChange={(e) => { setText(e.target.value); setDigest(null); }} rows={6} placeholder="粘贴需要核对的原始文字。空格、换行和标点都影响指纹。" />
                  </label>
                ) : (
                  <label className="verify-field">待检查文件（最多 20 MB）
                    <input type="file" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setDigest(null); }} />
                  </label>
                )}
                <label className="verify-field">参考 SHA-256（可选）
                  <input value={expected} spellCheck={false} onChange={(e) => { setExpected(e.target.value); setDigest(null); }} placeholder="64 位十六进制或 sha256: 前缀" />
                </label>
                <button type="button" className="verify-primary" onClick={() => void runDigest()} disabled={busy}>{busy ? "计算中…" : "检查完整性"}</button>
                {error && <p className="verify-error" role="alert">{error}</p>}
                {digest && <div className="verify-result" role="status">
                  <h3>检查结果</h3>
                  <p className="verify-status">{comparisons[digest.comparison]}</p>
                  <div className="verify-kv"><span>数据来源</span><strong>{digest.source}</strong></div>
                  <div className="verify-kv"><span>SHA-256</span><code>{digest.sha256}</code></div>
                  <p className="verify-disclaimer">即使摘要匹配，也只能证明这份内容与参考指纹相同，不能证明发布者身份、内容真实性或首次发布的时间。</p>
                </div>}
              </div>
            ) : (
              <div className="verify-content" role="tabpanel">
                <h2>Claim Inspector</h2>
                <p className="verify-muted">检查 OneBlock Claim v1 的基础字段和证据引用。这里只做初步结构检查，尚不验证签名或 ICP 证书。</p>
                <label className="verify-field">Claim JSON
                  <textarea rows={12} spellCheck={false} value={claimRaw} onChange={(e) => { setClaimRaw(e.target.value); setInspection(null); }} placeholder="粘贴第三方提供的 Claim JSON…" />
                </label>
                <div className="verify-actions">
                  <button type="button" className="verify-primary" onClick={() => setInspection(inspectClaimJson(claimRaw))}>检查声明</button>
                  <button type="button" className="verify-secondary" onClick={() => { setClaimRaw(DEMO_CLAIM); setInspection(null); }}>加载虚构示例</button>
                </div>
                {inspection && <div className="verify-result" role="status">
                  <h3>{inspection.shapeReady ? "基础字段齐全（非真伪验证）" : "发现字段或证据缺口"}</h3>
                  <div className="verify-kv"><span>Issuer</span><strong>{inspection.issuer}</strong></div>
                  <div className="verify-kv"><span>Subject</span><strong>{inspection.subject}</strong></div>
                  <div className="verify-kv"><span>Predicate</span><strong>{inspection.predicate}</strong></div>
                  <div className="verify-kv"><span>Schema</span><strong>{inspection.schema}</strong></div>
                  <div className="verify-kv"><span>证据引用数量</span><strong>{inspection.evidenceCount}</strong></div>
                  {inspection.problems.length > 0 && <><h4>发现的问题</h4><ul>{inspection.problems.map((p, i) => <li key={i}>{p}</li>)}</ul></>}
                  <h4>尚未验证</h4>
                  <ul>{inspection.unanswered.map((p, i) => <li key={i}>{p}</li>)}</ul>
                  <p className="verify-disclaimer">字段检查不是 JSON Schema 全量验证；也没有检测重复 JSON 键。现阶段不会宣称任何 Claim 已被 OneBlock 证明。</p>
                </div>}
              </div>
            )}
          </section>

          <aside className="verify-aside" aria-label="Verification limits">
            <div className="verify-info-card">
              <h2>三类不同的证据</h2>
              <div><strong>1. 来源</strong><p>谁签发了声明？签名、公钥与权限能否核实？</p></div>
              <div><strong>2. 完整性</strong><p>原始字节是否与摘要匹配？链上登记状态是否有效？</p></div>
              <div><strong>3. 真实性</strong><p>证据是否真的支持该事实？是否存在独立的反证？</p></div>
            </div>
            <div className="verify-info-card">
              <h2>当前工具的边界</h2>
              <p>此版本只完成本地 SHA-256 比对和声明基础结构检查。</p>
              <p>下一阶段接入 Issuer Registry、完整 Schema 验证、密码学签名验证、ICP Certified Data 与撤销状态。</p>
              <p>任何缺少证据的结论必须标记为「未验证」，不能显示为「真实」。</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Verify;
