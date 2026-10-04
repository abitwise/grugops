// P1b: the firmlink spelling of CR-01 loses user data on the SECOND run. Run 1 renames the in-repo
// agent-factory/ aside and records the shared kit AT THE TARGET as install's. The user then adds a file
// inside the repo's agent-factory/ (it is their repo directory); run 2 replaces the "recorded kit" and
// removes the holder, deleting the file. Exit 0 both times, no refusal.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { world, run } from "./lib.mjs";

const w = world("firmlink-loss");
const alias = "/System/Volumes/Data" + w.target;
const r1 = run(w, "install", [], { grugopsHome: alias });
console.log("run 1 exit", r1.status, "| refused:", /overlaps the target/.test(r1.stderr));
const f = join(w.target, "agent-factory", "MY-REPO-WORK.md");
writeFileSync(f, "work the user committed to their repo's agent-factory/\n");
const r2 = run(w, "install", [], { grugopsHome: alias });
console.log("run 2 exit", r2.status, "| refused:", /overlaps the target/.test(r2.stderr));
console.log(r2.out.split("\n").filter((l) => /kit →|replaced/.test(l)).join("\n"));
console.log("MY-REPO-WORK.md survives:", existsSync(f));
