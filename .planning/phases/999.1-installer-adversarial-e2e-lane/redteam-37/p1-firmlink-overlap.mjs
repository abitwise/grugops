// P1: CR-01 through a macOS firmlink spelling. /System/Volumes/Data/private/... is the same directory
// as /private/..., but realpathSync.native keeps the spelling, so the real-path comparison misses it.
import { existsSync, mkdirSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { world, run, sha, tree } from "./lib.mjs";

const w = world("firmlink");
mkdirSync(join(w.target, "agent-factory", "config"), { recursive: true });
writeFileSync(join(w.target, "agent-factory", "MYNOTES.md"), "the user's own notes\n");
writeFileSync(join(w.target, "agent-factory", "config", "factory.config.json"), '{"mine":"edited"}');
const notes = sha(join(w.target, "agent-factory", "MYNOTES.md"));
const before = tree(w.target);
const alias = "/System/Volumes/Data" + w.target; // same directory, other spelling
console.log("alias exists:", existsSync(alias));

for (const dryRun of [true, false]) {
  const r = run(w, "install", [], { grugopsHome: alias, dryRun });
  console.log(`--- ${dryRun ? "DRY_RUN" : "REAL"} exit ${r.status}`);
  console.log(r.out.split("\n").filter((l) => /overlap|would-copy|would-back-up|would-replace|backed-up|copied|kit →/.test(l)).join("\n"));
}
console.log("target changed:", tree(w.target) !== before);
console.log("target top level:", readdirSync(w.target).sort().join(" "));
const mn = join(w.target, "agent-factory", "MYNOTES.md");
console.log("agent-factory/MYNOTES.md still at its path:", existsSync(mn) && sha(mn) === notes);
const baks = readdirSync(w.target).filter((n) => n.startsWith("agent-factory.bak."));
for (const b of baks) console.log("backup", b, "holds MYNOTES:", existsSync(join(w.target, b, "MYNOTES.md")));
console.log("world:", w.dir);
