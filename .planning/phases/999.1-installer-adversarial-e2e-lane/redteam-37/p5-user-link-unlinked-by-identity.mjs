// P5: a link the USER made at an adapter path, pointing at this checkout's kit source for that file
// (what isOwnLink calls "install's own link"), in a target with NO install marker. Install decides
// `unlink` by readlink identity alone (no ledger carry asked), removes the user's link, writes the
// materialized file and records it as install's; uninstall then removes that file. The user's link is
// gone after install+uninstall.
import { existsSync, lstatSync, mkdirSync, symlinkSync, readlinkSync } from "node:fs";
import { join } from "node:path";
import { world, run, REPO } from "./lib.mjs";

const w = world("userlink");
const rel = ".claude/agents/grugops-ba-pm.md";
const dest = join(w.target, rel);
const src = join(REPO, ".claude", "agents", "grugops-ba-pm.md");
mkdirSync(join(w.target, ".claude", "agents"), { recursive: true });
symlinkSync(src, dest);
console.log("marker before install:", existsSync(join(w.target, ".grugops", "install.json")));
const d = run(w, "install", [], { dryRun: true });
console.log("DRY_RUN:", d.out.split("\n").filter((l) => l.includes("grugops-ba-pm.md")).map((l) => l.trim().slice(0, 200)).join(" | "));
const i = run(w, "install");
console.log("install exit", i.status, ":", i.out.split("\n").filter((l) => l.includes("grugops-ba-pm.md")).map((l) => l.trim().slice(0, 200)).join(" | "));
const isLink = () => { try { return lstatSync(dest).isSymbolicLink(); } catch { return "absent"; } };
console.log("after install, dest is a link:", isLink());
const u = run(w, "uninstall");
console.log("uninstall exit", u.status, ":", u.out.split("\n").filter((l) => l.includes("grugops-ba-pm.md")).map((l) => l.trim().slice(0, 200)).join(" | "));
console.log("after uninstall, dest:", isLink());
