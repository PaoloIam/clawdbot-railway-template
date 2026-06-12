import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("wrapper syncs CLAUDE_CODE_OAUTH_TOKEN into OpenClaw credential store at boot", () => {
  const src = fs.readFileSync(new URL("../src/server.js", import.meta.url), "utf8");
  assert.match(src, /function syncClaudeSubscriptionToken\(/);
  assert.match(src, /CLAUDE_CODE_OAUTH_TOKEN/);
  assert.match(src, /"paste-token"/);
});

test("debug console exposes models auth paste-token", () => {
  const src = fs.readFileSync(new URL("../src/server.js", import.meta.url), "utf8");
  assert.match(src, /openclaw\.models\.auth\.paste-token/);
});
