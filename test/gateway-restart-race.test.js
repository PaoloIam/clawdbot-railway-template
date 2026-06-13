import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const src = fs.readFileSync(new URL("../src/server.js", import.meta.url), "utf8");

test("restart waits for the old gateway to exit before respawning", () => {
  assert.match(src, /function waitForProcExit\(/);
  assert.match(src, /async function waitForPortFree\(/);
  // Old fragile behaviour was a flat sleep(750) before respawn; restart now
  // waits for exit + port free and escalates to SIGKILL.
  assert.match(src, /SIGKILL/);
});

test("restartGateway waits for the port to be free", () => {
  const idx = src.indexOf("async function restartGateway()");
  assert.ok(idx >= 0, "restartGateway present");
  const body = src.slice(idx, idx + 800);
  assert.match(body, /waitForProcExit/);
  assert.match(body, /waitForPortFree/);
});

test("startGateway guards against spawning while the port is still in use", () => {
  const idx = src.indexOf("async function startGateway()");
  assert.ok(idx >= 0, "startGateway present");
  const body = src.slice(idx, idx + 800);
  assert.match(body, /waitForPortFree/);
});
