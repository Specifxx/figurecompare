import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const run = (msg: string, env = "production") =>
  spawnSync("bash", ["scripts/vercel-ignore-build.sh"], { env: { ...process.env, VERCEL_GIT_COMMIT_MESSAGE: msg, VERCEL_ENV: env } }).status;

test("production builds only with [deploy] in the SUBJECT", () => {
  assert.equal(run("data: daily prices 2026-10-28 [deploy]"), 1);
  assert.equal(run("Fix tiles [DEPLOY]"), 1);
  assert.equal(run("Fix tiles"), 0);
  assert.equal(run("Fix tiles\n\nexplains the [deploy] gate in the body"), 0);
});

test("previews need [preview]", () => {
  assert.equal(run("Fix tiles", "preview"), 0);
  assert.equal(run("Fix tiles [preview]", "preview"), 1);
  assert.equal(run("Fix tiles [deploy]", "preview"), 0);
});
