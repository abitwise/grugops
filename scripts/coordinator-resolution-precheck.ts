// coordinator-resolution-precheck.ts — the OBSERVABLE half of the SPAWN-03 coordinator-resolution
// check, discharged by one command (Phase 27, plan 27-16).
//
//   node scripts/coordinator-resolution-precheck.js                        # exit 0 = preconditions hold
//   node scripts/coordinator-resolution-precheck.js --keep-scratch-target  # keep the scratch install
//
// WHY THIS EXISTS. SPAWN-03 has two halves. The first is a set of facts a command can establish: a
// scratch install produces the coordinator adapter, that adapter carries the coordinator marker and
// its enumerated grant, every granted name resolves to an installed adapter file, and the
// materialized kit path exists and holds the coordinator's role file. Plan 27-09 established all of
// those by hand and wrote the procedure down. This script IS that procedure, so the human step is
// two minutes rather than twenty and so a broken tree is caught by a command instead of by a person
// halfway through an interactive session.
//
// The second half cannot be discharged here at all. The Claude Code runtime is the system under
// test, the session startup header is an interactive terminal element, and whether a distinct role
// agent resolves and runs is not observable from any command in this repository. That half is
// printed as human-only steps, quoted from the verification report, and is asserted by nothing.
//
// THREE HARD RULES. Each one is the thing a future author's "obvious improvement" would break, so
// each is written here rather than left to judgement:
//
//   1. NO MODEL SESSION, NO TOKENS. This script performs filesystem and version observations ONLY.
//      It starts exactly two child processes: the platform's `--version` flag, and this repository's
//      own installer. It must never invoke the platform in a way that starts a session — not
//      interactively, and not in print mode either. A print-mode invocation would spend real tokens
//      and STILL not emit the startup header, so it would buy nothing and cost something.
//
//   2. THE SUCCESS WORDING MUST NOT READ AS A PASS. A reader who skims only the last line must come
//      away knowing the runtime steps were NOT performed. The success line therefore says that the
//      PRECONDITIONS hold and that the runtime half remains unverified, and the words that would let
//      a skim conclude otherwise (pass, passed, verified, confirmed) are kept out of this script's
//      output entirely. scripts/coordinator-resolution-precheck.test.ts asserts their absence, so a
//      later edit that reintroduces one turns the suite red rather than quietly turning an
//      unperformed observation into a reported success.
//
//   3. EVERY WRITE LANDS IN A SCRATCH DIRECTORY THIS SCRIPT CREATED. The scratch install gets its
//      own temporary target AND its own temporary kit home, both passed explicitly, so the real
//      ~/.grugops and the real user configuration are never touched by a command whose whole purpose
//      is to verify something safely. Both directories are removed on every exit path, including the
//      failure paths — unless --keep-scratch-target is passed, which keeps them precisely so the
//      human's pasted commands work without editing, and says so.
//
// EXIT CONTRACT. Non-zero when any observable precondition fails, naming which one — so a human is
// never sent into the interactive step against a tree a command could have shown to be broken. Zero
// only when every observable precondition holds, and in that case the final line states that the
// runtime steps are unperformed.
//
// SET AUTHORITIES ARE CONSUMED, NEVER RE-DERIVED (KIT-02 / SPAWN-04). The adapter set comes from
// kit-model.ts's listAgentAdapters(); the coordinator marker, the agent name and the enumerated
// grant are read through frontmatter.ts. This file writes no directory listing and no frontmatter
// grammar of its own — a second answer to either question is the drift class this milestone deletes.
//
// Node stdlib ONLY — node:child_process, node:fs, node:os, node:path. Zero npm dependencies.
//
// Clear professional voice throughout (CLAUDE.md hard rule — this is a build-safety surface).

import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { listAgentAdapters } from "./kit-model.js";
import {
  keyHasValue,
  keysGrantedAgentNames,
  parseFrontmatter,
  type FrontmatterKeys,
} from "./frontmatter.js";

// ---------------------------------------------------------------------------
// Fixed literals. None is ever taken from argv, env or file content (ASVS V12).
// ---------------------------------------------------------------------------

const SCRIPT_ROOT = join(import.meta.dirname, "..");
const INSTALLER = join(SCRIPT_ROOT, "install", "install.js");
const ADAPTER_DIR = ".claude/agents";

// The temp-directory prefix. The test lists the system temp directory for exactly this string before
// and after a default run to prove nothing is left behind.
//
// NOTHING IN THIS FILE IS EXPORTED, deliberately. This module performs a scratch install at load, so
// an `import` of any constant from it would run that install as a side effect. The test drives the
// committed .js as a CHILD PROCESS and restates the two literals it needs.
const TMP_PREFIX = "grugops-coordinator-precheck-";

// The advertised platform floor and the known-bad window, both recorded in 27-CONTEXT.md (SPAWN-07):
// the depth-3 default arrived in v2.1.219, and v2.1.217-v2.1.218 defaulted to depth 1.
const PLATFORM_FLOOR = "2.1.219";
const KNOWN_BAD_LOW = "2.1.217";
const KNOWN_BAD_HIGH = "2.1.218";
const PLATFORM_CMD = "claude";

// The materialized-kit sentinel. These two lines mirror install/install.ts's MAT_OPEN / MAT_CLOSE
// and its readAdapterKit() reader. They are restated rather than imported because install.ts is an
// executable script that performs an install at module load, not an importable module — importing it
// to reach a ten-line reader would run the installer as a side effect. The sentinel is a stable
// on-disk contract asserted by the installer's own suite; extracting it into a shared module is a
// worthwhile change but belongs to whichever plan owns install.ts, not to this one.
const MAT_OPEN = "# <!-- grugops:materialized-kit -->";
const MAT_CLOSE = "# <!-- /grugops:materialized-kit -->";

// The coordinator's role file, relative to the materialized kit root. The coordinator adapter body
// names `agent-factory/roles/orchestrator.md` and KIT resolves to `<home>/agent-factory`, so the
// path beneath the kit root is `roles/orchestrator.md`.
const COORDINATOR_ROLE_FILE = "roles/orchestrator.md";

const EVIDENCE_FILE =
  ".planning/phases/27-spawn-correctness-kit-set-authority/27-SPAWN-03-RUNTIME-EVIDENCE.md";

// The success wording. One constant because the test keys on it in both directions: a green run must
// contain it, and every failure path must NOT.
const PRECONDITIONS_HOLD = "PRECONDITIONS HOLD:";
const PRECONDITION_FAILED = "PRECONDITION FAILED:";

// The named slots the human fills in. They are the SAME list the recording surface carries, field for
// field — the printed block is what a human pastes, so a slot that exists in one and not the other
// would produce an evidence file with an unrecorded observation or an unfillable slot.
const SLOTS: readonly string[] = [
  "platform version observed",
  "session startup header text observed (verbatim)",
  "did that header name the coordinator agent",
  "request made",
  "role agent that resolved and ran",
  "did the coordinator work the task inline instead",
  "date observed",
  "observed by",
];

// The three edges the phase probe surfaced as backstop items. A single routed subtask may not
// exercise any of them, so they are recorded IF ENCOUNTERED and are not required for the observation
// to be complete. Each one asks for what was seen; none of them asks for a rule to be inferred.
const BACKSTOP_SLOTS: readonly string[] = [
  "same agent name at project scope and at user scope: which scope the runtime resolved",
  "no adapter matches the requested name: the exact error text emitted",
  "more than one role agent routed in one turn: the observed order, and whether it was stable",
];

// ---------------------------------------------------------------------------
// Failure carrier
// ---------------------------------------------------------------------------

// A failed observable precondition. Thrown rather than exited so the scratch directories are removed
// by one finally block on every path — process.exit() inside a try skips finally, which is exactly
// how a cleanup gets silently lost.
class PreconditionFailure extends Error {}

// A function DECLARATION with an explicit `never` return, not a const arrow: only that form lets the
// compiler treat a bare `fail(...)` statement as terminating, so the code after it narrows.
function fail(message: string): never {
  throw new PreconditionFailure(message);
}

// ---------------------------------------------------------------------------
// Scratch directories
// ---------------------------------------------------------------------------

const scratch: string[] = [];

function makeScratch(suffix: string): string {
  const d = mkdtempSync(join(tmpdir(), `${TMP_PREFIX}${suffix}-`));
  scratch.push(d);
  return d;
}

function cleanup(keep: boolean): void {
  if (keep) return;
  for (const d of scratch) rmSync(d, { recursive: true, force: true });
  scratch.length = 0;
}

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

interface Options {
  keep: boolean;
  inspectTarget: string | null;
}

function parseArgs(argv: string[]): Options {
  const opts: Options = { keep: false, inspectTarget: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--keep-scratch-target") opts.keep = true;
    else if (a === "--inspect-target") opts.inspectTarget = argv[++i] ?? "";
    else if (a.startsWith("--inspect-target=")) {
      opts.inspectTarget = a.slice("--inspect-target=".length);
    } else {
      fail(
        `unrecognized argument \`${a}\` — this command takes --keep-scratch-target and --inspect-target <dir> only`,
      );
    }
  }
  if (opts.inspectTarget !== null && opts.inspectTarget === "") {
    fail("--inspect-target requires a directory path");
  }
  return opts;
}

// ---------------------------------------------------------------------------
// Observation 1 — the platform version
// ---------------------------------------------------------------------------

type Triple = [number, number, number];

const parseTriple = (s: string): Triple | null => {
  const m = s.match(/(\d+)\.(\d+)\.(\d+)/);
  return m === null ? null : [Number(m[1]), Number(m[2]), Number(m[3])];
};

const cmp = (a: Triple, b: Triple): number =>
  a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

// Report which of three states the installed platform version holds, and fail on the two that would
// send a human into the interactive step against a runtime whose nesting default differs from the one
// this kit is written against.
//
// A version that cannot be read at all is UNKNOWN and PENDING VERIFICATION, never a failure: the tool
// simply may not be on this machine's PATH, and the filesystem preconditions below are still worth
// discharging. Nothing here starts a session — `--version` prints a string and exits.
function observePlatformVersion(): string {
  const r = spawnSync(PLATFORM_CMD, ["--version"], {
    encoding: "utf8",
    timeout: 15_000,
  });
  if (r.error !== undefined || r.status !== 0 || typeof r.stdout !== "string") {
    return `platform version: UNKNOWN - verify — \`${PLATFORM_CMD} --version\` could not be read on this machine (the tool may not be on the PATH). Pending verification; the filesystem preconditions below are unaffected.`;
  }
  const reported = r.stdout.trim();
  const got = parseTriple(reported);
  if (got === null) {
    return `platform version: UNKNOWN - verify — \`${PLATFORM_CMD} --version\` printed \`${reported}\`, which carries no readable version number. Pending verification.`;
  }
  const floor = parseTriple(PLATFORM_FLOOR) as Triple;
  const low = parseTriple(KNOWN_BAD_LOW) as Triple;
  const high = parseTriple(KNOWN_BAD_HIGH) as Triple;

  if (cmp(got, low) >= 0 && cmp(got, high) <= 0) {
    fail(
      `the installed platform is ${reported}, inside the known-bad window ${KNOWN_BAD_LOW}-${KNOWN_BAD_HIGH} whose default spawn depth is 1. An observation taken here would describe that window, not the advertised floor. Upgrade to ${PLATFORM_FLOOR} or later before observing.`,
    );
  }
  if (cmp(got, floor) < 0) {
    fail(
      `the installed platform is ${reported}, below the advertised floor ${PLATFORM_FLOOR}. Upgrade before observing — this kit's depth and scheduling claims are written against ${PLATFORM_FLOOR} and later.`,
    );
  }
  return `platform version: ${reported} — at or above the advertised floor ${PLATFORM_FLOOR}, and outside the known-bad window ${KNOWN_BAD_LOW}-${KNOWN_BAD_HIGH}.`;
}

// ---------------------------------------------------------------------------
// Observation 2 — the scratch install
// ---------------------------------------------------------------------------

interface Installed {
  target: string;
  home: string | null; // null when an already-installed target is being inspected
  line: string;
}

function runScratchInstall(): Installed {
  if (!existsSync(INSTALLER)) {
    fail(
      `the installer is missing at ${INSTALLER} — run \`npm run build\` so the committed .js twin exists.`,
    );
  }
  const target = makeScratch("target");
  const home = makeScratch("home");
  const r = spawnSync(
    "node",
    [INSTALLER, "--target", target, "--yes"],
    {
      encoding: "utf8",
      timeout: 120_000,
      env: { ...process.env, GRUGOPS_HOME: home },
    },
  );
  if (r.status !== 0) {
    const detail = `${r.stdout ?? ""}${r.stderr ?? ""}`.trim();
    fail(
      `the scratch install did not complete (exit ${String(r.status)}). Installer output follows:\n${detail}`,
    );
  }
  return {
    target,
    home,
    line: `scratch install: the installer ran cleanly into ${target} with an isolated kit home at ${home} — nothing outside those two directories was written.`,
  };
}

// ---------------------------------------------------------------------------
// Observations 3-6 — the installed adapter set and the coordinator preconditions
// ---------------------------------------------------------------------------

interface Adapter {
  rel: string;
  keys: FrontmatterKeys;
  name: string | null;
}

// Read one adapter's frontmatter through the shared parser. A PARSE FAILURE IS A PARSE ARTIFACT AND
// NEVER A VERDICT: an unreadable adapter fails this precheck by name rather than being folded into
// "carries no marker", which is the silent-bypass shape frontmatter.ts exists to refuse.
function readAdapter(targetRoot: string, rel: string): Adapter {
  const path = join(targetRoot, ADAPTER_DIR, rel);
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    return fail(`the installed adapter ${rel} could not be read at ${path}.`);
  }
  const parsed = parseFrontmatter(text);
  if (!parsed.ok) {
    return fail(
      `the installed adapter ${rel} has unreadable frontmatter — ${parsed.reason}. An unreadable adapter is not the same fact as an adapter without a marker, so this precheck refuses rather than assuming.`,
    );
  }
  const names = parsed.value.get("name") ?? [];
  return { rel, keys: parsed.value, name: names[0] ?? null };
}

// Pull the materialized absolute kit path out of the coordinator adapter's sentinel block. Mirrors
// install/install.ts's readAdapterKit() — see the MAT_OPEN comment above for why it is restated.
function readMaterializedKit(adapterPath: string): string {
  const text = readFileSync(adapterPath, "utf8");
  let inside = false;
  let line = "";
  for (const l of text.split("\n")) {
    if (l === MAT_OPEN) {
      inside = true;
      continue;
    }
    if (l === MAT_CLOSE) {
      inside = false;
      continue;
    }
    if (inside && /^KIT=/.test(l)) line = l;
  }
  if (line === "") return "";
  return line.replace(/^KIT="/, "").replace(/"$/, "");
}

// Every reported fact from the installed target, in the order the plan specifies. Each returned
// entry is one printed line.
function observeTarget(targetRoot: string): string[] {
  let rels: string[];
  try {
    rels = listAgentAdapters(targetRoot);
  } catch (e) {
    return fail(
      `the installed adapter set could not be read from ${join(targetRoot, ADAPTER_DIR)} — ${e instanceof Error ? e.message : String(e)}`,
    );
  }
  const out: string[] = [
    `installed adapter count: ${rels.length} adapter(s) in ${ADAPTER_DIR} of the installed target.`,
  ];

  const adapters = rels.map((rel) => readAdapter(targetRoot, rel));

  // The coordinator is located by its MARKER, never by filename — the platform takes identity from
  // frontmatter, so a filename-keyed search would answer a different question than the runtime asks.
  const coordinators = adapters.filter((a) =>
    keyHasValue(a.keys, "coordinator", "true"),
  );
  if (coordinators.length === 0) {
    fail(
      `no installed adapter carries the \`coordinator: true\` marker — the installed target has no coordinator adapter, so \`${PLATFORM_CMD} --agent <coordinator>\` has nothing to resolve. Checked ${rels.length} adapter(s) in ${join(targetRoot, ADAPTER_DIR)}.`,
    );
  }
  if (coordinators.length > 1) {
    fail(
      `${coordinators.length} installed adapters carry the \`coordinator: true\` marker (${coordinators.map((c) => c.rel).join(", ")}) — exactly one is expected, and an observation taken against an ambiguous set would not say which one resolved.`,
    );
  }
  const coordinator = coordinators[0];
  if (coordinator.name === null || coordinator.name === "") {
    fail(
      `the coordinator adapter ${coordinator.rel} carries no \`name\` value — the platform takes agent identity from that key, so there is no name for \`--agent\` to be given.`,
    );
  }
  out.push(
    `coordinator agent name: ${coordinator.name} (from ${coordinator.rel}, located by its marker rather than by filename).`,
  );

  const granted = keysGrantedAgentNames(coordinator.keys);
  if (granted.length === 0) {
    fail(
      `the coordinator adapter ${coordinator.rel} enumerates no agent names in its grant — an unscoped or absent grant enumerates nothing, so there is no closure to resolve.`,
    );
  }
  out.push(`coordinator grant size: ${granted.length} enumerated name(s).`);

  // Identity comes from the frontmatter `name` key, so resolution is name-to-name and never
  // name-to-filename.
  const installedNames = new Set(
    adapters.map((a) => a.name).filter((n): n is string => n !== null && n !== ""),
  );
  const unresolved = granted.filter((n) => !installedNames.has(n));
  if (unresolved.length > 0) {
    fail(
      `${unresolved.length} of the coordinator's ${granted.length} granted name(s) resolve to no installed adapter file: ${unresolved.join(", ")}. A routed subtask naming one of those would find nothing to run.`,
    );
  }
  out.push(
    `granted names resolving to an installed adapter file: ${granted.length} of ${granted.length}.`,
  );

  const kit = readMaterializedKit(
    join(targetRoot, ADAPTER_DIR, coordinator.rel),
  );
  if (kit === "") {
    fail(
      `the coordinator adapter ${coordinator.rel} carries no materialized \`KIT=\` line inside its \`grugops:materialized-kit\` sentinel block — the installed adapter cannot resolve the kit root without falling back to the self-heal path.`,
    );
  }
  out.push(`materialized kit path: ${kit}`);
  if (!existsSync(kit)) {
    fail(
      `the coordinator adapter's materialized kit path ${kit} does not exist — the adapter points at a kit root that is not on disk.`,
    );
  }
  const roleFile = join(kit, COORDINATOR_ROLE_FILE);
  if (!existsSync(roleFile)) {
    fail(
      `the coordinator's role file is missing at ${roleFile} — the kit path resolves but does not carry the role the coordinator adapter reads.`,
    );
  }
  out.push(
    `materialized kit path resolves: yes — the directory exists and carries ${COORDINATOR_ROLE_FILE}.`,
  );
  return out;
}

// ---------------------------------------------------------------------------
// The human-only remainder
// ---------------------------------------------------------------------------

// Quoted from .planning/phases/27-spawn-correctness-kit-set-authority/27-VERIFICATION.md
// § Human Verification Required. The wording is reproduced rather than summarized, because a summary
// is where a check quietly gets easier than the one that was specified.
const QUOTED_TEST =
  "From an installed target repository, run `claude --agent grugops-orchestrator`; observe the session startup header, then ask for work that routes to a specialist (e.g., \"map this repo\") and observe whether a distinct role agent resolves and runs.";
const QUOTED_EXPECTED =
  "Startup header names `@grugops-orchestrator`; a role agent (not the coordinator itself) executes the routed subtask.";
const QUOTED_WHY =
  "The Claude Code runtime is the system under test; the startup header is an interactive TUI element with no in-repo command able to observe it.";

function printHumanRemainder(installed: Installed, keep: boolean): void {
  const cdLine = keep
    ? `cd ${installed.target}`
    : "cd <an installed target repository>   # re-run with --keep-scratch-target to have one named here";

  console.log("");
  console.log(
    "-- HUMAN-ONLY REMAINDER — NOT PERFORMED BY THIS COMMAND ------------------------",
  );
  console.log("");
  console.log(
    "The two steps below are the runtime half of this check. No command in this repository",
  );
  console.log(
    "can perform them, and this one does not attempt to. Quoted from 27-VERIFICATION.md:",
  );
  console.log("");
  console.log(`  Test:     ${QUOTED_TEST}`);
  console.log(`  Expected: ${QUOTED_EXPECTED}`);
  console.log(`  Why human: ${QUOTED_WHY}`);
  console.log("");
  console.log("Step 1 — NOT PERFORMED by this command:");
  console.log(`    ${cdLine}`);
  console.log("    claude --agent grugops-orchestrator");
  console.log(
    "  Then confirm the session startup header names @grugops-orchestrator.",
  );
  console.log("");
  console.log("Step 2 — NOT PERFORMED by this command:");
  console.log(
    '    In that session, ask for work that routes to one specialist (for example: "map this repo").',
  );
  console.log(
    "  Then confirm a distinct role agent resolves and runs, rather than the coordinator",
  );
  console.log("  working the task inline.");
  console.log("");
  console.log(`Record what you saw in ${EVIDENCE_FILE}.`);
  console.log(
    "Paste this block and fill each slot from the observation. An empty slot means the",
  );
  console.log("check was not performed; it never means it held.");
  console.log("");
  for (const slot of SLOTS) console.log(`    - ${slot}:`);
  console.log("");
  console.log("  Recorded only if encountered (a single routed subtask may exercise none of these):");
  for (const slot of BACKSTOP_SLOTS) console.log(`    - ${slot}:`);
  console.log("");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

// Set by main() as soon as the arguments are read, so the finally block below knows whether the
// scratch directories are to survive without re-parsing argv.
let keepScratch = false;

function main(argv: string[]): number {
  const opts = parseArgs(argv);
  keepScratch = opts.keep;

  console.log("== grugops coordinator-resolution precheck (SPAWN-03) ==");
  console.log(
    "Discharges the OBSERVABLE preconditions only. It starts no model session and spends no tokens.",
  );
  console.log("");

  console.log(observePlatformVersion());

  let installed: Installed;
  if (opts.inspectTarget !== null) {
    if (!existsSync(opts.inspectTarget)) {
      fail(
        `the target supplied to --inspect-target does not exist: ${opts.inspectTarget}`,
      );
    }
    installed = {
      target: opts.inspectTarget,
      home: null,
      line: `scratch install: not run — inspecting the already-installed target ${opts.inspectTarget}. Nothing was written.`,
    };
  } else {
    installed = runScratchInstall();
  }
  console.log(installed.line);

  for (const line of observeTarget(installed.target)) console.log(line);

  printHumanRemainder(installed, opts.keep);

  if (opts.keep && opts.inspectTarget === null) {
    console.log(`scratch target kept at: ${installed.target}`);
    console.log(`scratch kit home kept at: ${installed.home}`);
    console.log(
      "Remove both when you are done; nothing else on this machine was written.",
    );
    console.log("");
  }

  console.log(
    `${PRECONDITIONS_HOLD} every observable precondition of the coordinator-resolution check is satisfied on this tree. The two runtime steps above are NOT PERFORMED by this command, and SPAWN-03's runtime half stays unverified until a human observes it and records the observation in ${EVIDENCE_FILE}.`,
  );
  return 0;
}

let code = 1;
try {
  code = main(process.argv.slice(2));
} catch (e) {
  if (e instanceof PreconditionFailure) {
    console.log(`${PRECONDITION_FAILED} ${e.message}`);
  } else {
    console.log(
      `${PRECONDITION_FAILED} the precheck stopped on an unexpected error — ${e instanceof Error ? e.message : String(e)}`,
    );
  }
  console.log(
    "No observation was taken. Fix the precondition named above and re-run before starting the interactive step.",
  );
  code = 1;
} finally {
  // A failed run keeps nothing: the scratch directories exist only to serve the human step, and
  // there is no human step to serve when a precondition failed.
  cleanup(code === 0 && keepScratch);
}

process.exit(code);
