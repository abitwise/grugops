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
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
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

// ── The payload table, and an INDEPENDENT count of it. ───────────────────────────────────────────
//
// The kinds are enumerated ONCE here and the table is enumerated ONCE below; the two are compared.
// A row silently lost from the table is red, because the kind list still accounts for it — this is
// the "derive the element count independently of the loop that consumes it" rule (Pitfall 6), and
// the reason the count is not simply `PAYLOADS.length`.
const PAYLOAD_KINDS = [
  "matched-protected-branch-push",
  "matched-production-deploy",
  "benign-read-only",
  "malformed-json-body",
  "empty-body",
] as const;
type PayloadKind = (typeof PAYLOAD_KINDS)[number];

const PAYLOADS: readonly { readonly kind: PayloadKind; readonly body: string }[] = [
  {
    kind: "matched-protected-branch-push",
    body: JSON.stringify({ tool_input: { command: "git push origin main" } }),
  },
  {
    kind: "matched-production-deploy",
    body: JSON.stringify({ tool_input: { command: "kubectl apply -f deploy.yaml" } }),
  },
  {
    kind: "benign-read-only",
    body: JSON.stringify({ tool_input: { command: "ls -la" } }),
  },
  { kind: "malformed-json-body", body: "not json at all" },
  { kind: "empty-body", body: "" },
];

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

describe("AUTO-07 — the payload table is complete", () => {
  it("the compared-run count equals an INDEPENDENTLY enumerated payload count", () => {
    expect(PAYLOADS.length).toBe(PAYLOAD_KINDS.length);
    // …and the two enumerations name the same things, so equal lengths cannot be a coincidence.
    expect([...PAYLOADS.map((p) => p.kind)].sort()).toEqual([...PAYLOAD_KINDS].sort());
    // Non-vacuity: the plan requires AT LEAST five distinct payloads.
    expect(new Set(PAYLOAD_KINDS).size).toBeGreaterThanOrEqual(5);
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
    // independently enumerated count rather than against PAYLOADS.length.
    expect(compared).toBe(PAYLOAD_KINDS.length);
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
    const r = run(GUARD_JS, PAYLOADS[0].body, root);

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
    const r = run(GUARD_JS, PAYLOADS[0].body, root, {
      GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE: "a-named-human",
    });
    expect(r.status).toBe(0);
    expect(r.denied).toBe(false);
    expect(r.stderr).toContain("authorized by GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE=a-named-human");
  });
});
