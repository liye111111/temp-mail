import { spawnSync } from "node:child_process";
import { loadEnv, requireEnv } from "./env.mjs";

const env = loadEnv();
requireEnv(env, ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_TOKEN"]);
const childEnv = { ...process.env, ...env };
const action = process.argv[2];
const confirmed = process.argv.includes("--confirm") || env.DEPLOY_CONFIRM === "true";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: "inherit", env: childEnv, ...options });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function runWithInput(command, args, input) {
  const result = spawnSync(command, args, { input: `${input}\n`, stdio: ["pipe", "inherit", "inherit"], env: childEnv });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function capture(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8", env: childEnv });
  return { ok: result.status === 0, output: `${result.stdout ?? ""}${result.stderr ?? ""}` };
}

function render() { run("node", ["scripts/render-config.mjs"]); }
function requireConfirmation() {
  if (!confirmed) {
    console.error("Deployment blocked: set DEPLOY_CONFIRM=true or run npm run deploy:force after reviewing target resources.");
    process.exit(2);
  }
}

async function cfRequest(path, init = {}) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
      "content-type": "application/json",
      ...init.headers,
    },
  });
  const payload = await response.json();
  if (!response.ok || payload.success === false) {
    const messages = payload.errors?.map((error) => `${error.code}: ${error.message}`).join("; ") || response.statusText;
    throw new Error(`Cloudflare API request failed (${response.status}): ${messages}`);
  }
  return payload.result;
}

if (action === "verify") {
  run("npx", ["wrangler", "whoami"]);
} else if (action === "provision") {
  requireConfirmation();
  if (env.USE_R2 !== "true") {
    console.log("USE_R2=false: R2 and Queue provisioning skipped.");
    process.exit(0);
  }
  const bucket = capture("npx", ["wrangler", "r2", "bucket", "create", env.R2_BUCKET_NAME]);
  if (!bucket.ok && !/already exists|already (?:been )?taken/i.test(bucket.output)) { console.error(bucket.output); process.exit(1); }
  const lifecycle = capture("npx", ["wrangler", "r2", "bucket", "lifecycle", "add", env.R2_BUCKET_NAME, "--expire-days", "1", "--id", "getopeninbox-auto-expire", "--force"]);
  if (!lifecycle.ok && !/already exists|duplicate|already (?:been )?taken|must be unique/i.test(lifecycle.output)) { console.error(lifecycle.output); process.exit(1); }
  const dlq = capture("npx", ["wrangler", "queues", "create", env.EMAIL_DEAD_LETTER_QUEUE_NAME]);
  if (!dlq.ok && !/already exists|already (?:been )?taken/i.test(dlq.output)) { console.error(dlq.output); process.exit(1); }
  const queue = capture("npx", ["wrangler", "queues", "create", env.EMAIL_QUEUE_NAME]);
  if (!queue.ok && !/already exists|already (?:been )?taken/i.test(queue.output)) { console.error(queue.output); process.exit(1); }
  console.log("Cloudflare resources are ready.");
} else if (action === "migrate") {
  requireConfirmation(); render();
  run("npx", ["wrangler", "d1", "migrations", "apply", env.D1_DATABASE_NAME, "--remote", "--config", ".generated/api.wrangler.jsonc"]);
} else if (action === "email-routing") {
  requireConfirmation();
  requireEnv(env, ["INBOX_ZONE_ID", "INBOX_DOMAIN", "EMAIL_WORKER_NAME"]);
  const basePath = `/zones/${env.INBOX_ZONE_ID}/email/routing`;
  const settings = await cfRequest(basePath);
  if (!settings.enabled || settings.status !== "ready") {
    await cfRequest(`${basePath}/dns`, { method: "POST", body: JSON.stringify({ name: env.INBOX_DOMAIN }) });
  }
  await cfRequest(`${basePath}/rules/catch_all`, {
    method: "PUT",
    body: JSON.stringify({
      name: "GetOpenInbox catch-all",
      enabled: true,
      matchers: [{ type: "all" }],
      actions: [{ type: "worker", value: [env.EMAIL_WORKER_NAME] }],
    }),
  });
  console.log(`Email Routing catch-all now sends ${env.INBOX_DOMAIN} mail to ${env.EMAIL_WORKER_NAME}.`);
} else if (action === "email-routing-status") {
  requireEnv(env, ["INBOX_ZONE_ID"]);
  const basePath = `/zones/${env.INBOX_ZONE_ID}/email/routing`;
  const settings = await cfRequest(basePath);
  const catchAll = await cfRequest(`${basePath}/rules/catch_all`);
  console.log(JSON.stringify({
    enabled: settings.enabled,
    status: settings.status,
    domain: settings.name,
    catchAllEnabled: catchAll.enabled,
    actions: catchAll.actions,
  }, null, 2));
} else if (action === "deploy") {
  requireConfirmation(); render();
  const workers = env.USE_R2 === "true" ? ["consumer", "email", "api", "web"] : ["email", "api", "web"];
  for (const name of workers) {
    run("npx", ["wrangler", "deploy", "--config", `.generated/${name}.wrangler.jsonc`]);
    if (name === "api") {
      runWithInput("npx", ["wrangler", "secret", "put", "SESSION_HMAC_SECRET", "--config", ".generated/api.wrangler.jsonc"], env.SESSION_HMAC_SECRET);
      runWithInput("npx", ["wrangler", "secret", "put", "ADDRESS_HASH_SECRET", "--config", ".generated/api.wrangler.jsonc"], env.ADDRESS_HASH_SECRET);
    }
  }
  console.log("Workers deployed. Configure the inbox-domain Email Routing catch-all to the email Worker if it is not already configured.");
} else {
  console.error("Usage: node scripts/cloudflare.mjs verify|provision|migrate|email-routing|email-routing-status|deploy [--confirm]");
  process.exit(2);
}
