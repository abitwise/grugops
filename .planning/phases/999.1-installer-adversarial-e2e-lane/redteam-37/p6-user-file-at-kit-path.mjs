// P6 (control): a user's own, DIFFERENT file at a kit path in a never-installed target. Where do its bytes go?
import { existsSync, mkdirSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { world, run, sha } from "./lib.mjs";
const w = world("userfile");
const rels = [".claude/agents/grugops-ba-pm.md", ".claude/skills/grugops-gate/SKILL.md"];
for (const rel of rels) { mkdirSync(dirname(join(w.target, rel)), { recursive: true }); writeFileSync(join(w.target, rel), `user's own ${rel}\n`); }
const i = run(w, "install");
console.log("install exit", i.status);
console.log(i.out.split("\n").filter((l) => rels.some((r) => l.includes(r.split("/").pop().replace(".md", ""))) ).map((l) => l.trim().slice(0, 220)).join("\n"));
for (const rel of rels) {
  const p = join(w.target, rel);
  console.log(rel, "holds user bytes:", existsSync(p) && require_bytes(p));
  const d = dirname(p);
  console.log("  siblings:", readdirSync(d).join(" "));
}
function require_bytes(p) { return sha(p) === sha(p) && (String(readFileSync(p)).startsWith("user's own")); }
import { readFileSync } from "node:fs";
