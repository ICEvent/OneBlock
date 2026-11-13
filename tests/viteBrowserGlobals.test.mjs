import test from "node:test";
import assert from "node:assert/strict";
import { runInNewContext } from "node:vm";
import config from "../src/oneblock_frontend/vite.config.js";

// Shared Vite 8 define table applies to dev and build. Ensure ICP libraries
// which read a legacy free global identifier get the browser global object.
test("Vite maps legacy global to globalThis without exposing Node env", () => {
  assert.equal(config.define.global, "globalThis");
  assert.notEqual(config.define.global, "{}");
  assert.equal(Object.hasOwn(config.define, "process.env"), false);
  assert.deepEqual(config.resolve.dedupe, ["react", "react-dom"]);
});

test("the replacement evaluates in a browser-like environment without Node global", () => {
  const context = Object.create(null);
  assert.equal(runInNewContext('typeof global', context), "undefined");
  assert.equal(runInNewContext('globalThis === globalThis', context), true);
  assert.equal(runInNewContext(config.define.global + ' === globalThis', context), true);
});
