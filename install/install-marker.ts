// install-marker.ts — the ONE reader of the install marker `.grugops/install.json` and of the three
// ledgers it carries (plan 33.1-21, CR-02 and WR-05; plan 33.1-28, Gap B; plan 33.1-29, CR-03).
//
// Cross-platform. ZERO npm dependencies: it imports only node:crypto (a hash, no I/O), node:path and
// ./user-file.ts. A
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
// WHY ONE READER. The marker holds four ledgers the uninstaller depends on to reverse an install
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
//                      `ok`         a plain object.
//   malformedLedgers:  the names of the ledgers in an `ok` marker that are present but malformed.
//                      A caller that would act on the marker as a whole (uninstall's removal of it)
//                      does so only when this is empty.
//   readCreatedDirs / readCreatedFiles / readAskRuleLedger / readGeminiLedger:
//                      `absent`     the marker has no such field (an install made before the
//                                   ledger existed);
//                      `malformed`  the field is present but not the exact ledger shape;
//                      `ok`         the exact shape; the parsed value is returned.
// `raw` is always the field's value as found, so a caller that must leave a malformed ledger as it
// was can write it back verbatim.
//
// THE createdDirs AND createdFiles SHAPE (isLedgerPath, one rule for both). createdDirs is an array of
// paths; createdFiles is an object from path to content record. Each path is relative to the target
// in POSIX form: non-empty, not starting with `/`, containing no `\` and no `:`, and every
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
//   fileNameContent  record   the content record (contentRecord, sha256 form) of JSON.stringify of
//                             context.fileName as install last left it, or null when install left no
//                             fileName it could record. A re-install carries this record forward only
//                             while the file's fileName is still exactly that (red-team of plan
//                             33.1-28: never carry a ledger entry forward by presence). Required, and
//                             never null when addedEntry is true;
//   fileContent      record   present exactly when createdFile is true: the content record of the
//                             bytes install wrote. Uninstall deletes the whole file only while it
//                             holds them (recordHolds).
// createdFile true also requires addedEntry true, createdContext true and fileNameBefore "absent"
// (install writes the file with the entry in it). Anything else is `malformed`.
//
// Clear professional voice: this is a safety surface (installer reversal).

import { createHash } from "node:crypto";
import { join } from "node:path";
import { isOwnLink, readForWrite, wayTo } from "./user-file.js";

/** The marker's path relative to the target, in POSIX form: the one spelling both binaries use. */
export const MARKER_REL = ".grugops/install.json";

export type InstallMarkerRead =
  | { readonly state: "absent"; readonly marker: null }
  | { readonly state: "unreadable"; readonly marker: null; readonly why: string }
  | { readonly state: "ok"; readonly marker: Readonly<Record<string, unknown>>; readonly bytes: Buffer };

export type LedgerState = "absent" | "malformed" | "ok";

// AskRuleLedger (D-18): what install added to the target's .claude/settings.json, so uninstall can
// remove exactly that and nothing else. `added` is sorted. Each created* flag records that install
// created the file, the `permissions` object or the `ask` array, so uninstall removes a container
// only when install created it and it is empty again. `askContent` (red-team of plan 33.1-28, R3) is
// the content record (contentRecord) of the `permissions.ask` array exactly as install last left it,
// or null when the file held no such array: the next install carries the claims and the flags
// forward only while the array is still that one (see install.ts writeAskRules).
export interface AskRuleLedger {
  added: string[];
  createdFile: boolean;
  createdPermissions: boolean;
  createdAsk: boolean;
  askContent: string | null;
}

// GeminiLedger (plan 33.1-29): the record of what install did to .gemini/settings.json. See THE
// geminiSettings SHAPE in the header.
export type FileNameBefore = "absent" | "string" | "array";
export interface GeminiLedger {
  createdFile: boolean;
  addedEntry: boolean;
  createdContext?: boolean;
  fileNameBefore?: FileNameBefore;
  fileNameContent: string | null;
  fileContent?: string;
}

export interface GeminiLedgerRead {
  readonly state: LedgerState;
  /** The parsed ledger when `ok`; null otherwise. */
  readonly ledger: GeminiLedger | null;
  readonly raw: unknown;
}

export interface CreatedDirsRead {
  readonly state: LedgerState;
  /** Sorted, de-duplicated entries when `ok`; empty otherwise. */
  readonly dirs: readonly string[];
  readonly raw: unknown;
}

export interface CreatedFilesRead {
  readonly state: LedgerState;
  /** Path → content record when `ok` (keys sorted); empty otherwise. */
  readonly files: ReadonlyMap<string, string>;
  readonly raw: unknown;
}

export interface AskRuleLedgerRead {
  readonly state: LedgerState;
  /** The parsed ledger when `ok`; null otherwise. */
  readonly ledger: AskRuleLedger | null;
  readonly raw: unknown;
}

/** Read `<target>/.grugops/install.json` without following a link (see the header). */
export function readInstallMarker(target: string): InstallMarkerRead {
  const path = join(target, ...MARKER_REL.split("/"));
  const read = readForWrite(target, path);
  if (read.state === "create") return { state: "absent", marker: null };
  if (read.state === "blocked") {
    return { state: "unreadable", marker: null, why: read.at === path ? `it ${read.reason}` : `${read.at} ${read.reason}` };
  }
  try {
    const parsed: unknown = JSON.parse(read.text);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { state: "unreadable", marker: null, why: "it is JSON but not a JSON object" };
    }
    return { state: "ok", marker: parsed as Record<string, unknown>, bytes: read.bytes };
  } catch {
    return { state: "unreadable", marker: null, why: "it is not valid JSON" };
  }
}

function fieldOf(marker: Readonly<Record<string, unknown>> | null, name: string): { present: boolean; raw: unknown } {
  if (marker === null || !Object.prototype.hasOwnProperty.call(marker, name)) return { present: false, raw: undefined };
  return { present: true, raw: marker[name] };
}

// isLedgerPath: one createdDirs or createdFiles entry has the shape stated in the header. The same
// rule serves both ledgers, because a file path and a directory path under the target have the same
// shape.
export function isLedgerPath(entry: unknown): entry is string {
  if (typeof entry !== "string" || entry === "") return false;
  if (entry.startsWith("/") || entry.includes("\\") || entry.includes(":")) return false;
  return entry.split("/").every((seg) => seg !== "" && seg !== "." && seg !== "..");
}

export function readCreatedDirs(marker: Readonly<Record<string, unknown>> | null): CreatedDirsRead {
  const { present, raw } = fieldOf(marker, "createdDirs");
  if (!present) return { state: "absent", dirs: [], raw };
  if (!Array.isArray(raw) || !raw.every(isLedgerPath)) return { state: "malformed", dirs: [], raw };
  return { state: "ok", dirs: [...new Set(raw as string[])].sort(), raw };
}

// readCreatedFiles (plan 33.1-28; red-team R1): the `createdFiles` ledger. A plain JSON object whose
// every key has the isLedgerPath shape and whose every value is a content record (isContentRecord).
// Anything else, the plan-28 array of bare paths included, is `malformed`: a path with no record of
// what install wrote there proves nothing about what is there now.
export function readCreatedFiles(marker: Readonly<Record<string, unknown>> | null): CreatedFilesRead {
  const { present, raw } = fieldOf(marker, "createdFiles");
  if (!present) return { state: "absent", files: new Map(), raw };
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return { state: "malformed", files: new Map(), raw };
  const entries = Object.entries(raw as Record<string, unknown>);
  if (!entries.every(([k, v]) => isLedgerPath(k) && isContentRecord(v))) return { state: "malformed", files: new Map(), raw };
  return { state: "ok", files: new Map((entries as Array<[string, string]>).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))), raw };
}

export function readAskRuleLedger(marker: Readonly<Record<string, unknown>> | null): AskRuleLedgerRead {
  const { present, raw } = fieldOf(marker, "claudeAskRules");
  if (!present) return { state: "absent", ledger: null, raw };
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return { state: "malformed", ledger: null, raw };
  const r = raw as Record<string, unknown>;
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
      added: [...(r.added as string[])].sort(),
      createdFile: r.createdFile,
      createdPermissions: r.createdPermissions,
      createdAsk: r.createdAsk,
      askContent: r.askContent as string | null,
    },
    raw,
  };
}

// readGeminiLedger (plan 33.1-29, Gap B / re-review CR-03): the `geminiSettings` ledger, exactly the
// shape the header states. The key set is checked first, so a record with an extra key, or with a
// conditional key where it does not belong, is malformed; a partial record never reads as a smaller
// claim.
export function readGeminiLedger(marker: Readonly<Record<string, unknown>> | null): GeminiLedgerRead {
  const { present, raw } = fieldOf(marker, "geminiSettings");
  if (!present) return { state: "absent", ledger: null, raw };
  const bad: GeminiLedgerRead = { state: "malformed", ledger: null, raw };
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return bad;
  const r = raw as Record<string, unknown>;
  if (typeof r.createdFile !== "boolean" || typeof r.addedEntry !== "boolean") return bad;
  const want = ["createdFile", "addedEntry", "fileNameContent"];
  if (r.addedEntry) want.push("createdContext", "fileNameBefore");
  if (r.createdFile) want.push("fileContent");
  const keys = Object.keys(r);
  if (keys.length !== want.length || !want.every((k) => Object.prototype.hasOwnProperty.call(r, k))) return bad;
  if (r.fileNameContent !== null && !isSha256Record(r.fileNameContent)) return bad;
  if (r.addedEntry) {
    if (typeof r.createdContext !== "boolean") return bad;
    if (r.fileNameBefore !== "absent" && r.fileNameBefore !== "string" && r.fileNameBefore !== "array") return bad;
    if (r.fileNameContent === null) return bad;
  }
  if (r.createdFile) {
    if (!r.addedEntry || r.createdContext !== true || r.fileNameBefore !== "absent") return bad;
    if (!isSha256Record(r.fileContent)) return bad;
  }
  const ledger: GeminiLedger = { createdFile: r.createdFile, addedEntry: r.addedEntry, fileNameContent: r.fileNameContent as string | null };
  if (r.addedEntry) {
    ledger.createdContext = r.createdContext as boolean;
    ledger.fileNameBefore = r.fileNameBefore as FileNameBefore;
  }
  if (r.createdFile) ledger.fileContent = r.fileContent as string;
  return { state: "ok", ledger, raw };
}

/**
 * The geminiSettings record in the order install writes its keys (the header's order), so a record
 * carried forward and a record written new serialize the same way.
 */
export function geminiLedgerJson(l: GeminiLedger): Record<string, unknown> {
  const out: Record<string, unknown> = { createdFile: l.createdFile, addedEntry: l.addedEntry };
  if (l.addedEntry) {
    out.createdContext = l.createdContext;
    out.fileNameBefore = l.fileNameBefore;
  }
  out.fileNameContent = l.fileNameContent;
  if (l.createdFile) out.fileContent = l.fileContent;
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
// way, whose readlink equals the target (isOwnLink). Anything else does not hold. Plan 33.1-30's
// kitFiles uses the same grammar and the same predicate.
const SHA256_RECORD = /^sha256:[0-9a-f]{64}$/;
const LINK_RECORD = /^link:[^\u0000-\u001f\u007f]+$/;
const isSha256Record = (v: unknown): v is string => typeof v === "string" && SHA256_RECORD.test(v);

/** The record of `bytes` install wrote: `sha256:<hex>`. A string is hashed as its UTF-8 bytes. */
export function contentRecord(bytes: Buffer | string): string {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

/** The record of a symbolic link install made to `target`: `link:<target>`. */
export function linkRecord(target: string): string {
  return `link:${target}`;
}

/** One value has the content-record grammar above. */
export function isContentRecord(v: unknown): v is string {
  return typeof v === "string" && (SHA256_RECORD.test(v) || LINK_RECORD.test(v));
}

/** `path` (strictly inside `root`) still holds exactly what `record` says install wrote there. */
export function recordHolds(root: string, path: string, record: string): boolean {
  if (record.startsWith("link:")) {
    return wayTo(root, path) === null && isOwnLink(path, record.slice("link:".length));
  }
  const r = readForWrite(root, path);
  return r.state === "ok" && contentRecord(r.bytes) === record;
}

// malformedLedgers (red-team of plan 33.1-27, B4): every ledger field the marker carries that is
// present but malformed, by the same readers every caller already trusts. uninstall removes the
// marker only when the marker is `ok` and this is empty: a marker holding a ledger it could not read
// is a record the human still needs, not a file to delete. A plan that adds a ledger to the marker
// adds its reader here, so the marker is never removed over a ledger nobody could read.
export function malformedLedgers(marker: Readonly<Record<string, unknown>>): string[] {
  const out: string[] = [];
  if (readCreatedDirs(marker).state === "malformed") out.push("createdDirs");
  if (readCreatedFiles(marker).state === "malformed") out.push("createdFiles");
  if (readAskRuleLedger(marker).state === "malformed") out.push("claudeAskRules");
  if (readGeminiLedger(marker).state === "malformed") out.push("geminiSettings");
  return out;
}
