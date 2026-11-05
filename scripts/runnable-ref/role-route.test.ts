// role-route.test.ts — a role reaches the writer by following the text (phase 41, plan 41-11, CR-01, RUN-02, RUN-05, D-35).
//
// A shipped program is not a route until a role can find it by following the kit text. Truth 3 of 41-VERIFICATION.md
// failed while the validation map stayed green, because the only test imported the writer directly. So this file imports
// nothing from the context-io module and nothing from a program under test. It reads the commands out of Workflow 16 and
// Workflow 17 as code spans, fills their placeholders, and runs them as written from a temporary repository that holds
// only the committed host copies, under an environment that holds only PATH.
//
// A passing run proves that the text and the host copies agree. It does not prove that a spawned role gets there under
// a host's permission model: only the live run read by a named human shows that (R-41-01).

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CONTEXT_REL, GRUGOPS_DIR_REL, QUEUE_DONE_REL, QUEUE_PENDING_REL } from "../../install/state-layout.js";

const ROOT = join(import.meta.dirname, "..", "..");
const WF16 = readFileSync(join(ROOT, "agent-factory/workflows/16-context-read-write.md"), "utf8");
const WF17 = readFileSync(join(ROOT, "agent-factory/workflows/17-task-claim.md"), "utf8");

const tmpRoots: string[] = [];
afterAll(() => {
  for (const d of tmpRoots) rmSync(d, { recursive: true, force: true });
});

/** The body of `## Steps`, up to the next `## ` heading. */
function steps(text: string): string[] {
  const lines = text.split("\n");
  const start = lines.indexOf("## Steps");
  expect(start, "no `## Steps` section").toBeGreaterThanOrEqual(0);
  const rest = lines.slice(start + 1);
  return rest.slice(0, rest.findIndex((l) => l.startsWith("## ")));
}

/** The one code span of step `n` that opens with `command`, read as the text writes it. */
function commandInStep(text: string, n: number, command: string): string {
  const line = steps(text).find((l) => l.startsWith(`${n}. `)) ?? "";
  const spans = [...line.matchAll(/`([^`]+)`/g)].map((m) => m[1] as string).filter((span) => span.startsWith(command));
  expect(spans.length, `step ${n} has no code span opening with ${command}`).toBe(1);
  return spans[0] as string;
}

/** Each placeholder the commands may hold, with the value a role following the text would give it. */
const TASK = "t1";
const PLACEHOLDERS: ReadonlyMap<string, string> = new Map([
  ["<task>", TASK],
  ["<adapter>", "grugops-qe-e2e"],
  ["<folder>", TASK],
  ["<kind>", "observation"],
  ["<role>", "qe-e2e"],
  ["<confidence>", "high"],
  ["<ref>", "ABC-1"],
  ["<text>", "The route ran from the text."],
]);

/** The command as argv, its placeholders filled. A placeholder not in the map stops the test, so a new one cannot pass unrun. */
function argvOf(command: string): string[] {
  return command.split(/\s+/).map((word) => {
    if (!/[<>]/.test(word)) return word;
    const value = PLACEHOLDERS.get(word);
    if (value === undefined) throw new Error(`the kit text holds a placeholder this test does not know: ${word}`);
    return value;
  });
}

interface Ran {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

/** One command, run as the text writes it, from `cwd`, with only PATH in the environment. */
function run(cwd: string, argv: readonly string[]): Ran {
  const [program, ...args] = argv as [string, ...string[]];
  const r = spawnSync(program, args, { encoding: "utf8", cwd, env: { PATH: process.env.PATH }, timeout: 15_000 });
  expect(r.error, "the command did not finish in bounded time").toBeUndefined();
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

/** A repository holding only `.grugops/`, and the host copies when `withPrograms` is true. */
function hostRepo(withPrograms: boolean): string {
  const root = mkdtempSync(join(tmpdir(), "grugops-role-route-"));
  tmpRoots.push(root);
  mkdirSync(join(root, GRUGOPS_DIR_REL));
  mkdirSync(join(root, QUEUE_PENDING_REL), { recursive: true });
  writeFileSync(join(root, QUEUE_PENDING_REL, `${TASK}.md`), `# subtask ${TASK}\nref: ${CONTEXT_REL}/${TASK}/\n`);
  if (withPrograms) {
    const tools = join(root, "tools", "grugops");
    mkdirSync(tools, { recursive: true });
    for (const name of ["claim.js", "note.js"]) copyFileSync(join(import.meta.dirname, name), join(tools, name));
    writeFileSync(join(tools, "package.json"), '{"type":"module"}\n');
  }
  return root;
}

const FREE = ["node", "tools/grugops/claim.js", "free"];

describe("the kit text's own commands finish a task on host copies (plan 41-11, CR-01, D-35)", () => {
  it("names the note command in step 3 of Workflow 16", () => {
    expect(commandInStep(WF16, 3, "node tools/grugops/note.js add")).toContain("<folder>");
  });

  it("claim, note and done, read from the text, finish a task and give the slot back", () => {
    const claim = argvOf(commandInStep(WF17, 3, "node tools/grugops/claim.js claim"));
    const note = argvOf(commandInStep(WF16, 3, "node tools/grugops/note.js add"));
    const done = argvOf(commandInStep(WF17, 7, "node tools/grugops/claim.js done"));
    const repo = hostRepo(true);

    expect(run(repo, FREE).stdout).toMatch(/^free 3\b/);
    const claimed = run(repo, claim);
    expect(claimed.status, claimed.stderr).toBe(0);
    expect(claimed.stdout).toContain(`claimed ${TASK} by grugops-qe-e2e`);
    expect(run(repo, FREE).stdout).toMatch(/^free 2\b/);

    const early = run(repo, done);
    expect(early.status, early.stderr).toBe(1);
    expect(early.stdout.startsWith(`not-done ${TASK}:`), "done refuses before the note").toBe(true);

    const noted = run(repo, note);
    expect(noted.status, noted.stderr).toBe(0);
    expect(noted.stdout.startsWith(`noted ${TASK} `), "the writer names the note").toBe(true);
    expect(readdirSync(join(repo, CONTEXT_REL, TASK, "notes"))).toHaveLength(1);

    const finished = run(repo, done);
    expect(finished.status, finished.stderr).toBe(0);
    expect(finished.stdout.split("\n")).toContain(`done ${TASK}`);
    expect(existsSync(join(repo, QUEUE_DONE_REL, `${TASK}.md`)), "the subtask reached done/").toBe(true);
    expect(run(repo, FREE).stdout).toMatch(/^free 3\b/);
  });

  it("stops on a placeholder it does not know, so a new flag in the text cannot pass unrun", () => {
    expect(() => argvOf("node tools/grugops/note.js add <folder> --new <unknown>")).toThrow("<unknown>");
  });
});
