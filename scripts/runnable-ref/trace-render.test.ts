// trace-render.test.ts — the host trace renderer (phase 37, plans 37-06 and 37-07, SPLIT-03, D-01, D-02, D-03).
//
// Every case runs the COMMITTED trace-render.js copied ALONE into an empty temporary directory, with no
// node_modules and no sibling script reachable: the host emulation that proves the file imports `node:`
// builtins only. Every repository it writes into is an mkdtempSync directory built from the imported
// state-layout constants, never this repository's own tree. Notes are planted as raw bytes and sealed through
// the committed context-io.js seal export, the way scripts/trace-render.test.ts plants them.
//
//   exit 0 → rendered, or (--check) the tree equals a fresh render
//   exit 1 → (plan 37-07) a hand-written file, a case-fold collision, or (--check) a missing, extra or
//            changed file; nothing written
//   exit 2 → could not run, with nothing on stdout and nothing written

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { skipLine, stageNameOrSkip, stageShapeOrSkip, stageSymlinkOrSkip } from "../check-platform-shapes.js";
import {
  CONTEXT_ARCHIVE_REL,
  CONTEXT_REL,
  TRACE_DIR_REL,
  TRACEABILITY_REL,
} from "../../install/state-layout.js";
import { TRACE_GENERATED_HEADER } from "../trace-model.js";

const RENDER_JS = join(import.meta.dirname, "trace-render.js");
const ctxio: typeof import("../context-io.js") = await import(
  pathToFileURL(join(import.meta.dirname, "..", "context-io.js")).href
);

const tmpRoots: string[] = [];
afterAll(() => {
  for (const d of tmpRoots) rmSync(d, { recursive: true, force: true });
});

function mkTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpRoots.push(d);
  return d;
}

/** The committed .js, copied alone into an empty directory. */
function hostCopy(): string {
  const host = mkTmp("grugops-trace-render-host-");
  const js = join(host, "trace-render.js");
  copyFileSync(RENDER_JS, js);
  return js;
}

const HOST_JS = hostCopy();

function run(...args: string[]): { status: number | null; stdout: string; stderr: string } {
  const r = spawnSync(process.execPath, [HOST_JS, ...args], { encoding: "utf8", cwd: dirname(HOST_JS) });
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

/** A repository with the state directory present and no context, trace or index yet. */
function repo(): string {
  const root = mkTmp("grugops-trace-render-repo-");
  mkdirSync(join(root, dirname(TRACE_DIR_REL)), { recursive: true });
  return root;
}

/** The text of a note carrying `refs`, sealed through the committed seal export unless `sealed` is false. */
function noteText(name: string, refs: readonly string[], sealed = true): string {
  const fence =
    `id: ${name}\n` +
    "kind: artifact-ref\n" +
    "by: engineer\n" +
    "at: 2026-10-22T10:00:00Z\n" +
    "verified_by: \n" +
    "confidence: high\n" +
    "refs:\n" +
    refs.map((r) => `  - ${r}`).join("\n") +
    "\n" +
    "supersedes: \n";
  const rest = "---\n\n" + "an artifact-ref note carrying trace refs.\n";
  if (!sealed) return "---\n" + fence + rest;
  return "---\n" + fence + `${ctxio.NOTE_SEAL_KEY}: ${ctxio.noteSeal("---\n" + fence + rest)}\n` + rest;
}

/** Plant a note file under `<root>/<contextRel>/<task>/notes/<name>.md`. */
function plant(root: string, contextRel: string, task: string, name: string, text: string): void {
  const dir = join(root, contextRel, task, "notes");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${name}.md`), text, "utf8");
}

/** One entry for the snapshot: a regular file's bytes, or the kind of anything else (never opened). */
function entryOf(abs: string): string {
  const st = lstatSync(abs);
  return st.isFile() ? readFileSync(abs, "utf8") : "<not a regular file>";
}

/** Every entry under the trace directory plus the index, as path → bytes, for byte comparison. */
function snapshot(root: string): Map<string, string> {
  const out = new Map<string, string>();
  if (lexists(join(root, TRACEABILITY_REL))) {
    out.set(TRACEABILITY_REL, entryOf(join(root, TRACEABILITY_REL)));
  }
  const dir = join(root, TRACE_DIR_REL);
  if (existsSync(dir) && lstatSync(dir).isDirectory()) {
    for (const f of readdirSync(dir).sort()) out.set(`${TRACE_DIR_REL}/${f}`, entryOf(join(dir, f)));
  }
  return out;
}

/** True when anything, a dangling link included, sits at `abs`. */
function lexists(abs: string): boolean {
  try {
    lstatSync(abs);
    return true;
  } catch {
    return false;
  }
}

/** A repository with one sealed note for ABC-001 in the live root and one for ABC-002 only in the archive. */
function twoRootRepo(): string {
  const root = repo();
  plant(root, CONTEXT_REL, "taskA", "n1", noteText("n1", ["ABC-001", "NFR-002", "src/a.ts", "a.spec.ts", "REL-0007"]));
  plant(root, CONTEXT_ARCHIVE_REL, "taskB", "n2", noteText("n2", ["ABC-002", "#41", "UAT-12"]));
  return root;
}

const C0_C1_DEL_EXCEPT_NEWLINE = /[\u0000-\u0009\u000b-\u001f\u007f-\u009f]/;

describe("trace-render.js — notes in two context roots become one trace file per ticket and an index (D-01, D-03)", () => {
  it("writes ABC-001 from the live root and ABC-002 from the archive root, an index naming both, and exits 0", () => {
    const root = twoRootRepo();
    const r = run(root);
    expect(r.status, r.stderr).toBe(0);
    expect(r.stderr).toBe("");
    const tree = snapshot(root);
    expect([...tree.keys()]).toEqual([TRACEABILITY_REL, `${TRACE_DIR_REL}/ABC-001.md`, `${TRACE_DIR_REL}/ABC-002.md`]);
    const index = tree.get(TRACEABILITY_REL) as string;
    expect(index.startsWith(`${TRACE_GENERATED_HEADER}\n`)).toBe(true);
    expect(index).toContain("| ABC-001 | [ABC-001](traceability/ABC-001.md) |\n");
    expect(index).toContain("| ABC-002 | [ABC-002](traceability/ABC-002.md) |\n");
    const one = tree.get(`${TRACE_DIR_REL}/ABC-001.md`) as string;
    expect(one.startsWith(`${TRACE_GENERATED_HEADER}\n# Trace: ABC-001\n`)).toBe(true);
    expect(one).toContain("## Requirement\n\n- NFR-002\n");
    expect(one).toContain("## Code\n\n- src/a.ts\n");
    expect(one).toContain("## Tests\n\n- a.spec.ts\n");
    expect(one).toContain("## UAT\n\nNone recorded.\n");
    expect(one).toContain("## Release\n\n- REL-0007\n");
    const two = tree.get(`${TRACE_DIR_REL}/ABC-002.md`) as string;
    expect(two).toContain("## Code\n\n- #41\n");
    expect(two).toContain("## UAT\n\n- UAT-12\n");
    // The read and skip counts, every arm named with its count.
    expect(r.stdout).toContain("2 task(s) and 2 note(s) read");
    for (const arm of ctxio.NOTE_SKIP_ARMS) expect(r.stdout).toContain(`${arm} 0`);
    expect(r.stdout).toContain("unreadable tasks 0");
    expect(r.stdout).toContain("3 file(s) written");
  });

  it("a second run over the same notes leaves every byte unchanged", () => {
    const root = twoRootRepo();
    expect(run(root).status).toBe(0);
    const first = snapshot(root);
    const again = run(root);
    expect(again.status, again.stderr).toBe(0);
    expect(snapshot(root)).toEqual(first);
    // No temp sibling of the atomic write is left behind.
    expect(readdirSync(join(root, TRACE_DIR_REL)).filter((f) => f.includes(".tmp-"))).toEqual([]);
    expect(readdirSync(join(root, dirname(TRACEABILITY_REL))).filter((f) => f.includes(".tmp-"))).toEqual([]);
  });

  it("with no context root at all, it writes the zero-row index and exits 0", () => {
    const root = repo();
    const r = run(root);
    expect(r.status, r.stderr).toBe(0);
    expect([...snapshot(root).keys()]).toEqual([TRACEABILITY_REL]);
    expect(r.stdout).toContain("0 task(s) and 0 note(s) read");
    expect(r.stdout).toContain("1 file(s) written");
  });
});

describe("trace-render.js — skipped notes and unreadable tasks are counted and named, never rendered", () => {
  it("an unsealed note and an unparseable note are counted under their arms and give no trace file", () => {
    const root = twoRootRepo();
    plant(root, CONTEXT_REL, "taskC", "hand", noteText("hand", ["ABC-003"], false));
    plant(root, CONTEXT_REL, "taskC", "junk", "not a note\n");
    const r = run(root);
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toContain("3 task(s) and 2 note(s) read");
    expect(r.stdout).toContain("unsealed 1");
    expect(r.stdout).toContain("unparseable 1");
    expect(existsSync(join(root, TRACE_DIR_REL, "ABC-003.md"))).toBe(false);
    expect(readFileSync(join(root, TRACEABILITY_REL), "utf8")).not.toContain("ABC-003");
  });

  it("a task whose name the reader refuses is counted and named on its own line, with control characters removed", () => {
    const root = twoRootRepo();
    const bad = `bad${"\u001b"}[31mtask${"\u0007"}`;
    const skipped = stageNameOrSkip(
      () => plant(root, CONTEXT_REL, bad, "n9", noteText("n9", ["ABC-009"])),
      "scripts/runnable-ref/trace-render.test.ts: a task named with control characters (plan 37-06)",
    );
    if (skipped !== null) {
      console.warn(skipLine(skipped, "scripts/trace-model.test.ts's failing-task case (the same catch)"));
      return;
    }
    const r = run(root);
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toContain("unreadable tasks 1");
    expect(r.stdout).toContain(`UNREADABLE TASK ${CONTEXT_REL}/bad[31mtask: `);
    expect(C0_C1_DEL_EXCEPT_NEWLINE.test(r.stdout), JSON.stringify(r.stdout)).toBe(false);
    expect(existsSync(join(root, TRACE_DIR_REL, "ABC-009.md"))).toBe(false);
    expect(existsSync(join(root, TRACE_DIR_REL, "ABC-001.md"))).toBe(true);
  });
});

describe("trace-render.js — could not run: exit 2, nothing on stdout, nothing written", () => {
  function expectRefused(root: string | null, args: string[], fragment: string): void {
    const before = root === null ? null : snapshot(root);
    const r = run(...args);
    expect(r.status, r.stdout + r.stderr).toBe(2);
    expect(r.stdout).toBe("");
    expect(r.stderr).toContain(fragment);
    expect(r.stderr).toContain("The trace render did not run.");
    if (root !== null) expect(snapshot(root)).toEqual(before);
  }

  it("no argument, two arguments, an unknown option and a missing root", () => {
    expectRefused(null, [], "no repository root was given");
    expectRefused(null, [repo(), repo()], "more than one repository root");
    expectRefused(null, [repo(), "--bogus"], "unknown option --bogus");
    expectRefused(null, [repo(), "--check", "--check"], "--check was given more than once");
    expectRefused(null, [join(mkTmp("grugops-trace-render-gone-"), "absent")], "cannot be resolved");
  });

  it("a repository without the state directory", () => {
    const root = mkTmp("grugops-trace-render-bare-");
    expectRefused(root, [root], "does not exist");
    expect(existsSync(join(root, TRACE_DIR_REL))).toBe(false);
  });

  it("a directory at a planned file path refuses before the first write", () => {
    const root = twoRootRepo();
    mkdirSync(join(root, TRACE_DIR_REL, "ABC-002.md"), { recursive: true });
    expectRefused(root, [root], `${TRACE_DIR_REL}/ABC-002.md is present and is not a regular file`);
    expect(existsSync(join(root, TRACEABILITY_REL))).toBe(false);
  });

  it("a FIFO at the index path is refused by its lstat and never opened", () => {
    const root = twoRootRepo();
    const at = join(root, TRACEABILITY_REL);
    const skipped = stageShapeOrSkip("FIFO", at, "scripts/runnable-ref/trace-render.test.ts: a FIFO at the index (plan 37-06)");
    if (skipped !== null) {
      console.warn(skipLine(skipped, "the directory-at-a-planned-path case (the same lstat-before-write rule)"));
      return;
    }
    expectRefused(root, [root], `${TRACEABILITY_REL} is present and is not a regular file`);
  });

  it("a symlinked trace directory pointing outside the repository root is refused by name", () => {
    const root = twoRootRepo();
    const outside = mkTmp("grugops-trace-render-outside-");
    const skipped = stageSymlinkOrSkip(
      outside,
      join(root, TRACE_DIR_REL),
      "symlink leaving the repository root",
      "scripts/runnable-ref/trace-render.test.ts: the trace directory (plan 37-06)",
    );
    if (skipped !== null) {
      console.warn(skipLine(skipped, "scripts/runnable-ref/state-check.test.ts's outside-root cases (the same locate rule)"));
      return;
    }
    expectRefused(null, [root], `the trace directory ${TRACE_DIR_REL} resolves outside the repository root`);
    expect(readdirSync(outside)).toEqual([]);
    expect(existsSync(join(root, TRACEABILITY_REL))).toBe(false);
  });

  it("a symlinked context root pointing outside the repository root is refused by name", () => {
    const root = repo();
    const outside = mkTmp("grugops-trace-render-outside-ctx-");
    mkdirSync(join(root, dirname(CONTEXT_REL)), { recursive: true });
    const skipped = stageSymlinkOrSkip(
      outside,
      join(root, CONTEXT_REL),
      "symlink leaving the repository root",
      "scripts/runnable-ref/trace-render.test.ts: the live context root (plan 37-06)",
    );
    if (skipped !== null) {
      console.warn(skipLine(skipped, "the trace-directory case beside this one (the same locate rule)"));
      return;
    }
    expectRefused(root, [root], `the context root ${CONTEXT_REL} resolves outside the repository root`);
  });
});

// ── Plan 37-07: the read-only --check mode and the refusals that protect hand-written content ─────────────

/** Every entry under the trace directory plus the index, with its lstat mtime, so a write is seen. */
function snapshotWithTimes(root: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const [rel, bytes] of snapshot(root)) out.set(rel, `${lstatSync(join(root, rel)).mtimeMs}|${bytes}`);
  return out;
}

/** A rendered two-root repository: the write mode has run once and exited 0. */
function renderedRepo(): string {
  const root = twoRootRepo();
  const r = run(root);
  expect(r.status, r.stderr).toBe(0);
  return root;
}

describe("trace-render.js --check — read-only: 0 fresh, 1 naming each difference, and nothing written", () => {
  it("after a render, --check exits 0, prints a fresh line with the counts, and changes no byte or mtime", () => {
    const root = renderedRepo();
    const before = snapshotWithTimes(root);
    const r = run(root, "--check");
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(r.stdout).toContain("The trace is fresh");
    expect(r.stdout).toContain("2 task(s) and 2 note(s) read");
    for (const arm of ctxio.NOTE_SKIP_ARMS) expect(r.stdout).toContain(`${arm} 0`);
    expect(snapshotWithTimes(root)).toEqual(before);
  });

  it("--check is accepted before the root as well as after it", () => {
    const root = renderedRepo();
    expect(run("--check", root).status).toBe(0);
  });

  it("Edge SPLIT-03 concurrency: deleting one rendered file makes --check exit 1 naming it", () => {
    const root = renderedRepo();
    rmSync(join(root, TRACE_DIR_REL, "ABC-002.md"));
    const before = snapshotWithTimes(root);
    const r = run(root, "--check");
    expect(r.status, r.stdout + r.stderr).toBe(1);
    expect(r.stdout).toContain(`MISSING ${TRACE_DIR_REL}/ABC-002.md`);
    expect(snapshotWithTimes(root)).toEqual(before);
  });

  it("an extra generated trace file and a one-byte change are each named, and nothing is written", () => {
    const root = renderedRepo();
    writeFileSync(join(root, TRACE_DIR_REL, "ABC-099.md"), `${TRACE_GENERATED_HEADER}\n# Trace: ABC-099\n`, "utf8");
    const one = join(root, TRACE_DIR_REL, "ABC-001.md");
    writeFileSync(one, readFileSync(one, "utf8").replace("NFR-002", "NFR-003"), "utf8");
    const before = snapshotWithTimes(root);
    const r = run(root, "--check");
    expect(r.status, r.stdout + r.stderr).toBe(1);
    expect(r.stdout).toContain(`EXTRA ${TRACE_DIR_REL}/ABC-099.md`);
    expect(r.stdout).toContain(`CHANGED ${TRACE_DIR_REL}/ABC-001.md`);
    expect(r.stdout).not.toContain("The trace is fresh");
    expect(snapshotWithTimes(root)).toEqual(before);
  });

  it("with no context root at all, the zero-row index passes --check and a hand-written index fails it (no vacuous pass)", () => {
    const root = repo();
    expect(run(root).status).toBe(0);
    expect(run(root, "--check").status).toBe(0);
    writeFileSync(join(root, TRACEABILITY_REL), "# Traceability Matrix\n_Updated: <date>_\n", "utf8");
    const r = run(root, "--check");
    expect(r.status, r.stdout + r.stderr).toBe(1);
    expect(r.stdout).toContain(`HAND-WRITTEN ${TRACEABILITY_REL}`);
  });

  it("a directory keeper and operating-system metadata beside a fresh render are never named, read or touched", () => {
    const root = renderedRepo();
    writeFileSync(join(root, TRACE_DIR_REL, ".gitkeep"), "", "utf8");
    writeFileSync(join(root, TRACE_DIR_REL, ".DS_Store"), "Bud1\u0000\u0000", "utf8");
    const before = snapshotWithTimes(root);
    const check = run(root, "--check");
    expect(check.status, check.stdout + check.stderr).toBe(0);
    expect(check.stdout).not.toContain(".gitkeep");
    expect(check.stdout).not.toContain(".DS_Store");
    const write = run(root);
    expect(write.status, write.stdout + write.stderr).toBe(0);
    expect(write.stdout).not.toContain(".gitkeep");
    expect(write.stdout).not.toContain(".DS_Store");
    const after = snapshotWithTimes(root);
    for (const keeper of [".gitkeep", ".DS_Store"]) {
      expect(after.get(`${TRACE_DIR_REL}/${keeper}`)).toBe(before.get(`${TRACE_DIR_REL}/${keeper}`));
    }
  });

  it("an unsealed note and a refused task name are counted and named, and --check still exits 0", () => {
    const root = twoRootRepo();
    plant(root, CONTEXT_REL, "taskC", "hand", noteText("hand", ["ABC-003"], false));
    const bad = `bad${"\u001b"}task`;
    const skipped = stageNameOrSkip(
      () => plant(root, CONTEXT_REL, bad, "n9", noteText("n9", ["ABC-009"])),
      "scripts/runnable-ref/trace-render.test.ts: a refused task name under --check (plan 37-07)",
    );
    expect(run(root).status).toBe(0);
    const r = run(root, "--check");
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(r.stdout).toContain("unsealed 1");
    if (skipped !== null) {
      console.warn(skipLine(skipped, "the write-mode refused-task case above (the same catch)"));
      return;
    }
    expect(r.stdout).toContain("unreadable tasks 1");
    expect(r.stdout).toContain(`UNREADABLE TASK ${CONTEXT_REL}/badtask: `);
  });

  it("a FIFO at a planned trace file path makes --check exit 2 naming it, and it is never opened", () => {
    const root = renderedRepo();
    const at = join(root, TRACE_DIR_REL, "ABC-001.md");
    rmSync(at);
    const skipped = stageShapeOrSkip("FIFO", at, "scripts/runnable-ref/trace-render.test.ts: a FIFO at a trace file under --check (plan 37-07)");
    if (skipped !== null) {
      console.warn(skipLine(skipped, "the write-mode FIFO-at-the-index case (the same lstat-before-open rule)"));
      return;
    }
    const r = run(root, "--check");
    expect(r.status, r.stdout + r.stderr).toBe(2);
    expect(r.stdout).toBe("");
    expect(r.stderr).toContain(`${TRACE_DIR_REL}/ABC-001.md is present and is not a regular file`);
  });

  it("a FIFO at an unplanned name in the trace directory makes --check exit 2 naming it, and it is never opened", () => {
    const root = renderedRepo();
    const at = join(root, TRACE_DIR_REL, "ABC-077.md");
    const skipped = stageShapeOrSkip("FIFO", at, "scripts/runnable-ref/trace-render.test.ts: a FIFO extra under --check (plan 37-07)");
    if (skipped !== null) {
      console.warn(skipLine(skipped, "the FIFO-at-a-planned-path case beside this one"));
      return;
    }
    const r = run(root, "--check");
    expect(r.status, r.stdout + r.stderr).toBe(2);
    expect(r.stdout).toBe("");
    expect(r.stderr).toContain(`${TRACE_DIR_REL}/ABC-077.md is present and is not a regular file`);
  });
});

describe("trace-render.js — never destroys hand-written content, never folds two tickets into one file", () => {
  it("an old hand-written traceability.md makes the write mode exit 1 naming it, with every byte unchanged", () => {
    const root = twoRootRepo();
    writeFileSync(join(root, TRACEABILITY_REL), "# Traceability Matrix\n| Ticket | Code |\n", "utf8");
    const before = snapshotWithTimes(root);
    const r = run(root);
    expect(r.status, r.stdout + r.stderr).toBe(1);
    expect(r.stdout).toContain(`HAND-WRITTEN ${TRACEABILITY_REL}`);
    expect(r.stdout).toContain("2 task(s) and 2 note(s) read");
    expect(r.stdout).toContain("0 file(s) written");
    expect(snapshotWithTimes(root)).toEqual(before);
    expect(existsSync(join(root, TRACE_DIR_REL))).toBe(false);
    const check = run(root, "--check");
    expect(check.status).toBe(1);
    expect(check.stdout).toContain(`HAND-WRITTEN ${TRACEABILITY_REL}`);
  });

  it("a hand-written file in the trace directory is refused the same way and never deleted", () => {
    const root = renderedRepo();
    const mine = join(root, TRACE_DIR_REL, "my-notes.md");
    writeFileSync(mine, "my own notes about the trace\n", "utf8");
    const planned = join(root, TRACE_DIR_REL, "ABC-002.md");
    writeFileSync(planned, "# ABC-002, edited by hand\n", "utf8");
    const before = snapshotWithTimes(root);
    const r = run(root);
    expect(r.status, r.stdout + r.stderr).toBe(1);
    expect(r.stdout).toContain(`HAND-WRITTEN ${TRACE_DIR_REL}/my-notes.md`);
    expect(r.stdout).toContain(`HAND-WRITTEN ${TRACE_DIR_REL}/ABC-002.md`);
    expect(snapshotWithTimes(root)).toEqual(before);
  });

  it("an extra file that starts with the generated header is removed by the write mode and reported", () => {
    const root = renderedRepo();
    writeFileSync(join(root, TRACE_DIR_REL, "ABC-099.md"), `${TRACE_GENERATED_HEADER}\n# Trace: ABC-099\n`, "utf8");
    const r = run(root);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(r.stdout).toContain(`REMOVED ${TRACE_DIR_REL}/ABC-099.md`);
    expect(r.stdout).toContain("1 file(s) removed");
    expect(lexists(join(root, TRACE_DIR_REL, "ABC-099.md"))).toBe(false);
    expect(run(root, "--check").status).toBe(0);
  });

  it("notes carrying ABC-1 and abc-1 make the run exit 1 naming both, and nothing is written", () => {
    const root = repo();
    plant(root, CONTEXT_REL, "taskA", "n1", noteText("n1", ["ABC-1", "#1"]));
    plant(root, CONTEXT_REL, "taskB", "n2", noteText("n2", ["abc-1", "#2"]));
    const before = snapshotWithTimes(root);
    for (const args of [[root], [root, "--check"]]) {
      const r = run(...args);
      expect(r.status, r.stdout + r.stderr).toBe(1);
      expect(r.stdout).toContain("COLLISION ABC-1, abc-1");
      expect(snapshotWithTimes(root)).toEqual(before);
    }
    expect(existsSync(join(root, TRACEABILITY_REL))).toBe(false);
  });

  it("a ticket re-cased from abc-1 to ABC-1 renders once and --check is then fresh, on a case-insensitive disk too", () => {
    const root = repo();
    plant(root, CONTEXT_REL, "taskA", "n1", noteText("n1", ["abc-1", "#1"]));
    expect(run(root).status).toBe(0);
    rmSync(join(root, CONTEXT_REL, "taskA"), { recursive: true });
    plant(root, CONTEXT_REL, "taskA", "n1", noteText("n1", ["ABC-1", "#1"]));
    const r = run(root);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(readdirSync(join(root, TRACE_DIR_REL))).toEqual(["ABC-1.md"]);
    expect(readFileSync(join(root, TRACE_DIR_REL, "ABC-1.md"), "utf8")).toContain("# Trace: ABC-1\n");
    expect(run(root, "--check").status).toBe(0);
  });
});
