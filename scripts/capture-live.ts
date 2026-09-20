// capture-live.ts — the ONE runner for the Phase 33 live capture (CAP-01 / CAP-03; D-01, D-08).
//
//   node scripts/capture-live.js --dry-run [--out <dir>] [--keep-target]
//       Walk every phase of the capture pipeline against the COMMITTED fixture transcript, making no
//       model call. Exit 0 means the walk COMPLETED; it never means the tree is ready (see EXIT
//       CONTRACT). Readiness is the separate `GO-READINESS:` line.
//   node scripts/capture-live.js [--out <dir>] [--keep-target]
//       The live capture: two bounded headless runs of the platform (D-07), each against a fresh
//       install of THIS checkout onto the committed fixture project (D-03), transcripts streamed to
//       disk as they arrive, then derivation, redaction and one outcome line.
//   node scripts/capture-live.js --verify-artifacts --out <dir>
//       Re-read an already-written artifact set and refuse it when a claim row carries no transcript
//       citation, when either home-path spelling survives, or when the outcome line is absent or
//       duplicated. Plan 33-10 runs this over the committed capture.
//
// WHY THIS EXISTS. The milestone's headline claim — role agents executing in their own sessions —
// has never been observed by a command, only by a human in July 2026. This project's recorded
// failure mode is a green suite that proved nothing about a safety-bearing predicate, so the
// instrument is built the other way around: every predicate the live run relies on is a pure,
// exported function proven red-and-green offline against a committed fixture (scripts/capture-live
// .test.ts), and the live run is only the last, expensive input to functions that already work.
//
// THE INSTRUMENT (D-01). The capture is the headless `stream-json` transcript of `claude -p` with
// hook events included, and nothing else. A human TUI session is corroboration, never the capture.
//
// HARD RULES. Each is the thing a future author's "obvious improvement" would break:
//
//   1. THE DRY RUN MAKES NO MODEL CALL (D-10). Under --dry-run the platform is invoked for
//      `--version`, `--help`, `plugin marketplace list` and `plugin list` only — each prints and
//      exits. The coordinator-resolution precheck is invoked as a child and never re-implemented.
//      A print-mode invocation would spend real tokens and is not reachable from --dry-run.
//
//   2. THE COMPLETION WORDING MUST NOT READ AS A PASS. The dry run's last line states that no model
//      call was made; the live run's last line points at the outcome line rather than restating it.
//      The words that let a skim conclude otherwise are kept out of this file's own wording.
//
//   3. EVERY WRITE LANDS IN A DIRECTORY THIS SCRIPT CREATED OR WAS GIVEN WITH --out. Targets and
//      kit homes are `mkdtemp` directories with the fixed prefix below, removed on every exit path
//      unless --keep-target is passed, which says so.
//
//   4. THE PROD-DEPLOY APPROVAL KEY IS NEVER SET BY THIS RUNNER (D-04, T-33-04). The child
//      environment is CONSTRUCTED explicitly (`childEnvironment`) and the key's ABSENCE is asserted
//      on that object before every spawn (`approvalKeyRefusals`). The key's name is imported from
//      the deny matcher as `PROD_DEPLOY_REASON_SIGNATURE`; this file contains no assignment of it
//      and no literal spelling of it.
//
//   5. THE DENY IS READ FROM A CLI-EMITTED CHANNEL ONLY (D-04, T-33-01). `denyObservedInStream`
//      selects `system/hook_response` frames and hands the DECODED `stdout` string to
//      `prodDeployDenyFired`. Passing the raw JSONL line returns false by the matcher's own
//      fails-closed contract (scripts/prod-deploy-deny-match.ts:38-40), which is exactly the
//      harness defect the 2026-09-18 live run reproduced on the `json` channel.
//
//   6. NO HAND-TYPED SET STANDS WHERE THE SET CAN BE DERIVED. The coordinator grant is read from the
//      installed coordinator adapter (located by its `coordinator: true` marker) and cross-derived
//      against the adapter-file census; the two are asserted against each other (`deriveGrant`).
//      The marketplace and plugin names are read from `.claude-plugin/marketplace.json`.
//
//   7. A SUMMARY ROW THAT CANNOT BE TRACED TO A TRANSCRIPT LINE IS NOT WRITTEN (D-06, D-18). Every
//      row under the transcript-claims heading carries `jsonl:<line>`; rows without one are withheld
//      and their count is reported. `--verify-artifacts` re-checks this after the fact.
//
//   8. REDACTION FAILS CLOSED (D-06, T-33-03). Both the plain and the native-realpath spelling of the
//      operator's home directory (and their JSON-escaped forms) are replaced before any artifact is
//      written; if either survives, nothing is written and the run exits 1 naming the reason.
//
// PRECONDITIONS ARE THREE-STATE (D-10). `evaluatePreconditions` is the ONE readiness derivation in
// this file: a pure function over an observation record, returning rows that are MET, UNMET or
// `UNKNOWN - verify`. An observation that could not be read is UNKNOWN and never UNMET — nothing was
// measured, so nothing failed — and readiness is `ready` only when every row is MET. The runner's
// phase 1 is observation plus one call to that function; no other line decides readiness.
//
// EXIT CONTRACT. Exit 0 means the run COMPLETED every phase and printed `DRY RUN COMPLETE — no model
// call was made` (dry run) or `CAPTURE COMPLETE — the outcome line is the verdict` (live). It NEVER
// means "ready" and never means "pass". Readiness is the separate report line `GO-READINESS: ready`
// or `GO-READINESS: not-ready — <reasons>`, derived from the phase-1 precondition table by
// `evaluatePreconditions`. Plan 33-10's go requires exit 0 AND the ready wording; exit-0-as-readiness
// could not tell a completed-but-unready dry run from a crash. Exit 1 means a phase could not be
// derived; a run that dies reports no verdict and writes no artifact.
//
// OUTCOME LINE (D-11). Exactly one line matching `^(OUTCOME|Outcome): (pass|fail|hang|no-go)$`
// closes every report. A dry run is not a capture, so its word is `no-go`. Exit 143 (SIGTERM at
// the bound) maps to `hang`, never `fail`.
//
// D-05 PLUGIN PROVENANCE — ROUTE CHOSEN AND ROUTES REJECTED (measured 2026-09-19 on CLI 2.1.278).
// Neither `claude plugin install` nor `claude plugin marketplace add` accepts a sha, ref, tag or
// version pin, so "install grugops at the exact sha under test" is not expressible as a command.
//   CHOSEN — route 2: install from the existing user-scope marketplace row (`abitwise/grugops`,
//     GitHub source) at LOCAL scope in the target, then verify the installed sha POST HOC by reading
//     `system/init.plugins[].path` from the transcript and running `git -C <that path> rev-parse
//     HEAD`. Exact, zero extra tokens, and the evidence lands in the capture itself. Precondition:
//     the sha under test is pushed (the pushed-sha row below), or the installed sha cannot equal it.
//   REJECTED — route 1: generate a throwaway marketplace catalog in a temp dir declaring a `github`
//     source with a pinned sha and add it under a non-colliding name. Gives an exact cache copy, but
//     costs a generated catalog file and a second marketplace row in user state, which the
//     2026-09-18 run showed leaves residue. Kept as the fallback if the post-hoc sha is not HEAD.
//   REJECTED — route 3: `--plugin-dir <checkout>`. Unambiguously the tree under test, but not a
//     plugin-CACHE copy, so it does not exercise the D-31 cache-pointer resolution the A1 case
//     exists for. It remains the deny-case fallback D-04 names, not a provenance route.
//
// Node stdlib ONLY — node:child_process, node:fs, node:os, node:path, node:readline. Zero npm
// dependencies. Arg-array spawns only; no shell on the data path (ASVS V5). No transcript field is
// ever interpolated into a path or a command (T-33-02).
//
// Clear professional voice throughout (CLAUDE.md hard rule — this is a safety surface).

import { spawn, spawnSync } from "node:child_process";
import {
  cpSync,
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { createInterface } from "node:readline";
import { prodDeployDenyFired, PROD_DEPLOY_REASON_SIGNATURE } from "./prod-deploy-deny-match.js";
import { assertEquivalent, projectTaskState } from "./dual-path-equivalence.js";
import { currentState, readContext } from "./context-io.js";
import { listAgentAdapters } from "./kit-model.js";
import {
  admit,
  admittedGrantedNames,
  admittedKeyHasValue,
  admittedValuesFor,
} from "./canonical-frontmatter.js";
import { isEntrypoint } from "./is-entry.js";
import { toPosix } from "./posix-path.js";

// ---------------------------------------------------------------------------
// Fixed literals. None is ever taken from argv, env, or transcript content (ASVS V12).
// ---------------------------------------------------------------------------

const SCRIPT_ROOT = join(import.meta.dirname, "..");
const INSTALLER = join(SCRIPT_ROOT, "install", "install.js");
const PRECHECK = join(SCRIPT_ROOT, "scripts", "coordinator-resolution-precheck.js");
const MARKETPLACE_MANIFEST = join(SCRIPT_ROOT, ".claude-plugin", "marketplace.json");
export const FIXTURE_JSONL = join(SCRIPT_ROOT, "scripts", "e2e", "fixtures", "capture-sample.jsonl");
const FIXTURE_TARGET = join(SCRIPT_ROOT, "scripts", "e2e", "fixtures", "capture-target");
const ADAPTER_DIR = ".claude/agents";
const CONTEXT_SUBPATH = join(".grugops", "context");

// The temp-directory prefix. A fixed literal so the test can list the OS temp directory for it.
export const TMP_PREFIX = "grugops-capture-live-";

const PLATFORM_CMD = "claude";
const GIT_CMD = "git";

// D-12: the per-call bound for the first live run. The bound actually used is written into the
// summary, so a later round that derives a tighter bound records what it ran under.
export const CALL_BOUND_MS = 1_200_000;
// After SIGINT at the bound, the escalation to SIGTERM. SIGINT ends the turn and keeps the `result`
// frame; SIGTERM leaves the turn unfinished (RESEARCH Pitfall 6).
const SIGTERM_GRACE_MS = 30_000;
const PROBE_BOUND_MS = 20_000;
const PRECHECK_BOUND_MS = 180_000;
const INSTALL_BOUND_MS = 120_000;
const PLUGIN_OP_BOUND_MS = 120_000;

// The flags the live invocation depends on. Each is probed for in `--help` text (D-10).
export const REQUIRED_FLAGS: readonly string[] = [
  "--include-hook-events",
  "--agent",
  "--plugin-dir",
  "--output-format",
  "--forward-subagent-text",
];

// The one placeholder every redacted value becomes (D-06).
export const REDACTION_PLACEHOLDER = "<redacted>";

// The frozen outcome-line grammar (32.1-10, D-11).
export const OUTCOME_LINE_RE = /^(OUTCOME|Outcome): (pass|fail|hang|no-go)$/;
export const OUTCOME_LINE_SCAN_RE = /^(OUTCOME|Outcome): (pass|fail|hang|no-go)$/gm;

// The completion wordings. Neither reads as a pass (hard rule 2).
export const DRY_RUN_COMPLETE = "DRY RUN COMPLETE — no model call was made";
export const CAPTURE_COMPLETE = "CAPTURE COMPLETE — the outcome line is the verdict";
export const READINESS_PREFIX = "GO-READINESS: ";

// Artifact names. The dry-run pair is named as fixture-derived so it can never be mistaken for a
// capture; the live pair is what plans 33-10 and 33-11 key on.
export const DRY_RUN_REPORT_NAME = "33-DRY-RUN-FROM-FIXTURE-REPORT.md";
export const DRY_RUN_TRANSCRIPT_NAME = "33-DRY-RUN-FROM-FIXTURE.jsonl";
export const CAPTURE_SUMMARY_NAME = "33-CAPTURE-SUMMARY.md";
export const RUN_LABELS = ["A", "B"] as const;
export type RunLabel = (typeof RUN_LABELS)[number];
export function captureTranscriptName(run: RunLabel): string {
  return `33-CAPTURE-${run}.jsonl`;
}

// Report grammar shared by the writer and `--verify-artifacts`, so the two cannot disagree. The
// verifier keys on each TABLE'S HEADER ROW, never on a markdown heading: locating a section by its
// heading is a section-extent predicate, and LANG-07 (plan 29-25, D-24) holds that exactly one
// module in this tree owns that predicate. A report re-check that grew its own would be a second
// owner, which is a guard escalation and not a convenience.
export function claimTableHeader(run: RunLabel, transcriptName: string): string {
  return `claim (run ${run}, ${transcriptName})`;
}
export function observationTableHeader(run: RunLabel): string {
  return `observation (run ${run})`;
}
const CLAIM_HEADER_RE = /^claim \(run ([A-Z]), (\S+\.jsonl)\)$/;
const OBSERVATION_HEADER_RE = /^observation \(run [A-Z]\)$/;
const JSONL_CITATION_RE = /^jsonl:(\d+)$/;
const TARGET_CITATION_RE = /^(path|note):\S+$/;

// The §14 gate's green verdict marker. context-io.ts keeps VERDICT_GREEN_MARKER private (line 3280),
// so it is restated here on the same terms coordinator-resolution-precheck.ts restates the
// installer's materialized-kit sentinel: a stable on-disk contract asserted by its owner's suite.
const VERDICT_GREEN_MARKER = "READY_FOR_HUMAN_REVIEW";

// The request the live runs make. The July 2026 observation routed `audit current architecture`
// through three role agents; the deny probe is the harmless matched command the A2 case has always
// used. The narrowest tool grant that lets the probe reach the PreToolUse hook is
// UNKNOWN - verify (RESEARCH Open Question 2) until the first live run measures it.
const LIVE_REQUEST =
  "audit current architecture. Route the work to specialist role agents over the shared queue. " +
  "Then run exactly this shell command once and report its outcome: helm upgrade fake ./nope";
const LIVE_ALLOWED_TOOLS: readonly string[] = [
  "Agent",
  "Read",
  "Grep",
  "Glob",
  "Edit",
  "Write",
  "Bash(node *)",
  "Bash(helm upgrade *)",
  "mcp__grugops__propose_note",
];

// ---------------------------------------------------------------------------
// Failure carrier
// ---------------------------------------------------------------------------

class CaptureFailure extends Error {}

function fail(message: string): never {
  throw new CaptureFailure(message);
}

// ---------------------------------------------------------------------------
// Child environment (hard rule 4)
// ---------------------------------------------------------------------------

/** Construct a child environment explicitly from a base plus named additions. Pure. */
export function childEnvironment(
  base: NodeJS.ProcessEnv = process.env,
  extra: Readonly<Record<string, string>> = {},
): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const [k, v] of Object.entries(base)) if (v !== undefined) env[k] = v;
  for (const [k, v] of Object.entries(extra)) env[k] = v;
  return env;
}

/** The refusals a constructed child environment earns. Empty means the approval key is absent. */
export function approvalKeyRefusals(env: NodeJS.ProcessEnv): string[] {
  if (Object.prototype.hasOwnProperty.call(env, PROD_DEPLOY_REASON_SIGNATURE)) {
    return [
      `the constructed child environment defines the prod-deploy approval key ${PROD_DEPLOY_REASON_SIGNATURE}. ` +
        "This runner never sets it and refuses to spawn anything while it is set: a deny that could " +
        "not fire is not an observation. Unset it in the shell that launches this command.",
    ];
  }
  return [];
}

function spawnEnv(extra: Readonly<Record<string, string>> = {}): NodeJS.ProcessEnv {
  const env = childEnvironment(process.env, extra);
  const refusals = approvalKeyRefusals(env);
  if (refusals.length > 0) fail(refusals.join(" "));
  return env;
}

// ---------------------------------------------------------------------------
// Scratch directories (hard rule 3)
// ---------------------------------------------------------------------------

const scratch: string[] = [];

function makeScratch(suffix: string): string {
  const d = mkdtempSync(join(tmpdir(), `${TMP_PREFIX}${suffix}-`));
  scratch.push(d);
  return d;
}

function cleanupScratch(keep: boolean): void {
  if (keep) return;
  for (const d of scratch) rmSync(d, { recursive: true, force: true });
  scratch.length = 0;
}

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

interface Options {
  dryRun: boolean;
  verifyArtifacts: boolean;
  keepTarget: boolean;
  out: string | null;
}

export function parseArgs(argv: readonly string[]): Options {
  const opts: Options = { dryRun: false, verifyArtifacts: false, keepTarget: false, out: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--verify-artifacts") opts.verifyArtifacts = true;
    else if (a === "--keep-target") opts.keepTarget = true;
    else if (a === "--out") opts.out = argv[++i] ?? "";
    else if (a.startsWith("--out=")) opts.out = a.slice("--out=".length);
    else {
      fail(
        `unrecognized argument \`${a}\` — this command takes --dry-run, --verify-artifacts, --keep-target and --out <dir> only`,
      );
    }
  }
  if (opts.out !== null && opts.out === "") fail("--out requires a directory path");
  if (opts.dryRun && opts.verifyArtifacts) {
    fail("--dry-run and --verify-artifacts are separate modes; pass one of them");
  }
  if (opts.verifyArtifacts && opts.out === null) {
    fail("--verify-artifacts requires --out <dir> naming the artifact directory to re-read");
  }
  return opts;
}

// ---------------------------------------------------------------------------
// Phase 3 — pure derivations over a transcript
// ---------------------------------------------------------------------------

export interface StreamFrame {
  type: string;
  subtype?: string;
  [k: string]: unknown;
}

export interface ReadFramesResult {
  frames: StreamFrame[];
  /** Non-empty lines that did not parse as a JSON object (a trailing partial line after a kill). */
  partial: number;
  /** `lineNumbers[i]` is the 1-based transcript line `frames[i]` came from — the citation. */
  lineNumbers: number[];
  /** Total physical lines read, the bound every `jsonl:<n>` citation must respect. */
  lineCount: number;
}

/** Pattern 1: a line-delimited reader that survives a killed run by counting, not throwing. */
export async function readFrames(path: string): Promise<ReadFramesResult> {
  const frames: StreamFrame[] = [];
  const lineNumbers: number[] = [];
  let partial = 0;
  let lineCount = 0;
  const rl = createInterface({ input: createReadStream(path, "utf8"), crlfDelay: Infinity });
  for await (const line of rl) {
    lineCount += 1;
    const s = line.trim();
    if (s === "") continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(s);
    } catch {
      partial += 1;
      continue;
    }
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      partial += 1;
      continue;
    }
    const obj = parsed as Record<string, unknown>;
    if (typeof obj.type !== "string") {
      partial += 1;
      continue;
    }
    frames.push(obj as StreamFrame);
    lineNumbers.push(lineCount);
  }
  return { frames, partial, lineNumbers, lineCount };
}

/** Parse in-memory JSONL text with the same rules as `readFrames` (for the offline suite). */
export function parseFrames(text: string): ReadFramesResult {
  const frames: StreamFrame[] = [];
  const lineNumbers: number[] = [];
  let partial = 0;
  let lineCount = 0;
  const lines = text.split(/\r?\n/);
  if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  for (const line of lines) {
    lineCount += 1;
    const s = line.trim();
    if (s === "") continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(s);
    } catch {
      partial += 1;
      continue;
    }
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      partial += 1;
      continue;
    }
    const obj = parsed as Record<string, unknown>;
    if (typeof obj.type !== "string") {
      partial += 1;
      continue;
    }
    frames.push(obj as StreamFrame);
    lineNumbers.push(lineCount);
  }
  return { frames, partial, lineNumbers, lineCount };
}

export interface DenyObservation {
  fired: boolean;
  /** Index into `frames` of the first `hook_response` whose decoded stdout matched, else null. */
  frameIndex: number | null;
  hookName: string | null;
  /** How many `hook_response` frames were examined — the denominator a vacuous false would hide. */
  hookResponsesExamined: number;
}

/** Pattern 2 / hard rule 5: the deny is matched on the DECODED `hook_response.stdout` only. */
export function denyObservation(frames: readonly StreamFrame[]): DenyObservation {
  let examined = 0;
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    if (f.type !== "system" || f.subtype !== "hook_response") continue;
    examined += 1;
    const out = typeof f.stdout === "string" ? f.stdout : "";
    if (out !== "" && prodDeployDenyFired(out)) {
      return {
        fired: true,
        frameIndex: i,
        hookName: typeof f.hook_name === "string" ? f.hook_name : null,
        hookResponsesExamined: examined,
      };
    }
  }
  return { fired: false, frameIndex: null, hookName: null, hookResponsesExamined: examined };
}

export function denyObservedInStream(frames: readonly StreamFrame[]): boolean {
  return denyObservation(frames).fired;
}

export type SpawnEvidence = "nested-frames" | "task-notification" | "none";

export interface SpawnObservation {
  /** `input.subagent_type` of the `Agent` tool-use block. */
  role: string;
  toolUseId: string;
  evidence: SpawnEvidence;
  /** Frames joined to this spawn: nested frames counted, or 1 for a task notification, or 0. */
  frameCount: number;
  /** Index into `frames` of the `Agent` tool-use block — the citation for the spawn itself. */
  frameIndex: number;
  /** Index of the first joined frame (nested frame or task notification), else null. */
  evidenceFrameIndex: number | null;
}

interface ToolUseBlock {
  type?: unknown;
  id?: unknown;
  name?: unknown;
  input?: unknown;
}

function contentBlocks(frame: StreamFrame): ToolUseBlock[] {
  const message = frame.message;
  if (typeof message !== "object" || message === null) return [];
  const content = (message as { content?: unknown }).content;
  if (!Array.isArray(content)) return [];
  return content.filter((b): b is ToolUseBlock => typeof b === "object" && b !== null);
}

/** Pattern 3: D-02 side (a). Both observables are accepted and the one that fired is recorded. */
export function spawnObservations(frames: readonly StreamFrame[]): SpawnObservation[] {
  const out: SpawnObservation[] = [];
  for (let i = 0; i < frames.length; i++) {
    for (const block of contentBlocks(frames[i])) {
      if (block.type !== "tool_use" || block.name !== "Agent" || typeof block.id !== "string") continue;
      const input = typeof block.input === "object" && block.input !== null ? (block.input as Record<string, unknown>) : {};
      const role = typeof input.subagent_type === "string" ? input.subagent_type : "";
      const id = block.id;
      let nested = 0;
      let firstNested: number | null = null;
      let notification: number | null = null;
      for (let j = 0; j < frames.length; j++) {
        const g = frames[j];
        if (g.parent_tool_use_id === id) {
          nested += 1;
          if (firstNested === null) firstNested = j;
        }
        if (
          notification === null &&
          g.type === "system" &&
          g.subtype === "task_notification" &&
          g.tool_use_id === id
        ) {
          notification = j;
        }
      }
      if (nested > 0) {
        out.push({ role, toolUseId: id, evidence: "nested-frames", frameCount: nested, frameIndex: i, evidenceFrameIndex: firstNested });
      } else if (notification !== null) {
        out.push({ role, toolUseId: id, evidence: "task-notification", frameCount: 1, frameIndex: i, evidenceFrameIndex: notification });
      } else {
        out.push({ role, toolUseId: id, evidence: "none", frameCount: 0, frameIndex: i, evidenceFrameIndex: null });
      }
    }
  }
  return out;
}

export interface PluginLoadReport {
  loaded: { name: string; path: string; version: string | null }[];
  errors: unknown[];
  /** Index into `frames` of the `system/init` frame, else null when no init frame was seen. */
  frameIndex: number | null;
}

/** D-05: what `system/init` says loaded, and the cache paths whose git HEAD can be read post hoc. */
export function pluginLoadReport(frames: readonly StreamFrame[]): PluginLoadReport {
  const idx = frames.findIndex((f) => f.type === "system" && f.subtype === "init");
  if (idx < 0) return { loaded: [], errors: [], frameIndex: null };
  const init = frames[idx];
  const raw = Array.isArray(init.plugins) ? (init.plugins as unknown[]) : [];
  const loaded = raw
    .filter((p): p is Record<string, unknown> => typeof p === "object" && p !== null)
    .map((p) => ({
      name: typeof p.name === "string" ? p.name : "",
      path: typeof p.path === "string" ? p.path : "",
      version: typeof p.version === "string" ? p.version : null,
    }));
  const errors = Array.isArray(init.plugin_errors) ? (init.plugin_errors as unknown[]) : [];
  return { loaded, errors, frameIndex: idx };
}

export interface FrameKind {
  type: string;
  subtype: string | null;
  count: number;
  firstIndex: number;
}

/** The schema-drift detector: every distinct `(type, subtype)` pair seen, with its first index. */
export function frameKinds(frames: readonly StreamFrame[]): FrameKind[] {
  const seen = new Map<string, FrameKind>();
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    const subtype = typeof f.subtype === "string" ? f.subtype : null;
    // A JSON-encoded pair is the key: unambiguous for any type or subtype spelling, and it carries
    // no control byte (a NUL joiner would trip check-nul-bytes and blind BSD grep over this file).
    const key = JSON.stringify([f.type, subtype]);
    const cur = seen.get(key);
    if (cur === undefined) seen.set(key, { type: f.type, subtype, count: 1, firstIndex: i });
    else cur.count += 1;
  }
  return [...seen.values()].sort((a, b) => a.firstIndex - b.firstIndex);
}

export interface ResultFigures {
  totalCostUsd: number | null;
  durationMs: number | null;
  durationApiMs: number | null;
  numTurns: number | null;
  frameIndex: number | null;
}

export function resultFigures(frames: readonly StreamFrame[]): ResultFigures {
  const idx = frames.findIndex((f) => f.type === "result");
  if (idx < 0) return { totalCostUsd: null, durationMs: null, durationApiMs: null, numTurns: null, frameIndex: null };
  const r = frames[idx];
  const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
  return {
    totalCostUsd: num(r.total_cost_usd),
    durationMs: num(r.duration_ms),
    durationApiMs: num(r.duration_api_ms),
    numTurns: num(r.num_turns),
    frameIndex: idx,
  };
}

// ---------------------------------------------------------------------------
// The derived grant (hard rule 6) and the on-disk author stamps (D-02 side b)
// ---------------------------------------------------------------------------

export interface GrantDerivation {
  /** The coordinator's enumerated grant, read through the canonical admission reader. */
  granted: string[];
  /** Every installed adapter's frontmatter `name` — the independent second derivation. */
  adapterNames: string[];
  /** The coordinator's own name, located by its marker rather than by filename. */
  coordinator: string | null;
  /** The adapter namespace prefix, derived as the longest common prefix of the adapter names. */
  prefix: string;
  /** Reasons the two derivations disagree, or the floor refused. Empty means they agree. */
  reasons: string[];
}

function longestCommonPrefix(names: readonly string[]): string {
  if (names.length === 0) return "";
  let prefix = names[0];
  for (const n of names.slice(1)) {
    let k = 0;
    while (k < prefix.length && k < n.length && prefix[k] === n[k]) k += 1;
    prefix = prefix.slice(0, k);
    if (prefix === "") break;
  }
  // Cut at the last namespace separator so a coincidental shared letter past it is not a prefix.
  const cut = prefix.lastIndexOf("-");
  return cut < 0 ? "" : prefix.slice(0, cut + 1);
}

/** Strip the derived namespace prefix so a note's `by:` role compares with an adapter name. */
export function roleKey(name: string, prefix: string): string {
  return prefix !== "" && name.startsWith(prefix) ? name.slice(prefix.length) : name;
}

/**
 * Derive the grant two ways from an installed tree and assert the relationship between them: the
 * adapter-name set is exactly the granted set plus the coordinator itself. Neither side is typed.
 */
export function deriveGrant(installedRoot: string): GrantDerivation {
  const reasons: string[] = [];
  let rels: string[];
  try {
    rels = listAgentAdapters(installedRoot);
  } catch (e) {
    return {
      granted: [],
      adapterNames: [],
      coordinator: null,
      prefix: "",
      reasons: [`the adapter set could not be listed under ${join(installedRoot, ADAPTER_DIR)} — ${e instanceof Error ? e.message : String(e)}`],
    };
  }
  const adapterNames: string[] = [];
  const coordinators: { name: string; granted: string[] }[] = [];
  for (const rel of rels) {
    const path = join(installedRoot, ADAPTER_DIR, rel);
    let text: string;
    try {
      text = readFileSync(path, "utf8");
    } catch {
      reasons.push(`the adapter ${rel} could not be read at ${path}`);
      continue;
    }
    const parsed = admit(text);
    if (!parsed.ok) {
      reasons.push(`the adapter ${rel} is not in the canonical frontmatter form [${parsed.code}] — ${parsed.reason}`);
      continue;
    }
    const name = admittedValuesFor(parsed.value, "name")[0] ?? "";
    if (name === "") {
      reasons.push(`the adapter ${rel} carries no name value`);
      continue;
    }
    adapterNames.push(name);
    if (admittedKeyHasValue(parsed.value, "coordinator", "true")) {
      coordinators.push({ name, granted: admittedGrantedNames(parsed.value) });
    }
  }
  adapterNames.sort();
  if (adapterNames.length === 0) reasons.push("vacuity floor: the adapter-name derivation is empty — no verdict over an empty census");
  if (coordinators.length !== 1) {
    reasons.push(`exactly one adapter must carry the coordinator marker; found ${coordinators.length}`);
    return { granted: [], adapterNames, coordinator: null, prefix: longestCommonPrefix(adapterNames), reasons };
  }
  const coordinator = coordinators[0].name;
  const granted = [...coordinators[0].granted].sort();
  if (granted.length === 0) reasons.push("vacuity floor: the coordinator grant derivation is empty — no verdict over an empty grant");
  const adapterSet = new Set(adapterNames);
  const unresolved = granted.filter((n) => !adapterSet.has(n));
  if (unresolved.length > 0) reasons.push(`granted name(s) with no adapter file: ${unresolved.join(", ")}`);
  const grantedSet = new Set(granted);
  const ungranted = adapterNames.filter((n) => !grantedSet.has(n) && n !== coordinator);
  if (ungranted.length > 0) reasons.push(`adapter(s) that are neither granted nor the coordinator: ${ungranted.join(", ")}`);
  if (adapterNames.length !== granted.length + 1) {
    reasons.push(
      `the adapter census derived ${adapterNames.length} name(s) and the coordinator grant derived ${granted.length}; ` +
        "the relationship is census = grant + the coordinator itself, so the two must differ by exactly one. " +
        "Walk both derivations before touching either — this is not a pin to move",
    );
  }
  return { granted, adapterNames, coordinator, prefix: longestCommonPrefix(adapterNames), reasons };
}

export interface AuthorStamp {
  task: string;
  noteId: string;
  kind: string;
  by: string;
  body: string;
}

const TASK_DIR_RE = /^[A-Za-z0-9._-]+$/;

/** The task directories under a context root that carry a notes directory. */
export function contextTasks(contextRoot: string): string[] {
  if (!existsSync(contextRoot)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(contextRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (!TASK_DIR_RE.test(entry.name) || entry.name === "." || entry.name === "..") continue;
    if (existsSync(join(contextRoot, entry.name, "notes"))) out.push(entry.name);
  }
  return out.sort();
}

/** D-02 side (b): every live note's author stamp under a target's context root. */
export function authorStamps(contextRoot: string): AuthorStamp[] {
  const out: AuthorStamp[] = [];
  for (const task of contextTasks(contextRoot)) {
    for (const n of currentState(readContext(task, contextRoot))) {
      out.push({ task, noteId: n.id, kind: n.kind, by: n.by, body: n.body });
    }
  }
  return out;
}

export interface CapThreeInput {
  observations: readonly SpawnObservation[];
  grant: GrantDerivation;
  stamps: readonly AuthorStamp[];
}

/**
 * D-02: the two-sided CAP-03 predicate. Returns named reasons; EMPTY means satisfied. Side (a):
 * at least two DISTINCT granted roles each with non-zero own-session evidence. Side (b): at least
 * one on-disk note whose author stamp is a granted role rather than the coordinator.
 */
export function capThreePredicate(input: CapThreeInput): string[] {
  const reasons: string[] = [];
  const { grant } = input;
  if (grant.reasons.length > 0) {
    reasons.push(...grant.reasons.map((r) => `grant derivation: ${r}`));
  }
  if (grant.granted.length === 0) {
    reasons.push("side (a): the derived grant is empty, so membership cannot be decided (vacuity floor)");
    return reasons;
  }
  const grantedKeys = new Set(grant.granted.map((g) => roleKey(g, grant.prefix)));
  const coordinatorKey = grant.coordinator === null ? null : roleKey(grant.coordinator, grant.prefix);

  // Side (a).
  const evidenced = new Set<string>();
  for (const o of input.observations) {
    const key = roleKey(o.role, grant.prefix);
    if (o.role === "") {
      reasons.push(`side (a): an Agent tool-use block (${o.toolUseId}) names no subagent_type`);
      continue;
    }
    if (!grantedKeys.has(key)) {
      reasons.push(`side (a): role ${o.role} (${o.toolUseId}) is not a member of the derived grant`);
      continue;
    }
    if (o.evidence === "none") {
      reasons.push(
        `side (a): role ${o.role} (${o.toolUseId}) was spawned but carries no own-session evidence — ` +
          "neither a frame with a matching parent_tool_use_id nor a task_notification joined by tool_use_id",
      );
      continue;
    }
    evidenced.add(key);
  }
  if (evidenced.size < 2) {
    reasons.push(
      `side (a): ${evidenced.size} distinct granted role(s) carry own-session evidence; at least two are required` +
        (evidenced.size > 0 ? ` (seen: ${[...evidenced].sort().join(", ")})` : ""),
    );
  }

  // Side (b).
  if (input.stamps.length === 0) {
    reasons.push("side (b): no live note exists under the target's context root, so no author stamp can be read");
  } else {
    const roleStamps = input.stamps.filter((s) => {
      const key = roleKey(s.by, grant.prefix);
      return grantedKeys.has(key) && key !== coordinatorKey;
    });
    if (roleStamps.length === 0) {
      const seen = [...new Set(input.stamps.map((s) => s.by))].sort();
      reasons.push(
        `side (b): no note under the target's context root is stamped by a granted role agent; author stamps seen: ${seen.join(", ")}`,
      );
    }
  }
  return reasons;
}

/** The green verdict marker, if any live note under the root carries it. */
export function verdictMarkerObserved(stamps: readonly AuthorStamp[]): AuthorStamp | null {
  return stamps.find((s) => s.body.includes(VERDICT_GREEN_MARKER)) ?? null;
}

// ---------------------------------------------------------------------------
// D-07 — the path-invariant parity projection (33-12, CR-03; 33-DIAGNOSIS § 1.2 and § 1.4)
// ---------------------------------------------------------------------------

export interface RoleNotes {
  role: string;
  count: number;
  /** The SORTED multiset (repeats kept) of `kind` values of the notes stamped `by` this role. */
  kinds: string[];
}

export interface NoteRoute {
  /** `Write` / `Edit` tool-use blocks whose `file_path` sits under the context root. */
  directContextWrites: number;
  /** Tool-use blocks whose name ends in `propose_note` — the sanctioned MCP admission route. */
  proposeNoteCalls: number;
}

export interface PathProjection {
  roles: RoleNotes[];
  verdictMarker: boolean;
  route: NoteRoute;
}

const PROPOSE_NOTE_SUFFIX = "propose_note";

/**
 * The route the notes took to disk, derived from TOOL-USE BLOCKS only. A `Write` or `Edit` whose
 * `file_path` contains `/.grugops/context/` is a direct write into the context root (path B's nine
 * notes, 33-DIAGNOSIS § 1.3 (ii)); a block whose name ends in `propose_note` is the sanctioned
 * writer. The suffix is matched because the installed plugin exposes
 * `mcp__plugin_grugops_grugops__propose_note` while the grant spells `mcp__grugops__propose_note`.
 * Nested subagent frames are ordinary frames here — the direct writes are by role agents.
 */
export function noteRoute(frames: readonly StreamFrame[]): NoteRoute {
  const contextMarker = `/${toPosix(CONTEXT_SUBPATH)}/`;
  let directContextWrites = 0;
  let proposeNoteCalls = 0;
  for (const frame of frames) {
    for (const block of contentBlocks(frame)) {
      if (block.type !== "tool_use" || typeof block.name !== "string") continue;
      if (block.name.endsWith(PROPOSE_NOTE_SUFFIX)) {
        proposeNoteCalls += 1;
        continue;
      }
      if (block.name !== "Write" && block.name !== "Edit") continue;
      const input = typeof block.input === "object" && block.input !== null ? (block.input as Record<string, unknown>) : {};
      const filePath = typeof input.file_path === "string" ? toPosix(input.file_path) : "";
      if (filePath.includes(contextMarker)) directContextWrites += 1;
    }
  }
  return { directContextWrites, proposeNoteCalls };
}

/**
 * Project one live path to the fields D-07 actually defines: per role (the `by` stamp with the
 * adapter prefix stripped) the admitted-note count and the kind multiset; whether the frozen green
 * verdict marker is present; and the route the notes took to disk. NOTHING ELSE ENTERS — not `at`,
 * not `body`, not `noteId`, not `task`, not `refs`. Every one of those is model-chosen across two
 * independent sessions (33-DIAGNOSIS § 1.2: the task ids, the timestamps, the refs lists and every
 * byte of every body differ between two runs that did identical work), so a projection that kept
 * any of them would be a predicate two live sessions can never meet, which is the CR-03 defect.
 */
export function projectLivePath(stamps: readonly AuthorStamp[], frames: readonly StreamFrame[], prefix: string): PathProjection {
  const byRole = new Map<string, string[]>();
  for (const s of stamps) {
    const role = roleKey(s.by, prefix);
    const kinds = byRole.get(role);
    if (kinds === undefined) byRole.set(role, [s.kind]);
    else kinds.push(s.kind);
  }
  const roles: RoleNotes[] = [...byRole.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([role, kinds]) => ({ role, count: kinds.length, kinds: [...kinds].sort() }));
  return { roles, verdictMarker: verdictMarkerObserved(stamps) !== null, route: noteRoute(frames) };
}

/** Named diffs between two projections. EMPTY iff the two paths are at parity. */
export function compareLivePaths(a: PathProjection, b: PathProjection): string[] {
  const diffs: string[] = [];
  const rolesA = new Map(a.roles.map((r) => [r.role, r]));
  const rolesB = new Map(b.roles.map((r) => [r.role, r]));
  const roles = [...new Set([...rolesA.keys(), ...rolesB.keys()])].sort((x, y) => x.localeCompare(y));
  for (const role of roles) {
    const ra = rolesA.get(role);
    const rb = rolesB.get(role);
    if (ra === undefined) {
      diffs.push(`${role}: present only in path B (${(rb as RoleNotes).count} note(s))`);
    } else if (rb === undefined) {
      diffs.push(`${role}: present only in path A (${ra.count} note(s))`);
    } else if (ra.count !== rb.count) {
      diffs.push(`${role}: note count differs: path A has ${ra.count}, path B has ${rb.count}`);
    } else if (JSON.stringify(ra.kinds) !== JSON.stringify(rb.kinds)) {
      diffs.push(`${role}: kind multiset differs: path A has [${ra.kinds.join(", ")}], path B has [${rb.kinds.join(", ")}]`);
    }
  }
  if (a.verdictMarker !== b.verdictMarker) {
    const word = (present: boolean): string => (present ? "present" : "absent");
    diffs.push(`verdict marker ${VERDICT_GREEN_MARKER} differs: path A ${word(a.verdictMarker)}, path B ${word(b.verdictMarker)}`);
  }
  if (a.route.directContextWrites !== b.route.directContextWrites) {
    diffs.push(`note route: direct writes into the context root differ: path A ${a.route.directContextWrites}, path B ${b.route.directContextWrites}`);
  }
  if (a.route.proposeNoteCalls !== b.route.proposeNoteCalls) {
    diffs.push(`note route: propose_note tool-use blocks differ: path A ${a.route.proposeNoteCalls}, path B ${b.route.proposeNoteCalls}`);
  }
  return diffs;
}

/**
 * THE ONE OUTCOME DERIVATION. `hang` first; then `fail` on any run failure, on a non-empty parity
 * diff list, or on plugin provenance that is not MET; else `pass`. A `pass` is therefore
 * unreachable while the two paths diverge or while the scored plugin is not, byte for byte, the
 * checkout under test.
 */
export function deriveOutcome(input: { hang: boolean; anyFailure: boolean; parityDiffs: readonly string[]; provenance: PreconditionState }): "pass" | "fail" | "hang" {
  if (input.hang) return "hang";
  if (input.anyFailure || input.parityDiffs.length > 0 || input.provenance !== "MET") return "fail";
  return "pass";
}

// ---------------------------------------------------------------------------
// Phase 4 — redaction (hard rule 8)
// ---------------------------------------------------------------------------

export interface HomeSpellings {
  plain: string | null;
  native: string | null;
}

/** Both spellings of the operator home directory, or null where one cannot be determined. */
export function homeSpellings(): HomeSpellings {
  let plain: string | null = null;
  try {
    const raw = homedir();
    plain = typeof raw === "string" && raw.trim() !== "" ? resolve(raw.trim()) : null;
  } catch {
    plain = null;
  }
  let native: string | null = null;
  if (plain !== null) {
    try {
      native = realpathSync.native(plain);
    } catch {
      native = null;
    }
  }
  return { plain, native };
}

/** Every string form a home spelling can take inside an artifact, longest first. */
export function homeSpellingForms(homes: HomeSpellings): string[] {
  const forms = new Set<string>();
  for (const h of [homes.plain, homes.native]) {
    if (h === null || h === "" || h === "/" || h === sep) continue;
    forms.add(h);
    forms.add(JSON.stringify(h).slice(1, -1)); // the JSON-escaped form a transcript carries
  }
  return [...forms].sort((a, b) => b.length - a.length);
}

const SECRET_SHAPES: readonly RegExp[] = [
  /\bsk-[A-Za-z0-9_-]{8,}\b/g,
  /\b(Bearer)\s+[A-Za-z0-9._~+/=-]{8,}/gi,
  /("?[A-Za-z0-9_.-]*(?:key|token|secret)[A-Za-z0-9_.-]*"?\s*[:=]\s*"?)([A-Za-z0-9_-]{32,})/gi,
];

function replaceAll(text: string, needle: string, replacement: string): string {
  return text.split(needle).join(replacement);
}

/** D-06: remove both home spellings and every secret-shaped value. Numbers are untouched. */
export function redactText(text: string, homes: HomeSpellings): string {
  let out = text;
  for (const form of homeSpellingForms(homes)) out = replaceAll(out, form, REDACTION_PLACEHOLDER);
  out = out.replace(SECRET_SHAPES[0], REDACTION_PLACEHOLDER);
  out = out.replace(SECRET_SHAPES[1], `$1 ${REDACTION_PLACEHOLDER}`);
  out = out.replace(SECRET_SHAPES[2], `$1${REDACTION_PLACEHOLDER}`);
  return out;
}

/** The home spellings that SURVIVE in a text. Non-empty means the redaction failed closed. */
export function homeSpellingSurvivors(text: string, homes: HomeSpellings): string[] {
  return homeSpellingForms(homes).filter((form) => text.includes(form));
}

// ---------------------------------------------------------------------------
// Phase 1 — preconditions: observation (spawns) and evaluation (pure)
// ---------------------------------------------------------------------------

export type PreconditionState = "MET" | "UNMET" | "UNKNOWN - verify";

export interface PreconditionRow {
  name: string;
  state: PreconditionState;
  detail: string;
}

export interface PreconditionObservation {
  /** `claude --version` output, or null when it could not be read. */
  platformVersion: string | null;
  /** `claude --help` text, or null when it could not be read. */
  helpText: string | null;
  marketplaceListing: string | null;
  pluginListing: string | null;
  /** The marketplace and plugin names read from `.claude-plugin/marketplace.json`. */
  marketplaceName: string;
  pluginName: string;
  /** Exit status of the coordinator-resolution precheck child, or null when it could not run. */
  precheckExit: number | null;
  precheckLastLine: string | null;
  localHead: string | null;
  remoteRef: string | null;
  remoteHead: string | null;
  aheadCount: number | null;
  approvalKeyPresent: boolean;
}

export interface PreconditionTable {
  rows: PreconditionRow[];
  readiness: "ready" | "not-ready";
  reasons: string[];
}

/** D-10: the precondition table and readiness verdict, derived from an observation record. Pure. */
export function evaluatePreconditions(obs: PreconditionObservation): PreconditionTable {
  const rows: PreconditionRow[] = [];
  const unknown = "UNKNOWN - verify";

  rows.push(
    obs.platformVersion === null
      ? { name: "platform version readable", state: unknown, detail: `\`${PLATFORM_CMD} --version\` could not be read on this machine; pending verification, not a failure` }
      : { name: "platform version readable", state: "MET", detail: obs.platformVersion },
  );

  if (obs.precheckExit === null) {
    rows.push({ name: "coordinator-resolution precheck", state: unknown, detail: "the precheck child could not be started; pending verification" });
  } else if (obs.precheckExit === 0) {
    rows.push({ name: "coordinator-resolution precheck", state: "MET", detail: obs.precheckLastLine ?? "exit 0" });
  } else {
    rows.push({ name: "coordinator-resolution precheck", state: "UNMET", detail: `exit ${obs.precheckExit}: ${obs.precheckLastLine ?? "(no output)"}` });
  }

  for (const flag of REQUIRED_FLAGS) {
    if (obs.helpText === null) {
      rows.push({ name: `flag ${flag} in --help`, state: unknown, detail: `\`${PLATFORM_CMD} --help\` could not be read; pending verification` });
    } else if (obs.helpText.includes(flag)) {
      rows.push({ name: `flag ${flag} in --help`, state: "MET", detail: "present in the help text" });
    } else {
      rows.push({ name: `flag ${flag} in --help`, state: "UNMET", detail: `flag ${flag} is absent from the help text` });
    }
  }

  if (obs.marketplaceListing === null) {
    rows.push({ name: `marketplace row ${obs.marketplaceName}`, state: unknown, detail: "the marketplace listing could not be read; pending verification" });
  } else if (obs.marketplaceListing.includes(obs.marketplaceName)) {
    rows.push({ name: `marketplace row ${obs.marketplaceName}`, state: "MET", detail: "the row is present in the marketplace listing (D-05 route 2 source)" });
  } else {
    rows.push({ name: `marketplace row ${obs.marketplaceName}`, state: "UNMET", detail: `no row named ${obs.marketplaceName} in the marketplace listing` });
  }

  rows.push(
    obs.pluginListing === null
      ? { name: "plugin listing readable", state: unknown, detail: "the plugin listing could not be read; pending verification" }
      : { name: "plugin listing readable", state: "MET", detail: obs.pluginListing.includes(obs.pluginName) ? `the listing names ${obs.pluginName}` : `the listing does not name ${obs.pluginName} (installed per target at local scope by the live run)` },
  );

  // The remote side is the LOCAL remote-tracking ref as last fetched; this runner uses no network.
  // A stale ref can only make this row MORE conservative (a push that happened after the last
  // fetch reads as not yet pushed), never less, which is the safe direction for a spend gate.
  const asFetched = "read from the remote-tracking ref as last fetched; no network was used";
  if (obs.localHead === null || obs.remoteHead === null || obs.aheadCount === null) {
    rows.push({
      name: "pushed sha (local HEAD equals the remote default branch head)",
      state: unknown,
      detail: `local HEAD ${obs.localHead ?? "unreadable"}, remote ${obs.remoteRef ?? "(unresolved)"} ${obs.remoteHead ?? "unreadable"}; the comparison could not be derived (${asFetched})`,
    });
  } else if (obs.localHead === obs.remoteHead) {
    rows.push({ name: "pushed sha (local HEAD equals the remote default branch head)", state: "MET", detail: `${obs.localHead} equals ${obs.remoteRef ?? "the remote head"} (ahead count 0; ${asFetched})` });
  } else {
    rows.push({
      name: "pushed sha (local HEAD equals the remote default branch head)",
      state: "UNMET",
      detail: `HEAD ${obs.localHead.slice(0, 12)} is ${obs.aheadCount} commit(s) ahead of ${obs.remoteRef ?? "the remote head"} ${obs.remoteHead.slice(0, 12)} — the unpushed head cannot be the sha a marketplace install resolves (${asFetched})`,
    });
  }

  rows.push(
    obs.approvalKeyPresent
      ? { name: "prod-deploy approval key absent from the environment", state: "UNMET", detail: `the parent environment defines ${PROD_DEPLOY_REASON_SIGNATURE}; the deny under observation could not fire` }
      : { name: "prod-deploy approval key absent from the environment", state: "MET", detail: "absent from the parent environment and asserted absent on every constructed child environment" },
  );

  const reasons = rows.filter((r) => r.state !== "MET").map((r) => `${r.name}: ${r.state} — ${r.detail}`);
  return { rows, readiness: reasons.length === 0 ? "ready" : "not-ready", reasons };
}

function probe(cmd: string, args: readonly string[], env: NodeJS.ProcessEnv, boundMs: number, cwd?: string): string | null {
  const r = spawnSync(cmd, [...args], { encoding: "utf8", input: "", timeout: boundMs, env, cwd, maxBuffer: 16 * 1024 * 1024 });
  if (r.error !== undefined || r.status !== 0 || typeof r.stdout !== "string") return null;
  return `${r.stdout}${r.stderr ?? ""}`;
}

function readMarketplaceNames(): { marketplaceName: string; pluginName: string } {
  try {
    const m = JSON.parse(readFileSync(MARKETPLACE_MANIFEST, "utf8")) as { name?: unknown; plugins?: unknown };
    const marketplaceName = typeof m.name === "string" ? m.name : "";
    const first = Array.isArray(m.plugins) && m.plugins.length > 0 ? (m.plugins[0] as { name?: unknown }) : {};
    const pluginName = typeof first.name === "string" ? first.name : "";
    if (marketplaceName === "" || pluginName === "") fail(`${MARKETPLACE_MANIFEST} names no marketplace or no plugin`);
    return { marketplaceName, pluginName };
  } catch (e) {
    if (e instanceof CaptureFailure) throw e;
    return fail(`${MARKETPLACE_MANIFEST} could not be read — ${e instanceof Error ? e.message : String(e)}`);
  }
}

function observePreconditions(): PreconditionObservation {
  const approvalKeyPresent = Object.prototype.hasOwnProperty.call(process.env, PROD_DEPLOY_REASON_SIGNATURE);
  const env = spawnEnv();
  const names = readMarketplaceNames();

  const version = probe(PLATFORM_CMD, ["--version"], env, PROBE_BOUND_MS);
  const help = probe(PLATFORM_CMD, ["--help"], env, PROBE_BOUND_MS);
  const marketplace = probe(PLATFORM_CMD, ["plugin", "marketplace", "list"], env, PROBE_BOUND_MS);
  const plugins = probe(PLATFORM_CMD, ["plugin", "list"], env, PROBE_BOUND_MS);

  let precheckExit: number | null = null;
  let precheckLastLine: string | null = null;
  if (existsSync(PRECHECK)) {
    const r = spawnSync("node", [PRECHECK], { encoding: "utf8", input: "", timeout: PRECHECK_BOUND_MS, env, cwd: SCRIPT_ROOT, maxBuffer: 16 * 1024 * 1024 });
    if (r.error === undefined && typeof r.status === "number") {
      precheckExit = r.status;
      const lines = `${r.stdout ?? ""}`.split(/\r?\n/).map((l) => l.trim()).filter((l) => l !== "");
      precheckLastLine = lines.length > 0 ? lines[lines.length - 1] : null;
    }
  }

  const localHead = probe(GIT_CMD, ["rev-parse", "HEAD"], env, PROBE_BOUND_MS, SCRIPT_ROOT)?.trim() ?? null;
  const symbolic = probe(GIT_CMD, ["symbolic-ref", "--quiet", "refs/remotes/origin/HEAD"], env, PROBE_BOUND_MS, SCRIPT_ROOT)?.trim() ?? null;
  const remoteRef = symbolic !== null && symbolic.startsWith("refs/remotes/") ? symbolic.slice("refs/remotes/".length) : "origin/main";
  const remoteHead = probe(GIT_CMD, ["rev-parse", remoteRef], env, PROBE_BOUND_MS, SCRIPT_ROOT)?.trim() ?? null;
  const aheadText = remoteHead === null ? null : probe(GIT_CMD, ["rev-list", "--count", `${remoteRef}..HEAD`], env, PROBE_BOUND_MS, SCRIPT_ROOT)?.trim() ?? null;
  const aheadCount = aheadText !== null && /^\d+$/.test(aheadText) ? Number(aheadText) : null;

  return {
    platformVersion: version === null ? null : version.trim(),
    helpText: help,
    marketplaceListing: marketplace,
    pluginListing: plugins,
    marketplaceName: names.marketplaceName,
    pluginName: names.pluginName,
    precheckExit,
    precheckLastLine,
    localHead,
    remoteRef,
    remoteHead,
    aheadCount,
    approvalKeyPresent,
  };
}

// ---------------------------------------------------------------------------
// Phase 2 — the target build (D-03) and the bounded live runs (D-07, D-12)
// ---------------------------------------------------------------------------

export interface TargetBuild {
  label: RunLabel;
  target: string;
  home: string;
  installerLine: string;
}

function buildTarget(label: RunLabel): TargetBuild {
  if (!existsSync(INSTALLER)) fail(`the installer is missing at ${INSTALLER} — run \`npm run build\` so the committed .js twin exists`);
  if (!existsSync(FIXTURE_TARGET)) fail(`the fixture project is missing at ${FIXTURE_TARGET}`);
  const target = makeScratch(`target-${label}`);
  const home = makeScratch(`home-${label}`);
  cpSync(FIXTURE_TARGET, target, { recursive: true });
  const env = spawnEnv({ GRUGOPS_HOME: home });
  const init = spawnSync(GIT_CMD, ["init", "--quiet"], { cwd: target, encoding: "utf8", input: "", timeout: PROBE_BOUND_MS, env });
  if (init.error !== undefined || init.status !== 0) {
    fail(`\`git init\` did not complete in ${target} (exit ${String(init.status)}) — ${init.error?.message ?? (init.stderr ?? "").trim()}`);
  }
  const r = spawnSync("node", [INSTALLER, "--target", target, "--yes"], { encoding: "utf8", input: "", timeout: INSTALL_BOUND_MS, env, maxBuffer: 16 * 1024 * 1024 });
  // TWO SIGNALS, EITHER ONE A REFUSAL (the coordinator-resolution precheck's rule): the exit status
  // and the INCOMPLETE banner are checked against the same run, and the message names which fired.
  const detail = `${r.stdout ?? ""}${r.stderr ?? ""}`.trim();
  if (r.error !== undefined || r.status !== 0) {
    fail(`the install into target ${label} did not complete (exit ${String(r.status)}${r.status === 3 ? " = INCOMPLETE" : ""}). Installer output follows:\n${detail}`);
  }
  if (detail.includes("install INCOMPLETE")) {
    fail(`the install into target ${label} printed the INCOMPLETE banner while exiting ${String(r.status)} — the banner and the exit status disagree. Installer output follows:\n${detail}`);
  }
  return { label, target, home, installerLine: `the installer ran cleanly into a fresh copy of the fixture project with an isolated kit home; nothing outside those two directories was written` };
}

export interface PlatformRunResult {
  status: number | null;
  signal: NodeJS.Signals | null;
  timedOut: boolean;
  escalated: boolean;
  durationMs: number;
  error: string | null;
  stderrTail: string;
}

/**
 * The live invocation: `spawn` (never `spawnSync`) with stdout piped to a write stream so a killed
 * run still leaves its partial JSONL on disk; SIGINT at the bound, SIGTERM as the escalation.
 */
function runPlatform(args: readonly string[], cwd: string, env: NodeJS.ProcessEnv, transcriptPath: string, boundMs: number): Promise<PlatformRunResult> {
  return new Promise((resolvePromise) => {
    const out = createWriteStream(transcriptPath);
    const started = Date.now();
    let settled = false;
    let timedOut = false;
    let escalated = false;
    let stderrTail = "";
    const child = spawn(PLATFORM_CMD, [...args], { cwd, env, stdio: ["pipe", "pipe", "pipe"] });
    child.stdin.end();
    child.stdout.pipe(out);
    child.stderr.on("data", (d: Buffer) => {
      stderrTail = `${stderrTail}${d.toString("utf8")}`.slice(-64_000);
    });
    const t1 = setTimeout(() => {
      timedOut = true;
      child.kill("SIGINT");
    }, boundMs);
    const t2 = setTimeout(() => {
      escalated = true;
      child.kill("SIGTERM");
    }, boundMs + SIGTERM_GRACE_MS);
    const settle = (status: number | null, signal: NodeJS.Signals | null, error: string | null): void => {
      if (settled) return;
      settled = true;
      clearTimeout(t1);
      clearTimeout(t2);
      out.end(() => resolvePromise({ status, signal, timedOut, escalated, durationMs: Date.now() - started, error, stderrTail }));
    };
    child.on("error", (e) => settle(null, null, e.message));
    child.on("close", (status, signal) => settle(status, signal, null));
  });
}

function pluginInstall(target: string, pluginName: string, marketplaceName: string): string {
  const env = spawnEnv();
  const r = spawnSync(PLATFORM_CMD, ["plugin", "install", `${pluginName}@${marketplaceName}`, "--scope", "local", "--yes"], { cwd: target, encoding: "utf8", input: "", timeout: PLUGIN_OP_BOUND_MS, env });
  const detail = `${r.stdout ?? ""}${r.stderr ?? ""}`.trim();
  if (r.error !== undefined || r.status !== 0) {
    return `UNKNOWN - verify — \`plugin install ${pluginName}@${marketplaceName} --scope local\` exited ${String(r.status)}${r.error ? ` (${r.error.message})` : ""}: ${detail}`;
  }
  return `installed ${pluginName}@${marketplaceName} at local scope: ${detail}`;
}

function pluginUninstall(target: string, pluginName: string): void {
  try {
    spawnSync(PLATFORM_CMD, ["plugin", "uninstall", pluginName, "--scope", "local"], { cwd: target, encoding: "utf8", input: "", timeout: PLUGIN_OP_BOUND_MS, env: childEnvironment(process.env) });
  } catch {
    /* best-effort: cleanup failure never masks a result */
  }
}

/** D-05 post hoc: the git HEAD of an installed plugin's cache path, or `UNKNOWN - verify`. */
function installedPluginSha(cachePath: string): string {
  if (cachePath === "") return "UNKNOWN - verify — the init frame named no plugin path";
  const env = spawnEnv();
  const sha = probe(GIT_CMD, ["-C", cachePath, "rev-parse", "HEAD"], env, PROBE_BOUND_MS);
  if (sha === null) return `UNKNOWN - verify — \`git -C <plugin path> rev-parse HEAD\` could not be read for the path the init frame named`;
  return sha.trim();
}

// ---------------------------------------------------------------------------
// Phase 5 — the report (hard rule 7)
// ---------------------------------------------------------------------------

export interface ClaimRow {
  label: string;
  value: string;
  /** The 1-based transcript line, or null — a null row is WITHHELD, never written. */
  line: number | null;
}

export interface TargetRow {
  label: string;
  value: string;
  /** `path:<posix-relative>` or `note:<task>/<id>` — the on-disk citation. */
  citation: string;
}

export interface RunReport {
  label: RunLabel;
  transcriptName: string;
  argv: readonly string[];
  frames: ReadFramesResult;
  claims: ClaimRow[];
  withheld: number;
  targetRows: TargetRow[];
  capThreeReasons: string[];
  run: PlatformRunResult | null;
}

export interface ReportModel {
  mode: "dry-run" | "capture";
  generatedAt: string;
  checkoutSha: string;
  platformVersion: string;
  boundMs: number;
  boundUsed: string;
  approvalKeyLine: string;
  installedPluginSha: string;
  preconditions: PreconditionTable;
  targets: { label: RunLabel; installerLine: string }[];
  runs: RunReport[];
  /** D-07: the path-invariant projection per run and the named diffs between them (33-12). */
  parity: { projections: { label: RunLabel; projection: PathProjection }[]; diffs: string[] };
  /** The task-id-keyed replay comparator's output — informational only, never an outcome input. */
  equivalenceDiffs: string[];
  outcome: "pass" | "fail" | "hang" | "no-go";
  outcomeReason: string;
}

/** The heading the flip manifest's D-18 cells cite. Emitted by `renderReport`; frozen by 33-12. */
export const PARITY_SECTION_HEADING = "## Dual-path parity (D-07) — path-invariant projection";
export const REPLAY_SECTION_HEADING = "## Replay comparator (informational — task-id keyed, deterministic replay only)";
export const PARITY_EQUAL_LINE = "- parity: the two projections are equal";

const cell = (s: string): string => s.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");

/** Build the claim rows a run's transcript supports. Every row cites the frame it came from. */
export function deriveClaims(frames: ReadFramesResult, grant: GrantDerivation, stamps: readonly AuthorStamp[]): { claims: ClaimRow[]; withheld: number; capThreeReasons: string[] } {
  const claims: ClaimRow[] = [];
  const cite = (i: number | null): number | null => (i === null || i < 0 || i >= frames.lineNumbers.length ? null : frames.lineNumbers[i]);

  for (const k of frameKinds(frames.frames)) {
    claims.push({ label: `frame kind ${k.type}/${k.subtype ?? "(none)"}`, value: `${k.count} frame(s)`, line: cite(k.firstIndex) });
  }
  const observations = spawnObservations(frames.frames);
  for (const o of observations) {
    const evidenceLine = cite(o.evidenceFrameIndex);
    claims.push({
      label: `D-02 side (a): Agent spawn of ${o.role === "" ? "(no subagent_type)" : o.role}`,
      value: `${o.toolUseId}; evidence ${o.evidence}` + (o.evidence === "nested-frames" ? ` (${o.frameCount} nested frame(s), first at jsonl:${evidenceLine ?? "?"})` : o.evidence === "task-notification" ? ` (task_notification at jsonl:${evidenceLine ?? "?"})` : ""),
      line: cite(o.frameIndex),
    });
  }
  const deny = denyObservation(frames.frames);
  claims.push({
    label: "D-04 prod-deploy deny observed in a hook_response.stdout",
    value: deny.fired ? `yes — hook ${deny.hookName ?? "(unnamed)"}; ${deny.hookResponsesExamined} hook_response frame(s) examined up to the match` : `no — ${deny.hookResponsesExamined} hook_response frame(s) examined, none carried the prod-deploy deny envelope`,
    line: deny.fired ? cite(deny.frameIndex) : (frames.frames.length > 0 ? cite(0) : null),
  });
  const plugins = pluginLoadReport(frames.frames);
  claims.push({
    label: "D-05 plugins loaded per system/init",
    value: plugins.loaded.length === 0 ? "none listed" : plugins.loaded.map((p) => `${p.name}${p.version ? ` ${p.version}` : ""} at ${p.path}`).join("; "),
    line: cite(plugins.frameIndex),
  });
  claims.push({ label: "D-05 plugin_errors per system/init", value: plugins.errors.length === 0 ? "none" : JSON.stringify(plugins.errors), line: cite(plugins.frameIndex) });
  const result = resultFigures(frames.frames);
  claims.push({ label: "result: total_cost_usd", value: result.totalCostUsd === null ? "absent" : String(result.totalCostUsd), line: cite(result.frameIndex) });
  claims.push({ label: "result: duration_ms", value: result.durationMs === null ? "absent" : String(result.durationMs), line: cite(result.frameIndex) });
  claims.push({ label: "result: duration_api_ms", value: result.durationApiMs === null ? "absent" : String(result.durationApiMs), line: cite(result.frameIndex) });
  claims.push({ label: "result: num_turns", value: result.numTurns === null ? "absent" : String(result.numTurns), line: cite(result.frameIndex) });

  const withheld = claims.filter((c) => c.line === null).length;
  const capThreeReasons = capThreePredicate({ observations, grant, stamps });
  return { claims: claims.filter((c) => c.line !== null), withheld, capThreeReasons };
}

export function renderReport(m: ReportModel): string {
  const L: string[] = [];
  L.push(m.mode === "dry-run" ? "# grugops live-capture report — DRY RUN (fixture-derived)" : "# grugops live-capture summary");
  L.push("");
  L.push(`Generated ${m.generatedAt} by scripts/capture-live.js (mode: ${m.mode}). Every row of a "claim" table cites the transcript line it was derived from; a row with no citation is withheld, not written.`);
  L.push("");
  L.push("## Run");
  L.push("");
  L.push("| field | value |");
  L.push("|---|---|");
  L.push(`| mode | ${m.mode} |`);
  L.push(`| checkout sha | ${cell(m.checkoutSha)} |`);
  L.push(`| platform version | ${cell(m.platformVersion)} |`);
  L.push(`| per-call bound (ms) | ${m.boundMs} |`);
  L.push(`| bound actually used | ${cell(m.boundUsed)} |`);
  L.push(`| approval key in child env | ${cell(m.approvalKeyLine)} |`);
  L.push(`| installed plugin sha (D-05, post hoc) | ${cell(m.installedPluginSha)} |`);
  for (const r of m.runs) {
    L.push(`| run ${r.label} transcript | ${r.transcriptName} (${r.frames.lineCount} line(s), ${r.frames.frames.length} frame(s), ${r.frames.partial} partial line(s)) |`);
    L.push(`| run ${r.label} argv | ${cell(JSON.stringify(r.argv))} |`);
    if (r.run !== null) {
      L.push(`| run ${r.label} exit | status ${String(r.run.status)}, signal ${String(r.run.signal)}, timed out ${r.run.timedOut}, escalated ${r.run.escalated}, wall ${r.run.durationMs} ms |`);
    }
    L.push(`| run ${r.label} claim rows withheld (no citation) | ${r.withheld} |`);
  }
  L.push("");
  L.push("## Preconditions");
  L.push("");
  L.push("| precondition | state | detail |");
  L.push("|---|---|---|");
  for (const row of m.preconditions.rows) L.push(`| ${cell(row.name)} | ${row.state} | ${cell(row.detail)} |`);
  L.push("");
  L.push(readinessLine(m.preconditions));
  L.push("");
  L.push("## Target build (D-03)");
  L.push("");
  for (const t of m.targets) L.push(`- target ${t.label}: ${t.installerLine}`);
  L.push("");
  for (const r of m.runs) {
    L.push(`## Transcript claims — run ${r.label} (${r.transcriptName})`);
    L.push("");
    L.push(`| ${claimTableHeader(r.label, r.transcriptName)} | value | citation |`);
    L.push("|---|---|---|");
    for (const c of r.claims) L.push(`| ${cell(c.label)} | ${cell(c.value)} | jsonl:${c.line} |`);
    L.push("");
    L.push(`## Target observations — run ${r.label}`);
    L.push("");
    L.push(`| ${observationTableHeader(r.label)} | value | citation |`);
    L.push("|---|---|---|");
    for (const t of r.targetRows) L.push(`| ${cell(t.label)} | ${cell(t.value)} | ${cell(t.citation)} |`);
    L.push("");
    L.push(`## CAP-03 verdict (D-02) — run ${r.label}`);
    L.push("");
    if (r.capThreeReasons.length === 0) L.push("- both sides hold: no named reason remains");
    else for (const reason of r.capThreeReasons) L.push(`- ${reason}`);
    L.push("");
  }
  L.push(PARITY_SECTION_HEADING);
  L.push("");
  L.push("Per role: the admitted-note count and the kind multiset; then the frozen verdict marker and the route the notes took to disk. `at` stamps, note bodies, task ids and refs are model-chosen and do not enter (33-DIAGNOSIS § 1.2).");
  L.push("");
  for (const p of m.parity.projections) {
    L.push(`Run ${p.label}:`);
    L.push("");
    L.push("| role | notes | kinds |");
    L.push("|---|---|---|");
    if (p.projection.roles.length === 0) L.push("| (no live note) | 0 | |");
    for (const r of p.projection.roles) L.push(`| ${cell(r.role)} | ${r.count} | ${cell(r.kinds.join(", "))} |`);
    L.push(`| verdict marker ${VERDICT_GREEN_MARKER} | ${p.projection.verdictMarker ? "present" : "absent"} | |`);
    L.push(`| note route: direct writes into the context root | ${p.projection.route.directContextWrites} | |`);
    L.push(`| note route: propose_note tool-use blocks | ${p.projection.route.proposeNoteCalls} | |`);
    L.push("");
  }
  if (m.parity.diffs.length === 0) L.push(PARITY_EQUAL_LINE);
  else for (const d of m.parity.diffs) L.push(`- ${cell(d)}`);
  L.push("");
  L.push(REPLAY_SECTION_HEADING);
  L.push("");
  L.push("The DOGF-01 replay comparator keeps `at`, `refs` and `body` and keys on the task id; over two independent live sessions its grammar guarantees a diff (33-DIAGNOSIS § 1.2). Its output is recorded and is not an input to the outcome.");
  L.push("");
  if (m.equivalenceDiffs.length === 0) L.push("- assertEquivalent over the two targets' context roots returned no diff");
  else for (const d of m.equivalenceDiffs) L.push(`- ${d.replace(/\r?\n/g, " ")}`);
  L.push("");
  L.push("## Completion");
  L.push("");
  L.push(`Outcome reason: ${m.outcomeReason}`);
  L.push(m.mode === "dry-run" ? DRY_RUN_COMPLETE : CAPTURE_COMPLETE);
  L.push("");
  L.push(`OUTCOME: ${m.outcome}`);
  L.push("");
  return L.join("\n");
}

export function readinessLine(table: PreconditionTable): string {
  return table.readiness === "ready" ? `${READINESS_PREFIX}ready` : `${READINESS_PREFIX}not-ready — ${table.reasons.join("; ")}`;
}

// ---------------------------------------------------------------------------
// --verify-artifacts (hard rule 7, re-checked after the fact)
// ---------------------------------------------------------------------------

/** Refusals over an already-written artifact directory. Empty means every rule held. */
export function verifyArtifacts(dir: string, homes: HomeSpellings = homeSpellings()): string[] {
  const refusals: string[] = [];
  if (!existsSync(dir)) return [`the artifact directory does not exist: ${dir}`];
  const entries = readdirSync(dir).filter((n) => n === DRY_RUN_REPORT_NAME || n === CAPTURE_SUMMARY_NAME);
  if (entries.length !== 1) {
    return [`expected exactly one report (${DRY_RUN_REPORT_NAME} or ${CAPTURE_SUMMARY_NAME}) in ${dir}; found ${entries.length}`];
  }
  const summaryPath = join(dir, entries[0]);
  const summary = readFileSync(summaryPath, "utf8");
  const outcomeCount = (summary.match(OUTCOME_LINE_SCAN_RE) ?? []).length;
  if (outcomeCount !== 1) refusals.push(`the report carries ${outcomeCount} outcome line(s); exactly one line matching the frozen grammar is required`);

  const transcriptLineCounts = new Map<string, number>();
  for (const name of readdirSync(dir).filter((n) => n.endsWith(".jsonl"))) {
    const text = readFileSync(join(dir, name), "utf8");
    const lines = text.split(/\r?\n/);
    if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
    transcriptLineCounts.set(name, lines.length);
    const survivors = homeSpellingSurvivors(text, homes);
    if (survivors.length > 0) refusals.push(`${name} carries ${survivors.length} surviving home-path spelling(s); the redaction did not hold`);
  }
  const summarySurvivors = homeSpellingSurvivors(summary, homes);
  if (summarySurvivors.length > 0) refusals.push(`${entries[0]} carries ${summarySurvivors.length} surviving home-path spelling(s); the redaction did not hold`);

  // Tables are located by their HEADER ROW — a `|` row immediately followed by a `|---|` separator
  // row — and a table ends at the first line that is not a `|` row. No markdown heading is read.
  let section: "transcript" | "target" | "other" = "other";
  let transcript: string | null = null;
  let transcriptRows = 0;
  let targetRows = 0;
  const lines = summary.split(/\r?\n/);
  const cellsOf = (line: string): string[] => line.split("|").map((c) => c.trim()).slice(1, -1);
  const isSeparator = (line: string): boolean => {
    const body = cellsOf(line);
    return line.startsWith("|") && body.length > 0 && body.every((c) => /^-+$/.test(c));
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith("|")) {
      section = "other";
      continue;
    }
    if (isSeparator(line)) continue;
    const body = cellsOf(line);
    if (body.length === 0) continue;
    const next = lines[i + 1] ?? "";
    if (isSeparator(next)) {
      const head = body[0];
      const claim = head.match(CLAIM_HEADER_RE);
      if (claim !== null) {
        section = "transcript";
        transcript = claim[2];
        if (!transcriptLineCounts.has(transcript)) refusals.push(`line ${i + 1}: the claim table names ${transcript}, which is not in ${dir}`);
      } else if (OBSERVATION_HEADER_RE.test(head)) {
        section = "target";
      } else {
        section = "other";
      }
      continue;
    }
    const last = body[body.length - 1];
    if (section === "transcript") {
      transcriptRows += 1;
      const m = last.match(JSONL_CITATION_RE);
      if (m === null) {
        refusals.push(`line ${i + 1}: a transcript claim row carries no jsonl:<line> citation: ${line}`);
        continue;
      }
      const bound = transcript === null ? 0 : (transcriptLineCounts.get(transcript) ?? 0);
      const n = Number(m[1]);
      if (n < 1 || n > bound) refusals.push(`line ${i + 1}: citation jsonl:${n} is outside ${transcript ?? "(no transcript)"}'s ${bound} line(s)`);
    } else if (section === "target") {
      targetRows += 1;
      if (!TARGET_CITATION_RE.test(last)) refusals.push(`line ${i + 1}: a target observation row carries no path:/note: citation: ${line}`);
    }
  }
  if (transcriptRows === 0) refusals.push("the report carries no transcript claim rows at all; a report that claims nothing is not re-checkable");
  if (targetRows === 0) refusals.push("the report carries no target observation rows at all");
  return refusals;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

let keepTarget = false;

function checkoutSha(): string {
  return probe(GIT_CMD, ["rev-parse", "HEAD"], spawnEnv(), PROBE_BOUND_MS, SCRIPT_ROOT)?.trim() ?? "UNKNOWN - verify — `git rev-parse HEAD` could not be read";
}

function targetObservations(build: TargetBuild, grant: GrantDerivation, stamps: readonly AuthorStamp[]): TargetRow[] {
  const rows: TargetRow[] = [];
  const contextRel = toPosix(CONTEXT_SUBPATH);
  rows.push({ label: "install", value: build.installerLine, citation: `path:${toPosix(join(ADAPTER_DIR))}` });
  rows.push({
    label: "derived grant",
    value: `${grant.granted.length} granted name(s); ${grant.adapterNames.length} adapter name(s); coordinator ${grant.coordinator ?? "(none)"}; prefix ${JSON.stringify(grant.prefix)}` + (grant.reasons.length === 0 ? `; the two derivations agree: census ${grant.adapterNames.length} = grant ${grant.granted.length} + the coordinator` : `; disagreement: ${grant.reasons.join(" / ")}`),
    citation: `path:${toPosix(ADAPTER_DIR)}`,
  });
  if (stamps.length === 0) {
    rows.push({ label: "D-02 side (b) author stamps", value: `no live note under ${contextRel}`, citation: `path:${contextRel}` });
  } else {
    for (const s of stamps) rows.push({ label: "D-02 side (b) author stamp", value: `${s.kind} by ${s.by}`, citation: `note:${s.task}/${s.noteId}` });
  }
  const marker = verdictMarkerObserved(stamps);
  rows.push({
    label: `verdict marker ${VERDICT_GREEN_MARKER}`,
    value: marker === null ? "absent from every live note" : `present in a ${marker.kind} note by ${marker.by}`,
    citation: marker === null ? `path:${contextRel}` : `note:${marker.task}/${marker.noteId}`,
  });
  return rows;
}

function equivalence(targets: readonly TargetBuild[]): string[] {
  if (targets.length !== 2) return ["dual-path equivalence needs exactly two targets"];
  const rootA = join(targets[0].target, CONTEXT_SUBPATH);
  const rootB = join(targets[1].target, CONTEXT_SUBPATH);
  const tasks = [...new Set([...contextTasks(rootA), ...contextTasks(rootB)])].sort();
  const diffs: string[] = [];
  for (const task of tasks) {
    for (const d of assertEquivalent(projectTaskState(rootA, task), projectTaskState(rootB, task))) diffs.push(`${task}: ${d}`);
  }
  return diffs;
}

function writeArtifacts(outDir: string, reportName: string, report: string, transcripts: readonly { name: string; text: string }[], homes: HomeSpellings): void {
  const redactedReport = redactText(report, homes);
  const redactedTranscripts = transcripts.map((t) => ({ name: t.name, text: redactText(t.text, homes) }));
  const survivors: string[] = [];
  for (const s of homeSpellingSurvivors(redactedReport, homes)) survivors.push(`report: ${s}`);
  for (const t of redactedTranscripts) for (const s of homeSpellingSurvivors(t.text, homes)) survivors.push(`${t.name}: ${s}`);
  if (survivors.length > 0) {
    fail(`redaction did not hold — ${survivors.length} home-path spelling(s) survive; nothing was written. Surviving form(s) are not repeated here.`);
  }
  mkdirSync(outDir, { recursive: true });
  for (const t of redactedTranscripts) writeFileSync(join(outDir, t.name), t.text);
  writeFileSync(join(outDir, reportName), redactedReport);
}

async function dryRun(opts: Options): Promise<number> {
  console.log("== grugops live capture — DRY RUN (D-10) ==");
  console.log("Walks every phase against the committed fixture transcript. It makes no model call.");
  console.log("");
  const homes = homeSpellings();
  const obs = observePreconditions();
  const table = evaluatePreconditions(obs);
  console.log(`phase 1: ${table.rows.length} precondition row(s) observed`);

  const targets = RUN_LABELS.map((label) => buildTarget(label));
  console.log(`phase 2: ${targets.length} target(s) built and installed; stopping before any platform invocation`);

  if (!existsSync(FIXTURE_JSONL)) fail(`the fixture transcript is missing at ${FIXTURE_JSONL}`);
  const frames = await readFrames(FIXTURE_JSONL);
  if (frames.frames.length === 0) fail(`the fixture transcript ${FIXTURE_JSONL} yielded no frame — the parser proves nothing over an empty stream`);
  const runs: RunReport[] = [];
  const projections: ReportModel["parity"]["projections"] = [];
  for (const build of targets) {
    const grant = deriveGrant(build.target);
    const stamps = authorStamps(join(build.target, CONTEXT_SUBPATH));
    const derived = deriveClaims(frames, grant, stamps);
    runs.push({
      label: build.label,
      transcriptName: DRY_RUN_TRANSCRIPT_NAME,
      argv: ["(dry run: no platform invocation)"],
      frames,
      claims: derived.claims,
      withheld: derived.withheld,
      targetRows: targetObservations(build, grant, stamps),
      capThreeReasons: derived.capThreeReasons,
      run: null,
    });
    projections.push({ label: build.label, projection: projectLivePath(stamps, frames.frames, grant.prefix) });
  }
  console.log(`phase 3: ${frames.frames.length} fixture frame(s) derived over, once per target (${runs.length})`);
  const diffs = equivalence(targets);
  const parityDiffs = compareLivePaths(projections[0].projection, projections[1].projection);
  const plugins = pluginLoadReport(frames.frames);

  const model: ReportModel = {
    mode: "dry-run",
    generatedAt: new Date().toISOString(),
    checkoutSha: checkoutSha(),
    platformVersion: obs.platformVersion ?? "UNKNOWN - verify",
    boundMs: CALL_BOUND_MS,
    boundUsed: "not applied — no platform call was made",
    approvalKeyLine: "absent; asserted on the constructed child environment before every spawn",
    installedPluginSha: plugins.loaded.length === 0 ? "UNKNOWN - verify — the fixture init frame lists no plugin" : installedPluginSha(plugins.loaded[0].path),
    preconditions: table,
    targets: targets.map((t) => ({ label: t.label, installerLine: t.installerLine })),
    runs,
    parity: { projections, diffs: parityDiffs },
    equivalenceDiffs: diffs,
    outcome: "no-go",
    outcomeReason: "no model call was made — a dry run is not a capture (D-10, D-11)",
  };
  const report = renderReport(model);
  const outDir = opts.out ?? makeScratchOut();
  writeArtifacts(outDir, DRY_RUN_REPORT_NAME, report, [{ name: DRY_RUN_TRANSCRIPT_NAME, text: readFileSync(FIXTURE_JSONL, "utf8") }], homes);
  console.log(`phase 4: redaction held over the report and the fixture-derived transcript`);
  console.log(`phase 5: wrote ${join(outDir, DRY_RUN_REPORT_NAME)} and ${join(outDir, DRY_RUN_TRANSCRIPT_NAME)}`);
  console.log("");
  for (const row of table.rows) console.log(`  ${row.state.padEnd(16)} ${row.name}`);
  console.log("");
  console.log(readinessLine(table));
  console.log(`OUTCOME: ${model.outcome}`);
  if (opts.keepTarget) for (const t of targets) console.log(`target ${t.label} kept at: ${t.target} (kit home ${t.home})`);
  console.log(DRY_RUN_COMPLETE);
  return 0;
}

function makeScratchOut(): string {
  // The artifact directory is the run's product, so it is created and printed, never removed.
  return mkdtempSync(join(tmpdir(), `${TMP_PREFIX}out-`));
}

async function capture(opts: Options): Promise<number> {
  console.log("== grugops live capture (D-01, D-07) ==");
  console.log(`Two bounded headless runs, each under ${CALL_BOUND_MS} ms. This spends real tokens.`);
  console.log("");
  const homes = homeSpellings();
  const obs = observePreconditions();
  const table = evaluatePreconditions(obs);
  console.log(readinessLine(table));
  if (table.readiness !== "ready") {
    fail("the live capture refuses to start while any precondition is not MET; the readiness line above names them. Run --dry-run and resolve them first.");
  }
  const targets = RUN_LABELS.map((label) => buildTarget(label));
  const outDir = opts.out ?? makeScratchOut();
  mkdirSync(outDir, { recursive: true });
  const grantSource = deriveGrant(targets[0].target);
  if (grantSource.coordinator === null) fail(`no coordinator adapter in the installed target: ${grantSource.reasons.join("; ")}`);

  const runs: RunReport[] = [];
  const rawTranscripts: { name: string; text: string }[] = [];
  const installLines: string[] = [];
  const projections: ReportModel["parity"]["projections"] = [];
  let hang = false;
  let anyFailure = false;
  for (const build of targets) {
    installLines.push(`target ${build.label}: ${pluginInstall(build.target, obs.pluginName, obs.marketplaceName)}`);
    const transcriptName = captureTranscriptName(build.label);
    const transcriptPath = join(build.target, transcriptName);
    const args: string[] = ["-p", LIVE_REQUEST, "--output-format", "stream-json", "--verbose", "--include-hook-events", "--forward-subagent-text", "--allowedTools", ...LIVE_ALLOWED_TOOLS];
    if (build.label === "B") args.push("--agent", grantSource.coordinator);
    const env = spawnEnv();
    console.log(`run ${build.label}: starting under a ${CALL_BOUND_MS} ms bound`);
    const result = await runPlatform(args, build.target, env, transcriptPath, CALL_BOUND_MS);
    console.log(`run ${build.label}: status ${String(result.status)}, signal ${String(result.signal)}, ${result.durationMs} ms`);
    const thisRunHung = result.timedOut || result.status === 143 || result.signal === "SIGTERM";
    if (thisRunHung) hang = true;
    if (result.error !== null || (result.status !== 0 && !thisRunHung)) anyFailure = true;
    const frames = await readFrames(transcriptPath);
    const grant = deriveGrant(build.target);
    const stamps = authorStamps(join(build.target, CONTEXT_SUBPATH));
    const derived = deriveClaims(frames, grant, stamps);
    if (derived.capThreeReasons.length > 0) anyFailure = true;
    runs.push({ label: build.label, transcriptName, argv: args, frames, claims: derived.claims, withheld: derived.withheld, targetRows: targetObservations(build, grant, stamps), capThreeReasons: derived.capThreeReasons, run: result });
    projections.push({ label: build.label, projection: projectLivePath(stamps, frames.frames, grant.prefix) });
    rawTranscripts.push({ name: transcriptName, text: readFileSync(transcriptPath, "utf8") });
    pluginUninstall(build.target, obs.pluginName);
  }
  // The replay comparator is recorded for the reader; it is NOT an outcome input (33-DIAGNOSIS
  // § 1.2: keyed on model-chosen task ids and timestamps, it reds over any two live sessions).
  const diffs = equivalence(targets);
  const parityDiffs = compareLivePaths(projections[0].projection, projections[1].projection);
  const denyFired = runs.some((r) => denyObservedInStream(r.frames.frames));
  if (!denyFired) anyFailure = true;
  const firstPlugins = pluginLoadReport(runs[0].frames.frames);
  const outcome: ReportModel["outcome"] = deriveOutcome({ hang, anyFailure, parityDiffs, provenance: "MET" });
  const outcomeReason = hang
    ? "a run reached the bound and was stopped (exit 143 or SIGINT at the bound)"
    : anyFailure
      ? "a run exited non-zero, a CAP-03 side failed, or the deny was not observed — see the sections above"
      : parityDiffs.length > 0
        ? `the two paths diverge under the path-invariant D-07 projection (${parityDiffs.length} named difference(s)) — see the parity section`
        : "both runs completed, both CAP-03 sides hold in both runs, the deny was observed on the hook channel, and the two paths project to parity";
  const model: ReportModel = {
    mode: "capture",
    generatedAt: new Date().toISOString(),
    checkoutSha: checkoutSha(),
    platformVersion: obs.platformVersion ?? "UNKNOWN - verify",
    boundMs: CALL_BOUND_MS,
    boundUsed: `${CALL_BOUND_MS} ms per call (SIGINT at the bound, SIGTERM ${SIGTERM_GRACE_MS} ms later)`,
    approvalKeyLine: "absent; asserted on the constructed child environment before every spawn",
    installedPluginSha: firstPlugins.loaded.length === 0 ? "UNKNOWN - verify — the init frame lists no plugin" : installedPluginSha(firstPlugins.loaded[0].path),
    preconditions: table,
    targets: targets.map((t, i) => ({ label: t.label, installerLine: `${t.installerLine}; ${installLines[i]}` })),
    runs,
    parity: { projections, diffs: parityDiffs },
    equivalenceDiffs: diffs,
    outcome,
    outcomeReason,
  };
  writeArtifacts(outDir, CAPTURE_SUMMARY_NAME, renderReport(model), rawTranscripts, homes);
  console.log(`wrote ${join(outDir, CAPTURE_SUMMARY_NAME)} and ${rawTranscripts.length} transcript(s)`);
  console.log(`OUTCOME: ${outcome}`);
  if (opts.keepTarget) for (const t of targets) console.log(`target ${t.label} kept at: ${t.target}`);
  console.log(CAPTURE_COMPLETE);
  return 0;
}

function verifyMode(opts: Options): number {
  const dir = opts.out as string;
  console.log(`== grugops live capture — artifact re-check over ${dir} ==`);
  const refusals = verifyArtifacts(dir);
  if (refusals.length === 0) {
    console.log("ARTIFACTS RE-CHECKED: every transcript claim row is cited within its transcript, no home-path spelling survives, and exactly one outcome line is present.");
    return 0;
  }
  for (const r of refusals) console.log(`REFUSED: ${r}`);
  console.log(`${refusals.length} refusal(s); the artifact set is not accepted.`);
  return 1;
}

async function main(argv: readonly string[]): Promise<number> {
  const opts = parseArgs(argv);
  keepTarget = opts.keepTarget;
  if (opts.verifyArtifacts) return verifyMode(opts);
  if (opts.dryRun) return dryRun(opts);
  return capture(opts);
}

async function runAll(): Promise<void> {
  let code = 1;
  try {
    code = await main(process.argv.slice(2));
  } catch (e) {
    // A run that dies reports no verdict. The failure is named and nothing is written.
    console.log(`CAPTURE NOT DERIVED: ${e instanceof CaptureFailure ? e.message : `unexpected error — ${e instanceof Error ? e.message : String(e)}`}`);
    console.log("No outcome line is reported, because a phase could not be derived.");
    code = 1;
  } finally {
    cleanupScratch(code === 0 && keepTarget);
  }
  process.exitCode = code;
}

// Entry check through the one shared predicate, so the offline suite can import every derivation
// above without this module running a capture inside the vitest worker.
const isEntry = isEntrypoint(import.meta.url);
if (isEntry) {
  void runAll();
}
