// uat-live.test.ts — Phase 19 Tier-2 GATED headless E2E harness (UAT-AUTO-02 / UAT-AUTO-04).
//
// This is the honest live-runtime half of the auto-UAT harness. It drives the REAL `claude` CLI
// headlessly (`claude --print`) through the three deferred live-runtime UATs that an executor agent
// cannot self-perform:
//
//   A1      (D-31)  plugin-cache pointer resolution: install the grugops plugin into a throwaway
//                   temp repo and confirm `/grugops:plan …` resolves the repo-relative pointers and
//                   produces planning/Orchestrator output rather than a plugin-cache path error.
//   A2-live (SAFE-02 / V14)  live PreToolUse deny: drive a HARMLESS matched deploy probe with NO
//                   GRUGOPS_PROD_DEPLOY_APPROVED set and assert the clear-voice deny string fires.
//   A3-live (DOG-02) dual-path parity: drive the SAME ticket (ABC-001) through the sequential and
//                   the sub-agent dispatch paths and assert the produced handoff filenames + the
//                   gate verdict match (only the dispatch differs).
//
// THE HONESTY KEYSTONE (Constraint #6):
// Every live assertion is gated behind a `claude auth status` probe (present AND authed). When the
// CLI is absent or unauthed the harness emits a LOUD, DISTINCTLY-MARKED skip (the exact exported
// LOUD_SKIP_MARKER sentinel via console.warn) and NEVER reports a silent green and NEVER flips a UAT
// file. A skip is NOT a pass — the UAT stays pending. The loud-skip path is itself PROVEN below by a
// `-t "loud-skip"` test that forces the probe false and asserts the exact sentinel, so a correct
// loud-skip is distinguishable from a forbidden silent `it.skip` (both otherwise exit 0).
//
// SAFETY (mirrors docs/dogfood-human-runbook.md, non-negotiable):
//   - The harness NEVER sets or exports GRUGOPS_PROD_DEPLOY_APPROVED (V14 — the self-approve keystone).
//   - The A2-live probe uses a harmless guaranteed-matched command (`helm upgrade fake ./nope`),
//     NEVER `kubectl apply` against a real kube-context.
//   - The A1 install is scoped to a throwaway mkdtemp repo with `--scope local`, and `afterAll`
//     cleans up (uninstall + marketplace remove + rmSync) so the developer's real claude config is
//     not polluted.
//
// THIS HARNESS NEVER FLIPS A UAT FILE. A UAT status flips to passed/resolved only from a real run's
// captured output, done by a human / the verifier — never by this test (Plan 03a/03b owns that).
//
// dev/CI-only: the `claude` CLI + auth is a developer/CI prerequisite, NEVER a host runtime
// dependency. This lane is kept OUT of the default `npm test` green path via the `test:e2e` script,
// so CI stays green-without-a-key — the loud-skip is the designed CI fallback, never a CI secret.
//
// Node stdlib ONLY — node:child_process, node:fs, node:os, node:path. Zero npm deps.
// Vitest globals:false (the repo default) → import test fns explicitly.
//
// Findings are written in CLEAR PROFESSIONAL VOICE (CLAUDE.md hard rule — this is a safety/trace
// surface, never caveman voice).

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, cpSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Repo root = this file's parent's parent (scripts/e2e/ -> repo root).
const ROOT = join(import.meta.dirname, "..", "..");

// The frozen safety env var. It is referenced here ONLY to assert it is NEVER set — never assigned,
// never injected via `env:`. The A2-live deny fires BECAUSE this variable is absent.
const APPROVAL = "GRUGOPS_PROD_DEPLOY_APPROVED";

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// The honesty gate — a STUBBABLE, EXPORTED probe + the single loud-skip decision point.
//
// Factored out (not buried inline) so the loud-skip path can itself be unit-tested (BLOCKER 2): the
// `-t "loud-skip"` test passes `() => false` to force the unavailable branch and asserts the exact
// marker. This is the single place the skip decision + marker live, so the probe is stubbable.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

// EXACT distinct sentinel — frozen as an exported const so the proving test asserts it byte-for-byte.
export const LOUD_SKIP_MARKER =
  "SKIPPED: claude CLI absent or unauthed — UAT A1/A2/A3 NOT exercised; status stays pending";

// claudePresentAndAuthed — the deterministic, side-effect-free "present AND authed" probe.
// Cloned from 19-RESEARCH §A: `command -v claude` for presence, then `claude auth status --json`
// (exit 0 = logged in / 1 = not), JSON.parse(...).loggedIn === true, fail-closed catch → false.
// Fail-closed means an inconclusive probe loud-skips, never silently greens.
export function claudePresentAndAuthed(): boolean {
  try {
    // present? Probe the CLI directly with an arg array (no shell:true — avoids the DEP0190 shell
    // hazard and needs no untrusted input). `claude --version` exits 0 when the binary resolves on
    // PATH and a non-null status; an ENOENT spawn leaves status null and sets error → fail-closed.
    const which = spawnSync("claude", ["--version"], { encoding: "utf8", input: "", timeout: 20_000 });
    if (which.status !== 0 || which.error != null) return false;
    // authed? deterministic, no API call, no token spend. Arg-array spawn (no shell on the data path).
    const auth = spawnSync("claude", ["auth", "status", "--json"], { encoding: "utf8", input: "", timeout: 20_000 });
    if (auth.status !== 0) return false; // exit 1 = not logged in
    return JSON.parse(auth.stdout)?.loggedIn === true; // belt-and-suspenders
  } catch {
    return false; // fail-closed → loud skip, never green
  }
}

// emitLoudSkipIfUnavailable — the SINGLE skip-decision + marker-emission point.
// Returns `true` when present+authed (the caller runs the live cases). When `false`, it emits the
// EXACT distinct LOUD_SKIP_MARKER via console.warn (and process.stderr) and returns `false`. The
// probe defaults to the real one but is injectable so a test can force the unavailable branch.
export function emitLoudSkipIfUnavailable(
  probe: () => boolean = claudePresentAndAuthed,
): boolean {
  if (probe()) return true;
  // LOUD skip: a distinct marker on a non-default channel so it can never be mistaken for a pass.
  console.warn(LOUD_SKIP_MARKER);
  process.stderr.write(`${LOUD_SKIP_MARKER}\n`);
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// BLOCKER 2 — the test-of-the-test: PROVE the loud-skip path.
//
// Forcing the probe false must (a) return false AND (b) emit the EXACT sentinel. This proves a
// correct loud-skip is DISTINGUISHABLE from a forbidden silent `it.skip` (both otherwise exit 0).
// Tagged "loud-skip" so it is runnable by name: `vitest run … -t "loud-skip"`.
// ─────────────────────────────────────────────────────────────────────────────────────────────────
describe("loud-skip path (BLOCKER 2 — the honesty keystone is proven, not assumed)", () => {
  it("loud-skip: forcing the probe false returns false AND emits the EXACT LOUD_SKIP_MARKER (never a silent skip)", () => {
    // Capture console.warn so we can assert the marker was emitted on the loud channel.
    const warned: string[] = [];
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]): void => {
      warned.push(args.map(String).join(" "));
    };
    try {
      const ran = emitLoudSkipIfUnavailable(() => false); // force the unavailable branch
      // (a) the helper returned false — the caller will NOT run live assertions (no silent green).
      expect(ran).toBe(false);
      // (b) the EXACT distinct sentinel was emitted byte-for-byte (a silent skip would emit nothing).
      expect(warned.join("\n")).toContain(LOUD_SKIP_MARKER);
    } finally {
      console.warn = originalWarn;
    }
  });

  it("loud-skip: a present+authed probe returns true and emits NO skip marker (live cases would run)", () => {
    const warned: string[] = [];
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]): void => {
      warned.push(args.map(String).join(" "));
    };
    try {
      const ran = emitLoudSkipIfUnavailable(() => true); // force the available branch
      expect(ran).toBe(true);
      // No skip marker when the gate is open — the marker is reserved for the genuine skip.
      expect(warned.join("\n")).not.toContain(LOUD_SKIP_MARKER);
    } finally {
      console.warn = originalWarn;
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// The gated live E2E lane.
//
// Decide ONCE, at module load, whether the live cases run. When the gate is closed the loud skip is
// emitted here (so it shows even if no live `it()` runs), and each live case becomes an explicit
// `it.skip` whose name records WHY — but the suite's honesty rests on the loud marker above, not on
// the quiet vitest skip. A skip never flips a UAT and is never read as a pass.
// ─────────────────────────────────────────────────────────────────────────────────────────────────
const LIVE = emitLoudSkipIfUnavailable();

// One throwaway scope for the whole live lane; cleaned in afterAll regardless of pass/fail.
let tmpRepo = "";

// Per-call budget for agentic `claude -p` sessions. Configurable via env so a longer real run can
// resolve the heavier A1/A3 cases (a full planning / take-it-to-a-PR session can take minutes)
// without editing the harness; defaults to a generous 300s. A timed-out call returns partial output
// and the marker assertion fails honestly — the UAT cell stays pending, never fabricated.
const CALL_TIMEOUT_MS = Number(process.env.UAT_E2E_CALL_TIMEOUT_MS) || 300_000;

// Helper: run the real `claude` CLI in print mode with arg arrays (never shell:true on the data
// path — ASVS V5 / command-injection). Returns combined stdout for marker assertions.
function claudePrint(args: string[], cwd: string): { status: number | null; out: string } {
  const r = spawnSync("claude", args, {
    cwd,
    encoding: "utf8",
    // process.env is passed through UNCHANGED — the harness explicitly never injects the approval
    // var. (No `[APPROVAL]: …` key appears anywhere in this file by design.)
    env: { ...process.env },
    // Close stdin (EOF) so an interactive CLI prompt can NEVER hang the harness; bound each call so
    // a stuck `claude` cannot block the suite indefinitely (a timed-out call returns its partial
    // output and the marker assertion fails honestly — the UAT cell stays pending, never fabricated);
    // raise maxBuffer so a verbose `--output-format json` agent transcript is not truncated.
    input: "",
    timeout: CALL_TIMEOUT_MS,
    maxBuffer: 10 * 1024 * 1024,
  });
  return { status: r.status, out: `${r.stdout ?? ""}\n${r.stderr ?? ""}` };
}

afterAll(() => {
  if (!LIVE) return; // nothing was installed/scaffolded
  // Clean up the plugin install + marketplace so the dev's real claude config is not polluted
  // (Pitfall 3). Best-effort: cleanup failures must not mask a test result.
  try {
    spawnSync("claude", ["plugin", "uninstall", "grugops", "--scope", "local"], {
      cwd: tmpRepo || ROOT,
      encoding: "utf8",
      input: "",
      timeout: 60_000,
    });
  } catch {
    /* best-effort */
  }
  try {
    spawnSync("claude", ["plugin", "marketplace", "remove", "grugops", "--scope", "local"], {
      cwd: tmpRepo || ROOT,
      encoding: "utf8",
      input: "",
      timeout: 60_000,
    });
  } catch {
    /* best-effort */
  }
  if (tmpRepo && existsSync(tmpRepo)) {
    rmSync(tmpRepo, { recursive: true, force: true });
  }
});

describe("Tier-2 live E2E against the real claude CLI (gated on present+authed)", () => {
  // A1 — plugin-cache pointer resolution (D-31).
  it.skipIf(!LIVE)(
    "A1 (D-31): /grugops:plan resolves repo-relative pointers and produces planning output, not a cache path error",
    () => {
      // Scaffold a throwaway repo: mkdtemp + copy agent-factory/ + a minimal AGENTS.md in.
      tmpRepo = mkdtempSync(join(tmpdir(), "grugops-uat-e2e-"));
      cpSync(join(ROOT, "agent-factory"), join(tmpRepo, "agent-factory"), { recursive: true });
      mkdirSync(join(tmpRepo, "plans", "handoffs"), { recursive: true });
      writeFileSync(
        join(tmpRepo, "AGENTS.md"),
        "# grugops — start here\n\nStart at `agent-factory/roles/orchestrator.md` and act as the Orchestrator.\n",
      );

      // Install the plugin form headlessly, scoped to the throwaway repo (Pitfall 3: --scope local).
      // The marketplace source is the local path to THIS repo (Open Q2: prefer the local `./` form;
      // the plugin-cache copy this triggers IS the D-31 condition under test).
      spawnSync("claude", ["plugin", "marketplace", "add", ROOT, "--scope", "local"], {
        cwd: tmpRepo,
        encoding: "utf8",
        input: "",
        timeout: 60_000,
      });
      spawnSync("claude", ["plugin", "install", "grugops@grugops", "--scope", "local"], {
        cwd: tmpRepo,
        encoding: "utf8",
        input: "",
        timeout: 60_000,
      });

      // Open Q1: probe BOTH the colon slash-command form AND the --plugin-dir ./ fallback; lock
      // whichever fires. Assert planning/Orchestrator markers PRESENT and the path-error substring
      // ABSENT. On NEITHER, fail loudly (never a silent pass).
      const REQUEST = "/grugops:plan add a GET /version endpoint";
      const markerRe = /orchestrator|planning|plan|ticket/i;
      // A plugin-cache path error is the D-31 failure signature: a "no such file"/path error that
      // points into the plugin cache instead of resolving against the user's repo.
      const pathErrorRe = /no such file|cannot find|ENOENT|file not found|plugins?[\\/].*cache/i;

      const primary = claudePrint([
        "-p",
        REQUEST,
        "--output-format",
        "json",
      ], tmpRepo);

      let fired = markerRe.test(primary.out) && !pathErrorRe.test(primary.out);
      let used = primary.out;

      if (!fired) {
        // Fallback form (Open Q1): load the plugin for one session via --plugin-dir ./.
        const fallback = claudePrint([
          "--plugin-dir",
          ROOT,
          "-p",
          "add a GET /version endpoint, plan it",
          "--output-format",
          "json",
        ], tmpRepo);
        fired = markerRe.test(fallback.out) && !pathErrorRe.test(fallback.out);
        used = fallback.out;
      }

      // Inconclusive-loud, never a silent pass: if neither form produced planning markers without a
      // path error, surface the captured output and fail.
      expect(
        fired,
        `D-31: neither /grugops:plan nor --plugin-dir ./ produced planning markers without a cache path error. Captured: ${used.slice(0, 400)}`,
      ).toBe(true);
    },
  );

  // A2-live — SAFE-02 live deny (V14). NEVER sets the approval var; harmless matched probe only.
  it.skipIf(!LIVE)(
    "A2-live (SAFE-02 / V14): a harmless matched deploy probe is DENIED because the approval var is absent",
    () => {
      // Guard the harness's own honesty: the approval var must NOT be present in this process env.
      // (We assert it; we never set it. If a developer has it exported, skip-loud rather than run a
      // test that would falsely "pass" by allowing the command.)
      if (process.env[APPROVAL] != null) {
        console.warn(
          `SKIPPED A2-live: ${APPROVAL} is set in this environment — refusing to run a deny test that would not deny. Unset it and re-run.`,
        );
        return;
      }

      // Harmless guaranteed-matched probe (Pitfall 4): `helm upgrade fake ./nope` matches the guard's
      // deploy pattern but targets nothing real — NEVER `kubectl apply` against a live kube-context.
      const r = claudePrint([
        "-p",
        "run this exact command: helm upgrade fake ./nope",
        "--output-format",
        "json",
      ], tmpRepo || ROOT);

      // The clear-voice deny string the guard emits (frozen, from hooks/guard.ts).
      const DENY = "Production deploy blocked: humans decide, agents execute.";
      expect(
        r.out.includes(DENY),
        `SAFE-02: expected the clear-voice deny string to appear. Captured: ${r.out.slice(0, 400)}`,
      ).toBe(true);
    },
  );

  // A3-live — dual-path parity (DOG-02). Same ticket, both dispatch paths; diff filenames + verdict.
  it.skipIf(!LIVE)(
    "A3-live (DOG-02): the same ticket through sequential and sub-agent dispatch yields the same handoff filenames + gate verdict",
    () => {
      const TICKET = "implement ABC-001: add a GET /version endpoint and take it to a PR";
      // Frozen artifacts the two paths must agree on (examples/03-ticket-to-pr.md).
      const FROZEN_HANDOFFS = ["implementation-handoff.md", "qe-handoff.md"];
      const FROZEN_VERDICT = "READY_FOR_HUMAN_REVIEW";

      // Sequential path: drive via the AGENTS.md → orchestrator.md role-load (plain prompt).
      const sequential = claudePrint([
        "-p",
        `Act as the grugops Orchestrator per AGENTS.md. ${TICKET}`,
        "--output-format",
        "json",
      ], tmpRepo || ROOT);

      // Sub-agent dispatch path: drive via the /grugops skill (the plugin sub-agent dispatch).
      const subagent = claudePrint([
        "-p",
        `/grugops ${TICKET}`,
        "--output-format",
        "json",
      ], tmpRepo || ROOT);

      // Parity: BOTH paths must name the SAME frozen handoff filenames and the SAME gate verdict.
      // Only the dispatch differs — the content does not.
      for (const handoff of FROZEN_HANDOFFS) {
        const inSeq = sequential.out.includes(handoff);
        const inSub = subagent.out.includes(handoff);
        expect(
          inSeq && inSub,
          `DOG-02 parity: handoff "${handoff}" must appear in BOTH dispatch paths (seq=${inSeq}, sub=${inSub}).`,
        ).toBe(true);
      }
      const seqVerdict = sequential.out.includes(FROZEN_VERDICT);
      const subVerdict = subagent.out.includes(FROZEN_VERDICT);
      expect(
        seqVerdict && subVerdict,
        `DOG-02 parity: gate verdict "${FROZEN_VERDICT}" must appear in BOTH dispatch paths (seq=${seqVerdict}, sub=${subVerdict}).`,
      ).toBe(true);
    },
  );
});
