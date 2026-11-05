// flow-guidance-text.test.ts — text assertions over the flow guidance plan 41-04 writes.
//
// Plan 41-04 makes agent-factory/workflows/17-task-claim.md the one home of the flow guidance: one
// command per step, a refill on every completion, a sweep that cannot steal running work and session
// compaction the Orchestrator can act on with signals it can see (RUN-01 to RUN-06). It also adds the
// step in agent-factory/workflows/16-context-read-write.md that tells a spawned role its last act, and
// the `queue` rows of agent-factory/config/factory.config.md.
//
// No hook enforces this guidance on any host. The words are the control, so each case reads the
// shipped file and asserts a stated phrase, an absence or an ordering.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const WF17 = readFileSync(join(ROOT, "agent-factory/workflows/17-task-claim.md"), "utf8");
const WF16 = readFileSync(join(ROOT, "agent-factory/workflows/16-context-read-write.md"), "utf8");

/** The body of the `## <heading>` section (prefix match), up to the next `## ` heading. */
function section(text: string, heading: string): string {
  const lines = text.split("\n");
  const start = lines.findIndex((l) => l.startsWith(`## ${heading}`));
  expect(start, `no "## ${heading}" section`).toBeGreaterThanOrEqual(0);
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => l.startsWith("## "));
  return (end === -1 ? rest : rest.slice(0, end)).join("\n");
}

/** The line of `## Steps` that opens with step `n`. */
function step(text: string, n: number): string {
  const line = section(text, "Steps")
    .split("\n")
    .find((l) => l.startsWith(`${n}. `));
  expect(line, `no step ${n}`).toBeDefined();
  return line as string;
}

/** The `- ` bullets of a section body, one string per bullet. */
function bullets(body: string): string[] {
  return body.split("\n").filter((l) => l.startsWith("- "));
}

describe("Workflow 17 reads as one command per step (plan 41-04; RUN-05, D-01, D-03, D-04, D-05)", () => {
  it("records the D-04 reversal as a decision, and drops the old rule as a current rule", () => {
    const agents = section(WF17, "Agents involved");
    expect(agents).toContain("**Decision (Phase 41, D-04, human, 2026-11-04).**");
    expect(agents).toContain("claims at dispatch in the adapter's name");
    expect(agents).toContain("This reverses the earlier rule");
    expect(WF17).not.toContain("It does not claim on another role's behalf");
  });

  it("names a command for each act in `## Steps`", () => {
    const steps = section(WF17, "Steps");
    for (const literal of [
      "node tools/grugops/claim.js free",
      "node tools/grugops/claim.js claim",
      "--by",
      "--level",
      "node tools/grugops/claim.js done",
    ]) {
      expect(steps, literal).toContain(literal);
    }
  });

  it("names no library function and no source path anywhere", () => {
    for (const absent of ["scripts/claim.js", "claimTask", "sweepStale", "transition("]) {
      expect(WF17, absent).not.toContain(absent);
    }
  });

  it("gives the pending file's two exact lines in step 1, and no enqueue command", () => {
    const first = step(WF17, 1);
    expect(first).toContain("exactly two lines");
    expect(first).toContain("Line one is `# subtask <task>`.");
    expect(first).toContain("Line two is `ref: .grugops/context/<task>/`.");
    expect(WF17).not.toContain("claim.js enqueue");
  });

  it("reads free capacity from disk in step 2 and treats a lost claim as no error in step 3", () => {
    expect(step(WF17, 2)).toContain("never a remembered count of running agents");
    const claim = step(WF17, 3);
    expect(claim).toContain("Exit 1 prints `lost <task>`");
    expect(claim).toContain("a lost claim is NOT an error");
    expect(claim).toContain("Any other exit is a genuine failure");
  });

  it("starts a tiered engineer by adapter name in step 4, with no per-call override (D-13)", () => {
    const hand = step(WF17, 4);
    expect(hand).toContain("as a non-fork sub-agent");
    expect(hand).toContain("Pass no `model` or `effort` parameter on the spawn call.");
    expect(hand).toContain("`agent-factory/roles/_role-switch-protocol.md`");
  });

  it("makes `done` the role's last act in step 7, with its refusal and no hand move", () => {
    const done = step(WF17, 7);
    expect(done).toContain("as the role's last act");
    expect(done).toContain("refuses with exit 1");
    expect(done).toContain("no sealed note since the claim's `at`");
    expect(done).toContain("names any unsealed notes");
    expect(done).toContain("Never move a subtask by hand.");
  });

  it("keeps the record's `by` for its three readers, and calls the `--by` refusal a backstop", () => {
    const seam = section(WF17, "The claim/note seam");
    expect(seam).toContain("`by` stays for its three readers: the render, the sweep and the board reader.");
    expect(seam).toContain("refuses `--by grugops-orchestrator`, in any letter case");
    expect(seam).toContain("an instruction backstop, not a security boundary");
  });

  it("gives the current host limit in the Platform section (research Pitfall 10)", () => {
    const platform = section(WF17, "Platform depth and width");
    expect(platform).not.toContain("200 per session");
    expect(platform).toContain("`CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`");
    expect(platform).toContain("sets no session total");
    expect(platform).toContain("A resume skips that host check.");
  });

  it("keeps three stop bullets, the third ending on its tag and gaining the no-writer case", () => {
    const stops = bullets(section(WF17, "Stop conditions"));
    expect(stops).toHaveLength(3);
    expect(stops[2]).toContain("no sealed-note writer");
    expect(stops[2].trimEnd().endsWith("`checkpoint: exhaust_self_fix_budget`")).toBe(true);
  });

  it("keeps the sentence claim C-28-033 quotes", () => {
    expect(WF17).toContain("Coordination is ONLY through the on-disk substrate");
  });

  it("leaves the frozen `## Commit` section word for word", () => {
    expect(section(WF17, "Commit").trim()).toBe(
      "Commit the queue and context state this workflow advanced per `agent-factory/_commit-convention.md` — branch guard first (never a protected branch), then `type(scope): summary`. The artifacts are the moved subtask records and any `notes/` / derived `index.*` that `context-io.ts` produced. This workflow claims and schedules work; it never merges and never deploys — humans hold both.",
    );
  });
});

describe("Workflow 16 tells a spawned role its last act (plan 41-04; D-05)", () => {
  it("adds a step 5 that names `done` and Workflow 17", () => {
    const last = step(WF16, 5);
    expect(last).toContain("`node tools/grugops/claim.js done <task>`");
    expect(last).toContain("`agent-factory/workflows/17-task-claim.md`");
    expect(last).toContain("sealed note written since the claim");
  });

  it("sets step 5 after the three admission outcomes, directly before `## Stop conditions`", () => {
    const steps = section(WF16, "Steps").trimEnd().split("\n");
    expect(steps[steps.length - 1].startsWith("5. ")).toBe(true);
  });
});
