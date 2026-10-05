#!/usr/bin/env node
// ---------------------------------------------------------------------------------------------
// 33.1-round3-replay.mjs — scratch-repository reproductions against the COMMITTED installer build.
//
// WHAT THIS DOES. 33.1-GAP-PLANNING-BRIEF.md §3 asks every gap-round execution to reproduce its
// findings the way the verifier does: run the committed `.js` with `node` in a scratch git
// repository, not only through vitest. This script holds a registry of named cases. Each case
// makes its own scratch directory with mkdtemp under os.tmpdir(), runs `git init -q` there, puts
// HOME and GRUGOPS_HOME inside it, and runs install/install.js, install/uninstall.js or
// scripts/runnable-ref/host-protection.js from this repository with process.execPath. It asserts
// on the exit code, the output lines and the file bytes (sha256 before and after), prints
// `PASS <case>` or `FAIL <case>: <why>`, and removes the scratch directory in a `finally`.
//
// WHAT IT NEVER TOUCHES. It never targets this repository or the real home directory. The
// repository root is derived from this file's own location (three directories up), and a case
// refuses to run when its scratch directory resolves inside that root. HOME, GRUGOPS_HOME and
// TARGET always point inside the scratch directory. GRUGOPS_SRC is this repository (read only),
// unless a case builds its own kit source inside the scratch directory.
//
// Every later round-3 plan adds its finding's reproduction here as a new case.
//
// DEPENDENCIES: none outside Node's standard library (and `git` on PATH for `git init`).
//
// USAGE:
//   node 33.1-round3-replay.mjs --list          print the case names
//   node 33.1-round3-replay.mjs all             run every case
//   node 33.1-round3-replay.mjs <case>...       run the named cases
// Exit 1 on any FAIL or an unknown case name.
// ---------------------------------------------------------------------------------------------

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  appendFileSync,
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = realpathSync(resolve(HERE, "..", "..", ".."));
const BINS = {
  install: join(REPO_ROOT, "install", "install.js"),
  uninstall: join(REPO_ROOT, "install", "uninstall.js"),
  hostProtection: join(REPO_ROOT, "scripts", "runnable-ref", "host-protection.js"),
};
for (const [name, path] of Object.entries(BINS)) {
  if (!existsSync(path)) {
    console.error(`FAIL setup: the ${name} build is missing at ${path}`);
    process.exit(1);
  }
}

const sha256 = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");

/** Every entry under `root` (not following links): `<rel> <kind> <sha256|readlink>`, sorted; "" when absent. */
function tree(root) {
  if (!existsSync(root)) return "";
  const rows = [];
  const walk = (rel) => {
    for (const ent of readdirSync(rel === "" ? root : join(root, rel), { withFileTypes: true })) {
      const r = rel === "" ? ent.name : `${rel}/${ent.name}`;
      const abs = join(root, r);
      if (ent.isSymbolicLink()) rows.push(`${r} LINK ${readlinkSync(abs)}`);
      else if (ent.isDirectory()) {
        rows.push(`${r}/ DIR`);
        walk(r);
      } else if (ent.isFile()) rows.push(`${r} ${sha256(abs)}`);
      else rows.push(`${r} OTHER`);
    }
  };
  walk("");
  return rows.sort().join("\n");
}

class CaseFailure extends Error {}
function check(cond, why) {
  if (!cond) throw new CaseFailure(why);
}

/** One scratch world: a git target, a home and a kit home, all under a fresh mkdtemp. */
function makeWorld() {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), "grugops-r3-replay-")));
  if (dir === REPO_ROOT || dir.startsWith(REPO_ROOT + sep)) {
    rmSync(dir, { recursive: true, force: true });
    throw new CaseFailure(`refusing to run: the scratch directory ${dir} lies inside the repository`);
  }
  const target = join(dir, "target");
  const home = join(dir, "home");
  mkdirSync(target);
  mkdirSync(home);
  const g = spawnSync("git", ["init", "-q"], { cwd: target, encoding: "utf8" });
  if (g.status !== 0) throw new CaseFailure(`git init failed: ${g.stderr}`);
  const kitHome = join(home, ".grugops");

  /** Run a committed binary against this world's target. */
  function run(bin, args = [], opts = {}) {
    // opts.grugopsHome and opts.target override the world's kit home and target (plan 33.1-37: the
    // CR-01 cases point GRUGOPS_HOME at, or around, the target). Both still lie inside the scratch dir.
    const env = {
      ...process.env,
      HOME: home,
      GRUGOPS_HOME: opts.grugopsHome ?? kitHome,
      TARGET: opts.target ?? target,
      INSTALL_MODE: "copy",
      GRUGOPS_SRC: opts.src ?? REPO_ROOT,
    };
    if (opts.dryRun) env.DRY_RUN = "1";
    else delete env.DRY_RUN;
    const r = spawnSync(process.execPath, [BINS[bin], ...args], { encoding: "utf8", env, cwd: target, timeout: 300_000, maxBuffer: 64 * 1024 * 1024 });
    const out = `${r.stdout ?? ""}${r.stderr ?? ""}`;
    return { status: r.status, out, stdout: r.stdout ?? "", stderr: r.stderr ?? "", lines: out.split(/\r?\n/) };
  }
  const install = (args = [], opts = {}) => run("install", ["--yes", ...args], opts);
  const uninstall = (opts = {}) => run("uninstall", [], opts);
  const at = (rel) => join(target, rel);
  /** The output line that starts with `verb` (after leading spaces) and names `rel` as its path. */
  const lineFor = (r, verb, rel) => r.lines.find((l) => new RegExp(`^\\s*${verb}\\s+${rel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`).test(l));
  return { dir, target, home, kitHome, run, install, uninstall, at, lineFor };
}

// ── the case registry ────────────────────────────────────────────────────────────────────────────

const CASES = {
  // Round-1 CR-03, kept green: a never-installed Gemini settings file is changed by zero bytes.
  "r1-gemini-never-installed"(w) {
    const rel = ".gemini/settings.json";
    mkdirSync(w.at(".gemini"));
    writeFileSync(w.at(rel), '{"context":{"fileName":["AGENTS.md","GEMINI.md"]}}');
    const before = sha256(w.at(rel));
    const r = w.uninstall();
    check(r.status === 0, `uninstall exited ${r.status}, expected 0`);
    check(existsSync(w.at(rel)) && sha256(w.at(rel)) === before, `${rel} changed`);
    check(w.lineFor(r, "left", rel) !== undefined, `no 'left ${rel}' line`);
  },

  // Round-1 WR-05, kept green: a never-installed blank Copilot instructions file survives.
  "r1-copilot-blank"(w) {
    const rel = ".github/copilot-instructions.md";
    mkdirSync(w.at(".github"));
    writeFileSync(w.at(rel), "");
    const before = sha256(w.at(rel));
    const r = w.uninstall();
    check(r.status === 0, `uninstall exited ${r.status}, expected 0`);
    check(existsSync(w.at(rel)) && sha256(w.at(rel)) === before, `${rel} changed or was removed`);
  },

  // The DC-2 user-edit class: edits survive byte for byte and are named; an unedited adapter goes.
  // Plan 33.1-39: the edited files keep the marker (exit 0), rewritten to list them; asserted in
  // wr-02-fix-and-rerun and install/installer-marker-retention.test.ts, not here.
  "user-edit-adapter"(w) {
    const i = w.install();
    check(i.status === 0, `install exited ${i.status}, expected 0`);
    const edited = [".claude/agents/grugops-ba-pm.md", "AGENTS.md"];
    const untouched = ".claude/agents/grugops-architect-design.md";
    check(existsSync(w.at(untouched)), `install did not write ${untouched}`);
    const after = {};
    for (const rel of edited) {
      check(existsSync(w.at(rel)), `install did not write ${rel}`);
      appendFileSync(w.at(rel), "a line the user added\n");
      after[rel] = sha256(w.at(rel));
    }
    const r = w.uninstall();
    check(r.status === 0, `uninstall exited ${r.status}, expected 0`);
    for (const rel of edited) {
      check(existsSync(w.at(rel)) && sha256(w.at(rel)) === after[rel], `the user's edit to ${rel} did not survive byte for byte`);
      check(w.lineFor(r, "left", rel) !== undefined, `no 'left ${rel}' line`);
    }
    check(!existsSync(w.at(untouched)), `the unedited adapter ${untouched} is still there`);
  },

  // Plan 33.1-39, review WR-02 (the verifier's reproduction): with .claude/agents read-only, uninstall
  // exits 3 with a verify per adapter and used to delete the marker anyway, so after the cause was fixed
  // the second uninstall found no record and left every adapter. Now the marker is kept, and the re-run
  // removes every adapter and the marker, exit 0.
  "wr-02-fix-and-rerun"(w) {
    check(process.platform !== "win32", "this case needs a directory mode that blocks a removal (not win32)");
    check(typeof process.getuid !== "function" || process.getuid() !== 0, "this case cannot run as root: a mode does not block root");
    const i = w.install();
    check(i.status === 0, `install exited ${i.status}, expected 0`);
    const marker = w.at(".grugops/install.json");
    const adapters = JSON.parse(readFileSync(marker, "utf8"))
      .ledger.filter((e) => e.kind === "file" && e.path.startsWith(".claude/agents/"))
      .map((e) => e.path);
    check(adapters.length > 10, `the install recorded ${adapters.length} adapters`);
    const agents = w.at(".claude/agents");
    chmodSync(agents, 0o555);
    let u1;
    try {
      u1 = w.uninstall();
    } finally {
      chmodSync(agents, 0o755);
    }
    check(u1.status === 3, `the first uninstall exited ${u1.status}, expected 3`);
    check(existsSync(marker), "the first uninstall deleted the marker after an incomplete run");
    for (const a of adapters) {
      check(existsSync(w.at(a)), `${a} was removed through a read-only directory`);
      check(u1.lines.some((l) => /^\s*verify\s/.test(l) && l.includes(a)), `no verify line names ${a}`);
    }
    const kept = JSON.parse(readFileSync(marker, "utf8")).ledger.filter((e) => e.kind === "file").map((e) => e.path).sort();
    check(JSON.stringify(kept) === JSON.stringify([...adapters].sort()), `the kept marker's file entries are not exactly the adapters left: ${kept.join(", ")}`);
    const u2 = w.uninstall();
    check(u2.status === 0, `the re-run exited ${u2.status}, expected 0\n${u2.out.slice(-2000)}`);
    for (const a of adapters) check(!existsSync(w.at(a)), `${a} is still there after the re-run`);
    check(!existsSync(marker), "the marker is still there after the re-run finished");
    check(u2.out.includes("== uninstall complete =="), "the re-run did not print the complete banner");
  },

  // Plan 33.1-36, the D-33 (b) tracer: the one ledger is the authority. A runnable install recorded is
  // removed by its record even when the uninstalling kit source no longer ships it; the same runnable
  // edited by one byte is left byte for byte and named.
  "tracer-runnable-cross-source"(w) {
    const rel = "tools/grugops/host-protection.js";
    // A kit source with .claude/, AGENTS.md and scripts/runnable-ref/ from this checkout, without the runnable.
    const src = join(w.dir, "kit-source");
    cpSync(join(REPO_ROOT, ".claude"), join(src, ".claude"), { recursive: true });
    cpSync(join(REPO_ROOT, "AGENTS.md"), join(src, "AGENTS.md"));
    cpSync(join(REPO_ROOT, "scripts", "runnable-ref"), join(src, "scripts", "runnable-ref"), { recursive: true });
    rmSync(join(src, "scripts", "runnable-ref", "host-protection.js"));
    check(!existsSync(join(src, "scripts", "runnable-ref", "host-protection.js")), "the scratch kit source still ships the runnable");

    // Run 1: recorded and unedited → removed by its record.
    const i = w.install();
    check(i.status === 0, `install exited ${i.status}, expected 0`);
    check(existsSync(w.at(rel)), `install did not write ${rel}`);
    const u = w.uninstall({ src });
    check(!existsSync(w.at(rel)), `${rel} is still there after uninstall with a kit source that lacks it`);
    check(w.lineFor(u, "removed", rel) !== undefined, `no 'removed ${rel}' line`);

    // Run 2: recorded and edited by one byte → left byte for byte and named.
    const i2 = w.install();
    check(i2.status === 0, `re-install exited ${i2.status}, expected 0`);
    check(existsSync(w.at(rel)), `the re-install did not write ${rel}`);
    appendFileSync(w.at(rel), "\n");
    const edited = sha256(w.at(rel));
    const u2 = w.uninstall({ src });
    check(existsSync(w.at(rel)) && sha256(w.at(rel)) === edited, `the edited ${rel} did not survive byte for byte`);
    check(w.lineFor(u2, "left", rel) !== undefined, `no 'left ${rel}' line for the edited runnable`);
  },

  // Plan 33.1-37, review CR-01 (the verifier's reproduction): GRUGOPS_HOME set to the target used to make
  // install move the user's in-repo agent-factory/ aside and delete it, exit 0. Now it exits 1, before any
  // write and before anything reaches stdout, and a DRY_RUN preview is refused the same way.
  // Plan 33.1-38, review WR-01, made stricter: install, then uninstall with a kit source that lacks one
  // recorded adapter. The adapter is removed on its record and named, and every file entry the ledger held
  // before the run is either gone or named on an output line; `== uninstall complete ==` is never printed
  // over a recorded file left unnamed.
  "wr-01-cross-source"(w) {
    const rel = ".claude/agents/grugops-agents-md-scribe.md";
    const src = join(w.dir, "kit-source");
    cpSync(join(REPO_ROOT, ".claude"), join(src, ".claude"), { recursive: true });
    cpSync(join(REPO_ROOT, "AGENTS.md"), join(src, "AGENTS.md"));
    cpSync(join(REPO_ROOT, "scripts", "runnable-ref"), join(src, "scripts", "runnable-ref"), { recursive: true });
    rmSync(join(src, rel));
    check(!existsSync(join(src, rel)), "the scratch kit source still ships the adapter");

    const i = w.install();
    check(i.status === 0, `install exited ${i.status}, expected 0`);
    check(existsSync(w.at(rel)), `install did not write ${rel}`);
    const ledger = JSON.parse(readFileSync(w.at(".grugops/install.json"), "utf8")).ledger;
    check(Array.isArray(ledger), "the marker holds no ledger list");
    const files = ledger.filter((e) => e.kind === "file").map((e) => e.path);
    check(files.includes(rel), `the ledger does not record ${rel}`);

    const u = w.uninstall({ src });
    check(!existsSync(w.at(rel)), `${rel} is still there after uninstall with a kit source that lacks it`);
    check(w.lineFor(u, "removed", rel) !== undefined, `no 'removed ${rel}' line`);
    const unnamed = files.filter((p) => existsSync(w.at(p)) && !u.lines.some((l) => l.includes(p)));
    check(unnamed.length === 0, `recorded file(s) still present and named on no line: ${unnamed.join(", ")}`);
    const lingering = files.filter((p) => existsSync(w.at(p)));
    check(
      !(lingering.length > 0 && u.out.includes("== uninstall complete ==") && unnamed.length > 0),
      "uninstall printed complete over a recorded file left unnamed",
    );
    check(u.status === 0, `uninstall exited ${u.status}, expected 0 (every recorded file held its record)\n${u.out}`);
  },
  "cr-01-kit-home-is-target"(w) {
    const cfgRel = "agent-factory/config/factory.config.json";
    const notesRel = "agent-factory/MYNOTES.md";
    mkdirSync(w.at("agent-factory/config"), { recursive: true });
    writeFileSync(w.at(cfgRel), '{"environments":["production"],"mine":"edited"}');
    writeFileSync(w.at(notesRel), "the user's own notes\n");
    const before = tree(w.target);
    const cfg = sha256(w.at(cfgRel));
    const notes = sha256(w.at(notesRel));
    for (const dryRun of [false, true]) {
      const r = w.install([], { grugopsHome: w.target, dryRun });
      const tag = dryRun ? "DRY_RUN " : "";
      check(r.status === 1, `${tag}install exited ${r.status}, expected 1\n${r.out.slice(0, 2000)}`);
      check(r.stdout === "", `${tag}install printed on stdout: ${r.stdout.slice(0, 400)}`);
      check(/overlaps the target/.test(r.stderr), `${tag}no overlap refusal on stderr: ${r.stderr}`);
      check(!/would-copy/.test(r.out), `${tag}a would-copy line was printed`);
      check(existsSync(w.at(notesRel)) && sha256(w.at(notesRel)) === notes, `${tag}${notesRel} is gone or changed`);
      check(existsSync(w.at(cfgRel)) && sha256(w.at(cfgRel)) === cfg, `${tag}${cfgRel} is gone or changed`);
      check(tree(w.target) === before, `${tag}something new exists in the repository, or something changed`);
    }
  },

  // Plan 33.1-37: the target inside the kit root is refused the same way, and nothing under the kit home changes.
  "cr-01-target-in-kit-root"(w) {
    const kh = join(w.dir, "kithome");
    mkdirSync(join(kh, "agent-factory", "sub"), { recursive: true });
    writeFileSync(join(kh, "agent-factory", "USER.md"), "a file the user keeps beside the repository\n");
    writeFileSync(join(kh, "agent-factory", "sub", "MYNOTES.md"), "the user's own notes\n");
    const target = join(kh, "agent-factory", "sub");
    const before = tree(kh);
    for (const dryRun of [false, true]) {
      const r = w.install([], { grugopsHome: kh, target, dryRun });
      const tag = dryRun ? "DRY_RUN " : "";
      check(r.status === 1, `${tag}install exited ${r.status}, expected 1\n${r.out.slice(0, 2000)}`);
      check(r.stdout === "", `${tag}install printed on stdout: ${r.stdout.slice(0, 400)}`);
      check(/overlaps the target/.test(r.stderr), `${tag}no overlap refusal on stderr: ${r.stderr}`);
      check(tree(kh) === before, `${tag}something under the kit home changed`);
    }
  },

  // Plan 33.1-37: an unrecorded agent-factory/ at the kit root is renamed to a recorded backup, never deleted.
  "kit-home-unrecorded"(w) {
    mkdirSync(join(w.kitHome, "agent-factory"), { recursive: true });
    const notes = join(w.kitHome, "agent-factory", "MYNOTES.md");
    writeFileSync(notes, "the user's notes at the kit root\n");
    const want = sha256(notes);
    const r = w.install();
    check(r.status === 0, `install exited ${r.status}, expected 0\n${r.out.slice(-2000)}`);
    const baks = readdirSync(w.kitHome).filter((n) => n.startsWith("agent-factory.bak."));
    check(baks.length === 1, `expected one agent-factory.bak.<ISO>, found ${baks.length}`);
    const kept = join(w.kitHome, baks[0], "MYNOTES.md");
    check(existsSync(kept) && sha256(kept) === want, "MYNOTES.md is not byte-identical inside the backup");
    const rec = JSON.parse(readFileSync(join(w.kitHome, ".grugops-kit.json"), "utf8"));
    const named = rec.ledger.filter((e) => e.kind === "backup" && e.path === baks[0] && e.origin === "kit-home" && e.of === "agent-factory");
    check(named.length === 1, `the kit-home record does not name the backup: ${JSON.stringify(rec.ledger)}`);
    check(/^tree:sha256:[0-9a-f]{64}$/.test(String(named[0].content)), `the backup's content record is ${named[0].content}`);
    check(rec.ledger.some((e) => e.kind === "kit" && e.path === "agent-factory"), "the record does not name the kit");
  },

  // Plan 33.1-37: DRY_RUN over an unrecorded kit home previews the backup and changes zero bytes in the kit home.
  "kit-home-dry-run"(w) {
    mkdirSync(join(w.kitHome, "agent-factory"), { recursive: true });
    writeFileSync(join(w.kitHome, "agent-factory", "MYNOTES.md"), "the user's notes at the kit root\n");
    const before = tree(w.kitHome);
    const r = w.install([], { dryRun: true });
    check(r.status === 0, `DRY_RUN install exited ${r.status}, expected 0\n${r.out.slice(-2000)}`);
    check(r.lines.some((l) => /^\s*would-back-up\s/.test(l)), "no would-back-up line");
    check(r.lines.some((l) => /^\s*would-copy\s+kit/.test(l)), "no would-copy kit line");
    check(tree(w.kitHome) === before, "DRY_RUN changed the kit home");
  },

  // Red-team of plan 33.1-36 (handcopy.mjs), fixed by plan 33.1-37 Task 4: every grugops skill and adapter
  // copied by hand, byte-identical to what install writes, is reported left, never recorded, and survives
  // uninstall byte for byte.
  "rt36-identical-copy-not-recorded"(w) {
    const ref = join(w.dir, "reference");
    mkdirSync(ref);
    const i0 = w.install([], { target: ref });
    check(i0.status === 0, `the reference install exited ${i0.status}`);
    const kit = JSON.parse(readFileSync(join(ref, ".grugops", "install.json"), "utf8")).ledger.filter((e) => e.kind === "file" && e.kit).map((e) => e.path);
    check(kit.length === 24, `the reference install recorded ${kit.length} kit files, expected 24`);
    const want = {};
    for (const rel of kit) {
      mkdirSync(dirname(w.at(rel)), { recursive: true });
      cpSync(join(ref, rel), w.at(rel));
      want[rel] = sha256(w.at(rel));
    }
    const i = w.install();
    check(i.status === 0, `install exited ${i.status}, expected 0\n${i.out.slice(-2000)}`);
    const recorded = JSON.parse(readFileSync(w.at(".grugops/install.json"), "utf8")).ledger.filter((e) => e.kind === "file" && kit.includes(e.path));
    check(recorded.length === 0, `install recorded hand copies as its own: ${recorded.map((e) => e.path).join(", ")}`);
    for (const rel of kit) check(w.lineFor(i, "left", rel) !== undefined, `no 'left ${rel}' line from install`);
    const u = w.uninstall();
    check(u.status === 0 || u.status === 3, `uninstall exited ${u.status}`);
    for (const rel of kit) check(existsSync(w.at(rel)) && sha256(w.at(rel)) === want[rel], `${rel} was removed or changed by uninstall`);
  },

  // Red-team of plan 33.1-36 (noledger-reinstall.mjs): a bound marker with no ledger, then re-install, then
  // uninstall. The earlier install's 24 kit files are left and reported, none removed, so the remedy text
  // ("re-run install, then uninstall; what an earlier install made is left and reported") is true.
  "rt36-noledger-reinstall"(w) {
    const i0 = w.install();
    check(i0.status === 0, `install exited ${i0.status}`);
    const markerPath = w.at(".grugops/install.json");
    const m = JSON.parse(readFileSync(markerPath, "utf8"));
    const kit = m.ledger.filter((e) => e.kind === "file" && e.kit).map((e) => e.path);
    check(kit.length === 24, `the install recorded ${kit.length} kit files, expected 24`);
    delete m.ledger;
    writeFileSync(markerPath, JSON.stringify(m, null, 2) + "\n");
    const i = w.install();
    check(i.status === 0, `re-install exited ${i.status}\n${i.out.slice(-2000)}`);
    const after = JSON.parse(readFileSync(markerPath, "utf8")).ledger.filter((e) => e.kind === "file" && e.kit);
    check(after.length === 0, `the re-install recorded ${after.length} earlier kit files as its own`);
    const want = Object.fromEntries(kit.map((rel) => [rel, sha256(w.at(rel))]));
    const u = w.uninstall();
    check(u.status === 0 || u.status === 3, `uninstall exited ${u.status}`);
    for (const rel of kit) {
      check(existsSync(w.at(rel)) && sha256(w.at(rel)) === want[rel], `${rel} was removed or changed`);
      check(w.lineFor(u, "left", rel) !== undefined, `no 'left ${rel}' line from uninstall`);
    }
  },
};

// ── the runner ───────────────────────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
if (argv.includes("--list")) {
  for (const name of Object.keys(CASES)) console.log(name);
  process.exit(0);
}
const names = argv.includes("all") ? Object.keys(CASES) : argv;
if (names.length === 0) {
  console.error("usage: node 33.1-round3-replay.mjs --list | all | <case>...");
  process.exit(1);
}
let failed = false;
for (const name of names) {
  const fn = CASES[name];
  if (fn === undefined) {
    console.log(`FAIL ${name}: unknown case name`);
    failed = true;
    continue;
  }
  let world = null;
  try {
    world = makeWorld();
    fn(world);
    console.log(`PASS ${name}`);
  } catch (e) {
    failed = true;
    console.log(`FAIL ${name}: ${e instanceof CaseFailure ? e.message : (e && e.stack) || String(e)}`);
  } finally {
    if (world !== null) rmSync(world.dir, { recursive: true, force: true });
  }
}
process.exit(failed ? 1 : 0);
