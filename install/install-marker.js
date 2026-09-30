// install-marker.ts — the ONE reader of the install marker `.grugops/install.json` and of the six
// ledgers it carries (plan 33.1-21, CR-02 and WR-05; plan 33.1-28, Gap B; plan 33.1-29, CR-03; plan
// 33.1-30, Gap B completed; plan 33.1-33, the appended sentinel blocks).
//
// Cross-platform. ZERO npm dependencies: it imports only node:crypto (a hash, no I/O), node:path,
// ./user-file.ts and ./json-text.ts (no I/O; the strict tokenizer that refuses a duplicate key). A
// sibling of install.js and uninstall.js inside install/, imported by BOTH binaries, so both still
// run on a host with nothing installed. This module never writes and imports nothing from node:fs;
// install/installer-fs-census.test.ts scans it with the rest of install/ and asserts it makes no
// content read of its own.
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
// WHY ONE READER. The marker holds six ledgers the uninstaller depends on to reverse an install
// without deleting user content:
//   - `claudeAskRules` — the Claude Code ask rules install added to .claude/settings.json (D-18);
//   - `createdDirs`    — the directories install itself created under the target (CR-02);
//   - `geminiSettings` — what install did to .gemini/settings.json (plan 33.1-29, Gap B / re-review
//                        CR-03): created it, or appended "AGENTS.md" to its context.fileName, and the
//                        shape it found; see THE geminiSettings SHAPE below. Uninstall edits or deletes
//                        that file only as this record says.
//   - `createdFiles`   — the files install itself created under the target (plan 33.1-28, Gap B /
//                        re-review WR-05): the files ensureBlock creates to hold a sentinel block
//                        (CLAUDE.md, .github/copilot-instructions.md), the AGENTS.md install copies
//                        or links in, and the runnables it materializes under tools/grugops/, each
//                        with a content record of what install wrote there (red-team of plan
//                        33.1-28: see CONTENT RECORDS below). Uninstall deletes one of those files
//                        only when this ledger lists it AND the file still holds what it records.
//   - `kitFiles`       — what install wrote to each grugops skill and adapter file
//                        (.claude/skills/<name>/SKILL.md, .claude/agents/<file>.md; plan 33.1-30,
//                        Gap B completed): the same path → content record shape as createdFiles. A
//                        user's edit to a kit file is user content, so uninstall removes a kit file
//                        only while it still holds what this ledger records install wrote there.
//   - `appendedBlocks` — the sentinel block install appended to CLAUDE.md and to
//                        .github/copilot-instructions.md (plan 33.1-33, red-team carry items 4, 6 and
//                        11; red-team B1 of plan 33.1-33): path → { block, separator }, the sha256 of
//                        the block LINES install appended (`<open>\n<body>\n<close>\n`) and what the
//                        one newline it wrote before them did (see readAppendedBlocks). Uninstall
//                        removes a block only when this ledger records one for that file and the file
//                        holds exactly one copy of those lines; it removes those lines, and the newline
//                        before them only when the record and the bytes show it is install's, so every
//                        byte of the user's (a line inside the block, trailing blank lines, their final
//                        newline, a file that was only blank lines) survives. A block with no record (a
//                        repository with no marker, an install made before this ledger) is left.
// Each binary used to hold its own reader of the ask-rule ledger, and the two disagreed about a
// malformed one: install read it as "no previous install" and relabelled every grugops rule as the
// user's own (fail open), while uninstall refused (fail closed). That is WR-05. A second ledger
// with two readers would repeat the defect, so both binaries now read the marker and both ledgers
// here, as tri-states, and neither can read a malformed ledger as an empty one. The third and fourth
// ledgers follow the same rule, so each has one reader too.
//
// THE MARKER IS READ WITHOUT FOLLOWING A LINK (red-team of plan 33.1-27, B3, brief DC-2). The marker
// holds the ledgers uninstall deletes by, so it must be THIS target's own record. readUserFile follows
// a symbolic link, which is right for reading content and wrong here: a never-installed repository
// whose `.grugops` (or whose marker) was a link into another, installed repository had that other
// install's ledgers believed, and uninstall deleted the user's own `.claude/settings.json` and two
// directories on them. So the marker is asked through readForWrite(target, marker), which walks every
// component from the target down with lstat: a link at the marker or on the way to it, or a
// non-directory where `.grugops/` goes, makes the marker `unreadable`, with the reason in `why`.
//
// THE STATES.
//   readInstallMarker: `absent`     nothing is at the marker path (no install, or a removed one);
//                      `unreadable` something is there and it is not a readable regular file
//                                   within the bound (a FIFO, a directory, a symbolic link, a path
//                                   under a non-directory or under a link, ...), or it is not JSON,
//                                   or it is not a plain JSON object; `why` says which;
//                      `unbound`    install's marker shape (installMarkerProblems is empty) but not
//                                   bound to THIS directory: its `target` names another directory, or
//                                   it has no `target` (written before markers were bound; red-team B2
//                                   of plan 33.1-33). Not this directory's record: no ledger is read
//                                   from it;
//                      `ok`         install's own marker for this directory: a plain object whose
//                                   fields hold install's values and whose `target` is this
//                                   directory's real path (user-file.ts realTargetPath).
//                      A JSON object whose fields do not hold install's values is `unreadable` with
//                      `jsonObject` true (a user's file, a hand-made marker).
//   malformedLedgers:  the names of the ledgers in an `ok` marker that are present but malformed.
//                      A caller that would act on the marker as a whole (uninstall's removal of it)
//                      does so only when this is empty.
//   installMarkerProblems: the install-owned fields a JSON object lacks or holds with a value install
//                      never writes (plan 33.1-33, ownsMarker; values since red-team B2). Empty only for
//                      an object that carries install's own marker fields; readInstallMarker asks it.
//   readCreatedDirs / readCreatedFiles / readKitFiles / readAppendedBlocks / readAskRuleLedger /
//   readGeminiLedger:
//                      `absent`     the marker has no such field (an install made before the
//                                   ledger existed);
//                      `malformed`  the field is present but not the exact ledger shape;
//                      `ok`         the exact shape; the parsed value is returned.
// `raw` is always the field's value as found, so a caller that must leave a malformed ledger as it
// was can write it back verbatim.
//
// THE createdDirs, createdFiles AND kitFiles SHAPE (isLedgerPath, one rule for all three). createdDirs
// is an array of paths; createdFiles and kitFiles are each an object from path to content record, read
// by one reader (readPathRecords) so the two cannot disagree about what a well-formed record is. Each
// path is relative to the target in POSIX form: non-empty, not starting with `/`, containing no `\` and
// no `:`, and every
// `/`-separated segment is non-empty and is neither `.` nor `..`. So no entry can name a path outside
// the target. The uninstaller only asks whether one of its own fixed candidate paths is IN a ledger;
// it never iterates a ledger to decide what to delete, and it never removes recursively.
//
// THE geminiSettings SHAPE (readGeminiLedger, plan 33.1-29). A plain JSON object with exactly these
// keys and no others:
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
//                             the file's fileName is still exactly that (red-team of plan 33.1-28: never
//                             carry a ledger entry forward by presence), and uninstall edits the file
//                             only while it is (red-team B1 of plan 33.1-29). Required, and never null
//                             when addedEntry is true;
//   fileContent      record   present exactly when createdFile is true: the content record of the
//                             bytes install wrote. Uninstall deletes the whole file only while it
//                             holds them (recordHolds).
// createdFile true also requires addedEntry true, createdContext true and fileNameBefore "absent"
// (install writes the file with the entry in it). Anything else is `malformed`.
//
// A RUN THAT READ NOTHING KEEPS THE RECORD (red-team B2 of plan 33.1-29). A re-install that could not
// read the file (a link, a hard link, a FIFO, mode 000, too large, not UTF-8, not JSON, a duplicate key
// on the path) has no evidence either way, so it writes the earlier record back verbatim and says so. A
// record that claims nothing is written only by a run that READ the file and found the record no
// longer holds ("reset"), or that found AGENTS.md already listed. The field is absent only in a marker
// written before this ledger existed (or by a re-install over one that changed nothing).
//
// Clear professional voice: this is a safety surface (installer reversal).
import { createHash } from "node:crypto";
import { join } from "node:path";
import { firstDuplicateKey, readJsonText } from "./json-text.js";
import { isOwnLink, kindAt, readForWrite, realTargetPath, wayTo } from "./user-file.js";
/** The marker's path relative to the target, in POSIX form: the one spelling both binaries use. */
export const MARKER_REL = ".grugops/install.json";
const NO_ENTRY_REASONS = ["already-listed", "refused", "reset", "reversed"];
/** Read `<target>/.grugops/install.json` without following a link (see the header). */
export function readInstallMarker(target) {
    const path = join(target, ...MARKER_REL.split("/"));
    const read = readForWrite(target, path);
    if (read.state === "create")
        return { state: "absent", marker: null };
    if (read.state === "blocked") {
        return {
            state: "unreadable",
            marker: null,
            why: read.at === path ? `it ${read.reason}` : `${read.at} ${read.reason}`,
            jsonObject: false,
        };
    }
    let parsed;
    try {
        parsed = JSON.parse(read.text);
    }
    catch {
        return { state: "unreadable", marker: null, why: "it is not valid JSON", jsonObject: false };
    }
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
        return { state: "unreadable", marker: null, why: "it is JSON but not a JSON object", jsonObject: false };
    }
    // A DUPLICATE KEY IS REFUSED, NOT RESOLVED (red-team RT3 of plan 33.1-30). JSON.parse keeps the last
    // of two equal keys and says nothing, so `"kitFiles": {}, "kitFiles": {...}` read as the second
    // record, and a duplicate path inside a ledger read as its last record. Install writes the marker
    // with JSON.stringify, which never repeats a key, so a duplicate is a hand edit and which value is
    // the record is not known. Refusing only the ledger that holds it would not hold: every writer of
    // the marker (install's writeMarker, uninstall's kept-marker rewrite) re-serialises the parsed value,
    // which drops the duplicate and turns the ledger well-formed for the next run. So the whole marker
    // is `unreadable` (fail closed): install leaves it unchanged and uninstall uses none of its ledgers.
    // The strict tokenizer (json-text.ts) also refuses bytes that are not UTF-8 and nesting past its
    // bound, which JSON.parse of the decoded text would have accepted.
    const doc = readJsonText(read.bytes);
    if (!doc.ok)
        return { state: "unreadable", marker: null, why: `it ${doc.why}`, jsonObject: false };
    const dup = firstDuplicateKey(doc.root);
    if (dup !== null) {
        return {
            state: "unreadable",
            marker: null,
            why: `it has a duplicate key (${JSON.stringify(dup).slice(0, 120)}), so which of its values is install's record is not known`,
            jsonObject: false,
        };
    }
    // INSTALL'S OWN MARKER, FOR THIS DIRECTORY (red-team B2 of plan 33.1-33, brief DC-2). A JSON object here
    // is used only when its fields hold install's values (installMarkerProblems) AND its `target` is this
    // directory's real path (markerBinding). Anything else is not this directory's record, however well
    // formed its ledgers are: a user's object, a hand-made marker, a `.grugops/` copied from another
    // installed repository, a marker written before markers were bound. This is the one place both
    // binaries learn whether a marker is install's own; every ledger reader is handed only an `ok` marker.
    const marker = parsed;
    const problems = installMarkerProblems(marker);
    if (problems.length > 0) {
        return {
            state: "unreadable",
            marker: null,
            why: `it does not read as a grugops install marker — ${problems.join(", ")}`,
            jsonObject: true,
        };
    }
    const here = realTargetPath(target);
    const binding = markerBinding(marker, here);
    if (binding !== null)
        return { state: "unbound", marker: null, why: binding, boundTo: typeof marker.target === "string" ? marker.target : null, here, object: marker };
    return { state: "ok", marker, bytes: read.bytes };
}
// markerBinding: null when `marker` (whose fields hold install's values) is bound to the directory whose
// real path is `here`; otherwise why it is not this directory's record.
function markerBinding(marker, here) {
    if (!Object.prototype.hasOwnProperty.call(marker, "target")) {
        return ("it was written before install bound its marker to a directory (it has no target), so which directory its " +
            "records describe is not known");
    }
    const boundTo = marker.target;
    if (here === null)
        return `the real path of this directory could not be read, so it cannot be shown to be ${boundTo}, where the marker was written`;
    if (boundTo !== here) {
        return `it was written for another directory (${boundTo}), not this one (${here}), so its records describe that directory`;
    }
    return null;
}
/** The one wording of a marker a caller cannot use: "could not be read …" or "is a JSON object but …". */
export function markerUnusableText(read) {
    return read.jsonObject
        ? `is a JSON object but could not be used as install's marker (${read.why})`
        : `could not be read as a JSON object (${read.why})`;
}
function fieldOf(marker, name) {
    if (marker === null || !Object.prototype.hasOwnProperty.call(marker, name))
        return { present: false, raw: undefined };
    return { present: true, raw: marker[name] };
}
// isLedgerPath: one createdDirs or createdFiles entry has the shape stated in the header. The same
// rule serves both ledgers, because a file path and a directory path under the target have the same
// shape.
export function isLedgerPath(entry) {
    if (typeof entry !== "string" || entry === "")
        return false;
    if (entry.startsWith("/") || entry.includes("\\") || entry.includes(":"))
        return false;
    return entry.split("/").every((seg) => seg !== "" && seg !== "." && seg !== "..");
}
export function readCreatedDirs(marker) {
    const { present, raw } = fieldOf(marker, "createdDirs");
    if (!present)
        return { state: "absent", dirs: [], raw };
    if (!Array.isArray(raw) || !raw.every(isLedgerPath))
        return { state: "malformed", dirs: [], raw };
    return { state: "ok", dirs: [...new Set(raw)].sort(), raw };
}
// readCreatedFiles (plan 33.1-28; red-team R1): the `createdFiles` ledger. A plain JSON object whose
// every key has the isLedgerPath shape and whose every value is a content record (isContentRecord).
// Anything else, the plan-28 array of bare paths included, is `malformed`: a path with no record of
// what install wrote there proves nothing about what is there now.
export function readCreatedFiles(marker) {
    return readPathRecords(marker, "createdFiles");
}
// readKitFiles (plan 33.1-30, Gap B completed, brief DC-2): the `kitFiles` ledger, what install wrote
// to each grugops skill and adapter file. The same shape and the same reader as createdFiles: a plain
// JSON object whose every key has the isLedgerPath shape and whose every value is a content record
// (`sha256:<64 lowercase hex>` for a copy or a rendered file, `link:<target>` for a --symlink install's
// link). Anything else is `malformed`, and uninstall then removes no kit file.
export function readKitFiles(marker) {
    return readPathRecords(marker, "kitFiles");
}
const isAppendedBlock = (v) => {
    if (v === null || typeof v !== "object" || Array.isArray(v))
        return false;
    const o = v;
    const keys = Object.keys(o).sort();
    return (keys.length === 2 &&
        keys[0] === "block" &&
        keys[1] === "separator" &&
        isSha256Record(o.block) &&
        (o.separator === "blank-line" || o.separator === "line-end"));
};
export function readAppendedBlocks(marker) {
    const { present, raw } = fieldOf(marker, "appendedBlocks");
    if (!present)
        return { state: "absent", blocks: new Map(), raw };
    if (raw === null || typeof raw !== "object" || Array.isArray(raw))
        return { state: "malformed", blocks: new Map(), raw };
    const entries = Object.entries(raw);
    if (!entries.every(([k, v]) => isLedgerPath(k) && isAppendedBlock(v)))
        return { state: "malformed", blocks: new Map(), raw };
    const sorted = entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return { state: "ok", blocks: new Map(sorted.map(([k, v]) => [k, { block: v.block, separator: v.separator }])), raw };
}
/** An appendedBlocks record as the marker holds it (key order fixed). */
export function appendedBlockJson(b) {
    return { block: b.block, separator: b.separator };
}
// readPathRecords: the one reader of a path → content record ledger (createdFiles, kitFiles).
function readPathRecords(marker, name) {
    const { present, raw } = fieldOf(marker, name);
    if (!present)
        return { state: "absent", files: new Map(), raw };
    if (raw === null || typeof raw !== "object" || Array.isArray(raw))
        return { state: "malformed", files: new Map(), raw };
    const entries = Object.entries(raw);
    if (!entries.every(([k, v]) => isLedgerPath(k) && isContentRecord(v)))
        return { state: "malformed", files: new Map(), raw };
    return { state: "ok", files: new Map(entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))), raw };
}
export function readAskRuleLedger(marker) {
    const { present, raw } = fieldOf(marker, "claudeAskRules");
    if (!present)
        return { state: "absent", ledger: null, raw };
    if (raw === null || typeof raw !== "object" || Array.isArray(raw))
        return { state: "malformed", ledger: null, raw };
    const r = raw;
    if (!Array.isArray(r.added) || !r.added.every((x) => typeof x === "string")) {
        return { state: "malformed", ledger: null, raw };
    }
    if (typeof r.createdFile !== "boolean" || typeof r.createdPermissions !== "boolean" || typeof r.createdAsk !== "boolean") {
        return { state: "malformed", ledger: null, raw };
    }
    // Red-team of plan 33.1-28 (R3): the ask array's content record is part of the shape. A ledger
    // without it (written before this field existed, never released) is malformed, so it fails closed.
    if (!Object.prototype.hasOwnProperty.call(r, "askContent") || (r.askContent !== null && !isSha256Record(r.askContent))) {
        return { state: "malformed", ledger: null, raw };
    }
    return {
        state: "ok",
        ledger: {
            added: [...r.added].sort(),
            createdFile: r.createdFile,
            createdPermissions: r.createdPermissions,
            createdAsk: r.createdAsk,
            askContent: r.askContent,
        },
        raw,
    };
}
// readGeminiLedger (plan 33.1-29, Gap B / re-review CR-03): the `geminiSettings` ledger, exactly the
// shape the header states. The key set is checked first, so a record with an extra key, or with a
// conditional key where it does not belong, is malformed; a partial record never reads as a smaller
// claim.
export function readGeminiLedger(marker) {
    const { present, raw } = fieldOf(marker, "geminiSettings");
    if (!present)
        return { state: "absent", ledger: null, raw };
    const bad = { state: "malformed", ledger: null, raw };
    if (raw === null || typeof raw !== "object" || Array.isArray(raw))
        return bad;
    const r = raw;
    if (typeof r.createdFile !== "boolean" || typeof r.addedEntry !== "boolean")
        return bad;
    const want = ["createdFile", "addedEntry", "fileNameContent"];
    if (r.addedEntry)
        want.push("createdContext", "fileNameBefore");
    else
        want.push("noEntryReason");
    if (r.createdFile)
        want.push("fileContent");
    const keys = Object.keys(r);
    if (keys.length !== want.length || !want.every((k) => Object.prototype.hasOwnProperty.call(r, k)))
        return bad;
    if (r.fileNameContent !== null && !isSha256Record(r.fileNameContent))
        return bad;
    if (r.addedEntry) {
        if (typeof r.createdContext !== "boolean")
            return bad;
        if (r.fileNameBefore !== "absent" && r.fileNameBefore !== "string" && r.fileNameBefore !== "array")
            return bad;
        if (r.fileNameContent === null)
            return bad;
    }
    else if (typeof r.noEntryReason !== "string" || !NO_ENTRY_REASONS.includes(r.noEntryReason)) {
        return bad;
    }
    if (r.createdFile) {
        if (!r.addedEntry || r.createdContext !== true || r.fileNameBefore !== "absent")
            return bad;
        if (!isSha256Record(r.fileContent))
            return bad;
    }
    const ledger = { createdFile: r.createdFile, addedEntry: r.addedEntry, fileNameContent: r.fileNameContent };
    if (r.addedEntry) {
        ledger.createdContext = r.createdContext;
        ledger.fileNameBefore = r.fileNameBefore;
    }
    else {
        ledger.noEntryReason = r.noEntryReason;
    }
    if (r.createdFile)
        ledger.fileContent = r.fileContent;
    return { state: "ok", ledger, raw };
}
/**
 * The geminiSettings record in the order install writes its keys (the header's order), so a record
 * carried forward and a record written new serialize the same way.
 */
export function geminiLedgerJson(l) {
    const out = { createdFile: l.createdFile, addedEntry: l.addedEntry };
    if (l.addedEntry) {
        out.createdContext = l.createdContext;
        out.fileNameBefore = l.fileNameBefore;
    }
    else {
        out.noEntryReason = l.noEntryReason;
    }
    out.fileNameContent = l.fileNameContent;
    if (l.createdFile)
        out.fileContent = l.fileContent;
    return out;
}
// ── CONTENT RECORDS (red-team of plan 33.1-28, brief DC-2) ────────────────────────────────────
// A ledger that names a path records a claim about that path at the moment install wrote it, not
// about whatever is there later: a user can delete the file and make their own at the same name, or
// edit it. So every record of a file install wrote also carries WHAT install wrote there, in one
// grammar, and both binaries ask one predicate whether the path still holds it:
//   `sha256:<64 lowercase hex>`  the sha256 of the bytes install wrote (a copy, a created file);
//   `link:<target>`              the link install made, by its exact readlink target.
// recordHolds(root, path, record) is the one question. A `sha256:` record holds only for a regular
// file inside `root`, read without following a link on the way or at the path (readForWrite, so a
// FIFO, a directory or a device is never opened, brief DC-3), whose bytes hash to the record. A
// `link:` record holds only for a symbolic link at the path, with nothing but real directories on the
// way, whose readlink equals the target (isOwnLink). Anything else does not hold. kitFiles (plan
// 33.1-30) uses the same grammar and the same predicate.
const SHA256_RECORD = /^sha256:[0-9a-f]{64}$/;
const LINK_RECORD = /^link:[^\u0000-\u001f\u007f]+$/;
const isSha256Record = (v) => typeof v === "string" && SHA256_RECORD.test(v);
/** The record of `bytes` install wrote: `sha256:<hex>`. A string is hashed as its UTF-8 bytes. */
export function contentRecord(bytes) {
    return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}
/**
 * The record of a JSON value as a file holds it: contentRecord of JSON.stringify(value), or null for
 * no value (undefined). THE ONE SERIALISATION for geminiSettings.fileNameContent and
 * claudeAskRules.askContent: install writes the record with it and both install (the carry) and
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
/** One value has the content-record grammar above. */
export function isContentRecord(v) {
    return typeof v === "string" && (SHA256_RECORD.test(v) || LINK_RECORD.test(v));
}
/** The one wording of a hard link that is not proof of what install wrote. */
export function hardLinkReason(names) {
    return (`it is a hard link (the same file has ${names} names, and another may be outside the target), so what it ` +
        `holds is not proof of what install wrote at this path`);
}
export function readOwnedContent(root, path) {
    const r = readForWrite(root, path);
    if (r.state === "ok")
        return { state: "ok", bytes: r.bytes };
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
        return wayTo(root, path) === null && isOwnLink(path, record.slice("link:".length)) ? { holds: true } : { holds: false, why: null };
    }
    const c = readOwnedContent(root, path);
    if (c.state !== "ok")
        return { holds: false, why: c.why };
    return contentRecord(c.bytes) === record ? { holds: true } : { holds: false, why: null };
}
/** `path` (strictly inside `root`) still holds exactly what `record` says install wrote there. */
export function recordHolds(root, path, record) {
    return checkRecord(root, path, record).holds;
}
// malformedLedgers (red-team of plan 33.1-27, B4): every ledger field the marker carries that is
// present but malformed, by the same readers every caller already trusts. uninstall removes the
// marker only when the marker is `ok` and this is empty: a marker holding a ledger it could not read
// is a record the human still needs, not a file to delete. A plan that adds a ledger to the marker
// adds its reader here, so the marker is never removed over a ledger nobody could read.
export function malformedLedgers(marker) {
    const out = [];
    if (readCreatedDirs(marker).state === "malformed")
        out.push("createdDirs");
    if (readCreatedFiles(marker).state === "malformed")
        out.push("createdFiles");
    if (readAskRuleLedger(marker).state === "malformed")
        out.push("claudeAskRules");
    if (readGeminiLedger(marker).state === "malformed")
        out.push("geminiSettings");
    if (readKitFiles(marker).state === "malformed")
        out.push("kitFiles");
    if (readAppendedBlocks(marker).state === "malformed")
        out.push("appendedBlocks");
    return out;
}
// installMarkerProblems (plan 33.1-33, brief DC-2, ownsMarker): the reasons a parsed JSON object is
// not install's own marker, empty when it is. install's writeMarker always writes `grugopsHome`,
// `kitRoot` and `installMode` as strings, and writes `kitVersion` as a string or, since plan 33.1-32's
// red-team B2, not at all (a run that wrote no kit file and had no earlier version to keep). A JSON
// object the user put at `.grugops/install.json` does not carry these fields, and reading it as install's
// marker would make it an install made before every ledger: uninstall deleted it by its name, and the
// kit-file fallback removed the verbatim skills. So readInstallMarker asks this before it answers `ok`
// (for both binaries); a marker with a problem is not install's, and nothing is done on it.
//
// VALUES, NOT ONLY TYPES (red-team B2 of plan 33.1-33). Strings were enough before, so empty strings and
// an installMode of "banana" passed. install writes grugopsHome and kitRoot as absolute paths
// (toPosix(resolve(...))), installMode as "copy" or "symlink" (install.ts refuses any other INSTALL_MODE
// as bad usage), and `target` as this directory's real path. A field holding anything else is not
// install's value, and the marker is not install's. `target` may be absent here (a marker written before
// the binding existed); markerBinding then says the marker is not bound.
const isAbsoluteMarkerPath = (v) => typeof v === "string" && v.trim() === v && v !== "" && (v.startsWith("/") || /^[A-Za-z]:[\\/]/.test(v));
export function installMarkerProblems(marker) {
    const out = [];
    const has = (k) => Object.prototype.hasOwnProperty.call(marker, k);
    for (const k of ["grugopsHome", "kitRoot"]) {
        if (!has(k))
            out.push(`no ${k}`);
        else if (typeof marker[k] !== "string")
            out.push(`${k} is not a string`);
        else if (!isAbsoluteMarkerPath(marker[k]))
            out.push(`${k} is not an absolute path`);
    }
    if (!has("installMode"))
        out.push("no installMode");
    else if (marker.installMode !== "copy" && marker.installMode !== "symlink")
        out.push("installMode is neither copy nor symlink");
    if (has("kitVersion") && typeof marker.kitVersion !== "string")
        out.push("kitVersion is not a string");
    if (has("target") && !isAbsoluteMarkerPath(marker.target))
        out.push("target is not an absolute path");
    return out;
}
