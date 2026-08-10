// skill-twins-freshness.ts — grugops standalone skill-twin drift gate (KIT-03 / SPAWN-04, Phase 27,
// plan 27-64, D-64 Part B).
//
// The seven standalone skill twins under .claude/skills/<d>/SKILL.md are generated, never
// hand-maintained: they are committed solely as the deterministic product of
// scripts/generate-skill-twins.js. That contract only holds if the committed twins stay in sync with
// the plugin-form sources they derive from. This gate proves it: regenerate the whole twin directory
// into a throwaway temp mirror, then compare the committed directory against the fresh regeneration.
//
//   node scripts/skill-twins-freshness.js   # exit 0 = the committed twins are fresh
//                                           # exit 1 = drift detected OR the regeneration failed
//
// WHY IT EXISTS, WHICH IS THE ONLY ARGUMENT THAT MATTERS HERE (D-64 Part B). Every bypass
// reproduced in every one of eleven review rounds in this phase landed in a SKILL.md. The seventeen
// agent adapters are generated and byte-gated by scripts/adapters-freshness.js and have never been
// bypassed once; the fourteen SKILL.md files were hand-authored and, until this file, no freshness
// gate in this tree named `SKILL` at all. The strong mechanism already existed, was proven, and had
// simply never been extended to the failing surface. This gate extends it. It is NOT a new idea and
// it deliberately invents nothing: it is modelled near-verbatim on scripts/adapters-freshness.ts,
// which is itself the fifth working instance of the mirror-spawn pattern in this tree (build output,
// catalog, context, queue, traceability). This is the seventh freshness entry in package.json.
//
// WHAT IT COVERS THAT guard_distribution_pair DOES NOT, STATED SO THE OVERLAP READS AS DELIBERATE.
// check-foundation-guards' guard_distribution_pair already compares each plugin-form skill against
// its standalone twin modulo the `name` value — and EXEMPTS the kit root, whose twin legitimately
// carries the extra resolver block. So the root twin's 1733 bytes were under no byte check at all.
// This gate compares against a fresh REGENERATION rather than against the pair's sibling, so it
// covers all seven including the root, and it is the stronger of the two. The pair guard is NOT
// removed or weakened by this plan: two guards asking overlapping questions from two directions is
// the posture, and any consolidation is a later decision made on purpose.
//
// This gate is STANDALONE — it is NOT folded into scripts/check-foundation-guards.ts. The
// established precedent is that a domain freshness check is its own package.json entry
// (freshness:skill-twins), so a stale twin fails the build red on its own.
//
// WIRED AT BOTH ENDS, DELIBERATELY, because the single most expensive omission of this phase was a
// gate that ran nowhere: freshness:adapters existed and passed for a whole phase while being invoked
// by nothing, and a committed hand-edit to an adapter cleared every gate in the repository
// (27-REVIEW CR-01/CR-02). A gate nothing re-runs fails nothing closed. So:
//   • .github/workflows/ci.yml — the ubuntu-only gate block runs `npm run freshness:skill-twins`
//     alongside its siblings, so drift turns the build red today;
//   • scripts/skill-twins-freshness.test.ts — spawns this committed .js directly, so the drift lane
//     survives a workflow refactor that drops or renames the step.
//
// TWO HALVES, not one. This gate compares a DIRECTORY, so it checks both:
//   • SET   — the two directory listings for exact set equality, reporting which members are EXTRA
//             and which are MISSING rather than only that the sets differ;
//   • BYTES — every committed twin against its regenerated counterpart, naming every difference.
// Without the set half an orphan twin left behind by a deleted skill passes freshness because
// nothing regenerates over it, and a missing twin passes because nothing compares against it.
//
// SET MEMBERS ARE RELATIVE PATHS, not bare names, and BOTH listings come from
// scripts/kit-model.ts's listSkillAdapters() — the ONE answer in this tree to "what is a standalone
// skill entry point". That authority recurses, so a NESTED SKILL.md the generator never produced is
// inside this comparison as a named EXTRA member. This file carries NO directory listing of its own:
// a second derivation of the skill rule is exactly the drift this gate exists to refuse.
//
// The generator keeps its OUT_DIR a fixed literal (.claude/skills) as a path-traversal mitigation
// (ASVS V12, T-27-149) and accepts no output flag. This gate never overrides it; instead it
// mirror-spawns — cpSync the generator twin, the modules it imports and the plugin-form sources into
// a temp tree, then spawnSync the mirrored generator so it writes to <tmp>/.claude/skills while
// OUT_DIR stays a fixed literal.
//
// THE MIRRORED GENERATOR IS INVOKED WITH ITS OVERWRITE FLAG, and that is a property of the mirror
// rather than a loosening. The generator's default posture is to HALT rather than overwrite a
// differing committed twin, because on the live tree a silent rewrite would destroy the very
// evidence of drift. Inside the mirror there is nothing to preserve — the twin directory this gate
// creates starts empty — and the comparison is THIS GATE'S job, not the generator's. Without the
// flag a future mirror that also copied the committed twins would make the generator halt and this
// gate would report "did not run cleanly" for a tree that is merely stale, which is a correct red
// for the wrong reason and a worse diagnostic.
//
// The COMMITTED .js twins are copied, not the .ts sources, because the committed output is what
// hosts and continuous integration actually run.
//
// Fail-closed (T-27-150): if the mirrored regeneration cannot run cleanly the gate NEVER reports
// "fresh" — it prints the generator's own output and exits non-zero. A broken generator must never
// be mistaken for an up-to-date twin directory. A committed twin that cannot be READ likewise fails,
// naming the file and the regeneration command, rather than being treated as
// absent-and-therefore-fine.
//
// The verdict states WHAT WAS CHECKED, not a bare "fresh": the number of twins compared and the
// number of byte differences found, so a run that compared zero twins is visible as the anomaly it
// is rather than reading as success.
//
// Node stdlib ONLY — node:child_process, node:fs, node:os, node:path. Zero npm dependencies.
//
// Findings are written in CLEAR PROFESSIONAL VOICE (CLAUDE.md hard rule — this is a build-safety
// surface, never caveman voice).
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, cpSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { listSkillAdapters } from "./kit-model.js";
// TWO ROOTS, deliberately separated — INHERITED from adapters-freshness.ts rather than reinvented,
// and the separation is what makes this gate pointable at a hermetic mirror at all.
//
// SCRIPT_ROOT stays fixed and script-relative: it is where the committed compiled twins the
// mirror-spawn copies (generate-skill-twins.js and the modules it imports) actually live, and those
// must be the ones continuous integration and host machines run — never a copy from an arbitrary
// mirror.
const SCRIPT_ROOT = join(import.meta.dirname, "..");
// KIT_ROOT is the tree whose twins are being judged: the plugin-form skill sources fed to the
// mirrored generator, and the committed .claude/skills directory read back for comparison. It honors
// the SAME CHECK_ROOT override that check-foundation-guards.ts, check-kit-refs.ts and
// adapters-freshness.ts already honor. Reusing the existing gate convention rather than inventing a
// fourth root variable is the point: the planted-drift cases in scripts/skill-twins-freshness.test.ts
// mutate a temporary mirror and never the committed tree.
const KIT_ROOT = process.env.CHECK_ROOT ? process.env.CHECK_ROOT : SCRIPT_ROOT;
// The generator's fixed-literal output directory and its fixed-literal source directory, mirrored
// here as fixed literals too.
const TWIN_DIR = ".claude/skills";
const SRC_DIR = "skills";
// The generator HALTS rather than overwriting a differing committed twin, so the remediation command
// carries the flag that adopts a legitimate source change deliberately. A remediation instruction
// that does not actually work is worse than none.
const OVERWRITE_FLAG = "--overwrite-committed-twins";
const REGEN_CMD = `npm run generate:skill-twins -- ${OVERWRITE_FLAG}`;
// Unique temp mirror per run; cleaned up on EVERY exit path, including an uncaught throw.
const tmp = mkdtempSync(join(tmpdir(), "grugops-skill-twins-fresh-"));
function cleanup() {
    rmSync(tmp, { recursive: true, force: true });
}
// Registered IMMEDIATELY after the directory exists, so there is no window in which a throw can
// escape without removing it (IN-01, reproduced and fixed on adapters-freshness.ts and inherited
// here rather than rediscovered). Everything below runs at module top level and the cpSync calls are
// unguarded, so an absent `skills` directory in a CHECK_ROOT mirror would otherwise throw past every
// handler and leave <tmpdir>/grugops-skill-twins-fresh-* behind. A gate that accumulates state
// outside its own lifetime is a slow denial of service on the host and on CI runners (T-27-151).
//
// The exit HANDLER rather than a try/finally around the module body: this file is top-level script
// code, and wrapping it would re-indent every declaration for a two-line fix, burying the diff.
//
// The explicit cleanup() calls in die() and in the two tails are KEPT. rmSync with `force` is
// idempotent, so removing twice is harmless, and deleting them would leave the module depending
// entirely on a handler — 'exit' does not fire on a signal, on process.abort(), or when the process
// is torn down by the host, so the direct calls remain the primary path and this is the backstop.
process.on("exit", cleanup);
function die(message) {
    cleanup();
    console.log(message);
    process.exit(1);
}
// ── Mirror-spawn regeneration ────────────────────────────────────────────────────
// Lay out <tmp>/scripts/{generate-skill-twins,kit-model,frontmatter}.js + <tmp>/skills +
// <tmp>/.claude/skills, then run the mirrored generator so its fixed-literal OUT_DIR resolves inside
// the mirror.
//
// THE TWIN LIST BELOW IS THE GENERATOR'S IMPORT CLOSURE AND MUST TRACK IT. It is hand-written rather
// than derived, and that is the same deliberate trade adapters-freshness.ts records: deriving it
// would mean writing a grammar for "what does this module import" inside a build-safety gate, which
// is a second grammar of exactly the kind finding WR-03 exists to delete. The trade is only
// acceptable because the failure direction is LOUD — an unmirrored import makes the mirrored
// generator fail to resolve it and exit non-zero, which the fail-closed branch below reports as "did
// not run cleanly" and the gate goes red. It can never pass while one file short.
//
// The SCRIPT twins come from SCRIPT_ROOT (the committed compiled output under test); the KIT sources
// come from KIT_ROOT (the tree being judged, which may be a hermetic mirror).
mkdirSync(join(tmp, "scripts"), { recursive: true });
mkdirSync(join(tmp, TWIN_DIR), { recursive: true });
cpSync(join(SCRIPT_ROOT, "scripts", "generate-skill-twins.js"), join(tmp, "scripts", "generate-skill-twins.js"));
cpSync(join(SCRIPT_ROOT, "scripts", "kit-model.js"), join(tmp, "scripts", "kit-model.js"));
cpSync(join(SCRIPT_ROOT, "scripts", "frontmatter.js"), join(tmp, "scripts", "frontmatter.js"));
cpSync(join(KIT_ROOT, SRC_DIR), join(tmp, SRC_DIR), { recursive: true });
// CHECK_ROOT is stripped from the child's environment on purpose, for the reason
// adapters-freshness.ts states and this gate inherits unchanged. The mirrored generator resolves its
// own fixed-literal paths against its own location inside <tmp>, and it must keep doing so: if a
// future revision ever learned the same override, an inherited CHECK_ROOT would silently point the
// "fresh regeneration" back at the very tree it is meant to be compared against, and the gate would
// compare a tree with itself and always pass. That is threat T-27-150, and the one-byte-drift
// fail-proof in scripts/skill-twins-freshness.test.ts is what keeps this line honest.
const childEnv = { ...process.env };
delete childEnv.CHECK_ROOT;
const r = spawnSync("node", [join(tmp, "scripts", "generate-skill-twins.js"), OVERWRITE_FLAG], { encoding: "utf8", env: childEnv });
// ── Fail-closed: a non-zero regeneration NEVER falls through to "fresh" ──────────
if (r.status !== 0) {
    if (r.stdout)
        process.stdout.write(r.stdout);
    if (r.stderr)
        process.stderr.write(r.stderr);
    die("Skill-twin freshness check FAILED: the generator did not run cleanly — refusing to report the twins as fresh.");
}
// ── List both sides through the ONE skill authority ──────────────────────────────
// listSkillAdapters() is asked twice with two explicit roots: the tree under judgement, and the fresh
// regeneration. It THROWS rather than returning an empty array on a missing, unreadable or zero-entry
// directory, so each call is wrapped to keep this gate's own fail-closed wording — which names the
// directory and tells the reader what to run — while CARRYING the thrown message through rather than
// discarding the one piece of information that says which directory failed and why.
const listTwins = (root, what) => {
    try {
        return listSkillAdapters(root);
    }
    catch (e) {
        die(`Skill-twin freshness check FAILED: cannot read the ${what} skill directory ${join(root, TWIN_DIR)} — ${e instanceof Error ? e.message : String(e)}\nRun \`${REGEN_CMD}\` and commit the result.`);
    }
};
const committedNames = listTwins(KIT_ROOT, "committed");
const rebuiltNames = listTwins(tmp, "regenerated");
// A regeneration that produced nothing is the anomaly, never "nothing to compare, therefore fine".
//
// THIS ARM IS CURRENTLY UNREACHABLE, AND THAT IS STATED HERE RATHER THAN LEFT FOR A READER TO
// DISCOVER (plan 27-64 task 3). Reaching it needs a generator that exits 0 having emitted nothing,
// and TWO upstream refusals make that impossible today, both measured by cases in
// scripts/skill-twins-freshness.test.ts:
//   1. generate-skill-twins.js refuses its own empty render — a corpus that produced no twin exits 1
//      with a named finding, so the clean-exit precondition of this branch cannot be met;
//   2. listSkillAdapters() refuses an empty directory by THROWING, which the wrapper above converts
//      into this gate's fail-closed "cannot read the regenerated skill directory" verdict.
// The arm is KEPT as the third layer precisely because layers one and two live in other modules: if
// a later edit relaxes either refusal, this becomes the live branch instead of the silence that
// would otherwise appear. It is defense in depth with its own reachability recorded honestly, not a
// branch anyone should claim to have exercised end to end.
if (rebuiltNames.length === 0) {
    die(`Skill-twin freshness check FAILED: the generator ran cleanly but produced no twins in ${TWIN_DIR} — refusing to report an empty regeneration as fresh.`);
}
// ── Half one: SET equality, reporting extras and missing by RELATIVE PATH ────────
// An orphan left behind by a deleted skill is invisible to a byte comparison (nothing regenerates
// over it) and so is a deleted twin (nothing compares against it). Both are named here. Members are
// FULL relative paths, so a nested orphan is its own named member and can never be folded into a
// top-level entry sharing its basename.
const extra = committedNames.filter((n) => !rebuiltNames.includes(n));
const missing = rebuiltNames.filter((n) => !committedNames.includes(n));
if (extra.length > 0 || missing.length > 0) {
    let why = `STALE: ${TWIN_DIR} — the committed skill-twin set differs from a fresh regeneration (${committedNames.length} committed, ${rebuiltNames.length} regenerated).`;
    if (extra.length > 0) {
        why += `\n  ${extra.length} EXTRA committed twin(s) that the generator does not produce (an orphan left by a deleted skill): ${extra.join(", ")}`;
    }
    if (missing.length > 0) {
        why += `\n  ${missing.length} MISSING twin(s) that the generator produces but the tree does not carry: ${missing.join(", ")}`;
    }
    die(`${why}\nRun \`${REGEN_CMD}\` and commit the result.`);
}
// ── Half two: BYTE comparison over the (now provably equal) member set ───────────
// Both sides are read by the SAME relative path, so a nested member is byte-compared at its own depth
// rather than by basename.
const differing = [];
for (const name of committedNames) {
    let committed;
    try {
        committed = readFileSync(join(KIT_ROOT, TWIN_DIR, name));
    }
    catch {
        // Fail-closed: an unreadable committed twin is never treated as absent-and-therefore-fine.
        die(`Skill-twin freshness check FAILED: ${TWIN_DIR}/${name} could not be read — run \`${REGEN_CMD}\` and commit it.`);
    }
    const rebuilt = readFileSync(join(tmp, TWIN_DIR, name));
    if (!committed.equals(rebuilt))
        differing.push(name);
}
cleanup();
if (differing.length > 0) {
    console.log(`STALE: ${differing.length} of ${committedNames.length} committed skill twin(s) differ from a fresh regeneration: ${differing.join(", ")}\nRun \`${REGEN_CMD}\` and commit the result.`);
    process.exit(1);
}
console.log(`Skill twins fresh: ${committedNames.length} twin(s) compared in ${TWIN_DIR}, 0 byte difference(s), directory listings set-equal.`);
process.exit(0);
