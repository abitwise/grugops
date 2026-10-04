// P7: spelling variants of GRUGOPS_HOME == target (case, Unicode NFD vs NFC, trailing slash, `..`,
// relative, symlinked home, double slash). Each should be refused (exit 1, stderr overlap, stdout empty).
import { mkdirSync, symlinkSync, writeFileSync } from "node:fs";
import { join, relative, basename, dirname } from "node:path";
import { world, run, tree } from "./lib.mjs";

const variants = [];
const w = world("spell");
// A target whose name carries a composed character, so NFD/NFC spellings differ.
const tNFC = join(w.dir, "repé"); mkdirSync(tNFC);
writeFileSync(join(tNFC, "KEEP.md"), "x\n");
const tw = { ...w, target: tNFC };
symlinkSync(tNFC, join(w.dir, "homelink"));
const list = {
  "upper-case": join(w.dir, "REPÉ"),
  "nfd": join(w.dir, "repé"),
  "trailing-slash": tNFC + "/",
  "dot-dot": join(tNFC, "sub", ".."),
  "double-slash": tNFC.replace("/rep", "//rep"),
  "relative": relative(tNFC, tNFC) || ".",
  "symlinked-home": join(w.dir, "homelink"),
  "firmlink": "/System/Volumes/Data" + tNFC,
};
const before = tree(tNFC);
for (const [name, home] of Object.entries(list)) {
  const r = run(tw, "install", [], { grugopsHome: home, target: tNFC, cwd: tNFC, dryRun: true });
  console.log(`${name.padEnd(15)} exit ${r.status} refused=${/overlap|could not be read/.test(r.stderr)} stdoutEmpty=${r.stdout === ""}`);
}
console.log("target unchanged (DRY_RUN):", tree(tNFC) === before);
