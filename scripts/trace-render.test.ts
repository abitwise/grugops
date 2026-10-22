// trace-render.test.ts — grugops's own trace render command (phase 37, plan 37-08, SPLIT-03, D-01).
//
// scripts/trace-render.js holds no trace logic: it runs the committed host runnable
// scripts/runnable-ref/trace-render.js against the repository root and exits with its code. These cases
// prove it on a temp MIRROR: the wrapper's import closure (derived by jsImportClosure, never listed) and the
// runnable are copied into an mkdtempSync directory, sealed notes are planted beside them, and the mirrored
// wrapper is run, so the root it derives from import.meta.dirname is the mirror. Nothing is written into this
// repository's tree. The rendering itself is proved in scripts/runnable-ref/trace-render.test.ts.
//
// Proves:
//   one program   : the wrapper writes the same bytes the runnable writes for the same notes.
//   passthrough   : --check passes the runnable's exit 0, 1 and 2 through unchanged.
//   refusals      : an argument other than one --check is exit 2 and nothing is written.
//   mapping       : a run with no exit code, or a spawn error, is exit 2, never a pass.
//   no logic      : the wrapper's closure holds neither the trace model nor the note reader.

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
import { CONTEXT_REL, STATE_ROOT_REL, TRACE_DIR_REL, TRACEABILITY_REL } from "../install/state-layout.js";
import { jsImportClosure } from "./js-import-closure.js";
import { traceFileName } from "./trace-model.js";

const ROOT = join(import.meta.dirname, "..");
const WRAPPER_REL = "scripts/trace-render.js";

const mod: typeof import("./trace-render.js") = await import(pathToFileURL(join(ROOT, WRAPPER_REL)).href);
const ctxio: typeof import("./context-io.js") = await import(pathToFileURL(join(ROOT, "scripts", "context-io.js")).href);

const tmpDirs: string[] = [];
function freshTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpDirs.push(d);
  return d;
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

/** A sealed note carrying `refs`, planted under `<root>/.grugops/context/<task>/notes/<name>.md`. */
function plantNote(root: string, task: string, name: string, refs: readonly string[]): void {
  const dir = join(root, CONTEXT_REL, task, "notes");
  mkdirSync(dir, { recursive: true });
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
  const text = "---\n" + fence + `${ctxio.NOTE_SEAL_KEY}: ${ctxio.noteSeal("---\n" + fence + rest)}\n` + rest;
  writeFileSync(join(dir, `${name}.md`), text, "utf8");
}

/** The same two notes, planted into any root. */
function plantFixtureNotes(root: string): void {
  plantNote(root, "taskA", "n1", ["ABC-001", "NFR-002", "src/a.ts", "a.spec.ts", "REL-0007"]);
  plantNote(root, "taskB", "n2", ["ABC-002", "src/b|c.ts", "UAT-12"]);
}

/** A mirror: the wrapper's closure and the runnable, plus the state directory and the fixture notes. */
function mirror(prefix: string): string {
  const root = freshTmp(prefix);
  for (const rel of [...jsImportClosure(ROOT, WRAPPER_REL), mod.TRACE_RUNNABLE_REL]) {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    copyFileSync(join(ROOT, rel), join(root, rel));
  }
  mkdirSync(join(root, STATE_ROOT_REL), { recursive: true });
  plantFixtureNotes(root);
  return root;
}

function runWrapper(root: string, ...args: string[]): { status: number | null; out: string } {
  const r = spawnSync(process.execPath, [join(root, WRAPPER_REL), ...args], { encoding: "utf8", cwd: tmpdir() });
  return { status: r.status, out: (r.stdout ?? "") + (r.stderr ?? "") };
}

/** A regular file's bytes, read only after lstat confirms it is one; anything else is named, never opened. */
function entryOf(abs: string): string {
  return lstatSync(abs).isFile() ? readFileSync(abs, "utf8") : "<not a regular file>";
}

/** The index and every entry of the trace directory, as path → bytes. */
function traceTree(root: string): Map<string, string> {
  const out = new Map<string, string>();
  const index = join(root, TRACEABILITY_REL);
  if (existsSync(index)) out.set(TRACEABILITY_REL, entryOf(index));
  const dir = join(root, TRACE_DIR_REL);
  if (existsSync(dir) && lstatSync(dir).isDirectory()) {
    for (const f of readdirSync(dir).sort()) out.set(`${TRACE_DIR_REL}/${f}`, entryOf(join(dir, f)));
  }
  return out;
}

describe("trace-render.js — the own command runs the host runnable, and holds no trace logic (D-01)", () => {
  it("the wrapper writes the same bytes the runnable writes for the same notes", () => {
    const m = mirror("trace-wrapper-mirror-");
    const w = runWrapper(m);
    expect(w.status, w.out).toBe(0);

    const direct = freshTmp("trace-wrapper-direct-");
    mkdirSync(join(direct, STATE_ROOT_REL), { recursive: true });
    plantFixtureNotes(direct);
    const r = spawnSync(process.execPath, [join(ROOT, mod.TRACE_RUNNABLE_REL), direct], { encoding: "utf8" });
    expect(r.status, `${r.stdout}${r.stderr}`).toBe(0);

    const fromWrapper = traceTree(m);
    expect([...fromWrapper.keys()], "PREMISE: the wrapper rendered the index and both trace files").toEqual([
      TRACEABILITY_REL,
      `${TRACE_DIR_REL}/${traceFileName("ABC-001")}`,
      `${TRACE_DIR_REL}/${traceFileName("ABC-002")}`,
    ]);
    expect(fromWrapper).toEqual(traceTree(direct));
  });

  it("--check passes the runnable's exit code through: 0 fresh, 1 stale, 2 could not run", () => {
    const m = mirror("trace-wrapper-check-");
    expect(runWrapper(m).status).toBe(0);
    const fresh = runWrapper(m, "--check");
    expect(fresh.status, fresh.out).toBe(0);

    const rel = `${TRACE_DIR_REL}/${traceFileName("ABC-001")}`;
    writeFileSync(join(m, rel), entryOf(join(m, rel)).replace("src/a.ts", "src/A.ts"), "utf8");
    const stale = runWrapper(m, "--check");
    expect(stale.status, stale.out).toBe(1);
    expect(stale.out).toContain(`CHANGED ${rel}`);

    rmSync(join(m, STATE_ROOT_REL), { recursive: true, force: true });
    expect(runWrapper(m, "--check").status).toBe(2);
    expect(runWrapper(m).status).toBe(2);
  });

  it("an argument other than one --check is exit 2, and nothing is written", () => {
    const m = mirror("trace-wrapper-args-");
    for (const args of [["--bogus"], ["--check", "--check"], [m]]) {
      const r = runWrapper(m, ...args);
      expect(r.status, `${args.join(" ")}: ${r.out}`).toBe(2);
      expect(r.out).toContain("usage: node scripts/trace-render.js [--check]");
    }
    expect(traceTree(m).size, "nothing was rendered").toBe(0);
  });

  it("the exit mapping: the runnable's code passes through; no code, or a spawn error, is exit 2", () => {
    expect(mod.childExitCode({ status: 0 })).toBe(0);
    expect(mod.childExitCode({ status: 1 })).toBe(1);
    expect(mod.childExitCode({ status: 2 })).toBe(2);
    expect(mod.childExitCode({ status: null })).toBe(2);
    expect(mod.childExitCode({ status: 0, error: new Error("spawn ENOENT") })).toBe(2);
    expect(mod.runnableArgs("/r", [])).toEqual(["/r"]);
    expect(mod.runnableArgs("/r", ["--check"])).toEqual(["/r", "--check"]);
    expect(mod.runnableArgs("/r", ["--check", "x"])).toBeNull();
  });

  it("the wrapper's import closure holds neither the trace model nor the note reader", () => {
    const closure = [...jsImportClosure(ROOT, WRAPPER_REL)];
    expect(closure, "PREMISE: the closure holds the wrapper itself").toContain(WRAPPER_REL);
    expect(closure).not.toContain("scripts/trace-model.js");
    expect(closure).not.toContain("scripts/context-io.js");
  });
});
