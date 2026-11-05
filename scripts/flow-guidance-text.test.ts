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
const CONFIG = readFileSync(join(ROOT, "agent-factory/config/factory.config.md"), "utf8");

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

/** Any host's name, as a whole word. Workflow 17 may name a host in two sections only. */
const HOST_NAME = new RegExp(`\\b(${["Claude Code", "Codex", "Antigravity", "OpenCode", "Copilot", "Pi"].join("|")})\\b`);

/** The number of times `needle` occurs in `hay`, counted without overlap. */
function occurrences(hay: string, needle: string): number {
  return hay.split(needle).length - 1;
}

/** The `### Operator tips (optional)` block, up to the next `## ` heading. */
function tips(text: string): string {
  const body = section(text, "Session compaction");
  const at = body.indexOf("### Operator tips (optional)");
  expect(at, "no operator tips block").toBeGreaterThanOrEqual(0);
  return body.slice(at);
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
    expect(step(WF17, 1)).toContain("exactly two lines");
    const steps = section(WF17, "Steps").split("\n");
    const at = steps.findIndex((l) => l.startsWith("1. "));
    expect(steps[at + 1]).toBe("   - Set line one to `# subtask <task>`.");
    // The SCTX-05 guard reads a `>` beside the context path as a redirect, so this line holds an
    // example id and no `<task>`. Written with the placeholder, it fails check-foundation-guards.
    expect(steps[at + 2]).toBe(
      "   - Set line two to the task's context folder: `ref: .grugops/context/abc-104/` for task `abc-104`.",
    );
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

describe("Workflow 17 keeps capacity full (plan 41-04; RUN-02, D-06, D-09, D-10, D-26)", () => {
  it("names the refill's one trigger, with no timer and no polling", () => {
    const keep = section(WF17, "Keep capacity full");
    expect(keep).toContain("on every agent return or completion notice and on every user turn");
    expect(keep).toContain("No timer and no polling drives it.");
    expect(keep).toContain("End the turn only after that.");
  });

  it("takes ready work by board priority, with a stated tie rule", () => {
    const keep = section(WF17, "Keep capacity full");
    expect(keep).toContain("by board priority");
    expect(keep).toContain("the Definition of Ready");
    expect(keep).toContain("ties keep board order");
  });

  it("claims nothing with no ready work, and ends the turn", () => {
    expect(section(WF17, "Keep capacity full")).toContain("With no ready work, claim nothing and end the turn.");
  });

  it("never reuses a finished agent, and keeps the slot busy until a task is finished", () => {
    const keep = section(WF17, "Keep capacity full");
    expect(keep).toContain("by never reusing it");
    expect(keep).toContain("New work always goes to a fresh spawn of the named adapter.");
    expect(keep).toContain("Resume or re-spawn the same adapter");
    expect(keep).toContain("The slot stays busy until then.");
  });

  it("keeps the slot busy where no sealed-note writer exists, and stops", () => {
    const writer = bullets(section(WF17, "Keep capacity full")).find((b) => b.includes("no sealed-note writer"));
    expect(writer).toBeDefined();
    expect(writer).toContain("`done` keeps refusing and the slot stays busy");
    expect(writer).toContain("`## Stop conditions`");
    expect(writer).toContain("name the unsealed notes");
  });

  it("pauses only the waiting ticket, and lists the open questions in the Next action line", () => {
    const keep = section(WF17, "Keep capacity full");
    expect(keep).toContain("Only the waiting ticket pauses.");
    expect(keep).toContain("keep refilling with other ready work");
    expect(keep).toContain("Next action line");
  });

  it("states a refill on a host with no spawn tool without naming a host", () => {
    expect(section(WF17, "Keep capacity full")).toContain(
      "Where the `Agent` tool does not exist, a refill means taking the next ready task.",
    );
  });
});

describe("Workflow 17 sweeps only at session start (plan 41-04; RUN-02, D-11, D-29)", () => {
  it("runs the sweep command in `## Session start`, and in no other section", () => {
    const sweep = "node tools/grugops/claim.js sweep";
    const start = section(WF17, "Session start");
    expect(start).toContain(sweep);
    expect(WF17.split(sweep)).toHaveLength(2);
  });

  it("says when the sweep runs, and why no spawned agent can be hit", () => {
    const start = section(WF17, "Session start");
    expect(start).toContain("only at session start, including the fresh-session fallback");
    expect(start).toContain("No agent the Orchestrator spawned can still be running then.");
  });

  it("releases a claim already in `done/`, and never reclaims it", () => {
    expect(section(WF17, "Session start")).toContain(
      "A claim whose subtask already sits in `done/` is released, not reclaimed.",
    );
  });

  it("reports a long claim in a live session and leaves it", () => {
    const start = section(WF17, "Session start");
    expect(start).toContain("Inside a live session, report a long claim and leave it in place.");
    expect(start).toContain("Reclaiming it could hand a slow agent's task to a second agent.");
  });

  it("orders session start as read, sweep, refill", () => {
    const ordered = section(WF17, "Session start")
      .split("\n")
      .filter((l) => /^\d+\. /.test(l));
    expect(ordered).toHaveLength(3);
    expect(ordered[0]).toContain("`now-running.md`");
    expect(ordered[1]).toContain("claim.js sweep");
    expect(ordered[2]).toContain("`## Keep capacity full`");
  });

  it("keeps the TTL key named", () => {
    expect(WF17).toContain("`queue.stale_ttl_minutes`");
    expect(section(WF17, "Session start")).toContain("`queue.stale_ttl_minutes`");
  });

  it("names no host in either section", () => {
    for (const body of [section(WF17, "Keep capacity full"), section(WF17, "Session start")]) {
      expect(body).not.toMatch(HOST_NAME);
    }
  });

  it("sets both sections after `## Steps` and before `## Stop conditions`", () => {
    const at = (h: string): number => WF17.indexOf(`\n## ${h}\n`);
    expect(at("Steps")).toBeGreaterThan(0);
    expect(at("Keep capacity full")).toBeGreaterThan(at("Steps"));
    expect(at("Session start")).toBeGreaterThan(at("Keep capacity full"));
    expect(at("Stop conditions")).toBeGreaterThan(at("Session start"));
  });
});

describe("Workflow 17 holds session compaction (plan 41-04; RUN-03, RUN-04, D-14 to D-20, D-29)", () => {
  /** The section up to its operator tips, which is what the Orchestrator acts on. */
  const rules = (): string => section(WF17, "Session compaction").split("### Operator tips (optional)")[0];

  it("opens by naming Workflow 18 as a different thing", () => {
    const opening = rules().trimStart().split("\n")[0];
    expect(opening).toContain("It is not note compaction, which Workflow 18 owns under the name context compaction.");
  });

  it("covers the Orchestrator only, and says it is guidance with no config key", () => {
    const opening = rules().trimStart().split("\n")[0];
    expect(opening).toContain("this guidance covers the Orchestrator only");
    expect(opening).toContain("It is guidance, not a gate, and it adds no config key.");
  });

  it("lists exactly the three observable triggers", () => {
    const triggers = bullets(rules());
    expect(triggers).toHaveLength(3);
    expect(triggers[0].startsWith("- A ticket boundary")).toBe(true);
    expect(triggers[1].startsWith("- About 10 closed agents")).toBe(true);
    expect(triggers[2].startsWith("- A host signal")).toBe(true);
  });

  it("keeps the count in memory, with no on-disk counter", () => {
    expect(rules()).toContain("Keep this count in memory, with no on-disk counter.");
    expect(rules()).toContain("Any compaction or fresh session resets it.");
  });

  it("runs pause, confirm, compact, otherwise checkpoint, in that written order", () => {
    const ordered = rules()
      .split("\n")
      .filter((l) => /^\d+\. /.test(l));
    expect(ordered).toHaveLength(4);
    expect(ordered[0].startsWith("1. Pause dispatch")).toBe(true);
    expect(ordered[1].startsWith("2. Confirm the queue, the board and the notes are on disk.")).toBe(true);
    expect(ordered[2].startsWith("3. Compact the session")).toBe(true);
    expect(ordered[3].startsWith("4. Otherwise checkpoint")).toBe(true);
  });

  it("runs one pause however many triggers fired, and never asks the human", () => {
    expect(rules()).toContain("follow these steps once, however many triggers fired together.");
    expect(rules()).toContain("Never ask the human.");
  });

  it("points the checkpoint at `## Commit` with its branch guard, and never restates that section", () => {
    const checkpoint = rules()
      .split("\n")
      .find((l) => l.startsWith("4. "));
    expect(checkpoint).toContain("per `## Commit`");
    expect(checkpoint).toContain("Run the branch guard first, and never commit to a protected branch.");
    expect(checkpoint).toContain("carry on refilling");
  });

  it("ends the pause at once with nothing running, and runs no sweep after a compaction", () => {
    expect(rules()).toContain("With nothing running, the pause ends at once.");
    expect(rules()).toContain("re-read `now-running.md` and the board, then refill");
    expect(rules()).toContain("No sweep runs here, because agents the Orchestrator spawned can still be running.");
  });

  it("keeps a fresh session as the fallback on every host, through `## Session start`", () => {
    expect(rules()).toContain("A fresh session is the fallback on every host.");
    expect(rules()).toContain("follows `## Session start`");
  });

  it("uses the session name, promises no number and makes no token or cost claim", () => {
    expect(occurrences(WF17.toLowerCase(), "session compaction")).toBeGreaterThanOrEqual(2);
    for (const absent of ["compact at", "compacts at", "compact near", "tokens", "cheaper"]) {
      expect(WF17, absent).not.toContain(absent);
    }
  });

  it("sets the operator tips last in the section, directly before `## Stop conditions`", () => {
    const headings = WF17.split("\n").filter((l) => /^#{2,3} /.test(l));
    const at = headings.indexOf("### Operator tips (optional)");
    expect(at).toBeGreaterThanOrEqual(0);
    expect(headings[at - 1]).toBe("## Session compaction");
    expect(headings[at + 1]).toBe("## Stop conditions");
  });

  it("gives the host settings, and sends each host with no setting to the fallback", () => {
    const block = tips(WF17);
    expect(block).toContain("`/autocompact 400k`");
    expect(block).toContain("`model_auto_compact_token_limit = 400000`");
    expect(block).toContain("`compaction.reserveTokens`");
    expect(block).toContain("Antigravity CLI, OpenCode and GitHub Copilot CLI: use the fresh-session fallback.");
  });

  it("says the installer writes none of the tips", () => {
    expect(tips(WF17)).toContain("the installer writes none of them");
  });

  it("names a host only in the Platform section and the operator tips, across the whole file", () => {
    const lines = WF17.split("\n");
    const heads = lines.flatMap((l, i) => (/^#{2,3} /.test(l) ? [i] : []));
    expect(heads.length).toBeGreaterThan(10);
    const allowed = new Set(["## Platform depth and width", "### Operator tips (optional)"]);
    const seen: string[] = [];
    for (const [n, start] of heads.entries()) {
      seen.push(lines[start]);
      if (allowed.has(lines[start])) continue;
      const body = lines.slice(start, heads[n + 1] ?? lines.length).join("\n");
      expect(body, lines[start]).not.toMatch(HOST_NAME);
    }
    for (const heading of allowed) expect(seen).toContain(heading);
  });
});

describe("factory.config.md agrees with Workflow 17 (plan 41-04; D-01, D-04, D-11)", () => {
  /** The table row of one `queue` key. */
  const row = (key: string): string => {
    const line = CONFIG.split("\n").find((l) => l.startsWith(`| \`${key}\` |`));
    expect(line, key).toBeDefined();
    return line as string;
  };

  it("says the sweep runs only at session start", () => {
    const stale = row("stale_ttl_minutes");
    expect(stale).toContain("`node tools/grugops/claim.js sweep`");
    expect(stale).toContain("The sweep runs only at session start, including the fresh-session fallback");
    expect(stale).toContain("a long claim is reported, not reclaimed");
    expect(stale).not.toContain("coordinator's stale-claim sweep");
  });

  it("says the Orchestrator claims one task per agent it starts", () => {
    const cap = row("claim_cap");
    expect(cap).toContain("one task per agent it starts");
    expect(cap).not.toContain("it claims at most this many and yields");
  });

  it("says what `free` prints against the width", () => {
    expect(row("wip_limit")).toContain("`node tools/grugops/claim.js free` prints this limit minus the `claimed/` count read from disk.");
  });
});
