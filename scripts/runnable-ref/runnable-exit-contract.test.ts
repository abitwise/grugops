// runnable-exit-contract.test.ts — EXIT-1 for the three phase-37 runnables (plan 37-20, D-12, D-17,
// 37-GAP-PLANNING-BRIEF.md §1 EXIT-1 and §2.1).
//
// THE RULE. Every runnable whose header promises exit 2 for could-not-run maps any throw that escapes every inner
// catch to exit 2, an empty stdout and one stderr line that starts `Error: ` and ends with the runnable's own
// could-not-run sentence. Exit 1 means only "a finding": a crash that exits 1 is read by trace-freshness, Workflow
// 05 and Workflow 09 as a finding, and gets the wrong remedy.
//
// HOW A THROW IS FORCED. Each runnable is the COMMITTED .js copied alone into a scratch directory (the hostCopy
// pattern of the per-runnable tests) and run with a test preload from scripts/fault-inject.test-support.ts, loaded
// with `node --import`, outside the program. A stdout write that throws synchronously reaches each runnable's last
// statement, past every inner catch. Two further rows inject an EIO at one node:fs call by line: the symbolic-link
// follow-up statSync in trace-render's realDirectoryOrNull (TR-6), and the realpathSync after state-roll creates
// its archive directory (SR-8). Plan 37-25 replaces the two line lookups with the derived site table.
//
// THE MESSAGE NEVER DENIES A WRITE. state-roll names a roll already written and proven, and says `No roll had
// started.` only when none had; trace-render names the files it wrote and removed before it stopped.
//
// NOT TESTED HERE, NAMED: a throw inside the handler's own stderr write ends the process with Node's own non-zero
// code (7), never exit 0; no test forces a failing stderr write portably (backstop truth of plan 37-20).

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { copyFileSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { skipLine, stageSymlinkOrSkip } from "../check-platform-shapes.js";
import {
  BOARD_DONE_ARCHIVE_REL,
  BOARD_REL,
  BUDGETS,
  CONTEXT_ARCHIVE_REL,
  CONTEXT_REL,
  LAYOUT_MARKER_CONTENT,
  LAYOUT_MARKER_REL,
  TRACE_DIR_REL,
} from "../../install/state-layout.js";
import {
  FAULT_LOG_ENV,
  FAULT_SPEC_ENV,
  INJECTED_STDOUT_MESSAGE,
  hasNodeStack,
  runFaulted,
  scriptUrl,
  treeDigest,
  type FaultedRun,
} from "../fault-inject.test-support.js";

const HERE = import.meta.dirname;
const RUNNABLES = ["trace-render", "state-check", "state-roll"] as const;
type Runnable = (typeof RUNNABLES)[number];

/** Each runnable's could-not-run sentence for an unexpected throw: the last words of its one stderr line. */
const STOPPED: Record<Runnable, { readonly opens: string; readonly ends: string }> = {
  "trace-render": { opens: "Error: the trace render stopped unexpectedly (", ends: " The trace render did not finish.\n" },
  "state-check": { opens: "Error: the state check stopped unexpectedly (", ends: " The state check did not run.\n" },
  "state-roll": { opens: "Error: the roll stopped unexpectedly (", ends: " The roll did not finish.\n" },
};

const ctxio: typeof import("../context-io.js") = await import(pathToFileURL(join(HERE, "..", "context-io.js")).href);

const tmpRoots: string[] = [];
afterAll(() => {
  for (const d of tmpRoots) rmSync(d, { recursive: true, force: true });
});

function mkTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpRoots.push(d);
  return d;
}

/** The committed .js of `name`, copied alone into an empty scratch directory. */
function hostCopy(name: Runnable): string {
  const js = join(mkTmp(`grugops-exit-contract-${name}-`), `${name}.js`);
  copyFileSync(join(HERE, `${name}.js`), js);
  return js;
}

const HOST: Record<Runnable, string> = {
  "trace-render": hostCopy("trace-render"),
  "state-check": hostCopy("state-check"),
  "state-roll": hostCopy("state-roll"),
};

/** Run a runnable unfaulted (a fixture premise). */
function runPlain(name: Runnable, ...args: string[]): { status: number | null; stdout: string; stderr: string } {
  const r = spawnSync(process.execPath, [HOST[name], ...args], { encoding: "utf8", cwd: dirname(HOST[name]) });
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

/** Run a runnable with `spec` injected by the test preload. */
function runWith(name: Runnable, args: readonly string[], spec: Parameters<typeof runFaulted>[2]): FaultedRun {
  return runFaulted(HOST[name], args, spec, { scratch: mkTmp("grugops-exit-contract-fault-"), cwd: dirname(HOST[name]) });
}

/** The EXIT-1 shape every row shares: exit 2, empty stdout, one `Error: ` line ending in the sentence, no stack. */
function expectStopped(name: Runnable, r: FaultedRun): void {
  const all = `status ${r.status}\nstdout:\n${r.stdout}\nstderr:\n${r.stderr}`;
  expect(r.fired, `PREMISE: the injected fault fired (site-not-via ${r.siteNotVia})\n${all}`).toBeGreaterThan(0);
  expect(r.status, all).toBe(2);
  expect(r.stdout, all).toBe("");
  expect(hasNodeStack(r.stderr), all).toBe(false);
  expect(r.stderr.startsWith(STOPPED[name].opens), all).toBe(true);
  expect(r.stderr.endsWith(STOPPED[name].ends), all).toBe(true);
  expect(r.stderr.split("\n").filter((l) => l !== ""), all).toHaveLength(1);
}

/** The text of a sealed note carrying `refs`, sealed through the committed seal export. */
function noteText(name: string, refs: readonly string[]): string {
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
  return "---\n" + fence + `${ctxio.NOTE_SEAL_KEY}: ${ctxio.noteSeal("---\n" + fence + rest)}\n` + rest;
}

/** Plant a sealed note under `<root>/<contextRel>/<task>/notes/<name>.md`. */
function plant(root: string, contextRel: string, task: string, name: string, refs: readonly string[]): void {
  const dir = join(root, contextRel, task, "notes");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${name}.md`), noteText(name, refs), "utf8");
}

/** A repository with one sealed note for ABC-001 in the live root and one for ABC-002 only in the archive. */
function twoRootRepo(): string {
  const root = mkTmp("grugops-exit-contract-trace-");
  mkdirSync(join(root, dirname(TRACE_DIR_REL)), { recursive: true });
  plant(root, CONTEXT_REL, "taskA", "n1", ["ABC-001", "src/a.ts"]);
  plant(root, CONTEXT_ARCHIVE_REL, "taskB", "n2", ["ABC-002", "#41"]);
  return root;
}

/** A ticket row of the board grammar. */
function row(n: number): string {
  return `- [ABC-${String(n).padStart(3, "0")}] finished ticket ${n}  (engineer, 2026-10-${String((n % 28) + 1).padStart(2, "0")})`;
}

/** A repository whose board's Done column holds `count` rows, newest first, and nothing else. */
function boardRepo(count: number): string {
  const root = mkTmp("grugops-exit-contract-roll-");
  mkdirSync(join(root, dirname(BOARD_REL)), { recursive: true });
  const board = [
    "# Board",
    "_Updated: 2026-10-22 by orchestrator_",
    "",
    "## In Development (WIP 0/3)",
    "",
    "## Done (WIP unlimited)",
    "",
    ...Array.from({ length: count }, (_, i) => row(i + 1)),
    "",
    "## Blocked (visible, time-tracked)",
    "",
  ].join("\n");
  writeFileSync(join(root, BOARD_REL), board, "utf8");
  return root;
}

/** The 1-based line of the one line of the copied `name` .js that contains `needle`; it must be unique. */
function lineOf(name: Runnable, needle: string): number {
  const lines = readFileSync(HOST[name], "utf8").split("\n");
  const at = lines.flatMap((l, i) => (l.includes(needle) ? [i + 1] : []));
  expect(at, `PREMISE: exactly one line of ${name}.js holds ${needle}`).toHaveLength(1);
  return at[0] as number;
}

const STDOUT_THROW = { kind: "stdout-throw" } as const;

describe("EXIT-1: an unexpected throw past every inner catch is exit 2 in every runnable and mode", () => {
  it("trace-render write mode: exit 2, and the message names the files written before it stopped", () => {
    const root = twoRootRepo();
    const r = runWith("trace-render", [root], STDOUT_THROW);
    expectStopped("trace-render", r);
    expect(r.stderr).toContain(`stopped unexpectedly (${INJECTED_STDOUT_MESSAGE}).`);
    expect(r.stderr).toContain("3 file(s) written and 0 file(s) removed before it stopped; run with --check to compare.");
    expect(r.stderr).not.toContain("Nothing was written");
  });

  it("trace-render --check: exit 2, and nothing was written or removed", () => {
    const root = twoRootRepo();
    expect(runPlain("trace-render", root).status, "PREMISE: the fixture renders").toBe(0);
    const before = treeDigest(root);
    const r = runWith("trace-render", [root, "--check"], STDOUT_THROW);
    expectStopped("trace-render", r);
    expect(r.stderr).toContain("Nothing was written or removed.");
    expect(treeDigest(root)).toEqual(before);
  });

  for (const args of [[], ["--json"]] as const) {
    it(`state-check ${args.length === 0 ? "text" : "--json"}: exit 2 on a throw at its output tail`, () => {
      const root = mkTmp("grugops-exit-contract-check-");
      mkdirSync(dirname(join(root, LAYOUT_MARKER_REL)), { recursive: true });
      writeFileSync(join(root, LAYOUT_MARKER_REL), `${LAYOUT_MARKER_CONTENT}\n`, "utf8");
      const r = runWith("state-check", [root, ...args], STDOUT_THROW);
      expectStopped("state-check", r);
      expect(r.stderr).toContain(`stopped unexpectedly (${INJECTED_STDOUT_MESSAGE}).`);
    });
  }

  it("state-roll write mode after a Done roll was written and proven: exit 2, and the message names that roll", () => {
    const root = boardRepo(BUDGETS.doneRows + 1);
    const r = runWith("state-roll", [root], STDOUT_THROW);
    expectStopped("state-roll", r);
    expect(r.stderr).toContain("The Done roll was written and proven and stays: 1 Done row(s)");
    expect(r.stderr).toContain(`ABC-${String(BUDGETS.doneRows + 1).padStart(3, "0")}`);
    expect(r.stderr).not.toContain("No roll had started");
    // The roll the message names is on disk.
    expect(lstatSync(join(root, BOARD_DONE_ARCHIVE_REL)).isFile()).toBe(true);
  });

  it("state-roll --dry-run: exit 2, and the message says no roll had started", () => {
    const root = boardRepo(BUDGETS.doneRows + 1);
    const before = treeDigest(root);
    const r = runWith("state-roll", [root, "--dry-run"], STDOUT_THROW);
    expectStopped("state-roll", r);
    expect(r.stderr).toContain(" No roll had started.");
    expect(treeDigest(root)).toEqual(before);
  });
});

describe("EXIT-1: a failing follow-up read after a symbolic link or a created directory is exit 2 by name", () => {
  it("TR-6: an EIO at the follow-up statSync of a symbolic-link context root is exit 2 naming the root", () => {
    const root = twoRootRepo();
    const target = join(root, "elsewhere-context");
    mkdirSync(target);
    rmSync(join(root, CONTEXT_ARCHIVE_REL), { recursive: true });
    const skipped = stageSymlinkOrSkip(
      target,
      join(root, CONTEXT_ARCHIVE_REL),
      "symlink to a directory inside the repository root",
      "scripts/runnable-ref/runnable-exit-contract.test.ts: TR-6, a symbolic-link archive context root (plan 37-20)",
    );
    if (skipped !== null) {
      console.warn(skipLine(skipped, "the CR-02 cases in scripts/runnable-ref/trace-render.test.ts (the same couldNotRun)"));
      return;
    }
    const site = { url: scriptUrl(HOST["trace-render"]), line: lineOf("trace-render", "st = nodeFs.statSync(real);") };
    const before = treeDigest(root);
    const r = runWith("trace-render", [root], { kind: "fs", fn: "statSync", site, code: "EIO" });
    const all = `status ${r.status}\nstdout:\n${r.stdout}\nstderr:\n${r.stderr}`;
    expect(r.fired, `PREMISE: the fault fired (site-not-via ${r.siteNotVia})\n${all}`).toBeGreaterThan(0);
    expect(r.status, all).toBe(2);
    expect(r.stdout, all).toBe("");
    expect(hasNodeStack(r.stderr), all).toBe(false);
    expect(r.stderr, all).toContain(`the context root ${CONTEXT_ARCHIVE_REL} cannot be inspected (EIO)`);
    expect(treeDigest(root)).toEqual(before);
  });

  it("SR-8: an EIO at the realpathSync after state-roll creates its archive directory leaves the tree unchanged", () => {
    const root = boardRepo(BUDGETS.doneRows + 1);
    const before = treeDigest(root);
    const site = { url: scriptUrl(HOST["state-roll"]), line: lineOf("state-roll", "realpathSync(archiveDirPath)") };
    const r = runWith("state-roll", [root], { kind: "fs", fn: "realpathSync", site, code: "EIO" });
    const all = `status ${r.status}\nstdout:\n${r.stdout}\nstderr:\n${r.stderr}`;
    expect(r.fired, `PREMISE: the fault fired (site-not-via ${r.siteNotVia})\n${all}`).toBeGreaterThan(0);
    expect(r.status, all).toBe(2);
    expect(r.stdout, all).toBe("");
    expect(hasNodeStack(r.stderr), all).toBe(false);
    expect(r.stderr, all).toContain("cannot be resolved after it was created (EIO)");
    expect(treeDigest(root), "no archive directory is left behind").toEqual(before);
  });
});

describe("EXIT-1 census: one handler per runnable, before argv, and no fault switch in any shipped file", () => {
  for (const name of RUNNABLES) {
    it(`${name}: process.on("uncaughtException" appears once, before the first process.argv; no fault switch`, () => {
      for (const ext of [".ts", ".js"]) {
        const src = readFileSync(join(HERE, `${name}${ext}`), "utf8");
        const registrations = src.split('process.on("uncaughtException"').length - 1;
        expect(registrations, `${name}${ext}: handler registrations`).toBe(1);
        const handlerAt = src.indexOf('process.on("uncaughtException"');
        const argvAt = src.indexOf("process.argv");
        expect(argvAt, `PREMISE: ${name}${ext} reads process.argv`).toBeGreaterThan(-1);
        expect(handlerAt, `${name}${ext}: the handler is registered before argv is read`).toBeLessThan(argvAt);
        expect(src.includes(FAULT_SPEC_ENV), `${name}${ext} names ${FAULT_SPEC_ENV}`).toBe(false);
        expect(src.includes(FAULT_LOG_ENV), `${name}${ext} names ${FAULT_LOG_ENV}`).toBe(false);
      }
    });
  }
});
