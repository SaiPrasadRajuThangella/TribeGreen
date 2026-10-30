/*
 * `npm run dev`: one command for local development.
 * Without MONGODB_URI it starts a local MongoDB (kept in backend/.data, so data survives
 * restarts), then runs the API with auto-reload. The database stays up while the API reloads.
 */
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { MongoMemoryServer } from "mongodb-memory-server";

try {
  process.loadEnvFile();
} catch {
  // No .env file
}

export const LOCAL_DB_PORT = 27018;
const dbPath = fileURLToPath(new URL("../.data/db", import.meta.url));

// Use the MongoDB copy downloaded into backend/node_modules, even when started from the repo root
// (npm would otherwise point the tool at the root folder and it would download MongoDB again)
process.env.MONGOMS_DOWNLOAD_DIR ??= fileURLToPath(
  new URL("../node_modules/.cache/mongodb-memory-server", import.meta.url),
);

let local: MongoMemoryServer | null = null;
let uri = process.env.MONGODB_URI;

if (!uri) {
  mkdirSync(dbPath, { recursive: true });
  local = await MongoMemoryServer.create({
    instance: { dbPath, port: LOCAL_DB_PORT, storageEngine: "wiredTiger" },
  });
  uri = `${local.getUri()}tribegreen`;
  console.log(`Local MongoDB running at ${uri} (data in backend/.data)`);
}

const tsxCli = fileURLToPath(import.meta.resolve("tsx/cli"));
const api = spawn(process.execPath, [tsxCli, "watch", "--clear-screen=false", "src/index.ts"], {
  env: { ...process.env, MONGODB_URI: uri },
  stdio: "inherit",
});

let stopping = false;
async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  api.kill();
  // Keep the files so the data is still there next time
  await local?.stop({ doCleanup: false });
  process.exit(code);
}

api.on("exit", (code) => stop(code ?? 0));
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
