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
import { join } from "node:path";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";

const APPROVAL = "GRUGOPS_ADMISSION_APPROVED_BY";

// Targets the COMMITTED admission-guard.js (the artifact the host hook runs), never the .ts.
const GUARD_JS = join(import.meta.dirname, "admission-guard.js");

function runGuard(
  payload: string,
  env: Record<string, string> = {},
): { status: number | null; stdout: string; stderr: string } {
  // Build a clean env: never inherit a stray GRUGOPS_ADMISSION_APPROVED_BY from the caller's shell, or
  // the deny cases would silently pass for the wrong reason. Strip it, then apply per-case overrides.
  const baseEnv: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (k === APPROVAL) continue;
    if (v !== undefined) baseEnv[k] = v;
  }
  const r = spawnSync("node", [GUARD_JS], {
    input: payload,
    encoding: "utf8",
    env: { ...baseEnv, ...env },
  });
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

function expectDeny(payload: string, env: Record<string, string> = {}): void {
  const { stdout } = runGuard(payload, env);
  expect(stdout).toContain('"permissionDecision":"deny"');
}

function expectAllow(payload: string, env: Record<string, string> = {}): void {
  const { stdout } = runGuard(payload, env);
  expect(stdout).not.toContain('"deny"');
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
    expectAllow(payload({ ...HIGH, verified_by: "human:alice" }), {
      CLAUDE_PROJECT_DIR: makeProject({ dial: "high-severity" }),
      [APPROVAL]: "alice",
    });
  });

  it("allow: routine finding (by: software-engineer) under high-severity is not gated", () => {
    expectAllow(payload({ ...ROUTINE, verified_by: "" }), { CLAUDE_PROJECT_DIR: makeProject({ dial: "high-severity" }) });
  });

  it("allow: routine finding under `all` WITH env=alice AND human:alice", () => {
    expectAllow(payload({ ...ROUTINE, verified_by: "human:alice" }), {
      CLAUDE_PROJECT_DIR: makeProject({ dial: "all" }),
      [APPROVAL]: "alice",
    });
  });

  it("allow: high-severity finding under `off` (lean default, no human stop)", () => {
    expectAllow(payload({ ...HIGH, verified_by: "" }), { CLAUDE_PROJECT_DIR: makeProject({ dial: "off" }) });
  });

  it("allow: high-severity finding when config is genuinely absent (defaults to off)", () => {
    expectAllow(payload({ ...HIGH, verified_by: "" }), { CLAUDE_PROJECT_DIR: makeProject({ absent: true }) });
  });

  it("allow: a soft kind (observation) under `all` with NO env (soft kinds carry no stamp, D-08)", () => {
    expectAllow(payload({ by: "security-nfr", kind: "observation", verified_by: "" }), {
      CLAUDE_PROJECT_DIR: makeProject({ dial: "all" }),
    });
  });

  // ── 3. SC3 floor carried to the structured channel — every dial value gate-or-stricter ────────────
  for (const dial of ["hihg-severity", "High-Severity", "all ", "", "bogus", "OFF", "1", "true", "zZ9-garbage"]) {
    it(`deny: non-canonical human_admission=${JSON.stringify(dial)} gates a high-severity finding (fail-closed)`, () => {
      expectDeny(payload({ ...HIGH, verified_by: "" }), { CLAUDE_PROJECT_DIR: makeProject({ dial }) });
    });
  }

  it("allow: canonical `off` still allows a high-severity finding (the only off-equivalent value)", () => {
    expectAllow(payload({ ...HIGH, verified_by: "" }), { CLAUDE_PROJECT_DIR: makeProject({ dial: "off" }) });
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
    expectAllow(payload({ ...ROUTINE, verified_by: "" }), { CLAUDE_PROJECT_DIR: makeProject({ absent: true }) });
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
    expectAllow(payload({ by: `software-engineer${NBSP}`, kind: "finding", verified_by: "" }), {
      CLAUDE_PROJECT_DIR: makeProject({ dial: "high-severity" }),
    });
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
    expectAllow(payload({ by: "security-nfr", verified_by: "" }), { CLAUDE_PROJECT_DIR: makeProject({ dial: "off" }) });
  });

  it("deny: malformed payload does not crash (exit 0, deny JSON, no error)", () => {
    const r = runGuard("not json at all", { CLAUDE_PROJECT_DIR: makeProject({ dial: "high-severity" }) });
    expect(r.status).toBe(0);
    expect(r.stderr.toLowerCase()).not.toContain("error");
  });

  // ── 6. W3 matcher breadth — a second/renamed grugops admission tool is still gated by the hook ─────
  // The hooks.json matcher is the mcp__grugops__.* FAMILY (asserted in floor-invariance.test.ts), and the
  // hook itself keys on the note fields, not the exact tool name — so a renamed admission tool delivering
  // the same structured fields is gated identically.
  for (const toolName of ["mcp__grugops__admit", "mcp__grugops__propose_finding", "mcp__grugops__v2_admit"]) {
    it(`deny (W3): renamed admission tool ${toolName} with a high-severity finding and no env DENIES`, () => {
      expectDeny(payload({ ...HIGH, verified_by: "" }, toolName), {
        CLAUDE_PROJECT_DIR: makeProject({ dial: "high-severity" }),
      });
    });
    it(`allow (W3): renamed admission tool ${toolName} with env=alice + human:alice ALLOWS`, () => {
      expectAllow(payload({ ...HIGH, verified_by: "human:alice" }, toolName), {
        CLAUDE_PROJECT_DIR: makeProject({ dial: "high-severity" }),
        [APPROVAL]: "alice",
      });
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
    expectAllow(payload({ by: "security-nfr", kind: "observation ", verified_by: "" }), {
      CLAUDE_PROJECT_DIR: makeProject({ dial: "all" }),
    });
  });

  // No over-block: a padded routine finding under high-severity stays not-gated (kind normalizes to a
  // finding, but the routine `by` keeps it non-high-severity → ALLOW).
  it("allow (GAP-R7-1 Lever-1 control): a padded routine finding under high-severity is NOT gated", () => {
    expectAllow(payload({ by: "software-engineer", kind: "finding ", verified_by: "§14-gate#x" }), {
      CLAUDE_PROJECT_DIR: makeProject({ dial: "high-severity" }),
    });
  });

  // The combined-lever GREEN positive at the hook tier: a padded kind + a real human env+stamp ALLOWS
  // (the normalization gates it, then the per-call env+stamp authorizes it).
  it("allow (GAP-R7-1 Lever-1 positive): padded kind + env=alice + human:alice ALLOWS", () => {
    expectAllow(payload({ by: "security-nfr", kind: "finding ", verified_by: "human:alice" }), {
      CLAUDE_PROJECT_DIR: makeProject({ dial: "high-severity" }),
      [APPROVAL]: "alice",
    });
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
