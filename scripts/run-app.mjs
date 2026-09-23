import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const role = process.argv[2];
const mode = process.argv[3] || "dev"; // dev | start

const ports = {
  student: 3005,
  admin: 3006,
  class_rep: 3007,
  lecturer: 3008,
};

if (!role || !(role in ports)) {
  console.error(
    "Usage: node scripts/run-app.mjs <student|admin|class_rep|lecturer> [dev|start]",
  );
  process.exit(1);
}

const port = ports[role];
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const args =
  mode === "start"
    ? ["next", "start", "--port", String(port)]
    : ["next", "dev", "--port", String(port)];

const child = spawn("npx", args, {
  cwd: root,
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    NEXT_PUBLIC_APP_ROLE: role,
    APP_ROLE: role,
    PORT: String(port),
  },
});

child.on("exit", (code) => process.exit(code ?? 0));
