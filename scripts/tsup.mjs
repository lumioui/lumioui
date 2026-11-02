#!/usr/bin/env node
/**
 * tsup wrapper — runs the tsup CLI with a larger heap.
 * The DTS build (tsc worker) OOMs at Node's default ~4GB on this codebase,
 * so `pnpm typecheck` / `pnpm build` (which depend on ui#build) failed cold.
 * Cross-platform: no shell env vars needed.
 */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(process.cwd() + "/");
const tsupPkg = require.resolve("tsup/package.json");
const tsupCli = path.join(path.dirname(tsupPkg), "dist", "cli-default.js");

const res = spawnSync(
  process.execPath,
  ["--max-old-space-size=12288", tsupCli, ...process.argv.slice(2)],
  { stdio: "inherit", cwd: process.cwd(), env: process.env }
);
process.exit(res.status ?? 1);
