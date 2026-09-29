// install-marker.ts — the ONE reader of the install marker `.grugops/install.json` and of the two
// ledgers it carries (plan 33.1-21, CR-02 and WR-05).
//
// Cross-platform. ZERO npm dependencies: it imports only node:path and ./user-file.ts. A
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
import { join } from "node:path";
import { readForWrite } from "./user-file.js";
/** The marker's path relative to the target, in POSIX form: the one spelling both binaries use. */
export const MARKER_REL = ".grugops/install.json";
/** Read `<target>/.grugops/install.json` without following a link (see the header). */
export function readInstallMarker(target) {
    const path = join(target, ...MARKER_REL.split("/"));
    const read = readForWrite(target, path);
    if (read.state === "create")
        return { state: "absent", marker: null };
    if (read.state === "blocked") {
        return { state: "unreadable", marker: null, why: read.at === path ? `it ${read.reason}` : `${read.at} ${read.reason}` };
    }
    try {
        const parsed = JSON.parse(read.text);
        if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
            return { state: "unreadable", marker: null, why: "it is JSON but not a JSON object" };
        }
        return { state: "ok", marker: parsed };
    }
    catch {
        return { state: "unreadable", marker: null, why: "it is not valid JSON" };
    }
}
function fieldOf(marker, name) {
    if (marker === null || !Object.prototype.hasOwnProperty.call(marker, name))
        return { present: false, raw: undefined };
    return { present: true, raw: marker[name] };
}
// isLedgerDir: one createdDirs entry has the shape stated in the header.
export function isLedgerDir(entry) {
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
    if (!Array.isArray(raw) || !raw.every(isLedgerDir))
        return { state: "malformed", dirs: [], raw };
    return { state: "ok", dirs: [...new Set(raw)].sort(), raw };
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
    return {
        state: "ok",
        ledger: {
            added: [...r.added].sort(),
            createdFile: r.createdFile,
            createdPermissions: r.createdPermissions,
            createdAsk: r.createdAsk,
        },
        raw,
    };
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
    if (readAskRuleLedger(marker).state === "malformed")
        out.push("claudeAskRules");
    return out;
}
