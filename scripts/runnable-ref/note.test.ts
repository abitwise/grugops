// note.test.ts — the host note writer (phase 41, plan 41-07, RUN-02, RUN-05, D-28, D-35).
//
// Every case runs the COMMITTED note.js and the COMMITTED claim.js copied into one empty temporary directory beside
// only a package.json, with no node_modules and no sibling script reachable: the host emulation that proves a spawned
// role with no MCP tool can write the sealed note `claim.js done` requires. This file imports nothing from the
// context-io module. That import is how the validation map went green while the truth failed (41-VERIFICATION.md), so
// the one reach into the authority is `node scripts/context-io.js` run as a child process: its `validate` verb judges a
// written note, and its `emit-verdict` verb stages the live green verdict a control case needs, because a sealed
// verdict has no other honest source.
//
//   exit 0 → stdout holds `noted FOLDER ID`
//   exit 1 → an outcome to act on: `refused FOLDER: REASON`, and nothing was written
//   exit 2 → could not run or refused, with nothing on stdout and one `Error: ` line on stderr

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import {
  appendFileSync,
  chmodSync,
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  renameSync,
  rmSync,
  truncateSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hostCapabilityOrSkip, skipLine, stageShapeOrSkip, stageSymlinkOrSkip } from "../check-platform-shapes.js";
import { treeDigest } from "../fault-inject.test-support.js";
import { AGENT_ADAPTER_PREFIX } from "../kit-model.js";
import { CONTEXT_REL, GRUGOPS_DIR_REL, QUEUE_CLAIMED_REL, QUEUE_DONE_REL, QUEUE_PENDING_REL } from "../../install/state-layout.js";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const CONTEXT_IO_JS = join(REPO_ROOT, "scripts", "context-io.js");

const tmpRoots: string[] = [];
afterAll(() => {
  for (const d of tmpRoots) rmSync(d, { recursive: true, force: true });
});

function mkTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpRoots.push(d);
  return d;
}

let hostMemo: string | undefined;

/** Both committed programs, copied into one empty directory beside only a package.json. */
function hostDir(): string {
  if (hostMemo !== undefined) return hostMemo;
  const host = mkTmp("grugops-note-host-");
  for (const name of ["claim.js", "note.js"]) {
    const committed = join(import.meta.dirname, name);
    expect(existsSync(committed), `the committed program ${name} exists`).toBe(true);
    copyFileSync(committed, join(host, name));
  }
  writeFileSync(join(host, "package.json"), '{"type":"module"}\n');
  hostMemo = host;
  return host;
}

/** The ambient names that would answer the dial before the fixture does. */
const AMBIENT_ROOT_NAMES = new Set(["CLAUDE_PROJECT_DIR", "GRUGOPS_PROJECT_DIR", "GRUGOPS_HOST_DELIVERED_ROOT"]);

/** This process's environment without those names, so the dial comes from the fixture. */
const HOST_ENV = Object.fromEntries(Object.entries(process.env).filter(([name]) => !AMBIENT_ROOT_NAMES.has(name)));

interface Ran {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

/** One host program run with its working directory in `cwd`, under `env`. */
function hostUnder(env: NodeJS.ProcessEnv, program: "claim.js" | "note.js", cwd: string, ...args: string[]): Ran {
  const r = spawnSync(process.execPath, [join(hostDir(), program), ...args], { encoding: "utf8", cwd, env, timeout: 15_000 });
  expect(r.error, "the program did not finish in bounded time").toBeUndefined();
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

const claim = (cwd: string, ...args: string[]): Ran => hostUnder(HOST_ENV, "claim.js", cwd, ...args);
const note = (cwd: string, ...args: string[]): Ran => hostUnder(HOST_ENV, "note.js", cwd, ...args);

function subtask(task: string): string {
  return `# subtask ${task}\nref: .grugops/context/${task}/\n`;
}

/** A repository whose pending stage holds each of `tasks`. */
function repo(...tasks: string[]): string {
  const root = mkTmp("grugops-note-repo-");
  mkdirSync(join(root, GRUGOPS_DIR_REL));
  mkdirSync(join(root, QUEUE_PENDING_REL), { recursive: true });
  for (const task of tasks) writeFileSync(join(root, QUEUE_PENDING_REL, `${task}.md`), subtask(task));
  return root;
}

/** The flags of a routine note that every case below varies from. */
const OBSERVATION = ["--kind", "observation", "--by", "qe-e2e", "--confidence", "high", "--ref", "ABC-1", "--body", "x"];

/** The directory the notes of `folder` land in. */
const notesDir = (root: string, folder: string): string => join(root, CONTEXT_REL, folder, "notes");

/** The note files of `folder`, in name order; none when the directory is absent. */
function noteFiles(root: string, folder: string): string[] {
  const dir = notesDir(root, folder);
  return existsSync(dir) ? readdirSync(dir).sort() : [];
}

/** The number `free` prints, read from its one line. */
function freeCount(root: string): number {
  const r = claim(root, "free");
  expect(r.status, r.stderr).toBe(0);
  const m = /^free (-?\d+)/.exec(r.stdout);
  expect(m, r.stdout).not.toBeNull();
  return Number((m as RegExpExecArray)[1]);
}

describe("the lone host copy (D-35, CR-01)", () => {
  it("a lone host copy takes a claimed task from not-done to done through note.js", () => {
    const root = repo("t1");
    const before = freeCount(root);

    const claimed = claim(root, "claim", "t1", "--by", "grugops-qe-e2e");
    expect(claimed.status, claimed.stderr).toBe(0);
    expect(freeCount(root)).toBe(before - 1);

    const early = claim(root, "done", "t1");
    expect(early.status).toBe(1);
    expect(early.stdout).toMatch(/^not-done t1: no sealed note/);

    const written = note(root, "add", "t1", ...OBSERVATION);
    expect(written.status, written.stderr).toBe(0);
    expect(written.stdout).toMatch(/^noted t1 \S+\n$/);
    expect(written.stderr).toBe("");

    const finished = claim(root, "done", "t1");
    expect(finished.status, finished.stderr).toBe(0);
    expect(finished.stdout).toBe("done t1\n");
    expect(existsSync(join(root, QUEUE_DONE_REL, "t1.md"))).toBe(true);
    expect(existsSync(join(root, QUEUE_CLAIMED_REL, "t1"))).toBe(false);
    expect(freeCount(root)).toBe(before);
  });

  it("a hand-written note stays unsealed: alone it gets not-done naming it, and beside a note.js note it is not read", () => {
    const root = repo("t1");
    expect(claim(root, "claim", "t1", "--by", "grugops-qe-e2e").status).toBe(0);
    mkdirSync(notesDir(root, "t1"), { recursive: true });
    const hand = "20260101T000000Z-qe-e2e-observation-abcd.md";
    writeFileSync(
      join(notesDir(root, "t1"), hand),
      "---\nkind: observation\nby: qe-e2e\nat: 2099-01-01T00:00:00.000Z\nconfidence: high\n---\n\nby hand\n",
    );

    const refused = claim(root, "done", "t1");
    expect(refused.status).toBe(1);
    expect(refused.stdout).toContain("unsealed");
    expect(refused.stdout).toContain(hand);

    const written = note(root, "add", "t1", ...OBSERVATION);
    expect(written.status, written.stderr).toBe(0);
    const id = (written.stdout.trim().split(" ")[2] as string).trim();
    const index = readFileSync(join(root, CONTEXT_REL, "t1", "index.jsonl"), "utf8");
    expect(index, "the sealed note is indexed").toContain(id);
    expect(index, "the hand-written note is not").not.toContain("abcd");
  });

  it("the note file's fence ends in one seal line, and the authority's own validate accepts the file", () => {
    const root = repo();
    const written = note(root, "add", "t1", ...OBSERVATION);
    expect(written.status, written.stderr).toBe(0);
    const id = written.stdout.trim().split(" ")[2] as string;
    const file = join(notesDir(root, "t1"), `${id}.md`);
    expect(noteFiles(root, "t1")).toEqual([`${id}.md`]);

    const fence = readFileSync(file, "utf8").split("\n---\n")[0] as string;
    const lines = fence.split("\n");
    expect(lines[lines.length - 1]).toMatch(/^seal: sha256:[0-9a-f]{64}$/);
    expect(lines.filter((l) => l.startsWith("seal:"))).toHaveLength(1);

    const validated = spawnSync(process.execPath, [CONTEXT_IO_JS, "validate", file], { encoding: "utf8", timeout: 15_000 });
    expect(validated.status, validated.stdout + validated.stderr).toBe(0);
  });

  it("the writer's refusal is one line on stdout and exit 1, and writes nothing", () => {
    const root = repo();
    const refused = note(root, "add", "t1", "--kind", "finding", "--by", "qe-e2e", "--confidence", "high", "--body", "x");
    expect(refused.status).toBe(1);
    expect(refused.stderr).toBe("");
    expect(refused.stdout).toMatch(/^refused t1: .+\n$/);
    expect(refused.stdout.trimEnd().split("\n")).toHaveLength(1);
    expect(existsSync(join(root, CONTEXT_REL)), "nothing was written").toBe(false);
  });
});

// ── Task 2: every field, every refusal and the exit contract ──────────────────────────────────────────────────────

const CONFIG_REL = `${GRUGOPS_DIR_REL}/factory.config.json`;
const LEDGER_REL = `${GRUGOPS_DIR_REL}/audit/admissions.jsonl`;
const SHA = "abcdef1234567";
const CONTENT_HASH = "0123456789abcdef";

/** The note.js ceiling, read from the committed text so this file imports nothing from the authority. */
const CEILING_BYTES = 8 * 1024 * 1024;

/** What a run did, on one line, for an assertion message. */
function described(r: Ran): string {
  return `status ${String(r.status)}; stdout ${r.stdout.trimEnd()}; stderr ${r.stderr.trimEnd()}`.replace(/\n/g, " | ");
}

/** The exit-2 shape: exit 2, an empty stdout, one line on stderr that starts `Error: `. */
function expectCouldNotRun(r: Ran, ...phrases: string[]): void {
  const all = described(r);
  expect(r.status, all).toBe(2);
  expect(r.stdout, all).toBe("");
  expect(r.stderr.startsWith("Error: "), all).toBe(true);
  expect(r.stderr.endsWith("\n"), all).toBe(true);
  expect(r.stderr.trimEnd().split("\n"), all).toHaveLength(1);
  for (const phrase of phrases) expect(r.stderr, all).toContain(phrase);
}

/** The exit-1 shape: exit 1, nothing on stderr, one `refused FOLDER: ` line on stdout. */
function expectRefused(r: Ran, folder: string, ...phrases: string[]): void {
  const all = described(r);
  expect(r.status, all).toBe(1);
  expect(r.stderr, all).toBe("");
  expect(r.stdout.startsWith(`refused ${folder}: `), all).toBe(true);
  expect(r.stdout.trimEnd().split("\n"), all).toHaveLength(1);
  for (const phrase of phrases) expect(r.stdout, all).toContain(phrase);
}

/** Runs `act` and asserts it changed nothing under `root`. */
function expectNothingWritten<T>(root: string, act: () => T): T {
  const before = treeDigest(root);
  const result = act();
  expect(treeDigest(root), "nothing was written").toEqual(before);
  return result;
}

/** The id of a `noted` run, which must have exited 0. */
function notedId(r: Ran, folder: string): string {
  expect(r.status, r.stdout + r.stderr).toBe(0);
  expect(r.stderr).toBe("");
  const m = new RegExp(`^noted ${folder} (\\S+)\\n$`).exec(r.stdout);
  expect(m, r.stdout).not.toBeNull();
  return (m as RegExpExecArray)[1] as string;
}

/** The fence of note `id` in `folder`. */
function fenceOf(root: string, folder: string, id: string): string {
  return readFileSync(join(notesDir(root, folder), `${id}.md`), "utf8").split("\n---\n")[0] as string;
}

/** A repository root that answers the dial itself: a version-control marker and `context` in its config. */
function governed(context: Record<string, string>): string {
  const root = repo();
  mkdirSync(join(root, ".git"));
  writeFileSync(join(root, CONFIG_REL), JSON.stringify({ context }, null, 2));
  return root;
}

/** The real gate's verdict for run `id` under `folder`, through the authority's own emission verb. */
function greenVerdict(root: string, folder: string, id: string): void {
  const r = spawnSync(process.execPath, [CONTEXT_IO_JS, "emit-verdict", folder, id, "clean", SHA, join(root, CONTEXT_REL)], {
    encoding: "utf8",
    timeout: 15_000,
  });
  expect(r.status, r.stdout + r.stderr).toBe(0);
}

const finding = (by: string, stamp: string): string[] =>
  ["--kind", "finding", "--by", by, "--confidence", "high", "--verified-by", stamp, "--body", "x"];

describe("every note field reaches the fence", () => {
  it("--ref repeats and --verified-by reaches the fence", () => {
    const root = repo();
    const id = notedId(note(root, "add", "t1", ...finding("qe-e2e", "human:eve"), "--ref", "ABC-1", "--ref", "ABC-2"), "t1");
    const fence = fenceOf(root, "t1", id);
    expect(fence).toContain("verified_by: human:eve\n");
    expect(fence).toContain("  - ABC-1\n  - ABC-2\n");
  });

  it("--supersedes names an earlier note, and the render folds it out of the live state", () => {
    const root = repo();
    const first = notedId(note(root, "add", "t1", ...OBSERVATION), "t1");
    const second = notedId(note(root, "add", "t1", ...OBSERVATION, "--supersedes", first), "t1");
    expect(fenceOf(root, "t1", second)).toContain(`supersedes: ${first}\n`);
  });

  it("--sha, --gate-run and --content-hash reach an artifact-ref bound to a live green verdict", () => {
    const root = repo();
    greenVerdict(root, "t1", "run1");
    const id = notedId(
      note(
        root,
        "add",
        "t1",
        ...["--kind", "artifact-ref", "--by", "qe-e2e", "--confidence", "high", "--body", "spec"],
        ...["--gate-run", "run1", "--sha", SHA, "--content-hash", CONTENT_HASH],
      ),
      "t1",
    );
    const fence = fenceOf(root, "t1", id);
    expect(fence).toContain(`sha: ${SHA}\n`);
    expect(fence).toContain("gate_run: run1\n");
    expect(fence).toContain(`content_hash: ${CONTENT_HASH}\n`);
  });

  it("the program stamps `at` itself, at write time", () => {
    const root = repo();
    const before = Date.now();
    const id = notedId(note(root, "add", "t1", ...OBSERVATION), "t1");
    const at = /^at: (.+)$/m.exec(fenceOf(root, "t1", id));
    expect(at).not.toBeNull();
    const stamped = Date.parse((at as RegExpExecArray)[1] as string);
    expect(stamped).toBeGreaterThanOrEqual(before - 1);
    expect(stamped).toBeLessThanOrEqual(Date.now());
  });

  it("two add runs write two files with two ids, and index.md and index.jsonl list both", () => {
    const root = repo();
    const first = notedId(note(root, "add", "t1", ...OBSERVATION), "t1");
    const second = notedId(note(root, "add", "t1", ...OBSERVATION), "t1");
    expect(second).not.toBe(first);
    expect(noteFiles(root, "t1")).toEqual([`${first}.md`, `${second}.md`].sort());
    const jsonl = readFileSync(join(root, CONTEXT_REL, "t1", "index.jsonl"), "utf8");
    expect(jsonl).toContain(first);
    expect(jsonl).toContain(second);
    const md = readFileSync(join(root, CONTEXT_REL, "t1", "index.md"), "utf8");
    for (const id of [first, second]) {
      const at = (/^at: (.+)$/m.exec(fenceOf(root, "t1", id)) as RegExpExecArray)[1] as string;
      expect(md, "index.md lists a row per note, by its time").toContain(`| ${at} | observation | qe-e2e |`);
    }
  });

  it("a note at the claim's own instant counts, and one a millisecond before it does not (the inclusive D-07 boundary)", () => {
    const root = repo("t1");
    expect(claim(root, "claim", "t1", "--by", "grugops-qe-e2e").status).toBe(0);
    const id = notedId(note(root, "add", "t1", ...OBSERVATION), "t1");
    const at = (/^at: (.+)$/m.exec(fenceOf(root, "t1", id)) as RegExpExecArray)[1] as string;
    const claimPath = join(root, QUEUE_CLAIMED_REL, "t1", "claim.md");
    const record = readFileSync(claimPath, "utf8");
    const stamped = (value: string): string => record.replace(/^at: .*$/m, `at: ${value}`);

    writeFileSync(claimPath, stamped(new Date(Date.parse(at) + 1).toISOString()));
    expect(claim(root, "done", "t1").status, "a note before the claim does not count").toBe(1);

    writeFileSync(claimPath, stamped(at));
    const finished = claim(root, "done", "t1");
    expect(finished.status, finished.stdout + finished.stderr).toBe(0);
  });
});

describe("the body", () => {
  it("--body-file reads the body, which may start with two dashes", () => {
    const root = repo();
    const file = join(root, "body.md");
    writeFileSync(file, "-- the measured result\n");
    const id = notedId(
      note(root, "add", "t1", "--kind", "observation", "--by", "qe-e2e", "--confidence", "high", "--body-file", file),
      "t1",
    );
    expect(readFileSync(join(notesDir(root, "t1"), `${id}.md`), "utf8")).toContain("-- the measured result");
  });

  it("both body flags, or neither, is exit 2 and writes nothing", () => {
    const root = repo();
    const file = join(root, "body.md");
    writeFileSync(file, "x\n");
    const head = ["add", "t1", "--kind", "observation", "--by", "qe-e2e", "--confidence", "high"];
    expectNothingWritten(root, () => {
      expectCouldNotRun(note(root, ...head), "--body");
      expectCouldNotRun(note(root, ...head, "--body", "x", "--body-file", file), "--body");
    });
  });

  it("an empty or whitespace-only body is exit 2, by flag and by file, so an empty note cannot free a slot", () => {
    const root = repo();
    const file = join(root, "blank.md");
    writeFileSync(file, " \n\t\n");
    const head = ["add", "t1", "--kind", "observation", "--by", "qe-e2e", "--confidence", "high"];
    expectNothingWritten(root, () => {
      expectCouldNotRun(note(root, ...head, "--body", ""), "empty");
      expectCouldNotRun(note(root, ...head, "--body", " \n\t "), "empty");
      expectCouldNotRun(note(root, ...head, "--body-file", file), "empty");
    });
  });

  it("a FIFO at --body-file refuses in bounded time (T-41-35)", () => {
    const root = repo();
    const fifo = join(root, "body.fifo");
    const skipped = stageShapeOrSkip("FIFO", fifo, "scripts/runnable-ref/note.test.ts: --body-file (plan 41-07)");
    if (skipped !== null) {
      console.warn(skipLine(skipped, "the missing and oversized --body-file cases beside this one"));
      return;
    }
    const head = ["add", "t1", "--kind", "observation", "--by", "qe-e2e", "--confidence", "high"];
    expectNothingWritten(root, () => expectCouldNotRun(note(root, ...head, "--body-file", fifo), "--body-file"));
  });

  it("a missing --body-file and a directory at it are exit 2", () => {
    const root = repo();
    const head = ["add", "t1", "--kind", "observation", "--by", "qe-e2e", "--confidence", "high"];
    expectNothingWritten(root, () => {
      expectCouldNotRun(note(root, ...head, "--body-file", join(root, "nowhere.md")), "--body-file");
      expectCouldNotRun(note(root, ...head, "--body-file", root), "--body-file");
    });
  });

  it("a --body-file above NOTE_FILE_MAX_BYTES is exit 2, and one at the ceiling is the writer's refusal", () => {
    expect(readFileSync(join(import.meta.dirname, "note.js"), "utf8"), "PREMISE: the ceiling").toContain(
      "export const NOTE_FILE_MAX_BYTES = 8 * 1024 * 1024;",
    );
    const root = repo();
    const over = join(root, "over.md");
    const at = join(root, "at.md");
    writeFileSync(over, Buffer.alloc(CEILING_BYTES + 1, 0x61));
    writeFileSync(at, Buffer.alloc(CEILING_BYTES, 0x61));
    const head = ["add", "t1", "--kind", "observation", "--by", "qe-e2e", "--confidence", "high"];
    expectNothingWritten(root, () => {
      expectCouldNotRun(note(root, ...head, "--body-file", over), "--body-file");
      expectRefused(note(root, ...head, "--body-file", at), "t1");
    });
  });
});

describe("argv", () => {
  const head = ["add", "t1"];
  it("--by missing or empty is exit 2 and writes nothing (edge RUN-06 empty)", () => {
    const root = repo();
    const rest = ["--kind", "observation", "--confidence", "high", "--body", "x"];
    expectNothingWritten(root, () => {
      expectCouldNotRun(note(root, ...head, ...rest), "--by", "role file");
      expectCouldNotRun(note(root, ...head, ...rest, "--by", ""), "--by", "role file");
      expectCouldNotRun(note(root, ...head, ...rest, "--by", "   "), "--by", "role file");
    });
  });

  it("--by refuses an adapter name in any letter case, and the line names the fix (edge RUN-06 encoding, T-41-30)", () => {
    const root = repo();
    const rest = ["--kind", "observation", "--confidence", "high", "--body", "x"];
    expectNothingWritten(root, () => {
      for (const by of ["grugops-qe-e2e", "GRUGOPS-QE-E2E", "GrugOps-security-nfr", " grugops-qe-e2e"]) {
        expectCouldNotRun(note(root, ...head, ...rest, "--by", by), "--by", "role file");
      }
    });
  });

  it("the prefix --by refuses is the one scripts/kit-model.ts owns, so a new namespace turns this case red", () => {
    const root = repo();
    const rest = ["--kind", "observation", "--confidence", "high", "--body", "x"];
    expectNothingWritten(root, () =>
      expectCouldNotRun(note(root, ...head, ...rest, "--by", `${AGENT_ADAPTER_PREFIX}qe-e2e`), "--by", "role file", ": qe-e2e."),
    );
  });

  it("the measured bypass is closed: an adapter name cannot step around the high-severity classifier", () => {
    const root = governed({ human_admission: "all" });
    expectNothingWritten(root, () =>
      expectCouldNotRun(note(root, ...head, ...finding("grugops-security-nfr", "human:eve")), "--by", "role file"),
    );
  });

  it("--by folds as the classifier folds, so no spelling of an adapter name steps around it (T-41-30)", () => {
    const root = governed({ human_admission: "all" });
    const spellings = [
      "gru\u200Bgops-security-nfr",
      "grugops\u200B-security-nfr",
      "\uFF47rugops-security-nfr",
      "grugops\uFF0Dsecurity-nfr",
      "grug ops-security-nfr",
    ];
    expectNothingWritten(root, () => {
      for (const by of spellings) {
        expectCouldNotRun(note(root, ...head, ...finding(by, "human:eve")), "--by", "role file", ": security-nfr.");
      }
    });
    expect(noteFiles(root, "t1"), "no spelling left a note").toEqual([]);

    const id = notedId(note(root, ...head, ...OBSERVATION), "t1");
    expect(fenceOf(root, "t1", id)).toContain("by: qe-e2e\n");
  });

  it("--kind outside the six kinds, and a missing --kind, are exit 2", () => {
    const root = repo();
    const rest = ["--by", "qe-e2e", "--confidence", "high", "--body", "x"];
    expectNothingWritten(root, () => {
      expectCouldNotRun(note(root, ...head, ...rest, "--kind", "note"), "--kind", "observation");
      expectCouldNotRun(note(root, ...head, ...rest), "--kind");
    });
  });

  it("a missing --confidence is exit 2", () => {
    const root = repo();
    expectNothingWritten(root, () =>
      expectCouldNotRun(note(root, ...head, "--kind", "observation", "--by", "qe-e2e", "--body", "x"), "--confidence"),
    );
  });

  it("--at and --root do not exist: this route forges no time and points governance at no root", () => {
    const root = repo();
    expectNothingWritten(root, () => {
      expectCouldNotRun(note(root, ...head, ...OBSERVATION, "--at", "2000-01-01T00:00:00.000Z"), "--at");
      expectCouldNotRun(note(root, ...head, ...OBSERVATION, "--root", root), "--root");
    });
  });

  it("a repeated flag that may not repeat is exit 2, and a flag value starting -- is exit 2", () => {
    const root = repo();
    expectNothingWritten(root, () => {
      expectCouldNotRun(note(root, ...head, ...OBSERVATION, "--kind", "claim"), "--kind", "more than once");
      expectCouldNotRun(note(root, ...head, "--kind", "--by", "qe-e2e"), "--kind");
      expectCouldNotRun(note(root, ...head, "--kind", "observation", "--by", "qe-e2e", "--confidence", "high", "--body", "--x"), "--body");
    });
  });

  it("no command, an unknown command, no folder and two folders are exit 2", () => {
    const root = repo();
    expectNothingWritten(root, () => {
      expectCouldNotRun(note(root), "Usage");
      expectCouldNotRun(note(root, "remove", "t1"), "remove");
      expectCouldNotRun(note(root, "add", ...OBSERVATION), "folder");
      expectCouldNotRun(note(root, "add", "t1", "t2", ...OBSERVATION), "folder");
    });
  });
});

describe("the root and the path to notes/ (T-41-33)", () => {
  it("a folder of .., one holding a separator and an empty one are exit 2", () => {
    const root = repo();
    expectNothingWritten(root, () => {
      for (const folder of ["..", ".", "a/b", "a\\b", "../t1", ""]) expectCouldNotRun(note(root, "add", folder, ...OBSERVATION));
    });
  });

  it("a directory with no .grugops/ is exit 2 and gains no directory", () => {
    const root = mkTmp("grugops-note-bare-");
    expectNothingWritten(root, () => expectCouldNotRun(note(root, "add", "t1", ...OBSERVATION), GRUGOPS_DIR_REL));
    expect(readdirSync(root)).toEqual([]);
  });

  it("the store is the working directory's: a subdirectory of a repository is not the repository", () => {
    const root = repo();
    const sub = join(root, "src");
    mkdirSync(sub);
    expectNothingWritten(root, () => expectCouldNotRun(note(sub, "add", "t1", ...OBSERVATION), GRUGOPS_DIR_REL));
  });

  it("a .grugops that is a regular file or a symbolic link is exit 2", () => {
    const file = mkTmp("grugops-note-file-state-");
    writeFileSync(join(file, GRUGOPS_DIR_REL), "");
    expectCouldNotRun(note(file, "add", "t1", ...OBSERVATION), GRUGOPS_DIR_REL);

    const linked = mkTmp("grugops-note-link-state-");
    const outside = mkTmp("grugops-note-outside-");
    const skipped = stageSymlinkOrSkip(
      outside,
      join(linked, GRUGOPS_DIR_REL),
      "symlink leaving the repository root",
      "scripts/runnable-ref/note.test.ts: the state directory (plan 41-07)",
    );
    if (skipped !== null) {
      console.warn(skipLine(skipped, "scripts/runnable-ref/claim.test.ts's state directory cases (the same rule)"));
      return;
    }
    expectCouldNotRun(note(linked, "add", "t1", ...OBSERVATION), GRUGOPS_DIR_REL, "symbolic link");
    expect(readdirSync(outside)).toEqual([]);
  });

  const LINK_POSITIONS: readonly (readonly [string, (root: string) => void])[] = [
    [CONTEXT_REL, () => {}],
    [`${CONTEXT_REL}/t1`, (root) => mkdirSync(join(root, CONTEXT_REL))],
    [`${CONTEXT_REL}/t1/notes`, (root) => mkdirSync(join(root, CONTEXT_REL, "t1"), { recursive: true })],
  ];
  for (const [rel, stage] of LINK_POSITIONS) {
    it(`a symbolic link at ${rel} is exit 2 by name, with the link target unchanged`, () => {
      const root = repo();
      stage(root);
      const outside = mkTmp("grugops-note-outside-");
      const skipped = stageSymlinkOrSkip(
        outside,
        join(root, ...rel.split("/")),
        "symlink leaving the repository root",
        `scripts/runnable-ref/note.test.ts: ${rel} (plan 41-07)`,
      );
      if (skipped !== null) {
        console.warn(skipLine(skipped, "scripts/runnable-ref/claim.test.ts's queue link cases (the same owner)"));
        return;
      }
      expectCouldNotRun(note(root, "add", "t1", ...OBSERVATION), rel, "symbolic link");
      expect(lstatSync(join(root, ...rel.split("/"))).isSymbolicLink()).toBe(true);
      expect(readlinkSync(join(root, ...rel.split("/")))).toBe(outside);
      expect(readdirSync(outside)).toEqual([]);
    });
  }

  it("a dangling link at the folder is refused as a link, never read as absent", () => {
    const root = repo();
    mkdirSync(join(root, CONTEXT_REL));
    const gone = join(mkTmp("grugops-note-gone-"), "gone");
    const skipped = stageSymlinkOrSkip(
      gone,
      join(root, CONTEXT_REL, "t1"),
      "dangling symlink",
      "scripts/runnable-ref/note.test.ts: the folder (plan 41-07)",
    );
    if (skipped !== null) {
      console.warn(skipLine(skipped, "the live link cases above"));
      return;
    }
    expectCouldNotRun(note(root, "add", "t1", ...OBSERVATION), `${CONTEXT_REL}/t1`, "symbolic link");
    expect(existsSync(gone)).toBe(false);
  });

  it("a regular file at the folder or at notes is exit 2", () => {
    const atFolder = repo();
    mkdirSync(join(atFolder, CONTEXT_REL));
    writeFileSync(join(atFolder, CONTEXT_REL, "t1"), "");
    expectCouldNotRun(note(atFolder, "add", "t1", ...OBSERVATION), `${CONTEXT_REL}/t1`);

    const atNotes = repo();
    mkdirSync(join(atNotes, CONTEXT_REL, "t1"), { recursive: true });
    writeFileSync(join(atNotes, CONTEXT_REL, "t1", "notes"), "");
    expectCouldNotRun(note(atNotes, "add", "t1", ...OBSERVATION), `${CONTEXT_REL}/t1/notes`);
  });

  // WR-10, D-42 (41-UAT.md test 7, Olger, 2026-11-11): the GOV-02 ledger is asked of the root-chain owner too, so a
  // link cannot send an admission record out of the repository.
  it("a link at .grugops/audit is refused: exit 2, no note, and the target gains no ledger line (WR-10)", () => {
    const root = governed({ audit_retention: "retained" });
    const outside = mkTmp("grugops-note-audit-outside-");
    const skipped = stageSymlinkOrSkip(
      outside,
      join(root, GRUGOPS_DIR_REL, "audit"),
      "symlink leaving the repository root",
      "scripts/runnable-ref/note.test.ts: .grugops/audit (plan 41-21)",
    );
    if (skipped !== null) {
      console.warn(skipLine(skipped, "the link cases at the path to notes/ above (the same owner)"));
      return;
    }
    expectCouldNotRun(note(root, "add", "t1", ...OBSERVATION), `${GRUGOPS_DIR_REL}/audit`, "symbolic link");
    expect(noteFiles(root, "t1"), "no note was written").toEqual([]);
    expect(readdirSync(outside), "the link target gained no ledger").toEqual([]);
  });

  it("a link at .grugops/audit/admissions.jsonl is refused the same way (WR-10)", () => {
    const root = governed({ audit_retention: "retained" });
    mkdirSync(join(root, GRUGOPS_DIR_REL, "audit"));
    const outside = mkTmp("grugops-note-ledger-outside-");
    const target = join(outside, "admissions.jsonl");
    writeFileSync(target, "");
    const skipped = stageSymlinkOrSkip(
      target,
      join(root, LEDGER_REL),
      "symlink leaving the repository root",
      "scripts/runnable-ref/note.test.ts: the ledger file (plan 41-21)",
    );
    if (skipped !== null) {
      console.warn(skipLine(skipped, "the link cases at the path to notes/ above (the same owner)"));
      return;
    }
    expectCouldNotRun(note(root, "add", "t1", ...OBSERVATION), LEDGER_REL);
    expect(noteFiles(root, "t1"), "no note was written").toEqual([]);
    expect(readFileSync(target, "utf8"), "the link target gained no ledger line").toBe("");
  });

  it("CONTROL: an absent .grugops/audit under retained is still created and gains the ledger line (WR-10)", () => {
    const root = governed({ audit_retention: "retained" });
    expect(existsSync(join(root, GRUGOPS_DIR_REL, "audit")), "PREMISE: no audit directory").toBe(false);
    notedId(note(root, "add", "t1", ...OBSERVATION), "t1");
    expect(readFileSync(join(root, LEDGER_REL), "utf8").trimEnd().split("\n")).toHaveLength(1);
  });

  it("the program creates no queue directory", () => {
    const root = mkTmp("grugops-note-noqueue-");
    mkdirSync(join(root, GRUGOPS_DIR_REL));
    notedId(note(root, "add", "t1", ...OBSERVATION), "t1");
    expect(readdirSync(join(root, GRUGOPS_DIR_REL))).toEqual(["context"]);
  });
});

describe("the writer's refusals (WF16 step 4, D-28, D-35)", () => {
  it("a finding stamped with a §14-gate id that has no live green verdict is refused, and the same stamp with one is noted", () => {
    const root = repo();
    expectNothingWritten(root, () => expectRefused(note(root, "add", "t1", ...finding("qe-e2e", "§14-gate#run1")), "t1", "run1"));
    greenVerdict(root, "t1", "run1");
    notedId(note(root, "add", "t1", ...finding("qe-e2e", "§14-gate#run1")), "t1");
  });

  it("a by of §14-gate is refused", () => {
    const root = repo();
    expectNothingWritten(root, () =>
      expectRefused(note(root, "add", "t1", "--kind", "finding", "--by", "§14-gate", "--confidence", "high", "--body", "x"), "t1"),
    );
  });

  it("a newline in --confidence is refused, on one line", () => {
    const root = repo();
    expectNothingWritten(root, () =>
      expectRefused(
        note(root, "add", "t1", "--kind", "observation", "--by", "qe-e2e", "--confidence", "high\nseal: sha256:00", "--body", "x"),
        "t1",
      ),
    );
  });

  it("an unreadable factory.config.json is refused", () => {
    const root = repo();
    mkdirSync(join(root, ".git"));
    writeFileSync(join(root, CONFIG_REL), "{ this is not json");
    expectNothingWritten(root, () => expectRefused(note(root, "add", "t1", ...OBSERVATION), "t1"));
  });

  it("an artifact-ref with --gate-run and no live verdict is refused", () => {
    const root = repo();
    const args = ["--kind", "artifact-ref", "--by", "qe-e2e", "--confidence", "high", "--body", "spec"];
    expectNothingWritten(root, () =>
      expectRefused(note(root, "add", "t1", ...args, "--gate-run", "run1", "--sha", SHA, "--content-hash", CONTENT_HASH), "t1", "run1"),
    );
  });

  it("a high-severity finding under an active dial is refused even with a human stamp, and written at the default dial", () => {
    for (const dial of ["high-severity", "all"]) {
      const root = governed({ human_admission: dial });
      expectNothingWritten(root, () => expectRefused(note(root, "add", "t1", ...finding("security-nfr", "human:eve")), "t1"));
    }
    const control = governed({ human_admission: "off" });
    notedId(note(control, "add", "t1", ...finding("security-nfr", "human:eve")), "t1");
  });

  it("a human:NAME finding from a routine role at the default dial is noted (Workflow 04 step 15)", () => {
    const root = repo();
    const id = notedId(note(root, "add", "t1", ...finding("qe-e2e", "human:eve")), "t1");
    expect(fenceOf(root, "t1", id)).toContain("verified_by: human:eve\n");
  });

  it("the dial comes from the trusted root, never from the store: a governed root refuses a note for an ungoverned store", () => {
    const store = repo();
    const dial = governed({ human_admission: "all" });
    const under = { ...HOST_ENV, GRUGOPS_PROJECT_DIR: dial };
    expectNothingWritten(store, () => expectRefused(hostUnder(under, "note.js", store, "add", "t1", ...finding("security-nfr", "human:eve")), "t1"));
    notedId(note(store, "add", "t1", ...finding("security-nfr", "human:eve")), "t1");
  });

  it("under audit_retention: retained one noted run adds exactly one ledger line, and a refused run adds none", () => {
    const root = governed({ audit_retention: "retained" });
    const lines = (): number =>
      existsSync(join(root, LEDGER_REL)) ? readFileSync(join(root, LEDGER_REL), "utf8").trimEnd().split("\n").length : 0;
    expect(lines()).toBe(0);
    notedId(note(root, "add", "t1", ...OBSERVATION), "t1");
    expect(lines()).toBe(1);
    expectRefused(note(root, "add", "t1", "--kind", "finding", "--by", "qe-e2e", "--confidence", "high", "--body", "x"), "t1");
    expect(lines()).toBe(1);
    notedId(note(root, "add", "t1", ...OBSERVATION), "t1");
    expect(lines()).toBe(2);
  });

  // WR-09, D-42 (41-UAT.md test 7, Olger, 2026-11-11): exit 1 tells a role to change its note, so only a decision the
  // writer made about the note may print `refused`. An admission that cannot be recorded says nothing about the note.
  it("an admission that cannot be recorded is exit 2, never refused (WR-09)", () => {
    const root = governed({ audit_retention: "retained" });
    mkdirSync(join(root, GRUGOPS_DIR_REL, "audit"));
    const skipped = stageShapeOrSkip("FIFO", join(root, LEDGER_REL), "scripts/runnable-ref/note.test.ts: the audit ledger (plan 41-21)");
    if (skipped !== null) {
      console.warn(skipLine(skipped, "scripts/runnable-ref/note-read-sites.test.ts's ledger-directory control (the same exit)"));
      return;
    }
    expectCouldNotRun(note(root, "add", "t1", ...OBSERVATION), "could not be recorded");
    expect(noteFiles(root, "t1"), "no note was written").toEqual([]);
  });

  it("a note admit() refuses is still exit 1 with a refused line (WR-09 control)", () => {
    const root = repo();
    expectNothingWritten(root, () =>
      expectRefused(note(root, "add", "t1", ...finding("qe-e2e", "§14-gate#no-such-run")), "t1", "no live green"),
    );
  });

  it("an invalid field is still exit 1 (WR-09 control)", () => {
    const root = repo();
    expectNothingWritten(root, () =>
      expectRefused(
        note(root, "add", "t1", "--kind", "observation", "--by", "qe-e2e", "--confidence", "high\nkind: finding", "--body", "x"),
        "t1",
        "confidence",
      ),
    );
  });
});

describe("--supersedes never retires a verdict or a governed finding (CR-02)", () => {
  /** A claim by a routine role with no stamp: the note the review retired a finding with. */
  const RETIRING = ["--kind", "claim", "--by", "software-engineer", "--confidence", "low", "--body", "x"];

  /** The `## Current state` section of the index of `folder`. A row names a note by its kind and author, not its id. */
  function currentStateOf(root: string, folder: string): string {
    const index = readFileSync(join(root, CONTEXT_REL, folder, "index.md"), "utf8");
    const start = index.indexOf("## Current state");
    expect(start, "the index has a current state section").toBeGreaterThan(-1);
    const end = index.indexOf("\n## ", start);
    return end === -1 ? index.slice(start) : index.slice(start, end);
  }

  /** The start of the index row of a `kind` note by `by`. */
  const row = (kind: string, by: string): string => `| ${kind} | ${by} |`;

  /**
   * A sealed finding by `by` stamped `human:olger`, in a repository whose dial then reads `dial`.
   *
   * This file imports nothing from the authority, so the finding gets its seal from note.js. The writer takes it at
   * `off`, and the dial moves afterwards. Only the dial differs from a finding a human disposed through the hook.
   */
  function disposedFinding(by: string, dial: string): { root: string; id: string } {
    const root = governed({ human_admission: "off", audit_retention: "retained" });
    const id = notedId(note(root, "add", "t1", ...finding(by, "human:olger")), "t1");
    writeFileSync(join(root, CONFIG_REL), JSON.stringify({ context: { human_admission: dial, audit_retention: "retained" } }, null, 2));
    return { root, id };
  }

  /** Runs `note.js add t1 ARGS`, and asserts the supersession refusal and an unchanged tree. */
  function expectSupersessionRefused(root: string, ...args: string[]): void {
    const before = treeDigest(root);
    expectRefused(note(root, "add", "t1", ...args), "t1", "may be superseded only through");
    expect(treeDigest(root), "nothing was written").toEqual(before);
  }

  /** The id of the one verdict `greenVerdict` staged under `folder`. */
  function verdictId(root: string, folder: string): string {
    const names = readdirSync(notesDir(root, folder));
    expect(names).toHaveLength(1);
    return (names[0] as string).replace(/\.md$/, "");
  }

  it("under human_admission: all, a claim that names a human-disposed security finding is refused and the finding stays", () => {
    const { root, id } = disposedFinding("security-nfr", "all");
    expectSupersessionRefused(root, ...RETIRING, "--supersedes", id);
    expect(currentStateOf(root, "t1")).toContain(row("finding", "security-nfr"));
  });

  it("under human_admission: all, a self-stamped finding cannot retire a governed finding either", () => {
    const { root, id } = disposedFinding("qe-e2e", "all");
    expectSupersessionRefused(root, ...finding("qe-e2e", "human:eve"), "--supersedes", id);
  });

  it("under human_admission: high-severity, a security-nfr finding is refused and a qe-e2e finding folds out as today", () => {
    const high = disposedFinding("security-nfr", "high-severity");
    expectSupersessionRefused(high.root, ...RETIRING, "--supersedes", high.id);

    const routine = disposedFinding("qe-e2e", "high-severity");
    notedId(note(routine.root, "add", "t1", ...RETIRING, "--supersedes", routine.id), "t1");
    expect(currentStateOf(routine.root, "t1")).not.toContain(row("finding", "qe-e2e"));
  });

  it("under human_admission: off, a security-nfr finding folds out as today", () => {
    const { root, id } = disposedFinding("security-nfr", "off");
    expect(currentStateOf(root, "t1")).toContain(row("finding", "security-nfr"));
    notedId(note(root, "add", "t1", ...RETIRING, "--supersedes", id), "t1");
    expect(currentStateOf(root, "t1")).not.toContain(row("finding", "security-nfr"));
  });

  for (const dial of ["off", "all"]) {
    it(`under human_admission: ${dial}, a green verdict is refused as a target, and a finding stamped with its run is still admitted`, () => {
      const root = governed({ human_admission: dial });
      greenVerdict(root, "t1", "run1");
      expectSupersessionRefused(root, ...RETIRING, "--supersedes", verdictId(root, "t1"));
      notedId(note(root, "add", "t1", ...finding("qe-e2e", "§14-gate#run1")), "t1");
    });
  }

  it("--supersedes with an empty value is no target: it is noted and retires nothing", () => {
    const { root } = disposedFinding("security-nfr", "all");
    const noted = notedId(note(root, "add", "t1", ...RETIRING, "--supersedes", ""), "t1");
    expect(fenceOf(root, "t1", noted)).toContain("supersedes: \n");
    expect(currentStateOf(root, "t1")).toContain(row("finding", "security-nfr"));
  });

  it("under human_admission: all, a claim that names an ordinary note still folds it out", () => {
    const root = governed({ human_admission: "all" });
    const first = notedId(note(root, "add", "t1", ...OBSERVATION), "t1");
    expect(currentStateOf(root, "t1")).toContain(row("observation", "qe-e2e"));
    notedId(note(root, "add", "t1", ...RETIRING, "--supersedes", first), "t1");
    expect(currentStateOf(root, "t1")).not.toContain(row("observation", "qe-e2e"));
  });

  it("the rule lives in the authority: the hand-written part of note.ts decides nothing about a target", () => {
    const source = readFileSync(join(import.meta.dirname, "note.ts"), "utf8");
    const marker = "// </runnable-embeds>";
    expect(source).toContain(marker);
    const handWritten = source.slice(source.lastIndexOf(marker));
    for (const predicate of ["prior.by", "isGatedNote", "GATE_IDENTITY", "readContext"]) {
      expect(handWritten, predicate).not.toContain(predicate);
    }
  });

  it("a target that names no note is noted and retires nothing (D-37, R-41-09)", () => {
    const { root } = disposedFinding("security-nfr", "all");
    const noted = notedId(note(root, "add", "t1", ...RETIRING, "--supersedes", "nosuchid"), "t1");
    expect(fenceOf(root, "t1", noted)).toContain("supersedes: nosuchid\n");
    expect(currentStateOf(root, "t1")).toContain(row("finding", "security-nfr"));
  });

  // ── T-41-64, D-39: a target in the store that cannot be read ──────────────────────────────────────────────────────
  // The walk skips a note file it cannot read, so a reader of the current state sees no target and nothing to judge.
  // Such a file may be a green verdict or a gated finding, and a note naming it folds it out once the read recovers.

  /** The note file of `id` under t1. */
  const fileOf = (root: string, id: string): string => join(notesDir(root, "t1"), `${id}.md`);

  /** Runs the `RETIRING` claim naming `id`, and asserts the unreadable-target refusal and an unchanged tree. */
  function expectUnreadableRefused(root: string, id: string): void {
    const before = treeDigest(root);
    expectRefused(note(root, "add", "t1", ...RETIRING, "--supersedes", id), "t1", "is in the store and cannot be read");
    expect(treeDigest(root), "nothing was written").toEqual(before);
  }

  // A `chmod 000` case passes on an account that can read the file only if it is never run there. So the account is
  // probed once, the case is skipped by name where `chmod 000` is a no-op, and when it runs it asserts its premise.
  const CHMOD_POSITION = "scripts/runnable-ref/note.test.ts: a supersedes target at mode 000 (T-41-64)";
  const chmodSkip = hostCapabilityOrSkip("chmod 000 enforcement", CHMOD_POSITION);
  if (chmodSkip !== null) {
    console.log(
      skipLine(chmodSkip, "the READ-1 supersede case in scripts/runnable-ref/note-read-sites.test.ts and the unreadable shapes in this describe"),
    );
  }

  it.skipIf(chmodSkip !== null)(
    "the audit's route: a target at mode 000 is refused, and the finding stays once the mode is restored (T-41-64, D-39)",
    () => {
      const { root, id } = disposedFinding("security-nfr", "all");
      const file = fileOf(root, id);
      // `treeDigest` reads every file and throws on this one, so the note list is compared while the mode is down.
      const before = noteFiles(root, "t1");
      chmodSync(file, 0o000);
      try {
        expect(() => readFileSync(file), "PREMISE: this account cannot read a file at mode 000").toThrow(/EACCES|EPERM/);
        expectRefused(note(root, "add", "t1", ...RETIRING, "--supersedes", id), "t1", "is in the store and cannot be read");
        expect(noteFiles(root, "t1"), "no note was written").toEqual(before);
      } finally {
        chmodSync(file, 0o644);
      }
      // A routine note re-renders the index, so the current state is read after the mode is restored.
      notedId(note(root, "add", "t1", ...OBSERVATION), "t1");
      expect(currentStateOf(root, "t1")).toContain(row("finding", "security-nfr"));
    },
  );

  /** Each way a file in the store cannot be read that needs no privilege to stage, applied to the target's file. */
  const UNREADABLE_SHAPES: readonly { readonly shape: string; readonly stage: (file: string) => void }[] = [
    { shape: "a broken seal", stage: (file) => appendFileSync(file, "one more line\n") },
    { shape: "text that is not a note", stage: (file) => writeFileSync(file, "not a note\n") },
    {
      shape: "a directory",
      stage: (file) => {
        rmSync(file);
        mkdirSync(file);
      },
    },
    {
      shape: "a file above the note ceiling",
      stage: (file) => {
        truncateSync(file, CEILING_BYTES + 1);
        expect(lstatSync(file).size, "PREMISE: the file is one byte over the note ceiling").toBe(CEILING_BYTES + 1);
      },
    },
  ];

  for (const { shape, stage } of UNREADABLE_SHAPES) {
    it(`a target that is ${shape} is refused, because it is in the store and cannot be read (T-41-64, D-39)`, () => {
      const { root, id } = disposedFinding("security-nfr", "all");
      stage(fileOf(root, id));
      expectUnreadableRefused(root, id);
    });
  }

  const SHAPE_POSITION = "scripts/runnable-ref/note.test.ts: a supersedes target in the store that cannot be read (T-41-64)";
  const SHAPES_PINNED_BY = "the shapes table in this describe and the READ-1 supersede case in scripts/runnable-ref/note-read-sites.test.ts";

  it("a target that is a FIFO is refused, and never waited on (T-41-64, D-39)", () => {
    const { root, id } = disposedFinding("security-nfr", "all");
    const file = fileOf(root, id);
    rmSync(file);
    const skipped = stageShapeOrSkip("FIFO", file, SHAPE_POSITION);
    if (skipped !== null) {
      console.log(skipLine(skipped, SHAPES_PINNED_BY));
      return;
    }
    expectUnreadableRefused(root, id);
  });

  it("a target that is a dangling link is refused (T-41-64, D-39)", () => {
    const { root, id } = disposedFinding("security-nfr", "all");
    const file = fileOf(root, id);
    rmSync(file);
    const skipped = stageSymlinkOrSkip(join(notesDir(root, "t1"), "nowhere.md"), file, "dangling symlink", SHAPE_POSITION);
    if (skipped !== null) {
      console.log(skipLine(skipped, SHAPES_PINNED_BY));
      return;
    }
    expectUnreadableRefused(root, id);
  });

  it("an unreadable target is refused at off too, because it may be a green verdict (D-39)", () => {
    const { root, id } = disposedFinding("security-nfr", "off");
    appendFileSync(fileOf(root, id), "one more line\n");
    expectUnreadableRefused(root, id);
  });

  it("CONTROL: a target that names no note stays admitted while a different note cannot be read (D-37 stands)", () => {
    const { root, id } = disposedFinding("security-nfr", "all");
    appendFileSync(fileOf(root, id), "one more line\n");
    const noted = notedId(note(root, "add", "t1", ...RETIRING, "--supersedes", "nosuchid"), "t1");
    expect(fenceOf(root, "t1", noted)).toContain("supersedes: nosuchid\n");
  });

  it("a readable note under the id outranks an unreadable file of that name, so the rule still judges it (edge RUN-02 adjacency)", () => {
    const { root, id } = disposedFinding("security-nfr", "all");
    renameSync(fileOf(root, id), join(notesDir(root, "t1"), "renamed.md"));
    writeFileSync(fileOf(root, id), "not a note\n");
    expectSupersessionRefused(root, ...RETIRING, "--supersedes", id);
  });

  it("LIMIT (R-41-09): a target is matched by its file name, so a renamed file that cannot be read reads as no note", () => {
    // This pins what stays open; it does not close it. An unreadable file gives no frozen id, so the walk's skip under
    // `renamed.md` matches no target, and the claim is admitted. The finding folds out once the file reads again.
    const { root, id } = disposedFinding("security-nfr", "all");
    const renamed = join(notesDir(root, "t1"), "renamed.md");
    const sealed = readFileSync(fileOf(root, id));
    renameSync(fileOf(root, id), renamed);
    appendFileSync(renamed, "one more line\n");
    notedId(note(root, "add", "t1", ...RETIRING, "--supersedes", id), "t1");
    writeFileSync(renamed, sealed);
    notedId(note(root, "add", "t1", ...OBSERVATION), "t1");
    expect(currentStateOf(root, "t1")).not.toContain(row("finding", "security-nfr"));
  });
});

describe("what the program prints", () => {
  /** Every C0 code point but the line feed, DEL and every C1 code point. */
  const CONTROL = /[\u0000-\u0009\u000b-\u001f\u007f-\u009f]/;

  it("a control character in a value reaches neither stdout nor stderr", () => {
    const root = repo();
    const runs = [
      note(root, "add", "t1", "--kind", "bad\u001b[31mkind", "--by", "qe-e2e", "--confidence", "high", "--body", "x"),
      note(root, "add", "t\u001b[31m1", ...OBSERVATION),
      note(root, "add", "t1", ...OBSERVATION, "--\u0007unknown", "v"),
      note(root, "add", "t1", "--kind", "observation", "--by", "qe\u0007-e2e", "--confidence", "high", "--body", "x"),
      note(root, "add", "t1", "--kind", "observation", "--by", "qe-e2e", "--confidence", "hi\u009bgh", "--body", "x"),
      note(root, "add", "t1", "--kind", "finding", "--by", "qe-e2e", "--confidence", "high", "--verified-by", "§14-gate#a\u001bb", "--body", "x"),
      note(root, "remove\u001b[2J", "t1"),
    ];
    for (const r of runs) {
      expect(r.stdout + r.stderr, "the run said something").not.toBe("");
      expect(CONTROL.test(r.stdout), JSON.stringify(r.stdout)).toBe(false);
      expect(CONTROL.test(r.stderr), JSON.stringify(r.stderr)).toBe(false);
    }
  });

  it("a failed render does not deny a note that stands: exit 2, the line says so, and done accepts the note", () => {
    const root = repo("t1");
    expect(claim(root, "claim", "t1", "--by", "grugops-qe-e2e").status).toBe(0);
    mkdirSync(join(root, CONTEXT_REL, "t1", "index.md"), { recursive: true });
    const r = note(root, "add", "t1", ...OBSERVATION);
    const files = noteFiles(root, "t1");
    expect(files).toHaveLength(1);
    const id = (files[0] as string).replace(/\.md$/, "");
    expectCouldNotRun(r, id, "stands");
    expect(claim(root, "done", "t1").status).toBe(0);
  });
});

describe("read (WR-12)", () => {
  // Plan 41-22 (WR-12, D-42; 41-UAT.md test 7, Olger, 2026-11-11). `read` is the host copy of the authority's context
  // read followed by currentState, so a role reads the context through the seal check on any host. It writes nothing.

  const READ_POSITION = "scripts/runnable-ref/note.test.ts: a file in notes/ that read cannot read (plan 41-22)";
  const READ_PINNED_BY = "the READ-1 `read` mode in scripts/runnable-ref/note-read-sites.test.ts";

  /** One `read` run that must change nothing under `root`. */
  const read = (root: string, ...args: string[]): Ran => expectNothingWritten(root, () => note(root, "read", ...args));

  /** The exit-0 shape of `read`: nothing on stderr, and every line of stdout ends with a line feed. */
  function expectRead(r: Ran): string[] {
    const all = described(r);
    expect(r.status, all).toBe(0);
    expect(r.stderr, all).toBe("");
    expect(r.stdout.endsWith("\n"), all).toBe(true);
    return r.stdout.slice(0, -1).split("\n");
  }

  /** The lines of the output that start at column 0. */
  const columnZero = (lines: readonly string[]): string[] => lines.filter((l) => l !== "" && !l.startsWith(" "));

  it("an absent folder prints a header with no notes and exits 0", () => {
    const root = repo();
    expect(expectRead(read(root, "t1"))).toEqual(["read t1: 0 current, 0 superseded, 0 skipped"]);
  });

  it("prints every set field of a sealed note, indented, and its body four spaces in", () => {
    const root = repo();
    const body = join(root, "body.md");
    writeFileSync(body, "first line\n  kept indent\n\nlast line\n");
    const head = ["--kind", "observation", "--by", "qe-e2e", "--confidence", "high", "--ref", "ABC-1", "--ref", "ABC-2"];
    const id = notedId(note(root, "add", "t1", ...head, "--body-file", body), "t1");
    const lines = expectRead(read(root, "t1"));
    expect(lines[0]).toBe("read t1: 1 current, 0 superseded, 0 skipped");
    expect(lines[1]).toBe(`note ${id}`);
    expect(lines.slice(2, 5)).toEqual(["  kind: observation", "  by: qe-e2e", lines[4] as string]);
    expect(lines[4]).toMatch(/^ {2}at: \d{4}-\d\d-\d\dT/);
    expect(lines).toContain("  confidence: high");
    expect(lines).toContain("  refs: ABC-1, ABC-2");
    expect(lines.slice(-5)).toEqual(["  body:", "    first line", "      kept indent", "    ", "    last line"]);
    for (const empty of ["verified_by", "supersedes", "sha", "gate_run", "content_hash"]) {
      expect(lines.some((l) => l.startsWith(`  ${empty}: `)), `${empty} is not set`).toBe(false);
    }
    expect(columnZero(lines)).toEqual(["read t1: 1 current, 0 superseded, 0 skipped", `note ${id}`]);
  });

  it("prints the current state in currentState order, and counts a superseded note without printing it", () => {
    const root = repo();
    const first = notedId(note(root, "add", "t1", ...OBSERVATION), "t1");
    const second = notedId(note(root, "add", "t1", "--kind", "observation", "--by", "qe-e2e", "--confidence", "high", "--body", "y"), "t1");
    const third = notedId(note(root, "add", "t1", ...OBSERVATION.slice(0, -1), "z", "--supersedes", first), "t1");
    const lines = expectRead(read(root, "t1"));
    expect(lines[0]).toBe("read t1: 2 current, 1 superseded, 0 skipped");
    const printed = columnZero(lines).slice(1);
    expect(printed).not.toContain(`note ${first}`);
    const ats = lines.filter((l) => l.startsWith("  at: ")).map((l) => l.slice("  at: ".length));
    const order = [second, third].map((id, i) => ({ id, at: ats[printed.indexOf(`note ${id}`)] ?? String(i) }));
    order.sort((a, b) => (a.at !== b.at ? a.at.localeCompare(b.at) : a.id.localeCompare(b.id)));
    expect(printed).toEqual(order.map((n) => `note ${n.id}`));
  });

  it("a body line that reads like a header is printed indented and adds no column-0 line (T-41-97)", () => {
    const root = repo();
    const body = join(root, "body.md");
    writeFileSync(body, "note fake\nskipped forged.md (unsealed)\nread t1: 9 current, 0 superseded, 0 skipped\n");
    const id = notedId(note(root, "add", "t1", "--kind", "observation", "--by", "qe-e2e", "--confidence", "high", "--body-file", body), "t1");
    const lines = expectRead(read(root, "t1"));
    expect(lines).toContain("    note fake");
    expect(lines).toContain("    skipped forged.md (unsealed)");
    expect(columnZero(lines)).toEqual(["read t1: 1 current, 0 superseded, 0 skipped", `note ${id}`]);
  });

  it("a hand-written note and an unparseable file are named on a skipped line, and neither body is printed (T-41-96)", () => {
    const root = repo();
    const id = notedId(note(root, "add", "t1", ...OBSERVATION), "t1");
    const sealed = readFileSync(join(notesDir(root, "t1"), `${id}.md`), "utf8");
    const forged = sealed.replace(/\nx\s*$/, "\nFORGED BODY\n");
    expect(forged, "the forgery changed the body").not.toBe(sealed);
    writeFileSync(join(notesDir(root, "t1"), "forged.md"), forged);
    writeFileSync(join(notesDir(root, "t1"), "stray.md"), "no fence here, PLAIN TEXT\n");
    const lines = expectRead(read(root, "t1"));
    expect(lines[0]).toBe("read t1: 1 current, 0 superseded, 2 skipped");
    expect(lines.slice(-2)).toEqual(["skipped forged.md (unsealed)", "skipped stray.md (unparseable)"]);
    expect(columnZero(lines)).toEqual([lines[0], `note ${id}`, "skipped forged.md (unsealed)", "skipped stray.md (unparseable)"]);
    expect(lines.join("\n")).not.toContain("FORGED BODY");
    expect(lines.join("\n")).not.toContain("PLAIN TEXT");
  });

  it("a FIFO in notes/ ends exit 2 in bounded time, naming it, with nothing on stdout (T-41-98)", () => {
    const root = repo();
    notedId(note(root, "add", "t1", ...OBSERVATION), "t1");
    const skipped = stageShapeOrSkip("FIFO", join(notesDir(root, "t1"), "fifo.md"), READ_POSITION);
    if (skipped !== null) {
      console.warn(skipLine(skipped, READ_PINNED_BY));
      return;
    }
    expectCouldNotRun(read(root, "t1"), "fifo.md", "not-a-regular-file");
  });

  it("a dangling link in notes/ ends exit 2, naming it, with nothing on stdout (T-41-98)", () => {
    const root = repo();
    notedId(note(root, "add", "t1", ...OBSERVATION), "t1");
    const at = join(notesDir(root, "t1"), "dangling.md");
    const skipped = stageSymlinkOrSkip(join(notesDir(root, "t1"), "nowhere.md"), at, "dangling symlink", READ_POSITION);
    if (skipped !== null) {
      console.warn(skipLine(skipped, READ_PINNED_BY));
      return;
    }
    expectCouldNotRun(read(root, "t1"), "dangling.md", "vanished");
  });

  it("a file above the ceiling in notes/ ends exit 2, naming it (T-41-98)", () => {
    const root = repo();
    notedId(note(root, "add", "t1", ...OBSERVATION), "t1");
    writeFileSync(join(notesDir(root, "t1"), "huge.md"), Buffer.alloc(CEILING_BYTES + 1, 0x61));
    expectCouldNotRun(read(root, "t1"), "huge.md", "above-ceiling");
  });

  it("a symbolic link on the path to notes/ ends exit 2 by name", () => {
    const root = repo();
    mkdirSync(join(root, CONTEXT_REL, "t1"), { recursive: true });
    const outside = mkTmp("grugops-note-outside-");
    const skipped = stageSymlinkOrSkip(outside, notesDir(root, "t1"), "symlink leaving the repository root", READ_POSITION);
    if (skipped !== null) {
      console.warn(skipLine(skipped, "the add cases of the root and the path to notes/ (the same owner)"));
      return;
    }
    expectCouldNotRun(read(root, "t1"), `${CONTEXT_REL}/t1/notes`, "symbolic link");
  });

  it("read with a flag, with no folder, with two folders or with an unsafe folder ends exit 2", () => {
    const root = repo();
    expectCouldNotRun(read(root, "t1", "--kind", "observation"), "read");
    expectCouldNotRun(read(root, "--all"), "read");
    expectCouldNotRun(read(root), "read");
    expectCouldNotRun(read(root, "t1", "t2"), "read");
    for (const folder of ["..", "a/b", ""]) expectCouldNotRun(read(root, folder));
  });

  it("a directory with no .grugops/ is exit 2", () => {
    const root = mkTmp("grugops-note-bare-");
    expectCouldNotRun(read(root, "t1"), GRUGOPS_DIR_REL);
    expect(readdirSync(root)).toEqual([]);
  });
});
