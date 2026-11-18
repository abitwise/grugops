// catalog-freshness.ts — the reference-tree freshness gate (DOCS-02; plan 43-04, D-16, D-17).
//
// The reference tree under docs/reference/ (the index README.md and one page per role under agents/) is
// generated, never hand-maintained: it is committed solely as the deterministic product of
// scripts/generate-catalog.js. That contract only holds if the committed tree stays in step with the kit it
// documents. This gate proves it: regenerate the whole tree into a throwaway temp mirror, then compare the
// committed tree with the regeneration, member for member and byte for byte. Any difference, or a regeneration
// that does not run cleanly, is reported and the gate exits non-zero.
//
//   node scripts/catalog-freshness.js   # exit 0 = every committed page equals a fresh regeneration
//                                       # exit 1 = a page is MISSING, EXTRA or STALE, a committed page is not
//                                       #          a regular file, OR the regeneration failed
//
// (Until plan 43-04 this gate compared one file, docs/catalog/README.md. That folder is retired, D-16a; the
// npm script name `freshness:catalog` is kept because CI runs it.)
//
// This gate is STANDALONE — it is NOT folded into scripts/check-foundation-guards.ts (18 D-07). It is wired as
// its own package.json script (freshness:catalog), which the ubuntu block of .github/workflows/ci.yml runs.
//
// MODELLED ON scripts/host-entries-freshness.ts (the tree gate: mirror, spawn, lstat walk, SET, BYTES, verdict)
// and scripts/guarantees-freshness.ts (the derived import-closure mirror and the data-source refusal).
//
// TWO ROOTS. SCRIPT_ROOT is where the committed compiled generator and the modules it imports live; those are
// always the ones mirrored. KIT_ROOT is the tree being judged: its role and workflow files are fed to the
// mirrored generator, and its committed docs/reference/ is read back for comparison. KIT_ROOT honours the
// CHECK_ROOT override the sibling gates honour, so the planted-drift cases in scripts/catalog-freshness.test.ts
// mutate a temporary mirror and never the committed tree.
//
// THE MIRROR IS THE GENERATOR'S DERIVED IMPORT CLOSURE PLUS ITS DATA. The modules come from
// jsImportClosure(SCRIPT_ROOT, "scripts/generate-catalog.js"), so a new import of the generator needs no edit
// here. The two source directories are DATA, not imports, so no import walk can find them: they are listed by
// hand below, and a mirror where either did not land is refused rather than regenerated from nothing.
//
// The generator keeps its output directory a fixed literal (docs/reference) joined to its own location
// (path-traversal mitigation, ASVS V12). The gate never overrides it: the mirrored generator writes to
// <tmp>/docs/reference/, which is the rendered set.
//
// SET, then BYTES. The committed set is every non-directory entry under KIT_ROOT/docs/reference/, walked with
// lstat (a link is listed and never followed). A committed page the generator does not produce is EXTRA; a
// page the generator produces and the tree does not carry is MISSING; each is named by relative path. Every
// rendered page the tree does carry is then compared byte for byte (Buffer.equals); a committed entry that is
// not a regular file is a named failure, never read through. The rendered set must hold at least one page and
// exactly ROLE_COUNT pages under agents/, so a regeneration that wrote nothing, or wrote a page set that has
// drifted from the role count, is refused rather than compared.
//
// Fail-closed (D-07 / T-18-06): a regeneration that does not exit 0 is never reported fresh; the gate prints
// the child's output and exits 1.
//
// The verdict states what was checked: `compared N page(s), M difference(s)`, so a run that compared nothing
// could never read as success.
//
// Node stdlib only, plus two in-repo modules: scripts/js-import-closure.js (the mirror) and
// scripts/kit-model.js (ROLE_COUNT). Findings are in clear professional voice (a build-safety surface).

import { spawnSync } from "node:child_process";
import {
  cpSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
  type Stats,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { jsImportClosure } from "./js-import-closure.js";
import { ROLE_COUNT } from "./kit-model.js";

const SCRIPT_ROOT = join(import.meta.dirname, "..");
const KIT_ROOT = process.env.CHECK_ROOT ? process.env.CHECK_ROOT : SCRIPT_ROOT;

const GENERATOR_REL = "scripts/generate-catalog.js";
const REFERENCE_REL = "docs/reference";
const AGENTS_REL = `${REFERENCE_REL}/agents`;
// The generator's data inputs. Data, not imports: no import walk can find them, so they are listed here.
const DATA_SOURCES: readonly string[] = ["agent-factory/roles", "agent-factory/workflows"];
const REGEN_CMD = "npm run generate:catalog";

const at = (root: string, rel: string): string => join(root, ...rel.split("/"));

// Unique temp mirror per run, realpath-resolved (on macOS tmpdir() sits behind a /var link); removed on EVERY
// exit path, including a throw at module top level.
const tmp = realpathSync(mkdtempSync(join(tmpdir(), "grugops-reference-fresh-")));

function cleanup(): void {
  rmSync(tmp, { recursive: true, force: true });
}
process.on("exit", cleanup);

function die(message: string): never {
  cleanup();
  console.log(message);
  process.exit(1);
}

// ── Mirror: the generator's derived import closure, its data, and a module-type package.json ─────────
let closure: readonly string[];
try {
  closure = jsImportClosure(SCRIPT_ROOT, GENERATOR_REL);
} catch (e) {
  die(
    `Reference freshness check FAILED: the import closure of ${GENERATOR_REL} could not be derived (${(e as Error).message}) — refusing to mirror a partial module graph.`,
  );
}
for (const rel of closure) {
  mkdirSync(dirname(at(tmp, rel)), { recursive: true });
  cpSync(at(SCRIPT_ROOT, rel), at(tmp, rel));
}

const landed: string[] = [];
for (const rel of DATA_SOURCES) {
  let st: Stats;
  try {
    st = lstatSync(at(KIT_ROOT, rel));
  } catch {
    continue;
  }
  if (!st.isDirectory()) continue;
  cpSync(at(KIT_ROOT, rel), at(tmp, rel), { recursive: true });
  landed.push(rel);
}
const notLanded = DATA_SOURCES.filter((rel) => !landed.includes(rel));
if (notLanded.length > 0) {
  die(
    `Reference freshness check FAILED: the generator's data source(s) ${notLanded.join(", ")} did not land in the mirror (absent, or not a directory, under ${KIT_ROOT}) — refusing to compare against a regeneration that read no kit.`,
  );
}
writeFileSync(at(tmp, "package.json"), '{ "type": "module" }\n', "utf8");

// CHECK_ROOT is stripped from the child's environment: the mirrored generator resolves its fixed paths against
// its own location inside the mirror, and an inherited override must never point the "fresh regeneration" back
// at the judged tree, which would compare a tree with itself.
const childEnv = { ...process.env };
delete childEnv.CHECK_ROOT;

const r = spawnSync(process.execPath, [at(tmp, GENERATOR_REL)], { encoding: "utf8", env: childEnv });

// ── Fail-closed: a regeneration that did not run cleanly NEVER falls through to "fresh" ─────────────
if (r.error !== undefined || r.status !== 0) {
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  die(
    `Reference freshness check FAILED: the generator did not run cleanly (${r.error !== undefined ? r.error.message : `exit ${String(r.status)}${r.signal ? `, signal ${r.signal}` : ""}`}) — refusing to report the reference tree as fresh.`,
  );
}

// lstat, or null when nothing is at `path`; any other failure is a named failure, never "absent".
function lstatOrNull(path: string): Stats | null {
  try {
    return lstatSync(path);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
    die(`Reference freshness check FAILED: cannot inspect ${path} (${(e as NodeJS.ErrnoException).code ?? "error"}).`);
  }
}

// Every non-directory entry under `root/rel`, as POSIX paths relative to `root`. Links are listed, never
// followed. An absent `root/rel` lists nothing; any other unreadable state is a named failure.
function walk(root: string, rel: string): string[] {
  const st = lstatOrNull(at(root, rel));
  if (st === null) return [];
  if (!st.isDirectory()) return [rel];
  let names: string[];
  try {
    names = readdirSync(at(root, rel));
  } catch (e) {
    die(`Reference freshness check FAILED: cannot list ${at(root, rel)} (${(e as NodeJS.ErrnoException).code ?? "error"}).`);
  }
  const out: string[] = [];
  for (const n of names.sort()) out.push(...walk(root, `${rel}/${n}`));
  return out;
}

// ── The rendered set: what the mirrored run wrote ────────────────────────────────────────────────────
const rendered = walk(tmp, REFERENCE_REL);
if (rendered.length === 0) {
  die(
    "Reference freshness check FAILED: the generator ran cleanly but wrote no page into the mirror — refusing to report an empty regeneration as fresh.",
  );
}
// Two-sided: the regeneration wrote exactly one page per role, so neither a role without a page nor a page
// without a role can reach the comparison.
const renderedAgents = rendered.filter((rel) => rel.startsWith(`${AGENTS_REL}/`));
if (renderedAgents.length !== ROLE_COUNT) {
  die(
    `Reference freshness check FAILED: the regeneration wrote ${renderedAgents.length} page(s) under ${AGENTS_REL}/, expected exactly ROLE_COUNT = ${ROLE_COUNT} (one per role) — refusing to compare a page set that has drifted from the role count.`,
  );
}

// ── Half one: the SET, before any byte is compared ───────────────────────────────────────────────────
// A byte comparison alone cannot see an orphan (nothing regenerates over it) or a deleted page (nothing
// compares against it), so both are named here by relative path.
const committedSet = walk(KIT_ROOT, REFERENCE_REL);
const findings: string[] = [];
for (const rel of committedSet) {
  if (!rendered.includes(rel)) {
    findings.push(`EXTRA: ${rel} — committed under ${REFERENCE_REL}/, but the generator does not produce it`);
  }
}
for (const rel of rendered) {
  if (!committedSet.includes(rel)) {
    findings.push(`MISSING: ${rel} — the generator produces this page but the tree does not carry it`);
  }
}

// ── Half two: BYTES, over every rendered page the tree carries ───────────────────────────────────────
let compared = 0;
for (const rel of rendered) {
  if (!committedSet.includes(rel)) continue;
  compared += 1;
  const committedPath = at(KIT_ROOT, rel);
  const st = lstatOrNull(committedPath);
  if (st === null || !st.isFile()) {
    findings.push(
      `STALE: ${rel} — the committed page is not a regular file (a link, directory or special file is never read through)`,
    );
    continue;
  }
  let committed: Buffer;
  try {
    committed = readFileSync(committedPath);
  } catch (e) {
    die(
      `Reference freshness check FAILED: ${rel} could not be read (${(e as NodeJS.ErrnoException).code ?? "error"}) — run \`${REGEN_CMD}\` and commit the result.`,
    );
  }
  const fresh = readFileSync(at(tmp, rel));
  if (!committed.equals(fresh)) {
    findings.push(
      `STALE: ${rel} — the committed page differs from a fresh regeneration (committed ${committed.length}B, regenerated ${fresh.length}B)`,
    );
  }
}

cleanup();

if (findings.length > 0) {
  console.log(
    `${findings.join("\n")}\nReference freshness check FAILED: compared ${compared} page(s), ${findings.length} difference(s) (${committedSet.length} committed, ${rendered.length} regenerated).\nRun: ${REGEN_CMD}`,
  );
  process.exit(1);
}

console.log(
  `Reference fresh: compared ${compared} page(s), 0 difference(s); the committed page set under ${REFERENCE_REL}/ equals a fresh regeneration.`,
);
process.exit(0);
