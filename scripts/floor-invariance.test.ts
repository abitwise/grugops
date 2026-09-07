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

import { describe, it, expect, afterAll, vi } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { createHash } from "node:crypto";
import {
  MANIFEST_OPEN,
  MANIFEST_CLOSE,
  deriveManifest,
} from "./generate-hook-manifest.js";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

// ── THE EXPLICIT PER-TEST TIMEOUT (D-19 item 3, closing F-28-E; landed by plan 28-08) ─────────────
//
// WHY THIS FILE NEEDS AN EXPLICIT NUMBER AND THE OTHERS DO NOT. This is the most spawn-heavy oracle
// in the suite: it sweeps EVERY governance dial value and, for a share of them, spawns the COMMITTED
// .js in a child process rather than importing it — the spawn-the-artifact discipline the header
// describes. Process spawn cost is the one cost in this suite that is set by the MACHINE rather than
// by the code, so this file's runtime is the one that moves most between a developer's box and a
// loaded CI runner.
//
// WITHOUT THIS LINE THE FILE INHERITED VITEST'S 5,000 ms DEFAULT — silently, and from a config that
// does not mention timeouts at all (`vitest.config.ts` sets only `fileParallelism`). An inherited
// default is a number nobody chose: it can be changed by a vitest upgrade or by a config edit made
// for an unrelated reason, and the failure it produces is a timeout on a SAFETY-FLOOR sweep, which
// reads as a flake and gets retried rather than read.
//
// THE VALUE IS DERIVED FROM A MEASUREMENT, NOT PICKED. Measured 2026-08-11 (28-02) and re-measured
// independently 2026-08-12 (28-08) on darwin 25.5.0 / node v24.12.0: 128 tests, 1.3 s for the whole
// file, slowest SINGLE test 81-84 ms. Against the inherited 5,000 ms that is roughly 60x headroom on
// this box — comfortable here, and exactly the kind of margin that is comfortable until it is not.
// 30,000 ms is ~370x the measured slowest test and 6x the inherited default.
//
// THE DIRECTION IS DELIBERATE: THIS RAISES THE CEILING, IT DOES NOT LOWER IT. D-19 dispositions this
// item `fix` because `PITFALLS.md:801` records that the pressure gets WORSE when Phase 30 adds
// checkpoints — more spawns, on runners this repository does not control. Deferring the item TO
// Phase 30 would therefore invert its own rationale: it is cheap now and progressively more
// expensive later. A tighter timeout would be a different change with a different argument, and this
// is not it.
//
// WHAT A RED HERE MEANS. If a test in this file ever exceeds 30 s, do NOT raise this number. At 370x
// the measured cost the honest reading is that a spawn is hanging — a child process waiting on
// input, a guard blocking, a lock never released — and raising the ceiling would convert a hang into
// a slower hang. Find the spawn.
export const FLOOR_INVARIANCE_TEST_TIMEOUT_MS = 30_000;
vi.setConfig({ testTimeout: FLOOR_INVARIANCE_TEST_TIMEOUT_MS });

const ROOT = join(import.meta.dirname, "..");
const CONTEXT_IO_JS = join(ROOT, "scripts", "context-io.js");

// A stable 40-hex fixture commit id for the gate-run SHA emitVerdict has REQUIRED since
// plan 31-01. The value is a fixture, not a real commit: these cases assert admission behaviour,
// not provenance binding, so any well-formed object id serves.
const GATE_RUN_SHA = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0";

const GUARD_JS = join(ROOT, "hooks", "admission-guard.js");
const TWIN_MD = join(ROOT, "agent-factory/config/factory.config.md");
const KIT_JSON = join(ROOT, "agent-factory/config/factory.config.json");
const APPROVAL = "GRUGOPS_ADMISSION_APPROVED_BY";

// The frozen prod-deploy-guard source blob (D-02). hooks/guard.ts must hash to this at every dial
// value — GOVERNANCE-ADMISSION work must never touch the deploy guard.
//
// RE-BASELINED BY PLAN 30-01 (D-24). The previous baseline
// `3501810e21308e4b7e219679a6ca30dace9b5d66` froze the Phase-5 guard, which consulted no config at
// all. Phase 30 makes the guard consult the per-checkpoint autonomy matrix and enforce the two-key
// rule on a floor lowering, so the guard is DELIBERATELY unfrozen and re-frozen at the new blob —
// in the SAME commit that changes it, under the D-04 companion rule.
//
// WHAT THIS FREEZE STILL BUYS, WHICH IS THE POINT OF RE-BASELINING RATHER THAN DELETING IT. The
// two assertions below are not one check but two: `git hash-object` reads the WORKING TREE, and
// `git diff --quiet` reads the INDEX against HEAD. Together they refuse a hash-only change (someone
// updates this constant without changing the guard) AND a code-only change (someone changes the
// guard without updating this constant, or leaves it uncommitted). Either half alone is defeatable
// by the other kind of edit.
//
// EXECUTOR NOTE (RESEARCH F-8 / Pitfall 5): the suite CANNOT be green between the edit and the
// commit. Updating this constant makes the blob comparison pass immediately, but
// `git diff --quiet hooks/guard.ts` throws until the file is committed. A red naming
// `git diff --quiet` mid-edit is the mechanism working, not a broken change — commit, then re-run.
//
// RE-BASELINED AGAIN BY PLAN 30-03 (D-24, the phase's SECOND guard commit). The previous baseline
// `de37e4fb…8464` froze the 30-01 guard, which imported the governance reader under its pre-collapse
// name. Plan 30-03 deletes the second reader and renames the survivor, and the rename reaches the
// frozen file's import. THIS CHANGE IS A RENAME ONLY: one identifier at the import and one at the
// matrix read, with no decision branch, no message, no env read and no deny path touched — the diff
// is four lines across `guard.ts` and its compiled `guard.js`, and every guard test is unchanged and
// green. That is why the reproduction burden here is the freeze rule itself (source + artifact +
// constant in ONE commit) rather than a new bypass surface: there is no new surface to reproduce.
//
// RE-BASELINED AGAIN BY PLAN 30-08 TASK 1 (D-24, this phase's THIRD guard commit). The previous
// baseline `d91c2006…6b66` froze the 30-03 guard, which decided only the blocking tier: a matched
// command at a lowered checkpoint was allowed with no record at all. This change adds the two
// RECORDING branches D-10 and D-11 require — an authorized `notify` allows AND writes one finding,
// an unauthorized declaration is refused AND writes one finding — plus the actor fields read off the
// same payload. It adds no write of its own: both records go through the sanctioned emitter in
// scripts/context-io.ts, and hooks/guard.test.ts asserts that the guard source and artifact contain
// no filesystem write token. The zero-config decision and wording are byte-unchanged.
//
// RE-BASELINED AGAIN BY PLAN 30-08 TASK 2 (D-24, this phase's FOURTH guard commit). The previous
// baseline `88456e2c…af02` froze a guard that resolved each matched checkpoint a SECOND time, beside
// the resolution the banner had already made — two independent evaluations of one rule, which is the
// surface a banner and a decision drift apart on. The guard now holds ONE evaluation of the whole
// roster and passes it to both the banner composer and the decision loop, so there is no second value
// to disagree with. No message, no pattern and no env read changed.
//
// RE-BASELINED AGAIN BY PLAN 30-11 (D-24, this phase's FIFTH and last guard commit). The previous
// baseline `63c659c1…a9e3` froze a guard that FAILED OPEN on any failure it had not thought of.
// Red-team surface A round 1 reproduced this on the committed `hooks/guard.js`, spawned as a
// process: with `scripts/checkpoints.js` overwritten by one line of garbage,
// `git push --force origin main` produced exit 1, zero bytes of stdout, and therefore ALLOW — a
// PreToolUse hook that exits non-zero is NON-BLOCKING at the host, so a crashed guard and an
// allowing guard are the same event. One agent-reachable file write turned the two-key rule off with
// no grant, no config declaration and no human.
//
// This change makes the fail-closed posture a property of the PROCESS rather than of the branches
// the author happened to foresee: the dependency load is a guarded dynamic import (a static import
// is hoisted above `deny` itself and cannot be caught), and two last-resort handlers convert any
// remaining throw into the deny JSON. It also folds three other round-1 findings — the self-set
// refusal is rebuilt from the PUBLISHED grant vocabulary so `GRUGOPS_ADMISSION_APPROVED_BY` stops
// escaping it (A-1); the D-10 record states the outcome the run REACHED instead of the one its
// position implied (A-3); a grant that names nobody stops authorizing (A-4) — and publishes the
// governance reader's dropped-entry refusals, closing `V-30-10-01`. Every one is a strictly stricter
// decision or a more honest record; the zero-config decision and wording are byte-unchanged, which
// scripts/autonomy-zero-config.test.ts asserts as a whole-run differential.
//
// RE-BASELINED AGAIN BY PLAN 30-11 ROUND 2 (D-24, this phase's SIXTH guard commit). The previous
// baseline `12ea942f…f363` froze the round-1 guard, whose two independent reviews both returned
// findings. Five of them are in this file's subject:
//
//   RA1-1 — every deploy pattern anchored its verb ADJACENT to the tool name, so ONE global flag
//   defeated all of them at once (`kubectl -n prod apply`, `git -C /repo push origin main`,
//   `terraform -chdir=infra/prod apply`, eleven more, all measured ALLOW with zero keys). The guard
//   now consults a tokenizer and a tool->verb table BESIDE the literal patterns — additively, so no
//   existing denial can regress and a parser bug can only miss, never admit.
//   RA1-2 — three exits that decide nothing survived round 1's fix, which bounded THROWS: a FIFO at
//   the agent-writable config path made the process hang forever with zero bytes on both streams; a
//   never-settling dependency exited 13; a dependency's own `process.exit(0)` exited 0. There are
//   now exactly two named exits and an `exit` handler that converts any third into a refusal — and
//   it corrects the exit CODE, because a deny JSON on a non-zero exit is non-blocking at the host.
//   RA1-3/RA1-4 — `git push` naming no branch, and the merge forms that name their target.
//   RA1-5 — `NAME+=value` is an assignment and the refusal only knew `=`.
//
// The zero-config decision and wording are byte-unchanged, which
// scripts/autonomy-zero-config.test.ts asserts as a whole-run differential.
//
// RE-BASELINED AGAIN BY PLAN 30-11 ROUND 3 (D-24, this phase's SEVENTH guard commit). The previous
// baseline `995ae7cc…f766` froze the round-2 guard, whose two independent reviews returned thirteen
// findings — twelve of them created by round-2 fixes, and seven of them in this file's subject.
//
// THE COMMAND MODEL WAS REWRITTEN RATHER THAN REPAIRED. Round 2 closed a real zero-key bypass by
// adding a tokenizer to a safety path and named its own new freedom: a parser has a grammar an
// attacker can leave. One round later that grammar had SIX executable holes — word-internal quoting
// (`kubectl ""apply`), grouping tokens adopted as the tool (`( kubectl … )`), a hand-maintained
// wrapper set that missed `nice`/`timeout`/`doas` and could not survive `sudo -u root`, a
// fail-closed backstop defeated by the same edit that triggered it, `sh -cx`, and `git.exe`. The
// rewrite DELETES the wrapper set, the tool-identification step and the backstop's verb conjunct;
// words are now CLASSIFIED and a word this model cannot read is refused rather than read.
//
// AND THE PROCESS INVARIANT MOVED OUT OF THE PROCESS. `process.reallyExit(0)` in a dependency was a
// SILENT ALLOW and `abort()`/self-`SIGKILL` left no decision at all; no care inside a process
// establishes a property about a process a dependency can terminate. `hooks/hook-entry.ts` is now
// the hook entry point and answers for the decider, and an ALLOW is asserted on fd 3 rather than
// inferred from silence.
//
// The zero-config decision and wording are byte-unchanged, which
// scripts/autonomy-zero-config.test.ts asserts as a whole-run differential.
//
// NOT RE-BASELINED IN ROUND 4 — AND THAT IS WORTH SAYING OUT LOUD. Round 4 closed six findings in
// this file's subject and `hooks/guard.ts` did not change by one byte: every one of them lives in
// `scripts/checkpoints.ts` (the command model) or `hooks/hook-entry.ts` (the wrapper). The blob below
// is still round 3's. A freeze that had moved here would have been a signal nobody could read.
//
// The six, each a DELETION rather than an addition:
//   RA5-1 the 64-SEGMENT cap that stopped silently — deleted, not made fail-closed; it bounded the
//         wrong thing, and nesting was already bounded at 3.
//   RA5-2 `benign` suppression decided by a FLAG'S ARGUMENT (`git -C log push origin main` executed a
//         real push to main) — the POSITION is removed: benign may only suppress adjacent to the tool.
//   RA5-3 the `-c alias` half-read that fed `gitPushIsGoverned` a list the command does not have and
//         allowed a real FORCE PUSH TO MAIN — the `.split()[0]` read is deleted; a multi-word alias
//         value is OPAQUE.
//   RA5-4 `NESTED_SHELLS`, a hand-maintained set whose incompleteness UNDER-refuses (`eval '…'`) —
//         deleted the way WRAPPERS was: any canonical word carrying whitespace is a nested command.
//   the FORCE ARM, found by this plan's own corpus: the model never implemented the literal set's
//         "a force push on any branch" rule, so `git -C log push --force origin feature` matched
//         neither authority.
// The zero-config decision and wording are byte-unchanged (scripts/autonomy-zero-config.test.ts).
const FROZEN_GUARD_BLOB = "669725bc1c616ab57123e22090d93d57eff1b001";

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
  // Humans hold merge/deploy via the guard, and the guard only ever changes DELIBERATELY: a change
  // must move the source AND this baseline AND land both in one commit. Governance admission work
  // must never touch it. Re-baselined once, by plan 30-01 (D-24) — see FROZEN_GUARD_BLOB above.
  describe("invariant 4 — hooks/guard.ts matches its frozen baseline (D-02)", () => {
    it("the committed hooks/guard.ts blob matches the frozen D-02 hash", () => {
      // git hash-object computes the blob SHA exactly as git stored it; compare to the frozen blob.
      const blob = execFileSync("git", ["hash-object", "hooks/guard.ts"], {
        cwd: ROOT,
        encoding: "utf8",
      }).trim();
      expect(blob).toBe(FROZEN_GUARD_BLOB);
    });

    it("hooks/guard.ts has no uncommitted modification, measured against HEAD", () => {
      // MEASURED AGAINST **HEAD**, NOT THE INDEX (plan 30-11, red-team surface A, finding A-5).
      //
      // This assertion used to read `git diff --quiet hooks/guard.ts`. With no commit argument,
      // `git diff` compares the WORKING TREE to the **INDEX** — so a single `git add hooks/guard.ts`
      // satisfied it while HEAD still carried the old guard. Reproduced on a clone of this
      // repository: append a line to the guard, update FROZEN_GUARD_BLOB to the new hash, stage ONLY
      // the guard, and `git diff --quiet hooks/guard.ts` exits 0 while
      // `git diff --quiet HEAD -- hooks/guard.ts` exits non-zero. The comment above claims this pair
      // refuses a change that someone "leaves uncommitted"; against the index, it did not.
      //
      // `--quiet` exits 0 when the path matches HEAD. execFileSync throws on a nonzero exit, so a
      // clean tree returns normally and a dirty-or-merely-staged tree throws (fails).
      expect(() =>
        execFileSync("git", ["diff", "--quiet", "HEAD", "--", "hooks/guard.ts"], { cwd: ROOT }),
      ).not.toThrow();
    });

    it("the guard and this baseline moved in the SAME COMMIT (D-24, commit-scoped)", () => {
      // WHAT SCOPE THE FREEZE RULE ACTUALLY HAD, AND WHAT IT NOW HAS (finding A-5).
      //
      // D-24 says the hook is unfrozen and re-frozen in the SAME COMMIT. Until this case, nothing
      // asked that question: the two assertions above are working-tree assertions, and
      // `scripts/check-diff-disposition.ts` — which owns this repository's per-commit companion
      // machinery, with the explicit "the commit that actually changed it, not merely somewhere in
      // the range" rule — carries three frozen sources and `hooks/guard.ts` is not one of them. So
      // the freeze was neither commit-scoped nor range-scoped: it was index-scoped, and D-24 was
      // enforced by the author's discipline alone.
      //
      // The question asked here is commit-scoped on purpose. A range-scoped form ("did the baseline
      // change anywhere between some base and HEAD") self-disarms the first time the companion file
      // changes for an unrelated reason — and this phase changed the guard four times, which is
      // exactly the condition under which that happens.
      const guardCommit = execFileSync(
        "git",
        ["log", "-1", "--format=%H", "--", "hooks/guard.ts"],
        { cwd: ROOT, encoding: "utf8" },
      ).trim();
      expect(guardCommit, "hooks/guard.ts must exist in history for the freeze to mean anything").toMatch(
        /^[0-9a-f]{40}$/,
      );
      const touched = execFileSync(
        "git",
        ["show", "--name-only", "--format=", guardCommit],
        { cwd: ROOT, encoding: "utf8" },
      )
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      // Its own premise: the commit we found really is a commit that touched the guard. Without
      // this, a `git log` that silently returned an unrelated commit would make the case pass for a
      // reason it never checked.
      expect(touched, `commit ${guardCommit} does not touch hooks/guard.ts`).toContain("hooks/guard.ts");
      expect(
        touched,
        `hooks/guard.ts last changed in ${guardCommit}, which does not also carry ` +
          `scripts/floor-invariance.test.ts. D-24 requires the source and its frozen baseline to ` +
          `move as one act; a two-commit split leaves HEAD carrying a guard whose blob does not ` +
          `match HEAD's baseline, and a fresh clone of that commit is red while this working tree ` +
          `is green.`,
      ).toContain("scripts/floor-invariance.test.ts");
      // And the compiled artifact the HOST runs moved with them — the source freeze says nothing
      // about hooks/guard.js on its own.
      expect(
        touched,
        `commit ${guardCommit} changed hooks/guard.ts without hooks/guard.js; the host runs the ` +
          `artifact, so a source-only commit ships a guard nobody built.`,
      ).toContain("hooks/guard.js");
    });

    it("NEW FREEDOM, BOUNDED: the commit-scoped assertion needs a git HISTORY, and says so", () => {
      // The bound on the case above, stated in the same commit that introduced it. `git hash-object`
      // works outside a repository; `git log` does not. A consumer running this suite from an
      // exported archive (`git archive`, a tarball, a vendored copy) has no history, and this
      // repository has already recorded one round where a mirror with no `.git` produced a clean
      // result from a gate that never reached its predicate. So the premise is asserted rather than
      // assumed: if this is not a git working tree, the case above proves nothing and this one says
      // which of the two situations we are in.
      const inRepo = execFileSync("git", ["rev-parse", "--is-inside-work-tree"], {
        cwd: ROOT,
        encoding: "utf8",
      }).trim();
      expect(
        inRepo,
        "the commit-scoped freeze assertion is only meaningful inside a git working tree",
      ).toBe("true");
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
      mod.emitVerdict(task, id, "clean", GATE_RUN_SHA, contextRoot);
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
    // A HANG MUST REDDEN THIS CASE, NOT STOP THE SUITE (plan 30-11 round 3, reviewer-3 observation
    // 3). This file's subject is the safety floor and its spawn was the one with no bound: the
    // file's own 30 s `testTimeout` cannot preempt a synchronous `spawnSync`, so the exact `N4c`
    // failure — a hang that stops CI instead of reddening it — was still reachable here.
    timeout: 20_000,
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

describe("30-11 round 3 — every spawn in the hook and floor tests is BOUNDED (derive the set)", () => {
  // REVIEWER-3 OBSERVATION 3. Round 2 bounded the spawns it remembered and missed two — including the
  // one in THIS file, whose subject is the safety floor. A hand-applied bound is a set literal, and
  // this repository's answer to a set literal is to derive the set and assert over it rather than to
  // remember harder. The membership question is asked of the SOURCE, so a spawn added tomorrow is
  // covered without anyone editing this case.
  const FILES = [
    "scripts/floor-invariance.test.ts",
    "hooks/guard.test.ts",
    "hooks/admission-guard.test.ts",
  ];

  it("every spawnSync call in these files passes a timeout", () => {
    const offenders: string[] = [];
    let calls = 0;
    for (const rel of FILES) {
      const src = readFileSync(join(ROOT, rel), "utf8");
      // Each call's options object runs to the closing `});` of the call — enough to see `timeout:`.
      for (const m of src.matchAll(/spawnSync\(/g)) {
        calls += 1;
        const window = src.slice(m.index, m.index + 600);
        const end = window.indexOf("\n  });");
        const body = end === -1 ? window : window.slice(0, end);
        if (!/\btimeout\s*:/.test(body)) {
          offenders.push(`${rel} @ char ${m.index}: ${body.split("\n")[0]}`);
        }
      }
    }
    // The scan's own premise: a regex that matched nothing would pass this case forever.
    expect(calls, "the spawnSync scan found no calls at all — it has stopped asking").toBeGreaterThan(3);
    expect(
      offenders,
      `spawnSync without a timeout:\n${offenders.join("\n")}\n` +
        `A synchronous spawn cannot be preempted by vitest's testTimeout, so an unbounded one turns a ` +
        `regression into a hung suite rather than a red one.`,
    ).toEqual([]);
  });
});

/**
 * The hook ENTRY POINT is frozen too (plan 30-11 round 3, D-24 applied to the file that is now the
 * entry). `hooks/hooks.json` names `hooks/hook-entry.js`, so the entry is what a host actually runs
 * and the freeze rule follows the entry rather than the file it used to name. The wrapper is the
 * fail-closed answer for a decider that never answers, so a change to it is exactly as deliberate as
 * a change to the guard: source, artifact and this baseline move in ONE commit.
 */
//
// RE-BASELINED BY PLAN 30-11 ROUND 4, AND THE FREEZE INPUT CHANGED WITH IT. The wrapper now carries a
// GENERATED manifest of every decider's emitted import closure (`RA5-5`), which moves on any
// legitimate `scripts/` rebuild. Freezing the raw file would make "the wrapper's logic changed" and
// "the manifest was regenerated" the same event, and the freeze would stop meaning anything. So the
// baseline is taken over the source with the manifest region NORMALISED OUT — the two stay different
// events, and `npm run freshness:hook-manifest` is what holds the region itself.
const FROZEN_HOOK_ENTRY_LOGIC_SHA = "5bfd5ba85a716dcd4383e819480edaf32bfeba58cadb3479089fd22e94777d9e";

describe("30-11 round 3 — the hook ENTRY is frozen, and hooks.json names it", () => {
  it("hooks/hook-entry.ts's LOGIC matches its frozen hash (manifest region normalised out)", () => {
    const src = readFileSync(join(ROOT, "hooks", "hook-entry.ts"), "utf8");
    const a = src.indexOf(MANIFEST_OPEN);
    const b = src.indexOf(MANIFEST_CLOSE);
    expect(a, "the manifest region's opening marker is missing").toBeGreaterThan(-1);
    expect(b, "the manifest region's closing marker is missing").toBeGreaterThan(a);
    const normalised = src.slice(0, a) + "<MANIFEST REGION>" + src.slice(b + MANIFEST_CLOSE.length);
    // Non-vacuity: normalising must actually remove something, or this is hashing the whole file.
    expect(normalised.length).toBeLessThan(src.length - 100);
    expect(createHash("sha256").update(normalised).digest("hex")).toBe(FROZEN_HOOK_ENTRY_LOGIC_SHA);
  });

  it("the manifest covers EVERY module in each decider's closure, cardinality asserted", () => {
    // A manifest that silently went SHORT would leave exactly the module an attacker wants
    // unverified, so it is compared against a fresh derivation rather than trusted.
    const derived = deriveManifest(ROOT);
    const src = readFileSync(join(ROOT, "hooks", "hook-entry.ts"), "utf8");
    for (const [entry, per] of Object.entries(derived)) {
      expect(src, `the manifest carries no entry for ${entry}`).toContain(JSON.stringify(entry));
      for (const [rel, hash] of Object.entries(per)) {
        expect(src, `${entry}'s manifest is missing ${rel}`).toContain(JSON.stringify(rel));
        expect(src, `${entry}'s manifest carries a stale hash for ${rel}`).toContain(hash);
      }
      expect(Object.keys(per).length, `${entry}'s closure looks short`).toBeGreaterThan(3);
    }
    expect(Object.keys(derived).length, "no deciders were derived at all").toBe(2);
  });

  it("hooks/hook-entry.ts has no uncommitted modification, measured against HEAD", () => {
    expect(() =>
      execFileSync("git", ["diff", "--quiet", "HEAD", "--", "hooks/hook-entry.ts"], { cwd: ROOT }),
    ).not.toThrow();
  });

  it("hooks.json routes BOTH hooks through the wrapper, naming the decider", () => {
    // The freeze is worth nothing if the host runs something else. Both matchers must name the
    // wrapper, and the wrapper must be handed a decider — a matcher pointing straight at a decider
    // would restore every termination class RA3-7 closed.
    const hooks = JSON.parse(readFileSync(join(ROOT, "hooks", "hooks.json"), "utf8")) as {
      hooks: { PreToolUse: Array<{ matcher: string; hooks: Array<{ command: string }> }> };
    };
    const commands = hooks.hooks.PreToolUse.flatMap((m) => m.hooks.map((h) => h.command));
    expect(commands.length).toBe(2);
    for (const c of commands) {
      expect(c, `a PreToolUse command bypasses the wrapper: ${c}`).toContain("hooks/hook-entry.js");
    }
    expect(commands.join(" ")).toContain("guard.js");
    expect(commands.join(" ")).toContain("admission-guard.js");
  });

  it("the wrapper imports nothing that an agent-reachable write could corrupt", () => {
    // The wrapper's whole value is that the corruption class reaching the decider cannot reach IT.
    // Node builtins cannot fail to load and no agent can overwrite them; a relative import could.
    const src = readFileSync(join(ROOT, "hooks", "hook-entry.ts"), "utf8");
    const imports = [...src.matchAll(/^import .*? from "([^"]+)";$/gm)].map((m) => m[1] as string);
    expect(imports.length).toBeGreaterThan(0);
    for (const spec of imports) {
      expect(spec, `hook-entry imports ${spec}, which is not a node: builtin`).toMatch(/^node:/);
    }
  });
});
