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
// (or $GRUGOPS_HOME), the resolved absolute kit path is materialized into the target's two
// resolver adapters, and the per-repo state plane is seeded into the target (skip-if-exists).
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
    const adapterFile = join(TARGET, ".claude", "agents", "grugops-orchestrator.md");
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
        [join(TARGET, "plans", "handoffs"), adapterFile],
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
const SKILLS = [
    "grugops",
    "grugops-map",
    "grugops-plan",
    "grugops-ticket",
    "grugops-gate",
    "grugops-uat",
    "grugops-release",
];
const AGENT_REL = ".claude/agents/grugops-orchestrator.md";
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
const report = (label, msg) => console.log(`  ${label.padEnd(14)} ${msg}`);
const mkdirp = (dir) => {
    if (!existsSync(dir) && !DRY_RUN)
        mkdirSync(dir, { recursive: true });
};
const isSymlink = (p) => {
    try {
        return lstatSync(p).isSymbolicLink();
    }
    catch {
        return false;
    }
};
const sameContent = (a, b) => {
    try {
        return readFileSync(a, "utf8") === readFileSync(b, "utf8");
    }
    catch {
        return false;
    }
};
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
// single atomic rename puts the new kit in place; the old copy is removed afterward. There is no
// window in which KIT_ROOT is absent. DRY_RUN mutates nothing.
function copyKit() {
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
    // then clean up the old copy. A concurrent reader sees either the old kit or the new — never
    // an absent one.
    if (existsSync(KIT_ROOT))
        renameSync(KIT_ROOT, old);
    renameSync(tmp, KIT_ROOT);
    rmSync(old, { recursive: true, force: true });
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
// skip-if-exists (INSTALL-04, D-01/D-04). Explicitly creates plans/handoffs/ (a runtime dir
// absent from the seed skeleton — Pitfall 4). DRY_RUN mutates nothing.
function seedState() {
    const seed = join(KIT_ROOT, "seed");
    if (!existsSync(seed)) {
        report("skipped", `state seed (no seed subtree at ${seed})`);
        return;
    }
    for (const rel of listSeedFiles(seed)) {
        seedFile(join(seed, rel), join(TARGET, rel), rel);
    }
    const handoffs = join(TARGET, "plans", "handoffs");
    if (existsSync(handoffs)) {
        report("skipped", "plans/handoffs/ (target already has it — D-04)");
    }
    else if (DRY_RUN) {
        report("would-add", "plans/handoffs/");
    }
    else {
        mkdirp(handoffs);
        report("created", "plans/handoffs/");
    }
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
console.log("\n-- kit --");
copyKit();
console.log("\n-- adapters --");
// 1a. The 6 delegating dash skills (blockquote only, no resolver block) — plain copy.
for (const s of SKILLS) {
    if (s === "grugops")
        continue;
    linkOrCopy(join(GRUGOPS_SRC, ".claude", "skills", s, "SKILL.md"), join(TARGET, ".claude", "skills", s, "SKILL.md"), `.claude/skills/${s}/SKILL.md`);
}
// 1b. The 2 resolver adapters carry the materialized absolute KIT path (strip-then-inject).
materializeAdapter(join(GRUGOPS_SRC, ".claude", "skills", "grugops", "SKILL.md"), join(TARGET, ".claude", "skills", "grugops", "SKILL.md"), ".claude/skills/grugops/SKILL.md");
materializeAdapter(join(GRUGOPS_SRC, AGENT_REL), join(TARGET, AGENT_REL), AGENT_REL);
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
console.log(`\n== install complete${DRY_RUN ? " (DRY_RUN — nothing changed)" : ""} ==`);
