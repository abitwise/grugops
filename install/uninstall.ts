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
// THE REMOVAL SEQUENCE IS A WALK OVER THE INSTALL LEDGER (plan 33.1-38, review WR-01, D-33 (b)).
// Uninstall used to ask "what does this checkout's kit source ship?" and remove those names. A file
// install recorded that the uninstalling checkout does not ship (another grugops version, another
// checkout) was then left unnamed while the marker that recorded it was deleted, exit 0. Now uninstall
// asks the record "what did install write here?": walkLedger visits every entry of the one install
// ledger (`.grugops/install.json`, read once as LEDGER), in a fixed kind order, and hands each entry to
// its kind's reversal. Every reversal asks the ONE authority, install-marker.ts owns(LEDGER, TARGET,
// path, kind), before it deletes or edits anything. The kit source never decides a removal.
//   ask-rules  reverseAskRules → removeAskRules: exactly the rules the entry records as added (the first
//              present copy of each), and the containers install created, once empty as install wrote
//              them (D-18). A user's own identical rule is never removed.
//   gemini     reverseGemini → unmergeGemini: only while context.fileName still equals the recorded list,
//              the AGENTS.md entry install appended to a file it found, or, in a file install created,
//              the whole list it wrote (and `context` when nothing else is in it; plan 33.1-39, WR-03);
//              the file only when install created it and it holds the recorded bytes, or nothing is left
//              once what install wrote is removed (and its mode is still the one install recorded).
//   block      reverseBlock → removeSentinelBlock: the one span of CLAUDE.md or the Copilot file whose
//              bytes hash to the recorded block, and every other byte written back (carry items 4, 6,
//              11). When the ledger also has a `file` entry at that path (install created the pointer
//              file), removeOwnedEmptyFile deletes it only when this run removed its block, it is blank
//              afterwards, and its bytes before the block removal held the file entry.
//   file       reverseFile: a skill, an adapter, AGENTS.md, a runnable, removed while owns answers
//              owned (its bytes and mode, or its exact link, as recorded; no link followed; a hard link
//              refused). A `link:` record names the link's own target, so a --symlink install is reversed
//              from any checkout. An edited or replaced file is left byte for byte and named.
//   backup     reportBackup: a backup install made is user content; it is reported `left`, never removed.
//   dir        reverseDir → rmdirIfEmpty, deepest first, after every file: a recorded directory, only
//              when it is empty and this run emptied it (GONE_THIS_RUN). tools/ is never removed, and the
//              seeded per-repo state (.grugops/, plans/, memory-bank/) is never visited for removal.
// Each reversal records the entry's outcome in OUTCOMES (`<path>#<kind>`), for the marker rule.
//
// ONE AGENT AT A TIME (phase 34.1, D-05, D-20, D-23). `uninstall.js --codex` (the same per-agent flags as install.js)
// walks only the entries inScope answers yes for: an agent it removes owns the entry and no agent that stays installed
// owns it (host-tools.ts entryOwners, over the registry's ADAPTER_FOOTPRINT). The installed set is the one derivation
// install-marker.ts installedAgents answers, never what is on disk. The shared footprint (no owner: AGENTS.md,
// tools/grugops/, a pre-34.1 gemini entry) is reversed only by a flag-less run or by the removal of the last installed
// agent, and a partial run keeps the marker for the agents that stay, rewritten (updateKeptMarker, `agents`).
//
// THE REPORT-ONLY PASSES remove nothing. reportUnrecordedKitPaths, reportUnrecordedAgentsMd,
// reportUnrecordedRunnables, reportUnrecordedBlock, reportUnrecordedSettings and reportUnrecordedDir
// name a present grugops-shaped path that has no ledger entry as `left`, with the reason, and call no
// removal helper. The kit source is read only to word those lines; when it cannot be read, a `note`
// says the report was skipped, and that is not a verify, because no removal depends on it. Kit-file
// backups (`<file>.grugops-edited-<UTC stamp>`, D-32) are reported `left` by reportKitBackups.
// Finally the .grugops/install.json marker (the one grugops-owned file under .grugops/ — D-06) is
// removed only when owns(LEDGER, TARGET, MARKER_REL, "marker") answers owned (install's own marker for
// this directory, holding a well-formed ledger) AND its record is discharged (markerDischarged).
//
// THE MARKER RULE (plan 33.1-39, review WR-02; this applies D-33 (b)). The marker is the only record of
// what install wrote. A run that could not finish used to delete it anyway (exit 3, a verify per adapter
// under a read-only .claude/agents, and the marker gone), so the README's "fix the cause and re-run" found
// no record and left everything as unrecorded. Now the marker is removed only when no verify was counted
// inside the ledger walk for a recorded entry (RECORDED_VERIFIES) and every file, block, gemini and
// ask-rules entry was removed, reversed, or found already gone, or claims nothing. Otherwise it is kept
// and rewritten from OUTCOMES to list only what is still there (updateKeptMarker), so fixing the cause and
// re-running uninstall finishes the reversal. A run that keeps it only because a recorded file was left by
// design (an edited file), with no verify, exits 0 and its banner says how many recorded items were left.
//
// DIRECTORY AND BACKUP ENTRIES DO NOT HOLD THE MARKER (a named narrowing of D-33 (b)'s "while any recorded
// entry is left", for the human to confirm at plan 33.1-43). A directory holds no content of install's own
// (its files are their own entries); tools/ is never removed by design, and a recorded directory left
// non-empty holds someone else's files, so counting directories would keep the marker after every clean
// round trip. A backup holds the user's content, which uninstall never removes. Both are still reported,
// and a kept marker still lists those that are present. The side effect: once uninstall removes the
// marker, the recorded backups lose their record, so `--prune-old-kit` can no longer remove them (it then
// reports them as unrecorded); install/README.md says to prune before uninstall.
//
// It NEVER deletes agent-factory/, plans/, .planning/, docs/, src/, the seeded per-repo state
// (.grugops/factory.config.json, plans/, memory-bank/), the shared kit at $GRUGOPS_HOME, or any
// user file. Those paths are guarded explicitly; only the install.json marker may be removed from
// under the otherwise-protected .grugops/, via a narrow named exception (removeMarker decides, and the
// closing prints what it did from the MarkerOutcome it returns, plan 34-26). Removing the shared
// $GRUGOPS_HOME kit is a manual `rm` (no --purge-kit flag this phase). Honors DRY_RUN=1.
//
// Every report/warn/error string stays CLEAR PROFESSIONAL VOICE — safety surface, never caveman.
//
// Usage:
//   node install/uninstall.js                       # remove grugops adapters from the current repo
//   node install/uninstall.js --allow-self          # override the self-checkout guard (CR-04)
//   node install/uninstall.js --codex               # remove one agent: only what the ledger records for it (D-05)
//   DRY_RUN=1 node install/uninstall.js             # preview only
//   GRUGOPS_SRC=/path TARGET=/path node install/uninstall.js

import { existsSync, writeFileSync, unlinkSync, rmdirSync, readdirSync, lstatSync } from "node:fs";
import { dirname, join, relative, resolve, isAbsolute } from "node:path";
import { homedir } from "node:os";
// KIT-02 / D-28: the ONE derivation of "what is in the kit source", shared with install.ts. Since plan
// 33.1-38 it decides no removal (the ledger walk does); it only words the report of unrecorded
// grugops-shaped paths, and hasSourceMarkers serves the self-checkout guard. Node stdlib only, sibling
// module inside install/, so this binary still runs on a host with nothing installed.
import { srcSkillNames, srcAdapterFiles, hasSourceMarkers } from "./kit-source.js";
// D-18: the one declaration of the Claude Code ask rules, shared with install.ts. Used here only to
// NAME a present rule the user holds (a grugops-shaped rule that is not in the install ledger); the
// removal set itself comes from the ledger, never from this list and never from string presence.
import { allAskRules, createdSettingsText } from "./checkpoint-ask-rules.js";
// D-33 (b), plan 33.1-36: the ONE reader of the install marker and of the one install ledger
// (readLedger), its one serializer (ledgerJson) and the one ownership authority (owns), shared with
// install.ts (WR-05).
import {
  MARKER_REL,
  readInstallMarker,
  readLedger,
  ledgerJson,
  entryAt,
  entriesOfKind,
  owns,
  notRecordedReason,
  geminiEntry,
  askRulesEntry,
  GEMINI_SETTINGS_REL,
  createdGeminiText,
  createdOpenCodeText,
  ASK_RULES_REL,
  BLOCK_RELS,
  blockLineSpans,
  markerUnusableText,
  markerRemedy,
  markerFixText,
  markerDefectText,
  noMarkerRemedy,
  contentRecord,
  recordMatches,
  NO_MODE_NOTE,
  modeText,
  modeMatches,
  recordedModeOf,
  checkRecord,
  jsonValueRecord,
  type AskRuleLedger,
  type GeminiLedger,
  type NoEntryReason,
  type AppendedBlock,
  type LedgerEntry,
  type LedgerRead,
  type InstallMarkerRead,
  type Ownership,
  type FileEntry,
  type BackupEntry,
  installedAgents,
  AGENTS_FIELD,
  entryHolds,
  agentsToRecord,
  wholeFileEntryRels,
} from "./install-marker.js";
// Red-team B3 of plan 33.1-29 (D-18): the ONE way a JSON file the user owns is edited, as text. A
// removal deletes exactly the span install's insertion added; see the module header. No I/O.
import { readJsonText, keyCount, memberNamed, valueOf, documentValue, removeItems, replaceWithText, sameJsonValue, firstDuplicateKey, type JsonNode } from "./json-text.js";
// DC-3 (plan 33.1-27): the ONE bounded reader of a user path, shared with install.ts. readForWrite is
// its no-follow form for a path this run may edit, wayTo the same walk for a path removed by name,
// and kindAt names what is at a path. isOwnLink is
// the one "this link is the link install makes" predicate, shared with install.ts, and gone is the
// one "nothing is there any more" check a removal is reported by (red-team of plan 33.1-27).
import { readUserFile, readForWrite, wayTo, kindAt, isOwnLink, gone, canonicalPathSpelling } from "./user-file.js";
// Phase 34.1, D-05: the one registry of agents (pure data). agentFlag and hostForFlag are the one spelling of a
// per-agent flag, shared with install.ts; entryOwners is the one answer to "which agents own this ledger entry";
// ADAPTER_FOOTPRINT gives the report pass its directory candidates (reportDirCandidates).
import { HOST_TOOLS, HOST_ADAPTER_KINDS, ADAPTER_FOOTPRINT, OPENCODE_CONFIG_REL, agentFlag, hostForFlag, entryOwners, agentCommand, commandContextFromRecord, contextKitHome, type CommandContext, type HostTool, type HostAdapterKind } from "./host-tools.js";

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
let USAGE_ERROR: string | null = null;
// REMOVE (phase 34.1, D-05): the registry ids the agent flags name, so `--codex` removes only what the install ledger
// records for Codex CLI. Empty when no agent flag is given: the run removes everything, as before this phase.
const REMOVE = new Set<string>();
let flagHost: HostTool | null = null;
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
  } else if (a === "--allow-self" || a === "--force") {
    ALLOW_SELF = true;
  } else if ((flagHost = hostForFlag(a)) !== null) {
    // D-05: the same per-agent flags as install.js (host-tools.ts agentFlag, hostForFlag). Each names an agent whose
    // recorded files this run removes; what it may remove is decided after the ledger is read (inScope below).
    REMOVE.add(flagHost.id);
  } else {
    USAGE_ERROR = `unknown argument: ${a}`;
    break;
  }
}
if (USAGE_ERROR !== null) {
  process.stderr.write(`uninstall.js: ${USAGE_ERROR}\n`);
  process.exit(2);
}
/**
 * rerunCommand (plan 34.1-14, D-26; brief MSG-1): this run's own command, built by host-tools.ts agentCommand from the
 * parsed flags (the HOST_TOOLS rows whose id is in REMOVE, in registry order), for a verify whose remedy is "fix the
 * cause, then run this again". It is built from the arguments, so it is right before any marker read, and it never
 * widens a per-agent run into a flag-less one (a flag-less uninstall removes every agent, D-05).
 */
function rerunCommand(): string {
  return agentCommand("uninstall.js", TARGET, HOST_TOOLS.filter((h) => REMOVE.has(h.id)), COMMAND_CONTEXT);
}
/**
 * reinstallCommand (plan 34.1-25, D-33, review WR-20; brief MSG-1): the install step of the unusable-marker remedies,
 * built by host-tools.ts agentCommand from this run's flags (the HOST_TOOLS rows whose id is in REMOVE, in registry
 * order, as rerunCommand) with COMMAND_CONTEXT. The marker that install writes then records the agents this run names,
 * so the follow-up uninstall (rerunCommand) names agents the new marker records and does not find them "not installed
 * here". A flag-less run gives the flag-less install command. It is printed only over a marker this run cannot use, so
 * its kit home is this run's (the GRUGOPS_HOME it was given, else the default `~/.grugops`), never the unusable
 * marker's, and it is a copy-mode install, because an uninstall run has no install mode (D-36, review WR-22; see
 * COMMAND_CONTEXT). No value from an `unbound` marker reaches it.
 */
function reinstallCommand(): string {
  return agentCommand("install.js", TARGET, HOST_TOOLS.filter((h) => REMOVE.has(h.id)), COMMAND_CONTEXT);
}
/**
 * NO_FLAG_INSTALL_CLAUSE (plan 34.1-26, D-33): THE ONE WORDING of what install does with no agent flag, printed after
 * reinstallCommand() by both unusable-marker verifies when this run names no agent (REMOVE is empty, so the printed
 * install command carries no agent flag). It states install.ts's selection chain (SELECTION_WHY): at a terminal the
 * agent list; otherwise the agents detected here (an unusable marker records no installed set, so install falls to
 * detection); with none detected, refuseSelection, which names every agent flag. Empty on a per-agent run, whose
 * install command names this run's agents.
 */
const NO_FLAG_INSTALL_CLAUSE =
  REMOVE.size === 0
    ? " (with no agent flag, install chooses the agents detected here, shows the agent list at a terminal, or refuses and names the agent flags)"
    : "";

const SCRIPT_DIR = import.meta.dirname;
const GRUGOPS_SRC = process.env.GRUGOPS_SRC ? resolve(process.env.GRUGOPS_SRC) : resolve(SCRIPT_DIR, "..");
const DRY_RUN = process.env.DRY_RUN === "1";

// abspath: resolve a (possibly not-yet-existing) path to an absolute one without requiring the
// leaf to exist (mirrors uninstall.sh's abspath — Security V5: validate to absolute before use).
// uninstall.sh's abspath does NOT collapse `.`/`..`; it only prefixes a relative path with cwd.
const abspath = (p: string): string => (isAbsolute(p) ? p : `${process.cwd()}/${p}`);

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

const report = (label: string, msg: string): void => console.log(`  ${label.padEnd(14)} ${msg}`);

// verify (27-13): a `verify`-status finding — something the run could NOT do and the human must
// resolve. Byte-identical in shape to install.ts's verify(), and it COUNTS the findings for the
// same reason: neither half may claim success over a no-op it did not perform. The uninstaller
// already reported an unreadable source directory; what it also did was print
// "== uninstall complete ==" immediately afterwards, which is the same repudiation failure the
// installer had, wearing the other hat.
let VERIFY_FINDINGS = 0;
const verify = (msg: string): void => {
  VERIFY_FINDINGS += 1;
  report("verify", msg);
};

// GONE_THIS_RUN (red-team of plan 33.1-28, R1/R2, brief DC-2): every path this run removed, or, in
// DRY_RUN, would remove, resolved. rmdirIfEmpty removes an empty directory only when this run emptied it
// (an entry of it is in this set), and in DRY_RUN it counts an entry this run would remove as gone, so the
// preview decides as the real run does. (A kept marker is rewritten from OUTCOMES, plan 33.1-39.)
const GONE_THIS_RUN = new Set<string>();
const markGone = (p: string): void => {
  GONE_THIS_RUN.add(resolve(p));
};

// OUTCOMES (plan 33.1-38): what the ledger walk did with each entry, keyed `<path>#<kind>`. Every
// reversal sets its entry's outcome, so the marker rule (plan 33.1-39, WR-02) can tell whether any
// recorded entry is still in place:
//   removed   the path was removed (in DRY_RUN: would be);
//   gone      nothing of install's was there any more (absent, or the entry records nothing to undo);
//   reversed  the recorded edit was undone (a block, the Gemini entry, the ask rules);
//   left      the path was left in place, with a `left` line (or, for a seeded or non-empty directory,
//             by the rule that never removes it);
//   verify    the path could not be shown to be install's or could not be changed; a verify line says so.
type Outcome = "removed" | "gone" | "reversed" | "left" | "verify";
const OUTCOMES = new Map<string, Outcome>();
const outcomeKey = (e: { readonly path: string; readonly kind: string }): string => `${e.path}#${e.kind}`;
const setOutcome = (e: { readonly path: string; readonly kind: string }, o: Outcome): void => {
  OUTCOMES.set(outcomeKey(e), o);
};

// RECORDED_VERIFIES (plan 33.1-39, review WR-02): the verify lines counted inside the ledger walk, that is,
// by a reversal of a recorded entry. It is kept apart from VERIFY_FINDINGS (every verify of the run) because
// the marker rule asks only whether something install recorded could not be finished; walkLedger sets it.
let RECORDED_VERIFIES = 0;

// THE MARKER RULE (plan 33.1-39, review WR-02, D-33 (b)). The marker is the only record of what install
// wrote, so it is removed only once that record is discharged: no verify was counted for a recorded entry,
// and every entry whose content install wrote (file, block, gemini, ask-rules, opencode-permission) was removed, reversed, or
// found already gone, or claims nothing. Directory and backup entries do not hold it (see the header). Which entries hold
// is answered once, by install-marker.ts entryHolds (plan 34.1-14 moved HOLDING_KINDS there), which agentsToRecord asks too.
const DISCHARGED: ReadonlySet<Outcome> = new Set<Outcome>(["removed", "gone", "reversed"]);
/**
 * The recorded entries still holding the marker: install wrote content there, and this run did not discharge it. On a
 * partial run (phase 34.1, D-05) only the entries this run may reverse (inScope) are asked: the others belong to the
 * agents that stay installed, and the marker is kept for them anyway.
 */
function heldEntries(): LedgerEntry[] {
  return LEDGER.entries.filter((e) => {
    if (!entryHolds(e) || !inScope(e)) return false;
    const o = OUTCOMES.get(outcomeKey(e));
    return o === undefined || !DISCHARGED.has(o);
  });
}
/** The paths of the entries still holding the marker (heldEntries), once each, sorted: what the kept `left` line names. */
function heldPaths(): string[] {
  return [...new Set(heldEntries().map((e) => e.path))].sort();
}
/** True only when the marker's record is discharged: no recorded verify, and no entry still holds it. */
function markerDischarged(): boolean {
  return RECORDED_VERIFIES === 0 && heldEntries().length === 0;
}
// KEPT_FOR (plan 33.1-39): the number of recorded paths left in place by design (no verify) for which
// removeMarker kept the marker; the closing banner says so. 0 when the marker was removed or not kept for that.
let KEPT_FOR = 0;

// ---------------------------------------------------------------------------
// The kit source's skill and adapter names (KIT-02 / T-27-06, D-28). The derivation lives in
// ./kit-source.ts and both installers import it, so this file never holds a hand-synced copy of it.
//
// IT NO LONGER DECIDES ANY REMOVAL (plan 33.1-38, review WR-01, D-33 (b)). It used to be the removal
// set: a file install recorded that this checkout's kit source does not ship was never visited, and was
// left unnamed while the marker that recorded it was deleted. Removal is now the walk over the install
// ledger (walkLedger), whatever this checkout ships. The names are read only to REPORT a present
// grugops-shaped path the ledger does not record (reportUnrecordedKitPaths). They are still read from
// the kit source and never from the target: listing the target's .claude/agents/ would name the user's
// own agent files.
//
// Both helpers return NULL, not [], when the source directory cannot be read. That is a `note`, not a
// verify: only the report of unrecorded paths is skipped, and no removal depends on it.
//
// ONLY the two derivations this file USES are imported. srcNestedAdapterFiles() is not among them: a
// nested source adapter is refused by the installer and never installed. The source root is passed
// EXPLICITLY on every call (D-22).
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
function isProtected(p: string): boolean {
  const protectedDirs = ["agent-factory", "plans", ".planning", ".grugops", "docs", "src"];
  for (const d of protectedDirs) {
    const base = `${TARGET}/${d}`;
    if (p === base || p.startsWith(`${base}/`)) return true;
  }
  // the repo root itself (with or without a trailing slash) is off-limits
  if (p === TARGET || p === `${TARGET}/`) return true;
  return false;
}

// pathExists: true if the path exists OR is a (possibly dangling) symlink — mirrors the sh
// `[ -e "$_f" ] || [ -L "$_f" ]` test. existsSync follows links (false for a dangling link), so a
// dangling link must be detected via lstat.
function pathExists(p: string): boolean {
  if (existsSync(p)) return true;
  try {
    lstatSync(p);
    return true; // present as a (possibly dangling) symlink
  } catch {
    return false;
  }
}

const isSymlink = (p: string): boolean => {
  try {
    return lstatSync(p).isSymbolicLink();
  } catch {
    return false;
  }
};

const isFile = (p: string): boolean => {
  try {
    return lstatSync(p).isFile();
  } catch {
    return false;
  }
};

const isDir = (p: string): boolean => {
  try {
    return lstatSync(p).isDirectory();
  } catch {
    return false;
  }
};

// errCode: the error code a thrown fs error carries, or "UNKNOWN".
const errCode = (e: unknown): string => {
  const code = (e as { code?: unknown }).code;
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
function unlinkPath(f: string, label: string, removedLine: string): boolean {
  try {
    unlinkSync(f);
  } catch (e) {
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
function rewritePath(f: string, text: string | Buffer, label: string, remedy = "make the change by hand."): boolean {
  try {
    writeFileSync(f, text);
    return true;
  } catch (e) {
    verify(`${label}: ${f} could not be rewritten (${errCode(e)}). It was left as it was; ${remedy}`);
    return false;
  }
}

// THE REMOVAL DECISION for a path this run removes by name (red-team of plan 33.1-27, B1/B2). ONE
// function decides, before the DRY_RUN branch, so the preview and the real run reach the same answer
// for every path; the caller only prints (`would-remove`) or acts (unlinkPath).
//   refused  a protected path (never removed);
//   absent   nothing there, or a directory on the way is missing;
//   verify   a link or a non-directory on the way (a removal would land outside the target), or a
//            symbolic link at the path that is not the link install makes. `ownLink` is the exact
//            target install's link has there (the kit source path linkOrCopy links to), or null
//            where install never makes a link (a rendered adapter or skill is a regular file, a
//            runnable is a regular file). The link is checked with isOwnLink, the predicate install
//            uses to call a link its own. Any other link (a loop, a dangling link, a link to a
//            device, a FIFO, a directory or a file elsewhere) may be the user's or an older
//            install's, so it is left in place and counted: removing it would delete content this
//            run cannot show install made, and following it would reach outside the target;
//   left     a directory or a special file at the path: not something install writes;
//   remove   a regular file or install's own link (and the file still needs its content record:
//            removeFile acts only on the owns answer reverseFile handed it, plan 33.1-38).
type RemovalDecision =
  | { readonly act: "refused" | "absent" | "verify" | "left"; readonly line: string }
  | { readonly act: "remove" };

function removalDecision(f: string, label: string, ownLink: string | null): RemovalDecision {
  if (isProtected(f)) return { act: "refused", line: `${label} (protected path — never removed)` };
  const way = wayTo(TARGET, f);
  if (way === "absent") return { act: "absent", line: `${label} (not present)` };
  if (way !== null) {
    return { act: "verify", line: `${label}: ${way.at} ${way.reason}. The path was not removed; remove it by hand if it is grugops's.` };
  }
  const kind = kindAt(f);
  if (kind === null) {
    return gone(f)
      ? { act: "absent", line: `${label} (not present)` }
      : { act: "verify", line: `${label}: ${f} could not be examined. It was not removed; remove it by hand if it is grugops's.` };
  }
  if (kind === "regular file") return { act: "remove" };
  if (kind === "symbolic link") {
    if (ownLink !== null && isOwnLink(f, ownLink)) return { act: "remove" };
    const install = ownLink === null ? "install never makes a link here" : `the link install makes here points at ${ownLink}`;
    return {
      act: "verify",
      line:
        `${label}: ${f} is a symbolic link that is not the one install makes (${install}). It was left in place ` +
        `and not followed; remove it by hand if it is grugops's.`,
    };
  }
  return { act: "left", line: `${label} (it is a ${kind}, not a file install writes — left in place)` };
}

/** Print a non-remove decision; true when the caller should stop. */
function reportDecision(d: RemovalDecision): d is Exclude<RemovalDecision, { act: "remove" }> {
  if (d.act === "remove") return false;
  if (d.act === "verify") verify(d.line);
  else report(d.act === "absent" ? "skipped" : d.act, d.line);
  return true;
}

// remove_file: delete a single file or install's own link, by the one decision above. Never recursive.
// A HELPER, reached only from reverseFile (plan 33.1-38): `owns` hands it the answer reverseFile got from
// the one authority, owns(LEDGER, TARGET, rel, "file"), before it called this (the parameter shadows the
// import on purpose: this helper asks nothing else). It removes nothing on any other evidence. The answer is taken before the DRY_RUN branch, so the preview decides as the real run
// does; a path it does not own is left and reported with its reason.
//
// THE RECORD IS ASKED FIRST (red-team B2 of plan 33.1-34, brief DC-2). A path install has no record of
// writing is left, whatever is there. A verify about what is at the path is reported only when install
// has a record for it and the path cannot be read or is not what install wrote (removalDecision: a link
// or a non-directory on the way, a link that is not install's, a path that could not be examined), which
// is when the human has something to resolve. A protected path is still refused first.
function removeFile(f: string, label: string, ownLink: string | null, owns: () => Ownership<"file">): Outcome {
  const own = owns();
  if (!isProtected(f) && !own.owned && !own.recorded) {
    report("left", `${label} (${own.reason})`);
    return "left";
  }
  const d = removalDecision(f, label, ownLink);
  if (reportDecision(d)) return d.act === "verify" ? "verify" : d.act === "absent" ? "gone" : "left";
  if (!own.owned) {
    report("left", `${label} (${own.reason})`);
    return "left";
  }
  // A runnable keeps its kind in the line (the wording plan 33.1-36 gave it).
  const kind = /^tools\/grugops\/[^/]+\.js$/.test(canonicalPathSpelling(relative(TARGET, f))) ? "grugops runnable, " : "";
  const how = ownLink !== null ? `${kind}install's link to ${ownLink}, recorded in the install ledger` : `${kind}recorded in the install ledger`;
  const line = `${label} (${how}${own.note !== null ? `; ${own.note}` : ""})`;
  if (DRY_RUN) {
    report("would-remove", line);
    markGone(f);
    return "removed";
  }
  return unlinkPath(f, label, line) ? "removed" : "verify";
}

// reverseFile (plan 33.1-38, review WR-01, D-33 (b)): THE ONE REMOVAL OF A RECORDED FILE. Every `file`
// entry of the ledger that is not a pointer file (see reverseBlock) comes here: a skill, an adapter,
// AGENTS.md, a runnable. It asks the one authority first, owns(LEDGER, TARGET, path, "file"): owned only
// while the path still holds the entry's content record (its bytes and mode for a file, its exact
// readlink for a link; no link followed on the way; a hard link refused). The kit source of the checkout
// running uninstall is never consulted: a recorded file it does not ship is removed on its record, and
// one it ships with other bytes is still removed while it holds what install wrote. `ownLink` comes from
// the entry's own `link:` record (the link's target as install made it), never from this checkout, so a
// --symlink install is reversed from another checkout too. An edited or replaced file is left byte for
// byte and named with owns' reason.
function reverseFile(entry: FileEntry): void {
  const own = owns(LEDGER, TARGET, entry.path, "file");
  const ownLink = entry.content.startsWith("link:") ? entry.content.slice("link:".length) : null;
  setOutcome(entry, removeFile(`${TARGET}/${entry.path}`, entry.path, ownLink, () => own));
}

// reportBackup (plan 33.1-38): a `backup` entry names a backup install made of something of the user's.
// Since plan 33.1-40 install records every backup it makes in the target (the in-repo agent-factory/ and
// the legacy config --migrate moves aside, plans/handoffs/, and an edited kit file D-32 backs up). A backup
// holds the user's content, so uninstall never removes one: it is reported `left` with its origin, and
// nothing is read or changed.
const BACKUP_ORIGIN_TEXT: Readonly<Record<BackupEntry["origin"], string>> = {
  "in-repo-kit": "the in-repo agent-factory/ --migrate moved aside",
  "legacy-config": "a legacy config --migrate moved aside",
  handoffs: "plans/handoffs/ --migrate moved aside",
  "edited-kit-file": "a kit file you edited, backed up before the kit was refreshed",
  "kit-home": "a kit-home kit",
};
function reportBackup(entry: BackupEntry): void {
  const f = `${TARGET}/${entry.path}`;
  if (!pathExists(f)) {
    report("skipped", `${entry.path} (install's backup of ${entry.of} is not present)`);
    setOutcome(entry, "gone");
    return;
  }
  report(
    "left",
    `${entry.path} (install's backup of your content: ${BACKUP_ORIGIN_TEXT[entry.origin]}, from ${entry.of}; uninstall never removes a backup)`,
  );
  setOutcome(entry, "left");
}

// SEEDED PER-REPO STATE (D-06): a directory install seeded for the user's own state. Install records the
// directories it created there, but they are the user's from then on, and uninstall never removes them.
// isProtected covers .grugops/ and plans/; memory-bank/ is the other seeded tree.
const isSeededState = (rel: string): boolean => rel === "memory-bank" || rel.startsWith("memory-bank/");

// rmdir_if_empty: remove a now-empty directory install created (never recursive, never -f a tree).
// Reached only from reverseDir, for a `dir` entry of the ledger.
//
// EMPTINESS IS DECIDED BY A READ, NEVER BY ATTEMPTING THE REMOVAL (CR-02, D-18). The DRY_RUN
// preview reads the directory's entries and, when there are none left once this run's removals are
// counted, narrates `would-rmdir` and returns: the preview path makes NO filesystem call that can change
// anything. (It used to call rmdirSync "to see whether it would succeed", which deleted every empty
// directory it visited while printing "nothing changed".)
//
// OWNERSHIP IS DECIDED BEFORE THE PREVIEW BRANCH (CR-02, D-18). An empty directory is removed only when
// the one authority, owns(LEDGER, TARGET, rel, "dir"), answers owned (the ledger has a dir entry: install
// created it); otherwise it is reported `left` with the reason, in the real run and in the preview alike.
//
// AND ONLY WHEN THIS RUN EMPTIED IT (red-team of plan 33.1-28, R1/R2, brief DC-2). The record names a
// path, and a user can delete the directory install created and make their own at the same name; a
// marker kept by an earlier run, or copied, can name a directory that run already removed. So the
// record alone is not enough: the directory must also have held something this run removed (an entry
// of it is in GONE_THIS_RUN). A recorded directory that was already empty when this run reached it
// shows nothing of install's any more, and is left and reported. In DRY_RUN nothing is removed, so an
// entry the preview would remove counts as gone: the preview reaches the real run's answer (assuming
// each removal it names succeeds) and names what the real run removes, never more.
function rmdirIfEmpty(d: string): Outcome {
  if (isProtected(d)) return "left";
  // A link or non-directory on the way (plan 33.1-27): the directory is not inside the target.
  const way = wayTo(TARGET, d);
  if (way !== null) return way === "absent" ? "gone" : "left";
  if (!isDir(d)) return pathExists(d) ? "left" : "gone";
  let entries: string[];
  try {
    entries = readdirSync(d);
  } catch {
    return "left"; // unreadable → leave it, say nothing (as before)
  }
  // Not empty once this run's removals are counted: something of the user's (or something this run left)
  // is in it, so it stays, silently, as it always has.
  if (entries.some((e) => !GONE_THIS_RUN.has(resolve(d, e)))) return "left";
  const own = owns(LEDGER, TARGET, canonicalPathSpelling(relative(TARGET, d)), "dir");
  if (!own.owned) {
    report("left", `${d} (${own.reason})`);
    return "left";
  }
  const key = resolve(d);
  if (![...GONE_THIS_RUN].some((p) => dirname(p) === key)) {
    report(
      "left",
      `${d} (it was already empty when this run reached it, so nothing in it shows it is still the directory ` +
        `install created — it may have been emptied, or deleted and made again, since; left in place)`,
    );
    return "left";
  }
  if (DRY_RUN) {
    report("would-rmdir", d);
    markGone(d);
    return "removed";
  }
  try {
    rmdirSync(d);
    markGone(d);
    report("rmdir", d);
    return "removed";
  } catch (e) {
    // THE REMOVAL FAILED (D-31, DI-07). Two causes: the directory became non-empty in a race (something was put in it
    // after the read above), or it cannot be removed (a permission on its parent, a read-only file system). It is read
    // once more, the same way as above: when it is no longer empty, it is left silently, as a non-empty directory always
    // is. Otherwise the failure is real and a `left` line names it, with the error and the by-hand remedy, so a
    // directory install created is never left unreported. The outcome stays `left`: a directory never holds the marker
    // and never keeps an agent recorded (install-marker.ts entryHolds, agentsToRecord), so the marker rule and D-29 are
    // unchanged. The line says nothing about the directory's ledger record, which a FULL run may remove with the marker
    // and a partial run rewrites, so it is true on both.
    let after: string[] | null;
    try {
      after = readdirSync(d);
    } catch {
      after = null;
    }
    if (after !== null && after.length > 0) return "left";
    const code = (e as { code?: unknown }).code;
    const why = typeof code === "string" && code !== "" ? code : "the removal failed";
    report(
      "left",
      `${d} (install created this directory and it is empty, but it could not be removed (${why}); a directory keeps ` +
        `neither the marker nor an agent recorded, so remove it by hand once that is fixed)`,
    );
    return "left";
  }
}

// TOOLS_LEFT (re-review IN-01, plan 33.1-28): tools/ is never removed, even when the ledger's `dir` entry
// records that install created it. tools/ is an ordinary directory name a project is very likely to own
// itself: install created it only as a side effect of creating tools/grugops/, and a project may start
// using it between the install and the uninstall without that showing in any record. It is REPORTED as
// left, so the one artifact uninstall cannot reverse is visible to the reader.
const TOOLS_LEFT =
  "tools/ (grugops owns tools/grugops/ only — the directory itself is left in place, even when the install " +
  "marker records that install created it)";

// reverseDir (plan 33.1-38): a `dir` entry. Walked deepest first, after every file entry, so a directory
// is reached once everything this run removes from it is gone. It asks the one authority first; tools/ and
// the seeded per-repo state (isProtected, isSeededState) are never removed; every other directory goes
// through rmdirIfEmpty, which asks owns again at the removal itself (the census pins it there).
function reverseDir(entry: { readonly path: string; readonly kind: "dir" }): void {
  if (!owns(LEDGER, TARGET, entry.path, "dir").owned) {
    setOutcome(entry, "left");
    return;
  }
  if (entry.path === "tools") {
    if (isDir(`${TARGET}/tools`)) report("left", TOOLS_LEFT);
    setOutcome(entry, isDir(`${TARGET}/tools`) ? "left" : "gone");
    return;
  }
  if (isSeededState(entry.path) || isProtected(`${TARGET}/${entry.path}`)) {
    setOutcome(entry, "left");
    return;
  }
  setOutcome(entry, rmdirIfEmpty(`${TARGET}/${entry.path}`));
}

// remove_sentinel_block (plan 33.1-33, brief DC-2, red-team carry items 4, 6 and 11): remove the grugops
// pointer block install appended to `rel` (CLAUDE.md, the Copilot file), AS ITS `block` ENTRY IN THE
// INSTALL LEDGER SAYS, and write every other byte back unchanged. Idempotent (no block → no-op).
//
// IT USED TO DECIDE BY PRESENCE. Any open line followed by a close line was dropped, in a repository with
// no install marker too (carry 11: a never-installed target must change by zero bytes); a line the user
// added inside the block went with it (carry 4); and the file was rebuilt line by line, which trimmed the
// user's trailing blank lines and turned a Copilot file that was `\n\n` before install into 0 bytes
// (carry 6). The sentinel text says a block is grugops-SHAPED; it does not say install appended it, or
// that it still holds only what install wrote.
//
// THE RECORD. install records, in a `block` entry of the install ledger (install.ts ensureBlock / writeMarker), the content
// record (contentRecord, sha256) of the block LINES it appended, `<open>\n<body>\n<close>\n`, and what
// the one newline it wrote before them did: `blank-line` (the file was absent, empty or ended with a
// newline, so the newline made a blank line) or `line-end` (the file's last line had no newline, so the
// newline ended it). Here the candidates are every copy of the block lines: an open line at the start
// of a line through the first close line after it and that line's newline (blockLineSpans). Only a copy
// whose bytes hash to the record is install's. No record (owns says why), no matching copy (a line
// inside the block was added, edited or removed, its line ends or spacing changed, a marker line is
// missing, or it was written by hand), or two matching copies (which one is install's is not known):
// nothing is removed, the file is left exactly as it is, and the reason is said.
//
// THE SEPARATOR (red-team B1 of plan 33.1-33, D-18). The plan-33 build removed `\n<open>…<close>\n`
// wherever it was, so the newline it took could be the user's: moving the block lines between two lines
// joined them, deleting the blank line before the block took the file's final newline, and text added
// after a block in a file with no final newline was glued to its last line. Now:
//   - the block lines of the one matching copy are removed wherever that copy is. They are whole lines
//     (they start at a line start and end with a newline), so removing them never joins two lines and
//     changes no other byte;
//   - the newline before them is removed only when the copy is still at the END of the file, where
//     install appended it, AND the bytes agree with the record: for `line-end`, it is the newline that
//     ended the user's last line (nothing follows it, so no line is joined, and the file's last line is
//     unterminated again, as install found it); for `blank-line`, the line before the block is blank (a
//     newline right before it, or the file's start), so removing that newline removes a blank line, never
//     text. A blank line the user deleted is not removed again: the newline there then ends the user's
//     line, and it stays;
//   - a copy that is not at the end of the file (moved, or text added after it) keeps the newline before
//     it: which newline install added can no longer be shown, and the line says it was kept.
// So install followed by uninstall gives back an untouched file byte for byte, and every user byte of an
// edited one survives.
// THE RESULT (plan 33.1-28, Gap B / re-review WR-05). `removed` is true only when the recorded block was
// found and, outside DRY_RUN, the file was rewritten without it. `blankAfter` is true only when the bytes
// without the block are nothing but spaces, tabs, CR and LF. Both are computed BEFORE the DRY_RUN branch,
// from the one readForWrite read, so the preview and the real run hand the same answer to
// removeOwnedEmptyFile, which deletes a file only on `removed && blankAfter` AND its file entry in the install ledger.
// Every early return is `{ removed: false, blankAfter: false }`; `blankWithoutBlock` is true only in the no-block
// arm, for a blank file (plan 34.1-16, D-30).
interface BlockRemoval {
  readonly removed: boolean;
  readonly blankAfter: boolean;
  /** The file's bytes as this run read them, before the block removal (red-team R1); null otherwise. */
  readonly before: Buffer | null;
  /** The file's mode as this run read it (red-team L1 of plan 33.1-34); null with `before`. */
  readonly beforeMode: number | null;
  /** The block entry's outcome (plan 33.1-38). */
  readonly outcome: Outcome;
  /**
   * True only when this run read the file as a regular file (readForWrite), found no grugops open sentinel in it, and
   * its bytes are blank by the same predicate as `blankAfter` (spaces, tabs, CR and LF only; plan 34.1-16, D-30). No
   * read is made for it: the no-block arm already holds the bytes.
   */
  readonly blankWithoutBlock: boolean;
}
const NO_BLOCK_REMOVED: Omit<BlockRemoval, "outcome"> = { removed: false, blankAfter: false, before: null, beforeMode: null, blankWithoutBlock: false };


// blockLineSpans (every copy of the block lines in a file) moved into install-marker.ts in plan 34-28, so
// this removal and install's block refresh (install.ts ensureBlock) find a block's bytes by one function.

/**
 * The bytes to remove for the one matching copy at `sp` (red-team B1 of plan 33.1-33): the block lines,
 * and the newline before them only when it is install's by the record and the bytes (see THE SEPARATOR).
 */
function blockRemovalSpan(buf: Buffer, sp: { start: number; end: number }, rec: AppendedBlock): { start: number; end: number; separator: boolean } {
  const atEnd = sp.end === buf.length;
  if (!atEnd || sp.start === 0) return { ...sp, separator: false };
  // sp.start > 0, so buf[sp.start - 1] is the newline that ends the line before the block.
  const sepIsInstalls =
    rec.separator === "line-end" ? true : sp.start === 1 || buf[sp.start - 2] === 0x0a;
  return sepIsInstalls ? { start: sp.start - 1, end: sp.end, separator: true } : { ...sp, separator: false };
}

// noBlockRecordReason (plan 33.1-33, D-18; plan 33.1-38): why there is no record of a block install appended
// to `rel`, from the ledger's state. Only the ledger answers; the file's content never does. Used by the
// report of an unrecorded block (reportUnrecordedBlock), which never edits the file.
function noBlockRecordReason(): string {
  const remedy = "remove the grugops lines by hand if grugops put them there";
  if (MARKER.state === "absent") return `there is no install marker, so there is no record that install appended this block — left in place; ${remedy}`;
  if (MARKER.state === "unreadable") {
    return `the install marker could not be used (see the verify line above), so there is no usable record that install appended this block — left in place; ${remedy}`;
  }
  if (LEDGER.state === "malformed") return `the install ledger could not be used (see the verify line above) — left in place; ${remedy}`;
  return `there is no record that install appended this block — it is not in the install ledger; left in place; ${remedy}`;
}

const isBlankByte = (b: number): boolean => b === 0x20 || b === 0x09 || b === 0x0d || b === 0x0a;

// The two pointer files install appends its block to, with their sentinels and labels. WR-05: the Copilot
// block has its own sentinel, so a change to one cannot stop the other from being removed.
const POINTER_FILES: Readonly<Record<string, { readonly open: string; readonly close: string; readonly label: string }>> = {
  "CLAUDE.md": { open: CLAUDE_OPEN, close: CLAUDE_CLOSE, label: "CLAUDE.md start-here pointer" },
  [COPILOT_REL]: { open: COPILOT_OPEN, close: COPILOT_CLOSE, label: `${COPILOT_REL} pointer` },
};

// removeSentinelBlock: the reversal of a `block` entry (reached from reverseBlock). It asks the one
// authority, owns(LEDGER, TARGET, rel, "block"), for the entry, and removes only the one span whose bytes
// hash to that entry's record.
function removeSentinelBlock(rel: string, open: string, close: string, label: string): BlockRemoval {
  const f = `${TARGET}/${rel}`;
  if (isProtected(f)) {
    report("refused", `${label} (protected path)`);
    return { ...NO_BLOCK_REMOVED, outcome: "left" };
  }
  const own = owns(LEDGER, TARGET, rel, "block");
  if (!own.owned || own.entry === null) {
    report("left", `${label} (${own.owned ? "" : own.reason})`);
    return { ...NO_BLOCK_REMOVED, outcome: "left" };
  }
  const record: AppendedBlock = { block: own.entry.block, separator: own.entry.separator };
  // DC-3 (plan 33.1-27): readForWrite, never a plain read. Nothing there is the existing "no block"
  // answer. A special file, a link, or a non-directory on the way is a counted verify: the block install
  // recorded appending may be in it, and it was not read, so it is never written.
  const read = readForWrite(TARGET, f);
  if (read.state === "create") {
    report("skipped", `${label} (no grugops block present)`);
    return { ...NO_BLOCK_REMOVED, outcome: "gone" };
  }
  if (read.state === "blocked") {
    verify(
      `${label}: ${read.at} ${read.reason}. It was not read and was left untouched, so the grugops block install ` +
        `recorded appending to it was not removed; remove the grugops lines by hand, keeping any line of yours.`,
    );
    return { ...NO_BLOCK_REMOVED, outcome: "verify" };
  }
  const buf = read.bytes;
  if (!buf.includes(Buffer.from(open, "utf8"))) {
    report("skipped", `${label} (no grugops block present)`);
    return { ...NO_BLOCK_REMOVED, blankWithoutBlock: buf.every(isBlankByte), outcome: "gone" };
  }
  const matches = blockLineSpans(buf, open, close).filter((sp) => contentRecord(buf.subarray(sp.start, sp.end)) === record.block);
  if (matches.length === 0) {
    // One reason for every way a copy stops matching (red-team B1 wording): a line inside it added,
    // edited or removed, CRLF line ends, trailing spaces, a missing open or close line. Each is "the
    // block no longer matches what install recorded", never a claim about which line is missing.
    report(
      "left",
      `${label} (the grugops block in it no longer matches the block install recorded appending — a line inside it ` +
        `was added, edited or removed, its line ends or spacing changed, or a marker line is missing — so nothing ` +
        `was removed and the file was left as it is; remove the grugops lines by hand, keeping any line of yours)`,
    );
    return { ...NO_BLOCK_REMOVED, outcome: "left" };
  }
  if (matches.length > 1) {
    report(
      "left",
      `${label} (it holds ${matches.length} copies of the block install recorded appending, so which one install ` +
        `appended is not known; nothing was removed and the file was left as it is — remove the grugops lines by hand)`,
    );
    return { ...NO_BLOCK_REMOVED, outcome: "left" };
  }
  const cut = blockRemovalSpan(buf, matches[0], record);
  const result = Buffer.concat([buf.subarray(0, cut.start), buf.subarray(cut.end)]);
  const blankAfter = result.every(isBlankByte); // the one blank test, also asked by the no-block arm above
  const how =
    cut.separator || matches[0].start === 0
      ? "sentinel block only; rest of file preserved"
      : matches[0].end === buf.length
      ? "sentinel block only; rest of file preserved, including the newline before the block, which ends a line of yours"
      : "sentinel block only; rest of file preserved, including the newline before the block — the block is no longer at the end of the file, where install appended it, so which newline install added is not known";
  if (DRY_RUN) {
    report("would-remove", `${label} (${how})`);
    return { removed: true, blankAfter, before: buf, beforeMode: read.mode, blankWithoutBlock: false, outcome: "reversed" };
  }
  if (!rewritePath(f, result, label)) return { ...NO_BLOCK_REMOVED, outcome: "verify" };
  report("removed", `${label} (${how})`);
  return { removed: true, blankAfter, before: buf, beforeMode: read.mode, blankWithoutBlock: false, outcome: "reversed" };
}

// reportUnrecordedBlock (plan 33.1-38, report only): a pointer file with no `block` entry in the ledger.
// It is read (readForWrite: bounded, no link followed) only to say whether a grugops-shaped block is in
// it; it is never written. A block install has no record of appending is the user's to remove.
function reportUnrecordedBlock(rel: string): void {
  if (entryAt(LEDGER, rel, "block") !== undefined) return;
  const { open, label } = POINTER_FILES[rel];
  const f = `${TARGET}/${rel}`;
  if (isProtected(f)) return;
  const read = readForWrite(TARGET, f);
  if (read.state === "create") {
    report("skipped", `${label} (no grugops block present)`);
    return;
  }
  if (read.state === "blocked") {
    // THE RECORD IS ASKED FIRST (red-team B2 of plan 33.1-34, brief DC-2): a path with no record of a block
    // install appended is not uninstall's to resolve (a user's `CLAUDE.md -> AGENTS.md` link), so it is
    // left and reported, never a verify.
    report("left", `${label} (${read.at} ${read.reason}, so it was not read or changed; ${noBlockRecordReason()})`);
    return;
  }
  if (!read.bytes.includes(Buffer.from(open, "utf8"))) {
    report("skipped", `${label} (no grugops block present)`);
    return;
  }
  report("left", `${label} (${noBlockRecordReason()})`);
}

// removeOwnedEmptyFile (plan 33.1-28, Gap B / re-review WR-05, brief DC-2, D-18): delete a pointer file
// install created (CLAUDE.md, the Copilot file: a `file` entry at a block's path) ONLY when all three hold:
//   1. THIS run removed its recorded block from it (`result.removed`, from removeSentinelBlock);
//   2. the file is blank after that removal (`result.blankAfter`: spaces, tabs, CR and LF only);
//   3. the one authority has the record: owns(LEDGER, TARGET, rel, "file") returns install's file entry, and
//      the bytes and mode this run read BEFORE its own block removal (`result.before`) hold that entry's
//      content record (recordMatches, the predicate owns asks of a file read now; red-team of plan 33.1-28,
//      R1: a file the user re-made or edited since is not install's). The pre-removal bytes are the ones
//      compared, because after the block removal the file holds this run's own edit, not install's.
// It replaces a remover that deleted any whitespace-only file at the path and called it
// "grugops-created" with no record: a user's blank .github/copilot-instructions.md in a repository
// grugops never installed into was deleted. Presence and shape are not provenance. A file that fails
// condition 3 stays, blank, and is reported `left` with the reason. A protected path is refused, and
// anything that is not a regular file inside the target is left by the one removal decision
// (removalDecision). Ownership and the decision are taken before the DRY_RUN branch, so the preview
// names exactly what the real run removes. When conditions 1 or 2 do not hold, the file stays and its
// block line already named it (a removed block whose file keeps lines of the user's, or a block left).
// THE FILE ENTRY'S OUTCOME (plan 33.1-39, the marker rule). The content install wrote into a pointer file
// it created is the block. So when this run did not remove the block, the file entry is `gone` exactly when
// the block entry is (the file is absent, or no grugops block is in it any more) and `left` otherwise (the
// block is still there, and holds the marker itself). When this run removed the block and the file still
// holds lines of the user's, the file entry is `reversed`: nothing of install's is left in it, and what
// is left is the user's, so it does not hold the marker.
// THE BLOCK-ALREADY-GONE ARM (plan 34.1-16, D-30, DI-06, brief CLEAN-1). When the user already removed the block
// and the file install created is now blank (result.blankWithoutBlock, from the bytes removeSentinelBlock read), the
// file would otherwise stay with no line naming it. It is not deleted: the bytes from before a block removal, which
// condition 3 compares with the record, do not exist here, so nothing proves the file holds only what install wrote
// (33.1 DC-2). It is named on a `left` line with the by-hand remedy, and the entry is `left`: a `left` line is a held
// entry in the Outcome vocabulary, so the agent that owns the file (Claude Code for CLAUDE.md, GitHub Copilot CLI for
// the Copilot file) stays recorded (D-29), the marker is kept, and the kept line prints the command that finishes the
// reversal once the user deletes the file (finishCommand). The arm acts only when the install ledger has a `file`
// entry at the path (install created it); a file that still holds lines of the user's is `gone` as before: nothing of
// install's is in it. It deletes nothing and writes nothing, under DRY_RUN or not, and prints the same line in both.
function removeOwnedEmptyFile(rel: string, label: string, result: BlockRemoval): Outcome {
  // THE BLOCK-ALREADY-GONE ARM (plan 34.1-16, D-30, DI-06, brief CLEAN-1). See the header above.
  if (!result.removed && result.outcome === "gone" && result.blankWithoutBlock && entryAt(LEDGER, rel, "file") !== undefined) {
    if (isProtected(`${TARGET}/${rel}`)) {
      report("refused", `${label} (protected path — never removed)`);
      return "left";
    }
    report(
      "left",
      `${rel} (install created it, and its grugops block is no longer in it; it is blank, but the bytes install wrote ` +
        `are not here to compare, so it was not removed; delete it by hand if you do not need it)`,
    );
    return "left";
  }
  if (!result.removed) return result.outcome === "gone" ? "gone" : "left";
  if (!result.blankAfter) return "reversed";
  const f = `${TARGET}/${rel}`;
  if (isProtected(f)) {
    report("refused", `${label} (protected path — never removed)`);
    return "left";
  }
  const own = owns(LEDGER, TARGET, rel, "file");
  if (own.entry === null) {
    report("left", `${rel} (it is blank after the block removal, but ${own.owned ? "" : own.reason})`);
    return "left";
  }
  // The bytes AND the mode the file had before the block removal are compared with the record (red-team
  // L1 of plan 33.1-34): a file the user only chmod'ed is theirs to keep, blank or not.
  const c = result.before !== null ? recordMatches(own.entry.content, result.before, result.beforeMode) : ({ holds: false, why: null } as const);
  if (!c.holds) {
    const reason =
      c.modeChanged !== undefined
        ? `${c.modeChanged} there (a change made since), so it is not what install created; left in place`
        : c.why !== null
          ? `${c.why}; left in place`
          : "it does not hold what the install ledger records install wrote there (it was edited or replaced since), so " +
            "there is no record that install created this content; left in place";
    report("left", `${rel} (it is blank after the block removal, but ${reason})`);
    return "left";
  }
  const d = removalDecision(f, rel, null);
  if (reportDecision(d)) return d.act === "verify" ? "verify" : d.act === "absent" ? "gone" : "left";
  const note = c.modeChecked ? "" : `; ${NO_MODE_NOTE}`;
  if (DRY_RUN) {
    report("would-remove", `${rel} (install created it — recorded in the install ledger — and it would be blank after the block removal${note})`);
    markGone(f);
    return "removed";
  }
  return unlinkPath(f, rel, `${rel} (install created it — recorded in the install ledger — and it is empty after the block removal${note})`)
    ? "removed"
    : "verify";
}

// reverseBlock (plan 33.1-38): a `block` entry, and with it the pointer file itself. The block is removed
// first, so the pointer-file rule can see this run's result. removeOwnedEmptyFile then decides the file: it
// is deleted only on its own `file` entry (install created it); a file the user had, left blank by the block
// removal, is named `left`. A file entry at a pointer path with no block entry is
// reversePointerFileWithoutBlock's.
function reverseBlock(entry: { readonly path: string; readonly kind: "block" }): void {
  const p = POINTER_FILES[entry.path];
  const r = removeSentinelBlock(entry.path, p.open, p.close, p.label);
  setOutcome(entry, r.outcome);
  const fileOutcome = removeOwnedEmptyFile(entry.path, entry.path, r);
  const fileEntry = entryAt(LEDGER, entry.path, "file");
  if (fileEntry !== undefined) setOutcome(fileEntry, fileOutcome);
}

// reversePointerFileWithoutBlock (plan 33.1-38): a `file` entry at a pointer path whose ledger has no
// `block` entry there. The pointer-file rule removes a created pointer file only once this run removed its
// recorded block, so with no block record it is never removed; it is left and named.
function reversePointerFileWithoutBlock(entry: FileEntry): void {
  const f = `${TARGET}/${entry.path}`;
  if (!pathExists(f)) {
    report("skipped", `${entry.path} (not present)`);
    setOutcome(entry, "gone");
    return;
  }
  report(
    "left",
    `${entry.path} (the install ledger records that install created it, but has no record of the block install ` +
      `appended to it, so no block was removed and the file is kept; left in place)`,
  );
  setOutcome(entry, "left");
}

// unmergeGemini (plan 33.1-29, Gap B / re-review CR-03, brief DC-2, D-18): reverse what install
// did to .gemini/settings.json, AS ITS gemini ENTRY IN THE INSTALL LEDGER SAYS, and nothing else.
//
// It used to decide by the file's text and shape: any file containing the substring "AGENTS.md" was
// parsed and its context.fileName rewritten, and a file of the shape CLAUDE.md itself recommends
// was deleted, in a repository grugops was never installed into. Neither the text nor the shape is a
// record of what install did. It is reached only from the ledger walk (reverseGemini), for the gemini
// entry, which it takes from the one authority, owns(LEDGER, TARGET, ".gemini/settings.json", "gemini"),
// before the file's content is read. A settings file with no gemini entry (no marker, an unusable or
// malformed ledger, or no entry) is reportUnrecordedSettings's: reported `left`, never read for an edit.
// Here, in order:
//   file absent                    → skipped (not present);
//   addedEntry false               → skipped (install did not add the entry), or left when reset.
// Only then is the file read and parsed. A file that is not a readable regular file, does not parse
// or is not a JSON object is a counted verify and is left untouched, with no `removed` line. A file
// install created that still holds exactly the bytes install wrote is removed whole. Otherwise, while
// context.fileName is still the recorded list: in a file install created, the whole list install wrote
// is removed, and `context` with it when nothing else is in it (plan 33.1-39, review WR-03), so the user's
// other keys are all that is left; in a file install found, the last "AGENTS.md" element is removed and
// the shape install found is restored (see the rules at the reversal below).
// GEMINI_LEDGER_AFTER (plan 33.1-29, with red-team R2 of plan 33.1-28): the gemini entry as it
// stands once unmergeGemini has acted, for removeMarker to write into a marker it keeps. Set only when
// the recorded change was reversed (or found already reversed): the record then claims nothing, and
// `fileNameContent` records the fileName left behind (null when there is none). null when nothing was
// acted on, so a kept marker keeps the record as it was.
let GEMINI_LEDGER_AFTER: GeminiLedger | null = null;

function unmergeGemini(): Outcome {
  const rel = GEMINI_SETTINGS_REL;
  const f = `${TARGET}/${rel}`;
  if (isProtected(f)) return "left";
  // THE ONE AUTHORITY (plan 33.1-38): the gemini entry comes from owns, which the walk reached because the
  // ledger holds it. A settings file with no entry is reportUnrecordedSettings's, and is never edited.
  const own = owns(LEDGER, TARGET, rel, "gemini");
  if (!own.owned || own.entry === null) {
    report("left", `${rel} (${own.owned ? "" : own.reason})`);
    return "left";
  }
  const ledger: GeminiLedger = own.entry;
  // DC-3 (plan 33.1-27): readForWrite, never a plain read. It opens only a regular file within the
  // bound, so asking it whether anything is there never blocks and never changes anything.
  const read = readForWrite(TARGET, f);
  if (read.state === "create") {
    report("skipped", `${rel} (not present)`);
    return "gone";
  }
  if (!ledger.addedEntry) {
    // Red-team B2 of plan 33.1-29: say why the record claims no entry, and only what is true.
    const why = ledger.noEntryReason;
    if (why === "reset") {
      report(
        "left",
        `${rel} (the record of what install changed in it was reset: context.fileName changed after install wrote it, ` +
          `so whether an AGENTS.md entry in it is install's is not known — left untouched; remove AGENTS.md from ` +
          `context.fileName by hand if grugops added it)`,
      );
    } else {
      const found =
        why === "already-listed"
          ? "AGENTS.md was already listed when install found the file"
          : why === "refused"
            ? "install could not read or merge the file when it ran (that run printed a verify line) and added nothing"
            : "an earlier uninstall already removed the entry install added";
      report("skipped", `${rel} (install did not add an AGENTS.md entry to it — ${found}; left untouched)`);
    }
    return why === "reset" ? "left" : "gone";
  }
  if (read.state === "blocked") {
    verify(
      `${rel}: ${read.at} ${read.reason}. It was not read and was left untouched, so the AGENTS.md entry ` +
        `install recorded adding was not removed; remove it from context.fileName by hand.`,
    );
    return "verify";
  }
  // Red-team of plan 33.1-27 (B5): the file is parsed BEFORE the preview branch, so the preview and
  // the real run decide alike, and a file that does not parse, or is not a JSON object, is a COUNTED
  // verify with no `removed` line. Red-team B3 of plan 33.1-29: it is read as text (json-text.ts), so
  // the edit below removes only the recorded entry and keeps every other byte.
  const doc = readJsonText(read.bytes);
  if (!doc.ok || doc.root.kind !== "object") {
    verify(
      `${rel} ${doc.ok ? "is not a JSON object" : doc.why} — it was left untouched, so the AGENTS.md entry install recorded ` +
        `adding was not removed. Remove it from context.fileName by hand.`,
    );
    return "verify";
  }
  const root = doc.root;
  const ctxAt = memberNamed(root, "context");
  if (keyCount(root, "context") > 1 || (ctxAt !== null && keyCount(ctxAt.value, "fileName") > 1)) {
    verify(
      `${rel} has more than one "context" or "context.fileName" key, so which one Gemini CLI reads is not known — ` +
        `it was left untouched, so the AGENTS.md entry install recorded adding was not removed. Remove it by hand.`,
    );
    return "verify";
  }
  const claimsNothing = (noEntryReason: NoEntryReason, fileName: unknown): GeminiLedger => ({
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
    const line = `${rel} (install created it and it is unchanged — recorded in the install ledger${created.modeChecked ? "" : `; ${NO_MODE_NOTE}`})`;
    if (DRY_RUN) {
      report("would-remove", line);
      markGone(f);
      GEMINI_LEDGER_AFTER = claimsNothing("reversed", undefined);
      return "removed";
    }
    if (!unlinkPath(f, rel, line)) return "verify";
    GEMINI_LEDGER_AFTER = claimsNothing("reversed", undefined);
    return "removed";
  }
  const ctxNode: JsonNode | null = ctxAt === null ? null : ctxAt.value;
  const fnAt = ctxNode === null || ctxNode.kind !== "object" ? null : memberNamed(ctxNode, "fileName");
  const current: unknown = fnAt === null ? undefined : valueOf(doc.text, fnAt.value);
  // THE RECORD MUST HOLD (red-team B1 of plan 33.1-29, brief DC-2). The ledger's fileNameContent is
  // context.fileName as install left it, in the one serialisation (jsonValueRecord) install used. A
  // fileName that is not exactly that list — the user removed install's entry and wrote their own, or
  // the record was forged — proves nothing about which entry is install's, so nothing is edited.
  if (jsonValueRecord(current) !== ledger.fileNameContent) {
    const listsIt = current === "AGENTS.md" || (Array.isArray(current) && current.includes("AGENTS.md"));
    if (!listsIt) {
      report("skipped", `${rel} (context.fileName no longer lists AGENTS.md — the entry install added was already removed)`);
      GEMINI_LEDGER_AFTER = claimsNothing("reset", current);
      return "gone";
    }
    report(
      "left",
      `${rel} (context.fileName is not the list install recorded leaving there — it changed after install wrote it, or ` +
        `the record does not describe it — so which AGENTS.md entry is install's is not known; left untouched. Remove ` +
        `AGENTS.md from context.fileName by hand if grugops added it)`,
    );
    return "left";
  }
  // THE RECORD HOLDS, so fileName is the array install left. Only from an array fileName is anything removed:
  // the list install wrote whole into a file it created, or the one AGENTS.md element it appended.
  if (ctxNode === null || fnAt === null || fnAt.value.kind !== "array" || !Array.isArray(current)) {
    report(
      "left",
      `${rel} (context.fileName is no longer an array — left untouched; remove AGENTS.md from it by hand if grugops added it)`,
    );
    return "left";
  }
  const arrNode = fnAt.value;
  const j = documentValue(doc) as Record<string, unknown>;
  const ctx = j.context as Record<string, unknown>;
  let newText: string;
  // The preview and the done line of the edit below, for the arm taken.
  let previewLine = `${rel} (remove the AGENTS.md entry install added — recorded in the install ledger)`;
  let doneLine = `${rel} AGENTS.md entry (install added it — recorded in the install ledger; every other byte preserved)`;
  if (ledger.createdFile) {
    // THE FILE INSTALL CREATED (plan 33.1-39, review WR-03, D-33 (b)). Install created this file with the
    // whole list `["AGENTS.md", "GEMINI.md"]`, written at once, so its GEMINI.md element is install's as much
    // as its AGENTS.md element. The record holds (fileName is still exactly the list install wrote), so every
    // element of it is install's: `fileName` is removed whole, and `context` with it when nothing else is in
    // it (install created it: createdContext is true for a created file). Removing only AGENTS.md used to
    // leave install's own `"fileName": ["GEMINI.md"]` behind, and the record was then dropped, so that
    // residue could never be reversed. Every other key the user added keeps its bytes: it is one text edit,
    // held by the oracle below.
    delete ctx.fileName;
    if (ledger.createdContext === true && Object.keys(ctx).length === 0) {
      delete j.context;
      newText = removeItems(doc.text, root, new Set([root.members.findIndex((m) => m.key === "context")]));
      previewLine =
        `${rel} (remove the context object install wrote when it created the file, holding only its context.fileName ` +
        `list, AGENTS.md and GEMINI.md — recorded in the install ledger)`;
      doneLine =
        `${rel} context (install wrote it when it created the file, holding only its context.fileName list, AGENTS.md ` +
        `and GEMINI.md — recorded in the install ledger; every other byte preserved)`;
    } else {
      newText = removeItems(doc.text, ctxNode, new Set([ctxNode.kind === "object" ? ctxNode.members.findIndex((m) => m.key === "fileName") : -1]));
      previewLine =
        `${rel} (remove the context.fileName list install wrote when it created the file, AGENTS.md and GEMINI.md — ` +
        `recorded in the install ledger; the rest of context is kept)`;
      doneLine =
        `${rel} context.fileName (install wrote this list, AGENTS.md and GEMINI.md, when it created the file — recorded ` +
        `in the install ledger; the rest of context and every other byte preserved)`;
    }
  } else {
    // THE EXACT REVERSAL OF THE RECORDED APPEND to a file install found.
    const list = [...current];
    // The LAST exact element is the one install appended: install appends at the end, and only when no
    // "AGENTS.md" element was there.
    const at = list.lastIndexOf("AGENTS.md");
    list.splice(at, 1);
    // Restore the shape install found: an absent fileName is removed again, a string becomes the
    // string again, and a context install added is removed when nothing else is in it. The same
    // decision is made twice: on the parsed value (the oracle) and as one text edit.
    if (ledger.fileNameBefore === "absent" && list.length === 0) {
      delete ctx.fileName;
      if (ledger.createdContext === true && Object.keys(ctx).length === 0) {
        delete j.context;
        newText = removeItems(doc.text, root, new Set([root.members.findIndex((m) => m.key === "context")]));
      } else {
        newText = removeItems(doc.text, ctxNode, new Set([ctxNode.kind === "object" ? ctxNode.members.findIndex((m) => m.key === "fileName") : -1]));
      }
    } else if (ledger.fileNameBefore === "string" && list.length === 1 && typeof list[0] === "string" && arrNode.kind === "array") {
      ctx.fileName = list[0];
      newText = replaceWithText(doc.text, arrNode, arrNode.elements[at === 0 ? 1 : 0]);
    } else {
      ctx.fileName = list;
      newText = removeItems(doc.text, arrNode, new Set([at]));
    }
  }
  const after = claimsNothing("reversed", Object.prototype.hasOwnProperty.call(ctx, "fileName") ? ctx.fileName : undefined);
  // Install created the file, and with what it wrote removed nothing is left in it. "NOTHING LEFT" MEANS
  // INSTALL'S OWN EMPTIED FILE, EXACTLY (red-team L1 of plan 33.1-34, as removeAskRules applies it): the file
  // is deleted only when what the edit above leaves is byte for byte what the same edit leaves of the file
  // install writes (createdGeminiText), and its mode is the one install recorded. A whitespace or line-end
  // edit, or a chmod, is the user's: what install wrote is still taken out, and the file is kept.
  let keptWhy = "";
  if (ledger.createdFile && Object.keys(j).length === 0) {
    const recordedMode = ledger.fileContent === undefined ? undefined : recordedModeOf(ledger.fileContent);
    const modeKept = modeMatches(recordedMode, read.mode);
    if (newText === emptiedCreatedGeminiText() && modeKept) {
      const note = recordedMode === undefined ? `; ${NO_MODE_NOTE}` : "";
      const line = `${rel} (install created it, and with what it wrote there removed nothing is left in it — recorded in the install ledger${note})`;
      if (DRY_RUN) {
        report("would-remove", line);
        markGone(f);
        GEMINI_LEDGER_AFTER = claimsNothing("reversed", undefined);
        return "removed";
      }
      if (!unlinkPath(f, rel, line)) return "verify";
      GEMINI_LEDGER_AFTER = claimsNothing("reversed", undefined);
      return "removed";
    }
    keptWhy =
      `; grugops created the file, but ${modeKept ? "its text is not what install wrote (a whitespace or line-end edit)" : `its file mode is ${modeText(read.mode)}, not the ${recordedMode} install wrote`}, ` +
      `so the file was kept`;
    previewLine = `${previewLine.slice(0, -1)}${keptWhy})`;
    doneLine = `${doneLine.slice(0, -1)}${keptWhy})`;
  }
  // THE ORACLE: the edited text must hold exactly the reversed value; otherwise nothing is written.
  const check = readJsonText(Buffer.from(newText, "utf8"));
  if (!check.ok || !sameJsonValue(documentValue(check), j)) {
    verify(
      `${rel} could not be edited in place without changing anything but what install wrote in context — it was left ` +
        `untouched, so what install recorded writing there was not removed. Remove it by hand.`,
    );
    return "verify";
  }
  if (DRY_RUN) {
    report("would-edit", previewLine);
    GEMINI_LEDGER_AFTER = after;
    return "reversed";
  }
  if (!rewritePath(f, newText, rel, ledger.createdFile ? "remove context.fileName by hand." : "remove AGENTS.md from context.fileName by hand.")) return "verify";
  report("removed", doneLine);
  GEMINI_LEDGER_AFTER = after;
  return "reversed";
}

// removeAskRules (D-18): reverse install.ts writeAskRules() BY PROVENANCE, not by presence.
//
// The ledger is the ask-rules entry of the install ledger in .grugops/install.json, so this runs BEFORE
// removeMarker(). It removes exactly (ledger ∩ present) from permissions.ask. A user may hold a rule
// identical to one of ours; presence alone cannot say who added it, so a present rule that is not in
// the ledger is LEFT and reported (unmergeGemini follows the same rule since plan 33.1-29: it acts only
// on the gemini entry). A container is removed only when install created it (the ledger's
// created* flags) and it is empty again: the `ask` array, then the `permissions` object, then the
// file. Nothing is written when nothing changes, so a file this pass does not need to touch keeps
// its bytes.
//
// Fail closed: an unreadable marker, a malformed ledger (counted once, by the one verify at the top of
// the removal sequence), or a settings file that does not parse or has the wrong shape is a `verify`
// finding and NOTHING is removed. A ledger without an ask-rules entry is a `skipped` line and nothing is
// removed. The marker
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
let ASK_LEDGER_AFTER: AskRuleLedger | null = null;
const askLedgerAfter = (ask: readonly unknown[] | null): AskRuleLedger => ({
  added: [],
  createdFile: false,
  createdPermissions: false,
  createdAsk: false,
  askContent: jsonValueRecord(ask === null ? undefined : ask),
});

// emptiedCreatedGeminiText (plan 33.1-39, review WR-03): what removing the `context` member leaves of the
// file install writes when it creates .gemini/settings.json (createdGeminiText, the one text both binaries
// use), by the same text edit unmergeGemini makes.
function emptiedCreatedGeminiText(): string | null {
  const created = readJsonText(Buffer.from(createdGeminiText(), "utf8"));
  if (!created.ok || created.root.kind !== "object") return null;
  const at = created.root.members.findIndex((m) => m.key === "context");
  return removeItems(created.text, created.root, new Set([at]));
}

// emptiedCreatedSettingsText (red-team L1 of plan 33.1-34): what removing the `permissions` member
// leaves of the file install writes when it creates .claude/settings.json (createdSettingsText, the one
// serialisation both binaries use), by the same text edit this pass makes. The rules inside the member
// do not change what is left, so the empty rule list stands for every one.
function emptiedCreatedSettingsText(): string | null {
  const created = readJsonText(Buffer.from(createdSettingsText([]), "utf8"));
  if (!created.ok || created.root.kind !== "object") return null;
  const at = created.root.members.findIndex((m) => m.key === "permissions");
  return removeItems(created.text, created.root, new Set([at]));
}

function removeAskRules(): Outcome {
  const rel = ASK_RULES_REL;
  const f = `${TARGET}/${rel}`;
  if (isProtected(f)) return "left";
  // THE ONE AUTHORITY (plan 33.1-38): the ask-rules entry comes from owns, which the walk reached because the
  // ledger holds it. A settings file with no entry is reportUnrecordedSettings's, and is never edited.
  const own = owns(LEDGER, TARGET, rel, "ask-rules");
  if (!own.owned || own.entry === null) {
    report("left", `${rel} ask rules (${own.owned ? "" : own.reason})`);
    return "left";
  }
  const led: AskRuleLedger = own.entry;
  const ledger = new Set(led.added);
  // DC-3 (plan 33.1-27): readForWrite, never a plain read; a blocked path is a counted verify and is
  // never written.
  const read = readForWrite(TARGET, f);
  if (read.state === "create") {
    report("skipped", `${rel} (not present — the ${ledger.size} ask rule(s) in the install ledger are already gone)`);
    ASK_LEDGER_AFTER = askLedgerAfter(null);
    return "gone";
  }
  if (read.state === "blocked") {
    // A LEDGER THAT CLAIMS NOTHING IS NO RECORD FOR THE FILE (red-team B2 of plan 33.1-34, brief DC-2).
    // With no rule recorded as added and no part of the file recorded as created, there is nothing of
    // install's in it to remove, so a file this run cannot read is left without a verify.
    if (ledger.size === 0 && !led.createdFile && !led.createdPermissions && !led.createdAsk) {
      report(
        "left",
        `${rel} (${read.at} ${read.reason}, so it was not read or changed; the install ledger records no ask rule ` +
          `added and no part of the file created, so there is nothing of install's in it to remove)`,
      );
      return "gone";
    }
    verify(
      `${rel}: ${read.at} ${read.reason}. It was not read and was left untouched; the ${ledger.size} ask ` +
        `rule(s) grugops added were NOT removed. Remove them by hand.`,
    );
    return "verify";
  }
  // Red-team B3 of plan 33.1-29 (D-18): read as text (json-text.ts), so the edit below removes only the
  // recorded rules (or the containers install created) and keeps every other byte of the user's file.
  const doc = readJsonText(read.bytes);
  if (!doc.ok || doc.root.kind !== "object") {
    verify(
      `${rel} ${doc.ok ? "is not a JSON object" : doc.why} — left untouched; the ${ledger.size} ask rule(s) grugops ` +
        `added were NOT removed. Fix the file, then run \`${rerunCommand()}\` again, or remove them by hand.`,
    );
    return "verify";
  }
  const rootNode = doc.root;
  const permsAt = memberNamed(rootNode, "permissions");
  if (keyCount(rootNode, "permissions") > 1 || (permsAt !== null && keyCount(permsAt.value, "ask") > 1)) {
    verify(
      `${rel} has more than one "permissions" or "permissions.ask" key, so which one Claude Code reads is not known — ` +
        `left untouched; the ${ledger.size} ask rule(s) grugops added were NOT removed. Remove them by hand.`,
    );
    return "verify";
  }
  const json = documentValue(doc) as Record<string, unknown>;
  const hasPermissions = Object.prototype.hasOwnProperty.call(json, "permissions");
  const perms = json.permissions;
  if (hasPermissions && (perms === null || typeof perms !== "object" || Array.isArray(perms))) {
    verify(`${rel} has a "permissions" value that is not an object — left untouched; no ask rule was removed.`);
    return "verify";
  }
  const permissions = hasPermissions ? (perms as Record<string, unknown>) : null;
  const hasAsk = permissions !== null && Object.prototype.hasOwnProperty.call(permissions, "ask");
  if (hasAsk && !Array.isArray(permissions!.ask)) {
    verify(`${rel} has a "permissions.ask" value that is not an array — left untouched; no ask rule was removed.`);
    return "verify";
  }
  const ask: unknown[] = hasAsk ? (permissions!.ask as unknown[]) : [];
  // IN-02: walk permissions.ask in order and take only the FIRST occurrence of each ledger rule.
  const toRemove = new Set(ledger);
  const removing: string[] = [];
  const removingAt = new Set<number>();
  const keptAsk: unknown[] = [];
  const userCopies: string[] = [];
  for (const [k, x] of ask.entries()) {
    if (typeof x === "string" && toRemove.has(x)) {
      toRemove.delete(x);
      removing.push(x);
      removingAt.add(k);
      continue;
    }
    if (typeof x === "string" && ledger.has(x)) userCopies.push(x);
    keptAsk.push(x);
  }
  const presentSet = new Set(ask.filter((x): x is string => typeof x === "string"));

  for (const r of [...ledger].sort()) {
    if (!presentSet.has(r)) report("skipped", `${r} (in the install ledger but not present in ${rel} — already removed)`);
  }
  const ours = new Set(allAskRules());
  for (const r of presentSet) {
    if (ours.has(r) && !ledger.has(r)) {
      report(
        "left",
        `${r} (present in ${rel} but not in the install ledger — there is no record that install added this copy, so it ` +
          `is left in place; remove it by hand if grugops added it)`,
      );
    }
  }

  for (const r of userCopies) {
    report(
      "left",
      `${r} (a further copy in ${rel} beyond the one install added — the user's own copy, left in place)`,
    );
  }

  // Compute the result without touching the parsed object, so a dry run and a no-op write nothing.
  let nextPermissions: Record<string, unknown> | null = permissions;
  if (permissions !== null && hasAsk) {
    nextPermissions = { ...permissions, ask: keptAsk };
    if (led.createdAsk && keptAsk.length === 0) delete nextPermissions.ask;
  }
  const next: Record<string, unknown> = { ...json };
  if (nextPermissions !== null) {
    next.permissions = nextPermissions;
    if (led.createdPermissions && Object.keys(nextPermissions).length === 0) delete next.permissions;
  }
  const nextPerms = next.permissions as Record<string, unknown> | undefined;
  const askLeft = nextPerms !== undefined && Array.isArray(nextPerms.ask) ? (nextPerms.ask as unknown[]) : null;
  // THE TEXT EDIT: the outermost container install created and that is now empty goes as one member;
  // otherwise only the removed rules go, each with its separator (json-text.ts removeItems).
  const permsNode = permsAt === null ? null : permsAt.value;
  const askAt = permsNode === null ? null : memberNamed(permsNode, "ask");
  const indexOf = (node: JsonNode, key: string): Set<number> =>
    new Set([node.kind === "object" ? node.members.findIndex((m) => m.key === key) : -1]);
  let newText = doc.text;
  if (permsNode !== null && !Object.prototype.hasOwnProperty.call(next, "permissions")) {
    newText = removeItems(doc.text, rootNode, indexOf(rootNode, "permissions"));
  } else if (permsNode !== null && askAt !== null && nextPerms !== undefined && !Object.prototype.hasOwnProperty.call(nextPerms, "ask")) {
    newText = removeItems(doc.text, permsNode, indexOf(permsNode, "ask"));
  } else if (askAt !== null) {
    newText = removeItems(doc.text, askAt.value, removingAt);
  }
  // "EMPTY" MEANS INSTALL'S OWN EMPTIED FILE, EXACTLY (red-team L1 of plan 33.1-34, brief DC-2). A file
  // install created is deleted only when what the edit above leaves is byte for byte what the same edit
  // leaves of the file install writes (checkpoint-ask-rules.ts createdSettingsText), and its mode is the
  // one install recorded. It used to be deleted whenever no key was left, so a whitespace-only edit of the
  // user's (an extra final newline, CRLF line ends) or a chmod was deleted with it. A ledger written
  // before the mode was recorded compares the text only, and the line says so.
  const emptiedText = emptiedCreatedSettingsText();
  const modeKept = modeMatches(led.fileMode, read.mode);
  const emptyAsInstalled = led.createdFile && Object.keys(next).length === 0 && newText === emptiedText;
  const deleteFile = emptyAsInstalled && modeKept;
  const keptCreated = led.createdFile && Object.keys(next).length === 0 && !deleteFile;
  const modeNote = led.fileMode === undefined ? `; ${NO_MODE_NOTE}` : "";
  const changed = removing.length > 0 || JSON.stringify(next) !== JSON.stringify(json);
  if (!changed && !deleteFile) {
    report("skipped", `${rel} (no ask rule from the install ledger is present — nothing to remove)`);
    ASK_LEDGER_AFTER = askLedgerAfter(askLeft);
    return "gone";
  }
  const keptWhy = keptCreated
    ? `; grugops created the file, but ${modeKept ? "its text is not what install wrote (a whitespace or line-end edit)" : `its file mode is ${modeText(read.mode)}, not the ${led.fileMode} install wrote`}, so the file was kept`
    : "";
  // THE ORACLE: the edited text must hold exactly the value computed above; otherwise nothing is written.
  // Decided before the DRY_RUN branch, so the preview and the real run agree.
  const check = readJsonText(Buffer.from(newText, "utf8"));
  if (!deleteFile && (!check.ok || !sameJsonValue(documentValue(check), next))) {
    verify(
      `${rel} could not be edited in place without changing anything but the ask rules — left untouched; the ` +
        `${removing.length} ask rule(s) grugops added were NOT removed. Remove them by hand.`,
    );
    return "verify";
  }
  if (DRY_RUN) {
    report(
      "would-remove",
      `${rel} (${removing.length} ask rule(s) grugops added${deleteFile ? `; the file grugops created would be deleted${modeNote}` : keptWhy})`,
    );
    ASK_LEDGER_AFTER = askLedgerAfter(deleteFile ? null : askLeft);
    // The directory install created around the file is the dir walk's (reverseDir runs after every file).
    if (deleteFile) markGone(f);
    return deleteFile ? "removed" : "reversed";
  }
  if (deleteFile) {
    if (!unlinkPath(f, rel, `${rel} (${removing.length} ask rule(s) grugops added; grugops created the file and it is now empty as install wrote it${modeNote})`)) {
      return "verify";
    }
    ASK_LEDGER_AFTER = askLedgerAfter(null);
    return "removed";
  }
  if (!rewritePath(f, newText, rel)) return "verify";
  ASK_LEDGER_AFTER = askLedgerAfter(askLeft);
  report("removed", `${rel} (${removing.length} ask rule(s) grugops added; every other byte preserved${keptWhy})`);
  return "reversed";
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
// It is removed when MARKER (read once, before anything was removed) is `ok` AND its install ledger is
// well-formed (readLedger, the one reader the rest of this run trusts). A marker this run reported
// unreadable (not JSON, not an object, too large, a special file, a link at it or on the way) or holding
// a malformed ledger is the only record of what install did; deleting it would throw away what the human
// needs to finish the reversal by hand, right after telling them it could not be used. So it is left,
// with the reason, next to the verify line that already counted it. The decision is taken before the
// DRY_RUN branch, so the preview decides as the real run does.
//
// AND ONLY WHEN IT IS INSTALL'S OWN MARKER FOR THIS DIRECTORY (plan 33.1-33, brief DC-2, owns "marker";
// red-team B2). A JSON object at this path whose fields do not hold install's values is a file the user
// put there; it used to be deleted by its name alone, in a repository grugops was never installed into.
// Install's marker for another directory (copied, moved, or written before markers were bound or before
// the one ledger) is not this directory's record. Each is left, and the line says why.
//
// IT RETURNS WHAT IT DID (plan 34-26, D-25, sibling C): one MarkerOutcome per arm, and the closing's marker
// line is built from it alone (markerOutcomeLine). The declared return type makes an arm without an outcome
// a compile error.
function removeMarker(): MarkerOutcome {
  const m = `${TARGET}/${MARKER_REL}`;
  if (!pathExists(m)) {
    report("skipped", `${MARKER_REL} (marker not present)`);
    return { kind: "absent" };
  }
  // DC-3 / D-18 (plan 33.1-27): install writes the marker as a regular file inside a real .grugops/
  // directory. Anything else there (a FIFO, a directory, a link, or a link on the way) is not the
  // marker install wrote, was never read (MARKER above says why), and is left in place.
  const way = wayTo(TARGET, m);
  const kind = kindAt(m);
  if ((way !== null && way !== "absent") || kind !== "regular file") {
    const what = way !== null && way !== "absent" ? `${way.at} ${way.reason}` : `it is a ${kind ?? "path that could not be read"}`;
    report("left", `${MARKER_REL} (${what}; not the marker install writes — left in place)`);
    return { kind: "left" };
  }
  // THE ONE AUTHORITY (plan 33.1-38): owns' pseudo-kind `marker` answers owned exactly when this run's ledger
  // read is `ok`, which it is only for install's own marker for this directory holding a well-formed ledger.
  const own = owns(LEDGER, TARGET, MARKER_REL, "marker");
  if (!own.owned && MARKER_READ.state !== "ok") {
    // D-37 (34.1 review CR-05, plan 34.1-42): a marker this run could not use is left in place, and no line here offers
    // removing it or says it is not install's. For a read this run made, the module-top verify already named the cause,
    // the by-hand fix and this run's command, so each line points at it. An unreadable read's line words the cause the
    // reader saw (install-marker.ts markerDefectText of its defect; 34.1 review IN-33): not JSON, not an object, a
    // blocked read, a duplicate key, bytes the strict reader refuses, a field install never writes, a retired record.
    if (MARKER_READ.state === "unreadable") {
      report("left", `${MARKER_REL} (left in place — ${markerDefectText(MARKER_READ.defect)}; see the verify line above)`);
      return { kind: "left" };
    }
    if (MARKER_READ.state === "unbound") {
      report("left", `${MARKER_REL} (it is not a record this run can use: ${MARKER_READ.why}; left in place — see the verify line above)`);
      return { kind: "left" };
    }
    // Not present when this run started, present now: this run read none of its records and printed no verify about
    // it (MSG-1), so the line names this run's own command, which reads it.
    report(
      "left",
      `${MARKER_REL} (it was not present when this run started, so this run read none of its records; left in place — ` +
        `run \`${rerunCommand()}\` again to use it)`,
    );
    return { kind: "left" };
  }
  // MARKER_READ is `ok` here, so MARKER is that read; the check narrows the type.
  if (MARKER.state !== "ok") return { kind: "left" };
  if (!own.owned) {
    // U4: the marker is install's own, with a malformed ledger. D-37 (34.1 review CR-06, plan 34.1-43): it is still the
    // record of every agent installed here on every run kind (a flag-less run over it removes nothing, so no agent left
    // the install), so this line offers nothing by hand: the module-top verify for a malformed ledger, printed before
    // any walk, names the ledger problem, says fix it by hand and never delete the marker, and prints this run's command.
    report(
      "left",
      `${MARKER_REL} (its install ledger is malformed, so the record of what install did could not be used; ` +
        `it was left in place — see the verify line above)`,
    );
    // updateKeptMarker rewrites only install's own marker holding a well-formed ledger, so it leaves this one.
    updateKeptMarker(m, MARKER.marker, MARKER.bytes);
    return { kind: "left" };
  }
  // THE MARKER RULE (plan 33.1-39, review WR-02, D-33 (b)): owned is not enough. While a recorded entry is
  // still in place, or a reversal of one counted a verify, the marker is the record a later run needs to
  // finish, so it is kept and rewritten to list only what is still there. Decided before the DRY_RUN
  // branch, so the preview decides as the real run does.
  // A PARTIAL RUN (phase 34.1, D-05) KEEPS THE MARKER: it is the record of the agents that stay installed. When
  // the flags name no installed agent, nothing was removed and the marker is not touched. Otherwise, once this run's
  // own entries are discharged, it is rewritten (updateKeptMarker): the removed entries leave the ledger and `agents`
  // loses the removed ids. While one of this run's entries is still held, the arm below keeps it the same way.
  if (!FULL && NAMED.length === 0) {
    report("kept", `${MARKER_REL} (none of the named agents is installed here, so nothing in it changes)`);
    return { kind: "kept-for-agents", rewrite: "unchanged" };
  }
  if (!FULL && markerDischarged()) {
    report("kept", `${MARKER_REL} (kept for the agents still installed here: ${nameList(STAYING)})`);
    return { kind: "kept-for-agents", rewrite: updateKeptMarker(m, MARKER.marker, MARKER.bytes) };
  }
  if (!markerDischarged()) {
    const held = heldPaths();
    const why =
      held.length > 0
        ? `${held.length} recorded item(s) are still in place (${held.join(", ")})`
        : "this run could not finish a recorded reversal (see the verify lines above)";
    // MSG-1 (D-26): the remedy is a command this run built (finishCommand), which, run once each named item is removed
    // or restored, finishes the reversal; the agents that stay recorded until then are named.
    const recorded =
      UNFINISHED.length > 0
        ? `${nameList(UNFINISHED)} ${UNFINISHED.length === 1 ? "stays" : "stay"} recorded in its \`agents\` list until ` +
          `the reversal is finished; `
        : "";
    // With nothing held, the marker was kept for a recorded verify: the remedy is the cause the verify line names.
    const once = held.length > 0 ? "once each named item is removed or restored" : "once the cause in each verify line above is fixed";
    // D-32 (CR-03), D-37: the alternative to finishing is keepWithoutRecord's, the one wording the KEPT_FOR banner asks
    // too; it never offers deleting the marker.
    const keep = keepWithoutRecord(held);
    report(
      "left",
      `${MARKER_REL} (kept: ${why}, so the record a later run needs to finish the reversal is kept; ${recorded}${once}, ` +
        `\`${finishCommand()}\` finishes the reversal${keep === "" ? "" : `; ${keep}`})`,
    );
    if (RECORDED_VERIFIES === 0) KEPT_FOR = held.length;
    return { kind: "kept", rewrite: updateKeptMarker(m, MARKER.marker, MARKER.bytes) };
  }
  if (DRY_RUN) {
    report("would-remove", `${MARKER_REL} (grugops-owned marker)`);
    return { kind: "would-remove" };
  }
  // A removal that fails is a counted verify (unlinkPath), and the marker is still there.
  return unlinkPath(m, MARKER_REL, `${MARKER_REL} (grugops-owned marker; seeded .grugops/ state preserved)`)
    ? { kind: "removed" }
    : { kind: "left" };
}

// MarkerOutcome (plan 34-26, D-25, sibling C): what removeMarker() did to .grugops/install.json in this run.
//   removed        it was removed;
//   would-remove   DRY_RUN: it would be removed, and nothing was changed;
//   kept           it was kept to record what is still in place; `rewrite` is what updateKeptMarker did to it;
//   kept-for-agents  a partial run (phase 34.1, D-05) kept it for the agents still installed; `rewrite` as above;
//   left           it was left untouched (the `left` or `verify` line above says why);
//   absent         there was no marker.
type KeptRewrite = "rewritten" | "unchanged" | "would-rewrite" | "not-rewritten";
type MarkerOutcome =
  | { readonly kind: "removed" }
  | { readonly kind: "would-remove" }
  | { readonly kind: "kept"; readonly rewrite: KeptRewrite }
  | { readonly kind: "kept-for-agents"; readonly rewrite: KeptRewrite }
  | { readonly kind: "left" }
  | { readonly kind: "absent" };

// markerOutcomeLine: the closing's sentence about the marker, from the outcome alone.
function markerOutcomeLine(o: MarkerOutcome): string {
  switch (o.kind) {
    case "removed":
      return "removed by this run.";
    case "would-remove":
      return "DRY_RUN: it would be removed; nothing was changed.";
    case "kept":
      switch (o.rewrite) {
        case "rewritten":
          return "kept, and rewritten so its install ledger lists only what is still in place (the `left` line above says why it was kept).";
        case "unchanged":
          return "kept unchanged (the `left` line above says why it was kept).";
        case "would-rewrite":
          return "kept; DRY_RUN: it would be rewritten (see the would-edit line above), and nothing was changed.";
        case "not-rewritten":
          return "kept, but not rewritten (see the verify line above).";
        default: {
          const never: never = o.rewrite;
          return never;
        }
      }
    case "kept-for-agents":
      switch (o.rewrite) {
        case "rewritten":
          return "kept for the agents still installed here, and rewritten so its install ledger and its `agents` list hold only what is still in place.";
        case "unchanged":
          return "kept unchanged for the agents installed here (the `kept` line above says why).";
        case "would-rewrite":
          return "kept for the agents still installed here; DRY_RUN: it would be rewritten (see the would-edit line above), and nothing was changed.";
        case "not-rewritten":
          return "kept for the agents still installed here, but not rewritten (see the verify line above).";
        default: {
          const never: never = o.rewrite;
          return never;
        }
      }
    case "left":
      return "left in place, untouched (the `left` or `verify` line above says why).";
    case "absent":
      return "not present, so there was nothing to remove.";
    default: {
      const never: never = o;
      return never;
    }
  }
}

// updateKeptMarker (red-team of plan 33.1-28, R2, brief DC-2; plan 33.1-39, review WR-02): a marker this
// run keeps must list what is still there, and nothing this run removed or reversed. A record of something
// this run removed would let a later run act on it: when the user later made their own file at that path
// (README §1's copy of AGENTS.md, an empty .github/, their own `Bash(git push *)` rule), the next uninstall
// would remove it on that record. So a well-formed install ledger is rewritten FROM OUTCOMES, through the
// one serializer (ledgerJson):
//   removed, gone        the entry is dropped (nothing of install's is there any more);
//   reversed             a file, block or opencode-permission entry is dropped (install's content in it was taken out; what is
//                        left is the user's); a gemini or ask-rules entry is replaced by its after-record,
//                        which claims nothing (GEMINI_LEDGER_AFTER, ASK_LEDGER_AFTER);
//   left, verify         the entry is kept exactly as found, so a later run can finish it;
//   dir, backup          kept only while the path is still there (and not removed by this run).
// Since phase 34.1 (D-05) its `agents` list is rewritten too (agentsAfter: install-marker.ts agentsToRecord over the
// ledger this rewrite keeps, so an agent stays recorded while it owns a held entry, D-26, D-29). Every other marker field is written back exactly as found, in its order; a malformed ledger is never
// rewritten (nothing in it was used, so nothing in it is changed). The write goes through the one rewrite
// (rewritePath), only after readForWrite (no link followed at the marker or on the way) shows the same
// regular file with the same bytes this run read at its start. When it cannot be written, that is a counted
// verify naming each entry it still lists that this run removed, so the human can take them out by hand.
// The DRY_RUN preview says what it would take out and writes nothing.
// It returns what it did (plan 34-26): rewritten, unchanged (nothing to take out, or not install's marker),
// would-rewrite (DRY_RUN) or not-rewritten (a counted verify says why).
/**
 * keptLedger (plan 34.1-14): the ledger a kept marker records, from LEDGER and OUTCOMES by the rules above. `kept` is the
 * entries the rewrite writes back (an after-record in place of a reversed gemini or ask-rules entry); `stale` names each
 * entry this run took out, for the report and the remedy. updateKeptMarker writes `kept`, and agentsAfter derives the
 * `agents` value from the same list, so the two fields of the rewritten marker cannot disagree.
 */
function keptLedger(): { kept: LedgerEntry[]; stale: string[] } {
  const stale: string[] = [];
  const kept: LedgerEntry[] = [];
  const named = (e: LedgerEntry): string =>
    e.kind === "dir"
      ? `${e.path}/`
      : e.kind === "block"
        ? `${e.path} (its block)`
        : e.kind === "gemini"
          ? `${e.path} (its AGENTS.md entry)`
          : e.kind === "ask-rules"
            ? `${e.path} (its ask rules)`
            : e.kind === "opencode-permission"
            ? `${e.path} (its OpenCode external_directory rule)`
            : e.kind === "backup"
              ? `${e.path} (a backup)`
              : e.path;
  for (const e of LEDGER.entries) {
    const o = OUTCOMES.get(outcomeKey(e));
    if (o === "removed" || o === "gone") {
      stale.push(named(e));
      continue;
    }
    if (e.kind === "dir" || e.kind === "backup") {
      if (pathExists(`${TARGET}/${e.path}`)) kept.push(e);
      else stale.push(named(e));
      continue;
    }
    if (o === "reversed") {
      stale.push(named(e));
      if (e.kind === "gemini" && GEMINI_LEDGER_AFTER !== null) kept.push(geminiEntry(GEMINI_LEDGER_AFTER));
      if (e.kind === "ask-rules" && ASK_LEDGER_AFTER !== null) kept.push(askRulesEntry(ASK_LEDGER_AFTER));
      continue;
    }
    kept.push(e);
  }
  return { kept, stale };
}
/**
 * agentsAfter (phase 34.1, D-05; gap round 1, D-26, D-29): the `agents` a kept marker records, from the one derivation,
 * install-marker.ts agentsToRecord, over the ledger this rewrite keeps (keptLedger). A partial run keeps the agents that
 * stay installed (REMAINING) and the recorded ids the registry does not know, verbatim; a FULL run keeps none. On both,
 * an installed agent that still owns a held entry (an edited file this run left, a reversal that counted a verify)
 * stays recorded, so the command that finishes the reversal (finishCommand) still names it and works. A held entry no
 * agent owns (the D-06 shared footprint) keeps no agent recorded.
 */
function agentsAfter(): string[] {
  return agentsToRecord({
    known: INSTALLED.ids,
    keep: FULL ? [] : REMAINING,
    unknown: !FULL && INSTALLED.source === "recorded" ? INSTALLED.unknown : [],
    entries: keptLedger().kept,
  });
}
/**
 * The marker with `agents` and `ledger` replaced and every other field as found, in its order. A marker written before
 * phase 34.1 has no `agents`; it is put right before `ledger`, where install writes it.
 */
function withAgentsAndLedger(marker: Readonly<Record<string, unknown>>, agents: readonly string[], ledger: unknown): Record<string, unknown> {
  const has = (o: object, k: string): boolean => Object.prototype.hasOwnProperty.call(o, k);
  const next: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(marker)) {
    if (k === "ledger" && !has(next, AGENTS_FIELD)) next[AGENTS_FIELD] = agents;
    next[k] = k === AGENTS_FIELD ? agents : k === "ledger" ? ledger : v;
  }
  if (!has(next, AGENTS_FIELD)) next[AGENTS_FIELD] = agents;
  return next;
}
function updateKeptMarker(m: string, marker: Readonly<Record<string, unknown>>, readBytes: Buffer): KeptRewrite {
  // Only install's own marker, holding a well-formed ledger, is ever rewritten: the one authority answers for
  // the marker (plan 33.1-38).
  if (!owns(LEDGER, TARGET, MARKER_REL, "marker").owned) return "unchanged";
  const { kept, stale } = keptLedger();
  const next = withAgentsAndLedger(marker, agentsAfter(), ledgerJson(kept));
  if (JSON.stringify(next) === JSON.stringify(marker)) return "unchanged";
  // What changes: the ledger (entries this run removed or reversed), the `agents` list (phase 34.1, D-05), or both.
  const ledgerChanged = JSON.stringify(next.ledger) !== JSON.stringify(marker.ledger);
  const agentsChanged = JSON.stringify(next[AGENTS_FIELD]) !== JSON.stringify(marker[AGENTS_FIELD]);
  const what = stale.length > 0 ? stale.join(", ") : "the entries' recorded claims";
  const agentsNow = `[${(next[AGENTS_FIELD] as readonly string[]).join(", ")}]`;
  const remedies: string[] = [];
  if (ledgerChanged) remedies.push(`it still lists what this run removed or reversed (${what}); take those entries out of its install ledger by hand, or a later run may act on them`);
  if (agentsChanged) remedies.push(`its \`agents\` list still names the agents this run removed; set it to ${agentsNow} by hand, or a later install chooses them again`);
  const remedy = remedies.join("; and ") + ".";
  const said = (would: boolean): string => {
    const parts: string[] = [];
    if (ledgerChanged) {
      parts.push(
        would
          ? `the entries this run would remove or reverse would be taken out of its install ledger: ${what}`
          : `the entries this run removed or reversed were taken out of its install ledger: ${what}`,
      );
    }
    if (agentsChanged) parts.push(would ? `its \`agents\` list would become ${agentsNow}` : `its \`agents\` list is now ${agentsNow}`);
    return parts.join("; ");
  };
  if (DRY_RUN) {
    report("would-edit", `${MARKER_REL} (kept; ${said(true)})`);
    return "would-rewrite";
  }
  const cur = readForWrite(TARGET, m);
  if (cur.state !== "ok" || !cur.bytes.equals(readBytes)) {
    verify(`${MARKER_REL} changed since this run read it, so it was not rewritten; ${remedy}`);
    return "not-rewritten";
  }
  if (rewritePath(m, JSON.stringify(next, null, 2) + "\n", MARKER_REL, remedy)) {
    report("edited", `${MARKER_REL} (kept; ${said(false)})`);
    return "rewritten";
  }
  return "not-rewritten";
}

// removeOpenCodePermission (phase 34.1, D-14): reverse install.ts writeOpenCodePermission() BY RECORD (brief DC-2).
//
// The opencode-permission entry names the one member install added to `permission.external_directory` in
// opencode.json (`pattern`), what install created around it, and the record of `external_directory` as install left it
// (`content`). The file is edited ONLY while `external_directory` is still exactly that object: then the recorded member
// goes (json-text.ts removeItems, the span addMember added), then `external_directory` when install created it and it is
// empty again, then `permission` when install created it and it is empty again, and every other byte stays. A file
// install created is deleted only when what is left is byte for byte what the same edit leaves of the file install
// writes (createdOpenCodeText) and its mode is the one install recorded; otherwise it is rewritten and kept.
//
// THE RULE-GONE ARM (plan 34.1-16, review IN-20, brief CLEAN-1): when the recorded rule is no longer in the file (the
// user took it out), install's scaffolding around it is still install's. When the record says install created
// `external_directory`, `permission` or the file, the same splice and THE ORACLE run without the rule step: each
// container install created goes once it is an object with no member left, the file install created goes once what is
// left is byte for byte install's own emptied file with the recorded mode, and the rewrite and the delete are the same
// two calls the main path makes. A container install did not create (createdExternalDirectory or createdPermission
// false), a container holding the user's key or another rule, and a `permission` that is no longer an object all stay,
// so the file comes back unchanged and the entry is `gone` with its `skipped` line. A record that says install created
// nothing around the rule is `gone` at once.
//
// Anything else edits nothing: `external_directory` changed since install left it while the rule is still there (a
// rule the user added: the recorded rule can no longer be shown to be install's) is `left`, with the reason; a file
// that is not a strict JSON object or has a duplicate key is `left`; a path that is a link or a special file is a
// counted verify (the reversal could not be finished). A file already gone is `gone`. Decided before the DRY_RUN
// branch, so the preview reaches the real run's answer and writes nothing.

/** What install created around the recorded rule, as the reversal asks it (the opencode-permission entry's fields). */
interface OpenCodeScope {
  readonly pattern: string;
  readonly createdPermission: boolean;
  readonly createdExternalDirectory: boolean;
}

/**
 * The text left once the recorded rule (when it is still there) and each container install created that is then
 * empty are taken out, or null when the text is not a JSON object. A member that is absent, a container that is not
 * an object and a container install did not create are left as they are, so a file with nothing of install's left in
 * it comes back unchanged (plan 34.1-16, review IN-20).
 */
function strippedOpenCodeText(text: string, led: OpenCodeScope): string | null {
  const step = (t: string): { root: JsonNode; perm: JsonNode | null; ext: JsonNode | null } | null => {
    const d = readJsonText(Buffer.from(t, "utf8"));
    if (!d.ok || d.root.kind !== "object") return null;
    const perm = memberNamed(d.root, "permission")?.value ?? null;
    const ext = perm === null ? null : (memberNamed(perm, "external_directory")?.value ?? null);
    return { root: d.root, perm, ext };
  };
  const indexOf = (node: JsonNode, key: string): Set<number> => new Set([node.kind === "object" ? node.members.findIndex((m) => m.key === key) : -1]);
  let s1 = step(text);
  if (s1 === null) return null;
  let out = text;
  if (s1.ext !== null && memberNamed(s1.ext, led.pattern) !== null) {
    out = removeItems(out, s1.ext, indexOf(s1.ext, led.pattern));
    s1 = step(out);
    if (s1 === null) return null;
  }
  if (led.createdExternalDirectory && s1.perm !== null && s1.ext !== null && s1.ext.kind === "object" && s1.ext.members.length === 0) {
    out = removeItems(out, s1.perm, indexOf(s1.perm, "external_directory"));
    s1 = step(out);
    if (s1 === null) return null;
  }
  if (led.createdPermission && s1.perm !== null && s1.perm.kind === "object" && s1.perm.members.length === 0) {
    out = removeItems(out, s1.root, indexOf(s1.root, "permission"));
  }
  return out;
}

function removeOpenCodePermission(): Outcome {
  const rel = OPENCODE_CONFIG_REL;
  const f = `${TARGET}/${rel}`;
  const own = owns(LEDGER, TARGET, rel, "opencode-permission");
  if (!own.owned || own.entry === null) {
    report("left", `${rel} OpenCode external_directory rule (${own.owned ? "" : own.reason})`);
    return "left";
  }
  const led = own.entry;
  const rule = `the OpenCode external_directory rule ${led.pattern}`;
  // DC-3: readForWrite, never a plain read; a link or a special file is never read or written.
  const read = readForWrite(TARGET, f);
  if (read.state === "create") {
    report("skipped", `${rel} (not present — ${rule} in the install ledger is already gone)`);
    return "gone";
  }
  if (read.state === "blocked") {
    verify(`${rel}: ${read.at} ${read.reason}. It was not read and was left untouched; ${rule} grugops added was NOT removed. Remove it by hand.`);
    return "verify";
  }
  const leftAs = (why: string): Outcome => {
    report("left", `${rel} (${why}, so ${rule} cannot be shown to be what install left there; the file was left byte for byte — remove the rule by hand if grugops added it)`);
    return "left";
  };
  const doc = readJsonText(read.bytes);
  if (!doc.ok) return leftAs(`it ${doc.why}`);
  if (doc.root.kind !== "object") return leftAs("it is not a JSON object");
  if (firstDuplicateKey(doc.root) !== null) return leftAs("it has a duplicate key");
  const permAt = memberNamed(doc.root, "permission");
  const extAt = permAt === null || permAt.value.kind !== "object" ? null : memberNamed(permAt.value, "external_directory");
  const extNow = extAt === null || extAt.value.kind !== "object" ? undefined : (valueOf(doc.text, extAt.value) as Record<string, unknown>);
  const ruleGone = extNow === undefined || !Object.prototype.hasOwnProperty.call(extNow, led.pattern);
  const nothingLeftLine = (why: string): Outcome => {
    report("skipped", `${rel} (${rule} in the install ledger is not there any more — nothing to remove${why})`);
    return "gone";
  };
  // THE RULE-GONE ARM (plan 34.1-16, review IN-20, brief CLEAN-1 and DC-2): a record that says install created
  // nothing around the rule has nothing more to reverse.
  if (ruleGone && !led.createdFile && !led.createdPermission && !led.createdExternalDirectory) return nothingLeftLine("");
  if (!ruleGone && jsonValueRecord(extNow) !== led.content) {
    return leftAs("its permission.external_directory is not the one install left there (a rule was added or changed since)");
  }
  // THE SCOPE of the edit, asked by THE ORACLE and by the splice alike: the recorded rule and the containers the
  // record says install created. A container install did not create is never taken out.
  const scope: OpenCodeScope = { pattern: led.pattern, createdPermission: led.createdPermission, createdExternalDirectory: led.createdExternalDirectory };
  // The value the edit must leave (THE ORACLE), computed without touching the parsed document: the recorded rule,
  // when present, goes; then `external_directory` when install created it, it is an object and it is empty; then
  // `permission` likewise. Anything that is not an object, and anything holding a key, stays.
  const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
  const expected = documentValue(doc) as Record<string, unknown>;
  const removedContainers: string[] = [];
  if (isObject(expected.permission)) {
    const perm = { ...expected.permission };
    if (isObject(perm.external_directory)) {
      const ext = { ...perm.external_directory };
      delete ext[scope.pattern];
      perm.external_directory = ext;
      if (scope.createdExternalDirectory && Object.keys(ext).length === 0) {
        delete perm.external_directory;
        removedContainers.push("`external_directory`");
      }
    }
    expected.permission = perm;
    if (scope.createdPermission && Object.keys(perm).length === 0) {
      delete expected.permission;
      removedContainers.push("`permission`");
    }
  }
  const newText = strippedOpenCodeText(doc.text, scope);
  const check = newText === null ? null : readJsonText(Buffer.from(newText, "utf8"));
  // What this run takes out, as the lines name it: the rule, or (rule gone) the empty containers install created.
  const containers =
    removedContainers.length === 2
      ? "the empty `external_directory` and `permission` objects install created"
      : removedContainers.length === 1
        ? `the empty ${removedContainers[0]} object install created`
        : "the empty containers install created";
  const subject = !ruleGone
    ? `${rule} grugops added`
    : removedContainers.length === 0
      ? `${rule} in the install ledger was already gone`
      : `${containers}; ${rule} in the install ledger was already gone`;
  if (newText === null || check === null || !check.ok || !sameJsonValue(documentValue(check), expected)) {
    verify(
      ruleGone
        ? `${rel} could not be edited in place without changing anything but ${containers} — left untouched; they were NOT removed. Remove them by hand.`
        : `${rel} could not be edited in place without changing anything but ${rule} — left untouched; the rule was NOT removed. Remove it by hand.`,
    );
    return "verify";
  }
  // "EMPTY" MEANS INSTALL'S OWN EMPTIED FILE, EXACTLY, AND ITS MODE (removeAskRules' rule).
  const emptied = strippedOpenCodeText(createdOpenCodeText(led.pattern), scope);
  const modeKept = modeMatches(led.fileMode, read.mode);
  const emptyAsInstalled = led.createdFile && newText === emptied;
  const deleteFile = emptyAsInstalled && modeKept;
  const modeNote = led.fileMode === undefined ? `; ${NO_MODE_NOTE}` : "";
  const keptWhy = emptyAsInstalled && !modeKept ? `; grugops created the file, but its file mode is ${modeText(read.mode)}, not the ${led.fileMode} install wrote, so the file was kept` : "";
  // Rule gone and nothing of install's left to take out: the file stays as it is (its own words say why when it is
  // install's emptied file with another mode).
  if (ruleGone && !deleteFile && newText === doc.text) return nothingLeftLine(keptWhy);
  if (DRY_RUN) {
    report("would-remove", `${rel} (${subject}${deleteFile ? `; the file grugops created would be deleted${modeNote}` : `; every other byte would be preserved${keptWhy}`})`);
    if (deleteFile) markGone(f);
    return deleteFile ? "removed" : "reversed";
  }
  if (deleteFile) {
    return unlinkPath(f, rel, `${rel} (${subject}; grugops created the file and it is now empty as install wrote it${modeNote})`) ? "removed" : "verify";
  }
  const byHand = ruleGone ? `remove ${containers} from ${rel} by hand.` : `remove ${JSON.stringify(led.pattern)} from permission.external_directory by hand.`;
  if (!rewritePath(f, newText, rel, byHand)) return "verify";
  report("removed", `${rel} (${subject}; every other byte preserved${keptWhy})`);
  return "reversed";
}

// ── THE LEDGER WALK (plan 33.1-38, review WR-01, D-33 (b), brief §2.2) ──────────────────────────────
// walkLedger visits every entry of the one install ledger, in a fixed kind order, and hands each to its
// kind's reversal; each reversal asks owns before it deletes or edits anything (see the header). It runs
// only when the ledger read is `ok`: a malformed ledger or an unusable marker removes and edits nothing
// (the one verify at the top of the removal sequence said why). The order:
//   ask-rules, opencode-permission, gemini   the settings edits, before the directories that hold them;
//   block               each pointer block, and with it the pointer file install created at that path;
//   file                every other recorded file (a pointer file with no block entry is named, kept);
//   backup              reported, never removed;
//   dir                 deepest first, after every file, so a directory is reached once this run's
//                       removals from it are done.
// The kinds `kit` is never in a target ledger (readLedger refuses it there, KINDS_BY_SCOPE).
function reverseAskRules(entry: { readonly path: string; readonly kind: "ask-rules" }): void {
  setOutcome(entry, removeAskRules());
}
function reverseOpenCodePermission(entry: { readonly path: string; readonly kind: "opencode-permission" }): void {
  setOutcome(entry, removeOpenCodePermission());
}
function reverseGemini(entry: { readonly path: string; readonly kind: "gemini" }): void {
  setOutcome(entry, unmergeGemini());
}
const depthOf = (rel: string): number => rel.split("/").length;
function walkLedger(): void {
  if (LEDGER.state !== "ok") return;
  // Every verify counted from here to the end of the walk is a reversal's, for a recorded entry (plan 33.1-39).
  const verifiesBefore = VERIFY_FINDINGS;
  // D-05: a partial run visits only the entries inScope answers yes for; every other entry gets no outcome, so
  // updateKeptMarker keeps it verbatim for the agents that stay installed.
  const inScopeOf = <E extends LedgerEntry>(entries: readonly E[]): E[] => entries.filter(inScope);
  for (const e of inScopeOf(entriesOfKind(LEDGER, "ask-rules"))) reverseAskRules(e);
  for (const e of inScopeOf(entriesOfKind(LEDGER, "opencode-permission"))) reverseOpenCodePermission(e);
  for (const e of inScopeOf(entriesOfKind(LEDGER, "gemini"))) reverseGemini(e);
  for (const e of inScopeOf(entriesOfKind(LEDGER, "block"))) reverseBlock(e);
  for (const e of inScopeOf(entriesOfKind(LEDGER, "file"))) {
    if (BLOCK_RELS.includes(e.path)) {
      // The pointer file install created: reverseBlock decided it with its block; without a block entry it is kept.
      if (entryAt(LEDGER, e.path, "block") === undefined) reversePointerFileWithoutBlock(e);
      continue;
    }
    reverseFile(e);
  }
  for (const e of inScopeOf(entriesOfKind(LEDGER, "backup"))) reportBackup(e);
  const dirs = inScopeOf(entriesOfKind(LEDGER, "dir")).sort((a, b) => depthOf(b.path) - depthOf(a.path) || (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  for (const d of dirs) reverseDir(d);
  RECORDED_VERIFIES = VERIFY_FINDINGS - verifiesBefore;
}

// ── THE REPORT-ONLY PASSES (plan 33.1-38) ─────────────────────────────────────────────────────────
// Each names a present grugops-shaped path that has NO ledger entry, as `left`, with the reason, and
// calls no removal helper: no unlinkPath, no rewritePath, no rmdirIfEmpty. A path the ledger records is
// the walk's, and these passes skip it. What install has no record of writing is the user's to remove.

/** Why a grugops-shaped file with no ledger entry is left, by the ledger's state (the kit-file wording of plan 33.1-30). */
function unrecordedFileReason(): string {
  if (MARKER.state === "unreadable" || LEDGER.state === "malformed") {
    return "the install ledger could not be used (see the verify line above) — left in place";
  }
  if (MARKER.state === "absent") {
    return "there is no install marker, so there is no record that install wrote it — left in place; remove it by hand if grugops put it there";
  }
  return "install has no record of writing it — it is not in the install ledger; left in place";
}

// KIT_VERSION_DIFFERS (red-team L3 of plan 33.1-34): the one wording of a file that differs from this
// kit version's copy with no record showing who wrote it. It may be from an earlier grugops version or
// edited; nothing this run read says which, so neither is claimed.
const KIT_VERSION_DIFFERS = "it differs from this kit version's file (it may be from an earlier grugops version, or edited)";

/**
 * The left line of an unrecorded grugops-shaped file at `rel`, compared with its kit source `src` only to
 * word it. `src` is null when this kit version ships no file by that name (or its source could not be read).
 */
function reportUnrecordedFile(rel: string, src: string | null, reason: string, noSource = "this kit version ships no file by that name"): void {
  const f = `${TARGET}/${rel}`;
  const d = removalDecision(f, rel, null);
  if (d.act === "absent" || d.act === "refused") return;
  // removalDecision answers `remove` only for a regular file inside the target (a link here has no own
  // link to match): only then is it read, and only to word the line.
  if (d.act !== "remove") {
    report("left", `${rel} (it is not a regular file inside the target, so it was not read or changed; ${reason})`);
  } else if (src === null) {
    report("left", `${rel} (${noSource}, and ${reason})`);
  } else if (isFile(src) && sameFileBytes(src, f)) {
    report("left", `${rel} (it is byte-identical to its source, but ${reason})`);
  } else {
    report("left", `${rel} (${KIT_VERSION_DIFFERS}, and ${reason})`);
  }
}

/** The names in `d` (a real directory inside the target, no link on the way or at it), sorted; [] otherwise. */
function realDirNames(d: string): string[] {
  if (wayTo(TARGET, d) !== null || !isDir(d)) return [];
  try {
    return readdirSync(d).sort();
  } catch {
    return [];
  }
}

/** The skill directory names the kit source ships, and the grugops-prefixed ones already in the target, sorted. */
function grugopsSkillNames(): string[] {
  const names = new Set(SRC_SKILLS ?? []);
  for (const n of realDirNames(`${TARGET}/.claude/skills`)) if (n.startsWith("grugops")) names.add(n);
  return [...names].sort();
}

// reportUnrecordedKitPaths: a grugops-shaped skill or adapter file present in the target with no ledger
// entry. The candidates are the names this checkout's kit source ships AND the grugops-prefixed names
// already in the target (`.claude/agents/grugops*.md`, `.claude/skills/grugops*/SKILL.md`), so a file of
// another grugops version, or one a user made there, is named even when this kit source does not ship it
// or cannot be read. Listing the target's names is safe here because nothing is removed on them: a name
// is never a record (plan 33.1-28).
function reportUnrecordedKitPaths(): void {
  const reason = unrecordedFileReason();
  if (SRC_SKILLS === null) {
    report(
      "note",
      `.claude/skills/ — cannot read ${join(GRUGOPS_SRC, ".claude", "skills")}, so the report of grugops skill files ` +
        `the install ledger does not record is skipped. Removal does not depend on the kit source: the install ledger decides it.`,
    );
  }
  if (SRC_ADAPTERS === null) {
    report(
      "note",
      `.claude/agents/ — cannot read ${join(GRUGOPS_SRC, ".claude", "agents")}, so the report of grugops adapters the ` +
        `install ledger does not record is skipped. Removal does not depend on the kit source: the install ledger decides it.`,
    );
  }
  const noSource = (shipped: readonly string[] | null): string =>
    shipped === null ? "this kit version's source could not be read to compare it" : "this kit version ships no file by that name";
  for (const s of grugopsSkillNames()) {
    const rel = `.claude/skills/${s}/SKILL.md`;
    if (entryAt(LEDGER, rel, "file") !== undefined) continue;
    const shipped = SRC_SKILLS !== null && SRC_SKILLS.includes(s);
    reportUnrecordedFile(rel, shipped ? join(GRUGOPS_SRC, ".claude", "skills", s, "SKILL.md") : null, reason, noSource(SRC_SKILLS));
  }
  const adapters = new Set(SRC_ADAPTERS ?? []);
  for (const n of realDirNames(`${TARGET}/.claude/agents`)) {
    if (n.startsWith("grugops") && n.endsWith(".md") && !n.includes(KIT_BACKUP_INFIX)) adapters.add(n);
  }
  for (const a of [...adapters].sort()) {
    const rel = `.claude/agents/${a}`;
    if (entryAt(LEDGER, rel, "file") !== undefined) continue;
    const shipped = SRC_ADAPTERS !== null && SRC_ADAPTERS.includes(a);
    reportUnrecordedFile(rel, shipped ? join(GRUGOPS_SRC, ".claude", "agents", a) : null, reason, noSource(SRC_ADAPTERS));
  }
}

// reportUnrecordedAgentsMd: an AGENTS.md with no ledger entry. README §1's minimal path copies the kit's
// AGENTS.md into a repository by hand, so a byte-identical copy, or a link to the checkout's AGENTS.md, is
// not install's without a record (plan 33.1-28, carry #2). It is never removed; the line says what this
// run saw. A link is never followed (isOwnLink reads only the link).
function reportUnrecordedAgentsMd(): void {
  if (entryAt(LEDGER, "AGENTS.md", "file") !== undefined) return;
  const agents = `${TARGET}/AGENTS.md`;
  const srcAgents = join(GRUGOPS_SRC, "AGENTS.md");
  const reason = notRecordedReason(LEDGER, "file");
  if (isSymlink(agents)) {
    if (!isOwnLink(agents, srcAgents)) report("skipped", "AGENTS.md (user-owned symlink — left untouched)");
    else report("left", `AGENTS.md (it matches the grugops kit, but ${reason})`);
  } else if (isFile(agents) && isFile(srcAgents) && sameFileBytes(srcAgents, agents)) {
    report("left", `AGENTS.md (it matches the grugops kit, but ${reason})`);
  } else if (!pathExists(agents)) {
    report("skipped", "AGENTS.md (not present)");
  } else if (!isFile(agents)) {
    report("left", `AGENTS.md (it is a ${kindAt(agents) ?? "path that could not be examined"}, not a file install writes — left untouched)`);
  } else {
    // WHAT THE RUN PROVED (red-team L3 of plan 33.1-34): it differs from this kit version's AGENTS.md, and
    // install has no record of it. It may be the user's own, an earlier version's, or edited.
    report(
      "left",
      "AGENTS.md (it differs from this kit version's AGENTS.md (it may be your own, from an earlier grugops version, " +
        "or edited) — left untouched)",
    );
  }
}

// reportUnrecordedSettings: .gemini/settings.json and .claude/settings.json with no gemini or ask-rules
// entry. Neither is read for removal or rewritten: their text and shape are not a record of what install
// did (plan 33.1-29, re-review CR-03; D-18). The lines say why, by the ledger's state. `which` says which of the two
// this run reports (phase 34.1, D-05): a partial run reports the ask rules only when it removes Claude Code, and the
// Gemini settings, shared by no agent (D-23), only on a FULL run.
function reportUnrecordedSettings(which: { readonly gemini: boolean; readonly askRules: boolean }): void {
  if (which.gemini && entryAt(LEDGER, GEMINI_SETTINGS_REL, "gemini") === undefined && !isProtected(`${TARGET}/${GEMINI_SETTINGS_REL}`)) {
    const rel = GEMINI_SETTINGS_REL;
    // DC-3 (plan 33.1-27): readForWrite only asks whether anything is there; nothing is read for an edit.
    const read = readForWrite(TARGET, `${TARGET}/${rel}`);
    if (read.state === "create") report("skipped", `${rel} (not present)`);
    else if (MARKER.state === "absent") report("left", `${rel} (no install marker, so there is no record of what install changed in it — left untouched)`);
    else if (MARKER.state === "unreadable") {
      report("left", `${rel} (the install marker could not be used (see the verify line above), so there is no usable record of what install changed in it — left untouched)`);
    } else if (LEDGER.state === "malformed") report("left", `${rel} (the install ledger could not be used — see the verify line above; left untouched)`);
    else {
      report(
        "left",
        `${rel} (the install ledger has no gemini entry, so there is no record of what install changed in it — left ` +
          `untouched; if grugops added AGENTS.md to context.fileName, remove that entry by hand)`,
      );
    }
  }
  if (which.askRules && entryAt(LEDGER, ASK_RULES_REL, "ask-rules") === undefined && !isProtected(`${TARGET}/${ASK_RULES_REL}`)) {
    const rel = ASK_RULES_REL;
    if (MARKER.state === "absent") {
      report("skipped", `${rel} ask rules (no install marker, so no ledger of added rules — nothing removed)`);
    } else if (MARKER.state === "unreadable") {
      verify(
        `${rel} ask rules — .grugops/install.json could not be used as install's marker (${MARKER.why}), so the ledger of rules ` +
          `grugops added is unknown and NO ask rule was removed. Remove the grugops ask rules by hand.`,
      );
    } else if (LEDGER.state === "malformed") {
      // The one verify at the top of the removal sequence counted the malformed ledger (plan 33.1-36).
      report("left", `${rel} ask rules (the install ledger could not be used — see the verify line above; nothing removed)`);
    } else {
      report(
        "skipped",
        `${rel} ask rules (the install ledger has no ask-rules entry, so there is no record of rules install added; nothing removed)`,
      );
    }
  }
}

// reportUnrecordedDir: an empty directory among the fixed candidates (and an empty skill directory this
// checkout's kit source names) that the ledger has no `dir` entry for. Its name is not a record (plan
// 33.1-28 removed the `grugops`-name rule): it is reported `left` and never removed. It is named only when
// it is empty once this run's removals are counted, as the reversal of a recorded directory would be.
function reportUnrecordedDir(d: string): void {
  const rel = canonicalPathSpelling(relative(TARGET, d));
  if (entryAt(LEDGER, rel, "dir") !== undefined) return;
  if (isProtected(d) || wayTo(TARGET, d) !== null || !isDir(d)) return;
  let entries: string[];
  try {
    entries = readdirSync(d);
  } catch {
    return;
  }
  if (entries.some((e) => !GONE_THIS_RUN.has(resolve(d, e)))) return;
  report("left", `${d} (${notRecordedReason(LEDGER, "directory")})`);
}

// reportKitBackups (plan 33.1-32, D-32, D-18): the backups install made of the user's edited kit
// files before it refreshed the kit, `<file>.grugops-edited-<UTC stamp>` beside the file. They hold
// the user's edits, so they are the user's: uninstall never removes or claims one, and each is reported
// `left` so the human knows where the edits are. Since plan 33.1-40 install records each one as a
// `backup` entry, which reportBackup names; a name with an entry is skipped here, and this pass names
// only a name with no record (made before this release, or by someone else). It lists the names in
// .claude/agents/ and in each .claude/skills/grugops*/ (readdirSync: names only, no content read),
// each only when it is a real directory inside the target (no link on the way or at it). A directory
// holding a backup is not empty, so rmdirIfEmpty keeps it.
const KIT_BACKUP_INFIX = ".grugops-edited-";
const KIT_BACKUP_INCOMPLETE = ".incomplete";
function reportKitBackups(): void {
  const realDir = (d: string): boolean => wayTo(TARGET, d) === null && isDir(d);
  const names = (d: string): string[] => {
    try {
      return readdirSync(d).sort();
    } catch {
      return [];
    }
  };
  const dirs: string[] = [];
  const agents = `${TARGET}/.claude/agents`;
  if (realDir(agents)) dirs.push(agents);
  const skills = `${TARGET}/.claude/skills`;
  if (realDir(skills)) {
    for (const n of names(skills)) {
      if (n.startsWith("grugops") && realDir(`${skills}/${n}`)) dirs.push(`${skills}/${n}`);
    }
  }
  for (const d of dirs) {
    for (const n of names(d)) {
      if (!n.includes(KIT_BACKUP_INFIX)) continue;
      // Recorded: reportBackup named it from the ledger.
      if (entryAt(LEDGER, canonicalPathSpelling(relative(TARGET, `${d}/${n}`)), "backup") !== undefined) continue;
      // A name ending in `.incomplete` is a copy install could not finish (red-team W1 of plan 33.1-32:
      // install writes a byte backup under this name and gives it the backup name only when it is
      // whole). It is not a backup of the edit, so it is never called one.
      // WHAT THE RUN PROVED (red-team L3 of plan 33.1-34, "No fabrication"). A name with no record is all
      // this run saw: the line says the name matches install's pattern and claims nothing about who made
      // the file. It used to call any such file "a backup install made", in a repository with no marker
      // too, and to tell the user to remove an `.incomplete`-named file by hand, which would delete a file
      // of theirs that only shares the name.
      if (n.endsWith(KIT_BACKUP_INCOMPLETE)) {
        report(
          "left",
          `${d}/${n} (its name matches the name install gives a backup copy of an edited kit file that it could not ` +
            `finish (<file>${KIT_BACKUP_INFIX}<UTC stamp>${KIT_BACKUP_INCOMPLETE}); nothing records that install made ` +
            `it, so it is not claimed or removed — if install made it, it is not a full copy of the edit)`,
        );
      } else {
        report(
          "left",
          `${d}/${n} (its name matches the name install gives a backup of an edited kit file ` +
            `(<file>${KIT_BACKUP_INFIX}<UTC stamp>); nothing records that install made it, so it is not claimed or ` +
            `removed — if install made it, it holds your edit)`,
        );
      }
    }
  }
}

// sameFileBytes: byte-identical content compare following symlinks (mirrors `cmp -s`). Used for
// the report-only passes (plan 33.1-38): it words the `left` line of an AGENTS.md, a kit file or a
// runnable the ledger does not record, and never decides a removal. DC-3 (plan
// 33.1-27): both sides are read through readUserFile, so a FIFO, directory or
// device on either side (the kit source included) is never opened; the answer is "the same" only when
// BOTH reads are `ok` and their bytes are equal. That one guard serves every caller.
function sameFileBytes(a: string, b: string): boolean {
  const ra = readUserFile(a);
  if (ra.state !== "ok") return false;
  const rb = readUserFile(b);
  if (rb.state !== "ok") return false;
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
  const looksLikeSource = canonicalPathSpelling(resolve(TARGET)) === canonicalPathSpelling(GRUGOPS_SRC) || hasSourceMarkers(TARGET);
  if (looksLikeSource) {
    process.stderr.write(
      `refusing: target looks like the grugops source checkout (${TARGET}) — uninstalling here would ` +
        `delete the kit's own committed adapters and skills under .claude/. You probably meant ` +
        `--target <your-repo>. Pass --allow-self to override.\n`,
    );
    process.exit(1);
  }
}

console.log("== grugops uninstall ==");
console.log(`target: ${TARGET}`);
console.log(`source: ${GRUGOPS_SRC}`);
if (DRY_RUN) console.log("mode:   DRY_RUN (no filesystem changes)");

// The kit source's skill and adapter names, read once here, before anything is removed. Since plan
// 33.1-38 they only word the report of unrecorded grugops-shaped paths (reportUnrecordedKitPaths); the
// ledger walk decides every removal.
const SRC_SKILLS = srcSkillNames(GRUGOPS_SRC);
const SRC_ADAPTERS = srcAdapterFiles(GRUGOPS_SRC);

// THE ONE INSTALL LEDGER (D-33 (b), plan 33.1-36), read ONCE here, before anything is removed and
// before removeMarker() deletes the marker that holds it. Every pass asks it through the one reader
// (readLedger) and the one authority (owns, entryAt); no pass reads the marker's fields itself. A
// malformed ledger or an unusable marker is ONE `verify` finding, and nothing is removed or edited on
// it: each path is left for the human.
// Red-team of plan 33.1-27 (B3): read without following a link (install-marker.ts says why). A link
// at the marker or on the way to it is `unreadable`, so no record that is not this target's own is
// ever believed.
//
// THE MARKER MUST BE INSTALL'S OWN, FOR THIS DIRECTORY (plan 33.1-33, brief DC-2; red-team B2 of plan
// 33.1-33). MARKER_READ is what is at the path, as the one reader both binaries ask
// (install-marker.ts readInstallMarker) classifies it: `ok` only for a marker whose fields hold
// install's values, whose `target` is this directory's real path, and which carries the one ledger.
// owns(LEDGER, TARGET, MARKER_REL, "marker") answers owned only for that `ok` read with a well-formed ledger.
//   - A JSON object whose fields do not hold install's values (a user's file, a hand-made marker with
//     empty strings or an installMode of "banana"), or one that carries the ledger next to a retired
//     record, is `unreadable` with jsonObject: it is not install's.
//   - Install's marker shape for ANOTHER directory, one written before markers carried `target`, or one
//     written before the one ledger, is `unbound` (unboundBy says which). Its records describe the
//     directory it was written in, or are in a shape this build does not read: a `.grugops/` copied from
//     another installed repository into one that took README §1's copy path made this run remove the
//     user's AGENTS.md, their runnable and their tools/grugops/ on the copied records. The binding is
//     the real path, so a moved or renamed repository reads as unbound too; the verify below gives the
//     remedy.
// MARKER, the read every pass consults, treats both as a marker that could not be used: no record in it
// is believed, nothing is removed on it, and it is left in place.
const MARKER_READ: InstallMarkerRead = readInstallMarker(TARGET);
// COMMAND_CONTEXT (phase 34.1 gap round 2, D-33, review WR-19; gap round 3, D-36, review WR-22): how this run was
// invoked, built once, for every command it prints (host-tools.ts agentCommand's fourth argument, passed by rerunCommand,
// reinstallCommand and finishCommand). It is host-tools.ts commandContextFromRecord's answer for MARKER_READ and this
// run, the one derivation install.ts uses too, so both binaries print the same install command for one marker. The
// script directory is this script's own, so a printed command names uninstall.js (or install.js) by its absolute path
// and runs from any directory. An uninstall.js command carries no kit home and no install mode (scriptCommand): this
// binary removes by the install record alone and never reads or removes the kit. The kit home and the install mode
// decide only the text of an install command this run prints, never a removal (brief DC-2: nothing here is read by an
// owns() question).
//   - This run's kit home is the GRUGOPS_HOME it was given, when it is set and not blank, resolved and spelled as
//     install.ts spells its own (canonicalPathSpelling(resolve(...))); else the default `~/.grugops`, which the owner
//     turns into no GRUGOPS_HOME prefix.
//   - An uninstall run has no install mode (it refuses `--symlink` as an unknown argument), so this run's is copy.
//   - Nothing from an `unbound` marker reaches a printed command: it is another directory's record (copied, moved, or
//     written before markers carried `target`), and for a cloned repository it names another person's paths, so a
//     command built from it would write a kit where this user never installed one (WR-22). Over an unusable marker the
//     install commands this run prints therefore carry this run's kit home and are copy-mode.
//   - Over an `ok` marker the owner takes the record's kit home and install mode. Uninstall prints an install command
//     only over a marker it cannot use today, so that is the rule, not a path a printed command takes.
// It is declared after MARKER_READ and before the first verify that prints rerunCommand(); no statement above this
// line calls rerunCommand, reinstallCommand or finishCommand at module load (they are called only from the passes and
// verifies below).
// DEFAULT_KIT_HOME is `~/.grugops` under this run's home directory, in the one spelling. The two unusable-marker
// verifies below name contextKitHome(COMMAND_CONTEXT, DEFAULT_KIT_HOME), the kit home their printed install step copies
// the kit into (plan 34.1-41, D-36), so the user sees where that step puts the kit before running it.
// The kit checkout (plan 34.1-37, D-36, review WR-23): `src` is this run's GRUGOPS_SRC and `checkout` this script's own
// checkout, both in the one spelling; the marker records no checkout, so `src` always comes from the run. When they
// differ, every command this run prints carries `GRUGOPS_SRC=<src>` (host-tools.ts scriptCommand): an uninstall command
// because this binary's report of files grugops did not record reads the kit source (GRUGOPS_SRC), so a re-run reports
// against the same checkout this run did, and an install command because install renders from it.
const GIVEN_KIT_HOME = process.env.GRUGOPS_HOME;
const DEFAULT_KIT_HOME = canonicalPathSpelling(resolve(homedir(), ".grugops"));
const COMMAND_CONTEXT: CommandContext = commandContextFromRecord(MARKER_READ, {
  scriptDir: canonicalPathSpelling(SCRIPT_DIR),
  kitHome: GIVEN_KIT_HOME && GIVEN_KIT_HOME.trim() ? canonicalPathSpelling(resolve(GIVEN_KIT_HOME)) : DEFAULT_KIT_HOME,
  defaultKitHome: DEFAULT_KIT_HOME,
  symlink: false,
  src: canonicalPathSpelling(GRUGOPS_SRC),
  checkout: canonicalPathSpelling(resolve(SCRIPT_DIR, "..")),
});
// MARKER's type is not InstallMarkerRead (D-37): an unbound read folded in carries no reader defect and no problems, so
// its `unreadable` arm holds only what every pass reads of it (state, why, jsonObject). A remedy over the marker reads
// MARKER_READ, the reader's own answer.
type MarkerUse =
  | Exclude<InstallMarkerRead, { readonly state: "unbound" | "unreadable" }>
  | { readonly state: "unreadable"; readonly marker: null; readonly why: string; readonly jsonObject: boolean };
const MARKER: MarkerUse =
  MARKER_READ.state === "unbound" ? { state: "unreadable", marker: null, why: MARKER_READ.why, jsonObject: true } : MARKER_READ;
const LEDGER: LedgerRead = readLedger(MARKER.state === "ok" ? MARKER.marker : null);
if (MARKER_READ.state === "unbound") {
  const here = MARKER_READ.here ?? TARGET;
  if (MARKER_READ.unboundBy === "other-directory") {
    verify(
      `.grugops/install.json is install's marker, but not this directory's record: ${MARKER_READ.why}. So none of its ` +
        `records is used here (the install ledger), and this run removes and edits nothing on it. If this is the same ` +
        `repository moved or renamed${MARKER_READ.boundTo !== null ? ` from ${MARKER_READ.boundTo}` : ""}, set "target" in the marker to ` +
        `${JSON.stringify(here)} and run \`${rerunCommand()}\` again. Otherwise run \`${reinstallCommand()}\`${NO_FLAG_INSTALL_CLAUSE}: it copies ` +
        `the kit into ${contextKitHome(COMMAND_CONTEXT, DEFAULT_KIT_HOME)}, writes a marker for this directory and ` +
        `carries none of these records; then run \`${rerunCommand()}\`: what an earlier ` +
        `install made here is then left and reported, for you to remove by hand.`,
    );
  } else {
    // D-31 item 5's remedy, for a marker written before markers were bound (no-target) or before the
    // one ledger (no-ledger): neither carries a record this build reads. The remedy is two printed commands (plan
    // 34.1-26, D-33, WR-20): the install command with this run's agents (reinstallCommand, with the no-agent-flag
    // clause on a flag-less run), then this run's uninstall command (rerunCommand).
    verify(
      `.grugops/install.json is install's marker, but not a record this run can use: ${MARKER_READ.why}. So none of ` +
        `its records is used here, and this run removes and edits nothing. Run \`${reinstallCommand()}\`` +
        `${NO_FLAG_INSTALL_CLAUSE}, then \`${rerunCommand()}\`: install copies the kit into ` +
        `${contextKitHome(COMMAND_CONTEXT, DEFAULT_KIT_HOME)}, writes a marker for this directory with the ` +
        `install ledger and carries none of these records, so what an earlier install made here is then left and ` +
        `reported, for you to remove by hand.`,
    );
  }
} else if (MARKER.state === "unreadable") {
  // D-37 (34.1 review CR-05, plan 34.1-42): one reading for every unreadable read (not JSON, not an object, a blocked
  // read, a duplicate key, the strict reader, a field install never writes, a retired record). It names the cause the
  // reader saw, says to fix the file by hand and never delete the marker (install-marker.ts markerFixText, of the
  // owner's answer, which supplies the read's problems as `fix`), and prints this run's own command. It never offers
  // removing the marker or anything else by hand (D-37: the owner has no removal answer for any read).
  const remedy = markerRemedy(MARKER_READ) ?? noMarkerRemedy("uninstall: unreadable marker");
  verify(
    `.grugops/install.json ${markerUnusableText(MARKER)}, so this run uses none of its records and removes and edits ` +
      `nothing here. ${markerFixText(remedy)}; then run \`${rerunCommand()}\` again.`,
  );
} else if (LEDGER.state === "malformed") {
  // D-37 (34.1 review CR-06, plan 34.1-43): install's own marker with a malformed install ledger is the record of every
  // agent installed here, on every run kind; a malformed ledger is typically one bad entry, and fixing it gives the
  // whole record back. One reading: the cause (readLedger's why), the owner's never-remove wording (install-marker.ts
  // markerFixText of markerRemedy's answer, whose fix names that why and the by-hand fix), and this run's own command.
  // It offers removing neither the marker nor any file by hand, on any run kind.
  const remedy = markerRemedy(MARKER_READ) ?? noMarkerRemedy("uninstall: malformed ledger");
  verify(
    `.grugops/install.json holds a malformed install ledger (${LEDGER.why}), so this run uses none of its records and ` +
      `removes and edits nothing here. ${markerFixText(remedy)}; then run \`${rerunCommand()}\` again.`,
  );
}

// ── WHICH AGENTS THIS RUN REMOVES (phase 34.1, D-05, D-20, D-23) ─────────────────────────────────────────────────
// INSTALLED is the one derivation of the installed set (install-marker.ts installedAgents: the marker's recorded
// `agents`, or a pre-34.1 install's legacy set from LEGACY_ADAPTER_KINDS, or none), read from the same two reads every pass
// uses. It is never derived from what is on disk (brief DC-2).
//   NAMED       the agents the flags name that are installed here;
//   REMAINING   the installed agents the flags do not name: they stay installed;
//   STAYING     REMAINING, then any recorded id this build's registry does not know (an agent of another grugops
//               version). It is kept in the record and still counts as installed, so removing every known agent while
//               one is recorded is not FULL: the shared footprint it may read stays;
//   FULL        no agent flag, or the flags name installed agents and none stays (STAYING is empty): the run removes
//               everything the ledger records, the shared footprint (D-06) included, exactly as before this phase.
// A partial run (not FULL) reverses a ledger entry only when inScope answers yes: an agent it removes (one of NAMED)
// owns the entry and no agent that stays owns it (host-tools.ts entryOwners). So `.agents/skills/grugops/SKILL.md`
// (Codex CLI and Antigravity CLI) stays while either is installed (D-20), and an entry no agent owns (the kit's
// AGENTS.md copy, tools/grugops/, the legacy gemini entry, D-23) is reversed only by a FULL run. Every reversal still
// asks owns first.
const INSTALLED = installedAgents(MARKER_READ, LEDGER);
const NAMED: readonly string[] = INSTALLED.ids.filter((id) => REMOVE.has(id));
const REMAINING: readonly string[] = INSTALLED.ids.filter((id) => !REMOVE.has(id));
const STAYING: readonly string[] = [...REMAINING, ...(INSTALLED.source === "recorded" ? INSTALLED.unknown : [])];
const FULL = REMOVE.size === 0 || (NAMED.length > 0 && STAYING.length === 0);
/**
 * INSTALLED_UNKNOWN (plan 34.1-26, D-31, review IN-27): a marker is present (MARKER_READ is not `absent`) but
 * installedAgents read no installed set from it (source `none`): it is another directory's marker, one with no target
 * or no install ledger, one that cannot be read, or one with no `agents` field whose ledger is malformed. Each of those
 * prints a verify line above (the module-top verifies). Whether an agent is installed here is then unknown, not "none",
 * so the `agents to remove` line, the per-flag note and AGENTS_CLAUSE say unknown and point at that verify line. It
 * decides only wording: NAMED is empty, so nothing is removed for any agent (brief DC-2).
 */
const INSTALLED_UNKNOWN = INSTALLED.source === "none" && MARKER_READ.state !== "absent";
/** Whether this run may reverse ledger entry `e` (D-05): every entry on a FULL run; otherwise the rule above. */
function inScope(e: { readonly path: string; readonly kind: string }): boolean {
  if (FULL) return true;
  const owners = entryOwners(e);
  return owners.some((id) => NAMED.includes(id)) && !owners.some((id) => REMAINING.includes(id));
}
const hostName = (id: string): string => HOST_TOOLS.find((h) => h.id === id)?.name ?? id;
const nameList = (ids: readonly string[]): string => (ids.length === 0 ? "none" : ids.map(hostName).join(", "));
/** The HOST_TOOLS rows of `ids`, in registry order. */
const hostsOf = (ids: readonly string[]): HostTool[] => HOST_TOOLS.filter((h) => ids.includes(h.id));
/**
 * finishCommand (plan 34.1-14, D-26; plan 34.1-21, D-31; brief MSG-1): the command that finishes the reversal this run
 * could not finish, built by host-tools.ts agentCommand. Each case names agents the marker on disk records:
 *   - FULL run: the flag-less command. No agent stays installed, and the flag-less run removes every agent (D-05).
 *   - Partial run, UNFINISHED not empty: the agents this run set out to remove that the marker still records, because
 *     each owns an entry this run left in place (agentsAfter). Run once each is removed or restored, it finishes them
 *     and never touches the agents that stay. This is the case after the marker was rewritten.
 *   - Partial run, UNFINISHED empty, NAMED not empty: the marker could not be rewritten (the INCOMPLETE banner prints
 *     this only on kept-for-agents with rewrite `not-rewritten`), so the marker on disk still records the agents this
 *     run named, and running the command for them takes their entries out of it once the cause is fixed.
 *   - Partial run, NAMED empty too: this run's own command, rerunCommand(), whose rows are REMOVE's. REMOVE is never
 *     empty on a partial run, because FULL is true when no agent flag is given, so this case always carries an agent
 *     flag.
 * So no partial case yields the flag-less command, which would remove the agents the user kept (D-05). Each host list
 * is passed only when it is not empty, so agentCommand is never handed an empty list on a partial run.
 */
function finishCommand(): string {
  if (FULL) return agentCommand("uninstall.js", TARGET, [], COMMAND_CONTEXT);
  if (UNFINISHED.length > 0) return agentCommand("uninstall.js", TARGET, hostsOf(UNFINISHED), COMMAND_CONTEXT);
  if (NAMED.length > 0) return agentCommand("uninstall.js", TARGET, hostsOf(NAMED), COMMAND_CONTEXT);
  return rerunCommand();
}
/**
 * keepWithoutRecord (plan 34.1-19, D-32; brief §4, CR-03; plan 34.1-42, D-37, 34.1 review CR-05): THE ONE WORDING of the
 * alternative to finishing a kept reversal, asked by the kept `left` line in removeMarker (`where` "line") and by the
 * KEPT_FOR closing banner (`where` "banner"), so the two cannot word the rule two ways. The rule: the alternative never
 * offers deleting the marker, on any run kind (D-37, which amends D-32: the FULL-run "delete the marker by hand"
 * alternative is withdrawn). The marker is the record a later run needs: deleting it leaves every file install made
 * here with no record, so no uninstall can take them out.
 *   - A run with `held` items, partial or FULL: the by-hand alternative is per entry. Take each held entry out of the
 *     install ledger, then run finishCommand (on a FULL run the flag-less command), which finishes the reversal and
 *     leaves the user's file, because its entry is gone from the record; never delete the marker, which is still the
 *     record of the agents that stay (STAYING) on a partial run, and of what install made here on a FULL run (STAYING
 *     is empty there). The FULL arm was chosen by plan 34.1-42's step-0 probe: install --claude, an edited Claude Code
 *     skill, a flag-less uninstall kept the marker; with the skill's entry taken out by hand, the flag-less uninstall
 *     exited 0, removed the marker, kept the edited skill byte for byte and left no other recorded path (R20 follows it).
 *   - A run with nothing held (the marker was kept for a recorded verify): the empty string. Nothing edited is there to
 *     keep, and the remedy is the cause the verify line names.
 */
function keepWithoutRecord(held: readonly string[], where: "line" | "banner" = "line"): string {
  if (held.length === 0) return "";
  const one = held.length === 1;
  const then = where === "line" ? `, then run \`${finishCommand()}\`` : " and run that command";
  const marker = where === "line" ? "the marker" : MARKER_REL;
  return (
    `or, to keep ${one ? "it" : "them"}, take ${one ? "its entry" : "their entries"} out of the install ledger in ` +
    `${MARKER_REL} by hand${then}; never delete ${marker}: it is still the record of ` +
    `${FULL ? "what install made here" : nameList(STAYING)}`
  );
}
if (REMOVE.size > 0) {
  // The value of the `agents to remove` line, its own expression: under INSTALLED_UNKNOWN the set is unknown, not
  // "none" (IN-27). It names no remedy; the label's "remove" is not a verb aimed at the marker.
  const toRemove = INSTALLED_UNKNOWN ? "unknown (the marker cannot be used; see the verify line above)" : nameList(NAMED);
  console.log(`agents to remove: ${toRemove}`);
  for (const host of HOST_TOOLS) {
    if (!REMOVE.has(host.id) || NAMED.includes(host.id)) continue;
    report(
      "note",
      INSTALLED_UNKNOWN
        ? `${agentFlag(host)}: whether ${host.name} is installed here is unknown (the marker cannot be used), so nothing is removed for it`
        : `${agentFlag(host)}: ${host.name} is not installed here, so nothing is removed for it`,
    );
  }
}

/**
 * The directories on the way to a footprint path (host-tools.ts ADAPTER_FOOTPRINT): for `a/b/c.md`, `a/b` and `a`;
 * for a prefix `a/`, `a`.
 */
function footprintDirs(p: string): string[] {
  const parts = p.split("/").filter((x) => x !== "");
  const upTo = p.endsWith("/") ? parts.length : parts.length - 1;
  const out: string[] = [];
  for (let i = upTo; i >= 1; i--) out.push(parts.slice(0, i).join("/"));
  return out;
}
/**
 * reportDirCandidates (phase 34.1, D-05): the directories the report pass names when empty and unrecorded, deepest
 * first. The grugops skill directories and the fixed list this pass has always had (the Claude Code kit's directories,
 * `.gemini` for a pre-34.1 install, `.github` and `tools/grugops`), joined by the directories on the way to every
 * ADAPTER_FOOTPRINT path, derived. A partial run keeps only the directories it could reverse were they recorded
 * (inScope): those of the agents it removes and no agent that stays.
 */
function reportDirCandidates(): string[] {
  const all = [
    ...grugopsSkillNames().map((s) => `.claude/skills/${s}`),
    ".claude/skills",
    ".claude/agents",
    ".claude",
    ".gemini",
    ".github",
    "tools/grugops",
    ...HOST_ADAPTER_KINDS.flatMap((k) => ADAPTER_FOOTPRINT[k].flatMap(footprintDirs)),
  ];
  return [...new Set(all)].filter((d) => inScope({ path: d, kind: "dir" })).sort((a, b) => depthOf(b) - depthOf(a));
}

// The kit-shipped RUNNABLES the installer materializes into the user's repository (WR-04, plan 27-13),
// as a source→dest MAPPING kept byte-identical to install.ts's RUNNABLES (install.test.ts asserts the two
// are the same mapping). Since plan 33.1-38 it decides no removal: a runnable is removed by the ledger
// walk on its file entry, whatever this checkout ships (review WR-01). The mapping only words the report
// of a runnable path the ledger does not record (reportUnrecordedRunnables).
const RUNNABLES_MIRROR: Array<[string, string]> = [
  ["scripts/runnable-ref/reference-check.js", "tools/grugops/reference-check.js"],
  ["scripts/runnable-ref/test-skip-integrity.js", "tools/grugops/test-skip-integrity.js"],
  ["scripts/runnable-ref/uat-spec-integrity.js", "tools/grugops/uat-spec-integrity.js"],
  ["scripts/runnable-ref/host-protection.js", "tools/grugops/host-protection.js"],
];

// reportUnrecordedRunnables (report only): a runnable path with no ledger file entry is left, and the line
// says only what this run saw (red-team B2 of plan 33.1-34: a user's link there, or a `tools` that is a
// link to the user's own directory, is not uninstall's to resolve, so it is never a verify). tools/ is
// named as left once, here when the ledger has no `dir` entry for it (reverseDir names it otherwise).
function reportUnrecordedRunnables(): void {
  const reason = unrecordedFileReason();
  for (const [srcRel, destRel] of RUNNABLES_MIRROR) {
    if (entryAt(LEDGER, destRel, "file") !== undefined) continue;
    reportUnrecordedFile(destRel, `${GRUGOPS_SRC}/${srcRel}`, reason);
  }
  if (entryAt(LEDGER, "tools", "dir") === undefined && isDir(`${TARGET}/tools`)) report("left", TOOLS_LEFT);
}

// reportUnrecordedHostEntries (plan 34.1-25, D-33, review WR-20; report only): a whole-file host entry (the agent
// skill, the OpenCode command, the Pi prompt template: install-marker.ts wholeFileEntryRels, the list install writes
// from) present in the target with no ledger `file` entry is left, with the reason. Only an entry this run may reverse
// is asked about (inScope: every entry on a FULL run; on a partial run, an entry an agent this run removes owns and no
// staying agent owns), so a partial run names only its own agents' entries. The kit source carries each entry at the
// same relative path, and it is read only to word the line. It removes nothing: what install has no record of
// writing is the user's to remove, which the unusable-marker remedy above promises ("left and reported").
function reportUnrecordedHostEntries(): void {
  const reason = unrecordedFileReason();
  for (const rel of wholeFileEntryRels(HOST_TOOLS)) {
    if (!inScope({ path: rel, kind: "file" })) continue;
    if (entryAt(LEDGER, rel, "file") !== undefined) continue;
    reportUnrecordedFile(rel, join(GRUGOPS_SRC, rel), reason);
  }
}

// 1. THE WALK: every entry of the install ledger, reversed through owns (plan 33.1-38). Nothing outside
//    the ledger is removed or edited.
console.log("\n-- reversing what the install ledger records (only what install.js wrote) --");
walkLedger();

// 2. THE REPORTS: every grugops-shaped path the ledger does not record is named, never removed.
//    A PARTIAL RUN (phase 34.1, D-05) reports only within the footprint of the agents it removes: the Claude Code kit,
//    its backups, the CLAUDE.md block and the ask rules only when it removes Claude Code; the Copilot block only when it
//    removes Copilot; AGENTS.md, the runnables and the Gemini settings (the shared footprint, D-06, D-23) only on a
//    FULL run. adapterRemoved answers by adapter kind, from the registry, so no host is named here.
const adapterRemoved = (kind: HostAdapterKind): boolean =>
  FULL ||
  (HOST_TOOLS.some((h) => h.adapter === kind && NAMED.includes(h.id)) && !HOST_TOOLS.some((h) => h.adapter === kind && REMAINING.includes(h.id)));
console.log("\n-- grugops-shaped paths the install ledger does not record (reported, never removed) --");
if (adapterRemoved("claude-kit")) {
  reportUnrecordedKitPaths();
  // Every backup install made of an edited kit file (D-32, plan 33.1-32) is reported left, never removed.
  reportKitBackups();
}
reportUnrecordedHostEntries();
if (FULL) reportUnrecordedAgentsMd();
if (adapterRemoved("claude-kit")) reportUnrecordedBlock("CLAUDE.md");
reportUnrecordedSettings({ gemini: FULL, askRules: adapterRemoved("claude-kit") });
if (adapterRemoved("copilot-pointer")) reportUnrecordedBlock(COPILOT_REL);
if (FULL) reportUnrecordedRunnables();
// The directory candidates, deepest first, once the walk's removals are done (reportDirCandidates says which).
for (const d of reportDirCandidates()) {
  reportUnrecordedDir(`${TARGET}/${d}`);
}

// 3. The grugops-owned install marker (D-06). Removes ONLY .grugops/install.json via the narrow
//    named exception; the rest of .grugops/ (seeded user state) is protected and survives. The
//    .grugops/ dir is intentionally NOT rmdir'd — the seeded factory.config.json keeps it
//    populated, and even an empty .grugops/ is the user's state dir, not grugops' to remove.
//    Never remove $GRUGOPS_HOME — the shared kit is shared across repos; manual rm only.
// UNFINISHED (plan 34.1-14, D-26): the agents this run set out to remove (NAMED; every installed agent on a FULL run)
// that the kept marker still records, because each owns an entry this run left in place (agentsAfter). Taken after
// the walk, whose outcomes decide it, and before removeMarker, whose `left` line names them.
const UNFINISHED: readonly string[] = (FULL ? INSTALLED.ids : NAMED).filter((id) => agentsAfter().includes(id));
const markerOutcome: MarkerOutcome = removeMarker();

// THE PRESERVED BLOCK STATES WHAT UNINSTALL LEAVES, AND THE MARKER LINE STATES WHAT THIS RUN DID (plan
// 34-26, D-25, sibling C). The block used to say, on every run, that only the marker is removed, while
// removeMarker keeps or leaves it in most of its arms. The marker line is built from removeMarker's
// MarkerOutcome alone.
console.log("\n-- preserved (never touched) --");
console.log("  agent-factory/  plans/  .planning/  docs/  src/  the shared kit at $GRUGOPS_HOME,");
console.log("  and every byte in this repo that install did not record adding.");
console.log("  .grugops/ (seeded state) is kept; its install.json marker is reported on the next line.");
console.log(`  ${MARKER_REL} (the install marker): ${markerOutcomeLine(markerOutcome)}`);
// THE CLOSING CLAIM IS CONDITIONAL (27-13) — the same rule as install.ts's banner. A run that could
// not read a source directory has skipped a whole removal class; saying "complete" over that is a
// claim it did not earn. The `verify` lines above name what was left behind and what to do about it.
// A PARTIAL RUN SAYS WHICH AGENTS IT REMOVED AND WHICH STAY (phase 34.1, D-05), on each branch below, so the banner
// never reads as if grugops were gone from the repository.
// An agent this run set out to remove that stays recorded (UNFINISHED) is not named as removed: it is named as not
// finished (D-26), and the `left` line and the banner print the command that finishes it.
// INSTALLED_UNKNOWN (IN-27): over a marker this run cannot use, the installed set is unknown, so the clause says so
// and names no "still installed" set.
const AGENTS_CLAUSE = FULL
  ? ""
  : INSTALLED_UNKNOWN
    ? " — no agent removed (which agents are installed here is unknown: the marker cannot be used; see the verify line above)"
    : NAMED.length === 0
      ? ` — no agent removed (none of the named agents is installed here); still installed: ${nameList(STAYING)}`
      : ` — agents removed: ${nameList(NAMED.filter((id) => !UNFINISHED.includes(id)))}` +
        `${UNFINISHED.length > 0 ? `; not finished, still recorded: ${nameList(UNFINISHED)}` : ""}; still installed: ${nameList(STAYING)}`;
if (VERIFY_FINDINGS > 0) {
  console.log(
    `\n== uninstall INCOMPLETE — ${VERIFY_FINDINGS} item(s) need verification${AGENTS_CLAUSE}` +
      `${DRY_RUN ? " (DRY_RUN — nothing changed)" : ""} ==`,
  );
  console.log("  Each `verify` line above names what was NOT removed and the remedy for it.");
  // MSG-1 (D-26): when removeMarker kept the marker as the record a later run needs (kind kept), or could not rewrite
  // it on a partial run (so it still records the agents this run set out to remove), the command that finishes the
  // reversal is printed. A DRY_RUN preview prints the command the real run would.
  if (markerOutcome.kind === "kept" || (markerOutcome.kind === "kept-for-agents" && markerOutcome.rewrite === "not-rewritten")) {
    console.log(`  Then run \`${finishCommand()}\` to finish the reversal.`);
  }
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
} else if (KEPT_FOR > 0) {
  // COMPLETE, WITH RECORDED ITEMS LEFT BY DESIGN (plan 33.1-39, review WR-02). Nothing failed (no verify), so
  // the status stays 0; but the marker was kept to record what is still in place (an edited file), and the
  // banner says so on the same branch, with the two ways forward.
  console.log(
    `\n== uninstall complete — ${KEPT_FOR} recorded item(s) left in place; ${MARKER_REL} kept to record them${AGENTS_CLAUSE}` +
      `${DRY_RUN ? " (DRY_RUN — nothing changed)" : ""} ==`,
  );
  // D-32 (CR-03), D-37: the alternative is keepWithoutRecord's, the one wording the kept `left` line asks too. On no run
  // kind does it offer deleting the marker, which is still the record a later run needs.
  const keep = keepWithoutRecord(heldPaths(), "banner");
  console.log(
    `  To finish: remove or restore what the \`left\` lines name, then run \`${finishCommand()}\`` +
      `${keep === "" ? "" : `; ${keep}`}.`,
  );
} else {
  console.log(`\n== uninstall complete${AGENTS_CLAUSE}${DRY_RUN ? " (DRY_RUN — nothing changed)" : ""} ==`);
}
