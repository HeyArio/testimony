// pm2 process file — `pm2 startOrRestart ecosystem.config.js` (used by deploy.sh).
// Two processes per CLAUDE.md: the Next.js app and the Python worker.

const fs = require("fs");
const path = require("path");

// Minimal .env parser (KEY=value, optional quotes, # comments). The Next app
// loads app/.env by itself; this is for the worker, which reads plain
// process env (GAVAH_DB, R2_*, WHISPER_MODEL) and gets none under pm2 otherwise.
function loadEnv(file) {
  const env = {};
  if (!fs.existsSync(file)) return env;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    if (line.trim().startsWith("#")) continue;
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let v = m[2];
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    env[m[1]] = v;
  }
  return env;
}

const appDir = path.join(__dirname, "app");
const env = loadEnv(path.join(appDir, ".env"));

// The worker opens the SQLite file directly; derive its path from
// DATABASE_URL ("file:/var/lib/gavah/gavah.db"). Prisma resolves relative
// file: URLs against app/prisma/, so mirror that.
let dbPath = (env.DATABASE_URL || "").replace(/^file:/, "");
if (dbPath && !path.isAbsolute(dbPath)) {
  dbPath = path.join(appDir, "prisma", dbPath);
}

module.exports = {
  apps: [
    {
      name: "gavah",
      cwd: appDir,
      script: "npm",
      args: "start",
      env: { NODE_ENV: "production" },
    },
    {
      name: "gavah-worker",
      cwd: __dirname,
      script: "worker/worker.py",
      interpreter: "python3",
      env: { ...env, ...(dbPath ? { GAVAH_DB: dbPath } : {}) },
    },
  ],
};
