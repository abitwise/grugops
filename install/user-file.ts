// user-file.ts — the ONE reader of a user-controlled path in the installer (plan 33.1-26, brief
// 33.1-GAP-PLANNING-BRIEF.md DC-3: an unbounded read of a user-controlled path).
//
// Cross-platform. Node stdlib ONLY (node:fs) — ZERO npm dependencies. A sibling of install.js
// inside install/, so the installer still runs on a host with nothing installed. This module never
// writes: it imports read-only fs names and one openSync whose flags are read-only, and
// install/installer-fs-census.test.ts scans it with the rest of install/ and checks those flags.
//
// WHY ONE READER. Every path in the user's repository may be a special file the user or another
// tool created: a FIFO, a directory, a socket, a device, or a symlink to one of them. Reading a FIFO
// blocks until a writer appears, and reading /dev/zero never ends, so an installer that reads such a
// path hangs, and a hanging installer is neither dry-run-capable nor reversible (D-18). The rule
// that a user path is read only when it is a regular file within a size bound lives here, once,
// instead of at each call site (brief §2.2).
//
// WHY THE TYPE IS DECIDED BEFORE THE OPEN. Opening a FIFO to read, even with O_NONBLOCK, releases a
// writer blocked in open() on it (red-team B2 of plan 33.1-25), and opening a terminal device can
// make it the controlling terminal. So the path is stat'ed first (following a symlink, because a
// symlink to a regular file is a regular file for the reader), and anything that is not a regular
// file within the bound is never opened.
//
// WHY O_NONBLOCK, O_NOCTTY AND AN FSTAT OF THE SAME DESCRIPTOR. Between the stat and the open the
// path can be swapped. The open is therefore read-only, non-blocking (a FIFO swapped in does not
// block the open) and O_NOCTTY (a terminal swapped in does not become the controlling terminal).
// The descriptor itself is then fstat'ed: it must still be a regular file within the bound and the
// same file (device and inode) the stat saw. The read never goes past the size that fstat reported.
// `O_NONBLOCK` and `O_NOCTTY` are absent on win32, where each flag is 0 (D-15 keeps Windows
// behaviour out of scope).
//
// WHY A COPY OF A USER FILE IS WRITTEN FROM THESE BYTES. A copy call (copyFileSync, cpSync) opens
// the source path again, by name, after any check the caller made, so the check and the copy can
// see two different files, and the copy itself can block on a FIFO. A caller that copies a user
// file reads it here and writes the returned bytes; it never hands the user path to a copy call.
//
// THE STATES.
//   `absent`       nothing is at the path (ENOENT, or ENOTDIR: an ancestor is not a directory).
//                  A dangling symlink reads as absent, because nothing it names exists.
//   `not-regular`  something is there and it is not a regular file; `kind` names what it is.
//   `too-large`    a regular file above `maxBytes`; `size` is its size in bytes.
//   `unreadable`   the path could not be stat'ed or opened for another reason (EACCES, ELOOP, ...),
//                  or it changed between the stat and the open; `code` names the reason.
//   `ok`           a regular file within the bound; `bytes` are its contents and `text` their UTF-8
//                  decoding.
//
// Clear professional voice: this is a safety surface (installer reads of user content).

import { closeSync, constants, fstatSync, openSync, readSync, statSync } from "node:fs";

export type UserFileRead =
  | { readonly state: "absent" }
  | { readonly state: "not-regular"; readonly kind: string }
  | { readonly state: "too-large"; readonly size: number }
  | { readonly state: "unreadable"; readonly code: string }
  | { readonly state: "ok"; readonly bytes: Buffer; readonly text: string };

/** The default size bound: no file the installer reads in a user repository is near this. */
export const USER_FILE_MAX_BYTES = 8 * 1024 * 1024;

// The part of a stat result this module reads. Declared structurally rather than imported, so the
// module's node:fs import list holds only the functions the census classifies.
interface StatShape {
  readonly dev: number;
  readonly ino: number;
  readonly size: number;
  isFile(): boolean;
  isDirectory(): boolean;
  isFIFO(): boolean;
  isSocket(): boolean;
  isCharacterDevice(): boolean;
  isBlockDevice(): boolean;
  isSymbolicLink(): boolean;
}

function kindOf(st: StatShape): string {
  if (st.isDirectory()) return "directory";
  if (st.isFIFO()) return "fifo";
  if (st.isSocket()) return "socket";
  if (st.isCharacterDevice()) return "character device";
  if (st.isBlockDevice()) return "block device";
  if (st.isSymbolicLink()) return "symbolic link";
  return "unknown";
}

const codeOf = (e: unknown): string => {
  const code = (e as { code?: unknown }).code;
  return typeof code === "string" && code !== "" ? code : "UNKNOWN";
};

export function readUserFile(path: string, maxBytes: number = USER_FILE_MAX_BYTES): UserFileRead {
  let before: StatShape;
  try {
    before = statSync(path);
  } catch (e) {
    const code = codeOf(e);
    if (code === "ENOENT" || code === "ENOTDIR") return { state: "absent" };
    return { state: "unreadable", code };
  }
  if (!before.isFile()) return { state: "not-regular", kind: kindOf(before) };
  if (before.size > maxBytes) return { state: "too-large", size: before.size };

  let fd: number;
  try {
    fd = openSync(path, constants.O_RDONLY | (constants.O_NONBLOCK ?? 0) | (constants.O_NOCTTY ?? 0));
  } catch (e) {
    return { state: "unreadable", code: codeOf(e) };
  }
  try {
    const st = fstatSync(fd);
    if (st.dev !== before.dev || st.ino !== before.ino) return { state: "unreadable", code: "CHANGED" };
    if (!st.isFile()) return { state: "not-regular", kind: kindOf(st) };
    if (st.size > maxBytes) return { state: "too-large", size: st.size };
    const buf = Buffer.alloc(st.size);
    let off = 0;
    while (off < buf.length) {
      const n = readSync(fd, buf, off, buf.length - off, off);
      if (n === 0) break;
      off += n;
    }
    const bytes = buf.subarray(0, off);
    return { state: "ok", bytes, text: bytes.toString("utf8") };
  } catch (e) {
    return { state: "unreadable", code: codeOf(e) };
  } finally {
    closeSync(fd);
  }
}
