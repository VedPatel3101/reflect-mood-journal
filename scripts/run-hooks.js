const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const hooksDir = path.join(root, "hooks");
const envSource = path.join(root, ".env");
const envDest = path.join(hooksDir, ".env");

// Next.js loads .env from its working directory (hooks/), so sync from project root
if (fs.existsSync(envSource)) {
  fs.copyFileSync(envSource, envDest);
}

const [command, ...args] = process.argv.slice(2);
const child = spawn(command, args, {
  cwd: hooksDir,
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
