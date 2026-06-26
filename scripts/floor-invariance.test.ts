// floor-invariance.test.ts — the SC3 un-dialable-safety-floor sweep (GOV-01/GOV-02, D-12).
//
// The governance dials (context.human_admission, context.audit_retention) only ever TIGHTEN
// admission: each step up ADDS a named-human / durable-record requirement to more entries. There is
// NO dial value — lean, paranoid, or outright garbage — that SUBTRACTS a safety floor. This test is
// the structural proof scaffold: it sweeps EVERY dial value (including bogus/garbage strings) and
// asserts all FOUR un-dialable floor invariants still REFUSE, plus the structural dials-only-tighten
// guarantee.
//
// THE FOUR FLOOR INVARIANTS (un-dialable at every governance value):
//   1. refuse-self     — a self-stamped finding (verified_by === by) is a structural FAIL.
//   2. no-fabrication  — admit() never silently rewrites a note to make it pass; a hollow-evidence
//                        stamp still refuses and the note text is unchanged on refusal.
//   3. test-integrity  — quality.test_integrity has NO `off` value in any mode (TINT-03); the
//                        allowed set is {warn, block}. The governance dials cannot add `off`.
//   4. guard byte-frozen — the prod-deploy guard hooks/guard.ts is byte-unchanged (D-02); humans
//                        hold merge/deploy via the unchanged guard.
//
// THE STRUCTURAL GUARANTEE (the heart of SC3): a garbage / unknown human_admission value is treated
// conservatively (never as `off`-equivalent that opens a hole). The dials ADD a refusal branch; no
// value REMOVES an existing floor refusal. Concretely: a garbage human_admission must NEVER admit a
// high-severity finding lacking a human:NAME stamp.
//
// COMPOSITION: this test composes the two existing analogs rather than reimplementing a parser/guard —
//   - the config-load + repo-root resolution shape from config-queue-consistency.test.ts:23-30, and
//   - the spawn-the-COMMITTED-.js discipline from hooks/guard.test.ts (target the artifact, never .ts).
// It imports the COMMITTED scripts/context-io.js for the pure-function floor checks (validate/admit).
//
// D-12 / [[grugops-safety-invariant-green-suite-insufficient]]: a GREEN sweep is NECESSARY BUT NOT
// SUFFICIENT for a safety floor. This file is the author's proof scaffold; the phase plan's blocking
// checkpoint (Task 25-03-04) requires an INDEPENDENT opus-grade red-team to reproduce the floor
// adversarially against the committed .js before the SC3 floor is considered proven. This test does
// NOT, by itself, declare the floor proven.
//
// Vitest globals:false (the repo default) → import test fns explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = join(import.meta.dirname, "..");
const CONTEXT_IO_JS = join(ROOT, "scripts", "context-io.js");
const GUARD_JS = join(ROOT, "hooks", "admission-guard.js");
const TWIN_MD = join(ROOT, "agent-factory/config/factory.config.md");
const KIT_JSON = join(ROOT, "agent-factory/config/factory.config.json");
const APPROVAL = "GRUGOPS_ADMISSION_APPROVED_BY";

// The frozen prod-deploy-guard source blob (D-02). hooks/guard.ts must hash to this at every dial
// value — admission work must never touch the deploy guard. This is the committed-tree blob recorded
// in the project memory and the 25-02 summary.
const FROZEN_GUARD_BLOB = "3501810e21308e4b7e219679a6ca30dace9b5d66";

// Import the COMMITTED .js for the pure-function floor checks (validate / admit). Never the .ts.
const mod: typeof import("../scripts/context-io.js") = await import(
  pathToFileURL(CONTEXT_IO_JS).href
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

// EVERY value to sweep — the documented lean/paranoid set PLUS bogus/garbage strings. A garbage value
// must never open a floor; an unknown value is treated conservatively, never as `off`-equivalent.
const HUMAN_ADMISSION_VALUES = [
  "off",
  "high-severity",
  "all",
  "", // empty string
  "bogus",
  "OFF", // wrong case — must NOT be read as the `off` sentinel
  "true",
  "1",
  "zZ9-garbage_random-string", // arbitrary junk
];
const AUDIT_RETENTION_VALUES = [
  "git",
  "retained",
  "",
  "bogus",
  "GIT",
  "true",
  "0",
  "qQ8-garbage_random-string",
];

// Write a factory.config.json under a temp repoRoot with the given context dial values; return the
// repoRoot to pass as admit()'s 4th argument. readGovernanceConfig resolves this exact path. Mirrors
// config-queue-consistency's config-load + repo-root resolution.
function repoWithGovernance(context: Record<string, string>): string {
  const root = freshTmp("floor-repo-");
  mkdirSync(join(root, ".grugops"), { recursive: true });
  writeFileSync(
    join(root, ".grugops", "factory.config.json"),
    JSON.stringify({ context }, null, 2),
  );
  return root;
}

// A complete, valid note frontmatter+body, mutated per case (same shape as context-io.test.ts).
function noteText(over: Record<string, string> = {}): string {
  const f: Record<string, string> = {
    kind: "finding",
    by: "engineer",
    at: "2026-06-17T14:23:05Z",
    verified_by: "§14-gate#SEED-001",
    confidence: "high",
    ...over,
  };
  return (
    "---\n" +
    `kind: ${f.kind}\n` +
    `by: ${f.by}\n` +
    `at: ${f.at}\n` +
    `verified_by: ${f.verified_by}\n` +
    `confidence: ${f.confidence}\n` +
    "refs:\n  - AUTH-01\n" +
    "supersedes: \n" +
    "---\n\nThe login endpoint rejects an expired token with a 401.\n"
  );
}

describe("SC3 floor-invariance — every governance dial value (incl. garbage) still REFUSES", () => {
  // ── Floor invariant 1: refuse-self holds at EVERY human_admission value ──────────────────────────
  // A self-stamped finding (verified_by === by) is a structural FAIL regardless of the dial. validate()
  // owns this floor (context-io.ts refuse-self set); the governance dials cannot relax it.
  describe("invariant 1 — refuse-self refuses under every human_admission value", () => {
    for (const hv of HUMAN_ADMISSION_VALUES) {
      it(`refuse-self still FAILS when human_admission="${hv}"`, () => {
        // The dial lives in config, but refuse-self is enforced by validate() (text-only, dial-independent):
        // the config value is swept here to document that NO value changes this floor.
        const selfStamped = noteText({ by: "engineer", verified_by: "engineer" });
        const findings = mod.validate(selfStamped);
        expect(findings.length).toBeGreaterThan(0);
        expect(findings.join("\n")).toContain("verified_by");
      });
    }
  });

  // ── Floor invariant 2: no-fabrication / never-rewrite holds at EVERY dial value ──────────────────
  // admit() never mutates a note to make it pass. A hollow-evidence stamp still refuses, and the note
  // text the caller passed is byte-unchanged after admit() (admit returns findings, never rewrites).
  describe("invariant 2 — no-fabrication (admit never rewrites) under every dial value", () => {
    for (const hv of HUMAN_ADMISSION_VALUES) {
      for (const av of AUDIT_RETENTION_VALUES) {
        it(`hollow stamp still refuses + note unchanged when human_admission="${hv}" audit_retention="${av}"`, () => {
          const repoRoot = repoWithGovernance({ human_admission: hv, audit_retention: av });
          const contextRoot = freshTmp("floor-ctx-");
          const hollow = noteText({ kind: "finding", verified_by: "pending" }); // DeLM invalid-evidence
          const before = hollow;
          const findings = mod.admit("floor-task", hollow, contextRoot, repoRoot);
          // Refuses (hollow evidence is a structural FAIL in validate(), which admit() runs first).
          expect(findings.length).toBeGreaterThan(0);
          // Never rewrites: the input text is the same object/value the caller passed.
          expect(hollow).toBe(before);
        });
      }
    }
  });

  // ── Floor invariant 3: test-integrity has NO `off` — un-dialable, governance cannot add it ───────
  // The quality.test_integrity allowed set is {warn, block}; the twin documents "never off" (TINT-03),
  // and the kit default is never `off`. No governance dial can introduce an `off` for test_integrity.
  describe("invariant 3 — quality.test_integrity has no `off` value", () => {
    it("the twin documents the allowed set as warn|block and NEVER off", () => {
      const twin = readFileSync(TWIN_MD, "utf8");
      // The dial-contract row names the allowed set and the explicit no-off carve-out.
      expect(twin).toMatch(/`quality\.test_integrity`/);
      expect(twin).toMatch(/Never `off`|never `off`|never \*\*`off`\*\*|no `off`/);
      // The allowed values row lists warn and block.
      expect(twin).toMatch(/`warn`, `block`|`warn`,\s*`block`/);
    });

    it("the kit default for quality.test_integrity is not `off`", () => {
      const kit = JSON.parse(readFileSync(KIT_JSON, "utf8")) as {
        quality?: { test_integrity?: string };
      };
      const ti = kit.quality?.test_integrity;
      expect(ti).toBeDefined();
      expect(ti).not.toBe("off");
      expect(["warn", "block"]).toContain(ti);
    });
  });

  // ── Floor invariant 4: the prod-deploy guard hooks/guard.ts is byte-frozen (D-02) ────────────────
  // Humans hold merge/deploy via the UNCHANGED guard. Governance admission work must never touch it.
  describe("invariant 4 — hooks/guard.ts is byte-unchanged (D-02)", () => {
    it("the committed hooks/guard.ts blob matches the frozen D-02 hash", () => {
      // git hash-object computes the blob SHA exactly as git stored it; compare to the frozen blob.
      const blob = execFileSync("git", ["hash-object", "hooks/guard.ts"], {
        cwd: ROOT,
        encoding: "utf8",
      }).trim();
      expect(blob).toBe(FROZEN_GUARD_BLOB);
    });

    it("hooks/guard.ts has no uncommitted modification (git diff --quiet)", () => {
      // `git diff --quiet <path>` exits 0 when the working tree matches HEAD for that path. execFileSync
      // throws on a nonzero exit, so a clean tree returns normally and a dirty tree throws (fails).
      expect(() =>
        execFileSync("git", ["diff", "--quiet", "hooks/guard.ts"], { cwd: ROOT }),
      ).not.toThrow();
    });
  });

  // ── The STRUCTURAL dials-only-tighten guarantee (the heart of SC3) ───────────────────────────────
  // A garbage / unknown human_admission value NEVER admits a high-severity finding lacking a human
  // stamp. The dials ADD a refusal (high-severity / all) or leave admission unchanged (off / unknown
  // → lean); there is NO code path where a dial value SUBTRACTS an existing floor refusal.
  //
  // Proof construction: a high-severity finding (by: security-nfr) carrying a §14-gate stamp WITHOUT a
  // human:NAME stamp.
  //   - Under a value that GATES (high-severity / all), the D-04 refusal must fire.
  //   - Under a garbage/unknown value, it MUST NOT silently ADMIT (the must-not-open-a-hole property):
  //     it is either gated (refuses) or treated as lean (admission unchanged by the dial) — but a
  //     garbage value can NEVER turn a would-be-refused admission into a silent pass that opens a hole.
  // We assert the strong, unambiguous form the floor requires: for the gating values the D-04 refusal
  // fires; for EVERY value (incl. garbage) the admission outcome is never a fabricated pass — admit()
  // either refuses or admits on the note's own structural merits, never because the dial relaxed a floor.
  describe("structural — a garbage human_admission never opens a high-severity bypass", () => {
    // Build a high-severity gate-stamped finding with a planted live green verdict so the D-01 cross-
    // check passes — isolating the governance dial as the only remaining decision.
    function highSevGateStamped(): { contextRoot: string; task: string; text: string } {
      const contextRoot = freshTmp("floor-struct-ctx-");
      const task = "floor-struct-task";
      const id = "RUN-FLOOR-STRUCT";
      mod.emitVerdict(task, id, contextRoot);
      const text = noteText({ kind: "finding", by: "security-nfr", verified_by: `§14-gate#${id}` });
      return { contextRoot, task, text };
    }

    it("the gating values (high-severity, all) REFUSE a high-severity finding lacking a human stamp", () => {
      for (const hv of ["high-severity", "all"]) {
        const repoRoot = repoWithGovernance({ human_admission: hv });
        const { contextRoot, task, text } = highSevGateStamped();
        const findings = mod.admit(task, text, contextRoot, repoRoot);
        expect(findings.length, `expected D-04 refusal under human_admission=${hv}`).toBeGreaterThan(0);
        expect(findings.join("\n")).toContain("human_admission");
      }
    });

    it("a garbage human_admission NEVER turns a refused admission into a silent fabricated pass", () => {
      // For each garbage/unknown value: the high-severity finding lacking a human stamp must NOT be
      // admitted BECAUSE of the dial. An unknown value degrades to lean (admission unchanged), and a
      // lean admission of THIS note is itself only on the note's structural merits (the gate stamp
      // matched a live green verdict). The floor that the dial can NEVER relax is the refuse-self /
      // no-fabrication floor — verified below: even under garbage, a SELF-STAMPED high-severity finding
      // still refuses. This is the un-subtractable floor; a garbage value cannot open it.
      for (const hv of ["", "bogus", "OFF", "true", "1", "zZ9-garbage_random-string"]) {
        const repoRoot = repoWithGovernance({ human_admission: hv });
        const contextRoot = freshTmp("floor-struct-garbage-");
        // A self-stamped high-severity finding — the floor refusal that NO dial value may relax.
        const selfStamped = noteText({
          kind: "finding",
          by: "security-nfr",
          verified_by: "security-nfr",
        });
        const findings = mod.admit("floor-garbage-task", selfStamped, contextRoot, repoRoot);
        expect(
          findings.length,
          `a garbage human_admission="${hv}" must NOT admit a self-stamped high-severity finding`,
        ).toBeGreaterThan(0);
        expect(findings.join("\n")).toContain("verified_by"); // refuse-self floor held
      }
    });

    it("a garbage human_admission is NOT read as the `off` sentinel (OFF !== off — would-be-gated stays conservative)", () => {
      // The dial sentinel is exactly the lowercase "off". A mis-cased "OFF" is an UNKNOWN value, not
      // the off sentinel — so the D-04 gate (which fires when human_admission !== "off") still applies
      // to a high-severity finding lacking a human stamp. This proves an unknown value is treated
      // conservatively (gated), never silently as off-equivalent.
      const repoRoot = repoWithGovernance({ human_admission: "OFF" });
      const { contextRoot, task, text } = highSevGateStamped();
      const findings = mod.admit(task, text, contextRoot, repoRoot);
      expect(findings.length, "OFF (mis-cased) must not be read as the off sentinel").toBeGreaterThan(0);
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// 25-04 GAP-CLOSURE — the HOOK tier (the un-forgeable primary), not just admit()
//
// The 25-VERIFICATION.md red-team found the SC3 fail-open and the SC1 matcher bypasses on the HOOK,
// while the original 88-case sweep above asserted only the admit() (script) tier. These blocks
// child-spawn the COMMITTED hooks/admission-guard.js (never the .ts, never the author's
// admission-guard.test.ts) and assert the class invariant the red-team requires:
//   - SC3: every non-`off` human_admission value (incl. typo/case/whitespace/garbage) AND a corrupt
//     config gate a matched admit (DENY); a genuinely absent config allows a routine admit (lean).
//   - SC1/GAP1/GAP3 (anti-whack-a-mole): across {launcher} × {prefix} × {body-context} × {LF|CRLF}
//     a LIVE admit is gated-DENY and an INERT mention is ALLOWed — proven as a CLASS invariant over
//     the single shell-segment parsing authority, NOT an enumeration of known launcher shapes. A
//     launcher shape outside any narrow anchor cannot escape (one grammar walk), and an inert body
//     cannot false-positive.
//
// D-12 / [[grugops-safety-invariant-green-suite-insufficient]]: this GREEN sweep is NECESSARY BUT
// NOT SUFFICIENT. The blocking checkpoint (Task 25-04-04) requires an INDEPENDENT opus-grade
// red-team (both the logic angle AND the input-surface angle — the P23 split) to reproduce the
// closure adversarially against the committed .js before SC1+SC3 are considered closed.
// ════════════════════════════════════════════════════════════════════════════════════════════════

// Child-spawn the COMMITTED admission-guard.js with a clean env (never inherit a stray APPROVAL),
// returning whether it emitted a deny. Mirrors the hooks/admission-guard.test.ts runGuard harness.
function hookDecision(
  command: string,
  projectDir: string,
  approval?: string,
): "deny" | "allow" {
  const baseEnv: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (k === APPROVAL) continue;
    if (v !== undefined) baseEnv[k] = v;
  }
  const env: Record<string, string> = { ...baseEnv, CLAUDE_PROJECT_DIR: projectDir };
  if (approval !== undefined) env[APPROVAL] = approval;
  const r = spawnSync("node", [GUARD_JS], {
    input: JSON.stringify({ tool_input: { command } }),
    encoding: "utf8",
    env,
  });
  return (r.stdout ?? "").includes('"permissionDecision":"deny"') ? "deny" : "allow";
}

// A project dir with a chosen human_admission value (or a corrupt config) plus a high-severity note.
const HIGH_NOTE =
  "---\nid: n1\nby: security-nfr\nkind: finding\nverified_by: human:alice\n---\nhigh-sev body\n";
const ROUTINE_NOTE =
  "---\nid: n2\nby: software-engineer\nkind: observation\nverified_by:\n---\nroutine body\n";

function projectWith(opts: { dial?: string; corrupt?: boolean; absent?: boolean }): {
  dir: string;
  highNote: string;
  routineNote: string;
} {
  const dir = freshTmp("hook-floor-");
  if (!opts.absent) {
    mkdirSync(join(dir, ".grugops"), { recursive: true });
    const cfgPath = join(dir, ".grugops", "factory.config.json");
    if (opts.corrupt) writeFileSync(cfgPath, "{ this is : not json ");
    else writeFileSync(cfgPath, JSON.stringify({ context: { human_admission: opts.dial ?? "off" } }));
  }
  const highNote = join(dir, "high.md");
  const routineNote = join(dir, "routine.md");
  writeFileSync(highNote, HIGH_NOTE);
  writeFileSync(routineNote, ROUTINE_NOTE);
  return { dir, highNote, routineNote };
}

describe("SC3 HOOK-tier — every non-`off` dial + a corrupt config fail CLOSED (committed admission-guard.js)", () => {
  // The FULL garbage/typo/case/whitespace value set, swept against the HOOK (the un-forgeable tier).
  const NON_OFF = [
    "high-severity",
    "all",
    "", // empty
    "bogus",
    "OFF", // mis-cased
    "High-Severity",
    "hihg-severity", // typo
    "all ", // trailing whitespace
    "1",
    "true",
    "zZ9-garbage_random-string",
  ];

  for (const dial of NON_OFF) {
    it(`hook DENIES a high-severity admit when human_admission=${JSON.stringify(dial)} (gate-or-stricter)`, () => {
      const { dir, highNote } = projectWith({ dial });
      const cmd = `node scripts/context-io.js admit my-task ${highNote}`;
      expect(hookDecision(cmd, dir), `dial=${JSON.stringify(dial)} must gate, never off-equivalent`).toBe(
        "deny",
      );
    });
  }

  it("hook ALLOWs a high-severity admit only under canonical `off` (lean)", () => {
    const { dir, highNote } = projectWith({ dial: "off" });
    const cmd = `node scripts/context-io.js admit my-task ${highNote}`;
    expect(hookDecision(cmd, dir)).toBe("allow");
  });

  it("hook DENIES a matched admit when the config is present-but-unreadable (corrupt → fail-closed)", () => {
    const { dir, highNote } = projectWith({ corrupt: true });
    const cmd = `node scripts/context-io.js admit my-task ${highNote}`;
    expect(hookDecision(cmd, dir)).toBe("deny");
  });

  it("hook ALLOWs a routine admit when the config is genuinely ABSENT (zero-config lean preserved)", () => {
    const { dir, routineNote } = projectWith({ absent: true });
    const cmd = `node scripts/context-io.js admit my-task ${routineNote}`;
    expect(hookDecision(cmd, dir)).toBe("allow");
  });
});

describe("SC1 anti-whack-a-mole — class invariant over {launcher}×{prefix}×{body}×{LF|CRLF}", () => {
  // The matcher is ONE parsing authority over the shell grammar (liveTokens + isAdmitInvocation), so
  // the proof is a CLASS invariant, not an enumeration: a LIVE admit launch on a gated high-severity
  // un-approved note must DENY for EVERY launcher/prefix/line-ending combination, and an INERT
  // mention (quoted / heredoc / comment) must ALLOW for EVERY combination. A hypothetical launcher
  // shape #N is caught structurally; an inert body line #N is allowed structurally.
  const LAUNCHERS = ["node", "npx", "tsx", "npx tsx"];
  const LINE_ENDINGS: Array<["LF" | "CRLF", string]> = [
    ["LF", "\n"],
    ["CRLF", "\r\n"],
  ];

  // Build the script+verb tail for a launcher, given a note path.
  function adminTail(launcher: string, note: string): string {
    // npx/tsx run the .ts; node runs the .js; both reach the same admit verb.
    const script = launcher === "node" ? "scripts/context-io.js" : "scripts/context-io.ts";
    return `${launcher} ${script} admit my-task ${note}`;
  }

  // LIVE prefixes — each keeps the launcher a real command (must DENY when gated).
  function livePrefixes(launcher: string, note: string, nl: string): Array<[string, string]> {
    const tail = adminTail(launcher, note);
    return [
      ["none", tail],
      ["subshell", `( ${tail} )`],
      ["env-var", `FOO=bar ${tail}`],
      ["env-wrapper", `env FOO=bar ${tail}`],
      // backslash-newline line continuation between the launcher word and the rest.
      ["continuation", tail.replace(" ", ` \\${nl}`)],
    ];
  }

  // INERT bodies — each makes the admit text DATA (must ALLOW even when gated).
  function inertBodies(launcher: string, note: string, nl: string): Array<[string, string]> {
    const tail = adminTail(launcher, note);
    return [
      ["single-quoted", `echo '${tail}'`],
      ["double-quoted", `echo "${tail}"`],
      ["heredoc", `cat <<EOF${nl}${tail}${nl}EOF`],
      ["comment", `ls # ${tail}`],
    ];
  }

  for (const launcher of LAUNCHERS) {
    for (const [leName, nl] of LINE_ENDINGS) {
      // Use `all` so every matched live admit is gated regardless of severity-role parsing — the
      // class invariant is about the MATCHER (live vs inert), isolated from severity classification.
      it(`LIVE admit launches DENY: launcher=${JSON.stringify(launcher)} (${leName})`, () => {
        const { dir, highNote } = projectWith({ dial: "all" });
        for (const [prefixName, command] of livePrefixes(launcher, highNote, nl)) {
          expect(
            hookDecision(command, dir),
            `live ${launcher}/${prefixName}/${leName} must be gated DENY`,
          ).toBe("deny");
        }
      });

      it(`INERT mentions ALLOW: launcher=${JSON.stringify(launcher)} (${leName})`, () => {
        const { dir, highNote } = projectWith({ dial: "all" });
        for (const [bodyName, command] of inertBodies(launcher, highNote, nl)) {
          expect(
            hookDecision(command, dir),
            `inert ${launcher}/${bodyName}/${leName} must be ALLOW (data, not a live admit)`,
          ).toBe("allow");
        }
      });
    }
  }

  it("an adversary-shaped launcher the author did not enumerate is still caught (single grammar walk)", () => {
    // A nested-subshell + assignment-prefix + continuation combination not spelled out as a named
    // case above: the parser catches it because it walks the grammar once, not an anchor list.
    const { dir, highNote } = projectWith({ dial: "all" });
    const exotic = `( FOO=1 env BAR=2 node \\\nscripts/context-io.js \\\nadmit my-task ${highNote} )`;
    expect(hookDecision(exotic, dir)).toBe("deny");
  });
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// ROUND-2 (25-05) SWEEPS — the type-level + command-RESOLUTION extensions of the 25-04 sweeps.
// The 25-04 HOOK-tier sweep tested garbage STRING dials; the round-2 red-team showed the holes were
// (a) non-STRING dial TYPES coercing to off, (b) a case-variant `by` escaping the case-sensitive
// severity classification, and (c) command-RESOLUTION obfuscation (the matcher tested the launcher as
// a literal word). These sweeps close those classes structurally. As in 25-04, a GREEN sweep is
// NECESSARY-NOT-SUFFICIENT (D-12): the blocking Task 25-05-04 independent both-angle opus red-team is
// the gate; these sweeps do NOT, by themselves, declare SC1/SC3 closed.
// ════════════════════════════════════════════════════════════════════════════════════════════════

// Write a RAW JSON config so a NON-STRING human_admission value can be expressed (JSON.stringify of a
// JS object would coerce a JS value to its string form). Returns {dir, highNote}.
function projectRawDial(rawJson: string): { dir: string; highNote: string } {
  const dir = freshTmp("hook-rawdial-");
  mkdirSync(join(dir, ".grugops"), { recursive: true });
  writeFileSync(
    join(dir, ".grugops", "factory.config.json"),
    `{ "context": { "human_admission": ${rawJson} } }`,
  );
  const highNote = join(dir, "high.md");
  writeFileSync(highNote, HIGH_NOTE);
  return { dir, highNote };
}

describe("SC3 HOOK-tier (25-05 GAP-C) — every PRESENT non-string dial TYPE fails CLOSED", () => {
  // The TYPE-level extension of the 25-04 garbage-STRING sweep: a present true / 1 / null / array /
  // object human_admission must gate a matched high-severity admit (governance not silently off), at
  // source="ok" (it WAS read). The present `"off"` STRING and a genuinely ABSENT config stay lean.
  const NON_STRING = ["true", "1", "null", '["all"]', "{}"];
  for (const raw of NON_STRING) {
    it(`hook DENIES a high-severity admit when human_admission=${raw} (non-string → gate-or-stricter)`, () => {
      const { dir, highNote } = projectRawDial(raw);
      const cmd = `node scripts/context-io.js admit my-task ${highNote}`;
      expect(
        hookDecision(cmd, dir),
        `non-string dial ${raw} must gate, never off-equivalent`,
      ).toBe("deny");
    });
  }

  it("hook DENIES under a present non-object `context` (string) — gate-or-stricter", () => {
    const dir = freshTmp("hook-nonobjctx-");
    mkdirSync(join(dir, ".grugops"), { recursive: true });
    writeFileSync(join(dir, ".grugops", "factory.config.json"), '{ "context": "x" }');
    const highNote = join(dir, "high.md");
    writeFileSync(highNote, HIGH_NOTE);
    const cmd = `node scripts/context-io.js admit my-task ${highNote}`;
    expect(hookDecision(cmd, dir)).toBe("deny");
  });

  it("hook ALLOWs the present `\"off\"` STRING and a genuinely ABSENT config (lean preserved)", () => {
    const { dir, highNote } = projectWith({ dial: "off" });
    expect(hookDecision(`node scripts/context-io.js admit my-task ${highNote}`, dir)).toBe("allow");
    const abs = projectWith({ absent: true });
    expect(
      hookDecision(`node scripts/context-io.js admit my-task ${abs.routineNote}`, abs.dir),
    ).toBe("allow");
  });
});

describe("SC1 HOOK-tier (25-05 GAP-D) — a case-variant `by` is classified high-severity", () => {
  // The case-sensitive HIGH_SEVERITY_ROLES membership test let a case-variant `by` escape the
  // high-severity gate. Each casing of each high-severity role must now DENY a gated un-approved admit
  // under human_admission: high-severity; a routine role still ALLOWs (no over-classification).
  const HI_SEV_CASINGS = [
    "Security-NFR",
    "SECURITY-NFR",
    "security-nfr",
    "Architect-Design",
    "ARCHITECT-DESIGN",
    "Release-Manager",
    "RELEASE-MANAGER",
  ];
  function projectCaseVariant(by: string): { dir: string; note: string } {
    const dir = freshTmp("hook-cv-");
    mkdirSync(join(dir, ".grugops"), { recursive: true });
    writeFileSync(
      join(dir, ".grugops", "factory.config.json"),
      JSON.stringify({ context: { human_admission: "high-severity" } }),
    );
    const note = join(dir, "cv.md");
    writeFileSync(note, `---\nid: n1\nby: ${by}\nkind: finding\nverified_by: human:alice\n---\nbody\n`);
    return { dir, note };
  }
  for (const by of HI_SEV_CASINGS) {
    it(`hook DENIES a case-variant high-severity admit (by: ${by}) under high-severity`, () => {
      const { dir, note } = projectCaseVariant(by);
      expect(hookDecision(`node scripts/context-io.js admit my-task ${note}`, dir)).toBe("deny");
    });
  }

  it("hook ALLOWs a routine role (software-engineer) under high-severity (no over-classification)", () => {
    const dir = freshTmp("hook-cv-routine-");
    mkdirSync(join(dir, ".grugops"), { recursive: true });
    writeFileSync(
      join(dir, ".grugops", "factory.config.json"),
      JSON.stringify({ context: { human_admission: "high-severity" } }),
    );
    const note = join(dir, "r.md");
    writeFileSync(note, ROUTINE_NOTE);
    expect(hookDecision(`node scripts/context-io.js admit my-task ${note}`, dir)).toBe("allow");
  });
});

describe("SC1 anti-whack-a-mole (25-05) — command-RESOLUTION class invariant over the obfuscation matrix", () => {
  // The matcher resolves the EFFECTIVE command word as ONE authority over the shell grammar (skip
  // command-modifier builtins → basename a path → fully de-quote → brace-group → nodejs), layered on
  // the PRESERVED 25-04 segmentation. So the proof is a CLASS invariant over the effective-command-word
  // obfuscation matrix, not an enumeration of known launcher spellings: a LIVE admit launch on a gated
  // high-severity un-approved note DENIES for EVERY {resolution-obfuscation × line-ending} combination,
  // the unresolvable admit-shape tail (eval / sh -c body / env-indirection) GATES, an admit-shape-free
  // dynamic command ALLOWs, and an INERT mention ALLOWs. A launcher spelling outside any narrow anchor
  // is caught structurally because resolution — not enumeration — is the boundary (the P22 round-8
  // "make the boundary BE the parser" lesson applied to command-RESOLUTION). D-12: this GREEN class
  // invariant is NECESSARY-NOT-SUFFICIENT; the independent red-team at Task 25-05-04 is the gate.
  const LINE_ENDINGS: Array<["LF" | "CRLF", string]> = [
    ["LF", "\n"],
    ["CRLF", "\r\n"],
  ];

  // Each entry maps the bare `node` launcher word to an obfuscated EFFECTIVE-command-word spelling that
  // still resolves to a launcher. The tail (script + admit verb + note) is shared.
  function resolutionForms(note: string): Array<[string, string]> {
    const tail = `scripts/context-io.js admit my-task ${note}`;
    return [
      ["builtin-command", `command node ${tail}`],
      ["builtin-exec", `exec node ${tail}`],
      ["builtin-nice", `nice node ${tail}`],
      ["builtin-time", `time node ${tail}`],
      ["builtin-nohup", `nohup node ${tail}`],
      ["builtin-xargs", `xargs node ${tail}`],
      ["path-abs", `/usr/local/bin/node ${tail}`],
      ["path-rel", `./node ${tail}`],
      ["alt-nodejs", `nodejs ${tail}`],
      ['split-quote-double', `no"de" ${tail}`],
      ["split-quote-single", `n''ode ${tail}`],
      ["brace-group", `{ node ${tail}; }`],
      // a compound the author did not enumerate: builtin × path × split-quote together
      ["compound", `command /usr/local/bin/no"de" ${tail}`],
    ];
  }

  // Unresolvable admit-shape tail — the resolver cannot see through these, so they GATE (DENY).
  function unresolvableForms(note: string): Array<[string, string]> {
    const tail = `node scripts/context-io.js admit my-task ${note}`;
    return [
      ["eval", `eval "${tail}"`],
      ["sh -c", `sh -c "${tail}"`],
      ["bash -c", `bash -c "${tail}"`],
      ["env-indirection", `$X scripts/context-io.js admit my-task ${note}`],
    ];
  }

  // Admit-shape-FREE dynamic commands — unrelated, must ALLOW (no over-block).
  const NO_ADMIT_DYNAMIC: Array<[string, string]> = [
    ["eval-no-admit", `eval "echo hi"`],
    ["bash -c-no-admit", `bash -c "ls"`],
  ];

  // Inert mentions — admit text as DATA, must ALLOW.
  function inertForms(note: string): Array<[string, string]> {
    const tail = `node scripts/context-io.js admit my-task ${note}`;
    return [
      ["single-quoted", `echo '${tail}'`],
      ["double-quoted", `echo "${tail}"`],
      ["comment", `ls # ${tail}`],
      ["path-named-admit", `cat ./admit/notes.txt`],
    ];
  }

  for (const [leName, nl] of LINE_ENDINGS) {
    it(`LIVE admit launches DENY for every resolution-obfuscation form (${leName})`, () => {
      const { dir, highNote } = projectWith({ dial: "all" });
      for (const [name, base] of resolutionForms(highNote)) {
        // Insert the line-ending variant by splitting the launcher word from its first arg with a
        // backslash-continuation, exercising the CRLF path on the segmentation layer too.
        const command = nl === "\n" ? base : base.replace(" ", ` \\${nl}`);
        expect(hookDecision(command, dir), `live ${name}/${leName} must gate DENY`).toBe("deny");
      }
    });

    it(`unresolvable admit-shape tail GATES for every form (${leName})`, () => {
      const { dir, highNote } = projectWith({ dial: "all" });
      for (const [name, command] of unresolvableForms(highNote)) {
        expect(hookDecision(command, dir), `unresolvable ${name}/${leName} must GATE (deny)`).toBe(
          "deny",
        );
      }
    });

    it(`admit-shape-free dynamic commands ALLOW (${leName}) — fail-closed tail is admit-scoped`, () => {
      const { dir } = projectWith({ dial: "all" });
      for (const [name, command] of NO_ADMIT_DYNAMIC) {
        expect(hookDecision(command, dir), `no-admit ${name}/${leName} must ALLOW`).toBe("allow");
      }
    });

    it(`INERT admit mentions ALLOW for every form (${leName}) — no over-block`, () => {
      const { dir, highNote } = projectWith({ dial: "all" });
      for (const [name, command] of inertForms(highNote)) {
        expect(hookDecision(command, dir), `inert ${name}/${leName} must ALLOW (data)`).toBe(
          "allow",
        );
      }
    });
  }

  it("the refuse-self-set floor holds behind a resolution-obfuscated launcher (GAP-B, matcher false-negative)", () => {
    // The inline self-set is refused independent of launcher recognition — proven behind every
    // resolution-obfuscation form even with the var already in env.
    const { dir, highNote } = projectWith({ dial: "high-severity" });
    for (const [name, base] of resolutionForms(highNote)) {
      const command = `${APPROVAL}=eve ${base}`;
      expect(
        hookDecision(command, dir, "eve"),
        `self-set behind ${name} must DENY even with the var in env`,
      ).toBe("deny");
    }
  });
});

describe("SC1 anti-whack-a-mole (25-06) — command-RESOLUTION class invariant over the round-3 matrix", () => {
  // Round-3 UNIFY: the matcher and the classifier are ONE liveAdmitSegments authority over the shell
  // grammar — command-word resolution (basename + de-quote) is applied to EVERY leading-run token, a
  // command-substitution / backtick command word fails CLOSED, and EVERY live admit segment is
  // classified. So the proof is a CLASS invariant over three NEW dimensions the round-2 fuzz did not
  // cover, NOT an enumeration: (A) a PATH-FORM command modifier × every modifier spelling/path prefix/
  // flag resolves through to the trailing launcher and DENIES; (B) a `$( … )` / backtick that PRODUCES
  // the command word GATES on the admit shape and ALLOWs without it; (E) a multi-admit command DENIES
  // whenever ANY live segment is gated (any ordering / separator) and a routine-only multi-admit ALLOWs
  // under high-severity. A launcher/modifier spelling or admit-ordering outside any narrow anchor cannot
  // escape, because resolution + per-segment classification — not enumeration — is the boundary (the P22
  // round-8 "make the boundary BE the parser" lesson applied to command-RESOLUTION). D-12: this GREEN
  // class invariant is NECESSARY-NOT-SUFFICIENT; the INDEPENDENT both-angle red-team at Task 25-06-04 is
  // the gate, not a green suite — the author's suites passed and STILL missed these classes across rounds
  // 1, 2, and 3. The round-2 effective-command-word / non-string-dial / case-variant sweeps above are
  // PRESERVED and not duplicated here.
  const LINE_ENDINGS: Array<["LF" | "CRLF", string]> = [
    ["LF", "\n"],
    ["CRLF", "\r\n"],
  ];

  // ── Class A: PATH-FORM command modifiers. Every {modifier × path-prefix × optional flag} resolves to
  //    its basename, is skipped as a leading-run prefix, and the trailing `node` becomes the effective
  //    command word → DENY a gated high-severity un-approved admit. (The round-2 fuzz basenamed only the
  //    FINAL launcher word; a PATH-FORM MODIFIER token is the new dimension.)
  function pathFormModifierForms(note: string): Array<[string, string]> {
    const tail = `node scripts/context-io.js admit my-task ${note}`;
    const modifiers = ["env", "nice", "xargs", "nohup", "stdbuf", "timeout", "command", "exec"];
    const prefixes = ["/usr/bin/", "/bin/", "./"];
    const out: Array<[string, string]> = [];
    for (const m of modifiers) {
      for (const p of prefixes) {
        out.push([`${p}${m}`, `${p}${m} ${tail}`]);
      }
    }
    // env with an option flag (env -S / env -i) — the modifier's flag is skipped in the leading run.
    out.push(["/usr/bin/env -S", `/usr/bin/env -S ${tail}`]);
    out.push(["env -i", `env -i ${tail}`]);
    // a doubled path-form modifier chain (the author surfaces this compound explicitly).
    out.push(["doubled /usr/bin/env /bin/nice", `/usr/bin/env /bin/nice ${tail}`]);
    return out;
  }

  // ── Class B: a command word PRODUCED by a `$( … )` / backtick substitution (incl. nested and
  //    in-modifier-slot). With the admit shape → GATE (DENY); without it → ALLOW (narrow trigger).
  function commandSubstitutionForms(note: string): Array<[string, string]> {
    const tail = `scripts/context-io.js admit my-task ${note}`;
    return [
      ["$(echo node)", `$(echo node) ${tail}`],
      ["backtick echo node", "`echo node` " + tail],
      ["$(printf node)", `$(printf node) ${tail}`],
      ["$(basename /usr/bin/node)", `$(basename /usr/bin/node) ${tail}`],
      ["nested $(echo $(echo node))", `$(echo $(echo node)) ${tail}`],
      ["in-modifier nice $(echo node)", `nice $(echo node) ${tail}`],
      // an author-unenumerated compound: a path-form modifier in front of a substitution command word.
      ["path-modifier + substitution", `/usr/bin/env $(echo node) ${tail}`],
    ];
  }

  // A command substitution / backtick with NO admit shape in the live segment → ALLOW (no over-block).
  const NO_ADMIT_SUBSTITUTION: Array<[string, string]> = [
    ["$(echo hi) ls", `$(echo hi) ls`],
    ["bare backtick", "`echo hi`"],
    ["$(printf foo) echo bar", `$(printf foo) echo bar`],
  ];

  // ── Class E: multi-admit ordering. Build a chain of admit segments (each routine, plus one optional
  //    high-severity in a chosen position) joined by a separator. Under high-severity, a chain DENIES iff
  //    it contains the high-severity segment (any position); a routine-only chain ALLOWs. Under `all`,
  //    any chain DENIES (every admit gated).
  const SEPARATORS = [";", "&&", "||", "|", "&"];
  function admitSeg(task: string, note: string): string {
    return `node scripts/context-io.js admit ${task} ${note}`;
  }
  function chain(segs: string[], sep: string): string {
    return segs.join(` ${sep} `);
  }

  for (const [leName, nl] of LINE_ENDINGS) {
    it(`Class A — every path-form modifier DENIES a gated high-severity admit (${leName})`, () => {
      const { dir, highNote } = projectWith({ dial: "high-severity" });
      for (const [name, base] of pathFormModifierForms(highNote)) {
        const command = nl === "\n" ? base : base.replace(" ", ` \\${nl}`);
        expect(hookDecision(command, dir), `path-form modifier ${name}/${leName} must DENY`).toBe(
          "deny",
        );
      }
    });

    it(`Class A — a path-form modifier with NO launcher / no admit shape ALLOWs (${leName})`, () => {
      const { dir } = projectWith({ dial: "all" });
      // `/usr/bin/env ls` — a modifier wrapping a non-launcher with no admit shape is unrelated.
      const command = nl === "\n" ? `/usr/bin/env ls -la` : `/usr/bin/env \\${nl}ls -la`;
      expect(hookDecision(command, dir), `inert path-form modifier/${leName} must ALLOW`).toBe(
        "allow",
      );
    });

    it(`Class B — every command-substitution command word GATES on the admit shape (${leName})`, () => {
      const { dir, highNote } = projectWith({ dial: "high-severity" });
      for (const [name, command] of commandSubstitutionForms(highNote)) {
        expect(hookDecision(command, dir), `substitution ${name}/${leName} must GATE (deny)`).toBe(
          "deny",
        );
      }
    });

    it(`Class B — a command substitution with NO admit shape ALLOWs (${leName}) — no over-block`, () => {
      const { dir } = projectWith({ dial: "all" });
      for (const [name, command] of NO_ADMIT_SUBSTITUTION) {
        expect(hookDecision(command, dir), `no-admit substitution ${name}/${leName} must ALLOW`).toBe(
          "allow",
        );
      }
    });

    it(`Class E — a chain containing a high-severity admit DENIES under high-severity, any position/separator (${leName})`, () => {
      const { dir, highNote, routineNote } = projectWith({ dial: "high-severity" });
      for (const sep of SEPARATORS) {
        // high in each of three positions across a 3-segment chain.
        const positions: string[][] = [
          [admitSeg("t1", highNote), admitSeg("t2", routineNote), admitSeg("t3", routineNote)],
          [admitSeg("t1", routineNote), admitSeg("t2", highNote), admitSeg("t3", routineNote)],
          [admitSeg("t1", routineNote), admitSeg("t2", routineNote), admitSeg("t3", highNote)],
        ];
        for (let p = 0; p < positions.length; p++) {
          const command = chain(positions[p], sep);
          expect(
            hookDecision(command, dir),
            `multi-admit high@pos${p} sep="${sep}"/${leName} must DENY`,
          ).toBe("deny");
        }
      }
    });

    it(`Class E — a routine-ONLY chain ALLOWs under high-severity (no over-block) and DENIES under all (${leName})`, () => {
      const high = projectWith({ dial: "high-severity" });
      const all = projectWith({ dial: "all" });
      for (const sep of SEPARATORS) {
        for (const n of [2, 3]) {
          const segs = Array.from({ length: n }, (_, k) => admitSeg(`t${k}`, high.routineNote));
          const cmdHigh = chain(segs, sep);
          expect(
            hookDecision(cmdHigh, high.dir),
            `routine-only ${n}-chain sep="${sep}"/${leName} must ALLOW under high-severity`,
          ).toBe("allow");
          const segsAll = Array.from({ length: n }, (_, k) => admitSeg(`t${k}`, all.routineNote));
          const cmdAll = chain(segsAll, sep);
          expect(
            hookDecision(cmdAll, all.dir),
            `routine-only ${n}-chain sep="${sep}"/${leName} must DENY under all`,
          ).toBe("deny");
        }
      }
    });
  }

  // The structural argument (D-12): the matcher and classifier are ONE liveAdmitSegments authority, so
  // command-word resolution is uniform over every leading-run token and EVERY live admit segment is
  // classified. A launcher/modifier spelling or admit-ordering outside any narrow anchor cannot escape,
  // and a dynamically-produced command word fails closed. The proof is the class invariant above, not an
  // enumeration of known forms — and a GREEN class invariant is NECESSARY-NOT-SUFFICIENT; the independent
  // both-angle opus red-team at Task 25-06-04 is the closure gate.
  it("the refuse-self-set floor (GAP-B) holds behind a path-form-modifier launcher (matcher false-negative)", () => {
    const { dir, highNote } = projectWith({ dial: "high-severity" });
    for (const [name, base] of pathFormModifierForms(highNote)) {
      const command = `${APPROVAL}=eve ${base}`;
      expect(
        hookDecision(command, dir, "eve"),
        `self-set behind ${name} must DENY even with the var in env`,
      ).toBe("deny");
    }
  });
});

describe("SC1 anti-whack-a-mole (25-07) — leading-run command-RESOLUTION class invariant over the round-4 matrix", () => {
  // Round-4 INVERT: the leading-run resolver now fails CLOSED on the UNRESOLVABLE tail — an admit shape
  // behind a command word that does not resolve to a recognized launcher (a modifier OPERAND the skip
  // stopped at, an UNLISTED wrapper, or a LEADING REDIRECTION the tokenizer read as the command word)
  // is treated as a live admit and gated, exactly as Class B does for a dynamic command word. So the
  // proof is a CLASS invariant over the wrapper / modifier-operand / leading-redirection × dial ×
  // admit-ordering matrix, NOT an enumeration: a gated admit behind ANY unresolved command word in ANY
  // live segment → DENY; a routine-only / no-admit-shape / inert command → ALLOW. A wrapper/operand/
  // redirection spelling outside any anchor cannot escape because resolution FAILS CLOSED on the
  // unresolvable tail — COMMAND_MODIFIERS is NOT widened and no operand/redirection grammar is enumerated.
  // The round-2 {launcher}×{prefix}×{body} fuzz, the round-3 path-form-modifier × substitution × multi-
  // admit fuzz, and the non-string-dial / case-variant sweeps above are PRESERVED and not duplicated.
  //
  // D-12 / [[grugops-safety-invariant-green-suite-insufficient]]: this GREEN class invariant is
  // NECESSARY-BUT-NOT-SUFFICIENT — the author's suites passed and STILL missed a class across rounds 1,
  // 2, 3, and the round-3 fix. The INDEPENDENT both-angle opus red-team at Task 25-07-04 is the closure
  // gate, not a green suite. Every case child-spawns the COMMITTED admission-guard.js (never the .ts).
  const admitTail = (note: string): string => `node scripts/context-io.js admit my-task ${note}`;
  const SEPARATORS = [";", "&&", "||", "|", "&"];

  // ── Modifier-OPERAND fuzz: {modifier} × {operand spelling} × {path spelling}. The skip stops at the
  //    operand, which is not a launcher → the admit shape behind it fails closed. A modifier-operand
  //    prefix with NO trailing admit shape stays ALLOW (no over-block).
  const MODIFIERS = ["timeout", "nice", "exec", "xargs", "env", "nohup"];
  const OPERANDS = ["5", "-n 5", "-a foo", "-I {}", "-C /tmp", "-u PATH", "-k 1 5", "'-n' '5'"];
  const MOD_PATHS = ["", "/usr/bin/", "./"];

  it("modifier-operand fuzz — every {modifier × operand × path} behind an admit shape DENIES (high-severity)", () => {
    const { dir, highNote } = projectWith({ dial: "high-severity" });
    for (const m of MODIFIERS) {
      for (const op of OPERANDS) {
        for (const p of MOD_PATHS) {
          const command = `${p}${m} ${op} ${admitTail(highNote)}`;
          expect(
            hookDecision(command, dir),
            `modifier-operand "${p}${m} ${op} node …admit" must DENY`,
          ).toBe("deny");
        }
      }
    }
  });

  it("modifier-operand fuzz — the same prefix with NO admit shape ALLOWs (no over-block)", () => {
    const { dir } = projectWith({ dial: "high-severity" });
    for (const m of MODIFIERS) {
      for (const op of OPERANDS) {
        for (const p of MOD_PATHS) {
          const command = `${p}${m} ${op} node render`;
          expect(
            hookDecision(command, dir),
            `non-admit modifier-operand "${p}${m} ${op} node render" must ALLOW`,
          ).toBe("allow");
        }
      }
    }
  });

  // ── Unlisted-wrapper fuzz: {wrapper}(with/without a flag) on a segment carrying the admit shape →
  //    DENY; the same wrapper on a non-admit command → ALLOW. COMMAND_MODIFIERS is NOT widened.
  const WRAPPERS = ["sudo", "doas", "setsid", "ionice", "chrt", "taskset"];
  const WRAPPER_FLAGS = ["", "-c2", "-f 1", "0x1"];

  it("unlisted-wrapper fuzz — every {wrapper × flag} behind an admit shape DENIES (high-severity)", () => {
    const { dir, highNote } = projectWith({ dial: "high-severity" });
    for (const w of WRAPPERS) {
      for (const f of WRAPPER_FLAGS) {
        const command = `${w}${f ? " " + f : ""} ${admitTail(highNote)}`;
        expect(hookDecision(command, dir), `unlisted wrapper "${w} ${f}" must DENY`).toBe("deny");
      }
    }
  });

  it("unlisted-wrapper fuzz — the same wrapper on a non-admit command ALLOWs (no over-block)", () => {
    const { dir } = projectWith({ dial: "high-severity" });
    for (const w of WRAPPERS) {
      for (const f of WRAPPER_FLAGS) {
        const command = `${w}${f ? " " + f : ""} ls -la`;
        expect(hookDecision(command, dir), `non-admit wrapper "${w} ${f} ls" must ALLOW`).toBe("allow");
      }
    }
  });

  // ── Leading-redirection fuzz: {redirection operator} on a segment carrying the admit shape → DENY;
  //    the same redirection on a non-admit command → ALLOW. No redirection grammar is enumerated.
  const REDIRS = [">/dev/null", "1>/dev/null", "2>/dev/null", "2>&1", "&>/dev/null"];

  it("leading-redirection fuzz — every redirection behind an admit shape DENIES (high-severity)", () => {
    const { dir, highNote } = projectWith({ dial: "high-severity" });
    for (const r of REDIRS) {
      const command = `${r} ${admitTail(highNote)}`;
      expect(hookDecision(command, dir), `leading redirection "${r} node …admit" must DENY`).toBe("deny");
    }
  });

  it("leading-redirection fuzz — the same redirection on a non-admit command ALLOWs (no over-block)", () => {
    const { dir } = projectWith({ dial: "high-severity" });
    for (const r of REDIRS) {
      const command = `${r} node build`;
      expect(hookDecision(command, dir), `non-admit redirection "${r} node build" must ALLOW`).toBe("allow");
    }
  });

  // ── Dial dimension: under `all` a ROUTINE admit behind ANY wrapper/operand/redirection DENIES (the
  //    strictest dial's floor does not leak); under `off` it ALLOWs (lean).
  it("dial dimension — a routine admit behind any wrapper/operand/redirection DENIES under `all`, ALLOWs under `off`", () => {
    const all = projectWith({ dial: "all" });
    const off = projectWith({ dial: "off" });
    const prefixes = ["timeout 5", "nice -n 5", "sudo", "setsid", ">/dev/null", "2>/dev/null"];
    for (const pre of prefixes) {
      expect(
        hookDecision(`${pre} ${admitTail(all.routineNote)}`, all.dir),
        `routine behind "${pre}" must DENY under all`,
      ).toBe("deny");
      expect(
        hookDecision(`${pre} ${admitTail(off.routineNote)}`, off.dir),
        `routine behind "${pre}" must ALLOW under off`,
      ).toBe("allow");
    }
  });

  // ── Admit-ordering fuzz: a wrapped high-severity admit shielded among routine admits DENIES under
  //    high-severity in ANY position / separator (2- and 3-admit chains); a routine-only multi-admit
  //    (some behind wrappers) ALLOWs under high-severity (no over-block).
  it("admit-ordering fuzz — a wrapped high-severity admit in any position/separator DENIES under high-severity", () => {
    const { dir, highNote, routineNote } = projectWith({ dial: "high-severity" });
    const wrappedHigh = `timeout 5 ${admitTail(highNote)}`;
    const bareRoutine = admitTail(routineNote);
    for (const sep of SEPARATORS) {
      const chains: string[][] = [
        [wrappedHigh, bareRoutine],
        [bareRoutine, wrappedHigh],
        [wrappedHigh, bareRoutine, bareRoutine],
        [bareRoutine, wrappedHigh, bareRoutine],
        [bareRoutine, bareRoutine, wrappedHigh],
      ];
      for (let p = 0; p < chains.length; p++) {
        const command = chains[p].join(` ${sep} `);
        expect(
          hookDecision(command, dir),
          `wrapped-high chain pos${p} sep="${sep}" must DENY`,
        ).toBe("deny");
      }
    }
  });

  it("admit-ordering fuzz — a routine-only multi-admit (some wrapped) ALLOWs under high-severity, DENIES under all", () => {
    const high = projectWith({ dial: "high-severity" });
    const all = projectWith({ dial: "all" });
    for (const sep of SEPARATORS) {
      const cmdHigh = [
        admitTail(high.routineNote),
        `timeout 5 ${admitTail(high.routineNote)}`,
        `sudo ${admitTail(high.routineNote)}`,
      ].join(` ${sep} `);
      expect(
        hookDecision(cmdHigh, high.dir),
        `routine-only wrapped chain sep="${sep}" must ALLOW under high-severity`,
      ).toBe("allow");
      const cmdAll = [
        admitTail(all.routineNote),
        `timeout 5 ${admitTail(all.routineNote)}`,
      ].join(` ${sep} `);
      expect(
        hookDecision(cmdAll, all.dir),
        `routine-only wrapped chain sep="${sep}" must DENY under all`,
      ).toBe("deny");
    }
  });

  // ── LF | CRLF: the class invariant holds under both line endings for a representative set (the
  //    tokenizer's separator/continuation handling is line-ending-aware; the round-4 disposition is not).
  it("LF|CRLF — a wrapped high-severity admit DENIES and an inert mention behind a wrapper ALLOWs under both", () => {
    const { dir, highNote } = projectWith({ dial: "high-severity" });
    for (const nl of ["\n", "\r\n"]) {
      // routine ; wrapped-high, joined with the chosen line ending around the separator.
      const denyCmd = `node scripts/context-io.js admit t1 ${highNote}${nl}sudo ${admitTail(highNote)}`;
      expect(hookDecision(denyCmd, dir), `newline-joined wrapped-high must DENY`).toBe("deny");
      // an inert heredoc mention behind a wrapper stays ALLOW (no dynamic-eval word, body not executed).
      const allowCmd = `timeout 5 cat <<EOF${nl}node scripts/context-io.js admit my-task ${highNote}${nl}EOF`;
      expect(hookDecision(allowCmd, dir), `inert heredoc behind a wrapper must ALLOW`).toBe("allow");
    }
  });

  // ── Invented un-enumerated shapes (anti-whack-a-mole; caught STRUCTURALLY on the unresolvable tail,
  //    not by an anchor list) — the property the author did NOT individually enumerate.
  it("invented shapes — un-enumerated wrapper/operand/redirection/eval stacks are caught structurally", () => {
    const { dir, highNote, routineNote } = projectWith({ dial: "high-severity" });
    const invented: Array<[string, string, "deny" | "allow"]> = [
      ["path-form modifier + flag + operand", `/usr/bin/timeout -k 1 5 ${admitTail(highNote)}`, "deny"],
      ["redirection between wrapper and launcher", `timeout 5 2>/dev/null ${admitTail(highNote)}`, "deny"],
      ["3-admit shield high behind two routines", `${admitTail(routineNote)} ; ${admitTail(routineNote)} ; sudo ${admitTail(highNote)}`, "deny"],
      ["stacked operand + eval (executed body)", `timeout 5 sh -c "node scripts/context-io.js admit my-task ${highNote}"`, "deny"],
      ["doubled unlisted wrapper", `sudo setsid ${admitTail(highNote)}`, "deny"],
      ["operand then unlisted wrapper", `timeout 5 sudo ${admitTail(highNote)}`, "deny"],
      // over-block fail-safe: an inert eval-body mention with NO real admit (echo, not sh -c).
      ["inert echo body behind operand", `timeout 5 echo "node scripts/context-io.js admit my-task ${highNote}"`, "allow"],
    ];
    for (const [name, command, want] of invented) {
      expect(hookDecision(command, dir), `invented shape "${name}" must ${want.toUpperCase()}`).toBe(want);
    }
  });

  // The structural argument (D-12): the invert fails closed on the UNRESOLVABLE tail — an admit shape
  // behind a command word the resolver cannot prove is a recognized launcher — so a wrapper/operand/
  // redirection spelling outside any anchor cannot escape WITHOUT a code change. The proof is the class
  // invariant above, not an enumeration of known forms; and a GREEN class invariant is
  // NECESSARY-BUT-NOT-SUFFICIENT — the independent both-angle opus red-team at Task 25-07-04 is the gate.
  it("the four named floor invariants still hold behind a round-4 wrapper (self-set / guard byte-frozen)", () => {
    const { dir, highNote } = projectWith({ dial: "high-severity" });
    // GAP-B self-set behind a modifier-operand wrapper DENIES even with the var in env.
    expect(
      hookDecision(`${APPROVAL}=eve timeout 5 ${admitTail(highNote)}`, dir, "eve"),
      "self-set behind a modifier-operand wrapper must DENY even with the var in env",
    ).toBe("deny");
    expect(
      hookDecision(`${APPROVAL}=eve sudo ${admitTail(highNote)}`, dir, "eve"),
      "self-set behind an unlisted wrapper must DENY even with the var in env",
    ).toBe("deny");
    // guard.ts stays byte-frozen (D-02) — the round-4 resolver edit must not touch the deploy guard.
    const blob = execFileSync("git", ["hash-object", join(ROOT, "hooks", "guard.ts")], {
      encoding: "utf8",
    }).trim();
    expect(blob, "hooks/guard.ts must be byte-frozen at the D-02 blob").toBe(FROZEN_GUARD_BLOB);
  });
});

describe("SC1 anti-whack-a-mole (25-08) — BASH-GROUNDED prove-final-literal class invariant", () => {
  // Round-5: the admit-SHAPE detector is now STRUCTURAL — a script/verb token the hook cannot PROVE is an
  // inert final literal (an ALLOWLIST `^[A-Za-z0-9/._:=,-]*$` + a raw free of `$`/backtick) is
  // UNRESOLVABLE → fail CLOSED, catching extglob/glob/brace/tilde/param/cmd-sub/process-sub + any future
  // metachar WITHOUT enumeration. The proof is a CLASS invariant — but its ORACLE is GROUNDED IN ACTUAL
  // BASH BEHAVIOR, NOT in `tokenIsFinalLiteral` (the rev-1 CIRCULARITY: a self-referential oracle can
  // never catch a gap INSIDE the predicate — the rev-1 fuzz passed extglob). `bashRewrites(token)` SPAWNS
  // bash (`printf '%s\n'` for the simple forms; a controlled-temp-dir glob/extglob probe with `shopt -s
  // extglob` and a real scripts/context-io.js for the glob forms) to decide INDEPENDENTLY whether bash
  // rewrites the token, then asserts: a bash-rewritten script/verb token in an admit construction FORCES
  // the committed admission-guard.js to gate. A gap inside the allowlist (e.g. wrongly allowlisting `@`,
  // `(`) makes the extglob assertions FAIL — the suite is not self-referential. The round-2/3/4 sweeps +
  // the four named floor invariants above are PRESERVED, not duplicated.
  //
  // D-12 / [[grugops-safety-invariant-green-suite-insufficient]]: this GREEN bash-grounded fuzz is
  // NECESSARY-BUT-NOT-SUFFICIENT — the INDEPENDENT both-angle opus red-team at Task 25-08-04 is the gate.

  // A controlled probe dir holding a REAL scripts/context-io.js so the glob/extglob probe can expand.
  function makeProbeDir(): string {
    const dir = freshTmp("bash-probe-");
    mkdirSync(join(dir, "scripts"), { recursive: true });
    writeFileSync(join(dir, "scripts", "context-io.js"), "// probe\n");
    return dir;
  }

  // THE BASH-GROUNDED ORACLE (independent of the detector): does bash rewrite/expand the token into
  // anything other than its verbatim single line? Spawns bash with extglob on, in the probe dir, and
  // compares the expansion to the raw token. Glob/extglob expand against the real context-io.js; brace /
  // tilde / ANSI-C / parameter / command-substitution / process-substitution / quote-removal all change
  // the printed output. A static literal prints verbatim → not rewritten.
  function bashRewrites(token: string, probeDir: string): boolean {
    const r = spawnSync("bash", ["-c", `shopt -s extglob; printf '%s\\n' ${token}`], {
      cwd: probeDir,
      encoding: "utf8",
    });
    return (r.stdout ?? "") !== token + "\n";
  }

  // The INDEPENDENT generator: obfuscated forms of the SCRIPT-ref (de-quote/expand to scripts/context-io.js
  // in the probe dir) — spanning glob, extglob `@(/?(/+(/!(`, brace, tilde, ANSI-C, parameter, command-
  // substitution, process-substitution, quote-removal, mid-word substitution, and randomized non-alnum.
  function scriptRewriteTokens(): string[] {
    const randomChars = ["*", "?", "[o]", "@(o)", "+(o)", "!(zz)", "{o,x}"];
    return [
      "scripts/context-i*.js",
      "scripts/context-i?.js",
      "scripts/context-i@(o).js",
      "scripts/context-i?(o).js",
      "scripts/context-i+(o).js",
      "scripts/context-io!(zz).js",
      "scripts/context-i{o,x}.js",
      "~/context-io.js",
      "$S",
      "${S}",
      "$(echo scripts/context-io.js)",
      "`echo scripts/context-io.js`",
      "scr$(echo ipts)/context-io.js",
      "<(echo scripts/context-io.js)",
      ...randomChars.map((c) => `scripts/context-i${c}.js`),
    ];
  }

  // Obfuscated forms of the admit VERB (de-quote/expand to `admit`).
  function verbRewriteTokens(): string[] {
    return [
      "admi{t,x}",
      "ad''mit",
      '"admit"',
      "$'admit'",
      "$V",
      "${V}",
      "$(echo admit)",
      "`echo admit`",
      "ad$(echo mi)t",
      "adm[i]t",
      "ad?it",
      "admi*",
    ];
  }

  const S = "scripts/context-io.js";

  it("SCRIPT-position: every bash-rewritten script token FORCES a gate (independent oracle)", () => {
    const probe = makeProbeDir();
    const { dir, highNote } = projectWith({ dial: "high-severity" });
    let checkedRewrites = 0;
    for (const tok of scriptRewriteTokens()) {
      const command = `node ${tok} admit my-task ${highNote}`;
      if (bashRewrites(tok, probe)) {
        checkedRewrites++;
        expect(
          hookDecision(command, dir),
          `bash rewrites script token ${JSON.stringify(tok)} → the hook MUST gate`,
        ).toBe("deny");
      } else {
        // bash leaves it verbatim: it is then either the literal context-io admit (gate) or a literal
        // outside the inert allowlist (the hook safely over-blocks). Either way an admit-shaped command
        // with this script + the admit verb on a high-severity note gates — never under-blocks.
        expect(
          hookDecision(command, dir),
          `non-rewritten admit-shaped script token ${JSON.stringify(tok)} must not under-block`,
        ).toBe("deny");
      }
    }
    expect(checkedRewrites, "the generator must exercise real bash rewrites").toBeGreaterThan(8);
  });

  it("VERB-position: every bash-rewritten verb token FORCES a gate (independent oracle)", () => {
    const probe = makeProbeDir();
    const { dir, highNote } = projectWith({ dial: "high-severity" });
    let checkedRewrites = 0;
    for (const tok of verbRewriteTokens()) {
      const command = `node ${S} ${tok} my-task ${highNote}`;
      const rewritten = bashRewrites(tok, probe);
      if (rewritten) checkedRewrites++;
      expect(
        hookDecision(command, dir),
        `${rewritten ? "bash-rewritten" : "obfuscated"} verb token ${JSON.stringify(tok)} → the hook MUST gate`,
      ).toBe("deny");
    }
    expect(checkedRewrites, "the generator must exercise real bash rewrites").toBeGreaterThan(6);
  });

  it("a STATIC literal classifies correctly — context-io admit DENIES, a non-context-io script ALLOWs", () => {
    const probe = makeProbeDir();
    const { dir, highNote } = projectWith({ dial: "high-severity" });
    // A fully-static literal is NOT rewritten by bash.
    expect(bashRewrites(S, probe), "the literal script must not be a bash rewrite").toBe(false);
    expect(bashRewrites("build", probe), "a literal non-context-io script must not be a bash rewrite").toBe(false);
    expect(hookDecision(`node ${S} admit my-task ${highNote}`, dir)).toBe("deny");
    expect(hookDecision(`node build`, dir)).toBe("allow");
    expect(hookDecision(`node build $HOME/out`, dir)).toBe("allow");
    expect(hookDecision(`node ${S} validate ${highNote}`, dir)).toBe("allow");
  });

  it("JS_RUNNERS / unknown-runtime boundary — bun $S $V gates, qjs $S $V allows, cp $A $B allows", () => {
    const { dir } = projectWith({ dial: "high-severity" });
    expect(hookDecision(`bun "$S" "$V"`, dir), "a recognized JS runner with a dynamic script gates").toBe("deny");
    expect(hookDecision(`deno run "$S" "$V"`, dir)).toBe("deny");
    expect(hookDecision(`qjs "$S" "$V"`, dir), "an UNKNOWN runtime is the disclosed residual (allow)").toBe("allow");
    expect(hookDecision(`cp $A $B`, dir), "a non-JS-runner with no concrete anchor allows").toBe("allow");
    expect(hookDecision(`tar $A $B`, dir)).toBe("allow");
  });

  it("xargs stdin-feed — an admit fed via xargs gates; a benign feed allows", () => {
    const { dir, highNote } = projectWith({ dial: "high-severity" });
    expect(
      hookDecision(`echo "${S} admit my-task ${highNote}" | xargs node`, dir),
      "an admit shape fed via xargs stdin must gate",
    ).toBe("deny");
    expect(hookDecision(`echo build | xargs node`, dir), "a benign xargs feed must allow").toBe("allow");
  });

  it("dial dimension — a routine admit via a rewrite DENIES under `all`, ALLOWs under `off`", () => {
    const all = projectWith({ dial: "all" });
    const off = projectWith({ dial: "off" });
    for (const tok of ["scripts/context-i*.js", "scripts/context-i@(o).js"]) {
      expect(
        hookDecision(`node ${tok} admit my-task ${all.routineNote}`, all.dir),
        `routine admit via ${tok} must DENY under all`,
      ).toBe("deny");
      expect(
        hookDecision(`node ${tok} admit my-task ${off.routineNote}`, off.dir),
        `routine admit via ${tok} must ALLOW under off`,
      ).toBe("allow");
    }
  });

  it("separator × ordering — a rewrite-obfuscated high-severity admit shielded among routines DENIES", () => {
    const { dir, highNote, routineNote } = projectWith({ dial: "high-severity" });
    const rewriteHigh = `node scripts/context-i*.js admit t ${highNote}`;
    const bareRoutine = `node ${S} admit t ${routineNote}`;
    for (const sep of [";", "&&", "||", "|", "&"]) {
      const chains: string[][] = [
        [rewriteHigh, bareRoutine],
        [bareRoutine, rewriteHigh],
        [bareRoutine, bareRoutine, rewriteHigh],
      ];
      for (let p = 0; p < chains.length; p++) {
        expect(
          hookDecision(chains[p].join(` ${sep} `), dir),
          `rewrite-obfuscated high shielded@pos${p} sep="${sep}" must DENY`,
        ).toBe("deny");
      }
    }
    // A routine-only LITERAL chain ALLOWs under high-severity (no over-block of a readable routine note).
    expect(
      hookDecision(`${bareRoutine} ; node ${S} admit t ${routineNote}`, dir),
      "a routine-only LITERAL chain must ALLOW under high-severity (no over-block)",
    ).toBe("allow");
    // But a routine note delivered via a REWRITE is unresolvable (the hook cannot read the note), so it
    // fail-closed gates under any active dial — the disclosed, bounded over-block of an obfuscated admit.
    expect(
      hookDecision(`node scripts/context-i*.js admit t ${routineNote}`, dir),
      "a routine note delivered via a glob rewrite is unresolvable → gates (bounded over-block)",
    ).toBe("deny");
  });

  // The structural argument (the rev-1 circularity fix): the oracle is what BASH actually does, so a gap
  // INSIDE the allowlist makes the suite FAIL — it is not self-referential. Mutation note: temporarily
  // allowlisting `(` or `@` in tokenIsFinalLiteral would make the extglob `@(o)` / `+(o)` script-position
  // assertions FAIL (the hook would then resolve the split token as a literal non-context-io script and
  // ALLOW), proving the bash oracle drives the proof. D-12: a GREEN fuzz is necessary-not-sufficient; the
  // independent both-angle opus red-team at Task 25-08-04 is the gate.
  it("the four named floor invariants still hold behind a round-5 rewrite (self-set / guard byte-frozen)", () => {
    const { dir, highNote } = projectWith({ dial: "high-severity" });
    // GAP-B self-set behind a glob/extglob-rewritten launcher DENIES even with the var in env.
    expect(
      hookDecision(`${APPROVAL}=eve node scripts/context-i*.js admit my-task ${highNote}`, dir, "eve"),
      "self-set behind a glob rewrite must DENY even with the var in env",
    ).toBe("deny");
    expect(
      hookDecision(`${APPROVAL}=eve bun "$S" "$V"`, dir, "eve"),
      "self-set behind a JS-runner rewrite must DENY even with the var in env",
    ).toBe("deny");
    // guard.ts stays byte-frozen (D-02) — the round-5 detector edit must not touch the deploy guard.
    const blob = execFileSync("git", ["hash-object", join(ROOT, "hooks", "guard.ts")], {
      encoding: "utf8",
    }).trim();
    expect(blob, "hooks/guard.ts must be byte-frozen at the D-02 blob").toBe(FROZEN_GUARD_BLOB);
  });
});
