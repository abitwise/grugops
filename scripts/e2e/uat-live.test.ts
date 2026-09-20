// uat-live.test.ts — the Tier-2 GATED live lane, in its thin-wrapper form (Phase 33, D-08).
//
// This file drives nothing. The ONE runner, scripts/capture-live.ts (committed twin
// scripts/capture-live.js), performs the install onto the fixture project, the two bounded headless
// runs of the real `claude` CLI, the redaction, the summary derivation and the outcome line. This
// lane invokes that runner as a child with an arg array and asserts over the ARTIFACT it wrote —
// the capture summary — never over the child's standard output. The artifact is what gets committed
// and reviewed; a lane that asserted on stdout would be asserting on bytes nobody files.
//
// What the summary assertions cover, mapped onto the historical case names so the ledger rows that
// cite them still resolve:
//
//   A1      (D-31)  plugin-cache pointer resolution — the summary's plugin load report names the
//                   plugin that loaded from the cache and records no plugin_errors.
//   A2-live (SAFE-02 / V14)  live PreToolUse deny — the summary's deny observation row records the
//                   prod-deploy deny as observed in a hook_response.stdout field (the CLI-emitted
//                   channel, D-04), with the approval variable absent from the child environment.
//   A3-live (DOG-02) dual-path dispatch parity — the summary's D-02 verdict holds in BOTH runs and
//                   the D-07 equivalence diff list is empty.
//   A3-live-N (DOGF-02) is no longer a case in this lane. Its deterministic gating proof is
//                   scripts/worktree-dogfood.test.ts (unchanged); the runner's request routes work
//                   to role agents and the D-02 predicate over the transcript is the live claim.
//
// THE HONESTY KEYSTONE (Constraint #6):
// Every live assertion is gated behind a `claude auth status` probe (present AND authed). When the
// CLI is absent or unauthed the harness emits a LOUD, DISTINCTLY-MARKED skip (the exact exported
// LOUD_SKIP_MARKER sentinel via console.warn) and NEVER reports a silent green and NEVER flips a UAT
// file. A skip is NOT a pass — the UAT stays pending. The loud-skip path is itself PROVEN below by a
// `-t "loud-skip"` test that forces the probe false and asserts the exact sentinel, so a correct
// loud-skip is distinguishable from a forbidden silent `it.skip` (both otherwise exit 0). A loud
// skip is never a capture: in the skipped state this file invokes no runner, writes no artifact
// directory, and accepts no summary.
//
// SAFETY (mirrors docs/dogfood-human-runbook.md, non-negotiable):
//   - The harness NEVER sets or exports the prod-deploy approval variable (V14 — the self-approve
//     keystone). Its name is imported from the deny matcher as PROD_DEPLOY_REASON_SIGNATURE; this
//     file carries no literal spelling and no assignment of it, and the environment OBJECT handed to
//     the runner child is asserted not to define it at run time, before the spawn.
//   - The deny probe the runner makes is the harmless guaranteed-matched command
//     (`helm upgrade fake ./nope`), NEVER `kubectl apply` against a real kube-context.
//   - The runner installs the plugin at local scope into mkdtemp targets it removes itself; this
//     file's `afterAll` keeps the lane's own best-effort cleanup so the developer's real claude
//     config is not polluted even when the runner dies mid-way.
//
// THIS HARNESS NEVER FLIPS A UAT FILE. A UAT status flips to passed/resolved only from a real run's
// captured output, done by a human / the verifier — never by this test (plan 33-11 owns the flip).
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
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
// The approval variable's NAME, imported from the single-source deny matcher so this file spells it
// nowhere. It is referenced ONLY to assert it is absent from the environment handed to the runner.
import { PROD_DEPLOY_REASON_SIGNATURE } from "../prod-deploy-deny-match.js";
// The runner's own surface: artifact names, the frozen outcome-line grammar, the run labels. Imported
// from the committed .js twin (matching how this file imports other committed .js), so the wrapper
// and the runner cannot disagree about what the summary is called or how its outcome line reads.
import {
  CAPTURE_SUMMARY_NAME,
  OUTCOME_LINE_RE,
  OUTCOME_LINE_SCAN_RE,
  RUN_LABELS,
  captureTranscriptName,
} from "../capture-live.js";

// Repo root = this file's parent's parent (scripts/e2e/ -> repo root).
const ROOT = join(import.meta.dirname, "..", "..");
const RUNNER = join(ROOT, "scripts", "capture-live.js");

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
    // present? Probe the CLI directly with an arg array (no shell — avoids the DEP0190 shell
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

// One throwaway scope for the whole live lane; cleaned in afterAll regardless of pass/fail. It is
// the runner's artifact destination unless UAT_E2E_ARTIFACT_DIR names one (see `artifactDir`).
let tmpRepo = "";

// Per-call budget for agentic `claude -p` sessions. Configurable via env so a longer real run can
// resolve the heavier A1/A3 cases (a full planning / take-it-to-a-PR session can take minutes)
// without editing the harness; defaults to a generous 300s. A timed-out call returns partial output
// and the marker assertion fails honestly — the UAT cell stays pending, never fabricated.
const CALL_TIMEOUT_MS = Number(process.env.UAT_E2E_CALL_TIMEOUT_MS) || 300_000;

// liveTimeoutMs — DERIVE the runner case's vitest per-test timeout FROM CALL_TIMEOUT_MS so the two
// bounds can never desync again (A1 fix). vitest cannot interrupt the synchronous spawnSync that
// waits on the runner, so a per-test bound below the runner's own would report a timeout yet block
// for the runner's full duration. The `it()` 4th-arg per-test timeout (the in-repo idiom,
// worktree-dogfood.test.ts:210) is the fix. `nClaudeCalls` = the number of platform calls the runner
// makes (one per run label); `extraMs` folds in the runner's fixed-budget precheck, installs and
// plugin operations. Raising the bound raises BOTH numbers together (constraint 5).
function liveTimeoutMs(nClaudeCalls: number, extraMs = 0): number {
  return nClaudeCalls * CALL_TIMEOUT_MS + extraMs;
}

// artifactDir — where the runner is told to write the summary and the redacted transcripts. The
// scratch directory by default, removed in afterAll. UAT_E2E_ARTIFACT_DIR, when set, names a
// directory that is NOT removed, so a red live run leaves its artifacts on disk to be filed and
// diagnosed at zero tokens (D-11) instead of vanishing with the scratch. The value reaches the
// runner only as one element of an arg array — never through a shell.
function artifactDir(): string {
  const named = process.env.UAT_E2E_ARTIFACT_DIR;
  return named !== undefined && named !== "" ? named : tmpRepo;
}

// The summary text, read once by the runner case and shared with the assertion cases below. It is
// `null` until the runner has written the artifact; every assertion case refuses a null rather than
// treating an absent summary as anything but a red (a loud skip or a dead runner is never a capture).
let summaryText: string | null = null;

function requireSummary(): string {
  if (summaryText === null) {
    throw new Error(
      `no capture summary was read — the runner case did not complete (${CAPTURE_SUMMARY_NAME} absent under ${artifactDir() || "(no artifact directory)"}); an absent summary is a red, never a pass`,
    );
  }
  return summaryText;
}

// Markdown table rows are the summary's machine-readable cells (the runner's --verify-artifacts
// keys on the same shape). A row is `| label | value | ... |`; this returns the trimmed cells of the
// first row whose first cell equals `label`, or null. No markdown heading is read anywhere in this
// file: locating a section by its heading is a predicate LANG-07 holds to exactly one owner.
function tableRow(text: string, label: string): string[] | null {
  for (const line of text.split(/\r?\n/)) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").map((c) => c.trim()).slice(1, -1);
    if (cells.length > 0 && cells[0] === label) return cells;
  }
  return null;
}

// Helper: run the runner as a child with an arg array (never a shell on the data path — ASVS V5 /
// command-injection). The environment object handed to the child is CONSTRUCTED here, asserted at
// run time not to define the approval variable, and passed through otherwise unchanged. Returns the
// exit status plus combined output for DIAGNOSTIC messages only — no assertion below reads it.
function runRunner(args: string[], boundMs: number): { status: number | null; out: string } {
  const env: NodeJS.ProcessEnv = { ...process.env };
  // The run-time form of the safety rule: not "no line in this file sets it" but "the object the
  // child receives does not define it". A developer who exported it gets a red here, not a run
  // whose deny could not fire.
  expect(
    Object.prototype.hasOwnProperty.call(env, PROD_DEPLOY_REASON_SIGNATURE),
    `the environment handed to the runner defines the prod-deploy approval variable; this lane refuses to spawn a run whose deny could not fire. Unset it in the shell that launches vitest.`,
  ).toBe(false);
  const r = spawnSync("node", [RUNNER, ...args], {
    cwd: ROOT,
    encoding: "utf8",
    env,
    // Close stdin (EOF) so an interactive prompt can NEVER hang the harness; bound the child so a
    // stuck runner cannot block the suite indefinitely; raise maxBuffer so the runner's phase log
    // is not truncated.
    input: "",
    timeout: boundMs,
    maxBuffer: 16 * 1024 * 1024,
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

describe("Tier-2 live E2E — a thin wrapper over scripts/capture-live.js (gated on present+authed)", () => {
  // The one live invocation. Everything below asserts over the summary this case leaves behind; no
  // case makes a second platform call (D-09: at most one live run per round).
  it.skipIf(!LIVE)(
    "the runner completes and writes a summary closing with exactly one grammar-conformant outcome line reading pass",
    () => {
      tmpRepo = mkdtempSync(join(tmpdir(), "grugops-uat-e2e-"));
      const out = artifactDir();
      const r = runRunner(["--out", out], liveTimeoutMs(RUN_LABELS.length, 20 * 60_000));

      // The artifact, not the stdout, is the subject. The tail of the child's output rides along in
      // the failure message only, so a dead runner's `CAPTURE NOT DERIVED: …` line is in front of
      // the reader without being asserted on.
      const summaryPath = join(out, CAPTURE_SUMMARY_NAME);
      expect(
        existsSync(summaryPath),
        `the runner (exit ${String(r.status)}) left no ${CAPTURE_SUMMARY_NAME} under ${out}; a run that writes no artifact is a red. Runner output tail: ${r.out.slice(-600)}`,
      ).toBe(true);
      summaryText = readFileSync(summaryPath, "utf8");

      // D-11: exactly one outcome line matching the frozen grammar, and its word is `pass`. A `fail`
      // or `hang` is recorded by the runner and reds this lane; it is diagnosed at zero tokens, never
      // re-run inside the round.
      const outcomeLines = summaryText.match(OUTCOME_LINE_SCAN_RE) ?? [];
      expect(outcomeLines, `the summary carries ${outcomeLines.length} outcome line(s); exactly one is required`).toHaveLength(1);
      const outcomeLine = outcomeLines[0] ?? "";
      const word = outcomeLine.match(OUTCOME_LINE_RE)?.[2];
      expect(word, `the outcome line reads \`${outcomeLine}\`; the lane is green only on pass. Outcome reason: ${(summaryText.match(/^Outcome reason: .*$/m) ?? ["(none recorded)"])[0]}`).toBe("pass");

      // Every transcript the summary names is on disk beside it (redacted by the runner).
      for (const label of RUN_LABELS) {
        expect(existsSync(join(out, captureTranscriptName(label))), `${captureTranscriptName(label)} is missing under ${out}`).toBe(true);
      }
    },
    // RUN_LABELS.length platform calls inside the runner, each under CALL_TIMEOUT_MS, plus the
    // runner's own fixed budgets around them: the coordinator precheck (180 s), two installer runs
    // (120 s each), two plugin installs and two uninstalls (120 s each), the version/help/list
    // probes (20 s each) and the SIGINT-to-SIGTERM grace (30 s per run) — about 18 minutes summed,
    // rounded up to 20 minutes of headroom.
    liveTimeoutMs(RUN_LABELS.length, 20 * 60_000),
  );

  // A2-live — SAFE-02 live deny (V14), read from the CLI-emitted hook_response channel (D-04).
  it.skipIf(!LIVE)(
    "A2-live (SAFE-02 / V14): the summary records the prod-deploy deny as observed in a hook_response.stdout field, with the approval variable absent from the child environment",
    () => {
      const summary = requireSummary();
      // The runner's own record of the rule this lane asserted at spawn time.
      const approval = tableRow(summary, "approval key in child env");
      expect(approval, "the summary carries no `approval key in child env` row").not.toBeNull();
      expect(approval?.[1].startsWith("absent"), `approval key row reads: ${approval?.[1]}`).toBe(true);
      // The deny observation row, once per run; the summary is a pass only if the runner saw the
      // deny, so this is the specific reason a red would name.
      const denyRows = summary
        .split(/\r?\n/)
        .filter((l) => l.startsWith("| D-04 prod-deploy deny observed in a hook_response.stdout |"));
      expect(denyRows.length, "the summary carries no D-04 deny observation row").toBeGreaterThan(0);
      expect(
        denyRows.some((l) => l.split("|").map((c) => c.trim())[2]?.startsWith("yes")),
        `no run's D-04 row reads yes — rows: ${denyRows.join(" // ")}`,
      ).toBe(true);
    },
  );

  // A1 — plugin-cache pointer resolution (D-31), from the summary's plugin load report (D-05).
  it.skipIf(!LIVE)(
    "A1 (D-31 / D-05): the summary's plugin load report names a loaded plugin and records no plugin_errors",
    () => {
      const summary = requireSummary();
      const loaded = tableRow(summary, "D-05 plugins loaded per system/init");
      expect(loaded, "the summary carries no `D-05 plugins loaded per system/init` row").not.toBeNull();
      expect(loaded?.[1], "the init frame listed no plugin — the plugin form did not load").not.toBe("none listed");
      const errors = tableRow(summary, "D-05 plugin_errors per system/init");
      expect(errors, "the summary carries no `D-05 plugin_errors per system/init` row").not.toBeNull();
      expect(errors?.[1], `plugin_errors were recorded: ${errors?.[1]}`).toBe("none");
      const sha = tableRow(summary, "installed plugin sha (D-05, post hoc)");
      expect(sha, "the summary carries no installed-plugin-sha row").not.toBeNull();
    },
  );

  // A3-live — dual-path DISPATCH parity (DOG-02) on the D-05 (Phase 26) equivalence artifact, and
  // the two-sided CAP-03 verdict (D-02) in both runs.
  it.skipIf(!LIVE)(
    "A3-live (DOG-02, D-02, D-07): the two-sided verdict holds in both runs and the equivalence diff list is empty",
    () => {
      const summary = requireSummary();
      const lines = summary.split(/\r?\n/);
      // The runner writes this exact bullet once per run when no named reason remains, and one
      // bullet per reason otherwise. Both runs must hold; a one-sided capture is a red with a
      // named reason (D-02), which surfaces here as a count below the run count.
      const holds = lines.filter((l) => l === "- both sides hold: no named reason remains").length;
      expect(holds, `the CAP-03 verdict holds in ${holds} of ${RUN_LABELS.length} run(s)`).toBe(RUN_LABELS.length);
      // D-07: assertEquivalent over the two targets' context roots returned no diff.
      expect(
        lines.includes("- assertEquivalent over the two targets' context roots returned no diff"),
        "the summary records a dual-path divergence (D-20: a real divergence is a kit finding; nothing flips until parity holds)",
      ).toBe(true);
    },
  );

  // The runner's own after-the-fact re-check over the artifacts it wrote (hard rule 7): every claim
  // row cited within its transcript, no home-path spelling surviving, exactly one outcome line.
  it.skipIf(!LIVE)(
    "--verify-artifacts accepts the artifact set the run wrote",
    () => {
      requireSummary();
      const r = runRunner(["--verify-artifacts", "--out", artifactDir()], 60_000);
      expect(r.status, `--verify-artifacts refused the artifact set: ${r.out.slice(-800)}`).toBe(0);
    },
  );
});
