/*
 * `npm run dev` from the repo root: backend, website and app together.
 *
 * The app (Expo) gets the real terminal, so its QR code and shortcuts work
 * (a = open on Android, r = reload, Ctrl+C = stop everything). The backend and the
 * website print above it, each line tagged [api] or [web].
 */
import { spawn, spawnSync } from "node:child_process";

const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 22 || (major === 22 && minor < 13)) {
  console.warn(
    `\n\x1b[33m! You're on Node ${process.versions.node}. The app (Expo SDK 58) needs Node 22.13 or newer.\n` +
      `  Run "nvm use 22.17.0", then "npm run dev" again.\x1b[0m\n`,
  );
}

const isWindows = process.platform === "win32";
const COLORS = { api: "\x1b[32m", web: "\x1b[34m" };
const children = [];

// Backend and website in the background, their output tagged line by line
function background(name, folder) {
  const child = spawn(`npm run dev --prefix ${folder}`, {
    shell: true,
    detached: !isWindows, // its own process group, so it can be stopped as a whole
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, FORCE_COLOR: "1" },
  });
  const tag = `${COLORS[name]}[${name}]\x1b[0m `;
  for (const stream of [child.stdout, child.stderr]) {
    let rest = "";
    stream.setEncoding("utf8");
    stream.on("data", (chunk) => {
      const lines = (rest + chunk).split(/\r?\n/);
      rest = lines.pop();
      for (const line of lines) process.stdout.write(tag + line + "\n");
    });
  }
  child.on("exit", (code) => process.stdout.write(`${tag}stopped${code ? ` (exit code ${code})` : ""}\n`));
  children.push(child);
}

function stopAll() {
  for (const child of children) {
    if (child.exitCode !== null || !child.pid) continue;
    // Stop the whole tree: stopping only the shell would leave the servers running
    if (isWindows) spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    else {
      try {
        process.kill(-child.pid, "SIGTERM");
      } catch {
        child.kill("SIGTERM");
      }
    }
  }
}

background("api", "backend");
background("web", "web");

// The app last, in the foreground with the real terminal
const app = spawn("npm run start --prefix mobile", { shell: true, stdio: "inherit" });
children.push(app);

app.on("exit", (code) => {
  stopAll();
  process.exit(code ?? 0);
});
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    stopAll();
    process.exit(0);
  });
}
