// P1c: the same miss with the TARGET spelled through the firmlink: kit home <dir>/.grugops inside the
// target <dir>. Plain spelling is refused; the /System/Volumes/Data spelling of the same target is not.
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { world, run } from "./lib.mjs";

const w = world("firmlink-target");
const kh = join(w.target, ".tools", "grugops");
for (const [label, target] of [["plain", w.target], ["firmlink", "/System/Volumes/Data" + w.target]]) {
  const r = run(w, "install", [], { grugopsHome: kh, target, dryRun: true });
  console.log(`${label}: exit ${r.status} refused=${/overlaps the target/.test(r.stderr)} would-copy-kit=${/would-copy\s+kit →/.test(r.out)}`);
}
