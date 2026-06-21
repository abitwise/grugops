// now-running-freshness.ts — grugops queue now-running render drift gate (D-14, Pitfall 5).
//
// The human-facing "what is running" view at .grugops/queue/now-running.md is GENERATED, never
// hand-maintained: it is committed solely as the deterministic product of
// `node scripts/claim.js now-running`. The claim registry under .grugops/queue/claimed/<task>/claim.md
// is the SOURCE OF TRUTH; now-running.md is the derived, human-readable mirror. That contract only
// holds if the committed render stays byte-identical to a fresh regeneration from the claim registry.
// This gate proves it: regenerate now-running.md into a throwaway temp mirror rooted at
// .grugops/queue/, then compare the committed file byte-for-byte against the fresh regeneration. Any
// mismatch — or a regeneration that fails to run cleanly at all — is reported and the gate exits
// non-zero so the drift is caught before it ships.
//
//   node scripts/now-running-freshness.js  # exit 0 = the committed render is fresh
//                                           # exit 1 = drift detected OR a regen failed
//
// PITFALL 5 — WHY A DEDICATED GATE: the existing freshness:context gate (context-freshness.js) walks
// .grugops/context/ ONLY and will never see .grugops/queue/now-running.md. This gate is its queue-rooted
// twin, re-rooted from .grugops/context/ to .grugops/queue/.
//
// REGISTRY WINS: on any conflict the gate NEVER edits claimed/ — it only proves the derived
// now-running.md matches a fresh regen from the claim registry. The registry is authoritative.
//
// This gate is STANDALONE — like context-freshness, it is NOT folded into
// scripts/check-foundation-guards.ts. It is wired as its own package.json script (freshness:queue) so a
// stale committed render fails the build red on its own.
//
// Node stdlib ONLY — node:child_process, node:fs, node:os, node:path. Zero npm dependencies; runs with
// bare Node. import.meta.dirname (stable at the Node 22+ floor) resolves the repo root.
//
// CHECK_ROOT override: a hermetic fixture queue root (a temp dir holding .grugops/queue/{claimed,
// now-running.md}) is supplied via the CHECK_ROOT env var. Absent it, the gate checks the real
// .grugops/queue/.
//
// Greenfield vacuous success: if no queue claimed/ tree exists yet, there is nothing committed to
// drift — the gate succeeds and says so honestly, rather than failing.
//
// Fail-closed (T-23-02): if the mirrored regeneration cannot run cleanly, or the committed render
// cannot be read, the gate NEVER reports "fresh" — it exits non-zero. A broken render must never be
// mistaken for an up-to-date one.
//
// Findings are written to stdout in CLEAR PROFESSIONAL VOICE (CLAUDE.md hard rule — this is a
// build-safety + trace surface, never caveman voice).

import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  cpSync,
  rmSync,
  readFileSync,
  realpathSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";

// Repo root = this script's parent's parent (scripts/ -> repo root).
const ROOT = join(import.meta.dirname, "..");

// The queue root to check: the real .grugops/queue, or a CHECK_ROOT override (the oracle's hermetic
// fixture root) pointing at a sibling .grugops/queue tree.
const CHECK_ROOT = process.env.CHECK_ROOT;
const QUEUE_ROOT = CHECK_ROOT
  ? join(CHECK_ROOT, ".grugops", "queue")
  : join(ROOT, ".grugops", "queue");

// Unique temp mirror per run; cleaned up before every process.exit.
// realpathSync-resolve the temp dir: on macOS tmpdir() lives under /var (a symlink to /private/var),
// and the claim.js render guards its CLI behind an isMain check
// (import.meta.url === pathToFileURL(process.argv[1]).href). If the mirror path still carries the /var
// symlink, the spawned render's argv[1] (symlinked) would not match its import.meta.url
// (realpath-resolved) and the render would silently no-op with exit 0 — defeating the byte-compare.
// Resolving the symlink up front keeps the two equal so the mirrored render actually runs.
const tmp = realpathSync(mkdtempSync(join(tmpdir(), "grugops-queue-fresh-")));

function cleanup(): void {
  rmSync(tmp, { recursive: true, force: true });
}

const toPosix = (p: string): string => p.split(sep).join("/");

// ── Greenfield vacuous success ───────────────────────────────────────────────────
// No queue claimed/ tree yet → there is nothing committed that could have drifted. Succeed honestly
// rather than fail.
const claimedDir = join(QUEUE_ROOT, "claimed");
if (!existsSync(claimedDir)) {
  cleanup();
  console.log(
    "Now-running fresh: no .grugops/queue/claimed/ tree exists yet — nothing committed to drift (vacuous pass).",
  );
  process.exit(0);
}

// Lay out the temp mirror's render once: <tmp>/scripts/claim.js. Mirror the whole claimed/ registry
// into <tmp>/.grugops/queue/claimed and spawn the mirrored render so it writes
// <tmp>/.grugops/queue/now-running.md — the committed tree is never touched.
mkdirSync(join(tmp, "scripts"), { recursive: true });
cpSync(join(ROOT, "scripts", "claim.js"), join(tmp, "scripts", "claim.js"));
const mirroredRender = join(tmp, "scripts", "claim.js");
const mirroredQueueRoot = join(tmp, ".grugops", "queue");

mkdirSync(join(mirroredQueueRoot, "claimed"), { recursive: true });
cpSync(claimedDir, join(mirroredQueueRoot, "claimed"), { recursive: true });

// Mirror-spawn the render: writes <tmp>/.grugops/queue/now-running.md.
const r = spawnSync("node", [mirroredRender, "now-running", mirroredQueueRoot], {
  encoding: "utf8",
});

// ── Fail-closed: a non-zero regeneration NEVER falls through to "fresh" ──────────
if (r.status !== 0) {
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  console.log(
    "Now-running freshness check FAILED: the render did not run cleanly — " +
      "refusing to report the queue render as fresh.",
  );
  cleanup();
  process.exit(1);
}

// ── Byte-compare the committed render against the fresh regeneration ──────
const committedPath = join(QUEUE_ROOT, "now-running.md");
const relPath = toPosix(join(".grugops", "queue", "now-running.md"));

let committed: Buffer;
try {
  committed = readFileSync(committedPath);
} catch {
  // Fail-closed: a render we cannot read (e.g. it is missing while claims exist) cannot be proven
  // fresh — clean up and report, never fall through to "fresh".
  cleanup();
  console.log(
    `Now-running freshness check FAILED: ${relPath} could not be read — ` +
      "run `node scripts/claim.js now-running` and commit it.",
  );
  process.exit(1);
}

const rebuilt = readFileSync(join(mirroredQueueRoot, "now-running.md"));

if (!committed.equals(rebuilt)) {
  cleanup();
  console.log(
    `STALE: ${relPath} — the committed render differs from a fresh regeneration from the claim registry. ` +
      "The claimed/ registry is the source of truth; run `node scripts/claim.js now-running` and commit the result.",
  );
  process.exit(1);
}

cleanup();

console.log(
  "Now-running fresh: the committed .grugops/queue/now-running.md matches a fresh regeneration from the claim registry.",
);
process.exit(0);
