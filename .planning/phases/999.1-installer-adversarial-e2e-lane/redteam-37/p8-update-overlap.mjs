// P8: --update has no overlap refusal (by design). GRUGOPS_HOME = a repo holding agent-factory/MYNOTES.md.
// Does any sequence of --update runs lose the user's bytes?
import { existsSync, mkdirSync, writeFileSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { world, run } from "./lib.mjs";
const w = world("update");
mkdirSync(join(w.target, "agent-factory"));
writeFileSync(join(w.target, "agent-factory", "MYNOTES.md"), "notes\n");
const u1 = run(w, "install", ["--update"], { grugopsHome: w.target });
console.log("update 1 exit", u1.status);
writeFileSync(join(w.target, "agent-factory", "MORE.md"), "more\n");
mkdirSync(join(w.target, "agent-factory", "emptydir-user-made"));
const u2 = run(w, "install", ["--update"], { grugopsHome: w.target });
console.log("update 2 exit", u2.status);
const u3 = run(w, "install", ["--update"], { grugopsHome: w.target });
console.log("update 3 exit", u3.status);
const tops = readdirSync(w.target).sort();
console.log("repo top level:", tops.join(" "));
for (const b of tops.filter((n) => n.startsWith("agent-factory.bak."))) console.log(b, readdirSync(join(w.target, b)).filter((n) => /MYNOTES|MORE|emptydir/.test(n)).join(","));
