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
// Cross-platform (Windows / no-POSIX). Node stdlib ONLY: node:fs + node:path + node:os +
// node:child_process — ZERO npm dependencies; the shipped/compiled .js needs nothing installed on
// host machines (D-05). node:child_process joined that list in phase 29.2 for exactly one reason:
// the installer renders a target's adapters by SPAWNING the committed generator inside a temp
// mirror (D-01), which is what keeps the `model:` line rendered by its one owner instead of
// re-implemented here. The spawn is also the boundary that preserves D-18/D-28 — install/ still
// imports nothing from scripts/.
//
// Contract (CLEAR PROFESSIONAL VOICE governs every report/warning/error string — safety surface):
//   - additive    — never overwrites or deletes user content; appends via unique sentinels
//   - idempotent  — running twice produces ZERO diff
//   - DRY_RUN=1   — prints the plan and changes NOTHING on the filesystem
//   - reversible  — install/uninstall.ts removes exactly what this added (and only that)
//   - D-30 symlink-with-copy-fallback (symlinkSync → copyFileSync on failure)
//   - NEVER touches agent-factory/, plans/, or user data
//   - writes Claude Code ask rules for the governed command spellings (D-18) — a speed bump that is
//     not a security boundary; the git host (branch protection, deployment environments) is the
//     hard floor, and only a human merges to a protected branch or approves a production deploy
//
// Usage:
//   node install/install.js --target /path/to/repo
//   node install/install.js --yes
//   DRY_RUN=1 node install/install.js
//   INSTALL_MODE=symlink node install/install.js   (copy is the default, D-05; --symlink also opts in)
//   node install/install.js --allow-self            (override the D-07 self-checkout guard)
//   node install/install.js --check                 (doctor: verify a target install, mutate nothing)
//   node install/install.js --check --strict        (doctor: promote warnings to a nonzero exit)
//   node install/install.js --backup-edited-kit     (D-32: back up every kit file you edited, then
//                                                    refresh the whole kit, without a terminal prompt)
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
// NO CONTENT READER IS IMPORTED HERE (red-team of plan 33.1-26, DC-3). Every read of a file's bytes,
// user path or kit path, goes through ./user-file.ts readUserFile, and every copy is written from
// its bytes: install/installer-fs-census.test.ts refuses readFileSync, copyFileSync,
// createReadStream and openSync in this module and in the committed install.js.
import { existsSync, mkdirSync, writeFileSync, appendFileSync, symlinkSync, cpSync, rmSync, unlinkSync, renameSync, readSync, readdirSync, lstatSync, statSync, mkdtempSync, realpathSync, } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { homedir, tmpdir } from "node:os";
// The mirror spawn (D-01). This is the ONLY import this file has ever needed beyond fs/path/os, and
// it buys the whole render path: the generator stays the single renderer of the `model:` line, and
// install/ reaches it as a child process rather than as a module.
import { spawnSync } from "node:child_process";
import { isatty } from "node:tty";
// KIT-02 / D-28: the ONE derivation of "what is in the kit source", shared with uninstall.ts. It
// used to be defined here and hand-synced into uninstall.ts; that pair drifted twice inside phase 27
// (CR-02), so it was collapsed into a single sibling module. kit-source.ts is inside install/ by
// design — D-18's decoupling of the installer from the scripts/ layout is unchanged, and the module
// still does NOT import scripts/kit-model.ts. Node stdlib only, so both binaries still run on a host
// with nothing installed. Every call passes the source root explicitly (D-22).
import { srcSkillNames, srcAdapterFiles, srcNestedAdapterFiles, hasSourceMarkers, kitNameCollisions, } from "./kit-source.js";
// D-18 / D-29: the ONE declaration of the Claude Code ask rules the installer derives from the
// checkpoints configuration. A pure sibling module inside install/ (the kit-source.ts precedent), so
// install/ still imports nothing from scripts/. The rules are a speed bump, not a security boundary;
// the git host is the hard floor (see the module header).
import { ASK_RULE_CHECKPOINTS, askRulesFor, checkpointsToWrite } from "./checkpoint-ask-rules.js";
// CR-02 / WR-05: the ONE reader of the install marker and its two ledgers (the ask rules install
// added, the directories install created), shared with uninstall.ts so the two binaries cannot read
// one malformed ledger two ways again. Node stdlib only, read-only, sibling module inside install/.
import { readInstallMarker, readCreatedDirs, readCreatedFiles, readKitFiles, readAskRuleLedger, readGeminiLedger, geminiLedgerJson, contentRecord, linkRecord, recordHolds, checkRecord, readOwnedContent, jsonValueRecord, } from "./install-marker.js";
// Red-team B3 of plan 33.1-29 (D-18): the ONE way a JSON file the user owns is edited, as text. Only
// the value that changes is spliced into the original bytes; see the module header. No I/O.
import { readJsonText, keyCount, memberNamed, valueOf, documentValue, appendElements, addMember, wrapInArray, sameJsonValue, } from "./json-text.js";
// DC-3 (brief 33.1-GAP-PLANNING-BRIEF.md): the ONE reader of a user-controlled path. Every read
// this file makes of a path in the user's repository goes through it, and so does every copy whose
// source is such a path (the copy is written from its bytes). It decides the file type before it
// opens anything, so a FIFO, directory, socket or device is never read, never written and never
// hangs the run. Node stdlib only, read-only, sibling module inside install/.
//
// readForWrite (red-team of plan 33.1-26) is the one question every write under TARGET asks first:
// it walks the path with lstat and answers `create`, `ok` (a regular file, never a link) or
// `blocked` (a link, a special file, or a non-directory on the way). directoryComponent is the same
// rule for the directories mkdirp creates, and unreadState is the one wording of an unread state.
import { readUserFile, readForWrite, wayTo, directoryComponent, unreadState, isOwnLink, gone, pathLimitProblem, writeAccessProblem, } from "./user-file.js";
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
// D-32 (plan 33.1-32): the explicit, non-interactive consent to back up every grugops kit file the
// user edited and then refresh the whole kit. `--yes` is NOT this consent: it answers the target
// question, never the question of whether a user's edit may be overwritten.
let BACKUP_EDITED_KIT = false;
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
    else if (a === "--backup-edited-kit") {
        BACKUP_EDITED_KIT = true;
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
// EOF. Used only for the interactive prompts (the target question, and D-32's edited-kit question);
// --yes / non-TTY never reach the first, and the second is asked only at a terminal.
//
// EAGAIN IS WAITED OUT, NOT READ AS END OF INPUT (plan 33.1-32). Once anything touches
// process.stdin, libuv puts a terminal's fd 0 into non-blocking mode, and a read with no key pressed
// yet throws EAGAIN. Before, that throw ended the loop, so the answer read as "" (the default) before
// the human typed anything. Measured under script(1) on darwin. The wait is a synchronous sleep on
// a private SharedArrayBuffer (Atomics.wait), so nothing else runs meanwhile.
const STDIN_WAIT = new Int32Array(new SharedArrayBuffer(4));
function readlineSync() {
    const chunks = [];
    const buf = Buffer.alloc(1);
    for (;;) {
        let n;
        try {
            n = readSync(0, buf, 0, 1, null);
        }
        catch (e) {
            if (e.code === "EAGAIN") {
                Atomics.wait(STDIN_WAIT, 0, 0, 25);
                continue;
            }
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
// --- The SECOND materialization slot: the provenance banner (D-14) -------------------------------
//
// WHAT IS WRONG WITHOUT IT. Every rendered agent adapter opens its body with a banner naming
// `node scripts/generate-role-adapters.js`. That command exists in a grugops CHECKOUT and in no
// installed repository, so a target's own copy of the file tells its reader to run something the
// repository does not contain, and says nothing about where the model line actually comes from.
// Nothing in a target may name a command the target cannot run.
//
// KIT_BANNER IS THE GENERATOR'S OWN LINE, BYTE-EQUAL BY CONSTRUCTION. It is the value of
// `PROVENANCE` in scripts/generate-role-adapters.ts, em dash included. It is restated here rather
// than imported for the reason install/ restates every cross-boundary literal it needs: this module
// imports nothing from scripts/ (D-18/D-28), and the generator module cannot be imported by anything
// at all — it writes seventeen files at load. The restatement is a hand-synced literal, which is
// this repository's named second systemic failure class, so it carries TWO mechanical guards:
//   - a case in install/install.test.ts reads the generator's SOURCE TEXT and asserts byte equality
//     with this constant, and asserts the same literal appears exactly once in each committed kit
//     adapter, so the pin is anchored to the emitted bytes and not only to two source spellings;
//   - the agents loop below asserts EXACTLY ONE recognised banner per rendered adapter and refuses
//     by name on zero or on two or more, so a generator rewording that stops matching is loud
//     rather than silent. The silent direction — match nothing, leave every target naming a command
//     it cannot run, stay green — is the one this floor exists for.
// The sentinel is NOT added to the generator's output: scripts/adapter-byte-baseline.test.ts freezes
// the committed adapter bytes against a pinned commit, so moving them is a different decision from
// this one. It is not declared in agent-factory/packaging/subagent.frontmatter.md either: that file
// carries no such string today, nothing reads markdown at install time, and a declaration with no
// mechanical reader would be a sixth hand-synced copy rather than an authority.
const KIT_BANNER = "<!-- GENERATED — do not hand-edit. Re-run: node scripts/generate-role-adapters.js -->";
// The injected block's sentinel pair, in the same style as MAT_OPEN/MAT_CLOSE and handled by the
// same one state machine, so the strip-then-inject contract and its CR-01 bounded removal cover
// both slots identically. These are bare HTML comments because the banner sits in the document
// body, not inside the shell fence the kit block lives in.
const BAN_OPEN = "<!-- grugops:target-banner -->";
const BAN_CLOSE = "<!-- /grugops:target-banner -->";
// The replacement text, written to be TRUE IN A TARGET. It names the install re-run and states
// where that command is run from, and it names the configuration file the model line comes from.
// It names NO preset and NO alias (D-12: no provenance block is added to a target adapter, and the
// model line stays the only per-target byte the dial contributes), and it makes no claim about what
// any model costs.
const TARGET_BANNER = "<!-- GENERATED — do not hand-edit. This file is written by the grugops installer. To refresh " +
    "it, re-run `node install/install.js --target <this repository>` from the grugops checkout. The " +
    "model line comes from .grugops/factory.config.json in this repository — set it there, not here. -->";
// ---------------------------------------------------------------------------
// THE INSTALL-TIME ADAPTER RENDER (phase 29.2 — D-01, D-02, D-05, D-06).
//
// THE MIRROR'S INPUTS ARE DECLARED HERE, ABOVE THE DOCTOR, FOR THE REASON THE MATERIALIZATION
// SENTINELS ABOVE RECORD FOR THEMSELVES. `renderAdaptersInMirror` is a hoisted declaration and
// reaches its caller wherever that caller sits — but the constants its BODY reads are `const`
// bindings, and a `const` is in its temporal dead zone until the module reaches it. The `--check`
// doctor runs from an early-exit branch far above the install run, so leaving these beside the
// function would make the doctor's staleness comparison throw a reference error at the moment it
// first mattered. The function itself stays where it is; only its inputs moved.
//
// A target repository may carry a `models` block at .grugops/factory.config.json, and the seventeen
// sub-agent adapters that repository loads must carry the aliases that block resolves to. The
// `model:` line has exactly ONE renderer in this tree — scripts/generate-role-adapters — so the
// installer does not re-implement any part of it. It mirrors that generator's committed import
// closure into a temp tree, drops the TARGET's own configuration file in as the one new input,
// spawns the mirrored generator, and hands the rendered bytes to materializeAdapter() below.
//
// THE SPAWN IS THE BOUNDARY, AND IT IS WHAT PRESERVES D-18/D-28 RATHER THAN REVERSING IT. install/
// still imports nothing from scripts/: a path literal joined against GRUGOPS_SRC and handed to
// cpSync adds NO EDGE to this module's import graph, while an `import` statement naming a scripts/
// module would. A host still runs the committed installer with the scripts/ layer absent — it then
// gets a named refusal from the missing-twins branch below, never a silent wrong answer.
//
// THE RENDER RUNS FROM GRUGOPS_SRC, NEVER FROM THE KIT HOME (D-02). Install is invoked as
// `node install/install.js` out of a checkout, so GRUGOPS_SRC is always present; a target refresh
// is a re-run of install from that checkout. copyKit ships nothing new into $GRUGOPS_HOME and its
// contract is byte-unchanged.
//
// THE TWIN LIST IS THE GENERATOR'S IMPORT CLOSURE AND MUST TRACK IT. It is hand-written rather than
// derived, and that is the same deliberate trade scripts/adapters-freshness.ts records above its own
// copy: deriving it would mean writing a grammar for "what does this module import" inside an
// installer, which is a second grammar of exactly the kind this milestone exists to delete. The
// trade is acceptable only because the FAILURE DIRECTION IS LOUD — an unmirrored import makes the
// mirrored generator fail to resolve it and exit non-zero, the fail-closed branch below reports a
// render that did not run, and R-5 then installs NO adapter at all rather than a stale one. It can
// never quietly install while one file short.
//
// THE LIST IS FOUR, NOT FIVE. canonical-frontmatter.js is NOT in the generator's import closure —
// the generator reads frontmatter through frontmatter.js — so mirroring it would copy a file
// nothing in the mirror opens. install.test.ts pins both the membership and the integer.
const GENERATOR_TWINS = [
    "scripts/generate-role-adapters.js",
    "scripts/kit-model.js",
    "scripts/frontmatter.js",
    "scripts/model-tiers.js",
];
// The kit sources the mirrored generator reads. agent-factory/config is DELIBERATELY ABSENT, and
// that absence is load-bearing: it is what makes D-06 true BY CONSTRUCTION. The resolver tries
// .grugops/factory.config.json first and agent-factory/config/factory.config.json second, first
// existing file wins WHOLE — so a second candidate that cannot exist inside the mirror is a
// shadowing that cannot recur inside a target's render.
const GENERATOR_KIT_SOURCES = ["agent-factory/roles", "agent-factory/packaging"];
// The mirror's module-type declaration. The committed twins are ES modules with a BARE `.js`
// extension, and Node decides that from the nearest package.json `type` field. A mkdtemp directory
// under the system temp root has no package.json above it, and implicit-ESM detection for a bare
// `.js` only became the default in Node 22.12 — on 22.0 through 22.11 the mirrored generator would
// die with a syntax error about an import statement, and R-5 would turn that into an install that
// laid down no adapter at all. One file at the mirror root states the fact outright: no directory
// is added, no dependency is introduced, and the mirror stops depending on which Node minor the
// host happens to run.
const MIRROR_PACKAGE_JSON = '{"type":"module"}\n';
// THE RESOLUTION READER PROBE (R-1, D-04).
//
// D-04 wants the run to report the resolution, and the "derive the set, assert the count" rule wants
// the announced member count cross-checked against a listing this side derived itself. Both need the
// announced payload — and the grammar that payload is written in belongs to scripts/model-tiers.ts,
// which install/ does not import (D-18/D-28).
//
// THE TWO RULES ARE RECONCILED BY SPAWNING, NOT BY COPYING. This fixed source is written into the
// mirror beside the twins and run there with the generator's stdout on its stdin. It imports the
// MIRRORED ./model-tiers.js by a relative specifier — which resolves inside the mirror exactly as
// the generator's own imports do, with no file-URL conversion and no path interpolation — calls the
// module's own exported reader, and prints ONE JSON line back. install.ts parses that one line and
// nothing else, so the installer holds NO copy of either announcement prefix and this module's
// import graph is untouched. A second hand-synced spelling of a cross-boundary literal is this
// repository's named second systemic failure class, and its drift direction here is the worst one:
// the reader stops finding the line exactly when the emitter stops announcing.
//
// THE SOURCE IS A FIXED LITERAL WITH NO INTERPOLATION (T-29.2-06). Nothing derived from the target,
// from argv or from the environment reaches it; it is written into the 0700 mkdtemp directory and
// invoked by an absolute join()-built path with `shell` unset.
//
// The `.mjs` extension makes it unambiguously an ES module whatever any package.json says.
const RESOLUTION_PROBE_REL = "grugops-read-resolution.mjs";
const RESOLUTION_PROBE_SOURCE = [
    "// Written into a temp mirror by the grugops installer and removed with it. It exists so the",
    "// installer can read the resolution the generator announced without importing the module that",
    "// owns that grammar: the reader stays where it is declared, and the installer holds no copy of",
    "// the marker. Reads the generator's stdout from stdin; prints one JSON line.",
    'import { resolvedAssignmentsIn } from "./model-tiers.js";',
    'let input = "";',
    'process.stdin.setEncoding("utf8");',
    "for await (const chunk of process.stdin) input += chunk;",
    'process.stdout.write(JSON.stringify({ results: resolvedAssignmentsIn(input) }) + "\\n");',
    "",
].join("\n");
// ---------------------------------------------------------------------------
// Kit-set derivation (KIT-02 / D-18, AMENDED BY D-28). The installer SELF-DERIVES the adapter and
// skill sets by reading $GRUGOPS_SRC at run time; it carries NO hand-listed adapter or skill name.
// Laying down seventeen adapters instead of one therefore requires no installer edit.
//
// THE DERIVATIONS THEMSELVES NOW LIVE IN ./kit-source.ts, AND ARE DEFINED THERE ONCE (D-28,
// closing CR-02). They used to be defined HERE and again, hand-synced, in install/uninstall.ts —
// the declared BYTE-IDENTICAL PAIR the foundation guards' set-literal inventory recorded. That pair
// drifted twice inside phase 27: round 1 re-synced it, then plan 27-22 moved this file onto statSync
// and left uninstall.ts on Dirent flags, so a symlinked source adapter installed here and was never
// removed there. The fix is structural — one authority per predicate — so the definitions moved out
// and both installers now ask the same module. Do not re-inline a copy; read kit-source.ts's header
// for the full contract (fail-loud null-versus-empty, the statSync file-ness rule, the
// flat-directory contract) and for why it still does NOT import scripts/kit-model.ts.
//
// The root is passed EXPLICITLY on every call (D-22): kit-source resolves no root of its own, so
// GRUGOPS_SRC as resolved above stays this file's single source of truth for where the kit is.
// Every call is taken AT ITS USE SITE rather than cached — the doctor and the install paths run at
// different points in the process, so a cached snapshot could go stale.
// ---------------------------------------------------------------------------
// carriesSlot: the ROUTING signal (D-06). Whether a source file is materialized or plain-copied is
// decided by the presence of the resolver slot line in its OWN body — never by a hard-coded filename.
// That is what makes all seventeen adapters resolvers with no name list anywhere, and it removes the
// by-name special case the old call site used to carve out for one skill. The test is whole-line
// equality, matching transformAdapter's own `line === MAT_SLOT` injection test exactly, so routing
// and injection can never disagree.
//
// It is asked over text already read (plan 33.1-31): the kit plan reads each source ONCE through
// readUserFile (red-team of plan 33.1-26, DC-3: GRUGOPS_SRC and the render mirror are paths the user
// controls too, so a FIFO or a /dev/zero link there must neither hang nor flood the read), and routes
// on those bytes. It replaced srcCarriesSlot(path), which read the source a second time.
function carriesSlot(text) {
    return text.split("\n").includes(MAT_SLOT);
}
// targetAdapterFiles: the derived adapter set mapped into the TARGET's .claude/agents directory.
// Propagates the null (it is the same derivation wearing a different path prefix); each caller
// decides what an unknown set means for it, rather than the helper deciding for all of them.
function targetAdapterFiles() {
    const files = srcAdapterFiles(GRUGOPS_SRC);
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
// unreadState (DC-3, plan 33.1-26) moved into ./user-file.ts with readForWrite, so the wording of an
// unread state has one home for both the reader and the write gate.
// errCode: the error code a thrown fs error carries, or "UNKNOWN".
const errCode = (e) => {
    const code = e.code;
    return typeof code === "string" && code !== "" ? code : "UNKNOWN";
};
// CREATED_DIRS (CR-02, D-18): every directory under TARGET that mkdirp itself created in this run,
// as a POSIX path relative to TARGET. writeMarker() records it in the marker as `createdDirs`, and
// uninstall removes an empty shared-name directory (.claude/, .gemini/, .github/, ...) only when it
// is in that ledger — so an empty directory the user made before the install is never removed.
// Directories outside TARGET (the kit home) are not recorded. The DRY_RUN guard is unchanged: a
// preview creates nothing and records nothing.
const CREATED_DIRS = new Set();
// CREATED_FILES (plan 33.1-28, Gap B / re-review WR-05, D-18): every file under TARGET that THIS run
// created where nothing was before, as a POSIX path relative to TARGET, mapped to the content record
// of what this run wrote there (install-marker.ts contentRecord / linkRecord): the files ensureBlock
// creates to hold a sentinel block (CLAUDE.md, .github/copilot-instructions.md), the AGENTS.md
// linkOrCopy lays down, and the runnables materializeRunnable writes. writeMarker() records it in the
// marker as `createdFiles`, and uninstall deletes one of those files only when that ledger lists it
// and the file still holds what the record says, so a file the user had before the install (a blank
// Copilot file, a byte-identical AGENTS.md from the minimal copy path) is never deleted. Only a
// successful create is recorded: an append, a skip and a DRY_RUN preview record nothing. The
// inside-TARGET test is mkdirp's.
const CREATED_FILES = new Map();
const targetRel = (path) => {
    const rel = relative(TARGET, path);
    if (rel === "" || isAbsolute(rel) || rel === ".." || rel.startsWith(`..${sep}`))
        return null;
    return rel.split(sep).join("/");
};
const recordCreatedFile = (path, record) => {
    const rel = targetRel(path);
    if (rel !== null)
        CREATED_FILES.set(rel, record);
};
// KIT_FILES (plan 33.1-30, Gap B completed, brief DC-2, D-18): what THIS run wrote to each grugops
// skill and adapter file (.claude/skills/<name>/SKILL.md, .claude/agents/<file>.md), as a POSIX path
// relative to TARGET mapped to the content record of what is there now because of this run:
// materializeAdapter records `sha256:` of the final bytes it wrote or found identical, and copyKitFile
// (a skill without the slot line; linkOrCopy's job before plan 33.1-31) records `sha256:` of a copy or
// `link:<source>` of the link install makes. A user's edit to a kit file is user content: writeMarker() records this map in the
// marker as `kitFiles`, and uninstall removes a kit file only while it still holds its record. A DRY_RUN
// preview, a refusal (verify) and a skip of a link or file that is not install's record nothing.
const KIT_FILES = new Map();
// KIT_WRITTEN (plan 33.1-32, D-32): true once executeKitPlan ran in this run. When the kit was not
// written (no consent, a hazard, a kit-plan refusal), writeMarker keeps the previous marker's
// kitVersion, so the marker never claims a kit version the target's kit is not at.
let KIT_WRITTEN = false;
// KIT_EDITED_RECORDED (plan 33.1-32, D-32): the kit files (POSIX, relative to TARGET) the pre-flight
// found edited AGAINST A kitFiles RECORD. When this run writes no kit file, writeMarker carries each of
// those records forward even though the file no longer holds it. The record is what install last wrote
// there, and the D-32 remedy "restore them first" depends on it: a file restored to those bytes holds
// its record again, so the next run is not asked about it. Every other entry follows the plan-31 rule
// (carried only while its file still holds it). Uninstall leaves an edited file whether or not its
// record is carried, and with the record it says truthfully that the file changed since install wrote it.
const KIT_EDITED_RECORDED = new Set();
// The target's configuration file, and the two legacy locations --migrate carries one forward from
// (D-04). Declared here, above the doctor's early exit, because the doctor's render asks
// renderConfigInput (red-team B3 of plan 33.1-31); see THE LEGACY CONFIG CARRY below.
const SEEDED_CONFIG = join(TARGET, ".grugops", "factory.config.json");
const LEGACY_CONFIGS = [
    join(TARGET, "factory.config.json"),
    join(TARGET, "agent-factory", "config", "factory.config.json"),
];
// MIGRATE_CARRY_PENDING: true in a --migrate run over an old layout, from before its kit plan is built.
// That run builds its kit plan ONCE, before its pre-steps move anything, so the configuration the
// render reads is the one planConfigCarry says will be carried (red-team B3 of plan 33.1-31: DRY_RUN
// moved nothing and rendered with no configuration, while the real run rendered with the moved one).
let MIGRATE_CARRY_PENDING = false;
const recordKitFile = (path, record) => {
    if (DRY_RUN)
        return;
    const rel = targetRel(path);
    if (rel !== null)
        KIT_FILES.set(rel, record);
};
// APPENDED_FILES (red-team of plan 33.1-28, R1): every file ensureBlock APPENDED its block to in this
// run. The file was there without a grugops block when this run started, so it is the user's, whatever
// an earlier record says: a user who deleted a file install created and made their own at the same
// name has a file install did not create. writeMarker() drops such a path from createdFiles, and this
// rule does not depend on the bytes (appending the block to an empty file produces exactly the bytes a
// create writes, so a content record alone could not tell the two apart).
const APPENDED_FILES = new Set();
// mkdirp (red-team of plan 33.1-26, D-18): make `dir` and every missing directory on the way to it.
// Returns null on success, or a sentence naming the component that stopped it; it never throws.
//
// INSIDE THE TARGET IT WALKS ONE COMPONENT AT A TIME, FROM TARGET DOWN. Each existing component must
// be a real directory by lstat (directoryComponent, the same rule readForWrite applies). A FIFO or a
// regular file where a directory should be used to make every later write throw ENOTDIR, uncaught,
// after other files were already written; a symbolic link on the way used to carry every write
// under it out of the target. Each missing component is created with a NON-recursive mkdirSync,
// which fails on anything that appeared at that name since the check and never follows a link.
// Every directory it creates is recorded in CREATED_DIRS.
//
// OUTSIDE THE TARGET (the kit home) the behaviour is unchanged: one recursive mkdirSync.
const mkdirp = (dir) => {
    const rel = relative(TARGET, dir);
    const inTarget = rel === "" || (!isAbsolute(rel) && rel !== ".." && !rel.startsWith(`..${sep}`));
    if (!inTarget) {
        if (!existsSync(dir) && !DRY_RUN)
            mkdirSync(dir, { recursive: true });
        return null;
    }
    if (DRY_RUN)
        return null;
    try {
        if (!existsSync(TARGET) && !DRY_RUN)
            mkdirSync(TARGET, { recursive: true });
    }
    catch (e) {
        return `${TARGET} could not be created (${errCode(e)})`;
    }
    let cur = TARGET;
    for (const part of rel === "" ? [] : rel.split(sep)) {
        cur = join(cur, part);
        const state = directoryComponent(cur);
        if (state === "fine")
            continue;
        if (state !== "absent")
            return `${cur} ${state}`;
        try {
            if (!DRY_RUN)
                mkdirSync(cur);
        }
        catch (e) {
            return `${cur} could not be created (${errCode(e)})`;
        }
        CREATED_DIRS.add(relative(TARGET, cur).split(sep).join("/"));
    }
    return null;
};
// blockedAt: the one wording of a readForWrite refusal, naming the component that refused and, when
// that component is a directory on the way, the path the write was for.
const blockedAt = (g, path) => g.at === path ? `${path} ${g.reason}` : `${g.at} ${g.reason}, on the way to ${path}`;
// writeTargetFile (red-team of plan 33.1-26, D-18): the ONE writer of a whole file under TARGET.
// `how` is readForWrite's answer for `path`, asked by the caller before its DRY_RUN return:
//   `create` writes with an exclusive create (flag "wx"). It refuses anything at the path, a
//            dangling link included (measured on darwin: EEXIST for a dangling link, a link into a
//            missing directory and a link loop), so a create can never follow a link out of the
//            target, and a path that appeared since the gate asked is never overwritten.
//   `ok`     rewrites the regular file (not a link) the gate read. Between the gate and this write a
//            same-user process could swap the path; that window is the residual SUMMARY records.
// Missing directories are made by mkdirp. Every failure is a counted `verify`, never a throw.
function writeTargetFile(path, data, how, label) {
    const why = mkdirp(dirname(path));
    if (why !== null) {
        verify(`${label}: ${why}. Nothing was written to ${path}.`);
        return false;
    }
    try {
        writeFileSync(path, data, { flag: how === "create" ? "wx" : "w" });
        return true;
    }
    catch (e) {
        verify(`${label}: ${path} could not be written (${errCode(e)}). It was not written.`);
        return false;
    }
}
// isOwnLink (the link a --symlink install made: readlink equals the exact source path) moved into
// ./user-file.ts in the red-team fixes of plan 33.1-27, so install's "this link is mine" and
// uninstall's "this link may be removed" are one predicate.
// sameContent reads BOTH sides through readUserFile (DC-3, plan 33.1-26): one side is usually a path
// in the user's repository (a linkOrCopy or materializeRunnable destination, a file inside the
// in-repo agent-factory/ that --migrate compares). Anything but two readable regular files within
// the bound is "not the same", the existing fail-safe-to-differs answer, and nothing blocks.
const sameContent = (a, b) => {
    const ra = readUserFile(a);
    const rb = readUserFile(b);
    return ra.state === "ok" && rb.state === "ok" && ra.text === rb.text;
};
// TEMP_MIRROR_DISCLAIMER (plan 29.2-05, WR-05) — ONE WORDING, THREE CONSUMERS.
//
// The generator's own stdout is relayed VERBATIM, and it names the temp render mirror it wrote
// into — a directory this run deletes before the closing banner prints. This repository's own rule
// is that nothing it hands a reader may name a path they cannot go and look at, and that rule was
// already applied to the doctor's NO VERDICT arm and to the install-side render refusal. It was NOT
// applied to the SUCCESS path, which is the one every user reads.
//
// THE FIX IS A THIRD CONSUMER, NOT A THIRD SPELLING. Two near-identical hand-written copies of this
// sentence already existed; adding a third would be the set-literal drift class this repository has
// spent several phases deleting. There is one declaration here, above the `--check` early exit —
// the same temporal-dead-zone rule `verify`, `isSymlink` and `adapterDestHazard` are placed by,
// because the doctor is one of the three consumers.
//
// IT CARRIES NO CAPITAL AND NO LEAD-IN. Every consumer supplies its own preceding clause and the
// `; ` that joins it, so each site keeps its own surrounding sentence and none of them re-authors
// the shared half.
const TEMP_MIRROR_DISCLAIMER = "any path inside the relayed message above is a temporary mirror that no longer exists.";
// isSymlink: lstat-based, so it answers TRUE for a DANGLING link as well as a live one. It lives
// HERE — and no longer beside the COPILOT_* constants where it used to — for the identical reason
// `verify` above gives: adapterDestHazard() below consumes it, the doctor consumes THAT, and the
// doctor is invoked at the `--check` early exit further down this file. A const declared after that
// exit is in the temporal dead zone when the doctor runs and would throw a ReferenceError on every
// --check. One declaration, one authority.
const isSymlink = (p) => {
    try {
        return lstatSync(p).isSymbolicLink();
    }
    catch {
        return false;
    }
};
// adapterDestHazard (plan 29.2-04, CR-01 / VERIFICATION truth 10) — THE ONE QUESTION BOTH THE WRITE
// PATH AND THE `--check` DOCTOR ASK ABOUT A TARGET ADAPTER DESTINATION: may bytes be read from, or
// written to, this path at all? It returns a REASON SENTENCE when they may not, and null otherwise.
//
// ONE PREDICATE, TWO CONSUMERS. materializeAdapter() calls it before its read and before its write;
// the doctor's byte-compare loop calls it before its read. A second helper answering the same
// question is the drift class this repository has spent four phases removing, so there is exactly
// one declaration of this and a structural case in install.test.ts pins that both consumers reach
// it. Nothing here writes: the doctor executes this body, and the doctor mutates nothing.
//
// WHY THIS BOUNDS D-13 RATHER THAN WITHDRAWING IT. D-13 says an installed `.claude/agents/grugops-*.md`
// is a kit-owned derived artifact that a re-run may rewrite. That claim is true of a REGULAR FILE
// INSIDE THE TARGET and false of everything else — a link, or a path that resolves outside the
// target, names bytes this installer never owned. A real file inside the target is still kit-owned
// and still rewritten; this refuses only the destinations that are not that.
const adapterDestHazard = (dest) => {
    // ARM 1 — the LEAF IS A LINK. Measured against the pre-fix build: a leaf symlink to a file
    // outside the target had that file OVERWRITTEN and the run reported `materialized` at exit 0.
    //
    // DO NOT NARROW THIS TO `existsSync(dest) && isSymlink(dest)`. Also measured against the pre-fix
    // build: a DANGLING link at a target adapter path made the installer CREATE a brand-new 2024-byte
    // file at the link's target path, outside the target. existsSync is FALSE for that shape, so an
    // existsSync gate would re-open it. isSymlink is lstat-based and answers true for both.
    if (isSymlink(dest)) {
        return (`${dest} is a symbolic link, and writing the rendered adapter would follow it and overwrite ` +
            `whatever it points at. The file it points at was left untouched and nothing was written. ` +
            `Replace the link with a regular file (or remove it) and re-run; the installer never writes ` +
            `a target adapter through a link.`);
    }
    // ARM 2 — the DESTINATION RESOLVES OUTSIDE THE TARGET, through a symlinked ANCESTOR DIRECTORY.
    // A LEAF-ONLY CHECK DOES NOT CATCH THIS, and that is a measurement, not a worry: with
    // `.claude/agents` replaced by a link to a directory elsewhere, every leaf is an ordinary REGULAR
    // FILE — arm 1 above answers false — and the pre-fix build wrote all seventeen adapters outside
    // the target at exit 0. Watched RED against the leaf-only build before this arm was written: all
    // seventeen content hashes in the moved-out directory changed.
    //
    // BOTH SIDES ARE RESOLVED, AND THAT IS LOAD-BEARING. On macOS `mkdtempSync(tmpdir())` returns a
    // `/var/folders/…` path whose realpath is `/private/var/folders/…`. Comparing a RAW target
    // against a RESOLVED destination therefore refuses EVERY legitimate install; a standing case in
    // install.test.ts drives an ordinary install and asserts it still exits 0 with seventeen
    // adapters, so this trap cannot be reintroduced quietly.
    let resolvedTarget;
    try {
        resolvedTarget = realpathSync(TARGET);
    }
    catch {
        return (`${TARGET} could not be resolved to a real path, so this run cannot say whether ${dest} is ` +
            `inside it, and it will not write to a destination it cannot place. Nothing was written. ` +
            `Check that the target directory exists and is readable, then re-run.`);
    }
    // A FRESH INSTALL MUST NOT BE REFUSED. On the first run `.claude/agents` does not exist yet and
    // realpathSync throws ENOENT — so walk up to the nearest EXISTING ancestor and resolve THAT. The
    // question this arm asks is which real directory the path would be created under, not whether it
    // has been created yet.
    let probe = dirname(dest);
    while (!existsSync(probe)) {
        const up = dirname(probe);
        if (up === probe)
            break; // filesystem root reached — resolve it and let the compare decide.
        probe = up;
    }
    let resolvedDir;
    try {
        resolvedDir = realpathSync(probe);
    }
    catch {
        // ANY OTHER RESOLUTION FAILURE IS A REFUSAL, NOT A FALLTHROUGH. "We could not tell" is not
        // "it is fine", and a destination this run cannot place is not a destination it may write to.
        return (`the directory ${probe} that would hold ${dest} could not be resolved to a real path, so ` +
            `this run cannot say whether it is inside ${resolvedTarget}. Nothing was written.`);
    }
    // SEGMENT-WISE CONTAINMENT, NOT A BARE startsWith. A sibling directory whose name merely BEGINS
    // with the target's name — `/tmp/repo-backup` beside `/tmp/repo` — is not a descendant of it, and
    // a prefix compare would call it one.
    if (resolvedDir !== resolvedTarget && !resolvedDir.startsWith(resolvedTarget + sep)) {
        return (`${dest} resolves to ${join(resolvedDir, basename(dest))}, which is OUTSIDE the target ` +
            `${resolvedTarget} — a directory on the way to it is a symbolic link into somewhere else. ` +
            `Nothing was written there or anywhere else for this file. Replace the linked directory with ` +
            `a real one, or install into the directory the link points at, and re-run; the installer only ` +
            `writes adapters inside the target it was given.`);
    }
    // WHAT THIS PREDICATE DOES NOT REACH, STATED PLAINLY RATHER THAN LEFT TO BE INFERRED. A
    // destination that is ITSELF A DIRECTORY (EISDIR) or is UNWRITABLE (EACCES) is NOT caught here:
    // arm 2 resolves the destination's DIRECTORY, which for both of those shapes is an ordinary
    // directory inside the target. Since plan 33.1-26 (DC-3), materializeAdapter reads the
    // destination through readUserFile after this predicate, and refuses a directory, FIFO, socket or
    // device, or an unreadable or too-large file, with a counted `verify` and no write. A READABLE
    // regular file that is UNWRITABLE still reaches writeFileSync and still throws uncaught: that is a
    // loud crash, never a silent write, and `.planning/WINDOWS.md` ledger row 111 carries it.
    return null;
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
// Doctor (INSTALL-05) — a verifier that MUTATES NOTHING INSIDE THE TARGET. It never writes, links,
// seeds or marks any path under TARGET: it never calls copyKit, seedState or writeMarker, it never
// opens a file in the target for writing. It reads the Claude Code ask-rule ledger and settings
// file only to report which rules are present; it never repairs them.
//
// THAT SENTENCE USED TO SAY SOMETHING WIDER, AND PHASE 29.2 MADE THE WIDER VERSION FALSE. The
// staleness verdict below (D-09) RENDERS this checkout's adapters into a temp tree the render
// helper owns and removes, and puts the result through transformAdapter IN MEMORY so the comparison
// is like-for-like against what an install would write. Both the render and the transform happen
// OUTSIDE TARGET, and the doctor still opens nothing there for writing. A blanket denial that the
// doctor runs any part of the materialization path stopped being true the moment that verdict
// landed, and a false sentence in the one file whose job is producing true ones is rewritten, not
// left standing.
//
// It reuses the one resolution rule (GRUGOPS_HOME / KIT_ROOT, source (a) of the D-03 cross-check,
// resolved above). Fail-closed parsing: a garbled or absent marker/adapter becomes a finding, never
// an unhandled throw. Findings are greppable lines; FAIL names the path + referencing file.
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
// AskRuleLedger (D-18) and its reader live in ./install-marker.ts, shared with uninstall.ts (WR-05):
// a local reader here used to read a malformed ledger as "no ledger" while uninstall refused on it.
// readMarker: fail-closed read of the byte-stable .grugops/install.json the installer wrote
// (writeMarker schema), for the callers that need only "a usable marker or none" (the doctor's
// version and kit checks, old-layout detection) — source (b) of D-03. It delegates to the shared
// reader in ./install-marker.ts, so the marker is parsed one way in both binaries: an absent,
// garbled or non-object marker returns null (never throws). The ledger callers use the tri-state
// directly, because for them "unreadable" and "absent" must not be the same answer (WR-05).
function readMarker() {
    const read = readInstallMarker(TARGET);
    return read.state === "ok" ? read.marker : null;
}
// readAdapterKit: extract the materialized KIT="…" line from the grugops:materialized-kit
// sentinel block (source (c) of D-03). Split on "\n", track inblk between MAT_OPEN/MAT_CLOSE,
// capture the KIT= line, strip the quotes. Fail-closed: absent file / no KIT line → "".
//
// DC-3 (plan 33.1-26): the target adapter is read through readUserFile. Anything but a readable
// regular file within the bound is the same fail-closed "" an absent file was, never a blocking read.
function readAdapterKit(adapterFile) {
    const read = readUserFile(adapterFile);
    if (read.state !== "ok")
        return "";
    const text = read.text;
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
// markerUnreadable (red-team of plan 33.1-27): the marker is THERE but could not be read as this
// target's JSON object (a FIFO, a directory, a symbolic link, a link on the way, garbage, too large).
// "not installed" would claim it is absent, which is false and hides the one file the human must
// look at. Still a FAIL with the same exit code, and still fail-closed: nothing else is checked.
function markerUnreadable(markerFile, why) {
    docReport("FAIL", `the install marker ${markerFile} is present but could not be read as a JSON object (${why}) — the ` +
        `install state of ${TARGET} is unknown, so nothing else was checked. Fix or remove the marker, then ` +
        `re-run install.js (then install.js --check)`);
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
    // Absent marker = a dev/uninstalled checkout; a marker that is there but unreadable is named as
    // such (red-team of plan 33.1-27), never as "not installed". Both fail closed BEFORE touching
    // adapters: print a distinct greppable line and return nonzero. Never crash, never
    // false-green (ties to C3 — the dev checkout has agent-factory/ but no marker).
    const markerRead = readInstallMarker(TARGET);
    if (markerRead.state === "unreadable") {
        markerUnreadable(markerFile, markerRead.why);
        return 1;
    }
    if (markerRead.state === "absent") {
        notInstalled();
        return 1;
    }
    const marker = markerRead.marker;
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
    //
    // PRESENCE IS NOT PROOF (red-team of plan 33.1-26, DC-1/DC-3). Each entry also says what it must BE.
    // A file entry is read through readUserFile, so a FIFO, a directory or a /dev/zero link at
    // plans/board.md is never reported `ok` (it used to be, on existsSync alone, and the run printed
    // ALL CHECKS PASSED). A directory entry must stat as a directory. Anything else present is a WARN
    // that says no verdict was reached on it; absent stays the FAIL it always was.
    const refs = [
        [KIT_ROOT, markerFile, "dir"],
        [join(KIT_ROOT, "roles", "orchestrator.md"), adapterFile, "file"],
        [join(KIT_ROOT, "roles", "_role-switch-protocol.md"), adapterFile, "file"],
        [join(KIT_ROOT, "workflows"), adapterFile, "dir"],
        [join(TARGET, ".grugops", "factory.config.json"), adapterFile, "file"],
        [join(TARGET, "plans", "board.md"), adapterFile, "file"],
        // MIGR-02 (Phase 24): plans/handoffs/ is no longer seeded (the note-native trace replaced the
        // handoff relay), so the doctor must NOT require it — checking it here would FAIL every clean
        // install. Removed deliberately in lockstep with the seedState mkdir removal.
    ];
    if (DOC_FAILS === 0) {
        for (const [p, ref, kind] of refs) {
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
            let problem = null;
            if (kind === "file") {
                const read = readUserFile(p);
                if (read.state !== "ok")
                    problem = read.state === "absent" ? "is not present" : unreadState(read);
            }
            else {
                try {
                    if (!statSync(p).isDirectory())
                        problem = "is not a directory";
                }
                catch (e) {
                    problem = `could not be read (${errCode(e)})`;
                }
            }
            if (problem !== null) {
                docWarn(`${p} ${problem} — it was not read, so NO VERDICT was reached on it  (referenced by ${ref})`);
                continue;
            }
            docReport("ok", p);
        }
    }
    // --- WARN tier (D-06, detect-only per D-07): only when the cross-check + stats are clean -----
    if (DOC_FAILS === 0) {
        // kit-version skew: marker kitVersion vs the installed kit's VERSION (read head -n 1 the way
        // writeMarker reads it). Unequal → warn (no negotiation; SKEW-01 is v1.2).
        //
        // The kit VERSION is read through readUserFile (red-team of plan 33.1-26, DC-3). The kit home is
        // a path the user controls ($HOME/.grugops or $GRUGOPS_HOME): a FIFO there used to hang this read,
        // or release a writer blocked on it and print the writer's bytes as the verdict, and a link to
        // /dev/zero grew memory without bound. Anything but a readable regular file is a WARN saying no
        // skew verdict was reached, never a version.
        const mver = marker.kitVersion ? String(marker.kitVersion) : "";
        const verFile = join(KIT_ROOT, "VERSION");
        const kitVer = readKitVersion(verFile);
        const kver = kitVer.version;
        if (kitVer.problem !== null) {
            docWarn(`kit-version skew: the kit VERSION at ${verFile} ${kitVer.problem} — it was not read, so NO VERDICT on ` +
                `kit-version skew was reached`);
        }
        if (mver !== "" && kver !== "" && mver !== kver) {
            docWarn(`kit-version skew: marker=${mver} kit VERSION=${kver}`);
        }
        // missing optional seed: a seed file the user may have pruned (e.g. memory-bank/00-index.md).
        const optionalSeed = join(TARGET, "memory-bank", "00-index.md");
        const optionalRead = readUserFile(optionalSeed);
        if (optionalRead.state === "absent") {
            docWarn(`missing optional seed: ${optionalSeed} (run install.js to re-seed)`);
        }
        else if (optionalRead.state !== "ok") {
            docWarn(`optional seed ${optionalSeed} ${unreadState(optionalRead)} — it was not read, so NO VERDICT was reached on it`);
        }
        // --- ADAPTER STALENESS (D-09, D-10) -------------------------------------------------------
        //
        // THE QUESTION: has a configuration edit — or a kit-side adapter change — reached this
        // repository's adapters yet? Before this the answer could only be got by reading bytes by hand.
        //
        // PLACED INSIDE THIS BLOCK DELIBERATELY, AND THE PLACEMENT IS LOAD-BEARING. This block runs only
        // when the kit-root cross-check and the ordered stat set are clean, so a target with a missing
        // kit or a garbled marker reports THAT — its primary defect — rather than a wall of staleness
        // lines derived from a render that could not have been right anyway.
        //
        // WHICH KIT IT RENDERS FROM (R-3): GRUGOPS_SRC, the checkout this command is running out of.
        // The remedy the finding names is a re-run of install FROM THAT CHECKOUT, so the question the
        // comparison answers is "would that re-run change this file?" — a checkout question, not a
        // kit-home question. The finding says which root it used in its own words, so a reader meeting
        // it beside the kit-version line above can see that the two name two different roots on purpose.
        //
        // ONE RENDER AUTHORITY, ONE TRANSFORM AUTHORITY, WHOLE-FILE COMPARISON. The render is the same
        // helper the install path uses and the transform is the same pure function the writer uses, so
        // the doctor cannot drift into a second answer for "what would be written here". Nothing parses
        // frontmatter: a differing `model:` line and a differing kit-side body are the same fact to
        // this comparison, which is why it catches both.
        //
        // IT WRITES NOTHING INTO THE TARGET. The render goes into a temp tree the helper owns and
        // removes on every path out; the transform runs in memory; the target side of every comparison
        // is a read.
        //
        // THE TWINS PRE-CHECK IS NOT RESTATED HERE. renderAdaptersInMirror already refuses a partial
        // checkout by name, counting the absent members and naming each, and a second implementation of
        // that predicate inside the doctor is the duplicate-authority class this repository keeps
        // deleting. What this side adds is the SEVERITY and the sentence that makes the absence of a
        // verdict legible as such — never as a clean one.
        const docNames = srcAdapterFiles(GRUGOPS_SRC) ?? [];
        if (docNames.length > 0) {
            renderAdaptersInMirror((res) => {
                if (!res.ok) {
                    // THE RELAYED MESSAGE NAMES A TEMP MIRROR THAT NO LONGER EXISTS, so the real path on this
                    // machine is named beside it — the same closing sentence the install arm carries, for the
                    // same reason. Nothing this repository hands a reader may name a path they cannot go and
                    // look at. (Found by an independent review of this phase's diff: `--check` over a target
                    // carrying an illegal preset printed a remedy naming a directory already removed.)
                    //
                    // IT SAYS "configuration file" WHERE THE INSTALL ARM SAYS "model configuration", AND THE
                    // DIFFERENCE IS DELIBERATE. A structural pin in install.test.ts asserts that no CODE line
                    // inside this function mentions that word at all — the cheapest way to keep a frontmatter
                    // grammar out of the doctor is to keep the word out of it, and the pin does not
                    // distinguish a string literal from a parser. The pin caught this sentence on the way in,
                    // which is the pin working; the sentence was reworded rather than the pin relaxed.
                    docWarn(`adapter staleness: NO VERDICT on adapter staleness was produced by this run — ` +
                        `${res.reason.split("\n").join("\n                 ")}\n` +
                        `                 The configuration file this check reads is ` +
                        `${join(TARGET, ".grugops", "factory.config.json")}; ${TEMP_MIRROR_DISCLAIMER}`);
                    return;
                }
                // THE OTHER DIRECTION OF THE SET QUESTION (29.2-03 task 2, found by reproduction).
                //
                // The loop below asks about every member of docNames. It never asked about a member the
                // RENDER produced that docNames does not carry — so a checkout whose adapter directory is
                // SHORT compared a subset and printed a clean verdict over it. Measured against the
                // committed build: a checkout carrying one of the seventeen, against a target whose
                // seventeen were all stale, printed `ALL CHECKS PASSED (1 warning(s))` at exit 0. A vacuity
                // floor catches an EMPTY denominator and never a silently short one, and `docNames.length >
                // 0` above is that floor.
                //
                // NO NEW DERIVATION IS INTRODUCED. The render helper already returns the listing it read out
                // of its own output directory; this side only has to ask it. The install path asks the same
                // question in both directions before its first write, and this makes the doctor's half of
                // the comparison say the same thing.
                const unlisted = res.value.files.filter((n) => !docNames.includes(n));
                if (unlisted.length > 0) {
                    docWarn(`adapter staleness: the fresh render produced ${unlisted.length} member(s) that the ` +
                        `kit's own adapter set does not carry — ${unlisted.join(", ")} — so NO VERDICT on ` +
                        `adapter staleness was produced for them. Whatever this target holds under those ` +
                        `names was never compared against anything. The adapter directory and the role corpus ` +
                        `in the kit checkout at ${GRUGOPS_SRC} disagree; re-run --check from a complete kit ` +
                        `checkout.`);
                }
                const stale = [];
                const absent = [];
                const unrendered = [];
                // hazardous: a destination this doctor will NOT read through. It is deliberately its own
                // list rather than folded into `stale` or `absent`, because it is neither and both name
                // the wrong remedy: nothing was compared, so no staleness verdict exists to report, and the
                // file is emphatically not missing. See adapterDestHazard() — the SAME predicate the write
                // path calls, so install and --check cannot disagree about one destination.
                const hazardous = [];
                // ...and the reason the FIRST of them carries, taken VERBATIM from the predicate rather
                // than reworded here, so the sentence a reader meets on --check is the sentence they meet
                // on the install that refused. Two wordings for one fact is two authorities for one fact.
                //
                // ONE WORKED EXAMPLE, NOT SEVENTEEN. The per-file reasons differ only in the paths they
                // name, and those paths are already in the name list above; concatenating all of them
                // produced a single five-kilobyte line that buried the file list it was supposed to
                // explain. The line below says plainly that it is showing one of them.
                let hazardReason = "";
                // unreadable: present, but not readable as a file (IN-03). Its own list for the same reason
                // `hazardous` has one — `absent` must keep meaning genuinely absent.
                const unreadable = [];
                for (const name of docNames) {
                    // The rendered file is read through readUserFile too (the mirror is this run's own temp
                    // tree, so this is the census floor, not a live hazard): anything but a readable regular
                    // file is "the render produced no file for it", as before.
                    const renderedRead = readUserFile(join(res.value.dir, ".claude", "agents", name));
                    if (renderedRead.state !== "ok") {
                        unrendered.push(name);
                        continue;
                    }
                    const expected = transformAdapter(renderedRead.text).text;
                    const destPath = join(TARGET, ".claude", "agents", name);
                    const destHazard = adapterDestHazard(destPath);
                    if (destHazard !== null) {
                        hazardous.push(name);
                        if (hazardReason === "")
                            hazardReason = `${name} — ${destHazard}`;
                        continue;
                    }
                    // IN-03. Every read failure used to collapse to "absent from the target", which is only
                    // true of ENOENT. A directory at that path, or an EACCES, is a PRESENT thing this run
                    // could not read, and calling it missing names the wrong remedy — one says "re-install",
                    // the other says "look at what is sitting there". `absent` keeps its narrow meaning and
                    // everything else is reported separately. DC-3 (plan 33.1-26): the read goes through
                    // readUserFile, so a FIFO, socket or device there is reported unreadable and never opened.
                    const destRead = readUserFile(destPath);
                    if (destRead.state !== "ok" && destRead.state !== "absent") {
                        unreadable.push(name);
                        continue;
                    }
                    const actual = destRead.state === "ok" ? destRead.text : null;
                    if (actual === null)
                        absent.push(name);
                    else if (actual !== expected)
                        stale.push(name);
                }
                if (unreadable.length > 0) {
                    docWarn(`adapter staleness: ${unreadable.length} member(s) of the target's adapter set are ` +
                        `present but could not be read — ${unreadable.join(", ")} — so NO VERDICT on ` +
                        `adapter staleness was produced for them. Something IS at each of those paths under ` +
                        `${join(TARGET, ".claude", "agents")}; it is not a file this run could open, so it ` +
                        `is reported as absent or unreadable rather than as missing. Look at what is at each ` +
                        `path — a directory and a permission denial need different remedies from a re-install.`);
                }
                if (hazardous.length > 0) {
                    docWarn(`adapter staleness: ${hazardous.length} member(s) of the target's adapter set sit at ` +
                        `destinations this run will not read through — ${hazardous.join(", ")} — so NO ` +
                        `VERDICT on adapter staleness was produced for them. Nothing under ` +
                        `${join(TARGET, ".claude", "agents")} was compared for those names: a verdict taken ` +
                        `by reading through a symbolic link would describe a file that is not the adapter, ` +
                        `and calling that result stale or absent would name the wrong remedy.\n` +
                        `                 The first of them, as an example — each of the others was refused ` +
                        `the same way for its own path: ${hazardReason}`);
                }
                if (unrendered.length > 0) {
                    docWarn(`adapter staleness: the fresh render produced no file for ${unrendered.length} member(s) ` +
                        `of the kit's adapter set — ${unrendered.join(", ")} — so NO VERDICT on adapter ` +
                        `staleness was produced for them. The adapter directory and the role corpus in the kit ` +
                        `checkout at ${GRUGOPS_SRC} disagree; re-run --check from a complete kit checkout.`);
                }
                if (stale.length > 0 || absent.length > 0) {
                    const parts = [];
                    if (stale.length > 0)
                        parts.push(`${stale.length} differ: ${stale.join(", ")}`);
                    if (absent.length > 0) {
                        parts.push(`${absent.length} absent from the target: ${absent.join(", ")}`);
                    }
                    docWarn(`stale adapter(s) under ${join(TARGET, ".claude", "agents")} — ${parts.join("; ")}. ` +
                        `Each was byte-compared, whole file, against a fresh render of the kit checkout at ` +
                        `${GRUGOPS_SRC}, materialized exactly the way an install would materialize it — so ` +
                        `what differs here is what a re-run would change. That checkout is a DIFFERENT root ` +
                        `from the installed kit at ${KIT_ROOT} the version line reports on, and the remedy is ` +
                        `run from the checkout: node install/install.js --target ${TARGET}`);
                }
            });
        }
    }
    // --- Claude Code ask rules (D-18): report each ledger rule present or absent; never repair ---
    // The rules are a speed bump, not a security boundary; the git host is the hard floor. A missing
    // rule is a WARN (someone removed it), not a FAIL, and the doctor writes nothing either way.
    // One reader, three states (WR-05): a malformed ledger is a WARN naming it, never "predates".
    const askMarker = readInstallMarker(TARGET);
    const askRead = readAskRuleLedger(askMarker.state === "ok" ? askMarker.marker : null);
    const askLedger = askRead.ledger;
    if (askMarker.state === "unreadable") {
        docWarn(".grugops/install.json could not be read as a JSON object — the ask-rule ledger is unknown, so the ask rules were not checked");
    }
    else if (askRead.state === "malformed") {
        docWarn("the ask-rule ledger (claudeAskRules) in .grugops/install.json is malformed — the ask rules were not checked, " +
            "and neither the installer nor the uninstaller will change them until the field is fixed");
    }
    else if (!askLedger) {
        docReport("info", "no ask-rule ledger in the marker — this install predates the Claude Code ask rules; re-run the installer to write them");
    }
    else {
        let presentAsk = null;
        const askFile = join(TARGET, ".claude", "settings.json");
        // DC-3 (plan 33.1-26): read through readUserFile. A settings file that is not a readable regular
        // file is reported by its state below; an absent one keeps the existing "could not be read" line.
        const settingsRead = readUserFile(askFile);
        const askUnread = settingsRead.state !== "ok" && settingsRead.state !== "absent" ? unreadState(settingsRead) : null;
        try {
            if (settingsRead.state !== "ok")
                throw new Error("not a readable regular file");
            const parsed = JSON.parse(settingsRead.text);
            const perms = parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
                ? parsed.permissions
                : undefined;
            const ask = perms !== null && typeof perms === "object" && !Array.isArray(perms)
                ? perms.ask
                : undefined;
            presentAsk = Array.isArray(ask) ? ask.filter((x) => typeof x === "string") : [];
        }
        catch {
            presentAsk = null;
        }
        if (askUnread !== null && askLedger.added.length > 0) {
            docWarn(`.claude/settings.json ${askUnread} — it was not read, and the ${askLedger.added.length} ask rule(s) in the ` +
                `install ledger could not be checked`);
        }
        else if (presentAsk === null && askLedger.added.length > 0) {
            docWarn(`.claude/settings.json could not be read as JSON — the ${askLedger.added.length} ask rule(s) in the ` +
                `install ledger could not be checked`);
        }
        else {
            for (const rule of askLedger.added) {
                if ((presentAsk ?? []).includes(rule))
                    docReport("ok", `ask rule present: ${rule}`);
                else
                    docWarn(`ask rule absent from .claude/settings.json: ${rule} (re-run the installer to restore it)`);
            }
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
    // Red-team of plan 33.1-27: a backup that could not be removed is a counted verify, so the banner
    // and the status say INCOMPLETE (3) rather than complete (0) over it.
    if (VERIFY_FINDINGS > 0) {
        console.log(`\n== prune INCOMPLETE — ${VERIFY_FINDINGS} item(s) need verification ==`);
    }
    else {
        console.log(`\n== prune complete${DRY_RUN ? " (DRY_RUN — nothing changed)" : ""} ==`);
    }
    process.exit(VERIFY_FINDINGS > 0 ? 3 : 0);
}
// --- D-07 self-checkout guard (ALWAYS-ON): runs unconditionally after TARGET resolution, before
// any write, independent of TTY / --yes (Pitfall 3). Refuse when EITHER resolved TARGET ==
// resolved GRUGOPS_SRC, OR the target carries grugops SOURCE markers. --allow-self / --force
// overrides. ---
//
// THE MARKER HALF NO LONGER LIVES HERE (D-37, closing WR-02). It is hasSourceMarkers() in
// ./kit-source.ts, imported above, and uninstall.ts calls the SAME function — neither binary holds
// a path literal any more. Round 1 of this phase corrected the pair from the long-dead
// `install/install.sh` (deleted in f9dab9f with the POSIX installer, D-09) to a pair that exists,
// but left it a hand-synced byte-identical literal in two files with nothing asserting the named
// files are real. That is CR-04's root cause with a different filename waiting to happen, so the
// remedy is structural: ONE constant, and a case in install.test.ts that walks it over the ACTUAL
// repository root and fails when a named file is not there. The full choice-of-pair reasoning and
// the runtime-artifact argument live with the constant; do not restate either here.
//
// THE PATH-EQUALITY HALF STAYS HERE, DELIBERATELY. It is not shared, because this binary and
// uninstall.ts resolve the target differently on purpose (uninstall.ts normalises with resolve()
// first; see its guard). Merging the two halves would silently pick one behaviour for both.
if (!ALLOW_SELF) {
    const looksLikeSource = TARGET === toPosix(GRUGOPS_SRC) || hasSourceMarkers(TARGET);
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
// isSymlink MOVED (plan 29.2-04) up into the primitives block beside report / verify / mkdirp /
// sameContent. It used to be declared here; the doctor now needs adapterDestHazard, which needs it,
// and a const declared below the `--check` early exit is in the temporal dead zone when the doctor
// runs. One authority for one predicate: there is no copy left at this position.
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
    // Red-team of plan 33.1-26 (D-18): the rename happens INSIDE the target or not at all. A symbolic
    // link or a non-directory on the way to `target` (plans/ linked elsewhere, say) would carry the
    // rename out of the target, so it is refused and reported; the leaf itself is renamed as a name
    // (a link is renamed, never followed).
    const way = wayTo(TARGET, target);
    if (way !== null && way !== "absent") {
        verify(`${label}: ${blockedAt(way, target)}. Nothing was backed up and nothing was renamed.`);
        return false;
    }
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
    // Red-team of plan 33.1-27 (sibling of B2): a backup install made is a directory (a renamed kit) or
    // a regular file (a renamed config); a link named like one is removed as a link, never followed.
    // On Node 24 rmSync with force left a dangling link in place and threw nothing, so `removed` is
    // printed only when the path is gone, and a failure is a counted verify, never a throw.
    try {
        if (lstatSync(path).isDirectory())
            rmSync(path, { recursive: true, force: true });
        else
            unlinkSync(path);
    }
    catch (e) {
        verify(`${path} could not be removed (${errCode(e)}). It was left in place; remove it by hand.`);
        return;
    }
    if (!gone(path)) {
        verify(`${path} is still present after its removal. Remove it by hand.`);
        return;
    }
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
    const marker = readMarker();
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
// `seededHeld`: an earlier legacy config of this same run is carried into the seeded path (asked by
// a caller that has not written it yet: the plan, or a DRY_RUN preview).
function configCarryStep(legacy, seededHeld) {
    const legacyRead = readForWrite(TARGET, legacy);
    if (legacyRead.state === "create")
        return { act: "none" };
    if (legacyRead.state === "blocked") {
        return {
            act: "refuse",
            at: "legacy",
            why: `user config ${blockedAt(legacyRead, legacy)}. It was left in place: it was not copied to ` +
                `${SEEDED_CONFIG} and not renamed to a .bak. Replace it with a regular file (or remove it) and re-run --migrate.`,
        };
    }
    if (seededHeld)
        return { act: "keep" };
    const seeded = readForWrite(TARGET, SEEDED_CONFIG);
    if (seeded.state === "blocked") {
        return {
            act: "refuse",
            at: "seeded",
            why: `user config ${legacy} was not carried forward: ${blockedAt(seeded, SEEDED_CONFIG)}. Both were left ` +
                `in place and ${legacy} was not renamed to a .bak. Make ${SEEDED_CONFIG} a regular file (or remove it) ` +
                `and re-run --migrate.`,
        };
    }
    return seeded.state === "create" ? { act: "carry", bytes: legacyRead.bytes, text: legacyRead.text } : { act: "keep" };
}
function planConfigCarry() {
    const refusals = [];
    let carried = null;
    for (const legacy of LEGACY_CONFIGS) {
        const step = configCarryStep(legacy, carried !== null);
        if (step.act === "refuse")
            refusals.push(step.why);
        else if (step.act === "carry")
            carried = { legacy, bytes: step.bytes, text: step.text };
    }
    return {
        refusals,
        render: carried === null
            ? { label: SEEDED_CONFIG, read: readUserFile(SEEDED_CONFIG) }
            : {
                label: `${carried.legacy} (the configuration this --migrate carries forward to ${SEEDED_CONFIG})`,
                read: { state: "ok", bytes: carried.bytes, text: carried.text },
            },
    };
}
// MIGRATE_CARRY_PENDING is declared above the doctor's early exit, with KIT_FILES.
// renderConfigInput: THE ONE ANSWER to "which configuration does the adapter render read", for the
// install run (real and DRY_RUN alike) and the doctor. `label` is the path the bytes come from, as
// every finding and the resolution line name it.
function renderConfigInput() {
    if (MIGRATE_CARRY_PENDING)
        return planConfigCarry().render;
    return { label: SEEDED_CONFIG, read: readUserFile(SEEDED_CONFIG) };
}
// migratePreSteps: the one-time relocation safety work, run ONLY when isOldLayout, and only after the
// --migrate pre-check (the config carry and the whole kit plan) refused nothing. After it the install
// run proceeds verbatim (D-02). Two steps, both never-delete-first and DRY_RUN-safe:
//   1. Carry the user's edited config forward (configCarryStep, above).
//   2. Back up the displaced in-repo agent-factory/ via backupIfDiffers (timestamped, differs-only,
//      D-08/D-09). The in-repo kit is NOT at KIT_ROOT, so copyKit's retainBackup does not cover it.
// The LANDMINE (Pitfall 1: never write through a live link at a resolver destination) is no longer a
// step here. Since plan 33.1-31 the kit plan (kitDestDecision) plans the unlink of install's OWN link
// for the write phase, on every run, and refuses any other link.
function migratePreSteps() {
    // 1. config-move (BOTH legacy locations, D-04). Each location is asked again here, live: the
    // pre-check asked before anything moved, and a step that changed since is reported, not trusted.
    let previewCarried = false;
    for (const legacy of LEGACY_CONFIGS) {
        const step = configCarryStep(legacy, DRY_RUN && previewCarried);
        if (step.act === "none")
            continue;
        if (step.act === "refuse") {
            verify(step.why);
            continue;
        }
        if (DRY_RUN) {
            if (step.act === "carry") {
                previewCarried = true;
                report("would-move", `user config ${legacy} → ${SEEDED_CONFIG} (original left as .bak)`);
            }
            else {
                report("would-move", `user config ${legacy} → .bak (.grugops/factory.config.json already present — kept, D-04)`);
            }
            continue;
        }
        if (step.act === "carry") {
            if (!writeTargetFile(SEEDED_CONFIG, step.bytes, "create", `user config ${legacy}`)) {
                // Not carried forward, so the original stays where it is, unrenamed (the verify says why).
                continue;
            }
            report("moved", `user config → ${SEEDED_CONFIG} (carried forward, D-04)`);
        }
        else {
            report("skipped", `user config (.grugops/factory.config.json already present — kept, D-04)`);
        }
        // Leave the original in place renamed to a timestamped .bak (never deleted, D-04).
        const bak = `${legacy}.bak.${isoStamp()}`;
        try {
            renameSync(legacy, bak);
        }
        catch (e) {
            verify(`user config ${legacy} could not be renamed to ${bak} (${errCode(e)}). It was left in place.`);
            continue;
        }
        report("backed-up", `original config → ${bak}`);
    }
    // 2. back up the displaced in-repo agent-factory/ (timestamped, differs-only — D-08/D-09).
    backupIfDiffers(join(TARGET, "agent-factory"), join(GRUGOPS_SRC, "agent-factory"), "in-repo agent-factory/");
}
// ensure_block: idempotent sentinel-delimited append to a user file. Never overwrites; skips
// if the open sentinel is already present; creates the file if absent. Never `>`-truncates.
//
// DC-3 / D-18 (plan 33.1-26): the file is read before anything is written or appended. A FIFO,
// directory, socket or device at the path is neither read nor written; the run reports a counted
// `verify` and goes on.
//
// Red-team of plan 33.1-26: it is asked through readForWrite, not readUserFile. A dangling link used
// to read as absent and the create went through it, outside the target; a link to a regular file
// read as ok and the append went through it; a FIFO where .github/ should be made the create throw.
// Each is now left untouched and reported. An absent file is created with an exclusive create that
// already carries the block (the same bytes the old empty-create-then-append produced).
function ensureBlock(file, open, body, close, label) {
    const cur = readForWrite(TARGET, file);
    if (cur.state === "blocked") {
        verify(`${label}: ${blockedAt(cur, file)}. It was left untouched and nothing was added to it.`);
        return;
    }
    if (cur.state === "ok" && cur.text.includes(open)) {
        report("skipped", `${label} (sentinel already present)`);
        return;
    }
    if (DRY_RUN) {
        report("would-add", label);
        return;
    }
    const block = `\n${open}\n${body}\n${close}\n`;
    if (cur.state === "create") {
        if (!writeTargetFile(file, block, "create", label))
            return;
        // Plan 33.1-28: readForWrite said nothing was there and the exclusive create succeeded, so
        // install created this file. Uninstall deletes it only on this record (createdFiles), and only
        // while the file still holds these bytes (red-team R1).
        recordCreatedFile(file, contentRecord(block));
    }
    else {
        try {
            appendFileSync(file, block);
        }
        catch (e) {
            verify(`${label}: ${file} could not be appended to (${errCode(e)}). Nothing was added to it.`);
            return;
        }
        // Red-team of plan 33.1-28 (R1): the file was there before this run, so it is not install's.
        const rel = targetRel(file);
        if (rel !== null)
            APPENDED_FILES.add(rel);
    }
    report("created", label);
}
// link_or_copy: D-30 symlink-with-copy-fallback, idempotent. Never clobbers a non-grugops
// user file (destinations are all grugops-owned paths).
//
// Red-team of plan 33.1-26 (D-18, DC-3): the kit source is read through readUserFile and the copy is
// written from those bytes (no copy call reopens a path). The destination is asked through
// readForWrite: the one link it accepts is the link a --symlink install made to this exact source
// (isOwnLink); any other link, dangling or not, and any special file or non-directory on the way, is
// left untouched and reported. A new file is made with an exclusive create.
//
// Returns the content record of what THIS call created at `dest` where nothing was before (a new
// link: linkRecord(src); a new copy through the exclusive create: contentRecord of the bytes written),
// so a caller that records created files (the AGENTS.md step, plan 33.1-28) records exactly those,
// with what was written. Every other outcome returns null.
//
// Since plan 33.1-31 the only caller is the AGENTS.md step. The kit skills it used to lay down (with
// the plan 33.1-30 `isKitFile` recording) go through the kit plan's copyKitFile, which takes the same
// decisions before the first kit write (D-32).
function linkOrCopy(src, dest, label) {
    const srcRead = readUserFile(src);
    if (srcRead.state === "absent") {
        report("skipped", `${label} (source missing: ${src})`);
        return null;
    }
    if (srcRead.state !== "ok") {
        verify(`${label}: the kit source ${src} ${unreadState(srcRead)}. Nothing was installed for it.`);
        return null;
    }
    if (isOwnLink(dest, src)) {
        report("skipped", `${label} (symlink present)`);
        return null;
    }
    // DC-3 / D-18 (plan 33.1-26): the destination is read before anything is written to it. A FIFO,
    // directory, socket or device there, or a file too large or unreadable, is left untouched.
    const destRead = readForWrite(TARGET, dest);
    if (destRead.state === "blocked") {
        verify(`${label}: ${blockedAt(destRead, dest)}. It was left untouched and nothing was copied over it.`);
        return null;
    }
    if (destRead.state === "ok" && destRead.text === srcRead.text) {
        report("skipped", `${label} (identical copy present)`);
        return null;
    }
    if (DRY_RUN) {
        report(INSTALL_MODE === "copy" ? "would-copy" : "would-link", label);
        return null;
    }
    if (INSTALL_MODE !== "copy" && destRead.state === "create") {
        const why = mkdirp(dirname(dest));
        if (why !== null) {
            verify(`${label}: ${why}. Nothing was linked or copied to ${dest}.`);
            return null;
        }
        try {
            symlinkSync(src, dest);
            if (isSymlink(dest)) {
                report("linked", label);
                return linkRecord(src);
            }
        }
        catch {
            // fall through to copy
        }
    }
    if (!writeTargetFile(dest, srcRead.bytes, destRead.state, label))
        return null;
    report("copied(verify)", label);
    return destRead.state === "create" ? contentRecord(srcRead.bytes) : null;
}
// GEMINI_RECORD (plan 33.1-29, Gap B / re-review CR-03, D-18): what THIS run did to
// .gemini/settings.json, as the geminiSettings record (install-marker.ts states the shape), or null
// when this run changed nothing there. mergeGemini sets it after a successful create or append, and
// writeMarker() records it: the most recent change is the one uninstall must reverse.
let GEMINI_RECORD = null;
// GEMINI_SEEN (plan 33.1-29; red-team B2): what THIS run learned from the settings file when it
// changed nothing there. null: it read nothing usable (a blocked path, bytes that are not UTF-8 or not
// JSON, a duplicate key on the path), or it never reached the file (an unreadable marker, a malformed
// ledger) — the run has no evidence either way, and writeMarker() writes the earlier record back
// verbatim. Otherwise the file was read: `listed` says context.fileName already named AGENTS.md,
// `fileNameContent` is jsonValueRecord(context.fileName) (null when there is none), and `refused` says
// this run refused to merge (a shape it cannot merge, or a failed write). writeMarker() carries an
// earlier record forward only when this equals the fileName that record describes (the carry needs
// proof); otherwise it records a claim of nothing, with the reason.
let GEMINI_SEEN = null;
// merge_gemini: additive edit of .gemini/settings.json context.fileName. Never `>`-clobbers a user's
// file, and never rewrites it either (red-team B3 of plan 33.1-29): json-text.ts splices only the
// fileName value into the original text, so every other byte of the user's file stays as it was.
//
// RECORDED, AND ONLY WHERE IT CAN BE RECORDED (plan 33.1-29, Gap B / re-review CR-03, D-18). What this
// run does to the file is recorded as GEMINI_RECORD (created it, or appended "AGENTS.md" and the shape
// it found), so uninstall can reverse exactly that. So the ledger is asked first: an unreadable marker
// or a malformed geminiSettings record means the change could not be recorded, and nothing is merged
// (a counted verify says so).
//
// ONLY A SHAPE IT CAN MERGE AND REVERSE (CR-03 point 3, install side). A file that is not valid UTF-8,
// is not strict JSON (comments, a trailing comma), is not a JSON object, has a duplicate `context` key
// or a duplicate context.fileName key, has a `context` that is not a JSON object, or has a
// context.fileName that is neither a string nor an array of strings is a COUNTED verify and is left
// untouched. The spliced text is parsed again and must hold exactly the value the merge intends
// (sameJsonValue); anything else is refused too, so a defect in the splice cannot write a wrong file.
function mergeGemini() {
    const file = join(TARGET, ".gemini", "settings.json");
    const rel = ".gemini/settings.json";
    const want = "AGENTS.md";
    const byHand = "add AGENTS.md to context.fileName by hand if you want Gemini CLI to read it";
    const previousMarker = readInstallMarker(TARGET);
    if (previousMarker.state === "unreadable") {
        verify(`${rel}: .grugops/install.json could not be read as a JSON object (${previousMarker.why}), so the Gemini ` +
            `settings ledger cannot be updated; AGENTS.md was not added — ${byHand}.`);
        return;
    }
    if (readGeminiLedger(previousMarker.state === "ok" ? previousMarker.marker : null).state === "malformed") {
        verify(`${rel}: the Gemini settings ledger (geminiSettings) in .grugops/install.json is malformed, so it cannot be ` +
            `updated and was written back unchanged; AGENTS.md was not added — ${byHand}. Fix or delete the field, ` +
            `then re-run the installer.`);
        return;
    }
    // DC-3 / D-18 (plan 33.1-26): read before any write. A settings file that is not a readable
    // regular file within the bound is left untouched and reported. Red-team of plan 33.1-26: asked
    // through readForWrite, so a link at the path (dangling or not) or a non-directory where .gemini/
    // should be is refused the same way, and a new file is made with an exclusive create.
    const cur = readForWrite(TARGET, file);
    if (cur.state === "blocked") {
        verify(`${rel}: ${blockedAt(cur, file)} — left untouched; ${byHand}.`);
        return;
    }
    if (cur.state === "create") {
        if (DRY_RUN) {
            report("would-add", `${rel} (context.fileName: [AGENTS.md, GEMINI.md])`);
            return;
        }
        const fileName = ["AGENTS.md", "GEMINI.md"];
        const text = JSON.stringify({ context: { fileName } }, null, 2) + "\n";
        if (!writeTargetFile(file, text, "create", rel)) {
            GEMINI_SEEN = { listed: false, fileNameContent: null, refused: true };
            return;
        }
        // Plan 33.1-29: readForWrite said nothing was there and the exclusive create succeeded, so this
        // run created the file. Uninstall deletes it whole only on this record, and only while it holds
        // these bytes.
        GEMINI_RECORD = {
            createdFile: true,
            addedEntry: true,
            createdContext: true,
            fileNameBefore: "absent",
            fileNameContent: jsonValueRecord(fileName),
            fileContent: contentRecord(text),
        };
        report("created", `${rel} (context.fileName wiring)`);
        return;
    }
    const doc = readJsonText(cur.bytes);
    if (!doc.ok) {
        verify(`${rel} ${doc.why} — left untouched; ${byHand}.`);
        return;
    }
    const refuse = (why, seen) => {
        verify(`${rel} ${why} — left untouched; ${byHand}.`);
        GEMINI_SEEN = seen === null ? null : { ...seen, refused: true };
    };
    const root = doc.root;
    if (root.kind !== "object") {
        refuse("is not a JSON object", { listed: false, fileNameContent: null });
        return;
    }
    if (keyCount(root, "context") > 1) {
        refuse('has more than one "context" key, so which one Gemini CLI reads is not known', null);
        return;
    }
    const ctxMember = memberNamed(root, "context");
    const ctxNode = ctxMember === null ? null : ctxMember.value;
    if (ctxNode !== null && ctxNode.kind !== "object") {
        refuse('has a "context" value that is not a JSON object', { listed: false, fileNameContent: null });
        return;
    }
    if (ctxNode !== null && keyCount(ctxNode, "fileName") > 1) {
        refuse('has more than one "context.fileName" key, so which one Gemini CLI reads is not known', null);
        return;
    }
    const fnMember = ctxNode === null ? null : memberNamed(ctxNode, "fileName");
    const hasFileName = fnMember !== null;
    const fileName = fnMember === null ? undefined : valueOf(doc.text, fnMember.value);
    const seenContent = jsonValueRecord(fileName);
    const isStringArray = Array.isArray(fileName) && fileName.every((x) => typeof x === "string");
    if (hasFileName && typeof fileName !== "string" && !isStringArray) {
        refuse('has a "context.fileName" value that is neither a string nor an array of strings', { listed: false, fileNameContent: seenContent });
        return;
    }
    if (fileName === want || (isStringArray && fileName.includes(want))) {
        // Plan 33.1-29: this run changed nothing; what it saw is what writeMarker() needs to decide whether
        // an earlier record still describes the file (the carry needs proof).
        GEMINI_SEEN = { listed: true, fileNameContent: seenContent, refused: false };
        report("skipped", `${rel} (context.fileName already lists AGENTS.md)`);
        return;
    }
    const fileNameBefore = !hasFileName ? "absent" : typeof fileName === "string" ? "string" : "array";
    const next = fileNameBefore === "absent" ? [want] : fileNameBefore === "string" ? [fileName, want] : [...fileName, want];
    // THE SPLICE (red-team B3): the one change, made to the original text.
    const newText = ctxNode === null
        ? addMember(doc.text, root, "context", { fileName: next })
        : fnMember === null
            ? addMember(doc.text, ctxNode, "fileName", next)
            : fileNameBefore === "string"
                ? wrapInArray(doc.text, ctxNode, fnMember.value, [want])
                : appendElements(doc.text, fnMember.value, [want]);
    // THE ORACLE: the spliced text must hold exactly the merged value, and nothing else may differ.
    const expected = documentValue(doc);
    if (ctxNode === null)
        expected.context = { fileName: next };
    else
        expected.context.fileName = next;
    const check = readJsonText(Buffer.from(newText, "utf8"));
    if (!check.ok || !sameJsonValue(documentValue(check), expected)) {
        refuse("could not be edited in place without changing anything but context.fileName", { listed: false, fileNameContent: seenContent });
        return;
    }
    if (DRY_RUN) {
        report("would-add", `${rel} (merge AGENTS.md into context.fileName)`);
        return;
    }
    if (!writeTargetFile(file, newText, "ok", rel)) {
        GEMINI_SEEN = { listed: false, fileNameContent: seenContent, refused: true };
        return;
    }
    GEMINI_RECORD = {
        createdFile: false,
        addedEntry: true,
        createdContext: ctxNode === null,
        fileNameBefore,
        fileNameContent: jsonValueRecord(next),
    };
    report("created", `${rel} (merged AGENTS.md into context.fileName)`);
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
// renderAdaptersInMirror: build the mirror, run the generator in it, and hand the result to `use`.
//
// A HOISTED DECLARATION, NOT A CONST ARROW, and it takes ONE argument — a callback. Both are
// deliberate. The declaration form means the install run below and any later caller reach it without
// a temporal-dead-zone hazard, wherever they sit in the file. The callback means the mirror
// directory lives EXACTLY as long as the block that reads it: `use` is invoked inside this
// function's own `try`, the `finally` removes the tree on every path out including a throw, and no
// directory handle can escape to be read after cleanup.
function renderAdaptersInMirror(use) {
    // 1. The twins, checked BEFORE anything is created. An absent twin is the partial-checkout shape,
    //    and it is reported as the ABSENCE OF A VERDICT rather than as a clean one — the same
    //    unreadable-versus-empty distinction install/kit-source.ts draws for its own derivations.
    const missingTwins = GENERATOR_TWINS.filter((rel) => !existsSync(join(GRUGOPS_SRC, ...rel.split("/"))));
    if (missingTwins.length > 0) {
        use({
            ok: false,
            reason: `the adapter render could not start: ${missingTwins.length} of ${GENERATOR_TWINS.length} ` +
                `compiled generator file(s) are absent from the kit checkout at ${GRUGOPS_SRC} — ` +
                `${missingTwins.join(", ")}. NO VERDICT on this target's adapters was produced, which is a ` +
                `different fact from a clean one: the render was never able to run, so what these adapters ` +
                `should contain is unknown rather than known to be unchanged. Re-run the installer from a ` +
                `complete kit checkout, or run the kit's build there so the committed .js twins exist.`,
        });
        return;
    }
    // 1b. THE TEMP ROOT ITSELF. `mkdtempSync` is the first thing that can fail and the one thing the
    //     `finally` below cannot clean up after, because there is no directory yet. A throw here used
    //     to be uncaught: the process died at exit 1 with a raw stack, AFTER the kit and skills
    //     classes had already written and BEFORE the state seed and the marker, and printed no banner
    //     at all. Found by an independent review of this phase's diff and reproduced with TMPDIR
    //     pointing at an absent path.
    let dir;
    try {
        dir = mkdtempSync(join(tmpdir(), "grugops-install-render-"));
    }
    catch (e) {
        use({
            ok: false,
            reason: `the adapter render could not start: no temporary directory could be created under ` +
                `${tmpdir()} (${e instanceof Error ? e.message : String(e)}), so the render had nowhere to ` +
                `run. NO VERDICT on this target's adapters was produced. Make the system temporary ` +
                `directory writable — or point TMPDIR at one that is — and re-run.`,
        });
        return;
    }
    try {
        // 2. The mirror layout. Only these directories are created here; agent-factory/roles and
        //    agent-factory/packaging arrive through cpSync below, and no agent-factory/config path is
        //    ever built inside the mirror (D-06).
        //
        //    AND THE WHOLE OF IT IS GUARDED, BECAUSE THE PRE-CHECK ABOVE DOES NOT COVER IT. That check
        //    asks about the four compiled twins and says NOTHING about the two kit-source trees — so a
        //    checkout missing agent-factory/roles passes it and then makes `cpSync` throw. Uncaught,
        //    that was a stack trace at exit 1 with no banner: exactly the partial checkout the pre-check
        //    exists for, arriving through the door it does not watch. The absent input is named here
        //    rather than crashed on. (Found by an independent review of this phase's diff.)
        try {
            mkdirSync(join(dir, "scripts"), { recursive: true });
            mkdirSync(join(dir, ".claude", "agents"), { recursive: true });
            writeFileSync(join(dir, "package.json"), MIRROR_PACKAGE_JSON);
            for (const rel of GENERATOR_TWINS) {
                cpSync(join(GRUGOPS_SRC, ...rel.split("/")), join(dir, ...rel.split("/")));
            }
            for (const rel of GENERATOR_KIT_SOURCES) {
                cpSync(join(GRUGOPS_SRC, ...rel.split("/")), join(dir, ...rel.split("/")), {
                    recursive: true,
                });
            }
            // The reader probe, beside the twins so its relative import of ./model-tiers.js resolves the
            // same way the generator's own imports do.
            writeFileSync(join(dir, "scripts", RESOLUTION_PROBE_REL), RESOLUTION_PROBE_SOURCE);
        }
        catch (e) {
            use({
                ok: false,
                reason: `the adapter render could not start: the render mirror could not be built from the kit ` +
                    `checkout at ${GRUGOPS_SRC} (${e instanceof Error ? e.message : String(e)}). The four ` +
                    `compiled generator file(s) were all present, so this is a different condition from the ` +
                    `absent-twin one: the inputs the generator READS — ${GENERATOR_KIT_SOURCES.join(", ")} — ` +
                    `or the mirror's own layout could not be assembled. NO VERDICT on this target's adapters ` +
                    `was produced. Re-run the installer from a complete kit checkout.`,
            });
            return;
        }
        // 3. THE ONE NEW INPUT (D-05, D-06). The target's own configuration file, copied WHOLESALE and
        //    only when it already exists. Nothing is ever read out of it on this side and joined onto a
        //    path (T-29.2-03): the file crosses the boundary as bytes, and only the generator reads
        //    values from it. When the file is absent the generator takes its own zero-config path, which
        //    is the same answer the seed written later in this run would give, since the seed carries no
        //    `models` key — so a fresh install has no non-inherit answer to miss (D-05).
        //
        //    AND THE COPY IS GUARDED, BECAUSE existsSync ANSWERS A DIFFERENT QUESTION THAN THE ONE THE
        //    COPY ASKS. `existsSync` says a path resolves; it does not say the path is a readable file.
        //    A `.grugops/factory.config.json` that is a DIRECTORY (or a file this process cannot read)
        //    passes it and makes `copyFileSync` throw — and an uncaught throw here is a stack trace at
        //    exit 1 with no other install class completed, which is exactly the crash-where-a-finding-
        //    belongs shape the twins pre-check above was added to delete. Reproduced against the
        //    committed build before this guard existed, on both the install and the --check path.
        //
        //    DC-3 (plan 33.1-26): the configuration is read through readUserFile and the mirror copy is
        //    written from those bytes. A copy call would reopen the path by name, and on a FIFO it
        //    blocks. A path that is not a readable regular file within the bound gets the same refusal.
        //
        //    WHICH configuration is renderConfigInput's answer, the one authority (red-team B3 of plan
        //    33.1-31): the target's .grugops/factory.config.json, or, in a --migrate run over an old layout,
        //    the legacy configuration that run carries forward there. The real run and the DRY_RUN preview
        //    ask it at the same point (before the pre-steps move anything), so they render the same bytes.
        const renderConfig = renderConfigInput();
        const targetConfig = renderConfig.label;
        let configPath = null;
        const configRead = renderConfig.read;
        if (configRead.state !== "absent") {
            try {
                if (configRead.state !== "ok")
                    throw new Error(`it ${unreadState(configRead)}`);
                mkdirSync(join(dir, ".grugops"), { recursive: true });
                writeFileSync(join(dir, ".grugops", "factory.config.json"), configRead.bytes);
            }
            catch (e) {
                use({
                    ok: false,
                    reason: `the adapter render could not start: the model configuration at ${targetConfig} exists ` +
                        `but could not be read as a file (${e instanceof Error ? e.message : String(e)}). This ` +
                        `is not the same fact as an absent configuration, which resolves every role to the ` +
                        `generator's zero-config answer — this path resolves to something, so what it means is ` +
                        `unknown rather than known to be nothing, and reading it as absent would silently ` +
                        `install a resolution the file was never asked about. Make that path a readable JSON ` +
                        `file, or remove it, and re-run.`,
                });
                return;
            }
            configPath = targetConfig;
        }
        // 4. The spawn. `process.execPath` rather than a bare launcher name, so there is no PATH or
        //    PATHEXT lookup and the interpreter is the one already running (T-29.2-01). NEVER a `shell`
        //    option, and no target-derived string appears in argv.
        //
        //    THE CHILD ENVIRONMENT IS INHERITED, AND THAT IS A STATEMENT ABOUT TODAY. The generator
        //    reads NO resolution-affecting environment variable: its ROOT and OUT_DIR are fixed literals
        //    resolved against its own location inside the mirror, and its configuration comes from the
        //    file copied in above. If one is ever added, it MUST be deleted from the child environment
        //    BY NAME here — the rule scripts/adapters-freshness.ts already applies to its own CHECK_ROOT
        //    override, and for the same reason: an inherited override would silently point the render at
        //    a different resolution than the one this run is reporting.
        const child = spawnSync(process.execPath, [join(dir, "scripts", "generate-role-adapters.js")], {
            encoding: "utf8",
            env: process.env,
        });
        // 5. Fail-closed. A non-zero status, or a spawn that produced no status at all, installs
        //    nothing. The generator's OWN message is relayed verbatim — it already names the role, the
        //    offending value and the legal set (D-03), and re-authoring that sentence here would be a
        //    second refusal grammar drifting away from the first.
        if (child.status !== 0) {
            const detail = `${child.stderr ?? ""}${child.stdout ?? ""}`.trim();
            use({
                ok: false,
                reason: `the adapter render did not complete: the mirrored generator exited ` +
                    `${child.status === null ? "without a status" : String(child.status)}` +
                    `${child.error ? ` (${child.error.message})` : ""}. Its own message follows verbatim:\n` +
                    `${detail === "" ? "  (the generator produced no output)" : detail}`,
            });
            return;
        }
        // 6. The rendered set, DERIVED by reading the mirror's own output directory. An unreadable
        //    directory is its own condition with its own remedy, never folded into the branch above.
        let files;
        try {
            files = readdirSync(join(dir, ".claude", "agents"))
                .filter((name) => name.endsWith(".md"))
                .sort();
        }
        catch (e) {
            use({
                ok: false,
                reason: `the adapter render ran cleanly but its output directory could not be read ` +
                    `(${e instanceof Error ? e.message : String(e)}), so the rendered set is unknown. This is ` +
                    `not the same fact as an empty render: nothing was read, so nothing is known. No adapter ` +
                    `was installed. Check that the system temporary directory is writable and re-run.`,
            });
            return;
        }
        // 7. The announced resolution, read back through the module that owns the grammar. THREE
        //    DIFFERENT CONDITIONS, THREE DIFFERENT REMEDIES, each named: the probe could not run; it
        //    ran but did not print exactly one readable line; or it read something other than exactly
        //    one well-formed announcement.
        const generatorStdout = child.stdout ?? "";
        const probe = spawnSync(process.execPath, [join(dir, "scripts", RESOLUTION_PROBE_REL)], {
            encoding: "utf8",
            env: process.env,
            input: generatorStdout,
        });
        if (probe.status !== 0) {
            use({
                ok: false,
                reason: `the adapter render completed but the resolution could not be read back: the reader ` +
                    `exited ${probe.status === null ? "without a status" : String(probe.status)}` +
                    `${probe.error ? ` (${probe.error.message})` : ""}. Without it this run cannot cross-check ` +
                    `what the generator announced against what it produced, and installing over an unchecked ` +
                    `resolution would be installing a set it cannot vouch for. Its message follows:\n` +
                    `${(probe.stderr ?? "").trim() || "  (the reader produced no output)"}`,
            });
            return;
        }
        const probeLines = (probe.stdout ?? "").split("\n").filter((l) => l.trim() !== "");
        if (probeLines.length !== 1) {
            use({
                ok: false,
                reason: `the adapter render completed but the resolution reader printed ${probeLines.length} ` +
                    `line(s) where exactly one was required, so its answer cannot be read. No adapter was ` +
                    `installed. Re-run the installer from a complete kit checkout.`,
            });
            return;
        }
        let announced = null;
        let announceProblem = "";
        try {
            const parsed = JSON.parse(probeLines[0]);
            const results = Array.isArray(parsed.results) ? parsed.results : null;
            if (results === null) {
                announceProblem = "the reader's answer did not carry a list of results";
            }
            else if (results.length !== 1) {
                // Zero means the run announced nothing; two or more means a stream carrying two
                // announcements, which is ambiguous rather than agreeable. Neither is a default.
                announceProblem =
                    `the generator's output carried ${results.length} resolved-assignment announcement(s) ` +
                        "where exactly one was required";
            }
            else {
                const one = results[0];
                if (one.ok !== true) {
                    announceProblem = `the announced resolution was refused by name — ${String(one.reason ?? "no reason given")}`;
                }
                else {
                    const v = one.value;
                    const aliases = Array.isArray(v.aliases) ? v.aliases : null;
                    if (typeof v.roles !== "number" ||
                        typeof v.overrides !== "number" ||
                        aliases === null ||
                        aliases.some((a) => typeof a !== "string")) {
                        announceProblem = "the announced resolution did not carry the declared shape";
                    }
                    else {
                        announced = {
                            roles: v.roles,
                            overrides: v.overrides,
                            aliases: aliases,
                        };
                    }
                }
            }
        }
        catch (e) {
            announceProblem = `the reader's answer is not parseable JSON (${e instanceof Error ? e.message : String(e)})`;
        }
        if (announced === null) {
            use({
                ok: false,
                reason: `the adapter render completed but this run cannot read what it resolved: ` +
                    `${announceProblem}. An unreadable announcement is not an agreement — reading silence as ` +
                    `consent is exactly the failure the announcement exists to prevent — so no adapter was ` +
                    `installed and every pre-existing target adapter was left as it was.`,
            });
            return;
        }
        use({
            ok: true,
            value: { dir, files, stdout: generatorStdout, configPath, assignment: announced },
        });
    }
    finally {
        // The installer has many exit paths and registers no exit handler, so cleanup is a `finally`
        // around the whole body rather than a process-level hook. `maxRetries` covers a Windows host
        // where a just-closed child still holds a handle for a moment (T-29.2-05).
        //
        // AND A CLEANUP FAILURE CANNOT AUTHOR THE RUN'S VERDICT (plan 29.2-05, WR-03). `rmSync` THROWS
        // after its retries on EBUSY / EPERM / ENOTEMPTY — documented Node behaviour, and the exact
        // shape a Windows antivirus or indexer produces over a just-written temp tree, which this phase
        // records as `UNKNOWN - verify`. Unguarded, that throw escaped this helper: on the install path
        // AFTER all seventeen adapters had been written and BEFORE seedState() / writeMarker(), so the
        // process died at exit 1 with a raw stack, no closing banner, and a target holding adapters and
        // no marker; on the `--check` path it killed the doctor mid-verdict. That is the
        // crash-where-a-finding-belongs shape R1 and F-D were already fixed for, sitting one line after
        // them.
        //
        // WHY `report` AND NOT `verify()` — DECIDED HERE RATHER THAN LEFT IMPLICIT, because the review
        // asked for the choice and not for a default. `verify()` increments VERIFY_FINDINGS, which
        // drives `process.exitCode = 3`, and exit 3 in this installer means an install CLASS was refused
        // and a human must resolve it (D-03). A temp directory the operating system would not release is
        // housekeeping on a run that already completed its work; making it exit 3 would tell every
        // downstream consumer that an install class failed when none did, and would give one exit code
        // two meanings. So it takes its OWN label — `cleanup` — and the line cannot be read as a
        // findings-tier verdict it deliberately is not.
        try {
            rmSync(dir, { recursive: true, force: true, maxRetries: 3 });
        }
        catch (e) {
            report("cleanup", `the render mirror at ${dir} could not be removed ` +
                `(${e instanceof Error ? e.message : String(e)}). It holds no target data, it changes ` +
                `nothing this run reported, and it can be deleted by hand.`);
        }
    }
}
// The frontmatter key a rendered adapter carries its resolved alias on. A whole-line PREFIX test,
// matching how the generator emits it (`model: ` then the alias, on its own line).
const RENDERED_MODEL_KEY = "model: ";
function readRenderedAlias(text, label) {
    const found = text.split("\n").filter((line) => line.startsWith(RENDERED_MODEL_KEY));
    if (found.length !== 1) {
        return {
            ok: false,
            reason: `${label} was rendered carrying ${found.length} line(s) beginning "${RENDERED_MODEL_KEY}" ` +
                `where exactly one was required, so the model this adapter would be installed with cannot ` +
                `be stated. Zero and two are different defects from a wrong value and neither is read as ` +
                `the other; reporting the first match would hide both.`,
        };
    }
    return { ok: true, value: found[0].slice(RENDERED_MODEL_KEY.length) };
}
// transformAdapter: the PURE half of materialization. Takes a source file's text and returns the
// final text plus the recognised banner count. It writes nothing, reads nothing off disk and
// depends on no argument but its input and KIT_ROOT, which is what lets THREE callers share one
// authority: the writer below, the agents loop's pre-write banner floor, and the --check doctor's
// like-for-like staleness comparison. A second implementation of this transform anywhere would be
// two grammars over the same bytes, which is the failure class this milestone exists to delete.
//
// ONE STATE MACHINE OVER BOTH SLOTS, whole-line equality throughout and never a pattern — the same
// test carriesSlot uses to ROUTE a file here, so routing and injection cannot disagree:
//   - a line equal to either open sentinel starts a buffered block; the matching close drops the
//     buffer; anything else inside is buffered;
//   - a line equal to the kit slot line injects the kit block above it and keeps the slot line;
//   - a line equal to the generator banner is REPLACED by the banner block, and counted;
//   - CR-01 (bounded removal): an UNTERMINATED block at end of file restores its buffered lines
//     verbatim, so no content is ever swallowed — the guarantee is "lose nothing", and it now
//     covers the second slot because there is only one loop to give it.
//
// THE TWO SLOTS ARE NOT SYMMETRIC, AND D-14's "handled like `KIT=`" OVERSTATES IT (plan 29.2-05,
// IN-01). The kit slot PRESERVES its anchor: `MAT_SLOT` is re-emitted after the injected block, so
// feeding this function's own output back through it yields the same text — T(T(x)) = T(x). The
// banner slot CONSUMES its anchor: `KIT_BANNER` is REPLACED by the `BAN_OPEN…BAN_CLOSE` block, and
// that block is stripped on re-entry with nothing left behind to re-trigger the injection. So a
// materialized file fed back through this transform yields ZERO banners, not one.
//
// AND HERE IS THE REACHABILITY BOUND THAT MAKES THAT HARMLESS TODAY, stated rather than left to be
// inferred from the absence of a bug report. Nothing feeds this function its own output: agent
// sources are always FRESH RENDERS from the mirror, the one slot-carrying skill source is KIT TEXT,
// and `--migrate` runs its pre-steps and then the ordinary install over those same two sources. The
// banner floor that counts on exactly one banner is asked only about freshly rendered agent bytes,
// for the same reason. This is a CORRECTED CLAIM, not a behaviour change: making the banner slot
// anchor-preserving would move rendered bytes in every target, and that is not what this comment is
// for.
function transformAdapter(srcText) {
    const out = [];
    let close = null;
    let buf = [];
    let banners = 0;
    for (const line of srcText.split("\n")) {
        if (close === null && (line === MAT_OPEN || line === BAN_OPEN)) {
            close = line === MAT_OPEN ? MAT_CLOSE : BAN_CLOSE;
            buf = [];
            continue;
        }
        if (close !== null) {
            if (line === close) {
                close = null; // terminated block → drop the buffer
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
        if (line === KIT_BANNER) {
            out.push(BAN_OPEN);
            out.push(TARGET_BANNER);
            out.push(BAN_CLOSE);
            banners += 1;
            continue;
        }
        out.push(line);
    }
    // Unterminated open at EOF: the block never closed → restore what we buffered (lose nothing).
    if (close !== null && buf.length > 0) {
        for (const line of buf)
            out.push(line);
    }
    return { text: out.join("\n"), banners };
}
// kitDestDecision: the one question about a kit destination. THE WRITE BOUND (plan 29.2-04, CR-01) is
// asked first for a materialize destination: a link, or a path that resolves outside the target
// through a linked directory, is refused before the destination is read, so `skipped (identical copy
// present)` is never printed about bytes outside the target. Then the destination is read through
// readForWrite (DC-3 / D-18: a FIFO, a directory, a hard link, an unreadable or too-large file, or a
// link or non-directory on the way is refused), and only then compared (D-11: build, compare, write).
//
// INSTALL'S OWN LINK IS REPLACED, ON EVERY RUN (red-team B1 of plan 33.1-31). A materialize
// destination that is exactly the link an install made before the render (isOwnLink: readlink equals
// THIS checkout's kit source path for that file, the predicate uninstall uses) is install's content,
// and the kit write replaces it: it is unlinked in the write phase, just before its file is written,
// and only in a run whose plan refused nothing. Before, only a --migrate over an old layout did this,
// so a target whose --migrate refused (and wrote its marker) could never be completed by any run.
// ANY OTHER LINK IS REFUSED, NEVER UNLINKED: it may be the user's, or point into another checkout.
//
// THE LIMITS ARE ASKED HERE TOO (red-team borderlines (a) and (b) of plan 33.1-31): a destination
// over the platform path limits, or one this process cannot write (the nearest existing directory
// for a create, the file for a rewrite, the holding directory for an unlink), is refused in the
// plan. Before, each failed in the write phase, after other kit files had been written.
function kitDestDecision(e) {
    const dest = e.dest;
    if (e.kind === "missing")
        return { act: "skip", line: `${e.label} (source missing: ${e.src})`, record: null };
    const tooLong = pathLimitProblem(dest);
    if (tooLong !== null)
        return { act: "refuse", why: `${e.label} — ${dest} ${tooLong}. Nothing was written.` };
    const writable = (how) => {
        const why = writeAccessProblem(dest, how);
        return why === null ? null : `${e.label} — ${dest} ${why}. It was left untouched and nothing was written.`;
    };
    if (e.kind === "materialize") {
        const final = e.text ?? "";
        if (isOwnLink(dest, e.src)) {
            // The unlink happens inside the target or not at all: a link or non-directory on the way would
            // carry the removal out of it (red-team of plan 33.1-26).
            const way = wayTo(TARGET, dest);
            if (way !== null) {
                const where = way === "absent" ? `${dest} could not be reached` : blockedAt(way, dest);
                return { act: "refuse", why: `${e.label} — install's own link ${where}. Nothing was unlinked.` };
            }
            const cannot = writable("unlink");
            return cannot === null ? { act: "unlink" } : { act: "refuse", why: cannot };
        }
        if (isSymlink(dest)) {
            return {
                act: "refuse",
                why: `${e.label} — ${dest} is a symbolic link that is not the one install makes (install's own link here ` +
                    `points at ${e.src}). Install replaces only its own link, so this one was left in place, not followed ` +
                    `and not unlinked, and nothing was written. Replace it with a regular file (or remove it) and re-run.`,
            };
        }
        const hazard = adapterDestHazard(dest);
        if (hazard !== null)
            return { act: "refuse", why: `${e.label} — ${hazard}` };
        const destRead = readForWrite(TARGET, dest);
        if (destRead.state === "blocked") {
            return { act: "refuse", why: `${e.label} — ${blockedAt(destRead, dest)}. It was left untouched and nothing was written.` };
        }
        if (destRead.state === "ok" && destRead.text === final) {
            // The destination holds exactly what install writes there, so it is recorded as install's
            // (kitFiles, plan 33.1-30). The wording is linkOrCopy's for an identical copy: one sentence, one fact.
            return { act: "skip", line: `${e.label} (identical copy present)`, record: contentRecord(final) };
        }
        const cannot = writable(destRead.state);
        return cannot === null ? { act: "write", how: destRead.state } : { act: "refuse", why: cannot };
    }
    // copy / link: a --symlink install's own link to this exact source is install's content.
    if (isOwnLink(dest, e.src))
        return { act: "skip", line: `${e.label} (symlink present)`, record: linkRecord(e.src) };
    const destRead = readForWrite(TARGET, dest);
    if (destRead.state === "blocked") {
        return { act: "refuse", why: `${e.label}: ${blockedAt(destRead, dest)}. It was left untouched and nothing was copied over it.` };
    }
    if (destRead.state === "ok" && destRead.text === e.srcText) {
        return { act: "skip", line: `${e.label} (identical copy present)`, record: contentRecord(e.bytes ?? Buffer.alloc(0)) };
    }
    const cannot = writable(destRead.state);
    return cannot === null ? { act: "write", how: destRead.state } : { act: "refuse", why: cannot };
}
// materializeAdapter: lay one materialize entry down from its FINAL text (captured in memory by
// buildKitPlan; nothing here reads the render mirror, which is gone by now), writing ONLY when the
// final bytes differ from what the destination already holds (D-11). The write bound, the
// identical-skip and the preview are kitDestDecision's, asked again here at the write.
//
// OWNERSHIP (D-13, D-32). A target's `.claude/agents/grugops-*.md` files are KIT-OWNED DERIVED
// ARTIFACTS, and the configuration file is the one place to set a model. A differing one is rewritten
// on re-run and reported by name, but never silently: D-32's edited-file pre-flight (kitPreflight,
// plan 33.1-32) runs over the finished plan before any of this, and a file that no longer holds what
// install wrote is rewritten only after the human consented and it was backed up.
//
// `alias` is reporting-only (D-04): an agent adapter's line names the model it was rendered with; a
// skill carries none and its line is byte-unchanged. The alias never reaches the written bytes.
//
// THE PREVIEW IS TAKEN FROM THE SAME DECISION AS THE RUN (plan 29.2-05, WR-01): `would-materialize` is
// printed only where the real run would write.
function materializeAdapter(e) {
    const suffix = e.alias === undefined ? `(KIT=${KIT_ROOT})` : `(KIT=${KIT_ROOT}, model=${e.alias})`;
    let d = kitDestDecision(e);
    if (d.act === "unlink" && e.unlinkFirst !== true) {
        // The plan did not mark this destination: what is there changed since the plan asked.
        verify(`${e.label} — ${e.dest} became a symbolic link after the kit plan was built. It was left in place and nothing was written.`);
        return;
    }
    if (d.act === "unlink") {
        // Pitfall 1, in the write phase (plan 33.1-31): install's own link is removed just before its file
        // is written, and only in a run whose plan refused nothing. unlinkSync removes the link itself,
        // whatever it points at; a failure is a counted verify, and `unlinked` is printed only when the
        // link is gone (red-team of plan 33.1-27).
        if (DRY_RUN) {
            // The preview names both halves of what the run would do, and does neither.
            report("would-unlink", `symlink adapter ${e.dest} (never write through a live symlink — Pitfall 1)`);
            report("would-materialize", `${e.label} ${suffix}`);
            return;
        }
        try {
            unlinkSync(e.dest);
        }
        catch (err) {
            verify(`symlink adapter ${e.dest} could not be unlinked (${errCode(err)}). It was left in place and nothing was written through it.`);
            return;
        }
        if (!gone(e.dest)) {
            verify(`symlink adapter ${e.dest} is still present after it was unlinked. Nothing was written through it; remove it by hand.`);
            return;
        }
        report("unlinked", `symlink adapter ${e.dest} (re-materialized as a real file — Pitfall 1)`);
        d = kitDestDecision(e);
    }
    if (d.act === "unlink") {
        verify(`${e.label} — ${e.dest} is still a symbolic link after it was unlinked. Nothing was written through it.`);
        return;
    }
    if (d.act === "refuse") {
        verify(d.why);
        return;
    }
    if (d.act === "skip") {
        if (d.record !== null)
            recordKitFile(e.dest, d.record);
        report("skipped", d.line);
        return;
    }
    if (DRY_RUN) {
        report("would-materialize", `${e.label} ${suffix}`);
        return;
    }
    const final = e.text ?? "";
    if (writeTargetFile(e.dest, final, d.how, e.label)) {
        // What install wrote to this kit file, so uninstall removes it only while it holds it (plan 33.1-30).
        recordKitFile(e.dest, contentRecord(final));
        report("materialized", `${e.label} ${suffix}`);
    }
}
// copyKitFile: lay one copy/link entry (a skill without the slot line) down from the kit source bytes
// buildKitPlan read, D-30 symlink-with-copy-fallback under a non-copy INSTALL_MODE. What linkOrCopy
// did for the skills before plan 33.1-31, with the decision taken by kitDestDecision: a --symlink
// install's own link is skipped as install's; any other link, special file or non-directory on the way
// is refused; a new file is made with an exclusive create. Every outcome that leaves install's content
// at the destination is recorded in kitFiles (`link:<src>` or `sha256:` of the source bytes).
function copyKitFile(e) {
    const d = kitDestDecision(e);
    if (d.act === "refuse") {
        verify(d.why);
        return;
    }
    if (d.act === "skip") {
        if (d.record !== null)
            recordKitFile(e.dest, d.record);
        report("skipped", d.line);
        return;
    }
    if (d.act === "unlink") {
        verify(`${e.label} — ${e.dest}: an unlink was asked for a file that is copied, not materialized. Nothing was written.`);
        return;
    }
    if (DRY_RUN) {
        report(INSTALL_MODE === "copy" ? "would-copy" : "would-link", e.label);
        return;
    }
    const bytes = e.bytes ?? Buffer.alloc(0);
    if (e.kind === "link" && d.how === "create") {
        const why = mkdirp(dirname(e.dest));
        if (why !== null) {
            verify(`${e.label}: ${why}. Nothing was linked or copied to ${e.dest}.`);
            return;
        }
        try {
            symlinkSync(e.src, e.dest);
            if (isSymlink(e.dest)) {
                recordKitFile(e.dest, linkRecord(e.src));
                report("linked", e.label);
                return;
            }
        }
        catch {
            // fall through to copy
        }
    }
    if (!writeTargetFile(e.dest, bytes, d.how, e.label))
        return;
    recordKitFile(e.dest, contentRecord(bytes));
    report("copied(verify)", e.label);
}
// executeKitPlan: the write phase. Only reached when buildKitPlan refused nothing. It writes the
// entries from memory in the order the installer always used: skills, then the render's resolution
// lines, then adapters. A filesystem error on one entry is a counted verify naming it, and the phase
// continues to the next entry (the residual stated above).
function executeKitPlan(plan) {
    for (const e of plan.skills)
        writeKitEntry(e);
    for (const [label, msg] of plan.resolution)
        report(label, msg);
    for (const e of plan.adapters)
        writeKitEntry(e);
}
function writeKitEntry(e) {
    if (e.kind === "materialize")
        materializeAdapter(e);
    else if (e.kind === "missing")
        report("skipped", `${e.label} (source missing: ${e.src})`);
    else
        copyKitFile(e);
}
// One UTC stamp per run, from the stamp helper every other grugops backup uses (isoStamp).
const KIT_BACKUP_INFIX = ".grugops-edited-";
let KIT_BACKUP_STAMP = null;
const kitBackupPath = (dest) => {
    KIT_BACKUP_STAMP ??= isoStamp();
    return `${dest}${KIT_BACKUP_INFIX}${KIT_BACKUP_STAMP}`;
};
// A path under TARGET as the report shows it (POSIX, relative), or the path itself outside TARGET.
const shownPath = (p) => targetRel(p) ?? p;
function kitPreflight(plan) {
    const edited = [];
    const hazards = [];
    const marker = readInstallMarker(TARGET);
    const ledger = readKitFiles(marker.state === "ok" ? marker.marker : null);
    const records = ledger.state === "ok" ? ledger.files : null;
    const noRecord = marker.state === "unreadable"
        ? "the install marker could not be read"
        : marker.state === "absent"
            ? "there is no install marker"
            : ledger.state === "malformed"
                ? "the install marker's kit-file ledger is malformed"
                : ledger.state === "absent"
                    ? "the install marker predates the kit-file ledger"
                    : "the install marker's kit-file ledger has no entry for it";
    for (const e of [...plan.skills, ...plan.adapters]) {
        if (e.kind === "missing")
            continue;
        const d = e.planned;
        if (d === undefined || d.act === "refuse") {
            hazards.push(`${e.label} — ${e.dest} has no kit-plan answer, so whether it holds an edit is unknown. No kit file was written.`);
            continue;
        }
        // Nothing is replaced: the destination already holds install's content, or nothing is there.
        if (d.act === "skip" || (d.act === "write" && d.how === "create"))
            continue;
        const rel = targetRel(e.dest);
        const record = records === null || rel === null ? null : (records.get(rel) ?? null);
        let why;
        let bytes;
        let linkTarget;
        if (d.act === "unlink") {
            // The plan found install's own link here (isOwnLink against THIS checkout's kit source).
            if (!isOwnLink(e.dest, e.src)) {
                hazards.push(`${e.label} — ${e.dest} changed after the kit plan was built (it is no longer install's own link). No kit file was written.`);
                continue;
            }
            linkTarget = e.src;
            why =
                record === null || checkRecord(TARGET, e.dest, record).holds
                    ? null
                    : "it is a symbolic link where install recorded that it wrote something else";
        }
        else {
            // The plan will rewrite an existing regular file (readForWrite `ok`, not a hard link).
            const cur = readOwnedContent(TARGET, e.dest);
            if (cur.state !== "ok") {
                hazards.push(`${e.label} — ${e.dest} ${cur.why ?? "is no longer the regular file the kit plan read"}. It was left untouched and no kit file was written.`);
                continue;
            }
            bytes = cur.bytes;
            if (record !== null) {
                why = checkRecord(TARGET, e.dest, record).holds
                    ? null
                    : "it has changed since install wrote it: it does not hold what the install marker's kit-file ledger records";
            }
            else {
                // No usable record: unedited only when it is byte-identical to the kit source file.
                let srcBytes = e.bytes ?? null;
                if (e.kind === "materialize") {
                    const src = readUserFile(e.src);
                    srcBytes = src.state === "ok" ? src.bytes : null;
                }
                why = srcBytes !== null && srcBytes.equals(cur.bytes) ? null : `${noRecord}, and it differs from the kit source`;
            }
        }
        if (why === null)
            continue;
        if (record !== null && rel !== null)
            KIT_EDITED_RECORDED.add(rel);
        const backup = kitBackupPath(e.dest);
        const tooLong = pathLimitProblem(backup);
        if (tooLong !== null) {
            hazards.push(`${e.label} — its backup ${backup} ${tooLong}. Nothing was backed up and no kit file was written.`);
            continue;
        }
        const at = readForWrite(TARGET, backup);
        if (at.state !== "create") {
            const what = at.state === "ok" ? `${backup} already holds a file` : blockedAt(at, backup);
            hazards.push(`${e.label} — its backup path is taken: ${what}. It was left untouched, nothing was backed up and no kit file was written.`);
            continue;
        }
        edited.push({ dest: e.dest, label: e.label, backup, why, bytes, linkTarget });
    }
    return { edited, hazards };
}
// The one KIT_WRITE decision (see above). It prints the edited list, the DRY_RUN preview and the
// prompt; its refusals are returned as verify texts, so a --migrate pre-check can count them among
// its own refusals (the migration is whole or not at all) and the install run prints them the same.
function kitWriteDecision(plan) {
    const pre = kitPreflight(plan);
    if (pre.hazards.length > 0)
        return { go: "no", verifies: pre.hazards };
    if (pre.edited.length === 0)
        return { go: "write" };
    for (const f of pre.edited)
        report("edited-kit", `${f.label} (${f.why})`);
    const n = pre.edited.length;
    const list = pre.edited.map((f) => f.label).join(", ");
    const remedy = "re-run with --backup-edited-kit to back them up and refresh the whole kit, or restore them first";
    const nothing = `No kit file was written: the whole kit, these files included, was left exactly as it was (D-32)`;
    if (DRY_RUN) {
        for (const f of pre.edited)
            report("would-back-up", `${shownPath(f.dest)} → ${shownPath(f.backup)}`);
        if (BACKUP_EDITED_KIT)
            return { go: "backup-then-write", files: pre.edited };
        return {
            go: "no",
            verifies: [
                `${n} grugops kit file(s) hold edits install did not write: ${list}. DRY_RUN asks nothing. A real run ` +
                    `asks at a terminal whether to back them up and overwrite the whole kit; without a terminal (or with ` +
                    `--yes) it needs --backup-edited-kit, and without an answer it writes no kit file. To preview the ` +
                    `backups and the kit write together, add --backup-edited-kit to this DRY_RUN.`,
            ],
        };
    }
    if (BACKUP_EDITED_KIT)
        return { go: "backup-then-write", files: pre.edited };
    if (!YES && isatty(0) && isatty(1)) {
        process.stdout.write(`\n  These grugops kit files hold edits install did not write. Each would be backed up next to itself ` +
            `as <file>${KIT_BACKUP_INFIX}<UTC stamp> before the whole kit is refreshed:\n` +
            pre.edited.map((f) => `    ${f.label}\n`).join("") +
            `Back up these files and overwrite the whole grugops kit? [y/N] `);
        const ans = readlineSync().trim().toLowerCase();
        if (ans === "y" || ans === "yes")
            return { go: "backup-then-write", files: pre.edited };
        return {
            go: "no",
            verifies: [`${n} grugops kit file(s) hold edits install did not write: ${list}. You answered no. ${nothing}; ${remedy}.`],
        };
    }
    const why = YES
        ? "--yes answers only the target question, never whether an edit may be overwritten"
        : "there is no terminal on stdin and stdout to ask";
    return {
        go: "no",
        verifies: [
            `${n} grugops kit file(s) hold edits install did not write: ${list}. This run cannot ask whether to ` +
                `overwrite them (${why}), and the answer is not assumed. ${nothing}; ${remedy}.`,
        ],
    };
}
// backupEditedKitFiles: every backup, before the first kit write (see above). Returns false, after a
// counted verify, when any backup could not be made; the caller then writes no kit file.
function backupEditedKitFiles(files) {
    // DRY_RUN listed each backup in kitWriteDecision (`would-back-up`) and makes none.
    if (DRY_RUN)
        return true;
    let made = 0;
    for (const f of files) {
        try {
            if (f.linkTarget !== undefined)
                symlinkSync(f.linkTarget, f.backup);
            else
                writeFileSync(f.backup, f.bytes ?? Buffer.alloc(0), { flag: "wx" });
        }
        catch (err) {
            verify(`${f.label} — its backup ${f.backup} could not be written (${errCode(err)}). No kit file was written: the ` +
                `whole kit, this file included, was left as it was, and the ${made} backup(s) made before this one ` +
                `(listed above) were kept. Fix the cause and re-run with --backup-edited-kit, or restore the edited files first.`);
            return false;
        }
        made += 1;
        report("backed-up", `${shownPath(f.dest)} → ${shownPath(f.backup)}`);
    }
    return true;
}
// seedFile: copy ONE bundled seed file into the target, skip-if-exists (D-04).
//
// Red-team of plan 33.1-26 (D-18, DC-3): "exists" used to be existsSync, which is false for a
// dangling link, so the copy went through the link and wrote OUTSIDE the target; and a FIFO where
// plans/ should be crashed the copy. The destination is now asked through readForWrite: a regular
// file is the user's and is skipped as before; nothing there is created with an exclusive create
// from the seed's readUserFile bytes; anything else (a link, a special file, a non-directory on the
// way) is left untouched and reported.
function seedFile(src, dest, label) {
    const destRead = readForWrite(TARGET, dest);
    if (destRead.state === "blocked") {
        verify(`${label}: ${blockedAt(destRead, dest)}. It was left untouched and the seed was not written.`);
        return;
    }
    if (destRead.state === "ok") {
        report("skipped", `${label} (target already has it — D-04)`);
        return;
    }
    const srcRead = readUserFile(src);
    if (srcRead.state !== "ok") {
        verify(`${label}: the seed ${src} ${srcRead.state === "absent" ? "is missing" : unreadState(srcRead)}. Nothing was written.`);
        return;
    }
    if (DRY_RUN) {
        report("would-add", label);
        return;
    }
    if (writeTargetFile(dest, srcRead.bytes, "create", label))
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
// write). It writes ONLY under tools/grugops/ — it never touches a protected dir (T-15-05-EoP).
// Report strings are CLEAR PROFESSIONAL VOICE.
//
// RUNNABLES: each entry is [source-relative-to-GRUGOPS_SRC, dest-relative-to-TARGET]. The
// reference routine is the only kit-shipped runnable today; Phase 16's checker appends here.
//
// REVERSAL COUNTERPART (WR-04, plan 27-13): this mapping is MIRRORED by RUNNABLES_MIRROR in
// install/uninstall.ts, in the "removing grugops runnables" pass. Every file this loop writes into
// the user's repository has a removal counterpart there, guarded by the isProtected denylist and by
// a byte-identical-to-source check so a user-edited helper is preserved. An entry ADDED here without
// being added there is installed and never removable, which is exactly the reversibility gap that
// pass exists to close — edit the two together.
const RUNNABLES = [
    ["scripts/runnable-ref/reference-check.js", "tools/grugops/reference-check.js"],
    ["scripts/runnable-ref/test-skip-integrity.js", "tools/grugops/test-skip-integrity.js"],
    ["scripts/runnable-ref/uat-spec-integrity.js", "tools/grugops/uat-spec-integrity.js"],
    ["scripts/runnable-ref/host-protection.js", "tools/grugops/host-protection.js"],
];
function materializeRunnable() {
    for (const [srcRel, destRel] of RUNNABLES) {
        const src = join(GRUGOPS_SRC, srcRel);
        const dest = join(TARGET, destRel);
        // Red-team of plan 33.1-26 (DC-3, D-18): the source is read through readUserFile and the copy is
        // written from its bytes; the destination is asked through readForWrite (the seedFile rule: a
        // dangling link is not "nothing there", and a link or a non-directory on the way is refused).
        const srcRead = readUserFile(src);
        if (srcRead.state === "absent") {
            report("skipped", `${destRel} (source missing: ${src})`);
            continue;
        }
        if (srcRead.state !== "ok") {
            verify(`${destRel}: the source ${src} ${unreadState(srcRead)}. Nothing was written.`);
            continue;
        }
        const destRead = readForWrite(TARGET, dest);
        if (destRead.state === "blocked") {
            verify(`${destRel}: ${blockedAt(destRead, dest)}. It was left untouched and nothing was written.`);
            continue;
        }
        // never-overwrite (T-15-05-Tamper): an existing host file is left untouched. If it is
        // byte-identical the re-run is a clean no-op; if a user edited it, it is preserved verbatim.
        if (destRead.state === "ok") {
            report("skipped", destRead.text === srcRead.text
                ? `${destRel} (target already has it — D-04)`
                : `${destRel} (target has a different copy — left untouched, never-overwrite)`);
            continue;
        }
        if (DRY_RUN) {
            report("would-add", destRel);
            continue;
        }
        if (writeTargetFile(dest, srcRead.bytes, "create", destRel)) {
            // Plan 33.1-28: a runnable install created is recorded with the bytes written; uninstall
            // removes one only on this record, while it still holds those bytes, and when it is still
            // byte-identical to its source.
            recordCreatedFile(dest, contentRecord(srcRead.bytes));
            report("created", destRel);
        }
    }
}
// writeMarker: write .grugops/install.json. Four stable fields in fixed order, then the
// claudeAskRules ledger (D-18) when writeAskRules() produced one, then the createdDirs ledger
// (CR-02), then the createdFiles ledger (plan 33.1-28), then geminiSettings (plan 33.1-29), then the
// kitFiles ledger (plan 33.1-30); the install-time timestamp is deliberately
// OMITTED (RESOLVED Q1, Option b) — overwrite unconditionally, idempotent. The ledgers are carried
// forward from the previous marker (see writeAskRules for the ask rules), so the unconditional
// overwrite cannot orphan rules, directories or files an earlier run recorded.
//
// A PREVIOUS ENTRY IS CARRIED ONLY WITH PROOF (red-team of plan 33.1-28, R1, brief DC-2). A record
// names a path; the path can have been deleted and made again by the user since, so its presence is
// not proof. Each ledger states what this run must see to carry an entry forward:
// createdDirs: the directories this run created (CREATED_DIRS), united with the previous marker's
// entries that were a real, non-empty directory when this run started (START_HELD_DIRS) and are still
// a real directory now, sorted.
// createdFiles: the files this run created (CREATED_FILES, with what this run wrote), united with the
// previous marker's entries that still hold exactly what their record says install wrote
// (recordHolds) and that this run did not append a block to (APPENDED_FILES), each keeping its record,
// sorted by path. A file the user deleted, edited or replaced since is dropped.
// kitFiles (plan 33.1-30): what this run wrote to each kit file (KIT_FILES), united with the previous
// marker's entries this run did not write that still hold exactly their record (recordHolds), sorted
// by path. Never by presence: a kit file this run could not write (a directory, a FIFO, a link there)
// is dropped, and so is one the user edited since, except in a run that wrote no kit file: there the
// record of a file D-32's pre-flight found edited is carried unchanged (KIT_EDITED_RECORDED, plan
// 33.1-32), so restoring the file is a true remedy.
//
// ONE RULE FOR AN ABSENT LEDGER FIELD (plan 33.1-28): an absent record stays absent unless this run
// itself performed the recorded action. With NO previous marker this run is the whole history, so
// both fields are written (an empty array when install created nothing). With a previous marker that
// lacks a field (an install made before that ledger existed), the field is written only when this run
// created at least one directory (or file); otherwise it stays absent, so the next uninstall keeps the
// legacy answer ("the install marker predates the ... ledger") instead of reading an empty ledger as
// "install created nothing". A previous ledger that is present but malformed is a `verify` finding and
// is written back unchanged (fail closed, WR-05's rule for every ledger): install never replaces a
// ledger it could not read with one that forgets what it recorded.
function writeMarker() {
    const markerRel = ".grugops/install.json";
    const previousMarker = readInstallMarker(TARGET);
    // WR-05: a marker that exists but cannot be read holds ledgers this run cannot see. Overwriting it
    // would forget them, so it is left exactly as it is; writeAskRules() reported the verify finding.
    if (previousMarker.state === "unreadable") {
        report("skipped", `${markerRel} (left unchanged — it could not be read; see the verify line above)`);
        return;
    }
    const previousDirs = readCreatedDirs(previousMarker.state === "ok" ? previousMarker.marker : null);
    if (previousDirs.state === "malformed") {
        verify(`${markerRel} — the directory ledger (createdDirs) is malformed, so it was written back unchanged and ` +
            `the directories this run created were not recorded. Uninstall will remove no empty directory ` +
            `install may have created; fix or delete the createdDirs field to restore the ledger.`);
    }
    const previousFiles = readCreatedFiles(previousMarker.state === "ok" ? previousMarker.marker : null);
    if (previousFiles.state === "malformed") {
        verify(`${markerRel} — the file ledger (createdFiles) is malformed, so it was written back unchanged and ` +
            `the files this run created were not recorded. Uninstall will delete no file install may have ` +
            `created; fix or delete the createdFiles field to restore the ledger.`);
    }
    const previousKit = readKitFiles(previousMarker.state === "ok" ? previousMarker.marker : null);
    if (previousKit.state === "malformed") {
        verify(`${markerRel} — the kit-file ledger (kitFiles) is malformed, so it was written back unchanged and ` +
            `what this run wrote to the grugops skill and adapter files was not recorded. Uninstall will remove ` +
            `no grugops skill or adapter file; fix or delete the kitFiles field to restore the ledger.`);
    }
    // The kit VERSION is read through readUserFile (red-team of plan 33.1-26, DC-3): the kit home and
    // the checkout are user-controlled paths. An absent kit VERSION falls back to the checkout's, as
    // before; any other unread state is a counted verify and the marker records an empty version.
    //
    // A KIT NOT WRITTEN KEEPS ITS VERSION (plan 33.1-32, D-32). When this run wrote no kit file (no
    // consent, a hazard, a kit-plan refusal), the target's kit is still at the previous marker's version,
    // so that version is written back and the kit home's is not claimed; `--check` then reports the
    // skew. With no previous string to keep, the version is read as before.
    const prevVer = previousMarker.state === "ok" && typeof previousMarker.marker.kitVersion === "string"
        ? previousMarker.marker.kitVersion
        : null;
    let ver = "";
    if (!KIT_WRITTEN && prevVer !== null) {
        ver = prevVer;
        report("note", `${markerRel}: kitVersion kept at "${prevVer}", because this run wrote no kit file`);
    }
    else {
        const kitVerFile = join(KIT_ROOT, "VERSION");
        const srcVerFile = join(GRUGOPS_SRC, "agent-factory", "VERSION");
        const kitVer = readKitVersion(kitVerFile);
        const useVer = kitVer.present ? kitVer : readKitVersion(srcVerFile);
        if (useVer.problem !== null) {
            verify(`${markerRel}: the kit VERSION at ${kitVer.present ? kitVerFile : srcVerFile} ${useVer.problem}. It was not read, ` +
                `so the marker records an empty kitVersion.`);
        }
        else {
            ver = useVer.firstLine;
        }
    }
    // The marker path itself is asked through readForWrite (red-team of plan 33.1-26, D-18): a link
    // there, or a non-directory where .grugops/ should be, is never written through.
    const markerPath = join(TARGET, ".grugops", "install.json");
    const markerGate = readForWrite(TARGET, markerPath);
    if (markerGate.state === "blocked") {
        verify(`${markerRel}: ${blockedAt(markerGate, markerPath)}. The marker was not written.`);
        return;
    }
    if (DRY_RUN) {
        report("would-add", ".grugops/install.json (marker)");
        return;
    }
    const markerDirWhy = mkdirp(join(TARGET, ".grugops"));
    if (markerDirWhy !== null) {
        verify(`${markerRel}: ${markerDirWhy}. The marker was not written.`);
        return;
    }
    const marker = {
        kitVersion: ver,
        grugopsHome: GRUGOPS_HOME,
        kitRoot: KIT_ROOT,
        installMode: INSTALL_MODE,
    };
    if (ASK_LEDGER_KEEP_RAW) {
        // WR-05: a malformed ask-rule ledger is written back exactly as it was found.
        marker.claudeAskRules = ASK_LEDGER_KEEP_RAW.raw;
    }
    else if (ASK_LEDGER !== null) {
        marker.claudeAskRules = {
            added: ASK_LEDGER.added,
            createdFile: ASK_LEDGER.createdFile,
            createdPermissions: ASK_LEDGER.createdPermissions,
            createdAsk: ASK_LEDGER.createdAsk,
            askContent: ASK_LEDGER.askContent,
        };
    }
    // Computed after the mkdirp above, so a .grugops/ this call created is recorded too.
    const freshMarker = previousMarker.state === "absent";
    if (previousDirs.state === "malformed") {
        marker.createdDirs = previousDirs.raw;
    }
    else if (previousDirs.state === "ok" || freshMarker || CREATED_DIRS.size > 0) {
        const union = new Set(CREATED_DIRS);
        for (const rel of previousDirs.dirs) {
            if (!START_HELD_DIRS.has(rel))
                continue; // empty, gone or not a real directory at the start: no proof
            if (directoryComponent(join(TARGET, ...rel.split("/"))) === "fine")
                union.add(rel);
        }
        marker.createdDirs = [...union].sort();
    }
    if (previousFiles.state === "malformed") {
        marker.createdFiles = previousFiles.raw;
    }
    else if (previousFiles.state === "ok" || freshMarker || CREATED_FILES.size > 0) {
        const union = new Map(CREATED_FILES);
        for (const [rel, record] of previousFiles.files) {
            if (union.has(rel) || APPENDED_FILES.has(rel))
                continue;
            if (recordHolds(TARGET, join(TARGET, ...rel.split("/")), record))
                union.set(rel, record);
        }
        marker.createdFiles = Object.fromEntries([...union].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
    }
    // geminiSettings (plan 33.1-29, Gap B / re-review CR-03; red-team B2). The record always describes
    // the most recent install that changed the file: this run's record when it created the file or
    // appended the entry. When this run changed nothing:
    //   - it read nothing usable (GEMINI_SEEN null: a blocked path, not UTF-8, not JSON, a duplicate key
    //     on the path): it has no evidence either way, so an earlier `ok` record is written back
    //     VERBATIM and a note says so. That is not a carry by presence: nothing was learned that could
    //     prove or disprove the record. A fresh install records that it added no entry ("refused");
    //   - it read the file: an earlier `ok` record is carried forward only while context.fileName is
    //     exactly the one that record describes (the carry needs proof); otherwise the record claims
    //     nothing, with the reason ("reset" when an earlier claim of an entry no longer holds,
    //     "already-listed" when this run found AGENTS.md listed, "refused" when it refused to merge).
    // An absent record (a marker written before this ledger) stays absent unless this run itself acted:
    // the uninstaller's "predates" line is then still true. A malformed record is written back as
    // found; mergeGemini() reported it and merged nothing.
    const previousGemini = readGeminiLedger(previousMarker.state === "ok" ? previousMarker.marker : null);
    const claimsNothing = (noEntryReason, fileNameContent) => ({
        createdFile: false,
        addedEntry: false,
        noEntryReason,
        fileNameContent,
    });
    const prevGemini = previousGemini.state === "ok" ? previousGemini.ledger : null;
    if (previousGemini.state === "malformed") {
        marker.geminiSettings = previousGemini.raw;
    }
    else if (GEMINI_RECORD !== null) {
        marker.geminiSettings = geminiLedgerJson(GEMINI_RECORD);
    }
    else if (GEMINI_SEEN === null) {
        if (prevGemini !== null) {
            marker.geminiSettings = geminiLedgerJson(prevGemini);
            report("note", ".gemini/settings.json: this run could not read the file, so it has no evidence about the earlier " +
                "install's geminiSettings record, which was written back as it was");
        }
        else if (freshMarker) {
            marker.geminiSettings = geminiLedgerJson(claimsNothing("refused", null));
        }
    }
    else if (prevGemini !== null) {
        const seen = GEMINI_SEEN;
        const proven = seen.fileNameContent !== null && seen.fileNameContent === prevGemini.fileNameContent;
        marker.geminiSettings = geminiLedgerJson(proven
            ? prevGemini
            : claimsNothing(prevGemini.addedEntry ? "reset" : seen.listed ? "already-listed" : seen.refused ? "refused" : "reset", seen.fileNameContent));
    }
    else if (freshMarker) {
        marker.geminiSettings = geminiLedgerJson(claimsNothing(GEMINI_SEEN.listed ? "already-listed" : "refused", GEMINI_SEEN.fileNameContent));
    }
    // kitFiles (plan 33.1-30), by the one rule for an absent ledger above: written on a fresh install
    // (possibly `{}`), carried and overlaid when the previous record is `ok`, written over a legacy marker
    // (no field) only when this run recorded kit files, and written back as found when malformed.
    if (previousKit.state === "malformed") {
        marker.kitFiles = previousKit.raw;
    }
    else if (previousKit.state === "ok" || freshMarker || KIT_FILES.size > 0) {
        const union = new Map(KIT_FILES);
        for (const [rel, record] of previousKit.files) {
            if (union.has(rel))
                continue;
            // A kit file the pre-flight found edited keeps its record while the kit was not written (see
            // KIT_EDITED_RECORDED): it is the record a restored file is compared with.
            const keptEdited = !KIT_WRITTEN && KIT_EDITED_RECORDED.has(rel);
            if (keptEdited || recordHolds(TARGET, join(TARGET, ...rel.split("/")), record))
                union.set(rel, record);
        }
        marker.kitFiles = Object.fromEntries([...union].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
    }
    if (writeTargetFile(markerPath, JSON.stringify(marker, null, 2) + "\n", markerGate.state, markerRel)) {
        report("created", ".grugops/install.json (marker)");
    }
}
function readKitVersion(verFile) {
    const read = readUserFile(verFile);
    if (read.state === "absent")
        return { present: false, version: "", firstLine: "", problem: null };
    if (read.state !== "ok")
        return { present: true, version: "", firstLine: "", problem: unreadState(read) };
    const firstLine = read.text.split("\n")[0];
    return { present: true, version: firstLine.trim(), firstLine, problem: null };
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
    const installedRead = readKitVersion(join(KIT_ROOT, "VERSION"));
    const sourceRead = readKitVersion(join(GRUGOPS_SRC, "agent-factory", "VERSION"));
    for (const [what, file, r] of [
        ["installed kit", join(KIT_ROOT, "VERSION"), installedRead],
        ["running checkout", join(GRUGOPS_SRC, "agent-factory", "VERSION"), sourceRead],
    ]) {
        if (r.problem !== null) {
            report("warning", `the ${what} VERSION at ${file} ${r.problem}. It was not read, so no downgrade check was made; ` +
                `the refresh proceeds as it would with no VERSION.`);
        }
    }
    const installedVer = installedRead.version;
    const sourceVer = sourceRead.version;
    if (installedVer !== "" && sourceVer !== "" && isDowngrade(installedVer, sourceVer)) {
        report("warning", `the running checkout (${sourceVer}) is OLDER than the installed kit (${installedVer}). ` +
            `Proceeding to refresh the kit to ${sourceVer} — the displaced kit is retained as a timestamped backup ` +
            `(remove it later with --prune-old-kit).`);
    }
    copyKit(true);
}
// The kit sets, derived ONCE by readdirSync over $GRUGOPS_SRC (KIT-02 / D-18). Declared here, above
// the --migrate branch, because a --migrate over an old layout builds its kit plan before any
// migration step (red-team B1 of plan 33.1-31), and buildKitPlan reads these.
const SRC_SKILLS = srcSkillNames(GRUGOPS_SRC);
const SRC_ADAPTERS = srcAdapterFiles(GRUGOPS_SRC);
// The nested walk returns FOUR things, not one (D-35/D-36, and `unreadable` per D-41/CR-02): the
// member set, the paths it declined to descend into, the paths it could not READ, and whether it
// hit its work bound. All four are reported — a walk that reported only the first would be back to
// dropping members without naming them, and for three rounds `unreadable` was the one of the four
// that had no channel at all. The last three are kit-plan refusals (red-team (c) of plan 33.1-31).
const SRC_NESTED = srcNestedAdapterFiles(GRUGOPS_SRC);
const SRC_NESTED_ADAPTERS = SRC_NESTED.files;
// --- --migrate branch (MIGR-01, Plan 17-02) --------------------------------------------------
// Placed AFTER the always-on D-07 self-checkout guard and the doctor early-exit, BEFORE the run
// banner + the `-- kit --` block, so migrate operates on a real user repo and keeps the guard
// (Pitfall 4). It is pure orchestration around the unchanged install run (D-02): it never forks the
// copyKit→materializeAdapter→seedState→writeMarker sequence below.
//   - isMigrated → already two-root. Do NOT re-run install (D-12 no re-mutate). If a leftover
//     LIVE in-repo agent-factory/ remains (half-state) warn in clear voice that it must be removed
//     by hand — prune only removes .bak.<ISO> backups, never a live kit (WR-01) — else report
//     already-migrated. Either way exit 0.
//   - isOldLayout → the pre-check first (the config carry and the whole kit plan; any refusal and
//     nothing is migrated, exit 3), then migratePreSteps() (config-move + in-repo-kit backup), then
//     FALL THROUGH into the existing install run (which copies the fresh kit, D-01).
//   - isClean (or anything else) → FALL THROUGH into the existing install run unchanged (D-11).
//
// START_HELD_DIRS (red-team of plan 33.1-28, R1, brief DC-2) is taken HERE, before this run's first
// change to the target (the --migrate pre-steps below are the earliest). It is the set of the previous
// marker's createdDirs entries that are, right now, a real directory (not a link, nothing but real
// directories on the way) holding at least one entry. writeMarker() carries a previous createdDirs
// entry forward only when it is in this set. Install never leaves a directory it created empty, so
// one found empty at the start of a run was emptied, or deleted and made again, since the record was
// written; nothing is left to show it is still the directory install created, so the entry is
// dropped and uninstall leaves the directory (the safe direction). Taken later in the run, the answer
// would count what this run itself wrote into the directory.
const START_HELD_DIRS = (() => {
    const held = new Set();
    const m = readInstallMarker(TARGET);
    const dirs = readCreatedDirs(m.state === "ok" ? m.marker : null);
    if (dirs.state !== "ok")
        return held;
    for (const rel of dirs.dirs) {
        const p = join(TARGET, ...rel.split("/"));
        if (wayTo(TARGET, p) !== null || directoryComponent(p) !== "fine")
            continue;
        try {
            if (readdirSync(p).length > 0)
                held.add(rel);
        }
        catch {
            // unreadable: not shown to be held, so not carried
        }
    }
    return held;
})();
// MIGRATE_KIT_PLAN: the kit plan a --migrate over an old layout built before any migration step. The
// install run below executes it instead of building a second one (there is one render per run).
let MIGRATE_KIT_PLAN = null;
// MIGRATE_KIT_WRITE: that run's KIT_WRITE decision (D-32, plan 33.1-32), taken in the pre-check so a
// kit the human did not consent to refuses the whole migration, and so the prompt is asked once.
let MIGRATE_KIT_WRITE = null;
if (MIGRATE) {
    const layout = detectOldLayout();
    // A --MIGRATE IS WHOLE OR NOT AT ALL, TOO (red-team B1 of plan 33.1-31, D-32, D-18). Everything the
    // migration can refuse before it changes anything is asked first: the legacy config carry and the
    // whole kit plan (built with the configuration the carry will put in place, so the DRY_RUN preview
    // renders what the real run renders, B3). If anything refuses, NOTHING is migrated: no handoffs
    // backup, no config moved, no agent-factory/ renamed, no kit written, no marker. The target is still
    // the old layout, so fixing what the verify lines name and re-running --migrate performs the whole
    // migration. Before, a refused kit plan still moved the config, renamed agent-factory/ and wrote the
    // marker, and the next --migrate said "already migrated. Nothing to do" over install's own links.
    if (layout.isOldLayout) {
        MIGRATE_CARRY_PENDING = true;
        const carry = planConfigCarry();
        MIGRATE_KIT_PLAN = buildKitPlan();
        const refusals = [...carry.refusals, ...(MIGRATE_KIT_PLAN.ok ? [] : MIGRATE_KIT_PLAN.refusals)];
        if (refusals.length === 0 && MIGRATE_KIT_PLAN.ok) {
            MIGRATE_KIT_WRITE = kitWriteDecision(MIGRATE_KIT_PLAN);
            if (MIGRATE_KIT_WRITE.go === "no")
                refusals.push(...MIGRATE_KIT_WRITE.verifies);
        }
        if (refusals.length > 0) {
            console.log("== grugops migrate (old in-repo layout → two-root) ==");
            console.log(`target: ${TARGET}`);
            if (DRY_RUN)
                console.log("mode:   DRY_RUN (no filesystem changes)");
            console.log("\n-- migrate pre-check (before any change) --");
            for (const why of refusals)
                verify(why);
            report("migrate", `nothing was migrated: ${refusals.length} refusal(s) above were found before the first change, and ` +
                `--migrate changes a target whole or not at all. No configuration was moved, agent-factory/ was not ` +
                `backed up, plans/handoffs/ was not backed up, no skill or adapter was written, linked or unlinked, ` +
                `and no marker was written: ${TARGET} is still the old layout. Resolve each verify above and re-run --migrate.`);
            console.log(`\n== migrate INCOMPLETE — ${VERIFY_FINDINGS} item(s) need verification` +
                `${DRY_RUN ? " (DRY_RUN — nothing changed)" : ""} ==`);
            // A MID-SCRIPT EXIT, the seventh of the pinned count: the run must stop before the handoffs
            // backup and the install run below. Its output is a few kilobytes.
            process.exit(VERIFY_FINDINGS > 0 ? 3 : 0);
        }
    }
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
//
// ALL OR NOTHING (plan 33.1-31, D-32): buildKitPlan() finds every refusal before the first kit write,
// and executeKitPlan() runs only when there is none. See "THE KIT WRITE PLAN" above materializeAdapter.
// SRC_SKILLS, SRC_ADAPTERS and SRC_NESTED are derived above the --migrate branch (red-team B1 of plan
// 33.1-31): a --migrate over an old layout builds its kit plan before any migration step.
// buildKitPlan: phase one. Reads every kit source (through readUserFile), renders the adapters and
// reads each rendered file INSIDE the render callback, before the mirror is deleted, then asks
// kitDestDecision about every destination. It writes, links, unlinks and creates nothing; every
// refusal is collected rather than returned on, so one run names them all.
function buildKitPlan() {
    const refusals = [];
    const skills = [];
    const adapters = [];
    const resolution = [];
    if (SRC_SKILLS === null) {
        refusals.push(`.claude/skills/ — cannot read ${join(GRUGOPS_SRC, ".claude", "skills")}, so the install set is ` +
            `unknown. No skill was installed. Re-run the installer from a complete kit checkout.`);
    }
    else if (SRC_SKILLS.length === 0) {
        refusals.push(`.claude/skills/ — ${join(GRUGOPS_SRC, ".claude", "skills")} was read successfully but holds no ` +
            `skill, so there was nothing to install. This is a different condition from an unreadable ` +
            `directory and needs a different remedy: check the kit source, not the checkout.`);
    }
    else {
        for (const s of SRC_SKILLS) {
            const src = join(GRUGOPS_SRC, ".claude", "skills", s, "SKILL.md");
            const dest = join(TARGET, ".claude", "skills", s, "SKILL.md");
            const label = `.claude/skills/${s}/SKILL.md`;
            // The source is read ONCE, and the route is taken from those bytes (carriesSlot, the rule
            // the router applies everywhere), so routing and injection cannot disagree about one file.
            const read = readUserFile(src);
            if (read.state === "absent") {
                skills.push({ dest, label, kind: "missing", src });
            }
            else if (read.state !== "ok") {
                refusals.push(`${label}: the kit source ${src} ${unreadState(read)}. Nothing was installed for it.`);
            }
            else if (carriesSlot(read.text)) {
                skills.push({ dest, label, kind: "materialize", src, text: transformAdapter(read.text).text });
            }
            else {
                skills.push({ dest, label, kind: INSTALL_MODE === "copy" ? "copy" : "link", src, bytes: read.bytes, srcText: read.text });
            }
        }
    }
    if (SRC_ADAPTERS === null) {
        refusals.push(`.claude/agents/ — cannot read ${join(GRUGOPS_SRC, ".claude", "agents")}, so the install set is ` +
            `unknown. No adapter was installed. Re-run the installer from a complete kit checkout.`);
    }
    else if (SRC_ADAPTERS.length === 0) {
        refusals.push(`.claude/agents/ — ${join(GRUGOPS_SRC, ".claude", "agents")} was read successfully but holds no ` +
            `adapter, so there was nothing to install. This is a different condition from an unreadable ` +
            `directory and needs a different remedy: check the kit source, not the checkout.`);
    }
    else {
        // THE BYTE SOURCE IS THE RENDER; THE SET IS STILL srcAdapterFiles(GRUGOPS_SRC) (D-01, phase 29.2).
        //
        // Keeping SRC_ADAPTERS as the install SET is not a detail. install/uninstall.ts derives its
        // removal set from that SAME call, so an install set taken from the mirror instead would place a
        // file the reversal cannot see — the CR-02/D-28 defect that shipped once already. The mirror is
        // the per-member BYTE source and nothing more.
        //
        // EVERY RENDERED FILE IS READ INTO THE PLAN INSIDE THIS CALLBACK, so the mirror exists for exactly
        // the span that reads it, and the write phase never reads it: it is gone by then (plan 33.1-31).
        const adapterSet = SRC_ADAPTERS;
        renderAdaptersInMirror((render) => {
            // The REAL file on this machine. Named in every finding below because the generator's own
            // message names a temporary mirror path that does not exist on the user's filesystem.
            const targetConfigFile = renderConfigInput().label;
            if (!render.ok) {
                // R-5: NO FALLBACK BYTE SOURCE. Falling back to the kit-shipped adapter bytes would be a
                // second byte source and a silent downgrade of a configured target to `inherit` — the shape
                // D-03 and D-11 both reject. A render that did not complete installs nothing, names the
                // condition, lets every other install class finish, and the run reports itself INCOMPLETE.
                refusals.push(`.claude/agents/ — ${render.reason}\n` +
                    `                 No adapter was installed, and every adapter already in ` +
                    `${join(TARGET, ".claude", "agents")} was left exactly as it was. The model configuration ` +
                    `this run reads is ${targetConfigFile}; ${TEMP_MIRROR_DISCLAIMER}`);
                return;
            }
            // SET EQUALITY IN BOTH DIRECTIONS, BEFORE THE FIRST WRITE. Asserted with every extra and every
            // missing member NAMED: a bare count disagreement would say that the two sets differ and never
            // which member is the problem. The render runs to completion and is checked here, so rendering
            // and materializing are never interleaved.
            const rendered = render.value.files;
            const extra = adapterSet.filter((name) => !rendered.includes(name));
            const missing = rendered.filter((name) => !adapterSet.includes(name));
            if (extra.length > 0 || missing.length > 0) {
                let why = `.claude/agents/ — the install set derived from ${join(GRUGOPS_SRC, ".claude", "agents")} ` +
                    `(${adapterSet.length} member(s)) is not the set the render produced ` +
                    `(${rendered.length} member(s)), so this run cannot vouch for the bytes it would write.`;
                if (extra.length > 0) {
                    why +=
                        `\n                 ${extra.length} member(s) in the kit source that the render does not ` +
                            `produce: ${extra.join(", ")}`;
                }
                if (missing.length > 0) {
                    why +=
                        `\n                 ${missing.length} member(s) the render produces that the kit source ` +
                            `does not carry: ${missing.join(", ")}`;
                }
                refusals.push(`${why}\n` +
                    `                 No adapter was installed and every pre-existing target adapter was left ` +
                    `as it was. Re-run the installer from a complete kit checkout whose adapter directory ` +
                    `matches its role corpus.`);
                return;
            }
            // THE MEMBER-COUNT CROSS-CHECK, AGAINST A LISTING THIS SIDE DERIVED ITSELF.
            //
            // PLACED AFTER THE SET HALF, DELIBERATELY. An extra or a missing member also moves this number,
            // and the set half names WHICH member — a strictly better finding for the same defect. By this
            // line the two listings are provably set-equal, so the number below is the one the announcing
            // run actually produced.
            //
            // AND IT IS CHECKED AGAINST A DERIVATION, NOT AGAINST THE ANNOUNCEMENT ALONE, because a vacuity
            // floor catches an EMPTY resolution and never a silently SHORT one.
            const announced = render.value.assignment;
            if (announced.roles !== rendered.length) {
                refusals.push(`.claude/agents/ — the render announced a resolution covering ${announced.roles} role(s), ` +
                    `while this run derived ${rendered.length} rendered adapter(s) from the render's own ` +
                    `output directory. The two numbers must agree: a run installing over a disagreement ` +
                    `would be installing a set it cannot vouch for.\n` +
                    `                 No adapter was installed and every pre-existing target adapter was left ` +
                    `as it was. The model configuration this run reads is ${targetConfigFile}.`);
                return;
            }
            // THE ALIAS EVERY RENDERED ADAPTER CARRIES, READ OUT OF THE BYTES ABOUT TO BE WRITTEN, for ALL
            // members before any write: a refusal on the last member still leaves the target untouched.
            const aliasOf = new Map();
            let memberRefused = false;
            for (const f of adapterSet) {
                const label = `.claude/agents/${f}`;
                // Read through readUserFile (the census floor: install.js holds no raw content read). This is
                // the ONE read of the rendered file; the plan keeps its final text in memory.
                const renderedRead = readUserFile(join(render.value.dir, ".claude", "agents", f));
                if (renderedRead.state !== "ok") {
                    refusals.push(`.claude/agents/ — ${label} was rendered but could not be read back ` +
                        `(it ${renderedRead.state === "absent" ? "is missing" : unreadState(renderedRead)}), so the model it would be installed ` +
                        `with is unknown. No adapter was installed and every pre-existing target adapter was ` +
                        `left as it was.`);
                    memberRefused = true;
                    continue;
                }
                const text = renderedRead.text;
                const alias = readRenderedAlias(text, label);
                if (!alias.ok) {
                    refusals.push(`.claude/agents/ — ${alias.reason}\n` +
                        `                 No adapter was installed and every pre-existing target adapter was ` +
                        `left as it was.`);
                    memberRefused = true;
                    continue;
                }
                aliasOf.set(f, alias.value);
                // THE ROUTING FLOOR, ASKED BEFORE THE BANNER FLOOR BECAUSE IT BOUNDS WHAT THAT FLOOR MEANS.
                //
                // FOUND BY REPRODUCTION, NOT BY READING (29.2-03 task 2). A rendered adapter carrying exactly
                // one recognised banner and NO kit slot line was once copied RAW, so the target received a
                // file still naming the generator command, and the run exited 0 claiming completion. Nothing
                // in a target may name a command the target cannot run, so a rendered agent adapter that
                // cannot be materialized is a refusal rather than a copy. Asked through the router's own rule
                // (carriesSlot) on the bytes that will be written, so the refusal and the routing cannot come
                // to two different answers about one file. RENDERED AGENT ADAPTERS ONLY: a skill without the
                // slot line is legitimately copied.
                if (!carriesSlot(text)) {
                    refusals.push(`.claude/agents/ — ${label} was rendered without the installer's kit slot line, so it ` +
                        `cannot be materialized: its provenance banner would not be rewritten and it would ` +
                        `reach the target still naming a command the target cannot run. A rendered agent ` +
                        `adapter that this installer cannot materialize is refused rather than copied raw.\n` +
                        `                 No adapter was installed and every pre-existing target adapter was ` +
                        `left as it was. Re-run the installer from a kit checkout whose generator and installer ` +
                        `are the same version.`);
                    memberRefused = true;
                    continue;
                }
                // THE BANNER COUNT FLOOR (D-14), ASKED HERE AND ONLY HERE: about bytes THIS RUN rendered for
                // an AGENT adapter. The one slot-carrying skill legitimately carries ZERO banner lines, so the
                // assertion belongs at the call site that knows what it is looking at. A COUNT, not a boolean:
                // zero (the generator's wording moved, so every target adapter would keep naming a command it
                // cannot run) and two-or-more (a shape this installer cannot rewrite) are different defects.
                const transformed = transformAdapter(text);
                if (transformed.banners !== 1) {
                    refusals.push(`.claude/agents/ — ${label} was rendered carrying ${transformed.banners} recognised provenance ` +
                        `banner line(s) where exactly one was required, so the banner this installer would ` +
                        `write into the target cannot be placed. Zero means the generator's wording moved away ` +
                        `from the line this installer recognises, which would leave every target adapter naming ` +
                        `a command the target cannot run; two or more means the rendered file is not the shape ` +
                        `this installer knows how to rewrite.\n` +
                        `                 No adapter was installed and every pre-existing target adapter was ` +
                        `left as it was. Re-run the installer from a kit checkout whose generator and installer ` +
                        `are the same version.`);
                    memberRefused = true;
                    continue;
                }
                adapters.push({
                    dest: join(TARGET, ".claude", "agents", f),
                    label,
                    kind: "materialize",
                    // Today every adapter is rendered to a regular file; an install made before the render
                    // linked it to exactly this kit source path, so that link is install's own.
                    src: join(GRUGOPS_SRC, ".claude", "agents", f),
                    text: transformed.text,
                    alias: alias.value,
                });
            }
            if (memberRefused)
                return;
            // THE ALIAS-SET CROSS-CHECK — THE CLOSING OF THE LOOP. The report below is derived from the
            // BYTES about to be written; the announcement is derived from the map the generator rendered
            // FROM. Neither side alone proves the other, so they are required to agree.
            const readAliases = [...new Set(aliasOf.values())].sort();
            const saidAliases = [...announced.aliases].sort();
            if (readAliases.join(",") !== saidAliases.join(",")) {
                refusals.push(`.claude/agents/ — the aliases read out of the rendered adapters are ` +
                    `[${readAliases.join(", ")}], while the render announced [${saidAliases.join(", ")}]. ` +
                    `The bytes and the announcement describe the same resolution, so a disagreement means one ` +
                    `of them is wrong and this run cannot say which.\n` +
                    `                 No adapter was installed and every pre-existing target adapter was left ` +
                    `as it was. The model configuration this run reads is ${targetConfigFile}.`);
                return;
            }
            // THE RESOLUTION REPORT (D-04), CAPTURED FOR THE WRITE PHASE. The generator's own announcement
            // lines are relayed VERBATIM — the installer authors no preset wording of its own and holds no
            // copy of either marker. They are relayed through the padded report channel, so the relayed text
            // is a MENTION rather than a second announcement (T-29.2-08). executeKitPlan prints them between
            // the skills and the adapters, where this callback used to.
            for (const line of render.value.stdout.split("\n")) {
                if (line.trim() === "")
                    continue;
                resolution.push(["render", line]);
            }
            // ...followed by the SAME disclaimer the doctor's NO VERDICT arm and the render-refusal arm
            // carry (WR-05): the relayed lines name the temp mirror, which this run deletes. THE GENERATOR'S
            // OWN LINE IS NOT REWRITTEN; the disclaimer is added BESIDE it, from the one wording authority.
            resolution.push([
                "resolution",
                `the adapters were written to ${join(TARGET, ".claude", "agents")}; ${TEMP_MIRROR_DISCLAIMER}`,
            ]);
            // ...plus ONE line of the installer's own, naming the configuration file it read, or stating
            // plainly that none was found. A run that resolved nothing says so.
            resolution.push([
                "resolution",
                render.value.configPath === null
                    ? `no configuration file was found at ${targetConfigFile}, so every role took the ` +
                        `generator's zero-config answer and this run resolved nothing of its own`
                    : `read from ${render.value.configPath}`,
            ]);
        });
    }
    // THE NESTED WALK'S THREE UNKNOWN-SET ARMS ARE KIT REFUSALS (red-team (c) of plan 33.1-31, D-32).
    // A subtree the walk declined to descend into (a cycle), could not read, or stopped in at its work
    // bound leaves the kit source NOT FULLY EXAMINED, the same fact as an unreadable source directory,
    // which refuses the kit. Before, these were reported after the kit write, so a run that named them
    // had already written the whole flat kit. A nested adapter the walk DID read (the flat-by-contract
    // refusal after the kit step) is different: it is a known file the contract keeps out of the install
    // set, so it cannot make the kit a mix of versions, and it stays a per-file verify.
    for (const rel of SRC_NESTED.cycles) {
        refusals.push(`.claude/agents/${rel} — the nested-adapter walk DECLINED TO DESCEND here: this directory ` +
            `already appears on its own recursion path, so following it would not terminate. Anything ` +
            `below it was therefore neither installed nor refused by name, so the kit source was not fully ` +
            `examined and no skill or adapter was installed. Break the symlink cycle under the adapter ` +
            `directory and re-run.`);
    }
    for (const rel of SRC_NESTED.unreadable) {
        const at = rel === "" ? "" : `/${rel}`;
        refusals.push(`.claude/agents${at} — the nested-adapter walk COULD NOT READ this directory, so anything below ` +
            `it was NEITHER installed NOR refused by name. This is NOT the same fact as an empty ` +
            `directory: an empty directory was read and held nothing, while this one was never read at ` +
            `all, so its contents are unknown rather than known to be none, and no skill or adapter was ` +
            `installed. Fix the permissions on it or restore the checkout, then re-run.`);
    }
    if (SRC_NESTED.overflow !== null) {
        const at = SRC_NESTED.overflow.at === "" ? "" : `/${SRC_NESTED.overflow.at}`;
        refusals.push(`.claude/agents${at} — the nested-adapter walk stopped after examining ` +
            `MAX_WALK_ENTRIES=${SRC_NESTED.overflow.limit} directory entries, so the adapter directory ` +
            `was NOT fully examined and anything past that point was neither installed nor refused by ` +
            `name, and no skill or adapter was installed. A symlink DAG with no cycle at all can expand ` +
            `into exponentially many distinct relative paths, which is what this bound exists to stop. ` +
            `Remove the cross-linked symlinks under the adapter directory and re-run.`);
    }
    // TWO DESTINATIONS THAT FOLD TO ONE NAME (red-team B2 of plan 33.1-31). On a case-insensitive or a
    // normalisation-insensitive target the second write would land on the first file. kitNameCollisions
    // (kit-source.ts) folds every destination per component; any pair refuses the whole kit.
    const planned = [...skills, ...adapters].filter((e) => e.kind !== "missing");
    const relOf = (dest) => relative(TARGET, dest).split(sep).join("/");
    for (const [a, b] of kitNameCollisions(planned.map((e) => relOf(e.dest)))) {
        refusals.push(a === b
            ? `${a} — the kit plan holds this destination twice, so two kit files would be written to one ` +
                `path. Re-run the installer from a kit checkout whose skill and adapter names are distinct.`
            : `${a} and ${b} — these two kit names differ only by letter case or Unicode normalisation, so on ` +
                `a case-insensitive or normalisation-insensitive filesystem (the macOS and Windows defaults) ` +
                `they are ONE path, and the second write would overwrite the first. Re-run the installer from ` +
                `a kit checkout whose skill and adapter names are distinct after case folding.`);
    }
    // EVERY DESTINATION IS ASKED BEFORE THE FIRST WRITE, with the decision the writer asks again at the
    // write: a link, a FIFO, a hard link, a directory, or a link or non-directory on the way to any kit
    // path refuses the whole kit. Under --migrate, install's own link at a materialize destination is
    // marked to be unlinked in the write phase, never here.
    const decide = (e) => {
        const d = kitDestDecision(e);
        if (d.act === "refuse")
            refusals.push(d.why);
        return d.act === "unlink" ? { ...e, unlinkFirst: true, planned: d } : { ...e, planned: d };
    };
    const plannedSkills = skills.map(decide);
    const plannedAdapters = adapters.map(decide);
    if (refusals.length > 0)
        return { ok: false, refusals };
    return { ok: true, skills: plannedSkills, adapters: plannedAdapters, resolution };
}
{
    const kitPlan = MIGRATE_KIT_PLAN ?? buildKitPlan();
    if (kitPlan.ok) {
        // KIT_WRITE (D-32, plan 33.1-32): the one decision, taken once. A --migrate over an old layout
        // took it in its pre-check (the prompt is never asked twice).
        const go = MIGRATE_KIT_WRITE ?? kitWriteDecision(kitPlan);
        if (go.go === "no") {
            for (const why of go.verifies)
                verify(why);
            report("kit", `no skill or adapter was written, linked or unlinked: the kit is written whole or not at all (D-32), and ` +
                `every kit file already in ${join(TARGET, ".claude")} was left exactly as it was. Resolve each verify above and re-run.`);
        }
        else if (go.go === "write" || backupEditedKitFiles(go.files)) {
            KIT_WRITTEN = true;
            executeKitPlan(kitPlan);
        }
        else {
            report("kit", `no skill or adapter was written, linked or unlinked: a backup failed, and no kit file is written until every ` +
                `edited file is backed up (D-32, D-18). Every kit file in ${join(TARGET, ".claude")} was left exactly as it was.`);
        }
    }
    else {
        for (const why of kitPlan.refusals)
            verify(why);
        report("kit", `no skill or adapter was written, linked or unlinked: ${kitPlan.refusals.length} refusal(s) above ` +
            `were found before the first kit write, and the kit is written whole or not at all (D-32). ` +
            `Every kit file already in ${join(TARGET, ".claude")} was left exactly as it was. Resolve each ` +
            `verify above and re-run.`);
    }
}
// The flat-directory contract, refused BY NAME rather than silently skipped (T-27-62). See
// srcNestedAdapterFiles() for why the install set stays flat while the platform recurses.
for (const rel of SRC_NESTED_ADAPTERS) {
    verify(`.claude/agents/${rel} — the adapter directory is FLAT BY CONTRACT, so this nested adapter was ` +
        `NOT installed. Claude Code would load it from a nested path, which is exactly why it is ` +
        `refused here by name instead of skipped. Move it to the top level of the adapter directory.`);
}
// THE CYCLE, UNREADABLE AND WORK-BOUND ARMS of the nested walk are kit-plan refusals since the
// red-team fixes of plan 33.1-31 (see buildKitPlan): each leaves the kit source not fully examined,
// so it refuses the whole kit before the first write.
// AGENTS.md is never written when the target has one. "Has one" is a regular file (readForWrite
// `ok`) or the link a --symlink install made to the checkout's AGENTS.md. Red-team of plan 33.1-26:
// it used to be existsSync, so a FIFO or a directory there read as "has one", and a dangling link
// read as "has none" and reached linkOrCopy. Nothing there → linkOrCopy; anything else → verify.
{
    const agentsSrc = join(GRUGOPS_SRC, "AGENTS.md");
    const agentsDest = join(TARGET, "AGENTS.md");
    const agentsRead = isOwnLink(agentsDest, agentsSrc) ? null : readForWrite(TARGET, agentsDest);
    if (agentsRead === null || agentsRead.state === "ok") {
        report("skipped", "AGENTS.md (target already has one — left untouched)");
    }
    else if (agentsRead.state === "blocked") {
        verify(`AGENTS.md: ${blockedAt(agentsRead, agentsDest)}. It was left untouched and nothing was copied to it.`);
    }
    else {
        // Plan 33.1-28 (brief DC-2): install created AGENTS.md, so it is recorded; uninstall removes an
        // AGENTS.md only on this record, never because it matches the kit's bytes (a never-installed
        // repository that took the minimal copy path holds exactly those bytes). The record says what
        // install wrote (the copy's bytes or the link's target), so an AGENTS.md changed since does not
        // match it (red-team R1).
        const created = linkOrCopy(agentsSrc, agentsDest, "AGENTS.md");
        if (created !== null)
            recordCreatedFile(agentsDest, created);
    }
}
ensureBlock(join(TARGET, "CLAUDE.md"), CLAUDE_OPEN, CLAUDE_PTR, CLAUDE_CLOSE, "CLAUDE.md start-here pointer");
mergeGemini();
ensureBlock(join(TARGET, COPILOT_REL), COPILOT_OPEN, COPILOT_PTR, COPILOT_CLOSE, `${COPILOT_REL} (optional Copilot pointer)`);
// ── The RETIRED `autonomy` scalar: REPORT, never rewrite (Phase 30, D-05 / T-30-22) ─────────────
//
// A target repository installed before Phase 30 carries `autonomy` in its `.grugops/factory.config.json`.
// The scalar is retired: the structure validator now refuses a configuration that still carries it,
// and `agent-factory/config/factory.config.md` publishes the mechanical translation for the old
// `diff | branch | pr` value.
//
// THIS FUNCTION READS AND PRINTS. IT WRITES NOTHING. The installer's whole contract is additive,
// idempotent and reversible, and it never overwrites user content; a configuration file is the
// user's declared intent, and a tool that edits declared intent without asking is the opposite of
// this project's stated posture. So the remedy is named and handed to the human, and the file is
// left exactly as it was — asserted from the outside by comparing the file's bytes across a run.
//
// IT DOES NOT CHANGE THE EXIT CODE. The install itself completed; the retired key is a migration
// notice, and the surface that REFUSES the key is the structure validator. Failing the install over
// a configuration this run did not write would report the wrong thing.
//
// A configuration that cannot be read or parsed produces a line saying the CHECK DID NOT RUN, never
// silence. Silence here would be indistinguishable from a clean result, which is the one thing a
// no-fabrication contract forbids.
const RETIRED_CONFIG_KEYS = [
    [
        "autonomy",
        'replaced by the per-checkpoint "checkpoints" object; translate the old diff/branch/pr value ' +
            "with the legacy grade table in agent-factory/config/factory.config.md",
    ],
];
function reportRetiredConfigKeys() {
    const cfgPath = join(TARGET, ".grugops", "factory.config.json");
    // DC-3 (plan 33.1-26): read through readUserFile.
    const cfgRead = readUserFile(cfgPath);
    if (cfgRead.state === "absent")
        return; // nothing configured here; nothing to report about
    if (cfgRead.state !== "ok") {
        report("skipped", `retired-key check (${cfgPath} ${unreadState(cfgRead)} — it was not read, so the check was NOT ` +
            `performed and this run says nothing about whether it carries a retired key)`);
        return;
    }
    let parsed;
    try {
        parsed = JSON.parse(cfgRead.text);
    }
    catch {
        report("skipped", `retired-key check (${cfgPath} did not parse — the check was NOT performed, so this run ` +
            `says nothing about whether it carries a retired key)`);
        return;
    }
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
        report("skipped", `retired-key check (${cfgPath} is not a JSON object — the check was NOT performed)`);
        return;
    }
    const obj = parsed;
    for (const [key, remedy] of RETIRED_CONFIG_KEYS) {
        if (!Object.prototype.hasOwnProperty.call(obj, key))
            continue;
        report("retired-key", `${cfgPath} carries the retired "${key}" key — ${remedy}.`);
        report("retired-key", `  This installer left the file untouched. Edit it yourself.`);
    }
}
// ---------------------------------------------------------------------------
// writeAskRules (D-18, D-29) — translate the checkpoints configuration into Claude Code
// `permissions.ask` rules in the target's .claude/settings.json.
//
// WHAT THE RULES ARE. A speed bump that covers the command spellings an agent usually produces for a
// production deploy, a package publish, a push or a pull-request merge. Claude Code documents that a
// Bash ask rule is not a security boundary. The git host is the hard floor (install/README.md §5).
//
// CONFIGURATION. Read from .grugops/factory.config.json, else agent-factory/config/
// factory.config.json; the first existing file wins whole. An unparseable file is treated as absent,
// and an absent configuration writes every rule (fail closed). Only an exact `notify` or `off` lowers
// a checkpoint, and each lowered checkpoint is reported.
//
// CONTRACT. Additive: only rules not already present (exact string) are appended, and every other
// key keeps its value and order. A settings file that does not parse, or whose root, `permissions`
// or `ask` has the wrong type, is left byte-identical and becomes a `verify` finding (exit 3). The
// install never removes a rule, including one for a checkpoint that was later lowered. DRY_RUN
// writes nothing.
//
// THE LEDGER (reversibility). ASK_LEDGER is computed here and written by writeMarker(). It is
// (previous ledger ∩ rules present now) ∪ rules added by this run, with each created* flag carried
// forward from the previous marker while the thing it names still exists. A second install finds
// every rule already present and adds nothing; without the carry-forward it would write an empty
// ledger and uninstall could no longer remove the rules.
//
// THE CARRY NEEDS PROOF (red-team of plan 33.1-28, R3, brief DC-2). A rule string or a flag says
// nothing about who wrote what is in the file NOW: a user who deleted the settings file and wrote
// their own, holding their own `Bash(git push *)`, had that rule claimed as install's (uninstall
// removed it) and their file claimed as created by install (uninstall deleted it). So the ledger
// records `askContent`, the content record of the `permissions.ask` array exactly as install left
// it, and the previous claims and created* flags are carried only while the array found now is that
// array. Otherwise every rule already present is the user's (reported so, and uninstall leaves it),
// and each created* flag says only what THIS run created. A key the user adds beside the array
// changes nothing; any change to the array itself ends the claim. A settings file this run cannot
// read, parse or type-check shows nothing either, so its ledger claims nothing.
// ---------------------------------------------------------------------------
const ASK_CONFIG_CANDIDATES = [
    [".grugops", "factory.config.json"],
    ["agent-factory", "config", "factory.config.json"],
];
function readCheckpointConfig() {
    for (const parts of ASK_CONFIG_CANDIDATES) {
        // DC-3 (plan 33.1-26): read through readUserFile. Absent → the next candidate. Any other state
        // that is not a readable regular file is "unreadable", which writes every rule (fail closed).
        const read = readUserFile(join(TARGET, ...parts));
        if (read.state === "absent")
            continue;
        if (read.state !== "ok")
            return undefined;
        try {
            return JSON.parse(read.text);
        }
        catch {
            return undefined;
        }
    }
    return undefined;
}
let ASK_LEDGER = null;
// Set when the previous ledger is present but malformed (WR-05): writeMarker() writes `raw` back
// unchanged instead of ASK_LEDGER.
let ASK_LEDGER_KEEP_RAW = null;
function writeAskRules() {
    const rel = ".claude/settings.json";
    const file = join(TARGET, ".claude", "settings.json");
    report("note", "these ask rules are a speed bump for the usual command spellings, not a security boundary; " +
        "the git host is the hard floor (install/README.md §5)");
    // FAIL CLOSED ON THE LEDGER (WR-05), exactly as uninstall does. Without a readable ledger this run
    // cannot tell a rule an earlier install added from the user's own identical rule, so it adds no
    // rule, relabels none, and leaves the ledger as it found it. A marker with no ledger field (an
    // install that predates the ask rules, or no marker at all) is not a defect: nothing was recorded.
    const previousMarker = readInstallMarker(TARGET);
    if (previousMarker.state === "unreadable") {
        verify(`.grugops/install.json could not be read as a JSON object (${previousMarker.why}), so the ask-rule ledger is unknown — no ask rule ` +
            `was added to ${rel} and the marker was left as it was. Fix or remove the marker, then re-run the installer.`);
        return;
    }
    const previousRead = readAskRuleLedger(previousMarker.state === "ok" ? previousMarker.marker : null);
    if (previousRead.state === "malformed") {
        verify(`${rel} — the ask-rule ledger (claudeAskRules) in .grugops/install.json is malformed, so no ask rule was ` +
            `added and the ledger was written back unchanged. Fix the field, then re-run the installer.`);
        ASK_LEDGER_KEEP_RAW = { raw: previousRead.raw };
        return;
    }
    const previous = previousRead.ledger;
    // The ledger to write when the previous claims cannot be carried (see THE CARRY NEEDS PROOF).
    const unclaimed = (askContent) => previous === null ? null : { added: [], createdFile: false, createdPermissions: false, createdAsk: false, askContent };
    const config = readCheckpointConfig();
    const toWrite = checkpointsToWrite(config);
    const rules = [];
    for (const checkpoint of ASK_RULE_CHECKPOINTS) {
        if (toWrite.includes(checkpoint)) {
            rules.push(...askRulesFor(checkpoint));
            continue;
        }
        const cps = config !== null && typeof config === "object" && !Array.isArray(config)
            ? config.checkpoints
            : undefined;
        const value = cps !== null && typeof cps === "object" ? cps[checkpoint] : undefined;
        report("skipped", `${checkpoint} is set to ${String(value)} in the factory configuration — no ask rule was written for it`);
    }
    // Parse and type-check the existing file. Nothing is written unless every level has the right type.
    // Red-team B3 of plan 33.1-29 (D-18): the file is read as text through json-text.ts, and the rules
    // are spliced into it below, so every other byte of the user's file is kept.
    let json = {};
    let permissions = null;
    let ask = null;
    let doc = null;
    // DC-3 / D-18 (plan 33.1-26): read before any write. A settings file that is not a readable
    // regular file within the bound is left untouched, and the ledger stays as it was. Red-team of
    // plan 33.1-26: asked through readForWrite, so a link at the path (a dangling one used to be
    // written through, outside the target) or a non-directory where .claude/ should be is refused the
    // same way.
    const settingsRead = readForWrite(TARGET, file);
    if (settingsRead.state === "blocked") {
        verify(`${rel}: ${blockedAt(settingsRead, file)} — left untouched; no ask rule was written. Fix the file and re-run the installer.`);
        ASK_LEDGER = unclaimed(null);
        return;
    }
    const exists = settingsRead.state === "ok";
    if (settingsRead.state === "ok") {
        doc = readJsonText(settingsRead.bytes);
        if (!doc.ok) {
            verify(`${rel} ${doc.why} — left untouched; no ask rule was written. Fix the file and re-run the installer.`);
            ASK_LEDGER = unclaimed(null);
            return;
        }
        const parsed = documentValue(doc);
        const permsAt = memberNamed(doc.root, "permissions");
        if (keyCount(doc.root, "permissions") > 1 || (permsAt !== null && keyCount(permsAt.value, "ask") > 1)) {
            verify(`${rel} has more than one "permissions" or "permissions.ask" key, so which one Claude Code reads is not ` +
                `known — left untouched; no ask rule was written. Fix the file and re-run the installer.`);
            ASK_LEDGER = unclaimed(null);
            return;
        }
        if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
            verify(`${rel} is not a JSON object — left untouched; no ask rule was written. Fix the file and re-run the installer.`);
            ASK_LEDGER = unclaimed(null);
            return;
        }
        json = parsed;
        if (Object.prototype.hasOwnProperty.call(json, "permissions")) {
            const p = json.permissions;
            if (p === null || typeof p !== "object" || Array.isArray(p)) {
                verify(`${rel} has a "permissions" value that is not an object — left untouched; no ask rule was written.`);
                ASK_LEDGER = unclaimed(null);
                return;
            }
            permissions = p;
            if (Object.prototype.hasOwnProperty.call(permissions, "ask")) {
                if (!Array.isArray(permissions.ask)) {
                    verify(`${rel} has a "permissions.ask" value that is not an array — left untouched; no ask rule was written.`);
                    ASK_LEDGER = unclaimed(null);
                    return;
                }
                ask = permissions.ask;
            }
        }
    }
    const present = new Set((ask ?? []).filter((x) => typeof x === "string"));
    const toAdd = rules.filter((r) => !present.has(r));
    // THE CARRY NEEDS PROOF (R3): the previous claims hold only while the ask array is the one install
    // last left there.
    const askNow = jsonValueRecord(ask === null ? undefined : ask);
    const proven = previous !== null && previous.askContent !== null && previous.askContent === askNow;
    const prevAdded = new Set(proven && previous !== null ? previous.added : []);
    const unprovenClaims = new Set(previous !== null && !proven ? previous.added : []);
    if (unprovenClaims.size > 0) {
        report("note", `${rel}: its permissions.ask list is not the one install last left there, so the ${unprovenClaims.size} ask ` +
            `rule(s) an earlier install recorded are no longer claimed as install's; a copy present now is the user's own`);
    }
    // Rules already present that no earlier run of this installer added are the user's own.
    for (const r of rules) {
        if (present.has(r) && !prevAdded.has(r)) {
            report("skipped", unprovenClaims.has(r)
                ? `${r} (already present in ${rel} — there is no proof that install added this copy, so it is kept as the user's own rule; uninstall will not remove it)`
                : `${r} (already present in ${rel} — kept as the user's own rule; uninstall will not remove it)`);
        }
    }
    const carried = rules.filter((r) => present.has(r) && prevAdded.has(r)).length;
    if (carried > 0)
        report("skipped", `${rel} (${carried} ask rule(s) from an earlier install already present)`);
    // Rules an earlier run added for a checkpoint that is now lowered stay: install never removes.
    for (const checkpoint of ASK_RULE_CHECKPOINTS) {
        if (toWrite.includes(checkpoint))
            continue;
        const left = askRulesFor(checkpoint).filter((r) => present.has(r) && prevAdded.has(r)).length;
        if (left > 0) {
            report("left", `${left} ask rule(s) an earlier install added for ${checkpoint} remain in ${rel}; the installer never ` +
                `removes a rule — delete them by hand, or run install/uninstall.js, which removes every rule it added`);
        }
    }
    const willCreateFile = !exists && toAdd.length > 0;
    const willCreatePermissions = permissions === null && toAdd.length > 0;
    const willCreateAsk = ask === null && toAdd.length > 0;
    const addedNow = new Set([...[...prevAdded].filter((r) => present.has(r)), ...toAdd]);
    ASK_LEDGER = {
        added: [...addedNow].sort(),
        createdFile: willCreateFile || (proven && exists && previous !== null && previous.createdFile),
        createdPermissions: willCreatePermissions || (proven && permissions !== null && previous !== null && previous.createdPermissions),
        createdAsk: willCreateAsk || (proven && ask !== null && previous !== null && previous.createdAsk),
        // The array as this run leaves it: the one it writes below, or the one it found.
        askContent: toAdd.length > 0 ? jsonValueRecord([...(ask ?? []), ...toAdd]) : askNow,
    };
    if (toAdd.length === 0) {
        if (rules.length === 0)
            report("skipped", `${rel} (no checkpoint is at block — no ask rule to write)`);
        return;
    }
    if (DRY_RUN) {
        report("would-add", `${rel} (${toAdd.length} ask rule(s) to permissions.ask)`);
        return;
    }
    // THE SPLICE (red-team B3): a new file is install's own and written whole; an existing one gets the
    // rules added to its permissions.ask list (or the one member install adds) and nothing else.
    let newText;
    if (doc === null || !doc.ok) {
        newText = JSON.stringify({ permissions: { ask: toAdd } }, null, 2) + "\n";
    }
    else {
        const permsNode = memberNamed(doc.root, "permissions")?.value ?? null;
        const askNode = permsNode === null ? null : (memberNamed(permsNode, "ask")?.value ?? null);
        newText =
            permsNode === null
                ? addMember(doc.text, doc.root, "permissions", { ask: toAdd })
                : askNode === null
                    ? addMember(doc.text, permsNode, "ask", toAdd)
                    : appendElements(doc.text, askNode, toAdd);
        // THE ORACLE: the spliced text must hold exactly the value the old parse-and-modify gave.
        const expected = documentValue(doc);
        const expPerms = (Object.prototype.hasOwnProperty.call(expected, "permissions") ? expected.permissions : (expected.permissions = {}));
        expPerms.ask = [...(ask ?? []), ...toAdd];
        const check = readJsonText(Buffer.from(newText, "utf8"));
        if (!check.ok || !sameJsonValue(documentValue(check), expected)) {
            verify(`${rel} could not be edited in place without changing anything but permissions.ask — left untouched; no ask rule was written.`);
            ASK_LEDGER = proven ? previous : unclaimed(askNow);
            return;
        }
    }
    if (!writeTargetFile(file, newText, settingsRead.state, rel)) {
        // Nothing was written, so this run added no rule: the ledger stays as it was when the array found
        // is still install's, and claims nothing otherwise (R3).
        ASK_LEDGER = proven ? previous : unclaimed(askNow);
        return;
    }
    report("created", `${rel} (${toAdd.length} ask rule(s) added to permissions.ask${willCreateFile ? "; file created" : ""})`);
}
// 7. Seed the per-repo state plane into the target (skip-if-exists) so /grugops works first run.
console.log("\n-- state seed --");
seedState();
// D-11 materialization seam (Plan 05): materializeRunnable() copies the compiled kit-shipped
// runnable(s) into the host's committed tools/grugops/ path, between seedState() and
// writeMarker() (the seam Plan 03 reserved). Additive/idempotent/never-overwrite, reusing the
// seedFile shape. This is the TOOL-02 convention Phase 16's test-integrity checker reuses.
console.log("\n-- runnables --");
materializeRunnable();
// 7b. Report a retired configuration key in the target — read-only, never a rewrite (D-05).
reportRetiredConfigKeys();
// 7c. Claude Code ask rules for the governed command spellings (D-18). After seedState(), so a
// first install reads the seeded configuration; before writeMarker().
console.log("\n-- permission rules --");
writeAskRules();
// 8. Write the install marker (grugops-owned; overwritten unconditionally).
writeMarker();
console.log("\n-- notes --");
console.log("  Claude Code plugin form (colon commands /grugops:plan) installs separately:");
console.log("    /plugin marketplace add abitwise/grugops  (UNKNOWN - verify against current tool docs)");
console.log("    /plugin install grugops@grugops           (UNKNOWN - verify against current tool docs)");
console.log("  Safety: the git host is the hard floor — branch protection or rulesets on protected branches,");
console.log("          and deployment environments with required reviewers for production (install/README.md §5).");
console.log("          This installer wrote Claude Code ask rules for the governed command spellings into");
console.log("          .claude/settings.json. They are a speed bump, not a security boundary: other spellings");
console.log("          of the same command are not matched. The Claude Code plugin form cannot carry permission");
console.log("          rules, so a plugin-only install gets none. The other four CLIs get documentation only.");
console.log("  Only a human merges to a protected branch or approves a production deploy.");
// THE CLOSING CLAIM IS CONDITIONAL (27-13, T-27-59). A run that could not read a source directory,
// or that refused a nested adapter, has NOT completed — it installed nothing for that class. Saying
// "complete" over that is the repudiation failure this plan closes, so the banner reports the real
// outcome and points at the `verify` lines that name what was left undone.
if (VERIFY_FINDINGS > 0) {
    console.log(`\n== install INCOMPLETE — ${VERIFY_FINDINGS} item(s) need verification` +
        `${DRY_RUN ? " (DRY_RUN — nothing changed)" : ""} ==`);
    console.log("  Each `verify` line above names what was NOT installed and the remedy for it.");
    // THE MACHINE-READABLE HALF OF THE CONDITIONAL CLAIM (27-21, WR-01). Exit codes: 0 complete,
    // 1 refused or aborted, 2 bad usage, 3 incomplete. Set on the SAME branch that prints the banner
    // so the human-readable and machine-readable signals cannot diverge — a chained `install.js &&
    // next-step`, a CI step, or scripts/coordinator-resolution-precheck.ts must stop here, not
    // proceed over a class that was never installed.
    //
    // AND IT IS `exitCode`, NOT AN EXIT CALL, BECAUSE THE EXIT CALL TRUNCATED THE REPORT IT WAS
    // PAIRED WITH. Node's `process.stdout` is ASYNCHRONOUS when it is a PIPE, and an exit call
    // discards whatever is still queued. This branch is reached after the by-name refusals, which on
    // a cross-linked symlink DAG run to ~1 MB — so the exit call dropped the tail: the
    // MAX_WALK_ENTRIES work-bound line, the `-- state seed --` / `-- runnables --` / `-- notes --`
    // sections, and THIS VERY BANNER. Reproduced against the committed .js: 8 runs of the D-35 DAG
    // fixture, 2 truncated at 223102 and 520729 bytes against a full 1065689, exit status 3 intact
    // in every one. So the machine-readable half survived and the human-readable half vanished —
    // silently, and only when stdout is a pipe (CI, `install.js | tee`, any wrapping script), which
    // is why a TTY-run installer never showed it. That is the exact disappearance this module's own
    // header forbids twice, landing on WR-01's own deliverable: a work bound that reports nothing is
    // not a reported work bound.
    //
    // DO NOT SPELL THE OLD CALL ANYWHERE IN THIS FILE, EVEN IN PROSE. The regression case in
    // install.test.ts is a deliberately DUMB exact-substring scan for it, because a scan smart enough
    // to tell code from a comment is a parser, and a parser that can under-match is the failure this
    // phase has now shipped three times. The first draft of that case went red on this very comment.
    // The scan stays exact and the prose works around it; a future author who writes the literal back
    // in — in code or in a comment — gets a loud red naming the file, which is the safe direction.
    //
    // This assignment is safe here without further thought: the if/else it closes is the LAST
    // statement of the module, so setting the code and falling off the end is byte-for-byte the same
    // control flow, and Node flushes stdout before exiting on its own.
    //
    // EVERY TAIL POSITION ON THIS SURFACE NOW SETS THE CODE (D-41, closing WR-01). The D-35 fix
    // reached ONE of the THREE exit-after-report tails and left the note here claiming a completeness
    // it did not have. All three are converted now, each confirmed to be the last statement after its
    // own reporting: THIS branch, install/uninstall.ts's INCOMPLETE branch (the last statement of that
    // module), and scripts/coordinator-resolution-precheck.ts's tail (the last statement of that one,
    // sitting after its cleanup block, so nothing was relying on a stop-here). The truncation on the
    // two later conversions is NOT reproduced — both emit kilobytes rather than the megabyte that made
    // this one's race observable — so what was fixed there is the INCOMPLETE FIX, not a measured
    // truncation, and the record says so rather than over-claiming.
    //
    // THE STANDING RESIDUAL, SCOPED TO WHAT IT ACTUALLY COVERS. SEVEN `process.exit()` sites remain in
    // this file. Every one of them is MID-SCRIPT and relies on stop-here semantics, so a blind sweep
    // to `exitCode` would let the script RUN ON past a refusal — a worse defect than the one being
    // fixed. They carry the same truncation hazard in principle and none is proven to reach a flush
    // boundary today (each emits kilobytes, not megabytes). RECORDED AS A KNOWN RESIDUAL, not silently
    // left: closing them needs one `finish(code)` authority that sets the code AND still halts, which
    // is a separate change.
    //
    // THAT RESIDUAL IS A COUNT, NOT A LIST OF LINE NUMBERS, AND THE LIST WAS DELETED ON EVIDENCE. This
    // note used to name each of the six by line number. Every one of those numbers had drifted from
    // the site it named by the time anyone read them back, and one had drifted in the OPPOSITE
    // direction to the rest, so not even a constant offset would have recovered them. The measurement
    // is recorded in 27-35-SUMMARY.md rather than repeated here, deliberately: quoting a rotted list
    // as evidence still puts numbers in front of a reader who may trust them, which is the failure
    // being deleted rather than a description of it. A hand-maintained list of line numbers inside a
    // comment is a set literal that rots exactly like the ones this milestone exists to delete — stale
    // when it was read and stale again after the next edit above it.
    //
    // WHAT REPLACES IT is the COUNT plus the stable fact that identifies the class — mid-script,
    // relying on stop-here semantics — neither of which can go out of date by a line. The count is
    // PINNED by an assertion in install.test.ts, so a silent sweep of those six fails loudly instead
    // of passing. That assertion filters comment lines: a raw grep returns SEVEN, because the
    // paragraph above must spell the call once to name what it is describing.
    process.exitCode = 3;
}
else {
    console.log(`\n== install complete${DRY_RUN ? " (DRY_RUN — nothing changed)" : ""} ==`);
}
