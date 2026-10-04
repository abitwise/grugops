// P4: the `kit` entry is owned by NAME + "is a real directory" only. After a normal install, the user
// moves the kit away and puts a DIFFERENT directory of their own at <GRUGOPS_HOME>/agent-factory (e.g. a
// clone of their fork, or a restore). Re-install answers owns(kit) = owned and deletes it (holder rmSync),
// no backup. Also: GRUGOPS_HOME later pointed at a different-but-reused path that keeps the record.
import { existsSync, mkdirSync, renameSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { world, run } from "./lib.mjs";

const w = world("swap");
const r1 = run(w, "install");
console.log("install 1 exit", r1.status);
console.log("record:", readFileSync(join(w.kitHome, ".grugops-kit.json"), "utf8").replace(/\s+/g, " "));
const kit = join(w.kitHome, "agent-factory");
renameSync(kit, join(w.dir, "kit-moved-away"));
mkdirSync(join(kit, "src"), { recursive: true });
writeFileSync(join(kit, "src", "MY-FORK-WORK.md"), "the user's own directory, not install's kit\n");
for (const dryRun of [true, false]) {
  const r = run(w, "install", [], { dryRun });
  console.log(`${dryRun ? "DRY_RUN" : "REAL"} exit ${r.status}:`, r.out.split("\n").filter((l) => /kit →|would-replace|would-back-up|backed-up/.test(l)).map((l) => l.trim().slice(0, 160)).join(" | "));
}
console.log("MY-FORK-WORK.md survives at kit root:", existsSync(join(kit, "src", "MY-FORK-WORK.md")));
const { readdirSync } = await import("node:fs");
console.log("kit home entries:", readdirSync(w.kitHome).join(" "));
