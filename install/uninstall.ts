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
// Removes ONLY what install.ts added:
//   - the skills install.ts laid down: .claude/skills/<name>/SKILL.md (and the now-empty dirs)
//   - the adapters install.ts laid down: .claude/agents/<file>.md (and the now-empty dir)
//   - the AGENTS.md grugops laid down  (ONLY if it is a symlink into the grugops source, or a
//     copy byte-identical to the source — a user's own AGENTS.md is never removed)
//   - the CLAUDE.md "GSD:grugops-start-here" sentinel block (only that block; the rest of the
//     user's CLAUDE.md is preserved verbatim)
//   - the .gemini/settings.json context.fileName entry it added  (AGENTS.md removed from the
//     array; the file and any other keys are preserved; the file is deleted only if grugops
//     created it and it is now back to its empty-default shape)
//   - the .github/copilot-instructions.md sentinel block (only that block)
//   - the .grugops/install.json marker (the one grugops-owned file under .grugops/ — D-06)
//
// It NEVER deletes agent-factory/, plans/, .planning/, docs/, src/, the seeded per-repo state
// (.grugops/factory.config.json, plans/, memory-bank/), the shared kit at $GRUGOPS_HOME, or any
// user file. Those paths are guarded explicitly; only the install.json marker is removed from
// under the otherwise-protected .grugops/, via a narrow named exception. Removing the shared
// $GRUGOPS_HOME kit is a manual `rm` (no --purge-kit flag this phase). Honors DRY_RUN=1.
//
// Every report/warn/error string stays CLEAR PROFESSIONAL VOICE — safety surface, never caveman.
//
// Usage:
//   node install/uninstall.js                       # remove grugops adapters from the current repo
//   node install/uninstall.js --allow-self          # override the self-checkout guard (CR-04)
//   DRY_RUN=1 node install/uninstall.js             # preview only
//   GRUGOPS_SRC=/path TARGET=/path node install/uninstall.js

import {
  existsSync,
  rmSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
  rmdirSync,
  lstatSync,
  readlinkSync,
  realpathSync,
} from "node:fs";
import { join, resolve, isAbsolute } from "node:path";
// KIT-02 / D-28: the ONE derivation of "what is in the kit source", shared with install.ts, so the
// REMOVAL set and the INSTALL set can never be two answers to one predicate again (CR-02). Only the
// two derivations this file uses are imported — see the kit-set derivation block below for why
// srcNestedAdapterFiles() is not one of them. Node stdlib only, sibling module inside install/, so
// this binary still runs on a host with nothing installed.
import { srcSkillNames, srcAdapterFiles, hasSourceMarkers } from "./kit-source.js";

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
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--target") {
    ARG_TARGET = argv[++i] ?? "";
  } else if (a.startsWith("--target=")) {
    ARG_TARGET = a.slice("--target=".length);
  } else if (a === "--allow-self" || a === "--force") {
    ALLOW_SELF = true;
  } else {
    process.stderr.write(`uninstall.js: unknown argument: ${a}\n`);
    process.exit(2);
  }
}

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

// ---------------------------------------------------------------------------
// Kit-set derivation (KIT-02 / T-27-06). The hand-listed SKILLS array and the single AGENT_REL
// constant that used to live here were DUPLICATED LITERALS in a second file: editing only
// install.ts would have left this uninstaller removing exactly one adapter and orphaning the rest.
// The removal set is derived from the same $GRUGOPS_SRC root the installer installs from.
//
// AND THEN THE MIRROR ITSELF WAS THE DUPLICATE (D-28, closing CR-02). Replacing the literals with a
// hand-synced CODE mirror of install.ts's helpers only moved the drift one level up. That pair —
// recorded in the foundation guards' set-literal inventory as a declared BYTE-IDENTICAL PAIR —
// drifted twice inside phase 27: round 1 re-synced it, then plan 27-22 moved install.ts onto
// statSync for WR-02 and left this file on Dirent flags. A Dirent for a symlink is NEITHER isFile()
// NOR isDirectory(), so a symlinked source adapter was installed by install.js and never removed
// here, under `== uninstall complete ==` and exit 0. The remedy is structural: the derivation moved
// into ./kit-source.ts and BOTH installers import it, so THE REMOVAL SET AND THE INSTALL SET ARE
// NOW LITERALLY THE SAME DERIVATION and the reversal cannot be narrower than the install. Do not
// re-inline a copy of either helper here on the argument that it is small — that is the defect.
//
// THE REMOVAL SET IS DERIVED FROM THE KIT SOURCE, NEVER FROM THE TARGET. Listing the target's own
// .claude/agents/ directory and deleting what is there would delete the user's own agent files —
// a data-loss bug against the hard constraint that installers never delete user content. The
// derived set is intersected with what actually exists in the target, and only that intersection
// is removed.
//
// Both helpers return NULL — not [] — when the source directory cannot be read. Null is the
// fail-LOUD signal: the caller reports the condition and skips that removal class entirely, leaving
// the files for the user to remove by hand. It never falls back to target-derived deletion and
// never claims a clean uninstall it did not perform (T-27-09). The full contract lives in
// kit-source.ts's header.
//
// ONLY the two derivations this file USES are imported. srcNestedAdapterFiles() is deliberately not
// among them: a nested source adapter is REFUSED by the installer and never installed, so there is
// nothing in the target for the reversal to remove. Importing it here would invent a removal class
// for files that were never laid down.
//
// The source root is passed EXPLICITLY on every call (D-22) — kit-source resolves no root of its
// own, so the GRUGOPS_SRC resolved above stays this file's single source of truth for where the kit
// is, exactly as it is install.ts's. The import itself sits with the other imports at the top of
// the file.
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

// remove_file: delete a single file if present, after the protection guard. Never recursive.
function removeFile(f: string, label: string): void {
  if (isProtected(f)) {
    report("refused", `${label} (protected path — never removed)`);
    return;
  }
  if (!pathExists(f)) {
    report("skipped", `${label} (not present)`);
    return;
  }
  if (DRY_RUN) {
    report("would-remove", label);
    return;
  }
  rmSync(f, { force: true });
  report("removed", label);
}

// rmdir_if_empty: remove a now-empty grugops-owned dir (never recursive, never -f a tree).
function rmdirIfEmpty(d: string): void {
  if (isProtected(d)) return;
  if (!isDir(d)) return;
  if (DRY_RUN) {
    // would only remove if empty; rmdir fails on non-empty, so just narrate the attempt
    try {
      rmdirSync(d);
      report("would-rmdir", d);
    } catch {
      // non-empty → nothing to narrate
    }
    return;
  }
  try {
    rmdirSync(d);
    report("rmdir", d);
  } catch {
    // non-empty → leave it
  }
}

// remove_sentinel_block: strip exactly the open..close sentinel block from a user file,
// preserving every other line. Idempotent (no block → no-op). Never truncates the whole file.
function removeSentinelBlock(f: string, open: string, close: string, label: string): void {
  if (isProtected(f)) {
    report("refused", `${label} (protected path)`);
    return;
  }
  let text: string;
  if (!isFile(f)) {
    report("skipped", `${label} (no grugops block present)`);
    return;
  }
  try {
    text = readFileSync(f, "utf8");
  } catch {
    report("skipped", `${label} (no grugops block present)`);
    return;
  }
  if (!text.includes(open)) {
    report("skipped", `${label} (no grugops block present)`);
    return;
  }
  if (DRY_RUN) {
    report("would-remove", `${label} (sentinel block only)`);
    return;
  }
  // Drop the open..close block. install.ts prepends one blank line before the block; we buffer
  // pending blank lines and emit them only when a real line follows, which trims that separator
  // blank when the block is at end-of-file.
  //
  // CR-01 (bounded removal): an UNTERMINATED open marker (close sentinel missing because the
  // file was hand-edited or a prior run was interrupted) must NEVER cause every line after the
  // open marker to be deleted — that is silent loss of user content. We buffer the block lines
  // and only commit the deletion when a matching close is actually seen; if inblk is still set
  // at END, the block never closed, so we emit the buffered lines unchanged (remove nothing).
  //
  // The sh awk reads line-records split on "\n". readFileSync preserves a trailing newline as a
  // trailing empty field on split("\n"); awk does not emit that phantom empty record, so we drop
  // a single trailing "" before processing and re-add the trailing newline on write — preserving
  // the sh byte output.
  const rawLines = text.split("\n");
  const hadTrailingNewline = rawLines.length > 0 && rawLines[rawLines.length - 1] === "";
  const lines = hadTrailingNewline ? rawLines.slice(0, -1) : rawLines;
  const out: string[] = [];
  let inblk = false;
  let pend = 0;
  let buf: string[] = [];
  for (const line of lines) {
    if (line === open) {
      inblk = true;
      buf = [];
      continue;
    }
    if (inblk) {
      if (line === close) {
        inblk = false; // terminated block → drop the buffer
      } else {
        buf.push(line); // buffer until we know it terminates
      }
      continue;
    }
    if (line === "") {
      pend += 1;
      continue;
    }
    while (pend > 0) {
      out.push("");
      pend -= 1;
    }
    out.push(line);
  }
  // Unterminated open at EOF: the block never closed → restore what we buffered (lose nothing).
  if (inblk && buf.length > 0) {
    for (const line of buf) out.push(line);
  }
  // Reconstruct with a trailing newline (awk's print adds a newline after every emitted record).
  const result = out.length > 0 ? out.join("\n") + "\n" : "";
  writeFileSync(f, result);
  report("removed", `${label} (sentinel block only; rest of file preserved)`);
}

// remove_if_empty: delete a file grugops created if it is now empty / whitespace-only after its
// sentinel block was stripped. Used for the optional Copilot pointer (when grugops created the
// file fresh, removing the block leaves it empty → fully reverse it). Guarded; never recursive.
function removeIfEmpty(f: string, label: string): void {
  if (isProtected(f)) return;
  if (!isFile(f)) return;
  let content: string;
  try {
    content = readFileSync(f, "utf8");
  } catch {
    return;
  }
  // whitespace-only (or zero-byte) → remove
  if (content.replace(/[ \t\n\r]/g, "") === "") {
    if (DRY_RUN) {
      report("would-remove", `${label} (empty after block removal)`);
      return;
    }
    rmSync(f, { force: true });
    report("removed", `${label} (file empty after block removal — grugops-created)`);
  }
}

// Gemini settings shape — the unmerge target.
interface GeminiSettings {
  context?: { fileName?: string[] | string };
  [key: string]: unknown;
}

// unmerge_gemini: remove AGENTS.md from .gemini/settings.json context.fileName via a safe JSON
// edit (Node is always present now — this is a TS routine). If grugops created the file and it
// returns to the empty-default shape, the file is removed; otherwise other keys are preserved.
function unmergeGemini(): void {
  const f = `${TARGET}/.gemini/settings.json`;
  if (isProtected(f)) return;
  if (!isFile(f)) {
    report("skipped", ".gemini/settings.json (not present)");
    return;
  }
  let raw: string;
  try {
    raw = readFileSync(f, "utf8");
  } catch {
    report("skipped", ".gemini/settings.json (not present)");
    return;
  }
  if (!raw.includes("AGENTS.md")) {
    report("skipped", ".gemini/settings.json (no AGENTS.md entry to remove)");
    return;
  }
  if (DRY_RUN) {
    report("would-edit", ".gemini/settings.json (remove AGENTS.md from context.fileName)");
    return;
  }
  let j: GeminiSettings;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      process.stderr.write("verify: settings.json not valid JSON; left untouched\n");
      report("removed", ".gemini/settings.json AGENTS.md entry (Node JSON edit; grugops-created file removed if now empty)");
      return;
    }
    j = parsed as GeminiSettings;
  } catch {
    process.stderr.write("verify: settings.json not valid JSON; left untouched\n");
    report("removed", ".gemini/settings.json AGENTS.md entry (Node JSON edit; grugops-created file removed if now empty)");
    return;
  }
  // If the file is EXACTLY the grugops-created default shape (only context.fileName, and it lists
  // just AGENTS.md and/or GEMINI.md and nothing else), grugops owns the whole file → remove it
  // entirely to fully reverse the "created fresh" install path.
  const keys = Object.keys(j);
  const ctxKeys = j.context ? Object.keys(j.context) : [];
  const fn = j.context && Array.isArray(j.context.fileName) ? j.context.fileName : null;
  const onlyGrugopsEntries = fn !== null && fn.every((x) => x === "AGENTS.md" || x === "GEMINI.md");
  const isGrugopsDefault =
    keys.length === 1 &&
    keys[0] === "context" &&
    ctxKeys.length === 1 &&
    ctxKeys[0] === "fileName" &&
    onlyGrugopsEntries;
  if (isGrugopsDefault) {
    unlinkSync(f);
  } else {
    // Pre-existing / user-customised file: trim only AGENTS.md, preserve everything else.
    const ctx = j.context || {};
    let list = Array.isArray(ctx.fileName) ? ctx.fileName : [];
    list = list.filter((x) => x !== "AGENTS.md");
    if (list.length === 0) {
      delete ctx.fileName;
    } else {
      ctx.fileName = list;
    }
    if (Object.keys(ctx).length === 0) delete j.context;
    else j.context = ctx;
    if (Object.keys(j).length === 0) {
      unlinkSync(f);
    } else {
      writeFileSync(f, JSON.stringify(j, null, 2) + "\n");
    }
  }
  report("removed", ".gemini/settings.json AGENTS.md entry (Node JSON edit; grugops-created file removed if now empty)");
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
function removeMarker(): void {
  const m = `${TARGET}/.grugops/install.json`;
  if (!pathExists(m)) {
    report("skipped", ".grugops/install.json (marker not present)");
    return;
  }
  if (DRY_RUN) {
    report("would-remove", ".grugops/install.json (grugops-owned marker)");
    return;
  }
  rmSync(m, { force: true });
  report("removed", ".grugops/install.json (grugops-owned marker; seeded .grugops/ state preserved)");
}

// sameFileBytes: byte-identical content compare following symlinks (mirrors `cmp -s`). Used for
// the grugops-owned-AGENTS.md tests.
function sameFileBytes(a: string, b: string): boolean {
  try {
    return readFileSync(a).equals(readFileSync(b));
  } catch {
    return false;
  }
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
  const toPosix = (p: string): string => p.replace(/\\/g, "/");
  const looksLikeSource = toPosix(resolve(TARGET)) === toPosix(GRUGOPS_SRC) || hasSourceMarkers(TARGET);
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

// ORDERING HAZARD (T-27-06): derive the removal set from the KIT SOURCE here, at the very TOP of
// the removal sequence, BEFORE anything is removed. The uninstall sequence also tears down grugops
// wiring, so a derivation taken later in the sequence could come back empty and silently orphan
// every file it was supposed to remove.
const SRC_SKILLS = srcSkillNames(GRUGOPS_SRC);
const SRC_ADAPTERS = srcAdapterFiles(GRUGOPS_SRC);

console.log("\n-- removing grugops adapters (only what install.js added) --");

// 1. Skills + empty dirs. Derived from the kit source, intersected with the target: a skill the
//    kit ships but the target never had is reported and skipped, never "removed".
if (SRC_SKILLS === null) {
  verify(
    `.claude/skills/ — cannot read ${join(GRUGOPS_SRC, ".claude", "skills")}, so the removal set is unknown. ` +
      `No skill was removed. Remove any leftover grugops skill directories by hand.`,
  );
} else {
  for (const s of SRC_SKILLS) {
    const rel = `.claude/skills/${s}/SKILL.md`;
    const f = `${TARGET}/${rel}`;
    if (pathExists(f)) removeFile(f, rel);
    else report("skipped", `${rel} (not present in the target — outside the removal set)`);
    rmdirIfEmpty(`${TARGET}/.claude/skills/${s}`);
  }
  rmdirIfEmpty(`${TARGET}/.claude/skills`);
}

// 2. Adapters + empty dir. Same contract: the set comes from the kit source and is intersected with
//    the target, so a user-authored file in .claude/agents/ is never in the removal set and
//    survives. The directory itself is only rmdir'd when it is empty, so a surviving user file also
//    keeps the directory.
if (SRC_ADAPTERS === null) {
  verify(
    `.claude/agents/ — cannot read ${join(GRUGOPS_SRC, ".claude", "agents")}, so the removal set is unknown. ` +
      `No adapter was removed. Remove any leftover grugops adapters by hand.`,
  );
} else {
  for (const a of SRC_ADAPTERS) {
    const rel = `.claude/agents/${a}`;
    const f = `${TARGET}/${rel}`;
    if (pathExists(f)) removeFile(f, rel);
    else report("skipped", `${rel} (not present in the target — outside the removal set)`);
  }
  rmdirIfEmpty(`${TARGET}/.claude/agents`);
}
rmdirIfEmpty(`${TARGET}/.claude`);

// 3. AGENTS.md — remove ONLY a grugops-laid-down one (symlink into source, or byte-identical
//    copy of the source AGENTS.md). A user's own AGENTS.md is never removed.
const agents = `${TARGET}/AGENTS.md`;
const srcAgents = `${GRUGOPS_SRC}/AGENTS.md`;
if (isProtected(agents)) {
  // never
} else if (isSymlink(agents)) {
  // A symlink is removed ONLY if it resolves to the grugops source AGENTS.md. Following the link
  // and comparing resolved content is exactly the byte-identical test used for the copy branch
  // below. A user's own AGENTS.md symlink (e.g. AGENTS.md -> docs/agents.md) resolves to other
  // content, fails the compare, and is left untouched. Reject any symlink that does not resolve to
  // the source.
  let resolvesToSource = false;
  try {
    // readlinkSync to confirm it is a link; realpathSync + byte-compare to confirm the resolved
    // target matches the source (cmp -s follows the link).
    readlinkSync(agents);
    if (isFile(srcAgents)) {
      const resolved = realpathSync(agents);
      resolvesToSource = sameFileBytes(resolved, srcAgents);
    }
  } catch {
    resolvesToSource = false;
  }
  if (resolvesToSource) {
    removeFile(agents, "AGENTS.md (grugops symlink into source)");
  } else {
    report("skipped", "AGENTS.md (user-owned symlink — left untouched)");
  }
} else if (isFile(agents) && isFile(srcAgents) && sameFileBytes(srcAgents, agents)) {
  removeFile(agents, "AGENTS.md (grugops copy, byte-identical to source)");
} else {
  report("skipped", "AGENTS.md (user-owned or modified — left untouched)");
}

// 4. CLAUDE.md sentinel block (preserve the rest of the user's file).
removeSentinelBlock(`${TARGET}/CLAUDE.md`, CLAUDE_OPEN, CLAUDE_CLOSE, "CLAUDE.md start-here pointer");

// 5. Gemini settings entry.
unmergeGemini();
rmdirIfEmpty(`${TARGET}/.gemini`);

// 6. Copilot pointer block (and remove the file if grugops created it and it is now empty). Uses
//    the Copilot-specific sentinel (WR-05), not the CLAUDE.md one.
removeSentinelBlock(`${TARGET}/${COPILOT_REL}`, COPILOT_OPEN, COPILOT_CLOSE, `${COPILOT_REL} pointer`);
removeIfEmpty(`${TARGET}/${COPILOT_REL}`, COPILOT_REL);
rmdirIfEmpty(`${TARGET}/.github`);

// 7. The kit-shipped RUNNABLES the installer materializes into the user's repository (WR-04,
//    plan 27-13). This pass is the missing half of the installer's reversibility constraint: before
//    it, install.ts's materializeRunnable() wrote tools/grugops/*.js into the user's repo and this
//    file never mentioned tools/ at all, so those files were installed and never removed.
//
//    THE MAPPING IS MIRRORED FROM THE INSTALLER, NOT RE-DERIVED FROM THE TARGET. Listing whatever
//    happens to be in the target's tools/grugops/ and deleting it would delete the user's own files
//    — the same data-loss shape the adapter pass avoids by deriving from the kit source. This is a
//    source→dest MAPPING (not a discovery set), so a literal is the right shape for it; it is kept
//    byte-identical to install.ts's RUNNABLES, and each file points at the other in a comment.
//
//    GUARDED TWICE, because these files land OUTSIDE the directories this uninstaller normally
//    owns:
//      1. every candidate goes through removeFile(), which checks the isProtected denylist BEFORE
//         touching anything, so no frozen-core or user-data path is reachable from this pass; and
//      2. a file is removed ONLY when its bytes are identical to the source it was installed from.
//         A user-edited helper is PRESERVED and the skip is reported with its reason — the exact
//         mirror of the installer's own never-overwrite rule for the same file (T-27-60).
//    An unreadable/missing SOURCE is a verify finding, not a silent skip: without the source we
//    cannot establish byte identity, so we cannot safely remove, and the human must be told.
const RUNNABLES_MIRROR: Array<[string, string]> = [
  ["scripts/runnable-ref/reference-check.js", "tools/grugops/reference-check.js"],
  ["scripts/runnable-ref/test-skip-integrity.js", "tools/grugops/test-skip-integrity.js"],
];

console.log("\n-- removing grugops runnables (only what install.js materialized) --");
for (const [srcRel, destRel] of RUNNABLES_MIRROR) {
  const src = `${GRUGOPS_SRC}/${srcRel}`;
  const dest = `${TARGET}/${destRel}`;
  if (isProtected(dest)) {
    report("refused", `${destRel} (protected path — never removed)`);
    continue;
  }
  if (!pathExists(dest)) {
    report("skipped", `${destRel} (not present)`);
    continue;
  }
  if (!isFile(src)) {
    verify(
      `${destRel} — cannot read the source it was installed from (${src}), so byte identity cannot ` +
        `be established and the file was NOT removed. Remove it by hand once you have confirmed it ` +
        `is unmodified.`,
    );
    continue;
  }
  if (!sameFileBytes(src, dest)) {
    report("skipped", `${destRel} (user-modified — left untouched, never-delete-user-content)`);
    continue;
  }
  removeFile(dest, `${destRel} (grugops runnable, byte-identical to source)`);
}
// Only the CONTAINING directory, and only when empty — never a recursive removal.
rmdirIfEmpty(`${TARGET}/tools/grugops`);
// tools/ itself is deliberately NOT removed, even when the pass above just left it empty. grugops
// owns tools/grugops/; it does not own tools/, which is an ordinary directory name a project is very
// likely to own itself, and mkdirp created it only as a side effect of creating the namespaced
// child. Deleting it would be deleting a directory that is not ours. It is REPORTED as left rather
// than passing silently, so the one artifact this pass cannot reverse is visible to the reader.
if (isDir(`${TARGET}/tools`)) {
  report("left", "tools/ (grugops owns tools/grugops/ only — the directory itself is left in place)");
}

// 8. The grugops-owned install marker (D-06). Removes ONLY .grugops/install.json via the narrow
//    named exception; the rest of .grugops/ (seeded user state) is protected and survives. The
//    .grugops/ dir is intentionally NOT rmdir'd — the seeded factory.config.json keeps it
//    populated, and even an empty .grugops/ is the user's state dir, not grugops' to remove.
//    Never remove $GRUGOPS_HOME — the shared kit is shared across repos; manual rm only.
removeMarker();

console.log("\n-- preserved (never touched) --");
console.log("  agent-factory/  plans/  .planning/  docs/  src/  .grugops/ (seeded state; only the");
console.log("  install.json marker is removed)  the shared kit at $GRUGOPS_HOME  and every user file.");
// THE CLOSING CLAIM IS CONDITIONAL (27-13) — the same rule as install.ts's banner. A run that could
// not read a source directory has skipped a whole removal class; saying "complete" over that is a
// claim it did not earn. The `verify` lines above name what was left behind and what to do about it.
if (VERIFY_FINDINGS > 0) {
  console.log(
    `\n== uninstall INCOMPLETE — ${VERIFY_FINDINGS} item(s) need verification` +
      `${DRY_RUN ? " (DRY_RUN — nothing changed)" : ""} ==`,
  );
  console.log("  Each `verify` line above names what was NOT removed and the remedy for it.");
  // THE MACHINE-READABLE HALF OF THE CONDITIONAL CLAIM (27-21, WR-01) — the same rule and the same
  // code list as install.ts's tail: 0 complete, 1 refused or aborted, 2 bad usage, 3 incomplete.
  // Set on the SAME branch that prints the banner so the two signals cannot diverge. The two
  // banners were written as one rule; applying the exit code to only one half would leave the pair
  // disagreeing.
  process.exit(3);
} else {
  console.log(`\n== uninstall complete${DRY_RUN ? " (DRY_RUN — nothing changed)" : ""} ==`);
}
