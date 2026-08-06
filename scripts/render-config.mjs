import fs from "node:fs";
import { loadEnv, requireEnv } from "./env.mjs";

const env = loadEnv();
requireEnv(env, [
  "CLOUDFLARE_ACCOUNT_ID", "BRAND_DOMAIN", "BRAND_ZONE_ID", "WEB_HOSTNAME", "API_HOSTNAME",
  "INBOX_DOMAIN", "INBOX_ZONE_ID", "D1_DATABASE_NAME", "D1_DATABASE_ID", "WEB_WORKER_NAME", "API_WORKER_NAME",
  "EMAIL_WORKER_NAME", "QUEUE_WORKER_NAME", "SESSION_HMAC_SECRET", "ADDRESS_HASH_SECRET",
]);

const useR2 = env.USE_R2 === "true";
if (useR2) requireEnv(env, ["R2_BUCKET_NAME", "EMAIL_QUEUE_NAME", "EMAIL_DEAD_LETTER_QUEUE_NAME"]);

fs.mkdirSync(".generated", { recursive: true });
const base = { compatibility_date: "2026-08-05", account_id: env.CLOUDFLARE_ACCOUNT_ID };
const vars = {
  APP_BASE_URL: env.APP_BASE_URL,
  INBOX_DOMAIN: env.INBOX_DOMAIN,
  INBOX_TTL_SECONDS: env.INBOX_TTL_SECONDS,
  MAX_MESSAGES_PER_INBOX: env.MAX_MESSAGES_PER_INBOX,
  MAX_MESSAGE_SIZE_BYTES: env.MAX_MESSAGE_SIZE_BYTES,
  USE_R2: String(useR2),
  MAX_D1_BODY_BYTES: env.MAX_D1_BODY_BYTES,
  MAX_ACCEPTED_MESSAGES_PER_HOUR: env.MAX_ACCEPTED_MESSAGES_PER_HOUR,
  DELETE_EXPIRED_D1_DATA: env.DELETE_EXPIRED_D1_DATA ?? "true",
  ADMIN_ENABLED: env.ADMIN_ENABLED ?? "false",
  ADMIN_HOSTNAME: env.ADMIN_HOSTNAME ?? "",
  ADMIN_ACCESS_TEAM_DOMAIN: env.ADMIN_ACCESS_TEAM_DOMAIN ?? "",
  ADMIN_ACCESS_AUD: env.ADMIN_ACCESS_AUD ?? "",
  ADMIN_ALLOWED_EMAILS: env.ADMIN_ALLOWED_EMAILS ?? "",
};
const d1 = [{ binding: env.D1_BINDING, database_name: env.D1_DATABASE_NAME, database_id: env.D1_DATABASE_ID, migrations_dir: "../migrations" }];
const r2 = useR2 ? [{ binding: env.R2_BINDING, bucket_name: env.R2_BUCKET_NAME }] : [];

const configs = {
  web: { ...base, name: env.WEB_WORKER_NAME, main: "../src/web.ts", assets: { directory: "../public", binding: "ASSETS", run_worker_first: true }, routes: [{ pattern: env.WEB_HOSTNAME, custom_domain: true }] },
  api: { ...base, name: env.API_WORKER_NAME, main: "../src/api.ts", vars, d1_databases: d1, ...(useR2 ? { r2_buckets: r2 } : {}), routes: [{ pattern: env.API_HOSTNAME, custom_domain: true }, ...(env.ADMIN_HOSTNAME ? [{ pattern: env.ADMIN_HOSTNAME, custom_domain: true }] : [])], triggers: { crons: [env.CLEANUP_CRON] } },
  email: { ...base, name: env.EMAIL_WORKER_NAME, main: "../src/email.ts", vars, d1_databases: d1, ...(useR2 ? { r2_buckets: r2, queues: { producers: [{ binding: env.EMAIL_QUEUE_BINDING, queue: env.EMAIL_QUEUE_NAME }] } } : {}) },
  consumer: { ...base, name: env.QUEUE_WORKER_NAME, main: "../src/consumer.ts", vars, d1_databases: d1, r2_buckets: r2, queues: { consumers: [{ queue: env.EMAIL_QUEUE_NAME, max_batch_size: Number(env.QUEUE_MAX_BATCH_SIZE), max_batch_timeout: Number(env.QUEUE_MAX_BATCH_TIMEOUT_SECONDS), max_retries: Number(env.QUEUE_MAX_RETRIES), dead_letter_queue: env.EMAIL_DEAD_LETTER_QUEUE_NAME }] } },
};

for (const [name, config] of Object.entries(configs)) {
  fs.writeFileSync(`.generated/${name}.wrangler.jsonc`, `${JSON.stringify(config, null, 2)}\n`);
}
console.log("Generated Wrangler configurations in .generated/");
