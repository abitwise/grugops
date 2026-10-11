// host-entries-freshness.ts — the byte freshness gate for the generated non-Claude host entries (phase 34.1,
// plan 34.1-02; D-11).
//
// The whole-file host entries (the agent skill Codex CLI reads, the OpenCode command and the Pi prompt template)
// are generated, never hand-maintained: they are committed solely as the product of
// scripts/generate-host-entries.js over the kit's one pointer file. The generator halts on committed drift, but
// only when someone runs it. This gate runs in continuous integration: it regenerates every entry into a
// throwaway temp mirror from the COMMITTED generator and the judged tree's pointer file, then compares the judged
// tree against that regeneration.
//
//   node scripts/host-entries-freshness.js   # exit 0 = the committed entries are fresh
//                                            # exit 1 = drift, OR the regeneration did not run cleanly
//
// MODELLED ON scripts/skill-twins-freshness.ts and scripts/adapters-freshness.ts (the mirror-spawn pattern),
// and it inherits their two roots, their cleanup on every exit path and their fail-closed branch rather than
// re-deriving them. It is standalone, its own package.json entry (`freshness:host-entries`), and it is WIRED AT
// BOTH ENDS: the ubuntu freshness block of .github/workflows/ci.yml runs it, and
// scripts/host-entries-freshness.test.ts spawns this committed .js directly and reads both wirings.
//
// THE RENDERED SET IS WHAT THE MIRRORED RUN WROTE. This file types no entry path. After the mirrored generator
// exits 0, every non-directory entry in the temp mirror that this gate did not itself place there is a rendered
// entry; the generator takes its output paths only from ROUTE_POINTERS (install/host-tools.ts), so the set
// follows the registry with no second list here. A regeneration that wrote nothing is refused, never "nothing
// to compare, therefore fine".
//
// THE POINTER FILE PATH AND THE OVERWRITE FLAG ARE THE GENERATOR'S OWN EXPORTS (TEMPLATE_REL, OVERWRITE_FLAG),
// imported here rather than spelled again, so a rename of either moves this gate with it (34.1 DI-02: the file
// was renamed to host-entry.pointer.md in plan 34.1-01).
//
// THE MIRRORED GENERATOR IS RUN WITH ITS OVERWRITE FLAG. Without it the generator halts on an absent committed
// entry, and in the mirror every entry starts absent. Inside the mirror there is nothing to preserve, and the
// comparison is this gate's job, not the generator's.
//
// The COMMITTED .js files are mirrored, not the .ts sources, because the committed output is what hosts and
// continuous integration run.
//
// Fail-closed (T-34.1-04): a regeneration that does not exit 0 is never reported fresh; the gate prints the
// child's output and exits 1. A committed entry that is not a regular file, or cannot be read, is a named
// failure, never absent-and-therefore-fine. Every committed path is inspected with lstat before any read, so a
// link, a directory or a special file at an entry path is refused without being read through (no read can hang
// on a FIFO).
//
// The verdict states what was checked: the number of entries compared and the number of byte differences, so
// a run that compared nothing could never read as success.
//
// Node stdlib only, plus the generator's exported constants. Findings are in clear professional voice (a
// build-safety surface).
import { spawnSync } from "node:child_process";
import { cpSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { OVERWRITE_FLAG, TEMPLATE_REL } from "./generate-host-entries.js";
// TWO ROOTS, inherited from skill-twins-freshness.ts. SCRIPT_ROOT is where the committed compiled generator
// and the modules it imports live; those are always the ones mirrored. KIT_ROOT is the tree being judged (its
// pointer file is fed to the mirrored generator, and its committed entries are read back for comparison); it
// honours the CHECK_ROOT override the sibling gates honour, so the planted-drift cases in
// scripts/host-entries-freshness.test.ts mutate a temporary mirror and never the committed tree.
const SCRIPT_ROOT = join(import.meta.dirname, "..");
const KIT_ROOT = process.env.CHECK_ROOT ? process.env.CHECK_ROOT : SCRIPT_ROOT;
const REGEN_CMD = `npm run generate:host-entries -- ${OVERWRITE_FLAG}`;
// Unique temp mirror per run; removed on EVERY exit path, including a throw at module top level.
const tmp = mkdtempSync(join(tmpdir(), "grugops-host-entries-fresh-"));
function cleanup() {
    rmSync(tmp, { recursive: true, force: true });
}
// Registered IMMEDIATELY after the directory exists, so no throw below (an absent pointer file in a CHECK_ROOT
// mirror makes the top-level cpSync throw) can leave the directory behind. The explicit cleanup() calls in
// die() and in the tail stay the primary path: 'exit' does not fire on a signal or process.abort().
process.on("exit", cleanup);
function die(message) {
    cleanup();
    console.log(message);
    process.exit(1);
}
const at = (root, rel) => join(root, ...rel.split("/"));
// ── Mirror-spawn regeneration ─────────────────────────────────────────────────────────────────────────
// THE LIST BELOW IS THE GENERATOR'S IMPORT CLOSURE AND MUST TRACK IT. It is hand-written rather than derived,
// the trade adapters-freshness.ts and skill-twins-freshness.ts record: deriving it would mean a grammar for
// "what does this module import" inside a build-safety gate. The trade is acceptable only because the failure
// direction is loud: an unmirrored import makes the mirrored generator fail to resolve it and exit non-zero,
// which the fail-closed branch below reports as "did not run cleanly", and the gate goes red. It can never pass
// while one file short (scripts/host-entries-freshness.test.ts proves that with an import this list omits).
const MIRRORED_SCRIPTS = ["scripts/generate-host-entries.js", "scripts/is-entry.js", "install/host-tools.js"];
// The mirror's own package.json declares the module type, so the mirrored ESM files load as modules without
// relying on syntax detection (and without a typeless-package warning on the child's stderr).
const MIRROR_PACKAGE_JSON = "package.json";
const placed = new Set();
for (const rel of MIRRORED_SCRIPTS) {
    mkdirSync(dirname(at(tmp, rel)), { recursive: true });
    cpSync(at(SCRIPT_ROOT, rel), at(tmp, rel));
    placed.add(rel);
}
mkdirSync(dirname(at(tmp, TEMPLATE_REL)), { recursive: true });
cpSync(at(KIT_ROOT, TEMPLATE_REL), at(tmp, TEMPLATE_REL));
placed.add(TEMPLATE_REL);
writeFileSync(at(tmp, MIRROR_PACKAGE_JSON), '{ "type": "module" }\n', "utf8");
placed.add(MIRROR_PACKAGE_JSON);
// CHECK_ROOT is stripped from the child's environment. The mirrored generator resolves its fixed paths against
// its own location inside the mirror; if a later revision learned the override, an inherited CHECK_ROOT would
// point the "fresh regeneration" back at the judged tree and the gate would compare a tree with itself and
// always pass (T-34.1-04). The one-byte fail-proof in the test keeps this line honest.
const childEnv = { ...process.env };
delete childEnv.CHECK_ROOT;
const r = spawnSync(process.execPath, [at(tmp, "scripts/generate-host-entries.js"), OVERWRITE_FLAG], {
    encoding: "utf8",
    env: childEnv,
});
// ── Fail-closed: a regeneration that did not run cleanly NEVER falls through to "fresh" ───────────────
if (r.error !== undefined || r.status !== 0) {
    if (r.stdout)
        process.stdout.write(r.stdout);
    if (r.stderr)
        process.stderr.write(r.stderr);
    die(`Host-entry freshness check FAILED: the generator did not run cleanly (${r.error !== undefined ? r.error.message : `exit ${String(r.status)}${r.signal ? `, signal ${r.signal}` : ""}`}) — refusing to report the entries as fresh.`);
}
// Every non-directory entry under `root/rel`, as POSIX paths relative to `root`. Links are listed, never
// followed. An absent `root/rel` lists nothing; any other unreadable state is a named failure.
function walk(root, rel) {
    let st;
    try {
        st = lstatSync(at(root, rel));
    }
    catch (e) {
        if (e.code === "ENOENT")
            return [];
        die(`Host-entry freshness check FAILED: cannot inspect ${at(root, rel)} (${e.code ?? "error"}).`);
    }
    if (!st.isDirectory())
        return [rel];
    let names;
    try {
        names = readdirSync(at(root, rel));
    }
    catch (e) {
        die(`Host-entry freshness check FAILED: cannot list ${at(root, rel)} (${e.code ?? "error"}).`);
    }
    const out = [];
    for (const n of names.sort())
        out.push(...walk(root, rel === "" ? n : `${rel}/${n}`));
    return out;
}
// ── The rendered set: what the mirrored run wrote ─────────────────────────────────────────────────────
const rendered = walk(tmp, "").filter((rel) => !placed.has(rel));
if (rendered.length === 0) {
    die("Host-entry freshness check FAILED: the generator ran cleanly but wrote no entry into the mirror — refusing to report an empty regeneration as fresh.");
}
// ── Bytes: every rendered entry against the committed file at the same path ───────────────────────────
const stale = [];
for (const rel of rendered) {
    const committedPath = at(KIT_ROOT, rel);
    let st;
    try {
        st = lstatSync(committedPath);
    }
    catch (e) {
        if (e.code === "ENOENT") {
            stale.push(`STALE: ${rel} — the generator produces this entry but the tree does not carry it`);
            continue;
        }
        die(`Host-entry freshness check FAILED: cannot inspect ${rel} (${e.code ?? "error"}) — run \`${REGEN_CMD}\` and commit it.`);
    }
    if (!st.isFile()) {
        stale.push(`STALE: ${rel} — the committed entry is not a regular file (a link, directory or special file is never read through)`);
        continue;
    }
    let committed;
    try {
        committed = readFileSync(committedPath);
    }
    catch (e) {
        die(`Host-entry freshness check FAILED: ${rel} could not be read (${e.code ?? "error"}) — run \`${REGEN_CMD}\` and commit it.`);
    }
    const fresh = readFileSync(at(tmp, rel));
    if (!committed.equals(fresh)) {
        stale.push(`STALE: ${rel} — the committed entry differs from a fresh regeneration (committed ${committed.length}B, regenerated ${fresh.length}B)`);
    }
}
cleanup();
if (stale.length > 0) {
    console.log(`${stale.join("\n")}\nRun: ${REGEN_CMD}`);
    process.exit(1);
}
console.log(`Host entries fresh: ${rendered.length} ${rendered.length === 1 ? "entry" : "entries"} compared, 0 byte difference(s), entry set equal.`);
process.exit(0);
