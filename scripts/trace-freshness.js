// trace-freshness.ts — grugops traceability render drift gate (MIGR-03, D-03).
//
// The human-facing trace matrix at plans/traceability.md is GENERATED, never hand-maintained: it is
// committed solely as the deterministic product of `node scripts/trace-render.js`. The shared
// verified-context NOTES under .grugops/context/<task>/notes/ are the SOURCE OF TRUTH; their `refs`
// carry each ticket's requirement / code / test / UAT / release links. traceability.md is the derived,
// human-readable mirror. That contract only holds if the committed render stays byte-identical to a
// fresh regeneration from the notes. This gate proves it: regenerate traceability.md into a throwaway
// temp mirror, then compare the committed file byte-for-byte against the fresh regeneration. Any
// mismatch — or a regeneration that fails to run cleanly at all — is reported and the gate exits
// non-zero so the drift is caught before it ships.
//
//   node scripts/trace-freshness.js  # exit 0 = the committed render is fresh
//                                     # exit 1 = drift detected OR a regen failed
//
// WHY A DEDICATED GATE: the committed-.js `freshness` gate proves the build outputs; the
// `freshness:context` gate walks .grugops/context/ index renders. NEITHER sees plans/traceability.md,
// which is per-repo RUNTIME state under plans/ (not committed kit output). This gate is the plans/-rooted
// twin, re-rooted from .grugops/queue/ (now-running-freshness.ts) to the notes → plans/ trace. It is
// STANDALONE — like now-running-freshness / context-freshness / catalog-freshness, it is NOT folded into
// scripts/freshness.js NOR into scripts/check-foundation-guards.ts (D-03). It is wired as its own
// package.json script (freshness:traceability) so a stale committed render fails the build red on its own.
//
// NOTES WIN: on any conflict the gate NEVER edits the notes — it only proves the derived traceability.md
// matches a fresh regen from the notes. The notes are authoritative.
//
// Node stdlib ONLY — node:child_process, node:fs, node:os, node:path. Zero npm dependencies; runs with
// bare Node. import.meta.dirname (stable at the Node 22+ floor) resolves the repo root.
//
// CHECK_ROOT override: a hermetic fixture root (a temp dir holding .grugops/context/<task>/notes/ and
// plans/traceability.md) is supplied via the CHECK_ROOT env var. Absent it, the gate checks the real
// .grugops/context/ + plans/.
//
// Greenfield vacuous success: if no .grugops/context/ notes tree exists yet, there is nothing committed
// that could have drifted — the gate succeeds and says so honestly, rather than failing.
//
// Fail-closed (D-03, T-24-03-STALE/FAB): if the mirrored regeneration cannot run cleanly, or the
// committed render cannot be read, the gate NEVER reports "fresh" — it exits non-zero. A broken render
// must never be mistaken for an up-to-date one. The trace is the proof; a stale trace is a gate FAIL,
// never a silent pass.
//
// Findings are written to stdout in CLEAR PROFESSIONAL VOICE (CLAUDE.md hard rule — this is a
// build-safety + trace surface, never caveman voice).
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, cpSync, rmSync, readFileSync, realpathSync, existsSync, } from "node:fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";
import { pathToFileURL } from "node:url";
// Repo root = this script's parent's parent (scripts/ -> repo root).
const ROOT = join(import.meta.dirname, "..");
const toPosix = (p) => p.split(sep).join("/");
// ── The gate body — runs ONLY when this module is the process entry point (WR-04). ───────────────
// Wrapped in main() and gated behind the same import.meta-vs-argv check the siblings use. Importing
// the module (a future aggregator, or a unit test of a helper) must NOT execute the gate or call
// process.exit — every side-effecting statement (mkdtempSync, cpSync, spawnSync, the exits) lives here.
function main() {
    // The root to check: the real repo, or a CHECK_ROOT override (the hermetic fixture root) holding a
    // sibling .grugops/context tree + plans/traceability.md. Read at call time so an importer that sets
    // CHECK_ROOT before invoking main() is honored.
    const CHECK_ROOT = process.env.CHECK_ROOT;
    const CONTEXT_ROOT = CHECK_ROOT
        ? join(CHECK_ROOT, ".grugops", "context")
        : join(ROOT, ".grugops", "context");
    const PLANS_ROOT = CHECK_ROOT ? join(CHECK_ROOT, "plans") : join(ROOT, "plans");
    // Unique temp mirror per run; cleaned up before every process.exit.
    // realpathSync-resolve the temp dir: on macOS tmpdir() lives under /var (a symlink to /private/var),
    // and the trace-render.js CLI guards its behavior behind an isMain check
    // (import.meta.url === pathToFileURL(process.argv[1]).href). If the mirror path still carries the /var
    // symlink, the spawned render's argv[1] (symlinked) would not match its import.meta.url
    // (realpath-resolved) and the render would silently no-op with exit 0 — defeating the byte-compare.
    // Resolving the symlink up front keeps the two equal so the mirrored render actually runs.
    const tmp = realpathSync(mkdtempSync(join(tmpdir(), "grugops-trace-fresh-")));
    const cleanup = () => {
        rmSync(tmp, { recursive: true, force: true });
    };
    // ── Greenfield vacuous success ───────────────────────────────────────────────────
    // No .grugops/context/ notes tree yet → there is nothing committed that could have drifted (the
    // notes are the source of truth, and there are none). Succeed honestly rather than fail.
    if (!existsSync(CONTEXT_ROOT)) {
        cleanup();
        console.log("Traceability fresh: no .grugops/context/ notes tree exists yet — nothing committed to drift (vacuous pass).");
        process.exit(0);
    }
    // Lay out the temp mirror's render once: <tmp>/scripts/{trace-render.js, context-io.js}. The render
    // imports context-io.js, so BOTH committed .js are mirrored. Mirror the whole .grugops/context/ notes
    // tree into <tmp>/.grugops/context and spawn the mirrored render so it writes
    // <tmp>/plans/traceability.md — the committed tree is never touched.
    mkdirSync(join(tmp, "scripts"), { recursive: true });
    cpSync(join(ROOT, "scripts", "trace-render.js"), join(tmp, "scripts", "trace-render.js"));
    cpSync(join(ROOT, "scripts", "context-io.js"), join(tmp, "scripts", "context-io.js"));
    const mirroredRender = join(tmp, "scripts", "trace-render.js");
    const mirroredContextRoot = join(tmp, ".grugops", "context");
    const mirroredPlansRoot = join(tmp, "plans");
    mkdirSync(mirroredContextRoot, { recursive: true });
    cpSync(CONTEXT_ROOT, mirroredContextRoot, { recursive: true });
    mkdirSync(mirroredPlansRoot, { recursive: true });
    // Mirror-spawn the render: writes <tmp>/plans/traceability.md from the mirrored notes.
    const r = spawnSync("node", [mirroredRender, mirroredContextRoot, mirroredPlansRoot], {
        encoding: "utf8",
    });
    // ── Fail-closed: a non-zero regeneration NEVER falls through to "fresh" (D-03) ──────────
    if (r.status !== 0) {
        if (r.stdout)
            process.stdout.write(r.stdout);
        if (r.stderr)
            process.stderr.write(r.stderr);
        console.log("Traceability freshness check FAILED: the render did not run cleanly — " +
            "refusing to report the trace render as fresh.");
        cleanup();
        process.exit(1);
    }
    // ── Byte-compare the committed render against the fresh regeneration ──────
    const committedPath = join(PLANS_ROOT, "traceability.md");
    const relPath = toPosix(join("plans", "traceability.md"));
    let committed;
    try {
        committed = readFileSync(committedPath);
    }
    catch {
        // Fail-closed: a render we cannot read (e.g. it is missing while notes exist) cannot be proven
        // fresh — clean up and report, never fall through to "fresh".
        cleanup();
        console.log(`Traceability freshness check FAILED: ${relPath} could not be read — ` +
            "run `node scripts/trace-render.js` and commit it.");
        process.exit(1);
    }
    const rebuilt = readFileSync(join(mirroredPlansRoot, "traceability.md"));
    if (!committed.equals(rebuilt)) {
        cleanup();
        console.log(`STALE: ${relPath} — the committed render differs from a fresh regeneration from the notes. ` +
            "The shared-context notes are the source of truth; run `node scripts/trace-render.js` and commit the result.");
        process.exit(1);
    }
    cleanup();
    console.log("Traceability fresh: the committed plans/traceability.md matches a fresh regeneration from the shared-context notes.");
    process.exit(0);
}
// Entry check: true only when this module was launched directly (not imported). process.argv[1] is
// the launched script path; compare it to this module's own file URL. Importing the module is
// side-effect-free.
const isMain = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
    main();
}
