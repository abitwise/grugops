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
//   `absent`       NOTHING is at the path: stat and lstat both answer ENOENT. `absent` is the only
//                  state a caller may read as "free to create", so it is never given to a path that
//                  names something (red-team of plan 33.1-26): a dangling symlink is `not-regular`
//                  (kind "dangling symbolic link"), because a create through it lands wherever the
//                  link points, outside the target included; and ENOTDIR (a regular file or a FIFO
//                  where a directory on the way should be) is `unreadable`, because every write
//                  under that path would fail.
//   `not-regular`  something is there and it is not a regular file; `kind` names what it is.
//   `too-large`    a regular file above `maxBytes`; `size` is its size in bytes.
//   `unreadable`   the path could not be stat'ed or opened for another reason (ENOTDIR, EACCES,
//                  ELOOP, ENAMETOOLONG, ...), or it changed between the stat and the open; `code`
//                  names the reason.
//   `ok`           a regular file within the bound; `bytes` are its contents and `text` their UTF-8
//                  decoding.
//
// WRITES INTO THE TARGET: readForWrite. A reader that follows links is right for a read and wrong
// for a write: a symlink to a regular file reads as `ok`, and a write to it lands wherever it
// points. readForWrite is the one question the installer asks before it writes, appends to,
// renames or creates a path under the target. It walks every directory component from the root
// down with lstat (a link is never followed), and answers:
//   `create`   nothing is at the path, and every directory on the way that exists is a real
//              directory. The caller creates the file with an exclusive create (flag "wx"), which
//              refuses any path that has appeared since, a dangling link included.
//   `ok`       the path is a regular file (not a link) inside the root; its bytes come from
//              readUserFile.
//   `blocked`  something on the way, or at the path itself, is a symbolic link, is not a directory
//              where one is needed, is not a regular file, or could not be read; `at` names it and
//              `reason` says what it is. The caller writes nothing and reports it.
// It only reads (lstat, and readUserFile for the final component), so it lives with the reader.
//
// Clear professional voice: this is a safety surface (installer reads of user content).

import { closeSync, constants, fstatSync, lstatSync, openSync, readSync, readlinkSync, statSync } from "node:fs";
import { isAbsolute, join, relative, sep } from "node:path";

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
  if (st.isFile()) return "regular file";
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
    if (code !== "ENOENT") return { state: "unreadable", code };
    // stat follows a link and found nothing. lstat does not: if IT finds something, the path is a
    // dangling symbolic link, which names a place a create would land, so it is not `absent`.
    try {
      const link = lstatSync(path);
      return { state: "not-regular", kind: link.isSymbolicLink() ? "dangling symbolic link" : kindOf(link) };
    } catch (e2) {
      const code2 = codeOf(e2);
      return code2 === "ENOENT" ? { state: "absent" } : { state: "unreadable", code: code2 };
    }
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

/**
 * The one wording of why a user path was not read, for every state but `ok` and `absent`. Each
 * caller says what it did instead (skipped, left untouched); this names only what the path is.
 */
export function unreadState(r: Exclude<UserFileRead, { state: "ok" } | { state: "absent" }>): string {
  switch (r.state) {
    case "not-regular":
      return `is not a regular file (it is a ${r.kind})`;
    case "too-large":
      return `is larger than the size bound (${r.size} bytes)`;
    case "unreadable":
      return `could not be read (${r.code})`;
  }
}

export type UserWriteRead =
  | { readonly state: "create" }
  | { readonly state: "ok"; readonly bytes: Buffer; readonly text: string }
  | { readonly state: "blocked"; readonly at: string; readonly reason: string };

/** What one existing path component is, by lstat: a real directory, nothing, or a reason it is neither. */
function componentProblem(path: string, wantDirectory: boolean): "absent" | "fine" | string {
  let st: StatShape;
  try {
    st = lstatSync(path);
  } catch (e) {
    const code = codeOf(e);
    return code === "ENOENT" ? "absent" : `could not be read (${code})`;
  }
  if (st.isSymbolicLink()) {
    return "is a symbolic link, and the installer never writes through a link it did not create";
  }
  if (wantDirectory && !st.isDirectory()) return `is not a directory (it is a ${kindOf(st)})`;
  return "fine";
}

/**
 * The directories on the way from `root` to `path` (both excluded): null when every one exists and
 * is a real directory, "absent" when one is missing (so everything below it is too), or the first
 * one that is a link, not a directory, or unreadable. `path` must lie strictly inside `root`. For a
 * caller that renames or removes `path` itself as a name (a link is renamed, never followed), this
 * is the whole question; readForWrite asks it first.
 */
export function wayTo(
  root: string,
  path: string,
): null | "absent" | { readonly state: "blocked"; readonly at: string; readonly reason: string } {
  const rel = relative(root, path);
  if (rel === "" || isAbsolute(rel) || rel === ".." || rel.startsWith(`..${sep}`)) {
    return { state: "blocked", at: path, reason: `is not inside ${root}, and the installer writes only inside the target` };
  }
  let cur = root;
  for (const part of rel.split(sep).slice(0, -1)) {
    cur = join(cur, part);
    const p = componentProblem(cur, true);
    if (p === "absent") return "absent";
    if (p !== "fine") return { state: "blocked", at: cur, reason: p };
  }
  return null;
}

/**
 * The one question every write under `root` asks first (see WRITES INTO THE TARGET above). `path`
 * must lie strictly inside `root`; anything else is `blocked`.
 */
export function readForWrite(root: string, path: string, maxBytes: number = USER_FILE_MAX_BYTES): UserWriteRead {
  const way = wayTo(root, path);
  if (way === "absent") return { state: "create" };
  if (way !== null) return way;
  const leaf = componentProblem(path, false);
  if (leaf === "absent") return { state: "create" };
  if (leaf !== "fine") return { state: "blocked", at: path, reason: leaf };
  const r = readUserFile(path, maxBytes);
  if (r.state === "ok") return r;
  // Gone since the lstat above: nothing is there, and the exclusive create refuses anything new.
  if (r.state === "absent") return { state: "create" };
  return { state: "blocked", at: path, reason: unreadState(r) };
}

/**
 * What is at `path` itself, by lstat (a link is not followed): the kind wording readUserFile uses
 * ("regular file", "symbolic link", "directory", "fifo", ...), or null when nothing is there or the
 * path cannot be lstat'ed. For a caller that removes a path by name (uninstall.ts), which may remove
 * a regular file or a link but never a directory or a special file (plan 33.1-27). It only lstats.
 */
export function kindAt(path: string): string | null {
  try {
    return kindOf(lstatSync(path));
  } catch {
    return null;
  }
}

/**
 * isOwnLink: `dest` is a symbolic link whose target is exactly `src` — the link a --symlink install
 * makes (install.ts linkOrCopy's symlinkSync(src, dest)). THE ONE OWNERSHIP PREDICATE FOR A LINK,
 * shared by both binaries (red-team of plan 33.1-27, B2): install skips such a link as its own and
 * refuses every other link at a path it writes; uninstall removes a link only when it is this link,
 * and leaves every other link (a loop, a dangling link, a link to a device, a FIFO, a directory or a
 * file anywhere else) in place with a verify. It reads only the link itself (lstat and readlink),
 * never what it points at.
 */
export function isOwnLink(dest: string, src: string): boolean {
  try {
    return lstatSync(dest).isSymbolicLink() && readlinkSync(dest) === src;
  } catch {
    return false;
  }
}

/**
 * gone: nothing is at `path` by lstat — the answer is ENOENT, and only ENOENT. A remover asks it
 * after its removal and reports `removed` only when it is true (red-team of plan 33.1-27, B2: on
 * Node 24 rmSync with force left a dangling link in place and threw nothing). Any other lstat error
 * is not proof that the path is gone.
 */
export function gone(path: string): boolean {
  try {
    lstatSync(path);
    return false;
  } catch (e) {
    return codeOf(e) === "ENOENT";
  }
}

/**
 * What one directory component on the way to a write is, for the caller that creates the missing
 * ones (install.ts mkdirp): `absent`, a real directory (`fine`), or the reason it is neither.
 * The same rule readForWrite applies to every directory on the way, from one place.
 */
export function directoryComponent(path: string): "absent" | "fine" | string {
  return componentProblem(path, true);
}
