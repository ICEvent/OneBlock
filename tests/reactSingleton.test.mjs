import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";

const root = createRequire(new URL("../package.json", import.meta.url));
const frontend = createRequire(new URL("../src/oneblock_frontend/package.json", import.meta.url));
const lock = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"));

test("React and ReactDOM are the same 18.x runtime for root and frontend workspace", () => {
  const keys = ["react", "react-dom"];
  for (const name of keys) {
    const rootPath = realpathSync(root.resolve(name));
    const frontendPath = realpathSync(frontend.resolve(name));
    assert.equal(frontendPath, rootPath, `${name} resolves to different files across workspaces`);
    assert.equal(root(`${name}/package.json`).version, "18.3.1");
    assert.equal(frontend(`${name}/package.json`).version, "18.3.1");
  }
  assert.equal(root("react").version, "18.3.1");
});

test("lockfile does not install any second React/React DOM runtime", () => {
  const packages = Object.entries(lock.packages)
    .filter(([name]) => /(?:^|\/)node_modules\/react(?:-dom)?$/.test(name));
  assert.equal(packages.length, 2, JSON.stringify(packages.map(([name, pkg]) => [name, pkg.version])));
  assert.deepEqual(packages.map(([, pkg]) => pkg.version), ["18.3.1", "18.3.1"]);
});

test("Router hooks render with the installed ReactDOM renderer", () => {
  const React = frontend("react");
  const { renderToString } = frontend("react-dom/server");
  const { MemoryRouter, Route, Routes } = frontend("react-router-dom");
  const markup = renderToString(
    React.createElement(MemoryRouter, { initialEntries: ["/verify"] },
      React.createElement(Routes, null,
        React.createElement(Route, {
          path: "/verify",
          element: React.createElement("div", null, "OneBlock Verify route"),
        })
      )
    )
  );
  assert.match(markup, /OneBlock Verify route/);
});
