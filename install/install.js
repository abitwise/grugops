// install.ts — grugops single TypeScript installer (TOOL-01, D-07).
//
// This is the SINGLE installer (D-07): it replaces the dual install/install.sh (POSIX) +
// install/install.mjs (Node) pair. Node is now a documented hard install prerequisite; the dual
// sh/Node byte-parity install contract is retired (D-08). This file is a behavior-preserving
// TypeScript port of install/install.mjs — every env-var name, sentinel string, exit code, regex,
// and fail-closed branch is carried byte-for-behavior. Only TypeScript types were added; nothing
// semantic changed (translate, never redesign — the installer's never-overwrite/never-delete
// safety contract is a CLAUDE.md hard constraint). The committed compiled output is
// install/install.js, which is what users run.
//
// Cross-platform (Windows / no-POSIX). Node stdlib ONLY: node:fs + node:path + node:os — ZERO npm
// dependencies; the shipped/compiled .js needs nothing installed on host machines (D-05).
//
// Contract (CLEAR PROFESSIONAL VOICE governs every report/warning/error string — safety surface):
//   - additive    — never overwrites or deletes user content; appends via unique sentinels
//   - idempotent  — running twice produces ZERO diff
//   - DRY_RUN=1   — prints the plan and changes NOTHING on the filesystem
//   - reversible  — install/uninstall.ts removes exactly what this added (and only that)
//   - D-30 symlink-with-copy-fallback (symlinkSync → copyFileSync on failure)
//   - NEVER sets the production deploy-approval env var; NEVER touches agent-factory/, plans/, user data
//
// Usage:
//   node install/install.js --target /path/to/repo
//   node install/install.js --yes
//   DRY_RUN=1 node install/install.js
//   INSTALL_MODE=symlink node install/install.js   (copy is the default, D-05; --symlink also opts in)
//   node install/install.js --allow-self            (override the D-07 self-checkout guard)
//   node install/install.js --check                 (doctor: verify a target install, mutate nothing)
//   node install/install.js --check --strict        (doctor: promote warnings to a nonzero exit)
//   GRUGOPS_HOME=/path node install/install.js      (override the shared kit home; default ~/.grugops)
//   GRUGOPS_SRC=/path/to/grugops TARGET=/path/to/repo node install/install.js
//
// Two-root layout (INSTALL-03/04): the read-only kit is copied to resolve(os.homedir(),".grugops")
// (or $GRUGOPS_HOME), the resolved absolute kit path is materialized into every target resolver
// adapter, and the per-repo state plane is seeded into the target (skip-if-exists).
//
// KIT-02 / D-18: the adapter and skill sets are DERIVED at run time by reading $GRUGOPS_SRC — the
// installer carries no adapter or skill name literal, and whether a source file is materialized or
// plain-copied is decided by the resolver slot line in its own body (D-06), not by its filename.
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync, symlinkSync, copyFileSync, cpSync, rmSync, renameSync, readSync, readdirSync, lstatSync, } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { homedir } from "node:os";
// --- argument parsing (INSTALL-03), layered over the TARGET/INSTALL_MODE env overrides ---
//   --check    run the non-mutating doctor (INSTALL-05): verify every referenced path resolves,
//              name the FIRST failure with its referencing file, mutate nothing
//   --strict   (with --check) promote WARN findings to a nonzero exit
let ARG_TARGET = "";
let YES = false;
let ALLOW_SELF = false;
let ARG_SYMLINK = false;
let CHECK = false;
let STRICT = false;
// Phase-17 (Plan 17-01) mode flags. Recognized by the arg-parse loop here so any other unknown
// arg still exits 2; the modes themselves are NOT wired into a branch yet (Plans 02/03 do that).
let MIGRATE = false;
let UPDATE = false;
let PRUNE_OLD_KIT = false;
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--target") {
        ARG_TARGET = argv[++i] ?? "";
    }
    else if (a.startsWith("--target=")) {
        ARG_TARGET = a.slice("--target=".length);
    }
    else if (a === "--yes" || a === "-y") {
        YES = true;
    }
    else if (a === "--allow-self" || a === "--force") {
        ALLOW_SELF = true;
    }
    else if (a === "--symlink") {
        ARG_SYMLINK = true;
    }
    else if (a === "--check") {
        CHECK = true;
    }
    else if (a === "--strict") {
        STRICT = true;
    }
    else if (a === "--migrate") {
        MIGRATE = true;
    }
    else if (a === "--update") {
        UPDATE = true;
    }
    else if (a === "--prune-old-kit") {
        PRUNE_OLD_KIT = true;
    }
    else {
        process.stderr.write(`install.js: unknown argument: ${a}\n`);
        process.exit(2);
    }
}
// import.meta.dirname (Node 22+) replaces the .mjs's dirname(fileURLToPath(import.meta.url)).
const SCRIPT_DIR = import.meta.dirname;
const GRUGOPS_SRC = process.env.GRUGOPS_SRC
    ? resolve(process.env.GRUGOPS_SRC)
    : resolve(SCRIPT_DIR, "..");
const DRY_RUN = process.env.DRY_RUN === "1";
// D-05: default to COPY (symlink is opt-in via --symlink / INSTALL_MODE=symlink). Copy is the
// only mode that behaves identically on every platform; symlinks broke the dogfood.
const INSTALL_MODE = ARG_SYMLINK ? "symlink" : process.env.INSTALL_MODE || "copy";
// resolveGrugopsHome: mirror install.sh's resolve_grugops_home. Empty-string GRUGOPS_HOME must
// also fall back (the sh :- colon form). Resolve via os.homedir() so the Windows home (USERPROFILE)
// matches Git Bash $HOME. Normalize to POSIX forward-slash so the materialized KIT= line is
// byte-identical to the sh side (Pitfall 2; full Windows parity is UNKNOWN - verify).
const toPosix = (p) => p.replace(/\\/g, "/");
const GRUGOPS_HOME = toPosix(process.env.GRUGOPS_HOME && process.env.GRUGOPS_HOME.trim()
    ? resolve(process.env.GRUGOPS_HOME)
    : resolve(homedir(), ".grugops"));
const KIT_ROOT = toPosix(resolve(GRUGOPS_HOME, "agent-factory"));
// readlineSync: read a single line from stdin (fd 0) synchronously, byte by byte until newline or
// EOF. Used only for the interactive prompt; --yes / non-TTY never reach it.
function readlineSync() {
    const chunks = [];
    const buf = Buffer.alloc(1);
    for (;;) {
        let n;
        try {
            n = readSync(0, buf, 0, 1, null);
        }
        catch {
            break;
        }
        if (n <= 0)
            break;
        if (buf[0] === 0x0a)
            break; // newline
        chunks.push(buf[0]);
    }
    return Buffer.from(chunks).toString("utf8");
}
// --- resolve TARGET (INSTALL-03): --target flag > TARGET env > prompt(default CWD). Non-TTY or
// --yes takes the default without prompting (CI-safe). Resolved to absolute before any write. ---
function resolveTarget() {
    if (ARG_TARGET)
        return toPosix(resolve(ARG_TARGET));
    const def = process.env.TARGET ? resolve(process.env.TARGET) : process.cwd();
    if (YES || !process.stdin.isTTY)
        return toPosix(def);
    // No-target modes never install INTO a repo (WR-02): --update is kit-home-only and
    // --prune-old-kit only removes timestamped .bak.<ISO> backups. Do NOT ask "install into which
    // repo?" for them. --update ignores the answer entirely, so take the default silently; prune
    // still needs a repo root to scan, so it asks its own mode-appropriate question.
    if (UPDATE)
        return toPosix(def);
    if (PRUNE_OLD_KIT) {
        process.stdout.write(`Prune grugops backups in which repo? [${toPosix(def)}] `);
        const pruneAns = readlineSync().trim();
        return toPosix(pruneAns ? resolve(pruneAns) : def);
    }
    // Interactive confirm-the-default prompt (synchronous one-line read of stdin).
    process.stdout.write(`Install grugops into which repo? [${toPosix(def)}] `);
    const ans = readlineSync().trim();
    return toPosix(ans ? resolve(ans) : def);
}
const TARGET = resolveTarget();
// Materialization sentinels — byte-identical to uninstall.ts. Declared HERE (before the doctor) so
// the doctor's adapter KIT= parser can reference them under --check; materializeAdapter on the
// install path below reuses these same definitions verbatim (mirrors install.sh's relocation).
const MAT_OPEN = "# <!-- grugops:materialized-kit -->";
const MAT_CLOSE = "# <!-- /grugops:materialized-kit -->";
const MAT_SLOT = "# 1. (installed) the absolute kit path the installer wrote above this line.";
// ---------------------------------------------------------------------------
// Kit-set derivation (KIT-02 / D-18). The installer SELF-DERIVES the adapter and skill sets by
// reading $GRUGOPS_SRC at run time; it carries NO hand-listed adapter or skill name. Laying down
// seventeen adapters instead of one therefore requires no installer edit.
//
// D-18 is explicit that the installer stays SELF-CONTAINED: it deliberately does NOT import
// scripts/kit-model.ts. The separation of duty is the point — the installer faithfully installs
// whatever exists in the kit source, while kit-model plus the KIT-03 referential-integrity oracle
// guarantee at CI time that what exists is correct. Importing the scripts layer would couple the
// single-file installer to the scripts/ layout and force it to ship a second file.
//
// FAIL-LOUD CONTRACT (27-13) — ONE contract for ONE derivation, shared with install/uninstall.ts.
// Both helpers return NULL, never [], when the source directory cannot be read. Null is the
// fail-LOUD signal, exactly as it already is in uninstall.ts: the caller reports the condition and
// skips that whole install class rather than looping zero times and reporting completion anyway.
// They previously returned [] on any read failure, so a tarball that dropped dot directories, a
// partial checkout or a permissions problem produced a SILENT no-op install that still printed a
// completion banner (T-27-59).
//
// THREE STATES, THREE MESSAGES. `null` = the directory could not be read. `[]` = the directory was
// read successfully and holds nothing. A populated array = the install set. The two failure states
// need different remedies (restore the checkout vs. investigate an empty kit), so they are reported
// distinctly and never folded into one line.
//
// Both are called AT EACH USE SITE rather than cached into a module-level constant — the doctor and
// the install paths run at different points in the process, so a cached snapshot could go stale.
// ---------------------------------------------------------------------------
// srcSkillNames: the sorted directory names under $GRUGOPS_SRC/.claude/skills that contain a
// SKILL.md. A directory without a SKILL.md is not a skill and is never installed. Null on an
// unreadable root (fail-loud); [] on a root that exists and holds no skill.
function srcSkillNames() {
    const root = join(GRUGOPS_SRC, ".claude", "skills");
    try {
        return readdirSync(root, { withFileTypes: true })
            .filter((ent) => ent.isDirectory() && existsSync(join(root, ent.name, "SKILL.md")))
            .map((ent) => ent.name)
            .sort();
    }
    catch {
        return null;
    }
}
// srcAdapterFiles: the sorted TOP-LEVEL .md filenames under $GRUGOPS_SRC/.claude/agents. Null on an
// unreadable root (fail-loud); [] on a root that exists and holds no adapter.
function srcAdapterFiles() {
    const root = join(GRUGOPS_SRC, ".claude", "agents");
    try {
        return readdirSync(root, { withFileTypes: true })
            .filter((ent) => ent.isFile() && ent.name.endsWith(".md"))
            .map((ent) => ent.name)
            .sort();
    }
    catch {
        return null;
    }
}
// srcNestedAdapterFiles: every `.md` entry BELOW the top level of $GRUGOPS_SRC/.claude/agents, as
// forward-slash relative paths, sorted.
//
// THE FLAT-DIRECTORY CONTRACT, AND WHY THE INSTALLER MUST SEE PAST IT. The adapter directory is flat
// by contract: the generator, the freshness gate and this installer all work over a flat directory,
// and the foundation guards REFUSE a nested adapter by name. But Claude Code discovers
// `.claude/agents/` RECURSIVELY, so a nested file is loaded by the platform. srcAdapterFiles() above
// is deliberately non-recursive — it is the INSTALL set, and installing a nested file would
// contradict the contract — which means without this helper a nested source adapter would simply
// vanish from the run with no comment. The installer must not be the one place a file disappears
// silently, so it detects the nested entry and REFUSES it by name (T-27-62).
//
// THE POLICY IS DEFINED BY scripts/kit-model.ts (listAgentAdapters), NOT HERE. That module is the
// single authority for "what is an adapter"; this file deliberately does NOT import it (D-18 — the
// installer stays a self-contained single file). The two derivations are asserted EQUAL by a test
// instead of bought by coupling: see the `source derivation` conformance case in install.test.ts,
// which compares this installer's real installed set against listAgentAdapters() over the same
// fixture and asserts the cardinality as a number. If the locked decision is ever revisited, that
// conformance case is what to delete along with the duplicate.
//
// A read failure at any level yields [] here rather than null: an unreadable root is already the
// srcAdapterFiles() null branch's finding, and reporting the same condition twice would be noise.
function srcNestedAdapterFiles() {
    const root = join(GRUGOPS_SRC, ".claude", "agents");
    const walk = (base) => {
        const out = [];
        let ents;
        try {
            ents = readdirSync(join(root, base), { withFileTypes: true });
        }
        catch {
            return out;
        }
        for (const ent of ents) {
            const rel = base ? `${base}/${ent.name}` : ent.name;
            if (ent.isDirectory())
                out.push(...walk(rel));
            else if (ent.isFile() && ent.name.endsWith(".md") && rel.includes("/"))
                out.push(rel);
        }
        return out;
    };
    return walk("").sort();
}
// srcCarriesSlot: the ROUTING signal (D-06). Whether a source file is materialized or plain-copied
// is decided by the presence of the resolver slot line in its OWN body — never by a hard-coded
// filename. That is what makes all seventeen adapters resolvers with no name list anywhere, and it
// removes the by-name special case the old call site used to carve out for one skill. The test is
// whole-line equality, matching materializeAdapter's own `line === MAT_SLOT` injection test exactly,
// so routing and injection can never disagree. Fail-closed: an unreadable source is NOT treated as
// a resolver (it falls through to linkOrCopy, which reports the missing source).
function srcCarriesSlot(src) {
    try {
        return readFileSync(src, "utf8").split("\n").includes(MAT_SLOT);
    }
    catch {
        return false;
    }
}
// targetAdapterFiles: the derived adapter set mapped into the TARGET's .claude/agents directory.
// Propagates the null (it is the same derivation wearing a different path prefix); each caller
// decides what an unknown set means for it, rather than the helper deciding for all of them.
function targetAdapterFiles() {
    const files = srcAdapterFiles();
    return files === null ? null : files.map((f) => join(TARGET, ".claude", "agents", f));
}
// report / mkdirp / sameContent / isoStamp: install-side helpers declared HERE (above the doctor +
// the early --update / --prune-old-kit / --migrate branches) so those early branches — which run
// before the original install run — can call them (transitively, via copyKit → dirsSameContent →
// sameContent) without tripping the const temporal dead zone (mirrors the MAT_* relocation above
// the doctor). copyKit is reached from the early --update branch, and it walks dirsSameContent
// (D-09 differs-only no-op), which calls sameContent — so sameContent MUST be initialized first.
const report = (label, msg) => console.log(`  ${label.padEnd(14)} ${msg}`);
// verify (27-13): a `verify`-status finding — something the run could NOT do and the human must
// resolve. Mirrors uninstall.ts's `report("verify", ...)` shape exactly, and additionally COUNTS the
// findings so the closing banner cannot claim completion over a class the run silently installed
// nothing for (T-27-59). Declared here beside report/mkdirp/sameContent, above the doctor and the
// early --update / --prune-old-kit / --migrate branches, so those branches can call it without
// tripping the const temporal dead zone.
let VERIFY_FINDINGS = 0;
const verify = (msg) => {
    VERIFY_FINDINGS += 1;
    report("verify", msg);
};
const mkdirp = (dir) => {
    if (!existsSync(dir) && !DRY_RUN)
        mkdirSync(dir, { recursive: true });
};
const sameContent = (a, b) => {
    try {
        return readFileSync(a, "utf8") === readFileSync(b, "utf8");
    }
    catch {
        return false;
    }
};
// isoStamp: a filesystem-safe, millisecond-precision ISO timestamp — every ':' replaced with '-'
// so the suffix is legal on every filesystem including Windows (D-08). Shape: YYYY-MM-DDTHH-MM-SS.mmmZ.
const isoStamp = () => new Date().toISOString().replace(/:/g, "-");
// GRUGOPS_BACKUP_SUFFIX: a TIGHT anchored matcher for the grugops backup name-shape — `.bak.`
// followed by an isoStamp() ISO timestamp (YYYY-MM-DDTHH-MM-SS.mmmZ, colons replaced by '-'),
// anchored to end-of-string. NOT a loose `*.bak` (Pitfall 5 / T-17-03-PRUNE): a user's `mine.bak`
// or `notes.bak` does NOT match, only the grugops `<name>.bak.<ISO>` shape this installer creates.
// Declared HERE (with the other early helpers) so the early --prune-old-kit branch — which runs
// before the original install run — reaches it via pruneOldKit() without a const TDZ error.
const GRUGOPS_BACKUP_SUFFIX = /\.bak\.\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.\d{3}Z$/;
// ---------------------------------------------------------------------------
// Doctor (INSTALL-05) — a non-mutating verifier: reads only, stats only, mutates NOTHING (never
// copyKit / materializeAdapter / seedState / writeMarker; never reads or writes the prod
// deploy-approval env var, carried prohibition from INSTALL-02 / SAFE-02). It reuses the one
// resolution rule (GRUGOPS_HOME / KIT_ROOT, source (a) of the D-03 cross-check, resolved above).
// Fail-closed parsing: a garbled or absent marker/adapter becomes a finding, never an unhandled
// throw. Findings are greppable lines; FAIL names the path + referencing file.
// ---------------------------------------------------------------------------
// docReport / docFail / docWarn: greppable finding lines (printf '  %-14s %s\n'). The counters
// live in module scope the doctor reads back.
let DOC_FAILS = 0;
let DOC_WARNS = 0;
const docReport = (label, msg) => console.log(`  ${label.padEnd(14)} ${msg}`);
const docFail = (msg) => {
    docReport("FAIL", msg);
    DOC_FAILS += 1;
};
const docWarn = (msg) => {
    docReport("WARN", msg);
    DOC_WARNS += 1;
};
// readMarker: fail-closed read of the byte-stable .grugops/install.json the installer wrote
// (writeMarker schema). JSON.parse in try/catch — an absent/garbled marker returns null (never
// throws), source (b) of D-03. A non-object parse result (JSON.parse("null") returns null without
// throwing) is treated as null too — fail-closed before any dereference.
function readMarker(markerFile) {
    try {
        const parsed = JSON.parse(readFileSync(markerFile, "utf8"));
        if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed))
            return null;
        return parsed;
    }
    catch {
        return null;
    }
}
// readAdapterKit: extract the materialized KIT="…" line from the grugops:materialized-kit
// sentinel block (source (c) of D-03). Split on "\n", track inblk between MAT_OPEN/MAT_CLOSE,
// capture the KIT= line, strip the quotes. Fail-closed: absent file / no KIT line → "".
function readAdapterKit(adapterFile) {
    let text;
    try {
        text = readFileSync(adapterFile, "utf8");
    }
    catch {
        return "";
    }
    let inblk = false;
    let line = "";
    for (const l of text.split("\n")) {
        if (l === MAT_OPEN) {
            inblk = true;
            continue;
        }
        if (l === MAT_CLOSE) {
            inblk = false;
            continue;
        }
        if (inblk && /^KIT=/.test(l))
            line = l;
    }
    if (line === "")
        return "";
    return line.replace(/^KIT="/, "").replace(/"$/, "");
}
// docAbspath: byte-parity twin of install.sh's abspath() — an absolute path is returned VERBATIM
// (no `.`/`..` collapsing, no trailing-slash trimming, unlike node:path resolve()); a relative
// path is prefixed with cwd. Used by the D-03 cross-check so a cosmetic-but-textually-different
// kitRoot classifies consistently (using resolve() here would over-normalize `…/agent-factory/.`
// to `…/agent-factory` and turn a WARN into a pass).
const docAbspath = (p) => (p.startsWith("/") ? p : `${toPosix(process.cwd())}/${p}`);
// kitReal: a path resolves to a REAL kit iff agent-factory/roles/orchestrator.md exists under it.
// Used by the D-03 cross-check to distinguish a cosmetic diff (all real) from a true divergence.
const kitReal = (p) => p !== "" && existsSync(join(p, "roles", "orchestrator.md"));
// isDangling: link present but its target is gone — mirror install.sh's [ -L ] && [ ! -e ]. lstat
// tests the link itself; existsSync follows it (false for a dangling link).
const isDangling = (p) => {
    try {
        return lstatSync(p).isSymbolicLink() && !existsSync(p);
    }
    catch {
        return false;
    }
};
// notInstalled: the distinct, greppable "not installed" line.
function notInstalled() {
    docReport("FAIL", `grugops not installed in ${TARGET} — run install.js (then install.js --check)`);
    console.log("\n1 FAILURE(S)");
}
// doctor: the INSTALL-05 verifier. Read-only by construction. Returns 0 on pass / WARN-only,
// nonzero on any FAIL (or WARN + --strict).
function doctor() {
    DOC_FAILS = 0;
    DOC_WARNS = 0;
    console.log("== grugops doctor (--check) ==");
    console.log(`home:   ${GRUGOPS_HOME}`);
    console.log(`kit:    ${KIT_ROOT}`);
    console.log(`target: ${TARGET}`);
    console.log("");
    const markerFile = join(TARGET, ".grugops", "install.json");
    // The adapter the D-03 cross-check reads source (c) from is DERIVED (KIT-02), never named. Take
    // the first derived target adapter that actually carries a materialized KIT= line; if none does,
    // fall back to the first derived destination so the FAIL message still names a concrete path.
    // Fail-closed is preserved: an absent file or a missing KIT line still reads as "" below.
    // `?? []` here is the doctor's EXISTING fail-closed posture made explicit, not a swallowed null:
    // an unreadable source adapter directory leaves no candidate, the fallback below still names a
    // concrete path, and the KIT= cross-check still reads as "" → FAIL. The doctor is a read-only
    // reporter with its own FAIL surface, so it does not also emit the install path's verify finding.
    const adapterCandidates = targetAdapterFiles() ?? [];
    const adapterFile = adapterCandidates.find((p) => readAdapterKit(p) !== "") ??
        adapterCandidates[0] ??
        join(TARGET, ".claude", "agents");
    // --- not-installed fold-into-FAIL (RESEARCH Discretion §5) --------------------------------
    // Absent/garbled marker = a dev/uninstalled checkout. Fail-closed BEFORE touching adapters:
    // print a distinct greppable "not installed" line and return nonzero. Never crash, never
    // false-green (ties to C3 — the dev checkout has agent-factory/ but no marker).
    const marker = readMarker(markerFile);
    if (!marker) {
        notInstalled();
        return 1;
    }
    // --- D-03 three-source kit-root cross-check ------------------------------------------------
    // (a) the freshly re-resolved rule, (b) the marker kitRoot, (c) the adapter KIT=. Normalize all
    // three via docAbspath (mirrors the sh abspath); all-equal → pass; differ-but-all-real-and-
    // cosmetic → WARN; any unresolvable or genuinely different real kits → FAIL (name all three).
    // Bias to FAIL when unsure.
    const a = KIT_ROOT;
    const b = marker.kitRoot ? String(marker.kitRoot) : "";
    const c = readAdapterKit(adapterFile);
    const na = docAbspath(a);
    const nb = b ? docAbspath(b) : "";
    const nc = c ? docAbspath(c) : "";
    if (na === nb && nb === nc) {
        docReport("ok", `kit-root sources agree (${na})`);
    }
    else if (kitReal(na) && kitReal(nb) && kitReal(nc)) {
        docWarn(`kit-root sources differ cosmetically: rule=${na} marker=${nb} adapter=${nc}`);
    }
    else {
        docFail(`kit-root sources DISAGREE (stale/moved install): rule=${na} marker=${nb || "<unset>"} adapter=${nc || "<unset>"}  (referenced by ${markerFile} + ${adapterFile})`);
    }
    // --- deterministic ordered first-failure stat set (D-02 / D-05) ----------------------------
    // Fixed order, most-load-bearing first. Kit refs resolve under KIT_ROOT; state refs resolve
    // repo-relative (Phase-7 classification). A dangling symlink is a FAIL with a symlink-specific
    // message. On the FIRST stat failure, name path + referencing file and STOP. Each entry is
    // [path, referencing-file].
    const refs = [
        [KIT_ROOT, markerFile],
        [join(KIT_ROOT, "roles", "orchestrator.md"), adapterFile],
        [join(KIT_ROOT, "roles", "_role-switch-protocol.md"), adapterFile],
        [join(KIT_ROOT, "workflows"), adapterFile],
        [join(TARGET, ".grugops", "factory.config.json"), adapterFile],
        [join(TARGET, "plans", "board.md"), adapterFile],
        // MIGR-02 (Phase 24): plans/handoffs/ is no longer seeded (the note-native trace replaced the
        // handoff relay), so the doctor must NOT require it — checking it here would FAIL every clean
        // install. Removed deliberately in lockstep with the seedState mkdir removal.
    ];
    if (DOC_FAILS === 0) {
        for (const [p, ref] of refs) {
            if (!p)
                continue;
            if (isDangling(p)) {
                docFail(`dangling symlink: ${p}  (referenced by ${ref})`);
                break;
            }
            if (!existsSync(p)) {
                docFail(`${p}  (referenced by ${ref})`);
                break;
            }
            docReport("ok", p);
        }
    }
    // --- WARN tier (D-06, detect-only per D-07): only when the cross-check + stats are clean -----
    if (DOC_FAILS === 0) {
        // kit-version skew: marker kitVersion vs the installed kit's VERSION (read head -n 1 the way
        // writeMarker reads it). Unequal → warn (no negotiation; SKEW-01 is v1.2).
        const mver = marker.kitVersion ? String(marker.kitVersion) : "";
        let kver = "";
        const verFile = join(KIT_ROOT, "VERSION");
        if (existsSync(verFile)) {
            try {
                kver = readFileSync(verFile, "utf8").split("\n")[0];
            }
            catch {
                kver = "";
            }
        }
        if (mver !== "" && kver !== "" && mver !== kver) {
            docWarn(`kit-version skew: marker=${mver} kit VERSION=${kver}`);
        }
        // missing optional seed: a seed file the user may have pruned (e.g. memory-bank/00-index.md).
        if (!existsSync(join(TARGET, "memory-bank", "00-index.md"))) {
            docWarn(`missing optional seed: ${join(TARGET, "memory-bank", "00-index.md")} (run install.js to re-seed)`);
        }
    }
    // --- exit-code matrix (SC2) ----------------------------------------------------------------
    console.log("");
    if (DOC_FAILS > 0) {
        console.log(`${DOC_FAILS} FAILURE(S)`);
        return 1;
    }
    if (DOC_WARNS > 0 && STRICT) {
        console.log(`${DOC_WARNS} WARNING(S) (--strict: promoted to failure)`);
        return 1;
    }
    if (DOC_WARNS > 0) {
        console.log(`ALL CHECKS PASSED (${DOC_WARNS} warning(s))`);
        return 0;
    }
    console.log("ALL CHECKS PASSED");
    return 0;
}
// --- Doctor early-exit (INSTALL-05) — the --check arm is a NON-MUTATING reader. It branches HERE,
// after GRUGOPS_HOME/KIT_ROOT and TARGET are resolved, but BEFORE the D-07 self-checkout guard's
// exit, the run banner, and every mutation (copyKit / materializeAdapter / seedState / writeMarker).
// So `--check` never writes, and it still runs on a dev/uninstalled checkout (folding the absent-
// marker case into a clean FAIL rather than tripping the self-checkout guard). ---
if (CHECK) {
    process.exit(doctor());
}
// --- --update branch (UPD-01, Plan 17-03) — wired EARLY: right after the doctor early-exit and
// BEFORE the D-07 self-checkout guard, because --update has NO target and only writes under
// $GRUGOPS_HOME (Pitfall 4 / A2). It must never reach the install run, the guard, or any target
// mutation — it prints a short banner, refreshes the kit home (kit-home-only, retain-backup,
// downgrade warn-then-proceed via updateKitHome()), prints a --check hint, and exits 0. The
// helper functions it calls (updateKitHome / copyKit) are hoisted declarations defined below. ---
if (UPDATE) {
    console.log("== grugops update (--update) ==");
    console.log(`source: ${GRUGOPS_SRC}`);
    console.log(`home:   ${GRUGOPS_HOME}`);
    console.log(`kit:    ${KIT_ROOT}`);
    if (DRY_RUN)
        console.log("mode:   DRY_RUN (no filesystem changes)");
    console.log("\n-- kit refresh (kit-home-only; per-repo state untouched) --");
    updateKitHome();
    console.log("\n  Run `node install/install.js --check --target <repo>` to verify a repo against the refreshed kit.");
    console.log(`\n== update complete${DRY_RUN ? " (DRY_RUN — nothing changed)" : ""} ==`);
    process.exit(0);
}
// --- --prune-old-kit branch (D-10, Plan 17-03) — the SINGLE, opt-in deletion path. Wired EARLY
// (alongside --update, before the self-checkout guard) because it only deletes grugops-owned
// backups in the two known roots and never mutates the live kit or any user content. It prints a
// banner, runs pruneOldKit() (tight name-shape + isProtected guard, DRY_RUN-safe), and exits 0.
// Pruning is reachable ONLY here — it never runs on the default install path (never-delete-first). ---
if (PRUNE_OLD_KIT) {
    console.log("== grugops prune (--prune-old-kit) ==");
    console.log(`home:   ${GRUGOPS_HOME}`);
    console.log(`target: ${TARGET}`);
    if (DRY_RUN)
        console.log("mode:   DRY_RUN (no filesystem changes)");
    console.log("\n-- removing grugops backups (only the timestamped .bak.<ISO> migrate/update leave) --");
    pruneOldKit();
    console.log(`\n== prune complete${DRY_RUN ? " (DRY_RUN — nothing changed)" : ""} ==`);
    process.exit(0);
}
// --- D-07 self-checkout guard (ALWAYS-ON): runs unconditionally after TARGET resolution, before
// any write, independent of TTY / --yes (Pitfall 3). Refuse when EITHER resolved TARGET ==
// resolved GRUGOPS_SRC, OR the target carries grugops SOURCE markers (install/install.sh AND
// agent-factory/VERSION both present). --allow-self / --force overrides. ---
if (!ALLOW_SELF) {
    const looksLikeSource = TARGET === toPosix(GRUGOPS_SRC) ||
        (existsSync(join(TARGET, "install", "install.sh")) &&
            existsSync(join(TARGET, "agent-factory", "VERSION")));
    if (looksLikeSource) {
        process.stderr.write("refusing: target looks like the grugops source checkout — you probably meant --target <your-repo>. Pass --allow-self to override.\n");
        process.exit(1);
    }
}
// KIT-02 / D-18: the hand-listed SKILLS array and the single AGENT_REL adapter constant used to
// live here. Both are deleted — the adapter and skill sets are now derived at run time from
// $GRUGOPS_SRC by srcSkillNames() / srcAdapterFiles() above, so the installer carries no adapter
// or skill name literal and needs no edit when the kit grows a new adapter.
// CLAUDE.md sentinel block — byte-identical to uninstall.ts (GSD:grugops-start-here).
const CLAUDE_OPEN = "<!-- GSD:grugops-start-here -->";
const CLAUDE_PTR = "**grugops — start here:** read `AGENTS.md`, then `agent-factory/roles/orchestrator.md`, and act as the Orchestrator.";
const CLAUDE_CLOSE = "<!-- GSD:grugops-start-here-end -->";
// WR-05: the Copilot block has its OWN distinct sentinel (not the CLAUDE.md one), so the two
// blocks are removed independently by uninstall.ts — must match it exactly.
const COPILOT_REL = ".github/copilot-instructions.md";
const COPILOT_OPEN = "<!-- GSD:grugops-copilot-start-here -->";
const COPILOT_PTR = "grugops: read `AGENTS.md`, then `agent-factory/roles/orchestrator.md`, and act as the Orchestrator.";
const COPILOT_CLOSE = "<!-- GSD:grugops-copilot-start-here-end -->";
const isSymlink = (p) => {
    try {
        return lstatSync(p).isSymbolicLink();
    }
    catch {
        return false;
    }
};
// ---------------------------------------------------------------------------
// Phase-17 Wave-0 shared backup primitives (Plan 17-01, MIGR-01 / UPD-01).
// Single-source so Plans 02 (--migrate) and 03 (--update) do not each invent their own
// timestamp/backup logic (which would drift). Clear professional voice on every report
// string (safety surface — D-13: these run as `node install/install.js --migrate|--update`).
// ---------------------------------------------------------------------------
// dirsSameContent: recursive byte-equality of two directory trees. Compares the sorted set of
// relative file paths and each file's bytes (via sameContent). FAIL-SAFE-TO-DIFFERS: any read
// error, missing tree, or set mismatch returns false, so a true no-op (D-09 "no backup when
// identical") is declared ONLY when the two trees are provably identical. Symlinks are treated as
// differing (lstat is a file, not a regular file) — a conservative bias toward keeping a backup.
function dirsSameContent(a, b) {
    const rel = (root, base) => {
        const out = [];
        let ents;
        try {
            ents = readdirSync(join(root, base), { withFileTypes: true });
        }
        catch {
            return out;
        }
        for (const ent of ents) {
            const r = base ? `${base}/${ent.name}` : ent.name;
            if (ent.isDirectory())
                out.push(...rel(root, r));
            else if (ent.isFile())
                out.push(r);
            // PRINTABLE impossible-path sentinel (27-13; closes deferred-items D1 / review IN-01). This
            // value used to be a literal NUL byte. It forced the mismatch correctly, but it also made
            // every byte-oriented tool classify install.ts as BINARY and suppress its output, silently
            // disabling grep-based verification over the installer. The replacement preserves the
            // guarantee without the byte: `<` and `>` are illegal in a Windows path element, and the
            // trailing `/` makes join(root, sentinel) unreadable as a file on POSIX (ENOENT if absent,
            // EISDIR if a directory, ENOTDIR if a file), so even when BOTH trees yield the sentinel the
            // sameContent() compare below still fails and `identical` is never declared. VALUE ONLY —
            // the comparison itself is a load-bearing fail-safe and is deliberately NOT redesigned.
            else
                return ["<<grugops:dirs-differ>>/"]; // symlink/special → force a mismatch (fail-safe-to-differs)
        }
        return out;
    };
    try {
        if (!existsSync(a) || !existsSync(b))
            return false;
        const la = rel(a, "").sort();
        const lb = rel(b, "").sort();
        if (la.length !== lb.length)
            return false;
        for (let i = 0; i < la.length; i++) {
            if (la[i] !== lb[i])
                return false;
            if (!sameContent(join(a, la[i]), join(b, lb[i])))
                return false;
        }
        return true;
    }
    catch {
        return false; // fail-safe-to-differs: never declare identical on an error
    }
}
// backupIfDiffers: the single rename-to-backup primitive (never-delete-first). If `target` does
// not exist there is nothing to back up → return false. If `target` is byte-identical to
// `replacement` (file: sameContent; dir: dirsSameContent), this is a true no-op (D-09) → report
// `skipped (identical — no backup, D-09)` and return false (NO artifact created). Otherwise rename
// `target` aside to `${target}.bak.<ISO>` (filesystem-safe via isoStamp) and report `backed-up`,
// returning true. DRY_RUN mutates nothing and reports a `would-backup` line. Returns true iff a
// backup was (or would be) made.
function backupIfDiffers(target, replacement, label) {
    if (!existsSync(target))
        return false;
    let identical = false;
    try {
        identical = lstatSync(target).isDirectory()
            ? dirsSameContent(target, replacement)
            : sameContent(target, replacement);
    }
    catch {
        identical = false; // fail-safe-to-differs
    }
    if (identical) {
        report("skipped", `${label} (identical — no backup, D-09)`);
        return false;
    }
    const backup = `${target}.bak.${isoStamp()}`;
    if (DRY_RUN) {
        report("would-backup", `${label} → ${backup}`);
        return true;
    }
    renameSync(target, backup);
    report("backed-up", `${label} → ${backup}`);
    return true;
}
// backupDir: the Phase-24 MIGR-04 handoffs-backup primitive — a thinner sibling of backupIfDiffers
// with NO `replacement` argument (D-19: --migrate NEVER parses or converts legacy handoff content;
// it only relocates the directory, preserving the originals for the human). Never-delete-first
// (D-18): the directory is RENAMED aside to `${target}.bak.<isoStamp()>`, never removed. The backup
// name reuses isoStamp() so it matches the anchored GRUGOPS_BACKUP_SUFFIX shape (--prune-old-kit can
// later sweep it). Safety contract:
//   - absent target  → "nothing to migrate" clean no-op, returns false (idempotent, D-20: a second
//                       run after the dir is already backed up changes nothing).
//   - backup-name collision (the `.bak.<ISO>` already exists) → ABORT: print a clear professional-
//     voice message naming the collision and leave the ORIGINAL untouched, never overwriting the
//     existing backup (D-18 never-clobber). Returns false; the original is preserved verbatim.
//   - DRY_RUN → print a `would-backup` line and mutate NOTHING (D-20). Returns true (a backup WOULD
//     have been made), so the caller can report intent.
//   - otherwise → renameSync the dir aside and report `backed-up`. Returns true.
// Clear professional voice on every string (installer safety surface — CLAUDE.md hard constraint).
function backupDir(target, label) {
    if (!existsSync(target)) {
        report("ok", `${label} (nothing to migrate — no ${target})`);
        return false;
    }
    const backup = `${target}.bak.${isoStamp()}`;
    if (existsSync(backup)) {
        // Never-clobber (D-18): a backup of this exact name already exists. Abort this step, leave the
        // original in place untouched, and tell the human plainly. (isoStamp millisecond precision makes
        // a routine collision unlikely; this abort is the safety floor, not the common path.)
        report("aborted", `${label}: a backup named ${backup} already exists — leaving ${target} untouched to avoid overwriting it. ` +
            `Move or remove the existing backup, then re-run --migrate.`);
        return false;
    }
    if (DRY_RUN) {
        report("would-backup", `${label} → ${backup}`);
        return true;
    }
    renameSync(target, backup);
    report("backed-up", `${label} → ${backup}`);
    return true;
}
// migrateHandoffs: the Phase-24 MIGR-04 step folded INTO the existing --migrate orchestration (D-17:
// EXTEND, never a colliding new flag). Backs up a user's runtime-accumulated plans/handoffs/ — the
// old relay's directory — to plans/handoffs.bak.<ISO> via backupDir (never-delete-first, abort on
// collision, no content conversion, DRY_RUN/idempotent). Called on EVERY --migrate path (both the
// already-two-root isMigrated arm AND the old-layout path) because a user can have accumulated
// plans/handoffs/ regardless of layout state (D-17 reconcile).
function migrateHandoffs() {
    backupDir(join(TARGET, "plans", "handoffs"), "plans/handoffs/");
}
// ---------------------------------------------------------------------------
// Phase-17 Plan 03 — `--prune-old-kit` (D-10): the SINGLE, opt-in deletion path. It removes ONLY
// grugops-created timestamped backups (the ones --migrate and --update leave behind) and NEVER
// runs on the default install path (never-delete-first). Every string is CLEAR PROFESSIONAL VOICE
// (safety surface; this runs as `node install/install.js --prune-old-kit`).
// ---------------------------------------------------------------------------
// isPruneProtected: mirror uninstall.ts's isProtected() denylist (uninstall.ts:110-119) so prune
// can NEVER touch the live kit, the seeded state, or any user-owned tree — even if a backup-shaped
// name somehow appeared under one. agent-factory/, plans/, .planning/, .grugops/, docs/, src/ (and
// the root itself) are off-limits, always. Checked against $TARGET; the kit-home prune only ever
// considers `agent-factory.bak.<ISO>` siblings of the live kit, never the live `agent-factory/`.
function isPruneProtected(p) {
    const protectedDirs = ["agent-factory", "plans", ".planning", ".grugops", "docs", "src"];
    for (const d of protectedDirs) {
        const base = `${TARGET}/${d}`;
        if (p === base || p.startsWith(`${base}/`))
            return true;
    }
    if (p === TARGET || p === `${TARGET}/`)
        return true;
    return false;
}
// removeBackup: remove ONE grugops backup, but only after the name-shape AND the isProtected guard
// both pass. The shape was already matched by the caller; this re-checks the guard as a last gate
// before any rmSync (defense-in-depth — the deletion surface gets two independent checks). DRY_RUN
// narrates a `would-remove` line and deletes nothing.
function removeBackup(path, name) {
    if (isPruneProtected(path)) {
        report("skipped", `${name} (protected path — never pruned)`);
        return;
    }
    if (DRY_RUN) {
        report("would-remove", path);
        return;
    }
    rmSync(path, { recursive: true, force: true });
    report("removed", path);
}
// pruneOldKit: the ONLY deletion path (D-10). Glob BOTH roots for the grugops backup name-shape and
// remove each match (guarded). Under $TARGET: `agent-factory.bak.<ISO>` (the displaced in-repo kit)
// and `factory.config.json.bak.<ISO>` (the original config migrate leaves at the repo root). Under
// $GRUGOPS_HOME: `agent-factory.bak.<ISO>` (the displaced kit --update retains). NOTHING that does
// not match GRUGOPS_BACKUP_SUFFIX is ever considered (a user `mine.bak` is invisible to prune).
// Reachable ONLY from the --prune-old-kit branch — it never runs on the default install path.
function pruneOldKit() {
    const roots = [
        [TARGET, "target"],
        [GRUGOPS_HOME, "kit home"],
    ];
    let pruned = 0;
    for (const [root, label] of roots) {
        let entries;
        try {
            entries = readdirSync(root);
        }
        catch {
            continue; // an absent root has nothing to prune
        }
        for (const name of entries.sort()) {
            if (!GRUGOPS_BACKUP_SUFFIX.test(name))
                continue; // not a grugops backup → never touched
            removeBackup(join(root, name), `${label}: ${name}`);
            pruned += 1;
        }
    }
    if (pruned === 0) {
        report("ok", "no grugops backups found to prune (nothing to do)");
    }
}
function detectOldLayout() {
    const hasInRepoKit = existsSync(join(TARGET, "agent-factory", "roles", "orchestrator.md"));
    const marker = readMarker(join(TARGET, ".grugops", "install.json"));
    // KIT-02: probe the DERIVED adapter set rather than one hand-named file — the target counts as
    // materialized when ANY derived adapter carries a KIT= line. Fail-closed posture is unchanged: an
    // absent file, a missing KIT line, or an empty derived set all read as not-materialized.
    // `?? []` preserves the fail-closed posture stated directly above: an unreadable source, an absent
    // file, a missing KIT line and an empty derived set all read as NOT materialized.
    const adapterMaterialized = (targetAdapterFiles() ?? []).some((p) => readAdapterKit(p) !== "");
    return {
        isOldLayout: hasInRepoKit && marker === null && !adapterMaterialized,
        isMigrated: marker !== null,
        isClean: !hasInRepoKit && marker === null,
        leftoverKit: hasInRepoKit,
    };
}
// migratePreSteps: the one-time relocation safety work, run ONLY when isOldLayout. After it the
// install run proceeds verbatim (D-02). Three steps, all never-delete-first and DRY_RUN-safe:
//   1. Carry the user's edited config forward. BOTH legacy locations are checked (the v1.0 in-repo
//      agent-factory/config/factory.config.json AND the repo-root factory.config.json — the planner
//      resolved the CONTEXT/history discrepancy by HANDLING BOTH, D-04). For whichever exists, COPY
//      it to .grugops/factory.config.json only if that seeded target does not already exist
//      (never-overwrite seeded state, D-04), then rename the original aside to `${original}.bak.<ISO>`.
//   2. Back up the displaced in-repo agent-factory/ via backupIfDiffers (timestamped, differs-only,
//      D-08/D-09). The in-repo kit is NOT at KIT_ROOT, so copyKit's retainBackup does not cover it.
//   3. LANDMINE (Pitfall 1): unlink any resolver-adapter dest that is a live SYMLINK BEFORE the
//      install run re-materializes it — never writeFileSync THROUGH a symlink into the source clone.
function migratePreSteps() {
    // 1. config-move (BOTH legacy locations, D-04).
    const seededConfig = join(TARGET, ".grugops", "factory.config.json");
    const legacyConfigs = [
        join(TARGET, "factory.config.json"),
        join(TARGET, "agent-factory", "config", "factory.config.json"),
    ];
    for (const legacy of legacyConfigs) {
        if (!existsSync(legacy))
            continue;
        if (DRY_RUN) {
            report("would-move", `user config ${legacy} → ${seededConfig} (original left as .bak)`);
            continue;
        }
        // COPY forward to the seeded .grugops/ location only if absent (never-overwrite seeded state).
        if (!existsSync(seededConfig)) {
            mkdirp(dirname(seededConfig));
            copyFileSync(legacy, seededConfig);
            report("moved", `user config → ${seededConfig} (carried forward, D-04)`);
        }
        else {
            report("skipped", `user config (.grugops/factory.config.json already present — kept, D-04)`);
        }
        // Leave the original in place renamed to a timestamped .bak (never deleted, D-04).
        const bak = `${legacy}.bak.${isoStamp()}`;
        renameSync(legacy, bak);
        report("backed-up", `original config → ${bak}`);
    }
    // 2. back up the displaced in-repo agent-factory/ (timestamped, differs-only — D-08/D-09).
    backupIfDiffers(join(TARGET, "agent-factory"), join(GRUGOPS_SRC, "agent-factory"), "in-repo agent-factory/");
    // 3. LANDMINE (Pitfall 1): unlink any SYMLINK resolver-adapter dest before re-materialize.
    // KIT-02: the membership of this list is DERIVED — every adapter destination, plus every derived
    // skill destination whose source body carries the resolver slot. The behaviour is unchanged (never
    // write through a live symlink; report would-unlink under DRY_RUN); only the set is derived, so all
    // seventeen destinations get the same protection the two hand-named ones had (T-27-07).
    //
    // FAIL-LOUD (27-13): an unreadable source directory here means the unlink pre-step cannot know
    // which destinations to protect. That is REPORTED rather than silently degrading into a
    // zero-iteration loop, because the very next step writes through whatever symlinks it missed.
    const migrateAdapterDests = targetAdapterFiles();
    const migrateSkillNames = srcSkillNames();
    if (migrateAdapterDests === null || migrateSkillNames === null) {
        verify(`symlink pre-step — cannot read ${join(GRUGOPS_SRC, ".claude")}, so the resolver-adapter ` +
            `destination set is unknown. No symlink destination was unlinked. Re-run the installer from ` +
            `a complete kit checkout before continuing.`);
    }
    const adapterDests = [
        ...(migrateAdapterDests ?? []),
        ...(migrateSkillNames ?? [])
            .filter((s) => srcCarriesSlot(join(GRUGOPS_SRC, ".claude", "skills", s, "SKILL.md")))
            .map((s) => join(TARGET, ".claude", "skills", s, "SKILL.md")),
    ];
    for (const dest of adapterDests) {
        if (!isSymlink(dest))
            continue;
        if (DRY_RUN) {
            report("would-unlink", `symlink adapter ${dest} (never write through a live symlink — Pitfall 1)`);
            continue;
        }
        rmSync(dest, { force: true });
        report("unlinked", `symlink adapter ${dest} (re-materialized as a real file — Pitfall 1)`);
    }
}
// ensure_block: idempotent sentinel-delimited append to a user file. Never overwrites; skips
// if the open sentinel is already present; creates the file if absent. Never `>`-truncates.
function ensureBlock(file, open, body, close, label) {
    if (existsSync(file) && readFileSync(file, "utf8").includes(open)) {
        report("skipped", `${label} (sentinel already present)`);
        return;
    }
    if (DRY_RUN) {
        report("would-add", label);
        return;
    }
    mkdirp(dirname(file));
    if (!existsSync(file))
        writeFileSync(file, "");
    appendFileSync(file, `\n${open}\n${body}\n${close}\n`);
    report("created", label);
}
// link_or_copy: D-30 symlink-with-copy-fallback, idempotent. Never clobbers a non-grugops
// user file (destinations are all grugops-owned paths).
function linkOrCopy(src, dest, label) {
    if (!existsSync(src)) {
        report("skipped", `${label} (source missing: ${src})`);
        return;
    }
    if (isSymlink(dest)) {
        report("skipped", `${label} (symlink present)`);
        return;
    }
    if (existsSync(dest) && sameContent(src, dest)) {
        report("skipped", `${label} (identical copy present)`);
        return;
    }
    if (DRY_RUN) {
        report(INSTALL_MODE === "copy" ? "would-copy" : "would-link", label);
        return;
    }
    mkdirp(dirname(dest));
    if (INSTALL_MODE !== "copy") {
        try {
            symlinkSync(src, dest);
            if (isSymlink(dest)) {
                report("linked", label);
                return;
            }
        }
        catch {
            // fall through to copy
        }
    }
    copyFileSync(src, dest);
    report("copied(verify)", label);
}
// merge_gemini: additive read-modify-write of .gemini/settings.json context.fileName. Node can
// safely JSON.parse/merge. Never `>`-clobbers a user's file blindly: a parse failure leaves the
// file untouched and flags verify.
function mergeGemini() {
    const file = join(TARGET, ".gemini", "settings.json");
    const want = "AGENTS.md";
    if (!existsSync(file)) {
        if (DRY_RUN) {
            report("would-add", ".gemini/settings.json (context.fileName: [AGENTS.md, GEMINI.md])");
            return;
        }
        mkdirp(join(TARGET, ".gemini"));
        writeFileSync(file, JSON.stringify({ context: { fileName: ["AGENTS.md", "GEMINI.md"] } }, null, 2) + "\n");
        report("created", ".gemini/settings.json (context.fileName wiring)");
        return;
    }
    let json;
    try {
        json = JSON.parse(readFileSync(file, "utf8"));
    }
    catch {
        report("verify", ".gemini/settings.json is not valid JSON — left untouched; add AGENTS.md to context.fileName manually");
        return;
    }
    json.context = json.context || {};
    const list = Array.isArray(json.context.fileName)
        ? json.context.fileName
        : json.context.fileName
            ? [json.context.fileName]
            : [];
    if (list.includes(want)) {
        report("skipped", ".gemini/settings.json (context.fileName already lists AGENTS.md)");
        return;
    }
    list.push(want);
    json.context.fileName = list;
    if (DRY_RUN) {
        report("would-add", ".gemini/settings.json (merge AGENTS.md into context.fileName)");
        return;
    }
    writeFileSync(file, JSON.stringify(json, null, 2) + "\n");
    report("created", ".gemini/settings.json (merged AGENTS.md into context.fileName)");
}
function detectTools() {
    const found = [];
    if (existsSync(join(TARGET, ".claude")))
        found.push("claude");
    if (existsSync(join(TARGET, ".codex")))
        found.push("codex");
    if (existsSync(join(TARGET, ".gemini")))
        found.push("gemini");
    if (existsSync(join(TARGET, "opencode.json")))
        found.push("opencode");
    if (existsSync(join(TARGET, ".github")))
        found.push("copilot");
    return found.length ? found.join(" ") : "none-detected";
}
// copyKit: atomic install of the read-only kit to $GRUGOPS_HOME (INSTALL-04, D-05). Always
// re-copy from the running checkout (no version negotiation).
//
// WR-02 (true atomicity): build the new kit in a temp dir, move any existing kit ASIDE, then a
// single atomic rename puts the new kit in place; the old copy is handled afterward. There is no
// window in which KIT_ROOT is absent. DRY_RUN mutates nothing.
//
// retainBackup (Plan 17-01, D-06/D-02): when false (the default — the install path) the displaced
// kit is removed after the swap, exactly as before (regression-safe: the default path is
// behaviorally unchanged). When true (the --update path, Plan 03) the displaced kit is KEPT as a
// timestamped backup INSTEAD of being deleted — but only if it actually DIFFERS from the freshly
// staged kit (D-09 differs-only no-op: a byte-identical re-copy leaves no backup artifact). This
// is single-source — the retain path reuses dirsSameContent + isoStamp, it does not fork.
function copyKit(retainBackup = false) {
    if (DRY_RUN) {
        report("would-copy", `kit → ${KIT_ROOT}`);
        return;
    }
    mkdirp(GRUGOPS_HOME);
    const tmp = `${GRUGOPS_HOME}/.agent-factory.tmp.${process.pid}`;
    const old = `${KIT_ROOT}.old.${process.pid}`;
    rmSync(tmp, { recursive: true, force: true });
    cpSync(join(GRUGOPS_SRC, "agent-factory"), tmp, { recursive: true });
    // Move the existing kit aside (if any), put the new kit in place via a single atomic rename,
    // then handle the old copy. A concurrent reader sees either the old kit or the new — never an
    // absent one (true atomicity preserved on both the default and retain paths).
    const hadOld = existsSync(KIT_ROOT);
    if (hadOld)
        renameSync(KIT_ROOT, old);
    renameSync(tmp, KIT_ROOT);
    if (hadOld && retainBackup && !dirsSameContent(old, KIT_ROOT)) {
        // --update: keep the displaced kit as a timestamped backup (never-delete-first), but ONLY
        // when it differs from the freshly staged kit (D-09). KIT_ROOT is now the NEW kit, so the
        // comparison is displaced-old vs new.
        const backup = `${KIT_ROOT}.bak.${isoStamp()}`;
        renameSync(old, backup);
        report("backed-up", `kit → ${backup}`);
    }
    else {
        // Default install path (retainBackup=false), a byte-identical retain (D-09 no-op), or no prior
        // kit: remove the displaced copy exactly as before.
        rmSync(old, { recursive: true, force: true });
    }
    report("copied", `kit → ${KIT_ROOT}`);
}
// materializeAdapter: lay an adapter down from $GRUGOPS_SRC and inject the resolved KIT line
// above the slot, stripping any prior grugops:materialized-kit block first (strip-then-inject,
// content-idempotent — Pitfall 1). Preserves the blockquote (SC2) and self-heal line (gate
// Assertion 3).
function materializeAdapter(src, dest, label) {
    if (!existsSync(src)) {
        report("skipped", `${label} (source missing: ${src})`);
        return;
    }
    if (DRY_RUN) {
        report("would-materialize", `${label} (KIT=${KIT_ROOT})`);
        return;
    }
    mkdirp(dirname(dest));
    const lines = readFileSync(src, "utf8").split("\n");
    const out = [];
    let inblk = false;
    // CR-01 (bounded removal): an UNTERMINATED prior block (close marker missing) must NOT swallow
    // every following line. Buffer the block and only drop it once a matching close is seen; if
    // still inblk at EOF, the block never closed, so restore the buffered lines verbatim (lose
    // nothing).
    let buf = [];
    for (const line of lines) {
        if (line === MAT_OPEN) {
            inblk = true;
            buf = [];
            continue;
        }
        if (inblk) {
            if (line === MAT_CLOSE) {
                inblk = false; // terminated block → drop the buffer
            }
            else {
                buf.push(line); // buffer until we know it terminates
            }
            continue;
        }
        if (line === MAT_SLOT) {
            out.push(MAT_OPEN);
            out.push(`KIT="${KIT_ROOT}"`);
            out.push(MAT_CLOSE);
            out.push(line);
            continue;
        }
        out.push(line);
    }
    // Unterminated open at EOF: the block never closed → restore what we buffered (lose nothing).
    if (inblk && buf.length > 0) {
        for (const line of buf)
            out.push(line);
    }
    writeFileSync(dest, out.join("\n"));
    report("materialized", `${label} (KIT=${KIT_ROOT})`);
}
// seedFile: copy ONE bundled seed file into the target, skip-if-exists (D-04).
function seedFile(src, dest, label) {
    if (existsSync(dest)) {
        report("skipped", `${label} (target already has it — D-04)`);
        return;
    }
    if (DRY_RUN) {
        report("would-add", label);
        return;
    }
    mkdirp(dirname(dest));
    copyFileSync(src, dest);
    report("created", label);
}
// listSeedFiles: every file under the seed subtree, relative + sorted (LC_ALL=C byte order) to
// match the sh `find … | LC_ALL=C sort` walk for identical report ordering.
function listSeedFiles(root, base = "") {
    const out = [];
    for (const ent of readdirSync(join(root, base), { withFileTypes: true })) {
        const rel = base ? `${base}/${ent.name}` : ent.name;
        if (ent.isDirectory())
            out.push(...listSeedFiles(root, rel));
        else if (ent.isFile())
            out.push(rel);
    }
    return out.sort();
}
// seedState: seed the full per-repo state plane from $KIT_ROOT/seed/** into $TARGET, per-file
// skip-if-exists (INSTALL-04, D-01/D-04). DRY_RUN mutates nothing. MIGR-02 (Phase 24): the old
// relay's plans/handoffs/ runtime dir is NO LONGER created — the note-native trace replaces the
// handoff relay, so fresh installs leave plans/handoffs/ absent (a user's accumulated dir is
// backed up by --migrate, never recreated here).
function seedState() {
    const seed = join(KIT_ROOT, "seed");
    if (!existsSync(seed)) {
        report("skipped", `state seed (no seed subtree at ${seed})`);
        return;
    }
    for (const rel of listSeedFiles(seed)) {
        seedFile(join(seed, rel), join(TARGET, rel), rel);
    }
    // MIGR-02 (Phase 24): the old relay's runtime plans/handoffs/ dir is no longer seeded. The
    // clean note-native trace replaces the handoff relay, so a fresh install must NOT recreate the
    // dir — the former handoffs-mkdir block is removed deliberately (not an omission). Existing
    // users who accumulated plans/handoffs/ under the old relay back it up via `--migrate` (D-17).
}
// materializeRunnable (D-11 — the kit-shipped-runnable convention): copy the compiled
// reference routine .js from the running kit checkout into the host's COMMITTED, namespaced
// path tools/grugops/ under $TARGET. This is the generic mechanism Phase 16's cross-platform
// test-integrity checker reuses (16-PRE-DECISIONS.md) — the reference routine is merely the
// FIRST materialized runnable; later checkers materialize the same way. The host then runs
// `node tools/grugops/<routine>.js <args>` with ONLY Node present (no ~/.grugops, no npm,
// no node_modules), which is exactly why a single committed .js — not the whole kit — is copied.
//
// Path choice (RESEARCH Open Q2 / D-11, RESOLVED): tools/grugops/ — committed, namespaced, not
// gitignore-adjacent like .grugops/ state, not colliding with a project's build bin/. The
// materialized file lands at a path the host's CI sees on a bare checkout (Pitfall 5).
//
// Shape (mirrors seedFile, additive/idempotent/never-overwrite — T-15-05-Tamper): skip if the
// source is missing; skip-if-identical (a re-run is a no-op); NEVER `>`-truncate an existing host
// file (a user-edited materialized routine is preserved verbatim); honor DRY_RUN (report only, no
// write). It writes ONLY under tools/grugops/ — it never touches a protected dir and never sets
// the deploy-approval var (T-15-05-EoP). Report strings are CLEAR PROFESSIONAL VOICE.
//
// RUNNABLES: each entry is [source-relative-to-GRUGOPS_SRC, dest-relative-to-TARGET]. The
// reference routine is the only kit-shipped runnable today; Phase 16's checker appends here.
const RUNNABLES = [
    ["scripts/runnable-ref/reference-check.js", "tools/grugops/reference-check.js"],
    ["scripts/runnable-ref/test-skip-integrity.js", "tools/grugops/test-skip-integrity.js"],
];
function materializeRunnable() {
    for (const [srcRel, destRel] of RUNNABLES) {
        const src = join(GRUGOPS_SRC, srcRel);
        const dest = join(TARGET, destRel);
        if (!existsSync(src)) {
            report("skipped", `${destRel} (source missing: ${src})`);
            continue;
        }
        // never-overwrite (T-15-05-Tamper): an existing host file is left untouched. If it is
        // byte-identical the re-run is a clean no-op; if a user edited it, it is preserved verbatim.
        if (existsSync(dest)) {
            report("skipped", sameContent(src, dest)
                ? `${destRel} (target already has it — D-04)`
                : `${destRel} (target has a different copy — left untouched, never-overwrite)`);
            continue;
        }
        if (DRY_RUN) {
            report("would-add", destRel);
            continue;
        }
        mkdirp(dirname(dest));
        copyFileSync(src, dest);
        report("created", destRel);
    }
}
// writeMarker: write .grugops/install.json. Exactly four stable fields in fixed order; the
// install-time timestamp is deliberately OMITTED (RESOLVED Q1, Option b) — overwrite
// unconditionally, idempotent.
function writeMarker() {
    let ver = "";
    if (existsSync(join(KIT_ROOT, "VERSION"))) {
        ver = readFileSync(join(KIT_ROOT, "VERSION"), "utf8").split("\n")[0];
    }
    else if (existsSync(join(GRUGOPS_SRC, "agent-factory", "VERSION"))) {
        ver = readFileSync(join(GRUGOPS_SRC, "agent-factory", "VERSION"), "utf8").split("\n")[0];
    }
    if (DRY_RUN) {
        report("would-add", ".grugops/install.json (marker)");
        return;
    }
    mkdirp(join(TARGET, ".grugops"));
    const marker = {
        kitVersion: ver,
        grugopsHome: GRUGOPS_HOME,
        kitRoot: KIT_ROOT,
        installMode: INSTALL_MODE,
    };
    writeFileSync(join(TARGET, ".grugops", "install.json"), JSON.stringify(marker, null, 2) + "\n");
    report("created", ".grugops/install.json (marker)");
}
// ---------------------------------------------------------------------------
// Phase-17 Plan 03 — `--update` (UPD-01, D-05/D-06/D-07) + `--prune-old-kit` (D-10).
//
// `--update` refreshes the central $GRUGOPS_HOME kit IN PLACE and is KIT-HOME-ONLY (D-05): it never
// touches a repo's per-repo state (no --target write, no seedState / no materializeAdapter / no
// marker). It is single-source — it is copyKit(retainBackup=true), so the displaced kit is retained
// as a timestamped backup when it DIFFERS (D-06) and is a true no-op when identical (D-09). On a
// downgrade (the running checkout VERSION is older than the installed kit VERSION) it warns in clear
// voice naming BOTH versions, then PROCEEDS (no refusal/negotiation — D-07; SKEW-01 deferred). Every
// string is CLEAR PROFESSIONAL VOICE (safety surface; this runs as `node install/install.js --update`).
// ---------------------------------------------------------------------------
// readKitVersion: head -n 1 of a kit's VERSION file, the way writeMarker/doctor read it. Returns
// "" on an absent/unreadable file (fail-closed — an absent VERSION simply yields no version delta).
function readKitVersion(verFile) {
    if (!existsSync(verFile))
        return "";
    try {
        return readFileSync(verFile, "utf8").split("\n")[0].trim();
    }
    catch {
        return "";
    }
}
// isDowngrade: true ONLY when both versions parse as dotted numeric SemVer-ish triples AND the
// source (running checkout) is strictly numerically older than the installed kit. Conservative:
// any unparseable version, a pre-release/build suffix that does not parse, or equal versions →
// false (we do not warn-on-downgrade when we cannot prove a downgrade — D-07 SKEW-01 deferred).
function isDowngrade(installed, source) {
    const parse = (v) => {
        const core = v.split(/[-+]/, 1)[0]; // drop any -prerelease / +build suffix
        const parts = core.split(".");
        if (parts.length === 0)
            return null;
        const nums = [];
        for (const p of parts) {
            if (!/^\d+$/.test(p))
                return null;
            nums.push(Number(p));
        }
        return nums;
    };
    const a = parse(installed);
    const b = parse(source);
    if (!a || !b)
        return false;
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i++) {
        const ai = a[i] ?? 0;
        const bi = b[i] ?? 0;
        if (bi < ai)
            return true; // source older at the first differing component → downgrade
        if (bi > ai)
            return false; // source newer → not a downgrade
    }
    return false; // equal → not a downgrade
}
// updateKitHome: the kit-home-only refresh (D-05). Read the installed kit VERSION and the running
// source VERSION; on a proven downgrade warn (clear voice, naming both), then PROCEED. Then
// copyKit(true) — the retain path keeps the displaced kit as a timestamped backup when it differs
// (D-06) and is a no-op when identical (D-09). NOTHING else: no target write, no seed, no adapter,
// no marker. DRY_RUN-safe (copyKit short-circuits; the downgrade warning still prints the plan).
function updateKitHome() {
    const installedVer = readKitVersion(join(KIT_ROOT, "VERSION"));
    const sourceVer = readKitVersion(join(GRUGOPS_SRC, "agent-factory", "VERSION"));
    if (installedVer !== "" && sourceVer !== "" && isDowngrade(installedVer, sourceVer)) {
        report("warning", `the running checkout (${sourceVer}) is OLDER than the installed kit (${installedVer}). ` +
            `Proceeding to refresh the kit to ${sourceVer} — the displaced kit is retained as a timestamped backup ` +
            `(remove it later with --prune-old-kit).`);
    }
    copyKit(true);
}
// --- --migrate branch (MIGR-01, Plan 17-02) --------------------------------------------------
// Placed AFTER the always-on D-07 self-checkout guard and the doctor early-exit, BEFORE the run
// banner + the `-- kit --` block, so migrate operates on a real user repo and keeps the guard
// (Pitfall 4). It is pure orchestration around the unchanged install run (D-02): it never forks the
// copyKit→materializeAdapter→seedState→writeMarker sequence below.
//   - isMigrated → already two-root. Do NOT re-run install (D-12 no re-mutate). If a leftover
//     LIVE in-repo agent-factory/ remains (half-state) warn in clear voice that it must be removed
//     by hand — prune only removes .bak.<ISO> backups, never a live kit (WR-01) — else report
//     already-migrated. Either way exit 0.
//   - isOldLayout → run migratePreSteps() (config-move + in-repo-kit backup + symlink-unlink), then
//     FALL THROUGH into the existing install run (which copies the fresh kit, D-01).
//   - isClean (or anything else) → FALL THROUGH into the existing install run unchanged (D-11).
if (MIGRATE) {
    const layout = detectOldLayout();
    // MIGR-04 (Phase 24, D-17 reconcile): back up a user's runtime-accumulated plans/handoffs/ on
    // EVERY --migrate path — the already-two-root isMigrated arm, the old-layout path, AND the clean
    // fall-through — because a user can have accumulated handoffs under the old relay regardless of
    // layout state. Folded into the existing orchestration here (never a colliding new flag); the
    // step is a clean no-op when plans/handoffs/ is absent (D-20 idempotent) and aborts without
    // clobbering on a backup-name collision (D-18). It runs BEFORE the isMigrated early-exit so an
    // already-migrated repo still gets its handoffs backed up.
    console.log("\n-- handoffs backup (MIGR-04) --");
    migrateHandoffs();
    if (layout.isMigrated) {
        if (layout.leftoverKit) {
            console.log("This repo is already migrated to the two-root layout, but a leftover LIVE in-repo agent-factory/ remains.");
            console.log(`Nothing was changed. Once you have confirmed the shared kit at ${GRUGOPS_HOME} is in use,`);
            console.log("back up and remove the leftover agent-factory/ by hand — prune only removes timestamped");
            console.log(".bak.<ISO> backups, never a live kit, so it cannot clear this one.");
        }
        else {
            console.log("This repo is already migrated to the two-root layout. Nothing to do.");
        }
        process.exit(0);
    }
    if (layout.isOldLayout) {
        console.log("== grugops migrate (old in-repo layout → two-root) ==");
        console.log(`target: ${TARGET}`);
        if (DRY_RUN)
            console.log("mode:   DRY_RUN (no filesystem changes)");
        console.log("\n-- migrate pre-steps --");
        migratePreSteps();
        // FALL THROUGH into the install run below (D-02): it copies the fresh kit from source (D-01),
        // re-materializes the resolver adapters, seeds state (incl. the carried-forward config), and
        // writes the marker.
    }
    // isClean (or any other non-old, non-migrated state): fall through to a normal fresh install (D-11).
}
// --- run -------------------------------------------------------------------
console.log("== grugops install ==");
console.log(`source: ${GRUGOPS_SRC}`);
console.log(`home:   ${GRUGOPS_HOME}`);
console.log(`kit:    ${KIT_ROOT}`);
console.log(`target: ${TARGET}`);
if (DRY_RUN)
    console.log("mode:   DRY_RUN (no filesystem changes)");
console.log(`tools detected: ${detectTools()}`);
// 0. Copy the read-only kit to $GRUGOPS_HOME (atomic) — first so the seed source + VERSION exist.
// Explicit default (retainBackup=false): the install path never retains a backup; Plans 02/03 pass
// the mode they need (--update retains).
console.log("\n-- kit --");
copyKit(false);
console.log("\n-- adapters --");
// 1. Lay down whatever skills and adapters the kit source carries (KIT-02 / D-18) — the sets are
// derived by readdirSync at this call site, so a kit that grows a new adapter needs no installer
// edit. Routing is per-file and by CONTENT (D-06): a source body carrying the resolver slot line is
// materialized (strip-then-inject of the absolute KIT path); anything else is plain-copied. That one
// rule replaces both the old hand-listed skill loop and its by-name skip of the single resolver
// skill, and it is what makes every adapter a resolver with no exception list.
//
// THREE STATES, BRANCHED EXPLICITLY (27-13). Each derivation is now taken ONCE here and branched on
// all three of its states, mirroring uninstall.ts's wording so a reader moving between the two files
// sees ONE contract rather than two. Before this the helpers returned [] on an unreadable directory,
// these loops ran zero times, and the run still printed a completion banner — a silent no-op install.
const SRC_SKILLS = srcSkillNames();
const SRC_ADAPTERS = srcAdapterFiles();
const SRC_NESTED_ADAPTERS = srcNestedAdapterFiles();
if (SRC_SKILLS === null) {
    verify(`.claude/skills/ — cannot read ${join(GRUGOPS_SRC, ".claude", "skills")}, so the install set is ` +
        `unknown. No skill was installed. Re-run the installer from a complete kit checkout.`);
}
else if (SRC_SKILLS.length === 0) {
    verify(`.claude/skills/ — ${join(GRUGOPS_SRC, ".claude", "skills")} was read successfully but holds no ` +
        `skill, so there was nothing to install. This is a different condition from an unreadable ` +
        `directory and needs a different remedy: check the kit source, not the checkout.`);
}
else {
    for (const s of SRC_SKILLS) {
        const src = join(GRUGOPS_SRC, ".claude", "skills", s, "SKILL.md");
        const dest = join(TARGET, ".claude", "skills", s, "SKILL.md");
        const label = `.claude/skills/${s}/SKILL.md`;
        if (srcCarriesSlot(src))
            materializeAdapter(src, dest, label);
        else
            linkOrCopy(src, dest, label);
    }
}
if (SRC_ADAPTERS === null) {
    verify(`.claude/agents/ — cannot read ${join(GRUGOPS_SRC, ".claude", "agents")}, so the install set is ` +
        `unknown. No adapter was installed. Re-run the installer from a complete kit checkout.`);
}
else if (SRC_ADAPTERS.length === 0) {
    verify(`.claude/agents/ — ${join(GRUGOPS_SRC, ".claude", "agents")} was read successfully but holds no ` +
        `adapter, so there was nothing to install. This is a different condition from an unreadable ` +
        `directory and needs a different remedy: check the kit source, not the checkout.`);
}
else {
    for (const f of SRC_ADAPTERS) {
        const src = join(GRUGOPS_SRC, ".claude", "agents", f);
        const dest = join(TARGET, ".claude", "agents", f);
        const label = `.claude/agents/${f}`;
        if (srcCarriesSlot(src))
            materializeAdapter(src, dest, label);
        else
            linkOrCopy(src, dest, label);
    }
}
// The flat-directory contract, refused BY NAME rather than silently skipped (T-27-62). See
// srcNestedAdapterFiles() for why the install set stays flat while the platform recurses.
for (const rel of SRC_NESTED_ADAPTERS) {
    verify(`.claude/agents/${rel} — the adapter directory is FLAT BY CONTRACT, so this nested adapter was ` +
        `NOT installed. Claude Code would load it from a nested path, which is exactly why it is ` +
        `refused here by name instead of skipped. Move it to the top level of the adapter directory.`);
}
if (existsSync(join(TARGET, "AGENTS.md"))) {
    report("skipped", "AGENTS.md (target already has one — left untouched)");
}
else {
    linkOrCopy(join(GRUGOPS_SRC, "AGENTS.md"), join(TARGET, "AGENTS.md"), "AGENTS.md");
}
ensureBlock(join(TARGET, "CLAUDE.md"), CLAUDE_OPEN, CLAUDE_PTR, CLAUDE_CLOSE, "CLAUDE.md start-here pointer");
mergeGemini();
ensureBlock(join(TARGET, COPILOT_REL), COPILOT_OPEN, COPILOT_PTR, COPILOT_CLOSE, `${COPILOT_REL} (optional Copilot pointer)`);
// 7. Seed the per-repo state plane into the target (skip-if-exists) so /grugops works first run.
console.log("\n-- state seed --");
seedState();
// D-11 materialization seam (Plan 05): materializeRunnable() copies the compiled kit-shipped
// runnable(s) into the host's committed tools/grugops/ path, between seedState() and
// writeMarker() (the seam Plan 03 reserved). Additive/idempotent/never-overwrite, reusing the
// seedFile shape. This is the TOOL-02 convention Phase 16's test-integrity checker reuses.
console.log("\n-- runnables --");
materializeRunnable();
// 8. Write the install marker (grugops-owned; overwritten unconditionally).
writeMarker();
console.log("\n-- notes --");
console.log("  Claude Code plugin form (colon commands /grugops:plan) installs separately:");
console.log("    /plugin marketplace add <owner>/grugops   (UNKNOWN - verify against current tool docs)");
console.log("    /plugin install grugops@grugops           (UNKNOWN - verify against current tool docs)");
console.log("  Safety: the mechanical prod-deploy guard is Claude-Code-only (plugin hooks/hooks.json).");
console.log("          The other four tools rely on the autonomy=pr procedural fallback. See install/README.md.");
console.log("  This installer NEVER sets the deploy-approval env var — only a human may approve a deploy.");
// THE CLOSING CLAIM IS CONDITIONAL (27-13, T-27-59). A run that could not read a source directory,
// or that refused a nested adapter, has NOT completed — it installed nothing for that class. Saying
// "complete" over that is the repudiation failure this plan closes, so the banner reports the real
// outcome and points at the `verify` lines that name what was left undone.
if (VERIFY_FINDINGS > 0) {
    console.log(`\n== install INCOMPLETE — ${VERIFY_FINDINGS} item(s) need verification` +
        `${DRY_RUN ? " (DRY_RUN — nothing changed)" : ""} ==`);
    console.log("  Each `verify` line above names what was NOT installed and the remedy for it.");
}
else {
    console.log(`\n== install complete${DRY_RUN ? " (DRY_RUN — nothing changed)" : ""} ==`);
}
