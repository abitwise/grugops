// adapters-freshness.ts — grugops role-adapter drift gate (SPAWN-02).
//
// The seventeen Claude Code sub-agent adapters under .claude/agents are generated, never
// hand-maintained: they are committed solely as the deterministic product of
// scripts/generate-role-adapters.js. That contract only holds if the committed adapters stay in sync
// with the role corpus they point at. This gate proves it: regenerate the whole adapter directory
// into a throwaway temp mirror, then compare the committed directory against the fresh regeneration.
//
//   node scripts/adapters-freshness.js   # exit 0 = the committed adapters are fresh
//                                        # exit 1 = drift detected OR the regeneration failed
//
// This gate is STANDALONE — it is NOT folded into scripts/check-foundation-guards.ts. The
// established precedent is that a domain freshness check is its own package.json entry
// (freshness:adapters), so a stale adapter fails the build red on its own. It is the fifth instance
// of the mirror-spawn pattern already working in this tree (build output, catalog, context, queue,
// traceability), and it is modelled near-verbatim on scripts/catalog-freshness.ts.
//
// WHO INVOKES IT (Phase 27 / SPAWN-02). Until plan 27-11 the answer was "nobody": the
// package.json entry existed, but the continuous-integration workflow's gate block named this
// gate's three siblings and not this one, and it was the only freshness gate in the tree without a
// test file. A gate nothing re-runs fails nothing closed — it was the single gate that would have
// caught either of the two reproduced hand-edit bypasses, and a committed hand-edit to an adapter
// passed every gate. It is now wired at BOTH ends, deliberately:
//   • .github/workflows/ci.yml — the "Freshness gates + foundation guards (ubuntu only)" block runs
//     `npm run freshness:adapters` alongside its three siblings, so drift turns the build red;
//   • scripts/adapters-freshness.test.ts — spawns this committed .js directly, so the drift lane
//     survives a workflow refactor that drops or renames the step.
//
// TWO HALVES, not one. The analogs compare a single file; this gate compares a DIRECTORY, so it
// checks both:
//   • BYTES — every committed adapter against its regenerated counterpart;
//   • SET   — the two directory listings for exact set equality, reporting which members are EXTRA
//             and which are MISSING rather than only that the sets differ.
// Without the set half an orphaned adapter left behind by a deleted role passes freshness because
// nothing regenerates over it, and a missing adapter passes because nothing compares against it.
// Neither is visible to a byte comparison alone.
//
// SET MEMBERS ARE RELATIVE PATHS, not bare names (Phase 27 / KIT-02). Both listings come from
// scripts/kit-model.ts's listAgentAdapters(), the ONE answer in this tree to "what is an agent
// adapter". That authority recurses, because Claude Code discovers .claude/agents recursively and
// takes agent identity only from frontmatter — so a NESTED file the generator never produced is a
// live adapter, and it is inside this comparison as a named EXTRA member. Comparing full relative
// paths is also what keeps a nested entry from ever being folded into a top-level entry that
// happens to share a basename. This file carries NO directory listing of its own: a second
// derivation of the adapter rule is exactly the drift this gate exists to refuse.
//
// The generator keeps its OUT_DIR a fixed literal (.claude/agents) as a path-traversal mitigation
// (ASVS V12, T-27-28) and accepts no output flag. The gate never overrides it; instead it
// mirror-spawns — cpSync the generator twin, the kit-model twin it imports and the kit sources into
// a temp tree, then spawnSync the mirrored generator so it writes to <tmp>/.claude/agents while
// OUT_DIR stays a fixed literal.
//
// The COMMITTED .js twins are copied, not the .ts sources, because the committed output is what
// hosts and continuous integration actually run.
//
// Fail-closed (T-27-31): if the mirrored regeneration cannot run cleanly the gate NEVER reports
// "fresh" — it prints the generator's own output and exits non-zero. A broken generator must never
// be mistaken for an up-to-date adapter directory. A committed adapter that cannot be READ likewise
// fails, naming the file and the regeneration command, rather than being treated as
// absent-and-therefore-fine.
//
// The verdict states WHAT WAS CHECKED, not a bare "fresh": the number of adapters compared and the
// number of byte differences found, so a run that compared zero adapters is visible as the anomaly
// it is rather than reading as success.
//
// THE MIRRORED RUN'S RESOLUTION IS ASSERTED FROM ITS OWN STDOUT, NEVER INFERRED FROM THE TWIN LIST
// (plan 29.1-03, D-04, T-29.1-09). This is the FIFTH property of this gate, and it is recorded here
// beside the other four because it is the one that is easiest to delete by accident.
//
// Until this plan the gate met D-04 — "the committed adapters are the ZERO-CONFIG output" — by pure
// ABSENCE: the twin list below copies agent-factory/roles and agent-factory/packaging into the
// regeneration mirror and no configuration directory, so a config-reading generator inside that
// mirror finds nothing to read. That is the right answer for the wrong reason, because it is a
// property of what was NOT COPIED rather than of the run. The comment above the twin list already
// justifies mirroring `packaging` although the generator does not open it, so adding a configuration
// directory beside it is a plausible, well-intentioned edit — and the day it lands, this gate
// silently begins comparing a CONFIGURED regeneration against the committed zero-config adapters
// while every case in the repository stays green. Absence is not a pin.
//
// So the generator ANNOUNCES the preset it resolved and this gate ASSERTS that it reads `none`,
// through the one grammar both sites share in scripts/model-tiers.ts. Three outcomes, three
// findings: the line is ABSENT (a failure, never an agreement — a gate that reads a missing line as
// consent is the shape this repository has paid for repeatedly), the line NAMES SOMETHING ELSE (the
// comparison is then about a different artifact than the one the committed adapters claim to be), or
// the line names `none` and the gate proceeds. A stream carrying MORE THAN ONE line is ambiguous and
// is refused too: two announcements that disagree cannot both be the resolution this run used.
//
// THIS PHASE INTRODUCES NO ENVIRONMENT VARIABLE, and the pin deliberately does not use one. If a
// future revision ever adds a variable able to override the resolution — an "assume zero config"
// switch, a config-path override, anything of that shape — IT MUST BE `delete`d FROM `childEnv` BY
// NAME ALONGSIDE `CHECK_ROOT`, for the reason already recorded at that deletion: an inherited
// override would point the fresh regeneration back at the very tree it is meant to be compared
// against, and the gate would compare a tree with itself and always pass.
//
// Node stdlib ONLY — node:child_process, node:fs, node:os, node:path. Zero npm dependencies.
//
// Findings are written in CLEAR PROFESSIONAL VOICE (CLAUDE.md hard rule — this is a build-safety
// surface, never caveman voice).

import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, cpSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { listAgentAdapters } from "./kit-model.js";
import { resolvedPresetsIn } from "./model-tiers.js";

// TWO ROOTS, deliberately separated (Phase 27 / SPAWN-02). They were implicitly one before, which
// is what made this gate impossible to point at a hermetic mirror.
//
// SCRIPT_ROOT stays fixed and script-relative: it is where the committed compiled twins the
// mirror-spawn copies (generate-role-adapters.js and the modules it imports) actually live, and those
// must be the ones continuous integration and host machines run — never a copy from an arbitrary
// mirror.
const SCRIPT_ROOT = join(import.meta.dirname, "..");

// KIT_ROOT is the tree whose adapters are being judged: the role and packaging sources fed to the
// mirrored generator, and the committed .claude/agents directory read back for comparison. It
// honors the SAME CHECK_ROOT override that check-foundation-guards.ts and check-kit-refs.ts already
// honor. Reusing the existing gate convention rather than inventing a fourth root variable is the
// point: the planted-bypass cases in scripts/adapters-freshness.test.ts mutate a temporary mirror
// and never the committed tree.
const KIT_ROOT = process.env.CHECK_ROOT
  ? process.env.CHECK_ROOT
  : SCRIPT_ROOT;

// The generator's fixed-literal output directory, mirrored here as a fixed literal too.
const ADAPTER_DIR = ".claude/agents";
const REGEN_CMD = "npm run generate:adapters";

// Unique temp mirror per run; cleaned up on EVERY exit path, including an uncaught throw.
const tmp = mkdtempSync(join(tmpdir(), "grugops-adapters-fresh-"));

function cleanup(): void {
  rmSync(tmp, { recursive: true, force: true });
}

// Registered IMMEDIATELY after the directory exists, so there is no window in which a throw can
// escape without removing it (IN-01). Everything below runs at module top level: the three cpSync
// calls and the rebuilt-adapter read are all unguarded, and an absent `agent-factory/packaging` in a
// CHECK_ROOT mirror threw past every handler and left <tmpdir>/grugops-adapters-fresh-* behind —
// reproduced before this line was added. A gate that accumulates state outside its own lifetime is a
// slow denial of service on the host (T-27-117).
//
// The exit HANDLER rather than a try/finally around the module body: this file is top-level script
// code, and wrapping it would re-indent every declaration for a two-line fix, burying the diff.
//
// The explicit cleanup() calls in die() and in the two tails are KEPT. rmSync with `force` is
// idempotent, so removing twice is harmless, and deleting them would leave the module depending
// entirely on a handler — 'exit' does not fire on a signal, on process.abort(), or when the process
// is torn down by the host, so the direct calls remain the primary path and this is the backstop.
process.on("exit", cleanup);

function die(message: string): never {
  cleanup();
  console.log(message);
  process.exit(1);
}

// ── Mirror-spawn regeneration ────────────────────────────────────────────────────
// Lay out <tmp>/scripts/{generate-role-adapters,kit-model,frontmatter}.js +
// <tmp>/agent-factory/{roles,packaging} + <tmp>/.claude/agents, then run the mirrored generator so
// its fixed-literal OUT_DIR resolves inside the mirror.
//
// THE TWIN LIST BELOW IS THE GENERATOR'S IMPORT CLOSURE AND MUST TRACK IT. It is hand-written rather
// than derived, and that is a deliberate trade: deriving it would mean writing a grammar for "what
// does this module import" inside a build-safety gate, which is a second grammar of exactly the kind
// finding WR-03 exists to delete. The trade is only acceptable because the failure direction is LOUD:
// an unmirrored import makes the mirrored generator fail to resolve it and exit non-zero, which the
// fail-closed branch below reports as "did not run cleanly" and the gate goes red. It can never pass
// while one file short. `frontmatter.js` joined the list in plan 27-23, when WR-03 moved the
// generator's frontmatter read onto the shared authority. `model-tiers.js` joined it in plan
// 29.1-01, when the generator stopped emitting `model: inherit` as a literal and began asking that
// module for each role's resolved alias — it is in the list for exactly one reason, that the
// generator now imports it, and the same reason is recorded in the generator's own import block.
//
// agent-factory/packaging is mirrored although the generator does not currently OPEN it: it is the
// declared upstream source for both adapter body shapes and for the capability vocabulary, so a
// future revision that consults it finds it here. Note that omitting an input would not have been
// silently unsafe either — an absent input makes the mirrored generator exit non-zero, which this
// gate reports as "did not run cleanly" rather than as fresh.
//
// The SCRIPT twins come from SCRIPT_ROOT (the committed compiled output under test); the KIT
// sources come from KIT_ROOT (the tree being judged, which may be a hermetic mirror).
mkdirSync(join(tmp, "scripts"), { recursive: true });
mkdirSync(join(tmp, ADAPTER_DIR), { recursive: true });
cpSync(
  join(SCRIPT_ROOT, "scripts", "generate-role-adapters.js"),
  join(tmp, "scripts", "generate-role-adapters.js"),
);
cpSync(
  join(SCRIPT_ROOT, "scripts", "kit-model.js"),
  join(tmp, "scripts", "kit-model.js"),
);
cpSync(
  join(SCRIPT_ROOT, "scripts", "frontmatter.js"),
  join(tmp, "scripts", "frontmatter.js"),
);
cpSync(
  join(SCRIPT_ROOT, "scripts", "model-tiers.js"),
  join(tmp, "scripts", "model-tiers.js"),
);
cpSync(join(KIT_ROOT, "agent-factory", "roles"), join(tmp, "agent-factory", "roles"), {
  recursive: true,
});
cpSync(
  join(KIT_ROOT, "agent-factory", "packaging"),
  join(tmp, "agent-factory", "packaging"),
  { recursive: true },
);

// CHECK_ROOT is stripped from the child's environment on purpose. The mirrored generator resolves
// its own fixed-literal paths against its own location inside <tmp>, and it must keep doing so: if
// a future revision ever learned the same override, an inherited CHECK_ROOT would silently point
// the "fresh regeneration" back at the very tree it is meant to be compared against, and the gate
// would compare a tree with itself and always pass.
const childEnv = { ...process.env };
delete childEnv.CHECK_ROOT;

const r = spawnSync("node", [join(tmp, "scripts", "generate-role-adapters.js")], {
  encoding: "utf8",
  env: childEnv,
});

// ── Fail-closed: a non-zero regeneration NEVER falls through to "fresh" ──────────
if (r.status !== 0) {
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  die(
    "Adapter freshness check FAILED: the generator did not run cleanly — refusing to report the adapters as fresh.",
  );
}

// ── The D-04 pin: the mirrored run must say it resolved `none`, and be believed only then ────────
// Read out of the SAME stdout the fail-closed branch above already captures — an assertion added to
// an existing capture, not a new channel. Placed BEFORE the listing and the byte comparison on
// purpose: a configured regeneration also moves bytes, so a gate that let this fall through to the
// drift report would produce a finding that looks like ordinary staleness and says nothing about
// which resolution it compared.
const ZERO_CONFIG_PRESET = "none";
const WHY_ZERO_CONFIG =
  "This gate's comparison is a statement about the ZERO-CONFIG output: the committed adapters are " +
  "the adapters the generator produces when nothing is configured (D-04). A mirrored run that " +
  "resolved anything else is comparing a different artifact than the one the committed adapters " +
  "claim to be, so its verdict — pass or fail — would carry no information about freshness.";

const announced = resolvedPresetsIn(r.stdout ?? "");
if (announced.length === 0) {
  die(
    `Adapter freshness check FAILED: the mirrored regeneration printed NO resolved-preset line, so this gate cannot tell which model resolution it compared. It requires "${ZERO_CONFIG_PRESET}".\n` +
      "An absent line is a FAILURE here and never an agreement: reading silence as consent would " +
      "make this pin stop working precisely when the generator stops announcing.\n" +
      `${WHY_ZERO_CONFIG}\nRun \`${REGEN_CMD}\` and confirm the generator still announces its resolved preset.`,
  );
}
if (announced.length > 1) {
  die(
    `Adapter freshness check FAILED: the mirrored regeneration printed ${announced.length} resolved-preset lines (${announced.map((p) => `"${p}"`).join(", ")}) — an ambiguous answer, refused rather than resolved by taking one of them. This gate requires exactly one, naming "${ZERO_CONFIG_PRESET}".\n${WHY_ZERO_CONFIG}`,
  );
}
if (announced[0] !== ZERO_CONFIG_PRESET) {
  die(
    `Adapter freshness check FAILED: the mirrored regeneration resolved the model preset as "${announced[0]}", and this gate requires "${ZERO_CONFIG_PRESET}".\n` +
      `${WHY_ZERO_CONFIG}\n` +
      "The likely cause is a configuration file reaching the regeneration mirror — check the twin " +
      "list in this script, and check the tree under judgement for a `models` block.",
  );
}

// ── List both sides through the ONE adapter authority ────────────────────────────
// listAgentAdapters() is asked twice with two explicit roots: the tree under judgement, and the
// fresh regeneration. It THROWS rather than returning an empty array on a missing, unreadable or
// zero-entry directory, so each call is wrapped to keep this gate's own fail-closed wording — which
// names the directory and tells the reader what to run — while CARRYING the thrown message through
// rather than discarding the one piece of information that says which directory failed and why.
const listAdapters = (root: string, what: string): string[] => {
  try {
    return listAgentAdapters(root);
  } catch (e) {
    die(
      `Adapter freshness check FAILED: cannot read the ${what} adapter directory ${join(root, ADAPTER_DIR)} — ${e instanceof Error ? e.message : String(e)}\nRun \`${REGEN_CMD}\` and commit the result.`,
    );
  }
};

const committedNames = listAdapters(KIT_ROOT, "committed");
const rebuiltNames = listAdapters(tmp, "regenerated");

// A regeneration that produced nothing is the anomaly, never "nothing to compare, therefore fine".
// This branch is KEPT even though the authority's own vacuity refusal normally fires first: that
// refusal covers "the directory is unreadable or holds no adapters", while this covers the distinct
// condition of a generator that exited 0 and emitted nothing into a directory this gate itself
// created. Both directions fail closed, and a run that compared zero adapters is reported as the
// anomaly it is rather than reading as success.
if (rebuiltNames.length === 0) {
  die(
    `Adapter freshness check FAILED: the generator ran cleanly but produced no adapters in ${ADAPTER_DIR} — refusing to report an empty regeneration as fresh.`,
  );
}

// ── Half one: SET equality, reporting extras and missing by RELATIVE PATH ────────
// An orphan left behind by a deleted role is invisible to a byte comparison (nothing regenerates
// over it) and so is a deleted adapter (nothing compares against it). Both are named here.
// Members are FULL relative paths, so a nested orphan is its own named member and can never be
// folded into a top-level entry sharing its basename.
const extra = committedNames.filter((n) => !rebuiltNames.includes(n));
const missing = rebuiltNames.filter((n) => !committedNames.includes(n));
if (extra.length > 0 || missing.length > 0) {
  let why = `STALE: ${ADAPTER_DIR} — the committed adapter set differs from a fresh regeneration (${committedNames.length} committed, ${rebuiltNames.length} regenerated).`;
  if (extra.length > 0) {
    why += `\n  ${extra.length} EXTRA committed adapter(s) that the generator does not produce (an orphan left by a deleted role): ${extra.join(", ")}`;
  }
  if (missing.length > 0) {
    why += `\n  ${missing.length} MISSING adapter(s) that the generator produces but the tree does not carry: ${missing.join(", ")}`;
  }
  die(`${why}\nRun \`${REGEN_CMD}\` and commit the result.`);
}

// ── Half two: BYTE comparison over the (now provably equal) member set ───────────
// Both sides are read by the SAME relative path, so a nested member is byte-compared at its own
// depth rather than by basename.
const differing: string[] = [];
for (const name of committedNames) {
  let committed: Buffer;
  try {
    committed = readFileSync(join(KIT_ROOT, ADAPTER_DIR, name));
  } catch {
    // Fail-closed: an unreadable committed adapter is never treated as absent-and-therefore-fine.
    die(
      `Adapter freshness check FAILED: ${ADAPTER_DIR}/${name} could not be read — run \`${REGEN_CMD}\` and commit it.`,
    );
  }
  const rebuilt = readFileSync(join(tmp, ADAPTER_DIR, name));
  if (!committed.equals(rebuilt)) differing.push(name);
}

cleanup();

if (differing.length > 0) {
  console.log(
    `STALE: ${differing.length} of ${committedNames.length} committed adapter(s) differ from a fresh regeneration: ${differing.join(", ")}\nRun \`${REGEN_CMD}\` and commit the result.`,
  );
  process.exit(1);
}

// The verdict states the RESOLUTION it compared beside what it compared. `announced[0]` is the value
// this run read off the child's stdout and asserted above — the same value, not a restatement of the
// requirement — so the line cannot claim a resolution the gate did not actually observe.
//
// THE SECOND LINE ENDS WITHOUT A FULL STOP, DELIBERATELY. It carries the same marker the generator
// emits, so a reader of THIS gate's output can parse it with the same grammar; trailing punctuation
// would become part of the parsed value and turn `none` into `none.`. Measured, not assumed — that
// is exactly how the first draft of this line failed its own case.
console.log(
  `Adapters fresh: ${committedNames.length} adapter(s) compared in ${ADAPTER_DIR}, 0 byte difference(s), directory listings set-equal.\nMirrored generator resolved model preset: ${announced[0]}`,
);
process.exit(0);
