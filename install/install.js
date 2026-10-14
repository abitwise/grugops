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
import { existsSync, mkdirSync, writeFileSync, appendFileSync, symlinkSync, cpSync, rmSync, rmdirSync, unlinkSync, renameSync, linkSync, chmodSync, readSync, readdirSync, lstatSync, statSync, mkdtempSync, realpathSync, } from "node:fs";
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
import { ASK_RULE_CHECKPOINTS, askRulesFor, checkpointsToWrite, createdSettingsText } from "./checkpoint-ask-rules.js";
// D-33 (b), plan 33.1-36: the ONE reader of the install marker and of the one install ledger it carries
// (readLedger), and the one serializer of that ledger (ledgerJson), shared with uninstall.ts so the two
// binaries cannot read one malformed record two ways again (WR-05). Node stdlib only, read-only, sibling
// module inside install/.
import { readInstallMarker, readLedger, ledgerJson, entryAt, entriesOfKind, geminiEntry, askRulesEntry, opencodePermissionEntry, createdOpenCodeText, GEMINI_SETTINGS_REL, ASK_RULES_REL, markerUnusableText, markerRemedy, markerFixText, markerDefectText, noMarkerRemedy, contentRecord, fileRecord, modeText, linkRecord, recordHolds, checkRecord, readOwnedContent, jsonValueRecord, owns, carriedKitRecord, readKitHomeRecord, KIT_ENTRY_PATH, KIT_HOME_RECORD_REL, MARKER_REL, isLedgerPath, blockLineSpans, backupContentRecord, outermostBackups, carriedBackups, installedAgents, agentsToRecord, entryHolds, wholeFileEntryRels, } from "./install-marker.js";
// Red-team B3 of plan 33.1-29 (D-18): the ONE way a JSON file the user owns is edited, as text. Only
// the value that changes is spliced into the original bytes; see the module header. No I/O.
import { readJsonText, keyCount, memberNamed, documentValue, appendElements, addMember, sameJsonValue, firstDuplicateKey, valueOf, } from "./json-text.js";
// Phase 34 D-11: the one registry of supported host tools. Pure data, imports nothing, so this edge
// keeps install/ free of scripts/ imports (33.1 D-18/D-28).
import { ADAPTER_FOOTPRINT, HOST_TOOLS, KIT_ROUTE, OPENCODE_CONFIG_REL, OPENCODE_RULE_SCOPE, POINTER_LINE, ROUTE_POINTERS, agentCommand, agentFlag, carriesKitRoute, commandContextFromRecord, entryOwners, hostForFlag, routeCarriers, reachVia, scriptCommand, strandedBy, } from "./host-tools.js";
// Phase 34.1 D-02: the agent checkbox list as a pure state machine (key decoding, steps, frames, rows). It imports
// nothing and does no I/O; pickAgents below is its raw-mode reader.
import { HIDE_CURSOR, decodeKeys, initialPicker, pickerRows, render, restoreTerminal, step } from "./agent-picker.js";
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
import { readUserFile, readForWrite, wayTo, kindAt, isRecordedAbsolute, directoryComponent, unreadState, isOwnLink, gone, pathLimitProblem, writeAccessProblem, realTargetPath, realPathThroughExisting, treeRecord, canonicalPathSpelling, absoluteSpelling, } from "./user-file.js";
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
// A VALUE-TAKING FLAG WITH NO VALUE IS BAD USAGE (red-team L4 of plan 33.1-34). `--target` is the one
// value-taking flag. With no value (the last argument, `--target=`, or followed by another flag) it used
// to leave ARG_TARGET empty, and resolveTarget then fell back to TARGET or the current directory: the
// run went ahead on a directory the human did not name. Every usage error reaches the one exit below.
let USAGE_ERROR = null;
// D-01 (phase 34.1): the agents named by per-agent flags, as registry ids in the order given. Each flag is spelled
// by host-tools.ts agentFlag and recognised only by hostForFlag, so there is no flag list here. SELECTION (plan
// 34.1-06, D-03) reads this set first; what install writes per agent follows SELECTION from plan 34.1-08.
const SELECTED_BY_FLAG = new Set();
let flagHost = null;
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--target" || a.startsWith("--target=")) {
        const value = a === "--target" ? argv[++i] : a.slice("--target=".length);
        if (value === undefined || value === "" || (a === "--target" && value.startsWith("--"))) {
            USAGE_ERROR =
                "--target needs a directory (usage: node install/install.js --target <repo>, or --target=<path> for a " +
                    "path that begins with --)";
            break;
        }
        ARG_TARGET = value;
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
    else if ((flagHost = hostForFlag(a)) !== null) {
        SELECTED_BY_FLAG.add(flagHost.id);
    }
    else {
        USAGE_ERROR = `unknown argument: ${a}`;
        break;
    }
}
// D-25 (phase 34.1): an agent flag chooses what install writes. --check, --update and --prune-old-kit write no agent's
// files, so combining one of them with an agent flag is bad usage, refused through the one usage exit below before
// anything is read or written.
if (USAGE_ERROR === null && SELECTED_BY_FLAG.size > 0 && (CHECK || UPDATE || PRUNE_OLD_KIT)) {
    const given = HOST_TOOLS.filter((h) => SELECTED_BY_FLAG.has(h.id)).map(agentFlag).join(" ");
    const modes = [CHECK ? "--check" : "", UPDATE ? "--update" : "", PRUNE_OLD_KIT ? "--prune-old-kit" : ""]
        .filter((m) => m !== "")
        .join(" ");
    USAGE_ERROR =
        `agent flags (${given}) cannot be combined with ${modes}: agent flags choose what install writes, and ${modes} ` +
            `writes no agent's files` +
            (CHECK ? `; --check reads the agents from the install record (${MARKER_REL}), not from flags` : "");
}
if (USAGE_ERROR !== null) {
    process.stderr.write(`install.js: ${USAGE_ERROR}\n`);
    process.exit(2);
}
// import.meta.dirname (Node 22+) replaces the .mjs's dirname(fileURLToPath(import.meta.url)).
const SCRIPT_DIR = import.meta.dirname;
const GRUGOPS_SRC = process.env.GRUGOPS_SRC
    ? resolve(process.env.GRUGOPS_SRC)
    : resolve(SCRIPT_DIR, "..");
const DRY_RUN = process.env.DRY_RUN === "1";
// D-05: default to COPY (symlink is opt-in via --symlink / INSTALL_MODE=symlink). Copy is the
// only mode that behaves identically on every platform; symlinks broke the dogfood.
//
// ONLY THE TWO MODES (red-team B2 of plan 33.1-33, brief DC-2). Any other value used to run as a
// link install and be recorded verbatim in the marker's installMode, so a marker holding "banana" was
// install's own. The marker's reader now accepts only "copy" or "symlink" (install-marker.ts
// installMarkerProblems), so any other value is refused here as bad usage, before anything is written.
const INSTALL_MODE = (() => {
    if (ARG_SYMLINK)
        return "symlink";
    const env = process.env.INSTALL_MODE;
    if (env === undefined || env === "" || env === "copy")
        return "copy";
    if (env === "symlink")
        return "symlink";
    process.stderr.write(`install.js: INSTALL_MODE must be copy or symlink (it is ${JSON.stringify(env).slice(0, 80)})\n`);
    process.exit(2);
})();
// resolveGrugopsHome: mirror install.sh's resolve_grugops_home. Empty-string GRUGOPS_HOME must
// also fall back (the sh :- colon form). Resolve via os.homedir() so the Windows home (USERPROFILE)
// matches Git Bash $HOME. Spelled by user-file.ts canonicalPathSpelling, the one spelling of every path
// install records (plan 34-11, D-19, WIN-1): forward slashes on Windows so the materialized KIT= line is
// byte-identical to the sh side, and unchanged on POSIX, where a backslash is a filename byte and
// folding it would name another directory (full Windows parity is UNKNOWN - verify).
const GRUGOPS_HOME = canonicalPathSpelling(process.env.GRUGOPS_HOME && process.env.GRUGOPS_HOME.trim()
    ? resolve(process.env.GRUGOPS_HOME)
    : resolve(homedir(), ".grugops"));
const KIT_ROOT = canonicalPathSpelling(resolve(GRUGOPS_HOME, "agent-factory"));
// KIT_COPY_SOURCE: the directory copyKit copies to KIT_ROOT (copyKit spells the same join for the fs
// census). seedRoot reads a DRY_RUN's seed from it (red-team L2 of plan 33.1-34).
const KIT_COPY_SOURCE = join(GRUGOPS_SRC, "agent-factory");
// readlineSync: read a single line from stdin (fd 0) synchronously, byte by byte until newline or
// EOF. Used only for the interactive prompts (the target question, and D-32's edited-kit question);
// --yes / non-TTY never reach the first, and the second is asked only at a terminal.
//
// EAGAIN IS WAITED OUT, NOT READ AS END OF INPUT (plan 33.1-32). Once anything touches
// process.stdin, libuv puts a terminal's fd 0 into non-blocking mode, and a read with no key pressed
// yet throws EAGAIN. Before, that throw ended the loop, so the answer read as "" (the default) before
// the human typed anything. Measured under script(1) on darwin. The wait is a synchronous sleep on
// a private SharedArrayBuffer (Atomics.wait), so nothing else runs meanwhile.
//
// readStdin is THE ONE READ of standard input (the line prompts and the agent checkbox list, plan 34.1-12): it fills
// `buf` from fd 0 and returns the byte count, waiting out EAGAIN; 0 means end of input or a read error, which every
// caller treats as "no more input".
const STDIN_WAIT = new Int32Array(new SharedArrayBuffer(4));
function readStdin(buf) {
    for (;;) {
        try {
            return readSync(0, buf, 0, buf.length, null);
        }
        catch (e) {
            if (e.code === "EAGAIN") {
                Atomics.wait(STDIN_WAIT, 0, 0, 25);
                continue;
            }
            return 0;
        }
    }
}
function readlineSync() {
    const chunks = [];
    const buf = Buffer.alloc(1);
    for (;;) {
        const n = readStdin(buf);
        if (n <= 0)
            break;
        if (buf[0] === 0x0a)
            break; // newline
        chunks.push(buf[0]);
    }
    return Buffer.from(chunks).toString("utf8");
}
// pickAgents (phase 34.1, D-02): the raw-mode reader of the agent checkbox list. The list itself (keys, steps, frames)
// is install/agent-picker.ts; this shell only moves bytes. It hides the cursor, puts standard input in raw mode, reads
// it through readStdin (16 bytes at most per read, one key per read in practice), decodes each chunk, applies each key
// and repaints. It answers the confirmed checkbox list, or null when the list was cancelled: Ctrl-C (byte 0x03, which
// raises no SIGINT in raw mode) or the end of input. THE TERMINAL IS ALWAYS RESTORED on every exit this process
// controls (plan 34.1-16, review IN-18): the cursor is hidden as the first statement inside the try, and the finally
// block hands process.stdout.write and stdin.setRawMode, bound to their streams, to agent-picker.ts restoreTerminal,
// which shows the cursor (and a newline), then turns raw mode off, each step in its own try. A failure of one step never
// skips the other, and the restore never throws, so on confirm, cancel, end of input or a thrown error (setRawMode(true)
// included) the error that ended the list is the one the caller sees. RESIDUAL: a SIGTERM or SIGHUP while the list is
// open ends the process inside the synchronous read loop, where no JavaScript runs, so the cursor can stay hidden;
// whether Node turns raw mode off then is UNKNOWN - verify (review IN-18 says it does; this plan did not run it).
// install/README.md gives the remedy (`tput cnorm`). Nothing in the loop exits the process; the caller refuses through
// refuseSelection after this returns. Reached only when standard input and
// standard output are both terminals (the SELECTION_WHY gate below); no environment variable or file feeds it keys.
function pickAgents(rows, checked) {
    const stdin = process.stdin;
    if (typeof stdin.setRawMode !== "function")
        return null;
    let state = initialPicker(checked);
    let answer = null;
    let carry = "";
    let lines = 0;
    const buf = Buffer.alloc(16);
    const paint = () => {
        const frame = render(state, rows, lines, process.stdout.columns);
        process.stdout.write(frame.text);
        lines = frame.lines;
    };
    try {
        process.stdout.write(HIDE_CURSOR);
        stdin.setRawMode(true);
        paint();
        read: for (;;) {
            const n = readStdin(buf);
            if (n <= 0)
                break; // end of input: cancelled
            const decoded = decodeKeys(buf.toString("latin1", 0, n), carry);
            carry = decoded.carry;
            for (const key of decoded.keys) {
                const next = step(state, key);
                if ("done" in next) {
                    if (next.done === "confirm")
                        answer = next.checked;
                    break read;
                }
                state = next;
            }
            paint();
        }
    }
    finally {
        restoreTerminal({ write: process.stdout.write.bind(process.stdout), setRawMode: stdin.setRawMode.bind(stdin) });
    }
    return answer;
}
// --- resolve TARGET (INSTALL-03): --target flag > TARGET env > prompt(default CWD). Non-TTY or
// --yes takes the default without prompting (CI-safe). Resolved to absolute before any write. ---
function resolveTarget() {
    if (ARG_TARGET)
        return canonicalPathSpelling(resolve(ARG_TARGET));
    const def = process.env.TARGET ? resolve(process.env.TARGET) : process.cwd();
    if (YES || !process.stdin.isTTY)
        return canonicalPathSpelling(def);
    // No-target modes never install INTO a repo (WR-02): --update is kit-home-only and
    // --prune-old-kit only removes backups install recorded (plan 33.1-40). Do NOT ask "install into which
    // repo?" for them. --update ignores the answer entirely, so take the default silently; prune
    // still needs a repo root to scan, so it asks its own mode-appropriate question.
    if (UPDATE)
        return canonicalPathSpelling(def);
    if (PRUNE_OLD_KIT) {
        process.stdout.write(`Prune grugops backups in which repo? [${canonicalPathSpelling(def)}] `);
        const pruneAns = readlineSync().trim();
        return canonicalPathSpelling(pruneAns ? resolve(pruneAns) : def);
    }
    // Interactive confirm-the-default prompt (synchronous one-line read of stdin).
    process.stdout.write(`Install grugops into which repo? [${canonicalPathSpelling(def)}] `);
    const ans = readlineSync().trim();
    return canonicalPathSpelling(ans ? resolve(ans) : def);
}
const TARGET = resolveTarget();
// DOCTOR_MARKER_READ (phase 34.1 gap round 3, D-36, review WR-21): under `--check`, the one read of this target's install
// marker. The doctor checks it, and COMMAND_CONTEXT below takes the doctor's printed kit home and install mode from it,
// so the two read one marker. Null in every other mode: a run that chooses the kit home itself passes no record.
const DOCTOR_MARKER_READ = CHECK ? readInstallMarker(TARGET) : null;
// COMMAND_CONTEXT (phase 34.1 gap round 2, D-33, WR-19; gap round 3, D-36, WR-21): how a command this run prints is
// invoked, built once by host-tools.ts commandContextFromRecord (the one owner), for every command it prints
// (agentCommand's fourth argument, scriptCommand's second). The script directory is this script's own, so a printed
// command names install.js and uninstall.js by their absolute paths and runs from any directory. The kit home and the
// install mode come from:
//   --check: the marker the doctor checks (DOCTOR_MARKER_READ). When it reads `ok` (install's own record for this
//     directory), the printed install commands carry the kit home and install mode it records, whatever kit home or
//     mode the `--check` run was given, so following one writes no second kit and does not move the install (WR-21).
//     When there is no usable marker (absent, unreadable, or `unbound`, another directory's record, never read for
//     this), they carry this run's own GRUGOPS_HOME and INSTALL_MODE.
//   install, --migrate, --update, --prune-old-kit: this run's own GRUGOPS_HOME and INSTALL_MODE (no record is passed).
//     Such a run chooses the kit home itself, so its printed commands repeat the invocation the user gave. When it
//     writes the kit, writeMarker records this run's kit home and mode (kitFromThisRun), so the commands match the
//     marker it leaves; taking the kit home from the marker as it was before the run would print the old one, and
//     following that command would move the install back. One case does not match: when the run writes no kit file
//     and Claude Code stays installed after it (for example `--codex` with a new GRUGOPS_HOME over a Claude Code
//     install), writeMarker's kept() keeps the previous marker's grugopsHome, kitRoot and installMode, so the marker
//     can hold an older kit home than the one this run's printed commands carry.
// The kit home is a path, the default `~/.grugops` included (D-38, plan 34.1-47, review WR-25), so every printed
// command, of either binary, states `GRUGOPS_HOME=<dir>` and an exported GRUGOPS_HOME in the user's shell cannot change
// where it puts or reads the kit. A printed install command states its install mode as `INSTALL_MODE=<copy|symlink>`,
// the one spelling install.js accepts for both modes, and never carries `--symlink` (D-38, plan 34.1-48, review WR-25:
// an exported INSTALL_MODE turned a printed copy-mode remedy into a symlink install). Every path is in
// canonicalPathSpelling's one spelling. Declared after TARGET (the marker read needs it); no module-level statement
// above calls agentCommand, scriptCommand or the doctor's command helpers below, which run only from functions and
// branches after this line. The doctor's unbound-marker WARN names COMMAND_CONTEXT.kitHome, the kit home its printed
// install step copies the kit into (plan 34.1-41, D-36), so the user sees where that step puts the kit before running it.
// The kit checkout (plan 34.1-37, D-36, review WR-23; plan 34.1-48, D-38): `src` is this run's GRUGOPS_SRC (this
// script's own checkout when none was given), in the one spelling. Every printed command states it as
// `GRUGOPS_SRC=<src>`, this checkout included, so the doctor's stale-adapter remedy renders from the checkout the doctor
// compared, an install's printed commands use the checkout the install used, and an exported GRUGOPS_SRC in the user's
// shell cannot change either. The marker records no checkout, so this always comes from the run.
const COMMAND_CONTEXT = commandContextFromRecord(DOCTOR_MARKER_READ, {
    scriptDir: canonicalPathSpelling(SCRIPT_DIR),
    kitHome: GRUGOPS_HOME,
    installMode: INSTALL_MODE,
    src: canonicalPathSpelling(GRUGOPS_SRC),
});
// DOCTOR_KIT_HOME and DOCTOR_KIT_ROOT (plan 34.1-50, D-38, review WR-24): the one kit home a `--check` run reads, and
// its agent-factory in canonicalPathSpelling's one spelling. It is COMMAND_CONTEXT's, so the doctor's header (`home:`
// and `kit:`), the kit-root cross-check's rule source, the stat checks of the kit, the kit VERSION read, the
// stale-adapter wording and the stale-adapter render (transformAdapter's kit root) read the kit home its printed
// commands state: an `ok` marker's recorded kit home, else this run's own (an absent, unreadable or unbound marker).
// Before, the printed commands took the record's while every check took this run's GRUGOPS_HOME, so a plain `--check` on
// an install with a kit home other than the default FAILed "kit-root sources DISAGREE (stale/moved install)", and the
// printed remedy could not clear it. A real stale or moved install still FAILs: the marker's kitRoot or the adapter's
// KIT= line then disagrees with the recorded kit home. The doctor names this run's own kit home only on one header
// line, when it differs, as not used. Outside `--check` COMMAND_CONTEXT is this run's, so both equal GRUGOPS_HOME and
// KIT_ROOT; only the doctor reads them. Held by the "WR-24 census" in install/agents-record.test.ts.
const DOCTOR_KIT_HOME = canonicalPathSpelling(COMMAND_CONTEXT.kitHome);
const DOCTOR_KIT_ROOT = canonicalPathSpelling(resolve(DOCTOR_KIT_HOME, "agent-factory"));
// THE DOCTOR'S COMMANDS (phase 34.1 gap round 2, D-33, D-31; DI-08). Every doctor remedy that asks the user to run
// install.js prints its command from the helpers below, so the command runs as printed from any directory, with the
// kit home and the install mode COMMAND_CONTEXT holds (host-tools.ts agentCommand with COMMAND_CONTEXT, the one
// builder): the ones install's own marker for this directory records when the doctor reads it `ok`, whatever this
// `--check` run was given, and this run's own otherwise (gap round 3, D-36, WR-21; see COMMAND_CONTEXT above).
//
// Why they are flag-less: `--check` takes no agent flag (D-25) and speaks for the agents the marker records. install.js
// with no agent flag chooses that same recorded set when it runs unattended (D-03), and at a terminal it shows the
// agent list with them checked (D-02). With no marker, or one the doctor cannot use, install detects the agents here
// or refuses and names the agent flags; the remedy text says so where that applies. The one doctor note that names a
// single agent (the nothing-installed note) keeps that agent's flag and does not use these.
/** The doctor's install command: `agentCommand("install.js", TARGET, [], COMMAND_CONTEXT)` (no agent flag). */
function doctorInstallCommand() {
    return agentCommand("install.js", TARGET, [], COMMAND_CONTEXT);
}
/** The doctor's check command: `agentCommand("install.js", TARGET, [], COMMAND_CONTEXT, ["--check"])` (D-25). */
function doctorCheckCommand() {
    return agentCommand("install.js", TARGET, [], COMMAND_CONTEXT, ["--check"]);
}
/**
 * THE --migrate SAME-RUN COMMAND (phase 34.1 gap round 2, D-31, DI-09; D-33): `agentCommand("install.js", TARGET,
 * SELECTION, COMMAND_CONTEXT, ["--migrate"])`, the command that runs --migrate again for the agents this run chose, with
 * this run's kit home and install mode. Every --migrate remedy that asks for a re-run prints it: both migrate
 * INCOMPLETE banners (MIGRATE_AGAIN_LINE) and the handoffs backup's never-clobber abort. Called only under MIGRATE,
 * after SELECTION is set.
 */
function migrateCommand() {
    return agentCommand("install.js", TARGET, SELECTION, COMMAND_CONTEXT, ["--migrate"]);
}
// DOCTOR_NO_FLAG_CLAUSE: what install does with no agent flag, printed after doctorInstallCommand() by the remedies
// whose marker is absent or not this directory's record (notInstalled, the unbound-marker WARN; markerUnreadable prints
// no install command, D-37). It states SELECTION_WHY's chain in order: at a terminal the agent list (pickAgents);
// unattended, the agents a usable marker records (INSTALLED_BEFORE), else the agents detected here (detectedHosts), else
// refuseSelection, which names every agent flag.
const DOCTOR_NO_FLAG_CLAUSE = "with no agent flag, install shows the agent list at a terminal; unattended, it chooses the agents a usable marker " +
    "records, else the agents detected here, else it refuses and names the agent flags";
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
//
// BOTH DIALS, ONE PROBE, ONE LINE (plan 34-15, D-20, WR-03). The generator announces two
// resolutions: the MODEL assignment and the EFFORT assignment. The probe reads both through the
// module's own two readers and prints them on its one line as `results` (model) and `effortResults`
// (effort), so the installer reads both announcements the same way, at the same site, and still
// holds no copy of either prefix.
const RESOLUTION_PROBE_REL = "grugops-read-resolution.mjs";
const RESOLUTION_PROBE_SOURCE = [
    "// Written into a temp mirror by the grugops installer and removed with it. It exists so the",
    "// installer can read the resolution the generator announced without importing the module that",
    "// owns that grammar: the reader stays where it is declared, and the installer holds no copy of",
    "// the marker. Reads the generator's stdout from stdin; prints one JSON line.",
    'import { resolvedAssignmentsIn, resolvedEffortAssignmentsIn } from "./model-tiers.js";',
    'let input = "";',
    'process.stdin.setEncoding("utf8");',
    "for await (const chunk of process.stdin) input += chunk;",
    "process.stdout.write(",
    "  JSON.stringify({",
    "    results: resolvedAssignmentsIn(input),",
    "    effortResults: resolvedEffortAssignmentsIn(input),",
    '  }) + "\\n",',
    ");",
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
// as a POSIX path relative to TARGET. writeMarker() records each as a `dir` entry of the install ledger, and
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
// install ledger as kit-false `file` entries, and uninstall deletes one of those files only when the ledger lists it
// and the file still holds what the record says, so a file the user had before the install (a blank
// Copilot file, a byte-identical AGENTS.md from the minimal copy path) is never deleted. Only a
// successful create is recorded: an append, a skip and a DRY_RUN preview record nothing. The
// inside-TARGET test is mkdirp's.
const CREATED_FILES = new Map();
const targetRel = (path) => {
    const rel = relative(TARGET, path);
    if (rel === "" || isAbsolute(rel) || rel === ".." || rel.startsWith(`..${sep}`))
        return null;
    return canonicalPathSpelling(rel);
};
const recordCreatedFile = (path, record) => {
    const rel = targetRel(path);
    if (rel !== null)
        CREATED_FILES.set(rel, record);
};
// KIT_FILES (plan 33.1-30, Gap B completed, brief DC-2, D-18): what THIS run wrote to each grugops
// skill and adapter file (.claude/skills/<name>/SKILL.md, .claude/agents/<file>.md), as a POSIX path
// relative to TARGET mapped to the content record of what is there now because of this run:
// materializeAdapter records `sha256:` of the final bytes it wrote, and copyKitFile (a skill without the
// slot line; linkOrCopy's job before plan 33.1-31) records `sha256:` of a copy or `link:<source>` of the
// link install makes. A destination that already held exactly those bytes (or that link) is recorded only
// as a CARRY of the previous ledger's kit-true entry, while owns says it still holds (identicalKitDest,
// plan 33.1-37 Task 4); identity with the kit source alone records nothing. A user's edit to a kit file is user content: writeMarker() records this map in the
// install ledger as kit-true `file` entries, and uninstall removes a kit file only while it still holds its record. A DRY_RUN
// preview, a refusal (verify) and a skip of a link or file that is not install's record nothing.
const KIT_FILES = new Map();
// KIT_WRITTEN (plan 33.1-32, D-32): true once executeKitPlan ran in this run. When the kit was not
// written, for any reason (no consent, a pre-flight hazard, a failed backup, a kit-plan refusal), the
// kit in the target is still the one the previous marker describes, so writeMarker writes every kit
// field back from that marker and learns nothing from this run (see A RUN THAT WROTE NO KIT FILE in
// writeMarker's header).
let KIT_WRITTEN = false;
// KIT_HOME_WOULD_COPY (plan 34-33): copyKit's own DRY_RUN decision, recorded where it is taken: true when a DRY_RUN
// reported `would-copy` for the kit home, so the real run would put the kit source at KIT_ROOT. Read only by
// adapterRouteAfterRun (install's route-note pass), never recomputed there.
let KIT_HOME_WOULD_COPY = false;
// PLANNED_BYTES (plan 34-33, D-27 point 2): under DRY_RUN, the bytes the real run would leave at a target-relative
// path (POSIX spelling, targetRel), recorded by each DRY_RUN branch that reports would-add, would-copy, would-link or
// would-refresh for a route carrier. A real run records nothing here: the files on disk
// are the state. In memory only; noteStrandingCarriers reads it, and nothing writes it to disk or to a record.
// Declared above the doctor's early exit so no early branch can reach a setPlanned call in its temporal dead zone;
// the doctor never reads it.
const PLANNED_BYTES = new Map();
function setPlanned(path, bytes) {
    const rel = targetRel(path);
    if (rel !== null)
        PLANNED_BYTES.set(rel, typeof bytes === "string" ? Buffer.from(bytes, "utf8") : bytes);
}
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
// writtenFileRecord (red-team L1 of plan 33.1-34, brief DC-2): the record of a file THIS run has just
// written at `path`, fileRecord of the bytes it wrote and the mode the file has now (install-marker.ts
// THE FILE MODE), so uninstall treats a later chmod as a user edit. A path whose mode cannot be read back
// is recorded by its bytes alone, as a record from before this rule was, and uninstall says so.
function writtenFileRecord(path, bytes) {
    try {
        return fileRecord(bytes, lstatSync(path).mode);
    }
    catch {
        return contentRecord(bytes);
    }
}
const recordKitFile = (path, record) => {
    if (DRY_RUN)
        return;
    const rel = targetRel(path);
    if (rel !== null)
        KIT_FILES.set(rel, record);
};
// BACKUPS (plan 33.1-40, D-33 (c), review CR-02, deferred row 45): every backup THIS run made in the
// target, by its final POSIX path relative to TARGET, as a `backup` entry of the install ledger: where it
// came from (`origin`), what it was made of (`of`), and its content record taken once the backup is in
// place (install-marker.ts backupContentRecord: a file record, a link record or a tree record, or null
// when it could not be read in full, which prune never removes). writeMarker() records each one. The
// origins: the in-repo agent-factory/ --migrate moves aside (in-repo-kit), a legacy config it renames
// (legacy-config), plans/handoffs/ (handoffs) and a kit file the user edited, backed up before the kit is
// refreshed (edited-kit-file, D-32). Kit-home backups are recorded in the kit-home record (copyKit,
// plan 33.1-37), not here.
//
// ONLY THE OUTERMOST. A backup made of a path that holds an earlier backup of this run carries that one
// inside it (--migrate renames agent-factory/config/factory.config.json to a .bak, then moves the whole
// agent-factory/ aside), so the inner entry, whose path is gone, is dropped and the outer tree record
// covers it. A DRY_RUN preview, a path outside the target and a failed backup record nothing.
const BACKUPS = new Map();
function recordBackup(path, origin, of) {
    if (DRY_RUN)
        return;
    const rel = targetRel(path);
    const ofRel = targetRel(of);
    // An entry readLedger would refuse would make the whole ledger malformed, so such a path is not recorded.
    if (rel === null || ofRel === null || rel === ofRel || !isLedgerPath(rel) || !isLedgerPath(ofRel))
        return;
    // What this run recorded inside the path it just moved now lives inside this backup.
    for (const k of [...BACKUPS.keys()])
        if (k === ofRel || k.startsWith(`${ofRel}/`))
            BACKUPS.delete(k);
    BACKUPS.set(rel, { path: rel, kind: "backup", origin, of: ofRel, content: backupContentRecord(TARGET, rel) });
}
// APPENDED_FILES (red-team of plan 33.1-28, R1): every file ensureBlock APPENDED its block to in this
// run. The file was there without a grugops block when this run started, so it is the user's, whatever
// an earlier record says: a user who deleted a file install created and made their own at the same
// name has a file install did not create. writeMarker() drops such a path's kit-false file entry, and this
// rule does not depend on the bytes (appending the block to an empty file produces exactly the bytes a
// create writes, so a content record alone could not tell the two apart).
const APPENDED_FILES = new Set();
// APPENDED_BLOCKS (plan 33.1-33, brief DC-2, red-team carry items 4, 6 and 11; red-team B1 of plan
// 33.1-33): what ensureBlock appended to each file in this run, by POSIX path relative to TARGET, on a
// create and on an append alike: the content record of the block LINES (`<open>\n<body>\n<close>\n`)
// and what the one newline written before them did (`blank-line` or `line-end`; install-marker.ts
// the `block` entry). writeMarker() records each as a `block` entry of the install ledger. Uninstall removes the block lines
// only on this record, and the newline before them only when the record and the bytes around it show
// it is install's, so a user's line inside the block, their trailing blank lines, their final newline
// and a file that held only blank lines all survive, and a repository with no record is left.
const APPENDED_BLOCKS = new Map();
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
        CREATED_DIRS.add(canonicalPathSpelling(relative(TARGET, cur)));
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
// isOwnLink (the link a --symlink install made: its readlink names the source path, compared with it
// through user-file.ts sameRecordedPath, the one spelling of a recorded path, since plan 34-21) moved
// into ./user-file.ts in the red-team fixes of plan 33.1-27, so install's "this link is mine" and
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
// The grugops backup name-shape: `.bak.` followed by an isoStamp() ISO timestamp
// (YYYY-MM-DDTHH-MM-SS.mmmZ, colons replaced by '-'), anchored to end-of-string. SINCE PLAN 33.1-40 IT
// DECIDES NO REMOVAL (review CR-02, brief DC-2): a user's `thesis.bak.<ISO>/` has this shape too, so a
// name is not evidence that install made it. pruneOldKit uses it only in its report-only scan, to name
// a backup-shaped path that has no record. Declared HERE (with the other early helpers) so the early
// --prune-old-kit branch reaches it without a const TDZ error.
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
// It reads one kit home, DOCTOR_KIT_HOME / DOCTOR_KIT_ROOT (plan 34.1-50, D-38, review WR-24): the kit home its
// printed commands state, which is the one an `ok` marker records, else this run's GRUGOPS_HOME / KIT_ROOT. It is
// source (a) of the D-03 cross-check, the root of the kit stat checks and the kit VERSION read. Fail-closed parsing: a garbled or absent marker/adapter becomes a finding, never
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
// The ledger's reader lives in ./install-marker.ts, shared with uninstall.ts (WR-05): a local reader
// here used to read a malformed ask-rule record as "no record" while uninstall refused on it.
// readMarker: fail-closed read of the byte-stable .grugops/install.json the installer wrote
// (writeMarker schema), for the callers that need only "a usable marker or none" (the doctor's
// version and kit checks, old-layout detection) — source (b) of D-03. It delegates to the shared
// reader in ./install-marker.ts, so the marker is parsed one way in both binaries: an absent,
// garbled or non-object marker returns null (never throws). The ledger callers use the tri-state
// directly, because for them "unreadable" and "absent" must not be the same answer (WR-05).
//
// An `unbound` marker (install's marker shape for another directory, or one written before markers
// carried `target`; red-team B2 of plan 33.1-33) still shows that an install laid this target out in
// the two-root form, so old-layout detection counts it as a marker. No ledger is read here.
function readMarker() {
    const read = readInstallMarker(TARGET);
    if (read.state === "ok")
        return read.marker;
    if (read.state === "unbound")
        return read.object;
    return null;
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
// docAbspath: byte-parity twin of install.sh's abspath() — an absolute path is returned in the one
// recorded-path spelling but otherwise VERBATIM (no `.`/`..` collapsing, no trailing-slash trimming,
// unlike node:path resolve()); a relative path is prefixed with cwd. Used by the D-03 cross-check so a
// cosmetic-but-textually-different kitRoot classifies consistently (using resolve() here would
// over-normalize `…/agent-factory/.` to `…/agent-factory` and turn a WARN into a pass). The absolute test
// is user-file.ts isRecordedAbsolute, the one absoluteness rule for a recorded path (the host flavor's
// own isAbsolute), asked through absoluteSpelling (plan 34-11, D-19; plan 34-21, D-23): the earlier
// leading-`/` test read a Windows `C:/…` kitRoot as relative and prefixed the cwd to it.
const docAbspath = (p) => absoluteSpelling(p, process.cwd());
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
    docReport("FAIL", `grugops not installed in ${TARGET} — run install.js \`${doctorInstallCommand()}\` (then \`${doctorCheckCommand()}\`); ${DOCTOR_NO_FLAG_CLAUSE}`);
    console.log("\n1 FAILURE(S)");
}
// markerUnreadable (red-team of plan 33.1-27): the marker is THERE but could not be read as this
// target's JSON object (a FIFO, a directory, a symbolic link, a link on the way, garbage, too large).
// "not installed" would claim it is absent, which is false and hides the one file the human must
// look at. Still a FAIL with the same exit code, and still fail-closed: nothing else is checked.
//
// THE REMEDY NEVER REMOVES THE MARKER (phase 34.1 gap round 4, D-37, 34.1 review CR-05; amends D-35). Whatever the read
// (not JSON, not an object, a blocked read, a duplicate key, a byte the strict reader refuses, a field install never
// writes, a retired record next to the ledger), the marker is the one record install keeps of the agents installed
// here: removing it would leave every file install made with no record, so no uninstall could take them out. The FAIL
// names the cause the reader saw and its by-hand fix (install-marker.ts markerFixText of markerRemedy's answer, whose
// fix is the read's problems), and prints only the check command: once the file is fixed by hand the check re-reads the
// record. No install command is printed, so none names a kit home over a record this run could not read.
function markerUnreadable(markerFile, read) {
    const remedy = markerRemedy(read) ?? noMarkerRemedy("markerUnreadable");
    docReport("FAIL", `the install marker ${markerFile} is present but ${markerUnusableText(read)} — the ` +
        `install state of ${TARGET} is unknown, so nothing else was checked. ` +
        `${markerFixText(remedy)}; then run \`${doctorCheckCommand()}\``);
    console.log("\n1 FAILURE(S)");
}
// CLAUDE.md sentinel block — byte-identical to uninstall.ts (GSD:grugops-start-here).
const CLAUDE_OPEN = "<!-- GSD:grugops-start-here -->";
// CLAUDE_PTR (D-26 point 1, plan 34-28): the start-here sentence, one space, then KIT_ROUTE (host-tools.ts, the
// one authority for the route), still one line, like COPILOT_PTR below. Fixed text: no install-time value.
const CLAUDE_PTR = "**grugops — start here:** read `AGENTS.md`, then `agent-factory/roles/orchestrator.md`, and act as the Orchestrator. " + KIT_ROUTE;
const CLAUDE_CLOSE = "<!-- GSD:grugops-start-here-end -->";
// WR-05: the Copilot block has its OWN distinct sentinel (not the CLAUDE.md one), so the two
// blocks are removed independently by uninstall.ts — must match it exactly.
const COPILOT_REL = ".github/copilot-instructions.md";
const COPILOT_OPEN = "<!-- GSD:grugops-copilot-start-here -->";
// COPILOT_PTR (D-26; phase 34.1, D-09): POINTER_LINE (host-tools.ts, the one authority for the start-here sentence,
// one space, then KIT_ROUTE, on one line), the same line every whole-file entry carries. A scripted install puts the
// kit in a separate kit home, so the repository-relative `agent-factory/roles/orchestrator.md` alone never resolves
// for a host with no Claude Code adapter; the route names the marker field that does. Fixed text: no install-time
// value enters it.
const COPILOT_PTR = POINTER_LINE;
const COPILOT_CLOSE = "<!-- GSD:grugops-copilot-start-here-end -->";
// The whole-file entries (the agent skill, the OpenCode command, the Pi prompt template; phase 34.1, plan 34.1-01, D-11)
// are not built here. Each is a committed generated file in the kit (scripts/generate-host-entries.ts renders it from
// agent-factory/packaging/host-entry.pointer.md, whose body is POINTER_LINE), and install copies those bytes from the
// kit source (carrierSource, writeWholeFileEntry). The Pi template's bytes did not move: it is the text install built
// here before phase 34.1 (PI_PROMPT_TEXT, plan 34-04, D-10, D-16), now rendered by the generator. No entry carries a
// kit-root variable or a resolver slot (check-kit-refs Assertion 3), and no config, argv or environment value reaches
// one (T-34-13 holds; POINTER_LINE is fixed literal text).
// ROUTE_BLOCKS (plan 34-29, D-26 point 4): the route carriers install writes as a sentinel block appended to a
// file, with their sentinels. Its keys are the same two paths as BLOCK_RELS in install-marker.ts (CLAUDE.md and the
// Copilot pointer), the list wholeFileEntryRels leaves out. A carrier not
// listed here is a whole file install writes (AGENTS.md, and every whole-file entry wholeFileEntryRels names),
// owned through its `file` entry.
const ROUTE_BLOCKS = new Map([
    ["CLAUDE.md", { open: CLAUDE_OPEN, close: CLAUDE_CLOSE }],
    [COPILOT_REL, { open: COPILOT_OPEN, close: COPILOT_CLOSE }],
]);
// wholeFileEntryRels, the one derivation of the whole-file entries install writes for a set of hosts, lives in
// install-marker.ts (plan 34.1-25, D-33), so install writes them (writeWholeFileEntry) and uninstall reports an
// unrecorded one (reportUnrecordedHostEntries) from the same list.
// ENTRY_NOUN (phase 34.1, plan 34.1-01): what a whole-file entry of each adapter kind is called in install's lines,
// keyed by HostAdapterKind so a new kind is a compile error until it is named here; null for a kind that writes no
// whole-file entry. entryLabel puts the names of the hosts that read the entry before it ("Pi prompt template").
const ENTRY_NOUN = {
    "claude-kit": null,
    "copilot-pointer": null,
    "pi-prompt-template": "prompt template",
    "agent-skill": "skill",
    "opencode-command": "command",
};
// entryLabel (phase 34.1, plan 34.1-01): the label install's lines give the whole-file entry `rel`: the names of the
// HOST_TOOLS rows whose ROUTE_POINTERS include it, in registry order, joined with " and ", then the noun of the first
// such row's adapter kind (ENTRY_NOUN).
function entryLabel(rel) {
    const rows = HOST_TOOLS.filter((h) => ROUTE_POINTERS[h.adapter].includes(rel));
    const noun = rows.length > 0 ? ENTRY_NOUN[rows[0].adapter] : null;
    return `${rows.map((h) => h.name).join(" and ")} ${noun ?? "entry"}`;
}
// hostReadsCarrier (plan 34-32; phase 34.1 D-12, D-17): whether `host` reads route carrier `rel`: `rel` is one of
// routeCarriers(host).
function hostReadsCarrier(host, rel) {
    return routeCarriers(host).includes(rel);
}
// ownBlockSpans (plan 34-28's block rule, made one function by plan 34-29): THE ONE ANSWER to "which copies of
// install's own block, unedited, does this file hold". owns(ledger, TARGET, rel, "block") gives the `block`
// entry; blockLineSpans (install-marker.ts, the one finder uninstall's removal uses too) finds every copy of the
// block lines in `bytes`, and only the spans whose bytes hash to the entry's record are kept. null when the
// ledger has no usable `block` entry for rel. ensureBlock refreshes a block only when exactly one span is kept,
// and the doctor calls a carrier install's own on the same answer, so the two cannot disagree. Pure over its
// arguments: no I/O.
function ownBlockSpans(ledger, rel, bytes, open, close) {
    const own = owns(ledger, TARGET, rel, "block");
    if (!own.owned || own.entry === null)
        return null;
    const record = own.entry.block;
    return { entry: own.entry, spans: blockLineSpans(bytes, open, close).filter((sp) => contentRecord(bytes.subarray(sp.start, sp.end)) === record) };
}
// carrierSource (phase 34.1, plan 34.1-01): THE ONE READ of the kit's current text for a whole-file route carrier
// install writes, one rule with no per-path branch: for AGENTS.md and for every path wholeFileEntryRels(HOST_TOOLS)
// names, the file at that path under the kit source, read through readUserFile (DC-3: bounded, never a FIFO or a
// device); for anything else, null. writeWholeFileEntry asks it for the state of the source (absent: skipped; any
// other unread state: a counted verify), and carrierWant for its bytes, so the two cannot read different sources.
function carrierSource(rel) {
    if (rel !== "AGENTS.md" && !wholeFileEntryRels(HOST_TOOLS).includes(rel))
        return null;
    return readUserFile(join(GRUGOPS_SRC, ...rel.split("/")));
}
// carrierWant (plan 34-34, D-27 point 3): THE ONE SPELLING of the kit's current text for a whole-file route carrier
// install writes: carrierSource's bytes when that read is ok, else null. A function declaration over consts declared
// above the doctor (GRUGOPS_SRC, ROUTE_BLOCKS), so the doctor can ask it.
function carrierWant(rel) {
    const src = carrierSource(rel);
    return src !== null && src.state === "ok" ? src.bytes : null;
}
// linkOwnership (phase 34.1, D-16, WR-16; class AUTH-1): THE ONE ANSWER to "whose link is this" for a route carrier
// `rel` (a POSIX path under TARGET): install's own exactly when owns(ledger, TARGET, rel, "file") answers owned (the
// ledger's record still holds: the path is the link it records, checkRecord) and that record is a `link:` content
// record, the record a --symlink install writes for the link it made. The reason and the remedy are the ones install's
// verify (the AGENTS.md step's blocked arm, writeWholeFileEntry, ensureBlock), install's route note
// (noteStrandingCarriers) and the doctor's carrier line all print, so the doctor and install never give two answers
// about the same link. The remedy is to remove the link in the target and re-run install.js, never to edit the file the
// link points to: that file is in a grugops checkout outside the target, where a `git pull` reverts the edit and every
// other target linked to it changes too. Before phase 34.1 the doctor said install made the link while the re-install's
// verify said "a link it did not create" (WR-16). Reads the ledger and lstat/readlink only; writes nothing. A function
// declaration over imports declared above the doctor, so the doctor can ask it.
function linkOwnership(ledger, rel) {
    const own = owns(ledger, TARGET, rel, "file");
    if (!own.owned || !own.entry.content.startsWith("link:"))
        return { own: false };
    return {
        own: true,
        reason: "it is a link a --symlink install made",
        remedy: `Remove the link at ${rel} and re-run install.js, which links or copies the current kit ${rel}: \`${doctorInstallCommand()}\``,
    };
}
// refreshable (plan 34-34, D-27 point 3, WR-01; classes AUTH-1 and VERDICT-1): THE ONE OWNER of "would install refresh
// route carrier `rel` here". Install refreshes only when it answers ok (refreshOwnFile for a whole file, ensureBlock's
// refresh arm for a block), and the doctor calls a carrier install's own, stale, and names `Re-run install.js`, only
// when it answers ok (classifyCarrier). Before plan 34-34 the doctor decided on owns alone, so on a link install made it
// told the user to re-run install.js, install refused to write through the link, and the FAIL never cleared.
//   A whole file (rel not in ROUTE_BLOCKS), in refreshOwnFile's order of reads:
//     owns(ledger, TARGET, rel, "file") answers owned          else why = owns' reason (asked after linkOwnership)
//     linkOwnership answers not own                            else its reason (a link install made with --symlink:
//                                                               never refreshed)
//     the record is a `sha256:` file record                     else it is not the record of a file install wrote
//     `cur ?? readForWrite` is ok (a regular file, not a link,
//     not a hard link; DC-3: never a FIFO or a device)          else why = "is not present" or blockedAt's wording
//     carrierWant(rel) is not null                              else the kit's current text could not be read
//   A block (rel in ROUTE_BLOCKS):
//     `cur ?? readForWrite` is ok                               else as above
//     the text holds the open sentinel                          else it holds no install block
//     ownBlockSpans is not null                                 else the ledger has no record of install's block
//     exactly one span is kept                                  else it holds N unedited copies, not exactly one
// `cur` is the readForWrite answer the caller already holds (ensureBlock passes its own, so the decision and the splice
// are made on one read); without it the predicate reads through readForWrite itself. It never writes and never reports
// (DC-2: a write follows only on install's own record, whose content must still match). A function declaration over
// imports and consts declared above the doctor (ROUTE_BLOCKS, GRUGOPS_SRC, blockedAt, isSymlink).
function refreshable(ledger, rel, cur) {
    const file = join(TARGET, ...rel.split("/"));
    const no = (why) => ({ ok: false, why, link: isSymlink(file) });
    const readNow = () => {
        const r = cur ?? readForWrite(TARGET, file);
        return r.state === "ok" ? r : r.state === "create" ? "is not present" : blockedAt(r, file);
    };
    const sentinels = ROUTE_BLOCKS.get(rel);
    if (sentinels === undefined) {
        // A link a --symlink install made is never refreshed; linkOwnership is the one answer to whose link it is.
        const link = linkOwnership(ledger, rel);
        if (link.own)
            return no(link.reason);
        const own = owns(ledger, TARGET, rel, "file");
        if (!own.owned)
            return no(own.reason);
        if (!own.entry.content.startsWith("sha256:"))
            return no("install's record for it is not the record of a file it wrote");
        const now = readNow();
        if (typeof now === "string")
            return no(now);
        const want = carrierWant(rel);
        if (want === null)
            return no("the kit's current text for it could not be read");
        return { ok: true, kind: "file", file, cur: now, want };
    }
    const now = readNow();
    if (typeof now === "string")
        return no(now);
    if (!now.text.includes(sentinels.open))
        return no("it holds no install block");
    const blk = ownBlockSpans(ledger, rel, now.bytes, sentinels.open, sentinels.close);
    if (blk === null)
        return no("the install ledger has no record of install's block in it");
    if (blk.spans.length !== 1)
        return no(`it holds ${blk.spans.length} unedited copies of install's recorded block, not exactly one`);
    return { ok: true, kind: "block", file, cur: now, own: blk.entry, span: blk.spans[0] };
}
// installWouldWrite (phase 34.1, D-15, WR-13; classes AUTH-1 and VERDICT-1): THE ONE OWNER of what install would write
// into route carrier X here. Install writes a carrier only on its answer (ensureBlock for a block carrier,
// writeWholeFileEntry and refreshOwnFile for a whole file), and the doctor states a carrier's state and remedy only from
// it (classifyCarrier and the absent arm of kitRouteFindings), so the doctor names `Re-run install.js` exactly when an
// install run on that state writes the carrier. Before phase 34.1 the doctor asked only refreshable ("would install
// refresh X"), so a block carrier whose install block the user had removed was reported as one install leaves alone,
// while ensureBlock appended a fresh block, route included (WR-13).
//   refreshable (the refresh half, the one owner of "would install refresh X") answers ok   → refresh
//   `cur ?? readForWrite` is ok, the carrier is a ROUTE_BLOCKS carrier, and the text holds
//   no open sentinel (a regular file: not a link, not a hard link; DC-3)                  → append
//   readForWrite answers `create` (nothing there, no link or non-directory on the way),
//   and the carrier is a block, or carrierWant can read the kit's current text for it     → create
//   `create`, a whole file, and the kit's current text cannot be read                     → none, that reason
//   readForWrite answers `blocked` (a link, a hard link, a special file, a non-directory
//   on the way: install never writes through it)                                          → none, linkOwnership's
//                                                                                            reason for install's own
//                                                                                            --symlink link, else
//                                                                                            blockedAt's wording
//   anything else (a regular file install will not refresh and does not append to)        → none, refreshable's why
// `cur` is the readForWrite answer the caller already holds (ensureBlock and writeWholeFileEntry pass their own, so
// the decision and the write are made on one read); without it this reads through readForWrite itself. It never
// writes and never reports. A function declaration over consts declared above the doctor, so the doctor can ask it.
function installWouldWrite(ledger, rel, cur) {
    const now = cur ?? readForWrite(TARGET, join(TARGET, ...rel.split("/")));
    const r = refreshable(ledger, rel, now);
    if (r.ok)
        return { act: "refresh", how: r };
    const sentinels = ROUTE_BLOCKS.get(rel);
    if (now.state === "ok" && sentinels !== undefined && !now.text.includes(sentinels.open))
        return { act: "append" };
    if (now.state === "create") {
        if (sentinels !== undefined || carrierWant(rel) !== null)
            return { act: "create" };
        return { act: "none", why: "the kit's current text for it could not be read", link: false };
    }
    if (now.state === "blocked") {
        // The reason install's write arm acts on: linkOwnership's for install's own --symlink link, else readForWrite's
        // refusal in blockedAt's wording, the words install's verify prints for the same path.
        const link = linkOwnership(ledger, rel);
        return { act: "none", why: link.own ? link.reason : blockedAt(now, join(TARGET, ...rel.split("/"))), link: r.link };
    }
    return { act: "none", why: r.why, link: r.link };
}
// blockedWriteText (phase 34.1, D-16): what install's verify says when installWouldWrite answers none on a blocked
// path: that answer's reason and, for install's own --symlink link, linkOwnership's remedy, so install's verify and the
// doctor's carrier line give one reason and one remedy for the same link.
function blockedWriteText(ledger, rel, why) {
    const link = linkOwnership(ledger, rel);
    return link.own ? `${why}, and install never writes through a link. ${link.remedy}` : why;
}
// routeCarrierSet (plan 34-29, D-26 point 4; the host set, phase 34.1 D-07): every file through which one of `hosts`
// can reach the kit route: the union of routeCarriers(host) (host-tools.ts, the one derivation) over the HOST_TOOLS
// rows in `hosts`, in first-seen registry order whatever order `hosts` is in. Derived, so a seventh host or a new
// pointer is asked about with no edit here. The doctor passes its installed set (doctorHosts) and install's route-note
// pass the agents installed after its run (hostsOf(AGENTS_AFTER)), so a carrier no installed agent reads is never
// classified, counted or noted.
function routeCarrierSet(hosts) {
    return [...new Set(HOST_TOOLS.filter((h) => hosts.includes(h)).flatMap((h) => [...routeCarriers(h)]))];
}
// hostsOf (phase 34.1, D-07; AUTH-1): THE ONE MAP from a list of agent ids to the registry rows they name, in registry
// order; an id the registry does not know names no row. The doctor's installed set (doctorHosts) and install's
// route-note pass (noteStrandingCarriers over AGENTS_AFTER) both map through it, so the two ask strandedBy and
// routeCarrierSet over the same kind of set. A function declaration: the doctor runs it above the `--check` early exit.
function hostsOf(ids) {
    return HOST_TOOLS.filter((h) => ids.includes(h.id));
}
// doctorHosts (phase 34.1, D-07; VERDICT-1): THE AGENTS `--check` REPORTS ON. It never re-derives the recorded set:
// it asks install-marker.ts installedAgents over the doctor's own marker and ledger reads. Recorded or legacy: those
// ids, mapped through hostsOf (a recorded id the registry does not know is kept in `unknown`, for a note, and gets no
// reach line). None (no usable marker, or a marker written before the `agents` field with no usable ledger): the
// agents detected in the target (detectedHosts, the rule install's unattended selection falls back to), and the
// doctor says so in a note.
// NOTHING INSTALLED HERE (phase 34.1 D-26, IN-21). The `agents` field records the agents CHOSEN for this target and not
// yet removed (install-marker.ts, THE `agents` FIELD), so it can name an agent none of whose writes landed (D-04's
// retry). Of the recorded and legacy rows, the doctor speaks (`hosts`) for a row installedSplit (below, the one answer
// install's closing notes also ask) counts as installed: one that owns a holding ledger entry (agentsToRecord with
// keep [], the one ownership derivation, over the ledger read when it is ok) OR whose entry path
// (ROUTE_POINTERS of its adapter kind) holds something: kindAt, an lstat only, no content read (DC-3). The entry-path
// clause keeps the reach line and its WARN for an agent whose entry is the user's own file: that file can strand the
// agent, and the warning is what tells the user so. The other rows go to `nothingInstalled`: the doctor gives each one
// note with the command that writes its entry, and no reach line. This is NOT a presence-based installed set: it only
// decides whether the doctor speaks for a recorded agent; nothing is recorded, removed or chosen on it.
// Reads nothing but `detect` paths and the entry paths' lstat; writes nothing. A function declaration: the doctor runs
// it above the `--check` early exit, where module consts declared below are in their temporal dead zone.
function doctorHosts(markerRead, ledgerRead) {
    const installed = installedAgents(markerRead, ledgerRead);
    if (installed.source === "none")
        return { hosts: detectedHosts(), source: "detected", unknown: [], nothingInstalled: [] };
    // A malformed ledger (phase 34.1 gap round 2, D-31, IN-24): the doctor cannot tell what install wrote, and it already
    // FAILs on the ledger, so installedSplit is asked with null and no row goes to `nothingInstalled`: every recorded
    // agent keeps its reach line, and the Claude Code checks run when Claude Code is recorded. Any other state that is
    // not ok (no ledger) reads as an empty ledger, so only an entry path present counts.
    const split = installedSplit(hostsOf(installed.ids), ledgerRead.state === "ok" ? ledgerRead.entries : ledgerRead.state === "malformed" ? null : []);
    return {
        hosts: split.installed,
        source: installed.source,
        unknown: installed.source === "recorded" ? installed.unknown : [],
        nothingInstalled: split.nothingInstalled,
    };
}
// installedSplit (phase 34.1 gap round 2, D-31, brief REC-1, review IN-23): THE ONE ANSWER to "is anything installed
// for this agent here", asked by the doctor (doctorHosts) and by install's closing notes (agentClosingLines). A row is
// installed when it owns a holding ledger entry (install-marker.ts agentsToRecord with keep [], the one ownership
// derivation, over `entries`), or when an entry path of its adapter kind (ROUTE_POINTERS) holds something: kindAt, an
// lstat only, never a content read (DC-3). The entry-path clause keeps a user's own file at the entry path on the
// installed side, where the doctor's reach line and its WARN tell the user it can strand the agent. `entries` null
// means the ledger could not be read: the reader cannot tell what install wrote, so every row counts as installed and
// none is called "nothing installed". It decides only what is said about an agent, never what is written, recorded or
// removed. A function declaration: the doctor runs it above the `--check` early exit.
function installedSplit(rows, entries) {
    if (entries === null)
        return { installed: [...rows], nothingInstalled: [] };
    const withEntry = agentsToRecord({ known: rows.map((h) => h.id), keep: [], unknown: [], entries });
    const has = (h) => withEntry.includes(h.id) || ROUTE_POINTERS[h.adapter].some((rel) => kindAt(join(TARGET, ...rel.split("/"))) !== null);
    return { installed: rows.filter(has), nothingInstalled: rows.filter((h) => !has(h)) };
}
const CARRIER_STATE_TEXT = {
    route: "carries the kit route",
    "own-stale": "is install's own copy from an earlier install, without the kit route",
    appendable: "has no install block and no kit route; install appends its block, which carries the route",
    user: "has no kit route, and install will not write the route into it",
    absent: "is not present",
    unread: "could not be read, so no verdict was reached on it",
};
// classifyCarrier (plan 34-29's carrierFinding, split by plan 34-33 so the doctor reads every file before it prints;
// plan 34-34 makes it ask refreshable; phase 34.1 D-15 makes it ask installWouldWrite): read one route carrier through
// the run's `readAt` (readUserFile under TARGET; DC-3: a FIFO, a directory, a device or an oversized file is never
// read, it is `unread`) and classify it. It prints nothing and writes nothing. The whole file is what a host reads, so
// the route test is carriesKitRoute over the whole text:
//   carries KIT_ROUTE                                                    → route
//   present without it, and installWouldWrite (over the doctor's ledger
//   read) answers refresh. INSTALL AND THE DOCTOR ASK THE SAME OWNER
//   (ensureBlock, writeWholeFileEntry and refreshOwnFile write only on its
//   answer), so the remedy "Re-run install.js" is one the next install
//   carries out (WR-01, WR-13)                                            → own-stale
//   present without it, and installWouldWrite answers append (a block
//   carrier without install's block: the re-install appends it)          → appendable
//   present without it, and installWouldWrite answers none               → user (why = its reason)
//   absent                                                               → absent
//   not a readable regular file                                          → unread
// A `create` answer for a path this read found present means the path changed between the two reads; the carrier is
// then `user`, with that reason, and no re-run is named.
function classifyCarrier(rel, ledger, readAt) {
    const read = readAt(rel);
    if (read.state === "absent")
        return { state: "absent", read, why: null };
    if (read.state !== "ok")
        return { state: "unread", read, why: null };
    if (carriesKitRoute(read.text))
        return { state: "route", read, why: null };
    const w = installWouldWrite(ledger, rel);
    if (w.act === "refresh")
        return { state: "own-stale", read, why: null };
    if (w.act === "append")
        return { state: "appendable", read, why: null };
    if (w.act === "none")
        return { state: "user", read, why: w.why };
    return { state: "user", read, why: `nothing was there when --check asked again, so run install.js --check again: \`${doctorCheckCommand()}\`` };
}
/** What a read found, as the doctor words it: `is not present`, or unreadState's text, or `is a readable file`. */
function readStateText(r) {
    return r.state === "ok" ? "is a readable file" : r.state === "absent" ? "is not present" : unreadState(r);
}
// adapterKitOnDisk (plan 34-33): the Claude Code adapters' KIT= line as the target holds it now, and the adapter it
// was read from. The adapter is DERIVED (KIT-02), never named: the first derived target adapter that carries a
// materialized KIT= line; if none does, the first derived destination, so a FAIL message still names a concrete
// path. `?? []` is the doctor's fail-closed posture: an unreadable source adapter directory leaves no candidate,
// the fallback still names a path, and the KIT= read is "". Shared by the doctor's D-03 cross-check and install's
// route-note pass (noteStrandingCarriers), so both read the adapter route the same way. A function declaration:
// the doctor runs it above the `--check` early exit.
function adapterKitOnDisk() {
    const candidates = targetAdapterFiles() ?? [];
    const file = candidates.find((p) => readAdapterKit(p) !== "") ?? candidates[0] ?? join(TARGET, ".claude", "agents");
    return { file, kit: readAdapterKit(file) };
}
// kitRouteFindings (D-26, G-34-2; per host, plan 34-29; one derivation of the stranded hosts, plan 34-33): the doctor
// follows the kit route the way an agent obeying KIT_ROUTE does, asks every route carrier whether it names the route,
// and then says, for every registry host, whether that host reaches the Orchestrator. Before plan 34-27, --check
// asked only about the Claude Code adapters' KIT= agreement and printed ALL CHECKS PASSED while Pi's /grugops named
// a path that a scripted install never creates (34-UAT.md test 2); before plan 34-29 it asked only about the Pi
// template.
//
// THE COUNTING RULE (plan 34-33, D-27 point 2; classes VERDICT-1 and AUTH-1): a kit-route finding is counted
// exactly when some host cannot reach. A carrier without the route is counted only when it leaves a host without a
// route (strandedBy, host-tools.ts, the one derivation install's route notes ask too); a carrier that leaves no host
// without one is an uncounted `note`. Before plan 34-33 the WARN for a user's carrier, the absent-carrier arm and
// install's note each derived the hosts their own way, and `--check --strict` failed a target where every host
// reached (WR-03) while saying a host had no route beside a `reach` line saying it did (WR-02).
//
// It READS EVERYTHING FIRST AND PRINTS AFTERWARDS:
// (a) THE ROUTE. The marker's `kitRoot`, joined with roles/orchestrator.md, read through readUserFile: a link is
//     followed, as a host would follow it; a FIFO, a device or an oversized file is never read. A readable regular
//     file is `ok`; anything else is one FAIL naming the path and its state: an agent that follows the route does
//     not reach the Orchestrator. This is asked independently of the kit-root cross-check above: that check
//     compares three records with each other, this one follows the record an agent reads.
// (b) EACH CARRIER of routeCarrierSet, through classifyCarrier, over one cached read per path for the run.
// (c) THE FACTS strandedBy and reachVia take: reads is hostReadsCarrier's answer (the one owner: a host reads every
//     route carrier of its registry row; phase 34.1 D-12 deleted the one entry gate), asked once per host and
//     carrier; holds is the `route` state; adapterReaches is a `claude-kit` host whose adapter KIT= value (`adapterKit`, the one the
//     D-03 cross-check read) names a real kit (kitReal), whatever that cross-check concluded about the other two
//     sources (inside a Claude Code session the adapter resolves the kit, Phase 7 D-12).
// (d) ONE LINE PER CARRIER: `route` → ok. Otherwise, when strandedBy names hosts, the counted line (FAIL for
//     install's own stale copy, whose remedy is `Re-run install.js`; WARN for a block carrier install appends its
//     block to, for a carrier install will not write the route into, and for an absent or an unread one), naming the
//     stranded hosts in registry order; when it names none, an uncounted `note` naming each host that reads the
//     carrier here and how that host has the route. THE REMEDY (plan 34-34, D-27 point 3, WR-01; phase 34.1 D-15,
//     WR-13): `Re-run install.js` is named exactly when installWouldWrite, the one owner install asks, answers that an
//     install run on this state writes the carrier (refresh, append, or create for an absent one); otherwise the line
//     carries its reason and, for install's own --symlink link, linkOwnership's remedy (remove the link and re-run
//     install.js, D-16), else the by-hand remedy (add KIT_ROUTE, after the start-here sentence if the file has one,
//     D-17). The note for an absent or unread carrier speaks of the hosts that would read it (IN-16).
// (e) ONE `reach` LINE PER INSTALLED HOST (`hosts`, below), in registry order, under the uncounted label `reach`: the host reaches
//     when the route resolved (a) and reachVia names a carrier, or when its adapter reaches; the line names the
//     carriers and the adapter that gave the route, or, when the host cannot reach, each carrier's state and the
//     route's. So a host that cannot reach always has a counted finding behind it: the route FAIL of (a), or the
//     carrier lines of (d) (every carrier it reads lacks the route and nothing else gives it one); and a counted
//     kit-route finding always has a host that cannot reach behind it.
//     The reach loop walks routeCarrierSet and keeps the carriers hostReadsCarrier names for the host; for every
//     host that order is its routeCarriers order (install/host-tools.test.ts asserts it).
// THE AGENTS IT SPEAKS FOR (phase 34.1, D-07; VERDICT-1; D-26, IN-21): `hosts` is the doctor's doctorHosts answer, the
// agents recorded in this target as chosen (or by the legacy rule; the detected agents, announced in a note, when
// nothing is recorded) that have something installed here: a holding ledger entry they own, or a file at their entry
// path. Every step above asks about those agents only: (b) classifies routeCarrierSet(hosts), (c) builds the facts for
// them, (d) passes them to strandedBy and names only them as readers, and (e) prints one reach line per one of them, in
// registry order. A carrier none of them reads is not reported, and an agent nobody chose here, or a recorded agent
// with nothing installed here (its own note, with the command that writes its entry), gets no reach line and no
// counted finding.
// It writes nothing. Ownership comes from owns over the ledger the doctor reads, and what install would write from
// installWouldWrite over it, so install, uninstall and --check cannot disagree about whose file a carrier is or what
// install writes into it. Function declarations only, and the doctor's own
// ledger read: module consts declared below the `--check` early exit are in their temporal dead zone here.
function kitRouteFindings(marker, ledger, markerFile, adapterKit, hosts) {
    // (a) Truthiness, as the kit-root cross-check reads the same field: a recorded path is never compared raw
    // here (WIN-1, path-spelling census); it is only joined and read.
    const kitRoot = typeof marker.kitRoot === "string" ? marker.kitRoot : "";
    let routeResolves = false;
    if (!kitRoot) {
        docFail(`kit route: ${markerFile} records no \`kitRoot\`, so a host with no Claude Code adapter that follows the ` +
            `kit route cannot reach the Orchestrator. Re-run install.js \`${doctorInstallCommand()}\` (then \`${doctorCheckCommand()}\`)`);
    }
    else {
        const orchestrator = join(kitRoot, "roles", "orchestrator.md");
        const read = readUserFile(orchestrator);
        if (read.state === "ok") {
            routeResolves = true;
            docReport("ok", `kit route: the \`kitRoot\` field of .grugops/install.json leads to ${orchestrator}, a readable file — a ` +
                `host with no Claude Code adapter that follows the route reaches the Orchestrator`);
        }
        else {
            docFail(`kit route: the \`kitRoot\` field of ${markerFile} leads to ${orchestrator}, which ` +
                `${read.state === "absent" ? "is not present" : unreadState(read)} — a host with no Claude Code adapter that ` +
                `follows the route cannot reach the Orchestrator. Re-run install.js \`${doctorInstallCommand()}\` (then \`${doctorCheckCommand()}\`)`);
        }
    }
    // (b) One read per path for the whole run (plan 34-32): every carrier line and reach line of this run
    // states what the same read found.
    const cache = new Map();
    const readAt = (rel) => {
        let r = cache.get(rel);
        if (r === undefined) {
            r = readUserFile(join(TARGET, ...rel.split("/")));
            cache.set(rel, r);
        }
        return r;
    };
    const rels = routeCarrierSet(hosts);
    const classes = new Map();
    for (const rel of rels)
        classes.set(rel, classifyCarrier(rel, ledger, readAt));
    // (c) hostReadsCarrier, asked once per installed host and carrier.
    const answers = new Map();
    for (const host of hosts) {
        const mine = new Map();
        for (const rel of rels)
            mine.set(rel, hostReadsCarrier(host, rel));
        answers.set(host.id, mine);
    }
    const adapterReal = kitReal(adapterKit);
    const facts = {
        reads: (h, rel) => answers.get(h.id)?.get(rel) === true,
        holds: (rel) => classes.get(rel)?.state === "route",
        adapterReaches: (h) => h.adapter === "claude-kit" && adapterReal,
    };
    const adapterText = `its adapters' KIT= line (${adapterKit})`;
    /** How `h` has the route here: the carriers reachVia names and its adapter, or null when nothing gives it one. */
    const hasRouteThrough = (h) => {
        const v = reachVia(h, facts);
        const through = [...v.carriers, ...(v.adapter ? [adapterText] : [])];
        return through.length > 0 ? through.join(", ") : null;
    };
    // The absent arm's remedy (plan 34-34, D-27 point 3; phase 34.1 D-15): from installWouldWrite, the one owner install
    // asks. `create` (readForWrite answers create: no link, non-directory or unreadable component on the way; and, for a
    // whole file, the kit's current text for it can be read) → `Re-run install.js`; none → the reason install will not
    // write it. A refresh or append answer for a path this read found absent means it changed between the two reads.
    const absentRemedy = (rel) => {
        const w = installWouldWrite(ledger, rel);
        if (w.act === "create")
            return `Re-run install.js, which writes it where nothing is: \`${doctorInstallCommand()}\``;
        if (w.act === "none")
            return `Install will not write it: ${w.why}`;
        return `${join(TARGET, ...rel.split("/"))} is there now, so run install.js --check again: \`${doctorCheckCommand()}\``;
    };
    // The `user` remedy (phase 34.1, D-16, D-17): for install's own --symlink link, linkOwnership's remedy (remove the
    // link and re-run install.js), never an edit of the file the link points to (WR-16); otherwise the sentence to add
    // by hand, after the start-here sentence only when the file has one (IN-17).
    const userRemedy = (rel) => {
        const link = linkOwnership(ledger, rel);
        return link.own ? link.remedy : `Add this sentence (after the start-here sentence, if the file has one): ${KIT_ROUTE}`;
    };
    // (d) One line per carrier.
    for (const rel of rels) {
        const cls = classes.get(rel);
        const readers = hosts.filter((h) => facts.reads(h, rel));
        const readBy = readers.length > 0 ? readers.map((h) => h.name).join(", ") : "no registry host here";
        if (cls.state === "route") {
            docReport("ok", `kit route carried by ${rel} (read by ${readBy})`);
            continue;
        }
        const remedy = cls.state === "own-stale"
            ? `Re-run install.js: it replaces install's own unedited copy with the current one: \`${doctorInstallCommand()}\``
            : cls.state === "appendable"
                ? `Re-run install.js: it appends install's start-here block, which carries the route: \`${doctorInstallCommand()}\``
                : cls.state === "user"
                    ? userRemedy(rel)
                    : cls.state === "absent"
                        ? absentRemedy(rel)
                        : `It was not read, so NO VERDICT was reached on whether it carries the kit route`;
        const stranded = strandedBy(rel, facts, hosts);
        if (stranded.length === 0) {
            const how = readers.map((h) => `${h.name} through ${hasRouteThrough(h) ?? "nothing"}`);
            const what = cls.state === "unread" ? readStateText(cls.read) : CARRIER_STATE_TEXT[cls.state];
            docReport("note", `kit route: ${rel} ${what}${cls.why === null ? "" : ` (${cls.why})`}; no host is left without a route by it` +
                `${how.length > 0 ? `: the hosts that ${cls.state === "absent" || cls.state === "unread" ? "would read it" : "read it here"} have the route another way (${how.join("; ")})` : ""}. ${remedy}`);
            continue;
        }
        const leaves = `(it leaves ${stranded.map((h) => h.name).join(", ")} without a route to the Orchestrator)`;
        if (cls.state === "absent") {
            docWarn(`kit route: ${rel} ${leaves} is not present, so it gives those hosts no grugops pointer here. ${remedy}`);
        }
        else if (cls.state === "unread") {
            docWarn(`kit route: ${rel} ${leaves} ${readStateText(cls.read)} — it was not read, so NO VERDICT was reached on whether it carries the kit route`);
        }
        else if (cls.state === "own-stale") {
            docFail(`kit route missing from ${rel} ${leaves}: install wrote it in an earlier install and it still holds what ` +
                `install wrote, so it names no route to the kit, which a scripted install puts outside this repository. ${remedy}`);
        }
        else if (cls.state === "appendable") {
            docWarn(`kit route missing from ${rel} ${leaves}: it holds no install block, and a re-install appends install's block, which carries the route. ${remedy}`);
        }
        else {
            docWarn(`kit route missing from ${rel} ${leaves}: install will not write the route into it (${cls.why}), so --check ` +
                `reports it and install leaves it as it is. ${remedy}`);
        }
    }
    // (e): the reach line, per installed host.
    for (const host of hosts) {
        const read = rels.filter((rel) => facts.reads(host, rel));
        const v = reachVia(host, facts);
        const via = routeResolves ? v.carriers : [];
        if (via.length > 0 || v.adapter) {
            docReport("reach", `${host.name}: reaches the Orchestrator through ${[...via, ...(v.adapter ? [adapterText] : [])].join(", ")}`);
            continue;
        }
        const why = read.map((rel) => `${rel} ${CARRIER_STATE_TEXT[classes.get(rel)?.state ?? "unread"]}`);
        if (!routeResolves)
            why.push("the kit route does not lead to a readable roles/orchestrator.md");
        if (host.adapter === "claude-kit")
            why.push("its adapters' KIT= line names no kit");
        if (why.length === 0)
            why.push("no file it reads here carries the kit route");
        docReport("reach", `${host.name}: CANNOT reach the Orchestrator: ${why.join("; ")}`);
    }
}
// doctor: the INSTALL-05 verifier. Read-only by construction. Returns 0 on pass / WARN-only,
// nonzero on any FAIL (or WARN + --strict).
function doctor() {
    DOC_FAILS = 0;
    DOC_WARNS = 0;
    console.log("== grugops doctor (--check) ==");
    console.log(`home:   ${DOCTOR_KIT_HOME}`);
    console.log(`kit:    ${DOCTOR_KIT_ROOT}`);
    // This run's own kit home, named once when it is not the one checked (plan 34.1-50, D-38, review WR-24): the only
    // place the doctor reads it. Everything below reads DOCTOR_KIT_HOME / DOCTOR_KIT_ROOT.
    if (canonicalPathSpelling(DOCTOR_KIT_HOME) !== canonicalPathSpelling(GRUGOPS_HOME)) {
        console.log(`given:  ${GRUGOPS_HOME} (this run's kit home, not used: --check reads the kit home install recorded for this repository)`);
    }
    console.log(`target: ${TARGET}`);
    console.log("");
    const markerFile = join(TARGET, ".grugops", "install.json");
    // --- not-installed fold-into-FAIL (RESEARCH Discretion §5) --------------------------------
    // Absent marker = a dev/uninstalled checkout; a marker that is there but unreadable is named as
    // such (red-team of plan 33.1-27), never as "not installed". Both fail closed BEFORE touching
    // adapters: print a distinct greppable line and return nonzero. Never crash, never
    // false-green (ties to C3 — the dev checkout has agent-factory/ but no marker).
    // The one marker read under --check (DOCTOR_MARKER_READ, D-36): the marker COMMAND_CONTEXT's kit home and install
    // mode were taken from is the marker checked here. It is null only outside --check, where the doctor never runs; a
    // null here fails closed rather than reading the marker a second time.
    if (DOCTOR_MARKER_READ === null) {
        docFail(`the doctor ran without its marker read (${markerFile}); this is an installer defect, nothing was checked`);
        return 1;
    }
    const markerRead = DOCTOR_MARKER_READ;
    if (markerRead.state === "unreadable") {
        markerUnreadable(markerFile, markerRead);
        return 1;
    }
    if (markerRead.state === "absent") {
        notInstalled();
        return 1;
    }
    // A MARKER FOR ANOTHER DIRECTORY (red-team B2 of plan 33.1-33, brief DC-2): install's marker shape, but
    // not bound to this directory (copied, moved, or written before markers carried `target`). Uninstall
    // uses none of its records here, so that is a WARN with the remedy; the kit checks below still read
    // its kit fields, which say which kit laid this target out.
    if (markerRead.state === "unbound") {
        docWarn(markerRead.unboundBy === "other-directory"
            ? `the install marker ${markerFile} is not this directory's record: ${markerRead.why}. Uninstall uses none of ` +
                `its records here and changes nothing. If this is the same repository moved or renamed, set "target" in ` +
                `the marker to ${JSON.stringify(markerRead.here ?? TARGET)}; otherwise re-run install.js here, \`${doctorInstallCommand()}\` ` +
                `(${DOCTOR_NO_FLAG_CLAUSE}), which copies the kit into ${COMMAND_CONTEXT.kitHome}, ` +
                `writes a marker for this directory and carries none of these records`
            : `the install marker ${markerFile} is not a record uninstall can use: ${markerRead.why}. Uninstall uses none of ` +
                `its records here and changes nothing. Re-run install.js here, \`${doctorInstallCommand()}\` (${DOCTOR_NO_FLAG_CLAUSE}), then ` +
                `uninstall: install copies the kit into ${COMMAND_CONTEXT.kitHome}, writes a ` +
                `marker with the install ledger for this directory and carries none of these records. \`${agentCommand("uninstall.js", TARGET, [], COMMAND_CONTEXT)}\` ` +
                `with no agent flag removes every agent and the shared files; with agent flags (for example ` +
                `\`${agentCommand("uninstall.js", TARGET, [HOST_TOOLS[0]], COMMAND_CONTEXT)}\`) it removes only those agents`);
    }
    // A MALFORMED LEDGER IS A FAIL (red-team B1 of plan 33.1-34, brief DC-1). The doctor used to read the
    // marker through readInstallMarker and never ask whether its records could be read, so a marker holding
    // a record uninstall uses none of (install and uninstall both report a verify, exit 3, and uninstall
    // keeps the marker) printed ALL CHECKS PASSED at exit 0. It asks the one reader those two ask
    // (readLedger) and says why the install ledger is malformed in one FAIL line. The other checks still
    // run: the kit fields are not the ledger.
    // The doctor's one ledger read: the malformed FAIL below, the installed set (doctorHosts) and the kit route's
    // ownership answers all come from it.
    // D-37 (34.1 review CR-06, plan 34.1-43): install's own marker with a malformed install ledger is the record of every
    // agent installed here, so the FAIL's remedy is the owner's never-remove wording (install-marker.ts markerFixText of
    // markerRemedy's answer, whose fix names the ledger problem and the by-hand fix), then the check command. It never
    // offers removing the marker.
    const ledgerRead = readLedger(markerRead.state === "ok" ? markerRead.marker : null);
    if (markerRead.state === "ok") {
        if (ledgerRead.state === "malformed") {
            const remedy = markerRemedy(markerRead) ?? noMarkerRemedy("doctor");
            docFail(`the install marker ${markerFile} holds a malformed install ledger (${ledgerRead.why}) — install writes it ` +
                `back as found, uninstall uses none of it and keeps the marker, and both report a verify finding (exit 3). ` +
                `${markerFixText(remedy)}; then run \`${doctorCheckCommand()}\``);
        }
    }
    const marker = (markerRead.state === "ok" ? markerRead.marker : markerRead.object);
    // --- the agents this run reports on (phase 34.1, D-07; VERDICT-1) ---------------------------
    // doctorHosts asks installedAgents over the reads above and never re-derives the set. Every reach line, carrier line
    // and counted kit-route finding below is about these agents only. When nothing is recorded the detected agents stand
    // in, and the run says so; a recorded id this build does not know is named and gets no reach line.
    const installed = doctorHosts(markerRead, ledgerRead);
    const hosts = installed.hosts;
    if (installed.source === "detected") {
        docReport("note", `no installed set is recorded in .grugops/install.json, so --check reports the agents detected here ` +
            `(${hosts.length > 0 ? hosts.map((h) => `${h.name}: ${h.detect}`).join(", ") : "none"})`);
    }
    if (installed.unknown.length > 0) {
        docReport("note", `.grugops/install.json records ${installed.unknown.map((id) => JSON.stringify(id)).join(", ")}, which this build ` +
            `does not know as an agent, so --check gives ${installed.unknown.length > 1 ? "them" : "it"} no reach line`);
    }
    // A recorded agent with nothing installed here (doctorHosts' nothingInstalled; D-26, IN-21): one uncounted note each,
    // with the command that writes its entry, and no reach line. The note says where the agent set came from, and only
    // what was read (phase 34.1 gap round 2, D-31, IN-24): a `recorded` agent is in the marker's `agents` list as chosen;
    // a `legacy` one is counted from a marker with no `agents` list (LEGACY_ADAPTER_KINDS), so nothing records it as
    // chosen. doctorHosts puts no agent here when the ledger is malformed, so "records nothing" is always a read.
    for (const h of installed.nothingInstalled) {
        const entries = ROUTE_POINTERS[h.adapter];
        const from = installed.source === "legacy"
            ? `${h.name} is counted as installed by an install made before this release (its marker has no \`agents\` list)`
            : `${h.name} is recorded in .grugops/install.json as chosen`;
        docReport("note", `${from}, but nothing is installed for it here (the install ` +
            `ledger records nothing of install's for it, and ${entries.join(", ")} ${entries.length > 1 ? "are" : "is"} not ` +
            `present), so --check gives it no reach line; \`${agentCommand("install.js", TARGET, [h], COMMAND_CONTEXT)}\` writes its entry, ` +
            `or says why it cannot`);
    }
    // THE CLAUDE CODE CHECKS (phase 34.1, D-07; VERDICT-1) run only when Claude Code is installed here: the adapters'
    // KIT= source of the kit-root cross-check, the adapter-referenced stat lines, the adapter staleness block and the
    // ask-rule remedy. A target without Claude Code has no adapters to read, so nothing is said about them.
    const claudeInstalled = hosts.some((h) => h.adapter === "claude-kit");
    // The adapter the D-03 cross-check reads source (c) from is DERIVED (KIT-02), never named. Take
    // the first derived target adapter that actually carries a materialized KIT= line; if none does,
    // fall back to the first derived destination so the FAIL message still names a concrete path.
    // Fail-closed is preserved: an absent file or a missing KIT line still reads as "" below.
    // `?? []` here is the doctor's EXISTING fail-closed posture made explicit, not a swallowed null:
    // an unreadable source adapter directory leaves no candidate, the fallback below still names a
    // concrete path, and the KIT= cross-check still reads as "" → FAIL. The doctor is a read-only
    // reporter with its own FAIL surface, so it does not also emit the install path's verify finding.
    // Plan 34-33: the read is adapterKitOnDisk's, shared with install's route-note pass. Not read at all
    // when Claude Code is not installed (D-07).
    const adapterOnDisk = claudeInstalled ? adapterKitOnDisk() : null;
    const adapterFile = adapterOnDisk !== null ? adapterOnDisk.file : null;
    // A recorded agent with nothing installed here has its own note above and no counted finding (D-26, IN-21).
    if (hosts.length === 0 && installed.nothingInstalled.length === 0) {
        docWarn(`no agent is ${installed.source === "detected" ? "recorded or detected" : "recorded as installed that this build knows"} ` +
            `in ${TARGET}, so NO VERDICT was reached on any agent's route to the Orchestrator. Re-run install.js with the ` +
            `flag of each agent to install for: \`${doctorInstallCommand()}\` followed by the flag of each agent, for example ` +
            `\`${agentCommand("install.js", TARGET, [HOST_TOOLS[0]], COMMAND_CONTEXT)}\``);
    }
    // --- D-03 three-source kit-root cross-check ------------------------------------------------
    // (a) the freshly re-resolved rule, (b) the marker kitRoot, (c) the adapter KIT=. Normalize all
    // three via docAbspath (mirrors the sh abspath); all-equal → pass; differ-but-all-real-and-
    // cosmetic → WARN; any unresolvable or genuinely different real kits → FAIL (name all three).
    // Bias to FAIL when unsure.
    // Source (a) is DOCTOR_KIT_ROOT (plan 34.1-50, D-38, review WR-24): the kit root of the kit home the printed commands
    // state, which an `ok` marker records, else this run's. It used to be this run's KIT_ROOT, so a plain `--check` on an
    // install with another kit home FAILed below although the install was neither stale nor moved. The DISAGREE FAILs now
    // fire when the marker's kitRoot, or the adapter's KIT= line, disagrees with the recorded kit home (or, with no usable
    // marker, with this run's).
    // Without Claude Code (D-07) there is no adapter source: the rule and the marker are compared with the same three
    // outcomes, and the ok line says no adapter KIT= line was read because no Claude Code adapter is installed here.
    const a = DOCTOR_KIT_ROOT;
    const b = marker.kitRoot ? String(marker.kitRoot) : "";
    const na = docAbspath(a);
    const nb = b ? docAbspath(b) : "";
    if (adapterOnDisk !== null) {
        const c = adapterOnDisk.kit;
        const nc = c ? docAbspath(c) : "";
        if (na === nb && nb === nc) {
            docReport("ok", `kit-root sources agree (${na})`);
        }
        else if (kitReal(na) && kitReal(nb) && kitReal(nc)) {
            docWarn(`kit-root sources differ cosmetically: rule=${na} marker=${nb} adapter=${nc}`);
        }
        else {
            docFail(`kit-root sources DISAGREE (stale/moved install): rule=${na} marker=${nb || "<unset>"} adapter=${nc || "<unset>"}  (referenced by ${markerFile} + ${adapterOnDisk.file})`);
        }
    }
    else if (na === nb) {
        docReport("ok", `kit-root sources agree (rule and marker: ${na}); no Claude Code adapter is installed here, so no adapter KIT= line was read`);
    }
    else if (kitReal(na) && kitReal(nb)) {
        docWarn(`kit-root sources differ cosmetically: rule=${na} marker=${nb} (no Claude Code adapter is installed here)`);
    }
    else {
        docFail(`kit-root sources DISAGREE (stale/moved install): rule=${na} marker=${nb || "<unset>"}  (referenced by ${markerFile})`);
    }
    // The file each stat line below names as its reference: the adapter the cross-check read, or the marker when no
    // Claude Code adapter is installed here (D-07).
    const statRef = adapterFile ?? markerFile;
    // --- deterministic ordered first-failure stat set (D-02 / D-05) ----------------------------
    // Fixed order, most-load-bearing first. Kit refs resolve under DOCTOR_KIT_ROOT (the kit home the printed commands
    // state; plan 34.1-50, D-38); state refs resolve
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
        [DOCTOR_KIT_ROOT, markerFile, "dir"],
        [join(DOCTOR_KIT_ROOT, "roles", "orchestrator.md"), statRef, "file"],
        [join(DOCTOR_KIT_ROOT, "roles", "_role-switch-protocol.md"), statRef, "file"],
        [join(DOCTOR_KIT_ROOT, "workflows"), statRef, "dir"],
        [join(TARGET, ".grugops", "factory.config.json"), statRef, "file"],
        [join(TARGET, "plans", "board.md"), statRef, "file"],
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
    // --- the kit route (D-26, G-34-2): follow it as an agent does, then ask each route carrier ------
    // Not gated on the stat set: it asks a different question (does the record an agent reads lead to the
    // Orchestrator, and do the pointers name it), so a FAIL above does not answer it. The ledger is the one
    // the doctor reads above; an unbound or malformed marker gives no ownership, so a carrier without the
    // route is then a WARN, never a FAIL claimed from a record uninstall would not use.
    kitRouteFindings(marker, ledgerRead, markerFile, adapterOnDisk !== null && adapterOnDisk.kit ? docAbspath(adapterOnDisk.kit) : "", hosts);
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
        //
        // A MARKER WITH NO USABLE kitVersion IS NO VERDICT, NEVER A PASS (red-team B2 of plan 33.1-32, brief
        // DC-1). Install writes no kitVersion when a run wrote no kit file and had no earlier version to
        // keep, and an empty one when the kit VERSION could not be read; a hand-edited marker can hold
        // anything. In each case the version of the kit files in the target is not known, which is a WARN.
        const mver = typeof marker.kitVersion === "string" ? marker.kitVersion : "";
        if (mver.trim() === "") {
            docWarn(`kit-version unknown: the install marker ${markerFile} records no kit version ` +
                `(${marker.kitVersion === undefined ? "the field is absent" : `it holds ${JSON.stringify(marker.kitVersion).slice(0, 60)}`}), so the ` +
                `version of ${claudeInstalled ? `the grugops kit files in ${join(TARGET, ".claude")}` : `the grugops kit this target uses (${nb || "<unset>"})`} is not known and NO VERDICT on kit-version skew was ` +
                `reached. A re-install that writes the kit records it`);
        }
        const verFile = join(DOCTOR_KIT_ROOT, "VERSION");
        const kitVer = readKitVersion(verFile);
        const kver = kitVer.version;
        if (kitVer.problem !== null) {
            docWarn(`kit-version skew: the kit VERSION at ${verFile} ${kitVer.problem} — it was not read, so NO VERDICT on ` +
                `kit-version skew was reached`);
        }
        if (mver.trim() !== "" && kver !== "" && mver !== kver) {
            docWarn(`kit-version skew: marker=${mver} kit VERSION=${kver}`);
        }
        // missing optional seed: a seed file the user may have pruned (e.g. memory-bank/00-index.md).
        const optionalSeed = join(TARGET, "memory-bank", "00-index.md");
        const optionalRead = readUserFile(optionalSeed);
        if (optionalRead.state === "absent") {
            docWarn(`missing optional seed: ${optionalSeed} (run install.js to re-seed: \`${doctorInstallCommand()}\`)`);
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
        // Only when Claude Code is installed here (D-07): a target without it has no adapters to be stale.
        const docNames = claudeInstalled ? (srcAdapterFiles(GRUGOPS_SRC) ?? []) : [];
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
                    const expected = transformAdapter(renderedRead.text, DOCTOR_KIT_ROOT).text;
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
                    // ONE CHECKOUT (plan 34.1-37, D-36, review WR-23). The render compared above is of GRUGOPS_SRC, and the
                    // remedy renders from the same checkout: doctorInstallCommand's context states `GRUGOPS_SRC=<dir>`, this
                    // script's own checkout included (host-tools.ts scriptCommand, D-38). So both places name that one checkout,
                    // in the one spelling (canonicalPathSpelling).
                    const comparedCheckout = canonicalPathSpelling(GRUGOPS_SRC);
                    docWarn(`stale adapter(s) under ${join(TARGET, ".claude", "agents")} — ${parts.join("; ")}. ` +
                        `Each was byte-compared, whole file, against a fresh render of the kit checkout at ` +
                        `${comparedCheckout}, materialized exactly the way an install would materialize it — so ` +
                        `what differs here is what a re-run would change. That checkout is a DIFFERENT root ` +
                        `from the installed kit at ${DOCTOR_KIT_ROOT} the version line reports on, and the remedy is ` +
                        `\`${doctorInstallCommand()}\`, which renders from the checkout at ${comparedCheckout}, the one compared here`);
                }
            });
        }
    }
    // --- Claude Code ask rules (D-18): report each ledger rule present or absent; never repair ---
    // The rules are a speed bump, not a security boundary; the git host is the hard floor. A missing
    // rule is a WARN (someone removed it), not a FAIL, and the doctor writes nothing either way.
    // One marker read (D-40, DI-19, plan 34.1-53): this check reads the doctor's one marker read, DOCTOR_MARKER_READ,
    // through markerRead and the doctor's one ledger read, ledgerRead, so the ask rules are checked against the same
    // record as every other line the doctor prints. It never reads the marker again. An unreadable or absent marker never
    // reaches it: markerUnreadable and notInstalled return first, so the marker here is install's own (`ok`) or another
    // directory's (`unbound`). A malformed ledger is named, never read as "no ask rules" (WR-05).
    const askLedger = entryAt(ledgerRead, ASK_RULES_REL, "ask-rules") ?? null;
    if (markerRead.state === "unbound") {
        docReport("info", "the install marker is not a record uninstall can use here (see the WARN above), so its ask-rule entry was not used and the ask rules were not checked");
    }
    else if (ledgerRead.state === "malformed") {
        // Counted once, as the FAIL above (red-team B1 of plan 33.1-34); this line only says what was skipped.
        docReport("info", "the install ledger in .grugops/install.json is malformed (see the FAIL above) — the ask rules " +
            "were not checked, and neither the installer nor the uninstaller will change them until the field is fixed");
    }
    else if (!askLedger) {
        // The remedy is one install carries out only when Claude Code is chosen (plan 34.1-08: ask rules only for Claude
        // Code), so without it installed here the line says why no rules are expected instead (D-07).
        docReport("info", claudeInstalled
            ? `the install ledger records no ask rules for .claude/settings.json — re-run the installer to write them: \`${doctorInstallCommand()}\``
            : "the install ledger records no ask rules for .claude/settings.json, and none are expected: Claude Code is not installed here");
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
                    docWarn(`ask rule absent from .claude/settings.json: ${rule} (re-run the installer to restore it: \`${doctorInstallCommand()}\`)`);
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
// mutation — it prints a short banner and refreshes the kit home (kit-home-only, retain-backup,
// downgrade warn-then-proceed via updateKitHome()). The helper functions it calls (updateKitHome /
// copyKit) are hoisted declarations defined below.
// THE CLOSING (plan 34-26, D-25, the 27-13 class rule): the banner and the exit status are chosen on
// ONE branch from VERIFY_FINDINGS, as the --prune-old-kit branch below does. copyKit raises a verify
// for every way the kit was not copied, so a counted verify ends INCOMPLETE with status 3 and no
// --check hint (there is no refreshed kit to check against); only a run with none says complete.
// THE PRINTED COMMANDS (phase 34.1 gap round 2, D-31, D-33): the INCOMPLETE banner names the command that runs
// --update again, and the success hint its --check command, both from scriptCommand with COMMAND_CONTEXT (the absolute
// install.js, and this run's kit home, install mode and kit checkout stated as GRUGOPS_HOME, INSTALL_MODE and
// GRUGOPS_SRC, D-38), so each runs as printed from any directory against the kit home this run refreshed. --update takes no target and no agent flag (D-25), so neither command names one;
// the hint's `<repo>` is the placeholder for the repository to check. Printed under DRY_RUN too. ---
if (UPDATE) {
    console.log("== grugops update (--update) ==");
    console.log(`source: ${GRUGOPS_SRC}`);
    console.log(`home:   ${GRUGOPS_HOME}`);
    console.log(`kit:    ${KIT_ROOT}`);
    if (DRY_RUN)
        console.log("mode:   DRY_RUN (no filesystem changes)");
    console.log("\n-- kit refresh (kit-home-only; per-repo state untouched) --");
    updateKitHome();
    if (VERIFY_FINDINGS > 0) {
        console.log(`\n== update INCOMPLETE — ${VERIFY_FINDINGS} item(s) need verification ==`);
        console.log(`  Once each is fixed, \`${scriptCommand("install.js", COMMAND_CONTEXT)} --update\` refreshes the kit home again.`);
    }
    else {
        console.log(`\n  Run \`${scriptCommand("install.js", COMMAND_CONTEXT)} --check --target <repo>\` to verify a repo against the refreshed kit.`);
        console.log(`\n== update complete${DRY_RUN ? " (DRY_RUN — nothing changed)" : ""} ==`);
    }
    process.exit(VERIFY_FINDINGS > 0 ? 3 : 0);
}
// --- --prune-old-kit branch (D-10, Plan 17-03) — the SINGLE, opt-in deletion path. Wired EARLY
// (alongside --update, before the self-checkout guard) because it only deletes backups install
// recorded making, in the two known roots, and never mutates the live kit or any user content. It
// prints a banner, runs pruneOldKit() (by record, through owns, never by name: plan 33.1-40, review
// CR-02; DRY_RUN-safe), and exits 0, or 3 when a removal or a record rewrite needs verification.
// Pruning is reachable ONLY here — it never runs on the default install path (never-delete-first). ---
if (PRUNE_OLD_KIT) {
    console.log("== grugops prune (--prune-old-kit) ==");
    console.log(`home:   ${GRUGOPS_HOME}`);
    console.log(`target: ${TARGET}`);
    if (DRY_RUN)
        console.log("mode:   DRY_RUN (no filesystem changes)");
    // Plan 33.1-40 (review CR-02): a name shaped like a backup is not evidence that install made it, so prune
    // removes only what install's own records name, unchanged, and names everything else.
    console.log("\n-- removing the backups install recorded (by record, never by name; anything else is named and left) --");
    pruneOldKit();
    // Red-team of plan 33.1-27: a backup that could not be removed is a counted verify, so the banner
    // and the status say INCOMPLETE (3) rather than complete (0) over it. The banner names the command that prunes again
    // (phase 34.1 gap round 2, D-31, D-33): agentCommand with --prune-old-kit and no agent flag (prune takes none, D-25),
    // with this run's context, so it runs as printed from any directory with the kit home this run used. Printed under
    // DRY_RUN too.
    if (VERIFY_FINDINGS > 0) {
        console.log(`\n== prune INCOMPLETE — ${VERIFY_FINDINGS} item(s) need verification ==`);
        console.log(`  Once each is fixed, \`${agentCommand("install.js", TARGET, [], COMMAND_CONTEXT, ["--prune-old-kit"])}\` prunes again.`);
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
    const looksLikeSource = TARGET === canonicalPathSpelling(GRUGOPS_SRC) || hasSourceMarkers(TARGET);
    if (looksLikeSource) {
        process.stderr.write("refusing: target looks like the grugops source checkout — you probably meant --target <your-repo>. Pass --allow-self to override.\n");
        process.exit(1);
    }
}
// --- THE KIT HOME MUST NOT OVERLAP THE TARGET (plan 33.1-37, review CR-01, D-33 (b)). ALWAYS ON: it runs
// right after the self-checkout guard, before the --migrate branch, the run banner and every write, and
// neither --allow-self nor DRY_RUN exempts it (the self-checkout guard's rule). KIT_ROOT is
// `<GRUGOPS_HOME>/agent-factory`, and copyKit moves whatever is there aside before it puts the new kit in
// place. Nothing used to compare that with the target: with GRUGOPS_HOME set to the target, install moved
// the user's in-repo agent-factory/ aside and deleted it, exit 0, with no backup and no warning, and a
// DRY_RUN preview said only `would-copy`. So the three are compared by REAL path (realPathThroughExisting:
// a kit home that does not exist yet still has a real location, links on the way resolved), and the run
// is refused when the kit root is the target, when either lies inside the other, or when the kit home is
// the target or lies inside it. A path whose real location cannot be read is refused too, because the
// overlap cannot be ruled out. A target inside the kit home but outside the kit root
// (GRUGOPS_HOME=$HOME, target $HOME/code/repo) is not an overlap: install writes in the kit home only
// the kit root, its record (.grugops-kit.json), its backups and its own mkdtemp directories.
//
// It does not run on --check, --update or --prune-old-kit, which branch off above. --check writes
// nothing. --update has no target, and the kit-home record (copyKit) keeps it from deleting anything
// install did not record writing at the kit root. Prune acts only on records (plan 33.1-40).
//
// The refusal is one stderr sentence and exit 1, before anything reaches stdout.
{
    const realKit = realPathThroughExisting(KIT_ROOT);
    const realHome = realPathThroughExisting(GRUGOPS_HOME);
    const realTarget = realPathThroughExisting(TARGET);
    const within = (child, parent) => child.startsWith(parent.endsWith("/") ? parent : `${parent}/`);
    let overlap = null;
    if (realKit === null || realHome === null || realTarget === null) {
        const unread = [
            ...(realKit === null ? [`the kit root ${KIT_ROOT}`] : []),
            ...(realHome === null ? [`the kit home ${GRUGOPS_HOME}`] : []),
            ...(realTarget === null ? [`the target ${TARGET}`] : []),
        ];
        overlap =
            `install.js: the real path of ${unread.join(" and of ")} could not be read, so it cannot be shown that the kit ` +
                `home ${GRUGOPS_HOME} lies outside the target ${TARGET}; the kit could be written into, or replace, your ` +
                `repository. Set GRUGOPS_HOME to a directory outside the repository that can be resolved. Nothing was written.`;
    }
    else if (realKit === realTarget ||
        within(realKit, realTarget) ||
        within(realTarget, realKit) ||
        realHome === realTarget ||
        within(realHome, realTarget)) {
        overlap =
            `install.js: the kit home ${KIT_ROOT} overlaps the target ${TARGET} (real paths ${realKit} and ${realTarget}); ` +
                `the kit would be written into, or replace, your repository. Set GRUGOPS_HOME to a directory outside the ` +
                `repository. Nothing was written.`;
    }
    if (overlap !== null) {
        process.stderr.write(`${overlap}\n`);
        process.exit(1);
    }
}
// KIT-02 / D-18: the hand-listed SKILLS array and the single AGENT_REL adapter constant used to
// live here. Both are deleted — the adapter and skill sets are now derived at run time from
// $GRUGOPS_SRC by srcSkillNames() / srcAdapterFiles() above, so the installer carries no adapter
// or skill name literal and needs no edit when the kit grows a new adapter.
// The CLAUDE.md and Copilot pointer constants (CLAUDE_OPEN … COPILOT_CLOSE) MOVED (plan 34-29) up beside the
// doctor's kit-route findings, which read the block sentinels: a const declared below the `--check` early exit
// is in the temporal dead zone when the doctor runs. One authority: there is no copy left at this position.
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
// `skipped (identical — no backup)` (D-09) and return false (NO artifact created). Otherwise rename
// `target` aside to `${target}.bak.<ISO>` (filesystem-safe via isoStamp) and report `backed-up`,
// returning true. DRY_RUN mutates nothing and reports a `would-backup` line. Returns true iff a
// backup was (or would be) made.
//
// Plan 33.1-40: the backup is recorded (recordBackup, `origin` as the caller names it) once it has its name.
function backupIfDiffers(target, replacement, label, origin) {
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
        report("skipped", `${label} (identical — no backup)`);
        return false;
    }
    const backup = `${target}.bak.${isoStamp()}`;
    if (DRY_RUN) {
        report("would-backup", `${label} → ${backup}`);
        return true;
    }
    renameSync(target, backup);
    recordBackup(backup, origin, target);
    report("backed-up", `${label} → ${backup}`);
    return true;
}
// backupDir: the Phase-24 MIGR-04 handoffs-backup primitive — a thinner sibling of backupIfDiffers
// with NO `replacement` argument (D-19: --migrate NEVER parses or converts legacy handoff content;
// it only relocates the directory, preserving the originals for the human). Never-delete-first
// (D-18): the directory is RENAMED aside to `${target}.bak.<isoStamp()>`, never removed. The backup
// name reuses isoStamp(), and the backup is recorded (origin handoffs, plan 33.1-40); --prune-old-kit
// never removes a handoffs backup, because it holds the user's handoffs. Safety contract:
//   - absent target  → "nothing to migrate" clean no-op, returns false (idempotent, D-20: a second
//                       run after the dir is already backed up changes nothing).
//   - backup-name collision (the `.bak.<ISO>` already exists) → ABORT: print a clear professional-
//     voice message naming the collision and leave the ORIGINAL untouched, never overwriting the
//     existing backup (D-18 never-clobber). Returns false; the original is preserved verbatim.
//   - DRY_RUN → print a `would-backup` line and mutate NOTHING (D-20). Returns true (a backup WOULD
//     have been made), so the caller can report intent.
//   - otherwise → renameSync the dir aside and report `backed-up`. Returns true.
// Clear professional voice on every string (installer safety surface — CLAUDE.md hard constraint).
// Plan 33.1-40: the backup is recorded (recordBackup, `origin` as the caller names it) once it has its name.
function backupDir(target, label, origin) {
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
            `Move or remove the existing backup, then re-run --migrate: \`${migrateCommand()}\`.`);
        return false;
    }
    if (DRY_RUN) {
        report("would-backup", `${label} → ${backup}`);
        return true;
    }
    renameSync(target, backup);
    recordBackup(backup, origin, target);
    report("backed-up", `${label} → ${backup}`);
    return true;
}
// migrateHandoffs: the Phase-24 MIGR-04 step folded INTO the existing --migrate orchestration (D-17:
// EXTEND, never a colliding new flag). Backs up a user's runtime-accumulated plans/handoffs/ — the
// old relay's directory — to plans/handoffs.bak.<ISO> via backupDir (never-delete-first, abort on
// collision, no content conversion, DRY_RUN/idempotent). Called on EVERY --migrate path (both the
// already-two-root isMigrated arm AND the old-layout path) because a user can have accumulated
// plans/handoffs/ regardless of layout state (D-17 reconcile).
// Returns backupDir's answer (plan 34-26, D-25): true when the backup was made, or under DRY_RUN would
// be, so the already-migrated arm's closing says what this run did to plans/handoffs/.
function migrateHandoffs() {
    return backupDir(join(TARGET, "plans", "handoffs"), "plans/handoffs/", "handoffs");
}
// recordBackupsInMarker (plan 33.1-40): an already-migrated --migrate stops before the install run, so
// writeMarker() never runs and the handoffs backup it made would have no record. It is added to the
// marker's install ledger here, through rewriteLedger. A marker this run cannot use (absent, not install's,
// not this directory's, a malformed ledger) is not written; the backup stays unrecorded and a note says so.
// Prune never removes a handoffs backup either way (it holds the user's handoffs).
// Returns whether the backups were recorded (plan 34-26, D-25): true only when rewriteLedger rewrote the
// marker (or, under DRY_RUN, would); false when there was nothing to record or the marker could not be used.
function recordBackupsInMarker() {
    if (BACKUPS.size === 0)
        return false;
    const made = [...BACKUPS.values()];
    const m = readInstallMarker(TARGET);
    const ledger = readLedger(m.state === "ok" ? m.marker : null);
    if (m.state !== "ok" || ledger.state !== "ok") {
        report("note", `${made.map((e) => e.path).join(", ")}: not recorded, because ${MARKER_REL} is not a marker with an install ledger ` +
            `this run can use; uninstall and --prune-old-kit leave it, and it holds your content`);
        return false;
    }
    return rewriteLedger(join(TARGET, ...MARKER_REL.split("/")), TARGET, "target", m.bytes, (entries) => [...entries.filter((e) => !(e.kind === "backup" && BACKUPS.has(e.path))), ...made], `record the backup(s) ${made.map((e) => e.path).join(", ")}`);
}
// rewriteLedger (plan 33.1-40): THE ONE REWRITE of a record's install ledger outside writeMarker() and
// writeKitHomeRecord(): prune takes the backups it removed out of the record that held them
// (rewriteLedgerWithout), and an already-migrated --migrate adds the backup it made (recordBackupsInMarker).
// `holderPath` is the target's marker (scope "target") or the kit-home record (scope "kit-home"). It is
// rewritten only when readForWrite (no link followed, no special file opened) shows a regular file holding
// exactly `bytesAtStart`, the bytes the caller read its ledger from, and when that ledger is still well
// formed; every other key of the record is kept as it is, and the ledger is serialized by the one
// serializer (ledgerJson). The target's marker is written through writeTargetFile, the kit-home record by
// the one writeFileSync below. Any refusal or failure is a counted verify naming what was not done.
// DRY_RUN prints a would-edit line and changes nothing.
function rewriteLedger(holderPath, root, scope, bytesAtStart, next, what) {
    if (DRY_RUN) {
        report("would-edit", `${holderPath} (${what})`);
        return true;
    }
    const fail = (why) => {
        verify(`${holderPath}: ${why}, so it was not rewritten and this was not done: ${what}. Re-run to finish it.`);
        return false;
    };
    const now = readForWrite(root, holderPath);
    if (now.state === "create")
        return fail("it is no longer there");
    if (now.state === "blocked")
        return fail(now.at === holderPath ? `it ${now.reason}` : `${now.at} ${now.reason}`);
    if (!now.bytes.equals(bytesAtStart))
        return fail("it changed while this run was going");
    let parsed;
    try {
        parsed = JSON.parse(now.text);
    }
    catch {
        return fail("it is not valid JSON");
    }
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed))
        return fail("it is not a JSON object");
    const holder = parsed;
    const ledger = readLedger(holder, scope);
    if (ledger.state !== "ok")
        return fail(`its install ledger could not be read (${ledger.why ?? "absent"})`);
    const text = JSON.stringify({ ...holder, ledger: ledgerJson(next(ledger.entries)) }, null, 2) + "\n";
    if (scope === "target") {
        if (!writeTargetFile(holderPath, text, "ok", `${holderPath} (${what})`))
            return false;
    }
    else {
        try {
            writeFileSync(holderPath, text, { flag: "w" });
        }
        catch (e) {
            return fail(`it could not be written (${errCode(e)})`);
        }
    }
    report("edited", `${holderPath} (${what})`);
    return true;
}
// ---------------------------------------------------------------------------
// Phase-17 Plan 03 — `--prune-old-kit` (D-10): the SINGLE, opt-in deletion path. It NEVER runs on the
// default install path (never-delete-first). Every string is CLEAR PROFESSIONAL VOICE (safety surface;
// this runs as `node install/install.js --prune-old-kit`).
//
// PRUNE REMOVES BY RECORD, NEVER BY NAME (plan 33.1-40, D-33 (c), review CR-02, brief DC-2). It used to
// remove every name at the target root and in the kit home that ended in `.bak.<ISO>`, directories
// recursively, on the theory that only install makes such names. A name is not evidence of who made a
// file: the verifier's reproduction lost a user's `thesis.bak.<ISO>/` (with a chapter in it) and
// `budget.xlsx.bak.<ISO>`, exit 0. Install now records each backup it makes, with its content record (the
// target's install ledger: BACKUPS above; the kit-home record: copyKit), and prune removes a backup only
// when all of these hold:
//   - it is a `backup` entry of install's own record for that root: the target's bound marker with a
//     well-formed ledger (readInstallMarker, readLedger), or the bound kit-home record
//     (readKitHomeRecord). Both are read without following a link and without opening a special file
//     (brief DC-3);
//   - its origin is one prune has always removed: in-repo-kit and legacy-config in the target, kit-home in
//     the kit home. A handoffs backup and an edited-kit-file backup hold the user's own content, so prune
//     never removes them;
//   - it is not under a protected path (isPruneProtected, asked again in removeBackup);
//   - owns(ledger, root, path, "backup") answers owned: its content record is not null and the path still
//     holds exactly it (treeRecord: every file's bytes and mode, every link's target and every name in a
//     tree, no link followed, no special file opened, bounded). A backup changed since install made it,
//     even by one file added, is left.
// Everything else is left and named with the reason. The old name-shape scan stays, REPORT-ONLY: a name at
// either root shaped like a grugops backup that has no entry is named `left` (it may be the user's, or a
// backup made before install recorded them), and nothing is removed for its name. After the removals, the
// entries of the removed backups are taken out of the record that held them (rewriteLedgerWithout).
// Every decision is taken before the DRY_RUN branch, so the preview names what the real run does.
// ---------------------------------------------------------------------------
// isPruneProtected: mirror uninstall.ts's isProtected() denylist (uninstall.ts:110-119) so prune
// can NEVER touch the live kit, the seeded state, or any user-owned tree — even if a recorded backup
// somehow named a path under one. agent-factory/, plans/, .planning/, .grugops/, docs/, src/ (and
// the root itself) are off-limits, always. Checked against $TARGET.
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
// removeBackup: remove ONE recorded backup. Its one caller, pruneOldKit, calls it only after owns(...,
// "backup") answered owned for the entry (install/installer-fs-census.test.ts pins that order). It asks
// the protected paths again as a last gate before any removal (defense in depth). DRY_RUN narrates a
// `would-remove` line and deletes nothing. It returns what happened, so the caller knows which entries to
// take out of the record.
function removeBackup(path, name) {
    if (isPruneProtected(path)) {
        report("left", `${name} (under a protected path — never pruned; its entry is kept in the record)`);
        return "kept";
    }
    if (DRY_RUN) {
        report("would-remove", path);
        return "would-remove";
    }
    // Red-team of plan 33.1-27 (sibling of B2): a backup install made is a directory (a renamed kit) or
    // a regular file (a renamed config); a recorded link is removed as a link, never followed.
    // On Node 24 rmSync with force left a dangling link in place and threw nothing, so `removed` is
    // printed only when the path is gone, and a failure is a counted verify, never a throw.
    try {
        if (lstatSync(path).isDirectory())
            rmSync(path, { recursive: true, force: true });
        else
            unlinkSync(path);
    }
    catch (e) {
        verify(`${path} could not be removed (${errCode(e)}). It was left in place and its entry is kept in the record; remove it by hand.`);
        return "kept";
    }
    if (!gone(path)) {
        verify(`${path} is still present after its removal, and its entry is kept in the record. Remove it by hand.`);
        return "kept";
    }
    report("removed", path);
    return "removed";
}
function pruneRoots() {
    const marker = readInstallMarker(TARGET);
    const targetLedger = readLedger(marker.state === "ok" ? marker.marker : null);
    const kitHome = readKitHomeRecord(GRUGOPS_HOME);
    const targetWhy = marker.state === "absent"
        ? `there is no ${MARKER_REL}`
        : marker.state === "unreadable"
            ? `${MARKER_REL} ${markerUnusableText(marker)}`
            : marker.state === "unbound"
                ? `${MARKER_REL} is not this directory's record (${marker.why})`
                : targetLedger.state === "malformed"
                    ? `the install ledger in ${MARKER_REL} is malformed (${targetLedger.why})`
                    : targetLedger.state === "absent"
                        ? `${MARKER_REL} holds no install ledger`
                        : null;
    const kitWhy = kitHome.state === "absent" ? `there is no ${KIT_HOME_RECORD_REL}` : kitHome.state !== "ok" ? `${KIT_HOME_RECORD_REL}: ${kitHome.why}` : null;
    return [
        {
            root: TARGET,
            label: "target",
            scope: "target",
            holder: join(TARGET, ...MARKER_REL.split("/")),
            ledger: targetLedger,
            bytes: marker.state === "ok" && targetLedger.state === "ok" ? marker.bytes : null,
            noRecord: targetWhy,
        },
        {
            root: GRUGOPS_HOME,
            label: "kit home",
            scope: "kit-home",
            holder: join(GRUGOPS_HOME, KIT_HOME_RECORD_REL),
            ledger: kitHome.ledger,
            bytes: kitHome.state === "ok" ? kitHome.bytes : null,
            noRecord: kitWhy,
        },
    ];
}
// rewriteLedgerWithout: take the entries of the backups prune removed out of the record that held them,
// through the one rewrite (rewriteLedger: a same-bytes re-read, the one serializer, a verify naming the
// entries still listed when the rewrite is refused or fails). Used for both roots.
function rewriteLedgerWithout(holderPath, root, bytesAtStart, removedPaths, scope) {
    rewriteLedger(holderPath, root, scope, bytesAtStart, (entries) => entries.filter((e) => !(e.kind === "backup" && removedPaths.includes(e.path))), `take out the entries of the pruned backup(s) ${removedPaths.join(", ")}, which it still lists`);
}
// pruneOldKit: the ONLY deletion path (D-10), by record (see the header). Reachable ONLY from the
// --prune-old-kit branch; it never runs on the default install path.
function pruneOldKit() {
    // Declared here, not at module level: the --prune-old-kit branch runs above the module's later consts.
    const prunable = { target: ["in-repo-kit", "legacy-config"], "kit-home": ["kit-home"] };
    const roots = pruneRoots();
    let toRemove = 0;
    for (const r of roots) {
        if (r.noRecord !== null)
            report("note", `${r.label}: ${r.noRecord}, so no backup there is on install's record and prune removes nothing there`);
        const pruned = [];
        for (const e of entriesOfKind(r.ledger, "backup")) {
            const name = `${r.label}: ${e.path}`;
            if (!prunable[r.scope].includes(e.origin)) {
                report("left", `${name} (install's backup of your content (${e.origin}, from ${e.of}); prune never removes a backup of your content)`);
                continue;
            }
            const own = owns(r.ledger, r.root, e.path, "backup");
            if (!own.owned) {
                report("left", `${name} (${gone(`${r.root}/${e.path}`) ? "it is no longer there" : own.reason}; its entry is kept in the record)`);
                continue;
            }
            toRemove += 1;
            if (removeBackup(`${r.root}/${e.path}`, name) !== "kept")
                pruned.push(e.path);
        }
        if (pruned.length > 0 && r.bytes !== null)
            rewriteLedgerWithout(r.holder, r.root, r.bytes, pruned, r.scope);
    }
    // REPORT-ONLY (CR-02): a name at either root shaped like a grugops backup, with no entry in that root's
    // record, is named and never removed.
    for (const r of roots) {
        let names;
        try {
            names = readdirSync(r.root);
        }
        catch {
            continue; // an absent root has nothing to name
        }
        const recorded = new Set(entriesOfKind(r.ledger, "backup").map((e) => e.path));
        for (const name of names.sort()) {
            if (recorded.has(name) || !GRUGOPS_BACKUP_SUFFIX.test(name))
                continue;
            report("left", `${r.label}: ${name} (not recorded by install, so prune does not remove it; remove it by hand if it is a grugops ` +
                `backup you no longer need)`);
        }
    }
    if (toRemove === 0)
        report("ok", "no backup install recorded is there to remove (nothing to do)");
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
    return seeded.state === "create" ? { act: "carry", bytes: legacyRead.bytes, text: legacyRead.text, mode: legacyRead.mode } : { act: "keep" };
}
function planConfigCarry() {
    const refusals = [];
    let carried = null;
    for (const legacy of LEGACY_CONFIGS) {
        const step = configCarryStep(legacy, carried !== null);
        if (step.act === "refuse")
            refusals.push(step.why);
        else if (step.act === "carry")
            carried = { legacy, bytes: step.bytes, text: step.text, mode: step.mode };
    }
    return {
        refusals,
        render: carried === null
            ? { label: SEEDED_CONFIG, read: readUserFile(SEEDED_CONFIG) }
            : {
                label: `${carried.legacy} (the configuration this --migrate carries forward to ${SEEDED_CONFIG})`,
                read: { state: "ok", bytes: carried.bytes, text: carried.text, mode: carried.mode },
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
                report("would-move", `user config ${legacy} → .bak (.grugops/factory.config.json already present — kept)`);
            }
            continue;
        }
        if (step.act === "carry") {
            if (!writeTargetFile(SEEDED_CONFIG, step.bytes, "create", `user config ${legacy}`)) {
                // Not carried forward, so the original stays where it is, unrenamed (the verify says why).
                continue;
            }
            report("moved", `user config → ${SEEDED_CONFIG} (carried forward)`);
        }
        else {
            report("skipped", `user config (.grugops/factory.config.json already present — kept)`);
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
        recordBackup(bak, "legacy-config", legacy);
        report("backed-up", `original config → ${bak}`);
    }
    // 2. back up the displaced in-repo agent-factory/ (timestamped, differs-only — D-08/D-09).
    backupIfDiffers(join(TARGET, "agent-factory"), join(GRUGOPS_SRC, "agent-factory"), "in-repo agent-factory/", "in-repo-kit");
}
// ensure_block: idempotent sentinel-delimited append to a user file. Never overwrites a user byte; creates
// the file if absent. Never `>`-truncates.
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
//
// WHAT IT WRITES (phase 34.1, D-15, WR-13): installWouldWrite's answer over this function's own readForWrite read,
// the one owner the doctor's carrier classification asks too, so `--check` names `Re-run install.js` exactly when
// this function writes the carrier:
//   append  → a regular file without the open sentinel: the block is appended (the user's bytes kept, a separator
//             before it), recorded through recordAppendedBlock. Reported `created`;
//   create  → nothing there: an exclusive create that already carries the block, recorded as a file install created
//             and a block. Reported `created`;
//   refresh → THE REFRESH (plan 34-28, D-26 point 2, brief DC-2; plan 34-34, D-27 point 3): refreshable's ok answer,
//             carried in the act. refreshable asks ownBlockSpans (plan 34-29): owns(ledger, TARGET, rel, "block")
//             gives the `block` entry; the spans of the block lines are found by blockLineSpans (install-marker.ts,
//             the one finder uninstall's removal uses too) and only the spans whose bytes hash to the entry's record
//             are kept. Exactly one such span, whose bytes are not the current block lines: that span is replaced by
//             the current lines and every other byte is written back unchanged (writeTargetFile with how `ok`; under
//             DRY_RUN a `would-refresh` line instead, decided before any write). The new lines are recorded through
//             recordAppendedBlock with the entry's separator (the span did not move, so the newline before it is what
//             it was). When the ledger's `file` entry for the same path held before this write (install created the
//             file and nobody edited it), the whole new file is recorded too, so uninstall still deletes the file it
//             created. Reported `refreshed`. A block that is already the current lines: skipped, nothing written;
//   none    → a blocked path (a link, a hard link, a special file, a non-directory on the way): a counted verify,
//             nothing written. A file holding the open sentinel that install will not refresh (no record, a record
//             that no span matches because a line inside was added, edited or removed, or two matching spans):
//             skipped, nothing written. When the file then carries no kit route and that leaves a host without one,
//             install's route-note pass (noteStrandingCarriers, after every carrier write) names it and those hosts
//             (D-26 point 3, D-27 point 2).
// `ledger` is the install ledger as this run found it (PREVIOUS_LEDGER); `rel` is a ROUTE_BLOCKS carrier, whose
// sentinels are ROUTE_BLOCKS' (one source for the writer and the owner). Under DRY_RUN, each would-add and
// would-refresh records the bytes the real run would leave (setPlanned), so the route-note pass judges the state the
// real run would leave.
function ensureBlock(ledger, rel, body, label) {
    const sentinels = ROUTE_BLOCKS.get(rel);
    if (sentinels === undefined)
        throw new Error(`ensureBlock: ${rel} is not a ROUTE_BLOCKS carrier`);
    const { open, close } = sentinels;
    const file = join(TARGET, ...rel.split("/"));
    const cur = readForWrite(TARGET, file);
    const w = installWouldWrite(ledger, rel, cur);
    const newLines = `${open}\n${body}\n${close}\n`;
    if (w.act === "none") {
        if (cur.state === "blocked") {
            verify(`${label}: ${blockedWriteText(ledger, rel, w.why)}. It was left untouched and nothing was added to it.`);
        }
        else {
            report("skipped", `${label} (sentinel already present)`);
        }
        return;
    }
    if (w.act === "refresh") {
        const r = w.how;
        if (r.kind !== "block")
            throw new Error(`ensureBlock: ${rel} answered a whole-file refresh`);
        const newBytes = Buffer.from(newLines, "utf8");
        if (r.cur.bytes.subarray(r.span.start, r.span.end).equals(newBytes)) {
            report("skipped", `${label} (sentinel already present)`);
            return;
        }
        const next = Buffer.concat([r.cur.bytes.subarray(0, r.span.start), newBytes, r.cur.bytes.subarray(r.span.end)]);
        if (DRY_RUN) {
            setPlanned(file, next);
            report("would-refresh", `${label} (install's own block from an earlier install, unedited, is not the current text)`);
            return;
        }
        const createdHeld = owns(ledger, TARGET, rel, "file").owned;
        if (!writeTargetFile(file, next, "ok", label))
            return;
        recordAppendedBlock(file, newLines, r.own.separator);
        if (createdHeld)
            recordCreatedFile(file, writtenFileRecord(file, next));
        report("refreshed", `${label} (install's own block from an earlier install, unedited, held no kit route or was older; replaced with the current text, every other byte kept, and recorded)`);
        return;
    }
    // append (cur is ok) or create (cur is create).
    if (cur.state === "blocked")
        throw new Error(`ensureBlock: ${rel} answered ${w.act} on a blocked read`);
    const block = `\n${newLines}`;
    if (DRY_RUN) {
        // What the real run leaves: the block alone on a create, else the current bytes with the block appended.
        setPlanned(file, cur.state === "create" ? block : Buffer.concat([cur.bytes, Buffer.from(block, "utf8")]));
        report("would-add", label);
        return;
    }
    // The separator install writes before the block lines (red-team B1 of plan 33.1-33): into an absent or
    // empty file, or after a final newline, it makes a blank line; after a last line with no newline it
    // ends that line. Recorded, so uninstall can tell which newline is install's.
    const separator = cur.state === "create" || cur.bytes.length === 0 || cur.bytes[cur.bytes.length - 1] === 0x0a ? "blank-line" : "line-end";
    if (cur.state === "create") {
        if (!writeTargetFile(file, block, "create", label))
            return;
        // Plan 33.1-28: readForWrite said nothing was there and the exclusive create succeeded, so
        // install created this file. Uninstall deletes it only on this record (its file entry), and only
        // while the file still holds these bytes (red-team R1).
        recordCreatedFile(file, writtenFileRecord(file, block));
        recordAppendedBlock(file, newLines, separator);
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
        const appendedRel = targetRel(file);
        if (appendedRel !== null)
            APPENDED_FILES.add(appendedRel);
        recordAppendedBlock(file, newLines, separator);
    }
    report("created", label);
}
// writeWholeFileEntry (phase 34.1, plan 34.1-01, D-08, D-09, D-11; it replaces writePiPromptTemplate, plan 34-04,
// D-10, D-13, D-16, D-17, and keeps its arms; the refresh, plan 34-28, D-26 point 2): create the whole-file entry
// `rel` (one of wholeFileEntryRels) when NOTHING is at that path, and refresh install's own unedited copy from an
// earlier install. Called for each whole-file entry of the chosen agents (wholeFileEntryRels(SELECTION), D-06, which
// amends Phase 34 D-17). The choice is by agent, never by what the target holds: a write gated on detection would
// escape the derived installer class tests (34-RESEARCH.md Pitfall 10). `ledger` is the target's install ledger as this
// run found it (PREVIOUS_LEDGER), passed in so the doctor can share the rule (a const below the `--check` exit is in its
// temporal dead zone).
//
// THE BYTES ARE THE KIT'S, NEVER BUILT HERE (D-11): carrierSource(rel), the committed generated file under the kit
// source (scripts/generate-host-entries.ts renders it from agent-factory/packaging/host-entry.pointer.md), read
// through readUserFile (DC-3). Fixed kit text: no install-time value reaches it (T-34-13). The source is asked first:
//   absent  → `skipped`, naming that the kit source has no such file (the AGENTS.md linkOrCopy precedent); nothing is
//             written.
//   any other unread state → a counted verify; nothing is written.
// Then the path in the target is asked through readForWrite (DC-3: a FIFO, a directory, a device or a link there is
// never read or written through), and what is written is installWouldWrite's answer over that read (phase 34.1, D-15:
// the one owner the doctor asks too; create on `create`, refresh on refreshable's ok, none otherwise):
//   blocked → a counted verify (blockedWriteText: for install's own --symlink link, linkOwnership's reason and remedy,
//             D-16); nothing is written.
//   ok      → a file is already there. refreshOwnFile acts on a refresh answer (plan 34-34; brief DC-2: a
//             write only on install's own record): when the previous ledger's `file` entry for the path still
//             holds (owns) as a `sha256:` record and the path is a regular file, the file is install's own and
//             unedited, so text that is not the kit's current text (an earlier install's entry, with no kit route
//             or older) is replaced and the new bytes recorded; text that is current is skipped. Anything else (the
//             user's own file, or install's edited since) is left untouched, never overwritten or appended to, and
//             install's route-note pass (noteStrandingCarriers) names it when it carries no kit route and that
//             leaves a host without one (D-26 point 3, D-27 point 2). An earlier install's ledger claim on a file
//             left untouched is carried forward by nextLedgerEntries only while the file still holds exactly the
//             recorded content (recordHolds), so a user edit drops the claim.
//   DRY_RUN → `would-add` (nothing there) or `would-refresh`, decided before any write; the bytes the real run
//             would leave are recorded (setPlanned) for the route-note pass.
//   create  → writeTargetFile with the exclusive create (flag "wx"); mkdirp records each directory on the way in
//             CREATED_DIRS only when this run made it, so a user's own directory is never claimed. Only a create
//             that succeeded is recorded, as a kit-false `file` entry; uninstall removes it through the ledger walk
//             (owns(path)) only while it still holds these bytes.
// grugops writes nothing else under a host's directory for these hosts (no settings, skills other than this one, or
// extensions; Phase 34 D-10).
function writeWholeFileEntry(ledger, rel) {
    const label = entryLabel(rel);
    const src = carrierSource(rel);
    if (src === null || src.state === "absent") {
        report("skipped", `${rel} (${label}: the kit source has no ${rel} — nothing was written)`);
        return;
    }
    if (src.state !== "ok") {
        verify(`${rel} (${label}): the kit source ${join(GRUGOPS_SRC, ...rel.split("/"))} ${unreadState(src)}. Nothing was written.`);
        return;
    }
    const file = join(TARGET, ...rel.split("/"));
    const cur = readForWrite(TARGET, file);
    // installWouldWrite (phase 34.1, D-15): the one owner of what install writes here, asked over this read.
    const w = installWouldWrite(ledger, rel, cur);
    if (w.act === "refresh") {
        if (refreshOwnFile(w, rel, label) === "left")
            report("skipped", `${rel} (${label}: a file is already there — left untouched)`);
        return;
    }
    if (w.act !== "create") {
        if (cur.state === "blocked") {
            verify(`${rel} (${label}): ${blockedWriteText(ledger, rel, w.act === "none" ? w.why : blockedAt(cur, file))}. It was left untouched and nothing was written.`);
        }
        else {
            report("skipped", `${rel} (${label}: ${cur.state === "ok" ? "a file is already there — left untouched" : `${w.act === "none" ? w.why : "nothing to write"} — nothing was written`})`);
        }
        return;
    }
    if (DRY_RUN) {
        setPlanned(file, src.bytes);
        report("would-add", `${rel} (${label})`);
        return;
    }
    if (writeTargetFile(file, src.bytes, "create", rel)) {
        recordCreatedFile(file, writtenFileRecord(file, src.bytes));
        report("created", `${rel} (${label})`);
    }
}
function refreshOwnFile(w, rel, label) {
    if (w.act !== "refresh" || w.how.kind !== "file")
        return "left";
    const r = w.how;
    if (r.cur.bytes.equals(r.want)) {
        report("skipped", `${rel} (${label}: install's own, already current)`);
        return "current";
    }
    if (DRY_RUN) {
        setPlanned(r.file, r.want);
        report("would-refresh", `${rel} (${label}: install's own copy from an earlier install, unedited, is not the current text)`);
        return "would-refresh";
    }
    if (!writeTargetFile(r.file, r.want, "ok", rel))
        return "left";
    recordCreatedFile(r.file, writtenFileRecord(r.file, r.want));
    report("refreshed", `${rel} (${label}: install's own copy from an earlier install, unedited, held no kit route or was older; replaced with the current text and recorded)`);
    return "refreshed";
}
// adapterRouteAfterRun (plan 34-33, D-27 point 2): whether the Claude Code adapters give a route to a real kit
// after this run. Under DRY_RUN with KIT_WRITTEN (the kit step's own decision that the adapters would be written,
// never recomputed here), the adapters would carry KIT_ROOT; the kit there is the one copyKit's DRY_RUN reported it
// would copy (KIT_HOME_WOULD_COPY, its own recorded decision: the kit source) or else what KIT_ROOT holds now.
// Otherwise the adapters on disk are the state: adapterKitOnDisk, the doctor's own read, and kitReal on it.
function adapterRouteAfterRun() {
    if (DRY_RUN && KIT_WRITTEN)
        return KIT_HOME_WOULD_COPY ? kitReal(KIT_COPY_SOURCE) : kitReal(KIT_ROOT);
    const kit = adapterKitOnDisk().kit;
    return kitReal(kit ? docAbspath(kit) : "");
}
// noteStrandingCarriers (plan 34-33, D-27 point 2; was noteMissingRoute, plan 34-28, D-26 point 3): THE INSTALL
// ROUTE-NOTE PASS. Called once, right after the last carrier write (the writeWholeFileEntry loop). It asks strandedBy
// (host-tools.ts), the one derivation of the hosts a carrier leaves without a route, which the doctor asks too, over
// the state this run leaves: each path is read from PLANNED_BYTES first (under DRY_RUN, what the real run would
// write there), else through readUserFile under TARGET. Its facts:
//   reads(h, rel)       = hostReadsCarrier (the one owner: `rel` is one of the host's routeCarriers), for a host installed
//                         here after this run (AGENTS_AFTER); no host outside it is named (plan 34.1-08);
//   holds(rel)          = an ok read whose whole text carriesKitRoute;
//   adapterReaches(h)   = a `claude-kit` host while adapterRouteAfterRun.
// For each carrier of routeCarrierSet that does not hold and whose strandedBy names hosts, one `note` names the file
// and those hosts in registry order. Its sentence makes no grammatical claim about how many hosts it names. A carrier
// left with text and no route quotes KIT_ROUTE as the sentence to add. An absent or unread carrier says so, and its
// remedy is chosen by whether a writer of THIS run visited the carrier (routeCarrierSet(SELECTION) holds it, phase
// 34.1 D-26, WR-17): if one did, that writer printed a line about the carrier, and the note points at that line; if
// none did (the carrier belongs only to agents installed earlier and not chosen now), no such line exists, so the note
// names the command that writes it instead, agentCommand("install.js", TARGET, stranded, COMMAND_CONTEXT). Before
// plan 34-33 the note named every host reading the file (for AGENTS.md, the hosts whose only carrier it was),
// including hosts another carrier or Claude Code's adapters gave the route (WR-02).
// It READS AND REPORTS ONLY: it writes nothing and records nothing, so an interrupted or concurrent install cannot
// leave a record derived from a note.
function noteStrandingCarriers() {
    const cache = new Map();
    const afterReadAt = (rel) => {
        let r = cache.get(rel);
        if (r === undefined) {
            const planned = PLANNED_BYTES.get(rel);
            r = planned !== undefined ? { state: "ok", bytes: planned, text: planned.toString("utf8"), mode: 0o644 } : readUserFile(join(TARGET, ...rel.split("/")));
            cache.set(rel, r);
        }
        return r;
    };
    // Only the agents installed here after this run (AGENTS_AFTER, plan 34.1-08, D-04, D-06) are asked about: an agent
    // that is neither chosen nor installed needs no route. AGENTS_AFTER also holds agents installed earlier and not
    // chosen now, whose carriers no writer of this run visited; the absent-or-unread arm below therefore asks `written`
    // and names the command for such a carrier rather than a line this run never printed (D-26, WR-17). THE SAME
    // DERIVATION THE DOCTOR ASKS (phase
    // 34.1, D-07; AUTH-1): the ids mapped through hostsOf, then routeCarrierSet and strandedBy over that host set, as the
    // doctor does over doctorHosts, so install and the doctor name the same carriers and the same stranded hosts.
    const hosts = hostsOf(AGENTS_AFTER);
    const rels = routeCarrierSet(hosts);
    const reads = new Map();
    for (const h of hosts)
        for (const rel of rels)
            reads.set(`${h.id}\0${rel}`, hostReadsCarrier(h, rel));
    const adapterAfter = adapterRouteAfterRun();
    const facts = {
        reads: (h, rel) => reads.get(`${h.id}\0${rel}`) === true,
        holds: (rel) => {
            const r = afterReadAt(rel);
            return r.state === "ok" && carriesKitRoute(r.text);
        },
        adapterReaches: (h) => h.adapter === "claude-kit" && adapterAfter,
    };
    for (const rel of rels) {
        const stranded = strandedBy(rel, facts, hosts);
        if (stranded.length === 0)
            continue;
        const names = stranded.map((h) => h.name).join(", ");
        const r = afterReadAt(rel);
        if (r.state === "ok") {
            // Phase 34.1, D-16 (WR-16): for install's own --symlink link, linkOwnership's reason and remedy, never an edit of
            // the file the link points to.
            const link = linkOwnership(PREVIOUS_LEDGER, rel);
            report("note", `${rel} (left as it is, with no kit route in it: it leaves ${names} without a route to the kit after a scripted install; ` +
                (link.own ? `${link.reason}: ${link.remedy})` : `to give them one, add this sentence to it: "${KIT_ROUTE}")`));
        }
        else {
            // `written` (D-26, WR-17): a writer of this run visited the carrier, so it printed the line about it. AGENTS.md is
            // always written (it is in every row's entry files and its step runs on every install).
            const written = routeCarrierSet(SELECTION).includes(rel);
            const remedy = written
                ? `the line above about ${rel} says why and what to do`
                : `\`${agentCommand("install.js", TARGET, stranded, COMMAND_CONTEXT)}\` writes it` + (r.state === "absent" ? "" : ", or says why it cannot");
            report("note", `${rel} (${r.state === "absent" ? "is not present" : unreadState(r)}: it leaves ${names} without a route to the kit after a ` +
                `scripted install; ${remedy})`);
        }
    }
}
// recordAppendedBlock (plan 33.1-33): APPENDED_BLOCKS gets the record of the block this run wrote to
// `file`. Called only after the write succeeded, never in DRY_RUN (ensureBlock returns before).
function recordAppendedBlock(file, lines, separator) {
    const rel = targetRel(file);
    if (rel !== null)
        APPENDED_BLOCKS.set(rel, { block: contentRecord(lines), separator });
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
        // A copy or a link to src: either way a host reads src's bytes at dest after the real run (plan 34-33).
        setPlanned(dest, srcRead.bytes);
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
    return destRead.state === "create" ? writtenFileRecord(dest, srcRead.bytes) : null;
}
// detectedHosts: the registry rows whose `detect` path is present in the target. Derived from HOST_TOOLS (phase 34,
// D-11), in registry order. Presence only, never content (T-34-05), and only target-root paths: no user-level
// location is consulted. It answers "which agents appear to be in use here", never "which are installed" (that is
// install-marker.ts installedAgents, from the record): the unattended selection falls to it only when nothing is
// recorded (D-03), and the banner says so.
function detectedHosts() {
    return HOST_TOOLS.filter((t) => existsSync(join(TARGET, ...t.detect.split("/"))));
}
// detectTools: the `tools detected:` banner text, from detectedHosts, so the existing hosts' output is byte-identical
// to the hand-written list this replaced.
function detectTools() {
    const found = detectedHosts().map((t) => t.id);
    return found.length ? found.join(" ") : "none-detected";
}
// copyKit: install the read-only kit at $GRUGOPS_HOME/agent-factory (INSTALL-04, D-05), always re-copied
// from the running checkout (no version negotiation).
//
// THE KIT HOME KEEPS A RECORD, AND NOTHING AT THE KIT ROOT IS DELETED BY PRESENCE (plan 33.1-37, review
// CR-01's sibling, D-33 (b)). copyKit used to move whatever sat at the kit root aside and delete it. With
// GRUGOPS_HOME pointing at a directory that held someone's agent-factory/ (the target itself was CR-01; the
// overlap refusal above the run now stops that one), the user's directory was gone, with no backup and no
// warning. So the kit home keeps `.grugops-kit.json` (install-marker.ts THE KIT-HOME RECORD), and what is
// at the kit root is decided by that record, read once, before anything is written:
//   absent         nothing at the kit root: the kit is copied there;
//   recorded kit   owns(kitHome, GRUGOPS_HOME, "agent-factory", "kit") answers owned (a real directory the
//                  record names): it is REPLACED, and the displaced copy is removed. That is D-31 item 14's
//                  acceptance, the named human's decision of 2026-09-30: a re-install overwrites edits
//                  inside the shared kit install wrote, and a backup of kit-home edits is deferred. With
//                  retainBackup (--update, D-06) and a recorded kit that differs from the source
//                  (dirsSameContent), it is kept as a recorded backup instead; an identical one is replaced
//                  with no backup (D-09);
//   anything else  no record, a record that does not hold, a link, a file, a FIFO: it is RENAMED aside to
//                  `${KIT_ROOT}.bak.<ISO>` and recorded as a `backup` entry (origin kit-home, `of`
//                  agent-factory) with its content record (treeRecord, taken before the rename), never
//                  deleted. A link is renamed as a name; what it points at is untouched. When the backup
//                  name already exists, nothing is renamed or copied (never-clobber) and a verify says so.
// Every kit home written before this release has no record, so its first re-install leaves one backup.
//
// THE TEMPORARY DIRECTORIES ARE EXCLUSIVE mkdtemp DIRECTORIES (red-team rows D8 and D10 of plan 33.1-36). The
// new kit is staged in `<GRUGOPS_HOME>/.agent-factory.tmp-XXXXXX/kit` and renamed into place, and the empty
// staging directory is removed with rmdir. The displaced recorded kit is renamed into a second mkdtemp
// holder, `.agent-factory.old-XXXXXX`, and that holder, which this run created, is removed only after owns
// answered owned for the kit it holds. Nothing is removed by a fixed name: the old code removed
// `.agent-factory.tmp.<pid>` by name before copying, and renamed onto `.old.<pid>`, which rename(2) is
// allowed to do over an empty directory someone else made.
//
// Every decision is taken before the DRY_RUN branch, so the preview (`would-copy`, plus `would-back-up` or
// `would-replace`) names what the real run does. Every filesystem failure is a counted verify, never a
// throw. Afterwards the record is written (writeKitHomeRecord).
function copyKit(retainBackup = false) {
    const source = join(GRUGOPS_SRC, "agent-factory");
    const kitHome = readKitHomeRecord(GRUGOPS_HOME);
    if (kitHome.state === "unreadable" || kitHome.state === "unbound") {
        report("note", `${join(GRUGOPS_HOME, KIT_HOME_RECORD_REL)}: ${kitHome.why}, so it is read as no record; whatever is at ` +
            `${KIT_ROOT} is kept as a backup, not replaced`);
    }
    let atRoot;
    try {
        atRoot = kindAtKitRoot();
    }
    catch (e) {
        // Neither "nothing there" nor a kind: nothing is decided about what is there, so nothing is moved.
        verify(`${KIT_ROOT} could not be read (${errCode(e)}), so it was left as it is and the kit was not copied.`);
        return;
    }
    const owned = atRoot === null ? null : owns(kitHome.ledger, GRUGOPS_HOME, KIT_ENTRY_PATH, "kit");
    // The arm, decided once (see the header).
    const arm = atRoot === null ? "fresh" : owned !== null && owned.owned ? (retainBackup && !dirsSameContent(KIT_ROOT, source) ? "backup" : "replace") : "backup";
    const backup = `${KIT_ROOT}.bak.${isoStamp()}`;
    const recordedKit = arm === "replace" || (arm === "backup" && owned !== null && owned.owned);
    const why = arm === "backup"
        ? recordedKit
            ? "the kit install recorded writing there differs from the new one (--update keeps it)"
            : atRoot === "directory"
                ? "no kit-home record names it as the kit install wrote, so it is kept"
                : `it is a ${atRoot}, not a kit install wrote, so it is kept as it is (a link is moved, never followed)`
        : "";
    const content = arm === "backup" ? treeRecord(GRUGOPS_HOME, KIT_ENTRY_PATH) : null;
    if (DRY_RUN) {
        if (arm === "backup")
            report("would-back-up", `${KIT_ROOT} → ${backup} (${why}; recorded in ${KIT_HOME_RECORD_REL})`);
        if (arm === "replace")
            report("would-replace", `${KIT_ROOT} (the kit install recorded writing there)`);
        report("would-copy", `kit → ${KIT_ROOT}`);
        KIT_HOME_WOULD_COPY = true;
        return;
    }
    if (arm === "backup" && !gone(backup)) {
        verify(`${KIT_ROOT}: a backup named ${backup} already exists, so ${KIT_ROOT} was left untouched and the kit was not ` +
            `copied (never overwrite a backup). Move that backup and re-run.`);
        return;
    }
    // Stage the new kit in an exclusive mkdtemp directory beside the kit root.
    let tmp;
    try {
        mkdirp(GRUGOPS_HOME);
        tmp = mkdtempSync(join(GRUGOPS_HOME, ".agent-factory.tmp-"));
    }
    catch (e) {
        verify(`${GRUGOPS_HOME}: a staging directory could not be made there (${errCode(e)}). The kit was not copied.`);
        return;
    }
    const staged = join(tmp, "kit");
    try {
        // The source is spelled out (not KIT_COPY_SOURCE) because the fs census pins this read's source
        // expression as a kit path; the two are the same path.
        cpSync(join(GRUGOPS_SRC, "agent-factory"), staged, { recursive: true });
    }
    catch (e) {
        verify(`the kit could not be staged in ${tmp} (${errCode(e)}). The kit was not copied; ${tmp} was left for you to remove.`);
        return;
    }
    let holder = null;
    let made = null;
    if (arm === "replace") {
        try {
            holder = mkdtempSync(join(GRUGOPS_HOME, ".agent-factory.old-"));
            renameSync(KIT_ROOT, join(holder, KIT_ENTRY_PATH));
        }
        catch (e) {
            verify(`${KIT_ROOT} could not be moved aside (${errCode(e)}), so the kit was not replaced; the new kit was left staged ` +
                `in ${tmp}${holder === null ? "" : ` and the holder ${holder} was left`} for you to remove.`);
            return;
        }
    }
    else if (arm === "backup") {
        try {
            renameSync(KIT_ROOT, backup);
        }
        catch (e) {
            verify(`${KIT_ROOT} could not be moved aside to ${backup} (${errCode(e)}), so the kit was not copied; the new kit was left staged in ${tmp} for you to remove.`);
            return;
        }
        made = { path: canonicalPathSpelling(relative(GRUGOPS_HOME, backup)), kind: "backup", origin: "kit-home", of: KIT_ENTRY_PATH, content };
        report("backed-up", `${KIT_ROOT} → ${backup} (${why}; recorded in ${KIT_HOME_RECORD_REL})`);
    }
    try {
        renameSync(staged, KIT_ROOT);
    }
    catch (e) {
        verify(`the staged kit ${staged} could not be moved to ${KIT_ROOT} (${errCode(e)}). The kit was not copied` +
            (holder === null ? "." : `; the kit it was to replace is in ${holder}, kept for you to move back.`));
        writeKitHomeRecord(kitHome, made, false);
        return;
    }
    try {
        rmdirSync(tmp);
    }
    catch (e) {
        verify(`the empty staging directory ${tmp} could not be removed (${errCode(e)}); remove it by hand.`);
    }
    // The displaced recorded kit goes only on owns' answer for it (asked above, before it was moved): the
    // holder is an mkdtemp directory this run made, and it holds only that kit.
    if (holder !== null && owned !== null && owned.owned) {
        try {
            rmSync(holder, { recursive: true, force: true });
        }
        catch (e) {
            verify(`the replaced kit in ${holder} could not be removed (${errCode(e)}); remove it by hand.`);
        }
    }
    report("copied", `kit → ${KIT_ROOT}${arm === "replace" ? " (replaced the kit install recorded writing there)" : ""}`);
    writeKitHomeRecord(kitHome, made, true);
}
// kindAtKitRoot: what is at the kit root itself (lstat, a link not followed), or null when nothing is.
function kindAtKitRoot() {
    try {
        const st = lstatSync(KIT_ROOT);
        if (st.isSymbolicLink())
            return "symbolic link";
        if (st.isDirectory())
            return "directory";
        if (st.isFile())
            return "regular file";
        return "special file";
    }
    catch (e) {
        if (errCode(e) === "ENOENT")
            return null;
        throw e;
    }
}
// writeKitHomeRecord: write `<GRUGOPS_HOME>/.grugops-kit.json` after copyKit (plan 33.1-37). It holds the
// kit entry when the kit is in place (`kitInPlace`), every backup entry of the previous `ok` record that
// still holds (owns), and the backup this run made. The binding is the kit home's real path, read now
// that the kit home exists. An absent record is created with an exclusive create; an `ok` or `unbound`
// one is rewritten only after readForWrite shows a regular file there. A record that is not install's
// (`unreadable`) is never written over: it is left as it is and a verify says why, and this run's backup
// then stays unrecorded (prune never removes it; remove it by hand).
function writeKitHomeRecord(previous, made, kitInPlace) {
    const path = join(GRUGOPS_HOME, KIT_HOME_RECORD_REL);
    if (previous.state === "unreadable") {
        verify(`${path}: ${previous.why}. It is not install's kit-home record, so it was left as it is and this run was not ` +
            `recorded there${made === null ? "" : ` (the backup ${join(GRUGOPS_HOME, made.path)} is unrecorded; remove it by hand when you no longer need it)`}.`);
        return;
    }
    const here = realTargetPath(GRUGOPS_HOME);
    if (here === null) {
        verify(`${path}: the real path of ${GRUGOPS_HOME} could not be read, so the kit-home record was not written.`);
        return;
    }
    const entries = [];
    if (kitInPlace)
        entries.push({ path: KIT_ENTRY_PATH, kind: "kit" });
    if (previous.state === "ok") {
        for (const e of previous.ledger.entries) {
            if (e.kind !== "backup")
                continue;
            if (made !== null && e.path === made.path)
                continue;
            if (owns(previous.ledger, GRUGOPS_HOME, e.path, "backup").owned)
                entries.push(e);
        }
    }
    if (made !== null)
        entries.push(made);
    const text = JSON.stringify({ grugopsHome: here, ledger: ledgerJson(entries) }, null, 2) + "\n";
    const gate = readForWrite(GRUGOPS_HOME, path);
    if (gate.state === "blocked" || (gate.state === "ok") !== (previous.state !== "absent")) {
        verify(`${path}: ${gate.state === "blocked" ? gate.reason : "it changed while install ran"}, so the kit-home record was not written.`);
        return;
    }
    try {
        writeFileSync(path, text, { flag: gate.state === "create" ? "wx" : "w" });
    }
    catch (e) {
        verify(`${path} could not be written (${errCode(e)}), so the kit-home record was not written.`);
    }
}
// announcementShape: THE ONE SHAPE CHECK both dials' announcements pass (plan 34-20, IN-07, RC-1).
// The mirrored module's validator already refuses a malformed payload by name; this is the
// installer's own floor on what it reads back off the probe, so that nothing it trusts later (the
// counts, the list, the per-adapter map) is used before its type is known. The checks are the same
// for both dials: both counts non-negative integers (`isCount`), the list an array of strings, and
// `byAdapter` a non-null, non-array object whose values are strings. The list's KEY is the only
// per-dial difference (`aliases` or `levels`), and one sentence pattern names which announcement
// failed. Until this plan the model arm checked `typeof` and the effort arm `isCount`, so one dial
// accepted a count the other refused.
//
// Its words are chosen INSIDE the function, for the temporal-dead-zone reason oneAnnouncement gives.
function announcementShape(value, dial) {
    const resolution = dial === "model" ? "the announced resolution" : "the announced effort resolution";
    const listKey = dial === "model" ? "aliases" : "levels";
    const v = (value ?? {});
    const list = v[listKey];
    const map = v.byAdapter;
    if (!isCount(v.roles) ||
        !isCount(v.overrides) ||
        !Array.isArray(list) ||
        list.some((x) => typeof x !== "string") ||
        map === null ||
        typeof map !== "object" ||
        Array.isArray(map) ||
        Object.values(map).some((x) => typeof x !== "string")) {
        return {
            ok: false,
            problem: `${resolution} did not carry the declared shape (two non-negative integer counts, a list ` +
                `of strings under "${listKey}" and a map of strings under "byAdapter")`,
        };
    }
    return {
        ok: true,
        value: {
            roles: v.roles,
            overrides: v.overrides,
            list: list,
            byAdapter: map,
        },
    };
}
// oneAnnouncement: the ONE reading of a dial's result list off the probe's line (plan 34-15, RC-1).
// Three named conditions, the same for both dials: the list is missing; it does not hold exactly
// one announcement (zero means the run announced nothing; two or more is a stream carrying two
// announcements, which is ambiguous rather than agreeable; neither is a default); or the one
// announcement was refused by name by the mirrored module that owns the grammar. The shape of the
// accepted value is the caller's to check, because the two dials carry different members.
//
// The words each refusal names the announcement by are chosen INSIDE the function, not held in
// module constants: the --check doctor reaches the render helper from a line above this
// declaration, and a module `const` read from there is in its temporal dead zone (a hoisted
// function is not). The model arm's sentences are the ones this installer has always printed; the
// effort arm's name the effort announcement, so a reader can tell which of the two was unreadable.
function oneAnnouncement(list, dial) {
    const words = dial === "model"
        ? {
            results: "results",
            announcements: "resolved-assignment announcement(s)",
            resolution: "the announced resolution",
        }
        : {
            results: "effort results",
            announcements: "resolved-effort-assignment announcement(s)",
            resolution: "the announced effort resolution",
        };
    if (!Array.isArray(list)) {
        return { ok: false, problem: `the reader's answer did not carry a list of ${words.results}` };
    }
    if (list.length !== 1) {
        return {
            ok: false,
            problem: `the generator's output carried ${list.length} ${words.announcements} ` +
                "where exactly one was required",
        };
    }
    const one = (list[0] ?? {});
    if (one.ok !== true) {
        return {
            ok: false,
            problem: `${words.resolution} was refused by name — ${String(one.reason ?? "no reason given")}`,
        };
    }
    return { ok: true, value: one.value ?? {} };
}
// A non-negative integer: the declared type of an announced count.
function isCount(n) {
    return typeof n === "number" && Number.isInteger(n) && n >= 0;
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
            // BOTH DIALS THROUGH ONE CODE PATH, SHAPE INCLUDED (plan 34-15, plan 34-20, RC-1, IN-07). The
            // three named conditions — not a list, not exactly one announcement, refused by name — are
            // asked by ONE helper about each dial's list, and the accepted value's shape (counts, list,
            // per-adapter map) by ONE more, so the effort arm cannot drift from the model arm. The dial's
            // name is the only argument that differs.
            const model = oneAnnouncement(parsed.results, "model");
            const effort = oneAnnouncement(parsed.effortResults, "effort");
            if (!model.ok) {
                announceProblem = model.problem;
            }
            else if (!effort.ok) {
                announceProblem = effort.problem;
            }
            else {
                const m = announcementShape(model.value, "model");
                const e = announcementShape(effort.value, "effort");
                if (!m.ok) {
                    announceProblem = m.problem;
                }
                else if (!e.ok) {
                    announceProblem = e.problem;
                }
                else {
                    announced = {
                        roles: m.value.roles,
                        overrides: m.value.overrides,
                        aliases: m.value.list,
                        byAdapter: m.value.byAdapter,
                        effort: {
                            roles: e.value.roles,
                            overrides: e.value.overrides,
                            levels: e.value.list,
                            byAdapter: e.value.byAdapter,
                        },
                    };
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
// The frontmatter key a rendered adapter carries its resolved alias on, and the key it carries its
// effort level on. Whole-line PREFIX tests, matching how the generator emits them (`model: ` then
// the alias, and `effort: ` then the level, each on its own line).
const RENDERED_MODEL_KEY = "model: ";
const RENDERED_EFFORT_KEY = "effort: ";
// The level an adapter carrying NO `effort:` line is installed at. The generator writes no line for
// `inherit` (scripts/generate-role-adapters.ts writes `effort:` "only when it is not `inherit`"),
// and that is the level its announcement gives such an adapter in its per-adapter map. Reading zero
// lines as this word is what makes the level read off each text comparable with the announced level
// for that adapter. It is the one effort level this installer spells, and it spells it only to read
// an absence.
const ABSENT_EFFORT_LEVEL = "inherit";
// readRenderedKeyLines: THE ONE LINE READER over a rendered adapter's text (plan 34-15, RC-1). Every
// line beginning with `key`. Both dials are read through it, over the same bytes, so the model arm
// and the effort arm cannot come to two different readings of one file.
function readRenderedKeyLines(text, key) {
    return text.split("\n").filter((line) => line.startsWith(key));
}
function readRenderedDials(text, label, which) {
    const reasons = [];
    // Which text the refusal names: the render, or the text about to be written. Spelled inside the
    // function for the temporal-dead-zone reason oneAnnouncement gives.
    const carrying = which === "rendered" ? `${label} was rendered carrying` : `${label} would be written carrying`;
    const models = readRenderedKeyLines(text, RENDERED_MODEL_KEY);
    if (models.length !== 1) {
        reasons.push(`${carrying} ${models.length} line(s) beginning "${RENDERED_MODEL_KEY}" ` +
            `where exactly one was required, so the model this adapter would be installed with cannot ` +
            `be stated. Zero and two are different defects from a wrong value and neither is read as ` +
            `the other; reporting the first match would hide both.`);
    }
    const efforts = readRenderedKeyLines(text, RENDERED_EFFORT_KEY);
    if (efforts.length > 1) {
        reasons.push(`${carrying} ${efforts.length} line(s) beginning "${RENDERED_EFFORT_KEY}" ` +
            `where at most one was allowed, so the effort level this adapter would be installed with ` +
            `cannot be stated. No line is the ${ABSENT_EFFORT_LEVEL} level and one line names a level; ` +
            `two or more is neither, and reporting the first match would hide it.`);
    }
    if (reasons.length > 0)
        return { ok: false, reasons };
    return {
        ok: true,
        alias: models[0].slice(RENDERED_MODEL_KEY.length),
        effort: efforts.length === 0 ? ABSENT_EFFORT_LEVEL : efforts[0].slice(RENDERED_EFFORT_KEY.length),
    };
}
// dialDisagreements: THE ONE PER-MEMBER COMPARISON (plan 34-20, D-22, D-24, RC-1). For one adapter,
// for BOTH dials, the value each of its two texts carries is compared with the value the generator
// announced for that adapter in its per-adapter map. Every difference is a named sentence: the
// adapter, the dial, which text, that text's value and the announced value.
//
// WHAT EACH COMPARISON CATCHES:
//   - the RENDERED value against the announced value: the generator rendered something other than
//     what it announced it resolved (case B — a dropped `effort:` line, or one adapter written with
//     another alias, even when the distinct set of values is unchanged);
//   - the WRITTEN value against the announced value: the install-time transform changed a line
//     between the render and the write (case A — for example a line placed inside the kit-slot
//     sentinels, which transformAdapter drops).
// A DIRECT rendered-versus-written comparison (D-22) is subsumed: if both texts equal the announced
// value they equal each other, and if they differ, at least one of them differs from the announced
// value and is named here.
//
// An adapter the announced map has NO entry for is refused by name on that dial: absence is not
// agreement. With the role-count check (the map's size equals the derived listing's size, through
// the mirrored validator's agreement rule) this makes the map's key set exactly the rendered names.
function dialDisagreements(label, name, texts, announced) {
    const found = [];
    for (const [dial, key, map] of [
        ["model", "alias", announced.byAdapter],
        ["effort", "effort", announced.effort.byAdapter],
    ]) {
        if (!Object.prototype.hasOwnProperty.call(map, name)) {
            found.push(`${label}: the render announced no ${dial} entry for the adapter ${name}, so the ${dial} it ` +
                `would be installed with cannot be checked against the generator's own resolution. An ` +
                `adapter missing from the announced map is not read as agreement.`);
            continue;
        }
        const said = map[name];
        for (const t of texts) {
            if (t[key] === said)
                continue;
            found.push(t.which === "rendered"
                ? `${label}: the rendered text carries ${dial} "${t[key]}", while the generator announced ` +
                    `${dial} "${said}" for the adapter ${name}. The generator rendered something other than ` +
                    `what it announced it resolved.`
                : `${label}: the text about to be written carries ${dial} "${t[key]}", while the generator ` +
                    `announced ${dial} "${said}" for the adapter ${name}. The install-time transform changed ` +
                    `it between the render and the write.`);
        }
    }
    return found;
}
// transformAdapter: the PURE half of materialization. Takes a source file's text and the kit root
// its KIT= line names, and returns the final text plus the recognised banner count. It writes
// nothing, reads nothing off disk and depends on nothing but its two arguments, which is what lets
// THREE callers share one authority: the writer below (the skills plan), the agents loop's pre-write
// banner floor, and the --check doctor's like-for-like staleness comparison.
//
// THE KIT ROOT IS A PARAMETER (plan 34.1-50, D-38, review WR-24). The two install callers pass
// KIT_ROOT, install's own kit root, the one the marker it writes records. The doctor passes
// DOCTOR_KIT_ROOT, the recorded kit root its printed commands state: it compares the target's
// adapters with what the printed re-install would write. It used to read KIT_ROOT itself, so under a
// plain --check on an install with another kit home every adapter read as stale (a FAIL under
// --strict) and the printed re-install, which writes the recorded kit root, could not clear it. The
// WR-24 census in install/agents-record.test.ts names any function the doctor reaches that reads
// this run's kit home. A second implementation of this transform anywhere would be
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
function transformAdapter(srcText, kitRoot) {
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
            out.push(`KIT="${kitRoot}"`);
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
// destination that is exactly the link an install made before the render (isOwnLink: its readlink names
// THIS checkout's kit source path for that file, compared through the one spelling of a recorded path,
// the predicate uninstall uses) is install's content, and the kit write replaces it: it is unlinked in
// the write phase, just before its file is written,
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
        return { act: "skip", verb: "skipped", line: `${e.label} (source missing: ${e.src})`, record: null };
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
            // The destination holds exactly what install writes there. That identity is not a record (plan 33.1-37
            // Task 4): it keeps a record only as a carry, otherwise it is left.
            return identicalKitDest(e, "identical copy");
        }
        const cannot = writable(destRead.state);
        return cannot === null ? { act: "write", how: destRead.state } : { act: "refuse", why: cannot };
    }
    // copy / link: a --symlink install's own link to this exact source holds install's content. It, too, keeps
    // a record only as a carry (plan 33.1-37 Task 4): a link a user made to the same path is not install's.
    if (isOwnLink(dest, e.src))
        return identicalKitDest(e, "symlink");
    const destRead = readForWrite(TARGET, dest);
    if (destRead.state === "blocked") {
        return { act: "refuse", why: `${e.label}: ${blockedAt(destRead, dest)}. It was left untouched and nothing was copied over it.` };
    }
    if (destRead.state === "ok" && destRead.text === e.srcText)
        return identicalKitDest(e, "identical copy");
    const cannot = writable(destRead.state);
    return cannot === null ? { act: "write", how: destRead.state } : { act: "refuse", why: cannot };
}
// identicalKitDest: the ONE answer for a kit destination that already holds what install writes there (both
// identical-copy branches of kitDestDecision and the --symlink own-link branch; plan 33.1-37 Task 4). A carry
// keeps the earlier record and is `skipped`; anything else is `left`, unrecorded, so uninstall leaves it.
function identicalKitDest(e, what) {
    const rel = targetRel(e.dest);
    const carried = rel === null ? null : carriedKitRecord(PREVIOUS_LEDGER, TARGET, rel);
    if (carried !== null)
        return { act: "skip", verb: "skipped", line: `${e.label} (${what} present)`, record: carried };
    return {
        act: "skip",
        verb: "left",
        line: `${e.label} (${what === "symlink" ? "the link install makes is already there" : "an identical copy is already there"}, ` +
            `but the install ledger has no record that install wrote it, so it is not recorded and uninstall will leave it)`,
        record: null,
    };
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
        report(d.verb, d.line);
        return;
    }
    if (DRY_RUN) {
        report("would-materialize", `${e.label} ${suffix}`);
        return;
    }
    const final = e.text ?? "";
    if (writeTargetFile(e.dest, final, d.how, e.label)) {
        // What install wrote to this kit file, so uninstall removes it only while it holds it (plan 33.1-30).
        recordKitFile(e.dest, writtenFileRecord(e.dest, final));
        report("materialized", `${e.label} ${suffix}`);
    }
}
// copyKitFile: lay one copy/link entry (a skill without the slot line) down from the kit source bytes
// buildKitPlan read, D-30 symlink-with-copy-fallback under a non-copy INSTALL_MODE. What linkOrCopy
// did for the skills before plan 33.1-31, with the decision taken by kitDestDecision: a --symlink
// install's own link is skipped as install's; any other link, special file or non-directory on the way
// is refused; a new file is made with an exclusive create. Every outcome that leaves install's content
// at the destination is recorded as a kit-true file entry (`link:<src>` or `sha256:` of the source bytes).
function copyKitFile(e) {
    const d = kitDestDecision(e);
    if (d.act === "refuse") {
        verify(d.why);
        return;
    }
    if (d.act === "skip") {
        if (d.record !== null)
            recordKitFile(e.dest, d.record);
        report(d.verb, d.line);
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
    recordKitFile(e.dest, writtenFileRecord(e.dest, bytes));
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
// The name a byte backup is written under until it is whole (see A BACKUP NAME ONLY EVER HOLDS A WHOLE
// COPY above). uninstall.ts reports a name with this suffix as an incomplete copy.
const KIT_BACKUP_INCOMPLETE = ".incomplete";
const kitBackupStaging = (backup) => `${backup}${KIT_BACKUP_INCOMPLETE}`;
// A path under TARGET as the report shows it (POSIX, relative), or the path itself outside TARGET.
const shownPath = (p) => targetRel(p) ?? p;
function kitPreflight(plan) {
    const edited = [];
    const hazards = [];
    const marker = readInstallMarker(TARGET);
    const ledger = readLedger(marker.state === "ok" ? marker.marker : null);
    // D-32 reads each kit file's record from the one ledger: a `file` entry with `kit: true`.
    const records = ledger.state === "ok" ? new Map(entriesOfKind(ledger, "file").filter((e) => e.kit).map((e) => [e.path, e.content])) : null;
    const noRecord = marker.state === "unreadable"
        ? marker.jsonObject
            ? "the file at the install marker's path is not install's marker"
            : "the install marker could not be read"
        : marker.state === "unbound"
            ? marker.unboundBy === "no-ledger"
                ? "the install marker has no install ledger (it was written before the one ledger)"
                : "the install marker is not this directory's record (it was written for another directory, or before markers were bound)"
            : marker.state === "absent"
                ? "there is no install marker"
                : ledger.state === "malformed"
                    ? "the install ledger is malformed"
                    : "the install ledger has no kit-file entry for it";
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
        let mode;
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
            mode = cur.mode;
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
        const backup = kitBackupPath(e.dest);
        // A byte backup is written under its incomplete name first (red-team W1), so both names must be free.
        const names = linkTarget === undefined ? [backup, kitBackupStaging(backup)] : [backup];
        const problem = (() => {
            for (const p of names) {
                const tooLong = pathLimitProblem(p);
                if (tooLong !== null)
                    return `its backup ${p} ${tooLong}. Nothing was backed up and no kit file was written.`;
            }
            for (const p of names) {
                const at = readForWrite(TARGET, p);
                if (at.state === "create")
                    continue;
                const what = at.state === "ok" ? `${p} already holds a file` : blockedAt(at, p);
                return `its backup path is taken: ${what}. It was left untouched, nothing was backed up and no kit file was written.`;
            }
            return null;
        })();
        if (problem !== null) {
            hazards.push(`${e.label} — ${problem}`);
            continue;
        }
        edited.push({ dest: e.dest, label: e.label, backup, why, bytes, mode, linkTarget });
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
    const nothing = `No kit file was written: the whole kit, these files included, was left exactly as it was`;
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
        const failed = (why, after = "") => {
            verify(`${f.label} — its backup ${f.backup} could not be written (${why}).${after} No kit file was written: the ` +
                `whole kit, this file included, was left as it was, and the ${made} complete backup(s) made before this one ` +
                `(listed above) were kept. Fix the cause and re-run with --backup-edited-kit, or restore the edited files first.`);
            return false;
        };
        if (f.linkTarget !== undefined) {
            // symlink(2) makes the whole link or nothing, and refuses a name that exists.
            try {
                symlinkSync(f.linkTarget, f.backup);
            }
            catch (err) {
                return failed(errCode(err));
            }
        }
        else {
            const staging = kitBackupStaging(f.backup);
            // THE BACKUP KEEPS THE EDITED FILE'S PERMISSION BITS (review IN-03). The copy used to be created with
            // the default mode, so a 0600 file got a world-readable backup. The staging file is created with the
            // edited file's bits and then set to exactly those bits (the process umask narrows a create's mode),
            // before it gets the backup name. A file whose mode could not be read is given 0600, never wider.
            const bits = (f.mode ?? 0o600) & 0o7777;
            try {
                writeFileSync(staging, f.bytes ?? Buffer.alloc(0), { flag: "wx", mode: bits });
            }
            catch (err) {
                // An exclusive create that fails at open(2) created nothing (EEXIST is a file this run did not
                // make). A failure after it (a write or the close) is in a file this call created.
                if (err.syscall === "open")
                    return failed(errCode(err));
                return failed(errCode(err), ` ${discardIncompleteBackup(staging)}`);
            }
            try {
                chmodSync(staging, bits);
            }
            catch (err) {
                return failed(`its permission bits could not be set: ${errCode(err)}`, ` ${discardIncompleteBackup(staging)}`);
            }
            // Give the whole copy its backup name. link(2) refuses a name that exists; where the filesystem
            // has no hard links, rename(2) is used only while the name is still free.
            try {
                try {
                    linkSync(staging, f.backup);
                }
                catch (err) {
                    if (err.code === "EEXIST" || !gone(f.backup))
                        throw err;
                    renameSync(staging, f.backup);
                }
            }
            catch (err) {
                return failed(errCode(err), ` ${discardIncompleteBackup(staging)}`);
            }
            if (!gone(staging)) {
                try {
                    unlinkSync(staging);
                }
                catch (err) {
                    verify(`${shownPath(staging)} — the second name of the backup ${f.backup} could not be removed (${errCode(err)}). ` +
                        `The backup is whole; this name holds the same bytes. Remove it by hand.`);
                }
            }
        }
        made += 1;
        // Recorded once the backup has its name and its second name is gone (plan 33.1-40): a byte backup that
        // still has two names reads as a hard link, which backupContentRecord refuses (recorded null).
        recordBackup(f.backup, "edited-kit-file", f.dest);
        report("backed-up", `${shownPath(f.dest)} → ${shownPath(f.backup)}`);
    }
    return true;
}
// discardIncompleteBackup: remove the incomplete copy backupEditedKitFiles created with an exclusive
// create in this run (red-team W1 of plan 33.1-32). lstat never follows a link; only a regular file
// with one name is removed (anything else is no longer the file this run made). Returns the sentence
// the caller's verify carries: removed, or INCOMPLETE and left under its `.incomplete` name.
function discardIncompleteBackup(path) {
    let why = null;
    try {
        const st = lstatSync(path);
        if (!st.isFile() || st.nlink !== 1)
            why = "it is no longer the single-name regular file this run created";
        else
            unlinkSync(path);
    }
    catch (err) {
        why = errCode(err);
    }
    if (why === null && gone(path))
        return `The incomplete copy this run had started, ${path}, was removed.`;
    if (gone(path))
        return `The incomplete copy this run had started, ${path}, is no longer there.`;
    return (`The incomplete copy this run had started, ${path}, could not be removed (${why ?? "it is still present"}): ` +
        `it is INCOMPLETE, not a full copy of the edit, and its name ends in ${KIT_BACKUP_INCOMPLETE} so that no later ` +
        `run reads it as a backup. Remove it by hand.`);
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
        report("skipped", `${label} (target already has it)`);
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
// seedState: seed the full per-repo state plane from seedRoot()/** into $TARGET, per-file
// skip-if-exists (INSTALL-04, D-01/D-04). DRY_RUN mutates nothing. MIGR-02 (Phase 24): the old
// relay's plans/handoffs/ runtime dir is NO LONGER created — the note-native trace replaces the
// handoff relay, so fresh installs leave plans/handoffs/ absent (a user's accumulated dir is
// backed up by --migrate, never recreated here).
// seedRoot (red-team L2 of plan 33.1-34): the ONE answer to "where does this run's seed come from", for
// the real run and the DRY_RUN preview alike. The real run seeds from the kit it has just copied
// (copyKit runs first, unconditionally, and copies KIT_COPY_SOURCE to KIT_ROOT), so its seed is
// KIT_ROOT/seed. A DRY_RUN copies nothing, so on a first install KIT_ROOT does not exist yet: the
// preview used to read KIT_ROOT/seed, say "no seed subtree", and preview no seed file while the real
// run then wrote nineteen. The preview therefore reads the seed from the source the real run's copy
// would put there, which holds the same bytes the copy would.
function seedRoot() {
    return DRY_RUN ? join(KIT_COPY_SOURCE, "seed") : join(KIT_ROOT, "seed");
}
function seedState() {
    const seed = seedRoot();
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
                ? `${destRel} (target already has it)`
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
            recordCreatedFile(dest, writtenFileRecord(dest, srcRead.bytes));
            report("created", destRel);
        }
    }
}
// writeMarker: write .grugops/install.json. Fields in fixed order: kitVersion (when written),
// grugopsHome, kitRoot, installMode, target, then `ledger`, the ONE install ledger (D-33 (b), plan
// 33.1-36; install-marker.ts states its kinds and their keys), serialized by the one serializer
// (ledgerJson). The install-time timestamp is deliberately OMITTED (RESOLVED Q1, Option b) — overwrite
// unconditionally, idempotent. The previous ledger's entries are carried forward by the rules below, so
// the unconditional overwrite cannot orphan rules, directories or files an earlier run recorded.
//
// A PREVIOUS ENTRY IS CARRIED ONLY WITH PROOF (red-team of plan 33.1-28, R1, brief DC-2). An entry
// names a path; the path can have been deleted and made again by the user since, so its presence is
// not proof. Each kind states what this run must see to carry an entry forward:
//   dir: the directories this run created (CREATED_DIRS), united with the previous ledger's dir entries
//     that were a real, non-empty directory when this run started (START_HELD_DIRS) and are still a
//     real directory now.
//   file, kit false: the files this run created (CREATED_FILES, with what this run wrote), united with
//     the previous ledger's kit-false file entries that still hold exactly their content record
//     (recordHolds) and that this run did not append a block to (APPENDED_FILES). A file the user
//     deleted, edited or replaced since is dropped.
//   file, kit true (plan 33.1-30): in a run that wrote the kit, what this run wrote to each kit file
//     (KIT_FILES), united with the previous ledger's kit-true entries this run did not write that still
//     hold exactly their record (recordHolds). Never by presence: a kit file this run could not write
//     (a directory, a FIFO, a link there) is dropped, and so is one the user edited since.
//   block (plan 33.1-33): the previous ledger's block entries, with this run's APPENDED_BLOCKS over
//     them (install appends only where no grugops block was, so an earlier entry for the same file
//     names a block that is gone). Entries are never added or dropped because of what is in a file
//     now: uninstall checks each record against the file before it removes anything.
//   gemini (plan 33.1-29; phase 34.1 D-12): an earlier install's entry, carried verbatim; see the gemini entry below.
//   ask-rules (D-18): ASK_LEDGER, as writeAskRules() computed it.
//   opencode-permission (phase 34.1, D-14): OPENCODE_LEDGER, as writeOpenCodePermission() decided it, or the earlier
//     entry verbatim when OpenCode is not chosen in this run.
//   backup (plan 33.1-40): the backups this run made (BACKUPS), united with the previous ledger's backup
//     entries whose path still holds something (carriedBackups), each with the content record taken when
//     install made it; only the outermost entries are kept. An entry whose path is gone is dropped.
// One path has at most one file entry: what this run wrote is kept over a carried entry.
//
// A RUN THAT WROTE NO KIT FILE (red-team B1/B2 of plan 33.1-32, brief DC-1/DC-2; plan 34.1-08). Two cases, told
// apart by whether Claude Code is installed here after this run (AGENTS_AFTER holds the `claude-kit` row's id):
//
// CLAUDE CODE IS INSTALLED AFTER THIS RUN. No consent, a pre-flight hazard, a failed backup, a kit-plan refusal, or a
// run that did not choose Claude Code (D-04): the kit in the target is still the one the previous marker describes,
// and this run learned nothing about it that the next run cannot learn again. So every kit field is written back
// from the previous marker, never from this run:
//   the kit-true file entries: carried VERBATIM, exactly as read (with no previous marker there are
//     none, because this run is the whole history and it wrote no kit file). Plan 31's rule for a
//     refused run ("drop only entries proved stale") is replaced: its staleness proof was wrong about a
//     file the user then restored. Dropping is safe only when the kit is written, because then the
//     entry is replaced.
//   kitVersion: the previous string, kept. With none (no previous marker, or a value that is not a
//     string) the field is NOT written: this run has no evidence of the version of the kit in the
//     target, and the kit home's version would be a claim about files it did not write. `--check`
//     warns that the kit version is unknown.
//   kitRoot, grugopsHome, installMode: the previous strings, kept (the adapters in the target still
//     name the previous kit root, and were made in the previous mode). With none, this run's values
//     are written: they are what the next kit write will use, and the doctor's three-source kit-root
//     cross-check (rule, marker, adapter KIT= line) reports any adapter that disagrees.
//
// CLAUDE CODE IS NOT INSTALLED AFTER THIS RUN (plan 34.1-08). No adapter in the target names a kit, so the marker's
// kitRoot is the only route an agent has to the kit (KIT_ROUTE). The kit fields (grugopsHome, kitRoot, installMode)
// are this run's values and kitVersion is read from the kit home exactly as in a run that wrote the kit, so the route
// names the kit home this run copied. The kit-true file entries are still carried verbatim (nextLedgerEntries keys
// that on KIT_WRITTEN alone): a run that wrote no kit file drops no record of one.
//
// A MALFORMED LEDGER IS WRITTEN BACK VERBATIM (WR-05's rule, D-33 (b)). A previous ledger that is
// present but malformed (readLedger) is one `verify` finding naming why, and it is written back exactly
// as found; this run records nothing new in it. Install never replaces a ledger it could not read with
// one that forgets what it recorded.
//
// ONLY INSTALL'S OWN MARKER IS REPLACED, AND EVERY MARKER IS BOUND (red-team B2/B3 of plan 33.1-33,
// brief DC-2). The marker records `target`, the real path of this directory (user-file.ts
// realTargetPath), after installMode. What is at the path now decides the write, by the one reader
// both binaries ask (install-marker.ts readInstallMarker):
//   ok          install's own marker for this directory: carried as described above;
//   absent      a fresh marker;
//   unbound     install's marker shape that is not this directory's record: written for another
//               directory, before markers carried `target`, or before the one ledger (a copied
//               .grugops/, a moved repository, an earlier build): NONE of its records is carried, as if
//               there were no marker, and it is replaced by a marker bound to this directory with the
//               one ledger; a note says so. Carrying it would launder another directory's records into
//               this one's (a copied file entry for README §1's hand-copied AGENTS.md would then remove
//               the user's file);
//   unreadable  not a readable JSON object, or a JSON object that is not install's marker (a user's
//               `{"mine":1}`, `{}`, or one that mixes the one ledger with a retired record): it is never
//               written over. It is left byte for byte, and writeAskRules() has counted a verify for
//               it (exit 3). It used to be replaced, every key lost, and reported
//               `created`.
function writeMarker() {
    const markerRel = ".grugops/install.json";
    const previousMarker = readInstallMarker(TARGET);
    // WR-05: a marker that exists but cannot be read holds records this run cannot see. Overwriting it
    // would forget them, so it is left exactly as it is; writeAskRules() reported the verify finding.
    // D-37 (34.1 review CR-05, IN-33): whatever the read, the marker is still the record of the agents installed here, so
    // the line never calls it "not install's". It words the cause the reader saw (install-marker.ts markerDefectText of the
    // read's defect) and points at the never-remove verify askRulesStep printed.
    if (previousMarker.state === "unreadable") {
        report("skipped", `${markerRel} (left unchanged — ${markerDefectText(previousMarker.defect)}; see the verify line above)`);
        return;
    }
    const here = realTargetPath(TARGET);
    if (here === null) {
        verify(`${markerRel}: the real path of ${TARGET} could not be read, so the marker could not be bound to it and was not written.`);
        return;
    }
    if (previousMarker.state === "unbound") {
        report("note", previousMarker.unboundBy === "other-directory" && previousMarker.boundTo !== null
            ? `${markerRel}: the marker there was written for another directory (${previousMarker.boundTo}), so none of its ` +
                `records was carried; it is replaced by a marker for this directory (${here})`
            : previousMarker.unboundBy === "no-ledger"
                ? `${markerRel}: the marker there has no install ledger (${previousMarker.why}), so none of its records was ` +
                    `carried; it is replaced by a marker for this directory (${here}) with the install ledger. What an earlier ` +
                    `install made here has no record, and uninstall leaves it and says so`
                : `${markerRel}: the marker there was written before install bound its marker to a directory, so none of its ` +
                    `records was carried; it is replaced by a marker for this directory (${here}). What an earlier install made ` +
                    `here has no record, and uninstall leaves it and says so`);
    }
    const previousLedger = readLedger(previousMarker.state === "ok" ? previousMarker.marker : null);
    if (previousLedger.state === "malformed") {
        // D-37 (34.1 review CR-06, plan 34.1-43): the marker is still the record of every agent installed here; the remedy is
        // the owner's never-remove wording (markerFixText), which names the ledger problem and the by-hand fix.
        const remedy = markerRemedy(previousMarker) ?? noMarkerRemedy("writeMarker");
        verify(`${markerRel} — the install ledger is malformed (${previousLedger.why}), so it was written back unchanged and ` +
            `nothing this run did was recorded. Uninstall will remove and edit nothing on it; ` +
            `${markerFixText(remedy)}; then re-run the installer.`);
    }
    // The kit VERSION is read through readUserFile (red-team of plan 33.1-26, DC-3): the kit home and
    // the checkout are user-controlled paths. An absent kit VERSION falls back to the checkout's, as
    // before; any other unread state is a counted verify and the marker records an empty version.
    //
    // A KIT NOT WRITTEN KEEPS ITS VERSION (plan 33.1-32, D-32; red-team B2). When this run wrote no kit
    // file, the target's kit is still at the previous marker's version, so that version is written back
    // and the kit home's is not claimed; `--check` then reports the skew. With no previous string to
    // keep, no version is claimed at all (`ver` null: the field is not written; see the header).
    const prevString = (k) => previousMarker.state === "ok" && typeof previousMarker.marker[k] === "string" ? previousMarker.marker[k] : null;
    const prevVer = prevString("kitVersion");
    // kitFromThisRun (plan 34.1-08): whether the kit fields describe the kit home this run copied. True when this run
    // wrote the Claude Code kit, and also when Claude Code is not installed here after this run (claudeAfter false): then
    // no adapter in the target names a kit, and the marker's kitRoot is the route every agent without an adapter follows
    // (KIT_ROUTE), so it names the kit this run copied, never an earlier run's.
    const claudeAfter = HOST_TOOLS.some((h) => h.adapter === "claude-kit" && AGENTS_AFTER.includes(h.id));
    const kitFromThisRun = KIT_WRITTEN || !claudeAfter;
    let ver = "";
    if (!kitFromThisRun) {
        ver = prevVer;
        report("note", prevVer !== null
            ? `${markerRel}: kitVersion kept at "${prevVer}", because this run wrote no kit file`
            : `${markerRel}: no kitVersion recorded, because this run wrote no kit file and there is no earlier ` +
                `kit version to keep, so the version of the kit files in .claude is not known (install.js --check warns)`);
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
    // The kit fields describe the kit in the target: from this run when it wrote the kit or when Claude Code is not
    // installed here after it, else from the previous marker (see A RUN THAT WROTE NO KIT FILE above). Field order is
    // kept stable.
    const kept = (k, current) => kitFromThisRun ? current : (prevString(k) ?? current);
    // The ledger this write records, computed once (after the mkdirp above, so a .grugops/ it created is recorded): the
    // next entries, or none of this run's when the previous ledger is malformed and is written back raw.
    const nextEntries = previousLedger.state === "malformed" ? null : nextLedgerEntries(previousLedger);
    const knownAfter = AGENTS_AFTER.filter((id) => HOST_TOOLS.some((h) => h.id === id));
    const marker = {
        ...(ver === null ? {} : { kitVersion: ver }),
        grugopsHome: kept("grugopsHome", GRUGOPS_HOME),
        kitRoot: kept("kitRoot", KIT_ROOT),
        installMode: kept("installMode", INSTALL_MODE),
        target: here,
        // D-04 (plan 34.1-06), D-26 (plan 34.1-14), D-31 (plan 34.1-30, IN-26): `agents`, between target and ledger, from
        // the one derivation every marker write that sets the field asks (install-marker.ts agentsToRecord), over the
        // ledger this write records (nextEntries). Install keeps every agent installed before the run and every agent
        // chosen in it (`keep` is AGENTS_AFTER's registry ids, D-04), so a chosen agent whose every write was refused stays
        // recorded for a later `--yes` to retry. It also records again any agent that owns an entry the ledger still holds
        // (`known` adds, in registry order, the owners of every holding entry of nextEntries), so `agents` never
        // contradicts the ledger the marker carries (brief REC-1): a hand edit, or a marker written by the unreleased
        // round-0 uninstall, can leave such an agent out. For a shared entry with no owner in `keep` (the agent skill
        // Codex CLI and Antigravity CLI share) every owner is recorded: the ledger cannot tell which one install wrote it
        // for (install-marker.ts WHY A RECORDED FIELD), and recording both keeps the file removable per agent. A malformed
        // previous ledger is written back raw (nextEntries is null), so no owner is added from it.
        agents: agentsToRecord({
            known: HOST_TOOLS.filter((h) => knownAfter.includes(h.id) || (nextEntries ?? []).some((e) => entryHolds(e) && entryOwners(e).includes(h.id))).map((h) => h.id),
            keep: knownAfter,
            unknown: AGENTS_AFTER.filter((id) => !knownAfter.includes(id)),
            entries: nextEntries ?? [],
        }),
    };
    if (previousLedger.state === "malformed") {
        marker.ledger = previousLedger.raw;
    }
    else {
        marker.ledger = ledgerJson(nextEntries ?? []);
    }
    if (writeTargetFile(markerPath, JSON.stringify(marker, null, 2) + "\n", markerGate.state, markerRel)) {
        report("created", ".grugops/install.json (marker)");
    }
}
// nextLedgerEntries: the entries writeMarker records, from this run's maps and the previous `ok` (or
// absent) ledger, by the carry rules in writeMarker's header. Computed after writeMarker's mkdirp, so a
// .grugops/ that call created is recorded too.
function nextLedgerEntries(previous) {
    const out = [];
    // dir
    const dirs = new Set(CREATED_DIRS);
    for (const e of entriesOfKind(previous, "dir")) {
        if (!START_HELD_DIRS.has(e.path))
            continue; // empty, gone or not a real directory at the start: no proof
        if (directoryComponent(join(TARGET, ...e.path.split("/"))) === "fine")
            dirs.add(e.path);
    }
    for (const path of dirs)
        out.push({ path, kind: "dir" });
    // file: what this run wrote first, then the carried entries for paths it did not write.
    const files = new Map();
    for (const [path, content] of CREATED_FILES)
        files.set(path, { path, kind: "file", content, kit: false });
    if (KIT_WRITTEN)
        for (const [path, content] of KIT_FILES)
            if (!files.has(path))
                files.set(path, { path, kind: "file", content, kit: true });
    const holds = (e) => recordHolds(TARGET, join(TARGET, ...e.path.split("/")), e.content);
    for (const e of entriesOfKind(previous, "file")) {
        if (files.has(e.path))
            continue;
        if (e.kit) {
            // A run that wrote no kit file carries every kit entry verbatim; one that wrote the kit carries an
            // entry it did not write only while it still holds its record.
            if (!KIT_WRITTEN || holds(e))
                files.set(e.path, e);
        }
        else if (!APPENDED_FILES.has(e.path) && holds(e)) {
            files.set(e.path, e);
        }
    }
    out.push(...files.values());
    // block
    const blocks = new Map(entriesOfKind(previous, "block").map((e) => [e.path, { block: e.block, separator: e.separator }]));
    for (const [path, record] of APPENDED_BLOCKS)
        blocks.set(path, record);
    for (const [path, b] of blocks)
        out.push({ path, kind: "block", block: b.block, separator: b.separator });
    // gemini (plan 33.1-29; phase 34.1 D-12). Install no longer reads or writes .gemini/settings.json, so this run
    // learned nothing about the file and changed nothing in it. An earlier install's gemini entry (a created file or an
    // appended AGENTS.md entry) is therefore carried VERBATIM, field for field: that is not a carry by presence, because
    // no read here could prove or disprove the record, and only uninstall acts on it (it edits or deletes the file only
    // while the file still holds what the entry records, uninstall.ts unmergeGemini). A ledger with no gemini entry,
    // and a fresh marker, get none.
    const prevGemini = entryAt(previous, GEMINI_SETTINGS_REL, "gemini");
    if (prevGemini !== undefined)
        out.push(geminiEntry(prevGemini));
    // ask-rules (D-18): what writeAskRules() computed (null: no entry). When writeAskRules did not run (Claude Code is not
    // chosen in this run, plan 34.1-08), this run read and wrote nothing in .claude/settings.json and learned nothing
    // about it, so an earlier install's ask-rules entry is carried VERBATIM, as the gemini entry above is: an agent not
    // named keeps its record (D-04), and only uninstall acts on it.
    if (ASK_RULES_RAN) {
        if (ASK_LEDGER !== null)
            out.push(askRulesEntry(ASK_LEDGER));
    }
    else {
        const prevAsk = entryAt(previous, ASK_RULES_REL, "ask-rules");
        if (prevAsk !== undefined)
            out.push(askRulesEntry(prevAsk));
    }
    // opencode-permission (phase 34.1, D-14): what writeOpenCodePermission() decided (null: no entry). When it did not run
    // (OpenCode is not chosen in this run), this run read and wrote nothing in opencode.json, so an earlier install's entry
    // is carried VERBATIM, as the ask-rules entry above is (D-04).
    if (OPENCODE_RAN) {
        if (OPENCODE_LEDGER !== null)
            out.push(opencodePermissionEntry(OPENCODE_LEDGER));
    }
    else {
        const prevOpenCode = entryAt(previous, OPENCODE_CONFIG_REL, "opencode-permission");
        if (prevOpenCode !== undefined)
            out.push(opencodePermissionEntry(prevOpenCode));
    }
    // backup (plan 33.1-40): the previous ledger's backup entries whose path still holds something
    // (carriedBackups), with this run's BACKUPS over them, outermost only. A carried entry keeps its own
    // content record: prune compares the backup with what install recorded when it made it, never with what
    // is there now.
    const backups = new Map(carriedBackups(previous, TARGET).map((e) => [e.path, e]));
    for (const [path, e] of BACKUPS)
        backups.set(path, e);
    out.push(...outermostBackups([...backups.values()]));
    return out;
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
//     by hand — prune removes only backups install recorded, never a live kit (WR-01) — else report
//     already-migrated. Either way exit 0.
//   - isOldLayout → the pre-check first (the config carry and the whole kit plan; any refusal and
//     nothing is migrated, exit 3), then migratePreSteps() (config-move + in-repo-kit backup), then
//     FALL THROUGH into the existing install run (which copies the fresh kit, D-01).
//   - isClean (or anything else) → FALL THROUGH into the existing install run unchanged (D-11).
//
// START_HELD_DIRS (red-team of plan 33.1-28, R1, brief DC-2) is taken HERE, before this run's first
// change to the target (the --migrate pre-steps below are the earliest). It is the set of the previous
// ledger's dir entries that are, right now, a real directory (not a link, nothing but real
// directories on the way) holding at least one entry. writeMarker() carries a previous dir
// entry forward only when it is in this set. Install never leaves a directory it created empty, so
// one found empty at the start of a run was emptied, or deleted and made again, since the record was
// written; nothing is left to show it is still the directory install created, so the entry is
// dropped and uninstall leaves the directory (the safe direction). Taken later in the run, the answer
// would count what this run itself wrote into the directory.
//
// PREVIOUS_LEDGER (plan 33.1-37 Task 4) is the same read, kept: the target's install ledger as this run found
// it, before any change. kitDestDecision asks it (carriedKitRecord) whether an identical kit file is a carry.
// PREVIOUS_MARKER_READ (plan 34.1-06) is the one read of the marker both come from: the installed set (INSTALLED_BEFORE
// below) and the ledger are answered from the same bytes.
const PREVIOUS_MARKER_READ = readInstallMarker(TARGET);
const PREVIOUS_LEDGER = readLedger(PREVIOUS_MARKER_READ.state === "ok" ? PREVIOUS_MARKER_READ.marker : null);
const START_HELD_DIRS = (() => {
    const held = new Set();
    const ledger = PREVIOUS_LEDGER;
    for (const { path: rel } of entriesOfKind(ledger, "dir")) {
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
// --- which agents this run is for (phase 34.1, D-03, D-04) ---------------------------------------------------------
// THE CHAIN, first match wins:
//   1. the agents named by flag (SELECTED_BY_FLAG, D-01);
//   2. the agents installed here before this run, as the one derivation answers it (install-marker.ts
//      installedAgents over PREVIOUS_MARKER_READ and PREVIOUS_LEDGER: recorded in the marker's `agents` field);
//   3. the agents detected in the target (detectedHosts: each registry row's `detect` path is present);
//   4. none of these: refuseSelection, which exits 1 before the run banner and before any write in the target or the
//      kit home, naming every per-agent flag. An empty repository is never installed for every agent by default.
// Computed HERE, after the read-only guards and before the --migrate branch, whose pre-steps are this run's first
// change.
// AT A TERMINAL (D-02, plan 34.1-12): with standard input and standard output both terminals, no agent flag and no
// `--yes`, steps 2 to 4 are replaced by the checkbox list (pickAgents over agent-picker.ts pickerRows): every registry
// agent, the installed (step 2) and detected (step 3) ones pre-checked and labelled why. The checked agents are chosen
// "chosen at the prompt". A cancelled list (Ctrl-C or end of input) and an empty confirmed list both refuse through
// refuseSelection, exit 1, before anything is written.
// Each chosen agent carries the reason it was chosen; the run banner prints both (research Pitfall 7), so a
// detection-driven choice is visible.
const INSTALLED_BEFORE = installedAgents(PREVIOUS_MARKER_READ, PREVIOUS_LEDGER);
const INSTALLED_IDS_BEFORE = INSTALLED_BEFORE.ids;
// refuseSelection: THE ONE EXIT for every selection refusal (D-03; the checkbox list of plan 34.1-12 reuses it). One
// stderr sentence, `why` followed by every per-agent flag, derived from the registry, then exit 1. Nothing has been
// written when it runs.
function refuseSelection(why) {
    const flags = HOST_TOOLS.map(agentFlag);
    // The example is built by agentCommand (host-tools.ts), the one builder of a printed command that names agents (D-26,
    // brief MSG-1), for the first registry row, with this run's target.
    process.stderr.write(`install.js: ${why} Name the agents to install for with one or more of: ${flags.join(", ")}, for example ` +
        `\`${agentCommand("install.js", TARGET, [HOST_TOOLS[0]], COMMAND_CONTEXT)}\`.\n`);
    process.exit(1);
}
const SELECTION_WHY = (() => {
    const why = new Map();
    if (SELECTED_BY_FLAG.size > 0) {
        for (const h of HOST_TOOLS)
            if (SELECTED_BY_FLAG.has(h.id))
                why.set(h.id, "named by flag");
        return why;
    }
    if (!YES && process.stdin.isTTY && process.stdout.isTTY) {
        const detectedIds = new Set(detectedHosts().map((h) => h.id));
        const list = pickerRows(HOST_TOOLS, new Set(INSTALLED_IDS_BEFORE), detectedIds);
        const answer = pickAgents(list.rows, list.checked);
        if (answer === null)
            return refuseSelection("the agent list was cancelled, so nothing was installed.");
        HOST_TOOLS.forEach((h, i) => {
            if (answer[i] === true)
                why.set(h.id, "chosen at the prompt");
        });
        if (why.size > 0)
            return why;
        return refuseSelection("no agent was checked at the agent list, so nothing was installed.");
    }
    if (INSTALLED_BEFORE.ids.length > 0) {
        // A legacy install (a marker written before this phase, with a usable ledger and no `agents` field) counts as the
        // hosts of install-marker.ts LEGACY_ADAPTER_KINDS (D-23); the reason names them from the registry, so the banner
        // says on every such run that the choice came from that rule.
        const legacyNames = HOST_TOOLS.filter((h) => INSTALLED_IDS_BEFORE.includes(h.id)).map((h) => h.shortName);
        const legacyList = legacyNames.length > 1 ? `${legacyNames.slice(0, -1).join(", ")} and ${legacyNames[legacyNames.length - 1]}` : legacyNames.join("");
        const reason = INSTALLED_BEFORE.source === "legacy" ? `installed before this release (${legacyList}; see "Which agents an unattended install is for" in install/README.md)` : `recorded in ${MARKER_REL}`;
        for (const id of INSTALLED_BEFORE.ids)
            why.set(id, reason);
        return why;
    }
    for (const h of detectedHosts())
        why.set(h.id, `detected: ${h.detect}`);
    if (why.size > 0)
        return why;
    return refuseSelection(`no agent was named, none is recorded in ${MARKER_REL} and none was detected in the target ${TARGET}, so ` +
        `nothing was installed.`);
})();
/** The agents this run installs for, in registry order (D-03). */
const SELECTION = HOST_TOOLS.filter((h) => SELECTION_WHY.has(h.id));
// AGENTS_AFTER (D-04): install's `keep` input to install-marker.ts agentsToRecord, which gives the `agents` field
// writeMarker records (D-26, plan 34.1-14). The registry-ordered union of the agents installed before this run and the
// agents chosen in it, followed by the recorded ids the registry does not know, verbatim: install only adds, so naming
// fewer agents never removes one from the record, and an unknown id is kept, never acted on. Because install keeps
// every recorded agent (D-04), a chosen agent whose every write was refused stays recorded and a later `--yes`
// re-chooses it: the field means "chosen and not yet removed", as install-marker.ts THE `agents` FIELD and
// install/README.md "Which agents an unattended install is for" say (D-26).
const AGENTS_AFTER = [
    ...HOST_TOOLS.filter((h) => INSTALLED_IDS_BEFORE.includes(h.id) || SELECTION.includes(h)).map((h) => h.id),
    ...(INSTALLED_BEFORE.source === "recorded" ? INSTALLED_BEFORE.unknown : []),
];
// SELECTED_KINDS (plan 34.1-08, D-06, D-10): the adapter kinds of the agents this run is for. THE ONE GATE of every
// per-agent write below: the Claude Code kit (skills and adapters), the CLAUDE.md start-here block and the Claude Code
// ask rules only for `claude-kit`; the Copilot pointer block only for `copilot-pointer`; each whole-file entry only for
// the kinds whose ROUTE_POINTERS name it (wholeFileEntryRels(SELECTION)). The shared footprint (the kit home, AGENTS.md
// by its own rules, the seeded state, tools/grugops/ and the marker) is written whatever is chosen. An agent not chosen
// in this run is never written to and never removed from (D-04): its files are left as they are, and its ledger
// entries are carried by nextLedgerEntries' rules.
const SELECTED_KINDS = new Set(SELECTION.map((h) => h.adapter));
// MIGRATE_KIT_PLAN: the kit plan a --migrate over an old layout built before any migration step. The
// install run below executes it instead of building a second one (there is one render per run).
let MIGRATE_KIT_PLAN = null;
// MIGRATE_KIT_WRITE: that run's KIT_WRITE decision (D-32, plan 33.1-32), taken in the pre-check so a
// kit the human did not consent to refuses the whole migration, and so the prompt is asked once.
let MIGRATE_KIT_WRITE = null;
if (MIGRATE) {
    // THE MIGRATE SAME-RUN COMMAND (phase 34.1 gap round 2, D-31, DI-09; D-33). Both migrate INCOMPLETE banners (the
    // pre-check's and the already-migrated arm's) print this line, built once here: running --migrate again for the
    // agents this run chose, by migrateCommand (agentCommand with this run's context: the absolute script path, and this
    // run's kit home, install mode and kit checkout stated as GRUGOPS_HOME, INSTALL_MODE and GRUGOPS_SRC, D-38; no printed
    // command carries `--symlink`). A pre-check refusal changes nothing, so the
    // target is still the old layout and this command, run as printed once the cause is fixed, migrates it whole. Before,
    // the banner said only "re-run --migrate", and a flag-less --migrate over an old layout with no marker chooses its
    // agents by detection, which may not be the agents this run named. Printed under DRY_RUN too.
    const MIGRATE_AGAIN_LINE = `  Once each is fixed, \`${migrateCommand()}\` runs ` +
        `--migrate again for the same agents (add any other option this run was given).`;
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
        // The kit plan and its KIT_WRITE decision only when Claude Code is chosen (plan 34.1-08, D-06): a --migrate for
        // other agents writes no Claude Code kit file, so it neither builds a kit plan nor asks for kit consent; the
        // config carry and the in-repo kit backup run as they always did.
        const refusals = [...carry.refusals];
        if (SELECTED_KINDS.has("claude-kit")) {
            MIGRATE_KIT_PLAN = buildKitPlan();
            if (!MIGRATE_KIT_PLAN.ok)
                refusals.push(...MIGRATE_KIT_PLAN.refusals);
            if (refusals.length === 0 && MIGRATE_KIT_PLAN.ok) {
                MIGRATE_KIT_WRITE = kitWriteDecision(MIGRATE_KIT_PLAN);
                if (MIGRATE_KIT_WRITE.go === "no")
                    refusals.push(...MIGRATE_KIT_WRITE.verifies);
            }
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
            console.log(MIGRATE_AGAIN_LINE);
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
    const handoffsBackedUp = migrateHandoffs();
    if (layout.isMigrated) {
        // Plan 33.1-40: this arm writes no marker, so the backup it may have made is recorded here.
        const handoffsRecorded = recordBackupsInMarker();
        // THE CLOSING (plan 34-26, D-25, the 27-13 class rule): built from what this arm did (the handoffs
        // backup, its record, DRY_RUN) and chosen on the same branch as the exit status from VERIFY_FINDINGS.
        // A no-change sentence is printed only when this run changed nothing.
        if (VERIFY_FINDINGS > 0) {
            console.log(`\n== migrate INCOMPLETE — ${VERIFY_FINDINGS} item(s) need verification` +
                `${DRY_RUN ? " (DRY_RUN — nothing changed)" : ""} ==`);
            console.log(MIGRATE_AGAIN_LINE);
        }
        else {
            console.log(layout.leftoverKit
                ? "This repo is already migrated to the two-root layout, but a leftover LIVE in-repo agent-factory/ remains."
                : "This repo is already migrated to the two-root layout.");
            if (handoffsBackedUp && DRY_RUN) {
                console.log("DRY_RUN: this run would back up plans/handoffs/ (see the would-backup line above). Nothing was changed.");
            }
            else if (handoffsBackedUp) {
                const made = [...BACKUPS.values()].find((e) => e.origin === "handoffs");
                const where = made === undefined ? "(see the backed-up line above)" : `to ${made.path}`;
                console.log(`This run backed up plans/handoffs/ ${where} and ` +
                    (handoffsRecorded
                        ? `recorded the backup in ${MARKER_REL}.`
                        : `did not record the backup in ${MARKER_REL} (see the note above); uninstall and --prune-old-kit leave it.`));
            }
            if (layout.leftoverKit) {
                console.log(`${handoffsBackedUp ? "" : "Nothing was changed. "}Once you have confirmed the shared kit at ${GRUGOPS_HOME} is in use,`);
                console.log("back up and remove the leftover agent-factory/ by hand — prune removes only the backups install");
                console.log("recorded making, never a live kit, so it cannot clear this one.");
            }
            else if (!handoffsBackedUp) {
                console.log("Nothing to do.");
            }
        }
        process.exit(VERIFY_FINDINGS > 0 ? 3 : 0);
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
console.log(`agents: ${SELECTION.map((h) => `${h.name} (${SELECTION_WHY.get(h.id)})`).join(", ")}`);
// A recorded id the registry does not know (a later build's agent, or a hand edit) is kept in the record and never
// acted on (T-34.1-10); the run says so.
if (INSTALLED_BEFORE.source === "recorded" && INSTALLED_BEFORE.unknown.length > 0) {
    report("note", `${MARKER_REL} records ${INSTALLED_BEFORE.unknown.map((id) => JSON.stringify(id)).join(", ")}, which this build does ` +
        `not know as an agent: install neither installs nor removes anything for ${INSTALLED_BEFORE.unknown.length > 1 ? "them" : "it"} ` +
        `and keeps ${INSTALLED_BEFORE.unknown.length > 1 ? "them" : "it"} in the record`);
}
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
                skills.push({ dest, label, kind: "materialize", src, text: transformAdapter(read.text, KIT_ROOT).text });
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
            // ...AND THE SAME CHECK FOR THE EFFORT DIAL, AT THE SAME SITE (plan 34-15, D-20, RC-1). The
            // effort announcement carries its own member count, and it is held to the same derived listing.
            if (announced.effort.roles !== rendered.length) {
                refusals.push(`.claude/agents/ — the render announced an effort resolution covering ` +
                    `${announced.effort.roles} role(s), while this run derived ${rendered.length} rendered ` +
                    `adapter(s) from the render's own output directory. The two numbers must agree: a run ` +
                    `installing over a disagreement would be installing a set it cannot vouch for.\n` +
                    `                 No adapter was installed and every pre-existing target adapter was left ` +
                    `as it was. The model configuration this run reads is ${targetConfigFile}.`);
                return;
            }
            // THE ALIAS AND THE EFFORT LEVEL EVERY RENDERED ADAPTER CARRIES, READ OUT OF BOTH ITS TEXTS — THE
            // RENDER AND THE TEXT ABOUT TO BE WRITTEN — for ALL members before any write: a refusal on the
            // last member still leaves the target untouched. Each value is compared with the value the
            // generator announced for that adapter (plan 34-20, D-22, D-24), so a line the generator wrote
            // wrong (case B) and a line the transform dropped or changed (case A) are both refused by name.
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
                const transformed = transformAdapter(text, KIT_ROOT);
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
                // BOTH DIALS, READ OUT OF BOTH TEXTS (plan 34-20, D-22, D-24, RC-1). The render is what the
                // generator wrote; the transformed text is what the plan entry below carries and what the
                // write phase writes, so this is the last point at which a dropped, duplicated or changed
                // `model:` or `effort:` line can be seen before it reaches the target. The floors hold on
                // both texts, each its own named refusal, the render's first.
                const renderedDials = readRenderedDials(text, label, "rendered");
                const writtenDials = readRenderedDials(transformed.text, label, "written");
                if (!renderedDials.ok || !writtenDials.ok) {
                    for (const reason of [
                        ...(renderedDials.ok ? [] : renderedDials.reasons),
                        ...(writtenDials.ok ? [] : writtenDials.reasons),
                    ]) {
                        refusals.push(`.claude/agents/ — ${reason}\n` +
                            `                 No adapter was installed and every pre-existing target adapter was ` +
                            `left as it was.`);
                    }
                    memberRefused = true;
                    continue;
                }
                // EACH TEXT'S VALUES AGAINST THE VALUES THE GENERATOR ANNOUNCED FOR THIS ADAPTER, BOTH DIALS,
                // through the one comparison (dialDisagreements says what each comparison catches). The
                // adapter's name in the announced map is its rendered file name without `.md`.
                const disagreements = dialDisagreements(label, f.slice(0, -".md".length), [
                    { which: "rendered", alias: renderedDials.alias, effort: renderedDials.effort },
                    { which: "written", alias: writtenDials.alias, effort: writtenDials.effort },
                ], announced);
                if (disagreements.length > 0) {
                    for (const reason of disagreements) {
                        refusals.push(`.claude/agents/ — ${reason}\n` +
                            `                 No adapter was installed and every pre-existing target adapter was ` +
                            `left as it was.`);
                    }
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
                    alias: writtenDials.alias,
                });
            }
            if (memberRefused)
                return;
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
    const relOf = (dest) => canonicalPathSpelling(relative(TARGET, dest));
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
// The Claude Code kit is written only when Claude Code is chosen (plan 34.1-08, D-06, D-10): otherwise no kit plan is
// built, KIT_WRITTEN stays false, and every file already in .claude/ is left as it is (D-04).
if (!SELECTED_KINDS.has("claude-kit")) {
    report("skipped", "Claude Code skills and adapters (Claude Code is not chosen in this run; every file already in .claude/ is left as it is)");
}
else {
    const kitPlan = MIGRATE_KIT_PLAN ?? buildKitPlan();
    if (kitPlan.ok) {
        // KIT_WRITE (D-32, plan 33.1-32): the one decision, taken once. A --migrate over an old layout
        // took it in its pre-check (the prompt is never asked twice).
        const go = MIGRATE_KIT_WRITE ?? kitWriteDecision(kitPlan);
        if (go.go === "no") {
            for (const why of go.verifies)
                verify(why);
            report("kit", `no skill or adapter was written, linked or unlinked: the kit is written whole or not at all, and ` +
                `every kit file already in ${join(TARGET, ".claude")} was left exactly as it was. Resolve each verify above and re-run.`);
        }
        else if (go.go === "write" || backupEditedKitFiles(go.files)) {
            KIT_WRITTEN = true;
            executeKitPlan(kitPlan);
        }
        else {
            report("kit", `no skill or adapter was written, linked or unlinked: a backup failed, and no kit file is written until every ` +
                `edited file is backed up. Every kit file in ${join(TARGET, ".claude")} was left exactly as it was.`);
        }
    }
    else {
        for (const why of kitPlan.refusals)
            verify(why);
        report("kit", `no skill or adapter was written, linked or unlinked: ${kitPlan.refusals.length} refusal(s) above ` +
            `were found before the first kit write, and the kit is written whole or not at all. ` +
            `Every kit file already in ${join(TARGET, ".claude")} was left exactly as it was. Resolve each ` +
            `verify above and re-run.`);
    }
}
// The flat-directory contract, refused BY NAME rather than silently skipped (T-27-62). See
// srcNestedAdapterFiles() for why the install set stays flat while the platform recurses. A Claude Code adapter, so it
// is asked only when Claude Code is chosen (plan 34.1-08): a run that installs no adapter refuses none.
for (const rel of SELECTED_KINDS.has("claude-kit") ? SRC_NESTED_ADAPTERS : []) {
    verify(`.claude/agents/${rel} — the adapter directory is FLAT BY CONTRACT, so this nested adapter was ` +
        `NOT installed. Claude Code would load it from a nested path, which is exactly why it is ` +
        `refused here by name instead of skipped. Move it to the top level of the adapter directory.`);
}
// THE CYCLE, UNREADABLE AND WORK-BOUND ARMS of the nested walk are kit-plan refusals since the
// red-team fixes of plan 33.1-31 (see buildKitPlan): each leaves the kit source not fully examined,
// so it refuses the whole kit before the first write.
// AGENTS.md is never written when the target has one of the user's. "Has one" is a regular file
// (readForWrite `ok`) or the link a --symlink install made to the checkout's AGENTS.md. Red-team of plan
// 33.1-26: it used to be existsSync, so a FIFO or a directory there read as "has one", and a dangling link
// read as "has none" and reached linkOrCopy. Nothing there → linkOrCopy; anything else → verify.
//
// THE REFRESH (plan 34-28, D-26 point 2, brief DC-2; plan 34-34, D-27 point 3): a regular file goes to
// refreshOwnFile, which asks refreshable (the kit's current text is carrierWant's: the kit source's AGENTS.md read
// through readUserFile; nothing to refresh to when that read is not ok). It is replaced only when PREVIOUS_LEDGER's
// `file` entry for it still holds as a `sha256:` record, that is, a copy install created in an earlier run and
// nobody edited since; a user's own AGENTS.md, or install's edited since, is never written, and install's route-note pass (noteStrandingCarriers, after the last carrier write) names it when it
// carries no kit route and that leaves a host without one (D-26 point 3, D-27 point 2). Install's own link (--symlink) is current by construction and is never refreshed.
{
    const agentsSrc = join(GRUGOPS_SRC, "AGENTS.md");
    const agentsDest = join(TARGET, "AGENTS.md");
    const agentsRead = isOwnLink(agentsDest, agentsSrc) ? null : readForWrite(TARGET, agentsDest);
    // installWouldWrite (phase 34.1, D-15) over the step's own read: the one owner the doctor asks too.
    const agentsWrite = agentsRead === null ? null : installWouldWrite(PREVIOUS_LEDGER, "AGENTS.md", agentsRead);
    if (agentsRead === null || agentsWrite === null) {
        report("skipped", "AGENTS.md (target already has one — left untouched)");
    }
    else if (agentsRead.state === "ok") {
        if (refreshOwnFile(agentsWrite, "AGENTS.md", "AGENTS.md") === "left") {
            report("skipped", "AGENTS.md (target already has one — left untouched)");
        }
    }
    else if (agentsRead.state === "blocked") {
        // Phase 34.1, D-16 (WR-16): a link the ledger records as one a --symlink install made gets linkOwnership's reason
        // and remedy (remove the link, re-run install.js), the ones the doctor prints, never "a link it did not create".
        const why = agentsWrite.act === "none" ? agentsWrite.why : blockedAt(agentsRead, agentsDest);
        verify(`AGENTS.md: ${blockedWriteText(PREVIOUS_LEDGER, "AGENTS.md", why)}. It was left untouched and nothing was copied to it.`);
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
// The block carriers, each only for its own agent (plan 34.1-08, D-06): CLAUDE.md's start-here block for Claude Code,
// the Copilot pointer block for Copilot. A carrier of an agent not chosen is neither read nor written here (D-04); an
// earlier install's block entry for it is carried by nextLedgerEntries.
if (SELECTED_KINDS.has("claude-kit")) {
    ensureBlock(PREVIOUS_LEDGER, "CLAUDE.md", CLAUDE_PTR, "CLAUDE.md start-here pointer");
}
else {
    report("skipped", "CLAUDE.md start-here pointer (Claude Code is not chosen in this run; CLAUDE.md is left as it is)");
}
// Phase 34.1, D-12: install no longer reads, creates or edits .gemini/settings.json (Gemini CLI is discontinued). An
// earlier install's gemini ledger entry is carried verbatim by nextLedgerEntries, and only uninstall acts on it.
if (SELECTED_KINDS.has("copilot-pointer")) {
    ensureBlock(PREVIOUS_LEDGER, COPILOT_REL, COPILOT_PTR, `${COPILOT_REL} (optional Copilot pointer)`);
}
// Every whole-file entry of the chosen agents (phase 34.1, plans 34.1-01 and 34.1-08): the derived set, in registry
// order. An entry two chosen agents share is written once.
for (const rel of wholeFileEntryRels(SELECTION))
    writeWholeFileEntry(PREVIOUS_LEDGER, rel);
// The route-note pass, once, after every carrier write (plan 34-33): it only reads and reports.
noteStrandingCarriers();
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
//
// THE OUTCOME (plan 34-25, D-25, review WR-12). writeAskRules returns what THIS run did with ask rules,
// as an AskRulesOutcome, on every exit; its declared return type makes an exit without one a compile
// error. The closing `-- notes --` block reads only that outcome (askRulesNotes), never ASK_LEDGER or
// VERIFY_FINDINGS: ASK_LEDGER is set before the DRY_RUN return and in the arms that add nothing, and
// VERIFY_FINDINGS counts the whole run. Only the `written` outcome may say this run added rules.
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
// The ask-rules entry writeMarker() records, or null for none. A malformed install ledger is written
// back verbatim by writeMarker() itself (WR-05), so no entry of it is computed here.
let ASK_LEDGER = null;
// ASK_RULES_RAN (plan 34.1-08, D-06): true once writeAskRules ran in this run, that is, when Claude Code is chosen.
// nextLedgerEntries records ASK_LEDGER only then; otherwise it carries the previous ask-rules entry verbatim (D-04).
let ASK_RULES_RAN = false;
const ASK_REFUSED = { kind: "refused" };
function writeAskRules() {
    const rel = ".claude/settings.json";
    const file = join(TARGET, ".claude", "settings.json");
    report("note", "these ask rules are a speed bump for the usual command spellings, not a security boundary; " +
        "the git host is the hard floor (install/README.md §5)");
    // FAIL CLOSED ON THE LEDGER (WR-05), exactly as uninstall does. Without a readable ledger this run
    // cannot tell a rule an earlier install added from the user's own identical rule, so it adds no
    // rule, relabels none, and leaves the ledger as it found it. A ledger with no ask-rules entry, or no
    // marker at all, is not a defect: nothing was recorded.
    // The remedy is install-marker.ts markerFixText of markerRemedy's answer (D-37, 34.1 review CR-05): whatever the
    // read, the marker is fixed by hand and never removed. "this run uses none of its records" is the uninstaller's
    // wording (34.1 review IN-33): the sentence claims nothing about the ledger that markerFixText contradicts.
    const previousMarker = readInstallMarker(TARGET);
    if (previousMarker.state === "unreadable") {
        const remedy = markerRemedy(previousMarker) ?? noMarkerRemedy("writeAskRules");
        verify(`.grugops/install.json ${markerUnusableText(previousMarker)}, so this run uses none of its records — no ask rule ` +
            `was added to ${rel} and the marker was left as it was. ${markerFixText(remedy)}; then re-run the installer.`);
        return ASK_REFUSED;
    }
    const previousRead = readLedger(previousMarker.state === "ok" ? previousMarker.marker : null);
    if (previousRead.state === "malformed") {
        // D-37 (34.1 review CR-06, plan 34.1-43): the owner's never-remove wording, as writeMarker's verify prints it.
        const remedy = markerRemedy(previousMarker) ?? noMarkerRemedy("writeAskRules");
        verify(`${rel} — the install ledger in .grugops/install.json is malformed (${previousRead.why}), so no ask rule was ` +
            `added and the ledger is written back unchanged. ${markerFixText(remedy)}` +
            `; then re-run the installer.`);
        return ASK_REFUSED;
    }
    const previous = entryAt(previousRead, ASK_RULES_REL, "ask-rules") ?? null;
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
        return ASK_REFUSED;
    }
    const exists = settingsRead.state === "ok";
    if (settingsRead.state === "ok") {
        doc = readJsonText(settingsRead.bytes);
        if (!doc.ok) {
            verify(`${rel} ${doc.why} — left untouched; no ask rule was written. Fix the file and re-run the installer.`);
            ASK_LEDGER = unclaimed(null);
            return ASK_REFUSED;
        }
        const parsed = documentValue(doc);
        const permsAt = memberNamed(doc.root, "permissions");
        if (keyCount(doc.root, "permissions") > 1 || (permsAt !== null && keyCount(permsAt.value, "ask") > 1)) {
            verify(`${rel} has more than one "permissions" or "permissions.ask" key, so which one Claude Code reads is not ` +
                `known — left untouched; no ask rule was written. Fix the file and re-run the installer.`);
            ASK_LEDGER = unclaimed(null);
            return ASK_REFUSED;
        }
        if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
            verify(`${rel} is not a JSON object — left untouched; no ask rule was written. Fix the file and re-run the installer.`);
            ASK_LEDGER = unclaimed(null);
            return ASK_REFUSED;
        }
        json = parsed;
        if (Object.prototype.hasOwnProperty.call(json, "permissions")) {
            const p = json.permissions;
            if (p === null || typeof p !== "object" || Array.isArray(p)) {
                verify(`${rel} has a "permissions" value that is not an object — left untouched; no ask rule was written.`);
                ASK_LEDGER = unclaimed(null);
                return ASK_REFUSED;
            }
            permissions = p;
            if (Object.prototype.hasOwnProperty.call(permissions, "ask")) {
                if (!Array.isArray(permissions.ask)) {
                    verify(`${rel} has a "permissions.ask" value that is not an array — left untouched; no ask rule was written.`);
                    ASK_LEDGER = unclaimed(null);
                    return ASK_REFUSED;
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
    // leftTotal and loweredUsers feed the `none-wanted` outcome (D-25): what is still there when no rule
    // is wanted, counted from the same `present`/`prevAdded` sets the `left` lines use.
    let leftTotal = 0;
    let loweredUsers = 0;
    // The agents that own the ask-rules entry (entryOwners, the one ownership answer), so the `left` line's remedy names
    // their per-agent uninstall (agentCommand, D-26, brief MSG-1) and never a flag-less one, which removes every agent.
    const askRuleOwners = HOST_TOOLS.filter((h) => entryOwners({ path: ASK_RULES_REL, kind: "ask-rules" }).includes(h.id));
    for (const checkpoint of ASK_RULE_CHECKPOINTS) {
        if (toWrite.includes(checkpoint))
            continue;
        const left = askRulesFor(checkpoint).filter((r) => present.has(r) && prevAdded.has(r)).length;
        leftTotal += left;
        loweredUsers += askRulesFor(checkpoint).filter((r) => present.has(r) && !prevAdded.has(r)).length;
        if (left > 0) {
            report("left", `${left} ask rule(s) an earlier install added for ${checkpoint} remain in ${rel}; the installer never ` +
                `removes a rule — delete them by hand, or \`${agentCommand("uninstall.js", TARGET, askRuleOwners, COMMAND_CONTEXT)}\` removes ` +
                `every rule install added, with the rest of what install wrote for that agent here (everything install wrote, ` +
                `when it is the only agent recorded)`);
        }
    }
    const willCreateFile = !exists && toAdd.length > 0;
    const willCreatePermissions = permissions === null && toAdd.length > 0;
    const willCreateAsk = ask === null && toAdd.length > 0;
    const addedNow = new Set([...[...prevAdded].filter((r) => present.has(r)), ...toAdd]);
    // The file mode install recorded when it created the file (red-team L1 of plan 33.1-34) is carried with
    // the createdFile claim it belongs to, and only then.
    const carriedCreatedFile = !willCreateFile && proven && exists && previous !== null && previous.createdFile;
    ASK_LEDGER = {
        ...(carriedCreatedFile && previous !== null && previous.fileMode !== undefined ? { fileMode: previous.fileMode } : {}),
        added: [...addedNow].sort(),
        createdFile: willCreateFile || carriedCreatedFile,
        createdPermissions: willCreatePermissions || (proven && permissions !== null && previous !== null && previous.createdPermissions),
        createdAsk: willCreateAsk || (proven && ask !== null && previous !== null && previous.createdAsk),
        // The array as this run leaves it: the one it writes below, or the one it found.
        askContent: toAdd.length > 0 ? jsonValueRecord([...(ask ?? []), ...toAdd]) : askNow,
    };
    if (toAdd.length === 0) {
        if (rules.length === 0) {
            report("skipped", `${rel} (no checkpoint is at block — no ask rule to write)`);
            return { kind: "none-wanted", remaining: leftTotal, users: loweredUsers };
        }
        return { kind: "present", carried, users: rules.filter((r) => present.has(r) && !prevAdded.has(r)).length };
    }
    // THE SPLICE (red-team B3): a new file is install's own and written whole; an existing one gets the
    // rules added to its permissions.ask list (or the one member install adds) and nothing else. The splice
    // and its oracle are decided BEFORE the DRY_RUN return (plan 33.1-39, review IN-02), as uninstall's
    // removeAskRules does, so a preview reaches the real run's answer: a splice that fails the oracle
    // is the same verify in both, and the preview still writes nothing.
    let newText;
    if (doc === null || !doc.ok) {
        newText = createdSettingsText(toAdd);
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
            return ASK_REFUSED;
        }
    }
    if (DRY_RUN) {
        report("would-add", `${rel} (${toAdd.length} ask rule(s) to permissions.ask)`);
        return { kind: "dry-run", wouldAdd: toAdd.length };
    }
    if (!writeTargetFile(file, newText, settingsRead.state, rel)) {
        // Nothing was written, so this run added no rule: the ledger stays as it was when the array found
        // is still install's, and claims nothing otherwise (R3).
        ASK_LEDGER = proven ? previous : unclaimed(askNow);
        return ASK_REFUSED;
    }
    if (willCreateFile && ASK_LEDGER !== null) {
        // The mode the file install just created has (red-team L1 of plan 33.1-34): uninstall deletes the file
        // only while it still has it. A mode that cannot be read back is not recorded, and uninstall says so.
        try {
            ASK_LEDGER = { ...ASK_LEDGER, fileMode: modeText(lstatSync(file).mode) };
        }
        catch {
            // no mode recorded
        }
    }
    report("created", `${rel} (${toAdd.length} ask rule(s) added to permissions.ask${willCreateFile ? "; file created" : ""})`);
    return { kind: "written", added: toAdd.length };
}
// askRulesStep (plan 34.1-08, D-06, D-10): the ask rules are Claude Code's, so writeAskRules runs only when Claude Code
// is chosen (ASK_RULES_RAN). Otherwise .claude/settings.json is neither read nor written, the outcome is `not-chosen`,
// and nextLedgerEntries carries an earlier install's ask-rules entry verbatim (D-04). One check of writeAskRules is
// kept on that path: an unreadable marker is a counted verify there, and writeMarker, which leaves such a marker
// as it is, points at that line ("see the verify line above"), so a run that does not choose Claude Code still
// reports it and still exits 3.
function askRulesStep() {
    if (SELECTED_KINDS.has("claude-kit")) {
        ASK_RULES_RAN = true;
        return writeAskRules();
    }
    // The same never-remove remedy as writeAskRules' (D-37, 34.1 review CR-05, IN-33).
    const previousMarker = readInstallMarker(TARGET);
    if (previousMarker.state === "unreadable") {
        const remedy = markerRemedy(previousMarker) ?? noMarkerRemedy("askRulesStep");
        verify(`.grugops/install.json ${markerUnusableText(previousMarker)}, so this run uses none of its records — the marker ` +
            `was left as it was. ${markerFixText(remedy)}; then re-run the installer.`);
    }
    report("skipped", "Claude Code ask rules (Claude Code is not chosen in this run; .claude/settings.json is left as it is)");
    return { kind: "not-chosen" };
}
// ---------------------------------------------------------------------------
// writeOpenCodePermission (phase 34.1, D-14) — the OpenCode external_directory rule for the out-of-repo kit. The rule
// stops OpenCode's `external_directory` question before a tool call on the kit path (D-31, IN-25); it says nothing
// about OpenCode's other permissions. What the rule allows is one sentence, host-tools.ts OPENCODE_RULE_SCOPE (D-27):
// every tool call OpenCode gates by `external_directory` on the kit path, edits included, with the interaction with
// OpenCode's `edit` permission `UNKNOWN - verify`. It is printed beside every line that writes, finds or proposes the
// rule (reportOpenCodeRule, openCodeNote).
//
// WHY. A scripted install puts the kit in the kit home, outside the repository, and OpenCode asks before every tool
// call that touches a path outside the working directory (its `external_directory` permission defaults to "ask",
// opencode.ai/docs/permissions/, retrieved 2026-10-11). So install adds ONE allow rule for the kit root to the project
// opencode.json: `"permission": { "external_directory": { "~/<kit root relative to home>/**": "allow" } }`. OpenCode
// documents `~` at the start of a pattern as the home directory, and "the last matching rule winning", so the rule is
// appended as the LAST member of `external_directory`: a user's broader earlier rule (`"*": "ask"`) does not shadow it,
// and a later one the user adds still wins.
//
// HOME-RELATIVE OR NOTHING (T-34.1-17, T-34.1-18). The pattern is kitRulePattern(): the kit root plus `/**`, never the
// home directory itself, and never an absolute per-machine path: opencode.json is a file the user commits. A kit root
// that is not under the home directory, or whose relative path holds a glob or control character, gets no rule.
//
// WHAT IS WRITTEN. When opencode.json is absent (and no opencode.jsonc is there: install does not create a second
// OpenCode config file), install creates it with createdOpenCodeText(pattern) and nothing else. When it is present,
// the rule is spliced into its text (json-text.ts addMember: the member, or the `external_directory` object, or the
// `permission` object, whichever is absent) and every other byte of the user's file is kept; the spliced text must
// parse to exactly the expected value, with the rule last, before anything is written (THE ORACLE).
//
// EVERY REFUSAL IS A NOTE, NOT A VERIFY. Without the rule OpenCode still reaches the kit; it asks before each tool call
// on the kit path. So a shape install cannot edit is a `note` that quotes the rule to add by hand, and the run is not
// made incomplete (exit 0): the kit root is not under home, or its path holds a glob or control character (the note may
// print the absolute kit root in the terminal; nothing is written into a file); opencode.json is a link, a special file
// or a hard link (readForWrite); only opencode.jsonc exists; opencode.json is not strict JSON (OpenCode accepts JSONC;
// install edits strict JSON only); its root is not an object; it has a duplicate key; `permission` or
// `permission.external_directory` is there and is not an object (a string such as "ask" is text the user wrote and is
// left); the splice fails the oracle; an earlier install's recorded rule for another kit root is still there.
//
// THE LEDGER (reversibility, brief DC-2). OPENCODE_LEDGER is the `opencode-permission` entry writeMarker records:
//   - a run that added the rule records the pattern, what it created (the file, `permission`, `external_directory`),
//     the record of `external_directory` as it left it, and the file mode when it created the file;
//   - a rule for the same pattern already present records nothing new: it is the user's, unless the previous entry
//     still holds (`external_directory` is exactly what install last left), and then that entry is carried;
//   - a run that read `external_directory` and found it changed since install left it drops the previous entry (a rule
//     present now cannot be shown to be install's) and says so;
//   - A RUN THAT READ NOTHING KEEPS THE RECORD (the gemini entry's rule): the ledger cannot be used, the kit root has no
//     pattern, or opencode.json could not be read as a strict JSON object of the right shape. The previous entry is
//     carried verbatim, and uninstall compares it with the file before any edit.
// The marker and the ledger are asked first, as writeAskRules does: a rule install cannot record is a rule uninstall
// could never take out, so with an unreadable marker or a malformed ledger no rule is written.
//
// DRY_RUN decides every arm first, then reports `would-add` and records the bytes the real run writes (setPlanned).
// ---------------------------------------------------------------------------
/** OpenCode's other project config name (opencode.ai/docs/config/): when only it exists, install creates no opencode.json. */
const OPENCODE_JSONC_REL = "opencode.jsonc";
/**
 * The home-relative pattern for the kit root: `~/` + KIT_ROOT relative to the home directory (POSIX separators) +
 * `/**`, or null when KIT_ROOT is not under the home directory, or the relative path is empty, starts with `..`, or
 * holds `*`, `?`, `[`, `]`, `{`, `}`, a backslash or a control byte (glob metacharacters would widen the rule).
 */
function kitRulePattern() {
    let home;
    try {
        home = homedir();
    }
    catch {
        return null;
    }
    if (home === "")
        return null;
    // The one spelling of a recorded path (user-file.ts canonicalPathSpelling: POSIX separators on Windows, unchanged on
    // POSIX, where a backslash is a character of a name and is refused below), and the one absoluteness rule.
    const posix = canonicalPathSpelling(relative(canonicalPathSpelling(resolve(home)), KIT_ROOT));
    if (posix === "" || isRecordedAbsolute(posix) || posix.startsWith(".."))
        return null;
    if (/[*?[\]{}\\\u0000-\u001f\u007f]/.test(posix))
        return null;
    return `~/${posix}/**`;
}
// OPENCODE_RAN: true once writeOpenCodePermission ran in this run, that is, when OpenCode is chosen. nextLedgerEntries
// records OPENCODE_LEDGER only then; otherwise it carries the previous opencode-permission entry verbatim (D-04).
let OPENCODE_RAN = false;
// The opencode-permission entry writeMarker() records, or null for none (see THE LEDGER above).
let OPENCODE_LEDGER = null;
/** The rule a note tells the user to add by hand: the pattern, or the absolute kit root (printed, never written). */
function openCodeByHand(pattern) {
    return `"permission": { "external_directory": { ${JSON.stringify(pattern ?? `${KIT_ROOT}/**`)}: "allow" } }`;
}
/** A refusal: a note naming opencode.json, why, the rule to add by hand and what that rule allows; nothing is written. */
function openCodeNote(why, pattern) {
    report("note", `${OPENCODE_CONFIG_REL}: no OpenCode external_directory rule was written — ${why}. OpenCode still reaches the kit, ` +
        "asking its `external_directory` question before each tool call on the kit path. To stop that question, add " +
        `this to ${OPENCODE_CONFIG_REL} by hand: ${openCodeByHand(pattern)}. ${OPENCODE_RULE_SCOPE}`);
    return { kind: "note" };
}
/**
 * A line that writes, would write or finds the rule (`created`, `edited`, `would-add`, `skipped`), then the one note
 * saying what the rule allows (OPENCODE_RULE_SCOPE, D-27), so the scope is printed wherever the rule is.
 */
function reportOpenCodeRule(verb, text) {
    report(verb, text);
    report("note", `${OPENCODE_CONFIG_REL}: ${OPENCODE_RULE_SCOPE}`);
}
function writeOpenCodePermission() {
    const rel = OPENCODE_CONFIG_REL;
    const file = join(TARGET, rel);
    // THE MARKER AND THE LEDGER FIRST (writeAskRules' rule). The verify for an unreadable marker is counted by
    // askRulesStep, and the one for a malformed ledger by writeMarker; this pass names them and writes nothing.
    const previousMarker = readInstallMarker(TARGET);
    if (previousMarker.state === "unreadable") {
        return openCodeNote("the install marker could not be used (see the verify line about .grugops/install.json), so the rule could not be recorded for uninstall", kitRulePattern());
    }
    const previousRead = readLedger(previousMarker.state === "ok" ? previousMarker.marker : null);
    if (previousRead.state === "malformed") {
        return openCodeNote("the install ledger is malformed (see the verify line about .grugops/install.json), so the rule could not be recorded for uninstall", kitRulePattern());
    }
    const previous = entryAt(previousRead, rel, "opencode-permission") ?? null;
    // A RUN THAT READ NOTHING KEEPS THE RECORD: carried verbatim until the file is read below.
    OPENCODE_LEDGER = previous;
    const pattern = kitRulePattern();
    if (pattern === null) {
        return openCodeNote(`the kit root ${KIT_ROOT} is not under the home directory, or its path holds a glob or control character, so no ` +
            `home-relative pattern names it (install writes no absolute path into a file)`, null);
    }
    const read = readForWrite(TARGET, file);
    if (read.state === "blocked")
        return openCodeNote(blockedAt(read, file), pattern);
    if (read.state === "create") {
        if (kindAt(join(TARGET, OPENCODE_JSONC_REL)) !== null) {
            return openCodeNote(`${OPENCODE_JSONC_REL} is there and ${rel} is not, and install does not create a second OpenCode config file`, pattern);
        }
        // Nothing of an earlier install's is at the path any more, so its entry claims nothing there: dropped.
        OPENCODE_LEDGER = null;
        const text = createdOpenCodeText(pattern);
        if (DRY_RUN) {
            reportOpenCodeRule("would-add", `${rel} (the OpenCode external_directory rule ${pattern}; file created)`);
            setPlanned(file, text);
            return { kind: "dry-run" };
        }
        if (!writeTargetFile(file, text, "create", rel))
            return { kind: "refused" };
        let fileMode;
        try {
            fileMode = modeText(lstatSync(file).mode);
        }
        catch {
            // no mode recorded; uninstall compares the text only and says so
        }
        OPENCODE_LEDGER = {
            pattern,
            createdFile: true,
            createdPermission: true,
            createdExternalDirectory: true,
            content: jsonValueRecord({ [pattern]: "allow" }),
            ...(fileMode === undefined ? {} : { fileMode }),
        };
        reportOpenCodeRule("created", `${rel} (the OpenCode external_directory rule ${pattern}; file created)`);
        return { kind: "written", createdFile: true };
    }
    const doc = readJsonText(read.bytes);
    if (!doc.ok)
        return openCodeNote(`it ${doc.why}; OpenCode accepts JSONC, but install edits strict JSON only`, pattern);
    if (doc.root.kind !== "object")
        return openCodeNote("it is not a JSON object", pattern);
    const dup = firstDuplicateKey(doc.root);
    if (dup !== null)
        return openCodeNote(`it has a duplicate key (${JSON.stringify(dup).slice(0, 60)}), so which value OpenCode reads is not known`, pattern);
    const permAt = memberNamed(doc.root, "permission");
    if (permAt !== null && permAt.value.kind !== "object")
        return openCodeNote(`its "permission" value is not an object`, pattern);
    const extAt = permAt === null ? null : memberNamed(permAt.value, "external_directory");
    if (extAt !== null && extAt.value.kind !== "object") {
        return openCodeNote(`its "permission.external_directory" value is not an object (it is text the user wrote, and is left as it is)`, pattern);
    }
    const extNow = extAt === null ? undefined : valueOf(doc.text, extAt.value);
    // THE CARRY NEEDS PROOF: the previous entry holds only while external_directory is exactly what install left.
    const proven = previous !== null && previous.content === jsonValueRecord(extNow);
    OPENCODE_LEDGER = proven ? previous : null;
    if (previous !== null && !proven) {
        report("note", `${rel}: its permission.external_directory is not the one install last left there, so the OpenCode external_directory rule an earlier ` +
            `install recorded (${previous.pattern}) is no longer claimed as install's; a copy present now is the user's own`);
    }
    if (proven && previous !== null && previous.pattern !== pattern) {
        // The remedy names OpenCode's own commands (agentCommand, D-26, brief MSG-1): a flag-less uninstall would remove
        // every agent, far more than this one rule.
        const openCodeRows = HOST_TOOLS.filter((h) => h.adapter === "opencode-command");
        return openCodeNote(`it holds the OpenCode external_directory rule an earlier install added for another kit root (${previous.pattern}), and install adds ` +
            `no second rule; \`${agentCommand("uninstall.js", TARGET, openCodeRows, COMMAND_CONTEXT)}\` takes that rule out (with the rest of ` +
            `what install wrote for OpenCode here), then \`${agentCommand("install.js", TARGET, openCodeRows, COMMAND_CONTEXT)}\` adds the ` +
            `rule for this kit root`, pattern);
    }
    if (extNow !== undefined && Object.prototype.hasOwnProperty.call(extNow, pattern)) {
        reportOpenCodeRule("skipped", proven
            ? `${rel} (the OpenCode external_directory rule ${pattern} an earlier install added is already there)`
            : `${rel} (the OpenCode external_directory rule ${pattern} is already there — kept as the user's own rule; uninstall will not remove it)`);
        return { kind: "present" };
    }
    // THE SPLICE: the rule as the last member of external_directory, creating whichever container is absent.
    const newText = permAt === null
        ? addMember(doc.text, doc.root, "permission", { external_directory: { [pattern]: "allow" } })
        : extAt === null
            ? addMember(doc.text, permAt.value, "external_directory", { [pattern]: "allow" })
            : addMember(doc.text, extAt.value, pattern, "allow");
    // THE ORACLE: the spliced text holds exactly the value expected, with the rule last in external_directory.
    const extAfter = { ...(extNow ?? {}), [pattern]: "allow" };
    const expected = documentValue(doc);
    const expPerm = (permAt === null ? (expected.permission = {}) : expected.permission);
    expPerm.external_directory = extAfter;
    const check = readJsonText(Buffer.from(newText, "utf8"));
    const checkExt = check.ok ? memberNamed(memberNamed(check.root, "permission")?.value ?? check.root, "external_directory") : null;
    const last = checkExt !== null && checkExt.value.kind === "object" ? checkExt.value.members[checkExt.value.members.length - 1] : undefined;
    if (!check.ok || !sameJsonValue(documentValue(check), expected) || last === undefined || last.key !== pattern) {
        return openCodeNote("it could not be edited in place without changing anything but permission.external_directory", pattern);
    }
    if (DRY_RUN) {
        reportOpenCodeRule("would-add", `${rel} (the OpenCode external_directory rule ${pattern}, last in permission.external_directory)`);
        setPlanned(file, newText);
        return { kind: "dry-run" };
    }
    if (!writeTargetFile(file, newText, "ok", rel))
        return { kind: "refused" };
    OPENCODE_LEDGER = {
        pattern,
        createdFile: false,
        createdPermission: permAt === null,
        createdExternalDirectory: extAt === null,
        content: jsonValueRecord(extAfter),
    };
    reportOpenCodeRule("edited", `${rel} (the OpenCode external_directory rule ${pattern} added last to permission.external_directory; every other byte preserved)`);
    return { kind: "written", createdFile: false };
}
// The closing-notes sentence for one writeAskRules outcome (D-25), indented like the surrounding
// notes. Pure: it reads the outcome and nothing else. Only `written` says this run added rules; the
// git host is named as the only floor only when no governed ask rule is present at all.
function askRulesNotes(outcome) {
    const at = "          ";
    const settings = ".claude/settings.json";
    switch (outcome.kind) {
        case "written":
            return [
                `${at}This run added ${outcome.added} Claude Code ask rule(s) for the governed command spellings to`,
                `${at}${settings}.`,
            ];
        case "present": {
            const out = [`${at}This run added no ask rule.`];
            if (outcome.carried > 0) {
                out.push(`${at}The ${outcome.carried} ask rule(s) an earlier install added are still in ${settings}.`);
            }
            if (outcome.users > 0) {
                out.push(`${at}${settings} already holds ${outcome.users} governed spelling(s) as the user's own rules;`, `${at}install did not add them and uninstall will not remove them.`);
            }
            return out;
        }
        case "none-wanted": {
            const out = [`${at}No ask rule was written: no checkpoint is at block in the factory configuration.`];
            if (outcome.remaining > 0) {
                out.push(`${at}The ${outcome.remaining} ask rule(s) an earlier install added remain (see the \`left\` lines above).`);
            }
            if (outcome.users > 0) {
                out.push(`${at}${settings} holds ${outcome.users} governed spelling(s) as the user's own rules.`);
            }
            if (outcome.remaining === 0 && outcome.users === 0) {
                out.push(`${at}With no ask rule present for these commands, the git host is the only floor.`);
            }
            return out;
        }
        case "dry-run":
            return [`${at}DRY_RUN: this run would add ${outcome.wouldAdd} ask rule(s) to ${settings} and wrote nothing.`];
        case "refused":
            return [`${at}No ask rule was written in this run (see the verify line above).`];
        case "not-chosen":
            return [`${at}No ask rule was written in this run: Claude Code is not chosen.`];
        default: {
            const unhandled = outcome;
            return unhandled;
        }
    }
}
// agentClosingLines (plan 34.1-08, D-04, D-21): the closing notes about agents, built from this run's SELECTION, the
// install record this run left, and the registry; it reads and prints only.
//   - One line per chosen agent, in registry order: its name, the entries of the install record after this run that
//     it owns (host-tools.ts entryOwners, the one owner of that answer; a footprint prefix such as `.claude/` is shown
//     once with its count), and its `invoke` text. Under DRY_RUN nothing was recorded, and the line says so. A chosen
//     agent with nothing recorded (a user's own file at its entry path, a refusal) says that, and points at the lines
//     above, which name why.
//   - One line saying the invocation forms come from each host's documentation and were not run on a live host
//     (UNKNOWN - verify): no line here claims a live host result.
//   - The agents recorded before this run and not chosen in it are split by installedSplit (the one answer to "is
//     anything installed for this agent here", which the doctor asks too; phase 34.1 gap round 2, D-31, IN-23), over
//     the install record this run left (the record the run started from under DRY_RUN; when the record cannot be read,
//     every one counts as installed, since the run cannot tell). Those with something installed: one line naming them,
//     saying install never removes an agent's files (D-04), and giving the uninstall command that removes one, with
//     each one's flag (agentFlag). Those with nothing installed (recorded as chosen, D-26, e.g. an agent whose every
//     write an earlier run refused): never called "left installed"; one line naming them, with the install command that
//     installs one and the uninstall command that takes one out of the record, both from agentCommand.
function agentClosingLines() {
    const at = "  ";
    const markerAfter = DRY_RUN ? null : readInstallMarker(TARGET);
    const ledgerAfter = markerAfter !== null && markerAfter.state === "ok" ? readLedger(markerAfter.marker) : null;
    const out = [];
    for (const h of SELECTION) {
        let what;
        if (DRY_RUN) {
            what = "DRY_RUN, nothing written (the would- lines above name what a real run writes)";
        }
        else if (ledgerAfter === null || ledgerAfter.state !== "ok") {
            what = "the install record could not be read after this run (see the lines above)";
        }
        else {
            const prefixes = ADAPTER_FOOTPRINT[h.adapter].filter((p) => p.endsWith("/"));
            const groups = new Map();
            for (const e of ledgerAfter.entries) {
                if (e.kind === "dir" || !entryOwners(e).includes(h.id))
                    continue;
                const key = prefixes.find((p) => e.path.startsWith(p)) ?? e.path;
                groups.set(key, (groups.get(key) ?? 0) + 1);
            }
            const shown = [...groups].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([key, n]) => (key.endsWith("/") ? `${key} (${n} recorded)` : key));
            what = shown.length > 0 ? shown.join(", ") : "nothing of install's is recorded for it (the lines above say why)";
        }
        out.push(`${at}${h.name}: ${what} — ${h.invoke}`);
    }
    out.push(`${at}These invocation forms come from each host's documentation; grugops has not run them on a live host (UNKNOWN - verify).`);
    const before = HOST_TOOLS.filter((h) => INSTALLED_IDS_BEFORE.includes(h.id) && !SELECTION.includes(h));
    // The record this run left (the run's start under DRY_RUN, when nothing was written); null when it cannot be read.
    const ledgerRead = DRY_RUN ? PREVIOUS_LEDGER : ledgerAfter;
    const { installed: left, nothingInstalled } = installedSplit(before, ledgerRead !== null && ledgerRead.state === "ok" ? ledgerRead.entries : null);
    if (left.length > 0) {
        out.push(`${at}Left installed, not chosen in this run (install never removes an agent's files): ${left.map((h) => h.name).join(", ")}. ` +
            `To remove one: ${left.map((h) => `\`${agentCommand("uninstall.js", TARGET, [h], COMMAND_CONTEXT)}\` (${h.name})`).join("; ")}.`);
    }
    if (nothingInstalled.length > 0) {
        out.push(`${at}Recorded as chosen, not chosen in this run, and nothing is installed for it here: ${nothingInstalled.map((h) => h.name).join(", ")}. ` +
            `To install one: ${nothingInstalled.map((h) => `\`${agentCommand("install.js", TARGET, [h], COMMAND_CONTEXT)}\` (${h.name})`).join("; ")}; ` +
            `to take one out of the record: ${nothingInstalled.map((h) => `\`${agentCommand("uninstall.js", TARGET, [h], COMMAND_CONTEXT)}\` (${h.name})`).join("; ")}.`);
    }
    return out;
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
// The one record of what this run did with ask rules; the notes block below reads only this (D-25).
const askOutcome = askRulesStep();
// 7d. The OpenCode external_directory rule (phase 34.1, D-14; its scope is OPENCODE_RULE_SCOPE, D-27): only when
// OpenCode is chosen, after the whole-file entries and before writeMarker(), which records OPENCODE_LEDGER. When
// OpenCode is not chosen, opencode.json is neither read nor written and an earlier install's entry is carried verbatim
// (D-04).
if (SELECTED_KINDS.has("opencode-command")) {
    OPENCODE_RAN = true;
    writeOpenCodePermission();
}
// 8. Write the install marker (grugops-owned; overwritten unconditionally).
writeMarker();
console.log("\n-- notes --");
console.log("  Claude Code plugin form (colon commands /grugops:plan) installs separately:");
console.log("    /plugin marketplace add abitwise/grugops  (UNKNOWN - verify against current tool docs)");
console.log("    /plugin install grugops@grugops           (UNKNOWN - verify against current tool docs)");
console.log("  Safety: the git host is the hard floor — branch protection or rulesets on protected branches,");
console.log("          and deployment environments with required reviewers for production (install/README.md §5).");
// What this run did with Claude Code ask rules, from the outcome writeAskRules returned (D-25, WR-12).
for (const line of askRulesNotes(askOutcome))
    console.log(line);
console.log("          Claude Code ask rules are a speed bump, not a security boundary: other spellings of the");
console.log("          same command are not matched. The Claude Code plugin form cannot carry permission");
console.log("          rules, so a plugin-only install gets none.");
console.log("  Only a human merges to a protected branch or approves a production deploy.");
// One line per chosen agent, what the install record holds for it and how its documentation says to start grugops,
// then the agents left installed (plan 34.1-08, D-04, D-21).
for (const line of agentClosingLines())
    console.log(line);
// THE CLOSING CLAIM IS CONDITIONAL (27-13, T-27-59). A run that could not read a source directory,
// or that refused a nested adapter, has NOT completed — it installed nothing for that class. Saying
// "complete" over that is the repudiation failure this plan closes, so the banner reports the real
// outcome and points at the `verify` lines that name what was left undone.
if (VERIFY_FINDINGS > 0) {
    console.log(`\n== install INCOMPLETE — ${VERIFY_FINDINGS} item(s) need verification` +
        `${DRY_RUN ? " (DRY_RUN — nothing changed)" : ""} ==`);
    console.log("  Each `verify` line above names what was NOT installed and the remedy for it.");
    // THE SAME-RUN COMMAND (D-26, brief MSG-1): every counted verify of the install mode is finished by running install
    // again for the agents this run chose, built by agentCommand with this run's context (D-33): the absolute script
    // path, and this run's kit home, install mode and kit checkout stated as GRUGOPS_HOME, INSTALL_MODE and GRUGOPS_SRC
    // (D-38; no printed command carries `--symlink`), so the command run as printed, from any directory and whatever the
    // shell exports, finishes this install and not a copy install or a second kit.
    // Printed under DRY_RUN too.
    console.log(`  Once each is fixed, \`${agentCommand("install.js", TARGET, SELECTION, COMMAND_CONTEXT)}\` installs for the same agents again ` +
        `(add any other option this run was given).`);
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
