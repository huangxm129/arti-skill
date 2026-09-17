import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const script = join(new URL(".", import.meta.url).pathname, "../plugins/arti-stock-research/skills/arti-stock-research/scripts/arti");
const base = "https://local.artifin.test";
let server;
let apiBase;

before(async () => {
  server = createServer(async (req, res) => {
    let body = "";
    for await (const chunk of req) body += chunk;
    const json = req.url?.includes("v1-credits")
      ? { data: { balance: "0", tier: "free", claimableTasks: 0, actions: { tasksUrl: `${base}/app/tasks`, subscriptionUrl: `${base}/app/subscription`, creditsUrl: `${base}/app/credits` } } }
      : { error: { code: "insufficient_credits", details: { requiredCredits: "5", availableCredits: "0", actions: { tasksUrl: `${base}/app/tasks`, subscriptionUrl: `${base}/app/subscription`, creditsUrl: `${base}/app/credits` } } } };
    res.writeHead(req.url?.includes("v1-scan-stock") ? 402 : 200, { "content-type": "application/json" });
    res.end(JSON.stringify(json));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  apiBase = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

async function runArti(args) {
  const home = await mkdtemp(join(tmpdir(), "arti-credits-test-"));
  const credentialFile = join(home, "credentials.json");
  await writeFile(credentialFile, '{"api_key":"sk-arti-test","channel":"codex"}', { mode: 0o600 });
  return new Promise((resolve, reject) => {
    const child = spawn("bash", [script, ...args], {
      env: { ...process.env, ARTI_API_BASE: apiBase, ARTI_CONFIG_FILE: join(home, "missing-config.json"), ARTI_CRED_FILE: credentialFile },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stdout, stderr, credentialFile }));
  });
}

test("balance 余额为零时展示任务、会员和充值链接", async () => {
  const result = await runArti(["balance"]);
  assert.equal(result.code, 0);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.match(output, /余额为 0/);
  assert.match(output, new RegExp(`${base}/app/tasks`));
  assert.match(output, new RegExp(`${base}/app/subscription`));
  assert.match(output, new RegExp(`${base}/app/credits`));
});

test("insufficient_credits 402 展示任务、会员和充值链接", async () => {
  const result = await runArti(["scan", "AAPL", "--yes"]);
  assert.equal(result.code, 2);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.match(output, new RegExp(`${base}/app/tasks`));
  assert.match(output, new RegExp(`${base}/app/subscription`));
  assert.match(output, new RegExp(`${base}/app/credits`));
});
