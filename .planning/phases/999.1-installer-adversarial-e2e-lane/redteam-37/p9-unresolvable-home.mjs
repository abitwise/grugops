// P9: unresolvable kit homes (dangling link into the target, unsearchable parent) must be refused.
import { mkdirSync, symlinkSync, chmodSync, existsSync } from "node:fs";
import { join } from "node:path";
import { world, run, tree } from "./lib.mjs";
const w = world("unres");
symlinkSync(join(w.target, "not-yet"), join(w.dir, "dangling"));
mkdirSync(join(w.dir, "locked", "inner"), { recursive: true });
chmodSync(join(w.dir, "locked"), 0o000);
const before = tree(w.target);
for (const [name, home] of [["dangling-into-target", join(w.dir, "dangling")], ["dangling-child", join(w.dir, "dangling", "x")], ["unsearchable", join(w.dir, "locked", "inner")]]) {
  for (const dryRun of [true, false]) {
    const r = run(w, "install", [], { grugopsHome: home, dryRun });
    console.log(`${name} ${dryRun ? "DRY" : "REAL"} exit ${r.status} stderr=${r.stderr.slice(0, 90).replace(/\n/g, " ")}`);
  }
}
chmodSync(join(w.dir, "locked"), 0o755);
console.log("target/not-yet exists:", existsSync(join(w.target, "not-yet")), "target unchanged:", tree(w.target) === before);
