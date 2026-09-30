// uninstall.ts — grugops reversal (TOOL-01, D-09). The exact inverse of install/install.ts.
//
// This is a behavior-preserving TypeScript port of install/uninstall.sh (D-09). Every env-var
// name, sentinel string, exit code, and the is_protected denylist is carried 1:1; the sentinel
// strings are byte-identical to install.ts or the blocks would not be removable. Only TypeScript
// types were added; nothing semantic changed (translate, never redesign — the never-delete-user-
// content guard is a CLAUDE.md hard constraint). The committed compiled output is
// install/uninstall.js, which is what users run.
//
// Cross-platform. Node stdlib ONLY: node:fs + node:path — ZERO npm dependencies.
//
// EVERY READ OF A FILE'S CONTENT GOES THROUGH ./user-file.ts (plan 33.1-27, brief DC-3). Any path in
// the target may be a FIFO, a directory, a device or a symlink to one; a plain read of a FIFO blocks
// forever and a read of /dev/zero never ends. This file imports no node:fs content reader: the
// sentinel-block edits, the Gemini and ask-rule edits, the empty-file check and the byte compares
// all read through readUserFile (or readForWrite, its no-follow form for a path this run may write),
// which opens only a regular file within its size bound and never releases a writer blocked on a
// FIFO. A path this run edits is asked through readForWrite first, so a symbolic link or a
// non-directory at the path or on the way to it is refused rather than followed. A path this run
// removes by name is removed only when it is a regular file or the exact link install makes there
// (removalDecision, isOwnLink); any other link is left and counted, and a directory or a special
// file there is left and reported. Every removal is one unlinkSync (unlinkPath) whose failure is a
// counted verify and whose `removed` line is printed only when the path is gone (red-team of plan
// 33.1-27). install/installer-fs-census.test.ts holds the rule.
//
// Removes ONLY what install.ts added:
//   - the skills install.ts laid down: .claude/skills/<name>/SKILL.md (and the now-empty dirs), and
//   - the adapters install.ts laid down: .claude/agents/<file>.md (and the now-empty dir), each ONLY
//     while it still holds what the install marker's `kitFiles` ledger records install wrote there
//     (plan 33.1-30, Gap B completed): a user's edit to a kit file is user content, so an edited one is
//     left and reported (ownsKitFile). See removeKitSkills for the rule without a record.
//     NEVER a backup: the `<file>.grugops-edited-<UTC stamp>` copies install makes of an edited kit
//     file before it refreshes the kit (D-32, plan 33.1-32) are user content. They are reported
//     `left` (reportKitBackups) and never removed or claimed.
//   - the AGENTS.md grugops laid down  (ONLY if the install marker's `createdFiles` ledger records
//     that install created it AND it is still the exact link install makes or a copy byte-identical
//     to the source — a user's own AGENTS.md, including a byte-identical copy install did not
//     create, is never removed; plan 33.1-28)
//   - the CLAUDE.md "GSD:grugops-start-here" sentinel block, ONLY as the install marker's
//     `appendedBlocks` ledger records it (plan 33.1-33, brief DC-2, red-team carry items 4, 6, 11):
//     the exact bytes install appended, found as exactly one span in the file, and nothing else. Every
//     other byte of the user's CLAUDE.md is written back unchanged (a line the user added inside the
//     block keeps the whole block in place; trailing blank lines survive). A block with no record (no
//     marker, a marker older than the ledger) is left. The file itself is deleted by the Copilot rule
//     below (plan 33.1-28)
//   - the .gemini/settings.json context.fileName entry it added  (AGENTS.md removed from the
//     array; the file and any other keys are preserved; the file is deleted only if grugops
//     created it and it is now back to its empty-default shape)
//   - the .github/copilot-instructions.md sentinel block (by the same appendedBlocks record), and the file itself only
//     when the install marker's `createdFiles` ledger records that install created it, THIS run
//     removed a block from it, and it is blank afterwards (removeOwnedEmptyFile, plan 33.1-28, Gap B
//     / re-review WR-05). A file the user had, blank or not, is never deleted.
//   - the Claude Code ask rules it added to .claude/settings.json permissions.ask (exactly the rules
//     in the install ledger that are still present; a user's own identical rule is never removed,
//     and the file is deleted only if install created it and nothing else is left in it)
//   - the .grugops/install.json marker (the one grugops-owned file under .grugops/ — D-06), only when it
//     reads as install's own marker (ownsMarker, plan 33.1-33): a user's file at that path is left
//   - the runnables under tools/grugops/, only when the `createdFiles` ledger records that install
//     created them and they are still byte-identical to their source (plan 33.1-28)
//   - an EMPTY directory it visits, only when grugops owns it (CR-02): the directory is in the
//     marker's `createdDirs` ledger (install created it). Its name is not evidence (plan 33.1-28
//     removed the `grugops`-name rule): an empty .claude/, .claude/agents/, .gemini/, .github/ or
//     .claude/skills/grugops*/ with no record is left and reported.
//
// It NEVER deletes agent-factory/, plans/, .planning/, docs/, src/, the seeded per-repo state
// (.grugops/factory.config.json, plans/, memory-bank/), the shared kit at $GRUGOPS_HOME, or any
// user file. Those paths are guarded explicitly; only the install.json marker is removed from
// under the otherwise-protected .grugops/, via a narrow named exception. Removing the shared
// $GRUGOPS_HOME kit is a manual `rm` (no --purge-kit flag this phase). Honors DRY_RUN=1.
//
// Every report/warn/error string stays CLEAR PROFESSIONAL VOICE — safety surface, never caveman.
//
// Usage:
//   node install/uninstall.js                       # remove grugops adapters from the current repo
//   node install/uninstall.js --allow-self          # override the self-checkout guard (CR-04)
//   DRY_RUN=1 node install/uninstall.js             # preview only
//   GRUGOPS_SRC=/path TARGET=/path node install/uninstall.js
import { existsSync, writeFileSync, unlinkSync, rmdirSync, readdirSync, lstatSync } from "node:fs";
import { dirname, join, relative, resolve, isAbsolute, sep } from "node:path";
// KIT-02 / D-28: the ONE derivation of "what is in the kit source", shared with install.ts, so the
// REMOVAL set and the INSTALL set can never be two answers to one predicate again (CR-02). Only the
// two derivations this file uses are imported — see the kit-set derivation block below for why
// srcNestedAdapterFiles() is not one of them. Node stdlib only, sibling module inside install/, so
// this binary still runs on a host with nothing installed.
import { srcSkillNames, srcAdapterFiles, hasSourceMarkers } from "./kit-source.js";
// D-18: the one declaration of the Claude Code ask rules, shared with install.ts. Used here only to
// NAME a present rule the user holds (a grugops-shaped rule that is not in the install ledger); the
// removal set itself comes from the ledger, never from this list and never from string presence.
import { allAskRules, createdSettingsText } from "./checkpoint-ask-rules.js";
// CR-02 / WR-05: the ONE reader of the install marker and its two ledgers, shared with install.ts.
import { MARKER_REL, readInstallMarker, readCreatedDirs, readCreatedFiles, readKitFiles, readAppendedBlocks, readAskRuleLedger, readGeminiLedger, geminiLedgerJson, malformedLedgers, markerUnusableText, appendedBlockJson, contentRecord, recordMatches, NO_MODE_NOTE, modeText, checkRecord, readOwnedContent, jsonValueRecord, } from "./install-marker.js";
// Red-team B3 of plan 33.1-29 (D-18): the ONE way a JSON file the user owns is edited, as text. A
// removal deletes exactly the span install's insertion added; see the module header. No I/O.
import { readJsonText, keyCount, memberNamed, valueOf, documentValue, removeItems, replaceWithText, sameJsonValue } from "./json-text.js";
// DC-3 (plan 33.1-27): the ONE bounded reader of a user path, shared with install.ts. readForWrite is
// its no-follow form for a path this run may edit, wayTo the same walk for a path removed by name,
// kindAt names what is at a path, and unreadState is the one wording of an unread state. isOwnLink is
// the one "this link is the link install makes" predicate, shared with install.ts, and gone is the
// one "nothing is there any more" check a removal is reported by (red-team of plan 33.1-27).
import { readUserFile, readForWrite, wayTo, kindAt, unreadState, isOwnLink, gone } from "./user-file.js";
// ---------------------------------------------------------------------------
// Argument parsing (CR-02). Mirrors install.ts's loop so uninstall honors the surface its own
// README advertises (`node install/uninstall.js --target /path/to/repo`). Without this loop the
// documented --target flag was silently discarded and the reversal ran against the CWD — wiping
// grugops wiring from the WRONG repo while leaving the intended target fully installed.
//   --target <repo> / --target=<repo>   the repo to reverse (precedence: flag > TARGET env > CWD)
//   --allow-self / --force              override the self-checkout guard below (CR-04)
// Scope is unchanged (D-06): still removes only adapters + wiring + the .grugops/install.json
// marker; never the shared $GRUGOPS_HOME kit nor seeded per-repo state.
//
// ONE VOCABULARY ACROSS THE TWO BINARIES (CR-04): --allow-self / --force are spelled and meant
// exactly as they are in install.ts's loop. The flag MUST be recognised here or the guard below
// would be unreachable — this loop exits 2 on any unrecognised argument, so an override that is not
// parsed is rejected as bad usage before the guard it is meant to override can honour it.
// ---------------------------------------------------------------------------
let ARG_TARGET = "";
let ALLOW_SELF = false;
// A VALUE-TAKING FLAG WITH NO VALUE IS BAD USAGE (red-team L4 of plan 33.1-34): the same rule as
// install.ts's loop. `--target` with no value used to fall back to TARGET or the current directory.
let USAGE_ERROR = null;
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--target" || a.startsWith("--target=")) {
        const value = a === "--target" ? argv[++i] : a.slice("--target=".length);
        if (value === undefined || value === "" || (a === "--target" && value.startsWith("--"))) {
            USAGE_ERROR =
                "--target needs a directory (usage: node install/uninstall.js --target <repo>, or --target=<path> for a " +
                    "path that begins with --)";
            break;
        }
        ARG_TARGET = value;
    }
    else if (a === "--allow-self" || a === "--force") {
        ALLOW_SELF = true;
    }
    else {
        USAGE_ERROR = `unknown argument: ${a}`;
        break;
    }
}
if (USAGE_ERROR !== null) {
    process.stderr.write(`uninstall.js: ${USAGE_ERROR}\n`);
    process.exit(2);
}
const SCRIPT_DIR = import.meta.dirname;
const GRUGOPS_SRC = process.env.GRUGOPS_SRC ? resolve(process.env.GRUGOPS_SRC) : resolve(SCRIPT_DIR, "..");
const DRY_RUN = process.env.DRY_RUN === "1";
// abspath: resolve a (possibly not-yet-existing) path to an absolute one without requiring the
// leaf to exist (mirrors uninstall.sh's abspath — Security V5: validate to absolute before use).
// uninstall.sh's abspath does NOT collapse `.`/`..`; it only prefixes a relative path with cwd.
const abspath = (p) => (isAbsolute(p) ? p : `${process.cwd()}/${p}`);
// Precedence: --target flag > TARGET env > current working directory. Resolved to an ABSOLUTE
// path before any removal so the reversal operates on the named target, not the CWD.
const TARGET = abspath(ARG_TARGET || process.env.TARGET || process.cwd());
const CLAUDE_OPEN = "<!-- GSD:grugops-start-here -->";
const CLAUDE_CLOSE = "<!-- GSD:grugops-start-here-end -->";
const COPILOT_REL = ".github/copilot-instructions.md";
// WR-05: the Copilot block has its OWN distinct sentinel (must match install.ts exactly). The
// CLAUDE.md and Copilot blocks are removed by their own markers, so a future change to one
// sentinel cannot silently stop the other from being removed.
const COPILOT_OPEN = "<!-- GSD:grugops-copilot-start-here -->";
const COPILOT_CLOSE = "<!-- GSD:grugops-copilot-start-here-end -->";
const report = (label, msg) => console.log(`  ${label.padEnd(14)} ${msg}`);
// verify (27-13): a `verify`-status finding — something the run could NOT do and the human must
// resolve. Byte-identical in shape to install.ts's verify(), and it COUNTS the findings for the
// same reason: neither half may claim success over a no-op it did not perform. The uninstaller
// already reported an unreadable source directory; what it also did was print
// "== uninstall complete ==" immediately afterwards, which is the same repudiation failure the
// installer had, wearing the other hat.
let VERIFY_FINDINGS = 0;
const verify = (msg) => {
    VERIFY_FINDINGS += 1;
    report("verify", msg);
};
// GONE_THIS_RUN (red-team of plan 33.1-28, R1/R2, brief DC-2): every path this run removed, or, in
// DRY_RUN, would remove, resolved. Two decisions read it. rmdirIfEmpty removes an empty directory only
// when this run emptied it (an entry of it is in this set), and in DRY_RUN it counts an entry this run
// would remove as gone, so the preview decides as the real run does. removeMarker, when it keeps a
// marker, takes every path in this set out of the marker's ledgers, so a later run cannot act on a
// record of something this run already removed.
const GONE_THIS_RUN = new Set();
const markGone = (p) => {
    GONE_THIS_RUN.add(resolve(p));
};
// ---------------------------------------------------------------------------
// Kit-set derivation (KIT-02 / T-27-06). The hand-listed SKILLS array and the single AGENT_REL
// constant that used to live here were DUPLICATED LITERALS in a second file: editing only
// install.ts would have left this uninstaller removing exactly one adapter and orphaning the rest.
// The removal set is derived from the same $GRUGOPS_SRC root the installer installs from.
//
// AND THEN THE MIRROR ITSELF WAS THE DUPLICATE (D-28, closing CR-02). Replacing the literals with a
// hand-synced CODE mirror of install.ts's helpers only moved the drift one level up. That pair —
// recorded in the foundation guards' set-literal inventory as a declared BYTE-IDENTICAL PAIR —
// drifted twice inside phase 27: round 1 re-synced it, then plan 27-22 moved install.ts onto
// statSync for WR-02 and left this file on Dirent flags. A Dirent for a symlink is NEITHER isFile()
// NOR isDirectory(), so a symlinked source adapter was installed by install.js and never removed
// here, under `== uninstall complete ==` and exit 0. The remedy is structural: the derivation moved
// into ./kit-source.ts and BOTH installers import it, so THE REMOVAL SET AND THE INSTALL SET ARE
// NOW LITERALLY THE SAME DERIVATION and the reversal cannot be narrower than the install. Do not
// re-inline a copy of either helper here on the argument that it is small — that is the defect.
//
// THE REMOVAL SET IS DERIVED FROM THE KIT SOURCE, NEVER FROM THE TARGET. Listing the target's own
// .claude/agents/ directory and deleting what is there would delete the user's own agent files —
// a data-loss bug against the hard constraint that installers never delete user content. The
// derived set is intersected with what actually exists in the target, and only that intersection
// is removed.
//
// Both helpers return NULL — not [] — when the source directory cannot be read. Null is the
// fail-LOUD signal: the caller reports the condition and skips that removal class entirely, leaving
// the files for the user to remove by hand. It never falls back to target-derived deletion and
// never claims a clean uninstall it did not perform (T-27-09). The full contract lives in
// kit-source.ts's header.
//
// ONLY the two derivations this file USES are imported. srcNestedAdapterFiles() is deliberately not
// among them: a nested source adapter is REFUSED by the installer and never installed, so there is
// nothing in the target for the reversal to remove. Importing it here would invent a removal class
// for files that were never laid down.
//
// The source root is passed EXPLICITLY on every call (D-22) — kit-source resolves no root of its
// own, so the GRUGOPS_SRC resolved above stays this file's single source of truth for where the kit
// is, exactly as it is install.ts's. The import itself sits with the other imports at the top of
// the file.
// ---------------------------------------------------------------------------
// SAFETY GUARD: refuse to ever operate on a frozen-core or user-data path. Every removal
// target is checked against this denylist before it is touched. agent-factory/, plans/,
// .planning/, docs/, src/ — and the repo root itself — are off-limits, always.
//
// Two-root (D-06): .grugops/ is now PROTECTED too. Once the installer seeds per-repo state
// (.grugops/factory.config.json) it becomes the user's content and survives uninstall. The ONE
// grugops-owned file under .grugops/ — the install.json marker — is removed via a dedicated,
// explicitly-named exception below (NOT through this generic guard). The shared kit at
// $GRUGOPS_HOME is never named in any removal path: it is shared across repos, and removing it
// is a manual `rm` (no --purge-kit this phase).
function isProtected(p) {
    const protectedDirs = ["agent-factory", "plans", ".planning", ".grugops", "docs", "src"];
    for (const d of protectedDirs) {
        const base = `${TARGET}/${d}`;
        if (p === base || p.startsWith(`${base}/`))
            return true;
    }
    // the repo root itself (with or without a trailing slash) is off-limits
    if (p === TARGET || p === `${TARGET}/`)
        return true;
    return false;
}
// pathExists: true if the path exists OR is a (possibly dangling) symlink — mirrors the sh
// `[ -e "$_f" ] || [ -L "$_f" ]` test. existsSync follows links (false for a dangling link), so a
// dangling link must be detected via lstat.
function pathExists(p) {
    if (existsSync(p))
        return true;
    try {
        lstatSync(p);
        return true; // present as a (possibly dangling) symlink
    }
    catch {
        return false;
    }
}
const isSymlink = (p) => {
    try {
        return lstatSync(p).isSymbolicLink();
    }
    catch {
        return false;
    }
};
const isFile = (p) => {
    try {
        return lstatSync(p).isFile();
    }
    catch {
        return false;
    }
};
const isDir = (p) => {
    try {
        return lstatSync(p).isDirectory();
    }
    catch {
        return false;
    }
};
// errCode: the error code a thrown fs error carries, or "UNKNOWN".
const errCode = (e) => {
    const code = e.code;
    return typeof code === "string" && code !== "" ? code : "UNKNOWN";
};
// unlinkPath (red-team of plan 33.1-27, B1/B2): THE ONE REMOVAL OF A FILE OR A LINK in this file.
// unlinkSync removes the name itself: a link is removed as a link, whatever it points at, and a
// directory is refused (it is never asked to remove one; the callers decide that first). rmSync did
// not behave that way: on Node 24 it threw ERR_FS_EISDIR on a link to a directory (an uncaught exit
// 1 after some removals had happened, and every later step skipped), and with `force` it left a
// dangling link in place while this file printed `removed`. Node 22 removed both, so CI could not
// see either. Here a failure is a counted verify, never a throw, and `removed` is printed only when
// lstat afterwards finds nothing at the path. Every caller returns under DRY_RUN before calling it.
function unlinkPath(f, label, removedLine) {
    try {
        unlinkSync(f);
    }
    catch (e) {
        verify(`${label}: ${f} could not be removed (${errCode(e)}). It was left in place; remove it by hand if it is grugops's.`);
        return false;
    }
    if (!gone(f)) {
        verify(`${label}: ${f} is still present after its removal. Remove it by hand if it is grugops's.`);
        return false;
    }
    markGone(f);
    report("removed", removedLine);
    return true;
}
// rewritePath (red-team of plan 33.1-27, DC-3 "never crashes"): THE ONE REWRITE of a file this run
// edits (a sentinel block, the Gemini entry, the ask rules). Each caller asked readForWrite first and
// returns under DRY_RUN before calling it. A write that fails (EACCES, EROFS, a path that changed
// since the read) is a counted verify, never an uncaught throw, and the caller reports its success
// line only when this returns true.
function rewritePath(f, text, label, remedy = "make the change by hand.") {
    try {
        writeFileSync(f, text);
        return true;
    }
    catch (e) {
        verify(`${label}: ${f} could not be rewritten (${errCode(e)}). It was left as it was; ${remedy}`);
        return false;
    }
}
function removalDecision(f, label, ownLink) {
    if (isProtected(f))
        return { act: "refused", line: `${label} (protected path — never removed)` };
    const way = wayTo(TARGET, f);
    if (way === "absent")
        return { act: "absent", line: `${label} (not present)` };
    if (way !== null) {
        return { act: "verify", line: `${label}: ${way.at} ${way.reason}. The path was not removed; remove it by hand if it is grugops's.` };
    }
    const kind = kindAt(f);
    if (kind === null) {
        return gone(f)
            ? { act: "absent", line: `${label} (not present)` }
            : { act: "verify", line: `${label}: ${f} could not be examined. It was not removed; remove it by hand if it is grugops's.` };
    }
    if (kind === "regular file")
        return { act: "remove" };
    if (kind === "symbolic link") {
        if (ownLink !== null && isOwnLink(f, ownLink))
            return { act: "remove" };
        const install = ownLink === null ? "install never makes a link here" : `the link install makes here points at ${ownLink}`;
        return {
            act: "verify",
            line: `${label}: ${f} is a symbolic link that is not the one install makes (${install}). It was left in place ` +
                `and not followed; remove it by hand if it is grugops's.`,
        };
    }
    return { act: "left", line: `${label} (it is a ${kind}, not a file install writes — left in place)` };
}
/** Print a non-remove decision; true when the caller should stop. */
function reportDecision(d) {
    if (d.act === "remove")
        return false;
    if (d.act === "verify")
        verify(d.line);
    else
        report(d.act === "absent" ? "skipped" : d.act, d.line);
    return true;
}
// remove_file: delete a single file or install's own link, by the one decision above. Never recursive.
// `owns` (plan 33.1-30) is the content-record question for a path that needs one (a kit file:
// ownsKitFile). It is asked only for a path the decision would remove (a regular file inside the
// target, or install's own link), and before the DRY_RUN branch, so the preview decides as the real
// run does; a path it does not own is left and reported with its reason.
//
// THE RECORD IS ASKED FIRST (red-team B2 of plan 33.1-34, brief DC-2). A path install has no record of
// writing is left, whatever is there: a user's link at a kit path, or a `.claude` that is a link to the
// user's own directory, used to reach removalDecision's verify first, so a repository grugops was never
// installed into finished INCOMPLETE (exit 3) over a path uninstall had no business with. Now a verify
// about what is at the path is reported only when install has a record for it and the path cannot be
// read or is not what install wrote (removalDecision), which is when the human has something to resolve.
// A protected path is still refused first.
function removeFile(f, label, ownLink, owns) {
    const own = owns === undefined || isProtected(f) ? undefined : owns();
    if (own !== undefined && !own.owned && !own.recorded) {
        report("left", `${label} (${own.reason})`);
        return;
    }
    const d = removalDecision(f, label, ownLink);
    if (reportDecision(d))
        return;
    if (own !== undefined && !own.owned) {
        report("left", `${label} (${own.reason})`);
        return;
    }
    const line = own !== undefined && own.owned && own.note !== null ? `${label} (${own.note})` : label;
    if (DRY_RUN) {
        report("would-remove", line);
        markGone(f);
        return;
    }
    unlinkPath(f, label, line);
}
// rmdir_if_empty: remove a now-empty grugops-owned dir (never recursive, never -f a tree).
//
// EMPTINESS IS DECIDED BY A READ, NEVER BY ATTEMPTING THE REMOVAL (CR-02, D-18). The DRY_RUN
// preview reads the directory's entries and, when there are none, narrates `would-rmdir` and
// returns: the preview path makes NO filesystem call that can change anything. (It used to call
// rmdirSync "to see whether it would succeed", which deleted every empty directory it visited while
// printing "nothing changed".) Because the preview changes nothing, it names a directory only when
// that directory is ALREADY empty; a directory the real run empties first — by removing the grugops
// files inside it — is removed by the real run without having been named in the preview. So the
// preview's would-rmdir set is always a subset of the real run's rmdir set, never a superset.
//
// OWNERSHIP IS DECIDED BEFORE THE PREVIEW BRANCH (CR-02, D-18). An empty directory is removed only
// when ownsDir() says grugops owns it; otherwise it is reported `left` with the reason, in the real
// run and in the preview alike. Both runs apply the same rule, so the preview's subset property
// above still holds.
//
// AND ONLY WHEN THIS RUN EMPTIED IT (red-team of plan 33.1-28, R1/R2, brief DC-2). The record names a
// path, and a user can delete the directory install created and make their own at the same name; a
// marker kept by an earlier run, or copied, can name a directory that run already removed. So the
// record alone is not enough: the directory must also have held something this run removed (an entry
// of it is in GONE_THIS_RUN). A recorded directory that was already empty when this run reached it
// shows nothing of install's any more, and is left and reported. In DRY_RUN nothing is removed, so an
// entry the preview would remove counts as gone: the preview reaches the real run's answer (assuming
// each removal it names succeeds) and names what the real run removes, never more.
function rmdirIfEmpty(d) {
    if (isProtected(d))
        return;
    // A link or non-directory on the way (plan 33.1-27): the directory is not inside the target.
    if (wayTo(TARGET, d) !== null)
        return;
    if (!isDir(d))
        return;
    let entries;
    try {
        entries = readdirSync(d);
    }
    catch {
        return; // unreadable → leave it, say nothing (as before)
    }
    if (entries.some((e) => !GONE_THIS_RUN.has(resolve(d, e))))
        return;
    if (!ownsDir(d)) {
        report("left", `${d} (${notRecordedReason(DIR_LEDGER, "directory")})`);
        return;
    }
    const key = resolve(d);
    if (![...GONE_THIS_RUN].some((p) => dirname(p) === key)) {
        report("left", `${d} (it was already empty when this run reached it, so nothing in it shows it is still the directory ` +
            `install created — it may have been emptied, or deleted and made again, since; left in place)`);
        return;
    }
    if (DRY_RUN) {
        report("would-rmdir", d);
        markGone(d);
        return;
    }
    try {
        rmdirSync(d);
        markGone(d);
        report("rmdir", d);
    }
    catch {
        // became non-empty in a race, or not removable → leave it
    }
}
// ownsDir (CR-02, D-18): grugops owns directory `d` only when the install marker's `createdDirs`
// ledger lists it (install created it). The ledger is only ever ASKED about the fixed candidates this
// file visits; it is never iterated to decide what to delete.
//
// A NAME IS NOT A RECORD (plan 33.1-28, brief DC-2, red-team carry #7). A directory whose own name
// begins with `grugops` (.claude/skills/grugops*, tools/grugops) used to count as grugops's with no
// record, so an empty one in a repository grugops was never installed into was removed by its name
// alone. Every candidate now needs the ledger; one with none is left and reported with the reason.
function ownsDir(d) {
    if (DIR_LEDGER.state !== "ok")
        return false;
    return DIR_LEDGER.dirs.includes(relative(TARGET, d).split(sep).join("/"));
}
const ownedBy = (c) => ({ owned: true, note: c.modeChecked ? null : NO_MODE_NOTE });
function ownsFile(rel, check) {
    const record = FILE_LEDGER.state === "ok" ? FILE_LEDGER.files.get(rel) : undefined;
    if (record === undefined)
        return { owned: false, reason: notRecordedReason(FILE_LEDGER, "file"), recorded: false };
    const c = check(record);
    if (c.holds)
        return ownedBy(c);
    if (c.modeChanged !== undefined) {
        return {
            owned: false,
            recorded: true,
            reason: `${c.modeChanged} there (a change made since), so it is not what install created; left in place`,
        };
    }
    if (c.why !== null)
        return { owned: false, reason: `${c.why}; left in place`, recorded: true };
    return {
        owned: false,
        recorded: true,
        reason: "it does not hold what the install marker's file ledger records install wrote there (it was edited " +
            "or replaced since), so there is no record that install created this content; left in place",
    };
}
/** ownsFile for a file read now, at `rel` under the target (install-marker.ts checkRecord). */
const ownsFileNow = (rel) => ownsFile(rel, (record) => checkRecord(TARGET, join(TARGET, ...rel.split("/")), record));
// ownsKitFile (plan 33.1-30, Gap B completed, brief DC-2, D-18): a grugops skill or adapter file at
// `rel` (`path` in the target, `src` its kit source) is install's to remove only on a content record.
// A user's edit to a kit file is user content, and the file's name is not evidence of anything.
//   - KIT_LEDGER `ok` with a record for `rel`: owned only while the path still holds it (checkRecord,
//     the one predicate: a `sha256:` record holds for a regular file inside the target, read without
//     following a link and not a hard link (readOwnedContent), whose bytes hash to it; a `link:` record
//     for the link at the path whose readlink equals it). Otherwise it has changed since install wrote
//     it, and it is left; a file that could not be compared (a hard link) is left with that reason.
//   - KIT_LEDGER `ok` without a record for `rel`: install has no record of writing it; left.
//   - KIT_LEDGER `malformed`, or an unreadable marker: fail closed, nothing is removed (the one verify at
//     the top of the removal sequence said why).
//   - no install marker at all: a repository grugops was never installed into (README §1's minimal
//     copy path, or kit files the user copied by hand) holds nothing install recorded, and a
//     never-installed target is changed by zero bytes (brief DC-2), so every kit file is left, even
//     one byte-identical to the kit source. Plan 33.1-28 applies the same rule to AGENTS.md and the
//     runnables: byte identity is not provenance.
//   - a marker without the field (an install made before this ledger existed): the marker records
//     that install ran here, so the fallback is a content record the kit already has, byte identity
//     with the kit source file `src`. The file is read by the SAME content read the recorded arm uses
//     (readOwnedContent: no link followed, a hard link refused; red-team RT2 of plan 33.1-30), and the
//     kit source, which is outside the target, through readUserFile. A verbatim-copied skill is
//     removed; every rendered file (each adapter, the resolver skill) and every edited one differs,
//     and is left with the manual remedy. A path or a kit source that is not a readable regular file
//     is never opened (brief DC-3) and is left, with its state named. install's own link to `src`
//     (removalDecision has already shown the link at the path is that one) is owned while `src` reads.
//     THE FALLBACK IS SPENT BY THE RUN THAT USES IT (red-team RT1 of plan 33.1-30): a marker this run
//     keeps is rewritten with `kitFiles: {}` (updateKeptMarker), so the next run cannot remove a kit
//     file the user copies in later.
// The ledger is only ever ASKED about the fixed kit paths this file visits; it is never iterated to
// decide what to delete.
function ownsKitFile(rel, path, src) {
    if (MARKER.state === "unreadable" || KIT_LEDGER.state === "malformed") {
        return { owned: false, recorded: false, reason: "the kit-file ledger could not be used (see the verify line above) — left in place" };
    }
    if (KIT_LEDGER.state === "ok") {
        const record = KIT_LEDGER.files.get(rel);
        if (record === undefined) {
            return {
                owned: false,
                recorded: false,
                reason: "install has no record of writing it — it is not in the install marker's kit-file ledger; left in place",
            };
        }
        const c = checkRecord(TARGET, path, record);
        if (c.holds)
            return ownedBy(c);
        if (c.modeChanged !== undefined) {
            return {
                owned: false,
                recorded: true,
                reason: `${c.modeChanged} there (a change made since) — left in place; remove it by hand once you have kept any change you want`,
            };
        }
        if (c.why !== null)
            return { owned: false, recorded: true, reason: `${c.why} — left in place; remove it by hand if it is grugops's` };
        return {
            owned: false,
            recorded: true,
            reason: "it has changed since install wrote it (it does not hold what the install marker's kit-file ledger records " +
                "install wrote there) — left in place; remove it by hand once you have kept any edit you want",
        };
    }
    if (MARKER.state === "absent") {
        return {
            owned: false,
            recorded: false,
            reason: "there is no install marker, so there is no record that install wrote it — left in place; remove it by " +
                "hand if grugops put it there",
        };
    }
    // A marker without the kitFiles field: the legacy fallback, byte identity with the kit source.
    const noRecord = "there is no install record of what was written";
    const remedy = "remove it by hand once you have kept any edit you want";
    // The legacy fallback is the record here: a path it cannot read is still a verify (recorded: true).
    const srcRead = readUserFile(src);
    if (srcRead.state !== "ok") {
        const what = srcRead.state === "absent" ? "is missing" : unreadState(srcRead);
        return {
            owned: false,
            recorded: true,
            reason: `${noRecord}, and its kit source ${src} ${what}, so byte identity could not be established — left in place; ${remedy}`,
        };
    }
    if (isOwnLink(path, src))
        return { owned: true, note: null };
    const cur = readOwnedContent(TARGET, path);
    if (cur.state === "ok" && cur.bytes.equals(srcRead.bytes))
        return { owned: true, note: null };
    if (cur.state !== "ok" && cur.why !== null)
        return { owned: false, recorded: true, reason: `${noRecord}, and ${cur.why} — left in place; ${remedy}` };
    return { owned: false, recorded: true, reason: `${noRecord}, and it differs from the kit source — left in place; ${remedy}` };
}
// notRecordedReason (re-review IN-01, plan 33.1-28): the ONE wording of "there is no install record
// for this path", for a directory (createdDirs) or a file (createdFiles), chosen from the state of the
// ledger that would have held it. It says what the record shows, never more: a path missing from a
// readable ledger has no record that install created it, which is not the same as "install did not
// create it" (an install made before a later re-install, or a record the human edited, can differ).
function notRecordedReason(ledger, what) {
    if (ledger.state === "ok") {
        return `there is no record that install created it — it is not in the install marker's ${what} ledger; left in place`;
    }
    if (ledger.state === "malformed" || MARKER.state === "unreadable") {
        return `the ${what} ledger could not be used (see the verify line above), so there is no record that install created it; left in place`;
    }
    if (MARKER.state === "absent") {
        return "there is no install marker, so there is no record that install created it; left in place";
    }
    return `the install marker predates the ${what} ledger, so there is no record that install created it; left in place`;
}
const NO_BLOCK_REMOVED = { removed: false, blankAfter: false, before: null, beforeMode: null };
// BLOCKS_GONE (plan 33.1-33): every file (POSIX path relative to the target) whose recorded block this run
// removed or, in DRY_RUN, would remove. updateKeptMarker takes them out of a kept marker's appendedBlocks,
// so a later run cannot remove a block the user pastes back on a record this run already used.
const BLOCKS_GONE = new Set();
/** Every copy of the block lines in `buf`: an open line at a line start through the first `\n<close>\n` after it. */
function blockLineSpans(buf, open, close) {
    const head = Buffer.from(`${open}\n`, "utf8");
    const tail = Buffer.from(`\n${close}\n`, "utf8");
    const spans = [];
    for (let i = buf.indexOf(head); i !== -1; i = buf.indexOf(head, i + 1)) {
        if (i > 0 && buf[i - 1] !== 0x0a)
            continue; // not on a line of its own
        const j = buf.indexOf(tail, i + head.length - 1);
        if (j === -1)
            break;
        spans.push({ start: i, end: j + tail.length });
    }
    return spans;
}
/**
 * The bytes to remove for the one matching copy at `sp` (red-team B1 of plan 33.1-33): the block lines,
 * and the newline before them only when it is install's by the record and the bytes (see THE SEPARATOR).
 */
function blockRemovalSpan(buf, sp, rec) {
    const atEnd = sp.end === buf.length;
    if (!atEnd || sp.start === 0)
        return { ...sp, separator: false };
    // sp.start > 0, so buf[sp.start - 1] is the newline that ends the line before the block.
    const sepIsInstalls = rec.separator === "line-end" ? true : sp.start === 1 || buf[sp.start - 2] === 0x0a;
    return sepIsInstalls ? { start: sp.start - 1, end: sp.end, separator: true } : { ...sp, separator: false };
}
// ownsBlock (plan 33.1-33, D-18): the record of the block install appended to `rel`, or the reason there is
// none. Only the ledger answers; the file's content never does. The ledger is only ever ASKED about the two
// fixed pointer files; it is never iterated to decide what to edit.
function ownsBlock(rel) {
    const remedy = "remove the grugops lines by hand if grugops put them there";
    if (MARKER.state === "absent") {
        return { record: null, reason: `there is no install marker, so there is no record that install appended this block — left in place; ${remedy}` };
    }
    if (MARKER.state === "unreadable") {
        return {
            record: null,
            reason: `the install marker could not be used (see the verify line above), so there is no usable record that install appended this block — left in place; ${remedy}`,
        };
    }
    if (BLOCK_LEDGER.state === "absent") {
        return {
            record: null,
            reason: `the install marker predates the appended-block ledger, so there is no record that install appended this block — left in place; ${remedy}`,
        };
    }
    if (BLOCK_LEDGER.state === "malformed") {
        return { record: null, reason: `the appended-block ledger could not be used (see the verify line above) — left in place; ${remedy}` };
    }
    const record = BLOCK_LEDGER.blocks.get(rel);
    if (record === undefined) {
        return {
            record: null,
            reason: `there is no record that install appended this block — it is not in the install marker's appended-block ledger; ` +
                `left in place; ${remedy}`,
        };
    }
    return { record };
}
const isBlankByte = (b) => b === 0x20 || b === 0x09 || b === 0x0d || b === 0x0a;
function removeSentinelBlock(rel, open, close, label) {
    const f = `${TARGET}/${rel}`;
    if (isProtected(f)) {
        report("refused", `${label} (protected path)`);
        return NO_BLOCK_REMOVED;
    }
    // DC-3 (plan 33.1-27): readForWrite, never a plain read. Nothing there is the existing "no block"
    // answer. A special file, a link, or a non-directory on the way is a counted verify: it was not
    // read, so whether it holds a grugops block is unknown, and it is never written.
    const read = readForWrite(TARGET, f);
    if (read.state === "create") {
        report("skipped", `${label} (no grugops block present)`);
        return NO_BLOCK_REMOVED;
    }
    if (read.state === "blocked") {
        // THE RECORD IS ASKED FIRST (red-team B2 of plan 33.1-34, brief DC-2). A path with no record of a block
        // install appended is not uninstall's to resolve: a user's `CLAUDE.md -> AGENTS.md` link used to be a
        // verify here, so every uninstall of a repository holding one, installed into or not, exited 3 with no
        // remedy short of removing the user's own link. It is left and reported. Only a path install has a
        // record for, which cannot be read, is a verify: the block install appended may be in it.
        const noRecord = ownsBlock(rel);
        if (noRecord.record === null) {
            report("left", `${label} (${read.at} ${read.reason}, so it was not read or changed; ${noRecord.reason})`);
            return NO_BLOCK_REMOVED;
        }
        verify(`${label}: ${read.at} ${read.reason}. It was not read and was left untouched, so the grugops block install ` +
            `recorded appending to it was not removed; remove the grugops lines by hand, keeping any line of yours.`);
        return NO_BLOCK_REMOVED;
    }
    const buf = read.bytes;
    if (!buf.includes(Buffer.from(open, "utf8"))) {
        report("skipped", `${label} (no grugops block present)`);
        return NO_BLOCK_REMOVED;
    }
    const own = ownsBlock(rel);
    if (own.record === null) {
        report("left", `${label} (${own.reason})`);
        return NO_BLOCK_REMOVED;
    }
    const record = own.record;
    const matches = blockLineSpans(buf, open, close).filter((sp) => contentRecord(buf.subarray(sp.start, sp.end)) === record.block);
    if (matches.length === 0) {
        // One reason for every way a copy stops matching (red-team B1 wording): a line inside it added,
        // edited or removed, CRLF line ends, trailing spaces, a missing open or close line. Each is "the
        // block no longer matches what install recorded", never a claim about which line is missing.
        report("left", `${label} (the grugops block in it no longer matches the block install recorded appending — a line inside it ` +
            `was added, edited or removed, its line ends or spacing changed, or a marker line is missing — so nothing ` +
            `was removed and the file was left as it is; remove the grugops lines by hand, keeping any line of yours)`);
        return NO_BLOCK_REMOVED;
    }
    if (matches.length > 1) {
        report("left", `${label} (it holds ${matches.length} copies of the block install recorded appending, so which one install ` +
            `appended is not known; nothing was removed and the file was left as it is — remove the grugops lines by hand)`);
        return NO_BLOCK_REMOVED;
    }
    const cut = blockRemovalSpan(buf, matches[0], record);
    const result = Buffer.concat([buf.subarray(0, cut.start), buf.subarray(cut.end)]);
    const blankAfter = result.every(isBlankByte);
    const how = cut.separator || matches[0].start === 0
        ? "sentinel block only; rest of file preserved"
        : matches[0].end === buf.length
            ? "sentinel block only; rest of file preserved, including the newline before the block, which ends a line of yours"
            : "sentinel block only; rest of file preserved, including the newline before the block — the block is no longer at the end of the file, where install appended it, so which newline install added is not known";
    if (DRY_RUN) {
        report("would-remove", `${label} (${how})`);
        BLOCKS_GONE.add(rel);
        return { removed: true, blankAfter, before: buf, beforeMode: read.mode };
    }
    if (!rewritePath(f, result, label))
        return NO_BLOCK_REMOVED;
    BLOCKS_GONE.add(rel);
    report("removed", `${label} (${how})`);
    return { removed: true, blankAfter, before: buf, beforeMode: read.mode };
}
// removeOwnedEmptyFile (plan 33.1-28, Gap B / re-review WR-05, brief DC-2, D-18): delete a file that
// held a grugops sentinel block ONLY when all three hold:
//   1. THIS run removed a terminated block from it (`result.removed`, from removeSentinelBlock);
//   2. the file is blank after that removal (`result.blankAfter`: spaces, tabs, CR and LF only);
//   3. the install marker's `createdFiles` ledger records that install created it, and the file held
//      exactly what the record says install wrote there before this run removed the block (ownsFile;
//      red-team of plan 33.1-28, R1: a file the user re-made or edited since is not install's).
// It replaces a remover that deleted any whitespace-only file at the path and called it
// "grugops-created" with no record: a user's blank .github/copilot-instructions.md in a repository
// grugops never installed into was deleted. Presence and shape are not provenance. A file that fails
// condition 3 stays, blank, and is reported `left` with the reason the ledger state gives. A
// protected path is refused, and anything that is not a regular file inside the target is left by the
// one removal decision (removalDecision). Ownership and the decision are taken before the DRY_RUN
// branch, so the preview names exactly what the real run removes.
function removeOwnedEmptyFile(rel, label, result) {
    if (!result.removed || !result.blankAfter)
        return;
    const f = `${TARGET}/${rel}`;
    if (isProtected(f)) {
        report("refused", `${label} (protected path — never removed)`);
        return;
    }
    // The bytes AND the mode the file had before the block removal are compared with the record (red-team
    // L1 of plan 33.1-34): a file the user only chmod'ed is theirs to keep, blank or not.
    const own = ownsFile(rel, (record) => result.before !== null ? recordMatches(record, result.before, result.beforeMode) : { holds: false, why: null });
    if (!own.owned) {
        report("left", `${rel} (it is blank after the block removal, but ${own.reason})`);
        return;
    }
    const d = removalDecision(f, rel, null);
    if (reportDecision(d))
        return;
    const note = own.note === null ? "" : `; ${own.note}`;
    if (DRY_RUN) {
        report("would-remove", `${rel} (install created it — recorded as createdFiles — and it would be blank after the block removal${note})`);
        markGone(f);
        return;
    }
    unlinkPath(f, rel, `${rel} (install created it — recorded as createdFiles — and it is empty after the block removal${note})`);
}
// unmergeGemini (plan 33.1-29, Gap B / re-review CR-03, brief DC-2, D-18): reverse what install
// did to .gemini/settings.json, AS THE INSTALL MARKER'S geminiSettings RECORD SAYS, and nothing else.
//
// It used to decide by the file's text and shape: any file containing the substring "AGENTS.md" was
// parsed and its context.fileName rewritten, and a file of the shape CLAUDE.md itself recommends
// was deleted, in a repository grugops was never installed into. Neither the text nor the shape is a
// record of what install did. The decision now comes from the ledger (GEMINI_LEDGER, read once at the
// top of the removal sequence), in this order, before the file's content is read:
//   file absent                    → skipped (not present);
//   no marker                      → left (no record of what install changed);
//   unreadable marker              → left (the one unreadable-marker verify already counted it);
//   no geminiSettings field        → left (an install made before this ledger), with the remedy;
//   malformed geminiSettings       → left (its one verify at the top counted it);
//   addedEntry false               → skipped (install did not add the entry).
// Only then is the file read and parsed. A file that is not a readable regular file, does not parse
// or is not a JSON object is a counted verify and is left untouched, with no `removed` line. A file
// install created that still holds exactly the bytes install wrote is removed whole. Otherwise the
// recorded append is reversed exactly: the last "AGENTS.md" element is removed from an array fileName
// and the shape install found is restored (see the rules at the reversal below).
// GEMINI_LEDGER_AFTER (plan 33.1-29, with red-team R2 of plan 33.1-28): the geminiSettings record as it
// stands once unmergeGemini has acted, for removeMarker to write into a marker it keeps. Set only when
// the recorded change was reversed (or found already reversed): the record then claims nothing, and
// `fileNameContent` records the fileName left behind (null when there is none). null when nothing was
// acted on, so a kept marker keeps the record as it was.
let GEMINI_LEDGER_AFTER = null;
function unmergeGemini() {
    const f = `${TARGET}/.gemini/settings.json`;
    const rel = ".gemini/settings.json";
    if (isProtected(f))
        return;
    // DC-3 (plan 33.1-27): readForWrite, never a plain read. It opens only a regular file within the
    // bound, so asking it whether anything is there never blocks and never changes anything.
    const read = readForWrite(TARGET, f);
    if (read.state === "create") {
        report("skipped", `${rel} (not present)`);
        return;
    }
    if (MARKER.state === "absent") {
        report("left", `${rel} (no install marker, so there is no record of what install changed in it — left untouched)`);
        return;
    }
    if (MARKER.state === "unreadable") {
        report("left", `${rel} (the install marker could not be used (see the verify line above), so there is no usable record of what install changed in it — left untouched)`);
        return;
    }
    if (GEMINI_LEDGER.state === "absent") {
        report("left", `${rel} (the install marker predates the Gemini settings ledger — left untouched; if grugops added ` +
            `AGENTS.md to context.fileName, remove that entry by hand)`);
        return;
    }
    const ledger = GEMINI_LEDGER.ledger;
    if (GEMINI_LEDGER.state === "malformed" || ledger === null) {
        report("left", `${rel} (the Gemini settings ledger could not be used — see the verify line above; left untouched)`);
        return;
    }
    if (!ledger.addedEntry) {
        // Red-team B2 of plan 33.1-29: say why the record claims no entry, and only what is true.
        const why = ledger.noEntryReason;
        if (why === "reset") {
            report("left", `${rel} (the record of what install changed in it was reset: context.fileName changed after install wrote it, ` +
                `so whether an AGENTS.md entry in it is install's is not known — left untouched; remove AGENTS.md from ` +
                `context.fileName by hand if grugops added it)`);
        }
        else {
            const found = why === "already-listed"
                ? "AGENTS.md was already listed when install found the file"
                : why === "refused"
                    ? "install could not read or merge the file when it ran (that run printed a verify line) and added nothing"
                    : "an earlier uninstall already removed the entry install added";
            report("skipped", `${rel} (install did not add an AGENTS.md entry to it — ${found}; left untouched)`);
        }
        return;
    }
    if (read.state === "blocked") {
        verify(`${rel}: ${read.at} ${read.reason}. It was not read and was left untouched, so the AGENTS.md entry ` +
            `install recorded adding was not removed; remove it from context.fileName by hand.`);
        return;
    }
    // Red-team of plan 33.1-27 (B5): the file is parsed BEFORE the preview branch, so the preview and
    // the real run decide alike, and a file that does not parse, or is not a JSON object, is a COUNTED
    // verify with no `removed` line. Red-team B3 of plan 33.1-29: it is read as text (json-text.ts), so
    // the edit below removes only the recorded entry and keeps every other byte.
    const doc = readJsonText(read.bytes);
    if (!doc.ok || doc.root.kind !== "object") {
        verify(`${rel} ${doc.ok ? "is not a JSON object" : doc.why} — it was left untouched, so the AGENTS.md entry install recorded ` +
            `adding was not removed. Remove it from context.fileName by hand.`);
        return;
    }
    const root = doc.root;
    const ctxAt = memberNamed(root, "context");
    if (keyCount(root, "context") > 1 || (ctxAt !== null && keyCount(ctxAt.value, "fileName") > 1)) {
        verify(`${rel} has more than one "context" or "context.fileName" key, so which one Gemini CLI reads is not known — ` +
            `it was left untouched, so the AGENTS.md entry install recorded adding was not removed. Remove it by hand.`);
        return;
    }
    const claimsNothing = (noEntryReason, fileName) => ({
        createdFile: false,
        addedEntry: false,
        noEntryReason,
        fileNameContent: jsonValueRecord(fileName),
    });
    // Install created the file, and it holds exactly the bytes install wrote: it holds nothing of the
    // user's, so it is removed whole.
    // Its bytes AND its mode (red-team L1 of plan 33.1-34): a file the user only chmod'ed is not unchanged.
    const created = ledger.createdFile && ledger.fileContent !== undefined ? checkRecord(TARGET, f, ledger.fileContent) : null;
    if (created !== null && created.holds) {
        const line = `${rel} (install created it and it is unchanged — recorded as geminiSettings${created.modeChecked ? "" : `; ${NO_MODE_NOTE}`})`;
        if (DRY_RUN) {
            report("would-remove", line);
            markGone(f);
            GEMINI_LEDGER_AFTER = claimsNothing("reversed", undefined);
            return;
        }
        if (unlinkPath(f, rel, line))
            GEMINI_LEDGER_AFTER = claimsNothing("reversed", undefined);
        return;
    }
    const ctxNode = ctxAt === null ? null : ctxAt.value;
    const fnAt = ctxNode === null || ctxNode.kind !== "object" ? null : memberNamed(ctxNode, "fileName");
    const current = fnAt === null ? undefined : valueOf(doc.text, fnAt.value);
    // THE RECORD MUST HOLD (red-team B1 of plan 33.1-29, brief DC-2). The ledger's fileNameContent is
    // context.fileName as install left it, in the one serialisation (jsonValueRecord) install used. A
    // fileName that is not exactly that list — the user removed install's entry and wrote their own, or
    // the record was forged — proves nothing about which entry is install's, so nothing is edited.
    if (jsonValueRecord(current) !== ledger.fileNameContent) {
        const listsIt = current === "AGENTS.md" || (Array.isArray(current) && current.includes("AGENTS.md"));
        if (!listsIt) {
            report("skipped", `${rel} (context.fileName no longer lists AGENTS.md — the entry install added was already removed)`);
            GEMINI_LEDGER_AFTER = claimsNothing("reset", current);
            return;
        }
        report("left", `${rel} (context.fileName is not the list install recorded leaving there — it changed after install wrote it, or ` +
            `the record does not describe it — so which AGENTS.md entry is install's is not known; left untouched. Remove ` +
            `AGENTS.md from context.fileName by hand if grugops added it)`);
        return;
    }
    // THE EXACT REVERSAL OF THE RECORDED APPEND. The record holds, so fileName is the array install left.
    // Only an exact "AGENTS.md" element is removed, and only from an array fileName.
    if (ctxNode === null || fnAt === null || fnAt.value.kind !== "array" || !Array.isArray(current)) {
        report("left", `${rel} (context.fileName is no longer an array — left untouched; remove AGENTS.md from it by hand if grugops added it)`);
        return;
    }
    const arrNode = fnAt.value;
    const list = [...current];
    // The LAST exact element is the one install appended: install appends at the end, and only when no
    // "AGENTS.md" element was there. (A file install created lists it first; it is the only one there.)
    const at = list.lastIndexOf("AGENTS.md");
    list.splice(at, 1);
    // Restore the shape install found: an absent fileName is removed again, a string becomes the
    // string again, and a context install added is removed when nothing else is in it. The same
    // decision is made twice: on the parsed value (the oracle) and as one text edit.
    const j = documentValue(doc);
    const ctx = j.context;
    let newText;
    if (ledger.fileNameBefore === "absent" && list.length === 0) {
        delete ctx.fileName;
        if (ledger.createdContext === true && Object.keys(ctx).length === 0) {
            delete j.context;
            newText = removeItems(doc.text, root, new Set([root.members.findIndex((m) => m.key === "context")]));
        }
        else {
            newText = removeItems(doc.text, ctxNode, new Set([ctxNode.kind === "object" ? ctxNode.members.findIndex((m) => m.key === "fileName") : -1]));
        }
    }
    else if (ledger.fileNameBefore === "string" && list.length === 1 && typeof list[0] === "string" && arrNode.kind === "array") {
        ctx.fileName = list[0];
        newText = replaceWithText(doc.text, arrNode, arrNode.elements[at === 0 ? 1 : 0]);
    }
    else {
        ctx.fileName = list;
        newText = removeItems(doc.text, arrNode, new Set([at]));
    }
    const after = claimsNothing("reversed", Object.prototype.hasOwnProperty.call(ctx, "fileName") ? ctx.fileName : undefined);
    // Install created the file, and with the entry it added removed nothing is left in it.
    if (ledger.createdFile && Object.keys(j).length === 0) {
        const line = `${rel} (install created it, and with the AGENTS.md entry it added removed nothing is left in it — recorded as geminiSettings)`;
        if (DRY_RUN) {
            report("would-remove", line);
            markGone(f);
            GEMINI_LEDGER_AFTER = claimsNothing("reversed", undefined);
            return;
        }
        if (unlinkPath(f, rel, line))
            GEMINI_LEDGER_AFTER = claimsNothing("reversed", undefined);
        return;
    }
    // THE ORACLE: the edited text must hold exactly the reversed value; otherwise nothing is written.
    const check = readJsonText(Buffer.from(newText, "utf8"));
    if (!check.ok || !sameJsonValue(documentValue(check), j)) {
        verify(`${rel} could not be edited in place without changing anything but context.fileName — it was left untouched, ` +
            `so the AGENTS.md entry install recorded adding was not removed. Remove it by hand.`);
        return;
    }
    if (DRY_RUN) {
        report("would-edit", `${rel} (remove the AGENTS.md entry install added — recorded as geminiSettings)`);
        GEMINI_LEDGER_AFTER = after;
        return;
    }
    if (rewritePath(f, newText, rel, "remove AGENTS.md from context.fileName by hand.")) {
        report("removed", `${rel} AGENTS.md entry (install added it — recorded as geminiSettings; every other byte preserved)`);
        GEMINI_LEDGER_AFTER = after;
    }
}
// removeAskRules (D-18): reverse install.ts writeAskRules() BY PROVENANCE, not by presence.
//
// The ledger is the claudeAskRules field of .grugops/install.json, so this runs BEFORE
// removeMarker(). It removes exactly (ledger ∩ present) from permissions.ask. A user may hold a rule
// identical to one of ours; presence alone cannot say who added it, so a present rule that is not in
// the ledger is LEFT and reported (unmergeGemini follows the same rule since plan 33.1-29: it acts only
// on the geminiSettings record). A container is removed only when install created it (the ledger's
// created* flags) and it is empty again: the `ask` array, then the `permissions` object, then the
// file. Nothing is written when nothing changes, so a file this pass does not need to touch keeps
// its bytes.
//
// Fail closed: an unreadable marker, a malformed ledger, or a settings file that does not parse or
// has the wrong shape is a `verify` finding and NOTHING is removed. A marker without the field
// (an install that predates the ask rules) is a `skipped` line and nothing is removed. The marker
// and the ledger are read through ./install-marker.ts, the reader install.ts uses (WR-05); the
// marker itself was read once at the top of the removal sequence (MARKER).
//
// ONE OCCURRENCE PER LEDGER RULE (IN-02). The ledger records that install added a rule once. A
// further copy of the same rule in permissions.ask was added by someone else later, so only the
// first occurrence of each ledger rule is removed; every later copy is kept and reported `left`.
// ASK_LEDGER_AFTER (red-team of plan 33.1-28, R2): the ask-rule ledger as it stands once this pass
// has acted, for removeMarker to write into a marker it keeps. Set only when the pass reached the
// settings file's content (or found the file gone): every rule the ledger claimed is then removed or
// already absent, so the ledger claims nothing more, and askContent records the array as left. null
// when the pass did not act (no ledger, a verify), so a kept marker keeps its ledger as it was.
let ASK_LEDGER_AFTER = null;
const askLedgerAfter = (ask) => ({
    added: [],
    createdFile: false,
    createdPermissions: false,
    createdAsk: false,
    askContent: jsonValueRecord(ask === null ? undefined : ask),
});
// emptiedCreatedSettingsText (red-team L1 of plan 33.1-34): what removing the `permissions` member
// leaves of the file install writes when it creates .claude/settings.json (createdSettingsText, the one
// serialisation both binaries use), by the same text edit this pass makes. The rules inside the member
// do not change what is left, so the empty rule list stands for every one.
function emptiedCreatedSettingsText() {
    const created = readJsonText(Buffer.from(createdSettingsText([]), "utf8"));
    if (!created.ok || created.root.kind !== "object")
        return null;
    const at = created.root.members.findIndex((m) => m.key === "permissions");
    return removeItems(created.text, created.root, new Set([at]));
}
function removeAskRules() {
    const rel = ".claude/settings.json";
    const f = `${TARGET}/.claude/settings.json`;
    if (isProtected(f))
        return;
    if (MARKER.state === "absent") {
        report("skipped", `${rel} ask rules (no install marker, so no ledger of added rules — nothing removed)`);
        return;
    }
    if (MARKER.state === "unreadable") {
        verify(`${rel} ask rules — .grugops/install.json could not be used as install's marker (${MARKER.why}), so the ledger of rules ` +
            `grugops added is unknown and NO ask rule was removed. Remove the grugops ask rules by hand.`);
        return;
    }
    const askRead = readAskRuleLedger(MARKER.marker);
    if (askRead.state === "absent") {
        report("skipped", `${rel} ask rules (the install marker has no ask-rule ledger — the install predates the ask rules; nothing removed)`);
        return;
    }
    if (askRead.state === "malformed" || askRead.ledger === null) {
        verify(`${rel} ask rules — the ask-rule ledger in .grugops/install.json is malformed, so NO ask rule was ` +
            `removed. Remove the grugops ask rules by hand.`);
        return;
    }
    const led = askRead.ledger;
    const ledger = new Set(led.added);
    // DC-3 (plan 33.1-27): readForWrite, never a plain read; a blocked path is a counted verify and is
    // never written.
    const read = readForWrite(TARGET, f);
    if (read.state === "create") {
        report("skipped", `${rel} (not present — the ${ledger.size} ask rule(s) in the install ledger are already gone)`);
        ASK_LEDGER_AFTER = askLedgerAfter(null);
        return;
    }
    if (read.state === "blocked") {
        // A LEDGER THAT CLAIMS NOTHING IS NO RECORD FOR THE FILE (red-team B2 of plan 33.1-34, brief DC-2).
        // With no rule recorded as added and no part of the file recorded as created, there is nothing of
        // install's in it to remove, so a file this run cannot read is left without a verify.
        if (ledger.size === 0 && !led.createdFile && !led.createdPermissions && !led.createdAsk) {
            report("left", `${rel} (${read.at} ${read.reason}, so it was not read or changed; the install ledger records no ask rule ` +
                `added and no part of the file created, so there is nothing of install's in it to remove)`);
            return;
        }
        verify(`${rel}: ${read.at} ${read.reason}. It was not read and was left untouched; the ${ledger.size} ask ` +
            `rule(s) grugops added were NOT removed. Remove them by hand.`);
        return;
    }
    // Red-team B3 of plan 33.1-29 (D-18): read as text (json-text.ts), so the edit below removes only the
    // recorded rules (or the containers install created) and keeps every other byte of the user's file.
    const doc = readJsonText(read.bytes);
    if (!doc.ok || doc.root.kind !== "object") {
        verify(`${rel} ${doc.ok ? "is not a JSON object" : doc.why} — left untouched; the ${ledger.size} ask rule(s) grugops ` +
            `added were NOT removed. Fix the file, then re-run the uninstaller or remove them by hand.`);
        return;
    }
    const rootNode = doc.root;
    const permsAt = memberNamed(rootNode, "permissions");
    if (keyCount(rootNode, "permissions") > 1 || (permsAt !== null && keyCount(permsAt.value, "ask") > 1)) {
        verify(`${rel} has more than one "permissions" or "permissions.ask" key, so which one Claude Code reads is not known — ` +
            `left untouched; the ${ledger.size} ask rule(s) grugops added were NOT removed. Remove them by hand.`);
        return;
    }
    const json = documentValue(doc);
    const hasPermissions = Object.prototype.hasOwnProperty.call(json, "permissions");
    const perms = json.permissions;
    if (hasPermissions && (perms === null || typeof perms !== "object" || Array.isArray(perms))) {
        verify(`${rel} has a "permissions" value that is not an object — left untouched; no ask rule was removed.`);
        return;
    }
    const permissions = hasPermissions ? perms : null;
    const hasAsk = permissions !== null && Object.prototype.hasOwnProperty.call(permissions, "ask");
    if (hasAsk && !Array.isArray(permissions.ask)) {
        verify(`${rel} has a "permissions.ask" value that is not an array — left untouched; no ask rule was removed.`);
        return;
    }
    const ask = hasAsk ? permissions.ask : [];
    // IN-02: walk permissions.ask in order and take only the FIRST occurrence of each ledger rule.
    const toRemove = new Set(ledger);
    const removing = [];
    const removingAt = new Set();
    const keptAsk = [];
    const userCopies = [];
    for (const [k, x] of ask.entries()) {
        if (typeof x === "string" && toRemove.has(x)) {
            toRemove.delete(x);
            removing.push(x);
            removingAt.add(k);
            continue;
        }
        if (typeof x === "string" && ledger.has(x))
            userCopies.push(x);
        keptAsk.push(x);
    }
    const presentSet = new Set(ask.filter((x) => typeof x === "string"));
    for (const r of [...ledger].sort()) {
        if (!presentSet.has(r))
            report("skipped", `${r} (in the install ledger but not present in ${rel} — already removed)`);
    }
    const ours = new Set(allAskRules());
    for (const r of presentSet) {
        if (ours.has(r) && !ledger.has(r)) {
            report("left", `${r} (present in ${rel} but not in the install ledger — there is no record that install added this copy, so it ` +
                `is left in place; remove it by hand if grugops added it)`);
        }
    }
    for (const r of userCopies) {
        report("left", `${r} (a further copy in ${rel} beyond the one install added — the user's own copy, left in place)`);
    }
    // Compute the result without touching the parsed object, so a dry run and a no-op write nothing.
    let nextPermissions = permissions;
    if (permissions !== null && hasAsk) {
        nextPermissions = { ...permissions, ask: keptAsk };
        if (led.createdAsk && keptAsk.length === 0)
            delete nextPermissions.ask;
    }
    const next = { ...json };
    if (nextPermissions !== null) {
        next.permissions = nextPermissions;
        if (led.createdPermissions && Object.keys(nextPermissions).length === 0)
            delete next.permissions;
    }
    const nextPerms = next.permissions;
    const askLeft = nextPerms !== undefined && Array.isArray(nextPerms.ask) ? nextPerms.ask : null;
    // THE TEXT EDIT: the outermost container install created and that is now empty goes as one member;
    // otherwise only the removed rules go, each with its separator (json-text.ts removeItems).
    const permsNode = permsAt === null ? null : permsAt.value;
    const askAt = permsNode === null ? null : memberNamed(permsNode, "ask");
    const indexOf = (node, key) => new Set([node.kind === "object" ? node.members.findIndex((m) => m.key === key) : -1]);
    let newText = doc.text;
    if (permsNode !== null && !Object.prototype.hasOwnProperty.call(next, "permissions")) {
        newText = removeItems(doc.text, rootNode, indexOf(rootNode, "permissions"));
    }
    else if (permsNode !== null && askAt !== null && nextPerms !== undefined && !Object.prototype.hasOwnProperty.call(nextPerms, "ask")) {
        newText = removeItems(doc.text, permsNode, indexOf(permsNode, "ask"));
    }
    else if (askAt !== null) {
        newText = removeItems(doc.text, askAt.value, removingAt);
    }
    // "EMPTY" MEANS INSTALL'S OWN EMPTIED FILE, EXACTLY (red-team L1 of plan 33.1-34, brief DC-2). A file
    // install created is deleted only when what the edit above leaves is byte for byte what the same edit
    // leaves of the file install writes (checkpoint-ask-rules.ts createdSettingsText), and its mode is the
    // one install recorded. It used to be deleted whenever no key was left, so a whitespace-only edit of the
    // user's (an extra final newline, CRLF line ends) or a chmod was deleted with it. A ledger written
    // before the mode was recorded compares the text only, and the line says so.
    const emptiedText = emptiedCreatedSettingsText();
    const modeKept = led.fileMode === undefined || modeText(read.mode) === led.fileMode;
    const emptyAsInstalled = led.createdFile && Object.keys(next).length === 0 && newText === emptiedText;
    const deleteFile = emptyAsInstalled && modeKept;
    const keptCreated = led.createdFile && Object.keys(next).length === 0 && !deleteFile;
    const modeNote = led.fileMode === undefined ? `; ${NO_MODE_NOTE}` : "";
    const changed = removing.length > 0 || JSON.stringify(next) !== JSON.stringify(json);
    if (!changed && !deleteFile) {
        report("skipped", `${rel} (no ask rule from the install ledger is present — nothing to remove)`);
        ASK_LEDGER_AFTER = askLedgerAfter(askLeft);
        return;
    }
    const keptWhy = keptCreated
        ? `; grugops created the file, but ${modeKept ? "its text is not what install wrote (a whitespace or line-end edit)" : `its file mode is ${modeText(read.mode)}, not the ${led.fileMode} install wrote`}, so the file was kept`
        : "";
    // THE ORACLE: the edited text must hold exactly the value computed above; otherwise nothing is written.
    // Decided before the DRY_RUN branch, so the preview and the real run agree.
    const check = readJsonText(Buffer.from(newText, "utf8"));
    if (!deleteFile && (!check.ok || !sameJsonValue(documentValue(check), next))) {
        verify(`${rel} could not be edited in place without changing anything but the ask rules — left untouched; the ` +
            `${removing.length} ask rule(s) grugops added were NOT removed. Remove them by hand.`);
        return;
    }
    if (DRY_RUN) {
        report("would-remove", `${rel} (${removing.length} ask rule(s) grugops added${deleteFile ? `; the file grugops created would be deleted${modeNote}` : keptWhy})`);
        ASK_LEDGER_AFTER = askLedgerAfter(deleteFile ? null : askLeft);
        if (deleteFile) {
            markGone(f);
            rmdirIfEmpty(`${TARGET}/.claude`);
        }
        return;
    }
    if (deleteFile) {
        if (unlinkPath(f, rel, `${rel} (${removing.length} ask rule(s) grugops added; grugops created the file and it is now empty as install wrote it${modeNote})`)) {
            ASK_LEDGER_AFTER = askLedgerAfter(null);
            rmdirIfEmpty(`${TARGET}/.claude`);
        }
        return;
    }
    if (rewritePath(f, newText, rel)) {
        ASK_LEDGER_AFTER = askLedgerAfter(askLeft);
        report("removed", `${rel} (${removing.length} ask rule(s) grugops added; every other byte preserved${keptWhy})`);
    }
}
// remove_marker: remove ONLY the grugops-owned install marker .grugops/install.json (D-06). This
// is the single narrow exception to the .grugops/ protection in isProtected: the marker is the one
// grugops-owned file under .grugops/, while everything ELSE there (factory.config.json and
// anything the user adds) is seeded user state that must survive. So we do NOT route this through
// removeFile (which would — correctly — refuse a protected .grugops/ path); we remove this exact
// file by name, mirroring the "grugops-owned only" AGENTS.md shape.
//
// Never remove $GRUGOPS_HOME — the shared kit is depended on by other repos; removing it is a
// manual `rm` only (no --purge-kit this phase). Never remove .grugops/factory.config.json,
// plans/, or memory-bank/ — those are seeded user state. This touches exactly one named file.
//
// Uninstall-after-migrate (SC3, MIGR-01): uninstall makes NO special migrate-rollback move. By
// removing only the grugops-owned wiring + this marker while PRESERVING the migrate-created
// timestamped backups (agent-factory.bak.<ISO>/ and the config .bak inside it) and the seeded
// .grugops/ state, it leaves exactly the state the user's DOCUMENTED manual restore needs: rename
// the agent-factory.bak.<ISO>/ backup back to agent-factory/, restore the config .bak, and remove
// the migrate-seeded .grugops/factory.config.json. Those rollback steps are owned by the user and
// documented in install/README.md (### Migrating an existing install). No automated migrate-rollback
// logic lives here by design (minimal-change, never-delete-first).
//
// THE MARKER IS REMOVED ONLY WHEN THIS RUN COULD USE IT (red-team of plan 33.1-27, B4, brief DC-2).
// It is removed when MARKER (read once, before anything was removed) is `ok` AND every ledger in it
// is well-formed (malformedLedgers, by the readers the rest of this run trusts). A marker this run
// reported unreadable (not JSON, not an object, too large, a special file, a link at it or on the
// way) or holding a malformed ledger is the only record of what install did; deleting it would
// throw away what the human needs to finish the reversal by hand, right after telling them it
// could not be used. So it is left, with the reason, next to the verify line that already counted
// it. The decision is taken before the DRY_RUN branch, so the preview decides as the real run does.
//
// AND ONLY WHEN IT IS INSTALL'S OWN MARKER FOR THIS DIRECTORY (plan 33.1-33, brief DC-2, ownsMarker;
// red-team B2). A JSON object at this path whose fields do not hold install's values is a file the user
// put there; it used to be deleted by its name alone, in a repository grugops was never installed into.
// Install's marker for another directory (copied, moved, or written before markers were bound) is not
// this directory's record. Each is left, and the line says why.
function removeMarker() {
    const m = `${TARGET}/${MARKER_REL}`;
    if (!pathExists(m)) {
        report("skipped", `${MARKER_REL} (marker not present)`);
        return;
    }
    // DC-3 / D-18 (plan 33.1-27): install writes the marker as a regular file inside a real .grugops/
    // directory. Anything else there (a FIFO, a directory, a link, or a link on the way) is not the
    // marker install wrote, was never read (MARKER above says why), and is left in place.
    const way = wayTo(TARGET, m);
    const kind = kindAt(m);
    if ((way !== null && way !== "absent") || kind !== "regular file") {
        const what = way !== null && way !== "absent" ? `${way.at} ${way.reason}` : `it is a ${kind ?? "path that could not be read"}`;
        report("left", `${MARKER_REL} (${what}; not the marker install writes — left in place)`);
        return;
    }
    if (!ownsMarker()) {
        if (MARKER_READ.state === "unreadable" && MARKER_READ.jsonObject) {
            report("left", `${MARKER_REL} (${MARKER_READ.why} — so it is not install's; left in place)`);
            return;
        }
        if (MARKER_READ.state === "unbound") {
            report("left", `${MARKER_REL} (it is not this directory's record: ${MARKER_READ.why}; left in place — see the verify line above)`);
            return;
        }
        const why = MARKER_READ.state === "unreadable" ? MARKER_READ.why : "it was not present when this run started";
        report("left", `${MARKER_REL} (it could not be read as install's marker: ${why}; it was left in place — fix or remove it by hand)`);
        return;
    }
    // ownsMarker() holds only for an `ok` read, so MARKER is that read here; the check narrows the type.
    if (MARKER.state !== "ok")
        return;
    const bad = malformedLedgers(MARKER.marker);
    if (bad.length > 0) {
        report("left", `${MARKER_REL} (its ${bad.join(" and ")} ledger is malformed, so the record of what install did could not be used; ` +
            `it was left in place — fix or remove it by hand)`);
        updateKeptMarker(m, MARKER.marker, MARKER.bytes, bad);
        return;
    }
    if (DRY_RUN) {
        report("would-remove", `${MARKER_REL} (grugops-owned marker)`);
        return;
    }
    unlinkPath(m, MARKER_REL, `${MARKER_REL} (grugops-owned marker; seeded .grugops/ state preserved)`);
}
// updateKeptMarker (red-team of plan 33.1-28, R2, brief DC-2): a marker this run keeps (another ledger
// in it is malformed) must not go on naming what this run removed. It used to: the kept marker still
// listed AGENTS.md, the pointer files, the runnables, the directories and the ask rules the run had
// just removed, and when the user later made their own at those paths (README §1's copy of
// AGENTS.md, an empty .github/, their own `Bash(git push *)` rule) the next uninstall removed them on
// that record. So every well-formed ledger in it is rewritten without the entries this run removed
// (GONE_THIS_RUN, and the ask-rule ledger as removeAskRules left it); a malformed ledger and every
// other field are written back exactly as found, in their order. The write goes through the one
// rewrite (rewritePath), only after readForWrite (no link followed at the marker or on the way) shows
// the same regular file with the same bytes this run read at its start. When it cannot be written,
// that is a counted verify naming each entry it still lists, so the human can take them out by hand.
// The DRY_RUN preview says what it would take out and writes nothing.
function updateKeptMarker(m, marker, readBytes, bad) {
    // Only install's own marker is ever rewritten (plan 33.1-33, ownsMarker); removeMarker asked first.
    if (!ownsMarker())
        return;
    const next = { ...marker };
    const stale = [];
    const spent = [];
    const goneRel = (rel) => GONE_THIS_RUN.has(resolve(TARGET, ...rel.split("/")));
    if (!bad.includes("createdFiles") && FILE_LEDGER.state === "ok") {
        const keep = [...FILE_LEDGER.files].filter(([rel]) => !goneRel(rel));
        for (const [rel] of FILE_LEDGER.files)
            if (goneRel(rel))
                stale.push(rel);
        if (keep.length !== FILE_LEDGER.files.size)
            next.createdFiles = Object.fromEntries(keep);
    }
    if (!bad.includes("kitFiles") && KIT_LEDGER.state === "ok") {
        const keep = [...KIT_LEDGER.files].filter(([rel]) => !goneRel(rel));
        for (const [rel] of KIT_LEDGER.files)
            if (goneRel(rel))
                stale.push(rel);
        if (keep.length !== KIT_LEDGER.files.size)
            next.kitFiles = Object.fromEntries(keep);
    }
    // A SPENT FALLBACK IS RECORDED (red-team RT1 of plan 33.1-30, brief DC-2). A marker without kitFiles
    // (an install made before that ledger) grants the byte-identity fallback (ownsKitFile). This run has
    // been through the kit files under it: each was removed, or left with its reason and the manual
    // remedy. Kept as it was, the marker would grant the fallback again, and a kit file the user copies
    // in by hand afterwards (README §1's minimal path) would be removed by the next run. So the kept
    // marker records `kitFiles: {}`, a record that claims nothing: the fallback's authority ends here.
    // Every other ledger's absence grants nothing (createdDirs, createdFiles: no record, left;
    // geminiSettings, claudeAskRules: left untouched), so kitFiles is the one ledger this applies to.
    if (!bad.includes("kitFiles") && KIT_LEDGER.state === "absent") {
        next.kitFiles = {};
        spent.push("kitFiles recorded as {} — the marker had no kit-file ledger, and the byte-identity fallback it granted " +
            "is spent by this run");
    }
    // The appended-block ledger (plan 33.1-33): a block this run removed is no longer install's to remove.
    if (!bad.includes("appendedBlocks") && BLOCK_LEDGER.state === "ok") {
        const keep = [...BLOCK_LEDGER.blocks].filter(([rel]) => !BLOCKS_GONE.has(rel));
        for (const [rel] of BLOCK_LEDGER.blocks)
            if (BLOCKS_GONE.has(rel))
                stale.push(`${rel} (appendedBlocks)`);
        if (keep.length !== BLOCK_LEDGER.blocks.size)
            next.appendedBlocks = Object.fromEntries(keep.map(([rel, b]) => [rel, appendedBlockJson(b)]));
    }
    if (!bad.includes("createdDirs") && DIR_LEDGER.state === "ok") {
        const keep = DIR_LEDGER.dirs.filter((rel) => !goneRel(rel));
        for (const rel of DIR_LEDGER.dirs)
            if (goneRel(rel))
                stale.push(`${rel}/`);
        if (keep.length !== DIR_LEDGER.dirs.length)
            next.createdDirs = keep;
    }
    if (!bad.includes("claudeAskRules") && ASK_LEDGER_AFTER !== null) {
        const before = readAskRuleLedger(marker);
        const l = before.ledger;
        // Only a ledger that still claims something is rewritten; one that claims nothing stays as it is.
        const claims = l !== null && (l.added.length > 0 || l.createdFile || l.createdPermissions || l.createdAsk);
        if (before.state === "ok" && l !== null && claims) {
            for (const r of l.added)
                stale.push(r);
            next.claudeAskRules = ASK_LEDGER_AFTER;
        }
    }
    // The Gemini settings ledger (plan 33.1-29): once unmergeGemini acted on the recorded change (removed
    // the entry or the file, or found the entry already gone), the record claims nothing more.
    if (!bad.includes("geminiSettings") && GEMINI_LEDGER_AFTER !== null && GEMINI_LEDGER.state === "ok") {
        next.geminiSettings = geminiLedgerJson(GEMINI_LEDGER_AFTER);
        stale.push(".gemini/settings.json (geminiSettings)");
    }
    if (JSON.stringify(next) === JSON.stringify(marker))
        return;
    const what = stale.length > 0 || spent.length > 0 ? [...stale, ...spent].join(", ") : "the ask-rule ledger's created-file flags";
    const remedy = spent.length > 0
        ? `it still lists what this run removed (${what}); take those entries out of it and add "kitFiles": {} by hand, or a later run may act on them.`
        : `it still lists what this run removed (${what}); take those entries out of it by hand, or a later run may act on them.`;
    if (DRY_RUN) {
        report("would-edit", `${MARKER_REL} (kept; the entries this run would remove would be taken out of its ledgers: ${what})`);
        return;
    }
    const cur = readForWrite(TARGET, m);
    if (cur.state !== "ok" || !cur.bytes.equals(readBytes)) {
        verify(`${MARKER_REL} changed since this run read it, so it was not rewritten; ${remedy}`);
        return;
    }
    if (rewritePath(m, JSON.stringify(next, null, 2) + "\n", MARKER_REL, remedy)) {
        report("edited", `${MARKER_REL} (kept; the entries this run removed were taken out of its ledgers: ${what})`);
    }
}
// removeKitSkills (plan 33.1-30): the skills pass, at its old place in the removal sequence. Every
// removal asks removeFile's one decision and then ownsKitFile.
function removeKitSkills() {
    if (SRC_SKILLS === null) {
        verify(`.claude/skills/ — cannot read ${join(GRUGOPS_SRC, ".claude", "skills")}, so the removal set is unknown. ` +
            `No skill was removed. Remove any leftover grugops skill directories by hand.`);
        return;
    }
    for (const s of SRC_SKILLS) {
        const rel = `.claude/skills/${s}/SKILL.md`;
        const f = `${TARGET}/${rel}`;
        const src = join(GRUGOPS_SRC, ".claude", "skills", s, "SKILL.md");
        // The link install makes here (--symlink, a skill with no resolver slot) points at exactly this.
        if (pathExists(f))
            removeFile(f, rel, src, () => ownsKitFile(rel, f, src));
        else
            report("skipped", `${rel} (not present in the target — outside the removal set)`);
        rmdirIfEmpty(`${TARGET}/.claude/skills/${s}`);
    }
    rmdirIfEmpty(`${TARGET}/.claude/skills`);
}
// removeKitAdapters (plan 33.1-30): the adapters pass, at its old place in the removal sequence.
function removeKitAdapters() {
    if (SRC_ADAPTERS === null) {
        verify(`.claude/agents/ — cannot read ${join(GRUGOPS_SRC, ".claude", "agents")}, so the removal set is unknown. ` +
            `No adapter was removed. Remove any leftover grugops adapters by hand.`);
        return;
    }
    for (const a of SRC_ADAPTERS) {
        const rel = `.claude/agents/${a}`;
        const f = `${TARGET}/${rel}`;
        const src = join(GRUGOPS_SRC, ".claude", "agents", a);
        // Today install renders every adapter to a regular file; an install made before the render
        // linked an adapter to exactly this kit source path (linkOrCopy), so that link is still install's.
        if (pathExists(f))
            removeFile(f, rel, src, () => ownsKitFile(rel, f, src));
        else
            report("skipped", `${rel} (not present in the target — outside the removal set)`);
    }
    rmdirIfEmpty(`${TARGET}/.claude/agents`);
}
// reportKitBackups (plan 33.1-32, D-32, D-18): the backups install made of the user's edited kit
// files before it refreshed the kit, `<file>.grugops-edited-<UTC stamp>` beside the file. They hold
// the user's edits, so they are the user's: nothing records them, uninstall never removes or claims
// one, and each is reported `left` so the human knows where the edits are. It lists the names in
// .claude/agents/ and in each .claude/skills/grugops*/ (readdirSync: names only, no content read),
// each only when it is a real directory inside the target (no link on the way or at it). A directory
// holding a backup is not empty, so rmdirIfEmpty keeps it.
const KIT_BACKUP_INFIX = ".grugops-edited-";
const KIT_BACKUP_INCOMPLETE = ".incomplete";
function reportKitBackups() {
    const realDir = (d) => wayTo(TARGET, d) === null && isDir(d);
    const names = (d) => {
        try {
            return readdirSync(d).sort();
        }
        catch {
            return [];
        }
    };
    const dirs = [];
    const agents = `${TARGET}/.claude/agents`;
    if (realDir(agents))
        dirs.push(agents);
    const skills = `${TARGET}/.claude/skills`;
    if (realDir(skills)) {
        for (const n of names(skills)) {
            if (n.startsWith("grugops") && realDir(`${skills}/${n}`))
                dirs.push(`${skills}/${n}`);
        }
    }
    for (const d of dirs) {
        for (const n of names(d)) {
            if (!n.includes(KIT_BACKUP_INFIX))
                continue;
            // A name ending in `.incomplete` is a copy install could not finish (red-team W1 of plan 33.1-32:
            // install writes a byte backup under this name and gives it the backup name only when it is
            // whole). It is not a backup of the edit, so it is never called one.
            // WHAT THE RUN PROVED (red-team L3 of plan 33.1-34, "No fabrication"). Nothing records the backups
            // install makes, so a name is all this run saw: the line says the name matches install's pattern and
            // claims nothing about who made the file. It used to call any such file "a backup install made", in
            // a repository with no marker too, and to tell the user to remove an `.incomplete`-named file by
            // hand, which would delete a file of theirs that only shares the name. Install does not record its
            // backups (the one record authority would need a sixth ledger; the brief asks for fewer), so the
            // wording is what changed.
            if (n.endsWith(KIT_BACKUP_INCOMPLETE)) {
                report("left", `${d}/${n} (its name matches the name install gives a backup copy of an edited kit file that it could not ` +
                    `finish (<file>${KIT_BACKUP_INFIX}<UTC stamp>${KIT_BACKUP_INCOMPLETE}); nothing records that install made ` +
                    `it, so it is not claimed or removed — if install made it, it is not a full copy of the edit)`);
            }
            else {
                report("left", `${d}/${n} (its name matches the name install gives a backup of an edited kit file ` +
                    `(<file>${KIT_BACKUP_INFIX}<UTC stamp>); nothing records that install made it, so it is not claimed or ` +
                    `removed — if install made it, it holds your edit)`);
            }
        }
    }
}
// sameFileBytes: byte-identical content compare following symlinks (mirrors `cmp -s`). Used for
// the grugops-owned-AGENTS.md test and the runnables, each followed by the createdFiles record check
// (ownsFileNow → checkRecord), which refuses a hard link. The legacy kit-file fallback no longer uses
// it (red-team RT2 of plan 33.1-30): it reads the target file through readOwnedContent. DC-3 (plan 33.1-27): both sides are read through readUserFile, so a FIFO, directory or
// device on either side (the kit source included) is never opened; the answer is "the same" only when
// BOTH reads are `ok` and their bytes are equal. That one guard serves every caller.
function sameFileBytes(a, b) {
    const ra = readUserFile(a);
    if (ra.state !== "ok")
        return false;
    const rb = readUserFile(b);
    if (rb.state !== "ok")
        return false;
    return ra.bytes.equals(rb.bytes);
}
// ---------------------------------------------------------------------------
// SELF-CHECKOUT GUARD (ALWAYS-ON) — the reversal half of install.ts's D-07 guard, closing CR-04.
//
// install/README.md publishes ONE exit-code list for BOTH binaries, and its code-1 row names a
// self-checkout refusal. Until this block existed the installer implemented that refusal and this
// file did not — it had no exit-1 path at all (only 2 for bad usage and 3 for incomplete). The
// consequence was reproduced, not theorised: `uninstall.js --target <a grugops checkout>` removed
// the kit's own 17 committed adapters and 7 committed skills, deleted the repo's AGENTS.md, stripped
// its CLAUDE.md pointer block — and printed `== uninstall complete ==` with exit 0. isProtected()
// below covers agent-factory/, plans/, .planning/, .grugops/, docs/ and src/, but NOT .claude/,
// which is exactly where those committed adapters and skills live. Widening isProtected() to cover
// .claude/ is not the fix: .claude/ is the directory this uninstaller legitimately empties in a
// normal target, so protecting it would break every ordinary reversal. The right boundary is the
// TARGET, refused as a whole and early.
//
// Placed here: after TARGET and GRUGOPS_SRC are resolved, BEFORE the run banner, the kit-set
// derivation and every removal — so a refused run writes nothing to stdout at all, and "it changed
// nothing" is unambiguous rather than inferred from a banner that also prints on success paths.
// Always-on, exactly like install.ts's: it is a mechanical safety check, not a prompt, so DRY_RUN
// does not exempt it and neither does any other mode.
//
// THE MARKER HALF IS NOT WRITTEN HERE (D-37, closing WR-02). It is hasSourceMarkers() in
// ./kit-source.ts, imported above with the other derivations, and install.ts calls the SAME
// function. This block used to carry its own byte-identical copy of the two marker strings — the
// exact hand-synced-duplicate shape D-28 had already deleted for the skill and adapter derivations
// twenty lines from here, left standing. Round 1 corrected the pair (install.ts's half had tested
// for `install/install.sh`, deleted in f9dab9f with the POSIX installer, D-09, so it could never
// fire) but corrected the LITERAL rather than the absence of a forcing function. Now there is one
// constant and a case that asserts its entries exist in the real repository. The choice-of-pair
// reasoning and the runtime-artifact argument live with the constant, not restated here.
//
// The equality half stays HERE, and it resolves the target before comparing. abspath() above
// deliberately does not collapse `.`/`..` (sh byte-parity), so `--target /path/to/grugops/.` would
// otherwise slip past a raw string compare; TARGET itself is left exactly as computed, and only
// this comparison normalises. install.ts's equality half does NOT normalise — the two binaries
// resolve the target differently on purpose, so that half is not shared and must not be merged.
//
// Clear professional voice, never caveman — this is a safety surface.
// ---------------------------------------------------------------------------
if (!ALLOW_SELF) {
    const toPosix = (p) => p.replace(/\\/g, "/");
    const looksLikeSource = toPosix(resolve(TARGET)) === toPosix(GRUGOPS_SRC) || hasSourceMarkers(TARGET);
    if (looksLikeSource) {
        process.stderr.write(`refusing: target looks like the grugops source checkout (${TARGET}) — uninstalling here would ` +
            `delete the kit's own committed adapters and skills under .claude/. You probably meant ` +
            `--target <your-repo>. Pass --allow-self to override.\n`);
        process.exit(1);
    }
}
console.log("== grugops uninstall ==");
console.log(`target: ${TARGET}`);
console.log(`source: ${GRUGOPS_SRC}`);
if (DRY_RUN)
    console.log("mode:   DRY_RUN (no filesystem changes)");
// ORDERING HAZARD (T-27-06): derive the removal set from the KIT SOURCE here, at the very TOP of
// the removal sequence, BEFORE anything is removed. The uninstall sequence also tears down grugops
// wiring, so a derivation taken later in the sequence could come back empty and silently orphan
// every file it was supposed to remove.
const SRC_SKILLS = srcSkillNames(GRUGOPS_SRC);
const SRC_ADAPTERS = srcAdapterFiles(GRUGOPS_SRC);
// The directory ledger (CR-02), read ONCE here, before anything is removed and before removeMarker()
// deletes the marker that holds it. ownsDir() consults it for every empty directory this run visits.
// A malformed ledger or an unreadable marker is one `verify` finding, and no empty directory is
// removed: each is left for the human.
// Red-team of plan 33.1-27 (B3): read without following a link (install-marker.ts says why). A link
// at the marker or on the way to it is `unreadable`, so no ledger that is not this target's own is
// ever believed.
//
// THE MARKER MUST BE INSTALL'S OWN, FOR THIS DIRECTORY (plan 33.1-33, brief DC-2; red-team B2 of plan
// 33.1-33). MARKER_READ is what is at the path, as the one reader both binaries ask
// (install-marker.ts readInstallMarker) classifies it: `ok` only for a marker whose fields hold
// install's values AND whose `target` is this directory's real path. ownsMarker() is that `ok`.
//   - A JSON object whose fields do not hold install's values (a user's file, a hand-made marker with
//     empty strings or an installMode of "banana") is `unreadable` with jsonObject: it is not install's.
//     Read as a marker, it used to look like an install made before every ledger: the kit-file fallback
//     removed the verbatim skills while removeMarker deleted the file by its name.
//   - Install's marker shape for ANOTHER directory, or one written before markers carried `target`, is
//     `unbound`. Its ledgers describe the directory it was written in: a `.grugops/` copied from another
//     installed repository into one that took README §1's copy path made this run remove the user's
//     AGENTS.md, their runnable and their tools/grugops/ on the copied records. The binding is the real
//     path, so a moved or renamed repository reads as unbound too; the verify below gives the remedy.
// MARKER, the read every pass consults, treats both as a marker that could not be used: no ledger in it
// is believed, nothing is removed on it, and it is left in place.
const MARKER_READ = readInstallMarker(TARGET);
function ownsMarker() {
    return MARKER_READ.state === "ok";
}
const MARKER = MARKER_READ.state === "unbound" ? { state: "unreadable", marker: null, why: MARKER_READ.why, jsonObject: true } : MARKER_READ;
const DIR_LEDGER = readCreatedDirs(MARKER.state === "ok" ? MARKER.marker : null);
// The file ledger (plan 33.1-28, Gap B / re-review WR-05), read ONCE here with the directory ledger
// and from the same marker read. ownsFile() consults it before any file install may have created is
// deleted. An unreadable marker is still ONE verify finding, naming both ledgers.
const FILE_LEDGER = readCreatedFiles(MARKER.state === "ok" ? MARKER.marker : null);
// The Gemini settings ledger (plan 33.1-29, Gap B / re-review CR-03), read ONCE here from the same
// marker read. unmergeGemini() edits or deletes .gemini/settings.json only as it records. A malformed
// one is one verify finding, and the settings file is left untouched.
const GEMINI_LEDGER = readGeminiLedger(MARKER.state === "ok" ? MARKER.marker : null);
// The kit-file ledger (plan 33.1-30, Gap B completed), read ONCE here from the same marker read.
// ownsKitFile() consults it before any grugops skill or adapter file is removed. A malformed one is one
// verify finding, and no kit file is removed.
const KIT_LEDGER = readKitFiles(MARKER.state === "ok" ? MARKER.marker : null);
// The appended-block ledger (plan 33.1-33, red-team carry items 4, 6, 11), read ONCE here from the same
// marker read. removeSentinelBlock() removes a pointer block only as it records. A malformed one is one
// verify finding, and no pointer block is removed.
const BLOCK_LEDGER = readAppendedBlocks(MARKER.state === "ok" ? MARKER.marker : null);
const LEDGER_NAMES = `the directory ledger (createdDirs), the file ledger (createdFiles), the Gemini settings ledger (geminiSettings), ` +
    `the kit-file ledger (kitFiles) and the appended-block ledger (appendedBlocks)`;
if (MARKER_READ.state === "unbound") {
    const here = MARKER_READ.here ?? TARGET;
    verify(`.grugops/install.json is install's marker, but not this directory's record: ${MARKER_READ.why}. So none of its ` +
        `records is used here (${LEDGER_NAMES}), and this run removes and edits nothing on it. If this is the same ` +
        `repository moved or renamed${MARKER_READ.boundTo !== null ? ` from ${MARKER_READ.boundTo}` : ""}, set "target" in the marker to ` +
        `${JSON.stringify(here)} and re-run uninstall. Otherwise re-run install.js here: it writes a marker for this ` +
        `directory and carries none of these records, so what an earlier install made here is then left and reported, ` +
        `for you to remove by hand.`);
}
else if (MARKER.state === "unreadable") {
    verify(`.grugops/install.json ${markerUnusableText(MARKER)}, so the directory ledger (createdDirs), ` +
        `the file ledger (createdFiles), the Gemini settings ledger (geminiSettings), the kit-file ledger (kitFiles) ` +
        `and the appended-block ledger (appendedBlocks) are unknown. No empty directory, no file install may have ` +
        `created, no grugops skill or adapter file and no pointer block is removed, and .gemini/settings.json is not ` +
        `edited — remove them by hand once you have confirmed they are yours to remove.`);
}
else {
    if (DIR_LEDGER.state === "malformed") {
        verify(`.grugops/install.json has a malformed directory ledger (createdDirs), so which directories install ` +
            `created is unknown. No empty directory install may have created is removed — remove it by hand once ` +
            `you have confirmed it is yours to remove.`);
    }
    if (FILE_LEDGER.state === "malformed") {
        verify(`.grugops/install.json has a malformed file ledger (createdFiles), so which files install created is ` +
            `unknown. No file install may have created is deleted — remove such a file by hand once you have ` +
            `confirmed it is yours to remove.`);
    }
    if (GEMINI_LEDGER.state === "malformed") {
        verify(`.grugops/install.json has a malformed Gemini settings ledger (geminiSettings), so what install changed ` +
            `in .gemini/settings.json is unknown. The file is left untouched — if grugops added AGENTS.md to its ` +
            `context.fileName, remove that entry by hand.`);
    }
    if (KIT_LEDGER.state === "malformed") {
        verify(`.grugops/install.json has a malformed kit-file ledger (kitFiles), so what install wrote to the grugops ` +
            `skill and adapter files is unknown. No grugops skill or adapter file is removed — remove each by hand ` +
            `once you have kept any edit you want.`);
    }
    if (BLOCK_LEDGER.state === "malformed") {
        verify(`.grugops/install.json has a malformed appended-block ledger (appendedBlocks), so which pointer blocks ` +
            `install appended is unknown. No grugops block is removed from CLAUDE.md or the Copilot file — remove it ` +
            `by hand, keeping any line of yours.`);
    }
}
console.log("\n-- removing grugops adapters (only what install.js added) --");
// 1. Skills + empty dirs. Derived from the kit source, intersected with the target: a skill the
//    kit ships but the target never had is reported and skipped, never "removed". Each one present is
//    removed only while ownsKitFile allows it (plan 33.1-30): an edited skill is left and reported.
removeKitSkills();
// 2. Adapters + empty dir. Same contract: the set comes from the kit source and is intersected with
//    the target, so a user-authored file in .claude/agents/ is never in the removal set and
//    survives; an adapter at a kit path is removed only while ownsKitFile allows it (plan 33.1-30).
//    The directory itself is only rmdir'd when it is empty, so a surviving file also keeps it.
removeKitAdapters();
// Every backup install made of an edited kit file (D-32, plan 33.1-32) is reported left, never removed.
reportKitBackups();
rmdirIfEmpty(`${TARGET}/.claude`);
// 3. AGENTS.md — remove ONLY a grugops-laid-down one (symlink into source, or byte-identical
//    copy of the source AGENTS.md). A user's own AGENTS.md is never removed.
//
//    BY RECORD, THEN BY CONTENT (plan 33.1-28, brief DC-2, red-team carry #2). The content test alone
//    is not provenance: README §1's minimal path copies the kit's AGENTS.md into a repository by hand,
//    so a byte-identical copy (or a link to the checkout's AGENTS.md) in a repository grugops was never
//    installed into was deleted. It is removed only when the `createdFiles` ledger records that install
//    created it (ownsFile) AND it is still install's link or a byte-identical copy; with no record it is
//    left and the reason is said. The ownership question is asked before removeFile's DRY_RUN branch,
//    so the preview decides as the real run does.
function removeGrugopsAgentsMd() {
    const agents = `${TARGET}/AGENTS.md`;
    const srcAgents = join(GRUGOPS_SRC, "AGENTS.md");
    const agentsNotOwned = (reason) => report("left", `AGENTS.md (it matches the grugops kit, but ${reason})`);
    if (isProtected(agents)) {
        // never
    }
    else if (isSymlink(agents)) {
        // A symlink is removed ONLY if it is the link install makes: readlink equals exactly the source
        // AGENTS.md path (isOwnLink, the predicate install uses; red-team of plan 33.1-27, B2). It used to
        // follow the link and compare what it resolved to, so any link whose target held the same bytes
        // was removed. A user's own AGENTS.md symlink (e.g. AGENTS.md -> docs/agents.md) is left untouched,
        // as is any other link, and it is never followed.
        const own = ownsFileNow("AGENTS.md");
        if (!isOwnLink(agents, srcAgents)) {
            report("skipped", "AGENTS.md (user-owned symlink — left untouched)");
        }
        else if (!own.owned) {
            agentsNotOwned(own.reason);
        }
        else {
            removeFile(agents, "AGENTS.md (grugops symlink into source)", srcAgents);
        }
    }
    else if (isFile(agents) && isFile(srcAgents) && sameFileBytes(srcAgents, agents)) {
        const own = ownsFileNow("AGENTS.md");
        if (!own.owned)
            agentsNotOwned(own.reason);
        else
            removeFile(agents, `AGENTS.md (grugops copy, byte-identical to source${own.note === null ? "" : `; ${own.note}`})`, null);
    }
    else if (!pathExists(agents)) {
        report("skipped", "AGENTS.md (not present)");
    }
    else if (!isFile(agents)) {
        report("left", `AGENTS.md (it is a ${kindAt(agents) ?? "path that could not be examined"}, not a file install writes — left untouched)`);
    }
    else {
        // WHAT THE RUN PROVED (red-team L3 of plan 33.1-34). It differs from this kit version's AGENTS.md;
        // "user-owned or modified" claimed more than that. With a record that still holds, install wrote it
        // (another grugops version); otherwise it may be the user's own, an earlier version's, or edited.
        const own = FILE_LEDGER.state === "ok" && FILE_LEDGER.files.has("AGENTS.md") ? ownsFileNow("AGENTS.md") : null;
        if (own !== null && own.owned) {
            report("left", "AGENTS.md (it holds what install wrote there, but it differs from this kit version's AGENTS.md (it is from " +
                "another grugops version) — left untouched; remove it by hand if you no longer want it)");
        }
        else {
            report("left", "AGENTS.md (it differs from this kit version's AGENTS.md (it may be your own, from an earlier grugops version, " +
                "or edited) — left untouched)");
        }
    }
}
removeGrugopsAgentsMd();
// 4. CLAUDE.md sentinel block (preserve the rest of the user's file), and the file itself only when
//    install created it (createdFiles), this run removed its block and it is blank afterwards: the
//    same rule as the Copilot file (removeOwnedEmptyFile, plan 33.1-28, D-18). A CLAUDE.md install
//    created is reversed rather than left behind as an empty file; one the user had, blank or not,
//    is never deleted.
removeOwnedEmptyFile("CLAUDE.md", "CLAUDE.md", removeSentinelBlock("CLAUDE.md", CLAUDE_OPEN, CLAUDE_CLOSE, "CLAUDE.md start-here pointer"));
// 5. Gemini settings entry.
unmergeGemini();
rmdirIfEmpty(`${TARGET}/.gemini`);
// 5b. Claude Code ask rules (D-18), removed by the install ledger. MUST run before removeMarker():
//     the ledger lives in .grugops/install.json.
console.log("\n-- removing grugops Claude Code ask rules (only what install.js added) --");
removeAskRules();
// 6. Copilot pointer block, and the file itself only when install created it (createdFiles), this
//    run removed its block and it is blank afterwards (removeOwnedEmptyFile, plan 33.1-28). Uses the
//    Copilot-specific sentinel (WR-05), not the CLAUDE.md one.
removeOwnedEmptyFile(COPILOT_REL, COPILOT_REL, removeSentinelBlock(COPILOT_REL, COPILOT_OPEN, COPILOT_CLOSE, `${COPILOT_REL} pointer`));
rmdirIfEmpty(`${TARGET}/.github`);
// 7. The kit-shipped RUNNABLES the installer materializes into the user's repository (WR-04,
//    plan 27-13). This pass is the missing half of the installer's reversibility constraint: before
//    it, install.ts's materializeRunnable() wrote tools/grugops/*.js into the user's repo and this
//    file never mentioned tools/ at all, so those files were installed and never removed.
//
//    THE MAPPING IS MIRRORED FROM THE INSTALLER, NOT RE-DERIVED FROM THE TARGET. Listing whatever
//    happens to be in the target's tools/grugops/ and deleting it would delete the user's own files
//    — the same data-loss shape the adapter pass avoids by deriving from the kit source. This is a
//    source→dest MAPPING (not a discovery set), so a literal is the right shape for it; it is kept
//    byte-identical to install.ts's RUNNABLES, and each file points at the other in a comment.
//
//    GUARDED TWICE, because these files land OUTSIDE the directories this uninstaller normally
//    owns:
//      1. every candidate goes through removeFile(), which checks the isProtected denylist BEFORE
//         touching anything, so no frozen-core or user-data path is reachable from this pass; and
//      2. a file is removed ONLY when its bytes are identical to the source it was installed from.
//         A user-edited helper is PRESERVED and the skip is reported with its reason — the exact
//         mirror of the installer's own never-overwrite rule for the same file (T-27-60).
//    An unreadable/missing SOURCE is a verify finding, not a silent skip: without the source we
//    cannot establish byte identity, so we cannot safely remove, and the human must be told.
// KIT_VERSION_DIFFERS (red-team L3 of plan 33.1-34): the one wording of a file that differs from this
// kit version's copy with no record showing who wrote it. It may be from an earlier grugops version or
// edited; nothing this run read says which, so neither is claimed.
const KIT_VERSION_DIFFERS = "it differs from this kit version's file (it may be from an earlier grugops version, or edited)";
const RUNNABLES_MIRROR = [
    ["scripts/runnable-ref/reference-check.js", "tools/grugops/reference-check.js"],
    ["scripts/runnable-ref/test-skip-integrity.js", "tools/grugops/test-skip-integrity.js"],
    ["scripts/runnable-ref/uat-spec-integrity.js", "tools/grugops/uat-spec-integrity.js"],
    ["scripts/runnable-ref/host-protection.js", "tools/grugops/host-protection.js"],
];
console.log("\n-- removing grugops runnables (only what install.js materialized) --");
function removeMaterializedRunnables() {
    for (const [srcRel, destRel] of RUNNABLES_MIRROR) {
        const src = `${GRUGOPS_SRC}/${srcRel}`;
        const dest = `${TARGET}/${destRel}`;
        // Red-team of plan 33.1-27 (B2, B3): the one removal decision is asked FIRST, without following a
        // link. install writes a runnable as a regular file and never links one, so a link here (even to a
        // byte-identical file, which the compare below would follow) is not install's and is left and
        // counted; a link or non-directory on the way is a verify; a special file is left and said. Only a
        // regular file inside the target reaches the byte compare.
        const decision = removalDecision(dest, destRel, null);
        if (decision.act === "absent" || decision.act === "refused") {
            reportDecision(decision);
            continue;
        }
        // THE RECORD IS ASKED FIRST (red-team B2 of plan 33.1-34, brief DC-2). A runnable install has no
        // record of creating is left, whatever is there, and the line says only what this run saw: a user's
        // link at the path, or a `tools` that is a link to the user's own directory, used to be a verify
        // here, so a repository grugops was never installed into finished INCOMPLETE (exit 3).
        const recorded = FILE_LEDGER.state === "ok" && FILE_LEDGER.files.has(destRel);
        if (!recorded) {
            const why = notRecordedReason(FILE_LEDGER, "file");
            if (decision.act !== "remove") {
                report("left", `${destRel} (it is not a regular file inside the target, so it was not read or changed; ${why})`);
            }
            else if (isFile(src) && sameFileBytes(src, dest)) {
                report("left", `${destRel} (it is byte-identical to its source, but ${why})`);
            }
            else {
                report("left", `${destRel} (${KIT_VERSION_DIFFERS}, and ${why})`);
            }
            continue;
        }
        if (reportDecision(decision))
            continue;
        // DC-3 (plan 33.1-27): a dest that is not a readable regular file is never opened and never a
        // candidate for removal; say what it is rather than calling it user-modified.
        const destRead = readUserFile(dest);
        if (destRead.state !== "ok" && destRead.state !== "absent") {
            report("left", `${destRel} (${unreadState(destRead)} — it was not read, and it was left in place)`);
            continue;
        }
        if (!isFile(src)) {
            verify(`${destRel} — cannot read the source it was installed from (${src}), so byte identity cannot ` +
                `be established and the file was NOT removed. Remove it by hand once you have confirmed it ` +
                `is unmodified.`);
            continue;
        }
        // Plan 33.1-28 (brief DC-2): byte identity is not provenance. A runnable is removed only when the
        // `createdFiles` ledger records that install created it and it still holds that record (bytes and,
        // since red-team L1 of plan 33.1-34, mode), and it is byte-identical to this kit version's source.
        const own = ownsFileNow(destRel);
        if (!own.owned) {
            report("left", `${destRel} (${own.reason})`);
            continue;
        }
        // WHAT THE RUN PROVED (red-team L3 of plan 33.1-34): the record shows install wrote these bytes, and
        // they differ from this kit version's file, so it is from another grugops version. "user-modified"
        // was not shown by anything.
        if (!sameFileBytes(src, dest)) {
            report("left", `${destRel} (it holds what install wrote there, but it differs from this kit version's file (it is from ` +
                `another grugops version) — left untouched; remove it by hand if you no longer want it)`);
            continue;
        }
        removeFile(dest, `${destRel} (grugops runnable, byte-identical to source${own.note === null ? "" : `; ${own.note}`})`, null);
    }
    // Only the CONTAINING directory, and only when empty — never a recursive removal.
    rmdirIfEmpty(`${TARGET}/tools/grugops`);
    // tools/ itself is deliberately NOT removed, even when the pass above just left it empty, and even
    // when the install marker's `createdDirs` ledger records that install created it (re-review IN-01,
    // plan 33.1-28). tools/ is an ordinary directory name a project is very likely to own itself: install
    // created it only as a side effect of creating tools/grugops/, and a project may start using it for
    // its own files between the install and the uninstall without that showing in any record. So the
    // ledger entry is not used for tools/, and the line says so rather than implying there is no record.
    // It is REPORTED as left rather than passing silently, so the one artifact this pass cannot reverse
    // is visible to the reader.
    if (isDir(`${TARGET}/tools`)) {
        report("left", "tools/ (grugops owns tools/grugops/ only — the directory itself is left in place, even when the install " +
            "marker records that install created it)");
    }
}
removeMaterializedRunnables();
// 8. The grugops-owned install marker (D-06). Removes ONLY .grugops/install.json via the narrow
//    named exception; the rest of .grugops/ (seeded user state) is protected and survives. The
//    .grugops/ dir is intentionally NOT rmdir'd — the seeded factory.config.json keeps it
//    populated, and even an empty .grugops/ is the user's state dir, not grugops' to remove.
//    Never remove $GRUGOPS_HOME — the shared kit is shared across repos; manual rm only.
removeMarker();
console.log("\n-- preserved (never touched) --");
console.log("  agent-factory/  plans/  .planning/  docs/  src/  .grugops/ (seeded state; only the");
console.log("  install.json marker is removed)  the shared kit at $GRUGOPS_HOME  and every user file.");
// THE CLOSING CLAIM IS CONDITIONAL (27-13) — the same rule as install.ts's banner. A run that could
// not read a source directory has skipped a whole removal class; saying "complete" over that is a
// claim it did not earn. The `verify` lines above name what was left behind and what to do about it.
if (VERIFY_FINDINGS > 0) {
    console.log(`\n== uninstall INCOMPLETE — ${VERIFY_FINDINGS} item(s) need verification` +
        `${DRY_RUN ? " (DRY_RUN — nothing changed)" : ""} ==`);
    console.log("  Each `verify` line above names what was NOT removed and the remedy for it.");
    // THE MACHINE-READABLE HALF OF THE CONDITIONAL CLAIM (27-21, WR-01) — the same rule and the same
    // code list as install.ts's tail: 0 complete, 1 refused or aborted, 2 bad usage, 3 incomplete.
    // Set on the SAME branch that prints the banner so the two signals cannot diverge. The two
    // banners were written as one rule; applying the exit code to only one half would leave the pair
    // disagreeing.
    //
    // AND THE CLAIM ABOVE IS NOW TRUE, WHICH IT WAS NOT WHEN IT WAS FIRST WRITTEN (D-41, WR-01). The
    // paragraph above has always asserted that the human-readable banner and the machine-readable
    // status CANNOT DIVERGE. Under the immediate-exit form they could, and this file kept that form
    // for a whole round after D-35 fixed its twin — so the comment asserted a parity the code beneath
    // it did not have, which is worse than no comment: a reader who trusts it stops checking.
    //
    // THE MECHANISM THAT MAKES THE PARITY REAL, STATED HERE RATHER THAN ASSUMED. Node's
    // `process.stdout` is ASYNCHRONOUS when it is a PIPE, and terminating the process immediately
    // discards whatever is still queued on it. That drops the human-readable half — up to and
    // INCLUDING the banner three lines above — while the status is delivered by the kernel and always
    // survives. So the two signals diverged in exactly one direction: a machine saw INCOMPLETE and a
    // human saw nothing, silently, and only on a pipe (CI, `uninstall.js | tee`, any wrapping
    // script), which is why a terminal never showed it. Measured on the installer's identical tail:
    // 8 runs, 2 truncated at 223102 and 520729 bytes against a full 1065689, status 3 intact in all
    // eight. Assigning the code instead lets Node flush stdout and exit on its own, so the banner and
    // the status are delivered by the same completion rather than racing it — and a chained
    // `uninstall.js && next-step` still stops, because the code is still SET.
    //
    // SAFE HERE FOR THE SAME REASON IT WAS SAFE THERE, CONFIRMED BY READING RATHER THAN ASSUMED: the
    // if/else this closes is the LAST statement of this module, so setting the code and falling off
    // the end is byte-for-byte the same control flow. The two OTHER sites in this file are mid-script
    // and are deliberately NOT swept — they rely on stop-here semantics, and converting them blindly
    // would let the script RUN ON past a refusal, a worse defect than the one being fixed.
    //
    // DO NOT SPELL THE OLD CALL ANYWHERE IN THIS FILE, EVEN IN PROSE — the same rule install.ts's
    // tail carries and for the same reason. The regression case in install.test.ts is a deliberately
    // DUMB exact-substring scan across all four artifacts, because a scan smart enough to tell code
    // from a comment is a parser and a parser that can under-match is the failure this phase has
    // shipped repeatedly. The scan stays exact and the prose works around it.
    process.exitCode = 3;
}
else {
    console.log(`\n== uninstall complete${DRY_RUN ? " (DRY_RUN — nothing changed)" : ""} ==`);
}
