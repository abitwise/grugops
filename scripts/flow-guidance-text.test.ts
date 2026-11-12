// flow-guidance-text.test.ts — text assertions over the flow guidance plan 41-04 writes.
//
// Plan 41-04 makes agent-factory/workflows/17-task-claim.md the one home of the flow guidance: one
// command per step, a refill on every completion, a sweep that cannot steal running work and session
// compaction the Orchestrator can act on with signals it can see (RUN-01 to RUN-06). It also adds the
// step in agent-factory/workflows/16-context-read-write.md that tells a spawned role its last act, and
// the `queue` rows of agent-factory/config/factory.config.md.
//
// Plan 41-06 points the Orchestrator at that workflow with one line, states the RUN-06 limit in its
// `## Hard limits`, and moves the claim out of the role-switch step (D-04, D-05, D-12, D-13, D-32).
//
// Plan 41-16 states the supersession rule of plan 41-15 where a role reads about `--supersedes`: step 3
// of Workflow 16 and the correction paragraph of the note contract (CR-02, D-37).
//
// No hook enforces this guidance on any host. The words are the control, so each case reads the
// shipped file and asserts a stated phrase, an absence or an ordering.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const WF17 = readFileSync(join(ROOT, "agent-factory/workflows/17-task-claim.md"), "utf8");
const WF16 = readFileSync(join(ROOT, "agent-factory/workflows/16-context-read-write.md"), "utf8");
const WF05 = readFileSync(join(ROOT, "agent-factory/workflows/05-pr-quality-gate.md"), "utf8");
const CONFIG = readFileSync(join(ROOT, "agent-factory/config/factory.config.md"), "utf8");
const ORCHESTRATOR = readFileSync(join(ROOT, "agent-factory/roles/orchestrator.md"), "utf8");
const ROLE_SWITCH = readFileSync(join(ROOT, "agent-factory/roles/_role-switch-protocol.md"), "utf8");
const KIT_README = readFileSync(join(ROOT, "agent-factory/README.md"), "utf8");
const NOTE_CONTRACT = readFileSync(join(ROOT, "agent-factory/contracts/context-note.md"), "utf8");

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
    expect(claim).toContain("Exit 1 with the line `lost <task>` on stdout is a lost claim, NOT an error.");
    expect(claim).toContain("Take the next pending task.");
    expect(claim).toContain("Any other exit, or exit 1 without that line, is a genuine failure: stop and surface it.");
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

  it("stops when either program is absent, at the top of `## Steps` (WR-01)", () => {
    expect(section(WF17, "Steps")).toContain(
      "If `tools/grugops/claim.js` or `tools/grugops/note.js` is absent, stop and name the scripted install.",
    );
  });

  it("reads exit 1 of `done` as `not-done` only with that line, and any other exit is a stop that leaves the claim (WR-01, WR-05)", () => {
    const done = step(WF17, 7);
    expect(done).toContain("Its `not-done <task>:` line names any unsealed notes it found.");
    expect(done).toContain(
      "Any other exit, or exit 1 without that line, is a genuine failure. Stop, surface it and leave the claim in place.",
    );
  });

  it("says a refill that trusts `free` does not over-spawn, and claims no mechanism inside `claim` (IN-08)", () => {
    const agents = section(WF17, "Agents involved");
    expect(agents).toContain("so a refill that trusts `free` does not over-spawn.");
    expect(WF17).not.toContain("cannot over-spawn");
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

describe("The kit text names the host note writer (plan 41-11; CR-01, RUN-02, RUN-05, D-35)", () => {
  /** The `finding` bullet of step 3. */
  const findingBullet = (): string => {
    const line = section(WF16, "Steps")
      .split("\n")
      .find((l) => l.startsWith("   - Record a `finding`"));
    expect(line, "no finding bullet").toBeDefined();
    return line as string;
  };

  it("says in `## When to use` that a host carries a generated copy of the writer", () => {
    expect(section(WF16, "When to use")).toContain(
      "On a host, `tools/grugops/note.js` carries a generated copy of that writer.",
    );
  });

  it("gives the whole command in step 3 and says what its placeholders are", () => {
    const record = step(WF16, 3);
    for (const sentence of [
      "Write a note on every host from the repository root.",
      "Run `node tools/grugops/note.js add <folder> --kind <kind> --by <role> --confidence <confidence> --ref <ref> --body <text>`.",
      "`<folder>` is the folder the subtask's `ref:` line names.",
      "Pass its bare name, such as `abc-104`, and never the path.",
      "`<role>` is the role file's name without `.md`, never the adapter name.",
      "Repeat `--ref` for each trace id.",
      "Pass `--body-file <path>` in place of `--body` for a long body.",
      "`--verified-by`, `--supersedes`, `--sha`, `--gate-run` and `--content-hash` set those note fields.",
      "The program stamps `at` itself.",
    ]) {
      expect(record, sentence).toContain(sentence);
    }
  });

  it("says what each exit of the writer means, and stops when the program is absent", () => {
    const record = step(WF16, 3);
    for (const sentence of [
      "Exit 0 prints `noted <folder> <id>`.",
      "Exit 1 prints `refused <folder>: <reason>` and writes nothing, so read the reason per step 4.",
      "Any other exit is a genuine failure: stop and surface it.",
      "If `tools/grugops/note.js` is absent, stop and name the scripted install.",
    ]) {
      expect(record, sentence).toContain(sentence);
    }
  });

  it("gives `propose_note` to the Orchestrator alone, and keeps the structured-argument sentence on that tool", () => {
    // Moved by plan 41-26 under D-45 (41-UAT.md test 9, Olger, 2026-11-12): review finding WR-18.
    const record = step(WF16, 3);
    expect(record).toContain(
      "On a Claude Code plugin install the Orchestrator also holds the STRUCTURED tool `mcp__plugin_grugops_grugops__propose_note`, and a spawned role does not.",
    );
    expect(record).toContain("On that tool the agent admits a note by structured JSON arguments");
    expect(record).not.toContain("the sanctioned admission path");
  });

  it("puts a spawned role on Claude Code in the weaker tier, because the writer runs outside the hook", () => {
    expect(findingBullet()).toContain(
      "A spawned role on Claude Code gets the same two, because `tools/grugops/note.js` runs outside the hook.",
    );
  });

  it("says in step 3 that a root with no configuration does not outrank, and that an unfinished order refuses (plan 41-14)", () => {
    const bullet = findingBullet();
    const order = [
      "The last is the shared kit.",
      "A root from the first two steps with no configuration does not outrank one that governs the working directory.",
      "When the order cannot finish, it names no root and every note is refused.",
    ];
    for (const sentence of order) expect(bullet, sentence).toContain(sentence);
    expect(bullet).toContain(order.join(" "));
  });

  it("states the limit of the writer beside the capability the agent controls (plan 41-14, R-31-15-03)", () => {
    expect(findingBullet()).toContain(
      "The accepted residual `R-31-15-01` records that capability. `tools/grugops/note.js` has the same limit: " +
        "a process that names a root carrying its own configuration moves the dial (`R-31-15-03`).",
    );
  });

  it("says in step 5 that the writer makes the sealed note, and a hand-written one never counts", () => {
    expect(step(WF16, 5)).toContain("`tools/grugops/note.js` writes one, and a hand-written note never counts.");
  });

  it("names the writer in steps 6 and 7 of Workflow 17", () => {
    expect(step(WF17, 6)).toContain("Record results into the shared verified context ONLY via WF16, under the honest note kind.");
    expect(step(WF17, 6)).toContain(
      "The writer is `node tools/grugops/note.js add`, the host copy of `context-io.ts` `appendNote`.",
    );
    expect(step(WF17, 7)).toContain("Publish what is missing with `node tools/grugops/note.js add` per WF16, then run it again.");
  });

  it("names the writer in step 4 of the role-switch protocol, in the same indent", () => {
    expect(ROLE_SWITCH).toContain(
      "   Write each note with `node tools/grugops/note.js add`, per step 3 of Workflow 16.\n",
    );
  });
});

describe("The kit text says what the governance-root order does (plan 41-14; RUN-02, RUN-05, T-41-62)", () => {
  const ORDER = "The governance-root resolution order";

  /** The bullet of `## Stop conditions` for a root that could not be named. */
  const rootStop = (): string => {
    const line = section(WF16, "Stop conditions")
      .split("\n")
      .find((l) => l.startsWith("- A refusal says the governance root could not be named"));
    expect(line, "no stop for a root that could not be named").toBeDefined();
    return line as string;
  };

  it("says tier 4 answers only after tier 3 ran and found nothing", () => {
    expect(section(WF16, ORDER)).toContain(
      "4. **Tier 4** — the shared kit this reader ships in, whose shipped dial is the lean default. " +
        "It answers only after tier 3 ran and found nothing.\n",
    );
  });

  it("states the two ladder rules after the tier list and before what tier 0 does not establish", () => {
    const order = section(WF16, ORDER);
    const named =
      "**A named root with no configuration.** A root from tier 0, 1 or 2 that carries no factory configuration does " +
      "not answer alone. Tier 3 then runs. A project configuration it finds answers instead. Otherwise the named root stands.";
    // Moved by plan 41-24 (IN-14, D-42; 41-UAT.md test 7, Olger, 2026-11-11): a named root with a configuration pre-empts the stop.
    const unfinished =
      "**When the order cannot finish.** A failed read stops the order. " +
      "With no named root carrying a factory configuration, an undeterminable home directory or an unreadable working " +
      "directory stops it too. The same holds for a working directory above the home directory, where tier 3 inspects " +
      "nothing. No root is named, and every admission is refused. A lean repository is refused the same way.";
    expect(order).toContain(named);
    expect(order).toContain(unfinished);
    expect(order.indexOf("4. **Tier 4**")).toBeLessThan(order.indexOf(named));
    expect(order.indexOf(named)).toBeLessThan(order.indexOf(unfinished));
    expect(order.indexOf(unfinished)).toBeLessThan(order.indexOf("**What tier 0 does not establish.**"));
  });

  it("gives a role a written stop for a root that could not be named, after the hand-written path bullet", () => {
    const stops = section(WF16, "Stop conditions").trimEnd().split("\n");
    expect(rootStop()).toBe(
      "- A refusal says the governance root could not be named → stop and surface it. Nothing about the note is wrong. " +
        // Moved by plan 41-21 (IN-15, D-42; 41-UAT.md test 7, Olger, 2026-11-11): the refusal now names its path.
        "A human repairs `HOME`, the working directory, or the path the refusal names. Do not set a project-directory variable to pass the refusal.",
    );
    const handWritten = stops.findIndex((l) => l.startsWith("- The only way to record the result"));
    expect(stops[handWritten + 1]).toBe(rootStop());
  });

  it("the stop names no project-directory variable, so it coaches no bypass", () => {
    for (const name of ["CLAUDE_PROJECT_DIR", "GRUGOPS_PROJECT_DIR", "GRUGOPS_HOST_DELIVERED_ROOT", "export "]) {
      expect(rootStop(), name).not.toContain(name);
    }
  });

  it("says in step 6 of Workflow 17 that every note is refused, and points at the stop", () => {
    expect(step(WF17, 6)).toContain(
      "Anything the authority refuses is refused here, and nothing is written. " +
        "When the governance root cannot be named, every note is refused. WF16 names the stop.",
    );
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

  it("orders session start as read, sweep, re-spawn, refill", () => {
    const ordered = section(WF17, "Session start")
      .split("\n")
      .filter((l) => /^\d+\. /.test(l));
    expect(ordered).toHaveLength(4);
    expect(ordered[0]).toContain("`now-running.md`");
    expect(ordered[1]).toContain("claim.js sweep");
    expect(ordered[2]).toContain("Re-spawn the adapter named in `by`");
    expect(ordered[3]).toContain("`## Keep capacity full`");
  });

  /** Step 3 of `## Session start`. */
  const respawn = (): string => {
    const line = section(WF17, "Session start")
      .split("\n")
      .find((l) => l.startsWith("3. "));
    expect(line, "no session-start step 3").toBeDefined();
    return line as string;
  };

  it("re-spawns the adapter named in `by` for each claim the sweep left, to finish it and run `done` (WR-03)", () => {
    const step3 = respawn();
    expect(step3).toContain("Finish each claim still in `now-running.md`.");
    expect(step3).toContain("No agent runs it now.");
    expect(step3).toContain("Re-spawn the adapter named in `by`, to finish the task and run `done`.");
  });

  it("keys the re-spawn on the `Agent` tool, and fills the slot the claim already holds (WR-03, RUN-04)", () => {
    const step3 = respawn();
    expect(step3).toContain("Where the `Agent` tool does not exist, switch to that role instead.");
    expect(step3).toContain("The re-spawn fills the slot the claim already holds.");
    expect(step3).not.toMatch(HOST_NAME);
  });

  it("says what clears a row with an empty `by`, and stops on what the sweep cannot clear (WR-03, plan 41-10; WR-11, plan 41-19)", () => {
    expect(respawn()).toContain(
      "A row with an empty `by` names no adapter. " +
        "A sweep after the TTL reclaims one whose directory holds no usable record. " +
        "Stop and name each entry `sweep` prints on a `kept` or `left` line, so a human resolves it.",
    );
    expect(respawn()).not.toContain("a later sweep reclaims it");
  });

  it("does nothing when the sweep left no claim, so the refill still runs (RUN-03 empty)", () => {
    expect(respawn()).toContain("each claim still in `now-running.md`");
    expect(section(WF17, "Session start")).toContain("Refill per `## Keep capacity full`.");
  });

  it("says a claim with no usable `at` is judged by its directory's modified time", () => {
    expect(section(WF17, "Session start")).toContain(
      "It judges a claim with no usable `at` by its directory's modified time against the same TTL.",
    );
  });

  it("says two sessions can sweep or re-spawn each other's claims", () => {
    const start = section(WF17, "Session start");
    expect(start).toContain(
      "Two Orchestrator sessions on one repository can still sweep or re-spawn each other's claims, an accepted residual.",
    );
    expect(start).not.toContain("sweep each other's long claims");
  });

  it("keeps the re-spawn at session start: it runs in no other section (D-11, D-29)", () => {
    expect(section(WF17, "Session compaction")).not.toContain("Re-spawn the adapter");
    expect(section(WF17, "Session compaction")).toContain("No sweep runs here");
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

  it("says the key is retired: nothing reads it, and an existing config stays valid (plan 41-08, IN-01)", () => {
    const cap = row("claim_cap");
    expect(cap).toContain("| `claim_cap` | `2` | Retired: no code reads this key, and its value has no effect. ");
    expect(cap).toContain("so a delegation holds one task whatever the value is.");
    expect(cap).toContain("The key stays in the seed config so an existing file stays valid.");
    expect(cap).not.toContain("Maximum number of tasks");
    expect(cap).not.toContain("anti-flood");
  });

  it("says what `free` prints against the width", () => {
    expect(row("wip_limit")).toContain("`node tools/grugops/claim.js free` prints this limit minus the `claimed/` count read from disk.");
  });
});

describe("orchestrator.md points at Workflow 17 and states the limit (plan 41-06; RUN-04, RUN-06, D-12, D-13, D-32)", () => {
  /** The numbered items of `## Responsibilities`, before its first `###` block. */
  const items = (): string[] =>
    section(ORCHESTRATOR, "Responsibilities")
      .split("\n")
      .filter((l) => /^\d+\. /.test(l));

  it("numbers the responsibilities 1 to 10 with no gap", () => {
    expect(items().map((l) => Number(l.split(".")[0]))).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("holds the pointer line as item 6, word for word", () => {
    expect(items()[5]).toBe("6. Start role agents, claim, refill, sweep and run session compaction per `agent-factory/workflows/17-task-claim.md`.");
  });

  it("no longer holds the flow text the pointer replaced", () => {
    for (const gone of ["spawn role agents up to", "drain the same queue", "Have each role claim", "Sweep claims older"]) {
      expect(ORCHESTRATOR, gone).not.toContain(gone);
    }
  });

  it("keeps the items that are not flow text", () => {
    for (const kept of [
      "Run the gate before a ticket advances.",
      "Require published notes and trace refs from each agent before its ticket advances.",
      "Check each pull against the Definition of Ready.",
      "Give one next action, not a menu.",
    ]) {
      expect(items().some((l) => l.endsWith(kept)), kept).toBe(true);
    }
  });

  it("holds the D-13 and D-32 sentences in `## Hard limits`, word for word", () => {
    const limits = section(ORCHESTRATOR, "Hard limits");
    expect(limits).toContain(
      "The Orchestrator claims a queue task only at dispatch and only in the name of the adapter it starts (`--by <adapter>`). " +
        "It never claims with itself as owner and never does a task's work. " +
        "Where the `Agent` tool does not exist, it does the work only after a role switch.",
    );
  });

  it("sets the limit directly after the paragraph that names the platform limits, and keeps the paragraphs around it", () => {
    const paragraphs = section(ORCHESTRATOR, "Hard limits")
      .split("\n\n")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    const at = paragraphs.findIndex((p) => p.startsWith("The Orchestrator claims a queue task only at dispatch"));
    expect(at).toBe(2);
    expect(paragraphs[0]).toBe(
      "Never merge to a protected branch. Never deploy to production; merge and deploy stay with humans. " +
        "Never pull past a WIP limit or exceed the queue width without a written reason. " +
        "Never route around a stop condition because a request is urgent; urgency is when the gate matters most.",
    );
    expect(paragraphs[1]).toBe(
      "You are the only role that may spawn, and you hold `Agent(<allowlist>)`. " +
        "Never run more role agents at once than `queue.wip_limit`. Give each agent one task; `queue.claim_cap` is retired. " +
        "Never relay data between agents; the shared verified context is the only channel. " +
        "The grant holds because you run as the main thread. Workflow 17 holds the platform's depth and width limits.",
    );
    expect(paragraphs[3]).toBe("Never fake a gate result, a published note or a board move. Mark anything unverified `UNKNOWN - verify`.");
    expect(paragraphs[4]).toBe("Follow the 12 coding rules in `AGENTS.md`.");
  });

  it("still names the role-switch protocol, because the pointer carries the role no path to it", () => {
    const named = section(ORCHESTRATOR, "Reads").includes("- `agent-factory/roles/_role-switch-protocol.md`, where the `Agent` tool does not exist.");
    expect(named, "the Reads section names the protocol").toBe(true);
  });

  it("stays under its 6,195 B WARN", () => {
    expect(Buffer.byteLength(ORCHESTRATOR, "utf8")).toBeLessThan(6195);
  });
});

describe("the role-switch step agrees with Workflow 17 (plan 41-06; D-04, D-05)", () => {
  /** Step 4 of `## The 5 steps`, with its indented lines. */
  const stepFour = (): string => {
    const body = section(ROLE_SWITCH, "The 5 steps");
    return body.slice(body.indexOf("4. Do the one job"), body.indexOf("5. Print"));
  };

  it("says the Orchestrator already claimed, in the role's adapter name", () => {
    expect(stepFour()).toContain("The Orchestrator already claimed queued work per Workflow 17");
    expect(stepFour()).toContain("in this role's adapter name.");
  });

  it("gives the role the `done` command, on queued work only (IN-05, plan 41-19)", () => {
    expect(stepFour()).toContain(
      "When the work was queued, run `node tools/grugops/claim.js done <task>` once its notes are published.",
    );
  });

  it("no longer tells the role to claim", () => {
    expect(stepFour()).not.toContain("claim the subtask");
    expect(stepFour()).not.toContain("Mark the subtask done");
  });
});

describe("the README says who claims (plan 41-06; D-04)", () => {
  it("says the Orchestrator claims at dispatch, and no longer says a role claims its subtask", () => {
    const at = KIT_README.indexOf("- **The lifecycle**");
    expect(at).toBeGreaterThanOrEqual(0);
    const bullet = KIT_README.slice(at, KIT_README.indexOf("\n\n", at));
    expect(bullet.replace(/\n\s*/g, " ")).toContain("it claims each subtask at dispatch in its role's name");
    expect(bullet.replace(/\n\s*/g, " ")).not.toContain("each role claims its subtask");
    expect(bullet.split("\n")).toHaveLength(5);
  });
});

describe("the kit says what a note cannot supersede (plan 41-16; CR-02, RUN-05, D-37)", () => {
  it("states the rule in step 3 of Workflow 16, straight after the sentence that names `--supersedes`", () => {
    expect(step(WF16, 3)).toContain(
      "`--verified-by`, `--supersedes`, `--sha`, `--gate-run` and `--content-hash` set those note fields. " +
        "A note cannot supersede a green gate verdict or a gated finding. " +
        "Only a named human's disposition retires one.",
    );
  });

  // The human flagged the first sentence at Task 1's check: under `narrow` a target that names no note
  // is admitted, and that note can still retire a governed finding that arrives later (D-37, R-41-09).
  // Plan 41-20 (WR-14, D-42) put the sentences on the route that retires one between the rule and this one.
  it("says, straight after the rule and its route, what a target that names no note leaves open", () => {
    expect(step(WF16, 3)).toContain(
      "A note cannot supersede a green gate verdict or a gated finding. " +
        "Only a named human's disposition retires one. ",
    );
    expect(step(WF16, 3)).toContain(
      "Run the gate again and name the new run. " +
        "A target that names no note is still admitted, and residual R-41-09 records what that leaves open. " +
        // Moved by plan 41-24 (WR-15, D-43; 41-UAT.md test 7, Olger, 2026-11-11): the sentence names the renamed-file route.
        "A target in the store that cannot be read is refused, unless its file was renamed (R-41-09).",
    );
  });

  // D-39 (plan 41-18): a target the walk skipped is not a target that names no note, so the rule a role reads sits
  // beside the one it qualifies.
  it("says, straight after the target that names no note, that an unreadable target is refused (T-41-64, D-39)", () => {
    expect(step(WF16, 3)).toContain(
      "residual R-41-09 records what that leaves open. " +
        // Moved by plan 41-24 (WR-15, D-43; 41-UAT.md test 7, Olger, 2026-11-11).
        "A target in the store that cannot be read is refused, unless its file was renamed (R-41-09). " +
        "The program stamps",
    );
  });

  it("states the same exception where the note contract says how a note is corrected", () => {
    const lines = NOTE_CONTRACT.split("\n");
    const trail = lines.indexOf("stays in `notes/` as part of the permanent audit trail.");
    expect(trail, "no audit-trail line").toBeGreaterThanOrEqual(0);
    expect(lines.slice(trail + 1, trail + 3).join(" | ")).toBe(
      "A green gate verdict and a finding the `human_admission` dial gates are the exception: | " +
        "only a named human's disposition retires one.",
    );
  });
});

describe("the queue text names a re-queued subtask and what the sweep leaves (plan 41-19; WR-05, WR-06, WR-07, WR-11, IN-04, IN-05, D-42)", () => {
  const WF04 = readFileSync(join(ROOT, "agent-factory/workflows/04-ticket-to-pr.md"), "utf8");

  it("step 1 of Workflow 17 gives a re-queued subtask a new id, and keeps the two exact lines (WR-06)", () => {
    expect(step(WF17, 1)).toContain(
      "A re-queued subtask takes a new id, such as `abc-104-r2`, and keeps the `ref:` of its per-task context. " +
        "The `claim` command refuses an id already in `done/`.",
    );
    expect(step(WF17, 1)).toContain("exactly two lines");
  });

  it("step 16 of Workflow 04 points at step 1 of Workflow 17, straight after the re-pend rule (WR-06)", () => {
    expect(WF04).toContain(
      "Never re-pend a `done/` subtask. " +
        "Give a re-queued subtask a new id, per step 1 of `agent-factory/workflows/17-task-claim.md`.",
    );
  });

  it("session start step 3 stops on each `kept` or `left` line (WR-07, WR-11)", () => {
    const line = section(WF17, "Session start")
      .split("\n")
      .find((l) => l.startsWith("3. "));
    expect(line).toContain("Stop and name each entry `sweep` prints on a `kept` or `left` line, so a human resolves it.");
  });

  it("the sweep paragraph says a newer pending copy stands and names what is never reclaimed (WR-07, WR-11)", () => {
    expect(section(WF17, "Session start")).toContain(
      "A fresh claim is left untouched. " +
        "A stale claim whose subtask already sits in `pending/` is kept and printed as `kept <task>`, and the pending copy stands. " +
        "A stray file or an unsafe name in `claimed/` is never reclaimed, and the sweep prints it as `left <name>`.",
    );
  });

  it("the Orchestrator points at step 1 of Workflow 17 for the subtask file, and no longer describes it itself (IN-04)", () => {
    expect(ORCHESTRATOR).toContain("5. Enqueue each subtask as a `pending/` file, per step 1 of Workflow 17.");
    expect(ORCHESTRATOR).not.toContain("holding only a");
  });

  it("the role-switch `done` line keeps its condition (IN-05)", () => {
    expect(ROLE_SWITCH).toContain(
      "   When the work was queued, run `node tools/grugops/claim.js done <task>` once its notes are published.",
    );
  });
});

describe("the kit says which route retires a verdict or a gated finding (plan 41-20; WR-14, IN-09, D-42)", () => {
  const CHANGELOG = readFileSync(join(ROOT, "CHANGELOG.md"), "utf8");
  const flat = (text: string): string => text.replace(/\s+/g, " ");

  it("step 3 of Workflow 16 still says only a named human's disposition retires one", () => {
    expect(step(WF16, 3)).toContain("Only a named human's disposition retires one.");
  });

  it("step 3 names the disposition that retires one, straight after that sentence (WR-14)", () => {
    // Moved by plan 41-26 under D-45 (41-UAT.md test 9, Olger, 2026-11-12): review finding WR-18.
    expect(step(WF16, 3)).toContain(
      "Only a named human's disposition retires one. " +
        "That disposition is a `finding` the dial gates. " +
        "The Orchestrator admits it through `propose_note` under the human's grant on a Claude Code plugin install.",
    );
  });

  it("step 3 says where nothing retires one (WR-14)", () => {
    expect(step(WF16, 3)).toContain("Under `human_admission: off`, and on a host with no hook, nothing retires one.");
  });

  it("step 3 says the emitter writes one verdict per gate run (WR-14)", () => {
    expect(step(WF16, 3)).toContain("`emitVerdict` writes one verdict per gate run.");
  });

  it("step 3 names the route out of a store that already holds two (WR-14)", () => {
    expect(step(WF16, 3)).toContain(
      "A store that already holds two for one run refuses every `artifact-ref` that names the run. " +
        "Run the gate again and name the new run.",
    );
  });

  it("the note contract names the disposition and where nothing retires one (WR-14)", () => {
    // Moved by plan 41-26 under D-45 (41-UAT.md test 9, Olger, 2026-11-12): review finding WR-18.
    expect(flat(NOTE_CONTRACT)).toContain(
      "only a named human's disposition retires one. " +
        "That disposition is a `finding` the dial gates, admitted on a Claude Code plugin install through `propose_note` under the human's grant. " +
        "Under `off`, and on a host with no hook, nothing retires one.",
    );
  });

  it("the changelog Security bullet names the disposition and where nothing retires one (WR-14)", () => {
    // Moved by plan 41-26 under D-45 (41-UAT.md test 9, Olger, 2026-11-12): review finding WR-18.
    expect(flat(CHANGELOG)).toContain(
      "only a named human's disposition retires one. " +
        "That disposition is a finding the dial gates, admitted on a Claude Code plugin install through `propose_note`; " +
        "under `off`, and on a host with no hook, nothing retires one.",
    );
  });

  it("the changelog Fixed section names the duplicate-verdict refusal and the banner (WR-14, IN-09)", () => {
    const unreleased = CHANGELOG.slice(CHANGELOG.indexOf("## [Unreleased]"));
    const fixed = flat(unreleased.slice(unreleased.indexOf("### Fixed"), unreleased.indexOf("### Security")));
    expect(fixed.startsWith("### Fixed"), "no ### Fixed section above ### Security in [Unreleased]").toBe(true);
    expect(fixed).toContain(
      "`emitVerdict` (`node scripts/context-io.js emit-verdict`) now refuses a second green verdict for one gate run id",
    );
    expect(fixed).toContain("run the gate again");
    expect(fixed).toContain("`index.md` no longer opens with a command a host cannot run");
  });
});

describe("Workflow 16 step 3 reads every exit of note.js (plan 41-21; WR-09, IN-10, IN-13, IN-15, D-42)", () => {
  it("says to pass --body-file for a body that opens with two dashes, after the long-body sentence (IN-10)", () => {
    expect(step(WF16, 3)).toContain(
      "Pass `--body-file <path>` in place of `--body` for a long body. Pass it too for a body that opens with `--`, which `--body` refuses.",
    );
  });

  it("says exit 1 without a refused line is a genuine failure, after the exit 1 sentence (IN-13)", () => {
    expect(step(WF16, 3)).toContain(
      "Exit 1 prints `refused <folder>: <reason>` and writes nothing, so read the reason per step 4. Exit 1 without that line is a genuine failure.",
    );
  });

  it("says what exit 2 covers, after the genuine-failure sentence (WR-09)", () => {
    expect(step(WF16, 3)).toContain(
      "Any other exit is a genuine failure: stop and surface it. Exit 2 prints one `Error:` line.",
    );
    expect(step(WF16, 3)).toContain(
      "It also covers an unnamed governance root, an admission the ledger failed to record, and a failed publish.",
    );
    expect(step(WF16, 3)).toContain("Nothing about the note is wrong then.");
  });

  it("names every repair in the stop for a root that could not be named (IN-15)", () => {
    const line = section(WF16, "Stop conditions")
      .split("\n")
      .find((l) => l.startsWith("- A refusal says the governance root could not be named"));
    expect(line).toContain("A human repairs `HOME`, the working directory, or the path the refusal names.");
  });
});

describe("the kit names the read route (plan 41-22; WR-12, D-42)", () => {
  // 41-UAT.md test 7, Olger, 2026-11-11: the read route was context-io.ts, which no host has. The route is now
  // `note.js read`, which reads through the seal check; scripts/runnable-ref/role-route.test.ts runs it from step 1.

  it("names the read command in the input bullet of Workflow 16", () => {
    expect(section(WF16, "Inputs required")).toContain(
      "- The existing verified context for that task, read with `node tools/grugops/note.js read <folder>`, per step 1 — the prior findings, decisions and recorded dead ends.",
    );
  });

  it("says in step 1 of Workflow 16 how to read the context and what a skipped file is", () => {
    const line = step(WF16, 1);
    expect(line).toContain(
      "1. Read the shared context for the task before doing the work. Run `node tools/grugops/note.js read <folder>` from the repository root, with the folder step 3 names.",
    );
    expect(line).toContain("It prints each sealed note of the current state in full.");
    expect(line).toContain("It names each file in `notes/` that is not a sealed note on a `skipped` line.");
    expect(line).toContain("A skipped file is not part of the context, so never read one as a note. Never read `notes/` by hand.");
    expect(line).toContain("Exit 2 means the context was not read in full: stop and surface it. Start from the verified state");
    expect(line).not.toContain("context-io.ts");
  });

  it("points step 5 of Workflow 17 at step 1 of Workflow 16 and names no context-io read function", () => {
    expect(step(WF17, 5)).toContain(
      "5. Read the subtask's shared context per step 1 of WF16 (`node tools/grugops/note.js read <folder>`) before the work starts (role).",
    );
    expect(WF17).not.toContain("readContext");
  });
});

describe("the kit says a host has no gate stamp (plan 41-23; CR-03, D-41)", () => {
  // 41-UAT.md test 6, Olger, 2026-11-10, in the reply `B, Olger` (D-41): no host verdict verb ships, so the kit says a host
  // repository has no gate stamp. scripts/runnable-ref/role-route.test.ts proves the route on host copies with no kit file.

  /** The sentences of `line`, split after a full stop that ends a sentence. */
  function sentences(line: string): string[] {
    return line.split(/(?<=\.)\s+/);
  }

  it("step 3 of Workflow 16 says a host with only a scripted install has no gate stamp, straight after the sentence that says the program stamps `at`", () => {
    // Plan 41-23 named the flags sentence as the anchor. The pins of plans 41-16, 41-18 and 41-20 hold every sentence
    // from there to "The program stamps" in order, so the host block follows that run instead.
    // Moved by plan 41-25 under the ruling on T-41-100 of 2026-11-12 (option (a)): a host with only a scripted install has
    // no gate stamp, and a Claude Code plugin install counts as a host too.
    expect(step(WF16, 3)).toContain(
      "The program stamps `at` itself. " +
        "A host repository with only a scripted install has no gate stamp (residual R-41-10). " +
        "`emitVerdict`, the one writer of a green verdict, runs through `scripts/context-io.js`. " +
        "That program ships with grugops's own tooling, and a scripted install does not copy it into a host repository.",
    );
  });

  it("step 3 says what a host refuses and the record to write instead", () => {
    // Moved by plan 41-25 under the ruling on T-41-100 of 2026-11-12 (option (a)): a host with only a scripted install has
    // no gate stamp, and a Claude Code plugin install counts as a host too.
    const line = step(WF16, 3);
    expect(line).toContain("So on such a host a `finding` stamped `§14-gate#<id>` and every `artifact-ref` are refused.");
    expect(line).toContain(
      "Record a gate-verifiable result there as a `claim` with `confidence: UNKNOWN - verify`, or as a `human:<name>` finding.",
    );
    expect(line).toContain(
      "Record a pointer to an artifact there as an `observation` carrying its refs. The trace render reads those refs like any other.",
    );
  });

  it("step 4 scopes the stamp route to where emitVerdict runs", () => {
    // Moved by plan 41-25 under the ruling on T-41-100 of 2026-11-12 (option (a)): a host with only a scripted install has
    // no gate stamp, and a Claude Code plugin install counts as a host too.
    expect(section(WF16, "Steps")).toContain(
      "After the budget is spent, stop and hand to a human. " +
        "This route exists only where `emitVerdict` runs, in a repository holding grugops's own `scripts/context-io.js`. " +
        "No host repository holds that copy, even with a plugin install, so there take the second route or escalate.",
    );
  });

  it("the first admission outcome scopes the workhorse path to where emitVerdict runs", () => {
    const outcomes = section(WF16, "Steps");
    expect(outcomes).not.toContain("The workhorse path; no human is bothered.");
    // Moved by plan 41-25 under the ruling on T-41-100 of 2026-11-12 (option (a)): a host with only a scripted install has
    // no gate stamp, and a Claude Code plugin install counts as a host too.
    expect(outcomes).toContain(
      "The workhorse path where `emitVerdict` runs, in a repository holding grugops's own `scripts/context-io.js`; no human is bothered. " +
        "No host repository holds that copy, even with a plugin install. " +
        "There a gate-verifiable result takes the next outcome, or the last one when it is high-stakes.",
    );
  });

  it("step 6 of Workflow 17 says a host with only a scripted install refuses both, straight after the artifact-ref sentence", () => {
    // Moved by plan 41-25 under the ruling on T-41-100 of 2026-11-12 (option (a)): a host with only a scripted install has
    // no gate stamp, and a Claude Code plugin install counts as a host too.
    expect(step(WF17, 6)).toContain(
      "An `artifact-ref` is admitted only against a live green verdict for its `gate_run`. " +
        "A host repository with only a scripted install has no gate stamp, so there both are refused. " +
        "A plugin install counts as a host too, and it carries the verdict verb. " +
        "So a gate stamp there is no proof that a gate ran. " +
        "WF16 step 3 names the record to write instead (residual R-41-10).",
    );
  });

  it("no sentence of Workflow 16 step 3 or Workflow 17 step 6 pairs every host with artifact-ref", () => {
    for (const line of [step(WF16, 3), step(WF17, 6)]) {
      const paired = sentences(line).filter((s) => s.includes("every host") && s.includes("artifact-ref"));
      expect(paired, "a sentence reads an artifact-ref as admissible on every host").toEqual([]);
    }
  });

  it("the third admission outcome names the route a high-severity finding takes under an active dial (WR-13, D-42)", () => {
    // Olger's ruling of 2026-11-11 (D-42) fixed the text under WR-13. The limit where no hook exists is residual R-41-11.
    // Moved by plan 41-26 under D-45 (41-UAT.md test 9, Olger, 2026-11-12): review finding WR-18.
    expect(section(WF16, "Steps")).toContain(
      "or when agents disagree. The rare path. " +
        "A `finding` by `security-nfr`, `architect-design` or `release-manager` is refused by `note.js` whenever `human_admission` is not `off`. " +
        "The human's answer does not lift that refusal. " +
        "That role publishes the result as a `claim` and ends its task per step 5. The Orchestrator then asks the human once. " +
        "On a Claude Code plugin install, the Orchestrator then admits the finding through `propose_note` under the human's grant. " +
        "The note carries the role's name as `by`, the `human:<name>` stamp and the role's `claim` in `supersedes`. " +
        "Where no hook exists, as on a standalone Claude Code install, that finding cannot be admitted. " +
        "The record there is the role's `claim` with `confidence: UNKNOWN - verify`. " +
        "The Orchestrator's `decision` note names the human (residual R-41-11).",
    );
  });

  it("the escalation stop of Workflow 16 points at the third admission outcome, before its checkpoint tag", () => {
    expect(section(WF16, "Stop conditions")).toContain(
      "do not self-stamp. The third admission outcome names the route. `checkpoint: escalate_unadjudicable_result`",
    );
  });
});

describe("Workflow 05 says what a green run publishes on a host (plan 41-23; CR-03, D-41)", () => {
  // Plan 41-23 Task 2, a blocking checkpoint: the named human answered `advise, Olger` on 2026-11-12. A green run on a host
  // records an observation and publishes READY_FOR_HUMAN_REVIEW with the no-stamp line. No agent chose the option.
  const steps = section(WF05, "Steps");

  it("says a host with only a scripted install has no gate stamp, straight after the sentence that delegates the emission to context-io.ts", () => {
    // Moved by plan 41-25 under the ruling on T-41-100 of 2026-11-12 (option (a)): the label and the program sentence now
    // scope the missing stamp to a scripted install, because a Claude Code plugin install carries the program.
    expect(steps).toContain(
      "the emission is delegated to `context-io.ts` by name.\n\n" +
        "   **A host repository with only a scripted install has no gate stamp** (residual R-41-10). " +
        "`scripts/context-io.js`, the one program that runs `emitVerdict`, ships with grugops's own tooling. " +
        "A scripted install does not copy it into a host repository. " +
        "So the emission step cannot run there, and no `§14-gate#<id>` finding and no `artifact-ref` can be admitted there.",
    );
  });

  it("says a green run on a host records an observation and publishes READY_FOR_HUMAN_REVIEW with the no-stamp line", () => {
    expect(steps).toContain(
      "On a host, when every check passes, the gate records an `observation` that no verdict stands behind the run. " +
        "It then publishes `READY_FOR_HUMAN_REVIEW` with the line `no gate stamp on this host: no verdict stands behind this result`. " +
        "Everywhere else the rule above holds.",
    );
  });

  it("keeps the fail-closed rule where emitVerdict runs, and writes no fail-closed host sentence", () => {
    expect(steps).toContain("Publish `READY_FOR_HUMAN_REVIEW` only after `emit-verdict` exits `0`.");
    expect(steps).toContain("An unrecordable pass is not a pass.");
    expect(WF05).not.toContain("A green run on a host therefore ends `BLOCKED_NEEDS_FIX`");
  });

  it("scopes the verdict note of `## Commit` to where emitVerdict runs", () => {
    expect(section(WF05, "Commit")).toContain(
      "Where `emitVerdict` runs, on a `READY_FOR_HUMAN_REVIEW` result they include the green `§14-gate` verdict context note",
    );
  });
});

describe("a plugin install counts as a host (plan 41-25; T-41-100)", () => {
  // The ruling on T-41-100 of 2026-11-12, option (a): a Claude Code plugin install counts as a host. It carries
  // scripts/context-io.js and its emit-verdict verb, so a gate stamp there is no proof that a gate ran. The route is pinned
  // by the LIMIT (R-41-10) case in scripts/runnable-ref/role-route.test.ts. The ruling's words "proves no gate ran" are
  // written as "is no proof that a gate ran", which is what the audit measured; plan 41-25 Task 3 shows the human that.
  const wf05Steps = section(WF05, "Steps");

  it("Workflow 05 counts a plugin install as a host, straight after the sentence on the emission step", () => {
    expect(wf05Steps).toContain(
      "So the emission step cannot run there, and no `§14-gate#<id>` finding and no `artifact-ref` can be admitted there. " +
        "**A Claude Code plugin install counts as a host too.**",
    );
  });

  it("Workflow 05 says a plugin install carries the program, so any agent there can mint a green verdict", () => {
    expect(wf05Steps).toContain(
      "It carries `scripts/context-io.js`, so its `emit-verdict` verb lets any agent there mint a green verdict.",
    );
  });

  it("Workflow 05 says a gate stamp on a plugin install is no proof that a gate ran", () => {
    expect(wf05Steps).toContain("So a gate stamp there is no proof that a gate ran.");
  });

  it("Workflow 05 says the gate never runs that verb on a host, before the green-run sentences the reply `advise, Olger` chose", () => {
    expect(wf05Steps).toContain(
      "The gate never runs that verb on a host. On a host, when every check passes, the gate records an `observation`",
    );
  });

  it("Workflow 05 keeps no not-installed clause", () => {
    expect(WF05).not.toContain("is not installed to a host");
  });

  it("step 3 of Workflow 16 counts a plugin install as a host, straight after the trace-render sentence", () => {
    expect(step(WF16, 3)).toContain(
      "The trace render reads those refs like any other. " +
        "A Claude Code plugin install counts as a host too (residual R-41-10).",
    );
  });

  it("step 3 of Workflow 16 says a plugin install carries the program, so any agent there can mint a green verdict", () => {
    expect(step(WF16, 3)).toContain(
      "It carries `scripts/context-io.js`, so its `emit-verdict` verb lets any agent there mint a green verdict.",
    );
  });

  it("step 3 of Workflow 16 says a gate stamp on a plugin install is no proof that a gate ran", () => {
    expect(step(WF16, 3)).toContain("So a gate stamp there is no proof that a gate ran.");
  });

  it("step 3 of Workflow 16 tells every role never to run the plugin's emit-verdict, and to write the scripted host's records", () => {
    expect(step(WF16, 3)).toContain(
      "Never run the plugin's `emit-verdict`. Write the same records there as on a scripted host. Exit 0 prints",
    );
  });

  it("step 4 of Workflow 16 scopes the stamp route to a repository holding grugops's own scripts/context-io.js", () => {
    expect(section(WF16, "Steps")).toContain(
      "This route exists only where `emitVerdict` runs, in a repository holding grugops's own `scripts/context-io.js`.",
    );
  });

  it("step 4 and the first admission outcome of Workflow 16 say no host repository holds that copy, even with a plugin install", () => {
    expect(occurrences(section(WF16, "Steps"), "No host repository holds that copy, even with a plugin install")).toBe(2);
  });

  it("step 6 of Workflow 17 scopes the missing stamp to a scripted install", () => {
    expect(step(WF17, 6)).toContain(
      "A host repository with only a scripted install has no gate stamp, so there both are refused.",
    );
  });

  it("step 6 of Workflow 17 counts a plugin install as a host carrying the verdict verb, naming no host", () => {
    // Workflow 17 names a host only in its Platform section and operator tips (plan 41-04, RUN-04), so step 6 says
    // "A plugin install" where Workflows 05 and 16 say "A Claude Code plugin install". grugops ships its plugin for
    // Claude Code only, so the sentence names the same install form.
    expect(step(WF17, 6)).toContain("A plugin install counts as a host too, and it carries the verdict verb.");
  });

  it("step 6 of Workflow 17 says a gate stamp on a plugin install is no proof that a gate ran", () => {
    expect(step(WF17, 6)).toContain("So a gate stamp there is no proof that a gate ran.");
  });

  it("the changelog counts a plugin install as a host whose gate stamp is no proof that a gate ran", () => {
    const CHANGELOG = readFileSync(join(ROOT, "CHANGELOG.md"), "utf8");
    expect(CHANGELOG.replace(/\s+/g, " ")).toContain(
      "A Claude Code plugin install counts as a host too, yet it carries `scripts/context-io.js` and its `emit-verdict` verb, " +
        "so any agent there can mint a green verdict, and a gate stamp there is no proof that a gate ran.",
    );
  });

  it("no sentence of Workflow 05 or 16 Steps, or Workflow 17 step 6, says has no gate stamp without a scripted install", () => {
    const sentences = (text: string): string[] => text.split(/(?<=\.)\s+/);
    for (const text of [section(WF05, "Steps"), section(WF16, "Steps"), step(WF17, 6)]) {
      const bare = sentences(text).filter((s) => s.includes("has no gate stamp") && !s.includes("with only a scripted install"));
      expect(bare, "a sentence says a host has no gate stamp without naming a scripted install").toEqual([]);
    }
  });

  it("no Workflow 05, 16 or 17 text keeps the old not-installed clause (moved from plan 41-23)", () => {
    // The plan 41-23 pins held "ships with grugops's own tooling and is not installed to a host"; plan 41-25 removed it under
    // the ruling on T-41-100 of 2026-11-12, because a Claude Code plugin install carries the program.
    for (const text of [WF05, WF16, WF17]) {
      expect(text).not.toContain("ships with grugops's own tooling and is not installed to a host");
    }
  });
});

describe("the supersession rules carry their limits (plan 41-24; WR-15, D-43)", () => {
  const CHANGELOG = readFileSync(join(ROOT, "CHANGELOG.md"), "utf8");
  const flat = (text: string): string => text.replace(/\s+/g, " ");
  const LIMITS =
    "Residual R-41-09 records the routes that stay open: a target that arrives later, a dial raised after a retirement, " +
    "and a note file that was renamed and cannot be read.";
  const security = (): string => {
    const unreleased = CHANGELOG.slice(CHANGELOG.indexOf("## [Unreleased]"));
    const at = unreleased.indexOf("### Security");
    expect(at, "no ### Security section in [Unreleased]").toBeGreaterThanOrEqual(0);
    const rest = unreleased.slice(at + 1);
    return rest.slice(0, rest.indexOf("\n### "));
  };

  it("step 3 of Workflow 16 says an unreadable target is refused unless its file was renamed (WR-15, D-43)", () => {
    expect(step(WF16, 3)).toContain(
      "A target in the store that cannot be read is refused, unless its file was renamed (R-41-09).",
    );
  });

  it("the changelog bullet on a named human's disposition ends with the routes R-41-09 records (WR-15)", () => {
    expect(flat(security())).toContain("under `off`, and on a host with no hook, nothing retires one. " + LIMITS);
  });

  it("the changelog bullet on an unreadable target ends with the routes R-41-09 records (WR-15)", () => {
    expect(flat(security())).toContain(
      "A note whose `supersedes` target is in the store and cannot be read is refused at every dial. " + LIMITS,
    );
  });

  it("keeps the renamed-file phrase on one line in each bullet, because a gate counts it (WR-15)", () => {
    expect(occurrences(security(), "a note file that was renamed and cannot be read")).toBe(2);
  });

  const NAMED_ROOT = "unless a named root such as `CLAUDE_PROJECT_DIR` carries a factory configuration";

  it("the changelog home-directory sentences say a named root with a configuration pre-empts the refusal (IN-14, D-42)", () => {
    expect(flat(security())).toContain(
      "With `HOME` set to a path that does not exist, every note is refused until it is repaired, " + NAMED_ROOT + ".",
    );
    expect(flat(security())).toContain(
      "A note run from a directory above `HOME` is now refused rather than run lean, in a lean repository too, " +
        NAMED_ROOT + ".",
    );
    expect(occurrences(security(), NAMED_ROOT)).toBe(2);
  });

  it("Workflow 16 says the order stops on an undeterminable home only with no named root carrying a configuration (IN-14)", () => {
    expect(section(WF16, "The governance-root resolution order")).toContain(
      "**When the order cannot finish.** A failed read stops the order. " +
        "With no named root carrying a factory configuration, an undeterminable home directory or an unreadable working " +
        "directory stops it too. The same holds for a working directory above the home directory, where tier 3 inspects nothing. " +
        "No root is named, and every admission is refused. A lean repository is refused the same way.",
    );
  });

  it("factory.config.md names the Tech Lead as the role that hands the ticket back after a `Fundamental:` ruling (WR-08, D-42)", () => {
    expect(CONFIG).toContain(
      "The Orchestrator asks the human to approve or reject a `Fundamental:` proposal. " +
        "On approval the Tech Lead hands the ticket back to the proposing role to make the change. " +
        "On rejection the Tech Lead applies the move the human names, or else hands the ticket back to fix it within the current requirement and rules.",
    );
    expect(CONFIG).not.toContain("On approval it hands");
  });
});

// Plan 41-26 fixes the four text-only review findings Olger sent to one override round past the gap-round cap
// (41-UAT.md test 9, Olger, 2026-11-12; recorded as D-45). The text changes only: no program code moves.
describe("the text-only four of the override round (plan 41-26; WR-18, WR-19, IN-19, IN-20, D-45)", () => {
  const CHANGELOG = readFileSync(join(ROOT, "CHANGELOG.md"), "utf8");
  const flat = (text: string): string => text.replace(/\s+/g, " ");

  // WR-18: the admission server and the hook ship only in the plugin. install/install.ts writes neither, so a
  // standalone Claude Code install has no route, like the other hosts.
  it("step 3 of Workflow 16 scopes the route to a plugin install and says a standalone install has no hook (WR-18)", () => {
    expect(step(WF16, 3)).toContain(
      "The Orchestrator admits it through `propose_note` under the human's grant on a Claude Code plugin install. " +
        "Under `human_admission: off`, and on a host with no hook, nothing retires one. " +
        "A standalone Claude Code install has no hook, like the other hosts.",
    );
  });

  it("step 3 of Workflow 16 scopes the STRUCTURED tool to a plugin install (WR-18)", () => {
    expect(step(WF16, 3)).toContain(
      "On a Claude Code plugin install the Orchestrator also holds the STRUCTURED tool " +
        "`mcp__plugin_grugops_grugops__propose_note`, and a spawned role does not.",
    );
  });

  it("the third admission outcome asks the human, admits on a plugin install, then names where no hook exists (WR-18)", () => {
    const steps = section(WF16, "Steps");
    const ask = steps.indexOf("The Orchestrator then asks the human once.");
    const route = steps.indexOf(
      "On a Claude Code plugin install, the Orchestrator then admits the finding through `propose_note` under the human's grant.",
    );
    const supersedes = steps.indexOf("the `human:<name>` stamp and the role's `claim` in `supersedes`.");
    const noHook = steps.indexOf("Where no hook exists, as on a standalone Claude Code install, that finding cannot be admitted.");
    expect(ask, "no ask sentence").toBeGreaterThanOrEqual(0);
    expect(route, "the route sentence does not follow the ask").toBeGreaterThan(ask);
    expect(supersedes, "the supersedes sentence does not follow the route").toBeGreaterThan(route);
    expect(noHook, "the no-hook sentence does not follow the supersedes sentence").toBeGreaterThan(supersedes);
  });

  it("the note contract and both changelog bullets scope the route to a plugin install (WR-18)", () => {
    expect(flat(NOTE_CONTRACT)).toContain(
      "That disposition is a `finding` the dial gates, admitted on a Claude Code plugin install through `propose_note` under the human's grant.",
    );
    expect(flat(CHANGELOG)).toContain(
      "and on a Claude Code plugin install it admits the finding through `propose_note` under the human's grant",
    );
    expect(flat(CHANGELOG)).toContain(
      "admitted on a Claude Code plugin install through `propose_note`; under `off`, and on a host with no hook, nothing retires one.",
    );
  });

  it("no route sentence of Workflow 16, the note contract or the changelog keeps a bare Claude Code claim (WR-18)", () => {
    for (const text of [WF16, flat(NOTE_CONTRACT), flat(CHANGELOG)]) {
      for (const old of [
        "under the human's grant on Claude Code.",
        "Where the Orchestrator holds `propose_note` (Claude Code), it then admits",
        "On Claude Code the Orchestrator also holds the STRUCTURED tool",
        "admitted on Claude Code through `propose_note`",
        "and on Claude Code it admits the finding",
      ]) {
        expect(text, old).not.toContain(old);
      }
    }
  });
});
