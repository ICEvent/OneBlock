/**
 * Reject duplicate JSON object keys before computing a cryptographic claim
 * commitment. Native JSON.parse silently retains the last repeated key.
 *
 * This parser first delegates grammar to JSON.parse and then scans keys,
 * comparing their decoded values (so "a" and "\\u0061" collide).
 * It does NOT validate OVDP schemas, signatures or facts.
 */
const MAX_BYTES = 256 * 1024;
const MAX_DEPTH = 64;
const num = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+\-]?\d+)?/y;

export function parseStrictClaimJson(raw) {
  if (typeof raw !== "string" || new TextEncoder().encode(raw).length > MAX_BYTES) {
    throw new Error("Claim JSON exceeds 256 KiB or is not text");
  }
  const data = JSON.parse(raw);
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Claim must be a JSON object");
  }
  let i = 0;
  const ws = () => {
    while (i < raw.length && /[ \t\n\r]/.test(raw[i])) i++;
  };
  const consume = (c) => {
    ws();
    if (raw[i++] !== c) throw new Error("Unexpected JSON token");
  };
  const str = () => {
    ws();
    if (raw[i] !== '"') throw new Error("Expected quoted JSON key");
    const start = i++;
    while (i < raw.length) {
      const c = raw[i++];
      if (c === '"') return JSON.parse(raw.slice(start, i));
      if (c === "\\") {
        const esc = raw[i++];
        if (esc === "u") i += 4;
      }
    }
    throw new Error("Unterminated JSON string");
  };
  const walk = (depth) => {
    if (depth > MAX_DEPTH) throw new Error("JSON nesting exceeds safe limit");
    ws();
    if (raw[i] === '{') {
      consume('{');
      const keys = new Set();
      ws();
      if (raw[i] === '}') { i++; return; }
      for (;;) {
        const key = str();
        if (keys.has(key)) throw new Error("Duplicate JSON object key: " + key);
        keys.add(key);
        consume(':');
        walk(depth + 1);
        ws();
        if (raw[i] === '}') { i++; return; }
        consume(',');
      }
    }
    if (raw[i] === '[') {
      consume('[');
      ws();
      if (raw[i] === ']') { i++; return; }
      for (;;) {
        walk(depth + 1);
        ws();
        if (raw[i] === ']') { i++; return; }
        consume(',');
      }
    }
    if (raw[i] === '"') { str(); return; }
    for (const literal of ["true", "false", "null"]) {
      if (raw.startsWith(literal, i)) { i += literal.length; return; }
    }
    num.lastIndex = i;
    const m = num.exec(raw);
    if (m) { i = num.lastIndex; return; }
    throw new Error("Unexpected JSON value");
  };
  walk(0);
  ws();
  if (i !== raw.length) throw new Error("Unexpected trailing input");
  return data;
}
