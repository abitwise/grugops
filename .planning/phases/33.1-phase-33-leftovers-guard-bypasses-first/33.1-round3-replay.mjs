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
  lstatSync,
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

// The host check's test seam (plan 33.1-41): the committed host-protection.js answered by the gh stub
// from a fixture map, never by the real `gh` or the network.
const GH_STUB = join(REPO_ROOT, "scripts", "runnable-ref", "fixtures", "gh-stub.mjs");
const HOST_STRONG = join(REPO_ROOT, "scripts", "runnable-ref", "fixtures", "host-strong.fixture.json");
const strongHostFixture = () => JSON.parse(readFileSync(HOST_STRONG, "utf8"));
const hostApi = (path) => `api --method GET -i ${path}`;

/** Run the committed host check in the world's target with `fixture`; returns the run and the stub's call log. */
function hostRun(w, fixture, args = []) {
  const fixturePath = join(w.dir, `host-fixture-${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
  const logPath = `${fixturePath}.calls`;
  writeFileSync(fixturePath, JSON.stringify(fixture));
  const r = spawnSync(process.execPath, [BINS.hostProtection, "--gh-script", GH_STUB, ...args], {
    encoding: "utf8",
    cwd: w.target,
    env: { ...process.env, HOME: w.home, GH_STUB_FIXTURE: fixturePath, GH_STUB_LOG: logPath },
    timeout: 120_000,
    maxBuffer: 64 * 1024 * 1024,
  });
  const calls = existsSync(logPath)
    ? readFileSync(logPath, "utf8")
        .split("\n")
        .filter((l) => l.length > 0)
        .map((l) => JSON.parse(l).join(" "))
    : [];
  const stdout = r.stdout ?? "";
  return { status: r.status, stdout, stderr: r.stderr ?? "", lines: stdout.split(/\r?\n/), calls };
}

/** The --json block after the HOST-PROTECTION summary line. */
function hostJson(stdout) {
  const lines = stdout.trim().split("\n");
  const at = lines.findIndex((l) => l.startsWith("HOST-PROTECTION:"));
  check(at >= 0, "no HOST-PROTECTION summary line");
  return JSON.parse(lines.slice(at + 1).join("\n"));
}

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

  // Plan 33.1-39, review WR-03 (the verifier's reproduction): install creates .gemini/settings.json, the
  // user adds "theme", uninstall. It used to remove only the AGENTS.md element and leave install's own
  // `"context": { "fileName": ["GEMINI.md"] }`. Now no `context` key remains and "theme" is intact.
  "wr-03-gemini-created-edited"(w) {
    const rel = ".gemini/settings.json";
    const i = w.install();
    check(i.status === 0, `install exited ${i.status}, expected 0`);
    const g = JSON.parse(readFileSync(w.at(".grugops/install.json"), "utf8")).ledger.find((e) => e.kind === "gemini");
    check(g !== undefined && g.createdFile === true, "the install did not record that it created the Gemini settings file");
    const text = readFileSync(w.at(rel), "utf8");
    const brace = text.indexOf("{");
    writeFileSync(w.at(rel), `${text.slice(0, brace + 1)}\n  "theme": "dark",${text.slice(brace + 1)}`);
    const u = w.uninstall();
    check(u.status === 0, `uninstall exited ${u.status}, expected 0\n${u.out.slice(-2000)}`);
    check(existsSync(w.at(rel)), `${rel} was removed, with the user's "theme" in it`);
    const after = JSON.parse(readFileSync(w.at(rel), "utf8"));
    check(!Object.prototype.hasOwnProperty.call(after, "context"), `a context key remains: ${JSON.stringify(after)}`);
    check(after.theme === "dark" && Object.keys(after).length === 1, `the file is not exactly the user's {"theme":"dark"}: ${JSON.stringify(after)}`);
    check(readFileSync(w.at(rel), "utf8").includes('"theme": "dark"'), "the user's member lost its bytes");
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

  // Plan 33.1-40, review CR-02 (the verifier's reproduction): a user's thesis.bak.<ISO>/ (with a chapter in
  // it) and budget.xlsx.bak.<ISO> used to be removed by `install.js --yes --prune-old-kit`, exit 0, because
  // prune removed by the name shape. Now prune removes only backups install recorded: both survive byte for
  // byte, both are named, exit 0. The same names in the kit home survive too.
  "cr-02-user-bak-shapes"(w) {
    const i = w.install();
    check(i.status === 0, `install exited ${i.status}\n${i.out.slice(-2000)}`);
    const iso = "2026-10-05T10-00-00.000Z";
    const planted = [];
    for (const root of [w.target, w.kitHome]) {
      mkdirSync(join(root, `thesis.bak.${iso}`));
      writeFileSync(join(root, `thesis.bak.${iso}`, "ch1.md"), "Chapter one. The user's thesis.\n");
      writeFileSync(join(root, `budget.xlsx.bak.${iso}`), "the user's budget\n");
      planted.push(root);
    }
    const before = planted.map((root) => tree(root));
    const r = w.install(["--prune-old-kit"]);
    check(r.status === 0, `prune exited ${r.status}, expected 0\n${r.out.slice(-2000)}`);
    planted.forEach((root, k) => check(tree(root) === before[k], `prune changed ${root}`));
    for (const label of ["target", "kit home"]) {
      for (const n of [`thesis.bak.${iso}`, `budget.xlsx.bak.${iso}`]) {
        check(r.lines.some((l) => /^\s*left\s/.test(l) && l.includes(`${label}: ${n} (not recorded by install`)), `no left line names ${label}: ${n}`);
      }
    }
    check(!r.lines.some((l) => /^\s*(removed|would-remove)\s/.test(l)), "prune removed something");
  },

  // Plan 33.1-40: a --migrate records its backups; prune then removes exactly the recorded prunable ones (the
  // in-repo kit, the legacy config, and a kit-home backup of an unrecorded agent-factory/), leaves the
  // handoffs backup and the edited kit files' backups, and takes the removed entries out of both records.
  "prune-recorded"(w) {
    // The old layout: an in-repo kit with its config, a root config, handoffs, and two kit files with no record.
    mkdirSync(w.at("agent-factory/roles"), { recursive: true });
    mkdirSync(w.at("agent-factory/config"), { recursive: true });
    writeFileSync(w.at("agent-factory/roles/orchestrator.md"), "FROZEN CORE — old in-repo vendored kit.\n");
    writeFileSync(w.at("agent-factory/config/factory.config.json"), '{ "_edited": "kit location" }\n');
    writeFileSync(w.at("factory.config.json"), '{ "_edited": "root location" }\n');
    mkdirSync(w.at("plans/handoffs"), { recursive: true });
    writeFileSync(w.at("plans/handoffs/relay-1.md"), "a handoff\n");
    mkdirSync(w.at(".claude/agents"), { recursive: true });
    writeFileSync(w.at(".claude/agents/grugops-orchestrator.md"), "> read `agent-factory/roles/orchestrator.md` (repo-relative).\n");
    mkdirSync(join(w.kitHome, "agent-factory"), { recursive: true });
    writeFileSync(join(w.kitHome, "agent-factory", "MYNOTES.md"), "the user's notes\n");
    const m = w.install(["--migrate", "--backup-edited-kit"]);
    check(m.status === 0, `--migrate exited ${m.status}\n${m.out.slice(-2000)}`);
    const backups = () => JSON.parse(readFileSync(w.at(".grugops/install.json"), "utf8")).ledger.filter((e) => e.kind === "backup");
    const homeBackups = () => JSON.parse(readFileSync(join(w.kitHome, ".grugops-kit.json"), "utf8")).ledger.filter((e) => e.kind === "backup");
    const recorded = backups();
    const prunable = recorded.filter((e) => e.origin === "in-repo-kit" || e.origin === "legacy-config");
    const kept = recorded.filter((e) => !(e.origin === "in-repo-kit" || e.origin === "legacy-config"));
    check(prunable.length === 2, `expected 2 prunable target backups, found ${prunable.length}: ${JSON.stringify(recorded)}`);
    check(kept.some((e) => e.origin === "handoffs") && kept.some((e) => e.origin === "edited-kit-file"), `the handoffs and edited-kit-file backups were not recorded: ${JSON.stringify(recorded)}`);
    const home = homeBackups();
    check(home.length === 1, `expected 1 kit-home backup, found ${home.length}`);
    const stateOf = (p) => (lstatSync(p).isDirectory() ? `DIR\n${tree(p)}` : `FILE ${sha256(p)}`);
    const keptState = kept.map((e) => stateOf(w.at(e.path)));
    const r = w.install(["--prune-old-kit"]);
    check(r.status === 0, `prune exited ${r.status}\n${r.out.slice(-2000)}`);
    for (const e of prunable) check(!existsSync(w.at(e.path)), `${e.path} was not removed`);
    check(!existsSync(join(w.kitHome, home[0].path)), `${home[0].path} was not removed from the kit home`);
    kept.forEach((e, k) => {
      check(existsSync(w.at(e.path)) && stateOf(w.at(e.path)) === keptState[k], `${e.path} was changed or removed`);
    });
    const removedLines = r.lines.filter((l) => /^\s*removed\s/.test(l));
    check(removedLines.length === 3, `expected 3 removed lines, found ${removedLines.length}`);
    check(JSON.stringify(backups().map((e) => e.path).sort()) === JSON.stringify(kept.map((e) => e.path).sort()), "the marker still lists a pruned backup, or lost a kept one");
    check(homeBackups().length === 0, "the kit-home record still lists the pruned backup");
    const again = w.install(["--prune-old-kit"]);
    check(again.status === 0 && !again.lines.some((l) => /^\s*removed\s/.test(l)), "a second prune removed something");
  },

  // Plan 33.1-41, D-31 Q4: the production environment is not read. The strong fixture, with the old
  // environments answer and protected-branch list served as well, gives exit 0 (main protected); the
  // environment line reads UNKNOWN - verify by design; neither list is asked for.
  "q4-env-by-design"(w) {
    const fx = strongHostFixture();
    fx[hostApi("repos/{owner}/{repo}/environments?per_page=100")] = {
      status: 200,
      body: { total_count: 1, environments: [{ name: "production", can_admins_bypass: false, protection_rules: [] }] },
    };
    fx[hostApi("repos/{owner}/{repo}/branches?protected=true&per_page=1")] = { status: 200, body: [{ name: "main", protected: true }] };
    const r = hostRun(w, fx, ["--json"]);
    check(r.status === 0, `host check exited ${r.status}, expected 0\n${r.stdout.slice(-2000)}`);
    check(r.lines.some((l) => l.startsWith("branch main: protected — ")), "branch main is not protected");
    const env = r.lines.find((l) => l.startsWith("environment production: "));
    check(env !== undefined && env.startsWith("environment production: UNKNOWN - verify — not checked by design"), `environment line: ${env}`);
    check(env.includes("33.1 D-31") && env.includes("install/README.md §5"), `environment line does not cite D-31 and README §5: ${env}`);
    check(
      r.lines.includes("HOST-PROTECTION: 1 protected, 0 unprotected, 0 UNKNOWN - verify; production environment not checked (UNKNOWN - verify by design)"),
      "the summary line is not the branch-only line",
    );
    const block = hostJson(r.stdout);
    const published = block.calls.map((c) => c.join(" "));
    check(JSON.stringify(published) === JSON.stringify(r.calls), "the --json calls differ from the stub's call log");
    const notRead = published.filter((c) => c.includes("environments") || c.includes("branches?protected="));
    check(notRead.length === 0, `the check asked for: ${notRead.join(", ")}`);
    const target = block.targets.find((t) => t.kind === "environment");
    check(target?.verdict === "UNKNOWN - verify" && target.facts.every((f) => f.state === "unknown"), "the environment target is not UNKNOWN - verify with unknown facts");
  },

  // Plan 33.1-42, 33.1 D-33 (d) (D-31 Q2, re-review WR-03): the strong fixture with
  // dismiss_stale_reviews_on_push removed from the pull_request rule, and no classic protection
  // (404 `Branch not protected`), gives UNKNOWN - verify, exit 2: absence is never read as `false`.
  // The same setting `false` gives unprotected, exit 1. Neither run reads the stale row as held.
  "q2-stale-approval"(w) {
    const rulesKey = hostApi("repos/{owner}/{repo}/rules/branches/main?per_page=100");
    const STALE = "dismisses stale approvals when new commits are pushed";
    const variant = (value) => {
      const fx = strongHostFixture();
      fx[hostApi("repos/{owner}/{repo}/branches/main/protection")] = { status: 404, body: { message: "Branch not protected" } };
      const pr = fx[rulesKey].body.find((rule) => rule.type === "pull_request");
      check(pr?.parameters?.dismiss_stale_reviews_on_push === true, "the strong fixture's pull_request rule does not carry dismiss_stale_reviews_on_push true");
      if (value === undefined) delete pr.parameters.dismiss_stale_reviews_on_push;
      else pr.parameters.dismiss_stale_reviews_on_push = value;
      return fx;
    };
    const strong = hostRun(w, variant(true), ["--json"]);
    check(strong.status === 0, `the strong control exited ${strong.status}, expected 0\n${strong.stdout.slice(-2000)}`);
    const expectations = [
      ["absent", undefined, 2, "UNKNOWN - verify", "unknown"],
      ["false", false, 1, "unprotected", "failed"],
    ];
    for (const [label, value, exit, verdict, state] of expectations) {
      const r = hostRun(w, variant(value), ["--json"]);
      check(r.status === exit, `${label}: host check exited ${r.status}, expected ${exit}\n${r.stdout.slice(-2000)}`);
      check(r.lines.some((l) => l.startsWith(`branch main: ${verdict} — `)), `${label}: branch main is not ${verdict}`);
      const main = hostJson(r.stdout).targets.find((t) => t.kind === "branch" && t.name === "main");
      const fact = main?.facts?.find((f) => f.requirement === STALE);
      check(fact?.state === state, `${label}: the stale-approval row reads ${fact?.state}, expected ${state}`);
    }
  },

  // Plan 33.1-41, review WR-04: the review's run (30 --branch flags, --json) through `(sleep 2; wc -c)`
  // delivers the byte count the same run writes to a file. Before the fix: 65536 bytes every time.
  "wr-04-slow-pipe"(w) {
    if (process.platform === "win32") return;
    const fixturePath = join(w.dir, "host-fixture.json");
    writeFileSync(fixturePath, JSON.stringify(strongHostFixture()));
    const q = (s) => `'${s.replace(/'/g, "'\\''")}'`;
    const branches = Array.from({ length: 30 }, (_, i) => `--branch b${i + 1}`).join(" ");
    const cmd = `${q(process.execPath)} ${q(BINS.hostProtection)} --gh-script ${q(GH_STUB)} --json ${branches}`;
    const env = { ...process.env, HOME: w.home, GH_STUB_FIXTURE: fixturePath, GH_STUB_LOG: "" };
    const out = join(w.dir, "host-out.txt");
    spawnSync("sh", ["-c", `${cmd} > ${q(out)} 2>/dev/null`], { cwd: w.target, env, encoding: "utf8" });
    const file = readFileSync(out).length;
    check(file > 65536, `the run wrote ${file} bytes, not more than one pipe buffer`);
    const r = spawnSync("sh", ["-c", `${cmd} 2>/dev/null | (sleep 2; wc -c)`], { cwd: w.target, env, encoding: "utf8" });
    const piped = Number((r.stdout ?? "").trim());
    check(piped === file, `the slow pipe delivered ${piped} bytes, the file ${file}`);
  },

  // Plan 33.1-41, review IN-04: `--brnach release` exits 2 with the bad-usage line, before any gh call.
  "in-04-bad-usage"(w) {
    const r = hostRun(w, strongHostFixture(), ["--brnach", "release"]);
    check(r.status === 2, `host check exited ${r.status}, expected 2`);
    check(r.stdout === "HOST-PROTECTION: the check could not run (bad usage: unknown argument: --brnach) — UNKNOWN - verify\n", `stdout: ${JSON.stringify(r.stdout)}`);
    check(r.stderr.includes("unknown argument: --brnach"), `stderr: ${r.stderr}`);
    check(r.calls.length === 0, `gh was called: ${r.calls.join(", ")}`);
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
