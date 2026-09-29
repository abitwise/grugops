// install-marker.ts — the ONE reader of the install marker `.grugops/install.json` and of the two
// ledgers it carries (plan 33.1-21, CR-02 and WR-05).
//
// Cross-platform. ZERO npm dependencies: it imports only ./user-file.ts (node builtins only). A
// sibling of install.js and uninstall.js inside install/, imported by BOTH binaries, so both still
// run on a host with nothing installed. This module never writes and imports nothing from node:fs;
// install/installer-fs-census.test.ts scans it with the rest of install/ and asserts it makes no
// content read of its own.
//
// WHY THE MARKER IS READ THROUGH readUserFile (plan 33.1-27, IN-04, brief DC-3). The marker is a
// path in the user's repository, so it may be a FIFO, a directory, a device or a symlink to one.
// A plain read of a FIFO blocks until a writer appears: the installer used to hang there forever,
// the same shape Phase 31 round 5 found at a write chokepoint. readUserFile decides the file type
// before it opens anything and opens only a regular file within its size bound, so this reader
// never blocks and never releases a writer blocked on a FIFO. Every state but `ok` and `absent`
// (not a regular file, too large, unreadable) is `unreadable` here, and each caller already has a
// fail-closed answer for an unreadable marker.
//
// WHY ONE READER. The marker holds two ledgers the uninstaller depends on to reverse an install
// without deleting user content:
//   - `claudeAskRules` — the Claude Code ask rules install added to .claude/settings.json (D-18);
//   - `createdDirs`    — the directories install itself created under the target (CR-02).
// Each binary used to hold its own reader of the ask-rule ledger, and the two disagreed about a
// malformed one: install read it as "no previous install" and relabelled every grugops rule as the
// user's own (fail open), while uninstall refused (fail closed). That is WR-05. A second ledger
// with two readers would repeat the defect, so both binaries now read the marker and both ledgers
// here, as tri-states, and neither can read a malformed ledger as an empty one.
//
// THE STATES.
//   readInstallMarker: `absent`     nothing is at the marker path (no install, or a removed one);
//                      `unreadable` something is there and it is not a readable regular file
//                                   within the bound (a FIFO, a directory, a dangling link, a path
//                                   under a non-directory, ...), or it is not JSON, or it is not a
//                                   plain JSON object;
//                      `ok`         a plain object.
//   readCreatedDirs / readAskRuleLedger:
//                      `absent`     the marker has no such field (an install made before the
//                                   ledger existed);
//                      `malformed`  the field is present but not the exact ledger shape;
//                      `ok`         the exact shape; the parsed value is returned.
// `raw` is always the field's value as found, so a caller that must leave a malformed ledger as it
// was can write it back verbatim.
//
// THE createdDirs SHAPE. An array of strings. Each entry is a path relative to the target in POSIX
// form: non-empty, not starting with `/`, containing no `\` and no `:`, and every `/`-separated
// segment is non-empty and is neither `.` nor `..`. So no entry can name a path outside the
// target. The uninstaller only asks whether one of its own fixed candidate directories is IN the
// ledger; it never iterates the ledger to decide what to delete, and it never removes recursively.
//
// Clear professional voice: this is a safety surface (installer reversal).

import { readUserFile } from "./user-file.js";

export type InstallMarkerRead =
  | { readonly state: "absent"; readonly marker: null }
  | { readonly state: "unreadable"; readonly marker: null }
  | { readonly state: "ok"; readonly marker: Readonly<Record<string, unknown>> };

export type LedgerState = "absent" | "malformed" | "ok";

// AskRuleLedger (D-18): what install added to the target's .claude/settings.json, so uninstall can
// remove exactly that and nothing else. `added` is sorted. Each created* flag records that install
// created the file, the `permissions` object or the `ask` array, so uninstall removes a container
// only when install created it and it is empty again.
export interface AskRuleLedger {
  added: string[];
  createdFile: boolean;
  createdPermissions: boolean;
  createdAsk: boolean;
}

export interface CreatedDirsRead {
  readonly state: LedgerState;
  /** Sorted, de-duplicated entries when `ok`; empty otherwise. */
  readonly dirs: readonly string[];
  readonly raw: unknown;
}

export interface AskRuleLedgerRead {
  readonly state: LedgerState;
  /** The parsed ledger when `ok`; null otherwise. */
  readonly ledger: AskRuleLedger | null;
  readonly raw: unknown;
}

export function readInstallMarker(path: string): InstallMarkerRead {
  const read = readUserFile(path);
  if (read.state === "absent") return { state: "absent", marker: null };
  if (read.state !== "ok") return { state: "unreadable", marker: null };
  try {
    const parsed: unknown = JSON.parse(read.text);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { state: "unreadable", marker: null };
    }
    return { state: "ok", marker: parsed as Record<string, unknown> };
  } catch {
    return { state: "unreadable", marker: null };
  }
}

function fieldOf(marker: Readonly<Record<string, unknown>> | null, name: string): { present: boolean; raw: unknown } {
  if (marker === null || !Object.prototype.hasOwnProperty.call(marker, name)) return { present: false, raw: undefined };
  return { present: true, raw: marker[name] };
}

// isLedgerDir: one createdDirs entry has the shape stated in the header.
export function isLedgerDir(entry: unknown): entry is string {
  if (typeof entry !== "string" || entry === "") return false;
  if (entry.startsWith("/") || entry.includes("\\") || entry.includes(":")) return false;
  return entry.split("/").every((seg) => seg !== "" && seg !== "." && seg !== "..");
}

export function readCreatedDirs(marker: Readonly<Record<string, unknown>> | null): CreatedDirsRead {
  const { present, raw } = fieldOf(marker, "createdDirs");
  if (!present) return { state: "absent", dirs: [], raw };
  if (!Array.isArray(raw) || !raw.every(isLedgerDir)) return { state: "malformed", dirs: [], raw };
  return { state: "ok", dirs: [...new Set(raw as string[])].sort(), raw };
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
  return {
    state: "ok",
    ledger: {
      added: [...(r.added as string[])].sort(),
      createdFile: r.createdFile,
      createdPermissions: r.createdPermissions,
      createdAsk: r.createdAsk,
    },
    raw,
  };
}
