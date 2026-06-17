// context-freshness.ts — grugops shared-context index drift gate (SCTX-03, SC-4).
//
// The per-task derived index (index.md + index.jsonl) under .grugops/context/<task>/
// is generated, never hand-maintained: it is committed solely as the deterministic
// product of `node scripts/context-io.js render <task>`. The markdown notes/ are the
// SOURCE OF TRUTH; index.md + index.jsonl are the derived, machine-parsable mirror.
// That contract only holds if the committed derived files stay byte-identical to a
// fresh regeneration from notes/. This gate proves it: for every per-task context dir,
// regenerate index.md + index.jsonl into a throwaway temp mirror, then compare the
// committed files byte-for-byte against the fresh regeneration. Any mismatch — or a
// regeneration that fails to run cleanly at all — is reported and the gate exits
// non-zero so the drift is caught before it ships. It is the context analog of the
// catalog drift gate (scripts/catalog-freshness.ts), cloned from it verbatim in shape.
//
//   node scripts/context-freshness.js   # exit 0 = every committed index is fresh
//                                        # exit 1 = drift detected OR a regen failed
//
// MARKDOWN WINS: on any conflict the gate NEVER edits notes/ — it only proves the
// derived index.{md,jsonl} match a fresh regen from notes/. The notes/ are authoritative.
//
// This gate is STANDALONE — like catalog-freshness, it is NOT folded into
// scripts/check-foundation-guards.ts. It is wired as its own package.json script
// (freshness:context) so a stale committed index fails the build red on its own.
//
// Node stdlib ONLY — node:child_process, node:fs, node:os, node:path. Zero npm
// dependencies; runs with bare Node. import.meta.dirname (stable at the Node 22+
// floor) resolves the repo root from this script's location.
//
// The render keeps its OUT inside the context root it is handed (index.md/index.jsonl
// folder-relative to <contextRoot>/<task>/). The gate never overrides the production
// OUT; instead it mirror-spawns: cpSync the render .js (context-io.js) and a single
// task's notes/ into a temp tree, then spawnSync `context-io.js render <task> <tmpRoot>`
// so it writes to <tmp>/<task>/index.{md,jsonl} — the committed tree is never touched.
//
// CHECK_ROOT override: the SC-4 oracle points the gate at a hermetic fixture context
// root (a temp dir holding .grugops/context/<task>/{notes,index.*}) via the CHECK_ROOT
// env var. Absent it, the gate checks the real .grugops/context/.
//
// Greenfield vacuous success: if no context root exists yet (install seeding is
// Phase 24 — there is nothing committed to drift), the gate succeeds and says so
// honestly, rather than failing.
//
// Fail-closed (SC-4 / T-20-08): if a mirrored regeneration cannot run cleanly, or a
// committed derived file cannot be read, the gate NEVER reports "fresh" — it exits
// non-zero. A broken render must never be mistaken for an up-to-date index.
//
// Findings are written to stdout in CLEAR PROFESSIONAL VOICE (CLAUDE.md hard rule —
// this is a build-safety + trace surface, never caveman voice).

import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  cpSync,
  rmSync,
  readFileSync,
  readdirSync,
  realpathSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";

// Repo root = this script's parent's parent (scripts/ -> repo root).
const ROOT = join(import.meta.dirname, "..");

// The context root to check: the real .grugops/context, or a CHECK_ROOT override
// (the oracle's hermetic fixture root) pointing at a sibling .grugops/context tree.
const CHECK_ROOT = process.env.CHECK_ROOT;
const CONTEXT_ROOT = CHECK_ROOT
  ? join(CHECK_ROOT, ".grugops", "context")
  : join(ROOT, ".grugops", "context");

// Unique temp mirror per run; cleaned up before every process.exit.
// realpathSync-resolve the temp dir: on macOS tmpdir() lives under /var (a symlink to
// /private/var), and the context-io.js render guards its CLI behind an isMain check
// (import.meta.url === pathToFileURL(process.argv[1]).href). If the mirror path still
// carries the /var symlink, the spawned render's argv[1] (symlinked) would not match
// its import.meta.url (realpath-resolved) and the render would silently no-op with
// exit 0 — defeating the byte-compare. Resolving the symlink up front keeps the two
// equal so the mirrored render actually runs.
const tmp = realpathSync(mkdtempSync(join(tmpdir(), "grugops-context-fresh-")));

function cleanup(): void {
  rmSync(tmp, { recursive: true, force: true });
}

const toPosix = (p: string): string => p.split(sep).join("/");

// ── Greenfield vacuous success ───────────────────────────────────────────────────
// No context root yet (install seeding is Phase 24) → there is nothing committed that
// could have drifted. Succeed honestly rather than fail.
if (!existsSync(CONTEXT_ROOT)) {
  cleanup();
  console.log(
    "Context fresh: no .grugops/context/ tree exists yet — nothing committed to drift (vacuous pass).",
  );
  process.exit(0);
}

// Enumerate the per-task context dirs under the context root.
const taskDirs = readdirSync(CONTEXT_ROOT, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

if (taskDirs.length === 0) {
  cleanup();
  console.log(
    "Context fresh: .grugops/context/ exists but holds no per-task dirs — nothing to check (vacuous pass).",
  );
  process.exit(0);
}

// Lay out the temp mirror's render once: <tmp>/scripts/context-io.js. Per task we
// cpSync that task's notes/ into <tmp>/.grugops/context/<task>/notes and spawn the
// mirrored render so it writes <tmp>/.grugops/context/<task>/index.{md,jsonl}.
mkdirSync(join(tmp, "scripts"), { recursive: true });
cpSync(
  join(ROOT, "scripts", "context-io.js"),
  join(tmp, "scripts", "context-io.js"),
);
const mirroredRender = join(tmp, "scripts", "context-io.js");
const mirroredContextRoot = join(tmp, ".grugops", "context");

const derivedNames = ["index.md", "index.jsonl"] as const;

for (const task of taskDirs) {
  const committedTaskDir = join(CONTEXT_ROOT, task);
  const notesDir = join(committedTaskDir, "notes");

  // A task dir with no notes/ has nothing to regenerate from; skip it (nothing
  // committed-derived can be proven against an absent source — and render would emit
  // an empty index, which is a different concern owned by the render itself).
  if (!existsSync(notesDir)) continue;

  // Mirror this task's notes/ into the temp context root.
  const mirrorTaskNotes = join(mirroredContextRoot, task, "notes");
  mkdirSync(mirrorTaskNotes, { recursive: true });
  cpSync(notesDir, mirrorTaskNotes, { recursive: true });

  // Mirror-spawn the render: writes <tmp>/.grugops/context/<task>/index.{md,jsonl}.
  const r = spawnSync(
    "node",
    [mirroredRender, "render", task, mirroredContextRoot],
    { encoding: "utf8" },
  );

  // ── Fail-closed: a non-zero regeneration NEVER falls through to "fresh" ──────────
  if (r.status !== 0) {
    if (r.stdout) process.stdout.write(r.stdout);
    if (r.stderr) process.stderr.write(r.stderr);
    console.log(
      `Context freshness check FAILED: the render did not run cleanly for task "${task}" — ` +
        "refusing to report the context index as fresh.",
    );
    cleanup();
    process.exit(1);
  }

  // ── Byte-compare each committed derived file against the fresh regeneration ──────
  for (const name of derivedNames) {
    const committedPath = join(committedTaskDir, name);
    const relPath = toPosix(join(".grugops", "context", task, name));

    let committed: Buffer;
    try {
      committed = readFileSync(committedPath);
    } catch {
      // Fail-closed: a derived file we cannot read (e.g. it is missing) cannot be
      // proven fresh — clean up and report, never fall through to "fresh".
      cleanup();
      console.log(
        `Context freshness check FAILED: ${relPath} could not be read — ` +
          `run \`node scripts/context-io.js render ${task}\` and commit it.`,
      );
      process.exit(1);
    }

    const rebuilt = readFileSync(join(mirroredContextRoot, task, name));

    if (!committed.equals(rebuilt)) {
      cleanup();
      console.log(
        `STALE: ${relPath} — committed index differs from a fresh regeneration from notes/. ` +
          `The markdown notes/ are the source of truth; run ` +
          `\`node scripts/context-io.js render ${task}\` and commit the result.`,
      );
      process.exit(1);
    }
  }
}

cleanup();

console.log(
  "Context fresh: every committed index.{md,jsonl} matches a fresh regeneration from notes/.",
);
process.exit(0);
