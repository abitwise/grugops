// autonomy-zero-config.test.ts — the AUTO-07 whole-run differential against the PRE-PHASE guard.
//
// THE REQUIREMENT. "A zero-config repo behaves exactly as today." Phase 30 rewires the byte-frozen
// prod-deploy guard to consult a per-checkpoint matrix. AUTO-07 is the promise that a repo which
// configures nothing gets the Phase-5 decision, with the Phase-5 wording, byte for byte — and that
// the ONLY thing that changed in its output is the one run banner line D-20 requires to be always
// present.
//
// WHY THIS IS A WHOLE-RUN DIFF AND NOT A SUBSTRING PROBE. Phase 28's AP-1 anti-pattern is recorded
// at severity `blocking`: a gate that prints a PASS line for a check it did not perform. The
// substring form of this test — `expect(out).toContain("all checkpoints at default")` — passes for
// a run that ALSO printed nine wrong lines, changed a denial's wording, or flipped a decision. It
// would assert the presence of the banner and nothing about the promise. So the assertion here is a
// LINE-LEVEL DIFF of the entire captured output of both processes: exactly one ADDED line, zero
// removed lines, and therefore zero changed lines (a changed line is one removed plus one added in
// an LCS diff, so `removed === 0` is what rules it out).
//
// WHY THE BASELINE IS PINNED BY BLOB AND NOT BY REF. `git show HEAD~5:hooks/guard.js` follows
// history: rebase, amend, or simply committing more work moves what it names, and the differential
// would then quietly compare the new guard against a slightly less new guard. A blob hash is
// immutable content-addressing — `git cat-file blob <sha>` returns the same bytes forever or fails
// loudly. The pinned value below is the `hooks/guard.js` that shipped immediately before plan
// 30-01's guard change.
//
// Vitest globals:false (the repo default) → import test fns explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = join(import.meta.dirname, "..");
const GUARD_JS = join(ROOT, "hooks", "guard.js");

/**
 * The PRE-PHASE hooks/guard.js, pinned by BLOB. Immutable: `git cat-file blob` either returns
 * exactly these bytes or fails. Recorded by plan 30-01 as
 * `git rev-parse HEAD:hooks/guard.js` taken at commit b1d1c4f, the commit immediately preceding
 * this plan's guard change.
 */
const PRE_PHASE_GUARD_JS_BLOB = "e86da3f8b2262d7846d6f937fd149d21d8640203";

const cp: typeof import("./checkpoints.js") = await import(
  pathToFileURL(join(ROOT, "scripts", "checkpoints.js")).href
);

const tmpDirs: string[] = [];
function freshTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpDirs.push(d);
  return d;
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

// ── Materialize the pinned baseline into a temp file. ────────────────────────────────────────────
const baselineDir = freshTmp("autonomy-baseline-");
const BASELINE_JS = join(baselineDir, "pre-phase-guard.js");
writeFileSync(
  BASELINE_JS,
  execFileSync("git", ["cat-file", "blob", PRE_PHASE_GUARD_JS_BLOB], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  }),
);

// ── THE ROSTER-WIDE COVERAGE TABLE (plan 30-08). ─────────────────────────────────────────────────
//
// Plan 30-01 compared five payloads, two of which matched the tracer's two checkpoints. The roster is
// now complete, and "the differential is clean" is a claim about the WHOLE roster or it is a claim
// about whichever two ids somebody happened to write down. So every roster member is accounted for
// here, in ONE of two ways, and the union of the two is asserted equal to the roster in BOTH
// directions — an id in neither map is red, and an id in a map that the roster does not admit is
// equally red. A row silently lost from either table therefore cannot leave a checkpoint unverified
// while this file still reports green.
//
// THE TWO WAYS, AND WHY THERE ARE TWO. The guard decides from a COMMAND STRING, so it can only
// enforce a checkpoint some command matches. Those ids get payloads here. The rest are the in-process
// tier — nothing a Bash command string can trigger — and their zero-config behaviour is asserted by a
// NAMED test elsewhere, recorded by name so the roster's coverage is complete by enumeration rather
// than by silence. Both references are checked mechanically below (the file exists and carries that
// test name), because a reference nobody reads is exactly the hand-maintained set-literal this
// repository's founding defect is made of.

/** Roster ids the hook can match from a command string → the commands that match them. */
const HOOK_MATCHABLE: Readonly<Record<string, readonly string[]>> = {
  protected_branch_merge: ["git push origin main", "git push -f origin release/1.2"],
  production_requires_human_confirmation: ["kubectl apply -f deploy.yaml", "npm publish"],
};

/** Every other roster id → the test that asserts its zero-config disposition. */
const COVERED_ELSEWHERE: Readonly<Record<string, { readonly file: string; readonly test: string }>> = {
  test_integrity: {
    file: "scripts/context-io.test.ts",
    test: "CONTROL — the clean sentinel writes exactly one valid green verdict",
  },
  open_pr: CHECKPOINT_DEFAULTS_TEST(),
  commit_to_branch: CHECKPOINT_DEFAULTS_TEST(),
  proceed_past_blocked_risk: CHECKPOINT_DEFAULTS_TEST(),
  sign_off_acceptance: CHECKPOINT_DEFAULTS_TEST(),
  escalate_stale_blocker: CHECKPOINT_DEFAULTS_TEST(),
  exceed_wip_limit: CHECKPOINT_DEFAULTS_TEST(),
  decide_accessibility_exception: CHECKPOINT_DEFAULTS_TEST(),
  exhaust_self_fix_budget: CHECKPOINT_DEFAULTS_TEST(),
  override_finding_severity: CHECKPOINT_DEFAULTS_TEST(),
  escalate_unadjudicable_result: CHECKPOINT_DEFAULTS_TEST(),
  accept_human_only_failure: CHECKPOINT_DEFAULTS_TEST(),
};

/** The one reference the documentary-tier members share — key-by-key, so it covers each of them. */
function CHECKPOINT_DEFAULTS_TEST(): { file: string; test: string } {
  return {
    file: "scripts/checkpoints.test.ts",
    test: "no config file at all → exactly CHECKPOINT_DEFAULTS, compared key by key",
  };
}

/** The three payloads that belong to no checkpoint — the structural shapes the guard must survive. */
const STRUCTURAL_KINDS = ["benign-read-only", "malformed-json-body", "empty-body"] as const;
const STRUCTURAL_PAYLOADS: readonly { readonly kind: string; readonly body: string }[] = [
  { kind: "benign-read-only", body: JSON.stringify({ tool_input: { command: "ls -la" } }) },
  { kind: "malformed-json-body", body: "not json at all" },
  { kind: "empty-body", body: "" },
];

interface Payload {
  readonly kind: string;
  readonly body: string;
  /** The roster id this payload exercises, or `null` for a structural shape. */
  readonly checkpoint: string | null;
}

// The compared set is built by walking the TABLE; the expected COUNT is computed by walking the
// ROSTER and asking the table for each id. The two traversals start from different authorities, so a
// dropped row shows up as an id the union no longer covers rather than as two numbers that shrank
// together. What this pair does NOT catch is a row losing one of several payloads while keeping at
// least one — that is stated rather than implied, and the requirement is at least one per id.
const PAYLOADS: readonly Payload[] = [
  ...STRUCTURAL_PAYLOADS.map((p) => ({ ...p, checkpoint: null })),
  ...Object.entries(HOOK_MATCHABLE).flatMap(([id, commands]) =>
    commands.map((command) => ({
      kind: `${id}: ${command}`,
      body: JSON.stringify({ tool_input: { command } }),
      checkpoint: id,
    })),
  ),
];

const EXPECTED_RUNS =
  STRUCTURAL_KINDS.length +
  cp.CHECKPOINTS.reduce((n, id) => n + (HOOK_MATCHABLE[id]?.length ?? 0), 0);

/** The payload plan 30-01's non-vacuity cases drive — a matched protected-branch push. */
const MATCHED_PUSH = JSON.stringify({ tool_input: { command: "git push origin main" } });

// ── Spawning. ────────────────────────────────────────────────────────────────────────────────────
//
// The ambient environment is SCRUBBED of every GRUGOPS_ variable before either process runs. A
// developer (or CI runner) that happens to carry a grant would otherwise silently turn a denial into
// an allow on BOTH sides and the diff would still read as clean — a false pass with no symptom.
function scrubbedEnv(extra: Record<string, string> = {}): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (k.startsWith("GRUGOPS_")) continue;
    if (v !== undefined) env[k] = v;
  }
  return { ...env, ...extra };
}

interface Run {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
  /** Every line the process emitted, stdout then stderr, with trailing blank lines dropped. */
  readonly lines: readonly string[];
  /** Did this run emit a deny payload? */
  readonly denied: boolean;
}

function run(guardJs: string, body: string, projectDir: string, extraEnv: Record<string, string> = {}): Run {
  const r = spawnSync("node", [guardJs], {
    input: body,
    encoding: "utf8",
    env: scrubbedEnv({ CLAUDE_PROJECT_DIR: projectDir, ...extraEnv }),
  });
  const stdout = r.stdout ?? "";
  const stderr = r.stderr ?? "";
  const lines = `${stdout}${stdout && !stdout.endsWith("\n") ? "\n" : ""}${stderr}`
    .split("\n")
    .filter((l, i, all) => !(l === "" && i === all.length - 1));
  return {
    status: r.status,
    stdout,
    stderr,
    lines,
    denied: stdout.includes('"permissionDecision":"deny"'),
  };
}

// ── A minimal LCS line diff. ─────────────────────────────────────────────────────────────────────
// A CHANGED line surfaces as one removed plus one added, so `removed.length === 0` is exactly the
// "zero removed or changed lines" half of the assertion.
function lineDiff(a: readonly string[], b: readonly string[]): { added: string[]; removed: string[] } {
  const n = a.length;
  const m = b.length;
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const added: string[] = [];
  const removed: string[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      i += 1;
      j += 1;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      removed.push(a[i]);
      i += 1;
    } else {
      added.push(b[j]);
      j += 1;
    }
  }
  while (i < n) removed.push(a[i++]);
  while (j < m) added.push(b[j++]);
  return { added, removed };
}

/** A project root carrying a config with NO `checkpoints` object — the zero-config case. */
function zeroConfigRoot(): string {
  const root = freshTmp("autonomy-zeroconf-");
  mkdirSync(join(root, ".grugops"), { recursive: true });
  writeFileSync(
    join(root, ".grugops", "factory.config.json"),
    JSON.stringify({ mode: "lean", cadence: "kanban", autonomy: "pr" }, null, 2),
  );
  return root;
}

describe("AUTO-07 — every roster member is accounted for, in both directions", () => {
  it("the union of hook-covered and elsewhere-covered ids EQUALS the roster, in BOTH directions", () => {
    const covered = [...Object.keys(HOOK_MATCHABLE), ...Object.keys(COVERED_ELSEWHERE)];
    const roster = new Set<string>(cp.CHECKPOINTS);
    const coveredSet = new Set(covered);
    // Direction 1: a roster member this file accounts for nowhere would have its zero-config
    // behaviour unverified while the file still reported green — the fault this table exists for.
    const uncovered = [...roster].filter((id) => !coveredSet.has(id)).sort();
    expect(
      uncovered,
      `roster member(s) covered by neither table: [${uncovered.join(", ")}] — add a payload to ` +
        `HOOK_MATCHABLE or a named reference to COVERED_ELSEWHERE`,
    ).toEqual([]);
    // Direction 2: an id this file claims to cover that the roster does not admit is a coverage
    // claim about nothing — a different fault, so it gets a different message.
    const phantom = [...coveredSet].filter((id) => !roster.has(id)).sort();
    expect(
      phantom,
      `covered id(s) the roster does not declare: [${phantom.join(", ")}] — the coverage table is ` +
        `describing a checkpoint that no longer exists`,
    ).toEqual([]);
    // No id may be in both: a member covered "here and elsewhere" hides which claim is load-bearing.
    const both = Object.keys(HOOK_MATCHABLE).filter((id) => id in COVERED_ELSEWHERE).sort();
    expect(both, `id(s) in BOTH coverage tables: [${both.join(", ")}]`).toEqual([]);
    // Non-vacuity: neither side is empty, and the roster itself is not empty.
    expect(cp.CHECKPOINTS.length).toBeGreaterThan(0);
    expect(Object.keys(HOOK_MATCHABLE).length).toBeGreaterThan(0);
    expect(Object.keys(COVERED_ELSEWHERE).length).toBeGreaterThan(0);
  });

  it("every HOOK-covered id carries at least one payload, and the count is derived from the ROSTER", () => {
    for (const id of Object.keys(HOOK_MATCHABLE)) {
      expect(HOOK_MATCHABLE[id].length, `${id} carries no payload`).toBeGreaterThan(0);
    }
    // EXPECTED_RUNS walks cp.CHECKPOINTS (the module's roster) and asks the table for each id;
    // PAYLOADS is built by walking the table. Different starting authorities, one equality.
    expect(PAYLOADS.length).toBe(EXPECTED_RUNS);
  });

  it("the STRUCTURAL arm's SET is asserted, not only its cardinality (plan 30-10, finding B-7)", () => {
    // WHAT THE CARDINALITY EQUALITY ABOVE MISSES, MEASURED BEFORE THIS CASE WAS WRITTEN. The
    // structural arm has two hand-declared sides — STRUCTURAL_KINDS names the shapes,
    // STRUCTURAL_PAYLOADS carries them — and the only thing compared was `PAYLOADS.length`, which
    // counts one side against the other's LENGTH. Replacing the `empty-body` payload with a second
    // copy of `benign-read-only` therefore removed a shape from the differential entirely while
    // every case stayed green: 14 passed, and the guard's empty-stdin path was never exercised.
    //
    // "Derive the set, assert the count" is half a rule when the elements are what can go missing.
    // Both directions, and each with its own message, because they are different faults: a kind
    // declared but not carried is a shape nobody drives, and a kind carried but not declared is a
    // payload nobody wrote down.
    const carried = STRUCTURAL_PAYLOADS.map((p) => p.kind).sort();
    const declared = [...STRUCTURAL_KINDS].sort();
    const missing = declared.filter((k) => !carried.includes(k));
    expect(
      missing,
      `structural shape(s) declared in STRUCTURAL_KINDS but carried by no payload: ` +
        `[${missing.join(", ")}] — the differential is short by exactly these shapes`,
    ).toEqual([]);
    const undeclared = carried.filter((k) => !declared.includes(k));
    expect(
      undeclared,
      `structural payload(s) whose kind is not declared in STRUCTURAL_KINDS: ` +
        `[${undeclared.join(", ")}] — a shape nobody wrote down cannot be reasoned about`,
    ).toEqual([]);
    // …and no kind appears twice, which is the shape the cardinality check reads as full.
    expect(new Set(carried).size, `duplicate structural kinds: ${carried.join(", ")}`).toBe(
      carried.length,
    );
    expect(carried.length).toBeGreaterThan(0);
  });

  it("every COVERED_ELSEWHERE reference resolves: the file exists and carries that test name", () => {
    // A reference nobody reads is the hand-maintained set-literal this repository's founding defect
    // is made of. Each one is resolved against the tree here, so a renamed or deleted test is red.
    for (const [id, ref] of Object.entries(COVERED_ELSEWHERE)) {
      const path = join(ROOT, ref.file);
      expect(existsSync(path), `${id}: ${ref.file} does not exist`).toBe(true);
      expect(
        readFileSync(path, "utf8").includes(ref.test),
        `${id}: ${ref.file} no longer carries a test named "${ref.test}"`,
      ).toBe(true);
    }
  });

  it("the pinned pre-phase guard materializes from its BLOB (not from a ref)", () => {
    // Round-trips the materialized file back through git's own hasher: what was written IS the
    // pinned content, so the baseline cannot be quietly substituted.
    const blob = execFileSync("git", ["hash-object", BASELINE_JS], {
      cwd: ROOT,
      encoding: "utf8",
    }).trim();
    expect(blob).toBe(PRE_PHASE_GUARD_JS_BLOB);
  });
});

describe("AUTO-07 — a zero-config run differs from the pre-phase guard by EXACTLY one banner line", () => {
  const root = zeroConfigRoot();
  let compared = 0;

  for (const payload of PAYLOADS) {
    it(`${payload.kind}: exactly one added line, zero removed or changed`, () => {
      const before = run(BASELINE_JS, payload.body, root);
      const after = run(GUARD_JS, payload.body, root);
      compared += 1;

      // NON-VACUITY OF THE PAYLOAD ITSELF. A payload written for a checkpoint that matches no
      // pattern is an inert string: the run allows, the diff is still one line, and the checkpoint
      // is reported covered while nothing exercised it. A checkpoint payload must therefore make the
      // PRE-PHASE guard deny — proving the command reaches the decision it claims to.
      if (payload.checkpoint !== null && !before.denied) {
        throw new Error(
          `${payload.kind}: this payload claims to exercise "${payload.checkpoint}" but the ` +
            `pre-phase guard ALLOWED it, so it matches no pattern and exercises nothing.`,
        );
      }

      const { added, removed } = lineDiff(before.lines, after.lines);
      expect(
        removed,
        `${payload.kind}: the Phase-30 guard REMOVED or CHANGED output the pre-phase guard produced. ` +
          `Removed lines: ${JSON.stringify(removed)}`,
      ).toEqual([]);
      expect(
        added.length,
        `${payload.kind}: expected exactly ONE added line (the run banner), got ${added.length}: ` +
          `${JSON.stringify(added)}`,
      ).toBe(1);
      // The one added line IS the banner, and its text is the fixed all-default literal (D-20).
      expect(added[0], `${payload.kind}: the added line must be the D-20 banner literal`).toBe(
        cp.BANNER_ALL_DEFAULT,
      );

      // ── TWO SIGNALS FROM THE SAME CAPTURED RUN, AND THE MESSAGE NAMES WHICH FIRED. ────────────
      // Signal 1: the DECISION (a deny payload on stdout, or its absence).
      // Signal 2: the EXIT STATUS. The block mechanism is exit-0-plus-JSON, so a deny at a non-zero
      // status would mean the guard crashed rather than decided — a different outcome wearing the
      // same shape. They must agree on the same run, not on two runs.
      if (after.status !== 0) {
        throw new Error(
          `${payload.kind}: the guard exited ${String(after.status)}. The deny mechanism is ` +
            `exit 0 + JSON; a non-zero exit means the guard crashed rather than decided. ` +
            `stderr: ${after.stderr}`,
        );
      }
      if (after.denied !== before.denied) {
        throw new Error(
          `${payload.kind}: the DECISION changed — pre-phase ${before.denied ? "denied" : "allowed"}, ` +
            `Phase 30 ${after.denied ? "denied" : "allowed"}. AUTO-07 promises an identical decision ` +
            `at zero config.`,
        );
      }
      // Signal 3 (the spoofing check, T-30-05): the banner claims all-default. A denial in the same
      // run must therefore NOT name a non-default checkpoint. A run that says both is a failure with
      // its own message, because the banner is a claim a human acts on.
      const bannerSaysAllDefault = after.lines.includes(cp.BANNER_ALL_DEFAULT);
      const denialNamesALowering = /is declared `|NOT AUTHORIZED/.test(after.stdout);
      if (bannerSaysAllDefault && denialNamesALowering) {
        throw new Error(
          `${payload.kind}: the banner claims "${cp.BANNER_ALL_DEFAULT}" while the denial in the SAME ` +
            `run names a lowered checkpoint. The banner and the decision disagree. stdout: ${after.stdout}`,
        );
      }
    });
  }

  it("every payload in the table was actually compared", () => {
    // The loop above registers one case per row; this asserts the loop RAN for each, against the
    // ROSTER-derived count rather than against PAYLOADS.length. `compared` is a fact about what
    // EXECUTED; EXPECTED_RUNS is computed statically from the roster, so a case that never ran —
    // filtered, skipped, or lost to a table edit — is red rather than invisible.
    expect(compared).toBe(EXPECTED_RUNS);
  });
});

describe("AUTO-07 — the banner/decision agreement check is not vacuous", () => {
  it("a DECLARED lowering moves the banner off the literal AND makes the denial name it", () => {
    // Without this case the agreement check above could pass by never seeing a non-default run at
    // all. Here the banner must NOT be the all-default literal and the denial MUST name the
    // checkpoint — the same two signals, read from one run, in the opposite state.
    const root = freshTmp("autonomy-lowered-");
    mkdirSync(join(root, ".grugops"), { recursive: true });
    writeFileSync(
      join(root, ".grugops", "factory.config.json"),
      JSON.stringify({ checkpoints: { protected_branch_merge: "off" } }),
    );
    const r = run(GUARD_JS, MATCHED_PUSH, root);

    expect(r.status).toBe(0);
    expect(r.denied).toBe(true); // config alone lowered nothing
    expect(r.lines).not.toContain(cp.BANNER_ALL_DEFAULT);
    expect(r.stderr).toContain("protected_branch_merge=off");
    expect(r.stdout).toContain("protected_branch_merge");
    expect(r.stdout).toContain("GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE");
  });

  it("the same declaration WITH the human grant allows, and the banner names the authorizing key", () => {
    const root = freshTmp("autonomy-granted-");
    mkdirSync(join(root, ".grugops"), { recursive: true });
    writeFileSync(
      join(root, ".grugops", "factory.config.json"),
      JSON.stringify({ checkpoints: { protected_branch_merge: "off" } }),
    );
    const r = run(GUARD_JS, MATCHED_PUSH, root, {
      GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE: "a-named-human",
    });
    expect(r.status).toBe(0);
    expect(r.denied).toBe(false);
    expect(r.stderr).toContain("authorized by GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE=a-named-human");
  });
});
