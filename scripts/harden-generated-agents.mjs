#!/usr/bin/env node
/**
 * DFX-generated actors may add an unconditional fetchRootKey() to "non-ic"
 * builds. A gateway must never be allowed to replace the pinned mainnet key.
 * Run after dfx generate and guard with --check in frontend CI.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const paths = [
  "src/declarations/profile/index.js",
  "src/declarations/profile_assets/index.js",
];
const check = process.argv.includes("--check");
for (const path of paths) {
  const abs = resolve(process.cwd(), path);
  let contents = readFileSync(abs, "utf8");
  const source = contents;
  contents = contents.replace(
    /  \/\/ Fetch root key for certificate validation during development\r?\n  if \(process\.env\.DFX_NETWORK !== "ic"\) \{[\s\S]*?\r?\n  \}\r?\n/g,
    "  // Mainnet keeps its SDK-pinned IC root key. Local callers bootstrap explicitly.\n",
  );
  if (contents.includes("fetchRootKey(")) {
    throw new Error(`Unsafe implicit fetchRootKey in generated actor: ${path}`);
  }
  if (contents !== source) {
    if (check) throw new Error(`Generated actor requires hardening: ${path}`);
    writeFileSync(abs, contents);
    console.log(`Hardened generated agent: ${path}`);
  }
}

const vite = readFileSync(resolve(process.cwd(), "src/oneblock_frontend/vite.config.js"), "utf8");
if (/['"]process\.env['"]\s*:\s*process\.env/.test(vite) ||
    /environment\(["']all["']/.test(vite)) {
  throw new Error("Unsafe global environment exposure in Vite config");
}
console.log("PASS: browser build cannot implicitly replace root keys or inject whole process.env");
