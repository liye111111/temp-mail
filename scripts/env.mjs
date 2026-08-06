import fs from "node:fs";

export function loadEnv(file = ".env") {
  const values = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line || line.trimStart().startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index < 1) continue;
    values[line.slice(0, index).trim()] = line.slice(index + 1).trim();
  }
  return values;
}

export function requireEnv(env, keys) {
  const missing = keys.filter((key) => !env[key]);
  if (missing.length) throw new Error(`Missing required configuration: ${missing.join(", ")}`);
}
