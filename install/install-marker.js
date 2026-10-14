// install-marker.ts — ONE marker, ONE ledger, ONE reader, ONE authority (plan 33.1-36, D-33 (b), brief
// 33.1-GAP-PLANNING-BRIEF.md §2.2). The marker `.grugops/install.json` is read here and nowhere else; the
// install ledger it carries is read here (readLedger) and written through the one serializer here
// (ledgerJson); and whether install owns a path is answered here (owns).
//
// Cross-platform. ZERO npm dependencies: it imports only node:crypto (a hash, no I/O), node:path,
// ./user-file.ts, ./json-text.ts (no I/O; the strict tokenizer that refuses a duplicate key) and
// ./host-tools.ts (pure data, no imports: the agent registry installedAgents maps ids against, and entryOwners,
// which agentsToRecord asks). A
// sibling of install.js and uninstall.js inside install/, imported by BOTH binaries, so both still
// run on a host with nothing installed. This module never writes and imports nothing from node:fs;
// install/installer-fs-census.test.ts scans it with the rest of install/ and asserts it makes no
// content read of its own.
//
// WHY SIX RECORDS BECAME ONE (D-33 (b), brief §2.2, review WR-01). Rounds 1 and 2 of phase 33.1 added
// one record per class of path install writes: createdDirs, createdFiles, geminiSettings, kitFiles,
// claudeAskRules and appendedBlocks, each with its own reader, its own "absent" meaning and its own
// verify. Each round's review then found the same defect class (DC-2: a delete or an edit decided by
// presence or shape, not by install record) one record over, because the six were checked site by
// site and no one place answered "does install own this path". So the six are merged into ONE field,
// `ledger`, a list of entries, read by ONE reader and asked through ONE authority. Those six names are
// RETIRED_RECORDS: install never writes them, and no code in either binary reads them.
//
// THE LEDGER. `ledger` is a JSON array. Each entry is a plain object with `path` (isLedgerPath: a POSIX
// path relative to the target that cannot leave it) and `kind`, plus EXACTLY the keys its kind has:
//   dir        (none)                    install created this directory;
//   file       content, kit              install wrote this file or link: `content` is its content
//                                        record (isContentRecord, see CONTENT RECORDS), and `kit` is
//                                        true for a grugops skill or adapter file (D-32 governs those);
//   block      block, separator          install appended the sentinel block to this file (CLAUDE.md or
//                                        .github/copilot-instructions.md only): `block` is the sha256
//                                        record of the block LINES `<open>\n<body>\n<close>\n`, and
//                                        `separator` says what the one newline install wrote before
//                                        them did ("blank-line" or "line-end");
//   gemini     the Gemini fields         what install did to .gemini/settings.json (that path only); see
//                                        THE gemini ENTRY below;
//   ask-rules  the ask-rule fields       the Claude Code ask rules install added to .claude/settings.json
//                                        (that path only, D-18); see AskRuleLedger below;
//   opencode-permission  the OpenCode fields  the OpenCode external_directory rule install added to
//                                        `permission.external_directory` in opencode.json (that path only,
//                                        phase 34.1 D-14); see OpenCodePermissionLedger below;
//   backup     origin, of, content       install made this backup (plan 33.1-37): `origin` says what it
//                                        was made from (BACKUP_ORIGINS), `of` the path it was made of,
//                                        and `content` its file, link or tree record as install left it
//                                        (user-file.ts treeRecord), or null when it could not be read in
//                                        full (never proven unchanged);
//   kit        (none)                    install wrote the kit at the kit root (KIT_ENTRY_PATH). Only in
//                                        the kit-home record; see THE KIT-HOME RECORD below.
// Which kinds a ledger may hold depends on the record it is read from (KINDS_BY_SCOPE): a target's
// marker holds dir, file, block, gemini, ask-rules, opencode-permission and backup; the kit-home record holds backup
// and kit.
// Two entries with the same (path, kind) are refused: which one is install's record is not known. One
// path can hold entries of two kinds (CLAUDE.md: the file install created, and the block it appended).
//
// THE STATES.
//   readInstallMarker: `absent`     nothing is at the marker path (no install, or a removed one);
//                      `unreadable` something is there and it is not a readable regular file
//                                   within the bound (a FIFO, a directory, a symbolic link, a path
//                                   under a non-directory or under a link, ...), or it is not JSON,
//                                   or it is not a plain JSON object; `why` says which. A JSON object
//                                   that holds none of INSTALL_RECORD_FIELDS was not written by install
//                                   (a user's own file, `{}`): `unreadable` with defect `foreign`, worded
//                                   "not written by install; if it is yours, leave it" (D-40, DI-18). A
//                                   JSON object that holds some of them but whose fields do not hold
//                                   install's values (a hand-made or hand-edited marker), or one that
//                                   carries `ledger` next to a retired record, is install's record with a
//                                   field to fix by hand: `unreadable` with defect `field` or
//                                   `retired-record`. Both are `unreadable` with `jsonObject` true;
//                      `unbound`    install's marker shape, but not this directory's record, and
//                                   `unboundBy` says why: `other-directory` (its `target` names another
//                                   directory), `no-target` (written before markers were bound;
//                                   red-team B2 of plan 33.1-33), or `no-ledger` (written before the
//                                   one ledger; see A MARKER WITHOUT THE LEDGER). No record is read
//                                   from it;
//                      `ok`         install's own marker for this directory, carrying `ledger`.
//   readLedger:        `absent`     the holder is null (no usable marker) or has no `ledger`;
//                      `malformed`  `ledger` is there but is not exactly the shape above; `why` names
//                                   the entry index and the reason; nothing in it is used;
//                      `ok`         the exact shape; the entries are returned in ledgerJson's order.
// `raw` is always the field's value as found, so a caller that must leave a malformed ledger as it was
// can write it back verbatim.
//
// A MARKER WITHOUT THE LEDGER FAILS CLOSED (plan 33.1-36, the planner's reading of D-33 (b); the
// SUMMARY lists it for the human). A marker bound to this directory with no `ledger` was written by an
// earlier build of this release, which carried the six retired records. No released version wrote that
// shape: v2.1's install.ts has none of the six names, and CHANGELOG [Unreleased] is where they were
// introduced. A reader kept only for those scratch installs would be a second reader of the same
// record, so the marker reads `unbound` by `no-ledger`: uninstall changes nothing and exits 3 with
// D-31 item 5's remedy (re-run install.js here, then uninstall), and install replaces it and carries
// none of its records. A marker that holds `ledger` AND a retired record is not one install wrote at
// all, so it is `unreadable` and is left byte for byte.
//
// THE ONE AUTHORITY (owns). owns(ledger, root, rel, kind) answers whether install has a usable record
// of `kind` for `rel` and, for a `file` entry, whether the path still holds it (checkRecord: bytes and
// mode for a file, the readlink for a link compared in the one spelling, no link followed on the way, a
// hard link refused). For a dir, block, gemini, ask-rules or opencode-permission entry it returns the entry, and the caller compares that entry's
// own content record (the directory's emptiness and this run's removals, the block hash,
// fileNameContent, askContent, an opencode-permission entry's content) with the file before it edits anything, as each pass did before the
// merge. Since plan 33.1-38 the uninstaller's removal sequence IS a walk over the ledger (uninstall.ts
// walkLedger): every entry is visited, whatever the uninstalling kit source ships, and every delete or
// edit asks owns first. The pseudo-kind `marker` (plan 33.1-38) answers for the marker itself: it is
// valid only for MARKER_REL and owned exactly when the ledger read is `ok`, which it is only for
// install's own, bound marker (readInstallMarker `ok`) holding a well-formed ledger.
//
// WHY THE MARKER IS READ THROUGH readUserFile (plan 33.1-27, IN-04, brief DC-3; by way of readForWrite). The marker is a
// path in the user's repository, so it may be a FIFO, a directory, a device or a symlink to one.
// A plain read of a FIFO blocks until a writer appears: the installer used to hang there forever,
// the same shape Phase 31 round 5 found at a write chokepoint. readUserFile decides the file type
// before it opens anything and opens only a regular file within its size bound, so this reader
// never blocks and never releases a writer blocked on a FIFO. Every state but `ok` and `absent`
// (not a regular file, too large, unreadable) is `unreadable` here, and each caller already has a
// fail-closed answer for an unreadable marker.
//
// THE MARKER IS READ WITHOUT FOLLOWING A LINK (red-team of plan 33.1-27, B3, brief DC-2). The marker
// holds the ledger uninstall deletes by, so it must be THIS target's own record. readUserFile follows
// a symbolic link, which is right for reading content and wrong here: a never-installed repository
// whose `.grugops` (or whose marker) was a link into another, installed repository had that other
// install's records believed. So the marker is asked through readForWrite(target, marker), which walks
// every component from the target down with lstat: a link at the marker or on the way to it, or a
// non-directory where `.grugops/` goes, makes the marker `unreadable`, with the reason in `why`.
//
// ONE READER FOR BOTH BINARIES (re-review WR-05). Each binary used to hold its own reader of the
// ask-rule record, and the two disagreed about a malformed one: install read it as "no previous
// install" (fail open), while uninstall refused (fail closed). Both binaries now read the marker and the
// ledger here, as tri-states, and neither can read a malformed ledger as an empty one.
//
// THE gemini ENTRY (plan 33.1-29; re-review CR-03). Besides `path` and `kind`, exactly these keys:
//   createdFile      boolean  install created the file (nothing was at the path);
//   addedEntry       boolean  install appended "AGENTS.md" to context.fileName;
//   createdContext   boolean  present exactly when addedEntry is true: `context` was absent and
//                             install added it;
//   fileNameBefore   string   present exactly when addedEntry is true: what context.fileName was
//                             before the append — "absent", "string" (a string, which install turned
//                             into [string, "AGENTS.md"]) or "array";
//   noEntryReason    string   present exactly when addedEntry is false: why the record claims no
//                             entry (red-team B2 of plan 33.1-29, so uninstall says only what is true):
//                               "already-listed" install found AGENTS.md already in context.fileName;
//                               "refused"        install could not read or merge the file (that run's
//                                                verify said why) and added nothing;
//                               "reset"          an earlier record no longer held: context.fileName
//                                                changed after install wrote it, so whether an
//                                                AGENTS.md entry in it is install's is not known;
//                               "reversed"       uninstall removed the entry install added (a marker
//                                                uninstall kept);
//   fileNameContent  record   jsonValueRecord of context.fileName as install last left it (the ONE
//                             serialisation both binaries use), or null when there was no fileName or
//                             the file was not read. A re-install carries the record forward only while
//                             the file's fileName is still exactly that (never carry an entry forward by
//                             presence), and uninstall edits the file only while it is. Never null when
//                             addedEntry is true;
//   fileContent      record   present exactly when createdFile is true: the file record of the bytes
//                             install wrote and the file's mode (THE FILE MODE below). Uninstall deletes
//                             the whole file only while it holds them (recordHolds).
// createdFile true also requires addedEntry true, createdContext true and fileNameBefore "absent"
// (install writes the file with the entry in it). Anything else is `malformed`.
//
// A RUN THAT READ NOTHING KEEPS THE RECORD (red-team B2 of plan 33.1-29). A re-install that could not
// read the Gemini file (a link, a hard link, a FIFO, mode 000, too large, not UTF-8, not JSON, a
// duplicate key on the path) has no evidence either way, so it writes the earlier gemini entry back
// verbatim and says so. An entry that claims nothing is written only by a run that READ the file and
// found the record no longer holds ("reset"), or that found AGENTS.md already listed.
//
// Clear professional voice: this is a safety surface (installer reversal).
import { createHash } from "node:crypto";
import { join } from "node:path";
import { HOST_TOOLS, OPENCODE_CONFIG_REL, ROUTE_POINTERS, entryOwners } from "./host-tools.js";
import { duplicateKeys, firstDuplicateKey, readJsonText } from "./json-text.js";
import { isOwnLink, isRecordedAbsolute, kindAt, modeText, readForWrite, realTargetPath, sameRecordedPath, treeRecord, wayTo } from "./user-file.js";
/** The marker's path relative to the target, in POSIX form: the one spelling both binaries use. */
export const MARKER_REL = ".grugops/install.json";
/** The marker field that holds the one install ledger (D-33 (b)). */
export const LEDGER_FIELD = "ledger";
/**
 * INSTALL_RECORD_FIELDS (phase 34.1 gap round 5, D-40, DI-18): the five fields D-40 names as install's. A JSON object at
 * the marker path that holds NONE of them was not written by install: every marker install wrote holds grugopsHome,
 * kitRoot and installMode (installMarkerProblems), so such an object is a user's own file, and readInstallMarker reads it
 * as `unreadable` with defect `foreign` (worded "not written by install; if it is yours, leave it"). kitVersion and
 * `agents` are install's fields too, but they are not in the set, by D-40's wording: an object holding only those reads
 * `foreign`. An object holding any one of the five reads exactly as it did before this set existed.
 */
export const INSTALL_RECORD_FIELDS = ["grugopsHome", "kitRoot", "installMode", "target", LEDGER_FIELD];
/**
 * The six records the one ledger replaced (D-33 (b)). Install never writes them and no code in either
 * binary reads them: a marker that has them and no `ledger` is `unbound` by `no-ledger`, and a marker
 * that has them next to `ledger` is `unreadable`.
 */
export const RETIRED_RECORDS = ["createdDirs", "createdFiles", "geminiSettings", "kitFiles", "claudeAskRules", "appendedBlocks"];
/** How many duplicated keys the duplicate-key arm names one by one (plan 34.1-45, D-37, WR-26); the rest are counted. */
const DUPLICATES_NAMED = 8;
/**
 * MARKER_DEFECTS (D-37, brief §6): every defect the reader reports, one per arm of readInstallMarker that refuses a
 * marker as unreadable, and `ledger` for install's own marker (`ok`) whose install ledger readLedger refuses:
 *   blocked         the path is not a readable regular file inside a real .grugops directory (readForWrite);
 *   not-json        JSON.parse refused the text;
 *   not-object      the JSON is not an object;
 *   foreign         a JSON object that holds none of INSTALL_RECORD_FIELDS: not written by install (D-40, DI-18);
 *   bytes          the strict reader refused the bytes (not UTF-8, or nesting past its bound);
 *   duplicate-key   a key appears more than once in one object (every such key is named, plan 34.1-45);
 *   field           a field holds a value install never writes (installMarkerProblems);
 *   retired-record  a retired record sits next to the install ledger;
 *   ledger          an `ok` marker whose install ledger is malformed.
 * Tests enumerate their rows from this list, so a new defect is a new row.
 */
export const MARKER_DEFECTS = ["blocked", "not-json", "not-object", "foreign", "bytes", "duplicate-key", "field", "retired-record", "ledger"];
const NO_ENTRY_REASONS = ["already-listed", "refused", "reset", "reversed"];
/** Read `<target>/.grugops/install.json` without following a link (see the header). */
export function readInstallMarker(target) {
    const path = join(target, ...MARKER_REL.split("/"));
    const read = readForWrite(target, path);
    if (read.state === "create")
        return { state: "absent", marker: null };
    // D-37 (34.1 review CR-05): the three arms below end before a JSON object exists. Each carries one problem that names
    // the cause and the by-hand fix, so the one never-remove wording (markerFixText) has something true to name; none
    // copies a byte of the file.
    if (read.state === "blocked") {
        return {
            state: "unreadable",
            marker: null,
            why: read.at === path ? `it ${read.reason}` : `${read.at} ${read.reason}`,
            jsonObject: false,
            defect: "blocked",
            problems: [
                `${read.at === path ? "the file" : read.at} ${read.reason}: make ${MARKER_REL} the readable regular file install ` +
                    `wrote, inside a real .grugops directory, for example by restoring its read permission or by putting the file ` +
                    `a link points to in place of the link`,
            ],
        };
    }
    let parsed;
    try {
        parsed = JSON.parse(read.text);
    }
    catch (e) {
        const place = jsonErrorPlace(read.text, e, read.bytes);
        return {
            state: "unreadable",
            marker: null,
            why: "it is not valid JSON",
            jsonObject: false,
            defect: "not-json",
            problems: [
                `the file is not valid JSON${place === null ? "" : ` (line ${place.line}, column ${place.column})`}: correct ` +
                    `its JSON syntax, for example a trailing comma or a missing quote`,
            ],
        };
    }
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
        return {
            state: "unreadable",
            marker: null,
            why: "it is JSON but not a JSON object",
            jsonObject: false,
            defect: "not-object",
            problems: [
                `the file is JSON but ${jsonKind(parsed)}, not a JSON object: restore the JSON object install wrote, for ` +
                    `example from version control or a backup`,
            ],
        };
    }
    // A JSON OBJECT INSTALL NEVER WROTE (phase 34.1 gap round 5, D-40, DI-18). Every marker install wrote holds grugopsHome,
    // kitRoot and installMode, so an object holding none of INSTALL_RECORD_FIELDS is not install's record: a user's own
    // JSON (a repository grugops was never installed into), `{}`, or an object holding only `agents` and kitVersion. It is
    // `foreign`, worded "not written by install; if it is yours, leave it" (markerFixText, markerDefectText); no remedy
    // over it says to fix it by hand or calls it the record of the agents installed here. The arm runs before the strict
    // reader and the duplicate-key arm, so a user's object with a duplicate key or a byte the strict reader refuses is
    // `foreign` too; an object holding any one of the five reaches the arms below exactly as before. The why and the
    // problem name only the constant's field names, never a key or a value of the file.
    const object = parsed;
    if (!INSTALL_RECORD_FIELDS.some((k) => Object.prototype.hasOwnProperty.call(object, k))) {
        const names = INSTALL_RECORD_FIELDS.join(", ");
        return {
            state: "unreadable",
            marker: null,
            why: `it holds none of install's fields: ${names}`,
            jsonObject: true,
            defect: "foreign",
            object,
            problems: [`the file holds none of install's fields: ${names}`],
        };
    }
    // A DUPLICATE KEY IS REFUSED, NOT RESOLVED (red-team RT3 of plan 33.1-30). JSON.parse keeps the last
    // of two equal keys and says nothing, so `"ledger": [], "ledger": [...]` would read as the second
    // record. Install writes the marker with JSON.stringify, which never repeats a key, so a duplicate is
    // a hand edit and which value is the record is not known. Refusing only the field that holds it would
    // not hold: every writer of the marker (install's writeMarker, uninstall's kept-marker rewrite)
    // re-serialises the parsed value, which drops the duplicate and turns the field well-formed for the
    // next run. So the whole marker is `unreadable` (fail closed): install leaves it unchanged and
    // uninstall uses none of it. The strict tokenizer (json-text.ts) also refuses bytes that are not UTF-8
    // and nesting past its bound, which JSON.parse of the decoded text would have accepted.
    const doc = readJsonText(read.bytes);
    if (!doc.ok)
        return { state: "unreadable", marker: null, why: `it ${doc.why}`, jsonObject: false, defect: "bytes", object, problems: [`the file ${doc.why}`] };
    // EVERY DUPLICATED KEY IS NAMED (plan 34.1-45, D-37, 34.1 review WR-26). The arm used to name the first duplicate
    // only, so a marker duplicating both `agents` and `ledger` got a fix naming `agents` alone. Each duplicated key gets one
    // problem: the key (JSON-quoted and length-bounded, so no byte of the file is echoed raw), how many times it appears
    // in one object, and the fix, keep the one value install wrote. For `ledger` that value is the list of what install
    // made here; nothing here claims either value is a well-formed install ledger. At most DUPLICATES_NAMED keys are named
    // (DC-3: a hand-made file can repeat any number of keys); the rest are counted.
    const dups = duplicateKeys(doc.root);
    if (dups.length > 0) {
        const quoted = (key) => JSON.stringify(key).slice(0, 120);
        const shown = dups.slice(0, DUPLICATES_NAMED);
        const more = dups.length - shown.length;
        const problems = shown.map((d) => {
            const which = d.key === "ledger" ? " (for this key, the list of what install made here)" : "";
            return `the key ${quoted(d.key)} appears ${d.count} times in one object: keep the one value install wrote${which} and take the others out`;
        });
        if (more > 0)
            problems.push(`${more} more key(s) appear more than once: keep one value of each, the one install wrote`);
        return {
            state: "unreadable",
            marker: null,
            why: `it has ${dups.length === 1 ? "a duplicate key" : "duplicate keys"} (${shown.map((d) => quoted(d.key)).join(", ")}` +
                `${more > 0 ? `, and ${more} more` : ""}), so which of its values is install's record is not known`,
            jsonObject: false,
            defect: "duplicate-key",
            object,
            problems,
            duplicateKeys: dups.map((d) => d.key),
        };
    }
    // INSTALL'S OWN MARKER, FOR THIS DIRECTORY (red-team B2 of plan 33.1-33, brief DC-2). A JSON object here
    // is used only when its fields hold install's values (installMarkerProblems), it does not mix the one
    // ledger with a retired record, its `target` is this directory's real path (markerBinding), and it
    // carries the one ledger. Anything else is not this directory's record, however well formed: a user's
    // object holding none of install's fields (the `foreign` arm above; not written by install), a hand-made
    // or hand-edited marker (a field to fix by hand), a `.grugops/` copied from another installed repository,
    // a marker written before markers were bound or before the one ledger. This is the one place both
    // binaries learn whether a marker is install's own; readLedger is handed only an `ok` marker.
    const marker = parsed;
    const has = (k) => Object.prototype.hasOwnProperty.call(marker, k);
    const problems = installMarkerProblems(marker);
    if (problems.length > 0) {
        return {
            state: "unreadable",
            marker: null,
            why: `it does not read as a grugops install marker — ${problems.join(", ")}`,
            jsonObject: true,
            defect: "field",
            object,
            problems,
        };
    }
    const retired = RETIRED_RECORDS.filter(has);
    if (has(LEDGER_FIELD) && retired.length > 0) {
        return {
            state: "unreadable",
            marker: null,
            why: `it carries both the one ledger and a retired record (${retired.join(", ")}), which install never writes`,
            jsonObject: true,
            defect: "retired-record",
            object,
            problems: retired.map((r) => `the retired record ${r} next to the install ledger (install never writes it; take it out)`),
        };
    }
    const here = realTargetPath(target);
    const binding = markerBinding(marker, here);
    const boundTo = typeof marker.target === "string" ? marker.target : null;
    if (binding !== null)
        return { state: "unbound", marker: null, why: binding.why, unboundBy: binding.by, boundTo, here, object: marker };
    if (!has(LEDGER_FIELD)) {
        const why = retired.length > 0
            ? `it has no install ledger: it was written by an earlier build of this release, before the one ledger, and ` +
                `holds the retired records ${retired.join(", ")}, which this build does not read`
            : "it has no install ledger, so it holds no record of what install did here";
        return { state: "unbound", marker: null, why, unboundBy: "no-ledger", boundTo, here, object: marker };
    }
    return { state: "ok", marker, bytes: read.bytes };
}
/**
 * jsonErrorPlace (D-37, T-34.1-80): the line and column (both from 1) where a parser stopped in `text`, or null when no
 * parser reported a position. Only the DIGITS of a reported position are read, never the rest of a message: V8's
 * JSON.parse message quotes the file's text, so it is never copied into a printed line. The position comes from
 * JSON.parse's "at position N" when its message carries one, else from the strict reader's "at character N"
 * (json-text.ts readJsonText): V8 reports no position for some syntax errors, a trailing comma among them, and the strict
 * reader stops at the same character. Both count UTF-16 code units of the decoded text.
 */
function jsonErrorPlace(text, error, bytes) {
    let digits = error instanceof Error ? /\bat position (\d+)\b/.exec(error.message)?.[1] : undefined;
    if (digits === undefined) {
        const strict = readJsonText(bytes);
        if (!strict.ok)
            digits = /\bat character (\d+)\b/.exec(strict.why)?.[1];
    }
    if (digits === undefined)
        return null;
    const pos = Number(digits);
    if (!Number.isSafeInteger(pos) || pos > text.length)
        return null;
    const before = text.slice(0, pos);
    const line = before.split("\n").length;
    return { line, column: pos - (before.lastIndexOf("\n") + 1) + 1 };
}
/** The JSON kind of a parsed value that is not an object, for a problem text: its kind or literal, never its content. */
function jsonKind(value) {
    if (Array.isArray(value))
        return "an array";
    if (value === null)
        return "null";
    if (typeof value === "string")
        return "a string";
    if (typeof value === "number")
        return "a number";
    return value === true ? "true" : "false";
}
// markerBinding: null when `marker` (whose fields hold install's values) is bound to the directory whose
// real path is `here`; otherwise why it is not this directory's record, and which way.
function markerBinding(marker, here) {
    if (!Object.prototype.hasOwnProperty.call(marker, "target")) {
        return {
            by: "no-target",
            why: "it was written before install bound its marker to a directory (it has no target), so which directory its " +
                "records describe is not known",
        };
    }
    const boundTo = marker.target;
    if (here === null) {
        return { by: "other-directory", why: `the real path of this directory could not be read, so it cannot be shown to be ${boundTo}, where the marker was written` };
    }
    // Both sides through the one spelling (plan 34-11, D-19): a target recorded in the host's native
    // spelling binds this directory on Windows; a different directory never does.
    if (!sameRecordedPath(boundTo, here)) {
        return { by: "other-directory", why: `it was written for another directory (${boundTo}), not this one (${here}), so its records describe that directory` };
    }
    return null;
}
/** The one wording of a marker a caller cannot use: "could not be read …" or "is a JSON object but …". */
export function markerUnusableText(read) {
    return read.jsonObject
        ? `is a JSON object but could not be used as install's marker (${read.why})`
        : `could not be read as a JSON object (${read.why})`;
}
/**
 * markerRemedy (D-35, D-37): the remedy over the read the binary just made, or null when there is none to print. Pure:
 * no I/O; it reads only `read` (readLedger is pure).
 *   unreadable  { defect: the read's defect, fix: the read's problems };
 *   ok          { defect: "ledger", fix: one entry naming readLedger's why } when readLedger refuses the install ledger
 *               (34.1 review CR-06: a malformed ledger is typically one bad entry, and fixing it gives the whole record
 *               back), else null;
 *   absent, unbound  null (an unbound marker's remedy is to set "target" or re-install; an absent one has no record).
 */
export function markerRemedy(read) {
    switch (read.state) {
        case "unreadable":
            return { defect: read.defect, fix: read.problems };
        case "ok": {
            const ledger = readLedger(read.marker);
            return ledger.state === "malformed" ? { defect: "ledger", fix: [ledgerFixEntry(ledger.why ?? "")] } : null;
        }
        case "absent":
        case "unbound":
            return null;
    }
}
/**
 * noMarkerRemedy: the guard a site uses when it holds a read it already knows is unusable (`markerRemedy(read) ??
 * noMarkerRemedy("<site>")`). markerRemedy answers null only for a read with nothing to fix, so reaching this is a bug
 * in the site's own check; it throws, naming the site, rather than print a remedy with nothing in it.
 */
export function noMarkerRemedy(site) {
    throw new Error(`${site}: markerRemedy answered no remedy for a marker read this site holds as unusable`);
}
/**
 * ledgerFixEntry (D-37, 34.1 review CR-06, plan 34.1-43): the fix entry of an `ok` marker whose install ledger readLedger
 * refuses. It names readLedger's why (the entry index and the reason, the reader's own wording, never the file's bytes)
 * and the by-hand fix: correct that entry or field to what install wrote. markerFixText names it inside its parentheses.
 */
function ledgerFixEntry(why) {
    return (`the install ledger is malformed, ${why}: correct that entry or field of the install ledger to what install wrote, ` +
        `for example from version control or a backup`);
}
/**
 * markerFixText (D-35, D-37; D-40, DI-18): THE ONE WORDING of the remedy over a marker a binary cannot use, AND the one
 * place that decides whether a next step follows it. A caller passes its next step as `then` (for example "re-run the
 * installer", or "run `<command>` again") and never appends one itself; it may close the sentence with ".".
 *   foreign      (a JSON object holding none of INSTALL_RECORD_FIELDS): the file was not written by install. The text
 *                says so, names every entry of `remedy.fix`, and ends "if it is yours, leave it". There is nothing to fix,
 *                so `then` is ignored: no next step and no command follows "leave it", and nothing offers removal;
 *   every other defect: the never-remove remedy, true for every other reader state. It names every entry of `remedy.fix`
 *                (the read's problems: each names a cause and its by-hand fix), says to fix the marker by hand and never
 *                to delete it, because it is the one record install keeps of the agents installed here, so without it no
 *                uninstall can undo what install made, and then "; then " and `then` when `then` is not null. It claims
 *                nothing about the install ledger being intact (a not-JSON or blocked marker shows nothing of it) and
 *                offers no removal.
 * A sentence without a final full stop. With an empty `fix` it names no entry.
 */
export function markerFixText(remedy, then) {
    if (remedy.defect === "foreign") {
        return `${MARKER_REL} was not written by install (${remedy.fix.join("; ")}); if it is yours, leave it`;
    }
    const named = remedy.fix.length > 0 ? ` (${remedy.fix.join("; ")})` : "";
    return (`Fix ${MARKER_REL} by hand${named}; never delete the marker: it is the one record install keeps of the agents ` +
        `installed here, so without it no uninstall can undo what install made${then === null ? "" : `; then ${then}`}`);
}
/**
 * MARKER_DEFECT_TEXT (D-37, 34.1 review IN-33): one short cause clause per MarkerDefect. A Record over MarkerDefect, so
 * a new defect is a compile error until it is worded. Only `field` says a field holds a value install never writes: a
 * duplicate key or a byte the strict reader refuses is not a field problem. Only `foreign` (D-40, DI-18) says the file
 * was not written by install; every other clause is about install's own record.
 */
const MARKER_DEFECT_TEXT = {
    blocked: "it could not be read as a JSON object",
    "not-json": "it could not be read as a JSON object",
    "not-object": "it could not be read as a JSON object",
    // D-40 (DI-18): the one cause clause that says the file is not install's; it offers no fix and no removal.
    foreign: "it holds none of install's fields, so it was not written by install; if it is yours, leave it",
    bytes: "its bytes are not text install writes",
    "duplicate-key": "a key in it appears more than once",
    // installMarkerProblems reports a missing field ("no grugopsHome") as well as a wrong value, so both are named.
    field: "a field in it holds a value install never writes, or a field install writes is missing",
    "retired-record": "it holds a retired record next to the install ledger",
    ledger: "its install ledger is malformed",
};
/**
 * markerDefectText (D-37, 34.1 review IN-33): THE ONE WORDING of a defect's cause in a skipped or left line about the
 * marker (install.ts writeMarker's skipped line, uninstall.ts removeMarker's line over an unreadable marker). The line
 * names the cause the reader saw, never another one, and points at the verify the run printed: the never-remove one,
 * or, for `foreign` (D-40, DI-18), the one that says the file was not written by install and to leave it if it is yours.
 */
export function markerDefectText(defect) {
    return MARKER_DEFECT_TEXT[defect];
}
// isLedgerPath: the `path` of one ledger entry has the shape stated in the header. The same rule serves
// every kind, because a file path and a directory path under the target have the same shape: relative
// to the target in POSIX form, non-empty, not starting with `/`, containing no `\` and no `:`, and every
// `/`-separated segment non-empty and neither `.` nor `..`. So no entry can name a path outside the
// target.
export function isLedgerPath(entry) {
    if (typeof entry !== "string" || entry === "")
        return false;
    if (entry.startsWith("/") || entry.includes("\\") || entry.includes(":"))
        return false;
    return entry.split("/").every((seg) => seg !== "" && seg !== "." && seg !== "..");
}
// ── CONTENT RECORDS (red-team of plan 33.1-28, brief DC-2) ────────────────────────────────────
// A ledger that names a path records a claim about that path at the moment install wrote it, not
// about whatever is there later: a user can delete the file and make their own at the same name, or
// edit it. So every record of a file install wrote also carries WHAT install wrote there, in one
// grammar, and both binaries ask one predicate whether the path still holds it:
//   `sha256:<64 lowercase hex>`  the sha256 of the bytes install wrote (a copy, a created file);
//   `link:<target>`              the link install made, by the exact target string it handed to
//                                symlinkSync (install.ts linkRecord).
// recordHolds(root, path, record) is the one question. A `sha256:` record holds only for a regular
// file inside `root`, read without following a link on the way or at the path (readForWrite, so a
// FIFO, a directory or a device is never opened, brief DC-3), whose bytes hash to the record. A
// `link:` record holds only for a symbolic link at the path, with nothing but real directories on the
// way, whose readlink names the target in the one spelling of a recorded path (isOwnLink, through
// user-file.ts sameRecordedPath; plan 34-21). Anything else does not hold. Every `file` entry of the
// ledger, a kit file or not, uses the same grammar and the same predicate.
//
// THE FILE MODE IS PART OF A FILE'S RECORD (red-team L1 of plan 33.1-34, brief DC-2). A record of the bytes
// alone let a chmod-only edit through: uninstall deleted a file whose bytes were install's and whose mode
// the user had changed, and the mode was lost. So the record of a FILE install wrote (a `file` entry
// `content`, a `gemini` entry `fileContent`) is now `sha256:<64 lowercase hex>;mode=<4 octal digits>`, the
// sha256 of the bytes and the permission bits (st_mode & 0o7777) the file had once install wrote it
// (fileRecord). It holds only while both still match. A record written before this rule, without
// `;mode=`, is still well-formed: it compares the bytes only, and the check says so (modeChecked false),
// so the caller's line says only the bytes were compared. The records of a VALUE (a `block` entry
// `block`, askContent, fileNameContent) are never a file's content, so they stay `sha256:<hex>`.
const SHA256_RECORD = /^sha256:[0-9a-f]{64}$/;
const FILE_RECORD = /^sha256:[0-9a-f]{64}(?:;mode=[0-7]{4})?$/;
const LINK_RECORD = /^link:[^\u0000-\u001f\u007f]+$/;
// A tree record (user-file.ts treeRecord, plan 33.1-37): a backup that is a directory.
const TREE_RECORD = /^tree:sha256:[0-9a-f]{64}$/;
const isSha256Record = (v) => typeof v === "string" && SHA256_RECORD.test(v);
const isFileRecord = (v) => typeof v === "string" && FILE_RECORD.test(v);
/** The record of `bytes` install wrote: `sha256:<hex>`. A string is hashed as its UTF-8 bytes. */
export function contentRecord(bytes) {
    return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}
/** A file mode as a record writes it: the one renderer, owned by user-file.ts and re-exported here. */
export { modeText };
/**
 * The record of a FILE install wrote: `sha256:<hex>;mode=<octal>` (see THE FILE MODE above). `mode` is the
 * file's st_mode as it stood once install wrote it; only the permission bits are kept.
 */
export function fileRecord(bytes, mode) {
    return `${contentRecord(bytes)};mode=${modeText(mode)}`;
}
/**
 * THE ONE COMPARISON of a file's bytes and mode with a `sha256:` file record (checkRecord and uninstall's
 * sentinel-file check both ask it). `mode` null means the caller has no mode for the file; a record that
 * carries one then does not hold.
 */
export function recordMatches(record, bytes, mode) {
    const at = record.indexOf(";mode=");
    const content = at === -1 ? record : record.slice(0, at);
    if (contentRecord(bytes) !== content)
        return { holds: false, why: null };
    const want = recordedModeOf(record);
    if (want === undefined)
        return { holds: true, modeChecked: false };
    if (mode === null)
        return { holds: false, why: "its file mode could not be read, so it could not be compared with the mode install wrote" };
    if (!modeMatches(want, mode)) {
        return { holds: false, why: null, modeChanged: `its file mode is ${modeText(mode)}, not the ${want} install wrote` };
    }
    return { holds: true, modeChecked: true };
}
/**
 * The mode a file record carries: what follows `;mode=` (four octal digits in a well-formed record), or
 * undefined when the record has none (a record written before THE FILE MODE rule, or a value record). A
 * malformed suffix is returned as it stands, so it never matches a rendered mode and the record does not
 * hold (fail closed).
 */
export function recordedModeOf(record) {
    const at = record.indexOf(";mode=");
    return at === -1 ? undefined : record.slice(at + ";mode=".length);
}
/**
 * THE ONE RECORDED-MODE COMPARISON (plan 34-13, WIN-2): true when `recordedMode` is undefined (the record
 * has no mode, so only the bytes are compared) or when the mode the platform stores now renders to it.
 * Both sides are modes the platform STORED: the recorded one was rendered from the lstat taken after
 * install wrote the file, and `mode` is the stat (or fstat) uninstall takes. On Windows the platform keeps
 * only the read-only attribute of a file, so a POSIX bit it never stored cannot make the two differ.
 * recordMatches and the created-file deletion checks of uninstall (Gemini settings, ask rules) all ask it.
 */
export function modeMatches(recordedMode, mode) {
    return recordedMode === undefined || modeText(mode) === recordedMode;
}
/** The one wording a caller appends to its line when a record had no mode to compare (see THE FILE MODE). */
export const NO_MODE_NOTE = "its record has no file mode, so only its bytes were compared";
/**
 * The record of a JSON value as a file holds it: contentRecord of JSON.stringify(value), or null for
 * no value (undefined). THE ONE SERIALISATION for a `gemini` entry fileNameContent and
 * an `ask-rules` entry askContent: install writes the record with it and both install (the carry) and
 * uninstall (before any edit) compare the current value with it, so the two sides cannot disagree
 * about what "the same list" means. The value comes from the parsed file (json-text.ts valueOf), so
 * spacing and escapes in the file do not change it.
 */
export function jsonValueRecord(value) {
    return value === undefined ? null : contentRecord(JSON.stringify(value));
}
/** The record of a symbolic link install made to `target`: `link:<target>`. */
export function linkRecord(target) {
    return `link:${target}`;
}
/** One value has the file-record grammar above (a file record, with or without its mode, or a link record). */
export function isContentRecord(v) {
    return typeof v === "string" && (FILE_RECORD.test(v) || LINK_RECORD.test(v));
}
/** A `backup` entry's content: a file, link or tree record (plan 33.1-37). null is checked by the caller. */
const isBackupContent = (v) => isContentRecord(v) || (typeof v === "string" && TREE_RECORD.test(v));
/** The one wording of a hard link that is not proof of what install wrote. */
export function hardLinkReason(names) {
    return (`it is a hard link (the same file has ${names} names, and another may be outside the target), so what it ` +
        `holds is not proof of what install wrote at this path`);
}
export function readOwnedContent(root, path) {
    const r = readForWrite(root, path);
    if (r.state === "ok")
        return { state: "ok", bytes: r.bytes, mode: r.mode };
    if (r.state === "create")
        return { state: "not-read", why: "it is no longer there" };
    if (r.names !== undefined)
        return { state: "not-read", why: hardLinkReason(r.names) };
    if (r.at === path && kindAt(path) === "symbolic link")
        return { state: "not-read", why: null };
    const where = r.at === path ? "it" : r.at;
    return { state: "not-read", why: `${where} ${r.reason}, so it could not be compared with what install wrote there` };
}
export function checkRecord(root, path, record) {
    if (record.startsWith("link:")) {
        return wayTo(root, path) === null && isOwnLink(path, record.slice("link:".length))
            ? { holds: true, modeChecked: true }
            : { holds: false, why: null };
    }
    const c = readOwnedContent(root, path);
    if (c.state !== "ok")
        return { holds: false, why: c.why };
    return recordMatches(record, c.bytes, c.mode);
}
/** `path` (strictly inside `root`) still holds exactly what `record` says install wrote there. */
export function recordHolds(root, path, record) {
    return checkRecord(root, path, record).holds;
}
// ── THE ONE LEDGER (plan 33.1-36, D-33 (b)) ─────────────────────────────────────────────────────
// The kinds, their exact key sets, the path rules and the reader, serializer and authority. See the
// header for what each kind records.
/**
 * The kinds an entry of the one ledger can have, in ledgerJson's order. Plan 33.1-37 added `backup` and
 * `kit` for the kit-home record (see THE KIT-HOME RECORD below); plan 33.1-40 records target backups with
 * `backup` too.
 */
export const LEDGER_KINDS = ["dir", "file", "block", "gemini", "ask-rules", "opencode-permission", "backup", "kit"];
export const KINDS_BY_SCOPE = {
    target: ["dir", "file", "block", "gemini", "ask-rules", "opencode-permission", "backup"],
    "kit-home": ["backup", "kit"],
};
/** The kit-home record's path relative to the kit home (plan 33.1-37). */
export const KIT_HOME_RECORD_REL = ".grugops-kit.json";
/** The one path a `kit` entry may name: the kit root, relative to the kit home. */
export const KIT_ENTRY_PATH = "agent-factory";
/** The name copyKit gives a kit-home backup: `agent-factory.bak.<isoStamp()>`. */
const KIT_HOME_BACKUP_NAME = /^agent-factory\.bak\.\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.\d{3}Z$/;
/**
 * What a `backup` entry's backup was made from (plan 33.1-37). `kit-home` is the kit root copyKit moved
 * aside, and is allowed only in the kit-home record; the others are target backups (plan 33.1-40):
 * the in-repo agent-factory/ and the legacy config --migrate moves aside, the handoffs directory, and an
 * edited kit file D-32 backs up. Each is allowed only in a target ledger.
 */
export const BACKUP_ORIGINS = ["in-repo-kit", "legacy-config", "handoffs", "edited-kit-file", "kit-home"];
/** The one path a `gemini` entry may name, and the one path an `ask-rules` entry may name. */
export const GEMINI_SETTINGS_REL = ".gemini/settings.json";
export const ASK_RULES_REL = ".claude/settings.json";
/**
 * THE ONE TEXT install writes when it creates `.gemini/settings.json` (plan 33.1-39, review WR-03): the
 * whole `context.fileName` list, AGENTS.md and GEMINI.md, and nothing else. install.ts writes it and
 * uninstall.ts compares with it (the emptied shape it deletes), so the two binaries cannot disagree about
 * what install wrote, the way checkpoint-ask-rules.ts createdSettingsText serves `.claude/settings.json`.
 */
export const GEMINI_CREATED_FILE_NAME = ["AGENTS.md", "GEMINI.md"];
export function createdGeminiText() {
    return JSON.stringify({ context: { fileName: [...GEMINI_CREATED_FILE_NAME] } }, null, 2) + "\n";
}
/**
 * THE ONE TEXT install writes when it creates opencode.json (phase 34.1, D-14): the OpenCode external_directory rule
 * for `pattern` and nothing else, two-space indented, with a final newline. install.ts writes it and uninstall.ts
 * compares with it (the file it deletes), so the two binaries cannot disagree about what install wrote.
 */
export function createdOpenCodeText(pattern) {
    return JSON.stringify({ permission: { external_directory: { [pattern]: "allow" } } }, null, 2) + "\n";
}
/** The only paths a `block` entry may name: the two pointer files install appends its block to. */
export const BLOCK_RELS = ["CLAUDE.md", ".github/copilot-instructions.md"];
/**
 * wholeFileEntryRels (phase 34.1, plan 34.1-01, D-08, D-11; moved here by plan 34.1-25, D-33): THE ONE DERIVATION of
 * the whole-file host entries for `hosts` (the agent skill, the OpenCode command, the Pi prompt template): the
 * ROUTE_POINTERS paths of the hosts' adapter kinds (host-tools.ts) that are not in BLOCK_RELS, without duplicates, in
 * registry order. Each is a committed generated file in the kit source (scripts/generate-host-entries.ts renders it
 * from the one pointer template) at the same relative path. install.ts writes them (writeWholeFileEntry), and
 * uninstall.ts reports an unrecorded one (reportUnrecordedHostEntries), both from this list, so the two binaries
 * cannot disagree about which files they are.
 */
export function wholeFileEntryRels(hosts) {
    return [...new Set(hosts.flatMap((h) => ROUTE_POINTERS[h.adapter].filter((rel) => !BLOCK_RELS.includes(rel))))];
}
/**
 * Every copy of the block lines in `buf`: an open line at a line start through the first `\n<close>\n` after it.
 *
 * THE ONE FINDER OF SENTINEL BLOCK SPANS (plan 34-28, moved here from uninstall.ts unchanged in behaviour).
 * Uninstall's removal (removeSentinelBlock) and install's refresh (ensureBlock) both keep only the spans whose
 * bytes hash to the `block` entry's record, so the bytes the refresh replaces are exactly the bytes the
 * reversal would remove. Pure: no I/O.
 */
export function blockLineSpans(buf, open, close) {
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
const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
// keyProblem: the reason `o`'s key set is not exactly `want` (missing or extra), or null.
function keyProblem(o, want) {
    const missing = want.filter((k) => !hasOwn(o, k));
    if (missing.length > 0)
        return `it lacks ${missing.join(", ")}`;
    const extra = Object.keys(o).filter((k) => !want.includes(k));
    if (extra.length > 0)
        return `it has a key no entry of its kind has (${extra.map((k) => JSON.stringify(k).slice(0, 60)).join(", ")})`;
    return null;
}
// geminiProblem: the reason the fields of a `gemini` entry break THE gemini ENTRY rules, or null. The key
// set is checked first, so an entry with a conditional key where it does not belong is malformed; a
// partial record never reads as a smaller claim.
function geminiProblem(r) {
    if (typeof r.createdFile !== "boolean" || typeof r.addedEntry !== "boolean")
        return "createdFile and addedEntry must be booleans";
    const want = ["path", "kind", "createdFile", "addedEntry", "fileNameContent"];
    if (r.addedEntry)
        want.push("createdContext", "fileNameBefore");
    else
        want.push("noEntryReason");
    if (r.createdFile)
        want.push("fileContent");
    const keys = keyProblem(r, want);
    if (keys !== null)
        return keys;
    if (r.fileNameContent !== null && !isSha256Record(r.fileNameContent))
        return "fileNameContent is neither null nor a sha256 record";
    if (r.addedEntry) {
        if (typeof r.createdContext !== "boolean")
            return "createdContext is not a boolean";
        if (r.fileNameBefore !== "absent" && r.fileNameBefore !== "string" && r.fileNameBefore !== "array")
            return "fileNameBefore is not absent, string or array";
        if (r.fileNameContent === null)
            return "fileNameContent is null although addedEntry is true";
    }
    else if (typeof r.noEntryReason !== "string" || !NO_ENTRY_REASONS.includes(r.noEntryReason)) {
        return "noEntryReason is not one of already-listed, refused, reset, reversed";
    }
    if (r.createdFile) {
        if (!r.addedEntry || r.createdContext !== true || r.fileNameBefore !== "absent") {
            return "createdFile true needs addedEntry true, createdContext true and fileNameBefore absent";
        }
        if (!isFileRecord(r.fileContent))
            return "fileContent is not a file record";
    }
    return null;
}
// askProblem: the reason the fields of an `ask-rules` entry break the AskRuleLedger rules, or null.
function askProblem(r) {
    const want = ["path", "kind", "added", "createdFile", "createdPermissions", "createdAsk", "askContent"];
    if (hasOwn(r, "fileMode"))
        want.push("fileMode");
    const keys = keyProblem(r, want);
    if (keys !== null)
        return keys;
    if (!Array.isArray(r.added) || !r.added.every((x) => typeof x === "string"))
        return "added is not a list of strings";
    if (typeof r.createdFile !== "boolean" || typeof r.createdPermissions !== "boolean" || typeof r.createdAsk !== "boolean") {
        return "createdFile, createdPermissions and createdAsk must be booleans";
    }
    // Red-team of plan 33.1-28 (R3): the ask array's content record is part of the shape.
    if (r.askContent !== null && !isSha256Record(r.askContent))
        return "askContent is neither null nor a sha256 record";
    if (hasOwn(r, "fileMode") && (r.createdFile !== true || typeof r.fileMode !== "string" || !/^[0-7]{4}$/.test(r.fileMode))) {
        return "fileMode is not four octal digits on an entry whose createdFile is true";
    }
    return null;
}
// openCodeProblem: the reason the fields of an `opencode-permission` entry break the OpenCodePermissionLedger rules, or
// null. The key set is checked first (askProblem's model), so a partial or extended record never reads as a claim.
function openCodeProblem(r) {
    const want = ["path", "kind", "pattern", "createdFile", "createdPermission", "createdExternalDirectory", "content"];
    if (hasOwn(r, "fileMode"))
        want.push("fileMode");
    const keys = keyProblem(r, want);
    if (keys !== null)
        return keys;
    if (typeof r.pattern !== "string" || r.pattern === "" || /[\u0000-\u001f\u007f]/.test(r.pattern))
        return "pattern is not a non-empty string without control characters";
    if (typeof r.createdFile !== "boolean" || typeof r.createdPermission !== "boolean" || typeof r.createdExternalDirectory !== "boolean") {
        return "createdFile, createdPermission and createdExternalDirectory must be booleans";
    }
    if (!isSha256Record(r.content))
        return "content is not a sha256 record";
    if (r.createdFile && (!r.createdPermission || !r.createdExternalDirectory))
        return "createdFile true needs createdPermission and createdExternalDirectory true";
    if (r.createdPermission && !r.createdExternalDirectory)
        return "createdPermission true needs createdExternalDirectory true";
    if (hasOwn(r, "fileMode") && (r.createdFile !== true || typeof r.fileMode !== "string" || !/^[0-7]{4}$/.test(r.fileMode))) {
        return "fileMode is not four octal digits on an entry whose createdFile is true";
    }
    return null;
}
// entryProblem: the reason one raw entry is not exactly its kind's shape, or null. The rules are the
// ones each retired record's reader applied, now asked of one entry. `scope` (plan 33.1-37) says which
// record the entry was read from; a kind or a backup origin outside it is refused.
function entryProblem(e, scope) {
    if (!isPlainObject(e))
        return "it is not a JSON object";
    if (!isLedgerPath(e.path))
        return `its path is not a relative POSIX path inside the ${scope === "target" ? "target" : "kit home"}`;
    if (typeof e.kind !== "string" || !LEDGER_KINDS.includes(e.kind)) {
        return `its kind is not one of ${LEDGER_KINDS.join(", ")}`;
    }
    if (!KINDS_BY_SCOPE[scope].includes(e.kind)) {
        return `a ${e.kind} entry does not belong in the ${scope === "target" ? "target's install ledger" : "kit-home record"} (it holds only ${KINDS_BY_SCOPE[scope].join(" and ")} entries)`;
    }
    switch (e.kind) {
        case "dir":
            return keyProblem(e, ["path", "kind"]);
        case "file": {
            const keys = keyProblem(e, ["path", "kind", "content", "kit"]);
            if (keys !== null)
                return keys;
            if (!isContentRecord(e.content))
                return "its content is not a content record";
            if (typeof e.kit !== "boolean")
                return "its kit is not a boolean";
            return null;
        }
        case "block": {
            if (!BLOCK_RELS.includes(e.path))
                return `a block entry may name only ${BLOCK_RELS.join(" or ")}`;
            const keys = keyProblem(e, ["path", "kind", "block", "separator"]);
            if (keys !== null)
                return keys;
            if (!isSha256Record(e.block))
                return "its block is not a sha256 record";
            if (e.separator !== "blank-line" && e.separator !== "line-end")
                return "its separator is neither blank-line nor line-end";
            return null;
        }
        case "gemini":
            if (e.path !== GEMINI_SETTINGS_REL)
                return `a gemini entry may name only ${GEMINI_SETTINGS_REL}`;
            return geminiProblem(e);
        case "ask-rules":
            if (e.path !== ASK_RULES_REL)
                return `an ask-rules entry may name only ${ASK_RULES_REL}`;
            return askProblem(e);
        case "opencode-permission":
            if (e.path !== OPENCODE_CONFIG_REL)
                return `an opencode-permission entry may name only ${OPENCODE_CONFIG_REL}`;
            return openCodeProblem(e);
        case "kit":
            if (e.path !== KIT_ENTRY_PATH)
                return `a kit entry may name only ${KIT_ENTRY_PATH}`;
            return keyProblem(e, ["path", "kind"]);
        case "backup": {
            const keys = keyProblem(e, ["path", "kind", "origin", "of", "content"]);
            if (keys !== null)
                return keys;
            if (typeof e.origin !== "string" || !BACKUP_ORIGINS.includes(e.origin)) {
                return `its origin is not one of ${BACKUP_ORIGINS.join(", ")}`;
            }
            if ((e.origin === "kit-home") !== (scope === "kit-home")) {
                return scope === "kit-home"
                    ? `a backup in the kit-home record must have origin kit-home, not ${e.origin}`
                    : "a backup with origin kit-home belongs in the kit-home record, not the target's install ledger";
            }
            if (!isLedgerPath(e.of))
                return "its `of` is not a relative POSIX path";
            if (e.origin === "kit-home" && e.of !== KIT_ENTRY_PATH)
                return `a kit-home backup must be of ${KIT_ENTRY_PATH}`;
            // The one name copyKit gives a kit-home backup, so a record that names any other path in the kit home
            // (a forged or hand-edited entry) is malformed rather than a claim a later prune could act on.
            if (e.origin === "kit-home" && !KIT_HOME_BACKUP_NAME.test(e.path)) {
                return `a kit-home backup must be named ${KIT_ENTRY_PATH}.bak.<ISO>, the name install gives it`;
            }
            if (e.of === e.path)
                return "its `of` is its own path";
            if (e.content !== null && !isBackupContent(e.content))
                return "its content is neither null nor a file, link or tree record";
            return null;
        }
    }
}
// normalize: the typed entry of a raw entry entryProblem accepted, holding only its kind's keys.
function normalize(e) {
    const path = e.path;
    switch (e.kind) {
        case "dir":
            return { path, kind: "dir" };
        case "file":
            return { path, kind: "file", content: e.content, kit: e.kit };
        case "block":
            return { path, kind: "block", block: e.block, separator: e.separator };
        case "gemini": {
            const g = { path, kind: "gemini", createdFile: e.createdFile, addedEntry: e.addedEntry, fileNameContent: e.fileNameContent };
            if (g.addedEntry) {
                g.createdContext = e.createdContext;
                g.fileNameBefore = e.fileNameBefore;
            }
            else {
                g.noEntryReason = e.noEntryReason;
            }
            if (g.createdFile)
                g.fileContent = e.fileContent;
            return g;
        }
        case "ask-rules": {
            const a = {
                path,
                kind: "ask-rules",
                added: [...e.added].sort(),
                createdFile: e.createdFile,
                createdPermissions: e.createdPermissions,
                createdAsk: e.createdAsk,
                askContent: e.askContent,
            };
            if (typeof e.fileMode === "string")
                a.fileMode = e.fileMode;
            return a;
        }
        case "opencode-permission": {
            const o = {
                path,
                kind: "opencode-permission",
                pattern: e.pattern,
                createdFile: e.createdFile,
                createdPermission: e.createdPermission,
                createdExternalDirectory: e.createdExternalDirectory,
                content: e.content,
            };
            if (typeof e.fileMode === "string")
                o.fileMode = e.fileMode;
            return o;
        }
        case "backup":
            return { path, kind: "backup", origin: e.origin, of: e.of, content: e.content };
        case "kit":
            return { path, kind: "kit" };
    }
}
const KIND_ORDER = (k) => LEDGER_KINDS.indexOf(k);
const byPathThenKind = (a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : KIND_ORDER(a.kind) - KIND_ORDER(b.kind);
/**
 * THE ONE READER of the install ledger. `holder` is install's `ok` marker (or null when there is none
 * a caller can use), or the kit-home record with `scope` "kit-home" (plan 33.1-37). Every entry must
 * have exactly its kind's shape and a kind its scope holds (KINDS_BY_SCOPE); one that does not, two
 * entries with the same (path, kind), or a value that is not a list make the whole ledger `malformed`,
 * and nothing in it is used.
 */
export function readLedger(holder, scope = "target") {
    if (holder === null || !hasOwn(holder, LEDGER_FIELD))
        return { state: "absent", entries: [], why: null, raw: undefined };
    const raw = holder[LEDGER_FIELD];
    const bad = (why) => ({ state: "malformed", entries: [], why, raw });
    if (!Array.isArray(raw))
        return bad("the install ledger is not a list");
    const entries = [];
    const seen = new Set();
    for (let i = 0; i < raw.length; i += 1) {
        const problem = entryProblem(raw[i], scope);
        if (problem !== null)
            return bad(`entry ${i}: ${problem}`);
        const entry = normalize(raw[i]);
        const key = `${entry.kind}\u0000${entry.path}`;
        if (seen.has(key))
            return bad(`entry ${i}: a second ${entry.kind} entry for ${JSON.stringify(entry.path).slice(0, 120)}, so which one is install's record is not known`);
        seen.add(key);
        entries.push(entry);
    }
    return { state: "ok", entries: entries.sort(byPathThenKind), why: null, raw };
}
/**
 * THE ONE SERIALIZER of the install ledger: the entries sorted by path, then by kind in LEDGER_KINDS
 * order, each with its kind's keys in a fixed order, so an entry carried forward and an entry written
 * new serialize the same way. readLedger(ledgerJson(x)) gives back x for a ledger readLedger returned.
 */
export function ledgerJson(entries) {
    return [...entries].sort(byPathThenKind).map((e) => {
        switch (e.kind) {
            case "dir":
                return { path: e.path, kind: e.kind };
            case "file":
                return { path: e.path, kind: e.kind, content: e.content, kit: e.kit };
            case "block":
                return { path: e.path, kind: e.kind, block: e.block, separator: e.separator };
            case "gemini": {
                const out = { path: e.path, kind: e.kind, createdFile: e.createdFile, addedEntry: e.addedEntry };
                if (e.addedEntry) {
                    out.createdContext = e.createdContext;
                    out.fileNameBefore = e.fileNameBefore;
                }
                else {
                    out.noEntryReason = e.noEntryReason;
                }
                out.fileNameContent = e.fileNameContent;
                if (e.createdFile)
                    out.fileContent = e.fileContent;
                return out;
            }
            case "ask-rules":
                return {
                    path: e.path,
                    kind: e.kind,
                    added: [...e.added].sort(),
                    createdFile: e.createdFile,
                    createdPermissions: e.createdPermissions,
                    createdAsk: e.createdAsk,
                    askContent: e.askContent,
                    ...(e.fileMode === undefined ? {} : { fileMode: e.fileMode }),
                };
            case "opencode-permission":
                return {
                    path: e.path,
                    kind: e.kind,
                    pattern: e.pattern,
                    createdFile: e.createdFile,
                    createdPermission: e.createdPermission,
                    createdExternalDirectory: e.createdExternalDirectory,
                    content: e.content,
                    ...(e.fileMode === undefined ? {} : { fileMode: e.fileMode }),
                };
            case "backup":
                return { path: e.path, kind: e.kind, origin: e.origin, of: e.of, content: e.content };
            case "kit":
                return { path: e.path, kind: e.kind };
        }
    });
}
/** The entry of `kind` for `rel` in an `ok` ledger, or undefined. */
export function entryAt(ledger, rel, kind) {
    if (ledger.state !== "ok")
        return undefined;
    return ledger.entries.find((e) => e.kind === kind && e.path === rel);
}
/** Every entry of `kind` in an `ok` ledger, in ledgerJson's order; empty otherwise. */
export function entriesOfKind(ledger, kind) {
    if (ledger.state !== "ok")
        return [];
    return ledger.entries.filter((e) => e.kind === kind);
}
/** A `gemini` entry for `fields` (the one path such an entry may name). */
export const geminiEntry = (fields) => ({ ...fields, path: GEMINI_SETTINGS_REL, kind: "gemini" });
/** An `ask-rules` entry for `fields` (the one path such an entry may name). */
export const askRulesEntry = (fields) => ({ ...fields, path: ASK_RULES_REL, kind: "ask-rules" });
/** An `opencode-permission` entry for `fields` (the one path such an entry may name). */
export const opencodePermissionEntry = (fields) => ({
    ...fields,
    path: OPENCODE_CONFIG_REL,
    kind: "opencode-permission",
});
// notRecordedReason (re-review IN-01, plan 33.1-28; moved here with owns, plan 33.1-36): the ONE wording
// of "there is no install record for this path", chosen from the ledger's state. It says what the record
// shows, never more: a path missing from a readable ledger has no record that install created it, which
// is not the same as "install did not create it".
export function notRecordedReason(ledger, what) {
    if (ledger.state === "ok") {
        return `there is no record that install created it — it is not in the install ledger as a ${what}; left in place`;
    }
    if (ledger.state === "malformed") {
        // No position is named (D-26, brief MSG-1): install prints its verify about the ledger after the passes that use
        // this reason, and the doctor prints a FAIL, not a verify.
        return "the install ledger in .grugops/install.json could not be used (this run reports why on its own line), so there is no record that install created it; left in place";
    }
    return "there is no install marker this run can use, so there is no record that install created it; left in place";
}
/**
 * The pseudo-kind owns answers for the marker itself (plan 33.1-38): not a ledger kind (no entry names
 * it), valid only for MARKER_REL.
 */
export const MARKER_KIND = "marker";
export function owns(ledger, root, rel, kind) {
    if (kind === MARKER_KIND) {
        if (rel !== MARKER_REL) {
            return { owned: false, recorded: false, entry: null, reason: `only ${MARKER_REL} is install's marker; left in place` };
        }
        if (ledger.state === "ok")
            return { owned: true, entry: null, note: null };
        return { owned: false, recorded: ledger.state === "malformed", entry: null, reason: notRecordedReason(ledger, "entry") };
    }
    const entry = entryAt(ledger, rel, kind);
    if (entry === undefined) {
        return { owned: false, recorded: false, entry: null, reason: notRecordedReason(ledger, kind === "dir" ? "directory" : kind === "file" ? "file" : "entry") };
    }
    if (entry.kind === "kit" || entry.kind === "backup")
        return ownsKitHomePath(root, rel, entry);
    if (entry.kind !== "file")
        return { owned: true, entry, note: null };
    const c = checkRecord(root, join(root, ...rel.split("/")), entry.content);
    if (c.holds)
        return { owned: true, entry, note: c.modeChecked ? null : NO_MODE_NOTE };
    if (c.modeChanged !== undefined) {
        return { owned: false, recorded: true, entry, reason: `${c.modeChanged} there (a change made since), so it is not what install wrote; left in place` };
    }
    if (c.why !== null)
        return { owned: false, recorded: true, entry, reason: `${c.why}; left in place` };
    return {
        owned: false,
        recorded: true,
        entry,
        reason: "it does not hold what the install ledger records install wrote there (it was edited or replaced since), so " +
            "there is no record that install wrote this content; left in place",
    };
}
// carriedKitRecord: THE KIT CARRY (red-team of plan 33.1-36, the named human's decision of 2026-10-02,
// plan 33.1-37 Task 4, brief DC-2). A kit destination that already holds exactly what install would write
// there (an identical copy, or a --symlink install's own link) was recorded as install's (`kit: true`) on
// that identity alone, so a user's hand copy of a grugops skill became install's record, and the next
// uninstall deleted it. Identity with the kit source is not a record. Such a destination keeps a record only
// as a CARRY: the previous `ok` ledger holds a kit-true `file` entry for `rel`, and owns answers owned (the
// path still holds that entry's content record). The record carried is that entry's own content record, so
// a carry never claims more than the earlier install wrote. Anything else answers null: install records
// nothing for the path, reports it `left`, and uninstall leaves it.
export function carriedKitRecord(previous, root, rel) {
    const e = entryAt(previous, rel, "file");
    if (e === undefined || !e.kit)
        return null;
    return owns(previous, root, rel, "file").owned ? e.content : null;
}
// ── THE TARGET'S BACKUP RECORDS (plan 33.1-40, D-33 (c), review CR-02, deferred row 45) ─────────────────
// Install used to record none of the backups it makes in the target, so nothing could tell install's
// `agent-factory.bak.<ISO>/` from a user's `thesis.bak.<ISO>/`, and --prune-old-kit removed both by the
// name shape (DC-2). Now each backup install makes in the target is a `backup` entry of the install ledger,
// at its final path, with the content record below taken once the backup is in place. Three pure rules
// serve install.ts's recordBackup and writeMarker, so they are unit-tested here (install.ts runs on import):
//   backupContentRecord  what a backup holds now: the file record (bytes and mode, read through
//                        readOwnedContent, so no link is followed and a hard link is refused) for a regular
//                        file, treeRecord for a directory or a link, and null for anything else, for a path
//                        with a link or a non-directory on the way, or for anything that cannot be read in
//                        full. null can never be shown to be unchanged, so a backup recorded with it is never
//                        pruned;
//   outermostBackups     only the outermost entries: an entry whose path lies inside another entry's path is
//                        covered by that entry's record (the kit config backup --migrate leaves inside the
//                        in-repo agent-factory/ travels inside `agent-factory.bak.<ISO>/`);
//   carriedBackups       a previous ledger's backup entries whose path still holds something, with only real
//                        directories on the way. One whose path is gone is dropped: the record would name
//                        nothing, and a later file at that name would be someone else's.
/** What the backup at `rel` (inside `root`) holds now, as a content record, or null (see above). */
export function backupContentRecord(root, rel) {
    const path = join(root, ...rel.split("/"));
    if (wayTo(root, path) !== null)
        return null;
    const kind = kindAt(path);
    if (kind === "regular file") {
        const c = readOwnedContent(root, path);
        return c.state === "ok" ? fileRecord(c.bytes, c.mode) : null;
    }
    if (kind === "directory" || kind === "symbolic link")
        return treeRecord(root, rel);
    return null;
}
/** `inner` lies strictly inside `outer` (both ledger paths). */
const isInsidePath = (inner, outer) => inner.startsWith(`${outer}/`);
/** The entries none of whose paths lies inside another entry's path, in their order. */
export function outermostBackups(entries) {
    return entries.filter((e) => !entries.some((o) => o !== e && isInsidePath(e.path, o.path)));
}
/** The previous ledger's backup entries whose path still holds something, nothing but real directories on the way. */
export function carriedBackups(previous, root) {
    return entriesOfKind(previous, "backup").filter((e) => {
        const path = join(root, ...e.path.split("/"));
        return wayTo(root, path) === null && kindAt(path) !== null;
    });
}
// ownsKitHomePath: owns' answer for a `kit` or `backup` entry (plan 33.1-37; see THE KIT-HOME RECORD).
//   kit     owned only while a real directory (by lstat, not a link, nothing but real directories on the
//           way) sits at the path. ITS CONTENT IS NOT COMPARED. That is D-31 item 14's acceptance (the
//           named human's decision of 2026-09-30): a re-install may overwrite edits inside the shared kit
//           install wrote, and a backup of kit-home edits is deferred. It holds only for a kit the record
//           names; anything at the kit root the record does not name is renamed aside, never deleted.
//   backup  owned only while its content record is not null and the path still holds exactly it
//           (treeRecord now equals the record: a file's bytes and mode, a link's target, or every entry of
//           a tree). A null record can never be shown to hold, so it is never owned.
function ownsKitHomePath(root, rel, entry) {
    const path = join(root, ...rel.split("/"));
    if (wayTo(root, path) !== null) {
        return { owned: false, recorded: true, entry, reason: "something on the way to it is not a real directory, so it is not shown to be what install left there; left in place" };
    }
    if (entry.kind === "kit") {
        const kind = kindAt(path);
        if (kind === "directory")
            return { owned: true, entry, note: null };
        return {
            owned: false,
            recorded: true,
            entry,
            reason: kind === null ? "it is no longer there" : `it is not a real directory (it is a ${kind}), so it is not the kit install wrote`,
        };
    }
    if (entry.content === null) {
        return { owned: false, recorded: true, entry, reason: "its record holds no content record, so it can never be shown to be unchanged; left in place" };
    }
    if (treeRecord(root, rel) === entry.content)
        return { owned: true, entry, note: null };
    return {
        owned: false,
        recorded: true,
        entry,
        reason: "it does not hold what the record says install left there (it was changed since, or could not be read in full); left in place",
    };
}
export function readKitHomeRecord(home) {
    const none = { state: "absent", entries: [], why: null, raw: undefined };
    const path = join(home, KIT_HOME_RECORD_REL);
    const read = readForWrite(home, path);
    if (read.state === "create")
        return { state: "absent", ledger: none, why: null, boundTo: null, bytes: null };
    const unreadable = (why) => ({ state: "unreadable", ledger: none, why, boundTo: null, bytes: null });
    if (read.state === "blocked")
        return unreadable(read.at === path ? `it ${read.reason}` : `${read.at} ${read.reason}`);
    const doc = readJsonText(read.bytes);
    if (!doc.ok)
        return unreadable(`it ${doc.why}`);
    if (firstDuplicateKey(doc.root) !== null)
        return unreadable("it has a duplicate key, so which value is install's record is not known");
    let parsed;
    try {
        parsed = JSON.parse(read.text);
    }
    catch {
        return unreadable("it is not valid JSON");
    }
    if (!isPlainObject(parsed))
        return unreadable("it is not a JSON object");
    const keys = keyProblem(parsed, ["grugopsHome", "ledger"]);
    if (keys !== null)
        return unreadable(`it is not install's kit-home record: ${keys}`);
    if (typeof parsed.grugopsHome !== "string")
        return unreadable("its grugopsHome is not a string");
    const ledger = readLedger(parsed, "kit-home");
    if (ledger.state !== "ok")
        return unreadable(`its ledger is malformed (${ledger.why ?? "absent"})`);
    const here = realTargetPath(home);
    if (here === null || !sameRecordedPath(parsed.grugopsHome, here)) {
        return {
            state: "unbound",
            ledger: none,
            why: here === null
                ? "the real path of the kit home could not be read, so the record cannot be shown to be this kit home's"
                : `it was written for another kit home (${parsed.grugopsHome}), not this one (${here})`,
            boundTo: parsed.grugopsHome,
            bytes: null,
        };
    }
    return { state: "ok", ledger, why: null, boundTo: here, bytes: read.bytes };
}
// installMarkerProblems (plan 33.1-33, brief DC-2, ownsMarker): the reasons a parsed JSON object is
// not install's own marker, empty when it is. install's writeMarker always writes `grugopsHome`,
// `kitRoot` and `installMode` as strings, and writes `kitVersion` as a string or, since plan 33.1-32's
// red-team B2, not at all (a run that wrote no kit file and had no earlier version to keep). A JSON
// object the user put at `.grugops/install.json` does not carry these fields, and reading it as install's
// marker would make it an install made before every ledger: uninstall deleted it by its name, and the
// kit-file fallback removed the verbatim skills. So readInstallMarker asks this before it answers `ok`
// (for both binaries); a marker with a problem is not used, and nothing is done on it. Since D-40 (DI-18)
// readInstallMarker asks this only of an object holding at least one of INSTALL_RECORD_FIELDS: one holding
// none is `foreign` (not written by install) before this runs, so a problem reported here is a field of
// install's record to fix by hand (defect `field`).
//
// VALUES, NOT ONLY TYPES (red-team B2 of plan 33.1-33). Strings were enough before, so empty strings and
// an installMode of "banana" passed. install writes grugopsHome and kitRoot as absolute paths
// (canonicalPathSpelling(resolve(...)), user-file.ts), installMode as "copy" or "symlink" (install.ts refuses any other INSTALL_MODE
// as bad usage), and `target` as this directory's real path. A field holding anything else is not
// install's value, and the marker is not install's. `target` may be absent here (a marker written before
// the binding existed); markerBinding then says the marker is not bound.
//
// ABSOLUTE BY THE ONE RULE (plan 34-21, D-23, review WR-09). A path field is install's value when it is
// a string, carries no leading or trailing whitespace, is not empty, and is absolute by user-file.ts
// isRecordedAbsolute: the path flavor's own isAbsolute, the rule the canonical-path module owns. Until
// this plan a hand-written test here (a leading `/`, or a drive letter and a separator) decided it, and
// it disagreed with the flavor: on Windows it refused a target in native UNC spelling, which
// sameRecordedPath binds, so that marker was unusable; on POSIX it accepted `C:/x`, a relative path
// there. `flavor` is for the tests (install/canonical-path.test.ts); both binaries omit it and get the
// host's.
export function installMarkerProblems(marker, flavor) {
    const out = [];
    const has = (k) => Object.prototype.hasOwnProperty.call(marker, k);
    const isAbsolutePathValue = (v) => typeof v === "string" && v.trim() === v && v !== "" && isRecordedAbsolute(v, flavor);
    for (const k of ["grugopsHome", "kitRoot"]) {
        if (!has(k))
            out.push(`no ${k}`);
        else if (typeof marker[k] !== "string")
            out.push(`${k} is not a string`);
        else if (!isAbsolutePathValue(marker[k]))
            out.push(`${k} is not an absolute path`);
    }
    if (!has("installMode"))
        out.push("no installMode");
    else if (marker.installMode !== "copy" && marker.installMode !== "symlink")
        out.push("installMode is neither copy nor symlink");
    if (has("kitVersion") && typeof marker.kitVersion !== "string")
        out.push("kitVersion is not a string");
    if (has("target") && !isAbsolutePathValue(marker.target))
        out.push("target is not an absolute path");
    // `agents` (plan 34.1-06, D-03): install writes a list of distinct registry-shaped ids. Anything else is not install's
    // value, so the marker is not install's and reads `unreadable` (fail closed, T-34.1-10): a garbled or forged field
    // never chooses what install writes. An id the registry does not know is well-formed here; installedAgents keeps it
    // and acts on nothing for it.
    if (has(AGENTS_FIELD) && !isAgentIdList(marker[AGENTS_FIELD]))
        out.push("agents is not a list of agent ids");
    return out;
}
/** The shape of an agent id in the `agents` field: lower-case letters, digits and hyphens, starting with a letter. */
export const AGENT_ID_SHAPE = /^[a-z][a-z0-9-]*$/;
/** Whether `v` is a list of distinct strings, each of AGENT_ID_SHAPE: the one rule for a well-formed `agents` field. */
function isAgentIdList(v) {
    return Array.isArray(v) && v.every((id) => typeof id === "string" && AGENT_ID_SHAPE.test(id)) && new Set(v).size === v.length;
}
// ── THE INSTALLED SET (phase 34.1, D-03, D-04, D-05, D-07) ──────────────────────────────────────────────────────────
//
// THE `agents` FIELD (its meaning is written here once; install/README.md "Which agents an unattended install is for"
// says the same for users, phase 34.1 D-26, IN-21). Since plan 34.1-06 every install records, in its marker, `agents`:
// a list of registry ids (host-tools.ts HOST_TOOLS), in registry order, written by install.ts writeMarker between
// `target` and `ledger`. It records THE AGENTS CHOSEN FOR THIS TARGET AND NOT YET REMOVED: chosen by flag, at the agent
// list, from the record or by detection, in this install or an earlier one. Install only adds (D-04: naming fewer
// agents never removes one from the record), so a chosen agent whose every write was refused stays recorded, and a
// later unattended install chooses it again (D-04's retry). An uninstall drops an agent only once nothing install
// recorded for it is left in place (agentsToRecord below, D-26, D-29). "Installed", in the sense of "install wrote
// something here", is never stored: a consumer that needs it derives it from this field and the ledger (the doctor's
// doctorHosts in install.ts asks agentsToRecord with keep [] for the agents that own a holding ledger entry).
//
// WHY A RECORDED FIELD AND NOT A DERIVATION FROM THE LEDGER (34.1-RESEARCH.md Pattern 2). `.agents/skills/grugops/
// SKILL.md` is the entry of two registry rows (Codex CLI and Antigravity CLI, D-20), so a ledger record of that file
// cannot say which of the two was chosen. And "installed" is never read from presence on disk (brief DC-2): a file the
// user made, or a directory another tool made, is not an install.
/** The marker field that records the agents chosen for the target and not yet removed (D-03, D-04, D-26; THE
 *  `agents` FIELD above). */
export const AGENTS_FIELD = "agents";
/**
 * LEGACY_ADAPTER_KINDS (D-23): the adapter kinds every install before this phase wrote: the Claude Code kit and the
 * CLAUDE.md start-here block (claude-kit), the Copilot pointer (copilot-pointer) and the Pi prompt template
 * (pi-prompt-template). A marker with a usable ledger and no `agents` field was written before this phase, so it counts
 * as the registry hosts of these kinds: Claude Code, Copilot and Pi. Its `gemini` ledger entry (the Gemini settings
 * merge every earlier install made) selects nothing: Antigravity CLI is not of these kinds. Codex CLI and OpenCode had
 * no entry before this phase, so they are never legacy-installed.
 */
export const LEGACY_ADAPTER_KINDS = ["claude-kit", "copilot-pointer", "pi-prompt-template"];
const NONE_INSTALLED = { source: "none", ids: [] };
/**
 * installedAgents: THE ONE DERIVATION of the installed set (D-03, D-05, D-07). Install's unattended selection, the
 * uninstaller's per-agent removal and `--check`'s reach lines all ask it, and none reads the `agents` field or the
 * ledger for this answer itself. Pure over its two reads (readInstallMarker of the target, and readLedger of that
 * marker): no I/O here.
 */
export function installedAgents(marker, ledger) {
    if (marker.state !== "ok")
        return NONE_INSTALLED;
    if (!Object.prototype.hasOwnProperty.call(marker.marker, AGENTS_FIELD)) {
        if (ledger.state !== "ok")
            return NONE_INSTALLED;
        return { source: "legacy", ids: HOST_TOOLS.filter((h) => LEGACY_ADAPTER_KINDS.includes(h.adapter)).map((h) => h.id) };
    }
    // An `ok` marker's `agents` passed installMarkerProblems (a list of distinct agent ids); the guard below is for a
    // caller that hands in a marker read some other way, and it fails closed.
    const recorded = marker.marker[AGENTS_FIELD];
    if (!isAgentIdList(recorded))
        return NONE_INSTALLED;
    const members = recorded;
    const known = new Set(HOST_TOOLS.map((h) => h.id));
    return {
        source: "recorded",
        ids: HOST_TOOLS.filter((h) => members.includes(h.id)).map((h) => h.id),
        unknown: members.filter((id) => !known.has(id)),
    };
}
// ── WHICH AGENTS A MARKER WRITE RECORDS (phase 34.1 gap round 1, D-26, D-29; brief REC-1) ───────────────────────────
//
// THE MARKER RULE'S HOLDING SET, MOVED HERE FROM uninstall.ts (plan 34.1-14) so the uninstaller's marker rule and the
// `agents` derivation below ask one set. An entry whose content install wrote (file, block, gemini, ask-rules,
// opencode-permission) holds the marker while it is in place; directory and backup entries never do, and neither does a
// gemini or ask-rules entry that records nothing install added or created (there is nothing of install's to reverse).
/** The ledger kinds whose entries hold the marker while they are in place (the marker rule, plan 33.1-39). */
export const HOLDING_KINDS = new Set(["file", "block", "gemini", "ask-rules", "opencode-permission"]);
/** A gemini or ask-rules entry that records nothing install added or created: there is nothing of install's to reverse. */
function entryClaimsNothing(e) {
    if (e.kind === "gemini")
        return !e.addedEntry && !e.createdFile;
    if (e.kind === "ask-rules")
        return e.added.length === 0 && !e.createdFile && !e.createdPermissions && !e.createdAsk;
    return false;
}
/**
 * entryHolds: whether ledger entry `e` is of a holding kind (HOLDING_KINDS) and records something install wrote. The
 * one answer to "does this entry hold the marker while it is in place", asked by the uninstaller's marker rule
 * (heldEntries) and by agentsToRecord. Pure: it reads the entry only, never the disk.
 */
export function entryHolds(e) {
    return HOLDING_KINDS.has(e.kind) && !entryClaimsNothing(e);
}
/**
 * agentsToRecord: THE ONE DERIVATION of the `agents` value every marker write that sets the field records (D-26, brief
 * REC-1): install.ts writeMarker, and the uninstaller's partial-clean, partial-kept and flag-less-kept rewrites
 * (uninstall.ts updateKeptMarker, through agentsAfter). install.ts rewriteLedger sets no `agents`: it carries the field
 * as read beside a change to backup entries only.
 *
 * It returns, in HOST_TOOLS order, every id in `known` that is in `keep`, or that owns (host-tools.ts entryOwners) an
 * entry of `entries` that holds (entryHolds) while no owner of that entry is in `keep`; then `unknown`, in the order
 * given, without duplicates.
 *   - An agent stays recorded while the ledger holds install content it owns (D-29), so a per-agent uninstall that
 *     leaves an edited file keeps that agent, and the same per-agent command can finish the reversal later.
 *   - A shared entry keeps its owners only when none of them is kept already, so removing Codex CLI while Antigravity
 *     CLI stays drops Codex: the shared `.agents/skills/grugops/SKILL.md` is still Antigravity's (D-20).
 *   - An id outside `known` is never added, so a co-owner of a shared file that was never installed is not invented.
 *   - An entry no agent owns (the D-06 shared footprint: AGENTS.md, tools/grugops/, the legacy gemini entry) keeps no
 *     agent recorded (D-29).
 *   - Directory and backup entries, and records that claim nothing, never keep an agent: the same set that holds the
 *     marker (the marker rule).
 * Pure: no I/O, and ownership is never read from presence on disk (brief DC-2).
 */
export function agentsToRecord(run) {
    const holders = new Set();
    for (const e of run.entries) {
        if (!entryHolds(e))
            continue;
        const owners = entryOwners(e);
        if (owners.some((id) => run.keep.includes(id)))
            continue;
        for (const id of owners)
            holders.add(id);
    }
    const ids = HOST_TOOLS.filter((h) => run.known.includes(h.id) && (run.keep.includes(h.id) || holders.has(h.id))).map((h) => h.id);
    for (const id of run.unknown)
        if (!ids.includes(id))
            ids.push(id);
    return ids;
}
