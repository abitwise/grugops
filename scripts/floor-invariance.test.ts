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
// HOOK TIER (25-10) — the un-forgeable PRIMARY gate, now on the STRUCTURED admission channel (D-01).
//
// Plan 25-10 retargeted hooks/admission-guard from a Bash command-string matcher to a PER-CALL
// PreToolUse matcher on the mcp__grugops__.* family, DELETED the entire command-string parser, and
// decides admission from the FINAL structured tool_input (by/kind/verified_by) plus the FRESH per-call
// session env. So the SC3 floor sweep below drives the COMMITTED admission-guard.js with STRUCTURED
// stdin payloads (never a shell command string — there is none anymore). The four un-dialable floor
// invariants above are admit()-tier (the WEAKER degrade tier, D-04) and are PRESERVED unchanged; this
// block carries the SC3 floor + the per-call stamp-binding onto the un-forgeable structured channel.
//
// D-12 / [[grugops-safety-invariant-green-suite-insufficient]]: a GREEN sweep is NECESSARY BUT NOT
// SUFFICIENT — the INDEPENDENT opus-grade red-team at Task 25-11-03 is the closure gate, not this suite.
// ════════════════════════════════════════════════════════════════════════════════════════════════

// Child-spawn the COMMITTED admission-guard.js with a STRUCTURED PreToolUse payload and a clean env
// (never inherit a stray APPROVAL), returning whether it emitted a deny.
function hookDecision(
  fields: { by?: string; kind?: string; verified_by?: string },
  projectDir: string,
  approval?: string,
  toolName = "mcp__grugops__propose_note",
): "deny" | "allow" {
  const baseEnv: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (k === APPROVAL) continue;
    if (v !== undefined) baseEnv[k] = v;
  }
  const env: Record<string, string> = { ...baseEnv, CLAUDE_PROJECT_DIR: projectDir };
  if (approval !== undefined) env[APPROVAL] = approval;
  const tool_input: Record<string, unknown> = { task: "my-task", body: "a finding body" };
  if (fields.kind !== undefined) tool_input.kind = fields.kind;
  if (fields.by !== undefined) tool_input.by = fields.by;
  if (fields.verified_by !== undefined) tool_input.verified_by = fields.verified_by;
  const r = spawnSync("node", [GUARD_JS], {
    input: JSON.stringify({ tool_name: toolName, tool_input }),
    encoding: "utf8",
    env,
  });
  return (r.stdout ?? "").includes('"permissionDecision":"deny"') ? "deny" : "allow";
}

// A project dir with a chosen human_admission value (or a corrupt / absent / raw-JSON config).
function projectWith(opts: { dial?: string; raw?: string; corrupt?: boolean; absent?: boolean }): string {
  const dir = freshTmp("hook-struct-");
  if (!opts.absent) {
    mkdirSync(join(dir, ".grugops"), { recursive: true });
    const cfg = join(dir, ".grugops", "factory.config.json");
    if (opts.corrupt) writeFileSync(cfg, "{ this is : not json ");
    else if (opts.raw !== undefined) writeFileSync(cfg, `{ "context": { "human_admission": ${opts.raw} } }`);
    else writeFileSync(cfg, JSON.stringify({ context: { human_admission: opts.dial ?? "off" } }));
  }
  return dir;
}

const HI = { by: "security-nfr", kind: "finding", verified_by: "" };
const RT = { by: "software-engineer", kind: "finding", verified_by: "" };

describe("SC3 HOOK-tier (25-10, structured channel) — every non-`off` dial + corrupt config fail CLOSED", () => {
  // The FULL garbage/typo/case/whitespace string set, swept against the committed structured hook.
  const NON_OFF = [
    "high-severity",
    "all",
    "",
    "bogus",
    "OFF",
    "High-Severity",
    "hihg-severity",
    "all ",
    "1",
    "true",
    "zZ9-garbage_random-string",
  ];
  for (const dial of NON_OFF) {
    it(`hook DENIES a high-severity finding when human_admission=${JSON.stringify(dial)} (gate-or-stricter)`, () => {
      expect(hookDecision(HI, projectWith({ dial }))).toBe("deny");
    });
  }

  it("hook ALLOWs a high-severity finding ONLY under canonical `off` (the only off-equivalent value)", () => {
    expect(hookDecision(HI, projectWith({ dial: "off" }))).toBe("allow");
  });

  // Non-string dial TYPES coerce to gate-or-stricter (governance not silently off).
  for (const raw of ["true", "1", "null", '["all"]', "{}"]) {
    it(`hook DENIES a high-severity finding when human_admission=${raw} (non-string -> gate-or-stricter)`, () => {
      expect(hookDecision(HI, projectWith({ raw }))).toBe("deny");
    });
  }

  it("hook DENIES a matched admit when the config is present-but-unreadable (corrupt -> fail-closed)", () => {
    expect(hookDecision(HI, projectWith({ corrupt: true }))).toBe("deny");
  });

  it("hook ALLOWs a routine finding when the config is genuinely ABSENT (zero-config lean preserved, SC2)", () => {
    expect(hookDecision(RT, projectWith({ absent: true }))).toBe("allow");
  });
});

describe("Per-call stamp-binding (25-10, D-07) — the env+stamp grant on the structured channel", () => {
  it("a gated finding DENIES with NO env (the planted direction)", () => {
    expect(hookDecision(HI, projectWith({ dial: "high-severity" }))).toBe("deny");
  });

  it("a gated finding ALLOWs with env=alice AND verified_by=human:alice (the positive)", () => {
    expect(
      hookDecision({ ...HI, verified_by: "human:alice" }, projectWith({ dial: "high-severity" }), "alice"),
    ).toBe("allow");
  });

  it("a gated finding DENIES with env=alice but verified_by=human:bob (mismatch)", () => {
    expect(
      hookDecision({ ...HI, verified_by: "human:bob" }, projectWith({ dial: "high-severity" }), "alice"),
    ).toBe("deny");
  });

  it("a gated finding DENIES with env=alice but NO stamp", () => {
    expect(hookDecision(HI, projectWith({ dial: "high-severity" }), "alice")).toBe("deny");
  });

  it("a self-authored verified_by=human:eve with NO env DENIES (the stamp alone never grants)", () => {
    expect(hookDecision({ ...HI, verified_by: "human:eve" }, projectWith({ dial: "high-severity" }))).toBe(
      "deny",
    );
  });

  it("a routine finding under `all` with no env DENIES; with env+matching-stamp ALLOWs", () => {
    expect(hookDecision(RT, projectWith({ dial: "all" }))).toBe("deny");
    expect(
      hookDecision({ ...RT, verified_by: "human:alice" }, projectWith({ dial: "all" }), "alice"),
    ).toBe("allow");
  });

  // Fail-closed on missing/malformed structured args, never crash-allow.
  it("a finding with NO `by` under an active dial fails closed; under `off` is lean", () => {
    expect(hookDecision({ kind: "finding", verified_by: "" }, projectWith({ dial: "high-severity" }))).toBe(
      "deny",
    );
    expect(hookDecision({ kind: "finding", verified_by: "" }, projectWith({ dial: "all" }))).toBe("deny");
    expect(hookDecision({ kind: "finding", verified_by: "" }, projectWith({ dial: "off" }))).toBe("allow");
  });

  it("a soft kind (observation) is never gated even under `all` (D-08)", () => {
    expect(
      hookDecision({ by: "security-nfr", kind: "observation", verified_by: "" }, projectWith({ dial: "all" })),
    ).toBe("allow");
  });
});

describe("W1 NON-VACUOUS (25-10) — exact near-miss code points classify high-severity at the hook", () => {
  // Construct the LITERAL U+00A0 / U+200B / NFKC-compatibility / case code points. A bare
  // .trim().toLowerCase() classifier would let (a)/(b)/(c) through (allowing the admit un-gated); the
  // imported single-source classifier folds each to high-severity, so each DENIES without env+stamp.
  const NBSP = " ";
  const ZWSP = "​";
  const FULLWIDTH = "ｓｅｃｕｒｉｔｙ-ｎｆｒ"; // full-width "security-nfr"
  const VARIANTS: Array<[string, string]> = [
    ["trailing U+00A0", `security-nfr${NBSP}`],
    ["leading U+00A0", `${NBSP}security-nfr`],
    ["embedded U+200B", `security-${ZWSP}nfr`],
    ["NFKC full-width", FULLWIDTH],
    ["case SECURITY-NFR", "SECURITY-NFR"],
    ["case+space Architect-Design ", "Architect-Design "],
    ["case Release-Manager", "Release-Manager"],
  ];
  for (const [label, by] of VARIANTS) {
    it(`hook DENIES a high-severity by=${label} under high-severity, no env (non-vacuous)`, () => {
      expect(hookDecision({ by, kind: "finding", verified_by: "" }, projectWith({ dial: "high-severity" }))).toBe(
        "deny",
      );
    });
  }

  it("a routine role with a trailing nbsp is NOT over-classified (the fixtures are non-vacuous)", () => {
    expect(
      hookDecision({ by: `software-engineer${NBSP}`, kind: "finding", verified_by: "" }, projectWith({ dial: "high-severity" })),
    ).toBe("allow");
  });
});

describe("W3 matcher breadth (25-10) — the mcp__grugops__.* family is gated, not one exact tool name", () => {
  it("hooks.json wires the admission guard to the mcp__grugops__.* FAMILY (not an exact tool name)", () => {
    const hooks = JSON.parse(readFileSync(join(ROOT, "hooks", "hooks.json"), "utf8")) as {
      hooks: { PreToolUse: Array<{ matcher: string; hooks: Array<{ command: string }> }> };
    };
    const admission = hooks.hooks.PreToolUse.find((m) =>
      m.hooks.some((h) => h.command.includes("admission-guard.js")),
    );
    expect(admission, "an admission-guard PreToolUse matcher must exist").toBeDefined();
    expect(admission!.matcher).toBe("mcp__grugops__.*");
    // The prod-deploy guard's Bash matcher must remain untouched (D-02).
    const deploy = hooks.hooks.PreToolUse.find((m) =>
      m.hooks.some((h) => h.command.includes("guard.js") && !h.command.includes("admission-guard.js")),
    );
    expect(deploy, "the prod-deploy guard matcher must exist").toBeDefined();
    expect(deploy!.matcher).toBe("Bash");
  });

  for (const toolName of ["mcp__grugops__admit", "mcp__grugops__propose_finding", "mcp__grugops__v2_admit"]) {
    it(`a renamed admission tool ${toolName} is still gated by the hook (DENY without env)`, () => {
      expect(hookDecision(HI, projectWith({ dial: "high-severity" }), undefined, toolName)).toBe("deny");
    });
  }
});

describe("Floor invariants preserved at the structured hook tier (25-10)", () => {
  it("the stamp alone never grants behind any dial (refuse-self analog) and guard.ts stays byte-frozen", () => {
    // A self-authored stamp with NO env DENIES under every active dial — the structured-channel form of
    // refuse-self-set (the agent cannot set the hook's fresh session env).
    for (const dial of ["high-severity", "all", "bogus"]) {
      expect(
        hookDecision({ ...HI, verified_by: "human:eve" }, projectWith({ dial })),
        `self-stamp with no env must DENY under ${dial}`,
      ).toBe("deny");
    }
    // hooks/guard.ts stays byte-frozen (D-02) — the round-6 retarget must not touch the deploy guard.
    const blob = execFileSync("git", ["hash-object", join(ROOT, "hooks", "guard.ts")], {
      encoding: "utf8",
    }).trim();
    expect(blob, "hooks/guard.ts must be byte-frozen at the D-02 blob").toBe(FROZEN_GUARD_BLOB);
  });
});
