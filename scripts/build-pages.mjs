import { copyFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const build = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["vite", "build"],
  {
    cwd: projectRoot,
    stdio: "inherit",
    env: { ...process.env, VITE_BASE: "/pixe-live/" },
    shell: process.platform === "win32",
  },
);

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

// GitHub Pages has no SPA rewrite. Serving the app as 404.html keeps the
// browser URL (e.g. /pixe-live/live/yuki) so React Router can render it.
copyFileSync(
  path.join(projectRoot, "dist", "index.html"),
  path.join(projectRoot, "dist", "404.html"),
);
console.log("Wrote dist/404.html for GitHub Pages SPA fallback.");
