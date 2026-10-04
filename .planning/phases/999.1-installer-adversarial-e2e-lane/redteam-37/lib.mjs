// Shared helpers for the plan 33.1-37 red-team probes. Drives the COMMITTED install/install.js and
// install/uninstall.js with node, in fresh scratch git repos under this scratch dir.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, readlinkSync, realpathSync } from "node:fs";
import { join } from "node:path";

export const REPO = "/Users/olgeroeselg/Projects/public/grugops";
export const SCRATCH = realpathSync("/private/tmp/claude-501/-Users-olgeroeselg-Projects-public-grugops/bd917275-17d0-4b7c-8162-a34427dbf824/scratchpad/redteam-37");
export const BIN = { install: join(REPO, "install", "install.js"), uninstall: join(REPO, "install", "uninstall.js") };

export const sha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");

export function tree(root) {
  if (!existsSync(root)) return "";
  const rows = [];
  const walk = (rel) => {
    for (const ent of readdirSync(rel === "" ? root : join(root, rel), { withFileTypes: true })) {
      const r = rel === "" ? ent.name : `${rel}/${ent.name}`;
      const abs = join(root, r);
      if (ent.isSymbolicLink()) rows.push(`${r} LINK ${readlinkSync(abs)}`);
      else if (ent.isDirectory()) { rows.push(`${r}/ DIR`); walk(r); }
      else if (ent.isFile()) rows.push(`${r} ${sha(abs)}`);
      else rows.push(`${r} OTHER`);
    }
  };
  walk("");
  return rows.sort().join("\n");
}

export function world(tag) {
  const dir = realpathSync(mkdtempSync(join(SCRATCH, `w-${tag}-`)));
  const target = join(dir, "target");
  const home = join(dir, "home");
  mkdirSync(target); mkdirSync(home);
  spawnSync("git", ["init", "-q"], { cwd: target });
  return { dir, target, home, kitHome: join(home, ".grugops") };
}

export function run(w, bin, args = [], o = {}) {
  const env = { ...process.env, HOME: w.home, GRUGOPS_HOME: o.grugopsHome ?? w.kitHome, TARGET: o.target ?? w.target, INSTALL_MODE: o.mode ?? "copy", GRUGOPS_SRC: o.src ?? REPO };
  if (o.dryRun) env.DRY_RUN = "1"; else delete env.DRY_RUN;
  const r = spawnSync(process.execPath, [BIN[bin], ...(bin === "install" ? ["--yes"] : []), ...args], { encoding: "utf8", env, cwd: o.cwd ?? w.target, timeout: 300000, maxBuffer: 1 << 26 });
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "", out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}

export function grepLines(out, re) { return out.split("\n").filter((l) => re.test(l)); }
