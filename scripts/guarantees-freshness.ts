// guarantees-freshness.ts — grugops guarantees-render drift gate (D-17, AUTO-05).
//
// The guarantees page docs/GUARANTEES.md is generated, never hand-maintained: it is committed
// solely as the deterministic product of scripts/generate-guarantees.js. That contract only holds
// if the committed page stays in sync with the two sources it joins — the claim registry's
// `kind: safety` rows and the live checkpoint matrix. This gate proves it: regenerate into a
// throwaway temp mirror, then compare the committed file byte-for-byte against the fresh
// regeneration. Any mismatch — or a regeneration that fails to run cleanly at all — is reported and
// the gate exits non-zero so the drift is caught before it ships.
//
//   node scripts/guarantees-freshness.js   # exit 0 = the committed page is fresh
//                                          # exit 1 = drift detected OR the regen failed
//
// It is the content analog of scripts/catalog-freshness.ts and follows that gate's two stated rules
// verbatim, because the same two hazards apply:
//
//   RULE 1 — THE OUTPUT PATH STAYS A FIXED LITERAL AND THIS GATE MIRRORS INSTEAD OF OVERRIDING IT.
//   The generator keeps `OUT` a fixed literal as a path-traversal mitigation (ASVS V12). Handing
//   this gate an override would delete that mitigation in order to test it. So the gate lays out a
//   temp tree, copies the generator's import closure and its data sources in, and spawns the
//   MIRRORED generator, whose `OUT` resolves inside the mirror because it is joined to its own
//   module's parent.
//
//   RULE 2 — A MIRRORED REGENERATION THAT CANNOT RUN CLEANLY NEVER REPORTS FRESH. A broken
//   generator must not be mistaken for an up-to-date page. Every failure path below exits non-zero
//   and none of them prints the success marker.
//
// ── WHERE THIS GATE DIVERGES FROM ITS ANALOG, AND WHY ──────────────────────────────────────────
//
// THE COPY SET IS DERIVED, NOT HAND-LISTED. catalog-freshness.ts carries a hand-maintained cpSync
// list of its generator's import closure, and its own header records the trade honestly: deriving
// it would have meant writing a "what does this module import" grammar inside a build-safety gate.
// That grammar now EXISTS, once, in scripts/js-import-closure.ts — written in plan 30-01 after four
// hand-written mirror lists went stale in a single commit. So there is no trade left to make here:
// the JavaScript half of the mirror is the derived transitive closure of the generator's own entry
// artifact, and adding an import to any module in that graph updates this mirror automatically.
//
// THE DATA HALF IS COUNT-ASSERTED, BECAUSE IT CANNOT BE DERIVED. A generator's data sources are not
// visible in its import graph — they are paths it reads at run time. `GUARANTEES_DATA_SOURCES` is
// declared beside the generator, and this gate refuses if that list is not exactly
// `GUARANTEES_DATA_SOURCE_COUNT` long. A mirror short by one input would compare the committed
// document against a regeneration that never had the same sources, which is a byte comparison
// between two different questions.
//
// AND THE CONFIG MUST ACTUALLY LAND IN THE MIRROR. This is the sharp one. With no config file, the
// generator renders the roster defaults — which on a tree that has lowered nothing is the SAME text
// the committed page carries. A mirror that silently dropped the config would therefore report
// "fresh" today, and would go on reporting it on the day a repository lowered a floor and the
// committed page stopped saying so. So the gate counts the config candidates it copied and refuses
// by name if that count is zero.
//
// Node stdlib ONLY — node:child_process, node:fs, node:os, node:path. Zero npm dependencies.
// Findings are written in CLEAR PROFESSIONAL VOICE (CLAUDE.md hard rule — this is a build-safety
// surface, never caveman voice).

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
import { dirname, join, sep } from "node:path";
import { jsImportClosure } from "./js-import-closure.js";
import {
  OUT,
  REGEN_COMMAND,
  GUARANTEES_DATA_SOURCES,
  GUARANTEES_DATA_SOURCE_COUNT,
  GUARANTEES_ENTRY_JS,
} from "./generate-guarantees.js";

// Repo root = this script's parent's parent (scripts/ -> repo root).
const ROOT = join(import.meta.dirname, "..");

const toPosix = (p: string): string => p.split(sep).join("/");

function refuse(message: string): never {
  console.log(`Guarantees freshness check FAILED: ${message}`);
  process.exit(1);
}

// ── The declared-input pin, asserted BEFORE anything is copied ───────────────────────────────────
if (GUARANTEES_DATA_SOURCES.length !== GUARANTEES_DATA_SOURCE_COUNT) {
  refuse(
    `the generator declares ${GUARANTEES_DATA_SOURCES.length} data source(s) where ` +
      `GUARANTEES_DATA_SOURCE_COUNT pins ${GUARANTEES_DATA_SOURCE_COUNT} — refusing to build a ` +
      `mirror whose inputs are not the ones the render reads. A mirror short by one input compares ` +
      `the committed document against a regeneration that never had the same sources.`,
  );
}

// ── The temp mirror ─────────────────────────────────────────────────────────────────────────────
// Wrapped, because an unwritable temp directory is a condition this gate must REPORT rather than
// die on with a stack trace: a crashed gate and a refused gate look the same from the outside, and
// only one of them has said what is wrong.
// realpathSync-resolve the temp dir: on macOS tmpdir() lives under /var (a symlink to /private/var),
// and the generator guards its write behind an entry check
// (import.meta.url === pathToFileURL(process.argv[1]).href). With the /var symlink still on the
// mirror path, the spawned generator's argv[1] (symlinked) does not match its import.meta.url
// (realpath-resolved), and the generator silently no-ops with exit 0 — the fabricated success its
// own guard exists to prevent, arriving through the harness instead of through Windows. THIS WAS
// OBSERVED, NOT ANTICIPATED: the first run of this gate reported status 0, empty stdout and no
// output file, and it was the "wrote nothing" refusal below that made it visible rather than a
// green "fresh". The precedent is scripts/now-running-freshness.ts, which records the same
// resolution for the same reason.
let tmp: string;
try {
  tmp = realpathSync(mkdtempSync(join(tmpdir(), "grugops-guarantees-fresh-")));
} catch (e) {
  refuse(
    `the temp mirror directory could not be created under ${tmpdir()} ` +
      `(${(e as Error).message}) — refusing to report the guarantees page as fresh without ` +
      `regenerating it.`,
  );
}

function cleanup(): void {
  rmSync(tmp, { recursive: true, force: true });
}

function cleanupAndRefuse(message: string): never {
  cleanup();
  refuse(message);
}

// ── Mirror the generator's DERIVED JavaScript import closure ────────────────────────────────────
let closure: readonly string[];
try {
  closure = jsImportClosure(ROOT, GUARANTEES_ENTRY_JS);
} catch (e) {
  cleanupAndRefuse(
    `the import closure of ${GUARANTEES_ENTRY_JS} could not be derived ` +
      `(${(e as Error).message}) — refusing to mirror a partial module graph.`,
  );
}
for (const rel of closure) {
  const dst = join(tmp, rel);
  mkdirSync(dirname(dst), { recursive: true });
  cpSync(join(ROOT, rel), dst);
}

// ── Mirror the DATA the render reads, and prove the config half actually landed ──────────────────
let configsCopied = 0;
for (const rel of GUARANTEES_DATA_SOURCES) {
  const src = join(ROOT, rel);
  if (!existsSync(src)) continue;
  const dst = join(tmp, rel);
  mkdirSync(dirname(dst), { recursive: true });
  cpSync(src, dst);
  if (rel.endsWith("factory.config.json")) configsCopied += 1;
}
if (configsCopied === 0) {
  cleanupAndRefuse(
    `no factory config was found at any of the declared candidates ` +
      `(${GUARANTEES_DATA_SOURCES.filter((p) => p.endsWith("factory.config.json")).join(", ")}) — ` +
      `refusing to compare against a regeneration that read no matrix. With no config the render ` +
      `states the roster defaults, which on a tree that has lowered nothing is byte-identical to a ` +
      `correct page; reporting "fresh" from that comparison would keep reporting it on the day a ` +
      `floor was lowered.`,
  );
}

// The render's own output directory, taken from OUT rather than typed a second time.
mkdirSync(join(tmp, dirname(OUT)), { recursive: true });

const r = spawnSync("node", [join(tmp, GUARANTEES_ENTRY_JS)], { encoding: "utf8" });

// ── Fail-closed: a non-zero regeneration NEVER falls through to "fresh" ─────────────────────────
if (r.status !== 0) {
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  cleanupAndRefuse(
    "the generator did not run cleanly — refusing to report the guarantees page as fresh.",
  );
}

// ── Byte-compare the committed page against the fresh regeneration ──────────────────────────────
let committed: Buffer;
try {
  committed = readFileSync(join(ROOT, OUT));
} catch {
  cleanupAndRefuse(
    `${toPosix(OUT)} could not be read — run \`${REGEN_COMMAND}\` and commit it. A missing page is ` +
      `not a fresh one.`,
  );
}

let rebuilt: Buffer;
try {
  rebuilt = readFileSync(join(tmp, OUT));
} catch {
  cleanupAndRefuse(
    `the mirrored regeneration wrote nothing to ${toPosix(OUT)} — refusing to report the ` +
      `guarantees page as fresh against a file that was never produced.`,
  );
}

cleanup();

if (!committed.equals(rebuilt)) {
  console.log(
    `STALE: ${toPosix(OUT)} — the committed page differs from a fresh regeneration. Run ` +
      `\`${REGEN_COMMAND}\` and commit the result.`,
  );
  process.exit(1);
}

console.log(`Guarantees fresh: ${toPosix(OUT)} matches a fresh regeneration.`);
process.exit(0);
