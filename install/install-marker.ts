// install-marker.ts — ONE marker, ONE ledger, ONE reader, ONE authority (plan 33.1-36, D-33 (b), brief
// 33.1-GAP-PLANNING-BRIEF.md §2.2). The marker `.grugops/install.json` is read here and nowhere else; the
// install ledger it carries is read here (readLedger) and written through the one serializer here
// (ledgerJson); and whether install owns a path is answered here (owns).
//
// Cross-platform. ZERO npm dependencies: it imports only node:crypto (a hash, no I/O), node:path,
// ./user-file.ts and ./json-text.ts (no I/O; the strict tokenizer that refuses a duplicate key). A
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
//   backup     origin, of, content       install made this backup (plan 33.1-37): `origin` says what it
//                                        was made from (BACKUP_ORIGINS), `of` the path it was made of,
//                                        and `content` its file, link or tree record as install left it
//                                        (user-file.ts treeRecord), or null when it could not be read in
//                                        full (never proven unchanged);
//   kit        (none)                    install wrote the kit at the kit root (KIT_ENTRY_PATH). Only in
//                                        the kit-home record; see THE KIT-HOME RECORD below.
// Which kinds a ledger may hold depends on the record it is read from (KINDS_BY_SCOPE): a target's
// marker holds dir, file, block, gemini, ask-rules and backup; the kit-home record holds backup and kit.
// Two entries with the same (path, kind) are refused: which one is install's record is not known. One
// path can hold entries of two kinds (CLAUDE.md: the file install created, and the block it appended).
//
// THE STATES.
//   readInstallMarker: `absent`     nothing is at the marker path (no install, or a removed one);
//                      `unreadable` something is there and it is not a readable regular file
//                                   within the bound (a FIFO, a directory, a symbolic link, a path
//                                   under a non-directory or under a link, ...), or it is not JSON,
//                                   or it is not a plain JSON object; `why` says which. A JSON object
//                                   whose fields do not hold install's values (a user's file, a
//                                   hand-made marker), or one that carries `ledger` next to a retired
//                                   record, is `unreadable` with `jsonObject` true;
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
// mode for a file, the exact readlink for a link, no link followed on the way, a hard link refused). For
// a dir, block, gemini or ask-rules entry it returns the entry, and the caller compares that entry's
// own content record (the directory's emptiness and this run's removals, the block hash,
// fileNameContent, askContent) with the file before it edits anything, as each pass did before the
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
import { firstDuplicateKey, readJsonText } from "./json-text.js";
import { isOwnLink, kindAt, readForWrite, realTargetPath, treeRecord, wayTo } from "./user-file.js";

/** The marker's path relative to the target, in POSIX form: the one spelling both binaries use. */
export const MARKER_REL = ".grugops/install.json";

/** The marker field that holds the one install ledger (D-33 (b)). */
export const LEDGER_FIELD = "ledger";

/**
 * The six records the one ledger replaced (D-33 (b)). Install never writes them and no code in either
 * binary reads them: a marker that has them and no `ledger` is `unbound` by `no-ledger`, and a marker
 * that has them next to `ledger` is `unreadable`.
 */
export const RETIRED_RECORDS = ["createdDirs", "createdFiles", "geminiSettings", "kitFiles", "claudeAskRules", "appendedBlocks"] as const;

/** Why an `unbound` marker is not this directory's record. */
export type UnboundBy = "other-directory" | "no-target" | "no-ledger";

// `jsonObject` on `unreadable` is true when the file IS a JSON object, but not install's marker (its
// fields do not hold install's values; installMarkerProblems says which; or it carries `ledger` next to
// a retired record), so a caller can say that rather than "could not be read". `unbound` is install's
// marker shape that is not this directory's record (`unboundBy` says why): `object` is the parsed file,
// for reporting its kit fields only (the doctor); no record is ever read from it. `here` is this
// directory's real path, or null when it could not be resolved.
export type InstallMarkerRead =
  | { readonly state: "absent"; readonly marker: null }
  | { readonly state: "unreadable"; readonly marker: null; readonly why: string; readonly jsonObject: boolean }
  | {
      readonly state: "unbound";
      readonly marker: null;
      readonly why: string;
      readonly unboundBy: UnboundBy;
      readonly boundTo: string | null;
      readonly here: string | null;
      readonly object: Readonly<Record<string, unknown>>;
    }
  | { readonly state: "ok"; readonly marker: Readonly<Record<string, unknown>>; readonly bytes: Buffer };

export type LedgerState = "absent" | "malformed" | "ok";

// AskRuleLedger (D-18): the fields of an `ask-rules` entry, what install added to the target's
// .claude/settings.json, so uninstall can remove exactly that and nothing else. `added` is sorted. Each
// created* flag records that install created the file, the `permissions` object or the `ask` array, so
// uninstall removes a container only when install created it and it is empty again. `askContent`
// (red-team of plan 33.1-28, R3) is the content record (contentRecord) of the `permissions.ask` array
// exactly as install last left it, or null when the file held no such array: the next install carries
// the claims and the flags forward only while the array is still that one (see install.ts
// writeAskRules).
//
// `fileMode` (red-team L1 of plan 33.1-34) is present only with createdFile true: the permission bits,
// four octal digits, the settings file had once install created it. Uninstall deletes a file install
// created only while its mode is still that one; an entry without this field compares the text only
// and says so.
export interface AskRuleLedger {
  added: string[];
  createdFile: boolean;
  createdPermissions: boolean;
  createdAsk: boolean;
  askContent: string | null;
  fileMode?: string;
}

// GeminiLedger (plan 33.1-29): the fields of a `gemini` entry. See THE gemini ENTRY in the header.
export type FileNameBefore = "absent" | "string" | "array";
export type NoEntryReason = "already-listed" | "refused" | "reset" | "reversed";
const NO_ENTRY_REASONS: readonly string[] = ["already-listed", "refused", "reset", "reversed"];
export interface GeminiLedger {
  createdFile: boolean;
  addedEntry: boolean;
  createdContext?: boolean;
  fileNameBefore?: FileNameBefore;
  noEntryReason?: NoEntryReason;
  fileNameContent: string | null;
  fileContent?: string;
}

/** Read `<target>/.grugops/install.json` without following a link (see the header). */
export function readInstallMarker(target: string): InstallMarkerRead {
  const path = join(target, ...MARKER_REL.split("/"));
  const read = readForWrite(target, path);
  if (read.state === "create") return { state: "absent", marker: null };
  if (read.state === "blocked") {
    return {
      state: "unreadable",
      marker: null,
      why: read.at === path ? `it ${read.reason}` : `${read.at} ${read.reason}`,
      jsonObject: false,
    };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(read.text);
  } catch {
    return { state: "unreadable", marker: null, why: "it is not valid JSON", jsonObject: false };
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { state: "unreadable", marker: null, why: "it is JSON but not a JSON object", jsonObject: false };
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
  if (!doc.ok) return { state: "unreadable", marker: null, why: `it ${doc.why}`, jsonObject: false };
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
  // is used only when its fields hold install's values (installMarkerProblems), it does not mix the one
  // ledger with a retired record, its `target` is this directory's real path (markerBinding), and it
  // carries the one ledger. Anything else is not this directory's record, however well formed: a user's
  // object, a hand-made marker, a `.grugops/` copied from another installed repository, a marker written
  // before markers were bound or before the one ledger. This is the one place both binaries learn whether
  // a marker is install's own; readLedger is handed only an `ok` marker.
  const marker = parsed as Record<string, unknown>;
  const has = (k: string): boolean => Object.prototype.hasOwnProperty.call(marker, k);
  const problems = installMarkerProblems(marker);
  if (problems.length > 0) {
    return {
      state: "unreadable",
      marker: null,
      why: `it does not read as a grugops install marker — ${problems.join(", ")}`,
      jsonObject: true,
    };
  }
  const retired = RETIRED_RECORDS.filter(has);
  if (has(LEDGER_FIELD) && retired.length > 0) {
    return {
      state: "unreadable",
      marker: null,
      why: `it carries both the one ledger and a retired record (${retired.join(", ")}), which install never writes`,
      jsonObject: true,
    };
  }
  const here = realTargetPath(target);
  const binding = markerBinding(marker, here);
  const boundTo = typeof marker.target === "string" ? marker.target : null;
  if (binding !== null) return { state: "unbound", marker: null, why: binding.why, unboundBy: binding.by, boundTo, here, object: marker };
  if (!has(LEDGER_FIELD)) {
    const why =
      retired.length > 0
        ? `it has no install ledger: it was written by an earlier build of this release, before the one ledger, and ` +
          `holds the retired records ${retired.join(", ")}, which this build does not read`
        : "it has no install ledger, so it holds no record of what install did here";
    return { state: "unbound", marker: null, why, unboundBy: "no-ledger", boundTo, here, object: marker };
  }
  return { state: "ok", marker, bytes: read.bytes };
}

// markerBinding: null when `marker` (whose fields hold install's values) is bound to the directory whose
// real path is `here`; otherwise why it is not this directory's record, and which way.
function markerBinding(marker: Readonly<Record<string, unknown>>, here: string | null): { why: string; by: UnboundBy } | null {
  if (!Object.prototype.hasOwnProperty.call(marker, "target")) {
    return {
      by: "no-target",
      why:
        "it was written before install bound its marker to a directory (it has no target), so which directory its " +
        "records describe is not known",
    };
  }
  const boundTo = marker.target as string;
  if (here === null) {
    return { by: "other-directory", why: `the real path of this directory could not be read, so it cannot be shown to be ${boundTo}, where the marker was written` };
  }
  if (boundTo !== here) {
    return { by: "other-directory", why: `it was written for another directory (${boundTo}), not this one (${here}), so its records describe that directory` };
  }
  return null;
}

/** The one wording of a marker a caller cannot use: "could not be read …" or "is a JSON object but …". */
export function markerUnusableText(read: { readonly why: string; readonly jsonObject: boolean }): string {
  return read.jsonObject
    ? `is a JSON object but could not be used as install's marker (${read.why})`
    : `could not be read as a JSON object (${read.why})`;
}

// isLedgerPath: the `path` of one ledger entry has the shape stated in the header. The same rule serves
// every kind, because a file path and a directory path under the target have the same shape: relative
// to the target in POSIX form, non-empty, not starting with `/`, containing no `\` and no `:`, and every
// `/`-separated segment non-empty and neither `.` nor `..`. So no entry can name a path outside the
// target.
export function isLedgerPath(entry: unknown): entry is string {
  if (typeof entry !== "string" || entry === "") return false;
  if (entry.startsWith("/") || entry.includes("\\") || entry.includes(":")) return false;
  return entry.split("/").every((seg) => seg !== "" && seg !== "." && seg !== "..");
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
// way, whose readlink equals the target (isOwnLink). Anything else does not hold. Every `file` entry of the
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
const isSha256Record = (v: unknown): v is string => typeof v === "string" && SHA256_RECORD.test(v);
const isFileRecord = (v: unknown): v is string => typeof v === "string" && FILE_RECORD.test(v);

/** The record of `bytes` install wrote: `sha256:<hex>`. A string is hashed as its UTF-8 bytes. */
export function contentRecord(bytes: Buffer | string): string {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

/** A file mode as a record writes it: the permission bits in four octal digits. */
export const modeText = (mode: number): string => (mode & 0o7777).toString(8).padStart(4, "0");

/**
 * The record of a FILE install wrote: `sha256:<hex>;mode=<octal>` (see THE FILE MODE above). `mode` is the
 * file's st_mode as it stood once install wrote it; only the permission bits are kept.
 */
export function fileRecord(bytes: Buffer | string, mode: number): string {
  return `${contentRecord(bytes)};mode=${modeText(mode)}`;
}

/**
 * THE ONE COMPARISON of a file's bytes and mode with a `sha256:` file record (checkRecord and uninstall's
 * sentinel-file check both ask it). `mode` null means the caller has no mode for the file; a record that
 * carries one then does not hold.
 */
export function recordMatches(record: string, bytes: Buffer, mode: number | null): RecordCheck {
  const at = record.indexOf(";mode=");
  const content = at === -1 ? record : record.slice(0, at);
  if (contentRecord(bytes) !== content) return { holds: false, why: null };
  if (at === -1) return { holds: true, modeChecked: false };
  const want = record.slice(at + ";mode=".length);
  if (mode === null) return { holds: false, why: "its file mode could not be read, so it could not be compared with the mode install wrote" };
  if (modeText(mode) !== want) {
    return { holds: false, why: null, modeChanged: `its file mode is ${modeText(mode)}, not the ${want} install wrote` };
  }
  return { holds: true, modeChecked: true };
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
export function jsonValueRecord(value: unknown): string | null {
  return value === undefined ? null : contentRecord(JSON.stringify(value));
}

/** The record of a symbolic link install made to `target`: `link:<target>`. */
export function linkRecord(target: string): string {
  return `link:${target}`;
}

/** One value has the file-record grammar above (a file record, with or without its mode, or a link record). */
export function isContentRecord(v: unknown): v is string {
  return typeof v === "string" && (FILE_RECORD.test(v) || LINK_RECORD.test(v));
}

/** A `backup` entry's content: a file, link or tree record (plan 33.1-37). null is checked by the caller. */
const isBackupContent = (v: unknown): v is string => isContentRecord(v) || (typeof v === "string" && TREE_RECORD.test(v));

// THE ONE CONTENT-OWNERSHIP READ (red-team RT2 of plan 33.1-30). Whether a file under the target still
// holds what install wrote there is asked of its bytes read through readForWrite: a regular file inside
// the target, no link followed on the way or at the path, and not a hard link. A hard link is refused on
// every arm that asks (a `file` entry of the ledger): a file that has another name, which may be outside the target, shows
// nothing about what install wrote at THIS path. A comparison through readUserFile, which reads a hard
// link, once removed a hard-linked kit file that the recorded arm left, and the recorded arm said "it
// has changed since install wrote it", which was not true. `why` is the true
// reason a file was not read, as a clause the caller places in its line; it is null for a symbolic
// link at the path, where install wrote a regular file: the path no longer holds what install wrote.
export type OwnedContent =
  | { readonly state: "ok"; readonly bytes: Buffer; readonly mode: number }
  | { readonly state: "not-read"; readonly why: string | null };

/** The one wording of a hard link that is not proof of what install wrote. */
export function hardLinkReason(names: number): string {
  return (
    `it is a hard link (the same file has ${names} names, and another may be outside the target), so what it ` +
    `holds is not proof of what install wrote at this path`
  );
}

export function readOwnedContent(root: string, path: string): OwnedContent {
  const r = readForWrite(root, path);
  if (r.state === "ok") return { state: "ok", bytes: r.bytes, mode: r.mode };
  if (r.state === "create") return { state: "not-read", why: "it is no longer there" };
  if (r.names !== undefined) return { state: "not-read", why: hardLinkReason(r.names) };
  if (r.at === path && kindAt(path) === "symbolic link") return { state: "not-read", why: null };
  const where = r.at === path ? "it" : r.at;
  return { state: "not-read", why: `${where} ${r.reason}, so it could not be compared with what install wrote there` };
}


/**
 * Whether `path` (strictly inside `root`) still holds exactly what `record` says install wrote there.
 * `why` is null when it simply does not (other bytes, another link, a link where a file was written),
 * and otherwise the true reason it could not be shown to (readOwnedContent).
 */
// `modeChecked` (red-team L1 of plan 33.1-34) is false when the record has no mode, so only the bytes were
// compared (a link record has no mode to check and reports true). `modeChanged` is set when the bytes are
// install's and only the file mode differs, and says how.
export type RecordCheck =
  | { readonly holds: true; readonly modeChecked: boolean }
  | { readonly holds: false; readonly why: string | null; readonly modeChanged?: string };

export function checkRecord(root: string, path: string, record: string): RecordCheck {
  if (record.startsWith("link:")) {
    return wayTo(root, path) === null && isOwnLink(path, record.slice("link:".length))
      ? { holds: true, modeChecked: true }
      : { holds: false, why: null };
  }
  const c = readOwnedContent(root, path);
  if (c.state !== "ok") return { holds: false, why: c.why };
  return recordMatches(record, c.bytes, c.mode);
}

/** `path` (strictly inside `root`) still holds exactly what `record` says install wrote there. */
export function recordHolds(root: string, path: string, record: string): boolean {
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
export const LEDGER_KINDS = ["dir", "file", "block", "gemini", "ask-rules", "backup", "kit"] as const;
export type LedgerKind = (typeof LEDGER_KINDS)[number];

/**
 * Which record a ledger is read from, and so which kinds it may hold (plan 33.1-37). `target` is the
 * install ledger in a target's `.grugops/install.json`; `kit-home` is the record install keeps in the kit
 * home (`<GRUGOPS_HOME>/.grugops-kit.json`). A kind outside its scope makes the ledger malformed.
 */
export type LedgerScope = "target" | "kit-home";
export const KINDS_BY_SCOPE: Readonly<Record<LedgerScope, readonly LedgerKind[]>> = {
  target: ["dir", "file", "block", "gemini", "ask-rules", "backup"],
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
export const BACKUP_ORIGINS = ["in-repo-kit", "legacy-config", "handoffs", "edited-kit-file", "kit-home"] as const;
export type BackupOrigin = (typeof BACKUP_ORIGINS)[number];

/** The one path a `gemini` entry may name, and the one path an `ask-rules` entry may name. */
export const GEMINI_SETTINGS_REL = ".gemini/settings.json";
export const ASK_RULES_REL = ".claude/settings.json";
/**
 * THE ONE TEXT install writes when it creates `.gemini/settings.json` (plan 33.1-39, review WR-03): the
 * whole `context.fileName` list, AGENTS.md and GEMINI.md, and nothing else. install.ts writes it and
 * uninstall.ts compares with it (the emptied shape it deletes), so the two binaries cannot disagree about
 * what install wrote, the way checkpoint-ask-rules.ts createdSettingsText serves `.claude/settings.json`.
 */
export const GEMINI_CREATED_FILE_NAME: readonly string[] = ["AGENTS.md", "GEMINI.md"];
export function createdGeminiText(): string {
  return JSON.stringify({ context: { fileName: [...GEMINI_CREATED_FILE_NAME] } }, null, 2) + "\n";
}
/** The only paths a `block` entry may name: the two pointer files install appends its block to. */
export const BLOCK_RELS: readonly string[] = ["CLAUDE.md", ".github/copilot-instructions.md"];

export type BlockSeparator = "blank-line" | "line-end";
export interface AppendedBlock {
  readonly block: string;
  readonly separator: BlockSeparator;
}

export interface DirEntry {
  readonly path: string;
  readonly kind: "dir";
}
export interface FileEntry {
  readonly path: string;
  readonly kind: "file";
  /** The content record (isContentRecord) of what install wrote at the path. */
  readonly content: string;
  /** True for a grugops skill or adapter file, which D-32 governs. */
  readonly kit: boolean;
}
export interface BlockEntry extends AppendedBlock {
  readonly path: string;
  readonly kind: "block";
}
export type GeminiEntry = GeminiLedger & { readonly path: string; readonly kind: "gemini" };
export type AskRulesEntry = AskRuleLedger & { readonly path: string; readonly kind: "ask-rules" };
/** A backup install made (plan 33.1-37): where from (`origin`), of which path (`of`), and what it held. */
export interface BackupEntry {
  readonly path: string;
  readonly kind: "backup";
  readonly origin: BackupOrigin;
  /** The ledger path the backup was made of (in the same root). */
  readonly of: string;
  /** The file, link or tree record of the backup as install left it, or null (never proven unchanged). */
  readonly content: string | null;
}
/** The kit install wrote at the kit root (kit-home record only, path KIT_ENTRY_PATH; plan 33.1-37). */
export interface KitRootEntry {
  readonly path: string;
  readonly kind: "kit";
}
export type LedgerEntry = DirEntry | FileEntry | BlockEntry | GeminiEntry | AskRulesEntry | BackupEntry | KitRootEntry;
export type EntryOf<K extends LedgerKind> = Extract<LedgerEntry, { readonly kind: K }>;

export interface LedgerRead {
  readonly state: LedgerState;
  /** The entries when `ok`, in ledgerJson's order; empty otherwise. */
  readonly entries: readonly LedgerEntry[];
  /** Why a `malformed` ledger is malformed (the entry index and the reason); null otherwise. */
  readonly why: string | null;
  /** The field's value as found. */
  readonly raw: unknown;
}

const isPlainObject = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v);
const hasOwn = (o: object, k: string): boolean => Object.prototype.hasOwnProperty.call(o, k);

// keyProblem: the reason `o`'s key set is not exactly `want` (missing or extra), or null.
function keyProblem(o: Record<string, unknown>, want: readonly string[]): string | null {
  const missing = want.filter((k) => !hasOwn(o, k));
  if (missing.length > 0) return `it lacks ${missing.join(", ")}`;
  const extra = Object.keys(o).filter((k) => !want.includes(k));
  if (extra.length > 0) return `it has a key no entry of its kind has (${extra.map((k) => JSON.stringify(k).slice(0, 60)).join(", ")})`;
  return null;
}

// geminiProblem: the reason the fields of a `gemini` entry break THE gemini ENTRY rules, or null. The key
// set is checked first, so an entry with a conditional key where it does not belong is malformed; a
// partial record never reads as a smaller claim.
function geminiProblem(r: Record<string, unknown>): string | null {
  if (typeof r.createdFile !== "boolean" || typeof r.addedEntry !== "boolean") return "createdFile and addedEntry must be booleans";
  const want = ["path", "kind", "createdFile", "addedEntry", "fileNameContent"];
  if (r.addedEntry) want.push("createdContext", "fileNameBefore");
  else want.push("noEntryReason");
  if (r.createdFile) want.push("fileContent");
  const keys = keyProblem(r, want);
  if (keys !== null) return keys;
  if (r.fileNameContent !== null && !isSha256Record(r.fileNameContent)) return "fileNameContent is neither null nor a sha256 record";
  if (r.addedEntry) {
    if (typeof r.createdContext !== "boolean") return "createdContext is not a boolean";
    if (r.fileNameBefore !== "absent" && r.fileNameBefore !== "string" && r.fileNameBefore !== "array") return "fileNameBefore is not absent, string or array";
    if (r.fileNameContent === null) return "fileNameContent is null although addedEntry is true";
  } else if (typeof r.noEntryReason !== "string" || !NO_ENTRY_REASONS.includes(r.noEntryReason)) {
    return "noEntryReason is not one of already-listed, refused, reset, reversed";
  }
  if (r.createdFile) {
    if (!r.addedEntry || r.createdContext !== true || r.fileNameBefore !== "absent") {
      return "createdFile true needs addedEntry true, createdContext true and fileNameBefore absent";
    }
    if (!isFileRecord(r.fileContent)) return "fileContent is not a file record";
  }
  return null;
}

// askProblem: the reason the fields of an `ask-rules` entry break the AskRuleLedger rules, or null.
function askProblem(r: Record<string, unknown>): string | null {
  const want = ["path", "kind", "added", "createdFile", "createdPermissions", "createdAsk", "askContent"];
  if (hasOwn(r, "fileMode")) want.push("fileMode");
  const keys = keyProblem(r, want);
  if (keys !== null) return keys;
  if (!Array.isArray(r.added) || !r.added.every((x) => typeof x === "string")) return "added is not a list of strings";
  if (typeof r.createdFile !== "boolean" || typeof r.createdPermissions !== "boolean" || typeof r.createdAsk !== "boolean") {
    return "createdFile, createdPermissions and createdAsk must be booleans";
  }
  // Red-team of plan 33.1-28 (R3): the ask array's content record is part of the shape.
  if (r.askContent !== null && !isSha256Record(r.askContent)) return "askContent is neither null nor a sha256 record";
  if (hasOwn(r, "fileMode") && (r.createdFile !== true || typeof r.fileMode !== "string" || !/^[0-7]{4}$/.test(r.fileMode))) {
    return "fileMode is not four octal digits on an entry whose createdFile is true";
  }
  return null;
}

// entryProblem: the reason one raw entry is not exactly its kind's shape, or null. The rules are the
// ones each retired record's reader applied, now asked of one entry. `scope` (plan 33.1-37) says which
// record the entry was read from; a kind or a backup origin outside it is refused.
function entryProblem(e: unknown, scope: LedgerScope): string | null {
  if (!isPlainObject(e)) return "it is not a JSON object";
  if (!isLedgerPath(e.path)) return `its path is not a relative POSIX path inside the ${scope === "target" ? "target" : "kit home"}`;
  if (typeof e.kind !== "string" || !(LEDGER_KINDS as readonly string[]).includes(e.kind)) {
    return `its kind is not one of ${LEDGER_KINDS.join(", ")}`;
  }
  if (!KINDS_BY_SCOPE[scope].includes(e.kind as LedgerKind)) {
    return `a ${e.kind} entry does not belong in the ${scope === "target" ? "target's install ledger" : "kit-home record"} (it holds only ${KINDS_BY_SCOPE[scope].join(" and ")} entries)`;
  }
  switch (e.kind as LedgerKind) {
    case "dir":
      return keyProblem(e, ["path", "kind"]);
    case "file": {
      const keys = keyProblem(e, ["path", "kind", "content", "kit"]);
      if (keys !== null) return keys;
      if (!isContentRecord(e.content)) return "its content is not a content record";
      if (typeof e.kit !== "boolean") return "its kit is not a boolean";
      return null;
    }
    case "block": {
      if (!BLOCK_RELS.includes(e.path as string)) return `a block entry may name only ${BLOCK_RELS.join(" or ")}`;
      const keys = keyProblem(e, ["path", "kind", "block", "separator"]);
      if (keys !== null) return keys;
      if (!isSha256Record(e.block)) return "its block is not a sha256 record";
      if (e.separator !== "blank-line" && e.separator !== "line-end") return "its separator is neither blank-line nor line-end";
      return null;
    }
    case "gemini":
      if (e.path !== GEMINI_SETTINGS_REL) return `a gemini entry may name only ${GEMINI_SETTINGS_REL}`;
      return geminiProblem(e);
    case "ask-rules":
      if (e.path !== ASK_RULES_REL) return `an ask-rules entry may name only ${ASK_RULES_REL}`;
      return askProblem(e);
    case "kit":
      if (e.path !== KIT_ENTRY_PATH) return `a kit entry may name only ${KIT_ENTRY_PATH}`;
      return keyProblem(e, ["path", "kind"]);
    case "backup": {
      const keys = keyProblem(e, ["path", "kind", "origin", "of", "content"]);
      if (keys !== null) return keys;
      if (typeof e.origin !== "string" || !(BACKUP_ORIGINS as readonly string[]).includes(e.origin)) {
        return `its origin is not one of ${BACKUP_ORIGINS.join(", ")}`;
      }
      if ((e.origin === "kit-home") !== (scope === "kit-home")) {
        return scope === "kit-home"
          ? `a backup in the kit-home record must have origin kit-home, not ${e.origin}`
          : "a backup with origin kit-home belongs in the kit-home record, not the target's install ledger";
      }
      if (!isLedgerPath(e.of)) return "its `of` is not a relative POSIX path";
      if (e.origin === "kit-home" && e.of !== KIT_ENTRY_PATH) return `a kit-home backup must be of ${KIT_ENTRY_PATH}`;
      // The one name copyKit gives a kit-home backup, so a record that names any other path in the kit home
      // (a forged or hand-edited entry) is malformed rather than a claim a later prune could act on.
      if (e.origin === "kit-home" && !KIT_HOME_BACKUP_NAME.test(e.path as string)) {
        return `a kit-home backup must be named ${KIT_ENTRY_PATH}.bak.<ISO>, the name install gives it`;
      }
      if (e.of === e.path) return "its `of` is its own path";
      if (e.content !== null && !isBackupContent(e.content)) return "its content is neither null nor a file, link or tree record";
      return null;
    }
  }
}

// normalize: the typed entry of a raw entry entryProblem accepted, holding only its kind's keys.
function normalize(e: Record<string, unknown>): LedgerEntry {
  const path = e.path as string;
  switch (e.kind as LedgerKind) {
    case "dir":
      return { path, kind: "dir" };
    case "file":
      return { path, kind: "file", content: e.content as string, kit: e.kit as boolean };
    case "block":
      return { path, kind: "block", block: e.block as string, separator: e.separator as BlockSeparator };
    case "gemini": {
      const g: GeminiEntry = { path, kind: "gemini", createdFile: e.createdFile as boolean, addedEntry: e.addedEntry as boolean, fileNameContent: e.fileNameContent as string | null };
      if (g.addedEntry) {
        g.createdContext = e.createdContext as boolean;
        g.fileNameBefore = e.fileNameBefore as FileNameBefore;
      } else {
        g.noEntryReason = e.noEntryReason as NoEntryReason;
      }
      if (g.createdFile) g.fileContent = e.fileContent as string;
      return g;
    }
    case "ask-rules": {
      const a: AskRulesEntry = {
        path,
        kind: "ask-rules",
        added: [...(e.added as string[])].sort(),
        createdFile: e.createdFile as boolean,
        createdPermissions: e.createdPermissions as boolean,
        createdAsk: e.createdAsk as boolean,
        askContent: e.askContent as string | null,
      };
      if (typeof e.fileMode === "string") a.fileMode = e.fileMode;
      return a;
    }
    case "backup":
      return { path, kind: "backup", origin: e.origin as BackupOrigin, of: e.of as string, content: e.content as string | null };
    case "kit":
      return { path, kind: "kit" };
  }
}

const KIND_ORDER = (k: LedgerKind): number => LEDGER_KINDS.indexOf(k);
const byPathThenKind = (a: LedgerEntry, b: LedgerEntry): number =>
  a.path < b.path ? -1 : a.path > b.path ? 1 : KIND_ORDER(a.kind) - KIND_ORDER(b.kind);

/**
 * THE ONE READER of the install ledger. `holder` is install's `ok` marker (or null when there is none
 * a caller can use), or the kit-home record with `scope` "kit-home" (plan 33.1-37). Every entry must
 * have exactly its kind's shape and a kind its scope holds (KINDS_BY_SCOPE); one that does not, two
 * entries with the same (path, kind), or a value that is not a list make the whole ledger `malformed`,
 * and nothing in it is used.
 */
export function readLedger(holder: Readonly<Record<string, unknown>> | null, scope: LedgerScope = "target"): LedgerRead {
  if (holder === null || !hasOwn(holder, LEDGER_FIELD)) return { state: "absent", entries: [], why: null, raw: undefined };
  const raw = holder[LEDGER_FIELD];
  const bad = (why: string): LedgerRead => ({ state: "malformed", entries: [], why, raw });
  if (!Array.isArray(raw)) return bad("the install ledger is not a list");
  const entries: LedgerEntry[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < raw.length; i += 1) {
    const problem = entryProblem(raw[i], scope);
    if (problem !== null) return bad(`entry ${i}: ${problem}`);
    const entry = normalize(raw[i] as Record<string, unknown>);
    const key = `${entry.kind}\u0000${entry.path}`;
    if (seen.has(key)) return bad(`entry ${i}: a second ${entry.kind} entry for ${JSON.stringify(entry.path).slice(0, 120)}, so which one is install's record is not known`);
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
export function ledgerJson(entries: readonly LedgerEntry[]): Record<string, unknown>[] {
  return [...entries].sort(byPathThenKind).map((e): Record<string, unknown> => {
    switch (e.kind) {
      case "dir":
        return { path: e.path, kind: e.kind };
      case "file":
        return { path: e.path, kind: e.kind, content: e.content, kit: e.kit };
      case "block":
        return { path: e.path, kind: e.kind, block: e.block, separator: e.separator };
      case "gemini": {
        const out: Record<string, unknown> = { path: e.path, kind: e.kind, createdFile: e.createdFile, addedEntry: e.addedEntry };
        if (e.addedEntry) {
          out.createdContext = e.createdContext;
          out.fileNameBefore = e.fileNameBefore;
        } else {
          out.noEntryReason = e.noEntryReason;
        }
        out.fileNameContent = e.fileNameContent;
        if (e.createdFile) out.fileContent = e.fileContent;
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
      case "backup":
        return { path: e.path, kind: e.kind, origin: e.origin, of: e.of, content: e.content };
      case "kit":
        return { path: e.path, kind: e.kind };
    }
  });
}

/** The entry of `kind` for `rel` in an `ok` ledger, or undefined. */
export function entryAt<K extends LedgerKind>(ledger: LedgerRead, rel: string, kind: K): EntryOf<K> | undefined {
  if (ledger.state !== "ok") return undefined;
  return ledger.entries.find((e): e is EntryOf<K> => e.kind === kind && e.path === rel);
}

/** Every entry of `kind` in an `ok` ledger, in ledgerJson's order; empty otherwise. */
export function entriesOfKind<K extends LedgerKind>(ledger: LedgerRead, kind: K): readonly EntryOf<K>[] {
  if (ledger.state !== "ok") return [];
  return ledger.entries.filter((e): e is EntryOf<K> => e.kind === kind);
}

/** A `gemini` entry for `fields` (the one path such an entry may name). */
export const geminiEntry = (fields: GeminiLedger): GeminiEntry => ({ ...fields, path: GEMINI_SETTINGS_REL, kind: "gemini" });
/** An `ask-rules` entry for `fields` (the one path such an entry may name). */
export const askRulesEntry = (fields: AskRuleLedger): AskRulesEntry => ({ ...fields, path: ASK_RULES_REL, kind: "ask-rules" });

// notRecordedReason (re-review IN-01, plan 33.1-28; moved here with owns, plan 33.1-36): the ONE wording
// of "there is no install record for this path", chosen from the ledger's state. It says what the record
// shows, never more: a path missing from a readable ledger has no record that install created it, which
// is not the same as "install did not create it".
export function notRecordedReason(ledger: LedgerRead, what: "directory" | "file" | "entry"): string {
  if (ledger.state === "ok") {
    return `there is no record that install created it — it is not in the install ledger as a ${what}; left in place`;
  }
  if (ledger.state === "malformed") {
    return "the install ledger could not be used (see the verify line above), so there is no record that install created it; left in place";
  }
  return "there is no install marker this run can use, so there is no record that install created it; left in place";
}

/**
 * The pseudo-kind owns answers for the marker itself (plan 33.1-38): not a ledger kind (no entry names
 * it), valid only for MARKER_REL.
 */
export const MARKER_KIND = "marker";
/** What owns can be asked about: a ledger kind, or the marker. */
export type OwnsKind = LedgerKind | typeof MARKER_KIND;
/** The entry owns returns for a kind: the ledger entry, or null for the marker (it has none). */
type OwnedEntry<K extends OwnsKind> = K extends LedgerKind ? EntryOf<K> : null;

/** The answer of owns: install's entry and whether the path still holds it, or why it is not install's. */
export type Ownership<K extends OwnsKind> =
  | { readonly owned: true; readonly entry: OwnedEntry<K>; readonly note: string | null }
  | { readonly owned: false; readonly recorded: boolean; readonly entry: OwnedEntry<K> | null; readonly reason: string };

/**
 * THE ONE AUTHORITY (brief §2.2, D-33 (b)): does install own `rel` (a POSIX path relative to `root`)
 * as an entry of `kind`? `recorded` false means there is no usable entry (no marker, a malformed
 * ledger, or no entry for the path). A `file` entry is owned only while the path still holds its
 * content record (checkRecord: the bytes and the mode for a file, NO_MODE_NOTE when the record has no
 * mode; the exact readlink for a link; no link followed; a hard link refused). An entry of any other
 * kind is returned as owned: the caller compares that entry's own content record with the path before
 * it edits anything (see THE ONE AUTHORITY in the header). The pseudo-kind `marker` (plan 33.1-38) is
 * owned exactly when `rel` is MARKER_REL and the ledger read is `ok`; `entry` is then null.
 */
// The typed signature (the entry returned is of the kind asked), then the one implementation.
export function owns<K extends OwnsKind>(ledger: LedgerRead, root: string, rel: string, kind: K): Ownership<K>;
export function owns(ledger: LedgerRead, root: string, rel: string, kind: OwnsKind): Ownership<OwnsKind> {
  if (kind === MARKER_KIND) {
    if (rel !== MARKER_REL) {
      return { owned: false, recorded: false, entry: null, reason: `only ${MARKER_REL} is install's marker; left in place` };
    }
    if (ledger.state === "ok") return { owned: true, entry: null, note: null };
    return { owned: false, recorded: ledger.state === "malformed", entry: null, reason: notRecordedReason(ledger, "entry") };
  }
  const entry = entryAt(ledger, rel, kind);
  if (entry === undefined) {
    return { owned: false, recorded: false, entry: null, reason: notRecordedReason(ledger, kind === "dir" ? "directory" : kind === "file" ? "file" : "entry") };
  }
  if (entry.kind === "kit" || entry.kind === "backup") return ownsKitHomePath(root, rel, entry);
  if (entry.kind !== "file") return { owned: true, entry, note: null };
  const c = checkRecord(root, join(root, ...rel.split("/")), entry.content);
  if (c.holds) return { owned: true, entry, note: c.modeChecked ? null : NO_MODE_NOTE };
  if (c.modeChanged !== undefined) {
    return { owned: false, recorded: true, entry, reason: `${c.modeChanged} there (a change made since), so it is not what install wrote; left in place` };
  }
  if (c.why !== null) return { owned: false, recorded: true, entry, reason: `${c.why}; left in place` };
  return {
    owned: false,
    recorded: true,
    entry,
    reason:
      "it does not hold what the install ledger records install wrote there (it was edited or replaced since), so " +
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
export function carriedKitRecord(previous: LedgerRead, root: string, rel: string): string | null {
  const e = entryAt(previous, rel, "file");
  if (e === undefined || !e.kit) return null;
  return owns(previous, root, rel, "file").owned ? e.content : null;
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
function ownsKitHomePath(root: string, rel: string, entry: BackupEntry | KitRootEntry): Ownership<LedgerKind> {
  const path = join(root, ...rel.split("/"));
  if (wayTo(root, path) !== null) {
    return { owned: false, recorded: true, entry, reason: "something on the way to it is not a real directory, so it is not shown to be what install left there; left in place" };
  }
  if (entry.kind === "kit") {
    const kind = kindAt(path);
    if (kind === "directory") return { owned: true, entry, note: null };
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
  if (treeRecord(root, rel) === entry.content) return { owned: true, entry, note: null };
  return {
    owned: false,
    recorded: true,
    entry,
    reason: "it does not hold what the record says install left there (it was changed since, or could not be read in full); left in place",
  };
}

// ── THE KIT-HOME RECORD (plan 33.1-37, review CR-01's sibling, D-33 (b) and (c)) ─────────────────────
// copyKit used to move whatever sat at the kit root aside and delete it, by presence (brief DC-2): a
// GRUGOPS_HOME pointing at any directory that held someone's agent-factory/ lost it. So the kit home now
// keeps its own record, `<GRUGOPS_HOME>/.grugops-kit.json`, a JSON object with exactly two keys:
//   grugopsHome  the kit home's real path (user-file.ts realTargetPath), the record's binding;
//   ledger       the same ledger grammar as the target's, read by the same readLedger with scope
//                "kit-home", which holds only `kit` and `backup` entries: the `kit` entry (path
//                agent-factory) says install wrote the kit there, and each `backup` entry (origin
//                kit-home, `of` agent-factory) names a kit-root backup install made, with its content
//                record (user-file.ts treeRecord).
// readKitHomeRecord reads it through readForWrite (no link followed at the record or on the way, and a
// FIFO, a directory or a device there is never opened, brief DC-3), refuses a duplicate key, and binds
// it: a record whose grugopsHome is not this kit home's real path is `unbound` (a copied kit home), and
// nothing in it is used. The states:
//   absent      nothing at the path;
//   unreadable  something is there that is not install's record (not a regular file, too large, not
//               JSON, not exactly the two keys, or a malformed ledger); `why` says which;
//   unbound     install's shape with a well-formed ledger, bound to another path;
//   ok          install's record for this kit home.
// Only an `ok` read's ledger has entries; every other state's ledger is `absent`, so owns answers "not
// recorded" for everything and copyKit renames whatever is at the kit root aside.
export type KitHomeRecordState = "absent" | "unreadable" | "unbound" | "ok";
export interface KitHomeRecordRead {
  readonly state: KitHomeRecordState;
  readonly ledger: LedgerRead;
  readonly why: string | null;
  /** The path an `unbound` record names. */
  readonly boundTo: string | null;
}

export function readKitHomeRecord(home: string): KitHomeRecordRead {
  const none: LedgerRead = { state: "absent", entries: [], why: null, raw: undefined };
  const path = join(home, KIT_HOME_RECORD_REL);
  const read = readForWrite(home, path);
  if (read.state === "create") return { state: "absent", ledger: none, why: null, boundTo: null };
  const unreadable = (why: string): KitHomeRecordRead => ({ state: "unreadable", ledger: none, why, boundTo: null });
  if (read.state === "blocked") return unreadable(read.at === path ? `it ${read.reason}` : `${read.at} ${read.reason}`);
  const doc = readJsonText(read.bytes);
  if (!doc.ok) return unreadable(`it ${doc.why}`);
  if (firstDuplicateKey(doc.root) !== null) return unreadable("it has a duplicate key, so which value is install's record is not known");
  let parsed: unknown;
  try {
    parsed = JSON.parse(read.text);
  } catch {
    return unreadable("it is not valid JSON");
  }
  if (!isPlainObject(parsed)) return unreadable("it is not a JSON object");
  const keys = keyProblem(parsed, ["grugopsHome", "ledger"]);
  if (keys !== null) return unreadable(`it is not install's kit-home record: ${keys}`);
  if (typeof parsed.grugopsHome !== "string") return unreadable("its grugopsHome is not a string");
  const ledger = readLedger(parsed, "kit-home");
  if (ledger.state !== "ok") return unreadable(`its ledger is malformed (${ledger.why ?? "absent"})`);
  const here = realTargetPath(home);
  if (here === null || parsed.grugopsHome !== here) {
    return {
      state: "unbound",
      ledger: none,
      why:
        here === null
          ? "the real path of the kit home could not be read, so the record cannot be shown to be this kit home's"
          : `it was written for another kit home (${parsed.grugopsHome}), not this one (${here})`,
      boundTo: parsed.grugopsHome,
    };
  }
  return { state: "ok", ledger, why: null, boundTo: here };
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
const isAbsoluteMarkerPath = (v: unknown): boolean =>
  typeof v === "string" && v.trim() === v && v !== "" && (v.startsWith("/") || /^[A-Za-z]:[\\/]/.test(v));
export function installMarkerProblems(marker: Readonly<Record<string, unknown>>): string[] {
  const out: string[] = [];
  const has = (k: string): boolean => Object.prototype.hasOwnProperty.call(marker, k);
  for (const k of ["grugopsHome", "kitRoot"]) {
    if (!has(k)) out.push(`no ${k}`);
    else if (typeof marker[k] !== "string") out.push(`${k} is not a string`);
    else if (!isAbsoluteMarkerPath(marker[k])) out.push(`${k} is not an absolute path`);
  }
  if (!has("installMode")) out.push("no installMode");
  else if (marker.installMode !== "copy" && marker.installMode !== "symlink") out.push("installMode is neither copy nor symlink");
  if (has("kitVersion") && typeof marker.kitVersion !== "string") out.push("kitVersion is not a string");
  if (has("target") && !isAbsoluteMarkerPath(marker.target)) out.push("target is not an absolute path");
  return out;
}
