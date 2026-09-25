// admission-guard.test.ts — GOV-01 per-call structured-channel deny/allow oracle (D-01, round 6).
//
// This is the HIGH-severity deny/allow oracle for the retargeted grugops admission guard. It mirrors
// hooks/guard.test.ts: every case spawns the COMMITTED compiled admission-guard.js (never the .ts) as a
// child process, pipes a STRUCTURED PreToolUse stdin JSON ({tool_name, tool_input:{by,kind,verified_by,
// task,...}}), and asserts on the emitted deny JSON. A prompt cannot override a PreToolUse hook deny, so
// this harness proves the mechanism actually blocks rather than trusting prose.
//
// The gate moved to the structured channel (Plan 25-09/25-10, D-01): the hook reads the FINAL structured
// tool_input the harness delivers for an mcp__grugops__* admission tool call — there is NO agent-authored
// shell command string to obfuscate, so the entire ten-round shell-expansion bypass family is gone by
// construction. The whole command-string parser is DELETED; these fixtures are structured note fields,
// not shell commands.
//
// Both directions are reproduced RED vs the committed .js (D-12, [[grugops-safety-invariant-green-suite-
// insufficient]]): the planted high-severity-without-env structured admit flipped from ALLOW on the
// pre-retarget Bash-matcher .js (the matcher never saw the MCP call; recorded in 25-10-RED-baseline.txt)
// to DENY on the retargeted .js (25-10-GREEN-proof.txt), and the positive per-call case (env=alice +
// verified_by=human:alice -> ALLOW) plus the mismatch (env=alice + human:bob -> DENY) hold on GREEN.
//
// PER D-12: a GREEN suite is NECESSARY BUT NOT SUFFICIENT. The INDEPENDENT opus-grade red-team
// (Task 25-11-03) is the closure gate, not this suite.
//
// Match shapes (identical to guard.test.ts):
//   deny  => stdout contains `"permissionDecision":"deny"`
//   allow => stdout does NOT contain `"deny"`
//
// Vitest globals:false (repo default) -> import explicitly.

import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { copyFileSync, mkdtempSync, writeFileSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { skipLine, stageShapeOrSkip } from "../scripts/check-platform-shapes.js";
import { closureTargets } from "../scripts/js-import-closure.js";

// The COMMITTED checkpoints artifact — the same module the spawned hook imports its grant name from.
const cp: typeof import("../scripts/checkpoints.js") = await import(
  pathToFileURL(join(import.meta.dirname, "..", "scripts", "checkpoints.js")).href
);

const APPROVAL = "GRUGOPS_ADMISSION_APPROVED_BY";

// Targets the COMMITTED admission-guard.js (the artifact the host hook runs), never the .ts.
const GUARD_JS = join(import.meta.dirname, "admission-guard.js");

/**
 * What one DIRECT decider run actually did (33.1-01, WR-04, WINDOWS.md row 306): exit status, the
 * terminating signal (a `spawnSync` timeout kills with SIGTERM and reports it here), stdout, stderr and
 * the bytes on fd 3 — the private allow channel `hooks/hook-entry.ts` opens, opened here as a pipe too.
 * Restated from `hooks/guard.test.ts` rather than imported: a test file that imports another registers
 * that file's cases twice.
 */
interface SyncRun {
  readonly status: number | null;
  readonly signal: NodeJS.Signals | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly fd3: string;
}
function spawnDecider(artifact: string, input: string, env: NodeJS.ProcessEnv): SyncRun {
  const r = spawnSync("node", [artifact], {
    timeout: 20_000, // a hang must redden this case, not stop the suite (round 2, RA1-2)
    input,
    encoding: "utf8",
    env,
    stdio: ["pipe", "pipe", "pipe", "pipe"],
  });
  return { status: r.status, signal: r.signal, stdout: r.stdout ?? "", stderr: r.stderr ?? "", fd3: String(r.output?.[3] ?? "") };
}

function runGuard(payload: string, env: Record<string, string> = {}): SyncRun {
  // Build a clean env: never inherit a stray GRUGOPS_ADMISSION_APPROVED_BY from the caller's shell, or
  // the deny cases would silently pass for the wrong reason. Strip it, then apply per-case overrides.
  const baseEnv: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (k === APPROVAL) continue;
    if (v !== undefined) baseEnv[k] = v;
  }
  return spawnDecider(GUARD_JS, payload, { ...baseEnv, ...env });
}

function expectDeny(payload: string, env: Record<string, string> = {}): void {
  const { stdout } = runGuard(payload, env);
  expect(stdout).toContain('"permissionDecision":"deny"');
}

/** The decider's allow token — the literal the admission guard writes on fd 3 and the wrapper compares. */
const ALLOW_TOKEN = "grugops-hook-allow";

/**
 * THE ONE ALLOW PROOF (WR-04), restated from `hooks/guard.test.ts`. It holds the wrapper's own bar
 * (`hooks/hook-entry.ts`): a signal is not an allow, a non-zero exit is not an allow, and an empty stdout
 * is an allow only when the decider ASSERTED it on fd 3. The retired helper checked stdout alone, so a
 * crash or a timeout — both silent — read as an allow.
 */
function expectAllowed(r: SyncRun, label = ""): void {
  expect(r.signal, `${label}: a run terminated by a signal is not an allow`).toBeNull();
  expect(r.status, `${label}: a non-zero exit is not an allow`).toBe(0);
  expect(r.stdout, `${label}: an allow writes nothing on stdout`).toBe("");
  expect(r.fd3.trim(), `${label}: a direct decider run must ASSERT its allow on fd 3`).toBe(ALLOW_TOKEN);
}

// Build a STRUCTURED PreToolUse payload for a grugops admission tool call. The note's provenance fields
// ARE the tool's structured arguments — no shell string anywhere.
function payload(
  fields: { by?: string; kind?: string; verified_by?: string; task?: string },
  toolName = "mcp__grugops__propose_note",
): string {
  const tool_input: Record<string, unknown> = {
    task: fields.task ?? "my-task",
    body: "the login endpoint rejects an expired token with a 401",
  };
  if (fields.kind !== undefined) tool_input.kind = fields.kind;
  if (fields.by !== undefined) tool_input.by = fields.by;
  if (fields.verified_by !== undefined) tool_input.verified_by = fields.verified_by;
  return JSON.stringify({ tool_name: toolName, tool_input });
}

// A project dir holding a factory.config.json with a chosen human_admission value (or a corrupt config,
// or none). The hook reads the dial from CLAUDE_PROJECT_DIR.
const tmpDirs: string[] = [];
function makeProject(opts: { dial?: string; raw?: string; corrupt?: boolean; absent?: boolean }): string {
  const dir = mkdtempSync(join(tmpdir(), "adm-struct-"));
  tmpDirs.push(dir);
  if (!opts.absent) {
    mkdirSync(join(dir, ".grugops"), { recursive: true });
    const cfg = join(dir, ".grugops", "factory.config.json");
    if (opts.corrupt) writeFileSync(cfg, "{ this is : not json ");
    else if (opts.raw !== undefined) writeFileSync(cfg, `{ "context": { "human_admission": ${opts.raw} } }`);
    else writeFileSync(cfg, JSON.stringify({ context: { human_admission: opts.dial ?? "off" } }));
  }
  return dir;
}

const HIGH = { by: "security-nfr", kind: "finding" };
const ROUTINE = { by: "software-engineer", kind: "finding" };

describe("admission-guard.js (GOV-01 per-call structured gate) — child-spawn deny/allow oracle", () => {
  // ── 1. Planted direction (DENY) — a gated finding without the matching fresh env+stamp ────────────
  it("deny: high-severity finding under high-severity with NO env (fails closed, the planted RED case)", () => {
    expectDeny(payload({ ...HIGH, verified_by: "" }), { CLAUDE_PROJECT_DIR: makeProject({ dial: "high-severity" }) });
  });

  it("deny: the deny reason names the gated authoring role", () => {
    const { stdout } = runGuard(payload({ ...HIGH, verified_by: "" }), {
      CLAUDE_PROJECT_DIR: makeProject({ dial: "high-severity" }),
    });
    expect(stdout).toContain("security-nfr");
  });

  it("deny: env=alice but verified_by=human:bob (stamp/approver MISMATCH)", () => {
    expectDeny(payload({ ...HIGH, verified_by: "human:bob" }), {
      CLAUDE_PROJECT_DIR: makeProject({ dial: "high-severity" }),
      [APPROVAL]: "alice",
    });
  });

  it("deny: env=alice but NO stamp (env present, stamp missing)", () => {
    expectDeny(payload({ ...HIGH, verified_by: "" }), {
      CLAUDE_PROJECT_DIR: makeProject({ dial: "high-severity" }),
      [APPROVAL]: "alice",
    });
  });

  it("deny: a self-authored verified_by=human:eve with NO env (the stamp alone never grants)", () => {
    expectDeny(payload({ ...HIGH, verified_by: "human:eve" }), {
      CLAUDE_PROJECT_DIR: makeProject({ dial: "high-severity" }),
    });
  });

  it("deny: routine finding under `all` with NO env (every finding gated)", () => {
    expectDeny(payload({ ...ROUTINE, verified_by: "" }), { CLAUDE_PROJECT_DIR: makeProject({ dial: "all" }) });
  });

  it("deny: high-severity finding under `all` with NO env", () => {
    expectDeny(payload({ ...HIGH, verified_by: "" }), { CLAUDE_PROJECT_DIR: makeProject({ dial: "all" }) });
  });

  // ── 2. Clean direction (ALLOW) — the per-call positive + the not-gated cases ──────────────────────
  it("allow: high-severity finding with env=alice AND verified_by=human:alice (per-call stamp-binding, the GREEN positive)", () => {
    expectAllowed(runGuard(payload({ ...HIGH, verified_by: "human:alice" }), {
      CLAUDE_PROJECT_DIR: makeProject({ dial: "high-severity" }),
      [APPROVAL]: "alice",
    }));
  });

  it("allow: routine finding (by: software-engineer) under high-severity is not gated", () => {
    expectAllowed(runGuard(payload({ ...ROUTINE, verified_by: "" }), { CLAUDE_PROJECT_DIR: makeProject({ dial: "high-severity" }) }));
  });

  it("allow: routine finding under `all` WITH env=alice AND human:alice", () => {
    expectAllowed(runGuard(payload({ ...ROUTINE, verified_by: "human:alice" }), {
      CLAUDE_PROJECT_DIR: makeProject({ dial: "all" }),
      [APPROVAL]: "alice",
    }));
  });

  it("allow: high-severity finding under `off` (lean default, no human stop)", () => {
    expectAllowed(runGuard(payload({ ...HIGH, verified_by: "" }), { CLAUDE_PROJECT_DIR: makeProject({ dial: "off" }) }));
  });

  it("allow: high-severity finding when config is genuinely absent (defaults to off)", () => {
    expectAllowed(runGuard(payload({ ...HIGH, verified_by: "" }), { CLAUDE_PROJECT_DIR: makeProject({ absent: true }) }));
  });

  it("allow: a soft kind (observation) under `all` with NO env (soft kinds carry no stamp, D-08)", () => {
    expectAllowed(runGuard(payload({ by: "security-nfr", kind: "observation", verified_by: "" }), {
      CLAUDE_PROJECT_DIR: makeProject({ dial: "all" }),
    }));
  });

  // ── 3. SC3 floor carried to the structured channel — every dial value gate-or-stricter ────────────
  for (const dial of ["hihg-severity", "High-Severity", "all ", "", "bogus", "OFF", "1", "true", "zZ9-garbage"]) {
    it(`deny: non-canonical human_admission=${JSON.stringify(dial)} gates a high-severity finding (fail-closed)`, () => {
      expectDeny(payload({ ...HIGH, verified_by: "" }), { CLAUDE_PROJECT_DIR: makeProject({ dial }) });
    });
  }

  it("allow: canonical `off` still allows a high-severity finding (the only off-equivalent value)", () => {
    expectAllowed(runGuard(payload({ ...HIGH, verified_by: "" }), { CLAUDE_PROJECT_DIR: makeProject({ dial: "off" }) }));
  });

  for (const raw of ["true", "1", "null", '["all"]', "{}"]) {
    it(`deny: present non-string human_admission=${raw} gates a high-severity finding (gate-or-stricter)`, () => {
      expectDeny(payload({ ...HIGH, verified_by: "" }), { CLAUDE_PROJECT_DIR: makeProject({ raw }) });
    });
  }

  it("deny: a present-but-unreadable (corrupt) config DENIES a high-severity finding (fail-closed)", () => {
    expectDeny(payload({ ...HIGH, verified_by: "" }), { CLAUDE_PROJECT_DIR: makeProject({ corrupt: true }) });
  });

  it("allow: a genuinely ABSENT config allows a routine finding (zero-config lean preserved, SC2)", () => {
    expectAllowed(runGuard(payload({ ...ROUTINE, verified_by: "" }), { CLAUDE_PROJECT_DIR: makeProject({ absent: true }) }));
  });

  // ── 4. W1 NON-VACUOUS adversarial sweep — exact near-miss code points classify high-severity ──────
  // Each constructs the EXACT code point so a bare .trim().toLowerCase() classifier would let it through
  // (allowing the admit un-gated); the imported isHighSeverityRole folds it to high-severity, so each
  // DENIES without env+matching-stamp. The fixtures build the literal U+00A0 / U+200B / NFKC-
  // compatibility / case variants — they cannot pass vacuously.
  const NBSP = " "; // U+00A0 no-break space
  const ZWSP = "​"; // U+200B zero-width space
  const FULLWIDTH = "ｓｅｃｕｒｉｔｙ-ｎｆｒ"; // NFKC-compatibility full-width "security-nfr"
  const W1_VARIANTS: Array<[string, string]> = [
    ["trailing U+00A0 nbsp", `security-nfr${NBSP}`],
    ["leading U+00A0 nbsp", `${NBSP}security-nfr`],
    ["embedded U+200B zero-width", `security-${ZWSP}nfr`],
    ["NFKC full-width compatibility", FULLWIDTH],
    ["case variant SECURITY-NFR", "SECURITY-NFR"],
    ["case+space Architect-Design ", "Architect-Design "],
    ["case Release-Manager", "Release-Manager"],
  ];
  for (const [label, by] of W1_VARIANTS) {
    it(`deny (W1 non-vacuous): high-severity by=${label} classifies high-severity and DENIES without env`, () => {
      expectDeny(payload({ by, kind: "finding", verified_by: "" }), {
        CLAUDE_PROJECT_DIR: makeProject({ dial: "high-severity" }),
      });
    });
  }

  // Sanity: a genuinely routine role under high-severity is NOT over-classified (the W1 sweep is not
  // gating everything — it specifically folds the high-severity literals).
  it("allow (W1 control): a routine role with a trailing nbsp under high-severity is NOT gated", () => {
    expectAllowed(runGuard(payload({ by: `software-engineer${NBSP}`, kind: "finding", verified_by: "" }), {
      CLAUDE_PROJECT_DIR: makeProject({ dial: "high-severity" }),
    }));
  });

  // ── 5. Fail-closed on missing/wrong/malformed structured args ─────────────────────────────────────
  it("deny: malformed tool_input (absent) fails closed", () => {
    expectDeny(JSON.stringify({ tool_name: "mcp__grugops__propose_note" }), {
      CLAUDE_PROJECT_DIR: makeProject({ dial: "high-severity" }),
    });
  });

  it("deny: unparsable stdin fails closed", () => {
    expectDeny("not json at all", { CLAUDE_PROJECT_DIR: makeProject({ dial: "high-severity" }) });
  });

  it("deny: a finding with NO `by` under high-severity fails closed (unclassifiable severity)", () => {
    expectDeny(payload({ kind: "finding", verified_by: "" }), {
      CLAUDE_PROJECT_DIR: makeProject({ dial: "high-severity" }),
    });
  });

  it("deny: a finding with NO `by` under `all` fails closed", () => {
    expectDeny(payload({ kind: "finding", verified_by: "" }), { CLAUDE_PROJECT_DIR: makeProject({ dial: "all" }) });
  });

  it("deny: a note with NO `kind` under `all` fails closed (unclassifiable)", () => {
    expectDeny(payload({ by: "security-nfr", verified_by: "" }), { CLAUDE_PROJECT_DIR: makeProject({ dial: "all" }) });
  });

  it("allow: a note with NO `kind` under `off` is lean (nothing to gate)", () => {
    expectAllowed(runGuard(payload({ by: "security-nfr", verified_by: "" }), { CLAUDE_PROJECT_DIR: makeProject({ dial: "off" }) }));
  });

  it("deny: malformed payload does not crash (exit 0, deny JSON, no error)", () => {
    const r = runGuard("not json at all", { CLAUDE_PROJECT_DIR: makeProject({ dial: "high-severity" }) });
    expect(r.status).toBe(0);
    expect(r.stderr.toLowerCase()).not.toContain("error");
  });

  // ── 6. W3 matcher breadth — a second/renamed grugops admission tool is still gated by the hook ─────
  // The hooks.json matcher is the grugops admission FAMILY in BOTH spellings — the bare server name
  // `mcp__grugops__.*` and the platform's scoped name for the plugin's bundled server
  // `mcp__plugin_grugops_grugops__.*` (plan 33-28 K8; asserted in floor-invariance.test.ts K7) — and the
  // hook itself keys on the note fields, not the exact tool name — so a renamed admission tool delivering
  // the same structured fields is gated identically under either spelling.
  for (const toolName of [
    "mcp__grugops__admit",
    "mcp__grugops__propose_finding",
    "mcp__grugops__v2_admit",
    "mcp__plugin_grugops_grugops__propose_note",
    "mcp__plugin_grugops_grugops__admit",
    "mcp__plugin_grugops_grugops__v2_admit",
  ]) {
    it(`deny (W3): renamed admission tool ${toolName} with a high-severity finding and no env DENIES`, () => {
      expectDeny(payload({ ...HIGH, verified_by: "" }, toolName), {
        CLAUDE_PROJECT_DIR: makeProject({ dial: "high-severity" }),
      });
    });
    it(`allow (W3): renamed admission tool ${toolName} with env=alice + human:alice ALLOWS`, () => {
      expectAllowed(runGuard(payload({ ...HIGH, verified_by: "human:alice" }, toolName), {
        CLAUDE_PROJECT_DIR: makeProject({ dial: "high-severity" }),
        [APPROVAL]: "alice",
      }));
    });
  }

  // ── 6b. GAP-R7-1 Lever-1 (round-8): whitespace-padded kind gates as the canonical finding ─────────
  // Held-out RED→GREEN vs the COMMITTED admission-guard.js. Pre-fix the hook raw-compared
  // `kind !== "finding"`, so a padded `kind:"finding "` read as a SOFT (non-finding) kind and the hook
  // ALLOWed a high-severity finding with NO env (recorded ALLOW in 25-13-RED-baseline.txt). Post-fix the
  // hook consults the single-source normalizeKind, so every in-enum whitespace variant normalizes to
  // "finding" and DENIES — EXACTLY as the canonical form does. This asserts the STRUCTURAL property (any
  // whitespace-padded form of the finding kind gates identically), NOT a fixed denylist of spellings.
  const KIND_PAD_VARIANTS: Array<[string, string]> = [
    ["trailing space", "finding "],
    ["leading space", " finding"],
    ["leading tab", "\tfinding"],
    ["trailing tab", "finding\t"],
    ["surrounding spaces", "  finding  "],
    ["trailing newline", "finding\n"],
  ];
  for (const [label, kind] of KIND_PAD_VARIANTS) {
    it(`deny (GAP-R7-1 Lever-1): high-severity finding with padded kind (${label}) gates as finding and DENIES without env`, () => {
      expectDeny(payload({ by: "security-nfr", kind, verified_by: "§14-gate#x" }), {
        CLAUDE_PROJECT_DIR: makeProject({ dial: "high-severity" }),
      });
    });
  }

  // Lever-1 control: an internal-space high-severity `by` with the EXACT kind:"finding" DENIES on its own
  // (independent of Lever-1) — this is what makes Lever-2 (admit()'s former weaker `by` classifier) the
  // necessary second lever for the end-to-end bypass, not the hook tier.
  it("deny (GAP-R7-1 Lever-1 control): internal-space by=security- nfr + exact kind:finding DENIES (isGatedNote folds by)", () => {
    expectDeny(payload({ by: "security- nfr", kind: "finding", verified_by: "§14-gate#x" }), {
      CLAUDE_PROJECT_DIR: makeProject({ dial: "high-severity" }),
    });
  });

  // No over-block: a padded SOFT kind stays not-gated (the normalization does not over-gate soft kinds).
  it("allow (GAP-R7-1 Lever-1 control): a padded soft kind (observation ) under `all` is NOT gated", () => {
    expectAllowed(runGuard(payload({ by: "security-nfr", kind: "observation ", verified_by: "" }), {
      CLAUDE_PROJECT_DIR: makeProject({ dial: "all" }),
    }));
  });

  // No over-block: a padded routine finding under high-severity stays not-gated (kind normalizes to a
  // finding, but the routine `by` keeps it non-high-severity → ALLOW).
  it("allow (GAP-R7-1 Lever-1 control): a padded routine finding under high-severity is NOT gated", () => {
    expectAllowed(runGuard(payload({ by: "software-engineer", kind: "finding ", verified_by: "§14-gate#x" }), {
      CLAUDE_PROJECT_DIR: makeProject({ dial: "high-severity" }),
    }));
  });

  // The combined-lever GREEN positive at the hook tier: a padded kind + a real human env+stamp ALLOWS
  // (the normalization gates it, then the per-call env+stamp authorizes it).
  it("allow (GAP-R7-1 Lever-1 positive): padded kind + env=alice + human:alice ALLOWS", () => {
    expectAllowed(runGuard(payload({ by: "security-nfr", kind: "finding ", verified_by: "human:alice" }), {
      CLAUDE_PROJECT_DIR: makeProject({ dial: "high-severity" }),
      [APPROVAL]: "alice",
    }));
  });

  // ── 7. Cleanup ────────────────────────────────────────────────────────────────────────────────────
  it("cleanup temp dirs", () => {
    for (const d of tmpDirs) {
      try {
        rmSync(d, { recursive: true, force: true });
      } catch {
        /* best effort */
      }
    }
    expect(true).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 30-11 — RED-TEAM SURFACE A, ROUND 1. Reproduced first against the committed artifact.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("30-11 A-4 — an approver that names nobody is not an approver", () => {
  // THE BYPASS, IN ONE SENTENCE. The presence test was `approver.length === 0`, so a single space
  // was an approver: the expected stamp became `human: ` and a gated governance disposition could be
  // attributed to a name that renders as nothing. The value of this variable IS the human's name —
  // it is interpolated straight into the stamp the admission must match.
  const HI = { by: "security-nfr", kind: "finding" };

  for (const [label, value] of [
    ["one space", " "],
    ["a tab", "\t"],
    ["a newline", "\n"],
  ] as const) {
    it(`env=${label} with a matching whitespace stamp is REFUSED, not admitted`, () => {
      expectDeny(payload({ ...HI, verified_by: `human:${value}` }), {
        CLAUDE_PROJECT_DIR: makeProject({ dial: "high-severity" }),
        [APPROVAL]: value,
      });
    });
    it(`env=${label} with any stamp at all is REFUSED`, () => {
      expectDeny(payload({ ...HI, verified_by: "human:alice" }), {
        CLAUDE_PROJECT_DIR: makeProject({ dial: "high-severity" }),
        [APPROVAL]: value,
      });
    });
  }

  it("a padded but REAL name still admits, matched against the trimmed name (non-vacuous)", () => {
    expectAllowed(runGuard(payload({ ...HI, verified_by: "human:alice" }), {
      CLAUDE_PROJECT_DIR: makeProject({ dial: "high-severity" }),
      [APPROVAL]: "  alice  ",
    }));
  });

  it("and the trimmed name is what the stamp must match — a padded stamp does NOT", () => {
    expectDeny(payload({ ...HI, verified_by: "human:  alice  " }), {
      CLAUDE_PROJECT_DIR: makeProject({ dial: "high-severity" }),
      [APPROVAL]: "alice",
    });
  });
});

describe("30-11 A-1 — this hook's approval name is IMPORTED from the grant vocabulary", () => {
  it("the name this test asserts is the one the published vocabulary declares", () => {
    // The test's own premise. If the hook's constant and the vocabulary ever disagreed, every case
    // in this file would be exercising a variable the hook does not read, and every DENY would be a
    // pass for the wrong reason.
    expect(APPROVAL).toBe(cp.ADMISSION_APPROVAL_ENV_VAR);
    expect(cp.isGrantEnvVarName(APPROVAL)).toBe(true);
  });
});

describe("30-11 RA1-2 (round 2) — the admission guard has no exit that decides nothing", () => {
  it("a FIFO at the config path DENIES a gated admission rather than blocking forever", () => {
    // Measured on the round-1 artifact: control answered in 43 ms; with a FIFO at
    // `<project>/.grugops/factory.config.json` there was NO answer at 20 seconds, on either stream.
    // A hook that never answers produces no decision, which the host treats as an allow.
    const dir = mkdtempSync(join(tmpdir(), "adm-fifo-"));
    tmpDirs.push(dir);
    mkdirSync(join(dir, ".grugops"), { recursive: true });
    // THE FIFO IS STAGED THROUGH THE PLATFORM-SHAPE CORPUS (plan 33-05, D-16): `mkfifo` followed by
    // `isFIFO()`. On windows-latest the bare `execFileSync("mkfifo")` this case used to call EXITED
    // 0 (MSYS ships one) and left nothing Node could open, so the guard answered about an absent
    // config and this case asserted over a fixture that was never there. A host that cannot stage
    // the shape now prints the remainder row and returns; the predicate — a non-regular config path
    // is a bounded DENY — is still pinned by the DIRECTORY case in `hooks/guard.test.ts` (RA1-2).
    const skipped = stageShapeOrSkip(
      "FIFO",
      join(dir, ".grugops", "factory.config.json"),
      "hooks/admission-guard.test.ts: a FIFO at the config path",
    );
    if (skipped !== null) {
      console.warn(skipLine(skipped, "the DIRECTORY-at-the-config-path case in hooks/guard.test.ts (same fstat rule)"));
      return;
    }
    const { status, stdout } = runGuard(
      payload({ by: "security-nfr", kind: "finding", verified_by: "" }),
      { CLAUDE_PROJECT_DIR: dir },
    );
    expect(status, "a timed-out hook has status null and no decision").toBe(0);
    expect(stdout).toContain('"permissionDecision":"deny"');
  });

  it("an EMPTY CLAUDE_PROJECT_DIR names nothing rather than resolving against the cwd", () => {
    const empty = runGuard(payload({ by: "security-nfr", kind: "finding", verified_by: "" }), {
      CLAUDE_PROJECT_DIR: "",
    });
    const unset = runGuard(payload({ by: "security-nfr", kind: "finding", verified_by: "" }));
    expect(empty.stdout).toBe(unset.stdout);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// 33.1-01 — WR-04 COMPLETENESS for this harness: the allow-site set is DERIVED, its count asserted,
// and a decider that never decided fails every allow control.
// ─────────────────────────────────────────────────────────────────────────────────────────────
//
// THE DERIVATION (the same predicate `hooks/guard.test.ts` states, restated here — no cross-test
// import): a STDOUT-ONLY ALLOW SITE is a non-comment line matching `STDOUT_ONLY_ALLOW_RE` with no
// exit-status, signal or code assertion on it or in the ten lines above. Before plan 33.1-01 it found
// 16 lines here: the retired helper's own assertion and its 15 call sites. All 15 now call
// `expectAllowed`, so the derivation over this file must come back EMPTY.
const STDOUT_ONLY_ALLOW_RE =
  /\.not\.toContain\((?:'"deny"'|"deny"|"permissionDecision"|DENY_DECISION)\)|stdout\)\.toBe\(""\)|\bexpectAllow\(/;
const EXIT_PROVED_RE = /\b(?:status|signal|code)\b[^\n]*\.(?:toBe|toBeNull)\(/;
const isCommentLine = (l: string): boolean => /^\s*(?:\/\/|\*|\/\*)/.test(l);
function unroutedAllowSites(src: string): string[] {
  const lines = src.split("\n");
  const out: string[] = [];
  lines.forEach((l, i) => {
    if (isCommentLine(l) || !STDOUT_ONLY_ALLOW_RE.test(l)) return;
    if (lines.slice(Math.max(0, i - 10), i + 1).some((x) => EXIT_PROVED_RE.test(x))) return;
    out.push(`${i + 1}: ${l.trim()}`);
  });
  return out;
}
const allowProofCalls = (src: string): number =>
  src.split("\n").filter((l) => !isCommentLine(l) && !/\bfunction expectAllowed\(/.test(l))
    .reduce((n, l) => n + (l.match(/\bexpectAllowed\(/g) ?? []).length, 0);

describe("33.1-01 WR-04 — every admission allow control is a PROVED allow, and the set is derived", () => {
  const SELF = readFileSync(join(import.meta.dirname, "admission-guard.test.ts"), "utf8");

  it("the derivation is not vacuous: it flags the retired helper shapes and passes an exit-proved site", () => {
    // `(` and `)` are spelled `\u0028` / `\u0029` so this file's own source does not carry the shapes
    // the derivation below scans it for; at run time each sample is the retired shape byte for byte.
    for (const shape of ["expectAllow\u0028payload({}\u0029\u0029;", "  expect(stdout).not.toContain\u0028'\"deny\"'\u0029;"]) {
      expect(unroutedAllowSites(shape), shape).toHaveLength(1);
    }
    expect(unroutedAllowSites('expect(r.status).toBe(0);\nexpect(r.stdout).toBe("");')).toEqual([]);
  });

  it("the derivation over this file is EMPTY, and the allow proof's call-site count is pinned", () => {
    expect(unroutedAllowSites(SELF)).toEqual([]);
    // 15 routed call sites, plus the control and the looped stub row below (2). A site deleted rather
    // than routed makes this number fall; a new allow control moves it on purpose.
    expect(allowProofCalls(SELF)).toBe(15 + 2);
  });

  // A mirror of the admission guard's derived import closure whose `scripts/checkpoints.js` runs `prefix`
  // FIRST. The module keeps every export (a replaced module fails ESM linking, which the guard already
  // turns into a named deny — a different branch), so evaluation reaches the stub.
  const stubbedAdmission = (prefix: string | null): string => {
    const root = mkdtempSync(join(tmpdir(), "adm-wr04-"));
    tmpDirs.push(root);
    for (const t of closureTargets(join(import.meta.dirname, ".."), "hooks/admission-guard.js", root)) {
      mkdirSync(dirname(t.to), { recursive: true });
      copyFileSync(t.from, t.to);
    }
    const cpPath = join(root, "scripts", "checkpoints.js");
    if (prefix !== null) writeFileSync(cpPath, prefix + readFileSync(cpPath, "utf8"));
    return join(root, "hooks", "admission-guard.js");
  };
  const allowCase = (): { input: string; env: NodeJS.ProcessEnv } => {
    const env: NodeJS.ProcessEnv = { ...process.env, CLAUDE_PROJECT_DIR: makeProject({ dial: "off" }) };
    delete env[APPROVAL];
    return { input: payload({ ...HIGH, verified_by: "" }), env };
  };

  it("CONTROL: an untouched mirror is a proved allow (exit 0, no signal, empty stdout, fd-3 token)", () => {
    const { input, env } = allowCase();
    expectAllowed(spawnDecider(stubbedAdmission(null), input, env), "control");
  });

  for (const [stubLabel, stub] of [
    ["a CRASH (exit 3, no stdout)", "process.reallyExit(3);\n"],
    ["a HANG past the spawn bound", "while(true){}\n"],
  ] as const) {
    it(`a decider that is ${stubLabel} fails the allow proof`, () => {
      const { input, env } = allowCase();
      const r = spawnDecider(stubbedAdmission(stub), input, env);
      expect(r.stdout, "silent — the retired stdout-only helper would have read this as an allow").toBe("");
      // PREMISE: the stub itself was reached — exit 3 for the crash, a kill signal for the hang.
      expect(stub.includes("reallyExit") ? r.status === 3 : r.signal !== null, "the stub was reached").toBe(true);
      expect(() => expectAllowed(r, stubLabel)).toThrow();
    }, 60_000);
  }
});
