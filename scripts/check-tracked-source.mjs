#!/usr/bin/env node
/**
 * Exits with code 1 if any untracked files exist under src/.
 * Used in CI / pre-push to prevent Vercel build failures from missing files.
 */
import { execSync } from "child_process";

const porcelain = execSync("git status --porcelain", { encoding: "utf-8" });
const lines = porcelain.trim().split(/\n/).filter(Boolean);

const untracked = lines
  .filter((line) => line.startsWith("??"))
  .map((line) => line.slice(3).trim());

const underSrc = untracked.filter((path) =>
  path.replace(/\\/g, "/").startsWith("src/")
);

if (underSrc.length > 0) {
  console.error(
    "error: untracked files under src/ (add them with git add):"
  );
  underSrc.forEach((p) => console.error("  ", p));
  console.error(
    "\nRun: git add src/ then commit. CI will fail until these are tracked."
  );
  process.exit(1);
}

console.log("ok: no untracked files under src/");
process.exit(0);
