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
  chmodSync,
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  truncateSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  hostCapabilityOrSkip,
  skipLine,
  stageNameOrSkip,
  stageShapeOrSkip,
  stageSymlinkOrSkip,
  type SkipEntry,
} from "../check-platform-shapes.js";
import {
  BOARD_REL,
  CONTEXT_ARCHIVE_REL,
  CONTEXT_REL,
  LAYOUT_MARKER_CONTENT,
  LAYOUT_MARKER_REL,
  NFR_CATALOG_REL,
  PROGRESS_REL,
  TRACE_DIR_REL,
  TRACEABILITY_REL,
} from "../../install/state-layout.js";
import ts from "typescript";
import { TRACE_GENERATED_HEADER, TRACE_TRUST_SKIP_ARMS } from "../trace-model.js";
import { EMBED_CLOSE } from "../generate-runnable-embeds.js";
import { treeDigest } from "../fault-inject.test-support.js";

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

  // Plan 37-21 (CR-01): rewritten, not deleted. It asserted exit 0 with the refused task named on stdout and the
  // rest rendered; a refused task is now a read failure that stops the render, named on stderr.
  it("a task whose name the reader refuses stops the render: exit 2, named on stderr with control characters removed, the earlier render unchanged", () => {
    const root = renderedRepo();
    const earlier = readFileSync(join(root, TRACE_DIR_REL, "ABC-001.md"), "utf8");
    const before = treeDigest(root);
    const bad = `bad${"\u001b"}[31mtask${"\u0007"}`;
    const skipped = stageNameOrSkip(
      () => plant(root, CONTEXT_REL, bad, "n9", noteText("n9", ["ABC-009"])),
      "scripts/runnable-ref/trace-render.test.ts: a task named with control characters (plan 37-06)",
    );
    if (skipped !== null) {
      console.warn(skipLine(skipped, "scripts/trace-model.test.ts's failing-task case (the same catch)"));
      return;
    }
    const planted = treeDigest(root);
    const r = run(root);
    expect(r.status, r.stdout + r.stderr).toBe(2);
    expect(r.stdout).toBe("");
    expect(r.stderr).toContain("(1 task(s) and 0 note(s) could not be read)");
    expect(r.stderr).toContain(`UNREADABLE TASK ${CONTEXT_REL}/bad[31mtask: `);
    expect(C0_C1_DEL_EXCEPT_NEWLINE.test(r.stderr), JSON.stringify(r.stderr)).toBe(false);
    expect(existsSync(join(root, TRACE_DIR_REL, "ABC-009.md"))).toBe(false);
    expect(readFileSync(join(root, TRACE_DIR_REL, "ABC-001.md"), "utf8")).toBe(earlier);
    expect(treeDigest(root)).toEqual(planted);
    expect([...planted.keys()].filter((k) => !before.has(k)).every((k) => k.startsWith(`${CONTEXT_REL}/`))).toBe(true);
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

  // Plan 37-21 (CR-01): rewritten and retitled, not deleted. It asserted --check exit 0 with the refused task
  // named on stdout; a compare over a partial read is not a compare (D-12), so --check now exits 2, named on
  // stderr. The unsealed note stays a trust skip, counted on stdout by the render before the bad task exists.
  it("an unsealed note and a refused task name are counted and named, and --check exits 2", () => {
    const root = twoRootRepo();
    plant(root, CONTEXT_REL, "taskC", "hand", noteText("hand", ["ABC-003"], false));
    const rendered = run(root);
    expect(rendered.status, rendered.stdout + rendered.stderr).toBe(0);
    expect(rendered.stdout).toContain("unsealed 1");
    const bad = `bad${"\u001b"}task`;
    const skipped = stageNameOrSkip(
      () => plant(root, CONTEXT_REL, bad, "n9", noteText("n9", ["ABC-009"])),
      "scripts/runnable-ref/trace-render.test.ts: a refused task name under --check (plan 37-07)",
    );
    const r = run(root, "--check");
    if (skipped !== null) {
      expect(r.status, r.stdout + r.stderr).toBe(0);
      expect(r.stdout).toContain("unsealed 1");
      console.warn(skipLine(skipped, "the write-mode refused-task case above (the same catch)"));
      return;
    }
    expect(r.status, r.stdout + r.stderr).toBe(2);
    expect(r.stdout).toBe("");
    expect(r.stderr).toContain("(1 task(s) and 0 note(s) could not be read)");
    expect(r.stderr).toContain(`UNREADABLE TASK ${CONTEXT_REL}/badtask: `);
    expect(r.stderr).not.toContain("UNREADABLE NOTE");
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

  // Plan 37-22 (WR-01): this case expected `COLLISION ABC-1, abc-1` and exit 1. Under the board grammar abc-1 is
  // not a ticket, so there is one ticket, one trace file and no collision.
  it("abc-1 is not a ticket under the board grammar: one trace file, no collision, exit 0", () => {
    const root = repo();
    plant(root, CONTEXT_REL, "taskA", "n1", noteText("n1", ["ABC-1", "#1"]));
    plant(root, CONTEXT_REL, "taskB", "n2", noteText("n2", ["abc-1", "#2"]));
    const r = run(root);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(r.stdout).not.toContain("COLLISION");
    expect(readdirSync(join(root, TRACE_DIR_REL))).toEqual(["ABC-1.md"]);
    expect(readFileSync(join(root, TRACEABILITY_REL), "utf8")).not.toContain("abc-1");
    const check = run(root, "--check");
    expect(check.status, check.stdout + check.stderr).toBe(0);
    expect(check.stdout).not.toContain("COLLISION");
  });

  it("a ticket re-cased from abc-1 to ABC-1 renders once and --check is then fresh, on a case-insensitive disk too", () => {
    const root = repo();
    plant(root, CONTEXT_REL, "taskA", "n1", noteText("n1", ["abc-1", "#1"]));
    expect(run(root).status).toBe(0);
    // Plan 37-22 (WR-01): abc-1 is not a ticket under the board grammar, so the first render writes no file for it.
    expect(lexists(join(root, TRACE_DIR_REL, "abc-1.md"))).toBe(false);
    expect(readFileSync(join(root, TRACEABILITY_REL), "utf8")).not.toContain("abc-1");
    rmSync(join(root, CONTEXT_REL, "taskA"), { recursive: true });
    plant(root, CONTEXT_REL, "taskA", "n1", noteText("n1", ["ABC-1", "#1"]));
    const r = run(root);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(readdirSync(join(root, TRACE_DIR_REL))).toEqual(["ABC-1.md"]);
    expect(readFileSync(join(root, TRACE_DIR_REL, "ABC-1.md"), "utf8")).toContain("# Trace: ABC-1\n");
    expect(run(root, "--check").status).toBe(0);
  });
});

// ── Plan 37-20 (D-17 Gap 2, CR-02, EXIT-1): an unreadable context root is could-not-run, never a finding ─────

/** A V8 stack frame line: an uncaught throw printed by Node. A could-not-run line never holds one. */
const V8_FRAME = /^\s+at .+:\d+:\d+\)?$/m;

/** chmod 000 cannot deny root, and Windows has no POSIX mode bits: the CR-02 cases need neither. */
const CR02_SKIP =
  process.platform === "win32"
    ? "Windows has no POSIX mode bits"
    : process.getuid?.() === 0
      ? "running as root, which chmod 000 cannot deny"
      : null;
if (CR02_SKIP !== null) {
  console.warn(`SKIP scripts/runnable-ref/trace-render.test.ts CR-02 cases: ${CR02_SKIP}.`);
}

describe("CR-02: an unreadable context root is could-not-run (exit 2), in both modes", () => {
  for (const mode of ["write", "--check"] as const) {
    it.skipIf(CR02_SKIP !== null)(`${mode}: .grugops/context at mode 000 exits 2, empty stdout, a named EACCES line, no stack`, () => {
      const root = renderedRepo();
      const ctx = join(root, CONTEXT_REL);
      expect(lstatSync(ctx).isDirectory(), "PREMISE: the live context root is a real directory").toBe(true);
      const before = snapshotWithTimes(root);
      chmodSync(ctx, 0o000);
      let r: { status: number | null; stdout: string; stderr: string };
      try {
        r = mode === "write" ? run(root) : run(root, "--check");
      } finally {
        chmodSync(ctx, 0o755);
      }
      expect(r.status, r.stdout + r.stderr).toBe(2);
      expect(r.stdout).toBe("");
      expect(r.stderr).toContain(`the context root ${CONTEXT_REL} cannot be listed (EACCES)`);
      expect(r.stderr).not.toMatch(V8_FRAME);
      if (mode === "write") expect(snapshotWithTimes(root)).toEqual(before);
    });
  }
});

// ── Plan 37-21 (D-17 Gap 1, CR-01, READ-1): an incomplete note read never removes a trace file ─────────────
// A task whose notes cannot be read is not a task with no notes. The renderer refuses to run (exit 2, nothing
// written or removed) in both modes, and state-check reports `trace-not-compared` naming the task, never a
// fresh trace. The state-check half runs the COMMITTED state-check.js, copied alone into its own directory.

const CHECK_HOST_JS = (() => {
  const host = mkTmp("grugops-trace-render-check-host-");
  const js = join(host, "state-check.js");
  copyFileSync(join(import.meta.dirname, "state-check.js"), js);
  return js;
})();

/** The committed state checker on a repository, as a host runs it. */
function stateCheck(...args: string[]): { status: number | null; stdout: string; stderr: string } {
  const r = spawnSync(process.execPath, [CHECK_HOST_JS, ...args], { encoding: "utf8", cwd: dirname(CHECK_HOST_JS) });
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

type TraceJson = { compared: boolean; findings: { key: string; rel: string; note: string | null }[] };

/** state-check --json's trace block, with the run's status. */
function stateCheckTrace(root: string): { status: number | null; trace: TraceJson; raw: string } {
  const r = stateCheck(root, "--json");
  const lines = r.stdout.split("\n").filter((l) => l.length > 0);
  expect(lines, `stdout: ${r.stdout} stderr: ${r.stderr}`).toHaveLength(1);
  return { status: r.status, trace: (JSON.parse(lines[0] ?? "") as { trace: TraceJson }).trace, raw: r.stdout };
}

/** Write `text` at the repository-relative `rel`, creating its parents. */
function plantFile(root: string, rel: string, text: string): void {
  const p = join(root, ...rel.split("/"));
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, text);
}

/**
 * A repository state-check finds clean, with one sealed note naming ABC-1 in the live task `taskA`, rendered
 * by the committed renderer. With `marker`, the D-14 layout marker is planted, so findings are enforced.
 */
function stateCleanRepo(marker: boolean): string {
  const root = repo();
  plantFile(root, BOARD_REL, "# Board\n\n## Ready (WIP unlimited)\n\n## Done (WIP unlimited)\n");
  plantFile(root, NFR_CATALOG_REL, "# NFR catalog\n");
  plantFile(root, PROGRESS_REL, "# Progress\n");
  if (marker) plantFile(root, LAYOUT_MARKER_REL, LAYOUT_MARKER_CONTENT);
  plant(root, CONTEXT_REL, "taskA", "n1", noteText("n1", ["ABC-1", "src/a.ts"]));
  const r = run(root);
  expect(r.status, r.stdout + r.stderr).toBe(0);
  return root;
}

/** The two CR-01 shapes: the task's notes directory at mode 000, and the task directory itself (the realpath arm). */
const CR01_SHAPES = [
  { name: "the notes directory", rel: `${CONTEXT_REL}/taskA/notes` },
  { name: "the task directory", rel: `${CONTEXT_REL}/taskA` },
] as const;

describe("CR-01: an incomplete read never removes a trace file", () => {
  for (const shape of CR01_SHAPES) {
    it.skipIf(CR02_SKIP !== null)(
      `${shape.name} at mode 000: write exit 2 with nothing removed, --check exit 2, state-check trace-not-compared, never fresh`,
      () => {
        const root = stateCleanRepo(true);
        const premise = stateCheckTrace(root);
        expect(premise.status, `PREMISE: the rendered repository is clean: ${premise.raw}`).toBe(0);
        expect(premise.trace).toEqual({ compared: true, findings: [] });
        const at = join(root, ...shape.rel.split("/"));
        expect(lstatSync(at).isDirectory(), "PREMISE: the target is a real directory").toBe(true);
        const before = treeDigest(root);
        expect(before.has(`${TRACE_DIR_REL}/ABC-1.md`), "PREMISE: ABC-1.md was rendered").toBe(true);
        const indexBefore = readFileSync(join(root, TRACEABILITY_REL), "utf8");
        expect(indexBefore).toContain("| ABC-1 | [ABC-1](traceability/ABC-1.md) |\n");
        chmodSync(at, 0o000);
        let write: { status: number | null; stdout: string; stderr: string };
        let check: { status: number | null; stdout: string; stderr: string };
        let json: { status: number | null; trace: TraceJson; raw: string };
        let text: { status: number | null; stdout: string; stderr: string };
        try {
          write = run(root);
          check = run(root, "--check");
          json = stateCheckTrace(root);
          text = stateCheck(root);
        } finally {
          chmodSync(at, 0o755);
        }
        // The write mode: exit 2, nothing on stdout, the task named on stderr, every byte unchanged.
        expect(write.status, write.stdout + write.stderr).toBe(2);
        expect(write.stdout).toBe("");
        expect(write.stderr).toContain(`UNREADABLE TASK ${CONTEXT_REL}/taskA: `);
        expect(write.stderr).toContain("nothing was written or removed");
        expect(write.stderr).not.toMatch(V8_FRAME);
        expect(treeDigest(root)).toEqual(before);
        expect(readFileSync(join(root, TRACEABILITY_REL), "utf8")).toBe(indexBefore);
        // --check: a compare over a partial read is not a compare (D-12): exit 2, never 0 or 1.
        expect(check.status, check.stdout + check.stderr).toBe(2);
        expect(check.stdout).toBe("");
        expect(check.stderr).toContain(`UNREADABLE TASK ${CONTEXT_REL}/taskA: `);
        // state-check with the marker: exit 1, one trace-not-compared finding naming the task, never fresh.
        expect(json.status, json.raw).toBe(1);
        expect(json.trace.compared).toBe(false);
        expect(json.trace.findings.map((f) => `${f.key}|${f.rel}`)).toEqual([`trace-not-compared|${CONTEXT_REL}/taskA`]);
        expect(json.trace.findings[0]?.note).toContain("this task's notes could not be read");
        expect(text.status, text.stdout + text.stderr).toBe(1);
        expect(text.stdout).not.toContain("The trace is fresh");
        expect(text.stdout).toMatch(/^FINDING {2}\.grugops\/context\/taskA: .*\(trace-not-compared\)$/m);
      },
    );

    it.skipIf(CR02_SKIP !== null)(
      `${shape.name} at mode 000 without a layout marker: state-check warns trace-not-compared and never says fresh`,
      () => {
        const root = stateCleanRepo(false);
        const at = join(root, ...shape.rel.split("/"));
        chmodSync(at, 0o000);
        let text: { status: number | null; stdout: string; stderr: string };
        try {
          text = stateCheck(root);
        } finally {
          chmodSync(at, 0o755);
        }
        expect(text.status, text.stdout + text.stderr).toBe(0);
        expect(text.stdout).toMatch(/^WARN {5}\.grugops\/context\/taskA: .*\(trace-not-compared\)$/m);
        expect(text.stdout).not.toContain("The trace is fresh");
      },
    );
  }
});

// ── Plan 37-21 (READ-1): every reader arm, in both context roots (D-03) ─────────────────────────────────────
// The I/O rows are derived from the reader's own arms (NOTE_SKIP_ARMS minus TRACE_TRUST_SKIP_ARMS), each with
// one fixture builder in a Record keyed by arm, so a new I/O arm without a builder fails red here. The directory
// shape is a second not-a-regular-file builder. Each row renders a clean repository, plants the shape in a task
// of one context root, then runs the write mode, --check and state-check (with the marker): exit 2, exit 2 and a
// trace-not-compared finding naming the note, with the tree digest unchanged. The two trust arms are controls.

/** A planted shape: the note file name, a skip entry when the platform cannot make it, and its mode switch. */
type PlantedShape = {
  readonly file: string;
  readonly skip: SkipEntry | null;
  /** Makes the shape effective after the digest is taken (a mode-000 file cannot be digested). */
  readonly activate?: () => void;
  /** Undoes activate, in a finally, before the tree is digested again. */
  readonly deactivate?: () => void;
};
type ShapeBuilder = (notesDir: string, position: string) => PlantedShape;

const POSITION = "scripts/runnable-ref/trace-render.test.ts: a note in the plan 37-21 arm table";

/** One builder per I/O arm of the note reader. */
const IO_ARM_BUILDERS: Record<string, ShapeBuilder> = {
  unopenable: (notesDir, position) => {
    const at = join(notesDir, "u.md");
    writeFileSync(at, noteText("u", ["ABC-7"]));
    const skip = hostCapabilityOrSkip("chmod 000 enforcement", position);
    return { file: "u.md", skip, activate: () => chmodSync(at, 0o000), deactivate: () => chmodSync(at, 0o644) };
  },
  "not-a-regular-file": (notesDir, position) => ({
    file: "x.md",
    skip: stageShapeOrSkip("FIFO", join(notesDir, "x.md"), position),
  }),
  "above-ceiling": (notesDir) => {
    const at = join(notesDir, "big.md");
    writeFileSync(at, "");
    truncateSync(at, ctxio.NOTE_FILE_MAX_BYTES + 1);
    expect(lstatSync(at).size, "PREMISE: the file is one byte over the note ceiling").toBe(ctxio.NOTE_FILE_MAX_BYTES + 1);
    return { file: "big.md", skip: null };
  },
  vanished: (notesDir, position) => ({
    file: "z.md",
    skip: stageSymlinkOrSkip(join(notesDir, "nowhere.md"), join(notesDir, "z.md"), "dangling symlink", position),
  }),
};

/** Second builders for an arm, beside its Record entry: a directory named like a note is not a regular file. */
const EXTRA_ARM_BUILDERS: readonly { readonly arm: string; readonly build: ShapeBuilder }[] = [
  {
    arm: "not-a-regular-file",
    build: (notesDir, position) => ({ file: "y.md", skip: stageShapeOrSkip("directory", join(notesDir, "y.md"), position) }),
  },
];

const IO_ARMS = ctxio.NOTE_SKIP_ARMS.filter((arm) => !TRACE_TRUST_SKIP_ARMS.includes(arm));
const ARM_ROOTS = [CONTEXT_REL, CONTEXT_ARCHIVE_REL] as const;
const ARM_ROWS = ARM_ROOTS.flatMap((rootRel) => [
  ...IO_ARMS.map((arm) => ({ rootRel, arm, build: IO_ARM_BUILDERS[arm] as ShapeBuilder | undefined })),
  ...EXTRA_ARM_BUILDERS.map((b) => ({ rootRel, arm: b.arm, build: b.build as ShapeBuilder | undefined })),
]);
let ioRowsRun = 0;

/** A clean, rendered, marked repository holding a sealed ABC-9 note in `<rootRel>/taskZ/notes/`. */
function armRepo(rootRel: string): { root: string; notesDir: string } {
  const root = stateCleanRepo(true);
  plant(root, rootRel, "taskZ", "n9", noteText("n9", ["ABC-9"]));
  const r = run(root);
  expect(r.status, r.stdout + r.stderr).toBe(0);
  const premise = stateCheckTrace(root);
  expect(premise.status, `PREMISE: the rendered repository is clean: ${premise.raw}`).toBe(0);
  expect(premise.trace).toEqual({ compared: true, findings: [] });
  return { root, notesDir: join(root, ...rootRel.split("/"), "taskZ", "notes") };
}

describe("READ-1: every I/O arm of the note reader stops the render and the compare by name, in both context roots", () => {
  it("the I/O arms are the four the brief names, and every one has a builder", () => {
    expect([...IO_ARMS].sort()).toEqual(["above-ceiling", "not-a-regular-file", "unopenable", "vanished"]);
    for (const arm of IO_ARMS) expect(IO_ARM_BUILDERS[arm], `no fixture builder for the I/O arm ${arm}`).toBeDefined();
  });

  for (const row of ARM_ROWS) {
    it(`${row.rootRel}: a note under the ${row.arm} arm makes write exit 2 with the digest unchanged, --check exit 2, state-check trace-not-compared`, () => {
      ioRowsRun += 1;
      expect(row.build, `no fixture builder for the I/O arm ${row.arm}`).toBeDefined();
      const { root, notesDir } = armRepo(row.rootRel);
      const shape = (row.build as ShapeBuilder)(notesDir, `${POSITION} (${row.arm}, ${row.rootRel})`);
      if (shape.skip !== null) {
        console.warn(skipLine(shape.skip, "the other I/O arm rows of this table (the same read-failure rule)"));
        return;
      }
      const before = treeDigest(root);
      const indexBefore = readFileSync(join(root, TRACEABILITY_REL), "utf8");
      let write: { status: number | null; stdout: string; stderr: string };
      let check: { status: number | null; stdout: string; stderr: string };
      let json: { status: number | null; trace: TraceJson; raw: string };
      shape.activate?.();
      try {
        write = run(root);
        check = run(root, "--check");
        json = stateCheckTrace(root);
      } finally {
        shape.deactivate?.();
      }
      const named = `UNREADABLE NOTE ${row.rootRel}/taskZ/notes/${shape.file} (${row.arm}): `;
      expect(write.status, write.stdout + write.stderr).toBe(2);
      expect(write.stdout).toBe("");
      expect(write.stderr).toContain(named);
      expect(write.stderr).toContain("(0 task(s) and 1 note(s) could not be read)");
      expect(treeDigest(root)).toEqual(before);
      expect(readFileSync(join(root, TRACEABILITY_REL), "utf8")).toBe(indexBefore);
      expect(check.status, check.stdout + check.stderr).toBe(2);
      expect(check.stdout).toBe("");
      expect(check.stderr).toContain(named);
      expect(json.status, json.raw).toBe(1);
      expect(json.trace.compared).toBe(false);
      expect(json.trace.findings.map((f) => `${f.key}|${f.rel}`)).toEqual([
        `trace-not-compared|${row.rootRel}/taskZ/notes/${shape.file}`,
      ]);
      expect(json.trace.findings[0]?.note).toContain(`(${row.arm}: `);
    });
  }

  it("the table ran (I/O arm count + 1) x 2 roots rows", () => {
    expect(ARM_ROWS).toHaveLength((IO_ARMS.length + EXTRA_ARM_BUILDERS.length) * ARM_ROOTS.length);
    expect(ARM_ROWS).toHaveLength(10);
    expect(ioRowsRun).toBe(10);
  });

  for (const rootRel of ARM_ROOTS) {
    for (const arm of TRACE_TRUST_SKIP_ARMS) {
      it(`CONTROL ${rootRel}: a note under the trust arm ${arm} still renders exit 0 with no trace file for its ticket`, () => {
        const { root, notesDir } = armRepo(rootRel);
        writeFileSync(join(notesDir, "t.md"), arm === "unsealed" ? noteText("t", ["ABC-8"], false) : "not a note at all\n");
        const write = run(root);
        expect(write.status, write.stdout + write.stderr).toBe(0);
        expect(write.stdout).toContain(`${arm} 1`);
        expect(existsSync(join(root, TRACE_DIR_REL, "ABC-8.md"))).toBe(false);
        expect(existsSync(join(root, TRACE_DIR_REL, "ABC-9.md"))).toBe(true);
        const check = run(root, "--check");
        expect(check.status, check.stdout + check.stderr).toBe(0);
        const json = stateCheckTrace(root);
        expect(json.status, json.raw).toBe(0);
        expect(json.trace).toEqual({ compared: true, findings: [] });
      });
    }
  }
});

// ── Plan 37-22 (D-17, WR-01, AUTH-1): the board grammar decides which refs are tickets ───────────────────────
// The trace once had its own ticket shape (any letters, either case, any length), so a lowercase ref became a
// ticket and a 300-letter ref became a file name the disk refused (ENAMETOOLONG) after other files were written.
// The board grammar (agent-factory/contracts/board.md, scripts/board-model.ts isTicketId) is the one answer now.

const WR01_LONG_REF = `${"A".repeat(300)}-1`;
const WR01_REFS = ["ABC-1", "CWE-79", "utf-8", "abc-1", WR01_LONG_REF, "#41"] as const;

describe("WR-01: a ref the board grammar refuses is never a ticket, so it never becomes a trace file name", () => {
  it("one sealed note with ABC-1, CWE-79, utf-8, abc-1, a 300-letter ref and #41 renders exactly ABC-1.md and CWE-79.md; --check and state-check are clean", () => {
    const root = repo();
    plantFile(root, BOARD_REL, "# Board\n\n## Ready (WIP unlimited)\n\n## Done (WIP unlimited)\n");
    plantFile(root, NFR_CATALOG_REL, "# NFR catalog\n");
    plantFile(root, PROGRESS_REL, "# Progress\n");
    plantFile(root, LAYOUT_MARKER_REL, LAYOUT_MARKER_CONTENT);
    plant(root, CONTEXT_REL, "taskA", "n1", noteText("n1", WR01_REFS));
    const write = run(root);
    expect(write.status, write.stdout + write.stderr).toBe(0);
    expect(write.stderr).toBe("");
    expect(write.stderr).not.toContain("ENAMETOOLONG");
    const owned = readdirSync(join(root, TRACE_DIR_REL)).filter((n) => !n.startsWith(".")).sort();
    expect(owned).toEqual(["ABC-1.md", "CWE-79.md"]);
    const ticketLines = readFileSync(join(root, TRACEABILITY_REL), "utf8")
      .split("\n")
      .filter((l) => l.startsWith("| ") && l.includes("]("));
    expect(ticketLines).toEqual([
      "| ABC-1 | [ABC-1](traceability/ABC-1.md) |",
      "| CWE-79 | [CWE-79](traceability/CWE-79.md) |",
    ]);
    const check = run(root, "--check");
    expect(check.status, check.stdout + check.stderr).toBe(0);
    const json = stateCheckTrace(root);
    expect(json.status, json.raw).toBe(0);
    expect(json.trace).toEqual({ compared: true, findings: [] });
  });

  it("the board grammar's answers did not move: [ABC-1] is a ticket row, [abc-1] is unparsed, [EPIC-1] is an epic row", async () => {
    const board: typeof import("../board-model.js") = await import(
      pathToFileURL(join(import.meta.dirname, "..", "board-model.js")).href
    );
    const model = board.parseBoard("# Board\n\n## Ready (WIP unlimited)\n\n- [ABC-1] t\n- [abc-1] t\n- [EPIC-1] e\n");
    expect(model.columns.flatMap((c) => c.rows.map((r) => r.id))).toEqual(["ABC-1"]);
    expect(model.epicRows.map((r) => r.id)).toEqual(["EPIC-1"]);
    expect(model.unparsed).toHaveLength(1);
  });
});

// ── Plan 37-22 (D-17, WR-01): every planned trace file name is checked before the first write ────────────────
// No real repository can reach a refused name once the board grammar decides the tickets, so the runnable half
// is proven by the order of the committed trace-render.js's top-level statements, read as a syntax tree.

/** The calls that touch a path: inspect (lstat), write, create or remove. */
const PATH_EFFECT_CALLS = new Set(["lstatSync", "unlinkSync", "mkdirSync", "writeFileSync", "renameSync", "rmSync", "atomicWrite"]);

/** The called name of a call: `f(...)` or `x.f(...)`. */
function calledName(call: ts.CallExpression): string | null {
  if (ts.isIdentifier(call.expression)) return call.expression.text;
  if (ts.isPropertyAccessExpression(call.expression)) return call.expression.name.text;
  return null;
}

/** Every called name in a subtree, function declarations excluded (their bodies run only when called). */
function callsOutsideDeclarations(n: ts.Node, out: string[] = []): string[] {
  if (ts.isFunctionDeclaration(n)) return out;
  if (ts.isCallExpression(n)) {
    const name = calledName(n);
    if (name !== null) out.push(name);
  }
  ts.forEachChild(n, (c) => {
    callsOutsideDeclarations(c, out);
  });
  return out;
}

/** Every identifier read in a subtree. */
function identifiersIn(n: ts.Node, out: Set<string> = new Set()): Set<string> {
  if (ts.isIdentifier(n)) out.add(n.text);
  ts.forEachChild(n, (c) => {
    identifiersIn(c, out);
  });
  return out;
}

describe("WR-01 call order: trace-render checks every planned file name before the first path effect, in both modes", () => {
  it("census over the committed trace-render.js: one traceFileNameRefusals call, top level, outside any CHECK branch, before the first lstat or write, and a non-empty result reaches couldNotRun", () => {
    const text = readFileSync(RENDER_JS, "utf8");
    const lines = text.split("\n");
    const close = lines.indexOf(EMBED_CLOSE);
    expect(close, "PREMISE: the committed trace-render.js carries the region's close line").toBeGreaterThan(0);
    const hand = lines.slice(close + 1).join("\n");
    const source = ts.createSourceFile("trace-render.js", hand, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
    const statements = [...source.statements];

    // Exactly one call, anywhere in the hand-written part.
    const calls: ts.CallExpression[] = [];
    const findCalls = (n: ts.Node): void => {
      if (ts.isCallExpression(n) && calledName(n) === "traceFileNameRefusals") calls.push(n);
      ts.forEachChild(n, findCalls);
    };
    findCalls(source);
    expect(calls).toHaveLength(1);
    const call = calls[0] as ts.CallExpression;

    // Its enclosing top-level statement, and no branch on CHECK on the way up.
    let node: ts.Node = call;
    while (node.parent !== undefined && node.parent !== source) {
      if (ts.isIfStatement(node.parent)) {
        expect(identifiersIn(node.parent.expression).has("CHECK"), "the call sits inside a branch on CHECK").toBe(false);
      }
      node = node.parent;
    }
    const callIndex = statements.indexOf(node as ts.Statement);
    expect(callIndex).toBeGreaterThanOrEqual(0);
    expect(ts.isFunctionDeclaration(node)).toBe(false);

    // The call initializes a top-level const.
    expect(ts.isVariableStatement(node)).toBe(true);
    const decl = call.parent;
    expect(ts.isVariableDeclaration(decl) && decl.initializer === call).toBe(true);
    expect(((node as ts.VariableStatement).declarationList.flags & ts.NodeFlags.Const) !== 0).toBe(true);
    const constName = ((decl as ts.VariableDeclaration).name as ts.Identifier).text;

    // The first top-level statement that inspects, writes, creates or removes a path.
    const firstEffect = statements.findIndex((s) => callsOutsideDeclarations(s).some((c) => PATH_EFFECT_CALLS.has(c)));
    expect(firstEffect, "PREMISE: the hand-written part touches a path at top level").toBeGreaterThan(0);
    expect(callIndex, "traceFileNameRefusals runs after the first path effect").toBeLessThan(firstEffect);

    // A top-level if on that const, before the first effect, whose then-branch calls couldNotRun.
    const guardIndex = statements.findIndex(
      (s, i) => i > callIndex && ts.isIfStatement(s) && identifiersIn(s.expression).has(constName),
    );
    expect(guardIndex, `no top-level if reads ${constName}`).toBeGreaterThan(callIndex);
    expect(guardIndex).toBeLessThan(firstEffect);
    const guard = statements[guardIndex] as ts.IfStatement;
    expect(identifiersIn(guard.expression).has("CHECK")).toBe(false);
    expect(callsOutsideDeclarations(guard.thenStatement)).toContain("couldNotRun");
  });
});

// ── Plan 37-28 (D-18, CR-03, READ-1 round 2): a dangling notes link is a failed task, never a task with no notes ──
// Round 1 closed the error-code form of CR-01. A link whose target is gone raises no error at the place that
// decided absence (realpath ENOENT, and a stat with throwIfNoEntry false, both answered "absent"), so the task
// read as zero notes and the write mode removed its trace file with exit 0. Only an lstat ENOENT is absence now
// (scripts/context-io.ts entryPresence); a link whose target cannot be reached is a failed task by name.

const CR03_POSITION = "scripts/runnable-ref/trace-render.test.ts: the CR-03 dangling notes link (plan 37-28)";
const CONTEXT_ROOT_RELS = [CONTEXT_REL, CONTEXT_ARCHIVE_REL] as const;

/** A repository state-check finds clean apart from its notes: the board, the NFR catalog, the progress file, the marker. */
function stateBaseRepo(marker: boolean): string {
  const root = repo();
  plantFile(root, BOARD_REL, "# Board\n\n## Ready (WIP unlimited)\n\n## Done (WIP unlimited)\n");
  plantFile(root, NFR_CATALOG_REL, "# NFR catalog\n");
  plantFile(root, PROGRESS_REL, "# Progress\n");
  if (marker) plantFile(root, LAYOUT_MARKER_REL, LAYOUT_MARKER_CONTENT);
  return root;
}

/** The four runs of one CR sequence: the write mode, --check, state-check --json and state-check text. */
type SequenceRuns = {
  write: { status: number | null; stdout: string; stderr: string };
  check: { status: number | null; stdout: string; stderr: string };
  json: { status: number | null; trace: TraceJson; raw: string };
  text: { status: number | null; stdout: string; stderr: string };
};

/** Run the write mode, --check and state-check (JSON and text) on `root`, in that order. */
function sequenceRuns(root: string): SequenceRuns {
  return { write: run(root), check: run(root, "--check"), json: stateCheckTrace(root), text: stateCheck(root) };
}

/**
 * The outcome every refused task entry must have (D-18, 33.1 DC-2): the write mode exits 2 with an empty stdout,
 * names the task on stderr and changes no byte; --check exits 2; state-check with the marker exits 1 with exactly
 * one trace-not-compared finding naming the task and never says fresh.
 */
function expectRefusedTask(
  root: string,
  runs: SequenceRuns,
  taskRel: string,
  before: ReadonlyMap<string, string>,
  indexBefore: string,
): void {
  const { write, check, json, text } = runs;
  expect(write.status, write.stdout + write.stderr).toBe(2);
  expect(write.stdout).toBe("");
  expect(write.stderr).toContain(`UNREADABLE TASK ${taskRel}: `);
  expect(write.stderr).toContain("nothing was written or removed");
  expect(write.stderr).not.toMatch(V8_FRAME);
  expect(treeDigest(root)).toEqual(before);
  expect(readFileSync(join(root, TRACEABILITY_REL), "utf8")).toBe(indexBefore);
  expect(check.status, check.stdout + check.stderr).toBe(2);
  expect(check.stdout).toBe("");
  expect(check.stderr).toContain(`UNREADABLE TASK ${taskRel}: `);
  expect(json.status, json.raw).toBe(1);
  expect(json.trace.compared).toBe(false);
  expect(json.trace.findings.map((f) => `${f.key}|${f.rel}`)).toEqual([`trace-not-compared|${taskRel}`]);
  expect(text.status, text.stdout + text.stderr).toBe(1);
  for (const out of [write.stdout, check.stdout, json.raw, text.stdout]) expect(out).not.toContain("The trace is fresh");
}

describe("CR-03: a dangling notes link is a failed task, never a task with no notes", () => {
  for (const rootRel of CONTEXT_ROOT_RELS) {
    it(`${rootRel}: render, rename the link's target, render again: exit 2 naming the task and the link, nothing removed, never fresh`, () => {
      const root = stateBaseRepo(true);
      const taskDir = join(root, ...rootRel.split("/"), "taskA");
      mkdirSync(join(taskDir, "real-notes"), { recursive: true });
      writeFileSync(join(taskDir, "real-notes", "n1.md"), noteText("n1", ["ABC-1", "src/a.ts"]));
      const skip = stageSymlinkOrSkip(
        join(taskDir, "real-notes"),
        join(taskDir, "notes"),
        "symlink to a directory inside the repository root",
        `${CR03_POSITION} (${rootRel})`,
      );
      if (skip !== null) {
        console.warn(skipLine(skip, "the CR-01 rows of this file (the same failed-task rule)"));
        return;
      }
      const first = run(root);
      expect(first.status, `PREMISE: the linked notes render: ${first.stdout}${first.stderr}`).toBe(0);
      expect(existsSync(join(root, TRACE_DIR_REL, "ABC-1.md")), "PREMISE: ABC-1.md was rendered").toBe(true);
      const premise = stateCheckTrace(root);
      expect(premise.status, `PREMISE: the rendered repository is clean: ${premise.raw}`).toBe(0);
      expect(premise.trace).toEqual({ compared: true, findings: [] });
      renameSync(join(taskDir, "real-notes"), join(taskDir, "moved-notes"));
      expect(lstatSync(join(taskDir, "notes")).isSymbolicLink(), "PREMISE: notes is still a link").toBe(true);
      expect(existsSync(join(taskDir, "notes")), "PREMISE: the link dangles").toBe(false);
      const before = treeDigest(root);
      const indexBefore = readFileSync(join(root, TRACEABILITY_REL), "utf8");
      expect(indexBefore).toContain("| ABC-1 | [ABC-1](traceability/ABC-1.md) |\n");
      const runs = sequenceRuns(root);
      expectRefusedTask(root, runs, `${rootRel}/taskA`, before, indexBefore);
      expect(runs.write.stderr).toContain("symbolic link");
      expect(runs.json.trace.findings[0]?.note).toContain("this task's notes could not be read");
      expect(runs.text.stdout).toMatch(new RegExp(`^FINDING {2}${rootRel.replace(/[.]/g, "\\.")}/taskA: .*\\(trace-not-compared\\)$`, "m"));
      // Without the D-14 marker, state-check warns and still never says fresh.
      rmSync(join(root, ...LAYOUT_MARKER_REL.split("/")));
      const warn = stateCheck(root);
      expect(warn.status, warn.stdout + warn.stderr).toBe(0);
      expect(warn.stdout).toMatch(new RegExp(`^WARN {5}${rootRel.replace(/[.]/g, "\\.")}/taskA: .*\\(trace-not-compared\\)$`, "m"));
      expect(warn.stdout).not.toContain("The trace is fresh");
      expect(treeDigest(root).get(`${TRACE_DIR_REL}/ABC-1.md`)).toBe(before.get(`${TRACE_DIR_REL}/ABC-1.md`));
    });
  }
});

// ── Plan 37-28 (D-18, CR-04, READ-1 round 2): every context-root entry is a task, a keeper, or a failed task ──
// The listing kept only Dirent directories, so a task directory replaced by a symbolic link was dropped with no
// count and no name, and the write mode removed its tickets' trace files with exit 0 (CR-04). Both runnables now
// list with the generated listContextTasks (every entry but keepers) and read with the generated readTaskNoteRefs,
// which refuses a symbolic link of any kind, a regular file, a FIFO and a vanished entry by name.

const CR04_POSITION = "scripts/runnable-ref/trace-render.test.ts: a context-root entry (plan 37-28, CR-04)";

/** A marked repository with one sealed note naming ABC-1 in `<rootRel>/taskA`, rendered, and state-check clean. */
function renderedTaskRepo(rootRel: string): { root: string; rootDir: string } {
  const root = stateBaseRepo(true);
  plant(root, rootRel, "taskA", "n1", noteText("n1", ["ABC-1", "src/a.ts"]));
  const first = run(root);
  expect(first.status, `PREMISE: the repository renders: ${first.stdout}${first.stderr}`).toBe(0);
  expect(existsSync(join(root, TRACE_DIR_REL, "ABC-1.md")), "PREMISE: ABC-1.md was rendered").toBe(true);
  const premise = stateCheckTrace(root);
  expect(premise.status, `PREMISE: the rendered repository is clean: ${premise.raw}`).toBe(0);
  expect(premise.trace).toEqual({ compared: true, findings: [] });
  return { root, rootDir: join(root, ...rootRel.split("/")) };
}

/** A shape planted at a task position: the entry's name, the words its refusal names, and its staging. */
type TaskShape = {
  readonly label: string;
  readonly name: string;
  readonly reason: string;
  readonly stage: (root: string, at: string, position: string) => SkipEntry | null;
};

/** Every non-directory shape a context-root entry can take (D-18, brief §1.1 non-error shapes). */
const TASK_SHAPES: readonly TaskShape[] = [
  {
    label: "a symbolic link to a regular file",
    name: "taskL",
    reason: "symbolic link",
    stage: (root, at, position) => {
      writeFileSync(join(root, "a-regular-file.txt"), "x\n");
      return stageSymlinkOrSkip(join(root, "a-regular-file.txt"), at, "symlink to a regular file", position);
    },
  },
  {
    label: "a dangling symbolic link",
    name: "taskD",
    reason: "symbolic link",
    stage: (root, at, position) => stageSymlinkOrSkip(join(root, "no-such-target"), at, "dangling symlink", position),
  },
  {
    label: "a regular file whose name does not begin with a dot",
    name: "taskB",
    reason: "not a directory",
    stage: (_root, at) => {
      writeFileSync(at, "not a task\n");
      return null;
    },
  },
  {
    label: "a FIFO",
    name: "taskC",
    reason: "not a directory",
    stage: (_root, at, position) => stageShapeOrSkip("FIFO", at, position),
  },
  {
    label: "a symbolic link named .gitkeep",
    name: ".gitkeep",
    reason: "symbolic link",
    stage: (root, at, position) => {
      writeFileSync(join(root, "a-keeper-target.txt"), "");
      return stageSymlinkOrSkip(join(root, "a-keeper-target.txt"), at, "symlink to a regular file", position);
    },
  },
];
let taskShapeRowsRun = 0;

describe("CR-04: a context-root entry that is not a task directory is a failed task, never dropped", () => {
  for (const rootRel of CONTEXT_ROOT_RELS) {
    it(`${rootRel}: taskA replaced by a link to an in-root directory holding the same note: exit 2 naming the link, nothing removed, never fresh`, () => {
      const { root, rootDir } = renderedTaskRepo(rootRel);
      renameSync(join(rootDir, "taskA"), join(root, "moved-task"));
      const skip = stageSymlinkOrSkip(
        join(root, "moved-task"),
        join(rootDir, "taskA"),
        "symlink to a directory inside the repository root",
        `${CR04_POSITION} (${rootRel})`,
      );
      if (skip !== null) {
        console.warn(skipLine(skip, "the task-position rows of this describe"));
        return;
      }
      expect(lstatSync(join(rootDir, "taskA")).isSymbolicLink(), "PREMISE: taskA is a link").toBe(true);
      expect(lstatSync(join(rootDir, "taskA", "notes", "n1.md")).isFile(), "PREMISE: the link reaches the same note").toBe(true);
      const before = treeDigest(root);
      const indexBefore = readFileSync(join(root, TRACEABILITY_REL), "utf8");
      const runs = sequenceRuns(root);
      expectRefusedTask(root, runs, `${rootRel}/taskA`, before, indexBefore);
      expect(runs.write.stderr).toContain("symbolic link, and a symbolic link is never read as a task");
      expect(runs.json.trace.findings[0]?.note).toContain("symbolic link");
      rmSync(join(root, ...LAYOUT_MARKER_REL.split("/")));
      const warn = stateCheck(root);
      expect(warn.status, warn.stdout + warn.stderr).toBe(0);
      expect(warn.stdout).toMatch(new RegExp(`^WARN {5}${rootRel.replace(/[.]/g, "\\.")}/taskA: .*\\(trace-not-compared\\)$`, "m"));
      expect(warn.stdout).not.toContain("The trace is fresh");
    });

    for (const shape of TASK_SHAPES) {
      it(`${rootRel}: ${shape.label} beside a rendered taskA is a failed task named on stderr and in trace-not-compared`, () => {
        taskShapeRowsRun += 1;
        const { root, rootDir } = renderedTaskRepo(rootRel);
        const skip = shape.stage(root, join(rootDir, shape.name), `${CR04_POSITION} (${shape.label}, ${rootRel})`);
        if (skip !== null) {
          console.warn(skipLine(skip, "the other task-position rows of this describe (the same failed-task rule)"));
          return;
        }
        const before = treeDigest(root);
        const indexBefore = readFileSync(join(root, TRACEABILITY_REL), "utf8");
        const runs = sequenceRuns(root);
        expectRefusedTask(root, runs, `${rootRel}/${shape.name}`, before, indexBefore);
        expect(runs.write.stderr).toContain(shape.reason);
        expect(runs.json.trace.findings[0]?.note).toContain(shape.reason);
      });
    }

    it(`CONTROL ${rootRel}: a regular .gitkeep and .DS_Store beside taskA are keepers: byte-identical trace, 1 task, fresh`, () => {
      const { root, rootDir } = renderedTaskRepo(rootRel);
      const without = snapshot(root);
      writeFileSync(join(rootDir, ".gitkeep"), "");
      writeFileSync(join(rootDir, ".DS_Store"), "Bud1 metadata\n");
      const write = run(root);
      expect(write.status, write.stdout + write.stderr).toBe(0);
      expect(write.stdout).toContain("Rendered the trace: 1 task(s) and 1 note(s) read;");
      expect(write.stdout).toContain("unreadable tasks 0; 0 file(s) written, 0 file(s) removed.");
      expect(snapshot(root)).toEqual(without);
      const check = run(root, "--check");
      expect(check.status, check.stdout + check.stderr).toBe(0);
      expect(check.stdout).toContain("The trace is fresh: 1 task(s)");
      const json = stateCheckTrace(root);
      expect(json.status, json.raw).toBe(0);
      expect(json.trace).toEqual({ compared: true, findings: [] });
      const text = stateCheck(root);
      expect(text.status, text.stdout + text.stderr).toBe(0);
      expect(text.stdout).toContain("The trace is fresh: 1 task(s)");
    });

    it(`CONTROL ${rootRel}: a directory .hidden-task holding a sealed note naming ABC-2 is a task, and ABC-2.md is rendered`, () => {
      const { root } = renderedTaskRepo(rootRel);
      plant(root, rootRel, ".hidden-task", "n2", noteText("n2", ["ABC-2"]));
      const write = run(root);
      expect(write.status, write.stdout + write.stderr).toBe(0);
      expect(write.stdout).toContain("Rendered the trace: 2 task(s) and 2 note(s) read;");
      expect(existsSync(join(root, TRACE_DIR_REL, "ABC-2.md"))).toBe(true);
      expect(stateCheckTrace(root).trace).toEqual({ compared: true, findings: [] });
    });
  }

  it("the task-position table ran every shape in both roots", () => {
    expect(TASK_SHAPES).toHaveLength(5);
    expect(taskShapeRowsRun).toBe(TASK_SHAPES.length * CONTEXT_ROOT_RELS.length);
  });
});

/** The hand-written part of a committed runnable .ts (after EMBED_CLOSE), as a syntax tree. */
function handWritten(rel: string): ts.SourceFile {
  const lines = readFileSync(join(import.meta.dirname, rel), "utf8").split("\n");
  const close = lines.indexOf(EMBED_CLOSE);
  expect(close, `PREMISE: ${rel} carries the region's close line`).toBeGreaterThan(0);
  return ts.createSourceFile(rel, lines.slice(close + 1).join("\n"), ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
}

/** Every call expression in a subtree. */
function callsIn(n: ts.Node, out: ts.CallExpression[] = []): ts.CallExpression[] {
  if (ts.isCallExpression(n)) out.push(n);
  ts.forEachChild(n, (c) => {
    callsIn(c, out);
  });
  return out;
}

/** The function bodies named `name`: a function declaration, or a const initialized with an arrow or a function. */
function functionsNamed(source: ts.SourceFile, name: string): ts.Node[] {
  const out: ts.Node[] = [];
  const visit = (n: ts.Node): void => {
    if (ts.isFunctionDeclaration(n) && n.name?.text === name) out.push(n);
    if (
      ts.isVariableDeclaration(n) &&
      ts.isIdentifier(n.name) &&
      n.name.text === name &&
      n.initializer !== undefined &&
      (ts.isArrowFunction(n.initializer) || ts.isFunctionExpression(n.initializer))
    ) {
      out.push(n.initializer);
    }
    ts.forEachChild(n, visit);
  };
  visit(source);
  return out;
}

/** The hand-written task read and listing of each runnable. */
const CENSUS_WRAPPERS: Record<string, readonly string[]> = {
  "trace-render.ts": ["readTask", "listTasks"],
  "state-check.ts": ["readTraceTask", "listTasks"],
};

describe("CR-04 census: no hand-written part of either runnable decides whether a task or its notes are present", () => {
  for (const [rel, wrappers] of Object.entries(CENSUS_WRAPPERS)) {
    it(`${rel}: readTaskNoteRefs and listContextTasks are each called once, the wrappers make no node:fs call, and nothing passes withFileTypes`, () => {
      const source = handWritten(rel);
      const calls = callsIn(source);
      expect(calls.filter((c) => calledName(c) === "readTaskNoteRefs"), "readTaskNoteRefs calls").toHaveLength(1);
      expect(calls.filter((c) => calledName(c) === "listContextTasks"), "listContextTasks calls").toHaveLength(1);
      for (const wrapper of wrappers) {
        const bodies = functionsNamed(source, wrapper);
        expect(bodies, `PREMISE: ${rel} has one hand-written ${wrapper}`).toHaveLength(1);
        const fsCalls = callsIn(bodies[0] as ts.Node).filter(
          (c) =>
            ts.isPropertyAccessExpression(c.expression) &&
            ts.isIdentifier(c.expression.expression) &&
            c.expression.expression.text === "nodeFs",
        );
        expect(fsCalls.map((c) => c.getText(source)), `${rel} ${wrapper} makes a node:fs call of its own`).toEqual([]);
      }
      const withFileTypes = calls.filter((c) =>
        c.arguments.some(
          (a) =>
            ts.isObjectLiteralExpression(a) &&
            a.properties.some((p) => p.name !== undefined && ts.isIdentifier(p.name) && p.name.text === "withFileTypes"),
        ),
      );
      expect(withFileTypes.map((c) => c.getText(source)), `${rel} passes withFileTypes`).toEqual([]);
    });
  }
});
