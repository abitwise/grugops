// user-file.ts — the ONE reader of a user-controlled path in the installer (plan 33.1-26, brief
// 33.1-GAP-PLANNING-BRIEF.md DC-3: an unbounded read of a user-controlled path).
//
// Cross-platform. Node stdlib ONLY (node:fs, node:path, and node:crypto for treeRecord's hash, which
// does no I/O) — ZERO npm dependencies. A sibling of install.js
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
//              where one is needed, is not a regular file, is a regular file with more than one name
//              (a hard link: red-team carry #9, plan 33.1-29 — a write through it changes the file under
//              every name, outside the target included), or could not be read; `at` names it and
//              `reason` says what it is. The caller writes nothing and reports it. The readers that
//              ask readForWrite so as not to follow a link (the install marker, recordHolds) get the
//              same answer for a hard link, which is the safe one: a marker that is also another
//              repository's marker is not this target's record, and a file with another name is not
//              proof of what install wrote here.
// It only reads (lstat, and readUserFile for the final component), so it lives with the reader.
//
// Clear professional voice: this is a safety surface (installer reads of user content).

import { createHash } from "node:crypto";
import { accessSync, closeSync, constants, fstatSync, lstatSync, openSync, readSync, readdirSync, readlinkSync, realpathSync, statSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

export type UserFileRead =
  | { readonly state: "absent" }
  | { readonly state: "not-regular"; readonly kind: string }
  | { readonly state: "too-large"; readonly size: number }
  | { readonly state: "unreadable"; readonly code: string }
  // `mode` is the file's permission bits (st_mode & 0o7777) from the fstat of the descriptor the bytes
  // were read through (red-team L1 of plan 33.1-34): an install record carries the mode install wrote,
  // and install-marker.ts compares it with this one, so a chmod is a user edit like a byte change.
  | { readonly state: "ok"; readonly bytes: Buffer; readonly text: string; readonly mode: number };

/** The default size bound: no file the installer reads in a user repository is near this. */
export const USER_FILE_MAX_BYTES = 8 * 1024 * 1024;

// The part of a stat result this module reads. Declared structurally rather than imported, so the
// module's node:fs import list holds only the functions the census classifies.
interface StatShape {
  readonly dev: number;
  readonly ino: number;
  readonly size: number;
  readonly nlink: number;
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
    return { state: "ok", bytes, text: bytes.toString("utf8"), mode: st.mode & 0o7777 };
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
  | { readonly state: "ok"; readonly bytes: Buffer; readonly text: string; readonly mode: number }
  // `names` is set only when the path itself is a regular file with more than one name (a hard link):
  // how many names it has. A caller that words why it did not use the file (install-marker.ts
  // readOwnedContent, red-team of plan 33.1-30) names the hard link from it, not from `reason`'s text.
  | { readonly state: "blocked"; readonly at: string; readonly reason: string; readonly names?: number };

/**
 * What one existing path component is, by lstat: a real directory, nothing, or a reason it is neither.
 * For the final component (`wantDirectory` false) a regular file with more than one name is a reason
 * too (red-team carry #9, plan 33.1-29): a hard link is a second name for the same file, so a write,
 * an append or a rewrite in place through this name would change the file under its other names as
 * well, and one of them may be outside the target.
 */
function componentProblem(path: string, wantDirectory: boolean): "absent" | "fine" | string {
  const p = componentState(path, wantDirectory);
  return typeof p === "string" ? p : p.reason;
}

/** componentProblem, keeping the name count of a hard link (the one place both are decided). */
function componentState(path: string, wantDirectory: boolean): "absent" | "fine" | string | { readonly reason: string; readonly names: number } {
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
  if (!wantDirectory && st.isFile() && st.nlink > 1) {
    return {
      reason:
        `is a hard link (the same file has ${st.nlink} names, and another may be outside the target), and the ` +
        `installer never writes through a name that would change the file under its other names too`,
      names: st.nlink,
    };
  }
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
  const leaf = componentState(path, false);
  if (leaf === "absent") return { state: "create" };
  if (typeof leaf !== "string") return { state: "blocked", at: path, reason: leaf.reason, names: leaf.names };
  if (leaf !== "fine") return { state: "blocked", at: path, reason: leaf };
  const r = readUserFile(path, maxBytes);
  if (r.state === "ok") return r;
  // Gone since the lstat above: nothing is there, and the exclusive create refuses anything new.
  if (r.state === "absent") return { state: "create" };
  return { state: "blocked", at: path, reason: unreadState(r) };
}

// ── THE ONE SPELLING OF A RECORDED PATH (plan 34-11, D-19, defect class WIN-1) ───────────────────────
//
// WHY THIS EXISTS. The windows-latest run 37521787426 failed 91 tests with one message shape: the
// marker "was written for another directory (C:\Users\...\edit-default-1), not this one
// (C:/Users/.../edit-default-1)". Both strings name the same directory. The installer wrote its records
// (the marker `target`, the kit-home record `grugopsHome`) in one spelling, and the comparison read the
// recorded value back as raw bytes against this directory's real path in that spelling. A record written
// in the host's native spelling, which is the documented remedy for "the same repository moved", was
// therefore refused on Windows. Every absolute path install records, and every recorded path it compares,
// now passes through canonicalPathSpelling, on the write side and on the compare side.
//
// WHAT IT CHANGES. With the win32 flavor: the separators become forward slashes, a `\\?\UNC\` long-form
// prefix becomes `//` (the plain UNC form), a `\\?\` long-form prefix before a drive letter is dropped,
// and a leading drive letter is upper-cased (Windows drive letters are case-insensitive). Nothing else:
// no `.` or `..` resolution, no trailing-separator trim, no other case folding, so a cosmetic difference
// the doctor reports as such stays visible.
//
// WHY POSIX IS THE IDENTITY. On a POSIX file system a backslash is an ordinary filename byte: `/tmp/a\b`
// and `/tmp/a/b` are two different directories. Folding the backslash there (what the earlier inline
// `.replace(/\\/g, "/")` and install.ts's local toPosix did) made the installer record one directory under
// another's name. So the posix flavor returns the input unchanged.
//
// WHY THE FLAVOR IS A PARAMETER. The function branches only on the flavor it is given, never on the
// platform the process runs on, so a test hands it `path.win32` or `path.posix` and both spellings are
// exercised, and mutation-provable, on any host (install/canonical-path.test.ts). Production code omits
// it and gets the host's own node:path.
//
// WHY IT LIVES HERE AND NOT IN scripts/posix-path.ts. scripts/posix-path.ts is the scripts-side
// published-path normalizer, but install/ imports nothing from scripts/ (the installer runs from the
// shipped kit, D-18/D-28). This module already owns realTargetPath, the spelling of "which directory is
// this", so the one spelling authority for recorded paths lives beside it. No other installer site may
// spell or compare a recorded path another way; install/path-spelling-census.test.ts holds that.

/** The part of a node:path implementation the spelling reads: `path.win32`, `path.posix` or the host's. */
export interface PathFlavor {
  readonly sep: string;
  isAbsolute(p: string): boolean;
}

/** The host's own node:path, the flavor every production call uses. */
const HOST_FLAVOR: PathFlavor = { sep, isAbsolute };

/** Put `p` in the one spelling install records and compares (see THE ONE SPELLING above). */
export function canonicalPathSpelling(p: string, flavor: PathFlavor = HOST_FLAVOR): string {
  if (flavor.sep !== "\\") return p;
  let s = p.replace(/\\/g, "/");
  if (s.startsWith("//?/UNC/")) s = "//" + s.slice("//?/UNC/".length);
  else if (/^\/\/\?\/[A-Za-z]:/.test(s)) s = s.slice("//?/".length);
  if (/^[A-Za-z]:/.test(s)) s = s.charAt(0).toUpperCase() + s.slice(1);
  return s;
}

/**
 * THE ONE ABSOLUTENESS RULE FOR A RECORDED PATH (plan 34-21, D-23, review WR-09): whether `p` is an
 * absolute path under `flavor`, by the flavor's own isAbsolute and nothing else. The install marker's
 * `grugopsHome`, `kitRoot` and `target` (install-marker.ts installMarkerProblems) and the doctor's
 * kit-root spelling (absoluteSpelling below) ask this, so the rule that decides "absolute" cannot
 * disagree with the spelling that later binds the value. Under win32 a native UNC path (`\\srv\share\x`),
 * a `\\?\` long form and a drive path in either separator are absolute, and a drive-relative `C:x` is
 * not; under posix only a leading `/` is, so `C:/x` is a relative path there. A hand-written
 * leading-`/`-or-drive-letter test is the second rule this replaces: it refused a native UNC marker
 * target on Windows and accepted `C:/x` on POSIX. The flavor is a parameter, as for
 * canonicalPathSpelling, so a test proves both flavors on any host; production code omits it.
 */
export function isRecordedAbsolute(p: string, flavor: PathFlavor = HOST_FLAVOR): boolean {
  return flavor.isAbsolute(p);
}

/**
 * Whether a recorded path names the directory whose real path is `here`: both sides pass through
 * canonicalPathSpelling, so a record written in either spelling of one directory binds it, and two
 * different directories never compare equal (the spelling changes separators, the long-form prefix and
 * the drive-letter case only).
 */
export function sameRecordedPath(recorded: string, here: string, flavor: PathFlavor = HOST_FLAVOR): boolean {
  return canonicalPathSpelling(recorded, flavor) === canonicalPathSpelling(here, flavor);
}

/**
 * The doctor's absolute spelling of a recorded kit root (install.ts docAbspath, plan 34-11): an absolute
 * path, by isRecordedAbsolute (the flavor's own isAbsolute), in the one spelling and otherwise verbatim;
 * a relative path prefixed with the canonical spelling of `cwd` and a `/`, the path itself unchanged. No
 * `.` or `..` collapse and no trailing-slash trim, so a cosmetic kitRoot difference still reads as one.
 * The one absoluteness rule replaces a leading-`/` test, which read a Windows `C:/…` path as relative.
 */
export function absoluteSpelling(p: string, cwd: string, flavor: PathFlavor = HOST_FLAVOR): string {
  if (isRecordedAbsolute(p, flavor)) return canonicalPathSpelling(p, flavor);
  return `${canonicalPathSpelling(cwd, flavor)}/${p}`;
}

// realTargetPath (red-team B2 of plan 33.1-33, brief DC-2): the one spelling of "which directory is this"
// that the install marker is bound to. The operating system's own real path (realpath(3) through
// realpathSync.native): every symbolic link on the way resolved and, on a case-insensitive volume, the
// case the directory really has, so `--target /tmp/x`, `--target /private/tmp/x` and a differently cased
// spelling of the same directory all give one answer. On Windows it also expands an 8.3 short name
// (`RUNNER~1`) to the long one, which the JS realpathSync does not. Spelled by canonicalPathSpelling, as
// every path the marker records is. null when the path cannot be resolved (it does not exist, or a
// component cannot be searched): a directory with no real path cannot be shown to be the one a marker
// names. It reads no file content.
export function realTargetPath(target: string): string | null {
  try {
    return canonicalPathSpelling(realpathSync.native(target));
  } catch {
    return null;
  }
}

// realPathThroughExisting (plan 33.1-37, review CR-01): the real location of a path that may not exist
// yet. install.ts compares the kit root, the kit home and the target by real path before any write, and
// on a first install the kit home (and often the kit root) does not exist: realTargetPath would answer
// null for it, and a check that gave up there would have to refuse every first install or skip the
// comparison. So the path is resolved, the deepest ancestor that exists (by lstat) is found, its real path
// is taken with realpathSync.native (every link on the way to it resolved, and on a case-insensitive
// volume the case the directory really has), and the missing remainder is appended unchanged. Nothing
// below that ancestor exists, so no link can hide in the remainder. Spelled by canonicalPathSpelling, as
// realTargetPath.
// null when the ancestor's real path cannot be read (a dangling link, a component that cannot be
// searched, a non-directory on the way): the caller cannot show where the path is, and refuses. It reads
// no file content.
export function realPathThroughExisting(p: string): string | null {
  let cur = resolve(p);
  const rest: string[] = [];
  for (;;) {
    try {
      lstatSync(cur);
      break;
    } catch (e) {
      if (codeOf(e) !== "ENOENT") return null;
      const up = dirname(cur);
      if (up === cur) return null;
      rest.unshift(basename(cur));
      cur = up;
    }
  }
  try {
    return canonicalPathSpelling(join(realpathSync.native(cur), ...rest));
  } catch {
    return null;
  }
}

// ── THE TREE RECORD (plan 33.1-37, D-33 (c)) ──────────────────────────────────────────────────────
//
// WHY A BACKUP'S CONTENT RECORD COVERS A WHOLE TREE. Install records every backup it makes, so a later
// prune (plan 33.1-40) can remove one only while it is still exactly what install left. A backup is
// often a directory (the displaced kit at the kit root, the in-repo agent-factory/ --migrate moves
// aside), and a user may add a file inside it, edit one, or swap one for a link after install made it.
// A record of the directory's NAME would let prune delete those changes with it (brief DC-2). So the
// record is the sha256 of one line per entry under the path, in sorted order, each naming the entry's
// relative path and what it is:
//   `<json rel>\tdir <mode>`            a directory (the path itself is `"."`);
//   `<json rel>\tfile <sha256> <mode>`  a regular file, read through readUserFile within its bound;
//   `<json rel>\tlink <json readlink>`  a symbolic link, never followed;
//   `<json rel>\tother`                 a FIFO, socket or device, never opened.
// The relative path is JSON-quoted, so a name holding a tab or a newline cannot forge a second line.
//
// WHY null MEANS "NEVER PROVE IT". treeRecord returns null when any entry cannot be read (lstat,
// readdir, readlink or readUserFile fails), a file is over readUserFile's bound, the walk passes
// TREE_MAX_ENTRIES entries or TREE_MAX_BYTES bytes of file content, or the path itself is a FIFO,
// socket or device. A backup recorded with a null content record can never be shown to be unchanged,
// so nothing that acts only on proof (prune) will ever remove it: the bound fails safe.
//
// A path that is a regular file gets the file record (`sha256:<hex>;mode=<octal>`) and a path that is a
// link gets the link record (`link:<target>`), the same grammar install-marker.ts uses for a `file`
// entry, so one backup entry can hold a file, a link or a tree. It walks with lstat and readdirSync
// only, follows no link, and opens nothing but the regular files readUserFile reads.

/** The most entries treeRecord walks before it answers null (a kit is a few hundred). */
export const TREE_MAX_ENTRIES = 20_000;
/** The most bytes of file content treeRecord hashes before it answers null. */
export const TREE_MAX_BYTES = 256 * 1024 * 1024;

const sha256Hex = (data: Buffer | string): string => createHash("sha256").update(data).digest("hex");
/**
 * THE ONE FILE-MODE RENDERER (plan 34-13, WIN-2): the permission bits of a mode (`mode & 0o7777`) in four
 * octal digits, as every record writes them (a tree record line here, a file record in install-marker.ts,
 * which re-exports it). A mode is only ever rendered from what the platform stored (an lstat or fstat), so
 * two renderings compare what the platform kept: on Windows that is the read-only attribute alone.
 */
export const modeText = (mode: number): string => (mode & 0o7777).toString(8).padStart(4, "0");

/**
 * The content record of `rel` (a POSIX path relative to `root`) as it stands now: `tree:sha256:<hex>`
 * for a directory, the file record for a regular file, the link record for a link, or null (see THE
 * TREE RECORD above).
 */
export function treeRecord(root: string, rel: string): string | null {
  const top = join(root, ...rel.split("/"));
  let st: StatShape & { readonly mode: number };
  try {
    st = lstatSync(top);
  } catch {
    return null;
  }
  if (st.isSymbolicLink()) {
    try {
      return `link:${readlinkSync(top)}`;
    } catch {
      return null;
    }
  }
  if (st.isFile()) {
    const r = readUserFile(top);
    return r.state === "ok" ? `sha256:${sha256Hex(r.bytes)};mode=${modeText(r.mode)}` : null;
  }
  if (!st.isDirectory()) return null;
  const lines: string[] = [`${JSON.stringify(".")}\tdir ${modeText(st.mode)}`];
  let entries = 0;
  let bytes = 0;
  const walk = (dirRel: string): boolean => {
    let names: string[];
    try {
      names = readdirSync(dirRel === "" ? top : join(top, ...dirRel.split("/")));
    } catch {
      return false;
    }
    for (const name of names) {
      entries += 1;
      if (entries > TREE_MAX_ENTRIES) return false;
      const childRel = dirRel === "" ? name : `${dirRel}/${name}`;
      const abs = join(top, ...childRel.split("/"));
      let cst: StatShape & { readonly mode: number };
      try {
        cst = lstatSync(abs);
      } catch {
        return false;
      }
      const q = JSON.stringify(childRel);
      if (cst.isSymbolicLink()) {
        try {
          lines.push(`${q}\tlink ${JSON.stringify(readlinkSync(abs))}`);
        } catch {
          return false;
        }
      } else if (cst.isDirectory()) {
        lines.push(`${q}\tdir ${modeText(cst.mode)}`);
        if (!walk(childRel)) return false;
      } else if (cst.isFile()) {
        const r = readUserFile(abs);
        if (r.state !== "ok") return false;
        bytes += r.bytes.length;
        if (bytes > TREE_MAX_BYTES) return false;
        lines.push(`${q}\tfile ${sha256Hex(r.bytes)} ${modeText(r.mode)}`);
      } else {
        lines.push(`${q}\tother`);
      }
    }
    return true;
  };
  if (!walk("")) return null;
  return `tree:sha256:${sha256Hex(lines.sort().join("\n"))}`;
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
 * isOwnLink: `dest` is a symbolic link whose target names `src` — the link a --symlink install makes
 * (install.ts linkOrCopy's symlinkSync(src, dest)). THE ONE OWNERSHIP PREDICATE FOR A LINK, shared by
 * both binaries (red-team of plan 33.1-27, B2): install skips such a link as its own and refuses every
 * other link at a path it writes; uninstall removes a link only when it is this link, and leaves every
 * other link (a loop, a dangling link, a link to a device, a FIFO, a directory or a file anywhere else)
 * in place with a verify. It reads only the link itself (lstat and readlink), never what it points at.
 *
 * WHAT IT COMPARES (plan 34-21, D-23, WIN-1). The readlink result and `src` are compared through
 * sameRecordedPath, the one comparison of a recorded path, not as bytes, so the readback and the record
 * are compared in one spelling, as every other recorded path is. Whether Windows hands an absolute link
 * target back in another spelling than the one symlinkSync was given is `UNKNOWN - verify` (WINDOWS.md
 * row 319 records a rooted target read back drive-qualified; no product link is measured on
 * windows-latest, because the link cases skip there). Nothing new is owned
 * by this. Under the posix flavor the spelling is the identity, so the comparison is byte equality as
 * before; under win32 it folds only spellings Windows itself treats as one path (the separators, the
 * `\\?\` long-form prefix, the drive-letter case), so a link is owned only when it points at the
 * recorded source. Every other case is false: a link to another path, a relative target (it never
 * spells an absolute `src`), a path that is not a link, and any lstat or readlink error. Ownership
 * still needs the install record (install-marker.ts checkRecord's `link:` arm, uninstall.ts's recorded
 * link): nothing is removed because a link merely matches (brief DC-2). The flavor is a parameter for
 * the tests (install/canonical-path.test.ts); production code omits it.
 */
export function isOwnLink(dest: string, src: string, flavor: PathFlavor = HOST_FLAVOR): boolean {
  try {
    return lstatSync(dest).isSymbolicLink() && sameRecordedPath(readlinkSync(dest), src, flavor);
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

// ── THE KIT PLAN'S TWO LIMIT QUESTIONS (red-team of plan 33.1-31, borderline (a) and (b)) ──────────
//
// install.ts buildKitPlan asks both about every kit destination BEFORE the first kit write, so a
// destination that cannot be written refuses the whole kit instead of failing in the write phase
// after other kit files were already written (a mixed kit, D-32). Neither writes anything.

/**
 * The platform path limits, in bytes of the UTF-8 path string passed to the system call.
 *
 * NAME_MAX, the longest single path component: 255 bytes on Linux (<linux/limits.h> NAME_MAX 255)
 * and on macOS (<sys/syslimits.h> NAME_MAX 255; APFS and HFS+ both cap a name at 255).
 *
 * PATH_MAX, the longest whole path, COUNTING THE TERMINATING NUL, so the longest usable path is one
 * byte less: 4096 on Linux (<linux/limits.h> PATH_MAX 4096) and 1024 on macOS (<sys/syslimits.h>
 * PATH_MAX 1024). Every other platform takes the smaller value, 1024, the conservative answer
 * (FreeBSD's <sys/syslimits.h> is 1024 too; Windows is out of scope for 33.1, D-15).
 */
export const NAME_MAX_BYTES = 255;
export const PATH_MAX_BYTES = process.platform === "linux" ? 4096 : 1024;

/**
 * Why `path` cannot be created on this platform, or null. The whole path must be shorter than
 * PATH_MAX bytes and every component at most NAME_MAX bytes, counted in UTF-8. A write to a path over
 * either limit fails with ENAMETOOLONG, and readForWrite cannot see that ahead of time when a
 * directory on the way does not exist yet (it answers `create` at the first absent directory).
 */
export function pathLimitProblem(path: string): string | null {
  const bytes = Buffer.byteLength(path, "utf8");
  if (bytes >= PATH_MAX_BYTES) {
    return (
      `is ${bytes} bytes long, over this platform's path limit of ${PATH_MAX_BYTES - 1} bytes ` +
      `(PATH_MAX ${PATH_MAX_BYTES}, which counts the terminating NUL), so it cannot be created`
    );
  }
  for (const part of path.split(sep)) {
    const n = Buffer.byteLength(part, "utf8");
    if (n > NAME_MAX_BYTES) {
      return (
        `has a component of ${n} bytes, over this platform's name limit of ${NAME_MAX_BYTES} bytes ` +
        `(NAME_MAX), so it cannot be created`
      );
    }
  }
  return null;
}

/**
 * Why this process cannot make the write readForWrite answered for `path`, or null. It only asks
 * access(2); it opens and writes nothing.
 *   `create`  the nearest directory that exists on the way to `path` must be writable and searchable:
 *             every missing directory below it, and the file, are made in it.
 *   `ok`      the regular file itself must be writable: a rewrite opens it for writing in place.
 *   `unlink`  the directory holding `path` must be writable and searchable: the entry is removed from
 *             it and the new file is created in it.
 * The caller has already asked readForWrite (every existing component on the way is a real
 * directory), so the walk up for `create` follows no link. As root, access(2) answers yes except on a
 * read-only filesystem, which is the answer the write itself would give.
 */
export function writeAccessProblem(path: string, how: "create" | "ok" | "unlink"): string | null {
  const ask = (p: string, mode: number): string | null => {
    try {
      accessSync(p, mode);
      return null;
    } catch (e) {
      return codeOf(e);
    }
  };
  if (how === "ok") {
    const code = ask(path, constants.W_OK);
    return code === null ? null : `is not writable by this process (${code}), so it cannot be rewritten in place`;
  }
  let dir = dirname(path);
  if (how === "create") {
    for (;;) {
      try {
        lstatSync(dir);
        break;
      } catch (e) {
        const up = dirname(dir);
        if (codeOf(e) !== "ENOENT" || up === dir) return `could not be placed: ${dir} could not be read (${codeOf(e)})`;
        dir = up;
      }
    }
  }
  const code = ask(dir, constants.W_OK | constants.X_OK);
  return code === null
    ? null
    : `cannot be ${how === "create" ? "created" : "replaced"}: ${dir} is not writable by this process (${code})`;
}
