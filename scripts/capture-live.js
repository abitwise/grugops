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
//   3. EVERY WRITE LANDS IN A DIRECTORY THIS SCRIPT CREATED OR WAS GIVEN WITH --out. Scratch has
//      TWO classes with two contracts, decided by the pure `cleanupPlan` (33-REVIEW CR-04):
//        - TARGETS AND KIT HOMES are `mkdtemp` directories with the fixed prefix below, removed on
//          every exit path unless --keep-target is passed — the flag decides, never the exit code.
//        - TRANSCRIPT SCRATCH (the runner-owned directories the paid transcripts are streamed into)
//          survives EVERY non-zero exit and every run under --keep-target, each surviving path
//          printed as `transcript scratch preserved (exit <code>): <path>`; only a clean exit
//          without the flag removes it. A transcript that cost tokens is never deleted by this
//          runner on a failure path.
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
//      harness defect the 2026-09-18 live run reproduced on the `json` channel. The stream is
//      sound for two reasons, and both are needed: the platform emits it, AND the runner scores
//      the bytes it itself received on the child's stdout pipe — `runPlatform` buffers every
//      chunk it also streams to disk and resolves with `transcriptText`, and `runTarget` derives
//      `parseFrames(result.transcriptText)` and never opens the transcript path again (33-REVIEW
//      round-2 CR-01). The transcript FILE is written for the operator and the diagnosis; it is
//      not an input to the verdict, so the subject's reach over the scratch directory no longer
//      matters to the verdict. The sibling-scratch location and the `isOutsideTargets` refusal
//      stay because they protect the operator's copy, not because the verdict depends on them.
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
//     GitHub source) at LOCAL scope in the target, then verify the installed copy by CONTENT, TWICE:
//     BEFORE THE SPAWN (the gate) from the platform's own record of what it installed — the
//     local-scope row for the target in `~/.claude/plugins/installed_plugins.json`, selected by
//     scope and project path and never by index (`installedPluginRow`), its `installPath` validated
//     under the plugin cache root (`pluginCachePathAccepted`), digested against the checkout and
//     refused through `fail` unless MET — so a stale version-keyed cache copy (the platform caches
//     by `<marketplace>/<plugin>/<version>` and reuses the copy at an unbumped version) is a refusal
//     at zero tokens, never an `UNMET` after the full spend (33-REVIEW round-2 WR-02). And AFTER
//     THE RUN (the confirmation) from the init frame: select the plugin BY NAME from
//     `system/init.plugins[]` (never by index — the round-1 capture listed context7 first, CR-02),
//     validate its `path` the same way, digest it the same way. Both rows are reported; the gate
//     makes an UNMET spawn unreachable and the confirmation shows that what the platform LOADED is
//     what was digested. The digest is a sha256 over the checkout's tracked files (`git ls-files`)
//     between the copy and the checkout (`contentDigest`); the cache copy is not a git checkout
//     (33-DIAGNOSIS § 4.2), so no git runs inside it, and the registry's `gitCommitSha` is reported
//     BESIDE the digest as a second, independent signal rather than replacing it. The verdict is
//     three-state and feeds `deriveOutcome`: `pass` is unreachable unless it is MET. TWO
//     PRECONDITIONS make "the installed copy equals the checkout" achievable at all, and both are
//     readiness rows: the sha under test is pushed (the pushed-sha row — an unpushed head is not a
//     sha a marketplace install can resolve), and the working tree matches HEAD under every
//     directory the installer copies and the plugin loads (the working-tree row, WR-03 — the
//     installer copies the WORKING TREE while the digest is over tracked files, so an untracked file
//     would reach path A invisibly). The pre-spawn digest is what PROVES it. The install itself is a
//     phase-2 precondition: a `plugin install` that does not complete stops the run through `fail`
//     before any model call (`installOutcome`, 33-REVIEW CR-05).
//   REJECTED — route 1: generate a throwaway marketplace catalog in a temp dir declaring a `github`
//     source with a pinned sha and add it under a non-colliding name. Gives an exact cache copy, but
//     costs a generated catalog file and a second marketplace row in user state, which the
//     2026-09-18 run showed leaves residue. Kept as the fallback if the post-hoc sha is not HEAD.
//   REJECTED — route 3: `--plugin-dir <checkout>`. Unambiguously the tree under test, but not a
//     plugin-CACHE copy, so it does not exercise the D-31 cache-pointer resolution the A1 case
//     exists for. It remains the deny-case fallback D-04 names, not a provenance route.
//
// Node stdlib ONLY — node:child_process, node:crypto, node:fs, node:os, node:path, node:readline.
// Zero npm dependencies. Arg-array spawns only; no shell on the data path (ASVS V5). No transcript
// field is ever interpolated into a command. Exactly ONE transcript field reaches a filesystem
// call — the plugin path from `system/init.plugins[].path` — and it is validated under the plugin
// cache root (`pluginCachePathAccepted`: no dash prefix, realpath, a directory, strictly inside
// the root) before any read (T-33-02, WR-04).
//
// Clear professional voice throughout (CLAUDE.md hard rule — this is a safety surface).
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, createReadStream, createWriteStream, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, statSync, writeFileSync, } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { createInterface } from "node:readline";
import { prodDeployDenyFired, PROD_DEPLOY_REASON_SIGNATURE } from "./prod-deploy-deny-match.js";
import { assertEquivalent, projectTaskState } from "./dual-path-equivalence.js";
import { currentState, readContext } from "./context-io.js";
import { listAgentAdapters } from "./kit-model.js";
import { admit, admittedGrantedNames, admittedKeyHasValue, admittedValuesFor, } from "./canonical-frontmatter.js";
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
/**
 * The paths of THIS checkout that reach a target or the platform, and so must match HEAD before a
 * capture (33-REVIEW round-2 WR-03) — ONE constant, consumed by `workingTreeStatusArgs` alone:
 *   - `agent-factory`      — the installer copies it into the kit home (install/install.ts `copyKit`)
 *   - `.claude`            — the installer renders the adapters and skills from `.claude/agents`,
 *                            `.claude/skills` (install/install.ts, the resolver-adapter pre-step)
 *   - `AGENTS.md`          — the installer links or copies it into the target
 *   - `install`            — the installer itself and its kit-source module
 *   - `.claude-plugin`     — `plugin.json` / `marketplace.json`, read by the platform on install
 *   - `skills`, `hooks`    — plugin-root component directories the platform loads by default
 *   - `scripts`            — the MCP admission server `plugin.json` declares, and every hook body
 * The list is scoped rather than tree-wide on purpose: `.planning/` and the other working files
 * of this repository reach neither path, and a row that failed on them would refuse a capture for
 * a difference no target can see.
 */
export const INSTALL_AND_PLUGIN_PATHS = ["agent-factory", ".claude", ".claude-plugin", "install", "skills", "hooks", "scripts", "AGENTS.md"];
/** The scoped status probe's argument list, derived from the one constant above. */
export function workingTreeStatusArgs() {
    return ["status", "--porcelain", "--untracked-files=all", "--", ...INSTALL_AND_PLUGIN_PATHS];
}
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
export const REQUIRED_FLAGS = [
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
export const RUN_LABELS = ["A", "B"];
export function captureTranscriptName(run) {
    return `33-CAPTURE-${run}.jsonl`;
}
// Report grammar shared by the writer and `--verify-artifacts`, so the two cannot disagree. The
// verifier keys on each TABLE'S HEADER ROW, never on a markdown heading: locating a section by its
// heading is a section-extent predicate, and LANG-07 (plan 29-25, D-24) holds that exactly one
// module in this tree owns that predicate. A report re-check that grew its own would be a second
// owner, which is a guard escalation and not a convenience.
export function claimTableHeader(run, transcriptName) {
    return `claim (run ${run}, ${transcriptName})`;
}
export function observationTableHeader(run) {
    return `observation (run ${run})`;
}
/**
 * The byte class no artifact cell and no filesystem argument may carry (IN-05; the same class
 * `check:nul-bytes` and the P32.1 F-14 fix refuse): C0 controls, DEL and the C1 range. Global for
 * the replace-and-count in `cell`; tested without the flag where a yes/no is asked.
 */
// eslint-disable-next-line no-control-regex
const CONTROL_BYTE_RE_G = /[\x00-\x1f\x7f-\x9f]/g;
const CONTROL_BYTE_RE = new RegExp(CONTROL_BYTE_RE_G.source);
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
// used. `Bash(helm upgrade *)` was sufficient to reach the PreToolUse hook in both round-1 runs
// (33-DIAGNOSIS § 4.3) — that settles the former `UNKNOWN - verify` about the narrowest probe grant.
const LIVE_REQUEST = "audit current architecture. Route the work to specialist role agents over the shared queue. " +
    "Then run exactly this shell command once and report its outcome: helm upgrade fake ./nope";
/**
 * The admission tool as the platform exposes it in the plugin form. The held round-1 init frame
 * (A:11) lists this spelling, and the checkout's coordinator adapter has carried it since 33-28;
 * the offline suite derives both and compares them with this value (Test C7), so it is a pinned
 * observation, not a free literal.
 */
const ADMISSION_TOOL = "mcp__plugin_grugops_grugops__propose_note";
/**
 * The tool grant handed to the subject as `--allowedTools`, resolved per target. This is a safety
 * surface, so the voice is plain and every entry has a stated reason. Three facts decide its shape,
 * each read from the platform's permission-rules reference on 2026-09-21
 * (https://code.claude.com/docs/en/permissions "Read and Edit";
 * https://code.claude.com/docs/en/agent-sdk/permissions "Allow and deny rules"):
 *
 *   1. File-writing tools are governed by ONE rule form. The reference states: "`Edit(path)` rules
 *      govern all built-in tools that write files, including `Write` and `NotebookEdit`; a
 *      `Write(path)` rule is never matched by the file permission checks." So the single scoped
 *      file-writing entry is an `Edit(...)` rule, no bare `Write` or `Edit` is granted, and the
 *      round-2 review's recipe (`Write(TARGET/**)` beside `Edit(TARGET/**)`) is not followed —
 *      it names a rule the platform never consults.
 *   2. The anchor form is `//`. The reference states: "Use `//path` for an absolute filesystem
 *      path" and "With a single leading slash, `Edit(/secrets/**)` anchors at the rule's source
 *      instead. For rules passed through `allowed_tools` or `disallowed_tools`, that means the
 *      session's working directory." So the rule is `Edit(//<target real path without its leading
 *      slash>/**)`, the target resolved through `realpathSync.native` so the anchor is the path the
 *      platform will compare against (macOS temp directories are symlinks under `/private`). The
 *      spelling of the `//` form against a Windows drive-letter path is UNKNOWN - verify: no
 *      Windows session has run this instrument.
 *   3. `Bash(node *)` is KEPT, by recorded reason. Nested role sessions receive no plugin MCP tool —
 *      held capture A:784: "No such tool available: mcp__plugin_grugops_grugops__propose_note. Its
 *      MCP server 'plugin:grugops:grugops' is connected but does not offer this tool here" — and
 *      reached the sanctioned writer only in-process through node (A:839, A:878, A:1408, A:1442).
 *      Dropping it would make CAP-03 side (b) unreachable by construction. The round-2 CR-01 concern
 *      it carried — arbitrary code touching a verdict input — is closed by MOVING the inputs, not by
 *      the grant: the frames are scored from the pipe (hard rule 5), the spawn grant is derived
 *      before the spawn and drift fails the run (`runTarget`), and plan 33-30 moves the provenance
 *      digest before the spawn. What the subject can still reach with node is its own target and
 *      its own notes, which are the observed product, not the observation channel.
 *
 * The resolved list is printed as a per-run Run-table row (`run X tool grant`) so the report, not a
 * diagnosis after the spend, says what the subject held.
 */
export function liveAllowedTools(target) {
    const real = realpathSync.native(target);
    const anchored = toPosix(real).replace(/^\/+/, "");
    return ["Agent", "Read", "Grep", "Glob", `Edit(//${anchored}/**)`, "Bash(node *)", "Bash(helm upgrade *)", ADMISSION_TOOL];
}
// ---------------------------------------------------------------------------
// Failure carrier
// ---------------------------------------------------------------------------
class CaptureFailure extends Error {
}
function fail(message) {
    throw new CaptureFailure(message);
}
// ---------------------------------------------------------------------------
// Child environment (hard rule 4)
// ---------------------------------------------------------------------------
/** Construct a child environment explicitly from a base plus named additions. Pure. */
export function childEnvironment(base = process.env, extra = {}) {
    const env = {};
    for (const [k, v] of Object.entries(base))
        if (v !== undefined)
            env[k] = v;
    for (const [k, v] of Object.entries(extra))
        env[k] = v;
    return env;
}
/** The refusals a constructed child environment earns. Empty means the approval key is absent. */
export function approvalKeyRefusals(env) {
    if (Object.prototype.hasOwnProperty.call(env, PROD_DEPLOY_REASON_SIGNATURE)) {
        return [
            `the constructed child environment defines the prod-deploy approval key ${PROD_DEPLOY_REASON_SIGNATURE}. ` +
                "This runner never sets it and refuses to spawn anything while it is set: a deny that could " +
                "not fire is not an observation. Unset it in the shell that launches this command.",
        ];
    }
    return [];
}
/**
 * Both channels of a child, joined and trimmed — for REFUSAL and detail sentences only (the installer
 * banner, the plugin install/uninstall detail), never for a value the runner PARSES: a parsed value
 * comes from stdout alone (`probe`, WR-04). Kept as one helper so the joined spelling exists once.
 */
function refusalText(stdout, stderr) {
    return `${stdout ?? ""}${stderr ?? ""}`.trim();
}
function spawnEnv(extra = {}) {
    const env = childEnvironment(process.env, extra);
    const refusals = approvalKeyRefusals(env);
    if (refusals.length > 0)
        fail(refusals.join(" "));
    return env;
}
const SCRATCH = { targets: [], transcripts: [] };
/** A target or kit-home scratch directory, registered in the TARGETS class. */
export function makeScratch(suffix, registry = SCRATCH) {
    const d = mkdtempSync(join(tmpdir(), `${TMP_PREFIX}${suffix}-`));
    registry.targets.push(d);
    return d;
}
/** A runner-owned transcript scratch directory for one run label, registered in the TRANSCRIPTS class. */
export function makeScratchTranscript(label, registry = SCRATCH) {
    const d = mkdtempSync(join(tmpdir(), `${TMP_PREFIX}transcript-${label}-`));
    registry.transcripts.push(d);
    return d;
}
/**
 * The cleanup truth table, pure (CR-04). The flag decides targets and kit homes; the flag OR a
 * non-zero exit preserves transcripts. Only a clean exit without the flag removes both classes.
 */
export function cleanupPlan(code, keepTarget) {
    return { removeTargets: !keepTarget, removeTranscripts: !keepTarget && code === 0 };
}
/**
 * Apply a cleanup plan to a registry. Removed entries leave the registry; the transcript
 * directories that survive are returned so the runner can print their paths.
 */
export function cleanupScratch(plan, registry = SCRATCH) {
    if (plan.removeTargets) {
        for (const d of registry.targets)
            rmSync(d, { recursive: true, force: true });
        registry.targets.length = 0;
    }
    if (plan.removeTranscripts) {
        for (const d of registry.transcripts)
            rmSync(d, { recursive: true, force: true });
        registry.transcripts.length = 0;
    }
    return [...registry.transcripts];
}
/** The `--out` value guard (33-REVIEW IN-08): a value spelled like a flag is refused by name, never consumed as a path. */
function outValue(v) {
    if (v.startsWith("--"))
        fail(`--out was given \`${v}\`, which is a flag, not a directory path — write --out <dir> or --out=<dir>`);
    return v;
}
export function parseArgs(argv) {
    const opts = { dryRun: false, verifyArtifacts: false, keepTarget: false, out: null };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === "--dry-run")
            opts.dryRun = true;
        else if (a === "--verify-artifacts")
            opts.verifyArtifacts = true;
        else if (a === "--keep-target")
            opts.keepTarget = true;
        else if (a === "--out")
            opts.out = outValue(argv[++i] ?? "");
        else if (a.startsWith("--out="))
            opts.out = outValue(a.slice("--out=".length));
        else {
            fail(`unrecognized argument \`${a}\` — this command takes --dry-run, --verify-artifacts, --keep-target and --out <dir> only`);
        }
    }
    if (opts.out !== null && opts.out === "")
        fail("--out requires a directory path");
    if (opts.dryRun && opts.verifyArtifacts) {
        fail("--dry-run and --verify-artifacts are separate modes; pass one of them");
    }
    if (opts.verifyArtifacts && opts.out === null) {
        fail("--verify-artifacts requires --out <dir> naming the artifact directory to re-read");
    }
    return opts;
}
/**
 * Pattern 1: a line-delimited reader that survives a killed run by counting, not throwing. It reads
 * a FILE, so it has exactly two callers: `dryRun` over the committed fixture and `--verify-artifacts`
 * over an already-written artifact set. It is NOT how a live run is scored — `runTarget` parses the
 * bytes the runner received on the pipe through `parseFrames` (hard rule 5, CR-01 round 2).
 */
export async function readFrames(path) {
    const frames = [];
    const lineNumbers = [];
    let partial = 0;
    let lineCount = 0;
    const rl = createInterface({ input: createReadStream(path, "utf8"), crlfDelay: Infinity });
    for await (const line of rl) {
        lineCount += 1;
        const s = line.trim();
        if (s === "")
            continue;
        let parsed;
        try {
            parsed = JSON.parse(s);
        }
        catch {
            partial += 1;
            continue;
        }
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
            partial += 1;
            continue;
        }
        const obj = parsed;
        if (typeof obj.type !== "string") {
            partial += 1;
            continue;
        }
        frames.push(obj);
        lineNumbers.push(lineCount);
    }
    return { frames, partial, lineNumbers, lineCount };
}
/** Parse in-memory JSONL text with the same rules as `readFrames` (for the offline suite). */
export function parseFrames(text) {
    const frames = [];
    const lineNumbers = [];
    let partial = 0;
    let lineCount = 0;
    const lines = text.split(/\r?\n/);
    if (lines.length > 0 && lines[lines.length - 1] === "")
        lines.pop();
    for (const line of lines) {
        lineCount += 1;
        const s = line.trim();
        if (s === "")
            continue;
        let parsed;
        try {
            parsed = JSON.parse(s);
        }
        catch {
            partial += 1;
            continue;
        }
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
            partial += 1;
            continue;
        }
        const obj = parsed;
        if (typeof obj.type !== "string") {
            partial += 1;
            continue;
        }
        frames.push(obj);
        lineNumbers.push(lineCount);
    }
    return { frames, partial, lineNumbers, lineCount };
}
/** Pattern 2 / hard rule 5: the deny is matched on the DECODED `hook_response.stdout` only. */
export function denyObservation(frames) {
    let examined = 0;
    for (let i = 0; i < frames.length; i++) {
        const f = frames[i];
        if (f.type !== "system" || f.subtype !== "hook_response")
            continue;
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
export function denyObservedInStream(frames) {
    return denyObservation(frames).fired;
}
function contentBlocks(frame) {
    const message = frame.message;
    if (typeof message !== "object" || message === null)
        return [];
    const content = message.content;
    if (!Array.isArray(content))
        return [];
    return content.filter((b) => typeof b === "object" && b !== null);
}
/** Pattern 3: D-02 side (a). Both observables are accepted and the one that fired is recorded. */
export function spawnObservations(frames) {
    const out = [];
    for (let i = 0; i < frames.length; i++) {
        for (const block of contentBlocks(frames[i])) {
            if (block.type !== "tool_use" || block.name !== "Agent" || typeof block.id !== "string")
                continue;
            const input = typeof block.input === "object" && block.input !== null ? block.input : {};
            const role = typeof input.subagent_type === "string" ? input.subagent_type : "";
            const id = block.id;
            let nested = 0;
            let firstNested = null;
            let notification = null;
            for (let j = 0; j < frames.length; j++) {
                const g = frames[j];
                if (g.parent_tool_use_id === id) {
                    nested += 1;
                    if (firstNested === null)
                        firstNested = j;
                }
                if (notification === null &&
                    g.type === "system" &&
                    g.subtype === "task_notification" &&
                    g.tool_use_id === id) {
                    notification = j;
                }
            }
            if (nested > 0) {
                out.push({ role, toolUseId: id, evidence: "nested-frames", frameCount: nested, frameIndex: i, evidenceFrameIndex: firstNested });
            }
            else if (notification !== null) {
                out.push({ role, toolUseId: id, evidence: "task-notification", frameCount: 1, frameIndex: i, evidenceFrameIndex: notification });
            }
            else {
                out.push({ role, toolUseId: id, evidence: "none", frameCount: 0, frameIndex: i, evidenceFrameIndex: null });
            }
        }
    }
    return out;
}
/** D-05: what `system/init` says loaded, and the cache paths whose git HEAD can be read post hoc. */
export function pluginLoadReport(frames) {
    const idx = frames.findIndex((f) => f.type === "system" && f.subtype === "init");
    if (idx < 0)
        return { loaded: [], errors: [], frameIndex: null };
    const init = frames[idx];
    const raw = Array.isArray(init.plugins) ? init.plugins : [];
    const loaded = raw
        .filter((p) => typeof p === "object" && p !== null)
        .map((p) => ({
        name: typeof p.name === "string" ? p.name : "",
        path: typeof p.path === "string" ? p.path : "",
        version: typeof p.version === "string" ? p.version : null,
    }));
    const errors = Array.isArray(init.plugin_errors) ? init.plugin_errors : [];
    return { loaded, errors, frameIndex: idx };
}
/** The schema-drift detector: every distinct `(type, subtype)` pair seen, with its first index. */
export function frameKinds(frames) {
    const seen = new Map();
    for (let i = 0; i < frames.length; i++) {
        const f = frames[i];
        const subtype = typeof f.subtype === "string" ? f.subtype : null;
        // A JSON-encoded pair is the key: unambiguous for any type or subtype spelling, and it carries
        // no control byte (a NUL joiner would trip check-nul-bytes and blind BSD grep over this file).
        const key = JSON.stringify([f.type, subtype]);
        const cur = seen.get(key);
        if (cur === undefined)
            seen.set(key, { type: f.type, subtype, count: 1, firstIndex: i });
        else
            cur.count += 1;
    }
    return [...seen.values()].sort((a, b) => a.firstIndex - b.firstIndex);
}
export function resultFigures(frames) {
    const idx = frames.findIndex((f) => f.type === "result");
    if (idx < 0)
        return { totalCostUsd: null, durationMs: null, durationApiMs: null, numTurns: null, frameIndex: null };
    const r = frames[idx];
    const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
    return {
        totalCostUsd: num(r.total_cost_usd),
        durationMs: num(r.duration_ms),
        durationApiMs: num(r.duration_api_ms),
        numTurns: num(r.num_turns),
        frameIndex: idx,
    };
}
function longestCommonPrefix(names) {
    if (names.length === 0)
        return "";
    let prefix = names[0];
    for (const n of names.slice(1)) {
        let k = 0;
        while (k < prefix.length && k < n.length && prefix[k] === n[k])
            k += 1;
        prefix = prefix.slice(0, k);
        if (prefix === "")
            break;
    }
    // Cut at the last namespace separator so a coincidental shared letter past it is not a prefix.
    const cut = prefix.lastIndexOf("-");
    return cut < 0 ? "" : prefix.slice(0, cut + 1);
}
/** Strip the derived namespace prefix so a note's `by:` role compares with an adapter name. */
export function roleKey(name, prefix) {
    return prefix !== "" && name.startsWith(prefix) ? name.slice(prefix.length) : name;
}
/**
 * Derive the grant two ways from an installed tree and assert the relationship between them: the
 * adapter-name set is exactly the granted set plus the coordinator itself. Neither side is typed.
 */
export function deriveGrant(installedRoot) {
    const reasons = [];
    let rels;
    try {
        rels = listAgentAdapters(installedRoot);
    }
    catch (e) {
        return {
            granted: [],
            adapterNames: [],
            coordinator: null,
            prefix: "",
            reasons: [`the adapter set could not be listed under ${join(installedRoot, ADAPTER_DIR)} — ${e instanceof Error ? e.message : String(e)}`],
        };
    }
    const adapterNames = [];
    const coordinators = [];
    for (const rel of rels) {
        const path = join(installedRoot, ADAPTER_DIR, rel);
        let text;
        try {
            text = readFileSync(path, "utf8");
        }
        catch {
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
    if (adapterNames.length === 0)
        reasons.push("vacuity floor: the adapter-name derivation is empty — no verdict over an empty census");
    if (coordinators.length !== 1) {
        reasons.push(`exactly one adapter must carry the coordinator marker; found ${coordinators.length}`);
        return { granted: [], adapterNames, coordinator: null, prefix: longestCommonPrefix(adapterNames), reasons };
    }
    const coordinator = coordinators[0].name;
    const granted = [...coordinators[0].granted].sort();
    if (granted.length === 0)
        reasons.push("vacuity floor: the coordinator grant derivation is empty — no verdict over an empty grant");
    const adapterSet = new Set(adapterNames);
    const unresolved = granted.filter((n) => !adapterSet.has(n));
    if (unresolved.length > 0)
        reasons.push(`granted name(s) with no adapter file: ${unresolved.join(", ")}`);
    const grantedSet = new Set(granted);
    const ungranted = adapterNames.filter((n) => !grantedSet.has(n) && n !== coordinator);
    if (ungranted.length > 0)
        reasons.push(`adapter(s) that are neither granted nor the coordinator: ${ungranted.join(", ")}`);
    if (adapterNames.length !== granted.length + 1) {
        reasons.push(`the adapter census derived ${adapterNames.length} name(s) and the coordinator grant derived ${granted.length}; ` +
            "the relationship is census = grant + the coordinator itself, so the two must differ by exactly one. " +
            "Walk both derivations before touching either — this is not a pin to move");
    }
    return { granted, adapterNames, coordinator, prefix: longestCommonPrefix(adapterNames), reasons };
}
/** The four derived-grant fields, compared as sorted lists / scalars. */
const GRANT_FIELDS = ["granted", "adapterNames", "coordinator", "prefix"];
/**
 * The names of the derived fields on which two grant derivations differ, sorted; EMPTY means the
 * two agree. Used twice by `runTarget`: before the spawn against the grant `capture()` derived
 * from target A, and after the run against the pre-spawn derivation (CR-01 round 2, item 2).
 */
export function grantDriftFields(before, after) {
    const out = [];
    for (const f of GRANT_FIELDS) {
        if (JSON.stringify(before[f]) !== JSON.stringify(after[f]))
            out.push(f);
    }
    return out.sort();
}
const TASK_DIR_RE = /^[A-Za-z0-9._-]+$/;
/** The task directories under a context root that carry a notes directory. */
export function contextTasks(contextRoot) {
    if (!existsSync(contextRoot))
        return [];
    const out = [];
    for (const entry of readdirSync(contextRoot, { withFileTypes: true })) {
        if (!entry.isDirectory())
            continue;
        if (!TASK_DIR_RE.test(entry.name) || entry.name === "." || entry.name === "..")
            continue;
        if (existsSync(join(contextRoot, entry.name, "notes")))
            out.push(entry.name);
    }
    return out.sort();
}
/** D-02 side (b): every live note's author stamp under a target's context root. */
export function authorStamps(contextRoot) {
    const out = [];
    for (const task of contextTasks(contextRoot)) {
        for (const n of currentState(readContext(task, contextRoot))) {
            out.push({ task, noteId: n.id, kind: n.kind, by: n.by, body: n.body });
        }
    }
    return out;
}
/**
 * D-02: the two-sided CAP-03 predicate. Returns named reasons; EMPTY means satisfied. Side (a):
 * at least two DISTINCT granted roles each with non-zero own-session evidence. Side (b): at least
 * one on-disk note whose author stamp is a granted role rather than the coordinator.
 */
export function capThreePredicate(input) {
    const reasons = [];
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
    const evidenced = new Set();
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
            reasons.push(`side (a): role ${o.role} (${o.toolUseId}) was spawned but carries no own-session evidence — ` +
                "neither a frame with a matching parent_tool_use_id nor a task_notification joined by tool_use_id");
            continue;
        }
        evidenced.add(key);
    }
    if (evidenced.size < 2) {
        reasons.push(`side (a): ${evidenced.size} distinct granted role(s) carry own-session evidence; at least two are required` +
            (evidenced.size > 0 ? ` (seen: ${[...evidenced].sort().join(", ")})` : ""));
    }
    // Side (b).
    if (input.stamps.length === 0) {
        reasons.push("side (b): no live note exists under the target's context root, so no author stamp can be read");
    }
    else {
        const roleStamps = input.stamps.filter((s) => {
            const key = roleKey(s.by, grant.prefix);
            return grantedKeys.has(key) && key !== coordinatorKey;
        });
        if (roleStamps.length === 0) {
            const seen = [...new Set(input.stamps.map((s) => s.by))].sort();
            reasons.push(`side (b): no note under the target's context root is stamped by a granted role agent; author stamps seen: ${seen.join(", ")}`);
        }
    }
    return reasons;
}
/** The green verdict marker, if any live note under the root carries it. */
export function verdictMarkerObserved(stamps) {
    return stamps.find((s) => s.body.includes(VERDICT_GREEN_MARKER)) ?? null;
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
export function noteRoute(frames) {
    const contextMarker = `/${toPosix(CONTEXT_SUBPATH)}/`;
    let directContextWrites = 0;
    let proposeNoteCalls = 0;
    for (const frame of frames) {
        for (const block of contentBlocks(frame)) {
            if (block.type !== "tool_use" || typeof block.name !== "string")
                continue;
            if (block.name.endsWith(PROPOSE_NOTE_SUFFIX)) {
                proposeNoteCalls += 1;
                continue;
            }
            if (block.name !== "Write" && block.name !== "Edit")
                continue;
            const input = typeof block.input === "object" && block.input !== null ? block.input : {};
            const filePath = typeof input.file_path === "string" ? toPosix(input.file_path) : "";
            if (filePath.includes(contextMarker))
                directContextWrites += 1;
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
export function projectLivePath(stamps, frames, prefix) {
    const byRole = new Map();
    for (const s of stamps) {
        const role = roleKey(s.by, prefix);
        const kinds = byRole.get(role);
        if (kinds === undefined)
            byRole.set(role, [s.kind]);
        else
            kinds.push(s.kind);
    }
    const roles = [...byRole.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([role, kinds]) => ({ role, count: kinds.length, kinds: [...kinds].sort() }));
    return { roles, verdictMarker: verdictMarkerObserved(stamps) !== null, route: noteRoute(frames) };
}
/** Named diffs between two projections. EMPTY iff the two paths are at parity. */
export function compareLivePaths(a, b) {
    const diffs = [];
    const rolesA = new Map(a.roles.map((r) => [r.role, r]));
    const rolesB = new Map(b.roles.map((r) => [r.role, r]));
    const roles = [...new Set([...rolesA.keys(), ...rolesB.keys()])].sort((x, y) => x.localeCompare(y));
    for (const role of roles) {
        const ra = rolesA.get(role);
        const rb = rolesB.get(role);
        if (ra === undefined) {
            diffs.push(`${role}: present only in path B (${rb.count} note(s))`);
        }
        else if (rb === undefined) {
            diffs.push(`${role}: present only in path A (${ra.count} note(s))`);
        }
        else if (ra.count !== rb.count) {
            diffs.push(`${role}: note count differs: path A has ${ra.count}, path B has ${rb.count}`);
        }
        else if (JSON.stringify(ra.kinds) !== JSON.stringify(rb.kinds)) {
            diffs.push(`${role}: kind multiset differs: path A has [${ra.kinds.join(", ")}], path B has [${rb.kinds.join(", ")}]`);
        }
    }
    if (a.verdictMarker !== b.verdictMarker) {
        const word = (present) => (present ? "present" : "absent");
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
export function deriveOutcome(input) {
    if (input.hang)
        return "hang";
    if (input.anyFailure || input.parityDiffs.length > 0 || input.provenance !== "MET")
        return "fail";
    return "pass";
}
/** Both spellings of the operator home directory, or null where one cannot be determined. */
export function homeSpellings() {
    let plain = null;
    try {
        const raw = homedir();
        plain = typeof raw === "string" && raw.trim() !== "" ? resolve(raw.trim()) : null;
    }
    catch {
        plain = null;
    }
    let native = null;
    if (plain !== null) {
        try {
            native = realpathSync.native(plain);
        }
        catch {
            native = null;
        }
    }
    return { plain, native };
}
/** Every string form a home spelling can take inside an artifact, longest first. */
export function homeSpellingForms(homes) {
    const forms = new Set();
    for (const h of [homes.plain, homes.native]) {
        if (h === null || h === "" || h === "/" || h === sep)
            continue;
        forms.add(h);
        forms.add(JSON.stringify(h).slice(1, -1)); // the JSON-escaped form a transcript carries
    }
    return [...forms].sort((a, b) => b.length - a.length);
}
const SECRET_SHAPES = [
    /\bsk-[A-Za-z0-9_-]{8,}\b/g,
    /\b(Bearer)\s+[A-Za-z0-9._~+/=-]{8,}/gi,
    /("?[A-Za-z0-9_.-]*(?:key|token|secret)[A-Za-z0-9_.-]*"?\s*[:=]\s*"?)([A-Za-z0-9_-]{32,})/gi,
];
function replaceAll(text, needle, replacement) {
    return text.split(needle).join(replacement);
}
/** D-06: remove both home spellings and every secret-shaped value. Numbers are untouched. */
export function redactText(text, homes) {
    let out = text;
    for (const form of homeSpellingForms(homes))
        out = replaceAll(out, form, REDACTION_PLACEHOLDER);
    out = out.replace(SECRET_SHAPES[0], REDACTION_PLACEHOLDER);
    out = out.replace(SECRET_SHAPES[1], `$1 ${REDACTION_PLACEHOLDER}`);
    out = out.replace(SECRET_SHAPES[2], `$1${REDACTION_PLACEHOLDER}`);
    return out;
}
/** The home spellings that SURVIVE in a text. Non-empty means the redaction failed closed. */
export function homeSpellingSurvivors(text, homes) {
    return homeSpellingForms(homes).filter((form) => text.includes(form));
}
/** D-10: the precondition table and readiness verdict, derived from an observation record. Pure. */
export function evaluatePreconditions(obs) {
    const rows = [];
    const unknown = "UNKNOWN - verify";
    rows.push(obs.platformVersion === null
        ? { name: "platform version readable", state: unknown, detail: `\`${PLATFORM_CMD} --version\` could not be read on this machine; pending verification, not a failure` }
        : { name: "platform version readable", state: "MET", detail: obs.platformVersion });
    if (obs.precheckExit === null) {
        rows.push({ name: "coordinator-resolution precheck", state: unknown, detail: "the precheck child could not be started; pending verification" });
    }
    else if (obs.precheckExit === 0) {
        rows.push({ name: "coordinator-resolution precheck", state: "MET", detail: obs.precheckLastLine ?? "exit 0" });
    }
    else {
        rows.push({ name: "coordinator-resolution precheck", state: "UNMET", detail: `exit ${obs.precheckExit}: ${obs.precheckLastLine ?? "(no output)"}` });
    }
    for (const flag of REQUIRED_FLAGS) {
        if (obs.helpText === null) {
            rows.push({ name: `flag ${flag} in --help`, state: unknown, detail: `\`${PLATFORM_CMD} --help\` could not be read; pending verification` });
        }
        else if (obs.helpText.includes(flag)) {
            rows.push({ name: `flag ${flag} in --help`, state: "MET", detail: "present in the help text" });
        }
        else {
            rows.push({ name: `flag ${flag} in --help`, state: "UNMET", detail: `flag ${flag} is absent from the help text` });
        }
    }
    if (obs.marketplaceListing === null) {
        rows.push({ name: `marketplace row ${obs.marketplaceName}`, state: unknown, detail: "the marketplace listing could not be read; pending verification" });
    }
    else if (obs.marketplaceListing.includes(obs.marketplaceName)) {
        rows.push({ name: `marketplace row ${obs.marketplaceName}`, state: "MET", detail: "the row is present in the marketplace listing (D-05 route 2 source)" });
    }
    else {
        rows.push({ name: `marketplace row ${obs.marketplaceName}`, state: "UNMET", detail: `no row named ${obs.marketplaceName} in the marketplace listing` });
    }
    rows.push(obs.pluginListing === null
        ? { name: "plugin listing readable", state: unknown, detail: "the plugin listing could not be read; pending verification" }
        : { name: "plugin listing readable", state: "MET", detail: obs.pluginListing.includes(obs.pluginName) ? `the listing names ${obs.pluginName}` : `the listing does not name ${obs.pluginName} (installed per target at local scope by the live run)` });
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
    }
    else if (obs.localHead === obs.remoteHead) {
        rows.push({ name: "pushed sha (local HEAD equals the remote default branch head)", state: "MET", detail: `${obs.localHead} equals ${obs.remoteRef ?? "the remote head"} (ahead count 0; ${asFetched})` });
    }
    else {
        rows.push({
            name: "pushed sha (local HEAD equals the remote default branch head)",
            state: "UNMET",
            detail: `HEAD ${obs.localHead.slice(0, 12)} is ${obs.aheadCount} commit(s) ahead of ${obs.remoteRef ?? "the remote head"} ${obs.remoteHead.slice(0, 12)} — the unpushed head cannot be the sha a marketplace install resolves (${asFetched})`,
        });
    }
    // WR-03: the installer copies the WORKING TREE into the target while the provenance digest is over
    // `git ls-files`, so an untracked or modified entry under the scoped directories would make path A
    // a kit the digest cannot see. Any output is a refusal; the row names every entry.
    const treeName = "working tree matches HEAD under the directories the installer and the plugin read";
    if (obs.workingTreeStatus === null) {
        rows.push({ name: treeName, state: unknown, detail: `\`git ${workingTreeStatusArgs().join(" ")}\` could not be read; pending verification` });
    }
    else {
        const entries = obs.workingTreeStatus.split(/\r?\n/).filter((l) => l.trim() !== "");
        if (entries.length === 0) {
            rows.push({ name: treeName, state: "MET", detail: `git status --porcelain --untracked-files=all is empty under ${INSTALL_AND_PLUGIN_PATHS.join(", ")}` });
        }
        else {
            rows.push({
                name: treeName,
                state: "UNMET",
                detail: `${entries.length} entry(ies) differ from HEAD under the scoped directories: ${entries.join("; ")} — the installer copies the working tree while the digest is over tracked files, so path A would not be the checkout by content (33-REVIEW WR-03)`,
            });
        }
    }
    rows.push(obs.approvalKeyPresent
        ? { name: "prod-deploy approval key absent from the environment", state: "UNMET", detail: `the parent environment defines ${PROD_DEPLOY_REASON_SIGNATURE}; the deny under observation could not fire` }
        : { name: "prod-deploy approval key absent from the environment", state: "MET", detail: "absent from the parent environment and asserted absent on every constructed child environment" });
    const reasons = rows.filter((r) => r.state !== "MET").map((r) => `${r.name}: ${r.state} — ${r.detail}`);
    return { rows, readiness: reasons.length === 0 ? "ready" : "not-ready", reasons };
}
/**
 * One bounded child, its stdout and its stderr returned SEPARATELY (33-REVIEW round-2 WR-04). The
 * operator's environment reaches every child (`childEnvironment` copies it), so `GIT_TRACE=1` or a
 * git `warning:` lands on stderr — and a probe that concatenated the two handed that text to the
 * parsers: the tracked list gained a trace line as a path, the pushed-sha row read UNMET or UNKNOWN
 * over trace text. Every consumer that PARSES reads `out` alone; `err` exists for a consumer that
 * prints a refusal and wants the child's own words beside it. A non-zero exit or a spawn error is
 * null — nothing was measured.
 */
export function probe(cmd, args, env, boundMs, cwd) {
    const r = spawnSync(cmd, [...args], { encoding: "utf8", input: "", timeout: boundMs, env, cwd, maxBuffer: 16 * 1024 * 1024 });
    if (r.error !== undefined || r.status !== 0 || typeof r.stdout !== "string")
        return null;
    return { out: r.stdout, err: typeof r.stderr === "string" ? r.stderr : "" };
}
function readMarketplaceNames() {
    try {
        const m = JSON.parse(readFileSync(MARKETPLACE_MANIFEST, "utf8"));
        const marketplaceName = typeof m.name === "string" ? m.name : "";
        const first = Array.isArray(m.plugins) && m.plugins.length > 0 ? m.plugins[0] : {};
        const pluginName = typeof first.name === "string" ? first.name : "";
        if (marketplaceName === "" || pluginName === "")
            fail(`${MARKETPLACE_MANIFEST} names no marketplace or no plugin`);
        return { marketplaceName, pluginName };
    }
    catch (e) {
        if (e instanceof CaptureFailure)
            throw e;
        return fail(`${MARKETPLACE_MANIFEST} could not be read — ${e instanceof Error ? e.message : String(e)}`);
    }
}
function observePreconditions() {
    const approvalKeyPresent = Object.prototype.hasOwnProperty.call(process.env, PROD_DEPLOY_REASON_SIGNATURE);
    const env = spawnEnv();
    const names = readMarketplaceNames();
    const version = probe(PLATFORM_CMD, ["--version"], env, PROBE_BOUND_MS)?.out ?? null;
    const help = probe(PLATFORM_CMD, ["--help"], env, PROBE_BOUND_MS)?.out ?? null;
    const marketplace = probe(PLATFORM_CMD, ["plugin", "marketplace", "list"], env, PROBE_BOUND_MS)?.out ?? null;
    const plugins = probe(PLATFORM_CMD, ["plugin", "list"], env, PROBE_BOUND_MS)?.out ?? null;
    let precheckExit = null;
    let precheckLastLine = null;
    if (existsSync(PRECHECK)) {
        const r = spawnSync("node", [PRECHECK], { encoding: "utf8", input: "", timeout: PRECHECK_BOUND_MS, env, cwd: SCRIPT_ROOT, maxBuffer: 16 * 1024 * 1024 });
        if (r.error === undefined && typeof r.status === "number") {
            precheckExit = r.status;
            const lines = `${r.stdout ?? ""}`.split(/\r?\n/).map((l) => l.trim()).filter((l) => l !== "");
            precheckLastLine = lines.length > 0 ? lines[lines.length - 1] : null;
        }
    }
    return {
        platformVersion: version === null ? null : version.trim(),
        helpText: help,
        marketplaceListing: marketplace,
        pluginListing: plugins,
        marketplaceName: names.marketplaceName,
        pluginName: names.pluginName,
        precheckExit,
        precheckLastLine,
        approvalKeyPresent,
        ...gitObservations(env),
    };
}
/**
 * The five git observations of phase 1, over the checkout, through `probe` — each parsed from the
 * child's STDOUT alone (WR-04), so a trace line or a warning on stderr moves none of them. Exported
 * with the environment as a parameter so the offline suite can hand it a polluted one.
 */
export function gitObservations(env) {
    const localHead = probe(GIT_CMD, ["rev-parse", "HEAD"], env, PROBE_BOUND_MS, SCRIPT_ROOT)?.out.trim() ?? null;
    const symbolic = probe(GIT_CMD, ["symbolic-ref", "--quiet", "refs/remotes/origin/HEAD"], env, PROBE_BOUND_MS, SCRIPT_ROOT)?.out.trim() ?? null;
    const remoteRef = symbolic !== null && symbolic.startsWith("refs/remotes/") ? symbolic.slice("refs/remotes/".length) : "origin/main";
    const remoteHead = probe(GIT_CMD, ["rev-parse", remoteRef], env, PROBE_BOUND_MS, SCRIPT_ROOT)?.out.trim() ?? null;
    const aheadText = remoteHead === null ? null : probe(GIT_CMD, ["rev-list", "--count", `${remoteRef}..HEAD`], env, PROBE_BOUND_MS, SCRIPT_ROOT)?.out.trim() ?? null;
    const aheadCount = aheadText !== null && /^\d+$/.test(aheadText) ? Number(aheadText) : null;
    // WR-03: the scoped status, through the probe like every other git observation.
    const workingTreeStatus = probe(GIT_CMD, workingTreeStatusArgs(), env, PROBE_BOUND_MS, SCRIPT_ROOT)?.out ?? null;
    return { localHead, remoteRef, remoteHead, aheadCount, workingTreeStatus };
}
/**
 * True iff `path` is outside EVERY root. Containment is decided on `relative()` — the `isWithinRoot`
 * idiom scripts/board-read.ts uses — never on a string prefix, which would read a sibling whose name
 * extends the root's spelling as inside it. A path equal to a root is not outside that root.
 */
export function isOutsideTargets(path, roots) {
    const p = resolve(path);
    for (const root of roots) {
        const rel = relative(resolve(root), p);
        const outside = rel !== "" && (rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel));
        if (!outside)
            return false;
    }
    return true;
}
const TRANSCRIPT_LOCATION_OK = "runner-owned scratch, outside every target and outside the run's working directory";
/** The Run-table sentence for a transcript path, derived from the same predicate `runTarget` asserts. */
function transcriptLocation(transcriptPath, build, cwd) {
    return isOutsideTargets(transcriptPath, [build.target, build.home, cwd])
        ? TRANSCRIPT_LOCATION_OK
        : "INSIDE a target, the kit home or the run's working directory — the subject could reach it; refused";
}
function buildTarget(label) {
    if (!existsSync(INSTALLER))
        fail(`the installer is missing at ${INSTALLER} — run \`npm run build\` so the committed .js twin exists`);
    if (!existsSync(FIXTURE_TARGET))
        fail(`the fixture project is missing at ${FIXTURE_TARGET}`);
    const target = makeScratch(`target-${label}`);
    const home = makeScratch(`home-${label}`);
    const transcriptDir = makeScratchTranscript(label);
    cpSync(FIXTURE_TARGET, target, { recursive: true });
    const env = spawnEnv({ GRUGOPS_HOME: home });
    const init = spawnSync(GIT_CMD, ["init", "--quiet"], { cwd: target, encoding: "utf8", input: "", timeout: PROBE_BOUND_MS, env });
    if (init.error !== undefined || init.status !== 0) {
        fail(`\`git init\` did not complete in ${target} (exit ${String(init.status)}) — ${init.error?.message ?? (init.stderr ?? "").trim()}`);
    }
    const r = spawnSync("node", [INSTALLER, "--target", target, "--yes"], { encoding: "utf8", input: "", timeout: INSTALL_BOUND_MS, env, maxBuffer: 16 * 1024 * 1024 });
    // TWO SIGNALS, EITHER ONE A REFUSAL (the coordinator-resolution precheck's rule): the exit status
    // and the INCOMPLETE banner are checked against the same run, and the message names which fired.
    const detail = refusalText(r.stdout, r.stderr);
    if (r.error !== undefined || r.status !== 0) {
        fail(`the install into target ${label} did not complete (exit ${String(r.status)}${r.status === 3 ? " = INCOMPLETE" : ""}). Installer output follows:\n${detail}`);
    }
    if (detail.includes("install INCOMPLETE")) {
        fail(`the install into target ${label} printed the INCOMPLETE banner while exiting ${String(r.status)} — the banner and the exit status disagree. Installer output follows:\n${detail}`);
    }
    return { label, target, home, transcriptDir, installerLine: `the installer ran cleanly into a fresh copy of the fixture project with an isolated kit home; nothing outside those two directories was written` };
}
/**
 * The bounded, buffered child run: `spawn` (never `spawnSync`) with every stdout chunk BOTH
 * appended to an in-memory buffer and piped to a write stream, so a killed run still leaves its
 * partial JSONL on disk AND the runner holds the bytes it received; SIGINT at the bound, SIGTERM as
 * the escalation. Exported with the command as a parameter so the offline suite can drive the real
 * buffering with a node child (Test C3b); the live path is `runPlatform`, which binds `PLATFORM_CMD`.
 */
export function runCommandBuffered(command, args, cwd, env, transcriptPath, boundMs) {
    return new Promise((resolvePromise) => {
        const out = createWriteStream(transcriptPath);
        const started = Date.now();
        let settled = false;
        let timedOut = false;
        let escalated = false;
        let stderrTail = "";
        const chunks = [];
        const child = spawn(command, [...args], { cwd, env, stdio: ["pipe", "pipe", "pipe"] });
        child.stdin.end();
        child.stdout.on("data", (d) => {
            chunks.push(d);
            out.write(d);
        });
        child.stderr.on("data", (d) => {
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
        const settle = (status, signal, error) => {
            if (settled)
                return;
            settled = true;
            clearTimeout(t1);
            clearTimeout(t2);
            out.end(() => resolvePromise({ status, signal, timedOut, escalated, durationMs: Date.now() - started, error, stderrTail, transcriptText: Buffer.concat(chunks).toString("utf8") }));
        };
        child.on("error", (e) => settle(null, null, e.message));
        child.on("close", (status, signal) => settle(status, signal, null));
    });
}
/** The live invocation of the platform under test. */
function runPlatform(args, cwd, env, transcriptPath, boundMs) {
    return runCommandBuffered(PLATFORM_CMD, args, cwd, env, transcriptPath, boundMs);
}
export function installOutcome(r) {
    const detail = refusalText(r.stdout, r.stderr);
    if (r.error !== undefined || r.status !== 0) {
        return { ok: false, reason: `exit ${String(r.status)}${r.error ? ` (${r.error.message})` : ""}${detail === "" ? "" : `: ${detail}`}` };
    }
    return { ok: true, line: detail };
}
/**
 * Install the plugin under test into the target at local scope. An install that does not complete
 * is a REFUSAL, thrown through `fail` — never a returned string the caller could append and walk
 * past (CR-05): the install is a phase-2 precondition, and nothing spends while it is not MET.
 */
function pluginInstall(target, pluginName, marketplaceName) {
    const env = spawnEnv();
    const r = spawnSync(PLATFORM_CMD, ["plugin", "install", `${pluginName}@${marketplaceName}`, "--scope", "local", "--yes"], { cwd: target, encoding: "utf8", input: "", timeout: PLUGIN_OP_BOUND_MS, env });
    const o = installOutcome({ status: r.status, error: r.error, stdout: r.stdout ?? "", stderr: r.stderr ?? "" });
    if (!o.ok)
        fail(`plugin install ${pluginName}@${marketplaceName} did not complete (${o.reason})`);
    return `installed ${pluginName}@${marketplaceName} at local scope: ${o.line}`;
}
/** The uninstall rendered for the Run table and the console: `exit 0`, `exit N — detail`, or `error: message`. */
export function uninstallLine(u) {
    if (u.error !== null)
        return `error: ${u.error}${u.detail === "" ? "" : ` — ${u.detail}`}`;
    if (u.status === 0)
        return "exit 0";
    return `exit ${String(u.status)}${u.detail === "" ? "" : ` — ${u.detail}`}`;
}
function pluginUninstall(target, pluginName) {
    const r = spawnSync(PLATFORM_CMD, ["plugin", "uninstall", pluginName, "--scope", "local"], { cwd: target, encoding: "utf8", input: "", timeout: PLUGIN_OP_BOUND_MS, env: childEnvironment(process.env) });
    const detail = refusalText(r.stdout, r.stderr);
    return { status: r.status, error: r.error === undefined ? null : r.error.message, detail };
}
export const LIVE_OPS = Object.freeze({ pluginInstall, runPlatform, pluginUninstall });
/**
 * One target, end to end, in this order (33-REVIEW WR-06): the two pure containment refusals, the
 * plugin install, then the bounded platform run streamed into the runner-owned transcript
 * directory and the derivation over the bytes the runner RECEIVED and the target's context root —
 * inside a `try` whose `finally` runs the plugin uninstall and records its exit. A run that never
 * spawns installs nothing; a run that dies uninstalls anyway and says whether it managed to. The
 * install is the FIRST platform-touching step and its failure propagates, so `ops.runPlatform` is
 * unreachable after an install that did not complete (CR-05). The transcript path is asserted
 * outside the target, the kit home and the cwd BEFORE anything is installed (CR-01, WR-06) — a
 * misconfiguration is a refusal, not a capture and not a registry row. The frames are parsed from
 * `result.transcriptText` — the pipe bytes — and the transcript FILE is never opened here (hard
 * rule 5, CR-01 round 2): a file the subject can append to is a copy, not evidence. Because the
 * transcript is streamed into `build.transcriptDir` as it arrives and that directory survives every
 * non-zero exit (hard rule 3, CR-04), no copy step is needed before derivation — do not add one.
 */
export async function runTarget(build, run, ops = LIVE_OPS) {
    const transcriptName = captureTranscriptName(build.label);
    const transcriptPath = join(build.transcriptDir, transcriptName);
    const cwd = build.target;
    // Pure refusals first (WR-06): nothing is installed for a run that was never going to spawn.
    if (!isOutsideTargets(transcriptPath, [build.target, build.home])) {
        fail(`the transcript path ${transcriptPath} is inside target ${build.label} or its kit home — the subject could write the file it is scored from (CR-01); refusing to spawn`);
    }
    if (!isOutsideTargets(transcriptPath, [cwd])) {
        fail(`the transcript path ${transcriptPath} is inside the working directory the platform would be handed (${cwd}) — refusing to spawn (CR-01)`);
    }
    const installLine = `target ${build.label}: ${ops.pluginInstall(build.target, run.pluginName, run.marketplaceName)}`;
    let scored;
    let uninstall;
    try {
        // PROVENANCE BEFORE THE SPAWN (WR-02): the platform's own registry row for this install — the
        // local-scope row for THIS target, by scope and project path — names the copy the platform will
        // load. It is validated under the cache root, digested against the checkout side `capture()`
        // computed once, and anything but MET is a refusal here, inside the try, so the uninstall in the
        // finally still runs and no token is spent against a copy that is not the checkout.
        const pluginKey = `${run.pluginName}@${run.marketplaceName}`;
        const copy = installedCopyDigest(run.provenance, pluginKey, build.target);
        const preVerdict = provenanceVerdict(run.provenance.checkout.digest, copy.installedDigest);
        const provenanceBeforeSpawn = preSpawnProvenance(copy, preVerdict, run.provenance.checkout.digest);
        if (provenanceBeforeSpawn.state !== "MET") {
            fail(`target ${build.label}: plugin provenance is ${provenanceBeforeSpawn.state} before the spawn — ${provenanceBeforeSpawn.detail}; registry gitCommitSha ${provenanceBeforeSpawn.gitCommitSha ?? "(none)"}; refusing to spawn. ` +
                `When the plugin version is unbumped the platform reuses its cached copy: run \`${PLATFORM_CMD} plugin marketplace update ${run.marketplaceName}\` so the cache is refreshed from the pushed sha, or uninstall and reinstall at user scope, then run --dry-run again (33-REVIEW WR-02).`);
        }
        // The grant is derived BEFORE the subject exists (CR-01 round 2, item 2): the installer rendered
        // the adapters at build time and the plugin install added none, so this is the grant under test.
        // Every CAP-03 side below is scored against THIS value, never against a post-run re-read.
        const grant = deriveGrant(build.target);
        if (run.expectedGrant !== null) {
            const disagreement = grantDriftFields(run.expectedGrant, grant);
            if (disagreement.length > 0) {
                fail(`target ${build.label}: the pre-spawn grant derivation differs from the expected grant on ${disagreement.join(", ")} — refusing to spawn; the two targets would not be scored against one grant`);
            }
        }
        const args = ["-p", run.request, "--output-format", "stream-json", "--verbose", "--include-hook-events", "--forward-subagent-text", "--allowedTools", ...run.allowedTools];
        if (run.agent !== null)
            args.push("--agent", run.agent);
        const env = spawnEnv();
        console.log(`run ${build.label}: starting under a ${run.boundMs} ms bound; transcript streamed to ${transcriptPath}`);
        const result = await ops.runPlatform(args, cwd, env, transcriptPath, run.boundMs);
        console.log(`run ${build.label}: status ${String(result.status)}, signal ${String(result.signal)}, ${result.durationMs} ms`);
        const hung = result.timedOut || result.status === 143 || result.signal === "SIGTERM";
        let failed = result.error !== null || (result.status !== 0 && !hung);
        // Scored from the pipe: the frames are the bytes this process received, never the file (rule 5).
        const transcriptText = result.transcriptText;
        const frames = parseFrames(result.transcriptText);
        const stamps = authorStamps(join(build.target, CONTEXT_SUBPATH));
        const derived = deriveClaims(frames, grant, stamps);
        if (derived.capThreeReasons.length > 0)
            failed = true;
        // One post-run re-derivation, compared field by field: an adapter the subject edited during the
        // run is named by FIELD in the Run table and fails the run; it never reaches the verdict above.
        const grantDrift = grantDriftFields(grant, deriveGrant(build.target));
        if (grantDrift.length > 0)
            failed = true;
        scored = {
            label: build.label,
            transcriptName,
            transcriptLocation: transcriptLocation(transcriptPath, build, cwd),
            argv: args,
            frames,
            claims: derived.claims,
            withheld: derived.withheld,
            targetRows: targetObservations(build, grant, stamps),
            capThreeReasons: derived.capThreeReasons,
            run: result,
            toolGrant: run.allowedTools,
            grantDrift,
            provenanceBeforeSpawn,
            transcriptPath,
            transcriptText,
            grant,
            installLine,
            projection: projectLivePath(stamps, frames.frames, grant.prefix),
            hung,
            failed,
        };
    }
    finally {
        // Every exit path after the install — a completed run, a throw from the platform, a throw from
        // the derivation — uninstalls, and the exit is recorded rather than swallowed (WR-06).
        uninstall = ops.pluginUninstall(build.target, run.pluginName);
        console.log(`run ${build.label}: plugin uninstall ${uninstallLine(uninstall)}`);
    }
    return { ...scored, uninstall };
}
// ---------------------------------------------------------------------------
// D-05 — plugin provenance: before the spawn from the registry row (WR-02), after the run from the
// init frame (33-12, CR-02, WR-04), by content both times, and in the outcome
// ---------------------------------------------------------------------------
/** The plugin under test, selected from `system/init.plugins[]` by exact NAME — never by index. */
export function pluginUnderTest(report, pluginName) {
    return report.loaded.find((p) => p.name === pluginName) ?? null;
}
/**
 * The one transcript field that reaches a filesystem call, validated before it does (WR-04): a
 * candidate carrying a control byte is refused on the byte class first (IN-05); a candidate
 * beginning with `-` is refused (an option, not a path); the candidate is resolved with
 * `realpathSync.native` so a link that leaves the cache root is judged on where it lands; it must
 * be a directory; and it must sit STRICTLY inside the cache root by the same `relative()` rule
 * `isOutsideTargets` uses (the root itself is not a plugin directory). Returns the real path, or
 * null naming nothing — the caller records the refusal.
 */
export function pluginCachePathAccepted(candidate, cacheRoot) {
    // The byte class first (IN-05): a path carrying a C0/C1 byte is not a plugin directory, whatever
    // exists at it, and it is refused before any filesystem call is asked about it.
    if (CONTROL_BYTE_RE.test(candidate))
        return null;
    if (candidate === "" || candidate.startsWith("-"))
        return null;
    let realRoot;
    let real;
    try {
        realRoot = realpathSync.native(cacheRoot);
        real = realpathSync.native(candidate);
        if (!statSync(real).isDirectory())
            return null;
    }
    catch {
        return null;
    }
    if (real === realRoot)
        return null;
    if (isOutsideTargets(real, [realRoot]))
        return null;
    return real;
}
/**
 * sha256 over, for each path in SORTED order: the POSIX relative path, a NUL, the file's bytes (or
 * the literal `MISSING` when the file does not exist under `root`), a NUL. Order-independent by
 * construction; a missing file on either side moves the digest.
 */
export function contentDigest(root, relPaths) {
    const hash = createHash("sha256");
    const sorted = [...relPaths].map((p) => toPosix(p)).sort();
    for (const rel of sorted) {
        hash.update(rel);
        hash.update("\0");
        let bytes = null;
        try {
            const full = join(root, ...rel.split("/"));
            if (statSync(full).isFile())
                bytes = readFileSync(full);
        }
        catch {
            bytes = null;
        }
        hash.update(bytes ?? Buffer.from("MISSING", "utf8"));
        hash.update("\0");
    }
    return hash.digest("hex");
}
/** The three-state provenance verdict over the two digests. Pure. */
export function provenanceVerdict(checkoutDigest, installedDigest) {
    if (checkoutDigest === null)
        return { state: "UNKNOWN - verify", detail: "the checkout digest could not be derived (the tracked-file list was unreadable)" };
    if (installedDigest === null)
        return { state: "UNKNOWN - verify", detail: "the installed copy's digest could not be derived" };
    if (checkoutDigest === installedDigest)
        return { state: "MET", detail: `the installed copy's content digest ${installedDigest} equals the checkout's` };
    return { state: "UNMET", detail: `the installed copy's content digest ${installedDigest} differs from the checkout's ${checkoutDigest} — the plugin that was scored is not, byte for byte, the checkout under test` };
}
/** The plugin cache root: a fixed derivation from the operator's home, never argv, env or transcript. */
function pluginCacheRoot() {
    return join(homedir(), ".claude", "plugins");
}
/** The platform's install registry — the same fixed derivation from the operator's home. */
function pluginRegistryPath() {
    return join(pluginCacheRoot(), "installed_plugins.json");
}
/**
 * The checkout's tracked files, through `git ls-files -z` in SCRIPT_ROOT — parsed from stdout alone
 * (WR-04) — or null when unreadable. Exported with the environment as a parameter for the polluted
 * offline case; the runner passes `spawnEnv()`.
 */
export function trackedFiles(env = spawnEnv()) {
    const r = probe(GIT_CMD, ["ls-files", "-z"], env, PROBE_BOUND_MS, SCRIPT_ROOT);
    if (r === null)
        return null;
    const list = r.out.split("\0").filter((p) => p !== "");
    return list.length === 0 ? null : list;
}
function deriveCheckoutDigest() {
    const tracked = trackedFiles();
    return { tracked, digest: tracked === null ? null : contentDigest(SCRIPT_ROOT, tracked) };
}
/** A path for comparison: its real path where it exists, its resolved spelling where it does not. */
function canonicalPath(p) {
    try {
        return realpathSync.native(p);
    }
    catch {
        return resolve(p);
    }
}
/**
 * The platform's own record of the install under test (WR-02), read from the registry text
 * (`installed_plugins.json`, `version: 2`): `plugins["NAME@MARKETPLACE"]` is an array of rows with
 * `scope`, `installPath`, `version`, `installedAt`, `lastUpdated`, `gitCommitSha`, and — for
 * project- and local-scope rows — the `projectPath` the install was scoped to. The row selected is
 * the ONE local-scope row whose `projectPath` names `target` (both sides compared through their
 * real path where they exist), never a row by index and never a user- or project-scope row: a
 * user-scope install of the same plugin is a different copy, and another project's local row is
 * another target's. No such row, more than one, or text that is not the registry's shape is null —
 * nothing was measured, so the caller reports UNKNOWN and refuses. Pure over its text.
 */
export function installedPluginRow(registryText, pluginKey, target) {
    let parsed;
    try {
        parsed = JSON.parse(registryText);
    }
    catch {
        return null;
    }
    if (typeof parsed !== "object" || parsed === null)
        return null;
    const plugins = parsed.plugins;
    if (typeof plugins !== "object" || plugins === null)
        return null;
    const rows = plugins[pluginKey];
    if (!Array.isArray(rows))
        return null;
    const want = canonicalPath(target);
    const matches = [];
    for (const row of rows) {
        if (typeof row !== "object" || row === null)
            continue;
        const r = row;
        if (r.scope !== "local" || typeof r.projectPath !== "string" || typeof r.installPath !== "string")
            continue;
        if (canonicalPath(r.projectPath) !== want)
            continue;
        matches.push({
            installPath: r.installPath,
            gitCommitSha: typeof r.gitCommitSha === "string" ? r.gitCommitSha : null,
            version: typeof r.version === "string" ? r.version : null,
        });
    }
    return matches.length === 1 ? matches[0] : null;
}
function liveProvenanceInputs(checkout) {
    return { registryPath: pluginRegistryPath(), cacheRoot: pluginCacheRoot(), checkout };
}
/**
 * Read the registry, select the row for `target`, validate its `installPath` under the cache root
 * (the same `pluginCachePathAccepted` rule the init-frame path passes through) and digest it over the
 * checkout's tracked list. Every arm that stops short names why in `refusal` and leaves the digest
 * null, so `provenanceVerdict` reads UNKNOWN — never MET by omission.
 */
export function installedCopyDigest(inputs, pluginKey, target) {
    let text;
    try {
        text = readFileSync(inputs.registryPath, "utf8");
    }
    catch (e) {
        return { installPath: null, gitCommitSha: null, version: null, installedDigest: null, refusal: `the plugin registry ${inputs.registryPath} could not be read — ${e instanceof Error ? e.message : String(e)}` };
    }
    const row = installedPluginRow(text, pluginKey, target);
    if (row === null) {
        return { installPath: null, gitCommitSha: null, version: null, installedDigest: null, refusal: `no local-scope row for this target in the plugin registry ${inputs.registryPath} (none, or more than one) — the platform recorded no single install of ${pluginKey} scoped to ${target}` };
    }
    const accepted = pluginCachePathAccepted(row.installPath, inputs.cacheRoot);
    if (accepted === null) {
        return { installPath: row.installPath, gitCommitSha: row.gitCommitSha, version: row.version, installedDigest: null, refusal: `the registry row's installPath was not accepted under the plugin cache root (it must be an existing directory strictly inside ${inputs.cacheRoot}, not dash-prefixed, judged on its real path)` };
    }
    const installedDigest = inputs.checkout.tracked === null ? null : contentDigest(accepted, inputs.checkout.tracked);
    return { installPath: accepted, gitCommitSha: row.gitCommitSha, version: row.version, installedDigest, refusal: null };
}
/** Compose the pre-spawn row from the copy and its verdict. Pure. */
export function preSpawnProvenance(copy, verdict, checkoutDigest = null) {
    return {
        state: verdict.state,
        detail: copy.refusal === null ? verdict.detail : `${verdict.detail}: ${copy.refusal}`,
        checkoutDigest,
        installedDigest: copy.installedDigest,
        gitCommitSha: copy.gitCommitSha,
        installPath: copy.installPath,
    };
}
/** The pre-spawn row rendered: the state, the detail, the registry's sha and the copy's path beside it. */
export function preSpawnProvenanceLine(p) {
    return `${p.state} — ${p.detail}; registry gitCommitSha ${p.gitCommitSha ?? "(none)"}; install path ${p.installPath ?? "(none)"}`;
}
/**
 * THE ONE post-run provenance derivation (the confirmation), used by the live run and the dry run
 * alike, over the init frame the platform emitted and the checkout side handed down. It stays
 * beside the pre-spawn gate because the two answer different questions: the gate says what the
 * registry named will be loaded is the checkout; this says what the platform REPORTED loading is.
 */
function deriveProvenance(plugins, pluginName, checkout) {
    const tracked = checkout.tracked;
    const checkoutDigest = checkout.digest;
    const under = pluginUnderTest(plugins, pluginName);
    let installedDigest = null;
    let refusal = null;
    let pluginLine;
    if (under === null) {
        pluginLine = `UNKNOWN - verify — the init frame ${plugins.frameIndex === null ? "was not seen" : `lists no plugin named ${pluginName}`}`;
        refusal = `no plugin named ${pluginName} in system/init.plugins[]`;
    }
    else {
        pluginLine = `${under.name}${under.version ? ` ${under.version}` : ""} at ${under.path}`;
        const accepted = pluginCachePathAccepted(under.path, pluginCacheRoot());
        if (accepted === null) {
            refusal = `the path the init frame names for ${pluginName} was not accepted under the plugin cache root (it must be an existing directory strictly inside ${pluginCacheRoot()}, not dash-prefixed, judged on its real path)`;
        }
        else if (tracked !== null) {
            installedDigest = contentDigest(accepted, tracked);
        }
    }
    const verdict = provenanceVerdict(checkoutDigest, installedDigest);
    return {
        state: verdict.state,
        detail: refusal === null ? verdict.detail : `${verdict.detail}: ${refusal}`,
        checkoutDigest,
        installedDigest,
        trackedCount: tracked?.length ?? 0,
        pluginLine,
    };
}
/** The heading the flip manifest's D-18 cells cite. Emitted by `renderReport`; frozen by 33-12. */
export const PARITY_SECTION_HEADING = "## Dual-path parity (D-07) — path-invariant projection";
export const REPLAY_SECTION_HEADING = "## Replay comparator (informational — task-id keyed, deterministic replay only)";
export const PARITY_EQUAL_LINE = "- parity: the two projections are equal";
/**
 * THE ONE cell escaper (IN-05): pipes are escaped, line breaks become a space, and every remaining
 * byte of the control class becomes the literal `<control>` with the count stated at the end of the
 * cell — so a transcript-supplied value cannot land a raw C0/C1 byte in a committed summary, and the
 * reader can see that the value was altered and by how much. `verifyArtifacts` refuses any cell
 * that still carries the raw class.
 */
const cell = (s) => {
    const escaped = s.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
    let replaced = 0;
    const clean = escaped.replace(CONTROL_BYTE_RE_G, () => {
        replaced += 1;
        return "<control>";
    });
    return replaced === 0 ? clean : `${clean} (${replaced} control byte(s) replaced)`;
};
/** Build the claim rows a run's transcript supports. Every row cites the frame it came from. */
export function deriveClaims(frames, grant, stamps) {
    const claims = [];
    const cite = (i) => (i === null || i < 0 || i >= frames.lineNumbers.length ? null : frames.lineNumbers[i]);
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
export function renderReport(m) {
    const L = [];
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
    L.push(`| installed plugin provenance after the run (D-05, per system/init, content digest over ${m.provenance.trackedCount} tracked files) | ${m.provenance.state} — ${cell(m.provenance.detail)} |`);
    L.push(`| plugin under test per system/init | ${cell(m.provenance.pluginLine)} |`);
    for (const r of m.runs) {
        L.push(`| run ${r.label} transcript | ${r.transcriptName} (${r.frames.lineCount} line(s), ${r.frames.frames.length} frame(s), ${r.frames.partial} partial line(s)) |`);
        L.push(`| run ${r.label} transcript location | ${cell(r.transcriptLocation)} |`);
        L.push(`| run ${r.label} argv | ${cell(JSON.stringify(r.argv))} |`);
        L.push(`| run ${r.label} tool grant | ${cell(JSON.stringify(r.toolGrant))} |`);
        // WR-02: the gate the spawn passed (or, in a dry run, what the registry says about a target nothing was installed into).
        L.push(`| run ${r.label} plugin provenance before the spawn | ${cell(preSpawnProvenanceLine(r.provenanceBeforeSpawn))} |`);
        if (r.run !== null) {
            L.push(`| run ${r.label} exit | status ${String(r.run.status)}, signal ${String(r.run.signal)}, timed out ${r.run.timedOut}, escalated ${r.run.escalated}, wall ${r.run.durationMs} ms |`);
            L.push(`| run ${r.label} spawn grant drift | ${r.grantDrift.length === 0 ? "none — the post-run derivation equals the pre-spawn derivation on granted, adapterNames, coordinator and prefix" : `field(s) changed after the spawn: ${cell(r.grantDrift.join(", "))} — the run is failed`} |`);
        }
        // WR-06: the uninstall's recorded exit; a dry run installs nothing, so it says so rather than an exit.
        L.push(`| run ${r.label} plugin uninstall | ${r.uninstall === null ? "not run — no plugin was installed for this run (dry run, D-10)" : cell(uninstallLine(r.uninstall))} |`);
        L.push(`| run ${r.label} claim rows withheld (no citation) | ${r.withheld} |`);
    }
    L.push("");
    L.push("## Preconditions");
    L.push("");
    L.push("| precondition | state | detail |");
    L.push("|---|---|---|");
    for (const row of m.preconditions.rows)
        L.push(`| ${cell(row.name)} | ${row.state} | ${cell(row.detail)} |`);
    L.push("");
    L.push(readinessLine(m.preconditions));
    L.push("");
    L.push("## Target build (D-03)");
    L.push("");
    for (const t of m.targets)
        L.push(`- target ${t.label}: ${t.installerLine}`);
    L.push("");
    for (const r of m.runs) {
        L.push(`## Transcript claims — run ${r.label} (${r.transcriptName})`);
        L.push("");
        L.push(`| ${claimTableHeader(r.label, r.transcriptName)} | value | citation |`);
        L.push("|---|---|---|");
        for (const c of r.claims)
            L.push(`| ${cell(c.label)} | ${cell(c.value)} | jsonl:${c.line} |`);
        L.push("");
        L.push(`## Target observations — run ${r.label}`);
        L.push("");
        L.push(`| ${observationTableHeader(r.label)} | value | citation |`);
        L.push("|---|---|---|");
        for (const t of r.targetRows)
            L.push(`| ${cell(t.label)} | ${cell(t.value)} | ${cell(t.citation)} |`);
        L.push("");
        L.push(`## CAP-03 verdict (D-02) — run ${r.label}`);
        L.push("");
        if (r.capThreeReasons.length === 0)
            L.push("- both sides hold: no named reason remains");
        else
            for (const reason of r.capThreeReasons)
                L.push(`- ${reason}`);
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
        if (p.projection.roles.length === 0)
            L.push("| (no live note) | 0 | |");
        for (const r of p.projection.roles)
            L.push(`| ${cell(r.role)} | ${r.count} | ${cell(r.kinds.join(", "))} |`);
        L.push(`| verdict marker ${VERDICT_GREEN_MARKER} | ${p.projection.verdictMarker ? "present" : "absent"} | |`);
        L.push(`| note route: direct writes into the context root | ${p.projection.route.directContextWrites} | |`);
        L.push(`| note route: propose_note tool-use blocks | ${p.projection.route.proposeNoteCalls} | |`);
        L.push("");
    }
    if (m.parity.diffs.length === 0)
        L.push(PARITY_EQUAL_LINE);
    else
        for (const d of m.parity.diffs)
            L.push(`- ${cell(d)}`);
    L.push("");
    L.push(REPLAY_SECTION_HEADING);
    L.push("");
    L.push("The DOGF-01 replay comparator keeps `at`, `refs` and `body` and keys on the task id; over two independent live sessions its grammar guarantees a diff (33-DIAGNOSIS § 1.2). Its output is recorded and is not an input to the outcome.");
    L.push("");
    if (m.equivalenceDiffs.length === 0)
        L.push("- assertEquivalent over the two targets' context roots returned no diff");
    else
        for (const d of m.equivalenceDiffs)
            L.push(`- ${d.replace(/\r?\n/g, " ")}`);
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
export function readinessLine(table) {
    return table.readiness === "ready" ? `${READINESS_PREFIX}ready` : `${READINESS_PREFIX}not-ready — ${table.reasons.join("; ")}`;
}
// ---------------------------------------------------------------------------
// --verify-artifacts (hard rule 7, re-checked after the fact)
// ---------------------------------------------------------------------------
/** Refusals over an already-written artifact directory. Empty means every rule held. */
export function verifyArtifacts(dir, homes = homeSpellings()) {
    const refusals = [];
    if (!existsSync(dir))
        return [`the artifact directory does not exist: ${dir}`];
    const entries = readdirSync(dir).filter((n) => n === DRY_RUN_REPORT_NAME || n === CAPTURE_SUMMARY_NAME);
    if (entries.length !== 1) {
        return [`expected exactly one report (${DRY_RUN_REPORT_NAME} or ${CAPTURE_SUMMARY_NAME}) in ${dir}; found ${entries.length}`];
    }
    const summaryPath = join(dir, entries[0]);
    const summary = readFileSync(summaryPath, "utf8");
    const outcomeCount = (summary.match(OUTCOME_LINE_SCAN_RE) ?? []).length;
    if (outcomeCount !== 1)
        refusals.push(`the report carries ${outcomeCount} outcome line(s); exactly one line matching the frozen grammar is required`);
    const transcriptLineCounts = new Map();
    for (const name of readdirSync(dir).filter((n) => n.endsWith(".jsonl"))) {
        const text = readFileSync(join(dir, name), "utf8");
        const lines = text.split(/\r?\n/);
        if (lines.length > 0 && lines[lines.length - 1] === "")
            lines.pop();
        transcriptLineCounts.set(name, lines.length);
        const survivors = homeSpellingSurvivors(text, homes);
        if (survivors.length > 0)
            refusals.push(`${name} carries ${survivors.length} surviving home-path spelling(s); the redaction did not hold`);
    }
    const summarySurvivors = homeSpellingSurvivors(summary, homes);
    if (summarySurvivors.length > 0)
        refusals.push(`${entries[0]} carries ${summarySurvivors.length} surviving home-path spelling(s); the redaction did not hold`);
    // Tables are located by their HEADER ROW — a `|` row immediately followed by a `|---|` separator
    // row — and a table ends at the first line that is not a `|` row. No markdown heading is read.
    let section = "other";
    let transcript = null;
    let transcriptRows = 0;
    let targetRows = 0;
    const lines = summary.split(/\r?\n/);
    const cellsOf = (line) => line.split("|").map((c) => c.trim()).slice(1, -1);
    const isSeparator = (line) => {
        const body = cellsOf(line);
        return line.startsWith("|") && body.length > 0 && body.every((c) => /^-+$/.test(c));
    };
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.startsWith("|")) {
            section = "other";
            continue;
        }
        if (isSeparator(line))
            continue;
        const body = cellsOf(line);
        if (body.length === 0)
            continue;
        // IN-05: a raw control byte in any cell is refused, naming the row by its first cell; the
        // spelled form `<control>` is what the renderer writes, so a raw byte means this runner did not
        // write the cell or the file was altered afterwards.
        if (CONTROL_BYTE_RE.test(line)) {
            refusals.push(`line ${i + 1}: a table cell carries a raw control byte (the runner spells these <control>) in the row ${body[0].replace(CONTROL_BYTE_RE_G, "<control>")}`);
        }
        const next = lines[i + 1] ?? "";
        if (isSeparator(next)) {
            const head = body[0];
            const claim = head.match(CLAIM_HEADER_RE);
            if (claim !== null) {
                section = "transcript";
                transcript = claim[2];
                if (!transcriptLineCounts.has(transcript))
                    refusals.push(`line ${i + 1}: the claim table names ${transcript}, which is not in ${dir}`);
            }
            else if (OBSERVATION_HEADER_RE.test(head)) {
                section = "target";
            }
            else {
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
            if (n < 1 || n > bound)
                refusals.push(`line ${i + 1}: citation jsonl:${n} is outside ${transcript ?? "(no transcript)"}'s ${bound} line(s)`);
        }
        else if (section === "target") {
            targetRows += 1;
            if (!TARGET_CITATION_RE.test(last))
                refusals.push(`line ${i + 1}: a target observation row carries no path:/note: citation: ${line}`);
        }
    }
    if (transcriptRows === 0)
        refusals.push("the report carries no transcript claim rows at all; a report that claims nothing is not re-checkable");
    if (targetRows === 0)
        refusals.push("the report carries no target observation rows at all");
    return refusals;
}
// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
let keepTarget = false;
function checkoutSha() {
    return probe(GIT_CMD, ["rev-parse", "HEAD"], spawnEnv(), PROBE_BOUND_MS, SCRIPT_ROOT)?.out.trim() ?? "UNKNOWN - verify — `git rev-parse HEAD` could not be read";
}
function targetObservations(build, grant, stamps) {
    const rows = [];
    const contextRel = toPosix(CONTEXT_SUBPATH);
    rows.push({ label: "install", value: build.installerLine, citation: `path:${toPosix(join(ADAPTER_DIR))}` });
    rows.push({
        label: "derived grant",
        value: `${grant.granted.length} granted name(s); ${grant.adapterNames.length} adapter name(s); coordinator ${grant.coordinator ?? "(none)"}; prefix ${JSON.stringify(grant.prefix)}` + (grant.reasons.length === 0 ? `; the two derivations agree: census ${grant.adapterNames.length} = grant ${grant.granted.length} + the coordinator` : `; disagreement: ${grant.reasons.join(" / ")}`),
        citation: `path:${toPosix(ADAPTER_DIR)}`,
    });
    if (stamps.length === 0) {
        rows.push({ label: "D-02 side (b) author stamps", value: `no live note under ${contextRel}`, citation: `path:${contextRel}` });
    }
    else {
        for (const s of stamps)
            rows.push({ label: "D-02 side (b) author stamp", value: `${s.kind} by ${s.by}`, citation: `note:${s.task}/${s.noteId}` });
    }
    const marker = verdictMarkerObserved(stamps);
    rows.push({
        label: `verdict marker ${VERDICT_GREEN_MARKER}`,
        value: marker === null ? "absent from every live note" : `present in a ${marker.kind} note by ${marker.by}`,
        citation: marker === null ? `path:${contextRel}` : `note:${marker.task}/${marker.noteId}`,
    });
    return rows;
}
function equivalence(targets) {
    if (targets.length !== 2)
        return ["dual-path equivalence needs exactly two targets"];
    const rootA = join(targets[0].target, CONTEXT_SUBPATH);
    const rootB = join(targets[1].target, CONTEXT_SUBPATH);
    const tasks = [...new Set([...contextTasks(rootA), ...contextTasks(rootB)])].sort();
    const diffs = [];
    for (const task of tasks) {
        for (const d of assertEquivalent(projectTaskState(rootA, task), projectTaskState(rootB, task)))
            diffs.push(`${task}: ${d}`);
    }
    return diffs;
}
function writeArtifacts(outDir, reportName, report, transcripts, homes) {
    const redactedReport = redactText(report, homes);
    const redactedTranscripts = transcripts.map((t) => ({ name: t.name, text: redactText(t.text, homes) }));
    const survivors = [];
    for (const s of homeSpellingSurvivors(redactedReport, homes))
        survivors.push(`report: ${s}`);
    for (const t of redactedTranscripts)
        for (const s of homeSpellingSurvivors(t.text, homes))
            survivors.push(`${t.name}: ${s}`);
    if (survivors.length > 0) {
        fail(`redaction did not hold — ${survivors.length} home-path spelling(s) survive; nothing was written. Surviving form(s) are not repeated here.`);
    }
    mkdirSync(outDir, { recursive: true });
    for (const t of redactedTranscripts)
        writeFileSync(join(outDir, t.name), t.text);
    writeFileSync(join(outDir, reportName), redactedReport);
}
async function dryRun(opts) {
    console.log("== grugops live capture — DRY RUN (D-10) ==");
    console.log("Walks every phase against the committed fixture transcript. It makes no model call.");
    console.log("");
    const homes = homeSpellings();
    const obs = observePreconditions();
    const table = evaluatePreconditions(obs);
    console.log(`phase 1: ${table.rows.length} precondition row(s) observed`);
    const targets = RUN_LABELS.map((label) => buildTarget(label));
    console.log(`phase 2: ${targets.length} target(s) built and installed; stopping before any platform invocation`);
    // The checkout side of every provenance comparison, once (WR-02); the dry run walks the registry
    // reader over the operator's real registry for each target — nothing was installed into it, so the
    // honest answer is UNKNOWN, and the row says why.
    const checkout = deriveCheckoutDigest();
    const provenanceInputs = liveProvenanceInputs(checkout);
    const pluginKey = `${obs.pluginName}@${obs.marketplaceName}`;
    if (!existsSync(FIXTURE_JSONL))
        fail(`the fixture transcript is missing at ${FIXTURE_JSONL}`);
    const frames = await readFrames(FIXTURE_JSONL);
    if (frames.frames.length === 0)
        fail(`the fixture transcript ${FIXTURE_JSONL} yielded no frame — the parser proves nothing over an empty stream`);
    const runs = [];
    const projections = [];
    for (const build of targets) {
        const grant = deriveGrant(build.target);
        const stamps = authorStamps(join(build.target, CONTEXT_SUBPATH));
        const derived = deriveClaims(frames, grant, stamps);
        runs.push({
            label: build.label,
            transcriptName: DRY_RUN_TRANSCRIPT_NAME,
            // Where a LIVE transcript for this target would land, decided by the same predicate.
            transcriptLocation: transcriptLocation(join(build.transcriptDir, captureTranscriptName(build.label)), build, build.target),
            argv: ["(dry run: no platform invocation)"],
            frames,
            claims: derived.claims,
            withheld: derived.withheld,
            targetRows: targetObservations(build, grant, stamps),
            capThreeReasons: derived.capThreeReasons,
            run: null,
            toolGrant: liveAllowedTools(build.target),
            grantDrift: [],
            uninstall: null,
            provenanceBeforeSpawn: dryRunProvenanceBeforeSpawn(provenanceInputs, pluginKey, build.target),
        });
        projections.push({ label: build.label, projection: projectLivePath(stamps, frames.frames, grant.prefix) });
    }
    console.log(`phase 3: ${frames.frames.length} fixture frame(s) derived over, once per target (${runs.length})`);
    const diffs = equivalence(targets);
    const parityDiffs = compareLivePaths(projections[0].projection, projections[1].projection);
    const provenance = deriveProvenance(pluginLoadReport(frames.frames), obs.pluginName, checkout);
    console.log(`phase 3: plugin provenance (D-05) over the fixture init frame: ${provenance.state}`);
    const model = {
        mode: "dry-run",
        generatedAt: new Date().toISOString(),
        checkoutSha: checkoutSha(),
        platformVersion: obs.platformVersion ?? "UNKNOWN - verify",
        boundMs: CALL_BOUND_MS,
        boundUsed: "not applied — no platform call was made",
        approvalKeyLine: "absent; asserted on the constructed child environment before every spawn",
        provenance,
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
    for (const row of table.rows)
        console.log(`  ${row.state.padEnd(16)} ${row.name}`);
    console.log("");
    console.log(readinessLine(table));
    console.log(`OUTCOME: ${model.outcome}`);
    if (opts.keepTarget)
        for (const t of targets)
            console.log(`target ${t.label} kept at: ${t.target} (kit home ${t.home})`);
    console.log(DRY_RUN_COMPLETE);
    return 0;
}
/** The dry run's pre-spawn row: the same reader over the same registry, with the reason nothing matched stated. */
function dryRunProvenanceBeforeSpawn(inputs, pluginKey, target) {
    const copy = installedCopyDigest(inputs, pluginKey, target);
    const pre = preSpawnProvenance(copy, provenanceVerdict(inputs.checkout.digest, copy.installedDigest), inputs.checkout.digest);
    return { ...pre, detail: `${pre.detail} — nothing was installed for this run (dry run, D-10); the live run refuses to spawn unless this row is MET` };
}
function makeScratchOut() {
    // The artifact directory is the run's product, so it is created and printed, never removed.
    return mkdtempSync(join(tmpdir(), `${TMP_PREFIX}out-`));
}
async function capture(opts) {
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
    if (grantSource.coordinator === null)
        fail(`no coordinator adapter in the installed target: ${grantSource.reasons.join("; ")}`);
    // The checkout side of the provenance gate, once, before the loop (WR-02): the tracked list and
    // its digest are the same for both targets and are handed down, never re-derived per run.
    const checkout = deriveCheckoutDigest();
    const provenanceInputs = liveProvenanceInputs(checkout);
    const runs = [];
    const rawTranscripts = [];
    const installLines = [];
    const projections = [];
    let hang = false;
    let anyFailure = false;
    for (const build of targets) {
        const r = await runTarget(build, {
            request: LIVE_REQUEST,
            allowedTools: liveAllowedTools(build.target),
            expectedGrant: grantSource,
            agent: build.label === "B" ? grantSource.coordinator : null,
            pluginName: obs.pluginName,
            marketplaceName: obs.marketplaceName,
            boundMs: CALL_BOUND_MS,
            provenance: provenanceInputs,
        });
        installLines.push(r.installLine);
        if (r.hung)
            hang = true;
        if (r.failed)
            anyFailure = true;
        runs.push(r);
        projections.push({ label: r.label, projection: r.projection });
        rawTranscripts.push({ name: r.transcriptName, text: r.transcriptText });
    }
    // The replay comparator is recorded for the reader; it is NOT an outcome input (33-DIAGNOSIS
    // § 1.2: keyed on model-chosen task ids and timestamps, it reds over any two live sessions).
    const diffs = equivalence(targets);
    const parityDiffs = compareLivePaths(projections[0].projection, projections[1].projection);
    const denyFired = runs.some((r) => denyObservedInStream(r.frames.frames));
    if (!denyFired)
        anyFailure = true;
    // D-05 provenance AFTER the run is read from run A's init frame (the same install route serves both
    // runs) and stays an outcome input: a pass over a plugin that is not the checkout is a fabricated
    // proof. It is the confirmation; the gate ran inside each runTarget before its spawn, so an UNMET
    // here can only mean the platform loaded something other than what its registry named.
    const provenance = deriveProvenance(pluginLoadReport(runs[0].frames.frames), obs.pluginName, checkout);
    const outcome = deriveOutcome({ hang, anyFailure, parityDiffs, provenance: provenance.state });
    const outcomeReason = hang
        ? "a run reached the bound and was stopped (exit 143 or SIGINT at the bound)"
        : anyFailure
            ? "a run exited non-zero, a CAP-03 side failed, or the deny was not observed — see the sections above"
            : parityDiffs.length > 0
                ? `the two paths diverge under the path-invariant D-07 projection (${parityDiffs.length} named difference(s)) — see the parity section`
                : provenance.state !== "MET"
                    ? `plugin provenance is ${provenance.state} — ${provenance.detail}`
                    : "both runs completed, both CAP-03 sides hold in both runs, the deny was observed on the hook channel, the two paths project to parity, and the scored plugin is the checkout by content";
    const model = {
        mode: "capture",
        generatedAt: new Date().toISOString(),
        checkoutSha: checkoutSha(),
        platformVersion: obs.platformVersion ?? "UNKNOWN - verify",
        boundMs: CALL_BOUND_MS,
        boundUsed: `${CALL_BOUND_MS} ms per call (SIGINT at the bound, SIGTERM ${SIGTERM_GRACE_MS} ms later)`,
        approvalKeyLine: "absent; asserted on the constructed child environment before every spawn",
        provenance,
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
    if (opts.keepTarget)
        for (const t of targets)
            console.log(`target ${t.label} kept at: ${t.target}`);
    console.log(CAPTURE_COMPLETE);
    return 0;
}
function verifyMode(opts) {
    const dir = opts.out;
    console.log(`== grugops live capture — artifact re-check over ${dir} ==`);
    const refusals = verifyArtifacts(dir);
    if (refusals.length === 0) {
        console.log("ARTIFACTS RE-CHECKED: every transcript claim row is cited within its transcript, no home-path spelling survives, and exactly one outcome line is present.");
        return 0;
    }
    for (const r of refusals)
        console.log(`REFUSED: ${r}`);
    console.log(`${refusals.length} refusal(s); the artifact set is not accepted.`);
    return 1;
}
async function main(argv) {
    const opts = parseArgs(argv);
    keepTarget = opts.keepTarget;
    if (opts.verifyArtifacts)
        return verifyMode(opts);
    if (opts.dryRun)
        return dryRun(opts);
    return capture(opts);
}
async function runAll() {
    let code = 1;
    try {
        code = await main(process.argv.slice(2));
    }
    catch (e) {
        // A run that dies reports no verdict. The failure is named and nothing is written.
        console.log(`CAPTURE NOT DERIVED: ${e instanceof CaptureFailure ? e.message : `unexpected error — ${e instanceof Error ? e.message : String(e)}`}`);
        console.log("No outcome line is reported, because a phase could not be derived.");
        code = 1;
    }
    finally {
        // The flag decides targets; the flag OR a non-zero exit preserves the paid transcripts (CR-04).
        // The operator needs each surviving path for the diagnosis D-11 asks of a red run.
        for (const p of cleanupScratch(cleanupPlan(code, keepTarget)))
            console.log(`transcript scratch preserved (exit ${code}): ${p}`);
    }
    process.exitCode = code;
}
// Entry check through the one shared predicate, so the offline suite can import every derivation
// above without this module running a capture inside the vitest worker.
const isEntry = isEntrypoint(import.meta.url);
if (isEntry) {
    void runAll();
}
