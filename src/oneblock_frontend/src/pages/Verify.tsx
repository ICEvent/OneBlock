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

  const runCertifiedProof = async () => {
    setProofResult(null);
    setProofError("");
    setProofBusy(true);
    try {
      const report = await verifyProofFromClaimJson(proofClaimId, proofJson, proofSchemaJson);
      setProofResult(report);
    } catch (err) {
      setProofError(err instanceof Error ? err.message : "认证证明验证失败，请核实 Claim ID、原始声明和 ICP 连接。");
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
          <p>检查原始内容是否被修改，理解第三方声明缺少哪些可验证证据。每一步都说明已证实什么、尚未证实什么。</p>
          <span className="verify-privacy">无需登录 · 文字/文件与 Claim JSON 在本地处理 · 链上验证仅查询 Record ID、签发 Principal 与 Schema ID</span>
        </header>

        <div className="verify-layout">
          <section className="verify-panel" aria-label="Verification workbench">
            <div className="verify-tabs" role="tablist" aria-label="验证工具">
              <button type="button" role="tab" aria-selected={tab === "integrity"} className={tab === "integrity" ? "selected" : ""} onClick={() => setTab("integrity")}>内容完整性</button>
              <button type="button" role="tab" aria-selected={tab === "claim"} className={tab === "claim" ? "selected" : ""} onClick={() => setTab("claim")}>Claim 结构检查</button>
              <button type="button" role="tab" aria-selected={tab === "proof"} className={tab === "proof" ? "selected" : ""} onClick={() => setTab("proof")}>ICP 认证证明</button>
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
            ) : tab === "claim" ? (
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
            ) : (
              <div className="verify-content" role="tabpanel">
                <h2>Certified Proof Verification</h2>
                <p className="verify-muted">请提供登记 Record ID、完整 Claim JSON 和签发者的 Domain Schema JSON。浏览器本地核验格式、签发 Principal、Schema 内容与两份 ICP 认证摘要；不上传原始数据。</p>
                <div className="verify-config">
                  <strong>受信任的 Proof Registry</strong>
                  <code>{configuredRegistryId() || "未配置（不可执行链上验证）"}</code>
                  <small>Canister ID 由站点部署配置指定，不能通过表单随意切换。</small>
                </div>
                <label className="verify-field">Record ID（签发 Principal / 随机事件 ID）
                  <input disabled={proofBusy} spellCheck={false} value={proofClaimId} onChange={(e) => { setProofClaimId(e.target.value); setProofResult(null); setProofError(""); }} placeholder="issuer-principal/32或64位随机hex" />
                </label>
                <label className="verify-field">原始 Claim JSON
                  <textarea disabled={proofBusy} rows={11} spellCheck={false} value={proofJson} onChange={(e) => { setProofJson(e.target.value); setProofResult(null); setProofError(""); }} placeholder='{"protocol":"oneblock.claim","version":"1.0",...}' />
                </label>
                <label className="verify-field">原始 Domain Schema JSON（发行方登记的版本）
                  <textarea disabled={proofBusy} rows={8} spellCheck={false} value={proofSchemaJson} onChange={(e) => { setProofSchemaJson(e.target.value); setProofResult(null); setProofError(""); }} placeholder='{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:issuer:schema:1",...}' />
                </label>
                <button type="button" className="verify-primary" disabled={proofBusy || !configuredRegistryId() || !proofClaimId.trim() || !proofJson.trim() || !proofSchemaJson.trim()} onClick={() => void runCertifiedProof()}>{proofBusy ? "正在独立验证…" : "验证 ICP 认证证明"}</button>
                {!configuredRegistryId() && <p className="verify-muted" role="status">尚未部署可信登记簿 Canister，请由管理员配置 VITE_PROOF_REGISTRY_CANISTER_ID。此页面不会伪造成功结果。</p>}
                {proofError && <p className="verify-error" role="alert">验证未通过：{proofError}</p>}
                {proofResult && <div className="verify-result" role="status" aria-live="polite">
                  <h3>{proofResult.status === "active" ? "ICP 登记与 Schema 已核验 · 最近状态 Active" : "ICP 认证记录已核验 · 当前不可作为有效证明"}</h3>
                  <p className={proofResult.status === "active" ? "verify-status verified" : "verify-status revoked"}>
                    {proofResult.status === "active"
                      ? "最近有效认证窗口内，Claim/Schema 摘要与 Merkle 证明一致。"
                      : proofResult.status === "revoked"
                        ? "声明已被签发者撤销。"
                        : proofResult.status === "issuer_suspended"
                          ? "签发 Principal 已被管理者暂停。"
                          : "用户已撤回授权，或这是一条没有有效授权的旧记录。"}
                  </p>
                  <div className="verify-kv"><span>签发 Principal</span><code>{proofResult.issuerPrincipal}</code></div>
                  <div className="verify-kv"><span>Schema SHA-256</span><code>{proofResult.schemaSha256}</code></div>
                  <div className="verify-kv"><span>Schema 验证</span><strong>认证摘要与数据符合要求</strong></div>
                  <div className="verify-kv"><span>检验时间（本机）</span><strong>{new Date(proofResult.checkPerformedAt).toLocaleString()}</strong></div>
                  <div className="verify-kv"><span>Claim SHA-256</span><code>{proofResult.claimSha256}</code></div>
                  <div className="verify-kv"><span>登记状态</span><strong>{proofResult.status}</strong></div>
                  <div className="verify-kv"><span>IC 认证证明</span><strong>已通过</strong></div>
                  <div className="verify-kv"><span>机构/品牌身份</span><strong>未验证</strong></div>
                  <div className="verify-kv"><span>Subject 身份对应关系</span><strong>未验证</strong></div>
                  <div className="verify-kv"><span>业务事实真实性</span><strong>未验证</strong></div>
                  <p className="verify-disclaimer">认证仅证明指定 Principal 登记的 Claim/Schema 摘要与最近认证状态相符。登记簿对提交前的具体摘要授权进行了检查，但不能单靠该证明确认 Subject 的现实身份、机构资质或事件真实性。证书允许最多一分钟时间偏差；转账和授权等高风险操作仍需新鲜共识检查。</p>
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
              <p>此版本提供本地 SHA-256、Claim 检查，以及配置后可用的 Claim + Schema 双重 ICP 认证摘要与失效状态验证。</p>
              <p>尚未实现机构实名核验、完整 Schema 校验、用户授权与业务事实交叉印证。</p>
              <p>任何缺少证据的结论必须标记为「未验证」，不能显示为「真实」。</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Verify;
