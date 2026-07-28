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
// TWO HALVES, not one. The analogs compare a single file; this gate compares a DIRECTORY, so it
// checks both:
//   • BYTES — every committed adapter against its regenerated counterpart;
//   • SET   — the two directory listings for exact set equality, reporting which names are EXTRA and
//             which are MISSING rather than only that the sets differ.
// Without the set half an orphaned adapter left behind by a deleted role passes freshness because
// nothing regenerates over it, and a missing adapter passes because nothing compares against it.
// Neither is visible to a byte comparison alone.
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
// Node stdlib ONLY — node:child_process, node:fs, node:os, node:path. Zero npm dependencies.
//
// Findings are written in CLEAR PROFESSIONAL VOICE (CLAUDE.md hard rule — this is a build-safety
// surface, never caveman voice).
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, cpSync, rmSync, readdirSync, readFileSync, } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
// Repo root = this script's parent (scripts/ -> repo root).
const ROOT = join(import.meta.dirname, "..");
// The generator's fixed-literal output directory, mirrored here as a fixed literal too.
const ADAPTER_DIR = ".claude/agents";
const REGEN_CMD = "npm run generate:adapters";
// Unique temp mirror per run; cleaned up before every process.exit.
const tmp = mkdtempSync(join(tmpdir(), "grugops-adapters-fresh-"));
function cleanup() {
    rmSync(tmp, { recursive: true, force: true });
}
function die(message) {
    cleanup();
    console.log(message);
    process.exit(1);
}
// ── Mirror-spawn regeneration ────────────────────────────────────────────────────
// Lay out <tmp>/scripts/{generate-role-adapters,kit-model}.js + <tmp>/agent-factory/{roles,packaging}
// + <tmp>/.claude/agents, then run the mirrored generator so its fixed-literal OUT_DIR resolves
// inside the mirror.
//
// agent-factory/packaging is mirrored although the generator does not currently OPEN it: it is the
// declared upstream source for both adapter body shapes and for the capability vocabulary, so a
// future revision that consults it finds it here. Note that omitting an input would not have been
// silently unsafe either — an absent input makes the mirrored generator exit non-zero, which this
// gate reports as "did not run cleanly" rather than as fresh.
mkdirSync(join(tmp, "scripts"), { recursive: true });
mkdirSync(join(tmp, ADAPTER_DIR), { recursive: true });
cpSync(join(ROOT, "scripts", "generate-role-adapters.js"), join(tmp, "scripts", "generate-role-adapters.js"));
cpSync(join(ROOT, "scripts", "kit-model.js"), join(tmp, "scripts", "kit-model.js"));
cpSync(join(ROOT, "agent-factory", "roles"), join(tmp, "agent-factory", "roles"), {
    recursive: true,
});
cpSync(join(ROOT, "agent-factory", "packaging"), join(tmp, "agent-factory", "packaging"), { recursive: true });
const r = spawnSync("node", [join(tmp, "scripts", "generate-role-adapters.js")], {
    encoding: "utf8",
});
// ── Fail-closed: a non-zero regeneration NEVER falls through to "fresh" ──────────
if (r.status !== 0) {
    if (r.stdout)
        process.stdout.write(r.stdout);
    if (r.stderr)
        process.stderr.write(r.stderr);
    die("Adapter freshness check FAILED: the generator did not run cleanly — refusing to report the adapters as fresh.");
}
// ── List both directories ────────────────────────────────────────────────────────
const listAdapters = (dir, what) => {
    try {
        return readdirSync(dir)
            .filter((f) => f.endsWith(".md"))
            .sort();
    }
    catch {
        die(`Adapter freshness check FAILED: cannot read the ${what} adapter directory ${dir} — run \`${REGEN_CMD}\` and commit the result.`);
    }
};
const committedNames = listAdapters(join(ROOT, ADAPTER_DIR), "committed");
const rebuiltNames = listAdapters(join(tmp, ADAPTER_DIR), "regenerated");
// A regeneration that produced nothing is the anomaly, never "nothing to compare, therefore fine".
if (rebuiltNames.length === 0) {
    die(`Adapter freshness check FAILED: the generator ran cleanly but produced no adapters in ${ADAPTER_DIR} — refusing to report an empty regeneration as fresh.`);
}
// ── Half one: SET equality, reporting extras and missing by NAME ─────────────────
// An orphan left behind by a deleted role is invisible to a byte comparison (nothing regenerates
// over it) and so is a deleted adapter (nothing compares against it). Both are named here.
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
// ── Half two: BYTE comparison over the (now provably equal) name set ─────────────
const differing = [];
for (const name of committedNames) {
    let committed;
    try {
        committed = readFileSync(join(ROOT, ADAPTER_DIR, name));
    }
    catch {
        // Fail-closed: an unreadable committed adapter is never treated as absent-and-therefore-fine.
        die(`Adapter freshness check FAILED: ${ADAPTER_DIR}/${name} could not be read — run \`${REGEN_CMD}\` and commit it.`);
    }
    const rebuilt = readFileSync(join(tmp, ADAPTER_DIR, name));
    if (!committed.equals(rebuilt))
        differing.push(name);
}
cleanup();
if (differing.length > 0) {
    console.log(`STALE: ${differing.length} of ${committedNames.length} committed adapter(s) differ from a fresh regeneration: ${differing.join(", ")}\nRun \`${REGEN_CMD}\` and commit the result.`);
    process.exit(1);
}
console.log(`Adapters fresh: ${committedNames.length} adapter(s) compared in ${ADAPTER_DIR}, 0 byte difference(s), directory listings set-equal.`);
process.exit(0);
